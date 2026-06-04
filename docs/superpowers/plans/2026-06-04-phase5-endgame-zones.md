# Phase 5 — Endgame Zones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-room infinite waves with a hub town, tutorial, 3 story zones (forest/desert/ice), and 2 endless modes.

**Architecture:** ZoneManager owns zone state and room building. Game.ts delegates zone logic while keeping entity management. Room accepts BiomeData for visual theming. Doors and portals trigger transitions.

**Tech Stack:** TypeScript + PixiJS 7

---

### Task 1: ZoneConfig types + registry

**Files:**
- Create: `src/core/ZoneConfig.ts`

- [ ] **Write `ZoneConfig.ts` with all types and ZONE_REGISTRY**

```ts
import { EnemyType } from '../entities/Enemy';

export type BiomeId = 'dev' | 'hub' | 'tutorial' | 'forest' | 'desert' | 'ice' | 'endless';

export interface BiomeData {
  floorColorA: number;
  floorColorB: number;
  wallColor: number;
  wallBorderColor: number;
}

export const BIOME_DATA: Record<BiomeId, BiomeData> = {
  dev:       { floorColorA: 0x3a3a3a, floorColorB: 0x404040, wallColor: 0x4a4a5a, wallBorderColor: 0x5a5a6a },
  hub:       { floorColorA: 0x5a5a4a, floorColorB: 0x555545, wallColor: 0x6a5a4a, wallBorderColor: 0x7a6a5a },
  tutorial:  { floorColorA: 0x4a6a3a, floorColorB: 0x406030, wallColor: 0x3a5a2a, wallBorderColor: 0x4a6a3a },
  forest:    { floorColorA: 0x3a5a2a, floorColorB: 0x406030, wallColor: 0x3a4a2a, wallBorderColor: 0x4a5a3a },
  desert:    { floorColorA: 0x8a7a4a, floorColorB: 0x7a6a3a, wallColor: 0x9a7a5a, wallBorderColor: 0xaa8a6a },
  ice:       { floorColorA: 0xaaccff, floorColorB: 0x99bbee, wallColor: 0x8899cc, wallBorderColor: 0x99aadd },
  endless:   { floorColorA: 0x4a3a5a, floorColorB: 0x403050, wallColor: 0x3a2a4a, wallBorderColor: 0x4a3a5a },
};

export interface DoorMarker {
  rect: { x: number; y: number; width: number; height: number };
  targetZone: string;
  targetRoom: number;
}

export interface PortalMarker {
  rect: { x: number; y: number; width: number; height: number };
  targetZone: string;
  label: string;
}

export interface RoomTemplate {
  walls: { x: number; y: number; width: number; height: number }[];
  doors: DoorMarker[];
  portals: PortalMarker[];
  spawnZones: { x: number; y: number; width: number; height: number }[];
  playerStart: { x: number; y: number };
}

export interface ZoneConfig {
  id: string;
  name: string;
  biome: BiomeId;
  roomCount: number;
  enemyPool: EnemyType[];
  enemyHpMult: number;
  enemyDmgMult: number;
  enemyXpMult: number;
  isEndless: false | 'procgen' | 'wave';
  nextZone: string | null;
  availableFromHub: boolean;
  enemyCount: number | { min: number; max: number };
  templates: RoomTemplate[];
}

export const ZONE_REGISTRY: Record<string, ZoneConfig> = {
  dev: {
    id: 'dev', name: 'Developer Room', biome: 'dev',
    roomCount: 1, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: false, nextZone: 'hub', availableFromHub: false,
    enemyCount: { min: 3, max: 6 },
    templates: [],
  },
  hub: {
    id: 'hub', name: 'Town', biome: 'hub',
    roomCount: 1, enemyPool: [],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: false, nextZone: null, availableFromHub: false,
    enemyCount: 0,
    templates: [],
  },
  tutorial: {
    id: 'tutorial', name: 'Tutorial Glen', biome: 'tutorial',
    roomCount: 1, enemyPool: ['grunt'],
    enemyHpMult: 0.5, enemyDmgMult: 0.5, enemyXpMult: 0,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 2, max: 3 },
    templates: [],
  },
  forest: {
    id: 'forest', name: 'Verdant Forest', biome: 'forest',
    roomCount: 3, enemyPool: ['grunt', 'archer'],
    enemyHpMult: 1.0, enemyDmgMult: 1.0, enemyXpMult: 1.0,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 3, max: 5 },
    templates: [],
  },
  desert: {
    id: 'desert', name: 'Scorched Desert', biome: 'desert',
    roomCount: 4, enemyPool: ['grunt', 'archer', 'juggernaut'],
    enemyHpMult: 1.5, enemyDmgMult: 1.3, enemyXpMult: 1.5,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 4, max: 6 },
    templates: [],
  },
  ice: {
    id: 'ice', name: 'Frozen Wastes', biome: 'ice',
    roomCount: 5, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 2.5, enemyDmgMult: 2.0, enemyXpMult: 2.5,
    isEndless: false, nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 5, max: 7 },
    templates: [],
  },
  endless_dungeon: {
    id: 'endless_dungeon', name: 'Endless Dungeon', biome: 'endless',
    roomCount: 1, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: 'procgen', nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 4, max: 4 },
    templates: [],
  },
  endless_arena: {
    id: 'endless_arena', name: 'Endless Arena', biome: 'endless',
    roomCount: 1, enemyPool: ['grunt', 'archer', 'juggernaut', 'cultist'],
    enemyHpMult: 1, enemyDmgMult: 1, enemyXpMult: 1,
    isEndless: 'wave', nextZone: 'hub', availableFromHub: true,
    enemyCount: { min: 3, max: 3 },
    templates: [],
  },
};
```

