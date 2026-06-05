# Monster Rarity & Game Balance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Normal/Magic/Rare enemy variants with modifiers, rebalance damage formula with stat scaling, and adjust enemy sizes/density.

**Architecture:** New `MonsterMods.ts` file defines modifier types and effects. `Enemy.ts` gains `rarity`, `mods[]`, and nameplate text. `ZoneManager.ts` rolls rarity during spawn. `Game.ts` draws mod VFX and volatile explosions. `Player.ts` gets stat-scaled damage formula.

**Tech Stack:** TypeScript + PixiJS 7

---

### Task 1: Create MonsterMods definitions file

**Files:**
- Create: `src/core/MonsterMods.ts`

- [ ] **Create MonsterMods.ts** with modifier type definitions and 4 core modifiers:

```ts
import { Enemy } from '../entities/Enemy';

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
      enemy.hastedMultiplier = 1.5; // used for attack speed
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
```

- [ ] **Commit**

```
git add src/core/MonsterMods.ts
git commit -m "feat: add MonsterMods definitions with 4 core modifiers"
```

---

### Task 2: Add rarity fields, nameplate, and size changes to Enemy.ts

**Files:**
- Modify: `src/entities/Enemy.ts`

- [ ] **Add new fields to Enemy class** after `aggroed`:

```ts
import { Text, TextStyle } from 'pixi.js';
import { MonsterRarity, MonsterMod, RARITY_COLORS } from '../core/MonsterMods';

// After aggroed = false:
rarity: MonsterRarity = 'normal';
mods: MonsterMod[] = [];
hastedMultiplier = 1;
frostAuraActive = false;
frostAuraRadius = 150;
volatileActive = false;
nameplate: Text | null = null;
```

- [ ] **Add `applyRarity()` method** to Enemy class:

```ts
applyRarity(rarity: MonsterRarity, mods: MonsterMod[]) {
  this.rarity = rarity;
  this.mods = mods;
  for (const mod of mods) {
    mod.apply(this);
  }
  if (rarity !== 'normal') {
    const scaleBonus = rarity === 'magic' ? 1.1 : 1.2;
    this.sprite.scale.set(
      (this.sprite.scale.x > 0 ? 1 : -1) * Math.abs(this.sprite.scale.x) * scaleBonus
    );
    this.createNameplate(rarity, mods);
  }
}

private createNameplate(rarity: MonsterRarity, mods: MonsterMod[]) {
  const modNames = mods.map(m => m.name).join(' ');
  this.nameplate = new Text(`[${rarity.toUpperCase()}] ${modNames}`, new TextStyle({
    fontFamily: 'monospace',
    fontSize: 11,
    fill: RARITY_COLORS[rarity],
    stroke: 0x000000,
    strokeThickness: 3,
    fontWeight: 'bold',
  }));
  this.nameplate.anchor.set(0.5, 0);
}
```

- [ ] **Also update `src/rendering/SpriteAnimator.ts`** — change sprite scales in creation functions:
  - `createGruntSprite()`: `sprite.scale.set(1.3)` → `sprite.scale.set(1.7)` (x2 locations: frames available path and fallback path)
  - `createCultistSprite()`: `sprite.scale.set(1.15)` → `sprite.scale.set(1.0)`
  - `createJuggernautSprite()`: `sprite.scale.set(1.7)` → `sprite.scale.set(2.2)`

- [ ] **Update constructor** — change `EnemyConfig` return values for hitbox sizes:

```ts
case 'grunt':
  return { hp: 40, speed: 2.2, size: 47, xp: 10, sprite: Sprites.enemy, damage: 8, detectRange: 400, deaggroRange: 600 };
case 'juggernaut':
  return { hp: 120, speed: 1.2, size: 72, xp: 25, sprite: Sprites.juggernaut, damage: 16, detectRange: 350, deaggroRange: 525 };
case 'cultist':
  return { hp: 35, speed: 2.0, size: 27, xp: 15, sprite: Sprites.cultist, damage: 5, detectRange: 450, deaggroRange: 675 };
```

