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
  floorTint?: number;
  accentTint?: number;
  wallTint?: number;
  propTint?: number;
  elevation?: {
    darkBlobs: number;
    lightBlobs: number;
    darkAlpha: number;
    lightAlpha: number;
  };
}

export const TILE_CONFIGS: Partial<Record<BiomeId, TileConfig>> = {
  tutorial: {
    files: {
      grass: { path: 'sprites/tiles/tutorial/Grass0 - 4.png' },
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
  forest: {
    files: {
      grass:  { path: 'sprites/tiles/tutorial/Grass0 - 4.png' },
      wall:   { path: 'sprites/tiles/tutorial/Wall1.png' },
      accent: { path: 'sprites/tiles/tutorial/Grass0 - 1.png' },
      tree_a: { path: 'sprites/tiles/tutorial/Trees.png',  x: 96,  y: 0,   w: 96, h: 208 },
      tree_b: { path: 'sprites/tiles/tutorial/Trees.png',  x: 192, y: 0,   w: 96, h: 208 },
      tree_c: { path: 'sprites/tiles/tutorial/Trees2.png', x: 0,   y: 0,   w: 96, h: 160 },
      tree_d: { path: 'sprites/tiles/tutorial/Trees2.png', x: 96,  y: 0,   w: 96, h: 160 },
      tree_e: { path: 'sprites/tiles/tutorial/Trees2.png', x: 192, y: 0,   w: 96, h: 160 },
      tree_f: { path: 'sprites/tiles/tutorial/Trees2.png', x: 192, y: 160, w: 96, h: 160 },
    },
    floorTile: 'grass',
    wallTile: 'wall',
    accentTiles: { tiles: ['accent'], chance: 0.08 },
    floorTint: 0x9a8a4a,
    accentTint: 0xaa8833,
    wallTint: 0xb0a090,
    wallTrimColor: 0x7a6a5a,
    wallTrimAlpha: 0.5,
    propTint: 0xbb8844,
    elevation: { darkBlobs: 5, lightBlobs: 3, darkAlpha: 0.08, lightAlpha: 0.05 },
    props: {
      treeTiles: ['tree_a', 'tree_b', 'tree_c', 'tree_d', 'tree_e', 'tree_f'],
      bushTiles: [],
      rockTiles: [],
      treeCount: [80, 120],
      bushCount: [5, 10],
      rockCount: [8, 16],
    },
  },
};

export let tileTextures: Record<string, Texture> = {};

export function setTileTextures(map: Record<string, Texture>) {
  tileTextures = map;
}
