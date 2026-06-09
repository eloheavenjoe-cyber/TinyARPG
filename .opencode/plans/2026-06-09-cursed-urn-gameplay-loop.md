# Cursed Urn Gameplay Loop Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Cursed Urn interaction loop so that opening an urn spawns a pack of enemies, curses apply immediately, loot only drops after all urn enemies are killed, and the urn fades away.

**Architecture:** Add `spawnSource`/`urnId`/`dropsLoot` fields to Enemy. Add an `UrnSpawnGroup` tracker in Game.ts with a spawn queue for staggered enemy spawning. Gate the existing enemy death/loot loop on `spawnSource`. Expand the urn state machine from `idle|opened` to `idle|active|cleared` with a fade-out animation.

**Tech Stack:** TypeScript + PixiJS 7

---

### Task 1: Add spawn source tracking fields to Enemy

**Files:**
- Modify: `src/entities/Enemy.ts:52-74`

- [ ] **Step 1: Add new fields after `alwaysAggro` on line 52**

```ts
  alwaysAggro = false;
  spawnSource: string | null = null;
  urnId: number = 0;
  dropsLoot: boolean = true;
  xpMultiplier: number = 1.0;
  spawnAnimTimer: number = 0;
```

- [ ] **Step 2: Add spawn-in animation at the top of `update()` method, after `if (!this.alive) return;` on line 105**

```ts
  update(playerX: number, playerY: number, walls: Rect[], dt: number, enemies: Enemy[]) {
    if (!this.alive) return;

    if (this.spawnAnimTimer > 0) {
      this.spawnAnimTimer -= dt;
      const t = 1 - this.spawnAnimTimer / 0.2;
      const scale = Math.min(1, t * 5);
      this.sprite.scale.set(scale);
      if (this.spawnAnimTimer <= 0) {
        this.sprite.scale.set(1);
      }
      return;
    }

    const dx = playerX - this.x;
```

The spawn-in animation runs for 200ms (0.2s), scaling from 0→1 over that time. During the animation the enemy does not move or take AI actions (early `return`).

- [ ] **Step 3: Run `npx tsc --noEmit`** — should pass

- [ ] **Step 4: Commit**

```bash
git add src/entities/Enemy.ts
git commit -m "feat: add spawnSource, urnId, dropsLoot, xpMultiplier, and spawn-in animation to Enemy"
```

---

### Task 2: Extend CursedUrn state machine and add fade-out

**Files:**
- Modify: `src/entities/CursedUrn.ts:22,31,33,327-416,424-434`

- [ ] **Step 1: Expand `UrnState` type (line 22)**

```ts
export type UrnState = 'idle' | 'active' | 'cleared';
```

- [ ] **Step 2: Add static ID counter and `id` field to CursedUrn class (after line 27)**

```ts
  private static nextId = 1;
  readonly id: number;
```

Assign in constructor (after `this.x = x; this.y = y;`):
```ts
    this.id = CursedUrn.nextId++;
```

- [ ] **Step 3: Add fade tracking fields (after `tier3Texts` field on line 46)**

```ts
  private fadeTimer: number = 0;
  private readonly FADE_DURATION: number = 1.2;
```

- [ ] **Step 4: Modify `open()` method (line 397-416) to set state to `'active'` instead of `'opened'`**

Replace the entire `open()` method:

```ts
  open(): CurseDef[] {
    if (this.state !== 'idle') return [];
    this.state = 'active';
    this.lid.visible = false;
    this.panel.visible = false;
    this.interactLabel.visible = false;
    this.glow.clear();
    for (const p of this.smokeParticles) { p.g.destroy(); }
    this.smokeParticles = [];
    Logger.log('combat', `Urn opened: ${this.type.name} (${this.rarity}), ${this.curses.length} curses`);
    return this.curses;
  }
```

Note: `isOpen` is no longer set here — it remains `false` during the `active` phase. The interaction loop in Game.ts will gate on `state !== 'idle'` instead of `isOpen`.

- [ ] **Step 5: Add fade logic to `update()` method**

Add at the end of the `update()` method, before the smoke particle block:

```ts
    if (this.state === 'cleared') {
      this.fadeTimer += dt / 60;
      this.container.alpha = Math.max(0, 1 - this.fadeTimer / this.FADE_DURATION);
      if (this.fadeTimer >= this.FADE_DURATION) {
        this.isOpen = true;
        this.container.alpha = 0;
      }
    }

    if (this.state !== 'idle') return;

    this.smokeTimer += dt / 60;
```

