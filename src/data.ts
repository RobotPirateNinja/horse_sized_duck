// Baseline animals. Sourced figures are marked; the rest are reasonable approximations.
// Sources (checked 20 Nov 2026):
//  - Mallard weight 1,210 g, all adults: BTO BirdFacts https://www.bto.org/understanding-birds/birdfacts/mallard
//  - Mallard length 50–65 cm: Wikipedia, Mallard https://en.wikipedia.org/wiki/Mallard
//  - Saddle horse average 500 kg: Wikipedia, Horse body mass https://en.wikipedia.org/wiki/Horse_body_mass
export interface Animal {
  name: string;
  massKg: number;
  heightM: number; // standing height (duck, head up) or height at the shoulder (horse)
  lengthM: number;
  densityKgPerL: number;
  skinM2: number;
}

export const mallard: Animal = {
  name: 'Mallard',
  massKg: 1.21, // BTO
  heightM: 0.4, // approximate, head up
  lengthM: 0.58, // middle of 50–65 cm
  densityKgPerL: 0.7, // approximate, with feathers; floats high
  skinM2: 0.11, // approximate (Meeh formula for birds)
};

/** A plucked duck: no feather bulk, so roughly body density. */
export const pluckedMallard: Animal = { ...mallard, name: 'Plucked mallard', densityKgPerL: 0.95 };

export const horse: Animal = {
  name: 'Riding horse',
  massKg: 500, // Wikipedia: average saddle horse
  heightM: 1.6, // approximate, at the shoulder
  lengthM: 2.4,
  densityKgPerL: 1.0,
  skinM2: 5, // approximate
};

export type Meaning = 'weight' | 'height' | 'volume' | 'skin';

export const meanings: { id: Meaning; label: string }[] = [
  { id: 'weight', label: 'Weight' },
  { id: 'height', label: 'Height' },
  { id: 'volume', label: 'Volume' },
  { id: 'skin', label: 'Skin area' },
];

export interface Matchup {
  meaning: Meaning;
  /** Linear scale applied to the horse to make it duck-sized. The duck is scaled by 1 / k. */
  k: number;
  tinyHorseKg: number;
  hordeKg: number;
  giantDuckKg: number;
  giantDuckHeightM: number;
  tinyHorseHeightM: number;
}

const HORDE = 100;

/** Linear factor that shrinks the horse until it matches the duck under a given meaning. */
export function linearFactor(meaning: Meaning, duck: Animal = mallard, big: Animal = horse): number {
  switch (meaning) {
    case 'weight':
      return Math.cbrt(duck.massKg / big.massKg);
    case 'height':
      return duck.heightM / big.heightM;
    case 'volume':
      return Math.cbrt(duck.massKg / duck.densityKgPerL / (big.massKg / big.densityKgPerL));
    case 'skin':
      return Math.sqrt(duck.skinM2 / big.skinM2);
  }
}

export function matchup(meaning: Meaning, duck: Animal = mallard): Matchup {
  const k = linearFactor(meaning, duck);
  const tinyHorseKg = horse.massKg * k ** 3;
  return {
    meaning,
    k,
    tinyHorseKg,
    hordeKg: tinyHorseKg * HORDE,
    giantDuckKg: duck.massKg / k ** 3,
    giantDuckHeightM: duck.heightM / k,
    tinyHorseHeightM: horse.heightM * k,
  };
}

export const kgToLb = (kg: number) => kg * 2.20462;
export const mToFt = (m: number) => m * 3.28084;

export function formatLb(kg: number): string {
  const lb = kgToLb(kg);
  return lb < 10 ? `${lb.toFixed(1)} lb` : `${Math.round(lb).toLocaleString('en-US')} lb`;
}
