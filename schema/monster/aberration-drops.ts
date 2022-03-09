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

  let gotReward = false;

  // plus fuse class uppgrade if available
  switch (hero.class) {
    case HeroClasses.Gambler:
      if (
        hasQuestItem(hero, "loaded-dice") &&
        hasQuestItem(hero, "fishermans-luck")
      ) {
        hero = giveQuestItemNotification(context, hero, "gambling-kit");
        hero = takeQuestItem(hero, "loaded-dice");
        hero = takeQuestItem(hero, "fishermans-luck");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
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
        gotReward = true;
      }

      break;
    case HeroClasses.Wizard:
    case HeroClasses.Warlock:
      if (
        hasQuestItem(hero, "secret-codex") &&
        hasQuestItem(hero, "fishermans-intelligence")
      ) {
        hero = giveQuestItemNotification(context, hero, "tome-of-knowledge");
        hero = takeQuestItem(hero, "secret-codex");
        hero = takeQuestItem(hero, "fishermans-intelligence");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.BattleMage:
      if (
        hasQuestItem(hero, "patrons-mark") &&
        hasQuestItem(hero, "fishermans-wisdom")
      ) {
        hero = giveQuestItemNotification(context, hero, "patrons-wisdom");
        hero = takeQuestItem(hero, "patrons-mark");
        hero = takeQuestItem(hero, "fishermans-wisdom");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Paladin:
      if (
        hasQuestItem(hero, "righteous-incense") &&
        hasQuestItem(hero, "fishermans-willpower")
      ) {
        hero = giveQuestItemNotification(context, hero, "liturgical-censer");
        hero = takeQuestItem(hero, "righteous-incense");
        hero = takeQuestItem(hero, "fishermans-willpower");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Ranger:
      if (
        hasQuestItem(hero, "fletching-leather") &&
        hasQuestItem(hero, "fishermans-dexterity")
      ) {
        hero = giveQuestItemNotification(context, hero, "quiver-of-speed");
        hero = takeQuestItem(hero, "fletching-leather");
        hero = takeQuestItem(hero, "fishermans-dexterity");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.BloodMage:
      if (
        hasQuestItem(hero, "blood-stone") &&
        hasQuestItem(hero, "fishermans-constitution")
      ) {
        hero = giveQuestItemNotification(context, hero, "vampire-ring");
        hero = takeQuestItem(hero, "blood-stone");
        hero = takeQuestItem(hero, "fishermans-constitution");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Daredevil:
    case HeroClasses.Gladiator:
    case HeroClasses.EnragedBerserker:
    case HeroClasses.MasterWizard:
    case HeroClasses.MasterWarlock:
    case HeroClasses.DemonHunter:
    case HeroClasses.Zealot:
    case HeroClasses.Archer:
    case HeroClasses.Vampire:
      // has class upgrade, reward?

      hero = giveQuestItemNotification(context, hero, "essence-of-ash");
      gotReward = true;
      break;
    default:
      break;
  }

  if (!gotReward) {
    // why did you kill this?
    // get something bonus?
  }
}
