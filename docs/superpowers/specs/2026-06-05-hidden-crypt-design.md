# Design Spec: Hidden Crypt Secret Zone

**Date:** 2026-06-05
**Status:** Approved for implementation

## Overview

A secret crypt zone accessed from the tutorial zone via a clickable bush that reveals a hidden door. The crypt contains waves of enemies, a Cthulhu boss, and a one-time jackpot chest with 1000 gold.

---

## 1. Secret Bush (`src/entities/SecretBush.ts`)

### Entity: `SecretBush`

```
States: 'hidden' → 'rustling' → 'destroyed'
```

**hidden:**
- Uses `Sprites.bush` texture, tutorial biome tint
- No interaction prompt, looks identical to normal bushes
- Clicking once → rustling state

**rustling:**
- Wobble animation (sine-based x oscillation, ±2px, 3Hz)
- Soft pulsing glow overlay (alpha 0.3-0.6 sine wave)
- Small sparkle indicator above (`☆` or "..." text)
- Clicking again → destroyed state
- If player moves >200px away without clicking, reverts to hidden

**destroyed:**
- Sprite removed
- VFX: particle burst (6-8 leaf flakes expanding outward) + dark purple dust cloud
- Callback fires → `Game.revealCryptDoor()`

### Placement

Fixed position at `(5300, 400)` in tutorial room (top-right off main path).

### RoomDecorator Integration

The bush position `{x:5288, y:382, w:36, h:36}` is passed as an extra blocked rect so no procedural tree/rock/chest overlaps it.

### Game.ts integration

```ts
// Data
secretBush: SecretBush | null = null;

// In buildCurrentZoneRoom(), when zone === 'tutorial':
this.secretBush = new SecretBush(5300, 400, () => this.revealCryptDoor());
this.gameContainer.addChild(this.secretBush.container);

// In game loop, handle left-click on bush:
if (this.secretBush) {
  const clicked = this.secretBush.checkClick(mouseWX, mouseWY, this.input.consumeClick());
  // SecretBush.checkClick handles state transitions internally
}

// On cleanup:
this.secretBush?.destroy();
this.secretBush = null;

// Reveal method:
private revealCryptDoor(): void {
  const template = this.zoneManager.state?.currentTemplate;
  if (!template) return;
  template.doors.push({
    rect: { x: 5260, y: 360, width: 120, height: 80 },
    targetZone: 'secret_crypt',
    targetRoom: 0,
  });
  this.buildCurrentZoneRoom(); // redraws room with new door visible
}
```

---

## 2. Crypt Zone Config

### BiomeId

Add `'crypt'` to the `BiomeId` union type in `ZoneConfig.ts`.

### BIOME_DATA entry

```ts
crypt: {
  floorColor: 0x1a1028,
  wallColor: 0x2a2040,
  wallBorderColor: 0x3a3050,
  decorColor: 0x0a0020,
  decorColorB: 0x553366,
}
```

### ZoneConfig in ZoneRegistry

```ts
secret_crypt: {
  id: 'secret_crypt',
  name: 'Hidden Crypt',
  biome: 'crypt',
  roomCount: 1,
  bossId: 'cthulhu',
  enemyPool: ['grunt', 'juggernaut'],
  enemyHpMult: 2.0,
  enemyDmgMult: 1.2,
  enemyXpMult: 1.5,
  isEndless: false,
  nextZone: 'tutorial',
  availableFromHub: false,
  enemyCount: { min: 3, max: 5 },
  templates: [TEMPLATE_CRYPT],
}
```

### ZoneManager

`ZoneManager.isZoneUnlocked('secret_crypt')` → always returns `true`.

---

## 3. Crypt Room Template (`TEMPLATE_CRYPT`)

Playable area ~3200×1888 (center of 6400×3584), bordered by walls:

```ts
export const TEMPLATE_CRYPT: RoomTemplate = {
  walls: [
    { x: 1560, y: 144, width: 3280, height: 48 },  // North
    { x: 1560, y: 3392, width: 3280, height: 48 },  // South
    { x: 1560, y: 144, width: 48, height: 3248 },   // West
    { x: 4792, y: 144, width: 48, height: 3248 },   // East
  ],
  doors: [
    {
      rect: { x: 3000, y: 3312, width: 400, height: 144 },
      targetZone: 'tutorial',
      targetRoom: 0,
    },
  ],
  portals: [],
  spawnZones: [
    { x: 1650, y: 200, width: 600, height: 600 },
    { x: 4150, y: 200, width: 600, height: 600 },
    { x: 1650, y: 2784, width: 600, height: 600 },
    { x: 4150, y: 2784, width: 600, height: 600 },
  ],
  decorationRects: [],
  buildings: [],
  npcs: [],
  playerStart: { x: 3200, y: 1792 },  // center
};
```

### Decorator counts for crypt biome

- Chests: 8-12 (from default 4-9)
- Breakables: 15-25 (from default 8-16)
- Trees: 0 (no trees in crypt)
- Rocks: 10-18 (from default 6-12)

### Jackpot chest position

Placed at `(3200, 2200)` in center-rear area (not procedural — placed manually in Game.ts).

---

## 4. Cthulhu Boss (`src/entities/Boss.ts`)

### New BossId

`'cthulhu'`

### Config

```ts
case 'cthulhu':
  return {
    bossId: 'cthulhu',
    name: 'The Deep One',
    hp: 600,
    size: 100,
    speed: 1.3,
    damage: 22,
    xpReward: 150,
    sprite: cthulhuIdleFrames[0],
  };
```

### Phase 1 (100–75% HP)

- Tentacle Swipe every 3s: 120° cone, 80px range, ~28 damage
- Telegraph: 1s red cone overlay
- Swipe animation plays

### Phase 2 (75–50% HP)

- Swipe every 2.5s
- Grasping Reach every 4s: 400px × 40px line aimed at player
- 1.2s telegraph (red line zone)
- On hit: pull 180px + 0.5s stun + 16 damage
- Grasp animation plays

### Phase 3 (50–25% HP)

- Swipe range +20% (96px), attack rate +15%
- Grasping Reach range +25% (500px)

### Phase 4 (25–0% HP)

- Double Swipe: two consecutive sweeps 0.3s apart
- Speed boost: 2.0 (from 1.3)
- All cooldowns -20%

### Pull Mechanic

```ts
// Boss sets:
this.pendingPull = { distance: 180, angle: atan2(playerY - y, playerX - x) };

// Game.ts reads after boss.update():
if (boss.pendingPull) {
  pullTimer = 30; // 0.5s stun at 60fps
  pullTarget = { x: player.x + cos(angle) * -180, y: player.y + sin(angle) * -180 };
  boss.pendingPull = null;
}
if (pullTimer > 0) {
  // Lerp player toward pull target, resolve collision
  pullTimer--;
  player.inputEnabled = false; // stun blocks input
}
```

### Sprites

Loaded from `public/sprites/cthulhu/` using individual PNG pattern:
- `idle_1.png`–`idle_6.png`
- `walk_1.png`–`walk_8.png`
- `swipe_1.png`–`swipe_10.png`
- `grasp_1.png`–`grasp_10.png`
- `death_1.png`–`death_10.png`

Loaded via `SpriteAnimator` with new `cthulhuFrames` cache, `loadCthulhuAnimations()` loader, and `playCthulhuAnimation()` method. Added to startup loading screen.

---

## 5. Jackpot Chest

### Chest class update

Constructor accepts optional `{ isJackpot?: boolean; locked?: boolean }`:
```ts
class Chest {
  isJackpot: boolean;
  locked: boolean;

  constructor(x, y, opts?: { isJackpot?: boolean; locked?: boolean })
  unlock(): void  // sets locked = false, removes visual lock overlay
}
```

- `locked = true` → shows chain/lock sprite overlay, on E key: shows "The chest is sealed by dark magic..." toast
- `locked = false` → normal behavior (Open [E] prompt, full loot)

### Placement

Created in `buildCurrentZoneRoom()` when `zone.id === 'secret_crypt' && !jackpotClaimed`:
```ts
const cx = 3200, cy = 2200;
this.jackpotChest = new Chest(cx, cy, { isJackpot: true, locked: true });
this.gameContainer.addChild(this.jackpotChest.container);
```

### Loot on open

