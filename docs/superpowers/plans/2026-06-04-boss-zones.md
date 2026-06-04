# Boss Zones & Zone Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add zone progression locking to hub portals and boss fights to each story zone.

**Architecture:** ZoneManager tracks completed zones. Hub portals check unlocked state. Boss is a separate entity class with phase-based AI. Boss HP bar is a UI overlay. Boss room templates are added as final rooms in each story zone.

**Tech Stack:** TypeScript, PixiJS 7, Vite 5

---

### Task 1: Boss Sprites + Room Templates

**Files:**
- Modify: `src/rendering/Sprites.ts`
- Modify: `src/world/RoomTemplates.ts`

- [ ] **Step 1: Add golem and reaper programmatic textures to Sprites.ts**

In `src/rendering/Sprites.ts`, add after existing texture definitions:

```typescript
static golem: Texture;
static reaper: Texture;
```

In the `generateAll()` method, add after existing sprite generation:

```typescript
// Stone Golem — floating upper torso, broad shoulders, massive fists
const golemG = new Graphics();
golemG.beginFill(0x6a5a4a); // stone grey-brown
// Torso (trapezoidal)
golemG.drawRect(-32, -20, 64, 50);
// Head (rounded top)
golemG.beginFill(0x7a6a5a);
golemG.drawRect(-16, -40, 32, 24);
// Eyes (orange glow)
golemG.beginFill(0xff8844);
golemG.drawRect(-10, -34, 6, 4);
golemG.drawRect(4, -34, 6, 4);
// Arms (thick, no hands)
golemG.beginFill(0x6a5a4a);
golemG.drawRect(-42, -16, 12, 36);
golemG.drawRect(30, -16, 12, 36);
// Fists (larger ends)
golemG.beginFill(0x7a6a5a);
golemG.drawRect(-44, 16, 16, 12);
golemG.drawRect(28, 16, 16, 12);
// Chest cracks (orange)
golemG.lineStyle(1, 0xff8844, 0.5);
golemG.moveTo(-8, -6);
golemG.lineTo(0, 4);
golemG.lineTo(8, -6);
golemG.lineStyle(0);
// Shadow underneath (floating)
golemG.beginFill(0x000000, 0.2);
golemG.drawEllipse(0, 28, 28, 6);
golemG.endFill();
Sprites.golem = Sprites.app.renderer.generateTexture(golemG, {resolution: 1});

// Death Reaper — hooded skeletal figure, scythe
const reaperG = new Graphics();
// Robe body
reaperG.beginFill(0x2a1a2a);
reaperG.drawRect(-16, -12, 32, 40);
// Hood
reaperG.beginFill(0x1a0a1a);
reaperG.drawRect(-14, -24, 28, 20);
// Face (skull glow)
reaperG.beginFill(0x334444);
reaperG.drawRect(-6, -18, 4, 6);
reaperG.drawRect(2, -18, 4, 6);
// Eyes (red glow)
reaperG.beginFill(0xff2222);
reaperG.drawRect(-5, -17, 2, 2);
reaperG.drawRect(3, -17, 2, 2);
// Scythe handle
reaperG.lineStyle(2, 0x5a3a2a);
reaperG.moveTo(18, -20);
reaperG.lineTo(-4, 28);
// Scythe blade
reaperG.lineStyle(0);
reaperG.beginFill(0x888899);
reaperG.moveTo(20, -22);
reaperG.lineTo(32, -12);
reaperG.lineTo(14, -2);
reaperG.closePath();
reaperG.endFill();
// Swirling mist at base
reaperG.beginFill(0x442244, 0.3);
reaperG.drawEllipse(0, 28, 24, 8);
reaperG.endFill();
Sprites.reaper = Sprites.app.renderer.generateTexture(reaperG, {resolution: 1});
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/rendering/Sprites.ts
git commit -m "feat: add golem + reaper programmatic sprites"
```

- [ ] **Step 4: Add boss room templates to RoomTemplates.ts**

Add these template constants to `src/world/RoomTemplates.ts`:

