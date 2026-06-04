import { Container, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';
import { BiomeData, BIOME_DATA, BiomeId, DoorMarker, PortalMarker } from '../core/ZoneConfig';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ROOM_WIDTH = 1600;
export const ROOM_HEIGHT = 896;
const TILE_SIZE = 32;
const WALL_THICKNESS = 32;

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
  doors: DoorMarker[];
  portals: PortalMarker[];

  constructor(biome: BiomeId = 'dev', doors: DoorMarker[] = [], portals: PortalMarker[] = []) {
    this.container = new Container();
    this.walkableArea = {
      x: WALL_THICKNESS,
      y: WALL_THICKNESS,
      width: ROOM_WIDTH - WALL_THICKNESS * 2,
      height: ROOM_HEIGHT - WALL_THICKNESS * 2,
    };
    this.biomeData = BIOME_DATA[biome];
    this.doors = doors;
    this.portals = portals;
    this.build();
    Logger.log('system', `Room created: ${ROOM_WIDTH}x${ROOM_HEIGHT}, walkable: ${this.walkableArea.width}x${this.walkableArea.height}`);
  }

  private build() {
    const tilesX = Math.ceil(ROOM_WIDTH / TILE_SIZE);
    const tilesY = Math.ceil(ROOM_HEIGHT / TILE_SIZE);

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const tile = new Graphics().beginFill(
          (tx + ty) % 2 === 0 ? this.biomeData.floorColorA : this.biomeData.floorColorB
        ).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill();
        tile.x = tx * TILE_SIZE;
        tile.y = ty * TILE_SIZE;
        this.container.addChild(tile);
      }
    }

    this.walls.push({ x: 0, y: 0, width: ROOM_WIDTH, height: WALL_THICKNESS });
    this.walls.push({ x: 0, y: ROOM_HEIGHT - WALL_THICKNESS, width: ROOM_WIDTH, height: WALL_THICKNESS });
    this.walls.push({ x: 0, y: 0, width: WALL_THICKNESS, height: ROOM_HEIGHT });
    this.walls.push({ x: ROOM_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ROOM_HEIGHT });

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

    this.renderDoors();
    this.renderPortals();
  }

  private renderDoors() {
    for (const door of this.doors) {
      const g = new Graphics();
      g.beginFill(0x000000, 0.6);
      g.drawRect(door.rect.x, door.rect.y, door.rect.width, door.rect.height);
      g.endFill();
      g.lineStyle(2, 0x888888, 0.8);
      g.drawRect(door.rect.x, door.rect.y, door.rect.width, door.rect.height);
      this.container.addChild(g);
    }
  }

  private renderPortals() {
    for (const portal of this.portals) {
      const g = new Graphics();
      const cx = portal.rect.x + portal.rect.width / 2;
      const cy = portal.rect.y + portal.rect.height / 2;
      const r = Math.min(portal.rect.width, portal.rect.height) / 2;
      g.beginFill(0x8844ff, 0.3);
      g.drawCircle(cx, cy, r);
      g.endFill();
      g.lineStyle(2, 0xaa66ff, 0.8);
      g.drawCircle(cx, cy, r);
      g.lineStyle(1, 0xcc88ff, 0.5);
      g.drawCircle(cx, cy, r * 0.6);
      this.container.addChild(g);
    }
  }
}
