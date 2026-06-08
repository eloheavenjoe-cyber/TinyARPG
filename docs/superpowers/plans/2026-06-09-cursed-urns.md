# Cursed Urns Implementation Plan

> **For agentic workers:** This plan executed inline. Tasks use checkbox (`- [ ]`) for tracking.

**Goal:** Add Cursed Urn league mechanic — large interactive containers with curses and valuable loot.

**Architecture:** New `CursedUrn` entity with procedural Graphics + world-space panel. Curse system on `Player` as tracked debuffs. Game.ts orchestrates spawning, interaction, currency, and loot. Five urn types, three rarity tiers, 14 curses across three severity tiers.

**Tech Stack:** TypeScript + PixiJS 7 + Vite 5

---

### Task 1: Curse Definitions (CurseMods.ts)

**Files:**
- Create: `src/core/CurseMods.ts`

- [ ] **Step 1: Define types and curse pool**

```typescript
export type CurseTier = 1 | 2 | 3;

export interface CurseDef {
  id: string;
  name: string;
  tier: CurseTier;
  weight: number;
  duration: number; // seconds
  description: string;
  statEffect: string; // key into stat system or special flag
  statValue: number;
}

export interface CurseInstance {
  def: CurseDef;
  remaining: number; // seconds remaining
}
```

- [ ] **Step 2: Define all 14 curses**

```typescript
export const CURSE_POOL: CurseDef[] = [
  // Tier 1 — Mild
  { id: 'sluggish', name: 'Sluggish', tier: 1, weight: 4, duration: 25, description: '30% reduced move speed', statEffect: 'moveSpeedPct', statValue: -30 },
  { id: 'drained', name: 'Drained', tier: 1, weight: 4, duration: 30, description: '25% reduced mana regen', statEffect: 'manaRegenPct', statValue: -25 },
  { id: 'rattled', name: 'Rattled', tier: 1, weight: 4, duration: 30, description: '20% reduced dodge chance', statEffect: 'dodgePct', statValue: -20 },
  { id: 'blurred', name: 'Blurred', tier: 1, weight: 3, duration: 20, description: 'Reduced visibility radius', statEffect: 'visibilityRadius', statValue: -100 },

  // Tier 2 — Moderate
  { id: 'bleeding', name: 'Bleeding', tier: 2, weight: 3, duration: 20, description: 'Lose 5 life per second', statEffect: 'bleedDps', statValue: 5 },
  { id: 'weakened', name: 'Weakened', tier: 2, weight: 4, duration: 25, description: '35% reduced damage dealt', statEffect: 'damageDealtMult', statValue: -35 },
  { id: 'brittle', name: 'Brittle', tier: 2, weight: 4, duration: 20, description: '40% increased damage taken', statEffect: 'damageTakenMult', statValue: 40 },
  { id: 'flask_cursed', name: 'Flask-Cursed', tier: 2, weight: 2, duration: 15, description: 'Cannot use flasks', statEffect: 'flaskDisabled', statValue: 1 },
  { id: 'chilled', name: 'Chilled', tier: 2, weight: 3, duration: 15, description: '50% reduced attack/cast speed', statEffect: 'attackSpeedPct', statValue: -50 },

  // Tier 3 — Severe
  { id: 'no_regen', name: 'No Regeneration', tier: 3, weight: 3, duration: 30, description: 'Cannot regen life or mana', statEffect: 'regenDisabled', statValue: 1 },
  { id: 'marked', name: 'Marked', tier: 3, weight: 3, duration: 0, description: 'Enemies alerted and rush you', statEffect: 'marked', statValue: 1 },
  { id: 'shattered_flask', name: 'Shattered Flask', tier: 3, weight: 2, duration: 0, description: 'All flask charges set to zero', statEffect: 'shatterFlask', statValue: 1 },
  { id: 'soul_taxed', name: 'Soul Taxed', tier: 3, weight: 3, duration: 0, description: 'Lose 20% current life instantly', statEffect: 'soulTax', statValue: 20 },
  { id: 'hexed', name: 'Hexed', tier: 3, weight: 4, duration: 25, description: 'All resistances reduced by 30%', statEffect: 'allResistancePct', statValue: -30 },
];
```

- [ ] **Step 3: Implement rollCurses**

