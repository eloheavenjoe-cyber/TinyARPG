# TinyARPG — Game Improvement Ideas

100 ideas ordered from easy (minutes) to hard (days). Generated 2026-06-07.

---

## Trivial (1-10 lines, ~5-30 min each)

1. **Title screen music toggle** — Add a muted speaker icon that toggles a placeholder "Music On/Off"
2. **Screen shake on player hit** — Offset gameContainer for 8 frames when player takes damage
3. **Enemy death fade-out** — Lerp enemy sprite alpha to 0 over 10 frames instead of instant hide
4. **Gold float text** — Show "+X gold" combat text on gold pickup
5. **XP float text** — Show "+X XP" on kill
6. **Level-up screen flash** — Brief white flash overlay on level-up
7. **Mana regen tick VFX** — Small blue spark at player on each regen tick
8. **Item drop rotation** — Random initial rotation on item nameplates for variety
9. **Chest glow on proximity** — Subtle glow/pulse when player is within 150px of a chest
10. **Door arrow pulse** — Arrow indicator above door that pulses with alpha
11. **Breakable debris persistence** — Let broken pot/barrel shards fade over 20 frames instead of vanishing
12. **Enemy aggro sound** — Brief visual "!" indicator above enemy when it aggroes
13. **Critical hit VFX** — Bigger damage number + brief flash on crit
14. **Boss health bar smooth lerp** — Same hp bar lerp as player HUD
15. **Boss phase transition flash** — Screen tint for 10 frames when boss phases
16. **Stamina bar** — Simple secondary bar for dodge roll resource
17. **Buff duration bar** — Thin bar under buff icon showing remaining duration
18. **Skill tooltip damage range** — Show "60-80 damage" in skill bar tooltip
19. **Item comparison tooltip** — Show currently equipped item stats when hovering a replacement
20. **Rarity chance breakdown** — On class select, show tooltip with rarity odds
21. **Zone entry message** — "Entering Verdant Forest" fade text on zone transition
22. **Kill counter** — Per-zone kill counter displayed on zone clear
23. **Clock / playtime display** — Show session duration in escape menu
24. **Cursor trail** — 5 fading circle dots that follow cursor (like mouse trail)
25. **Damage number vertical spread** — Offset numbers ±10px vertically for readability when overlapping

## Easy (30 min - 2 hours each)

26. **Fireflies** — 12-16 yellow-green dots with sin/cos drift paths
27. **Falling leaves** — Brown/green circles drifting down, respawn at top
28. **Light rays** — Semi-transparent trapezoids panning at stage level
29. **Footprint trail** — Small ovals left behind as player moves, fade out
30. **Water puddle** — Scenic reflective pool with animated ellipse
31. **Signpost** — Graphics post + board with "TOWN" text
32. **Enemy death particles** — Colored circles burst on enemy death
33. **Breakable destruction chips** — Shards arc outward from broken objects
34. **Buff active auras** — Permanent VFX ring on player per active buff
35. **Level-up celebration** — Golden ring + gold sparkles + level text
36. **Portal transition VFX** — Expanding ring at door + fade before room build
37. **Skill bar ready pulse** — Gold flash on slot when cooldown finishes
38. **Enemy damage type indicators** — Color-coded projectiles matching damage type (fire/ice/lightning)
39. **Player hit flash** — Screen-wide red tint for 6 frames on hit
40. **Health bar low-pulse** — Red-dark-red oscillation below 30% HP
41. **Death screen fade-in** — Fade overlay in over 60 frames instead of instant
42. **Chest open sparkle** — 5 gold dots burst from chest on open
43. **Gold pickup burst** — 3 gold circles spread on pickup
44. **Door label shimmer** — Oscillate door label between two gold tones
45. **Item level display in tooltip** — Show ilvl in item tooltip footer
46. **Dodge roll trail** — Ghost image of player behind during roll
47. **Zone minimap color** — Tint minimap background per biome
48. **Stash tab icons** — Small icon per tab (gold/gear/currency/etc.)
49. **Vendor buyback** — Last sold item available for re-purchase at same price
50. **Boss rage timer** — Visual "enrage" warning after 60s in boss room

