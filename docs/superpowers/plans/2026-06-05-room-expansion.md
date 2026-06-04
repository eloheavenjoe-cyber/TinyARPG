# Room Expansion & Camera System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Scale rooms to 6400×3584, add player-following camera, procedurally decorate with obstacles/chests/breakables.

**Architecture:** New `Camera.ts` smoothly follows the player and offsets `gameContainer`. `RoomDecorator.ts` populates large rooms with biome-specific trees, rocks, chests, and breakables via rejection sampling. New `Chest.ts` and `Breakable.ts` entities add interactivity. Existing collision and zone systems are reused.

**Tech Stack:** TypeScript, PixiJS 7 (Container/Graphics/Text/Texture), no external deps. Verification via `npx tsc --noEmit`.

---

### Task 1: Create Camera class

**Files:**
- Create: `src/core/Camera.ts`

- [ ] **Step 1: Create Camera.ts**

```typescript
export class Camera {
  x = 0;
  y = 0;
  private targetX = 0;
  private targetY = 0;
  private readonly lerpSpeed = 0.05;

  constructor(
    private screenWidth: number,
    private screenHeight: number,
    private roomWidth: number,
    private roomHeight: number,
  ) {}

  update(playerX: number, playerY: number, dt: number) {
    this.targetX = playerX - this.screenWidth / 2;
    this.targetY = playerY - this.screenHeight / 2;

    // Clamp so no dead space beyond room edges
    this.targetX = Math.max(0, Math.min(this.roomWidth - this.screenWidth, this.targetX));
    this.targetY = Math.max(0, Math.min(this.roomHeight - this.screenHeight, this.targetY));

    // Smooth lerp
    this.x += (this.targetX - this.x) * this.lerpSpeed * dt;
    this.y += (this.targetY - this.y) * this.lerpSpeed * dt;
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 2: Update room dimension constants

**Files:**
- Modify: `src/world/Room.ts:12-15`

- [ ] **Step 1: Bump constants**

Edit `src/world/Room.ts`:

oldString:
```
export const ROOM_WIDTH = 1600;
export const ROOM_HEIGHT = 896;
const TILE_SIZE = 32;
const WALL_THICKNESS = 32;
```

newString:
```
export const ROOM_WIDTH = 6400;
export const ROOM_HEIGHT = 3584;
const TILE_SIZE = 32;
const WALL_THICKNESS = 48;
```

- [ ] **Step 2: Update the door/portal render helper comments and any hardcoded Y=828 values**

In `src/world/Room.ts`, find door Y=828 references:

oldString (line 146-ish):
```
    { rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 },
