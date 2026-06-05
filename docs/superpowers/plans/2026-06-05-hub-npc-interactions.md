# Hub NPC Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add E-key proximity interactions for Vendor (buy/sell) and Stash (4 tabbed storage) NPCs in the hub.

**Architecture:** Vendor stock is generated on hub zone entry via `VendorManager`, stored in-memory (not serialized), and presented through a `VendorScreen` overlay. Stash uses 4 × 60-slot tabs serialized in `SaveData` and presented through a `StashScreen` overlay. Both follow the inventory screen pattern (full-screen overlay, click-to-transfer, Escape to close).

**Tech Stack:** TypeScript, PixiJS 7, localStorage saves

---

## File Structure

**New files:**
- `src/core/VendorManager.ts` — vendor stock generation, pricing logic
- `src/ui/VendorScreen.ts` — vendor buy/sell overlay
- `src/ui/StashScreen.ts` — stash deposit/withdraw overlay (4 tabs, 60 slots each)

**Modified files:**
- `src/core/ItemGenerator.ts` — add `generateVendorItem()` export
- `src/core/SaveManager.ts` — add `StashTab` + `stashData` to `SaveData`
- `src/core/Game.ts` — proximity detection, screen wiring, vendor stock on hub entry
- `memory.md` — document completed phase

---

### Task 1: Add generateVendorItem to ItemGenerator.ts

**Files:**
- Modify: `src/core/ItemGenerator.ts`

- [ ] **Step 1: Add generateVendorItem function**

Add this function at the end of `src/core/ItemGenerator.ts` (before any existing exports):

