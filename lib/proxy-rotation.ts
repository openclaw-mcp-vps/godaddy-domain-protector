import type { AxiosRequestConfig } from "axios";
import { getNextProxy } from "rotating-proxy";

let pointer = -1;

function parseProxyList() {
  const proxyList = process.env.PROXY_POOL?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return proxyList && proxyList.length > 0 ? proxyList : [];
}

export function getNextProxyUrl() {
  const proxies = parseProxyList();
  if (proxies.length === 0) return null;

  const next = getNextProxy(proxies, pointer);
  pointer = next.cursor;
  return next.proxy;
}

export function buildProxyConfig(): AxiosRequestConfig {
  const proxyUrl = getNextProxyUrl();
  if (!proxyUrl) {
    return {};
  }

  try {
    const parsed = new URL(proxyUrl);
    return {
      proxy: {
        protocol: parsed.protocol.replace(":", ""),
        host: parsed.hostname,
        port: Number(parsed.port || "80"),
        auth: parsed.username
          ? {
              username: decodeURIComponent(parsed.username),
              password: decodeURIComponent(parsed.password)
            }
          : undefined
      }
    };
  } catch {
    return {};
  }
}
