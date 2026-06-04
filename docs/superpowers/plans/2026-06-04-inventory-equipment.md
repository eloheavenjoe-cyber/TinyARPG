# Inventory & Equipment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full-screen inventory with 5×6 grid, 7 equipment slots, click-to-equip, tooltips, and character stats.

**Architecture:** Single `InventoryScreen` full-screen overlay (toggled with I). Player owns inventory/equipment data. Click-to-equip via select-then-slot pattern + click-selected to auto-equip. Drag-to-equip not included in this pass (can be added later).

**Tech Stack:** TypeScript, PixiJS 7

---

### Task 1: Extend Player with inventory, equipment, and equip methods

**Files:**
- Modify: `src/entities/Player.ts`
- Modify: `src/core/StatSystem.ts`
- Modify: `src/core/ItemDefs.ts`

- [ ] **Step 1: Add `ring2` slot to ItemDefs.ts**

In `src/core/ItemDefs.ts`, change the Slot type to include ring2:
```ts
export type Slot = 'weapon' | 'body' | 'helmet' | 'boots' | 'ring' | 'ring2' | 'amulet';
```

- [ ] **Step 2: Extend StatSystem to accept equipment stats**

In `src/core/StatSystem.ts`, add equipment stats parameter to `computeStats`:
```ts
import { PassiveTree, NodeEffects } from './PassiveTree';

export function computeStats(
  tree: PassiveTree,
  attrs: { str: number; dex: number; int: number },
  baseHp: number,
  baseMana: number,
  equipmentStats?: Record<string, number>,
) {
  const treeEffects = tree.getAllEffects();

  const add = (key: keyof NodeEffects) => treeEffects[key] || 0;

  const str = attrs.str + add('str');
  const dex = attrs.dex + add('dex');
  const int = attrs.int + add('int');

  let maxHp = baseHp + str * 2 + add('hp');
  maxHp = Math.round(maxHp * (1 + (add('hpPct') || 0) / 100));

  let maxMana = baseMana + int * 2 + add('mana');
  maxMana = Math.round(maxMana * (1 + (add('manaPct') || 0) / 100));

  const base: ReturnType<typeof computeStats> = {
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    attackSpeedMult: 1 + (dex * 0.005) + (add('attackSpeedPct') || 0) / 100,
    meleeDmgMult: 1 + (add('meleeDmgPct') || 0) / 100,
    projectileDmgMult: 1 + (add('projectileDmgPct') || 0) / 100,
    moveSpeedMult: 1 + (add('moveSpeedPct') || 0) / 100,
    dodgePct: Math.min(50, add('dodgePct') || 0),
    damageReduction: Math.min(50, add('damageReduction') || 0),
    cooldownReductionPct: Math.min(50, add('cooldownReductionPct') || 0),
    skillDurationPct: add('skillDurationPct') || 0,
    manaCostReductionPct: Math.min(40, add('manaCostReductionPct') || 0),
    manaRegenPct: add('manaRegenPct') || 0,
    hpRegen: add('hpRegen') || 0,
  };

  // Apply equipment stats on top
  if (equipmentStats) {
    for (const [key, val] of Object.entries(equipmentStats)) {
      if (key === 'hp') base.maxHp += val;
      else if (key === 'mana') base.maxMana += val;
      else if (key === 'damageReduction') base.damageReduction = Math.min(50, base.damageReduction + val);
      else if (key === 'attackSpeedPct') base.attackSpeedMult += val / 100;
      else if (key === 'moveSpeedPct') base.moveSpeedMult += val / 100;
      else if (key === 'meleeDmgPct') base.meleeDmgMult += val / 100;
      else if (key === 'projectileDmgPct') base.projectileDmgMult += val / 100;
      else if (key === 'hpRegen') base.hpRegen += val;
      // damage stat is tracked separately in Player for skill calculations
    }
  }

  return base;
}
```

- [ ] **Step 3: Add inventory/equipment fields and methods to Player**

