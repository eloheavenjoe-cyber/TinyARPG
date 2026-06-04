# Item System — Phase 4a Design

## Overview
Add equippable items (weapons, armor, jewelry) with a rarity system, affix generation, unique items, and click-to-pickup ground loot. This is the foundation for inventory, equipment, and crafting in later phases.

## Item Data Model

### Rarity
```ts
type Rarity = 'normal' | 'magic' | 'rare' | 'unique'
```

### Slots
```ts
type Slot = 'weapon' | 'body' | 'helmet' | 'boots' | 'ring' | 'amulet'
```

### Affixes
Six prefixes and six suffixes initially, each with a stat and roll range.

| Name | Type | Stat | Range |
|------|------|------|-------|
| Garnished | prefix | hp | 5–15 |
| Sturdy | prefix | armor | 3–10 |
| Sharp | prefix | damage | 1–5 |
| Spiked | prefix | damagePct | 5–15 |
| Quick | prefix | attackSpeedPct | 3–10 |
| Arcane | prefix | mana | 5–15 |
| of the Ox | suffix | str | 3–8 |
| of the Fox | suffix | dex | 3–8 |
| of the Sage | suffix | int | 3–8 |
| of Protection | suffix | armorPct | 5–15 |
| of Regrowth | suffix | hpRegen | 1–3 |
| of Flames | suffix | fireDmg | 1–4 |

### Item Bases

| ID | Name | Slot | Innate Stats | Drop Weight |
|----|------|------|-------------|-------------|
| sword | Sword | weapon | damage: 5–10 | 30 |
| bow | Bow | weapon | damage: 4–9 | 30 |
| body | Body Armor | body | armor: 8 | 20 |
| helmet | Helmet | body | armor: 4 | 20 |
| boots | Boots | boots | armor: 2, moveSpeedPct: 2 | 20 |
| ring | Ring | ring | — | 8 |
| amulet | Amulet | amulet | — | 5 |

### Unique Items (start)

**Colossus Blade** (weapon, class: warrior)
- Innate: damage 12–18
- Fixed: +20 HP, +10% damage reduction, +5 STR
- Flavor text: "Unbreakable"

**Deadeye Bow** (weapon, class: ranger)
- Innate: damage 8–14
- Fixed: +15% attack speed, +5 DEX, +10% projectile damage
- Flavor text: "One shot, one kill"

### Item Drop Interface
```ts
interface ItemDrop {
  id: string
  base: ItemBase
  rarity: Rarity
  affixes: { affix: ItemAffix; roll: number }[]
  uniqueId?: string
  rollRange: { min: number; max: number }  // weapon damage roll
  computedName: string
  computedStats: Record<string, number>
}
```

## Generation Logic (`ItemGenerator`)

### Drop Roll
1. **Rarity roll:** normal 50%, magic 30%, rare 15%, unique 5%
2. **Base type:** weighted random from drop weights
3. **Affix count:** magic=2, rare=4–6 (random), normal=0, unique=fixed
4. **Affix selection:** random from pool, no duplicate affixes. Prefix for first half, suffix for second half. If pool runs out, fill remaining.
5. **Damage range:** weapon bases roll a random value within their min–max range
6. **Name computation:** `prefix1 prefix2 baseName suffix1 suffix2`
7. **Stat computation:** innate stats + sum of affix rolls

### Unique Generation
- When unique rolls, look up unique table by base type
- Override affixes with fixed values
- Apply roll ranges where specified (e.g., a unique could have "10–15 HP")
- No random affix generation

## Drop & Pickup

### Enemy Drop
- `Enemy.dropLoot()` called on death (alongside existing XP/coin logic)
- Always drops at least gold/health/mana potions (existing system)
- ~40% chance to also drop an item

### Ground Representation
- `ItemDrop` entity: colored nameplate text on ground (same style as current loot)
- Color by rarity: normal=white, magic=blue, rare=yellow, unique=orange
- Nameplate is clickable (unlike potions/gold which auto-pickup)

### Click-to-Pickup
- On left-click, check if mouse hits any `ItemDrop` nameplate
- Consume the click — do NOT also fire main ability when clicking an item
- Item is collected into inventory (inventory system comes in next phase — for now, item is just destroyed with a pickup message)
- Show floating text: "Picked up [item name]"

## File Changes

### New files
- `src/core/ItemDefs.ts` — item base data, affix data, unique table
- `src/core/ItemGenerator.ts` — generation logic (random rolls, affix selection, name computation)

### Modified files
- `src/entities/ItemDrop.ts` — extend `LootItem` type to include `'item'` type with full item data; reuse existing RARITY_COLORS map; auto-pickup for gold/potions, click-to-pickup for equippable items
- `src/entities/Enemy.ts` — add `dropLoot()` method for equippable items
- `src/core/Game.ts` — handle click-to-pickup for items in game loop (separate from main ability click)
- `src/entities/Player.ts` — add `inventory` field (placeholder array for now)