```
This is in templates, not Room.ts — handled in Task 3.

In `src/core/ZoneManager.ts` line 78, the fallback spawn zone uses hardcoded `ROOM_WIDTH - 128` / `ROOM_HEIGHT - 128` which is calculated dynamically — already fine.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No new errors

---

### Task 3: Scale all room templates to 4x

**Files:**
- Modify: `src/world/RoomTemplates.ts`

**Approach:** `WALL_T` (the padding constant) stays at 32 — it's used as margin offset, not wall size. All explicit literal coordinates, widths, and heights get multiplied by 4. Expressions using `ROOM_WIDTH`, `ROOM_HEIGHT`, or `WALL_T` auto-scale from the updated constants.

- [ ] **Step 1: Scale every template field**

Transform all explicit numeric values across every template (TEMPLATE_OPEN through TEMPLATE_ICE_BOSS). Each replaces `{ x: N, y: N, ... }` with `{ x: N*4, y: N*4, ... }` for x/y/width/height.

Key examples of changed values:

| Old | New | Where |
|---|---|---|
| `WALL_T = 32` | stays 32 | Line 4 |
| `{ x: 680, y: 340, width: 40, height: 40 }` | `{ x: 2720, y: 1360, width: 160, height: 160 }` | Pillar walls |
| `{ x: 750, y: 828, width: 100, height: 36 }` | `{ x: 3000, y: 3312, width: 400, height: 144 }` | Door rects |
| `{ x: 750, y: 0, width: 100, height: 36 }` | `{ x: 3000, y: 0, width: 400, height: 144 }` | Top doors |
| `{ x: 1520, y: 400, width: 36, height: 80 }` | `{ x: 6080, y: 1600, width: 144, height: 320 }` | Side doors |
| `{ x: 64, y: 64, width: 1472, height: 768 }` | `{ x: 64, y: 64, width: 5888, height: 3072 }` | Spawn zones |
| `{ x: 50, y: 80, width: 80, height: 80 }` | `{ x: 200, y: 320, width: 320, height: 320 }` | Hub portals |
| `{ x: 1470, y: 80 }` | `{ x: 5880, y: 320 }` | Hub portals |
| `{ x: 1470, y: 400 }` | `{ x: 5880, y: 1600 }` | Hub portals |
| `{ x: 1470, y: 720 }` | `{ x: 5880, y: 2880 }` | Hub portals |
| `{ x: 200, y: 150, width: 14, height: 14 }` | `{ x: 800, y: 600, width: 56, height: 56 }` | Decor rects |
| `{ x: 200, y: 300, width: 160, height: 120 }` | `{ x: 800, y: 1200, width: 640, height: 480 }` | Hub buildings |
| `{ x: 1240, y: 300 }` | `{ x: 4960, y: 1200 }` | Hub buildings |
| `{ x: 280, y: 440 }` | `{ x: 1120, y: 1760 }` | Hub NPCs |
| `{ x: 1320, y: 440 }` | `{ x: 5280, y: 1760 }` | Hub NPCs |
| `playerStart: { x: 800, y: 448 }` | `playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 }` | All starts |

For templates that currently use `playerStart: { x: 800, y: 448 }`, replace with `playerStart: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 }` (so it auto-centers). For templates with non-center starts, multiply by 4.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 4: Wire camera into Game.ts

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Import Camera**

Add after `import { InputManager } from './InputManager';`:
```typescript
import { Camera } from './Camera';
```

- [ ] **Step 2: Reduce player base speed slightly**

Rooms are 4x bigger but the visible area is the same. Player speed of 6 will feel slow for crossing rooms. Increase to 8 in `src/entities/Player.ts` line ~39:

oldString:
```
  private baseSpeed = 6;
```
newString:
```
  private baseSpeed = 8;
