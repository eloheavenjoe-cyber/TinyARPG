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
    Game.ts                   State machine, game loop, dev console wiring, projectile management, zone transitions, rain zone system
    ZoneConfig.ts             Zone definitions, biome data, room template types, ZONE_REGISTRY
    ZoneManager.ts            Zone state, transitions, enemy spawning, endless scaling
    InputManager.ts           WASD + mouse, canvas-coordinate conversion, right-click support
    Logger.ts                 Categorized logging ([Input] [Combat] [Skill] etc)
    SkillDefs.ts              All Warrior + Ranger + Monk skill data (main + support skills)
    SkillManager.ts           Cooldowns, buffs, skill activation validation, class-aware
    PassiveTree.ts            ~40 node passive tree data, allocation, effects computation
    StatSystem.ts             Computes final stats from base + attributes + tree nodes + equipment
    ItemDefs.ts               Item base data (7 bases), 25 affix types × 3 tiers, 9 unique items
    ItemGenerator.ts          Item/orb generation: rarity, tiered affixes, ilvl, levelReq
    SaveManager.ts            localStorage save/load, 5 slots, stash persistence
    VendorManager.ts          Vendor stock generation + pricing
    TileConfigs.ts            Tile interface + registry + texture cache for biome spritesheets
  entities/
    Player.ts                 Player with SkillManager, mana, buffs, projectile firing, leveling, passive tree, inventory, equipment, slow debuff, skill AOE scaling, life leech, fortify, isRolling flag
    Enemy.ts                  4 types (Grunt/Archer/Juggernaut/Cultist), kiting AI, blink, repulsion, wobble, culling strike, animated sprites for all types, slowTimer
    CombatText.ts             Floating damage numbers
    ItemDrop.ts               Ground loot nameplates (gold/potions/items/orbs) with rarity colors
    Projectile.ts             Projectiles with hostile flag, slow effect, colored orbs, 7×3 arrow sprite
    Chest.ts                  Interactable chests with open/close states, loot drops
    Breakable.ts              Destructible pots/barrels
  world/
    Room.ts                   6400×3584 room, wall collision resolver, TilingSprite floor/walls with programmatic fallback, stone path rendering, door/portal markers, buildings, NPCs, decorations
    RoomTemplates.ts          Pre-defined room layout templates (5 base + hub/tutorial/arena/dungeon/dev + 12 story zone + buildings/NPCs)
    RoomDecorator.ts          Procedural decoration: trees, rocks, bushes, grass; tile-texture-aware with road block rect
  rendering/
    Sprites.ts                Programmatic pixel-art textures (player, enemy, archer, cultist, juggernaut, floor, wall, buildings), loadTileSet export
    SpriteAnimator.ts         Sprite sheet loader + frame slicer + animation manager (warrior, ranger, reaper, golem, monk, cultist, archer, grunt, juggernaut, vendor, stash animated sprites)
    TileLoader.ts             PNG+JSON spritesheet loader (fetch → blob → Image → BaseTexture → named Textures)
    Camera.ts                 Player-following camera with smooth lerp, edge clamping
    Minimap.ts                Bottom-right minimap overlay (walls, player, enemies, chests, breakables)
  ui/
    MainMenu.ts               Title screen with New Game / Continue / Load Game
    ClassSelect.ts            Class picker (Warrior/Ranger)
    AbilitySelect.ts          Main ability picker (4 per class)
    PassiveTreeScreen.ts      Full-screen passive tree overlay with clickable attribute buttons
    InventoryScreen.ts        Full-screen inventory with paper doll layout, 5×6 grid, socket indicators, drag-drop jewel socketing, craft/equip/unequip UX
    CharacterScreen.ts        Full-screen character sheet (Stats + Abilities tabs)
    DeathScreen.ts            Death overlay with restart
    HUD.ts                    Health/mana bars (bottom-left), gold counter, level, XP bar
    SkillBar.ts               6-slot skill bar (bottom-center), keybinds 1-6
    DeveloperConsole.ts       In-game dev console (backtick), DOM-based, command history, autocomplete
    EscapeMenu.ts             In-game menu: Resume / Save / Settings / Save & Exit
    SaveSlotScreen.ts         5-slot save/load picker with delete confirmation
    SettingsPlaceholder.ts    Visual-only Audio/Graphics/Controls panels
    VendorScreen.ts           Vendor buy/sell overlay with hover tooltips
    StashScreen.ts            Stash deposit/withdraw overlay with 4 tabs, hover tooltips
    Tooltip.ts                Shared item/orb tooltip builder (rarity-colored, affixes, stats)
    BossHpBar.ts              Boss HP bar overlay (screen-space, Y=60)
    TutorialScreen.ts         Tutorial step overlay
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

### Phase 5 — Endgame Zones (completed 2026-06-04)
- Zone system: ZoneConfig (types + registry) + ZoneManager (state, transitions, enemy spawning)
- Biome-aware Room: floor/wall colors per biome (hub/tutorial/forest/desert/ice/endless/dev)
- Room templates: 5 base layouts (open, pillars, L-shape, cross, ring) + zone-specific templates (17 total)
- Hub town with 6 clickable portals to all zones
- Hub buildings: Vendor building (left) and Stash building (right) with roofs, doors, windows, labels
- Hub NPCs: colored humanoid figures (green Vendor, blue Stash) with name labels standing outside buildings
- NPCs rendered as Graphics (rounded rect body + circle head) via new `buildings`/`npcs` fields on RoomTemplate
- Tutorial zone: single room, 2-3 weak grunts, exit door to hub
- 3 story zones: Verdant Forest (3 rooms), Scorched Desert (4 rooms), Frozen Wastes (5 rooms) with progressive difficulty
- Endless Arena: single-room wave-based, infinite scaling
- Endless Dungeon: procedural rooms with progressive difficulty, exit portal to hub
- Dev room: accessible via `/devroom` command, door back to hub
- HUD zone name display, door/portal rendering

### Phase 5b — Hub Visuals & Portal Scrolls (2026-06-04)
- Portal labels: zone name shown below each portal ring
- Portal proximity: must be within 150px to click-activate
- Portal animation: rotating spiral VFX drawn each frame using `portalAngle` counter + VFX system
- RenderPortals in Room.ts now draws a static ring + label only; animation overlays come from Game.ts
- Portal Scrolls: new consumable loot item (8% drop rate), cyan nameplates "Portal Scroll"
- Walk-over pickup stores portal scrolls as orbs (`orbId: 'portal_scroll'`) in inventory
- Right-click in inventory to consume: creates a recall portal (animated purple spiral) at player's feet
- Recall portal: walk-over to teleport to hub, disappears on zone transition
- Recall portal tracked via `recallPortal` field on Game.ts, drawn/checked each frame in updateGameplay

### Phase 5c — Magic Find & Item Quantity (2026-06-04)
- **Magic Find** (prefixes): Lucky (8-15%), Fortunate (16-25%), Auspicious (26-40%)
  - Stat: `magicFindPct`, multiplies rarity weights in generateItemDrop()
  - Base weights: normal=50, magic=30, rare=15, unique=5
  - With 50% MF: magic=45, rare=22.5, unique=7.5 — shifts drops toward higher rarities
- **Item Quantity** (suffixes): of Bounty (8-12%), of Abundance (13-20%), of Prosperity (21-30%)
  - Stat: `itemQuantityPct`, multiplies gold amount and all drop rates
  - Gold: `Math.round(baseGold * (1 + IQ/100))`
  - Item drops: base 40% becomes `40% * (1 + IQ/100)`
  - Orb drops: base 5% becomes `5% * (1 + IQ/100)`
  - Potions/scrolls: extra rolls via `Math.ceil(quantityMult)` with per-roll probability
- Both stats added to StatSystem.ts base computed stats and otherEquip handling
- Passed through Game.spawnLoot() to generation functions

### Phase 5d — Sprite Sheet Animation System (2026-06-04)
- **File**: `src/rendering/SpriteAnimator.ts` — loads PNG sprite sheets from `public/sprites/warrior/`
- **Sheet format**: 768×84 PNG with 8 frames of 96×84 each per animation state
- **Loading**: uses `fetch()` → `blob` → `URL.createObjectURL()` → `Image` → `BaseTexture` (NOT `Assets.load()` which was unreliable)
- **Frame slicing**: `Math.floor(base.width / 96)` dynamically determines frame count per sheet
- **Three animations**: `idle.png`, `walk.png`, `attack.png` (different frame counts supported)
- **Pending sprite pattern**: sprites created before loading finishes get auto-updated via `pendingSprites[]` array
- **Animation switching** in `Player.ts`:
  - `animState` tracks current animation ('idle' | 'walk' | 'attack')
  - `update()` checks `isMoving` flag → switches idle↔walk
  - `useMainAbility()` triggers attack animation (non-looping, `onComplete` callback resets to idle)
  - `playAnimation()` sets new textures, adjusts speed (attack=0.2, idle/walk=0.12), calls `gotoAndPlay(0)`
- **Player sprite**: always `AnimatedSprite` type. Warrior uses sprite sheets, Ranger uses single-frame AnimatedSprite from programmatic texture
- **Sprite folder**: `public/sprites/warrior/` (created via `New-Item -ItemType Directory`)
- **Critical gotcha (Windows)**: NTFS is case-insensitive. `git mv IDLE.png idle.png` is a no-op! Must use two-step with temp name: `git mv IDLE.png tmp.png && git mv tmp.png idle.png` to force git to track the rename.

### Phase 5e — Boss Fights & Zone Progression (2026-06-04)
- **Boss entity**: `src/entities/Boss.ts` — separate class from Enemy with phase-based AI
- **Two bosses**: Stone Golem (Forest, 96×96, 500 HP) and Death Reaper (Ice, 110×110, 800 HP)
- **Boss config**: `getBossConfig()` returns HP, size, speed, damage, sprite per bossId
- **Telegraph system**: attacks show warning zone (line/circle/cone) for ~1s before execution
- **Telegraph drawing**: multi-line for boulder width (28px), double ring for circle, filled cone with inner arc
- **Phases**: 4 phases based on HP (100-75%, 75-50%, 50-25%, 25-0%) — each adds new attacks
- **Golem attacks**: Ground Slam (cone), Boulder Toss (line projectile), Stomp (circle AoE)
- **Reaper attacks**: Scythe Sweep (cone), Teleport Slam (circle + teleport), Summon Cultists (spawn adds)
- **Boss HP bar**: `src/ui/BossHpBar.ts` — screen-space overlay at Y=60, 600px wide, colored per boss
- **Boss spawning**: `Game.spawnBoss()` creates boss at room center, wires spawn callback, adds HP bar
- **Projectile hit tracking**: `Projectile.hitTargets: Set<object>` prevents piercing projectiles from multi-hitting the same target
- **Attack damage delivery**: Boss has `pendingAttackDamage` field; Game.ts reads it once after boss.update() to apply cone/circle damage
- **Contact damage**: `rectsOverlap(player, boss)` per frame with boss.damage value
- **Boss death**: marks zone completed, spawns 3 loot piles, grants XP, removes HP bar
- **Zone progression**: `ZoneManager.completedZoneIds` tracks cleared zones; `isZoneUnlocked()` checks chain
- **Hub portal locking**: locked portals show chains + padlock, don't respond to clicks
- **Tutorial cleanup**: `buildCurrentZoneRoom()` cleans up tutorial when entering non-tutorial zone
- **Boss sprites**: golem uses individual PNGs (idle:6, walk:10, attack:14, death:16); reaper uses multi-row sheets
- **`/boss` dev command**: teleports to boss room for testing (`/boss forest`, `/boss desert`, `/boss ice`)
- **Boulder VFX**: 14px multi-toned rock projectile, telegraph shows 28px-wide path
- **Stomp VFX**: expanding orange shockwave ring + starburst ground crack
- **Reaper teleport VFX**: dark purple expanding ring at landing point

### Phase 5f — Loading Screen (2026-06-04)
- Progress bar with 5 steps (warrior → ranger → reaper → golem → monk → cultist)
- Sequential awaiting (not Promise.all) so bar fills step by step
- "Loading..." text centered above bar

### Phase 5g — Monk Class (2026-06-04)
- **3 stances**: Tiger (+40% dmg, -10% def), Tortoise (-40% taken, -20% dealt), Crane (25% lifesteal, -15% dealt)
- **Stance system**: `SkillManager.currentStance`, `cycleStance()`, stance modifier methods
- **6 fixed slots**: Basic Strike (key1), Dragon Palm (key2), Whirlwind Kick (key3), Tiger Uppercut (key4), Meditate (key5), Stance Toggle (key6)
- **SkillManager monk constructor**: directly populates all 6 slots (no "pick a main ability")
- **`selectMainAbility()`** fixed to handle 'monk' classType (was falling through to RANGER_MAIN)
- **Monk animation**: individual PNG frames per animation. Tiger uppercut reuses dragon palm frames.
- **`executeTechnique()`**: extracted method on Player that handles consume + damage + animation for slot 1-5 skills
- **`applySkillDamage()`**: extracted from `useMainAbility()` to share damage logic with techniques
- **Double consume bug**: `executeTechnique()` was calling `consume()` again after Game.ts already consumed — fixed
- **Digit1 handler**: `handleSkillKeys` skips idx=0 for warrior/ranger (main ability on click), but routes to `useMainAbility()` for monk
- **Meditate**: 60-frame channel → heal 25% HP → +20% damage buff for 2s. Interrupted by damage. Movement blocked during channel.
- **Knockback**: Tiger Uppercut pushes enemy 80px away
- **Stance VFX**: colored aura ring on toggle (orange/blue/green)
- **Class select**: redesigned with programmatic icons (sword/bow/monk silhouette), taller cards (300×180), dynamic centering
- **Z-order bug**: icons were added before button background, hidden by opaque fill — fixed by reordering addChild

