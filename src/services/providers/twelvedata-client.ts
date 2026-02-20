import { config } from "../../config/index.js";

/**
 * TwelveData client -- direct connection, no proxy.
 */
export class TwelveDataClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.twelveData.baseUrl;
    this.apiKey = config.twelveData.apiKey;
  }

  async request<T = unknown>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set("apikey", this.apiKey);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    return (await res.json()) as T;
  }
}
