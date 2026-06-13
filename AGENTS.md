# TinyARPG — Agent Guide

## Project
Browser-based 2D top-down ARPG (PoE-inspired). TypeScript + PixiJS 7 + Vite 5. 1920×1080 canvas. 4 classes: Warrior, Ranger, Monk, Summoner.

## Commands
- `npm run dev` — Vite dev server (HMR)
- `npx tsc --noEmit` — type-check only
- `npm run build` — `tsc && vite build`
- `npm run deploy` — alias for `npm run build` (CI pushes to GitHub Pages on master)
- Live: https://eloheavenjoe-cyber.github.io/TinyARPG/

## Architecture

```
src/
  main.ts                     Entry — PixiJS Application, boots Game
  core/
    Game.ts                   State machine (Menu→Picking→Playing→Death), game loop, input routing, skill dispatch, VFX, portals, urns, minions, soul system, world map
    InputManager.ts           WASD + mouse, left/right-click consume, canvas-coordinate conversion
    Logger.ts                 Categorized logging ([Input] [Combat] [Skill] [UI] [System]…)
    SkillDefs.ts              All Warrior + Ranger + Monk skill data (main + support)
    SummonerSkillDefs.ts      All Summoner skill data
    SkillManager.ts           Cooldowns, buffs, stance system (Monk), slot management, class-aware
    SkillSubTree.ts           Per-skill sub-tree nodes, keystones, mutations
    PassiveTree.ts            ~40 node passive tree (Might/Cunning/Sorcery), 3 keystones
    StatSystem.ts             Computes final stats from base + attributes + tree + equipment + warps
    ItemDefs.ts               Item bases (7), 25 affix types × 3 tiers, 9 unique items, Slot/Rarity types
    ItemGenerator.ts          Item/orb/jewel generation, generateItemName(), warp system
    SaveManager.ts            localStorage save/load, 5 slots, stash persistence, SerializedItem
    VendorManager.ts          Vendor stock generation + pricing
    ZoneConfig.ts             Zone definitions, biome data, RoomTemplate, PortalMarker
    ZoneRegistry.ts           Breaks circular dependency — maps zone IDs to templates
    ZoneManager.ts            Zone state, transitions, enemy spawning, endless scaling, boss gating
    WorldMapData.ts           WORLD_MAP_REGISTRY (9 zones), ZONE_PORTAL_POSITIONS, discovered state
    MonsterMods.ts            Enemy rarity mods (magic/rare affixes)
    CurseMods.ts              14 urn curses across 3 tiers, weighted selection
    UrnConfig.ts              5 urn types, rarity/spawn config
    TileConfigs.ts            Tile interface + registry + texture cache for biome spritesheets
    Camera.ts                 Player-following camera with smooth lerp, edge clamping
  entities/
    Player.ts                 Movement, health/mana, leveling, inventory, equipment, warps, curses, rolling, channeling, calcDamage()
    Enemy.ts                  4 types (Grunt/Archer/Juggernaut/Cultist), kiting AI, rarity mods, animated sprites, urn spawn tracking
    Boss.ts                   Multi-phase bosses (Golem/Reaper), telegraphs, attack patterns, 4 HP phases
    Minion.ts                 Summoner minions (warrior/mage/spectre), formation system, idle clumping fix
    Projectile.ts             Player + hostile projectiles, pierce/bounce/chaining, hit tracking
    CombatText.ts             Floating damage numbers (rise + fade)
    ItemDrop.ts               Ground loot nameplates (gold/items/orbs/jewels), rarity colors, walk-over + click pickup
    Chest.ts                  Interactable chests with open/close, loot drops
    Breakable.ts              Destructible pots/barrels
    SecretBush.ts             Tutorial secret bush with wobble/revert
    CursedUrn.ts              Urn entities: procedural graphics, info panel, smoke VFX, state machine (idle→active→cleared)
  world/
    Room.ts                   6400×3584 room, wall collision, TilingSprite floors, portals, buildings, NPCs, stone roads
    RoomTemplates.ts          17 room templates (hub, tutorial, story zones, arena, dungeon, crypt, dev)
    RoomDecorator.ts          Procedural decoration (trees, rocks, bushes, grass), tile-texture-aware
  rendering/
    Sprites.ts                Programmatic pixel-art textures (player, enemies, floor, wall, buildings)
    SpriteAnimator.ts         Sprite sheet loader, frame slicer, animation manager (all 4 classes + all enemy types + NPCs)
    TileLoader.ts             PNG+JSON spritesheet loader
    ItemIcons.ts              Item icon texture loading
  ui/
    MainMenu.ts               Title screen
    ClassSelect.ts            Class picker (Warrior/Ranger/Monk/Summoner)
    AbilitySelect.ts          Main ability picker (4 per class)
    HUD.ts                    Health/mana bars (bottom-left), gold, level, XP bar, buff icons
    SkillBar.ts               6-slot skill bar (bottom-center), keybinds 1-6, cooldown overlays
    CharacterScreen.ts        Full-screen stats + abilities tabs (C key)
    InventoryScreen.ts        Full-screen inventory, paper doll, socketing, drag-drop jewels, crafting, tooltips
    PassiveTreeScreen.ts      Full-screen passive tree overlay (P key)
    SkillSubTreeScreen.ts     Per-skill sub-tree overlay (K key)
    DeathScreen.ts            Death overlay with restart
    EscapeMenu.ts             In-game menu (Resume/Save/Settings/Save & Exit)
    SaveSlotScreen.ts         5-slot save/load picker
    SettingsPlaceholder.ts    Visual-only settings panels
    SoulVaultScreen.ts        Summoner soul vault overlay (V key), 10 slots, deploy/return spectres
    VendorScreen.ts           Vendor buy/sell overlay
    StashScreen.ts            Stash deposit/withdraw (4 tabs)
    Tooltip.ts                Shared item/orb/jewel tooltip builder with corruption zone styling
    BossHpBar.ts              Screen-space boss HP bar
    Minimap.ts                Bottom-right minimap (walls, player, enemies, portals)
    WorldMapScreen.ts         Full-screen parchment world map overlay with node/connection rendering
    DiscoveryNotification.ts  Slide-in discovery toast (top-right)
    TutorialScreen.ts         Tutorial step overlay
    HubTip.ts                 Hub town tip popup
    DeveloperConsole.ts       DOM-based dev console (backtick), commands, autocomplete
```

