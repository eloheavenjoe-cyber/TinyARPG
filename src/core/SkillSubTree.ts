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

export const RANGER_SUB_TREES: Record<string, SkillSubTreeNode[]> = {
  quick_shot: QUICK_SHOT_TREE,
  multi_shot: MULTI_SHOT_TREE,
  rain_of_arrows: RAIN_OF_ARROWS_TREE,
  snipe: SNIPE_TREE,
};
