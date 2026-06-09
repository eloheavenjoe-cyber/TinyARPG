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
    buildings: t.buildings.map(b => ({ ...b })),
    cabins: t.cabins.map(c => ({ ...c })),
    npcs: t.npcs.map(n => ({ ...n })),
  };
}

export const TEMPLATE_OPEN: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [],
  spawnZones: [{ x: WALL_T + 50, y: WALL_T + 50, width: ROOM_WIDTH - WALL_T * 2 - 100, height: ROOM_HEIGHT - WALL_T * 2 - 100 }],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_PILLARS: RoomTemplate = {
  walls: [
    { x: 2720, y: 1360, width: 160, height: 160 },
    { x: 3520, y: 1360, width: 160, height: 160 },
    { x: 2720, y: 2064, width: 160, height: 160 },
    { x: 3520, y: 2064, width: 160, height: 160 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 1600, height: 800 },
    { x: 4400, y: WALL_T + 50, width: 1600, height: 800 },
    { x: WALL_T + 50, y: 2000, width: 1600, height: 1200 },
    { x: 4400, y: 2000, width: 1600, height: 1200 },
  ],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_L_SHAPE: RoomTemplate = {
  walls: [
    { x: 0, y: 1600, width: 2400, height: 160 },
    { x: 2400, y: 800, width: 160, height: 960 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 2000, height: 1200 },
    { x: 2800, y: WALL_T + 50, width: 3200, height: 400 },
    { x: 2800, y: 1920, width: 3200, height: 1400 },
    { x: WALL_T + 50, y: 1920, width: 2000, height: 1400 },
  ],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_CROSS: RoomTemplate = {
  walls: [
    { x: 0, y: 1600, width: 3000, height: 160 },
    { x: 3432, y: 1600, width: 2968, height: 160 },
    { x: 3000, y: 0, width: 160, height: 1600 },
    { x: 3272, y: 1760, width: 160, height: 1824 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 2400, height: 1200 },
    { x: 3600, y: WALL_T + 50, width: 2400, height: 1200 },
    { x: WALL_T + 50, y: 1920, width: 2400, height: 1400 },
    { x: 3600, y: 1920, width: 2400, height: 1400 },
  ],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_RING: RoomTemplate = {
  walls: [
    { x: 2800, y: 1200, width: 800, height: 160 },
    { x: 2800, y: 2224, width: 800, height: 160 },
    { x: 2800, y: 1200, width: 160, height: 1184 },
    { x: 3440, y: 1200, width: 160, height: 1184 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: WALL_T + 50, y: WALL_T + 50, width: 2200, height: 800 },
    { x: 3600, y: WALL_T + 50, width: 2400, height: 800 },
    { x: WALL_T + 50, y: 2000, width: 2200, height: 1200 },
    { x: 3600, y: 2000, width: 2400, height: 1200 },
  ],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// Hub — town with portal positions, ~3200x1792 playable area centered in the big room
const HUB_PLAY_MIN_X = 1600;
const HUB_PLAY_MAX_X = 4800;
const HUB_PLAY_MIN_Y = 896;
const HUB_PLAY_MAX_Y = 2688;
export const TEMPLATE_HUB: RoomTemplate = {
  walls: [
    // Filler walls to shrink the playable area to ~3200x1792
    { x: 0, y: 0, width: HUB_PLAY_MIN_X, height: ROOM_HEIGHT },
    { x: HUB_PLAY_MAX_X, y: 0, width: ROOM_WIDTH - HUB_PLAY_MAX_X, height: ROOM_HEIGHT },
    { x: 0, y: 0, width: ROOM_WIDTH, height: HUB_PLAY_MIN_Y },
    { x: 0, y: HUB_PLAY_MAX_Y, width: ROOM_WIDTH, height: ROOM_HEIGHT - HUB_PLAY_MAX_Y },
  ],
  doors: [],
  portals: [
    { rect: { x: 3150, y: 1900, width: 100, height: 100 }, targetZone: 'hub', label: 'World Map' },
  ],
  spawnZones: [],
  decorationRects: [
    { x: 1950, y: 1000, width: 56, height: 56 },
    { x: 4000, y: 1000, width: 48, height: 48 },
    { x: 2000, y: 2400, width: 64, height: 64 },
    { x: 3950, y: 2400, width: 40, height: 40 },
  ],
  buildings: [
    { x: 2700, y: 1100, width: 400, height: 250, wallColor: 0x6a5a4a, roofColor: 0x5a3a2a, label: 'Vendor' },
    { x: 3300, y: 1100, width: 400, height: 250, wallColor: 0x5a6a5a, roofColor: 0x3a4a3a, label: 'Stash' },
  ],
  cabins: [],
  npcs: [
    { x: 2900, y: 1380, label: 'Vendor', tint: 0x44aa66 },
    { x: 3500, y: 1380, label: 'Stash', tint: 0x4488cc },
  ],
  playerStart: { x: 3200, y: 1792 },
};

// Tutorial — exit door to hub
export const TEMPLATE_TUTORIAL: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'hub', targetRoom: 0 },
  ],
  portals: [
    { rect: { x: 3160, y: 3160, width: 80, height: 80 }, targetZone: 'tutorial', label: 'Portal' },
  ],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// Arena — open room with exit portal
export const TEMPLATE_ARENA: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [
    { rect: { x: 3160, y: 460, width: 80, height: 80 }, targetZone: 'endless_arena', label: 'Portal' },
  ],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// Dungeon room — exit door to next room, exit portal to hub
export const TEMPLATE_DUNGEON: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'endless_dungeon', targetRoom: -1 },
  ],
  portals: [
    { rect: { x: 3160, y: 460, width: 80, height: 80 }, targetZone: 'endless_dungeon', label: 'Portal' },
  ],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// Dev room — exit door to hub
