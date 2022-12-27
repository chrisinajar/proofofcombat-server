import { Unit } from "./unit";

export class Hero extends Unit {
  constructor() {
    super();
    this.applyModifier("BasicHeroModifier");
  }
}
