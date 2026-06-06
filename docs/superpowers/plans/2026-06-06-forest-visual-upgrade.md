# Verdant Forest Visual Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Verdant Forest to tile-based rendering with rustic autumn palette, ground elevation, and walk-in cabins.

**Architecture:** 7 files modified. Add `CabinData` type and `cabins` to RoomTemplate. Extend `TileConfig` with tint/elevation fields. Add forest tile config reusing tutorial PNGs with different tree sprites and autumn tints. Render cabins as wood structures with interior floor, walls, roof, and door opening. Push cabin walls to room collision (minus door gap) for walk-in access.

**Tech Stack:** TypeScript + PixiJS 7

---

### Task 1: ZoneConfig.ts — Add CabinData interface and extend RoomTemplate

**Files:**
- Modify: `src/core/ZoneConfig.ts`

- [ ] **Step 1: Add CabinData interface after NpcData**

Insert after the `NpcData` interface:

```ts
export interface CabinData {
  x: number;
  y: number;
  width: number;
  height: number;
  doorSide: 'south' | 'north' | 'east' | 'west';
  chestPos: { x: number; y: number };
  spawnZones: { x: number; y: number; width: number; height: number }[];
}
```

- [ ] **Step 2: Add `cabins` field to RoomTemplate**

Add `cabins: CabinData[];` to the `RoomTemplate` interface (after `buildings:`).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to RoomTemplate or missing CabinData

- [ ] **Step 4: Commit**

```bash
git add src/core/ZoneConfig.ts
git commit -m "feat: add CabinData interface and RoomTemplate.cabins field"
```

---

### Task 2: TileConfigs.ts — Extend TileConfig interface and add forest entry

**Files:**
- Modify: `src/core/TileConfigs.ts`

- [ ] **Step 1: Add optional tint fields to TileConfig interface**

Add to the `TileConfig` interface:

```ts
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
```

- [ ] **Step 2: Add forest entry to TILE_CONFIGS**

Add after the `tutorial` entry:

```ts
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/core/TileConfigs.ts
git commit -m "feat: extend TileConfig with tints/elevation, add forest entry"
```

---

### Task 3: ZoneRegistry.ts — Wire tileConfig to forest zone

**Files:**
- Modify: `src/core/ZoneRegistry.ts`

- [ ] **Step 1: Add `tileConfig: 'forest'` to the forest zone config**

Find the forest zone entry and add `tileConfig: 'forest',` after `biome: 'forest',`:

```ts
forest: {
  id: 'forest', name: 'Verdant Forest', biome: 'forest',
  tileConfig: 'forest',
  roomCount: 4, enemyPool: ['grunt', 'archer'],
  ...
},
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/ZoneRegistry.ts
git commit -m "feat: wire forest tileConfig in ZoneRegistry"
```

---

### Task 4: RoomTemplates.ts — Add cabins to forest templates

**Files:**
- Modify: `src/world/RoomTemplates.ts`

- [ ] **Step 1: Add cabins to TEMPLATE_FOREST_1**

Add after `buildings: [],` in TEMPLATE_FOREST_1:

```ts
cabins: [
  {
    x: 1200, y: 1800, width: 350, height: 280,
    doorSide: 'south',
    chestPos: { x: 1350, y: 1900 },
    spawnZones: [{ x: 1310, y: 1900, width: 130, height: 120 }],
  },
  {
    x: 4800, y: 800, width: 350, height: 280,
    doorSide: 'south',
    chestPos: { x: 4950, y: 900 },
    spawnZones: [{ x: 4910, y: 900, width: 130, height: 120 }],
  },
],
```

- [ ] **Step 2: Add cabins to TEMPLATE_FOREST_2**

Add after `buildings: [],` in TEMPLATE_FOREST_2:

```ts
cabins: [
  {
    x: 800, y: 800, width: 350, height: 280,
    doorSide: 'south',
    chestPos: { x: 950, y: 900 },
    spawnZones: [{ x: 910, y: 900, width: 130, height: 120 }],
  },
],
```

- [ ] **Step 3: Add cabins to TEMPLATE_FOREST_3**

Add after `buildings: [],` in TEMPLATE_FOREST_3:

```ts
cabins: [
  {
    x: 3200, y: 1200, width: 350, height: 280,
    doorSide: 'south',
    chestPos: { x: 3350, y: 1300 },
    spawnZones: [{ x: 3310, y: 1300, width: 130, height: 120 }],
  },
],
```

- [ ] **Step 4: Add cabins: [] to all other templates that lack the field**

Search all template definitions and add `cabins: [],` where missing (all templates except the forest ones). This ensures TypeScript doesn't complain about the new required field.

