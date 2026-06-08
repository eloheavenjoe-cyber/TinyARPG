export type UrnShape = 'urn' | 'coffer' | 'casket' | 'vessel' | 'vault';

export interface UrnTypeConfig {
  id: string;
  name: string;
  lootCategory: string;
  bgColor: number;
  accentColor: number;
  shape: UrnShape;
}

export const URN_TYPES: UrnTypeConfig[] = [
  { id: 'reliquary', name: 'Reliquary of Arms', lootCategory: 'Weapons & Armour', bgColor: 0x5a5a6e, accentColor: 0x888899, shape: 'urn' },
  { id: 'miser', name: "The Miser's Coffer", lootCategory: 'Currency & Crafting', bgColor: 0x8a7a3a, accentColor: 0xccbb44, shape: 'coffer' },
  { id: 'adornments', name: 'Casket of Adornments', lootCategory: 'Rings, Amulets & Jewellery', bgColor: 0x4a2a5a, accentColor: 0xaa44cc, shape: 'casket' },
  { id: 'alchemist', name: "The Alchemist's Vessel", lootCategory: 'Flasks & Consumables', bgColor: 0x3a5a3a, accentColor: 0x66cc66, shape: 'vessel' },
  { id: 'forgotten', name: 'Vault of the Forgotten', lootCategory: 'Mixed Rare Items', bgColor: 0x5a4a3a, accentColor: 0xccccaa, shape: 'vault' },
];

export interface UrnSpawnConfig {
  minPerZone: number;
  maxPerZone: number;
  maxRarePerZone: number;
}

export const URN_SPAWN_CONFIG: UrnSpawnConfig = {
  minPerZone: 1,
  maxPerZone: 2,
  maxRarePerZone: 1,
};

export function rollUrnType(): UrnTypeConfig {
  return URN_TYPES[Math.floor(Math.random() * URN_TYPES.length)];
}

export function rollUrnRarity(): 'normal' | 'magic' | 'rare' {
  const r = Math.random() * 100;
  if (r < 60) return 'normal';
  if (r < 90) return 'magic';
  return 'rare';
}

export function getUrnCurseCount(rarity: 'normal' | 'magic' | 'rare'): number {
  switch (rarity) {
    case 'normal': return 1;
    case 'magic': return 2;
    case 'rare': return Math.random() < 0.5 ? 3 : 4;
    default: return 1;
  }
}

export function getUrnRarityWeight(rarity: 'normal' | 'magic' | 'rare'): number {
  switch (rarity) {
    case 'normal': return 60;
    case 'magic': return 30;
    case 'rare': return 10;
  }
}
