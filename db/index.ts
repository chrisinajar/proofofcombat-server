import level from "level-ts";

import AccountModel from "./models/account";
import HeroModel from "./models/hero";
import MonsterInstanceModel from "./models/monster-instance";
import SystemModel from "./models/system";
import TradeOfferModel from "./models/trade-offers";
import PlayerLocationModel from "./models/player-location";

const databases = {
  account: new AccountModel(),
  hero: new HeroModel(),
  monsterInstances: new MonsterInstanceModel(),
  system: new SystemModel(),
  trades: new TradeOfferModel(),
  playerLocation: new PlayerLocationModel(),
};

export default databases;
