import { InventoryItemType, ArtifactAttributeType } from "types/graphql";

// Named items are items that have a specific name, and are not randomly generated.
type NamedItemAffix = {
  attributeType: ArtifactAttributeType;
  magnitude: [number, number];
  step: number;
};
export type NamedItem = {
  id: string;
  name: string;
  level: number;
  type: InventoryItemType;
  affixes: NamedItemAffix[];
};

export const NamedItems: { [x in string]: NamedItem } = {
  "tortoise-shell": {
    id: "tortoise-shell",
    type: InventoryItemType.Shield,
    name: "Tortoise Shell",
    level: 1,
    affixes: [
      {
        attributeType: ArtifactAttributeType.BonusHealth,
        magnitude: [1, 1],
        step: 1,
      },
      {
        attributeType: ArtifactAttributeType.AllResistances,
        magnitude: [0.2, 0.5],
        step: 0.01,
      },
    ],
  },
};

for (let id in NamedItems) {
  NamedItems[id].id = id;
}
