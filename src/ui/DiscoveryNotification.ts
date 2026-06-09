import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class DiscoveryNotification {
  container: Container;
  private queue: string[] = [];
  private state: 'idle' | 'sliding_in' | 'visible' | 'sliding_out' | 'gap' = 'idle';
  private timer = 0;
  private gapTimer = 0;
  private currentName = '';
  private shimmerTimer = 0;
  private shimmerG = new Graphics();

  constructor() {
    this.container = new Container();
  }

  show(zoneName: string): void {
    if (this.state === 'idle') {
      this.buildVisual(zoneName);
      this.state = 'sliding_in';
      this.timer = 0;
      this.shimmerTimer = 0;
      this.container.alpha = 0;
      this.container.x = 1648 + 312;
      Logger.log('ui', `Discovery notification shown: ${zoneName}`);
    } else {
      this.queue.push(zoneName);
    }
  }

  private buildVisual(zoneName: string): void {
    this.container.removeChildren();
    this.shimmerG = new Graphics();
    this.currentName = zoneName;

    const bg = new Graphics();
    bg.beginFill(0x0a0810, 0.92);
    bg.drawRoundedRect(0, 0, 260, 80, 6);
    bg.endFill();
    bg.lineStyle(2, 0x8a7a3a, 0.8);
    bg.drawRoundedRect(0, 0, 260, 80, 6);
    this.container.addChild(bg);

    const title = new Text('\u2726 Portal Discovered', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 14, fill: '#f0c060',
      stroke: '#000', strokeThickness: 1,
    }));
    title.x = 16;
    title.y = 10;
    this.container.addChild(title);

    const zoneLabel = new Text(zoneName, new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 18, fill: '#ffffff',
      stroke: '#000', strokeThickness: 1,
    }));
    zoneLabel.x = 16;
    zoneLabel.y = 32;
    this.container.addChild(zoneLabel);

    const hint = new Text('Added to your World Map', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#c8963e',
      stroke: '#000', strokeThickness: 1,
    }));
    hint.x = 16;
    hint.y = 58;
    this.container.addChild(hint);

    this.container.addChild(this.shimmerG);
    this.container.y = 126;
  }

  update(dt: number): void {
    switch (this.state) {
      case 'sliding_in': {
        this.timer += dt;
        const t = Math.min(this.timer / 15, 1);
        const ease = 1 - (1 - t) * (1 - t);
        this.container.x = 1648 + 312 * (1 - ease);
        this.container.alpha = ease;
        if (t >= 1) {
          this.state = 'visible';
          this.timer = 0;
        }
        break;
      }
      case 'visible': {
        this.timer += dt;
        if (this.timer >= 210) {
          this.state = 'sliding_out';
          this.timer = 0;
        }
        break;
      }
      case 'sliding_out': {
        this.timer += dt;
        const t = Math.min(this.timer / 12, 1);
        const ease = t * t;
        this.container.x = 1648 + 312 * ease;
        if (t >= 1) {
          this.state = 'gap';
          this.gapTimer = 0;
        }
        break;
      }
      case 'gap': {
        this.gapTimer += dt;
        if (this.gapTimer >= 30) {
          if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            this.buildVisual(next);
            this.state = 'sliding_in';
            this.timer = 0;
            this.shimmerTimer = 0;
            this.container.alpha = 0;
            this.container.x = 1648 + 312;
          } else {
            this.state = 'idle';
          }
        }
        break;
      }
      case 'idle':
        break;
    }

    if (this.shimmerTimer < 24 && (this.state === 'sliding_in' || this.state === 'visible')) {
      this.shimmerTimer += dt;
      if (this.shimmerTimer < 24) {
        const sy = (this.shimmerTimer / 24) * 80;
        this.shimmerG.clear();
        this.shimmerG.beginFill(0xf0c060, 0.3);
        this.shimmerG.drawRect(0, sy, 260, 4);
        this.shimmerG.endFill();
      } else {
        this.shimmerG.clear();
      }
    }
  }

  isShowing(): boolean {
    return this.state !== 'idle';
  }

  destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
