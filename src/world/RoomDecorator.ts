import { RoomTemplate, BiomeId } from '../core/ZoneConfig';
import { TileConfig, tileTextures } from '../core/TileConfigs';
import { ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, Rect, rectsOverlap } from './Room';
import { Sprites } from '../rendering/Sprites';
import { Sprite } from 'pixi.js';

export interface DecorationSprite {
  sprite: Sprite;
  x: number;
  y: number;
}

export interface DecoratorResult {
  decorations: DecorationSprite[];
  obstacles: Rect[];
  chests: { x: number; y: number }[];
  breakables: { x: number; y: number }[];
}

const BIOME_DECOR: Record<BiomeId, { treeChance: number; rockChance: number; bushChance: number }> = {
  forest:   { treeChance: 0.5, rockChance: 0.2, bushChance: 0.3 },
  desert:   { treeChance: 0.1, rockChance: 0.6, bushChance: 0.3 },
  ice:      { treeChance: 0.3, rockChance: 0.4, bushChance: 0.3 },
  hub:      { treeChance: 0.3, rockChance: 0.2, bushChance: 0.5 },
  tutorial: { treeChance: 0.4, rockChance: 0.3, bushChance: 0.3 },
  endless:  { treeChance: 0.3, rockChance: 0.4, bushChance: 0.3 },
  dev:      { treeChance: 0, rockChance: 0, bushChance: 0 },
  crypt:    { treeChance: 0, rockChance: 0.3, bushChance: 0.2 },
};

function getBiomeTint(biome: BiomeId): number {
  switch (biome) {
    case 'forest': return 0x449933;
    case 'desert': return 0xcc8844;
    case 'ice': return 0x88ccff;
    case 'hub': return 0x44aa66;
    case 'tutorial': return 0x559944;
    case 'endless': return 0x664488;
    case 'crypt': return 0x553366;
    default: return 0x888888;
  }
}

