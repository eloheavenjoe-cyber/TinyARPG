import { Application, Container, Point, Graphics } from 'pixi.js';
import { InputManager } from './InputManager';
import { Logger } from './Logger';
import { Sprites } from '../rendering/Sprites';
import { MainMenu } from '../ui/MainMenu';
import { ClassSelect } from '../ui/ClassSelect';
import { AbilitySelect } from '../ui/AbilitySelect';
import { DeathScreen } from '../ui/DeathScreen';
import { HUD } from '../ui/HUD';
import { SkillBar } from '../ui/SkillBar';
import { Room, ROOM_WIDTH, ROOM_HEIGHT, rectsOverlap } from '../world/Room';
import { Player } from '../entities/Player';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { CombatTextManager } from '../entities/CombatText';
import { ItemDrop, createRandomLoot, isEquippableDrop, createItemDrop, isOrbDrop, createOrbDrop, isPortalScrollDrop } from '../entities/ItemDrop';
import { ClassType } from './SkillDefs';
import { PassiveTreeScreen } from '../ui/PassiveTreeScreen';
import { InventoryScreen } from '../ui/InventoryScreen';
import { generateItemDrop, generateOrbDrop } from './ItemGenerator';
import { Slot, ITEM_BASES } from './ItemDefs';
import { DeveloperConsole } from '../ui/DeveloperConsole';
import { ZoneManager } from './ZoneManager';
import { TutorialScreen, TutorialStage } from '../ui/TutorialScreen';
import { loadWarriorAnimations, loadRangerAnimations } from '../rendering/SpriteAnimator';
import { Boss, BossId } from '../entities/Boss';
import { BossHpBar } from '../ui/BossHpBar';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;
const ROOM_OFFSET_X = (SCREEN_WIDTH - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = (SCREEN_HEIGHT - ROOM_HEIGHT) / 2;
const D = Math.PI / 180;

const enum State { Menu, Picking, Playing, Death }

interface VfxEffect {
  g: Graphics;
  life: number;
  maxLife: number;
  draw: (g: Graphics, t: number) => void;
}

interface DashState {
  startX: number; startY: number;
  targetX: number; targetY: number;
  progress: number;
  length: number;
}

export class Game {
  private app: Application;
  private input: InputManager;
  private state = State.Menu;

  private mainMenu?: MainMenu;
  private classSelect?: ClassSelect;
  private abilitySelect?: AbilitySelect;
  private deathScreen?: DeathScreen;
  private hud?: HUD;
  private skillBar?: SkillBar;
  private gameContainer?: Container;
  private room?: Room;
  private player?: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private waveCooldown = 0;
  private itemDrops: ItemDrop[] = [];
  private combatText: CombatTextManager = new CombatTextManager();
  private vfx: VfxEffect[] = [];
  private dash: DashState | null = null;
  private zoneManager: ZoneManager = new ZoneManager();
  private portalAngle = 0;
  private recallPortal: { x: number; y: number; graphic: Graphics; active: boolean } | null = null;

  private lastKeys: Set<string> = new Set();
  private wasPKeyDown = false;
  private wasIKeyDown = false;
  private _consoleKeyWasDown = false;
  private pendingClassType: ClassType = 'warrior';
  private treeOpen = false;
  private inventoryOpen = false;
  private passiveTreeScreen?: PassiveTreeScreen;
  private inventoryScreen?: InventoryScreen;
  private devConsole: DeveloperConsole;
  private tutorialStage: TutorialStage | null = null;
  private tutorialKeys: Set<string> = new Set();
  private tutorialScreen?: TutorialScreen;
  private tutorialKeyWasDown: Set<string> = new Set();
  private boss: Boss | null = null;
  private bossHpBar?: BossHpBar;
  private bossSpawned = false;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager(app.view as HTMLCanvasElement);
    Sprites.generateAll();
    this.devConsole = new DeveloperConsole();
    this.setupConsoleCommands();
    loadWarriorAnimations();
    loadRangerAnimations();
    Logger.log('game', 'TinyARPG initialized');
  }

  start() {
    this.app.ticker.add((dt) => this.update(dt));
    this.showMainMenu();
  }

  private showMainMenu() {
    this.state = State.Menu;
    this.mainMenu = new MainMenu(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.mainMenu.onStart(() => this.showClassSelect());
    this.app.stage.addChild(this.mainMenu.container);
  }

  private showClassSelect() {
    if (this.mainMenu) {
      this.app.stage.removeChild(this.mainMenu.container);
      this.mainMenu.destroy();
      this.mainMenu = undefined;
    }
    this.state = State.Picking;
    this.classSelect = new ClassSelect(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.classSelect.onPick((classType) => {
      this.pendingClassType = classType;
      this.showAbilitySelect(classType);
    });
    this.app.stage.addChild(this.classSelect.container);
  }

  private showAbilitySelect(classType: ClassType) {
    if (this.classSelect) {
      this.app.stage.removeChild(this.classSelect.container);
      this.classSelect.destroy();
      this.classSelect = undefined;
    }
    this.state = State.Picking;
    this.abilitySelect = new AbilitySelect(SCREEN_WIDTH, SCREEN_HEIGHT, classType);
    this.abilitySelect.onPick((id) => this.startGame(classType, id));
    this.app.stage.addChild(this.abilitySelect.container);
  }

  private startGame(classType: ClassType, abilityId: string) {
    Logger.log('game', `Starting ${classType} with ability: ${abilityId}`);
    if (this.abilitySelect) {
      this.app.stage.removeChild(this.abilitySelect.container);
      this.abilitySelect.destroy();
      this.abilitySelect = undefined;
    }
    this.state = State.Playing;
    this.gameContainer = new Container();
    this.gameContainer.x = ROOM_OFFSET_X;
    this.gameContainer.y = ROOM_OFFSET_Y;
    this.app.stage.addChild(this.gameContainer);
    this.room = new Room();
    this.gameContainer.addChild(this.room.container);
    this.player = new Player(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, classType);
    this.player.skills.selectMainAbility(abilityId);
    this.gameContainer.addChild(this.player.sprite);
    this.gameContainer.addChild(this.combatText.container);
    this.hud = new HUD();
    this.app.stage.addChild(this.hud.container);
    this.skillBar = new SkillBar();
    this.app.stage.addChild(this.skillBar.container);
    this.zoneManager.transitionTo('tutorial');
    this.buildCurrentZoneRoom();
    this.tutorialStage = 'move';
    this.tutorialKeys = new Set();
    this.tutorialKeyWasDown = new Set();
    this.tutorialScreen = new TutorialScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.app.stage.addChild(this.tutorialScreen.container);
  }

  private buildCurrentZoneRoom() {
    if (!this.gameContainer || !this.room || !this.player) return;

    // Clear existing entities
    for (const e of this.enemies) { this.gameContainer.removeChild(e.sprite); e.destroy(); }
    for (const p of this.projectiles) { this.gameContainer.removeChild(p.sprite); p.destroy(); }
    for (const d of this.itemDrops) { this.gameContainer.removeChild(d.container); d.destroy(); }
    this.enemies = [];
    this.projectiles = [];
    this.itemDrops = [];
    this.vfx = [];
    this.dash = null;
    if (this.recallPortal) {
      if (this.recallPortal.graphic.parent) this.gameContainer.removeChild(this.recallPortal.graphic);
      this.recallPortal.graphic.destroy();
      this.recallPortal = null;
    }

    // Remove old room visuals
    this.gameContainer.removeChild(this.room.container);
    this.room.container.destroy({ children: true });

    // Build new room from zone state
    const state = this.zoneManager.state;
    if (!state) return;

    const zone = state.config;
    const template = state.currentTemplate;

    this.room = new Room(zone.biome, template.doors, template.portals, template.decorationRects, template.buildings, template.npcs, (targetZone: string) => this.zoneManager.isZoneUnlocked(targetZone));
    this.gameContainer.addChild(this.room.container);

    // Re-add player and combat text above the new room (room floor tiles would cover them)
    this.gameContainer.removeChild(this.player.sprite);
    this.gameContainer.addChild(this.player.sprite);
    this.gameContainer.removeChild(this.combatText.container);
    this.gameContainer.addChild(this.combatText.container);

    // Position player at template start point
    this.player.x = template.playerStart.x;
    this.player.y = template.playerStart.y;

    // Spawn enemies (skip if tutorial is in move stage)
    if (zone.id !== 'tutorial' || this.tutorialStage !== 'move') {
      const enemies = this.zoneManager.spawnEnemies(zone, template, state.roomIndex);
      for (const e of enemies) {
        this.enemies.push(e);
        this.gameContainer!.addChild(e.sprite);
      }
    }

    // Clean up previous boss
    this.bossSpawned = false;
    if (this.boss) {
      this.gameContainer!.removeChild(this.boss.sprite);
      this.gameContainer!.removeChild(this.boss.telegraphs);
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossHpBar) {
      this.app.stage.removeChild(this.bossHpBar.container);
      this.bossHpBar.destroy();
      this.bossHpBar = undefined;
    }

    // Spawn boss if this is a boss room
    const isBossRoom = state.roomIndex === zone.roomCount - 1 && zone.bossId;
    if (isBossRoom && zone.bossId) {
      this.spawnBoss(zone.bossId as BossId);
    }

    // Add animated portal VFX
    for (const portal of this.room.portals) {
      const cx = portal.rect.x + portal.rect.width / 2;
      const cy = portal.rect.y + portal.rect.height / 2;
      const r = Math.min(portal.rect.width, portal.rect.height) / 2 - 4;
      this.addVfx((g, t) => {
        const spin = this.portalAngle + Math.PI * 2;
        g.clear();
        for (let i = 0; i < 6; i++) {
          const a = spin + (i / 6) * Math.PI * 2;
          const len = r * (0.4 + 0.6 * Math.abs(Math.sin(a)));
          g.lineStyle(2, 0xaa66ff, 0.3 + 0.4 * Math.abs(Math.sin(a)));
          g.moveTo(cx, cy);
          g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        }
      }, 99999);
    }

    // Reset wave cooldown for arena mode
    if (zone.isEndless === 'wave') {
      this.waveCooldown = 120;
    }

    Logger.log('system', `Room built: ${zone.name}, room ${state.roomIndex + 1}/${zone.roomCount}`);
  }

  private spawnTutorialEnemies() {
    const state = this.zoneManager.state;
    if (!state) return;
    const enemies = this.zoneManager.spawnEnemies(state.config, state.currentTemplate, state.roomIndex);
    for (const e of enemies) {
      this.enemies.push(e);
      this.gameContainer!.addChild(e.sprite);
    }
  }

  private spawnBoss(bossId: BossId) {
    if (!this.gameContainer) return;
    const boss = new Boss(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, bossId);

    boss.onSpawnEnemies((count, type) => {
      for (let i = 0; i < count; i++) {
        const margin = 80;
        const wa = this.room!.walkableArea;
        const x = margin + Math.random() * (wa.width - margin * 2) + wa.x;
        const y = margin + Math.random() * (wa.height - margin * 2) + wa.y;
        const e = new Enemy(x, y, type as any);
        this.enemies.push(e);
        this.gameContainer!.addChild(e.sprite);
      }
    });

    this.boss = boss;
    this.bossSpawned = true;
    this.gameContainer.addChild(boss.sprite);
    this.gameContainer.addChild(boss.telegraphs);

    this.bossHpBar = new BossHpBar(SCREEN_WIDTH);
    this.app.stage.addChild(this.bossHpBar.container);

    Logger.log('entity', `Boss spawned: ${boss.name}`);
  }

  private update(dt: number) {
    if (this.state === State.Playing) {
      // Dev console toggle
      if (this.input.isKeyDown('Backquote')) {
        if (!this._consoleKeyWasDown) {
          this.devConsole.toggle();
          this._consoleKeyWasDown = true;
        }
      } else {
        this._consoleKeyWasDown = false;
      }
      if (this.devConsole.isVisible()) return;

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

      if (this.inventoryOpen && this.input.isKeyDown('Escape')) {
        this.toggleInventory();
      } else if (this.inventoryOpen) {
        const iDown = this.input.isKeyDown('KeyI');
        if (iDown && !this.wasIKeyDown) this.toggleInventory();
        this.wasIKeyDown = iDown;
      } else {
        const pDown = this.input.isKeyDown('KeyP');
        if (pDown && !this.wasPKeyDown) this.toggleTree();
        this.wasPKeyDown = pDown;

        const iDown = this.input.isKeyDown('KeyI');
        if (iDown && !this.wasIKeyDown) this.toggleInventory();
        this.wasIKeyDown = iDown;
      }
    }
    switch (this.state) {
      case State.Menu: this.mainMenu?.update(this.input); break;
      case State.Picking:
        this.classSelect?.update(this.input);
        this.abilitySelect?.update(this.input);
        break;
      case State.Playing:
        if (this.inventoryOpen) {
          this.updateInventory();
        } else if (this.treeOpen) {
          this.updateTree();
        } else {
          this.updateGameplay(dt);
        }
        break;
      case State.Death: this.deathScreen?.update(this.input); break;
    }
  }

  private updateGameplay(dt: number) {
    if (!this.player?.alive || !this.room) return;

    let mouseWX = this.input.mouseX;
    let mouseWY = this.input.mouseY;
    if (this.gameContainer) {
      const local = this.gameContainer.toLocal(new Point(this.input.mouseX, this.input.mouseY));
      mouseWX = local.x;
      mouseWY = local.y;
    }

    // Handle dash movement
    if (this.dash) {
      const d = this.dash;
      d.progress += dt;
      const t = Math.min(1, d.progress / d.length);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      this.player.x = d.startX + (d.targetX - d.startX) * ease;
      this.player.y = d.startY + (d.targetY - d.startY) * ease;

      const b = this.player.getBounds();
      for (const wall of this.room.walls) {
        if (b.x < wall.x + wall.width && b.x + b.width > wall.x &&
            b.y < wall.y + wall.height && b.y + b.height > wall.y) {
          this.dash = null;
          break;
        }
      }

      if (t >= 1) this.dash = null;
    }

    this.player.update(this.input, mouseWX, mouseWY, this.room.walls, dt);

    // HP regen from passive tree
    if (this.player.health < this.player.maxHealth) {
      const hpRegen = this.player.computedStats.hpRegen || 0;
      if (hpRegen > 0) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + hpRegen * (dt / 60));
      }
    }

    const cullPct = this.player.computedStats.cullingStrikePct || 0;
    const explodePct = this.player.computedStats.explodeOnKillPct || 0;

    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.cullThreshold = cullPct > 0 ? Math.round(enemy.maxHealth * cullPct / 100) : 0;
        enemy.update(this.player.x, this.player.y, this.room.walls, dt, this.enemies);
        for (const p of enemy.projectiles) {
          this.projectiles.push(p);
          this.gameContainer!.addChild(p.sprite);
        }
        enemy.projectiles = [];
      }
    }

    // Boss update
    if (this.boss?.alive) {
      this.boss.update(this.player.x, this.player.y, dt, this.room!.walls);
      for (const p of this.boss.projectiles) {
        this.projectiles.push(p);
        this.gameContainer!.addChild(p.sprite);
      }
      this.boss.projectiles = [];

      if (rectsOverlap(this.player.getBounds(), this.boss.getBounds())) {
        this.player.takeDamage(this.boss.damage);
        this.combatText.showDamage(this.player.x, this.player.y - 20, this.boss.damage, 0xff6666);
      }

      this.bossHpBar?.update(this.boss);
    }

    this.combatText.update(dt);
    this.portalAngle += dt * 0.03;

    // Recall portal drawing and collision
    if (this.recallPortal?.active) {
      const rp = this.recallPortal;
      const g = rp.graphic;
      g.clear();
      const cx = rp.x;
      const cy = rp.y;
      const spin = this.portalAngle;
      g.lineStyle(2, 0xaa66ff, 0.5);
      g.drawCircle(cx, cy, 24);
      for (let i = 0; i < 8; i++) {
        const a = spin + (i / 8) * Math.PI * 2;
        const len = 8 + 16 * Math.abs(Math.sin(a));
        g.lineStyle(2, 0xcc88ff, 0.3 + 0.5 * Math.abs(Math.sin(a)));
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      }
      if (this.player && Math.hypot(this.player.x - cx, this.player.y - cy) < 40) {
        this.recallPortal = null;
        this.zoneManager.transitionTo('hub');
        this.buildCurrentZoneRoom();
      }
    }

    // Update VFX
    for (let i = this.vfx.length - 1; i >= 0; i--) {
      const v = this.vfx[i];
      v.life -= dt;
      const t = 1 - v.life / v.maxLife;
      v.g.clear();
      v.draw(v.g, Math.min(1, t));
      if (v.life <= 0) {
        this.gameContainer!.removeChild(v.g);
        v.g.destroy();
        this.vfx.splice(i, 1);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (!p.alive) {
        this.gameContainer!.removeChild(p.sprite);
        p.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      let hit = false;
      if (p.hostile) {
        if (this.player && rectsOverlap(p.getBounds(), this.player.getBounds())) {
          if (this.player.takeDamage(p.damage)) {
            this.combatText.showDamage(this.player.x, this.player.y - 20, p.damage, 0xff6666);
          }
          if (p.slowDuration > 0) this.player.applySlow(p.slowDuration);
          hit = true;
        }
      } else {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (rectsOverlap(p.getBounds(), enemy.getBounds())) {
            enemy.takeDamage(p.damage);
            this.combatText.showDamage(enemy.x, enemy.y - 20, p.damage, 0xffaa00);
            if (!p.pierce) {
              hit = true;
              break;
            }
          }
        }
        // Check boss hit
        if (!p.hostile && this.boss?.alive) {
          if (rectsOverlap(p.getBounds(), this.boss.getBounds())) {
            this.boss.takeDamage(p.damage);
            this.combatText.showDamage(this.boss.x, this.boss.y - 20, p.damage, 0xffaa00);
            if (!p.pierce) {
              hit = true;
            }
          }
        }
      }
      if (hit) {
        this.gameContainer!.removeChild(p.sprite);
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    // Contact damage
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (rectsOverlap(this.player.getBounds(), enemy.getBounds())) {
        if (enemy.canDamagePlayer()) {
          this.player.takeDamage(enemy.damage);
          this.combatText.showDamage(this.player.x, this.player.y - 20, enemy.damage, 0xff6666);
          enemy.onDamagePlayer();
        }
      }
    }

    // Boss telegraph damage
    if (this.boss?.alive && this.boss.chosenAttack && this.boss.attacking) {
      const t = this.boss.chosenAttack;
      let inZone = false;

      switch (t.type) {
        case 'circle':
          inZone = Math.hypot(this.player.x - t.x, this.player.y - t.y) < (t.radius || 80);
          break;
        case 'cone': {
          const dx = this.player.x - t.x;
          const dy = this.player.y - t.y;
          const dist = Math.hypot(dx, dy);
          if (dist < (t.radius || 100)) {
            const angleToPlayer = Math.atan2(dy, dx);
            let diff = angleToPlayer - (t.angle || 0);
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            inZone = Math.abs(diff) < 0.6;
          }
          break;
        }
        case 'line': {
          const lx = t.targetX || t.x;
          const ly = t.targetY || t.y;
          const lineLen = Math.hypot(lx - t.x, ly - t.y);
          if (lineLen > 0) {
            const tParam = ((this.player.x - t.x) * (lx - t.x) + (this.player.y - t.y) * (ly - t.y)) / (lineLen * lineLen);
            if (tParam >= 0 && tParam <= 1) {
              const closestX = t.x + tParam * (lx - t.x);
              const closestY = t.y + tParam * (ly - t.y);
              inZone = Math.hypot(this.player.x - closestX, this.player.y - closestY) < 40;
            }
          }
          break;
        }
      }

      if (inZone) {
        this.player.takeDamage(this.boss.damage);
        this.combatText.showDamage(this.player.x, this.player.y - 20, this.boss.damage, 0xff6666);
      }
    }

    this.handleSkillKeys(mouseWX, mouseWY);

    if (this.input.consumeClick()) {
      // Portal click check (game coords, must be near portal)
      let clickedItem = false;
      for (const portal of this.room?.portals ?? []) {
        const cx = portal.rect.x + portal.rect.width / 2;
        const cy = portal.rect.y + portal.rect.height / 2;
        const distToPlayer = Math.hypot(this.player!.x - cx, this.player!.y - cy);
        if (distToPlayer < 150 && Math.hypot(mouseWX - cx, mouseWY - cy) < 60 && this.zoneManager.isZoneUnlocked(portal.targetZone)) {
          this.zoneManager.transitionTo(portal.targetZone);
          this.buildCurrentZoneRoom();
          clickedItem = true;
          break;
        }
      }
      if (!clickedItem) for (const drop of this.itemDrops) {
        if (drop.pickedUp) continue;
        if (isOrbDrop(drop) && Math.hypot(mouseWX - drop.x, mouseWY - drop.y) < 30) {
          if (this.player!.pickupOrb(drop.item.orbId)) {
            drop.pickup();
            this.gameContainer!.removeChild(drop.container);
            drop.destroy();
            this.itemDrops.splice(this.itemDrops.indexOf(drop), 1);
          }
          clickedItem = true;
          break;
        }
        if (isEquippableDrop(drop) && Math.hypot(mouseWX - drop.x, mouseWY - drop.y) < 30) {
          const gen = drop.item.generated;
          if (this.player!.pickupItem(gen)) {
            drop.pickup();
            this.gameContainer!.removeChild(drop.container);
            drop.destroy();
            this.itemDrops.splice(this.itemDrops.indexOf(drop), 1);
          }
          clickedItem = true;
          break;
        }
      }
      if (!clickedItem) {
        this.useMainAbility();
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].alive) {
        const dead = this.enemies.splice(i, 1)[0];

        // Explode on kill
        if (explodePct > 0) {
          const explodeDmg = Math.round(dead.maxHealth * explodePct / 100);
          for (const other of this.enemies) {
            if (!other.alive) continue;
            if (Math.hypot(other.x - dead.x, other.y - dead.y) < 120) {
              other.takeDamage(explodeDmg);
              this.combatText.showDamage(other.x, other.y - 20, explodeDmg, 0xff6600);
            }
          }
        }

        this.gameContainer!.removeChild(dead.sprite);
        const healAmt = this.player.skills.healOnKill();
        if (healAmt > 0) this.player.heal(healAmt);
        if (this.player.addXp(dead.xpReward)) {
          this.combatText.showDamage(dead.x, dead.y - 30, this.player.level - 1, 0x44ff88);
          Logger.log('combat', `Player reached level ${this.player.level}`);
        }
        this.spawnLoot(dead.x, dead.y);
        dead.destroy();
      }
    }

    // Boss death
    if (this.boss && !this.boss.alive && this.bossSpawned) {
      this.bossSpawned = false;

      this.zoneManager.markZoneCompleted(this.zoneManager.state!.zoneId);

      this.spawnLoot(this.boss.x, this.boss.y);
      this.spawnLoot(this.boss.x - 40, this.boss.y);
      this.spawnLoot(this.boss.x + 40, this.boss.y);

      if (this.player.addXp(this.boss.xpReward)) {
        this.combatText.showDamage(this.boss.x, this.boss.y - 30, this.player.level - 1, 0x44ff88);
      }

      this.gameContainer!.removeChild(this.boss.telegraphs);
      if (this.bossHpBar) {
        this.app.stage.removeChild(this.bossHpBar.container);
        this.bossHpBar.destroy();
        this.bossHpBar = undefined;
      }

      Logger.log('system', `${this.boss.name} defeated — zone completed`);
    }

    // Desert boss room placeholder: mark completed when all enemies dead
    if (this.zoneManager.state?.config.id === 'desert' && this.zoneManager.state?.roomIndex === this.zoneManager.state?.config.roomCount - 1) {
      if (this.enemies.length === 0 && !this.bossSpawned && this.zoneManager.state) {
        const zoneId = this.zoneManager.state.zoneId;
        if (!this.zoneManager.completedZoneIds.has(zoneId)) {
          this.zoneManager.markZoneCompleted(zoneId);
          Logger.log('system', 'Desert boss room cleared — zone completed');
        }
      }
    }

    // Zone transition logic
    const zone = this.zoneManager.state?.config;

    // Arena: wave-based spawning
    if (zone?.isEndless === 'wave') {
      if (this.enemies.length === 0) {
        if (this.waveCooldown <= 0) {
          this.waveCooldown = 120;
        } else {
          this.waveCooldown -= dt;
          if (this.waveCooldown <= 0) {
            this.zoneManager.nextWave();
            this.buildCurrentZoneRoom();
          }
        }
      }
    }

    // Door overlap check
    for (const door of this.room?.doors ?? []) {
      // Tutorial door is locked until tutorial is complete
      if (zone?.id === 'tutorial' && this.tutorialStage !== 'complete') continue;

      if (this.player && rectsOverlap(this.player.getBounds(), door.rect)) {
        if (zone && door.targetZone === zone.id) {
          const next = this.zoneManager.nextRoom();
          if (!next) {
            Logger.log('system', 'No next room — staying');
            break;
          }
        } else {
          this.zoneManager.transitionTo(door.targetZone);
          if (zone?.id === 'tutorial') {
            this.zoneManager.markZoneCompleted('tutorial');
          }
        }
        this.buildCurrentZoneRoom();
        break;
      }
    }

    this.tryPickupItems();
    this.hud?.update(this.player);
    this.hud?.setZoneName(this.zoneManager.state?.config?.name ?? '');
    this.skillBar?.update(this.player.skills);
    if (!this.player.alive) this.showDeathScreen();
  }

  private addVfx(draw: (g: Graphics, t: number) => void, duration: number): Graphics {
    const g = new Graphics();
    this.gameContainer!.addChild(g);
    this.vfx.push({ g, life: duration, maxLife: duration, draw });
    return g;
  }

  // --- Visual effects ---

  private vfxCleave(x: number, y: number, angle: number) {
    this.addVfx((g, t) => {
      const r = 80 * Math.min(1, t * 2.5);
      const a = 60 * D;
      const alpha = Math.max(0, 1 - t * 1.2);
      g.beginFill(0xffaa44, alpha * 0.25);
      g.moveTo(0, 0);
      g.arc(0, 0, r, angle - a, angle + a);
      g.closePath();
      g.endFill();
      g.lineStyle(2, 0xffcc66, alpha);
      g.arc(0, 0, r, angle - a, angle + a);
    }, 25).position.set(x, y);
  }

  private vfxImpact(x: number, y: number) {
    this.addVfx((g, t) => {
      const r = 20 + 25 * t;
      const alpha = Math.max(0, 1 - t * 1.5);
      g.lineStyle(2, 0xffffff, alpha);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.beginFill(0xffffaa, alpha * 0.3);
      g.drawCircle(0, 0, r * 0.4);
      g.endFill();
    }, 20).position.set(x, y);
  }

  private vfxWhirlwind(x: number, y: number) {
    this.addVfx((g, t) => {
      const r = 75;
      const alpha = Math.max(0, 1 - t * 0.8);
      const spinAngle = t * Math.PI * 4;
      g.lineStyle(3, 0x88ccff, alpha * 0.6);
      g.drawCircle(0, 0, r);
      for (let i = 0; i < 6; i++) {
        const a = spinAngle + (i / 6) * Math.PI * 2;
        const cx = Math.cos(a) * r * 0.7;
        const cy = Math.sin(a) * r * 0.7;
        g.beginFill(0x88ddff, alpha * 0.3);
        g.drawCircle(cx, cy, 10 + 5 * Math.sin(t * Math.PI * 6 + i));
        g.endFill();
      }
    }, 50).position.set(x, y);
  }

  private vfxHeavyStrike(x: number, y: number, angle: number) {
    this.addVfx((g, t) => {
      const r = 40 * t;
      const alpha = Math.max(0, 1 - t * 1.3);
      const perp = angle + Math.PI / 2;
      g.lineStyle(3, 0xff8844, alpha);
      g.moveTo(Math.cos(perp) * r * 0.3, Math.sin(perp) * r * 0.3);
      g.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      g.lineStyle(1, 0xffcc88, alpha * 0.5);
      for (let i = -2; i <= 2; i++) {
        const spread = perp + i * 0.2;
        g.moveTo(Math.cos(spread) * r * 0.2, Math.sin(spread) * r * 0.2);
        g.lineTo(Math.cos(spread) * r * 1.2, Math.sin(spread) * r * 1.2);
      }
    }, 20).position.set(x, y);
  }

  private vfxChargeTrail(x: number, y: number, angle: number, dist: number) {
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.5 - t * 1.5);
      g.lineStyle(3, 0x66ccff, alpha);
      const len = dist * (1 - t);
      g.moveTo(0, 0);
      g.lineTo(-Math.cos(angle) * len, -Math.sin(angle) * len);
      g.lineStyle(1, 0xaaeeff, alpha * 0.5);
      for (let i = -3; i <= 3; i++) {
        const spread = angle + Math.PI / 2 + i * 0.15;
        g.moveTo(-Math.cos(angle) * len * 0.5, -Math.sin(angle) * len * 0.5);
        g.lineTo(
          -Math.cos(angle) * len * 0.5 + Math.cos(spread) * 8,
          -Math.sin(angle) * len * 0.5 + Math.sin(spread) * 8,
        );
      }
    }, 30).position.set(x, y);
  }

  private vfxRing(x: number, y: number, color: number, maxRadius: number) {
    this.addVfx((g, t) => {
      const r = maxRadius * t;
      const alpha = Math.max(0, 1 - t * 1.2);
      g.lineStyle(2, color, alpha);
      g.drawCircle(0, 0, r);
      g.lineStyle(4, color, alpha * 0.3);
      g.drawCircle(0, 0, r * 0.8);
    }, 30).position.set(x, y);
  }

  private vfxProjectileTrail(p: Projectile) {
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.4 - t * 1.2);
      g.lineStyle(1, 0xffdd44, alpha);
      g.moveTo(0, 0);
      g.lineTo(-p.vx * 0.5, -p.vy * 0.5);
    }, 15).position.set(p.x, p.y);
  }

  private vfxGroundSlam(x: number, y: number, angle: number) {
    this.addVfx((g, t) => {
      const r = 180 * t;
      const alpha = Math.max(0, 1 - t * 1.1);
      const halfA = 90 * D;
      g.beginFill(0x886644, alpha * 0.15);
      g.moveTo(0, 0);
      g.arc(0, 0, r, angle - halfA, angle + halfA);
      g.closePath();
      g.endFill();
      g.lineStyle(2, 0xaa7744, alpha);
      g.arc(0, 0, r, angle - halfA, angle + halfA);
      g.lineStyle(1, 0xcc9955, alpha * 0.5);
      g.arc(0, 0, r * 0.6, angle - halfA * 0.7, angle + halfA * 0.7);
    }, 25).position.set(x, y);
  }

  // --- Skill activation ---

  private handleSkillKeys(mouseWX: number, mouseWY: number) {
    const now = new Set<string>();
    for (const code of ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6']) {
      if (this.input.isKeyDown(code)) now.add(code);
    }
    for (const code of now) {
      if (this.lastKeys.has(code)) continue;
      const idx = parseInt(code.replace('Digit', '')) - 1;
      if (idx === 0) continue;
      this.useSupportSkill(idx, mouseWX, mouseWY);
    }
    this.lastKeys = now;
  }

  private useMainAbility() {
    if (!this.player?.alive) return;
    const skill = this.player.skills.mainAbility;
    const angle = this.player.facingAngle;

    const isProjectileType = skill?.effectType === 'projectile' || skill?.effectType === 'projectile_spread' || skill?.effectType === 'projectile_pierce';
    const isAoeTarget = skill?.effectType === 'aoe_target';

    if (isProjectileType || isAoeTarget) {
      const result = this.player.skills.consume(0, this.player.mana);
      if (!result) return;
      this.player.mana -= result.manaCost;

      this.player.triggerAttackAnimation();

      if (isProjectileType) {
        const px = this.player.x + Math.cos(angle) * 20;
        const py = this.player.y + Math.sin(angle) * 20;
        const newProjectiles = this.player.fireProjectile(px, py, angle, result, this.projectiles);
        for (const p of newProjectiles) {
          this.projectiles.push(p);
          this.gameContainer!.addChild(p.sprite);
          this.vfxProjectileTrail(p);
        }
      } else if (isAoeTarget) {
        let mouseWX = this.input.mouseX;
        let mouseWY = this.input.mouseY;
        if (this.gameContainer) {
          const local = this.gameContainer.toLocal(new Point(this.input.mouseX, this.input.mouseY));
          mouseWX = local.x;
          mouseWY = local.y;
        }

        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(enemy.x - mouseWX, enemy.y - mouseWY);
          if (dist < (result.radius || 100)) {
            const dmg = Math.round(25 * result.damageMult);
            enemy.takeDamage(dmg);
            this.combatText.showDamage(enemy.x, enemy.y - 20, dmg, 0x44ff44);
          }
        }
        this.vfxRing(mouseWX, mouseWY, 0x44ff44, result.radius || 100);
      }
      return;
    }

    if (this.player.useMainAbility(this.enemies)) {
      if (this.player.lastHitInfo) {
        const h = this.player.lastHitInfo;
        this.combatText.showDamage(h.x, h.y - 20, h.damage, 0xffcc00);
        this.player.lastHitInfo = null;
      }

      switch (skill?.id) {
        case 'cleave': this.vfxCleave(this.player.x, this.player.y, angle); break;
        case 'shield_slam':
          for (const e of this.enemies) {
            if (!e.alive) continue;
            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 80) {
              this.vfxImpact(e.x, e.y);
              break;
            }
          }
          break;
        case 'whirlwind': this.vfxWhirlwind(this.player.x, this.player.y); break;
        case 'heavy_strike': this.vfxHeavyStrike(this.player.x, this.player.y, angle); break;
      }
    }
  }

  private useSupportSkill(slot: number, mouseWX: number, mouseWY: number) {
    if (!this.player?.alive) return;
    const skill = this.player.skills.getSkill(slot);
    if (!skill) return;
    const result = this.player.skills.consume(slot, this.player.mana);
    if (!result) return;

    const isProjectileType = result.effectType === 'projectile' || result.effectType === 'projectile_spread';

    if (isProjectileType) {
      const angle = Math.atan2(mouseWY - this.player.y, mouseWX - this.player.x);
      const px = this.player.x + Math.cos(angle) * 20;
      const py = this.player.y + Math.sin(angle) * 20;
      const newProjectiles = this.player.fireProjectile(px, py, angle, result, this.projectiles);
      for (const p of newProjectiles) {
        this.projectiles.push(p);
        this.gameContainer!.addChild(p.sprite);
        this.vfxProjectileTrail(p);
      }
      return;
    }

    switch (result.effectType) {
      case 'dash': {
        let dx: number, dy: number;
        if (result.id === 'retreat') {
          dx = this.player.x - mouseWX;
          dy = this.player.y - mouseWY;
        } else {
          dx = mouseWX - this.player.x;
          dy = mouseWY - this.player.y;
        }
        const dist = Math.hypot(dx, dy);
        if (dist <= 0) break;
        const dashDist = Math.min(result.range || 150, dist);
        const tx = this.player.x + (dx / dist) * dashDist;
        const ty = this.player.y + (dy / dist) * dashDist;

        const testBounds = { x: tx - this.player.width / 2, y: ty - this.player.height / 2, width: this.player.width, height: this.player.height };
        let hitWall = false;
        for (const wall of this.room!.walls) {
          if (testBounds.x < wall.x + wall.width && testBounds.x + testBounds.width > wall.x &&
              testBounds.y < wall.y + wall.height && testBounds.y + testBounds.height > wall.y) {
            hitWall = true;
            break;
          }
        }

        if (!hitWall) {
          this.dash = { startX: this.player.x, startY: this.player.y, targetX: tx, targetY: ty, progress: 0, length: 18 };
          this.vfxChargeTrail(this.player.x, this.player.y, Math.atan2(dy, dx), dashDist);
        }
        break;
      }
      case 'buff': {
        this.player.skills.addBuff(result.id);
        if (result.id === 'war_cry' && result.value) {
          this.player.heal(result.value);
          this.vfxRing(this.player.x, this.player.y, 0x44dd88, 80);
        }
        if (result.id === 'fortify') this.vfxRing(this.player.x, this.player.y, 0x4488ff, 60);
        if (result.id === 'battle_rage') this.vfxRing(this.player.x, this.player.y, 0xff4444, 50);
        if (result.id === 'ignore_pain') this.vfxRing(this.player.x, this.player.y, 0xffdd44, 70);
        if (result.id === 'rally') this.vfxRing(this.player.x, this.player.y, 0x4488ff, 65);
        if (result.id === 'bloodlust') this.vfxRing(this.player.x, this.player.y, 0xff4488, 55);
        if (result.id === 'eagle_eye') this.vfxRing(this.player.x, this.player.y, 0x44ff44, 60);
        if (result.id === 'haste') this.vfxRing(this.player.x, this.player.y, 0x44ccff, 55);
        if (result.id === 'camouflage') this.vfxRing(this.player.x, this.player.y, 0x8888aa, 50);
        Logger.log('skill', `Buff activated: ${result.name}`);
        break;
      }
      case 'aoe_self': {
        if (result.id === 'trap') {
          this.vfxRing(this.player.x, this.player.y, 0xff6622, 20);
        }
        break;
      }
      case 'cone': {
        this.vfxGroundSlam(this.player.x, this.player.y, this.player.facingAngle);
        const angleRad = result.angle || Math.PI / 2;
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > result.range) continue;
          const angleToEnemy = Math.atan2(dy, dx);
          let diff = angleToEnemy - this.player.facingAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) > angleRad / 2) continue;
          const dmg = Math.round(25 * result.damageMult);
          enemy.takeDamage(dmg);
          this.combatText.showDamage(enemy.x, enemy.y - 20, dmg, 0xcc6600);
        }
        break;
      }
    }
  }

  private spawnLoot(x: number, y: number) {
    const pending: { drop: ItemDrop }[] = [];
    const iq = 1 + ((this.player?.computedStats.itemQuantityPct || 0) / 100);
    const mf = this.player?.computedStats.magicFindPct || 0;

    for (const drop of createRandomLoot(x, y, iq)) {
      pending.push({ drop });
    }
    if (Math.random() < 0.4 * iq) {
      const gen = generateItemDrop(this.player?.level, mf);
      pending.push({ drop: createItemDrop(x, y, gen) });
    }
    if (Math.random() < 0.05 * iq) {
      const orb = generateOrbDrop();
      pending.push({ drop: createOrbDrop(x, y, orb.orbId, orb.name) });
    }

    // Spread drops vertically so nameplates don't overlap
    const spacing = 25;
    const total = pending.length;
    if (total > 0) {
      const startY = y - ((total - 1) * spacing) / 2;
      for (let i = 0; i < total; i++) {
        const d = pending[i].drop;
        d.y = startY + i * spacing;
        d.container.y = d.y;
        this.itemDrops.push(d);
        this.gameContainer!.addChild(d.container);
      }
    }
  }

  private tryPickupItems() {
    if (!this.player) return;
    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      if (drop.pickedUp) continue;
      if (isEquippableDrop(drop)) continue;
      if (Math.hypot(drop.x - this.player.x, drop.y - this.player.y) < 50) {
        const item = drop.pickup();
        switch (item.type) {
          case 'gold': this.player!.gold += item.value; break;
          case 'healthPotion': this.player!.health = Math.min(this.player!.maxHealth, this.player!.health + item.value); break;
          case 'manaPotion': this.player!.mana = Math.min(this.player!.maxMana, this.player!.mana + item.value); break;
          case 'orb': this.player!.pickupOrb(item.orbId, item.count); break;
          case 'portalScroll': this.player!.pickupOrb('portal_scroll', item.value); break;
        }
        this.gameContainer!.removeChild(drop.container);
        drop.destroy();
        this.itemDrops.splice(i, 1);
      }
    }
  }

  private showDeathScreen() {
    this.state = State.Death;
    this.deathScreen = new DeathScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.deathScreen.onRestart(() => this.restartGame());
    this.app.stage.addChild(this.deathScreen.container);
  }

  private updateTree() {
    if (!this.passiveTreeScreen || !this.player) return;
    this.passiveTreeScreen.update(
      this.input, this.player.passiveTree,
      this.player.passivePoints, this.player.attrs,
      this.player.unspentAttrPoints,
    );
  }

  private toggleTree() {
    if (!this.player) return;
    this.treeOpen = !this.treeOpen;
    if (this.treeOpen) {
      this.passiveTreeScreen = new PassiveTreeScreen(
        SCREEN_WIDTH, SCREEN_HEIGHT,
        this.player.passiveTree, this.player.passivePoints,
        this.player.attrs, this.player.unspentAttrPoints,
      );
      this.passiveTreeScreen.onAllocateCallback((id) => {
        if (this.player && this.player.passiveTree.allocate(id)) {
          this.player.passivePoints--;
          this.player.recalcStats();
          this.passiveTreeScreen?.update(
            this.input, this.player.passiveTree,
            this.player.passivePoints, this.player.attrs,
            this.player.unspentAttrPoints,
          );
        }
      });
      this.passiveTreeScreen.onAttrChangeCallback((stat, delta) => {
        if (this.player && this.player.unspentAttrPoints > 0) {
          this.player.attrs[stat] += delta;
          this.player.unspentAttrPoints--;
          this.player.recalcStats();
        }
      });
      this.app.stage.addChild(this.passiveTreeScreen.container);
      this.app.ticker.started = true;
    } else {
      if (this.passiveTreeScreen) {
        this.app.stage.removeChild(this.passiveTreeScreen.container);
        this.passiveTreeScreen.destroy();
        this.passiveTreeScreen = undefined;
      }
    }
  }

  private toggleInventory() {
    if (!this.player) return;
    if (this.treeOpen) return;
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.inventoryScreen = new InventoryScreen(
        SCREEN_WIDTH, SCREEN_HEIGHT,
        this.player.inventory, this.player.equipment,
        this.player.computedStats,
      );
      this.inventoryScreen.onEquipCallback((gridIndex: number) => {
        if (this.player) {
          this.player.equipItem(gridIndex);
          this.inventoryScreen?.update(
            this.player.inventory, this.player.equipment,
            this.player.computedStats, this.input,
          );
        }
      });
      this.inventoryScreen.onUnequipCallback((slot: Slot) => {
        if (this.player) {
          this.player.unequipItem(slot);
          this.inventoryScreen?.update(
            this.player.inventory, this.player.equipment,
            this.player.computedStats, this.input,
          );
        }
      });
      this.inventoryScreen.onCraftOrbCallback((orbId: string, slot: Slot): boolean => {
        if (!this.player) return false;
        let success = false;
        switch (orbId) {
          case 'empowerment': success = this.player.empowerItem(slot); break;
          case 'flux': success = this.player.fluxItem(slot); break;
          case 'mutation': success = this.player.mutateItem(slot); break;
          case 'growth': success = this.player.growItem(slot); break;
          case 'ascendance': success = this.player.ascendItem(slot); break;
          case 'purification': success = this.player.purifyItem(slot); break;
        }
        if (success) {
          const orbIdx = this.player.inventory.findIndex(
            s => s !== null && s.kind === 'orb' && s.orbId === orbId
          );
          if (orbIdx >= 0) {
            const orbSlot = this.player.inventory[orbIdx] as any;
            orbSlot.count--;
            if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;
          }
        }
        this.inventoryScreen?.update(
          this.player.inventory, this.player.equipment,
          this.player.computedStats, this.input,
        );
        return success;
      });
      this.inventoryScreen.onCraftOrbGridCallback((orbId: string, gridIndex: number): boolean => {
        if (!this.player) return false;
        let success = false;
        switch (orbId) {
          case 'empowerment': success = this.player.empowerInventoryItem(gridIndex); break;
          case 'flux': success = this.player.fluxInventoryItem(gridIndex); break;
          case 'mutation': success = this.player.mutateInventoryItem(gridIndex); break;
          case 'growth': success = this.player.growInventoryItem(gridIndex); break;
          case 'ascendance': success = this.player.ascendInventoryItem(gridIndex); break;
          case 'purification': success = this.player.purifyInventoryItem(gridIndex); break;
        }
        if (success) {
          const orbIdx = this.player.inventory.findIndex(
            s => s !== null && s.kind === 'orb' && s.orbId === orbId
          );
          if (orbIdx >= 0) {
            const orbSlot = this.player.inventory[orbIdx] as any;
            orbSlot.count--;
            if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;
          }
        }
        this.inventoryScreen?.update(
          this.player.inventory, this.player.equipment,
          this.player.computedStats, this.input,
        );
        return success;
      });
      this.inventoryScreen.onConsumePortalScrollCallback(() => {
        if (!this.player || !this.gameContainer) return;
        const idx = this.player.inventory.findIndex(
          s => s !== null && s.kind === 'orb' && s.orbId === 'portal_scroll'
        );
        if (idx === -1) return;
        const slot = this.player.inventory[idx] as any;
        slot.count--;
        if (slot.count <= 0) this.player.inventory[idx] = null;
        // Create recall portal at player position
        this.recallPortal?.graphic.destroy();
        this.recallPortal = {
          x: this.player.x, y: this.player.y,
          graphic: new Graphics(),
          active: true,
        };
        this.gameContainer.addChild(this.recallPortal.graphic);
        this.toggleInventory();
        Logger.log('system', 'Portal Scroll used — recall portal opened');
      });
      this.app.stage.addChild(this.inventoryScreen.container);
    } else {
      if (this.inventoryScreen) {
        this.app.stage.removeChild(this.inventoryScreen.container);
        this.inventoryScreen.destroy();
        this.inventoryScreen = undefined;
      }
    }
  }

  private updateInventory() {
    if (!this.inventoryScreen || !this.player) return;
    this.inventoryScreen.update(
      this.player.inventory, this.player.equipment,
      this.player.computedStats, this.input,
    );
  }

  private setupConsoleCommands() {
    const c = this.devConsole;

    // Register built-in commands first
    for (const cmd of c.getBuiltInCommands()) c.registerCommand(cmd);

    c.registerCommand({
      name: 'additem', aliases: ['item', 'give'],
      description: 'Add an item to inventory',
      usage: '<baseId> [rarity]',
      run: (args) => {
        if (!this.player) return 'No player';
        const baseId = args[0];
        const base = ITEM_BASES.find(b => b.id === baseId);
        if (!base) return `Unknown base: ${baseId}. Available: ${ITEM_BASES.map(b => b.id).join(', ')}`;
        const rarity = args[1] || 'rare';
        if (!['normal', 'magic', 'rare', 'unique'].includes(rarity)) return 'Rarity must be normal/magic/rare/unique';
        const item = generateItemDrop(this.player.level);
        item.base = base;
        item.rarity = rarity as any;
        const idx = this.player!.inventory.findIndex(s => s === null);
        if (idx === -1) return 'Inventory full';
        this.player!.inventory[idx] = { kind: 'equip', item };
        return `Added ${rarity} ${base.name} to inventory`;
      },
    });

    c.registerCommand({
      name: 'addorb', aliases: ['orb'],
      description: 'Add orbs to inventory',
      usage: '<orbId> [count]',
      run: (args) => {
        if (!this.player) return 'No player';
        const orbId = args[0];
        const valid = ['empowerment', 'flux', 'mutation', 'growth', 'ascendance', 'purification'];
        if (!valid.includes(orbId)) return `Unknown orb: ${orbId}. Valid: ${valid.join(', ')}`;
        const count = parseInt(args[1]) || 1;
        this.player.pickupOrb(orbId, count);
        return `Added ${count}x ${orbId} orb(s)`;
      },
    });

    c.registerCommand({
      name: 'addgold', aliases: ['gold'],
      description: 'Add gold',
      usage: '<amount>',
      run: (args) => {
        if (!this.player) return 'No player';
        this.player.gold += parseInt(args[0]) || 100;
        return `Gold: ${this.player.gold}`;
      },
    });

    c.registerCommand({
      name: 'addlevel', aliases: ['level', 'lvl'],
      description: 'Add levels',
      usage: '<count>',
      run: (args) => {
        if (!this.player) return 'No player';
        const count = parseInt(args[0]) || 1;
        for (let i = 0; i < count; i++) this.player.addXp(this.player.xpToNext);
        return `Level: ${this.player.level}`;
      },
    });

    c.registerCommand({
      name: 'addxp', aliases: ['xp'],
      description: 'Add experience',
      usage: '<amount>',
      run: (args) => {
        if (!this.player) return 'No player';
        const amt = parseInt(args[0]) || 100;
        this.player.addXp(amt);
        return `XP added. Level: ${this.player.level}`;
      },
    });

    c.registerCommand({
      name: 'passivepoints', aliases: ['pp', 'passive'],
      description: 'Add passive skill points',
      usage: '<count>',
      run: (args) => {
        if (!this.player) return 'No player';
        const count = parseInt(args[0]) || 1;
        this.player.passivePoints = (this.player.passivePoints || 0) + count;
        return `Passive points: ${this.player.passivePoints}`;
      },
    });

    c.registerCommand({
      name: 'attrpoints', aliases: ['ap', 'attrs'],
      description: 'Add attribute points',
      usage: '<count>',
      run: (args) => {
        if (!this.player) return 'No player';
        const count = parseInt(args[0]) || 1;
        this.player.unspentAttrPoints = (this.player.unspentAttrPoints || 0) + count;
        return `Attribute points: ${this.player.unspentAttrPoints}`;
      },
    });

    c.registerCommand({
      name: 'heal', aliases: ['h'],
      description: 'Restore health and mana to full',
      usage: '/heal',
      run: () => {
        if (!this.player) return 'No player';
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        return 'Healed to full';
      },
    });

    c.registerCommand({
      name: 'killall', aliases: ['ka'],
      description: 'Kill all enemies on screen',
      usage: '/killall',
      run: () => {
        let count = 0;
        for (const e of this.enemies) {
          if (e.alive) { e.takeDamage(9999); count++; }
        }
        return `Killed ${count} enemies`;
      },
    });

    c.registerCommand({
      name: 'spawn', aliases: [],
      description: 'Spawn enemies of a given type',
      usage: '<type> [count]',
      run: (args) => {
        const valid: EnemyType[] = ['grunt', 'archer', 'juggernaut', 'cultist'];
        const type = args[0] as EnemyType;
        if (!valid.includes(type)) return `Unknown type: ${args[0]}. Valid: ${valid.join(', ')}`;
        const count = parseInt(args[1]) || 1;
        const margin = 80;
        const wa = this.room!.walkableArea;
        for (let i = 0; i < count; i++) {
          let x = margin + Math.random() * (wa.width - margin * 2) + wa.x;
          let y = margin + Math.random() * (wa.height - margin * 2) + wa.y;
          if (this.player && Math.hypot(x - this.player.x, y - this.player.y) < 200) {
            x += 200;
          }
          const e = new Enemy(x, y, type);
          this.enemies.push(e);
          this.gameContainer!.addChild(e.sprite);
        }
        return `Spawned ${count} ${type}(s)`;
      },
    });

    c.registerCommand({
      name: 'speed', aliases: [],
      description: 'Set player movement speed multiplier',
      usage: '<mult>',
      run: (args) => {
        if (!this.player) return 'No player';
        const mult = parseFloat(args[0]) || 1;
        this.player.speed = 6 * mult;
        return `Speed set to ${this.player.speed}`;
      },
    });

    c.registerCommand({
      name: 'god', aliases: ['invuln'],
      description: 'Toggle god mode (invulnerability)',
      usage: '/god',
      run: () => {
        if (!this.player) return 'No player';
        this.player.godMode = !this.player.godMode;
        return `God mode: ${this.player.godMode ? 'ON' : 'OFF'}`;
      },
    });

    c.registerCommand({
      name: 'devroom', aliases: ['dev'],
      description: 'Teleport to developer room',
      usage: '/devroom',
      run: () => {
        if (!this.player) return 'No player';
        this.zoneManager.transitionTo('dev');
        this.buildCurrentZoneRoom();
        return 'Teleported to Developer Room';
      },
    });

    c.onCommandCallback((cmd, args) => {
      return `Unknown command: /${cmd}. Type /help for commands.`;
    });
  }

  private restartGame() {
    if (this.inventoryOpen) this.toggleInventory();
    if (this.inventoryScreen) {
      this.app.stage.removeChild(this.inventoryScreen.container);
      this.inventoryScreen.destroy();
      this.inventoryScreen = undefined;
    }
    if (this.treeOpen) this.toggleTree();
    if (this.passiveTreeScreen) {
      this.app.stage.removeChild(this.passiveTreeScreen.container);
      this.passiveTreeScreen.destroy();
      this.passiveTreeScreen = undefined;
    }
    if (this.deathScreen) {
      this.app.stage.removeChild(this.deathScreen.container);
      this.deathScreen.destroy();
      this.deathScreen = undefined;
    }
    if (this.hud) { this.app.stage.removeChild(this.hud.container); this.hud.destroy(); this.hud = undefined; }
    if (this.skillBar) { this.app.stage.removeChild(this.skillBar.container); this.skillBar.destroy(); this.skillBar = undefined; }

    // Boss cleanup must happen before gameContainer destroy
    if (this.boss) {
      if (this.boss.sprite.parent && this.gameContainer) this.gameContainer.removeChild(this.boss.sprite);
      if (this.boss.telegraphs.parent && this.gameContainer) this.gameContainer.removeChild(this.boss.telegraphs);
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossHpBar) {
      this.app.stage.removeChild(this.bossHpBar.container);
      this.bossHpBar.destroy();
      this.bossHpBar = undefined;
    }
    this.bossSpawned = false;

    if (this.gameContainer) {
      this.app.stage.removeChild(this.gameContainer);
      this.gameContainer.destroy({ children: true });
      this.gameContainer = undefined;
    }
    this.devConsole.hide();
    if (this.tutorialScreen) {
      this.app.stage.removeChild(this.tutorialScreen.container);
      this.tutorialScreen.destroy();
      this.tutorialScreen = undefined;
    }
    this.tutorialStage = null;
    this.tutorialKeys = new Set();
    this.tutorialKeyWasDown = new Set();
    this.enemies = [];
    for (const p of this.projectiles) { p.destroy(); }
    this.projectiles = [];
    this.itemDrops = [];
    this.vfx = [];
    this.waveCooldown = 0;
    this.zoneManager = new ZoneManager();
    if (this.recallPortal) { this.recallPortal.graphic.destroy(); this.recallPortal = null; }
    this.dash = null;
    this.combatText.destroy();
    this.combatText = new CombatTextManager();
    this.player = undefined;
    this.room = undefined;
    this.input.reset();
    this.lastKeys.clear();
    this.showClassSelect();
  }
}
