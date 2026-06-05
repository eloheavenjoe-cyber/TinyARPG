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

  constructor(biome: BiomeId = 'dev', doors: DoorMarker[] = [], portals: PortalMarker[] = [], decorations: Rect[] = [], buildings: BuildingData[] = [], npcs: NpcData[] = [], isPortalUnlocked?: (targetZone: string) => boolean) {
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
    this.build();
    Logger.log('system', `Room created: ${ROOM_WIDTH}x${ROOM_HEIGHT}, walkable: ${this.walkableArea.width}x${this.walkableArea.height}`);
  }

  private build() {
    const tc = TILE_CONFIGS[this.biomeId];
    const floorTx = tc ? tileTextures[tc.floorTile] : undefined;

    if (floorTx && tc) {
      const floor = new TilingSprite(floorTx, ROOM_WIDTH, ROOM_HEIGHT);
      this.container.addChild(floor);

      if (tc.accentTiles && tc.accentTiles.tiles.length > 0) {
        const accentContainer = new Container();
        for (let i = 0; i < 200; i++) {
          const tileName = tc.accentTiles.tiles[Math.floor(Math.random() * tc.accentTiles.tiles.length)];
          const accentTx = tileTextures[tileName];
          if (!accentTx) continue;
          const s = new Sprite(accentTx);
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

    this.renderDecorations();
    this.renderBuildings();
    this.renderNpcs();
    this.renderDoors();
    this.renderPortals();
  }

  private renderDoors() {
    for (const door of this.doors) {
      const g = new Graphics();
      g.beginFill(0x000000, 0.6);
      g.drawRect(door.rect.x, door.rect.y, door.rect.width, door.rect.height);
      g.endFill();
      g.lineStyle(2, 0xffff44, 0.9);
      g.drawRect(door.rect.x, door.rect.y, door.rect.width, door.rect.height);
      this.container.addChild(g);

      // Label
      const cx = door.rect.x + door.rect.width / 2;
      const label = new Text('▶ Exit ' + (door.targetZone !== 'hub' ? door.targetZone : 'Town'), {
        fontFamily: 'monospace', fontSize: 14, fill: '#ffff88',
      });
      label.anchor.set(0.5, 1);
      label.x = cx;
      label.y = door.rect.y - 8;
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
}
