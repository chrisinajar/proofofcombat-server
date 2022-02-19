import type { BaseAccount } from "types";
import type DatabaseList from "db";

export type BaseContext = {
  auth?: {
    id: string;
    delay?: string;
  };
  db: DatabaseList;
};
