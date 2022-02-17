import level from "level-ts";

import AccountModel from "./models/account";
import HeroModel from "./models/hero";

const databases = {
  account: new AccountModel(),
  hero: new HeroModel(),
};

export default databases;
