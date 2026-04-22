"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AccessActivation() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onActivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to activate access");
      }

      setStatus("Access activated. Open the dashboard to run anonymous checks.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Activation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <KeyRound className="h-5 w-5 text-[var(--brand-strong)]" />
          Activate Access
        </CardTitle>
        <CardDescription>
          After checkout, enter the same email used in Stripe to claim your secure dashboard cookie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onActivate}>
          <Input
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying purchase..." : "Activate my access"}
          </Button>
        </form>
        {status ? <p className="mt-3 text-sm text-[var(--muted)]">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