Templates to update: `TEMPLATE_OPEN`, `TEMPLATE_PILLARS`, `TEMPLATE_LSHAPE`, `TEMPLATE_CROSS`, `TEMPLATE_RING`, `TEMPLATE_HUB`, `TEMPLATE_TUTORIAL`, `TEMPLATE_TUTORIAL_CRYPT`, all `TEMPLATE_DESERT_*`, all `TEMPLATE_ICE_*`, `TEMPLATE_ENDLESS_ARENA`, `TEMPLATE_ENDLESS_DUNGEON`, `TEMPLATE_DEV`, `TEMPLATE_CRYPT`.

- [ ] **Step 5: Update cloneTemplate() to deep-clone cabins**

If `cloneTemplate()` in `RoomTemplates.ts` deep-clones arrays, add:
```ts
cabins: t.cabins.map(c => ({
  ...c,
  spawnZones: c.spawnZones.map(z => ({ ...z })),
})),
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/world/RoomTemplates.ts
git commit -m "feat: add cabins to forest room templates"
```

---

### Task 5: Room.ts — Configurable tints, elevation pass, cabin rendering

**Files:**
- Modify: `src/world/Room.ts`

- [ ] **Step 1: Import CabinData**

At the top of the file, add `CabinData` to the import from `../core/ZoneConfig`:

```ts
import { BiomeId, TileConfig, CabinData, BuildingData, NpcData, DoorMarker, PortalMarker } from '../core/ZoneConfig';
```

- [ ] **Step 2: Add cabins field to Room class**

Add `private cabins: CabinData[];` with the other private fields (~line 66).

- [ ] **Step 3: Accept cabins in constructor**

Add `cabins: CabinData[] = []` to the constructor parameters. Assign `this.cabins = cabins;`.

- [ ] **Step 4: Use configurable tints in build() floor section**

Replace the hardcoded `floor.tint = 0x999999;` with:
```ts
floor.tint = tc.floorTint ?? 0x999999;
```

Replace `s.tint = 0x999999;` with:
```ts
s.tint = tc.accentTint ?? 0x999999;
```

- [ ] **Step 5: Add wall tint to wall rendering**

After `const ws = new TilingSprite(wallTx, wall.width, wall.height);` (~line 147), add:
```ts
ws.tint = tc.wallTint ?? 0xffffff;
```

- [ ] **Step 6: Add elevation overlay pass after accent tiles**

