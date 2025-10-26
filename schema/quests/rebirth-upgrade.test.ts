import { Hero, InventoryItem, EnchantmentType, InventoryItemType } from "types/graphql";
import { rebirth, thirdLevelCap } from "./rebirth";
import { BaseItems } from "../items/base-items";

function makeMockContext() {
  return {
    io: { sendNotification: jest.fn(), sendGlobalNotification: jest.fn() },
    db: {} as any,
  } as any;
}

function findAscendedForType(type: InventoryItemType) {
  const candidates = Object.values(BaseItems).filter(
    (b) => b.type === type && b.level === 33,
  );
  // Expect exactly one per type (non-drop gear map defines one per type)
  return candidates[0];
}

describe("Rebirth reward: upgrade equipped Soulbound or grant Soulbound", () => {
  it("upgrades a single equipped Soulbound item to Transcended, preserving properties", () => {
    const ctx = makeMockContext();

    // Create a Soulbound Body Armor (level 32) item present in inventory and equipped
    const soulboundBody = Object.values(BaseItems).find(
      (b) => b.type === InventoryItemType.BodyArmor && b.level === 32,
    )!;

    const item: InventoryItem = {
      id: "item-1",
      owner: "hero-1",
      baseItem: soulboundBody.id,
      name: soulboundBody.name,
      type: soulboundBody.type,
      level: soulboundBody.level,
      enchantment: EnchantmentType.BonusAllStats,
      builtIns: [{ type: 20 as any, magnitude: 0.15 }], // any ArtifactAttributeType value
    } as any;

    const hero = {
      id: "hero-1",
      name: "Tester",
      level: thirdLevelCap,
      levelCap: thirdLevelCap,
      questLog: {},
      inventory: [item],
      combat: { health: 100, maxHealth: 100 } as any,
      buffs: { blessing: null } as any,
      equipment: {
        leftHand: null,
        rightHand: null,
        headArmor: null,
        handArmor: null,
        legArmor: null,
        footArmor: null,
        bodyArmor: item,
        artifact: null,
        accessories: [],
      },
      // minimal fields used down the line in rebirth
      enchantments: [],
      stats: {} as any,
    } as Hero;

    const beforeInventoryCount = hero.inventory.length;

    const updated = rebirth(ctx as any, hero);

    // One quest totem is granted at ascendedRebirth; inventory grows by exactly 1
    expect(updated.inventory.length).toBe(beforeInventoryCount + 1);

    const equipped = updated.equipment.bodyArmor!;
    const ascended = findAscendedForType(InventoryItemType.BodyArmor)!;

    expect(equipped.level).toBe(33);
    expect(equipped.baseItem).toBe(ascended.id);
    expect(equipped.name).toBe(ascended.name);
    // Preserve enchantment and built-ins
    expect(equipped.enchantment).toBe(EnchantmentType.BonusAllStats);
    expect(equipped.builtIns?.length).toBe(1);
  });

  it("grants a random Soulbound item when none are equipped", () => {
    const ctx = makeMockContext();

    // Hero has equipment but not Soulbound-tier items
    const preItemBase = Object.values(BaseItems).find(
      (b) => b.type === InventoryItemType.HeadArmor && b.level === 31,
    )!;
    const preItem: InventoryItem = {
      id: "pre-1",
      owner: "hero-2",
      baseItem: preItemBase.id,
      name: preItemBase.name,
      type: preItemBase.type,
      level: preItemBase.level,
      enchantment: null,
      builtIns: [],
    } as any;

    const hero = {
      id: "hero-2",
      name: "Tester2",
      level: thirdLevelCap,
      levelCap: thirdLevelCap,
      questLog: {},
      inventory: [preItem],
      combat: { health: 100, maxHealth: 100 } as any,
      buffs: { blessing: null } as any,
      equipment: {
        leftHand: null,
        rightHand: null,
        headArmor: preItem,
        handArmor: null,
        legArmor: null,
        footArmor: null,
        bodyArmor: null,
        artifact: null,
        accessories: [],
      },
      enchantments: [],
      stats: {} as any,
    } as Hero;

    const beforeInventoryCount = hero.inventory.length;

    const updated = rebirth(ctx as any, hero);

    // Expect: 1 quest totem + 1 random Soulbound item added
    expect(updated.inventory.length).toBe(beforeInventoryCount + 2);

    // Verify at least one new non-quest item at level 32 exists
    const newSoulbound = updated.inventory.filter(
      (i) => i.level === 32 && i.type !== InventoryItemType.Quest,
    );
    expect(newSoulbound.length).toBeGreaterThanOrEqual(1);
  });
});
