import { Quest } from "types/graphql";

const Descriptions: { [x in Quest]?: string } = {
  [Quest.WashedUp]:
    "You were out on the water and you're not sure what happened. You woke up days later on a beach, barely alive. Maybe the dock workers can help...",
  [Quest.Rebirth]: "It seems we live many lives here...",
  [Quest.MysteriousAutomation]:
    "You have discovered mechanisms which breakthe fourth wall.",
};

export function getQuestDescription(quest: Quest): string {
  return Descriptions[quest] ?? "";
}
