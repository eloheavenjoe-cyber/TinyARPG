# Ranger Sub Skill Trees — Design Spec

**Date:** 2026-06-05
**Status:** Draft

## Overview

Per-ability sub skill trees for each Ranger main ability (Quick Shot, Multi Shot, Rain of Arrows, Snipe). Each tree is a wheel with a start node and 4 keystone paths. Opened with K key. Points earned every 4 levels (max 2 keystones per tree).

---

## Section 1: Tree Architecture

### Wheel Layout

Each tree is a radial node graph with 13 nodes per tree (4 keystone abilities × 3 small nodes each + 1 center start). 4 trees total = 52 nodes across all Ranger abilities.

```
            TK1            TK2
           /   \         /   \
          N     N       N     N
          |     |       |     |
          N     N       N     N
           \   /         \   /
      BL - N - N -- START -- N - N - BR
               |           |
               N           N
                \         /
                 N       N
```

- **START** (bottom-center): free, always allocated
- **BL** (bottom-left keystone), **BR** (bottom-right keystone): each requires 3 small nodes along its path (3 points)
- **TK1** (top-left keystone), **TK2** (top-right keystone): each requires BL or BR path + 3 additional small nodes (up the side)
- Paths: small node → small node → keystone

### Points System

- **1 sub skill point every 4 levels** (levels 4, 8, 12, 16, 20, 24, ...)
- **Max 2 keystones per tree** (enforced by allocation logic)
- **Cost**: 3 small nodes (1 point each) → 1 keystone (1 point) = **4 points per keystone path**
- At level 100: 25 total points → can max 2 keystones (8 pts) + fill partial paths

### Allocation Logic

- Start node always allocated, connections unlocked to bottom-left and bottom-right paths
- Can only allocate nodes connected to an already-allocated node
- Once any 2 keystones are allocated, remaining keystones become locked for that tree
- Top keystones require their respective bottom keystone as a prerequisite (TK1 requires BL, TK2 requires BR)

---

## Section 2: Ability Trees

### Quick Shot — "Ricochet Shot" Wheel