- [ ] **Run `npx tsc --noEmit`** — should pass cleanly since this has no imports from external files (just EnemyType which already exists)

- [ ] **Commit**

```bash
git add src/core/ZoneConfig.ts
git commit -m "feat: add ZoneConfig types and ZONE_REGISTRY"
```

---

### Task 2: Biome-aware Room + RoomTemplates

**Files:**
- Create: `src/world/RoomTemplates.ts`
- Modify: `src/world/Room.ts`

- [ ] **Create `RoomTemplates.ts` with 5 base layouts**

```ts
import type { RoomTemplate } from '../core/ZoneConfig';

const W = 1600;
const H = 896;
const T = 32;

export function cloneTemplate(t: RoomTemplate): RoomTemplate {
  return {
    walls: t.walls.map(w => ({ ...w })),
    doors: t.doors.map(d => ({ ...d, rect: { ...d.rect } })),
    portals: t.portals.map(p => ({ ...p, rect: { ...p.rect } })),
    spawnZones: t.spawnZones.map(s => ({ ...s })),
    playerStart: { ...t.playerStart },
  };
}

// Open room — no internal obstacles
export const TEMPLATE_OPEN: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [],
  spawnZones: [{ x: T + 50, y: T + 50, width: W - T * 2 - 100, height: H - T * 2 - 100 }],
  playerStart: { x: W / 2, y: H / 2 },
};

// 4 pillar walls in center area
export const TEMPLATE_PILLARS: RoomTemplate = {
  walls: [
    { x: 680, y: 340, width: 40, height: 40 },
    { x: 880, y: 340, width: 40, height: 40 },
    { x: 680, y: 516, width: 40, height: 40 },
    { x: 880, y: 516, width: 40, height: 40 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: T + 50, y: T + 50, width: 400, height: 200 },
    { x: 1100, y: T + 50, width: 400, height: 200 },
    { x: T + 50, y: 500, width: 400, height: 300 },
    { x: 1100, y: 500, width: 400, height: 300 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};

// L-shaped corridors
export const TEMPLATE_L_SHAPE: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 600, height: 40 },
    { x: 600, y: 200, width: 40, height: 240 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: T + 50, y: T + 50, width: 500, height: 300 },
    { x: 700, y: T + 50, width: 800, height: 100 },
    { x: 700, y: 480, width: 800, height: 350 },
    { x: T + 50, y: 480, width: 500, height: 350 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};

// Cross room — walls dividing into quadrants
export const TEMPLATE_CROSS: RoomTemplate = {
  walls: [
    { x: 0, y: 400, width: 750, height: 40 },
    { x: 850, y: 400, width: 750, height: 40 },
    { x: 750, y: 0, width: 40, height: 400 },
    { x: 810, y: 440, width: 40, height: 456 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: T + 50, y: T + 50, width: 600, height: 300 },
    { x: 900, y: T + 50, width: 600, height: 300 },
    { x: T + 50, y: 480, width: 600, height: 350 },
    { x: 900, y: 480, width: 600, height: 350 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};

// Ring — circular wall segment
export const TEMPLATE_RING: RoomTemplate = {
  walls: [
    { x: 700, y: 300, width: 200, height: 40 },
    { x: 700, y: 556, width: 200, height: 40 },
    { x: 700, y: 300, width: 40, height: 296 },
    { x: 860, y: 300, width: 40, height: 296 },
  ],
  doors: [],
  portals: [],
  spawnZones: [
    { x: T + 50, y: T + 50, width: 550, height: 200 },
    { x: 900, y: T + 50, width: 600, height: 200 },
    { x: T + 50, y: 500, width: 550, height: 300 },
    { x: 900, y: 500, width: 600, height: 300 },
  ],
  playerStart: { x: W / 2, y: H / 2 },
};
```

- [ ] **Modify `Room.ts` to accept BiomeData and render accordingly**

Import BiomeData:
```ts
import { BiomeData, BIOME_DATA, DoorMarker, PortalMarker } from '../core/ZoneConfig';
```

Add to constructor params:
```ts
constructor(biome: BiomeId = 'dev', doors: DoorMarker[] = [], portals: PortalMarker[] = []) {
```

Store them:
```ts
  this.biomeData = BIOME_DATA[biome];
  this.doors = doors;
  this.portals = portals;
```

