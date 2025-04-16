import {
  Location,
  PlayerLocation,
  MilitaryUnitInput,
  UpkeepCosts,
} from "types/graphql";
import { BaseContext } from "../context";
import { gatherTargetResources } from "./helpers";
import { ResourceDataEntry } from "../../db/models/player-location";
import { calculateCombatAttributes, combatStats } from "./helpers";

describe("gatherTargetResources", () => {
  let mockContext: BaseContext;
  let targetPlayerLocation: PlayerLocation;
  const builtInFortifications = 1000;

  beforeEach(() => {
    // Setup mock context
    mockContext = {
      db: {
        playerLocation: {
          getResourceData: jest.fn(),
          getHome: jest.fn().mockResolvedValue({
            id: "home-1",
            owner: "player-1",
            type: "Settlement",
            location: { x: 10, y: 10, map: "test-map" },
            resources: [],
            connections: [],
            upgrades: [],
            availableUpgrades: [],
            health: 1000,
            maxHealth: 1000,
            remainingAttacks: 3,
            upkeep: {
              gold: 0,
              bonds: 0,
              honey: 0,
              enlisted: 0,
              soldier: 0,
              veteran: 0,
              ghost: 0,
              fortifications: 0,
              food: 0,
              stone: 0,
              water: 0,
              wood: 0,
            } as UpkeepCosts,
          } as PlayerLocation),
        },
      },
    } as unknown as BaseContext;

    targetPlayerLocation = {
      id: "location-1",
      owner: "player-1",
      type: "Garrison",
      location: { x: 10, y: 10, map: "test-map" },
      resources: [
        { name: "fortifications", value: 500 },
        { name: "enlisted", value: 100 },
        { name: "soldier", value: 50 },
        { name: "veteran", value: 25 },
        { name: "ghost", value: 10 },
      ],
      connections: [],
      upgrades: [],
      availableUpgrades: [],
      health: 1000,
      maxHealth: 1000,
      remainingAttacks: 3,
      upkeep: {
        gold: 0,
        bonds: 0,
        honey: 0,
        enlisted: 0,
        soldier: 0,
        veteran: 0,
        ghost: 0,
        fortifications: 0,
        food: 0,
        stone: 0,
        water: 0,
        wood: 0,
      } as UpkeepCosts,
    } as PlayerLocation;
  });

  describe("when target has a home", () => {
    it("should gather resources from nearby locations", async () => {
      // Mock nearby resources
      const mockResources: ResourceDataEntry[] = [
        {
          resource: { name: "fortifications", value: 200 },
          location: {
            ...targetPlayerLocation,
            location: { x: 9, y: 10, map: "test-map" },
          },
        },
        {
          resource: { name: "enlisted", value: 50 },
          location: {
            ...targetPlayerLocation,
            location: { x: 10, y: 9, map: "test-map" },
          },
        },
      ];

      (
        mockContext.db.playerLocation.getResourceData as jest.Mock
      ).mockImplementation(async (home, resourceType) => {
        return mockResources.filter((r) => r.resource.name === resourceType);
      });

      const result = await gatherTargetResources(
        mockContext,
        targetPlayerLocation,
        builtInFortifications,
      );

      expect(result.fortifications?.total).toBe(1200); // 200 + 1000 built-in
      expect(result.enlisted?.total).toBe(50);
      expect(result.soldier?.total).toBe(0);
      expect(result.veteran?.total).toBe(0);
      expect(result.ghost?.total).toBe(0);
    });

    it("should filter out resources that are too far away", async () => {
      const mockResources: ResourceDataEntry[] = [
        {
          resource: { name: "fortifications", value: 200 },
          location: {
            ...targetPlayerLocation,
            location: { x: 13, y: 10, map: "test-map" }, // Too far (distance = 3)
          },
        },
      ];

      (
        mockContext.db.playerLocation.getResourceData as jest.Mock
      ).mockResolvedValue(mockResources);

      const result = await gatherTargetResources(
        mockContext,
        targetPlayerLocation,
        builtInFortifications,
      );

      expect(result.fortifications?.total).toBe(0); // No resources within range
    });

    it("should include built-in fortifications when target is within range", async () => {
      // Mock a single resource within range
      const mockResources: ResourceDataEntry[] = [
        {
          resource: { name: "fortifications", value: 0 }, // No actual fortifications, just testing built-in
          location: {
            ...targetPlayerLocation,
            location: { x: 9, y: 10, map: "test-map" }, // Within range (distance = 1)
          },
        },
      ];

      (
        mockContext.db.playerLocation.getResourceData as jest.Mock
      ).mockResolvedValue(mockResources);

      const result = await gatherTargetResources(
        mockContext,
        targetPlayerLocation,
        builtInFortifications,
      );

      // Should have just the built-in fortifications since the resource has value 0
      expect(result.fortifications?.total).toBe(1000);
      expect(result.fortifications?.resource.length).toBe(1);
    });
  });

  describe("when target has no home", () => {
    beforeEach(() => {
      (mockContext.db.playerLocation.getHome as jest.Mock).mockResolvedValue(
        null,
      );
    });

    it("should gather resources from the target location only", async () => {
      const result = await gatherTargetResources(
        mockContext,
        targetPlayerLocation,
        builtInFortifications,
      );

      expect(result.fortifications?.total).toBe(1500); // 500 + 1000 built-in
      expect(result.enlisted?.total).toBe(100);
      expect(result.soldier?.total).toBe(50);
      expect(result.veteran?.total).toBe(25);
      expect(result.ghost?.total).toBe(10);
    });

    it("should handle missing resource types", async () => {
      const locationWithoutResources = {
        ...targetPlayerLocation,
        resources: [{ name: "fortifications", value: 500 }],
      };

      const result = await gatherTargetResources(
        mockContext,
        locationWithoutResources,
        builtInFortifications,
      );

      expect(result.fortifications?.total).toBe(1500);
      expect(result.enlisted).toBeUndefined();
      expect(result.soldier).toBeUndefined();
      expect(result.veteran).toBeUndefined();
      expect(result.ghost).toBeUndefined();
    });
  });
});

