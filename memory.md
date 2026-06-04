# TinyARPG — Session Memory

## Project
Browser-based 2D top-down ARPG (PoE-inspired). TypeScript + PixiJS 7 + Vite 5.
Live: https://eloheavenjoe-cyber.github.io/TinyARPG/
Repo: https://github.com/eloheavenjoe-cyber/TinyARPG

## Architecture (current)

```
src/
  main.ts                     Entry — creates PixiJS Application, boots Game
  core/
    Game.ts                   State machine, game loop, wave spawning, dev console wiring, projectile management
    InputManager.ts           WASD + mouse, canvas-coordinate conversion, right-click support
    Logger.ts                 Categorized logging ([Input] [Combat] [Skill] etc)
    SkillDefs.ts              All Warrior + Ranger skill data (main + support skills)
    SkillManager.ts           Cooldowns, buffs, skill activation validation, class-aware
    PassiveTree.ts            ~40 node passive tree data, allocation, effects computation
    StatSystem.ts             Computes final stats from base + attributes + tree nodes + equipment
    ItemDefs.ts               Item base data (7 bases), 25 affix types × 3 tiers, 9 unique items
    ItemGenerator.ts          Item/orb generation: rarity, tiered affixes, ilvl, levelReq
  entities/
    Player.ts                 Player with SkillManager, mana, buffs, projectile firing, leveling, passive tree, inventory, equipment, slow debuff, skill AOE scaling, life leech, fortify
    Enemy.ts                  4 types (Grunt/Archer/Juggernaut/Cultist), kiting AI, blink, repulsion, wobble, culling strike
    CombatText.ts             Floating damage numbers
    ItemDrop.ts               Ground loot nameplates (gold/potions/items/orbs) with rarity colors
    Projectile.ts             Projectiles with hostile flag, slow effect, colored orbs
  world/
    Room.ts                   1600×896 room, wall collision resolver
  rendering/
    Sprites.ts                Programmatic pixel-art textures (player, enemy, archer, cultist, juggernaut, floor, wall)
  ui/
    MainMenu.ts               Title screen
    ClassSelect.ts            Class picker (Warrior/Ranger)
    AbilitySelect.ts          Main ability picker (4 per class)
    PassiveTreeScreen.ts      Full-screen passive tree overlay with clickable attribute buttons
    InventoryScreen.ts        Full-screen inventory with polished tooltips (sections, stats, level req)
    DeathScreen.ts            Death overlay with restart
    HUD.ts                    Health/mana bars (bottom-left), gold counter, level, XP bar
    SkillBar.ts               6-slot skill bar (bottom-center), keybinds 1-6
    DeveloperConsole.ts       In-game dev console (backtick), DOM-based, command history, autocomplete
```

## Completed Phases

### Phase 0 — Foundation
- Main menu with start button
- 1600×896 room with wall collisions
- Player with WASD movement + mouse aim
- One enemy (melee chaser)
- Basic health, damage, death/restart
- Programmatic pixel-art sprites
- Categorized console logging for all systems

### Phase 1 — Combat
- Floating damage numbers (rise and fade)
- Mana system (50 pool, passive regen)
- Hit feedback (enemy flash red)
- HUD: health bar, mana bar, gold counter
- Loot drops as colored nameplates on ground (PoE-style)
- Gold, health potion, mana potion items
- Walk-over pickup

### Phase 2 — Skills & Classes (Warrior)
- 4 main abilities: Cleave, Shield Slam, Whirlwind, Heavy Strike
- 10 support skills: Charge, War Cry, Fortify, Battle Rage, Execute, Sunder Armor, Bloodlust, Rally, Ground Slam, Ignore Pain
- 6-slot skill bar (bottom-center, keys 1-6)
- Ability select screen (pick main ability)
- Buff system (cooldowns, duration, expiration)
- VFX system: cleave arc, impact bursts, whirlwind spin, heavy strike slash, charge trail, expanding rings
- Charge is a gradual lerp (not teleport), with easeInOutQuad

