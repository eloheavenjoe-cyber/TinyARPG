export type ClassType = 'warrior' | 'ranger' | 'monk' | 'summoner';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  category: 'main' | 'support';
  classType: ClassType;
  manaCost: number;
  cooldown: number;
  range: number;
  damageMult: number;
  effectType: 'cone' | 'single' | 'aoe_self' | 'dash' | 'buff' | 'debuff' | 'passive' | 'projectile' | 'projectile_spread' | 'projectile_pierce' | 'aoe_target' | 'summon' | 'channel';
  angle?: number;
  radius?: number;
  duration?: number;
  value?: number;
  subTreeId?: string;
}

const D = (Math.PI / 180);

export const WARRIOR_MAIN: SkillDef[] = [
  {
    id: 'cleave',
    name: 'Cleave',
    description: 'Swing in a wide arc hitting all enemies in front',
    category: 'main', classType: 'warrior', manaCost: 8, cooldown: 10, range: 70, damageMult: 1.0,
    effectType: 'cone', angle: 120 * D,
  },
  {
    id: 'shield_slam',
    name: 'Shield Slam',
    description: 'Heavy single target hit that stuns',
    category: 'main', classType: 'warrior', manaCost: 12, cooldown: 25, range: 75, damageMult: 1.5,
    effectType: 'single', duration: 30, value: 0,
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spin attacking all nearby enemies repeatedly',
    category: 'main', classType: 'warrior', manaCost: 15, cooldown: 40, range: 0, damageMult: 0.4,
    effectType: 'aoe_self', radius: 75, duration: 50,
  },
  {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    description: 'Slow but devastating single target blow',
    category: 'main', classType: 'warrior', manaCost: 10, cooldown: 30, range: 70, damageMult: 2.5,
    effectType: 'single',
  },
];

export const WARRIOR_SUPPORT: SkillDef[] = [
  {
    id: 'charge',
    name: 'Charge',
    description: 'Rush toward the mouse cursor',
    category: 'support', classType: 'warrior', manaCost: 10, cooldown: 45, range: 150, damageMult: 0,
    effectType: 'dash',
  },
  {
    id: 'war_cry',
    name: 'War Cry',
    description: 'Instantly heal some health',
    category: 'support', classType: 'warrior', manaCost: 8, cooldown: 120, range: 0, damageMult: 0,
    effectType: 'buff', value: 20,
  },
  {
    id: 'fortify',
    name: 'Fortify',
    description: 'Reduce incoming damage for a time',
    category: 'support', classType: 'warrior', manaCost: 12, cooldown: 240, range: 0, damageMult: 0,
    effectType: 'buff', duration: 180, value: 0.25,
  },
  {
    id: 'battle_rage',
    name: 'Battle Rage',
    description: 'Attack faster for a few seconds',
    category: 'support', classType: 'warrior', manaCost: 10, cooldown: 200, range: 0, damageMult: 0,
    effectType: 'buff', duration: 180, value: 0.5,
  },
  {
    id: 'sunder_armor',
    name: 'Sunder Armor',
    description: 'Weaken an enemy to take more damage',
    category: 'support', classType: 'warrior', manaCost: 10, cooldown: 180, range: 70, damageMult: 0,
    effectType: 'debuff', duration: 180, value: 0.4,
  },
  {
    id: 'execute',
    name: 'Execute',
    description: 'Passive — deal triple damage to enemies below 20% health',
    category: 'support', classType: 'warrior', manaCost: 0, cooldown: 0, range: 0, damageMult: 3.0,
    effectType: 'passive', value: 0.2,
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    description: 'Heal on each kill for a duration',
    category: 'support', classType: 'warrior', manaCost: 10, cooldown: 240, range: 0, damageMult: 0,
    effectType: 'buff', duration: 300, value: 15,
  },
  {
    id: 'rally',
    name: 'Rally',
    description: 'Greatly restore mana over time',
    category: 'support', classType: 'warrior', manaCost: 0, cooldown: 300, range: 0, damageMult: 0,
    effectType: 'buff', duration: 240, value: 12,
  },
  {
    id: 'ground_slam',
    name: 'Ground Slam',
    description: 'A wide shockwave that slows enemies',
    category: 'support', classType: 'warrior', manaCost: 14, cooldown: 150, range: 180, damageMult: 0.6,
    effectType: 'cone', angle: 180 * D, duration: 120, value: 0.5,
  },
  {
    id: 'ignore_pain',
    name: 'Ignore Pain',
    description: 'Become invulnerable briefly',
    category: 'support', classType: 'warrior', manaCost: 18, cooldown: 360, range: 0, damageMult: 0,
    effectType: 'buff', duration: 60, value: 0,
  },
];

