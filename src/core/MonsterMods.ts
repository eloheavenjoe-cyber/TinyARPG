import type { Enemy } from '../entities/Enemy';

export type MonsterRarity = 'normal' | 'magic' | 'rare';

export interface MonsterMod {
  id: string;
  name: string;
  desc: string;
  apply(enemy: Enemy): void;
  vfxColor?: number;
  vfxRadius?: number;
}

export const MONSTER_MODS: MonsterMod[] = [
  {
    id: 'hasted',
    name: 'Hasted',
    desc: '+50% move speed, +50% attack speed',
    vfxColor: 0xffffff,
    vfxRadius: 8,
    apply(enemy: Enemy) {
      enemy.speed *= 1.5;
      enemy.hastedMultiplier = 1.5;
    },
  },
  {
    id: 'goliath',
    name: 'Goliath',
    desc: '+100% HP, +30% size, +50% XP',
    vfxColor: 0x886644,
    vfxRadius: 12,
    apply(enemy: Enemy) {
      enemy.maxHealth = Math.round(enemy.maxHealth * 2);
      enemy.health = enemy.maxHealth;
      enemy.xpReward = Math.round(enemy.xpReward * 1.5);
      const scalePct = 1.3;
      enemy.width = Math.round(enemy.width * scalePct);
      enemy.height = Math.round(enemy.height * scalePct);
      enemy.sprite.scale.set((enemy.sprite.scale.x > 0 ? 1 : -1) * Math.abs(enemy.sprite.scale.x) * scalePct);
    },
  },
  {
    id: 'frost_aura',
    name: 'Frost Aura',
    desc: 'Chills nearby enemies (25% slow, 150px radius)',
    vfxColor: 0x4488ff,
    vfxRadius: 150,
    apply(enemy: Enemy) {
      enemy.frostAuraActive = true;
      enemy.frostAuraRadius = 150;
    },
  },
  {
    id: 'volatile',
    name: 'Volatile',
    desc: 'Explodes on death dealing 50% max HP as AoE damage',
    vfxColor: 0xff3333,
    vfxRadius: 14,
    apply(enemy: Enemy) {
      enemy.volatileActive = true;
    },
  },
];

export function getRandomMods(count: number): MonsterMod[] {
  const pool = [...MONSTER_MODS];
  const result: MonsterMod[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export function rollRarity(): MonsterRarity {
  const r = Math.random();
  if (r < 0.50) return 'normal';
  if (r < 0.85) return 'magic';
  return 'rare';
}

export const RARITY_COLORS: Record<MonsterRarity, number> = {
  normal: 0xffffff,
  magic: 0x4488ff,
  rare: 0xffcc00,
};
