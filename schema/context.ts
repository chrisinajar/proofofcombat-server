import type { BaseAccount } from "types/graphql";
import type DatabaseList from "db";

export type BaseContext = {
  auth?: {
    id: string;
    delay?: string;
  };
  db: DatabaseList;
};
