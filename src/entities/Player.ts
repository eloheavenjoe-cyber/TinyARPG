import { Sprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { InputManager } from '../core/InputManager';
import { SkillManager } from '../core/SkillManager';
import { SkillDef } from '../core/SkillDefs';
import { Logger } from '../core/Logger';
import { Rect, resolveCollision } from '../world/Room';
import { Enemy } from './Enemy';

export class Player {
  x: number;
  y: number;
  readonly width = 28;
  readonly height = 28;
  health = 100;
  maxHealth = 100;
  mana = 50;
  maxMana = 50;
  gold = 0;
  speed = 6;
  alive = true;

  sprite: Sprite;
  skills: SkillManager;

  private invulnTimer = 0;
  private attackCooldown = 0;
  private fallbackAttackCooldown = 15;
  private readonly baseManaRegen = 8;
  lastHitInfo: { x: number; y: number; damage: number } | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(Sprites.player);
    this.sprite.anchor.set(0.5);
    this.skills = new SkillManager();
    this.updateSprite();
  }

  update(input: InputManager, mouseWorldX: number, mouseWorldY: number, walls: Rect[], dt: number) {
    if (!this.alive) return;

    this.skills.update(dt);

    let dx = 0, dy = 0;
    if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) dy = -1;
    if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) dy = 1;
    if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) dx = -1;
    if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) dx = 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      Logger.log('movement', `Moving: (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
    }

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    const newX = resolved.x + this.width / 2;
    const newY = resolved.y + this.height / 2;
    if (newX !== this.x || newY !== this.y) {
      Logger.log('collision', `Wall push at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}) -> (${newX.toFixed(0)}, ${newY.toFixed(0)})`);
    }
    this.x = newX;
    this.y = newY;

    this.sprite.rotation = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      this.sprite.alpha = Math.floor(this.invulnTimer / 5) % 2 === 0 ? 1 : 0.4;
    } else {
      this.sprite.alpha = 1;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const regen = this.baseManaRegen + this.skills.manaRegenBonus();
    this.mana = Math.min(this.maxMana, this.mana + regen * (dt / 60));

    this.updateSprite();
  }

  takeDamage(amount: number): boolean {
    if (this.invulnTimer > 0 || !this.alive) return false;
    if (this.skills.isInvulnerable()) return false;

    const reduction = this.skills.damageReduction();
    const finalDmg = reduction > 0 ? Math.round(amount * (1 - reduction)) : amount;

    this.health = Math.max(0, this.health - finalDmg);
    this.invulnTimer = 60;
    Logger.log('combat', `Player took ${finalDmg} dmg (${reduction > 0 ? `${Math.round(reduction * 100)}% reduced, ` : ''}hp: ${this.health}/${this.maxHealth})`);

    if (this.health <= 0) {
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('combat', 'Player died');
      return true;
    }
    return false;
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    Logger.log('combat', `Player healed for ${amount} (hp: ${this.health}/${this.maxHealth})`);
  }

  useMainAbility(enemies: Enemy[]): boolean {
    const skill = this.skills.mainAbility;
    if (!skill) return false;

    const result = this.skills.consume(0, this.mana);
    if (!result) return false;
    this.mana -= result.manaCost;

    switch (skill.effectType) {
      case 'cone': {
        const angleRad = skill.angle || Math.PI / 2;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > skill.range) continue;
          const angleToEnemy = Math.atan2(dy, dx);
          let diff = angleToEnemy - this.sprite.rotation;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) > angleRad / 2) continue;
          const dmg = this.calcDamage(skill);
          enemy.takeDamage(dmg);
          this.lastHitInfo = { x: enemy.x, y: enemy.y, damage: dmg };
          Logger.log('combat', `${skill.name} hit for ${dmg}`);
        }
        break;
      }
      case 'single': {
        let closest: Enemy | null = null;
        let closestDist = skill.range;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (d < closestDist) { closestDist = d; closest = enemy; }
        }
        if (closest) {
          const dmg = this.calcDamage(skill);
          closest.takeDamage(dmg);
          this.lastHitInfo = { x: closest.x, y: closest.y, damage: dmg };
          Logger.log('combat', `${skill.name} hit for ${dmg}${skill.duration ? ' (stun)' : ''}`);
        }
        break;
      }
      case 'aoe_self': {
        const radius = skill.radius || 75;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (Math.hypot(enemy.x - this.x, enemy.y - this.y) < radius) {
            const dmg = this.calcDamage(skill);
            enemy.takeDamage(dmg);
            this.lastHitInfo = { x: enemy.x, y: enemy.y, damage: dmg };
          }
        }
        Logger.log('combat', `${skill.name} aoe`);
        break;
      }
    }

    this.updateSprite();
    return true;
  }

  private calcDamage(skill: SkillDef): number {
    return Math.round(25 * skill.damageMult);
  }

  getAttackCooldown(): number {
    const skill = this.skills.mainAbility;
    if (!skill) return this.fallbackAttackCooldown;
    const mult = this.skills.attackSpeedMult();
    return Math.max(5, Math.round(skill.cooldown / mult));
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
}
