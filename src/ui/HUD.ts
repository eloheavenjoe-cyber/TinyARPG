import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';

export class HUD {
  container: Container;

  private hpBg: Graphics;
  private hpFill: Graphics;
  private hpLabel: Text;

  private mpBg: Graphics;
  private mpFill: Graphics;

  private goldText: Text;

  constructor() {
    this.container = new Container();

    const barX = 20, barY = 20, barW = 210, barH = 20, barGap = 6;

    this.hpBg = new Graphics();
    this.hpBg.beginFill(0x1a1a1a);
    this.hpBg.drawRect(0, 0, barW, barH);
    this.hpBg.endFill();
    this.hpBg.x = barX;
    this.hpBg.y = barY;

    this.hpFill = new Graphics();
    this.hpFill.x = barX;
    this.hpFill.y = barY;

    this.hpLabel = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffffff',
    }));
    this.hpLabel.x = barX + 4;
    this.hpLabel.y = barY + 4;

    this.mpBg = new Graphics();
    this.mpBg.beginFill(0x1a1a1a);
    this.mpBg.drawRect(0, 0, barW, 16);
    this.mpBg.endFill();
    this.mpBg.x = barX;
    this.mpBg.y = barY + barH + barGap;

    this.mpFill = new Graphics();
    this.mpFill.x = barX;
    this.mpFill.y = barY + barH + barGap;

    this.goldText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#FFD700',
    }));
    this.goldText.anchor.set(1, 0);
    this.goldText.x = 1900;
    this.goldText.y = 20;

    this.container.addChild(this.hpBg, this.hpFill, this.hpLabel, this.mpBg, this.mpFill, this.goldText);
  }

  update(player: Player) {
    const hpPct = player.health / player.maxHealth;
    this.hpFill.clear();
    this.hpFill.beginFill(hpPct > 0.3 ? 0xcc3333 : 0xff6600);
    this.hpFill.drawRect(0, 0, 210 * hpPct, 20);
    this.hpFill.endFill();
    this.hpLabel.text = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    const mpPct = player.mana / player.maxMana;
    this.mpFill.clear();
    this.mpFill.beginFill(0x3355cc);
    this.mpFill.drawRect(0, 0, 210 * mpPct, 16);
    this.mpFill.endFill();

    this.goldText.text = `${player.gold} Gold`;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
