import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SkillManager } from '../core/SkillManager';
import { Logger } from '../core/Logger';

const SLOT_COUNT = 6;
const SLOT_W = 85;
const SLOT_H = 40;
const GAP = 5;
const TOTAL_W = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * GAP;
const START_X = (1920 - TOTAL_W) / 2;
const Y = 1030;

export class SkillBar {
  container: Container;
  private slots: { bg: Graphics; fill: Graphics; name: Text; key: Text }[] = [];

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'SkillBar created');

    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = START_X + i * (SLOT_W + GAP);

      const bg = new Graphics();
      bg.beginFill(0x111111, 0.55);
      bg.drawRoundedRect(0, 0, SLOT_W, SLOT_H, 4);
      bg.endFill();
      bg.lineStyle(1, 0x333355, 0.5);
      bg.drawRoundedRect(0, 0, SLOT_W, SLOT_H, 4);
      bg.x = x;
      bg.y = Y;

      const fill = new Graphics();
      fill.x = x;
      fill.y = Y;

      const name = new Text('', new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#cccccc',
        stroke: '#000000', strokeThickness: 2,
      }));
      name.anchor.set(0.5);
      name.x = x + SLOT_W / 2;
      name.y = Y + SLOT_H / 2;

      const key = new Text(`${i + 1}`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#666688',
      }));
      key.x = x + 3;
      key.y = Y + 3;

      this.container.addChild(bg, fill, name, key);
      this.slots.push({ bg, fill, name, key });
    }
  }

  update(skills: SkillManager) {
    for (let i = 0; i < SLOT_COUNT; i++) {
      const skill = skills.getSkill(i);
      const slot = this.slots[i];

      if (!skill) {
        slot.name.text = '';
        slot.fill.clear();
        continue;
      }

      slot.name.text = skill.name;
      slot.key.text = `${i + 1}`;

      const cdRatio = skills.cooldownRatio(skill.id);
      slot.fill.clear();
      if (cdRatio > 0) {
        slot.fill.beginFill(0x000000, 0.6);
        slot.fill.drawRect(0, 0, SLOT_W, SLOT_H * cdRatio);
        slot.fill.endFill();
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
