import { Container, Text, TextStyle, Graphics, Sprite, Texture } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';

type Callback = () => void;

export class MainMenu {
  container: Container;
  private startCallback: Callback = () => {};
  private continueCallback: Callback = () => {};
  private loadGameCallback: Callback = () => {};
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
      fontFamily: 'Cinzel, serif',
      fontSize: 80,
      fill: ['#f0c060', '#8a6a30'],
      stroke: '#000',
      strokeThickness: 6,
      letterSpacing: 10,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = screenHeight * 0.28;
    this.container.addChild(title);

    const subtitle = new Text('A Tiny Action RPG', new TextStyle({
      fontFamily: 'MedievalSharp, serif',
      fontSize: 18,
      fill: '#c8b89a',
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

  private drawChamferedRect(g: Graphics, x: number, y: number, w: number, h: number, c: number) {
    if (c <= 0) { g.drawRect(x, y, w, h); return; }
    g.moveTo(x + c, y);
    g.lineTo(x + w - c, y);
    g.lineTo(x + w, y + c);
    g.lineTo(x + w, y + h - c);
    g.lineTo(x + w - c, y + h);
    g.lineTo(x + c, y + h);
    g.lineTo(x, y + h - c);
    g.lineTo(x, y + c);
    g.closePath();
  }

  private createButton(x: number, y: number, label: string, cb: Callback): Container {
    const btn = new Container();

    const btnBg = new Graphics();
    btnBg.beginFill(0x0a0805, 0.8);
    this.drawChamferedRect(btnBg, -110, -22, 220, 44, 6);
    btnBg.endFill();
    btnBg.lineStyle(1, 0x6b4c1e, 0.6);
    this.drawChamferedRect(btnBg, -110, -22, 220, 44, 6);
    btnBg.lineStyle(1, 0xc8963e, 0.2);
    btnBg.moveTo(-110 + 8, -22 + 1);
    btnBg.lineTo(110 - 8, -22 + 1);

    const btnText = new Text(label, new TextStyle({
      fontFamily: 'Cinzel, serif',
      fontSize: 18,
      fill: '#e8dcc8',
      stroke: '#000',
      strokeThickness: 2,
      letterSpacing: 3,
    }));
    btnText.anchor.set(0.5);

    btn.addChild(btnBg, btnText);
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      Logger.log('ui', `${label} button clicked`);
      cb();
    });
    btn.on('pointerover', () => {
      btnText.style = new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 18, fill: '#f0c060',
        stroke: '#000', strokeThickness: 2, letterSpacing: 3,
      });
    });
    btn.on('pointerout', () => {
      btnText.style = new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 18, fill: '#e8dcc8',
        stroke: '#000', strokeThickness: 2, letterSpacing: 3,
      });
    });
    this.container.addChild(btn);
    return btn;
  }

  private createStartButton(x: number, y: number) {
    this.createButton(x, y, 'New Game', () => this.startCallback());
  }

  private createContinueButton(x: number, y: number) {
    this.createButton(x, y, 'Continue', () => this.continueCallback());
  }

  private createLoadGameButton(x: number, y: number) {
    this.createButton(x, y, 'Load Game', () => this.loadGameCallback());
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
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