## Medium (2-6 hours each)

51. **Combat hit pause** — 4-6 frame pause on boss kill / large hit
52. **Camera idle bob** — Subtle sinusoidal camera offset
53. **Screen shake on boss attacks** — gameContainer offset ±3px on telegraph
54. **Dynamic ground fog** — Large drifting semi-transparent white circles
55. **Falling snow in ice zone** — Continuous white dot rain effect in frozen wastes
56. **Desert sandstorm** — Orange-brown semi-transparent streaks in desert zone
57. **Ambient wildlife** — Birds flitting between trees, rabbits fleeing player
58. **Parallax background** — Silhouette layer at 0.2× camera offset
59. **Level-up stat preview** — Show "+X HP" etc. before confirming attribute assignment
60. **Equipment set bonuses** — Equip 2+ pieces of same "set" for extra stats
61. **Gem socket system** — 1-3 sockets per item, socket colored gems for bonus affixes
62. **Map item system** — Consumable maps with affixes that modify zone difficulty/loot
63. **Flask system** — PoE-style rechargeable potions (charges refill on kill)
64. **Corpse explosion** — Enemy corpse lingers 3s, can be detonated for AoE damage
65. **Tutorial skip button** — Hold-to-skip tutorial on new game
66. **Rarity indicator on minimap** — Colored dots for magic/rare/unique enemies
67. **Quest tracking** — Simple quest log with 1-2 tutorial quests
68. **Achievement notifications** — Toast popup for first kill, first unique, first boss
69. **Pickup range indicator** — Faint circle around player showing auto-pickup radius
70. **Mana shield** — Toggleable buff that uses mana as health buffer
71. **Enemy affix visual indicators** — Unique VFX per affix (hasted: speed lines, volatile: red pulse)
72. **Tutorial boss** — Weak boss at end of tutorial to teach boss mechanics
73. **Arrow rain VFX upgrade** — Individual arrow sprites falling instead of streaks
74. **Monk stance weapon visual** — Weapon sprite tint changes per stance
75. **Mob linking** — Nearby enemies of same type share HP pool

## Hard (6-20 hours each)

76. **Day/night cycle** — 60s cycle, biome colors lerp to night palette
77. **Weather system** — Per-biome weather chance table with transitions
78. **Full biome tile configs** — Dedicated tile PNGs for all biomes
79. **Dynamic shadow drops** — Semi-transparent ellipse below all entities
80. **Dynamic fog of war** — Dark overlay with circular cutout around player
81. **Damage number juice** — Start large and shrink, drift, crits larger/orange
82. **Object pooling for VFX** — Pre-allocate 30 Graphics, pool management
83. **Endless dungeon room variety** — 5+ template rotation instead of single template
84. **Multiplayer co-op** — 2-player WebSocket-based same-room co-op
85. **Boss loot table** — Each boss drops 1-2 unique items from a themed table
86. **Crafting bench** — NPC in hub that lets you add affixes for gold cost
87. **Skill gem leveling** — Skills gain XP and level up, improving base damage
88. **Minion system** — Necromancer-style permanent minion following player
89. **Totem / trap skills** — Deployable turrets with limited duration
90. **Ailment system** — Bleed (DoT), freeze (slow→stun), ignite (%HP burn), shock (incoming dmg)

## Very Hard (20-100+ hours each)

91. **Boss intro cutscene** — Pause, show boss name, dramatic zoom, 90-frame sequence
92. **Boss rush mode** — Chain all bosses with scaling rewards, timer
93. **Item filter system** — Customizable loot filter (hide low-tier, highlight good bases)
94. **Map device** — Endgame maps with modifiers, socket fragments for bonuses
95. **Hardcore mode** — Permadeath character option on class select
96. **Seasonal leagues** — Timed leagues with unique mechanics (e.g., "Talisman League")
97. **Controller support** — Gamepad input via Gamepad API with aim assist
98. **Sprite-replaced biomes** — Commission/generate full pixel-art tilesets for all biomes
99. **Animated water tiles** — Cycling 4-6 frame water spritesheet for ponds
100. **WebGL color grading** — ColorMatrixFilter per biome, blur for DoF
