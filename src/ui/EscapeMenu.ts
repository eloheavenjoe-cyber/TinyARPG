import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class EscapeMenu {
  container: Container;
  private onResume: (() => void) | null = null;
  private onSave: (() => void) | null = null;
  private onSettings: (() => void) | null = null;
  private onSaveAndExit: (() => void) | null = null;
  private saveToastTimer = 0;
  private toastText?: Text;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.5);
    overlay.drawRect(0, 0, screenWidth, screenHeight);
    overlay.endFill();
    overlay.eventMode = 'static';
    this.container.addChild(overlay);

    const panel = new Container();
    const panelBg = new Graphics();
    panelBg.beginFill(0x1a1a2e, 0.95);
    panelBg.drawRoundedRect(-150, -180, 300, 360, 8);
    panelBg.endFill();
    panelBg.lineStyle(1, 0x5a4a2a);
    panelBg.drawRoundedRect(-150, -180, 300, 360, 8);
    panel.addChild(panelBg);

    const title = new Text('Menu', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 28, fill: '#c0a060',
    }));
    title.anchor.set(0.5, 0);
    title.y = -160;
    panel.addChild(title);

    const buttonConfigs = [
      { label: 'Resume', cb: 'onResume' },
      { label: 'Save', cb: 'onSave' },
      { label: 'Settings', cb: 'onSettings' },
      { label: 'Save & Exit', cb: 'onSaveAndExit' },
    ];

    for (let i = 0; i < buttonConfigs.length; i++) {
      const cfg = buttonConfigs[i];
      const btn = new Container();
      const btnBg = new Graphics();
      btnBg.beginFill(0x2a2a3a);
      btnBg.drawRoundedRect(-80, -18, 160, 36, 4);
      btnBg.endFill();
      btnBg.lineStyle(1, 0x5a4a2a);
      btnBg.drawRoundedRect(-80, -18, 160, 36, 4);
      const btnText = new Text(cfg.label, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 16, fill: '#c0a060',
      }));
      btnText.anchor.set(0.5);
      btn.addChild(btnBg, btnText);
      btn.y = -110 + i * 55;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => {
        const cb = (this as any)[cfg.cb] as (() => void) | null;
        cb?.();
      });
      panel.addChild(btn);
    }

    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;
    this.container.addChild(panel);

    // Toast text (hidden by default)
    this.toastText = new Text('Game Saved!', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 20, fill: '#44cc44',
      stroke: '#000', strokeThickness: 2,
    }));
    this.toastText.anchor.set(0.5);
    this.toastText.x = screenWidth / 2;
    this.toastText.y = screenHeight / 2 + 220;
    this.toastText.visible = false;
    this.container.addChild(this.toastText);

    Logger.log('ui', 'Escape menu opened');
  }

  onResumeCallback(cb: () => void) { this.onResume = cb; }
  onSaveCallback(cb: () => void) { this.onSave = cb; }
  onSettingsCallback(cb: () => void) { this.onSettings = cb; }
  onSaveAndExitCallback(cb: () => void) { this.onSaveAndExit = cb; }

  showSaveToast() {
    if (this.toastText) {
      this.toastText.visible = true;
      this.saveToastTimer = 90;
    }
  }

  update() {
    if (this.saveToastTimer > 0) {
      this.saveToastTimer--;
      if (this.saveToastTimer <= 0 && this.toastText) {
        this.toastText.visible = false;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
