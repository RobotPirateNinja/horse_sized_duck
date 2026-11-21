// A 2D, melee-only version of Taylor_UBS's SimulationEngine (src/core/SimulationEngine.ts).
// Same loop: retarget every 0.3 s, seek + separation + cohesion steering, attack on cooldown,
// end when a side is wiped out. Positions are metres on a flat field; no terrain.

import { Fighter, type Side } from './ubs';

export interface BattleResult {
  winner: Side | 'draw';
  seconds: number;
  challengerKills: number;
  opponentsLeft: number;
}

export class BattleEngine {
  fighters: Fighter[];
  time = 0;
  ended = false;
  result: BattleResult | null = null;
  readonly halfW: number;
  readonly halfH: number;
  readonly timeLimit: number;
  private retargetTimer = 0;
  onHit?: (attacker: Fighter, victim: Fighter, amount: number) => void;

  constructor(fighters: Fighter[], halfW: number, halfH: number, timeLimit = 180) {
    this.fighters = fighters;
    this.halfW = halfW;
    this.halfH = halfH;
    this.timeLimit = timeLimit;
    // Stagger first attacks, as UBS does.
    for (const f of fighters) f.attackCooldown = Math.random() * 0.5;
  }

  /** Advance by dt seconds (clamped to 0.05 like UBS). */
  step(deltaTime: number) {
    if (this.ended) return;
    const dt = Math.min(deltaTime, 0.05);
    this.time += dt;
    for (const f of this.fighters) {
      f.sinceAttack += dt;
      f.sinceHit += dt;
      if (f.isDead) f.deadFor += dt;
    }

    this.retargetTimer += dt;
    const forceRetarget = this.retargetTimer >= 0.3;
    if (forceRetarget) this.retargetTimer = 0;

    this.updateAI(dt, forceRetarget);
    this.updatePhysics(dt);
    this.checkWin();
  }

  /** Run to the end without drawing. */
  runToEnd() {
    while (!this.ended) this.step(1 / 60);
    return this.result!;
  }

  private alive(side?: Side) {
    return this.fighters.filter((f) => !f.isDead && (!side || f.side === side));
  }

