export interface SkillDef {
  id: string;
  name: string;
  description: string;
  category: 'main' | 'support';
  manaCost: number;
  cooldown: number;
  range: number;
  damageMult: number;
  effectType: 'cone' | 'single' | 'aoe_self' | 'dash' | 'buff' | 'debuff' | 'passive';
  angle?: number;
  radius?: number;
  duration?: number;
  value?: number;
}

const D = (Math.PI / 180);

export const WARRIOR_MAIN: SkillDef[] = [
  {
    id: 'cleave',
    name: 'Cleave',
    description: 'Swing in a wide arc hitting all enemies in front',
    category: 'main', manaCost: 8, cooldown: 10, range: 70, damageMult: 1.0,
    effectType: 'cone', angle: 120 * D,
  },
  {
    id: 'shield_slam',
    name: 'Shield Slam',
    description: 'Heavy single target hit that stuns',
    category: 'main', manaCost: 12, cooldown: 25, range: 75, damageMult: 1.5,
    effectType: 'single', duration: 30, value: 0,
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spin attacking all nearby enemies repeatedly',
    category: 'main', manaCost: 15, cooldown: 40, range: 0, damageMult: 0.4,
    effectType: 'aoe_self', radius: 75, duration: 50,
  },
  {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    description: 'Slow but devastating single target blow',
    category: 'main', manaCost: 10, cooldown: 30, range: 70, damageMult: 2.5,
    effectType: 'single',
  },
];

export const WARRIOR_SUPPORT: SkillDef[] = [
  {
    id: 'charge',
    name: 'Charge',
    description: 'Rush toward the mouse cursor',
    category: 'support', manaCost: 10, cooldown: 45, range: 150, damageMult: 0,
    effectType: 'dash',
  },
  {
    id: 'war_cry',
    name: 'War Cry',
    description: 'Instantly heal some health',
    category: 'support', manaCost: 8, cooldown: 120, range: 0, damageMult: 0,
    effectType: 'buff', value: 20,
  },
  {
    id: 'fortify',
    name: 'Fortify',
    description: 'Reduce incoming damage for a time',
    category: 'support', manaCost: 12, cooldown: 240, range: 0, damageMult: 0,
    effectType: 'buff', duration: 180, value: 0.25,
  },
  {
    id: 'battle_rage',
    name: 'Battle Rage',
    description: 'Attack faster for a few seconds',
    category: 'support', manaCost: 10, cooldown: 200, range: 0, damageMult: 0,
    effectType: 'buff', duration: 180, value: 0.5,
  },
  {
    id: 'sunder_armor',
    name: 'Sunder Armor',
    description: 'Weaken an enemy to take more damage',
    category: 'support', manaCost: 10, cooldown: 180, range: 70, damageMult: 0,
    effectType: 'debuff', duration: 180, value: 0.4,
  },
  {
    id: 'execute',
    name: 'Execute',
    description: 'Passive — deal triple damage to enemies below 20% health',
    category: 'support', manaCost: 0, cooldown: 0, range: 0, damageMult: 3.0,
    effectType: 'passive', value: 0.2,
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    description: 'Heal on each kill for a duration',
    category: 'support', manaCost: 10, cooldown: 240, range: 0, damageMult: 0,
    effectType: 'buff', duration: 300, value: 15,
  },
  {
    id: 'rally',
    name: 'Rally',
    description: 'Greatly restore mana over time',
    category: 'support', manaCost: 0, cooldown: 300, range: 0, damageMult: 0,
    effectType: 'buff', duration: 240, value: 12,
  },
  {
    id: 'ground_slam',
    name: 'Ground Slam',
    description: 'A wide shockwave that slows enemies',
    category: 'support', manaCost: 14, cooldown: 150, range: 180, damageMult: 0.6,
    effectType: 'cone', angle: 180 * D, duration: 120, value: 0.5,
  },
  {
    id: 'ignore_pain',
    name: 'Ignore Pain',
    description: 'Become invulnerable briefly',
    category: 'support', manaCost: 18, cooldown: 360, range: 0, damageMult: 0,
    effectType: 'buff', duration: 60, value: 0,
  },
];

export const DEFAULT_SUPPORT_IDS = ['charge', 'war_cry', 'fortify', 'battle_rage', 'execute'];