### Phase 5h — Cultist Animated Sprites (2026-06-04)
- Single-row sheets: Idle (6), Run (8), Attack1 (8), Death (7) — all 231×190 frames
- First enemy with animated sprites (others still use programmatic textures)
- Idle when stationary, Run when moving, Attack on fire, Death on kill (stays visible)
- Uses `sprite.scale.x` flip instead of rotation

### Phase 5i — Bug Fixes (2026-06-04)
- **Tutorial text persisting**: `buildCurrentZoneRoom()` now cleans up tutorial on zone exit
- **Piercing multi-hit**: `Projectile.hitTargets` prevents piercing from hitting same target every frame
- **Boss telegraph damage**: replaced `chosenAttack`/`attacking` flag system with `pendingAttackDamage` field
- **Attacking flag**: boss `attacking` was never set to true, telegraphs never executed — fixed telegraph phase logic
- **Cone angle**: monk whirlwind_kick used raw `120` instead of `120 * D` (radians vs degrees)

## Architecture Notes (current state)
- Zone system: ZoneConfig (types + registry) + ZoneRegistry (templates merged) + ZoneManager (state machine)
- ZoneRegistry.ts created to break circular dependency between ZoneConfig.ts ↔ RoomTemplates.ts ↔ Room.ts
- Room constructor accepts `(biome, doors, portals, decorations, buildings, npcs, isPortalUnlocked, playerStart)` — all optional with defaults
- `renderRoad()` draws a 64px-wide stone path from `playerStart` to the center of each door using programmatic stone tiles (hub-style)
- `drawStoneTile()` renders a single 32×32 stone tile with mortar lines, texture blocks, and highlights
- `cloneTemplate()` deep-clones all arrays (walls, doors, portals, spawnZones, decorations, buildings, npcs)
- Hub buildings rendered as: wall body + triangle roof + door + 2 windows + label text
- Hub NPCs rendered as: rounded rect body (tinted) + circle head + label text
- Portal scrolls stored as `{ kind: 'orb', orbId: 'portal_scroll', count: number }` — reuses orb stacking
- Recall portal is a separate Game.ts field (not a room child) to persist across zone transitions
- Animated portals use the VFX system with high maxLife (99999) so they never expire
- SpriteAnimator has separate caches per class (`warriorFrames` / `rangerFrames`) with independent pending sprite arrays
- Raw Image loading via fetch + createObjectURL is more reliable than PixiJS Assets.load()
- `loadRangerAnimations()` loads individual frame PNGs using filename patterns; `loadWarriorAnimations()` loads sprite sheets
- `playAnimation()` and `isLoaded()` accept a `classType` parameter to select the correct cache
- `Player.triggerAttackAnimation()` extracted as public method, called by both melee and projectile skill paths
- Boss sprites use AnimatedSprite for reaper (multi-row sheets), golem uses individual PNG frames per animation
- Reaper uses multi-row sheets: idle2 (100×100, 2×4), attacking (100×100, 2×6+2), death (125×100, 8+2), summon (100×100, 4+1)
- Golem uses individual PNGs: idle (6), walk (10), attack (14), death (16). Tiger uppercut reuses dragon palm frames.
- Monk uses individual PNGs: idle (6), run (8), basic_strike (6), dragon_palm (12), whirlwind_kick (7), meditate (16)
- Cultist uses single-row sheets (231×190): Idle (6), Run (8), Attack1 (8), Death (7)
- `loadMultiRowSheet(url, frameW, frameH, totalFrames, cols)` is the general-purpose multi-row sheet loader
- `loadRangerFrames(baseUrl, name, pattern, count)` is the general-purpose individual-PNG loader
- Cultist is the first enemy to use animated sprites; other enemies still use programmatic textures
- Enemy.ts uses `animState` for cultist, checks `type === 'cultist'` to route animation calls
- Enemy facing: non-cultist uses `sprite.rotation`, cultist uses `sprite.scale.x` flip (like player)
- Cultist death animation plays on kill instead of instantly hiding sprite

## Key Constants
- Canvas: 1920×1080, Room: 1600×896 at offset (160,92)
- Walls: 32px thick, Player hitbox: 28×28 (center-positioned)
- Skill bar: 6 slots at Y=1002 (within HUD panel)
- HUD: full-width bottom bar, panel starts at Y=980, height 100px
- HUD HP bar: X=18, Y=992; MP bar: X=18, Y=1022
- Player base HP: 100, base mana: 50, base speed: 6
- Enemy HP: 40, speed: 2.2, XP: 10
- Inventory: 30 slots (5×6 grid), slot size 58px
- Equipment: 7 slots (Weapon, Body, Helmet, Boots, Ring, Ring2, Amulet)
- Inventory screen: grid at X=163, Y=250; paper doll centered at X=960; bag at X=1510
- Paper doll grid cell: 28px (1×1=rings, 2×2=helm/boots, 2×4=weapon/chest)
- Orb drop rate: ~5% (× itemQuantityMult), item drop rate: ~40% (× itemQuantityMult)
- Jewel drop rate: ~15% of item drops, portal scroll drop rate: ~8% (× itemQuantityMult)
- Drilling Orb: ~6%, Shattering Orb: ~8%, Preservation Orb: ~1.5%
- Socket distributions: 6-max (30/25/20/15/7/2.5/0.5%), 4-max (35/30/20/10/5%), 1-max (65/35%)
- Enemy types: Grunt (40 HP, 2.2 spd, 10 XP, size 36, sprite 1.3x), Archer (25 HP, 2.5 spd, 12 XP, size 34, sprite 1.2x), Juggernaut (120 HP, 1.2 spd, 25 XP, size 55, sprite 1.7x), Cultist (35 HP, 2.0 spd, 15 XP, size 32, sprite 1.15x)
- Ranger projectile: base speed 10, arrow sprite 7×3, hitbox 7×3
- Enemy speed variance: ±15% (0.85-1.15 of base)
- Wave size: 3-6 enemies, 2s delay between waves
- Unique skill effect sources: Titan's Reach (sword), Blood Amulet (amulet), Herald of Ruin (ring)
- Dev console: backtick toggle, DOM overlay, command history + autocomplete
- Sprite sheet frames: 96×84 each, dynamic count from image width / 96
- Magic Find affixes: prefix only, 3 tiers (8-15%, 16-25%, 26-40%)
- Item Quantity affixes: suffix only, 3 tiers (8-12%, 13-20%, 21-30%)

## Current Development — (completed 2026-06-05)

### Phase 7 — Monster Rarity & Game Balance (completed 2026-06-05)

- **Rarity system**: 50% normal, 35% magic (2 mods), 15% rare (3 mods). Rolled during ZoneManager.spawnEnemies().
- **4 core mods**: Hasted (+50% move/atk speed, speed lines VFX), Goliath (+100% HP, +30% size, +50% XP), Frost Aura (25% slow to player in 150px radius, blue ring VFX), Volatile (explodes on death for 50% max HP AoE damage, red pulse VFX).
- **Visual identification**: Magic/rare enemies get nameplates with mod names and rarity color (blue/yellow), +10%/+20% sprite scale.
- **Loot multipliers**: Magic = 2× loot quantity, Rare = 3× loot quantity.
- **Damage formula**: Base damage 20 (from 25) × skill.damageMult × (1 + primaryStat × 0.01). STR→warrior, DEX→ranger, INT→monk. Equipment meleeDmgPct/projectileDmgPct multiplicatively stacked. Flat cold/lightning from equipment added on top.
- **Zone HP multipliers**: Tutorial 1.0×, Forest 1.5×, Desert 2.5×, Ice 4.0×.
- **Monster density**: +10% across all zones.
- **Enemy size changes**: Grunt hitbox 36→47 (+30%), sprite 1.3→1.7. Juggernaut hitbox 55→72 (+30%), sprite 1.7→2.2. Cultist hitbox 32→27 (-15%), sprite 1.15→1.0.

### Phase 8 — Ranger Sub Skill Trees (completed 2026-06-05)
- **SkillSubTree.ts**: Core module with SkillSubTreeNode interface + SkillSubTree class (allocate/canAllocate/hasKeystone/refund). All 4 tree data (Quick Shot, Multi Shot, Rain of Arrows, Snipe) with wheel layout (12 nodes + 1 start per tree, 52 total).
- **SkillSubTreeScreen.ts**: Full-screen wheel UI (K key), radial node layout, click-to-allocate, right-click refund, hover tooltip, max 2 keystone enforce, message timer for feedback.
- **SkillDefs.ts**: Added `subTreeId?: string` field, wired to all 4 Ranger main abilities.
- **Player.ts**: `skillSubTrees: Map<string, SkillSubTree>`, `skillSubPoints` (1 per 4 levels), `hasSubKeystone()` helper, level-up hook, only ranger gets points.
- **SaveManager.ts**: `skillSubTrees` and `skillSubPoints` in SaveData interface.
- **Game.ts**: K key toggle with overlay guard, per-frame screen update, save/load serialization, right-click refund callback wiring.
- **15 of 16 keystones wired**: Ricochet (enemy bounce), Piercing Shot (pierce), Static Arrow (chain lightning), Triple Fire (3 arrows), Shotgun (narrow 120° cone, double proj), Poison Nova (poison cloud zones), Point Blank (consecutive hit stacking), Arrow Storm (4-7 arrows, +20% radius), Precision Strike (3× dmg, -50% radius), Frost Volley (chilling ground), Bombardment (60px AoE), Executioner (+50% dmg to <50% HP), Railgun (3× speed), Split Shot (3 burst on kill), Marked for Death (+30% dmg mark). Ring of Blades deferred.
- **Dev console**: `/subpoints` / `/sp` command to add sub skill points.

### Phase 8b — Main Menu Scrolling Background (completed 2026-06-05)
- Menu background replaced solid dark fill with 576×324 pixel-art image scaled 3.33× with nearest-neighbor filtering.
- Two sprites loop left-to-right at 0.25px/frame (dt-based), wrapping seamlessly.
- 50% dark overlay keeps text readable.
- Repolished UI: larger title (80px), thicker strokes, semi-transparent buttons with rounded corners, muted gold accents.

### Phase 8c — Item Icons (completed 2026-06-05)
- **ItemIcons.ts**: Loads `sprites/items.png` (384×384, 16×16 grid of 24×24 cells), slices by baseId+rarity and orbId mappings.
- 28 item base icons (7 bases × 4 rarities), 6 orb icons, portal scroll icon mapped via user-provided (row,col) coordinates.
- InventoryScreen: each grid slot shows 24×24 icon with item name below. Icons loaded during startup loading screen.

### Phase 9 — Save/Load Stability & Bug Fixes (completed 2026-06-05)
- **Unique affix deserialization**: `deserializeItem()` now falls back to synthetic affix when an affix ID isn't in `AFFIXES` (fixes "Unknown affix: skillAoePct" crash on loading saves with Titan's Reach and other unique items with unique-only stats like `fortifyOnHit`, `lifeLeechPct`, `cullingStrikePct`)
- **exitToMenu guards**: `saveGame()` wrapped in try-catch so cleanup always runs; state set to `State.Menu` at the very top before any save/cleanup logic
- **loadGame guards**: inventory/equipment/stash deserialization wrapped in try-catch with empty defaults
- **Stale Graphics refCount crash**: `cleanupGameSession()` and `restartGame()` now reset `modGfx`, `chillZones`, `chests`, `breakables`, `decorationSprites` arrays after `gameContainer.destroy()` to prevent stale references from causing null `_geometry.refCount` on the next session
- **modGfx destroy loop**: guarded with try-catch + `g.parent` check to prevent crash on already-destroyed Graphics
- **SaveSlotScreen background**: `eventMode = 'static'` added to prevent pointer events passing through to MainMenu behind it (fixes accidental class-select trigger on delete confirmation)
- **SaveSlotScreen MainMenu cleanup**: `showSaveSlotScreen()` now destroys `this.mainMenu` before showing slot screen, preventing behind-the-scene clicks on "New Game" button
- **MainMenu leak**: `showMainMenu()` now cleans up existing `this.mainMenu` before creating a new one

