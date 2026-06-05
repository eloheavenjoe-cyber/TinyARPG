# HUD Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite HUD with bottom-anchored unified bar, ornate PoE-style bars, enemy nameplates, improved combat text, and minimap reposition.

**Architecture:** Rewrite `HUD.ts` as a bottom-anchored unified panel with HP/MP bars (left), skill bar (center), gold/XP/buffs (right). Add enemy HP bar + nameplate rendering to `Enemy.ts`. Improve `CombatText.ts` with rarity/damage-type coloring. Reposition minimap to top-right.

**Tech Stack:** TypeScript, PixiJS 7 (Container, Graphics, Text)

---

### Task 1: Rewrite HUD.ts (bottom-anchored unified bar)

**Files:**
- Rewrite: `src/ui/HUD.ts`

- [ ] **Step 1: Read the current HUD.ts to understand structure**

Read `C:\Users\Faber\Projects\TinyARPG\src\ui\HUD.ts` (130 lines).

- [ ] **Step 2: Write the new HUD.ts**

Replace with bottom-anchored unified bar layout. Key architectural changes:
- All Y positions computed from `SCREEN_HEIGHT - BOTTOM_MARGIN - barHeight` instead of fixed Y=1030
- Added `mpLabel` (mana number — currently missing)
- Added smooth lerp animation for HP/MP bars
- Added low-HP pulse effect
- Added ornate frame styling (gold trim, dark metal bg)
- Zone text stays at top-center but restyled (serif 22px gold)
- No skill bar within HUD — HUD delegates skill bar to its own class, just reserves center space

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { Logger } from '../core/Logger';

const SCREEN_H = 1080;

export class HUD {
  container: Container;

  private panel: Graphics;
  private hpBg: Graphics;
  private hpFill: Graphics;
  private hpLabel: Text;
  private hpDisplayed = 0;
  private mpBg: Graphics;
  private mpFill: Graphics;
  private mpLabel: Text;
  private mpDisplayed = 0;
  private goldText: Text;
  private levelText: Text;
  private xpBg: Graphics;
  private xpFill: Graphics;
  private zoneText: Text;
  private buffContainer: Container = new Container();

  private readonly BAR_W = 200;
  private readonly BAR_GAP = 8;
  private readonly PANEL_H = 100;
  private readonly BOTTOM_MARGIN = 6;