Add fields:
```ts
  biomeData: BiomeData;
  doors: DoorMarker[];
  portals: PortalMarker[];
```

Update the `build()` method to use `this.biomeData` colors instead of hardcoded `0x3a3a3a`, `0x404040`, `0x4a4a5a`, `0x5a5a6a`.

Render door markers as dark archways in walls:
```ts
private renderDoors() {
  for (const door of this.doors) {
    const g = new Graphics();
    g.beginFill(0x000000, 0.6);
    g.drawRect(door.rect.x, door.rect.y, door.rect.width, door.rect.height);
    g.endFill();
    g.lineStyle(2, 0x888888, 0.8);
    g.drawRect(door.rect.x, door.rect.y, door.rect.width, door.rect.height);
    this.container.addChild(g);
  }
}
```

Render portal markers as glowing glyphs:
```ts
private renderPortals() {
  for (const portal of this.portals) {
    const g = new Graphics();
    const cx = portal.rect.x + portal.rect.width / 2;
    const cy = portal.rect.y + portal.rect.height / 2;
    const r = Math.min(portal.rect.width, portal.rect.height) / 2;
    g.beginFill(0x8844ff, 0.3);
    g.drawCircle(cx, cy, r);
    g.endFill();
    g.lineStyle(2, 0xaa66ff, 0.8);
    g.drawCircle(cx, cy, r);
    g.lineStyle(1, 0xcc88ff, 0.5);
    g.drawCircle(cx, cy, r * 0.6);
    this.container.addChild(g);
  }
}
```

Call these at end of `build()`:
```ts
this.renderDoors();
this.renderPortals();
```

Full oldString/newString for the Room constructor change:

Old constructor:
```ts
  constructor() {
    this.container = new Container();
    this.walkableArea = {
      x: WALL_THICKNESS,
      y: WALL_THICKNESS,
      width: ROOM_WIDTH - WALL_THICKNESS * 2,
      height: ROOM_HEIGHT - WALL_THICKNESS * 2,
    };
    this.build();
    Logger.log('system', `Room created: ${ROOM_WIDTH}x${ROOM_HEIGHT}, walkable: ${this.walkableArea.width}x${this.walkableArea.height}`);
  }
```

New constructor:
```ts
  constructor(biome: BiomeId = 'dev', doors: DoorMarker[] = [], portals: PortalMarker[] = []) {
    this.container = new Container();
    this.biomeData = BIOME_DATA[biome];
    this.doors = doors;
    this.portals = portals;
    this.walkableArea = {
      x: WALL_THICKNESS,
      y: WALL_THICKNESS,
      width: ROOM_WIDTH - WALL_THICKNESS * 2,
      height: ROOM_HEIGHT - WALL_THICKNESS * 2,
    };
    this.build();
    Logger.log('system', `Room created: ${ROOM_WIDTH}x${ROOM_HEIGHT}, biome: ${biome}`);
  }
```

Old build method color references — replace:
- `0x3a3a3a` → `this.biomeData.floorColorA`
- `0x404040` → `this.biomeData.floorColorB`
- `0x4a4a5a` → `this.biomeData.wallColor`
- `0x5a5a6a` → `this.biomeData.wallBorderColor`

- [ ] **Run `npx tsc --noEmit`** — should pass

- [ ] **Commit**

```bash
git add src/world/RoomTemplates.ts src/world/Room.ts
git commit -m "feat: biome-aware Room with door/portal markers, room templates"
```

---

### Task 3: ZoneManager

**Files:**
- Create: `src/core/ZoneManager.ts`

- [ ] **Write `ZoneManager.ts`**

