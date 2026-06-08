import { Sprite, Texture, AnimatedSprite, Text, TextStyle, Container, Graphics } from 'pixi.js';
import { MonsterRarity, MonsterMod, RARITY_COLORS } from '../core/MonsterMods';
import { Sprites } from '../rendering/Sprites';
import { createCultistSprite, playCultistAnimation, CultistAnimName, createArcherSprite, playArcherAnimation, ArcherAnimName, createGruntSprite, playGruntAnimation, GruntAnimName, createJuggernautSprite, playJuggernautAnimation, JuggernautAnimName, Direction, angleToDirection } from '../rendering/SpriteAnimator';
import { Logger } from '../core/Logger';
import { Rect, resolveCollision } from '../world/Room';
import { Projectile } from './Projectile';

export type EnemyType = 'grunt' | 'archer' | 'juggernaut' | 'cultist';

interface EnemyConfig {
  hp: number;
  speed: number;
  size: number;
  xp: number;
  sprite: Texture;
  damage: number;
  detectRange: number;
  deaggroRange: number;
}

function getConfig(type: EnemyType): EnemyConfig {
  switch (type) {
    case 'grunt':
      return { hp: 40, speed: 2.2, size: 47, xp: 10, sprite: Sprites.enemy, damage: 8, detectRange: 400, deaggroRange: 600 };
    case 'archer':
      return { hp: 25, speed: 2.5, size: 34, xp: 12, sprite: Sprites.archer, damage: 6, detectRange: 500, deaggroRange: 750 };
    case 'juggernaut':
      return { hp: 120, speed: 1.2, size: 72, xp: 25, sprite: Sprites.juggernaut, damage: 16, detectRange: 350, deaggroRange: 525 };
    case 'cultist':
      return { hp: 35, speed: 2.0, size: 27, xp: 15, sprite: Sprites.cultist, damage: 5, detectRange: 450, deaggroRange: 675 };
  }
}

export class Enemy {
  x: number;
  y: number;
  readonly type: EnemyType;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  readonly baseSpeed: number;
  alive = true;
  slowTimer = 0;
  xpReward: number;
  damage: number;
  detectRange: number;
  deaggroRange: number;
  aggroed = false;
  alwaysAggro = false;
  spawnSource: string | null = null;
  urnId: number = 0;
  dropsLoot: boolean = true;
  xpMultiplier: number = 1.0;
  spawnAnimTimer: number = 0;
  rarity: MonsterRarity = 'normal';
  mods: MonsterMod[] = [];
  hastedMultiplier = 1;
  frostAuraActive = false;
  frostAuraRadius = 150;
  volatileActive = false;
  markedTimer = 0;
  nameplate: Container | null = null;

  sprite: Sprite;
  private hitFlashTimer = 0;
  private attackCooldown = 0;
  private fireTimer = 0;
  private blinkCooldown = 0;
  private wobblePhase: number;
  private animState: 'idle' | 'run' | 'walk' | 'attack' | 'death' = 'idle';
  private attackAnimPlayed = false;
  private direction: Direction = 'south';
  private prevDirection: Direction = 'south';
  private currentJuggernautAnim: JuggernautAnimName | null = null;

  projectiles: Projectile[] = [];

  constructor(x: number, y: number, type: EnemyType) {
    const cfg = getConfig(type);
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = cfg.size;
    this.height = cfg.size;
    this.health = cfg.hp;
    this.maxHealth = cfg.hp;
    this.baseSpeed = cfg.speed;
    this.speed = cfg.speed * (0.85 + Math.random() * 0.3);
    this.xpReward = cfg.xp;
    this.damage = cfg.damage;
    this.detectRange = cfg.detectRange;
    this.deaggroRange = cfg.deaggroRange;
    this.wobblePhase = Math.random() * Math.PI * 2;

    if (type === 'cultist') this.sprite = createCultistSprite();
    else if (type === 'archer') this.sprite = createArcherSprite();
    else if (type === 'grunt') this.sprite = createGruntSprite();
    else if (type === 'juggernaut') this.sprite = createJuggernautSprite();
    else this.sprite = new Sprite(cfg.sprite);
    this.sprite.anchor.set(0.5);
    this.sprite.tint = 0xffffff;
    this.updateSprite();
  }

