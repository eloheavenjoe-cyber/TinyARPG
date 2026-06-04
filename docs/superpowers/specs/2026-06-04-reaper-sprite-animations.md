# Reaper Sprite Sheet Animations

## Overview
Replace the programmatic reaper sprite with animated sprite sheets. The reaper boss gets idle, attack, death, and summon animations from multi-row PNG sprite sheets.

## Sprite Sheets

User provides four PNGs placed in `public/sprites/reaper/`:

| Anim | File | Dimensions | Frame W×H | Cols | Total Frames |
|------|------|-----------|-----------|------|-------------|
| idle | idle2.png | 400×200 | 100×100 | 4 | 8 |
| attack | attacking.png | 600×300 | 100×100 | 6 | 14 |
| death | death.png | 1000×200 | 125×100 | 8 | 10 |
| summon | summon.png | 400×200 | 100×100 | 4 | 5 |

No walk animation — reaper floats/teleports.

## Changes

### SpriteAnimator.ts
- Add `loadMultiRowSheet(url, frameW, frameH, totalFrames, cols)` — loads a PNG, slices left-to-right row-by-row. Partial final rows produce fewer frames than `cols`; the function stops at `totalFrames`.
- Add `ReaperAnimName = 'idle' | 'attack' | 'death' | 'summon'`
- Add `reaperFrames: Record<ReaperAnimName, Texture[]>`
- Add `loadReaperAnimations()` — loads all 4 sheets using `loadMultiRowSheet`, then resolves any pending reaper sprites
- Add `createReaperSprite()` — returns `AnimatedSprite`, registers as pending if not yet loaded
- Add `playReaperAnimation(sprite, name, loop?)` — swaps textures and plays

### Boss.ts
- Import `createReaperSprite`, `playReaperAnimation`, `ReaperAnimName` from SpriteAnimator
- In constructor, if `bossId === 'reaper'`: `this.sprite = createReaperSprite()` instead of `new Sprite(cfg.sprite)`
- Add `playAnim(name: ReaperAnimName, loop = true)` method
- Call `playAnim('idle')` after construction
- Call `playAnim('attack', false)` during attack telegraph execution
- Call `playAnim('death', false)` on death
- Call `playAnim('summon', false)` when spawning cultists
- `sprite` field remains typed as `Sprite` (AnimatedSprite extends Sprite)

### main.ts
- Import `loadReaperAnimations`
- Add `await loadReaperAnimations()` after other animation loads in bootstrap

## Loading Sequence
1. Player boots game
2. `bootstrap()` calls `loadReaperAnimations()` — fetches 4 PNGs, builds frame textures
3. Reaper boss is created → `createReaperSprite()` now has frames available immediately
4. If not yet loaded, sprite renders as a pending placeholder until frames arrive

## Edge Cases
- If a PNG fails to load, log a warning and use a fallback colored rectangle (same pattern as warrior/ranger)
- Golem is untouched — keeps its programmatic sprite
- Reaper hitbox stays 80×80 regardless of animation frame size
