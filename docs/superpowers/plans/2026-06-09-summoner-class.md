# Summoner Class Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Summoner class with minion AI, spectre capture/storage, 6-slot skill bar, and 4 sub skill trees.

**Architecture:** Extend existing Enemy AI patterns for Minion entities. Reuse projectile, buff, save, and UI systems. Add 3 new files, modify 14 existing files.

**Tech Stack:** TypeScript, PixiJS 7, TinyARPG engine.

---

## File Structure

### New Files (3)
| File | Lines | Purpose |
|------|-------|---------|
| `src/entities/Minion.ts` | ~180 | Minion class with AI, targeting, follow behaviour |
| `src/ui/SoulVaultScreen.ts` | ~200 | Full-screen spectre management overlay |
| `src/core/SummonerSkillDefs.ts` | ~80 | Summoner skill data arrays and default support IDs |

### Modified Files (14)
| File | Lines Changed | Changes |
|------|---------------|---------|
| `src/core/SkillDefs.ts` | +5 | ClassType union, effectType, import summoner skills |
| `src/core/SkillManager.ts` | +15 | Summoner branches |
| `src/entities/Player.ts` | +25 | Sprite, calcDamage INT, level-up sub points |
| `src/core/Game.ts` | +180 | Minion loop, spectre, summon/channel, V key |
| `src/ui/ClassSelect.ts` | +40 | Summoner card + icon |
| `src/ui/AbilitySelect.ts` | +3 | Summoner ternary |
| `src/rendering/SpriteAnimator.ts` | +20 | Summoner animation loading stubs |
| `src/rendering/Sprites.ts` | +15 | Summoner fallback texture |
| `src/core/SaveManager.ts` | +30 | CapturedSoul type, soulVault/activeSpectre |
| `src/core/StatSystem.ts` | +10 | minionHpPct stat |
| `src/core/ItemDefs.ts` | +25 | Minion health affixes |
| `src/core/PassiveTree.ts` | +15 | Minion passive nodes |
| `src/core/SkillSubTree.ts` | +80 | 4 summoner sub trees |
| `src/ui/CharacterScreen.ts` | +5 | [Summon] / [Channel] badges |

---

## Tasks

### Task 1: ClassType Union, EffectTypes & Skill Definitions

**Files:**
- Modify: `src/core/SkillDefs.ts` (add `summoner` to ClassType, add `'summon' | 'channel'` to effectType)
- Create: `src/core/SummonerSkillDefs.ts` (4 main abilities + 5 support skills + default support IDs)

### Task 2: SkillManager & Player Wiring

**Files:**
- Modify: `src/core/SkillManager.ts` (import summoner skills, add summoner branch in constructor and selectMainAbility)
- Modify: `src/entities/Player.ts` (summoner sprite, calcDamage INT, level-up sub points)

### Task 3: ClassSelect & AbilitySelect UI

**Files:**
- Modify: `src/ui/ClassSelect.ts` (add Summoner card with icon, enable in disabledClasses)
- Modify: `src/ui/AbilitySelect.ts` (add SUMMONER_MAIN to ternary)

### Task 4: Summoner Sprite & Animation Stubs

**Files:**
- Modify: `src/rendering/Sprites.ts` (add `getSummonerTexture()` fallback)
- Modify: `src/rendering/SpriteAnimator.ts` (add `'summoner'` case to getFrames/isLoaded)

### Task 5: Minion Entity Class

**Files:**
- Create: `src/entities/Minion.ts` (minion AI, targeting, follow, death)

### Task 6: Game.ts — Minion Loop Integration

**Files:**
- Modify: `src/core/Game.ts` (minions array, minion update loop, summon/channel effect types, corpse tracking, minion death cleanup)

### Task 7: Spectre System — Soul Drops & Capture

**Files:**
- Modify: `src/core/Game.ts` (soul drop on enemy death, right-click capture, soulVault/activeSpectre state, summonSpectre/despawnSpectre methods)

### Task 8: Soul Vault UI

**Files:**
- Create: `src/ui/SoulVaultScreen.ts` (full-screen spectre management)
- Modify: `src/core/Game.ts` (V key binding, wire update)

### Task 9: Save/Load Integration

**Files:**
- Modify: `src/core/SaveManager.ts` (CapturedSoul interface, serialization fields)
- Modify: `src/core/Game.ts` (save/load soulVault + activeSpectre)

### Task 10: Stat System & Item Affixes

**Files:**
- Modify: `src/core/StatSystem.ts` (minionHpPct stat)
- Modify: `src/core/ItemDefs.ts` (minion health affix tiers)

### Task 11: Passive Tree Minion Nodes

**Files:**
- Modify: `src/core/PassiveTree.ts` (4-6 minion nodes in Sorcery branch)

### Task 12: Sub Skill Trees (4 trees × 12 nodes)

**Files:**
- Modify: `src/core/SkillSubTree.ts` (SUMMONER_SUB_TREES with 4 trees)
- Modify: `src/core/Game.ts` (keystone effect wiring)

### Task 13: CharacterScreen Badge & Final Polish

**Files:**
- Modify: `src/ui/CharacterScreen.ts` ([Summon] / [Channel] badges)
- Run final `npx tsc --noEmit` verification
