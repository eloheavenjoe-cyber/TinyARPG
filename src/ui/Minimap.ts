import { Container, Graphics } from 'pixi.js';
import { ROOM_WIDTH, ROOM_HEIGHT, Rect } from '../world/Room';

const MINIMAP_W = 200;
const MINIMAP_H = 112;
const PAD = 6;
export class Minimap {
  container: Container;
  private gfx: Graphics;
  private staticGfx: Graphics;
  private bgGfx: Graphics;
  private borderGfx: Graphics;
  private vignette: Graphics;
  private targetAlpha = 1;
  private currentAlpha = 1;
  private pulseTimer = 0;
  /* PERF: track wall count to only redraw static layer on room change */
  private lastWallCount = -1;

  constructor() {
    this.container = new Container();
    const screenX = 1920 - MINIMAP_W - PAD;
    const screenY = PAD;
    this.container.x = screenX;
    this.container.y = screenY;

    // Background — warm dark brown, not black
    this.bgGfx = new Graphics();
    this.bgGfx.beginFill(0x14100c, 0.75);
    this.bgGfx.drawRoundedRect(0, 0, MINIMAP_W, MINIMAP_H, 4);
    this.bgGfx.endFill();
    this.container.addChild(this.bgGfx);

    // Static map layer (walls — only redrawn on room change)
    this.staticGfx = new Graphics();
    this.container.addChild(this.staticGfx);

    // Dynamic map layer (player, enemies, chests, breakables)
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);

    // Vignette overlay — subtle edge darkening only
    this.vignette = new Graphics();
    for (let i = 0; i < 4; i++) {
      this.vignette.beginFill(0x000000, 0.02);
      this.vignette.drawRect(0, 0, MINIMAP_W, MINIMAP_H);
      this.vignette.endFill();
    }
    this.container.addChild(this.vignette);

    // Ornate border
    this.borderGfx = new Graphics();
    // Outer thick bronze border
    this.borderGfx.lineStyle(2, 0x6b4c1e, 0.7);
    this.borderGfx.drawRoundedRect(0, 0, MINIMAP_W, MINIMAP_H, 4);
    // Inner gold highlight
    this.borderGfx.lineStyle(1, 0xc8963e, 0.35);
    this.borderGfx.drawRoundedRect(1, 1, MINIMAP_W - 2, MINIMAP_H - 2, 3);

    // Runic tick marks along top border
    this.borderGfx.lineStyle(1, 0xc8963e, 0.4);
    for (let i = 0; i < 12; i++) {
      const tx = 8 + i * (MINIMAP_W - 16) / 11;
      this.borderGfx.moveTo(tx, 0);
      this.borderGfx.lineTo(tx, 4);
    }
    // Bottom ticks
    for (let i = 0; i < 12; i++) {
      const tx = 8 + i * (MINIMAP_W - 16) / 11;
      this.borderGfx.moveTo(tx, MINIMAP_H);
      this.borderGfx.lineTo(tx, MINIMAP_H - 4);
    }
    // Left ticks
    for (let i = 0; i < 6; i++) {
      const ty = 8 + i * (MINIMAP_H - 16) / 5;
      this.borderGfx.moveTo(0, ty);
      this.borderGfx.lineTo(4, ty);
    }
    // Right ticks
    for (let i = 0; i < 6; i++) {
      const ty = 8 + i * (MINIMAP_H - 16) / 5;
      this.borderGfx.moveTo(MINIMAP_W, ty);
      this.borderGfx.lineTo(MINIMAP_W - 4, ty);
    }

    // Corner ornaments
    this.borderGfx.lineStyle(1, 0xc8963e, 0.5);
    // Top-left corner
    this.borderGfx.arc(6, 6, 5, Math.PI, 1.5 * Math.PI);
    // Top-right corner
    this.borderGfx.arc(MINIMAP_W - 6, 6, 5, 1.5 * Math.PI, 2 * Math.PI);
    // Bottom-left corner
    this.borderGfx.arc(6, MINIMAP_H - 6, 5, 0.5 * Math.PI, Math.PI);
    // Bottom-right corner
    this.borderGfx.arc(MINIMAP_W - 6, MINIMAP_H - 6, 5, 0, 0.5 * Math.PI);

    this.container.addChild(this.borderGfx);
  }

  update(playerX: number, playerY: number, walls: Rect[], enemies: { x: number; y: number; alive: boolean }[], chests: { x: number; y: number; isOpen: boolean }[], breakables: { x: number; y: number; alive: boolean }[], urns?: { x: number; y: number; isOpen: boolean }[], doors?: { rect: { x: number; y: number; width: number; height: number } }[]) {
    this.currentAlpha += (this.targetAlpha - this.currentAlpha) * 0.1;
    /* PERF: snap alpha when converged to skip redundant assignment */
    if (Math.abs(this.currentAlpha - this.targetAlpha) < 0.005) {
      this.currentAlpha = this.targetAlpha;
    }
    this.container.alpha = this.currentAlpha;

    this.pulseTimer += 0.05;

    const g = this.gfx;
    g.clear();

    const sx = MINIMAP_W / ROOM_WIDTH;
    const sy = MINIMAP_H / ROOM_HEIGHT;

    /* PERF: only redraw static walls when room changes (wall count changes) */
    if (walls.length !== this.lastWallCount) {
      this.lastWallCount = walls.length;
      const sg = this.staticGfx;
      sg.clear();
      sg.beginFill(0x1a1612, 0.8);
      for (const wall of walls) {
        sg.drawRect(wall.x * sx, wall.y * sy, wall.width * sx, wall.height * sy);
      }
      sg.endFill();
    }

    // Draw breakables
    g.beginFill(0x888888, 0.4);
    for (const b of breakables) {
      if (b.alive) {
        g.drawCircle(b.x * sx, b.y * sy, 1.5);
      }
    }
    g.endFill();

    // Draw chests + urns — pale blue dots
    g.beginFill(0x88ccff, 0.75);
    for (const c of chests) {
      if (!c.isOpen) {
        g.drawCircle(c.x * sx, c.y * sy, 3);
      }
    }
    if (urns) {
      for (const u of urns) {
        if (!u.isOpen) {
          g.drawCircle(u.x * sx, u.y * sy, 3);
        }
      }
    }
    g.endFill();

    // Draw enemies — crimson dots
    g.beginFill(0xcc2200, 0.85);
    for (const e of enemies) {
      if (e.alive) {
        g.drawCircle(e.x * sx, e.y * sy, 3);
      }
    }
    g.endFill();

    // Draw player — bright gold dot with soft white glow
    const playerGlowAlpha = 0.25 + 0.2 * Math.sin(this.pulseTimer);
    g.beginFill(0xffffff, playerGlowAlpha * 0.35);
    g.drawCircle(playerX * sx, playerY * sy, 6);
    g.endFill();
    g.beginFill(0xf0c060);
    g.drawCircle(playerX * sx, playerY * sy, 4);
    g.endFill();

    // Draw doors/exits — bright white pulsing dots
    if (doors) {
      const doorPulse = 0.6 + 0.4 * Math.sin(this.pulseTimer * 2);
      g.beginFill(0xffffff, doorPulse);
      for (const door of doors) {
        const cx = (door.rect.x + door.rect.width / 2) * sx;
        const cy = (door.rect.y + door.rect.height / 2) * sy;
        g.drawCircle(cx, cy, 3);
      }
      g.endFill();
    }
  }

  fadeIn() {
    this.targetAlpha = 1;
  }

  fadeOut() {
    this.targetAlpha = 0;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
