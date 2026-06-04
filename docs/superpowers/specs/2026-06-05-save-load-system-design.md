# Save/Load System — Design Spec

## Overview

Persistent game state via localStorage with 5 save slots, manual + auto-save (every 60s), delete capability, and an escape menu with placeholder settings panel.

## localStorage Schema

| Key | Value |
|---|---|
| `TinyARPG_meta` | `(SlotMeta \| null)[]` (length 5) |
| `TinyARPG_save_0` – `TinyARPG_save_4` | Serialized `SaveData` JSON |
| `TinyARPG_settings` | Placeholder settings JSON |

### SlotMeta

```typescript
interface SlotMeta {
  occupied: boolean;
  playerName: string;         // e.g. "Warrior", "Ranger", "Monk"
  classType: string;
  level: number;
  timestamp: number;          // Date.now()
  zoneName: string;           // e.g. "Verdant Forest"
}
```

### SaveData (versioned)

```typescript
interface SaveData {
  version: 1;
  timestamp: number;
  playerName: string;
  level: number;
  classType: 'warrior' | 'ranger' | 'monk';
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

type SerializedInventorySlot =
  | { kind: 'equip'; item: SerializedItem }
  | { kind: 'orb'; orbId: string; count: number }
  | null;

interface SerializedItem {
  baseId: string;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  affixes: { affixId: string; roll: number }[];
  uniqueId?: string;
  damageRoll: number;
  computedName: string;
  ilvl: number;
  levelReq: number;
}
```

**What is NOT saved:** cooldowns, active buffs, runtime timers, enemies, projectiles, ground items, VFX, chests, breakables, dash state, channel timers, slow debuffs, invuln timers.

## SaveManager (`src/core/SaveManager.ts`)

Static utility class (no instantiation). Public API:

| Method | Returns | Description |
|---|---|---|
| `getAllSlots()` | `SlotMeta[]` | Reads and returns all 5 slot metas |
| `getSlotMeta(index)` | `SlotMeta \| null` | Single slot metadata |
| `saveToSlot(index, data: SaveData)` | `void` | Serializes and writes save + meta |
| `loadFromSlot(index)` | `SaveData` | Reads blob, resolves refs, returns data |
| `deleteSlot(index)` | `void` | Removes save and clears meta entry |
| `loadSettings()` | `object` | Reads settings |
| `saveSettings(settings)` | `void` | Writes settings |

**Ref resolution on load:**
- `baseId` → `ITEM_BASES` lookup (ItemDefs.ts)
- `affixId` → `ALL_AFFIXES` lookup (ItemDefs.ts)
- Skill IDs → `ALL_SKILLS` lookup (SkillDefs.ts)
- All via simple `.find()` loops

**Auto-save:** Called from `Game.ts` game loop every 3600 frames (60s at 60fps). Stores current slot index in meta.

## Game Integration (`src/core/Game.ts`)

### New fields
- `currentSaveSlot: number | null` — tracks which slot this session belongs to
- `autoSaveTimer: number` — counts frames for auto-save interval (3600)

### New methods
- `newGame(classType, slotIndex)` — creates fresh player, sets slot
- `loadGame(slotIndex)` — calls SaveManager.loadFromSlot, wires state to player/zoneManager, rebuilds room
- `saveGame()` — calls SaveManager.saveToSlot with current game state
- `exitToMenu()` — saves, transitions to Menu state, removes all runtime children

### Menu → Game transition
- "New Game" with slot selection → `newGame(classType, slotIndex)`
- "Continue" → loads last played slot (first occupied slot)
- "Load Game" → slot picker → `loadGame(slotIndex)`

## UI Components

### SaveSlotScreen (`src/ui/SaveSlotScreen.ts`)

Full-screen overlay for selecting save slots. Used from main menu.

**Layout:**
- Title: "Select Save Slot" (or "Load Game")
- 5 slot cards stacked vertically, centered
- Each card shows:
  - Slot number (1-5)
  - If occupied: class icon/name, level, zone name, timestamp
  - If empty: "Empty Slot"
- Click occupied slot → shows two buttons: Load / Delete
- Click empty slot → (from New Game flow) selects slot
- Delete → confirmation text "Delete this save?" with Yes/No
- Back button → returns to main menu

**Props:** `mode: 'new' | 'load' | 'save'`, `onSelect(index: number)`, `onBack()`

### EscapeMenu (`src/ui/EscapeMenu.ts`)

In-game overlay toggled by Escape key.

**Layout:**
- Dark semi-transparent overlay
- Centered panel with buttons:
  - **Resume** — closes menu, resumes game
  - **Save** — saves to current slot, shows "Game Saved!" toast for ~1.5s
  - **Settings** — opens Settings placeholder panel
  - **Save & Exit** — saves then calls `exitToMenu()`
- Clicking outside the panel or pressing Escape again closes it

**Behavior:**
- `Game.inputMode = 'ui'` blocks game input while open
- Container added to `app.stage` (screen-space)

### SettingsPlaceholder (`src/ui/SettingsPlaceholder.ts`)

Accessed from Escape menu.

**Layout:**
- Panel with sections (visual only, no wiring):
  - **Audio**: Music Volume slider (0-100), SFX Volume slider (0-100)
  - **Graphics**: Quality dropdown (Low / Medium / High)
  - **Controls**: Key binding list (WASD, Skill 1-6, Interact, Inventory, Passive Tree, Escape)
- Back button → returns to escape menu

## Main Menu Updates (`src/ui/MainMenu.ts`)

Add buttons:
- **Continue** — loads first occupied slot, or dimmed if none
- **Load Game** — opens SaveSlotScreen in 'load' mode
- **New Game** — goes to class select, then SaveSlotScreen in 'new' mode

## Auto-Save Timer

In `Game.ts` `updateGameplay()`:
- Increment `autoSaveTimer` each frame while `state === Playing`
- When `autoSaveTimer >= 3600` (60s): set to 0, call `saveGame()`
- Only auto-saves if `currentSaveSlot !== null` and player is alive

## Error Handling

- **Save corruption:** JSON parse failure in `loadFromSlot` → return `null`, show "Save corrupted" message
- **localStorage full:** Wrap writes in try/catch, show "Storage full" on failure
- **Missing refs:** If a baseId/affixId/skillId can't be found on load, log a warning and skip it (graceful degradation)

## Files to Create

| File | Purpose |
|---|---|
| `src/core/SaveManager.ts` | Serialization/deserialization, localStorage I/O |
| `src/ui/SaveSlotScreen.ts` | Slot selection overlay |
| `src/ui/EscapeMenu.ts` | In-game escape menu |
| `src/ui/SettingsPlaceholder.ts` | Visual-only settings panel |

## Files to Modify

| File | Changes |
|---|---|
| `src/core/Game.ts` | currentSaveSlot, autoSaveTimer, saveGame(), loadGame(), exitToMenu(), escape key handler |
| `src/ui/MainMenu.ts` | Continue, Load Game buttons, route to SaveSlotScreen |
| `src/entities/Player.ts` | Serialization helpers? (toSaveData / fromSaveData) — optional, could do inline in SaveManager |
