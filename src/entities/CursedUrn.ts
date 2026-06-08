import * as PIXI from 'pixi.js';
import {
  URN_TYPES, UrnTypeConfig, rollUrnType, rollUrnRarity, getUrnCurseCount,
} from '../core/UrnConfig';
import { CurseDef, CurseTier, rollCurses } from '../core/CurseMods';
import { Logger } from '../core/Logger';
import { SerializedUrn } from '../core/SaveManager';

const RARITY_COLORS: Record<string, number> = { normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00 };
const RARITY_COLORS_HEX: Record<string, string> = { normal: '#ffffff', magic: '#4488ff', rare: '#ffcc00' };

const URN_WIDTH = 60;
const URN_HEIGHT = 72;
const INTERACT_RANGE = 48;
const PANEL_SHOW_RANGE = 150;

const RARE_PREFIXES = [
  'Virulent', 'Wretched', 'Cursed', 'Blighted', 'Sanguine',
  'Foul', 'Unholy', 'Dark', 'Twisted', 'Corrupted',
];

export type UrnState = 'idle' | 'opened';
export type UrnRarity = 'normal' | 'magic' | 'rare';

export class CursedUrn {
  x: number;
  y: number;
  type: UrnTypeConfig;
  rarity: UrnRarity;
  curses: CurseDef[];
  state: UrnState = 'idle';
  container: PIXI.Container;
  isOpen = false;
  rareName?: string;

  private body: PIXI.Graphics;
  private lid: PIXI.Graphics;
  private glow: PIXI.Graphics;
  private panel: PIXI.Container;
  private panelBg: PIXI.Graphics;
  private interactLabel: PIXI.Text;
  private wasInRange = false;
  private wasInteractRange = false;
  private smokeTimer = 0;
  private smokeParticles: { g: PIXI.Graphics; life: number; maxLife: number; xOff: number }[] = [];
  private tier3Texts: PIXI.Text[] = [];

  constructor(
    x: number,
    y: number,
    opts?: {
      type?: UrnTypeConfig;
      rarity?: UrnRarity;
      curses?: CurseDef[];
      rareName?: string;
      preOpened?: boolean;
    },
  ) {
    this.x = x;
    this.y = y;
    this.type = opts?.type ?? rollUrnType();
    this.rarity = opts?.rarity ?? rollUrnRarity();
    this.curses = opts?.curses ?? this.generateCurses();
    this.rareName = opts?.rareName ?? (this.rarity === 'rare' ? this.generateRareName() : undefined);
    if (opts?.preOpened) {
      this.isOpen = true;
      this.state = 'opened';
    }

    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    this.glow = new PIXI.Graphics();
    this.body = new PIXI.Graphics();
    this.lid = new PIXI.Graphics();
    this.interactLabel = new PIXI.Text('Open [E]', new PIXI.TextStyle({
      fontFamily: 'MedievalSharp, serif',
      fontSize: 11,
      fill: '#f0c060',
      stroke: '#000000',
      strokeThickness: 2,
    }));
    this.interactLabel.anchor.set(0.5, 1);
    this.interactLabel.visible = false;

    this.panel = new PIXI.Container();
    this.panelBg = new PIXI.Graphics();
    this.panel.alpha = 0;
    this.panel.visible = false;

    this.buildVisuals();
  }

  private generateRareName(): string {
    const prefix = RARE_PREFIXES[Math.floor(Math.random() * RARE_PREFIXES.length)];
    return `${prefix} ${this.type.name}`;
  }

  private generateCurses(): CurseDef[] {
    const count = getUrnCurseCount(this.rarity);
    const minTier: CurseTier = this.rarity === 'normal' ? 1 : 1;
    const maxTier: CurseTier = this.rarity === 'normal' ? 2 : 3;
    return rollCurses(count, minTier, maxTier, this.rarity === 'rare');
  }

