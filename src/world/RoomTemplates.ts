import type { RoomTemplate } from '../core/ZoneConfig';
import { ROOM_WIDTH, ROOM_HEIGHT } from './Room';

const WALL_T = 32;

export function cloneTemplate(t: RoomTemplate): RoomTemplate {
  return {
    walls: t.walls.map(w => ({ ...w })),
    doors: t.doors.map(d => ({ ...d, rect: { ...d.rect } })),
    portals: t.portals.map(p => ({ ...p, rect: { ...p.rect } })),
    spawnZones: t.spawnZones.map(s => ({ ...s })),
    playerStart: { ...t.playerStart },
  };
}

export const TEMPLATE_OPEN: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [],
  spawnZones: [{ x: WALL_T + 50, y: WALL_T + 50, width: ROOM_WIDTH - WALL_T * 2 - 100, height: ROOM_HEIGHT - WALL_T * 2 - 100 }],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_PILLARS: RoomTemplate = {
  walls: [
    { x: 680, y: 340, width: 40, height: 40 },
    { x: 880, y: 340, width: 40, height: 40 },
    { x: 680, y: 516, width: 40, height: 40 },
    { x: 880, y: 516, width: 40, height: 40 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 400, height: 200 },
    { x: 1100, y: WALL_T + 50, width: 400, height: 200 },
    { x: WALL_T + 50, y: 500, width: 400, height: 300 },
    { x: 1100, y: 500, width: 400, height: 300 },
  ],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_L_SHAPE: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 600, height: 40 },
    { x: 600, y: 200, width: 40, height: 240 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 500, height: 300 },
    { x: 700, y: WALL_T + 50, width: 800, height: 100 },
    { x: 700, y: 480, width: 800, height: 350 },
    { x: WALL_T + 50, y: 480, width: 500, height: 350 },
  ],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_CROSS: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 750, height: 40 },
    { x: 858, y: 400, width: 742, height: 40 },
    { x: 750, y: 0, width: 40, height: 400 },
    { x: 818, y: 440, width: 40, height: 456 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 600, height: 300 },
    { x: 900, y: WALL_T + 50, width: 600, height: 300 },
    { x: WALL_T + 50, y: 480, width: 600, height: 350 },
    { x: 900, y: 480, width: 600, height: 350 },
  ],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_RING: RoomTemplate = {
  walls: [
    { x: 700, y: 300, width: 200, height: 40 },
    { x: 700, y: 556, width: 200, height: 40 },
    { x: 700, y: 300, width: 40, height: 296 },
    { x: 860, y: 300, width: 40, height: 296 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 550, height: 200 },
    { x: 900, y: WALL_T + 50, width: 600, height: 200 },
    { x: WALL_T + 50, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// Hub — town with portal positions
export const TEMPLATE_HUB: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [
    { rect: { x: 50, y: 80, width: 80, height: 80 }, targetZone: 'tutorial', label: 'Tutorial' },
    { rect: { x: 1470, y: 80, width: 80, height: 80 }, targetZone: 'endless_arena', label: 'Endless Arena' },
    { rect: { x: 50, y: 400, width: 80, height: 80 }, targetZone: 'forest', label: 'Verdant Forest' },
    { rect: { x: 1470, y: 400, width: 80, height: 80 }, targetZone: 'desert', label: 'Scorched Desert' },
    { rect: { x: 50, y: 720, width: 80, height: 80 }, targetZone: 'ice', label: 'Frozen Wastes' },
    { rect: { x: 1470, y: 720, width: 80, height: 80 }, targetZone: 'endless_dungeon', label: 'Endless Dungeon' },
  ],
  spawnZones: [],
  playerStart: { x: 800, y: 448 },
};

// Tutorial — exit door to hub
export const TEMPLATE_TUTORIAL: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 },
  ],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};

// Arena — open room with exit portal
export const TEMPLATE_ARENA: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [
    { rect: { x: 1500, y: 32, width: 80, height: 50 }, targetZone: 'hub', label: 'Exit' },
  ],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};

// Dungeon room — exit door to next room, exit portal to hub
export const TEMPLATE_DUNGEON: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'endless_dungeon', targetRoom: -1 },
  ],
  portals: [
    { rect: { x: 1500, y: 32, width: 80, height: 50 }, targetZone: 'hub', label: 'Exit' },
  ],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};

// Dev room — exit door to hub
export const TEMPLATE_DEV: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 },
  ],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};
