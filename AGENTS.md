# TinyARPG — Agent Guide

## Project
Browser-based 2D top-down ARPG (PoE-inspired). TypeScript + PixiJS **7** + Vite 5. 1920×1080 canvas. 4 classes: Warrior, Ranger, Monk, Summoner.

> **PixiJS version is 7, not 8.** APIs differ significantly. Never use v8 syntax (e.g. no `new Application({ canvas })`; use `new Application({ view })`).

---

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npx tsc --noEmit` | Type-check only — **run before every "done" report** |
| `npm run build` | `tsc && vite build` |
| `npm run deploy` | Alias for `npm run build` (CI → GitHub Pages on master) |

Live: https://eloheavenjoe-cyber.github.io/TinyARPG/

---

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
    WorldMapData.ts           WORLD_MAP_REGISTRY (10 zones), ZONE_PORTAL_POSITIONS, discovered state
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

---

## Architecture Rules
- **Game.ts** is the orchestrator — owns all state, runs the game loop, routes input to systems
- **Entities** own their position, sprite, and per-frame update logic
- **UI components** are screen-space containers added/removed from `app.stage`
- **VFX** are temporary Graphics objects with a draw function and lifetime — managed via `Game.addVfx()`
- **All game objects** (room, entities, combat text, VFX, items, urns, souls) live inside `gameContainer`
- **HUD, skill bar, menus, overlays** live directly on `app.stage` in screen coordinates
- **Camera** offsets `gameContainer.x/y` to follow player; use `toLocal()` for mouse→world conversion
- **Logger** uses categories: `input`, `movement`, `collision`, `entity`, `combat`, `ui`, `game`, `system`, `skill`
- **ZoneRegistry** exists solely to break the circular import between ZoneConfig ↔ ZoneManager — never collapse them

---

## Key Constants
- Canvas: 1920×1080
- Room: 6400×3584 (32px walls around perimeter, full walkable area)
- Player hitbox: 28×28 (center-positioned)
- Skill bar: 6 slots, bottom-center (Y=1030)
- HUD: bottom-left (X=18, Y=1030)
- Minimap: bottom-right (1760×240)
- Boss HP bar: top-center (Y=60)
- Portal scroll recall portal: 100px interaction radius

---

## Skill System
- `SkillDef` data objects (id, name, manaCost, cooldown, damageMult, effectType, subTreeId)
- `SkillManager` owns cooldowns, active buffs, slot management, stance (Monk)
- effectTypes: `cone`, `single`, `aoe_self`, `dash`, `buff`, `debuff`, `passive`, `projectile`, `projectile_spread`, `projectile_pierce`, `aoe_target`, `summon`, `channel`
- 4 classes: Warrior (melee), Ranger (projectile), Monk (stances + techniques), Summoner (minions + souls)
- Monk: 6 fixed slots, 3 stances (Tiger/Tortoise/Crane), Meditate channel, Tiger Uppercut knockback
- Summoner: raise_skeleton (max 4), summon_mage (max 3), soul capture → spectre (max 1), soul vault (10 capacity)
- Skill activation: `Player.useMainAbility()` (slot 1) and `Game.useSupportSkill()` (slots 2-6)
- Sub-tree system: per-skill passive nodes via `SkillSubTree`, allocated with `SkillSubTreeScreen`

---

## Item System
- `GeneratedItem` interface: base, rarity, affixes[], ilvl, levelReq, sockets[], warped/warpImplicit/warpOutcome
- Names derived via `generateItemName(item)` — pure function, **no stored computedName field**
- Rarity: normal (50%), magic (30%), rare (15%), unique (5%) — weighted by magic find
- 7 bases: Sword, Bow, Body, Helmet, Boots, Ring, Amulet + Jewel (socketable)
- 9 unique items with skill-altering effects (life leech, culling strike, explode, fortify, skill AOE)
- Orbs: Mutation, Growth, Ascendance, Empowerment, Flux, Purification, Warp Stone
- Warp system: items gain `warped` flag, `warpImplicit`, `warpOutcome`; corruption zone in tooltips
- Equipment slots: weapon, body, helmet, boots, ring, ring2, amulet
- **Serialization:** items saved as `SerializedItem` via `SaveManager` — any new fields on `GeneratedItem` need corresponding save/load handling

---

## Zone System
- ZoneConfig: per-zone biome, enemy pool, room count, templates, boss config, portal position
- ZoneManager: state machine (transitionTo, advanceRoom, completedZoneIds), endless scaling
- 10 zones: hub, tutorial, forest, desert, ice, volcanic_depths, secret_crypt, endless_arena, endless_dungeon, dev
- World map: discovery-based portal unlocking, parchment map overlay, travel confirmation
- **Adding a new zone requires touching:** ZoneConfig.ts, ZoneRegistry.ts, WorldMapData.ts (registry + portal positions)

---

## Style Guide
- No JSDoc comments. No inline comments unless WHY is non-obvious.
- Prefer direct PixiJS API (no wrappers).
- Graphics for procedural shapes, AnimatedSprite for entities.
- Animation: use `dt` (PixiJS ticker delta), **not** `requestAnimationFrame`.
- Damage numbers use `CombatTextManager.showDamage()`. Visual effects use `Game.addVfx()`.
- Type-check with `npx tsc --noEmit` before reporting done. Zero `as any` in Game.ts.

---

## Constraints (Hard Rules)
These are non-negotiable. Do not violate these regardless of how a task is scoped:

1. **Never introduce `as any` in Game.ts.** Use proper union types or type guards.
2. **Never bypass ZoneRegistry.** Zone IDs must be registered there; direct imports between ZoneConfig and ZoneManager create circular deps.
3. **Never store computed display state on data objects.** `generateItemName()` is pure — don't add a `displayName` or `computedName` field to `GeneratedItem`.
4. **Never use `requestAnimationFrame` directly.** Always use PixiJS ticker `dt`.
5. **Never add items to `app.stage` that belong in `gameContainer`.** World-space objects go in `gameContainer`; screen-space overlays go on `app.stage`.
6. **Never skip `npx tsc --noEmit` before reporting done.** Zero type errors is the done bar.
7. **Never use PixiJS v8 APIs.** The project uses PixiJS 7. Check the v7 docs, not v8.
8. **Monk always has 6 fixed skill slots.** Do not make Monk's slots dynamic.
9. **Summoner caps:** skeletons ≤4, mages ≤3, spectres ≤1. Never exceed these in skill or AI logic.
10. **Max 5 files per sub-agent pass.** Scope tasks tightly; if a task touches more, split it.

---

## Sub-Agent Workflow

### Standard flow
1. **Orchestrator** defines task scope, affected files (≤5), and acceptance criteria
2. **Sub-agent** reads all relevant source files before writing any code
3. **Sub-agent** implements in a single focused pass
4. **Sub-agent** runs `npx tsc --noEmit` — fixes all errors before continuing
5. **Sub-agent** reports: what changed, which files, any follow-up tasks deferred
6. **Orchestrator** verifies integration, then commits and deploys

### Done criteria
A task is done when **all** of the following are true:
- `npx tsc --noEmit` exits with zero errors
- The feature works end-to-end in-browser (no console errors at startup)
- No `as any` introduced in Game.ts
- No new circular imports

### Error path
If `npx tsc --noEmit` produces errors:
1. Fix them in the same pass — do not report done with outstanding type errors
2. If fixing requires touching a 6th file, report the blocker to the orchestrator with a proposed split

### Deferred work
If a sub-agent discovers related work out of scope, append it to `## Notes` under "Deferred Tasks" rather than expanding the current pass.

