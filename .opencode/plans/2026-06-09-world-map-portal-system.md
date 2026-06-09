# World Map & Portal Discovery System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing fixed-destination portal system with a Hero Siege-style world map and portal discovery system. Every portal opens a world map overlay; zones are unlocked by discovering their portal in the world; the town hub gets one central portal instead of six side portals.

**Architecture:** New `WorldMapData.ts` defines map metadata (positions, connections, icons, descriptions, discovered state). New `WorldMapScreen.ts` renders the full-screen parchment map overlay. New `DiscoveryNotification.ts` shows the non-intrusive discovery toast. Room.ts portal rendering adds undiscovered state (greyscale, ??? label, no VFX). Game.ts portal interaction changes from click-to-teleport to click-to-open-map. Hub template loses 6 side portals, gains 1 central portal. Every non-hub zone template gains exactly 1 portal. Save system adds `discoveredZones` array.

**Tech Stack:** TypeScript + PixiJS 7 + Vite 5

---

## File Structure

### New Files (3)
| File | Lines | Purpose |
|------|-------|---------|
| `src/core/WorldMapData.ts` | ~100 | World map registry: zone positions, connections, icons, descriptions, discovered state |
| `src/ui/WorldMapScreen.ts` | ~400 | Full-screen parchment world map overlay with node/connection rendering |
| `src/ui/DiscoveryNotification.ts` | ~120 | Slide-in discovery notification for top-right of screen |

### Modified Files (7)
| File | Lines Changed | Changes |
|------|---------------|---------|
| `src/world/RoomTemplates.ts` | ~50 | Hub: remove 6 portals, add 1 central. All non-hub templates: add 1 portal each |
| `src/world/Room.ts` | ~30 | Portal rendering: undiscovered greyscale state, discovery transition |
| `src/core/Game.ts` | ~200 | Portal interaction rework, world map toggle, discovery flow, teleport sequence |
| `src/core/ZoneManager.ts` | ~10 | Remove isPortalUnlocked callback usage, add discovered tracking |
| `src/core/SaveManager.ts` | ~20 | Add `discoveredZones` to SaveData, serialization/deserialization |
| `src/ui/Minimap.ts` | ~15 | Show portal locations as cyan dots on minimap |
| `src/core/ZoneConfig.ts` | ~5 | Add `discovered?` field to PortalMarker |

---

## Data Design: World Map Registry

The world map registry lives in `src/core/WorldMapData.ts`. It is **separate** from the gameplay `ZoneConfig` (ZoneRegistry.ts) — it maps zone IDs to map display data only. The `discovered` field is runtime-mutable; `connections` drive visual path lines between nodes.

All zone IDs match those in the existing `ZONE_REGISTRY` (ZoneRegistry.ts).

### Zone Positions (pencil-sketch layout)

```
        ice(8,32)
       /
  desert(18,45)
     /
forest(32,55)
     \
      hub(50,50) ──── endless_arena(72,58)
     /       \
tutorial(50,72)   endless_dungeon(82,70)
     \
  secret_crypt(58,82)
  
dev(5,5) — debug corner, connected to hub
```

### Connections (visual lines between nodes)

| Zone | Connections |
|------|-------------|
| `hub` | `tutorial`, `forest`, `endless_arena`, `endless_dungeon`, `dev` |
| `tutorial` | `hub`, `secret_crypt`, `forest` |
| `secret_crypt` | `tutorial` |
| `forest` | `hub`, `tutorial`, `desert` |
| `desert` | `forest`, `ice` |
| `ice` | `desert` |
| `endless_arena` | `hub` |
| `endless_dungeon` | `hub` |
| `dev` | `hub` |

### Zone Map Metadata

| Zone ID | Name | Type | Icon | mapPosition | actGroup | discovered default |
|---------|------|------|------|-------------|----------|-------------------|
| `hub` | Town | `hub` | `town` | `{x:50, y:50}` | 1 | `true` |
| `tutorial` | Tutorial Glen | `dungeon` | `dungeon` | `{x:50, y:72}` | 1 | `true` |
| `secret_crypt` | Hidden Crypt | `secret` | `secret` | `{x:58, y:82}` | 1 | `false` |
| `forest` | Verdant Forest | `dungeon` | `forest` | `{x:32, y:55}` | 1 | `false` |
| `desert` | Scorched Desert | `dungeon` | `desert` | `{x:18, y:45}` | 1 | `false` |
| `ice` | Frozen Wastes | `dungeon` | `ice` | `{x:8, y:32}` | 1 | `false` |
| `endless_arena` | Endless Arena | `arena` | `arena` | `{x:72, y:58}` | 2 | `true` |
| `endless_dungeon` | Endless Dungeon | `dungeon` | `dungeon` | `{x:82, y:70}` | 2 | `true` |
| `dev` | Developer Room | `dev` | `dev` | `{x:5, y:5}` | 0 | `true` |

