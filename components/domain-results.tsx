import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DomainCheckResult } from "@/lib/domain-checker";

type DomainResultsProps = {
  results: DomainCheckResult[];
};

function getBadgeStyle(overall: DomainCheckResult["overall"]) {
  if (overall === "available") return "border-emerald-500/60 bg-emerald-500/15 text-emerald-300";
  if (overall === "registered") return "border-rose-500/60 bg-rose-500/15 text-rose-300";
  return "border-amber-500/60 bg-amber-500/15 text-amber-300";
}

export function DomainResults({ results }: DomainResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {results.map((result) => (
        <Card key={result.domain} className="border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg tracking-tight">{result.domain}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getBadgeStyle(result.overall)}>{result.overall.toUpperCase()}</Badge>
              <span className="text-xs text-slate-400">Confidence {result.confidence}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.checks.map((check) => (
              <div key={`${result.domain}-${check.registrar}`} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-200">{check.registrar}</span>
                <span className="text-slate-400">{check.detail}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-slate-500">Checked at {new Date(result.checkedAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