Add imports at the top of `src/entities/Player.ts`:
```ts
import { Slot, GeneratedItem } from '../core/ItemDefs';
```

Add fields after existing fields:
```ts
inventory: (GeneratedItem | null)[] = new Array(30).fill(null);
equipment: Record<Slot, GeneratedItem | null> = {
  weapon: null, body: null, helmet: null, boots: null,
  ring: null, ring2: null, amulet: null,
};
```

Add methods:
```ts
pickupItem(item: GeneratedItem): boolean {
  const idx = this.inventory.findIndex(s => s === null);
  if (idx === -1) return false;
  this.inventory[idx] = item;
  return true;
}

equipItem(gridIndex: number): boolean {
  const item = this.inventory[gridIndex];
  if (!item) return false;
  const slot = item.base.slot;
  // Determine the correct key for two ring slots
  const slotKey: Slot = slot === 'ring' && this.equipment.ring !== null && this.equipment.ring2 === null
    ? 'ring2' : slot;
  const current = this.equipment[slotKey];
  this.equipment[slotKey] = item;
  this.inventory[gridIndex] = current || null;
  this.recalcStats();
  return true;
}

unequipItem(slot: Slot): boolean {
  const item = this.equipment[slot];
  if (!item) return false;
  const idx = this.inventory.findIndex(s => s === null);
  if (idx === -1) return false;
  this.inventory[idx] = item;
  this.equipment[slot] = null;
  this.recalcStats();
  return true;
}
```

Update `recalcStats()` to include equipment:
```ts
recalcStats() {
  const equipStats: Record<string, number> = {};
  for (const item of Object.values(this.equipment)) {
    if (!item) continue;
    for (const [stat, val] of Object.entries(item.computedStats)) {
      equipStats[stat] = (equipStats[stat] || 0) + val;
    }
  }
  this._computedStats = computeStats(this.passiveTree, this.attrs, 100, 50, equipStats);
}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/entities/Player.ts src/core/StatSystem.ts src/core/ItemDefs.ts
git commit -m "feat: add inventory and equipment data to Player"
```

---

### Task 2: Wire up inventory in Game.ts — I key toggle and pickup routing

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add InventoryScreen import**

After the PassiveTreeScreen import:
```ts
import { InventoryScreen } from '../ui/InventoryScreen';
```

- [ ] **Step 2: Add fields**

After `private passiveTreeScreen?: PassiveTreeScreen;`:
```ts
private inventoryOpen = false;
private inventoryScreen?: InventoryScreen;
```

- [ ] **Step 3: Add I key and Escape key handling**

After the P key handling in the `update()` method:
```ts
if (this.state === State.Playing) {
  const pDown = this.input.isKeyDown('KeyP');
  if (pDown && !this.wasPKeyDown) this.toggleTree();
  this.wasPKeyDown = pDown;

  const iDown = this.input.isKeyDown('KeyI');
  if (iDown && !this.wasIKeyDown) this.toggleInventory();
  this.wasIKeyDown = iDown;

  if (this.inventoryOpen && this.input.isKeyDown('Escape')) {
    this.toggleInventory();
  }
}
```

Add the field:
```ts
private wasIKeyDown = false;
```

- [ ] **Step 4: Check inventory in state switch**

In the Playing case, add inventory check before tree check:
```ts
case State.Playing:
  if (this.inventoryOpen) {
    this.updateInventory();
  } else if (this.treeOpen) {
    this.updateTree();
  } else {
    this.updateGameplay(dt);
  }
  break;
```

- [ ] **Step 5: Route pickup to inventory in click handler**

In `updateGameplay`, replace the existing click-to-pickup block with:
```ts
if (this.input.consumeClick()) {
  let clickedItem = false;
  for (const drop of this.itemDrops) {
    if (drop.pickedUp) continue;
    if (isEquippableDrop(drop) && Math.hypot(mouseWX - drop.x, mouseWY - drop.y) < 30) {
      const gen = drop.item.generated;
      if (this.player!.pickupItem(gen)) {
        drop.pickup();
        this.gameContainer!.removeChild(drop.container);
        drop.destroy();
        this.itemDrops.splice(this.itemDrops.indexOf(drop), 1);
      }
      clickedItem = true;
      break;
    }
  }
  if (!clickedItem) {
    this.useMainAbility();
  }
}
```

