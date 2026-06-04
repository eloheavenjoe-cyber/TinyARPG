import { PassiveTree, NodeEffects } from './PassiveTree';

export function computeStats(tree: PassiveTree, attrs: { str: number; dex: number; int: number }, baseHp: number, baseMana: number): {
  hp: number; maxHp: number; mana: number; maxMana: number;
  attackSpeedMult: number; meleeDmgMult: number; projectileDmgMult: number;
  moveSpeedMult: number; dodgePct: number; damageReduction: number;
  cooldownReductionPct: number; skillDurationPct: number;
  manaCostReductionPct: number; manaRegenPct: number; hpRegen: number;
} {
  const treeEffects = tree.getAllEffects();

  const add = (key: keyof NodeEffects) => treeEffects[key] || 0;

  const str = attrs.str + add('str');
  const dex = attrs.dex + add('dex');
  const int = attrs.int + add('int');

  let maxHp = baseHp + str * 2 + add('hp');
  maxHp = Math.round(maxHp * (1 + (add('hpPct') || 0) / 100));

  let maxMana = baseMana + int * 2 + add('mana');
  maxMana = Math.round(maxMana * (1 + (add('manaPct') || 0) / 100));

  return {
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
}
