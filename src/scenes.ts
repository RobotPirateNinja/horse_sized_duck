import { gsap } from 'gsap';
import { duckArt, horseArt, personArt, place } from './art';
import { formatLb, horse, mallard, matchup, meanings, mToFt, pluckedMallard, type Matchup, type Meaning } from './data';
import { getAnswers, onAnswers, setAnswer, type Pick } from './state';
import { battleHtml, mountBattle } from './battle/view';
import { mountProof, proofButtonHtml } from './proof/modal';
import { heightDecor, skinDecor, volumeDecor, weightDecor, type Decor, type StageCtx } from './decor';

export interface Scene {
  id: string;
  html: () => string;
  /** Wire up interactivity. Runs once. */
  setup?: (el: HTMLElement) => void;
  /** Build the scroll animation. `tl` is scrubbed by the section's ScrollTrigger. */
  animate?: (el: HTMLElement, tl: gsap.core.Timeline) => void;
  /** Show the final state with no motion (reduced-motion mode). */
  still?: (el: HTMLElement) => void;
}

const $ = <T extends Element = HTMLElement>(el: ParentNode, sel: string) => el.querySelector(sel) as T;

/** The side with less total mass is the easier fight. */
export function easierFight(m: Matchup): Pick {
  return m.hordeKg < m.giantDuckKg ? 'horses' : 'duck';
}

function verdictText(m: Matchup, label: string) {
  const pick = easierFight(m);
  const ratio = pick === 'horses' ? m.giantDuckKg / m.hordeKg : m.hordeKg / m.giantDuckKg;
  return pick === 'horses'
    ? `Verdict by ${label.toLowerCase()}: <strong>fight the horses.</strong> The duck outweighs the whole herd ${ratio.toFixed(1)} to 1.`
    : `Verdict by ${label.toLowerCase()}: <strong>fight the duck.</strong> The herd outweighs it ${ratio.toFixed(1)} to 1.`;
}

// ---------- 1. The question ----------

// Each herd horse is drawn HERD_HORSE_W px wide. Treat them as duck-sized (by weight), which fixes
// the scene's px-per-metre. The duck starts mallard-sized at that scale and grows by 1/k until it is
// a horse-sized duck next to the herd.
const HERD_HORSE_W = 30;
const introK = matchup('weight').k;
const herdPpm = (HERD_HORSE_W * horseArt.height) / horseArt.width / (horseArt.meters * introK);
const bigDuckPpm = herdPpm / introK;

const herd = () => {
  let out = '';
  const w = HERD_HORSE_W;
  for (let i = 0; i < 100; i++) {
    const col = i % 20;
    const row = Math.floor(i / 20);
    const x = 560 + col * 21 + (row % 2) * 10;
    const y = 250 + row * 34;
    out += `<g class="herd-horse" transform="translate(${x} ${y})"><g transform="scale(${-w / horseArt.width} ${w / horseArt.width}) translate(${-horseArt.width / 2} ${-horseArt.height})">${horseArt.svg}</g></g>`;
  }
  return out;
};

const intro: Scene = {
  id: 'question',
  html: () => `
    <div>
      <p class="eyebrow">A scientific study</p>
      <h1>Would you rather fight 100 duck-sized horses, or one horse-sized duck?</h1>
      <div class="choices" role="group" aria-label="Your first answer">
        <button class="choice" data-pick="horses" aria-pressed="false">100 duck-sized horses</button>
        <button class="choice" data-pick="duck" aria-pressed="false">1 horse-sized duck</button>
      </div>
    </div>
    <div class="canvas"><svg viewBox="0 0 1000 440" aria-hidden="true">
      <line class="ground" x1="0" y1="410" x2="1000" y2="410"/>
      ${place(duckArt, 'big-duck', 260, 410, bigDuckPpm)}
      <g class="herd">${herd()}</g>
    </svg></div>
    <p class="lede">Scroll to begin the study.</p>`,
  setup(el) {
    const buttons = el.querySelectorAll<HTMLButtonElement>('[data-pick]');
    buttons.forEach((b) => b.addEventListener('click', () => setAnswer({ firstPick: b.dataset.pick as Pick })));
    onAnswers((a) => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pick === a.firstPick))));
  },
  animate(el, tl) {
    tl.from(el.querySelectorAll('.herd-horse'), { x: 600, opacity: 0, stagger: 0.004, duration: 0.4, ease: 'power2.out' });
    // Grow the duck from mallard-sized to horse-sized while the herd spreads out, finishing as the
    // pin releases. Interpolate on a log scale so the growth feels even.
    const scaler = $(el, '.big-duck .scaler');
    const proxy = { p: 0 };
    const grow = () => gsap.set(scaler, { scale: introK ** (1 - proxy.p), transformOrigin: '50% 100%' });
    grow();
    tl.to(proxy, { p: 1, duration: 1, ease: 'power1.inOut', onUpdate: grow }, 0);
  },
  still(el) {
    gsap.set($(el, '.big-duck .scaler'), { scale: 1 });
  },
};

// ---------- 2. The catch ----------

