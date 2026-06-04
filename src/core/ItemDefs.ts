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
  tier: number;
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
  // === PREFIXES ===
  // HP
  { id: 'garnished', name: 'Garnished', type: 'prefix', stat: 'hp', min: 5, max: 15, tier: 1 },
  { id: 'polished', name: 'Polished', type: 'prefix', stat: 'hp', min: 12, max: 30, tier: 2 },
  { id: 'jeweled', name: 'Jeweled', type: 'prefix', stat: 'hp', min: 25, max: 50, tier: 3 },
  // Armor
  { id: 'sturdy', name: 'Sturdy', type: 'prefix', stat: 'armor', min: 3, max: 10, tier: 1 },
  { id: 'fortified', name: 'Fortified', type: 'prefix', stat: 'armor', min: 6, max: 18, tier: 2 },
  { id: 'reinforced', name: 'Reinforced', type: 'prefix', stat: 'armor', min: 12, max: 30, tier: 3 },
  // Damage
  { id: 'sharp', name: 'Sharp', type: 'prefix', stat: 'damage', min: 1, max: 5, tier: 1 },
  { id: 'razor', name: 'Razor', type: 'prefix', stat: 'damage', min: 3, max: 9, tier: 2 },
  { id: 'keen', name: 'Keen', type: 'prefix', stat: 'damage', min: 6, max: 15, tier: 3 },
  // Damage %
  { id: 'spiked', name: 'Spiked', type: 'prefix', stat: 'damagePct', min: 5, max: 15, tier: 1 },
  { id: 'jagged', name: 'Jagged', type: 'prefix', stat: 'damagePct', min: 10, max: 25, tier: 2 },
  { id: 'serrated', name: 'Serrated', type: 'prefix', stat: 'damagePct', min: 18, max: 35, tier: 3 },
  // Attack Speed %
  { id: 'quick', name: 'Quick', type: 'prefix', stat: 'attackSpeedPct', min: 3, max: 10, tier: 1 },
  { id: 'swift', name: 'Swift', type: 'prefix', stat: 'attackSpeedPct', min: 6, max: 16, tier: 2 },
  { id: 'rapid', name: 'Rapid', type: 'prefix', stat: 'attackSpeedPct', min: 10, max: 22, tier: 3 },
  // Mana
  { id: 'arcane', name: 'Arcane', type: 'prefix', stat: 'mana', min: 5, max: 15, tier: 1 },
  { id: 'sorcerous', name: 'Sorcerous', type: 'prefix', stat: 'mana', min: 10, max: 25, tier: 2 },
  { id: 'mystical', name: 'Mystical', type: 'prefix', stat: 'mana', min: 20, max: 40, tier: 3 },
  // Melee Dmg %
  { id: 'fierce', name: 'Fierce', type: 'prefix', stat: 'meleeDmgPct', min: 5, max: 12, tier: 1 },
  { id: 'savage', name: 'Savage', type: 'prefix', stat: 'meleeDmgPct', min: 10, max: 20, tier: 2 },
  { id: 'furious', name: 'Furious', type: 'prefix', stat: 'meleeDmgPct', min: 16, max: 30, tier: 3 },
  // Projectile Dmg %
  { id: 'piercing', name: 'Piercing', type: 'prefix', stat: 'projectileDmgPct', min: 5, max: 12, tier: 1 },
  { id: 'penetrating', name: 'Penetrating', type: 'prefix', stat: 'projectileDmgPct', min: 10, max: 20, tier: 2 },
  { id: 'perforating', name: 'Perforating', type: 'prefix', stat: 'projectileDmgPct', min: 16, max: 30, tier: 3 },
  // Cold Damage
  { id: 'chilled', name: 'Chilled', type: 'prefix', stat: 'coldDmg', min: 1, max: 3, tier: 1 },
  { id: 'frosted', name: 'Frosted', type: 'prefix', stat: 'coldDmg', min: 2, max: 5, tier: 2 },
  { id: 'glacial', name: 'Glacial', type: 'prefix', stat: 'coldDmg', min: 4, max: 8, tier: 3 },
  // Lightning Damage
  { id: 'shocking', name: 'Shocking', type: 'prefix', stat: 'lightningDmg', min: 1, max: 3, tier: 1 },
  { id: 'crackling', name: 'Crackling', type: 'prefix', stat: 'lightningDmg', min: 2, max: 5, tier: 2 },
  { id: 'thunderous', name: 'Thunderous', type: 'prefix', stat: 'lightningDmg', min: 4, max: 8, tier: 3 },

  // === SUFFIXES ===
  // STR
  { id: 'of_the_ox', name: 'of the Ox', type: 'suffix', stat: 'str', min: 3, max: 8, tier: 1 },
  { id: 'of_the_bear', name: 'of the Bear', type: 'suffix', stat: 'str', min: 6, max: 14, tier: 2 },
  { id: 'of_the_titan', name: 'of the Titan', type: 'suffix', stat: 'str', min: 10, max: 22, tier: 3 },
  // DEX
  { id: 'of_the_fox', name: 'of the Fox', type: 'suffix', stat: 'dex', min: 3, max: 8, tier: 1 },
  { id: 'of_the_cat', name: 'of the Cat', type: 'suffix', stat: 'dex', min: 6, max: 14, tier: 2 },
  { id: 'of_the_panther', name: 'of the Panther', type: 'suffix', stat: 'dex', min: 10, max: 22, tier: 3 },
  // INT
  { id: 'of_the_sage', name: 'of the Sage', type: 'suffix', stat: 'int', min: 3, max: 8, tier: 1 },
  { id: 'of_the_oracle', name: 'of the Oracle', type: 'suffix', stat: 'int', min: 6, max: 14, tier: 2 },
  { id: 'of_the_archmage', name: 'of the Archmage', type: 'suffix', stat: 'int', min: 10, max: 22, tier: 3 },
  // Armor %
  { id: 'of_protection', name: 'of Protection', type: 'suffix', stat: 'armorPct', min: 5, max: 15, tier: 1 },
  { id: 'of_warding', name: 'of Warding', type: 'suffix', stat: 'armorPct', min: 10, max: 25, tier: 2 },
  { id: 'of_aegis', name: 'of Aegis', type: 'suffix', stat: 'armorPct', min: 18, max: 35, tier: 3 },
  // HP Regen
  { id: 'of_regrowth', name: 'of Regrowth', type: 'suffix', stat: 'hpRegen', min: 1, max: 3, tier: 1 },
  { id: 'of_renewal', name: 'of Renewal', type: 'suffix', stat: 'hpRegen', min: 2, max: 5, tier: 2 },
  { id: 'of_rejuvenation', name: 'of Rejuvenation', type: 'suffix', stat: 'hpRegen', min: 4, max: 8, tier: 3 },
  // Fire Damage
  { id: 'of_flames', name: 'of Flames', type: 'suffix', stat: 'fireDmg', min: 1, max: 3, tier: 1 },
  { id: 'of_inferno', name: 'of Inferno', type: 'suffix', stat: 'fireDmg', min: 2, max: 5, tier: 2 },
  { id: 'of_conflagration', name: 'of Conflagration', type: 'suffix', stat: 'fireDmg', min: 4, max: 8, tier: 3 },
  // Move Speed %
  { id: 'of_the_hare', name: 'of the Hare', type: 'suffix', stat: 'moveSpeedPct', min: 3, max: 8, tier: 1 },
  { id: 'of_the_wind', name: 'of the Wind', type: 'suffix', stat: 'moveSpeedPct', min: 6, max: 14, tier: 2 },
  { id: 'of_zephyr', name: 'of Zephyr', type: 'suffix', stat: 'moveSpeedPct', min: 10, max: 20, tier: 3 },
  // Dodge %
  { id: 'of_the_shadow', name: 'of the Shadow', type: 'suffix', stat: 'dodgePct', min: 2, max: 5, tier: 1 },
  { id: 'of_the_mist', name: 'of the Mist', type: 'suffix', stat: 'dodgePct', min: 4, max: 8, tier: 2 },
  { id: 'of_the_phantom', name: 'of the Phantom', type: 'suffix', stat: 'dodgePct', min: 6, max: 12, tier: 3 },
  // Cooldown Reduction %
  { id: 'of_celerity', name: 'of Celerity', type: 'suffix', stat: 'cooldownReductionPct', min: 2, max: 5, tier: 1 },
  { id: 'of_haste', name: 'of Haste', type: 'suffix', stat: 'cooldownReductionPct', min: 4, max: 8, tier: 2 },
  { id: 'of_alacrity', name: 'of Alacrity', type: 'suffix', stat: 'cooldownReductionPct', min: 6, max: 12, tier: 3 },
  // Mana Cost Reduction %
  { id: 'of_efficiency', name: 'of Efficiency', type: 'suffix', stat: 'manaCostReductionPct', min: 2, max: 4, tier: 1 },
  { id: 'of_conservation', name: 'of Conservation', type: 'suffix', stat: 'manaCostReductionPct', min: 3, max: 6, tier: 2 },
  { id: 'of_thrift', name: 'of Thrift', type: 'suffix', stat: 'manaCostReductionPct', min: 5, max: 8, tier: 3 },
  // Additional Projectiles
  { id: 'of_volleys', name: 'of Volleys', type: 'suffix', stat: 'additionalProjectiles', min: 1, max: 1, tier: 1 },
  { id: 'of_barrage', name: 'of Barrage', type: 'suffix', stat: 'additionalProjectiles', min: 2, max: 2, tier: 2 },
  { id: 'of_fusillade', name: 'of Fusillade', type: 'suffix', stat: 'additionalProjectiles', min: 3, max: 3, tier: 3 },
  // Cold Damage (suffix)
  { id: 'of_ice', name: 'of Ice', type: 'suffix', stat: 'coldDmg', min: 1, max: 3, tier: 1 },
  { id: 'of_frost', name: 'of Frost', type: 'suffix', stat: 'coldDmg', min: 2, max: 5, tier: 2 },
  { id: 'of_winter', name: 'of Winter', type: 'suffix', stat: 'coldDmg', min: 4, max: 8, tier: 3 },
  // Lightning Damage (suffix)
  { id: 'of_storms', name: 'of Storms', type: 'suffix', stat: 'lightningDmg', min: 1, max: 3, tier: 1 },
  { id: 'of_lightning', name: 'of Lightning', type: 'suffix', stat: 'lightningDmg', min: 2, max: 5, tier: 2 },
  { id: 'of_thunder', name: 'of Thunder', type: 'suffix', stat: 'lightningDmg', min: 4, max: 8, tier: 3 },
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
  {
    id: 'phoenix_mantle',
    name: 'Phoenix Mantle',
    baseId: 'body',
    slot: 'body',
    innateStats: { armor: 12 },
    fixedAffixes: { hp: 30, fireDmg: 5, hpRegen: 3 },
    flavor: 'Rise from the ashes',
  },
  {
    id: 'crown_of_eyes',
    name: 'Crown of Eyes',
    baseId: 'helmet',
    slot: 'helmet',
    innateStats: { armor: 4 },
    fixedAffixes: { int: 8, mana: 20, projectileDmgPct: 15 },
    flavor: 'Knowledge is power',
  },
  {
    id: 'windrunners',
    name: 'Windrunners',
    baseId: 'boots',
    slot: 'boots',
    innateStats: { armor: 2, moveSpeedPct: 5 },
    fixedAffixes: { dex: 6, dodgePct: 8, moveSpeedPct: 10 },
    flavor: 'Faster than the eye can see',
  },
  {
    id: 'ring_of_the_forge',
    name: 'Ring of the Forge',
    baseId: 'ring',
    slot: 'ring',
    innateStats: {},
    fixedAffixes: { fireDmg: 3, meleeDmgPct: 12, str: 5 },
    flavor: 'Tempered in flame',
  },
];