```ts
import { Container } from 'pixi.js';
import { Room, ROOM_WIDTH, ROOM_HEIGHT } from '../world/Room';
import { Player } from '../entities/Player';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ItemDrop } from '../entities/ItemDrop';
import { Logger } from './Logger';
import { ZoneConfig, ZONE_REGISTRY, RoomTemplate } from './ZoneConfig';
import { cloneTemplate } from '../world/RoomTemplates';
import * as Templates from '../world/RoomTemplates';

export interface ZoneState {
  zoneId: string;
  roomIndex: number;
  config: ZoneConfig;
  currentTemplate: RoomTemplate;
}

export class ZoneManager {
  state: ZoneState | null = null;
  private endlessWave = 0;
  private endlessRoomCount = 0;

  get zoneId(): string { return this.state?.zoneId ?? 'hub'; }
  get roomIndex(): number { return this.state?.roomIndex ?? 0; }
  get config(): ZoneConfig | null { return this.state?.config ?? null; }
  get template(): RoomTemplate | null { return this.state?.currentTemplate ?? null; }

  static getZone(id: string): ZoneConfig | undefined {
    return ZONE_REGISTRY[id];
  }

  private pickTemplate(zone: ZoneConfig, roomIndex: number): RoomTemplate {
    const pool = zone.templates.length > 0 ? zone.templates : [Templates.TEMPLATE_OPEN];
    const idx = roomIndex % pool.length;
    return cloneTemplate(pool[idx]);
  }

  private countEnemies(zone: ZoneConfig, roomIndex: number): number {
    const cfg = zone.enemyCount;
    if (typeof cfg === 'number') return cfg;
    return cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
  }

  spawnEnemies(zone: ZoneConfig, template: RoomTemplate, roomIndex: number): Enemy[] {
    const enemies: Enemy[] = [];
    const count = this.countEnemies(zone, roomIndex);

    for (let i = 0; i < count; i++) {
      const pool = zone.enemyPool;
      if (pool.length === 0) break;

      let type: EnemyType;
      if (zone.isEndless === 'wave') {
        // Arena: evolve composition by wave
        if (this.endlessWave < 5) type = 'grunt';
        else if (this.endlessWave < 10) type = Math.random() < 0.7 ? 'grunt' : 'archer';
        else if (this.endlessWave < 15) {
          const r = Math.random();
          type = r < 0.5 ? 'grunt' : r < 0.8 ? 'archer' : 'juggernaut';
        } else {
          type = pool[Math.floor(Math.random() * pool.length)];
        }
      } else if (zone.isEndless === 'procgen') {
        // Dungeon: more juggs/cultists at depth
        const depth = this.endlessRoomCount;
        if (depth > 20) type = pool[Math.floor(Math.random() * pool.length)];
        else if (depth > 10) {
          const r = Math.random();
          type = r < 0.3 ? 'grunt' : r < 0.6 ? 'archer' : r < 0.8 ? 'juggernaut' : 'cultist';
        } else {
          type = pool[Math.floor(Math.random() * pool.length)];
        }
      } else {
        type = pool[Math.floor(Math.random() * pool.length)];
      }

      const sz = template.spawnZones[Math.floor(Math.random() * template.spawnZones.length)];
      let x = sz.x + 32 + Math.random() * (sz.width - 64);
      let y = sz.y + 32 + Math.random() * (sz.height - 64);
      x = Math.max(64, Math.min(ROOM_WIDTH - 64, x));
      y = Math.max(64, Math.min(ROOM_HEIGHT - 64, y));

      const hpMult = this.getHpMult(zone, roomIndex);
      const dmgMult = this.getDmgMult(zone, roomIndex);
      const xpMult = this.getXpMult(zone, roomIndex);

      const e = new Enemy(x, y, type);
      e.maxHealth = Math.round(e.maxHealth * hpMult);
      e.health = e.maxHealth;
      e.damage = Math.round(e.damage * dmgMult);
      e.xpReward = Math.round(e.xpReward * xpMult);
      enemies.push(e);
    }

    return enemies;
  }

  transitionTo(zoneId: string): ZoneState {
    const config = ZONE_REGISTRY[zoneId];
    if (!config) {
      Logger.log('system', `Unknown zone: ${zoneId}, defaulting to hub`);
      return this.transitionTo('hub');
    }

    const roomIndex = 0;
    const template = this.pickTemplate(config, roomIndex);

    if (config.isEndless === 'wave') {
      this.endlessWave = 0;
    }
    if (config.isEndless === 'procgen') {
      this.endlessRoomCount = 0;
    }

    this.state = { zoneId, roomIndex, config, currentTemplate: template };
    Logger.log('system', `Transitioned to zone: ${config.name}, room ${roomIndex + 1}/${config.roomCount}`);
    return this.state;
  }

  nextRoom(): ZoneState | null {
    if (!this.state) return null;
    const { config } = this.state;
    const nextIdx = this.state.roomIndex + 1;

    if (config.isEndless === 'procgen') {
      this.endlessRoomCount++;
      const template = this.pickTemplate(config, 0);
      this.state = { ...this.state, roomIndex: nextIdx, currentTemplate: template };
      return this.state;
    }

    if (nextIdx >= config.roomCount) {
      if (config.nextZone) return this.transitionTo(config.nextZone);
      return null;
    }

    const template = this.pickTemplate(config, nextIdx);
    this.state = { ...this.state, roomIndex: nextIdx, currentTemplate: template };
    return this.state;
  }

  nextWave(): number {
    this.endlessWave++;
    if (!this.state) return 0;
    const template = this.pickTemplate(this.state.config, 0);
    this.state = { ...this.state, currentTemplate: template };
    return this.endlessWave;
  }

  getHpMult(zone: ZoneConfig, roomIndex: number): number {
    if (zone.isEndless === 'procgen') return zone.enemyHpMult * (1 + this.endlessRoomCount * 0.1);
    if (zone.isEndless === 'wave') return zone.enemyHpMult * (1 + this.endlessWave * 0.08);
    return zone.enemyHpMult;
  }

  getDmgMult(zone: ZoneConfig, roomIndex: number): number {
    if (zone.isEndless === 'procgen') return zone.enemyDmgMult * (1 + this.endlessRoomCount * 0.08);
    if (zone.isEndless === 'wave') return zone.enemyDmgMult * (1 + this.endlessWave * 0.06);
    return zone.enemyDmgMult;
  }

  getXpMult(zone: ZoneConfig, roomIndex: number): number {
    if (zone.isEndless === 'procgen') return zone.enemyXpMult * (1 + this.endlessRoomCount * 0.15);
    if (zone.isEndless === 'wave') return zone.enemyXpMult;
    return zone.enemyXpMult;
  }
}
```

