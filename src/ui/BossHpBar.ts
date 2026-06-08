import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Boss } from '../entities/Boss';

export class BossHpBar {
  container: Container;
  private bg: Graphics;
  private fill: Graphics;
  private nameText: Text;
  private hpText: Text;
  private barWidth = 600;
  private barHeight = 24;
  private borderGfx: Graphics;

  constructor(screenWidth: number) {
    this.container = new Container();

    const cx = screenWidth / 2;
    const barX = cx - this.barWidth / 2;
    const barY = 60;

    // Outer gold glow
    const glow = new Graphics();
    glow.beginFill(0xc8963e, 0.05);
    glow.drawRoundedRect(barX - 6, barY - 6, this.barWidth + 12, this.barHeight + 12, 6);
    glow.endFill();

    // Background trough
    this.bg = new Graphics();
    this.bg.beginFill(0x0a0805, 0.85);
    this.bg.drawRoundedRect(barX, barY, this.barWidth, this.barHeight, 4);
    this.bg.endFill();
    this.bg.lineStyle(1, 0x6b4c1e, 0.6);
    this.bg.drawRoundedRect(barX, barY, this.barWidth, this.barHeight, 4);
    this.bg.lineStyle(1, 0x000000, 0.3);
    this.bg.drawRoundedRect(barX + 1, barY + 1, this.barWidth - 2, this.barHeight - 2, 3);

    // Decorative border frame
    this.borderGfx = new Graphics();
    this.borderGfx.lineStyle(1, 0xc8963e, 0.2);
    this.borderGfx.moveTo(barX + 8, barY);
    this.borderGfx.lineTo(barX + this.barWidth - 8, barY);
    this.borderGfx.moveTo(barX + 8, barY + this.barHeight);
    this.borderGfx.lineTo(barX + this.barWidth - 8, barY + this.barHeight);

    this.fill = new Graphics();
    this.fill.x = barX + 2;
    this.fill.y = barY + 2;

    this.nameText = new Text('', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 13, fill: '#f0c060',
      stroke: '#000', strokeThickness: 1,
    }));
    this.nameText.x = barX + 10;
    this.nameText.y = barY + 4;

    this.hpText = new Text('', new TextStyle({
      fontFamily: 'Uncial Antiqua, serif', fontSize: 11, fill: '#e8dcc8',
      stroke: '#000', strokeThickness: 1,
    }));
    this.hpText.anchor.set(1, 0);
    this.hpText.x = barX + this.barWidth - 10;
    this.hpText.y = barY + 4;

    this.container.addChild(glow, this.bg, this.borderGfx, this.fill, this.nameText, this.hpText);
  }

  private drawGradientBar(g: Graphics, x: number, y: number, w: number, h: number, stops: { pos: number; color: number }[]) {
    if (w <= 0 || h <= 0) return;
    for (let i = 0; i < stops.length - 1; i++) {
      const segW = Math.round((stops[i + 1].pos - stops[i].pos) * w);
      g.beginFill(stops[i].color);
      g.drawRect(x + Math.round(stops[i].pos * w), y, segW, h);
      g.endFill();
    }
  }

  update(boss: Boss) {
    const pct = boss.health / boss.maxHealth;
    const fillW = Math.max(0, (this.barWidth - 4) * pct);

    this.fill.clear();
    const stops = boss.bossId === 'golem' ? (
      [
        { pos: 0, color: 0x8b6914 },
        { pos: 0.4, color: 0xad8328 },
        { pos: 0.7, color: 0xc8963e },
        { pos: 1, color: 0xd4a030 },
      ]
    ) : boss.bossId === 'cthulhu' ? (
      [
        { pos: 0, color: 0x0a2010 },
        { pos: 0.4, color: 0x14552a },
        { pos: 0.7, color: 0x1a7040 },
        { pos: 1, color: 0x228844 },
      ]
    ) : (
      [
        { pos: 0, color: 0x2a1050 },
        { pos: 0.4, color: 0x4a1a77 },
        { pos: 0.7, color: 0x5522aa },
        { pos: 1, color: 0x6622aa },
      ]
    );
    this.drawGradientBar(this.fill, 0, 0, fillW, this.barHeight - 4, stops);

    this.nameText.text = boss.name;
    this.hpText.text = `${Math.ceil(boss.health)}/${boss.maxHealth}`;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