```typescript
export function rollCurses(count: number, minTier: CurseTier, maxTier: CurseTier, forceTier3?: boolean): CurseDef[] {
  let pool = CURSE_POOL.filter(c => c.tier >= minTier && c.tier <= maxTier);
  if (forceTier3) {
    const t3pool = CURSE_POOL.filter(c => c.tier === 3);
    const forced = t3pool[Math.floor(Math.random() * t3pool.length)];
    pool = pool.filter(c => c.id !== forced.id);
    const rest = weightedSelect(pool, count - 1);
    return [forced, ...rest];
  }
  return weightedSelect(pool, count);
}

function weightedSelect(pool: CurseDef[], count: number): CurseDef[] {
  const available = [...pool];
  const result: CurseDef[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * totalWeight;
    for (let j = 0; j < available.length; j++) {
      r -= available[j].weight;
      if (r <= 0) {
        result.push(available.splice(j, 1)[0]);
        break;
      }
    }
  }
  return result;
}
```

### Task 2: Urn Configuration (UrnConfig.ts)

**Files:**
- Create: `src/core/UrnConfig.ts`

- [ ] **Step 1: Define UrnTypeConfig and URN_TYPES**

```typescript
import { Rarity } from './ItemDefs';

export interface UrnTypeConfig {
  id: string;
  name: string;
  lootCategory: string;
  bgColor: number;
  accentColor: number;
  shape: 'urn' | 'coffer' | 'casket' | 'vessel' | 'vault';
}

export const URN_TYPES: UrnTypeConfig[] = [
  { id: 'reliquary', name: 'Reliquary of Arms', lootCategory: 'Weapons & Armour', bgColor: 0x5a5a6e, accentColor: 0x888899, shape: 'urn' },
  { id: 'miser', name: "The Miser's Coffer", lootCategory: 'Currency & Crafting', bgColor: 0x8a7a3a, accentColor: 0xccbb44, shape: 'coffer' },
  { id: 'adornments', name: 'Casket of Adornments', lootCategory: 'Rings, Amulets & Jewellery', bgColor: 0x4a2a5a, accentColor: 0xaa44cc, shape: 'casket' },
  { id: 'alchemist', name: "The Alchemist's Vessel", lootCategory: 'Flasks & Consumables', bgColor: 0x3a5a3a, accentColor: 0x66cc66, shape: 'vessel' },
  { id: 'forgotten', name: 'Vault of the Forgotten', lootCategory: 'Mixed Rare Items', bgColor: 0x5a4a3a, accentColor: 0xccccaa, shape: 'vault' },
];

export interface UrnSpawnConfig {
  minPerZone: number;
  maxPerZone: number;
  maxRarePerZone: number;
  spawnWeights: Record<Rarity, number>;
}

export const URN_SPAWN_CONFIG: UrnSpawnConfig = {
  minPerZone: 1,
  maxPerZone: 2,
  maxRarePerZone: 1,
  spawnWeights: { normal: 60, magic: 30, rare: 10, unique: 0 },
};

export function rollUrnType(): UrnTypeConfig {
  return URN_TYPES[Math.floor(Math.random() * URN_TYPES.length)];
}

export function rollUrnRarity(): Rarity {
  const r = Math.random() * 100;
  if (r < 60) return 'normal';
  if (r < 90) return 'magic';
  return 'rare';
}

export function getUrnCurseCount(rarity: Rarity): number {
  switch (rarity) {
    case 'normal': return 1;
    case 'magic': return 2;
    case 'rare': return Math.random() < 0.5 ? 3 : 4;
    default: return 1;
  }
}
```

### Task 3: CursedUrn Entity (CursedUrn.ts)

**Files:**
- Create: `src/entities/CursedUrn.ts`

This is the main entity. It renders a large procedural urn with type-specific visuals, a world-space info panel, proximity detection, open animation, and currency upgrade.

- [ ] **Step 1: Define the CursedUrn class skeleton**

