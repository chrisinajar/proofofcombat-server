import "dotenv/config";

import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import express from "express";
import compression from "compression";

import fs from "fs";
import http from "http";
import https from "https";
import cors from "cors";

import schema from "./schema";
import type { BaseContext } from "./schema/context";
import { setPurificationToday } from "./schema/locations/npc-shops";
import db from "./db";
import { confirm } from "./security";

import { addSocketToServer, loadChatCache } from "./socket";
import { createProxyMiddleware } from "http-proxy-middleware";

const port = process.env.HTTP_PORT ?? 8880;
const httpsPort = process.env.HTTPS_PORT ?? 8443;
const socketIoPort = process.env.SOCKET_PORT ?? 2096;

const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "ApolloGraphQL-Client-Name",
    "ApolloGraphQL-Client-Version",
  ],
};

function getHttpsServer(app?: express.Application): http.Server {
  try {
    const privateKey = fs.readFileSync("privatekey.pem");
    const certificate = fs.readFileSync("certificate.pem");

    if (app) {
      return https.createServer(
        {
          key: privateKey,
          cert: certificate,
        },
        app,
      );
    } else {
      return https.createServer({
        key: privateKey,
        cert: certificate,
      });
    }
  } catch (e) {
    if (app) {
      return http.createServer(app);
    } else {
      return http.createServer();
    }
  }
}

const app = express();
const httpServer = http.createServer(app);
const httpsServer = getHttpsServer(app);
const socketioHttpsServer = getHttpsServer();

app.use(compression());
app.use(cors(corsOptions));
export const io = addSocketToServer(socketioHttpsServer);

// Optional local proxy: route /classic/* to an externally running archived server
const classicTarget = process.env.CLASSIC_TARGET;
const classicHttpTarget = process.env.CLASSIC_HTTP_TARGET;
const classicHttpsTarget = process.env.CLASSIC_HTTPS_TARGET;
const classicSocketTarget = process.env.CLASSIC_SOCKET_TARGET;

const hasAnyClassicTarget =
  Boolean(classicTarget) ||
  Boolean(classicHttpTarget) ||
  Boolean(classicHttpsTarget) ||
  Boolean(classicSocketTarget);

if (hasAnyClassicTarget) {
  const insecure = String(process.env.CLASSIC_HTTPS_INSECURE || "").toLowerCase();
  const allowInsecure = insecure === "1" || insecure === "true" || insecure === "yes";
  const tlsServername = process.env.CLASSIC_TLS_SERVERNAME || undefined;

  // Helper to choose classic HTTP/HTTPS target based on request
  const pickHttpHttpsTarget = (req: express.Request) => {
    const forwarded = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
    const isSecure = (req as any).secure || forwarded.includes("https");
    const httpsT = classicHttpsTarget || classicTarget;
    const httpT = classicHttpTarget || classicTarget;
    const chosen = isSecure ? httpsT : httpT;
    return chosen || classicTarget || "";
  };

  // HTTPS Agent for SNI and validation; used for HTTPS targets
  const httpsAgent = new (require("https").Agent)({
    keepAlive: true,
    rejectUnauthorized: !allowInsecure,
    servername: tlsServername,
  });

  // /classic -> classic target (strip prefix). Supports HTTP and HTTPS backends.
  app.use(
    "/classic",
    createProxyMiddleware({
      router: pickHttpHttpsTarget,
      target: classicTarget || classicHttpTarget || classicHttpsTarget || "http://127.0.0.1",
      changeOrigin: true,
      xfwd: true,
      ws: true,
      secure: !allowInsecure,
      pathRewrite: { "^/classic": "" },
      agent: httpsAgent,
      onProxyReq: (proxyReq, req) => {
        if (tlsServername) proxyReq.setHeader("host", tlsServername);
      },
    }),
  );

  // Socket.IO long-polling and upgrades at root '/socket.io/*'
  if (classicSocketTarget || classicTarget) {
    const socketTarget = classicSocketTarget || classicTarget!;
    app.use(
      /^\/socket\.io(\/|$)/,
      createProxyMiddleware({
        target: socketTarget,
        changeOrigin: true,
        xfwd: true,
        ws: true,
        secure: !allowInsecure,
        agent: httpsAgent,
        onProxyReq: (proxyReq) => {
          if (tlsServername) proxyReq.setHeader("host", tlsServername);
        },
        onProxyReqWs: (_proxyReq, _req, _socket, options) => {
          // Ensure Host header matches SNI domain for some backends
          (options.headers as any) = options.headers || {};
          if (tlsServername) (options.headers as any).host = tlsServername;
        },
      }),
    );
    // Also support '/classic/socket.io/*' by rewriting to target '/socket.io/*'
    app.use(
      /^\/classic\/socket\.io(\/|$)/,
      createProxyMiddleware({
        target: socketTarget,
        changeOrigin: true,
        xfwd: true,
        ws: true,
        secure: !allowInsecure,
        agent: httpsAgent,
        pathRewrite: { "^/classic": "" },
        onProxyReq: (proxyReq) => {
          if (tlsServername) proxyReq.setHeader("host", tlsServername);
        },
        onProxyReqWs: (_proxyReq, _req, _socket, options) => {
          (options.headers as any) = options.headers || {};
          if (tlsServername) (options.headers as any).host = tlsServername;
        },
      }),
    );
  }
}

app.get("/external-api/github-ui-release", (req, res) => {
  const auth = req.headers.authorization || "";
  if (process.env.GITHUB_RELEASE_KEY === auth) {
    console.log("🚀 New GitHub UI!");

    setTimeout(() => {
      console.log("🚀🚀🚀 SENDING THE LAUNCH SIGNAL CAPTAIN");
      io.sendGlobalMessage({
        color: "success",
        message:
          "A new version of the UI is available! Refresh your browser to use it! 🚀",
      });
    }, 60000);
  }

  res.sendStatus(200);
});

async function startApolloServer() {
  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  db.start();
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginDrainHttpServer({ httpServer: httpsServer }),
    ],

    context: async ({ res, req }): Promise<BaseContext> => {
      let token = req.headers.authorization;
      let name = req.headers["apollographql-client-name"];
      if (Array.isArray(name)) {
        name = name.join(",");
      }
      let version = req.headers["apollographql-client-version"];
      if (Array.isArray(version)) {
        version = version.join(",");
      }

      const context: BaseContext = {
        db,
        io,
        client: name
          ? {
              name,
              version: version ?? "",
            }
          : null,
      };

      if (token) {
        if (token.toLowerCase().startsWith("bearer ")) {
          token = token.substr(7);
        }

        const data = confirm(token);
        if (data) {
          context.auth = data;
        }
      }

      return context;
    },
  });

  await server.start();

  server.applyMiddleware({
    app,
    cors: corsOptions,
  });

  if (require.main === module) {
    httpServer.listen(port, () => {
      console.log(`🚀  Apollo Server ready on ${port}`);
    });

    httpsServer.listen(httpsPort, () => {
      console.log(`🚀  Apollo Server SSL ready on ${httpsPort}`);
    });
  }
}

if (require.main === module) {
  loadChatCache();
  socketioHttpsServer.listen(socketIoPort, () => {
    console.log(`🚀  Socket ready on ${socketIoPort}`);
  });
  startApolloServer();
  setPurificationToday();
}