---

## Notes

### PixiJS v7 Gotchas
- `Application` options use `view` (not `canvas`): `new Application({ view: canvasEl })`
- `Texture.from()` is the correct factory; `Assets.load()` is v8
- `AnimatedSprite` requires an array of `Texture[]`, not frame names
- `Graphics.lineStyle()` before `.drawRect()` — v7 API, not v8 chained calls
- `DisplayObject.destroy({ children: true })` to avoid memory leaks on screen transitions

### Coordinate System
- World coordinates live in `gameContainer` space
- Screen coordinates live in `app.stage` space
- Convert mouse → world: `gameContainer.toLocal(inputManager.mousePosition)`
- Never assume `event.clientX/Y` maps directly to canvas coordinates — use `InputManager`'s canvas-relative conversion

### Serialization Rules
- `SaveManager` serializes items as `SerializedItem` — a subset of `GeneratedItem`
- Any new field added to `GeneratedItem` must have explicit save (`toSerialized`) and load (`fromSerialized`) handling, or it will silently be lost on reload
- Stash items go through the same path — don't add separate stash serialization logic

### Circular Dependency Pattern
The project uses the ZoneRegistry pattern to break circular imports. If you see a circular import error when adding a new system:
1. Create a `XxxRegistry.ts` that holds the map (ID → implementation)
2. Both sides import from the registry, not from each other
3. Populate the registry at boot in `main.ts` or `Game.ts`