const theCatch: Scene = {
  id: 'catch',
  html: () => `
    <div>
      <p class="eyebrow">The catch</p>
      <h2>The question hides a word that does all the work: <span class="word-sized">“sized.”</span></h2>
      <p class="lede">Sized by what? There are at least four reasonable readings, and each one gives a different fight.</p>
      <div class="meaning-tags">${meanings.map((m) => `<span class="meaning-tag">${m.label}</span>`).join('')}</div>
    </div>
    <div></div><div></div>`,
  animate(el, tl) {
    tl.from($(el, '.word-sized'), { scale: 1.6, duration: 0.3 })
      .from(el.querySelectorAll('.meaning-tag'), { y: 40, opacity: 0, stagger: 0.15, duration: 0.3 });
  },
};

// ---------- 3–6. One scene per meaning ----------

interface MeaningCopy {
  meaning: Meaning;
  eyebrow: string;
  title: string;
  lede: string;
  extra?: string;
  decor?: Decor;
}

function meaningScene(copy: MeaningCopy): Scene {
  const label = meanings.find((m) => m.id === copy.meaning)!.label;
  const current = () =>
    matchup(copy.meaning, copy.meaning === 'volume' && !getAnswers().feathersCount ? pluckedMallard : mallard);
  // Fit the tallest thing that will appear on stage.
  const tallest = Math.max(
    ...[mallard, pluckedMallard].map((d) => matchup(copy.meaning, d).giantDuckHeightM * 1.12),
    horse.heightM * 1.4,
    1.8,
    copy.decor?.tallest ?? 0,
  );
  const ppm = 360 / tallest;
  const ctx: StageCtx = { ppm, ground: 410, duckX: 300, horseX: 740 };
  let progress = 0;

  function render(el: HTMLElement, p: number) {
    progress = p;
    const m = current();
    // Interpolate on a log scale so growth feels even.
    const horseScale = m.k ** p;
    const duckScale = (1 / m.k) ** p;
    gsap.set($(el, '.m-horse .scaler'), { scale: horseScale, transformOrigin: '50% 100%' });
    gsap.set($(el, '.m-duck .scaler'), { scale: duckScale, transformOrigin: '50% 100%' });
    const lerpLog = (a: number, b: number) => a * (b / a) ** p;
    $(el, '[data-r="horse"]').textContent = formatLb(lerpLog(horse.massKg, m.tinyHorseKg));
    $(el, '[data-r="herd"]').textContent = formatLb(lerpLog(horse.massKg * 100, m.hordeKg));
    $(el, '[data-r="duck"]').textContent = formatLb(lerpLog(mallard.massKg, m.giantDuckKg));
    $(el, '[data-r="duck-h"]').textContent = `${mToFt(lerpLog(mallard.heightM, m.giantDuckHeightM)).toFixed(1)} ft`;
    $(el, '.verdict').innerHTML = verdictText(m, label);
    const svg = $<SVGSVGElement>(el, '.canvas svg');
    copy.decor?.render?.(svg, p, m, ctx, copy.meaning === 'volume' && !getAnswers().feathersCount);
    svg.classList.toggle('settled', p > 0.98);
  }

  return {
    id: copy.meaning,
    html: () => `
      <div>
        <p class="eyebrow">${copy.eyebrow}</p>
        <h2>${copy.title}</h2>
        <p class="lede">${copy.lede}</p>
        ${copy.extra ?? ''}
      </div>
      <div class="canvas"><svg class="meaning-svg" viewBox="0 0 1000 440" aria-hidden="true">
        <line class="ground" x1="0" y1="410" x2="1000" y2="410"/>
        ${copy.decor?.back?.(ctx) ?? ''}
        ${place(personArt, 'm-person', 520, 410, ppm)}
        ${place(duckArt, 'm-duck', ctx.duckX, 410, ppm)}
        ${place(horseArt, 'm-horse', ctx.horseX, 410, ppm, true)}
        ${copy.decor?.front?.(ctx) ?? ''}
      </svg></div>
      <div>
        <div class="readouts">
          <div class="readout"><div class="label">One horse</div><div class="value" data-r="horse"></div></div>
          <div class="readout"><div class="label">The herd of 100</div><div class="value" data-r="herd"></div></div>
          <div class="readout"><div class="label">The duck</div><div class="value" data-r="duck"></div></div>
          <div class="readout"><div class="label">Duck height</div><div class="value" data-r="duck-h"></div></div>
        </div>
        <p class="verdict"></p>
      </div>`,
    setup(el) {
      render(el, 0);
      const toggle = el.querySelectorAll<HTMLButtonElement>('[data-feathers]');
      toggle.forEach((b) => b.addEventListener('click', () => setAnswer({ feathersCount: b.dataset.feathers === 'yes' })));
      onAnswers((a) => {
        toggle.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.feathers === 'yes') === a.feathersCount)));
        render(el, progress);
      });
    },
    animate(el, tl) {
      const proxy = { p: 0 };
      tl.to(proxy, { p: 1, duration: 1, ease: 'power1.inOut', onUpdate: () => render(el, proxy.p) })
        .to($(el, '.verdict'), { opacity: 1, duration: 0.2 });
    },
    still(el) {
      render(el, 1);
    },
  };
}

