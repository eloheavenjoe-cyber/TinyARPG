import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { SkillSubTree, SkillSubTreeNode } from '../core/SkillSubTree';
import { Logger } from '../core/Logger';

export class SkillSubTreeScreen {
  container: Container;
  private tree: SkillSubTree;
  private points: number;
  private onAllocate: (id: string) => void;

  private nodeGfx: Map<string, { bg: Graphics; fill: Graphics; text: Text }> = new Map();
  private lines: Graphics;
  private infoText: Text;
  private pointsText: Text;
  private headerText: Text;
  private hoveredNode: string | null = null;
  private messageTimer = 0;
  private messageText = '';

  constructor(screenWidth: number, screenHeight: number, tree: SkillSubTree, points: number) {
    this.container = new Container();
    this.tree = tree;
    this.points = points;
    this.onAllocate = () => {};

    const bg = new Graphics();
    bg.beginFill(0x080812);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    this.headerText = new Text(`Skill Tree — ${tree.abilityId}`, new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 28, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3,
    }));
    this.headerText.anchor.set(0.5, 0);
    this.headerText.x = screenWidth / 2;
    this.headerText.y = 15;
    this.container.addChild(this.headerText);

    this.pointsText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 18, fill: '#ffdd88',
      stroke: '#000', strokeThickness: 2,
    }));
    this.pointsText.x = 30;
    this.pointsText.y = 60;
    this.container.addChild(this.pointsText);

    const closeHint = new Text('Press K to close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#555566',
    }));
    closeHint.anchor.set(1, 0);
    closeHint.x = screenWidth - 20;
    closeHint.y = 55;
    this.container.addChild(closeHint);

    this.lines = new Graphics();
    this.container.addChild(this.lines);

    const allNodes = tree.getAllNodes();
    for (const node of allNodes) {
      if (node.type === 'start') continue;

      const sx = (node.x / 800) * (screenWidth - 200) + 100;
      const sy = (node.y / 700) * (screenHeight - 250) + 130;

      const g = new Graphics();
      g.x = sx;
      g.y = sy;
      this.container.addChild(g);

      const fill = new Graphics();
      fill.x = sx;
      fill.y = sy;
      this.container.addChild(fill);

      const label = new Text('', new TextStyle({
        fontFamily: 'monospace', fontSize: 9, fill: '#aaaacc',
        align: 'center',
      }));
      label.anchor.set(0.5);
      label.x = sx;
      label.y = sy + 16;
      this.container.addChild(label);

      this.nodeGfx.set(node.id, { bg: g, fill, text: label });
    }

    this.infoText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fill: '#ccccdd',
      wordWrap: true, wordWrapWidth: 300,
    }));
    this.infoText.x = screenWidth - 340;
    this.infoText.y = screenHeight - 140;
    this.container.addChild(this.infoText);

    this.redraw();
    Logger.log('ui', 'Skill sub-tree screen opened');
  }

  onAllocateCallback(cb: (id: string) => void) { this.onAllocate = cb; }

  update(input: InputManager, tree: SkillSubTree, points: number) {
    this.tree = tree;
    this.points = points;
    if (this.messageTimer > 0) this.messageTimer--;
    this.redraw();
    this.handleHover(input);
    this.handleClick(input);
  }

  private handleHover(input: InputManager) {
    this.hoveredNode = null;
    if (this.messageTimer <= 0) {
      for (const [id, gfx] of this.nodeGfx) {
        const node = this.tree.getNode(id);
        if (!node) continue;
        const r = this.getNodeRadius(node);
        const dx = input.mouseX - gfx.bg.x;
        const dy = input.mouseY - gfx.bg.y;
        if (dx * dx + dy * dy < (r + 5) * (r + 5)) {
          this.hoveredNode = id;
          const effectsStr = Object.entries(node.effects)
            .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ');
          this.infoText.text = `${node.name} (${node.type})\n${node.desc}${effectsStr ? `\nEffects: ${effectsStr}` : ''}`;
          return;
        }
      }
    }
    if (this.messageTimer > 0) {
      this.infoText.text = this.messageText;
    } else {
      this.infoText.text = 'Click a node to allocate';
    }
  }

  private handleClick(input: InputManager) {
    if (!input.consumeClick()) return;
    if (!this.tree) return;

    for (const [id, gfx] of this.nodeGfx) {
      const node = this.tree.getNode(id);
      if (!node) continue;
      const r = this.getNodeRadius(node);
      const dx = input.mouseX - gfx.bg.x;
      const dy = input.mouseY - gfx.bg.y;
      if (dx * dx + dy * dy < r * r) {
        if (this.tree.canAllocate(id)) {
          if (this.points > 0 || node.type !== 'keystone') {
            this.onAllocate(id);
          }
        } else if (node.type === 'keystone' && this.tree.keystoneCount >= 2) {
          this.messageText = 'Max 2 keystones';
          this.messageTimer = 60;
          this.infoText.text = this.messageText;
        } else if (this.points <= 0) {
          this.messageText = 'No sub skill points remaining';
          this.messageTimer = 60;
          this.infoText.text = this.messageText;
        }
        return;
      }
    }
  }

  private redraw() {
    const allNodes = this.tree.getAllNodes();
    const ox = 100, oy = 130;

    for (const node of allNodes) {
      if (node.type === 'start') continue;
      const gfx = this.nodeGfx.get(node.id);
      if (!gfx) continue;

      const sx = (node.x / 800) * (1920 - 200) + ox;
      const sy = (node.y / 700) * (1080 - 250) + oy;
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

      gfx.text.text = node.type === 'keystone' ? node.name : '';
    }

    this.lines.clear();
    for (const node of allNodes) {
      const sx1 = (node.x / 800) * (1920 - 200) + ox;
      const sy1 = (node.y / 700) * (1080 - 250) + oy;
      for (const conn of node.connections) {
        const other = this.tree.getNode(conn);
        if (!other) continue;
        const sx2 = (other.x / 800) * (1920 - 200) + ox;
        const sy2 = (other.y / 700) * (1080 - 250) + oy;
        const bothAlloc = this.tree.allocated.has(node.id) && this.tree.allocated.has(conn);
        this.lines.lineStyle(bothAlloc ? 2 : 1, bothAlloc ? 0x6699cc : 0x333355, bothAlloc ? 0.7 : 0.4);
        this.lines.moveTo(sx1, sy1);
        this.lines.lineTo(sx2, sy2);
      }
    }

    this.pointsText.text = `Sub Skill Points: ${this.points}`;
    this.headerText.text = `Skill Tree — ${this.tree.abilityId}`;
  }

  private getNodeRadius(node: SkillSubTreeNode): number {
    return node.type === 'keystone' ? 18 : 11;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
