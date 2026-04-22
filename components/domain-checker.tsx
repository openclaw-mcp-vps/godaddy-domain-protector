"use client";

import { useMemo, useState } from "react";
import { Download, Shield, ShieldAlert } from "lucide-react";

import { ResultsTable } from "@/components/results-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { DomainLookupResult } from "@/lib/domain-proxy";

function parseDomains(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,\s]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function toCsv(results: DomainLookupResult[]): string {
  const header = "domain,status,confidence,provider,route,response_ms,reason";
  const rows = results.map((result) => {
    const values = [
      result.domain,
      result.status,
      result.confidence.toFixed(2),
      result.providerName,
      result.egressRoute,
      String(result.responseMs),
      result.reason.replaceAll('"', '""')
    ];

    return values.map((value) => `"${value}"`).join(",");
  });

  return [header, ...rows].join("\n");
}

export function DomainChecker() {
  const [domainText, setDomainText] = useState("");
  const [results, setResults] = useState<DomainLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const available = results.filter((entry) => entry.status === "available").length;
    const taken = results.filter((entry) => entry.status === "taken").length;
    const unknown = results.filter((entry) => entry.status === "unknown").length;

    return { available, taken, unknown };
  }, [results]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const domains = parseDomains(domainText);
    if (domains.length === 0) {
      setError("Enter at least one domain to check.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/check-domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ domains })
      });

      if (response.status === 402) {
        setError("Access locked. Activate your account from the pricing page first.");
        setResults([]);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to check domains.");
      }

      const data = (await response.json()) as { results: DomainLookupResult[] };
      setResults(data.results);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (results.length === 0) {
      return;
    }

    const csv = toCsv(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `domain-results-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--brand)]" />
            Anonymous Domain Availability Check
          </CardTitle>
          <CardDescription>
            Lookups are distributed across rotating providers and egress routes to reduce registrar tracking risk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Textarea
              value={domainText}
              onChange={(event) => setDomainText(event.target.value)}
              placeholder="Try: launchpilot.com\nlaunchpilot.io\nlaunchpilot.ai"
              className="min-h-36"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Checking domains..." : "Check availability"}
              </Button>
              <Button type="button" variant="outline" onClick={exportCsv} disabled={results.length === 0}>
                <Download className="mr-1 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </form>
          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {results.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[var(--muted)]">Available</p>
              <p className="text-2xl font-semibold text-emerald-300">{summary.available}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[var(--muted)]">Taken</p>
              <p className="text-2xl font-semibold text-red-300">{summary.taken}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[var(--muted)]">Uncertain</p>
              <p className="text-2xl font-semibold text-amber-300">{summary.unknown}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <ResultsTable results={results} />
    </div>
  );
}
