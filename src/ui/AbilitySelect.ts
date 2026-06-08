import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';
import { WARRIOR_MAIN, RANGER_MAIN, MONK_MAIN, SkillDef, ClassType } from '../core/SkillDefs';

type PickCallback = (id: string) => void;

export class AbilitySelect {
  container: Container;
  private callback: PickCallback = () => {};
  private buttons: { bg: Graphics; skill: SkillDef }[] = [];
  private classType: ClassType;

  constructor(screenWidth: number, screenHeight: number, classType: ClassType = 'warrior') {
    this.classType = classType;
    this.container = new Container();

    const mainSkills = classType === 'monk' ? MONK_MAIN : classType === 'warrior' ? WARRIOR_MAIN : RANGER_MAIN;

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    if (classType === 'monk') {
      const title = new Text('Monk — All Techniques Available', new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 36, fill: '#f0c060',
        stroke: '#000', strokeThickness: 3, letterSpacing: 3,
      }));
      title.anchor.set(0.5);
      title.x = screenWidth / 2;
      title.y = 100;
      this.container.addChild(title);

      const infoLines = [
        'Slot 1: Basic Strike',
        'Slot 2: Dragon Palm',
        'Slot 3: Whirlwind Kick',
        'Slot 4: Tiger Uppercut',
        'Slot 5: Meditate',
        'Slot 6: Stance Toggle',
      ];

      const vertStart = 220;
      const lineGap = 40;
      for (let i = 0; i < infoLines.length; i++) {
        const line = new Text(infoLines[i], new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 18, fill: '#6b4c1e',
        }));
        line.anchor.set(0.5);
        line.x = screenWidth / 2;
        line.y = vertStart + i * lineGap;
        this.container.addChild(line);
      }

      const btnX = screenWidth / 2 - 120;
      const btnY = screenHeight - 120;
      const btn = new Graphics();
      btn.beginFill(0x2e1a1a);
      btn.drawRoundedRect(0, 0, 240, 60, 8);
      btn.endFill();
      btn.lineStyle(2, 0xc06020);
      btn.drawRoundedRect(0, 0, 240, 60, 8);
      btn.x = btnX;
      btn.y = btnY;

      const btnLabel = new Text('Begin Journey', new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 22, fill: '#f0c060',
        stroke: '#000', strokeThickness: 1,
      }));
      btnLabel.anchor.set(0.5);
      btnLabel.x = btnX + 120;
      btnLabel.y = btnY + 30;

      this.container.addChild(btn, btnLabel);
      this.buttons.push({ bg: btn, skill: { id: 'basic_strike', name: 'Begin Journey', description: '', manaCost: 0, cooldown: 0, range: 0, damageMult: 0, effectType: 'passive', category: 'main', classType: 'monk' } });
    } else {
      const titleText = `${classType === 'warrior' ? 'Warrior' : 'Ranger'} - Choose Your Main Ability`;
      const title = new Text(titleText, new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 36, fill: '#f0c060',
        stroke: '#000', strokeThickness: 3, letterSpacing: 3,
      }));
      title.anchor.set(0.5);
      title.x = screenWidth / 2;
      title.y = 120;
      this.container.addChild(title);

      const startY = 220;
      const gap = 100;

      for (let i = 0; i < mainSkills.length; i++) {
        const skill = mainSkills[i];
        const y = startY + i * gap;
        const btnX = screenWidth / 2 - 250;
        const btnY = y;

        const btn = new Graphics();
        btn.beginFill(0x0a0810);
        btn.drawRoundedRect(0, 0, 500, 80, 6);
        btn.endFill();
        btn.lineStyle(1, 0x6b4c1e);
        btn.drawRoundedRect(0, 0, 500, 80, 6);
        btn.x = btnX;
        btn.y = btnY;

        const name = new Text(skill.name, new TextStyle({
          fontFamily: 'Cinzel, serif', fontSize: 22, fill: '#f0c060',
        }));
        name.x = btnX + 20;
        name.y = btnY + 8;

        const desc = new Text(skill.description, new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 13, fill: '#6b4c1e',
        }));
        desc.x = btnX + 20;
        desc.y = btnY + 42;

        const cost = new Text(`${skill.manaCost} MP`, new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#4488ff',
        }));
        cost.anchor.set(1, 0);
        cost.x = btnX + 480;
        cost.y = btnY + 8;

        this.container.addChild(btn, name, desc, cost);
        this.buttons.push({ bg: btn, skill });
      }
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
