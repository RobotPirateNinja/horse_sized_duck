// The "Formally verified" modal: the Lean theorems, explained.
import { horse, linearFactor, mallard, pluckedMallard } from '../data';
import { highlight, leanVersion, sorryCount, theorem, theoremCount } from './lean';
import './proof.css';

const FILE_URL = 'https://github.com/RobotPirateNinja/horse_sized_duck/blob/main/lean/HorseSizedDuck.lean';

/** A word in the prose with a tooltip. */
const term = (text: string, tip: string) => `<span class="term tipped" tabindex="0" data-tip="${tip.replace(/"/g, '&quot;')}">${text}</span>`;

const T = {
  lean: term('Lean', 'A programming language whose compiler checks mathematical proofs. If a proof compiles, every step in it is correct.'),
  theorem: term('theorem', 'A statement that has been proved. In Lean, one with a gap in its proof won\'t compile.'),
  model: term('model', 'Our rules for the fight: the animals\' numbers and the simulator\'s formulas, written out in Lean.'),
  kernel: term('kernel', 'The small core of Lean that re-checks every proof. It\'s the only part you have to trust.'),
  sorry: term('sorry', 'Lean\'s placeholder for "I\'ll prove this later". A file with one compiles with a warning, so we count them: zero.'),
  axioms: term('standard axioms', 'The three starting assumptions every Lean proof builds on (propext, Classical.choice, Quot.sound). Nothing extra was added.'),
  k: term('k', 'The size dial: the horses are shrunk to k times their length and the duck is grown by 1/k.'),
  squareCube: term('square–cube law', 'Grow something by k and its area (muscle cross-section) grows by k², but its volume (weight) grows by k³.'),
  worst: term('worst case', 'Proved for every possible dice roll, not just on average.'),
  monotone: term('monotonic', 'Only ever moves one way as the input grows.'),
  iff: term('exactly when', '"If and only if": the two statements are always both true or both false.'),
};

interface Card {
  title: string;
  names: string[];
  plain: string;
  why: string;
  how: string;
  extra?: () => string;
}

function scaleStrip(): string {
  const breakEven = Math.pow(mallard.massKg / (100 * horse.massKg), 1 / 6);
  const rows = [
    { label: 'Weight', k: linearFactor('weight'), duck: false },
    { label: 'Volume, plucked', k: linearFactor('volume', pluckedMallard), duck: false },
    { label: 'Skin area', k: linearFactor('skin'), duck: false },
    { label: 'Volume', k: linearFactor('volume'), duck: false },
    { label: 'Height', k: linearFactor('height'), duck: true },
  ];
  const lo = 0.1,
    hi = 0.28;
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  return `
  <figure class="strip" aria-label="Where each meaning of sized puts the size dial">
    <div class="strip-track">
      <div class="strip-zone horses" style="width:${pct(breakEven)}%"><span>Fight the horses</span></div>
      <div class="strip-zone duck" style="left:${pct(breakEven)}%"><span>Fight the duck</span></div>
      <div class="strip-line tipped" tabindex="0" style="left:${pct(breakEven)}%" data-tip="Break-even: k = ${breakEven.toFixed(3)}. Proved to lie between 0.170 and 0.171."></div>
      ${rows
        .map(
          (r, i) =>
            `<button type="button" class="strip-dot ${r.duck ? 'duck' : 'horses'} tipped" style="left:${pct(r.k)}%; --row:${i}" data-tip="By ${r.label.toLowerCase()}, k = ${r.k.toFixed(3)}: horses ${(r.k * 100).toFixed(1)}% of real size. Verdict: fight the ${r.duck ? 'duck' : 'horses'}."><span>${r.label}</span></button>`,
        )
        .join('')}
    </div>
    <figcaption>The size dial ${T.k} for each meaning of "sized", against the proved break-even point. Hover or tap a dot.</figcaption>
  </figure>`;
}

