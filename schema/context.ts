import type { BaseAccount } from "types";
import type DatabaseList from "db";

export type ContextType = {
  auth?: {
    id: string;
  };
  db: DatabaseList;
};

export type AuthorizedContextType = Required<ContextType>;
