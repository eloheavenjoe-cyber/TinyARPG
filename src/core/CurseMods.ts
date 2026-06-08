export type CurseTier = 1 | 2 | 3;

export interface CurseDef {
  id: string;
  name: string;
  tier: CurseTier;
  weight: number;
  duration: number;
  description: string;
  statEffect: string;
  statValue: number;
}

export interface CurseInstance {
  def: CurseDef;
  remaining: number;
}

export const CURSE_POOL: CurseDef[] = [
  { id: 'sluggish', name: 'Sluggish', tier: 1, weight: 4, duration: 25, description: '30% reduced move speed', statEffect: 'moveSpeedPct', statValue: -30 },
  { id: 'drained', name: 'Drained', tier: 1, weight: 4, duration: 30, description: '25% reduced mana regen', statEffect: 'manaRegenPct', statValue: -25 },
  { id: 'rattled', name: 'Rattled', tier: 1, weight: 4, duration: 30, description: '20% reduced dodge chance', statEffect: 'dodgePct', statValue: -20 },
  { id: 'blurred', name: 'Blurred', tier: 1, weight: 3, duration: 20, description: 'Reduced visibility radius', statEffect: 'visibilityRadius', statValue: -100 },

  { id: 'bleeding', name: 'Bleeding', tier: 2, weight: 3, duration: 20, description: 'Lose 5 life per second', statEffect: 'bleedDps', statValue: 5 },
  { id: 'weakened', name: 'Weakened', tier: 2, weight: 4, duration: 25, description: '35% reduced damage dealt', statEffect: 'damageDealtMult', statValue: -35 },
  { id: 'brittle', name: 'Brittle', tier: 2, weight: 4, duration: 20, description: '40% increased damage taken', statEffect: 'damageTakenMult', statValue: 40 },
  { id: 'flask_cursed', name: 'Flask-Cursed', tier: 2, weight: 2, duration: 15, description: 'Cannot use flasks', statEffect: 'flaskDisabled', statValue: 1 },
  { id: 'chilled', name: 'Chilled', tier: 2, weight: 3, duration: 15, description: '50% reduced attack/cast speed', statEffect: 'attackSpeedPct', statValue: -50 },

  { id: 'no_regen', name: 'No Regeneration', tier: 3, weight: 3, duration: 30, description: 'Cannot regen life or mana', statEffect: 'regenDisabled', statValue: 1 },
  { id: 'marked', name: 'Marked', tier: 3, weight: 3, duration: 10, description: 'Enemies alerted and rush you', statEffect: 'marked', statValue: 1 },
  { id: 'shattered_flask', name: 'Shattered Flask', tier: 3, weight: 2, duration: 0, description: 'All flask charges set to zero', statEffect: 'shatterFlask', statValue: 1 },
  { id: 'soul_taxed', name: 'Soul Taxed', tier: 3, weight: 3, duration: 0, description: 'Lose 20% current life instantly', statEffect: 'soulTax', statValue: 20 },
  { id: 'hexed', name: 'Hexed', tier: 3, weight: 4, duration: 25, description: 'All resistances reduced by 30%', statEffect: 'allResistancePct', statValue: -30 },
];

function weightedSelect(pool: CurseDef[], count: number): CurseDef[] {
  const available = [...pool];
  const result: CurseDef[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * totalWeight;
    for (let j = 0; j < available.length; j++) {
      r -= available[j].weight;
      if (r <= 0) {
        result.push(available.splice(j, 1)[0]);
        break;
      }
    }
  }
  return result;
}

export function rollCurses(count: number, minTier: CurseTier, maxTier: CurseTier, forceTier3?: boolean): CurseDef[] {
  let pool = CURSE_POOL.filter(c => c.tier >= minTier && c.tier <= maxTier);
  if (forceTier3 && count > 0) {
    const t3pool = CURSE_POOL.filter(c => c.tier === 3);
    const forced = t3pool[Math.floor(Math.random() * t3pool.length)];
    pool = pool.filter(c => c.id !== forced.id);
    const rest = count > 1 ? weightedSelect(pool, count - 1) : [];
    return [forced, ...rest];
  }
  return weightedSelect(pool, count);
}