### Portal Spawn Positions (for teleport arrival)

```typescript
const ZONE_PORTAL_POSITIONS: Record<string, { x: number; y: number }> = {
  tutorial:        { x: 3200, y: 3200 },
  forest:          { x: 3200, y: 1792 },
  desert:          { x: 3200, y: 1792 },
  ice:             { x: 3200, y: 1792 },
  endless_arena:   { x: 3200, y: 500 },
  endless_dungeon: { x: 3200, y: 500 },
  secret_crypt:    { x: 3200, y: 1500 },
  dev:             { x: 3200, y: 1792 },
  hub:             { x: 3200, y: 1950 },
};
```

---

## Portal Placements (Per-Zone)

Every non-hub zone gets exactly 1 portal. The hub gets 1 central portal (replacing its 6 side portals).

### Hub Portal

| Template | Position (x, y) | Size (w, h) | Label | Notes |
|----------|-----------------|-------------|-------|-------|
| `TEMPLATE_HUB` | `(3150, 1900)` | `100 x 100` | `"World Map"` | South of fountain, on central path. Slightly larger than zone portals. |

The hub portal opens the world map. `targetZone: 'hub'` is used as a sentinel — when Game.ts sees the portal's target zone is its own zone, it opens the world map instead of teleporting.

### Zone Portals (all 80x80)

| Template | Position (x, y) | Zone | Label | Notes |
|----------|-----------------|------|-------|-------|
| `TEMPLATE_TUTORIAL` | `(3160, 3160)` | `tutorial` | `"Portal"` | 256px above exit door, on central path |
| `TEMPLATE_FOREST_BOSS` | `(3160, 1752)` | `forest` | `"Portal"` | Center of boss arena |
| `TEMPLATE_DESERT_BOSS` | `(3160, 1752)` | `desert` | `"Portal"` | Center of boss arena |
| `TEMPLATE_ICE_BOSS` | `(3160, 1752)` | `ice` | `"Portal"` | Center of boss arena |
| `TEMPLATE_ARENA` | `(3160, 460)` | `endless_arena` | `"Portal"` | Top-center, replaces old Exit portal |
| `TEMPLATE_DUNGEON` | `(3160, 460)` | `endless_dungeon` | `"Portal"` | Top-center, replaces old Exit portal |
| `TEMPLATE_CRYPT` | `(3160, 1460)` | `secret_crypt` | `"Portal"` | Upper half, away from jackpot chest |
| `TEMPLATE_DEV` | `(3160, 1752)` | `dev` | `"Portal"` | Center of room |

---

## Task 1: World Map Data Layer

**Files:**
- Create: `src/core/WorldMapData.ts`

Create the world map registry as the single source of truth for map display data.

### Data Structures