## Architecture Rules

- **Game.ts** is the orchestrator — owns all state, runs the game loop, routes input to systems
- **Entities** own their position, sprite, and per-frame update logic
- **UI components** are screen-space containers added/removed from `app.stage`
- **VFX** are temporary Graphics objects with a draw function and lifetime — managed via `Game.addVfx()`
- **All game objects** (room, entities, combat text, VFX, items, urns, souls) live inside `gameContainer`
- **HUD, skill bar, menus, overlays** live directly on `app.stage` in screen coordinates
- **Camera** offsets `gameContainer.x/y` to follow player; use `toLocal()` for mouse→world conversion
- **Logger** uses categories: `input`, `movement`, `collision`, `entity`, `combat`, `ui`, `game`, `system`, `skill`

## Key Constants
- Canvas: 1920×1080
- Room: 6400×3584 (32px walls around perimeter, full walkable area)
- Player hitbox: 28×28 (center-positioned)
- Skill bar: 6 slots, bottom-center (Y=1030)
- HUD: bottom-left (X=18, Y=1030)
- Minimap: bottom-right (1760×240)
- Boss HP bar: top-center (Y=60)
- Portal scroll recall portal: 100px interaction radius

## Skill System
- `SkillDef` data objects (id, name, manaCost, cooldown, damageMult, effectType, subTreeId)
- `SkillManager` owns cooldowns, active buffs, slot management, stance (Monk)
- effectTypes: `cone`, `single`, `aoe_self`, `dash`, `buff`, `debuff`, `passive`, `projectile`, `projectile_spread`, `projectile_pierce`, `aoe_target`, `summon`, `channel`
- 4 classes: Warrior (melee), Ranger (projectile), Monk (stances + techniques), Summoner (minions + souls)
- Monk: 6 fixed slots, 3 stances (Tiger/Tortoise/Crane), Meditate channel, Tiger Uppercut knockback
- Summoner: raise_skeleton (max 4), summon_mage (max 3), soul capture → spectre (max 1), soul vault (10 capacity)
- Skill activation: `Player.useMainAbility()` (slot 1) and `Game.useSupportSkill()` (slots 2-6)
- Sub-tree system: per-skill passive nodes via `SkillSubTree`, allocated with `SkillSubTreeScreen`

## Item System
- `GeneratedItem` interface: base, rarity, affixes[], ilvl, levelReq, sockets[], warped/warpImplicit/warpOutcome
- Names derived via `generateItemName(item)` — pure function, no stored computedName
- Rarity: normal (50%), magic (30%), rare (15%), unique (5%) — weighted by magic find
- 7 bases: Sword, Bow, Body, Helmet, Boots, Ring, Amulet + Jewel (socketable)
- 9 unique items with skill-altering effects (life leech, culling strike, explode, fortify, skill AOE)
- Orbs: Mutation, Growth, Ascendance, Empowerment, Flux, Purification, Warp Stone
- Warp system: items gain `warped` flag, `warpImplicit`, `warpOutcome`; corruption zone in tooltips
- Equipment slots: weapon, body, helmet, boots, ring, ring2, amulet

## Zone System
- ZoneConfig: per-zone biome, enemy pool, room count, templates, boss config, portal position
- ZoneManager: state machine (transitionTo, advanceRoom, completedZoneIds), endless scaling
- 9 zones: hub, tutorial, forest, desert, ice, secret_crypt, endless_arena, endless_dungeon, dev
- World map: discovery-based portal unlocking, parchment map overlay, travel confirmation

## Style Guide
- No JSDoc comments. No inline comments unless WHY is non-obvious.
- Prefer direct PixiJS API (no wrappers).
- Graphics for procedural shapes, AnimatedSprite for entities.
- Animation: use `dt` (PixiJS ticker delta), not `requestAnimationFrame`.
- Damage numbers use `CombatTextManager.showDamage()`. Visual effects use `Game.addVfx()`.
- Type-check with `npx tsc --noEmit` before reporting done. Zero `as any` in Game.ts.

## Sub-Agent Workflow
1. Orchestrator defines task scope, constraints, and context
2. Sub-agent implements in a focused pass (max 5 files per agent)
3. Sub-agent runs `npx tsc --noEmit` before reporting done
4. Orchestrator verifies integration, then commits and deploys

## Notes