```typescript
import * as PIXI from 'pixi.js';
import { URN_TYPES, UrnTypeConfig, rollUrnType, rollUrnRarity, getUrnCurseCount } from '../core/UrnConfig';
import { CurrencyDef, CurrencyInstance, rollCurses } from '../core/CurseMods';
import { Rarity } from '../core/ItemDefs';

export type UrnState = 'idle' | 'opened';

export class CursedUrn {
  x: number;
  y: number;
  type: UrnTypeConfig;
  rarity: Rarity;
  curses: CurseDef[];
  state: UrnState = 'idle';
  container: PIXI.Container;
  isOpen = false;

  private body: PIXI.Graphics;
  private lid: PIXI.Graphics;
  private glow: PIXI.Graphics;
  private panel: PIXI.Container;
  private panelAlpha = 0;
  private panelTargetAlpha = 0;
  private panelFadeTimer = 0;
  private smokeTimer = 0;
  private interactLabel: PIXI.Text;
  private rareName?: string;
  private wasInRange = false;

  constructor(x: number, y: number, opts?: { type?: UrnTypeConfig; rarity?: Rarity; curses?: CurseDef[]; rareName?: string; preOpened?: boolean }) {
    this.x = x;
    this.y = y;
    this.type = opts?.type ?? rollUrnType();
    this.rarity = opts?.rarity ?? rollUrnRarity();
    this.curses = opts?.curses ?? this.generateCurses();
    this.rareName = opts?.rareName;
    if (opts?.preOpened) {
      this.isOpen = true;
      this.state = 'opened';
    }
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.buildVisuals();
  }
```

- [ ] **Step 2: Implement buildVisuals() — procedural urn body, lid, glow**

```typescript
  private buildVisuals() {
    // Ground glow beneath urn
    this.glow = new PIXI.Graphics();
    this.glow.zIndex = 0;
    this.container.addChild(this.glow);

    // Body
    this.body = new PIXI.Graphics();
    this.body.zIndex = 1;
    this.container.addChild(this.body);

    // Lid
    this.lid = new PIXI.Graphics();
    this.lid.zIndex = 2;
    this.container.addChild(this.lid);

    this.drawBody();
    this.drawGlow();

    if (!this.isOpen) {
      this.drawLid();
    }

    // Interact label
    this.interactLabel = new PIXI.Text('Open [E]', new PIXI.TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#f0c060',
      stroke: '#000000', strokeThickness: 2,
    }));
    this.interactLabel.anchor.set(0.5, 1);
    this.interactLabel.y = -this.getHeight() / 2 - 4;
    this.interactLabel.visible = false;
    this.interactLabel.zIndex = 5;
    this.container.addChild(this.interactLabel);

    // Info panel (world-space, below urn)
    this.panel = new PIXI.Container();
    this.panel.y = this.getHeight() / 2 + 4;
    this.panel.alpha = 0;
    this.panel.visible = false;
    this.panel.zIndex = 5;
    this.container.addChild(this.panel);
    this.buildPanel();
  }
```

- [ ] **Step 3: Draw procedural urn shapes per type**

