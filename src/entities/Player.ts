import { AnimatedSprite, Texture } from 'pixi.js';
import { Sprites } from '../rendering/Sprites';
import { InputManager } from '../core/InputManager';
import { createWarriorSprite, createRangerSprite, createMonkSprite, playMonkAnimation, MonkAnimName, isMonkLoaded, playAnimation, isLoaded } from '../rendering/SpriteAnimator';
import { SkillManager } from '../core/SkillManager';
import { SkillDef, ClassType } from '../core/SkillDefs';
import { PassiveTree } from '../core/PassiveTree';
import { computeStats } from '../core/StatSystem';
import { Slot, AFFIXES } from '../core/ItemDefs';
import { GeneratedItem } from '../core/ItemGenerator';
import { Logger } from '../core/Logger';
import { Rect, resolveCollision } from '../world/Room';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';

export interface OrbInfo {
  kind: 'orb';
  orbId: string;
  count: number;
}

export interface EquipSlot {
  kind: 'equip';
  item: GeneratedItem;
}

export type InventorySlot = EquipSlot | OrbInfo | null;

export class Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health = 100;
  maxHealth = 100;
  mana = 50;
  maxMana = 50;
  gold = 0;
  speed = 8;
  alive = true;

  sprite: AnimatedSprite;
  skills: SkillManager;
  passiveTree: PassiveTree = new PassiveTree();

  level = 1;
  xp = 0;
  get xpToNext(): number { return this.level * 50; }

  attrs = { str: 0, dex: 0, int: 0 };
  unspentAttrPoints = 0;
  passivePoints = 0;
  inventory: InventorySlot[] = new Array(30).fill(null);
  equipment: Record<Slot, GeneratedItem | null> = {
    weapon: null, body: null, helmet: null, boots: null,
    ring: null, ring2: null, amulet: null,
  };

  private invulnTimer = 0;
  godMode = false;
  slowTimer = 0;
  private fortifyTimer = 0;
  private attackCooldown = 0;
  private fallbackAttackCooldown = 15;
  private readonly baseManaRegen = 8;
  lastHitInfo: { x: number; y: number; damage: number } | null = null;
  private animState: 'idle' | 'walk' | 'attack' = 'idle';
  facingAngle = 0;
  private channeling = false;
  private channelTimer = 0;

  private _computedStats = computeStats(this.passiveTree, this.attrs, 100, 50);

  constructor(x: number, y: number, classType: ClassType = 'warrior') {
    this.x = x;
    this.y = y;
    this.width = classType === 'monk' ? 32 : 28;
    this.height = classType === 'monk' ? 32 : 28;
    if (classType === 'warrior' && isLoaded()) {
      this.sprite = createWarriorSprite();
    } else if (classType === 'ranger' && isLoaded('ranger')) {
      this.sprite = createRangerSprite();
    } else if (classType === 'monk' && isMonkLoaded()) {
      this.sprite = createMonkSprite();
      this.sprite.scale.set(1.125);
    } else {
      const tex = classType === 'ranger' ? Sprites.ranger : Sprites.player;
      const s = new AnimatedSprite([tex]);
      s.anchor.set(0.5);
      this.sprite = s;
    }
    this.skills = new SkillManager(classType);
    this.updateSprite();
  }

  get classType(): ClassType {
    return this.skills.classType;
  }

  get computedStats() { return this._computedStats; }

  recalcStats() {
    const equipStats: Record<string, number> = {};
    for (const item of Object.values(this.equipment)) {
      if (!item) continue;
      for (const [stat, val] of Object.entries(item.computedStats)) {
        equipStats[stat] = (equipStats[stat] || 0) + (val as number);
      }
    }
    this._computedStats = computeStats(this.passiveTree, this.attrs, 100, 50, equipStats);
    const s = this._computedStats;
    this.maxHealth = s.maxHp;
    this.health = Math.min(this.health, this.maxHealth);
    this.maxMana = s.maxMana;
    this.mana = Math.min(this.mana, this.maxMana);
    this.speed = 6 * s.moveSpeedMult;
  }

  pickupItem(item: GeneratedItem): boolean {
    const idx = this.inventory.findIndex(s => s === null);
    if (idx === -1) return false;
    this.inventory[idx] = { kind: 'equip', item };
    return true;
  }

  equipItem(gridIndex: number): boolean {
    const slot = this.inventory[gridIndex];
    if (!slot || slot.kind !== 'equip') return false;
    const item = slot.item;
    const equipSlot = item.base.slot;
    const slotKey: Slot = equipSlot === 'ring' && this.equipment.ring !== null && this.equipment.ring2 === null
      ? 'ring2' : equipSlot;
    const current = this.equipment[slotKey];
    this.equipment[slotKey] = item;
    this.inventory[gridIndex] = current ? { kind: 'equip', item: current } : null;
    this.recalcStats();
    return true;
  }

  unequipItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const idx = this.inventory.findIndex(s => s === null);
    if (idx === -1) return false;
    this.inventory[idx] = { kind: 'equip', item };
    this.equipment[slot] = null;
    this.recalcStats();
    return true;
  }

  pickupOrb(orbId: string, count: number = 1): boolean {
    const existing = this.inventory.find(
      (s): s is OrbInfo => s !== null && s.kind === 'orb' && s.orbId === orbId
    );
    if (existing) {
      existing.count += count;
      return true;
    }
    const idx = this.inventory.findIndex(s => s === null);
    if (idx === -1) return false;
    this.inventory[idx] = { kind: 'orb', orbId, count };
    return true;
  }

  private empowerItemInternal(item: GeneratedItem): boolean {
    if (item.rarity !== 'rare' || item.uniqueId) return false;
    if (item.affixes.length >= 6) return false;

    const prefixes = AFFIXES.filter(a => a.type === 'prefix').sort(() => Math.random() - 0.5);
    const suffixes = AFFIXES.filter(a => a.type === 'suffix').sort(() => Math.random() - 0.5);

    const usedStats = new Set(item.affixes.map(a => a.affix.stat));
    const pool = item.affixes.length <= 3 ? prefixes : suffixes;
    const pick = pool.find(a => !usedStats.has(a.stat));
    if (!pick) return false;

    const roll = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
    item.affixes.push({ affix: pick, roll });
    item.computedStats[pick.stat] = (item.computedStats[pick.stat] || 0) + roll;
    return true;
  }

  private fluxItemInternal(item: GeneratedItem): boolean {
    if (item.rarity !== 'rare' || item.uniqueId) return false;

    const prefixes = AFFIXES.filter(a => a.type === 'prefix').sort(() => Math.random() - 0.5);
    const suffixes = AFFIXES.filter(a => a.type === 'suffix').sort(() => Math.random() - 0.5);
    const count = 4 + Math.floor(Math.random() * 3);

    const pickPref = Math.min(Math.ceil(count / 2), prefixes.length);
    const pickSuff = Math.min(Math.floor(count / 2), suffixes.length);

    item.affixes = [];
    for (const src of [prefixes.slice(0, pickPref), suffixes.slice(0, pickSuff)]) {
      for (const affix of src) {
        const roll = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1));
        item.affixes.push({ affix, roll });
      }
    }

    const stats: Record<string, number> = { ...item.base.innateStats };
    if (item.damageRoll > 0) stats.damage = item.damageRoll;
    for (const p of item.affixes) {
      stats[p.affix.stat] = (stats[p.affix.stat] || 0) + p.roll;
    }
    item.computedStats = stats;
    return true;
  }

  empowerItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const ok = this.empowerItemInternal(item);
    if (ok) this.recalcStats();
    return ok;
  }

  fluxItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const ok = this.fluxItemInternal(item);
    if (ok) this.recalcStats();
    return ok;
  }

  empowerInventoryItem(gridIndex: number): boolean {
    const entry = this.inventory[gridIndex];
    if (!entry || entry.kind !== 'equip') return false;
    const ok = this.empowerItemInternal(entry.item);
    if (ok) this.recalcStats();
    return ok;
  }

  fluxInventoryItem(gridIndex: number): boolean {
    const entry = this.inventory[gridIndex];
    if (!entry || entry.kind !== 'equip') return false;
    const ok = this.fluxItemInternal(entry.item);
    if (ok) this.recalcStats();
    return ok;
  }

  private mutateItemInternal(item: GeneratedItem): boolean {
    if (item.rarity !== 'normal' || item.uniqueId) return false;

    const prefixes = AFFIXES.filter(a => a.type === 'prefix').sort(() => Math.random() - 0.5);
    const suffixes = AFFIXES.filter(a => a.type === 'suffix').sort(() => Math.random() - 0.5);

    item.affixes = [];
    for (const src of [prefixes.slice(0, 1), suffixes.slice(0, 1)]) {
      for (const affix of src) {
        const roll = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1));
        item.affixes.push({ affix, roll });
      }
    }

    item.rarity = 'magic';
    const stats: Record<string, number> = { ...item.base.innateStats };
    if (item.damageRoll > 0) stats.damage = item.damageRoll;
    for (const p of item.affixes) {
      stats[p.affix.stat] = (stats[p.affix.stat] || 0) + p.roll;
    }
    item.computedStats = stats;
    return true;
  }

  private growItemInternal(item: GeneratedItem): boolean {
    if (item.rarity !== 'magic' || item.uniqueId) return false;
    if (item.affixes.length >= 4) return false;

    const prefixes = AFFIXES.filter(a => a.type === 'prefix').sort(() => Math.random() - 0.5);
    const suffixes = AFFIXES.filter(a => a.type === 'suffix').sort(() => Math.random() - 0.5);

    const usedStats = new Set(item.affixes.map(a => a.affix.stat));
    const pool = item.affixes.length <= 2 ? prefixes : suffixes;
    const pick = pool.find(a => !usedStats.has(a.stat));
    if (!pick) return false;

    const roll = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
    item.affixes.push({ affix: pick, roll });
    item.computedStats[pick.stat] = (item.computedStats[pick.stat] || 0) + roll;
    return true;
  }

  private ascendItemInternal(item: GeneratedItem): boolean {
    if (item.rarity !== 'normal' || item.uniqueId) return false;

    const prefixes = AFFIXES.filter(a => a.type === 'prefix').sort(() => Math.random() - 0.5);
    const suffixes = AFFIXES.filter(a => a.type === 'suffix').sort(() => Math.random() - 0.5);
    const count = 4 + Math.floor(Math.random() * 3);

    const pickPref = Math.min(Math.ceil(count / 2), prefixes.length);
    const pickSuff = Math.min(Math.floor(count / 2), suffixes.length);

    item.affixes = [];
    for (const src of [prefixes.slice(0, pickPref), suffixes.slice(0, pickSuff)]) {
      for (const affix of src) {
        const roll = affix.min + Math.floor(Math.random() * (affix.max - affix.min + 1));
        item.affixes.push({ affix, roll });
      }
    }

    item.rarity = 'rare';
    const stats: Record<string, number> = { ...item.base.innateStats };
    if (item.damageRoll > 0) stats.damage = item.damageRoll;
    for (const p of item.affixes) {
      stats[p.affix.stat] = (stats[p.affix.stat] || 0) + p.roll;
    }
    item.computedStats = stats;
    return true;
  }

  private purifyItemInternal(item: GeneratedItem): boolean {
    if (item.rarity === 'normal' || item.uniqueId) return false;

    item.affixes = [];
    item.rarity = 'normal';
    const stats: Record<string, number> = { ...item.base.innateStats };
    if (item.damageRoll > 0) stats.damage = item.damageRoll;
    item.computedStats = stats;
    return true;
  }

  mutateItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const ok = this.mutateItemInternal(item);
    if (ok) this.recalcStats();
    return ok;
  }

  growItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const ok = this.growItemInternal(item);
    if (ok) this.recalcStats();
    return ok;
  }

  ascendItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const ok = this.ascendItemInternal(item);
    if (ok) this.recalcStats();
    return ok;
  }

  purifyItem(slot: Slot): boolean {
    const item = this.equipment[slot];
    if (!item) return false;
    const ok = this.purifyItemInternal(item);
    if (ok) this.recalcStats();
    return ok;
  }

  mutateInventoryItem(gridIndex: number): boolean {
    const entry = this.inventory[gridIndex];
    if (!entry || entry.kind !== 'equip') return false;
    const ok = this.mutateItemInternal(entry.item);
    if (ok) this.recalcStats();
    return ok;
  }

  growInventoryItem(gridIndex: number): boolean {
    const entry = this.inventory[gridIndex];
    if (!entry || entry.kind !== 'equip') return false;
    const ok = this.growItemInternal(entry.item);
    if (ok) this.recalcStats();
    return ok;
  }

  ascendInventoryItem(gridIndex: number): boolean {
    const entry = this.inventory[gridIndex];
    if (!entry || entry.kind !== 'equip') return false;
    const ok = this.ascendItemInternal(entry.item);
    if (ok) this.recalcStats();
    return ok;
  }

  purifyInventoryItem(gridIndex: number): boolean {
    const entry = this.inventory[gridIndex];
    if (!entry || entry.kind !== 'equip') return false;
    const ok = this.purifyItemInternal(entry.item);
    if (ok) this.recalcStats();
    return ok;
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.passivePoints++;
      this.unspentAttrPoints += 3;
      leveled = true;
      this.recalcStats();
      Logger.log('combat', `Level up! Now level ${this.level} (${this.passivePoints} passive, ${this.unspentAttrPoints} attr points)`);
    }
    return leveled;
  }

  update(input: InputManager, mouseWorldX: number, mouseWorldY: number, walls: Rect[], dt: number) {
    if (!this.alive) return;

    this.skills.update(dt);

    if (this.channeling) {
      this.channelTimer -= dt;
      if (this.channelTimer <= 0) {
        this.channeling = false;
        const healAmt = Math.round(this.maxHealth * 0.25);
        this.health = Math.min(this.maxHealth, this.health + healAmt);
        this.skills.addBuff('meditate_damage');
      }
    }

    let dx = 0, dy = 0;

    if (!this.channeling) {
      if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) dy = -1;
      if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) dy = 1;
      if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) dx = -1;
      if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) dx = 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      if (dx !== 0 || dy !== 0) {
        Logger.log('movement', `Moving: (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
      }

      const speedMult = this.skills.moveSpeedBonus();
      const slowMult = this.slowTimer > 0 ? 0.5 : 1;
      this.x += dx * this.speed * speedMult * slowMult * dt;
      this.y += dy * this.speed * slowMult * dt;

      const bounds = this.getBounds();
      const resolved = resolveCollision(bounds, walls);
      const newX = resolved.x + this.width / 2;
      const newY = resolved.y + this.height / 2;
      if (newX !== this.x || newY !== this.y) {
        Logger.log('collision', `Wall push at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}) -> (${newX.toFixed(0)}, ${newY.toFixed(0)})`);
      }
      this.x = newX;
      this.y = newY;
    }

    this.facingAngle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
    this.sprite.scale.x = Math.abs(this.facingAngle) > Math.PI / 2 ? -1 : 1;

    // Animation state switching
    const isMoving = dx !== 0 || dy !== 0;
    if (isMoving && this.animState === 'idle') {
      this.animState = 'walk';
      if (this.classType === 'monk') {
        playMonkAnimation(this.sprite, 'run');
      } else {
        playAnimation(this.sprite, 'walk', true, this.classType);
      }
    } else if (!isMoving && this.animState === 'walk') {
      this.animState = 'idle';
      if (this.classType === 'monk') {
        playMonkAnimation(this.sprite, 'idle');
      } else {
        playAnimation(this.sprite, 'idle', true, this.classType);
      }
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      this.sprite.alpha = Math.floor(this.invulnTimer / 5) % 2 === 0 ? 1 : 0.4;
    } else {
      this.sprite.alpha = 1;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      this.sprite.tint = 0xcc88ff;
    } else {
      this.sprite.tint = 0xffffff;
    }

    if (this.fortifyTimer > 0) this.fortifyTimer -= dt;

    const regenMult = 1 + ((this._computedStats.manaRegenPct || 0) / 100);
    const regen = (this.baseManaRegen + this.skills.manaRegenBonus()) * regenMult;
    this.mana = Math.min(this.maxMana, this.mana + regen * (dt / 60));

    this.updateSprite();
  }

  applySlow(duration: number) {
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  takeDamage(amount: number): boolean {
    this.channeling = false;
    if (this.invulnTimer > 0 || !this.alive) return false;
    if (this.godMode) return false;
    if (this.skills.isInvulnerable()) return false;

    const skillReduction = this.skills.damageReduction();
    const treeReduction = (this._computedStats.damageReduction || 0) / 100;
    const fortifyReduction = this.fortifyTimer > 0 ? (this._computedStats.fortifyOnHit || 0) / 100 : 0;
    const reduction = Math.min(0.5, skillReduction + treeReduction + fortifyReduction);
    let finalDmg = reduction > 0 ? Math.round(amount * (1 - reduction)) : amount;

    if (this.classType === 'monk') {
      const stanceReduction = this.skills.stanceDamageReductionBonus();
      if (stanceReduction > 0) finalDmg = Math.round(finalDmg * (1 - stanceReduction));
      if (stanceReduction < 0) finalDmg = Math.round(finalDmg * (1 + Math.abs(stanceReduction)));
    }

    this.health = Math.max(0, this.health - finalDmg);
    this.invulnTimer = 60;
    Logger.log('combat', `Player took ${finalDmg} dmg (${reduction > 0 ? `${Math.round(reduction * 100)}% reduced, ` : ''}hp: ${this.health}/${this.maxHealth})`);

    if (this.health <= 0) {
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('combat', 'Player died');
      return true;
    }
    return false;
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    Logger.log('combat', `Player healed for ${amount} (hp: ${this.health}/${this.maxHealth})`);
  }

  triggerAttackAnimation(skillId: string) {
    this.animState = 'attack';
    if (this.classType === 'monk') {
      const animMap: Record<string, MonkAnimName> = {
        basic_strike: 'basic_strike',
        dragon_palm: 'dragon_palm',
        whirlwind_kick: 'whirlwind_kick',
        tiger_uppercut: 'dragon_palm',
      };
      const animName = animMap[skillId] || 'basic_strike';
      playMonkAnimation(this.sprite, animName, false);
      this.sprite.onComplete = () => {
        if (this.animState === 'attack') {
          this.animState = 'idle';
          playMonkAnimation(this.sprite, 'idle');
        }
      };
    } else {
      playAnimation(this.sprite, 'attack', false, this.classType);
      this.sprite.onComplete = () => {
        if (this.animState === 'attack') {
          this.animState = 'idle';
          playAnimation(this.sprite, 'idle', true, this.classType);
        }
      };
    }
  }

  isChanneling(): boolean {
    return this.channeling;
  }

  startChannel(skillId: string, duration: number) {
    this.channeling = true;
    this.channelTimer = duration;
  }

  useMainAbility(enemies: Enemy[]): boolean {
    const skill = this.skills.mainAbility;
    if (!skill) return false;

    const result = this.skills.consume(0, this.mana);
    if (!result) return false;
    this.mana -= result.manaCost;

    this.triggerAttackAnimation(skill.id);
    this.applySkillDamage(skill, enemies);
    return true;
  }

  executeTechnique(skill: SkillDef, enemies: Enemy[]): boolean {
    this.triggerAttackAnimation(skill.id);
    this.applySkillDamage(skill, enemies);
    return true;
  }

  private applySkillDamage(skill: SkillDef, enemies: Enemy[]) {
    const aoeMult = 1 + ((this._computedStats.skillAoePct || 0) / 100);
    const leechPct = this._computedStats.lifeLeechPct || 0;
    const fortifyAmt = this._computedStats.fortifyOnHit || 0;
    let totalDmg = 0;
    let hitCount = 0;

    switch (skill.effectType) {
      case 'cone': {
        const angleRad = (skill.angle || Math.PI / 2) * aoeMult;
        const range = (skill.range || 150) * aoeMult;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > range) continue;
          const angleToEnemy = Math.atan2(dy, dx);
          let diff = angleToEnemy - this.facingAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) > angleRad / 2) continue;
          const dmg = this.calcDamage(skill);
          enemy.takeDamage(dmg);
          this.lastHitInfo = { x: enemy.x, y: enemy.y, damage: dmg };
          totalDmg += dmg;
          hitCount++;
          Logger.log('combat', `${skill.name} hit for ${dmg}`);
        }
        break;
      }
      case 'single': {
        let closest: Enemy | null = null;
        let closestDist = (skill.range || 150) * aoeMult;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (d < closestDist) { closestDist = d; closest = enemy; }
        }
        if (closest) {
          const dmg = this.calcDamage(skill);
          closest.takeDamage(dmg);
          if (skill.id === 'tiger_uppercut' && closest.alive) {
            const angle = Math.atan2(closest.y - this.y, closest.x - this.x);
            closest.x += Math.cos(angle) * 80;
            closest.y += Math.sin(angle) * 80;
          }
          this.lastHitInfo = { x: closest.x, y: closest.y, damage: dmg };
          totalDmg += dmg;
          hitCount++;
          Logger.log('combat', `${skill.name} hit for ${dmg}${skill.duration ? ' (stun)' : ''}`);
        }
        break;
      }
      case 'aoe_self': {
        const radius = (skill.radius || 75) * aoeMult;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (Math.hypot(enemy.x - this.x, enemy.y - this.y) < radius) {
            const dmg = this.calcDamage(skill);
            enemy.takeDamage(dmg);
            this.lastHitInfo = { x: enemy.x, y: enemy.y, damage: dmg };
            totalDmg += dmg;
            hitCount++;
          }
        }
        Logger.log('combat', `${skill.name} aoe`);
        break;
      }
    }

    if (this.classType === 'monk') {
      const lifesteal = this.skills.stanceLifestealBonus();
      if (lifesteal > 0 && totalDmg > 0) {
        const heal = Math.round(totalDmg * lifesteal);
        this.health = Math.min(this.maxHealth, this.health + heal);
      }
    }

    if (leechPct > 0 && totalDmg > 0) {
      const heal = Math.round(totalDmg * leechPct / 100);
      this.health = Math.min(this.maxHealth, this.health + heal);
    }
    if (fortifyAmt > 0 && hitCount > 0) {
      this.fortifyTimer = 120;
    }

    this.updateSprite();
    return true;
  }

  fireProjectile(x: number, y: number, angle: number, skill: SkillDef, projectiles: Projectile[]): Projectile[] {
    const speed = 8 * this.skills.projectileSpeedBonus();
    const damage = Math.round(25 * skill.damageMult);
    const pierce = skill.effectType === 'projectile_pierce';
    const created: Projectile[] = [];

    switch (skill.effectType) {
      case 'projectile': {
        const count = skill.value || 1;
        for (let i = 0; i < count; i++) {
          const p = new Projectile(x, y, angle, speed, damage, pierce);
          p.lifetime = skill.range / speed;
          created.push(p);
        }
        break;
      }
      case 'projectile_spread': {
        const count = skill.value || 8;
        const coneAngle = skill.angle !== undefined ? skill.angle * (Math.PI / 180) : Math.PI * 2;
        if (skill.angle !== undefined) {
          const halfCone = coneAngle / 2;
          for (let i = 0; i < count; i++) {
            const a = angle - halfCone + (i / (count - 1 || 1)) * coneAngle;
            const p = new Projectile(x, y, a, speed, damage, pierce);
            p.lifetime = skill.range / speed;
            created.push(p);
          }
        } else {
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            const p = new Projectile(x, y, a, speed, damage, pierce);
            p.lifetime = skill.range / speed;
            created.push(p);
          }
        }
        break;
      }
      case 'projectile_pierce': {
        const p = new Projectile(x, y, angle, speed, damage, true);
        p.lifetime = skill.range / speed;
        created.push(p);
        break;
      }
    }

    const extra = this.computedStats?.additionalProjectiles || 0;
    if (extra > 0 && skill.effectType !== 'projectile_spread') {
      for (let i = 0; i < extra; i++) {
        const spreadAngle = (i - (extra - 1) / 2) * 0.1;
        const p = new Projectile(x, y, angle + spreadAngle, speed, damage, pierce);
        p.lifetime = skill.range / speed;
        created.push(p);
      }
    }

    return created;
  }

  private calcDamage(skill: SkillDef): number {
    let mult = skill.damageMult;
    if (this.classType === 'monk') {
      mult *= this.skills.stanceDamageMultBonus();
      if (this.skills.hasBuff('meditate_damage')) {
        mult *= 1.2;
      }
    }
    return Math.round(25 * mult);
  }

  getAttackCooldown(): number {
    const skill = this.skills.mainAbility;
    if (!skill) return this.fallbackAttackCooldown;
    const mult = this.skills.attackSpeedMult() * this._computedStats.attackSpeedMult;
    const cdr = (this._computedStats.cooldownReductionPct || 0) / 100;
    return Math.max(5, Math.round((skill.cooldown * (1 - cdr)) / mult));
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  private updateSprite() {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }
}