```typescript
// Forest boss arena — stone golem
export const TEMPLATE_FOREST_BOSS: RoomTemplate = {
  walls: [
    { x: 200, y: 150, width: 60, height: 60 },
    { x: 1340, y: 150, width: 60, height: 60 },
    { x: 200, y: 686, width: 60, height: 60 },
    { x: 1340, y: 686, width: 60, height: 60 },
    { x: 500, y: 400, width: 50, height: 50 },
    { x: 1050, y: 400, width: 50, height: 50 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [],
  spawnZones: [],
  decorationRects: [
    { x: 140, y: 120, width: 14, height: 14 },
    { x: 1300, y: 120, width: 12, height: 12 },
    { x: 160, y: 660, width: 16, height: 16 },
    { x: 1320, y: 660, width: 10, height: 10 },
    { x: 400, y: 200, width: 12, height: 12 },
    { x: 1100, y: 200, width: 14, height: 14 },
    { x: 300, y: 600, width: 10, height: 10 },
    { x: 1200, y: 600, width: 12, height: 12 },
  ],
  buildings: [],
  npcs: [],
  playerStart: { x: 800, y: 448 },
};

// Desert boss arena — placeholder with urns
export const TEMPLATE_DESERT_BOSS: RoomTemplate = {
  walls: [
    { x: 300, y: 200, width: 40, height: 40 },
    { x: 1260, y: 200, width: 40, height: 40 },
    { x: 300, y: 600, width: 40, height: 40 },
    { x: 1260, y: 600, width: 40, height: 40 },
    { x: 100, y: 400, width: 80, height: 16 },
    { x: 1420, y: 400, width: 80, height: 16 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [],
  spawnZones: [{ x: 200, y: 150, width: 1200, height: 600 }],
  decorationRects: [
    { x: 200, y: 180, width: 10, height: 16 },
    { x: 250, y: 190, width: 8, height: 14 },
    { x: 1300, y: 180, width: 12, height: 18 },
    { x: 1350, y: 190, width: 8, height: 12 },
    { x: 200, y: 600, width: 10, height: 18 },
    { x: 250, y: 610, width: 8, height: 14 },
    { x: 1300, y: 610, width: 12, height: 16 },
    { x: 1350, y: 600, width: 8, height: 12 },
  ],
  buildings: [],
  npcs: [],
  playerStart: { x: 800, y: 448 },
};

// Ice boss arena — death reaper
export const TEMPLATE_ICE_BOSS: RoomTemplate = {
  walls: [
    { x: 400, y: 224, width: 50, height: 50 },
    { x: 1150, y: 224, width: 50, height: 50 },
    { x: 250, y: 500, width: 50, height: 50 },
    { x: 1300, y: 500, width: 50, height: 50 },
    { x: 700, y: 350, width: 40, height: 40 },
    { x: 860, y: 350, width: 40, height: 40 },
    { x: 700, y: 500, width: 40, height: 40 },
    { x: 860, y: 500, width: 40, height: 40 },
  ],
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 }],
  portals: [],
  spawnZones: [],
  decorationRects: [
    { x: 150, y: 150, width: 16, height: 16 },
    { x: 1350, y: 150, width: 14, height: 14 },
    { x: 150, y: 700, width: 12, height: 12 },
    { x: 1350, y: 700, width: 16, height: 16 },
    { x: 500, y: 600, width: 10, height: 10 },
    { x: 1000, y: 600, width: 12, height: 12 },
    { x: 300, y: 300, width: 14, height: 14 },
    { x: 1200, y: 300, width: 10, height: 10 },
  ],
  buildings: [],
  npcs: [],
  playerStart: { x: 800, y: 448 },
};
```

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/world/RoomTemplates.ts
git commit -m "feat: add boss arena room templates"
```

---

### Task 2: Zone Progression + Portal Locking

**Files:**
- Modify: `src/core/ZoneConfig.ts`
- Modify: `src/core/ZoneRegistry.ts`
- Modify: `src/core/ZoneManager.ts`
- Modify: `src/world/Room.ts`

- [ ] **Step 1: Add bossId to ZoneConfig**

In `src/core/ZoneConfig.ts`, add to the `ZoneConfig` interface:
```typescript
  bossId?: string;
```

- [ ] **Step 2: Update ZoneRegistry with boss templates and updated configs**

In `src/core/ZoneRegistry.ts`, add imports:
```typescript
import {
  TEMPLATE_HUB, TEMPLATE_TUTORIAL, TEMPLATE_ARENA, TEMPLATE_DUNGEON, TEMPLATE_DEV,
  TEMPLATE_FOREST_1, TEMPLATE_FOREST_2, TEMPLATE_FOREST_3,
  TEMPLATE_DESERT_1, TEMPLATE_DESERT_2, TEMPLATE_DESERT_3, TEMPLATE_DESERT_4,
  TEMPLATE_ICE_1, TEMPLATE_ICE_2, TEMPLATE_ICE_3, TEMPLATE_ICE_4, TEMPLATE_ICE_5,
  TEMPLATE_FOREST_BOSS, TEMPLATE_DESERT_BOSS, TEMPLATE_ICE_BOSS,
} from '../world/RoomTemplates';
```

Update the forest zone config:
```typescript
  forest: {
    id: 'forest', name: 'Verdant Forest', biome: 'forest',
    roomCount: 4, enemyPool: ['grunt', 'archer'],
    enemyHpMult: 1.0, enemyDmgMult: 1.0, enemyXpMult: 1.0,
    isEndless: false, nextZone: 'forest', bossId: 'golem',
    availableFromHub: true,
    enemyCount: { min: 3, max: 5 },
    templates: [TEMPLATE_FOREST_1, TEMPLATE_FOREST_2, TEMPLATE_FOREST_3, TEMPLATE_FOREST_BOSS],
  },
