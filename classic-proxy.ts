import type { RequestHandler } from "express";
import http from "http";
import https from "https";
import type { Server as HttpServer } from "http";
import type { Server as HttpsServer } from "https";
import type { Socket } from "net";
import { URL } from "url";

type ClassicTargets = string | { http?: string; https?: string };

function pickTargetUrl(targets: ClassicTargets, isSecure: boolean): URL {
  if (typeof targets === "string") return new URL(targets);
  const chosen = isSecure ? targets.https || targets.http : targets.http || targets.https;
  if (!chosen) throw new Error("No classic proxy target configured");
  return new URL(chosen);
}

export function createClassicProxy(targets: ClassicTargets): RequestHandler {
  return (req, res) => {
    const isSecure = Boolean((req.socket as any).encrypted) ||
      String(req.headers["x-forwarded-proto"] || "").toLowerCase().includes("https");

    const targetUrl = pickTargetUrl(targets, isSecure);
    const isHttps = targetUrl.protocol === "https:";
    const agent = isHttps ? new https.Agent({ keepAlive: true }) : new http.Agent({ keepAlive: true });

    // req.url is already stripped of the mount path ("/classic") when using app.use("/classic", ...)
    const path = `${targetUrl.pathname?.replace(/\/$/, "") || ""}${req.url}` || "/";

    // X-Forwarded-* headers for the upstream
    const xfHost = req.headers["x-forwarded-host"] || req.headers.host || "";
    const xfProtoVal = ((): string => {
      const h = req.headers["x-forwarded-proto"]; // could be string|string[]
      if (Array.isArray(h)) return h.join(",");
      return h ? String(h) : isSecure ? "https" : "http";
    })();

    const headers: http.OutgoingHttpHeaders = {
      ...req.headers,
      host: targetUrl.host,
      "x-forwarded-host": Array.isArray(xfHost) ? xfHost.join(",") : xfHost,
      "x-forwarded-proto": xfProtoVal,
      "x-forwarded-for": req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    };

    // Content-Length is managed by Node when we stream; avoid inconsistencies
    delete (headers as any)["content-length"];

    const options: https.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      method: req.method,
      path,
      headers,
      agent,
    };

    const proxyReq = (isHttps ? https : http).request(options, (proxyRes) => {
      // Optional: rewrite Location headers pointing to the target origin back under /classic
      const responseHeaders = { ...proxyRes.headers } as Record<string, string | string[] | undefined>;
      const location = responseHeaders["location"];
      if (location) {
        const targetOrigin = `${targetUrl.protocol}//${targetUrl.host}`;
        const rewrite = (v: string) => (v.startsWith(targetOrigin) ? v.replace(targetOrigin, "/classic") : v);
        if (Array.isArray(location)) {
          responseHeaders["location"] = location.map(rewrite);
        } else {
          responseHeaders["location"] = rewrite(location as string);
        }
      }

      res.writeHead(proxyRes.statusCode || 502, responseHeaders as http.OutgoingHttpHeaders);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", () => {
      if (!res.headersSent) res.statusCode = 502;
      res.end("Proxy error");
    });

    // Stream the incoming request body to the upstream
    req.pipe(proxyReq, { end: true });
  };
}

type UpgradeTargets = string | { http?: string; https?: string; socket?: string };

function pickUpgradeTarget(targets: UpgradeTargets, isSecure: boolean, isSocketIo: boolean): URL {
  if (typeof targets === "string") return new URL(targets);
  if (isSocketIo && targets.socket) return new URL(targets.socket);
  const chosen = isSecure ? targets.https || targets.http : targets.http || targets.https;
  if (!chosen) throw new Error("No classic upgrade proxy target configured");
  return new URL(chosen);
}

export function attachClassicUpgradeProxy(
  server: HttpServer | HttpsServer,
  targets: UpgradeTargets,
): void {
  server.on("upgrade", (req: http.IncomingMessage, socket: Socket, head: Buffer) => {
    const url = req.url || "/";
    if (!url.startsWith("/classic")) {
      return;
    }

    const isSecure = Boolean((req.socket as any).encrypted) ||
      String(req.headers["x-forwarded-proto"] || "").toLowerCase().includes("https");
    const isSocketIo = /\/socket\.io\//.test(url);

    const targetUrl = pickUpgradeTarget(targets, isSecure, isSocketIo);
    const isHttps = targetUrl.protocol === "https:";

    const path = url === "/classic" ? "/" : url.replace(/^\/classic/, "");

    const headers = {
      ...req.headers,
      host: targetUrl.host,
      connection: "upgrade",
      upgrade: "websocket",
    } as http.OutgoingHttpHeaders;

    const options: https.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      method: req.method || "GET",
      path,
      headers,
    };

    const proxyReq = (isHttps ? https : http).request(options);

    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      const headerLines: string[] = [];
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (typeof v === "undefined") continue;
        if (Array.isArray(v)) headerLines.push(`${k}: ${v.join(", ")}`);
        else headerLines.push(`${k}: ${v}`);
      }
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n${headerLines.join("\r\n")}\r\n\r\n`);

      if (head && head.length) proxySocket.write(head);
      if (proxyHead && proxyHead.length) socket.write(proxyHead);

      proxySocket.pipe(socket).pipe(proxySocket);

      const destroyBoth = () => {
        try { proxySocket.destroy(); } catch {}
        try { socket.destroy(); } catch {}
      };
      proxySocket.on("error", destroyBoth);
      socket.on("error", destroyBoth);
      proxySocket.on("close", () => socket.end());
      socket.on("close", () => proxySocket.end());
    });

    proxyReq.on("error", () => {
      try { socket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n"); } catch {}
      socket.destroy();
    });

    proxyReq.end();
  });
}
