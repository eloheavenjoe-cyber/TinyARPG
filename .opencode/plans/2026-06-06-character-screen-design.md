# Character Screen Design

**Date:** 2026-06-06
**Status:** Approved

## Overview

Move stats display from InventoryScreen to a dedicated Character Screen accessed via `C` key. Show all computed stats and all equipped abilities with damage values or effect descriptions.

## Architecture

- **New file:** `src/ui/CharacterScreen.ts` — full-screen overlay with two tabbed panels
- **Integration point:** `src/core/Game.ts` — toggle via `C` key, overlay guard, Escape close
- **Data source:** `Player.computedStats` (stats tab) and `Player.calcDamage(skill)` (abilities tab)

## Layout

Full-screen overlay (`screenW` × `screenH`), dark 50% backdrop (`0x000000`, alpha 0.5), centered panel.

- **Panel:** ~800×700px, rounded corners, dark background (`0x141428EE`)
- **Tab bar:** Two tab buttons at the top ("Stats" / "Abilities"), active tab highlighted
- **Content area:** Below tab bar, fills remaining panel height.

## Tab 1: Stats

Stats pulled live from `player.computedStats` each frame. Organized into categories with section headers.

| Category | Stats Shown | Source Key |
|---|---|---|
| Attributes | STR, DEX, INT | `player.attrs` |
| Offensive | Melee Damage %, Projectile Damage %, Attack Speed %, Cold Damage, Lightning Damage, Additional Projectiles, Skill AOE %, Culling Strike % | `computedStats.meleeDmgMult`, `projectileDmgMult`, `attackSpeedMult`, `coldDmg`, `lightningDmg`, `additionalProjectiles`, `skillAoePct`, `cullingStrikePct` |
| Defensive | Max HP, Max Mana, Armor DR %, Dodge %, Fortify on Hit, HP Regen | `computedStats.maxHp`, `maxMana`, `damageReduction`, `dodgePct`, `fortifyOnHit`, `hpRegen` |
| Utility | Move Speed %, Cooldown Reduction %, Mana Regeneration %, Skill Duration %, Life Leech %, Magic Find %, Item Quantity % | `computedStats.moveSpeedMult`, `cooldownReductionPct`, `manaRegenPct`, `skillDurationPct`, `lifeLeechPct`, `magicFindPct`, `itemQuantityPct` |

**Formatting:** Percentages shown as `"XX%"`. Multipliers shown as percentage of base. Flat values as integers. Counters as integers. Stats that are 0 are still shown.

**Unspent attribute points** shown at top of Attributes section.

## Tab 2: Abilities

Shows all 6 equipped skills in bar order. For each skill:

### Damaging skills (`damageMult > 0`)
- Skill name, computed damage (`player.calcDamage(skill)`), effective cooldown in seconds
- Type badge: `[Melee]` (cone/single/aoe_self) | `[Projectile]` (projectile types)

### Non-damaging skills (`damageMult === 0`)
- Skill name, effect description from `skillDef.description`
- Type badge: `[Buff]` | `[Dash]` | `[Passive]`

### Empty slots
- Shown as "(Empty)"

## Data Flow

```
CharacterScreen constructor(player: Player) → stores player reference
CharacterScreen.update()
  → reads player.computedStats for stats tab
  → reads player.skills.getSkill(i) for each slot
  → calls player.calcDamage(skill) for damaging skills
```

**Ranger note:** `calcDamage()` returns damage before sub-tree modifiers. Acceptable — matches tooltip convention.

## Game.ts Integration

- `characterScreenOpen: boolean` flag, `characterScreen: CharacterScreen | null` field
- `C` key toggle with `wasCKeyDown` guard
- Escape closes it (added to priority chain)
- Blocks gameplay input when open
- Destroyed in `cleanupGameSession()` and zone transitions

## Files Changed

| File | Change |
|---|---|
| `src/ui/CharacterScreen.ts` | New — full overlay with tabs |
| `src/core/Game.ts` | C key binding, state flag, toggle/cleanup, Escape handling, overlay guard |
| `src/ui/InventoryScreen.ts` | Remove stats panel from equipment area |

## Edge Cases

- Empty main ability slot → shows "(Empty)" in abilities tab
- Monk always has 6 skills populated (no empty slots)
- Stats auto-refresh each frame via update()
- Screen destroyed on zone transition (in buildCurrentZoneRoom cleanup)
- Fixed 1920×1080 canvas — no resize handling needed
- No hover tooltips on stats/abilities (values are self-explanatory)