export function decorateRoom(template: RoomTemplate, biome: BiomeId, tileConfig?: TileConfig, roadBlock?: Rect): DecoratorResult {
  const result: DecoratorResult = { decorations: [], obstacles: [], chests: [], breakables: [] };
  const config = BIOME_DECOR[biome];
  if (!config || config.treeChance === 0) return result;

  const blockedRects: Rect[] = [
    ...template.walls,
    ...template.doors.map(d => d.rect),
    ...template.portals.map(p => p.rect),
    ...template.buildings.map(b => ({ x: b.x, y: b.y, width: b.width, height: b.height })),
  ];
  if (roadBlock) blockedRects.push(roadBlock);

  const margin = WALL_THICKNESS + 64;
  const maxX = ROOM_WIDTH - margin;
  const maxY = ROOM_HEIGHT - margin;

  function tryPlace(w: number, h: number): { x: number; y: number } | null {
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = margin + Math.random() * (maxX - margin - w);
      const y = margin + Math.random() * (maxY - margin - h);
      const r: Rect = { x, y, width: w, height: h };
      let blocked = false;
      for (const br of blockedRects) {
        if (rectsOverlap(r, br)) { blocked = true; break; }
      }
      if (!blocked) {
        for (const ob of result.obstacles) {
          if (rectsOverlap(r, ob)) { blocked = true; break; }
        }
      }
      if (!blocked) return { x, y };
    }
    return null;
  }

  // Trees (collision obstacles)
  const treeCount = tileConfig?.props.treeCount
    ? tileConfig.props.treeCount[0] + Math.floor(Math.random() * (tileConfig.props.treeCount[1] - tileConfig.props.treeCount[0] + 1))
    : 10 + Math.floor(Math.random() * 8);
  for (let i = 0; i < treeCount; i++) {
    const p = tryPlace(32, 32);
    if (!p) continue;
    let sprite: Sprite;
    if (tileConfig && tileConfig.props.treeTiles.length > 0) {
      const tileName = tileConfig.props.treeTiles[Math.floor(Math.random() * tileConfig.props.treeTiles.length)];
      const tx = tileTextures[tileName];
      if (!tx) continue;
      sprite = new Sprite(tx);
      sprite.anchor.set(0.5, 1);
    } else {
      sprite = new Sprite(Sprites.tree);
      sprite.anchor.set(0.5, 1);
      sprite.tint = getBiomeTint(biome);
    }
    sprite.x = p.x + 16;
    sprite.y = p.y + 32;
    result.decorations.push({ sprite, x: p.x + 16, y: p.y + 32 });
    result.obstacles.push({ x: p.x + 4, y: p.y + 4, width: 24, height: 24 });
  }

  // Rocks (collision obstacles)
  const rockCount = tileConfig?.props.rockCount
    ? tileConfig.props.rockCount[0] + Math.floor(Math.random() * (tileConfig.props.rockCount[1] - tileConfig.props.rockCount[0] + 1))
    : 6 + Math.floor(Math.random() * 6);
  for (let i = 0; i < rockCount; i++) {
    const p = tryPlace(24, 20);
    if (!p) continue;
    let sprite: Sprite;
    if (tileConfig && tileConfig.props.rockTiles.length > 0) {
      const tileName = tileConfig.props.rockTiles[Math.floor(Math.random() * tileConfig.props.rockTiles.length)];
      const tx = tileTextures[tileName];
      if (!tx) continue;
      sprite = new Sprite(tx);
      sprite.anchor.set(0.5, 1);
    } else {
      sprite = new Sprite(Sprites.rock);
      sprite.anchor.set(0.5, 1);
      sprite.tint = getBiomeTint(biome);
    }
    sprite.x = p.x + 12;
    sprite.y = p.y + 20;
    result.decorations.push({ sprite, x: p.x + 12, y: p.y + 20 });
    result.obstacles.push({ x: p.x + 2, y: p.y + 2, width: 20, height: 16 });
  }

  // Bushes (decorative only)
  const bushCount = tileConfig?.props.bushCount
    ? tileConfig.props.bushCount[0] + Math.floor(Math.random() * (tileConfig.props.bushCount[1] - tileConfig.props.bushCount[0] + 1))
    : 8 + Math.floor(Math.random() * 8);
  for (let i = 0; i < bushCount; i++) {
    const p = tryPlace(24, 18);
    if (!p) continue;
    let sprite: Sprite;
    if (tileConfig && tileConfig.props.bushTiles.length > 0) {
      const tileName = tileConfig.props.bushTiles[Math.floor(Math.random() * tileConfig.props.bushTiles.length)];
      const tx = tileTextures[tileName];
      if (!tx) continue;
      sprite = new Sprite(tx);
      sprite.anchor.set(0.5, 1);
    } else {
      sprite = new Sprite(Sprites.bush);
      sprite.anchor.set(0.5, 1);
      sprite.tint = getBiomeTint(biome);
    }
    sprite.x = p.x + 12;
    sprite.y = p.y + 18;
    result.decorations.push({ sprite, x: p.x + 12, y: p.y + 18 });
  }

  // Ambient grass/flowers
  for (let i = 0; i < 20 + Math.floor(Math.random() * 20); i++) {
    const p = tryPlace(8, 8);
    if (!p) continue;
    const isFlower = Math.random() < 0.3;
    const sprite = new Sprite(isFlower ? Sprites.flower : Sprites.grassTuft);
    sprite.anchor.set(0.5, 1);
    sprite.x = p.x + 4;
    sprite.y = p.y + 8;
    sprite.alpha = 0.6 + Math.random() * 0.4;
    result.decorations.push({ sprite, x: p.x + 4, y: p.y + 8 });
  }

  // Chests
  for (let i = 0; i < 4 + Math.floor(Math.random() * 5); i++) {
    const p = tryPlace(28, 20);
    if (!p) continue;
    result.chests.push({ x: p.x + 14, y: p.y + 10 });
  }

  // Breakables
  for (let i = 0; i < 8 + Math.floor(Math.random() * 8); i++) {
    const p = tryPlace(20, 20);
    if (!p) continue;
    result.breakables.push({ x: p.x + 10, y: p.y + 10 });
  }

  return result;
}
