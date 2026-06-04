import { Sprite, Graphics, Texture, AnimatedSprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Projectile } from './Projectile';
import { Rect, resolveCollision } from '../world/Room';
import { Logger } from '../core/Logger';
import { createReaperSprite, playReaperAnimation, createGolemSprite, playGolemAnimation, ReaperAnimName, GolemAnimName } from '../rendering/SpriteAnimator';

export type BossId = 'golem' | 'reaper';

interface BossConfig {
  bossId: BossId;
  name: string;
  hp: number;
  size: number;
  speed: number;
  damage: number;
  sprite: Texture;
  xpReward: number;
}

export interface TelegraphShape {
  type: 'line' | 'circle' | 'cone';
  x: number; y: number;
  targetX?: number; targetY?: number;
  radius?: number;
  angle?: number;
  duration: number;
  maxDuration: number;
  color: number;
}

export class Boss {
  x: number;
  y: number;
  readonly bossId: BossId;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  alive = true;
  xpReward: number;

  sprite: Sprite;
  telegraphs: Graphics;
  projectiles: Projectile[] = [];
  cullThreshold = 0;

  chosenAttack: TelegraphShape | null = null;
  attacking = false;
  pendingAttackDamage: (TelegraphShape & { damageAmt: number }) | null = null;

  private phase = 0;
  private attackCooldown = 0;
  private currentAttack = 0;
  private hitFlashTimer = 0;
  private aiTimer = 0;
  private attackWindup = 0;
  private spawnEnemiesCallback: ((count: number, type: string) => void) | null = null;

  constructor(x: number, y: number, bossId: BossId) {
    const cfg = getBossConfig(bossId);
    this.x = x;
    this.y = y;
    this.bossId = cfg.bossId;
    this.name = cfg.name;
    this.width = cfg.size;
    this.height = cfg.size;
    this.health = cfg.hp;
    this.maxHealth = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.xpReward = cfg.xpReward;

    if (bossId === 'reaper') {
      this.sprite = createReaperSprite();
    } else if (bossId === 'golem') {
      this.sprite = createGolemSprite();
    } else {
      this.sprite = new Sprite(cfg.sprite);
    }
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(1.25);
    this.sprite.tint = 0xffffff;
    this.sprite.x = x;
    this.sprite.y = y;

    this.telegraphs = new Graphics();
    if (bossId === 'reaper') {
      (this.sprite as AnimatedSprite).play();
    }
  }

  playAnim(name: ReaperAnimName | GolemAnimName, loop = true) {
    if (this.bossId === 'reaper') {
      playReaperAnimation(this.sprite as AnimatedSprite, name as ReaperAnimName, loop);
    } else if (this.bossId === 'golem') {
      playGolemAnimation(this.sprite as AnimatedSprite, name as GolemAnimName, loop);
    }
  }

  onSpawnEnemies(callback: (count: number, type: string) => void) {
    this.spawnEnemiesCallback = callback;
  }

