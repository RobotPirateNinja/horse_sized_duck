// The battle panel: draws a BattleEngine in SVG with the site's illustrations.
import { duckArt, horseArt, personArt, type Art } from '../art';
import { formatLb, horse, mallard, meanings, pluckedMallard, type Meaning } from '../data';
import { getAnswers, onAnswers } from '../state';
import { BattleEngine } from './engine';
import { buildLineup, type Opponent } from './fighters';
import type { Fighter } from './ubs';

const W = 900;
const H = 440;
const GROUND_Y = 250; // screen y of the field's centre line
const DEPTH = 0.42; // how much the field is squashed vertically
const NS = 'http://www.w3.org/2000/svg';

const ARTS: Record<string, Art> = { person: personArt, horse: horseArt, duck: duckArt };

interface Sprite {
  f: Fighter;
  g: SVGGElement;
  body: SVGGElement;
  bar?: SVGRectElement;
  /** Height of the drawing box in metres at this fighter's scale. */
  boxM: number;
  art: Art;
  phase: number;
}

interface Spark {
  el: SVGCircleElement;
  age: number;
}

export function battleHtml() {
  return `
  <div class="battle">
    <div class="battle-bar">
      <div class="battle-pick" role="group" aria-label="Who do you fight?">
        <button class="choice small" data-opp="horses" aria-pressed="false">100 duck-sized horses</button>
        <button class="choice small" data-opp="duck" aria-pressed="false">1 horse-sized duck</button>
      </div>
      <div class="battle-actions">
        <button class="choice small" data-speed aria-pressed="false" title="Play at triple speed">3×</button>
        <button class="choice small primary" data-fight>Fight</button>
      </div>
    </div>
    <p class="battle-sub" data-sub></p>
    <div class="battle-arena">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Battle simulator arena">
        <defs>
          <symbol id="sym-person" viewBox="0 0 ${personArt.width} ${personArt.height}">${personArt.svg}</symbol>
          <symbol id="sym-horse" viewBox="0 0 ${horseArt.width} ${horseArt.height}">${horseArt.svg}</symbol>
          <symbol id="sym-duck" viewBox="0 0 ${duckArt.width} ${duckArt.height}">${duckArt.svg}</symbol>
        </defs>
        <ellipse class="field" data-field cx="${W / 2}" cy="${GROUND_Y}" rx="${W / 2 - 10}" ry="150"/>
        <g data-layer="units"></g>
        <g data-layer="fx"></g>
        <g class="hud" data-hud>
          <text x="24" y="32" class="hud-label">You</text>
          <rect x="24" y="42" width="180" height="8" rx="4" class="hud-track"/>
          <rect x="24" y="42" width="180" height="8" rx="4" class="hud-fill you" data-hp="you"/>
          <text x="${W - 24}" y="32" class="hud-label" text-anchor="end" data-opp-label></text>
          <rect x="${W - 204}" y="42" width="180" height="8" rx="4" class="hud-track"/>
          <rect x="${W - 204}" y="42" width="180" height="8" rx="4" class="hud-fill them" data-hp="them"/>
          <text x="${W / 2}" y="36" class="hud-clock" text-anchor="middle" data-clock>0.0 s</text>
        </g>
      </svg>
      <div class="battle-result" data-result hidden></div>
    </div>
    <p class="battle-note">Combat model from the Ultimate Battle Simulator: stats for power, stamina and agility set each fighter's health, speed and hit strength, rescaled for size.</p>
    <p class="battle-note">Sources: mallard weight from <a href="https://www.bto.org/understanding-birds/birdfacts/mallard">BTO</a>, mallard length and horse weight from Wikipedia (<a href="https://en.wikipedia.org/wiki/Mallard">mallard</a>, <a href="https://en.wikipedia.org/wiki/Horse_body_mass">horse</a>), Dromornis from the <a href="https://australian.museum/learn/australia-over-time/extinct-animals/dromornis-stirtoni/">Australian Museum</a>. Heights, densities and skin areas are approximations.</p>
  </div>`;
}

