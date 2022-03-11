import { Hero, MonsterInstance, Quest } from "types/graphql";
import { BaseContext } from "../context";

import {
  giveQuestItemNotification,
  takeQuestItem,
  hasQuestItem,
} from "./helpers";

const ArchersTier1 = 0x01 << 0;
const ArchersTier2 = 0x01 << 1;
const ArchersTier3 = 0x01 << 2;
const AttackersTier1 = 0x01 << 3;
const AttackersTier2 = 0x01 << 4;
const AttackersTier3 = 0x01 << 5;
const CastersTier1 = 0x01 << 6;
const CastersTier2 = 0x01 << 7;
const CastersTier3 = 0x01 << 8;
const SmitersTier1 = 0x01 << 9;
const SmitersTier2 = 0x01 << 10;
const SmitersTier3 = 0x01 << 11;
const VampiresTier1 = 0x01 << 12;
const VampiresTier2 = 0x01 << 13;
const VampiresTier3 = 0x01 << 14;

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (hero.questLog.minorClassUpgrades?.finished) {
    return hero;
  }
  if (Math.random() > 1 / 3000) {
    return hero;
  }
  if (monster.monster.level < 10) {
    return hero;
  }
  const progress = hero.questLog.minorClassUpgrades?.progress ?? 0;
  const roll = Math.floor(Math.random() * 5);
  // tier 1
  if ((progress & ArchersTier1) === 0 && roll === 0) {
    giveQuestItemNotification(context, hero, "archers-impatience");
    setProgress(hero, ArchersTier1);
    return hero;
  }
  if ((progress & AttackersTier1) === 0 && roll === 1) {
    giveQuestItemNotification(context, hero, "attackers-precision");
    setProgress(hero, AttackersTier1);
    return hero;
  }
  if ((progress & CastersTier1) === 0 && roll === 2) {
    giveQuestItemNotification(context, hero, "casters-book");
    setProgress(hero, CastersTier1);
    return hero;
  }
  if ((progress & SmitersTier1) === 0 && roll === 3) {
    giveQuestItemNotification(context, hero, "smiters-inspiration");
    setProgress(hero, SmitersTier1);
    return hero;
  }
  if ((progress & VampiresTier1) === 0 && roll === 4) {
    giveQuestItemNotification(context, hero, "vampires-blood");
    setProgress(hero, VampiresTier1);
    return hero;
  }

  if (monster.monster.level < 20) {
    return hero;
  }
  // tier 2
  if (
    (progress & ArchersTier2) === 0 &&
    roll === 0 &&
    (progress & ArchersTier1) === ArchersTier1
  ) {
    takeQuestItem(hero, "archers-impatience");
    giveQuestItemNotification(context, hero, "archers-determination");
    setProgress(hero, ArchersTier2);
    return hero;
  }
  if (
    (progress & AttackersTier2) === 0 &&
    roll === 1 &&
    (progress & AttackersTier1) === AttackersTier1
  ) {
    takeQuestItem(hero, "attackers-precision");
    giveQuestItemNotification(context, hero, "attackers-honor");
    setProgress(hero, AttackersTier2);
    return hero;
  }
  if (
    (progress & CastersTier2) === 0 &&
    roll === 2 &&
    (progress & CastersTier1) === CastersTier1
  ) {
    takeQuestItem(hero, "casters-book");
    giveQuestItemNotification(context, hero, "casters-wisdom");
    setProgress(hero, CastersTier2);
    return hero;
  }
  if (
    (progress & SmitersTier2) === 0 &&
    roll === 3 &&
    (progress & SmitersTier1) === SmitersTier1
  ) {
    takeQuestItem(hero, "smiters-inspiration");
    giveQuestItemNotification(context, hero, "smiters-calling");
    setProgress(hero, SmitersTier2);
    return hero;
  }
  if (
    (progress & VampiresTier2) === 0 &&
    roll === 4 &&
    (progress & VampiresTier1) === VampiresTier1
  ) {
    takeQuestItem(hero, "vampires-blood");
    giveQuestItemNotification(context, hero, "vampires-gaze");
    setProgress(hero, VampiresTier2);
    return hero;
  }

  if (monster.monster.level < 30) {
    return hero;
  }
  // tier 3
  if (
    (progress & ArchersTier3) === 0 &&
    roll === 0 &&
    (progress & ArchersTier2) === ArchersTier2
  ) {
    takeQuestItem(hero, "archers-determination");
    giveQuestItemNotification(context, hero, "archers-balance");
    setProgress(hero, ArchersTier3);
    return hero;
  }
  if (
    (progress & AttackersTier3) === 0 &&
    roll === 1 &&
    (progress & AttackersTier2) === AttackersTier2
  ) {
    takeQuestItem(hero, "attackers-honor");
    giveQuestItemNotification(context, hero, "attackers-warbanner");
    setProgress(hero, AttackersTier3);
    return hero;
  }
  if (
    (progress & CastersTier3) === 0 &&
    roll === 2 &&
    (progress & CastersTier2) === CastersTier2
  ) {
    takeQuestItem(hero, "casters-wisdom");
    giveQuestItemNotification(context, hero, "casters-destiny");
    setProgress(hero, CastersTier3);
    return hero;
  }
  if (
    (progress & SmitersTier3) === 0 &&
    roll === 3 &&
    (progress & SmitersTier2) === SmitersTier2
  ) {
    takeQuestItem(hero, "smiters-calling");
    giveQuestItemNotification(context, hero, "smiters-light");
    setProgress(hero, SmitersTier3);
    return hero;
  }
  if (
    (progress & VampiresTier3) === 0 &&
    roll === 4 &&
    (progress & VampiresTier2) === VampiresTier2
  ) {
    takeQuestItem(hero, "vampires-gaze");
    giveQuestItemNotification(context, hero, "vampires-darkness");
    setProgress(hero, VampiresTier3);
    return hero;
  }

  return hero;
}

function setProgress(hero: Hero, progress: number): Hero {
  const lastEvent =
    hero.currentQuest?.quest === Quest.MinorClassUpgrades
      ? hero.currentQuest
      : undefined;
  hero.questLog.minorClassUpgrades = {
    id: `MinorClassUpgrades-${hero.id}`,
    started: true,
    finished: false,
    progress: progress | (hero.questLog.minorClassUpgrades?.progress ?? 0),
    lastEvent,
  };

  return hero;
}
