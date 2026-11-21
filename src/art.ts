// Creature illustrations. Flat shapes, no outlines, colours from CSS tokens.
// Every drawing faces right and stands on the bottom edge of its box, centred.
// Named parts (classes) let animations move legs, heads and wings later.

export interface Art {
  width: number;
  height: number;
  /** Real-world height of the whole box at scale 1, in metres. */
  meters: number;
  svg: string;
}

// ---------- Mallard drake ----------
// Head top sits at y≈18, ground at 160, so the bird stands 142 units ≈ 0.40 m.
const DUCK_UNITS_PER_M = 142 / 0.4;

export const duckArt: Art = {
  width: 180,
  height: 160,
  meters: 160 / DUCK_UNITS_PER_M,
  svg: `
  <g class="duck">
    <g class="leg leg-back">
      <path d="M83 126 L89 126 L89 153 L84 153 Z" fill="var(--duck-feet-shade)"/>
      <path d="M74 160 Q86 150 98 160 Z" fill="var(--duck-feet-shade)"/>
    </g>
    <path class="tail" d="M30 88 C22 84 12 84 6 88 C12 94 22 100 34 100 Z" fill="var(--duck-tail)"/>
    <path class="body" d="M24 92 C40 74 78 66 116 70 C138 72 154 86 156 104 C158 122 142 134 114 136 L64 136 C38 134 24 116 24 92 Z" fill="var(--duck-flank)"/>
    <path class="rump" d="M24 92 C30 82 40 78 48 80 C46 96 40 110 30 114 C26 108 24 100 24 92 Z" fill="var(--duck-tail)"/>
    <path class="curl" d="M34 80 C30 68 42 64 44 72" fill="none" stroke="var(--duck-tail)" stroke-width="3.5" stroke-linecap="round"/>
    <path class="back" d="M40 82 C60 70 96 66 122 74 C112 84 84 92 44 94 Z" fill="var(--duck-back)"/>
    <path class="breast" d="M120 74 C140 78 156 92 156 108 C156 124 142 134 118 136 C130 118 132 92 120 74 Z" fill="var(--duck-breast)"/>
    <g class="wing">
      <path d="M44 88 C66 78 100 76 124 84 C110 100 80 108 46 104 C42 98 42 92 44 88 Z" fill="var(--duck-wing)"/>
      <path d="M52 98 L80 94 L80 100 L54 103 Z" fill="var(--duck-speculum)"/>
      <path d="M52 97 L80 93 L80 94 L52 98 Z M54 103 L80 100 L80 101 L54 104 Z" fill="var(--duck-ring)"/>
      <path d="M46 104 C40 100 34 96 30 90 C40 96 52 100 62 102 Z" fill="var(--duck-tertial)"/>
    </g>
    <g class="leg leg-front">
      <path d="M95 128 L101 128 L101 154 L96 154 Z" fill="var(--duck-feet)"/>
      <path d="M86 160 Q99 150 112 160 Z" fill="var(--duck-feet)"/>
    </g>
    <g class="head">
      <path class="neck" d="M114 78 C114 62 118 50 124 40 L146 40 C142 54 140 66 144 82 Z" fill="var(--duck-head)"/>
      <path class="ring" d="M114 70 C124 72 134 73 142 72 L142.6 76 C134 77 124 76 114.4 74.4 Z" fill="var(--duck-ring)"/>
      <ellipse cx="136" cy="33" rx="19" ry="15" fill="var(--duck-head)"/>
      <path class="sheen" d="M124 24 C130 19 140 19 146 23 C140 24 132 26 126 30 Z" fill="var(--duck-sheen)"/>
      <path class="bill" d="M151 31 C160 30 170 33 176 38 C176 42 172 44 166 43 C160 42 154 41 150 40 Z" fill="var(--duck-bill)"/>
      <path class="nail" d="M172 37 C175 38 176 40 176 41 C174 42 172 42 170 42 Z" fill="var(--duck-nail)"/>
      <circle class="eye" cx="141" cy="29" r="2.6" fill="var(--eye)"/>
      <circle cx="141.8" cy="28.2" r="0.8" fill="var(--eye-glint)"/>
    </g>
  </g>`,
};

