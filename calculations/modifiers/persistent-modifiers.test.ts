import { Unit } from "../units/unit";
import {
  GenericStatsModifier,
  GenericStatsModifierOptions,
} from "./generic-stats-modifier";
import { ModifierPersistancyData } from "./modifier";
import { tickAndFilterModifiers } from "./duration";

describe("persistent modifiers", () => {
  describe("GenericStatsModifier.isPersistent()", () => {
    it("returns false when remainingDuration is not set", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
      });
      expect(mod.isPersistent()).toBe(false);
    });

    it("returns persistence data when remainingDuration is set", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 12000,
      });
      const result = mod.isPersistent();
      expect(result).not.toBe(false);
      if (result) {
        expect(result.modifierId).toBe("generic-stats");
        expect(result.remainingDuration).toBe(12000);
      }
    });

    it("returns persistence data for permanent modifiers (duration 0)", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 0,
      });
      const result = mod.isPersistent();
      expect(result).not.toBe(false);
      if (result) {
        expect(result.remainingDuration).toBe(0);
      }
    });
  });

  describe("GenericStatsModifier.tickDuration()", () => {
    it("decrements remainingDuration and returns false while alive", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 12000,
      });
      const expired = mod.tickDuration(6000);
      expect(expired).toBe(false);
      const data = mod.isPersistent();
      expect(data && data.remainingDuration).toBe(6000);
    });

    it("returns true when modifier expires", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 6000,
      });
      const expired = mod.tickDuration(6000);
      expect(expired).toBe(true);
    });

    it("returns false for permanent modifiers", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 0,
      });
      expect(mod.tickDuration(6000)).toBe(false);
    });

    it("returns false for non-persistent modifiers", () => {
      const unit = new Unit();
      const mod = unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
      });
      expect(mod.tickDuration(6000)).toBe(false);
    });
  });

  describe("Unit.getPersistentModifiers()", () => {
    it("includes persistent modifiers", () => {
      const unit = new Unit();
      unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 12000,
      });
      const persistent = unit.getPersistentModifiers();
      expect(persistent).toHaveLength(1);
      expect(persistent[0].modifierId).toBe("generic-stats");
    });

    it("excludes non-persistent modifiers", () => {
      const unit = new Unit();
      unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
      });
      const persistent = unit.getPersistentModifiers();
      expect(persistent).toHaveLength(0);
    });
  });

  describe("Unit.tickAndRemoveExpiredModifiers()", () => {
    it("removes expired modifiers from the unit", () => {
      const unit = new Unit();
      unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 6000,
      });
      const before = unit.getModifiedValue("strength");
      expect(before).toBeGreaterThan(1);

      unit.tickAndRemoveExpiredModifiers(6000);
      expect(unit.getModifiedValue("strength")).toBe(1);
      expect(unit.getPersistentModifiers()).toHaveLength(0);
    });

    it("keeps alive modifiers", () => {
      const unit = new Unit();
      unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 10 },
        remainingDuration: 12000,
      });

      unit.tickAndRemoveExpiredModifiers(6000);
      expect(unit.getModifiedValue("strength")).toBeGreaterThan(1);
      expect(unit.getPersistentModifiers()).toHaveLength(1);
    });
  });

  describe("save/load round-trip", () => {
    it("restores persistent modifiers on a new unit", () => {
      const unit1 = new Unit();
      unit1.baseValues.strength = 100;
      unit1.applyModifier(GenericStatsModifier, {
        isDebuff: true,
        multiplier: { strength: 0.8 },
        remainingDuration: 12000,
      });

      const weakened = unit1.getModifiedValue("strength");
      expect(weakened).toBeLessThan(100);

      const persisted = unit1.getPersistentModifiers();
      expect(persisted).toHaveLength(1);

      const unit2 = new Unit();
      unit2.baseValues.strength = 100;
      unit2.restorePersistedModifiers(persisted);

      expect(unit2.getModifiedValue("strength")).toBe(weakened);
    });

    it("does not restore expired modifiers", () => {
      const persisted: ModifierPersistancyData<GenericStatsModifierOptions>[] =
        [
          {
            modifierId: "generic-stats",
            remainingDuration: 6000,
            options: {
              isDebuff: true,
              multiplier: { strength: 0.8 },
              remainingDuration: 6000,
            },
          },
        ];

      const ticked = tickAndFilterModifiers(persisted, 6000);
      expect(ticked).toHaveLength(0);

      const unit = new Unit();
      unit.baseValues.strength = 100;
      unit.restorePersistedModifiers(ticked);
      expect(unit.getModifiedValue("strength")).toBe(100);
    });

    it("simulates multi-tick lifecycle", () => {
      const unit1 = new Unit();
      unit1.baseValues.strength = 100;
      unit1.applyModifier(GenericStatsModifier, {
        isDebuff: true,
        multiplier: { strength: 0.8 },
        remainingDuration: 12000,
      });

      const weakened = unit1.getModifiedValue("strength");

      // tick 1: 6000ms of combat
      let persisted = unit1.getPersistentModifiers();
      persisted = tickAndFilterModifiers(persisted, 6000);
      expect(persisted).toHaveLength(1);
      expect(persisted[0].remainingDuration).toBe(6000);

      // load after tick 1
      const unit2 = new Unit();
      unit2.baseValues.strength = 100;
      unit2.restorePersistedModifiers(persisted);
      expect(unit2.getModifiedValue("strength")).toBe(weakened);

      // tick 2: another 6000ms
      let persisted2 = unit2.getPersistentModifiers();
      persisted2 = tickAndFilterModifiers(persisted2, 6000);
      expect(persisted2).toHaveLength(0);

      // load after tick 2: debuff is gone
      const unit3 = new Unit();
      unit3.baseValues.strength = 100;
      unit3.restorePersistedModifiers(persisted2);
      expect(unit3.getModifiedValue("strength")).toBe(100);
    });
  });
});