```ts
// Exactly 1000 gold
this.itemDrops.push(new ItemDrop(cx, cy, {
  type: 'gold', name: '1000 Gold', color: 0xffd700, value: 1000,
}));
// Plus normal chest loot (potions, etc.)
for (const drop of createRandomLoot(cx, cy, 3)) { ... }
// Plus guaranteed generated item
this.spawnItemDrop(cx, cy, true);
// 30% second item, 15% orb
if (Math.random() < 0.3) this.spawnItemDrop(cx, cy, true);
if (Math.random() < 0.15) { /* spawn orb */ }
```

### One-time tracking

`SaveData.zone.cryptJackpotClaimed: boolean` — set to `true` when jackpot chest is opened. On subsequent visits, chest is not created.

### Chest sprites

User provides closed/open chest sprites. `Chest` class updated to use `AnimatedSprite` instead of static `Sprite`, with open animation on activate. Jackpot chest uses same sprites with added purple/gold glow overlay.

---

## 6. Crypt Wave System

### Game.ts additions

```ts
cryptWaveCount: number = 0;
cryptWaveActive: boolean = false;
```

### In `buildCurrentZoneRoom()` for `secret_crypt`

```ts
this.cryptWaveCount = 0;
this.cryptWaveActive = true;
// Wave 1 (initial): 3-5 enemies via zoneManager.spawnEnemies() using zone config
// cryptWaveCount starts at 0. Each time all enemies die: increment, then
//   cryptWaveCount < 3 → spawn next wave (4, then 5 enemies)
//   cryptWaveCount >= 3 → boss spawns
```

### In game loop update

```ts
if (zone?.id === 'secret_crypt' && this.cryptWaveActive) {
  if (this.enemies.length === 0 && !this.boss) {
    this.cryptWaveCount++;
    if (this.cryptWaveCount >= 3) {
      this.spawnBoss('cthulhu');
      this.cryptWaveActive = false;
    } else {
      const count = 3 + this.cryptWaveCount; // wave1=4, wave2=5
      const hpMult = 2.0 + this.cryptWaveCount * 0.1; // 2.1, 2.2
      // Spawn wave with adjusted multipliers
    }
  }
}
```

---

## 7. Save/Load

### SaveData.zone addition

```ts
interface SaveData {
  zone: {
    currentZoneId: string;
    currentRoomIndex: number;
    completedZoneIds: string[];
    cryptJackpotClaimed?: boolean;  // NEW
  };
}
```

### Save

```ts
saveGame(): void {
  data.zone.cryptJackpotClaimed = this.cryptJackpotClaimed ?? false;
}
```

### Load

```ts
loadGame(): void {
  this.cryptJackpotClaimed = loadedData.zone.cryptJackpotClaimed ?? false;
}
```

Backward compatible — `?` marks it optional, defaults to `false` on old saves.

---

## 8. File Manifest

| Action | File | Change Summary |
|--------|------|----------------|
| **New** | `src/entities/SecretBush.ts` | Two-click bush with 3 states |
| **Modify** | `src/core/ZoneConfig.ts` | Add `'crypt'` to BiomeId, add BIOME_DATA entry |
| **Modify** | `src/core/ZoneRegistry.ts` | Add `secret_crypt` zone config |
| **Modify** | `src/core/ZoneManager.ts` | Add `secret_crypt` to isZoneUnlocked |
| **Modify** | `src/core/SaveManager.ts` | Add `cryptJackpotClaimed` field |
| **Modify** | `src/world/RoomTemplates.ts` | Add `TEMPLATE_CRYPT` |
| **Modify** | `src/world/RoomDecorator.ts` | Accept optional extra blocked rect for tutorial bush |
| **Modify** | `src/entities/Boss.ts` | Add `'cthulhu'` BossId, config, pull mechanic |
| **Modify** | `src/entities/Chest.ts` | Add `isJackpot`/`locked` flags, animated sprites |
| **Modify** | `src/core/Game.ts` | Bush, wave, boss, jackpot, pull integration |
| **Modify** | `src/rendering/SpriteAnimator.ts` | Cthulhu loader + cache |
| **Modify** | `src/rendering/Sprites.ts` | Chest sprites export (if needed) |
| **New assets** | `public/sprites/cthulhu/*.png` | Boss sprites (provided by user) |
| **New assets** | `public/sprites/chest/*.png` | Chest sprites (provided by user) |