- [ ] **Update `updateSprite()`** to also position nameplate above enemy:

```ts
private updateSprite() {
  this.sprite.x = this.x;
  this.sprite.y = this.y;
  if (this.nameplate) {
    this.nameplate.x = this.x;
    this.nameplate.y = this.y - this.height / 2 - 18;
  }
}
```

- [ ] **Update `takeDamage()`** — add volatile check before `this.alive = false`. If volatile, set up explosion (handled by Game.ts, just add flag for it to read).

```ts
// After health check, before setting alive = false:
// Volatile will be consumed by Game.ts after alive flag is set
```

- [ ] **Update `destroy()`** to also destroy nameplate:

```ts
destroy() {
  this.sprite.destroy();
  if (this.nameplate) this.nameplate.destroy();
  ...
}
```

- [ ] **Update `getBounds()`** — uses `this.width`/`this.height` directly, no changes needed since those are now dynamic.

- [ ] **Commit**

```
git add src/entities/Enemy.ts
git commit -m "feat: add rarity fields, nameplate, and size changes to Enemy"
```

---

### Task 3: Wire rarity rolling into ZoneManager + density +10%

**Files:**
- Modify: `src/core/ZoneManager.ts`

- [ ] **Import rollRarity, getRandomMods** in ZoneManager.ts:

```ts
import { rollRarity, getRandomMods, MonsterRarity } from './MonsterMods';
```

- [ ] **After enemy type is picked** in `spawnEnemies()`, add rarity roll + apply:

```ts
// After creating the enemy (after line `const e = new Enemy(x, y, type);`)
const rarity = rollRarity();
const modCount = rarity === 'rare' ? 3 : rarity === 'magic' ? 2 : 0;
const mods = modCount > 0 ? getRandomMods(modCount) : [];
if (mods.length > 0 || rarity !== 'normal') e.applyRarity(rarity, mods);
```

- [ ] **Increase density by +10%** in all zone enemyCount ranges:

In `spawnEnemies()`, modify `countEnemies` result:
```ts
const count = Math.round(this.countEnemies(zone, roomIndex) * 1.1);
```

- [ ] **Commit**

```
git add src/core/ZoneManager.ts
git commit -m "feat: wire rarity rolling and +10% density in ZoneManager"
```

---

### Task 4: Stat-scaled damage formula in Player.ts

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Update `calcDamage()`** to use stat-scaled formula:

```ts
private calcDamage(skill: SkillDef): number {
  let mult = skill.damageMult;

  // Class-based primary stat scaling
  let primaryStat = 0;
  if (this.classType === 'warrior') primaryStat = this.attributes.str;
  else if (this.classType === 'ranger') primaryStat = this.attributes.dex;
  else if (this.classType === 'monk') primaryStat = this.attributes.int;

  // Equipment percentage damage bonuses
  if (this.classType === 'warrior' || this.classType === 'monk') {
    mult *= this._computedStats.meleeDmgMult;
  } else if (this.classType === 'ranger') {
    mult *= this._computedStats.projectileDmgMult;
  }

  // Monk stance buff
  if (this.classType === 'monk') {
    mult *= this.skills.stanceDamageMultBonus();
    if (this.skills.hasBuff('meditate_damage')) mult *= 1.2;
  }

  const baseDmg = 20;
  const statBonus = 1 + primaryStat * 0.01;
  let damage = Math.round(baseDmg * mult * statBonus);

  // Add flat elemental damage from equipment
  const coldDmg = this._computedStats.coldDmg || 0;
  const lightningDmg = this._computedStats.lightningDmg || 0;
  damage += coldDmg + lightningDmg;

  return damage;
}
```

- [ ] **Update `fireProjectile()`** — replace `Math.round(25 * skill.damageMult)` with call to `calcDamage()`:

```ts
fireProjectile(x: number, y: number, angle: number, skill: SkillDef, projectiles: Projectile[]): Projectile[] {
  const speed = 10 * this.skills.projectileSpeedBonus();
  const damage = this.calcDamage(skill);
  ...
}
```

