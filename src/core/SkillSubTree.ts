import { Logger } from './Logger';

export interface SkillSubTreeNode {
  id: string;
  name: string;
  desc: string;
  type: 'small' | 'keystone' | 'start';
  x: number;
  y: number;
  connections: string[];
  effects: Record<string, number>;
}

const QUICK_SHOT_TREE: SkillSubTreeNode[] = [
  { id: 'qs_start', name: 'Quick Shot', desc: 'Starting point for Quick Shot', type: 'start', x: 400, y: 620, connections: ['qs_1', 'qs_4', 'qs_7', 'qs_10'], effects: {} },
  { id: 'qs_1', name: 'Swift Draw', desc: '+15% attack speed', type: 'small', x: 280, y: 540, connections: ['qs_start', 'qs_2'], effects: { attackSpeedPct: 15 } },
  { id: 'qs_2', name: 'Accelerant', desc: '+20% projectile speed', type: 'small', x: 220, y: 460, connections: ['qs_1', 'qs_3'], effects: { projectileSpeedPct: 20 } },
  { id: 'qs_3', name: 'Ricochet', desc: 'Projectiles ricochet off walls', type: 'keystone', x: 180, y: 370, connections: ['qs_2'], effects: { ricochet: 1 } },
  { id: 'qs_4', name: 'Sharper Edge', desc: '+10% damage', type: 'small', x: 520, y: 540, connections: ['qs_start', 'qs_5'], effects: { damagePct: 10 } },
  { id: 'qs_5', name: 'Long Shot', desc: '+15% range', type: 'small', x: 580, y: 460, connections: ['qs_4', 'qs_6'], effects: { rangePct: 15 } },
  { id: 'qs_6', name: 'Piercing Shot', desc: 'Projectiles pierce through targets', type: 'keystone', x: 620, y: 370, connections: ['qs_5'], effects: { pierce: 1 } },
  { id: 'qs_7', name: 'Static Charge', desc: '+10% shock chance', type: 'small', x: 300, y: 350, connections: ['qs_start', 'qs_8'], effects: { shockChance: 10 } },
  { id: 'qs_8', name: 'Chain Arc', desc: '+15% chain damage', type: 'small', x: 240, y: 270, connections: ['qs_7', 'qs_9'], effects: { chainDmgPct: 15 } },
  { id: 'qs_9', name: 'Static Arrow', desc: 'Projectiles chain between targets', type: 'keystone', x: 200, y: 180, connections: ['qs_8'], effects: { staticArrow: 1 } },
  { id: 'qs_10', name: 'Split Intent', desc: '+5% damage per projectile', type: 'small', x: 500, y: 350, connections: ['qs_start', 'qs_11'], effects: { dmgPerProjPct: 5 } },
  { id: 'qs_11', name: 'Spread Pattern', desc: '-50% spread angle', type: 'small', x: 560, y: 270, connections: ['qs_10', 'qs_12'], effects: { spreadAngleReductionPct: 50 } },
  { id: 'qs_12', name: 'Triple Fire', desc: 'Fire 3 projectiles in a spread', type: 'keystone', x: 600, y: 180, connections: ['qs_11'], effects: { tripleFire: 1 } },
];

