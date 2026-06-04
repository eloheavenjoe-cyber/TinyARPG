export type Slot = 'weapon' | 'body' | 'helmet' | 'boots' | 'ring' | 'ring2' | 'amulet';
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
