# Enemy Diversity — New Types & Pack Spawning

## Overview
Replace the single melee enemy with 4 distinct enemy types and a wave-based pack spawning system.

## Enemy Types

| Type | HP | Speed | Size | XP | AI |
|------|----|-------|------|----|----|
| Grunt | 40 | 2.2 | 28×28 | 10 | Chase player, melee attack on contact |
| Archer | 25 | 2.5 | 28×28 | 12 | Keep distance (150-350px), fire arrow projectile every 60 frames |
| Juggernaut | 120 | 1.2 | 42×42 | 25 | Slow chase, big hitbox, deals 2x grunt damage |
| Cultist | 35 | 2.0 | 28×28 | 15 | Keep distance (150-350px), fire slow orb every 80 frames. Teleport away when player within 120px |

## Pack Spawning
- Wave: 3-6 enemies
- Composition: always 1-2 grunts, 50% archer, 30% juggernaut, 40% cultist
- Spawn positions: cluster within ~100px radius, random offsets
- 2-second delay between waves
- Dead enemies removed, wave spawns after delay

## Dynamic Movement
- Speed variance: ±15% random modifier per enemy
- Movement wobble: slight sinusoidal offset perpendicular to movement direction
- Repulsion: enemies push apart when overlapping (simple force)

## Projectile System (Enemy)
- Reuse existing Projectile class with `hostile: true` flag
- Arrow: red tint, 0xcc3333
- Slow orb: purple tint, 0x9933cc
- Hostile projectiles damage player on hit

## Slow Mechanic
- `slowTimer: number` on Player
- When hit by cultist orb: `slowTimer = 120` (2 seconds)
- While slowed: `speed *= 0.5`
- Visual: player sprite tinted purple briefly

## Files Changed
- `Enemy.ts` — type configs, kiting AI, blink, repulsion, wobble
- `Projectile.ts` — hostile flag, onHit for player damage
- `Player.ts` — slowTimer, speed modifier from slow
- `Sprites.ts` — juggernaut texture (42×42 darker enemy)
- `Game.ts` — wave spawning, projectile management