const MULTI_SHOT_TREE: SkillSubTreeNode[] = [
  { id: 'ms_start', name: 'Multi Shot', desc: 'Starting point for Multi Shot', type: 'start', x: 400, y: 620, connections: ['ms_1', 'ms_4', 'ms_7', 'ms_10'], effects: {} },
  { id: 'ms_1', name: 'Tighter Spread', desc: '-15% spread angle', type: 'small', x: 280, y: 540, connections: ['ms_start', 'ms_2'], effects: { spreadAngleReductionPct: 15 } },
  { id: 'ms_2', name: 'Volley', desc: '+2 extra projectiles', type: 'small', x: 220, y: 460, connections: ['ms_1', 'ms_3'], effects: { extraProjectiles: 2 } },
  { id: 'ms_3', name: 'Shotgun', desc: 'All projectiles hit the same target', type: 'keystone', x: 180, y: 370, connections: ['ms_2'], effects: { shotgun: 1 } },
  { id: 'ms_4', name: 'Toxic Residue', desc: '+10% poison damage', type: 'small', x: 520, y: 540, connections: ['ms_start', 'ms_5'], effects: { poisonDmgPct: 10 } },
  { id: 'ms_5', name: 'Lingering Cloud', desc: '+1 poison duration', type: 'small', x: 580, y: 460, connections: ['ms_4', 'ms_6'], effects: { poisonDuration: 1 } },
  { id: 'ms_6', name: 'Poison Nova', desc: 'Poison spreads on kill', type: 'keystone', x: 620, y: 370, connections: ['ms_5'], effects: { poisonNova: 1 } },
  { id: 'ms_7', name: 'Close Quarters', desc: '+8% close range damage', type: 'small', x: 300, y: 350, connections: ['ms_start', 'ms_8'], effects: { closeRangeDmgPct: 8 } },
  { id: 'ms_8', name: 'Hammer Time', desc: '+5% consecutive damage', type: 'small', x: 240, y: 270, connections: ['ms_7', 'ms_9'], effects: { consecutiveDmgPct: 5 } },
  { id: 'ms_9', name: 'Point Blank', desc: 'Bonus damage at close range', type: 'keystone', x: 200, y: 180, connections: ['ms_8'], effects: { pointBlank: 1 } },
  { id: 'ms_10', name: 'Orbital Path', desc: '+0.3 orbit delay', type: 'small', x: 500, y: 350, connections: ['ms_start', 'ms_11'], effects: { orbitDelay: 0.3 } },
  { id: 'ms_11', name: 'Spinning Out', desc: '+15% orbit speed', type: 'small', x: 560, y: 270, connections: ['ms_10', 'ms_12'], effects: { orbitSpeedPct: 15 } },
  { id: 'ms_12', name: 'Ring of Blades', desc: 'Projectiles orbit the player', type: 'keystone', x: 600, y: 180, connections: ['ms_11'], effects: { ringOfBlades: 1 } },
];

const RAIN_OF_ARROWS_TREE: SkillSubTreeNode[] = [
  { id: 'ra_start', name: 'Rain of Arrows', desc: 'Starting point for Rain of Arrows', type: 'start', x: 400, y: 620, connections: ['ra_1', 'ra_4', 'ra_7', 'ra_10'], effects: {} },
  { id: 'ra_1', name: 'Downpour', desc: '+20 arrow density', type: 'small', x: 280, y: 540, connections: ['ra_start', 'ra_2'], effects: { arrowDensity: 20 } },
  { id: 'ra_2', name: 'Wide Coverage', desc: '+15% radius', type: 'small', x: 220, y: 460, connections: ['ra_1', 'ra_3'], effects: { radiusPct: 15 } },
  { id: 'ra_3', name: 'Arrow Storm', desc: 'Arrows fall in a storm pattern', type: 'keystone', x: 180, y: 370, connections: ['ra_2'], effects: { arrowStorm: 1 } },
  { id: 'ra_4', name: 'Frostbite', desc: '+5% chill effect', type: 'small', x: 520, y: 540, connections: ['ra_start', 'ra_5'], effects: { chillEffectPct: 5 } },
  { id: 'ra_5', name: 'Glacial', desc: '+0.5 chill duration', type: 'small', x: 580, y: 460, connections: ['ra_4', 'ra_6'], effects: { chillDuration: 0.5 } },
  { id: 'ra_6', name: 'Frost Volley', desc: 'Arrows chill and freeze', type: 'keystone', x: 620, y: 370, connections: ['ra_5'], effects: { frostVolley: 1 } },
  { id: 'ra_7', name: 'Focused Strike', desc: '-10% radius, +15% damage', type: 'small', x: 300, y: 350, connections: ['ra_start', 'ra_8'], effects: { radiusReductionPct: 10, damagePct: 15 } },
  { id: 'ra_8', name: 'Deadly Aim', desc: '+20% damage', type: 'small', x: 240, y: 270, connections: ['ra_7', 'ra_9'], effects: { damagePct: 20 } },
  { id: 'ra_9', name: 'Precision Strike', desc: 'Arrows target weak points', type: 'keystone', x: 200, y: 180, connections: ['ra_8'], effects: { precisionStrike: 1 } },
  { id: 'ra_10', name: 'Concussive', desc: '+10% AoE damage', type: 'small', x: 500, y: 350, connections: ['ra_start', 'ra_11'], effects: { aoeDmgPct: 10 } },
  { id: 'ra_11', name: 'Heavy Rain', desc: '+15 explosion radius', type: 'small', x: 560, y: 270, connections: ['ra_10', 'ra_12'], effects: { explosionRadius: 15 } },
  { id: 'ra_12', name: 'Bombardment', desc: 'Arrows explode on impact', type: 'keystone', x: 600, y: 180, connections: ['ra_11'], effects: { bombardment: 1 } },
];

