import { Hero, BaseAccount } from "types";
import DatabaseInterface from "../interface";

export default class HeroModel extends DatabaseInterface<Hero> {
  constructor() {
    super("hero");
  }

  async create(account: BaseAccount): Promise<Hero> {
    if (account.hero) {
      return account.hero;
    }
    // get first
    try {
      return await this.get(account.id);
    } catch (e) {}
    // create as a fallback
    return this.put({
      id: account.id,
      name: account.name,
    });
  }
}