  buildVisuals() {
    this.drawGlow();
    this.drawBody();
    if (!this.isOpen) {
      this.drawLid();
    }

    this.interactLabel.y = -(URN_HEIGHT / 2) - 4;
    this.panel.y = (URN_HEIGHT / 2) + 4;

    this.container.addChild(this.glow);
    this.container.addChild(this.body);
    this.container.addChild(this.lid);
    this.container.addChild(this.interactLabel);
    this.container.addChild(this.panel);

    this.buildPanel();
  }

  private drawBody() {
    const g = this.body;
    g.clear();
    const hw = URN_WIDTH / 2;
    const hh = URN_HEIGHT / 2;

    switch (this.type.shape) {
      case 'urn': {
        g.beginFill(this.type.bgColor);
        g.drawEllipse(0, 8, hw, 24);
        g.drawRect(-hw * 0.3, -hh + 6, hw * 0.6, 16);
        g.drawRect(-hw * 0.4, 28, hw * 0.8, 8);
        g.endFill();
        g.lineStyle(2, this.type.accentColor, 0.6);
        g.moveTo(-hw, 0);
        g.lineTo(hw, 0);
        g.moveTo(-hw * 0.4, 28);
        g.lineTo(hw * 0.4, 28);
        g.lineStyle(1, this.type.accentColor, 0.4);
        g.moveTo(0, -16);
        g.lineTo(0, -4);
        g.moveTo(-6, -12);
        g.lineTo(6, -12);
        break;
      }
      case 'coffer': {
        g.beginFill(this.type.bgColor);
        g.drawRoundedRect(-hw, -hh, URN_WIDTH, URN_HEIGHT, 6);
        g.endFill();
        g.lineStyle(1, this.type.accentColor, 0.3);
        for (let i = 0; i < 5; i++) {
          const cy = -20 + i * 12;
          g.drawCircle(-8, cy, 5);
          g.drawCircle(8, cy, 5);
        }
        break;
      }
      case 'casket': {
        g.beginFill(this.type.bgColor);
        g.drawRoundedRect(-hw, -hh, URN_WIDTH, URN_HEIGHT, 4);
        g.endFill();
        for (let i = 0; i < 3; i++) {
          const cy = -12 + i * 14;
          g.beginFill(this.type.accentColor);
          g.drawRoundedRect(-12, cy, 8, 8, 2);
          g.drawRoundedRect(4, cy, 8, 8, 2);
          g.endFill();
        }
        break;
      }
      case 'vessel': {
        g.beginFill(this.type.bgColor, 0.7);
        g.drawEllipse(0, 4, hw, 22);
        g.drawRect(-hw * 0.25, -hh + 4, hw * 0.5, 14);
        g.endFill();
        g.lineStyle(1, 0xffffff, 0.15);
        g.moveTo(-hw * 0.3, -hh + 8);
        g.lineTo(-hw * 0.3, 20);
        g.lineStyle(0);
        g.beginFill(this.type.accentColor, 0.4);
        g.drawCircle(-6, -10, 3);
        g.drawCircle(4, -6, 2);
        g.drawCircle(-2, -14, 2);
        g.endFill();
        break;
      }
      case 'vault': {
        g.beginFill(this.type.bgColor);
        g.drawRect(-hw, -hh, URN_WIDTH, URN_HEIGHT);
        g.endFill();
        g.lineStyle(1, 0x333333, 0.3);
        g.moveTo(-8, -hh);
        g.lineTo(-4, 0);
        g.lineTo(-12, hh);
        g.moveTo(6, -hh);
        g.lineTo(10, 10);
        g.lineTo(4, hh);
        g.lineStyle(1, this.type.accentColor, 0.5);
        for (let i = 0; i < 3; i++) {
          const ry = -12 + i * 16;
          g.drawRect(-16, ry, 6, 8);
          g.drawRect(10, ry, 6, 8);
        }
        break;
      }
    }

    const bc = RARITY_COLORS[this.rarity] || 0xffffff;
    g.lineStyle(3, bc, 0.7);
    g.drawRoundedRect(-hw - 2, -hh - 2, URN_WIDTH + 4, URN_HEIGHT + 4, 4);
  }

