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

  constructor(screenWidth: number) {
    this.container = new Container();

    const cx = screenWidth / 2;
    const barX = cx - this.barWidth / 2;
    const barY = 60;

    this.bg = new Graphics();
    this.bg.beginFill(0x111111, 0.8);
    this.bg.drawRoundedRect(barX, barY, this.barWidth, this.barHeight, 4);
    this.bg.endFill();
    this.bg.lineStyle(1, 0x444455);
    this.bg.drawRoundedRect(barX, barY, this.barWidth, this.barHeight, 4);

    this.fill = new Graphics();
    this.fill.x = barX + 2;
    this.fill.y = barY + 2;

    this.nameText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 13, fill: '#ffffff',
      stroke: '#000', strokeThickness: 1,
    }));
    this.nameText.x = barX + 8;
    this.nameText.y = barY + 4;

    this.hpText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ccccdd',
      stroke: '#000', strokeThickness: 1,
    }));
    this.hpText.anchor.set(1, 0);
    this.hpText.x = barX + this.barWidth - 8;
    this.hpText.y = barY + 5;

    this.container.addChild(this.bg, this.fill, this.nameText, this.hpText);
  }

  update(boss: Boss) {
    const pct = boss.health / boss.maxHealth;
    const color = boss.bossId === 'golem' ? 0xcc8844 : 0x9933dd;

    this.fill.clear();
    this.fill.beginFill(color);
    this.fill.drawRect(0, 0, (this.barWidth - 4) * pct, this.barHeight - 4);
    this.fill.endFill();

    this.nameText.text = boss.name;
    this.hpText.text = `${Math.ceil(boss.health)}/${boss.maxHealth}`;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
