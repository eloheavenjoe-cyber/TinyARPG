import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';
import { WARRIOR_MAIN, SkillDef } from '../core/SkillDefs';

type PickCallback = (id: string) => void;

export class AbilitySelect {
  container: Container;
  private callback: PickCallback = () => {};
  private buttons: { bg: Graphics; skill: SkillDef }[] = [];

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Choose Your Main Ability', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 36, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 3,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = 120;
    this.container.addChild(title);

    const startY = 220;
    const gap = 100;

    for (let i = 0; i < WARRIOR_MAIN.length; i++) {
      const skill = WARRIOR_MAIN[i];
      const y = startY + i * gap;

      const btn = new Graphics();
      btn.beginFill(0x1a1a2e);
      btn.drawRoundedRect(0, 0, 500, 80, 6);
      btn.endFill();
      btn.lineStyle(1, 0x5a4a2a);
      btn.drawRoundedRect(0, 0, 500, 80, 6);
      btn.x = screenWidth / 2 - 250;
      btn.y = y;

      const name = new Text(skill.name, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 22, fill: '#c0a060',
      }));
      name.x = 20;
      name.y = 8;

      const desc = new Text(skill.description, new TextStyle({
        fontFamily: 'monospace', fontSize: 13, fill: '#888899',
      }));
      desc.x = 20;
      desc.y = 42;

      const cost = new Text(`${skill.manaCost} MP`, new TextStyle({
        fontFamily: 'monospace', fontSize: 12, fill: '#4488ff',
      }));
      cost.anchor.set(1, 0);
      cost.x = 480;
      cost.y = 8;

      this.container.addChild(btn, name, desc, cost);
      this.buttons.push({ bg: btn, skill });
    }

    Logger.log('ui', 'Ability select screen shown');
  }

  onPick(callback: PickCallback) {
    this.callback = callback;
  }

  update(input: InputManager) {
    if (!input.consumeClick()) return;

    for (const btn of this.buttons) {
      const b = btn.bg.getBounds();
      if (input.mouseX >= b.x && input.mouseX <= b.x + b.width &&
          input.mouseY >= b.y && input.mouseY <= b.y + b.height) {
        Logger.log('ui', `Ability selected: ${btn.skill.name}`);
        this.callback(btn.skill.id);
        return;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