const SNIPE_TREE: SkillSubTreeNode[] = [
  { id: 'sn_start', name: 'Snipe', desc: 'Starting point for Snipe', type: 'start', x: 400, y: 620, connections: ['sn_1', 'sn_4', 'sn_7', 'sn_10'], effects: {} },
  { id: 'sn_1', name: 'Bullseye', desc: '+15% damage', type: 'small', x: 280, y: 540, connections: ['sn_start', 'sn_2'], effects: { damagePct: 15 } },
  { id: 'sn_2', name: 'Precision Grip', desc: '+10% crit chance', type: 'small', x: 220, y: 460, connections: ['sn_1', 'sn_3'], effects: { critChancePct: 10 } },
  { id: 'sn_3', name: 'Executioner', desc: 'Crits deal bonus execution damage', type: 'keystone', x: 180, y: 370, connections: ['sn_2'], effects: { executioner: 1 } },
  { id: 'sn_4', name: 'Electromagnetic', desc: '+25% projectile speed', type: 'small', x: 520, y: 540, connections: ['sn_start', 'sn_5'], effects: { projectileSpeedPct: 25 } },
  { id: 'sn_5', name: 'Phase Shift', desc: '+10% wall pierce damage', type: 'small', x: 580, y: 460, connections: ['sn_4', 'sn_6'], effects: { wallPierceDmgPct: 10 } },
  { id: 'sn_6', name: 'Railgun', desc: 'Projectiles pierce all walls', type: 'keystone', x: 620, y: 370, connections: ['sn_5'], effects: { railgun: 1 } },
  { id: 'sn_7', name: 'Bloody Mess', desc: '+15% crit damage', type: 'small', x: 300, y: 350, connections: ['sn_start', 'sn_8'], effects: { critDmgPct: 15 } },
  { id: 'sn_8', name: 'Death Blossom', desc: '+1 burst projectile', type: 'small', x: 240, y: 270, connections: ['sn_7', 'sn_9'], effects: { burstProjectiles: 1 } },
  { id: 'sn_9', name: 'Split Shot', desc: 'Projectile splits on hit', type: 'keystone', x: 200, y: 180, connections: ['sn_8'], effects: { splitShot: 1 } },
  { id: 'sn_10', name: "Hunter's Mark", desc: '+1 mark duration', type: 'small', x: 500, y: 350, connections: ['sn_start', 'sn_11'], effects: { markDuration: 1 } },
  { id: 'sn_11', name: 'Vulnerability', desc: '+5% mark damage bonus', type: 'small', x: 560, y: 270, connections: ['sn_10', 'sn_12'], effects: { markDmgBonusPct: 5 } },
  { id: 'sn_12', name: 'Marked for Death', desc: 'Marked targets take bonus damage', type: 'keystone', x: 600, y: 180, connections: ['sn_11'], effects: { markedForDeath: 1 } },
];

export class SkillSubTree {
  private nodes: Map<string, SkillSubTreeNode> = new Map();
  allocated: Set<string> = new Set();
  available: Set<string> = new Set();
  readonly abilityId: string;
  keystoneCount = 0;

  constructor(abilityId: string, data: SkillSubTreeNode[]) {
    this.abilityId = abilityId;
    for (const n of data) this.nodes.set(n.id, n);
    const start = data.find(n => n.type === 'start');
    if (start) {
      this.available.add(start.id);
      this.allocated.add(start.id);
      for (const c of start.connections) this.available.add(c);
    }
  }

  canAllocate(id: string): boolean {
    if (this.allocated.has(id)) return false;
    const node = this.nodes.get(id);
    if (!node || !this.available.has(id)) return false;
    if (node.type === 'keystone' && this.keystoneCount >= 2) return false;
    return true;
  }

