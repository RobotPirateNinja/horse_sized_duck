// Who fights: an average person against the reader's pick, sized by the reader's meaning.
import { horse, mallard, matchup, pluckedMallard, type Meaning } from '../data';
import { Fighter, type UnitStats } from './ubs';

export type Opponent = 'horses' | 'duck';

// Base stats at each animal's natural size, on the UBS scale where an average
// person is 10 across the board. Assumptions, open to tuning.
const PERSON: UnitStats = { power: 10, smarts: 10, knowledge: 10, stamina: 10, agility: 10, social: 5 };
const HORSE: UnitStats = { power: 34, smarts: 3, knowledge: 0, stamina: 30, agility: 9, social: 14 };
const DUCK: UnitStats = { power: 0.5, smarts: 2, knowledge: 0, stamina: 0.6, agility: 16, social: 12 };

/**
 * Rescale an animal's stats when its linear size changes by `k`.
 * Strength and toughness follow muscle cross-section (k²). Agility rises as
 * animals get smaller (k^-½), within UBS's 1–30 range. Smarts, knowledge and
 * social don't depend on size.
 */
export function scaleStats(base: UnitStats, k: number): UnitStats {
  return {
    ...base,
    power: base.power * k * k,
    stamina: base.stamina * k * k,
    agility: Math.min(30, Math.max(1, base.agility / Math.sqrt(k))),
  };
}

export interface Lineup {
  fighters: Fighter[];
  /** Linear scale of the opponent relative to its real size. */
  scale: number;
  halfW: number;
  halfH: number;
}

export function buildLineup(opponent: Opponent, meaning: Meaning, feathersCount: boolean): Lineup {
  const duck = meaning === 'volume' && !feathersCount ? pluckedMallard : mallard;
  const m = matchup(meaning, duck);
  const fighters: Fighter[] = [];

  if (opponent === 'duck') {
    const s = 1 / m.k;
    const len = duck.lengthM * s;
    const halfW = Math.max(4, len * 1.6);
    const halfH = halfW * 0.4;
    fighters.push(person(-halfW * 0.6, 0));
    fighters.push(
      new Fighter({
        id: 'duck',
        kind: 'duck',
        side: 'opponent',
        stats: scaleStats(DUCK, s),
        radius: len * 0.35,
        reach: len * 0.3, // neck and bill
        x: halfW * 0.5,
        y: 0,
      }),
    );
    return { fighters, scale: s, halfW, halfH };
  }

  const s = m.k;
  const len = horse.lengthM * s;
  const halfW = Math.max(5, len * 16);
  const halfH = halfW * 0.4;
  fighters.push(person(-halfW * 0.6, 0));
  const cols = 10;
  const gap = len * 1.25;
  for (let i = 0; i < 100; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    fighters.push(
      new Fighter({
        id: `horse-${i}`,
        kind: 'horse',
        side: 'opponent',
        stats: scaleStats(HORSE, s),
        radius: len * 0.3,
        reach: len * 0.25, // a kick
        x: halfW * 0.2 + c * gap + (r % 2) * gap * 0.5,
        y: (r - 4.5) * gap * 0.8,
      }),
    );
  }
  return { fighters, scale: s, halfW, halfH };
}

function person(x: number, y: number) {
  return new Fighter({
    id: 'person',
    kind: 'person',
    side: 'challenger',
    stats: PERSON,
    radius: 0.25,
    reach: 0.6, // a kick or a punch
    sweep: 0.35, // a stomp can catch more than one small thing
    x,
    y,
  });
}
