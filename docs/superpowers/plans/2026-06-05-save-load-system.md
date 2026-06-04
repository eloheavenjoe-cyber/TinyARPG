# Save/Load System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 5-slot save/load system with localStorage, auto-save (every 60s), manual save, escape menu with settings placeholder, and save slot selection UI.

**Architecture:** New `SaveManager.ts` handles serialization/deserialization of player + zone state. New UI components (SaveSlotScreen, EscapeMenu, SettingsPlaceholder) follow existing PixiJS Container patterns. Game.ts gets save/load/exit methods + auto-save timer + escape key handler. MainMenu gets Continue/Load Game buttons.

**Tech Stack:** TypeScript, PixiJS 7, localStorage

**Verification:** `npx tsc --noEmit` after each task

---

### Task 1: Create SaveManager.ts

**Files:**
- Create: `src/core/SaveManager.ts`

**Constants and helper lookup tables:**

```typescript
const SAVE_PREFIX = 'TinyARPG_save_';
const META_KEY = 'TinyARPG_meta';
const SETTINGS_KEY = 'TinyARPG_settings';
const SLOT_COUNT = 5;
const SAVE_VERSION = 1;
```

A static `ALL_SKILLS` array is needed because `SkillManager.allSkills` is instance-scoped. We construct it from the SkillDefs exports:

```typescript
import { ItemBase, ItemAffix, AFFIXES, ITEM_BASES } from './ItemDefs';
import { SkillDef, ClassType, WARRIOR_MAIN, WARRIOR_SUPPORT, RANGER_MAIN, RANGER_SUPPORT, MONK_MAIN, MONK_SUPPORT } from './SkillDefs';
import { GeneratedItem } from './ItemGenerator';

const ALL_SKILLS: SkillDef[] = [
  ...WARRIOR_MAIN, ...WARRIOR_SUPPORT,
  ...RANGER_MAIN, ...RANGER_SUPPORT,
  ...MONK_MAIN, ...MONK_SUPPORT,
];

function findSkill(id: string): SkillDef | undefined {
  return ALL_SKILLS.find(s => s.id === id);
}

function findBase(id: string): ItemBase | undefined {
  return ITEM_BASES.find(b => b.id === id);
}

function findAffix(id: string): ItemAffix | undefined {
  return AFFIXES.find(a => a.id === id);
}
```

**SlotMeta interface:**
```typescript
export interface SlotMeta {
  occupied: boolean;
  playerName: string;
  classType: string;
  level: number;
  timestamp: number;
  zoneName: string;
}
```

**SaveData interfaces:**
```typescript
export interface SerializedItem {
  baseId: string;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  affixes: { affixId: string; roll: number }[];
  uniqueId?: string;
  damageRoll: number;
  computedName: string;
  ilvl: number;
  levelReq: number;
}

export type SerializedInventorySlot =
  | { kind: 'equip'; item: SerializedItem }
  | { kind: 'orb'; orbId: string; count: number }
  | null;

export interface SaveData {
  version: number;
  timestamp: number;
  playerName: string;
  level: number;
  classType: ClassType;
  zone: {
    currentZoneId: string;
    currentRoomIndex: number;
    completedZoneIds: string[];
  };
  player: {
    x: number;
    y: number;
    health: number;
    mana: number;
    gold: number;
    level: number;
    xp: number;
    attrs: { str: number; dex: number; int: number };
    unspentAttrPoints: number;
    passivePoints: number;
    inventory: SerializedInventorySlot[];
    equipment: Record<string, SerializedItem | null>;
    skills: {
      slotIds: (string | null)[];
      currentStance?: 'tiger' | 'tortoise' | 'crane';
    };
    passiveTree: {
      allocatedNodeIds: string[];
    };
  };
}
```