```typescript
  private getWidth(): number { return 60; }
  private getHeight(): number { return 72; }

  private drawBody() {
    const g = this.body;
    g.clear();
    const w = this.getWidth();
    const h = this.getHeight();
    const hw = w / 2;

    // Urn body shape depends on type
    switch (this.type.shape) {
      case 'urn':
        // Classic urn: wide belly, narrow neck
        g.beginFill(this.type.bgColor);
        // Belly (ellipse)
        g.drawEllipse(0, 8, hw, 24);
        // Neck (rectangle tapering up)
        g.drawRect(-hw * 0.3, -h / 2 + 6, hw * 0.6, 16);
        // Foot (rectangle at bottom)
        g.drawRect(-hw * 0.4, 28, hw * 0.8, 8);
        g.endFill();
        // Iron banding (accent lines)
        g.lineStyle(2, this.type.accentColor, 0.6);
        g.moveTo(-hw, 0); g.lineTo(hw, 0);
        g.moveTo(-hw * 0.4, 28); g.lineTo(hw * 0.4, 28);
        // Sword motif
        g.lineStyle(1, this.type.accentColor, 0.4);
        g.moveTo(0, -16); g.lineTo(0, -4);
        g.moveTo(-6, -12); g.lineTo(6, -12);
        break;

      case 'coffer':
        // Bulging belly coffer
        g.beginFill(this.type.bgColor);
        g.drawRoundedRect(-hw, -h / 2, w, h, 6);
        g.endFill();
        // Coin reliefs
        g.lineStyle(1, this.type.accentColor, 0.3);
        for (let i = 0; i < 5; i++) {
          const cy = -20 + i * 12;
          g.drawCircle(-8, cy, 5);
          g.drawCircle(8, cy, 5);
        }
        break;

      case 'casket':
        // Ornate casket with gem inlays
        g.beginFill(this.type.bgColor);
        g.drawRoundedRect(-hw, -h / 2, w, h, 4);
        g.endFill();
        // Gem inlays
        for (let i = 0; i < 3; i++) {
          const cy = -12 + i * 14;
          g.beginFill(this.type.accentColor);
          g.drawRoundedRect(-12, cy, 8, 8, 2);
          g.drawRoundedRect(4, cy, 8, 8, 2);
          g.endFill();
        }
        break;

      case 'vessel':
        // Glass vessel with bubbling top
        g.beginFill(this.type.bgColor, 0.7);
        g.drawEllipse(0, 4, hw, 22);
        g.drawRect(-hw * 0.25, -h / 2 + 4, hw * 0.5, 14);
        g.endFill();
        // Glass highlights
        g.lineStyle(1, 0xffffff, 0.15);
        g.moveTo(-hw * 0.3, -h / 2 + 8); g.lineTo(-hw * 0.3, 20);
        // Bubbles
        g.lineStyle(0);
        g.beginFill(this.type.accentColor, 0.4);
        g.drawCircle(-6, -10, 3);
        g.drawCircle(4, -6, 2);
        g.drawCircle(-2, -14, 2);
        g.endFill();
        break;

      case 'vault':
        // Bone white vault with runes
        g.beginFill(this.type.bgColor);
        g.drawRect(-hw, -h / 2, w, h);
        g.endFill();
        // Cracked surface lines
        g.lineStyle(1, 0x333333, 0.3);
        g.moveTo(-8, -h / 2); g.lineTo(-4, 0); g.lineTo(-12, h / 2);
        g.moveTo(6, -h / 2); g.lineTo(10, 10); g.lineTo(4, h / 2);
        // Rune carvings
        g.lineStyle(1, this.type.accentColor, 0.5);
        for (let i = 0; i < 3; i++) {
          const ry = -12 + i * 16;
          g.drawRect(-16, ry, 6, 8);
          g.drawRect(10, ry, 6, 8);
        }
        break;
    }

    // Rarity-colored border
    const rarityColors: Record<string, number> = { normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00, unique: 0xff6600 };
    g.lineStyle(3, rarityColors[this.rarity] || 0xffffff, 0.7);
    g.drawRoundedRect(-hw - 2, -h / 2 - 2, w + 4, h + 4, 4);
  }

  private drawLid() {
    const g = this.lid;
    g.clear();
    const hw = this.getWidth() / 2;
    // Lid: rectangular cap sitting on top of neck
    g.beginFill(this.type.bgColor, 0.9);
    g.drawRect(-hw * 0.35, -this.getHeight() / 2 - 4, hw * 0.7, 6);
    g.drawRect(-hw * 0.25, -this.getHeight() / 2 - 8, hw * 0.5, 4);
    g.endFill();
    // Lid knob
    g.beginFill(this.type.accentColor, 0.8);
    g.drawCircle(0, -this.getHeight() / 2 - 10, 3);
    g.endFill();
  }

  private drawGlow() {
    const g = this.glow;
    g.clear();
    const rarityColors: Record<string, number> = { normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00, unique: 0xff6600 };
    const c = rarityColors[this.rarity] || 0xffffff;
    // Soft ground glow
    g.beginFill(c, 0.08);
    g.drawEllipse(0, this.getHeight() / 2 + 4, 40, 10);
    g.endFill();
    g.beginFill(c, 0.04);
    g.drawEllipse(0, this.getHeight() / 2 + 4, 60, 16);
    g.endFill();
  }
```

- [ ] **Step 4: Build panel — rare name, loot category, curse mods**