```typescript
export type ZoneType = 'hub' | 'dungeon' | 'arena' | 'boss' | 'secret' | 'dev';

export type MapIconType = 'town' | 'dungeon' | 'forest' | 'desert' | 'ice' | 'arena' | 'secret' | 'dev';

export interface WorldMapEntry {
  id: string;
  name: string;
  type: ZoneType;
  icon: MapIconType;
  mapPosition: { x: number; y: number };
  connections: string[];
  description: string;
  actGroup: number;
  discovered: boolean;
}

export const WORLD_MAP_REGISTRY: Record<string, WorldMapEntry> = {
  hub: {
    id: 'hub', name: 'Town', type: 'hub', icon: 'town',
    mapPosition: { x: 50, y: 50 },
    connections: ['tutorial', 'forest', 'endless_arena', 'endless_dungeon', 'dev'],
    description: 'A weary refuge for those who brave the wilds.',
    actGroup: 1, discovered: true,
  },
  tutorial: {
    id: 'tutorial', name: 'Tutorial Glen', type: 'dungeon', icon: 'dungeon',
    mapPosition: { x: 50, y: 72 },
    connections: ['hub', 'secret_crypt', 'forest'],
    description: 'A peaceful glade where fledgling adventurers learn the ropes.',
    actGroup: 1, discovered: true,
  },
  secret_crypt: {
    id: 'secret_crypt', name: 'Hidden Crypt', type: 'secret', icon: 'secret',
    mapPosition: { x: 58, y: 82 },
    connections: ['tutorial'],
    description: 'An ancient burial chamber, sealed away from prying eyes.',
    actGroup: 1, discovered: false,
  },
  forest: {
    id: 'forest', name: 'Verdant Forest', type: 'dungeon', icon: 'forest',
    mapPosition: { x: 32, y: 55 },
    connections: ['hub', 'tutorial', 'desert'],
    description: 'A sprawling woodland teeming with archers and grunts. The Stone Golem awaits.',
    actGroup: 1, discovered: false,
  },
  desert: {
    id: 'desert', name: 'Scorched Desert', type: 'dungeon', icon: 'desert',
    mapPosition: { x: 18, y: 45 },
    connections: ['forest', 'ice'],
    description: 'Blazing sands stretch endlessly. Juggernauts patrol the dunes.',
    actGroup: 1, discovered: false,
  },
  ice: {
    id: 'ice', name: 'Frozen Wastes', type: 'dungeon', icon: 'ice',
    mapPosition: { x: 8, y: 32 },
    connections: ['desert'],
    description: 'A frozen hellscape at the edge of the world. The Death Reaper rules here.',
    actGroup: 1, discovered: false,
  },
  endless_arena: {
    id: 'endless_arena', name: 'Endless Arena', type: 'arena', icon: 'arena',
    mapPosition: { x: 72, y: 58 },
    connections: ['hub'],
    description: 'An eternal proving ground. Waves of enemies test your limits.',
    actGroup: 2, discovered: true,
  },
  endless_dungeon: {
    id: 'endless_dungeon', name: 'Endless Dungeon', type: 'dungeon', icon: 'dungeon',
    mapPosition: { x: 82, y: 70 },
    connections: ['hub'],
    description: 'Procedural depths that descend without end.',
    actGroup: 2, discovered: true,
  },
  dev: {
    id: 'dev', name: 'Developer Room', type: 'dev', icon: 'dev',
    mapPosition: { x: 5, y: 5 },
    connections: ['hub'],
    description: 'A place between worlds.',
    actGroup: 0, discovered: true,
  },
};

// Map zone IDs to their portal's world position (where player spawns on teleport)
export const ZONE_PORTAL_POSITIONS: Record<string, { x: number; y: number }> = {
  tutorial:        { x: 3200, y: 3200 },
  forest:          { x: 3200, y: 1792 },
  desert:          { x: 3200, y: 1792 },
  ice:             { x: 3200, y: 1792 },
  endless_arena:   { x: 3200, y: 500 },
  endless_dungeon: { x: 3200, y: 500 },
  secret_crypt:    { x: 3200, y: 1500 },
  dev:             { x: 3200, y: 1792 },
  hub:             { x: 3200, y: 1950 },
};

export function getDiscoveredZoneIds(): string[] {
  return Object.values(WORLD_MAP_REGISTRY)
    .filter(e => e.discovered)
    .map(e => e.id);
}

export function restoreDiscoveries(discoveredIds: string[]): void {
  for (const id of discoveredIds) {
    if (WORLD_MAP_REGISTRY[id]) {
      WORLD_MAP_REGISTRY[id].discovered = true;
    }
  }
}

export function getDiscoveredCount(): number {
  return Object.values(WORLD_MAP_REGISTRY).filter(e => e.discovered).length;
}

export function getTotalZoneCount(): number {
  return Object.keys(WORLD_MAP_REGISTRY).length;
}
```

---

## Task 2: Hub Rework & Zone Portal Placement

**Files:**
- Modify: `src/world/RoomTemplates.ts`

### Hub Changes (TEMPLATE_HUB)

1. **Remove** all 6 existing portal entries (the array of 80x80 portals at x=1640 and x=4680)
2. **Add** 1 central portal:

```typescript
portals: [
  {
    rect: { x: 3150, y: 1900, width: 100, height: 100 },
    targetZone: 'hub',
    label: 'World Map',
  },
],
```

3. Do NOT remove pillars, pathways, or any other hub decorations. Only the portal entries change.

### Zone Portal Additions

Add a single portal to each non-hub template that currently has `portals: []`:

**TEMPLATE_TUTORIAL**:
```
portals: [
  { rect: { x: 3160, y: 3160, width: 80, height: 80 }, targetZone: 'tutorial', label: 'Portal' },
],
```

**TEMPLATE_FOREST_BOSS**:
```
portals: [
  { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'forest', label: 'Portal' },
],
```

**TEMPLATE_DESERT_BOSS**:
```
portals: [
  { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'desert', label: 'Portal' },
],
```

**TEMPLATE_ICE_BOSS**:
```
portals: [
  { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'ice', label: 'Portal' },
],
```

**TEMPLATE_CRYPT**:
```
portals: [
  { rect: { x: 3160, y: 1460, width: 80, height: 80 }, targetZone: 'secret_crypt', label: 'Portal' },
],
```

**TEMPLATE_DEV**:
```
portals: [
  { rect: { x: 3160, y: 1752, width: 80, height: 80 }, targetZone: 'dev', label: 'Portal' },
],
```

### Repurpose Existing Arena/Dungeon Portals

**TEMPLATE_ARENA**: Replace the existing portal entry with:
```
portals: [
  { rect: { x: 3160, y: 460, width: 80, height: 80 }, targetZone: 'endless_arena', label: 'Portal' },
],
```

**TEMPLATE_DUNGEON**: Replace the existing portal entry with:
```
portals: [
  { rect: { x: 3160, y: 460, width: 80, height: 80 }, targetZone: 'endless_dungeon', label: 'Portal' },
],
```

---

## Task 3: Portal Rendering — Undiscovered vs Discovered

**Files:**
- Modify: `src/core/ZoneConfig.ts` — Add `discovered?` field to `PortalMarker`
- Modify: `src/world/Room.ts` — `renderPortals()` method

### ZoneConfig.ts Change

Add optional field to `PortalMarker`:
```typescript
export interface PortalMarker {
  rect: { x: number; y: number; width: number; height: number };
  targetZone: string;
  label: string;
  discovered?: boolean;   // false = render as undiscovered
}
```

### Room.ts renderPortals() Changes

For each portal, check `portal.discovered`:

**Undiscovered** (`discovered === false`):
- Outer circle: `lineStyle(2, 0x555555, 0.6)` — greyscale, no inner circle
- Container alpha: `0.6`
- Label: `"???"` in `MedievalSharp`, 11px, `#555555`
- No lock overlay

**Discovered** (`discovered === true` or `undefined`):
- Same as current: purple circle `0xaa66ff`, inner circle, zone name label, lock overlay if targetZone not in `WORLD_MAP_REGISTRY[targetZone].discovered`

### Discovery Transition

Add to Room class:
```typescript
private portalGraphics: Graphics[] = [];   // stored for external access
private portalContainers: Container[] = []; // stored for alpha lerp
private discoveryTransitions: { container: Container; timer: number }[] = [];

startDiscoveryTransition(portalIndex: number): void {
  const container = this.portalContainers[portalIndex];
  if (container) {
    this.discoveryTransitions.push({ container, timer: 48 });
  }
}

updateDiscoveryTransitions(dt: number): void {
  for (let i = this.discoveryTransitions.length - 1; i >= 0; i--) {
    const t = this.discoveryTransitions[i];
    t.timer -= dt;
    t.container.alpha = 0.6 + (1.0 - 0.6) * (1 - t.timer / 48);
    if (t.timer <= 0) {
      t.container.alpha = 1.0;
      this.discoveryTransitions.splice(i, 1);
    }
  }
}
```

Store each portal's `Graphics` and `Container` in arrays during `renderPortals()` so they can be accessed externally.

---

## Task 4: Discovery Notification

**Files:**
- Create: `src/ui/DiscoveryNotification.ts`

### Design

Non-intrusive notification that slides in from the top-right of the screen, below the minimap. Does NOT pause gameplay.

### Position & Dimensions

- Minimap is at screen (1714, 6) with height 112
- Notification top = 6 + 112 + 8 = 126
- X = 1920 - 260 - 12 = 1648 (right-aligned, 260px wide panel)
- Panel: `260 x 80` rounded rect