**SaveManager class:**
```typescript
export class SaveManager {
  static getAllSlots(): (SlotMeta | null)[] {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return new Array(SLOT_COUNT).fill(null);
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length !== SLOT_COUNT) return new Array(SLOT_COUNT).fill(null);
      return arr;
    } catch { return new Array(SLOT_COUNT).fill(null); }
  }

  static getSlotMeta(index: number): SlotMeta | null {
    const slots = SaveManager.getAllSlots();
    return slots[index] || null;
  }

  static saveToSlot(index: number, data: SaveData): void {
    if (index < 0 || index >= SLOT_COUNT) return;
    try {
      localStorage.setItem(`${SAVE_PREFIX}${index}`, JSON.stringify(data));
      const meta: SlotMeta = {
        occupied: true,
        playerName: data.playerName,
        classType: data.classType,
        level: data.level,
        timestamp: Date.now(),
        zoneName: SaveManager.getZoneName(data.zone.currentZoneId),
      };
      const slots = SaveManager.getAllSlots();
      slots[index] = meta;
      localStorage.setItem(META_KEY, JSON.stringify(slots));
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  static loadFromSlot(index: number): SaveData | null {
    if (index < 0 || index >= SLOT_COUNT) return null;
    try {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${index}`);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== SAVE_VERSION) return null;
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  static deleteSlot(index: number): void {
    if (index < 0 || index >= SLOT_COUNT) return;
    localStorage.removeItem(`${SAVE_PREFIX}${index}`);
    const slots = SaveManager.getAllSlots();
    slots[index] = null;
    localStorage.setItem(META_KEY, JSON.stringify(slots));
  }

  static getFirstOccupiedSlot(): number {
    const slots = SaveManager.getAllSlots();
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (slots[i]?.occupied) return i;
    }
    return -1;
  }

  static getFirstEmptySlot(): number {
    const slots = SaveManager.getAllSlots();
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!slots[i]?.occupied) return i;
    }
    return -1;
  }

  private static getZoneName(zoneId: string): string {
    const names: Record<string, string> = {
      hub: 'Hub', tutorial: 'Tutorial', forest: 'Verdant Forest',
      desert: 'Scorched Desert', ice: 'Frozen Wastes',
      endless_arena: 'Endless Arena', endless_dungeon: 'Endless Dungeon', dev: 'Developer Room',
    };
    return names[zoneId] || zoneId;
  }
}
```

- [ ] **Step 1: Create `src/core/SaveManager.ts`** with the complete content above

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```
git add src/core/SaveManager.ts
git commit -m "feat: add SaveManager with localStorage save/load/delete"
```

---

### Task 2: Create SettingsPlaceholder.ts

**Files:**
- Create: `src/ui/SettingsPlaceholder.ts`

```typescript
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class SettingsPlaceholder {
  container: Container;
  private onBack: (() => void) | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const panel = new Graphics();
    panel.beginFill(0x1a1a2e, 0.95);
    panel.drawRoundedRect(-320, -280, 640, 560, 8);
    panel.endFill();
    panel.lineStyle(1, 0x5a4a2a);
    panel.drawRoundedRect(-320, -280, 640, 560, 8);
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const title = new Text('Settings', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 28, fill: '#c0a060',
    }));
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -250;
    panel.addChild(title);

    // Audio section
    const audioLabel = new Text('Audio', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    audioLabel.anchor.set(0.5, 0);
    audioLabel.x = 0;
    audioLabel.y = -200;
    panel.addChild(audioLabel);

    const musicLabel = new Text('Music Volume: [----o----]  50%', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#6a6a7a',
    }));
    musicLabel.anchor.set(0.5, 0);
    musicLabel.x = 0;
    musicLabel.y = -170;
    panel.addChild(musicLabel);

    const sfxLabel = new Text('SFX Volume:   [----o----]  50%', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#6a6a7a',
    }));
    sfxLabel.anchor.set(0.5, 0);
    sfxLabel.x = 0;
    sfxLabel.y = -145;
    panel.addChild(sfxLabel);

    // Graphics section
    const gfxLabel = new Text('Graphics', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    gfxLabel.anchor.set(0.5, 0);
    gfxLabel.x = 0;
    gfxLabel.y = -105;
    panel.addChild(gfxLabel);

    const qualityLabel = new Text('Quality:  Medium', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#6a6a7a',
    }));
    qualityLabel.anchor.set(0.5, 0);
    qualityLabel.x = 0;
    qualityLabel.y = -75;
    panel.addChild(qualityLabel);

    // Controls section
    const ctrlLabel = new Text('Controls', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    ctrlLabel.anchor.set(0.5, 0);
    ctrlLabel.x = 0;
    ctrlLabel.y = -35;
    panel.addChild(ctrlLabel);

    const binds = [
      'Move:         W A S D',
      'Skill 1-6:    1 2 3 4 5 6',
      'Interact:     E',
      'Inventory:    I',
      'Passive Tree: P',
      'Escape Menu:  Escape',
    ];
    for (let i = 0; i < binds.length; i++) {
      const line = new Text(binds[i], new TextStyle({
        fontFamily: 'monospace', fontSize: 13, fill: '#6a6a7a',
      }));
      line.anchor.set(0.5, 0);
      line.x = 0;
      line.y = -5 + i * 20;
      panel.addChild(line);
    }

    // Back button
    const backBtn = new Container();
    const backBg = new Graphics();
    backBg.beginFill(0x2a2a3a);
    backBg.drawRoundedRect(-50, -16, 100, 32, 4);
    backBg.endFill();
    backBg.lineStyle(1, 0x5a4a2a);
    backBg.drawRoundedRect(-50, -16, 100, 32, 4);
    const backText = new Text('Back', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 16, fill: '#c0a060',
    }));
    backText.anchor.set(0.5);
    backBtn.addChild(backBg, backText);
    backBtn.x = 0;
    backBtn.y = 230;
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    backBtn.on('pointerdown', () => this.onBack?.());
    panel.addChild(backBtn);

    this.container.addChild(panel);

    const placeholder = new Text('(Settings are visual placeholders only)', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 12, fill: '#4a4a5a', fontStyle: 'italic',
    }));
    placeholder.anchor.set(0.5);
    placeholder.x = screenWidth / 2;
    placeholder.y = screenHeight / 2 + 295;
    this.container.addChild(placeholder);

    Logger.log('ui', 'Settings placeholder opened');
  }

  onBackCallback(cb: () => void) { this.onBack = cb; }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 1: Create `src/ui/SettingsPlaceholder.ts`** with complete content above

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```
git add src/ui/SettingsPlaceholder.ts
git commit -m "feat: add placeholder Settings panel"
```

---

### Task 3: Create SaveSlotScreen.ts

**Files:**
- Create: `src/ui/SaveSlotScreen.ts`

