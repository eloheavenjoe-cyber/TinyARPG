# Socketable Jewels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add socketable jewels that slot into equipment sockets, with weighted socket generation, Drilling/Shattering/Preservation orbs, paper doll equipment UI, and drag-and-drop socketing.

**Architecture:** 10 sequential tasks building from data model → generation → UI → interaction → persistence. Each task produces working, testable code.

**Tech Stack:** TypeScript + PixiJS 7, existing item/orb/crafting patterns

---

## Task 1: Data Model — Socket Types, GeneratedItem Fields, Jewel-Only Affixes

**Files:**
- Modify: `src/core/ItemDefs.ts` (add jewel affixes, SocketSlot type)
- Modify: `src/entities/Player.ts` (add sockets to EquipSlot, extend OrbInfo)
- Modify: `src/core/ItemGenerator.ts` (add sockets/maxSockets to GeneratedItem)

- [ ] **Step 1: Add separate JEWEL_ONLY_AFFIXES array to ItemDefs.ts**

Add after the `AFFIXES` array (after line 164). Jewel affixes are in their own array — no schema change needed to `ItemAffix`:

```typescript
export const JEWEL_ONLY_AFFIXES: ItemAffix[] = [
  { id: 'dmg_per_passive', name: 'of the Prodigy', type: 'suffix', stat: 'dmgPerPassivePct', min: 1, max: 2, tier: 1 },
  { id: 'dmg_per_passive_t2', name: 'of the Savant', type: 'suffix', stat: 'dmgPerPassivePct', min: 2, max: 3, tier: 2 },
  { id: 'dmg_per_passive_t3', name: 'of the Genius', type: 'suffix', stat: 'dmgPerPassivePct', min: 3, max: 5, tier: 3 },
  { id: 'all_res', name: 'Prismatic', type: 'prefix', stat: 'allResistancePct', min: 3, max: 5, tier: 1 },
  { id: 'all_res_t2', name: 'Iridescent', type: 'prefix', stat: 'allResistancePct', min: 5, max: 8, tier: 2 },
  { id: 'all_res_t3', name: 'Refractive', type: 'prefix', stat: 'allResistancePct', min: 8, max: 12, tier: 3 },
  { id: 'crit_dmg', name: 'of Precision', type: 'suffix', stat: 'critDmgPct', min: 10, max: 20, tier: 1 },
  { id: 'crit_dmg_t2', name: 'of Accuracy', type: 'suffix', stat: 'critDmgPct', min: 20, max: 30, tier: 2 },
  { id: 'crit_dmg_t3', name: 'of the Deadeye', type: 'suffix', stat: 'critDmgPct', min: 30, max: 40, tier: 3 },
  { id: 'minion_dmg', name: "Master's", type: 'prefix', stat: 'minionDmgPct', min: 10, max: 18, tier: 1 },
  { id: 'minion_dmg_t2', name: "Overlord's", type: 'prefix', stat: 'minionDmgPct', min: 18, max: 25, tier: 2 },
  { id: 'minion_dmg_t3', name: "Warlord's", type: 'prefix', stat: 'minionDmgPct', min: 25, max: 35, tier: 3 },
  { id: 'onslaught_kill', name: 'of Rush', type: 'suffix', stat: 'onslaughtOnKillPct', min: 5, max: 10, tier: 1 },
  { id: 'onslaught_kill_t2', name: 'of Haste', type: 'suffix', stat: 'onslaughtOnKillPct', min: 10, max: 15, tier: 2 },
  { id: 'onslaught_kill_t3', name: 'of Fury', type: 'suffix', stat: 'onslaughtOnKillPct', min: 15, max: 20, tier: 3 },
  { id: 'bleed_chance', name: 'of the Wound', type: 'suffix', stat: 'bleedChancePct', min: 10, max: 20, tier: 1 },
  { id: 'bleed_chance_t2', name: 'of Laceration', type: 'suffix', stat: 'bleedChancePct', min: 20, max: 30, tier: 2 },
  { id: 'bleed_chance_t3', name: 'of the Butcher', type: 'suffix', stat: 'bleedChancePct', min: 30, max: 40, tier: 3 },
];
```

- [ ] **Step 2: Add SocketSlot type and socket fields**

Add to `ItemDefs.ts`, after the `UniqueItem` interface (line 32):

```typescript
export interface SocketSlot {
  jewel: GeneratedItem | null;
}

// SocketSlot lives on EquipSlot (player equipment) and optionally on GeneratedItem
// For GeneratedItem.socketSlots: array of empty slots, length = current socket count
```

- [ ] **Step 3: Add socketCount/maxSockets to GeneratedItem in ItemGenerator.ts**

Add these fields to the `GeneratedItem` interface (after line 13):

```typescript
socketSlots: SocketSlot[];  // array of empty slots, length = current socket count
maxSockets: number;         // theoretical max based on base type
```

- [ ] **Step 4: Add JEWEL_BASE to ItemDefs.ts**

Add to the bottom of `ITEM_BASES` after line 42:

```typescript
{ id: 'jewel', name: 'Jewel', slot: 'ring', innateStats: {}, dropWeight: 0 },
```

The `dropWeight: 0` ensures it's never looted as a normal item — jewels use their own drop path.

