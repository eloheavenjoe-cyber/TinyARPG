import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { PassiveTree, PassiveNode } from '../core/PassiveTree';
import { Logger } from '../core/Logger';

export class PassiveTreeScreen {
  container: Container;
  private tree: PassiveTree;
  private points: number;
  private attrs: { str: number; dex: number; int: number };
  private unspentAttrs: number;
  private onAllocate: (id: string) => void;
  private onRefund: (id: string) => void;
  private onAttrChange: (stat: 'str' | 'dex' | 'int', delta: number) => void;

  private nodeGfx: Map<string, { bg: Graphics; fill: Graphics; text: Text }> = new Map();
  private lines: Graphics;
  private infoText: Text;
  private pointsText: Text;
  private attrTexts: { str: Text; dex: Text; int: Text };
  private attrBtns: { bg: Graphics; stat: 'str' | 'dex' | 'int' }[];
  private hoveredNode: string | null = null;
  private hoveredAttr: 'str' | 'dex' | 'int' | null = null;

  constructor(screenWidth: number, screenHeight: number, tree: PassiveTree, points: number, attrs: { str: number; dex: number; int: number }, unspentAttrs: number) {
    this.container = new Container();
    this.tree = tree;
    this.points = points;
    this.attrs = { ...attrs };
    this.unspentAttrs = unspentAttrs;
    this.onAllocate = () => {};
    this.onRefund = () => {};
    this.onAttrChange = () => {};

    const bg = new Graphics();
    bg.beginFill(0x080812);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const header = new Text('Passive Skill Tree', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 28, fill: '#f0c060',
      stroke: '#000', strokeThickness: 3,
    }));
    header.anchor.set(0.5, 0);
    header.x = screenWidth / 2;
    header.y = 15;
    this.container.addChild(header);

    this.pointsText = new Text('', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 18, fill: '#f0c060',
      stroke: '#000', strokeThickness: 2,
    }));
    this.pointsText.x = 30;
    this.pointsText.y = 60;
    this.container.addChild(this.pointsText);

    const closeHint = new Text('Press P to close', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#6b4c1e',
    }));
    closeHint.anchor.set(1, 0);
    closeHint.x = screenWidth - 20;
    closeHint.y = 55;
    this.container.addChild(closeHint);

    this.lines = new Graphics();
    this.container.addChild(this.lines);

    const allNodes = tree.getAllNodes();
    const ox = 60, oy = 90;
    for (const node of allNodes) {
      const sx = (node.x / 800) * (screenWidth - 120) + ox;
      const sy = (node.y / 700) * (screenHeight - 220) + oy;

      if (node.type === 'start') continue;

      const g = new Graphics();
      g.x = sx;
      g.y = sy;
      this.container.addChild(g);

      const fill = new Graphics();
      fill.x = sx;
      fill.y = sy;
      this.container.addChild(fill);

      const label = new Text('', new TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 9, fill: '#aaaacc',
        align: 'center',
      }));
      label.anchor.set(0.5);
      label.x = sx;
      label.y = sy + 16;
      this.container.addChild(label);

      this.nodeGfx.set(node.id, { bg: g, fill, text: label });
    }

    this.infoText = new Text('', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 13, fill: '#e8dcc8',
      wordWrap: true, wordWrapWidth: 300,
    }));
    this.infoText.x = screenWidth - 340;
    this.infoText.y = screenHeight - 140;
    this.container.addChild(this.infoText);

    // Attribute panel
    this.attrBtns = [];
    this.attrTexts = { str: new Text(''), dex: new Text(''), int: new Text('') };
    const attrPanelY = screenHeight - 80;
    const attrPanelH = 60;
    const attrLabels: { stat: 'str' | 'dex' | 'int'; label: string; color: number }[] = [
      { stat: 'str', label: 'STR', color: 0xdd8844 },
      { stat: 'dex', label: 'DEX', color: 0x44dd88 },
      { stat: 'int', label: 'INT', color: 0x4488dd },
    ];
    const btnW = 160;

    const panelBg = new Graphics();
    panelBg.beginFill(0x0a0810, 0.9);
    panelBg.drawRoundedRect(20, attrPanelY - 10, screenWidth - 40, attrPanelH + 20, 6);
    panelBg.endFill();
    this.container.addChild(panelBg);

    for (let i = 0; i < attrLabels.length; i++) {
      const { stat, label, color } = attrLabels[i];
      const bx = 60 + i * (btnW + 30);
      const by = attrPanelY;

      const btn = new Graphics();
      btn.beginFill(0x1a1a30);
      btn.lineStyle(1, color, 0.5);
      btn.drawRoundedRect(0, 0, btnW, attrPanelH, 4);
      btn.endFill();
      btn.x = bx;
      btn.y = by;
      this.container.addChild(btn);
      this.attrBtns.push({ bg: btn, stat });

      const labelTxt = new Text(`${label}: ${this.attrs[stat]}`, new TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 18, fill: color,
        stroke: '#000', strokeThickness: 2,
      }));
      labelTxt.x = bx + 10;
      labelTxt.y = by + 8;
      this.container.addChild(labelTxt);
      this.attrTexts[stat] = labelTxt;

      const hint = new Text('+', new TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 22, fill: '#e8dcc8',
        stroke: '#000', strokeThickness: 2,
      }));
      hint.x = bx + btnW - 28;
      hint.y = by + 6;
      this.container.addChild(hint);
    }

    this.redraw();
    Logger.log('ui', 'Passive tree screen opened');
  }

  private makeAttrText(label: string, value: number, color: number, x: number, y: number): Text {
    return new Text(`${label}: ${value}`, new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 16, fill: color, stroke: '#000', strokeThickness: 2,
    }));
  }

  onAllocateCallback(cb: (id: string) => void) { this.onAllocate = cb; }
  onRefundCallback(cb: (id: string) => void) { this.onRefund = cb; }
  onAttrChangeCallback(cb: (stat: 'str' | 'dex' | 'int', delta: number) => void) { this.onAttrChange = cb; }

  update(input: InputManager, tree: PassiveTree, points: number, attrs: { str: number; dex: number; int: number }, unspentAttrs: number) {
    this.tree = tree;
    this.points = points;
    this.attrs = { ...attrs };
    this.unspentAttrs = unspentAttrs;

    this.attrTexts.str.text = `STR: ${attrs.str}`;
    this.attrTexts.dex.text = `DEX: ${attrs.dex}`;
    this.attrTexts.int.text = `INT: ${attrs.int}`;

    this.redraw();
    this.handleHover(input);
    this.handleClick(input);
  }

  private handleHover(input: InputManager) {
    this.hoveredNode = null;
    this.hoveredAttr = null;
    for (const [id, gfx] of this.nodeGfx) {
      const r = this.getNodeRadius(this.tree.getNode(id)!);
      const dx = input.mouseX - gfx.bg.x;
      const dy = input.mouseY - gfx.bg.y;
      if (dx * dx + dy * dy < (r + 5) * (r + 5)) {
        this.hoveredNode = id;
        const node = this.tree.getNode(id)!;
        this.infoText.text = `${node.name} (${node.type})\n${node.description}`;
        return;
      }
    }
    this.infoText.text = '';

    for (const btn of this.attrBtns) {
      if (input.mouseX >= btn.bg.x && input.mouseX <= btn.bg.x + 160 &&
          input.mouseY >= btn.bg.y && input.mouseY <= btn.bg.y + 60) {
        this.hoveredAttr = btn.stat;
        return;
      }
    }
  }

  private handleClick(input: InputManager) {
    if (!this.tree) return;

    if (input.consumeClick()) {
      for (const [id, gfx] of this.nodeGfx) {
        const node = this.tree.getNode(id);
        if (!node) continue;
        const r = this.getNodeRadius(node);
        const dx = input.mouseX - gfx.bg.x;
        const dy = input.mouseY - gfx.bg.y;
        if (dx * dx + dy * dy < r * r) {
          if (this.tree.canAllocate(id) && this.points > 0) {
            this.onAllocate(id);
          }
          return;
        }
      }

      for (const btn of this.attrBtns) {
        if (input.mouseX >= btn.bg.x && input.mouseX <= btn.bg.x + 160 &&
            input.mouseY >= btn.bg.y && input.mouseY <= btn.bg.y + 60) {
          this.onAttrChange(btn.stat, 1);
          return;
        }
      }
    }

    if (input.consumeRightClick()) {
      for (const [id, gfx] of this.nodeGfx) {
        const node = this.tree.getNode(id);
        if (!node) continue;
        const r = this.getNodeRadius(node);
        const dx = input.mouseX - gfx.bg.x;
        const dy = input.mouseY - gfx.bg.y;
        if (dx * dx + dy * dy < r * r) {
          if (this.tree.canRefund(id)) {
            this.onRefund(id);
          }
          return;
        }
      }
    }
  }

  private redraw() {
    const allNodes = this.tree.getAllNodes();
    const ox = 60, oy = 90;

    for (const node of allNodes) {
      if (node.type === 'start') continue;
      const gfx = this.nodeGfx.get(node.id);
      if (!gfx) continue;

      const sx = (node.x / 800) * (1920 - 120) + ox;
      const sy = (node.y / 700) * (1080 - 220) + oy;
      gfx.bg.x = sx;
      gfx.bg.y = sy;
      gfx.fill.x = sx;
      gfx.fill.y = sy;
      gfx.text.x = sx;
      gfx.text.y = sy + 16;

      gfx.bg.clear();
      gfx.fill.clear();

      const allocated = this.tree.allocated.has(node.id);
      const available = this.tree.available.has(node.id);
      const r = this.getNodeRadius(node);
      const isHover = this.hoveredNode === node.id;

      if (allocated) {
        gfx.bg.beginFill(0x334466, 0.8);
        gfx.bg.lineStyle(2, 0x6699cc);
        gfx.bg.drawCircle(0, 0, r);
        gfx.bg.endFill();
        gfx.fill.beginFill(0x88bbff, 0.5);
        gfx.fill.drawCircle(0, 0, r * 0.6);
        gfx.fill.endFill();
      } else if (available) {
        gfx.bg.beginFill(0x222244, 0.6);
        gfx.bg.lineStyle(2, isHover ? 0x88aacc : 0x445566);
        gfx.bg.drawCircle(0, 0, r);
        gfx.bg.endFill();
      } else {
        gfx.bg.beginFill(0x111122, 0.4);
        gfx.bg.lineStyle(1, 0x222233);
        gfx.bg.drawCircle(0, 0, r);
        gfx.bg.endFill();
      }

      gfx.text.text = node.type === 'keystone' ? node.name : (node.type === 'notable' ? node.name : '');
    }

    // Lines
    this.lines.clear();
    for (const node of allNodes) {
      const sx1 = (node.x / 800) * (1920 - 120) + ox;
      const sy1 = (node.y / 700) * (1080 - 220) + oy;
      for (const conn of node.connections) {
        const other = this.tree.getNode(conn);
        if (!other) continue;
        const sx2 = (other.x / 800) * (1920 - 120) + ox;
        const sy2 = (other.y / 700) * (1080 - 220) + oy;
        const bothAlloc = this.tree.allocated.has(node.id) && this.tree.allocated.has(conn);
        this.lines.lineStyle(bothAlloc ? 2 : 1, bothAlloc ? 0x4477aa : 0x222244, bothAlloc ? 0.7 : 0.4);
        this.lines.moveTo(sx1, sy1);
        this.lines.lineTo(sx2, sy2);
      }
    }

    this.pointsText.text = `Passive Points: ${this.points}  |  Attributes Remaining: ${this.unspentAttrs}  (click the + button below to spend)`;

    // Attribute button hover
    for (const btn of this.attrBtns) {
      const isHover = this.hoveredAttr === btn.stat;
      btn.bg.clear();
      const color = btn.stat === 'str' ? 0xdd8844 : btn.stat === 'dex' ? 0x44dd88 : 0x4488dd;
      btn.bg.beginFill(isHover ? 0x2a2a44 : 0x1a1a30);
      btn.bg.lineStyle(2, isHover ? color : 0x333355, isHover ? 0.9 : 0.5);
      btn.bg.drawRoundedRect(0, 0, 160, 60, 4);
      btn.bg.endFill();
    }
  }

  private getNodeRadius(node: PassiveNode): number {
    switch (node.type) {
      case 'keystone': return 20;
      case 'notable': return 16;
      default: return 12;
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
