import {
  Monster,
  AttackType,
  HeroClasses,
  EnchantmentType,
  MonsterEquipment,
} from "types/graphql";

const MONSTERS: { [x in string]: Monster } = {};

function makeMonster(
  factor: number,
  amp: number,
  terrain: string,
  levelScale: number = 1
) {
  return function (
    { name, attackType }: { name: string; attackType: AttackType },
    index: number
  ): Monster {
    MONSTERS[name] = {
      id: name,

      level: Math.round(levelScale * (index + 1)),
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

export const FORBIDDEN_MONSTERS: Monster[] = [
  { name: "Twin-headed Viper", attackType: AttackType.Melee },
  { name: "Razorbeak Ibis", attackType: AttackType.Cast },
  { name: "Burrowing Haydeniana", attackType: AttackType.Ranged },
  { name: "Speartailed Pangolin", attackType: AttackType.Ranged },
  { name: "Common Slime", attackType: AttackType.Melee },
  { name: "Ferric Talpidae", attackType: AttackType.Melee },
  { name: "Gargantuan Pika", attackType: AttackType.Cast },
  { name: "Disgruntled Rockthrower", attackType: AttackType.Melee },
  { name: "Lancehorns", attackType: AttackType.Ranged },
  { name: "Corrupted Ent", attackType: AttackType.Melee },
  { name: "Hypnotic Maneating-Plant", attackType: AttackType.Melee },
  { name: "Highland Satyr", attackType: AttackType.Cast },
  { name: "Adolescent Harlequin", attackType: AttackType.Melee },
  { name: "Nameless Ghoul", attackType: AttackType.Smite },
  { name: "Acid-Jaw Soldier Ant", attackType: AttackType.Melee },
  { name: "Cliff Yeti", attackType: AttackType.Melee },
  { name: "Scorpion Centaur", attackType: AttackType.Melee },
  { name: "Wyvern", attackType: AttackType.Cast },
  { name: "Cave Horror", attackType: AttackType.Cast },
  { name: "Craggy Basilisk", attackType: AttackType.Melee },
  { name: "Living Fossil", attackType: AttackType.Cast },
  { name: "Lesser Demon", attackType: AttackType.Ranged },
  { name: "Sadistic Executioner", attackType: AttackType.Melee },
  { name: "Fallen Wingbearer", attackType: AttackType.Cast },
  { name: "Grizzled Manticore", attackType: AttackType.Melee },
  { name: "Matriarch Webslinger", attackType: AttackType.Ranged },
  { name: "Fissure Fiend", attackType: AttackType.Melee },
  { name: "Tormented Wight", attackType: AttackType.Melee },
  { name: "4-Armed Colossus", attackType: AttackType.Smite },
  { name: "Platinum Behemoth", attackType: AttackType.Melee },
  { name: "Contracted Ifrit", attackType: AttackType.Melee },
  { name: "Empyrean Prince", attackType: AttackType.Melee },
  { name: "Arctotherium Ursa", attackType: AttackType.Melee },
  { name: "Thermonuclear Devil", attackType: AttackType.Cast },
  { name: "Warlord Asura", attackType: AttackType.Cast },
  { name: "Beelzebub's Offshoot", attackType: AttackType.Cast },
  { name: "Tarrasque", attackType: AttackType.Smite },
  { name: "Shub Niggurath", attackType: AttackType.Ranged },
  { name: "Shai'taan", attackType: AttackType.Cast },
].map(makeMonster(1.6, 4096, "forbidden", 1.5));

type MonsterGearSlot = { level: number; enchantment?: EnchantmentType };

export const VOID_MONSTERS: {
  monster: Monster;
  equipment: MonsterEquipment;
}[] = [
  {
    monster: {
      id: "Void Monster",
      name: "Void Monster",
      level: 45,
      attackType: AttackType.Cast,
      combat: {
        health: 2000000000,
        maxHealth: 2000000000,
      },
      terrain: "void",
    },
    equipment: {
      bodyArmor: { level: 45, enchantment: EnchantmentType.SuperCounterSpell },
      handArmor: { level: 45, enchantment: EnchantmentType.SuperDexterity },
      legArmor: { level: 45, enchantment: EnchantmentType.SuperWisdom },
      headArmor: { level: 45, enchantment: EnchantmentType.SuperSorcVamp },
      footArmor: { level: 45, enchantment: EnchantmentType.BonusArmor },

      leftHand: { level: 34 },
      rightHand: { level: 34 },
    },
  },
];

export async function getMonster(id: string): Promise<Monster | undefined> {
  const monster = MONSTERS[id];
  if (!monster) {
    return VOID_MONSTERS.find(({ monster }) => monster.id === id)?.monster;
  }
  return { ...monster, combat: { ...monster.combat } };
}
