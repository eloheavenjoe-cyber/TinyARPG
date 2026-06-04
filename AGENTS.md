# TinyARPG — Agent Guide

## Project Overview
Browser-based 2D top-down ARPG (PoE-inspired). TypeScript + PixiJS 7 + Vite 5. 1920x1080 canvas.

## Architecture

```
src/
  main.ts                    Entry — creates PixiJS Application, boots Game
  core/
    Game.ts                  State machine (Menu→Picking→Playing→Death), game loop, VFX
    InputManager.ts          WASD + mouse, canvas-coordinate conversion
    Logger.ts                Categorized logging ([Input] [Combat] [Skill] etc)
    SkillDefs.ts             All Warrior skill data (main + support skills)
    SkillManager.ts          Cooldowns, buffs, skill activation validation
  entities/
    Player.ts                Player with SkillManager, mana, buffs, skill attack routing
    Enemy.ts                 Chase AI, damage, hit flash
    CombatText.ts            Floating damage numbers
    ItemDrop.ts              Ground loot nameplates with rarity colors
  world/
    Room.ts                  1600×896 room, wall collision resolver
  rendering/
    Sprites.ts               Programmatic pixel-art textures (player, enemy, floor, wall)
  ui/
    MainMenu.ts              Title screen
    AbilitySelect.ts         Main ability picker (4 Warrior choices)
    DeathScreen.ts           Death overlay with restart
    HUD.ts                   Health/mana bars (bottom-left), gold counter
    SkillBar.ts              6-slot skill bar (bottom-center), keybinds 1-6
```

## Architecture Rules

- **Game.ts** is the orchestrator — owns all state, runs the game loop, routes input to systems
- **Entities** own their position, sprite, and per-frame update logic
- **UI components** are screen-space containers added/removed from `app.stage`
- **VFX** are temporary Graphics objects with a draw function and lifetime — managed in Game.ts
- **All game objects** (room, entities, combat text, VFX, items) live inside `gameContainer` (offset 160,92 from canvas)
- **HUD, skill bar, menus** live directly on `app.stage` in screen coordinates
- **Logger** uses categories: `input`, `movement`, `collision`, `entity`, `combat`, `ui`, `game`, `system`, `skill`

## Key Constants
- Canvas: 1920×1080
- Room: 1600×896, centered at offset (160, 92)
- Walls: 32px thick around room perimeter
- Player: 28×28 hitbox, center-positioned
- Skill bar: 6 slots, bottom-center (Y=1030)
- HUD: bottom-left (X=18, Y=1030)

## Skill System
- `SkillDef` data objects in SkillDefs.ts (id, name, manaCost, cooldown, damageMult, effectType)
- `SkillManager` owns cooldowns, active buffs, slot management
- effectTypes: `cone`, `single`, `aoe_self`, `dash`, `buff`, `debuff`, `passive`
- Buffs: `fortify`, `battle_rage`, `bloodlust`, `rally`, `ignore_pain`, `sunder_armor`
- Skill activation routes through `Player.useMainAbility()` and `Game.useSupportSkill()`

## Style Guide
- No JSDoc comments. No inline comments unless WHY is non-obvious.
- Prefer direct PixiJS API (no wrappers).
- Graphics for procedural shapes, Sprites for textures.
- Animation: use `dt` (PixiJS ticker delta), not `requestAnimationFrame`.
- Damage numbers use CombatTextManager. Visual effects use Game.addVfx().

## Sub-Agent Workflow
1. I (orchestrator) define the task scope, constraints, and context
2. Sub-agent implements in a focused pass (max 5 files per agent)
3. Sub-agent runs `npx tsc --noEmit` before reporting done
4. I verify integration, then commit and deploy

## Deployment
- `npm run deploy` builds + publishes to GitHub Pages
- Live at: https://eloheavenjoe-cyber.github.io/TinyARPG/
