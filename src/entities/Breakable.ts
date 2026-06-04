import { Container, Sprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Rect } from '../world/Room';

export class Breakable {
  container: Container;
  private sprite: Sprite;
  hp = 1;
  x: number;
  y: number;
  readonly width = 20;
  readonly height = 20;
  alive = true;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container = new Container();
    this.sprite = new Sprite(Math.random() < 0.5 ? Sprites.breakablePot : Sprites.breakableBarrel);
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);
    this.container.x = x;
    this.container.y = y;
  }

  getBounds(): Rect {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
  }

  takeDamage(): boolean {
    if (!this.alive) return false;
    this.hp--;
    if (this.hp <= 0) {
      this.alive = false;
      this.container.visible = false;
      return true;
    }
    return false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
