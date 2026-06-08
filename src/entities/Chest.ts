import { Container, AnimatedSprite, Graphics, Text, TextStyle } from 'pixi.js';
import { createChestSprite, playChestOpenAnimation } from '../rendering/SpriteAnimator';
import { Rect } from '../world/Room';

export interface ChestOptions {
  isJackpot?: boolean;
  locked?: boolean;
}

export class Chest {
  container: Container;
  private sprite: AnimatedSprite;
  private interactLabel: Text;
  private lockOverlay: Graphics;
  isOpen = false;
  isJackpot: boolean;
  locked: boolean;
  x: number;
  y: number;
  readonly width = 28;
  readonly height = 20;

  constructor(x: number, y: number, opts?: ChestOptions) {
    this.x = x;
    this.y = y;
    this.isJackpot = opts?.isJackpot ?? false;
    this.locked = opts?.locked ?? false;
    this.container = new Container();

    this.sprite = createChestSprite();
    if (this.isJackpot) this.sprite.tint = 0xddaaff;
    this.container.addChild(this.sprite);

    this.lockOverlay = new Graphics();
    if (this.locked) {
      this.lockOverlay.lineStyle(2, 0x884488);
      this.lockOverlay.drawCircle(0, 0, 12);
      this.lockOverlay.moveTo(-6, -6);
      this.lockOverlay.lineTo(6, 6);
      this.lockOverlay.moveTo(-6, 6);
      this.lockOverlay.lineTo(6, -6);
    }
    this.container.addChild(this.lockOverlay);

    this.interactLabel = new Text('', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#f0c060',
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
    if (!visible || this.isOpen) {
      this.interactLabel.visible = false;
      return;
    }
    this.interactLabel.visible = true;
    this.interactLabel.text = this.locked ? 'Locked' : 'Open [E]';
  }

  unlock() {
    this.locked = false;
    this.lockOverlay.clear();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    playChestOpenAnimation(this.sprite);
    this.interactLabel.visible = false;
    this.lockOverlay.visible = false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