(The `if (this.state !== 'idle') return;` stops smoke particles during active and cleared states.)

- [ ] **Step 6: Update `serialize()` (line 424-434) to save state properly**

```ts
  serialize(): SerializedUrn {
    return {
      id: this.type.id,
      x: this.x, y: this.y,
      rarity: this.rarity,
      curseIds: this.curses.map(c => c.id),
      opened: this.state === 'cleared' || this.isOpen,
      rareName: this.rareName,
    };
  }
```

- [ ] **Step 7: Run `npx tsc --noEmit`** — should pass

- [ ] **Step 8: Commit**

```bash
git add src/entities/CursedUrn.ts
git commit -m "feat: extend urn state machine to idle|active|cleared with fade-out animation"
```

---

### Task 3: Implement urn enemy spawning with stagger in Game.ts

**Files:**
- Modify: `src/core/Game.ts` — add new interface, fields, methods; modify urn interaction block

- [ ] **Step 1: Add UrnSpawnGroup interface and fields (after line 127)**

```ts
  private activeUrnOrb: string | null = null;
  private urnSpawnGroups: Map<number, UrnSpawnGroup> = new Map();
  private urnSpawnQueue: { enemy: Enemy; urnId: number }[] = [];
  private urnStaggerTimer: number = 0;
```

Add the interface near the top of the file:
```ts
interface UrnSpawnGroup {
  urnId: number;
  totalSpawned: number;
  totalKilled: number;
  lootDropped: boolean;
  urnX: number;
  urnY: number;
}
```

- [ ] **Step 2: Check MonsterMods export name**

Read `src/core/MonsterMods.ts` to find the correct export function name for getting random mods (likely `getRandomMods`). Add import:
```ts
import { getRandomMods } from './MonsterMods';
```
If the function has a different name, use the correct one.

- [ ] **Step 3: Implement `spawnUrnEnemies()` method**

Add new method after `spawnUrnLoot()` (around line 3453):

```ts
  private spawnUrnEnemies(urn: CursedUrn) {
    const zone = this.zoneManager.state?.config;
    if (!zone) return;

    const pool = zone.enemyPool;
    if (pool.length === 0) return;

    const rarity = urn.rarity;
    let minCount: number, maxCount: number;
    if (rarity === 'rare') { minCount = 9; maxCount = 10; }
    else if (rarity === 'magic') { minCount = 7; maxCount = 8; }
    else { minCount = 6; maxCount = 7; }

    const totalCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    const hpMult = this.zoneManager.getHpMult(zone);
    const dmgMult = this.zoneManager.getDmgMult(zone);

    const group: UrnSpawnGroup = {
      urnId: urn.id,
      totalSpawned: totalCount,
      totalKilled: 0,
      lootDropped: false,
      urnX: urn.x,
      urnY: urn.y,
    };
    this.urnSpawnGroups.set(urn.id, group);

    const innerRadius = 80;
    const outerRadius = 200;
    const angleStep = (Math.PI * 2) / totalCount;

    for (let i = 0; i < totalCount; i++) {
      let type: EnemyType;
      if (rarity === 'normal') {
        type = pool[Math.floor(Math.random() * pool.length)];
      } else if (rarity === 'magic' && i >= totalCount - 2) {
        type = pool[Math.floor(Math.random() * pool.length)];
      } else if (rarity === 'rare' && i === 0) {
        type = pool[Math.floor(Math.random() * pool.length)];
      } else {
        type = pool[Math.floor(Math.random() * pool.length)];
      }

      const baseAngle = angleStep * i + (Math.random() - 0.5) * 0.3;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      let ex = urn.x + Math.cos(baseAngle) * radius;
      let ey = urn.y + Math.sin(baseAngle) * radius;

      const enemyRect = { x: ex - 20, y: ey - 20, width: 40, height: 40 };

      if (this.room?.walls) {
        let wallBlocked = false;
        for (const wall of this.room.walls) {
          if (rectsOverlap(enemyRect, wall)) { wallBlocked = true; break; }
        }
        if (wallBlocked) {
          let found = false;
          for (let r = radius + 20; r <= outerRadius + 80; r += 20) {
            ex = urn.x + Math.cos(baseAngle) * r;
            ey = urn.y + Math.sin(baseAngle) * r;
            enemyRect.x = ex - 20;
            enemyRect.y = ey - 20;
            let clear = true;
            for (const wall of this.room.walls) {
              if (rectsOverlap(enemyRect, wall)) { clear = false; break; }
            }
            if (clear) { found = true; break; }
          }
          if (!found) continue;
        }
      }

      if (this.player) {
        const playerDist = Math.hypot(this.player.x - ex, this.player.y - ey);
        if (playerDist < 60) {
          let found = false;
          for (let r = Math.max(innerRadius, playerDist + 80); r <= outerRadius + 80; r += 20) {
            const nx = urn.x + Math.cos(baseAngle) * r;
            const ny = urn.y + Math.sin(baseAngle) * r;
            const nd = Math.hypot(this.player.x - nx, this.player.y - ny);
            if (nd >= 60) { ex = nx; ey = ny; found = true; break; }
          }
          if (!found) continue;
        }
      }

      ex = Math.max(64, Math.min(ROOM_WIDTH - 64, ex));
      ey = Math.max(64, Math.min(ROOM_HEIGHT - 64, ey));

      const enemy = new Enemy(ex, ey, type);
      enemy.maxHealth = Math.round(enemy.maxHealth * hpMult);
      enemy.health = enemy.maxHealth;
      enemy.damage = Math.round(enemy.damage * dmgMult);
      enemy.spawnSource = 'cursed_urn';
      enemy.urnId = urn.id;
      enemy.dropsLoot = false;
      enemy.xpMultiplier = 0.5;
      enemy.alwaysAggro = true;
      enemy.spawnAnimTimer = 0.2;
      enemy.sprite.scale.set(0);

      if (rarity === 'magic' && i >= totalCount - 2) {
        enemy.applyRarity('magic', getRandomMods(2));
      } else if (rarity === 'rare' && i === 0) {
        enemy.applyRarity('rare', getRandomMods(3));
      }

      this.urnSpawnQueue.push({ enemy, urnId: urn.id });
    }
  }
```

