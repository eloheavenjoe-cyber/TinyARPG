import { AnimatedSprite, Container } from 'pixi.js';
import { Rect, rectsOverlap, resolveCollision } from '../world/Room';
import { Enemy } from './Enemy';
import { Sprites } from '../rendering/Sprites';

export type MinionType = 'skeleton_warrior' | 'skeleton_mage' | 'spectre';

const ARRIVAL_THRESHOLD = 20;
const REENGAGE_THRESHOLD = 40;
const GOLDEN_ANGLE = 2.39996;

export class Minion {
  x: number;
  y: number;
  type: MinionType;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  alive = true;
  sprite: AnimatedSprite;
  nameplate: Container | null = null;
  wantsToFire = false;
  sourceEnemyType: string | null = null;

  private lifetime: number;
  private hitFlashTimer = 0;
  private attackCooldown = 0;
  private fireTimer = 0;
  private wobblePhase: number;
  private width = 28;
  private height = 28;
  private static nextId = 0;
  private readonly minionId: number;
  private formationAngle = -1;
  private isIdleArrived = false;

  constructor(x: number, y: number, type: MinionType, hp: number, dmg: number, spd: number, lifetime = -1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.health = hp;
    this.maxHealth = hp;
    this.damage = dmg;
    this.speed = spd;
    this.lifetime = lifetime;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.minionId = Minion.nextId++;

    this.sprite = new AnimatedSprite([Sprites.summoner]);
    this.sprite.anchor.set(0.5);

    if (type === 'skeleton_warrior') {
      this.sprite.scale.set(0.9);
    } else if (type === 'skeleton_mage') {
      this.sprite.scale.set(0.8);
    }
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.health -= amount;
    this.hitFlashTimer = 10;
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  update(playerX: number, playerY: number, enemies: Enemy[], walls: Rect[], dt: number, allMinions: Minion[]) {
    if (!this.alive) return;

    if (this.lifetime > 0) {
      this.lifetime -= dt;
      if (this.lifetime <= 0) {
        this.alive = false;
        return;
      }
    }

    let nearestEnemy: Enemy | null = null;
    let nearestDist = 601;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = e;
      }
    }

    if (nearestEnemy && nearestDist <= 600) {
      this.isIdleArrived = false;

      const dx = nearestEnemy.x - this.x;
      const dy = nearestEnemy.y - this.y;
      const dist = nearestDist;

      switch (this.type) {
        case 'skeleton_warrior': {
          if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;
            this.applyMovement(moveX, moveY, dt);
          }
          if (this.attackCooldown <= 0 && rectsOverlap(this.getBounds(), nearestEnemy.getBounds())) {
            this.attackCooldown = 30;
            nearestEnemy.takeDamage(this.damage);
          }
          break;
        }
        case 'skeleton_mage': {
          const desiredDist = 250;
          if (dist < 150) {
            const moveX = -(dx / dist) * this.speed * dt;
            const moveY = -(dy / dist) * this.speed * dt;
            this.applyMovement(moveX, moveY, dt);
          } else if (dist > desiredDist + 100) {
            const moveX = (dx / dist) * this.speed * dt * 0.7;
            const moveY = (dy / dist) * this.speed * dt * 0.7;
            this.applyMovement(moveX, moveY, dt);
          }
          if (dist <= 400 && this.fireTimer <= 0) {
            this.wantsToFire = true;
            this.fireTimer = 60;
          }
          break;
        }
        case 'spectre': {
          if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;
            this.applyMovement(moveX, moveY, dt);
          }
          break;
        }
      }
    } else {
      if (this.formationAngle < 0) {
        this.formationAngle = (this.minionId * GOLDEN_ANGLE) % (Math.PI * 2);
      }

      const radius = this.type === 'skeleton_warrior' ? 50
        : this.type === 'skeleton_mage' ? 90
        : 65;

      const targetX = playerX + Math.cos(this.formationAngle) * radius;
      const targetY = playerY + Math.sin(this.formationAngle) * radius;

      const tdx = targetX - this.x;
      const tdy = targetY - this.y;
      const tDist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (this.isIdleArrived) {
        if (tDist > REENGAGE_THRESHOLD) {
          this.isIdleArrived = false;
        }
      }

      if (!this.isIdleArrived) {
        if (tDist > ARRIVAL_THRESHOLD) {
          const moveX = (tdx / tDist) * this.speed * dt;
          const moveY = (tdy / tDist) * this.speed * dt;
          this.applyMovement(moveX, moveY, dt);
        } else {
          this.isIdleArrived = true;
        }
      }
    }

    this.applyRepulsion(allMinions, dt);

    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    this.x = resolved.x + this.width / 2;
    this.y = resolved.y + this.height / 2;

    const faceDx = nearestEnemy ? nearestEnemy.x - this.x : playerX - this.x;
    this.sprite.scale.x = faceDx < 0 ? -Math.abs(this.sprite.scale.x) : Math.abs(this.sprite.scale.x);

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.sprite.alpha = this.hitFlashTimer > 0 ? 0.5 : 1;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.fireTimer > 0) this.fireTimer -= dt;

    this.updateSprite();
  }

  private applyMovement(moveX: number, moveY: number, dt: number) {
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

  private applyRepulsion(minions: Minion[], dt: number) {
    for (const other of minions) {
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

  private updateSprite() {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    if (this.nameplate) {
      this.nameplate.x = this.x;
      this.nameplate.y = this.y - this.height / 2 - 40;
    }
  }

  destroy() {
    this.sprite.destroy();
    if (this.nameplate) {
      this.nameplate.destroy({ children: true });
    }
  }
}
