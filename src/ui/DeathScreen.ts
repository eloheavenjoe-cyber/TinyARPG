import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';

type RestartCallback = () => void;

export class DeathScreen {
  container: Container;
  private restartCallback: RestartCallback = () => {};
  private restartButton!: Container;
  private pulseTimer = 0;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    // Dark overlay with slight red tint
    const bg = new Graphics();
    bg.beginFill(0x0a0000, 0.75);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    // Vignette overlay
    const vignette = new Graphics();
    const vw = screenWidth;
    const vh = screenHeight;
    vignette.beginFill(0x220000, 0.15);
    vignette.drawRect(0, 0, vw, 60);
    vignette.drawRect(0, vh - 60, vw, 60);
    vignette.drawRect(0, 0, 60, vh);
    vignette.drawRect(vw - 60, 0, 60, vh);
    vignette.endFill();
    this.container.addChild(vignette);

    // "You Died" title — Cinzel crimson with gold stroke
    const title = new Text('You Died', new TextStyle({
      fontFamily: 'Cinzel, serif',
      fontSize: 72,
      fill: '#8b1a1a',
      stroke: '#000',
      strokeThickness: 5,
      letterSpacing: 8,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = screenHeight / 2 - 60;
    this.container.addChild(title);

    // Death subtitle
    const subtitle = new Text('Your journey has ended...', new TextStyle({
      fontFamily: 'MedievalSharp, serif',
      fontSize: 16,
      fill: '#6b4c1e',
      stroke: '#000',
      strokeThickness: 2,
      letterSpacing: 3,
    }));
    subtitle.anchor.set(0.5);
    subtitle.x = screenWidth / 2;
    subtitle.y = screenHeight / 2 - 20;
    this.container.addChild(subtitle);

    // Restart button with ember glow
    this.restartButton = new Container();

    // Outer ember glow
    const glow = new Graphics();
    glow.beginFill(0xcc2200, 0);
    glow.drawRoundedRect(-84, -24, 168, 48, 6);
    glow.endFill();
    glow.lineStyle(2, 0xcc2200, 0.3);
    glow.drawRoundedRect(-84, -24, 168, 48, 6);
    this.restartButton.addChild(glow);

    const btnBg = new Graphics();
    btnBg.beginFill(0x1a0808);
    this.drawChamferedRect(btnBg, -80, -20, 160, 40, 5);
    btnBg.endFill();
    btnBg.lineStyle(1, 0x8b1a1a);
    this.drawChamferedRect(btnBg, -80, -20, 160, 40, 5);
    btnBg.lineStyle(1, 0xcc2200, 0.3);
    btnBg.moveTo(-80 + 8, -19);
    btnBg.lineTo(80 - 8, -19);
    this.restartButton.addChild(btnBg);

    const btnText = new Text('Rise Again', new TextStyle({
      fontFamily: 'Cinzel, serif',
      fontSize: 20,
      fill: '#cc4444',
      letterSpacing: 3,
    }));
    btnText.anchor.set(0.5);
    this.restartButton.addChild(btnText);

    this.restartButton.x = screenWidth / 2;
    this.restartButton.y = screenHeight / 2 + 50;
    this.container.addChild(this.restartButton);

    Logger.log('ui', 'Death screen created');
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

  onRestart(callback: RestartCallback) {
    this.restartCallback = callback;
  }

  update(input: InputManager) {
    this.pulseTimer += 0.03;

    // Pulse the button border
    const glowChild = this.restartButton.children[0] as Graphics;
    const glowAlpha = 0.15 + 0.2 * Math.sin(this.pulseTimer);
    glowChild.clear();
    glowChild.beginFill(0xcc2200, 0);
    glowChild.drawRoundedRect(-84, -24, 168, 48, 6);
    glowChild.endFill();
    glowChild.lineStyle(2, 0xcc2200, glowAlpha);
    glowChild.drawRoundedRect(-84, -24, 168, 48, 6);

    if (!input.consumeClick()) return;

    const bounds = this.restartButton.getBounds();
    if (input.mouseX >= bounds.x && input.mouseX <= bounds.x + bounds.width &&
        input.mouseY >= bounds.y && input.mouseY <= bounds.y + bounds.height) {
      Logger.log('ui', 'Restart button clicked');
      this.restartCallback();
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
