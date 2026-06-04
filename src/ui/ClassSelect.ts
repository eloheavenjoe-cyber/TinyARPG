import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';
import { ClassType } from '../core/SkillDefs';

type ClassPickCallback = (classType: ClassType) => void;

interface ClassOption {
  classType: ClassType;
  label: string;
  description: string;
  icon: string;
  color: number;
  borderColor: number;
}

const CLASSES: ClassOption[] = [
  {
    classType: 'warrior',
    label: 'Warrior',
    description: 'Melee fighter with heavy hits and strong defenses',
    icon: '\u2694\uFE0F',
    color: 0x1a1a2e,
    borderColor: 0x8a4a2a,
  },
  {
    classType: 'ranger',
    label: 'Ranger',
    description: 'Ranged attacker with bows and precision strikes',
    icon: '\uD83C\uDFF9',
    color: 0x1a2e1a,
    borderColor: 0x2d7a20,
  },
  {
    classType: 'monk',
    label: 'Monk',
    description: 'Martial artist with stance-based combat and spirit techniques',
    icon: '\uD83E\uDDD9',
    color: 0x2e1a1a,
    borderColor: 0xc06020,
  },
];

export class ClassSelect {
  container: Container;
  private callback: ClassPickCallback = () => {};
  private buttons: { bg: Graphics; classType: ClassType }[] = [];

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Choose Your Class', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 36, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 3,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = 180;
    this.container.addChild(title);

    for (let i = 0; i < CLASSES.length; i++) {
      const cls = CLASSES[i];
      const btnX = (screenWidth / 2 - 280) + i * 280;
      const btnY = 360;

      const btn = new Graphics();
      btn.beginFill(cls.color);
      btn.drawRoundedRect(0, 0, 300, 120, 8);
      btn.endFill();
      btn.lineStyle(2, cls.borderColor);
      btn.drawRoundedRect(0, 0, 300, 120, 8);
      btn.x = btnX;
      btn.y = btnY;

      const name = new Text(cls.label, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 26, fill: '#c0a060',
        stroke: '#000', strokeThickness: 1,
      }));
      name.anchor.set(0.5, 0);
      name.x = btnX + 150;
      name.y = btnY + 16;

      const desc = new Text(cls.description, new TextStyle({
        fontFamily: 'monospace', fontSize: 13, fill: '#888899',
        wordWrap: true, wordWrapWidth: 260,
      }));
      desc.anchor.set(0.5, 0);
      desc.x = btnX + 150;
      desc.y = btnY + 56;

      this.container.addChild(btn, name, desc);
      this.buttons.push({ bg: btn, classType: cls.classType });
    }

    Logger.log('ui', 'Class select screen shown');
  }

  onPick(callback: ClassPickCallback) {
    this.callback = callback;
  }

  update(input: InputManager) {
    if (!input.consumeClick()) return;

    for (const btn of this.buttons) {
      const b = btn.bg.getBounds();
      if (input.mouseX >= b.x && input.mouseX <= b.x + b.width &&
          input.mouseY >= b.y && input.mouseY <= b.y + b.height) {
        Logger.log('ui', `Class selected: ${btn.classType}`);
        this.callback(btn.classType);
        return;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
