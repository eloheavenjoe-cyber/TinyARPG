# Socketable Jewels — Design Spec

**Date:** 2026-06-07
**Status:** Approved

## Overview

Add socketable jewels to equipment items. Jewels are items with affixes that slot into empty sockets on gear. Includes: jewel generation, socket count generation, drilling/shattering/preservation orbs, paper doll equipment UI redesign, and drag-and-drop jewel socketing.

---

## Section 1 — Jewel Types & Rarity

One jewel base type: **"Jewel"** — any affix can roll on any jewel.

| Rarity | Affixes | Drop Weight | Nameplate Color |
|--------|---------|-------------|-----------------|
| Normal | 1 | 50% | Grey |
| Magic | 2 | 30% | Blue |
| Rare | 3 | 15% | Yellow |
| Exquisite | 4-6 | 5% | Orange/gold (bright) |

- Affixes pulled from existing `AFFIXES` pool + jewel-only pool.
- Any prefix/suffix combo within rarity limit.
- Drop alongside items: ~15% of item drops are jewels instead.
- Jewel-only affixes are ~3x rarer than normal affixes.

### Jewel-Only Affixes

| Affix | Type | T1 | T2 | T3 |
|-------|------|----|----|-----|
| % increased damage per allocated passive | Prefix | 0.5% | 0.8% | 1.2% |
| % all resistances | Suffix | 3% | 5% | 8% |
| % crit damage multiplier | Suffix | 10% | 20% | 30% |
| Minions deal % increased damage | Prefix | 10% | 18% | 25% |
| % chance to gain Onslaught on kill | Suffix | 5% | 10% | 15% |
| Ignited enemies you kill explode | Prefix | N/A | N/A | N/A |
| % chance to inflict Bleed on hit | Suffix | 10% | 20% | 30% |

---

## Section 2 — Socket Mechanics

### Socket Ranges

| Slot | Natural Range | Maximum | Notes |
|------|--------------|---------|-------|
| Weapon | 0-6 | 6 | — |
| Chest | 0-6 | 6 | — |
| Helmet | 0-4 | 4 | — |
| Boots | 0-4 | 4 | — |
| Gloves | 0-4 | 4 | — |
| Ring | 0-1 | 2 (future) | 0 more common than 1; 2nd socket via future corrupted orb |
| Amulet | 0-1 | 2 (future) | 0 more common than 1; 2nd socket via future corrupted orb |

### Socket Generation (Drop Time)

Weighted random roll on item creation. Higher counts exponentially rarer.

| Sockets | Chest/Weapon | Boots/Gloves/Helmet | Ring/Amulet |
|---------|-------------|---------------------|-------------|
| 0 | 30% | 35% | 65% |
| 1 | 25% | 30% | 35% |
| 2 | 20% | 20% | — |
| 3 | 15% | 10% | — |
| 4 | 7% | 5% | — |
| 5 | 2.5% | — | — |
| 6 | 0.5% | — | — |

Expected orbs to hit max: ~100 (chest/weapon), ~12 (boots/gloves/helmet), ~2.9 (rings/amulets).

### Drilling Orb

- New currency (cyan nameplate, ~6% drop rate).
- Right-click orb → left-click item to use.
- Rerolls socket count to a random value (weighted distribution above).
- Always produces a different count than current (prevents no-change wastes).
- Only usable on items that haven't hit max sockets.

### Nameplate Display

Socket count shown as numbered suffix in item name: `(0)`, `(4)`, `(6)`, etc. Colored to match item rarity.

### Unsocket Orbs

| Currency | Drop Rate | Effect |
|----------|-----------|--------|
| Shattering Orb | ~8% | Removes and destroys one jewel from a socket. |
| Preservation Orb | ~1.5% | Removes one jewel and returns it to inventory. |

Both: right-click orb → click item → click a specific socket (or auto-target the only filled one).

---

## Section 3 — Equipment UI Redesign (Paper Doll)

### Layout

```
       [Helmet]             top center
[Weapon]  [Chest]  [Ring1]  middle row
          [Gloves] [Ring2]  lower middle
          [Boots]  [Amulet] bottom
```

- Inventory grid (5×6, 30 slots) to the **left** of the paper doll.
- Slots enlarged to 52px (from 50px).
- Combined panel: ~300px (grid) + 30px gap + ~260px (doll) = ~590px centered on screen.
- Toggled with `I` key (unchanged).

### Socket Display

- Each equipment slot on the paper doll shows dark circular cutouts (~4px radius) below or beside the item icon.
- Empty sockets: dark grey circle (`0x333333`).
- Filled sockets: jewel's rarity color (blue/yellow/gold for magic/rare/exquisite).

### Interactions

