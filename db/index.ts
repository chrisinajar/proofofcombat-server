import level from "level-ts";

import AccountModel from "./models/account";
import HeroModel from "./models/hero";
import MonsterInstanceModel from "./models/monster-instance";

const databases = {
  account: new AccountModel(),
  hero: new HeroModel(),
  monsterInstances: new MonsterInstanceModel(),
};

export default databases;