```

Update the desert zone config:
```typescript
  desert: {
    id: 'desert', name: 'Scorched Desert', biome: 'desert',
    roomCount: 5, enemyPool: ['grunt', 'archer', 'juggernaut'],
    enemyHpMult: 1.5, enemyDmgMult: 1.3, enemyXpMult: 1.5,
    isEndless: false, nextZone: 'desert',
    availableFromHub: true,
    enemyCount: { min: 4, max: 6 },
    templates: [TEMPLATE_DESERT_1, TEMPLATE_DESERT_2, TEMPLATE_DESERT_3, TEMPLATE_DESERT_4, TEMPLATE_DESERT_BOSS],
  },
```

Update the ice zone config:
```typescript
  ice: {
    id: 'ice', name: 'Frozen Wastes', biome: 'ice',
    roomCount: 6, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 2.5, enemyDmgMult: 2.0, enemyXpMult: 2.5,
    isEndless: false, nextZone: 'ice', bossId: 'reaper',
    availableFromHub: true,
    enemyCount: { min: 5, max: 7 },
    templates: [TEMPLATE_ICE_1, TEMPLATE_ICE_2, TEMPLATE_ICE_3, TEMPLATE_ICE_4, TEMPLATE_ICE_5, TEMPLATE_ICE_BOSS],
  },
```

Also update the zone template doors so the last regular room leads to the boss room. Change `TEMPLATE_FOREST_3`:
```
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'forest', targetRoom: 3 }],
```

Change `TEMPLATE_DESERT_4`:
```
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'desert', targetRoom: 4 }],
```

Change `TEMPLATE_ICE_5`:
```
  doors: [{ rect: { x: 750, y: 828, width: 100, height: 36 }, targetZone: 'ice', targetRoom: 5 }],
```

- [ ] **Step 3: Add zone progression tracking to ZoneManager**

In `src/core/ZoneManager.ts`, add to the class:
```typescript
  completedZoneIds: Set<string> = new Set();
```

Add methods:
```typescript
  isZoneUnlocked(zoneId: string): boolean {
    if (zoneId === 'tutorial' || zoneId === 'endless_arena' || zoneId === 'endless_dungeon' || zoneId === 'hub') return true;
    if (zoneId === 'forest') return this.completedZoneIds.has('tutorial');
    if (zoneId === 'desert') return this.completedZoneIds.has('forest');
    if (zoneId === 'ice') return this.completedZoneIds.has('desert');
    return true;
  }

  markZoneCompleted(zoneId: string) {
    this.completedZoneIds.add(zoneId);
  }
```

Reset completedZoneIds in `restartGame()` equivalent — add in the `transitionTo` method (or we'll handle it in Game.ts's restartGame).

- [ ] **Step 4: Add hub portal locking visuals to Room.ts**

In `src/world/Room.ts`, find the `renderPortals()` method (or the section that draws portal rings). Modify it to accept a `isUnlocked` check. If the portal target zone is not unlocked:

Add a `lockedPortalIds` parameter or expose `zoneManager` reference. The simplest approach: modify the `portals` rendering in Room to accept a `lockedPortalFilter` callback.

Actually, the cleanest approach is to pass a function to Room or check via a method. Let's pass an `isPortalUnlocked: (targetZone: string) => boolean` to the Room constructor or to a render method.

In `src/world/Room.ts`, add a new field and constructor parameter:
```typescript
  private isPortalUnlocked: (targetZone: string) => boolean;

  constructor(
    biome: BiomeId = 'dev',
    doors: DoorMarker[] = [],
    portals: PortalMarker[] = [],
    decorationRects: { x: number; y: number; width: number; height: number }[] = [],
    buildings: BuildingData[] = [],
    npcs: NpcData[] = [],
    isPortalUnlocked?: (targetZone: string) => boolean,
  ) {
    this.isPortalUnlocked = isPortalUnlocked || (() => true);
    // ... existing constructor code
  }
