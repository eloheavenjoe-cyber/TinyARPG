# Monster Rarity & Game Balance — Design Spec

**Date:** 2026-06-05
**Status:** Draft

## Overview

Two interconnected systems:
1. **Monster Rarity** — Normal/Magic/Rare enemy variants with randomized modifiers
2. **Game Balance** — Damage formula overhaul, zone HP scaling, enemy size adjustments

Together they make combat more varied, rewarding, and satisfying (target: 3–5 hits per normal enemy).

---

## Section 1: Monster Rarity System

### Rarity Roll

When `ZoneManager.spawnEnemies()` creates each enemy, roll rarity:
- **Normal**: 50% (`Math.random() < 0.50`)
- **Magic**: 35% (`Math.random() < 0.85`)
- **Rare**: 15% (else)

### Modifier Count
- Normal: 0 mods
- Magic: 2 random mods (no duplicates on same enemy)
- Rare: 3 random mods

### MonsterMod Interface

```ts
interface MonsterMod {
  id: string;
  name: string;
  desc: string;
  apply(enemy: Enemy): void;
  vfxColor?: number;
  vfxRadius?: number;
}
```

### Core Mods (4 total)

| Mod | Effects | VFX |
|-----|---------|-----|
| **Hasted** | +50% move speed, +50% attack speed, +10% size | Speed lines (white streaks) |
| **Goliath** | +100% HP, +30% size, +50% XP reward | Bulkier tint (dark outline) |
| **Frost Aura** | 150px chill aura: 25% slow to player while in range | Blue ring below enemy |
| **Volatile** | Explodes on death: 50% of max HP as AoE damage (120px radius) | Red pulsing glow |

### Visual Identification

- **Normal**: White nameplate (existing), base sprite scale
- **Magic**: Blue nameplate, +10% sprite scale
- **Rare**: Yellow/orange nameplate, +20% sprite scale, subtle glow

Nameplate format: `[Mod Names] EnemyType` (e.g., "Hasted Goliath Grunt" for a rare with those mods).

### Loot Multipliers

- Magic: 2× base loot quantity (gold ×2, extra item rolls)
- Rare: 3× base loot quantity

### Mod Application

Mods are stored as an array on Enemy: `mods: MonsterMod[]`. Each mod's `apply()` mutates the enemy's stats at creation time. VFX are drawn per-frame in `Game.ts` update loop by iterating alive enemies and checking mods.

---

## Section 2: Game Balance

### Damage Formula

Replace hardcoded `25 * skill.damageMult` with stat-scaled formula:

```
baseDamage = 20
statBonus = primaryStat * 0.01   // 1% per point
damage = round(baseDamage * skill.damageMult * (1 + statBonus))
```

- **Warrior**: primaryStat = STR, applies to melee/cone/aoe_self skill types
- **Ranger**: primaryStat = DEX, applies to projectile/projectile_pierce/projectile_spread/aoe_target skill types
- **Monk**: primaryStat = INT, applies to single/cone (technique) skill types

Equipment affix scaling: `meleeDmgPct` and `projectileDmgPct` are added multiplicatively to the damage formula:
```
totalMult = skill.damageMult * (1 + relevantDmgPct/100) * (1 + primaryStat * 0.01)
damage = round(baseDamage * totalMult)
```
Elemental affixes (`fireDmg`, `coldDmg`, `lightningDmg`) add flat damage after the multiplier:
```
damage = round(baseDamage * totalMult) + flatElementalDmg
```

### Zone HP Multipliers

| Zone | Old | New |
|------|-----|-----|
| Tutorial | 0.5× | 1.0× |
| Forest | 1.0× | 1.5× |
| Desert | 1.5× | 2.5× |
| Ice | 2.5× | 4.0× |

### Zone Damage Multipliers (unchanged)

| Zone | Multiplier |
|------|-----------|
| Tutorial | 0.5× |
| Forest | 1.0× |
| Desert | 1.3× |
| Ice | 2.0× |

### Estimated TTK (grunt with basic skill at ~20 dmg)

| Zone | Grunt HP | Hits to kill |
|------|----------|-------------|
| Tutorial | 40 | ~2 |
| Forest | 60 | ~3 |
| Desert | 100 | ~5 |
| Ice | 160 | ~8 |

Higher-damage skills (Heavy Strike 2.5× = ~50 dmg) reduce hits by ~40%. Normal enemies without rarity mods are the baseline; magic/rare enemies take longer due to Goliath's +100% HP.

### Monster Density

All zone `enemyCount` ranges increased by +10%:
- Forest: 8–14 → **9–15**
- Desert: 10–18 → **11–20**
- Ice: 12–20 → **13–22**
- Endless Dungeon: 10–14 → **11–15**
- Endless Arena: 6–10 → **7–11**

### Enemy Sprite/Hitbox Adjustments

| Enemy | Old hitbox | New hitbox | Old sprite scale | New sprite scale |
|-------|-----------|-----------|-----------------|-----------------|
| Grunt | 36 | **47** (+30%) | 1.3× | **1.7×** |
| Juggernaut | 55 | **72** (+30%) | 1.7× | **2.2×** |
| Cultist | 32 | **27** (-15%) | 1.15× | **1.0×** |

---

## Section 3: Affected Files

| File | Changes |
|------|---------|
| `src/entities/Enemy.ts` | Add `rarity`, `mods[]`, `monsterMods` types, size changes, `applyMods()` |
| `src/core/ZoneManager.ts` | Rarity roll in `spawnEnemies()`, density +10%, loot multiplier pass-through |
| `src/entities/Player.ts` | Replace `25 * mult` with stat-scaled formula in `calcDamage()`, `fireProjectile()` |
| `src/core/ZoneConfig.ts` | Zone multiplier values (HP mults) |
| `src/core/ZoneRegistry.ts` | Zone config updates for density |
| `src/core/Game.ts` | Mod VFX drawing per-frame, loot multiplier wiring, volatile explosion handler |
| `src/rendering/Sprites.ts` | Enemy tint/scale for rarity |
| `src/ui/CombatText.ts` | (if needed) Blue/yellow nameplates |
| `src/core/StatSystem.ts` | Damage stat integration |

---

## Section 4: Edge Cases & Gotchas

- **Volatile chain reaction**: volatile explosion hitting other volatiles should chain (fun gameplay).
- **Culling strike + volatile**: if culled, still explode.
- **Frost aura stacking**: multiple frost auras do NOT stack (only the strongest applies).
- **Goliath XP**: XP reward is multiplied before XP-scaling multipliers are applied.
- **Magic/rare enemy spawns**: rolled after enemy type is picked, so any enemy type can be any rarity.
- **Grunt size 47**: verify wall collision and door thresholds still work (max walkable area unaffected).
- **Juggernaut size 72**: ensure it doesn't clip through doors (door size is 48px default — verify).
