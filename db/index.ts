import level from "level-ts";

import AccountModel from "./models/account";
import HeroModel from "./models/hero";
import MonsterInstanceModel from "./models/monster-instance";
import SystemModel from "./models/system";

const databases = {
  account: new AccountModel(),
  hero: new HeroModel(),
  monsterInstances: new MonsterInstanceModel(),
  system: new SystemModel(),
};

export default databases;
