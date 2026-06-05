# Character Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Character Screen (C key) with comprehensive stats display and per-ability damage breakdown, replacing the mini stats panel in InventoryScreen.

**Architecture:** New `src/ui/CharacterScreen.ts` overlay with Stats/Abilities tabs. Modify `Player.ts` to expose damage/cooldown helpers. Add `C` key binding and overlay management in `Game.ts`. Remove stats panel from `InventoryScreen.ts`.

**Tech Stack:** TypeScript, PixiJS 7 (Container, Graphics, Text)

---

### Task 1: Expose calcDamage and add getSkillCooldown on Player

**Files:**
- Modify: `src/entities/Player.ts:837` and `src/entities/Player.ts:867`

- [ ] **Step 1: Make calcDamage public**

Change `private calcDamage` to `public calcDamage` on line 837.

```typescript
  public calcDamage(skill: SkillDef): number {
```

- [ ] **Step 2: Add getSkillCooldown method**

Add after line 873 (after `getAttackCooldown()`), before `getBounds()`:

```typescript
  getSkillCooldown(skill: SkillDef): number {
    const mult = this.skills.attackSpeedMult() * this._computedStats.attackSpeedMult;
    const cdr = (this._computedStats.cooldownReductionPct || 0) / 100;
    return Math.max(5, Math.round((skill.cooldown * (1 - cdr)) / mult));
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: expose calcDamage, add getSkillCooldown on Player"
```

---

### Task 2: Remove stats panel from InventoryScreen

**Files:**
- Modify: `src/ui/InventoryScreen.ts:33`, `src/ui/InventoryScreen.ts:205-217`, `src/ui/InventoryScreen.ts:229-262`, `src/ui/InventoryScreen.ts:559-562`

- [ ] **Step 1: Remove statTexts field**

Delete line 33:
```typescript
  // Remove this line:
  private statTexts: Text[] = [];
```

- [ ] **Step 2: Remove stats panel creation**

Delete lines 205-217 (the "Stats panel" section including header creation and refreshStats call). Also delete `statsX` and `statsY` variables if they're only used for stats.

Delete this block:
```typescript
    // Stats panel
    const statsX = screenW / 2 + 200;
    const statsY = equipStartY + slotLabels.length * (equipSlotSize + equipGap) + 30;

    const header = new Text('Character Stats', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: COLORS.textStat,
      stroke: '#000', strokeThickness: 2,
    }));
    header.x = statsX;
    header.y = statsY;
    this.container.addChild(header);

    this.refreshStats(computedStats, statsX, statsY);
```

- [ ] **Step 3: Remove refreshStats method**

Delete the entire `refreshStats` method (lines 229-251):

```typescript
  private refreshStats(computedStats: any, x: number, y: number) {
    for (const t of this.statTexts) this.container.removeChild(t);
    this.statTexts = [];

    const lines = [
      `Life: ${computedStats?.maxHp || 0}`,
      `Mana: ${computedStats?.maxMana || 0}`,
      `Armor DR: ${computedStats?.damageReduction || 0}%`,
      `Attack Speed: ${((computedStats?.attackSpeedMult || 1) * 100).toFixed(0)}%`,
      `Move Speed: ${((computedStats?.moveSpeedMult || 1) * 100).toFixed(0)}%`,
      `Dodge: ${computedStats?.dodgePct || 0}%`,
    ];

    for (let i = 0; i < lines.length; i++) {
      const t = new Text(lines[i], new TextStyle({
        fontFamily: 'monospace', fontSize: 12, fill: COLORS.text,
      }));
      t.x = x;
      t.y = y + 24 + i * 20;
      this.container.addChild(t);
      this.statTexts.push(t);
    }
  }
```

- [ ] **Step 4: Remove refreshStats call from update**

Delete lines 559-562 (the stats update section in `update()`):

```typescript
    // Update stats
    const statsX = 1920 / 2 + 200;
    const statsY = 80 + 7 * (60 + 10) + 30;
    this.refreshStats(computedStats, statsX, statsY);
```

The `computedStats` parameter is no longer used in `update()` after removing the stats refresh. However, leave the parameter in the `update()` signature to avoid changing callers in Game.ts — the parameter will simply be unused. Same for the constructor parameter.

**Important:** Also remove the `this.statTexts` field declaration (line 33). The `statLabel` method is used by tooltip code in the constructor (line 327) — only delete the method body if the tooltip code no longer references it. Verify first by searching for `statLabel` usage in the file.

- [ ] **Step 7: Commit**

