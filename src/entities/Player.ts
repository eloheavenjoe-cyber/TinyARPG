import { Sprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { InputManager } from '../core/InputManager';
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
  speed = 6;
  alive = true;

  sprite: Sprite;
  private invulnTimer = 0;
  private attackCooldown = 0;
  private readonly attackRange = 65;
  private readonly attackDamage = 30;
  private readonly attackCooldownFrames = 20;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(Sprites.player);
    this.sprite.anchor.set(0.5);
    this.updateSprite();
  }

  update(input: InputManager, mouseWorldX: number, mouseWorldY: number, walls: Rect[], dt: number) {
    if (!this.alive) return;

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

    const speed = this.speed * dt;
    this.x += dx * speed;
    this.y += dy * speed;

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

    this.updateSprite();
  }

  takeDamage(amount: number): boolean {
    if (this.invulnTimer > 0 || !this.alive) return false;

    this.health = Math.max(0, this.health - amount);
    this.invulnTimer = 60;
    Logger.log('combat', `Player took ${amount} dmg (hp: ${this.health}/${this.maxHealth})`);

    if (this.health <= 0) {
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('combat', 'Player died');
      return true;
    }
    return false;
  }

  meleeAttack(enemies: Enemy[]) {
    if (this.attackCooldown > 0 || !this.alive) return;
    this.attackCooldown = this.attackCooldownFrames;

    Logger.log('combat', 'Player melee attack');

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - this.sprite.rotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (dist < this.attackRange && Math.abs(angleDiff) < Math.PI / 2) {
        enemy.takeDamage(this.attackDamage);
        break;
      }
    }

    this.updateSprite();
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