- [ ] **Step 6: Add toggleInventory and updateInventory methods**

After `toggleTree()`:
```ts
private toggleInventory() {
  if (!this.player) return;
  if (this.treeOpen) return; // don't open both at once
  this.inventoryOpen = !this.inventoryOpen;
  if (this.inventoryOpen) {
    this.inventoryScreen = new InventoryScreen(
      SCREEN_WIDTH, SCREEN_HEIGHT,
      this.player.inventory, this.player.equipment,
      this._computedStats,
    );
    this.inventoryScreen.onEquip((gridIndex) => {
      if (this.player) {
        this.player.equipItem(gridIndex);
        this.inventoryScreen?.update(
          this.player.inventory, this.player.equipment,
          this.player.computedStats,
        );
      }
    });
    this.inventoryScreen.onUnequip((slot) => {
      if (this.player) {
        this.player.unequipItem(slot);
        this.inventoryScreen?.update(
          this.player.inventory, this.player.equipment,
          this.player.computedStats,
        );
      }
    });
    this.app.stage.addChild(this.inventoryScreen.container);
  } else {
    if (this.inventoryScreen) {
      this.app.stage.removeChild(this.inventoryScreen.container);
      this.inventoryScreen.destroy();
      this.inventoryScreen = undefined;
    }
  }
}

private updateInventory() {
  if (!this.inventoryScreen || !this.player) return;
  this.inventoryScreen.update(
    this.player.inventory, this.player.equipment,
    this.player.computedStats, this.input,
  );
}
```

- [ ] **Step 7: Clean up inventory in restartGame**

In `restartGame()`, add before the player reset:
```ts
if (this.inventoryOpen) this.toggleInventory();
if (this.inventoryScreen) {
  this.app.stage.removeChild(this.inventoryScreen.container);
  this.inventoryScreen.destroy();
  this.inventoryScreen = undefined;
}
```

- [ ] **Step 8: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors (may get errors about InventoryScreen not existing yet — that's OK, Task 3 creates it)

- [ ] **Step 9: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: wire inventory toggle and pickup routing in Game"
```

---

### Task 3: Create InventoryScreen UI

**Files:**
- Create: `src/ui/InventoryScreen.ts`

- [ ] **Step 1: Write the full InventoryScreen class**

```ts
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Slot, GeneratedItem } from '../core/ItemDefs';

const COLORS = {
  bg: 0x0c0c1a,
  panel: 0x141428,
  slotBg: 0x1a1a30,
  slotBorder: 0x2a2a44,
  slotHover: 0x3a3a55,
  selected: 0x5588cc,
  text: '#ccccdd',
  textDim: '#555566',
  textStat: '#ffdd88',
};

export class InventoryScreen {
  container: Container;
  private gridSlots: { bg: Graphics; item: Text; index: number; slot: Slot }[] = [];
  private equipSlots: { bg: Graphics; item: Text; label: Text; slot: Slot }[] = [];
  private selectedIndex = -1;
  private hoveredSlot: number | Slot | null = null;
  private statTexts: Text[] = [];
  private onEquip: (gridIndex: number) => void = () => {};
  private onUnequip: (slot: Slot) => void = () => {};

  constructor(
    screenW: number, screenH: number,
    inventory: (GeneratedItem | null)[],
    equipment: Record<Slot, GeneratedItem | null>,
    computedStats: any,
  ) {
    this.container = new Container();

    // Semi-transparent background
    const bg = new Graphics();
    bg.beginFill(COLORS.bg, 0.92);
    bg.drawRect(0, 0, screenW, screenH);
    bg.endFill();
    this.container.addChild(bg);

    // Title
    const title = new Text('Inventory', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 24, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenW / 2;
    title.y = 15;
    this.container.addChild(title);

    // Close hint
    const hint = new Text('I: Close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#555566',
    }));
    hint.anchor.set(1, 0);
    hint.x = screenW - 20;
    hint.y = 55;
    this.container.addChild(hint);