### Phase 3 — Progression
- Leveling: enemies give 10 XP, XP per level = level × 50
- Each level: 1 passive skill point + 3 attribute points
- ~40 node passive tree with 3 branches (Might, Cunning, Sorcery)
- 3 keystones: Colossus, Deadeye, Archmage
- Full-screen passive tree overlay (P key)
- Click nodes to allocate, click STR/DEX/INT to assign attribute points
- Stats cascade: STR→HP, DEX→attack speed, INT→mana
- HUD shows level number and XP bar
- HP regen from passive tree

### Phase 2b — Ranger (added after Warrior)
- 4 main abilities: Quick Shot, Multi Shot, Rain of Arrows, Snipe
- 10 support skills: Dodge Roll, Eagle Eye, Haste, Poison Arrow, Trap, Retreat, Mark Target, Camouflage, Spread Shot, Barrage
- Projectile system (arrow-shaped, velocity, lifetime, pierce)
- Projectile VFX trails
- Green hooded Ranger sprite
- Class select screen (Warrior/Ranger)

### Phase 4a — Item System (completed 2026-06-04)
- 7 item bases: Sword, Bow, Body, Helmet, Boots, Ring, Amulet (weighted drop rates)
- Rarity: normal (50%), magic (30%), rare (15%), unique (5%)
- 12 affixes: 6 prefixes (HP, armor, damage, damage%, attack speed, mana) + 6 suffixes (STR, DEX, INT, armor%, HP regen, fire damage)
- Affix count: magic=2, rare=4-6 random
- Unique items: Colossus Blade (warrior), Deadeye Bow (ranger) — fixed affixes, unmodifiable
- Item generation moduled in ItemGenerator.ts (weighted roll, affix selection, name generation)
- Click-to-pickup for equippable items (gold/potions auto-pickup by proximity)
- Drop chance: ~40% per enemy kill
- Loot spreads vertically to prevent nameplate overlap

### Phase 4b — Inventory & Equipment (completed 2026-06-04)
- 5×6 grid (30 slots) in full-screen overlay (I key toggle, Escape closes)
- 7 equipment slots: Weapon, Body, Helmet, Boots, Ring 1, Ring 2, Amulet
- Click-to-equip: select item in grid, click equip slot to equip
- Click equipped item to unequip back to first empty slot
- Hover tooltips: item name, base type, damage, affix breakdown
- Character stats panel: Life, Mana, Armor DR, Attack Speed, Move Speed, Dodge
- Stats from equipment (STR/DEX/INT affixes feed into derived stats)
- `ring2` slot added to support dual rings

### Phase 4c — Crafting (completed 2026-06-04)
- Orb of Empowerment: adds a random affix to a rare item (prefix if <=3 affixes, suffix otherwise, no duplicate stats)
- Orb of Flux: re-rolls all affixes on a rare item (4-6 random new affixes)
- Both orbs only work on rare items, uniques protected
- Orbs stack indefinitely in inventory (same orbId auto-merges on pickup)
- Crafting UX: right-click orb to select → left-click item (grid or equipped) to apply
- Orbs drop from enemies (~5% chance) as cyan nameplates
- Inventory slot type refactored to union: `EquipSlot | OrbInfo | null`
- Orb pickup bug: walk-over pickup was missing `case 'orb'` — fixed
- Crafting now works on inventory grid items, not just equipped

### Phase 4d — Tooltip Polish (completed 2026-06-04)
- Rich tooltip layout: rarity-colored bold header, base type line, grouped Prefixes/Suffixes sections
- Right-aligned stat values, total stat summary at bottom
- Thicker 2px border matching rarity color, more padding
- Level requirement display ("Requires Level X")

### Phase 4e — Affix Expansion (completed 2026-06-04)
- **Affix tiers**: 3 tiers per affix (T1 50%, T2 35%, T3 15%). Tier 50%→1, 35%→2, 15%→3.
  T1 is always available, T2 and T3 weighted. Each tier has distinct name and higher values.
- **25 affix types** (was 12): Added meleeDmgPct, projectileDmgPct, coldDmg, lightningDmg,
  moveSpeedPct, dodgePct, cooldownReductionPct, manaCostReductionPct, additionalProjectiles,
  hpPct, manaPct, skillDurationPct, manaRegenPct. All with 3 tiered names.
