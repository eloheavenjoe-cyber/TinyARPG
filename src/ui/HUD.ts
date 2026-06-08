import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { CurseInstance } from '../core/CurseMods';
import { Logger } from '../core/Logger';

const SCREEN_W = 1920;
const SCREEN_H = 1080;

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}

export class HUD {
  container: Container;

  private panel: Graphics;
  private hpBg: Graphics;
  private hpFill: Graphics;
  private hpShimmer: Graphics;
  private hpLabel: Text;
  private hpDisplayed = 0;
  private lastHpPct = 1;
  private hpShimmerTimer = 0;
  private mpBg: Graphics;
  private mpFill: Graphics;
  private mpShimmer: Graphics;
  private mpLabel: Text;
  private mpDisplayed = 0;
  private lastMpPct = 1;
  private mpShimmerTimer = 0;
  private goldText: Text;
  private levelText: Text;
  private xpBg: Graphics;
  private xpFill: Graphics;
  private xpLabel: Text;
  private zoneText: Text;
  private buffContainer: Container = new Container();
  private curseContainer: Container = new Container();
  private curseTexts: Text[] = [];
  private readonly MAX_CURSES = 6;
  private pContainer: Container;
  private pBadgeText: Text;
  private kContainer: Container;
  private kBadgeText: Text;
  private lineDecor: Graphics;

  private readonly BAR_W = 200;
  private readonly BAR_GAP = 8;
  private readonly PANEL_H = 100;
  private readonly BOTTOM_MARGIN = 0;
  private readonly CHAMFER = 8;

  private pulseTimer = 0;

  /* PERF: cached DOM reference — never query inside game loop */
  private vignetteEl: HTMLElement | null = null;
  /* PERF: dirty flags prevent redundant gradient redraws */
  private lastDrawnHpPct = -1;
  private lastDrawnMpPct = -1;
  /* PERF: dirty flags prevent redundant text assignments */
  private lastHpText = '';
  private lastMpText = '';
  private lastGoldText = '';
  private lastLevelText = '';
  private lastPassiveVis = false;
  private lastSubVis = false;
  private lastPassiveText = '';
  private lastSubText = '';
  private lastXpPct = -1;
  private lastXpLabel = '';
  private lastVignetteOpacity = -1;
  /* PERF: pre-allocated buff text objects to avoid destroy/create per frame */
  private buffTexts: Text[] = [];
  private readonly MAX_BUFFS = 4;

