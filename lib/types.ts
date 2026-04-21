export type LookupSource = "rdap" | "whois";

export interface ProxyRouteMeta {
  endpointId: string;
  endpointLabel: string;
  kind: "direct" | "proxy";
  attempts: number;
}

export interface DomainLookupResponse {
  domain: string;
  available: boolean;
  source: LookupSource;
  confidence: "high" | "medium" | "low";
  checkedAt: string;
  explanation: string;
  registrar?: string;
  nameservers: string[];
  route: ProxyRouteMeta;
}

export interface DomainCheckError {
  error: string;
}
