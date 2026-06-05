# Ranger Sub Skill Trees — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-ability sub skill trees for all 4 Ranger main abilities, accessible via K key with a wheel UI.

**Architecture:** New `SkillSubTree.ts` defines nodes and tree logic (like PassiveTree). New `SkillSubTreeScreen.ts` renders a radial wheel overlay. `Player.ts` gains a `skillSubTrees` map and `skillSubPoints`. `Game.ts` toggles the screen with K and wires allocation callbacks. Keystone effects are checked at skill activation time.

**Tech Stack:** TypeScript + PixiJS 7

---

### Task 1: Create SkillSubTree core module

**Files:**
- Create: `src/core/SkillSubTree.ts`

- [ ] **Create SkillSubTree.ts** with node types and SkillSubTree class:

```ts
import { Logger } from './Logger';

export interface SkillSubTreeNode {
  id: string;
  name: string;
  desc: string;
  type: 'small' | 'keystone';
  x: number;
  y: number;
  connections: string[];
  effects: Record<string, number>;
}

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
```

- [ ] **Add all 4 tree node definitions** after the class. Use the wheel layout with START at center-bottom position (400, 620) and nodes positioned in a radial pattern:

```ts
// Quick Shot tree (units: x,y in a virtual 800x700 space, mapped to screen in UI)
export const QUICK_SHOT_TREE: SkillSubTreeNode[] = [
  { id: 'qs_start', name: 'Quick Shot', desc: 'Fast single projectile', type: 'start', x: 400, y: 620, connections: ['qs_1', 'qs_4', 'qs_7', 'qs_10'], effects: {} },
  // Ricochet path (bottom-left)
  { id: 'qs_1', name: 'Swift Draw', desc: '+15% attack speed', type: 'small', x: 280, y: 540, connections: ['qs_start', 'qs_2'], effects: { attackSpeedPct: 15 } },
  { id: 'qs_2', name: 'Accelerant', desc: '+20% projectile speed', type: 'small', x: 220, y: 460, connections: ['qs_1', 'qs_3'], effects: { projectileSpeedPct: 20 } },
  { id: 'qs_3', name: 'Ricochet', desc: 'Projectile bounces to 1 additional target on hit', type: 'keystone', x: 180, y: 370, connections: ['qs_2'], effects: { ricochet: 1 } },
  // Piercing Shot path (bottom-right)
  { id: 'qs_4', name: 'Sharper Edge', desc: '+10% damage', type: 'small', x: 520, y: 540, connections: ['qs_start', 'qs_5'], effects: { damagePct: 10 } },
  { id: 'qs_5', name: 'Long Shot', desc: '+15% range', type: 'small', x: 580, y: 460, connections: ['qs_4', 'qs_6'], effects: { rangePct: 15 } },
  { id: 'qs_6', name: 'Piercing Shot', desc: 'Projectile pierces all enemies', type: 'keystone', x: 620, y: 370, connections: ['qs_5'], effects: { pierce: 1 } },
  // Static Arrow path (top-left)
  { id: 'qs_7', name: 'Static Charge', desc: '10% chance to shock on hit', type: 'small', x: 300, y: 350, connections: ['qs_start', 'qs_8'], effects: { shockChance: 10 } },
  { id: 'qs_8', name: 'Chain Arc', desc: '+15% chain lightning damage', type: 'small', x: 240, y: 270, connections: ['qs_7', 'qs_9'], effects: { chainDmgPct: 15 } },
  { id: 'qs_9', name: 'Static Arrow', desc: 'On hit, chains lightning to 2 nearby enemies for 50% damage', type: 'keystone', x: 200, y: 180, connections: ['qs_8'], effects: { staticArrow: 1 } },
  // Triple Fire path (top-right)
  { id: 'qs_10', name: 'Split Intent', desc: '+5% damage per projectile', type: 'small', x: 500, y: 350, connections: ['qs_start', 'qs_11'], effects: { dmgPerProjPct: 5 } },
  { id: 'qs_11', name: 'Spread Pattern', desc: '-50% spread angle between arrows', type: 'small', x: 560, y: 270, connections: ['qs_10', 'qs_12'], effects: { spreadAngleReductionPct: 50 } },
  { id: 'qs_12', name: 'Triple Fire', desc: 'Fires 3 arrows in a narrow spread per cast', type: 'keystone', x: 600, y: 180, connections: ['qs_11'], effects: { tripleFire: 1 } },
];
```

