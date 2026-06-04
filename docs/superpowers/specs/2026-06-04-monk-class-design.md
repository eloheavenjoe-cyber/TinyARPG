# Monk Class — Design Spec

## Overview
Third playable class: a martial artist with stance-based combat. Unlike warrior/ranger (main ability + support skills), the monk uses 6 slots for techniques plus a stance toggle. Unique mechanics: 3 stances (Tiger/Tortoise/Crane), Meditate channel ability, knockout effects.

## Stances

Toggle via slot 6. Free activation, 15-frame cooldown. A colored VFX burst plays on switch.

| Stance | Animal | Stat Effect | Tradeoff | VFX Color |
|--------|--------|-------------|----------|-----------|
| Damage | Tiger | +40% damage dealt | -10% damage reduction | Orange (0xff8844) |
| Defense | Tortoise | -40% damage taken | -20% damage dealt | Blue (0x4488ff) |
| Lifesteal | Crane | 25% lifesteal on hit | -15% damage dealt | Green (0x44ff88) |

Stance effects stack multiplicatively with other multipliers (e.g., Tiger + execute = 3.0 × 1.4 = 4.2x).

## Skill Bar

6 slots, keys 1-6:

| Slot | Ability | Animation | Effect Type | Damage Mult | Cooldown | Mana | Notes |
|------|---------|-----------|-------------|-------------|----------|------|-------|
| 1 | Basic Strike | 1_atk_1-6 | `single` | 0.8 | 8 | 0 | Generates resources, animation changes per stance |
| 2 | Dragon Palm | 2_atk_1-12 | `single` | 1.8 | 25 | 15 | 15% stun for 60 frames |
| 3 | Whirlwind Kick | air_atk_1-7 | `cone` | 1.2 | 30 | 15 | 120° arc, hits all enemies |
| 4 | Tiger Uppercut | 2_atk_1-12 | `single` | 2.5 | 40 | 20 | Knocks enemy back, high single-target |
| 5 | Meditate | meditate_1-16 | `buff` | — | — | 0 | Channel 60f → heal 25% HP → +20% dmg 120f |
| 6 | Stance Toggle | VFX burst | — | — | 15 | 0 | Cycles Tiger → Tortoise → Crane |

### Meditate details
- While channeling (60 frames), player cannot move or attack
- On channel complete: heal 25% max HP, gain `meditate_damage` buff for 120 frames (+20% damage dealt)
- Channel interrupted by taking damage (lose the channel, no heal or buff)
- During channel, boss telegraphs are visible — risky but rewarding

### Basic Attack slot
Slot 1 is the basic attack bound to key 1. It uses different stance-appropriate animations (Tiger punches with closed fists, Tortoise uses open-palm strikes, Crane uses staff spins). Mechanically identical — `single` target with 0.8 damage mult, 0 mana cost, 8-frame cooldown.

## Sprite Animations

Individual PNG frame files in `public/sprites/monk/`:

| Animation | Pattern | Count | Type |
|-----------|---------|-------|------|
| idle | idle_{n}.png | 6 | Individual PNGs |
| run | run_{n}.png | 8 | Individual PNGs |
| basic attack | 1_atk_{n}.png | 6 | Individual PNGs |
| dragon palm | 2_atk_{n}.png | 12 | Individual PNGs |
| whirlwind kick | air_atk_{n}.png | 7 | Individual PNGs |
| tiger uppercut | reuses 2_atk_{n}.png | 12 | Shares dragon palm frames |
| meditate | meditate_{n}.png | 16 | Individual PNGs |

Uppercut reuses the dragon palm animation frames — they are mechanically different (higher damage, knockback) but share the visual.

## Files Changed

### New
- `public/sprites/monk/` — sprite PNG directory

### Modified

