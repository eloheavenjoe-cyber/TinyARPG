# Summoner Class — Design Specification

## Class Identity

| Attribute | Value |
|-----------|-------|
| **Name** | Summoner |
| **Primary Stat** | INT (minion damage scales with `INT * 0.01` multiplier) |
| **Resource** | Mana (same system as Warrior/Ranger/Monk) |
| **Fantasy** | Hybrid army commander: 3-4 permanent minions + temporary summons + 1 active spectre |
| **ClassSelect Card** | Dark purple (`0x1a1a2e`) with purple border (`0x8844cc`), necromancer icon |

## Skill Bar (6 Slots, same pattern as existing classes)

### Main Ability (Slot 0, pick 1 of 4)

| Skill | Effect Type | Mana | CD | Details |
|-------|-------------|------|----|---------|
| Bone Spear | `projectile_pierce` | 10 | 0.5s | Piercing bone projectile. Pierces 2 enemies. Damage mult: 1.2. |
| Soul Drain | `channel` | 15 | 3s | Channel 2s (4 ticks). Each tick deals 0.4x damage. Heals self+minions for 50% of damage. |
| Corpse Explosion | `aoe_target` | 20 | 0.8s | Detonate nearest corpse within 200px (<5s old). AOE 120px. Damage = 15% of corpse maxHP. |
| Command Wrath | `buff` | 25 | 8s | Minions +30% damage, +50% atk speed, 4s. Self +20% damage, 4s. |

### Support Slots (fixed, Keys 2-6)

| Key | Skill | Effect Type | Mana | CD | Details |
|-----|-------|-------------|------|----|---------|
| 2 | Raise Skeleton | `summon` | 25 | 4s | Permanent skeleton warrior (max 3). 60 HP, 8 damage, melee. |
| 3 | Summon Skeleton Mage | `summon` | 30 | 8s | Temporary mage (max 2, 15s). Ranged magic projectiles. 40 HP, 10 damage. |
| 4 | Bone Armor | `buff` | 20 | 15s | +30% DR self, +15% DR minions. 6s duration. |
| 5 | Death Mark | `debuff` | 15 | 6s | Mark enemy: +25% damage taken, 8s. |
| 6 | Flesh Offering | `buff` | 10 | 2s | Consume corpse. Minions +40% atk speed, +20% move, +20% damage, 6s. |

## Spectre System

- **Capture:** 4% chance on enemy death (scaled by magic find). Cyan-blue soul orb drops.
- **Soul Vault:** V key opens overlay. Up to 8 stored souls. 1 active spectre slot.
- **Behaviour:** Inherits enemy type AI (grunt chase, archer kite, cultist blink, juggernaut tank). Targets enemies.
- **Death:** Lost permanently when killed in combat.
- **Scaling:** `minionDmgPct`, `minionHpPct` (new stat), player level, equipment.

## New Effect Types

- `summon` — Creates a Minion entity with optional cap and lifetime
- `channel` — Channeled ability (interruptible by damage or movement)

## New Data Types

```typescript
interface CapturedSoul {
  enemyType: string;
  name: string;
  baseHp: number;
  baseDamage: number;
  baseSpeed: number;
  captureLevel: number;
}
```

## Sub Skill Trees (4 trees × 12 nodes, 1 point per 4 levels)

See implementation plan for full node data.

## Technical Architecture Summary

- **6 new files:** Minion.ts, SoulVaultScreen.ts, SummonerSkillDefs.ts
- **14 modified files:** SkillDefs.ts, SkillManager.ts, Player.ts, Game.ts, ClassSelect.ts, AbilitySelect.ts, SpriteAnimator.ts, Sprites.ts, SaveManager.ts, StatSystem.ts, ItemDefs.ts, PassiveTree.ts, SkillSubTree.ts, CharacterScreen.ts
- **Minion class** extends Enemy AI patterns (movement, combat, death) via composition
- **Game loop** adds `minions[]` array with per-frame update, combat resolution, and cleanup
- **Save system** is backward-compatible: `soulVault` and `activeSpectre` are optional fields
