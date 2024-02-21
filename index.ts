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
import db from "./db";
import { confirm } from "./security";

import { addSocketToServer, loadChatCache } from "./socket";

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
}
