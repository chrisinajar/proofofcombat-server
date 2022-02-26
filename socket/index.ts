import { Server, Socket } from "socket.io";
import { createServer, Server as HttpServer } from "http";

import { ChatMessage } from "../db/models/system";
import { confirm, ChatTokenData } from "../security";

import { getChatCache, addChatMessage } from "./cache";

type ExtendedSocket = Socket & {
  name?: string;
  heroId?: string;
};

type SystemMessage = {
  color: "success" | "primary" | "secondary" | "error";
  message: string;
};

type SocketServerAPI = {
  io: Server;
  sendGlobalMessage: (message: SystemMessage) => void;
};

export function addSocketToServer(httpServer: HttpServer): SocketServerAPI {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization"],
      credentials: true,
    },
  });

  io.use((socket: ExtendedSocket, next) => {
    const token = socket.handshake.auth.token;

    const data = confirm<ChatTokenData>(token);

    if (data && data.chat) {
      socket.name = data.name;
      socket.heroId = data.id;
      next();
    }
  });

  io.on("connection", (socket: ExtendedSocket) => {
    if (!socket.name) {
      return;
    }
    console.log(socket.name, "join the game");

    socket.join("public");

    socket.on("disconnect", (reason) => {
      console.log(socket.name, "left the game");
      listClients();
    });
    socket.on("chat", async (data, callback) => {
      if (!socket.name) {
        return;
      }
      console.log(socket.name, data.message);
      const message = await addChatMessage({
        message: data.message.trim(),
        from: socket.name,
      });
      socket.broadcast.emit("chat", message);

      callback(message);
    });

    socket.emit("hello", {
      chat: getChatCache(),
    });

    listClients();
  });

  function listClients() {
    io.sockets.sockets.forEach((socket: ExtendedSocket, id: string) => {
      console.log(" *", socket.name);
    });
  }

  function sendGlobalMessage(message: SystemMessage) {
    io.emit("system-message", message);
  }

  return { io, sendGlobalMessage };
}