### Phase 10 — Zone Visual Overhaul: Tile System (completed 2026-06-05)
- **TileConfig system**: `src/core/TileConfigs.ts` — interface with `TileConfig`, registry `TILE_CONFIGS`, global `tileTextures` cache. Supports both spritesheet mode (PNG+JSON) and individual file mode (per-tile PNG with optional crop rects)
- **TileLoader**: `src/rendering/TileLoader.ts` — `loadTileSheet()` fetches PNG blob + JSON frame definitions, creates named `Texture` objects via `BaseTexture` + `Rectangle`
- **TilingSprite floor/walls**: `Room.build()` uses `TilingSprite` for floor and walls when a `TileConfig` is available, with full fallback to programmatic Graphics for zones without tile configs
- **Tile-aware decorator**: `RoomDecorator.decorateRoom()` accepts optional `TileConfig`, uses tile textures for props (trees/bushes/rocks) and config-based count ranges
- **Startup loading**: `loadTileSet()` in Sprites.ts loads tile textures during the startup loading screen
- **Tutorial zone wired**: Uses user-provided PNGs — grass floor (`Grass0-4`), stone wall (`Wall1`), accent grass (`Grass0-1`), trees (`Trees.png` sprite 1, `Trees2.png` sprites 4 & 5), stumps

### Phase 10b — Tutorial Zone Visual Polish (completed 2026-06-05)
- **Grass darkened**: `TilingSprite` floor gets `tint = 0x999999` for deeper color
- **Stone path**: Programmatic stone path (2 tiles wide, 64px) from `playerStart` (room center) to exit door, using hub-style stone tiles with mortar lines, texture blocks, and highlights
- **Path blending**: First ~200px of path fades in with scattered partial stones that increase to full 2-tile-width path; extra edge stone fragments for natural look
- **Trees blocked from road**: `roadBlock` rect passed to `decorateRoom()` to prevent tree spawning on the path
- **Tree count**: 80-120 trees per room (from 60-90), using both `Trees.png` and `Trees2.png` sprites for variety
- **Spawn zone block removed**: `template.spawnZones` removed from decoration blocked rects so trees spread across the entire room instead of only the 256px perimeter margin
- **Accent tiles**: darkened with `tint = 0x999999` to match the floor

### Phase 10c — Pixel-Art Stone Arch Doors (completed 2026-06-05)
- Yellow-bordered door rects replaced with clean stone arches drawn programmatically via PixiJS Graphics
- **Architecture**: Outer rectangle `(x-pW, y-archH, w+2pW, h+archH)` with a `beginHole`/`endHole` cutout for the opening. Opening uses a cubic bezier curve for a smooth arch shape.
- **Dimensions**: 24px pillars, 36px arch top height, smooth bezier arch from `(x+w, y)` to `(x, y)` with control points at `y-archH`
- **Style**: Medium gray stone (`0x8a8a8a`) with 1px outline (`0x5a5a5a`), subtle horizontal block lines every 20px (pillars) and 14px (arch top)
- **No dark fill**: The opening shows the floor behind (no transparent black box)
- **Moss**: 4 small green circle accents at pillar bases and arch corners
- **Vines**: 2 thin hanging lines from the arch top
- **Label**: "Enter Town" for hub-bound doors, "▶ Exit [zone]" otherwise, positioned above the arch
- **Per-door variation**: Moss/vine positions use deterministic offsets based on door position

### Phase 11 — Hidden Crypt Secret Zone (completed 2026-06-05)

**Zone & Entry:**
- **SecretBush** (`src/entities/SecretBush.ts`): Two-stage E-key interaction in tutorial zone at (5600,1000). First E: bush rustles with wobble + glow animation. Second E: bush destroyed, hidden door to crypt appears. Faint distant glow (300px range) aids discovery.
- **Crypt zone** (`src/core/ZoneRegistry.ts`): `secret_crypt` — 1 room, crypt biome (dark purples `0x1a1028`), grunts + juggernauts, 3 waves before boss.
- **Room template** (`TEMPLATE_CRYPT`): ~3200×1888 playable area constrained by walls, 4 spawn zones, exit door back to tutorial.
- **Door reveal**: Bush callback pushes `DoorMarker` to template and calls `buildCurrentZoneRoom()`. Player position preserved (no teleport). Tutorial door lock only blocks hub exit (`door.targetZone === 'hub'`), not crypt door.

**Combat:**
- **Wave system**: 3 escalating waves (3→4→5 enemies, +10% HP/damage per wave). Manual wave management in Game.ts game loop (not endless arena system).
- **Cthulhu boss** (`BossId: 'cthulhu'`): 600 HP, 100px size, 1.3 speed.
  - Phase 1 (100-75%): Tentacle Swipe (120° cone, 80px range, phase-scaling +20px)
  - Phase 2 (75-50%): + Grasping Reach (400-500px line, pulls player 180px + 0.5s stun)
  - Phase 3 (50-25%): +20% swipe range, +25% grasp range
  - Phase 4 (25-0%): Double swipe, speed boost, cooldown reduction
  - Pull resolved via `resolveCollision()` so player doesn't clip walls
  - Auto-boss-spawn excluded for crypt (wave system handles it)

**Jackpot Chest:**
- `Chest.ts` updated with `isJackpot` and `locked` flags
- Locked until Cthulhu dies (`chest.unlock()` on boss death)
- Single chest at (3200, 2000), purple tint (`0xddaaff`), lock overlay with cross-circle icon
- Opens to 1000 gold + normal chest loot
- One-time per character: `SaveData.zone.cryptJackpotClaimed: boolean`

**Sprites:**
- **Cthulhu** (`public/sprites/cthulu/`): 54 individual PNGs — idle(15), walk(12), 1atk(7), 2atk(9), death(11). Loaded via `loadCthulhuAnimations()` in SpriteAnimator. `playCthulhuAnimation()` dispatches per animation name. Boss wrapper `playAnim()` updated for `CthulhuAnimName`.
- **Chest sprite sheet** (`public/sprites/chest/Chests.png`): 240×256, 5×8 grid (48×32 each), 4 variants, 2 rows per variant (mostly closed + opening). Loaded via `loadChestAnimations()`. `Chest.ts` now uses `AnimatedSprite` with idle loop and open-once animation.

**Fixes applied in session:**
- **Bush E-key interaction**: Changed from click (`checkClick()` was never wired) to E-key with `??? [E]` / `Open [E]` prompt
- **Vendor/stash zone guard**: Added `this.zoneManager.zoneId === 'hub'` to proximity checks (prevents phantom prompts in tutorial)
- **Player position on bush reveal**: Save/restore `player.x/y` around `buildCurrentZoneRoom()` (was teleporting to playerStart)
- **Tutorial door lock**: Only blocks hub exit, not secret crypt door
- **Cthulhu auto-spawn**: Added `zone.id !== 'secret_crypt'` guard in auto-boss-spawn check
- **Item icons**: Added `Sprite` + `getItemTexture` rendering to InventoryScreen equipment slots, VendorScreen, StashScreen
- **Extra projectile visibility**: Changed spread formula — `extra === 1` now uses fixed `0.08` spread instead of 0 (was invisible overlapping base projectile)
- **Support skill mana cost**: Added `this.player.mana -= result.manaCost` for Ranger projectile support skills (was missing — only monk techniques deducted mana)
- **AdditionalProjectiles from items**: IS working correctly — the stat is computed by StatSystem, read by `fireProjectile()`, and applied to all non-spread projectile skills
- **Cthulhu attack animations**: Walk/idle guard in Boss.ts now checks `!this.chosenAttack` so attack textures aren't overwritten during windup — `1atk`/`2atk` animations now play during telegraph phase
- **Normal enemy HP bars**: `applyRarity()` now called unconditionally in ZoneManager so all enemies get nameplates regardless of rarity
- **Wave zone-wide aggro**: Added `alwaysAggro` flag to Enemy class — arena and crypt wave enemies always path to player regardless of distance
- **Crypt-to-town lock fix**: `tutorialStage` no longer nulled when entering crypt from tutorial. Tutorial screen recreated on return to unfinished tutorial
- **Class select greyed-out**: Warrior and Monk cards shown at 35% alpha with grey borders. Only Ranger clickable. Disabled classes tracked via `disabledClasses` set
- **First crypt wave aggro fix**: ZoneManager.spawnEnemies() now sets alwaysAggro for tutorial and crypt zones too (not just endless wave). Tutorial and crypt enemies always path to player
- **Tutorial spawn distance**: SpawnEnemies() accepts optional playerX/playerY params. When provided (tutorial), enemies spawn 300-800px from player — not too close, not too far

**Files changed:** 15 files across 8 commits (+185 lines, added 54 sprite assets).

## Known Issues / TODOs
- Drag-to-equip not implemented (click-only equip/unequip)
- `ItemGenerator.ts` uses biased `sort(() => Math.random() - 0.5)` shuffle (minor, acceptable for small pools)
- No max orb stack size (stacks indefinitely, fine for current scope)
- Level requirements displayed but not enforced (player can equip above level)
- Endless Dungeon uses single template (no per-room rotation)
- No animation for support skills (only main ability triggers attack animation — monk techniques use executeTechnique)
- Sprites loaded from `public/` using `fetch + blob + createObjectURL` — not Vite-bundled, so no hash-based cache busting
- Monk tiger uppercut reuses dragon palm animation frames
- Monk basic_strike (slot 0) only usable via left-click or key 1 (Digit1 handler added for monk specifically)
- Class select icons are programmatic PixiJS Graphics (no SVG files)
- Weapon swapping not implemented (monk uses all techniques, no weapon slots for stances)
- Enemy sprite files must be tracked in git (case-sensitive on Linux deployment)
- Execute passive (3.0x dmg, 20% threshold) defined in SkillDefs but not wired into damage
- Ring of Blades keystone (multi_shot orbit) not implemented
- Dragon class not implemented (class select shows it greyed out)
- Jewel icons use placeholder sprite positions (needs actual jewel PNG on spritesheet)
- Bag panel in inventory is placeholder only (right third shows "Coming soon")
- Rings/amulets max 1 socket naturally — second socket reserved for future corrupted orb mechanic
- No `gloves` equipment slot exists (referenced in sizing docs but Slot type has no gloves entry)
- Socket tiles do not show on non-equipped items (vendor/stash display count but not per-socket indicators)
- **Fixed:** Item icons now show in inventory grid, equipment slots, vendor, and stash (was grid-only, now all slots)