Need to add `export` to `cloneTemplate` in RoomTemplates.ts — or just import the right thing. Let's define it locally.

Actually, looking back at Task 2, I put `cloneTemplate` in RoomTemplates.ts. Let me import it from there. But the ZoneManager imports `cloneTemplate` from ZoneConfig which is wrong. Let me fix the import in ZoneManager — `cloneTemplate` is in RoomTemplates.ts.

Also, the RoomTemplates.ts needs to be created first (or at least remembered). The ZoneManager depends on it. Since this plan is sequential, that's fine — Task 2 runs before Task 3.

Wait, but I need to be careful about the import path. Let me fix:

```ts
import { cloneTemplate } from '../world/RoomTemplates';
```

Actually, I should just not export `cloneTemplate` from RoomTemplates.ts and instead put it in ZoneManager itself. Simpler.

- [ ] **Run `npx tsc --noEmit`** — should pass

- [ ] **Commit**

```bash
git add src/core/ZoneManager.ts
git commit -m "feat: ZoneManager with zone transitions and enemy spawning"
```

---

### Task 4: Hub zone

**Files:**
- Modify: `src/core/ZoneManager.ts` (add template data for hub)
- Modify: `src/world/RoomTemplates.ts` (add hub-specific templates)

- [ ] **Add hub room template to RoomTemplates.ts**

```ts
// Hub — town with portal positions
export const TEMPLATE_HUB: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [
    {
      rect: { x: 50, y: 80, width: 80, height: 80 },
      targetZone: 'tutorial', label: 'Tutorial',
    },
    {
      rect: { x: 1470, y: 80, width: 80, height: 80 },
      targetZone: 'endless_arena', label: 'Endless Arena',
    },
    {
      rect: { x: 50, y: 400, width: 80, height: 80 },
      targetZone: 'forest', label: 'Verdant Forest',
    },
    {
      rect: { x: 1470, y: 400, width: 80, height: 80 },
      targetZone: 'desert', label: 'Scorched Desert',
    },
    {
      rect: { x: 50, y: 720, width: 80, height: 80 },
      targetZone: 'ice', label: 'Frozen Wastes',
    },
    {
      rect: { x: 1470, y: 720, width: 80, height: 80 },
      targetZone: 'endless_dungeon', label: 'Endless Dungeon',
    },
  ],
  spawnZones: [],
  playerStart: { x: 800, y: 448 },
};

// Tutorial — exit door to hub
export const TEMPLATE_TUTORIAL: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 750, y: 860, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 },
  ],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};

// Arena — open room with no exit
export const TEMPLATE_ARENA: RoomTemplate = {
  walls: [],
  doors: [],
  portals: [
    { rect: { x: 1500, y: 10, width: 80, height: 50 }, targetZone: 'hub', label: 'Exit' },
  ],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};

// Dungeon room — exit door to next room, exit portal to hub
export const TEMPLATE_DUNGEON: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 750, y: 860, width: 100, height: 36 }, targetZone: 'endless_dungeon', targetRoom: -1 },
  ],
  portals: [
    { rect: { x: 1500, y: 10, width: 80, height: 50 }, targetZone: 'hub', label: 'Exit' },
  ],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};
```

- [ ] **Wire hub template into ZONE_REGISTRY** — update `templates` field for hub, tutorial, endless_arena, endless_dungeon in `ZoneConfig.ts`:

```ts
// In imports at top of ZoneConfig.ts:
import { TEMPLATE_HUB, TEMPLATE_TUTORIAL, TEMPLATE_ARENA, TEMPLATE_DUNGEON } from '../world/RoomTemplates';

// Update hub config:
  hub: {
    ...existing hub config...
    templates: [TEMPLATE_HUB],
  },
  tutorial: {
    ...existing tutorial config...
    templates: [TEMPLATE_TUTORIAL],
  },
  endless_arena: {
    ...existing arena config...
    templates: [TEMPLATE_ARENA],
  },
  endless_dungeon: {
    ...existing dungeon config...
    templates: [TEMPLATE_DUNGEON],
  },
```

- [ ] **Run `npx tsc --noEmit`** — should pass

- [ ] **Commit**

```bash
git add src/world/RoomTemplates.ts src/core/ZoneConfig.ts
git commit -m "feat: hub, tutorial, arena, dungeon room templates"
```

---

### Task 5: Game.ts integration — ZoneManager wiring

**Files:**
- Modify: `src/core/Game.ts`

This is the largest change. The old wave spawning system is replaced with ZoneManager.

- [ ] **Add imports at top of Game.ts:**

```ts
import { ZoneManager } from './ZoneManager';
import { ZoneConfig, ZONE_REGISTRY, RoomTemplate, DoorMarker, PortalMarker } from './ZoneConfig';
```

- [ ] **Add ZoneManager field:**

