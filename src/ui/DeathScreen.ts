import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Logger } from '../core/Logger';

type RestartCallback = () => void;

export class DeathScreen {
  container: Container;
  private restartCallback: RestartCallback = () => {};
  private restartButton!: Container;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('You Died', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 64,
      fill: '#cc3333',
      stroke: '#000',
      strokeThickness: 4,
      letterSpacing: 6,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = screenHeight / 2 - 60;
    this.container.addChild(title);

    this.restartButton = new Container();

    const btnBg = new Graphics();
    btnBg.beginFill(0x3a2020);
    btnBg.drawRoundedRect(-80, -20, 160, 40, 4);
    btnBg.endFill();

    const btnBorder = new Graphics();
    btnBorder.lineStyle(1, 0xcc3333);
    btnBorder.drawRoundedRect(-80, -20, 160, 40, 4);

    const btnText = new Text('Restart', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 20,
      fill: '#cc6666',
      letterSpacing: 2,
    }));
    btnText.anchor.set(0.5);

    this.restartButton.addChild(btnBg, btnBorder, btnText);
    this.restartButton.x = screenWidth / 2;
    this.restartButton.y = screenHeight / 2 + 40;
    this.container.addChild(this.restartButton);

    Logger.log('ui', 'Death screen created');
  }

  onRestart(callback: RestartCallback) {
    this.restartCallback = callback;
  }

  update(input: InputManager) {
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