export function mountBattle(root: HTMLElement) {
  const svg = root.querySelector('svg')!;
  const units = svg.querySelector<SVGGElement>('[data-layer="units"]')!;
  const fx = svg.querySelector<SVGGElement>('[data-layer="fx"]')!;
  const fightBtn = root.querySelector<HTMLButtonElement>('[data-fight]')!;
  const speedBtn = root.querySelector<HTMLButtonElement>('[data-speed]')!;
  const oppBtns = root.querySelectorAll<HTMLButtonElement>('[data-opp]');
  const sub = root.querySelector<HTMLElement>('[data-sub]')!;
  const result = root.querySelector<HTMLElement>('[data-result]')!;
  const clock = svg.querySelector<SVGTextElement>('[data-clock]')!;
  const hpYou = svg.querySelector<SVGRectElement>('[data-hp="you"]')!;
  const hpThem = svg.querySelector<SVGRectElement>('[data-hp="them"]')!;
  const oppLabel = svg.querySelector<SVGTextElement>('[data-opp-label]')!;
  const field = svg.querySelector<SVGEllipseElement>('[data-field]')!;

  let opponent: Opponent | null = null;
  let userChose = false;
  let engine: BattleEngine | null = null;
  let sprites: Sprite[] = [];
  let sparks: Spark[] = [];
  let ppm = 50;
  let running = false;
  let fast = false;
  let last = 0;
  let visible = true;

  const meaning = (): Meaning => getAnswers().meaning ?? 'weight';

  function describe() {
    const a = getAnswers();
    const lineup = buildLineup(opponent!, meaning(), a.feathersCount);
    const foe = lineup.fighters[1];
    const label = meanings.find((m) => m.id === meaning())!.label.toLowerCase();
    const duck = meaning() === 'volume' && !a.feathersCount ? pluckedMallard : mallard;
    const kg = opponent === 'duck' ? duck.massKg * lineup.scale ** 3 : horse.massKg * lineup.scale ** 3;
    const who = opponent === 'duck' ? `one ${formatLb(kg)} duck` : `100 horses at ${formatLb(kg)} each`;
    sub.textContent = `An average person (154 lb) against ${who}, sized by ${label}${a.meaning ? '' : ' (pick a meaning above to change this)'}. ${opponent === 'duck' ? 'Its health' : 'Health'}: ${Math.round(foe.maxHealth)}${opponent === 'duck' ? '' : ' each'}. Yours: 100.`;
    oppLabel.textContent = opponent === 'duck' ? 'The duck' : 'The herd';
  }

  function setup() {
    const a = getAnswers();
    const lineup = buildLineup(opponent!, meaning(), a.feathersCount);
    engine = new BattleEngine(lineup.fighters, lineup.halfW, lineup.halfH);
    engine.onHit = (_att, victim) => spark(victim);

    // Pixels per metre: fit the field's width and the tallest fighter.
    const tallest = Math.max(...lineup.fighters.map((f) => boxMeters(f, lineup.scale)));
    ppm = Math.min((W - 120) / (lineup.halfW * 2), 230 / tallest);
    // The field matches the arena the engine keeps everyone inside.
    field.setAttribute('rx', String(lineup.halfW * ppm + 40));
    field.setAttribute('ry', String(lineup.halfH * ppm * DEPTH + 24));

    units.replaceChildren();
    fx.replaceChildren();
    sparks = [];
    sprites = lineup.fighters.map((f) => {
      const art = ARTS[f.kind];
      const boxM = boxMeters(f, lineup.scale);
      const g = document.createElementNS(NS, 'g');
      const body = document.createElementNS(NS, 'g');
      const use = document.createElementNS(NS, 'use');
      const hPx = boxM * ppm;
      const wPx = (hPx * art.width) / art.height;
      use.setAttribute('href', `#sym-${f.kind}`);
      use.setAttribute('width', String(wPx));
      use.setAttribute('height', String(hPx));
      use.setAttribute('x', String(-wPx / 2));
      use.setAttribute('y', String(-hPx));
      body.appendChild(use);
      g.appendChild(body);
      const sprite: Sprite = { f, g, body, boxM, art, phase: Math.random() * Math.PI * 2 };
      if (f.kind !== 'horse') {
        const track = rect(-20, -hPx - 14, 40, 4, 'unit-track');
        const bar = rect(-20, -hPx - 14, 40, 4, f.side === 'challenger' ? 'unit-fill you' : 'unit-fill them');
        g.append(track, bar);
        sprite.bar = bar;
      }
      units.appendChild(g);
      return sprite;
    });
    result.hidden = true;
    describe();
    draw();
  }

  function boxMeters(f: Fighter, scale: number) {
    if (f.kind === 'person') return personArt.meters;
    return ARTS[f.kind].meters * scale;
  }

  function rect(x: number, y: number, w: number, h: number, cls: string) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', String(w));
    r.setAttribute('height', String(h));
    r.setAttribute('rx', String(h / 2));
    r.setAttribute('class', cls);
    return r;
  }

  const sx = (x: number) => W / 2 + x * ppm;
  const sy = (y: number) => GROUND_Y + y * ppm * DEPTH;

  function spark(v: Fighter) {
    const s = sprites.find((p) => p.f === v);
    const el = document.createElementNS(NS, 'circle');
    const hPx = (s?.boxM ?? 1) * ppm;
    el.setAttribute('cx', String(sx(v.x)));
    el.setAttribute('cy', String(sy(v.y) - hPx * 0.5));
    el.setAttribute('class', v.side === 'challenger' ? 'spark you' : 'spark them');
    fx.appendChild(el);
    sparks.push({ el, age: 0 });
  }

  function draw() {
    if (!engine) return;
    const t = engine.time;
    // Depth sort: farther (smaller y) first.
    const order = [...sprites].sort((a, b) => a.f.y - b.f.y);
    for (const s of order) {
      const f = s.f;
      const hPx = s.boxM * ppm;
      let dx = 0,
        dy = 0,
        rot = 0;
      if (f.isDead) {
        rot = -Math.min(90, f.deadFor * 300) * f.facing;
        s.g.style.opacity = String(Math.max(0, 1 - Math.max(0, f.deadFor - 0.6) * 1.5));
      } else {
        if (f.state === 'Moving') dy = -Math.abs(Math.sin(t * 14 + s.phase)) * hPx * 0.05;
        if (f.sinceAttack < 0.25) {
          const p = Math.sin((f.sinceAttack / 0.25) * Math.PI);
          dx = p * hPx * 0.15 * f.facing;
          rot = p * 8 * f.facing;
        }
        s.g.style.opacity = f.sinceHit < 0.12 ? '0.55' : '1';
      }
      s.g.setAttribute('transform', `translate(${sx(f.x) + dx} ${sy(f.y) + dy})`);
      s.body.setAttribute('transform', `rotate(${rot}) scale(${f.facing} 1)`);
      if (s.bar) s.bar.setAttribute('width', String(Math.max(0, (40 * f.health) / f.maxHealth)));
      units.appendChild(s.g);
    }
    for (const sp of sparks) {
      const r = 4 + sp.age * 60;
      sp.el.setAttribute('r', String(r));
      sp.el.style.opacity = String(Math.max(0, 1 - sp.age * 4));
    }
    sparks = sparks.filter((sp) => (sp.age < 0.25 ? true : (sp.el.remove(), false)));

    const you = engine.fighters[0];
    const them = engine.fighters.slice(1);
    hpYou.setAttribute('width', String((180 * you.health) / you.maxHealth));
    const themHp = them.reduce((s, f) => s + f.health, 0) / them.reduce((s, f) => s + f.maxHealth, 0);
    hpThem.setAttribute('width', String(180 * themHp));
    if (them.length > 1) oppLabel.textContent = `The herd: ${them.filter((f) => !f.isDead).length} left`;
    clock.textContent = `${t.toFixed(1)} s`;
  }

  function frame(now: number) {
    if (!running || !engine) return;
    const real = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (visible) {
      let left = real * (fast ? 3 : 1);
      while (left > 0 && !engine.ended) {
        const d = Math.min(1 / 60, left);
        engine.step(d);
        for (const sp of sparks) sp.age += d;
        left -= d;
      }
      draw();
    }
    if (engine.ended) {
      // Let the last fall finish before showing the result.
      if (engine.fighters.some((f) => f.isDead && f.deadFor < 1.2)) {
        for (const f of engine.fighters) {
          if (f.isDead) f.deadFor += real;
          f.sinceHit += real;
          f.sinceAttack += real;
        }
        draw();
        requestAnimationFrame(frame);
        return;
      }
      for (const f of engine.fighters) f.sinceHit = f.sinceAttack = 99;
      fx.replaceChildren();
      sparks = [];
      draw();
      running = false;
      showResult();
      return;
    }
    requestAnimationFrame(frame);
  }

  function showResult() {
    const r = engine!.result!;
    const foe = opponent === 'duck' ? 'the duck' : 'the herd';
    let head: string;
    let body: string;
    if (r.winner === 'challenger') {
      head = 'You win.';
      body =
        opponent === 'duck'
          ? `You brought down ${foe} in ${r.seconds.toFixed(1)} seconds.`
          : `All 100 horses down in ${r.seconds.toFixed(1)} seconds.`;
    } else if (r.winner === 'opponent') {
      head = opponent === 'duck' ? 'The duck wins.' : 'The horses win.';
      body =
        opponent === 'duck'
          ? `You lasted ${r.seconds.toFixed(1)} seconds.`
          : `You took ${r.challengerKills} of them with you, and lasted ${r.seconds.toFixed(1)} seconds.`;
    } else {
      head = 'Stalemate.';
      body = 'Three minutes in, nobody has fallen. Everyone goes home tired.';
    }
    result.innerHTML = `<strong>${head}</strong><span>${body}</span>`;
    result.hidden = false;
    fightBtn.textContent = 'Rematch';
    fightBtn.disabled = false;
  }

  function start() {
    setup();
    running = true;
    fightBtn.textContent = 'Fighting…';
    fightBtn.disabled = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function choose(o: Opponent) {
    if (running) return;
    opponent = o;
    oppBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.opp === o)));
    fightBtn.textContent = 'Fight';
    setup();
  }

  oppBtns.forEach((b) =>
    b.addEventListener('click', () => {
      userChose = true;
      choose(b.dataset.opp as Opponent);
    }),
  );
  fightBtn.addEventListener('click', () => !running && start());
  speedBtn.addEventListener('click', () => {
    fast = !fast;
    speedBtn.setAttribute('aria-pressed', String(fast));
  });

  new IntersectionObserver((entries) => (visible = entries[0].isIntersecting)).observe(root);

  // Default to the reader's own first pick; follow answer changes while idle.
  onAnswers((a) => {
    if (running) return;
    if (!userChose) choose(a.firstPick ?? 'horses');
    else setup();
  });
}