    // Inventory grid (left side)
    const gridX = screenW / 2 - 200;
    const gridY = 80;
    const slotSize = 50;
    const gap = 6;
    const cols = 5;
    const rows = 6;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const sx = gridX + col * (slotSize + gap);
        const sy = gridY + row * (slotSize + gap);
        const item = inventory[idx];

        const g = new Graphics();
        g.beginFill(COLORS.slotBg);
        g.lineStyle(1, COLORS.slotBorder);
        g.drawRoundedRect(0, 0, slotSize, slotSize, 4);
        g.endFill();
        g.x = sx;
        g.y = sy;
        this.container.addChild(g);

        const txt = new Text(item ? item.base.name : '', new TextStyle({
          fontFamily: 'monospace', fontSize: 9, fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
        }));
        txt.anchor.set(0.5);
        txt.x = sx + slotSize / 2;
        txt.y = sy + slotSize / 2;
        this.container.addChild(txt);

        this.gridSlots.push({ bg: g, item: txt, index: idx, slot: item?.base.slot || 'weapon' });
      }
    }

    // Equipment panel (right side)
    const equipX = screenW / 2 + 60;
    const equipStartY = 80;
    const equipSlotSize = 60;
    const equipGap = 10;
    const slotLabels: { slot: Slot; label: string }[] = [
      { slot: 'weapon', label: 'Weapon' },
      { slot: 'body', label: 'Body' },
      { slot: 'helmet', label: 'Helmet' },
      { slot: 'boots', label: 'Boots' },
      { slot: 'ring', label: 'Ring 1' },
      { slot: 'ring2', label: 'Ring 2' },
      { slot: 'amulet', label: 'Amulet' },
    ];

    const panelBg = new Graphics();
    panelBg.beginFill(COLORS.panel, 0.8);
    panelBg.drawRoundedRect(equipX - 10, equipStartY - 10, equipSlotSize + 20, slotLabels.length * (equipSlotSize + equipGap) + 10, 6);
    panelBg.endFill();
    this.container.addChild(panelBg);

    for (let i = 0; i < slotLabels.length; i++) {
      const { slot, label } = slotLabels[i];
      const sy = equipStartY + i * (equipSlotSize + equipGap);
      const item = equipment[slot];

      const g = new Graphics();
      g.beginFill(item ? 0x222244 : COLORS.slotBg);
      g.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
      g.drawRoundedRect(0, 0, equipSlotSize, equipSlotSize, 4);
      g.endFill();
      g.x = equipX;
      g.y = sy;
      this.container.addChild(g);

      const labelTxt = new Text(label, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: COLORS.textDim,
      }));
      labelTxt.x = equipX + equipSlotSize + 8;
      labelTxt.y = sy + 4;
      this.container.addChild(labelTxt);

      const itemTxt = new Text(item ? item.base.name : '', new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      }));
      itemTxt.x = equipX + equipSlotSize + 8;
      itemTxt.y = sy + 20;
      this.container.addChild(itemTxt);

      this.equipSlots.push({ bg: g, item: itemTxt, label: labelTxt, slot });
    }

    // Stats panel
    const statsX = screenW / 2 + 60;
    const statsY = equipStartY + slotLabels.length * (equipSlotSize + equipGap) + 30;
    const header = new Text('Character Stats', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: COLORS.textStat,
    }));
    header.x = statsX;
    header.y = statsY;
    this.container.addChild(header);

    const statLines = [
      { label: 'Life', value: `${computedStats?.maxHp || 0}` },
      { label: 'Mana', value: `${computedStats?.maxMana || 0}` },
      { label: 'Armor DR', value: `${computedStats?.damageReduction || 0}%` },
      { label: 'Attack Speed', value: `${((computedStats?.attackSpeedMult || 1) * 100).toFixed(0)}%` },
      { label: 'Move Speed', value: `${((computedStats?.moveSpeedMult || 1) * 100).toFixed(0)}%` },
      { label: 'Dodge', value: `${computedStats?.dodgePct || 0}%` },
    ];

    for (let i = 0; i < statLines.length; i++) {
      const t = new Text(`${statLines[i].label}: ${statLines[i].value}`, new TextStyle({
        fontFamily: 'monospace', fontSize: 12, fill: COLORS.text,
      }));
      t.x = statsX;
      t.y = statsY + 24 + i * 20;
      this.container.addChild(t);
      this.statTexts.push(t);
    }

    // Tooltip area
    this.renderTooltip(inventory, equipment);
  }

  private tooltip?: Container;

  private showTooltip(item: GeneratedItem, x: number, y: number) {
    if (this.tooltip) this.container.removeChild(this.tooltip);

    const lines: string[] = [item.computedName];
    lines.push(`Base: ${item.base.name}`);
    if (item.damageRoll > 0) lines.push(`Damage: ${item.damageRoll}`);
    for (const a of item.affixes) {
      if (a.affix.name) lines.push(`${a.affix.name}: ${a.roll > 0 ? '+' : ''}${a.roll}`);
    }
    // Check unique flavor from fixed affixes that aren't standard
    for (const [stat, val] of Object.entries(item.computedStats)) {
      const matched = item.affixes.some(a => a.affix.stat === stat);
      if (!matched && stat !== 'damage') {
        lines.push(`  ${stat}: ${val > 0 ? '+' : ''}${val}`);
      }
    }

    this.tooltip = new Container();
    const txt = new Text(lines.join('\n'), new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: getRarityColor(item.rarity),
      lineHeight: 16,
    }));

    const pad = 8;
    const bg = new Graphics();
    bg.beginFill(0x0a0a18, 0.95);
    bg.lineStyle(1, getRarityColor(item.rarity), 0.6);
    bg.drawRoundedRect(-pad, -pad, txt.width + pad * 2, txt.height + pad * 2, 4);
    bg.endFill();

    this.tooltip.addChild(bg, txt);
    this.tooltip.x = Math.min(x + 20, 1920 - txt.width - pad * 2 - 10);
    this.tooltip.y = Math.min(y + 20, 1080 - txt.height - pad * 2 - 10);
    this.container.addChild(this.tooltip);
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.container.removeChild(this.tooltip);
      this.tooltip = undefined;
    }
  }

  onEquipCallback(cb: (gridIndex: number) => void) { this.onEquip = cb; }
  onUnequipCallback(cb: (slot: Slot) => void) { this.onUnequip = cb; }

  private mouseX = 0;
  private mouseY = 0;

  update(
    inventory: (GeneratedItem | null)[],
    equipment: Record<Slot, GeneratedItem | null>,
    computedStats: any,
    input?: InputManager,
  ) {
    if (!input) return;
    this.mouseX = input.mouseX;
    this.mouseY = input.mouseY;

    // Handle clicks
    if (input.consumeClick()) {
      this.handleClick(inventory, equipment);
    }

    // Hover detection for tooltip
    let hoveredItem: GeneratedItem | null = null;
    this.hoveredSlot = null;
    for (const g of this.gridSlots) {
      if (this.mouseX >= g.bg.x && this.mouseX <= g.bg.x + 50 &&
          this.mouseY >= g.bg.y && this.mouseY <= g.bg.y + 50) {
        this.hoveredSlot = g.index;
        if (inventory[g.index]) hoveredItem = inventory[g.index];
        break;
      }
    }
    if (!hoveredItem) {
      for (const s of this.equipSlots) {
        if (this.mouseX >= s.bg.x && this.mouseX <= s.bg.x + 60 &&
            this.mouseY >= s.bg.y && this.mouseY <= s.bg.y + 60) {
          this.hoveredSlot = s.slot as any;
          if (equipment[s.slot]) hoveredItem = equipment[s.slot];
          break;
        }
      }
    }
    if (hoveredItem) {
      this.showTooltip(hoveredItem, this.mouseX, this.mouseY);
    } else {
      this.hideTooltip();
    }

    // Update grid items
    for (let i = 0; i < this.gridSlots.length; i++) {
      const slot = this.gridSlots[i];
      const item = inventory[i];
      slot.bg.clear();
      if (i === this.selectedIndex) {
        slot.bg.beginFill(COLORS.selected, 0.3);
        slot.bg.lineStyle(2, COLORS.selected);
      } else if (this.hoveredSlot === i) {
        slot.bg.beginFill(COLORS.slotHover);
        slot.bg.lineStyle(1, COLORS.slotBorder);
      } else {
        slot.bg.beginFill(COLORS.slotBg);
        slot.bg.lineStyle(1, COLORS.slotBorder);
      }
      slot.bg.drawRoundedRect(0, 0, 50, 50, 4);
      slot.bg.endFill();
      slot.item.text = item ? item.base.name : '';
      slot.item.style = new TextStyle({
        fontFamily: 'monospace', fontSize: 9,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      });
    }

    // Update equipment slots
    for (const s of this.equipSlots) {
      const item = equipment[s.slot];
      s.bg.clear();
      s.bg.beginFill(item ? 0x222244 : COLORS.slotBg);
      s.bg.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
      s.bg.drawRoundedRect(0, 0, 60, 60, 4);
      s.bg.endFill();
      s.item.text = item ? item.base.name : '';
      s.item.style = new TextStyle({
        fontFamily: 'monospace', fontSize: 10,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      });
    }

    // Update stats
    const statLines = [
      `Life: ${computedStats?.maxHp || 0}`,
      `Mana: ${computedStats?.maxMana || 0}`,
      `Armor DR: ${computedStats?.damageReduction || 0}%`,
      `Attack Speed: ${((computedStats?.attackSpeedMult || 1) * 100).toFixed(0)}%`,
      `Move Speed: ${((computedStats?.moveSpeedMult || 1) * 100).toFixed(0)}%`,
      `Dodge: ${computedStats?.dodgePct || 0}%`,
    ];
    for (let i = 0; i < this.statTexts.length; i++) {
      this.statTexts[i].text = statLines[i];
    }
  }

  private handleClick(inventory: (GeneratedItem | null)[], equipment: Record<Slot, GeneratedItem | null>) {
    const mx = this.mouseX;
    const my = this.mouseY;

    // Check grid clicks
    for (const g of this.gridSlots) {
      if (mx >= g.bg.x && mx <= g.bg.x + 50 && my >= g.bg.y && my <= g.bg.y + 50) {
        if (inventory[g.index]) {
          if (this.selectedIndex === g.index) {
            // Double-click or click selected: auto-equip
            this.selectedIndex = -1;
            this.onEquip(g.index);
          } else {
            this.selectedIndex = g.index;
          }
        } else {
          this.selectedIndex = -1;
        }
        return;
      }
    }

    // Check equipment slot clicks
    for (const s of this.equipSlots) {
      if (mx >= s.bg.x && mx <= s.bg.x + 60 && my >= s.bg.y && my <= s.bg.y + 60) {
        if (this.selectedIndex >= 0 && inventory[this.selectedIndex]) {
          this.onEquip(this.selectedIndex);
          this.selectedIndex = -1;
        } else if (equipment[s.slot]) {
          this.onUnequip(s.slot);
        }
        return;
      }
    }

    this.selectedIndex = -1;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}

function getRarityColor(rarity: string): number {
  const colors: Record<string, number> = {
    normal: 0xffffff, magic: 0x4488ff,
    rare: 0xffcc00, unique: 0xff6600,
  };
  return colors[rarity] || 0xffffff;
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/InventoryScreen.ts
git commit -m "feat: create InventoryScreen with grid, equipment, and stats"
```

---

### Task 4: Final verification

**Files:**
- N/A (verification only)

- [ ] **Step 1: Full compile check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build and deploy**

Run: `npm run deploy`
Expected: Build succeeds, published.