```typescript
  private buildPanel() {
    this.panel.removeChildren();

    const rarityColors: Record<string, string> = { normal: '#ffffff', magic: '#4488ff', rare: '#ffcc00', unique: '#ff6600' };
    const rarityColor = rarityColors[this.rarity] || '#ffffff';

    let yOff = 0;

    // Rare name (only for rare urns)
    if (this.rareName) {
      const rareText = new PIXI.Text(this.rareName, new PIXI.TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 10, fontWeight: 'bold',
        fill: rarityColor, stroke: '#000000', strokeThickness: 2,
      }));
      rareText.anchor.set(0.5, 0);
      rareText.y = yOff;
      this.panel.addChild(rareText);
      yOff += 14;
    }

    // Urn name header
    const nameText = new PIXI.Text(this.type.name, new PIXI.TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 10, fontWeight: 'bold',
      fill: rarityColor, stroke: '#000000', strokeThickness: 2,
    }));
    nameText.anchor.set(0.5, 0);
    nameText.y = yOff;
    this.panel.addChild(nameText);
    yOff += 13;

    // Loot category
    const catText = new PIXI.Text(this.type.lootCategory, new PIXI.TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 9,
      fill: '#c8b060', stroke: '#000000', strokeThickness: 1,
    }));
    catText.anchor.set(0.5, 0);
    catText.y = yOff;
    this.panel.addChild(catText);
    yOff += 12;

    // Divider
    const divider = new PIXI.Graphics();
    divider.lineStyle(1, 0x666666, 0.5);
    divider.moveTo(-30, yOff);
    divider.lineTo(30, yOff);
    this.panel.addChild(divider);
    yOff += 4;

    // Curse mods
    for (const curse of this.curses) {
      const isT3 = curse.tier === 3;
      const modText = new PIXI.Text(`◈ ${curse.name}`, new PIXI.TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 9,
        fill: isT3 ? '#cc2200' : '#8b1a1a',
        stroke: '#000000', strokeThickness: 1,
      }));
      modText.anchor.set(0.5, 0);
      modText.y = yOff;
      modText.name = `curse_${curse.id}`;
      this.panel.addChild(modText);
      yOff += 11;
    }

    // Panel background (draw after to get total height)
    const bg = new PIXI.Graphics();
    // Ensure panel fills visible area
    ...
    this.panel.addChildAt(bg, 0);
  }
```

- [ ] **Step 5: Implement update() — proximity check, smoke animation, panel fade, tier 3 pulse**

```typescript
  update(dt: number, playerX: number, playerY: number) {
    const dist = Math.hypot(playerX - this.x, playerY - this.y);
    const inRange = dist < 150 && !this.isOpen;

    // Panel fade
    this.panelTargetAlpha = inRange ? 1 : 0;
    if (this.panelTargetAlpha > this.panelAlpha) {
      this.panelAlpha += dt * 0.005; // fade in over ~200ms
      if (this.panelAlpha > 1) this.panelAlpha = 1;
    } else if (this.panelTargetAlpha < this.panelAlpha) {
      this.panelAlpha -= dt * 0.003; // fade out over ~330ms
      if (this.panelAlpha < 0) this.panelAlpha = 0;
    }
    this.panel.visible = this.panelAlpha > 0;
    this.panel.alpha = this.panelAlpha;

    // Proximity flash (brightness pulse on first enter)
    if (inRange && !this.wasInRange) {
      this.wasInRange = true;
      // Body flash animation
    }
    if (!inRange) this.wasInRange = false;

    // Interact label
    this.interactLabel.visible = inRange && dist < 48;

    // Smoke animation (idle VFX)
    if (!this.isOpen) {
      this.smokeTimer += dt * 0.05;
      // Draw smoke particles as small circles above lid using VFX system
      // (VFX managed in Game.ts, not here - we expose getSmokeParticle())
    }

    // Tier 3 curse pulsing
    const now = Date.now();
    for (const curse of this.curses) {
      if (curse.tier === 3) {
        // ... (handled in Game.ts via setInterval on modText)
      }
    }
  }
```

- [ ] **Step 6: Implement open() — apply curses, spawn loot, animate**

