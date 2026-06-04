# Tutorial Flow — Design Spec

## Overview
Replace the initial town spawn with a guided tutorial that teaches movement and combat before the player reaches the hub.

## Game Flow Change
```
Current:  Menu → Class Select → Ability Select → spawn in Town
New:      Menu → Class Select → Ability Select → spawn in Tutorial Glen → 3 stages → Town
```

## Tutorial Stages

### Stage 1: Movement (`move`)
- **Text**: "Move with WASD" shown at bottom-center of screen
- **Tracking**: A `Set<string>` records which of W/A/S/D have been pressed (via `InputManager.isKeyDown`)
- **Progress indicator**: Show pressed keys as lit/checked (e.g. "W ✓ A ✓ S ✓ D ☐")
- **Completion**: All 4 keys pressed at least once
- **Enemies**: None spawned; the room is empty

### Stage 2: Combat (`combat`)
- **Text**: "Kill the enemies! Click to attack."
- **Trigger**: Enemies are spawned via `zoneManager.spawnEnemies()` — reuses existing tutorial zone config (2-3 grunts, 0.5x HP/DMG)
- **Completion**: All enemies killed (`this.enemies` empty for tutorial zone)
- **Door**: Exit door to hub is visually present but collision-check is ignored during this stage

### Stage 3: Complete (`complete`)
- **Text**: "Walk through the door to reach the town!"
- **Door**: Exit door collision now triggers zone transition to hub
- **Completion**: Player walks through door → `transitionTo('hub')`

## New File: `src/ui/TutorialScreen.ts`
- Screen-space overlay component (added to `app.stage`)
- Renders a semi-transparent dark panel + styled text at bottom-center
- Properties: `stage`, `keysPressed` set, `progressText` computed string
- Methods:
  - `constructor(screenWidth, screenHeight)`
  - `setStage(stage, keysPressed?)` — updates text
  - `destroy()`
- Follows the same pattern as MainMenu, DeathScreen, etc.

## Changes to `src/core/Game.ts`

### New Fields
```typescript
private tutorialStage: 'move' | 'combat' | 'complete' | null = null;
private tutorialKeys: Set<string> = new Set();
private tutorialScreen?: TutorialScreen;
```

### `startGame()` Changes
- After creating gameContainer, player, HUD, skillBar:
- `this.zoneManager.transitionTo('tutorial')` instead of `'hub'`
- `this.buildCurrentZoneRoom()` — builds room without enemies
- Create `TutorialScreen`, set stage to `move`, add to `app.stage`

### `buildCurrentZoneRoom()` Changes
- If `zone.id === 'tutorial'` AND `tutorialStage === 'move'`, skip `zoneManager.spawnEnemies()`
- Otherwise spawn normally

### `updateGameplay()` Additions
- If `tutorialStage === 'move'`:
  - Check each of W/A/S/D via `input.isKeyDown()` on key-down edge
  - Add to `tutorialKeys` set
  - Update TutorialScreen progress display
  - When all 4 keys pressed → transition to combat:
    - Set `tutorialStage = 'combat'`
    - Call `zoneManager.spawnEnemies(tutorial zone, template, roomIndex)`
    - Add enemy sprites to `gameContainer`
    - Update TutorialScreen text
- If `tutorialStage === 'combat'`:
  - Check if `this.enemies.length === 0` (all dead)
  - If so → transition to complete:
    - Set `tutorialStage = 'complete'`
    - Update TutorialScreen text
- If `tutorialStage === 'complete'`:
  - Door collision triggers normally (was blocked in move/combat)

### Door Collision Guard
In the door overlap loop in `updateGameplay()`:
```typescript
// Don't let tutorial door work before combat is complete
if (zone?.id === 'tutorial' && this.tutorialStage !== 'complete') continue;
```

## Reused Assets
- `ZoneRegistry` tutorial config unchanged (tutorial zone, 2-3 grunts, 0.5x mults)
- `TEMPLATE_TUTORIAL` unchanged (open room, exit door at bottom-center, playerStart at center)
- All existing sprites, HUD, skill bar remain active during tutorial