describe("Combat System", () => {
  describe("calculateCombatAttributes", () => {
    it("should calculate attributes for empty resources", () => {
      const result = calculateCombatAttributes({});
      expect(result).toEqual({ health: 0, damage: 0 });
    });

    it("should calculate attributes for enlisted units", () => {
      const resources = {
        enlisted: { resource: [], total: 10 },
      };
      const result = calculateCombatAttributes(resources);
      expect(result).toEqual({
        health: 10 * combatStats.enlisted.health,
        damage: 10 * combatStats.enlisted.damage,
      });
    });

    it("should calculate attributes for multiple unit types", () => {
      const resources = {
        enlisted: { resource: [], total: 10 },
        soldier: { resource: [], total: 5 },
        veteran: { resource: [], total: 2 },
      };
      const result = calculateCombatAttributes(resources);
      expect(result).toEqual({
        health:
          10 * combatStats.enlisted.health +
          5 * combatStats.soldier.health +
          2 * combatStats.veteran.health,
        damage:
          10 * combatStats.enlisted.damage +
          5 * combatStats.soldier.damage +
          2 * combatStats.veteran.damage,
      });
    });

    it("should include base health when provided", () => {
      const resources = {
        enlisted: { resource: [], total: 10 },
      };
      const baseHealth = 100;
      const result = calculateCombatAttributes(resources, baseHealth);
      expect(result).toEqual({
        health: baseHealth + 10 * combatStats.enlisted.health,
        damage: 10 * combatStats.enlisted.damage,
      });
    });

    it("should handle fortifications", () => {
      const resources = {
        fortifications: { resource: [], total: 3 },
      };
      const result = calculateCombatAttributes(resources);
      expect(result).toEqual({
        health: 3 * combatStats.fortifications.health,
        damage: 3 * combatStats.fortifications.damage,
      });
    });

    it("should handle ghost units", () => {
      const resources = {
        ghost: { resource: [], total: 2 },
      };
      const result = calculateCombatAttributes(resources);
      expect(result).toEqual({
        health: 2 * combatStats.ghost.health,
        damage: 2 * combatStats.ghost.damage,
      });
    });

    it("should handle all unit types together", () => {
      const resources = {
        enlisted: { resource: [], total: 10 },
        soldier: { resource: [], total: 5 },
        veteran: { resource: [], total: 2 },
        ghost: { resource: [], total: 1 },
        fortifications: { resource: [], total: 3 },
      };
      const baseHealth = 100;
      const result = calculateCombatAttributes(resources, baseHealth);
      expect(result).toEqual({
        health:
          baseHealth +
          10 * combatStats.enlisted.health +
          5 * combatStats.soldier.health +
          2 * combatStats.veteran.health +
          1 * combatStats.ghost.health +
          3 * combatStats.fortifications.health,
        damage:
          10 * combatStats.enlisted.damage +
          5 * combatStats.soldier.damage +
          2 * combatStats.veteran.damage +
          1 * combatStats.ghost.damage +
          3 * combatStats.fortifications.damage,
      });
    });
  });
});
