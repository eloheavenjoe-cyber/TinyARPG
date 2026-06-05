# Ranger Projectile Upgrades — Design Spec

## Overview
Upgrade ranger projectile feel: faster + further projectiles, bigger arrows, enhanced VFX, and a fully redesigned Rain of Arrows with a persistent AoE zone.

## Projectile Stat Changes

### Speed & Range
Base projectile speed: 8 → 10 (+25%)

| Skill | Current Range | New Range | New Lifetime (frames) |
|-------|-------------|-----------|----------------------|
| Quick Shot | 500 | 650 | 65 |
| Multi Shot | 300 | 390 | 39 |
| Snipe | 600 | 780 | 78 |
| Spread Shot | 350 | 455 | 45 |
| Barrage | 450 | 585 | 58 |
| Poison Arrow | 400 | 520 | 52 |

Lifetime = `range / speed`. Ranges increased by 30% so projectiles travel further despite higher speed.

### Arrow Sprite & Hitbox (Projectile.ts)
- Friendly arrow body: 6×2 → 7×3 yellow rect (`0xffee44`)
- Arrow tip: 2×2 → 3×2 orange rect (`0xffcc00`)
- GetBounds: 6×2 → 7×3 (matching visual)
- Hostile projectiles: size stays at 4 (enemy projectiles unchanged)

## Visual Upgrades

### Arrow Trail (vfxProjectileTrail)
- Line width: 1px → 2px
- Color: `0xffdd44` → `0xffee44` (brighter gold)
- Duration: 15 → 20 frames
- Secondary faint `0xffffff` line at 1px for glow effect
- Alpha fades from 0.6 → 0

### Arrow Impact (new vfxArrowImpact)
Called when any friendly projectile hits an enemy or breakable:
- 6-ray gold starburst: `0xffcc00`, radius expands 15→25
- Center circle: `0xffffaa`, radius 6, alpha 0.4 fading out
- Duration: 15 frames
- Replaces the generic vfxImpact for projectile hits

### Snipe Pierce Trail
When a Snipe projectile pierces an enemy, spawn a brief lingering gold streak along the projectile's path:
- Thin gold line at projectile position, 10 frame duration
- Visible for a frame or two as the projectile passes through

## Rain of Arrows Redesign

### Zone Creation
- On cast (effectType `aoe_target`): creates a `RainZone` at the mouse cursor world position
- Radius: 120px
- Duration: 120 frames (2 seconds)
- Stored in a new `RainZone[]` array on Game.ts

### Zone Data
```typescript
interface RainZone {
  x: number; y: number;
  radius: number;
  life: number;
  maxLife: number;
  damageTimer: number;
}
```

### Per-Frame Behavior (updated in game loop)
- **Arrow visuals**: Each frame, generate 2-3 arrow streak VFX. Each streak starts at a random X within [x - radius, x + radius] at Y = y - radius - 60 (above the zone) and ends at a random point within the zone circle. The streak is a thin green line (`0x44ff44`) drawn from start to end, fading over 8 frames.
- **Damage tick**: Every 15 frames, deal `25 * 0.6 = 15` damage to all enemies within the zone radius. Uses existing `rectsOverlap` or distance check from zone center.
- **Slow**: Enemies within the zone have `slowTimer` set to 20 frames (50% slow, same as cultist slow). Applied on each damage tick.
- **Ground indicator**: Semi-transparent green ring with radius 120 drawn on the ground, pulsing slightly.

### Zone Cleanup
- After 120 frames, the zone is removed from the array
- Multiple Rain of Arrows cannot stack (if cast again, the old zone is replaced)

## Implementation Plan

### Files Changed

| File | Changes |
|------|---------|
| `src/entities/Projectile.ts` | Arrow body 7×3, tip 3×2, update getBounds |
| `src/entities/Player.ts` | Update speed to 10 in fireProjectile (or in caller) |
| `src/core/Game.ts` | Update trail VFX, add arrow impact VFX, add RainZone system, update rain of arrows handler |
| `src/core/SkillDefs.ts` | Update ranges for all projectile skills |

### Out of Scope
- Non-projectile ranger skills (Eagle Eye, Haste, Trap, Camouflage, etc.)
- Enemy projectiles
- Warrior/monk skills
- Class balance beyond ranger projectiles
