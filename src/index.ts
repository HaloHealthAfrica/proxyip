import { config } from "./config/index.js";
import { MarketDataClient } from "./services/providers/index.js";

async function main() {
  console.log("flyip — market data aggregator");

  if (config.marketData.proxyUrl) {
    console.log(
      `MarketData.app proxy: ${new URL(config.marketData.proxyUrl).host}`,
    );
  } else {
    console.log("MarketData.app proxy: disabled (direct connection)");
  }

  const md = new MarketDataClient();

  if (config.marketData.apiKey) {
    const quote = await md.getQuote("AAPL");
    console.log("AAPL quote:", JSON.stringify(quote, null, 2));
  } else {
    console.log("Skipping MarketData request — no API key configured");
  }
}

main().catch(console.error);
