import { BaseAccount, AccessRole } from "types/graphql";
import DatabaseInterface from "../interface";

import { hash } from "../../hash";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialAccount = Optional<
  BaseAccount,
  "banned" | "nextAllowedAction" | "authVersion"
>;

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

    const maxDelay = 1000 * 60 * 60;
    if (Number(data.nextAllowedAction) - Date.now() > maxDelay) {
      data.nextAllowedAction = `${Date.now() + maxDelay}`;
    }

    // which version of auth this account uses
    data.authVersion = data.authVersion ?? 1;

    // make sure i always have admin
    if (data.name === "chrisinajar") {
      data.access = AccessRole.Admin;
    }

    return data as BaseAccount;
  }
}
