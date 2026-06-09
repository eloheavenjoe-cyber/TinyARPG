import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { WORLD_MAP_REGISTRY, WorldMapEntry, getDiscoveredCount, getTotalZoneCount } from '../core/WorldMapData';

const PW = 1200;
const PH = 800;
const PX = 360;
const PY = 140;
const MM = 60;
const MX = PX + MM;
const MY = PY + MM;
const MW = PW - MM * 2;
const MH = PH - MM * 2;
const CW = 1920;
const CH = 1080;

const NODE_RADIUS = 24;

interface NodeInfo {
  entry: WorldMapEntry;
  nx: number;
  ny: number;
  container: Container;
  iconNormal: Graphics;
  iconHover: Graphics;
  glow: Graphics;
  label: Text;
}

interface ConnData {
  ax: number; ay: number;
  bx: number; by: number;
  cpx: number; cpy: number;
  bothDiscovered: boolean;
}

export class WorldMapScreen {
  container: Container;
  private onTravelConfirm: (targetZoneId: string) => void;
  private onClose: () => void;
  private currentZoneId: string;

  private drawProgress = 0;
  private mistAngle = 0;
  private pulseAngle = 0;

  private nodes: NodeInfo[] = [];
  private connData: ConnData[] = [];

  private connGfx: Graphics;
  private mistGfx: Graphics;
  private pulseGfx: Graphics;
  private tooltipGfx: Graphics;
  private confirmGfx: Graphics;
  private closeBtn: Container;
  private confirmBtn: Container;
  private cancelBtn: Container;
  private hoveredNode: NodeInfo | null = null;
  private selectedZoneId: string | null = null;
  private nodePulse: { node: NodeInfo; frame: number } | null = null;

  private closing = false;
  private closeFrames = 9;
  private closeCount = 0;

