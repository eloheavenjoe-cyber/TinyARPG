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
    decorationRects: t.decorationRects.map(d => ({ ...d })),
  };
}

export const TEMPLATE_OPEN: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [],
  spawnZones: [{ x: WALL_T + 50, y: WALL_T + 50, width: ROOM_WIDTH - WALL_T * 2 - 100, height: ROOM_HEIGHT - WALL_T * 2 - 100 }],
  decorationRects: [],
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
  decorationRects: [],
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
  decorationRects: [],
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
  decorationRects: [],
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
  decorationRects: [],
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
  decorationRects: [
    { x: 200, y: 200, width: 14, height: 14 },
    { x: 1400, y: 200, width: 12, height: 12 },
    { x: 300, y: 600, width: 16, height: 16 },
    { x: 1300, y: 600, width: 10, height: 10 },
    { x: 500, y: 300, width: 12, height: 12 },
    { x: 1100, y: 300, width: 14, height: 14 },
    { x: 400, y: 750, width: 10, height: 10 },
    { x: 1200, y: 750, width: 12, height: 12 },
  ],
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
  decorationRects: [],
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
  decorationRects: [],
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
  decorationRects: [],
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
  decorationRects: [],
  playerStart: { x: 800, y: 448 },
};

// --- Forest zone templates (3 rooms) ---
export const TEMPLATE_FOREST_1: RoomTemplate = {
  walls: [],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'forest', targetRoom: 1 }],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  decorationRects: [
    { x: 200, y: 150, width: 20, height: 20 },
    { x: 400, y: 300, width: 16, height: 16 },
    { x: 600, y: 600, width: 18, height: 18 },
    { x: 1000, y: 200, width: 14, height: 14 },
    { x: 1200, y: 500, width: 20, height: 20 },
    { x: 300, y: 700, width: 12, height: 12 },
    { x: 1300, y: 700, width: 16, height: 16 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_FOREST_2: RoomTemplate = {
  walls: [
    { x: 680, y: 340, width: 40, height: 40 },
    { x: 880, y: 340, width: 40, height: 40 },
    { x: 680, y: 516, width: 40, height: 40 },
    { x: 880, y: 516, width: 40, height: 40 },
  ],
  doors: [{ rect: { x: 750, y: 0, width: 100, height: 36 }, targetZone: 'forest', targetRoom: 2 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 550, height: 200 },
    { x: 900, y: 64, width: 600, height: 200 },
    { x: 64, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  decorationRects: [
    { x: 200, y: 150, width: 18, height: 18 },
    { x: 1200, y: 150, width: 16, height: 16 },
    { x: 300, y: 600, width: 14, height: 14 },
    { x: 1100, y: 650, width: 20, height: 20 },
    { x: 100, y: 400, width: 12, height: 12 },
    { x: 1500, y: 300, width: 16, height: 16 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_FOREST_3: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 600, height: 40 },
    { x: 600, y: 200, width: 40, height: 240 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 500, height: 300 },
    { x: 700, y: 64, width: 800, height: 100 },
    { x: 700, y: 480, width: 800, height: 350 },
    { x: 64, y: 480, width: 500, height: 350 },
  ],
  decorationRects: [
    { x: 300, y: 150, width: 20, height: 20 },
    { x: 800, y: 100, width: 14, height: 14 },
    { x: 150, y: 600, width: 16, height: 16 },
    { x: 900, y: 600, width: 18, height: 18 },
    { x: 1200, y: 300, width: 12, height: 12 },
  ],
  playerStart: { x: 800, y: 448 },
};

// --- Desert zone templates (4 rooms) ---
export const TEMPLATE_DESERT_1: RoomTemplate = {
  walls: [
    { x: 750, y: 0, width: 40, height: 400 },
    { x: 810, y: 440, width: 40, height: 456 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 50, height: 36 }, targetZone: 'desert', targetRoom: 1 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 600, height: 300 },
    { x: 900, y: 64, width: 600, height: 300 },
    { x: 64, y: 480, width: 600, height: 350 },
    { x: 900, y: 480, width: 600, height: 350 },
  ],
  decorationRects: [
    { x: 200, y: 150, width: 22, height: 14 },
    { x: 500, y: 250, width: 18, height: 12 },
    { x: 1000, y: 180, width: 10, height: 24 },
    { x: 1300, y: 500, width: 20, height: 16 },
    { x: 300, y: 650, width: 12, height: 28 },
    { x: 1100, y: 700, width: 16, height: 12 },
    { x: 100, y: 500, width: 14, height: 10 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_DESERT_2: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 750, height: 40 },
    { x: 858, y: 400, width: 742, height: 40 },
    { x: 750, y: 0, width: 28, height: 400 },
    { x: 778, y: 440, width: 32, height: 456 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'desert', targetRoom: 2 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 600, height: 300 },
    { x: 900, y: 64, width: 600, height: 300 },
    { x: 64, y: 480, width: 600, height: 350 },
    { x: 900, y: 480, width: 600, height: 350 },
  ],
  decorationRects: [
    { x: 150, y: 150, width: 16, height: 12 },
    { x: 400, y: 200, width: 10, height: 22 },
    { x: 1100, y: 180, width: 20, height: 14 },
    { x: 1400, y: 600, width: 18, height: 12 },
    { x: 200, y: 650, width: 12, height: 26 },
    { x: 1300, y: 300, width: 14, height: 10 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_DESERT_3: RoomTemplate = {
  walls: [
    { x: 680, y: 340, width: 40, height: 40 },
    { x: 880, y: 340, width: 40, height: 40 },
    { x: 680, y: 516, width: 40, height: 40 },
    { x: 880, y: 516, width: 40, height: 40 },
  ],
  doors: [{ rect: { x: 750, y: 0, width: 100, height: 36 }, targetZone: 'desert', targetRoom: 3 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 550, height: 200 },
    { x: 900, y: 64, width: 600, height: 200 },
    { x: 64, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  decorationRects: [
    { x: 200, y: 150, width: 20, height: 14 },
    { x: 1300, y: 150, width: 10, height: 24 },
    { x: 400, y: 650, width: 16, height: 12 },
    { x: 1100, y: 650, width: 22, height: 16 },
    { x: 100, y: 400, width: 12, height: 10 },
    { x: 1500, y: 300, width: 14, height: 28 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_DESERT_4: RoomTemplate = {
  walls: [],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  decorationRects: [
    { x: 300, y: 200, width: 18, height: 12 },
    { x: 600, y: 400, width: 10, height: 22 },
    { x: 1000, y: 300, width: 20, height: 14 },
    { x: 1300, y: 650, width: 16, height: 12 },
    { x: 200, y: 700, width: 14, height: 10 },
    { x: 800, y: 600, width: 12, height: 26 },
  ],
  playerStart: { x: 800, y: 448 },
};

// --- Ice zone templates (5 rooms) ---
export const TEMPLATE_ICE_1: RoomTemplate = {
  walls: [],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'ice', targetRoom: 1 }],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  decorationRects: [
    { x: 200, y: 150, width: 16, height: 16 },
    { x: 500, y: 350, width: 20, height: 20 },
    { x: 1000, y: 200, width: 14, height: 14 },
    { x: 1300, y: 600, width: 22, height: 22 },
    { x: 300, y: 700, width: 18, height: 18 },
    { x: 1200, y: 450, width: 12, height: 12 },
    { x: 600, y: 650, width: 16, height: 16 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_ICE_2: RoomTemplate = {
  walls: [
    { x: 680, y: 340, width: 40, height: 40 },
    { x: 880, y: 340, width: 40, height: 40 },
    { x: 680, y: 516, width: 40, height: 40 },
    { x: 880, y: 516, width: 40, height: 40 },
  ],
  doors: [{ rect: { x: 750, y: 0, width: 100, height: 36 }, targetZone: 'ice', targetRoom: 2 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 550, height: 200 },
    { x: 900, y: 64, width: 600, height: 200 },
    { x: 64, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  decorationRects: [
    { x: 200, y: 150, width: 18, height: 18 },
    { x: 1300, y: 150, width: 14, height: 14 },
    { x: 400, y: 600, width: 20, height: 20 },
    { x: 1100, y: 650, width: 16, height: 16 },
    { x: 100, y: 450, width: 12, height: 12 },
    { x: 1500, y: 350, width: 22, height: 22 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_ICE_3: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 600, height: 40 },
    { x: 600, y: 200, width: 40, height: 240 },
  ],
  doors: [{ rect: { x: 1520, y: 400, width: 36, height: 80 }, targetZone: 'ice', targetRoom: 3 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 500, height: 300 },
    { x: 700, y: 64, width: 800, height: 100 },
    { x: 700, y: 480, width: 800, height: 350 },
    { x: 64, y: 480, width: 500, height: 350 },
  ],
  decorationRects: [
    { x: 300, y: 150, width: 20, height: 20 },
    { x: 800, y: 100, width: 14, height: 14 },
    { x: 150, y: 600, width: 18, height: 18 },
    { x: 900, y: 650, width: 16, height: 16 },
    { x: 1200, y: 300, width: 22, height: 22 },
    { x: 500, y: 500, width: 12, height: 12 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_ICE_4: RoomTemplate = {
  walls: [
    { x: 750, y: 0, width: 28, height: 400 },
    { x: 778, y: 440, width: 32, height: 456 },
  ],
  doors: [{ rect: { x: 740, y: 828, width: 30, height: 36 }, targetZone: 'ice', targetRoom: 4 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 650, height: 300 },
    { x: 850, y: 64, width: 650, height: 300 },
    { x: 64, y: 480, width: 650, height: 350 },
    { x: 850, y: 480, width: 650, height: 350 },
  ],
  decorationRects: [
    { x: 200, y: 200, width: 16, height: 16 },
    { x: 1200, y: 200, width: 20, height: 20 },
    { x: 400, y: 650, width: 14, height: 14 },
    { x: 1000, y: 600, width: 18, height: 18 },
    { x: 1500, y: 500, width: 12, height: 12 },
    { x: 100, y: 700, width: 22, height: 22 },
  ],
  playerStart: { x: 800, y: 448 },
};

export const TEMPLATE_ICE_5: RoomTemplate = {
  walls: [
    { x: 680, y: 340, width: 40, height: 40 },
    { x: 880, y: 340, width: 40, height: 40 },
    { x: 680, y: 516, width: 40, height: 40 },
    { x: 880, y: 516, width: 40, height: 40 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [],
  spawnZones: [
    { x: 64, y: 64, width: 550, height: 200 },
    { x: 900, y: 64, width: 600, height: 200 },
    { x: 64, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  decorationRects: [
    { x: 200, y: 150, width: 18, height: 18 },
    { x: 1300, y: 150, width: 14, height: 14 },
    { x: 400, y: 650, width: 20, height: 20 },
    { x: 1100, y: 650, width: 16, height: 16 },
    { x: 100, y: 400, width: 22, height: 22 },
    { x: 1500, y: 400, width: 12, height: 12 },
  ],
  playerStart: { x: 800, y: 448 },
};
