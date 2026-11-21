import type { Meaning } from './data';

export type Pick = 'horses' | 'duck';

export interface Answers {
  firstPick?: Pick;
  feathersCount: boolean;
  meaning?: Meaning;
}

const KEY = 'hsd-answers';
const listeners = new Set<(a: Answers) => void>();

function load(): Answers {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { feathersCount: true, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { feathersCount: true };
}

let answers: Answers = load();

export const getAnswers = () => answers;

export function setAnswer(patch: Partial<Answers>) {
  answers = { ...answers, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn(answers));
}

export function onAnswers(fn: (a: Answers) => void) {
  listeners.add(fn);
  fn(answers);
}
