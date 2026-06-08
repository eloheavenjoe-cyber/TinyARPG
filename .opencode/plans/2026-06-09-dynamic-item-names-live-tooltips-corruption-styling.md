# Dynamic Item Names, Live Tooltips & Corruption Visuals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three interconnected item presentation bugs: (1) stale item names after orb/craft mutations, (2) tooltip not reacting live to item mutations, (3) give warp/corruption stats distinct visual identity in tooltips.

**Architecture:** Extract `generateItemName()` as an exported pure function replacing the stored `computedName` field. Remove InventoryScreen's tooltip identity guard and add force-refresh wiring from Game.ts orb callbacks. Add corruption zone styling (purple, ⬡ glyph, crimson CORRUPTED tag) to both Tooltip.ts and InventoryScreen.ts tooltip renderers.

**Tech Stack:** TypeScript, PixiJS 7 (Graphics + Text + AnimatedSprite), no DOM — all tooltips are PixiJS Containers.

**Key insight:** The codebase uses `warped`/`warpImplicit` where the spec says "corrupted" — these are the same system. We keep internal field names (`warped`) but display "CORRUPTED" in the UI.

**Files modified (8 files):**
- `src/core/ItemGenerator.ts` — export `generateItemName`, remove `computedName`, add `customDisplayName`
- `src/core/ItemDefs.ts` — no changes needed
- `src/core/Game.ts` — strip `computedName` from save, regenerate on load, wire force-refresh
- `src/core/SaveManager.ts` — update `SerializedItem` interface
- `src/ui/Tooltip.ts` — use `generateItemName`, add corruption zone
- `src/ui/InventoryScreen.ts` — use `generateItemName`, remove identity guard, add force-refresh, add corruption zone
- `src/entities/ItemDrop.ts` — use `generateItemName`
- `src/entities/Player.ts` — no changes needed (mutations are fine, name is now derived)

---

### Task 1: Extract & Export `generateItemName`

**Files:**
- Modify: `src/core/ItemGenerator.ts`

**Steps:**

- [ ] **1a: Replace `generateName` with exported `generateItemName`**

Replace lines 138-142:
```typescript
function generateName(affixes: { affix: ItemAffix; roll: number }[], baseName: string): string {
  const prefixes = affixes.filter(a => a.affix.type === 'prefix').map(a => a.affix.name);
  const suffixes = affixes.filter(a => a.affix.type === 'suffix').map(a => a.affix.name);
  return [...prefixes, baseName, ...suffixes].join(' ');
}
```
With:
```typescript
export function generateItemName(item: Pick<GeneratedItem, 'base' | 'affixes' | 'uniqueId' | 'customDisplayName'>): string {
  if (item.uniqueId && item.customDisplayName) return item.customDisplayName;
  const prefixes = item.affixes.filter(a => a.affix.type === 'prefix').map(a => a.affix.name);
  const suffixes = item.affixes.filter(a => a.affix.type === 'suffix').map(a => a.affix.name);
  return [...prefixes, item.base.name, ...suffixes].join(' ');
}
```

- [ ] **1b: Update `GeneratedItem` interface**

Replace line 14 (`computedName: string;`) with:
```typescript
  customDisplayName?: string;
```

- [ ] **1c: Update item creation in `generateItemDrop` unique path (line 164-180)**

Replace line 173 (`computedName: unique.name,`) with: `customDisplayName: unique.name,`

- [ ] **1d: Update `generateItemDrop` non-unique path (line 222-234)**

Remove line 225 (`computedName: generateName(picked, base.name),`)

- [ ] **1e: Update `generateVendorItem` unique path (line 254-262)**

Replace `computedName: unique.name` with `customDisplayName: unique.name`

- [ ] **1f: Update `generateVendorItem` non-unique path (line 298-306)**

Remove `computedName: generateName(affixes, base.name)` from line 300

- [ ] **1g: Type-check**

Run: `npx tsc --noEmit` — expect errors on remaining `computedName` references (will be fixed in Task 2)

- [ ] **1h: Commit**

```bash
git add src/core/ItemGenerator.ts
git commit -m "refactor: extract generateItemName, remove stored computedName"
```

---

### Task 2: Update All Display Name Reads

**Files:**
- Modify: `src/ui/Tooltip.ts`
- Modify: `src/ui/InventoryScreen.ts`
- Modify: `src/entities/ItemDrop.ts`
- Modify: `src/core/Game.ts` (save/load)
- Modify: `src/core/SaveManager.ts` (SerializedItem interface)

**Steps:**

- [ ] **2a: Update `Tooltip.ts`**

Add import on line 2: `import { GeneratedItem, generateItemName } from '../core/ItemGenerator';`

Line 42: change `item.computedName` to `generateItemName(item)`

Line 121: change `jewel.computedName` to `generateItemName(jewel)`

