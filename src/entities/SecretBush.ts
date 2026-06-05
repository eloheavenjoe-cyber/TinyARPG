import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Logger } from '../core/Logger';

export type BushState = 'hidden' | 'rustling' | 'destroyed';

export class SecretBush {
  container: Container;
  x: number;
  y: number;
  state: BushState = 'hidden';
  private sprite: Sprite;
  private glowOverlay: Graphics;
  private distantGlow: Graphics;
  private interactLabel: Text;
  private wobbleTimer = 0;
  private glowTimer = 0;
  private onDestroyed: () => void;

  constructor(x: number, y: number, onDestroyed: () => void) {
    this.x = x;
    this.y = y;
    this.onDestroyed = onDestroyed;
    this.container = new Container();

    this.sprite = new Sprite(Sprites.bush);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.tint = 0x559944;
    this.container.addChild(this.sprite);

    this.distantGlow = new Graphics();
    this.distantGlow.visible = false;
    this.container.addChild(this.distantGlow);

    this.glowOverlay = new Graphics();
    this.glowOverlay.visible = false;
    this.container.addChild(this.glowOverlay);

    this.interactLabel = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffff88',
    }));
    this.interactLabel.anchor.set(0.5, 0);
    this.interactLabel.y = -24;
    this.interactLabel.visible = false;
    this.container.addChild(this.interactLabel);

    this.container.x = x;
    this.container.y = y;
  }

  showPrompt(visible: boolean) {
    if (this.state === 'destroyed') {
      this.interactLabel.visible = false;
      return;
    }
    this.interactLabel.visible = visible;
    this.interactLabel.text = this.state === 'hidden' ? '??? [E]' : 'Open [E]';
  }

  interact(): boolean {
    if (this.state === 'hidden') {
      this.state = 'rustling';
      this.interactLabel.text = 'Open [E]';
      this.distantGlow.visible = false;
      this.glowOverlay.visible = true;
      this.wobbleTimer = 0;
      this.glowTimer = 0;
      Logger.log('system', 'Bush rustling! Press E again to destroy');
      return true;
    }
    if (this.state === 'rustling') {
      this.state = 'destroyed';
      this.interactLabel.visible = false;
      this.sprite.visible = false;
      this.glowOverlay.visible = false;
      this.distantGlow.visible = false;
      this.onDestroyed();
      Logger.log('system', 'Bush destroyed! Hidden door revealed');
      return true;
    }
    return false;
  }

  update(dt: number, playerX: number, playerY: number) {
    const dist = Math.hypot(playerX - this.x, playerY - this.y);

    if (this.state === 'hidden') {
      if (dist < 300) {
        this.glowTimer += dt * 0.003;
        this.distantGlow.visible = true;
        this.distantGlow.clear();
        const alpha = 0.08 + Math.sin(this.glowTimer * 3) * 0.04;
        this.distantGlow.beginFill(0xffffaa, alpha);
        this.distantGlow.drawCircle(0, -12, 18);
        this.distantGlow.endFill();
      } else {
        this.distantGlow.visible = false;
      }
    }

    if (this.state === 'rustling') {
      this.wobbleTimer += dt * 0.003;
      this.sprite.x = Math.sin(this.wobbleTimer * 3) * 2;

      this.glowTimer += dt * 0.003;
      this.glowOverlay.clear();
      const alpha = 0.3 + Math.sin(this.glowTimer * 4) * 0.15;
      this.glowOverlay.beginFill(0xffff88, alpha);
      this.glowOverlay.drawCircle(0, -12, 14);
      this.glowOverlay.endFill();

      if (dist > 200) {
        this.state = 'hidden';
        this.interactLabel.text = '??? [E]';
        this.glowOverlay.visible = false;
        this.sprite.x = 0;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
