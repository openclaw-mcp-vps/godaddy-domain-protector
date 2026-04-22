import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DomainLookupResult } from "@/lib/domain-proxy";

interface ResultsTableProps {
  results: DomainLookupResult[];
}

function statusBadgeVariant(status: DomainLookupResult["status"]): "success" | "danger" | "warning" {
  if (status === "available") {
    return "success";
  }

  if (status === "taken") {
    return "danger";
  }

  return "warning";
}

export function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
      <h3 className="mb-3 text-lg font-semibold">Lookup Results</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{result.domain}</TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(result.status)}>{result.status.toUpperCase()}</Badge>
              </TableCell>
              <TableCell>{Math.round(result.confidence * 100)}%</TableCell>
              <TableCell>{result.providerName}</TableCell>
              <TableCell className="max-w-[200px] truncate text-[var(--muted)]" title={result.egressRoute}>
                {result.egressRoute}
              </TableCell>
              <TableCell>{result.responseMs} ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
