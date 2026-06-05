import { Container, Text, TextStyle, Graphics, Sprite, Texture } from 'pixi.js';
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
  private bgSprites: Sprite[] = [];
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.container = new Container();

    const bgTexture = Texture.from('menu-bg.png');
    bgTexture.baseTexture.scaleMode = 0;

    const scaleX = screenWidth / 576;
    const scaleY = screenHeight / 324;
    for (let i = 0; i < 2; i++) {
      const s = new Sprite(bgTexture);
      s.scale.set(scaleX, scaleY);
      s.x = i * screenWidth;
      s.y = 0;
      this.container.addChildAt(s, 0);
      this.bgSprites.push(s);
    }

    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.5);
    overlay.drawRect(0, 0, screenWidth, screenHeight);
    overlay.endFill();
    this.container.addChild(overlay);

    const accent = new Graphics();
    accent.beginFill(0xc0a060, 0.3);
    accent.drawRect(0, 0, screenWidth, 2);
    accent.drawRect(0, screenHeight - 2, screenWidth, 2);
    accent.endFill();
    this.container.addChild(accent);

    const title = new Text('TinyARPG', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 80,
      fill: ['#d4b87a', '#8a6a30'],
      stroke: '#000',
      strokeThickness: 6,
      letterSpacing: 10,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = screenHeight * 0.28;
    this.container.addChild(title);

    const subtitle = new Text('A Tiny Action RPG', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fill: '#a0a0b0',
      stroke: '#000',
      strokeThickness: 3,
      letterSpacing: 6,
    }));
    subtitle.anchor.set(0.5);
    subtitle.x = screenWidth / 2;
    subtitle.y = screenHeight * 0.28 + 65;
    this.container.addChild(subtitle);

    this.createStartButton(screenWidth / 2, screenHeight / 2 + 30);
    this.createContinueButton(screenWidth / 2, screenHeight / 2 + 85);
    this.createLoadGameButton(screenWidth / 2, screenHeight / 2 + 140);

    Logger.log('ui', 'Main menu created');
  }

  private createButton(x: number, y: number, label: string): Container {
    const btn = new Container();

    const btnBg = new Graphics();
    btnBg.beginFill(0x1a1a2a, 0.7);
    btnBg.drawRoundedRect(-110, -22, 220, 44, 6);
    btnBg.endFill();

    const btnBorder = new Graphics();
    btnBorder.lineStyle(1, 0x8a7a5a, 0.6);
    btnBorder.drawRoundedRect(-110, -22, 220, 44, 6);

    const btnText = new Text(label, new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fill: '#d4b87a',
      stroke: '#000',
      strokeThickness: 2,
      letterSpacing: 3,
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

  update(input: InputManager, dt: number) {
    const speed = 0.25;
    for (const s of this.bgSprites) {
      s.x -= speed * dt;
      if (s.x + this.screenWidth <= 0) s.x += this.screenWidth * 2;
    }

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
