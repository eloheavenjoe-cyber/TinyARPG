import { Application, Container, Point, Graphics } from 'pixi.js';
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
  private vfx: VfxEffect[] = [];
  private dash: DashState | null = null;

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
  }

  private startGame(abilityId: string) {
    Logger.log('game', `Starting with ability: ${abilityId}`);
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
  }

  private spawnEnemy() {
    const margin = 80;
    const wa = this.room!.walkableArea;
    let x: number, y: number;
    do {
      x = margin + Math.random() * (wa.width - margin * 2) + wa.x;
      y = margin + Math.random() * (wa.height - margin * 2) + wa.y;
    } while (this.player && Math.hypot(x - this.player.x, y - this.player.y) < 250);
    const e = new Enemy(x, y);
    this.enemies.push(e);
    this.gameContainer!.addChild(e.sprite);
  }

  private update(dt: number) {
    switch (this.state) {
      case State.Menu: this.mainMenu?.update(this.input); break;
      case State.Picking: this.abilitySelect?.update(this.input); break;
      case State.Playing: this.updateGameplay(dt); break;
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

    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.update(this.player.x, this.player.y, this.room.walls, dt);
    }

    this.combatText.update(dt);

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

    // Contact damage
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (rectsOverlap(this.player.getBounds(), enemy.getBounds())) {
        const dmg = 8;
        this.player.takeDamage(dmg);
        this.combatText.showDamage(this.player.x, this.player.y - 20, dmg, 0xff6666);
      }
    }

    this.handleSkillKeys(mouseWX, mouseWY);

    if (this.input.consumeClick()) {
      this.useMainAbility();
    }

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
    const angle = this.player.sprite.rotation;

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

    switch (result.effectType) {
      case 'dash': {
        const dx = mouseWX - this.player.x;
        const dy = mouseWY - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0) break;
        const dashDist = Math.min(result.range || 150, dist);
        const tx = this.player.x + (dx / dist) * dashDist;
        const ty = this.player.y + (dy / dist) * dashDist;

        // Wall check
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
        Logger.log('skill', `Buff activated: ${result.name}`);
        break;
      }
      case 'cone': {
        this.vfxGroundSlam(this.player.x, this.player.y, this.player.sprite.rotation);
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
    if (this.hud) { this.app.stage.removeChild(this.hud.container); this.hud.destroy(); this.hud = undefined; }
    if (this.skillBar) { this.app.stage.removeChild(this.skillBar.container); this.skillBar.destroy(); this.skillBar = undefined; }
    if (this.gameContainer) {
      this.app.stage.removeChild(this.gameContainer);
      this.gameContainer.destroy({ children: true });
      this.gameContainer = undefined;
    }
    this.enemies = [];
    this.itemDrops = [];
    this.vfx = [];
    this.dash = null;
    this.combatText.destroy();
    this.combatText = new CombatTextManager();
    this.player = undefined;
    this.room = undefined;
    this.input.reset();
    this.lastKeys.clear();
    this.showAbilitySelect();
  }
}