- [ ] **Step 4: Process spawn queue in `updateGameplay()`**

Add near the top of `updateGameplay()`, after the `this.frameCount++` line:

```ts
    if (this.urnSpawnQueue.length > 0) {
      this.urnStaggerTimer -= dt;
      if (this.urnStaggerTimer <= 0) {
        const next = this.urnSpawnQueue.shift()!;
        this.enemies.push(next.enemy);
        this.gameContainer!.addChild(next.enemy.sprite);
        if (next.enemy.nameplate) {
          this.gameContainer!.addChild(next.enemy.nameplate);
        }
        this.urnStaggerTimer = this.urnSpawnQueue.length > 0
          ? 0.8 / this.urnSpawnQueue.length * 60
          : 0;
      }
    }
```

- [ ] **Step 5: Modify the urn interaction block (line 2113-2143)**

Replace the loop guard and interaction logic. The key insight: `urn.update()` must still be called for `active` and `cleared` urns (fade animation needs update()), but interaction is only for `idle` urns:

```ts
    for (const urn of this.urns) {
      if (urn.isOpen) continue;
      urn.update(dt, this.player.x, this.player.y, this.frameCount);
      if (urn.state !== 'idle') continue;

      const urnDist = Math.hypot(this.player.x - urn.x, this.player.y - urn.y);
      if (urnDist < 48 && interactKey) {
        if (this.activeUrnOrb) {
          this.applyUrnCurrency(urn, this.activeUrnOrb);
        } else {
          const curses = urn.open();
          if (curses.length > 0) {
            this.player?.applyCurses(curses);
            if (curses.some(c => c.statEffect === 'marked')) {
              for (const e of this.enemies) { e.alwaysAggro = true; }
            }
            this.vfxUrnOpen(urn.x, urn.y, urn.type.bgColor);
          }
          this.spawnUrnEnemies(urn);
          this.saveGame();
        }
        this.wasEKeyDown = true;
        break;
      }
    }
```

This ensures:
- `isOpen` (fully done): completely skipped
- `active`: gets `update()` but no interaction check
- `cleared`: gets `update()` (fade animation) but no interaction check
- `idle`: gets `update()` + full interaction logic

```ts
        } else {
          const curses = urn.open();
          if (curses.length > 0) {
            this.player?.applyCurses(curses);
            if (curses.some(c => c.statEffect === 'marked')) {
              for (const e of this.enemies) { e.alwaysAggro = true; }
            }
            this.vfxUrnOpen(urn.x, urn.y, urn.type.bgColor);
          }
          this.spawnUrnEnemies(urn);
          this.saveGame();
        }
```