  private updateAI(dt: number, forceRetarget: boolean) {
    for (const u of this.fighters) {
      if (u.isDead) continue;
      if (u.attackCooldown > 0) u.attackCooldown -= dt;

      if (forceRetarget || !u.target || u.target.isDead) u.target = this.closestEnemy(u);
      const t = u.target;
      if (!t) {
        u.state = 'Idle';
        u.vx = u.vy = 0;
        continue;
      }

      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) u.facing = dx > 0 ? 1 : -1;

      const range = u.radius + t.radius + u.reach;
      if (dist <= range) {
        u.state = 'Attacking';
        u.vx = u.vy = 0;
        if (u.attackCooldown <= 0) {
          this.attack(u, t);
          u.attackCooldown = u.getAttackCooldownMax();
        }
      } else {
        u.state = 'Moving';
        this.steer(u, t, dt);
      }
    }
  }

  private closestEnemy(u: Fighter): Fighter | null {
    let best: Fighter | null = null;
    let bestD = Infinity;
    for (const f of this.fighters) {
      if (f.isDead || f.side === u.side) continue;
      // Distance to the enemy's edge, so a big target counts as close.
      const d = Math.hypot(f.x - u.x, f.y - u.y) - f.radius;
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  private attack(u: Fighter, t: Fighter) {
    u.sinceAttack = 0;
    // Added here (not in UBS): each blow lands somewhere between 75% and 125%,
    // so close fights can go either way on a rematch.
    const dmg = u.getAttackDamage() * (0.75 + Math.random() * 0.5);
    const victims = u.sweep > 0 ? this.alive(t.side).filter((v) => Math.hypot(v.x - t.x, v.y - t.y) <= u.sweep + v.radius) : [t];
    for (const v of victims) {
      // UBS splash: 100% at the centre falling to 30% at the edge.
      const d = Math.hypot(v.x - t.x, v.y - t.y);
      const factor = v === t || u.sweep === 0 ? 1 : Math.max(0.3, 1 - d / u.sweep);
      // Added here (not in UBS): toughness. Skin, fur and bone soak up blows that are
      // small next to the defender's own build, so a kick much weaker than you barely lands.
      const raw = dmg * factor;
      const armor = v.stats.stamina * 0.05;
      const amount = (raw * raw) / (raw + armor);
      u.totalDamageDealt += amount;
      const died = v.takeDamage(amount);
      if (died) u.kills++;
      this.onHit?.(u, v, amount);
    }
  }

  private steer(u: Fighter, t: Fighter, dt: number) {
    // Seek
    let sx = t.x - u.x;
    let sy = t.y - u.y;
    const sl = Math.hypot(sx, sy) || 1;
    sx /= sl;
    sy /= sl;

    // Separation from allies (UBS uses a 2.5 m query; here it scales with body size)
    let px = 0,
      py = 0,
      pc = 0,
      cx = 0,
      cy = 0;
    const near = u.radius * 4 + 0.2;
    for (const n of this.fighters) {
      if (n === u || n.isDead || n.side !== u.side) continue;
      const dx = u.x - n.x;
      const dy = u.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d < near && d > 0.0001) {
        const scaled = d / (u.radius + n.radius);
        px += dx / d / scaled;
        py += dy / d / scaled;
        cx += n.x;
        cy += n.y;
        pc++;
      }
    }
    if (pc) {
      px /= pc;
      py /= pc;
    }

    // Cohesion, weighted by social as in UBS
    let hx = 0,
      hy = 0;
    if (pc && u.stats.social > 2) {
      hx = cx / pc - u.x;
      hy = cy / pc - u.y;
      const hl = Math.hypot(hx, hy) || 1;
      hx /= hl;
      hy /= hl;
    }
    const socialWeight = u.stats.social / 20;

    const ax = sx * 1.0 + px * 1.8 + hx * socialWeight * 0.4;
    const ay = sy * 1.0 + py * 1.8 + hy * socialWeight * 0.4;

    // UBS: accelerate, cap at speed, damp
    const speed = u.getSpeed();
    u.vx += ax * dt * 10;
    u.vy += ay * dt * 10;
    const cur = Math.hypot(u.vx, u.vy);
    if (cur > speed) {
      u.vx = (u.vx / cur) * speed;
      u.vy = (u.vy / cur) * speed;
    }
    u.vx *= 0.85;
    u.vy *= 0.85;
  }

  private updatePhysics(dt: number) {
    for (const u of this.fighters) {
      if (u.isDead || u.state !== 'Moving') continue;
      u.x = Math.max(-this.halfW, Math.min(this.halfW, u.x + u.vx * dt));
      u.y = Math.max(-this.halfH, Math.min(this.halfH, u.y + u.vy * dt));
    }
    // Simple body overlap push, so bodies don't stack.
    const live = this.alive();
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i],
          b = live[j];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = (a.radius + b.radius) * 0.9;
        if (d < min && d > 0.0001) {
          const push = (min - d) / 2;
          // Heavier bodies (mass ~ radius³) get shoved less.
          const ma = a.radius ** 3,
            mb = b.radius ** 3;
          const wa = mb / (ma + mb);
          const wb = 1 - wa;
          a.x -= (dx / d) * push * wa * 2;
          a.y -= (dy / d) * push * wa * 2;
          b.x += (dx / d) * push * wb * 2;
          b.y += (dy / d) * push * wb * 2;
        }
      }
    }
  }

  private checkWin() {
    const c = this.alive('challenger').length;
    const o = this.alive('opponent').length;
    const challenger = this.fighters.find((f) => f.side === 'challenger');
    if (c === 0 || o === 0 || this.time >= this.timeLimit) {
      this.ended = true;
      this.result = {
        winner: c > 0 && o === 0 ? 'challenger' : o > 0 && c === 0 ? 'opponent' : 'draw',
        seconds: this.time,
        challengerKills: challenger?.kills ?? 0,
        opponentsLeft: o,
      };
    }
  }
}