```

In the portal rendering section (where portal rings and labels are drawn), add after drawing the portal ring:
```typescript
      if (!this.isPortalUnlocked(p.targetZone)) {
        // Draw chains + padlock
        g.lineStyle(3, 0x5a3a2a);
        const chainStartX = cx - 20;
        const chainEndX = cx + 20;
        g.moveTo(chainStartX, cy - r);
        g.lineTo(chainStartX - 8, cy - r - 16);
        g.moveTo(chainEndX, cy - r);
        g.lineTo(chainEndX + 8, cy - r - 16);
        // Padlock
        g.lineStyle(2, 0x886644);
        g.drawRect(cx - 6, cy - r - 20, 12, 10);
        g.beginFill(0x443322);
        g.drawRect(cx - 2, cy - r - 18, 4, 4);
        g.endFill();
        // Locked label
        g.lineStyle(0);
        const lockLabel = new Text('Locked', {
          fontFamily: 'monospace', fontSize: 11, fill: '#666677',
        });
        lockLabel.anchor.set(0.5);
        lockLabel.x = cx;
        lockLabel.y = cy + r + 14;
        this.container.addChild(lockLabel);
      }
```

Also ensure locked portals don't respond to clicks. In Game.ts portal click section, we'll add a check.

- [ ] **Step 5: Update Game.ts portal click to check unlock**

In `src/core/Game.ts`, the portal click check currently does:
```typescript
if (distToPlayer < 150 && Math.hypot(mouseWX - cx, mouseWY - cy) < 60) {
  this.zoneManager.transitionTo(portal.targetZone);
  ...
```

Add an unlock check:
```typescript
if (distToPlayer < 150 && Math.hypot(mouseWX - cx, mouseWY - cy) < 60 && this.zoneManager.isZoneUnlocked(portal.targetZone)) {
```

- [ ] **Step 6: Pass isPortalUnlocked to Room constructor in buildCurrentZoneRoom**

In `src/core/Game.ts`, the Room construction in `buildCurrentZoneRoom()` currently:
```typescript
this.room = new Room(zone.biome, template.doors, template.portals, template.decorationRects, template.buildings, template.npcs);
```

Add the unlock callback:
```typescript
this.room = new Room(zone.biome, template.doors, template.portals, template.decorationRects, template.buildings, template.npcs, (targetZone: string) => this.zoneManager.isZoneUnlocked(targetZone));
```

- [ ] **Step 7: Reset completedZoneIds on game restart**

In `src/core/Game.ts` `restartGame()`, after `this.zoneManager = new ZoneManager();`:
```typescript
this.zoneManager.completedZoneIds = new Set();
```

Also, when the tutorial is completed (player exits to hub), mark it:
```typescript
this.zoneManager.markZoneCompleted('tutorial');
```
Add this in Game.ts when the tutorial player goes through the door (in the door overlap check section, when `zone.id === 'tutorial'` and the door is to 'hub').

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/core/ZoneConfig.ts src/core/ZoneRegistry.ts src/core/ZoneManager.ts src/world/Room.ts src/world/RoomTemplates.ts src/core/Game.ts
git commit -m "feat: zone progression locking with hub portal visuals"
```

---

### Task 3: Boss Entity

**Files:**
- Create: `src/entities/Boss.ts`
- Modify: `src/rendering/Sprites.ts` (already done in Task 1)

- [ ] **Step 1: Create Boss.ts**

```typescript
import { Sprite, Graphics, Texture } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { Projectile } from './Projectile';
import { Rect, resolveCollision } from '../world/Room';
import { Logger } from '../core/Logger';

export type BossId = 'golem' | 'reaper';

interface BossConfig {
  bossId: BossId;
  name: string;
  hp: number;
  size: number;
  speed: number;
  damage: number;
  sprite: Texture;
  xpReward: number;
}

export interface TelegraphShape {
  type: 'line' | 'circle' | 'cone';
  x: number; y: number;
  targetX?: number; targetY?: number;
  radius?: number;
  angle?: number;
  duration: number;
  maxDuration: number;
  color: number;
}

export class Boss {
  x: number;
  y: number;
  readonly bossId: BossId;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  alive = true;
  xpReward: number;

  sprite: Sprite;
  telegraphs: Graphics;
  projectiles: Projectile[] = [];
  cullThreshold = 0;

  private phase = 0;
  private attackCooldown = 0;
  private currentAttack = 0;
  private hitFlashTimer = 0;

  private aiTimer = 0;
  chosenAttack: TelegraphShape | null = null;
  private attackWindup = 0;
  attacking = false;

  private spawnEnemiesCallback: ((count: number, type: string) => void) | null = null;

  constructor(x: number, y: number, bossId: BossId) {
    const cfg = getBossConfig(bossId);
    this.x = x;
    this.y = y;
    this.bossId = cfg.bossId;
    this.name = cfg.name;
    this.width = cfg.size;
    this.height = cfg.size;
    this.health = cfg.hp;
    this.maxHealth = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.xpReward = cfg.xpReward;

    this.sprite = new Sprite(cfg.sprite);
    this.sprite.anchor.set(0.5);
    this.sprite.tint = 0xffffff;
    this.sprite.x = x;
    this.sprite.y = y;

    this.telegraphs = new Graphics();
  }

  onSpawnEnemies(callback: (count: number, type: string) => void) {
    this.spawnEnemiesCallback = callback;
  }

  update(playerX: number, playerY: number, dt: number, walls: Rect[]) {
    if (!this.alive) return;

    // Phase check
    const hpPct = this.health / this.maxHealth;
    const newPhase = hpPct > 0.75 ? 0 : hpPct > 0.50 ? 1 : hpPct > 0.25 ? 2 : 3;
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      Logger.log('entity', `${this.name} enters phase ${this.phase + 1}`);
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    // Clear telegraphs each frame
    this.telegraphs.clear();

    switch (this.bossId) {
      case 'golem': this.updateGolem(dx, dy, dist, dt, playerX, playerY); break;
      case 'reaper': this.updateReaper(dx, dy, dist, dt, playerX, playerY); break;
    }

    // Attack execution
    if (this.chosenAttack && this.attacking) {
      this.attackWindup -= dt;
      if (this.attackWindup <= 0) {
        this.executeAttack(playerX, playerY);
        this.chosenAttack = null;
        this.attacking = false;
      }
    }

    // Draw telegraph
    if (this.chosenAttack && !this.attacking) {
      const t = this.chosenAttack;
      const progress = 1 - t.duration / t.maxDuration;
      this.drawTelegraph(t, progress);
    }

    // Wall collision
    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    this.x = resolved.x + this.width / 2;
    this.y = resolved.y + this.height / 2;

    // Hit flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.sprite.tint = this.hitFlashTimer > 0 ? 0xff6666 : 0xffffff;
    }

    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.aiTimer > 0) this.aiTimer -= dt;

    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  private updateGolem(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const speedMult = 1 + this.phase * 0.2;

    // Slow move toward player when not attacking
    if (!this.attacking && dist > 80) {
      const moveX = (dx / dist) * this.speed * speedMult * dt;
      const moveY = (dy / dist) * this.speed * speedMult * dt;
      this.x += moveX;
      this.y += moveY;
    }

    // Pick attack
    if (this.aiTimer <= 0 && !this.attacking) {
      this.aiTimer = 60 + Math.random() * 60;
      this.attackCooldown = 40;

      const available: (() => void)[] = [() => this.prepareTelegraph({
        type: 'cone', x: this.x, y: this.y, angle: Math.atan2(dy, dx),
        radius: 100, duration: 40, maxDuration: 40, color: 0xff8844,
      })]; // Ground Slam

      available.push(() => this.prepareTelegraph({
        type: 'line', x: this.x, y: this.y,
        targetX: px, targetY: py,
        duration: 40, maxDuration: 40, color: 0xff4444,
      })); // Boulder Toss

      if (this.phase >= 1) {
        available.push(() => this.prepareTelegraph({
          type: 'circle', x: this.x, y: this.y,
          radius: 80, duration: 50, maxDuration: 50, color: 0xff6622,
        })); // Stomp
      }

      const idx = Math.floor(Math.random() * available.length);
      available[idx]();
    }
  }

  private updateReaper(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const speedMult = 1 + this.phase * 0.15;

    // Teleport behavior: vanish and reappear closer
    if (!this.attacking && dist > 200) {
      // Slow drift toward player
      const moveX = (dx / dist) * this.speed * speedMult * dt;
      const moveY = (dy / dist) * this.speed * speedMult * dt;
      this.x += moveX;
      this.y += moveY;
    }

    // Pick attack
    if (this.aiTimer <= 0 && !this.attacking) {
      this.aiTimer = 70 + Math.random() * 80;
      this.attackCooldown = 50;

      const available: (() => void)[] = [() => this.prepareTelegraph({
        type: 'cone', x: this.x, y: this.y, angle: Math.atan2(dy, dx),
        radius: 120, duration: 45, maxDuration: 45, color: 0xcc44cc,
      })]; // Scythe Sweep

      if (this.phase >= 1) {
        available.push(() => this.prepareTelegraph({
          type: 'circle', x: px, y: py,
          radius: 80, duration: 50, maxDuration: 50, color: 0x8822aa,
        })); // Teleport Slam
      }

      if (this.phase >= 2 && this.spawnEnemiesCallback) {
        available.push(() => {
          this.spawnEnemiesCallback!(this.phase >= 3 ? 3 : 2, 'cultist');
          this.aiTimer = 60;
        });
      }

      const idx = Math.floor(Math.random() * available.length);
      available[idx]();
    }
  }

  private prepareTelegraph(shape: TelegraphShape) {
    this.chosenAttack = shape;
    this.attackWindup = shape.duration;
  }

  private drawTelegraph(t: TelegraphShape, progress: number) {
    const alpha = 0.3 + 0.4 * Math.abs(Math.sin(progress * Math.PI * 3));
    this.telegraphs.clear();

    switch (t.type) {
      case 'line': {
        const angle = Math.atan2((t.targetY || 0) - t.y, (t.targetX || 0) - t.x);
        const len = Math.hypot((t.targetX || 0) - t.x, (t.targetY || 0) - t.y);
        const grown = len * progress;
        this.telegraphs.lineStyle(3, t.color, alpha);
        this.telegraphs.moveTo(t.x, t.y);
        this.telegraphs.lineTo(t.x + Math.cos(angle) * grown, t.y + Math.sin(angle) * grown);
        break;
      }
      case 'circle':
        this.telegraphs.lineStyle(3, t.color, alpha);
        this.telegraphs.drawCircle(t.x, t.y, (t.radius || 80) * progress);
        break;
      case 'cone': {
        const halfA = 0.6;
        const r = (t.radius || 100) * progress;
        this.telegraphs.lineStyle(3, t.color, alpha);
        this.telegraphs.moveTo(t.x, t.y);
        this.telegraphs.arc(t.x, t.y, r, (t.angle || 0) - halfA, (t.angle || 0) + halfA);
        this.telegraphs.closePath();
        break;
      }
    }
  }

  private executeAttack(px: number, py: number) {
    if (!this.chosenAttack) return;
    const t = this.chosenAttack;
    const isReaper = this.bossId === 'reaper';

    switch (t.type) {
      case 'cone': {
        // Damage all enemies in cone
        // (Damage logic is handled externally by Game.ts reading telegraph)
        break;
      }
      case 'line': {
        // Launch boulder projectile
        const angle = Math.atan2(py - this.y, px - this.x);
        const p = new Projectile(this.x, this.y, angle, 5, this.damage, false, true, 0xcc8844);
        p.lifetime = 60;
        this.projectiles.push(p);
        break;
      }
      case 'circle': {
        if (isReaper) {
          // Teleport to target
          this.x = t.x;
          this.y = t.y;
        }
        // AoE burst damage handled externally
        break;
      }
    }

    this.telegraphs.clear();
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;

    this.health -= amount;
    this.hitFlashTimer = 10;
    Logger.log('combat', `[${this.name}] took ${amount} dmg (hp: ${Math.max(0, this.health)}/${this.maxHealth})`);
    if (this.health <= 0) {
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('entity', `${this.name} defeated`);
      return true;
    }
    return false;
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  destroy() {
    this.sprite.destroy();
    this.telegraphs.destroy();
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
  }
}

function getBossConfig(bossId: BossId): BossConfig {
  switch (bossId) {
    case 'golem':
      return { bossId: 'golem', name: 'Stone Golem', hp: 500, size: 80, speed: 1.5, damage: 15, sprite: Sprites.golem, xpReward: 100 };
    case 'reaper':
      return { bossId: 'reaper', name: 'Death Reaper', hp: 800, size: 80, speed: 2.0, damage: 20, sprite: Sprites.reaper, xpReward: 200 };
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/entities/Boss.ts
git commit -m "feat: add Boss entity with golem and reaper configs"
```

---

### Task 4: Boss HP Bar UI

**Files:**
- Create: `src/ui/BossHpBar.ts`

- [ ] **Step 1: Create BossHpBar.ts**

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Boss } from '../entities/Boss';

export class BossHpBar {
  container: Container;
  private bg: Graphics;
  private fill: Graphics;
  private nameText: Text;
  private hpText: Text;
  private barWidth = 600;
  private barHeight = 24;

  constructor(screenWidth: number) {
    this.container = new Container();

    const cx = screenWidth / 2;
    const barX = cx - this.barWidth / 2;
    const barY = 60;

    this.bg = new Graphics();
    this.bg.beginFill(0x111111, 0.8);
    this.bg.drawRoundedRect(barX, barY, this.barWidth, this.barHeight, 4);
    this.bg.endFill();
    this.bg.lineStyle(1, 0x444455);
    this.bg.drawRoundedRect(barX, barY, this.barWidth, this.barHeight, 4);

    this.fill = new Graphics();
    this.fill.x = barX + 2;
    this.fill.y = barY + 2;

    this.nameText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 13, fill: '#ffffff',
      stroke: '#000', strokeThickness: 1,
    }));
    this.nameText.x = barX + 8;
    this.nameText.y = barY + 4;

    this.hpText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ccccdd',
      stroke: '#000', strokeThickness: 1,
    }));
    this.hpText.anchor.set(1, 0);
    this.hpText.x = barX + this.barWidth - 8;
    this.hpText.y = barY + 5;

    this.container.addChild(this.bg, this.fill, this.nameText, this.hpText);
  }

  update(boss: Boss) {
    const pct = boss.health / boss.maxHealth;

    // Color based on boss
    const color = boss.bossId === 'golem' ? 0xcc8844 : 0x9933dd;

    this.fill.clear();
    this.fill.beginFill(color);
    this.fill.drawRect(0, 0, (this.barWidth - 4) * pct, this.barHeight - 4);
    this.fill.endFill();

    this.nameText.text = boss.name;
    this.hpText.text = `${Math.ceil(boss.health)}/${boss.maxHealth}`;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/BossHpBar.ts
git commit -m "feat: add BossHpBar UI component"
```

---

### Task 5: Game.ts Boss Integration

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add imports and new fields**

Add to imports in Game.ts:
```typescript
import { Boss, BossId } from '../entities/Boss';
import { BossHpBar } from '../ui/BossHpBar';
```

Add new fields after `private tutorialKeyWasDown: Set<string> = new Set();`:
```typescript
private boss: Boss | null = null;
private bossHpBar?: BossHpBar;
private bossSpawned = false;
```

- [ ] **Step 2: Spawn boss in buildCurrentZoneRoom**

In `buildCurrentZoneRoom()`, after the existing enemy spawning block, add boss spawning logic. Replace the `// Spawn enemies` section:

```typescript
    // Spawn enemies (skip if tutorial is in move stage)
    if (zone.id !== 'tutorial' || this.tutorialStage !== 'move') {
      const enemies = this.zoneManager.spawnEnemies(zone, template, state.roomIndex);
      for (const e of enemies) {
        this.enemies.push(e);
        this.gameContainer!.addChild(e.sprite);
      }
    }

    // Spawn boss if this is a boss room
    this.bossSpawned = false;
    if (this.boss) {
      this.gameContainer!.removeChild(this.boss.sprite);
      this.gameContainer!.removeChild(this.boss.telegraphs);
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossHpBar) {
      this.app.stage.removeChild(this.bossHpBar.container);
      this.bossHpBar.destroy();
      this.bossHpBar = undefined;
    }

    const isBossRoom = state.roomIndex === zone.roomCount - 1 && zone.bossId;
    if (isBossRoom && zone.bossId) {
      this.spawnBoss(zone.bossId as BossId);
    }
```

- [ ] **Step 3: Add spawnBoss helper method**

Add this method to Game.ts:
```typescript
  private spawnBoss(bossId: BossId) {
    if (!this.gameContainer) return;
    const boss = new Boss(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, bossId);

    // Hook boss summon callback (for reaper cultists)
    boss.onSpawnEnemies((count, type) => {
      for (let i = 0; i < count; i++) {
        const margin = 80;
        const wa = this.room!.walkableArea;
        const x = margin + Math.random() * (wa.width - margin * 2) + wa.x;
        const y = margin + Math.random() * (wa.height - margin * 2) + wa.y;
        const e = new Enemy(x, y, type as any);
        this.enemies.push(e);
        this.gameContainer!.addChild(e.sprite);
      }
    });

    this.boss = boss;
    this.bossSpawned = true;
    this.gameContainer.addChild(boss.sprite);
    this.gameContainer.addChild(boss.telegraphs);

    this.bossHpBar = new BossHpBar(SCREEN_WIDTH);
    this.app.stage.addChild(this.bossHpBar.container);

    Logger.log('entity', `Boss spawned: ${boss.name}`);
  }
```

- [ ] **Step 4: Add boss update to updateGameplay**

In `updateGameplay()`, add after the enemy update loop (after `enemy.projectiles = [];`):
```typescript
    // Boss update
    if (this.boss?.alive) {
      this.boss.update(this.player.x, this.player.y, dt, this.room!.walls);
      for (const p of this.boss.projectiles) {
        this.projectiles.push(p);
        this.gameContainer!.addChild(p.sprite);
      }
      this.boss.projectiles = [];

      // Boss contact damage
      if (rectsOverlap(this.player.getBounds(), this.boss.getBounds())) {
        if (this.boss.alive) {
          this.player.takeDamage(this.boss.damage);
          this.combatText.showDamage(this.player.x, this.player.y - 20, this.boss.damage, 0xff6666);
        }
      }

      this.bossHpBar?.update(this.boss);
    }
```

- [ ] **Step 5: Handle boss death and projectiles hitting boss**

In the projectiles update loop (where friendly projectiles hit enemies), add boss hit check after the enemy loop:
```typescript
      // Check boss hit
      if (!p.hostile && this.boss?.alive) {
        if (rectsOverlap(p.getBounds(), this.boss.getBounds())) {
          this.boss.takeDamage(p.damage);
          this.combatText.showDamage(this.boss.x, this.boss.y - 20, p.damage, 0xffaa00);
          if (!p.pierce) {
            hit = true;
          }
        }
      }
```

In the enemy death section (after enemy cleanup), add boss death check:
```typescript
    // Boss death
    if (this.boss && !this.boss.alive && this.bossSpawned) {
      this.bossSpawned = false;

      // Mark zone completed
      this.zoneManager.markZoneCompleted(this.zoneManager.state!.zoneId);

      // Spawn generous loot
      this.spawnLoot(this.boss.x, this.boss.y);
      this.spawnLoot(this.boss.x - 40, this.boss.y);
      this.spawnLoot(this.boss.x + 40, this.boss.y);

      // Grant XP
      if (this.player.addXp(this.boss.xpReward)) {
        this.combatText.showDamage(this.boss.x, this.boss.y - 30, this.player.level - 1, 0x44ff88);
      }

      // Remove boss telegraph, destroy HP bar
      this.gameContainer!.removeChild(this.boss.telegraphs);
      if (this.bossHpBar) {
        this.app.stage.removeChild(this.bossHpBar.container);
        this.bossHpBar.destroy();
        this.bossHpBar = undefined;
      }

      // Spawn exit portal at boss room door position
      // (The door already exists in the template and goes to hub)
      Logger.log('system', `${this.boss.name} defeated — zone completed`);
    }
```

- [ ] **Step 6: Handle boss telegraph damage to player**

In the damage/contact section of `updateGameplay()`, add boss telegraph AoE damage check after contact damage. This checks if the player is standing in an active boss attack zone:

```typescript
    // Boss telegraph damage
    if (this.boss?.alive && this.boss.chosenAttack && this.boss.attacking) {
      const t = this.boss.chosenAttack;
      const pBounds = this.player.getBounds();
      let inZone = false;

      switch (t.type) {
        case 'circle':
          inZone = Math.hypot(this.player.x - t.x, this.player.y - t.y) < (t.radius || 80);
          break;
        case 'cone': {
          const dx = this.player.x - t.x;
          const dy = this.player.y - t.y;
          const dist = Math.hypot(dx, dy);
          if (dist < (t.radius || 100)) {
            const angleToPlayer = Math.atan2(dy, dx);
            let diff = angleToPlayer - (t.angle || 0);
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            inZone = Math.abs(diff) < 0.6;
          }
          break;
        }
        case 'line': {
          // Check if player is near the line
          const lx = t.targetX || t.x;
          const ly = t.targetY || t.y;
          const lineLen = Math.hypot(lx - t.x, ly - t.y);
          if (lineLen > 0) {
            const tParam = ((this.player.x - t.x) * (lx - t.x) + (this.player.y - t.y) * (ly - t.y)) / (lineLen * lineLen);
            if (tParam >= 0 && tParam <= 1) {
              const closestX = t.x + tParam * (lx - t.x);
              const closestY = t.y + tParam * (ly - t.y);
              inZone = Math.hypot(this.player.x - closestX, this.player.y - closestY) < 40;
            }
          }
          break;
        }
      }

      if (inZone) {
        this.player.takeDamage(this.boss.damage);
        this.combatText.showDamage(this.player.x, this.player.y - 20, this.boss.damage, 0xff6666);
      }
    }
```

- [ ] **Step 7: Clean up boss in restartGame**

In `restartGame()`, add boss cleanup after other cleanup:
```typescript
    if (this.boss) {
      if (this.boss.sprite.parent) this.gameContainer?.removeChild(this.boss.sprite);
      if (this.boss.telegraphs.parent) this.gameContainer?.removeChild(this.boss.telegraphs);
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossHpBar) {
      this.app.stage.removeChild(this.bossHpBar.container);
      this.bossHpBar.destroy();
      this.bossHpBar = undefined;
    }
    this.bossSpawned = false;
```

- [ ] **Step 8: Handle desert boss room placeholder (spawn enemies only)**

In the `buildCurrentZoneRoom()` section, after boss spawn check, add the desert placeholder logic. Since desert has no `bossId`, the `isBossRoom` will be true but `zone.bossId` will be undefined, so the boss won't spawn. The enemies will spawn normally via the `spawnEnemies()` call. We need to ensure that when all enemies in the desert boss room die, the zone is also marked completed.

Add after the boss death section:
```typescript
    // Desert boss room placeholder: mark completed when all enemies dead
    if (this.zoneManager.state?.config.id === 'desert' && this.zoneManager.state?.roomIndex === this.zoneManager.state?.config.roomCount - 1) {
      if (this.enemies.length === 0 && !this.bossSpawned && this.zoneManager.state) {
        const zoneId = this.zoneManager.state.zoneId;
        if (!this.zoneManager.completedZoneIds.has(zoneId)) {
          this.zoneManager.markZoneCompleted(zoneId);
          Logger.log('system', 'Desert boss room cleared — zone completed');
        }
      }
    }
```

- [ ] **Step 9: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add src/core/Game.ts src/entities/Boss.ts src/ui/BossHpBar.ts
git commit -m "feat: integrate boss lifecycle into game loop"
```
