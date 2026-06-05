# Pixel-Art Arch Doors — Design Spec

## Overview
Replace the yellow-bordered door rectangles with programmatic pixel-art stone arches (concrete with moss and vines) for zone transition doors.

## Current State
`Room.renderDoors()` draws a semi-transparent black rectangle with a 2px yellow border and an "▶ Exit [Zone]" label above. This works but looks crude.

## Design

### Geometric layout
For each door rect `(x, y, w, h)`:

```
      ┌──┬──┬──┬──┬──┐      ← y - archH (40px above door)
      │  │  │  │  │  │
      ├──┴──┴──┴──┴──┤      ← y (door top)
  ┌───┤              ├───┐  ← pillars (28px wide, h tall)
  │   │  DOOR OPEN   │   │
  │ S │  (dark fill) │ S │
  │ T │              │ T │
  │ O │              │ O │
  │ N │  [label]     │ N │
  │ E │  Enter Town  │ E │
  │   │              │   │
  └───┤              ├───┘  ← y + h
      └──────────────┘
```

- Arch frame extends **28px left** and **28px right** of the door rect
- Arch top extends **40px above** the door rect

### Drawing steps

1. **Dark opening**: `beginFill(0x000000, 0.6)` over exactly the door rect `(x, y, w, h)`
2. **Stone pillars**: Two rectangles (28×h) filled with `0x8a8a8a`, then overlay a stone-block grid (horizontal mortar lines every ~14px, vertical splits every ~28px) using `0x6a6a6a` lines. Add a 1px highlight (`0x9a9a9a`) on the inner edge of each pillar.
3. **Stepped arch top**: A horizontal band `(x-28, y-40)` to `(x+w+28, y)`. The bottom edge is a stepped Gothic-style arch — starting 28px from each side, a series of increasingly longer horizontal bars stepping upward toward the center. Each step is a filled rectangle. The highest step (center) reaches y-40.
4. **Moss patches**: 3-5 irregular blobs per arch — overlapping small rects and circles colored `0x3a7a2a` and `0x4a8a3a`. Placed at pillar bases and along the arch top edge.
5. **Hanging vines**: 3-5 thin lines (2px, `0x2a6a1a`) from the arch top, 20-40px long, with 2-3 small leaf dots (3×3 rects, `0x3a8a2a`). Random offset per door so each arch looks slightly different.
6. **Label**: `Text` positioned above the arch. If `door.targetZone === 'hub'`, text reads "Enter Town" (instead of "▶ Exit Town").

### Colors
| Element | Color | Hex |
|---------|-------|-----|
| Stone base | Medium gray | 0x8a8a8a |
| Stone dark | Dark gray | 0x7a7a7a |
| Stone highlight | Light gray | 0x9a9a9a |
| Mortar lines | Darker gray | 0x6a6a6a |
| Opening fill | Black (60%) | 0x000000 |
| Moss | Dark green | 0x3a7a2a / 0x4a8a3a |
| Vines | Deep green | 0x2a6a1a |
| Leaves | Mid green | 0x3a8a2a |

### Per-door variation
Each arch gets a seeded pseudo-random offset for moss positions, vine count, and leaf positions so adjacent doors look distinct. Use `Math.random()` based on `door.x + door.y` or a simple LCG seeded per door.

### Files changed
- `src/world/Room.ts` — rewrite `renderDoors()` with the arch drawing logic
- `src/core/ZoneConfig.ts` — no changes needed
- `src/world/RoomTemplates.ts` — no changes needed

## Edge Cases
- **Very narrow doors** (120px): Scale pillar width down to 20px, reduce steps to 2
- **Very wide doors** (400px): Standard 28px pillars, 5-6 steps
- **Multiple doors in same room**: Each renders independently
- **No doors**: `renderDoors()` loops over empty array, no-op

## Out of Scope
- No biome-specific arch colors (arches are consistently gray concrete)
- No animation (arch is static)
- No collision changes (door rect remains the trigger zone)