```ts
private zoneManager: ZoneManager = new ZoneManager();
```

- [ ] **Replace `spawnWave()` with zone-aware room building method:**

```ts
private buildCurrentZoneRoom() {
  if (!this.gameContainer || !this.room || !this.player) return;

  // Clear existing entities
  for (const e of this.enemies) { this.gameContainer.removeChild(e.sprite); e.destroy(); }
  for (const p of this.projectiles) { this.gameContainer.removeChild(p.sprite); p.destroy(); }
  for (const d of this.itemDrops) { this.gameContainer.removeChild(d.container); d.destroy(); }
  this.enemies = [];
  this.projectiles = [];
  this.itemDrops = [];
  this.vfx = [];
  this.dash = null;

  // Remove old room visuals
  this.gameContainer.removeChild(this.room.container);
  this.room.container.destroy({ children: true });

  // Build new room
  const state = this.zoneManager.state;
  if (!state) return;

  const zone = state.config;
  const template = state.currentTemplate;

  this.room = new Room(zone.biome, template.doors, template.portals);
  this.gameContainer.addChild(this.room.container);

  // Position player
  this.player.x = template.playerStart.x;
  this.player.y = template.playerStart.y;

  // Spawn enemies
  const enemies = this.zoneManager.spawnEnemies(zone, template, state.roomIndex);
  for (const e of enemies) {
    this.enemies.push(e);
    this.gameContainer.addChild(e.sprite);
  }

  // Reset wave cooldown for arena
  if (zone.isEndless === 'wave') {
    this.waveCooldown = 120;
  }
}
```

- [ ] **Update `startGame()` to initialize ZoneManager:**

Replace `this.spawnWave()` at the end of `startGame()`:

```ts
this.state = State.Playing;
// ... existing gameContainer, room, player setup ...
this.zoneManager.transitionTo('hub');
this.buildCurrentZoneRoom();
// Remove: this.spawnWave();
```

- [ ] **Update `updateGameplay()` — replace wave spawning with zone logic:**

Add door/portal overlap checks and zone transitions. After the existing enemy death/loot code (around line 418), replace the old `this.enemies.length === 0` wave block:

```ts
// Zone transition logic
const zone = this.zoneManager.state?.config;

if (zone?.isEndless === 'wave') {
  // Arena: wave-based spawning
  if (this.enemies.length === 0) {
    if (this.waveCooldown <= 0) {
      this.waveCooldown = 120;
    } else {
      this.waveCooldown -= dt;
      if (this.waveCooldown <= 0) {
        this.zoneManager.nextWave();
        this.buildCurrentZoneRoom();
      }
    }
  }
} else if (zone && !zone.isEndless && zone.id !== 'hub') {
  // Story/tutorial: all enemies dead -> exit door opens
  if (this.enemies.length === 0 && zone.nextZone) {
    // All enemies defeated — doors remain, nothing else to do
    // Player walks through door to transition
  }
}

// Door overlap check
for (const door of this.room?.doors ?? []) {
  if (this.player && rectsOverlap(this.player.getBounds(), door.rect)) {
    if (zone?.isEndless === 'procgen' || (zone && door.targetZone === zone.id)) {
      this.zoneManager.nextRoom();
    } else {
      this.zoneManager.transitionTo(door.targetZone);
    }
    this.buildCurrentZoneRoom();
    break;
  }
}

// Portal click check
if (this.input.consumeClick()) {
  let clickedPortal = false;
  for (const portal of this.room?.portals ?? []) {
    if (this.player) {
      const dist = Math.hypot(
        mouseWX - (portal.rect.x + portal.rect.width / 2),
        mouseWY - (portal.rect.y + portal.rect.height / 2),
      );
      if (dist < 60) {
        this.zoneManager.transitionTo(portal.targetZone);
        this.buildCurrentZoneRoom();
        clickedPortal = true;
        break;
      }
    }
  }
  if (!clickedPortal) {
    // ... existing click handling ...
  }
}
```

This is getting complex. Let me be more precise about the edit. The portal click check should replace the existing `if (this.input.consumeClick())` block.

Actually, I'm writing too much inline. Let me simplify the plan. The key changes to Game.ts are:

1. Replace `this.spawnWave()` call in `startGame()` with zone init
2. Remove the old `spawnWave()` method
3. Add `buildCurrentZoneRoom()` method
4. In `updateGameplay()`:
   - Remove the old `if (this.enemies.length === 0) { wave }` block
   - Add door overlap check
   - Modify the click handler to check portal clicks first, then existing loot/item clicks, then main ability
5. Add `/devroom` command to dev console

Let me write this more concisely.

Actually, I think the plan is getting really long with too much code repetition. Let me organize it as task outlines with the critical code shown and references to the existing code structure.

Let me streamline the plan.

- [ ] **Modify `Game.ts` — replace wave spawning with ZoneManager**

