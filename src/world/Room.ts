import { Container, Graphics, Text, TextStyle, TilingSprite, Sprite } from 'pixi.js';
import { Logger } from '../core/Logger';
import { BiomeData, BIOME_DATA, BiomeId, DoorMarker, PortalMarker, BuildingData, NpcData } from '../core/ZoneConfig';
import { tileTextures, TILE_CONFIGS } from '../core/TileConfigs';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ROOM_WIDTH = 6400;
export const ROOM_HEIGHT = 3584;
const TILE_SIZE = 32;
export const WALL_THICKNESS = 48;

export function resolveCollision(entity: Rect, walls: Rect[]): { x: number; y: number } {
  let { x, y } = entity;

  for (const wall of walls) {
    if (x < wall.x + wall.width && x + entity.width > wall.x &&
        y < wall.y + wall.height && y + entity.height > wall.y) {

      const overlapLeft = (x + entity.width) - wall.x;
      const overlapRight = (wall.x + wall.width) - x;
      const overlapTop = (y + entity.height) - wall.y;
      const overlapBottom = (wall.y + wall.height) - y;

      const minX = Math.min(overlapLeft, overlapRight);
      const minY = Math.min(overlapTop, overlapBottom);

      if (minX < minY) {
        if (overlapLeft < overlapRight) {
          x = wall.x - entity.width;
        } else {
          x = wall.x + wall.width;
        }
      } else {
        if (overlapTop < overlapBottom) {
          y = wall.y - entity.height;
        } else {
          y = wall.y + wall.height;
        }
      }
    }
  }

  return { x, y };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

export class Room {
  container: Container;
  walls: Rect[] = [];
  walkableArea: Rect;
  biomeData: BiomeData;
  biomeId: BiomeId;
  doors: DoorMarker[];
  portals: PortalMarker[];
  private decorations: Rect[];
  private buildings: BuildingData[];
  private npcs: NpcData[];
  private isPortalUnlocked: (targetZone: string) => boolean;

  private playerStart?: { x: number; y: number };

  constructor(biome: BiomeId = 'dev', doors: DoorMarker[] = [], portals: PortalMarker[] = [], decorations: Rect[] = [], buildings: BuildingData[] = [], npcs: NpcData[] = [], isPortalUnlocked?: (targetZone: string) => boolean, playerStart?: { x: number; y: number }) {
    this.container = new Container();
    this.walkableArea = {
      x: WALL_THICKNESS,
      y: WALL_THICKNESS,
      width: ROOM_WIDTH - WALL_THICKNESS * 2,
      height: ROOM_HEIGHT - WALL_THICKNESS * 2,
    };
    this.biomeData = BIOME_DATA[biome];
    this.biomeId = biome;
    this.doors = doors;
    this.portals = portals;
    this.decorations = decorations;
    this.buildings = buildings;
    this.npcs = npcs;
    this.isPortalUnlocked = isPortalUnlocked || (() => true);
    this.playerStart = playerStart;
    this.build();
    Logger.log('system', `Room created: ${ROOM_WIDTH}x${ROOM_HEIGHT}, walkable: ${this.walkableArea.width}x${this.walkableArea.height}`);
  }

  private build() {
    const tc = TILE_CONFIGS[this.biomeId];
    const floorTx = tc ? tileTextures[tc.floorTile] : undefined;

    if (floorTx && tc) {
      const floor = new TilingSprite(floorTx, ROOM_WIDTH, ROOM_HEIGHT);
      floor.tint = 0x999999;
      this.container.addChild(floor);

      if (tc.accentTiles && tc.accentTiles.tiles.length > 0) {
        const accentContainer = new Container();
        for (let i = 0; i < 200; i++) {
          const tileName = tc.accentTiles.tiles[Math.floor(Math.random() * tc.accentTiles.tiles.length)];
          const accentTx = tileTextures[tileName];
          if (!accentTx) continue;
          const s = new Sprite(accentTx);
          s.tint = 0x999999;
          s.x = Math.random() * ROOM_WIDTH;
          s.y = Math.random() * ROOM_HEIGHT;
          s.alpha = 0.3 + Math.random() * 0.4;
          accentContainer.addChild(s);
        }
        this.container.addChild(accentContainer);
      }
    } else {
      const floor = new Graphics().beginFill(this.biomeData.floorColor).drawRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT).endFill();
      this.container.addChild(floor);

      const scatter = new Graphics();
      for (let i = 0; i < 200; i++) {
        const sx = Math.random() * ROOM_WIDTH;
        const sy = Math.random() * ROOM_HEIGHT;
        const shade = Math.random() < 0.5 ? 0.05 : -0.05;
        const r = ((this.biomeData.floorColor >> 16) & 0xff) + Math.round(shade * 255);
        const g = ((this.biomeData.floorColor >> 8) & 0xff) + Math.round(shade * 255);
        const b = (this.biomeData.floorColor & 0xff) + Math.round(shade * 255);
        const c = Math.min(255, Math.max(0, r)) << 16 | Math.min(255, Math.max(0, g)) << 8 | Math.min(255, Math.max(0, b));
        scatter.beginFill(c, 0.4);
        scatter.drawRect(sx, sy, 6 + Math.random() * 8, 6 + Math.random() * 6);
        scatter.endFill();
      }
      this.container.addChild(scatter);
    }

    this.walls.push({ x: 0, y: 0, width: ROOM_WIDTH, height: WALL_THICKNESS });
    this.walls.push({ x: 0, y: ROOM_HEIGHT - WALL_THICKNESS, width: ROOM_WIDTH, height: WALL_THICKNESS });
    this.walls.push({ x: 0, y: 0, width: WALL_THICKNESS, height: ROOM_HEIGHT });
    this.walls.push({ x: ROOM_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ROOM_HEIGHT });

    const wallTx = tc ? tileTextures[tc.wallTile] : undefined;

    if (wallTx && tc) {
      const wallRects = this.walls;
      for (const wall of wallRects) {
        const ws = new TilingSprite(wallTx, wall.width, wall.height);
        ws.x = wall.x;
        ws.y = wall.y;
        this.container.addChild(ws);
      }

      if (tc.wallTrimColor !== undefined) {
        const trim = new Graphics();
        trim.lineStyle(2, tc.wallTrimColor, tc.wallTrimAlpha ?? 0.6);
        trim.drawRect(WALL_THICKNESS, WALL_THICKNESS, ROOM_WIDTH - WALL_THICKNESS * 2, ROOM_HEIGHT - WALL_THICKNESS * 2);
        this.container.addChild(trim);
      }
    } else {
      const wallGfx = new Graphics();
      wallGfx.beginFill(this.biomeData.wallColor);
      for (const wall of this.walls) {
        wallGfx.drawRect(wall.x, wall.y, wall.width, wall.height);
      }
      wallGfx.endFill();

      const wallBorder = new Graphics();
      wallBorder.lineStyle(1, this.biomeData.wallBorderColor);
      for (const wall of this.walls) {
        wallBorder.drawRect(wall.x, wall.y, wall.width, wall.height);
      }

      this.container.addChild(wallGfx, wallBorder);
    }

    this.renderRoad();
    this.renderDecorations();
    this.renderBuildings();
    this.renderNpcs();
    this.renderDoors();
    this.renderPortals();
  }

  private renderDoors() {
    for (const door of this.doors) {
      const g = new Graphics();
      const x = door.rect.x;
      const y = door.rect.y;
      const w = door.rect.width;
      const h = door.rect.height;
      const pillarW = 28;
      const archH = 40;

      // 1. Dark opening (transition zone)
      g.beginFill(0x000000, 0.6);
      g.drawRect(x, y, w, h);
      g.endFill();

      // 2. Stone pillars with block grid
      const stoneBase = 0x8a8a8a;
      const stoneDark = 0x7a7a7a;
      const stoneLight = 0x9a9a9a;
      const mortar = 0x6a6a6a;
      const moss = 0x3a7a2a;
      const mossLight = 0x4a8a3a;
      const vine = 0x2a6a1a;
      const leaf = 0x3a8a2a;

      const drawPillar = (px: number) => {
        g.beginFill(stoneBase);
        g.drawRect(px, y, pillarW, h);
        g.endFill();
        g.beginFill(stoneLight);
        g.drawRect(px + 2, y, 3, h);
        g.endFill();
        g.beginFill(stoneDark);
        g.drawRect(px + pillarW - 3, y, 3, h);
        g.endFill();
        g.lineStyle(1, mortar, 0.5);
        for (let ly = y + 14; ly < y + h; ly += 14) {
          g.moveTo(px, ly);
          g.lineTo(px + pillarW, ly);
        }
        g.lineStyle(1, mortar, 0.4);
        for (let ly = y; ly < y + h; ly += 28) {
          const splitX = (Math.floor(ly / 14) % 2 === 0) ? 12 : 16;
          g.moveTo(px + splitX, ly);
          g.lineTo(px + splitX, Math.min(ly + 14, y + h));
        }
      };

      drawPillar(x - pillarW);
      drawPillar(x + w);

      // 3. Stepped arch top
      const totalArchW = w + pillarW * 2;
      const archLeft = x - pillarW;
      const steps = 6;
      const stepW = totalArchW / (steps * 2);
      const stepH = archH / steps;
      for (let i = 0; i < steps; i++) {
        const stepTop = y - archH + i * stepH;
        const stepBottom = stepTop + stepH;
        const leftStart = archLeft + i * stepW;
        const leftEnd = archLeft + (i + 1) * stepW;
        g.beginFill(stoneBase);
        g.drawRect(leftStart, stepTop, leftEnd - leftStart, stepBottom - stepTop);
        g.endFill();
        const rightStart = archLeft + totalArchW - (i + 1) * stepW;
        const rightEnd = archLeft + totalArchW - i * stepW;
        g.beginFill(stoneBase);
        g.drawRect(rightStart, stepTop, rightEnd - rightStart, stepBottom - stepTop);
        g.endFill();
      }
      g.beginFill(stoneBase);
      g.drawRect(archLeft + steps * stepW, y - archH, stepW * 2, stepH);
      g.endFill();
      g.beginFill(stoneDark);
      g.drawRect(x, y - 4, w, 4);
      g.endFill();
      g.lineStyle(1, mortar, 0.5);
      for (let ly = y - archH + 8; ly < y; ly += 8) {
        g.moveTo(archLeft, ly);
        g.lineTo(archLeft + totalArchW, ly);
      }

      // 4. Moss patches
      const seed = Math.abs(x * 7 + y * 13 + w * 3) + 1;
      const rngVal = (i: number) => {
        const s = (seed + i) * 9301 + 49297;
        return (s % 233280) / 233280;
      };
      const drawMossBlob = (mx: number, my: number, size: number) => {
        g.beginFill(rngVal(Math.round(mx + my)) > 0.5 ? moss : mossLight);
        for (let dx = -size; dx <= size; dx += 4) {
          for (let dy = -size; dy <= size; dy += 4) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < size && rngVal(Math.round(mx + dx + my + dy)) > 0.3) {
              g.drawRect(mx + dx, my + dy, 4, 4);
            }
          }
        }
        g.endFill();
      };
      const mossPositions = [
        { mx: x - pillarW, my: y + h - 6, size: 10 },
        { mx: x + w, my: y + h - 8, size: 8 },
        { mx: x - pillarW + 4, my: y + 30, size: 6 },
        { mx: x - pillarW, my: y - archH + 6, size: 8 },
        { mx: x + w + pillarW - 4, my: y - archH + 10, size: 6 },
      ];
      for (const mp of mossPositions) {
        drawMossBlob(mp.mx, mp.my, mp.size);
      }

      // 5. Hanging vines
      const vineCount = 3 + Math.floor(rngVal(1) * 3);
      for (let vi = 0; vi < vineCount; vi++) {
        const vx = archLeft + 20 + Math.floor(rngVal(2 + vi) * (totalArchW - 40));
        const vineLen = 20 + Math.floor(rngVal(10 + vi) * 20);
        g.lineStyle(2, vine, 0.8);
        g.moveTo(vx, y - archH);
        g.lineTo(vx, y - archH + vineLen);
        const leafCount = 1 + Math.floor(rngVal(20 + vi) * 2);
        for (let li = 0; li < leafCount; li++) {
          const lyOffset = 6 + Math.floor(rngVal(30 + vi + li) * (vineLen - 10));
          const lxOffset = rngVal(40 + vi + li) > 0.5 ? -4 : 4;
          g.beginFill(leaf);
          g.drawRect(vx + lxOffset, y - archH + lyOffset, 3, 3);
          g.endFill();
        }
      }

      // 6. Arch top outer border
      g.lineStyle(1, stoneDark, 0.6);
      g.moveTo(x - pillarW, y + h);
      g.lineTo(x - pillarW, y);
      for (let i = 0; i < steps; i++) {
        const stepTop = y - archH + i * stepH;
        const lx = archLeft + i * stepW;
        g.lineTo(lx, stepTop);
      }
      g.lineTo(archLeft + steps * stepW, y - archH);
      g.lineTo(archLeft + (steps + 1) * stepW, y - archH);
      for (let i = steps - 1; i >= 0; i--) {
        const stepTop = y - archH + i * stepH;
        const rx = archLeft + totalArchW - i * stepW;
        g.lineTo(rx, stepTop);
      }
      g.lineTo(x + w + pillarW, y);
      g.lineTo(x + w + pillarW, y + h);

      this.container.addChild(g);

      // 7. Label
      const cx = x + w / 2;
      const labelText = door.targetZone === 'hub' ? 'Enter Town' : '\u25B6 Exit ' + door.targetZone;
      const label = new Text(labelText, new TextStyle({
        fontFamily: 'monospace', fontSize: 14, fill: '#ffff88',
      }));
      label.anchor.set(0.5, 1);
      label.x = cx;
      label.y = y - archH - 6;
      this.container.addChild(label);
    }
  }

  private renderPortals() {
    for (const portal of this.portals) {
      const cx = portal.rect.x + portal.rect.width / 2;
      const cy = portal.rect.y + portal.rect.height / 2;
      const r = Math.min(portal.rect.width, portal.rect.height) / 2 - 4;
      // Static ring background
      const g = new Graphics();
      g.lineStyle(2, 0xaa66ff, 0.5);
      g.drawCircle(cx, cy, r);
      g.lineStyle(1, 0xcc88ff, 0.3);
      g.drawCircle(cx, cy, r * 0.6);
      this.container.addChild(g);
      // Label
      const label = new Text(portal.label, { fontFamily: 'monospace', fontSize: 13, fill: 0xcc88ff });
      label.anchor.set(0.5, 0);
      label.x = cx;
      label.y = cy + r + 6;
      this.container.addChild(label);
      // Locked portal overlay
      if (!this.isPortalUnlocked(portal.targetZone)) {
        g.lineStyle(3, 0x5a3a2a);
        const chainStartX = cx - 20;
        const chainEndX = cx + 20;
        g.moveTo(chainStartX, cy - r);
        g.lineTo(chainStartX - 8, cy - r - 16);
        g.moveTo(chainEndX, cy - r);
        g.lineTo(chainEndX + 8, cy - r - 16);
        g.lineStyle(2, 0x886644);
        g.drawRect(cx - 6, cy - r - 20, 12, 10);
        g.beginFill(0x443322);
        g.drawRect(cx - 2, cy - r - 18, 4, 4);
        g.endFill();
        const lockLabel = new Text('Locked', {
          fontFamily: 'monospace', fontSize: 11, fill: '#666677',
        });
        lockLabel.anchor.set(0.5);
        lockLabel.x = cx;
        lockLabel.y = cy + r + 28;
        this.container.addChild(lockLabel);
      }
    }
  }

  private renderDecorations() {
    const d = this.biomeData;
    const g = new Graphics();
    for (const dec of this.decorations) {
      const cx = dec.x + dec.width / 2;
      const cy = dec.y + dec.height / 2;
      const r = Math.min(dec.width, dec.height) / 2;
      if (Math.random() < 0.5) {
        g.beginFill(d.decorColor, 0.7);
        g.drawCircle(cx, cy, r);
        g.endFill();
      } else {
        g.beginFill(d.decorColorB, 0.6);
        g.drawRoundedRect(dec.x, dec.y, dec.width, dec.height, 3);
        g.endFill();
      }
    }
    this.container.addChild(g);
  }

  private renderBuildings() {
    for (const b of this.buildings) {
      const g = new Graphics();
      // Main body
      g.beginFill(b.wallColor);
      g.drawRect(b.x, b.y, b.width, b.height);
      g.endFill();
      // Roof (triangle)
      g.beginFill(b.roofColor);
      g.moveTo(b.x - 8, b.y);
      g.lineTo(b.x + b.width / 2, b.y - 40);
      g.lineTo(b.x + b.width + 8, b.y);
      g.closePath();
      g.endFill();
      // Door
      g.beginFill(0x3a2a1a);
      g.drawRect(b.x + b.width / 2 - 12, b.y + b.height - 36, 24, 36);
      g.endFill();
      // Windows
      g.beginFill(0x88ccff, 0.6);
      g.drawRect(b.x + 12, b.y + 20, 20, 20);
      g.drawRect(b.x + b.width - 32, b.y + 20, 20, 20);
      g.endFill();
      this.container.addChild(g);
      // Label
      const label = new Text(b.label, { fontFamily: 'monospace', fontSize: 14, fill: 0xffffff });
      label.anchor.set(0.5, 1);
      label.x = b.x + b.width / 2;
      label.y = b.y - 44;
      this.container.addChild(label);
    }
  }

  private renderNpcs() {
    for (const npc of this.npcs) {
      const cx = npc.x;
      const cy = npc.y;
      const label = new Text(npc.label, { fontFamily: 'monospace', fontSize: 12, fill: 0xffff88 });
      label.anchor.set(0.5, 0);
      label.x = cx;
      label.y = cy + 16;
      this.container.addChild(label);
    }
  }

  private renderRoad() {
    if (!this.playerStart || this.doors.length === 0) return;

    for (const door of this.doors) {
      const doorCx = door.rect.x + door.rect.width / 2;
      const doorCy = door.rect.y + door.rect.height / 2;
      const sx = this.playerStart.x;
      const sy = this.playerStart.y;

      const dx = doorCx - sx;
      const dy = doorCy - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;

      const nx = -dy / dist;
      const ny = dx / dist;

      const g = new Graphics();

      // Stone path: 2 tiles wide (64px), placed every 32px along the path
      const totalTiles = Math.floor(dist / 32);
      const fadeInTiles = 6;

      for (let i = 0; i <= totalTiles; i++) {
        const t = i / totalTiles;
        const px = sx + dx * t;
        const py = sy + dy * t;

        // Left tile position
        const lx = px + nx * 16 - 16;
        const ly = py + ny * 16 - 16;
        // Right tile position
        const rx = px - nx * 16 - 16;
        const ry = py - ny * 16 - 16;

        // Fade in: gradually transition from scattered edge stones to full path
        if (i < fadeInTiles) {
          const fade = i / fadeInTiles;
          // Scatter individual fragments at the start
          if (Math.random() < fade) { this.drawStoneTile(g, lx, ly, fade * 0.6 + 0.4); }
          if (Math.random() < fade) { this.drawStoneTile(g, rx, ry, fade * 0.6 + 0.4); }
          // Extra scattered stones at edges for a natural look
          if (Math.random() < fade * 0.5) {
            const ex = px + nx * (16 + Math.random() * 20) - 12 + Math.random() * 8;
            const ey = py + ny * (16 + Math.random() * 20) - 12 + Math.random() * 8;
            this.drawStoneTile(g, ex, ey, fade * 0.3);
          }
          if (Math.random() < fade * 0.5) {
            const ex = px - nx * (16 + Math.random() * 20) - 12 + Math.random() * 8;
            const ey = py - ny * (16 + Math.random() * 20) - 12 + Math.random() * 8;
            this.drawStoneTile(g, ex, ey, fade * 0.3);
          }
        } else {
          // Full road
          this.drawStoneTile(g, lx, ly, 1);
          this.drawStoneTile(g, rx, ry, 1);

          // Occasional edge stone fragments along the sides
          if (Math.random() < 0.15) {
            const ex = px + nx * (16 + 8 + Math.random() * 12) - 10;
            const ey = py + ny * (16 + 8 + Math.random() * 12) - 10;
            this.drawStoneTile(g, ex, ey, 0.3 + Math.random() * 0.2);
          }
          if (Math.random() < 0.15) {
            const ex = px - nx * (16 + 8 + Math.random() * 12) - 10;
            const ey = py - ny * (16 + 8 + Math.random() * 12) - 10;
            this.drawStoneTile(g, ex, ey, 0.3 + Math.random() * 0.2);
          }
        }
      }

      this.container.addChild(g);
    }
  }

  private drawStoneTile(g: Graphics, x: number, y: number, alpha: number) {
    if (alpha <= 0) return;
    g.beginFill(0x7a7a6a, alpha);
    g.drawRect(x, y, 32, 32);
    g.endFill();
    g.beginFill(0x6a6a5a, alpha);
    g.drawRect(x + 2, y + 2, 12, 14);
    g.drawRect(x + 18, y + 4, 10, 10);
    g.drawRect(x + 4, y + 20, 20, 8);
    g.drawRect(x + 26, y + 16, 4, 14);
    g.endFill();
    g.lineStyle(1, 0x5a5a4a, alpha * 0.8);
    g.drawRect(x, y, 32, 32);
    g.lineStyle(0);
    g.beginFill(0x8a8a7a, alpha * 0.6);
    g.drawRect(x + 1, y + 1, 6, 6);
    g.drawRect(x + 16, y + 16, 6, 6);
    g.endFill();
  }
}