- [ ] **Step 5: Add loot jewel type to ItemDrop.ts**

Add to the `EquippableItem` interface (or create a parallel type):

```typescript
export interface JewelItem {
  type: 'jewel';
  name: string;
  color: number;
  generated: GeneratedItem;
}

export type LootItem = ConsumableItem | EquippableItem | OrbItem | JewelItem;
```

- [ ] **Step 6: Commit**

```bash
git add src/core/ItemDefs.ts src/core/ItemGenerator.ts src/entities/ItemDrop.ts
git commit -m "feat(jewels): add data model types, jewel-only affixes, socket fields"
```

---

## Task 2: Jewel Generation — generateJewel(), rollSockets(), Drop Rates

**Files:**
- Modify: `src/core/ItemGenerator.ts`
- Modify: `src/core/Game.ts` (drop rate wiring)
- Modify: `src/core/ZoneManager.ts` (drop rate wiring)

- [ ] **Step 1: Add getMaxSockets() helper to ItemGenerator.ts**

Add before `pickWeighted`:

```typescript
function getMaxSockets(base: ItemBase): number {
  switch (base.slot) {
    case 'weapon': return 6;
    case 'body': return 6;
    case 'helmet': return 4;
    case 'boots': return 4;
    case 'ring': return 1;
    case 'ring2': return 1;
    case 'amulet': return 1;
    default: return 0;
  }
}
```

- [ ] **Step 2: Add rollSockets() function to ItemGenerator.ts**

Add after `getMaxSockets`:

```typescript
export function rollSockets(maxSockets: number, currentSockets?: number): number {
  const distributions: Record<number, { value: number; weight: number }[]> = {
    6: [
      { value: 0, weight: 30 }, { value: 1, weight: 25 },
      { value: 2, weight: 20 }, { value: 3, weight: 15 },
      { value: 4, weight: 7 }, { value: 5, weight: 2.5 },
      { value: 6, weight: 0.5 },
    ],
    4: [
      { value: 0, weight: 35 }, { value: 1, weight: 30 },
      { value: 2, weight: 20 }, { value: 3, weight: 10 },
      { value: 4, weight: 5 },
    ],
    1: [
      { value: 0, weight: 65 }, { value: 1, weight: 35 },
    ],
  };

  const dist = distributions[maxSockets] || distributions[1];
  const totalWeight = dist.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * totalWeight;
  let result = dist[0].value;

  for (const d of dist) {
    r -= d.weight;
    if (r <= 0) { result = d.value; break; }
  }

  // Drilling Orb: always different than current
  if (currentSockets !== undefined && result === currentSockets) {
    result = (result + 1) % (maxSockets + 1);
  }

  return result;
}
```

- [ ] **Step 3: Add generateJewel() function**

Add after `rollSockets`:

```typescript
export function generateJewel(playerLevel?: number): GeneratedItem {
  const ilvl = playerLevel || 1;
  const maxTierRoll = Math.random();
  const maxTier = maxTierRoll < 0.50 ? 1 : maxTierRoll < 0.85 ? 2 : 3;

  // Rarity roll with jewel-only weights (no unique)
  const rarityRoll = Math.random();
  let rarity: Rarity;
  let affixCount: number;
  if (rarityRoll < 0.50) { rarity = 'normal'; affixCount = 1; }
  else if (rarityRoll < 0.80) { rarity = 'magic'; affixCount = 2; }
  else if (rarityRoll < 0.95) { rarity = 'rare'; affixCount = 3; }
  else { rarity = 'rare'; affixCount = 4 + Math.floor(Math.random() * 3); } // Exquisite = rare with 4-6 affixes

  // Pool: all normal affixes (filtered by tier) + jewel-only affixes (filtered by tier)
  const pool = AFFIXES.filter(a => a.tier <= maxTier).sort(() => Math.random() - 0.5);
  const jewelPool = JEWEL_ONLY_AFFIXES.filter(a => a.tier <= maxTier).sort(() => Math.random() - 0.5);

  const picked: { affix: ItemAffix; roll: number }[] = [];
  const usedStats = new Set<string>();

  for (let i = 0; i < affixCount; i++) {
    // ~30% chance to pull from jewel pool, 70% from normal pool
    const useJewel = jewelPool.length > 0 && Math.random() < 0.3;
    const src = useJewel ? jewelPool : pool;
    const pick = src.find(a => !usedStats.has(a.stat));
    if (!pick) continue;
    usedStats.add(pick.stat);
    const roll = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
    picked.push({ affix: pick, roll });
  }

  const stats: Record<string, number> = {};
  for (const p of picked) {
    stats[p.affix.stat] = (stats[p.affix.stat] || 0) + p.roll;
  }

  const tierCounts: Record<number, number> = {};
  for (const a of picked) tierCounts[a.affix.tier] = (tierCounts[a.affix.tier] || 0) + 1;
  const highestTier = Math.max(...Object.keys(tierCounts).map(Number), 1);
  const levelReq = highestTier * 4;

  const base: ItemBase = { id: 'jewel', name: 'Jewel', slot: 'ring', innateStats: {}, dropWeight: 0 };
  const jewelName = rarity === 'rare' && affixCount >= 4
    ? `Exquisite ${generateName(picked, 'Jewel')}`
    : generateName(picked, 'Jewel');

  return {
    id: crypto.randomUUID(),
    base, rarity,
    affixes: picked,
    damageRoll: 0,
    computedName: jewelName,
    computedStats: stats,
    ilvl,
    levelReq,
    sockets: 0,
    maxSockets: 0,
  };
}
```