- [ ] **Step 6: Run `npx tsc --noEmit`** — fix any import issues (verify MonsterMods export name)

- [ ] **Step 7: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: implement urn enemy spawning with ring stagger and spawn queue"
```

---

### Task 4: Implement kill tracking and loot gating in Game.ts

**Files:**
- Modify: `src/core/Game.ts` — modify enemy death loop; add triggerUrnClear

- [ ] **Step 1: Gate loot and XP in the enemy death loop**

Find the enemy death block starting around line 2575. Replace from the `removeChild(dead.sprite)` line through the `spawnLoot` line with:

```ts
        this.gameContainer!.removeChild(dead.sprite);
        if (dead.nameplate) {
          this.gameContainer!.removeChild(dead.nameplate);
        }

        const isUrnEnemy = dead.spawnSource === 'cursed_urn';

        if (!isUrnEnemy) {
          const healAmt = this.player.skills.healOnKill();
          if (healAmt > 0) this.player.heal(healAmt);
        }

        if (!isUrnEnemy) {
          if (this.player.addXp(dead.xpReward)) {
            this.combatText.showDamage(dead.x, dead.y - 30, this.player.level - 1, 0x44ff88);
            Logger.log('combat', `Player reached level ${this.player.level}`);
          }
          const rarityLootMult = dead.rarity === 'rare' ? 3 : dead.rarity === 'magic' ? 2 : 1;
          this.spawnLoot(dead.x, dead.y, rarityLootMult);
        } else {
          if (this.player.addXp(Math.round(dead.xpReward * dead.xpMultiplier))) {
            this.combatText.showDamage(dead.x, dead.y - 30, this.player.level - 1, 0x44ff88);
            Logger.log('combat', `Player reached level ${this.player.level}`);
          }
          const group = this.urnSpawnGroups.get(dead.urnId);
          if (group && !group.lootDropped) {
            group.totalKilled++;
            if (group.totalKilled >= group.totalSpawned) {
              this.triggerUrnClear(dead.urnId, group);
            }
          }
        }
```

- [ ] **Step 2: Gate the soul drop block (line 2589-2609)**

Wrap existing soul drop code:
```ts
        if (!isUrnEnemy && this.player?.classType === 'summoner') {
          // ... existing soul drop logic unchanged
        }
```

- [ ] **Step 3: Implement `triggerUrnClear()` method**

Add new method after `spawnUrnEnemies()`:

```ts
  private triggerUrnClear(urnId: number, group: UrnSpawnGroup) {
    group.lootDropped = true;

    const urn = this.urns.find(u => u.id === urnId);
    if (!urn) return;

    urn.state = 'cleared';

    this.spawnUrnLoot(urn.x, urn.y, urn);

    // Golden flash VFX
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.6 - t * 1.5);
      g.beginFill(0xffd700, alpha);
      g.drawCircle(0, 0, 40 + 20 * t);
      g.endFill();
    }, 10).position.set(urn.x, urn.y);

    // Depleted smoke puff VFX
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.5 - t);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + t * 2;
        const r = 10 + 30 * t;
        g.beginFill(0x333333, alpha);
        g.drawCircle(Math.cos(a) * r, Math.sin(a) * r - 20 * t, 6 - 4 * t);
        g.endFill();
      }
    }, 15).position.set(urn.x, urn.y);

    this.saveGame();
  }
```

- [ ] **Step 4: Run `npx tsc --noEmit`** — should pass

- [ ] **Step 5: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: gate loot on urn-spawned enemies, add kill tracking and triggerUrnClear"
```

---

### Task 5: Cleanup and final wiring

**Files:**
- Modify: `src/core/Game.ts` — cleanup blocks, save/load, fade removal

- [ ] **Step 1: Update urn cleanup on zone transition**

Find the urn cleanup block (around line 1026-1036) and add spawn group cleanup after it:

```ts
    this.urns = [];
    this.urnSpawnGroups.clear();
    this.urnSpawnQueue = [];
    this.urnStaggerTimer = 0;
```

Do this in ALL locations where `this.urns = []` appears (there may be multiple — in `buildCurrentZoneRoom()` area and in `cleanupGameSession()`).

- [ ] **Step 2: Update save logic filter (around line 553)**

Change from:
```ts
urns: this.urns.filter(u => u.isOpen).map(u => u.serialize()),
```
To:
```ts
urns: this.urns.filter(u => u.state === 'cleared' || u.isOpen).map(u => u.serialize()),
```

