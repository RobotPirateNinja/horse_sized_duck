// Combat stat model ported from Taylor_UBS (src/core/Unit.ts).
// The formulas are kept as they are there. Differences, all deliberate:
//  - no three.js, terrain, projectiles, levels or archetypes; every fighter is melee
//  - damage is NOT rounded to whole numbers (a 2 lb horse would otherwise do 0)
//  - each blow varies by ±25%, and toughness softens blows that are small next
//    to the defender's build (both in engine.ts)
//  - fighters carry a real-world size (radius, reach) so the arena can be in metres

export interface UnitStats {
  power: number;
  smarts: number;
  knowledge: number;
  stamina: number;
  agility: number;
  social: number;
}

export type Side = 'challenger' | 'opponent';

export class Fighter {
  readonly id: string;
  readonly kind: string;
  readonly side: Side;
  readonly stats: UnitStats;
  /** Body radius on the ground, in metres. */
  readonly radius: number;
  /** How far beyond its own body it can strike, in metres. */
  readonly reach: number;
  /** Area hit around the struck target, in metres (0 = single target). From UBS's splash rule. */
  readonly sweep: number;

  maxHealth: number;
  health: number;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  state: 'Idle' | 'Moving' | 'Attacking' | 'Dead' = 'Idle';
  target: Fighter | null = null;
  attackCooldown = 0;
  isDead = false;
  totalDamageDealt = 0;
  kills = 0;
  /** Seconds since the last strike / hit, for animation. */
  sinceAttack = 99;
  sinceHit = 99;
  deadFor = 0;
  facing: 1 | -1 = 1;

  constructor(opts: {
    id: string;
    kind: string;
    side: Side;
    stats: UnitStats;
    radius: number;
    reach: number;
    sweep?: number;
    x: number;
    y: number;
  }) {
    this.id = opts.id;
    this.kind = opts.kind;
    this.side = opts.side;
    this.stats = { ...opts.stats };
    this.radius = opts.radius;
    this.reach = opts.reach;
    this.sweep = opts.sweep ?? 0;
    this.x = opts.x;
    this.y = opts.y;
    this.maxHealth = this.calculateMaxHealth();
    this.health = this.maxHealth;
  }

  // UBS: base = stamina * 8 + power * 2 (level scaling dropped: everyone is level 1)
  calculateMaxHealth(): number {
    return this.stats.stamina * 8 + this.stats.power * 2;
  }

  // UBS: 3.0 + agility * 0.15 (food modifier dropped: nobody is hungry yet)
  getSpeed(): number {
    if (this.isDead) return 0;
    return 3.0 + this.stats.agility * 0.15;
  }

  // UBS: power * 0.8 + knowledge * 0.2
  getAttackDamage(): number {
    return this.stats.power * 0.8 + this.stats.knowledge * 0.2;
  }

  // UBS: max(0.4, 2.2 - agility * 0.06)
  getAttackCooldownMax(): number {
    return Math.max(0.4, 2.2 - this.stats.agility * 0.06);
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.health = Math.max(0, this.health - amount);
    this.sinceHit = 0;
    if (this.health <= 0) {
      this.isDead = true;
      this.state = 'Dead';
      this.target = null;
      return true;
    }
    return false;
  }
}