  onPassiveClick?: () => void;
  onSubTreeClick?: () => void;

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'HUD constructor called');

    const panelY = SCREEN_H - this.PANEL_H - this.BOTTOM_MARGIN;
    const left = 18;
    const centerX = SCREEN_W / 2;

    // Outer gold glow
    const glow = new Graphics();
    glow.beginFill(0xc8963e, 0.05);
    this.drawChamferedRect(glow, -4, panelY - 4, SCREEN_W + 8, this.PANEL_H + 12, this.CHAMFER + 4);
    glow.endFill();
    glow.beginFill(0xc8963e, 0.08);
    this.drawChamferedRect(glow, -2, panelY - 2, SCREEN_W + 4, this.PANEL_H + 6, this.CHAMFER + 2);
    glow.endFill();

    this.panel = new Graphics();
    this.panel.beginFill(0x0d0b08, 0.94);
    this.drawChamferedRect(this.panel, 0, panelY, SCREEN_W, this.PANEL_H, this.CHAMFER);
    this.panel.endFill();
    // Bronze top border highlight
    this.panel.lineStyle(1, 0xc8963e, 0.35);
    this.panel.moveTo(this.CHAMFER, panelY);
    this.panel.lineTo(SCREEN_W - this.CHAMFER, panelY);
    this.panel.lineStyle(1, 0x6b4c1e, 0.4);
    this.panel.moveTo(this.CHAMFER, panelY + 2);
    this.panel.lineTo(SCREEN_W - this.CHAMFER, panelY + 2);

    const hpY = panelY + 12;
    const barH = 22;

    // HP bar background (trough)
    this.hpBg = new Graphics();
    this.hpBg.beginFill(0x0a0805, 0.8);
    this.hpBg.drawRoundedRect(0, 0, this.BAR_W, barH, 3);
    this.hpBg.endFill();
    this.hpBg.lineStyle(1, 0x6b4c1e, 0.6);
    this.hpBg.drawRoundedRect(0, 0, this.BAR_W, barH, 3);
    // Inset shadow
    this.hpBg.lineStyle(1, 0x000000, 0.3);
    this.hpBg.drawRoundedRect(1, 1, this.BAR_W - 2, barH - 2, 2);
    this.hpBg.x = left;
    this.hpBg.y = hpY;

    // HP bar fill
    this.hpFill = new Graphics();
    this.hpFill.x = left + 2;
    this.hpFill.y = hpY + 2;

    // HP shimmer overlay
    this.hpShimmer = new Graphics();
    this.hpShimmer.x = left + 2;
    this.hpShimmer.y = hpY + 2;
    this.hpShimmer.alpha = 0;

    const labelStyle = new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 11, fill: '#e8dcc8',
      stroke: '#000000', strokeThickness: 2,
    });
    this.hpLabel = new Text('', labelStyle);
    this.hpLabel.anchor.set(0.5, 0.5);
    this.hpLabel.x = left + this.BAR_W / 2;
    this.hpLabel.y = hpY + barH / 2 + 1;

    // --- MP bar ---
    const mpY = hpY + barH + this.BAR_GAP;
    const mpH = 18;

    this.mpBg = new Graphics();
    this.mpBg.beginFill(0x0a0805, 0.8);
    this.mpBg.drawRoundedRect(0, 0, this.BAR_W, mpH, 3);
    this.mpBg.endFill();
    this.mpBg.lineStyle(1, 0x6b4c1e, 0.6);
    this.mpBg.drawRoundedRect(0, 0, this.BAR_W, mpH, 3);
    this.mpBg.lineStyle(1, 0x000000, 0.3);
    this.mpBg.drawRoundedRect(1, 1, this.BAR_W - 2, mpH - 2, 2);
    this.mpBg.x = left;
    this.mpBg.y = mpY;

    this.mpFill = new Graphics();
    this.mpFill.x = left + 2;
    this.mpFill.y = mpY + 2;

    this.mpShimmer = new Graphics();
    this.mpShimmer.x = left + 2;
    this.mpShimmer.y = mpY + 2;
    this.mpShimmer.alpha = 0;

    this.mpLabel = new Text('', labelStyle);
    this.mpLabel.anchor.set(0.5, 0.5);
    this.mpLabel.x = left + this.BAR_W / 2;
    this.mpLabel.y = mpY + mpH / 2 + 1;

    // --- Right section ---
    const rightX = 1500;
    const rightY = panelY + 12;

    this.goldText = new Text('', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 16, fill: '#f0c060',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.goldText.x = rightX;
    this.goldText.y = rightY;

    this.levelText = new Text('', new TextStyle({
      fontFamily: 'Uncial Antiqua, serif', fontSize: 13, fill: '#e8dcc8',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.levelText.x = rightX;
    this.levelText.y = rightY + 22;

    const xpY = rightY + 46;
    const xpH = 8;

    // XP bar background
    this.xpBg = new Graphics();
    this.xpBg.beginFill(0x0a0805, 0.7);
    this.xpBg.drawRoundedRect(0, 0, 160, xpH, 2);
    this.xpBg.endFill();
    this.xpBg.lineStyle(1, 0x6b4c1e, 0.5);
    this.xpBg.drawRoundedRect(0, 0, 160, xpH, 2);
    this.xpBg.x = rightX;
    this.xpBg.y = xpY;

    this.xpFill = new Graphics();
    this.xpFill.x = rightX + 1;
    this.xpFill.y = xpY + 1;

    this.xpLabel = new Text('', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 7, fill: '#7bb8d4',
      stroke: '#000000', strokeThickness: 1,
    }));
    this.xpLabel.anchor.set(0.5, 0.5);
    this.xpLabel.x = rightX + 80;
    this.xpLabel.y = xpY + xpH / 2;

    this.buffContainer.x = rightX;
    this.buffContainer.y = xpY + 14;

    this.curseContainer.x = 18;
    this.curseContainer.y = panelY + 8;

    // Gold ruled line between left and right sections
    this.lineDecor = new Graphics();
    this.lineDecor.lineStyle(1, 0xc8963e, 0.15);
    this.lineDecor.moveTo(600, panelY + 10);
    this.lineDecor.lineTo(600, panelY + this.PANEL_H - 10);

    // Corner ornaments
    const cornerL = new Graphics();
    cornerL.lineStyle(1, 0xc8963e, 0.2);
    cornerL.arc(18, panelY + 10, 6, Math.PI, 1.5 * Math.PI);
    const cornerR = new Graphics();
    cornerR.lineStyle(1, 0xc8963e, 0.2);
    cornerR.arc(SCREEN_W - 18, panelY + 10, 6, 1.5 * Math.PI, 2 * Math.PI);

    // P/K indicator — gemstone style
    const pInd = this.createGemIndicator('P', 0x8888cc, 0x6666aa, 1664, 998);
    this.pContainer = pInd.container;
    this.pBadgeText = pInd.badgeText;
    this.pContainer.on('pointerdown', () => this.onPassiveClick?.());

    const kInd = this.createGemIndicator('K', 0xcc8844, 0xaa6633, 1664, 1020);
    this.kContainer = kInd.container;
    this.kBadgeText = kInd.badgeText;
    this.kContainer.on('pointerdown', () => this.onSubTreeClick?.());

    this.zoneText = new Text('', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 22, fill: '#f0c060',
      stroke: '#000000', strokeThickness: 3,
    }));
    this.zoneText.anchor.set(0.5, 0);
    this.zoneText.x = centerX;
    this.zoneText.y = 6;

    this.container.addChild(
      glow,
      this.panel, cornerL, cornerR,
      this.lineDecor,
      this.hpBg, this.hpFill, this.hpShimmer, this.hpLabel,
      this.mpBg, this.mpFill, this.mpShimmer, this.mpLabel,
      this.goldText, this.levelText,
      this.xpBg, this.xpFill, this.xpLabel,
      this.buffContainer,
      this.curseContainer,
      this.zoneText,
      this.pContainer, this.kContainer,
    );

    /* PERF: cache DOM reference once instead of getElementById every frame */
    this.vignetteEl = document.getElementById('low-hp-vignette');
  }

  private drawChamferedRect(g: Graphics, x: number, y: number, w: number, h: number, c: number) {
    if (c <= 0) { g.drawRect(x, y, w, h); return; }
    g.moveTo(x + c, y);
    g.lineTo(x + w - c, y);
    g.lineTo(x + w, y + c);
    g.lineTo(x + w, y + h - c);
    g.lineTo(x + w - c, y + h);
    g.lineTo(x + c, y + h);
    g.lineTo(x, y + h - c);
    g.lineTo(x, y + c);
    g.closePath();
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

  private createGemIndicator(letter: string, mainColor: number, borderColor: number, cx: number, cy: number): { container: Container; badgeText: Text } {
    const container = new Container();
    container.x = cx;
    container.y = cy;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.visible = false;

    const r = 14;

    // Gem body — hexagon
    const gem = new Graphics();
    gem.beginFill(mainColor, 0.9);
    gem.moveTo(r, 0);
    for (let i = 1; i <= 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      gem.lineTo(r * Math.cos(angle), r * Math.sin(angle));
    }
    gem.endFill();
    gem.lineStyle(2, borderColor, 0.8);
    gem.moveTo(r, 0);
    for (let i = 1; i <= 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      gem.lineTo(r * Math.cos(angle), r * Math.sin(angle));
    }
    // Facet highlight
    gem.lineStyle(1, 0xffffff, 0.15);
    gem.moveTo(0, -r * 0.6);
    gem.lineTo(r * 0.7, -r * 0.3);

    const letterText = new Text(letter, new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 14, fill: '#ffffff',
      fontWeight: 'bold', stroke: '#000000', strokeThickness: 1,
    }));
    letterText.anchor.set(0.5);

    const badgeOffsetX = r - 2;
    const badgeOffsetY = -r + 2;

    // Badge — small hexagon
    const badgeR = 9;
    const badge = new Graphics();
    badge.beginFill(0x8b1a1a);
    badge.moveTo(badgeR, 0);
    for (let i = 1; i <= 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      badge.lineTo(badgeR * Math.cos(angle), badgeR * Math.sin(angle));
    }
    badge.endFill();
    badge.lineStyle(1, 0xcc2200, 1);
    badge.moveTo(badgeR, 0);
    for (let i = 1; i <= 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      badge.lineTo(badgeR * Math.cos(angle), badgeR * Math.sin(angle));
    }
    badge.x = badgeOffsetX;
    badge.y = badgeOffsetY;

    const badgeText = new Text('', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 11, fill: '#ffffff',
      fontWeight: 'bold', stroke: '#000000', strokeThickness: 1,
    }));
    badgeText.anchor.set(0.5);
    badgeText.x = badgeOffsetX;
    badgeText.y = badgeOffsetY;

    container.addChild(gem, letterText, badge, badgeText);
    return { container, badgeText };
  }

  update(player: Player, dt: number) {
    const barH = 22;
    const mpH = 18;

    // --- HP bar ---
    const hpTarget = player.maxHealth > 0 ? player.health / player.maxHealth : 1;
    if (hpTarget >= 0) {
      this.hpDisplayed += (hpTarget - this.hpDisplayed) * Math.min(1, 0.15 * dt);
      /* PERF: snap to target when lerp converges to prevent perpetual micro-delta */
      if (Math.abs(this.hpDisplayed - hpTarget) < 0.001) this.hpDisplayed = hpTarget;
    }
    const hpPct = Math.max(0, Math.min(1, this.hpDisplayed));

    /* PERF: only redraw HP gradient when visible pct changes by >0.5% */
    const hpDrawPct = Math.round(hpPct * 200) / 200;
    if (Math.abs(hpDrawPct - this.lastDrawnHpPct) > 0.005 || this.lastDrawnHpPct < 0) {
      this.lastDrawnHpPct = hpDrawPct;
      this.hpFill.clear();
      this.drawGradientBar(this.hpFill, 0, 0, (this.BAR_W - 4) * hpPct, barH - 4, [
        { pos: 0, color: 0x6b0000 },
        { pos: 0.4, color: 0x992200 },
        { pos: 0.7, color: 0xbb3300 },
        { pos: 1, color: 0xcc2200 },
      ]);
    }

    // Low-health pulse on fill
    let pulseAlpha = 1;
    if (hpPct < 0.3) {
      this.pulseTimer += dt * 0.15;
      pulseAlpha = 0.7 + 0.3 * Math.sin(this.pulseTimer);
    } else {
      this.pulseTimer = 0;
    }
    this.hpFill.alpha = pulseAlpha;

    // HP shimmer on change
    if (Math.abs(hpPct - this.lastHpPct) > 0.01) {
      this.hpShimmerTimer = 12;
      this.lastHpPct = hpPct;
    }
    if (this.hpShimmerTimer > 0) {
      this.hpShimmerTimer -= 1 * dt;
      this.hpShimmer.clear();
      const shimmerAlpha = Math.max(0, this.hpShimmerTimer / 12) * 0.25;
      this.hpShimmer.beginFill(0xffddbb, shimmerAlpha);
      this.hpShimmer.drawRect(0, 0, (this.BAR_W - 4) * hpPct, barH - 4);
      this.hpShimmer.endFill();
    }
    /* PERF: skip shimmer clear when already empty */
    else if (this.hpShimmer.alpha > 0) {
      this.hpShimmer.clear();
    }

    /* PERF: only set HP text when value changes */
    const hpStr = `${Math.ceil(player.health)} / ${player.maxHealth}`;
    if (hpStr !== this.lastHpText) {
      this.lastHpText = hpStr;
      this.hpLabel.text = hpStr;
    }

    // --- MP bar ---
    const mpTarget = player.maxMana > 0 ? player.mana / player.maxMana : 1;
    if (mpTarget >= 0) {
      this.mpDisplayed += (mpTarget - this.mpDisplayed) * Math.min(1, 0.15 * dt);
      if (Math.abs(this.mpDisplayed - mpTarget) < 0.001) this.mpDisplayed = mpTarget;
    }
    const mpPct = Math.max(0, Math.min(1, this.mpDisplayed));

    /* PERF: only redraw MP gradient when visible pct changes by >0.5% */
    const mpDrawPct = Math.round(mpPct * 200) / 200;
    if (Math.abs(mpDrawPct - this.lastDrawnMpPct) > 0.005 || this.lastDrawnMpPct < 0) {
      this.lastDrawnMpPct = mpDrawPct;
      this.mpFill.clear();
      this.drawGradientBar(this.mpFill, 0, 0, (this.BAR_W - 4) * mpPct, mpH - 4, [
        { pos: 0, color: 0x1a0a4e },
        { pos: 0.3, color: 0x2a1577 },
        { pos: 0.6, color: 0x4422aa },
        { pos: 1, color: 0x5555bb },
      ]);
    }
    this.mpFill.alpha = this.mpDisplayed > 0 ? 1 : 0;

    // MP shimmer on change
    if (Math.abs(mpPct - this.lastMpPct) > 0.01) {
      this.mpShimmerTimer = 12;
      this.lastMpPct = mpPct;
    }
    if (this.mpShimmerTimer > 0) {
      this.mpShimmerTimer -= 1 * dt;
      this.mpShimmer.clear();
      const shimmerAlpha = Math.max(0, this.mpShimmerTimer / 12) * 0.2;
      this.mpShimmer.beginFill(0xbbddff, shimmerAlpha);
      this.mpShimmer.drawRect(0, 0, (this.BAR_W - 4) * mpPct, mpH - 4);
      this.mpShimmer.endFill();
    }
    /* PERF: skip shimmer clear when already empty */
    else if (this.mpShimmer.alpha > 0) {
      this.mpShimmer.clear();
    }

    /* PERF: only set MP text when value changes */
    const mpStr = `${Math.ceil(player.mana)} / ${player.maxMana}`;
    if (mpStr !== this.lastMpText) {
      this.lastMpText = mpStr;
      this.mpLabel.text = mpStr;
    }

    // --- Right side ---
    const goldStr = `${player.gold} Gold`;
    if (goldStr !== this.lastGoldText) {
      this.lastGoldText = goldStr;
      this.goldText.text = goldStr;
    }
    const lvlStr = `Lv ${player.level}`;
    if (lvlStr !== this.lastLevelText) {
      this.lastLevelText = lvlStr;
      this.levelText.text = lvlStr;
    }

    const pVis = player.passivePoints > 0;
    if (pVis !== this.lastPassiveVis) {
      this.lastPassiveVis = pVis;
      this.pContainer.visible = pVis;
    }
    const kVis = player.skillSubPoints > 0;
    if (kVis !== this.lastSubVis) {
      this.lastSubVis = kVis;
      this.kContainer.visible = kVis;
    }

    const pTxt = player.passivePoints > 0 ? `${player.passivePoints}` : '';
    if (pTxt !== this.lastPassiveText) {
      this.lastPassiveText = pTxt;
      this.pBadgeText.text = pTxt;
    }
    const kTxt = player.skillSubPoints > 0 ? `${player.skillSubPoints}` : '';
    if (kTxt !== this.lastSubText) {
      this.lastSubText = kTxt;
      this.kBadgeText.text = kTxt;
    }

    // XP bar
    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;
    /* PERF: only redraw XP fill when percentage changes */
    const xpRounded = Math.round(xpPct * 100);
    if (xpRounded !== this.lastXpPct) {
      this.lastXpPct = xpRounded;
      this.xpFill.clear();
      if (xpPct > 0) {
        this.xpFill.beginFill(0x7bb8d4, 0.8);
        this.xpFill.drawRoundedRect(0, 0, 158 * Math.min(1, xpPct), 6, 1);
        this.xpFill.endFill();
      }
    }
    const xpLbl = xpPct > 0 ? `${Math.floor(xpPct * 100)}%` : '';
    if (xpLbl !== this.lastXpLabel) {
      this.lastXpLabel = xpLbl;
      this.xpLabel.text = xpLbl;
    }

    // Buff display
    /* PERF: update buff text in-place instead of destroy/create per frame */
    const buffList = this.getActiveBuffs(player).slice(0, this.MAX_BUFFS);
    for (let i = 0; i < this.MAX_BUFFS; i++) {
      if (i < buffList.length) {
        const buff = buffList[i];
        const txt = `◈ ${buff.name} ${buff.remaining.toFixed(1)}s`;
        if (!this.buffTexts[i]) {
          this.buffTexts[i] = new Text('', new TextStyle({
            fontFamily: 'MedievalSharp, serif', fontSize: 11,
            fill: buff.color, stroke: '#000000', strokeThickness: 2,
          }));
          this.buffContainer.addChild(this.buffTexts[i]);
        }
        if (this.buffTexts[i].text !== txt || this.buffTexts[i].style.fill !== buff.color) {
          this.buffTexts[i].text = txt;
          (this.buffTexts[i].style as TextStyle).fill = buff.color;
        }
        let bx = 0;
        for (let j = 0; j < i; j++) {
          bx += this.buffTexts[j].width + 10;
        }
        this.buffTexts[i].x = bx;
        this.buffTexts[i].y = 0;
        this.buffTexts[i].visible = true;
      } else if (this.buffTexts[i]) {
        this.buffTexts[i].visible = false;
      }
    }

    // Curse display
    const curses = player.getActiveCurses();
    const curseCount = Math.min(curses.length, this.MAX_CURSES);
    for (let i = 0; i < this.MAX_CURSES; i++) {
      if (i < curseCount) {
        const curse = curses[i];
        const remaining = Math.ceil(curse.remaining);
        const txt = `◈ ${curse.def.name} ${remaining}s`;
        if (!this.curseTexts[i]) {
          this.curseTexts[i] = new Text('', new TextStyle({
            fontFamily: 'MedievalSharp, serif', fontSize: 9,
            fill: curse.def.tier === 3 ? '#cc2200' : '#8b1a1a',
            stroke: '#000000', strokeThickness: 1,
          }));
          this.curseContainer.addChild(this.curseTexts[i]);
        }
        if (this.curseTexts[i].text !== txt) {
          this.curseTexts[i].text = txt;
        }
        const curseColor = curse.def.tier === 3 ? '#cc2200' : '#8b1a1a';
        if (this.curseTexts[i].style.fill !== curseColor) {
          (this.curseTexts[i].style as TextStyle).fill = curseColor;
        }
        // Tier 3 pulse
        if (curse.def.tier === 3) {
          const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
          this.curseTexts[i].alpha = pulse;
        } else {
          this.curseTexts[i].alpha = 1;
        }
        let cx = 0;
        for (let j = 0; j < i; j++) {
          cx += this.curseTexts[j].width + 8;
        }
        this.curseTexts[i].x = cx;
        this.curseTexts[i].y = 0;
        this.curseTexts[i].visible = true;
      } else if (this.curseTexts[i]) {
        this.curseTexts[i].visible = false;
      }
    }

    // Low-HP screen vignette
    /* PERF: use cached DOM ref, only write opacity when value changes */
    if (this.vignetteEl) {
      const targetOpacity = hpPct < 0.3 ? (0.3 + 0.4 * Math.sin(this.pulseTimer * 2)) : 0;
      const rounded = Math.round(targetOpacity * 100);
      if (rounded !== this.lastVignetteOpacity) {
        this.lastVignetteOpacity = rounded;
        this.vignetteEl.style.opacity = `${targetOpacity}`;
      }
    }
  }

  private getActiveBuffs(player: Player): { name: string; remaining: number; color: string }[] {
    const buffs: { name: string; remaining: number; color: string }[] = [];
    const sm = player.skills;
    if (sm.hasBuff('fortify')) buffs.push({ name: 'Fortify', remaining: sm.getBuffTimer('fortify') / 60, color: '#c8963e' });
    if (sm.hasBuff('battle_rage')) buffs.push({ name: 'Battle Rage', remaining: sm.getBuffTimer('battle_rage') / 60, color: '#cc2200' });
    if (sm.hasBuff('bloodlust')) buffs.push({ name: 'Bloodlust', remaining: sm.getBuffTimer('bloodlust') / 60, color: '#cc4444' });
    if (sm.hasBuff('eagle_eye')) buffs.push({ name: 'Eagle Eye', remaining: sm.getBuffTimer('eagle_eye') / 60, color: '#44dd88' });
    if (sm.hasBuff('haste')) buffs.push({ name: 'Haste', remaining: sm.getBuffTimer('haste') / 60, color: '#88dd44' });
    if (sm.hasBuff('meditate_damage')) buffs.push({ name: 'Meditate (DMG)', remaining: sm.getBuffTimer('meditate_damage') / 60, color: '#f0c060' });
    if (player.classType === 'monk' && sm.currentStance) buffs.push({ name: `Stance: ${sm.currentStance}`, remaining: 0, color: '#8844dd' });
    return buffs;
  }

  setZoneName(name: string) {
    this.zoneText.text = name;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
