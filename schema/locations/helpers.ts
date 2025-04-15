import type { BaseContext } from "schema/context";
import { Location } from "types/graphql";
import { PlayerLocation } from "types/graphql";
import { ResourceDataEntry } from "../../db/models/player-location";
import { MilitaryUnitInput } from "types/graphql";

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