- [ ] **2b: Update `InventoryScreen.ts`**

Find the `GeneratedItem` import and add `generateItemName`:
`import { GeneratedItem, generateItemName } from '../core/ItemGenerator';`

Line 334: change `item.computedName` to `generateItemName(item)`

Line 378: change `s.jewel.computedName` to `generateItemName(s.jewel)`

- [ ] **2c: Update `ItemDrop.ts`**

Line 3: change import to `import { GeneratedItem, generateItemName } from '../core/ItemGenerator';`

Lines 116-127 (`createJewelDrop`): change `name: generated.computedName,` to `name: generateItemName(generated),`

Lines 129-137 (`createItemDrop`): change `name: \`${generated.computedName}${socketSuffix}\`,` to `name: \`${generateItemName(generated)}${socketSuffix}\`,`

- [ ] **2d: Update `SaveManager.ts`**

Find `SerializedItem` interface (~line 17-30). Change `computedName: string;` to `customDisplayName?: string;`

- [ ] **2e: Update `Game.ts` serialization**

Lines 554, 587: change `computedName: item.computedName,` to `customDisplayName: item.customDisplayName,`

- [ ] **2f: Update `Game.ts` deserialization**

Line 635: change `computedName: data.computedName,` to `customDisplayName: data.customDisplayName,`

- [ ] **2g: Type-check and verify**

Run: `npx tsc --noEmit` — expect clean compile

Run: `rg "computedName" src/` — expect zero results in source files

- [ ] **2h: Commit**

```bash
git add src/ui/Tooltip.ts src/ui/InventoryScreen.ts src/entities/ItemDrop.ts src/core/Game.ts src/core/SaveManager.ts
git commit -m "refactor: replace all computedName reads with generateItemName"
```

---

### Task 3: Remove Tooltip Identity Guard & Add Force-Refresh

**Files:**
- Modify: `src/ui/InventoryScreen.ts`

**Steps:**

- [ ] **3a: Replace `lastTooltipItem` with `tooltipItemId`**

In class fields (~line 76), change:
```typescript
private lastTooltipItem: any = null;
```
To:
```typescript
private tooltipItemId: string | null = null;
```

- [ ] **3b: Remove identity guard from `showTooltip`**

Replace lines 312-313:
```typescript
if (item === this.lastTooltipItem && this.tooltip) return;
this.lastTooltipItem = item;
```
With:
```typescript
this.tooltipItemId = item.id;
```

- [ ] **3c: Remove identity guard from `showOrbTooltip`**

Replace lines 468-469:
```typescript
if (orb === this.lastTooltipItem && this.tooltip) return;
this.lastTooltipItem = orb;
```
With:
```typescript
this.tooltipItemId = `orb_${orb.orbId}`;
```

- [ ] **3d: Add `forceRefreshTooltip` public method**

After `hideTooltip()` (~line 465), add:
```typescript
forceRefreshTooltip() {
  if (this.tooltip) {
    this.hideTooltip();
  }
}
```

- [ ] **3e: Type-check**

Run: `npx tsc --noEmit` — expect clean compile

- [ ] **3f: Commit**

```bash
git add src/ui/InventoryScreen.ts
git commit -m "fix: remove tooltip identity guard, add forceRefreshTooltip"
```

---

### Task 4: Wire Orb Mutation Callbacks to Tooltip Refresh

**Files:**
- Modify: `src/core/Game.ts`

**Steps:**

- [ ] **4a: Add `forceRefreshTooltip()` after `onCraftOrbCallback` update**

After line 3103 (the `inventoryScreen.update(...)` call inside the success block), add:
```typescript
this.inventoryScreen?.forceRefreshTooltip();
```
This should be at three places total within the callback (equipped path already has one `update` call).

- [ ] **4b: Add `forceRefreshTooltip()` after `onCraftOrbGridCallback` update**

After line 3131 (the `inventoryScreen.update(...)` call in success block), add:
```typescript
this.inventoryScreen?.forceRefreshTooltip();
```

- [ ] **4c: Add after socket/jewel/drill/unsocket updates**

After each `this.inventoryScreen?.update(...)` at lines 3140, 3155, 3171, add:
```typescript
this.inventoryScreen?.forceRefreshTooltip();
```

- [ ] **4d: Type-check**

Run: `npx tsc --noEmit` — expect clean compile

- [ ] **4e: Commit**

```bash
git add src/core/Game.ts
git commit -m "fix: force-refresh tooltip after all item mutations"
```

---

### Task 5: Add Corruption Zone Styling — Tooltip.ts

**Files:**
- Modify: `src/ui/Tooltip.ts`

**Steps:**

- [ ] **5a: Remove old warp implicit display (lines 50-54)**

