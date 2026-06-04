# Phase 4e — Affix Expansion

## Overview
Expand the item affix system: new affix types, 3-tier system with distinct names, item level / level requirements, additional projectile affix, and more unique items.

---

## New Affix Types

### Prefixes (10 total — 6 existing + 4 new)

| Stat | T1 | T2 | T3 |
|------|----|----|----|
| hp | Garnished 5-15 | Polished 12-30 | Jeweled 25-50 |
| armor | Sturdy 3-10 | Fortified 6-18 | Reinforced 12-30 |
| damage | Sharp 1-5 | Razor 3-9 | Keen 6-15 |
| damagePct | Spiked 5-15% | Jagged 10-25% | Serrated 18-35% |
| attackSpeedPct | Quick 3-10% | Swift 6-16% | Rapid 10-22% |
| mana | Arcane 5-15 | Sorcerous 10-25 | Mystical 20-40 |
| meleeDmgPct | Fierce 5-12% | Savage 10-20% | Furious 16-30% |
| projectileDmgPct | Piercing 5-12% | Penetrating 10-20% | Perforating 16-30% |
| coldDmg | Chilled 1-3 | Frosted 2-5 | Glacial 4-8 |
| lightningDmg | Shocking 1-3 | Crackling 2-5 | Thunderous 4-8 |

### Suffixes (12 total — 6 existing + 5 new + elemental duplicates)

| Stat | T1 | T2 | T3 |
|------|----|----|----|
| str | of the Ox 3-8 | of the Bear 6-14 | of the Titan 10-22 |
| dex | of the Fox 3-8 | of the Cat 6-14 | of the Panther 10-22 |
| int | of the Sage 3-8 | of the Oracle 6-14 | of the Archmage 10-22 |
| armorPct | of Protection 5-15% | of Warding 10-25% | of Aegis 18-35% |
| hpRegen | of Regrowth 1-3 | of Renewal 2-5 | of Rejuvenation 4-8 |
| fireDmg | of Flames 1-3 | of Inferno 2-5 | of Conflagration 4-8 |
| moveSpeedPct | of the Hare 3-8% | of the Wind 6-14% | of Zephyr 10-20% |
| dodgePct | of the Shadow 2-5% | of the Mist 4-8% | of the Phantom 6-12% |
| cooldownReductionPct | of Celerity 2-5% | of Haste 4-8% | of Alacrity 6-12% |
| manaCostReductionPct | of Efficiency 2-4% | of Conservation 3-6% | of Thrift 5-8% |
| additionalProjectiles | of Volleys +1 | of Barrage +2 | of Fusillade +3 |
| coldDmg | of Ice 1-3 | of Frost 2-5 | of Winter 4-8 |
| lightningDmg | of Storms 1-3 | of Lightning 2-5 | of Thunder 4-8 |

---

## Tier System

- Every affix has 3 tiers (T1, T2, T3)
- Each tier is a separate entry in the AFFIXES array with its own name, id, and roll ranges
- When generating an item, a `maxTier` is rolled:
  - 50% → maxTier = 1
  - 35% → maxTier = 2
  - 15% → maxTier = 3
- The affix pool is filtered to only tiers ≤ maxTier
- Higher tiers produce higher rolls, making items that roll T2+ feel exciting

## Item Level & Level Requirements

- `GeneratedItem` gains `ilvl: number` (set = player level at drop time, or 1 if no player level)
- `GeneratedItem` gains `levelReq: number` = maxTier × 4
- Tooltip shows `Requires Level X` if levelReq > 0
- Player can equip items with levelReq ≤ player level

## Additional Projectiles

- `additionalProjectiles` stat stored in item computedStats
- When the player fires a skill that creates projectiles, add `additionalProjectiles` to the count
- Affects: Quick Shot, Multi Shot, Rain of Arrows (Ranger abilities)
- Max 3 additional (socketed-bar-style cap)

## More Uniques

### 4 new unique items:

1. **Phoenix Mantle** (Body Armor)
   - Innate: armor 12
   - Fixed: hp 30, fireDmg 5, hpRegen 3
   - Flavor: "Rise from the ashes"

2. **Crown of Eyes** (Helmet)
   - Innate: armor 4
   - Fixed: int 8, mana 20, projectileDmgPct 15
   - Flavor: "Knowledge is power"

3. **Windrunners** (Boots)
   - Innate: armor 2, moveSpeedPct 5
   - Fixed: dex 6, dodgePct 8, moveSpeedPct 10
   - Flavor: "Faster than the eye can see"

4. **Ring of the Forge** (Ring)
   - Innate: none
   - Fixed: fireDmg 3, meleeDmgPct 12, str 5
   - Flavor: "Tempered in flame"

---

## Files Changed

| File | Changes |
|------|---------|
| `ItemDefs.ts` | Add tier field to ItemAffix. Add 9 new affix entries (expanded to 63 with tiers). Add 4 new uniques. |
| `ItemGenerator.ts` | Add maxTier roll, filter affix pool by tier. Add ilvl/levelReq to GeneratedItem. Update generateItemDrop signature. |
| `GeneratedItem` (in ItemGenerator.ts) | Add `ilvl: number`, `levelReq: number` fields. |
| `StatSystem.ts` | Add coldDmg, lightningDmg, additionalProjectiles to stat handling (basic passthrough). |
| `Player.ts` | Read `additionalProjectiles` when firing projectile skills. |
| `InventoryScreen.ts` | Show level requirement in tooltip. |
