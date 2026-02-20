import "dotenv/config";

export const config = {
  marketData: {
    apiKey: process.env.MARKETDATA_API_KEY ?? "",
    baseUrl: process.env.MARKETDATA_BASE_URL ?? "https://api.marketdata.app",
    proxyUrl: process.env.MARKETDATA_PROXY_URL || undefined,
  },

  twelveData: {
    apiKey: process.env.TWELVEDATA_API_KEY ?? "",
    baseUrl: process.env.TWELVEDATA_BASE_URL ?? "https://api.twelvedata.com",
  },

  unusualWhales: {
    apiKey: process.env.UNUSUAL_WHALES_API_KEY ?? "",
    baseUrl:
      process.env.UNUSUAL_WHALES_BASE_URL ?? "https://api.unusualwhales.com",
  },

  alpaca: {
    apiKey: process.env.ALPACA_API_KEY ?? "",
    apiSecret: process.env.ALPACA_API_SECRET ?? "",
    baseUrl:
      process.env.ALPACA_BASE_URL ?? "https://data.alpaca.markets",
  },

  polygon: {
    apiKey: process.env.POLYGON_API_KEY ?? "",
    baseUrl: process.env.POLYGON_BASE_URL ?? "https://api.polygon.io",
  },
} as const;
