import level from "level-ts";

import AccountModel from "./models/account";
import HeroModel from "./models/hero";
import MonsterInstanceModel from "./models/monster-instance";
import SystemModel from "./models/system";
import TradeOfferModel from "./models/trade-offers";

const databases = {
  account: new AccountModel(),
  hero: new HeroModel(),
  monsterInstances: new MonsterInstanceModel(),
  system: new SystemModel(),
  trades: new TradeOfferModel(),
};

export default databases;
