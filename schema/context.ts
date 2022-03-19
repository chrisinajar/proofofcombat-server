import type { BaseAccount } from "types/graphql";
import type DatabaseList from "db";
import type { SocketServerAPI } from "../socket";

export type BaseContext = {
  auth?: {
    id: string;
    delay?: string;
  };
  client: null | {
    name: string;
    version: string;
  };
  db: typeof DatabaseList;
  io: SocketServerAPI;
};
