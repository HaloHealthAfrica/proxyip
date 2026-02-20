import { config } from "../../config/index.js";

/**
 * Alpaca client -- direct connection, no proxy.
 */
export class AlpacaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.baseUrl = config.alpaca.baseUrl;
    this.apiKey = config.alpaca.apiKey;
    this.apiSecret = config.alpaca.apiSecret;
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
        "APCA-API-KEY-ID": this.apiKey,
        "APCA-API-SECRET-KEY": this.apiSecret,
        Accept: "application/json",
      },
    });

    return (await res.json()) as T;
  }
}
