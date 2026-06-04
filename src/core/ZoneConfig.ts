import { EnemyType } from '../entities/Enemy';

export type BiomeId = 'dev' | 'hub' | 'tutorial' | 'forest' | 'desert' | 'ice' | 'endless';

export interface BiomeData {
  floorColorA: number;
  floorColorB: number;
  wallColor: number;
  wallBorderColor: number;
}

export const BIOME_DATA: Record<BiomeId, BiomeData> = {
  dev:       { floorColorA: 0x3a3a3a, floorColorB: 0x404040, wallColor: 0x4a4a5a, wallBorderColor: 0x5a5a6a },
  hub:       { floorColorA: 0x5a5a4a, floorColorB: 0x555545, wallColor: 0x6a5a4a, wallBorderColor: 0x7a6a5a },
  tutorial:  { floorColorA: 0x4a6a3a, floorColorB: 0x406030, wallColor: 0x3a5a2a, wallBorderColor: 0x4a6a3a },
  forest:    { floorColorA: 0x3a5a2a, floorColorB: 0x406030, wallColor: 0x3a4a2a, wallBorderColor: 0x4a5a3a },
  desert:    { floorColorA: 0x8a7a4a, floorColorB: 0x7a6a3a, wallColor: 0x9a7a5a, wallBorderColor: 0xaa8a6a },
  ice:       { floorColorA: 0xaaccff, floorColorB: 0x99bbee, wallColor: 0x8899cc, wallBorderColor: 0x99aadd },
  endless:   { floorColorA: 0x4a3a5a, floorColorB: 0x403050, wallColor: 0x3a2a4a, wallBorderColor: 0x4a3a5a },
};

export interface DoorMarker {
  rect: { x: number; y: number; width: number; height: number };
  targetZone: string;
  targetRoom: number;
}

export interface PortalMarker {
  rect: { x: number; y: number; width: number; height: number };
  targetZone: string;
  label: string;
}

export interface RoomTemplate {
  walls: { x: number; y: number; width: number; height: number }[];
  doors: DoorMarker[];
  portals: PortalMarker[];
  spawnZones: { x: number; y: number; width: number; height: number }[];
  playerStart: { x: number; y: number };
}

export interface ZoneConfig {
  id: string;
  name: string;
  biome: BiomeId;
  roomCount: number;
  enemyPool: EnemyType[];
  enemyHpMult: number;
  enemyDmgMult: number;
  enemyXpMult: number;
  isEndless: false | 'procgen' | 'wave';
  nextZone: string | null;
  availableFromHub: boolean;
  enemyCount: number | { min: number; max: number };
  templates: RoomTemplate[];
}

export const ZONE_REGISTRY: Record<string, ZoneConfig> = {
  dev: {
    id: 'dev', name: 'Developer Room', biome: 'dev',
    roomCount: 1, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: false, nextZone: 'hub', availableFromHub: false,
    enemyCount: { min: 3, max: 6 },
    templates: [],
  },
  hub: {
    id: 'hub', name: 'Town', biome: 'hub',
    roomCount: 1, enemyPool: [],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: false, nextZone: null, availableFromHub: false,
    enemyCount: 0,
    templates: [],
  },
  tutorial: {
    id: 'tutorial', name: 'Tutorial Glen', biome: 'tutorial',
    roomCount: 1, enemyPool: ['grunt'],
    enemyHpMult: 0.5, enemyDmgMult: 0.5, enemyXpMult: 0,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 2, max: 3 },
    templates: [],
  },
  forest: {
    id: 'forest', name: 'Verdant Forest', biome: 'forest',
    roomCount: 3, enemyPool: ['grunt', 'archer'],
    enemyHpMult: 1.0, enemyDmgMult: 1.0, enemyXpMult: 1.0,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 3, max: 5 },
    templates: [],
  },
  desert: {
    id: 'desert', name: 'Scorched Desert', biome: 'desert',
    roomCount: 4, enemyPool: ['grunt', 'archer', 'juggernaut'],
    enemyHpMult: 1.5, enemyDmgMult: 1.3, enemyXpMult: 1.5,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 4, max: 6 },
    templates: [],
  },
  ice: {
    id: 'ice', name: 'Frozen Wastes', biome: 'ice',
    roomCount: 5, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 2.5, enemyDmgMult: 2.0, enemyXpMult: 2.5,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 5, max: 7 },
    templates: [],
  },
  endless_dungeon: {
    id: 'endless_dungeon', name: 'Endless Dungeon', biome: 'endless',
    roomCount: 1, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: 'procgen', nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 4, max: 4 },
    templates: [],
  },
  endless_arena: {
    id: 'endless_arena', name: 'Endless Arena', biome: 'endless',
    roomCount: 1, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: 'wave', nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 3, max: 3 },
    templates: [],
  },
};
