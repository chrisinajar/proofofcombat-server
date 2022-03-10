import { Monster, AttackType, HeroClasses } from "types/graphql";

const MONSTERS: { [x in string]: Monster } = {};

function makeMonster(factor: number, amp: number, terrain: string) {
  return function (
    { name, attackType }: { name: string; attackType: AttackType },
    index: number
  ): Monster {
    MONSTERS[name] = {
      id: name,

      level: index + 1,
      name,
      attackType,
      combat: {
        health: Math.ceil(Math.pow(factor, index) * amp),
        maxHealth: Math.ceil(Math.pow(factor, index) * amp),
      },
      terrain,
    };
    return MONSTERS[name];
  };
}

export const LAND_MONSTERS: Monster[] = [
  { name: "Giant crab", attackType: AttackType.Melee },
  { name: "Forest imp", attackType: AttackType.Cast },
  { name: "Traveling bandit", attackType: AttackType.Ranged },
  { name: "Hobgoblin", attackType: AttackType.Ranged },
  { name: "Brass dragon wyrmling", attackType: AttackType.Melee },
  { name: "Orc war chief", attackType: AttackType.Melee },
  { name: "Minotaur skeleton", attackType: AttackType.Cast },
  { name: "Gelatinous cube", attackType: AttackType.Melee },
  { name: "Duergar", attackType: AttackType.Ranged },
  { name: "Umber hulk", attackType: AttackType.Melee },
  { name: "Half-red dragon veteran", attackType: AttackType.Melee },
  { name: "Air Elemental", attackType: AttackType.Cast },
  { name: "Troll", attackType: AttackType.Melee },
  { name: "Ogre zombie", attackType: AttackType.Smite },
  { name: "Griffon", attackType: AttackType.Melee },
  { name: "Grick alpha", attackType: AttackType.Melee },
  { name: "Young black dragon", attackType: AttackType.Melee },
  { name: "Drow mage", attackType: AttackType.Cast },
  { name: "Flesh Golem", attackType: AttackType.Cast },
  { name: "Werebear", attackType: AttackType.Melee },
  { name: "Mezzoloth", attackType: AttackType.Cast },
  { name: "Green slaad", attackType: AttackType.Melee },
  { name: "Spirit naga", attackType: AttackType.Smite },
  { name: "Chain devil", attackType: AttackType.Cast },
  { name: "Hydra", attackType: AttackType.Cast },
  { name: "Marilith", attackType: AttackType.Ranged },
  { name: "Githyanki knight", attackType: AttackType.Melee },
  { name: "Iron golem", attackType: AttackType.Melee },
  { name: "Adult blue dragon", attackType: AttackType.Smite },
  { name: "Goristro", attackType: AttackType.Melee },
  { name: "Fire Giant", attackType: AttackType.Melee },
  { name: "Nycaloth", attackType: AttackType.Melee },
  { name: "Yochlol", attackType: AttackType.Melee },
  { name: "Goliath Flesheater", attackType: AttackType.Cast },
  { name: "Archmage", attackType: AttackType.Cast },
  { name: "Fey Demon", attackType: AttackType.Cast },
  { name: "Ancient Treant", attackType: AttackType.Smite },
  { name: "Undead Frost Giant", attackType: AttackType.Ranged },
  { name: "Demilich", attackType: AttackType.Cast },
].map(makeMonster(1.4, 8, "land"));

export const WATER_MONSTERS: Monster[] = [
  { name: "Binding Seaweed", attackType: AttackType.Melee },
  { name: "Lunging Eel", attackType: AttackType.Cast },
  { name: "Parasitic Zygomite", attackType: AttackType.Ranged },
  { name: "Scisssor-Armed Caridea", attackType: AttackType.Ranged },
  { name: "Benthic man o' war", attackType: AttackType.Melee },
  { name: "Prehistoric Lamprey", attackType: AttackType.Melee },
  { name: "Muccus-Spitting Hagfish", attackType: AttackType.Cast },
  { name: "Drowned Shipwright", attackType: AttackType.Melee },
  { name: "Crown-of-Thorns Asteroidea", attackType: AttackType.Ranged },
  { name: "Daggermouthed Hunter", attackType: AttackType.Melee },
  { name: "Hydrophiinae ", attackType: AttackType.Melee },
  { name: "Ctenophore", attackType: AttackType.Cast },
  { name: "Kelpie", attackType: AttackType.Melee },
  { name: "Selkie", attackType: AttackType.Smite },
  { name: "Mermaid Husk", attackType: AttackType.Melee },
  { name: "Swarm of Bladefish", attackType: AttackType.Melee },
  { name: "Scorpaenidae", attackType: AttackType.Melee },
  { name: "Bullet Shark", attackType: AttackType.Cast },
  { name: "Reef Raider", attackType: AttackType.Cast },
  { name: "Sharkskin Orca", attackType: AttackType.Melee },
  { name: "Honeytrap Anemone ", attackType: AttackType.Cast },
  { name: "Colossal Bobbit Worm", attackType: AttackType.Ranged },
  { name: "Scouting Merman", attackType: AttackType.Melee },
  { name: "Blind Lurker", attackType: AttackType.Cast },
  { name: "Canoneer Turtle", attackType: AttackType.Melee },
  { name: "Pelecypod Titan", attackType: AttackType.Ranged },
  { name: "Frenzied Sphyraena", attackType: AttackType.Melee },
  { name: "Trench Predator", attackType: AttackType.Melee },
  { name: "Seductress Siren", attackType: AttackType.Smite },
  { name: "Spectral Galleon ", attackType: AttackType.Melee },
  { name: "Gulping Humpback", attackType: AttackType.Melee },
  { name: "Waterfiend", attackType: AttackType.Melee },
  { name: "Waterlogged Banshee", attackType: AttackType.Melee },
  { name: "Volcanic Crysopel", attackType: AttackType.Cast },
  { name: "Sentinel Naga", attackType: AttackType.Cast },
  { name: "Stoorworm", attackType: AttackType.Cast },
  { name: "Brachyura", attackType: AttackType.Smite },
  { name: "Skeletal Leviathan", attackType: AttackType.Ranged },
  { name: "Kurumthuli Kraken", attackType: AttackType.Cast },
].map(makeMonster(1.4, 8, "water"));

export async function getMonster(id: string): Promise<Monster | undefined> {
  return MONSTERS[id];
}
