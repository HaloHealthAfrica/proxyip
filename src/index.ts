import { createServer } from "node:http";
import { config } from "./config/index.js";
import { MarketDataClient } from "./services/providers/index.js";

const PORT = Number(process.env.PORT) || 8080;

const md = new MarketDataClient();

const server = createServer(async (req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        proxy: config.marketData.proxyUrl
          ? new URL(config.marketData.proxyUrl).host
          : "disabled",
      }),
    );
    return;
  }

  if (req.url?.startsWith("/quote/")) {
    const symbol = req.url.slice("/quote/".length).toUpperCase();
    if (!symbol) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "missing symbol" }));
      return;
    }
    try {
      const quote = await md.getQuote(symbol);
      res.writeHead(quote.ok ? 200 : quote.status, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify(quote.data));
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`flyip listening on :${PORT}`);

  if (config.marketData.proxyUrl) {
    console.log(
      `MarketData.app proxy → ${new URL(config.marketData.proxyUrl).host}`,
    );
  } else {
    console.log("MarketData.app proxy: disabled (direct connection)");
  }
});