| # | Node | Type | Effects |
|---|------|------|---------|
| | START | — | — |
| 1 | Swift Draw | small | +15% attack speed |
| 2 | Accelerant | small | +20% projectile speed |
| 3 | **Ricochet** | **keystone** | Projectile bounces to 1 additional target on first hit |
| 4 | Sharper Edge | small | +10% damage |
| 5 | Long Shot | small | +15% range |
| 6 | **Piercing Shot** | **keystone** | Projectile pierces all enemies (like Snipe's pierce) |
| 7 | Static Charge | small | 10% chance to shock on hit |
| 8 | Chain Arc | small | +15% chain lightning damage |
| 9 | **Static Arrow** | **keystone** | On hit, chains lightning to 2 nearby enemies for 50% damage |
| 10 | Split Intent | small | +5% damage per projectile |
| 11 | Spread Pattern | small | -50% spread angle between arrows |
| 12 | **Triple Fire** | **keystone** | Fires 3 arrows in a narrow spread per cast |

### Multi Shot — "Shotgun Nova" Wheel

| # | Node | Type | Effects |
|---|------|------|---------|
| | START | — | — |
| 1 | Tighter Spread | small | Spread angle narrows by 15° |
| 2 | Volley | small | +2 projectiles |
| 3 | **Shotgun** | **keystone** | Spread narrows to 120° cone, projectiles doubled (e.g. 8→16), all forward |
| 4 | Toxic Residue | small | +10% poison DoT damage |
| 5 | Lingering Cloud | small | Poison cloud duration +1s |
| 6 | **Poison Nova** | **keystone** | Impact creates poison clouds that DoT for 3s (50% damage per tick) |
| 7 | Close Quarters | small | +8% damage at close range (<200px) |
| 8 | Hammer Time | small | Each consecutive hit on same target +5% stacking damage |
| 9 | **Point Blank** | **keystone** | Each projectile hitting the same target deals +20% more stacking damage |
| 10 | Orbital Path | small | Orbit delay +0.3s |
| 11 | Spinning Out | small | +15% projectile speed while orbiting |
| 12 | **Ring of Blades** | **keystone** | Projectiles orbit the player briefly (0.8s) before flying outward |

### Rain of Arrows — "Arrow Storm" Wheel

| # | Node | Type | Effects |
|---|------|------|---------|
| | START | — | — |
| 1 | Downpour | small | +20% arrow density (1 extra arrow per tick) |
| 2 | Wide Coverage | small | +15% radius |
| 3 | **Arrow Storm** | **keystone** | Doubles arrow count per frame (2-3 → 4-6), +20% radius |
| 4 | Frostbite | small | +5% slow effect on chilled enemies |
| 5 | Glacial | small | Chilling ground duration +0.5s |
| 6 | **Frost Volley** | **keystone** | Arrows create chilling ground on impact, 40% slow, lasts 1.5s |
| 7 | Focused Strike | small | -10% radius, +15% damage |
| 8 | Deadly Aim | small | +20% damage |
| 9 | **Precision Strike** | **keystone** | -50% radius, 3× damage per arrow |
| 10 | Concussive | small | +10% AoE explosion damage |
| 11 | Heavy Rain | small | Arrow explosion radius +15px |
| 12 | **Bombardment** | **keystone** | Arrows explode on impact dealing 60px AoE damage (50% of arrow damage) |

### Snipe — "Railgun" Wheel

| # | Node | Type | Effects |
|---|------|------|---------|
| | START | — | — |
| 1 | Bullseye | small | +15% damage |
| 2 | Precision Grip | small | +10% crit chance |
| 3 | **Executioner** | **keystone** | +50% damage against enemies below 50% HP |
| 4 | Electromagnetic | small | +25% projectile speed |
| 5 | Phase Shift | small | +10% damage through obstacles |
| 6 | **Railgun** | **keystone** | 3× projectile speed, passes through obstacles/walls |
| 7 | Bloody Mess | small | +15% crit damage |
| 8 | Death Blossom | small | Burst projectiles +1 |
| 9 | **Split Shot** | **keystone** | On kill: 3 smaller projectiles burst from corpse (30% damage each) |
| 10 | Hunter's Mark | small | Mark duration +1s |
| 11 | Vulnerability | small | Mark damage bonus +5% |
| 12 | **Marked for Death** | **keystone** | Hit applies mark: target takes +30% damage from all sources for 4s |

---

## Section 3: Affected Files

| File | Changes |
|------|---------|
| `src/core/SkillSubTree.ts` | **Create** — `SkillSubTreeNode`, `SkillSubTree` class with `allocate()`, `canAllocate()`, `hasKeystone()`, `getSmallEffects()`. All 4 tree data definitions. |
| `src/ui/SkillSubTreeScreen.ts` | **Create** — Full-screen overlay (K key), wheel layout, click-to-allocate, hover tooltip, keystone limit indicator. |
| `src/entities/Player.ts` | Add `skillSubTrees: Map<string, SkillSubTree>`, `skillSubPoints: number`, initialized on class select. |
| `src/core/SkillDefs.ts` | Add `subTreeId?: string` field to `SkillDef` for Ranger main abilities. |
| `src/core/Game.ts` | K key toggle, pass-through wiring for allocation callbacks. Keystone effect route checks at skill activation time. |
| `src/entities/Projectile.ts` | (if needed) Keystone-specific projectile behaviors (ricochet, orbiting, etc.) |

---

## Section 4: Edge Cases & Gotchas

- **Keystone cap**: enforce 2 per tree in `SkillSubTree.allocate()` — reject allocations for a 3rd keystone
- **Tree switching**: changing main ability (not currently supported in-game) would need to switch active tree
- **Save/load**: `SkillSubTree` allocated nodes must serialize to SaveData as `Record<string, string[]>` (abilityId → nodeId[])
- **Level-up flow**: when player levels up and `level % 4 === 0`, increment `skillSubPoints`
- **Empty tree**: K key does nothing if player has no main ability with a subTreeId
- **Mouse coordinate system**: `SkillSubTreeScreen` sits on `app.stage` (screen coords, 1920×1080), same as PassiveTreeScreen
