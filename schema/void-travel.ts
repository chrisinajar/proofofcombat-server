import { Hero } from "types/graphql";

import { BaseContext } from "./context";
import { VOID_MONSTERS } from "./monster/monster-lists";
import { rebirth } from "./quests/rebirth";

export const VoidAdventures = {
  glowingAberration: {
    monsters: ["void-monster"],
  },
};

type AdventureIds = keyof typeof VoidAdventures;

export async function endVoidTravel(context: BaseContext, hero: Hero) {
  // remove all the monsters from the tile the player was on
  const monsterList = await context.db.monsterInstances.getInLocation(
    hero.location,
  );
  await Promise.all(
    monsterList.map((monster) => context.db.monsterInstances.del(monster)),
  );
  // move the player back to the default map but preserve their x,y coordinates
  hero.location.map = "default";
  // hero = rebirth(context, hero);
}

export async function startVoidTravel(
  context: BaseContext,
  hero: Hero,
  adventureId: AdventureIds,
) {
  const adventure = VoidAdventures[adventureId];

  // adventure
  // select location in void
  const location = [
    Math.floor(Math.random() * 128),
    Math.floor(Math.random() * 96),
  ];
  // if there's already a player, try again a few times
  let didFindSpace = false;
  for (let i = 0; i < 5; ++i) {
    const existing = await context.db.hero.getHeroesInLocation({
      map: "void",
      x: location[0],
      y: location[1],
    });
    if (existing.length === 0) {
      didFindSpace = true;
      break;
    }
    location[0] = Math.floor(Math.random() * 128);
    location[1] = Math.floor(Math.random() * 96);
  }

  // if we still can't find one, then reset the void and trigger catacalism
  if (!didFindSpace) {
    await resetVoid(context);
    return;
  }
  // teleport the player to the void
  hero.location = {
    map: "void",
    x: location[0],
    y: location[1],
  };
  // create all the monster instances
  await Promise.all(
    adventure.monsters.map((monsterId) => {
      const monster = VOID_MONSTERS.find(
        ({ monster }) => monster.id === monsterId,
      );
      if (!monster) {
        console.error("Could not find void monster", monsterId);
        return;
      }
      context.db.monsterInstances.create({
        ...monster,
        location: {
          map: "void",
          x: location[0],
          y: location[1],
        },
      });
    }),
  );
  // heal the player back to full
  hero.combat.health = hero.combat.maxHealth;

  // save the hero, save the world
  await context.db.hero.put(hero);
}

async function resetVoid(context: BaseContext) {
  // iterate over all the void monsters and delete them
  const iterator = context.db.monsterInstances.db.iterate({});
  // ? iterator.seek(...); // You can first seek if you'd like.
  for await (const { key, value } of iterator) {
    if (value.location?.map === "void") {
      await context.db.monsterInstances.del(value);
    }
  }

  // iterate over all the heroes in the void and move them back to the default map
  const heroIterator = context.db.hero.db.iterate({});
  for await (const { key, value } of heroIterator) {
    if (value.location?.map === "void") {
      // get the actual hero instance for LRU refs
      const hero = await context.db.hero.get(key);
      hero.location.map = "default";

      await context.db.hero.put(hero);
    }
  }

  ///@TODO trigger cataclysm event, whatever that means...
}
