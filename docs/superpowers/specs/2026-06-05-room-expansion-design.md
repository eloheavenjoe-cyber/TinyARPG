# Room Expansion & Camera System — Design Spec

## Overview
Scale rooms ~4x larger (6400×3584), add a player-following camera system, populate with procedural decoration (trees, rocks, chests, breakables), and make each biome visually distinct.

## Architecture

### Camera System (`src/core/Camera.ts` — new)
- Player-centered with smooth lerp: each frame target `(player.x - SCREEN_WIDTH/2, player.y - SCREEN_HEIGHT/2)`
- Clamped to room bounds (no dead space shown beyond room edges)
- Updates `gameContainer.x/y` each frame — no other game code changes coordinates
- Fix mouse-to-world conversion in `InputManager` to account for camera offset

### Room Dimensions (updated in `src/world/Room.ts`)
- `ROOM_WIDTH`: 6400 (from 1600)
- `ROOM_HEIGHT`: 3584 (from 896)
- `WALL_THICKNESS`: 48 (from 32)
- Walkable area: `ROOM_WIDTH - WALL_THICKNESS*2` × `ROOM_HEIGHT - WALL_THICKNESS*2`
- Canvas dimensions (1920×1080) unchanged

### Procedural Decoration (`src/world/RoomDecorator.ts` — new)
- Takes a `RoomTemplate` + `BiomeId` after `cloneTemplate()`
- Uses rejection sampling: pick random (x,y) in walkable area, reject if overlapping any wall, spawn zone, door, portal, or existing placed object
- Places: decorative sprites (biome-colored trees, rocks, bushes), collision obstacles (wall rects for dense formations), chests (4-8 per room), breakables (8-15 per room)
- Returns: `{ decorations: DecorationSprite[], obstacles: Rect[], chests: Chest[], breakables: Breakable[] }`

### Chest Entity (`src/entities/Chest.ts` — new)
- Fields: `x, y, width, height, container, spriteClosed, spriteOpen, isOpen, lootTable`
- States: closed (default), open (on interact)
- Interaction: player within 64px → show prompt → click or interact key → open → animate → spawn loot
- Loot: gold, potions, items, orbs, portal scrolls per zone level and rarity
- `bounds: { x, y, width, height }` for overlap detection

### Breakable Entity (`src/entities/Breakable.ts` — new)
- Fields: `x, y, width, height, container, sprite, hp`
- HP = 1, destroyed on any hit from player attack or skill
- On destroy: particle burst, small chance of gold/potion/equipment/orb/portal scroll drop
- Low chance for good items: ~2-5% for equipment/orbs

### Biome Decoration Packs
- **Forest**: green trees, brown rocks, bushes, wooden chests
- **Desert**: cacti, sandstone formations, dried bushes, sandstone chests
- **Ice**: frost trees, ice crystals, snowdrifts, frozen chests
- **Hub**: gardens, benches, lamp posts, ornate chests
- **Tutorial**: simple trees, few rocks, training chest
- **Endless (dungeon/arena)**: dark corrupted trees, jagged rocks, void-touched chests

### Template Scale-Up
- Existing templates (open, pillars, L-shape, cross, ring) rescale proportionally
- Boss room templates structure preserved but room footprint expands
- Hub town expands with more walkable plaza space
- All `playerStart` positions update to new room centers
- Build on existing template system — no need to rewrite template definitions

### Door & Portal Positioning
- Door Y position moves from 828 to `ROOM_HEIGHT - WALL_THICKNESS - 48`
- Portal positions remain relative but scaled to new room bounds
- Zone transition detection (rectsOverlap for doors) unchanged — coordinates naturally larger

### Spawn Zone Scaling
- Existing spawn zone positions (defined in templates) rescale
- Default spawn fallback: `{ x: WALL_THICKNESS*2, y: WALL_THICKNESS*2, width: ROOM_WIDTH - WALL_THICKNESS*4, height: ROOM_HEIGHT - WALL_THICKNESS*4 }`

### VFX & Projectile Positioning
- All VFX are children of gameContainer — unaffected by camera (moves with container)
- Projectile coordinates already in world space — unchanged

## Implementation Order

1. **Camera system** — Camera.ts, wire into Game.ts update loop, fix InputManager mouse conversion
2. **Bump room dimensions** — Update constants in Room.ts, update Game.ts offset computation, fix edge cases (boss spawn center, enemy spawn clamping)
3. **Scale existing templates** — Rescale all templates in RoomTemplates.ts
4. **RoomDecorator** — Procedural decoration pass with rejection sampling
5. **Decoration sprites** — Programmatic pixel-art per biome (trees, rocks, bushes)
6. **Chest entity** — Sprite, interaction, loot spawn
7. **Breakable entity** — Sprite, destruction, loot chance
8. **Integrate** — Wire decorator into `buildCurrentZoneRoom()`, add chests/breakables to room children, ensure cleanup on zone transition

## Out of Scope
- NPC interactions (vendor/stash)
- Save/load
- Non-combat skill animations
- Map modifiers
- Weapon swapping
- Drag-to-equip

## Key Constants
| Constant | Value |
|---|---|
| ROOM_WIDTH | 6400 |
| ROOM_HEIGHT | 3584 |
| WALL_THICKNESS | 48 |
| Walkable width | 6304 |
| Walkable height | 3488 |
| Chests per room | 4-8 |
| Breakables per room | 8-15 |
| Chest interact range | 64px |
| Breakable HP | 1 |
| Breakable good-item chance | ~3% |
| Camera lerp speed | ~0.05 (tunable) |