### Content Layout

```
┌─────────────────────────────────┐
│  ✦  Portal Discovered           │  — Cinzel 14px, #f0c060
│     [Zone Name]                 │  — Cinzel 18px, #ffffff
│     Added to your World Map     │  — MedievalSharp 11px, #c8963e
└─────────────────────────────────┘
```

### State Machine

```
idle → sliding_in (250ms) → visible (3.5s dwell) → sliding_out (200ms) → idle
```

If another notification queues while visible: store in queue, play next after 0.5s gap.

### Styling

- Background: `0x0a0810` at 92% alpha
- Border: gold `0x8a7a3a`, 2px, rounded corners (6px radius)
- Gold shimmer sweep on appear: bright horizontal line `0xf0c060` at 30% alpha, lerps top→bottom over 400ms

### Class Interface

```typescript
export class DiscoveryNotification {
  container: Container;
  private queue: string[] = [];
  private showing = false;
  private timer = 0;
  private state: 'idle' | 'sliding_in' | 'visible' | 'sliding_out' = 'idle';

  constructor();
  show(zoneName: string): void;   // Queue or show immediately
  update(dt: number): void;       // Called every frame
  isShowing(): boolean;
  destroy(): void;
}
```

---

## Task 5: World Map Overlay

**Files:**
- Create: `src/ui/WorldMapScreen.ts`

### Overview

Full-screen overlay. Game loop continues (enemies move, DoTs tick) while map is open. The map panel captures all pointer events.

### Panel Layout

- Full-screen backdrop: `0x000000` at 70% alpha, covers entire 1920x1080 canvas
- Map panel: `1200 x 800` pixels, centered on screen at (360, 140)
- Map area: maps percentage coordinates (0-100) to panel-local space with 60px margins

### Zone Nodes

Draw each zone at `mapPosition` converted to panel coordinates.

**Discovered nodes:**
- Icon drawn via `Graphics` shapes based on `MapIconType` (see icon reference below)
- Zone name: `Cinzel`, 12px, `#e8dcc8`, below icon
- Soft golden glow behind icon: `drawCircle` with `0xf0c060` at 10% alpha, radius 18
- Hover: brighten icon, show tooltip card
- Click: select for travel (show confirmation)

**Undiscovered nodes:**
- Same icon shape but 20% opacity, greyscale tint
- Label: `"???"` in `MedievalSharp`, 10px, `#555555`
- No glow, not clickable

### Node Icons (programmatic Graphics)

| Icon | Drawing |
|------|---------|
| `town` | Rounded rect body `10x14` + triangle roof + small circle glow above (lantern) |
| `dungeon` | Two vertical lines `14px` + curved arch top using `arc()` (archway) |
| `forest` | Triangle `12x10` crown + `4x8` rect trunk (tree) |
| `desert` | Triangle `12x10` + base line `16px` (pyramid) |
| `ice` | 6 radial lines from center, `12px` each (snowflake/star) |
| `arena` | Two diagonal crossing lines `14px` each at 45° angles (crossed swords) |
| `secret` | Oval `10x7` + smaller filled circle inside (eye) |
| `dev` | Circle `r=7` with 4 small cogs around edge (gear) |

### Connection Lines

Drawn between connected zones using `Graphics`:
- Discovered→discovered: `0x6b4c1e`, 2px, 60% alpha, slightly curved (quadratic bezier with control point offset ±8-15px)
- Undiscovered→anything: `0x555555`, 1px, 20% alpha, dotted
- Staggered draw animation on map open: lines reveal from origin over 400ms

### Header

- "World Map": `Cinzel`, 28px, `#f0c060`, centered at panel top
- Ruled line: `0x8a7a3a`, 1px, small diamond ornament at center
- "X / Y Zones Discovered": `MedievalSharp`, 13px, `#c8963e`
- Close button "✕" top-right, dark-fantasy styled

### Confirmation Panel

When a discovered node (not current zone) is clicked:
- Small panel at bottom of map: `Travel to [Zone Name]?` with `[CONFIRM]` `[CANCEL]` buttons
- Confirm → call `onTravelConfirm(zoneId)`
- Cancel → dismiss confirmation

### Public Interface

