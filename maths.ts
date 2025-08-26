// todo: move this somewhere else
export function calculateRating(stat: number): number {
  return diminishingReturn(stat, 8, 1.8);
}

export function calculateHitChance(
  attackerRating: number,
  defenderRating: number,
): number {
  const steepness = 2;
  const minHit = 0.4;
  const maxHit = 1;

  return opposedSigmoidOdds(
    attackerRating,
    defenderRating,
    steepness,
    minHit,
    maxHit,
  );
}

// raw methods

export function diminishingReturn(
  value: number,
  stretch: number,
  steepness: number,
): number {
  return stretch * Math.pow(value, 1 / steepness);
}

export function opposedSigmoidOdds(
  attackerValue: number,
  defenderValue: number,
  steepness: number = 1,
  min: number = 0,
  max: number = 1,
) {
  const logRatio = Math.log(attackerValue / defenderValue);
  const sigmoid = 1 / (1 + Math.exp(-logRatio * steepness));

  return min + (max - min) * sigmoid;
}
