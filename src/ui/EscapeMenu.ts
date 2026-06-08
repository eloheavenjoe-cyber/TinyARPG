import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class EscapeMenu {
  container: Container;
  private panel: Container;
  private onResume: (() => void) | null = null;
  private onSave: (() => void) | null = null;
  private onSettings: (() => void) | null = null;
  private onSaveAndExit: (() => void) | null = null;
  private saveToastTimer = 0;
  private toastText?: Text;
  private appearTimer = 0;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.6);
    overlay.drawRect(0, 0, screenWidth, screenHeight);
    overlay.endFill();
    overlay.eventMode = 'static';
    this.container.addChild(overlay);

    this.panel = new Container();

    // Outer gold glow
    const glow = new Graphics();
    glow.beginFill(0xc8963e, 0.06);
    this.drawChamferedRect(glow, -156, -186, 312, 372, 12);
    glow.endFill();
    glow.beginFill(0xc8963e, 0.1);
    this.drawChamferedRect(glow, -154, -184, 308, 368, 10);
    glow.endFill();
    this.panel.addChild(glow);

    // Panel background
    const panelBg = new Graphics();
    panelBg.beginFill(0x0a0810, 0.95);
    this.drawChamferedRect(panelBg, -150, -180, 300, 360, 8);
    panelBg.endFill();
    // Bronze border
    panelBg.lineStyle(1, 0x6b4c1e, 0.7);
    this.drawChamferedRect(panelBg, -150, -180, 300, 360, 8);
    // Inner gold highlight
    panelBg.lineStyle(1, 0xc8963e, 0.2);
    panelBg.moveTo(-150 + 10, -180 + 2);
    panelBg.lineTo(150 - 10, -180 + 2);
    this.panel.addChild(panelBg);

    // Title
    const title = new Text('Menu', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 28, fill: '#f0c060',
      stroke: '#000', strokeThickness: 2,
    }));
    title.anchor.set(0.5, 0);
    title.y = -160;
    this.panel.addChild(title);

    // Corner ornaments
    const cornerTL = new Graphics();
    cornerTL.lineStyle(1, 0xc8963e, 0.2);
    cornerTL.arc(-140, -170, 5, Math.PI, 1.5 * Math.PI);
    this.panel.addChild(cornerTL);
    const cornerTR = new Graphics();
    cornerTR.lineStyle(1, 0xc8963e, 0.2);
    cornerTR.arc(140, -170, 5, 1.5 * Math.PI, 2 * Math.PI);
    this.panel.addChild(cornerTR);

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
      btnBg.beginFill(0x0a0805, 0.9);
      this.drawChamferedRect(btnBg, -80, -18, 160, 36, 4);
      btnBg.endFill();
      btnBg.lineStyle(1, 0x6b4c1e, 0.6);
      this.drawChamferedRect(btnBg, -80, -18, 160, 36, 4);
      // Gold top highlight on button
      btnBg.lineStyle(1, 0xc8963e, 0.2);
      btnBg.moveTo(-80 + 6, -18 + 1);
      btnBg.lineTo(80 - 6, -18 + 1);

      const btnText = new Text(cfg.label, new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 16, fill: '#e8dcc8',
        stroke: '#000', strokeThickness: 1,
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
      btn.on('pointerover', () => {
        btnText.style = new TextStyle({
          fontFamily: 'Cinzel, serif', fontSize: 16, fill: '#f0c060',
          stroke: '#000', strokeThickness: 1,
        });
      });
      btn.on('pointerout', () => {
        btnText.style = new TextStyle({
          fontFamily: 'Cinzel, serif', fontSize: 16, fill: '#e8dcc8',
          stroke: '#000', strokeThickness: 1,
        });
      });
      this.panel.addChild(btn);
    }

    this.panel.x = screenWidth / 2;
    this.panel.y = screenHeight / 2;
    this.panel.scale.set(0.95);
    this.panel.alpha = 0;
    this.container.addChild(this.panel);

    // Toast text
    this.toastText = new Text('✦ Game Saved ✦', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 20, fill: '#f0c060',
      stroke: '#000', strokeThickness: 2,
    }));
    this.toastText.anchor.set(0.5);
    this.toastText.x = screenWidth / 2;
    this.toastText.y = screenHeight / 2 + 220;
    this.toastText.visible = false;
    this.container.addChild(this.toastText);

    Logger.log('ui', 'Escape menu opened');
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
    // Panel appear animation
    if (this.appearTimer < 1) {
      this.appearTimer = Math.min(1, this.appearTimer + 0.08);
      const t = this.appearTimer;
      this.panel.scale.set(0.95 + 0.05 * t);
      this.panel.alpha = t;
    }

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
