import { ITEM_BASES, AFFIXES, UNIQUE_ITEMS, ItemBase, ItemAffix, Rarity } from './ItemDefs';

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

export function generateItemDrop(playerLevel?: number): GeneratedItem {
  const rarityRoll = Math.random();
  let rarity: Rarity;
  if (rarityRoll < 0.50) rarity = 'normal';
  else if (rarityRoll < 0.80) rarity = 'magic';
  else if (rarityRoll < 0.95) rarity = 'rare';
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

  const item: GeneratedItem = {
    id: crypto.randomUUID(),
    base, rarity, affixes: picked, damageRoll,
    computedName: generateName(picked, base.name),
    computedStats: stats,
    ilvl,
    levelReq,
  };
  return item;
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