  update(playerX: number, playerY: number, dt: number, walls: Rect[]) {
    if (!this.alive) return;

    const hpPct = this.health / this.maxHealth;
    const newPhase = hpPct > 0.75 ? 0 : hpPct > 0.50 ? 1 : hpPct > 0.25 ? 2 : 3;
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      Logger.log('entity', `${this.name} enters phase ${this.phase + 1}`);
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    this.telegraphs.clear();

    switch (this.bossId) {
      case 'golem': this.updateGolem(dx, dy, dist, dt, playerX, playerY); break;
      case 'reaper': this.updateReaper(dx, dy, dist, dt, playerX, playerY); break;
    }

    // Telegraph phase: count down windup, draw telegraph
    if (this.chosenAttack && !this.attacking) {
      this.attackWindup -= dt;
      const t = this.chosenAttack;
      const progress = 1 - this.attackWindup / t.maxDuration;
      this.drawTelegraph(t, progress);
      if (this.attackWindup <= 0) {
        this.attacking = true;
        this.executeAttack(playerX, playerY);
        this.chosenAttack = null;
        this.attacking = false;
      }
    }

    // Wall collision
    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    this.x = resolved.x + this.width / 2;
    this.y = resolved.y + this.height / 2;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.sprite.tint = this.hitFlashTimer > 0 ? 0xff6666 : 0xffffff;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.aiTimer > 0) this.aiTimer -= dt;

    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  private updateGolem(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const speedMult = 1 + this.phase * 0.2;

    if (!this.attacking && dist > 80) {
      const moveX = (dx / dist) * this.speed * speedMult * dt;
      const moveY = (dy / dist) * this.speed * speedMult * dt;
      this.x += moveX;
      this.y += moveY;
    }

    // Walk/idle animation
    if (!this.attacking) {
      if (dist > 80) {
        this.playAnim('walk');
      } else {
        this.playAnim('idle');
      }
    }

    if (this.aiTimer <= 0 && !this.attacking) {
      this.aiTimer = 60 + Math.random() * 60;
      this.attackCooldown = 40;

      const available: (() => void)[] = [() => {
        this.playAnim('attack', false);
        this.prepareTelegraph({
          type: 'cone', x: this.x, y: this.y, angle: Math.atan2(dy, dx),
          radius: 100, duration: 40, maxDuration: 40, color: 0xff8844,
        });
      }]; // Ground Slam

      available.push(() => {
        this.playAnim('attack', false);
        this.prepareTelegraph({
          type: 'line', x: this.x, y: this.y,
          targetX: px, targetY: py,
          duration: 40, maxDuration: 40, color: 0xff4444,
        });
      }); // Boulder Toss

      if (this.phase >= 1) {
        available.push(() => {
          this.playAnim('attack', false);
          this.prepareTelegraph({
            type: 'circle', x: this.x, y: this.y,
            radius: 80, duration: 50, maxDuration: 50, color: 0xff6622,
          });
        }); // Stomp
      }

      const idx = Math.floor(Math.random() * available.length);
      available[idx]();
    }
  }

  private updateReaper(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const speedMult = 1 + this.phase * 0.15;

    if (!this.attacking && dist > 200) {
      const moveX = (dx / dist) * this.speed * speedMult * dt;
      const moveY = (dy / dist) * this.speed * speedMult * dt;
      this.x += moveX;
      this.y += moveY;
    }

    if (this.aiTimer <= 0 && !this.attacking) {
      this.aiTimer = 70 + Math.random() * 80;
      this.attackCooldown = 50;

      const available: (() => void)[] = [() => {
        this.playAnim('attack', false);
        this.prepareTelegraph({
          type: 'cone', x: this.x, y: this.y, angle: Math.atan2(dy, dx),
          radius: 120, duration: 45, maxDuration: 45, color: 0xcc44cc,
        });
      }]; // Scythe Sweep

      if (this.phase >= 1) {
        available.push(() => {
          this.playAnim('attack', false);
          this.prepareTelegraph({
            type: 'circle', x: px, y: py,
            radius: 80, duration: 50, maxDuration: 50, color: 0x8822aa,
          });
        }); // Teleport Slam
      }

      if (this.phase >= 2 && this.spawnEnemiesCallback) {
        available.push(() => {
          this.playAnim('summon', false);
          this.spawnEnemiesCallback!(this.phase >= 3 ? 3 : 2, 'cultist');
          this.aiTimer = 60;
        });
      }

      if (this.phase >= 2 && this.spawnEnemiesCallback) {
        available.push(() => {
          this.spawnEnemiesCallback!(this.phase >= 3 ? 3 : 2, 'cultist');
          this.aiTimer = 60;
        });
      }

      const idx = Math.floor(Math.random() * available.length);
      available[idx]();
    }
  }

  private prepareTelegraph(shape: TelegraphShape) {
    this.chosenAttack = shape;
    this.attackWindup = shape.duration;
  }