  allocate(id: string): boolean {
    if (!this.canAllocate(id)) return false;
    this.allocated.add(id);
    const node = this.nodes.get(id)!;
    if (node.type === 'keystone') this.keystoneCount++;
    for (const c of node.connections) {
      if (c && !this.allocated.has(c)) this.available.add(c);
    }
    Logger.log('system', `[${this.abilityId}] Node allocated: ${node.name} (${node.type})`);
    return true;
  }

  canRefund(id: string): boolean {
    if (!this.allocated.has(id)) return false;
    const node = this.nodes.get(id);
    if (!node || node.type === 'start') return false;
    return true;
  }

  refund(id: string): number {
    if (!this.canRefund(id)) return 0;

    const toRemove = new Set<string>([id]);
    const queue = [id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const node = this.nodes.get(cur);
      if (!node) continue;
      for (const conn of node.connections) {
        const connNode = this.nodes.get(conn);
        if (connNode?.type === 'start') continue;
        if (this.allocated.has(conn) && !toRemove.has(conn)) {
          toRemove.add(conn);
          queue.push(conn);
        }
      }
    }

    let refunded = 0;
    for (const nid of toRemove) {
      this.allocated.delete(nid);
      refunded++;
      const n = this.nodes.get(nid);
      if (n?.type === 'keystone') this.keystoneCount--;
    }

    this.available.clear();
    for (const nid of this.allocated) {
      const n = this.nodes.get(nid);
      if (n) for (const c of n.connections) {
        if (!this.allocated.has(c)) this.available.add(c);
      }
    }

    return refunded;
  }

  hasKeystone(id: string): boolean {
    return this.allocated.has(id);
  }

  getNode(id: string): SkillSubTreeNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): SkillSubTreeNode[] {
    return [...this.nodes.values()];
  }

  getAllEffects(): Record<string, number> {
    const total: Record<string, number> = {};
    for (const id of this.allocated) {
      const node = this.nodes.get(id);
      if (!node) continue;
      for (const [key, val] of Object.entries(node.effects)) {
        total[key] = (total[key] || 0) + val;
      }
    }
    return total;
  }
}

const BONE_SPEAR_TREE: SkillSubTreeNode[] = [
  { id: 'bs_start', name: 'Bone Spear', desc: 'Starting point for Bone Spear', type: 'start', x: 400, y: 620, connections: ['bs_1'], effects: {} },
  { id: 'bs_1', name: 'Bone Spear Dmg I', desc: '+8% projectile damage', type: 'small', x: 280, y: 540, connections: ['bs_start', 'bs_2', 'bs_3'], effects: { projectileDmgPct: 8 } },
  { id: 'bs_2', name: 'Bone Spear Dmg II', desc: '+8% projectile damage', type: 'small', x: 220, y: 460, connections: ['bs_1', 'bs_4', 'bs_5', 'bs_6'], effects: { projectileDmgPct: 8 } },
  { id: 'bs_3', name: 'Bone Piercer', desc: '+1 projectile pierce', type: 'small', x: 220, y: 350, connections: ['bs_1', 'bs_8'], effects: { pierce: 1 } },
  { id: 'bs_4', name: 'Bone Speed', desc: '+10% projectile speed', type: 'small', x: 300, y: 270, connections: ['bs_2', 'bs_9'], effects: { projectileSpeedPct: 10 } },
  { id: 'bs_5', name: 'Bone Range', desc: '+10% skill range', type: 'small', x: 400, y: 270, connections: ['bs_2', 'bs_10'], effects: { rangePct: 10 } },
  { id: 'bs_6', name: 'Bone Barrage', desc: 'Bone Spear fires 2 additional projectiles in a spread', type: 'keystone', x: 140, y: 370, connections: ['bs_2'], effects: { boneBarrage: 1 } },
  { id: 'bs_7', name: 'Bone Calcify', desc: '+5% armor', type: 'small', x: 520, y: 540, connections: ['bs_start'], effects: { armorPct: 5 } },
  { id: 'bs_8', name: 'Marrow Seekers', desc: 'Bone Spear projectiles home toward enemies', type: 'keystone', x: 140, y: 430, connections: ['bs_3'], effects: { marrowSeekers: 1 } },
  { id: 'bs_9', name: 'Shattering Impact', desc: 'Bone Spear hits reduce enemy armor by 15% for 4s', type: 'keystone', x: 260, y: 180, connections: ['bs_4'], effects: { shatteringImpact: 1 } },
  { id: 'bs_10', name: 'Ossified Volley', desc: 'Every 4th Bone Spear is a guaranteed crit (2× damage)', type: 'keystone', x: 460, y: 180, connections: ['bs_5'], effects: { ossifiedVolley: 1 } },
];

