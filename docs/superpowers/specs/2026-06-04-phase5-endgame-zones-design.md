# Phase 5 — Endgame Zones Design

## Overview
Replace the single-room infinite-wave system with multiple zones: a hub town, tutorial, 3 story zones with distinct biomes, and 2 endless modes. Each zone has defined room templates, enemy pools, and difficulty scaling.

---

## Architecture

A new `ZoneManager` class owns all per-zone state. Game.ts delegates gameplay logic to it.

```
Game.ts
  |-- ZoneManager
  |     |-- currentZone: ZoneConfig
  |     |-- currentRoomIndex: number
  |     |-- rooms: Room[]          (pre-built from templates)
  |     |-- enemies: Enemy[]
  |     |-- projectiles: Projectile[]
  |     |-- itemDrops: ItemDrop[]
  |     |-- vfx: VfxEffect[]
  |     |-- transitionTo(zoneId, roomIndex?)
  |     |-- update(dt)             runs current room logic
  |     |-- clearAndBuildRoom(idx) clears container, builds room, spawns enemies
```

Existing `Room` class is extended with:
- Door marker positions (Rect per door, triggers transition on overlap)
- Portal marker positions (Rect per portal, click-to-activate)
- Biome-aware floor renderer (accepts floor color / pattern)

**New files:**
- `src/core/ZoneConfig.ts` — ZoneConfig interface + ZONE_REGISTRY + biome data
- `src/core/ZoneManager.ts` — orchestrator class

**Modified files:**
- `src/world/Room.ts` — biome-aware floor, door/portal markers
- `src/core/Game.ts` — delegates to ZoneManager, minimal state machine changes
- `src/rendering/Sprites.ts` — portal textures, biome floor textures (if needed)
- `src/ui/HUD.ts` — zone name display

---

## ZoneConfig Interface

```ts
interface ZoneConfig {
  id: string;
  name: string;
  biome: BiomeId;
  roomCount: number;
  enemyPool: EnemyType[];
  enemyHpMult: number;
  enemyDmgMult: number;
  enemyXpMult: number;
  isEndless: false | 'procgen' | 'wave';
  nextZone: string | null;        // door destination from last room
  availableFromHub: boolean;      // portal visible in hub
  enemyCount: number | { min: number; max: number }; // enemies per room
}

type BiomeId = 'dev' | 'hub' | 'tutorial' | 'forest' | 'desert' | 'ice' | 'endless';

interface BiomeData {
  floorColorA: number;    // checker light
  floorColorB: number;    // checker dark
  wallColor: number;
  wallBorderColor: number;
}
```

ZONE_REGISTRY maps zoneId → ZoneConfig.

---

## Zone Definitions

### Dev Room (id: `dev`)
- Single room, checker floor (gray/gray), current textures
- Enemy count: 3-6 per `/spawn` command (no auto-spawn)
- All enemy types, no difficulty scaling
- Accessible via `/devroom` console command
- Door back to hub

### Hub (id: `hub`)
- Single room, town stone/grass theme
- Enemy count: 0 (no enemies)
- No wave spawning
- Portal markers: Tutorial, Verdant Forest, Scorched Desert, Frozen Wastes
- Portal markers: Endless Dungeon, Endless Arena
- Backroom portal to Dev Room (hidden, visible with /devroom)
- Placeholder NPC / vendor / stash spots (visual-only for now)

### Tutorial (id: `tutorial`)
- 1 room, forest biome (greens/browns)
- Enemy count: 2-3 grunts at 50% HP (20 HP)
- Multipliers: 0.5× HP, 0.5× dmg, 0× XP
- Drops disabled or minimal gold
- All enemies dead → exit door opens to hub
- Teaches: movement, clicking to attack, picking up items

### Verdant Forest (id: `forest`)
- Story Zone 1, Tier 1 difficulty
- 3 rooms (pre-defined templates)
- Enemy pool: grunt, archer
- Enemy count: 3-5 per room
- Multipliers: 1.0× HP, 1.0× dmg, 1.0× XP
- Exit door → hub (story complete) or optionally chain to desert