  private drawTelegraph(t: TelegraphShape, progress: number) {
    const alpha = 0.3 + 0.4 * Math.abs(Math.sin(progress * Math.PI * 3));
    this.telegraphs.clear();

    switch (t.type) {
      case 'line': {
        const angle = Math.atan2((t.targetY || 0) - t.y, (t.targetX || 0) - t.x);
        const len = Math.hypot((t.targetX || 0) - t.x, (t.targetY || 0) - t.y);
        const grown = len * progress;
        const halfW = 14;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const perpX = -sinA * halfW;
        const perpY = cosA * halfW;
        const ex = t.x + cosA * grown;
        const ey = t.y + sinA * grown;
        this.telegraphs.lineStyle(2, t.color, alpha * 0.4);
        this.telegraphs.moveTo(t.x + perpX, t.y + perpY);
        this.telegraphs.lineTo(ex + perpX, ey + perpY);
        this.telegraphs.moveTo(t.x - perpX, t.y - perpY);
        this.telegraphs.lineTo(ex - perpX, ey - perpY);
        this.telegraphs.lineStyle(1, t.color, alpha * 0.2);
        this.telegraphs.moveTo(t.x + perpX * 0.5, t.y + perpY * 0.5);
        this.telegraphs.lineTo(ex + perpX * 0.5, ey + perpY * 0.5);
        this.telegraphs.moveTo(t.x - perpX * 0.5, t.y - perpY * 0.5);
        this.telegraphs.lineTo(ex - perpX * 0.5, ey - perpY * 0.5);
        break;
      }
      case 'circle':
        this.telegraphs.lineStyle(4, t.color, alpha * 0.6);
        this.telegraphs.drawCircle(t.x, t.y, (t.radius || 80) * progress);
        this.telegraphs.lineStyle(2, t.color, alpha * 0.3);
        this.telegraphs.drawCircle(t.x, t.y, (t.radius || 80) * progress * 0.85);
        break;
      case 'cone': {
        const halfA = 0.6;
        const r = (t.radius || 100) * progress;
        this.telegraphs.lineStyle(3, t.color, alpha);
        this.telegraphs.moveTo(t.x, t.y);
        this.telegraphs.arc(t.x, t.y, r, (t.angle || 0) - halfA, (t.angle || 0) + halfA);
        this.telegraphs.closePath();
        break;
      }
    }
  }

  private executeAttack(px: number, py: number) {
    if (!this.chosenAttack) return;
    const t = this.chosenAttack;
    const isReaper = this.bossId === 'reaper';

    switch (t.type) {
      case 'cone':
        this.pendingAttackDamage = { ...t, damageAmt: this.damage };
        break;
      case 'line': {
        const angle = Math.atan2(py - this.y, px - this.x);
        const p = new Projectile(this.x, this.y, angle, 8, this.damage, false, true, 0xcc8844, 0, 14);
        p.lifetime = 60;
        p.sprite.clear();
        p.sprite.beginFill(0x887766);
        p.sprite.drawCircle(0, 0, 14);
        p.sprite.beginFill(0x665544);
        p.sprite.drawCircle(-4, -3, 10);
        p.sprite.beginFill(0x554433);
        p.sprite.drawCircle(2, -1, 6);
        p.sprite.endFill();
        this.projectiles.push(p);
        break;
      }
      case 'circle':
        if (isReaper) {
          this.x = t.x;
          this.y = t.y;
        }
        this.pendingAttackDamage = { ...t, damageAmt: this.damage };
        break;
    }

    this.telegraphs.clear();
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.health -= amount;
    this.hitFlashTimer = 10;
    Logger.log('combat', `[${this.name}] took ${amount} dmg (hp: ${Math.max(0, this.health)}/${this.maxHealth})`);
    if (this.health <= 0) {
      this.alive = false;
      this.playAnim('death', false);
      Logger.log('entity', `${this.name} defeated`);
      return true;
    }
    return false;
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  destroy() {
    this.sprite.destroy();
    this.telegraphs.destroy();
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
  }
}

function getBossConfig(bossId: BossId): BossConfig {
  switch (bossId) {
    case 'golem':
      return { bossId: 'golem', name: 'Stone Golem', hp: 500, size: 96, speed: 1.5, damage: 15, sprite: Sprites.golem, xpReward: 100 };
    case 'reaper':
      return { bossId: 'reaper', name: 'Death Reaper', hp: 800, size: 96, speed: 2.0, damage: 20, sprite: Sprites.reaper, xpReward: 200 };
  }
}