| Action | Input | Behavior |
|--------|-------|----------|
| Equip item | Click grid slot → click doll slot | Existing behavior |
| Unequip item | Click doll slot | Item returns to first empty grid slot |
| Socket jewel | Right-click jewel → click doll slot, OR drag jewel onto doll slot | Jewel goes into first empty socket |
| Unsocket (destroy) | Right-click Shattering Orb → click doll slot's socket | Destroys jewel, empties socket |
| Unsocket (save) | Right-click Preservation Orb → click doll slot's socket | Jewel returns to inventory |

---

## Section 4 — Data Model

### New Types

```typescript
interface SocketSlot {
  jewel: GeneratedItem | null;
}

interface EquipSlot {
  kind: 'equip';
  item: GeneratedItem;
  sockets: SocketSlot[];
}

type OrbKind = 'empowerment' | 'flux' | 'mutation' | 'growth' | 'ascendance'
             | 'purification' | 'portal_scroll' | 'drilling' | 'shattering'
             | 'preservation';
```

### Changes to GeneratedItem

- `sockets: number` — current socket count (0 to maxSockets)
- `maxSockets: number` — derived from baseId's equipment slot (weapon/chest=6, boots/gloves/helmet=4, ring/amulet=1)

### StatSystem

When computing `equipStats`, iterate `sockets[]` on each equipped item. Each `socket.jewel` contributes its affix stats.

### ItemGenerator

- `generateJewel(rarity, ilvl)` — uses existing affix pipeline, restricted to jewel-allowed affixes.
- After `generateItem()`, call `rollSockets(item)` using weighted distribution table.

### SaveManager

- Serialize `sockets: SocketSlot[]` per equipped/stashed item.
- Deserialize with fallback to `[]` for backward compat.

---

## Section 5 — Drag & Drop System

### Mechanics

- `pointerdown` on jewel in inventory grid → begins drag.
- `pointermove` (stage-level) → jewel icon follows cursor, `pointer-events: none`.
- `pointerup` over paper doll slot → socket jewel into first empty socket.
- `pointerup` elsewhere → cancel.
- Only jewels are draggable.

### Visual Feedback

- Drag ghost: jewel icon at cursor, 80% alpha.
- Valid drop target: doll slot border pulses gold.
- Invalid target (full sockets): slot stays dark.
- Orb usage uses right-click→click flow (no drag needed).

### Edge Cases

- Can't initiate drag if doll slot has no empty sockets.
- Can't initiate drag if inventory screen is closed.
- Shattering/Preservation orbs use existing right-click→click flow.

---

## Files Affected

| File | Changes |
|------|---------|
| `src/core/ItemDefs.ts` | `SocketSlot` type, `EquipSlot.sockets`, `OrbKind` additions, jewel-only affix definitions |
| `src/core/ItemGenerator.ts` | `generateJewel()`, `rollSockets()`, jewel drop rate, jewel-only affix pool |
| `src/core/StatSystem.ts` | Iterate socketed jewel affixes in `equipStats` |
| `src/core/SaveManager.ts` | Socket serialization/deserialization |
| `src/ui/InventoryScreen.ts` | Paper doll layout, socket rendering, drag-and-drop, orb UX |
| `src/ui/Tooltip.ts` | Socket count and socketed jewel tooltips |
| `src/ui/VendorScreen.ts` | Jewel rendering support |
| `src/ui/StashScreen.ts` | Jewel rendering + socket serialization |
| `src/entities/ItemDrop.ts` | Socket count suffix in nameplate |
| `src/rendering/ItemIcons.ts` | Jewel icon sprite mapping |
| `src/core/Game.ts` | Drop rate integration for jewels and new orbs |
| `src/core/ZoneManager.ts` | Drop rate integration |

---

## Implementation Order

1. Data model — types, socket fields, jewel affixes (`ItemDefs.ts`)
2. Jewel generation — `generateJewel()` + `rollSockets()` + drop rates (`ItemGenerator.ts`, `Game.ts`)
3. Nameplate sockets — suffix display on drops (`ItemDrop.ts`)
4. Paper doll UI — layout redesign, socket rendering, equip/unequip (`InventoryScreen.ts`)
5. Jewel socketing — right-click and drag-drop (`InventoryScreen.ts`)
6. Drilling/shattering/preservation orbs — orb definitions, usage UX (`ItemDefs.ts`, `InventoryScreen.ts`)
7. Stat integration — jewel stats flow through `StatSystem.ts`
8. Save/load — serialization (`SaveManager.ts`)
9. Vendor/stash support — display and persist socketed items (`VendorScreen.ts`, `StashScreen.ts`)
10. Jewel icons — sprite mapping (`ItemIcons.ts`)
