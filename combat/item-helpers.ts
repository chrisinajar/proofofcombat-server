export function getItemPassiveUpgradeTier({
  baseItem,
  level,
}: {
  baseItem?: string;
  level: number;
}): number {
  if (baseItem?.length) {
    if (level > 33) {
      return 2;
    }
    if (level > 32) {
      return 1;
    }
  }
  return 0;
}