Position the remaining 3 skills' nodes similarly:
- Multi Shot: center at (400, 600), paths radiating to bottom-left, bottom-right, top-left, top-right
- Rain of Arrows: same wheel layout
- Snipe: same wheel layout

Each tree needs 12 non-start nodes (3 small × 4 paths + 4 keystones). Use the node names and effects from the spec.

- [ ] **Create export for all trees:**
```ts
export const RANGER_SUB_TREES: Record<string, SkillSubTreeNode[]> = {
  quick_shot: QUICK_SHOT_TREE,
  multi_shot: MULTI_SHOT_TREE,
  rain_of_arrows: RAIN_OF_ARROWS_TREE,
  snipe: SNIPE_TREE,
};
```

- [ ] **Run `npx tsc --noEmit`** to verify clean compilation.
- [ ] **Commit:**
```
git add src/core/SkillSubTree.ts
git commit -m "feat: add SkillSubTree core module with Ranger tree data"
```

---

### Task 2: Create SkillSubTreeScreen UI

**Files:**
- Create: `src/ui/SkillSubTreeScreen.ts`

- [ ] **Create the UI class** following the PassiveTreeScreen pattern (full-screen overlay on app.stage, 1920×1080 coordinates):

```ts
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { SkillSubTree } from '../core/SkillSubTree';
import { Logger } from '../core/Logger';

export class SkillSubTreeScreen {
  container: Container;
  private tree: SkillSubTree;
  private points: number;
  private onAllocate: (id: string) => void;

  private nodeGfx: Map<string, { bg: Graphics; fill: Graphics; text: Text }> = new Map();
  private lines: Graphics;
  private infoText: Text;
  private pointsText: Text;
  private hoveredNode: string | null = null;
  private abilityName: string;

  // ... constructor with dark bg, header, close hint, points text, lines layer

  // ... redraw() renders circular nodes with connections, color by allocated/available/locked
  // ... handleHover() shows node info text
  // ... handleClick() allocates on click if possible
  // ... update() re-renders with new tree state

  // destroy()
}
```

Key implementation details:
- Canvas uses full 1920×1080 screen coords
- Nodes positioned by mapping the virtual (800×700) coords to a centered 1400×800 area
- Draw connection lines between linked nodes (thicker/bright if both ends allocated)
- Node circles: allocated=blue, available=dim blue, locked=dark
- Keystones: larger circles (radius 18) vs small (radius 11)
- Info panel on right side showing selected node name, type, description, effects
- Start node is always visible but not clickable
- Max keystone warning if trying to allocate a 3rd keystone

- [ ] **Run `npx tsc --noEmit`** to verify.
- [ ] **Commit:**
```
git add src/ui/SkillSubTreeScreen.ts
git commit -m "feat: create SkillSubTreeScreen UI overlay"
```

---

### Task 3: Add subTreeId to SkillDefs + integrate into Player

**Files:**
- Modify: `src/core/SkillDefs.ts`
- Modify: `src/entities/Player.ts`

- [ ] **In SkillDefs.ts**, add `subTreeId?: string` to SkillDef interface:

```ts
export interface SkillDef {
  id: string;
  name: string;
  // ... existing fields
  subTreeId?: string;  // <-- ADD THIS
}
```

- [ ] **Add `subTreeId`** to each Ranger main ability:

```ts
{ id: 'quick_shot', ..., subTreeId: 'quick_shot' },
{ id: 'multi_shot', ..., subTreeId: 'multi_shot' },
{ id: 'rain_of_arrows', ..., subTreeId: 'rain_of_arrows' },
{ id: 'snipe', ..., subTreeId: 'snipe' },
```

- [ ] **In Player.ts**, add new fields (after `passivePoints = 0`):

```ts
skillSubTrees: Map<string, SkillSubTree> = new Map();
skillSubPoints = 0;
```

- [ ] **Add import** at top of Player.ts:

```ts
import { SkillSubTree, RANGER_SUB_TREES } from '../core/SkillSubTree';
```

- [ ] **Initialize sub trees** when the player's class is set to ranger. In the constructor or when class is selected, add:

```ts
if (classType === 'ranger') {
  for (const [id, data] of Object.entries(RANGER_SUB_TREES)) {
    this.skillSubTrees.set(id, new SkillSubTree(id, data));
  }
}
```

- [ ] **Add level-up hook** for sub skill points in `addXp()` method:

Find the level-up section in `addXp()`:
```ts
while (this.xp >= this.xpToNext) {
  this.xp -= this.xpToNext;
  this.level++;
  this.passivePoints++;
  this.unspentAttrPoints += 3;
  if (this.level % 4 === 0) this.skillSubPoints++;  // ADD THIS
}
```

- [ ] **Run `npx tsc --noEmit`** to verify.
- [ ] **Commit:**
```
git add src/core/SkillDefs.ts src/entities/Player.ts
git commit -m "feat: add subTreeId to skills, skillSubTrees to Player"
```

---

### Task 4: Wire K key toggle, save/load, and callbacks in Game.ts

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Add imports:**

```ts
import { SkillSubTreeScreen } from '../ui/SkillSubTreeScreen';
```

- [ ] **Add fields** to Game class (after `treeOpen = false`):

```ts
private subTreeOpen = false;
private subTreeScreen?: SkillSubTreeScreen;
private wasKKeyDown = false;
```

- [ ] **Add toggle method** (similar to toggleTree). After `toggleTree()`:

```ts
private toggleSubTree() {
  if (!this.player) return;
  if (this.subTreeOpen) {
    if (this.subTreeScreen) {
      this.app.stage.removeChild(this.subTreeScreen.container);
      this.subTreeScreen.destroy();
      this.subTreeScreen = undefined;
    }
    this.subTreeOpen = false;
  } else {
    // Only open if player has a main ability with a sub tree
    const skill = this.player.skills.mainAbility;
    if (!skill?.subTreeId) return;
    const tree = this.player.skillSubTrees.get(skill.subTreeId);
    if (!tree) return;

    this.subTreeScreen = new SkillSubTreeScreen(
      SCREEN_WIDTH, SCREEN_HEIGHT,
      tree, this.player.skillSubPoints,
    );
    this.subTreeScreen.onAllocateCallback((id: string) => {
      if (this.player && tree.allocate(id)) {
        this.player.skillSubPoints--;
        this.subTreeScreen?.update(tree, this.player.skillSubPoints);
      }
    });
    this.app.stage.addChild(this.subTreeScreen.container);
    this.subTreeOpen = true;
  }
}
```

- [ ] **Add K key handler** in the gameplay input section (near the P key handler, around line 1180):

```ts
const kDown = this.input.isKeyDown('KeyK');
if (kDown && !this.wasKKeyDown) {
  if (!this.treeOpen && !this.inventoryOpen) this.toggleSubTree();
}
this.wasKKeyDown = kDown;
```

- [ ] **Block other inputs** when sub tree is open. Add `this.subTreeOpen` guards to prevent skill usage and movement while the tree is open. Add a close-on-other-overlay guard similar to inventory:

```ts
if (this.subTreeOpen) {
  // close on Escape or K again
  const escDown = this.input.isKeyDown('Escape');
  if (escDown && !this.wasEscapeKeyDown) this.toggleSubTree();
  return;  // block gameplay
}
```

- [ ] **Add sub tree save/load serialization** in SaveManager SaveData interface (or inline in Game.ts). Add to SaveData:

```ts
skillSubTrees?: Record<string, string[]>; // abilityId -> allocated node ids
```

In `saveGame()`:
```ts
const skillSubTrees: Record<string, string[]> = {};
for (const [id, tree] of this.player.skillSubTrees) {
  skillSubTrees[id] = [...tree.allocated];
}
saveData.skillSubTrees = skillSubTrees;
```

In `loadGame()`:
```ts
if (data.skillSubTrees) {
  for (const [id, nodeIds] of Object.entries(data.skillSubTrees)) {
    const tree = this.player.skillSubTrees.get(id);
    if (tree) {
      for (const nid of nodeIds) {
        if (tree.canAllocate(nid)) {
          tree.allocate(nid);
        }
      }
    }
  }
}
```

Also add `skillSubPoints` to SaveData.

- [ ] **Add `cleanupGameSession()`** cleanup for sub tree screen.
- [ ] **Run `npx tsc --noEmit`** to verify.
- [ ] **Commit:**
```
git add src/core/Game.ts src/core/SaveManager.ts
git commit -m "feat: wire K key toggle, save/load for sub skill trees"
```

---

### Task 5: Wire keystone effects into combat code

**Files:**
- Modify: `src/entities/Player.ts`
- Modify: `src/core/Game.ts`
- Modify: `src/entities/Projectile.ts` (if needed)

This task wires each keystone's actual gameplay effect. The code checks at appropriate points whether a keystone is allocated and modifies behavior.

