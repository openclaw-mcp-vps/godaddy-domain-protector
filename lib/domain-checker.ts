import { resolveNs } from "dns/promises";

import axios from "axios";
import * as cheerio from "cheerio";

import { buildProxyConfig } from "@/lib/proxy-rotation";

export type DomainStatus = "available" | "registered" | "unknown";

export type RegistrarResult = {
  registrar: string;
  status: DomainStatus;
  detail: string;
};

export type DomainCheckResult = {
  domain: string;
  overall: DomainStatus;
  confidence: number;
  checks: RegistrarResult[];
  checkedAt: string;
};

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
}

async function checkDns(domain: string): Promise<RegistrarResult> {
  try {
    const ns = await resolveNs(domain);
    if (ns.length > 0) {
      return { registrar: "DNS", status: "registered", detail: "Active nameserver records found." };
    }
    return { registrar: "DNS", status: "unknown", detail: "No nameserver records returned." };
  } catch (error) {
    const message = String(error);
    if (message.includes("ENOTFOUND") || message.includes("ENODATA") || message.includes("NXDOMAIN")) {
      return { registrar: "DNS", status: "available", detail: "No DNS registration footprint detected." };
    }
    return { registrar: "DNS", status: "unknown", detail: "DNS lookup failed unexpectedly." };
  }
}

async function checkRdap(domain: string): Promise<RegistrarResult> {
  try {
    const response = await axios.get(`https://rdap.org/domain/${domain}`, {
      timeout: 12000,
      ...buildProxyConfig(),
      validateStatus: () => true
    });

    if (response.status === 404) {
      return { registrar: "RDAP", status: "available", detail: "RDAP returned 404 not found." };
    }
    if (response.status >= 200 && response.status < 300) {
      return { registrar: "RDAP", status: "registered", detail: "RDAP registration record exists." };
    }

    return { registrar: "RDAP", status: "unknown", detail: `RDAP status ${response.status}.` };
  } catch {
    return { registrar: "RDAP", status: "unknown", detail: "RDAP request failed." };
  }
}

function extractGoDaddyAvailability(html: string): DomainStatus {
  const match = html.match(/"isAvailable"\s*:\s*(true|false)/i);
  if (!match) return "unknown";
  return match[1] === "true" ? "available" : "registered";
}

function extractNamecheapAvailability(html: string): DomainStatus {
  const lowered = html.toLowerCase();
  if (lowered.includes("is already taken") || lowered.includes("domain is taken")) {
    return "registered";
  }
  if (lowered.includes("is available") || lowered.includes("great choice")) {
    return "available";
  }
  return "unknown";
}

async function checkGoDaddy(domain: string): Promise<RegistrarResult> {
  try {
    const response = await axios.get("https://www.godaddy.com/domainsearch/find", {
      params: { domainToCheck: domain },
      timeout: 12000,
      ...buildProxyConfig()
    });

    const status = extractGoDaddyAvailability(response.data);
    const detail =
      status === "available"
        ? "GoDaddy storefront indicates available."
        : status === "registered"
          ? "GoDaddy storefront indicates already registered."
          : "GoDaddy storefront response was inconclusive.";

    return { registrar: "GoDaddy", status, detail };
  } catch {
    return { registrar: "GoDaddy", status: "unknown", detail: "GoDaddy storefront probe failed." };
  }
}

async function checkNamecheap(domain: string): Promise<RegistrarResult> {
  try {
    const response = await axios.get("https://www.namecheap.com/domains/registration/results/", {
      params: { domain },
      timeout: 12000,
      ...buildProxyConfig()
    });

    const $ = cheerio.load(response.data);
    const bodyText = $("body").text();
    const status = extractNamecheapAvailability(bodyText);
    const detail =
      status === "available"
        ? "Namecheap storefront indicates available."
        : status === "registered"
          ? "Namecheap storefront indicates already registered."
          : "Namecheap storefront response was inconclusive.";

    return { registrar: "Namecheap", status, detail };
  } catch {
    return { registrar: "Namecheap", status: "unknown", detail: "Namecheap storefront probe failed." };
  }
}

function computeOverall(checks: RegistrarResult[]): { overall: DomainStatus; confidence: number } {
  const availableCount = checks.filter((item) => item.status === "available").length;
  const registeredCount = checks.filter((item) => item.status === "registered").length;
  const decisive = availableCount + registeredCount;

  if (decisive === 0) {
    return { overall: "unknown", confidence: 0 };
  }

  if (availableCount > registeredCount) {
    return { overall: "available", confidence: Math.round((availableCount / decisive) * 100) };
  }

  if (registeredCount > availableCount) {
    return { overall: "registered", confidence: Math.round((registeredCount / decisive) * 100) };
  }

  return { overall: "unknown", confidence: 50 };
}

export async function checkDomain(domainInput: string): Promise<DomainCheckResult> {
  const domain = normalizeDomain(domainInput);

  const checks = await Promise.all([checkDns(domain), checkRdap(domain), checkGoDaddy(domain), checkNamecheap(domain)]);
  const { overall, confidence } = computeOverall(checks);

  return {
    domain,
    overall,
    confidence,
    checks,
    checkedAt: new Date().toISOString()
  };
}

export async function checkDomains(domains: string[]) {
  const sanitized = domains.map(normalizeDomain).filter((item) => item.length > 3).slice(0, 50);
  const results = await Promise.all(sanitized.map((domain) => checkDomain(domain)));
  return results;
}
