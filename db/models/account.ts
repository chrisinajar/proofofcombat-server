import { BaseAccount } from "types";
import DatabaseInterface from "../interface";

import { hash } from "../../hash";

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
}
