import { mergeTypeDefs } from "@graphql-tools/merge";

import interfaces from "./interfaces";
import directives from "./directives/type";
import accountTypes from "./account/type";
import heroTypes from "./hero/type";
import monsterTypes from "./monster/type";
import questsTypes from "./quests/type";
import locationsTypes from "./locations/type";
import itemsTypes from "./items/type";
import adminTypes from "./admin/type";

export default mergeTypeDefs([
  directives,
  interfaces,
  accountTypes,
  heroTypes,
  monsterTypes,
  questsTypes,
  locationsTypes,
  itemsTypes,
  adminTypes,
]);
