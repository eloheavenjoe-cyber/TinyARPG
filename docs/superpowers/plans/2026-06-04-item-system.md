# Item System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add equippable item drops with rarity, affixes, and click-to-pickup.

**Architecture:** Data-driven item generation (ItemDefs.ts + ItemGenerator.ts) feeding into the existing ItemDrop.ts nameplate system. Items drop alongside gold/potions on enemy death. Click-to-pickup for items, auto-pickup for consumables.

**Tech Stack:** TypeScript, PixiJS 7

---

### Task 1: Create ItemDefs.ts — item base, affix, and unique data

**Files:**
- Create: `src/core/ItemDefs.ts`

- [ ] **Step 1: Write `src/core/ItemDefs.ts`**

```ts
export type Slot = 'weapon' | 'body' | 'helmet' | 'boots' | 'ring' | 'amulet';
export type Rarity = 'normal' | 'magic' | 'rare' | 'unique';

export interface ItemBase {
  id: string;
  name: string;
  slot: Slot;
  innateStats: Record<string, number>;
  damageRange?: { min: number; max: number };
  dropWeight: number;
}

export interface ItemAffix {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  stat: string;
  min: number;
  max: number;
}

export interface UniqueItem {
  id: string;
  name: string;
  baseId: string;
  slot: Slot;
  innateStats: Record<string, number>;
  damageRange?: { min: number; max: number };
  fixedAffixes: Record<string, number>;
  flavor: string;
}

export const ITEM_BASES: ItemBase[] = [
  { id: 'sword', name: 'Sword', slot: 'weapon', innateStats: {}, damageRange: { min: 5, max: 10 }, dropWeight: 30 },
  { id: 'bow', name: 'Bow', slot: 'weapon', innateStats: {}, damageRange: { min: 4, max: 9 }, dropWeight: 30 },
  { id: 'body', name: 'Body Armor', slot: 'body', innateStats: { armor: 8 }, dropWeight: 20 },
  { id: 'helmet', name: 'Helmet', slot: 'helmet', innateStats: { armor: 4 }, dropWeight: 20 },
  { id: 'boots', name: 'Boots', slot: 'boots', innateStats: { armor: 2, moveSpeedPct: 2 }, dropWeight: 20 },
  { id: 'ring', name: 'Ring', slot: 'ring', innateStats: {}, dropWeight: 8 },
  { id: 'amulet', name: 'Amulet', slot: 'amulet', innateStats: {}, dropWeight: 5 },
];

export const AFFIXES: ItemAffix[] = [
  { id: 'garnished', name: 'Garnished', type: 'prefix', stat: 'hp', min: 5, max: 15 },
  { id: 'sturdy', name: 'Sturdy', type: 'prefix', stat: 'armor', min: 3, max: 10 },
  { id: 'sharp', name: 'Sharp', type: 'prefix', stat: 'damage', min: 1, max: 5 },
  { id: 'spiked', name: 'Spiked', type: 'prefix', stat: 'damagePct', min: 5, max: 15 },
  { id: 'quick', name: 'Quick', type: 'prefix', stat: 'attackSpeedPct', min: 3, max: 10 },
  { id: 'arcane', name: 'Arcane', type: 'prefix', stat: 'mana', min: 5, max: 15 },
  { id: 'of_the_ox', name: 'of the Ox', type: 'suffix', stat: 'str', min: 3, max: 8 },
  { id: 'of_the_fox', name: 'of the Fox', type: 'suffix', stat: 'dex', min: 3, max: 8 },
  { id: 'of_the_sage', name: 'of the Sage', type: 'suffix', stat: 'int', min: 3, max: 8 },
  { id: 'of_protection', name: 'of Protection', type: 'suffix', stat: 'armorPct', min: 5, max: 15 },
  { id: 'of_regrowth', name: 'of Regrowth', type: 'suffix', stat: 'hpRegen', min: 1, max: 3 },
  { id: 'of_flames', name: 'of Flames', type: 'suffix', stat: 'fireDmg', min: 1, max: 4 },
];

export const UNIQUE_ITEMS: UniqueItem[] = [
  {
    id: 'colossus_blade',
    name: 'Colossus Blade',
    baseId: 'sword',
    slot: 'weapon',
    innateStats: {},
    damageRange: { min: 12, max: 18 },
    fixedAffixes: { hp: 20, damageReduction: 10, str: 5 },
    flavor: 'Unbreakable',
  },
  {
    id: 'deadeye_bow',
    name: 'Deadeye Bow',
    baseId: 'bow',
    slot: 'weapon',
    innateStats: {},
    damageRange: { min: 8, max: 14 },
    fixedAffixes: { attackSpeedPct: 15, dex: 5, projectileDmgPct: 10 },
    flavor: 'One shot, one kill',
  },
];
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/ItemDefs.ts
git commit -m "feat: add item base, affix, and unique data"
```

