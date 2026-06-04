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
  // Blade - elongated diamond
  g.beginFill(0xd0d0e0);
  g.drawPolygon([0, -38, 7, -4, 0, 0, -7, -4]);
  g.endFill();
  // Blade highlight
  g.beginFill(0xffffff, 0.3);
  g.drawRect(-1, -36, 2, 32);
  g.endFill();
  // Crossguard
  g.beginFill(0x8a6a3a);
  g.drawRect(-14, -1, 28, 3);
  g.endFill();
  // Grip
  g.beginFill(0x6a4a2a);
  g.drawRect(-2, 2, 4, 13);
  g.endFill();
  // Pommel
  g.beginFill(0x8a6a3a);
  g.drawCircle(0, 18, 4);
  g.endFill();
  // Guard detail
  g.beginFill(0x7a5a3a);
  g.drawRect(-8, -2, 16, 5);
  g.endFill();
}

function drawBow(g: Graphics) {
  // Upper limb
  g.beginFill(0x5a7a4a);
  g.drawPolygon([
    0, 0,
    -6, -28,
    -3, -32,
    0, -30,
    3, -32,
    6, -28,
  ]);
  g.endFill();
  // Lower limb
  g.beginFill(0x5a7a4a);
  g.drawPolygon([
    0, 0,
    -6, 28,
    -3, 32,
    0, 30,
    3, 32,
    6, 28,
  ]);
  g.endFill();
  // Bowstring dots
  g.beginFill(0xcccccc);
  g.drawCircle(-12, -22, 1);
  g.drawCircle(-12, 22, 1);
  g.endFill();
  // Arrow shaft
  g.beginFill(0xb0a070);
  g.drawRect(-10, -1, 38, 2);
  g.endFill();
  // Arrowhead
  g.beginFill(0xd0d0e0);
  g.drawPolygon([28, 0, 20, -5, 20, 5]);
  g.endFill();
  // Fletching
  g.beginFill(0xc0b080);
  g.drawPolygon([-10, 0, -13, -4, -13, 4]);
  g.endFill();
}

function drawMonkSilhouette(g: Graphics) {
  const c = 0xd0b080;
  // Head
  g.beginFill(c);
  g.drawCircle(0, -32, 10);
  g.endFill();
  // Torso
  g.beginFill(c);
  g.drawPolygon([-4, -22, 4, -22, 8, 4, -2, 4]);
  g.endFill();
  // Front arm (punching forward)
  g.beginFill(c);
  g.drawPolygon([4, -10, 8, -8, 28, -16, 26, -20]);
  g.endFill();
  // Fist
  g.beginFill(c);
  g.drawCircle(28, -18, 4);
  g.endFill();
  // Front leg (lunge)
  g.beginFill(c);
  g.drawPolygon([4, 2, 8, 2, 24, 26, 20, 28]);
  g.endFill();
  // Back leg
  g.beginFill(c);
  g.drawPolygon([0, 2, 4, 2, -8, 28, -14, 30]);
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
    const btnGap = 20;
    const totalW = CLASSES.length * btnW + (CLASSES.length - 1) * btnGap;
    const startX = (screenWidth - totalW) / 2;

    for (let i = 0; i < CLASSES.length; i++) {
      const cls = CLASSES[i];
      const btnX = startX + i * (btnW + btnGap);
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
