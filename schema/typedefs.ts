import { mergeTypeDefs } from "@graphql-tools/merge";

import accountTypes from "./account/type";
import heroTypes from "./hero/type";

export default mergeTypeDefs([accountTypes, heroTypes]);