  private drawLid() {
    const g = this.lid;
    g.clear();
    const hw = URN_WIDTH / 2;
    const hh = URN_HEIGHT / 2;

    g.beginFill(this.type.bgColor, 0.9);
    g.drawRect(-hw * 0.35, -hh - 4, hw * 0.7, 6);
    g.drawRect(-hw * 0.25, -hh - 8, hw * 0.5, 4);
    g.endFill();
    g.beginFill(this.type.accentColor, 0.8);
    g.drawCircle(0, -hh - 10, 3);
    g.endFill();
  }

  private drawGlow() {
    const g = this.glow;
    g.clear();
    const c = RARITY_COLORS[this.rarity] || 0xffffff;
    g.beginFill(c, 0.08);
    g.drawEllipse(0, URN_HEIGHT / 2 + 4, 40, 10);
    g.endFill();
    g.beginFill(c, 0.04);
    g.drawEllipse(0, URN_HEIGHT / 2 + 4, 60, 16);
    g.endFill();
  }

  private buildPanel() {
    this.panel.removeChildren();
    this.tier3Texts = [];

    const rarityColor = RARITY_COLORS_HEX[this.rarity] || '#ffffff';
    let yOff = 0;

    if (this.rareName && this.rarity === 'rare') {
      const rareText = new PIXI.Text(this.rareName, new PIXI.TextStyle({
        fontFamily: 'MedievalSharp, serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: rarityColor,
        stroke: '#000000',
        strokeThickness: 2,
      }));
      rareText.anchor.set(0.5, 0);
      rareText.y = yOff;
      this.panel.addChild(rareText);
      yOff += 14;
    }

    const nameText = new PIXI.Text(this.type.name, new PIXI.TextStyle({
      fontFamily: 'MedievalSharp, serif',
      fontSize: 10,
      fontWeight: 'bold',
      fill: rarityColor,
      stroke: '#000000',
      strokeThickness: 2,
    }));
    nameText.anchor.set(0.5, 0);
    nameText.y = yOff;
    this.panel.addChild(nameText);
    yOff += 13;

    const catText = new PIXI.Text(this.type.lootCategory, new PIXI.TextStyle({
      fontFamily: 'MedievalSharp, serif',
      fontSize: 9,
      fill: '#c8b060',
      stroke: '#000000',
      strokeThickness: 1,
    }));
    catText.anchor.set(0.5, 0);
    catText.y = yOff;
    this.panel.addChild(catText);
    yOff += 12;

    const divider = new PIXI.Graphics();
    divider.lineStyle(1, 0x666666, 0.5);
    divider.moveTo(-30, yOff);
    divider.lineTo(30, yOff);
    this.panel.addChild(divider);
    yOff += 4;

    for (const curse of this.curses) {
      const isT3 = curse.tier === 3;
      const modText = new PIXI.Text(`◈ ${curse.name}`, new PIXI.TextStyle({
        fontFamily: 'MedievalSharp, serif',
        fontSize: 9,
        fill: isT3 ? '#cc2200' : '#8b1a1a',
        stroke: '#000000',
        strokeThickness: 1,
      }));
      modText.anchor.set(0.5, 0);
      modText.y = yOff;
      modText.name = `curse_${curse.id}`;
      this.panel.addChild(modText);
      if (isT3) this.tier3Texts.push(modText);
      yOff += 11;
    }

    yOff += 2;

    this.panelBg.clear();
    this.panelBg.beginFill(0x0a0805, 0.85);
    this.panelBg.drawRoundedRect(-55, -2, 110, yOff + 2, 3);
    this.panelBg.endFill();
    this.panelBg.lineStyle(1, RARITY_COLORS[this.rarity] || 0xffffff, 0.3);
    this.panelBg.drawRoundedRect(-55, -2, 110, yOff + 2, 3);
    this.panel.addChildAt(this.panelBg, 0);
  }