export const DEFAULT_SUPPORT_IDS = ['charge', 'war_cry', 'fortify', 'battle_rage', 'execute'];

export const RANGER_MAIN: SkillDef[] = [
  {
    id: 'quick_shot',
    name: 'Quick Shot',
    description: 'Fast single projectile toward cursor',
    category: 'main', classType: 'ranger', manaCost: 6, cooldown: 8, range: 650, damageMult: 0.8,
    effectType: 'projectile', subTreeId: 'quick_shot',
  },
  {
    id: 'multi_shot',
    name: 'Multi Shot',
    description: 'Fire 8 projectiles in all directions',
    category: 'main', classType: 'ranger', manaCost: 14, cooldown: 35, range: 390, damageMult: 0.5,
    effectType: 'projectile_spread', value: 8, subTreeId: 'multi_shot',
  },
  {
    id: 'rain_of_arrows',
    name: 'Rain of Arrows',
    description: 'Arrows rain in a target area',
    category: 'main', classType: 'ranger', manaCost: 16, cooldown: 50, range: 350, damageMult: 0.6,
    effectType: 'aoe_target', radius: 100, subTreeId: 'rain_of_arrows',
  },
  {
    id: 'snipe',
    name: 'Snipe',
    description: 'High damage piercing shot',
    category: 'main', classType: 'ranger', manaCost: 12, cooldown: 40, range: 780, damageMult: 2.5,
    effectType: 'projectile_pierce', subTreeId: 'snipe',
  },
];

export const RANGER_SUPPORT: SkillDef[] = [
  {
    id: 'dodge_roll',
    name: 'Dodge Roll',
    description: 'Quick evade roll in movement direction',
    category: 'support', classType: 'ranger', manaCost: 6, cooldown: 40, range: 144, damageMult: 0,
    effectType: 'dash',
  },
  {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    description: 'Increase damage and projectile speed',
    category: 'support', classType: 'ranger', manaCost: 10, cooldown: 240, range: 0, damageMult: 0,
    effectType: 'buff', duration: 240, value: 0.3,
  },
  {
    id: 'haste',
    name: 'Haste',
    description: 'Greatly increase movement speed',
    category: 'support', classType: 'ranger', manaCost: 8, cooldown: 240, range: 0, damageMult: 0,
    effectType: 'buff', duration: 240, value: 0.5,
  },
  {
    id: 'poison_arrow',
    name: 'Poison Arrow',
    description: 'A poisoned arrow dealing damage over time',
    category: 'support', classType: 'ranger', manaCost: 8, cooldown: 120, range: 520, damageMult: 0.4,
    effectType: 'debuff', duration: 240, value: 3,
  },
  {
    id: 'trap',
    name: 'Trap',
    description: 'Place an explosive trap at your feet',
    category: 'support', classType: 'ranger', manaCost: 12, cooldown: 180, range: 0, damageMult: 0,
    effectType: 'aoe_self', radius: 0, duration: 180, value: 40,
  },
  {
    id: 'retreat',
    name: 'Retreat',
    description: 'Leap backward away from danger',
    category: 'support', classType: 'ranger', manaCost: 6, cooldown: 45, range: 150, damageMult: 0,
    effectType: 'dash',
  },
  {
    id: 'mark_target',
    name: 'Mark Target',
    description: 'Mark an enemy to take increased damage',
    category: 'support', classType: 'ranger', manaCost: 8, cooldown: 180, range: 400, damageMult: 0,
    effectType: 'debuff', duration: 240, value: 0.5,
  },
  {
    id: 'camouflage',
    name: 'Camouflage',
    description: 'Become briefly invisible to enemies',
    category: 'support', classType: 'ranger', manaCost: 10, cooldown: 360, range: 0, damageMult: 0,
    effectType: 'buff', duration: 120, value: 0,
  },
  {
    id: 'spread_shot',
    name: 'Spread Shot',
    description: 'Fire 5 projectiles in a forward cone',
    category: 'support', classType: 'ranger', manaCost: 10, cooldown: 30, range: 455, damageMult: 0.5,
    effectType: 'projectile_spread', angle: 30, value: 5,
  },
  {
    id: 'barrage',
    name: 'Barrage',
    description: 'Rapidly fire 3 projectiles forward',
    category: 'support', classType: 'ranger', manaCost: 8, cooldown: 20, range: 585, damageMult: 0.6,
    effectType: 'projectile', value: 3,
  },
];

