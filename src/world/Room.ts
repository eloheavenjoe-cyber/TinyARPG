import { Container, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

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

  constructor() {
    this.container = new Container();
    this.walkableArea = {
      x: WALL_THICKNESS,
      y: WALL_THICKNESS,
      width: ROOM_WIDTH - WALL_THICKNESS * 2,
      height: ROOM_HEIGHT - WALL_THICKNESS * 2,
    };
    this.build();
    Logger.log('system', `Room created: ${ROOM_WIDTH}x${ROOM_HEIGHT}, walkable: ${this.walkableArea.width}x${this.walkableArea.height}`);
  }

  private build() {
    const tilesX = Math.ceil(ROOM_WIDTH / TILE_SIZE);
    const tilesY = Math.ceil(ROOM_HEIGHT / TILE_SIZE);

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const tile = new Graphics().beginFill(
          (tx + ty) % 2 === 0 ? 0x3a3a3a : 0x404040
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
    wallGfx.beginFill(0x4a4a5a);
    for (const wall of this.walls) {
      wallGfx.drawRect(wall.x, wall.y, wall.width, wall.height);
    }
    wallGfx.endFill();

    const wallBorder = new Graphics();
    wallBorder.lineStyle(1, 0x5a5a6a);
    for (const wall of this.walls) {
      wallBorder.drawRect(wall.x, wall.y, wall.width, wall.height);
    }

    this.container.addChild(wallGfx, wallBorder);
  }
}