  constructor(
    currentZoneId: string,
    onTravelConfirm: (targetZoneId: string) => void,
    onClose: () => void,
  ) {
    this.currentZoneId = currentZoneId;
    this.onTravelConfirm = onTravelConfirm;
    this.onClose = onClose;
    this.container = new Container();

    const backdrop = new Graphics();
    backdrop.beginFill(0x000000, 0.7);
    backdrop.drawRect(0, 0, CW, CH);
    backdrop.endFill();
    backdrop.eventMode = 'static';
    this.container.addChild(backdrop);

    const panel = new Graphics();
    panel.beginFill(0xc8a96e);
    panel.drawRoundedRect(PX, PY, PW, PH, 8);
    panel.endFill();

    const stains = [
      [PX + 120, PY + 180, 60, 40],
      [PX + 900, PY + 500, 80, 50],
      [PX + 400, PY + 650, 50, 70],
      [PX + 800, PY + 200, 45, 35],
    ];
    for (const [cx, cy, rx, ry] of stains) {
      panel.beginFill(0xa08050, 0.12);
      panel.drawEllipse(cx, cy, rx, ry);
      panel.endFill();
    }

    panel.lineStyle(3, 0x6b4c1e, 0.6);
    panel.drawRoundedRect(PX + 8, PY + 8, PW - 16, PH - 16, 6);

    panel.lineStyle(3, 0x6b4c1e, 0.8);
    panel.drawRoundedRect(PX, PY, PW, PH, 8);
    panel.lineStyle(1, 0x8a7a3a, 0.6);
    panel.drawRoundedRect(PX + 4, PY + 4, PW - 8, PH - 8, 7);
    this.container.addChild(panel);

    const ornaments = new Graphics();
    ornaments.lineStyle(1.5, 0xc8963e, 0.9);
    for (const [cx, cy] of [[PX + 2, PY + 2], [PX + PW - 2, PY + 2], [PX + 2, PY + PH - 2], [PX + PW - 2, PY + PH - 2]]) {
      const s = 4;
      ornaments.moveTo(cx - s, cy);
      ornaments.lineTo(cx, cy - s);
      ornaments.lineTo(cx + s, cy);
      ornaments.lineTo(cx, cy + s);
      ornaments.closePath();
    }
    this.container.addChild(ornaments);

    const title = new Text('World Map', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 28, fill: '#f0c060',
      stroke: '#000', strokeThickness: 3,
    }));
    title.anchor.set(0.5);
    title.x = CW / 2;
    title.y = PY + 36;
    this.container.addChild(title);

    const line = new Graphics();
    line.lineStyle(1, 0x8a7a3a, 0.6);
    line.moveTo(CW / 2 - 200, PY + 72);
    line.lineTo(CW / 2 + 200, PY + 72);
    line.lineStyle(1.5, 0xc8963e, 0.8);
    const sd = 3;
    line.moveTo(CW / 2 - sd, PY + 72);
    line.lineTo(CW / 2, PY + 72 - sd);
    line.lineTo(CW / 2 + sd, PY + 72);
    line.lineTo(CW / 2, PY + 72 + sd);
    line.closePath();
    this.container.addChild(line);

    const sub = new Text(`${getDiscoveredCount()} / ${getTotalZoneCount()} Zones Discovered`, new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 13, fill: '#c8963e',
      stroke: '#000', strokeThickness: 2,
    }));
    sub.anchor.set(0.5);
    sub.x = CW / 2;
    sub.y = PY + 88;
    this.container.addChild(sub);

    const normalClose = new TextStyle({ fontFamily: 'Cinzel, serif', fontSize: 20, fill: '#e8dcc8', stroke: '#000', strokeThickness: 2 });
    const hoverClose = new TextStyle({ fontFamily: 'Cinzel, serif', fontSize: 20, fill: '#f0c060', stroke: '#000', strokeThickness: 2 });
    this.closeBtn = new Container();
    const closeText = new Text('✕', normalClose);
    closeText.anchor.set(0.5);
    this.closeBtn.addChild(closeText);
    this.closeBtn.x = PX + PW - 30;
    this.closeBtn.y = PY + 20;
    this.closeBtn.eventMode = 'static';
    this.closeBtn.cursor = 'pointer';
    this.closeBtn.on('pointerover', () => { closeText.style = hoverClose; });
    this.closeBtn.on('pointerout', () => { closeText.style = normalClose; });
    this.closeBtn.on('pointerdown', () => this.close());
    this.container.addChild(this.closeBtn);

    this.connGfx = new Graphics();
    this.container.addChild(this.connGfx);

    this.buildConnData();
    this.buildNodes();

    this.mistGfx = new Graphics();
    this.container.addChild(this.mistGfx);

    this.pulseGfx = new Graphics();
    this.container.addChild(this.pulseGfx);

    this.tooltipGfx = new Graphics();
    this.container.addChild(this.tooltipGfx);

    this.confirmGfx = new Graphics();
    this.container.addChild(this.confirmGfx);

    this.confirmBtn = new Container();
    this.confirmBtn.eventMode = 'static';
    this.confirmBtn.cursor = 'pointer';
    this.confirmBtn.on('pointerdown', () => {
      if (this.selectedZoneId) {
        this.onTravelConfirm(this.selectedZoneId);
      }
    });
    this.container.addChild(this.confirmBtn);

    this.cancelBtn = new Container();
    this.cancelBtn.eventMode = 'static';
    this.cancelBtn.cursor = 'pointer';
    this.cancelBtn.on('pointerdown', () => {
      this.selectedZoneId = null;
      this.confirmGfx.clear();
      this.confirmBtn.removeChildren();
      this.confirmBtn.visible = false;
      this.cancelBtn.removeChildren();
      this.cancelBtn.visible = false;
    });
    this.container.addChild(this.cancelBtn);
  }

  private buildConnData() {
    const entries = Object.values(WORLD_MAP_REGISTRY);
    for (const a of entries) {
      const ax = MX + (a.mapPosition.x / 100) * MW;
      const ay = MY + (a.mapPosition.y / 100) * MH;
      for (const connId of a.connections) {
        if (a.id >= connId) continue;
        const b = WORLD_MAP_REGISTRY[connId];
        if (!b) continue;
        const bx = MX + (b.mapPosition.x / 100) * MW;
        const by = MY + (b.mapPosition.y / 100) * MH;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const sign = ((a.id.charCodeAt(0) + connId.charCodeAt(0)) % 2 === 0) ? 1 : -1;
        const off = 12 * sign;
        const cpx = (ax + bx) / 2 + (-dy / len) * off;
        const cpy = (ay + by) / 2 + (dx / len) * off;
        this.connData.push({ ax, ay, bx, by, cpx, cpy, bothDiscovered: a.discovered && b.discovered });
      }
    }
  }

  private buildNodes() {
    for (const entry of Object.values(WORLD_MAP_REGISTRY)) {
      const nx = MX + (entry.mapPosition.x / 100) * MW;
      const ny = MY + (entry.mapPosition.y / 100) * MH;
      const container = new Container();
      container.x = nx;
      container.y = ny;

      const glow = new Graphics();
      glow.beginFill(0xf0c060, 0.1);
      glow.drawCircle(0, 0, 18);
      glow.endFill();
      container.addChild(glow);

      const iconNormal = new Graphics();
      this.drawNodeIcon(iconNormal, entry.icon, false);
      const iconHover = new Graphics();
      this.drawNodeIcon(iconHover, entry.icon, true);
      iconHover.alpha = 0;
      container.addChild(iconNormal);
      container.addChild(iconHover);

      const isDiscovered = entry.discovered;
      const labelText = isDiscovered ? entry.name : '???';
      const label = new Text(labelText, new TextStyle({
        fontFamily: isDiscovered ? 'Cinzel, serif' : 'MedievalSharp, serif',
        fontSize: isDiscovered ? 11 : 10,
        fill: isDiscovered ? '#e8dcc8' : '#555555',
        stroke: '#000', strokeThickness: 2,
      }));
      label.anchor.set(0.5, 0);
      label.y = 14;
      container.addChild(label);

      if (isDiscovered) {
        container.eventMode = 'static';
        container.cursor = 'pointer';
        container.on('pointerdown', (e) => {
          e.stopPropagation();
          if (entry.id !== this.currentZoneId) {
            this.selectNode(entry.id);
          }
        });
      }

      container.alpha = isDiscovered ? 1 : 0.2;

      this.container.addChild(container);
      this.nodes.push({ entry, nx, ny, container, iconNormal, iconHover, glow, label });
    }
  }

  private drawNodeIcon(g: Graphics, iconType: string, hover: boolean) {
    g.clear();
    const color = hover ? 0xf0c060 : 0xc8963e;
    g.lineStyle(2, color, 1);

    switch (iconType) {
      case 'town':
        g.beginFill(color, 1);
        g.drawRoundedRect(-3, -5, 6, 10, 2);
        g.endFill();
        g.moveTo(-4, -5);
        g.lineTo(0, -13);
        g.lineTo(4, -5);
        g.closePath();
        g.beginFill(0xf0c060, 1);
        g.drawCircle(0, 0, 1.5);
        g.endFill();
        break;
      case 'dungeon':
        g.moveTo(-6, 6);
        g.lineTo(-6, -1);
        g.moveTo(6, 6);
        g.lineTo(6, -1);
        g.arc(0, -1, 6, Math.PI, 0, false);
        break;
      case 'forest': {
        const crownColor = hover ? color : 0x4a8a3a;
        g.beginFill(crownColor, 1);
        g.moveTo(0, -10);
        g.lineTo(5, -2);
        g.lineTo(-5, -2);
        g.closePath();
        g.endFill();
        g.lineStyle(2, color, 1);
        g.drawRect(-1.5, -2, 3, 5);
        break;
      }
      case 'desert':
        g.moveTo(-6, 4);
        g.lineTo(0, -4);
        g.lineTo(6, 4);
        g.closePath();
        g.moveTo(-7, 4);
        g.lineTo(7, 4);
        break;
      case 'ice':
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          g.moveTo(0, 0);
          g.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        }
        break;
      case 'arena':
        g.moveTo(-5, -5);
        g.lineTo(5, 5);
        g.moveTo(5, -5);
        g.lineTo(-5, 5);
        break;
      case 'secret':
        g.beginFill(color, 1);
        g.drawEllipse(0, 0, 4, 2.5);
        g.endFill();
        g.beginFill(0x000000, 1);
        g.drawCircle(0, 0, 1);
        g.endFill();
        break;
      case 'dev':
        g.drawCircle(0, 0, 4);
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          g.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
          g.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
        }
        break;
    }
  }

  private selectNode(zoneId: string) {
    if (zoneId === this.currentZoneId) return;
    this.selectedZoneId = zoneId;
    const node = this.nodes.find(n => n.entry.id === zoneId);
    if (node) {
      this.nodePulse = { node, frame: 0 };
    }
    this.showConfirmation(zoneId);
  }

  private showConfirmation(zoneId: string) {
    const entry = WORLD_MAP_REGISTRY[zoneId];
    if (!entry) return;

    this.confirmGfx.clear();
    this.confirmBtn.removeChildren();
    this.cancelBtn.removeChildren();

    const confY = PY + PH - 70;
    const confW = 320;
    const confH = 50;
    const confX = CW / 2 - confW / 2;

    this.confirmGfx.beginFill(0x0a0810, 0.92);
    this.confirmGfx.drawRoundedRect(confX, confY, confW, confH, 4);
    this.confirmGfx.endFill();
    this.confirmGfx.lineStyle(1, 0x8a7a3a, 0.8);
    this.confirmGfx.drawRoundedRect(confX, confY, confW, confH, 4);

    const prompt = new Text(`Travel to ${entry.name}?`, new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#e8dcc8',
      stroke: '#000', strokeThickness: 1,
    }));
    prompt.x = confX + 16;
    prompt.y = confY + 6;
    this.confirmGfx.addChild(prompt);

    const confirmStyle = new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#f0c060',
      stroke: '#000', strokeThickness: 1,
    });
    const confirmHoverStyle = new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#ffffff',
      stroke: '#000', strokeThickness: 1,
    });
    const confirmText = new Text('[CONFIRM]', confirmStyle);
    confirmText.anchor.set(0.5);
    confirmText.x = confX + 180;
    confirmText.y = confY + confH / 2;
    this.confirmBtn.addChild(confirmText);
    this.confirmBtn.x = confX + 180;
    this.confirmBtn.y = confY + confH / 2;
    this.confirmBtn.visible = true;
    this.confirmBtn.on('pointerover', () => { confirmText.style = confirmHoverStyle; });
    this.confirmBtn.on('pointerout', () => { confirmText.style = confirmStyle; });

    const cancelStyle = new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#c8963e',
      stroke: '#000', strokeThickness: 1,
    });
    const cancelText = new Text('[CANCEL]', cancelStyle);
    cancelText.anchor.set(0.5);
    cancelText.x = confX + 260;
    cancelText.y = confY + confH / 2;
    this.cancelBtn.addChild(cancelText);
    this.cancelBtn.x = confX + 260;
    this.cancelBtn.y = confY + confH / 2;
    this.cancelBtn.visible = true;
  }

  update(dt: number, mouseX: number, mouseY: number) {
    if (this.closing) {
      this.closeCount++;
      this.container.alpha = Math.max(0, 1 - this.closeCount / this.closeFrames);
      if (this.closeCount >= this.closeFrames) {
        this.onClose();
        this.destroy();
      }
      return;
    }

    this.drawProgress = Math.min(1, this.drawProgress + dt / 24);
    this.mistAngle += dt * 0.01;
    this.pulseAngle += dt * 0.05;

    this.drawConnections();
    this.drawMist();
    this.drawPulseRing();

    this.updateHover(mouseX, mouseY);
    this.updateNodePulse();
  }

  private drawConnections() {
    this.connGfx.clear();
    const alphaMult = Math.min(1, this.drawProgress * 3);
    for (const c of this.connData) {
      const targetAlpha = c.bothDiscovered ? 0.6 : 0.15;
      const alpha = alphaMult * targetAlpha;
      if (alpha <= 0) continue;

      if (c.bothDiscovered) {
        this.connGfx.lineStyle(2, 0x6b4c1e, alpha);
        this.connGfx.moveTo(c.ax, c.ay);
        this.connGfx.quadraticCurveTo(c.cpx, c.cpy, c.bx, c.by);
      } else {
        this.connGfx.lineStyle(1, 0x555555, alpha);
        this.connGfx.moveTo(c.ax, c.ay);
        this.connGfx.lineTo(c.bx, c.by);
      }
    }
  }

  private drawMist() {
    this.mistGfx.clear();
    const positions = [
      { x: 30, y: 55, r: 100 },
      { x: 18, y: 45, r: 80 },
      { x: 8, y: 32, r: 90 },
      { x: 58, y: 82, r: 70 },
      { x: 45, y: 70, r: 60 },
    ];
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const phase = i * 2.5;
      const ox = Math.sin(this.mistAngle + phase) * 30;
      const oy = Math.cos(this.mistAngle * 0.7 + phase) * 20;
      const mx = MX + (p.x / 100) * MW + ox;
      const my = MY + (p.y / 100) * MH + oy;
      this.mistGfx.beginFill(0x000000, 0.06);
      this.mistGfx.drawCircle(mx, my, p.r);
      this.mistGfx.endFill();
    }
  }

  private drawPulseRing() {
    this.pulseGfx.clear();
    const currentEntry = Object.values(WORLD_MAP_REGISTRY).find(e => e.id === this.currentZoneId);
    if (!currentEntry) return;
    const nx = MX + (currentEntry.mapPosition.x / 100) * MW;
    const ny = MY + (currentEntry.mapPosition.y / 100) * MH;
    const ringAlpha = 0.5 + 0.4 * Math.sin(this.pulseAngle * 2);
    this.pulseGfx.lineStyle(2, 0xf0c060, ringAlpha);
    this.pulseGfx.drawCircle(nx, ny, 22);
  }

  private updateHover(mouseX: number, mouseY: number) {
    let closest: NodeInfo | null = null;
    for (const node of this.nodes) {
      if (!node.entry.discovered) continue;
      const dx = mouseX - node.nx;
      const dy = mouseY - node.ny;
      if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
        closest = node;
        break;
      }
    }

    if (closest !== this.hoveredNode) {
      if (this.hoveredNode) {
        this.hoveredNode.iconNormal.alpha = 1;
        this.hoveredNode.iconHover.alpha = 0;
        this.hoveredNode.label.style = new TextStyle({
          fontFamily: 'Cinzel, serif', fontSize: 11, fill: '#e8dcc8',
          stroke: '#000', strokeThickness: 2,
        });
      }
      this.hoveredNode = closest;
      if (this.hoveredNode) {
        this.hoveredNode.iconNormal.alpha = 0;
        this.hoveredNode.iconHover.alpha = 1;
        this.hoveredNode.label.style = new TextStyle({
          fontFamily: 'Cinzel, serif', fontSize: 11, fill: '#e8dcc8',
          stroke: '#000', strokeThickness: 2, fontWeight: 'bold',
        });
      }
      this.drawTooltip(closest, mouseX, mouseY);
    } else if (closest) {
      this.drawTooltip(closest, mouseX, mouseY);
    } else {
      this.tooltipGfx.clear();
    }
  }

  private drawTooltip(node: NodeInfo | null, mouseX: number, mouseY: number) {
    this.tooltipGfx.clear();
    if (!node) return;

    const tw = 160;
    const th = 50;
    const leftSide = node.nx < CW / 2;
    const tx = leftSide ? node.nx + 30 : node.nx - 30 - tw;
    const ty = node.ny - 25;

    this.tooltipGfx.beginFill(0x0a0810, 0.92);
    this.tooltipGfx.drawRoundedRect(tx, ty, tw, th, 4);
    this.tooltipGfx.endFill();
    this.tooltipGfx.lineStyle(1, 0x8a7a3a, 0.8);
    this.tooltipGfx.drawRoundedRect(tx, ty, tw, th, 4);

    const name = new Text(node.entry.name, new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 12, fill: '#f0c060',
      stroke: '#000', strokeThickness: 1,
    }));
    name.x = tx + 8;
    name.y = ty + 8;
    this.tooltipGfx.addChild(name);

    const typeMap: Record<string, string> = { hub: 'Hub', dungeon: 'Zone', arena: 'Arena', boss: 'Boss', secret: 'Secret', dev: 'Dev' };
    const badge = new Text(typeMap[node.entry.type] || node.entry.type, new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 10, fill: '#c8963e',
      stroke: '#000', strokeThickness: 1,
    }));
    badge.x = tx + 8;
    badge.y = ty + 28;
    this.tooltipGfx.addChild(badge);
  }

  private updateNodePulse() {
    if (!this.nodePulse) return;
    this.nodePulse.frame++;
    const progress = this.nodePulse.frame / 10;
    if (progress >= 1) {
      this.nodePulse.node.container.scale.set(1);
      this.nodePulse = null;
      return;
    }
    const s = 1 + 0.15 * Math.sin(progress * Math.PI);
    this.nodePulse.node.container.scale.set(s);
  }

  close() {
    this.closing = true;
    this.closeCount = 0;
  }

  destroy() {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
