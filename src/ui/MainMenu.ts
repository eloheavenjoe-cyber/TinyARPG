import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';

type StartCallback = () => void;

export class MainMenu {
  container: Container;
  private startCallback: StartCallback = () => {};
  private startButton!: Container;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();

    const accent = new Graphics();
    accent.beginFill(0x1a1a2e);
    accent.drawRect(0, 0, screenWidth, 4);
    accent.drawRect(0, screenHeight - 4, screenWidth, 4);
    accent.endFill();

    this.container.addChild(bg, accent);

    const title = new Text('TinyARPG', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 72,
      fill: ['#c0a060', '#8a6a30'],
      stroke: '#000',
      strokeThickness: 4,
      letterSpacing: 8,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = screenHeight / 3;
    this.container.addChild(title);

    const subtitle = new Text('A Tiny Action RPG', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 20,
      fill: '#6a6a7a',
      letterSpacing: 4,
    }));
    subtitle.anchor.set(0.5);
    subtitle.x = screenWidth / 2;
    subtitle.y = screenHeight / 3 + 60;
    this.container.addChild(subtitle);

    this.createStartButton(screenWidth / 2, screenHeight / 2 + 60);

    const tip = new Text('Click to start your adventure', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 16,
      fill: '#4a4a5a',
      fontStyle: 'italic',
    }));
    tip.anchor.set(0.5);
    tip.x = screenWidth / 2;
    tip.y = screenHeight / 2 + 120;
    this.container.addChild(tip);

    Logger.log('ui', 'Main menu created');
  }

  private createStartButton(x: number, y: number) {
    this.startButton = new Container();

    const btnBg = new Graphics();
    btnBg.beginFill(0x2a2a3a);
    btnBg.drawRoundedRect(-90, -22, 180, 44, 4);
    btnBg.endFill();

    const btnBorder = new Graphics();
    btnBorder.lineStyle(1, 0x5a4a2a);
    btnBorder.drawRoundedRect(-90, -22, 180, 44, 4);

    const btnText = new Text('Start Game', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 20,
      fill: '#c0a060',
      letterSpacing: 2,
    }));
    btnText.anchor.set(0.5);

    this.startButton.addChild(btnBg, btnBorder, btnText);
    this.startButton.x = x;
    this.startButton.y = y;
    this.container.addChild(this.startButton);

    Logger.log('ui', `Start button at (${x}, ${y})`);
  }

  onStart(callback: StartCallback) {
    this.startCallback = callback;
  }

  update(input: InputManager) {
    if (!input.consumeClick()) return;

    const bounds = this.startButton.getBounds();
    if (input.mouseX >= bounds.x && input.mouseX <= bounds.x + bounds.width &&
        input.mouseY >= bounds.y && input.mouseY <= bounds.y + bounds.height) {
      Logger.log('ui', 'Start button clicked');
      this.startCallback();
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
