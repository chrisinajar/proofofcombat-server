import { Hero, HeroClasses } from "types/graphql";
import { BaseContext } from "../context";
import {
  hasQuestItem,
  giveQuestItemNotification,
  takeQuestItem,
} from "../quests/helpers";
import { giveHeroRandomDrop } from "../items/helpers";

export async function checkAberrationDrop(
  context: BaseContext,
  hero: Hero,
  aberration: string
): Promise<void> {
  switch (aberration) {
    case "domari-aberration-1":
      // Burnt Harlequin
      await burntHarlequinReward(context, hero);
      break;
    default:
      break;
  }
}

async function burntHarlequinReward(
  context: BaseContext,
  hero: Hero
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `ash sits still in the air around ${hero.name}`,
    type: "quest",
  });

  // ascended gear piece with a forced tier 3 enchantment on it
  giveHeroRandomDrop(context, hero, 33, 4, true, false);

  // plus fuse class uppgrade if available
  switch (hero.class) {
    case HeroClasses.Gambler:
      if (
        hasQuestItem(hero, "loaded-dice") &&
        hasQuestItem(hero, "fishermans-luck")
      ) {
        hero = giveQuestItemNotification(context, hero, "gambling-kit");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Fighter:
    case HeroClasses.Berserker:
      if (
        hasQuestItem(hero, "warrior-plate") &&
        hasQuestItem(hero, "fishermans-strength")
      ) {
        hero = giveQuestItemNotification(context, hero, "warriors-armlette");
        hero = takeQuestItem(hero, "warrior-plate");
        hero = takeQuestItem(hero, "fishermans-strength");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Wizard:
    case HeroClasses.Warlock:
      if (
        hasQuestItem(hero, "secret-codex") &&
        hasQuestItem(hero, "fishermans-intelligence")
      ) {
        hero = giveQuestItemNotification(context, hero, "tome-of-knowledge");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.BattleMage:
      if (
        hasQuestItem(hero, "patrons-mark") &&
        hasQuestItem(hero, "fishermans-wisdom")
      ) {
        hero = giveQuestItemNotification(context, hero, "patrons-wisdom");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Paladin:
      if (
        hasQuestItem(hero, "righteous-incense") &&
        hasQuestItem(hero, "fishermans-willpower")
      ) {
        hero = giveQuestItemNotification(context, hero, "liturgical-censer");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.Ranger:
      if (
        hasQuestItem(hero, "fletching-leather") &&
        hasQuestItem(hero, "fishermans-dexterity")
      ) {
        hero = giveQuestItemNotification(context, hero, "quiver-of-speed");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    case HeroClasses.BloodMage:
      if (
        hasQuestItem(hero, "blood-stone") &&
        hasQuestItem(hero, "fishermans-constitution")
      ) {
        hero = giveQuestItemNotification(context, hero, "vampire-ring");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
      }

      break;
    default:
      break;
  }
}