- [ ] **Step 3: Remove fully-faded urns each frame**

Add after the urn interaction block (after line 2143):

```ts
    for (let i = this.urns.length - 1; i >= 0; i--) {
      const urn = this.urns[i];
      if (urn.isOpen && urn.container.alpha <= 0) {
        this.gameContainer!.removeChild(urn.container);
        urn.destroy();
        this.urnSpawnGroups.delete(urn.id);
        this.urns.splice(i, 1);
      }
    }
```

- [ ] **Step 4: Update `restartGame()` and `cleanupGameSession()`**

In both methods, add after `this.urns = []`:
```ts
    this.urnSpawnGroups = new Map();
    this.urnSpawnQueue = [];
    this.urnStaggerTimer = 0;
```

- [ ] **Step 5: Run `npx tsc --noEmit`** — should pass

- [ ] **Step 6: Run `npm run build`** — full build check

- [ ] **Step 7: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: cleanup urn spawn groups on zone transition and session restart"
```

---

### Task 6: Integration verification and regression checks

- [ ] **Step 1: Verify MonsterMods export name**

Check `src/core/MonsterMods.ts` for the correct function name. Update the import in Game.ts if needed.

- [ ] **Step 2: Manual test checklist**

| # | Test | Expected |
|---|------|----------|
| 1 | Enter any zone with urns | Urns render with smoke + info panel |
| 2 | Walk near urn | Info panel fades in, "Open [E]" shows |
| 3 | Press E with no orb selected | Urn opens, curses apply immediately |
| 4 | After E press | Enemies spawn in ring around urn, staggered over ~1s |
| 5 | Spawned enemies | No enemies inside walls or on top of player |
| 6 | Spawned enemies | Count matches rarity (normal=6-7, magic=7-8, rare=9-10) |
| 7 | Kill one urn enemy | No gold/items drop, no soul drop |
| 8 | Kill all urn enemies | Golden flash at urn → loot bursts out |
| 9 | After all dead | Urn fades out over ~1.2 seconds |
| 10 | After full fade | Urn removed from world entirely |
| 11 | Walk over cleared urn spot | No interaction, no panel |
| 12 | Leave zone and return | Cleared urns gone; unopened urns respawn fresh |
| 13 | Die mid-urn-encounter | Urn stays open, enemies stay, kill counter preserved |
| 14 | Open urn with orb first | Orb upgrades work, then spawn system triggers |
| 15 | Normal urn | Standard enemies spawn (no rarity mods) |
| 16 | Magic urn | 1-2 magic enemies near end of wave |
| 17 | Rare urn | 1 rare enemy guaranteed |

- [ ] **Step 3: Fix any bugs found during testing**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "fix: integration fixes from cursed urn loop testing"
```

---

### Task 7: Update memory.md

- [ ] **Step 1: Add Phase 22b section**

```md
### Phase 22b — Cursed Urn Gameplay Loop Rework (completed 2026-06-09)

- **Enemy spawn on open**: 6-10 enemies (scaled by urn rarity) spawn in a ring around the urn
- **Staggered spawn**: Enemies deploy one at a time over 0.8s via spawn queue
- **Spawn positioning**: Ring pattern 80-200px radius with wall/player collision validation
- **Kill tracking**: `UrnSpawnGroup` in Game.ts tracks totalSpawned/totalKilled per urn
- **Loot gated on clear**: Loot only drops after all urn enemies are killed, drops at urn position
- **Urn enemies drop no loot**: `dropsLoot = false` + gate in death loop; 50% reduced XP granted
- **Urn fade-out**: Container alpha 1→0 over 1.2s on clear, then removed from world
- **Urn state machine**: `idle` → `active` (enemies fighting) → `cleared` (fading)
- **Save/load**: Only cleared urns saved; opened-but-uncleared urns reset on zone re-entry
- **Enemy fields**: `spawnSource`, `urnId`, `dropsLoot`, `xpMultiplier`, `spawnAnimTimer`
- **Spawn-in animation**: Enemies scale from 0→1 over 200ms

**Files changed:** Enemy.ts (+5 fields, +11 lines), CursedUrn.ts (state machine, fade, id), Game.ts (spawn, tracking, gating)
```

- [ ] **Step 2: Commit**

```bash
git add memory.md && git commit -m "docs: update memory.md with cursed urn gameplay loop rework"
```