### VFX Lifecycle
- VFX are `{ graphics: Graphics, update: (dt: number) => boolean }` objects
- Return `false` from `update` to signal removal
- Always call `graphics.destroy()` in the removal path inside `Game.addVfx()`'s cleanup loop
- Do not hold references to VFX outside of Game's internal list

### Enemy Rarity Mods
- Magic/rare affixes come from `MonsterMods.ts` — add new mods there
- Urn-spawned enemies track their source urn via `urnId` on `Enemy` — preserve this on new enemy types

### Common Mistakes
- Forgetting to register a new zone in all three files (ZoneConfig + ZoneRegistry + WorldMapData)
- Adding a new `effectType` to a skill without handling it in `Game.ts`'s skill dispatch switch
- Placing a UI overlay in `gameContainer` instead of `app.stage` (causes it to scroll with the camera)
- Calling `Logger.log()` with an unregistered category (use the defined set above)

### Deferred Tasks
<!-- Sub-agents: append deferred work here with date and context -->

---

## Skills

Skills are reusable task templates. Invoke with `/skill <name>` in the Reasonix TUI.

---
name: add-class-skill
description: Add a new skill definition to an existing class (Warrior/Ranger/Monk/Summoner)
model: deepseek-v4-flash
max-iters: 16
---
Add a new skill to the specified class in TinyARPG.

Steps:
1. Read `src/core/SkillDefs.ts` (or `SummonerSkillDefs.ts` for Summoner) to understand the `SkillDef` structure and existing skill IDs
2. Read `src/core/SkillSubTree.ts` to understand sub-tree node structure
3. Add the new `SkillDef` entry with a unique `id`, correct `effectType` from the allowed set, and a matching `subTreeId`
4. Add a corresponding sub-tree definition in `SkillSubTree.ts` (minimum 3 nodes: base, keystone, mutation)
5. If the effectType is new, check `Game.ts` skill dispatch — add a handler if needed
6. Run `npx tsc --noEmit` and fix all errors

Constraints: do not exceed 6 slots for Monk; do not modify SkillManager slot logic unless explicitly asked. Max 4 files touched.

Use agents to break down and execute this task.

---

---
name: add-zone
description: Add a new zone with ZoneConfig, ZoneRegistry entry, WorldMapData node, and room templates
model: deepseek-v4-flash
max-iters: 20
---
Add a new zone to TinyARPG. A zone requires changes in exactly three files plus one optional template file.

Files to read first:
- `src/core/ZoneConfig.ts` — zone definition structure, biome types, boss config shape
- `src/core/ZoneRegistry.ts` — registry map pattern
- `src/core/WorldMapData.ts` — WORLD_MAP_REGISTRY entries and ZONE_PORTAL_POSITIONS

Steps:
1. Define the new zone in `ZoneConfig.ts` (biome, enemy pool, room count, templates[], boss config if applicable)
2. Register it in `ZoneRegistry.ts`
3. Add the world map node and portal position to `WorldMapData.ts`
4. If the zone needs a unique room template, add it to `src/world/RoomTemplates.ts`
5. Run `npx tsc --noEmit` and fix all errors

Do not touch ZoneManager — zone transitions are handled automatically once the zone is registered.

