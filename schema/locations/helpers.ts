import type { BaseContext } from "schema/context";
import { Location } from "types/graphql";
import { PlayerLocation } from "types/graphql";
import { ResourceDataEntry } from "../../db/models/player-location";
import { MilitaryUnitInput } from "types/graphql";

/**
 * Combat Statistics for different unit types
 *
 * Each unit type has:
 * - health: Base health points per unit
 * - damage: Base damage points per unit
 *
 * Unit progression:
 * - enlisted: Basic unit (2 health, 1 damage)
 * - soldier: 4x stronger than enlisted (8 health, 4 damage)
 * - veteran: 4x stronger than soldier (32 health, 16 damage)
 * - ghost: 8x stronger than veteran (256 health, 64 damage)
 * - fortifications: Special defensive structure (150 health, 6 damage)
 */
export const combatStats = {
  enlisted: {
    health: 2,
    damage: 1,
  },
  soldier: {
    health: 8,
    damage: 4,
  },
  veteran: {
    health: 32,
    damage: 16,
  },
  ghost: {
    health: 256,
    damage: 64,
  },
  fortifications: {
    health: 150,
    damage: 6,
  },
};

/**
 * Type representing combat resources (units and fortifications)
 * Each resource has:
 * - resource: Array of ResourceDataEntry containing unit data
 * - total: Total number of units of this type
 */
export type CombatResources = {
  [x in keyof MilitaryUnitInput | "fortifications"]?: {
    resource: ResourceDataEntry[];
    total: number;
  };
};

/**
 * Type representing combat attributes (health and damage)
 */
export type CombatAttributes = {
  health: number;
  damage: number;
};

/**
 * Calculates total combat attributes (health and damage) for a set of resources
 *
 * @param resources - Combat resources to calculate attributes for
 * @param baseHealth - Additional base health to add (e.g. settlement health)
 * @returns CombatAttributes containing total health and damage
 *
 * @example
 * const resources = {
 *   enlisted: { resource: [], total: 10 },
 *   soldier: { resource: [], total: 5 }
 * };
 * const attributes = calculateCombatAttributes(resources, 100);
 * // Returns { health: 120, damage: 30 } (100 base + 10*2 enlisted + 5*8 soldier)
 */
export function calculateCombatAttributes(
  resources: CombatResources,
  baseHealth: number = 0,
): CombatAttributes {
  let totalHealth = baseHealth;
  let totalDamage = 0;

  if (resources.fortifications) {
    totalHealth +=
      resources.fortifications.total * combatStats.fortifications.health;
    totalDamage +=
      resources.fortifications.total * combatStats.fortifications.damage;
  }
  if (resources.enlisted) {
    totalHealth += resources.enlisted.total * combatStats.enlisted.health;
    totalDamage += resources.enlisted.total * combatStats.enlisted.damage;
  }
  if (resources.soldier) {
    totalHealth += resources.soldier.total * combatStats.soldier.health;
    totalDamage += resources.soldier.total * combatStats.soldier.damage;
  }
  if (resources.veteran) {
    totalHealth += resources.veteran.total * combatStats.veteran.health;
    totalDamage += resources.veteran.total * combatStats.veteran.damage;
  }
  if (resources.ghost) {
    totalHealth += resources.ghost.total * combatStats.ghost.health;
    totalDamage += resources.ghost.total * combatStats.ghost.damage;
  }

  return {
    health: totalHealth,
    damage: totalDamage,
  };
}

export async function gatherTargetResources(
  context: BaseContext,
  targetLocation: Location,
  targetHome: PlayerLocation | null,
  targetPlayerLocation: PlayerLocation,
  builtInFortifications: number,
): Promise<{
  [x in keyof MilitaryUnitInput | "fortifications"]?: {
    resource: ResourceDataEntry[];
    total: number;
  };
}> {
  const targetResources: {
    [x in keyof MilitaryUnitInput | "fortifications"]?: {
      resource: ResourceDataEntry[];
      total: number;
    };
  } = {};

  if (targetHome) {
    const targetResource = (
      await context.db.playerLocation.getResourceData(
        targetHome,
        "fortifications",
      )
    ).filter((entry) => {
      return (
        Math.abs(entry.location.location.x - targetLocation.x) +
          Math.abs(entry.location.location.y - targetLocation.y) <
        3
      );
    });
    const total = targetResource.reduce((memo, val) => {
      return memo + val.resource.value;
    }, targetResource.length * builtInFortifications);
    targetResources.fortifications = { resource: targetResource, total };
  } else {
    const fortificationsResource = targetPlayerLocation.resources.find(
      (res) => res.name === "fortifications",
    );
    if (fortificationsResource) {
      targetResources.fortifications = {
        resource: [
          {
            resource: fortificationsResource,
            location: targetPlayerLocation,
          },
        ],
        total: fortificationsResource.value + builtInFortifications,
      };
    }
  }

  const unitTypes: (keyof MilitaryUnitInput)[] = [
    "enlisted",
    "soldier",
    "veteran",
    "ghost",
  ];

  await Promise.all(
    unitTypes.map(async (unitType: keyof MilitaryUnitInput) => {
      if (targetHome) {
        const targetResource = (
          await context.db.playerLocation.getResourceData(targetHome, unitType)
        ).filter((entry) => {
          return (
            Math.abs(entry.location.location.x - targetLocation.x) +
              Math.abs(entry.location.location.y - targetLocation.y) <
            3
          );
        });
        const total = targetResource.reduce((memo, val) => {
          return memo + val.resource.value;
        }, 0);
        targetResources[unitType] = { resource: targetResource, total };
      } else {
        const unitTypeResource = targetPlayerLocation.resources.find(
          (res) => res.name === unitType,
        );
        if (unitTypeResource) {
          targetResources[unitType] = {
            resource: [
              {
                resource: unitTypeResource,
                location: targetPlayerLocation,
              },
            ],
            total: unitTypeResource.value,
          };
        }
      }
    }),
  );

  return targetResources;
}
