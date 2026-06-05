import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SkillManager } from '../core/SkillManager';
import { Logger } from '../core/Logger';

const SLOT_COUNT = 6;
const SLOT_W = 90;
const SLOT_H = 44;
const GAP = 6;
const TOTAL_W = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * GAP;

export class SkillBar {
  container: Container;
  private slots: { bg: Graphics; fill: Graphics; name: Text; key: Text; cdText: Text }[] = [];

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'SkillBar created');

    const startX = -TOTAL_W / 2;
    const barY = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = startX + i * (SLOT_W + GAP);

      const bg = new Graphics();
      bg.beginFill(0x1a1a28, 0.85);
      bg.drawRoundedRect(0, 0, SLOT_W, SLOT_H, 4);
      bg.endFill();
      bg.lineStyle(1, 0x8a7a3a, 0.5);
      bg.drawRoundedRect(0, 0, SLOT_W, SLOT_H, 4);
      bg.x = x;
      bg.y = barY;

      const fill = new Graphics();
      fill.x = x;
      fill.y = barY;

      const name = new Text('', new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#eeeeee',
        stroke: '#000000', strokeThickness: 2,
      }));
      name.anchor.set(0.5);
      name.x = x + SLOT_W / 2;
      name.y = barY + SLOT_H / 2 - 2;

      const key = new Text(`${i + 1}`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#8a7a3a',
        stroke: '#000000', strokeThickness: 2,
      }));
      key.x = x + 4;
      key.y = barY + 3;

      const cdText = new Text('', new TextStyle({
        fontFamily: 'monospace', fontSize: 14, fill: '#ffffff', fontWeight: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }));
      cdText.anchor.set(0.5);
      cdText.x = x + SLOT_W / 2;
      cdText.y = barY + SLOT_H / 2 + 5;

      this.container.addChild(bg, fill, name, key, cdText);
      this.slots.push({ bg, fill, name, key, cdText });
    }
  }

  update(skills: SkillManager) {
    for (let i = 0; i < SLOT_COUNT; i++) {
      const skill = skills.getSkill(i);
      const slot = this.slots[i];

      if (!skill) {
        slot.name.text = '';
        slot.fill.clear();
        slot.cdText.text = '';
        continue;
      }

      slot.name.text = skill.name;
      slot.key.text = `${i + 1}`;

      const cdRatio = skills.cooldownRatio(skill.id);
      slot.fill.clear();
      slot.cdText.text = '';

      if (cdRatio > 0) {
        const remaining = skills.cooldownRemaining(skill.id);
        const secs = Math.ceil(remaining / 60);
        slot.cdText.text = secs > 0 ? `${secs}` : '';

        slot.fill.beginFill(0x000000, 0.55);
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + Math.PI * 2 * cdRatio;
        slot.fill.moveTo(SLOT_W / 2, SLOT_H / 2);
        slot.fill.arc(SLOT_W / 2, SLOT_H / 2, SLOT_H / 2, startAngle, endAngle);
        slot.fill.closePath();
        slot.fill.endFill();
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
