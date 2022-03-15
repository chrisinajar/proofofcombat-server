function runSkillOdds(level: number, boost: number): boolean {
  return Math.random() < getSkillOdds(level * boost);
}

function getSkillOdds(level: number): number {
  return 1 / Math.pow(2, level / 2);
}