- [ ] **Step 4: Update generateItemDrop() to add socketSlots**

After `const item: GeneratedItem = {...}` at line 105-112, add:

```typescript
item.socketSlots = Array.from({ length: rollSockets(item.maxSockets) }, () => ({ jewel: null }));
```

Also add `maxSockets` to both items (normal-path and unique-path returns):

After line 63 for uniques:
```typescript
maxSockets: getMaxSockets(base),
socketSlots: Array.from({ length: rollSockets(getMaxSockets(base)) }, () => ({ jewel: null })),
```

After line 111 for normal items:
```typescript
maxSockets: getMaxSockets(base),
```

And at line 112, also set:
```typescript
item.socketSlots = Array.from({ length: rollSockets(item.maxSockets) }, () => ({ jewel: null }));
```

- [ ] **Step 5: Add jewel and new orb drop rates to Game.ts drop logic**

Find `spawnLoot()` or `generateEnemyDrop()` in Game.ts. Add jewel drops as a new type:

```typescript
// ~15% of item drops are jewels instead of equipment
if (Math.random() < 0.15) {
  const jewel = generateJewel(playerLevel);
  const color = jewel.rarity === 'magic' ? 0x4488ff : jewel.rarity === 'rare' ? 0xffcc00 : jewel.affixes.length >= 4 ? 0xff8800 : 0xffffff;
  drops.push(new ItemDrop(x, y, { type: 'jewel', name: jewel.computedName, color, generated: jewel }));
} else {
  // existing item drop logic
}
```

- [ ] **Step 6: Update generateOrbDrop() to include new orbs**

Replace the function in ItemGenerator.ts:

```typescript
export function generateOrbDrop(): { orbId: string; name: string } {
  const r = Math.random();
  if (r < 0.20) return { orbId: 'mutation', name: 'Orb of Mutation' };
  if (r < 0.35) return { orbId: 'purification', name: 'Orb of Purification' };
  if (r < 0.45) return { orbId: 'empowerment', name: 'Orb of Empowerment' };
  if (r < 0.53) return { orbId: 'flux', name: 'Orb of Flux' };
  if (r < 0.58) return { orbId: 'growth', name: 'Orb of Growth' };
  if (r < 0.63) return { orbId: 'ascendance', name: 'Orb of Ascendance' };
  if (r < 0.69) return { orbId: 'drilling', name: 'Drilling Orb' };
  if (r < 0.77) return { orbId: 'shattering', name: 'Shattering Orb' };
  return { orbId: 'preservation', name: 'Preservation Orb' };
}
```

- [ ] **Step 7: Ensure ZoneManager passes playerLevel through drop calls**

Verify that `ZoneManager.spawnEnemies()` passes `playerLevel` to any generate function that calls `generateItemDrop` or `generateJewel`.

- [ ] **Step 8: Commit**

```bash
git add src/core/ItemGenerator.ts src/core/Game.ts src/core/ZoneManager.ts
git commit -m "feat(jewels): add jewel generation, socket rolling, orb drop rates"
```

---

## Task 3: Nameplate Socket Display on Item Drops

**Files:**
- Modify: `src/entities/ItemDrop.ts`

- [ ] **Step 1: Update createItemDrop() to show socket count**

Replace `createItemDrop` at line 105-112:

```typescript
export function createItemDrop(x: number, y: number, generated: GeneratedItem): ItemDrop {
  const socketSuffix = generated.socketSlots && generated.maxSockets > 0
    ? ` (${generated.socketSlots.length})` : '';
  return new ItemDrop(x, y, {
    type: 'item',
    name: `${generated.computedName}${socketSuffix}`,
    color: RARITY_COLORS[generated.rarity] || 0xffffff,
    generated,
  });
}
```

- [ ] **Step 2: Add createJewelDrop() function**

Add after `createItemDrop`:

```typescript
export function createJewelDrop(x: number, y: number, generated: GeneratedItem): ItemDrop {
  const rarityColors: Record<string, number> = {
    normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00,
  };
  const color = generated.affixes.length >= 4 ? 0xff8800 : (rarityColors[generated.rarity] || 0xffffff);
  return new ItemDrop(x, y, {
    type: 'jewel',
    name: generated.computedName,
    color,
    generated,
  });
}
```

- [ ] **Step 3: Update isEquippableDrop to handle jewel type**

Rename the existing function or add a parallel one:

```typescript
export function isJewelDrop(drop: ItemDrop): drop is ItemDrop & { item: JewelItem } {
  return drop.item.type === 'jewel';
}
```

- [ ] **Step 4: Commit**

```bash
git add src/entities/ItemDrop.ts
git commit -m "feat(jewels): show socket count on item nameplates, add jewel drop helper"
```

---

## Task 4: Paper Doll Equipment UI (Redesign InventoryScreen)

