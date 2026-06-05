# Hub NPC Interactions — Design Spec

## Overview
Add interactivity to the two hub NPCs (Vendor and Stash) using the E key proximity interaction pattern (like chests). Vendor provides a buy/sell shop with randomly generated stock. Stash provides 4 tabbed storage tabs for item deposit/withdrawal.

## Interaction Model
- Walk within ~150px of Vendor or Stash NPC → "Press E to [trade/access stash]" prompt appears
- Press E → opens respective full-screen overlay (gameplay pauses, like inventory)
- Escape closes the overlay
- Proximity check runs every frame in `Game.updateGameplay()`, same pattern as chest detection

## Vendor Screen (`src/ui/VendorScreen.ts`)
- Full-screen dark overlay
- **Left panel:** Player inventory (5×6 grid, 50px slots, same layout as InventoryScreen)
- **Right panel:** Vendor stock grid (4×3 = 12 items, 60px slots)
- Click vendor item → buy (deduct gold, add to player inventory)
- Click player item → sell (add gold, remove from player inventory)
- "Not enough gold" feedback if player can't afford
- Player gold displayed at top of screen
- Close with Escape

## Stash Screen (`src/ui/StashScreen.ts`)
- Full-screen dark overlay
- **Left panel:** Player inventory (5×6 grid)
- **Right panel:** Stash area with:
  - 4 tab buttons at top (labeled "Stash 1"–"Stash 4" by default)
  - Active tab shows 6×10 grid (60 slots), 50px slots
- **Deposit:** Click player inventory item → click empty stash slot → item moves to stash
- **Withdraw:** Click stash item → click empty inventory slot → item moves to inventory
- **Equip from stash:** Click stash item → click equip slot → equips directly (if slot open in inventory for unequipped swap)
- **Tab rename:** Double-click tab name → inline text input → Enter to confirm
- Close with Escape

## Vendor Stock (`src/core/VendorManager.ts`)
- Generates 8–12 random items on hub zone transition
- Rarity distribution: normal ~40%, magic ~40%, rare ~15%, unique ~5%
- Item level = player level (no levelReq enforcement on buy — player can buy anything)
- Stock is NOT serialized — regenerated each time player enters hub
- Items have `stockId` to track which vendor item is being bought

## Pricing
```
basePrices = { sword: 5, bow: 5, body: 8, helmet: 6, boots: 6, ring: 12, amulet: 15 }
rarityMult  = { normal: 1, magic: 2, rare: 5, unique: 15 }
affixBonus  = sum(affix.tier * 2) for each affix on the item

sellPrice = basePrices[base.id] * rarityMult[rarity] + affixBonus
buyPrice  = sellPrice * 3
```

- Player sells at sellPrice, buys at buyPrice
- Gold is already tracked via `player.gold`, displayed in HUD

## Stash Data Model
```typescript
interface StashTab {
  name: string;
  slots: (InventorySlot)[];
}

// In SaveData:
stashData: { tabs: StashTab[] }
```
- 4 tabs, 60 slots each (6×10)
- Slots use the same `InventorySlot` union type as player inventory (`EquipSlot | OrbInfo | null`)
- Serialized alongside player data in SaveManager

## Modified Files

| File | Changes |
|------|---------|
| `src/ui/VendorScreen.ts` | **New** — vendor buy/sell overlay UI |
| `src/ui/StashScreen.ts` | **New** — stash deposit/withdraw overlay UI |
| `src/core/VendorManager.ts` | **New** — vendor stock generation + pricing logic |
| `src/core/Game.ts` | Add proximity detection for vendor/stash NPCs. Generate vendor stock on hub zone transition. Wire screen open/close callbacks. |
| `src/core/SaveManager.ts` | Add `StashTab` interface, add `stashData` to `SaveData`. Serialize/deserialize stash tabs. Add `getEmptyStashSlot()` helper. |
| `src/ui/InventoryScreen.ts` | No changes needed (vendor/stash have their own screens). |

## Item Rendering
- Vendor and stash screens reuse the item rendering pattern from InventoryScreen:
  - Slot backgrounds (dark gray, highlighted on hover)
  - Item rarity-colored borders/tint
  - Tooltip on hover showing item name, affixes, stats, and level req
  - Orb items show orb name and count
- Vendor items additionally show buy price in the tooltip
- Player items in vendor screen additionally show sell price in the tooltip

## Error Cases
- **Inventory full on buy:** Show "Inventory full" message, don't deduct gold
- **Not enough gold on buy:** Show "Not enough gold" message
- **Stash tab full on deposit:** Show "Stash tab full" message
- **Inventory full on withdraw:** Show "Inventory full" message
- **Stash not initialized:** First load creates 4 empty tabs with default names

## Out of Scope
- Drag-to-move items (click-only, same as inventory)
- Stash tab ordering or deletion
- Vendor buying items from player stash (only from inventory)
- Item search/filter in stash
- Shared stash across characters (per-save-slot only)