```typescript
export class WorldMapScreen {
  container: Container;
  
  constructor(
    currentZoneId: string,
    onTravelConfirm: (targetZoneId: string) => void,
    onClose: () => void,
  );
  
  update(dt: number, mouseX: number, mouseY: number): void;
  close(): void;
  destroy(): void;
}
```

---

## Task 6: Game.ts Portal Rework

**Files:**
- Modify: `src/core/Game.ts`

### Imports to Add

```typescript
import { WORLD_MAP_REGISTRY, ZONE_PORTAL_POSITIONS, getDiscoveredZoneIds, restoreDiscoveries, getDiscoveredCount, getTotalZoneCount } from './WorldMapData';
import { WorldMapScreen } from '../ui/WorldMapScreen';
import { DiscoveryNotification } from '../ui/DiscoveryNotification';
```

### New State Fields

```typescript
private worldMapScreen: WorldMapScreen | null = null;
private worldMapOpen = false;
private discoveryNotification: DiscoveryNotification | null = null;
private pendingDiscoveryQueue: string[] = [];
private spawnInvulnTimer = 0;
```

### Startup (startGame / loadGame)

In `startGame()`:
```typescript
this.discoveryNotification = new DiscoveryNotification();
this.app.stage.addChild(this.discoveryNotification.container);
```

In `loadGame()` after restoring zone state:
```typescript
if (data.zone.discoveredZones) {
  restoreDiscoveries(data.zone.discoveredZones);
}
```

Create the notification instance same as startGame.

### World Map Open/Close

```typescript
private openWorldMap(): void {
  if (this.worldMapOpen) return;
  this.worldMapOpen = true;
  this.worldMapScreen = new WorldMapScreen(
    this.zoneManager.zoneId,
    (targetZoneId: string) => {
      this.worldMapScreen?.destroy();
      this.worldMapScreen = null;
      this.worldMapOpen = false;
      this.initiateTeleport(targetZoneId);
    },
    () => {
      this.worldMapScreen?.destroy();
      this.worldMapScreen = null;
      this.worldMapOpen = false;
    }
  );
  this.app.stage.addChild(this.worldMapScreen.container);
}
```

### Input Guard During World Map

In `update()`:
```typescript
if (this.worldMapOpen && this.worldMapScreen) {
  const mouseX = this.app.renderer.events.pointer?.x ?? 0;
  const mouseY = this.app.renderer.events.pointer?.y ?? 0;
  this.worldMapScreen.update(dt, mouseX, mouseY);
  return;   // Block all other input
}
```

Wait — the spec says game does NOT pause. So we still need to run `updateGameplay()` for enemies/projectiles/VFX, but block player input. Use a flag:

```typescript
// In update(), after the early returns for overlays:
if (this.worldMapOpen) {
  if (this.worldMapScreen) {
    const mouseX = this.app.renderer.events.pointer?.x ?? 0;
    const mouseY = this.app.renderer.events.pointer?.y ?? 0;
    this.worldMapScreen.update(dt, mouseX, mouseY);
  }
  // Still run gameplay for enemies/projectiles but skip player input
  this.updateEnemies(dt);
  this.updateProjectiles(dt);
  this.updateVfx(dt);
  this.updateMinions(dt);
  return;
}
```

### Portal Click Handling (replaces current portal teleport)

In `updateGameplay()`, the click handling block:

```typescript
if (this.input.consumeClick()) {
  // Portal click: open world map (only for discovered portals)
  for (const portal of this.room?.portals ?? []) {
    const cx = portal.rect.x + portal.rect.width / 2;
    const cy = portal.rect.y + portal.rect.height / 2;
    const distToPlayer = Math.hypot(this.player!.x - cx, this.player!.y - cy);
    if (distToPlayer < 150 && Math.hypot(mouseWX - cx, mouseWY - cy) < 60) {
      const discovered = portal.discovered ?? 
        (WORLD_MAP_REGISTRY[portal.targetZone]?.discovered ?? false);
      if (discovered || portal.targetZone === 'hub') {
        this.openWorldMap();
        clickedItem = true;
        break;
      }
    }
  }
  // ... rest of click handling
}
```

### Portal Discovery Proximity Check

New block in `updateGameplay()`, after player movement:

```typescript
// Portal discovery: proximity-based, auto-triggers
for (const portal of this.room?.portals ?? []) {
  if (portal.discovered === false) {
    const cx = portal.rect.x + portal.rect.width / 2;
    const cy = portal.rect.y + portal.rect.height / 2;
    const dist = Math.hypot(this.player!.x - cx, this.player!.y - cy);
    if (dist < 80) {
      portal.discovered = true;
      if (WORLD_MAP_REGISTRY[portal.targetZone]) {
        WORLD_MAP_REGISTRY[portal.targetZone].discovered = true;
      }
      this.room?.startDiscoveryTransition(/* index */);
      this.pendingDiscoveryQueue.push(
        WORLD_MAP_REGISTRY[portal.targetZone]?.name ?? portal.targetZone
      );
      this.saveGame();
    }
  }
}
```

### Discovery Notification Update

In `updateGameplay()`, each frame:

```typescript
if (this.discoveryNotification) {
  if (this.pendingDiscoveryQueue.length > 0 && !this.discoveryNotification.isShowing()) {
    const next = this.pendingDiscoveryQueue.shift()!;
    this.discoveryNotification.show(next);
  }
  this.discoveryNotification.update(dt);
}
```

### Teleport Sequence

```typescript
private initiateTeleport(targetZoneId: string): void {
  // Exit VFX
  this.addVfx((g, t) => {
    g.clear();
    const r = 10 + t * 80;
    g.lineStyle(2, 0xaa66ff, 1 - t);
    g.drawCircle(0, 0, r);
  }, 30).position.set(this.player!.x, this.player!.y);
  
  // Transition
  this.zoneManager.transitionTo(targetZoneId);
  this.buildCurrentZoneRoom();
  
  // Spawn at portal position
  const portalPos = ZONE_PORTAL_POSITIONS[targetZoneId];
  if (portalPos && this.player) {
    this.player.x = portalPos.x;
    this.player.y = portalPos.y;
  }
  
  // Entry VFX
  this.addVfx((g, t) => {
    g.clear();
    const r = 80 - t * 70;
    g.lineStyle(2, 0xaa66ff, t);
    g.drawCircle(0, 0, r);
  }, 30).position.set(this.player!.x, this.player!.y);
  
  // Spawn invulnerability
  this.spawnInvulnTimer = 90;   // 1.5s
}
```

### Spawn Invulnerability

In `updateGameplay()`, at the top:
```typescript
if (this.spawnInvulnTimer > 0) {
  this.spawnInvulnTimer -= dt * 60;   // convert dt to frames
  if (this.player) {
    this.player.setInvulnTimer(Math.max(this.player.getInvulnTimer(), Math.ceil(this.spawnInvulnTimer)));
  }
}
```

Need to add `setInvulnTimer(frames: number)` and `getInvulnTimer()` methods to Player.ts. Or just access `(this.player as any).invulnTimer` directly.

### buildCurrentZoneRoom() Changes

When constructing the Room, set `portal.discovered` based on the world map registry:

```typescript
const portalsWithDiscovery = template.portals.map(p => ({
  ...p,
  discovered: WORLD_MAP_REGISTRY[p.targetZone]?.discovered ?? false,
}));

this.room = new Room(zone.biome, template.doors, portalsWithDiscovery,
  /* ... rest unchanged */);
```

### Remove isPortalUnlocked from Room constructor

The `isPortalUnlocked` callback passed to Room is no longer needed. Remove it from the Room constructor call and from the Room class itself.

### Cleanup

In `cleanupGameSession()` and `restartGame()`:
```typescript
this.worldMapScreen?.destroy();
this.worldMapScreen = null;
this.worldMapOpen = false;
this.discoveryNotification?.destroy();
this.discoveryNotification = null;
this.pendingDiscoveryQueue = [];
this.spawnInvulnTimer = 0;
```

### Escape Key

In the Escape handler, add world map as highest-priority close target:
```typescript
if (this.worldMapOpen) {
  this.worldMapScreen?.close();
  // rest of escape chain...
}
```

---

## Task 7: Save & Persistence

**Files:**
- Modify: `src/core/SaveManager.ts`
- Modify: `src/core/Game.ts` — saveGame() and loadGame() methods

### SaveData Change

Add to `SaveData.zone`:
```typescript
discoveredZones: string[];
```

### Save

In `Game.saveGame()`, add to the zone block:
```typescript
discoveredZones: getDiscoveredZoneIds(),
```