  update(playerX: number, playerY: number, walls: Rect[], dt: number, enemies: Enemy[]) {
    if (!this.alive) return;

    if (this.spawnAnimTimer > 0) {
      this.spawnAnimTimer -= dt;
      const t = 1 - this.spawnAnimTimer / 0.2;
      const scale = Math.min(1, t * 5);
      this.sprite.scale.set(scale);
      if (this.spawnAnimTimer <= 0) {
        this.sprite.scale.set(1);
      }
      return;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.alwaysAggro) {
      this.aggroed = true;
    } else {
      if (!this.aggroed && dist < this.detectRange) this.aggroed = true;
      if (this.aggroed && dist > this.deaggroRange) this.aggroed = false;
      if (!this.aggroed) return;
    }

    const slowScale = this.slowTimer > 0 ? 0.5 : 1;
    if (slowScale < 1) this.speed *= slowScale;

    switch (this.type) {
      case 'grunt':
        this.updateGrunt(dx, dy, dist, dt);
        break;
      case 'archer':
        this.updateArcher(dx, dy, dist, dt, playerX, playerY);
        break;
      case 'juggernaut':
        this.updateJuggernaut(dx, dy, dist, dt);
        break;
      case 'cultist':
        this.updateCultist(dx, dy, dist, dt, playerX, playerY);
        break;
    }

    // Enemy repulsion
    this.applyRepulsion(enemies, dt);

    // Wall collision
    const bounds = this.getBounds();
    const resolved = resolveCollision(bounds, walls);
    this.x = resolved.x + this.width / 2;
    this.y = resolved.y + this.height / 2;

    // Facing
    const faceAngle = Math.atan2(playerY - this.y, playerX - this.x);
    if (this.type === 'cultist' || this.type === 'archer' || this.type === 'grunt') {
      this.sprite.scale.x = Math.abs(faceAngle) > Math.PI / 2 ? -1 : 1;
    } else if (this.type === 'juggernaut') {
      this.direction = angleToDirection(faceAngle);
    } else {
      this.sprite.rotation = faceAngle;
    }

    // Animation state
    const isMoving = dx !== 0 || dy !== 0;
    if (this.type === 'cultist') {
      if (!this.alive) {
        this.animState = 'death';
      } else if (this.animState !== 'attack') {
        const newState: 'idle' | 'run' = isMoving ? 'run' : 'idle';
        if (newState !== this.animState) {
          this.animState = newState;
          playCultistAnimation(this.sprite as AnimatedSprite, this.animState);
        }
      }
    } else if (this.type === 'archer') {
      if (!this.alive) {
        this.animState = 'death';
      } else if (this.animState !== 'attack') {
        const newState: 'idle' | 'run' = isMoving ? 'run' : 'idle';
        if (newState !== this.animState) {
          this.animState = newState;
          playArcherAnimation(this.sprite as AnimatedSprite, this.animState);
        }
      }
    } else if (this.type === 'grunt') {
      if (!this.alive) {
        this.animState = 'death';
      } else if (this.animState !== 'attack') {
        if (this.attackAnimPlayed) {
          this.attackAnimPlayed = false;
          this.animState = 'attack';
          playGruntAnimation(this.sprite as AnimatedSprite, 'attack', false);
          (this.sprite as AnimatedSprite).onComplete = () => {
            this.animState = 'idle';
            playGruntAnimation(this.sprite as AnimatedSprite, 'idle');
          };
        } else {
          const newState: 'idle' | 'run' = isMoving ? 'run' : 'idle';
          if (newState !== this.animState) {
            this.animState = newState;
            playGruntAnimation(this.sprite as AnimatedSprite, this.animState);
          }
        }
      }
    } else if (this.type === 'juggernaut') {
      if (!this.alive) {
        if (this.currentJuggernautAnim !== 'death') {
          this.currentJuggernautAnim = 'death';
          this.animState = 'death';
          playJuggernautAnimation(this.sprite as AnimatedSprite, 'death', this.direction, false);
        }
      } else if (this.animState !== 'attack') {
        if (this.attackAnimPlayed) {
          this.attackAnimPlayed = false;
          this.animState = 'attack';
          this.currentJuggernautAnim = 'attack';
          playJuggernautAnimation(this.sprite as AnimatedSprite, 'attack', this.direction, false);
          (this.sprite as AnimatedSprite).onComplete = () => {
            this.animState = 'idle';
            this.currentJuggernautAnim = 'idle';
            playJuggernautAnimation(this.sprite as AnimatedSprite, 'idle', this.direction);
          };
        } else {
          const newState: 'idle' | 'walk' = isMoving ? 'walk' : 'idle';
          const dirChanged = this.direction !== this.prevDirection;
          if (newState !== this.animState || dirChanged) {
            this.animState = newState;
            this.currentJuggernautAnim = newState;
            this.prevDirection = this.direction;
            playJuggernautAnimation(this.sprite as AnimatedSprite, newState, this.direction);
          }
        }
      }
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.sprite.tint = this.hitFlashTimer > 0 ? 0xff6666 : 0xffffff;
    }

    if (slowScale < 1) this.speed /= slowScale;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.blinkCooldown > 0) this.blinkCooldown -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.markedTimer > 0) this.markedTimer -= dt;

    this.updateSprite();
  }

  private updateGrunt(dx: number, dy: number, dist: number, dt: number) {
    if (dist > 0) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    }
  }

  private updateArcher(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const desiredDist = 250;

    if (dist < 150) {
      // Too close - flee
      const moveX = -(dx / dist) * this.speed * dt;
      const moveY = -(dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    } else if (dist > desiredDist + 100) {
      // Too far - approach
      const moveX = (dx / dist) * this.speed * dt * 0.7;
      const moveY = (dy / dist) * this.speed * dt * 0.7;
      this.applyMovement(moveX, moveY, dt);
    } else {
      // Good range - strafe
      const perpX = -(dy / dist) * this.speed * 0.5 * dt;
      const perpY = (dx / dist) * this.speed * 0.5 * dt;
      this.applyMovement(perpX, perpY, dt);
    }

    // Fire arrow
    if (dist < 500 && this.fireTimer <= 0) {
      this.fireTimer = 60;
      const angle = Math.atan2(py - this.y, px - this.x);
      const p = new Projectile(this.x, this.y, angle, 4, this.damage, false, true, 0xcc3333);
      p.lifetime = 90;
      this.projectiles.push(p);
      // Attack animation
      this.animState = 'attack';
      playArcherAnimation(this.sprite as AnimatedSprite, 'attack', false);
      (this.sprite as AnimatedSprite).onComplete = () => {
        this.animState = 'idle';
        playArcherAnimation(this.sprite as AnimatedSprite, 'idle');
      };
    }
  }

  private updateJuggernaut(dx: number, dy: number, dist: number, dt: number) {
    if (dist > 0) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    }
  }

  private updateCultist(dx: number, dy: number, dist: number, dt: number, px: number, py: number) {
    const desiredDist = 250;

    if (dist < 120 && this.blinkCooldown <= 0) {
      // Teleport away
      const angle = Math.atan2(py - this.y, px - this.x);
      this.x -= Math.cos(angle) * 200;
      this.y -= Math.sin(angle) * 200;
      this.blinkCooldown = 180;
      // Clamp to room
      this.x = Math.max(50, Math.min(1550, this.x));
      this.y = Math.max(50, Math.min(846, this.y));
    } else if (dist < 150) {
      const moveX = -(dx / dist) * this.speed * dt;
      const moveY = -(dy / dist) * this.speed * dt;
      this.applyMovement(moveX, moveY, dt);
    } else if (dist > desiredDist + 100) {
      const moveX = (dx / dist) * this.speed * dt * 0.6;
      const moveY = (dy / dist) * this.speed * dt * 0.6;
      this.applyMovement(moveX, moveY, dt);
    } else {
      const perpX = -(dy / dist) * this.speed * 0.4 * dt;
      const perpY = (dx / dist) * this.speed * 0.4 * dt;
      this.applyMovement(perpX, perpY, dt);
    }

    // Fire slow orb
    if (dist < 500 && this.fireTimer <= 0) {
      this.fireTimer = 80;
      const angle = Math.atan2(py - this.y, px - this.x);
      const p = new Projectile(this.x, this.y, angle, 3.5, this.damage, false, true, 0x9933cc, 120);
      p.lifetime = 100;
      this.projectiles.push(p);
      this.animState = 'attack';
      playCultistAnimation(this.sprite as AnimatedSprite, 'attack', false);
      (this.sprite as AnimatedSprite).onComplete = () => {
        if (this.animState === 'attack') {
          this.animState = 'idle';
        }
      };
    }
  }

  private applyMovement(moveX: number, moveY: number, dt: number) {
    // Wobble: sinusoidal offset perpendicular to movement
    this.wobblePhase += 0.05 * dt;
    const wobbleAmp = 0.3;
    if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      const nx = moveX / len;
      const ny = moveY / len;
      const wobble = Math.sin(this.wobblePhase) * wobbleAmp;
      this.x += moveX + (-ny * wobble);
      this.y += moveY + (nx * wobble);
    } else {
      this.x += moveX;
      this.y += moveY;
    }
  }

  private applyRepulsion(enemies: Enemy[], dt: number) {
    for (const other of enemies) {
      if (other === this || !other.alive) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (this.width + other.width) / 2 + 5;
      if (dist < minDist && dist > 0) {
        const force = (minDist - dist) / minDist * 1.5;
        this.x += (dx / dist) * force * dt;
        this.y += (dy / dist) * force * dt;
      }
    }
  }

  canDamagePlayer(): boolean {
    return this.type !== 'archer' && this.type !== 'cultist' && this.attackCooldown <= 0;
  }

  onDamagePlayer() {
    this.attackCooldown = 30;
    if (this.type === 'grunt' || this.type === 'juggernaut') this.attackAnimPlayed = true;
  }

  cullThreshold = 0;

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;

    if (this.markedTimer > 0) {
      amount = Math.round(amount * 1.3);
    }

    if (this.cullThreshold > 0 && this.health > 0 && this.health <= this.cullThreshold) {
      this.health = 0;
      this.alive = false;
      this.sprite.visible = false;
      Logger.log('entity', `${this.type} culled`);
      return true;
    }

    this.health -= amount;
    this.hitFlashTimer = 10;
    Logger.log('combat', `[${this.type}] took ${amount} dmg (hp: ${Math.max(0, this.health)}/${this.maxHealth})`);
    if (this.health <= 0) {
      this.alive = false;
      if (this.type === 'cultist') {
        playCultistAnimation(this.sprite as AnimatedSprite, 'death', false);
      } else if (this.type === 'grunt') {
        playGruntAnimation(this.sprite as AnimatedSprite, 'death', false);
      } else if (this.type === 'juggernaut') {
        playJuggernautAnimation(this.sprite as AnimatedSprite, 'death', this.direction, false);
      } else {
        this.sprite.visible = false;
      }
      Logger.log('entity', `${this.type} killed`);
      return true;
    }
    return false;
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  private getDisplayName(): string {
    const names: Record<string, string> = {
      grunt: 'Grunt', archer: 'Archer', juggernaut: 'Juggernaut', cultist: 'Cultist',
    };
    return names[this.type] || this.type;
  }

  applyRarity(rarity: MonsterRarity, mods: MonsterMod[]) {
    this.rarity = rarity;
    this.mods = mods;
    for (const mod of mods) {
      mod.apply(this);
    }
    if (rarity !== 'normal') {
      const scaleBonus = rarity === 'magic' ? 1.1 : 1.2;
      this.sprite.scale.set(
        (this.sprite.scale.x > 0 ? 1 : -1) * Math.abs(this.sprite.scale.x) * scaleBonus
      );
    }
    this.createNameplate(rarity, mods);
  }

  private createNameplate(rarity: MonsterRarity, mods: MonsterMod[]) {
    this.nameplate = new Container();

    const barW = Math.max(32, this.width);
    const barH = 4;

    // HP bar background
    const hpBg = new Graphics();
    hpBg.beginFill(0x222222, 0.8);
    hpBg.drawRoundedRect(-barW / 2, 0, barW, barH, 1);
    hpBg.endFill();
    this.nameplate.addChild(hpBg);

    // HP bar fill — stored as a named child for per-frame updates
    const hpFill = new Graphics();
    hpFill.name = 'hpFill';
    this.nameplate.addChild(hpFill);

    // Name
    const nameText = new Text(this.getDisplayName(), new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 10, fontWeight: 'bold',
      fill: '#e8dcc8',
      stroke: '#000000', strokeThickness: 2,
    }));
    nameText.anchor.set(0.5, 0);
    nameText.y = barH + 1;
    this.nameplate.addChild(nameText);

    // Mod text — single line, colored by rarity (blue=magic, yellow=rare)
    if (mods.length > 0) {
      const modText = new Text(mods.map(m => m.name).join(' | '), new TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 9,
        fill: RARITY_COLORS[rarity],
        stroke: '#000000', strokeThickness: 2,
      }));
      modText.anchor.set(0.5, 0);
      modText.y = nameText.y + 12;
      this.nameplate.addChild(modText);
    }
  }

  private updateSprite() {
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    if (this.nameplate) {
      this.nameplate.x = this.x;
      this.nameplate.y = this.y - this.height / 2 - 40;

      // Update HP bar fill
      const hpFill = this.nameplate.getChildByName('hpFill') as Graphics;
      if (hpFill) {
        const pct = this.health / this.maxHealth;
        const barW = Math.max(32, this.width);
        const color = pct > 0.6 ? 0x44cc44 : pct > 0.3 ? 0xcccc44 : 0xcc4444;
        hpFill.clear();
        hpFill.beginFill(color);
        hpFill.drawRoundedRect(-barW / 2, 0, barW * pct, 4, 1);
        hpFill.endFill();
      }
    }
  }

  destroy() {
    this.sprite.destroy();
    if (this.nameplate) { this.nameplate.destroy({ children: true }); }
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
  }
}
