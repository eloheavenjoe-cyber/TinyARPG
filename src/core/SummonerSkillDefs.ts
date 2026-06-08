import { SkillDef } from './SkillDefs';

const D = (Math.PI / 180);

export const SUMMONER_MAIN: SkillDef[] = [
  {
    id: 'bone_spear', name: 'Bone Spear',
    description: 'Fire a piercing bone projectile that passes through enemies.',
    category: 'main', classType: 'summoner',
    manaCost: 10, cooldown: 30, range: 650, damageMult: 1.2,
    effectType: 'projectile_pierce', subTreeId: 'bone_spear',
  },
  {
    id: 'soul_drain', name: 'Soul Drain',
    description: 'Channel life energy from a target, healing you and nearby minions.',
    category: 'main', classType: 'summoner',
    manaCost: 15, cooldown: 180, range: 250, damageMult: 0.4,
    effectType: 'channel', duration: 120,
    subTreeId: 'soul_drain',
  },
  {
    id: 'corpse_explosion', name: 'Corpse Explosion',
    description: 'Detonate a nearby corpse, dealing area damage based on its max life.',
    category: 'main', classType: 'summoner',
    manaCost: 20, cooldown: 48, range: 200, damageMult: 0.15,
    effectType: 'aoe_target', radius: 120, subTreeId: 'corpse_explosion',
  },
  {
    id: 'command_wrath', name: 'Command Wrath',
    description: 'Empower all minions with increased damage and attack speed.',
    category: 'main', classType: 'summoner',
    manaCost: 25, cooldown: 480, range: 0, damageMult: 0,
    effectType: 'buff', duration: 240, value: 30, subTreeId: 'command_wrath',
  },
];

export const SUMMONER_SUPPORT: SkillDef[] = [
  {
    id: 'raise_skeleton', name: 'Raise Skeleton',
    description: 'Summon a permanent skeleton warrior to fight for you.',
    category: 'support', classType: 'summoner',
    manaCost: 25, cooldown: 240, range: 80, damageMult: 0,
    effectType: 'summon',
  },
  {
    id: 'summon_mage', name: 'Summon Skeleton Mage',
    description: 'Summon a temporary skeleton mage that fires magic projectiles.',
    category: 'support', classType: 'summoner',
    manaCost: 30, cooldown: 480, range: 100, damageMult: 0,
    effectType: 'summon', duration: 900,
  },
  {
    id: 'bone_armor', name: 'Bone Armor',
    description: 'Surround yourself and nearby minions with protective bone plating.',
    category: 'support', classType: 'summoner',
    manaCost: 20, cooldown: 900, range: 0, damageMult: 0,
    effectType: 'buff', duration: 360, value: 30,
  },
  {
    id: 'death_mark', name: 'Death Mark',
    description: 'Mark an enemy, causing them to take increased damage from all sources.',
    category: 'support', classType: 'summoner',
    manaCost: 15, cooldown: 360, range: 500, damageMult: 0,
    effectType: 'debuff', duration: 480, value: 25,
  },
  {
    id: 'flesh_offering', name: 'Flesh Offering',
    description: 'Consume a nearby corpse to empower your minions temporarily.',
    category: 'support', classType: 'summoner',
    manaCost: 10, cooldown: 120, range: 200, damageMult: 0,
    effectType: 'buff', duration: 360, value: 40,
  },
];

export const SUMMONER_DEFAULT_SUPPORT_IDS = [
  'raise_skeleton', 'summon_mage', 'bone_armor', 'death_mark', 'flesh_offering',
];
