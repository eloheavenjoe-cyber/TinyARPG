import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class HubTip {
  container: Container;
  private closed = false;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x000000, 0.55);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const panelW = 520;
    const panelH = 120;
    const px = screenWidth / 2 - panelW / 2;
    const py = screenHeight / 2 - panelH / 2;

    const panel = new Graphics();
    panel.beginFill(0x0a0810, 0.95);
    panel.drawRoundedRect(0, 0, panelW, panelH, 8);
    panel.endFill();
    panel.lineStyle(1, 0x8a7a3a, 0.6);
    panel.drawRoundedRect(0, 0, panelW, panelH, 8);
    panel.x = px;
    panel.y = py;
    this.container.addChild(panel);

    const title = new Text('Welcome to Town', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 20, fill: '#f0c060',
      stroke: '#000', strokeThickness: 2,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = py + 30;
    this.container.addChild(title);

    const body = new Text('Use the central portal to open the World Map and travel to discovered zones.', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 14, fill: '#e8dcc8',
      stroke: '#000', strokeThickness: 1,
    }));
    body.anchor.set(0.5);
    body.x = screenWidth / 2;
    body.y = py + 60;
    this.container.addChild(body);

    const hint = new Text('Press X to close', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#6b4c1e',
      stroke: '#000', strokeThickness: 1,
    }));
    hint.anchor.set(0.5);
    hint.x = screenWidth / 2;
    hint.y = py + 88;
    this.container.addChild(hint);

    Logger.log('ui', 'Hub tip shown');
  }

  isClosed(): boolean {
    return this.closed;
  }

  close() {
    this.closed = true;
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }

  destroy() {
    if (!this.closed) this.close();
  }
}
