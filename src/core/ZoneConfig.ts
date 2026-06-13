import { EnemyType } from '../entities/Enemy';

export type BiomeId = 'dev' | 'hub' | 'tutorial' | 'forest' | 'desert' | 'ice' | 'endless' | 'crypt' | 'volcanic';

export interface BiomeData {
  floorColor: number;
  wallColor: number;
  wallBorderColor: number;
  decorColor: number;
  decorColorB: number;
}

export const BIOME_DATA: Record<BiomeId, BiomeData> = {
  dev:       { floorColor: 0x3d3d45, wallColor: 0x4a4a5a, wallBorderColor: 0x5a5a6a, decorColor: 0x505060, decorColorB: 0x353545 },
  hub:       { floorColor: 0x585848, wallColor: 0x6a5a4a, wallBorderColor: 0x7a6a5a, decorColor: 0x4a4a3a, decorColorB: 0x606050 },
  tutorial:  { floorColor: 0x456035, wallColor: 0x3a5a2a, wallBorderColor: 0x4a6a3a, decorColor: 0x5a3a1a, decorColorB: 0x2a4a1a },
  forest:    { floorColor: 0x3a552a, wallColor: 0x3a4a2a, wallBorderColor: 0x4a5a3a, decorColor: 0x5a3a1a, decorColorB: 0x2a4a1a },
  desert:    { floorColor: 0x7a6a3a, wallColor: 0x9a7a5a, wallBorderColor: 0xaa8a6a, decorColor: 0x6a6a5a, decorColorB: 0x3a6a2a },
  ice:       { floorColor: 0xaabbdd, wallColor: 0x8899cc, wallBorderColor: 0x99aadd, decorColor: 0xddeeff, decorColorB: 0xeeeeff },
  endless:   { floorColor: 0x453555, wallColor: 0x3a2a4a, wallBorderColor: 0x4a3a5a, decorColor: 0x8844aa, decorColorB: 0x663388 },
  crypt:     { floorColor: 0x1a1028, wallColor: 0x2a2040, wallBorderColor: 0x3a3050, decorColor: 0x0a0020, decorColorB: 0x553366 },
  volcanic:  { floorColor: 0x3a1a1a, wallColor: 0x4a2020, wallBorderColor: 0x5a2a2a, decorColor: 0x5a2a1a, decorColorB: 0x2a1010 },
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
  discovered?: boolean;
}

export interface BuildingData {
  x: number; y: number; width: number; height: number;
  wallColor: number; roofColor: number;
  label: string;
}

export interface NpcData {
  x: number; y: number;
  label: string;
  tint: number;
}

export interface CabinData {
  x: number;
  y: number;
  width: number;
  height: number;
  doorSide: 'south';
  chestPos: { x: number; y: number };
  spawnZones: { x: number; y: number; width: number; height: number }[];
}

export interface RoomTemplate {
  walls: { x: number; y: number; width: number; height: number }[];
  doors: DoorMarker[];
  portals: PortalMarker[];
  spawnZones: { x: number; y: number; width: number; height: number }[];
  playerStart: { x: number; y: number };
  decorationRects: { x: number; y: number; width: number; height: number }[];
  buildings: BuildingData[];
  cabins: CabinData[];
  npcs: NpcData[];
}

export interface ZoneConfig {
  id: string;
  name: string;
  biome: BiomeId;
  tileConfig?: string;
  roomCount: number;
  bossId?: string;
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