Delete:
```typescript
if (item.warpImplicit) {
  elems.push({ left: addText(`Warped: ${item.warpImplicit.name} (+${item.warpImplicit.value})`, { fontSize: 10, fill: '#b060e0', fontStyle: 'italic' }) });
  cy += 14;
}
```

- [ ] **5b: Remove old WARPED tag block (lines 133-151)**

Delete the entire `if (item.warped) { ... }` block at lines 133-151.

- [ ] **5c: Add corruption zone after nonZeroStats block (~after line 98)**

After the closing `}` of `if (nonZeroStats.length > 0) { ... }`, add:

```typescript
if (item.warped) {
  cy += 2;
  elems.push({ left: addText('Corruption', { fontSize: 10, fill: '#9966cc', fontStyle: 'italic' }) });
  cy += 14;

  if (item.warpImplicit) {
    const left = addText(`\u2B21 ${item.warpImplicit.name}`, { fontSize: 11, fill: '#b060e0', fontStyle: 'italic' }, 6);
    const right = addText(`+${item.warpImplicit.value}`, { fontFamily: 'Uncial Antiqua, serif', fontSize: 11, fill: '#c080f0' });
    elems.push({ left, right });
    cy += lineH;
  }

  cy += 4;
  corruptionStartY = cy - lineH - 14 - 2;

  elems.push({ left: addText('CORRUPTED', { fontFamily: 'Cinzel, serif', fontSize: 11, fill: '#8b1a1a', fontWeight: 'bold', letterSpacing: 2 }) });
  cy += 14;

  if (item.warpOutcome) {
    const outcomeLabels: Record<string, string> = {
      warped_implicit: 'Outcome: Warped Implicit', warp_chaos: 'Outcome: Warp Chaos',
      extra_socket: 'Outcome: Extra Socket', stat_surge: 'Outcome: Stat Surge',
      rarity_shift: 'Outcome: Rarity Shift', double_warp: 'Outcome: Double Warp',
      no_change: 'Outcome: No Change',
    };
    elems.push({ left: addText(outcomeLabels[item.warpOutcome] || item.warpOutcome, { fontSize: 9, fill: '#8855aa', fontStyle: 'italic' }) });
    cy += 12;
  }

  corruptionEndY = cy;
}
```

- [ ] **5d: Add tracking variables before the layout loop (~line 30)**

Add after `let cy = pad;`:
```typescript
let corruptionStartY: number | undefined;
let corruptionEndY: number | undefined;
```

- [ ] **5e: Add purple background + divider after main bg render**

After line 197 (`c.addChild(bg);`), add:

```typescript
if (item.warped && corruptionStartY !== undefined) {
  const corrBg = new Graphics();
  corrBg.beginFill(0x500078, 0.15);
  corrBg.drawRoundedRect(pad, corruptionStartY, maxW - pad * 2, corruptionEndY! - corruptionStartY + 4, 3);
  corrBg.endFill();
  c.addChild(corrBg);

  const grad = new Graphics();
  grad.lineStyle(1, 0xb060e0, 0.6);
  grad.moveTo(pad, corruptionStartY);
  grad.lineTo(maxW - pad, corruptionStartY);
  grad.lineStyle(1, 0xb060e0, 0.15);
  grad.moveTo(pad, corruptionStartY - 2);
  grad.lineTo(maxW - pad, corruptionStartY - 2);
  grad.moveTo(pad, corruptionStartY + 2);
  grad.lineTo(maxW - pad, corruptionStartY + 2);
  c.addChild(grad);
}
```

- [ ] **5f: Type-check**

Run: `npx tsc --noEmit` — expect clean compile

- [ ] **5g: Commit**

```bash
git add src/ui/Tooltip.ts
git commit -m "feat: add corruption zone to shared tooltip with purple styling and CORRUPTED tag"
```

---

### Task 6: Add Corruption Zone Styling — InventoryScreen.ts

**Files:**
- Modify: `src/ui/InventoryScreen.ts`

**Steps:**

- [ ] **6a: Add corruption zone fields to class**

After line 60 (`private tooltip?: Container`), add:
```typescript
private tooltipCorruptStartY?: number;
private tooltipCorruptEndY?: number;
```

- [ ] **6b: Add corruption zone block in `showTooltip`**

After the stats section (`if (nonZeroStats.length > 0) { ... }` block closes at ~line 410), add:

