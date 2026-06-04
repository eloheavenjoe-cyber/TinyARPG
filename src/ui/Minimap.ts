import { Container, Graphics } from 'pixi.js';
import { ROOM_WIDTH, ROOM_HEIGHT, Rect } from '../world/Room';

const MINIMAP_W = 200;
const MINIMAP_H = 112;
const PAD = 6;
const BG_COLOR = 0x000000;
const BG_ALPHA = 0.5;
const WALL_COLOR = 0x444466;
const PLAYER_COLOR = 0xffffff;
const ENEMY_COLOR = 0xff4444;
const CHEST_COLOR = 0xffdd44;
const BREAKABLE_COLOR = 0x888888;
const BORDER_COLOR = 0x666688;

export class Minimap {
  container: Container;
  private gfx: Graphics;
  private bgGfx: Graphics;

  constructor() {
    this.container = new Container();
    const screenX = 1920 - MINIMAP_W - PAD;
    const screenY = 1080 - MINIMAP_H - PAD;
    this.container.x = screenX;
    this.container.y = screenY;

    this.bgGfx = new Graphics();
    this.bgGfx.beginFill(BG_COLOR, BG_ALPHA);
    this.bgGfx.drawRoundedRect(0, 0, MINIMAP_W, MINIMAP_H, 4);
    this.bgGfx.endFill();
    this.bgGfx.lineStyle(1, BORDER_COLOR, 0.6);
    this.bgGfx.drawRoundedRect(0, 0, MINIMAP_W, MINIMAP_H, 4);
    this.container.addChild(this.bgGfx);

    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  update(playerX: number, playerY: number, walls: Rect[], enemies: { x: number; y: number; alive: boolean }[], chests: { x: number; y: number; isOpen: boolean }[], breakables: { x: number; y: number; alive: boolean }[]) {
    const g = this.gfx;
    g.clear();

    const sx = MINIMAP_W / ROOM_WIDTH;
    const sy = MINIMAP_H / ROOM_HEIGHT;

    // Draw walls
    g.beginFill(WALL_COLOR, 0.7);
    for (const wall of walls) {
      g.drawRect(wall.x * sx, wall.y * sy, wall.width * sx, wall.height * sy);
    }
    g.endFill();

    // Draw chests
    g.beginFill(CHEST_COLOR, 0.8);
    for (const c of chests) {
      if (!c.isOpen) {
        g.drawCircle(c.x * sx, c.y * sy, 2);
      }
    }
    g.endFill();

    // Draw breakables
    g.beginFill(BREAKABLE_COLOR, 0.5);
    for (const b of breakables) {
      if (b.alive) {
        g.drawCircle(b.x * sx, b.y * sy, 1.5);
      }
    }
    g.endFill();

    // Draw enemies
    g.beginFill(ENEMY_COLOR, 0.8);
    for (const e of enemies) {
      if (e.alive) {
        g.drawCircle(e.x * sx, e.y * sy, 2);
      }
    }
    g.endFill();

    // Draw player
    g.beginFill(PLAYER_COLOR);
    g.drawCircle(playerX * sx, playerY * sy, 3);
    g.endFill();
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
