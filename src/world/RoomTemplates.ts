import type { RoomTemplate } from '../core/ZoneConfig';

const W = 1600;
const H = 896;
const T = 32;

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
  spawnZones: [{ x: T + 50, y: T + 50, width: W - T * 2 - 100, height: H - T * 2 - 100 }],
  playerStart: { x: W / 2, y: H / 2 },
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
    { x: T + 50, y: T + 50, width: 400, height: 200 },
    { x: 1100, y: T + 50, width: 400, height: 200 },
    { x: T + 50, y: 500, width: 400, height: 300 },
    { x: 1100, y: 500, width: 400, height: 300 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};

export const TEMPLATE_L_SHAPE: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 600, height: 40 },
    { x: 600, y: 200, width: 40, height: 240 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: T + 50, y: T + 50, width: 500, height: 300 },
    { x: 700, y: T + 50, width: 800, height: 100 },
    { x: 700, y: 480, width: 800, height: 350 },
    { x: T + 50, y: 480, width: 500, height: 350 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};

export const TEMPLATE_CROSS: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 750, height: 40 },
    { x: 850, y: 400, width: 750, height: 40 },
    { x: 750, y: 0, width: 40, height: 400 },
    { x: 810, y: 440, width: 40, height: 456 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: T + 50, y: T + 50, width: 600, height: 300 },
    { x: 900, y: T + 50, width: 600, height: 300 },
    { x: T + 50, y: 480, width: 600, height: 350 },
    { x: 900, y: 480, width: 600, height: 350 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
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
    { x: T + 50, y: T + 50, width: 550, height: 200 },
    { x: 900, y: T + 50, width: 600, height: 200 },
    { x: T + 50, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};
