# Monk Class Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Monk class — a stance-based martial artist with 5 fixed techniques, 3 stances, and a meditate channel ability.

**Architecture:** Follow existing warrior/ranger patterns in SpriteAnimator (individual PNG frames), SkillDefs/SkillManager (skill data + cooldowns), Player (sprite creation + ability routing), and UI (class/ability selection). Add stance system to SkillManager with Tiger/Tortoise/Crane modifiers. Meditate uses a channel timer in Player with damage-based interruption.

**Tech Stack:** TypeScript, PixiJS 7, Vite 5

---

### Task 1: Sprite Animator + Monk Folder

**Files:**
- Create: `public/sprites/monk/` (folder)
- Modify: `src/rendering/SpriteAnimator.ts`

- [ ] **Step 1: Create monk sprites folder**

```bash
New-Item -ItemType Directory -Path "public/sprites/monk" -Force
```

- [ ] **Step 2: Add monk animation types and storage**

Add to `src/rendering/SpriteAnimator.ts`:

```typescript
export type MonkAnimName = 'idle' | 'run' | 'basic_strike' | 'dragon_palm' | 'whirlwind_kick' | 'meditate';

let monkFrames: Record<MonkAnimName, Texture[]> | null = null;
let pendingMonkSprites: AnimatedSprite[] = [];
```

After `isReaperLoaded()`:
```typescript
export function isMonkLoaded(): boolean {
  return monkFrames !== null;
}
```

- [ ] **Step 3: Add monk load/create/play functions**

After the golem animation section, add:

```typescript
const MONK_FRAME_CONFIGS: [MonkAnimName, string, number][] = [
  ['idle', 'idle_{n}.png', 6],
  ['run', 'run_{n}.png', 8],
  ['basic_strike', '1_atk_{n}.png', 6],
  ['dragon_palm', '2_atk_{n}.png', 12],
  ['whirlwind_kick', 'air_atk_{n}.png', 7],
  ['meditate', 'meditate_{n}.png', 16],
];

export async function loadMonkAnimations(): Promise<void> {
  if (monkFrames) return;
  const result = {} as Record<MonkAnimName, Texture[]>;

  for (const [name, pattern, count] of MONK_FRAME_CONFIGS) {
    try {
      result[name] = await loadRangerFrames('sprites/monk', name as AnimName, pattern, count);
    } catch {
      console.warn(`[SpriteAnimator] fallback for monk ${name}`);
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#cc8844';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(name, 20, 52);
      result[name] = [Texture.from(canvas)];
    }
  }

  monkFrames = result;

  for (const sprite of pendingMonkSprites) {
    const f = monkFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingMonkSprites = [];
}

export function createMonkSprite(): AnimatedSprite {
  if (monkFrames && monkFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(monkFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0xcc8844;
  pendingMonkSprites.push(sprite);
  return sprite;
}

export function playMonkAnimation(sprite: AnimatedSprite, name: MonkAnimName, loop = true) {
  if (!monkFrames) return;
  const f = monkFrames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'basic_strike' || name === 'dragon_palm' ? 0.15 : 0.12;
  sprite.gotoAndPlay(0);
}
```

- [ ] **Step 4: Update `playAnimation()` and `getFrames()` type unions**

```typescript
function getFrames(classType: 'warrior' | 'ranger' | 'monk'): Record<AnimName, Texture[]> | null {
  if (classType === 'monk') return null; // monk uses playMonkAnimation, not playAnimation
  return classType === 'ranger' ? rangerFrames : warriorFrames;
}

export function isLoaded(classType: 'warrior' | 'ranger' | 'monk' = 'warrior'): boolean {
  return getFrames(classType) !== null;
}
```

Update `playAnimation` signature:
```typescript
export function playAnimation(sprite: AnimatedSprite, name: AnimName, loop: boolean = true, classType: 'warrior' | 'ranger' | 'monk' = 'warrior') {
  if (classType === 'monk') return; // monk uses its own playMonkAnimation
  ...
```

- [ ] **Step 5: Verify compile**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/rendering/SpriteAnimator.ts public/sprites/monk/
git commit -m "feat: add monk sprite animation loading (idle/run/basic/palm/kick/meditate)"
```

---

### Task 2: SkillDefs — Monk Skill Data

**Files:**
- Modify: `src/core/SkillDefs.ts`

- [ ] **Step 1: Add monk to ClassType and define monk skills**

Update `ClassType`:
```typescript
export type ClassType = 'warrior' | 'ranger' | 'monk';
```

Add monk skill data after RANGER_SUPPORT:

```typescript
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
    damageMult: 1.2, effectType: 'cone', angle: 120,
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
```

Add `MONK` and `MONK_DEFAULT_SUPPORT_IDS` to the default export/import section so they're accessible from SkillManager.

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/SkillDefs.ts
git commit -m "feat: define monk skills data (basic/palm/kick/uppercut/meditate/stance)"
```

