import { Server, Socket } from "socket.io";
import { createServer, Server as HttpServer } from "http";

import { confirm, ChatTokenData } from "../security";

import { getChatCache, addChatMessage } from "./cache";

type ExtendedSocket = Socket & {
  name?: string;
};

let chatIdNumber = 0;

export function addSocketToServer(httpServer: HttpServer) {
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
      next();
    }
  });

  io.on("connection", (socket: ExtendedSocket) => {
    if (!socket.name) {
      return;
    }
    console.log("New socket!", socket.name);
    socket.emit("hello", {
      chat: getChatCache(),
    });
    socket.on("chat", (data, callback) => {
      if (!socket.name) {
        return;
      }
      console.log(socket.name, data);
      const message = {
        id: chatIdNumber++,
        message: data.message.trim(),
        from: socket.name,
      };
      addChatMessage(message);
      socket.broadcast.emit("chat", message);

      callback(message);
    });
  });
}
