import { Quest } from "types/graphql";
import { getQuestDescription } from "./quest-descriptions";

describe("getQuestDescription", () => {
  const allQuests = Object.values(Quest);

  it.each(allQuests)(
    "returns a non-empty description for Quest.%s",
    (quest) => {
      const description = getQuestDescription(quest);
      expect(description).toBeTruthy();
    },
  );
});
