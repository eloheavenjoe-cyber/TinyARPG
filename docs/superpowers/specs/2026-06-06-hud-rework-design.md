# HUD Rework Design

**Date:** 2026-06-06
**Status:** Approved

## Problem

Current HUD elements are positioned at fixed Y coordinates below the screen bottom (Y=1030+ on a 1080px canvas). Players can see the full HP bar, most of the MP bar, but gold, level, XP, and the bottom of the HUD panel are clipped/off-screen. The HUD also lacks visual polish: flat filled-rect bars, no smooth animations, missing mana label, no combat feedback indicators, and no visual cohesion between HUD and skill bar.

## Solutions

### 1. Bottom-Anchored Unified Bottom Bar

Replace separate HUD panel and skill bar with a single cohesive bottom bar that anchors to the screen bottom edge. This fixes the clipping issue and creates visual unity.

**Layout (full-width, bottom-anchored):**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Zone Name                                           │
│                      (serif 22px gold, top-center)                              │
│                                                                                 │
│                     [game world]                                                │
│                                                                                 │
├────────────────────┬────────────────────────────────┼──────────────────────────┤
│  HP bar  85/100    │  [1] [2] [3] [4] [5] [6]     │  Gold: 123               │
│  MP bar  42/50     │  (skill bar, centered)        │  Lv 5 — XP ███░░ 60%    │
│                    │                               │  [buff] [buff] [buff]    │
├────────────────────┴────────────────────────────────┴──────────────────────────┤
│                     Unified Panel (bottom-anchored)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Panel styling:**
- Dark metal background (0x1a1a28), 1px gold trim (0x8a7a3a), rounded top corners (6px)
- Subtle inner dividers between sections
- Consistent 4px padding on all sides

### 2. Ornate Horizontal Bars (HP/MP)

**Visual:**
- Metallic dark-iron frame with thin gold border
- Gradient fill: deep crimson→bright red for HP (hue shifts with %, not discrete thresholds)
- Gradient fill: deep sapphire→bright blue for MP
- Smooth lerp: displayed value chases actual value at a rate of 0.15 per frame (≈0.25s to full)
- Low HP (<30%) pulse: alpha oscillation via `Math.sin(time * 0.15)` for subtle heartbeat effect
- Numeric label centered: `"85 / 100"` in white with dark shadow (fontSize 11)

### 3. Skill Bar Rework

**Restyled slots:**
- Same ornate frame treatment: dark iron bg, gold trim line
- Skill name: centered, white, bold, fontSize 11
- Hotkey: top-left corner, dim gold, fontSize 10

**Cooldown visual:**
- Animated radial sweep (pie-slice arc) instead of static black overlay
- Numeric cooldown countdown in center of slot (white, fontSize 14, bold)
- Ready-glow: brief pulse animation when cooldown finishes

### 4. Enemy Nameplates

**Shown when:** enemy is aggroed or has taken damage. Not all enemies at all times.

```
         ┌─────────────────┐
         │  ████████░░░░   │  ← HP bar: green→yellow→orange→red by %
         │  Grunt          │  ← Name: white, bold, centered, 10px
         │  Hasted         │  ← Mod names: colored by rarity
         │  Goliath        │     (blue=magic, yellow=rare)
         └─────────────────┘
```

- HP bar width scales by enemy size (Juggernaut=72px, Grunt=48px, Cultist=32px)
- HP bar height: 4px, simple fill with no decorative frame
- Name below bar, white bold, fontSize 10
- Mod names below name, one per line, fontSize 9
- No "Magic:" / "Rare:" prefix labels — just color the mod name text

### 5. Floating Combat Text Improvements

- Larger font (12px minimum)
- Rarity-colored text: normal=white, magic=blue, rare=yellow, unique=orange
- Damage-type tint on top of rarity: cold=+blue hue shift, lightning=+yellow hue shift
- Font size scales with damage amount (bigger hits = slightly larger text, capped at 18px)

### 6. Minimap Reposition

- Move from bottom-right to top-right: (~1720, 10)
- Same size (200×112px), same rendering
- Add subtle fade-in/out (200ms) on zone transition

### 7. Zone Name Styling

- Current: monospace 18px gray at (960, 10)
- New: serif/bold font, 22px, gold/bronze color (#ddaa55), dark stroke shadow
- Still centered at (960, 6), anchor (0.5, 0)

### 8. Buff/Debuff Indicators

Small gem/diamond icons in the right panel section:
- Each active buff: colored diamond with remaining duration (e.g., `◆ Fortify 2.4s`)
- Debuffs: diamond with red border
- Max 4 visible (overflow hidden)
- Colors: Fortify=blue, Battle Rage=red, Eagle Eye=green, etc.

## Files Changed

| File | Change |
|---|---|
| `src/ui/HUD.ts` | Major rewrite: bottom-anchored, ornate bars, unified panel, buff indicators, new layout |
| `src/ui/SkillBar.ts` | Rework: ornate slots, radial cooldown, numeric countdown, ready-pulse |
| `src/ui/Minimap.ts` | Move to top-right, add fade animation |
| `src/entities/Enemy.ts` | Add nameplate rendering (HP bar, name, mod names) |
| `src/core/Game.ts` | Adjust zone name styling, wire any new callbacks |
| `src/entities/CombatText.ts` | Improved floating combat text (larger, colored, tinted) |

## Architecture

- `Enemy.ts` owns nameplate rendering (draws its own HP bar + labels each frame)
- `HUD.ts` owns the unified bottom bar: left section (HP/MP), center section (skill bar delegation), right section (gold/XP/buffs)
- `SkillBar.ts` continues to own 6-slot rendering but restyled
- `Minimap.ts` position change only
- All bars use the same bottom-anchored positioning logic
