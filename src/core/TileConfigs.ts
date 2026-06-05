import { Texture } from 'pixi.js';
import { BiomeId } from './ZoneConfig';

export interface TileConfig {
  sheetUrl: string;
  jsonUrl: string;
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

export const TILE_CONFIGS: Partial<Record<BiomeId, TileConfig>> = {};

export let tileTextures: Record<string, Texture> = {};

export function setTileTextures(map: Record<string, Texture>) {
  tileTextures = map;
}
