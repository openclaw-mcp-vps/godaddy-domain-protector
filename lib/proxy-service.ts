import type { AxiosProxyConfig } from "axios";

export interface ProxyEndpoint {
  id: string;
  label: string;
  kind: "direct" | "proxy";
  url?: string;
  failures: number;
  lastUsedAt: number;
  cooldownUntil: number;
}

interface QueueJob<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

export interface RoutedExecution<T> {
  value: T;
  endpoint: ProxyEndpoint;
  attempts: number;
}

class ProxyService {
  private readonly endpoints: ProxyEndpoint[];
  private readonly queue: QueueJob<any>[] = [];
  private activeJobs = 0;
  private readonly concurrency: number;

  constructor() {
    const configuredEndpoints = this.loadConfiguredEndpoints();
    const directEndpoint: ProxyEndpoint = {
      id: "direct-local",
      label: "Direct network egress",
      kind: "direct",
      failures: 0,
      lastUsedAt: 0,
      cooldownUntil: 0,
    };

    this.endpoints = [directEndpoint, ...configuredEndpoints];
    const parsedConcurrency = Number(process.env.PROXY_LOOKUP_CONCURRENCY ?? "3");
    this.concurrency = Number.isFinite(parsedConcurrency) && parsedConcurrency > 0 ? parsedConcurrency : 3;
  }

  private loadConfiguredEndpoints() {
    const raw = process.env.PROXY_URLS || "";

    if (!raw.trim()) {
      return [];
    }

    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map<ProxyEndpoint>((url, index) => ({
        id: `proxy-${index + 1}`,
        label: `Proxy ${index + 1}`,
        kind: "proxy",
        url,
        failures: 0,
        lastUsedAt: 0,
        cooldownUntil: 0,
      }));
  }

  private sortByPriority(candidates: ProxyEndpoint[]) {
    return [...candidates].sort((a, b) => {
      if (a.cooldownUntil !== b.cooldownUntil) {
        return a.cooldownUntil - b.cooldownUntil;
      }

      if (a.failures !== b.failures) {
        return a.failures - b.failures;
      }

      return a.lastUsedAt - b.lastUsedAt;
    });
  }

  private pickEndpoint(excludedIds: Set<string>) {
    const now = Date.now();
    const candidates = this.endpoints.filter((endpoint) => !excludedIds.has(endpoint.id));
    const available = candidates.filter((endpoint) => endpoint.cooldownUntil <= now);

    if (available.length > 0) {
      return this.sortByPriority(available)[0];
    }

    if (candidates.length > 0) {
      return this.sortByPriority(candidates)[0];
    }

    return null;
  }

  private recordSuccess(endpoint: ProxyEndpoint) {
    endpoint.failures = 0;
    endpoint.lastUsedAt = Date.now();
    endpoint.cooldownUntil = 0;
  }

  private recordFailure(endpoint: ProxyEndpoint) {
    endpoint.failures += 1;
    endpoint.lastUsedAt = Date.now();
    const cooldownMs = Math.min(30_000, endpoint.failures * 6_000);
    endpoint.cooldownUntil = Date.now() + cooldownMs;
  }

  private drainQueue() {
    while (this.activeJobs < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        continue;
      }

      this.activeJobs += 1;
      void job
        .run()
        .then(job.resolve)
        .catch(job.reject)
        .finally(() => {
          this.activeJobs -= 1;
          this.drainQueue();
        });
    }
  }

  private enqueue<T>(run: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        run,
        resolve,
        reject,
      });

      this.drainQueue();
    });
  }

  async runWithEndpoint<T>(
    lookup: (endpoint: ProxyEndpoint, attempt: number) => Promise<T>,
  ): Promise<RoutedExecution<T>> {
    return this.enqueue(async () => {
      const attempted = new Set<string>();
      let attempt = 0;
      let lastError: unknown = new Error("No proxy endpoint available");

      while (attempt < this.endpoints.length) {
        const endpoint = this.pickEndpoint(attempted);

        if (!endpoint) {
          break;
        }

        attempt += 1;
        attempted.add(endpoint.id);

        try {
          const value = await lookup(endpoint, attempt);
          this.recordSuccess(endpoint);

          return {
            value,
            endpoint,
            attempts: attempt,
          };
        } catch (error) {
          this.recordFailure(endpoint);
          lastError = error;
        }
      }

      throw lastError;
    });
  }
}

export function toAxiosProxyConfig(endpoint: ProxyEndpoint): AxiosProxyConfig | false {
  if (endpoint.kind !== "proxy" || !endpoint.url) {
    return false;
  }

  try {
    const url = new URL(endpoint.url);

    return {
      protocol: url.protocol.replace(":", ""),
      host: url.hostname,
      port: Number(url.port || (url.protocol === "https:" ? "443" : "80")),
      auth:
        url.username || url.password
          ? {
              username: decodeURIComponent(url.username),
              password: decodeURIComponent(url.password),
            }
          : undefined,
    };
  } catch {
    return false;
  }
}

export const proxyService = new ProxyService();