const cards: Card[] = [
  {
    title: 'The square–cube law',
    names: ['square_cube'],
    plain: `Scale any animal by ${T.k} and its strength per kilogram is divided by ${T.k}.`,
    why: `This is the ${T.squareCube} doing its work. Grown to horse weight, the duck is 7.4 times longer but only a seventh as strong for its size as a real mallard. Big animals need thick legs for a reason.`,
    how: 'Unfold the two scaling rules (strength times k², weight times k³), turn every division into multiplying by an inverse, and let the automatic prover cancel the k² against the k³.',
  },
  {
    title: 'The break-even theorem',
    names: ['horsesEasier_iff', 'breakEven_bounds'],
    plain: `The herd is the easier fight ${T.iff} ${T.k}⁶ is less than the duck's mass divided by the mass of 100 horses. With the site's numbers, that tipping point is a horse shrunk to between 17.0% and 17.1% of its real size.`,
    why: `Why the sixth power? The dial counts twice: each horse shrinks by ${T.k}³ and the duck grows by 1/${T.k}³. So the whole question comes down to one number.`,
    how: 'Multiply both sides of "herd mass < duck mass" by k³ (allowed, since it\'s positive) and rearrange. The bounds are pure arithmetic, which Lean\'s kernel computes exactly in fractions.',
    extra: scaleStrip,
  },
  {
    title: 'The answer depends on the question',
    names: ['weight_verdict', 'volume_verdict', 'skin_verdict', 'height_verdict'],
    plain: 'Size the animals by weight, volume (feathers or not) or skin area, and the horses are the easier fight. Size them by height, and the duck is.',
    why: 'It\'s the site\'s whole point, now with a certificate. Note the trick for weight and skin: their dial is a cube or square root, which isn\'t a fraction, so the theorems hold for any k whose cube (or square) is the right ratio. Lean never needs the decimal.',
    how: 'Each one feeds its meaning\'s k into the break-even theorem, then Lean computes the comparison exactly.',
  },
  {
    title: 'The verdict only moves one way',
    names: ['duck_stays_easier'],
    plain: `Once the duck is the easier fight, turning the size dial up (bigger horses, smaller duck) never flips it back.`,
    why: `The verdict is ${T.monotone}. There's exactly one tipping point, not a confusing back-and-forth.`,
    how: 'If k ≤ k\' then k⁶ ≤ k\'⁶ (proved from scratch by multiplying inequalities), and the break-even theorem does the rest.',
  },
  {
    title: 'A bigger duck is never easier',
    names: ['bigger_duck_never_easier'],
    plain: 'Grow the duck and its health, the strength of its hits and its toughness can only go up.',
    why: 'An honest footnote: in the simulator a bigger duck also gets a little slower, so we didn\'t claim "bigger is scarier in every way". Lean only lets you prove what\'s true.',
    how: 'Every one of those three is k² times its normal value. Since k² grows with k, each one does too.',
  },
  {
    title: 'Toughness: small blows bounce off',
    names: ['landed_le_raw', 'landed_le_ratio', 'landed_mono'],
    plain: 'Under the site\'s toughness rule, a blow never lands harder than it was thrown, a harder throw always lands harder, and a blow much weaker than the defender\'s armour barely lands at all.',
    why: 'This is the toughness-for-size fix. A kick a tenth the size of your armour lands at most a tenth of itself, which is why a pocket-sized horse can\'t hurt you much.',
    how: 'Clear the fraction (raw² / (raw + armour)) by multiplying through by the positive denominator, then compare the polynomials.',
  },
  {
    title: 'The stomp theorem',
    names: ['every_stomp_kills', 'kick_is_small', 'survive_285'],
    plain: `Against weight-sized horses, even your unluckiest stomp kills a horse outright. Each of their kicks lands at most 0.35 damage, even on their luckiest roll, so you survive any 285 kicks.`,
    why: `These are ${T.worst} results: they hold for every roll of the simulator's dice. They don't prove you win the whole brawl, because that also depends on how many horses reach you at once.`,
    how: 'The horses\' size dial is about 0.134, so first prove k ≤ 0.135 from its cube. Then a horse has at most 5.6 health while your weakest stomp lands over 7.4. Kicks follow the same way, and the 285 comes from adding up a list of kicks by induction.',
  },
];

function cardHtml(c: Card, i: number): string {
  const blocks = c.names.map(theorem);
  const lines = blocks.reduce((n, b) => n + b.proof.split('\n').length, 0);
  return `
  <article class="thm">
    <header class="thm-head">
      <span class="thm-num">${i + 1}</span>
      <h3>${c.title}</h3>
      <span class="thm-check tipped" tabindex="0" data-tip="Checked by Lean ${leanVersion}.">✓ proved</span>
    </header>
    <p class="thm-plain">${c.plain}</p>
    ${c.extra ? c.extra() : ''}
    <p class="thm-why">${c.why}</p>
    <div class="thm-code">
      <div class="code-label">In Lean</div>
      ${blocks.map((b) => `<pre class="lean"><code>${highlight(b.statement)} <span class="lc">…</span></code></pre>`).join('')}
    </div>
    <details class="thm-proof">
      <summary>Show the proof <span>${lines} lines</span></summary>
      <p class="thm-how"><strong>How it goes:</strong> ${c.how}</p>
      ${blocks.map((b) => `<pre class="lean"><code>${highlight(b.statement + '\n' + b.proof)}</code></pre>`).join('')}
    </details>
  </article>`;
}

