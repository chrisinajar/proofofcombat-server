import { Hero, HeroClasses } from "types/graphql";
import { BaseContext } from "../context";
import {
  hasQuestItem,
  giveQuestItemNotification,
  takeQuestItem,
} from "../quests/helpers";
import { giveHeroRandomDrop, randomEnchantment, giveHeroArtifact } from "../items/helpers";
import { rebirth } from "../quests/rebirth";
import { endVoidTravel } from "../void-travel";

export async function checkAberrationDrop(
  context: BaseContext,
  hero: Hero,
  aberration: string,
): Promise<void> {
  switch (aberration) {
    case "domari-aberration-1":
      // Burnt Harlequin
      return burntHarlequinReward(context, hero);
      break;
    case "random-aberration-thornbrute":
      return thornbruteReward(context, hero);
      break;
    case "random-aberration-unholy-paladin":
      return unholyPaladinReward(context, hero);
      break;
    case "random-aberration-moving-mountain":
      return movingMountainReward(context, hero);
      break;
    case "random-aberration-artificer":
      return artificerReward(context, hero);
      break;
    case "void-monster":
      return voidMonsterReward(context, hero);
      break;
    default:
      // this applies to ALL mobs, not just aberrations
      break;
  }
}

async function voidMonsterReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  const isVoid = hero.location.map === "void";

  if (!isVoid) {
    return;
  }

  // this is the first void travel monster
  // you go there, kill it, and return
  // if you have a cracked orb and kill it them amixea can help

  // send them back to the mortal plane
  await endVoidTravel(context, hero);
  // hero.location.map = "default";
  // hero = rebirth(context, hero);

  // should we get some sort of void thingy then you then use to repair the orb?
  // maybe it becomes an "orb of the void" or something like that...
  // if (hasQuestItem(hero, "cracked-orb-of-forbidden-power")) {
  //   hero = takeQuestItem(hero, "cracked-orb-of-forbidden-power");
  //   hero = giveQuestItemNotification(context, hero, "orb-of-forbidden-power");
  // }
  // just give them a useless essence for now lolololol
  if (!hasQuestItem(hero, "essence-of-void")) {
    hero = giveQuestItemNotification(context, hero, "essence-of-void");
    if (hasQuestItem(hero, "cracked-orb-of-forbidden-power")) {
      context.io.sendGlobalNotification({
        message: `A blinding flash of light fades into nothing as the lifeless body of ${hero.name} falls from the sky`,
        type: "quest",
      });
    }
  }
}

async function movingMountainReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `The tremors at ${hero.location.x}, ${hero.location.y} have been put to rest by ${hero.name}`,
    type: "quest",
  });
  genericAberrationReward(context, hero);

  if (Math.random() < 1 / 4) {
    giveHeroRandomDrop(context, hero, 33, 3, false, false);
    // asdf asdf
    context.io.sendGlobalNotification({
      message: `${hero.name} has received great rewards for their task`,
      type: "quest",
    });
  }
}

async function thornbruteReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `The terrible aberration in ${hero.location.x}, ${hero.location.y} has been slain by ${hero.name}`,
    type: "quest",
  });
  genericAberrationReward(context, hero);

  if (Math.random() < 1 / 3) {
    context.io.sendGlobalNotification({
      message: `${hero.name} has harvested an essence from the aberration`,
      type: "quest",
    });
    hero = giveQuestItemNotification(context, hero, "essence-of-thorns");
  }
}

async function unholyPaladinReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `${hero.name} has ended the unholy aberration in ${hero.location.x}, ${hero.location.y}`,
    type: "quest",
  });
  genericAberrationReward(context, hero);

  if (Math.random() < 1 / 3) {
    context.io.sendGlobalNotification({
      message: `${hero.name} has harvested an essence from the aberration`,
      type: "quest",
    });
    hero = giveQuestItemNotification(context, hero, "essence-of-darkness");
  }
}

