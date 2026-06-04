import { Sprite, Texture, AnimatedSprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { createCultistSprite, playCultistAnimation, CultistAnimName } from '../rendering/SpriteAnimator';
import { Logger } from '../core/Logger';
import { Rect, resolveCollision } from '../world/Room';
import { Projectile } from './Projectile';

export type EnemyType = 'grunt' | 'archer' | 'juggernaut' | 'cultist';

interface EnemyConfig {
  hp: number;
  speed: number;
  size: number;
  xp: number;
  sprite: Texture;
  damage: number;
}

function getConfig(type: EnemyType): EnemyConfig {
  switch (type) {
    case 'grunt':
      return { hp: 40, speed: 2.2, size: 28, xp: 10, sprite: Sprites.enemy, damage: 8 };
    case 'archer':
      return { hp: 25, speed: 2.5, size: 28, xp: 12, sprite: Sprites.archer, damage: 6 };
    case 'juggernaut':
      return { hp: 120, speed: 1.2, size: 42, xp: 25, sprite: Sprites.juggernaut, damage: 16 };
    case 'cultist':
      return { hp: 35, speed: 2.0, size: 28, xp: 15, sprite: Sprites.cultist, damage: 5 };
  }
}

export class Enemy {
  x: number;
  y: number;
  readonly type: EnemyType;
  readonly width: number;
  readonly height: number;
  health: number;
  maxHealth: number;
  speed: number;
  readonly baseSpeed: number;
  alive = true;
  xpReward: number;
  damage: number;

  sprite: Sprite;
  private hitFlashTimer = 0;
  private attackCooldown = 0;
  private fireTimer = 0;
  private blinkCooldown = 0;
  private wobblePhase: number;
  private animState: 'idle' | 'run' | 'attack' | 'death' = 'idle';

  projectiles: Projectile[] = [];

  constructor(x: number, y: number, type: EnemyType) {
    const cfg = getConfig(type);
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = cfg.size;
    this.height = cfg.size;
    this.health = cfg.hp;
    this.maxHealth = cfg.hp;
    this.baseSpeed = cfg.speed;
    this.speed = cfg.speed * (0.85 + Math.random() * 0.3);
    this.xpReward = cfg.xp;
    this.damage = cfg.damage;
    this.wobblePhase = Math.random() * Math.PI * 2;

    this.sprite = type === 'cultist' ? createCultistSprite() : new Sprite(cfg.sprite);
    this.sprite.anchor.set(0.5);
    this.sprite.tint = 0xffffff;
    this.updateSprite();
  }

  update(playerX: number, playerY: number, walls: Rect[], dt: number, enemies: Enemy[]) {
    if (!this.alive) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    switch (this.type) {
      case 'grunt':
        this.updateGrunt(dx, dy, dist, dt);
        break;
      case 'archer':
        this.updateArcher(dx, dy, dist, dt, playerX, playerY);
        break;
      case 'juggernaut':
        this.updateJuggernaut(dx, dy, dist, dt);
        break;
      case 'cultist':
        this.updateCultist(dx, dy, dist, dt, playerX, playerY);
        break;
    }

    // Enemy repulsion
    this.applyRepulsion(enemies, dt);

    // Wall collision
    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    this.x = resolved.x + this.width / 2;
    this.y = resolved.y + this.height / 2;

    // Facing
    const faceAngle = Math.atan2(playerY - this.y, playerX - this.x);
    if (this.type === 'cultist') {
      const wasMoving = this.animState === 'run';
      this.sprite.scale.x = Math.abs(faceAngle) > Math.PI / 2 ? -1 : 1;
      if (!wasMoving && this.animState === 'run') {
        playCultistAnimation(this.sprite as AnimatedSprite, 'run');
      }
    } else {
      this.sprite.rotation = faceAngle;
    }

    // Animation state
    const isMoving = dx !== 0 || dy !== 0;
    if (this.type === 'cultist') {
      if (!this.alive) {
        this.animState = 'death';
      } else if (this.animState !== 'attack') {
        this.animState = isMoving ? 'run' : 'idle';
      }
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.sprite.tint = this.hitFlashTimer > 0 ? 0xff6666 : 0xffffff;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.blinkCooldown > 0) this.blinkCooldown -= dt;

    this.updateSprite();
  }

  private updateGrunt(dx: number, dy: number, dist: number, dt: number) {
    if (dist > 0) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    }
  }

  private updateArcher(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const desiredDist = 250;

    if (dist < 150) {
      // Too close - flee
      const moveX = -(dx / dist) * this.speed * dt;
      const moveY = -(dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    } else if (dist > desiredDist + 100) {
      // Too far - approach
      const moveX = (dx / dist) * this.speed * dt * 0.7;
      const moveY = (dy / dist) * this.speed * dt * 0.7;
      this.applyMovement(moveX, moveY, dt);
    } else {
      // Good range - strafe
      const perpX = -(dy / dist) * this.speed * 0.5 * dt;
      const perpY = (dx / dist) * this.speed * 0.5 * dt;
      this.applyMovement(perpX, perpY, dt);
    }

    // Fire arrow
    if (dist < 500 && this.fireTimer <= 0) {
      this.fireTimer = 60;
      const angle = Math.atan2(py - this.y, px - this.x);
      const p = new Projectile(this.x, this.y, angle, 4, this.damage, false, true, 0xcc3333);
      p.lifetime = 90;
      this.projectiles.push(p);
    }
  }

  private updateJuggernaut(dx: number, dy: number, dist: number, dt: number) {
    if (dist > 0) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    }
  }

  private updateCultist(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const desiredDist = 250;

    if (dist < 120 && this.blinkCooldown <= 0) {
      // Teleport away
      const angle = Math.atan2(py - this.y, px - this.x);
      this.x -= Math.cos(angle) * 200;
      this.y -= Math.sin(angle) * 200;
      this.blinkCooldown = 180;
      // Clamp to room
      this.x = Math.max(50, Math.min(1550, this.x));
      this.y = Math.max(50, Math.min(846, this.y));
    } else if (dist < 150) {
      const moveX = -(dx / dist) * this.speed * dt;
      const moveY = -(dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    } else if (dist > desiredDist + 100) {
      const moveX = (dx / dist) * this.speed * dt * 0.6;
      const moveY = (dy / dist) * this.speed * dt * 0.6;
      this.applyMovement(moveX, moveY, dt);
    } else {
      const perpX = -(dy / dist) * this.speed * 0.4 * dt;
      const perpY = (dx / dist) * this.speed * 0.4 * dt;
      this.applyMovement(perpX, perpY, dt);
    }

    // Fire slow orb
    if (dist < 500 && this.fireTimer <= 0) {
      this.fireTimer = 80;
      const angle = Math.atan2(py - this.y, px - this.x);
      const p = new Projectile(this.x, this.y, angle, 3.5, this.damage, false, true, 0x9933cc, 120);
      p.lifetime = 100;
      this.projectiles.push(p);
      this.animState = 'attack';
      playCultistAnimation(this.sprite as AnimatedSprite, 'attack', false);
      (this.sprite as AnimatedSprite).onComplete = () => {
        if (this.animState === 'attack') {
          this.animState = 'idle';
        }
      };
    }
  }

  private applyMovement(moveX: number, moveY: number, dt: number) {
    // Wobble: sinusoidal offset perpendicular to movement
    this.wobblePhase += 0.05 * dt;
    const wobbleAmp = 0.3;
    if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      const nx = moveX / len;
      const ny = moveY / len;
      const wobble = Math.sin(this.wobblePhase) * wobbleAmp;
      this.x += moveX + (-ny * wobble);
      this.y += moveY + (nx * wobble);
    } else {
      this.x += moveX;
      this.y += moveY;
    }
  }

  private applyRepulsion(enemies: Enemy[], dt: number) {
    for (const other of enemies) {
      if (other === this || !other.alive) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (this.width + other.width) / 2 + 5;
      if (dist < minDist && dist > 0) {
        const force = (minDist - dist) / minDist * 1.5;
        this.x += (dx / dist) * force * dt;
        this.y += (dy / dist) * force * dt;
      }
    }
  }

  canDamagePlayer(): boolean {
    return this.type !== 'archer' && this.type !== 'cultist' && this.attackCooldown <= 0;
  }

  onDamagePlayer() {
    this.attackCooldown = 30;
  }

  cullThreshold = 0;

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;

    if (this.cullThreshold > 0 && this.health > 0 && this.health <= this.cullThreshold) {
      this.health = 0;
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('entity', `${this.type} culled`);
      return true;
    }

    this.health -= amount;
    this.hitFlashTimer = 10;
    Logger.log('combat', `[${this.type}] took ${amount} dmg (hp: ${Math.max(0, this.health)}/${this.maxHealth})`);
    if (this.health <= 0) {
      this.alive = false;
      if (this.type === 'cultist') {
        playCultistAnimation(this.sprite as AnimatedSprite, 'death', false);
      } else {
        this.sprite.visible = false;
      }
      Logger.log('entity', `${this.type} killed`);
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

  private updateSprite() {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  destroy() {
    this.sprite.destroy();
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
  }
}