```typescript
  open(onLoot: (x: number, y: number, urn: CursedUrn) => void): CurseDef[] {
    if (this.isOpen) return [];
    this.isOpen = true;
    this.state = 'opened';

    // Hide lid (animate flying upward in Game.ts)
    this.lid.visible = false;

    // Hide panel
    this.panel.visible = false;

    // Hide interact label
    this.interactLabel.visible = false;

    // Remove glow
    this.glow.clear();

    // Call loot callback
    onLoot(this.x, this.y, this);

    // Return curses to apply to player
    return this.curses;
  }

  private generateCurses(): CurseDef[] {
    const count = getUrnCurseCount(this.rarity);
    const minTier: CurseTier = this.rarity === 'normal' ? 1 : 1;
    const maxTier: CurseTier = this.rarity === 'normal' ? 2 : 3;
    return rollCurses(count, minTier, maxTier, this.rarity === 'rare');
  }

  serialize(): SerializedUrn {
    return {
      id: this.type.id,
      x: this.x,
      y: this.y,
      rarity: this.rarity,
      curseIds: this.curses.map(c => c.id),
      opened: this.isOpen,
      rareName: this.rareName,
    };
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

### Task 4: Player Curse Tracking (Player.ts)

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: Add curse fields to Player**

```typescript
// Near other state fields
private activeCurses: CurseInstance[] = [];
onCurseExpired?: (curseId: string) => void;
```

- [ ] **Step 2: Implement curse application/tick/expiry**

```typescript
  applyCurses(curses: CurseDef[]) {
    for (const def of curses) {
      this.activeCurses.push({ def, remaining: def.duration });
      this.applyCurseEffect(def);
    }
  }

  private applyCurseEffect(def: CurseDef) {
    switch (def.statEffect) {
      case 'moveSpeedPct':
        this.moveSpeedMult *= (1 + def.statValue / 100);
        break;
      case 'manaRegenPct':
        this.manaRegenMult *= (1 + def.statValue / 100);
        break;
      case 'dodgePct':
        this.dodgeMult *= (1 + def.statValue / 100);
        break;
      case 'damageDealtMult':
        this.damageDealtMult *= (1 + def.statValue / 100);
        break;
      case 'damageTakenMult':
        this.damageTakenMult *= (1 + def.statValue / 100);
        break;
      case 'attackSpeedPct':
        this.attackSpeedMult *= (1 + def.statValue / 100);
        break;
      case 'allResistancePct':
        this.allResistancePct += def.statValue;
        break;
      case 'bleedDps':
        // Apply DoT within update
        break;
      case 'flaskDisabled':
        this.flaskDisabled = true;
        break;
      case 'regenDisabled':
        this.regenDisabled = true;
        break;
      case 'soulTax':
        this.health = Math.max(1, this.health - Math.floor(this.health * def.statValue / 100));
        break;
      case 'shatterFlask':
        // Set all potion counts to 0
        break;
      case 'marked':
        // Set global flag that enemies read
        break;
    }
    this.recalcStats();
  }

  private revertCurseEffect(def: CurseDef) {
    // Reverse the application
    switch (def.statEffect) {
      case 'moveSpeedPct':
        this.moveSpeedMult /= (1 + def.statValue / 100);
        break;
      case 'manaRegenPct':
        this.manaRegenMult /= (1 + def.statValue / 100);
        break;
      // ... etc, reverse each effect
    }
    this.recalcStats();
  }

  updateCurses(dt: number, enemies: Enemy[]) {
    for (let i = this.activeCurses.length - 1; i >= 0; i--) {
      const curse = this.activeCurses[i];
      if (curse.remaining > 0) {
        curse.remaining -= dt / 60; // convert dt to seconds
        // Bleed DoT
        if (curse.def.statEffect === 'bleedDps' && curse.remaining > 0) {
          this.health -= curse.def.statValue / 60 * dt;
        }
        // Marked: aggro all enemies
        if (curse.def.statEffect === 'marked') {
          for (const e of enemies) {
            if (!e.alwaysAggro) e.alwaysAggro = true;
          }
        }
      }
      if (curse.remaining <= 0) {
        this.revertCurseEffect(curse.def);
        this.onCurseExpired?.(curse.def.id);
        this.activeCurses.splice(i, 1);
      }
    }
  }

  getActiveCurses(): CurseInstance[] {
    return this.activeCurses;
  }
```

### Task 5: Game.ts Integration

**Files:**
- Modify: `src/core/Game.ts`

- [ ] **Step 1: Add urn fields and spawn**

- [ ] **Step 2: Add per-frame urn update loop**

- [ ] **Step 3: Wire E-key interaction**

- [ ] **Step 4: Implement currency callbacks for urn targeting**

- [ ] **Step 5: Implement loot generation per category**

- [ ] **Step 6: Add urn open animation (lid burst, dark energy VFX)**

- [ ] **Step 7: Wire save/load serialization**

### Task 6: ZoneManager Integration (ZoneManager.ts)

**Files:**
- Modify: `src/core/ZoneManager.ts`

### Task 7: Save System (SaveManager.ts)

**Files:**
- Modify: `src/core/SaveManager.ts`

### Task 8: HUD Curse Display (HUD.ts)

**Files:**
- Modify: `src/ui/HUD.ts`
