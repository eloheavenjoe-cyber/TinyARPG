import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { Logger } from '../core/Logger';

const SCREEN_W = 1920;
const SCREEN_H = 1080;

export class HUD {
  container: Container;

  private panel: Graphics;
  private hpBg: Graphics;
  private hpFill: Graphics;
  private hpLabel: Text;
  private hpDisplayed = 0;
  private mpBg: Graphics;
  private mpFill: Graphics;
  private mpLabel: Text;
  private mpDisplayed = 0;
  private goldText: Text;
  private levelText: Text;
  private xpBg: Graphics;
  private xpFill: Graphics;
  private zoneText: Text;
  private buffContainer: Container = new Container();
  private pContainer: Container;
  private pBadgeText: Text;
  private kContainer: Container;
  private kBadgeText: Text;
  onPassiveClick?: () => void;
  onSubTreeClick?: () => void;

  private readonly BAR_W = 200;
  private readonly BAR_GAP = 8;
  private readonly PANEL_H = 100;
  private readonly BOTTOM_MARGIN = 0;

  private pulseTimer = 0;

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'HUD constructor called');

    const panelY = SCREEN_H - this.PANEL_H - this.BOTTOM_MARGIN;
    const left = 18;
    const centerX = SCREEN_W / 2;

    this.panel = new Graphics();
    this.panel.beginFill(0x1a1a28, 0.92);
    this.panel.drawRoundedRect(0, panelY, SCREEN_W, this.PANEL_H, 6);
    this.panel.endFill();
    this.panel.lineStyle(1, 0x8a7a3a, 0.6);
    this.panel.moveTo(0, panelY);
    this.panel.lineTo(SCREEN_W, panelY);

    const hpY = panelY + 12;
    const barH = 22;

    this.hpBg = new Graphics();
    this.hpBg.beginFill(0x111111, 0.6);
    this.hpBg.drawRoundedRect(0, 0, this.BAR_W, barH, 3);
    this.hpBg.endFill();
    this.hpBg.lineStyle(1, 0x8a7a3a, 0.4);
    this.hpBg.drawRoundedRect(0, 0, this.BAR_W, barH, 3);
    this.hpBg.x = left;
    this.hpBg.y = hpY;

    this.hpFill = new Graphics();
    this.hpFill.x = left;
    this.hpFill.y = hpY;

    const labelStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    });
    this.hpLabel = new Text('', labelStyle);
    this.hpLabel.anchor.set(0.5, 0.5);
    this.hpLabel.x = left + this.BAR_W / 2;
    this.hpLabel.y = hpY + barH / 2 + 1;

    const mpY = hpY + barH + this.BAR_GAP;
    const mpH = 18;

    this.mpBg = new Graphics();
    this.mpBg.beginFill(0x111111, 0.6);
    this.mpBg.drawRoundedRect(0, 0, this.BAR_W, mpH, 3);
    this.mpBg.endFill();
    this.mpBg.lineStyle(1, 0x8a7a3a, 0.4);
    this.mpBg.drawRoundedRect(0, 0, this.BAR_W, mpH, 3);
    this.mpBg.x = left;
    this.mpBg.y = mpY;

    this.mpFill = new Graphics();
    this.mpFill.x = left;
    this.mpFill.y = mpY;

    this.mpLabel = new Text('', labelStyle);
    this.mpLabel.anchor.set(0.5, 0.5);
    this.mpLabel.x = left + this.BAR_W / 2;
    this.mpLabel.y = mpY + mpH / 2 + 1;

    const rightX = 1500;
    const rightY = panelY + 12;

    this.goldText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 16, fill: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.goldText.x = rightX;
    this.goldText.y = rightY;

    this.levelText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fill: '#ddddee',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.levelText.x = rightX;
    this.levelText.y = rightY + 22;

    const xpY = rightY + 46;
    const xpH = 8;
    this.xpBg = new Graphics();
    this.xpBg.beginFill(0x222222, 0.6);
    this.xpBg.drawRoundedRect(0, 0, 160, xpH, 2);
    this.xpBg.endFill();
    this.xpBg.x = rightX;
    this.xpBg.y = xpY;

    this.xpFill = new Graphics();
    this.xpFill.x = rightX;
    this.xpFill.y = xpY;

    this.buffContainer.x = rightX;
    this.buffContainer.y = xpY + 14;

    const pInd = this.createIndicator('P', 0x8888cc, 0x5a5a7a, 1664, 998);
    this.pContainer = pInd.container;
    this.pBadgeText = pInd.badgeText;
    this.pContainer.on('pointerdown', () => this.onPassiveClick?.());

    const kInd = this.createIndicator('K', 0xcc8844, 0x997744, 1664, 1020);
    this.kContainer = kInd.container;
    this.kBadgeText = kInd.badgeText;
    this.kContainer.on('pointerdown', () => this.onSubTreeClick?.());

    this.zoneText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 22, fill: '#ddaa55',
      stroke: '#000000', strokeThickness: 3,
    }));
    this.zoneText.anchor.set(0.5, 0);
    this.zoneText.x = centerX;
    this.zoneText.y = 6;

    this.container.addChild(
      this.panel,
      this.hpBg, this.hpFill, this.hpLabel,
      this.mpBg, this.mpFill, this.mpLabel,
      this.goldText, this.levelText,
      this.xpBg, this.xpFill,
      this.buffContainer,
      this.zoneText,
      this.pContainer, this.kContainer,
    );
  }

  private createIndicator(letter: string, mainColor: number, borderColor: number, cx: number, cy: number): { container: Container; badgeText: Text } {
    const container = new Container();
    container.x = cx;
    container.y = cy;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.visible = false;

    const mainRadius = 14;
    const badgeRadius = 9;

    const circle = new Graphics();
    circle.beginFill(mainColor);
    circle.drawCircle(0, 0, mainRadius);
    circle.endFill();
    circle.lineStyle(2, borderColor, 0.8);
    circle.drawCircle(0, 0, mainRadius);

    const letterText = new Text(letter, new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ffffff',
      fontWeight: 'bold', stroke: '#000000', strokeThickness: 1,
    }));
    letterText.anchor.set(0.5);

    const badgeOffsetX = mainRadius - 2;
    const badgeOffsetY = -mainRadius + 2;

    const badge = new Graphics();
    badge.beginFill(0xdd3333);
    badge.drawCircle(0, 0, badgeRadius);
    badge.endFill();
    badge.lineStyle(1, 0xaa2222, 1);
    badge.drawCircle(0, 0, badgeRadius);
    badge.x = badgeOffsetX;
    badge.y = badgeOffsetY;

    const badgeText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffffff',
      fontWeight: 'bold', stroke: '#000000', strokeThickness: 1,
    }));
    badgeText.anchor.set(0.5);
    badgeText.x = badgeOffsetX;
    badgeText.y = badgeOffsetY;

    container.addChild(circle, letterText, badge, badgeText);
    return { container, badgeText };
  }

  update(player: Player, dt: number) {
    const barH = 22;
    const mpH = 18;

    const hpTarget = player.maxHealth > 0 ? player.health / player.maxHealth : 1;
    if (hpTarget >= 0) {
      this.hpDisplayed += (hpTarget - this.hpDisplayed) * Math.min(1, 0.15 * dt);
    }
    const hpPct = Math.max(0, Math.min(1, this.hpDisplayed));
    const hpColor = hpPct > 0.6 ? 0xdd3333 : hpPct > 0.3 ? 0xdd8800 : 0xff3333;

    this.hpFill.clear();
    this.hpFill.beginFill(hpColor);

    let pulseAlpha = 1;
    if (hpPct < 0.3) {
      this.pulseTimer += dt * 0.15;
      pulseAlpha = 0.7 + 0.3 * Math.sin(this.pulseTimer);
    } else {
      this.pulseTimer = 0;
    }
    this.hpFill.alpha = pulseAlpha;

    this.hpFill.drawRoundedRect(0, 0, this.BAR_W * hpPct, barH, 3);
    this.hpFill.endFill();
    this.hpLabel.text = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    const mpTarget = player.maxMana > 0 ? player.mana / player.maxMana : 1;
    if (mpTarget >= 0) {
      this.mpDisplayed += (mpTarget - this.mpDisplayed) * Math.min(1, 0.15 * dt);
    }
    const mpPct = Math.max(0, Math.min(1, this.mpDisplayed));

    this.mpFill.clear();
    this.mpFill.beginFill(0x3366dd);
    this.mpFill.drawRoundedRect(0, 0, this.BAR_W * mpPct, mpH, 3);
    this.mpFill.endFill();
    this.mpLabel.text = `${Math.ceil(player.mana)} / ${player.maxMana}`;

    this.goldText.text = `${player.gold} Gold`;
    this.levelText.text = `Lv ${player.level}`;
    this.pContainer.visible = player.passivePoints > 0;
    this.kContainer.visible = player.skillSubPoints > 0;
    this.pBadgeText.text = player.passivePoints > 0 ? `${player.passivePoints}` : '';
    this.kBadgeText.text = player.skillSubPoints > 0 ? `${player.skillSubPoints}` : '';

    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;
    this.xpFill.clear();
    this.xpFill.beginFill(0x44aa88);
    this.xpFill.drawRoundedRect(0, 0, 160 * Math.min(1, xpPct), 8, 2);
    this.xpFill.endFill();

    this.buffContainer.removeChildren();
    let bx = 0;
    const buffList = this.getActiveBuffs(player);
    for (const buff of buffList.slice(0, 4)) {
      const b = new Text(`◆ ${buff.name} ${buff.remaining.toFixed(1)}s`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: buff.color,
        stroke: '#000000', strokeThickness: 2,
      }));
      b.x = bx;
      b.y = 0;
      this.buffContainer.addChild(b);
      bx += b.width + 8;
    }
  }

  private getActiveBuffs(player: Player): { name: string; remaining: number; color: string }[] {
    const buffs: { name: string; remaining: number; color: string }[] = [];
    const sm = player.skills;
    if (sm.hasBuff('fortify')) buffs.push({ name: 'Fortify', remaining: sm.getBuffTimer('fortify') / 60, color: '#4488ff' });
    if (sm.hasBuff('battle_rage')) buffs.push({ name: 'Battle Rage', remaining: sm.getBuffTimer('battle_rage') / 60, color: '#ff4444' });
    if (sm.hasBuff('bloodlust')) buffs.push({ name: 'Bloodlust', remaining: sm.getBuffTimer('bloodlust') / 60, color: '#ff6644' });
    if (sm.hasBuff('eagle_eye')) buffs.push({ name: 'Eagle Eye', remaining: sm.getBuffTimer('eagle_eye') / 60, color: '#44dd88' });
    if (sm.hasBuff('haste')) buffs.push({ name: 'Haste', remaining: sm.getBuffTimer('haste') / 60, color: '#88dd44' });
    if (sm.hasBuff('meditate_damage')) buffs.push({ name: 'Meditate (DMG)', remaining: sm.getBuffTimer('meditate_damage') / 60, color: '#ffaa00' });
    if (player.classType === 'monk' && sm.currentStance) buffs.push({ name: `Stance: ${sm.currentStance}`, remaining: 0, color: '#aa88ff' });
    return buffs;
  }

  setZoneName(name: string) {
    this.zoneText.text = name;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
