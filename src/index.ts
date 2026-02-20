import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { config } from "./config/index.js";

const PORT = Number(process.env.PORT) || 8080;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",").map(s => s.trim()) || ["*"];

function safeHost(raw: string | undefined): string {
  if (!raw) return "disabled";
  try {
    return new URL(raw).host;
  } catch {
    return `invalid (${raw})`;
  }
}

let proxyFetch: typeof globalThis.fetch | null = null;

async function getFetch(): Promise<typeof globalThis.fetch> {
  const proxyUrl = config.marketData.proxyUrl;
  if (!proxyUrl) return globalThis.fetch;
  if (proxyFetch) return proxyFetch;

  try {
    new URL(proxyUrl);
  } catch {
    console.error(`[proxy] MARKETDATA_PROXY_URL is not a valid URL: "${proxyUrl}"`);
    console.error("[proxy] Falling back to direct connection");
    return globalThis.fetch;
  }

  const { ProxyAgent } = await import("undici");
  const agent = new ProxyAgent(proxyUrl);

  proxyFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(input, {
      ...init,
      // @ts-expect-error -- Node 22+ accepts undici Dispatcher
      dispatcher: agent,
    });

  console.log(`[proxy] Enabled → ${safeHost(proxyUrl)}`);
  return proxyFetch;
}

function setCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin || "*";
  const allowed = ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin);
  res.setHeader("Access-Control-Allow-Origin", allowed ? origin : "");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

const server = createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      proxy: safeHost(config.marketData.proxyUrl),
    }));
    return;
  }

  if (!req.url?.startsWith("/v1/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      service: "proxyip",
      usage: "Call any MarketData.app endpoint: https://proxyip.fly.dev/v1/stocks/quotes/AAPL/",
      health: "/health",
    }));
    return;
  }

  try {
    const targetUrl = new URL(req.url, config.marketData.baseUrl);

    const body = await new Promise<Buffer>((resolve) => {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const fetchFn = await getFetch();

    const headers: Record<string, string> = {
      Authorization: `Token ${config.marketData.apiKey}`,
      Accept: "application/json",
    };
    if (body.length > 0) {
      headers["Content-Type"] = req.headers["content-type"] || "application/json";
    }

    const upstream = await fetchFn(targetUrl.toString(), {
      method: req.method || "GET",
      headers,
      body: body.length > 0 ? new Uint8Array(body) : undefined,
    });

    const responseBody = await upstream.text();

    res.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    });
    res.end(responseBody);
  } catch (err) {
    console.error("[relay error]", err);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "proxy relay failed", detail: String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`proxyip relay listening on :${PORT}`);
  console.log(`Forwarding /v1/* → ${config.marketData.baseUrl}`);
  console.log(`Proxy: ${safeHost(config.marketData.proxyUrl)}`);
});