### Load

In `Game.loadGame()`, after restoring `completedZoneIds`:
```typescript
if (data.zone.discoveredZones) {
  restoreDiscoveries(data.zone.discoveredZones);
}
```

### Backward Compatibility

Old saves without `discoveredZones` field: the default registry values handle it. Hub, tutorial, endless modes, and dev are already `discovered: true`. Forest, desert, ice, and crypt default to `false` — players with old saves can re-discover them in the world.

---

## Task 8: Minimap + ZoneManager Cleanup

**Files:**
- Modify: `src/ui/Minimap.ts`
- Modify: `src/core/ZoneManager.ts`
- Modify: `src/world/Room.ts` — remove `isPortalUnlocked` parameter

### Minimap Portal Markers

Add optional `portals` parameter to `update()`:
```typescript
update(playerX, playerY, walls, enemies, chests, breakables, urns?, doors?, portals?)
```

In the dynamic layer, draw portals:
- Discovered: cyan `0x88ccff`, radius 3, slow pulsing alpha
- Undiscovered: grey `0x555555`, radius 2, static

### ZoneManager Cleanup

Remove `isPortalUnlocked()` method — it was only used for portal locking which is replaced by the discovery system.

### Room.ts Cleanup

Remove the `isPortalUnlocked` parameter from the constructor. It was only used by `renderPortals()` for the lock overlay. The lock overlay is replaced by the undiscovered state rendering.

---

## Integration & Regression Checklist

- [ ] Town hub has one central portal at (3150, 1900), side portals removed
- [ ] Hub central portal opens world map on click
- [ ] Every non-hub zone has exactly one portal object placed
- [ ] Undiscovered portals render in greyscale with 0.6 alpha and "???" label
- [ ] Discovery fires on proximity (within 80px), NOT on click
- [ ] Discovery persists to save immediately on trigger
- [ ] Portal visual transitions to full color + VFX on discovery (0.8s lerp)
- [ ] Discovery notification slides in from top-right, non-intrusively
- [ ] Notification auto-dismisses after 3.5s, does not pause gameplay
- [ ] Notification queues if multiple discoveries are close together
- [ ] World map opens from any discovered portal in any zone
- [ ] World map opens from hub central portal
- [ ] Game loop continues (enemies move, DoTs tick) while map is open
- [ ] Player movement/skill input is blocked while map is open
- [ ] Map renders parchment/fantasy dark aesthetic
- [ ] Discovered zones show correct icons, names, and glow
- [ ] Undiscovered zones show "???" and greyed-out icons
- [ ] Connection lines draw between nodes with staggered animation on open
- [ ] Current zone is marked with pulsing ring and "You are here"
- [ ] Hovering a discovered node shows description tooltip
- [ ] Clicking a node shows "Travel to [Zone]?" confirmation
- [ ] Confirming travel triggers teleport sequence
- [ ] Player spawns at target zone's portal position on arrival (not playerStart)
- [ ] 1.5s spawn invulnerability on teleport arrival
- [ ] Teleport out/in VFX plays correctly
- [ ] Existing door → next zone transitions completely untouched
- [ ] Zone discovery count shown on map header ("X / Y Zones Discovered")
- [ ] Save/load preserves all discovered zones correctly
- [ ] Old saves without discoveredZones load without errors (backward compat)
- [ ] Escape, click-outside, and close button all close the world map
- [ ] Minimap shows portal positions (cyan dots)
- [ ] Recall portal (portal scroll) still works as before
- [ ] HubTip text updated (no longer references portals on "left and right of town")
- [ ] Dev console `/discover [zone]` command for testing (optional)

---

## Task Dependencies

```
Task 1 (WorldMapData.ts)          ──┐
                                     ├── Task 3 (Portal Rendering)
Task 2 (Templates)               ──┘       │
                                           ├── Task 6 (Game.ts Rework)
Task 4 (Discovery Notification)  ──────────┤
                                           │
Task 5 (World Map Overlay)       ──────────┘
                                           │
Task 7 (Save/Persistence)        ──────────┘

Task 8 (Minimap & Cleanup)       ── (can run anytime after Task 1+2)
```

Tasks 1, 2, 4, 5 can be implemented in parallel. Tasks 3, 6, 7, 8 depend on their inputs being stable.
