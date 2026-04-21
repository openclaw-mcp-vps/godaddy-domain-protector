import { AlertTriangle, CheckCircle2, Clock4, Globe, Network, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { DomainLookupResponse } from "@/lib/types";

interface DomainResultsProps {
  result: DomainLookupResponse | null;
  error: string | null;
  loading: boolean;
}

export function DomainResults({ result, error, loading }: DomainResultsProps) {
  if (loading) {
    return (
      <Card className="mt-6 p-5">
        <div className="flex items-center gap-3 text-sm text-[#b8c7dd]">
          <Clock4 className="size-4 animate-pulse" />
          Running distributed lookup across anonymous proxy routes...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 border-[#61313b] bg-[#1b151a] p-5">
        <div className="flex items-start gap-3 text-[#ffb6c5]">
          <ShieldAlert className="mt-0.5 size-5" />
          <div>
            <p className="text-sm font-semibold">Lookup blocked</p>
            <p className="mt-1 text-sm text-[#ffc6d1]">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="mt-6 p-5">
        <p className="text-sm text-[#9db0cc]">
          Search a domain to see availability, confidence level, and which anonymized route completed the lookup.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8da2bf]">Result</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#f5f9ff]">{result.domain}</h3>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${
            result.available
              ? "bg-[#17321f] text-[#8bf0ad]"
              : "bg-[#3a1a24] text-[#ffb8c8]"
          }`}
        >
          {result.available ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
          {result.available ? "Likely Available" : "Likely Registered"}
        </div>
      </div>

      <p className="mt-4 text-sm text-[#b8c7dd]">{result.explanation}</p>

      <div className="mt-5 grid gap-3 text-sm text-[#c2d0e3] sm:grid-cols-2">
        <div className="rounded-lg border border-[#2a3950] bg-[#101a28] p-3">
          <p className="text-xs uppercase tracking-wide text-[#8da2bf]">Confidence</p>
          <p className="mt-1 font-medium capitalize">{result.confidence}</p>
        </div>
        <div className="rounded-lg border border-[#2a3950] bg-[#101a28] p-3">
          <p className="text-xs uppercase tracking-wide text-[#8da2bf]">Data Source</p>
          <p className="mt-1 font-medium uppercase">{result.source}</p>
        </div>
        <div className="rounded-lg border border-[#2a3950] bg-[#101a28] p-3">
          <p className="text-xs uppercase tracking-wide text-[#8da2bf]">Route Used</p>
          <p className="mt-1 flex items-center gap-2 font-medium">
            <Network className="size-4" />
            {result.route.endpointLabel}
          </p>
        </div>
        <div className="rounded-lg border border-[#2a3950] bg-[#101a28] p-3">
          <p className="text-xs uppercase tracking-wide text-[#8da2bf]">Checked At</p>
          <p className="mt-1 font-medium">{new Date(result.checkedAt).toLocaleString()}</p>
        </div>
      </div>

      {result.registrar ? (
        <p className="mt-4 text-sm text-[#9db0cc]">
          <span className="font-semibold text-[#dce8f8]">Registrar metadata:</span> {result.registrar}
        </p>
      ) : null}

      {result.nameservers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#2a3950] bg-[#101a28] p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#dbe7f8]">
            <Globe className="size-4" />
            Nameservers
          </p>
          <div className="flex flex-wrap gap-2">
            {result.nameservers.map((name) => (
              <span
                key={name}
                className="rounded-full border border-[#2f4360] bg-[#152235] px-3 py-1 font-mono text-xs text-[#b9c9df]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
