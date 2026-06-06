import { ITEM_BASES, AFFIXES, UNIQUE_ITEMS, JEWEL_ONLY_AFFIXES, ItemBase, ItemAffix, Rarity } from './ItemDefs';

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

export function generateJewel(playerLevel?: number): GeneratedItem {
  const ilvl = playerLevel || 1;
  const maxTierRoll = Math.random();
  const maxTier = maxTierRoll < 0.50 ? 1 : maxTierRoll < 0.85 ? 2 : 3;

  const rarityRoll = Math.random();
  let rarity: Rarity;
  let affixCount: number;
  if (rarityRoll < 0.50) { rarity = 'normal'; affixCount = 1; }
  else if (rarityRoll < 0.80) { rarity = 'magic'; affixCount = 2; }
  else if (rarityRoll < 0.95) { rarity = 'rare'; affixCount = 3; }
  else { rarity = 'rare'; affixCount = 4 + Math.floor(Math.random() * 3); }

  const pool = AFFIXES.filter(a => a.tier <= maxTier).sort(() => Math.random() - 0.5);
  const jewelPool = JEWEL_ONLY_AFFIXES.filter(a => a.tier <= maxTier).sort(() => Math.random() - 0.5);

  const picked: { affix: ItemAffix; roll: number }[] = [];
  const usedStats = new Set<string>();

  for (let i = 0; i < affixCount; i++) {
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
    socketSlots: [],
    maxSockets: 0,
  };
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
    const ms = getMaxSockets(base);
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
      socketSlots: Array.from({ length: rollSockets(ms) }, () => ({ jewel: null })),
      maxSockets: ms,
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
    socketSlots: Array.from({ length: rollSockets(ms) }, () => ({ jewel: null })),
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
