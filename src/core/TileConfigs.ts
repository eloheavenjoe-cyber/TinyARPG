import { Texture } from 'pixi.js';
import { BiomeId } from './ZoneConfig';

export interface TileConfig {
  sheetUrl?: string;
  jsonUrl?: string;
  files?: Record<string, { path: string; x?: number; y?: number; w?: number; h?: number }>;
  floorTile: string;
  wallTile: string;
  accentTiles: {
    tiles: string[];
    chance: number;
  };
  props: {
    treeTiles: string[];
    bushTiles: string[];
    rockTiles: string[];
    treeCount: [number, number];
    bushCount: [number, number];
    rockCount: [number, number];
  };
  wallTrimColor?: number;
  wallTrimAlpha?: number;
}

export const TILE_CONFIGS: Partial<Record<BiomeId, TileConfig>> = {
  tutorial: {
    files: {
      grass: { path: 'sprites/tiles/tutorial/Grass0 - 4.png' },
      road: { path: 'sprites/tiles/tutorial/Road4.png' },
      wall: { path: 'sprites/tiles/tutorial/Wall1.png' },
      accent: { path: 'sprites/tiles/tutorial/Grass0 - 1.png' },
      tree: { path: 'sprites/tiles/tutorial/Trees.png', x: 0, y: 0, w: 96, h: 208 },
      tree_d: { path: 'sprites/tiles/tutorial/Trees2.png', x: 0, y: 160, w: 96, h: 160 },
      tree_e: { path: 'sprites/tiles/tutorial/Trees2.png', x: 96, y: 160, w: 96, h: 160 },
      stump: { path: 'sprites/tiles/tutorial/Trees.png', x: 230, y: 363, w: 17, h: 53 },
    },
    floorTile: 'grass',
    wallTile: 'wall',
    accentTiles: {
      tiles: ['accent'],
      chance: 0.08,
    },
    props: {
      treeTiles: ['tree', 'tree_d', 'tree_e'],
      bushTiles: ['stump'],
      rockTiles: [],
      treeCount: [80, 120],
      bushCount: [3, 6],
      rockCount: [0, 2],
    },
    wallTrimColor: 0x886644,
    wallTrimAlpha: 0.5,
  },
};

export let tileTextures: Record<string, Texture> = {};

export function setTileTextures(map: Record<string, Texture>) {
  tileTextures = map;
}