```bash
git add src/ui/InventoryScreen.ts
git commit -m "refactor: remove stats panel from InventoryScreen"
```

---

### Task 3: Create CharacterScreen component

**Files:**
- Create: `src/ui/CharacterScreen.ts`

- [ ] **Step 1: Write the full CharacterScreen class**

Create `src/ui/CharacterScreen.ts`:

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';

export class CharacterScreen {
  container: Container;
  private player: Player;
  private activeTab: 'stats' | 'abilities' = 'stats';
  private panelX: number;
  private panelY: number;
  private readonly PANEL_W = 800;
  private readonly PANEL_H = 650;
  private readonly SCREEN_W: number;
  private readonly SCREEN_H: number;

  constructor(screenW: number, screenH: number, player: Player) {
    this.player = player;
    this.SCREEN_W = screenW;
    this.SCREEN_H = screenH;
    this.container = new Container();
    this.panelX = (screenW - this.PANEL_W) / 2;
    this.panelY = (screenH - this.PANEL_H) / 2;
    this.rebuild();
  }

  private rebuild() {
    this.container.removeChildren();

    // Dark backdrop
    const backdrop = new Graphics();
    backdrop.beginFill(0x000000, 0.5);
    backdrop.drawRect(0, 0, this.SCREEN_W, this.SCREEN_H);
    backdrop.endFill();
    backdrop.eventMode = 'static';
    this.container.addChild(backdrop);

    // Panel background
    const panel = new Graphics();
    panel.beginFill(0x141428, 0.93);
    panel.drawRoundedRect(this.panelX, this.panelY, this.PANEL_W, this.PANEL_H, 8);
    panel.endFill();
    this.container.addChild(panel);

    // Tab bar
    this.buildTabBar();

    // Content
    if (this.activeTab === 'stats') {
      this.buildStatsContent();
    } else {
      this.buildAbilitiesContent();
    }
  }

  private buildTabBar() {
    const tabW = 120;
    const tabH = 30;
    const tabGap = 10;
    const tabsTotalW = tabW * 2 + tabGap;
    const tabStartX = this.panelX + (this.PANEL_W - tabsTotalW) / 2;
    const tabY = this.panelY + 10;

    for (const tab of ['stats', 'abilities'] as const) {
      const x = tabStartX + (tab === 'stats' ? 0 : tabW + tabGap);
      const isActive = this.activeTab === tab;

      const bg = new Graphics();
      bg.beginFill(isActive ? 0x334466 : 0x1a1a30);
      bg.drawRoundedRect(x, tabY, tabW, tabH, 4);
      bg.endFill();
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      const capturedTab = tab;
      bg.on('pointerdown', () => {
        this.activeTab = capturedTab;
        this.rebuild();
      });
      this.container.addChild(bg);

      const label = new Text(tab === 'stats' ? 'Stats' : 'Abilities', new TextStyle({
        fontFamily: 'monospace', fontSize: 14,
        fill: isActive ? '#ffffff' : '#888899',
      }));
      label.anchor.set(0.5);
      label.x = x + tabW / 2;
      label.y = tabY + tabH / 2;
      this.container.addChild(label);
    }
  }

