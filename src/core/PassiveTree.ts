import { Logger } from './Logger';

export interface NodeEffects {
  hp?: number; hpPct?: number; hpRegen?: number;
  mana?: number; manaPct?: number; manaRegenPct?: number;
  str?: number; dex?: number; int?: number;
  meleeDmgPct?: number; projectileDmgPct?: number;
  attackSpeedPct?: number; dodgePct?: number; moveSpeedPct?: number;
  damageReduction?: number; cooldownReductionPct?: number;
  skillDurationPct?: number; critChancePct?: number; critDmgPct?: number;
  manaCostReductionPct?: number; stunResist?: number;
  minionDmgPct?: number; minionHpPct?: number;
}

export interface PassiveNode {
  id: string;
  name: string;
  description: string;
  type: 'small' | 'notable' | 'keystone' | 'start';
  x: number;
  y: number;
  connections: string[];
  effects: NodeEffects;
}

const TREE_DATA: PassiveNode[] = [
  // START
  { id: 'start', name: 'Start', description: 'Beginning of the passive tree', type: 'start', x: 400, y: 630, connections: ['hp_10', 'as_3', 'mana_15'], effects: {} },

  // MIGHT BRANCH
  { id: 'hp_10', name: 'Vitality', description: '+10 maximum health', type: 'small', x: 160, y: 580, connections: ['start', 'str_5'], effects: { hp: 10 } },
  { id: 'str_5', name: 'Strength', description: '+5 Strength', type: 'small', x: 160, y: 530, connections: ['hp_10', 'melee_5'], effects: { str: 5 } },
  { id: 'melee_5', name: 'Power', description: '+5% melee damage', type: 'small', x: 160, y: 480, connections: ['str_5', 'iron_skin'], effects: { meleeDmgPct: 5 } },
  { id: 'iron_skin', name: 'Iron Skin', description: '+25 maximum health, +5% damage reduction', type: 'notable', x: 160, y: 425, connections: ['melee_5', 'hp_15', 'armor_5'], effects: { hp: 25, damageReduction: 5 } },
  { id: 'hp_15', name: 'Endurance', description: '+15 maximum health', type: 'small', x: 100, y: 375, connections: ['iron_skin', 'hp_regen'], effects: { hp: 15 } },
  { id: 'hp_regen', name: 'Regeneration', description: '+1 health per second', type: 'small', x: 100, y: 325, connections: ['hp_15', 'melee_10'], effects: { hpRegen: 1 } },
  { id: 'melee_10', name: 'Might', description: '+8% melee damage', type: 'small', x: 100, y: 275, connections: ['hp_regen', 'juggernaut'], effects: { meleeDmgPct: 8 } },
  { id: 'armor_5', name: 'Hardened', description: '+5% damage reduction', type: 'small', x: 220, y: 375, connections: ['iron_skin', 'str_10'], effects: { damageReduction: 5 } },
  { id: 'str_10', name: 'Brawn', description: '+8 Strength', type: 'small', x: 220, y: 325, connections: ['armor_5', 'hp_20'], effects: { str: 8 } },
  { id: 'hp_20', name: 'Veteran', description: '+20 maximum health', type: 'small', x: 220, y: 275, connections: ['str_10', 'juggernaut'], effects: { hp: 20 } },
  { id: 'juggernaut', name: 'Juggernaut', description: '+15% maximum health, +10% melee damage', type: 'notable', x: 160, y: 220, connections: ['melee_10', 'juggernaut_hp', 'juggernaut_dmg'], effects: { hpPct: 15, meleeDmgPct: 10 } },
  { id: 'juggernaut_hp', name: 'Fortitude', description: '+15 maximum health', type: 'small', x: 100, y: 170, connections: ['juggernaut', 'colossus'], effects: { hp: 15 } },
  { id: 'juggernaut_dmg', name: 'Shatter', description: '+5% melee damage', type: 'small', x: 220, y: 170, connections: ['juggernaut', 'colossus'], effects: { meleeDmgPct: 5 } },
  { id: 'colossus', name: 'Colossus', description: '+30% maximum health, -10% movement speed', type: 'keystone', x: 160, y: 115, connections: ['juggernaut_hp', 'juggernaut_dmg'], effects: { hpPct: 30, moveSpeedPct: -10 } },

  // CUNNING BRANCH
  { id: 'as_3', name: 'Alacrity', description: '+3% attack speed', type: 'small', x: 400, y: 580, connections: ['start', 'dex_5'], effects: { attackSpeedPct: 3 } },
  { id: 'dex_5', name: 'Agility', description: '+5 Dexterity', type: 'small', x: 400, y: 530, connections: ['as_3', 'dodge_3'], effects: { dex: 5 } },
  { id: 'dodge_3', name: 'Evasion', description: '+3% dodge chance', type: 'small', x: 400, y: 480, connections: ['dex_5', 'swiftfoot'], effects: { dodgePct: 3 } },
  { id: 'swiftfoot', name: 'Swiftfoot', description: '+8% attack speed, +5% movement speed', type: 'notable', x: 400, y: 425, connections: ['dodge_3', 'crit_3', 'as_6'], effects: { attackSpeedPct: 8, moveSpeedPct: 5 } },
  { id: 'crit_3', name: 'Precision', description: '+3% critical strike chance', type: 'small', x: 340, y: 375, connections: ['swiftfoot', 'dex_10'], effects: { critChancePct: 3 } },
  { id: 'dex_10', name: 'Finesse', description: '+8 Dexterity', type: 'small', x: 340, y: 325, connections: ['crit_3', 'crit_dmg'], effects: { dex: 8 } },
  { id: 'crit_dmg', name: 'Deadly', description: '+15% critical damage multiplier', type: 'small', x: 340, y: 275, connections: ['dex_10', 'sharp_shooter'], effects: { critDmgPct: 15 } },
  { id: 'as_6', name: 'Haste', description: '+5% attack speed', type: 'small', x: 460, y: 375, connections: ['swiftfoot', 'ms_3'], effects: { attackSpeedPct: 5 } },
  { id: 'ms_3', name: 'Fleetness', description: '+3% movement speed', type: 'small', x: 460, y: 325, connections: ['as_6', 'dodge_6'], effects: { moveSpeedPct: 3 } },
  { id: 'dodge_6', name: 'Gale', description: '+4% dodge chance', type: 'small', x: 460, y: 275, connections: ['ms_3', 'sharp_shooter'], effects: { dodgePct: 4 } },
  { id: 'sharp_shooter', name: 'Sharp Shooter', description: '+15% critical damage, +10% projectile damage', type: 'notable', x: 400, y: 220, connections: ['crit_dmg', 'deadeye'], effects: { critDmgPct: 15, projectileDmgPct: 10 } },
  { id: 'deadeye', name: 'Deadeye', description: '+20% attack speed, +10% dodge chance', type: 'keystone', x: 400, y: 115, connections: ['sharp_shooter', 'dodge_6'], effects: { attackSpeedPct: 20, dodgePct: 10 } },

  // SORCERY BRANCH
  { id: 'mana_15', name: 'Clarity', description: '+15 maximum mana', type: 'small', x: 640, y: 580, connections: ['start', 'int_5'], effects: { mana: 15 } },
  { id: 'int_5', name: 'Wisdom', description: '+5 Intelligence', type: 'small', x: 640, y: 530, connections: ['mana_15', 'mana_regen'], effects: { int: 5 } },
  { id: 'mana_regen', name: 'Meditation', description: '+10% mana regeneration rate', type: 'small', x: 640, y: 480, connections: ['int_5', 'arcane_mind'], effects: { manaRegenPct: 10 } },
  { id: 'arcane_mind', name: 'Arcane Mind', description: '+30 maximum mana, +15% mana regeneration', type: 'notable', x: 640, y: 425, connections: ['mana_regen', 'skill_dur', 'cdr_3'], effects: { mana: 30, manaRegenPct: 15 } },
  { id: 'skill_dur', name: 'Persistence', description: '+5% skill effect duration', type: 'small', x: 580, y: 375, connections: ['arcane_mind', 'int_10'], effects: { skillDurationPct: 5 } },
  { id: 'int_10', name: 'Brilliance', description: '+8 Intelligence', type: 'small', x: 580, y: 325, connections: ['skill_dur', 'skill_dur_2'], effects: { int: 8 } },
  { id: 'skill_dur_2', name: 'Continuity', description: '+8% skill effect duration', type: 'small', x: 580, y: 275, connections: ['int_10', 'chronomancer'], effects: { skillDurationPct: 8 } },
  { id: 'cdr_3', name: 'Alacrity', description: '+3% cooldown reduction', type: 'small', x: 700, y: 375, connections: ['arcane_mind', 'mana_25'], effects: { cooldownReductionPct: 3 } },
  { id: 'mana_25', name: 'Reservoir', description: '+20 maximum mana', type: 'small', x: 700, y: 325, connections: ['cdr_3', 'cdr_5'], effects: { mana: 20 } },
  { id: 'cdr_5', name: 'Temporal', description: '+4% cooldown reduction', type: 'small', x: 700, y: 275, connections: ['mana_25', 'chronomancer'], effects: { cooldownReductionPct: 4 } },
  { id: 'chronomancer', name: 'Chronomancer', description: '-10% cooldowns, +10% skill duration', type: 'notable', x: 640, y: 220, connections: ['skill_dur_2', 'cdr_5', 'archmage'], effects: { cooldownReductionPct: 10, skillDurationPct: 10 } },
  { id: 'archmage', name: 'Archmage', description: '+40% maximum mana, -20% mana cost of skills', type: 'keystone', x: 640, y: 115, connections: ['chronomancer'], effects: { manaPct: 40, manaCostReductionPct: 20 } },

  // MINION BRANCH (from archmage)
  { id: 'minion_dmg_5', name: 'Bone Lord', description: '+5% minion damage', type: 'small', x: 720, y: 150, connections: ['archmage', 'minion_dmg_10'], effects: { minionDmgPct: 5 } },
  { id: 'minion_dmg_10', name: 'Necrotic Power', description: '+10% minion damage', type: 'small', x: 800, y: 150, connections: ['minion_dmg_5', 'minion_notable'], effects: { minionDmgPct: 10 } },
  { id: 'minion_notable', name: 'Soul Weaver', description: '+15% minion damage, +10% minion life', type: 'notable', x: 880, y: 150, connections: ['minion_dmg_10', 'minion_hp_10'], effects: { minionDmgPct: 15, minionHpPct: 10 } },
  { id: 'minion_hp_10', name: 'Bone Plating', description: '+10% minion life', type: 'small', x: 960, y: 150, connections: ['minion_notable'], effects: { minionHpPct: 10 } },
];