After the accent tile block ends (after `})` closing the `if (tc.accentTiles ...)` block, add:

```ts
if (tc.elevation) {
  const elevGfx = new Graphics();
  const seed = this.roomIndex ?? 0;
  for (let i = 0; i < tc.elevation.darkBlobs; i++) {
    const cx = ((seed * 137 + i * 53 + 71) % 157) / 157 * ROOM_WIDTH;
    const cy = ((seed * 251 + i * 97 + 43) % 131) / 131 * ROOM_HEIGHT;
    const rx = 150 + ((seed * 199 + i * 67 + 13) % 100) / 100 * 350;
    const ry = 150 + ((seed * 311 + i * 83 + 59) % 100) / 100 * 350;
    elevGfx.beginFill(0x000000, tc.elevation.darkAlpha);
    elevGfx.drawEllipse(cx, cy, rx, ry);
    elevGfx.endFill();
  }
  for (let i = 0; i < tc.elevation.lightBlobs; i++) {
    const cx = ((seed * 173 + i * 131 + 97) % 157) / 157 * ROOM_WIDTH;
    const cy = ((seed * 229 + i * 89 + 31) % 131) / 131 * ROOM_HEIGHT;
    const rx = 150 + ((seed * 263 + i * 73 + 17) % 100) / 100 * 350;
    const ry = 150 + ((seed * 277 + i * 101 + 47) % 100) / 100 * 350;
    elevGfx.beginFill(0xffffd0, tc.elevation.lightAlpha);
    elevGfx.drawEllipse(cx, cy, rx, ry);
    elevGfx.endFill();
  }
  this.container.addChild(elevGfx);
}
```

- [ ] **Step 7: Add `this.roomIndex` field and accept it from constructor**

Add `private roomIndex: number = 0;` to fields. Accept `roomIndex?: number` in constructor and assign `this.roomIndex = roomIndex ?? 0;`.

- [ ] **Step 8: Add cabin rendering after renderBuildings() call**

Add a call to `this.renderCabins();` in `build()` after `this.renderBuildings();`.

- [ ] **Step 9: Implement renderCabins() method**

Add after `renderBuildings()`:

```ts
private renderCabins() {
  const WALL = 0x8b6b3a;
  const ROOF = 0x5a3020;
  const FLOOR = 0x5a3a2a;
  const CHIMNEY = 0x7a7a7a;

  for (const c of this.cabins) {
    const g = new Graphics();

    // Interior floor
    g.beginFill(FLOOR);
    g.drawRect(c.x + 8, c.y + c.height - 32, c.width - 16, 24);
    g.endFill();

    // Back (north) wall
    g.beginFill(WALL);
    g.drawRect(c.x, c.y, c.width, 8);
    g.endFill();

    // Side walls
    g.drawRect(c.x, c.y, 8, c.height - 24);
    g.drawRect(c.x + c.width - 8, c.y, 8, c.height - 24);

    // Front (south) wall with door gap
    const doorW = c.x + c.width / 2 - 24;
    const doorE = c.x + c.width / 2 + 24;
    // Left of door
    g.drawRect(c.x, c.y + c.height - 32, doorW - c.x, 8);
    // Right of door
    g.drawRect(doorE, c.y + c.height - 32, c.x + c.width - doorE, 8);

    // Plank lines on side walls
    g.lineStyle(1, 0x7a5a2a, 0.4);
    for (let sy = c.y + 20; sy < c.y + c.height - 40; sy += 20) {
      g.moveTo(c.x + 8, sy);
      g.lineTo(c.x + c.width - 8, sy);
    }
    g.lineStyle(0);

    // Roof (triangle overhang)
    g.beginFill(ROOF);
    g.moveTo(c.x - 12, c.y);
    g.lineTo(c.x + c.width / 2, c.y - 32);
    g.lineTo(c.x + c.width + 12, c.y);
    g.closePath();
    g.endFill();

    // Chimney
    g.beginFill(CHIMNEY);
    g.drawRect(c.x + c.width - 40, c.y - 48, 28, 48);
    g.endFill();

    // Door dark interior
    g.beginFill(0x2a1a0a);
    g.drawRect(c.x + c.width / 2 - 14, c.y + c.height - 36, 28, 36);
    g.endFill();

    this.container.addChild(g);
  }
}
```

- [ ] **Step 10: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add src/world/Room.ts
git commit -m "feat: configurable tile tints, elevation overlay, cabin rendering in Room"
```

---

### Task 6: RoomDecorator.ts — Apply propTint to tile-based props

**Files:**
- Modify: `src/world/RoomDecorator.ts`

- [ ] **Step 1: Apply propTint to tile-based trees**

In the tree section, after `sprite = new Sprite(tx); sprite.anchor.set(0.5, 1);` (lines 92-93), add:

```ts
if (tileConfig.propTint !== undefined) {
  const variance = 1 + (Math.random() - 0.5) * 0.16;
  sprite.tint = applyTintVariance(tileConfig.propTint, variance);
}
```

- [ ] **Step 2: Apply propTint to tile-based rocks (same pattern)**

In the rock section, after `sprite = new Sprite(tx); sprite.anchor.set(0.5, 1);` (lines 117-118), add the same tint block.

- [ ] **Step 3: Apply propTint to tile-based bushes (same pattern)**

In the bush section, after `sprite = new Sprite(tx); sprite.anchor.set(0.5, 1);` (lines 142-143), add the same tint block.

- [ ] **Step 4: Add the applyTintVariance helper function**

Add before the `decorateRoom` function:

```ts
function applyTintVariance(base: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((base >> 16) & 0xff) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((base >> 8) & 0xff) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((base & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/world/RoomDecorator.ts
git commit -m "feat: apply propTint to tile-based props with variance"
```

---

### Task 7: Game.ts — Cabin collision, spawn, chest wiring

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Pass cabin data to Room constructor**

Find the `new Room(...)` call (~line 939). Add `template.cabins` to the constructor arguments (and add a `roomIndex` parameter if the Room constructor now expects it).

- [ ] **Step 2: Add cabin wall collision after room creation**

After the Room is created (~line 950 area), add:

```ts
// Cabin collision walls (with door gaps)
for (const c of template.cabins) {
  const doorW = c.width / 2 - 24;
  // North wall (full width)
  this.room.walls.push({ x: c.x, y: c.y, width: c.width, height: 8 });
  // East wall (full height)
  this.room.walls.push({ x: c.x + c.width - 8, y: c.y, width: 8, height: c.height });
  // West wall (full height)
  this.room.walls.push({ x: c.x, y: c.y, width: 8, height: c.height });
  // South wall — left of door
  this.room.walls.push({ x: c.x, y: c.y + c.height - 32, width: doorW, height: 8 });
  // South wall — right of door
  this.room.walls.push({ x: c.x + c.width / 2 + 24, y: c.y + c.height - 32, width: c.width / 2 - 24, height: 8 });
}
```

- [ ] **Step 3: Add cabin spawn zones to room spawn zones**

After cabin collision walls, add:

```ts
// Cabin interior spawn zones
for (const c of template.cabins) {
  for (const sz of c.spawnZones) {
    this.currentRoomSpawnZones.push(sz);
  }
}
```

- [ ] **Step 4: Create cabin chests**

After cabin spawn zones, add:

```ts
// Cabin chests
for (const c of template.cabins) {
  const chest = new Chest(c.chestPos.x, c.chestPos.y);
  chest.container.zIndex = 4;
  this.gameContainer.addChild(chest.container);
  this.chests.push(chest);
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: cabin collision, spawn zones, and chests in Game"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address review feedback and type errors"
```