```

- [ ] **Step 3: Add camera field**

After `private zoneManager: ZoneManager = new ZoneManager();` (line 72), add:
```typescript
private camera?: Camera;
```

- [ ] **Step 4: Remove old offset constants**

Remove lines 31-32:
oldString:
```
const ROOM_OFFSET_X = (SCREEN_WIDTH - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = (SCREEN_HEIGHT - ROOM_HEIGHT) / 2;
```
newString: (empty)

- [ ] **Step 5: Init camera in startGame**

In `startGame()` (line 190), replace:
```typescript
this.gameContainer.x = ROOM_OFFSET_X;
this.gameContainer.y = ROOM_OFFSET_Y;
```
with:
```typescript
this.camera = new Camera(SCREEN_WIDTH, SCREEN_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT);
this.gameContainer.x = 0;
this.gameContainer.y = 0;
```

- [ ] **Step 6: Add camera update to game loop**

In `updateGameplay()`, after `this.portalAngle += dt * 0.03;` (around line 517), add:
```typescript
// Update camera
if (this.camera) {
  this.camera.update(this.player.x, this.player.y, dt);
  this.gameContainer!.x = -this.camera.x;
  this.gameContainer!.y = -this.camera.y;
}
```

- [ ] **Step 7: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 5: Add decoration textures to Sprites

**Files:**
- Modify: `src/rendering/Sprites.ts`

- [ ] **Step 1: Add static texture fields after `static floor: Texture;`**

```typescript
static tree: Texture;
static rock: Texture;
static bush: Texture;
static chestClosed: Texture;
static chestOpen: Texture;
static breakablePot: Texture;
static breakableBarrel: Texture;
static grassTuft: Texture;
static flower: Texture;
```

- [ ] **Step 2: Add texture generation at end of `generateAll()`**

Before the closing `}` of `generateAll()`, add:

```typescript
Sprites.tree = Sprites.createTexture(48, 64, (ctx) => {
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(20, 32, 8, 32);
  ctx.fillStyle = '#3a7a28';
  ctx.beginPath();
  ctx.arc(24, 24, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a6a1a';
  ctx.beginPath();
  ctx.arc(16, 20, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 20, 12, 0, Math.PI * 2);
  ctx.fill();
});

Sprites.rock = Sprites.createTexture(36, 28, (ctx) => {
  ctx.fillStyle = '#6a6a6a';
  ctx.beginPath();
  ctx.ellipse(18, 22, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a7a7a';
  ctx.beginPath();
  ctx.ellipse(14, 18, 10, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();
});

Sprites.bush = Sprites.createTexture(32, 24, (ctx) => {
  ctx.fillStyle = '#2a6a1a';
  ctx.beginPath();
  ctx.ellipse(16, 18, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a8a2a';
  ctx.beginPath();
  ctx.ellipse(10, 14, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(22, 14, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
});

Sprites.chestClosed = Sprites.createTexture(32, 24, (ctx) => {
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(4, 8, 24, 16);
  ctx.fillStyle = '#a07a4a';
  ctx.fillRect(4, 8, 24, 6);
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(4, 8, 24, 2);
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(14, 14, 4, 4);
});

Sprites.chestOpen = Sprites.createTexture(32, 24, (ctx) => {
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(4, 12, 24, 12);
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(4, 8, 24, 6);
  ctx.fillStyle = '#a07a4a';
  ctx.fillRect(4, 8, 24, 3);
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(14, 16, 4, 4);
});

Sprites.breakablePot = Sprites.createTexture(20, 24, (ctx) => {
  ctx.fillStyle = '#8a5030';
  ctx.fillRect(4, 8, 12, 14);
  ctx.fillStyle = '#9a6040';
  ctx.fillRect(6, 6, 8, 4);
  ctx.fillStyle = '#6a3a20';
  ctx.fillRect(2, 20, 4, 4);
  ctx.fillRect(14, 20, 4, 4);
});

Sprites.breakableBarrel = Sprites.createTexture(28, 28, (ctx) => {
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(2, 6, 24, 20);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(2, 6, 24, 3);
  ctx.fillRect(2, 23, 24, 3);
  ctx.fillRect(0, 12, 28, 2);
  ctx.fillRect(0, 18, 28, 2);
  ctx.fillStyle = '#4a2a0a';
  ctx.fillRect(10, 2, 8, 6);
});

Sprites.grassTuft = Sprites.createTexture(12, 12, (ctx) => {
  ctx.fillStyle = '#4a9a2a';
  ctx.fillRect(2, 6, 2, 6);
  ctx.fillRect(5, 4, 2, 8);
  ctx.fillRect(8, 6, 2, 6);
});

Sprites.flower = Sprites.createTexture(10, 12, (ctx) => {
  ctx.fillStyle = '#3a7a1a';
  ctx.fillRect(4, 6, 2, 6);
  ctx.fillStyle = '#ff6688';
  ctx.fillRect(3, 2, 4, 4);
  ctx.fillStyle = '#ffaa44';
  ctx.fillRect(4, 3, 2, 2);
});
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 6: Create RoomDecorator

**Files:**
- Create: `src/world/RoomDecorator.ts`

- [ ] **Step 1: Create RoomDecorator.ts**

```typescript
import { RoomTemplate, BiomeId } from '../core/ZoneConfig';
import { ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, Rect } from './Room';
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

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

const BIOME_DECOR: Record<BiomeId, { treeChance: number; rockChance: number; bushChance: number }> = {
  forest:   { treeChance: 0.5, rockChance: 0.2, bushChance: 0.3 },
  desert:   { treeChance: 0.1, rockChance: 0.6, bushChance: 0.3 },
  ice:      { treeChance: 0.3, rockChance: 0.4, bushChance: 0.3 },
  hub:      { treeChance: 0.3, rockChance: 0.2, bushChance: 0.5 },
  tutorial: { treeChance: 0.4, rockChance: 0.3, bushChance: 0.3 },
  endless:  { treeChance: 0.3, rockChance: 0.4, bushChance: 0.3 },
  dev:      { treeChance: 0, rockChance: 0, bushChance: 0 },
};

function getBiomeTint(biome: BiomeId): number {
  switch (biome) {
    case 'forest': return 0x449933;
    case 'desert': return 0xcc8844;
    case 'ice': return 0x88ccff;
    case 'hub': return 0x44aa66;
    case 'tutorial': return 0x559944;
    case 'endless': return 0x664488;
    default: return 0x888888;
  }
}

export function decorateRoom(template: RoomTemplate, biome: BiomeId): DecoratorResult {
  const result: DecoratorResult = { decorations: [], obstacles: [], chests: [], breakables: [] };
  const config = BIOME_DECOR[biome];
  if (!config || config.treeChance === 0) return result;

  const blockedRects: Rect[] = [
    ...template.walls,
    ...template.doors.map(d => d.rect),
    ...template.portals.map(p => p.rect),
    ...template.spawnZones,
    ...template.buildings.map(b => ({ x: b.x, y: b.y, width: b.width, height: b.height })),
  ];

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
  for (let i = 0; i < 10 + Math.floor(Math.random() * 8); i++) {
    const p = tryPlace(32, 32);
    if (!p) continue;
    const sprite = new Sprite(Sprites.tree);
    sprite.anchor.set(0.5, 1);
    sprite.x = p.x + 16;
    sprite.y = p.y + 32;
    sprite.tint = getBiomeTint(biome);
    result.decorations.push({ sprite, x: p.x + 16, y: p.y + 32 });
    result.obstacles.push({ x: p.x + 4, y: p.y + 4, width: 24, height: 24 });
  }

  // Rocks (collision obstacles)
  for (let i = 0; i < 6 + Math.floor(Math.random() * 6); i++) {
    const p = tryPlace(24, 20);
    if (!p) continue;
    const sprite = new Sprite(Sprites.rock);
    sprite.anchor.set(0.5, 1);
    sprite.x = p.x + 12;
    sprite.y = p.y + 20;
    sprite.tint = getBiomeTint(biome);
    result.decorations.push({ sprite, x: p.x + 12, y: p.y + 20 });
    result.obstacles.push({ x: p.x + 2, y: p.y + 2, width: 20, height: 16 });
  }

  // Bushes (decorative only)
  for (let i = 0; i < 8 + Math.floor(Math.random() * 8); i++) {
    const p = tryPlace(24, 18);
    if (!p) continue;
    const sprite = new Sprite(Sprites.bush);
    sprite.anchor.set(0.5, 1);
    sprite.x = p.x + 12;
    sprite.y = p.y + 18;
    sprite.tint = getBiomeTint(biome);
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
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 7: Create Chest entity

**Files:**
- Create: `src/entities/Chest.ts`

- [ ] **Step 1: Create Chest.ts**

```typescript
import { Container, Sprite, Text, TextStyle } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Rect } from '../world/Room';

export class Chest {
  container: Container;
  private sprite: Sprite;
  private interactLabel: Text;
  isOpen = false;
  x: number;
  y: number;
  readonly width = 28;
  readonly height = 20;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container = new Container();
    this.sprite = new Sprite(Sprites.chestClosed);
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);

    this.interactLabel = new Text('Open [E]', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffff88',
    }));
    this.interactLabel.anchor.set(0.5, 0);
    this.interactLabel.y = -18;
    this.interactLabel.visible = false;
    this.container.addChild(this.interactLabel);
    this.container.x = x;
    this.container.y = y;
  }

  getBounds(): Rect {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
  }

  showPrompt(visible: boolean) {
    this.interactLabel.visible = visible;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.sprite.texture = Sprites.chestOpen;
    this.interactLabel.visible = false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 8: Create Breakable entity

**Files:**
- Create: `src/entities/Breakable.ts`

- [ ] **Step 1: Create Breakable.ts**

```typescript
import { Container, Sprite } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Rect } from '../world/Room';

export class Breakable {
  container: Container;
  private sprite: Sprite;
  hp = 1;
  x: number;
  y: number;
  readonly width = 20;
  readonly height = 20;
  alive = true;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container = new Container();
    this.sprite = new Sprite(Math.random() < 0.5 ? Sprites.breakablePot : Sprites.breakableBarrel);
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);
    this.container.x = x;
    this.container.y = y;
  }

  getBounds(): Rect {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
  }

  takeDamage(): boolean {
    if (!this.alive) return false;
    this.hp--;
    if (this.hp <= 0) {
      this.alive = false;
      this.container.visible = false;
      return true;
    }
    return false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 9: Wire RoomDecorator, Chests, Breakables into Game.ts

**Files:**
- Modify: `src/core/Game.ts`
- Modify: `src/entities/ItemDrop.ts` (if `spawnRandomLootAt` doesn't exist)
- Modify: `src/core/Game.ts` (breakable hit detection in 3 places)

- [ ] **Step 1: Add imports**

Add after existing ItemDrop import (line 16):
```typescript
import { decorateRoom } from '../world/RoomDecorator';
import { Chest } from '../entities/Chest';
import { Breakable } from '../entities/Breakable';
```

- [ ] **Step 2: Add arrays**

After `private itemDrops: ItemDrop[] = [];` (line 68), add:
```typescript
private chests: Chest[] = [];
private breakables: Breakable[] = [];
```

- [ ] **Step 3: Clear new entities in buildCurrentZoneRoom**

In `buildCurrentZoneRoom()`, after `this.itemDrops = [];` (line 230), add:
```typescript
for (const c of this.chests) { this.gameContainer.removeChild(c.container); c.destroy(); }
for (const b of this.breakables) { this.gameContainer.removeChild(b.container); b.destroy(); }
this.chests = [];
this.breakables = [];
```

- [ ] **Step 4: Run decorator after room creation**

In `buildCurrentZoneRoom()`, after `this.gameContainer.addChild(this.room.container);` (line 261), add:
```typescript
// Procedural decoration
const decor = decorateRoom(template, zone.biome);
for (const d of decor.decorations) this.gameContainer.addChild(d.sprite);
for (const ob of decor.obstacles) this.room.walls.push(ob);
for (const cp of decor.chests) {
  const chest = new Chest(cp.x, cp.y);
  this.chests.push(chest);
  this.gameContainer.addChild(chest.container);
}
for (const bp of decor.breakables) {
  const brk = new Breakable(bp.x, bp.y);
  this.breakables.push(brk);
  this.gameContainer.addChild(brk.container);
}
```

- [ ] **Step 5: Add chest interaction + breakable loot helper methods**

Add these methods to the Game class (before `updateGameplay` or after `spawnBoss`):

```typescript
private spawnChestLoot(cx: number, cy: number) {
  // Chests drop more loot than enemies: guaranteed gold + items
  for (const drop of createRandomLoot(cx, cy, 3)) {
    this.itemDrops.push(drop);
    this.gameContainer!.addChild(drop.container);
  }
  // Guaranteed item drop
  const gen = generateItemDrop(this.player?.level);
  const iDrop = createItemDrop(cx, cy, gen);
  this.itemDrops.push(iDrop);
  this.gameContainer!.addChild(iDrop.container);
  // 30% chance for a second item
  if (Math.random() < 0.3) {
    const gen2 = generateItemDrop(this.player?.level);
    const iDrop2 = createItemDrop(cx, cy, gen2);
    this.itemDrops.push(iDrop2);
    this.gameContainer!.addChild(iDrop2.container);
  }
  // 15% chance for an orb
  if (Math.random() < 0.15) {
    const orb = generateOrbDrop();
    const oDrop = createOrbDrop(cx, cy, orb.orbId, orb.name);
    this.itemDrops.push(oDrop);
    this.gameContainer!.addChild(oDrop.container);
  }
}

private spawnBreakableLoot(bx: number, by: number) {
  for (const drop of createRandomLoot(bx, by, 0.5)) {
    this.itemDrops.push(drop);
    this.gameContainer!.addChild(drop.container);
  }
  // 5% chance for an item
  if (Math.random() < 0.05) {
    const item = generateItemDrop(this.player?.level);
    const iDrop = createItemDrop(bx, by, item);
    this.itemDrops.push(iDrop);
    this.gameContainer!.addChild(iDrop.container);
  }
  // 3% chance for an orb
  if (Math.random() < 0.03) {
    const orb = generateOrbDrop();
    const oDrop = createOrbDrop(bx, by, orb.orbId, orb.name);
    this.itemDrops.push(oDrop);
    this.gameContainer!.addChild(oDrop.container);
  }
}
```

- [ ] **Step 6: Add chest interaction in updateGameplay**

In `updateGameplay()`, after `this.combatText.update(dt);` (line 516), add:
```typescript
// Chest interaction
const interactKey = this.input.isKeyDown('KeyE');
for (const chest of this.chests) {
  if (chest.isOpen) continue;
  const dist = Math.hypot(this.player.x - chest.x, this.player.y - chest.y);
  chest.showPrompt(dist < 48);
  if (dist < 48 && interactKey) {
    chest.open();
    this.spawnChestLoot(chest.x, chest.y);
  }
}
```

- [ ] **Step 7: Add breakable hit detection from melee attacks**

In `useMainAbility()` method, after the melee attack call succeeds (after line 1081 where the skill VFX is created), add:
```typescript
// Check breakables hit by melee attack
for (const brk of this.breakables) {
  if (!brk.alive) continue;
  if (Math.hypot(this.player.x - brk.x, this.player.y - brk.y) < 80) {
    if (brk.takeDamage()) {
      this.spawnBreakableLoot(brk.x, brk.y);
    }
  }
}
```

- [ ] **Step 8: Add breakable hit detection from projectiles**

In the projectile update loop, inside the `!p.hostile` block (around line 576), after the enemy damage loop, add:
```typescript
// Check breakables hit by projectile
for (const brk of this.breakables) {
  if (!brk.alive || p.hitTargets.has(brk)) continue;
  if (rectsOverlap(p.getBounds(), brk.getBounds())) {
    if (brk.takeDamage()) {
      this.spawnBreakableLoot(brk.x, brk.y);
    }
    p.hitTargets.add(brk);
    if (!p.pierce) { hit = true; break; }
  }
}
```

- [ ] **Step 9: Import generateItemDrop and generateOrbDrop if not already imported**

Check that `generateItemDrop` and `generateOrbDrop` are imported (they should be at line 20). If not, add:
```typescript
import { generateItemDrop, generateOrbDrop } from './ItemGenerator';
```

- [ ] **Step 10: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 10: Update boss spawn to new room center

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Update boss spawn position**

In `spawnBoss()` at line 340, the boss spawns at `ROOM_WIDTH / 2, ROOM_HEIGHT / 2` which auto-scales with the new constants. No change needed.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 11: Update ZoneManager enemy clamping

**Files:**
- Modify: `src/core/ZoneManager.ts`

- [ ] **Step 1: Update enemy spawn clamping margins**

In `ZoneManager.ts` lines 81-82, enemy positions are clamped to `[64, ROOM_WIDTH-64]`. Since `ROOM_WIDTH` is now 6400, this auto-scales. The spawn zones in templates were scaled in Task 3. No change needed.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 12: Final verification

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Build succeeds, output in `dist/`
