import { Container, Text, TextStyle } from 'pixi.js';

interface FloatingText {
  text: Text;
  vy: number;
  life: number;
  maxLife: number;
}

export class CombatTextManager {
  container: Container;
  private items: FloatingText[] = [];

  constructor() {
    this.container = new Container();
  }

  showDamage(x: number, y: number, amount: number | string, color: number = 0xffffff, rarityColor?: number, damageType?: 'cold' | 'lightning') {
    let finalColor = rarityColor ?? color;

    if (damageType === 'cold') {
      finalColor = this.blendColors(finalColor, 0x4488ff, 0.4);
    } else if (damageType === 'lightning') {
      finalColor = this.blendColors(finalColor, 0xffdd44, 0.4);
    }

    const num = typeof amount === 'number' ? amount : 0;
    const size = Math.min(22, Math.max(14, 12 + Math.floor(num / 10)));

    const t = new Text(`${amount}`, new TextStyle({
      fontFamily: 'monospace',
      fontSize: size,
      fill: finalColor,
      stroke: 0x000000,
      strokeThickness: 3,
      fontWeight: 'bold',
    }));
    t.anchor.set(0.5);
    t.x = x + (Math.random() - 0.5) * 16;
    t.y = y;

    this.container.addChild(t);
    this.items.push({ text: t, vy: -1.8, life: 55, maxLife: 55 });
  }

  private blendColors(a: number, b: number, ratio: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * ratio);
    const g = Math.round(ag + (bg - ag) * ratio);
    const bl = Math.round(ab + (bb - ab) * ratio);
    return (r << 16) | (g << 8) | bl;
  }

  update(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const f = this.items[i];
      f.life -= dt;
      f.text.y += f.vy * dt;
      f.text.alpha = Math.max(0, f.life / f.maxLife);

      if (f.life <= 0) {
        this.container.removeChild(f.text);
        f.text.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
    this.items = [];
  }
}