  private buildStatsContent() {
    const attrs = this.player.attrs;
    const s = this.player.computedStats;
    const cx = this.panelX + 30;
    let cy = this.panelY + 55;
    const col2 = this.panelX + this.PANEL_W / 2 + 10;
    const lh = 20;
    const sectionGap = 10;

    const sectionStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold',
      fill: '#ffdd88', stroke: '#000', strokeThickness: 2,
    });
    const statStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#ccccdd',
    });
    const valueStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#ffffff',
    });

    const addStat = (label: string, value: string, x: number, refY: number) => {
      const l = new Text(label, statStyle);
      l.x = x;
      l.y = refY;
      this.container.addChild(l);
      const v = new Text(value, valueStyle);
      v.x = x + 210;
      v.y = refY;
      this.container.addChild(v);
    };

    const addSection = (title: string, stats: [string, string][], x: number, refY: number) => {
      const h = new Text(title, sectionStyle);
      h.x = x;
      h.y = refY;
      this.container.addChild(h);
      let yy = refY + lh;
      for (const [label, value] of stats) {
        addStat(`  ${label}`, value, x, yy);
        yy += lh;
      }
      return yy;
    };

    // Attributes section (full width)
    addSection('Attributes', [
      ['STR', `${attrs.str}`],
      ['DEX', `${attrs.dex}`],
      ['INT', `${attrs.int}`],
      ['Unspent Points', `${this.player.unspentAttrPoints}`],
    ], cx, cy);
    cy += 4 * lh + sectionGap;

    // Offensive (left column) and Defensive (right column), same start Y
    const offY = cy;
    addSection('Offensive', [
      ['Melee Damage', `${((s.meleeDmgMult - 1) * 100).toFixed(0)}%`],
      ['Projectile Dmg', `${((s.projectileDmgMult - 1) * 100).toFixed(0)}%`],
      ['Attack Speed', `${((s.attackSpeedMult - 1) * 100).toFixed(0)}%`],
      ['Cold Damage', `${s.coldDmg || 0}`],
      ['Lightning Dmg', `${s.lightningDmg || 0}`],
      ['Extra Projectiles', `${s.additionalProjectiles || 0}`],
      ['Skill AOE', `${(s.skillAoePct || 0).toFixed(0)}%`],
      ['Culling Strike', `${(s.cullingStrikePct || 0).toFixed(0)}%`],
    ], cx, offY);

    addSection('Defensive', [
      ['Max HP', `${s.maxHp || 0}`],
      ['Max Mana', `${s.maxMana || 0}`],
      ['Armor DR', `${(s.damageReduction || 0).toFixed(0)}%`],
      ['Dodge', `${(s.dodgePct || 0).toFixed(0)}%`],
      ['Fortify on Hit', `${(s.fortifyOnHit || 0).toFixed(0)}`],
      ['HP Regen', `${(s.hpRegen || 0).toFixed(1)}`],
    ], col2, offY);

    // Utility (below columns, full width)
    cy = offY + 9 * lh + sectionGap;
    addSection('Utility', [
      ['Move Speed', `${((s.moveSpeedMult - 1) * 100).toFixed(0)}%`],
      ['Cooldown Red.', `${(s.cooldownReductionPct || 0).toFixed(0)}%`],
      ['Mana Regen', `${(s.manaRegenPct || 0).toFixed(0)}%`],
      ['Skill Duration', `${(s.skillDurationPct || 0).toFixed(0)}%`],
      ['Life Leech', `${(s.lifeLeechPct || 0).toFixed(1)}%`],
      ['Magic Find', `${(s.magicFindPct || 0).toFixed(0)}%`],
      ['Item Quantity', `${(s.itemQuantityPct || 0).toFixed(0)}%`],
    ], cx, cy);
  }

  private buildAbilitiesContent() {
    const cx = this.panelX + 30;
    let cy = this.panelY + 55;
    const lh = 24;

    const nameStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold',
      fill: '#ffdd88', stroke: '#000', strokeThickness: 2,
    });
    const detailStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ccccdd',
    });
    const emptyStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#555566', fontStyle: 'italic',
    });

    for (let i = 0; i < 6; i++) {
      const skill = this.player.skills.getSkill(i);
      if (!skill) {
        const t = new Text('(Empty)', emptyStyle);
        t.x = cx;
        t.y = cy;
        this.container.addChild(t);
        cy += lh;
        continue;
      }

      // Type badge text
      let badgeText = '';
      if (skill.effectType === 'dash') badgeText = '[Dash]';
      else if (['buff', 'debuff', 'passive'].includes(skill.effectType)) badgeText = '[Buff]';
      else if (skill.effectType === 'projectile' || skill.effectType === 'projectile_spread' || skill.effectType === 'projectile_pierce') badgeText = '[Projectile]';
      else badgeText = '[Melee]';

      const badgeColor = badgeText === '[Buff]' ? '#66cc88' : badgeText === '[Dash]' ? '#88aadd' : badgeText === '[Projectile]' ? '#ddaa44' : '#cc6666';

      const badge = new Text(badgeText, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: badgeColor,
      }));
      badge.x = cx;
      badge.y = cy;
      this.container.addChild(badge);

      const name = new Text(skill.name, nameStyle);
      name.x = cx + 70;
      name.y = cy;
      this.container.addChild(name);
      cy += lh;

      if (skill.damageMult > 0) {
        const dmg = this.player.calcDamage(skill);
        const cd = this.player.getSkillCooldown(skill);
        const cdSec = (cd / 60).toFixed(1);
        const detail = new Text(`Damage: ${dmg}  |  Cooldown: ${cdSec}s  |  Mana: ${skill.manaCost}`, detailStyle);
        detail.x = cx + 130;
        detail.y = cy - lh + 4;
        this.container.addChild(detail);
      } else {
        const desc = skill.description || '';
        const detail = new Text(desc, new TextStyle({
          fontFamily: 'monospace', fontSize: 11, fill: '#88aacc',
        }));
        detail.x = cx + 130;
        detail.y = cy - lh + 4;
        this.container.addChild(detail);
      }

      cy += 4;
    }
  }

  update() {
    this.rebuild();
  }

  destroy() {
    this.container.removeChildren();
    this.container.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/CharacterScreen.ts
git commit -m "feat: create CharacterScreen overlay with Stats and Abilities tabs"
```

---

### Task 4: Integrate CharacterScreen into Game.ts (C key, overlay management, cleanup)

**Files:**
- Modify: `src/core/Game.ts:120-124` (fields), `src/core/Game.ts:1290-1305` (Escape chain), `src/core/Game.ts:1365-1385` (key handlers), `src/core/Game.ts:1394-1400` (update routing), `src/core/Game.ts:3214-3286` (cleanup)

- [ ] **Step 1: Add imports**

Add to the import block at top of Game.ts:
```typescript
import { CharacterScreen } from '../ui/CharacterScreen';
```

- [ ] **Step 2: Add state fields**

After `private inventoryScreen?: InventoryScreen;` (line 126), add:
```typescript
  private characterScreenOpen = false;
  private characterScreen?: CharacterScreen;
  private wasCKeyDown = false;
```

- [ ] **Step 3: Add C key handler in the Playing block**

In the `Playing` state key handler section (around line 1365-1385, inside the `if (this.inventoryOpen)` / `else` block), add C key handler after the I key handler in the `else` block:

After `this.wasIKeyDown = iDown;` (line 1384), add:
```typescript
        const cDown = this.input.isKeyDown('KeyC');
        if (cDown && !this.wasCKeyDown) {
          if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen && !this.subTreeScreen) {
            this.toggleCharacterScreen();
          }
        }
        this.wasCKeyDown = cDown;