const weight = meaningScene({
  meaning: 'weight',
  decor: weightDecor,
  eyebrow: 'Reading 1 · Weight',
  title: 'Match the weight, keep the shape.',
  lede: 'A duck-sized horse weighs what a mallard weighs. A horse-sized duck weighs what a horse weighs.',
});

const height = meaningScene({
  meaning: 'height',
  decor: heightDecor,
  eyebrow: 'Reading 2 · Height',
  title: 'Match the height instead.',
  lede: 'Scale each animal until it stands as tall as the other. Weight follows the cube of height.',
});

const volume = meaningScene({
  meaning: 'volume',
  decor: volumeDecor,
  eyebrow: 'Reading 3 · Volume',
  title: 'Match the space each animal fills.',
  lede: 'Ducks are light for their bulk. Feathers and air sacs take up room without adding much weight.',
  extra: `<div class="choices" role="group" aria-label="Do feathers count?">
      <button class="choice" data-feathers="yes" aria-pressed="true">Feathers count</button>
      <button class="choice" data-feathers="no" aria-pressed="false">Pluck the duck</button>
    </div>`,
});

const skin = meaningScene({
  meaning: 'skin',
  decor: skinDecor,
  eyebrow: 'Reading 4 · Skin',
  title: 'Match the surface area.',
  lede: 'Area grows with the square of size and weight with the cube. That gap is the square-cube law.',
});

// ---------- 7. Your fight ----------

const yourFight: Scene = {
  id: 'your-fight',
  html: () => `
    <div>
      <p class="eyebrow">Your fight</p>
      <h2>So what does “sized” mean to you?</h2>
      <div class="choices" role="group" aria-label="Your meaning of sized">
        ${meanings.map((m) => `<button class="choice" data-meaning="${m.id}" aria-pressed="false">${m.label}</button>`).join('')}
      </div>
    </div>
    <div class="bars">
      <div class="bar-row"><span>The duck</span><div class="bar-track"><div class="bar-fill duck" data-bar="duck"></div></div><span data-bar-v="duck"></span></div>
      <div class="bar-row"><span>100 horses</span><div class="bar-track"><div class="bar-fill horse" data-bar="herd"></div></div><span data-bar-v="herd"></span></div>
    </div>
    <p class="verdict" style="opacity:1"></p>`,
  setup(el) {
    const buttons = el.querySelectorAll<HTMLButtonElement>('[data-meaning]');
    buttons.forEach((b) => b.addEventListener('click', () => setAnswer({ meaning: b.dataset.meaning as Meaning })));
    onAnswers((a) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.meaning === a.meaning)));
      const meaning = a.meaning ?? 'weight';
      const m = matchup(meaning, meaning === 'volume' && !a.feathersCount ? pluckedMallard : mallard);
      const max = Math.max(m.giantDuckKg, m.hordeKg);
      $(el, '[data-bar="duck"]').style.width = `${(m.giantDuckKg / max) * 100}%`;
      $(el, '[data-bar="herd"]').style.width = `${(m.hordeKg / max) * 100}%`;
      $(el, '[data-bar-v="duck"]').textContent = formatLb(m.giantDuckKg);
      $(el, '[data-bar-v="herd"]').textContent = formatLb(m.hordeKg);
      $(el, '.verdict').innerHTML = a.meaning ? verdictText(m, meanings.find((x) => x.id === meaning)!.label) : 'Pick a meaning to see your fight.';
    });
  },
};

// ---------- 8. The verdict ----------

const finalVerdict: Scene = {
  id: 'verdict',
  html: () => `
    <div>
      <p class="eyebrow">The verdict</p>
      <h2 data-final-title>The answer depends on the question.</h2>
      <p class="lede" data-final-body></p>
    </div>
    ${battleHtml()}
    <div class="proof-row">${proofButtonHtml()}</div>`,
  setup(el) {
    const name = (p: Pick) => (p === 'horses' ? '100 duck-sized horses' : 'one horse-sized duck');
    onAnswers((a) => {
      const body = $(el, '[data-final-body]');
      if (!a.firstPick || !a.meaning) {
        body.textContent = 'Answer the questions above to get your result, or test a fight below.';
        return;
      }
      const m = matchup(a.meaning, a.meaning === 'volume' && !a.feathersCount ? pluckedMallard : mallard);
      const best = easierFight(m);
      const label = meanings.find((x) => x.id === a.meaning)!.label.toLowerCase();
      body.textContent =
        best === a.firstPick
          ? `You first chose ${name(a.firstPick)}. Measured by ${label}, the science agrees with you. Test it below.`
          : `You first chose ${name(a.firstPick)}. Measured by ${label}, you should have picked ${name(best)}. Test it below.`;
    });
    mountBattle($(el, '.battle'));
    mountProof(el);
  },
};

export const scenes: Scene[] = [intro, theCatch, weight, height, volume, skin, yourFight, finalVerdict];
