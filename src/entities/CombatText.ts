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

  showDamage(x: number, y: number, amount: number, color: number = 0xffffff) {
    const t = new Text(`${amount}`, new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fill: color,
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