  private pulseTimer = 0;

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'HUD constructor called');

    const screenH = SCREEN_H;
    const panelY = screenH - this.PANEL_H - this.BOTTOM_MARGIN;
    const left = 18;
    const centerX = 960;

    // Panel — full-width, bottom-anchored, ornate frame
    this.panel = new Graphics();
    this.panel.beginFill(0x1a1a28, 0.92);
    this.panel.drawRoundedRect(0, panelY, 1920, this.PANEL_H, 6);
    this.panel.endFill();
    // Gold trim line at top of panel
    this.panel.lineStyle(1, 0x8a7a3a, 0.6);
    this.panel.moveTo(0, panelY);
    this.panel.lineTo(1920, panelY);

    // HP bar
    const hpY = panelY + 12;
    const barH = 22;

    this.hpBg = new Graphics();
    this.hpBg.beginFill(0x111111, 0.6);
    this.hpBg.drawRoundedRect(0, 0, this.BAR_W, barH, 3);
    this.hpBg.endFill();
    this.hpBg.lineStyle(1, 0x8a7a3a, 0.4);
    this.hpBg.drawRoundedRect(0, 0, this.BAR_W, barH, 3);
    this.hpBg.x = left;
    this.hpBg.y = hpY;

    this.hpFill = new Graphics();
    this.hpFill.x = left;
    this.hpFill.y = hpY;

    const labelStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    });
    this.hpLabel = new Text('', labelStyle);
    this.hpLabel.anchor.set(0.5, 0.5);
    this.hpLabel.x = left + this.BAR_W / 2;
    this.hpLabel.y = hpY + barH / 2 + 1;

    // MP bar
    const mpY = hpY + barH + this.BAR_GAP;
    const mpH = 18;

    this.mpBg = new Graphics();
    this.mpBg.beginFill(0x111111, 0.6);
    this.mpBg.drawRoundedRect(0, 0, this.BAR_W, mpH, 3);
    this.mpBg.endFill();
    this.mpBg.lineStyle(1, 0x8a7a3a, 0.4);
    this.mpBg.drawRoundedRect(0, 0, this.BAR_W, mpH, 3);
    this.mpBg.x = left;
    this.mpBg.y = mpY;

    this.mpFill = new Graphics();
    this.mpFill.x = left;
    this.mpFill.y = mpY;

    this.mpLabel = new Text('', labelStyle);
    this.mpLabel.anchor.set(0.5, 0.5);
    this.mpLabel.x = left + this.BAR_W / 2;
    this.mpLabel.y = mpY + mpH / 2 + 1;

    // Right section: gold, level, XP
    const rightX = 1500;
    const rightY = panelY + 12;

    this.goldText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 16, fill: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.goldText.x = rightX;
    this.goldText.y = rightY;

    this.levelText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fill: '#ddddee',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.levelText.x = rightX;
    this.levelText.y = rightY + 22;

    const xpY = rightY + 46;
    const xpH = 8;
    this.xpBg = new Graphics();
    this.xpBg.beginFill(0x222222, 0.6);
    this.xpBg.drawRoundedRect(0, 0, 160, xpH, 2);
    this.xpBg.endFill();
    this.xpBg.x = rightX;
    this.xpBg.y = xpY;

    this.xpFill = new Graphics();
    this.xpFill.x = rightX;
    this.xpFill.y = xpY;

    // Buff container (right section, below XP)
    this.buffContainer.x = rightX;
    this.buffContainer.y = xpY + 14;

    // Zone name (top-center)
    this.zoneText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 22, fill: '#ddaa55',
      stroke: '#000000', strokeThickness: 3,
    }));
    this.zoneText.anchor.set(0.5, 0);
    this.zoneText.x = centerX;
    this.zoneText.y = 6;

    this.container.addChild(
      this.panel,
      this.hpBg, this.hpFill, this.hpLabel,
      this.mpBg, this.mpFill, this.mpLabel,
      this.goldText, this.levelText,
      this.xpBg, this.xpFill,
      this.buffContainer,
      this.zoneText,
    );
  }

  update(player: Player, dt: number) {
    const barH = 22;
    const mpH = 18;

    // HP lerp + draw
    this.hpDisplayed += (player.health / player.maxHealth - this.hpDisplayed) * Math.min(1, 0.15 * dt);
    const hpPct = Math.max(0, Math.min(1, this.hpDisplayed));
    const hpColor = hpPct > 0.6 ? 0xdd3333 : hpPct > 0.3 ? 0xdd8800 : 0xff3333;

    this.hpFill.clear();
    this.hpFill.beginFill(hpColor);

    // Low HP pulse
    let pulseAlpha = 1;
    if (hpPct < 0.3) {
      this.pulseTimer += dt * 0.15;
      pulseAlpha = 0.7 + 0.3 * Math.sin(this.pulseTimer);
    } else {
      this.pulseTimer = 0;
    }
    this.hpFill.alpha = pulseAlpha;

    this.hpFill.drawRoundedRect(0, 0, this.BAR_W * hpPct, barH, 3);
    this.hpFill.endFill();
    this.hpLabel.text = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    // MP lerp + draw
    this.mpDisplayed += (player.mana / player.maxMana - this.mpDisplayed) * Math.min(1, 0.15 * dt);
    const mpPct = Math.max(0, Math.min(1, this.mpDisplayed));

    this.mpFill.clear();
    this.mpFill.beginFill(0x3366dd);
    this.mpFill.drawRoundedRect(0, 0, this.BAR_W * mpPct, mpH, 3);
    this.mpFill.endFill();
    this.mpLabel.text = `${Math.ceil(player.mana)} / ${player.maxMana}`;

    // Gold, Level, XP
    this.goldText.text = `${player.gold} Gold`;
    this.levelText.text = `Lv ${player.level}`;

    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;
    this.xpFill.clear();
    this.xpFill.beginFill(0x44aa88);
    this.xpFill.drawRoundedRect(0, 0, 160 * Math.min(1, xpPct), 8, 2);
    this.xpFill.endFill();

    // Buff indicators
    this.buffContainer.removeChildren();
    let bx = 0;
    const buffList = this.getActiveBuffs(player);
    for (const buff of buffList.slice(0, 4)) {
      const b = new Text(`◆ ${buff.name} ${buff.remaining.toFixed(1)}s`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: buff.color,
        stroke: '#000000', strokeThickness: 2,
      }));
      b.x = bx;
      b.y = 0;
      this.buffContainer.addChild(b);
      bx += b.width + 8;
    }
  }

  private getActiveBuffs(player: Player): { name: string; remaining: number; color: string }[] {
    const buffs: { name: string; remaining: number; color: string }[] = [];
    const sm = player.skills;
    if (sm.hasBuff('fortify')) buffs.push({ name: 'Fortify', remaining: sm.getBuffTimer('fortify') / 60, color: '#4488ff' });
    if (sm.hasBuff('battle_rage')) buffs.push({ name: 'Battle Rage', remaining: sm.getBuffTimer('battle_rage') / 60, color: '#ff4444' });
    if (sm.hasBuff('bloodlust')) buffs.push({ name: 'Bloodlust', remaining: sm.getBuffTimer('bloodlust') / 60, color: '#ff6644' });
    if (sm.hasBuff('eagle_eye')) buffs.push({ name: 'Eagle Eye', remaining: sm.getBuffTimer('eagle_eye') / 60, color: '#44dd88' });
    if (sm.hasBuff('haste')) buffs.push({ name: 'Haste', remaining: sm.getBuffTimer('haste') / 60, color: '#88dd44' });
    if (sm.hasBuff('meditate_damage')) buffs.push({ name: 'Meditate (DMG)', remaining: sm.getBuffTimer('meditate_damage') / 60, color: '#ffaa00' });
    if (sm.currentStance) buffs.push({ name: `Stance: ${sm.currentStance}`, remaining: 0, color: '#aa88ff' });
    return buffs;
  }

  setZoneName(name: string) {
    this.zoneText.text = name;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 3: Verify the `SkillManager` has `getBuffTimer` and `hasBuff` methods**

The code above calls `sm.hasBuff()` and `sm.getBuffTimer()`. Search SkillManager.ts to verify these exist. If `getBuffTimer` doesn't exist, add a simple implementation:

```typescript
  getBuffTimer(buffId: string): number {
    const buff = this.activeBuffs.find(b => b.id === buffId);
    return buff ? buff.timer : 0;
  }
```

Where `activeBuffs` array has `{ id: string; timer: number }` entries.

- [ ] **Step 4: Run typeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/HUD.ts src/core/SkillManager.ts
git commit -m "feat: rewrite HUD with bottom-anchored unified bar, smooth lerp, buff indicators"
```

---

### Task 2: Rewrite SkillBar.ts (ornate slots, radial cooldown, countdown, ready-pulse)

**Files:**
- Rewrite: `src/ui/SkillBar.ts`

- [ ] **Step 1: Read the current SkillBar.ts**

Read `C:\Users\Faber\Projects\TinyARPG\src\ui\SkillBar.ts` (83 lines).

- [ ] **Step 2: Write the reworked SkillBar.ts**

Changes:
- Ornate frame slots (dark iron bg, gold trim line)
- Animated radial cooldown sweep (arc drawn with Graphics.arc) instead of static black overlay
- Numeric cooldown countdown in center of slot when on cooldown
- Ready-pulse: brief glow animation when cooldown finishes
- Slightly larger slots (SLOT_W=90, SLOT_H=44) for better readability
- Slots are children of a centered container

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SkillManager } from '../core/SkillManager';
import { Logger } from '../core/Logger';

const SLOT_COUNT = 6;
const SLOT_W = 90;
const SLOT_H = 44;
const GAP = 6;
const TOTAL_W = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * GAP;

export class SkillBar {
  container: Container;
  private slots: { bg: Graphics; fill: Graphics; name: Text; key: Text; cdText: Text }[] = [];

  constructor() {
    this.container = new Container();
    Logger.log('ui', 'SkillBar created');

    const startX = -TOTAL_W / 2; // Centered within parent
    const barY = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = startX + i * (SLOT_W + GAP);

      // Slot background with ornate frame
      const bg = new Graphics();
      bg.beginFill(0x1a1a28, 0.85);
      bg.drawRoundedRect(0, 0, SLOT_W, SLOT_H, 4);
      bg.endFill();
      bg.lineStyle(1, 0x8a7a3a, 0.5);
      bg.drawRoundedRect(0, 0, SLOT_W, SLOT_H, 4);
      bg.x = x;
      bg.y = barY;

      // Cooldown fill (radial arc)
      const fill = new Graphics();
      fill.x = x;
      fill.y = barY;

      // Skill name
      const name = new Text('', new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#eeeeee',
        stroke: '#000000', strokeThickness: 2,
      }));
      name.anchor.set(0.5);
      name.x = x + SLOT_W / 2;
      name.y = barY + SLOT_H / 2 - 2;

      // Hotkey label
      const key = new Text(`${i + 1}`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#8a7a3a',
        stroke: '#000000', strokeThickness: 2,
      }));
      key.x = x + 4;
      key.y = barY + 3;

      // Cooldown countdown number
      const cdText = new Text('', new TextStyle({
        fontFamily: 'monospace', fontSize: 14, fill: '#ffffff', fontWeight: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }));
      cdText.anchor.set(0.5);
      cdText.x = x + SLOT_W / 2;
      cdText.y = barY + SLOT_H / 2 + 4;

      this.container.addChild(bg, fill, name, key, cdText);
      this.slots.push({ bg, fill, name, key, cdText });
    }
  }

  update(skills: SkillManager) {
    for (let i = 0; i < SLOT_COUNT; i++) {
      const skill = skills.getSkill(i);
      const slot = this.slots[i];

      if (!skill) {
        slot.name.text = '';
        slot.fill.clear();
        slot.cdText.text = '';
        continue;
      }

      slot.name.text = skill.name;
      slot.key.text = `${i + 1}`;

      const cdRatio = skills.cooldownRatio(skill.id);
      slot.fill.clear();
      slot.cdText.text = '';

      if (cdRatio > 0) {
        // Show countdown number
        const remaining = skills.cooldownRemaining(skill.id);
        if (remaining !== undefined) {
          const secs = Math.ceil(remaining / 60);
          slot.cdText.text = secs > 0 ? `${secs}` : '';
        }

        // Radial cooldown arc sweep
        slot.fill.beginFill(0x000000, 0.6);
        // Arc from top going clockwise for remaining cooldown
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + Math.PI * 2 * cdRatio;
        slot.fill.moveTo(SLOT_W / 2, SLOT_H / 2);
        slot.fill.arc(SLOT_W / 2, SLOT_H / 2, SLOT_W / 2, startAngle, endAngle);
        slot.fill.closePath();
        slot.fill.endFill();
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 3: Check SkillManager for `cooldownRemaining` method**

If `cooldownRemaining(id)` doesn't exist, add it to SkillManager.ts:

```typescript
  cooldownRemaining(skillId: string): number | undefined {
    const cd = this.cooldowns.get(skillId);
    return cd !== undefined ? cd : undefined;
  }
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/SkillBar.ts src/core/SkillManager.ts
git commit -m "feat: rework SkillBar with ornate slots, radial cooldown sweep, countdown"
```

---

### Task 3: Rewrite Enemy nameplates (HP bar + name + mods)

**Files:**
- Modify: `src/entities/Enemy.ts`

- [ ] **Step 1: Read current nameplate code**

Read lines 438-465 of Enemy.ts. Currently creates a single Text showing `[RARITY] modNames`.

- [ ] **Step 2: Rewrite `createNameplate` and `updateSprite` for full three-tier nameplate**

Changes:
- Replace single Text with a Container holding: HP bar Graphics + name Text + mod Text(s)
- Show for ALL aggroed enemies (not just magic/rare)
- HP bar: 4px tall, colored green→yellow→orange→red by health %, fills remaining health
- Name: white bold centered below bar
- Mods: one line per mod, colored by rarity (blue=magic, yellow=rare)
- Width scales by enemy size
- Rarity scale bonus: magic=1.1, rare=1.2 already exists — keep it

```typescript
import { Container as PixiContainer } from 'pixi.js';

// In class fields, replace:
//   nameplate: Text | null = null;
// With:
//   nameplate: PixiContainer | null = null;

// Replace createNameplate:
  private createNameplate(rarity: MonsterRarity, mods: MonsterMod[]) {
    this.nameplate = new PixiContainer();
    this.nameplateContainer = this.nameplate;

    const barW = Math.max(32, this.width);
    const barH = 4;

    // HP bar background
    const hpBg = new Graphics();
    hpBg.beginFill(0x222222, 0.8);
    hpBg.drawRoundedRect(-barW / 2, 0, barW, barH, 1);
    hpBg.endFill();
    this.nameplate.addChild(hpBg);

    // HP bar fill
    const hpFill = new Graphics();
    hpFill.name = 'hpFill';
    this.nameplate.addChild(hpFill);

    // Name
    const nameText = new Text(this.getDisplayName(), new TextStyle({
      fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }));
    nameText.anchor.set(0.5, 0);
    nameText.y = barH + 1;
    this.nameplate.addChild(nameText);

    // Mod lines
    let modY = nameText.y + 12;
    for (const mod of mods) {
      const mt = new Text(mod.name, new TextStyle({
        fontFamily: 'monospace', fontSize: 9,
        fill: RARITY_COLORS[rarity],
        stroke: '#000000', strokeThickness: 2,
      }));
      mt.anchor.set(0.5, 0);
      mt.y = modY;
      this.nameplate.addChild(mt);
      modY += 11;
    }
  }

  private getDisplayName(): string {
    const names: Record<string, string> = {
      grunt: 'Grunt', archer: 'Archer', juggernaut: 'Juggernaut', cultist: 'Cultist',
    };
    return names[this.type] || this.type;
  }
```

- [ ] **Step 3: Update `updateSprite` to redraw HP bar fill and update nameplate position**

```typescript
  private updateSprite() {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    if (this.nameplate) {
      this.nameplate.x = this.x;
      this.nameplate.y = this.y - this.height / 2 - 22;

      // Update HP bar fill
      const hpFill = this.nameplate.getChildByName('hpFill') as Graphics;
      if (hpFill) {
        const pct = this.health / this.maxHealth;
        const barW = Math.max(32, this.width);
        const color = pct > 0.6 ? 0x44cc44 : pct > 0.3 ? 0xcccc44 : 0xcc4444;
        hpFill.clear();
        hpFill.beginFill(color);
        hpFill.drawRoundedRect(-barW / 2, 0, barW * pct, 4, 1);
        hpFill.endFill();
      }
    }
  }
```

- [ ] **Step 4: Update `applyRarity` to always create nameplate for aggroed enemies**

Change the condition in `applyRarity` — nameplates should be created for all aggroed enemies, not just magic/rare. The `applyRarity` method is called during ZoneManager enemy spawning. Keep it creating for all rarity levels.

```typescript
  applyRarity(rarity: MonsterRarity, mods: MonsterMod[]) {
    this.rarity = rarity;
    this.mods = mods;
    for (const mod of mods) {
      mod.apply(this);
    }
    // Scale for magic/rare
    if (rarity !== 'normal') {
      const scaleBonus = rarity === 'magic' ? 1.1 : 1.2;
      this.sprite.scale.set(
        (this.sprite.scale.x > 0 ? 1 : -1) * Math.abs(this.sprite.scale.x) * scaleBonus
      );
    }
    // Create nameplate for all enemies (HP bar + name always, mods if any)
    this.createNameplate(rarity, mods);
  }
```

- [ ] **Step 5: Add imports**

Add these to the import block at top:
```typescript
import { Container as PixiContainer, Graphics } from 'pixi.js';
```

- [ ] **Step 6: Update the `nameplate` field type**

Change from:
```typescript
  nameplate: Text | null = null;
```
To:
```typescript
  nameplate: Container | null = null;
```

Where Container is PixiJS Container (aliased from `import { Container as PixiContainer }`).

Actually, use `import { Container as PixiContainer }` to avoid name conflict with the class Container concept. In the file, the fields use `Container` for the PixiJS class.

Let me be more precise: the Enemy class doesn't currently have a `Container` import from pixi.js. The existing import line has `Text, TextStyle`. Add `Container, Graphics` to it.

```typescript
// line 1 becomes:
import { Sprite, Texture, AnimatedSprite, Text, TextStyle, Container, Graphics } from 'pixi.js';
```

Then the field becomes:
```typescript
  nameplate: Container | null = null;
```

- [ ] **Step 7: Only show nameplate for aggroed enemies that have taken damage**

In the `update()` method of Enemy, add a condition near where nameplates are added to the game container (this is done in Game.ts, not Enemy.ts). The Game.ts spawn code should check if enemy is aggroed before adding nameplate.

Actually, let's keep it simpler: always show nameplate for ALL enemies. This is fine for the scope of this task. Game.ts already handles adding nameplates to gameContainer (lines 1155, 1212, 1229, 2296).

- [ ] **Step 8: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add src/entities/Enemy.ts
git commit -m "feat: rewrite enemy nameplates with HP bar, name, and mod text"
```

---

### Task 4: Improve CombatText.ts (rarity-colored, damage-type tinted, size scaling)

**Files:**
- Modify: `src/entities/CombatText.ts`

- [ ] **Step 1: Read current CombatText.ts**

Read the file (54 lines). Current: single font size 18, white, with random x offset.

- [ ] **Step 2: Rewrite `showDamage` to support rarity color and damage type tint**

Add new parameters to `showDamage`:

```typescript
  showDamage(x: number, y: number, amount: number, color: number = 0xffffff, rarityColor?: number, damageType?: 'cold' | 'lightning') {
    // Base color from rarity if provided, else passed color
    let finalColor = rarityColor ?? color;
    // Apply damage-type tint
    if (damageType === 'cold') {
      // Shift toward blue: mix with 0x4488ff
      finalColor = this.blendColors(finalColor, 0x4488ff, 0.4);
    } else if (damageType === 'lightning') {
      // Shift toward yellow: mix with 0xffdd44
      finalColor = this.blendColors(finalColor, 0xffdd44, 0.4);
    }

    // Size scales with damage (minimum 14, max 22, scales log-like)
    const size = Math.min(22, Math.max(14, 12 + Math.floor(amount / 10)));

    const t = new Text(`${amount}`, new TextStyle({
      fontFamily: 'monospace',
      fontSize: size,
      fill: finalColor,
      stroke: 0x000000,
      strokeThickness: 3,
      fontWeight: 'bold',
    }));
    t.anchor.set(0.5);
    t.x = x + (Math.random() - 0.5) * 16;
    t.y = y;

    this.container.addChild(t);
    this.items.push({ text: t, vy: -1.8, life: 55, maxLife: 55 });
  }

  private blendColors(a: number, b: number, ratio: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * ratio);
    const g = Math.round(ag + (bg - ag) * ratio);
    const bl = Math.round(ab + (bb - ab) * ratio);
    return (r << 16) | (g << 8) | bl;
  }
```

- [ ] **Step 3: Update callers to pass rarityColor and damageType**

Find all callers of `showDamage` in Game.ts and Player.ts. Currently they pass `(x, y, amount, color)`. Update to pass `(x, y, amount, color, rarityColor, damageType)`.

In `Game.ts`, search for `combatText.showDamage` — typically called in the combat handling section.

```typescript
// Example update:
this.combatText.showDamage(enemy.x, enemy.y, damage, 0xffffff, undefined, 'cold');
```

Callers need to determine damageType from the item/affix. For simplicity, pass `undefined` for damageType if not known (keeps current behavior). RarityColor can be derived from item rarity if available.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/entities/CombatText.ts src/core/Game.ts src/entities/Player.ts
git commit -m "feat: improve combat text with rarity color, damage-type tint, size scaling"
```

---

### Task 5: Reposition Minimap to top-right + add fade animation

**Files:**
- Modify: `src/ui/Minimap.ts`

- [ ] **Step 1: Read current Minimap.ts**

Read the file (90 lines).

- [ ] **Step 2: Change minimap position to top-right**

Change line 23-24 from:
```typescript
    const screenX = 1920 - MINIMAP_W - PAD;
    const screenY = 1080 - MINIMAP_H - PAD;
```
To:
```typescript
    const screenX = 1920 - MINIMAP_W - PAD;
    const screenY = PAD;
```

- [ ] **Step 3: Add alpha fade animation**

Add fields:
```typescript
  private targetAlpha = 1;
  private currentAlpha = 1;
```

In `update()`, add alpha lerp:
```typescript
  update(...) {
    // Alpha fade
    this.currentAlpha += (this.targetAlpha - this.currentAlpha) * 0.1;
    this.container.alpha = this.currentAlpha;

    // ... rest of update logic
  }
```

Add method:
```typescript
  fadeIn() {
    this.targetAlpha = 1;
  }

  fadeOut() {
    this.targetAlpha = 0;
  }
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/Minimap.ts
git commit -m "feat: reposition minimap to top-right, add fade animation"
```

---

### Task 6: Wire everything in Game.ts and adjust Zone text

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Read relevant sections**

Read around lines 2334 (setZoneName call), and find where `combatText.showDamage` is called.

- [ ] **Step 2: Update zone text styling**

The zone text is created inside HUD now. The `setZoneName` method is already called from Game.ts line 2334. No changes needed — just verify HUD's zone text uses the new style (serif 22px gold).

- [ ] **Step 3: Update `updateGameplay` to pass dt to HUD.update**

Find the HUD update call (around where `this.hud.update(this.player)` is called) and pass dt:

```typescript
this.hud.update(this.player, dt);
```

- [ ] **Step 4: Wire combat text improvements**

Update combat text calls to pass rarity info when available. Search for `combatText.showDamage` in Game.ts and update signatures. Example pattern:

```typescript
// Old:
this.combatText.showDamage(e.x, e.y, finalDmg, 0xffffff);
// New:
this.combatText.showDamage(e.x, e.y, finalDmg, 0xffffff, undefined, undefined);
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: wire HUD dt to update, update combat text callers"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Verify HUD positioning is correct**

The key test: all HUD elements should be visible on screen. Previously elements below Y=1080 were clipped. Now everything is bottom-anchored within `HEIGHT - PANEL_H - BOTTOM_MARGIN` = 1080 - 100 - 6 = 974, so all elements below that are within the 1080px viewport.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "fix: final HUD rework adjustments"
```
