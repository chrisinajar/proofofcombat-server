import { Server, Socket } from "socket.io";
import { createServer } from "http";

import { confirm, ChatTokenData } from "../security";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
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

const port = 5000;

httpServer.listen(port, () => {
  console.log(`🚀  Socket ready on ${port}`);
});