- **Item level & level req**: `ilvl` = player level at drop, `levelReq` = maxTier × 4. Displayed in tooltip.
- **9 unique items** (was 2): Added Phoenix Mantle, Crown of Eyes, Windrunners, Ring of the Forge,
  Titan's Reach (skill AOE + fortify), Blood Amulet (life leech), Herald of Ruin (culling + explode)
- **Additional projectiles**: "of Volleys/Barrage/Fusillade" affix. Extra projectiles on Ranger skills.
- **Skill-altering unique effects**: Skill AOE scaling, life leech, fortify on hit (2s dmg reduction),
  culling strike (insta-kill below threshold), explode on kill (AoE based on enemy max HP).
  All wired through StatSystem and combat code in Player.ts / Game.ts / Enemy.ts.
- **Orabs expanded**: 6 total — Mutation (normal→magic), Growth (magic+1), Ascendance (normal→rare),
  Purification (magic/rare→normal), Empowerment (rare+1), Flux (rare re-roll). Weighted drop rates.

### Phase 4f — Enemy Diversity (completed 2026-06-04)
- **4 enemy types**: Grunt (melee chaser), Archer (kite + arrows), Juggernaut (big slow tank),
  Cultist (ranged slow + blink teleport)
- **Wave spawning**: 3-6 enemies per wave, mixed composition, 2s delay between waves
- **Dynamic movement**: ±15% speed variance, sinusoidal wobble, repulsion force between enemies
- **Hostile projectiles**: Red arrow orbs (archer), purple slow orbs (cultist). Reused Projectile class with hostile flag.
- **Player slow debuff**: Cultist orbs apply 50% move speed slow for 2s, purple tint.
- **Distinct sprites**: Green archer with bow, purple hooded cultist with glowing eyes, large dark juggernaut.
- **Juggernaut**: 42×42 hitbox, 120 HP, 1.2 speed, 16 damage.

### Phase 4g — Passive Tree Fix (completed 2026-06-04)
- Attribute panel click area was mismatched (text at Y=980, hitbox at Y=540)
- Redesigned as proper clickable buttons with background panel, hover highlighting, + buttons