- [ ] **Commit**

```
git add src/entities/Player.ts
git commit -m "feat: stat-scaled damage formula in Player"
```

---

### Task 5: Update zone multipliers and density in ZoneRegistry

**Files:**
- Modify: `src/core/ZoneRegistry.ts`

- [ ] **Update zone HP multipliers:**

```ts
tutorial: { ... enemyHpMult: 1.0, ... }
forest:   { ... enemyHpMult: 1.5, ... }
desert:   { ... enemyHpMult: 2.5, ... }
ice:      { ... enemyHpMult: 4.0, ... }
```

Update enemyCount ranges (density increase):
```ts
forest:   enemyCount: { min: 9, max: 15 },
desert:   enemyCount: { min: 11, max: 20 },
ice:      enemyCount: { min: 13, max: 22 },
endless_dungeon: enemyCount: { min: 11, max: 15 },
endless_arena:  enemyCount: { min: 7, max: 11 },
```

- [ ] **Also update tutorial** enemyCount if density change applies:
```ts
tutorial: enemyCount: { min: 3, max: 4 },  // was 2-3
```

- [ ] **Commit**

```
git add src/core/ZoneRegistry.ts
git commit -m "feat: update zone HP multipliers and density"
```

---

### Task 6: Mod VFX, volatile explosion, loot multipliers, and nameplate rendering in Game.ts

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Add `modGfx` field** to Game class for per-frame mod graphics cleanup:

```ts
// After private vfx: VfxEffect[] = [];
private modGfx: Graphics[] = [];
```

- [ ] **Add modGfx cleanup** at the start of `updateGameplay()`:

```ts
// Clean up per-frame mod VFX
for (const g of this.modGfx) {
  this.gameContainer!.removeChild(g);
  g.destroy();
}
this.modGfx = [];
```

- [ ] **Import** `RARITY_COLORS, MonsterMod` from MonsterMods in Game.ts.

- [ ] **Add volatile explosion** in the enemy death cleanup loop (around line 1651-1676). After the existing explode-on-kill check:

```ts
// Volatile explosion
if (dead.volatileActive) {
  const volatileDmg = Math.round(dead.maxHealth * 0.5);
  for (const other of this.enemies) {
    if (!other.alive) continue;
    if (Math.hypot(other.x - dead.x, other.y - dead.y) < 120) {
      other.takeDamage(volatileDmg);
      if (other.alive) {
        this.combatText.showDamage(other.x, other.y - 20, volatileDmg, 0xff3333);
      }
    }
  }
  // Volatile explosion expanding ring VFX (VFX system auto-clears, no g.clear() needed)
  this.addVfx((g, t) => {
    const r = 120 * t;
    const alpha = Math.max(0, 1 - t);
    g.lineStyle(3, 0xff3333, alpha);
    g.drawCircle(0, 0, r);
    g.beginFill(0xff3333, alpha * 0.2);
    g.drawCircle(0, 0, r);
    g.endFill();
  }, 25).position.set(dead.x, dead.y);
}
```

- [ ] **Magic/rare nameplate rendering** — add nameplate to container on spawn, remove on death. In the enemy cleanup loop, after `this.gameContainer!.removeChild(dead.sprite)`:

```ts
if (dead.nameplate) {
  this.gameContainer!.removeChild(dead.nameplate);
}
```

In the enemy spawning area (after `this.gameContainer!.addChild(e.sprite)`):
```ts
if (e.nameplate) this.gameContainer!.addChild(e.nameplate);
```

- [ ] **Draw per-frame mod VFX** — add after enemy update + cleanup, before VFX update:

```ts
// Per-frame mod graphics
for (const enemy of this.enemies) {
  if (!enemy.alive) continue;

  // Frost aura ring
  if (enemy.frostAuraActive) {
    const ring = new Graphics();
    ring.lineStyle(2, 0x4488ff, 0.35);
    ring.drawCircle(0, 0, enemy.frostAuraRadius);
    ring.beginFill(0x4488ff, 0.06);
    ring.drawCircle(0, 0, enemy.frostAuraRadius);
    ring.endFill();
    ring.x = enemy.x;
    ring.y = enemy.y;
    this.gameContainer!.addChild(ring);
    this.modGfx.push(ring);

    // Light inner glow
    const glow = new Graphics();
    glow.beginFill(0x4488ff, 0.04);
    glow.drawCircle(0, 0, enemy.frostAuraRadius * 0.6);
    glow.endFill();
    glow.x = enemy.x;
    glow.y = enemy.y;
    this.gameContainer!.addChild(glow);
    this.modGfx.push(glow);
  }

  // Volatile pulsing glow
  if (enemy.volatileActive) {
    const pulse = 0.5 + 0.5 * Math.sin(this.portalAngle * 0.1);
    const glow = new Graphics();
    glow.beginFill(0xff3333, 0.12 * pulse);
    glow.drawCircle(0, 0, 22);
    glow.endFill();
    glow.x = enemy.x;
    glow.y = enemy.y;
    this.gameContainer!.addChild(glow);
    this.modGfx.push(glow);
  }

  // Hasted speed lines
  if (enemy.hastedMultiplier > 1 && Math.random() < 0.04) {
    const streak = new Graphics();
    const len = 8 + Math.random() * 14;
    streak.lineStyle(1.5, 0xffffff, 0.4);
    streak.moveTo(-len, -1);
    streak.lineTo(0, -1);
    streak.x = enemy.x;
    streak.y = enemy.y;
    this.gameContainer!.addChild(streak);
    this.modGfx.push(streak);
  }
}
```

- [ ] **Frost aura slow application** — add frost slow check in the player movement section. After enemy update and before player movement, compute frost aura slow:

```ts
// Frost aura slow
let frostSlow = 1;
for (const enemy of this.enemies) {
  if (!enemy.alive || !enemy.frostAuraActive) continue;
  const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
  if (dist < enemy.frostAuraRadius) {
    frostSlow = 0.75; // 25% slow, doesn't stack
    break;
  }
}
```

Pass `frostSlow` to player's movement update or apply it directly (player already has `slowTimer` for cultist slow — combine via `Math.min(existingSlow, frostSlow)`).

- [ ] **Loot multiplier for rarity** — modify `spawnLoot()` call site on enemy death (line 1674):

```ts
const lootMult = dead.rarity === 'rare' ? 3 : dead.rarity === 'magic' ? 2 : 1;
this.spawnLoot(dead.x, dead.y, lootMult);
```

Update `spawnLoot()` signature:
```ts
private spawnLoot(x: number, y: number, rarityMult: number = 1) {
```

Apply `rarityMult` to the item quantity multiplier:
```ts
const iq = (1 + ((this.player?.computedStats.itemQuantityPct || 0) / 100)) * rarityMult;
```

- [ ] **Commit**

```
git add src/core/Game.ts
git commit -m "feat: mod VFX, volatile explosion, loot multipliers, nameplates"
```

---

### Task 7: TypeScript verification and final cleanup

**Files:** (no changes — verification only)

- [ ] **Run TypeScript compiler** to verify no type errors:

```
npx tsc --noEmit
```

Expected: clean exit with no errors.

- [ ] **Verify edge cases:**
  - Tutorial enemies with 1.0x HP mult (normal grunt 40 HP)
  - Magic grunt with Goliath: 80 HP
  - Rare grunt with Goliath+Hasted+FrostAura: 80 HP, 1.5x speed, frost aura
  - Volatile chain explosion between two nearby magic enemies
  - Cultist reduced hitbox (27) and sprite scale (1.0x)
  - Juggernaut increased size (72) and sprite scale (2.2x)

- [ ] **Build final version:**

```
npm run build
```

Expected: clean build with no errors.

- [ ] **Commit final changes if any fixes were needed**

```
git add -A
git commit -m "fix: address review feedback"  # only if changes were needed
```
