import { config } from "../../config/index.js";

/**
 * Unusual Whales client -- direct connection, no proxy.
 */
export class UnusualWhalesClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.unusualWhales.baseUrl;
    this.apiKey = config.unusualWhales.apiKey;
  }

  async request<T = unknown>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    return (await res.json()) as T;
  }
}
