import { randomUUID } from "node:crypto";

import type { AxiosProxyConfig } from "axios";
import cron from "node-cron";
import Redis from "ioredis";

import { WHOIS_PROVIDERS, type DomainStatus, type ProviderLookupResult, type WhoisProvider } from "@/lib/whois-providers";

export interface DomainLookupResult {
  id: string;
  domain: string;
  status: DomainStatus;
  confidence: number;
  providerId: string;
  providerName: string;
  reason: string;
  egressRoute: string;
  responseMs: number;
  checkedAt: string;
}

interface QueueTask<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

class LookupQueue {
  private readonly concurrency: number;
  private active = 0;
  private readonly tasks: QueueTask<DomainLookupResult>[] = [];

  constructor(concurrency: number) {
    this.concurrency = Math.max(1, concurrency);
  }

  enqueue(task: () => Promise<DomainLookupResult>): Promise<DomainLookupResult> {
    return new Promise<DomainLookupResult>((resolve, reject) => {
      this.tasks.push({ run: task, resolve, reject });
      this.process();
    });
  }

  private process(): void {
    while (this.active < this.concurrency && this.tasks.length > 0) {
      const nextTask = this.tasks.shift();
      if (!nextTask) {
        return;
      }

      this.active += 1;
      nextTask
        .run()
        .then(nextTask.resolve)
        .catch(nextTask.reject)
        .finally(() => {
          this.active -= 1;
          this.process();
        });
    }
  }
}

interface ResolvedProxy {
  label: string;
  config?: AxiosProxyConfig;
}

function normalizeDomain(rawDomain: string): string {
  return rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.+$/, "");
}

function isValidDomain(domain: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(domain);
}

function randomIPv4(): string {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return `${octet()}.${octet()}.${octet()}.${octet()}`;
}

function parseProxyUrl(urlValue: string): ResolvedProxy {
  try {
    const parsed = new URL(urlValue);
    const port = Number.parseInt(parsed.port || (parsed.protocol === "https:" ? "443" : "80"), 10);
    const authUser = parsed.username ? decodeURIComponent(parsed.username) : undefined;
    const authPass = parsed.password ? decodeURIComponent(parsed.password) : undefined;

    return {
      label: parsed.host,
      config: {
        protocol: parsed.protocol.replace(":", ""),
        host: parsed.hostname,
        port,
        ...(authUser
          ? {
              auth: {
                username: authUser,
                password: authPass ?? ""
              }
            }
          : {})
      }
    };
  } catch {
    return { label: "direct" };
  }
}

export class DomainProxyService {
  private readonly queue: LookupQueue;
  private readonly providers: WhoisProvider[];
  private readonly proxies: ResolvedProxy[];
  private readonly redis: Redis | null;

  private providerCursor = 0;
  private proxyCursor = 0;

  constructor() {
    this.queue = new LookupQueue(Number.parseInt(process.env.LOOKUP_CONCURRENCY ?? "4", 10));
    this.providers = WHOIS_PROVIDERS;

    const configuredProxyUrls = (process.env.LOOKUP_PROXY_URLS ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    this.proxies = configuredProxyUrls.map(parseProxyUrl);

    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false
      });

      this.redis.connect().catch(() => {
        // If Redis is unavailable, domain checks still run with in-memory queue only.
      });

      cron.schedule("0 */6 * * *", () => {
        this.redis
          ?.del("lookup:metrics:last6h")
          .catch(() => {
            // Metrics cleanup is best-effort.
          });
      });
    } else {
      this.redis = null;
    }
  }

  async checkDomains(rawDomains: string[]): Promise<DomainLookupResult[]> {
    const domains = Array.from(new Set(rawDomains.map(normalizeDomain).filter(isValidDomain))).slice(0, 100);

    const tasks = domains.map((domain) => this.queue.enqueue(() => this.lookupDomain(domain)));
    return Promise.all(tasks);
  }

  private nextProviders(): WhoisProvider[] {
    const providers = this.providers;

    if (providers.length < 2) {
      return providers;
    }

    const rotated = providers.map((_, index) => providers[(this.providerCursor + index) % providers.length]);
    this.providerCursor = (this.providerCursor + 1) % providers.length;
    return rotated;
  }

  private nextProxy(): ResolvedProxy {
    if (this.proxies.length === 0) {
      return {
        label: `direct:${randomIPv4()}`
      };
    }

    const selected = this.proxies[this.proxyCursor % this.proxies.length];
    this.proxyCursor = (this.proxyCursor + 1) % this.proxies.length;
    return selected;
  }

  private async lookupDomain(domain: string): Promise<DomainLookupResult> {
    const providers = this.nextProviders();
    const proxy = this.nextProxy();

    let bestUnknown: DomainLookupResult | null = null;

    for (const provider of providers) {
      const startedAt = Date.now();
      let providerResult: ProviderLookupResult;

      try {
        providerResult = await provider.lookup(domain, {
          timeoutMs: Number.parseInt(process.env.LOOKUP_TIMEOUT_MS ?? "6000", 10),
          proxy: proxy.config,
          headers: {
            "x-forwarded-for": randomIPv4(),
            "x-lookup-agent": "godaddy-domain-protector/1.0",
            "user-agent": "Mozilla/5.0 (compatible; DomainSafetyBot/1.0; +https://domainprotector.local)"
          }
        });
      } catch (error) {
        providerResult = {
          status: "unknown",
          confidence: 0.1,
          reason: error instanceof Error ? error.message : "Lookup provider failed"
        };
      }

      const result: DomainLookupResult = {
        id: randomUUID(),
        domain,
        status: providerResult.status,
        confidence: providerResult.confidence,
        providerId: provider.id,
        providerName: provider.name,
        reason: providerResult.reason,
        egressRoute: proxy.label,
        responseMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString()
      };

      if (providerResult.status !== "unknown") {
        await this.trackMetrics(result.status);
        return result;
      }

      if (!bestUnknown || providerResult.confidence > bestUnknown.confidence) {
        bestUnknown = result;
      }
    }

    await this.trackMetrics("unknown");
    return (
      bestUnknown ?? {
        id: randomUUID(),
        domain,
        status: "unknown",
        confidence: 0,
        providerId: "none",
        providerName: "No Providers",
        reason: "No provider could complete this lookup.",
        egressRoute: proxy.label,
        responseMs: 0,
        checkedAt: new Date().toISOString()
      }
    );
  }

  private async trackMetrics(status: DomainStatus): Promise<void> {
    if (!this.redis) {
      return;
    }

    const nowBucket = new Date().toISOString().slice(0, 13);
    const key = `lookup:metrics:${nowBucket}`;

    await this.redis
      .multi()
      .hincrby(key, "total", 1)
      .hincrby(key, status, 1)
      .expire(key, 60 * 60 * 24)
      .hincrby("lookup:metrics:last6h", status, 1)
      .expire("lookup:metrics:last6h", 60 * 60 * 6)
      .exec()
      .catch(() => {
        // Metrics should not block lookup execution.
      });
  }
}

let singleton: DomainProxyService | null = null;

export function getDomainProxyService(): DomainProxyService {
  if (!singleton) {
    singleton = new DomainProxyService();
  }

  return singleton;
}