---

### Task 3: SkillManager — Stance System

**Files:**
- Modify: `src/core/SkillManager.ts`

- [ ] **Step 1: Add StanceId type and import monk data**

Add at top with other imports:
```typescript
import { MONK_MAIN, MONK_SUPPORT, MONK_DEFAULT_SUPPORT_IDS } from './SkillDefs';

export type StanceId = 'tiger' | 'tortoise' | 'crane';
```

- [ ] **Step 2: Add stance fields and constructor branches**

Add to SkillManager class:
```typescript
currentStance: StanceId = 'tiger';
```

Replace the constructor body with:
```typescript
constructor(classType: ClassType) {
  this.classType = classType;

  if (classType === 'monk') {
    const mainSkills = MONK_MAIN;
    const supportSkills = MONK_SUPPORT;
    this.allSkills = [...mainSkills, ...supportSkills];
    const basic = mainSkills.find(s => s.id === 'basic_strike')!;
    const palm = mainSkills.find(s => s.id === 'dragon_palm')!;
    const kick = mainSkills.find(s => s.id === 'whirlwind_kick')!;
    const uppercut = mainSkills.find(s => s.id === 'tiger_uppercut')!;
    const meditate = mainSkills.find(s => s.id === 'meditate')!;
    const stance = supportSkills.find(s => s.id === 'stance_toggle')!;
    this.slots = [basic, palm, kick, uppercut, meditate, stance];
    return;
  }

  const mainSkills = classType === 'warrior' ? WARRIOR_MAIN : RANGER_MAIN;
  const supportSkills = classType === 'warrior' ? WARRIOR_SUPPORT : RANGER_SUPPORT;
  const defaultSupportIds = classType === 'warrior' ? DEFAULT_SUPPORT_IDS : RANGER_DEFAULT_SUPPORT_IDS;
  this.allSkills = [...mainSkills, ...supportSkills];
  const supports = defaultSupportIds.map(id => supportSkills.find(s => s.id === id)!).filter(Boolean);
  this.slots = [null, ...supports].slice(0, 6);
}
```

- [ ] **Step 3: Add stance methods**

Add to SkillManager class:
```typescript
cycleStance(): StanceId {
  const stances: StanceId[] = ['tiger', 'tortoise', 'crane'];
  const idx = (stances.indexOf(this.currentStance) + 1) % 3;
  this.currentStance = stances[idx];
  return this.currentStance;
}

stanceDamageMultBonus(): number {
  if (this.currentStance === 'tiger') return 1.4;
  if (this.currentStance === 'crane') return 0.85;
  return 1.0;
}

stanceDamageReductionBonus(): number {
  if (this.currentStance === 'tortoise') return 0.4;
  if (this.currentStance === 'tiger') return -0.1;
  return 0.0;
}

stanceLifestealBonus(): number {
  if (this.currentStance === 'crane') return 0.25;
  return 0.0;
}
```

