# Boss Zones & Zone Progression — Design Spec

## Overview
Add zone progression locking to the hub portals and boss fights to each story zone. Players progress through Forest → Desert → Ice, beating a boss at the end of each zone to unlock the next.

## Zone Progression Chain

```
Tutorial → Forest (beat golem) → Desert (clear placeholder) → Ice (beat reaper)
```

- Completing a zone = beating the boss room and exiting via the portal back to hub
- ZoneManager tracks `completedZoneIds: Set<string>`, populated when the boss room exit portal is used
- `isZoneUnlocked(zoneId)` checks the chain: tutorial always unlocked, forest unlocked after tutorial, desert after forest, ice after desert
- Endless Arena and Endless Dungeon are always unlocked from the start

## Hub Portal Locking

- Hub portals check `zoneManager.isZoneUnlocked()` to decide appearance
- **Locked**: Chains (brown curves overlapping portal) + padlock (small square with keyhole) drawn on top of the portal ring. Label shows "Locked". No click interaction.
- **Unlocked**: Normal animated portal ring, clickable, zone name label
- The active (next-in-chain) portal shows a subtle glow/highlight to guide the player

## Boss Room Templates

Each story zone gets one additional room — the boss arena. Arena is a full 1600x896 open space with decorative obstacles.

### Forest Boss Arena (`TEMPLATE_FOREST_BOSS`)
- 5-6 large stone pillars (60x60) scattered — use for cover from boulder toss
- Small rock clusters (30x30) near edges
- Darker forest floor, grass tuft decorations
- Exit portal spawns at bottom-center after golem dies
- Golem spawns at center (800, 448)

### Desert Boss Arena (`TEMPLATE_DESERT_BOSS`)
- Sandstone pillars at corners, broken wall segments
- Decorative urns/ruins
- Central dais/altar
- Exit portal spawns after all enemies cleared
- Placeholder: spawns 4-5 grunts/archers via normal spawnZones
- TODO: Replace with real boss when sprite is ready

### Ice Boss Arena (`TEMPLATE_ICE_BOSS`)
- Ice pillars (50x50) in a ring formation
- Tombstones/grave markers scattered around
- Cracked ice floor decorations
- Skeletal remains decorations
- Exit portal spawns after reaper dies
- Reaper spawns at center (800, 448)

## Zone Registry Changes

| Zone | Current rooms | New rooms | Added template |
|------|--------------|-----------|----------------|
| Forest | 3 | 4 | TEMPLATE_FOREST_BOSS |
| Desert | 4 | 5 | TEMPLATE_DESERT_BOSS |
| Ice | 5 | 6 | TEMPLATE_ICE_BOSS |

The previous last rooms (Forest room 3, Desert room 4, Ice room 5) change their exit door target zone to the zone's own boss room instead of hub. The boss room doors go to hub.

## Boss Entity (`src/entities/Boss.ts`)

New class separate from Enemy. Reuses some patterns (takeDamage, getBounds, sprite positioning) but has its own attack/phase system.

### Common structure
- Properties: x, y, width, height, health, maxHealth, alive, sprite, name, bossId, damage
- Methods: update(playerX, playerY, walls, dt), takeDamage(amount), getBounds(), destroy()

### Telegraph system
All dangerous attacks show a warning zone for ~1 second before dealing damage:
- **Line telegraph**: red line grows along charge path
- **Circle telegraph**: red circle on ground where damage will land
- **Cone telegraph**: orange cone sweeps area
- Telegraphs are PixiJS Graphics drawn by a `telegraphs: Graphics[]` array, cleared each frame

