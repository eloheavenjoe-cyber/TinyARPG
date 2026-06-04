# Phase 4e — Affix Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Expand the item affix system with new affix types, 3-tiered values, level requirements, and more unique items.

**Architecture:** All changes are data additions to ItemDefs.ts + generation logic in ItemGenerator.ts + stat passthrough in StatSystem.ts + tooltip display in InventoryScreen.ts + projectile count in Player.ts.

**Tech Stack:** TypeScript, PixiJS 7

---

## Files

| File | Change |
|------|--------|
| `src/core/ItemDefs.ts` | Add `tier` to ItemAffix. Add all ~63 tiered affix entries. Add 4 new uniques. |
| `src/core/ItemGenerator.ts` | Add maxTier roll, filter by tier. Add ilvl/levelReq to GeneratedItem. |
| `src/core/StatSystem.ts` | Add coldDmg, lightningDmg, additionalProjectiles passthrough. |
| `src/ui/InventoryScreen.ts` | Show level requirement in tooltip. |
| `src/entities/Player.ts` | Read additionalProjectiles for projectile skills. |
| `src/core/Game.ts` | Pass player level to generateItemDrop. |

---

### Task 1: ItemDefs.ts — Add tiered affixes and new uniques

**Files:** Modify `src/core/ItemDefs.ts`

- [ ] Add `tier: number` (default 1) to `ItemAffix` interface
- [ ] Replace the 12-entry AFFIXES array with the full ~63 entry array (21 affixes × 3 tiers)
- [ ] Add 4 new unique items to UNIQUE_ITEMS

All affix names and values are defined in the spec: `docs/superpowers/specs/2026-06-04-phase4e-affix-expansion.md`

---

### Task 2: StatSystem.ts — New stat passthrough

**Files:** Modify `src/core/StatSystem.ts`

- [ ] Add `coldDmg`, `lightningDmg`, `additionalProjectiles` to the base stats object (as passthrough values, added similarly to other pass-through equipment stats like `hpRegen`)

---

### Task 3: ItemGenerator.ts — Tier system, ilvl, levelReq

**Files:** Modify `src/core/ItemGenerator.ts`

- [ ] Add `ilvl: number` and `levelReq: number` to `GeneratedItem` interface
- [ ] Update `generateItemDrop()` to accept optional `playerLevel?: number`
- [ ] After rarity roll, roll maxTier: 50%→1, 35%→2, 15%→3
- [ ] Filter AFFIXES to entries with tier ≤ maxTier
- [ ] Set `ilvl = playerLevel || 1`, `levelReq = maxTier * 4`

---

### Task 4: InventoryScreen.ts — Level requirement display

**Files:** Modify `src/ui/InventoryScreen.ts`

- [ ] In `showTooltip()`, add a line at the bottom: `Requires Level X` if `item.levelReq > 1`

---

### Task 5: Player.ts — Additional projectiles

**Files:** Modify `src/entities/Player.ts`

- [ ] In the method that fires projectiles for Ranger skills, read `this.computedStats.additionalProjectiles` and fire that many extra projectiles

---

### Task 6: Game.ts — Pass player level

**Files:** Modify `src/core/Game.ts`

- [ ] In `spawnLoot()`, pass `this.player?.level` to `generateItemDrop()`

---

### Task 7: Verify

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Commit and push
