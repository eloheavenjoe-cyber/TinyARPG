# Crafting (Orbs) — Phase 4c Design

## Overview
Add two currency orbs that drop from enemies, stack in inventory, and are used by clicking on equipped items to apply crafting effects.

## Orb Types

| Orb | Effect | Drop Weight |
|-----|--------|-------------|
| Orb of Empowerment | Adds a random affix to a rare item | 1 |
| Orb of Flux | Re-rolls all affixes on a rare item | 0.5 |

## Inventory Refactor

Current: `inventory: (GeneratedItem | null)[]`

New:
```ts
type InventorySlot = EquipmentSlot | OrbSlot | null

interface EquipmentSlot {
  kind: 'equip';
  item: GeneratedItem;
}

interface OrbSlot {
  kind: 'orb';
  orbId: string;  // 'empowerment' | 'flux'
  count: number;
}
```

On pickup, orbs auto-stack: find existing slot with same `orbId`, increment count. If none, use first empty slot.

## Orb Generation

### ItemGenerator
Add `generateOrbDrop()` that returns an orb type randomly based on drop weights.

### ItemDrop
Extend `LootItem` union to include orb type. Orbs drop as colored nameplates (cyan/teal color). Click to pick up.

## Orb Usage

1. Left-click orb in inventory → orb enters "active" state (highlighted with a glowing border)
2. Left-click on a valid target item in equipment panel → consume orb, apply effect, clear active state
3. Left-click empty space or another orb → clear active state
4. Right-click orb in inventory → just select it (same as left-click)

### Orb Effects
- **Orb of Empowerment:** Add 1 random affix (pick from prefix or suffix pool, no duplicate stats). If item already has 6 affixes, do nothing and show feedback.
- **Orb of Flux:** Remove all existing affixes, re-roll 4-6 new random affixes (same generation as rare).

Both orbs only work on **rare** items (rarity === 'rare'). Uniques cannot be modified. Show feedback if used on wrong rarity.

## File Changes

### New files
- None (modify existing files only)

### Modified files
- `src/entities/Player.ts` — refactor inventory type, add orb effects methods, update equip/unequip for new slot type
- `src/ui/InventoryScreen.ts` — render orb stacks, handle orb click → active state, target selection for applying
- `src/core/ItemGenerator.ts` — add `generateOrbDrop()`
- `src/entities/ItemDrop.ts` — extend `LootItem` with orb type
- `src/core/Game.ts` — route orb pickup to inventory stacking