Use agents to break down and execute this task.

---

---
name: add-unique-item
description: Add a new unique item to ItemDefs with a skill-altering or stat-modifying effect
model: deepseek-v4-flash
max-iters: 16
---
Add a new unique item to TinyARPG's item system.

Files to read first:
- `src/core/ItemDefs.ts` — existing unique item structures, `UniqueItem` interface, effect types in use
- `src/core/StatSystem.ts` — how unique effects are resolved into stats
- `src/core/ItemGenerator.ts` — how uniques are generated and selected

Steps:
1. Define the unique in `ItemDefs.ts` with: name, base, lore, and effect object
2. If the effect type is new (e.g. a new proc or modifier), add handling in `StatSystem.ts`
3. If the unique modifies a skill (AOE, damage, behaviour), read `SkillManager.ts` and add the hook there
4. Ensure `generateItemName()` handles the unique correctly (it should already, since name is stored on uniques)
5. Run `npx tsc --noEmit` and fix all errors

Do not add a `computedName` field — names are derived by `generateItemName()` at display time.

Use agents to break down and execute this task.

---

---
name: add-enemy
description: Add a new enemy type to Enemy.ts with AI behaviour, stats, and animation
model: deepseek-v4-flash
max-iters: 20
---
Add a new enemy type to TinyARPG.

Files to read first:
- `src/entities/Enemy.ts` — enemy type enum, AI switch, stat tables, animation setup
- `src/rendering/SpriteAnimator.ts` — how enemy animations are loaded and played
- `src/core/ZoneConfig.ts` — enemy pool format (to know where to reference the new type)

Steps:
1. Add the new type to the enemy type enum in `Enemy.ts`
2. Define base stats for the new type in the stat table
3. Implement the AI behaviour branch in the update switch (model after existing types)
4. Wire up the animation in `SpriteAnimator.ts` if a new spritesheet is needed
5. Add the new type to at least one zone's enemy pool in `ZoneConfig.ts`
6. Run `npx tsc --noEmit` and fix all errors

Use agents to break down and execute this task.

---

---
name: add-boss
description: Add a new multi-phase boss to Boss.ts with telegraphed attack patterns
model: deepseek-v4-flash
max-iters: 24
---
Add a new boss to TinyARPG. Bosses have multiple HP phases with distinct attack patterns and telegraphs.