```typescript
this.tooltipCorruptStartY = undefined;
this.tooltipCorruptEndY = undefined;

if (item.warped) {
  cy += 2;
  elems.push({ left: addText('Corruption', { fontSize: 10, fill: '#9966cc', fontStyle: 'italic' }) });
  cy += 14;

  if (item.warpImplicit) {
    const left = addText(`\u2B21 ${item.warpImplicit.name}`, { fontSize: 11, fill: '#b060e0', fontStyle: 'italic' }, 6);
    const right = addText(`+${item.warpImplicit.value}`, { fontSize: 11, fill: '#c080f0' });
    elems.push({ left, right });
    cy += lineH;
  }

  cy += 4;
  this.tooltipCorruptStartY = cy - lineH - 14 - 2;

  elems.push({ left: addText('CORRUPTED', { fontFamily: 'Cinzel, serif', fontSize: 11, fill: '#8b1a1a', fontWeight: 'bold', letterSpacing: 2 }) });
  cy += 14;

  if (item.warpOutcome) {
    const outcomeLabels: Record<string, string> = {
      warped_implicit: 'Warped Implicit', warp_chaos: 'Warp Chaos',
      extra_socket: 'Extra Socket', stat_surge: 'Stat Surge',
      rarity_shift: 'Rarity Shift', double_warp: 'Double Warp',
      no_change: 'No Change',
    };
    elems.push({ left: addText(outcomeLabels[item.warpOutcome] || item.warpOutcome, { fontSize: 9, fill: '#8855aa', fontStyle: 'italic' }) });
    cy += 12;
  }

  this.tooltipCorruptEndY = cy;
}
```

- [ ] **6c: Add purple background + divider after tooltip bg render**

After line 447 (`this.tooltip.addChild(bg);`), add:

```typescript
if (this.tooltipCorruptStartY !== undefined && this.tooltipCorruptEndY !== undefined) {
  const corrBg = new Graphics();
  corrBg.beginFill(0x500078, 0.15);
  corrBg.drawRoundedRect(pad, this.tooltipCorruptStartY, maxW - pad * 2, this.tooltipCorruptEndY - this.tooltipCorruptStartY + 4, 3);
  corrBg.endFill();
  this.tooltip.addChild(corrBg);

  const grad = new Graphics();
  grad.lineStyle(1, 0xb060e0, 0.6);
  grad.moveTo(pad, this.tooltipCorruptStartY);
  grad.lineTo(maxW - pad, this.tooltipCorruptStartY);
  grad.lineStyle(1, 0xb060e0, 0.15);
  grad.moveTo(pad, this.tooltipCorruptStartY - 2);
  grad.lineTo(maxW - pad, this.tooltipCorruptStartY - 2);
  grad.moveTo(pad, this.tooltipCorruptStartY + 2);
  grad.lineTo(maxW - pad, this.tooltipCorruptStartY + 2);
  this.tooltip.addChild(grad);
}
```

- [ ] **6d: Type-check**

Run: `npx tsc --noEmit` — expect clean compile

- [ ] **6e: Commit**

```bash
git add src/ui/InventoryScreen.ts
git commit -m "feat: add corruption zone to inventory tooltip with purple styling"
```

---

### Task 7: Integration Verification

- [ ] **7a: Full type-check**

Run: `npx tsc --noEmit` — must be zero errors

- [ ] **7b: Grep for remaining `computedName` references**

Run: `rg "computedName" src/` — must return zero results (only in comments is acceptable)

- [ ] **7c: Visual regression checklist**

Run `npm run dev` and verify manually:
1. Pick up an item → hover in inventory → name displays correctly
2. Apply an orb while hovering the item → tooltip refreshes with new name + stats
3. Apply Warp Stone while hovering → corruption zone appears (purple, ⬡, CORRUPTED tag)
4. Warp Stone warp_chaos outcome → new affixes, name updates, corruption zone shows
5. Non-warped items → no corruption zone visible
6. Unique items (Colossus Blade, Deadeye Bow) → always show authored name
7. Flux a rare → name changes to reflect new affixes
8. Purify → name shows just base name (e.g. "Sword")
9. Mutate normal → name updates to "Prefix Sword Suffix"

- [ ] **7d: Final fixup commit if any issues found**

```bash
git add -A && git commit -m "chore: integration fixes for dynamic names, live tooltips, corruption styling"
```

---

### Regression Checklist

| Check | Covered by |
|-------|-----------|
| `generateItemName` is pure (no side effects) | Task 1a — receives Pick<item>, returns string |
| All display name reads use the new function | Tasks 2a-2c — Tooltip, InventoryScreen, ItemDrop |
| Unique item names never overwritten | Task 1a — `uniqueId && customDisplayName` guard |
| Tooltip live-updates on every mutation | Tasks 3b + 4a-4c — no identity guard + force-refresh wiring |
| Tooltip position stable during refresh | PixiJS double-buffering ensures no flicker |
| Corruption stats in own visual zone | Tasks 5c-5e + 6b-6c |
| Corruption zone hidden on non-warped items | `if (item.warped)` guard in both tooltip renderers |
| CORRUPTED tag visible on all warped items | Rendered unconditionally in `if (item.warped)` block |
| Save data backward compatible | `customDisplayName` is optional; deserialize handles missing |
| All three fixes work together | Task 7 manual verification |
