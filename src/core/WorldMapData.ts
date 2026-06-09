export type ZoneType = 'hub' | 'dungeon' | 'arena' | 'boss' | 'secret' | 'dev';

export type MapIconType = 'town' | 'dungeon' | 'forest' | 'desert' | 'ice' | 'arena' | 'secret' | 'dev';

export interface WorldMapEntry {
  id: string;
  name: string;
  type: ZoneType;
  icon: MapIconType;
  mapPosition: { x: number; y: number };
  connections: string[];
  description: string;
  actGroup: number;
  discovered: boolean;
}

export const WORLD_MAP_REGISTRY: Record<string, WorldMapEntry> = {
  hub: {
    id: 'hub',
    name: 'Town',
    type: 'hub',
    icon: 'town',
    mapPosition: { x: 50, y: 50 },
    connections: ['tutorial', 'forest', 'endless_arena', 'endless_dungeon', 'dev'],
    description: 'A weary refuge for those who brave the wilds.',
    actGroup: 1,
    discovered: true,
  },
  tutorial: {
    id: 'tutorial',
    name: 'Tutorial Glen',
    type: 'dungeon',
    icon: 'dungeon',
    mapPosition: { x: 50, y: 72 },
    connections: ['hub', 'secret_crypt', 'forest'],
    description: 'A peaceful glade where fledgling adventurers learn the ropes.',
    actGroup: 1,
    discovered: true,
  },
  secret_crypt: {
    id: 'secret_crypt',
    name: 'Hidden Crypt',
    type: 'secret',
    icon: 'secret',
    mapPosition: { x: 58, y: 82 },
    connections: ['tutorial'],
    description: 'An ancient burial chamber, sealed away from prying eyes.',
    actGroup: 1,
    discovered: false,
  },
  forest: {
    id: 'forest',
    name: 'Verdant Forest',
    type: 'dungeon',
    icon: 'forest',
    mapPosition: { x: 32, y: 55 },
    connections: ['hub', 'tutorial', 'desert'],
    description: 'A sprawling woodland teeming with archers and grunts. The Stone Golem awaits.',
    actGroup: 1,
    discovered: true,
  },
  desert: {
    id: 'desert',
    name: 'Scorched Desert',
    type: 'dungeon',
    icon: 'desert',
    mapPosition: { x: 18, y: 45 },
    connections: ['forest', 'ice'],
    description: 'Blazing sands stretch endlessly. Juggernauts patrol the dunes.',
    actGroup: 1,
    discovered: false,
  },
  ice: {
    id: 'ice',
    name: 'Frozen Wastes',
    type: 'dungeon',
    icon: 'ice',
    mapPosition: { x: 8, y: 32 },
    connections: ['desert'],
    description: 'A frozen hellscape at the edge of the world. The Death Reaper rules here.',
    actGroup: 1,
    discovered: false,
  },
  endless_arena: {
    id: 'endless_arena',
    name: 'Endless Arena',
    type: 'arena',
    icon: 'arena',
    mapPosition: { x: 72, y: 58 },
    connections: ['hub'],
    description: 'An eternal proving ground. Waves of enemies test your limits.',
    actGroup: 2,
    discovered: true,
  },
  endless_dungeon: {
    id: 'endless_dungeon',
    name: 'Endless Dungeon',
    type: 'dungeon',
    icon: 'dungeon',
    mapPosition: { x: 82, y: 70 },
    connections: ['hub'],
    description: 'Procedural depths that descend without end.',
    actGroup: 2,
    discovered: true,
  },
  dev: {
    id: 'dev',
    name: 'Developer Room',
    type: 'dev',
    icon: 'dev',
    mapPosition: { x: 5, y: 5 },
    connections: ['hub'],
    description: 'A place between worlds.',
    actGroup: 0,
    discovered: true,
  },
};

export const ZONE_PORTAL_POSITIONS: Record<string, { x: number; y: number }> = {
  tutorial: { x: 3200, y: 3200 },
  forest: { x: 3200, y: 1792 },
  desert: { x: 3200, y: 1792 },
  ice: { x: 3200, y: 1792 },
  endless_arena: { x: 3200, y: 500 },
  endless_dungeon: { x: 3200, y: 500 },
  secret_crypt: { x: 3200, y: 1500 },
  dev: { x: 3200, y: 1792 },
  hub: { x: 3200, y: 1950 },
};

export function getDiscoveredZoneIds(): string[] {
  return Object.values(WORLD_MAP_REGISTRY)
    .filter(entry => entry.discovered)
    .map(entry => entry.id);
}

export const DEFAULT_DISCOVERED: string[] = ['hub', 'tutorial', 'forest', 'endless_arena', 'endless_dungeon', 'dev'];

export function restoreDiscoveries(discoveredIds: string[]): void {
  const allIds = new Set([...discoveredIds, ...DEFAULT_DISCOVERED]);
  for (const id of allIds) {
    const entry = WORLD_MAP_REGISTRY[id];
    if (entry) {
      entry.discovered = true;
    }
  }
}

export function getDiscoveredCount(): number {
  return Object.values(WORLD_MAP_REGISTRY).filter(entry => entry.discovered).length;
}

export function getTotalZoneCount(): number {
  return Object.keys(WORLD_MAP_REGISTRY).length;
}