Files to read first:
- `src/entities/Boss.ts` — existing boss (Golem/Reaper) structure, phase thresholds, telegraph system
- `src/core/ZoneConfig.ts` — boss config shape (`bossConfig: { type, level, phases }`)
- `src/core/ZoneManager.ts` — boss gating logic (how a zone's final room spawns the boss)

Steps:
1. Add the new boss type to the boss type enum
2. Define HP phase thresholds (4 phases expected)
3. Implement attack patterns for each phase — each pattern needs a telegraph (visual warning before hit)
4. Add the boss to a zone's `bossConfig` in `ZoneConfig.ts`
5. Add `BossHpBar` integration if the boss type is new (check `Game.ts` boss spawn handling)
6. Run `npx tsc --noEmit` and fix all errors

Use agents to break down and execute this task.

---

---
name: add-urn-curse
description: Add new urn curse entries to CurseMods across one or more tiers
model: deepseek-v4-flash
max-iters: 16
---
Add new curses to the CursedUrn system in TinyARPG.

Files to read first:
- `src/core/CurseMods.ts` — existing 14 curses, tier structure, weighted selection logic
- `src/entities/CursedUrn.ts` — how curses are applied to the player on urn activation
- `src/entities/Player.ts` — player curse fields (to know what curse effects are already supported)

Steps:
1. Add new curse entries to `CurseMods.ts` in the appropriate tier(s) with weight values
2. If the curse applies a new effect type, add the effect handler in `CursedUrn.ts` (activation) and `Player.ts` (tick/expiry)
3. Ensure the curse displays correctly in the urn info panel (check `CursedUrn.ts` info panel renderer)
4. Run `npx tsc --noEmit` and fix all errors

Use agents to break down and execute this task.

---

---
name: add-ui-overlay
description: Create a new full-screen UI overlay following existing overlay conventions
model: deepseek-v4-flash
max-iters: 20
---
Add a new full-screen UI overlay to TinyARPG.

Files to read first:
- An existing similar overlay (e.g. `src/ui/StashScreen.ts` for a container UI, or `src/ui/PassiveTreeScreen.ts` for a graph-style UI)
- `src/core/Game.ts` — how overlays are opened/closed (input routing, overlay stack)
- `src/core/InputManager.ts` — keybind registration

Steps:
1. Create `src/ui/NewScreenName.ts` following the existing overlay class pattern:
   - Constructor takes `app: Application` and `game: Game`
   - Exposes `show()` and `hide()` methods
   - Adds/removes itself from `app.stage` (not `gameContainer`)
   - Cleans up event listeners in `hide()`
2. Register the keybind in `InputManager.ts`
3. Add open/close handling in `Game.ts` (input routing section)
4. Run `npx tsc --noEmit` and fix all errors

Do not add the overlay to `gameContainer` — it must be screen-space on `app.stage`.

Use agents to break down and execute this task.

---

---
name: add-passive-nodes
description: Add new passive tree nodes to PassiveTree with stat effects and connections
model: deepseek-v4-flash
max-iters: 16
---
Add new nodes to TinyARPG's passive tree.

Files to read first:
- `src/core/PassiveTree.ts` — node structure, existing ~40 nodes, keystone definitions, the 3 clusters (Might/Cunning/Sorcery)
- `src/core/StatSystem.ts` — how allocated passive nodes are resolved into stats
- `src/ui/PassiveTreeScreen.ts` — how nodes are laid out and rendered (position grid)

Steps:
1. Define the new nodes in `PassiveTree.ts` with: id, name, description, statEffects, connections[], position
2. Ensure connections are bidirectional (if A connects to B, B must list A)
3. Add stat resolution for any new stat types in `StatSystem.ts`
4. Verify the node renders correctly in `PassiveTreeScreen.ts` (position may need manual adjustment)
5. If adding a keystone, add it to the keystone list and add the binary effect toggle in `StatSystem.ts`
6. Run `npx tsc --noEmit` and fix all errors

Use agents to break down and execute this task.

---

---
name: type-fix
description: Run tsc, diagnose all type errors, and fix them without changing runtime behaviour
model: deepseek-v4-flash
max-iters: 24
---
Fix all TypeScript errors in TinyARPG without changing runtime behaviour.

Steps:
1. Run `npx tsc --noEmit` and capture the full error output
2. Group errors by file and root cause
3. Fix errors in order of dependency (fix base types before derived usages)
4. Prefer proper union types and type guards over `as unknown as T` casts
5. **Never introduce `as any` in Game.ts** — use proper types or a typed helper function
6. Re-run `npx tsc --noEmit` after each file to confirm errors are resolved, not just moved
7. Report: number of errors fixed, files changed, any errors that require a design decision (escalate those)

Use agents to break down and execute this task.

---

---
name: balance-pass
description: Review and adjust numeric balance values (damage, cooldowns, costs, drop rates) for a specified system
model: deepseek-v4-pro
max-iters: 20
---
Perform a balance pass on the specified system in TinyARPG.

Files likely in scope (confirm based on the system specified):
- `src/core/SkillDefs.ts` / `SummonerSkillDefs.ts` — skill damage multipliers, cooldowns, mana costs
- `src/core/ItemDefs.ts` — affix value ranges, unique item power
- `src/core/StatSystem.ts` — derived stat formulas
- `src/core/ZoneConfig.ts` — enemy scaling, boss HP multipliers

Steps:
1. Read the relevant data files and list current values in a summary
2. Identify values that are outliers relative to the intended power curve
3. Propose adjusted values with reasoning before making any changes
4. Apply the agreed adjustments
5. Run `npx tsc --noEmit` (balance values are often typed — check for range violations)
6. Report what changed and what the expected gameplay impact is

Do not change code logic — only numeric constants. If a balance fix requires a logic change, escalate.

Use agents to break down and execute this task.

---