// ---------- Horse (chestnut, side view) ----------
// Withers at y≈86, ground at 220, so 134 units ≈ 1.6 m at the shoulder.
const HORSE_UNITS_PER_M = 134 / 1.6;

export const horseArt: Art = {
  width: 250,
  height: 220,
  meters: 220 / HORSE_UNITS_PER_M,
  svg: `
  <g class="horse">
    <path class="tail" d="M64 92 C46 96 36 118 38 148 C40 164 46 174 52 178 C52 156 56 130 70 108 Z" fill="var(--horse-mane)"/>
    <g class="leg leg-back-far">
      <path d="M92 118 C104 120 108 132 104 146 L100 162 C99 170 100 178 102 188 L102 212 L93 212 L92 188 C88 178 86 168 88 158 Z" fill="var(--horse-shade)"/>
      <path d="M93 211 L102 211 L104 220 L91 220 Z" fill="var(--horse-hoof)"/>
    </g>
    <g class="leg leg-front-far">
      <path d="M160 116 L174 116 C176 134 174 152 172 168 L172 212 L163 212 L163 168 C162 150 160 134 160 116 Z" fill="var(--horse-shade)"/>
      <path d="M163 211 L172 211 L174 220 L161 220 Z" fill="var(--horse-hoof)"/>
    </g>
    <path class="body" d="M60 104 C60 90 72 84 88 84 C110 84 128 92 148 89 C162 87 176 84 188 92 C198 100 200 116 194 128 C186 140 162 140 142 138 C122 136 102 138 86 136 C68 134 60 122 60 104 Z" fill="var(--horse-body)"/>
    <path class="belly" d="M92 134 C110 137 128 135 146 136 C164 138 182 136 192 130 C184 140 164 142 144 141 C124 140 106 141 92 134 Z" fill="var(--horse-shade)"/>
    <g class="leg leg-back">
      <path d="M62 100 C62 84 94 82 102 100 C106 116 100 132 94 144 L92 160 C91 168 92 176 94 186 L94 212 L84 212 L84 186 C80 176 76 166 76 156 C66 146 62 124 62 100 Z" fill="var(--horse-body)"/>
      <path d="M84 200 L94 200 L94 211 L84 211 Z" fill="var(--horse-sock)"/>
      <path d="M84 211 L94 211 L96 220 L82 220 Z" fill="var(--horse-hoof)"/>
    </g>
    <g class="leg leg-front">
      <path d="M172 112 C184 110 194 118 194 130 C192 146 188 160 188 172 L189 212 L179 212 L179 172 C177 160 174 140 172 112 Z" fill="var(--horse-body)"/>
      <path d="M179 211 L189 211 L191 220 L177 220 Z" fill="var(--horse-hoof)"/>
    </g>
    <g class="head">
      <path class="neck" d="M160 92 C164 76 176 60 190 48 C196 44 204 44 208 50 C206 62 202 78 198 98 C196 108 192 114 186 118 C178 110 168 102 160 92 Z" fill="var(--horse-body)"/>
      <path class="ear-far" d="M202 38 L208 24 L212 38 Z" fill="var(--horse-shade)"/>
      <path class="face" d="M190 46 C192 36 204 30 214 34 C222 40 232 56 238 66 C242 74 238 82 230 82 C222 82 214 76 208 70 C200 62 190 56 190 46 Z" fill="var(--horse-body)"/>
      <path class="ear" d="M194 40 L196 24 L205 36 Z" fill="var(--horse-body)"/>
      <path class="blaze" d="M216 38 C220 46 226 56 232 66 L229 68 C223 58 217 48 213 40 Z" fill="var(--horse-sock)"/>
      <path class="muzzle" d="M228 69 C235 69 240 74 239 79 C237 83 231 83 226 79 C224 76 225 71 228 69 Z" fill="var(--horse-shade)"/>
      <path class="mane" d="M158 94 C162 76 176 58 194 44 L200 49 C186 62 174 80 167 100 Z" fill="var(--horse-mane)"/>
      <path class="forelock" d="M196 36 C204 36 210 42 211 48 C204 46 199 42 196 36 Z" fill="var(--horse-mane)"/>
      <circle class="eye" cx="209" cy="47" r="2.8" fill="var(--eye)"/>
      <circle cx="210" cy="46" r="0.9" fill="var(--eye-glint)"/>
      <circle class="nostril" cx="235" cy="74" r="1.6" fill="var(--horse-mane)"/>
    </g>
  </g>`,
};