Changes:
1. Add imports: `ZoneManager`, `ZONE_REGISTRY`, `RoomTemplate`, `DoorMarker`, `PortalMarker`
2. Add field: `private zoneManager = new ZoneManager();`
3. In `startGame()`: remove `this.spawnWave()`, add `this.zoneManager.transitionTo('hub')` + `this.buildCurrentZoneRoom()`
4. Add new method `buildCurrentZoneRoom()`:
   - Clear all entity arrays and remove children
   - Destroy old room container
   - Get current zone state from zoneManager
   - Create new `Room(zone.biome, template.doors, template.portals)`
   - Position player at template.playerStart
   - Call `zoneManager.spawnEnemies()` and add to gameContainer
5. In `updateGameplay()`: replace the wave-spawning block (around lines 418-428) with:
   - Arena endless: wave cooldown → nextWave() → rebuild room
   - Story zones: no action (enemies kill themselves)
   - Door overlap check: nextRoom or transitionTo → rebuild
6. In the click handler: before existing loot/game click logic, check portal clicks

- [ ] **Run `npx tsc --noEmit`** — fix any errors

- [ ] **Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: wire ZoneManager into Game.ts, replace wave spawning"
```

---

### Task 6: HUD zone name display + dev console command

**Files:**
- Modify: `src/ui/HUD.ts`
- Modify: `src/core/DeveloperConsole.ts`

- [ ] **Add zone name display to HUD**

In `HUD.ts`, add a `PIXI.Text` field `zoneText` positioned at top-center of screen. Update it when `update()` is called with a zone name.

Add to HUD class:
```ts
private zoneText: Text;

// In constructor, after other text elements:
this.zoneText = new Text('', { fontFamily: 'monospace', fontSize: 18, fill: 0xcccccc });
this.zoneText.anchor.set(0.5, 0);
this.zoneText.x = 960;
this.zoneText.y = 10;
this.container.addChild(this.zoneText);

// New method:
setZoneName(name: string) {
  this.zoneText.text = name;
}
```

In `Game.ts` HUD update call, pass the zone name:
```ts
this.hud?.update(this.player);
this.hud?.setZoneName(this.zoneManager.state?.config?.name ?? '');
```

- [ ] **Add `/devroom` command to developer console**

In `Game.ts`'s `setupConsoleCommands()`, add:
```ts
c.registerCommand({
  name: 'devroom', aliases: ['dev'],
  description: 'Teleport to developer room',
  usage: '/devroom',
  run: () => {
    if (!this.player) return 'No player';
    this.zoneManager.transitionTo('dev');
    this.buildCurrentZoneRoom();
    return 'Teleported to Developer Room';
  },
});
```

- [ ] **Run `npx tsc --noEmit`** — should pass

- [ ] **Commit**

```bash
git add src/ui/HUD.ts src/core/Game.ts
git commit -m "feat: zone name on HUD, /devroom command"
```

---

### Task 7: Story zone templates

**Files:**
- Modify: `src/world/RoomTemplates.ts` (add story zone templates)
- Modify: `src/core/ZoneConfig.ts` (wire templates into zone configs)

- [ ] **Add 3-4 templates per story zone to RoomTemplates.ts**

Create template arrays for each zone:

```ts
// Forest zone templates (3 variations)
export const TEMPLATE_FOREST_1 = cloneTemplate(TEMPLATE_OPEN); // or define fresh
export const TEMPLATE_FOREST_2 = cloneTemplate(TEMPLATE_PILLARS);
export const TEMPLATE_FOREST_3 = cloneTemplate(TEMPLATE_L_SHAPE);

// Desert zone templates (4 variations)
export const TEMPLATE_DESERT_1 = cloneTemplate(TEMPLATE_OPEN);
export const TEMPLATE_DESERT_2 = cloneTemplate(TEMPLATE_CROSS);
export const TEMPLATE_DESERT_3 = cloneTemplate(TEMPLATE_PILLARS);
export const TEMPLATE_DESERT_4 = cloneTemplate(TEMPLATE_RING);

