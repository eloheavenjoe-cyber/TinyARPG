# Cursed Urns — Design Spec

## Overview
League mechanic adding rare "Cursed Urns" to zones. Large interactive containers with valuable loot that apply negative curse modifiers to the player on opening.

## Files

### New Files
| File | Purpose |
|---|---|
| `src/core/CurseMods.ts` | Curse definitions (14 curses across 3 tiers), weighted roll functions, no-duplicate selection |
| `src/core/UrnConfig.ts` | 5 urn types (Reliquary of Arms, Miser's Coffer, Casket of Adornments, Alchemist's Vessel, Vault of the Forgotten), rarity weights (60/30/10), URN_SPAWN_CONFIG |
| `src/entities/CursedUrn.ts` | Urn entity class: procedural Graphics rendering (3x chest size), world-space panel, proximity interaction, open animation, currency upgrade animations |

### Modified Files
| File | Changes |
|---|---|
| `src/core/Game.ts` | spawnUrns() in buildCurrentZoneRoom(), per-frame update loop, E-key interaction, currency callback wiring, loot generation per urn category, save/load serialization |
| `src/core/ZoneManager.ts` | Integrate 1-2 urns per zone on spawn, max 1 rare, position validation |
| `src/entities/Player.ts` | activeCurses tracking array, applyCurse()/expireCurse(), per-frame tick, stat modifier integration |
| `src/core/SaveManager.ts` | SerializedUrn interface, save/restore urn opened state per zone |
| `src/ui/HUD.ts` | Curse debuff icon row below HP/MP bars |

## Data Layer

### CurseMods.ts
- `CurseDef` interface: id, name, tier (1|2|3), weight, duration, description, statEffect
- `CURSE_POOL: CurseDef[]` — 14 curses
- `rollCurses(count, minTier, maxTier, mustIncludeTier3)` — weighted selection, no duplicates
- Tier 1: 4 mild curses (Sluggish, Drained, Rattled, Blurred)
- Tier 2: 5 moderate curses (Bleeding, Weakened, Brittle, Flask-Cursed, Chilled)
- Tier 3: 5 severe curses (No Regeneration, Marked, Shattered Flask, Soul Taxed, Hexed)

### UrnConfig.ts
- `UrnTypeConfig`: id, name, lootCategory, visualTheme (bgColor, accentColor, shape)
- `URN_TYPES: UrnTypeConfig[]` — 5 entries with distinct visual themes
- `URN_SPAWN_CONFIG`: minPerZone, maxPerZone, maxRarePerZone, spawnWeights

## Entity (CursedUrn.ts)

### Rendering
- Procedural Graphics: ~72px tall × ~60px wide (3x chest size)
- Per-type shape + color scheme (iron banding, coin reliefs, gem inlays, glass/bubbles, runes)
- Rarity border (white/blue/gold), ground glow matching rarity
- Idle animation: pulsing dark mist particles via VFX system
- Lid as separate Graphics piece for open animation

### World-Space Panel
- Container positioned below urn (matching enemy nameplate pattern)
- Name header (rarity-colored), loot category (muted gold), ◈ curse lines (crimson, tier 3 pulsing)
- Fade in/out on proximity (200ms alpha lerp)
- Updates live when currency is applied

### States
- `'idle'` — Closed, interactive, VFX active
- `'opened'` — Lid off, no smoke, no interaction
- Tracks: isOpen, currencyApplied flag per session

### Interaction
- E-key within 48px
- Open applies all curses, spawns loot, animates lid blast

## Game Integration

### Zone Spawning
- ZoneManager calls spawnUrns() after enemy spawning
- Rejection sampling: 50 attempts, avoids walls/doors/portals/chests
- 1-2 urns per zone, max 1 rare

### Currency
- Maps existing orb IDs: mutation (transmute), ascendance (alchemy), growth (alteration), empowerment (regal)
- Same right-click → left-click targeting flow as item crafting
- Callbacks in Game.ts: onUrnTransmute/onUrnAlchemy/onUrnAlteration/onUrnRegal

### Loot Generation
- Weapons & Armour → equip items
- Currency & Crafting → gold + orbs
- Rings, Amulets & Jewellery → rings/amulets
- Flasks & Consumables → potions + portal scrolls
- Mixed Rare Items → all categories
- Quantity scales with urn rarity

## Player Curse System
- `CurseInstance[]` on Player, ticked each frame
- Effects modify computed stats (moveSpeed, manaRegen, dodge, damage dealt, damage taken, attackSpeed)
- DoT: bleed applies health damage per second
- Flask curse: disables potion use
- Marked: triggers enemy aggro
- HUD shows curse icons with countdown timers

## Save/Load
- `SerializedUrn[]` stored per zone in SaveData
- Urns persist opened/unopened state across zone re-entry
- Auto-save on urn open

## Spawn Config
```ts
URN_SPAWN_CONFIG = {
  minPerZone: 1,
  maxPerZone: 2,
  maxRarePerZone: 1,
  spawnWeights: { normal: 60, magic: 30, rare: 10 },
}
```