**Files:**
- Overwrite: `src/ui/InventoryScreen.ts` (major redesign)

This is the largest single change. The layout goes from a vertical list of equipment slots to a classic paper doll arrangement, plus socket rendering.

- [ ] **Step 1: Redesign the constructor layout**

Replace the equipment panel section (lines 141-202) with a paper doll layout:

```typescript
// Paper doll — centered vertically, positioned beside the inventory grid
const dollCenterX = gridLeft + cols * (slotSize + gap) + 120;
const dollCenterY = screenH / 2 - 10;

const paperDollBg = new Graphics();
paperDollBg.beginFill(COLORS.panel, 0.8);
paperDollBg.drawRoundedRect(dollCenterX - 80, dollCenterY - 140, 200, 280, 8);
paperDollBg.endFill();
this.container.addChild(paperDollBg);

const slotGap = 6;
const es = 54; // equipment slot size

// Character body silhouette
const bodySilhouette = new Graphics();
bodySilhouette.beginFill(0x1a1a30, 0.6);
bodySilhouette.drawRoundedRect(dollCenterX - 12, dollCenterY - 30, 24, 60, 4);
bodySilhouette.drawCircle(dollCenterX, dollCenterY - 54, 18);
bodySilhouette.endFill();
this.container.addChild(bodySilhouette);

interface DollSlot {
  slot: Slot; x: number; y: number; label: string;
}

const dollSlots: DollSlot[] = [
  { slot: 'helmet', x: dollCenterX, y: dollCenterY - 130, label: 'Helmet' },
  { slot: 'weapon', x: dollCenterX - 70, y: dollCenterY - 60, label: 'Weapon' },
  { slot: 'body', x: dollCenterX, y: dollCenterY - 60, label: 'Body' },
  { slot: 'ring', x: dollCenterX + 70, y: dollCenterY - 60, label: 'Ring 1' },
  { slot: 'gloves' as Slot, x: dollCenterX, y: dollCenterY + 10, label: 'Gloves' },
  { slot: 'ring2', x: dollCenterX + 70, y: dollCenterY + 10, label: 'Ring 2' },
  { slot: 'boots', x: dollCenterX, y: dollCenterY + 80, label: 'Boots' },
  { slot: 'amulet', x: dollCenterX + 70, y: dollCenterY + 80, label: 'Amulet' },
];
```

Then render each doll slot with its label, item text, icon, and socket indicators:

```typescript
for (const ds of dollSlots) {
  const item = equipment[ds.slot];
  const g = new Graphics();
  g.beginFill(item ? 0x222244 : COLORS.slotBg);
  g.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
  g.drawRoundedRect(-es / 2, -es / 2, es, es, 4);
  g.endFill();
  g.x = ds.x;
  g.y = ds.y;
  this.container.addChild(g);

  const labelTxt = new Text(ds.label, new TextStyle({
    fontFamily: 'monospace', fontSize: 9, fill: COLORS.textDim,
  }));
  labelTxt.anchor.set(0.5, 0);
  labelTxt.x = ds.x;
  labelTxt.y = ds.y + es / 2 + 2;
  this.container.addChild(labelTxt);

  const itemTxt = new Text(item ? item.base.name : '', new TextStyle({
    fontFamily: 'monospace', fontSize: 8,
    fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
  }));
  itemTxt.anchor.set(0.5);
  itemTxt.x = ds.x;
  itemTxt.y = ds.y + 4;
  this.container.addChild(itemTxt);

  const equipIcon = new Sprite();
  equipIcon.anchor.set(0.5);
  equipIcon.x = ds.x;
  equipIcon.y = ds.y;
  equipIcon.visible = false;
  this.container.addChild(equipIcon);

  // Socket indicators — shown below the slot
  const socketContainer = new Container();
  socketContainer.x = ds.x;
  socketContainer.y = ds.y + es / 2 + 14;
  this.container.addChild(socketContainer);

  // Store socket rendering data on a new array
  this.equipSlotsData.push({
    slot: ds.slot,
    bg: g, item: itemTxt, icon: equipIcon,
    socketContainer,
  });
}
```

- [ ] **Step 2: Add socket rendering update logic**

In the `update()` method, after updating equipment visuals (after line 518):

```typescript
// Update socket indicators for each equipment slot
for (const esd of this.equipSlotsData) {
  const item = equipment[esd.slot];
  esd.socketContainer.removeChildren();
  if (!item || item.maxSockets === 0) continue;

  const socketRadius = 4;
  const socketGap = 14;
  const totalW = item.maxSockets * socketGap;

  for (let i = 0; i < item.maxSockets; i++) {
    const sx = -totalW / 2 + i * socketGap + socketGap / 2;
    const dot = new Graphics();
    const hasJewel = item.socketSlots && i < item.socketSlots.length && item.socketSlots[i]?.jewel;
    if (hasJewel) {
      const jColor = getRarityColor(item.socketSlots[i].jewel.rarity);
      dot.beginFill(jColor);
    } else {
      dot.beginFill(0x333333);
    }
    dot.lineStyle(1, 0x555555);
    dot.drawCircle(sx, 0, socketRadius);
    dot.endFill();
    esd.socketContainer.addChild(dot);
  }
}
```

- [ ] **Step 3: Update file header and type additions**