### Phase 4h — Developer Console (completed 2026-06-04)
- DOM-based overlay toggled with backtick (`) key
- Commands: /additem, /addorb, /addgold, /addlevel, /addxp, /passivepoints, /attrpoints,
  /heal, /killall, /spawn, /speed, /god, /help, /clear
- Command history (up/down arrows), tab autocomplete
- Pauses game input when open
- Game.ts owns all state, runs game loop
- All game objects inside `gameContainer` (offset 160,92)
- UI components on `app.stage` in screen coords
- VFX are temporary Graphics objects with draw function + lifetime
- Damage numbers use CombatTextManager
- Skill activation routes through Player.useMainAbility() and Game.useSupportSkill()
- Logger categories: input, movement, collision, entity, combat, ui, game, system, skill
- Inventory slots use discriminated union: `{ kind: 'equip', item } | { kind: 'orb', orbId, count } | null`
- `computeStats()` accepts optional `equipmentStats` parameter for equipment-derived stat bonuses
- Stats cascade from base → attributes → passive tree → equipment

## Key Constants
- Canvas: 1920×1080, Room: 1600×896 at offset (160,92)
- Walls: 32px thick, Player hitbox: 28×28 (center-positioned)
- Skill bar: 6 slots at Y=1030 (bottom-center)
- HUD: bottom-left at (18, 1030)
- Player base HP: 100, base mana: 50, base speed: 6
- Enemy HP: 40, speed: 2.2, XP: 10
- Inventory: 30 slots (5×6 grid), slot size 50px
- Equipment: 7 slots (Weapon, Body, Helmet, Boots, Ring, Ring2, Amulet)
- Orb drop rate: ~5%, item drop rate: ~40%
- Enemy types: Grunt (40 HP, 2.2 spd, 10 XP), Archer (25 HP, 2.5 spd, 12 XP), Juggernaut (120 HP, 1.2 spd, 25 XP), Cultist (35 HP, 2.0 spd, 15 XP)
- Enemy speed variance: ±15% (0.85-1.15 of base)
- Wave size: 3-6 enemies, 2s delay between waves
- Unique skill effect sources: Titan's Reach (sword), Blood Amulet (amulet), Herald of Ruin (ring)
- Dev console: backtick toggle, DOM overlay, command history + autocomplete

## Known Issues / TODOs
- Drag-to-equip not implemented (click-only equip/unequip)
- No save/load (localStorage planned — Phase 4d)
- No endgame maps/zones (Phase 5)
- `ItemGenerator.ts` uses biased `sort(() => Math.random() - 0.5)` shuffle (minor, acceptable for small pools)
- No max orb stack size (stacks grow indefinitely, fine for current scope)
- Level requirements displayed but not enforced (player can equip above level)
- Enemies don't drop map items yet

## Next Up

### Phase 4d — Save/Load (still pending)
- Save player state (level, XP, inventory, equipment, passive tree, gold, orbs) to localStorage
- Auto-save on close/interval, manual save option
- Load on game start, continue from saved state
- Needed before adding more permanent progression systems

### Phase 5 — Endgame
- Multiple themed zones with different visuals
- Mapping system: consumable map items generate new zones
- Zone transitions: walk to edge to advance
- Difficulty scaling: enemies scale with zone level
- Map modifiers (affixes on map items)
- Boss encounters with unique mechanics
- Infinite scaling / endless mode

## Co-authoring
This workspace may be shared between AI agents. Always read before writing —
the other agent may have changed files. Commit after meaningful work so the
other agent sees a clean diff. Don't undo or "improve" the other agent's work
without explicit approval. See AGENTS.md for full coordination rules.

## Deployment
- CI via GitHub Actions (`.github/workflows/deploy.yml`): builds on push to master, deploys to Pages
- Pages source: GitHub Actions (set via API)
- `npm run deploy` runs `npm run build` only (CI handles the actual deploy)
- Old `gh-pages` npm package removed

## Bug Patterns (gotchas)
- **Coordinate mismatch:** resolveCollision returns bounds (top-left) coords, not center coords. Always do `resolved.x + width/2` after calling it.
- **Canvas CSS scaling:** max-width/object-fit with `image-rendering: pixelated` makes PixiJS text look jagged. Use bilinear interpolation for text.
- **HUD position:** HUD and skill bar live at screen-coord Y=1030. Ensure canvas viewport scaling is active so bottom isn't clipped.
- **Projectile positioning:** projectiles are children of gameContainer (offset 160,92), so use game-local coords, not screen coords.
- **Inventory type:** `InventorySlot` union type (`EquipSlot | OrbInfo | null`) — any code accessing inventory must check `.kind` before accessing `.item` or `.orbId`.
- **Dev console DOM overlay:** Created via `document.createElement`, toggled with backtick. `pointer-events: auto` so it blocks canvas input when open. Remember `display: none` to hide.
- **Stat parenthes precedence:** In `StatSystem.ts`, `add('hpPct') || 0 + equipHpPct` has wrong precedence — must be `(add('hpPct') || 0) + equipHpPct`.
- **Enemy repulsion:** Enemies push apart in update loop. Repulsion uses `minDist` from combined widths. Must iterate with `for (const other of enemies)` including self-check.
- **Enemy projectiles:** Archer/cultist push Projectile objects to `this.projectiles[]` array. Game.ts collects and adds to container after enemy update.
- **Culling strike in Enemy.takeDamage:** Checked BEFORE damage is applied. If enemy HP is already at threshold, they die without taking damage.
- **Wave spawning:** `spawnWave()` creates enemies in loose cluster. `waveCooldown = 120` (2s) triggers after all enemies die. Reset in `restartGame()`.
- **Unique skill effects:** skillAoePct, lifeLeechPct, fortifyOnHit, cullingStrikePct, explodeOnKillPct are unique-only affix stats on special unique items. Wired through StatSystem and combat code.
- **Orb crafting:** orbs modify `GeneratedItem` in-place (mutates `item.affixes` and `item.computedStats`). The `equipment` record holds the same reference, so `recalcStats()` picks up changes.
- **Loot stacking:** `spawnLoot()` spreads drops vertically with 25px spacing. Both `drop.y` and `drop.container.y` must be updated for correct hit detection and visual position.
