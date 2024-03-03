import {
  Hero,
  InventoryItem,
  MonsterInstance,
  HeroClasses,
} from "types/graphql";
import { BaseContext } from "../context";

import { giveQuestItemNotification, hasQuestItem } from "./helpers";

const monsterLevelRequired = 17;

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance,
): Hero {
  if (monster.monster.level < monsterLevelRequired) {
    return hero;
  }
  // "drop rate"
  if (Math.random() > 1 / 20000) {
    return hero;
  }

  let gotQuestDrop = false;

  console.log(hero.name, "IS GETTING CLASS UPGRADE ITEM", hero.class);
  switch (hero.class) {
    case HeroClasses.Gambler:
      if (!hasQuestItem(hero, "loaded-dice")) {
        hero = giveQuestItemNotification(context, hero, "loaded-dice");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Fighter:
    case HeroClasses.Berserker:
      if (!hasQuestItem(hero, "warrior-plate")) {
        hero = giveQuestItemNotification(context, hero, "warrior-plate");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Wizard:
    case HeroClasses.Warlock:
      if (!hasQuestItem(hero, "secret-codex")) {
        hero = giveQuestItemNotification(context, hero, "secret-codex");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.BattleMage:
      if (!hasQuestItem(hero, "patrons-mark")) {
        hero = giveQuestItemNotification(context, hero, "patrons-mark");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Paladin:
      if (!hasQuestItem(hero, "righteous-incense")) {
        hero = giveQuestItemNotification(context, hero, "righteous-incense");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Ranger:
      if (!hasQuestItem(hero, "fletching-leather")) {
        hero = giveQuestItemNotification(context, hero, "fletching-leather");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.BloodMage:
      if (!hasQuestItem(hero, "blood-stone")) {
        hero = giveQuestItemNotification(context, hero, "blood-stone");
        gotQuestDrop = true;

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
      }

      break;
    default:
      break;
  }

  if (gotQuestDrop) {
    const dustAmount = Math.round(Math.random() * 300 + 200);

    context.io.sendNotification(hero.id, {
      message: `You find something rare and precious. It seems to do nothing for now, but you find ${dustAmount} enchanting dust along with it.`,
      type: "quest",
    });

    hero.enchantingDust += dustAmount;
  }

  return hero;
}
