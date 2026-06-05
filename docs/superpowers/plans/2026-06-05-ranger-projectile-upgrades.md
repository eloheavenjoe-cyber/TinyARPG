# Ranger Projectile Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade ranger projectiles — faster speed, further range, bigger arrows, enhanced VFX, redesigned Rain of Arrows as a persistent AoE zone.

**Architecture:** All changes are in existing files. Projectile stats updated in Player.ts/SkillDefs.ts. Arrow visual + hitbox updated in Projectile.ts. Trail/impact VFX updated in Game.ts. Rain of Arrows uses a new `RainZone[]` array managed in the game loop. No new files needed.

**Tech Stack:** TypeScript, PixiJS 7

---

### Task 1: Update projectile ranges in SkillDefs

**Files:**
- Modify: `src/core/SkillDefs.ts`

- [ ] **Step 1: Update range values**

Find the ranger projectile skills and update their range fields:

| id | Current range | New range |
|----|-------------|-----------|
| `quick_shot` | 500 | 650 |
| `multi_shot` | 300 | 390 |
| `snipe` | 600 | 780 |
| `spread_shot` | 350 | 455 |
| `barrage` | 450 | 585 |
| `poison_arrow` | 400 | 520 |

The lines to change are around lines 131, 138, 145, 152, 184, 218, 225 in `src/core/SkillDefs.ts`. Search for each skill's `id` field and update the `range:` value above it.

- [ ] **Step 2: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/core/SkillDefs.ts
git commit -m "feat: increase ranger projectile ranges by 30%"
```

---

### Task 2: Increase base projectile speed in Player.ts

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: Update speed constant**

Find the `fireProjectile` method (around line 701). Change:

```typescript
const speed = 8 * this.skills.projectileSpeedBonus();
```

To:

```typescript
const speed = 10 * this.skills.projectileSpeedBonus();
```

- [ ] **Step 2: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: increase projectile base speed 8→10"
```

---

### Task 3: Update arrow visual size and hitbox in Projectile.ts

**Files:**
- Modify: `src/entities/Projectile.ts`

- [ ] **Step 1: Update friendly arrow sprite and hitbox**

Read the full `src/entities/Projectile.ts` file. Make these changes:

In the constructor, change the friendly arrow drawing (the `else` branch — non-hostile):

```typescript
    // Arrow body
    g.beginFill(0xffee44);
    g.drawRect(-3, -1, 7, 3);
    g.endFill();
    // Arrow tip
    g.beginFill(0xffcc00);
    g.drawRect(3, -1, 3, 2);
    g.endFill();
```

Change `getBounds()` for friendly projectiles (non-hostile):

```typescript
    return { x: this.x - 3, y: this.y - 1, width: 7, height: 3 };
```

The file has an `if (hostile)` condition in both the constructor rendering and `getBounds()`. The friendly (`else`) branches are the ones to change.

- [ ] **Step 2: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/entities/Projectile.ts
git commit -m "feat: increase arrow visual 7x3, hitbox 7x3"
```

---

### Task 4: Upgrade arrow trail VFX in Game.ts

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Update vfxProjectileTrail**

Find the `vfxProjectileTrail` method in `src/core/Game.ts` (around line 1808). Replace it with:

```typescript
  private vfxProjectileTrail(p: Projectile) {
    // Gold trail line
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.6 - t * 1.2);
      g.lineStyle(2, 0xffee44, alpha);
      g.moveTo(0, 0);
      g.lineTo(-p.vx * 0.6, -p.vy * 0.6);
    }, 20).position.set(p.x, p.y);
    // White glow line (thinner, parallel)
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.3 - t * 0.8);
      g.lineStyle(1, 0xffffff, alpha);
      g.moveTo(0, 0);
      g.lineTo(-p.vx * 0.5, -p.vy * 0.5);
    }, 20).position.set(p.x, p.y);
  }
```

- [ ] **Step 2: Add vfxArrowImpact method**

Add this new method near the other VFX methods (after `vfxProjectileTrail`):

```typescript
  private vfxArrowImpact(x: number, y: number) {
    // Gold starburst
    this.addVfx((g, t) => {
      const r = 15 + 25 * t;
      const alpha = Math.max(0, 1 - t * 1.5);
      g.lineStyle(2, 0xffcc00, alpha);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      // Center glow
      g.beginFill(0xffffaa, alpha * 0.4);
      g.drawCircle(0, 0, 6);
      g.endFill();
    }, 15).position.set(x, y);
  }
