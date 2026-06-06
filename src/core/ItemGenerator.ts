import { ITEM_BASES, AFFIXES, UNIQUE_ITEMS, ItemBase, ItemAffix, Rarity } from './ItemDefs';

export interface SocketSlot {
  jewel: GeneratedItem | null;
}

export interface GeneratedItem {
  id: string;
  base: ItemBase;
  rarity: Rarity;
  affixes: { affix: ItemAffix; roll: number }[];
  uniqueId?: string;
  damageRoll: number;
  computedName: string;
  computedStats: Record<string, number>;
  ilvl: number;
  levelReq: number;
  socketSlots: SocketSlot[];
  maxSockets: number;
}

export function getMaxSockets(base: ItemBase): number {
  if (base.id === 'jewel') return 0;
  if (base.slot === 'ring' || base.slot === 'ring2' || base.slot === 'amulet') return 1;
  if (base.slot === 'boots' || base.slot === 'helmet') return 4;
  if (base.slot === 'weapon' || base.slot === 'body') return 6;
  return 0;
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

export function generateItemDrop(playerLevel?: number, magicFind: number = 0): GeneratedItem {
  const mf = 1 + magicFind / 100;
  const weights = { normal: 50, magic: 30 * mf, rare: 15 * mf, unique: 5 * mf };
  const total = weights.normal + weights.magic + weights.rare + weights.unique;
  const roll = Math.random() * total;
  let rarity: Rarity;
  if (roll < weights.normal) rarity = 'normal';
  else if (roll < weights.normal + weights.magic) rarity = 'magic';
  else if (roll < weights.normal + weights.magic + weights.rare) rarity = 'rare';
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
        affix: { id: stat, name: '', type: 'prefix' as const, stat, min: value, max: value, tier: 1 },
        roll: value,
      })),
      uniqueId: unique.id,
      damageRoll: dr,
      computedName: unique.name,
      computedStats: stats,
      ilvl: playerLevel || 1,
      levelReq: 1,
      socketSlots: [],
      maxSockets: getMaxSockets(base),
    };
  }

  const base = pickWeighted(ITEM_BASES);

  const affixCount = rarity === 'magic' ? 2 : rarity === 'rare' ? 4 + Math.floor(Math.random() * 3) : 0;

  const maxTierRoll = Math.random();
  const maxTier = maxTierRoll < 0.50 ? 1 : maxTierRoll < 0.85 ? 2 : 3;

  const prefixes = AFFIXES.filter(a => a.type === 'prefix' && a.tier <= maxTier).sort(() => Math.random() - 0.5);
  const suffixes = AFFIXES.filter(a => a.type === 'suffix' && a.tier <= maxTier).sort(() => Math.random() - 0.5);
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

  const ilvl = playerLevel || 1;
  const levelReq = maxTier * 4;

  const ms = getMaxSockets(base);
  const item: GeneratedItem = {
    id: crypto.randomUUID(),
    base, rarity, affixes: picked, damageRoll,
    computedName: generateName(picked, base.name),
    computedStats: stats,
    ilvl,
    levelReq,
    socketSlots: [],
    maxSockets: ms,
  };
  return item;
}

export function generateVendorItem(playerLevel: number, weighting: { normal: number; magic: number; rare: number; unique: number }): GeneratedItem {
  const total = weighting.normal + weighting.magic + weighting.rare + weighting.unique;
  const roll = Math.random() * total;
  let rarity: Rarity = 'normal';
  if (roll < weighting.unique) rarity = 'unique';
  else if (roll < weighting.unique + weighting.rare) rarity = 'rare';
  else if (roll < weighting.unique + weighting.rare + weighting.magic) rarity = 'magic';

  if (rarity === 'unique') {
    const unique = UNIQUE_ITEMS[Math.floor(Math.random() * UNIQUE_ITEMS.length)];
    const base = ITEM_BASES.find(b => b.id === unique.baseId)!;
    const dr = base.damageRange ? base.damageRange.min + Math.floor(Math.random() * (base.damageRange.max - base.damageRange.min + 1)) : 0;
    const stats: Record<string, number> = { ...unique.innateStats, ...unique.fixedAffixes };
    if (dr > 0) stats.damage = dr;
    const mappedAffixes = Object.entries(unique.fixedAffixes).map(([stat, value]) => {
      const affix = AFFIXES.find(af => af.stat === stat);
      return { affix: affix || { id: stat, name: '', type: 'prefix' as const, stat, min: value, max: value, tier: 1 }, roll: value };
    });
    return {
      id: crypto.randomUUID(),
      base, rarity: 'unique', affixes: mappedAffixes,
      uniqueId: unique.id, damageRoll: dr, computedName: unique.name,
      computedStats: stats, ilvl: playerLevel, levelReq: 1,
      socketSlots: [],
      maxSockets: getMaxSockets(base),
    };
  }

  const base = pickWeighted(ITEM_BASES);
  const ilvl = playerLevel;
  const maxTier = Math.min(3, Math.ceil(playerLevel / 4));
  const damageRoll = base.damageRange ? base.damageRange.min + Math.floor(Math.random() * (base.damageRange.max - base.damageRange.min + 1)) : 0;
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
    const r = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
    affixes.push({ affix: pick, roll: r });
    stats[pick.stat] = (stats[pick.stat] || 0) + r;
    if (isPrefix) prefixCount++; else suffixCount++;
  }

  const tierCounts: Record<number, number> = {};
  for (const a of affixes) tierCounts[a.affix.tier] = (tierCounts[a.affix.tier] || 0) + 1;
  const highestTier = Math.max(...Object.keys(tierCounts).map(Number), 1);
  const levelReq = highestTier * 4;

  return {
    id: crypto.randomUUID(),
    base, rarity, affixes, damageRoll, computedName: generateName(affixes, base.name), computedStats: stats,
    ilvl, levelReq,
    socketSlots: [],
    maxSockets: getMaxSockets(base),
  };
}

export function generateOrbDrop(): { orbId: string; name: string } {
  const r = Math.random();
  if (r < 0.25) return { orbId: 'mutation', name: 'Orb of Mutation' };
  if (r < 0.50) return { orbId: 'purification', name: 'Orb of Purification' };
  if (r < 0.68) return { orbId: 'empowerment', name: 'Orb of Empowerment' };
  if (r < 0.86) return { orbId: 'flux', name: 'Orb of Flux' };
  if (r < 0.93) return { orbId: 'growth', name: 'Orb of Growth' };
  return { orbId: 'ascendance', name: 'Orb of Ascendance' };
}
