import { Graphics } from 'pixi.js';
import { Rect } from '../world/Room';

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  lifetime: number;
  alive = true;
  pierce: boolean;
  hostile: boolean;
  slowDuration: number;
  size: number;
  sprite: Graphics;
  hitTargets: Set<object> = new Set();
  bounceCount = 0;
  bounceRange = 250;
  chained = false;
  skillId = '';
  consecutiveHits: Map<any, number> | null = null;

  constructor(x: number, y: number, angle: number, speed: number, damage: number, pierce = false, hostile = false, color = 0xffdd44, slowDuration = 0, size = 4) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.pierce = pierce;
    this.hostile = hostile;
    this.slowDuration = slowDuration;
    this.size = size;
    this.lifetime = 60;

    this.sprite = new Graphics();
    if (hostile) {
      this.sprite.beginFill(color);
      this.sprite.drawCircle(0, 0, size);
      this.sprite.endFill();
    } else {
      this.sprite.beginFill(0xffee44);
      this.sprite.drawRect(-3, -1, 7, 3);
      this.sprite.endFill();
      this.sprite.beginFill(0xffcc00);
      this.sprite.drawRect(3, -1, 3, 2);
      this.sprite.endFill();
    }
    this.sprite.x = x;
    this.sprite.y = y;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  getBounds(): Rect {
    if (this.hostile) {
      const s = this.size;
      return { x: this.x - s, y: this.y - s, width: s * 2, height: s * 2 };
    }
    return { x: this.x - 3, y: this.y - 1, width: 7, height: 3 };
  }

  destroy() {
    this.sprite.destroy();
  }
}