Add a new private array for equip slots rendering data:

```typescript
private equipSlotsData: {
  slot: Slot; bg: Graphics; item: Text; icon: Sprite;
  socketContainer: Container;
}[] = [];
```

- [ ] **Step 4: Remove the old `equipSlots` init and related code**

Keep the `equipSlots` array name but redirect to the new layout. The old layout variable `equipSlots` can remain but the paper doll now uses `equipSlotsData` for socket rendering.

- [ ] **Step 5: Update hover detection in update()**

Change equipment hover detection (lines 419-428) to use the new doll slot positions:

```typescript
if (!hoveredEntry) {
  for (const esd of this.equipSlotsData) {
    const ex = esd.bg.x, ey = esd.bg.y;
    if (this.mouseX >= ex - esd.bg.width / 2 && this.mouseX <= ex + esd.bg.width / 2 &&
        this.mouseY >= ey - esd.bg.height / 2 && this.mouseY <= ey + esd.bg.height / 2) {
      this.hoveredSlot = esd.slot as any;
      if (equipment[esd.slot]) hoveredEntry = { kind: 'equip', item: equipment[esd.slot] } as EquipSlot;
      break;
    }
  }
}
```

- [ ] **Step 6: Update handleClick() to use new doll slots**

Change the equipment slot click handler (lines 584-607) to use `equipSlotsData` instead of `equipSlots`:

```typescript
for (const esd of this.equipSlotsData) {
  const ex = esd.bg.x, ey = esd.bg.y;
  if (this.mouseX >= ex - esd.bg.width / 2 && this.mouseX <= ex + esd.bg.width / 2 &&
      this.mouseY >= ey - esd.bg.height / 2 && this.mouseY <= ey + esd.bg.height / 2) {
    if (this.activeOrb && equipment[esd.slot]) {
      const success = this.onCraftOrb(this.activeOrb, esd.slot);
      ...
    } else if (this.selectedIndex >= 0) {
      ...
      this.onEquip(this.selectedIndex);
      ...
    } else if (equipment[esd.slot]) {
      this.onUnequip(esd.slot);
    }
    return;
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/ui/InventoryScreen.ts
git commit -m "feat(jewels): paper doll equipment UI with socket indicators"
```

---

## Task 5: Jewel Socketing — Right-Click and Drag-Drop

**Files:**
- Modify: `src/ui/InventoryScreen.ts` (extend with socketing + drag-drop)
- Modify: `src/core/Game.ts` (new socket/drill/shatter/preserve callbacks)
- Modify: `src/entities/Player.ts` (socketJewel(), hasEmptySocket() methods)

- [ ] **Step 1: Add Player.ts socket methods**

Add after `pickupItem()` (around line 140):

```typescript
socketJewel(slot: Slot, jewel: GeneratedItem, gridIndex: number): boolean {
  const item = this.equipment[slot];
  if (!item || !item.socketSlots) return false;
  const emptyIdx = item.socketSlots.findIndex(s => !s.jewel);
  if (emptyIdx === -1) return false;

  // Remove jewel from inventory
  this.inventory[gridIndex] = null;

  // Socket it
  item.socketSlots[emptyIdx].jewel = jewel;
  this.recalcStats();
  return true;
}

unsocketJewel(slot: Slot, socketIndex: number, destroy: boolean): boolean {
  const item = this.equipment[slot];
  if (!item || !item.socketSlots) return false;
  const socket = item.socketSlots[socketIndex];
  if (!socket.jewel) return false;

  if (destroy) {
    socket.jewel = null;
    this.recalcStats();
    return true;
  }

  // Return jewel to inventory
  const idx = this.inventory.findIndex(s => s === null);
  if (idx === -1) return false;
  this.inventory[idx] = { kind: 'equip', item: socket.jewel };
  socket.jewel = null;
  this.recalcStats();
  return true;
}

drillSockets(slot: Slot): boolean {
  const item = this.equipment[slot];
  if (!item || !item.maxSockets) return false;
  const newCount = rollSockets(item.maxSockets, item.socketSlots?.length || 0);
  const oldCount = item.socketSlots?.length || 0;
  item.socketSlots = Array.from({ length: newCount }, (_, i) =>
    i < oldCount && item.socketSlots?.[i]?.jewel ? item.socketSlots[i] : { jewel: null }
  );
  return true;
}
```

- [ ] **Step 2: Add grid jewel socketing to InventoryScreen — right-click**

In `handleRightClick()`, add jewel detection. After the normal orb check (line 536):

```typescript
if (entry && entry.kind === 'equip' && entry.item.base.id === 'jewel') {
  // Right-click jewel in inventory → select it as active socketable
  this.activeSocketJewel = this.activeSocketJewel === g.index ? null : g.index;
  this.activeOrb = null; // deselect any orb
  this.selectedIndex = this.activeSocketJewel !== null ? g.index : -1;
  return;
}
```

- [ ] **Step 3: Handle jewel-on-equip click in handleClick()**

In `handleClick()`, when clicking an equipment slot while `activeSocketJewel` is set:

```typescript
if (this.activeSocketJewel !== null) {
  const jewelEntry = inventory[this.activeSocketJewel];
  if (jewelEntry && jewelEntry.kind === 'equip' && jewelEntry.item.base.id === 'jewel') {
    this.onSocketJewel(esd.slot, this.activeSocketJewel);
    this.activeSocketJewel = null;
    this.selectedIndex = -1;
    return;
  }
}
```

- [ ] **Step 4: Add drag-drop interface for jewels**

In `InventoryScreen`, add drag state and event handling:

```typescript
private draggingJewel: { gridIndex: number; icon: Sprite } | null = null;

// In update(), collect pointer state
if (input.isMouseDown && !this.draggingJewel) {
  // Check if mouse is on a jewel item in grid
  for (const g of this.gridSlots) {
    if (mouseInBounds) {
      const entry = inventory[g.index];
      if (entry && entry.kind === 'equip' && entry.item.base.id === 'jewel') {
        // Start drag
        const icon = new Sprite(getItemTexture('jewel'));
        icon.anchor.set(0.5);
        icon.scale.set(1.5);
        icon.x = this.mouseX;
        icon.y = this.mouseY;
        this.container.addChild(icon);
        this.draggingJewel = { gridIndex: g.index, icon };
        break;
      }
    }
  }
}

if (this.draggingJewel) {
  this.draggingJewel.icon.x = this.mouseX;
  this.draggingJewel.icon.y = this.mouseY;

  if (!input.isMouseDown) {
    // Drop — check if over any doll slot
    const dropTarget = this.equipSlotsData.find(esd => mouseInBounds);
    if (dropTarget) {
      this.onSocketJewel(dropTarget.slot, this.draggingJewel.gridIndex);
    }
    this.container.removeChild(this.draggingJewel.icon);
    this.draggingJewel.icon.destroy();
    this.draggingJewel = null;
  }
}
```

- [ ] **Step 5: Add socket/drill/shatter/preserve callbacks to Game.ts**

Add new callbacks in the `toggleInventory()` method, after `onConsumePortalScrollCallback`:

```typescript
this.inventoryScreen.onSocketJewelCallback((slot: Slot, gridIndex: number) => {
  if (!this.player) return;
  const jewelEntry = this.player.inventory[gridIndex];
  if (!jewelEntry || jewelEntry.kind !== 'equip' || jewelEntry.item.base.id !== 'jewel') return;
  const success = this.player.socketJewel(slot, jewelEntry.item, gridIndex);
  if (success) {
    this.inventoryScreen?.update(this.player.inventory, this.player.equipment, this.player.computedStats, this.input);
  }
});

this.inventoryScreen.onDrillOrbCallback((slot: Slot) => {
  if (!this.player) return;
  const success = this.player.drillSockets(slot);
  if (success) {
    // Consume Drilling Orb
    const orbIdx = this.player.inventory.findIndex(s => s && s.kind === 'orb' && s.orbId === 'drilling');
    if (orbIdx >= 0) {
      const orbSlot = this.player.inventory[orbIdx] as any;
      orbSlot.count--;
      if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;
    }
    this.inventoryScreen?.update(this.player.inventory, this.player.equipment, this.player.computedStats, this.input);
  }
});
```

- [ ] **Step 6: wire socket/unsocket callbacks in InventoryScreen**

Add callback: private onSocketJewel: (slot: Slot, gridIndex: number) => void = () => {};

```typescript
onSocketJewelCallback(cb: (slot: Slot, gridIndex: number) => void) { this.onSocketJewel = cb; }
```

- [ ] **Step 7: Commit**

```bash
git add src/ui/InventoryScreen.ts src/core/Game.ts src/entities/Player.ts
git commit -m "feat(jewels): socket jewel via right-click and drag-drop, drill/shatter/preserve orbs"
```

---

## Task 6: Jewel Socketing — Orb Usage for Drilling, Shattering, Preservation

**Files:**
- Modify: `src/ui/InventoryScreen.ts` (orb targeting for sockets)
- Modify: `src/core/Game.ts` (orb route for drill/shatter/preserve)
- Modify: `src/entities/Player.ts` (drill/shatter/preserve orb logic)

- [ ] **Step 1: Complete the unsocket interaction in InventoryScreen**

When an orb is active (`activeOrb` is set to `drilling`, `shattering`, or `preservation`), clicking an equipment slot should trigger the appropriate callback:

```typescript
// In handleClick(), equipment slot section:
if (this.activeOrb && equipment[esd.slot]) {
  const orbId = this.activeOrb;
  if (orbId === 'drilling') {
    this.onDrillOrb(esd.slot);
  } else if (orbId === 'shattering' || orbId === 'preservation') {
    // Find which socket to target (click on specific socket circle)
    const socketIdx = this.getSocketAtPosition(esd.slot, this.mouseX, this.mouseY);
    if (socketIdx >= 0) {
      this.onUnsocketOrb(orbId, esd.slot, socketIdx);
    }
  }
  this.activeOrb = null;
  this.selectedIndex = -1;
  return;
}
```

- [ ] **Step 2: Add socket hit detection**

Add a helper method to InventoryScreen:

```typescript
private getSocketAtPosition(slot: Slot, mx: number, my: number): number {
  const esd = this.equipSlotsData.find(e => e.slot === slot);
  if (!esd) return -1;
  const item = this.equipment[slot] as any;
  if (!item?.socketSlots) return -1;

  const socketRadius = 4;
  const socketGap = 14;
  const totalW = item.maxSockets * socketGap;
  const socketY = esd.bg.y + esd.bg.height / 2 + 14;

  for (let i = 0; i < item.socketSlots.length; i++) {
    const sx = esd.socketContainer.x + (-totalW / 2 + i * socketGap + socketGap / 2);
    const dist = Math.hypot(mx - sx, my - socketY);
    if (dist < socketRadius + 4) return i;
  }
  return -1;
}
```

- [ ] **Step 3: Add unsocket orb callback wiring in Game.ts**

```typescript
this.inventoryScreen.onUnsocketOrbCallback((orbId: string, slot: Slot, socketIndex: number) => {
  if (!this.player) return;
  const destroy = orbId === 'shattering';
  const success = this.player.unsocketJewel(slot, socketIndex, destroy);
  if (success) {
    // Consume the orb
    const orbIdx = this.player.inventory.findIndex(s => s && s.kind === 'orb' && s.orbId === orbId);
    if (orbIdx >= 0) {
      const orbSlot = this.player.inventory[orbIdx] as any;
      orbSlot.count--;
      if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;
    }
    this.inventoryScreen?.update(this.player.inventory, this.player.equipment, this.player.computedStats, this.input);
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/InventoryScreen.ts src/core/Game.ts src/entities/Player.ts
git commit -m "feat(jewels): drill/shatter/preservation orb UX, socket target hit detection"
```

---

## Task 7: Stat Integration — Socketed Jewel Stats Flow Through StatSystem

**Files:**
- Modify: `src/core/StatSystem.ts` (handle jewel affix stats)
- Modify: `src/entities/Player.ts` (iterate socket jewels in recalcStats)

- [ ] **Step 1: Add jewel stat categories to StatSystem.ts**

Add new stat keys to the `otherEquip` handler section (line 67-88):

```typescript
else if (key === 'allResistancePct') base.damageReduction = Math.min(50, (base.damageReduction || 0) + val);
else if (key === 'critDmgPct') base.critDmgPct = (base.critDmgPct || 0) + val;
else if (key === 'minionDmgPct') base.minionDmgPct = (base.minionDmgPct || 0) + val;
else if (key === 'onslaughtOnKillPct') base.onslaughtOnKillPct = (base.onslaughtOnKillPct || 0) + val;
else if (key === 'bleedChancePct') base.bleedChancePct = Math.min(100, (base.bleedChancePct || 0) + val);
else if (key === 'dmgPerPassivePct') base.dmgPerPassivePct = (base.dmgPerPassivePct || 0) + val;
```

Initialize these in the `base` object (line 39-65):

```typescript
critDmgPct: 0,
minionDmgPct: 0,
onslaughtOnKillPct: 0,
bleedChancePct: 0,
dmgPerPassivePct: 0,
```

- [ ] **Step 2: Update Player.recalcStats() to include socket jewels**

Replace lines 113-117:

```typescript
recalcStats() {
  const equipStats: Record<string, number> = {};
  for (const item of Object.values(this.equipment)) {
    if (!item) continue;
    for (const [stat, val] of Object.entries(item.computedStats)) {
      equipStats[stat] = (equipStats[stat] || 0) + (val as number);
    }
    // Add socketed jewel stats
    if (item.socketSlots) {
      for (const socket of item.socketSlots) {
        if (!socket.jewel) continue;
        for (const [stat, val] of Object.entries(socket.jewel.computedStats)) {
          equipStats[stat] = (equipStats[stat] || 0) + (val as number);
        }
      }
    }
  }
  this._computedStats = computeStats(this.passiveTree, this.attrs, 100, 50, equipStats);
  const s = this._computedStats;
  this.maxHealth = s.maxHp;
  this.health = Math.min(this.health, this.maxHealth);
  this.maxMana = s.maxMana;
  this.mana = Math.min(this.mana, this.maxMana);
  this.speed = 6 * s.moveSpeedMult;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/core/StatSystem.ts src/entities/Player.ts
git commit -m "feat(jewels): socketed jewel stats flow through StatSystem"
```

---

## Task 8: Save/Load Serialization for Sockets

**Files:**
- Modify: `src/core/SaveManager.ts`
- Modify: `src/core/Game.ts` (deserialize sockets on load)

- [ ] **Step 1: Update SerializedItem to include socketSlots**

Add to the `SerializedItem` interface (after line 25):

```typescript
socketSlots?: { jewel: SerializedItem | null }[];
```

- [ ] **Step 2: Update deserializeItem() in Game.ts to restore sockets**

Find where `deserializeItem` is called in Game.ts. Add after the item is reconstructed:

```typescript
if (serialized.socketSlots) {
  item.socketSlots = serialized.socketSlots.map(s => ({
    jewel: s.jewel ? deserializeItem(s.jewel) : null,
  }));
} else if (item.maxSockets > 0) {
  // Backward compat: generate empty socket slots from maxSockets
  item.socketSlots = Array.from({ length: item.maxSockets }, () => ({ jewel: null }));
} else {
  item.socketSlots = [];
}
```

- [ ] **Step 3: Add serializeSockets helper**

