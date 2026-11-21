// Reads the real Lean file and turns pieces of it into highlighted HTML with tooltips.
import leanSource from '../../lean/HorseSizedDuck.lean?raw';
import toolchain from '../../lean/lean-toolchain?raw';

export const source = leanSource;
export const leanVersion = toolchain.trim().replace(/^.*:v?/, '');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The source with comments removed, for counting. */
const code = leanSource.replace(/\/-[\s\S]*?-\//g, '').replace(/--.*$/gm, '');
export const theoremCount = (code.match(/^theorem\s/gm) ?? []).length;
export const sorryCount = (code.match(/\bsorry\b/g) ?? []).length;

export interface Block {
  name: string;
  statement: string;
  proof: string;
}

/** One `theorem` from the file, split into its statement and its proof script. */
export function theorem(name: string): Block {
  const start = leanSource.indexOf(`theorem ${name} `);
  if (start < 0) throw new Error(`No theorem ${name} in the Lean file`);
  const rest = leanSource.slice(start);
  const end = rest.search(/\n\s*\n/);
  const text = end < 0 ? rest : rest.slice(0, end);
  const at = text.indexOf(':= by');
  return { name, statement: text.slice(0, at + 5), proof: text.slice(at + 5).replace(/^\n/, '') };
}

// ---------- Tooltips ----------

/** `def`s in the file, with their doc comments, so a name in code explains itself. */
const defs = new Map<string, string>();
for (const m of leanSource.matchAll(/(?:\/--\s*([\s\S]*?)\s*-\/\n)?def (\w+)([^\n]*(?:\n {2,}[^\n]*)*)/g)) {
  const doc = m[1]?.replace(/\s+/g, ' ').replace(/\*\*/g, '');
  const body = `def ${m[2]}${m[3]}`.replace(/\s+/g, ' ');
  defs.set(m[2], (doc ? `${doc} ` : '') + `Defined as: ${body}`);
}
defs.set('mallard', 'The site\'s mallard: 1.21 kg (BTO), 0.4 m tall, 0.7 kg per litre with feathers, 0.11 m² of skin. From src/data.ts.');
defs.set('pluckedMallard', 'The same mallard with no feathers, so it\'s denser: 0.95 kg per litre.');
defs.set('horse', 'The site\'s riding horse: 500 kg, 1.6 m at the shoulder, 1 kg per litre, 5 m² of skin.');
defs.set('PERSON', 'You: power 10, stamina 10, knowledge 10. On the simulator\'s scale an average person is 10 across the board.');
defs.set('HORSE', 'A full-size horse: power 34, stamina 30. From src/battle/fighters.ts.');
defs.set('DUCK', 'A full-size mallard: power 0.5, stamina 0.6. From src/battle/fighters.ts.');

const fields: Record<string, string> = {
  massKg: 'Mass in kilograms.',
  heightM: 'Standing height in metres (the horse at the shoulder).',
  densityKgPerL: 'Density in kilograms per litre. Feathers make a duck float high.',
  skinM2: 'Skin area in square metres.',
  power: 'Muscle. Sets how hard you hit.',
  stamina: 'Toughness. Sets health and armour.',
  knowledge: 'Fighting know-how. Adds a little to every hit. Animals have none.',
  sum: 'Add up every number in the list.',
  length: 'How many items are in the list.',
};

const words: Record<string, string> = {
  theorem: 'A claim Lean must check. If the proof underneath has any gap, the file refuses to compile.',
  def: 'A definition: tells Lean what a word means. These copy the simulator\'s code.',
  by: 'Starts a tactic proof: a step-by-step script that Lean replays and checks.',
  Rat: 'Rational numbers (fractions). They\'re exact, so 1.21 kg is 121/100 with no rounding error.',
  Prop: 'A statement that is either true or false.',
  List: 'A list of values, like a sequence of kicks.',
  Animal: 'A record with an animal\'s mass, height, density and skin area.',
  Stats: 'A fighter\'s stat block: power, stamina and knowledge.',
  k: 'The size dial. The horse is shrunk to k times its length (about 0.134 by weight) and the duck is grown by 1/k.',
  "k'": 'A second setting of the size dial, at least as big as k.',
  d: 'Any duck (feathered or plucked).',
  b: 'Any stat block.',
  m: 'Any mass.',
  raw: 'How hard a blow is thrown, before toughness soaks some up.',
  a: 'The defender\'s armour: stamina × 0.05.',
  x: 'A blow\'s strength.',
  y: 'A second blow, at least as strong as x.',
  roll: 'The dice. Each blow in the simulator lands at a random 75% to 125% of its strength.',
  kicks: 'Any list of kicks, each a number of damage points.',
  rw: 'Rewrite: swap something for a thing already proven equal to it.',
  unfold: 'Expand a defined word into its formula.',
  grind: 'An automatic prover. It collects the facts in view and closes the goal with algebra and linear arithmetic.',
  decide: 'Make Lean compute the answer. With +kernel, Lean\'s small trusted core does the arithmetic itself.',
  have: 'Prove a stepping-stone fact and give it a name for later.',
  show: 'State exactly what is being proved at this point.',
  exact: 'Hand over the precise proof of the goal.',
  intro: 'To prove "if A then B", assume A and name it.',
  constructor: 'Split an "if and only if" or an "and" into its separate parts.',
  refine: 'Give most of the proof now and leave marked holes (?_) to fill next.',
  obtain: 'Unpack a fact with several parts into named pieces.',
  generalize: 'Replace an expression with a fresh name, so the arithmetic sees one simple variable.',
  rcases: 'Split into cases, here one for each kind of duck.',
  simp: 'The simplifier: tidies the goal using known equations.',
  induction: 'Proof by induction: prove it for an empty list, then show adding one more item keeps it true.',
  push_cast: 'Move number-type conversions (whole numbers to fractions) out of the way.',
  exact_mod_cast: 'Like exact, but allowed to convert between whole numbers and fractions.',
  fun: 'A small function. In a proof, it turns "assume this" into "here is the consequence".',
  at: 'Apply the step to a hypothesis instead of the goal.',
  with: 'Names the cases or parts that follow.',
  rfl: 'Reflexivity: true by definition, nothing to compute.',
  sorry: 'Lean\'s "trust me" placeholder for a missing proof. This file has none.',
};

const ops: Record<string, string> = {
  '↔': 'If and only if: both sides are true together or false together.',
  '¬': 'Not.',
  '∧': 'And.',
  '∨': 'Or.',
  '∀': 'For all.',
  '∈': 'Is an item of.',
  '→': 'Implies.',
  ':=': 'Is defined as, or: here comes the proof.',
  '^': 'To the power of.',
  '≤': 'Less than or equal to.',
};

function tipFor(word: string): string | undefined {
  if (words[word]) return words[word];
  if (defs.has(word)) return defs.get(word);
  if (/^h[A-Za-z0-9']*$/.test(word)) return 'A hypothesis: an assumption the theorem is given, named so the proof can use it.';
  if (word.startsWith('Rat.')) return 'A ready-made fact about fractions from Lean\'s standard library.';
  const parts = word.split('.');
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (fields[last]) return (defs.has(parts[0]) ? `${parts[0]}'s ` : '') + fields[last].charAt(0).toLowerCase() + fields[last].slice(1);
    if (defs.has(last)) return defs.get(last);
  }
  return undefined;
}

const KEYWORDS = new Set(['theorem', 'def', 'by', 'fun', 'at', 'with', 'structure', 'where', 'show', 'have', 'obtain', 'induction', 'match']);
const TACTICS = new Set(['rw', 'unfold', 'grind', 'decide', 'exact', 'intro', 'constructor', 'refine', 'generalize', 'rcases', 'simp', 'push_cast', 'exact_mod_cast', 'rfl', 'sorry']);
const TYPES = new Set(['Rat', 'Prop', 'List', 'Animal', 'Stats', 'Nat']);

const TOKEN = /(--[^\n]*)|(\+kernel)|([A-Za-z_][A-Za-z0-9_'.]*)|(\d+)|(:=|↔|¬|∧|∨|∀|∈|→|≤|<|\^|⟨|⟩|\?_|[()[\]{}:,*/+-])|(\s+)|(.)/gu;

/** Highlight Lean code, with a tooltip on every word that has one. */
export function highlight(src: string): string {
  let out = '';
  for (const m of src.matchAll(TOKEN)) {
    const [t, comment, kernel, ident, num, op] = m;
    if (comment) out += `<span class="lc">${esc(t)}</span>`;
    else if (kernel) out += `<span class="lk">${t}</span>`;
    else if (ident) {
      const tip = tipFor(ident);
      const cls = KEYWORDS.has(ident) ? 'lk' : TACTICS.has(ident) ? 'lt' : TYPES.has(ident) ? 'ly' : defs.has(ident.split('.')[0]) ? 'ld' : 'li';
      out += tip ? `<span class="${cls} tipped" data-tip="${esc(tip)}">${esc(t)}</span>` : `<span class="${cls}">${esc(t)}</span>`;
    } else if (num) out += `<span class="ln">${t}</span>`;
    else if (op) {
      const tip = ops[t];
      out += tip ? `<span class="lo tipped" data-tip="${esc(tip)}">${esc(t)}</span>` : `<span class="lo">${esc(t)}</span>`;
    } else out += esc(t);
  }
  return out;
}