- [ ] **Step 4: Verify compile**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/core/SkillManager.ts
git commit -m "feat: add monk stance system (tiger/tortoise/crane) to SkillManager"
```

---

### Task 4: Player — Monk Sprite + Combat Logic

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: Add monk sprite creation and animation imports**

Add imports:
```typescript
import { createMonkSprite, playMonkAnimation, MonkAnimName, isMonkLoaded } from '../rendering/SpriteAnimator';
```

In constructor, add monk branch after ranger:
```typescript
} else if (classType === 'monk' && isMonkLoaded()) {
  this.sprite = createMonkSprite();
```

- [ ] **Step 2: Add classType getter and monk animation support**

The existing `get classType()` delegates to `this.skills.classType` — no change needed.

In `triggerAttackAnimation()`, add monk support. After `playAnimation(this.sprite, 'attack', false, this.classType)` line, change to:
```typescript
if (this.classType === 'monk') {
  const animMap: Record<string, MonkAnimName> = {
    basic_strike: 'basic_strike',
    dragon_palm: 'dragon_palm',
    whirlwind_kick: 'whirlwind_kick',
    tiger_uppercut: 'dragon_palm', // reuses dragon palm frames
  };
  const animName = animMap[skillId] || 'basic_strike';
  playMonkAnimation(this.sprite as AnimatedSprite, animName, false);
} else {
  playAnimation(this.sprite, 'attack', false, this.classType);
}
```

Update the `onComplete` callback — after animation ends, for monk:
```typescript
if (this.classType === 'monk') {
  playMonkAnimation(this.sprite as AnimatedSprite, 'idle');
} else {
  playAnimation(this.sprite, 'idle', true, this.classType);
}
```

- [ ] **Step 3: Add stance modifiers to calcDamage**

Currently:
```typescript
private calcDamage(skill: SkillDef): number {
  return Math.round(25 * skill.damageMult);
}
```

Change to:
```typescript
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
```

- [ ] **Step 4: Add stance damage reduction in takeDamage**

In `takeDamage(amount: number): boolean`:
```typescript
if (this.classType === 'monk') {
  const reduction = this.skills.stanceDamageReductionBonus();
  if (reduction > 0) amount = Math.round(amount * (1 - reduction));
  if (reduction < 0) amount = Math.round(amount * (1 + Math.abs(reduction)));
}
```

Place this right before `this.health -= amount;`.

- [ ] **Step 5: Add stance lifesteal in useMainAbility**

In `useMainAbility()`, after the damage is dealt to an enemy, add:
```typescript
if (this.classType === 'monk') {
  const lifesteal = this.skills.stanceLifestealBonus();
  if (lifesteal > 0 && damageDealt > 0) {
    const heal = Math.round(damageDealt * lifesteal);
    this.health = Math.min(this.maxHealth, this.health + heal);
  }
}
```

Place this inside each damage-dealing branch (after enemy.takeDamage calls), or add it once in a helper.

- [ ] **Step 6: Add meditate channeling in update()**

Add fields to Player:
```typescript
private channeling = false;
private channelTimer = 0;
private meditateSkillId = 'meditate';
```

In `update()`, add after `this.skills.update(dt)`:
```typescript
if (this.channeling) {
  this.channelTimer -= dt;
  if (this.channelTimer <= 0) {
    this.channeling = false;
    const healAmt = Math.round(this.maxHealth * 0.25);
    this.health = Math.min(this.maxHealth, this.health + healAmt);
    this.skills.addBuff('meditate_damage');
  }
}
```

In `takeDamage()`, add at top:
```typescript
this.channeling = false; // damage interrupts meditate
```

Expose `isChanneling()` method:
```typescript
isChanneling(): boolean {
  return this.channeling;
}
```

Add `startChannel(skillId: string, duration: number)` method:
```typescript
startChannel(skillId: string, duration: number) {
  this.channeling = true;
  this.channelTimer = duration;
  this.meditateSkillId = skillId;
}
```

- [ ] **Step 7: Add knockback for tiger uppercut**

In `useMainAbility()`, in the `'single'` case, after dealing damage, add:
```typescript
if (skill.id === 'tiger_uppercut' && enemy.alive) {
  const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
  enemy.x += Math.cos(angle) * 80;
  enemy.y += Math.sin(angle) * 80;
  // Clamp to room bounds (handled by enemy's next update via resolveCollision)
}
```

- [ ] **Step 8: Add stunned check for dragon palm**

In `useMainAbility()`, in `'single'` case after dealing damage:
```typescript
if (skill.id === 'dragon_palm' && enemy.alive && Math.random() < 0.15) {
  this.combatText?.showDamage(enemy.x, enemy.y - 30, 0, 0x44aaff); // stun indicator
  // Store stun on the enemy (will need to add a stunned field)
}
```

Add `stunned = false` and `stunTimer = 0` to Enemy class. In enemy update, if stunned, skip AI.

For now, we can skip stun as a "nice to have" and focus on the core changes. Mark it as optional.

- [ ] **Step 9: Verify compile**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: implement monk player logic (sprites, stances, meditate, lifesteal, knockback)"
```

---

### Task 5: UI — ClassSelect + AbilitySelect + SkillBar

**Files:**
- Modify: `src/ui/ClassSelect.ts`
- Modify: `src/ui/AbilitySelect.ts`
- Modify: `src/ui/SkillBar.ts`

- [ ] **Step 1: Add monk to ClassSelect**

In `CLASSES` array, add:
```typescript
{
  classType: 'monk',
  label: 'Monk',
  description: 'Martial artist with stance-based combat and spirit techniques',
  icon: '\uD83E\uDDD9',
  color: 0x2e1a1a,
  borderColor: 0xc06020,
},
```

Adjust layout for 3 classes (3 buttons instead of 2). Change X positions:
```typescript
const startX = 960 - 400; // center - (3 buttons + gaps)/2
const spacing = 280;
for (let i = 0; i < CLASSES.length; i++) {
  const bx = startX + i * spacing;
  ...
}
```

- [ ] **Step 2: Add monk support to AbilitySelect**

In constructor, add monk branch:
```typescript
const mainSkills = classType === 'monk' ? MONK_MAIN : classType === 'warrior' ? WARRIOR_MAIN : RANGER_MAIN;
```

Also import MONK_MAIN at the top of the file.

For monk, since all skills are fixed, show an informational screen with all 5 skills listed and a "Begin Journey" button instead of requiring a pick. When clicked, call `onPick('basic_strike')`.

- [ ] **Step 3: Update HUD mana check for monk**

Monk uses manaCost 0 for basic attack — ensure HUD mana display doesn't break. This should work fine since 0 mana cost is valid.

- [ ] **Step 4: Verify compile**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/ui/ClassSelect.ts src/ui/AbilitySelect.ts
git commit -m "feat: add monk to class selection UI"
```

---

### Task 6: Game.ts Integration

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Import monk loading and handle stance toggle**

Add import:
```typescript
import { loadMonkAnimations } from '../rendering/SpriteAnimator';
```

Add to loading Promise.all:
```typescript
loadMonkAnimations(),
```

- [ ] **Step 2: Handle stance toggle in skill activation**

In the support skill handler (where `consume(slot, mana)` is called), add monk stance handling. When slot 6 is activated for monk, call:
```typescript
if (this.player.classType === 'monk' && result.id === 'stance_toggle') {
  const newStance = this.player.skills.cycleStance();
  // Play stance switch VFX
  const vfxColors: Record<string, number> = {
    tiger: 0xff8844,
    tortoise: 0x4488ff,
    crane: 0x44ff88,
  };
  this.addVfx((g, t) => {
    const r = 50 * t;
    const alpha = Math.max(0, 1 - t * 1.5);
    g.lineStyle(3, vfxColors[newStance], alpha);
    g.drawCircle(0, 0, r);
    g.lineStyle(1, vfxColors[newStance], alpha * 0.5);
    g.drawCircle(0, 0, r * 0.6);
  }, 20).position.set(this.player.x, this.player.y);
  return; // Don't process further
}
```

- [ ] **Step 3: Handle meditate channel**

In the support skill handler, when `result.id === 'meditate'`:
```typescript
if (result.id === 'meditate' && this.player.classType === 'monk') {
  this.player.startChannel('meditate', 60);
  // Play meditate animation
  playMonkAnimation(this.player.sprite as AnimatedSprite, 'meditate', false);
}
```

In `update()`, prevent movement while channeling:
```typescript
if (this.player.isChanneling()) {
  // Skip movement input processing
} else {
  // Normal movement
}
```

- [ ] **Step 4: Show stance name in HUD**

In HUD, add stance indicator text for monk. Simple approach: add a small text at the top-left showing current stance:
```typescript
if (this.player?.classType === 'monk') {
  const stance = this.player.skills.currentStance;
  stanceText.text = stance.toUpperCase();
  stanceText.style.fill = stanceColors[stance];
}
```

- [ ] **Step 5: Verify compile**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: integrate monk into game loop (loading, stance toggle, meditate, VFX)"
```

---

### Task 7: Final Verification

**Files:**
- No changes — run commands only

- [ ] **Step 1: Full type check**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 2: Verify menu flow**

Start the game. From the main menu, click "Start". The ClassSelect should show 3 classes (Warrior, Ranger, Monk). Select Monk. The AbilitySelect should show a brief "Monk — all techniques available" screen. Clicking it should start the game.

- [ ] **Step 3: Verify skill bar**

The skill bar should show 6 slots: Basic Strike, Dragon Palm, Whirlwind Kick, Tiger Uppercut, Meditate, Stance Toggle.

- [ ] **Step 4: Verify stance switching**

Press key 6. The stance should cycle Tiger → Tortoise → Crane with a colored VFX burst. Damage numbers should change based on stance.

- [ ] **Step 5: Verify meditate**

Press key 5. The monk should play the meditate animation for ~1 second (can't move). After channel, a heal of 25% max HP should occur and a +20% damage buff should apply.

- [ ] **Step 6: Push**

```bash
git push
```