export function proofButtonHtml(): string {
  return `
  <button type="button" class="proof-launch" data-proof-open aria-haspopup="dialog">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 2.5 19.5 5.5v6c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-6z" class="shield"/>
      <path d="m8.4 12.2 2.5 2.5 4.9-5.2" class="tick"/>
    </svg>
    <span>Formally verified</span>
  </button>`;
}

function modalHtml(): string {
  return `
  <dialog class="proof-modal" aria-labelledby="proof-title">
    <div class="proof-inner">
      <header class="proof-top">
        <div>
          <p class="eyebrow">Formally verified</p>
          <h2 id="proof-title">We proved it. Well, the model.</h2>
        </div>
        <button type="button" class="proof-close" data-proof-close aria-label="Close">×</button>
      </header>
      <p class="proof-lede">We wrote the site's rules in ${T.lean}, a language where the compiler checks math proofs, and proved ${theoremCount} ${T.theorem}s about them. If any step were wrong, the file wouldn't compile.</p>
      <ul class="proof-badges">
        <li>${theoremCount} theorems</li>
        <li class="tipped" tabindex="0" data-tip="Counted in the real file this page loads.">${sorryCount} × ${T.sorry}</li>
        <li class="tipped" tabindex="0" data-tip="Plain Lean ${leanVersion}, no add-on maths library.">Lean ${leanVersion}</li>
        <li>Only the ${T.axioms}</li>
      </ul>
      <aside class="proof-caveat">
        <strong>The catch.</strong> Lean proves things about our ${T.model}, not about real ducks. It certifies "given these rules, this follows". Whether a 500 kg mallard really behaves like our rules say is a question for biology (and a very brave volunteer).
      </aside>
      <p class="proof-hint">Hover or tap anything <span class="term">underlined</span> or coloured in the code for an explanation.</p>
      ${cards.map(cardHtml).join('')}
      <footer class="proof-foot">
        <p>Every proof is re-checked by Lean's ${T.kernel}. The code on this page is read straight from <a href="${FILE_URL}" target="_blank" rel="noopener noreferrer">lean/HorseSizedDuck.lean</a>, the same file Lean checks. To check it yourself, install Lean and run <code>lake build</code> in the <code>lean</code> folder.</p>
      </footer>
    </div>
    <div class="proof-tip" role="tooltip" id="proof-tip" hidden></div>
  </dialog>`;
}

export function mountProof(root: HTMLElement) {
  const opener = root.querySelector<HTMLButtonElement>('[data-proof-open]');
  if (!opener) return;
  let dialog: HTMLDialogElement | null = null;

  function build() {
    document.body.insertAdjacentHTML('beforeend', modalHtml());
    const d = document.body.lastElementChild as HTMLDialogElement;
    const tip = d.querySelector<HTMLElement>('.proof-tip')!;
    let current: HTMLElement | null = null;

    const show = (el: HTMLElement) => {
      current?.removeAttribute('aria-describedby');
      current = el;
      tip.textContent = el.dataset.tip ?? '';
      tip.hidden = false;
      el.setAttribute('aria-describedby', 'proof-tip');
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
      const above = r.top - t.height - 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${above > 8 ? above : r.bottom + 8}px`;
    };
    const hide = () => {
      current?.removeAttribute('aria-describedby');
      current = null;
      tip.hidden = true;
    };
    const target = (e: Event) => (e.target as Element).closest<HTMLElement>('.tipped');

    d.addEventListener('pointerover', (e) => {
      if ((e as PointerEvent).pointerType === 'touch') return;
      const el = target(e);
      if (el) show(el);
    });
    d.addEventListener('pointerout', (e) => {
      if ((e as PointerEvent).pointerType === 'touch') return;
      if (target(e) && !target(e)!.contains((e as PointerEvent).relatedTarget as Node)) hide();
    });
    d.addEventListener('focusin', (e) => {
      const el = target(e);
      if (el) show(el);
      else hide();
    });
    d.addEventListener('click', (e) => {
      const el = target(e);
      if (el) {
        if (current === el) hide();
        else show(el);
        return;
      }
      hide();
      // A click on the backdrop (outside the inner panel) closes the dialog.
      if (e.target === d) d.close();
    });
    d.querySelector('.proof-inner')!.addEventListener('scroll', hide, { passive: true });
    d.querySelector('[data-proof-close]')!.addEventListener('click', () => d.close());
    d.addEventListener('close', () => {
      hide();
      document.documentElement.classList.remove('proof-open');
      opener!.focus();
    });
    return d;
  }

  opener.addEventListener('click', () => {
    dialog ??= build();
    document.documentElement.classList.add('proof-open');
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.proof-inner')!.scrollTop = 0;
  });
}
