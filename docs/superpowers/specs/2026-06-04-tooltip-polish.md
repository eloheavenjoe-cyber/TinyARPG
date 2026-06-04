# Tooltip Polish — Phase 4e

## Scope
Clean up the item tooltip in `InventoryScreen.ts` — no new features, just visual polish.

## Current State
Single flat `Text` object with `\n`-joined lines. Dark background with thin border. No hierarchy, no separators, no stat summary.

## Target Layout

```
┌──────────────────────────────┐
│        Colossus Blade        │  rarity-colored, bold, 14px
│        ──── Sword ────       │  base type, dim, 10px, centered
│                              │
│  Prefixes:                   │
│  ◆ Garnished        +12 HP  │  pref bullet + name + value
│  ◆ Sharp             +3 Dmg │
│                              │
│  Suffixes:                   │
│  ◆ of the Ox         +5 STR │  suff bullet + name + value
│                              │
│  ──────── Stats ────────     │  thin line separator
│  HP     12                   │
│  Damage  3                   │
│  STR     5                   │
└──────────────────────────────┘
```

## Changes
- `InventoryScreen.ts` `showTooltip()`: rebuild as multi-`Text` + `Graphics` layout
  - Header line: `fontSize: 14`, `fontWeight: 'bold'`, rarity color
  - Base line: `fontSize: 10`, dim fill
  - Section dividers: thin `Graphics` rectangles
  - Prefixes/Suffixes grouped under labels
  - Stat summary at bottom
  - Frame: `strokeThickness: 2` (up from 1), `pad: 10` (up from 8)
- Only `showTooltip()` changes — everything else stays the same
