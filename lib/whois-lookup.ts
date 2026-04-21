import "server-only";

import axios from "axios";
import whois from "node-whois";

import { proxyService, toAxiosProxyConfig } from "@/lib/proxy-service";
import type { DomainLookupResponse } from "@/lib/types";

interface WhoisSnapshot {
  rawText: string;
  available: boolean;
  registrar?: string;
  nameservers: string[];
}

const AVAILABLE_PATTERNS = [
  /no match for/i,
  /not found/i,
  /no data found/i,
  /status:\s*available/i,
  /domain you requested is not known/i,
  /is free/i,
  /available for registration/i,
];

const REGISTERED_PATTERNS = [/domain status:/i, /created on:/i, /registrar:/i, /name server:/i];

function sanitizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function parseWhoisSnapshot(rawText: string): WhoisSnapshot {
  const available = AVAILABLE_PATTERNS.some((pattern) => pattern.test(rawText));
  const looksRegistered = REGISTERED_PATTERNS.some((pattern) => pattern.test(rawText));

  const registrarMatch = rawText.match(/^Registrar:\s*(.+)$/im);

  const nameserverMatches = [...rawText.matchAll(/^Name Server:\s*(.+)$/gim)].map((item) =>
    item[1]?.trim().toLowerCase(),
  );

  return {
    rawText,
    available: available && !looksRegistered,
    registrar: registrarMatch?.[1]?.trim(),
    nameservers: Array.from(new Set(nameserverMatches.filter(Boolean) as string[])),
  };
}

async function queryRdap(domain: string, proxyConfig: ReturnType<typeof toAxiosProxyConfig>) {
  const response = await axios.get(`https://rdap.org/domain/${domain}`, {
    timeout: 10_000,
    proxy: proxyConfig,
    validateStatus: (status) => status === 200 || status === 404,
    headers: {
      "user-agent": "godaddy-domain-protector/1.0",
      accept: "application/json",
    },
  });

  if (response.status === 404) {
    return {
      available: true,
      registrar: undefined,
      nameservers: [] as string[],
      source: "rdap" as const,
      confidence: "high" as const,
      explanation:
        "RDAP returned 404 (domain not found), which typically indicates the domain is available for registration.",
    };
  }

  const data = response.data as Record<string, unknown>;

  const entities = (data.entities as Array<Record<string, unknown>> | undefined) ?? [];
  const registrarEntity = entities.find((entity) => {
    const roles = entity.roles;
    return Array.isArray(roles) && roles.includes("registrar");
  });

  const registrarName = Array.isArray(registrarEntity?.vcardArray)
    ? JSON.stringify(registrarEntity?.vcardArray)
    : undefined;

  const nameservers = ((data.nameservers as Array<Record<string, unknown>> | undefined) ?? [])
    .map((item) => (typeof item.ldhName === "string" ? item.ldhName.toLowerCase() : null))
    .filter((item): item is string => Boolean(item));

  return {
    available: false,
    registrar: registrarName,
    nameservers,
    source: "rdap" as const,
    confidence: "high" as const,
    explanation:
      "RDAP returned an active registration record, indicating this domain is already registered.",
  };
}

function runWhoisLookup(domain: string) {
  return new Promise<WhoisSnapshot>((resolve, reject) => {
    whois.lookup(domain, { timeout: 8_000, follow: 1, verbose: false }, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(parseWhoisSnapshot(String(data ?? "")));
    });
  });
}

export async function checkDomainAvailability(domainInput: string): Promise<DomainLookupResponse> {
  const domain = sanitizeDomain(domainInput);

  const routed = await proxyService.runWithEndpoint(async (endpoint) => {
    const proxyConfig = toAxiosProxyConfig(endpoint);

    try {
      return await queryRdap(domain, proxyConfig);
    } catch {
      const whoisResult = await runWhoisLookup(domain);

      return {
        available: whoisResult.available,
        registrar: whoisResult.registrar,
        nameservers: whoisResult.nameservers,
        source: "whois" as const,
        confidence: whoisResult.rawText.length > 0 ? "medium" as const : "low" as const,
        explanation: whoisResult.available
          ? "WHOIS registry text indicates no active registration match for this domain."
          : "WHOIS registry text includes registration markers such as status, registrar, or nameservers.",
      };
    }
  });

  return {
    domain,
    available: routed.value.available,
    source: routed.value.source,
    confidence: routed.value.confidence,
    checkedAt: new Date().toISOString(),
    explanation: routed.value.explanation,
    registrar: routed.value.registrar,
    nameservers: routed.value.nameservers,
    route: {
      endpointId: routed.endpoint.id,
      endpointLabel: routed.endpoint.label,
      kind: routed.endpoint.kind,
      attempts: routed.attempts,
    },
  };
}