| File | Changes |
|------|---------|
| `src/core/SkillDefs.ts` | Add `'monk'` to `ClassType`; create `MONK_MAIN` (5 skills: basic, palm, kick, uppercut, meditate), `MONK_SUPPORT` (stance-only; meditate is in main), `MONK_DEFAULT_SUPPORT_IDS` |
| `src/core/SkillManager.ts` | Add `'monk'` branches in constructor; add `stanceId` field; add `damageMultBonus()`, `damageReductionBonus()`, `lifestealBonus()` buff query methods; add `getStance()` / `cycleStance()` methods |
| `src/entities/Player.ts` | Add `'monk'` branch in constructor sprite creation; handle meditate channeling in `update()`; add `channelTimer` tracking; interrupt on damage; add stance modifiers to `calcDamage()`; handle knockback in `useMainAbility()` `'single'` case |
| `src/core/Game.ts` | Import `loadMonkAnimations` and call it; add `'monk'` branches in support skill routing (or remove need since monk's slot 0 is basic attack, not a chosen "main" ability) |
| `src/ui/ClassSelect.ts` | Add monk `ClassOption` entry |
| `src/ui/AbilitySelect.ts` | Add `'monk'` branch to show skills |
| `src/rendering/SpriteAnimator.ts` | Add `MonkAnimName`, `monkFrames`, `pendingMonkSprites`, `loadMonkAnimations()`, `createMonkSprite()`, `playMonkAnimation()`; update `playAnimation()` type union |

## SkillDef Data

```typescript
export type MonkAnimName = 'idle' | 'run' | 'basic_strike' | 'dragon_palm' | 'whirlwind_kick' | 'meditate';
```

`MONK_MAIN` contains all 6 monk abilities (they are all treated as "main" — no separate support category for techniques). The 6 slots are populated differently from warrior/ranger: slot 0 is Basic Strike, slots 1-3 are the techniques, slot 4 is Meditate, slot 5 is Stance Toggle.

`MONK_SUPPORT` can remain empty or contain stance definitions. The stance toggle is built into `SkillManager` as a special action, not a consumable skill.

## Stance Commutation in SkillManager

```typescript
export type StanceId = 'tiger' | 'tortoise' | 'crane';

class SkillManager {
  currentStance: StanceId = 'tiger';

  cycleStance(): StanceId {
    const stances: StanceId[] = ['tiger', 'tortoise', 'crane'];
    const idx = (stances.indexOf(this.currentStance) + 1) % 3;
    this.currentStance = stances[idx];
    return this.currentStance;
  }

  damageMultBonus(): number {
    if (this.currentStance === 'tiger') return 1.4;
    if (this.currentStance === 'crane') return 0.85;
    return 1.0; // tortoise
  }

  damageReductionBonus(): number {
    if (this.currentStance === 'tortoise') return 0.4;
    if (this.currentStance === 'tiger') return -0.1;
    return 0.0;
  }

  lifestealBonus(): number {
    if (this.currentStance === 'crane') return 0.25;
    return 0.0;
  }

  hasMeditateBuff(): boolean {
    return this.hasBuff('meditate_damage');
  }
}
```

These bonuses are applied in `Player.calcDamage()` and `Player.takeDamage()` respectively.

## Meditate State Machine

```
Player.update():
  if (meditate channeling):
    channelTimer -= dt
    if (channelTimer <= 0):
      heal 25% max HP
      addBuff('meditate_damage', 120 frames)
      channeling = false
    if (damage taken during channel):
      channeling = false
      (no heal, no buff)
```

Meditate is activated by pressing key 5 (slot 5). `consume()` is called — same as any skill. The channel duration is stored as `channelTimer` in the Player. If the player takes any damage before `channelTimer` expires, the channel is cancelled.

## Knockback on Tiger Uppercut

When Tiger Uppercut hits an enemy:
```
enemy.x += Math.cos(angleToEnemy) * knockbackDistance
enemy.y += Math.sin(angleToEnemy) * knockbackDistance
```
Knockback distance: 80px. The enemy's position is clamped within walkable area bounds. The `enemy.sprite.x/y` is updated accordingly on the next enemy update frame.
