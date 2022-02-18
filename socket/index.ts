import { Server, Socket } from "socket.io";
import { createServer, Server as HttpServer } from "http";

import { confirm, ChatTokenData } from "../security";

const port = 4001;

export function addSocketToServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    const data = confirm<ChatTokenData>(token);

    if (data && data.chat) {
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("New socket!");
    socket.on("chat", () => {});
  });
}

export function startSocketServer() {
  const httpServer = createServer();

  addSocketToServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`🚀  Socket ready on ${port}`);
  });
}
