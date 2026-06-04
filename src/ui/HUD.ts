import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { Logger } from '../core/Logger';

export class HUD {
  container: Container;

  private panel: Graphics;
  private hpBg: Graphics;
  private hpFill: Graphics;
  private hpLabel: Text;

  private mpBg: Graphics;
  private mpFill: Graphics;

  private goldText: Text;

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'HUD constructor called');

    const left = 18, top = 1030, barW = 220, barH = 22, gap = 8;

    this.panel = new Graphics();
    this.panel.beginFill(0x000000, 0.55);
    this.panel.drawRoundedRect(left - 8, top - 6, barW + 16, barH * 2 + gap + 20, 6);
    this.panel.endFill();

    this.hpBg = new Graphics();
    this.hpBg.beginFill(0x111111, 0.6);
    this.hpBg.drawRect(0, 0, barW, barH);
    this.hpBg.endFill();
    this.hpBg.x = left;
    this.hpBg.y = top;

    this.hpFill = new Graphics();
    this.hpFill.x = left;
    this.hpFill.y = top;

    const labelStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffffff',
    });
    this.hpLabel = new Text('', labelStyle);
    this.hpLabel.x = left + 4;
    this.hpLabel.y = top + 5;

    this.mpBg = new Graphics();
    this.mpBg.beginFill(0x111111, 0.6);
    this.mpBg.drawRect(0, 0, barW, 18);
    this.mpBg.endFill();
    this.mpBg.x = left;
    this.mpBg.y = top + barH + gap;

    this.mpFill = new Graphics();
    this.mpFill.x = left;
    this.mpFill.y = top + barH + gap;

    this.goldText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }));
    this.goldText.x = left;
    this.goldText.y = top + barH * 2 + gap + 4;

    this.container.addChild(
      this.panel,
      this.hpBg, this.hpFill, this.hpLabel,
      this.mpBg, this.mpFill,
      this.goldText,
    );

    Logger.log('ui', 'HUD created at bottom-left');
  }

  update(player: Player) {
    const hpPct = player.health / player.maxHealth;
    this.hpFill.clear();
    this.hpFill.beginFill(hpPct > 0.5 ? 0xdd3333 : hpPct > 0.25 ? 0xdd8800 : 0xff3333);
    this.hpFill.drawRect(0, 0, 220 * hpPct, 22);
    this.hpFill.endFill();
    this.hpLabel.text = `${Math.ceil(player.health)}/${player.maxHealth}`;

    const mpPct = player.mana / player.maxMana;
    this.mpFill.clear();
    this.mpFill.beginFill(0x3366dd);
    this.mpFill.drawRect(0, 0, 220 * mpPct, 18);
    this.mpFill.endFill();

    this.goldText.text = `${player.gold} Gold`;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
