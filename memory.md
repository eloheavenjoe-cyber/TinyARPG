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
    Game.ts                   State machine, game loop, dev console wiring, projectile management, zone transitions
    ZoneConfig.ts             Zone definitions, biome data, room template types, ZONE_REGISTRY
    ZoneManager.ts            Zone state, transitions, enemy spawning, endless scaling
    ZoneRegistry.ts           ZONE_REGISTRY building (combined ZoneConfig types + RoomTemplates values, breaks circular dep)
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
    Room.ts                   1600×896 room, wall collision resolver, biome-aware floor/walls, door/portal markers, buildings, NPCs, decorations
    RoomTemplates.ts          Pre-defined room layout templates (5 base + hub/tutorial/arena/dungeon/dev + 12 story zone + buildings/NPCs)
  rendering/
    Sprites.ts                Programmatic pixel-art textures (player, enemy, archer, cultist, juggernaut, floor, wall)
    SpriteAnimator.ts         Sprite sheet loader + frame slicer + animation manager (warrior, ranger, reaper, golem, monk, cultist, archer, vendor, stash animated sprites)
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
- Room constructor accepts `(biome, doors, portals, decorations, buildings, npcs)` — all optional with defaults
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
- Skill bar: 6 slots at Y=1030 (bottom-center)
- HUD: bottom-left at (18, 1030)
- Player base HP: 100, base mana: 50, base speed: 6
- Enemy HP: 40, speed: 2.2, XP: 10
- Inventory: 30 slots (5×6 grid), slot size 50px
- Equipment: 7 slots (Weapon, Body, Helmet, Boots, Ring, Ring2, Amulet)
- Orb drop rate: ~5% (× itemQuantityMult), item drop rate: ~40% (× itemQuantityMult)
- Portal scroll drop rate: ~8% (× itemQuantityMult)
- Enemy types: Grunt (40 HP, 2.2 spd, 10 XP), Archer (25 HP, 2.5 spd, 12 XP), Juggernaut (120 HP, 1.2 spd, 25 XP), Cultist (35 HP, 2.0 spd, 15 XP)
- Enemy speed variance: ±15% (0.85-1.15 of base)
- Wave size: 3-6 enemies, 2s delay between waves
- Unique skill effect sources: Titan's Reach (sword), Blood Amulet (amulet), Herald of Ruin (ring)
- Dev console: backtick toggle, DOM overlay, command history + autocomplete
- Sprite sheet frames: 96×84 each, dynamic count from image width / 96
- Magic Find affixes: prefix only, 3 tiers (8-15%, 16-25%, 26-40%)
- Item Quantity affixes: suffix only, 3 tiers (8-12%, 13-20%, 21-30%)

## Known Issues / TODOs
- Drag-to-equip not implemented (click-only equip/unequip)
- No save/load (localStorage planned)
- `ItemGenerator.ts` uses biased `sort(() => Math.random() - 0.5)` shuffle (minor, acceptable for small pools)
- No max orb stack size (stacks indefinitely, fine for current scope)
- Level requirements displayed but not enforced (player can equip above level)
- Hub NPCs/vendor/stash are placeholders only (no interactions yet)
- Endless Dungeon uses single template (no per-room rotation)
- No animation for support skills (only main ability triggers attack animation — monk techniques use executeTechnique)
- Sprites loaded from `public/` using `fetch + blob + createObjectURL` — not Vite-bundled, so no hash-based cache busting
- Monk tiger uppercut reuses dragon palm animation frames
- Monk basic_strike (slot 0) only usable via left-click or key 1 (Digit1 handler added for monk specifically)
- Class select icons are programmatic PixiJS Graphics (no SVG files)
- Weapon swapping not implemented (monk uses all techniques, no weapon slots for stances)
- Enemy sprite files must be tracked in git (case-sensitive on Linux deployment)
- Golem was missing from git (PNGs existed locally but weren't committed)

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

## Next Up

### Phase 5e — Save/Load (still pending)
- Save player state (level, XP, inventory, equipment, passive tree, gold, orbs) to localStorage
- Auto-save on close/interval, manual save option
- Load on game start, continue from saved state
- Needed before adding more permanent progression systems

### Phase 6 — More Monster Sprites
- Add animated sprite sheets for remaining enemy types (Grunt, Archer, Juggernaut)
- Archer completed (2026-06-05): 4 sheets (idle/run/attack/death, 100×100 frames)
- Juggernaut attempted and reverted — programmatic texture still in use
- Grunt still pending

### Phase 7 — Polish & Expansion
- Hub NPC interactions (vendor buy/sell, stash deposit/withdraw)
- Map modifiers (affixes on map items)
- More room templates for variety
- Balance pass on difficulty scaling
- Support skill animations (dash, buff, etc.)
- Save/load (localStorage)

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