- [ ] **Add helper method** on Player to check keystones:

```ts
hasSubKeystone(keystoneId: string): boolean {
  for (const tree of this.skillSubTrees.values()) {
    if (tree.hasKeystone(keystoneId)) return true;
  }
  return false;
}
```

- [ ] **Quick Shot keystones** — wire in `Player.fireProjectile()`:

**Ricochet** (`ricochet`): After projectile creation, if keystone allocated, set `p.bounceCount = 1` and `p.bounceRange = 250`. Add bounce logic to Projectile.ts (on enemy hit, if bounceCount > 0, find nearest enemy within range, redirect angle).

**Piercing Shot** (`pierce`): Set `p.pierce = true` for Quick Shot projectiles.

**Static Arrow** (`staticArrow`): On enemy hit by Quick Shot, chain lightning to 2 nearest enemies. Add in Game.ts projectile hit loop:
```ts
if (this.player.hasSubKeystone('staticArrow') && !p.hostile) {
  // find 2 nearest enemies within 200px, deal 50% damage
  const chained = this.enemies.filter(o => o !== enemy && o.alive && Math.hypot(o.x - enemy.x, o.y - enemy.y) < 200);
  for (let ci = 0; ci < Math.min(2, chained.length); ci++) {
    chained[ci].takeDamage(Math.round(p.damage * 0.5));
    this.combatText.showDamage(chained[ci].x, chained[ci].y - 20, Math.round(p.damage * 0.5), 0x88ccff);
  }
}
```

**Triple Fire** (`tripleFire`): In Quick Shot path, fire 2 additional projectiles at ±8° from the main shot angle instead of 1.

- [ ] **Multi Shot keystones** — wire in `fireProjectile()` and Game.ts:

**Shotgun** (`shotgun`): In Multi Shot code path, if hasKeystone, set angle range to 120° cone, double projectile count.

**Poison Nova** (`poisonNova`): On Multi Shot impact, spawn poison cloud zone (reuse RainZone pattern or add `poisonClouds: {x, y, life, maxLife, radius}[]` in Game.ts).

**Point Blank** (`pointBlank`): Track hits per target in `rainZones`-style tracking. Each consecutive hit on same target does +20% more damage.

**Ring of Blades** (`ringOfBlades`): On Multi Shot cast, projectiles spawn at player position and orbit for 0.8s before flying outward. Add orbit state to Projectile or handle in Game.ts update loop.

- [ ] **Rain of Arrows keystones** — wire in Game.ts rain zone update:

**Arrow Storm** (`arrowStorm`): In rain zone damage tick, double arrow count (2-3→4-6), +20% radius.

**Precision Strike** (`precisionStrike`): -50% radius, 3× damage per arrow.

**Frost Volley** (`frostVolley`): On each arrow VFX spawn, also create a chilling ground patch. Track in new array `chillZones: {x, y, life, radius}[]`.

**Bombardment** (`bombardment`): On each arrow impact, deal 60px AoE for 50% damage.

- [ ] **Snipe keystones** — wire in `fireProjectile()` and Game.ts:

**Executioner** (`executioner`): In `calcDamage()`, if enemy HP < 50%, multiply damage by 1.5 for Snipe projectiles.

**Railgun** (`railgun`): 3× projectile speed, pass through walls (set `p.pierceWall = true` and skip wall collision in Projectile update).

**Split Shot** (`splitShot`): On enemy kill by Snipe projectile, spawn 3 small projectiles (30% damage) from corpse in random directions.

**Marked for Death** (`markedForDeath`): On hit, apply a mark debuff to enemy for 4s (+30% damage from all sources). Enemy needs `markedTimer` field; check in `takeDamage()`.

- [ ] **Add small node effects** — in `calcDamage()` and `fireProjectile()`, read `tree.getAllEffects()` and apply stat bonuses:

```ts
const effects = this.skillSubTrees.get(skill.subTreeId!)?.getAllEffects() || {};
let damageMult = 1 + ((effects.damagePct || 0) / 100);
// ... apply rangePct, attackSpeedPct, critChancePct, etc.
```

- [ ] **Run `npx tsc --noEmit`** to verify.
- [ ] **Run `npm run build`** to verify full build.
- [ ] **Commit:**
```
git add src/entities/Player.ts src/core/Game.ts src/entities/Projectile.ts
git commit -m "feat: wire all keystone effects into combat code"
```