const SOUL_DRAIN_TREE: SkillSubTreeNode[] = [
  { id: 'sd_start', name: 'Soul Drain', desc: 'Starting point for Soul Drain', type: 'start', x: 400, y: 620, connections: ['sd_1', 'sd_3', 'sd_5'], effects: {} },
  { id: 'sd_1', name: 'Soul Dmg I', desc: '+5% damage', type: 'small', x: 280, y: 540, connections: ['sd_start', 'sd_2'], effects: { damagePct: 5 } },
  { id: 'sd_2', name: 'Soul Dmg II', desc: '+5% damage', type: 'small', x: 220, y: 460, connections: ['sd_1', 'sd_6'], effects: { damagePct: 5 } },
  { id: 'sd_3', name: 'Soul Duration I', desc: '+10% channel duration', type: 'small', x: 520, y: 540, connections: ['sd_start', 'sd_4'], effects: { skillDurationPct: 10 } },
  { id: 'sd_4', name: 'Soul Duration II', desc: '+10% channel duration', type: 'small', x: 580, y: 460, connections: ['sd_3', 'sd_8'], effects: { skillDurationPct: 10 } },
  { id: 'sd_5', name: 'Soul Range', desc: '+10% skill range', type: 'small', x: 400, y: 350, connections: ['sd_start', 'sd_9'], effects: { rangePct: 10 } },
  { id: 'sd_6', name: 'Life Siphon', desc: 'Soul Drain heals for 100% of damage (up from 50%)', type: 'keystone', x: 140, y: 370, connections: ['sd_2'], effects: { lifeSiphon: 1 } },
  { id: 'sd_7', name: 'Soul Well', desc: '+5% mana regen', type: 'small', x: 620, y: 350, connections: ['sd_4'], effects: { manaRegenPct: 5 } },
  { id: 'sd_8', name: 'Essence Theft', desc: 'Soul Drain restores mana equal to 30% of damage dealt', type: 'keystone', x: 660, y: 370, connections: ['sd_4'], effects: { essenceTheft: 1 } },
  { id: 'sd_9', name: 'Shared Torment', desc: 'Soul Drain chains to 1 additional nearby enemy', type: 'keystone', x: 320, y: 270, connections: ['sd_5'], effects: { sharedTorment: 1 } },
  { id: 'sd_10', name: 'Unending Feast', desc: 'Soul Drain gains 2 additional ticks (+1s duration)', type: 'keystone', x: 480, y: 270, connections: ['sd_5'], effects: { unendingFeast: 1 } },
];

const CORPSE_EXPLOSION_TREE: SkillSubTreeNode[] = [
  { id: 'ce_start', name: 'Corpse Explosion', desc: 'Starting point for Corpse Explosion', type: 'start', x: 400, y: 620, connections: ['ce_1', 'ce_3', 'ce_5'], effects: {} },
  { id: 'ce_1', name: 'Corpse Dmg I', desc: '+8% corpse explosion damage', type: 'small', x: 280, y: 540, connections: ['ce_start', 'ce_2'], effects: { damagePct: 8 } },
  { id: 'ce_2', name: 'Corpse Dmg II', desc: '+8% corpse explosion damage', type: 'small', x: 220, y: 460, connections: ['ce_1', 'ce_6'], effects: { damagePct: 8 } },
  { id: 'ce_3', name: 'Corpse Range I', desc: '+10% explosion radius', type: 'small', x: 520, y: 540, connections: ['ce_start', 'ce_4'], effects: { aoePct: 10 } },
  { id: 'ce_4', name: 'Corpse Range II', desc: '+10% explosion radius', type: 'small', x: 580, y: 460, connections: ['ce_3', 'ce_8', 'ce_10'], effects: { aoePct: 10 } },
  { id: 'ce_5', name: 'Corpse Speed', desc: '+10% cast speed', type: 'small', x: 400, y: 350, connections: ['ce_start', 'ce_9'], effects: { castSpeedPct: 10 } },
  { id: 'ce_6', name: 'Chain Reaction', desc: 'Corpse explosions chain to nearby corpses (chain up to 3)', type: 'keystone', x: 140, y: 370, connections: ['ce_2'], effects: { chainReaction: 1 } },
  { id: 'ce_7', name: 'Corpse Decay', desc: '+5% damage over time', type: 'small', x: 660, y: 350, connections: ['ce_4'], effects: { dotDmgPct: 5 } },
  { id: 'ce_8', name: 'Necrotic Cloud', desc: 'Corpse explosion leaves a poison cloud for 4s (3% max HP/s)', type: 'keystone', x: 620, y: 370, connections: ['ce_4'], effects: { necroticCloud: 1 } },
  { id: 'ce_9', name: 'Desecrate', desc: 'If no corpse within range, create a desecrated ground corpse (2 charges)', type: 'keystone', x: 320, y: 270, connections: ['ce_5'], effects: { desecrate: 1 } },
  { id: 'ce_10', name: 'Overkill', desc: 'Corpse explosion has +50% damage and +40px radius', type: 'keystone', x: 480, y: 270, connections: ['ce_4'], effects: { overkill: 1 } },
];

