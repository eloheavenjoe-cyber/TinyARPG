# Verdant Forest Visual Upgrade — Design Spec

## Overview
Apply tile-based rendering to the Verdant Forest zone (matching Tutorial Glen's visual quality), using a rustic autumn palette. Add ground elevation variation and walk-in cabins with interior encounters.

## Files Changed (7)
| File | Changes |
|---|---|
| `src/core/TileConfigs.ts` | Add `forest` entry + optional tint/elevation fields to `TileConfig` |
| `src/world/Room.ts` | Configurable tints, elevation overlay pass, `renderCabins()` |
| `src/world/RoomDecorator.ts` | Apply `propTint` to tile-based props with variance |
| `src/core/ZoneConfig.ts` | Add `CabinData` interface, `cabins` field on `RoomTemplate` |
| `src/core/ZoneRegistry.ts` | Add `tileConfig: 'forest'` to forest zone |
| `src/world/RoomTemplates.ts` | Add `cabins: CabinData[]` to 3 forest templates |
| `src/core/Game.ts` | Pass cabins to Room, collision + spawn + chest wiring |

## 1. TileConfig — `forest` Entry
Reuses tutorial PNGs. Autumn tint values applied to floor, walls, accent tiles, and props.

**Tree cells** — different sub-rects from Trees.png/Trees2.png than tutorial uses:
- `tree_a`: Trees.png (96,0,96×208)
- `tree_b`: Trees.png (192,0,96×208)
- `tree_c`: Trees2.png (0,0,96×160)
- `tree_d`: Trees2.png (96,0,96×160)
- `tree_e`: Trees2.png (192,0,96×160)
- `tree_f`: Trees2.png (192,160,96×160)

**Tints** (rustic autumn):
- `floorTint: 0x9a8a4a` — olive-brown ground
- `accentTint: 0xaa8833` — scattered autumn leaf specks
- `wallTint: 0xb0a090` — warm gray stone walls
- `wallTrimColor: 0x7a6a5a` — gray-brown trim
- `propTint: 0xbb8844` — rust base for trees/rocks/bushes

**Density**: 80–120 trees, 5–10 bushes, 8–16 rocks

## 2. Elevation Overlay
New optional `elevation` field on `TileConfig`. In `Room.build()`, after floor TilingSprite, draw 4–8 large soft shadow/highlight blobs:
- 5 dark blobs (alpha: 0.08, black) = lower terrain
- 3 light blobs (alpha: 0.05, warm white) = raised terrain
- Ellipses 300–800px wide, randomly placed but deterministic per room index

## 3. Cabin System
**`CabinData` interface** (ZoneConfig.ts):
- `x, y, width, height` — world coords
- `doorSide: 'south'` — 48px gap centered on south wall
- `chestPos: { x, y }` — world coords for the chest
- `spawnZones: { x, y, width, height }[]` — for 1–2 enemies inside

**Rendering** (Room.renderCabins()):
- Interior floor: dark wood (0x5a3a2a)
- Walls: brown planks (0x8b6b3a) with thin seam lines
- Roof: dark triangle overhang (0x5a3020)
- Door: 48px gap, darker interior visible
- Chimney: gray rectangle on north wall

**Placement** (1–2 per non-boss forest room, ~350×280 each):

| Template | Cabin(s) |
|---|---|
| Forest 1 | (1200, 1800), (4800, 800) |
| Forest 2 | (800, 800), (5000, 2400) |
| Forest 3 | (3200, 1200) |
| Forest Boss | None |

**Collision**: Cabin rect solid except door gap. Walls pushed into `room.walls`.

## 4. Code Mechanics

**Room.build() tint changes**: Replace hardcoded 0x999999 on floor/accent with `tc.floorTint`/`tc.accentTint`. Apply `tc.wallTint` to wall TilingSprites (new). Add elevation overlay pass.

**RoomDecorator prop tint**: When `tc.propTint` is set, apply `sprite.tint = tc.propTint ± random(8%)` to tile-based trees, rocks, bushes.

**Game.ts cabin wiring**: Push cabin walls to `room.walls` (with door gap), add cabin spawn zones, create Chest at `chestPos`.

## 5. BiomeData
Existing `BiomeData.forest` `floorColor: 0x3a552a` stays — only used as tile loading fallback. Not visually relevant once tile config is active.
