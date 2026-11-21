// Per-scene extras for the four "meaning" scenes: the visual jokes and explainers.
import { dromornisArt, place } from './art';
import { horse, mallard, mToFt, type Matchup } from './data';

export interface StageCtx {
  ppm: number;
  ground: number;
  duckX: number;
  horseX: number;
}

export interface Decor {
  /** Extra height (m) the stage must fit. */
  tallest?: number;
  back?: (c: StageCtx) => string;
  front?: (c: StageCtx) => string;
  render?: (svg: SVGSVGElement, p: number, m: Matchup, c: StageCtx, plucked: boolean) => void;
}

const q = <T extends Element>(root: ParentNode, sel: string) => root.querySelector(sel) as T;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerpLog = (a: number, b: number, p: number) => a * (b / a) ** p;

// ---------- Weight: a balance beam, and the real giant duck relative ----------
export const weightDecor: Decor = {
  tallest: 3.2,
  back: (c) => `
    <g class="dromo" opacity="0">
      ${place(dromornisArt, 'dromo-art', 120, c.ground, c.ppm)}
      <text class="note" x="120" y="${c.ground + 24}" text-anchor="middle">Dromornis stirtoni: real, 3 m, up to 500 kg, duck family</text>
    </g>`,
  front: () => `
    <g class="balance" transform="translate(860 70)">
      <path class="balance-post" d="M-6 0 L6 0 L14 70 L-14 70 Z"/>
      <g class="balance-beam">
        <rect x="-90" y="-3" width="180" height="6" rx="3" class="balance-bar"/>
        <g class="pan pan-l" transform="translate(-80 0)"><line x1="0" y1="0" x2="0" y2="26"/><path d="M-24 26 L24 26 L16 34 L-16 34 Z"/><text y="52" text-anchor="middle" data-pan="duck"></text></g>
        <g class="pan pan-r" transform="translate(80 0)"><line x1="0" y1="0" x2="0" y2="26"/><path d="M-24 26 L24 26 L16 34 L-16 34 Z"/><text y="52" text-anchor="middle" data-pan="horse"></text></g>
      </g>
      <circle r="6" class="balance-pivot"/>
    </g>`,
  render(svg, p, m) {
    const duckKg = lerpLog(mallard.massKg, m.giantDuckKg, p);
    const horseKg = lerpLog(horse.massKg, m.tinyHorseKg, p);
    const tilt = clamp(Math.log10(horseKg / duckKg) * 6, -18, 18);
    q<SVGGElement>(svg, '.balance-beam').setAttribute('transform', `rotate(${tilt})`);
    // Pans hang straight down whatever the beam does.
    q<SVGGElement>(svg, '.pan-l').setAttribute('transform', `translate(-80 0) rotate(${-tilt} 0 0)`);
    q<SVGGElement>(svg, '.pan-r').setAttribute('transform', `translate(80 0) rotate(${-tilt} 0 0)`);
    q(svg, '[data-pan="duck"]').textContent = `duck ${fmt(duckKg)}`;
    q(svg, '[data-pan="horse"]').textContent = `horse ${fmt(horseKg)}`;
    q<SVGGElement>(svg, '.dromo').setAttribute('opacity', String(clamp((p - 0.7) / 0.3, 0, 1)));
  },
};

function fmt(kg: number) {
  const lb = kg * 2.20462;
  return lb < 10 ? `${lb.toFixed(1)} lb` : `${Math.round(lb).toLocaleString('en-US')} lb`;
}

// ---------- Height: a ruler wall with marker lines ----------
export const heightDecor: Decor = {
  back: (c) => {
    let ticks = '';
    for (let ft = 0; ft <= 6; ft++) {
      const y = c.ground - (ft / 3.28084) * c.ppm;
      ticks += `<line x1="40" x2="${ft % 1 === 0 ? 58 : 50}" y1="${y}" y2="${y}"/><text x="64" y="${y + 4}">${ft} ft</text>`;
    }
    return `
      <g class="ruler">${ticks}<line x1="40" x2="40" y1="${c.ground}" y2="${c.ground - (6 / 3.28084) * c.ppm}"/></g>
      <line class="mark mark-duck" x1="80" x2="980"/>
      <line class="mark mark-horse" x1="80" x2="980"/>
      <text class="note mark-duck-t" x="980" text-anchor="end"></text>
      <text class="note mark-horse-t" x="980" text-anchor="end"></text>`;
  },
  render(svg, p, m, c) {
    const duckH = lerpLog(mallard.heightM, m.giantDuckHeightM, p);
    const horseH = lerpLog(horse.heightM, m.tinyHorseHeightM, p);
    const set = (cls: string, h: number, text: string) => {
      const y = c.ground - h * c.ppm;
      q(svg, `.mark-${cls}`).setAttribute('y1', String(y));
      q(svg, `.mark-${cls}`).setAttribute('y2', String(y));
      const t = q(svg, `.mark-${cls}-t`);
      t.setAttribute('y', String(y - 6));
      t.textContent = text;
    };
    set('duck', duckH, `duck ${mToFt(duckH).toFixed(1)} ft`);
    set('horse', horseH, `horse shoulder ${mToFt(horseH).toFixed(1)} ft`);
  },
};

// ---------- Volume: the tank fills, the duck floats ----------
export const volumeDecor: Decor = {
  front: () => `<rect class="water" x="-600" width="2200" y="410" height="0"/>`,
  render(svg, p, m, c, plucked) {
    const depthM = 0.3 * m.giantDuckHeightM;
    const h = clamp((p - 0.3) / 0.7, 0, 1) * depthM * c.ppm;
    const water = q<SVGRectElement>(svg, '.water');
    water.setAttribute('y', String(c.ground - h));
    water.setAttribute('height', String(h));
    // A duck with feathers floats high; a plucked one sits lower.
    const lift = h * (plucked ? 0.35 : 0.7);
    q<SVGGElement>(svg, '.m-duck').setAttribute('transform', `translate(${c.duckX} ${c.ground - lift})`);
    svg.classList.toggle('plucked', plucked);
  },
};

// ---------- Skin: flattened skin squares, a cold horse, a grounded duck ----------
export const skinDecor: Decor = {
  front: () => `
    <g class="sheets" transform="translate(880 40)">
      <text class="note" x="0" y="0" text-anchor="middle">skin, flattened: duck · horse</text>
      <rect class="sheet sheet-duck" />
      <rect class="sheet sheet-horse" />
    </g>`,
  render(svg, p, m) {
    const pxPerM = 34;
    const duckA = mallard.skinM2 * (1 / m.k) ** (2 * p);
    const horseA = horse.skinM2 * m.k ** (2 * p);
    const place = (cls: string, a: number, x: number) => {
      const side = Math.sqrt(a) * pxPerM;
      const r = q<SVGRectElement>(svg, `.sheet-${cls}`);
      r.setAttribute('x', String(x - side / 2));
      r.setAttribute('y', String(14));
      r.setAttribute('width', String(Math.max(1, side)));
      r.setAttribute('height', String(Math.max(1, side)));
    };
    place('duck', duckA, -45);
    place('horse', horseA, 45);
  },
};
