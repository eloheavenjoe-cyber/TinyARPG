import { Application, Container, Point } from 'pixi.js';
import { InputManager } from './InputManager';
import { Logger } from './Logger';
import { Sprites } from '../rendering/Sprites';
import { MainMenu } from '../ui/MainMenu';
import { DeathScreen } from '../ui/DeathScreen';
import { Room, ROOM_WIDTH, ROOM_HEIGHT, rectsOverlap } from '../world/Room';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;
const ROOM_OFFSET_X = (SCREEN_WIDTH - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = (SCREEN_HEIGHT - ROOM_HEIGHT) / 2;

const enum State {
  Menu,
  Playing,
  Death,
}

export class Game {
  private app: Application;
  private input: InputManager;
  private state = State.Menu;

  private mainMenu?: MainMenu;
  private deathScreen?: DeathScreen;
  private gameContainer?: Container;
  private room?: Room;
  private player?: Player;
  private enemies: Enemy[] = [];

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
    this.mainMenu.onStart(() => this.startGame());
    this.app.stage.addChild(this.mainMenu.container);
    Logger.log('game', 'Main menu added to stage');
  }

  private startGame() {
    Logger.log('game', 'Starting new game session');

    if (this.mainMenu) {
      this.app.stage.removeChild(this.mainMenu.container);
      this.mainMenu.destroy();
      this.mainMenu = undefined;
    }

    this.state = State.Playing;

    this.gameContainer = new Container();
    this.gameContainer.x = ROOM_OFFSET_X;
    this.gameContainer.y = ROOM_OFFSET_Y;
    this.app.stage.addChild(this.gameContainer);

    this.room = new Room();
    this.gameContainer.addChild(this.room.container);

    this.player = new Player(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
    this.gameContainer.addChild(this.player.sprite);

    this.spawnEnemy();
    Logger.log('game', `Game world ready: room=(${ROOM_WIDTH}x${ROOM_HEIGHT}), offset=(${ROOM_OFFSET_X}, ${ROOM_OFFSET_Y})`);
  }

  private spawnEnemy() {
    const margin = 80;
    const wa = this.room!.walkableArea;
    let x: number, y: number;
    const minDist = 250;
    do {
      x = margin + Math.random() * (wa.width - margin * 2) + wa.x;
      y = margin + Math.random() * (wa.height - margin * 2) + wa.y;
    } while (this.player && Math.hypot(x - this.player.x, y - this.player.y) < minDist);

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
      if (enemy.alive) {
        enemy.update(this.player.x, this.player.y, this.room.walls, dt);
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (rectsOverlap(this.player.getBounds(), enemy.getBounds())) {
        this.player.takeDamage(8);
      }
    }

    if (this.input.consumeClick()) {
      this.player.meleeAttack(this.enemies);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].alive) {
        const dead = this.enemies.splice(i, 1)[0];
        this.gameContainer!.removeChild(dead.sprite);
        this.spawnEnemy();
      }
    }

    if (!this.player.alive) {
      this.showDeathScreen();
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
    Logger.log('game', 'Restarting game');

    if (this.deathScreen) {
      this.app.stage.removeChild(this.deathScreen.container);
      this.deathScreen.destroy();
      this.deathScreen = undefined;
    }

    if (this.gameContainer) {
      this.app.stage.removeChild(this.gameContainer);
      this.gameContainer.destroy({ children: true });
      this.gameContainer = undefined;
    }

    this.enemies = [];
    this.player = undefined;
    this.room = undefined;
    this.input.reset();

    this.startGame();
  }
}
