# Zone Visual Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace programmatic solid-color room visuals with tiled spritesheets — floors, walls, and decorations driven by `TileConfig` per biome. First up: tutorial zone.

**Architecture:** Each biome gets a `TileConfig` (spritesheet PNG + JSON frame map). `Room.build()` uses `TilingSprite` for floor/walls and scatter tiles from the config. `RoomDecorator` picks tile textures instead of programmatic sprites. A `TileLoader` module handles fetch + slice + cache.

**Tech Stack:** TypeScript, PixiJS 7 (`TilingSprite`, `Texture`, `Spritesheet`), Vite 5

---

### Task 1: TileConfig types and default registry

**Files:**
- Create: `src/core/TileConfigs.ts`
- Modify: `src/core/ZoneConfig.ts` — add `tileConfig?: string` (refs a biome key)

- [ ] **Step 1: Define TileConfig interface and default fallback**

Create `src/core/TileConfigs.ts`:

```typescript
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
```

Leave `TILE_CONFIGS` empty for now — tutorial config will be added in Task 6 when the user provides assets.

- [ ] **Step 2: Add tileConfig field to ZoneConfig**

Edit `src/core/ZoneConfig.ts`, add to the `ZoneConfig` interface:

```typescript
export interface ZoneConfig {
  id: string;
  name: string;
  biome: BiomeId;
  tileConfig?: string;     // key into TILE_CONFIGS, or undefined for programmatic fallback
  // ... existing fields unchanged ...
}
```

- [ ] **Step 3: Commit**

```bash
git add src/core/TileConfigs.ts src/core/ZoneConfig.ts
git commit -m "feat: add TileConfig interface and ZoneConfig.tileConfig field"
```

---

### Task 2: Tile loader (PNG + JSON → named textures)

**Files:**
- Create: `src/rendering/TileLoader.ts`

- [ ] **Step 1: Write tile loader function**

Create `src/rendering/TileLoader.ts`:

```typescript
import { Texture, BaseTexture } from 'pixi.js';

interface TileFrame {
  x: number; y: number; w: number; h: number;
  seamless?: boolean;
}

interface TileSheetData {
  file: string;
  tiles: Record<string, TileFrame>;
}

export async function loadTileSheet(sheetUrl: string, jsonUrl: string): Promise<Record<string, Texture>> {
  const [jsonRes, pngRes] = await Promise.all([
    fetch(jsonUrl).then(r => r.json() as Promise<TileSheetData>),
    fetch(sheetUrl).then(r => r.blob()),
  ]);

  const blobUrl = URL.createObjectURL(pngRes);
  const img = new Image();
  img.src = blobUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const base = new BaseTexture(img);
  const textures: Record<string, Texture> = {};

  for (const [name, frame] of Object.entries(jsonRes.tiles)) {
    textures[name] = new Texture(base, new Rectangle(frame.x, frame.y, frame.w, frame.h));
  }

  URL.revokeObjectURL(blobUrl);
  return textures;
}
```

Import `Rectangle` from `pixi.js`:

```typescript
import { Texture, BaseTexture, Rectangle } from 'pixi.js';
```

- [ ] **Step 2: Commit**

```bash
git add src/rendering/TileLoader.ts
git commit -m "feat: add TileLoader for PNG+JSON spritesheets"
```

---

### Task 3: TilingSprite floor and walls in Room

**Files:**
- Modify: `src/world/Room.ts`

- [ ] **Step 1: Import TilingSprite and tile config**

Add to imports in `Room.ts`:

```typescript
import { Container, Graphics, Text, TextStyle, TilingSprite } from 'pixi.js';
import { tileTextures, TILE_CONFIGS } from '../core/TileConfigs';
```

- [ ] **Step 2: Replace floor Graphics with TilingSprite**

In `Room.build()`, replace the solid floor and scatter Graphics with a tiled floor:

```typescript
private build() {
  const tc = this.biomeId ? TILE_CONFIGS[this.biomeId] : undefined;
  const tx = tc && tileTextures[tc.floorTile];

  if (tx) {
    const floor = new TilingSprite(tx, ROOM_WIDTH, ROOM_HEIGHT);
    this.container.addChild(floor);

    // Scatter accent tiles
    if (tc.accentTiles && tc.accentTiles.tiles.length > 0) {
      const accentContainer = new Container();
      for (let i = 0; i < 200; i++) {
        const tileName = tc.accentTiles.tiles[Math.floor(Math.random() * tc.accentTiles.tiles.length)];
        const accentTx = tileTextures[tileName];
        if (!accentTx) continue;
        const s = new Sprite(accentTx);
        s.x = Math.random() * ROOM_WIDTH;
        s.y = Math.random() * ROOM_HEIGHT;
        s.alpha = 0.3 + Math.random() * 0.4;
        accentContainer.addChild(s);
      }
      this.container.addChild(accentContainer);
    }
  } else {
    // Fallback: programmatic floor
    const floor = new Graphics().beginFill(this.biomeData.floorColor).drawRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT).endFill();
    this.container.addChild(floor);
    // ... existing scatter Graphics ...
  }

  // Walls
  if (tx && tc.wallTile && tileTextures[tc.wallTile]) {
    const wallTx = tileTextures[tc.wallTile];
    const walls = [
      { x: 0, y: 0, w: ROOM_WIDTH, h: WALL_THICKNESS },
      { x: 0, y: ROOM_HEIGHT - WALL_THICKNESS, w: ROOM_WIDTH, h: WALL_THICKNESS },
      { x: 0, y: 0, w: WALL_THICKNESS, h: ROOM_HEIGHT },
      { x: ROOM_WIDTH - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: ROOM_HEIGHT },
    ];
    for (const wall of walls) {
      const ws = new TilingSprite(wallTx, wall.w, wall.h);
      ws.x = wall.x;
      ws.y = wall.y;
      this.container.addChild(ws);
    }

    // Optional trim border
    if (tc.wallTrimColor !== undefined) {
      const trim = new Graphics();
      trim.lineStyle(2, tc.wallTrimColor, tc.wallTrimAlpha ?? 0.6);
      // ... draw border rects for each wall face ...
      trim.drawRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      this.container.addChild(trim);
    }
  } else {
    // Fallback: programmatic walls
    const wallGfx = new Graphics().beginFill(this.biomeData.wallColor);
    // ... existing wall drawing ...
  }

  // ... rest of build (decorations, buildings, etc.) unchanged ...
}
```

Import `Sprite` from pixi.js:

```typescript
import { Container, Graphics, Text, TextStyle, TilingSprite, Sprite } from 'pixi.js';
```

- [ ] **Step 3: Store biomeId on Room for config lookup**

Add a field to the `Room` class:

```typescript
export class Room {
  container: Container;
  walls: Rect[] = [];
  walkableArea: Rect;
  biomeData: BiomeData;
  biomeId: BiomeId;       // NEW
  // ...
```

Set it in the constructor:

```typescript
constructor(biome: BiomeId = 'dev', ...) {
  this.biomeId = biome;   // NEW
  // ...
}
```

- [ ] **Step 4: Commit**

```bash
git add src/world/Room.ts
git commit -m "feat: TilingSprite floor and walls with tile config fallback"
```

---

### Task 4: RoomDecorator tile integration

**Files:**
- Modify: `src/world/RoomDecorator.ts`

- [ ] **Step 1: Accept TileConfig and use tile textures**

Update `decorateRoom()` signature:

```typescript
import { TileConfig, tileTextures } from '../core/TileConfigs';

export function decorateRoom(template: RoomTemplate, biome: BiomeId, tileConfig?: TileConfig): DecoratorResult {
```

Replace hardcoded `Sprites.tree`/`Sprites.rock`/`Sprites.bush` references:

```typescript
// Trees
const treeTexName = tileConfig?.props.treeTiles[Math.floor(Math.random() * (tileConfig?.props.treeTiles.length ?? 1))];
const treeTex = treeTexName ? tileTextures[treeTexName] : Sprites.tree;
const sprite = new Sprite(treeTex);
sprite.anchor.set(0.5, 1);
```

Same pattern for rocks, bushes, chests, breakables. Use `tileConfig.props.*Count` ranges instead of hardcoded counts:

```typescript
const treeCount = tileConfig?.props.treeCount
  ? tileConfig.props.treeCount[0] + Math.floor(Math.random() * (tileConfig.props.treeCount[1] - tileConfig.props.treeCount[0] + 1))
  : 10 + Math.floor(Math.random() * 8);
for (let i = 0; i < treeCount; i++) { ... }
```

Same for rocks and bushes. Keep programmatic fallback when no tileConfig is provided (current behavior unchanged).

- [ ] **Step 2: Pass tileConfig from Game.ts**

In `Game.ts` `buildCurrentZoneRoom()`, find the call to `decorateRoom()` and pass the tileConfig:

```typescript
const tileConfig = zone.tileConfig ? TILE_CONFIGS[zone.tileConfig] : undefined;
const decor = decorateRoom(template, zone.biome, tileConfig);
```

