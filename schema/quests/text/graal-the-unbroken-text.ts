export const questEvents = {
  opener: [
    "Graal stands unmoving, eyes on your stance.",
    '"You seek proof? Then offer pain."',
  ],
  victory: {
    // Seeded by hero id; pick one at runtime for variety
    lines: [
      '"You carry a story that cuts true. Keep walking."',
      '"Stone remembers those who strike with purpose."',
      '"Today, you were the blade—and I the whetstone."',
    ],
  },
  loss: {
    // General taunt followed by a hint; pick based on analysis
    preface: '"Every challenger teaches me. You will be no different."',
    hints: {
      low_resistance:
        '"Your guard against their element is thin. Temper your soul."',
      poor_sustain:
        '"You bleed faster than you bite. Find breath between blows."',
      low_accuracy:
        '"Your footwork betrays hesitation. Land strikes, or die forgotten."',
      glass_cannon:
        '"You burn bright, then vanish. Carry a shield even in flame."',
      slow_cadence: '"Your rhythm is mud. Shorten the space between strikes."',
    },
  },
  consolation: {
    choose:
      '"Choose your tempering: Shame‑Forged, or Scabsteel. Return sharper."',
  },
};
