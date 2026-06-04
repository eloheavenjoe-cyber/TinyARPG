import { PassiveTree, NodeEffects } from './PassiveTree';

export function computeStats(
  tree: PassiveTree,
  attrs: { str: number; dex: number; int: number },
  baseHp: number,
  baseMana: number,
  equipmentStats?: Record<string, number>,
) {
  const treeEffects = tree.getAllEffects();

  const add = (key: keyof NodeEffects) => treeEffects[key] || 0;

  const str = attrs.str + add('str');
  const dex = attrs.dex + add('dex');
  const int = attrs.int + add('int');

  let maxHp = baseHp + str * 2 + add('hp');
  maxHp = Math.round(maxHp * (1 + (add('hpPct') || 0) / 100));

  let maxMana = baseMana + int * 2 + add('mana');
  maxMana = Math.round(maxMana * (1 + (add('manaPct') || 0) / 100));

  const base = {
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    attackSpeedMult: 1 + (dex * 0.005) + (add('attackSpeedPct') || 0) / 100,
    meleeDmgMult: 1 + (add('meleeDmgPct') || 0) / 100,
    projectileDmgMult: 1 + (add('projectileDmgPct') || 0) / 100,
    moveSpeedMult: 1 + (add('moveSpeedPct') || 0) / 100,
    dodgePct: Math.min(50, add('dodgePct') || 0),
    damageReduction: Math.min(50, add('damageReduction') || 0),
    cooldownReductionPct: Math.min(50, add('cooldownReductionPct') || 0),
    skillDurationPct: add('skillDurationPct') || 0,
    manaCostReductionPct: Math.min(40, add('manaCostReductionPct') || 0),
    manaRegenPct: add('manaRegenPct') || 0,
    hpRegen: add('hpRegen') || 0,
  };

  if (equipmentStats) {
    for (const [key, val] of Object.entries(equipmentStats)) {
      if (key === 'hp') base.maxHp += val;
      else if (key === 'mana') base.maxMana += val;
      else if (key === 'damageReduction') base.damageReduction = Math.min(50, base.damageReduction + val);
      else if (key === 'attackSpeedPct') base.attackSpeedMult += val / 100;
      else if (key === 'moveSpeedPct') base.moveSpeedMult += val / 100;
      else if (key === 'meleeDmgPct') base.meleeDmgMult += val / 100;
      else if (key === 'projectileDmgPct') base.projectileDmgMult += val / 100;
      else if (key === 'hpRegen') base.hpRegen += val;
    }
  }

  return base;
}
