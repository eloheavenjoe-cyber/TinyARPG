import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';
import { ClassType } from '../core/SkillDefs';

type ClassPickCallback = (classType: ClassType) => void;

interface ClassOption {
  classType: ClassType;
  label: string;
  description: string;
  color: number;
  borderColor: number;
  drawIcon: (g: Graphics) => void;
}

function drawSword(g: Graphics) {
  g.lineStyle(3, 0xc0a060);
  // Blade
  g.beginFill(0xd0d0e0);
  g.moveTo(0, -36);
  g.lineTo(6, -4);
  g.lineTo(0, 0);
  g.lineTo(-6, -4);
  g.closePath();
  g.endFill();
  // Blade center highlight
  g.lineStyle(1, 0xffffff, 0.4);
  g.moveTo(0, -34);
  g.lineTo(0, -2);
  // Guard
  g.lineStyle(3, 0x8a6a3a);
  g.moveTo(-12, 0);
  g.lineTo(12, 0);
  // Handle
  g.lineStyle(3, 0x6a4a2a);
  g.moveTo(0, 0);
  g.lineTo(0, 14);
  // Pommel
  g.beginFill(0x8a6a3a);
  g.drawCircle(0, 17, 3);
  g.endFill();
}

function drawBow(g: Graphics) {
  g.lineStyle(4, 0x7a9a6a);
  const bowColor = 0x5a7a4a;
  // Bow arc (upper)
  g.beginFill(0, 0);
  g.arc(0, 0, 32, -Math.PI * 0.75, -Math.PI * 0.25);
  g.lineStyle(4, bowColor);
  g.arc(0, 0, 32, -Math.PI * 0.75, -Math.PI * 0.25);
  // Bow arc (lower)
  g.arc(0, 0, 32, Math.PI * 0.25, Math.PI * 0.75);
  // Bowstring
  g.lineStyle(1.5, 0xcccccc, 0.7);
  const stringY = 32 * Math.sin(Math.PI * 0.25);
  const stringX = 32 * Math.cos(Math.PI * 0.25);
  g.moveTo(-stringX, -stringY);
  g.lineTo(-stringX, stringY);
  // Arrow
  g.lineStyle(2, 0xb0a070);
  g.moveTo(-stringX + 4, 0);
  g.lineTo(28, 0);
  g.lineStyle(1, 0xc0b080);
  g.moveTo(-stringX + 4, -3);
  g.lineTo(-stringX + 4, 3);
  // Arrowhead
  g.beginFill(0xd0d0e0);
  g.moveTo(28, 0);
  g.lineTo(22, -5);
  g.lineTo(22, 5);
  g.closePath();
  g.endFill();
}

function drawMonkSilhouette(g: Graphics) {
  const c = 0xd0b080;
  g.lineStyle(3, c);
  // Head
  g.drawCircle(0, -32, 10);
  // Body (torso leaning forward in fighting stance)
  g.moveTo(0, -22);
  g.lineTo(6, 2);
  // Front arm (punching forward)
  g.moveTo(6, -8);
  g.lineTo(28, -16);
  // Back arm (chambered)
  g.moveTo(4, -6);
  g.lineTo(-16, -14);
  g.lineTo(-22, -6);
  // Front leg (forward lunge)
  g.moveTo(6, 2);
  g.lineTo(22, 26);
  g.lineTo(30, 24);
  // Back leg
  g.moveTo(6, 2);
  g.lineTo(-10, 26);
  g.lineTo(-18, 30);
  // Fist
  g.beginFill(c);
  g.drawCircle(28, -16, 3);
  g.endFill();
}

const CLASSES: ClassOption[] = [
  {
    classType: 'warrior',
    label: 'Warrior',
    description: 'Melee fighter with heavy hits and strong defenses',
    color: 0x1a1a2e,
    borderColor: 0x8a4a2a,
    drawIcon: drawSword,
  },
  {
    classType: 'ranger',
    label: 'Ranger',
    description: 'Ranged attacker with bows and precision strikes',
    color: 0x1a2e1a,
    borderColor: 0x2d7a20,
    drawIcon: drawBow,
  },
  {
    classType: 'monk',
    label: 'Monk',
    description: 'Martial artist with stance-based combat and spirit techniques',
    color: 0x2e1a1a,
    borderColor: 0xc06020,
    drawIcon: drawMonkSilhouette,
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
    title.y = 160;
    this.container.addChild(title);

    const btnW = 300;
    const btnH = 180;

    for (let i = 0; i < CLASSES.length; i++) {
      const cls = CLASSES[i];
      const btnX = (screenWidth / 2 - 320) + i * 320;
      const btnY = 300;

      const btn = new Graphics();
      btn.beginFill(cls.color);
      btn.drawRoundedRect(0, 0, btnW, btnH, 10);
      btn.endFill();
      btn.lineStyle(2, cls.borderColor);
      btn.drawRoundedRect(0, 0, btnW, btnH, 10);
      btn.x = btnX;
      btn.y = btnY;

      // Icon
      const icon = new Graphics();
      cls.drawIcon(icon);
      icon.x = btnX + btnW / 2;
      icon.y = btnY + 50;
      this.container.addChild(icon);

      const name = new Text(cls.label, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 24, fill: '#c0a060',
        stroke: '#000', strokeThickness: 1,
      }));
      name.anchor.set(0.5, 0);
      name.x = btnX + btnW / 2;
      name.y = btnY + 110;

      const desc = new Text(cls.description, new TextStyle({
        fontFamily: 'monospace', fontSize: 12, fill: '#888899',
        wordWrap: true, wordWrapWidth: 260,
      }));
      desc.anchor.set(0.5, 0);
      desc.x = btnX + btnW / 2;
      desc.y = btnY + 144;

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