---

### Task 2: Create ItemGenerator.ts — drop roll and affix generation

**Files:**
- Create: `src/core/ItemGenerator.ts`

- [ ] **Step 1: Write `src/core/ItemGenerator.ts`**

```ts
import { ITEM_BASES, AFFIXES, UNIQUE_ITEMS, ItemBase, ItemAffix, Rarity } from './ItemDefs';

export interface GeneratedItem {
  id: string;
  base: ItemBase;
  rarity: Rarity;
  affixes: { affix: ItemAffix; roll: number }[];
  uniqueId?: string;
  damageRoll: number;
  computedName: string;
  computedStats: Record<string, number>;
}

function pickWeighted(bases: ItemBase[]): ItemBase {
  const totalWeight = bases.reduce((s, b) => s + b.dropWeight, 0);
  let r = Math.random() * totalWeight;
  for (const base of bases) {
    r -= base.dropWeight;
    if (r <= 0) return base;
  }
  return bases[bases.length - 1];
}

function generateName(affixes: { affix: ItemAffix; roll: number }[], baseName: string): string {
  const prefixes = affixes.filter(a => a.affix.type === 'prefix').map(a => a.affix.name);
  const suffixes = affixes.filter(a => a.affix.type === 'suffix').map(a => a.affix.name);
  return [...prefixes, baseName, ...suffixes].join(' ');
}

export function generateItemDrop(): GeneratedItem {
  const rarityRoll = Math.random();
  let rarity: Rarity;
  if (rarityRoll < 0.50) rarity = 'normal';
  else if (rarityRoll < 0.80) rarity = 'magic';
  else if (rarityRoll < 0.95) rarity = 'rare';
  else rarity = 'unique';

  if (rarity === 'unique') {
    const unique = UNIQUE_ITEMS[Math.floor(Math.random() * UNIQUE_ITEMS.length)];
    const base = ITEM_BASES.find(b => b.id === unique.baseId)!;
    const dr = base.damageRange
      ? base.damageRange.min + Math.floor(Math.random() * (base.damageRange.max - base.damageRange.min + 1))
      : 0;
    const stats: Record<string, number> = { ...unique.innateStats, ...unique.fixedAffixes };
    if (dr > 0) stats.damage = dr;
    return {
      id: crypto.randomUUID(),
      base, rarity: 'unique',
      affixes: Object.entries(unique.fixedAffixes).map(([stat, value]) => ({
        affix: { id: stat, name: '', type: 'prefix' as const, stat, min: value, max: value },
        roll: value,
      })),
      uniqueId: unique.id,
      damageRoll: dr,
      computedName: unique.name,
      computedStats: stats,
    };
  }

  const base = pickWeighted(ITEM_BASES);

  const affixCount = rarity === 'magic' ? 2 : rarity === 'rare' ? 4 + Math.floor(Math.random() * 3) : 0;

  const prefixes = AFFIXES.filter(a => a.type === 'prefix').sort(() => Math.random() - 0.5);
  const suffixes = AFFIXES.filter(a => a.type === 'suffix').sort(() => Math.random() - 0.5);
  const picked: { affix: ItemAffix; roll: number }[] = [];

  const prefixCount = Math.min(Math.ceil(affixCount / 2), prefixes.length);
  const suffixCount = Math.min(Math.floor(affixCount / 2), suffixes.length);

  for (let i = 0; i < prefixCount; i++) {
    const affix = prefixes[i];
    const roll = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1));
    picked.push({ affix, roll });
  }
  for (let i = 0; i < suffixCount; i++) {
    const affix = suffixes[i];
    const roll = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1));
    picked.push({ affix, roll });
  }

  const damageRoll = base.damageRange
    ? base.damageRange.min + Math.floor(Math.random() * (base.damageRange.max - base.damageRange.min + 1))
    : 0;

  const stats: Record<string, number> = { ...base.innateStats };
  if (damageRoll > 0) stats.damage = damageRoll;
  for (const p of picked) {
    stats[p.affix.stat] = (stats[p.affix.stat] || 0) + p.roll;
  }

  const item: GeneratedItem = {
    id: crypto.randomUUID(),
    base, rarity, affixes: picked, damageRoll,
    computedName: generateName(picked, base.name),
    computedStats: stats,
  };
  return item;
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/ItemGenerator.ts
git commit -m "feat: add item generation logic"
```

