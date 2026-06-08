import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SkillManager } from '../core/SkillManager';
import { Logger } from '../core/Logger';

const SLOT_COUNT = 6;
const SLOT_W = 90;
const SLOT_H = 44;
const GAP = 6;
const TOTAL_W = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * GAP;
const CHAMFER = 6;

export class SkillBar {
  container: Container;
  private slots: { bg: Graphics; fill: Graphics; glow: Graphics; name: Text; key: Text; cdText: Text }[] = [];
  private pulseTimer = 0;

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'SkillBar created');

    const startX = -TOTAL_W / 2;
    const barY = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = startX + i * (SLOT_W + GAP);

      // Outer gold glow ring (hidden by default, pulses when slotted)
      const glow = new Graphics();
      glow.beginFill(0xc8963e, 0);
      this.drawChamferedShape(glow, -3, -3, SLOT_W + 6, SLOT_H + 6, CHAMFER + 2);
      glow.endFill();
      glow.lineStyle(2, 0xc8963e, 0);
      this.drawChamferedShape(glow, -3, -3, SLOT_W + 6, SLOT_H + 6, CHAMFER + 2);
      glow.x = x;
      glow.y = barY;

      // Slot background — dark recessed stone
      const bg = new Graphics();
      bg.beginFill(0x0a0805, 0.9);
      this.drawChamferedShape(bg, 0, 0, SLOT_W, SLOT_H, CHAMFER);
      bg.endFill();
      // Outer bronze border
      bg.lineStyle(1, 0x6b4c1e, 0.6);
      this.drawChamferedShape(bg, 0, 0, SLOT_W, SLOT_H, CHAMFER);
      // Inner shadow
      bg.lineStyle(1, 0x000000, 0.4);
      this.drawChamferedShape(bg, 1, 1, SLOT_W - 2, SLOT_H - 2, CHAMFER - 1);
      // Gold top-edge highlight
      bg.lineStyle(1, 0xc8963e, 0.2);
      bg.moveTo(x + CHAMFER, barY + 1);
      bg.lineTo(x + SLOT_W - CHAMFER, barY + 1);
      bg.x = x;
      bg.y = barY;

      // Cooldown arc fill overlay
      const fill = new Graphics();
      fill.x = x;
      fill.y = barY;

      // Skill name
      const name = new Text('', new TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 10, fill: '#e8dcc8',
        stroke: '#000000', strokeThickness: 2,
      }));
      name.anchor.set(0.5);
      name.x = x + SLOT_W / 2;
      name.y = barY + SLOT_H / 2 - 2;

      // Hotkey label (bottom-right)
      const key = new Text(`${i + 1}`, new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 10, fill: '#c8963e',
        stroke: '#000000', strokeThickness: 2,
      }));
      key.x = x + SLOT_W - 14;
      key.y = barY + SLOT_H - 14;

      // Cooldown countdown text
      const cdText = new Text('', new TextStyle({
        fontFamily: 'Uncial Antiqua, serif', fontSize: 16, fill: '#e8dcc8', fontWeight: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }));
      cdText.anchor.set(0.5);
      cdText.x = x + SLOT_W / 2;
      cdText.y = barY + SLOT_H / 2 + 4;

      this.container.addChild(glow, bg, fill, name, key, cdText);
      this.slots.push({ bg, fill, glow, name, key, cdText });
    }
  }

  private drawChamferedShape(g: Graphics, x: number, y: number, w: number, h: number, c: number) {
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

  update(skills: SkillManager) {
    this.pulseTimer += 0.03;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const skill = skills.getSkill(i);
      const slot = this.slots[i];

      if (!skill) {
        slot.name.text = '';
        slot.fill.clear();
        slot.cdText.text = '';
        slot.glow.alpha = 0;
        continue;
      }

      slot.name.text = skill.name;
      slot.key.text = `${i + 1}`;

      // Pulse glow on slotted skill
      const glowAlpha = 0.2 + 0.15 * Math.sin(this.pulseTimer + i * 0.8);
      slot.glow.alpha = glowAlpha;
      slot.glow.lineStyle(2, 0xc8963e, glowAlpha);
      this.drawChamferedShape(slot.glow, -3, -3, SLOT_W + 6, SLOT_H + 6, CHAMFER + 2);

      const cdRatio = skills.cooldownRatio(skill.id);
      slot.fill.clear();
      slot.cdText.text = '';

      if (cdRatio > 0) {
        const remaining = skills.cooldownRemaining(skill.id);
        const secs = Math.ceil(remaining / 60);
        slot.cdText.text = secs > 0 ? `${secs}` : '';

        // Dark overlay sweep
        slot.fill.beginFill(0x000000, 0.55);
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + Math.PI * 2 * cdRatio;
        slot.fill.moveTo(SLOT_W / 2, SLOT_H / 2);
        slot.fill.arc(SLOT_W / 2, SLOT_H / 2, SLOT_H / 2, startAngle, endAngle);
        slot.fill.closePath();
        slot.fill.endFill();

        // Gold shimmer edge at sweep boundary
        slot.fill.lineStyle(1, 0xc8963e, 0.6);
        const shimmerAngle = startAngle + Math.PI * 2 * cdRatio;
        slot.fill.moveTo(SLOT_W / 2, SLOT_H / 2);
        slot.fill.lineTo(
          SLOT_W / 2 + Math.cos(shimmerAngle) * SLOT_H / 2,
          SLOT_H / 2 + Math.sin(shimmerAngle) * SLOT_H / 2,
        );
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
