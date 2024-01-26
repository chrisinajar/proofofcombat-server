import { UserInputError, ForbiddenError } from "apollo-server";

import {
  Resolvers,
  Monster,
  MonsterInstance,
  MonsterFightResult,
  AttackType,
  InventoryItem,
  HeroClasses,
  MonsterEquipment,
  EnchantmentType,
  HeroStance,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import {
  randomBaseItem,
  randomEnchantment,
  createItemInstance,
  enchantItem,
} from "../items/helpers";
import { checkHeroDrop, hasQuestItem, checkSkipDrop } from "../quests/helpers";
import { createMonsterEquipment } from "../../combat/monster";
import { fightMonster } from "../../combat/fight-monster";
import { LocationData, MapNames } from "../../constants";
import { specialLocations, distance2d } from "../../helpers";

import { checkAberrationDrop } from "./aberration-drops";
import {
  getMonster,
  LAND_MONSTERS,
  VOID_MONSTERS,
  WATER_MONSTERS,
  FORBIDDEN_MONSTERS,
} from "./monster-lists";

const MonsterLockoutItems: { [x in string]?: string } = {
  "domari-aberration-1": "essence-of-ash",
  "random-aberration-unholy-paladin": "essence-of-darkness",
  "random-aberration-thornbrute": "essence-of-thorns",
};

const resolvers: Resolvers = {
  Mutation: {
    async fight(
      parent,
      args,
      context: BaseContext,
    ): Promise<MonsterFightResult> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const account = await context.db.account.get(context.auth.id);
      let hero = await context.db.hero.get(context.auth.id);
      let monster = null;

      try {
        monster = await context.db.monsterInstances.get(args.monster);
      } catch (e) {
        throw new UserInputError(
          "This monster has been killed by another player!",
        );
      }

      if (hero.combat.health <= 0) {
        throw new UserInputError("You must heal before attacking!");
      }

      if (
        monster.location.x !== hero.location.x ||
        monster.location.y !== hero.location.y ||
        monster.location.map !== hero.location.map
      ) {
        throw new UserInputError(
          "You are not in the right location to fight that monster!",
        );
      }

      const lockoutItem = MonsterLockoutItems[monster.monster.id];
      if (lockoutItem && hasQuestItem(hero, lockoutItem)) {
        throw new UserInputError(
          "You cannot touch the aberration for you already possess it's essence",
        );
      }

      const startLevel = hero.level;
      const attackType: AttackType = args.attackType || AttackType.Melee;
      const stance: HeroStance = args.stance || hero.activeStance;
      // hero.activeStance = stance;

      let goldReward = monster.monster.combat.maxHealth * 0.8;

      const fightResult = await fightMonster(hero, monster, attackType);
      let experienceRewards =
        (monster.monster.level + Math.pow(1.4, monster.monster.level)) * 10;

      const xpDoublers = context.db.hero.countEnchantments(
        hero,
        EnchantmentType.DoubleExperience,
      );
      if (hero.class === HeroClasses.Adventurer) {
        experienceRewards *= 3;
      }

      experienceRewards = Math.ceil(
        Math.min(hero.needed / 5, experienceRewards),
      );

      experienceRewards *= Math.pow(2, xpDoublers);

      hero.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            hero.combat.maxHealth,
            hero.combat.health -
              fightResult.attackerDamage -
              fightResult.attackerEnchantmentDamage +
              fightResult.attackerHeal,
          ),
        ),
      );

      let heroDeathHeal = 0;
      if (hero.combat.health === 0) {
        console.log(monster.monster.name, "killed", hero.name);
        const isVoid = hero.location.map === "void";
        const heroDeathHealPercent = isVoid ? 1 : 0.1;
        heroDeathHeal = Math.max(
          monster.monster.combat.maxHealth * heroDeathHealPercent,
          hero.combat.maxHealth,
        );
      }

      monster.monster.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            monster.monster.combat.maxHealth,
            monster.monster.combat.health -
              fightResult.victimDamage -
              fightResult.victimEnchantmentDamage +
              fightResult.victimHeal +
              heroDeathHeal,
          ),
        ),
      );

      // i am undeath
      fightResult.victimDied = monster.monster.combat.health < 1;

      let droppedItem: null | InventoryItem = null;

      // victory
      if (fightResult.victimDied) {
        // if (location.terrain === "water") {

        const location =
          LocationData[hero.location.map as MapNames]?.locations[
            hero.location.x
          ][hero.location.y];

        const currentTavern = specialLocations(
          hero.location.x,
          hero.location.y,
          hero.location.map as MapNames,
        ).find((location) => location.type === "tavern");

        let equipment: MonsterEquipment | undefined = undefined;
        let bonusDropRate = 1;
        let bonusEnchantmentDropRate = 1;
        const monsterAntiLuck = goldReward;

        if (currentTavern) {
          if (currentTavern.name === "The Hidden Stump Inn") {
            goldReward *= 1.5;
          } else if (currentTavern.name === "The Hellhound's Fur") {
            // this is a multiplier
            // so 0.5% - 2.5% becomes 0.75% - 3.75%
            bonusDropRate = 1.5;
          } else if (currentTavern.name === "Steamgear Tap House") {
            experienceRewards *= 1.2;
          } else if (currentTavern.name === "The Drowning Fish") {
            bonusDropRate = 2;
          } else if (currentTavern.name === "Wyverns Holm") {
            bonusEnchantmentDropRate = 1.5;
          }
        }

        if (location.terrain === "forbidden") {
          bonusDropRate *= 3;
          experienceRewards *= 3;
        }

        experienceRewards = Math.round(experienceRewards);
        goldReward = Math.min(1000000000, Math.round(goldReward));

        console.log(
          hero.name,
          hero.level,
          "killed a",
          monster.monster.name,
          monster.monster.level,
          {
            xpDoublers,
            goldReward,
            experienceRewards,
          },
        );

        await checkAberrationDrop(context, hero, monster.monster.id);

        context.db.hero.addExperience(context, hero, experienceRewards);
        hero.gold = hero.gold + goldReward;

        // drop chances!!
        const luck = hero.stats.luck;
        const dropOdds =
          ((0.25 + luck / (luck + monsterAntiLuck + 5)) * bonusDropRate) / 50;
        if (process.env.MAX_LEVEL_TESTING || Math.random() < dropOdds) {
          console.log(hero.name, "DROP!! Odds:", {
            luck,
            monsterAntiLuck,
            bonusDropRate,
            dropOdds: Math.round(dropOdds * 1000) / 1000,
          });

          if (await checkSkipDrop(context, hero, monster)) {
            if (monster.monster.level > hero.settings.autoDust) {
              const monsterLevel = monster.monster.level;

              const baseItem = randomBaseItem(monsterLevel);
              // max mob tier enchantments is 3
              // max normal overworld mobs is 32
              // lets give just a 10% chance of tier 3 enchantments (they fat)
              // so max value should be 3.33.. at 32, so that there's a 10% chance it remains above 3.0
              // (32 / (3 / 0.9)) = 9.6!
              const enchantment = randomEnchantment(
                Math.floor(
                  bonusEnchantmentDropRate *
                    Math.random() *
                    (monsterLevel / 9.6),
                ),
              );
              const itemInstance = enchantItem(
                createItemInstance(baseItem, hero),
                enchantment,
              );

              droppedItem = itemInstance;
              hero.inventory.push(itemInstance);
            } else {
              hero.enchantingDust =
                hero.enchantingDust +
                1 +
                context.db.hero.countEnchantments(
                  hero,
                  EnchantmentType.BonusDust,
                );

              context.io.sendNotification(hero.id, {
                type: "drop",
                message: `The enchanted item falling from ${monster.monster.name} turns to dust`,
              });
            }
          }
        }

        hero = checkHeroDrop(context, hero, monster);

        await context.db.monsterInstances.del(monster);
      } else {
        await context.db.monsterInstances.put(monster);
      }

      await context.db.hero.put(hero);

      if (droppedItem) {
        context.io.sendNotification(hero.id, {
          type: "drop",
          message: `You found {{item}} while fighting ${monster.monster.name}`,
          item: droppedItem,
        });
      }

      return {
        account,
        hero,
        monster,
        log: fightResult.log,
        victory: fightResult.victimDied,
        drop: droppedItem ?? undefined,
        gold: fightResult.victimDied ? goldReward : undefined,
        experience: fightResult.victimDied ? experienceRewards : undefined,
        didLevel: hero.level !== startLevel,
      };
    },

    async challenge(
      parent,
      args,
      context: BaseContext,
    ): Promise<MonsterInstance> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      let monster = await getMonster(args.monster);

      if (!monster) {
        throw new UserInputError("Unknown monster");
      }

      const location =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      if (location.terrain !== monster.terrain) {
        throw new UserInputError(
          "You are in the wrong location for that monster.",
        );
      }

      const currentTavern = specialLocations(
        hero.location.x,
        hero.location.y,
        hero.location.map as MapNames,
      ).find((location) => location.type === "tavern");

      let equipment: MonsterEquipment | undefined = undefined;

      if (location.terrain === "void") {
        equipment = VOID_MONSTERS.find(
          ({ monster: voidMonster }) =>
            monster && voidMonster.id === monster.id,
        )?.equipment;
        console.log("void equipment", equipment);
      }

      if (currentTavern) {
        if (currentTavern.name === "The Hidden Stump Inn") {
          monster = { ...monster, level: monster.level + 1 };
        } else if (currentTavern.name === "Steamgear Tap House") {
          monster = { ...monster, level: monster.level + 1 };
        } else if (currentTavern.name === "The Hellhound's Fur") {
          equipment = {
            leftHand: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },
            rightHand: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },

            bodyArmor: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },
            handArmor: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },
            legArmor: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },
            headArmor: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },
            footArmor: {
              level: monster.level,
              enchantment: randomEnchantment(0),
            },
          };
        } else if (currentTavern.name === "The Drowning Fish") {
          equipment = {
            leftHand: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },
            rightHand: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },

            bodyArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },
            handArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },
            legArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },
            headArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },
            footArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(1, false),
            },
          };
        } else if (currentTavern.name === "Wyverns Holm") {
          equipment = {
            leftHand: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },
            rightHand: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },

            bodyArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },
            handArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },
            legArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },
            headArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },
            footArmor: {
              level: monster.level + 2,
              enchantment: randomEnchantment(2, false),
            },
          };
        }
      }

      const instance = context.db.monsterInstances.create({
        monster,
        location: { ...hero.location },
        equipment,
      });
      return instance;
    },
  },
  Query: {
    async monster(parent, args, context: BaseContext): Promise<Monster> {
      const monster = await getMonster(args.id);
      if (!monster) {
        throw new UserInputError("No monster known by that id");
      }
      return monster;
    },
    async monsters(
      parent,
      args,
      context: BaseContext,
    ): Promise<MonsterInstance[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      return context.db.monsterInstances.getInLocation(hero.location);
    },
    async challenges(parent, args, context: BaseContext): Promise<Monster[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      // take location into account?
      // oh well!

      const location =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      if (location.terrain === "water") {
        return WATER_MONSTERS;
      }
      if (location.terrain === "land") {
        return LAND_MONSTERS;
      }
      if (location.terrain === "forbidden") {
        return FORBIDDEN_MONSTERS;
      }
      if (location.terrain === "void") {
        return VOID_MONSTERS.map(({ monster }) => ({ ...monster }));
      }

      return [];
    },
  },
};

export default resolvers;
