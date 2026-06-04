import { Sprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Logger } from '../core/Logger';
import { Rect, resolveCollision } from '../world/Room';

export class Enemy {
  x: number;
  y: number;
  readonly width = 28;
  readonly height = 28;
  health = 40;
  maxHealth = 40;
  speed = 2.2;
  alive = true;

  sprite: Sprite;
  private hitFlashTimer = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(Sprites.enemy);
    this.sprite.anchor.set(0.5);
    this.sprite.tint = 0xffffff;
    this.updateSprite();
  }

  update(playerX: number, playerY: number, walls: Rect[], dt: number) {
    if (!this.alive) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;
      this.x += moveX;
      this.y += moveY;
    }

    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    this.x = resolved.x + this.width / 2;
    this.y = resolved.y + this.height / 2;

    this.sprite.rotation = Math.atan2(playerY - this.y, playerX - this.x);

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.sprite.tint = this.hitFlashTimer > 0 ? 0xff6666 : 0xffffff;
    }

    this.updateSprite();
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;

    this.health -= amount;
    this.hitFlashTimer = 10;
    Logger.log('combat', `Enemy took ${amount} dmg (hp: ${Math.max(0, this.health)}/${this.maxHealth})`);

    if (this.health <= 0) {
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('entity', 'Enemy killed');
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
}
