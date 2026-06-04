# Tutorial Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hub spawn with a guided 3-stage tutorial that teaches movement and combat.

**Architecture:** New `TutorialScreen.ts` UI overlay manages stages + text display. `Game.ts` tracks key presses, delays enemy spawning, and gates the exit door until tutorial is complete.

**Tech Stack:** TypeScript, PixiJS 7, Vite 5

---

### Task 1: Create TutorialScreen UI component

**Files:**
- Create: `src/ui/TutorialScreen.ts`

- [ ] **Step 1: Write TutorialScreen.ts**

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export type TutorialStage = 'move' | 'combat' | 'complete';

export class TutorialScreen {
  container: Container;
  private bg: Graphics;
  private titleText: Text;
  private detailText: Text;
  private stage: TutorialStage = 'move';

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    this.bg = new Graphics();
    this.bg.beginFill(0x000000, 0.6);
    this.bg.drawRoundedRect(screenWidth / 2 - 300, screenHeight - 120, 600, 80, 8);
    this.bg.endFill();

    this.titleText = new Text('', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 22, fill: '#ffd700',
      stroke: '#000', strokeThickness: 2,
    }));
    this.titleText.anchor.set(0.5);
    this.titleText.x = screenWidth / 2;
    this.titleText.y = screenHeight - 98;

    this.detailText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ccccdd',
      stroke: '#000', strokeThickness: 1,
    }));
    this.detailText.anchor.set(0.5);
    this.detailText.x = screenWidth / 2;
    this.detailText.y = screenHeight - 68;

    this.container.addChild(this.bg, this.titleText, this.detailText);
    this.setStage('move');
  }

  setStage(stage: TutorialStage, keysPressed?: Set<string>) {
    this.stage = stage;
    switch (stage) {
      case 'move':
        this.titleText.text = 'Move with WASD';
        this.detailText.text = this.formatKeys(keysPressed || new Set());
        break;
      case 'combat':
        this.titleText.text = 'Kill the enemies!';
        this.detailText.text = 'Click to attack. Press 1-6 for skills.';
        break;
      case 'complete':
        this.titleText.text = 'Walk through the door to reach the town!';
        this.detailText.text = '';
        break;
    }
  }

  updateKeys(keysPressed: Set<string>) {
    if (this.stage === 'move') {
      this.detailText.text = this.formatKeys(keysPressed);
    }
  }

  private formatKeys(keys: Set<string>): string {
    const all = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    const labels = ['W', 'A', 'S', 'D'];
    return labels.map((l, i) => keys.has(all[i]) ? `${l} ✓` : l).join('    ');
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/TutorialScreen.ts
git commit -m "feat: add TutorialScreen UI component"
```

---

### Task 2: Integrate tutorial into Game.ts

**Files:**
- Modify: `src/core/Game.ts`
- Import: `TutorialScreen` and `TutorialStage`

- [ ] **Step 1: Add import and new fields**

Add to imports at top of Game.ts:
```typescript
import { TutorialScreen, TutorialStage } from '../ui/TutorialScreen';
```

Add new fields after `private devConsole: DeveloperConsole;`:
```typescript
private tutorialStage: TutorialStage | null = null;
private tutorialKeys: Set<string> = new Set();
private tutorialScreen?: TutorialScreen;
private tutorialKeyWasDown: Set<string> = new Set();
```

- [ ] **Step 2: Change startGame() to spawn in tutorial zone**

In `startGame()` method, replace `this.zoneManager.transitionTo('hub');` with:
```typescript
this.zoneManager.transitionTo('tutorial');
```

After the `this.zoneManager.transitionTo('tutorial');` + `this.buildCurrentZoneRoom();` lines, add tutorial setup:
```typescript
this.tutorialStage = 'move';
this.tutorialKeys = new Set();
this.tutorialKeyWasDown = new Set();
this.tutorialScreen = new TutorialScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
this.app.stage.addChild(this.tutorialScreen.container);
```

- [ ] **Step 3: Guard enemy spawning in buildCurrentZoneRoom()**

In `buildCurrentZoneRoom()`, wrap the `zoneManager.spawnEnemies()` block. Replace:
```typescript
// Spawn enemies
const enemies = this.zoneManager.spawnEnemies(zone, template, state.roomIndex);
for (const e of enemies) {
  this.enemies.push(e);
  this.gameContainer.addChild(e.sprite);
}
```
With:
```typescript
// Spawn enemies (skip if tutorial is in move stage)
if (zone.id !== 'tutorial' || this.tutorialStage !== 'move') {
  const enemies = this.zoneManager.spawnEnemies(zone, template, state.roomIndex);
  for (const e of enemies) {
    this.enemies.push(e);
    this.gameContainer!.addChild(e.sprite);
  }
}
```

- [ ] **Step 4: Add helper method to spawn tutorial enemies**

Add a new method to Game.ts:
```typescript
private spawnTutorialEnemies() {
  const state = this.zoneManager.state;
  if (!state) return;
  const enemies = this.zoneManager.spawnEnemies(state.config, state.currentTemplate, state.roomIndex);
  for (const e of enemies) {
    this.enemies.push(e);
    this.gameContainer!.addChild(e.sprite);
  }
}
```

- [ ] **Step 5: Add tutorial logic to updateGameplay()**

In `updateGameplay()`, after the dev console return and before the inventory/tree checks, add tutorial stage logic. Insert this block after the `if (this.devConsole.isVisible()) return;` line and before the inventory checks:

```typescript
// Tutorial progression
if (this.tutorialStage) {
  if (this.tutorialStage === 'move') {
    for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
      if (this.input.isKeyDown(key)) {
        if (!this.tutorialKeyWasDown.has(key)) {
          this.tutorialKeyWasDown.add(key);
          this.tutorialKeys.add(key);
          this.tutorialScreen?.updateKeys(this.tutorialKeys);
        }
      } else {
        this.tutorialKeyWasDown.delete(key);
      }
    }
    if (this.tutorialKeys.size >= 4) {
      this.tutorialStage = 'combat';
      this.tutorialScreen?.setStage('combat');
      this.spawnTutorialEnemies();
    }
  }

  if (this.tutorialStage === 'combat') {
    if (this.enemies.length === 0) {
      this.tutorialStage = 'complete';
      this.tutorialScreen?.setStage('complete');
    }
  }
}
```

- [ ] **Step 6: Guard the tutorial exit door**

In the door overlap loop in `updateGameplay()`, add a guard. Find the loop:
```typescript
for (const door of this.room?.doors ?? []) {
```
Add the zone check at the start of the loop body, before the existing door collision logic:
```typescript
for (const door of this.room?.doors ?? []) {
  // Tutorial door is locked until tutorial is complete
  if (zone?.id === 'tutorial' && this.tutorialStage !== 'complete') continue;

  if (this.player && rectsOverlap(this.player.getBounds(), door.rect)) {
```

- [ ] **Step 7: Clean up tutorial in restartGame()**

In `restartGame()`, add tutorial cleanup. After the `this.devConsole.hide();` line, add:
```typescript
if (this.tutorialScreen) {
  this.app.stage.removeChild(this.tutorialScreen.container);
  this.tutorialScreen.destroy();
  this.tutorialScreen = undefined;
}
this.tutorialStage = null;
this.tutorialKeys = new Set();
this.tutorialKeyWasDown = new Set();
```

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat: integrate tutorial flow into game loop"
```