```

Also add `wasCKeyDown` reset in the `else` block (inside `if (this.inventoryOpen)`, after `this.wasIKeyDown = iDown;`):
```typescript
        this.wasCKeyDown = false;
```

- [ ] **Step 4: Add Escape chain entry**

In the Escape handling block (lines 1290-1305), add character screen close before the subTreeScreen check. Insert after `closeStash`:
```typescript
          } else if (this.characterScreenOpen) {
            this.toggleCharacterScreen();
```

- [ ] **Step 5: Add overlay guard block**

In the guard section (around line 1313), after stash update return:
```typescript
      if (this.characterScreenOpen) {
        const cDown = this.input.isKeyDown('KeyC');
        if (cDown && !this.wasCKeyDown) {
          this.wasCKeyDown = true;
          this.toggleCharacterScreen();
          return;
        }
        this.wasCKeyDown = cDown;
        this.characterScreen?.update();
        return;
      }
```

- [ ] **Step 6: Add toggleCharacterScreen method**

Add after `toggleInventory()` closes (after line 2985):

```typescript
  private toggleCharacterScreen() {
    if (!this.player) return;
    this.characterScreenOpen = !this.characterScreenOpen;
    if (this.characterScreenOpen) {
      this.characterScreen = new CharacterScreen(SCREEN_WIDTH, SCREEN_HEIGHT, this.player);
      this.app.stage.addChild(this.characterScreen.container);
    } else {
      if (this.characterScreen) {
        this.app.stage.removeChild(this.characterScreen.container);
        this.characterScreen.destroy();
        this.characterScreen = undefined;
      }
    }
  }
```

- [ ] **Step 7: Add to restartGame cleanup**

In `restartGame()` (around line 3215-3286), add character screen cleanup after inventory cleanup (around line 3220):
```typescript
    if (this.characterScreenOpen) this.toggleCharacterScreen();
    if (this.characterScreen) {
      this.app.stage.removeChild(this.characterScreen.container);
      this.characterScreen.destroy();
      this.characterScreen = undefined;
    }
```

- [ ] **Step 8: Add to other cleanup locations**

Search for `exitToMenu` and `buildCurrentZoneRoom` in Game.ts to find where character screen should be cleaned up on zone transition or game exit. Add `this.characterScreenOpen = false; this.characterScreen = undefined;` in those locations where inventory/tree are cleaned up.

- [ ] **Step 9: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: wire CharacterScreen to C key, Escape chain, and cleanup"
```

---

### Task 5: TypeScript verification and final validation

**Files:**
- Run: `npx tsc --noEmit`
- Run: `npm run build`

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors. (If errors, fix them in the relevant files.)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds, output in `dist/` folder.

- [ ] **Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: add Character Screen with stats and ability damage display"
```
