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
    level: 5,
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
  "inferno-blade": {
    id: "inferno-blade",
    type: InventoryItemType.MeleeWeapon,
    name: "Inferno Blade",
    level: 33,
    affixes: [
      {
        attributeType: ArtifactAttributeType.DamageAsFire,
        magnitude: [0.5, 0.5],
        step: 0.1,
      },
      {
        attributeType: ArtifactAttributeType.BonusStrength,
        magnitude: [0.3, 0.3],
        step: 0.1,
      },
      {
        attributeType: ArtifactAttributeType.EnemyFireResistance,
        magnitude: [0.1, 0.2],
        step: 0.01,
      },
    ],
  },
  "argus-spear-of-caecus": {
    id: "argus-spear-of-caecus",
    type: InventoryItemType.SpellFocus,
    name: "Argus, spear of Caecus",
    level: 34,
    affixes: [
      {
        attributeType: ArtifactAttributeType.DamageAsPhysical,
        magnitude: [0.2, 0.3],
        step: 0.01,
      },
      {
        attributeType: ArtifactAttributeType.DamageAsHoly,
        magnitude: [0.2, 0.3],
        step: 0.01,
      },
      {
        attributeType: ArtifactAttributeType.AllResistances,
        magnitude: [0.25, 0.5],
        step: 0.01,
      },
    ],
  },
};
