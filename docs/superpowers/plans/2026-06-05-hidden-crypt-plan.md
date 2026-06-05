# Hidden Crypt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Hidden Crypt secret zone accessible from the tutorial via a clickable bush that reveals a hidden door. Features wave-based combat, a Cthulhu boss, dense breakables/chests, and a one-time 1000-gold jackpot chest.

**Architecture:** Reuse existing Zone/ZoneManager/Room system with a new biome, zone config, and room template. New `SecretBush` entity for the two-click bush mechanic. Extend `Boss` class for the Cthulhu boss with pull mechanic. New `locked`/`isJackpot` flags on `Chest`. Wave system managed in Game.ts game loop. Save/load for one-time jackpot via a new optional field on SaveData.

**Tech Stack:** TypeScript + PixiJS 7 + Vite 5

---

### Task 1: Zone Infrastructure — biome, config, template

**Files:**
- Modify: `src/core/ZoneConfig.ts` — add `'crypt'` to `BiomeId`, add `BIOME_DATA` entry
- Modify: `src/core/ZoneRegistry.ts` — add `secret_crypt` zone
- Modify: `src/core/ZoneManager.ts` — add `secret_crypt` to `isZoneUnlocked()`
- Modify: `src/world/RoomTemplates.ts` — add `TEMPLATE_CRYPT`

- [ ] **Step 1: Add `'crypt'` to the `BiomeId` type and `BIOME_DATA` in ZoneConfig.ts**

In `src/core/ZoneConfig.ts`, find:

```ts
export type BiomeId = 'dev' | 'hub' | 'tutorial' | 'forest' | 'desert' | 'ice' | 'endless';
```

Change to:

```ts
export type BiomeId = 'dev' | 'hub' | 'tutorial' | 'forest' | 'desert' | 'ice' | 'endless' | 'crypt';
```

In the same file, add a `crypt` entry to `BIOME_DATA`. Find the closing `};` of the `BIOME_DATA` block and add before it:

```ts
crypt: { floorColor: 0x1a1028, wallColor: 0x2a2040, wallBorderColor: 0x3a3050, decorColor: 0x0a0020, decorColorB: 0x553366 },
```

- [ ] **Step 2: Add `TEMPLATE_CRYPT` to RoomTemplates.ts**

Add at the end of `src/world/RoomTemplates.ts`, before any existing function exports:

```ts
export const TEMPLATE_CRYPT: RoomTemplate = {
  walls: [
    { x: 1560, y: 144, width: 3280, height: 48 },  // North
    { x: 1560, y: 3392, width: 3280, height: 48 },  // South
    { x: 1560, y: 144, width: 48, height: 3248 },   // West
    { x: 4792, y: 144, width: 48, height: 3248 },   // East
  ],
  doors: [
    {
      rect: { x: 3000, y: 3312, width: 400, height: 144 },
      targetZone: 'tutorial',
      targetRoom: 0,
    },
  ],
  portals: [],
  spawnZones: [
    { x: 1650, y: 200, width: 600, height: 600 },
    { x: 4150, y: 200, width: 600, height: 600 },
    { x: 1650, y: 2784, width: 600, height: 600 },
    { x: 4150, y: 2784, width: 600, height: 600 },
  ],
  decorationRects: [],
  buildings: [],
  npcs: [],
  playerStart: { x: 3200, y: 1792 },
};
```

- [ ] **Step 3: Add `TEMPLATE_CRYPT` import to ZoneRegistry.ts + add secret_crypt zone**

In `src/core/ZoneRegistry.ts`, add `TEMPLATE_CRYPT` to the imports:

```ts
import {
  TEMPLATE_HUB, TEMPLATE_TUTORIAL, TEMPLATE_ARENA, TEMPLATE_DUNGEON, TEMPLATE_DEV,
  TEMPLATE_FOREST_1, TEMPLATE_FOREST_2, TEMPLATE_FOREST_3,
  TEMPLATE_DESERT_1, TEMPLATE_DESERT_2, TEMPLATE_DESERT_3, TEMPLATE_DESERT_4,
  TEMPLATE_ICE_1, TEMPLATE_ICE_2, TEMPLATE_ICE_3, TEMPLATE_ICE_4, TEMPLATE_ICE_5,
  TEMPLATE_FOREST_BOSS, TEMPLATE_DESERT_BOSS, TEMPLATE_ICE_BOSS,
  TEMPLATE_CRYPT,
} from '../world/RoomTemplates';
```