- [ ] **Step 3: Commit**

```bash
git add src/world/RoomDecorator.ts src/core/Game.ts
git commit -m "feat: RoomDecorator uses tile config textures and counts"
```

---

### Task 5: Startup loading integration

**Files:**
- Modify: `src/rendering/Sprites.ts`
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add loadTileSet export to Sprites.ts**

```typescript
import { loadTileSheet } from './TileLoader';
import { TILE_CONFIGS, setTileTextures } from '../core/TileConfigs';

export async function loadTileSet(biomeId: string): Promise<void> {
  const config = TILE_CONFIGS[biomeId];
  if (!config) return;
  const textures = await loadTileSheet(config.sheetUrl, config.jsonUrl);
  // Merge into global tileTextures
  setTileTextures({ ...tileTextures, ...textures });
}
```

- [ ] **Step 2: Add to loading screen in Game.ts**

In `Game.start()`, add the tutorial tile load to the `Promise.all`:

```typescript
// Add if TILE_CONFIGS has an entry for tutorial
if (TILE_CONFIGS['tutorial']) {
  loadingTasks.push(loadTileSet('tutorial'));
}
await Promise.all(loadingTasks);
```

Since `TILE_CONFIGS` starts empty, this is a no-op until tiles are configured — so it's safe to add now.

- [ ] **Step 3: Commit**

```bash
git add src/rendering/Sprites.ts src/core/Game.ts
git commit -m "feat: add tile set loading to startup sequence"
```

---

### Task 6: Tutorial tile config and zone wiring

**Files:**
- Modify: `src/core/TileConfigs.ts`
- Modify: `src/world/RoomTemplates.ts` (or `ZoneConfig.ts` — wherever tutorial ZoneConfig is defined)

- [ ] **Step 1: Add tutorial TileConfig**

In `TileConfigs.ts`, add the tutorial entry:

```typescript
TILE_CONFIGS['tutorial'] = {
  sheetUrl: 'sprites/tiles/tutorial.png',
  jsonUrl: 'sprites/tiles/tutorial.json',
  floorTile: 'grass',
  wallTile: 'wall',
  accentTiles: {
    tiles: ['accent_a', 'accent_b'],
    chance: 0.15,
  },
  props: {
    treeTiles: ['tree_a', 'tree_b'],
    bushTiles: ['bush'],
    rockTiles: ['rock'],
    treeCount: [6, 10],
    bushCount: [4, 8],
    rockCount: [3, 6],
  },
  wallTrimColor: 0xcc8844,
  wallTrimAlpha: 0.5,
};
```

- [ ] **Step 2: Wire tileConfig key into tutorial ZoneConfig**

Find the tutorial `ZoneConfig` in the registry and add:

```typescript
{
  id: 'tutorial',
  // ... existing fields ...
  tileConfig: 'tutorial',   // NEW
}
```

- [ ] **Step 3: Verify everything compiles**

Run: `npx tsc --noEmit`
Expected: exit code 0, no errors

- [ ] **Step 4: Commit**

```bash
git add src/core/TileConfigs.ts src/core/Game.ts
git commit -m "feat: tutorial TileConfig and zone wiring"
```

---

### Task 7: User-provided assets

**Files:**
- Place: `public/sprites/tiles/tutorial.png` (user provides)
- Place: `public/sprites/tiles/tutorial.json` (user provides)

- [ ] **Step 1: Place tileset files**

Copy the user's tutorial PNG and JSON into `public/sprites/tiles/`:

```
public/sprites/tiles/tutorial.png
public/sprites/tiles/tutorial.json
```

- [ ] **Step 2: Verify tile names match config**

Check that the tile names in `tutorial.json` match what `TILE_CONFIGS['tutorial']` references:
- Must have: `grass`, `wall`, `accent_a`, `accent_b`, `tree_a`, `tree_b`, `bush`, `rock`

If names differ, update `TILE_CONFIGS['tutorial']` to match the JSON keys.

- [ ] **Step 3: Run build to verify bundling**

Run: `npm run build`
Expected: exit code 0, tiles copied to dist/sprites/tiles/

- [ ] **Step 4: Commit**

```bash
git add public/sprites/tiles/
git commit -m "feat: add tutorial zone tileset assets"
```

---

### Self-Review Checklist

- [ ] All 7 tasks produce working, testable output independently
- [ ] No TBD/TODO/placeholder code
- [ ] Fallback to programmatic rendering works when no TileConfig is set (existing zones unaffected)
- [ ] Type signatures consistent across all tasks
- [ ] `TILE_CONFIGS` starts empty for backward compatibility
