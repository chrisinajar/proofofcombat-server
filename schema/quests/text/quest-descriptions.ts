import { Quest } from "types/graphql";

const Descriptions: { [x in Quest]?: string } = {
  [Quest.WashedUp]:
    "You were out on the water and you're not sure what happened. You woke up days later on a beach, barely alive. Maybe the dock workers can help...",
  [Quest.Rebirth]: "It seems we live many lives here...",
  [Quest.DroopsQuest]:
    "A thieving goblin is out there somewhere. The Hobgoblins might know where their commander is hiding.",
  [Quest.MysteriousAutomation]:
    "You have discovered mechanisms which break the fourth wall.",
  [Quest.NagaScale]:
    "You've found some strange items while fighting. You should see if you can trade your way up to something valuable...",
  [Quest.TavernChampion]:
    "The taverns host formidable challengers. Prove yourself at each one and collect their trophies.",
  [Quest.MinorClassUpgrades]:
    "Relics of the old disciplines surface in battle. Collect and refine them to unlock hidden potential.",
  [Quest.Settlements]: "Your people grow to respect and obey you.",
  [Quest.MeetTheQueen]:
    "A royal summons arrives. The Queen of Rotherham requests your presence — and a favor.",
  [Quest.EssencePurification]:
    "The altar hums with power. Combine the three great essences to distill something pure.",
  [Quest.TasteForBusiness]: "The shop keeper has some delicious work for you.",
};

export function getQuestDescription(quest: Quest): string {
  return Descriptions[quest] ?? "";
}