```

- [ ] **Step 3: Wire arrow impact in projectile hit code**

Find where friendly projectiles hit enemies (around line 1414–1427). After the `combatText.showDamage(...)` line for projectile hits, add:

```typescript
          if (!p.hostile) this.vfxArrowImpact(enemy.x, enemy.y);
```

Also find where projectiles hit breakables (around line 1438–1447) and add the same impact call after the breakable takes damage:

```typescript
          if (!p.hostile) this.vfxArrowImpact(brk.x, brk.y);
```

- [ ] **Step 4: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: upgrade arrow trail VFX + add arrow impact VFX"
```

---

### Task 5: Redesign Rain of Arrows as persistent AoE zone

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add RainZone interface and array**

Add near the other interface definitions (after `DashState` around line 53):

```typescript
interface RainZone {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damageTimer: number;
}
```

Add the array field near the other state fields (around line 83, near `private dash: DashState | null = null`):

```typescript
  private rainZones: RainZone[] = [];
```

- [ ] **Step 2: Replace the instant-damage aoe_target handler**

Find the `aoe_target` case in `useMainAbility()` (around line 1891–1910). It currently deals instant damage and shows a ring. Replace it with:

```typescript
      case 'aoe_target': {
        // Rain of Arrows — create persistent AoE zone
        const rainZone: RainZone = {
          x: mouseWX, y: mouseWY,
          radius: 120,
          life: 120,
          maxLife: 120,
          damageTimer: 0,
        };
        // Remove any existing rain zone (no stacking)
        this.rainZones = [];
        this.rainZones.push(rainZone);
        // Initial ground indicator
        this.vfxRing(rainZone.x, rainZone.y, 0x44ff44, rainZone.radius);
        break;
      }
```

- [ ] **Step 3: Add rain zone update in the game loop**

Find the VFX update section (around line 1319–1331). After the VFX cleanup loop, add:

```typescript
    // Rain of Arrows zone update
    for (let i = this.rainZones.length - 1; i >= 0; i--) {
      const rz = this.rainZones[i];
      rz.life -= dt;
      if (rz.life <= 0) {
        this.rainZones.splice(i, 1);
        continue;
      }
      const t = 1 - rz.life / rz.maxLife; // 0→1 over lifetime

      // Draw ground indicator (pulsing green ring)
      const pulseRadius = rz.radius * (0.95 + 0.05 * Math.sin(t * Math.PI * 4));
      this.addVfx((g, _t) => {
        g.lineStyle(2, 0x44ff44, 0.3 - 0.2 * t);
        g.drawCircle(0, 0, pulseRadius);
        g.lineStyle(1, 0x88ff88, 0.15 - 0.1 * t);
        g.drawCircle(0, 0, pulseRadius * 0.8);
      }, 2).position.set(rz.x, rz.y);

      // Falling arrow streaks (2-3 per frame)
      const arrowCount = 2 + Math.floor(Math.random() * 2);
      for (let a = 0; a < arrowCount; a++) {
        const endX = rz.x + (Math.random() - 0.5) * rz.radius * 2;
        const endY = rz.y + (Math.random() - 0.5) * rz.radius * 2;
        const startX = endX + (Math.random() - 0.5) * 40;
        const startY = rz.y - rz.radius - 60 - Math.random() * 40;
        this.addVfx((g, ft) => {
          const alpha = Math.max(0, 1 - ft * 2);
          g.lineStyle(1, 0x44ff44, alpha);
          g.moveTo(0, 0);
          g.lineTo(startX - endX, startY - endY);
        }, 8).position.set(endX, endY);
      }

      // Damage tick every 15 frames
      rz.damageTimer += dt;
      if (rz.damageTimer >= 15) {
        rz.damageTimer = 0;
        const dmg = Math.round(25 * 0.6); // 15 damage
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const edx = enemy.x - rz.x;
          const edy = enemy.y - rz.y;
          if (Math.hypot(edx, edy) < rz.radius) {
            enemy.takeDamage(dmg);
            enemy.slowTimer = 20; // 50% slow for 20 frames
            this.combatText.showDamage(enemy.x, enemy.y - 20, dmg, 0x44ff44);
            this.vfxArrowImpact(enemy.x, enemy.y);
          }
        }
      }
    }
```

- [ ] **Step 4: Clean up rain zones in cleanupGameSession**

In the `cleanupGameSession()` method (around line 613–640), add after `this.dash = null;`:

```typescript
    this.rainZones = [];
```

- [ ] **Step 5: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: redesign Rain of Arrows as persistent AoE zone with slow"
```

---

### Task 6: Full integration check + push

- [ ] **Step 1: Final typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Push all commits**

```bash
git push
```
