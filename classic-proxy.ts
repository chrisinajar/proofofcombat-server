import type { RequestHandler } from "express";
import http from "http";
import https from "https";
import type { Server as HttpServer } from "http";
import type { Server as HttpsServer } from "https";
import type { Socket } from "net";
import { URL } from "url";

export function createClassicProxy(target: string): RequestHandler {
  const targetUrl = new URL(target);
  const isHttps = targetUrl.protocol === "https:";

  const agent = isHttps ? new https.Agent({ keepAlive: true }) : new http.Agent({ keepAlive: true });

  return (req, res) => {
    // req.url is already stripped of the mount path ("/classic") when using app.use("/classic", ...)
    const path = `${targetUrl.pathname?.replace(/\/$/, "") || ""}${req.url}` || "/";

    // X-Forwarded-* headers for the upstream
    const xfHost = req.headers["x-forwarded-host"] || req.headers.host || "";
    const xfProto = req.headers["x-forwarded-proto"] || (req as any).secure ? "https" : "http";

    const headers: http.OutgoingHttpHeaders = {
      ...req.headers,
      host: targetUrl.host,
      "x-forwarded-host": Array.isArray(xfHost) ? xfHost.join(",") : xfHost,
      "x-forwarded-proto": Array.isArray(xfProto) ? xfProto.join(",") : xfProto,
      "x-forwarded-for": req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    };

    // Content-Length is managed by Node when we stream; avoid inconsistencies
    delete headers["content-length"];

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

    proxyReq.on("error", (err) => {
      // Surface a concise proxy error without leaking internals
      if (!res.headersSent) {
        res.statusCode = 502;
      }
      res.end("Proxy error");
    });

    // Stream the incoming request body to the upstream
    req.pipe(proxyReq, { end: true });
  };
}

export function attachClassicUpgradeProxy(
  server: HttpServer | HttpsServer,
  target: string,
): void {
  const targetUrl = new URL(target);
  const isHttps = targetUrl.protocol === "https:";

  server.on("upgrade", (req: http.IncomingMessage, socket: Socket, head: Buffer) => {
    const url = req.url || "/";
    if (!url.startsWith("/classic")) {
      // Not ours — ignore so other listeners (if any) can handle it
      return;
    }

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
      // Send switching protocols response to client
      const headerLines: string[] = [];
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (typeof v === "undefined") continue;
        if (Array.isArray(v)) {
          headerLines.push(`${k}: ${v.join(", ")}`);
        } else {
          headerLines.push(`${k}: ${v}`);
        }
      }
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n${headerLines.join("\r\n")}\r\n\r\n`,
      );

      // Forward any buffered data
      if (head && head.length) proxySocket.write(head);
      if (proxyHead && proxyHead.length) socket.write(proxyHead);

      // Bi-directional piping
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
      try {
        socket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
      } catch {}
      socket.destroy();
    });

    proxyReq.end();
  });
}