export const RANGER_DEFAULT_SUPPORT_IDS = ['dodge_roll', 'eagle_eye', 'haste', 'spread_shot', 'trap'];

export const MONK_MAIN: SkillDef[] = [
  {
    id: 'basic_strike', name: 'Basic Strike', description: 'A swift strike',
    category: 'main', classType: 'monk', manaCost: 0, cooldown: 8, range: 80,
    damageMult: 0.8, effectType: 'single',
  },
  {
    id: 'dragon_palm', name: 'Dragon Palm', description: 'Focused palm strike with 15% stun chance',
    category: 'main', classType: 'monk', manaCost: 15, cooldown: 25, range: 80,
    damageMult: 1.8, effectType: 'single',
  },
  {
    id: 'whirlwind_kick', name: 'Whirlwind Kick', description: 'Spinning kick hitting all nearby enemies',
    category: 'main', classType: 'monk', manaCost: 15, cooldown: 30, range: 80,
    damageMult: 1.2, effectType: 'cone', angle: 120 * D,
  },
  {
    id: 'tiger_uppercut', name: 'Tiger Uppercut', description: 'Heavy upward strike that knocks enemies back',
    category: 'main', classType: 'monk', manaCost: 20, cooldown: 40, range: 80,
    damageMult: 2.5, effectType: 'single',
  },
  {
    id: 'meditate', name: 'Meditate', description: 'Channel to regain 25% HP and gain +20% damage',
    category: 'main', classType: 'monk', manaCost: 0, cooldown: 180, range: 0,
    damageMult: 0, effectType: 'buff', duration: 120, value: 20,
  },
];

export const MONK_SUPPORT: SkillDef[] = [
  {
    id: 'stance_toggle', name: 'Stance Toggle', description: 'Cycle stance: Tiger(dmg) / Tortoise(def) / Crane(lifesteal)',
    category: 'support', classType: 'monk', manaCost: 0, cooldown: 15, range: 0,
    damageMult: 0, effectType: 'buff',
  },
];

export const MONK_DEFAULT_SUPPORT_IDS: string[] = [];

import { SUMMONER_MAIN, SUMMONER_SUPPORT } from './SummonerSkillDefs';

export const ALL_SKILLS: SkillDef[] = [
  ...WARRIOR_MAIN, ...WARRIOR_SUPPORT,
  ...RANGER_MAIN, ...RANGER_SUPPORT,
  ...MONK_MAIN, ...MONK_SUPPORT,
  ...SUMMONER_MAIN, ...SUMMONER_SUPPORT,
];
