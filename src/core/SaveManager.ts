import { ClassType } from './SkillDefs';

const SAVE_PREFIX = 'TinyARPG_save_';
const META_KEY = 'TinyARPG_meta';
const SLOT_COUNT = 5;
const SAVE_VERSION = 1;

export interface SlotMeta {
  occupied: boolean;
  playerName: string;
  classType: string;
  level: number;
  timestamp: number;
  zoneName: string;
}

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

export interface StashTab {
  name: string;
  slots: (SerializedInventorySlot | null)[];
}

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
  stashData?: {
    tabs: StashTab[];
  };
}

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
      if (data.version !== SAVE_VERSION) {
        console.warn(`Save version ${data.version} doesn't match current version ${SAVE_VERSION} — ignoring save`);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  static deleteSlot(index: number): void {
    if (index < 0 || index >= SLOT_COUNT) return;
    try {
      localStorage.removeItem(`${SAVE_PREFIX}${index}`);
    } catch (e) {
      console.error('Delete failed:', e);
      return;
    }
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