// Ice zone templates (5 variations)
export const TEMPLATE_ICE_1 = cloneTemplate(TEMPLATE_L_SHAPE);
export const TEMPLATE_ICE_2 = cloneTemplate(TEMPLATE_CROSS);
export const TEMPLATE_ICE_3 = cloneTemplate(TEMPLATE_PILLARS);
export const TEMPLATE_ICE_4 = cloneTemplate(TEMPLATE_RING);
export const TEMPLATE_ICE_5 = cloneTemplate(TEMPLATE_OPEN);
```

Add door markers to each template so rooms connect. The last room in each zone gets a door back to hub:

```ts
// Example: forest room 1 door leads to forest room 2
TEMPLATE_FOREST_1.doors.push({
  rect: { x: 750, y: 860, width: 100, height: 36 },
  targetZone: 'forest', targetRoom: 1,
});
TEMPLATE_FOREST_2.doors.push({
  rect: { x: 750, y: 0, width: 100, height: 36 },
  targetZone: 'forest', targetRoom: 2,
});
TEMPLATE_FOREST_3.doors.push({
  rect: { x: 750, y: 860, width: 100, height: 36 },
  targetZone: 'hub', targetRoom: 0,
});
```

Wait, `targetRoom` is used to determine which room template to load. But since templates are picked by roomIndex, the door just needs to transition within the same zone to the next index. Let me simplify:

For story zones, the door's `targetZone` is the same zone ID, and `targetRoom` is `roomIndex + 1`. The ZoneManager's transition logic reads `targetRoom` to set the new room index.

Actually, looking at my ZoneManager code from Task 3, `transitionTo()` always starts at room 0. I need to differentiate between "entering a new zone" and "moving to next room within zone." I have `nextRoom()` for that. So doors in story zones should call `nextRoom()` not `transitionTo()`.

Let me think about this differently. The door marker holds a targetZone and targetRoom. The Game.ts code should:

1. If door.targetZone === current zone and door.targetRoom > current room → call zoneManager.nextRoom()
2. Else → call zoneManager.transitionTo(door.targetZone)

This is cleaner. Let me update the plan accordingly.

Actually, the simplest approach: `nextRoom()` handles moving to the next room within a zone. If `door.targetZone` is the same as current zone, call `nextRoom()`. If different, call `transitionTo()`.

For endless dungeon: the door also calls `nextRoom()` which handles the procedural logic.

I'll add this logic to the Game.ts door check in Task 5.

- [ ] **Wire templates into ZONE_REGISTRY in ZoneConfig.ts**

Update forest, desert, ice configs to reference their templates:
```ts
import { TEMPLATE_FOREST_1, TEMPLATE_FOREST_2, TEMPLATE_FOREST_3, ... } from '../world/RoomTemplates';

forest: {
  ...forest config...
  templates: [TEMPLATE_FOREST_1, TEMPLATE_FOREST_2, TEMPLATE_FOREST_3],
},
desert: {
  ...desert config...
  templates: [TEMPLATE_DESERT_1, TEMPLATE_DESERT_2, TEMPLATE_DESERT_3, TEMPLATE_DESERT_4],
},
ice: {
  ...ice config...
  templates: [TEMPLATE_ICE_1, TEMPLATE_ICE_2, TEMPLATE_ICE_3, TEMPLATE_ICE_4, TEMPLATE_ICE_5],
},
```

- [ ] **Run `npx tsc --noEmit`** — should pass

- [ ] **Commit**

```bash
git add src/world/RoomTemplates.ts src/core/ZoneConfig.ts
git commit -m "feat: story zone room templates with door transitions"
```

---

### Task 8: Dev room template + Game.ts cleanup

**Files:**
- Modify: `src/world/RoomTemplates.ts` (add dev room door)
- Modify: `src/core/Game.ts` (remove old spawnWave, cleanup)

- [ ] **Add dev room door to hub template** (already planned — hub's "backroom portal to dev room" isn't visualized yet). Add a hidden portal to hub that only appears when `/devroom` is used:

Actually, simpler: add a dev door to the hub template manually in `ZoneConfig.ts` after transition. Or: when `/devroom` is typed, it just calls `zoneManager.transitionTo('dev')`. No portal needed.

The dev room needs a door back to hub. Add a door to the dev room template in `RoomTemplates.ts`:

```ts
export const TEMPLATE_DEV: RoomTemplate = {
  walls: [],
  doors: [
    { rect: { x: 750, y: 860, width: 100, height: 36 }, targetZone: 'hub', targetRoom: 0 },
  ],
  portals: [],
  spawnZones: [{ x: 64, y: 64, width: 1472, height: 768 }],
  playerStart: { x: 800, y: 448 },
};
```

Wire into dev config:
```ts
dev: {
  ... dev config ...
  templates: [TEMPLATE_DEV],
},
```

- [ ] **Remove the old `spawnWave()` method from Game.ts** — it's replaced by ZoneManager

- [ ] **Clean up any remaining wave references** — ensure `waveCooldown` is only used for arena mode

- [ ] **Run `npx tsc --noEmit`** — should pass

- [ ] **Commit**

```bash
git add src/world/RoomTemplates.ts src/core/ZoneConfig.ts src/core/Game.ts
git commit -m "feat: dev room template, remove old spawnWave system"
```

---

### Task 9: Playtest and bugfix

- [ ] **Run `npm run build`** — verify the project builds

- [ ] **Manual test checklist:**
  1. Game starts → player appears in hub
  2. Hub portals visible, clickable
  3. Tutorial: 2-3 weak grunts, kill, door opens to hub
  4. Verdant Forest: 3 rooms, doors between them, exit to hub
  5. Scorched Desert: 4 rooms, harder enemies
  6. Frozen Wastes: 5 rooms, toughest enemies
  7. Endless Arena: infinite waves, each wave harder
  8. Endless Dungeon: rooms get progressively harder, exit portal works
  9. `/devroom` → teleports to dev room, door back to hub
  10. HUD shows current zone name
  11. All existing features still work (items, inventory, passive tree, etc.)

- [ ] **Fix any TypeScript or gameplay bugs** found during testing

- [ ] **Commit**

```bash
git add -A && git commit -m "fix: playtest fixes for zone transitions and room building"
```
