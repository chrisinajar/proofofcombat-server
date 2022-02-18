import "dotenv/config";

import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import express from "express";
import fs from "fs";
import http from "http";
import https from "https";

import schema from "./schema";
import type { ContextType } from "./schema/context";
import db from "./db";
import { confirm } from "./security";

import { addSocketToServer } from "./socket";

const port = process.env.HTTP_PORT ?? 4000;
const httpsPort = process.env.HTTPS_PORT ?? 4333;
const socketIoPort = process.env.SOCKET_PORT ?? 5000;

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
        app
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

addSocketToServer(socketioHttpsServer);

socketioHttpsServer.listen(socketIoPort, () => {
  console.log(`🚀  Socket ready on ${socketIoPort}`);
});

async function startApolloServer() {
  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginDrainHttpServer({ httpServer: httpsServer }),
    ],

    context: async ({ res, req }): Promise<ContextType> => {
      let token = req.headers.authorization;
      const context: ContextType = { db };

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
    cors: {
      origin: true,
      credentials: true,
    },
  });

  httpServer.listen(port, () => {
    console.log(`🚀  Apollo Server ready on ${port}`);
  });

  httpsServer.listen(httpsPort, () => {
    console.log(`🚀  Apollo Server SSL ready on ${httpsPort}`);
  });
}

startApolloServer();