export const TEMPLATE_DEV: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'hub', targetRoom: 0 },
  ],
  portals: [
    { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'dev', label: 'Portal' },
  ],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// --- Forest zone templates (3 rooms) ---
export const TEMPLATE_FOREST_1: RoomTemplate = {
  walls: [],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'forest', targetRoom: 1 }],
  portals: [],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [
    { x: 800, y: 600, width: 80, height: 80 },
    { x: 1600, y: 1200, width: 64, height: 64 },
    { x: 2400, y: 2400, width: 72, height: 72 },
    { x: 4000, y: 800, width: 56, height: 56 },
    { x: 4800, y: 2000, width: 80, height: 80 },
    { x: 1200, y: 2800, width: 48, height: 48 },
    { x: 5200, y: 2800, width: 64, height: 64 },
  ],
  buildings: [],
  cabins: [
    {
      x: 1200, y: 1800, width: 350, height: 280,
      doorSide: 'south',
      chestPos: { x: 1350, y: 1900 },
      spawnZones: [{ x: 1310, y: 1900, width: 130, height: 120 }],
    },
    {
      x: 4800, y: 800, width: 350, height: 280,
      doorSide: 'south',
      chestPos: { x: 4950, y: 900 },
      spawnZones: [{ x: 4910, y: 900, width: 130, height: 120 }],
    },
  ],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_FOREST_2: RoomTemplate = {
  walls: [
    { x: 2720, y: 1360, width: 160, height: 160 },
    { x: 3520, y: 1360, width: 160, height: 160 },
    { x: 2720, y: 2064, width: 160, height: 160 },
    { x: 3520, y: 2064, width: 160, height: 160 },
  ],
  doors: [{ rect: { x: 3000, y: 0, width: 400, height: 144 }, targetZone: 'forest', targetRoom: 2 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2200, height: 800 },
    { x: 3600, y: 256, width: 2400, height: 800 },
    { x: 256, y: 2000, width: 2200, height: 1200 },
    { x: 3600, y: 2000, width: 2400, height: 1200 },
  ],
  decorationRects: [
    { x: 800, y: 600, width: 72, height: 72 },
    { x: 4800, y: 600, width: 64, height: 64 },
    { x: 1200, y: 2400, width: 56, height: 56 },
    { x: 4400, y: 2600, width: 80, height: 80 },
    { x: 400, y: 1600, width: 48, height: 48 },
    { x: 6000, y: 1200, width: 64, height: 64 },
  ],
  buildings: [],
  cabins: [
    {
      x: 800, y: 800, width: 350, height: 280,
      doorSide: 'south',
      chestPos: { x: 950, y: 900 },
      spawnZones: [{ x: 910, y: 900, width: 130, height: 120 }],
    },
  ],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_FOREST_3: RoomTemplate = {
  walls: [
    { x: 0, y: 1600, width: 2400, height: 160 },
    { x: 2400, y: 800, width: 160, height: 960 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'forest', targetRoom: 3 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2000, height: 1200 },
    { x: 2800, y: 256, width: 3200, height: 400 },
    { x: 2800, y: 1920, width: 3200, height: 1400 },
    { x: 256, y: 1920, width: 2000, height: 1400 },
  ],
  decorationRects: [
    { x: 1200, y: 600, width: 80, height: 80 },
    { x: 3200, y: 400, width: 56, height: 56 },
    { x: 600, y: 2400, width: 64, height: 64 },
    { x: 3600, y: 2400, width: 72, height: 72 },
    { x: 4800, y: 1200, width: 48, height: 48 },
  ],
  buildings: [],
  cabins: [
    {
      x: 3200, y: 1200, width: 350, height: 280,
      doorSide: 'south',
      chestPos: { x: 3350, y: 1300 },
      spawnZones: [{ x: 3310, y: 1300, width: 130, height: 120 }],
    },
  ],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// --- Desert zone templates (4 rooms) ---
export const TEMPLATE_DESERT_1: RoomTemplate = {
  walls: [
    { x: 3000, y: 0, width: 160, height: 1600 },
    { x: 3240, y: 1760, width: 160, height: 1824 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 200, height: 144 }, targetZone: 'desert', targetRoom: 1 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2400, height: 1200 },
    { x: 3600, y: 256, width: 2400, height: 1200 },
    { x: 256, y: 1920, width: 2400, height: 1400 },
    { x: 3600, y: 1920, width: 2400, height: 1400 },
  ],
  decorationRects: [
    { x: 800, y: 600, width: 88, height: 56 },
    { x: 2000, y: 1000, width: 72, height: 48 },
    { x: 4000, y: 720, width: 40, height: 96 },
    { x: 5200, y: 2000, width: 80, height: 64 },
    { x: 1200, y: 2600, width: 48, height: 112 },
    { x: 4400, y: 2800, width: 64, height: 48 },
    { x: 400, y: 2000, width: 56, height: 40 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_DESERT_2: RoomTemplate = {
  walls: [
    { x: 0, y: 1600, width: 3000, height: 160 },
    { x: 3432, y: 1600, width: 2968, height: 160 },
    { x: 3000, y: 0, width: 112, height: 1600 },
    { x: 3112, y: 1760, width: 128, height: 1824 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'desert', targetRoom: 2 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2400, height: 1200 },
    { x: 3600, y: 256, width: 2400, height: 1200 },
    { x: 256, y: 1920, width: 2400, height: 1400 },
    { x: 3600, y: 1920, width: 2400, height: 1400 },
  ],
  decorationRects: [
    { x: 600, y: 600, width: 64, height: 48 },
    { x: 1600, y: 800, width: 40, height: 88 },
    { x: 4400, y: 720, width: 80, height: 56 },
    { x: 5600, y: 2400, width: 72, height: 48 },
    { x: 800, y: 2600, width: 48, height: 104 },
    { x: 5200, y: 1200, width: 56, height: 40 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_DESERT_3: RoomTemplate = {
  walls: [
    { x: 2720, y: 1360, width: 160, height: 160 },
    { x: 3520, y: 1360, width: 160, height: 160 },
    { x: 2720, y: 2064, width: 160, height: 160 },
    { x: 3520, y: 2064, width: 160, height: 160 },
  ],
  doors: [{ rect: { x: 3000, y: 0, width: 400, height: 144 }, targetZone: 'desert', targetRoom: 3 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2200, height: 800 },
    { x: 3600, y: 256, width: 2400, height: 800 },
    { x: 256, y: 2000, width: 2200, height: 1200 },
    { x: 3600, y: 2000, width: 2400, height: 1200 },
  ],
  decorationRects: [
    { x: 800, y: 600, width: 80, height: 56 },
    { x: 5200, y: 600, width: 40, height: 96 },
    { x: 1600, y: 2600, width: 64, height: 48 },
    { x: 4400, y: 2600, width: 88, height: 64 },
    { x: 400, y: 1600, width: 48, height: 40 },
    { x: 6000, y: 1200, width: 56, height: 112 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_DESERT_4: RoomTemplate = {
  walls: [],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'desert', targetRoom: 4 }],
  portals: [],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [
    { x: 1200, y: 800, width: 72, height: 48 },
    { x: 2400, y: 1600, width: 40, height: 88 },
    { x: 4000, y: 1200, width: 80, height: 56 },
    { x: 5200, y: 2600, width: 64, height: 48 },
    { x: 800, y: 2800, width: 56, height: 40 },
    { x: 3200, y: 2400, width: 48, height: 104 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

// --- Ice zone templates (5 rooms) ---
export const TEMPLATE_ICE_1: RoomTemplate = {
  walls: [],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'ice', targetRoom: 1 }],
  portals: [],
  spawnZones: [{ x: 256, y: 256, width: 5888, height: 3072 }],
  decorationRects: [
    { x: 800, y: 600, width: 64, height: 64 },
    { x: 2000, y: 1400, width: 80, height: 80 },
    { x: 4000, y: 800, width: 56, height: 56 },
    { x: 5200, y: 2400, width: 88, height: 88 },
    { x: 1200, y: 2800, width: 72, height: 72 },
    { x: 4800, y: 1800, width: 48, height: 48 },
    { x: 2400, y: 2600, width: 64, height: 64 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_ICE_2: RoomTemplate = {
  walls: [
    { x: 2720, y: 1360, width: 160, height: 160 },
    { x: 3520, y: 1360, width: 160, height: 160 },
    { x: 2720, y: 2064, width: 160, height: 160 },
    { x: 3520, y: 2064, width: 160, height: 160 },
  ],
  doors: [{ rect: { x: 3000, y: 0, width: 400, height: 144 }, targetZone: 'ice', targetRoom: 2 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2200, height: 800 },
    { x: 3600, y: 256, width: 2400, height: 800 },
    { x: 256, y: 2000, width: 2200, height: 1200 },
    { x: 3600, y: 2000, width: 2400, height: 1200 },
  ],
  decorationRects: [
    { x: 800, y: 600, width: 72, height: 72 },
    { x: 5200, y: 600, width: 56, height: 56 },
    { x: 1600, y: 2400, width: 80, height: 80 },
    { x: 4400, y: 2600, width: 64, height: 64 },
    { x: 400, y: 1800, width: 48, height: 48 },
    { x: 6000, y: 1400, width: 88, height: 88 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_ICE_3: RoomTemplate = {
  walls: [
    { x: 0, y: 1600, width: 2400, height: 160 },
    { x: 2400, y: 800, width: 160, height: 960 },
  ],
  doors: [{ rect: { x: 6080, y: 1600, width: 144, height: 320 }, targetZone: 'ice', targetRoom: 3 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2000, height: 1200 },
    { x: 2800, y: 256, width: 3200, height: 400 },
    { x: 2800, y: 1920, width: 3200, height: 1400 },
    { x: 256, y: 1920, width: 2000, height: 1400 },
  ],
  decorationRects: [
    { x: 1200, y: 600, width: 80, height: 80 },
    { x: 3200, y: 400, width: 56, height: 56 },
    { x: 600, y: 2400, width: 72, height: 72 },
    { x: 3600, y: 2600, width: 64, height: 64 },
    { x: 4800, y: 1200, width: 88, height: 88 },
    { x: 2000, y: 2000, width: 48, height: 48 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_ICE_4: RoomTemplate = {
  walls: [
    { x: 3000, y: 0, width: 112, height: 1600 },
    { x: 3112, y: 1760, width: 128, height: 1824 },
  ],
  doors: [{ rect: { x: 2960, y: 3312, width: 120, height: 144 }, targetZone: 'ice', targetRoom: 4 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2600, height: 1200 },
    { x: 3400, y: 256, width: 2600, height: 1200 },
    { x: 256, y: 1920, width: 2600, height: 1400 },
    { x: 3400, y: 1920, width: 2600, height: 1400 },
  ],
  decorationRects: [
    { x: 800, y: 800, width: 64, height: 64 },
    { x: 4800, y: 800, width: 80, height: 80 },
    { x: 1600, y: 2600, width: 56, height: 56 },
    { x: 4000, y: 2400, width: 72, height: 72 },
    { x: 6000, y: 2000, width: 48, height: 48 },
    { x: 400, y: 2800, width: 88, height: 88 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_ICE_5: RoomTemplate = {
  walls: [
    { x: 2720, y: 1360, width: 160, height: 160 },
    { x: 3520, y: 1360, width: 160, height: 160 },
    { x: 2720, y: 2064, width: 160, height: 160 },
    { x: 3520, y: 2064, width: 160, height: 160 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'ice', targetRoom: 5 }],
  portals: [],
  spawnZones: [
    { x: 256, y: 256, width: 2200, height: 800 },
    { x: 3600, y: 256, width: 2400, height: 800 },
    { x: 256, y: 2000, width: 2200, height: 1200 },
    { x: 3600, y: 2000, width: 2400, height: 1200 },
  ],
  decorationRects: [
    { x: 800, y: 600, width: 72, height: 72 },
    { x: 5200, y: 600, width: 56, height: 56 },
    { x: 1600, y: 2600, width: 80, height: 80 },
    { x: 4400, y: 2600, width: 64, height: 64 },
    { x: 400, y: 1600, width: 88, height: 88 },
    { x: 6000, y: 1600, width: 48, height: 48 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_FOREST_BOSS: RoomTemplate = {
  walls: [
    { x: 800, y: 600, width: 240, height: 240 },
    { x: 5360, y: 600, width: 240, height: 240 },
    { x: 800, y: 2744, width: 240, height: 240 },
    { x: 5360, y: 2744, width: 240, height: 240 },
    { x: 2000, y: 1600, width: 200, height: 200 },
    { x: 4200, y: 1600, width: 200, height: 200 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'desert', targetRoom: 0 }],
  portals: [
    { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'forest', label: 'Portal' },
  ],
  spawnZones: [],
  decorationRects: [
    { x: 560, y: 480, width: 56, height: 56 },
    { x: 5200, y: 480, width: 48, height: 48 },
    { x: 640, y: 2640, width: 64, height: 64 },
    { x: 5280, y: 2640, width: 40, height: 40 },
    { x: 1600, y: 800, width: 48, height: 48 },
    { x: 4400, y: 800, width: 56, height: 56 },
    { x: 1200, y: 2400, width: 40, height: 40 },
    { x: 4800, y: 2400, width: 48, height: 48 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_DESERT_BOSS: RoomTemplate = {
  walls: [
    { x: 1200, y: 800, width: 160, height: 160 },
    { x: 5040, y: 800, width: 160, height: 160 },
    { x: 1200, y: 2400, width: 160, height: 160 },
    { x: 5040, y: 2400, width: 160, height: 160 },
    { x: 400, y: 1600, width: 320, height: 64 },
    { x: 5680, y: 1600, width: 320, height: 64 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'ice', targetRoom: 0 }],
  portals: [
    { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'desert', label: 'Portal' },
  ],
  spawnZones: [{ x: 800, y: 600, width: 4800, height: 2400 }],
  decorationRects: [
    { x: 800, y: 720, width: 40, height: 64 },
    { x: 1000, y: 760, width: 32, height: 56 },
    { x: 5200, y: 720, width: 48, height: 72 },
    { x: 5400, y: 760, width: 32, height: 48 },
    { x: 800, y: 2400, width: 40, height: 72 },
    { x: 1000, y: 2440, width: 32, height: 56 },
    { x: 5200, y: 2440, width: 48, height: 64 },
    { x: 5400, y: 2400, width: 32, height: 48 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_ICE_BOSS: RoomTemplate = {
  walls: [
    { x: 1600, y: 896, width: 200, height: 200 },
    { x: 4600, y: 896, width: 200, height: 200 },
    { x: 1000, y: 2000, width: 200, height: 200 },
    { x: 5200, y: 2000, width: 200, height: 200 },
    { x: 2800, y: 1400, width: 160, height: 160 },
    { x: 3440, y: 1400, width: 160, height: 160 },
    { x: 2800, y: 2000, width: 160, height: 160 },
    { x: 3440, y: 2000, width: 160, height: 160 },
  ],
  doors: [{ rect: { x: 3000, y: 3312, width: 400, height: 144 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [
    { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'ice', label: 'Portal' },
  ],
  spawnZones: [],
  decorationRects: [
    { x: 600, y: 600, width: 64, height: 64 },
    { x: 5400, y: 600, width: 56, height: 56 },
    { x: 600, y: 2800, width: 48, height: 48 },
    { x: 5400, y: 2800, width: 64, height: 64 },
    { x: 2000, y: 2400, width: 40, height: 40 },
    { x: 4000, y: 2400, width: 48, height: 48 },
    { x: 1200, y: 1200, width: 56, height: 56 },
    { x: 4800, y: 1200, width: 40, height: 40 },
  ],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
};

export const TEMPLATE_CRYPT: RoomTemplate = {
  walls: [
    { x: 1560, y: 144, width: 3280, height: 48 },
    { x: 1560, y: 3392, width: 3280, height: 48 },
    { x: 1560, y: 144, width: 48, height: 3248 },
    { x: 4792, y: 144, width: 48, height: 3248 },
  ],
  doors: [
    {
      rect: { x: 3000, y: 3312, width: 400, height: 144 },
      targetZone: 'tutorial',
      targetRoom: 0,
    },
  ],
  portals: [
    { rect: { x: 3160, y: 1460, width: 80, height: 80 }, targetZone: 'secret_crypt', label: 'Portal' },
  ],
  spawnZones: [
    { x: 1650, y: 200, width: 600, height: 600 },
    { x: 4150, y: 200, width: 600, height: 600 },
    { x: 1650, y: 2784, width: 600, height: 600 },
    { x: 4150, y: 2784, width: 600, height: 600 },
  ],
  decorationRects: [],
  buildings: [],
  cabins: [],
  npcs: [],
  playerStart: { x: 3200, y: 1792 },
};