export class PassiveTree {
  nodes: Map<string, PassiveNode> = new Map();
  allocated: Set<string> = new Set();
  available: Set<string> = new Set();

  constructor() {
    for (const n of TREE_DATA) this.nodes.set(n.id, n);
    this.available.add('start');
    this.allocated.add('start');
    for (const c of this.nodes.get('start')!.connections) this.available.add(c);
  }

  canAllocate(id: string): boolean {
    if (this.allocated.has(id) || !this.available.has(id)) return false;
    return true;
  }

  allocate(id: string): boolean {
    if (!this.canAllocate(id)) return false;
    this.allocated.add(id);
    const node = this.nodes.get(id)!;
    for (const c of node.connections) {
      if (!this.allocated.has(c)) this.available.add(c);
    }
    Logger.log('system', `Passive allocated: ${node.name} (${node.type})`);
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
    }

    this.available.clear();
    this.available.add('start');
    for (const nid of this.allocated) {
      const n = this.nodes.get(nid);
      if (n) for (const c of n.connections) {
        if (!this.allocated.has(c)) this.available.add(c);
      }
    }

    return refunded;
  }

  getAllEffects(): NodeEffects {
    const total: NodeEffects = {};
    for (const id of this.allocated) {
      const node = this.nodes.get(id);
      if (!node) continue;
      for (const [key, val] of Object.entries(node.effects)) {
        total[key as keyof NodeEffects] = (total[key as keyof NodeEffects] || 0) + (val as number);
      }
    }
    return total;
  }

  getNode(id: string): PassiveNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): PassiveNode[] {
    return TREE_DATA;
  }
}
