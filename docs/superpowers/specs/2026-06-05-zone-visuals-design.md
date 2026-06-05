# Zone Visual Overhaul — Design Spec

## Overview

Replace programmatic solid-color room visuals with tiled spritesheets for floors, walls, and decorations. Each biome gets a tile config (PNG spritesheet + JSON frame definitions) that drives room rendering. First zone: tutorial. Each subsequent zone follows the same pattern with its own tileset.

## Tile Spritesheet Format

- One PNG + one `tiles.json` per biome (or shared across biomes)
- JSON maps tile names to `{ x, y, w, h }` pixel rectangles in the PNG
- Tiles can be any size — seamless ones get used in `TilingSprite`, variable-sized ones as individual `Sprite` instances
- A `"seamless": true` flag on floor/wall tiles for `TilingSprite` usage

### Example `tiles.json`

```json
{
  "file": "sprites/tiles/tutorial.png",
  "tiles": {
    "grass":        { "x": 0,   "y": 0,   "w": 32, "h": 32, "seamless": true },
    "dirt":         { "x": 32,  "y": 0,   "w": 32, "h": 32, "seamless": true },
    "wall":         { "x": 64,  "y": 0,   "w": 32, "h": 32, "seamless": true },
    "accent_a":     { "x": 96,  "y": 0,   "w": 32, "h": 32 },
    "accent_b":     { "x": 128, "y": 0,   "w": 32, "h": 32 },
    "tree_a":       { "x": 0,   "y": 32,  "w": 64, "h": 96 },
    "tree_b":       { "x": 64,  "y": 32,  "w": 64, "h": 96 }
  }
}
```

## TileConfig

Each zone references a `TileConfig` that tells the rendering system what tiles to use and where to place them.

```typescript
interface TileConfig {
  sheetUrl: string;             // path to PNG
  jsonUrl: string;              // path to tiles.json
  floorTile: string;            // tile name for TilingSprite floor
  wallTile: string;             // tile name for TilingSprite wall
  accentTiles: {
    tiles: string[];            // tile names scattered on floor
    chance: number;             // probability per-cell
  };
  props: {
    treeTiles: string[];        // random variant selection
    bushTiles: string[];
    rockTiles: string[];
    treeCount: [number, number];// min, max per room
    bushCount: [number, number];
    rockCount: [number, number];
  };
  wallTrimColor?: number;       // optional colored border (e.g., 0xcc8844)
  wallTrimAlpha?: number;       // default 0.6
}
```

Stored in a new `src/core/TileConfigs.ts`, keyed by `BiomeId`. Tutorial zone gets its own entry; future zones add theirs.

## Changes to Existing Code

### New file: `src/core/TileConfigs.ts`
- `TILE_CONFIGS: Record<BiomeId, TileConfig>` — defaults for biomes without custom tilesets
- `loadTileTextures(config: TileConfig): Promise<Record<string, Texture>>` — fetches PNG + JSON, returns named texture map

### New file: `src/rendering/TileLoader.ts` (optional merge with TileConfigs)
- `loadTileSheet(url: string, jsonUrl: string): Promise<Frames>` — fetch + createObjectURL for PNG, parse JSON, slice textures via `Spritesheet` or manual `Texture.from()` per frame

### `src/rendering/Sprites.ts`
- Add `tileTextures: Record<string, Texture>` cache
- Add `loadTileSet(biome: BiomeId): Promise<void>` — called at startup alongside other loads

### `src/world/Room.ts` — `build()` method
- Floor: replace `Graphics.drawRect()` with `new TilingSprite(tileTextures[config.floorTile], ROOM_WIDTH, ROOM_HEIGHT)`
- Walls: replace `Graphics.drawRect()` per wall segment with `TilingSprite` instances
- Wall border: keep `Graphics.lineStyle()` border or use config.wallTrimColor
- Accent tiles: scatter config.accentTiles across the floor using rejection sampling (similar to current scatter logic but with Sprites instead of Graphics fills)

### `src/world/RoomDecorator.ts`
- Accept `TileConfig` parameter
- Replace `Sprites.tree`/`Sprites.rock`/`Sprites.bush` references with random selection from `config.props.*Tiles`
- Use `config.props.*Count` ranges instead of hardcoded counts
- Keep existing rejection-sampling placement logic

### `src/core/ZoneConfig.ts`
- Add `tileConfig?: TileConfig` to `ZoneConfig` interface
- Default to programmatic fallback if no `tileConfig` is set

## Tutorial Zone Specifics

**Layout**: Same open rectangle — linear northward path. Dirt road tile down the center as a visual guide.

**Tiles needed from you**:
- `grass`: seamless 32×32 for base floor
- `dirt` or `path`: seamless 32×32 for center path accent
- `wall`: seamless 32×32 for perimeter
- 2–3 accent tiles: grass variants, flowers, pebbles for scatter
- Tree sprites from your tree tileset (any size)

**Lighting pass** (optional stretch): a dark vignette Graphics overlay on the room's edge zones for atmosphere.

## Loading

Tile sets load during the startup loading screen alongside animation loads. Add `loadTileSet('tutorial')` call in `Game.start()`.

## Zone-by-Zone Expansion Pattern

When adding a new zone:
1. Place PNG + `tiles.json` in `sprites/tiles/<zone>.png`
2. Add `TileConfig` entry to `TileConfigs.ts`
3. Set `tileConfig` in the `ZoneConfig`
4. Done — Room and Decorator read the config automatically

## Non-Goals

- No Tiled map parser / `.tmx` support
- No lighting system beyond optional vignette
- No animated tiles (water animation deferred)
- No art creation — user sources PNGs

## Files Changed

- `src/core/TileConfigs.ts` (new)
- `src/rendering/Sprites.ts` — add tile loading
- `src/world/Room.ts` — TilingSprite floor/walls
- `src/world/RoomDecorator.ts` — tile texture props
- `src/core/ZoneConfig.ts` — TileConfig ref on ZoneConfig
- `src/core/Game.ts` — startup loading step
- `public/sprites/tiles/tutorial.png` (user-provided)
- `public/sprites/tiles/tutorial.json` (user-provided)