### Phase 5j — Room Expansion & Camera System (completed 2026-06-05)
- Rooms scaled 4x (6400×3584, from 1600×896). Walls 48px (from 32px). Walkable area auto-scales.
- Player-following camera with smooth lerp (Camera.ts). Replaces fixed gameContainer offset.
- Player base speed increased from 6→8 to compensate for larger rooms.
- All room templates (22 total) scaled 4x: walls, doors, portals, spawn zones, buildings, NPCs, decorations.
- Procedural room decoration (RoomDecorator.ts): trees/rocks as collision obstacles, bushes as decoration, ambient grass/flowers. Biome-tinted sprites (forest green, desert brown, ice blue, endless purple).
- Rejection-sampling placement: ~50 attempts per object, avoids walls/doors/portals/spawn zones/buildings/other objects.
- Chests (Chest.ts): 4-8 per room, interactable with E key, open/close states, guaranteed item drop + bonus loot.
- Breakables (Breakable.ts): 8-15 per room, pots/barrels with 1 HP, destroyed by attacks and projectiles, low loot chance.
- Chest loot: `createRandomLoot(cx, cy, 3)` for gold/potions + guaranteed item + 30% second item + 15% orb.
- Breakable loot: `createRandomLoot(bx, by, 0.5)` for gold/potions + 5% item + 3% orb.
- Decoration sprites tracked in `decorationSprites[]` and cleaned up on zone transition (fixes sprite leak).
- `rectsOverlap` reused from Room.ts (no duplication in RoomDecorator).
- Camera edge-clamped post-lerp to prevent void bleed.
- Hub town shrunk to ~3200×1792 playable area (from 6400×3584) via filler walls and repositioned buildings/portals/NPCs.
- Camera supports optional `clampBounds` to constrain view to an active area within the room.
- Minimap (Minimap.ts): semi-transparent overlay at bottom-right (200×112px). Shows walls, player (white dot), enemies (red), chests (yellow), breakables (gray).
- Hub visual overhaul: detailed building facades with brick/stone textures, tiled roofs, windows with cross-bars, awnings, signs. Vendor (warm brown), Stash (cool gray slate).
- Stone pathway tiles connecting portal columns to town center (originally single-tile, widened to 3 tiles (96px) for main axes).
- Fountain at center: multi-tiered stone base with animated water spray VFX (2x scale, 8 jets + 6 droplets). Warrior statue on pedestal with sword (2.5x scale).
- Buildings have collision walls (player can't walk through Vendor/Stash).
- Stone pillars added between portals and paths at all 6 portal positions.
- Portals repositioned (left from 1750→1640, right from 4550→4680, 80×80) to avoid clipping the widened paths.
- Monster density increased 2-3x: Forest (8-14), Desert (10-18), Ice (12-20), Endless Dungeon (10-14), Endless Arena (6-10).
- **Aggro system** (Enemy.ts): each enemy type has `detectRange` and `deaggroRange`. Player enters detectRange → enemy aggros. Player leaves deaggroRange (~1.5x) → enemy de-aggros and stops in place. Grunt (400/600), Archer (500/750), Juggernaut (350/525), Cultist (450/675).
- Loading speed optimized: all 6 (+ archer, vendor, stash) animation loaders run in parallel (was sequential). Each loader's internal file fetches also parallelized. Removed console.log overhead (~50+ calls per load).
- Tutorial door: bright yellow border + "▶ Exit Town" label added. Debug logging for door lock state and collision detection.
- Archer animated sprites (archer enemy, 4 sheets at 100×100): Idle (10), Run (8), Attack (6), Death (10). Uses scale.x flip for facing, attack anim triggers on arrow fire.
- Vendor NPC animated sprite: 4 individual images (94×91 each) for idle animation.
- StashGuy NPC animated sprite: multi-row sheet (800×400, 80×80 frames) — idle (row 2, 6 frames) + wave (row 3, 10 frames). Uses custom row-sliced texture loading.
- Juggernaut sprite sheet attempt **reverted** — programmatic texture restored.

### Phase 5k — Save/Load System (completed 2026-06-05)
- **SaveManager** (`src/core/SaveManager.ts`): static class, 5 slots via localStorage keys `TinyARPG_save_0`–`TinyARPG_save_4` + `TinyARPG_meta` for slot metadata
- **Slot metadata**: character name, class, level, timestamp, zone name — stored in a single meta array
- **SaveData interface**: versioned (v1) with player state, zone state, inventory/equipment serialization
- **Serialization**: items stored as `SerializedItem` (baseId + affixId + roll), orbs as `orbId`+count. On load, `ITEM_BASES` and `AFFIXES` arrays resolve IDs back to object references. `ALL_SKILLS` export in SkillDefs.ts for skill ID resolution.
- **EscapeMenu** (`src/ui/EscapeMenu.ts`): in-game overlay, dark backdrop + centered panel. 4 buttons: Resume, Save, Settings, Save & Exit. "Game Saved!" toast appears for 90 frames (~1.5s) after save.
- **SaveSlotScreen** (`src/ui/SaveSlotScreen.ts`): 5 slot cards showing class/level/timestamp/zone. Empty slots shown as "Empty Slot" (italic). Delete button (X) per slot with confirmation dialog. Supports both 'load' and 'save' modes.
- **SettingsPlaceholder** (`src/ui/SettingsPlaceholder.ts`): visual-only panel with Audio/Graphics/Controls sections — Music Volume, SFX Volume, Quality, keybind list. Back button returns to escape menu. Labeled "(Settings are visual placeholders only)".
- **Game.ts integration**: `loadGame()`, `saveGame()`, `exitToMenu()`, `cleanupGameSession()` methods. Escape key toggles escape menu (blocks gameplay). Auto-save every 3600 frames (~60s). `toggleEscapeMenu()` cleans up settings placeholder when closing. `cleanupGameSession()` destroys all UI/game objects for clean restart.
- **MainMenu** updated: New Game (replaces "Start Game"), Continue (loads first occupied slot), Load Game (opens slot picker). Code refactored with shared `createButton()`.

### Phase 6 — More Monster Sprites (completed 2026-06-05)
- Arcner completed: 4 sheets (idle/run/attack/death, 100×100 frames)
- Grunt completed: skeleton sprites with per-animation frame sizes (idle 24×32, run 22×33, attack 43×37, death 33×32). Uses `scale.x` flip for facing, triggers attack animation on contact damage via `attackAnimPlayed` flag, plays death animation on kill.
- Juggernaut completed: orc directional sprite — 4-row sheets (south/north/east/west), 64×64 frames. Idle: 256×256 (4 cols), Walk/Attack/Death: 512×256 (8 cols). Walk sheet is 384×256 (6 cols, not 8). Uses `angleToDirection()` + `direction` field for facing (no rotation/flip). Scale 1.7. Attack triggered on contact damage, death animation plays on kill.
- **Final enemy sizes**: Grunt hitbox 36 (+30%), sprite 1.3x. Archer hitbox 34 (+20%), sprite 1.2x. Juggernaut hitbox 55 (+30%), sprite 1.7x (1.3 base × 1.3 growth). Cultist hitbox 32 (+15%), sprite 1.15x.

### Phase 5m — Hub NPC Interactions (completed 2026-06-05)
- **VendorManager** (`src/core/VendorManager.ts`): generates 8–12 random vendor items on hub entry (normal 40%, magic 40%, rare 15%, unique 5%). Pricing: `basePrice × rarityMult + affixTierBonus`. Buy = sell × 3 markup.
- **VendorScreen** (`src/ui/VendorScreen.ts`): full-screen overlay with player inventory (left, 5×6 grid) + vendor stock (right, 4-col grid). Click vendor item to buy (gold check, inventory space check). Click player item to sell. Toast messages for errors ("Not enough gold", "Inventory full"). Closes with Escape.
- **StashScreen** (`src/ui/StashScreen.ts`): full-screen overlay with player inventory (left) + tabbed stash (right). 4 tabs (Stash 1–4), 60 slots each (6×10 grid). Tab buttons switch active tab. Double-click tab name to rename via prompt. Deposit to active tab, withdraw to inventory. Toast messages.
- **Proximity interaction**: Walking within 150px of Vendor or Stash NPC shows "Press E to [trade/access stash]" prompt. E key opens respective screen. Movement blocked while open (return guard same as inventory/escape menu).
- **Stash persistence**: Stash tabs stored in `SaveData.stashData` (optional, backward-compatible). Serialized with save/load. Default 4 empty tabs created on first load.

### Phase 5l — Dodge Roll Animation (completed 2026-06-05)
- Ranger dodge roll animation: 8 individual PNGs (`roll_1.png`–`roll_8.png`) loaded via `loadRangerFrames` pattern
- `rangerRollFrames` stored separately from main ranger frame cache; `playRangerRollAnimation()` sets textures and plays once
- `Player.ts`: `isRolling` flag + `'roll'` added to `animState` type; guards idle/walk animation override during roll
- `Game.ts`: triggers `playRangerRollAnimation` + `player.triggerRollAnimation()` on dash start; restores idle via `playAnimation()` on dash end (`t >= 1`)
- Dodge roll range increased 120→144 (+20%) in `SkillDefs.ts`

### Phase 5n — Ranger Projectile Upgrades (completed 2026-06-05)
- **Projectile speed**: Base 8→10 (+25%).
- **Ranges**: Quick Shot 500→650, Multi Shot 300→390, Snipe 600→780, Spread Shot 350→455, Barrage 450→585, Poison Arrow 400→520 (+30%).
- **Arrow sprite**: Body 6×2→7×3, tip 3×2, colors brightened (`0xffee44`/`0xffcc00`). Hitbox matches 7×3.
- **Trail VFX**: Dual-layer trail — 2px gold line (`0xffee44`) + 1px white glow line (`0xffffff`), 20 frame duration (was 15). Brighter, thicker, longer-lasting.
- **Arrow impact VFX**: New `vfxArrowImpact()` — 6-ray gold starburst (`0xffcc00`) expanding from 15→25 radius + center yellow glow, 15 frames. Triggers on each enemy/breakable hit.
- **Rain of Arrows redesign**: Now creates a persistent `RainZone` AoE at target position (radius 120, duration 120 frames / 2s). Each frame: 2-3 green arrow streak VFX fall from above, pulsing ground ring indicator. Damage tick every 15 frames (`25 × 0.6 = 15` damage) + 50% slow (`slowTimer = 20`). Old zone replaced on recast (no stacking).

### Phase 7 — Polish & Expansion
- Map modifiers (affixes on map items)
- More room templates for variety
- Balance pass on difficulty scaling
- Support skill animations (buff, etc.)

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
- **Zone transitions:** doors use overlap detection (`rectsOverlap`), portals use click detection with game-local coords
- **Door visibility:** Doors are Graphics rects on the floor. Add a label (Text "▶ Exit Town") to make them visible. Keep debug logging for door collision (`Logger.log('system', ...)`) to diagnose transition issues.
- **Door Y position:** fixed at 828 (walkable area bottom) to avoid wall overlap
- **Room templates:** deep-cloned via `cloneTemplate()` to prevent mutation of shared constants
- **Endless scaling:** dungeon uses `endlessRoomCount`, arena uses `endlessWave`
- **nextRoom() null guard:** prevents softlock when a zone has no nextZone
- **Dev console DOM overlay:** Created via `document.createElement`, toggled with backtick. `pointer-events: auto` so it blocks canvas input when open. Remember `display: none` to hide.
- **Stat parenthes precedence:** In `StatSystem.ts`, `add('hpPct') || 0 + equipHpPct` has wrong precedence — must be `(add('hpPct') || 0) + equipHpPct`.
- **Enemy repulsion:** Enemies push apart in update loop. Repulsion uses `minDist` from combined widths. Must iterate with `for (const other of enemies)` including self-check.
- **Enemy projectiles:** Archer/cultist push Projectile objects to `this.projectiles[]` array. Game.ts collects and adds to container after enemy update.
- **Culling strike in Enemy.takeDamage:** Checked BEFORE damage is applied. If enemy HP is already at threshold, they die without taking damage.
- **Aggro timing:** Enemy aggro check runs per-frame in `Enemy.update()`. When de-aggroed, enemy stands still — skip all AI (including cooldown decay). This means enemies always have abilities ready when re-aggroing.
- **Wave spawning:** `spawnWave()` creates enemies in loose cluster. `waveCooldown = 120` (2s) triggers after all enemies die. Reset in `restartGame()`.
- **Unique skill effects:** skillAoePct, lifeLeechPct, fortifyOnHit, cullingStrikePct, explodeOnKillPct are unique-only affix stats on special unique items. Wired through StatSystem and combat code.
- **Orb crafting:** orbs modify `GeneratedItem` in-place (mutates `item.affixes` and `item.computedStats`). The `equipment` record holds the same reference, so `recalcStats()` picks up changes.
- **Loot stacking:** `spawnLoot()` spreads drops vertically with 25px spacing. Both `drop.y` and `drop.container.y` must be updated for correct hit detection and visual position.
- **Sprite path gotcha (GitHub Pages):** Use relative paths (`sprites/warrior/idle.png`), not absolute (`/sprites/warrior/idle.png`). Absolute paths miss the `/TinyARPG/` sub-path prefix.
- **Sprite loading:** Use `fetch + blob + createObjectURL` not `Assets.load()`. The PixiJS Assets loader had silent failures with certain PNG files.
- **Pending sprites:** `createWarriorSprite()`/`createRangerSprite()` can be called before async loading completes. Each class has its own `pending*Sprites[]` array that gets resolved when loading finishes.
- **NTFS case renames:** On Windows, `git mv IDLE.png idle.png` is a no-op. Must use two-step: `git mv IDLE.png tmp.png && git mv tmp.png idle.png`.
- **AnimatedSprite vs Sprite:** Both warrior and ranger use `AnimatedSprite`. Warrior uses sprite sheets, ranger uses individual PNG frames loaded into texture arrays.
- **onComplete callback:** Attack animation uses `sprite.onComplete` to reset to idle. Must check `animState === 'attack'` before resetting to avoid race conditions.
- **Sprite mirroring (no rotation):** Player sprite does NOT rotate. `facingAngle` stores the logical aim angle. `sprite.scale.x = -1` mirrors west-facing. All combat logic (cones, projectiles, VFX) reads `facingAngle` not `sprite.rotation`.
- **Projectile spawn offset:** Projectiles spawn 20px forward of player center (`player.x + cos(angle)*20`) so they emerge from in front of the character visually.
- **InventoryScreen destroy guard:** Click handlers in `InventoryScreen.update()` can trigger `toggleInventory()` which destroys the container. After each click handler, `if (!this.container.parent) return;` prevents processing on destroyed objects.
- **Recall portal null guard:** Walking into a recall portal sets `this.recallPortal = null` in the collision handler BEFORE `buildCurrentZoneRoom()` runs, preventing double-destroy.
- **Vendor/stash proximity zone guard:** `nearVendor` and `nearStash` proximity checks use hardcoded hub coordinates — must gate behind `this.zoneManager.zoneId === 'hub'` to prevent phantom prompts in other zones.
- **buildCurrentZoneRoom player position reset:** Always sets `player.x = template.playerStart.x`. If calling from a bush reveal or similar in-zone callback, save and restore player position or they get teleported.
- **Tutorial door lock scope:** The old check `if (zone?.id === 'tutorial' && this.tutorialStage !== 'complete')` locks ALL doors in the tutorial zone. Change to `door.targetZone === 'hub'` so secret/crypt doors aren't blocked.
- **Auto-boss-spawn + wave conflict:** `buildCurrentZoneRoom()` spawns boss when `roomIndex === roomCount - 1 && zone.bossId`. If the zone uses a custom wave system (like crypt), exclude it with `zone.id !== 'secret_crypt'`.
- **Additional projectiles visual overlap:** `extra = 1` produces `spreadAngle = 0` causing the extra projectile to overlap the base projectile invisibly. Fix: `extra === 1 ? 0.08 : (i - (extra - 1) / 2) * 0.1`.
- **Support skill mana cost:** `useSupportSkill()` for projectile types (barrage, spread_shot) was missing `this.player.mana -= result.manaCost`. Only monk techniques had it.
- **ItemIcons loading failure:** `img.onerror` resolves silently without setting `loaded = true`, so `isItemIconsLoaded()` returns `false` forever. Add `loaded = true` in catch or check `textures.size > 0` instead.
- **createSlot icon rendering:** VendorScreen and StashScreen `createSlot()` methods render only colored Graphics borders — no Sprite icons. Must add `Sprite` + `getItemTexture` similar to InventoryScreen grid slots.
- **Equipment slots lack icons:** `InventoryScreen.equipSlots` array had no `icon: Sprite` field. Must add it and render in update loop.


## Visual Polish Catalog (TinyARPG Tutorial Zone)

Ideas for visual polish and aesthetic improvement, ordered by effort tier. Most use the existing ddVfx() system, Graphics primitives, or small state additions.

### Tier 1 — Quick Wins (~1-5 lines each)

| # | Idea | Implementation |
|---|------|---------------|
| 1 | **Deepen grass tint** | Darken TilingSprite.tint from  x999999 →  x667755 |
| 2 | **Warm door glow** | Pulse a soft golden circle behind the exit arch using VFX system with maxLife: 99999, 	int: 0xffdd88, lpha: 0.15 |
| 3 | **Player hit flash** | On player.takeDamage(), tint entire screen red for 6 frames — one Graphics rect at pp.stage level, lpha: 0.15→0 |
| 4 | **Health bar low-pulse** | If healthPct < 0.3, oscillate bar color between red/dark-red using Math.sin(portalAngle * 2) |
| 5 | **Death screen fade-in** | Lerp deathAlpha from 0→0.7 over 60 frames instead of snapping instant |
| 6 | **Health bar smooth lerp** | displayedHp += (actualHp - displayedHp) * 0.1 per frame instead of snapping |
| 7 | **Mana bar smooth lerp** | Same as above |
| 8 | **Skill cooldown sweep** | Replace static black overlay with animated pie-slice using Graphics.arc() shrinking from 360°→0° |
| 9 | **Item drop bounce** | On creation, start y at -8 and lerp to   over 15 frames |
| 10 | **Chest open sparkle** | Spawn 5 gold drawCircle dots that burst outward and fade over 15 frames |
| 11 | **Gold pickup burst** | 3 tiny gold circles spread with random angles, lifetime 10 |
| 12 | **Player invuln flash refinement** | sprite.alpha = 0.5 + Math.sin(invulnTimer * 0.5) * 0.3 instead of toggle |
| 13 | **Door label shimmer** | Oscillate door label ill between #ffff88 and #ffdd44 using Math.sin(portalAngle * 1.5) |
| 14 | **Minimap fade-in** | Lerp minimap lpha from 0→0.5 over 30 frames on zone entry |

### Tier 2 — Noticeable (~30-80 lines each)

| # | Idea | Implementation |
|---|------|---------------|
| 15 | **Fireflies** | 12-16 yellow-green dots ( xccff88) drifting with independent sin/cos paths. Each has own phase, speed, wander radius |
| 16 | **Falling leaves** | 8-12 small brown/green circles spawned at top of screen with random drift + rotation, respawn at top on exit |
| 17 | **Grass sway near player** | Apply Math.sin(portalAngle) x-offset to grass/flower decorations within ~150px of player, amplitude falls with distance |
| 18 | **Light rays** | 3-4 semi-transparent trapezoids (alpha 0.03-0.06) at pp.stage level, panning slowly using portalAngle |
| 19 | **Water puddle** | Fixed ellipse at scenic spot, illColor cycles  x446688↔ x6688aa, white dot reflection drifts across |
| 20 | **Rustic signpost** | Graphics: brown post + wooden board + " TOWN" text beside exit arch, subtle sway rotation |
| 21 | **Footprint trail** | 6-8 small  x555544 ovals every ~24px of movement, circle buffer with oldest-fade |
| 22 | **Enemy death particles** | 4-6 colored circles burst outward matching enemy tint, fade over 12 frames |
| 23 | **Breakable destruction chips** | 6-8 tiny brown shards ( x8a6a3a) arc outward and fade over 15 frames |
| 24 | **Buff active auras** | Permanent VFX rings on player while buffs active: blue for fortify, red for battle rage, green for bloodlust |
| 25 | **Level-up celebration** | Golden expanding ring (0→120, 40f) + 6 orbiting gold sparkles + "LEVEL UP!" combat text |
| 26 | **Screen shake on boss attacks** | Offset gameContainer by ±3px on boss hit, lerp back over 8 frames |
| 27 | **Portal transition VFX** | Expanding ring at door + screen fade to black for 15f before uildCurrentZoneRoom(), fade back in |
| 28 | **Skill bar ready pulse** | Flash slot border gold for 6 frames when cooldown finishes via Math.sin blink |

### Tier 3 — Ambitious (~100-200 lines each)

| # | Idea | Implementation |
|---|------|---------------|
| 29 | **Day/night cycle** | dayTimer (0-3600), lerp BIOME_DATA colors toward night palette, tint sprites with lerp(0xffffff, 0x334466, nightAmount) |
| 30 | **Dynamic ground fog** | 4-6 large semi-transparent white circles drifting at floor level, each with random phase/speed/alpha |
| 31 | **Ambient wildlife** | 2-3 birds (flit tree→tree on bezier), 1-2 rabbits (hop path edges, flee on player proximity). State machine: idle→walk→flee→idle |
| 32 | **Parallax background layer** | Static Container behind gameContainer with mountain/tree silhouettes, moves at  .2 * camera.offsetX |
| 33 | **Weather system** | WeatherManager: per-biome chance table. Tutorial: clear 70%, drizzle 20%, fog 10%. Drizzle=falling streaks, fog=dim distant sprites |
| 34 | **Object pooling for VFX** | Pre-allocate 30 Graphics, track free/used, ddVfx() claims from pool, destroy returns to pool |
| 35 | **Full biome tile configs** | Create TILE_CONFIGS entries for all 6 non-tutorial biomes. Source/generate tile PNGs per biome |
| 36 | **Animated terrain features** | Ice waterfalls (falling blue-white rects), desert lava cracks (pulsing orange lines), crypt crystals (faint purple pulsing dots) |
| 37 | **Dynamic shadow drops** | Semi-transparent black ellipse below every entity at y + height/2 + 4, lpha: 0.2, scaled to entity size |
| 38 | **Tooltip fade transition** | Lerp tooltip lpha in over 6 frames, out over 4 frames instead of instant toggle |
| 39 | **NPC idle animations** | Vendor blinks (hide sprite 2f every ~4s), Stash foot shuffle (small y-bob). Driven by portalAngle + random timers |
| 40 | **Combat hit pause** | On boss kill/large death, pause game objects for 4-6 frames. Single hitPauseTimer field |
| 41 | **Dust motes** | 30-40 tiny (2-3px) semi-transparent dots scattered at pp.stage level, each with random position/speed/alpha |
| 42 | **Camera idle bob** | Subtle sinusoidal offset: offsetY += Math.sin(portalAngle * 0.3) * 1 — camera breathes |

### Tier 4 — Aspirational (~300+ lines each)

| # | Idea | Implementation |
|---|------|---------------|
| 43 | **Sprite-replaced biomes** | Commission/generate full tile-sets for every biome. Replace all programmatic sprites with actual pixel art |
| 44 | **Animated water tiles** | Cycle through 4-6 water ripple frames using sprite-sheet loader for fountain/pond areas |
| 45 | **WebGL color filters** | ColorMatrixFilter for biome grading (warm forest, cool ice, desaturate crypt). BlurFilter for background DoF |
| 46 | **Procedural tree sway** | Multi-frame sprite sheets or programmatic skew via Math.sin(portalAngle) for wind effect |
| 47 | **Screen-space reflections** | For water/ice: duplicate floor texture, flip vertically, alpha 0.2 + blue tint, below entities |
| 48 | **Dynamic fog of war** | Dark overlay with circular cutout around player, fades as player explores — Graphics mask approach |
| 49 | **Boss intro cutscene** | Pause gameplay, show boss name in large text with dramatic camera zoom toward boss, zoom back. 90f sequence |
| 50 | **Damage number juice** | Start numbers large and shrink, random horizontal drift, crits larger/orange, boss damage red with shake |

### Recommended Implementation Order

\\\
Tier 1: #1, #3, #6, #7, #4, #2, #12, #9, #10, #14  → immediate visual lift
Tier 2: #22, #27, #15, #17, #18, #25  → transforms feel
Tier 3: #29, #42, #37, #30  → deep atmosphere
Tier 4: #35, #43  → professional quality
\\\

---

## Phase 12 — Character Screen (completed 2026-06-06)

### Character Screen (C key)
- New `src/ui/CharacterScreen.ts`: full-screen overlay with two tabs (Stats / Abilities)
- **Stats tab**: Attributes (STR/DEX/INT), Offensive (8 stats), Defensive (6 stats), Utility (7 stats) — all from `Player.computedStats`
- **Abilities tab**: All 6 equipped skills in bar order. Badges: `[Melee]`, `[Projectile]`, `[Buff]`, `[Dash]`. Damaging skills show computed damage (via `Player.calcDamage()`), cooldown in seconds, mana cost. Non-damaging skills show description text.
- Tab buttons with active highlighting, click to switch. Full rebuild on tab switch.
- C key binding in Game.ts with overlay guard (blocked when inventory/tree/escape/vendor/stash open)
- Escape chain closes character screen before subTreeScreen
- Cleaned up in `cleanupGameSession()` and `restartGame()`
- Empty slots shown as "(Empty)"
- `aoe_target` effectType classified as `[Projectile]`
- Stats panel removed from InventoryScreen (was showing only 6 stats)
- `Player.calcDamage()` made public, `Player.getSkillCooldown(skill)` added

### HUD Rework (completed 2026-06-06)
- **Bottom-anchored positioning**: HUD panel at Y=974 (1080 - 100 - 6) — fixes clipping issue where MP/gold/level/XP were off-screen
- **Unified bottom bar**: Dark metal panel (`0x1a1a28`) with gold trim (`0x8a7a3a`), full-width, rounded top corners
- **HP bar** (left, 200×22px): Gold-framed rounded rect, gradient from deep crimson→bright red, smooth lerp (`displayed += (target - displayed) * min(1, 0.15 * dt)`), low-HP pulse at <30% (`alpha = 0.7 + 0.3 * sin(time * 0.15)`)
- **MP bar** (left, below HP, 200×18px): Same ornate frame, sapphire fill, smooth lerp, mana label added (was missing)
- **Right section** (X=1500): Gold (Georgia 16px gold), Level (mono 13px), XP bar (160×8px teal rounded), buff indicators (diamond + duration, max 4)
- **Zone name**: Top-center, Georgia serif 22px, gold `#ddaa55`, dark stroke
- `SCREEN_W`/`SCREEN_H` constants used throughout (no hardcoded 1920/1080 except where unavoidable)
- Division-by-zero guards on HP/MP lerp targets

### Skill Bar Rework
- Larger ornate slots (90×44px, was 85×40): dark iron bg + gold trim matching HUD
- **Radial cooldown sweep**: Pie-slice arc via `Graphics.arc()` instead of static black overlay
- **Numeric countdown**: Seconds remaining centered in slot when on cooldown
- Slots positioned via centered container at (960, 1002) within HUD panel
- `SkillManager.cooldownRemaining()` and `getBuffTimer()` used for lookups

### Enemy Nameplates
- Three-tier structure: HP bar (4px, green→yellow→red by %), name (white bold), mods (single line, rarity-colored: blue=magic, yellow=rare, joined by ` | `)
- Shown for all enemies (not just magic/rare)
- Container-based (was single Text) — proper destroy with `{ children: true }`
- Positioned 40px above sprite center-top (was 22px — raised to avoid sprite overlap)
- `getDisplayName()` maps type IDs to readable names

### Combat Text Improvements
- Optional `rarityColor` and `damageType` parameters on `showDamage()`
- Cold damage: tinted blue, Lightning damage: tinted yellow via `blendColors()` helper
- Font size scales with damage amount (14-22px, log-like scale)
- Backward compatible — existing 4-arg callers unchanged

### Minimap Reposition
- Moved from bottom-right to top-right (Y=6 instead of 1080-112-6)
- Added alpha fade lerp on update + `fadeIn()`/`fadeOut()` methods

### Tutorial Screen Fix
- Panel moved from Y=960 to Y=860 to avoid overlapping the skill bar at Y=1002

### Phase 13 — Verdant Forest Visual Upgrade (completed 2026-06-06)
- **TileConfig forest entry**: Reuses tutorial PNGs with 6 different tree sprite cells from Trees.png/Trees2.png. Rustic autumn tints applied: floorTint 0x9a8a4a, accentTint 0xaa8833, wallTint 0xb0a090, propTint 0xbb8844
- **Configurable tints**: TileConfig interface extended with optional floorTint/accentTint/wallTint/propTint fields, replacing hardcoded 0x999999 in Room.build()
- **Elevation overlay**: 5 dark + 3 light seeded ellipse blobs drawn on floor for terrain depth. Configurable via TileConfig.elevation (darkBlobs, lightBlobs, darkAlpha, lightAlpha)
- **Prop tint with variance**: RoomDecorator applies propTint ±8% random variance to tile-based trees, rocks, bushes via applyTintVariance() helper
- **CabinData interface**: New CabinData type in ZoneConfig.ts (x, y, width, height, doorSide, chestPos, spawnZones). Added cabins: CabinData[] to RoomTemplate
- **Cabin rendering**: Room.renderCabins() draws interior floor, wood walls, triangle roof, chimney, dark door opening using Graphics
- **Cabin collision**: Walls pushed to room.walls with 48px south door gap. Cabin spawn zones added to template for enemy spawning inside
- **Cabin chests**: Created at cabin.chestPos with zIndex 4
- **Forest templates**: TEMPLATE_FOREST_1 gets 2 cabins, FOREST_2 gets 1, FOREST_3 gets 1. FOREST_BOSS has none

### Phase 14 — Hub Tip, P/K Indicators, Aggro Fixes (completed 2026-06-06)
- **Hub tip overlay** (`HubTip.ts`): Semi-transparent dark overlay shown once per session on first hub entry. Text: "Portals to new zones are to the left and right of town." Closes with X key. Gameplay pauses while tip is open
- **P/K point indicators** (`HUD.ts`): Blue `P:3` text at (1700,986) — shows passive points when >0. Orange `K:1` text at (1700,1008) — shows sub skill points when >0. Hidden at 0, visible on level-up to remind player to spend
- **Crypt/tutorial zone-wide aggro**: ZoneManager.spawnEnemies() sets `alwaysAggro = true` for tutorial and crypt zones (added `zone.id === 'tutorial' || zone.id === 'secret_crypt'` to existing endless-wave check)
- **Tutorial spawn distance**: `spawnEnemies()` accepts optional `playerX`/`playerY` params. When provided, spawn position retries up to 20 times to land within 300-800px of the player

## Bug Patterns (updated 2026-06-07)
- **HUD positioning:** No longer at Y=1030 — bottom-anchored at Y=980 with BOTTOM_MARGIN=0. Flush with screen bottom.
- **SkillBar must be positioned:** Container uses relative coords (`startX = -TOTAL_W/2`). Game.ts must set `container.x = 960; container.y = 1002;` after construction.
- **Stance display gated:** `currentStance` buff only shown for `classType === 'monk'` — don't render for warrior/ranger.
- **Enemy nameplate Y offset:** `updateSprite()` positions nameplate at `this.y - this.height / 2 - 40`. If adjusting, change both the positioning offset and the mod text Y in `createNameplate`.
- **HUD.update signature changed:** Now takes `(player: Player, dt: number)` instead of just `(player: Player)`.
- **Drag-drop freeze:** Must clear `this.draggingJewel = null` and destroy the drag icon BEFORE calling `this.onSocketJewel()` — the Game.ts callback calls `inventoryScreen?.update()` which causes infinite recursion if drag state is still set.
- **Socket count display:** Use `item.socketSlots.length` for both grid sizing and loop bound, not `item.maxSockets`. A 3-socket chest shows 3 dots, not 6.
- **Socket centering:** Socket container positioned at `sy` (slot center), dots offset by `esd.h * 0.3` downward. `getSocketAtPosition()` must match the same Y offset formula.
- **Paper doll slot sizes:** 1×1=28px (rings/amulet), 2×2=56px (helm/boots), 2×4=56×112px (weapon/chest). Grid cell = 28px.
- **Inventory screen layout:** Three columns (left=grid, center=paper doll, right=bag placeholder). Grid top lined up with paper doll panel top at Y=250. Craft message at Y=930 (above HUD panel).

### Phase 15 — Socketable Jewels (completed 2026-06-07)

**Data Model:**
- `SocketSlot { jewel: GeneratedItem | null }` — per-socket state
- `GeneratedItem.socketSlots: SocketSlot[]` — actual socket contents, length = current socket count
- `GeneratedItem.maxSockets: number` — theoretical max derived from base type via `getMaxSockets()`
- `JewelItem` type added to `LootItem` union (`type: 'jewel'`)
- `JEWEL_BASE` in ITEM_BASES with `dropWeight: 0` (jewels use own drop path)

**Jewel-Only Affixes (18, 3 tiers each):**
- `dmgPerPassivePct` (of the Prodigy/Savant/Genius), `allResistancePct` (Prismatic/Iridescent/Refractive)
- `critDmgPct` (of Precision/Accuracy/the Deadeye), `minionDmgPct` (Master's/Overlord's/Warlord's)
- `onslaughtOnKillPct` (of Rush/Haste/Fury), `bleedChancePct` (of the Wound/Laceration/the Butcher)
- `hpOnHit` (of the Healer/Surgeon/Physician), `manaOnHit` (of the Font/Wellspring/Oasis)

**Socket Generation:**
- `rollSockets(maxSockets, currentSockets?)` — weighted random, exponential rarity toward max
- Chest/weapon 0-6 (30%/25%/20%/15%/7%/2.5%/0.5%), helm/boots 0-4 (35%/30%/20%/10%/5%), rings/amulets 0-1 (65%/35%)
- Drilling Orb: always rolls a different count than current
- Socket count displayed as `(N)` suffix on item nameplates

**New Currency Items:**
- `Drilling Orb` (~6% drop): rerolls socket count on an item
- `Shattering Orb` (~8% drop): removes and destroys one jewel from a socket
- `Preservation Orb` (~1.5% drop): removes one jewel and returns it to inventory
- All added to `generateOrbDrop()` weighted distribution

**Jewel Generation:**
- `generateJewel(playerLevel?)` — own rarity roll: normal 50% (1 affix), magic 30% (2), rare 15% (3), exquisite 5% (4-6)
- ~15% of item drops are jewels instead of equipment
- Affixes: 70/30 split between normal pool and jewel-only pool
- Rarity drops: normal=white, magic=blue, rare=yellow, exquisite=orange-gold (0xff8800)

**Paper Doll Equipment UI:**
- Replaced vertical slot list with classic RPG paper doll layout
- Three-column screen layout: inventory grid (left, 58px slots), paper doll (center), bag placeholder (right)
- Slot sizes: 1×1 grid cell = 28px for rings/amulet, 2×2 = 56px for helm/boots, 2×4 = 56×112px for weapon/chest
- Body silhouette removed (was causing visual clutter)
- Item name text hidden on equipped items (only slot label shows)
- Equipment icons rendered at 1.15× scale

**Socket Indicators:**
- Socket container positioned at slot center (`sy`), dots offset downward by `esd.h * 0.3`
- Grid layout: 1×N for 1-2 sockets, 2×2 for 3-4, 2×3 for 5-6
- Spacing: `(radius*2+2) * 1.1 = ~11px` per cell
- Empty sockets: dark grey (`0x333333`), filled: jewel rarity color
- Dots visible only for actual socket count (not max)

**Socketing UX:**
- Right-click jewel in inventory → toggles active, then left-click equipment slot to socket
- Drag jewel from inventory grid → drop on paper doll slot to socket
- Drag icon uses Sprite with texture fallback, destroyed on drop or cancel
- Drag-drop clears drag state BEFORE invoking callback to prevent recursive update crashes

**Stat Integration:**
- `recalcStats()` iterates socketed jewel affixes via `item.socketSlots`
- New stats in StatSystem: `allResistancePct`, `critDmgPct`, `minionDmgPct`, `onslaughtOnKillPct`, `bleedChancePct`, `dmgPerPassivePct`, `hpOnHit`, `manaOnHit`
- HP on hit and Mana on hit applied in `Player.applySkillDamage()` after leech/fortify

**Tooltip:**
- Items show "Socketed Jewels" section with each jewel's name (rarity-colored) and affixes
- Stat summary merges item stats + socketed jewel stats for combined total
- Full stat label cleanup: 37 entries replacing 14, every stat key gets a clean label

**Save/Load:**
- `SerializedItem.socketSlots?` added for backward-compatible socket persistance
- `serializeSlots()` helper recursively serializes socketed jewels
- `deserializeItem()` restores sockets with fallback to empty array
- Vendor and stash display socket count suffix and socket indicator dots

**UI Alignment:**
- HUD panel flush with screen bottom (BOTTOM_MARGIN=0, panel at Y=980)
- Bag placeholder centered in right third at X=1510
- Craft message at Y=930 (clear of HUD)
- P/K indicators at X=1650 (clear of minimap at X=1714)
- Inventory grid top (250) lines up with paper doll panel top
- Paper doll content centered in panel (adjusted dy values by +56)

**Sprite Mappings (ItemIcons.ts):**
- Jewel icons: `jewel_normal`/`jewel_magic`/`jewel_rare` at placeholder (col 11-13, row 0)
- New orb icons: `drilling`/`shattering`/`preservation` at (col 11-13, row 1)

### Phase 16 — Gold Float Text + P/K Circle Indicators (completed 2026-06-07)

**Gold Float Text (Idea #4):**
- Gold pickup now shows `+X` floating text in gold color (`0xffd700`) at the gold pile's position
- `CombatText.showDamage()` accepts `string | number` for the amount parameter to support `+` prefix

**P/K Circle Indicators:**
- Replaced plain `P:{n}` / `K:{n}` text with stylized solid circle indicators
- Main circle (radius 14): P uses blue-grey `#8888cc` with `#5a5a7a` border, K uses orange `#cc8844` with `#997744` border
- White bold letter centered on each circle
- Red notification badge (radius 9, `#dd3333` with `#aa2222` border) at top-right offset showing unspent point count
- Both circles hidden when 0 points (same as before)
- Clicking circles opens respective screen (passive tree / skill sub tree) with overlay guards matching hotkey behavior
- Hotkeys P/K remain functional

### Phase 17 — Dark Fantasy UI Visual Overhaul (completed 2026-06-09)

- **index.html**: Google Fonts (Cinzel, MedievalSharp, Uncial Antiqua), scrollbar styling, low-HP red vignette DOM overlay
- **DeveloperConsole.ts**: Dark parchment `rgba(10,8,5,0.92)` with `backdrop-filter: blur(4px)`, gold/bronze styling
- **HUD.ts**: Chamfered panel with gold glow, gradient HP bars (`#6b0000→#cc2200→#ff4400`) and MP bars (`#1a0a4e→#5555bb`), shimmer flash on change, hexagon gem P/K indicators, gold ruled dividers, low-HP vignette relay to DOM
- **SkillBar.ts**: Chamfered octagonal stone sockets, bronze borders, pulsing gold glow ring, gold shimmer edge on cooldown sweep arc
- **Minimap.ts**: Runic border ticks, corner arc ornaments, pulsing gold player dot with outer glow ring, edge vignette
- **BossHpBar.ts**: Gradient fills per boss (golem=gold, reaper=purple, cthulhu=green), outer gold glow, bronze trough frame
- **Tooltip.ts**: Dark parchment `0x0a0810`, drop shadow, gold ruled dividers, scalloped decorative top edge, rarity borders with inner bronze frame
- **EscapeMenu.ts**: Chamfered panel, corner ornaments, fade-in + scale animation (0.95→1), gold hover on buttons
- **DeathScreen.ts**: Cinzel crimson "You Died", pulsing ember glow button, dark vignette borders, chamfered button
- **CharacterScreen.ts**: Dark parchment panel, gold active tab with bottom bar, gold ruled section dividers, updated fonts
- **All remaining UI screens**: Fonts `'Georgia, serif'`→`'Cinzel, serif'`, `'monospace'`→`'MedievalSharp, serif'`/`'Uncial Antiqua, serif'`. Colors: panel backgrounds→`0x0a0810`, borders→`0x6b4c1e`, text→`#e8dcc8`/`#f0c060`. Affected: Inventory, MainMenu, PassiveTree, HubTip, Settings, Vendor, Stash, ClassSelect, AbilitySelect, SaveSlot, SkillSubTree, Tutorial
- **Entity labels**: CombatText, ItemDrop, Enemy nameplates, Room door/portal/building labels, SecretBush/Chest prompts — all updated fonts/colors
- **29 files changed, +1025/−339 lines**

### Phase 18 — Performance Optimization (completed 2026-06-09)

**Critical fixes (bugs):**
- **SkillBar.ts**: Added `slot.glow.clear()` before glow redraw — fixed unbounded geometry accumulation (3600+ shapes/slot/minute leak)
- **CharacterScreen.ts**: Replaced full `rebuild()` every frame with dirty-flag snapshot comparison — only rebuilds when stats change
- **InventoryScreen.ts**: Cached TextStyle objects by fill color via `slotStyleCache` Map — eliminated 37 allocations/frame (2,220 GC-eligible objects/min)

**High impact:**
- **HUD.ts**: Pre-allocated 4 buff Text objects instead of `removeChildren()` + `new Text()` per frame
- **HUD.ts**: Cached `vignetteEl` DOM reference in constructor (was `getElementById` 60×/s)
- **HUD.ts**: Dirty flags for HP/MP gradient redraws — only redraw when >0.5% change
- **HUD.ts**: Text dirty flags for all 7 labels — skip `.text` assignment when value unchanged
- **HUD.ts**: Snap lerp target when converged (< 0.001) — prevents perpetual micro-delta
- **HUD.ts**: Shimmer clear only when visible (skip redundant `clear()`)
- **Minimap.ts**: Split static wall layer from dynamic entity layer — walls redrawn once per room change instead of 60×/s

**Medium impact:**
- **BossHpBar.ts**: Pre-computed gradient stops per bossId, dirty-checked fill width, boss name set once
- **Game.ts**: Zone name guard, interact prompt reuses Text with visibility toggle + position dirty check
- **Game.ts**: `visibilitychange` handler pauses PixiJS ticker when tab hidden
- **EscapeMenu.ts**: Pre-created hover/normal TextStyles (was alloc per hover event)
- **SkillBar.ts**: Skill name/keybind set only on skill ID change, glow alpha redraw quantized (>0.02 delta)

**8 files changed, +352/−124 lines**

### Phase 19 — Warp Stone System (completed 2026-06-09)

**Naming**: Warp Stone (item), Warped (status), Warping (verb)

**Data layer:**
- `GeneratedItem`: Added `warped`, `warpOutcome`, `warpImplicit` fields (backward-compatible defaults)
- `SerializedItem`: Matching serialization in SaveManager + Game.ts serialize/deserialize
- `WARP_STONE_CONFIG`: Tunable outcome weights, socket caps, stat surge ranges
- `WARP_IMPLICITS`: 34 corruption implicits across all 6 eligible slot types (ring, amulet, helmet, boots, weapon, body)
- `generateOrbDrop()`. ~6% drop chance for Warp Stone

**7 outcomes:**
1. Warped Implicit (30): Replace innate stats with a corruption implicit
2. Warp Chaos (20): Full affix reroll (4-6 new affixes, any rarity→rare)
3. Extra Socket (15): +1 socket (capped per type, ring/amulet→2, helmet/boots→4, weapon/body→6)
4. Stat Surge (10): Boost a random affix by 20-50%
5. Rarity Shift (10): Normal→Rare (4 affixes), Magic→Rare (fill to 4-6), Rare→Warp Chaos
6. Double Warp (5): Two non-duplicate outcomes (not #6)
7. No Change (10): Just marks as Warped

**Guards:**
- All existing orb/socket methods check `item.warped` and return false
- Unique items rejected (same as all other orbs)
- No slot-based restriction — works on all 7 equipment slots
- Confirmation modal in InventoryScreen before applying
- Warped items display "WARPED" tag in crimson + outcome description
- Warp implicit (if present) shown in purple italic above affixes

**34 warp implicits:**
- Ring (6): berserker/vitality/leeching/swiftness/evasion/frostbite
- Amulet (6): omniscience/treasure/recovery/deep/endurance/longevity
- Helmet (6): explosions/precision/clarity/fortification/rage/bolts
- Boots (4): surefooting/hunt/flames/gale
- Weapon (6): carnage/storm/pyre/frost/reaper/haste
- Body (6): colossus/stone/iron skin/fortification/leeching/vitality

**Files changed:** 7 files, +298 lines (+17 in follow-up fix)

### Phase 20 — Dynamic Item Names, Live Tooltips & Corruption Styling (completed 2026-06-09)

**Fix 1 — Dynamic Item Naming:**
- Extracted `generateItemName(item)` as exported pure function from `ItemGenerator.ts` — deterministic name from affixes on every read
- `GeneratedItem.computedName: string` → `customDisplayName?: string` (only set for uniques and Exquisite jewels)
- All display reads use `generateItemName(item)`: Tooltip.ts, InventoryScreen.ts, ItemDrop.ts, Game.ts serialize/deserialize
- Backward-compatible: `customDisplayName` is optional, old saves deserialize gracefully

**Fix 2 — Live Tooltip Reactivity:**
- Identity guard replaced from reference check to ID-based (`tooltipItemId`), prevents per-frame rebuild while allowing mutation-triggered refresh
- `forceRefreshTooltip()` public method on InventoryScreen
- All 5 mutation callbacks in Game.ts (craft orb, craft orb grid, socket, drill, unsocket) call `forceRefreshTooltip()` after `update()`

**Fix 3 — Corruption Zone Visual Identity:**
- New corruption section in tooltips (both Tooltip.ts shared and InventoryScreen.ts inline): purple header `#9966cc`, `⬡` glyph prefix, italic purple `#b060e0` stats
- Purple tinted background `rgba(80,0,120,0.15)` behind corruption rows
- Purple multi-line gradient divider above corruption zone
- CORRUPTED tag: crimson `#8b1a1a`, Cinzel bold with letter spacing
- Hidden entirely on non-warped items (`if (item.warped)` guard)
- Old "WARPED" tag and placement above affixes removed

**Files:** 5 source files (+148/−56), 7 implementation commits + plan file

### Phase 20b — CORRUPTED Tag Gating (completed 2026-06-09)
- CORRUPTED red tag now only shows for `no_change` warp outcome (the one that purely taints the item)
- Other outcomes (warped_implicit, warp_chaos, extra_socket, etc.) show the corruption zone with outcome description but no crimson label — the item's visible changes are sufficient feedback

### Phase 21 — Summoner Class (completed 2026-06-09)

**Core Systems:**
- New `ClassType: 'summoner'` with INT primary stat (minion damage = `20 × skillMult × (1 + INT × 0.01)`)
- 6-slot skill bar: pick 1 of 4 main abilities + 5 fixed support skills
- `'summon'` and `'channel'` effectTypes added to SkillDef interface
- 3 new files: SummonerSkillDefs.ts, Minion.ts, SoulVaultScreen.ts (+509 lines)
- 14 modified files (+1229/−15 total across all commits)

**Main Abilities (slot 0, pick 1 of 4):**
1. Bone Spear — projectile_pierce, mana 10, cd 0.5s, dmgMult 1.2, pierces 2
2. Soul Drain — channel, mana 15, cd 3s, 4 ticks, heals 50% to self+minions
3. Corpse Explosion — aoe_target, mana 20, cd 0.8s, 15% corpse maxHP, 120px radius
4. Command Wrath — buff, mana 25, cd 8s, +30% minion dmg/atk speed 4s

**Support Skills (Key 2-6, fixed):**
1. Raise Skeleton — summon, mana 25, cd 4s, max 3 permanent skeleton warriors (60 HP, 8 dmg)
2. Summon Skeleton Mage — summon, mana 30, cd 8s, max 2 temporary mages (15s, 40 HP, 10 dmg, ranged)
3. Bone Armor — buff, mana 20, cd 15s, +30% DR self, +15% DR minions, 6s
4. Death Mark — debuff, mana 15, cd 6s, +25% damage taken on target, 8s
5. Flesh Offering — buff, mana 10, cd 2s, consumes corpse, +40% atk speed/+20% dmg to minions, 6s

**Minion Entity (src/entities/Minion.ts, 221 lines):**
- Three types: skeleton_warrior, skeleton_mage, spectre
- AI: combat mode (chase nearest enemy within 600px) + follow mode (formation around player)
- Movement: sinusoidal wobble, repulsion from other minions, wall collision
- Mages fire magic projectiles via `wantsToFire` flag (checked by Game.ts)
- Timed minions (mages) auto-expire at lifetime end

**Spectre System:**
- 4% soul drop on enemy death (scaled by magic find), cyan-blue nameplate "Soul of Grunt/Archer/etc"
- Right-click to capture (soul vault limit 8)
- Soul Vault (V key): full-screen overlay, 8-slot grid + active spectre slot
- Spectre inherits source enemy type's base stats (HP, damage, speed) with level scaling
- `summonSpectre()`: scales stats by `(1 + levelDiff × 0.05) × minionDmgMult × minionHpMult`
- Save/load persistence with backward-compatible optional fields

**Passive Tree:**
- `minionDmgPct` / `minionHpPct` added to NodeEffects interface
- 4 minion nodes in Sorcery Branch (branching from Archmage):
  - Bone Lord (+5% minion damage), Necrotic Power (+10%), Soul Weaver (+15% dmg, +10% life), Bone Plating (+10% life)

**Sub Skill Trees (4 trees × 12 nodes, 1 point per 4 levels):**
- Bone Spear: Bone Barrage (+2 proj), Marrow Seekers (homing), Shattering Impact (-15% armor), Ossified Volley (4th shot crits)
- Soul Drain: Life Siphon (100% heal), Essence Theft (mana restore), Shared Torment (chain +1), Unending Feast (+2 ticks)
- Corpse Explosion: Chain Reaction (chain 3), Necrotic Cloud (4s poison), Desecrate (spawn corpses), Overkill (+50% dmg, +40px)
- Command Wrath: Inspiring Presence (+15% move), Shared Fury (extend on hit), War Drums (-2s cd), Blood Pact (HP cost, +50% dmg)

**Stats & Items:**
- `minionHpPct` stat added to StatSystem (base + equipment pipeline)
- 3-tier minion life affixes: Reanimating (10-18%), Necrotizing (18-28%), of the Lich (28-40%)
- Summoner uses projectileDmgMult for calcDamage (like ranger), INT as primary stat (like monk)

**Game Loop Integration:**
- `minions: Minion[]` array in Game.ts with per-frame update loop
- Corpse tracking: `recentCorpses[]` with 5s timeout, max 8 corpses
- `findNearestEnemy()` helper for mage projectile targeting
- Minion death cleanup on zone transitions and session cleanup
- Channel skill support (reuses monk's `channeling`/`channelTimer` infrastructure)
- V key binding for Soul Vault (guarded against other open UIs)
- Right-click capture via `input.consumeRightClick()`

**Character Screen:**
- `[Summon]` badge (purple `#8844cc`) and `[Channel]` badge (cyan `#66ccff`)

**Summoner Animated Sprites (crow):**
- `public/sprites/summoner/crow_idle.png` (256×64, 4 frames)
- `public/sprites/summoner/crow_walk.png` (256×64, 4 frames)
- `public/sprites/summoner/crow_attack.png` (320×64, 5 frames)
- Custom loader `loadSummonerSheet()` with 64×64 frame slicing (vs default 96×84)
- `createSummonerSprite()` / `isSummonerLoaded()` — follows warrior/warrior pending pattern
- Loaded during startup `Promise.all` alongside other animation sets

**Minion Idle Clumping Fix (completed inline):**
- Root cause: all minions targeted identical position `(playerX, playerY + 80)` during idle, with wobble + repulsion pushing past the 10px stop threshold every frame, creating perpetual oscillation
- Formation system: persistent angular slots via golden-angle distribution (`minionId × 2.39996 % 2π`)
- Type-based radii: warriors 50px, mages 90px, spectres 65px
- Arrival hysteresis: 20px threshold to arrive, 40px threshold to re-engage
- `isIdleArrived` flag stops movement commands once settled; cleared on enemy detection
- Repulsion push under 40px is ignored by idle minions
- `formationAngle` assigned once on first idle, persists across combat cycles

**19 files changed across 3 commits, 19 design/plan files also created

### Phase 22 — Cursed Urns League Mechanic (completed 2026-06-09)

**New Files (3):**
- `src/core/CurseMods.ts` — 14 curses across 3 tiers, weighted no-duplicate selection
- `src/core/UrnConfig.ts` — 5 urn types (Reliquary/Miser/Casket/Alchemist/Vault), rarity/spawn config
- `src/entities/CursedUrn.ts` — Procedural Graphics urn (3× chest size, 72×60px), world-space info panel, smoke VFX, E-key interaction, currency upgrades

**Urn Types & Visuals:**
- Reliquary of Arms (gunmetal, iron banding, sword motif) → Weapons & Armour loot
- Miser's Coffer (tarnished gold, coin reliefs) → Currency & Crafting loot
- Casket of Adornments (deep violet, gem inlays) → Rings/Amulets/Jewellery loot
- Alchemist's Vessel (sickly green, bubbles) → Consumables loot
- Vault of the Forgotten (bone white, rune carvings) → Mixed Rare Items loot

**Rarity System (60/30/10):**
- Normal (white, 1 curse, standard loot)
- Magic (blue, 2 curses, +1 item)
- Rare (gold, 3-4 curses, generated name, significantly boosted loot)

**14 Curses (3 tiers):**
- Tier 1: Sluggish (-30% move 25s), Drained (-25% mana regen 30s), Rattled (-20% dodge 30s), Blurred (reduced vision 20s)
- Tier 2: Bleeding (5 HP/s DoT 20s), Weakened (-35% dmg dealt 25s), Brittle (+40% dmg taken 20s), Flask-Cursed (no flasks 15s), Chilled (-50% atk speed 15s)
- Tier 3: No Regeneration (30s), Marked (aggro all enemies), Shattered Flask (clear potions), Soul Taxed (-20% HP), Hexed (-30% all res 25s)

**World-Space Panel:**
- Below-urn info panel (enemy nameplate pattern), shows name (rarity-colored), loot category (muted gold), ◈ curse mods (crimson, tier-3 pulsing)
- Panel fades in/out on proximity, updates live on currency apply

**Currency Upgrades:**
- Mutation (normal→magic, +1 curse), Ascendance (normal→rare, 3-4 curses)
- Growth (magic reroll all), Empowerment (magic→rare, +1 curse)
- Orb targeting via right-click in inventory → activeOrb → E-key while near urn

**Save/Load:**
- Opened urns serialized per zone (`SerializedUrn[]` in `SaveData.zone.urns`)
- Restored on load, closed urns regenerated fresh

### Bug Fix Batch 1 — Minimap, Soul Vault, Summoner Gating (completed 2026-06-09)

**Fix 1 — Minimap Readability:**
- Removed `cursor: crosshair` from canvas CSS (was rendering unintended X/cross over minimap)
- Lightened background from `0x05030a` (near-black) to `0x14100c` (warm dark brown, 0.75 alpha)
- Reduced vignette from 8 heavy layers to 4 subtle ones, removed edge bars
- Adjusted wall color to `0x1a1612` for clear contrast against floor
- Chests/urns: unified pale blue `0x88ccff` dots, radius 2→3 for visibility
- Enemies: radius 2→3, alpha 0.75→0.85
- Player: added soft white outer glow, radius 3→4
- Added door/exit white pulsing dots

**Fix 2 — Soul Vault Toggle:**
- Root cause: V-key dedup via `lastKeys` caused permanent deadlock — `handleSkillKeys()` never runs when vault is open, so `KeyV` stayed in `lastKeys` forever
- Replaced `!lastKeys.has('KeyV')` with proper `wasVKeyDown` debounce flag
- Added soul vault to Escape priority chain as highest-priority close target

**Fix 3 — Summoner Gating:**
- Soul vault screen creation gated to `classType === 'summoner'`
- V key handler gated to `classType === 'summoner'`
- Soul drops on enemy kill gated to `classType === 'summoner'`
- Right-click soul capture gated to `classType === 'summoner'`

### Phase 22b — Cursed Urn Gameplay Loop Rework (completed 2026-06-09)

- **Enemy spawn on open**: 6-10 enemies (scaled by urn rarity) spawn in a ring around the urn
- **Staggered spawn**: Enemies deploy one at a time over 0.8s via spawn queue
- **Spawn positioning**: Ring pattern 80-200px radius with wall/player collision validation
- **Kill tracking**: `UrnSpawnGroup` in Game.ts tracks totalSpawned/totalKilled per urn
- **Loot gated on clear**: Loot only drops after all urn enemies are killed, drops at urn position
- **Urn enemies drop no loot**: `dropsLoot = false` + gate in death loop; 50% reduced XP granted
- **Urn fade-out**: Container alpha 1→0 over 1.2s on clear, then removed from world
- **Urn state machine**: `idle` → `active` (enemies fighting) → `cleared` (fading)
- **Save/load**: Only cleared urns saved; opened-but-uncleared urns reset on zone re-entry
- **Enemy fields**: `spawnSource`, `urnId`, `dropsLoot`, `xpMultiplier`, `spawnAnimTimer`
- **Spawn-in animation**: Enemies scale from 0→1 over 200ms, preserving rarity scale

**Files changed:** Enemy.ts (+5 fields, +17 lines), CursedUrn.ts (state machine, fade, id), Game.ts (+234 lines)

### Phase 22c — Hub Zone Cleanup: No Chests or Urns in Town (completed 2026-06-09)

- Procedural chests (`decor.chests`) in `buildCurrentZoneRoom()` now gated behind `zone.id !== 'hub'`
- Cursed urn spawning (`spawnUrns()`) in `buildCurrentZoneRoom()` now gated behind `zone.id !== 'hub'`
- Breakables (pots/barrels) deliberately left in hub for visual flavor
- Cabin chests were already hub-excluded (hub template has `cabins: []`)

### Phase 23 — World Map & Portal Discovery System (completed 2026-06-09)

**Data Layer:**
- `src/core/WorldMapData.ts` (new, ~152 lines): Pure data file with `WORLD_MAP_REGISTRY` — 9 zones with percentage map positions, connections, icon types, descriptions, act groups, and mutable discovered state. Helper functions: `getDiscoveredZoneIds()`, `restoreDiscoveries()`, `getDiscoveredCount()`, `getTotalZoneCount()`. Map zone IDs to world spawn coords via `ZONE_PORTAL_POSITIONS`.
- `ZoneType`: `'hub' | 'dungeon' | 'arena' | 'boss' | 'secret' | 'dev'`
- `MapIconType`: `'town' | 'dungeon' | 'forest' | 'desert' | 'ice' | 'arena' | 'secret' | 'dev'`

**Town Hub Rework:**
- Removed all 6 side portals from `TEMPLATE_HUB` (left: tutorial/forest/desert, right: arena/ice/dungeon)
- Added 1 central portal at `(3150, 1900)` — 100x100, label "World Map", south of fountain on central path
- HubTip text updated: "Use the central portal to open the World Map"

**Zone Portal Placement (8 zones, boss/final rooms):**
- Tutorial: `(3160, 3160)` — above exit door. Forest Boss: `(3160, 1752)`. Desert Boss: `(3160, 1752)`. Ice Boss: `(3160, 1752)`.
- Arena: `(3160, 460)` — top-center, replaced old Exit at (6000,128). Dungeon: `(3160, 460)` — same.
- Crypt: `(3160, 1460)`. Dev: `(3160, 1752)`.
- All zone portals are 80x80, label "Portal". Old arena/dungeon exit portals repurposed.

**Portal Rendering (Room.ts):**
- Undiscovered portals: greyscale circle `0x555555`, no inner circle, container alpha 0.6, "???" label (MedievalSharp, #555555)
- Discovered portals: purple circles (outer `0xaa66ff`, inner `0xcc88ff`), zone name label (Cinzel, 0xc8963e)
- Removed old chain/lock overlay system and `isPortalUnlocked` callback from Room constructor
- Added `portalGraphics: Graphics[]`, `portalContainers: Container[]`, `discoveryTransitions` arrays
- `startDiscoveryTransition(index)`: clears container, rebuilds with discovered visuals (purple circles, proper label), lerps alpha 0.6→1.0 over 48 frames (~0.8s)
- `updateDiscoveryTransitions(dt)`: per-frame alpha advancement, safe backward iteration

**PortalMarker** in `PortalMarker` interface gained `discovered?: boolean` field (ZoneConfig.ts).

**Discovery Notification (new: `src/ui/DiscoveryNotification.ts`, ~155 lines):**
- State machine: idle → sliding_in (15f, ease-out) → visible (210f) → sliding_out (12f, ease-in) → gap (30f) → idle
- Position: screen (1648, 126), 260×80 panel below minimap
- Content: "✦ Portal Discovered" (Cinzel 14 gold), zone name (Cinzel 18 white), "Added to your World Map" (MedievalSharp 11 tan)
- Golden shimmer sweep (260×4 line, 0xf0c060 at 30% alpha) over first 24 frames
- Queue system: one at a time, 0.5s gap between. Double-destroy guard, child destroy on rebuild.

**World Map Overlay (new: `src/ui/WorldMapScreen.ts`, ~630 lines):**
- Full-screen overlay (1200×800 panel centered), game does NOT pause under it
- Parchment sepia background `0xc8a96e` with aged stain ellipses, edge burn, ornate double border (bronze+gold), corner diamond ornaments
- Drifting mist: 5 dark circles oscillating over undiscovered regions via sin/cos
- Header: "World Map" (Cinzel 28 gold), ruled line with diamond, "X / Y Zones Discovered" subtitle, close button top-right
- Zone nodes at percentage map positions: 8 icon types drawn via Graphics (town lantern, dungeon arch, forest tree, desert pyramid, ice snowflake, arena swords, secret eye, dev gear), golden glow for discovered, 20% opacity grey for undiscovered with "???"
- Connection lines: bezier curves between connected zones, warm sepia ink for discovered, dim grey for undiscovered, 400ms fade-in animation
- Current zone: pulsing gold ring + "You are here" label
- Hover tooltip: 160×50 card with zone name + type badge
- Travel confirmation: node pulse + panel with [CONFIRM]/[CANCEL], confirm triggers teleport callback
- Close animation: 150ms fade-out. Uses singleton Text objects (no per-frame allocation) and removeAllListeners() on confirm button.

**Game.ts Integration:**
- Proximity discovery: 80px radius auto-trigger on `updateGameplay()` each frame
- Portal click: discovered portals → `openWorldMap()`, undiscovered → ignored
- `openWorldMap()`: creates `WorldMapScreen` with teleport confirm/close callbacks
- `initiateTeleport(targetZoneId)`: exit VFX (expanding purple circle, 30f), `zoneManager.transitionTo()`, `buildCurrentZoneRoom()`, player spawn at `ZONE_PORTAL_POSITIONS[zoneId]`, entry VFX (contracting circle, 30f), 90-frame spawn invulnerability
- World map input guard: runs world map screen + `updateGameplay()` (enemies move, DoTs tick), blocks player input
- Escape handler: closes world map before soul vault / vendor / stash / character screen
- Room portal discovered state synced from `WORLD_MAP_REGISTRY` before Room construction
- `updateDiscoveryTransitions(dt)` called per frame
- Dev console: `/discover <zoneId>` command for testing

**Save/Persistence:**
- `SaveData.zone.discoveredZones?: string[]` — stored as array of discovered zone IDs
- On `saveGame()`: `getDiscoveredZoneIds()` serialized
- On `loadGame()`: `restoreDiscoveries(data.zone.discoveredZones)` restores state
- Old saves without `discoveredZones` load correctly — default-discovered zones (hub, tutorial, endless modes, dev) handled by registry defaults

**Minimap:**
- Portal markers added: discovered portals = cyan dots (`0x88ccff`, radius 3), undiscovered = grey dots (`0x555555`, radius 2)
- Update signature extended with optional `portals` parameter

**Files changed:** 3 new files (+903 lines), 8 modified files (+302/−75). 13 commits across all subsystems.

### Phase 24 — World Map Bug Fixes (completed 2026-06-09)

**Fix 1 — Travel Confirmation Buttons** (WorldMapScreen.ts + Game.ts):
- **Root cause**: Double-offset bug — `confirmText.x` was set to absolute screen coords within the container, AND the container was positioned at the same absolute coords, rendering buttons at 2× their intended position (off-screen at x=1960). Additionally, `removeAllListeners()` in `showConfirmation()` wiped the constructor's `pointerdown` handler.
- **Fix**: Text children use local coords (x=0), containers positioned with absolute screen coords. `pointerdown` handler re-attached after `removeAllListeners`. `hitArea` added for comfortable clicking. Enter/NumpadEnter confirms travel, Escape cancels selection before closing the map.

**Fix 2 — Overlapping Tooltips/Popups** (WorldMapScreen.ts):
- **Root cause**: `selectNode()` showed a new confirmation without clearing the previous state. Hover tooltips remained visible when a confirmation popup was active.
- **Fix**: Added `clearSelection()` — resets selected zone, clears popup/tooltip graphics, deselects hovered node, stops node pulse animation. Called at start of `selectNode()`, on `close()`, on cancel. `updateHover()` returns early when a selection is active.

**Fix 3 — Verdant Forest Unlocked By Default** (WorldMapData.ts + Game.ts):
- **Root cause**: `forest.discovered` was `false` in `WORLD_MAP_REGISTRY`. No migration path for existing saves.
- **Fix**: Set `discovered: true` on `forest`. Added `DEFAULT_DISCOVERED` constant. `restoreDiscoveries()` now always merges defaults with saved discoveries. Save loader calls it unconditionally (even for old saves missing the field).

**Fix 4 — Door Zone Connectivity** (RoomTemplates.ts):
- **Root cause**: All boss room exit doors pointed to `hub`, breaking linear progression (forest→desert→ice). Forest boss door and desert boss door both went to hub.
- **Fix**: Forest boss door → `'desert'`, Desert boss door → `'ice'`. Preserves dungeon crawl flow independent of world map.

**Fix 5 — Secondary Font** (WorldMapScreen.ts, DiscoveryNotification.ts, index.html):
- **Root cause**: `MedievalSharp` was illegible at small sizes (9-10px) for secondary map text.
- **Fix**: Added **Sorts Mill Goudy** to Google Fonts import. Replaced all `MedievalSharp` text on the world map and discovery notification with `Sorts Mill Goudy` at updated sizes (zone labels 13px, tooltip name 16px, tooltip badge 12px, confirmation 15px, buttons 14px with letterSpacing, counter 12px, "you are here" 11px italic). `Cinzel` kept for title/heading only.

**Files changed:** 6 files (+113/−43) across 1 commit.