```typescript
export function generateVendorItem(playerLevel: number, weighting: { normal: number; magic: number; rare: number; unique: number }): GeneratedItem {
  const rarityRoll = Math.random() * 100;
  let rarity: Rarity = 'normal';
  if (rarityRoll > 100 - weighting.unique) rarity = 'unique';
  else if (rarityRoll > 100 - weighting.unique - weighting.rare) rarity = 'rare';
  else if (rarityRoll > 100 - weighting.unique - weighting.rare - weighting.magic) rarity = 'magic';

  const base = ITEM_BASES[Math.floor(Math.random() * ITEM_BASES.length)];
  const ilvl = playerLevel;
  const maxTier = Math.min(3, Math.ceil(playerLevel / 4));
  const damageRoll = base.damageRange ? base.damageRange.min + Math.floor(Math.random() * (base.damageRange.max - base.damageRange.min + 1)) : 0;

  if (rarity === 'unique') {
    const unique = UNIQUE_ITEMS[Math.floor(Math.random() * UNIQUE_ITEMS.length)];
    if (unique.baseId !== base.id) return generateVendorItem(playerLevel, weighting);
    const stats: Record<string, number> = { ...base.innateStats };
    if (damageRoll > 0) stats.damage = damageRoll;
    const mappedAffixes = unique.affixes.map(a => {
      const affix = AFFIXES.find(af => af.id === a.affixId)!;
      stats[affix.stat] = (stats[affix.stat] || 0) + a.roll;
      return { affix, roll: a.roll };
    });
    return {
      id: `vendor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      base, rarity: 'unique', affixes: mappedAffixes,
      uniqueId: unique.id, damageRoll, computedName: unique.name,
      computedStats: stats, ilvl, levelReq: unique.levelReq,
    };
  }

  const maxAffixes = rarity === 'rare' ? 4 + Math.floor(Math.random() * 3) : rarity === 'magic' ? 2 : 0;
  const prefixes = AFFIXES.filter(a => a.type === 'prefix' && a.tier <= maxTier);
  const suffixes = AFFIXES.filter(a => a.type === 'suffix' && a.tier <= maxTier);
  const usedStats = new Set<string>();
  const affixes: { affix: ItemAffix; roll: number }[] = [];
  const stats: Record<string, number> = { ...base.innateStats };
  if (damageRoll > 0) stats.damage = damageRoll;

  let prefixCount = 0, suffixCount = 0;
  const targetPrefix = Math.ceil(maxAffixes / 2);
  const targetSuffix = Math.floor(maxAffixes / 2);
  for (let i = 0; i < 50 && (prefixCount < targetPrefix || suffixCount < targetSuffix); i++) {
    const isPrefix = prefixCount < targetPrefix && (suffixCount >= targetSuffix || Math.random() < 0.5);
    const pool = isPrefix ? prefixes : suffixes;
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const pick = shuffled.find(a => !usedStats.has(a.stat));
    if (!pick) continue;
    usedStats.add(pick.stat);
    const roll = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
    affixes.push({ affix: pick, roll });
    stats[pick.stat] = (stats[pick.stat] || 0) + roll;
    if (isPrefix) prefixCount++; else suffixCount++;
  }

  const tierCounts: Record<number, number> = {};
  for (const a of affixes) tierCounts[a.affix.tier] = (tierCounts[a.affix.tier] || 0) + 1;
  const highestTier = Math.max(...Object.keys(tierCounts).map(Number), 1);
  const levelReq = highestTier * 4;
  const prefixNames = affixes.filter(a => a.affix.type === 'prefix').map(a => a.affix.name);
  const suffixNames = affixes.filter(a => a.affix.type === 'suffix').map(a => a.affix.name);
  const nameParts = [base.name, ...prefixNames, ...suffixNames];
  const computedName = rarity === 'normal' ? base.name : `${prefixNames.join(' ')} ${base.name}${suffixNames.length ? ' ' + suffixNames.join(' ') : ''}`;

  return {
    id: `vendor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    base, rarity, affixes, damageRoll, computedName, computedStats: stats,
    ilvl, levelReq,
  };
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/core/ItemGenerator.ts
git commit -m "feat: add generateVendorItem to ItemGenerator"
```

---

### Task 2: Create VendorManager

**Files:**
- Create: `src/core/VendorManager.ts`

- [ ] **Step 1: Create VendorManager.ts**

```typescript
import { GeneratedItem, generateVendorItem } from './ItemGenerator';
import { ITEM_BASES } from './ItemDefs';

export interface VendorStockItem {
  id: string;
  item: GeneratedItem;
  buyPrice: number;
}

const BASE_PRICES: Record<string, number> = {
  sword: 5, bow: 5, body: 8, helmet: 6, boots: 6, ring: 12, amulet: 15,
};

const RARITY_MULT: Record<string, number> = {
  normal: 1, magic: 2, rare: 5, unique: 15,
};

export function calculateSellPrice(item: GeneratedItem): number {
  const base = BASE_PRICES[item.base.id] || 5;
  const rarityMult = RARITY_MULT[item.rarity] || 1;
  const affixBonus = item.affixes.reduce((sum, a) => sum + a.affix.tier * 2, 0);
  return base * rarityMult + affixBonus;
}

export function generateVendorStock(playerLevel: number): VendorStockItem[] {
  const count = 8 + Math.floor(Math.random() * 5);
  const stock: VendorStockItem[] = [];
  for (let i = 0; i < count; i++) {
    const weighting = { normal: 40, magic: 40, rare: 15, unique: 5 };
    const item = generateVendorItem(playerLevel, weighting);
    const sellPrice = calculateSellPrice(item);
    stock.push({ id: `vs_${Date.now()}_${i}`, item, buyPrice: sellPrice * 3 });
  }
  return stock;
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/core/VendorManager.ts
git commit -m "feat: create VendorManager with stock generation and pricing"
```

---

### Task 3: Create VendorScreen

**Files:**
- Create: `src/ui/VendorScreen.ts`

- [ ] **Step 1: Create VendorScreen.ts**

```typescript
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { VendorStockItem, calculateSellPrice } from '../core/VendorManager';
import { InventorySlot } from '../entities/Player';
import { GeneratedItem } from '../core/ItemGenerator';
import { Logger } from '../core/Logger';

const SLOT = 50;
const GAP = 6;
const COLS = 5;

export class VendorScreen {
  container: Container;
  private onBuy: ((stockItem: VendorStockItem) => void) | null = null;
  private onSell: ((gridIndex: number) => void) | null = null;
  private onClose: (() => void) | null = null;
  private playerGold = 0;
  private messageText?: Text;
  private messageTimer = 0;
  private stockSlots: Container[] = [];
  private invSlots: Container[] = [];

  constructor(
    screenWidth: number, screenHeight: number,
    stock: VendorStockItem[],
    inventory: InventorySlot[],
    gold: number,
  ) {
    this.playerGold = gold;
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Vendor', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 32, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = 20;
    this.container.addChild(title);

    // Gold display
    const goldText = new Text(`Gold: ${gold}`, new TextStyle({
      fontFamily: 'monospace', fontSize: 16, fill: '#ffcc44',
    }));
    goldText.x = screenWidth / 2 - 60;
    goldText.y = 65;
    this.container.addChild(goldText);

    // Column headers
    const invLabel = new Text('Your Items', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    invLabel.anchor.set(0.5, 0);
    invLabel.x = screenWidth * 0.25;
    invLabel.y = 100;
    this.container.addChild(invLabel);

    const shopLabel = new Text('Shop', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    shopLabel.anchor.set(0.5, 0);
    shopLabel.x = screenWidth * 0.7;
    shopLabel.y = 100;
    this.container.addChild(shopLabel);

    // Player inventory (left side, 5x6)
    this.renderInventoryGrid(screenWidth, inventory);

    // Vendor stock (right side, dynamic grid)
    this.renderStockGrid(screenWidth, stock);

    // Message text (hidden by default)
    this.messageText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ffcc44',
      stroke: '#000', strokeThickness: 2,
    }));
    this.messageText.anchor.set(0.5);
    this.messageText.x = screenWidth / 2;
    this.messageText.y = screenHeight - 40;
    this.messageText.visible = false;
    this.container.addChild(this.messageText);

    // Close button hint
    const closeHint = new Text('Press ESC to close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#4a4a5a',
    }));
    closeHint.anchor.set(0.5);
    closeHint.x = screenWidth / 2;
    closeHint.y = screenHeight - 20;
    this.container.addChild(closeHint);

    Logger.log('ui', 'Vendor screen opened');
  }

  private renderInventoryGrid(screenWidth: number, inventory: InventorySlot[]) {
    this.invSlots = [];
    const startX = screenWidth * 0.25 - ((COLS * (SLOT + GAP)) / 2);
    const startY = 130;
    for (let i = 0; i < inventory.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const slot = this.createSlot(x, y, inventory[i]);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onSell?.(idx));
      this.container.addChild(slot);
      this.invSlots.push(slot);
    }
  }

  private renderStockGrid(screenWidth: number, stock: VendorStockItem[]) {
    this.stockSlots = [];
    const stockCols = 4;
    const startX = screenWidth * 0.7 - ((stockCols * (SLOT + GAP)) / 2);
    const startY = 130;
    for (let i = 0; i < stock.length; i++) {
      const col = i % stockCols;
      const row = Math.floor(i / stockCols);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const item = stock[i];
      const slot = this.createSlot(x, y, { kind: 'equip', item: item.item });
      const priceText = new Text(`${item.buyPrice}g`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#ffcc44',
      }));
      priceText.x = x + 2;
      priceText.y = y + SLOT - 12;
      this.container.addChild(priceText);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onBuy?.(stock[idx]));
      this.container.addChild(slot);
      this.stockSlots.push(slot);
    }
  }

  private createSlot(x: number, y: number, slot: InventorySlot): Container {
    const c = new Container();
    const bg = new Graphics();
    if (!slot) {
      bg.beginFill(0x111122);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
    } else if (slot.kind === 'orb') {
      bg.beginFill(0x1a1a2e);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
      bg.lineStyle(1, 0x44aacc);
      bg.drawRect(0, 0, SLOT, SLOT);
    } else {
      const rarityColors: Record<string, number> = { normal: 0x444444, magic: 0x4444cc, rare: 0xcc8844, unique: 0xcc4444 };
      bg.beginFill(0x1a1a2e);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
      bg.lineStyle(2, rarityColors[slot.item.rarity] || 0x444444);
      bg.drawRect(0, 0, SLOT, SLOT);
    }
    c.addChild(bg);
    c.x = x;
    c.y = y;
    return c;
  }

  onBuyCallback(cb: (item: VendorStockItem) => void) { this.onBuy = cb; }
  onSellCallback(cb: (gridIndex: number) => void) { this.onSell = cb; }
  onCloseCallback(cb: () => void) { this.onClose = cb; }

  showMessage(msg: string) {
    if (this.messageText) {
      this.messageText.text = msg;
      this.messageText.visible = true;
      this.messageTimer = 120;
    }
  }

  update() {
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer <= 0 && this.messageText) {
        this.messageText.visible = false;
      }
    }
  }

  refreshGold(gold: number) {
    this.playerGold = gold;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/ui/VendorScreen.ts
git commit -m "feat: create VendorScreen UI"
```

---

### Task 4: Create StashScreen

**Files:**
- Create: `src/ui/StashScreen.ts`

- [ ] **Step 1: Create StashScreen.ts**

```typescript
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InventorySlot } from '../entities/Player';
import { StashTab } from '../core/SaveManager';
import { Logger } from '../core/Logger';

const SLOT = 50;
const GAP = 6;
const INV_COLS = 5;
const STASH_COLS = 6;
const STASH_ROWS = 10;

export class StashScreen {
  container: Container;
  private onDeposit: ((invIndex: number) => void) | null = null;
  private onWithdraw: ((tabIndex: number, slotIndex: number) => void) | null = null;
  private onRenameTab: ((tabIndex: number, name: string) => void) | null = null;
  private onClose: (() => void) | null = null;
  private activeTab = 0;
  private tabs: StashTab[];
  private tabButtons: Container[] = [];
  private stashSlotContainers: Container[] = [];
  private inventory: InventorySlot[] = [];
  private editingTab: number | null = null;

  constructor(
    screenWidth: number, screenHeight: number,
    tabs: StashTab[],
    inventory: InventorySlot[],
  ) {
    this.tabs = tabs;
    this.inventory = inventory;
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Stash', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 32, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = 20;
    this.container.addChild(title);

    // Column headers
    const invLabel = new Text('Inventory', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    invLabel.anchor.set(0.5, 0);
    invLabel.x = screenWidth * 0.2;
    invLabel.y = 70;
    this.container.addChild(invLabel);

    const stashLabel = new Text('Stash', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    stashLabel.anchor.set(0.5, 0);
    stashLabel.x = screenWidth * 0.6;
    stashLabel.y = 60;
    this.container.addChild(stashLabel);

    // Tab buttons
    this.renderTabButtons(screenWidth);

    // Stash grid (right side, 6x10)
    this.renderStashGrid(screenWidth);

    // Player inventory (left side, 5x6)
    this.renderInventoryGrid(screenWidth);

    const closeHint = new Text('Press ESC to close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#4a4a5a',
    }));
    closeHint.anchor.set(0.5);
    closeHint.x = screenWidth / 2;
    closeHint.y = screenHeight - 20;
    this.container.addChild(closeHint);

    Logger.log('ui', 'Stash screen opened');
  }

  private renderTabButtons(screenWidth: number) {
    this.tabButtons = [];
    const startX = screenWidth * 0.6 - 155;
    for (let i = 0; i < 4; i++) {
      const btn = new Container();
      const bg = new Graphics();
      bg.beginFill(i === this.activeTab ? 0x2a2a4a : 0x1a1a2e);
      bg.drawRoundedRect(0, 0, 70, 24, 4);
      bg.endFill();
      bg.lineStyle(1, i === this.activeTab ? 0x6a4a2a : 0x3a3a4a);
      bg.drawRoundedRect(0, 0, 70, 24, 4);
      const txt = new Text(this.tabs[i]?.name || `Stash ${i + 1}`, new TextStyle({
        fontFamily: 'monospace', fontSize: 11, fill: '#c0a060',
      }));
      txt.anchor.set(0.5);
      txt.x = 35;
      txt.y = 12;
      btn.addChild(bg, txt);
      btn.x = startX + i * 75;
      btn.y = 85;
      const idx = i;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => this.selectTab(idx));
      // Double-click to rename
      let lastClick = 0;
      btn.on('pointerdown', () => {
        const now = Date.now();
        if (now - lastClick < 400 && idx === this.activeTab) {
          this.startRename(idx);
        }
        lastClick = now;
      });
      this.container.addChild(btn);
      this.tabButtons.push(btn);
    }
  }

  private startRename(tabIndex: number) {
    this.editingTab = tabIndex;
    // Inline editing via prompt (simple approach)
    const currentName = this.tabs[tabIndex]?.name || `Stash ${tabIndex + 1}`;
    const newName = prompt('Rename stash tab:', currentName);
    if (newName && newName.trim().length > 0 && newName !== currentName) {
      this.tabs[tabIndex].name = newName.trim();
      this.onRenameTab?.(tabIndex, newName.trim());
      this.refreshTabButtons();
    }
    this.editingTab = null;
  }

  private refreshTabButtons() {
    for (const btn of this.tabButtons) btn.destroy({ children: true });
    this.tabButtons = [];
    this.renderTabButtons(this.container.width);
  }

  private selectTab(index: number) {
    this.activeTab = index;
    this.refreshStashGrid();
    this.refreshTabButtons();
  }

  private renderStashGrid(screenWidth: number) {
    this.stashSlotContainers = [];
    const startX = screenWidth * 0.6 - ((STASH_COLS * (SLOT + GAP)) / 2);
    const startY = 120;
    const slots = this.tabs[this.activeTab]?.slots || [];
    for (let i = 0; i < STASH_COLS * STASH_ROWS; i++) {
      const col = i % STASH_COLS;
      const row = Math.floor(i / STASH_COLS);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const slot = this.createSlot(x, y, slots[i] || null);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onWithdraw?.(this.activeTab, idx));
      this.container.addChild(slot);
      this.stashSlotContainers.push(slot);
    }
  }

  private renderInventoryGrid(screenWidth: number) {
    const startX = screenWidth * 0.2 - ((INV_COLS * (SLOT + GAP)) / 2);
    const startY = 100;
    for (let i = 0; i < this.inventory.length; i++) {
      const col = i % INV_COLS;
      const row = Math.floor(i / INV_COLS);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const slot = this.createSlot(x, y, this.inventory[i]);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onDeposit?.(idx));
      this.container.addChild(slot);
    }
  }

  private createSlot(x: number, y: number, slot: InventorySlot): Container {
    const c = new Container();
    const bg = new Graphics();
    if (!slot) {
      bg.beginFill(0x111122);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
    } else if (slot.kind === 'orb') {
      bg.beginFill(0x1a1a2e);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
      bg.lineStyle(1, 0x44aacc);
      bg.drawRect(0, 0, SLOT, SLOT);
    } else {
      const rarityColors: Record<string, number> = { normal: 0x444444, magic: 0x4444cc, rare: 0xcc8844, unique: 0xcc4444 };
      bg.beginFill(0x1a1a2e);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
      bg.lineStyle(2, rarityColors[slot.item.rarity] || 0x444444);
      bg.drawRect(0, 0, SLOT, SLOT);
    }
    c.addChild(bg);
    c.x = x;
    c.y = y;
    return c;
  }

  private refreshStashGrid() {
    for (const c of this.stashSlotContainers) c.destroy({ children: true });
    this.stashSlotContainers = [];
    this.renderStashGrid(this.container.width);
  }

  onDepositCallback(cb: (invIndex: number) => void) { this.onDeposit = cb; }
  onWithdrawCallback(cb: (tabIndex: number, slotIndex: number) => void) { this.onWithdraw = cb; }
  onRenameTabCallback(cb: (tabIndex: number, name: string) => void) { this.onRenameTab = cb; }
  onCloseCallback(cb: () => void) { this.onClose = cb; }

  update() {}

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/ui/StashScreen.ts
git commit -m "feat: create StashScreen UI with 4 tabs"
```

---

### Task 5: Add stash data to SaveManager

**Files:**
- Modify: `src/core/SaveManager.ts`

- [ ] **Step 1: Add StashTab interface and stashData to SaveData**

Add after the `SlotMeta` interface:

```typescript
export interface StashTab {
  name: string;
  slots: (SerializedInventorySlot | null)[];
}
```

Add to `SaveData` interface (inside `player` block — or as a top-level field. Use top-level for clarity):

Add after the `player` field in `SaveData`:

```typescript
  stashData: {
    tabs: StashTab[];
  };
```

- [ ] **Step 2: Export StashTab type**

The `StashTab` interface is already exported in step 1. No additional change needed.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/core/SaveManager.ts
git commit -m "feat: add stash data to SaveData"
```

---

### Task 6: Wire everything in Game.ts

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add imports**

Add to the import section:

```typescript
import { VendorScreen } from '../ui/VendorScreen';
import { StashScreen } from '../ui/StashScreen';
import { generateVendorStock, VendorStockItem, calculateSellPrice } from '../core/VendorManager';
import { StashTab } from '../core/SaveManager';
```

- [ ] **Step 2: Add state fields**

Add to the Game class fields (near other screen state like `inventoryOpen`):

```typescript
  private vendorOpen = false;
  private stashOpen = false;
  private vendorScreen?: VendorScreen;
  private stashScreen?: StashScreen;
  private vendorStock: VendorStockItem[] = [];
  private vendorNpcPos = { x: 2900, y: 1380 };
  private stashNpcPos = { x: 3500, y: 1380 };
  private interactPrompt?: Text;
  private interactPromptTimer = 0;
```

- [ ] **Step 3: Add method to generate vendor stock on hub entry**

In `buildCurrentZoneRoom()`, inside the `if (zone.id === 'hub')` block (after the animated NPC sprite code), add:

```typescript
      // Generate vendor stock on hub entry
      this.vendorStock = generateVendorStock(this.player.level);
```

- [ ] **Step 4: Add proximity detection + E key handling in updateGameplay**

Add before the auto-save check (or after the chest interaction code). Find the chest interaction section (around line 1168-1178) and add after it:

```typescript
      // Vendor proximity
      const toVendorX = this.vendorNpcPos.x - this.player.x;
      const toVendorY = this.vendorNpcPos.y - this.player.y;
      const vendorDist = Math.hypot(toVendorX, toVendorY);
      const nearVendor = vendorDist < 150;
      if (nearVendor && !this.vendorOpen && !this.stashOpen) {
        if (!this.interactPrompt) {
          this.interactPrompt = new Text('Press E to trade', new TextStyle({
            fontFamily: 'monospace', fontSize: 14, fill: '#ffff88',
            stroke: '#000', strokeThickness: 2,
          }));
          this.interactPrompt.anchor.set(0.5);
          this.interactPrompt.x = this.player.x;
          this.interactPrompt.y = this.player.y - 40;
          this.gameContainer!.addChild(this.interactPrompt);
        }
        this.interactPrompt.x = this.player.x;
        this.interactPrompt.y = this.player.y - 40;
        if (this.input.isKeyDown('KeyE') && !this.wasEKeyDown) {
          this.wasEKeyDown = true;
          this.openVendor();
        }
      } else if (!nearVendor && this.interactPrompt && !this.stashOpen) {
        this.gameContainer!.removeChild(this.interactPrompt);
        this.interactPrompt.destroy();
        this.interactPrompt = undefined;
      }

      // Stash proximity
      const toStashX = this.stashNpcPos.x - this.player.x;
      const toStashY = this.stashNpcPos.y - this.player.y;
      const stashDist = Math.hypot(toStashX, toStashY);
      const nearStash = stashDist < 150;
      if (nearStash && !this.stashOpen && !this.vendorOpen) {
        if (!this.interactPrompt) {
          this.interactPrompt = new Text('Press E to access stash', new TextStyle({
            fontFamily: 'monospace', fontSize: 14, fill: '#ffff88',
            stroke: '#000', strokeThickness: 2,
          }));
          this.interactPrompt.anchor.set(0.5);
          this.interactPrompt.x = this.player.x;
          this.interactPrompt.y = this.player.y - 40;
          this.gameContainer!.addChild(this.interactPrompt);
        }
        this.interactPrompt.x = this.player.x;
        this.interactPrompt.y = this.player.y - 40;
        if (this.input.isKeyDown('KeyE') && !this.wasEKeyDown) {
          this.wasEKeyDown = true;
          this.openStash();
        }
      } else if (!nearStash && this.interactPrompt && !this.vendorOpen) {
        this.gameContainer!.removeChild(this.interactPrompt);
        this.interactPrompt.destroy();
        this.interactPrompt = undefined;
      }
```

Also ensure `wasEKeyDown` is declared in the class fields. Check if it exists already - if not, add it near the other key-down tracking fields:

```typescript
  private wasEKeyDown = false;
```

Look for the existing key fields (around line 89-93 in the current file), and add `wasEKeyDown` there if it doesn't exist.

- [ ] **Step 5: Add vendor screen open/close methods**

Add these methods to the Game class:

```typescript
  private openVendor() {
    if (this.vendorOpen || !this.player) return;
    this.vendorOpen = true;
    this.vendorScreen = new VendorScreen(SCREEN_WIDTH, SCREEN_HEIGHT, this.vendorStock, this.player.inventory, this.player.gold);
    this.vendorScreen.onBuyCallback((stockItem: VendorStockItem) => {
      if (!this.player) return;
      if (this.player.gold < stockItem.buyPrice) {
        this.vendorScreen?.showMessage('Not enough gold!');
        return;
      }
      const freeSlot = this.player.inventory.findIndex(s => s === null);
      if (freeSlot === -1) {
        this.vendorScreen?.showMessage('Inventory full!');
        return;
      }
      this.player.gold -= stockItem.buyPrice;
      this.player.inventory[freeSlot] = { kind: 'equip', item: { ...stockItem.item, id: `owned_${Date.now()}` } };
      this.vendorStock = this.vendorStock.filter(s => s.id !== stockItem.id);
      this.closeVendor();
      this.openVendor();
      this.vendorScreen?.showMessage('Item purchased!');
    });
    this.vendorScreen.onSellCallback((gridIndex: number) => {
      if (!this.player) return;
      const slot = this.player.inventory[gridIndex];
      if (!slot || slot.kind !== 'equip') return;
      const gold = calculateSellPrice(slot.item);
      this.player.gold += gold;
      this.player.inventory[gridIndex] = null;
      this.closeVendor();
      this.openVendor();
      this.vendorScreen?.showMessage(`Sold for ${gold}g`);
    });
    this.vendorScreen.onCloseCallback(() => this.closeVendor());
    this.app.stage.addChild(this.vendorScreen.container);
  }

  private closeVendor() {
    this.vendorOpen = false;
    if (this.vendorScreen) {
      this.app.stage.removeChild(this.vendorScreen.container);
      this.vendorScreen.destroy();
      this.vendorScreen = undefined;
    }
    if (this.interactPrompt && this.stashOpen === false) {
      this.gameContainer?.removeChild(this.interactPrompt);
      this.interactPrompt.destroy();
      this.interactPrompt = undefined;
    }
  }

  private openStash() {
    if (this.stashOpen || !this.player) return;
    this.stashOpen = true;
    // Ensure stash data exists
    if (!this.currentSaveData?.stashData) {
      this.ensureStashData();
    }
    const tabs = this.currentSaveData?.stashData?.tabs || this.getDefaultStashTabs();
    this.stashScreen = new StashScreen(SCREEN_WIDTH, SCREEN_HEIGHT, tabs, this.player.inventory);
    this.stashScreen.onDepositCallback((invIndex: number) => {
      if (!this.player) return;
      const slot = this.player.inventory[invIndex];
      if (!slot) return;
      const tab = tabs[0]; // always deposit to first tab for simplicity
      const emptyIdx = tab.slots.findIndex(s => s === null);
      if (emptyIdx === -1) {
        this.stashScreen?.showMessage('Stash tab full!');
        return;
      }
      tab.slots[emptyIdx] = slot;
      this.player.inventory[invIndex] = null;
      this.refreshStashAfterAction();
    });
    this.stashScreen.onWithdrawCallback((tabIndex: number, slotIndex: number) => {
      if (!this.player) return;
      const tab = tabs[tabIndex];
      if (!tab) return;
      const slot = tab.slots[slotIndex];
      if (!slot) return;
      const freeIdx = this.player.inventory.findIndex(s => s === null);
      if (freeIdx === -1) {
        this.stashScreen?.showMessage('Inventory full!');
        return;
      }
      this.player.inventory[freeIdx] = slot;
      tab.slots[slotIndex] = null;
      this.refreshStashAfterAction();
    });
    this.stashScreen.onRenameTabCallback((tabIndex: number, name: string) => {
      if (this.currentSaveData?.stashData?.tabs[tabIndex]) {
        this.currentSaveData.stashData.tabs[tabIndex].name = name;
      }
    });
    this.stashScreen.onCloseCallback(() => this.closeStash());
    this.app.stage.addChild(this.stashScreen.container);
  }

  private closeStash() {
    this.stashOpen = false;
    if (this.stashScreen) {
      this.app.stage.removeChild(this.stashScreen.container);
      this.stashScreen.destroy();
      this.stashScreen = undefined;
    }
    if (this.interactPrompt && this.vendorOpen === false) {
      this.gameContainer?.removeChild(this.interactPrompt);
      this.interactPrompt.destroy();
      this.interactPrompt = undefined;
    }
  }

  private refreshStashAfterAction() {
    if (!this.player) return;
    this.closeStash();
    this.openStash();
  }

  private getDefaultStashTabs(): StashTab[] {
    return Array.from({ length: 4 }, (_, i) => ({
      name: `Stash ${i + 1}`,
      slots: new Array(60).fill(null),
    }));
  }

  private ensureStashData() {
    if (!this.currentSaveData) {
      // Create a minimal save data reference if loading from fresh game
      return;
    }
    if (!this.currentSaveData.stashData) {
      (this.currentSaveData as any).stashData = { tabs: this.getDefaultStashTabs() };
    }
  }
```

- [ ] **Step 6: Handle Escape to close vendor/stash screens**

In the key handling section of `updateGameplay()`, find the Escape key handling block. Add vendor/stash close checks before the inventory/tree checks:

Look for the existing Escape key handling (around line 943-960). Modify the block to:

```typescript
      // Escape key handling
      if (this.input.isKeyDown('Escape')) {
        if (!this.wasEscapeKeyDown) {
          if (this.vendorOpen) {
            this.closeVendor();
          } else if (this.stashOpen) {
            this.closeStash();
          } else if (!this.inventoryOpen && !this.treeOpen) {
            this.toggleEscapeMenu();
          } else if (this.inventoryOpen) {
            this.toggleInventory();
          } else if (this.treeOpen) {
            this.toggleTree();
          }
          this.wasEscapeKeyDown = true;
        }
      } else {
        this.wasEscapeKeyDown = false;
      }
```

- [ ] **Step 7: Block gameplay when vendor/stash is open**

After the escape key handling, add a guard similar to the escape menu guard:

```typescript
      if (this.escapeMenuOpen || this.vendorOpen || this.stashOpen) {
        this.escapeMenu?.update();
        this.vendorScreen?.update();
        this.stashScreen?.update();
        return;
      }
```

Wait, this may conflict with existing code. Let me specify more precisely. Find the existing block:

```typescript
      if (this.escapeMenuOpen) {
        this.escapeMenu?.update();
        return;
      }
```

Replace it with:

```typescript
      if (this.escapeMenuOpen || this.vendorOpen || this.stashOpen) {
        this.escapeMenu?.update();
        this.vendorScreen?.update();
        this.stashScreen?.update();
        return;
      }
```

- [ ] **Step 8: Serialize stash data in saveGame**

In the `saveGame()` method, add stash data to the SaveData object. Find the `data` object construction and add inside it:

```typescript
      stashData: this.currentSaveData?.stashData || { tabs: this.getDefaultStashTabs() },
```

Add this after the `zone` block or at the top level of the SaveData object.

- [ ] **Step 9: Add currentSaveData field**

Add to the Game class fields:

```typescript
  private currentSaveData: SaveData | null = null;
```

And in `loadGame()`, after setting the data, store it:

```typescript
    this.currentSaveData = data;
```

And in `saveGame()`, update it after saving. Or better, just read from it when building the save data. The simplest approach: at the end of `saveGame()`, after calling `SaveManager.saveToSlot()`, update the local reference.

Actually, the simplest approach for stash is:
- In `loadGame()`, store the loaded `SaveData` as `this.currentSaveData`
- In `saveGame()`, include `stashData` from `this.currentSaveData` (or default if null)
- After `saveGame()` updates `SaveManager`, the stash data persists in `this.currentSaveData`

Add this near the top-level fields:

```typescript
  private currentSaveData: SaveData | null = null;
```

Set it in `loadGame()` (after `SaveManager.loadFromSlot` returns data):

```typescript
    this.currentSaveData = data;
```

- [ ] **Step 10: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS. Fix any import or type errors.

- [ ] **Step 11: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: wire vendor/stash screens, proximity E-key interaction, stash persistence"
```

---

### Task 7: Update memory.md

**Files:**
- Modify: `memory.md`

- [ ] **Step 1: Add Phase 5m section**

Add after the Phase 5l section and before Phase 6:

```markdown
### Phase 5m — Hub NPC Interactions (completed 2026-06-05)
- **VendorManager** (`src/core/VendorManager.ts`): generates 8–12 random vendor items on hub entry (normal 40%, magic 40%, rare 15%, unique 5%). Pricing: `basePrice × rarityMult + affixTierBonus`. Buy = sell × 3 markup.
- **VendorScreen** (`src/ui/VendorScreen.ts`): full-screen overlay with player inventory (left, 5×6 grid) + vendor stock (right, 4-col grid). Click vendor item to buy (gold check, inventory space check). Click player item to sell. Toast messages for errors ("Not enough gold", "Inventory full"). Closes with Escape.
- **StashScreen** (`src/ui/StashScreen.ts`): full-screen overlay with player inventory (left) + tabbed stash (right). 4 tabs (Stash 1–4), 60 slots each (6×10 grid). Tab buttons switch active tab. Double-click tab name to rename via prompt. Click player item → deposit to active tab. Click stash item → withdraw to inventory. Escape to close.
- **Proximity interaction**: Walking within 150px of Vendor or Stash NPC shows "Press E to [trade/access stash]" prompt. E key opens respective screen. Only one screen open at a time. Movement blocked while screen is open (return guard same as inventory/escape menu).
- **Stash persistence**: Stash tabs stored in `SaveData.stashData` (top-level field, not player-specific). Serialized with save/load. Default 4 empty tabs created on first load.
```

- [ ] **Step 2: Commit**

```bash
git add memory.md
git commit -m "docs: update memory with hub NPC interactions phase"
```

---

### Task 8: Full integration test

- [ ] **Step 1: Build and verify**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Final commit**

```bash
git push
```
