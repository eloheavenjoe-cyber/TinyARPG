import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Logger } from '../core/Logger';

export type TutorialStage = 'move' | 'combat' | 'complete';

export class TutorialScreen {
  container: Container;
  private bg: Graphics;
  private titleText: Text;
  private detailText: Text;
  private stage: TutorialStage;

  constructor(screenWidth: number, screenHeight: number) {
    this.stage = 'move';
    this.container = new Container();

    const panelW = 600;
    const panelH = 80;
    const panelX = screenWidth / 2 - panelW / 2;
    const panelY = screenHeight - 220;
    const padTop = 22;
    const padMid = 30;

    this.bg = new Graphics();
    this.bg.beginFill(0x000000, 0.6);
    this.bg.drawRoundedRect(panelX, panelY, panelW, panelH, 8);
    this.bg.endFill();

    this.titleText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 22, fill: '#ffd700',
      stroke: '#000', strokeThickness: 2,
    }));
    this.titleText.anchor.set(0.5);
    this.titleText.x = screenWidth / 2;
    this.titleText.y = panelY + padTop;

    this.detailText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ccccdd',
      stroke: '#000', strokeThickness: 1,
    }));
    this.detailText.anchor.set(0.5);
    this.detailText.x = screenWidth / 2;
    this.detailText.y = panelY + padTop + padMid;

    this.container.addChild(this.bg, this.titleText, this.detailText);
    this.setStage('move');
    Logger.log('ui', 'TutorialScreen shown');
  }

  setStage(stage: TutorialStage) {
    this.stage = stage;
    switch (stage) {
      case 'move':
        this.titleText.text = 'Move with WASD';
        this.detailText.text = this.formatKeys(new Set());
        break;
      case 'combat':
        this.titleText.text = 'Kill the enemies!';
        this.detailText.text = 'Click to attack. Press 1-6 for skills.';
        break;
      case 'complete':
        this.titleText.text = 'Walk through the door to reach the town!';
        this.detailText.text = '';
        break;
    }
  }

  updateKeys(keysPressed: Set<string>) {
    if (this.stage === 'move') {
      this.detailText.text = this.formatKeys(keysPressed);
    }
  }

  private formatKeys(keys: Set<string>): string {
    const all = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    const labels = ['W', 'A', 'S', 'D'];
    return labels.map((l, i) => keys.has(all[i]) ? `${l} ✓` : l).join('    ');
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