  update(dt: number, playerX: number, playerY: number, gameTime: number) {
    const dist = Math.hypot(playerX - this.x, playerY - this.y);
    const inRange = dist < PANEL_SHOW_RANGE && !this.isOpen;
    const inInteract = dist < INTERACT_RANGE && !this.isOpen;

    const fadeSpeed = dt * 0.004;
    if (inRange) {
      this.panel.alpha = Math.min(1, this.panel.alpha + fadeSpeed * 3);
    } else {
      this.panel.alpha = Math.max(0, this.panel.alpha - fadeSpeed * 2);
    }
    this.panel.visible = this.panel.alpha > 0.01;

    this.interactLabel.visible = inInteract;

    if (inRange && !this.wasInRange) {
      this.wasInRange = true;
    }
    if (!inRange) this.wasInRange = false;

    if (inInteract && !this.wasInteractRange) {
      this.wasInteractRange = true;
    }
    if (!inInteract) this.wasInteractRange = false;

    if (this.tier3Texts.length > 0 && this.panel.visible) {
      const pulse = 0.6 + 0.4 * Math.sin(gameTime * 0.1);
      for (const t of this.tier3Texts) {
        t.alpha = pulse;
      }
    }

    if (!this.isOpen) {
      this.smokeTimer += dt * 0.05;
      if (this.smokeTimer > 1) {
        this.smokeTimer = 0;
        this.emitSmokeParticle();
      }
      this.updateSmokeParticles(dt);
    }
  }

  private emitSmokeParticle() {
    const g = new PIXI.Graphics();
    const rc = RARITY_COLORS[this.rarity] || 0xffffff;
    g.beginFill(rc, 0.3);
    g.drawCircle(0, 0, 2 + Math.random() * 3);
    g.endFill();
    g.x = (Math.random() - 0.5) * 12;
    g.y = -(URN_HEIGHT / 2) - 8;
    g.zIndex = 3;
    this.container.addChild(g);
    this.smokeParticles.push({ g, life: 40, maxLife: 40, xOff: g.x });
  }

  private updateSmokeParticles(dt: number) {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life -= dt * 0.1;
      p.g.y -= 0.3 * (dt / 60);
      p.g.x = p.xOff + Math.sin(p.life * 0.2) * 4;
      p.g.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.container.removeChild(p.g);
        p.g.destroy();
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  open(): CurseDef[] {
    if (this.isOpen) return [];
    this.isOpen = true;
    this.state = 'opened';

    this.lid.visible = false;
    this.panel.visible = false;
    this.interactLabel.visible = false;
    this.glow.clear();

    for (const p of this.smokeParticles) {
      this.container.removeChild(p.g);
      p.g.destroy();
    }
    this.smokeParticles = [];

    Logger.log('combat', `Urn opened: ${this.type.name} (${this.rarity}), ${this.curses.length} curses`);

    return this.curses;
  }

  getPanelHeight(): number {
    const curseLines = this.curses.length;
    const base = this.rarity === 'rare' ? 14 + 13 + 12 + 4 + 2 : 13 + 12 + 4 + 2;
    return base + curseLines * 11;
  }

  serialize(): SerializedUrn {
    return {
      id: this.type.id,
      x: this.x,
      y: this.y,
      rarity: this.rarity,
      curseIds: this.curses.map(c => c.id),
      opened: this.isOpen,
      rareName: this.rareName,
    };
  }

  destroy() {
    for (const p of this.smokeParticles) {
      this.container.removeChild(p.g);
      p.g.destroy();
    }
    this.smokeParticles = [];
    this.container.destroy({ children: true });
  }
}