### Stone Golem (Forest boss)
- `bossId: 'golem'`
- Hitbox: 80x80
- HP: 500
- **Ground Slam**: telegraphs orange cone → slams fists, cone damage in front
- **Boulder Toss**: telegraphs red line → rips boulder from ground, throws along line (projectile, can dodge perpendicular)
- **Stomp**: telegraphs red circle around golem → AoE shockwave, pushes player back
- **Phases**: 100-75% (slam + toss), 75-50% (+stomp), 50-25% (faster, bigger AoEs), 25-0% (enraged, shockwaves leave lingering ground cracks)
- Between attacks: slow float toward player
- Drops: generous loot, hub portal spawns

### Death Reaper (Ice boss)
- `bossId: 'reaper'`
- Hitbox: 80x80
- HP: 800
- **Scythe Sweep**: telegraphs orange cone → massive cone damage in front
- **Teleport Slam**: vanishes, red circle at target location → dark AoE explosion
- **Summon Cultists**: spawns 2-3 cultist enemies (with slow orbs)
- **Phases**: 100-66% (sweep + teleport), 66-33% (+summon 2 cultists), 33-0% (all faster, summon 3)
- Drops: generous loot, hub portal spawns

## Boss HP Bar (`src/ui/BossHpBar.ts`)

- Screen-space UI component, added to `app.stage`
- Position: X=960 (center), Y=60
- Width: 600, Height: 24
- Dark background rect (0x111111, 0.8 alpha)
- Name text on left ("Stone Golem" / "Death Reaper")
- Colored fill: orange-brown for golem (0xcc8844), purple for reaper (0x9933dd)
- HP text right-aligned ("342/500")
- Only visible when boss is alive (`Game.boss` is defined and alive)
- Destroyed when boss dies

## Game.ts Changes

### New fields
- `boss: Boss | null` — current boss entity
- `bossHpBar: BossHpBar | undefined` — boss HP bar UI

### BuildCurrentZoneRoom
- Check if current template is a boss room (by checking zone.roomIndex === zone.roomCount - 1)
- If boss room + zone has boss template → spawn Boss instead of normal enemies
- If boss room + no boss (desert placeholder) → spawn normal enemies via spawnZones

### UpdateGameplay additions
- If boss is alive: call `boss.update(playerX, playerY, walls, dt)`
- Boss collision with player: contact damage
- Boss telegraph rendering: draw telegraph Graphics each frame, clear after
- Boss death: mark zone completed, spawn loot, create exit portal, destroy HP bar
- Handle projectiles hitting boss (same as enemies)

### Door/Portal logic
- Boss room exit door → hub (works after boss dies, blocked before)
- Normal rooms exit door → last door now targets boss room instead of hub

## Sprites

Programmatic pixel-art textures in `Sprites.ts`:
- **Golem**: Large floating stone upper torso (grey/brown), broad shoulders, massive fists, no legs — hovers above ground. Glowing orange cracks on chest. ~80x80.
- **Reaper**: Hooded skeletal figure in dark robes, scythe. ~80x80.

These are placeholder programmatic sprites — designed to look recognizable but will be replaced with proper sprite sheets later.

## Files Changed

| File | Change |
|------|--------|
| `src/core/ZoneConfig.ts` | Add optional `bossId` field to ZoneConfig |
| `src/core/ZoneRegistry.ts` | Update forest/desert/ice: roomCount++, add boss templates, set bossId |
| `src/world/RoomTemplates.ts` | Add TEMPLATE_FOREST_BOSS, TEMPLATE_DESERT_BOSS, TEMPLATE_ICE_BOSS + obstacles |
| `src/core/ZoneManager.ts` | Add completedZoneIds, isZoneUnlocked(), markZoneCompleted() |
| `src/entities/Boss.ts` | **New** — Boss class with golem + reaper configs |
| `src/ui/BossHpBar.ts` | **New** — Boss HP bar UI component |
| `src/core/Game.ts` | Boss lifecycle, telegraphs, portal spawn, hub portal locking visuals |
| `src/rendering/Sprites.ts` | Add golemTexture + reaperTexture (programmatic) |
| `src/world/Room.ts` | Hub portal rendering: locked vs unlocked state |