const COMMAND_WRATH_TREE: SkillSubTreeNode[] = [
  { id: 'cw_start', name: 'Command Wrath', desc: 'Starting point for Command Wrath', type: 'start', x: 400, y: 620, connections: ['cw_1', 'cw_3', 'cw_5'], effects: {} },
  { id: 'cw_1', name: 'Command Dur I', desc: '+10% buff duration', type: 'small', x: 280, y: 540, connections: ['cw_start', 'cw_2'], effects: { skillDurationPct: 10 } },
  { id: 'cw_2', name: 'Command Dur II', desc: '+10% buff duration', type: 'small', x: 220, y: 460, connections: ['cw_1', 'cw_6'], effects: { skillDurationPct: 10 } },
  { id: 'cw_3', name: 'Command Dmg I', desc: '+5% minion damage', type: 'small', x: 520, y: 540, connections: ['cw_start', 'cw_4'], effects: { minionDmgPct: 5 } },
  { id: 'cw_4', name: 'Command Dmg II', desc: '+5% minion damage', type: 'small', x: 580, y: 460, connections: ['cw_3', 'cw_8'], effects: { minionDmgPct: 5 } },
  { id: 'cw_5', name: 'Command Effect', desc: '+5% buff effectiveness', type: 'small', x: 400, y: 350, connections: ['cw_start', 'cw_9', 'cw_10'], effects: { buffEffectivenessPct: 5 } },
  { id: 'cw_6', name: 'Inspiring Presence', desc: 'Command Wrath also grants +15% move speed to you and minions', type: 'keystone', x: 140, y: 370, connections: ['cw_2'], effects: { inspiringPresence: 1 } },
  { id: 'cw_7', name: 'Command Haste', desc: '+5% move speed', type: 'small', x: 660, y: 350, connections: ['cw_4'], effects: { moveSpeedPct: 5 } },
  { id: 'cw_8', name: 'Shared Fury', desc: 'Your attacks during Command Wrath extend its duration by 1s per hit (max +4s)', type: 'keystone', x: 660, y: 270, connections: ['cw_4'], effects: { sharedFury: 1 } },
  { id: 'cw_9', name: 'War Drums', desc: 'Command Wrath cooldown reduced by 2s', type: 'keystone', x: 320, y: 270, connections: ['cw_5'], effects: { warDrums: 1 } },
  { id: 'cw_10', name: 'Blood Pact', desc: 'Command Wrath costs health instead of mana, but grants +50% damage instead of +30%', type: 'keystone', x: 480, y: 270, connections: ['cw_5'], effects: { bloodPact: 1 } },
];

export const RANGER_SUB_TREES: Record<string, SkillSubTreeNode[]> = {
  quick_shot: QUICK_SHOT_TREE,
  multi_shot: MULTI_SHOT_TREE,
  rain_of_arrows: RAIN_OF_ARROWS_TREE,
  snipe: SNIPE_TREE,
};

export const SUMMONER_SUB_TREES: Record<string, SkillSubTreeNode[]> = {
  bone_spear: BONE_SPEAR_TREE,
  soul_drain: SOUL_DRAIN_TREE,
  corpse_explosion: CORPSE_EXPLOSION_TREE,
  command_wrath: COMMAND_WRATH_TREE,
};
