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
  /* PERF: pre-computed gradient stops per boss type */
  private bossStops: { pos: number; color: number }[] = [];
  /* PERF: dirty flags to skip redundant redraws */
  private lastFillW = -1;
  private lastHpText = '';
  private nameSet = false;

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

    /* PERF: pre-compute gradient stops and set name once per boss */
    if (!this.nameSet) {
      const stopsKey = boss.bossId;
      if (stopsKey === 'golem') {
        this.bossStops = [
          { pos: 0, color: 0x8b6914 },
          { pos: 0.4, color: 0xad8328 },
          { pos: 0.7, color: 0xc8963e },
          { pos: 1, color: 0xd4a030 },
        ];
      } else if (stopsKey === 'cthulhu') {
        this.bossStops = [
          { pos: 0, color: 0x0a2010 },
          { pos: 0.4, color: 0x14552a },
          { pos: 0.7, color: 0x1a7040 },
          { pos: 1, color: 0x228844 },
        ];
      } else {
        this.bossStops = [
          { pos: 0, color: 0x2a1050 },
          { pos: 0.4, color: 0x4a1a77 },
          { pos: 0.7, color: 0x5522aa },
          { pos: 1, color: 0x6622aa },
        ];
      }
      this.nameText.text = boss.name;
      this.nameSet = true;
    }

    /* PERF: only redraw fill when width changes perceptibly */
    const quantized = Math.round(fillW);
    if (quantized !== this.lastFillW) {
      this.lastFillW = quantized;
      this.fill.clear();
      this.drawGradientBar(this.fill, 0, 0, fillW, this.barHeight - 4, this.bossStops);
    }

    /* PERF: only set HP text when value changes */
    const hpStr = `${Math.ceil(boss.health)}/${boss.maxHealth}`;
    if (hpStr !== this.lastHpText) {
      this.lastHpText = hpStr;
      this.hpText.text = hpStr;
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
