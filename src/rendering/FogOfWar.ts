import { Container, Graphics } from 'pixi.js';

const SCREEN_W = 1920;
const SCREEN_H = 1080;
const RING_COUNT = 8;

export class FogOfWar {
  container: Container;
  private gfx: Graphics;
  private cutoutX = 0;
  private cutoutY = 0;
  readonly radius: number;
  readonly innerRadius: number;
  readonly fogAlpha: number;
  readonly fogColor: number;
  readonly lerpSpeed: number;

  constructor(radius = 350, fogAlpha = 0.88, fogColor = 0x000000) {
    this.radius = radius;
    this.innerRadius = Math.round(radius * 0.7);
    this.fogAlpha = fogAlpha;
    this.fogColor = fogColor;
    this.lerpSpeed = 0.08;

    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);

    this.draw();
  }

  update(playerScreenX: number, playerScreenY: number, dt: number): void {
    // Lerp cutout toward the player screen position
    const t = 1 - Math.pow(1 - this.lerpSpeed, dt);
    this.cutoutX += (playerScreenX - this.cutoutX) * t;
    this.cutoutY += (playerScreenY - this.cutoutY) * t;

    this.draw();
  }

  private draw(): void {
    const g = this.gfx;
    g.clear();

    // 1. Full-screen dark overlay with clear hole at cutout
    g.beginFill(this.fogColor, this.fogAlpha);
    g.drawRect(0, 0, SCREEN_W, SCREEN_H);
    // beginHole must be called BEFORE endFill — it punches through the active fill
    g.beginHole();
    g.drawCircle(this.cutoutX, this.cutoutY, this.innerRadius);
    g.endHole();
    g.endFill();

    // 2. Soft edge: concentric ring outlines from innerRadius to radius
    const ringCount = RING_COUNT;
    const ringStep = (this.radius - this.innerRadius) / ringCount;
    for (let i = 0; i <= ringCount; i++) {
      const r = this.innerRadius + i * ringStep;
      const ringAlpha = this.fogAlpha * (i / ringCount);
      g.lineStyle(ringStep, this.fogColor, ringAlpha);
      g.drawCircle(this.cutoutX, this.cutoutY, r);
    }
  }

  resize(w: number, h: number): void {
    // Screen size is fixed at 1920x1080, but could be updated here if needed
    this.draw();
  }

  destroy(): void {
    this.gfx.destroy();
    this.container.destroy({ children: true });
  }
}