### Scorched Desert (id: `desert`)
- Story Zone 2, Tier 2 difficulty
- 4 rooms (pre-defined templates)
- Enemy pool: grunt, archer, juggernaut
- Enemy count: 4-6 per room
- Multipliers: 1.5× HP, 1.3× dmg, 1.5× XP
- Exit door → hub

### Frozen Wastes (id: `ice`)
- Story Zone 3, Tier 3 difficulty
- 5 rooms (pre-defined templates)
- Enemy pool: all 4 types (grunt, archer, juggernaut, cultist)
- Enemy count: 5-7 per room
- Multipliers: 2.5× HP, 2.0× dmg, 2.5× XP
- Exit door → hub (story complete)

### Endless Dungeon (id: `endless_dungeon`)
- Endless Mode 1: procedural rooms
- Single room at a time, next room via exit door
- Difficulty scales with room count: HP × (1 + room * 0.1), dmg × (1 + room * 0.08)
- Enemy count: 4 + floor(roomIndex / 3) (capped at 10)
- Enemy pool: all types, composition evolves (more juggs/cultists at higher depth)
- Each room has an exit portal back to hub (so player can leave anytime)
- No loot despawn between rooms (optional — keep inventory from previous room)

### Endless Arena (id: `endless_arena`)
- Endless Mode 2: wave-based single room
- Infinite waves in one room, no exit
- Waves scale: more enemies, higher multipliers per wave
- Player fights until death
- Same arena layout each time (open floor with no obstacles)

---

## Room Templates

Pre-defined layouts stored as arrays of wall segments and door positions.

```ts
interface RoomTemplate {
  walls: Rect[];              // permanent walls/obstacles
  doors: DoorMarker[];        // { rect: Rect, targetZone: string, targetRoom: number }
  portals: PortalMarker[];    // { rect: Rect, targetZone: string, label: string }
  spawnZones: Rect[];         // enemy spawn areas (avoid walls)
  playerStart: { x, y };      // player spawn point
}
```

Template pool per zone (3-5 templates for multi-room zones). Selected at zone entry. Each template has a different wall layout to make rooms feel distinct.

### Room Template Examples
- **Open room** — current room, four walls, open floor
- **Pillars** — 4 pillar walls in center, enemies weave between
- **L-shaped corridors** — wall segments creating chokepoints
- **Cross room** — central cross walls dividing into quadrants
- **Ring** — circular wall segment in center, enemies orbit around

Templates are pre-defined constants (not generated) — easy to hand-tune for fun.

---

## Transition System

### Doors
- Rectangular markers on room edges or at wall gaps
- When player overlaps door rect, trigger transition to `(targetZone, targetRoom)`
- Visual: doorway graphic (darker archway in wall), pulsing glow when active
- Player spawns at the `playerStart` of the target room

### Portals
- Standalone glyph in the room (hub only for now)
- Rectangular click target, walk up and left-click to activate
- Visual: shimmering circle/portal texture
- Player spawns in target zone's first room

### Transition Flow
1. Player overlaps door or clicks portal
2. ZoneManager saves current zone state (endless: nothing; story: room cleared)
3. Clear all entities (enemies, projectiles, drops, VFX) from current gameContainer
4. ZoneManager builds target room from template
5. Player positioned at target room's playerStart
6. New enemies spawned per zone's enemy pool and room index

---

## Biome Visual System

`Room` constructor accepts `BiomeData`:

```ts
interface BiomeData {
  floorColorA: number;
  floorColorB: number;
  wallColor: number;
  wallBorderColor: number;
}
```

Pre-defined biomes:

| Biome | Floor A | Floor B | Wall | Wall Border |
|-------|---------|---------|------|-------------|
| dev   | 0x3a3a3a | 0x404040 | 0x4a4a5a | 0x5a5a6a |
| hub   | 0x5a5a4a | 0x555545 | 0x6a5a4a | 0x7a6a5a |
| tutorial | 0x4a6a3a | 0x406030 | 0x3a5a2a | 0x4a6a3a |
| forest | 0x3a5a2a | 0x406030 | 0x3a4a2a | 0x4a5a3a |
| desert | 0x8a7a4a | 0x7a6a3a | 0x9a7a5a | 0xaa8a6a |
| ice   | 0xaaccff | 0x99bbee | 0x8899cc | 0x99aadd |
| endless | 0x4a3a5a | 0x403050 | 0x3a2a4a | 0x4a3a5a |

---

## Difficulty Scaling

### Per-Zone Static Multipliers
Applied when spawning enemies in a room:
- `enemy.maxHealth = baseHp * hpMult`
- `enemy.damage = baseDmg * dmgMult`
- `enemy.xpReward = baseXp * xpMult`

### Endless Dungeon Scaling
- `hpMult = 1 + roomIndex * 0.1`
- `dmgMult = 1 + roomIndex * 0.08`
- `xpMult = 1 + roomIndex * 0.15`
- Enemy composition: deeper rooms add more juggernauts and cultists

### Endless Arena Scaling
- Per wave: `hpMult = 1 + wave * 0.08`, `dmgMult = 1 + wave * 0.06`
- Enemy count: `3 + wave * 2` (capped at 15)
- Mix: waves 1-5: grunts; 6-10: add archers; 11-15: add juggernauts; 16+: all types

---

## Hub Design

Layout of the hub room (1600×896):

```
+--------------------------------------------------+
| Portal: Tutorial              Portal: Endl Arena  |
|  (top-left)                     (top-right)       |
|                                                   |
|  [Placeholder NPC]        [Placeholder NPC]       |
|                                                   |
|  Portal: Verdant Forest   Portal: Scorched Desert |
|  (left wall)               (right wall)           |
|                                                   |
|  [Placeholder Stash]      [Placeholder Vendor]    |
|                                                   |
| Portal: Frozen Wastes      Portal: Endl Dungeon   |
|  (bottom-left)              (bottom-right)        |
+--------------------------------------------------+
```

7 portals total. Each portal is a `PortalMarker` with:
- `rect` (position + size)
- `targetZone` (zoneId)
- `label` (display name above portal)
- `color` (tint matching zone biome)

---

## Save/Load Context

Player state (zone, room, inventory, equipment, etc.) should be saveable so the player can leave and return to their current zone. This ties into the pending Phase 4d save/load system — the zone state is part of what gets saved.

---

## Implementation Order

1. **ZoneConfig + ZONE_REGISTRY** data file
2. **Biome-aware Room** — pass biome data to Room constructor, update floor/wall rendering
3. **Room templates** — 5 base templates as constants
4. **ZoneManager** — skeleton with zone transition, clear/build room, enemy spawning
5. **Hub** — build hub zone, portal rendering, portal click interaction
6. **Tutorial** — single room, 3 weak grunts, exit door to hub
7. **Dev room** — `/devroom` command, door to hub
8. **Verdant Forest** — 3 rooms, grunt/archer pool
9. **Scorched Desert** — 4 rooms, add juggernaut
10. **Frozen Wastes** — 5 rooms, full pool, highest difficulty
11. **Endless Arena** — wave-based, infinite, scaling
12. **Endless Dungeon** — procedural room selection, progressive difficulty
13. **HUD update** — display zone name, room count
14. **Save/load integration** (when Phase 4d lands)

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/core/ZoneConfig.ts` | NEW — ZoneConfig, ZONE_REGISTRY, BiomeData, RoomTemplate interfaces |
| `src/core/ZoneManager.ts` | NEW — zone state, transitions, room building, enemy spawning |
| `src/world/Room.ts` | EXTEND — accept BiomeData, render floor/walls per biome, support doors/portals |
| `src/world/RoomTemplates.ts` | NEW — pre-defined room template constants |
| `src/core/Game.ts` | MODIFY — delegate to ZoneManager; simplify wave/update logic |
| `src/ui/HUD.ts` | EXTEND — show zone name / room number |
| `src/core/DeveloperConsole.ts` | EXTEND — /devroom command |
