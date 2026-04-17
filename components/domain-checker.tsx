"use client";

import { useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DomainResults } from "@/components/domain-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DomainCheckResult } from "@/lib/domain-checker";

const schema = z.object({
  domains: z
    .string()
    .min(3, "Enter at least one domain.")
    .refine((value) => value.split(/\s|,|\n/).filter(Boolean).length <= 50, "Maximum 50 domains per request.")
});

type FormValues = z.infer<typeof schema>;

export function DomainChecker() {
  const [results, setResults] = useState<DomainCheckResult[]>([]);
  const [error, setError] = useState<string>("");
  const [watchDomains, setWatchDomains] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const seenAlerts = useRef<Set<string>>(new Set());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      domains: ""
    }
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    setError("");

    const domains = values.domains
      .split(/\s|,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/check-domains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domains })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Failed to check domains.");
      return;
    }

    setResults(payload.results);
  }

  function parseDomains(raw: string) {
    return raw
      .split(/\s|,|\n/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 50);
  }

  function startAlerts() {
    const parsed = parseDomains(form.getValues("domains"));
    if (parsed.length === 0) {
      setError("Add domains before enabling alerts.");
      return;
    }

    setWatchDomains(parsed);
    setError("");

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }

  useEffect(() => {
    if (watchDomains.length === 0) return;

    const runPoll = async () => {
      const response = await fetch("/api/check-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: watchDomains })
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const polled: DomainCheckResult[] = payload.results || [];
      const newlyAvailable = polled.filter((item) => item.overall === "available" && !seenAlerts.current.has(item.domain));

      if (newlyAvailable.length === 0) {
        return;
      }

      newlyAvailable.forEach((item) => seenAlerts.current.add(item.domain));
      setAlerts((current) => [
        ...newlyAvailable.map((item) => `${item.domain} is now marked available (${item.confidence}% confidence).`),
        ...current
      ]);

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        newlyAvailable.forEach((item) => {
          new Notification("Domain alert", {
            body: `${item.domain} now appears available.`
          });
        });
      }
    };

    void runPoll();
    const id = window.setInterval(() => void runPoll(), 300000);
    return () => window.clearInterval(id);
  }, [watchDomains]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-2xl">Private batch domain check</CardTitle>
          <CardDescription>
            Queries DNS, RDAP, GoDaddy, and Namecheap concurrently from server-side requests with optional rotating proxies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <textarea
              className="min-h-40 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              placeholder="mybrand.com\nmybrand.ai\nmybrand.io"
              {...form.register("domains")}
            />
            {form.formState.errors.domains && <p className="text-sm text-rose-300">{form.formState.errors.domains.message}</p>}
            {error && (
              <p className="flex items-center gap-2 text-sm text-rose-300">
                <ShieldAlert className="h-4 w-4" />
                {error}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Check domains now
              </Button>
              <Button type="button" variant="outline" onClick={startAlerts}>
                Enable availability alerts
              </Button>
              <p className="text-xs text-slate-400">Use commas, spaces, or new lines. Up to 50 domains per run.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-emerald-700/40 bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Availability Alerts</CardTitle>
            <CardDescription>Watchlist checks run every 5 minutes while this page is open.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 8).map((message) => (
              <p key={message} className="text-sm text-emerald-200">
                {message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <DomainResults results={results} />
    </div>
  );
}
