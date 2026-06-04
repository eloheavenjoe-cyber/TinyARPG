import { Application, Container, Point } from 'pixi.js';
import { InputManager } from './InputManager';
import { Logger } from './Logger';
import { Sprites } from '../rendering/Sprites';
import { MainMenu } from '../ui/MainMenu';
import { AbilitySelect } from '../ui/AbilitySelect';
import { DeathScreen } from '../ui/DeathScreen';
import { HUD } from '../ui/HUD';
import { SkillBar } from '../ui/SkillBar';
import { Room, ROOM_WIDTH, ROOM_HEIGHT, rectsOverlap } from '../world/Room';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatTextManager } from '../entities/CombatText';
import { ItemDrop, createRandomLoot } from '../entities/ItemDrop';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;
const ROOM_OFFSET_X = (SCREEN_WIDTH - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = (SCREEN_HEIGHT - ROOM_HEIGHT) / 2;

const enum State {
  Menu,
  Picking,
  Playing,
  Death,
}

export class Game {
  private app: Application;
  private input: InputManager;
  private state = State.Menu;

  private mainMenu?: MainMenu;
  private abilitySelect?: AbilitySelect;
  private deathScreen?: DeathScreen;
  private hud?: HUD;
  private skillBar?: SkillBar;
  private gameContainer?: Container;
  private room?: Room;
  private player?: Player;
  private enemies: Enemy[] = [];
  private itemDrops: ItemDrop[] = [];
  private combatText: CombatTextManager = new CombatTextManager();

  private lastKeys: Set<string> = new Set();

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager(app.view as HTMLCanvasElement);
    Sprites.generateAll();
    Logger.log('game', 'TinyARPG initialized');
  }

  start() {
    this.app.ticker.add((dt) => this.update(dt));
    this.showMainMenu();
  }

  private showMainMenu() {
    this.state = State.Menu;
    this.mainMenu = new MainMenu(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.mainMenu.onStart(() => this.showAbilitySelect());
    this.app.stage.addChild(this.mainMenu.container);
    Logger.log('game', 'Main menu displayed');
  }

  private showAbilitySelect() {
    if (this.mainMenu) {
      this.app.stage.removeChild(this.mainMenu.container);
      this.mainMenu.destroy();
      this.mainMenu = undefined;
    }

    this.state = State.Picking;
    this.abilitySelect = new AbilitySelect(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.abilitySelect.onPick((id) => this.startGame(id));
    this.app.stage.addChild(this.abilitySelect.container);
    Logger.log('game', 'Ability select displayed');
  }

  private startGame(abilityId: string) {
    Logger.log('game', `Starting new game session with ability: ${abilityId}`);

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

    this.player = new Player(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
    this.player.skills.selectMainAbility(abilityId);
    this.gameContainer.addChild(this.player.sprite);
    this.gameContainer.addChild(this.combatText.container);

    this.hud = new HUD();
    this.app.stage.addChild(this.hud.container);

    this.skillBar = new SkillBar();
    this.app.stage.addChild(this.skillBar.container);

    this.spawnEnemy();
    Logger.log('game', `Game ready: ${abilityId}, room=(${ROOM_WIDTH}x${ROOM_HEIGHT})`);
  }

  private spawnEnemy() {
    const margin = 80;
    const wa = this.room!.walkableArea;
    let x: number, y: number;
    do {
      x = margin + Math.random() * (wa.width - margin * 2) + wa.x;
      y = margin + Math.random() * (wa.height - margin * 2) + wa.y;
    } while (this.player && Math.hypot(x - this.player.x, y - this.player.y) < 250);
    const enemy = new Enemy(x, y);
    this.enemies.push(enemy);
    this.gameContainer!.addChild(enemy.sprite);
    Logger.log('entity', `Enemy spawned at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }

  private update(dt: number) {
    switch (this.state) {
      case State.Menu:
        this.mainMenu?.update(this.input);
        break;
      case State.Picking:
        this.abilitySelect?.update(this.input);
        break;
      case State.Playing:
        this.updateGameplay(dt);
        break;
      case State.Death:
        this.deathScreen?.update(this.input);
        break;
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

    this.player.update(this.input, mouseWX, mouseWY, this.room.walls, dt);

    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.update(this.player.x, this.player.y, this.room.walls, dt);
    }

    this.combatText.update(dt);

    // Contact damage
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (rectsOverlap(this.player.getBounds(), enemy.getBounds())) {
        const dmg = 8;
        this.player.takeDamage(dmg);
        this.combatText.showDamage(this.player.x, this.player.y - 20, dmg, 0xff6666);
      }
    }

    // Skill slot key presses
    this.handleSkillKeys(mouseWX, mouseWY);

    // Main ability on click
    if (this.input.consumeClick()) {
      this.useMainAbility();
    }

    // Dead enemies → loot + respawn
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].alive) {
        const dead = this.enemies.splice(i, 1)[0];
        this.gameContainer!.removeChild(dead.sprite);

        const healAmt = this.player.skills.healOnKill();
        if (healAmt > 0) this.player.heal(healAmt);

        this.spawnLoot(dead.x, dead.y);
        this.spawnEnemy();
      }
    }

    this.tryPickupItems();

    this.hud?.update(this.player);
    this.skillBar?.update(this.player.skills);

    if (!this.player.alive) this.showDeathScreen();
  }

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
    if (this.player.useMainAbility(this.enemies)) {
      if (this.player.lastHitInfo) {
        const h = this.player.lastHitInfo;
        this.combatText.showDamage(h.x, h.y - 20, h.damage, 0xffcc00);
        this.player.lastHitInfo = null;
      }
    }
  }

  private useSupportSkill(slot: number, mouseWX: number, mouseWY: number) {
    if (!this.player?.alive) return;
    const skill = this.player.skills.getSkill(slot);
    if (!skill) return;

    const result = this.player.skills.consume(slot, this.player.mana);
    if (!result) return;

    switch (result.effectType) {
      case 'dash': {
        const dx = mouseWX - this.player.x;
        const dy = mouseWY - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          const dashDist = Math.min(result.range || 150, dist);
          this.player.x += (dx / dist) * dashDist;
          this.player.y += (dy / dist) * dashDist;

          const b = this.player.getBounds();
          const resolved = { x: b.x, y: b.y };
          for (const wall of this.room!.walls) {
            if (resolved.x < wall.x + wall.width && resolved.x + b.width > wall.x &&
                resolved.y < wall.y + wall.height && resolved.y + b.height > wall.y) {
              const overlapLeft = (resolved.x + b.width) - wall.x;
              const overlapRight = (wall.x + wall.width) - resolved.x;
              const overlapTop = (resolved.y + b.height) - wall.y;
              const overlapBottom = (wall.y + wall.height) - resolved.y;
              const minX = Math.min(overlapLeft, overlapRight);
              const minY = Math.min(overlapTop, overlapBottom);
              if (minX < minY) {
                resolved.x = overlapLeft < overlapRight ? wall.x - b.width : wall.x + wall.width;
              } else {
                resolved.y = overlapTop < overlapBottom ? wall.y - b.height : wall.y + wall.height;
              }
            }
          }
          this.player.x = resolved.x + this.player.width / 2;
          this.player.y = resolved.y + this.player.height / 2;
          Logger.log('skill', `Dash to (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})`);
        }
        break;
      }
      case 'buff': {
        this.player.skills.addBuff(result.id);
        if (result.id === 'war_cry' && result.value) {
          this.player.heal(result.value);
        }
        Logger.log('skill', `Buff activated: ${result.name}`);
        break;
      }
      case 'cone': {
        const angleRad = result.angle || Math.PI / 2;
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > result.range) continue;
          const angleToEnemy = Math.atan2(dy, dx);
          let diff = angleToEnemy - this.player.sprite.rotation;
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
    const drops = createRandomLoot(x, y);
    for (const drop of drops) {
      this.itemDrops.push(drop);
      this.gameContainer!.addChild(drop.container);
    }
    Logger.log('combat', `Spawned ${drops.length} item(s) at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }

  private tryPickupItems() {
    if (!this.player) return;
    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      if (drop.pickedUp) continue;
      if (Math.hypot(drop.x - this.player.x, drop.y - this.player.y) < 50) {
        const item = drop.pickup();
        switch (item.type) {
          case 'gold': this.player!.gold += item.value; break;
          case 'healthPotion': this.player!.health = Math.min(this.player!.maxHealth, this.player!.health + item.value); break;
          case 'manaPotion': this.player!.mana = Math.min(this.player!.maxMana, this.player!.mana + item.value); break;
        }
        this.gameContainer!.removeChild(drop.container);
        drop.destroy();
        this.itemDrops.splice(i, 1);
      }
    }
  }

  private showDeathScreen() {
    this.state = State.Death;
    Logger.log('game', 'Showing death screen');
    this.deathScreen = new DeathScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.deathScreen.onRestart(() => this.restartGame());
    this.app.stage.addChild(this.deathScreen.container);
  }

  private restartGame() {
    if (this.deathScreen) {
      this.app.stage.removeChild(this.deathScreen.container);
      this.deathScreen.destroy();
      this.deathScreen = undefined;
    }
    if (this.hud) {
      this.app.stage.removeChild(this.hud.container);
      this.hud.destroy();
      this.hud = undefined;
    }
    if (this.skillBar) {
      this.app.stage.removeChild(this.skillBar.container);
      this.skillBar.destroy();
      this.skillBar = undefined;
    }
    if (this.gameContainer) {
      this.app.stage.removeChild(this.gameContainer);
      this.gameContainer.destroy({ children: true });
      this.gameContainer = undefined;
    }
    this.enemies = [];
    this.itemDrops = [];
    this.combatText.destroy();
    this.combatText = new CombatTextManager();
    this.player = undefined;
    this.room = undefined;
    this.input.reset();
    this.lastKeys.clear();
    this.showAbilitySelect();
  }
}