After the `tutorial` entry (before `forest`), add:

```ts
secret_crypt: {
  id: 'secret_crypt',
  name: 'Hidden Crypt',
  biome: 'crypt',
  roomCount: 1,
  bossId: 'cthulhu',
  enemyPool: ['grunt', 'juggernaut'],
  enemyHpMult: 2.0,
  enemyDmgMult: 1.2,
  enemyXpMult: 1.5,
  isEndless: false,
  nextZone: 'tutorial',
  availableFromHub: false,
  enemyCount: { min: 3, max: 5 },
  templates: [TEMPLATE_CRYPT],
},
```

- [ ] **Step 4: Add `secret_crypt` to `isZoneUnlocked()` in ZoneManager.ts**

In `src/core/ZoneManager.ts`, find the `isZoneUnlocked` function:

```ts
if (zoneId === 'tutorial' || zoneId === 'endless_arena' || zoneId === 'endless_dungeon' || zoneId === 'hub') return true;
```

Change to:

```ts
if (zoneId === 'tutorial' || zoneId === 'endless_arena' || zoneId === 'endless_dungeon' || zoneId === 'hub' || zoneId === 'secret_crypt') return true;
```

- [ ] **Step 5: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors. The secret_crypt zone is now registered and unlockable. The TEMPLATE_CRYPT room will be renderable but not yet entered since it has no door — that comes in Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/core/ZoneConfig.ts src/core/ZoneRegistry.ts src/core/ZoneManager.ts src/world/RoomTemplates.ts
git commit -m "feat: add crypt biome, secret_crypt zone, TEMPLATE_CRYPT template"
```

---

### Task 2: RoomDecorator — crypt biome support

**Files:**
- Modify: `src/world/RoomDecorator.ts` — add `'crypt'` to `BIOME_DECOR` and `getBiomeTint`, increase chest/breakable counts for crypt

- [ ] **Step 1: Add `'crypt'` to `BIOME_DECOR`**

Find the `BIOME_DECOR` object and add a crypt entry:

```ts
crypt: { treeChance: 0, rockChance: 0.5, bushChance: 0 },
```

- [ ] **Step 2: Add `'crypt'` to `getBiomeTint`**

```ts
case 'crypt': return 0x6655aa;
```

- [ ] **Step 3: Add biome-specific chest/breakable count overrides**

Find the chest loop and the breakable loop. Before the chest loop (around line 165, after the grass loop), add:

```ts
let chestCount = 4 + Math.floor(Math.random() * 5);
let breakableCount = 8 + Math.floor(Math.random() * 8);
if (biome === 'crypt') {
  chestCount = 8 + Math.floor(Math.random() * 4);
  breakableCount = 15 + Math.floor(Math.random() * 10);
}
```

Then change the chest loop header from:
```ts
for (let i = 0; i < 4 + Math.floor(Math.random() * 5); i++) {
```
to:
```ts
for (let i = 0; i < chestCount; i++) {
```

Change the breakable loop header from:
```ts
for (let i = 0; i < 8 + Math.floor(Math.random() * 8); i++) {
```
to:
```ts
for (let i = 0; i < breakableCount; i++) {
```

- [ ] **Step 4: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/world/RoomDecorator.ts
git commit -m "feat: add crypt biome to RoomDecorator, increased chest/breakable counts"
```

---

### Task 3: SecretBush entity

**Files:**
- Create: `src/entities/SecretBush.ts`

- [ ] **Step 1: Create the SecretBush class**

Create `src/entities/SecretBush.ts`:

```ts
import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Logger } from '../core/Logger';

export type BushState = 'hidden' | 'rustling' | 'destroyed';

export class SecretBush {
  container: Container;
  x: number;
  y: number;
  state: BushState = 'hidden';
  private sprite: Sprite;
  private glowOverlay: Graphics;
  private sparkleText: Text;
  private wobbleTimer = 0;
  private glowTimer = 0;
  private onDestroyed: () => void;

  constructor(x: number, y: number, onDestroyed: () => void) {
    this.x = x;
    this.y = y;
    this.onDestroyed = onDestroyed;
    this.container = new Container();

    this.sprite = new Sprite(Sprites.bush);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.tint = 0x559944;
    this.container.addChild(this.sprite);

    this.glowOverlay = new Graphics();
    this.glowOverlay.visible = false;
    this.container.addChild(this.glowOverlay);

    this.sparkleText = new Text('☆', new TextStyle({
      fontFamily: 'monospace', fontSize: 16, fill: '#ffff88',
    }));
    this.sparkleText.anchor.set(0.5, 1);
    this.sparkleText.y = -24;
    this.sparkleText.visible = false;
    this.container.addChild(this.sparkleText);

    this.container.x = x;
    this.container.y = y;
  }

  checkClick(mouseWX: number, mouseWY: number, clicked: boolean): boolean {
    const dist = Math.hypot(mouseWX - this.x, mouseWY - this.y);
    const inRange = dist < 24;
    if (this.state === 'hidden') {
      if (inRange && clicked) {
        this.state = 'rustling';
        this.sparkleText.visible = true;
        this.glowOverlay.visible = true;
        this.wobbleTimer = 0;
        this.glowTimer = 0;
        Logger.log('system', 'Bush rustling! Click again to destroy');
        return true;
      }
    } else if (this.state === 'rustling') {
      if (clicked) {
        this.state = 'destroyed';
        this.sparkleText.visible = false;
        this.sprite.visible = false;
        this.glowOverlay.visible = false;
        this.onDestroyed();
        Logger.log('system', 'Bush destroyed! Hidden door revealed');
        return true;
      }
    }
    return false;
  }

  update(dt: number, playerX: number, playerY: number) {
    if (this.state === 'rustling') {
      this.wobbleTimer += dt * 0.003;
      this.sprite.x = Math.sin(this.wobbleTimer * 3) * 2;

      this.glowTimer += dt * 0.003;
      this.glowOverlay.clear();
      const alpha = 0.3 + Math.sin(this.glowTimer * 4) * 0.15;
      this.glowOverlay.beginFill(0xffff88, alpha);
      this.glowOverlay.drawCircle(0, -12, 14);
      this.glowOverlay.endFill();

      const dist = Math.hypot(playerX - this.x, playerY - this.y);
      if (dist > 200) {
        this.state = 'hidden';
        this.sparkleText.visible = false;
        this.glowOverlay.visible = false;
        this.sprite.x = 0;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/SecretBush.ts
git commit -m "feat: add SecretBush entity with two-click reveal mechanic"
```

---

### Task 4: Chest — jackpot/locked support

**Files:**
- Modify: `src/entities/Chest.ts` — add `isJackpot`, `locked`, `unlock()` method, lock overlay

- [ ] **Step 1: Rewrite Chest.ts with jackpot/locked support**

Replace the full content of `src/entities/Chest.ts`:

```ts
import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Rect } from '../world/Room';

export interface ChestOptions {
  isJackpot?: boolean;
  locked?: boolean;
}

export class Chest {
  container: Container;
  private sprite: Sprite;
  private interactLabel: Text;
  private lockOverlay: Graphics;
  isOpen = false;
  isJackpot: boolean;
  locked: boolean;
  x: number;
  y: number;
  readonly width = 28;
  readonly height = 20;

  constructor(x: number, y: number, opts?: ChestOptions) {
    this.x = x;
    this.y = y;
    this.isJackpot = opts?.isJackpot ?? false;
    this.locked = opts?.locked ?? false;
    this.container = new Container();

    this.sprite = new Sprite(Sprites.chestClosed);
    this.sprite.anchor.set(0.5, 0.5);
    if (this.isJackpot) this.sprite.tint = 0xddaaff;
    this.container.addChild(this.sprite);

    this.lockOverlay = new Graphics();
    if (this.locked) {
      this.lockOverlay.lineStyle(2, 0x884488);
      this.lockOverlay.drawCircle(0, 0, 12);
      this.lockOverlay.moveTo(-6, -6);
      this.lockOverlay.lineTo(6, 6);
      this.lockOverlay.moveTo(-6, 6);
      this.lockOverlay.lineTo(6, -6);
    }
    this.container.addChild(this.lockOverlay);

    this.interactLabel = new Text('', new TextStyle({
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
    if (!visible || this.isOpen) {
      this.interactLabel.visible = false;
      return;
    }
    this.interactLabel.visible = true;
    this.interactLabel.text = this.locked ? 'Locked' : 'Open [E]';
  }

  unlock() {
    this.locked = false;
    this.lockOverlay.clear();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.sprite.texture = Sprites.chestOpen;
    this.interactLabel.visible = false;
    this.lockOverlay.visible = false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Chest.ts
git commit -m "feat: add isJackpot/locked flags to Chest, lock overlay"
```

---

### Task 5: Cthulhu Boss — config and attacks

**Files:**
- Modify: `src/entities/Boss.ts` — add `'cthulhu'` BossId, config, swipe/grasp attacks, pull mechanic

- [ ] **Step 1: Add `'cthulhu'` to `BossId` type**

```ts
export type BossId = 'golem' | 'reaper' | 'cthulhu';
```

- [ ] **Step 2: Add cthulhu config to `getBossConfig()`**

Find `function getBossConfig(bossId: BossId): BossConfig {` and add a new case:

```ts
function getBossConfig(bossId: BossId): BossConfig {
  switch (bossId) {
    // ... existing cases for golem, reaper ...
    case 'cthulhu':
      return {
        bossId: 'cthulhu',
        name: 'The Deep One',
        hp: 600,
        size: 100,
        speed: 1.3,
        damage: 22,
        sprite: Texture.WHITE,
        xpReward: 150,
      };
  }
}
```

- [ ] **Step 3: Add `pendingPull` field to Boss class**

Add alongside `pendingAttackDamage`:

```ts
pendingPull: { distance: number; angle: number } | null = null;
```

- [ ] **Step 4: Wire cthulhu into constructor sprite creation**

Find this block in the constructor:

```ts
if (bossId === 'reaper') {
  this.sprite = createReaperSprite();
} else if (bossId === 'golem') {
  this.sprite = createGolemSprite();
} else {
  this.sprite = new Sprite(cfg.sprite);
}
```

Change the else to include cthulhu check. Since the user will provide sprites later, we use a placeholder for now. Keep the `else` for fallback:

```ts
if (bossId === 'reaper') {
  this.sprite = createReaperSprite();
} else if (bossId === 'golem') {
  this.sprite = createGolemSprite();
} else {
  this.sprite = new Sprite(cfg.sprite);
}
```

Find the scale section and ensure cthulhu gets a reasonable scale:

```ts
if (bossId === 'reaper') {
  this.sprite.scale.set(1.44);
} else if (bossId === 'cthulhu') {
  this.sprite.scale.set(1.5);
} else {
  this.sprite.scale.set(1.25);
}
```

- [ ] **Step 5: Wire cthulhu into the `update()` switch**

Find the switch statement:

```ts
switch (this.bossId) {
  case 'golem': this.updateGolem(dx, dy, dist, dt, playerX, playerY); break;
  case 'reaper': this.updateReaper(dx, dy, dist, dt, playerX, playerY); break;
}
```

Add cthulhu:

```ts
switch (this.bossId) {
  case 'golem': this.updateGolem(dx, dy, dist, dt, playerX, playerY); break;
  case 'reaper': this.updateReaper(dx, dy, dist, dt, playerX, playerY); break;
  case 'cthulhu': this.updateCthulhu(dx, dy, dist, dt, playerX, playerY); break;
}
```

- [ ] **Step 6: Add `updateCthulhu()` method**

Add after the `updateReaper()` method:

```ts
private updateCthulhu(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
  const speedMult = 1 + this.phase * 0.15;

  if (!this.attacking && dist > 120) {
    const moveX = (dx / dist) * this.speed * speedMult * dt;
    const moveY = (dy / dist) * this.speed * speedMult * dt;
    this.x += moveX;
    this.y += moveY;
  }

  if (this.aiTimer <= 0 && !this.attacking) {
    this.attackCooldown = 35;

    const available: (() => void)[] = [];

    // Tentacle Swipe (available from phase 1)
    available.push(() => {
      this.prepareTelegraph({
        type: 'cone', x: this.x, y: this.y, angle: Math.atan2(dy, dx),
        radius: 100 + this.phase * 20, duration: 40, maxDuration: 40, color: 0x66ffaa,
      });
    });

    // Grasping Reach (available from phase 2)
    if (this.phase >= 1) {
      available.push(() => {
        const graspDist = Math.min(dist, 400 + this.phase * 50);
        const graspAngle = Math.atan2(dy, dx);
        this.prepareTelegraph({
          type: 'line', x: this.x, y: this.y,
          targetX: this.x + Math.cos(graspAngle) * graspDist,
          targetY: this.y + Math.sin(graspAngle) * graspDist,
          duration: 50, maxDuration: 50, color: 0x44ff88,
        });
      });
    }

    this.aiTimer = this.phase >= 3 ? 20 + Math.random() * 20 : 50 + Math.random() * 30;
    const idx = Math.floor(Math.random() * available.length);
    available[idx]();
  }

  // Phase 4: chance for double swipe
  if (this.phase >= 3 && !this.attacking && Math.random() < 0.015) {
    if (this.aiTimer <= 0) {
      this.prepareTelegraph({
        type: 'cone', x: this.x, y: this.y, angle: Math.atan2(dy, dx),
        radius: 120, duration: 25, maxDuration: 25, color: 0x66ffaa,
      });
      this.attackCooldown = 30;
      this.aiTimer = 20;
    }
  }
}
```

- [ ] **Step 7: Modify `executeAttack()` to handle cthulhu's grasp (line type → pendingAttackDamage instead of projectile)**

Find the `case 'line'` block in `executeAttack()`:

```ts
case 'line': {
  const angle = Math.atan2(py - this.y, px - this.x);
  const p = new Projectile(this.x, this.y, angle, 8, this.damage, false, true, 0xcc8844, 0, 14);
  p.lifetime = 60;
  p.sprite.clear();
  p.sprite.beginFill(0x887766);
  p.sprite.drawCircle(0, 0, 14);
  p.sprite.beginFill(0x665544);
  p.sprite.drawCircle(-4, -3, 10);
  p.sprite.beginFill(0x554433);
  p.sprite.drawCircle(2, -1, 6);
  p.sprite.endFill();
  this.projectiles.push(p);
  break;
}
```

Replace with:

```ts
case 'line': {
  if (this.bossId === 'cthulhu') {
    // Grasping Reach: use hitbox zone in Game.ts instead of projectile
    this.pendingAttackDamage = { ...t, damageAmt: this.damage };
  } else {
    const angle = Math.atan2(py - this.y, px - this.x);
    const p = new Projectile(this.x, this.y, angle, 8, this.damage, false, true, 0xcc8844, 0, 14);
    p.lifetime = 60;
    p.sprite.clear();
    p.sprite.beginFill(0x887766);
    p.sprite.drawCircle(0, 0, 14);
    p.sprite.beginFill(0x665544);
    p.sprite.drawCircle(-4, -3, 10);
    p.sprite.beginFill(0x554433);
    p.sprite.drawCircle(2, -1, 6);
    p.sprite.endFill();
    this.projectiles.push(p);
  }
  break;
}
```

- [ ] **Step 8: Clear `pendingPull` on death**

In the `takeDamage()` method, add near the death logic:

Find:
```ts
if (this.health <= 0) {
  this.alive = false;
  this.playAnim('death', false);
```

Add `this.pendingPull = null;` before `this.playAnim`:

```ts
if (this.health <= 0) {
  this.alive = false;
  this.pendingPull = null;
  this.playAnim('death', false);
```

- [ ] **Step 9: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 10: Commit**

```bash
git add src/entities/Boss.ts
git commit -m "feat: add Cthulhu boss with swipe cone and grasping reach pull attacks"
```

---

### Task 6: SaveManager — cryptJackpotClaimed

**Files:**
- Modify: `src/core/SaveManager.ts` — add `cryptJackpotClaimed` to `SaveData.zone`

- [ ] **Step 1: Add `cryptJackpotClaimed` to SaveData interface**

Find the `SaveData` interface. In the `zone` section, add:

```ts
zone: {
  currentZoneId: string;
  currentRoomIndex: number;
  completedZoneIds: string[];
  cryptJackpotClaimed?: boolean;  // NEW: tracks if hidden crypt jackpot chest was opened
};
```

- [ ] **Step 2: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/SaveManager.ts
git commit -m "feat: add cryptJackpotClaimed field to SaveData"
```

---

### Task 7: Game.ts — full integration (SecretBush, wave system, jackpot, pull, save/load)

**Files:**
- Modify: `src/core/Game.ts` — bush lifecycle, wave spawn, jackpot chest, boss pull, save/load

- [ ] **Step 1: Add imports at top of Game.ts**

Add to the imports:

```ts
import { SecretBush } from './SecretBush';
```

- [ ] **Step 2: Add new state fields to the Game class**

Find the existing field declarations (around line 99-107 where `enemies`, `itemDrops` etc. are declared). Add:

```ts
private secretBush: SecretBush | null = null;
private bushRevealed: boolean = false;
private cryptWaveCount: number = 0;
private cryptWaveActive: boolean = false;
private jackpotChest: Chest | null = null;
private cryptJackpotClaimed: boolean = false;
private playerPullTimer: number = 0;
```

- [ ] **Step 3: Create the SecretBush in `buildCurrentZoneRoom` when in tutorial zone**

Inside `buildCurrentZoneRoom()`, after the procedural decoration section (after `this.breakables = ...` loop), when `zone.id === 'tutorial'`:

```ts
// Secret bush for hidden crypt door
if (zone.id === 'tutorial' && !this.bushRevealed) {
  this.secretBush = new SecretBush(5300, 400, () => {
    this.bushRevealed = true;
    const t = this.zoneManager.state?.currentTemplate;
    if (!t) return;
    t.doors.push({
      rect: { x: 5240, y: 360, width: 160, height: 100 },
      targetZone: 'secret_crypt',
      targetRoom: 0,
    });
    this.buildCurrentZoneRoom();
  });
  this.gameContainer.addChild(this.secretBush.container);
}
```

Also add cleanup for the secretBush in the cleanup section at the top of `buildCurrentZoneRoom()`:

```ts
if (this.secretBush) {
  try { this.gameContainer.removeChild(this.secretBush.container); } catch (_) {}
  try { this.secretBush.destroy(); } catch (_) {}
  this.secretBush = null;
}
```

Add this near the existing cleanup code (around line 850-865 where other arrays are cleared).

- [ ] **Step 4: Initialize crypt wave state in `buildCurrentZoneRoom` for crypt zone**

After the `if (zone.id === 'tutorial')` secret bush section, add handling for the crypt zone:

```ts
// Hidden Crypt wave setup
if (zone.id === 'secret_crypt') {
  this.cryptWaveCount = 0;
  this.cryptWaveActive = true;

  // Jackpot chest (one-time)
  if (!this.cryptJackpotClaimed) {
    this.jackpotChest = new Chest(3200, 2000, { isJackpot: true, locked: true });
    this.chests.push(this.jackpotChest);
    this.gameContainer.addChild(this.jackpotChest.container);
  }
}
```

- [ ] **Step 5: Add boss pull handling after boss.update()**

Find where boss.update() is called in the game loop, typically something like:

```ts
if (this.boss?.alive) {
  const walls = this.room?.walls ?? [];
  this.boss.update(this.player.x, this.player.y, dt, walls);
```

After `walls` are collected and `update()` called, add pull logic:

```ts
// Cthulhu pull mechanic
if (this.boss?.pendingPull) {
  this.playerPullTimer = 30; // ~0.5s stun
  const pull = this.boss.pendingPull;
  const pullTargetX = this.player.x + Math.cos(pull.angle) * pull.distance;
  const pullTargetY = this.player.y + Math.sin(pull.angle) * pull.distance;
  const resolved = resolveCollision(
    { x: pullTargetX - this.player.width / 2, y: pullTargetY - this.player.height / 2, width: this.player.width, height: this.player.height },
    this.room?.walls ?? []
  );
  this.player.x = resolved.x + this.player.width / 2;
  this.player.y = resolved.y + this.player.height / 2;
  this.boss.pendingPull = null;
}
// Player stun from pull
if (this.playerPullTimer > 0) {
  this.playerPullTimer--;
}
```

- [ ] **Step 6: Add cthulhu pull flag in the pendingAttackDamage handling**

Find the boss attack damage section (around line 1898-1968). After the `if (inZone)` block that applies damage, add the pull setup for cthulhu:

Inside the `if (inZone)` block (around line 1936-1939), after:
```ts
if (inZone) {
  this.player.takeDamage(t.damageAmt);
  this.combatText.showDamage(this.player.x, this.player.y - 20, t.damageAmt, 0xff6666);
  // ...existing VFX code follows...
```

Add the pull setup:
```ts
if (inZone) {
  this.player.takeDamage(t.damageAmt);
  this.combatText.showDamage(this.player.x, this.player.y - 20, t.damageAmt, 0xff6666);
  // Cthulhu: on grasp hit, set pull
  if (this.boss?.bossId === 'cthulhu' && t.type === 'line') {
    this.boss.pendingPull = {
      distance: 180,
      angle: Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x),
    };
  }
  // ...existing VFX code follows...
```

- [ ] **Step 7: Ignore player input during pull stun**

Find where player input is consumed in the game loop (around `handleSkillKeys` and movement sections). Add a guard using playerPullTimer:

Before consuming player movement input, add:
```ts
const inputDisabled = this.playerPullTimer > 0;
```

Then guard the input consumption:
```ts
if (!inputDisabled) {
  // existing input handling
}
```

Specifically, find the movement input section (WASD handling) and wrap it:

```ts
// Player movement
if (!this.player.isChanneling && this.player.alive && !inputDisabled) {
  // ... existing movement code ...
}
```

- [ ] **Step 8: Add crypt wave management in the game loop**

In the game loop, after the arena wave system (around line 2109-2122 where `isEndless === 'wave'` is checked), add crypt wave handling:

```ts
// Hidden Crypt wave system
if (zone?.id === 'secret_crypt' && this.cryptWaveActive) {
  if (this.enemies.length === 0 && !this.boss && !this.bossSpawned) {
    this.cryptWaveCount++;
    if (this.cryptWaveCount >= 3) {
      // Spawn boss after 3 waves
      this.cryptWaveActive = false;
      this.spawnBoss('cthulhu');
    } else {
      // Spawn next wave with escalating difficulty
      const count = 3 + this.cryptWaveCount;
      const hpMult = 2.0 + this.cryptWaveCount * 0.1;
      const zoneConfig = this.zoneManager.state?.config;
      if (zoneConfig) {
        const template = this.zoneManager.state?.currentTemplate;
        if (!template) return;
        const walls = this.room?.walls ?? [];
        for (let i = 0; i < count; i++) {
          const spawnZone = template.spawnZones[Math.floor(Math.random() * template.spawnZones.length)];
          const x = spawnZone.x + Math.random() * spawnZone.width;
          const y = spawnZone.y + Math.random() * spawnZone.height;
          const type = Math.random() < 0.4 ? 'juggernaut' : 'grunt';
          const e = new Enemy(x, y, type as any);
          e.health = Math.round(e.health * hpMult);
          e.maxHealth = e.health;
          e.damage = Math.round(e.damage * 1.1);
          this.enemies.push(e);
          this.gameContainer!.addChild(e.sprite);
          if (e.nameplate) this.gameContainer!.addChild(e.nameplate);
        }
      }
      Logger.log('system', `Crypt wave ${this.cryptWaveCount} spawned (${count} enemies, ${hpMult}x HP)`);
    }
  }
}
```

- [ ] **Step 9: Boss death unlocks jackpot chest**

In the boss death handling section (found around line 2070-2104 where boss death is handled), add jackpot unlock logic:

Find where boss death is handled (it checks `!this.boss.alive` and `this.bossSpawned`). After the boss death reward code, add:

```ts
// Unlock jackpot chest for crypt boss
if (this.boss && !this.boss.alive && this.boss.bossId === 'cthulhu' && this.jackpotChest) {
  this.jackpotChest.unlock();
}
```

- [ ] **Step 10: Handle jackpot chest interaction in the chest interaction loop**

In the chest interaction section (around line 1669-1679), modify the interaction to handle locked chests and the jackpot:

Find:
```ts
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

Replace with:
```ts
for (const chest of this.chests) {
  if (chest.isOpen) continue;
  const dist = Math.hypot(this.player.x - chest.x, this.player.y - chest.y);
  chest.showPrompt(dist < 48);
  if (dist < 48 && interactKey) {
    if (chest.locked) {
      // Show locked message
      this.combatText.showDamage(chest.x, chest.y - 30, 0, 0x8888ff);
      // (chest remains closed, no loot)
      continue;
    }
    chest.open();
    if (chest.isJackpot) {
      // Jackpot chest: 1000 gold + normal loot
      this.itemDrops.push(new ItemDrop(chest.x, chest.y, {
        type: 'gold', name: '1000 Gold', color: 0xffd700, value: 1000,
      }));
      this.gameContainer!.addChild(this.itemDrops[this.itemDrops.length - 1].container);
      this.cryptJackpotClaimed = true;
    }
    this.spawnChestLoot(chest.x, chest.y);
  }
}
```

- [ ] **Step 11: Update the SecretBush in the update loop**

In the game loop, add the SecretBush update call. The update method handles the wobble/glow animation and the proximity-based revert. Add near where chest interaction or other entity updates happen:

```ts
this.secretBush?.update(dt, this.player.x, this.player.y);
```

- [ ] **Step 12: Wire save/load for cryptJackpotClaimed**

In `saveGame()` (around line 422), add the jackpot claim to the save data. Find where `zone: { ... }` is constructed and add:

```ts
zone: {
  currentZoneId: this.zoneManager.zoneId,
  currentRoomIndex: this.zoneManager.roomIndex,
  completedZoneIds: [...this.zoneManager.completedZoneIds],
  cryptJackpotClaimed: this.cryptJackpotClaimed || undefined,
},
```

In `loadGame()` (around line 304), add the jackpot claim restoration. After loading `completedZoneIds`, add:

```ts
this.cryptJackpotClaimed = data.zone.cryptJackpotClaimed ?? false;
```

- [ ] **Step 13: Clean up jackpotChest in buildCurrentZoneRoom cleanup section**

Add `this.jackpotChest = null;` to the buildCurrentZoneRoom cleanup (alongside other null resets around line 856-863).

- [ ] **Step 14: Build and verify**

Run: `npx tsc --noEmit`

Expected: No type errors. This is the most complex task — resolve any type issues (missing imports, property access on undefined, etc.).

- [ ] **Step 15: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: integrate SecretBush, crypt wave system, jackpot chest, Cthulhu pull, save/load"
```

---

### Self-Review Checklist

1. **Spec coverage:** Each section of the design doc maps to plan tasks:
   - Secret Bush → Task 3
   - Crypt Zone Config → Task 1
   - Crypt Room Template → Task 1
   - RoomDecorator crypt support → Task 2
   - Cthulhu Boss → Task 5
   - Jackpot Chest → Task 4 + Task 7 steps 4, 9, 10
   - Wave System → Task 7 step 8
   - Save/Load → Task 6 + Task 7 step 12

2. **Placeholder check:** No TODOs, TBDs, or "implement later" gaps.

3. **Type consistency:** `BossId` type in Task 5 matches across all files. `ChestOptions` constructor signature in Task 4 matches usage in Task 7. `SaveData.zone.cryptJackpotClaimed` in Task 6 matches read/write in Task 7 step 12.

4. **Scope check:** Single spec, single plan. No decomposition needed.