---

### Task 3: Extend ItemDrop.ts — add equippable item support

**Files:**
- Modify: `src/entities/ItemDrop.ts`

- [ ] **Step 1: Add imports and interfaces**

After the existing imports, add:
```ts
import { GeneratedItem } from '../core/ItemGenerator';
```

Replace the `LootItem` interface with a union type that includes both consumable and equippable items:

```ts
export interface ConsumableItem {
  type: 'gold' | 'healthPotion' | 'manaPotion';
  name: string;
  color: number;
  value: number;
}

export interface EquippableItem {
  type: 'item';
  name: string;
  color: number;
  generated: GeneratedItem;
}

export type LootItem = ConsumableItem | EquippableItem;
```

- [ ] **Step 2: Add helper function**

After the `ItemDrop` class, add (uses existing `RARITY_COLORS` map at top of file):
```ts
export function isEquippableDrop(drop: ItemDrop): boolean {
  return drop.item.type === 'item';
}

export function createItemDrop(x: number, y: number, generated: GeneratedItem): ItemDrop {
  return new ItemDrop(x, y, {
    type: 'item',
    name: generated.computedName,
    color: RARITY_COLORS[generated.rarity] || 0xffffff,
    generated,
  });
}
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/entities/ItemDrop.ts
git commit -m "feat: extend ItemDrop for equippable items"
```

---

### Task 4: Integrate item drops and click-to-pickup in Game.ts

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add imports**

Add to the top of `Game.ts`:
```ts
import { generateItemDrop } from './core/ItemGenerator';
import { isEquippableDrop, createItemDrop } from './entities/ItemDrop';
```

- [ ] **Step 2: Add item drop chance in spawnLoot**

In the `spawnLoot` method, after the existing `createRandomLoot` loop, add:
```ts
if (Math.random() < 0.4) {
  const gen = generateItemDrop();
  const drop = createItemDrop(x, y, gen);
  this.itemDrops.push(drop);
  this.gameContainer!.addChild(drop.container);
}
```

- [ ] **Step 3: Add click-to-pickup before main ability**

Replace the existing click-to-attack block:
```ts
if (this.input.consumeClick()) {
  this.useMainAbility();
}
```

With:
```ts
if (this.input.consumeClick()) {
  let clickedItem = false;
  for (const drop of this.itemDrops) {
    if (drop.pickedUp) continue;
    if (isEquippableDrop(drop) && Math.hypot(mouseWX - drop.x, mouseWY - drop.y) < 30) {
      drop.pickup();
      this.gameContainer!.removeChild(drop.container);
      drop.destroy();
      this.itemDrops.splice(this.itemDrops.indexOf(drop), 1);
      clickedItem = true;
      break;
    }
  }
  if (!clickedItem) {
    this.useMainAbility();
  }
}
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: integrate item drops and click-to-pickup"
```

---

### Task 5: Final verification

**Files:**
- N/A (verification only)

- [ ] **Step 1: Full compile check**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 2: Run the dev server to confirm it works**

Run: `npm run dev`
Expected: Starts without errors. Kill after confirming.
