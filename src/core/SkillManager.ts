import { SkillDef, ClassType, WARRIOR_MAIN, WARRIOR_SUPPORT, RANGER_MAIN, RANGER_SUPPORT, DEFAULT_SUPPORT_IDS, RANGER_DEFAULT_SUPPORT_IDS } from './SkillDefs';
import { Logger } from './Logger';

export interface ActiveBuff {
  skillId: string;
  remaining: number;
}

export class SkillManager {
  classType: ClassType;
  allSkills: SkillDef[];
  slots: (SkillDef | null)[] = [null, null, null, null, null, null];
  cooldowns: Map<string, number> = new Map();
  activeBuffs: ActiveBuff[] = [];
  mainAbility: SkillDef | null = null;

  constructor(classType: ClassType) {
    this.classType = classType;
    const mainSkills = classType === 'warrior' ? WARRIOR_MAIN : RANGER_MAIN;
    const supportSkills = classType === 'warrior' ? WARRIOR_SUPPORT : RANGER_SUPPORT;
    const defaultSupportIds = classType === 'warrior' ? DEFAULT_SUPPORT_IDS : RANGER_DEFAULT_SUPPORT_IDS;
    this.allSkills = [...mainSkills, ...supportSkills];
    const supports = defaultSupportIds
      .map(id => supportSkills.find(s => s.id === id)!)
      .filter(Boolean);
    this.slots = [null, ...supports].slice(0, 6);
  }

  selectMainAbility(id: string) {
    const mainSkills = this.classType === 'warrior' ? WARRIOR_MAIN : RANGER_MAIN;
    const skill = mainSkills.find(s => s.id === id);
    if (!skill) return;
    this.mainAbility = skill;
    this.slots[0] = skill;
    Logger.log('system', `Main ability selected: ${skill.name} (${skill.id})`);
  }

  getSkill(slot: number): SkillDef | null {
    return this.slots[slot] ?? null;
  }

  cooldownRemaining(skillId: string): number {
    return this.cooldowns.get(skillId) || 0;
  }

  cooldownRatio(skillId: string): number {
    const skill = this.allSkills.find(s => s.id === skillId);
    if (!skill || skill.cooldown <= 0) return 0;
    return Math.min(1, (this.cooldowns.get(skillId) || 0) / skill.cooldown);
  }

  canUse(slot: number, mana: number): boolean {
    const skill = this.slots[slot];
    if (!skill) return false;
    if (skill.manaCost > mana) return false;
    if (skill.cooldown > 0 && this.cooldownRemaining(skill.id) > 0) return false;
    return true;
  }

  consume(slot: number, mana: number): SkillDef | null {
    const skill = this.slots[slot];
    if (!skill || !this.canUse(slot, mana)) return null;
    this.cooldowns.set(skill.id, skill.cooldown);
    Logger.log('skill', `Used ${skill.name} slot=${slot + 1} mana=${mana}->${mana - skill.manaCost}`);
    return skill;
  }

  addBuff(skillId: string) {
    const skill = this.allSkills.find(s => s.id === skillId);
    if (!skill || skill.duration === undefined) return;
    const existing = this.activeBuffs.find(b => b.skillId === skillId);
    if (existing) {
      existing.remaining = skill.duration;
    } else {
      this.activeBuffs.push({ skillId, remaining: skill.duration });
    }
    Logger.log('skill', `Buff gained: ${skill.name} (${skill.duration}f)`);
  }

  hasBuff(skillId: string): boolean {
    return this.activeBuffs.some(b => b.skillId === skillId && b.remaining > 0);
  }

  update(dt: number) {
    for (const [id, rem] of this.cooldowns) {
      const next = rem - dt;
      if (next <= 0) this.cooldowns.delete(id);
      else this.cooldowns.set(id, next);
    }
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      this.activeBuffs[i].remaining -= dt;
      if (this.activeBuffs[i].remaining <= 0) this.activeBuffs.splice(i, 1);
    }
  }

  attackSpeedMult(): number {
    return this.hasBuff('battle_rage') ? 1.5 : 1;
  }

  damageReduction(): number {
    return this.hasBuff('fortify') ? 0.25 : 0;
  }

  manaRegenBonus(): number {
    return this.hasBuff('rally') ? 12 : 0;
  }

  healOnKill(): number {
    return this.hasBuff('bloodlust') ? 15 : 0;
  }

  isInvulnerable(): boolean {
    return this.hasBuff('ignore_pain');
  }

  executeThreshold(): number {
    return 0.2;
  }

  executeMult(): number {
    return 3.0;
  }

  projectileSpeedBonus(): number {
    return this.hasBuff('eagle_eye') ? 1.3 : 1;
  }

  moveSpeedBonus(): number {
    return this.hasBuff('haste') ? 1.5 : 1;
  }
}