// ---------- Average person (the challenger) ----------
// A neutral, faceless figure: 1.75 m tall, standing on the bottom edge.
export const personArt: Art = {
  width: 70,
  height: 180,
  meters: 1.8,
  svg: `
  <g class="person">
    <g class="leg leg-back">
      <path d="M30 104 L40 104 L39 170 L31 170 Z" fill="var(--person-legs-shade)"/>
      <path d="M30 168 L41 168 C46 168 49 172 49 176 L49 180 L30 180 Z" fill="var(--person-shoes)"/>
    </g>
    <path class="torso" d="M24 54 C24 44 30 40 37 40 C44 40 48 46 48 54 L47 104 L23 104 Z" fill="var(--person-shirt)"/>
    <g class="leg leg-front">
      <path d="M25 104 L36 104 L35 170 L26 170 Z" fill="var(--person-legs)"/>
      <path d="M25 168 L36 168 C41 168 44 172 44 176 L44 180 L25 180 Z" fill="var(--person-shoes)"/>
    </g>
    <path class="hips" d="M23 96 L47 96 L47 106 C47 108 45 110 43 110 L27 110 C25 110 23 108 23 106 Z" fill="var(--person-legs)"/>
    <g class="arm arm-front">
      <path d="M31 48 C37 46 42 50 42 56 L41 94 L34 94 L31 58 Z" fill="var(--person-shirt-shade)"/>
      <circle cx="37.5" cy="97" r="4.2" fill="var(--person-skin)"/>
    </g>
    <g class="head">
      <rect x="32" y="30" width="8" height="12" rx="3" fill="var(--person-skin-shade)"/>
      <ellipse cx="37" cy="20" rx="12" ry="14" fill="var(--person-skin)"/>
      <path class="nose" d="M48 18 L52 24 L48 25 Z" fill="var(--person-skin)"/>
      <path class="hair" d="M25 20 C24 8 32 4 39 5 C46 6 50 11 49 16 C43 12 36 12 31 15 C30 18 30 22 31 26 C28 25 26 23 25 20 Z" fill="var(--person-hair)"/>
      <ellipse class="ear" cx="33" cy="21" rx="2.4" ry="3.4" fill="var(--person-skin-shade)"/>
      <circle class="eye" cx="44" cy="19" r="1.5" fill="var(--eye)"/>
    </g>
  </g>`,
};

// ---------- Dromornis stirtoni (silhouette) ----------
// Stirton's thunderbird: a real Miocene relative of ducks, about 3 m tall and up to 500 kg
// (Australian Museum). Drawn as a flat silhouette for the weight scene.
export const dromornisArt: Art = {
  width: 124,
  height: 160,
  meters: (3.0 * 160) / 156,
  svg: `
  <g class="dromornis" fill="var(--reference)">
    <path d="M36 86 L47 86 L45 154 L54 160 L30 160 L35 153 Z"/>
    <path d="M58 86 L69 86 L67 152 L78 160 L54 160 L59 152 Z"/>
    <path d="M8 60 C8 38 40 30 70 36 C86 40 94 52 92 66 C90 82 72 94 44 94 C20 94 8 80 8 60 Z"/>
    <path d="M8 56 C2 54 0 62 4 68 C6 64 8 62 12 62 Z"/>
    <path d="M70 42 C74 28 78 16 88 9 C98 4 112 6 120 14 C124 20 120 28 110 30 L98 30 C94 38 92 48 90 58 Z"/>
  </g>`,
};

/**
 * Places an Art with its feet centred at (x, groundY), drawn to pixelsPerMeter.
 * The inner `.scaler` group is what animations scale, from the feet.
 */
export function place(art: Art, cls: string, x: number, groundY: number, pxPerM: number, flip = false) {
  const s = (pxPerM * art.meters) / art.height;
  return `<g class="${cls}" transform="translate(${x} ${groundY})"><g class="scaler"><g class="motion"><g transform="scale(${flip ? -s : s} ${s}) translate(${-art.width / 2} ${-art.height})">${art.svg}</g></g></g></g>`;
}
