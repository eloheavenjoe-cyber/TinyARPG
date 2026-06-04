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
    Game.ts                   State machine (Menu→Picking→Playing→Death), game loop, VFX, projectile management
    InputManager.ts           WASD + mouse, canvas-coordinate conversion
    Logger.ts                 Categorized logging ([Input] [Combat] [Skill] etc)
    SkillDefs.ts              All Warrior + Ranger skill data (main + support skills)
    SkillManager.ts           Cooldowns, buffs, skill activation validation, class-aware
    PassiveTree.ts            ~40 node passive tree data, allocation, effects computation
    StatSystem.ts             Computes final stats from base + attributes + tree nodes
  entities/
    Player.ts                 Player with SkillManager, mana, buffs, projectile firing, leveling, passive tree
    Enemy.ts                  Chase AI, damage, hit flash, XP reward
    CombatText.ts             Floating damage numbers
    ItemDrop.ts               Ground loot nameplates with rarity colors
    Projectile.ts             Arrow-shaped projectiles with velocity, damage, lifetime, piercing
  world/
    Room.ts                   1600×896 room, wall collision resolver
  rendering/
    Sprites.ts                Programmatic pixel-art textures (player, enemy, ranger, floor, wall)
  ui/
    MainMenu.ts               Title screen
    ClassSelect.ts            Class picker (Warrior/Ranger)
    AbilitySelect.ts          Main ability picker (4 per class)
    PassiveTreeScreen.ts      Full-screen passive tree overlay with interaction
    DeathScreen.ts            Death overlay with restart
    HUD.ts                    Health/mana bars (bottom-left), gold counter, level, XP bar
    SkillBar.ts               6-slot skill bar (bottom-center), keybinds 1-6
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

### Phase 3 — Progression (just completed)
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

## Key Architecture Rules
- Game.ts owns all state, runs game loop
- All game objects inside `gameContainer` (offset 160,92)
- UI components on `app.stage` in screen coords
- VFX are temporary Graphics objects with draw function + lifetime
- Damage numbers use CombatTextManager
- Skill activation routes through Player.useMainAbility() and Game.useSupportSkill()
- Logger categories: input, movement, collision, entity, combat, ui, game, system, skill

## Key Constants
- Canvas: 1920×1080, Room: 1600×896 at offset (160,92)
- Walls: 32px thick, Player hitbox: 28×28 (center-positioned)
- Skill bar: 6 slots at Y=1030 (bottom-center)
- HUD: bottom-left at (18, 1030)
- Player base HP: 100, base mana: 50, base speed: 6
- Enemy HP: 40, speed: 2.2, XP: 10

## Known Issues / TODOs
- Projectile firing might need mouse-to-world coordinate verification (uses same conversion as other systems)
- Passive tree has ~40 nodes (GDD target: 40-60), can be expanded
- No inventory screen yet (Phase 4)
- No equipment slots (Phase 4)
- No crafting orbs (Phase 4)
- No save/load (localStorage planned)
- No endgame maps/zones (Phase 5)

## Next Up

### Phase 4 — Loot & Crafting
- Item bases (weapons, armor types) with affixes
- Rarity system: Normal → Magic → Rare
- Crafting: currency orbs with PoE-style effects
- Equipment slots: Weapon, Body, Helmet, Boots, Rings ×2
- Inventory grid
- Affix generation, item stats, tooltips

### Phase 5 — Endgame
- Multiple themed zones
- Mapping system with consumable maps
- Difficulty scaling, map modifiers
- Boss encounters
- Infinite scaling

## Co-authoring
This workspace may be shared between AI agents. Always read before writing —
the other agent may have changed files. Commit after meaningful work so the
other agent sees a clean diff. Don't undo or "improve" the other agent's work
without explicit approval. See AGENTS.md for full coordination rules.

## Bug Patterns (gotchas)
- **Coordinate mismatch:** resolveCollision returns bounds (top-left) coords, not center coords. Always do `resolved.x + width/2` after calling it.
- **Canvas CSS scaling:** max-width/object-fit with `image-rendering: pixelated` makes PixiJS text look jagged. Use bilinear interpolation for text.
- **HUD position:** HUD and skill bar live at screen-coord Y=1030. Ensure canvas viewport scaling is active so bottom isn't clipped.
- **Projectile positioning:** projectiles are children of gameContainer (offset 160,92), so use game-local coords, not screen coords.
