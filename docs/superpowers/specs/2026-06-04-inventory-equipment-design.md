# Inventory & Equipment — Phase 4b Design

## Overview
Add a full-screen inventory screen with a 5×6 grid, equipment slots (7 slots), click-to-equip, drag-to-equip, tooltips, and character stat display alongside the equipped items.

## Toggle & Behavior
- **I key** toggles the inventory screen overlay (same pattern as passive tree)
- Opening inventory pauses gameplay (treeOpen-style state flag)
- Close with I, Escape, or clicking outside the panel
- Items picked up go to first empty grid slot. If full, item stays on ground.

## Inventory Data Model

On `Player`:
```ts
inventory: (GeneratedItem | null)[] = new Array(30).fill(null)
equipment: Record<Slot, GeneratedItem | null> = {
  weapon: null, body: null, helmet: null, boots: null,
  ring: null, ring2: null, amulet: null,
}
```

Equipping: move item from grid index to matching slot, put previously equipped item back to grid.
Unequipping: move item from slot to first empty grid slot.

## UI Layout

Full-screen overlay (`1920×1080`) with semi-transparent dark background:

### Left Panel — Inventory Grid
- 5 columns × 6 rows (30 slots) centered on left side
- Each slot: 50×50 box with light border, dark fill
- Equipped items show base name + rarity color
- Empty slots show faint rounded rect outline
- Left-click item in grid → selects it (highlight border)
- Right-click or click equip slot while selected → equips to matching slot
- Drag from grid to equip slot → equips

### Right Panel — Equipment Slots
- 7 slots arranged vertically on right side
- Weapon (top), Body, Helmet, Boots, Ring, Ring2, Amulet (bottom)
- Slots labeled with their slot name
- Occupied slot shows item name + rarity color
- Left-click equipped item → unequips to first empty grid slot

### Character Stats Panel
Below equipment slots:
- Life, Mana, Armor, Damage, Attack Speed values
- Updated from `player.computedStats` + equipment contributions

### Tooltip
Hovering any item (grid or equip slot) shows a floating tooltip:
- Item name (rarity color)
- Base type (e.g., "Sword", "Body Armor")
- Damage range (for weapons)
- Affix list with values (e.g., "+8 HP", "+3 STR")
- Unique flavor text (for uniques)

## Stat Integration

`Player.recalcStats()` already computes stats from passive tree + attributes. Extend it to also apply equipment stats:
```ts
// In recalcStats or computeStats:
for (const item of Object.values(this.equipment)) {
  if (!item) continue;
  for (const [stat, value] of Object.entries(item.computedStats)) {
    // add to cumulative stats
  }
}
```

Armor stat: fed into `damageReduction` using existing formula. Damage stat: adds directly to skill damage calculations.

## File Changes

### New files
- `src/ui/InventoryScreen.ts` — full inventory screen (grid, equipment, tooltip, stats)

### Modified files
- `src/entities/Player.ts` — add `inventory` array, `equipment` record, equip/unequip methods, extend `recalcStats()`
- `src/core/Game.ts` — I key toggle, inventory screen lifecycle (same pattern as passive tree)
- `src/core/StatSystem.ts` — accept equipment stats in `computeStats()`
- `src/entities/ItemDrop.ts` — on click-pickup, route item to Player.inventory