```typescript
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { SaveManager, SlotMeta } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export class SaveSlotScreen {
  container: Container;
  private onSelect: ((index: number) => void) | null = null;
  private onBack: (() => void) | null = null;
  private slots: (SlotMeta | null)[] = [];
  private confirmDeleteIndex = -1;

  constructor(screenWidth: number, screenHeight: number, mode: 'load' | 'save') {
    this.container = new Container();
    this.slots = SaveManager.getAllSlots();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text(mode === 'load' ? 'Load Game' : 'Select Save Slot', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 36, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = 60;
    this.container.addChild(title);

    this.createSlotButtons(screenWidth);

    // Back button
    const backBtn = new Container();
    const backBg = new Graphics();
    backBg.beginFill(0x2a2a3a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    backBg.endFill();
    backBg.lineStyle(1, 0x5a4a2a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    const backText = new Text('Back', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#c0a060',
    }));
    backText.anchor.set(0.5);
    backBtn.addChild(backBg, backText);
    backBtn.x = screenWidth / 2;
    backBtn.y = screenHeight - 60;
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    backBtn.on('pointerdown', () => this.onBack?.());
    this.container.addChild(backBtn);

    Logger.log('ui', `SaveSlotScreen opened (mode: ${mode})`);
  }

  private createSlotButtons(screenWidth: number) {
    const startY = 130;
    const slotHeight = 90;
    const gap = 10;
    const slotWidth = 600;
    const startX = (screenWidth - slotWidth) / 2;

    for (let i = 0; i < 5; i++) {
      const meta = this.slots[i];
      const y = startY + i * (slotHeight + gap);
      const isOccupied = meta?.occupied;

      const card = new Container();

      const cardBg = new Graphics();
      cardBg.beginFill(isOccupied ? 0x1a1a2e : 0x111122);
      cardBg.drawRoundedRect(0, 0, slotWidth, slotHeight, 6);
      cardBg.endFill();
      cardBg.lineStyle(1, isOccupied ? 0x5a4a2a : 0x2a2a3a);
      cardBg.drawRoundedRect(0, 0, slotWidth, slotHeight, 6);
      card.addChild(cardBg);

      const slotNum = new Text(`Slot ${i + 1}`, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 16, fill: isOccupied ? '#c0a060' : '#4a4a5a',
      }));
      slotNum.x = 15;
      slotNum.y = 10;
      card.addChild(slotNum);

      if (isOccupied && meta) {
        const cls = new Text(`${meta.playerName}  (${meta.classType})`, new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: 14, fill: '#aaaacc',
        }));
        cls.x = 15;
        cls.y = 35;
        card.addChild(cls);

        const lvl = new Text(`Level ${meta.level}`, new TextStyle({
          fontFamily: 'monospace', fontSize: 13, fill: '#6a6a7a',
        }));
        lvl.x = 15;
        lvl.y = 58;
        card.addChild(lvl);

        const zone = new Text(meta.zoneName, new TextStyle({
          fontFamily: 'monospace', fontSize: 12, fill: '#4a4a5a',
        }));
        zone.x = slotWidth - 200;
        zone.y = 58;
        card.addChild(zone);

        const time = new Text(new Date(meta.timestamp).toLocaleString(), new TextStyle({
          fontFamily: 'monospace', fontSize: 11, fill: '#3a3a4a',
        }));
        time.x = 15;
        time.y = 75;
        card.addChild(time);

        // Delete button (X)
        const delBtn = new Container();
        const delBg = new Graphics();
        delBg.beginFill(0x3a1a1a);
        delBg.drawRoundedRect(-14, -14, 28, 28, 4);
        delBg.endFill();
        delBg.lineStyle(1, 0x6a2a2a);
        delBg.drawRoundedRect(-14, -14, 28, 28, 4);
        const delText = new Text('X', new TextStyle({
          fontFamily: 'monospace', fontSize: 14, fill: '#cc6666',
        }));
        delText.anchor.set(0.5);
        delBtn.addChild(delBg, delText);
        delBtn.x = slotWidth - 20;
        delBtn.y = 18;
        delBtn.eventMode = 'static';
        delBtn.cursor = 'pointer';
        const slotIdx = i;
        delBtn.on('pointerdown', (e: any) => {
          e.stopPropagation();
          this.confirmDeleteIndex = slotIdx;
          this.showDeleteConfirm(slotIdx);
        });
        card.addChild(delBtn);

        // Click card to load/select
        card.eventMode = 'static';
        card.cursor = 'pointer';
        card.on('pointerdown', () => this.onSelect?.(slotIdx));
      } else {
        const emptyText = new Text('Empty Slot', new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: 16, fill: '#3a3a4a', fontStyle: 'italic',
        }));
        emptyText.anchor.set(0.5);
        emptyText.x = slotWidth / 2;
        emptyText.y = slotHeight / 2;
        card.addChild(emptyText);

        // Empty slots can be clicked too (for save mode)
        card.eventMode = 'static';
        card.cursor = 'pointer';
        const slotIdx = i;
        card.on('pointerdown', () => this.onSelect?.(slotIdx));
      }

      card.x = startX;
      card.y = y;
      this.container.addChild(card);
    }
  }

  private showDeleteConfirm(index: number) {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.6);
    overlay.drawRect(0, 0, 1920, 1080);
    overlay.endFill();
    overlay.eventMode = 'static';

    const confirmBox = new Container();
    const box = new Graphics();
    box.beginFill(0x1a1a2e, 0.95);
    box.drawRoundedRect(-160, -60, 320, 120, 6);
    box.endFill();
    box.lineStyle(1, 0x5a4a2a);
    box.drawRoundedRect(-160, -60, 320, 120, 6);

    const msg = new Text('Delete this save?', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#cc6666',
    }));
    msg.anchor.set(0.5);
    msg.y = -25;
    box.addChild(msg);

    // Yes button
    const yesBtn = new Container();
    const yesBg = new Graphics();
    yesBg.beginFill(0x3a1a1a);
    yesBg.drawRoundedRect(-40, -14, 80, 28, 4);
    yesBg.endFill();
    yesBg.lineStyle(1, 0x6a2a2a);
    yesBg.drawRoundedRect(-40, -14, 80, 28, 4);
    const yesText = new Text('Delete', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 14, fill: '#cc6666',
    }));
    yesText.anchor.set(0.5);
    yesBtn.addChild(yesBg, yesText);
    yesBtn.x = -80;
    yesBtn.y = 20;
    yesBtn.eventMode = 'static';
    yesBtn.cursor = 'pointer';
    const slotIdx = index;
    yesBtn.on('pointerdown', () => {
      SaveManager.deleteSlot(slotIdx);
      this.container.removeChild(overlay);
      this.refreshSlots();
    });
    box.addChild(yesBtn);

    // Cancel button
    const noBtn = new Container();
    const noBg = new Graphics();
    noBg.beginFill(0x2a2a3a);
    noBg.drawRoundedRect(-40, -14, 80, 28, 4);
    noBg.endFill();
    noBg.lineStyle(1, 0x5a4a2a);
    noBg.drawRoundedRect(-40, -14, 80, 28, 4);
    const noText = new Text('Cancel', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 14, fill: '#aaaacc',
    }));
    noText.anchor.set(0.5);
    noBtn.addChild(noBg, noText);
    noBtn.x = 80;
    noBtn.y = 20;
    noBtn.eventMode = 'static';
    noBtn.cursor = 'pointer';
    noBtn.on('pointerdown', () => this.container.removeChild(overlay));
    box.addChild(noBtn);

    confirmBox.addChild(box);
    confirmBox.x = 1920 / 2;
    confirmBox.y = 1080 / 2;
    overlay.addChild(confirmBox);
    this.container.addChild(overlay);
  }

  private refreshSlots() {
    this.slots = SaveManager.getAllSlots();
    // Simple approach: remove all children and rebuild
    while (this.container.children.length > 0) {
      this.container.removeChildAt(0).destroy({ children: true });
    }
    // Rebuild bg + title + slots + back
    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, 1920, 1080);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Load Game', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 36, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = 1920 / 2;
    title.y = 60;
    this.container.addChild(title);

    this.createSlotButtons(1920);

    const backBtn = new Container();
    const backBg = new Graphics();
    backBg.beginFill(0x2a2a3a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    backBg.endFill();
    backBg.lineStyle(1, 0x5a4a2a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    const backText = new Text('Back', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#c0a060',
    }));
    backText.anchor.set(0.5);
    backBtn.addChild(backBg, backText);
    backBtn.x = 1920 / 2;
    backBtn.y = 1080 - 60;
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    const savedOnBack = this.onBack;
    backBtn.on('pointerdown', () => savedOnBack?.());
    this.container.addChild(backBtn);
  }

  onSelectCallback(cb: (index: number) => void) { this.onSelect = cb; }
  onBackCallback(cb: () => void) { this.onBack = cb; }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 1: Create `src/ui/SaveSlotScreen.ts`** with complete content above

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```
git add src/ui/SaveSlotScreen.ts
git commit -m "feat: add SaveSlotScreen with load/delete UI"
```

---

### Task 4: Create EscapeMenu.ts

**Files:**
- Create: `src/ui/EscapeMenu.ts`

```typescript
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class EscapeMenu {
  container: Container;
  private onResume: (() => void) | null = null;
  private onSave: (() => void) | null = null;
  private onSettings: (() => void) | null = null;
  private onSaveAndExit: (() => void) | null = null;
  private saveToastTimer = 0;
  private toastText?: Text;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.5);
    overlay.drawRect(0, 0, screenWidth, screenHeight);
    overlay.endFill();
    overlay.eventMode = 'static';
    this.container.addChild(overlay);

    const panel = new Container();
    const panelBg = new Graphics();
    panelBg.beginFill(0x1a1a2e, 0.95);
    panelBg.drawRoundedRect(-150, -180, 300, 360, 8);
    panelBg.endFill();
    panelBg.lineStyle(1, 0x5a4a2a);
    panelBg.drawRoundedRect(-150, -180, 300, 360, 8);
    panel.addChild(panelBg);

    const title = new Text('Menu', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 28, fill: '#c0a060',
    }));
    title.anchor.set(0.5, 0);
    title.y = -160;
    panel.addChild(title);

    const buttonConfigs = [
      { label: 'Resume', cb: 'onResume' },
      { label: 'Save', cb: 'onSave' },
      { label: 'Settings', cb: 'onSettings' },
      { label: 'Save & Exit', cb: 'onSaveAndExit' },
    ];

    for (let i = 0; i < buttonConfigs.length; i++) {
      const cfg = buttonConfigs[i];
      const btn = new Container();
      const btnBg = new Graphics();
      btnBg.beginFill(0x2a2a3a);
      btnBg.drawRoundedRect(-80, -18, 160, 36, 4);
      btnBg.endFill();
      btnBg.lineStyle(1, 0x5a4a2a);
      btnBg.drawRoundedRect(-80, -18, 160, 36, 4);
      const btnText = new Text(cfg.label, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 16, fill: '#c0a060',
      }));
      btnText.anchor.set(0.5);
      btn.addChild(btnBg, btnText);
      btn.y = -110 + i * 55;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => {
        const cb = (this as any)[cfg.cb] as (() => void) | null;
        cb?.();
      });
      panel.addChild(btn);
    }

    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;
    this.container.addChild(panel);

    // Toast text (hidden by default)
    this.toastText = new Text('Game Saved!', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 20, fill: '#44cc44',
      stroke: '#000', strokeThickness: 2,
    }));
    this.toastText.anchor.set(0.5);
    this.toastText.x = screenWidth / 2;
    this.toastText.y = screenHeight / 2 + 220;
    this.toastText.visible = false;
    this.container.addChild(this.toastText);

    Logger.log('ui', 'Escape menu opened');
  }

  onResumeCallback(cb: () => void) { this.onResume = cb; }
  onSaveCallback(cb: () => void) { this.onSave = cb; }
  onSettingsCallback(cb: () => void) { this.onSettings = cb; }
  onSaveAndExitCallback(cb: () => void) { this.onSaveAndExit = cb; }

  showSaveToast() {
    if (this.toastText) {
      this.toastText.visible = true;
      this.saveToastTimer = 90;
    }
  }

  update() {
    if (this.saveToastTimer > 0) {
      this.saveToastTimer--;
      if (this.saveToastTimer <= 0 && this.toastText) {
        this.toastText.visible = false;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 1: Create `src/ui/EscapeMenu.ts`** with complete content above

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```
git add src/ui/EscapeMenu.ts
git commit -m "feat: add EscapeMenu with resume/save/settings/save&exit"
```

---

### Task 5: Integrate Save/Load into Game.ts

**Files:**
- Modify: `src/core/Game.ts`

**Changes:**

1. Add imports at top:
```typescript
import { SaveManager, SaveData, SerializedInventorySlot, SerializedItem } from './SaveManager';
import { EscapeMenu } from '../ui/EscapeMenu';
import { SaveSlotScreen } from '../ui/SaveSlotScreen';
import { SettingsPlaceholder } from '../ui/SettingsPlaceholder';
import { ALL_SKILLS } from './SkillDefs';
```

2. Add new fields after line ~101 (`bossSpawned`):
```typescript
private currentSaveSlot: number | null = null;
private autoSaveTimer = 0;
private escapeMenuOpen = false;
private escapeMenu?: EscapeMenu;
private saveSlotScreen?: SaveSlotScreen;
private settingsPlaceholder?: SettingsPlaceholder;
private wasEscapeKeyDown = false;
```

3. Add import for ALL_SKILLS. We need to construct it in SkillDefs.ts or import the individual arrays. Let's add ALL_SKILLS to SkillDefs.ts:

In `src/core/SkillDefs.ts`, add at the end:
```typescript
export const ALL_SKILLS: SkillDef[] = [
  ...WARRIOR_MAIN, ...WARRIOR_SUPPORT,
  ...RANGER_MAIN, ...RANGER_SUPPORT,
  ...MONK_MAIN, ...MONK_SUPPORT,
];
```

4. Replace `startGame` method with the new game flow. Change `showMainMenu` to wire Continue/Load Game:

Update `showMainMenu`:
```typescript
private showMainMenu() {
  this.state = State.Menu;
  this.mainMenu = new MainMenu(SCREEN_WIDTH, SCREEN_HEIGHT);
  this.mainMenu.onStart(() => this.showClassSelect());
  this.mainMenu.onContinue(() => {
    const slot = SaveManager.getFirstOccupiedSlot();
    if (slot >= 0) this.loadGame(slot);
  });
  this.mainMenu.onLoadGame(() => this.showSaveSlotScreen('load'));
  this.app.stage.addChild(this.mainMenu.container);
}
```

5. Add `loadGame` method:
```typescript
private loadGame(slotIndex: number) {
  const data = SaveManager.loadFromSlot(slotIndex);
  if (!data) return;

  this.state = State.Playing;
  this.currentSaveSlot = slotIndex;
  this.autoSaveTimer = 0;

  this.gameContainer = new Container();
  this.camera = new Camera(SCREEN_WIDTH, SCREEN_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT);
  this.gameContainer.x = 0;
  this.gameContainer.y = 0;
  this.app.stage.addChild(this.gameContainer);

  this.room = new Room();
  this.gameContainer.addChild(this.room.container);

  // Create player with saved state
  this.player = new Player(data.player.x, data.player.y, data.classType);
  this.player.level = data.player.level;
  this.player.xp = data.player.xp;
  this.player.gold = data.player.gold;
  this.player.health = data.player.health;
  this.player.mana = data.player.mana;
  this.player.attrs = { ...data.player.attrs };
  this.player.unspentAttrPoints = data.player.unspentAttrPoints;
  this.player.passivePoints = data.player.passivePoints;

  // Restore passive tree allocations
  this.player.passiveTree = new PassiveTree();
  // De-allocate everything except start, then re-allocate saved nodes
  // Since PassiveTree.allocate requires available nodes, and we need to
  // reset the tree first, then allocate from scratch
  for (const nodeId of data.player.passiveTree.allocatedNodeIds) {
    this.player.passiveTree.allocate(nodeId);
  }

  // Restore inventory
  this.player.inventory = this.deserializeInventory(data.player.inventory);

  // Restore equipment
  this.player.equipment = this.deserializeEquipment(data.player.equipment);

  // Restore skill slots
  for (let i = 0; i < data.player.skills.slotIds.length && i < 6; i++) {
    const skillId = data.player.skills.slotIds[i];
    if (skillId) {
      const skill = ALL_SKILLS.find(s => s.id === skillId);
      if (skill) this.player.skills.slots[i] = skill;
    }
  }
  if (data.classType === 'monk' && data.player.skills.currentStance) {
    this.player.skills.currentStance = data.player.skills.currentStance;
  }
  // Re-set mainAbility
  this.player.skills.mainAbility = this.player.skills.slots[0];

  this.player.recalcStats();

  this.gameContainer.addChild(this.player.sprite);
  this.gameContainer.addChild(this.combatText.container);

  this.hud = new HUD();
  this.app.stage.addChild(this.hud.container);
  this.skillBar = new SkillBar();
  this.app.stage.addChild(this.skillBar.container);
  this.minimap = new Minimap();
  this.app.stage.addChild(this.minimap.container);

  // Restore zone state
  this.zoneManager = new ZoneManager();
  for (const zoneId of data.zone.completedZoneIds) {
    this.zoneManager.completedZoneIds.add(zoneId);
  }
  this.zoneManager.transitionTo(data.zone.currentZoneId, data.zone.currentRoomIndex);
  this.buildCurrentZoneRoom();

  Logger.log('game', `Loaded save slot ${slotIndex}: ${data.playerName} level ${data.level}`);
}
```

6. Add `saveGame` method:
```typescript
private saveGame() {
  if (!this.player || this.currentSaveSlot === null) return;
  const p = this.player;

  const data: SaveData = {
    version: 1,
    timestamp: Date.now(),
    playerName: p.classType.charAt(0).toUpperCase() + p.classType.slice(1),
    level: p.level,
    classType: p.classType,
    zone: {
      currentZoneId: this.zoneManager.zoneId,
      currentRoomIndex: this.zoneManager.roomIndex,
      completedZoneIds: [...this.zoneManager.completedZoneIds],
    },
    player: {
      x: p.x, y: p.y,
      health: p.health, mana: p.mana,
      gold: p.gold,
      level: p.level, xp: p.xp,
      attrs: { ...p.attrs },
      unspentAttrPoints: p.unspentAttrPoints,
      passivePoints: p.passivePoints,
      inventory: this.serializeInventory(p.inventory),
      equipment: this.serializeEquipment(p.equipment),
      skills: {
        slotIds: p.skills.slots.map(s => s?.id ?? null),
        currentStance: p.classType === 'monk' ? p.skills.currentStance : undefined,
      },
      passiveTree: {
        allocatedNodeIds: [...p.passiveTree.allocated],
      },
    },
  };

  SaveManager.saveToSlot(this.currentSaveSlot, data);
  Logger.log('game', `Auto-saved to slot ${this.currentSaveSlot}`);
}
```

7. Add serialization helpers:
```typescript
private serializeInventory(inv: InventorySlot[]): SerializedInventorySlot[] {
  return inv.map(slot => {
    if (!slot) return null;
    if (slot.kind === 'orb') return { kind: 'orb', orbId: slot.orbId, count: slot.count };
    const item = slot.item;
    return {
      kind: 'equip',
      item: {
        baseId: item.base.id,
        rarity: item.rarity,
        affixes: item.affixes.map(a => ({ affixId: a.affix.id, roll: a.roll })),
        uniqueId: item.uniqueId,
        damageRoll: item.damageRoll,
        computedName: item.computedName,
        ilvl: item.ilvl,
        levelReq: item.levelReq,
      },
    };
  });
}

private deserializeInventory(data: SerializedInventorySlot[]): InventorySlot[] {
  return data.map(slot => {
    if (!slot) return null;
    if (slot.kind === 'orb') return { kind: 'orb', orbId: slot.orbId, count: slot.count };
    return {
      kind: 'equip',
      item: this.deserializeItem(slot.item),
    };
  });
}

private serializeEquipment(equip: Record<Slot, GeneratedItem | null>): Record<string, SerializedItem | null> {
  const result: Record<string, SerializedItem | null> = {};
  for (const [key, item] of Object.entries(equip)) {
    if (!item) { result[key] = null; continue; }
    result[key] = {
      baseId: item.base.id,
      rarity: item.rarity,
      affixes: item.affixes.map(a => ({ affixId: a.affix.id, roll: a.roll })),
      uniqueId: item.uniqueId,
      damageRoll: item.damageRoll,
      computedName: item.computedName,
      ilvl: item.ilvl,
      levelReq: item.levelReq,
    };
  }
  return result;
}

private deserializeEquipment(data: Record<string, SerializedItem | null>): Record<Slot, GeneratedItem | null> {
  const result: Record<Slot, GeneratedItem | null> = {
    weapon: null, body: null, helmet: null, boots: null,
    ring: null, ring2: null, amulet: null,
  };
  for (const [key, item] of Object.entries(data)) {
    if (!item) continue;
    if (key in result) {
      (result as any)[key] = this.deserializeItem(item);
    }
  }
  return result;
}

private deserializeItem(data: SerializedItem): GeneratedItem {
  const base = ITEM_BASES.find(b => b.id === data.baseId);
  if (!base) throw new Error(`Unknown base: ${data.baseId}`);
  const affixes = data.affixes.map(a => {
    const affix = AFFIXES.find(af => af.id === a.affixId);
    if (!affix) throw new Error(`Unknown affix: ${a.affixId}`);
    return { affix, roll: a.roll };
  });
  const stats: Record<string, number> = { ...base.innateStats };
  if (data.damageRoll > 0) stats.damage = data.damageRoll;
  for (const a of affixes) {
    stats[a.affix.stat] = (stats[a.affix.stat] || 0) + a.roll;
  }
  return {
    base,
    rarity: data.rarity,
    affixes,
    uniqueId: data.uniqueId,
    damageRoll: data.damageRoll,
    computedName: data.computedName,
    computedStats: stats,
    ilvl: data.ilvl,
    levelReq: data.levelReq,
    id: `restored_${data.baseId}_${Date.now()}`,
  };
}
```

8. Add `exitToMenu` method:
```typescript
private exitToMenu() {
  this.saveGame();
  this.cleanupGameSession();
  this.currentSaveSlot = null;
  this.autoSaveTimer = 0;
  this.showMainMenu();
}

private cleanupGameSession() {
  if (this.escapeMenuOpen) this.toggleEscapeMenu();
  if (this.inventoryOpen) this.toggleInventory();
  if (this.treeOpen) this.toggleTree();
  if (this.deathScreen) {
    this.app.stage.removeChild(this.deathScreen.container);
    this.deathScreen.destroy();
    this.deathScreen = undefined;
  }
  if (this.hud) { this.app.stage.removeChild(this.hud.container); this.hud.destroy(); this.hud = undefined; }
  if (this.skillBar) { this.app.stage.removeChild(this.skillBar.container); this.skillBar.destroy(); this.skillBar = undefined; }
  if (this.minimap) { this.app.stage.removeChild(this.minimap.container); this.minimap.destroy(); this.minimap = undefined; }
  if (this.escapeMenu) { this.app.stage.removeChild(this.escapeMenu.container); this.escapeMenu.destroy(); this.escapeMenu = undefined; }
  if (this.saveSlotScreen) { this.app.stage.removeChild(this.saveSlotScreen.container); this.saveSlotScreen.destroy(); this.saveSlotScreen = undefined; }
  if (this.settingsPlaceholder) { this.app.stage.removeChild(this.settingsPlaceholder.container); this.settingsPlaceholder.destroy(); this.settingsPlaceholder = undefined; }
  if (this.tutorialScreen) {
    this.app.stage.removeChild(this.tutorialScreen.container);
    this.tutorialScreen.destroy();
    this.tutorialScreen = undefined;
  }
  this.tutorialStage = null;
  this.tutorialKeys = new Set();
  this.tutorialKeyWasDown = new Set();
  if (this.boss) {
    if (this.boss.sprite.parent && this.gameContainer) this.gameContainer.removeChild(this.boss.sprite);
    if (this.boss.telegraphs.parent && this.gameContainer) this.gameContainer.removeChild(this.boss.telegraphs);
    this.boss.destroy();
    this.boss = null;
  }
  if (this.bossHpBar) {
    this.app.stage.removeChild(this.bossHpBar.container);
    this.bossHpBar.destroy();
    this.bossHpBar = undefined;
  }
  this.bossSpawned = false;
  if (this.gameContainer) {
    this.app.stage.removeChild(this.gameContainer);
    this.gameContainer.destroy({ children: true });
    this.gameContainer = undefined;
  }
  this.devConsole.hide();
  this.enemies = [];
  for (const p of this.projectiles) { p.destroy(); }
  this.projectiles = [];
  this.itemDrops = [];
  this.vfx = [];
  this.waveCooldown = 0;
  this.zoneManager = new ZoneManager();
  if (this.recallPortal) { this.recallPortal.graphic.destroy(); this.recallPortal = null; }
  this.dash = null;
  this.combatText.destroy();
  this.combatText = new CombatTextManager();
  this.player = undefined;
  this.room = undefined;
  this.input.reset();
  this.lastKeys.clear();
  this.escapeMenuOpen = false;
}
```

9. Add `toggleEscapeMenu` method:
```typescript
private toggleEscapeMenu() {
  if (!this.player) return;
  this.escapeMenuOpen = !this.escapeMenuOpen;
  if (this.escapeMenuOpen) {
    this.escapeMenu = new EscapeMenu(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.escapeMenu.onResumeCallback(() => this.toggleEscapeMenu());
    this.escapeMenu.onSaveCallback(() => {
      this.saveGame();
      this.escapeMenu?.showSaveToast();
    });
    this.escapeMenu.onSettingsCallback(() => this.showSettingsPlaceholder());
    this.escapeMenu.onSaveAndExitCallback(() => this.exitToMenu());
    this.app.stage.addChild(this.escapeMenu.container);
  } else {
    if (this.settingsPlaceholder) {
      this.app.stage.removeChild(this.settingsPlaceholder.container);
      this.settingsPlaceholder.destroy();
      this.settingsPlaceholder = undefined;
    }
    if (this.escapeMenu) {
      this.app.stage.removeChild(this.escapeMenu.container);
      this.escapeMenu.destroy();
      this.escapeMenu = undefined;
    }
  }
}
```

10. Add `showSettingsPlaceholder` method:
```typescript
private showSettingsPlaceholder() {
  if (!this.settingsPlaceholder) {
    this.settingsPlaceholder = new SettingsPlaceholder(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.settingsPlaceholder.onBackCallback(() => {
      if (this.settingsPlaceholder) {
        this.app.stage.removeChild(this.settingsPlaceholder.container);
        this.settingsPlaceholder.destroy();
        this.settingsPlaceholder = undefined;
      }
    });
    this.app.stage.addChild(this.settingsPlaceholder.container);
  }
}
```

11. Add `showSaveSlotScreen` method:
```typescript
private showSaveSlotScreen(mode: 'load' | 'save') {
  this.saveSlotScreen = new SaveSlotScreen(SCREEN_WIDTH, SCREEN_HEIGHT, mode);
  this.saveSlotScreen.onSelectCallback((index: number) => {
    if (this.saveSlotScreen) {
      this.app.stage.removeChild(this.saveSlotScreen.container);
      this.saveSlotScreen.destroy();
      this.saveSlotScreen = undefined;
    }
    if (mode === 'load') {
      this.loadGame(index);
    }
  });
  this.saveSlotScreen.onBackCallback(() => {
    if (this.saveSlotScreen) {
      this.app.stage.removeChild(this.saveSlotScreen.container);
      this.saveSlotScreen.destroy();
      this.saveSlotScreen = undefined;
    }
    this.showMainMenu();
  });
  this.app.stage.addChild(this.saveSlotScreen.container);
}
```

12. In the `update` method, add escape key handling in the Playing state (before the tutorial block, after dev console check):
```typescript
if (this.input.isKeyDown('Escape')) {
  if (!this.wasEscapeKeyDown) {
    if (!this.inventoryOpen && !this.treeOpen) {
      this.toggleEscapeMenu();
    } else if (this.inventoryOpen) {
      this.toggleInventory();
    }
    this.wasEscapeKeyDown = true;
  }
} else {
  this.wasEscapeKeyDown = false;
}
if (this.escapeMenuOpen) {
  this.escapeMenu?.update();
  return; // block all other gameplay while escape menu is open
}
```

Remove the existing Escape handling for inventory (the block `if (this.inventoryOpen && this.input.isKeyDown('Escape')) { this.toggleInventory(); }`) since the new code above replaces it.

13. In `updateGameplay`, add auto-save:
```typescript
// Auto-save every 3600 frames (60s)
this.autoSaveTimer += dt;
if (this.autoSaveTimer >= 3600) {
  this.autoSaveTimer = 0;
  this.saveGame();
}
```

Add this at the beginning of `updateGameplay` after the `if (!this.player?.alive || !this.room) return;` guard.

14. Remove old Escape key handling. In the `update` method, locate the block:
```typescript
if (this.inventoryOpen && this.input.isKeyDown('Escape')) {
  this.toggleInventory();
}
```
Replace the entire inventory/tree/escape section in the Playing state with the new flow.

The new `update` method should look like:
```typescript
private update(dt: number) {
  if (this.state === State.Playing) {
    // Dev console toggle
    if (this.input.isKeyDown('Backquote')) {
      if (!this._consoleKeyWasDown) {
        this.devConsole.toggle();
        this._consoleKeyWasDown = true;
      }
    } else {
      this._consoleKeyWasDown = false;
    }
    if (this.devConsole.isVisible()) return;

    // Escape key handling
    if (this.input.isKeyDown('Escape')) {
      if (!this.wasEscapeKeyDown) {
        if (!this.inventoryOpen && !this.treeOpen) {
          this.toggleEscapeMenu();
        } else if (this.inventoryOpen) {
          this.toggleInventory();
        }
        this.wasEscapeKeyDown = true;
      }
    } else {
      this.wasEscapeKeyDown = false;
    }
    if (this.escapeMenuOpen) {
      this.escapeMenu?.update();
      return;
    }
  }

  switch (this.state) {
    case State.Menu:
      this.mainMenu?.update(this.input);
      break;
    case State.Picking:
      this.classSelect?.update(this.input);
      this.abilitySelect?.update(this.input);
      break;
    case State.Playing:
      if (this.inventoryOpen) {
        this.updateInventory();
      } else if (this.treeOpen) {
        this.updateTree();
      } else {
        this.updateGameplay(dt);
      }
      break;
    case State.Death: this.deathScreen?.update(this.input); break;
  }
}
```

15. In `startGame`, set `currentSaveSlot` and initialize auto-save:
```typescript
private startGame(classType: ClassType, abilityId: string) {
  // ... existing cleanup ...
  this.currentSaveSlot = SaveManager.getFirstEmptySlot();
  this.autoSaveTimer = 0;
  // ... rest of startGame ...
}
```

- [ ] **Step 1: Add `ALL_SKILLS` export to `src/core/SkillDefs.ts`**

```typescript
export const ALL_SKILLS: SkillDef[] = [
  ...WARRIOR_MAIN, ...WARRIOR_SUPPORT,
  ...RANGER_MAIN, ...RANGER_SUPPORT,
  ...MONK_MAIN, ...MONK_SUPPORT,
];
```

Add this at the end of the file.

- [ ] **Step 2: Modify `src/core/Game.ts`** — Add all imports, fields, and methods described above. Replace `startGame`, add `saveGame`, `loadGame`, `exitToMenu`, `cleanupGameSession`, `toggleEscapeMenu`, `showSettingsPlaceholder`, `showSaveSlotScreen`, serialization helpers, and update the `update` method.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```
git add src/core/SkillDefs.ts src/core/Game.ts
git commit -m "feat: integrate save/load into Game.ts with auto-save and escape menu"
```

---

### Task 6: Update MainMenu with Continue/Load Game

**Files:**
- Modify: `src/ui/MainMenu.ts`

```typescript
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { SaveManager } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export class MainMenu {
  container: Container;
  private startCallback: StartCallback = () => {};
  private continueCallback: ContinueCallback = () => {};
  private loadGameCallback: LoadGameCallback = () => {};
  private startButton!: Container;
  private continueButton!: Container;
  private loadGameButton!: Container;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();

    const accent = new Graphics();
    accent.beginFill(0x1a1a2e);
    accent.drawRect(0, 0, screenWidth, 4);
    accent.drawRect(0, screenHeight - 4, screenWidth, 4);
    accent.endFill();

    this.container.addChild(bg, accent);

    const title = new Text('TinyARPG', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 72,
      fill: ['#c0a060', '#8a6a30'],
      stroke: '#000',
      strokeThickness: 4,
      letterSpacing: 8,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = screenHeight / 3;
    this.container.addChild(title);

    const subtitle = new Text('A Tiny Action RPG', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 20,
      fill: '#6a6a7a',
      letterSpacing: 4,
    }));
    subtitle.anchor.set(0.5);
    subtitle.x = screenWidth / 2;
    subtitle.y = screenHeight / 3 + 60;
    this.container.addChild(subtitle);

    const centerY = screenHeight / 2 + 40;
    this.createStartButton(screenWidth / 2, centerY);
    this.createContinueButton(screenWidth / 2, centerY + 60);
    this.createLoadGameButton(screenWidth / 2, centerY + 120);

    const tip = new Text('WASD to move, mouse to aim', new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 16,
      fill: '#4a4a5a',
      fontStyle: 'italic',
    }));
    tip.anchor.set(0.5);
    tip.x = screenWidth / 2;
    tip.y = screenHeight / 2 + 200;
    this.container.addChild(tip);

    Logger.log('ui', 'Main menu created');
  }

  private createButton(x: number, y: number, text: string, width: number = 180): Container {
    const btn = new Container();
    const btnBg = new Graphics();
    btnBg.beginFill(0x2a2a3a);
    btnBg.drawRoundedRect(-width / 2, -18, width, 36, 4);
    btnBg.endFill();
    const btnBorder = new Graphics();
    btnBorder.lineStyle(1, 0x5a4a2a);
    btnBorder.drawRoundedRect(-width / 2, -18, width, 36, 4);
    const btnText = new Text(text, new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fill: '#c0a060',
      letterSpacing: 2,
    }));
    btnText.anchor.set(0.5);
    btn.addChild(btnBg, btnBorder, btnText);
    btn.x = x;
    btn.y = y;
    this.container.addChild(btn);
    return btn;
  }

  private createStartButton(x: number, y: number) {
    this.startButton = this.createButton(x, y, 'New Game', 180);
    Logger.log('ui', `Start button at (${x}, ${y})`);
  }

  private createContinueButton(x: number, y: number) {
    const hasSaves = SaveManager.getFirstOccupiedSlot() >= 0;
    this.continueButton = this.createButton(x, y, 'Continue', 180);
    if (!hasSaves) {
      this.continueButton.alpha = 0.4;
    }
    Logger.log('ui', `Continue button at (${x}, ${y})`);
  }

  private createLoadGameButton(x: number, y: number) {
    this.loadGameButton = this.createButton(x, y, 'Load Game', 180);
    Logger.log('ui', `Load Game button at (${x}, ${y})`);
  }

  onStart(callback: StartCallback) { this.startCallback = callback; }
  onContinue(callback: ContinueCallback) { this.continueCallback = callback; }
  onLoadGame(callback: LoadGameCallback) { this.loadGameCallback = callback; }

  update(input: InputManager) {
    if (!input.consumeClick()) return;

    const checkClick = (btn: Container, cb: () => void) => {
      const bounds = btn.getBounds();
      if (input.mouseX >= bounds.x && input.mouseX <= bounds.x + bounds.width &&
          input.mouseY >= bounds.y && input.mouseY <= bounds.y + bounds.height) {
        cb();
      }
    };

    checkClick(this.startButton, () => { Logger.log('ui', 'Start button clicked'); this.startCallback(); });
    checkClick(this.continueButton, () => {
      if (SaveManager.getFirstOccupiedSlot() >= 0) {
        Logger.log('ui', 'Continue button clicked');
        this.continueCallback();
      }
    });
    checkClick(this.loadGameButton, () => {
      Logger.log('ui', 'Load Game button clicked');
      this.loadGameCallback();
    });
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}

type StartCallback = () => void;
type ContinueCallback = () => void;
type LoadGameCallback = () => void;
```

- [ ] **Step 1: Replace `src/ui/MainMenu.ts`** with the updated version above

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```
git add src/ui/MainMenu.ts
git commit -m "feat: add Continue and Load Game buttons to main menu"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Final commit**

```
git add -A
git commit -m "feat: complete save/load system with 5 slots, escape menu, auto-save"
```
