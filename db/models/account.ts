import { BaseAccount } from "types/graphql";
import DatabaseInterface from "../interface";

import { hash } from "../../hash";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialAccount = Optional<BaseAccount, "banned" | "nextAllowedAction">;

export default class AccountModel extends DatabaseInterface<BaseAccount> {
  constructor() {
    super("account");
  }

  cleanName(name: string): string {
    return name.trim().substr(0, 20);
  }
  nameToId(name: string): string {
    return hash(this.cleanName(name).toLowerCase());
  }

  upgrade(data: PartialAccount): BaseAccount {
    data.banned = data.banned ?? false;
    data.nextAllowedAction = data.nextAllowedAction ?? "0";

    return data as BaseAccount;
  }
}
