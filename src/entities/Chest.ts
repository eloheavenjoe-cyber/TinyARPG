import { Container, Sprite, Text, TextStyle } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Rect } from '../world/Room';

export class Chest {
  container: Container;
  private sprite: Sprite;
  private interactLabel: Text;
  isOpen = false;
  x: number;
  y: number;
  readonly width = 28;
  readonly height = 20;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container = new Container();
    this.sprite = new Sprite(Sprites.chestClosed);
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);

    this.interactLabel = new Text('Open [E]', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffff88',
    }));
    this.interactLabel.anchor.set(0.5, 0);
    this.interactLabel.y = -18;
    this.interactLabel.visible = false;
    this.container.addChild(this.interactLabel);
    this.container.x = x;
    this.container.y = y;
  }

  getBounds(): Rect {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
  }

  showPrompt(visible: boolean) {
    this.interactLabel.visible = visible;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.sprite.texture = Sprites.chestOpen;
    this.interactLabel.visible = false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
