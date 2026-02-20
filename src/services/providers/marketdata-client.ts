import { config } from "../../config/index.js";
import type { ProxyAgent } from "undici";

type FetchFn = typeof globalThis.fetch;

let cachedProxyFetch: FetchFn | null = null;

/**
 * Returns a fetch function that routes through the configured HTTP proxy,
 * or falls back to the global fetch when no proxy is set.
 *
 * The ProxyAgent is lazily initialized on the first call and reused for
 * every subsequent request -- zero overhead when MARKETDATA_PROXY_URL is unset.
 */
async function getFetch(): Promise<FetchFn> {
  const proxyUrl = config.marketData.proxyUrl;

  if (!proxyUrl) {
    return globalThis.fetch;
  }

  if (cachedProxyFetch) {
    return cachedProxyFetch;
  }

  const { ProxyAgent } = await import("undici");

  const agent: ProxyAgent = new ProxyAgent(proxyUrl);

  cachedProxyFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(input, {
      ...init,
      // @ts-expect-error -- Node 22+ accepts undici Dispatcher here
      dispatcher: agent,
    });

  console.log(
    `[MarketDataClient] Proxy enabled → ${new URL(proxyUrl).host}`,
  );

  return cachedProxyFetch;
}

export interface MarketDataRequestOptions {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface MarketDataResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

export class MarketDataClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.marketData.baseUrl;
    this.apiKey = config.marketData.apiKey;
  }

  async request<T = unknown>(
    opts: MarketDataRequestOptions,
  ): Promise<MarketDataResponse<T>> {
    const url = new URL(opts.path, this.baseUrl);

    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, value);
      }
    }

    const fetchFn = await getFetch();

    const response = await fetchFn(url.toString(), {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        Accept: "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

    const data = (await response.json()) as T;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  async getQuote(symbol: string): Promise<MarketDataResponse> {
    return this.request({
      path: `/v1/stocks/quotes/${symbol}/`,
    });
  }

  async getCandles(
    symbol: string,
    params: { resolution: string; from: string; to: string },
  ): Promise<MarketDataResponse> {
    return this.request({
      path: `/v1/stocks/candles/${params.resolution}/${symbol}/`,
      params: { from: params.from, to: params.to },
    });
  }

  async getOptionChain(
    symbol: string,
    params?: Record<string, string>,
  ): Promise<MarketDataResponse> {
    return this.request({
      path: `/v1/options/chain/${symbol}/`,
      params,
    });
  }
}