async function artificerReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `The mechanical contraptions at ${hero.location.x}, ${hero.location.y} fall silent as ${hero.name} stands victorious`,
    type: "quest",
  });
  genericAberrationReward(context, hero);

  // Roll an artifact with high magic find, 30+
  const artifactMagicFind = Math.floor(30 + Math.random() * 20);
  const artifactReward = context.db.artifact.rollArtifact(artifactMagicFind, hero);
  context.db.artifact.put(artifactReward);

  // Give the hero the artifact
  hero = giveHeroArtifact(
    context,
    hero,
    artifactReward,
    `You discover ${artifactReward.name} among The Artificer's creations.`
  );

  if (artifactMagicFind >= 45) {
    context.io.sendGlobalNotification({
      message: `${hero.name} has discovered a legendary artifact from The Artificer`,
      type: "quest",
    });
  } else {
    context.io.sendGlobalNotification({
      message: `${hero.name} has claimed one of The Artificer's mysterious artifacts`,
      type: "quest",
    });
  }
}

async function genericAberrationReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  // random garbo base with a high tier enchant
  giveHeroRandomDrop(context, hero, 1, 3, false, false);

  if (Math.random() < 1 / 5) {
    let dustAmount = 100 + Math.ceil(Math.random() * 400);

    if (Math.random() < 1 / 10) {
      // crit
      dustAmount *= 10;
      context.io.sendNotification(hero.id, {
        message: `Unbelievable!! You find a stash of ${dustAmount} enchanting dust!`,
        type: "quest",
      });
      context.io.sendGlobalNotification({
        message: `${hero.name} was blessed with godly enchanting powers`,
        type: "quest",
      });
    } else {
      context.io.sendNotification(hero.id, {
        message: `You find ${dustAmount} enchanting dust while looting`,
        type: "quest",
      });
      context.io.sendGlobalNotification({
        message: `${hero.name} found additional enchanting powers`,
        type: "quest",
      });
    }

    hero.enchantingDust += dustAmount;
  }
}

async function burntHarlequinReward(
  context: BaseContext,
  hero: Hero,
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `at ${hero.location.x}, ${hero.location.y}, ash sits still in the air around ${hero.name}`,
    type: "quest",
  });

  // ascended gear piece with a forced tier 3 enchantment on it
  giveHeroRandomDrop(context, hero, 33, 2, true, false);

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
      } else if (!hasQuestItem(hero, "loaded-dice")) {
        hero = giveQuestItemNotification(context, hero, "loaded-dice");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
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
        gotReward = true;
      } else if (!hasQuestItem(hero, "warrior-plate")) {
        hero = giveQuestItemNotification(context, hero, "warrior-plate");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
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
        hero = takeQuestItem(hero, "secret-codex");
        hero = takeQuestItem(hero, "fishermans-intelligence");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      } else if (!hasQuestItem(hero, "secret-codex")) {
        hero = giveQuestItemNotification(context, hero, "secret-codex");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
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
        hero = takeQuestItem(hero, "patrons-mark");
        hero = takeQuestItem(hero, "fishermans-wisdom");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      } else if (!hasQuestItem(hero, "patrons-mark")) {
        hero = giveQuestItemNotification(context, hero, "patrons-mark");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
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
        hero = takeQuestItem(hero, "righteous-incense");
        hero = takeQuestItem(hero, "fishermans-willpower");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      } else if (!hasQuestItem(hero, "righteous-incense")) {
        hero = giveQuestItemNotification(context, hero, "righteous-incense");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
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
        hero = takeQuestItem(hero, "fletching-leather");
        hero = takeQuestItem(hero, "fishermans-dexterity");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      } else if (!hasQuestItem(hero, "fletching-leather")) {
        hero = giveQuestItemNotification(context, hero, "fletching-leather");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
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
        hero = takeQuestItem(hero, "blood-stone");
        hero = takeQuestItem(hero, "fishermans-constitution");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      } else if (!hasQuestItem(hero, "blood-stone")) {
        hero = giveQuestItemNotification(context, hero, "blood-stone");

        context.io.sendGlobalNotification({
          message: `${hero.name} has found something precious`,
          type: "quest",
        });
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
    // essences certainly...
    context.io.sendGlobalNotification({
      message: `${hero.name} must be stopped`,
      type: "quest",
    });
  }
}