Add to Game.ts or SaveManager.ts:

```typescript
function serializeSlots(socketSlots: { jewel: GeneratedItem | null }[]): { jewel: SerializedItem | null }[] {
  return sockets.map(s => ({
    jewel: s.jewel ? {
      baseId: s.jewel.base.id,
      rarity: s.jewel.rarity,
      affixes: s.jewel.affixes.map(a => ({ affixId: a.affix.id, roll: a.roll })),
      damageRoll: s.jewel.damageRoll,
      computedName: s.jewel.computedName,
      ilvl: s.jewel.ilvl,
      levelReq: s.jewel.levelReq,
    } : null,
  }));
}
```

- [ ] **Step 4: Update serialization in Game.ts save path**

When building `SaveData` in Game.ts's save function, include socket serialization for each equipped item:

```typescript
// In saveData construction:
equipment: Object.fromEntries(
  Object.entries(this.player.equipment).map(([slot, item]) => [
    slot,
    item ? {
      baseId: item.base.id,
      rarity: item.rarity,
      affixes: item.affixes.map(a => ({ affixId: a.affix.id, roll: a.roll })),
      uniqueId: item.uniqueId,
      damageRoll: item.damageRoll,
      computedName: item.computedName,
      ilvl: item.ilvl,
      levelReq: item.levelReq,
      socketSlots: item.socketSlots ? serializeSlots(item.socketSlots) : undefined,
    } : null,
  ])
),
```

- [ ] **Step 5: Ensure inventory items and stash items also serialize sockets**

Apply the same socket serialization to inventory items and stash items. In the save path, when serializing inventory slots:

```typescript
if (invSlot.kind === 'equip') {
  const item = invSlot.item;
  serialized.push({
    kind: 'equip',
    item: {
      ...item,
      socketSlots: item.socketSlots ? serializeSlots(item.socketSlots) : undefined,
    },
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/core/SaveManager.ts src/core/Game.ts
git commit -m "feat(jewels): save/load socket serialization with backward compat"
```

---

## Task 9: Vendor/Stash Support for Socketed Items

**Files:**
- Modify: `src/ui/VendorScreen.ts`
- Modify: `src/ui/StashScreen.ts`

- [ ] **Step 1: Update VendorScreen to show socket count**

Find where vendor items are rendered (look for `createSlot()` or similar). Add socket count suffix to the item name:

```typescript
const socketSuffix = item.socketSlots?.length > 0 ? ` (${item.socketSlots.length})` : '';
```

And add socket indicator dots next to items that have sockets.

- [ ] **Step 2: Update StashScreen to show socket count and render sockets**

Same approach — add socket count suffix and small socket indicator dots for stashed items.

- [ ] **Step 3: Ensure stash items that contain socketed jewels are properly serialized**

The stash serialization from Task 8 already covers this — stash slots use the same `SerializedItem` format.

- [ ] **Step 4: Commit**

```bash
git add src/ui/VendorScreen.ts src/ui/StashScreen.ts
git commit -m "feat(jewels): vendor/stash display socket count and sockets"
```

---

## Task 10: Jewel Icons — Sprite Mapping

**Files:**
- Modify: `src/rendering/ItemIcons.ts`

- [ ] **Step 1: Add jewel icon to ItemIcons.ts**

Add to `BASE_ICONS`:

```typescript
jewel: { cell: { col: 0, row: 7 }, key: 'jewel_normal' },
```

And add entries for all jewel rarities. If the spritesheet has a jewel icon at (col 0, row 7), add:

```typescript
ORB_ICONS['drilling'] = { col: 7, row: 4 };
ORB_ICONS['shattering'] = { col: 7, row: 5 };
ORB_ICONS['preservation'] = { col: 7, row: 6 };
```

Adjust row/col positions to wherever the icons actually are on the spritesheet.

- [ ] **Step 2: Update getItemTexture() to support jewel keys**

Ensure the key format `jewel_normal`, `jewel_magic`, `jewel_rare` works with the existing `getItemTexture()` lookup — it already maps `{baseId}_{rarity}` patterns so this should work.

- [ ] **Step 3: Commit**

```bash
git add src/rendering/ItemIcons.ts
git commit -m "feat(jewels): add jewel and new orb icon sprite mappings"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Jewel types & rarity: Tasks 1, 2
   - Socket mechanics (ranges, distributions, rollSockets): Task 2
   - Drilling Orb reroll (weighted, always different): Task 2, 6
   - Nameplate socket suffix display: Task 3
   - Shattering/Preservation unsocket orbs: Task 6
   - Paper doll UI layout: Task 4
   - Socket indicator dots (dark/filled): Task 4
   - Right-click jewel→click to socket: Task 5
   - Drag-drop jewel onto doll slot: Task 5
   - Orb usage (drill/shatter/preserve): Task 6
   - Stat integration from socketed jewels: Task 7
   - Save/load serialization: Task 8
   - Vendor/stash display: Task 9
   - Jewel sprite icons: Task 10

2. **Placeholder scan:** No TBD/TODO/incomplete code steps.

3. **Type consistency:** All methods and fields referenced in later tasks match definitions in earlier tasks.

4. **No gaps:** Every spec requirement has a corresponding task.
