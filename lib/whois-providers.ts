import axios, { type AxiosProxyConfig } from "axios";
import * as cheerio from "cheerio";

export type DomainStatus = "available" | "taken" | "unknown";

export interface LookupContext {
  timeoutMs: number;
  headers: Record<string, string>;
  proxy?: AxiosProxyConfig;
}

export interface ProviderLookupResult {
  status: DomainStatus;
  confidence: number;
  reason: string;
}

export interface WhoisProvider {
  id: string;
  name: string;
  lookup(domain: string, context: LookupContext): Promise<ProviderLookupResult>;
}

function buildRequestConfig(context: LookupContext) {
  return {
    timeout: context.timeoutMs,
    headers: context.headers,
    proxy: context.proxy,
    validateStatus: () => true
  };
}

const rdapProvider: WhoisProvider = {
  id: "rdap-org",
  name: "RDAP Bootstrap",
  async lookup(domain, context) {
    const response = await axios.get(`https://rdap.org/domain/${domain}`, buildRequestConfig(context));

    if (response.status === 404) {
      return {
        status: "available",
        confidence: 0.95,
        reason: "RDAP returned 404 (domain not registered)."
      };
    }

    if (response.status >= 200 && response.status < 300) {
      return {
        status: "taken",
        confidence: 0.97,
        reason: "RDAP record exists for this domain."
      };
    }

    if (response.status === 429) {
      return {
        status: "unknown",
        confidence: 0.2,
        reason: "RDAP rate limited this request."
      };
    }

    return {
      status: "unknown",
      confidence: 0.3,
      reason: `RDAP returned HTTP ${response.status}.`
    };
  }
};

const cloudflareDnsProvider: WhoisProvider = {
  id: "cloudflare-doh",
  name: "Cloudflare DoH",
  async lookup(domain, context) {
    const response = await axios.get("https://cloudflare-dns.com/dns-query", {
      ...buildRequestConfig(context),
      headers: {
        ...context.headers,
        accept: "application/dns-json"
      },
      params: {
        name: domain,
        type: "NS"
      }
    });

    if (response.status !== 200) {
      return {
        status: "unknown",
        confidence: 0.25,
        reason: `DoH returned HTTP ${response.status}.`
      };
    }

    const data = response.data as { Status?: number; Answer?: Array<unknown> };

    if (data.Status === 3) {
      return {
        status: "available",
        confidence: 0.72,
        reason: "DNS resolver reports NXDOMAIN."
      };
    }

    if (Array.isArray(data.Answer) && data.Answer.length > 0) {
      return {
        status: "taken",
        confidence: 0.78,
        reason: "Domain has active NS records."
      };
    }

    return {
      status: "unknown",
      confidence: 0.35,
      reason: "DNS response did not conclusively indicate availability."
    };
  }
};

const whoisHtmlProvider: WhoisProvider = {
  id: "whois-html",
  name: "WHOIS HTML Mirror",
  async lookup(domain, context) {
    const response = await axios.get(`https://www.whois.com/whois/${domain}`, buildRequestConfig(context));

    if (response.status !== 200 || typeof response.data !== "string") {
      return {
        status: "unknown",
        confidence: 0.2,
        reason: `WHOIS mirror returned HTTP ${response.status}.`
      };
    }

    const $ = cheerio.load(response.data);
    const text = $("body").text().toUpperCase();

    if (
      text.includes("NO MATCH FOR") ||
      text.includes("NOT FOUND") ||
      text.includes("NO DATA FOUND") ||
      text.includes("DOMAIN YOU REQUESTED IS NOT KNOWN")
    ) {
      return {
        status: "available",
        confidence: 0.8,
        reason: "WHOIS mirror reports no registered match."
      };
    }

    if (text.includes("DOMAIN NAME:")) {
      return {
        status: "taken",
        confidence: 0.83,
        reason: "WHOIS mirror contains a registered domain record."
      };
    }

    return {
      status: "unknown",
      confidence: 0.35,
      reason: "WHOIS mirror response was inconclusive."
    };
  }
};

export const WHOIS_PROVIDERS: WhoisProvider[] = [rdapProvider, cloudflareDnsProvider, whoisHtmlProvider];
