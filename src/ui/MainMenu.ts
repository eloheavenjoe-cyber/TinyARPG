import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';

type Callback = () => void;

export class MainMenu {
  container: Container;
  private startCallback: Callback = () => {};
  private continueCallback: Callback = () => {};
  private loadGameCallback: Callback = () => {};
  private startButton!: Container;
  private continueButton!: Container;
  private loadGameButton!: Container;

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

    this.createStartButton(screenWidth / 2, screenHeight / 2 + 20);
    this.createContinueButton(screenWidth / 2, screenHeight / 2 + 75);
    this.createLoadGameButton(screenWidth / 2, screenHeight / 2 + 130);

    Logger.log('ui', 'Main menu created');
  }

  private createButton(x: number, y: number, label: string): Container {
    const btn = new Container();

    const btnBg = new Graphics();
    btnBg.beginFill(0x2a2a3a);
    btnBg.drawRoundedRect(-100, -20, 200, 40, 4);
    btnBg.endFill();

    const btnBorder = new Graphics();
    btnBorder.lineStyle(1, 0x5a4a2a);
    btnBorder.drawRoundedRect(-100, -20, 200, 40, 4);

    const btnText = new Text(label, new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fill: '#c0a060',
      letterSpacing: 2,
    }));
    btnText.anchor.set(0.5);

    btn.addChild(btnBg, btnBorder, btnText);
    btn.x = x;
    btn.y = y;
    this.container.addChild(btn);
    return btn;
  }

  private createStartButton(x: number, y: number) {
    this.startButton = this.createButton(x, y, 'New Game');
  }

  private createContinueButton(x: number, y: number) {
    this.continueButton = this.createButton(x, y, 'Continue');
  }

  private createLoadGameButton(x: number, y: number) {
    this.loadGameButton = this.createButton(x, y, 'Load Game');
  }

  onStart(callback: Callback) {
    this.startCallback = callback;
  }

  onContinue(callback: Callback) {
    this.continueCallback = callback;
  }

  onLoadGame(callback: Callback) {
    this.loadGameCallback = callback;
  }

  update(input: InputManager) {
    if (!input.consumeClick()) return;

    const sb = this.startButton.getBounds();
    if (input.mouseX >= sb.x && input.mouseX <= sb.x + sb.width &&
        input.mouseY >= sb.y && input.mouseY <= sb.y + sb.height) {
      Logger.log('ui', 'Start button clicked');
      this.startCallback();
      return;
    }

    const cb = this.continueButton.getBounds();
    if (input.mouseX >= cb.x && input.mouseX <= cb.x + cb.width &&
        input.mouseY >= cb.y && input.mouseY <= cb.y + cb.height) {
      Logger.log('ui', 'Continue button clicked');
      this.continueCallback();
      return;
    }

    const lb = this.loadGameButton.getBounds();
    if (input.mouseX >= lb.x && input.mouseX <= lb.x + lb.width &&
        input.mouseY >= lb.y && input.mouseY <= lb.y + lb.height) {
      Logger.log('ui', 'Load Game button clicked');
      this.loadGameCallback();
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
