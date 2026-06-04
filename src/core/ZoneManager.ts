import { ROOM_WIDTH, ROOM_HEIGHT } from '../world/Room';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Logger } from './Logger';
import { ZoneConfig, ZONE_REGISTRY, RoomTemplate } from './ZoneConfig';
import { cloneTemplate } from '../world/RoomTemplates';
import * as Templates from '../world/RoomTemplates';

export interface ZoneState {
  zoneId: string;
  roomIndex: number;
  config: ZoneConfig;
  currentTemplate: RoomTemplate;
}

export class ZoneManager {
  state: ZoneState | null = null;
  private endlessWave = 0;
  private endlessRoomCount = 0;

  get zoneId(): string { return this.state?.zoneId ?? 'hub'; }
  get roomIndex(): number { return this.state?.roomIndex ?? 0; }
  get config(): ZoneConfig | null { return this.state?.config ?? null; }
  get template(): RoomTemplate | null { return this.state?.currentTemplate ?? null; }

  static getZone(id: string): ZoneConfig | undefined {
    return ZONE_REGISTRY[id];
  }

  private pickTemplate(zone: ZoneConfig, roomIndex: number): RoomTemplate {
    const pool = zone.templates.length > 0 ? zone.templates : [Templates.TEMPLATE_OPEN];
    const idx = roomIndex % pool.length;
    return cloneTemplate(pool[idx]);
  }

  private countEnemies(zone: ZoneConfig, roomIndex: number): number {
    const cfg = zone.enemyCount;
    if (typeof cfg === 'number') return cfg;
    return cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
  }

  spawnEnemies(zone: ZoneConfig, template: RoomTemplate, roomIndex: number): Enemy[] {
    const enemies: Enemy[] = [];
    const count = this.countEnemies(zone, roomIndex);

    for (let i = 0; i < count; i++) {
      const pool = zone.enemyPool;
      if (pool.length === 0) break;

      let type: EnemyType;
      if (zone.isEndless === 'wave') {
        if (this.endlessWave < 5) type = 'grunt';
        else if (this.endlessWave < 10) type = Math.random() < 0.7 ? 'grunt' : 'archer';
        else if (this.endlessWave < 15) {
          const r = Math.random();
          type = r < 0.5 ? 'grunt' : r < 0.8 ? 'archer' : 'juggernaut';
        } else {
          type = pool[Math.floor(Math.random() * pool.length)];
        }
      } else if (zone.isEndless === 'procgen') {
        const depth = this.endlessRoomCount;
        if (depth > 20) {
          const r = Math.random();
          type = r < 0.3 ? 'archer' : r < 0.6 ? 'juggernaut' : 'cultist';
        } else if (depth > 10) {
          const r = Math.random();
          type = r < 0.2 ? 'grunt' : r < 0.5 ? 'archer' : r < 0.75 ? 'juggernaut' : 'cultist';
        } else {
          const r = Math.random();
          type = r < 0.5 ? 'grunt' : r < 0.85 ? 'archer' : 'juggernaut';
        }
      } else {
        type = pool[Math.floor(Math.random() * pool.length)];
      }

      const sp = template.spawnZones;
      const sz = sp.length > 0 ? sp[Math.floor(Math.random() * sp.length)] : { x: 64, y: 64, width: ROOM_WIDTH - 128, height: ROOM_HEIGHT - 128 };
      let x = sz.x + 32 + Math.random() * (sz.width - 64);
      let y = sz.y + 32 + Math.random() * (sz.height - 64);
      x = Math.max(64, Math.min(ROOM_WIDTH - 64, x));
      y = Math.max(64, Math.min(ROOM_HEIGHT - 64, y));

      const hpMult = this.getHpMult(zone);
      const dmgMult = this.getDmgMult(zone);
      const xpMult = this.getXpMult(zone);

      const e = new Enemy(x, y, type);
      e.maxHealth = Math.round(e.maxHealth * hpMult);
      e.health = e.maxHealth;
      e.damage = Math.round(e.damage * dmgMult);
      e.xpReward = Math.round(e.xpReward * xpMult);
      enemies.push(e);
    }

    return enemies;
  }

  transitionTo(zoneId: string): ZoneState {
    const config = ZONE_REGISTRY[zoneId];
    if (!config) {
      Logger.log('system', `Unknown zone: ${zoneId}, defaulting to hub`);
      return this.transitionTo('hub');
    }

    const roomIndex = 0;
    const template = this.pickTemplate(config, roomIndex);

    if (config.isEndless === 'wave') {
      this.endlessWave = 0;
    }
    if (config.isEndless === 'procgen') {
      this.endlessRoomCount = 0;
    }

    this.state = { zoneId, roomIndex, config, currentTemplate: template };
    Logger.log('system', `Transitioned to zone: ${config.name}, room ${roomIndex + 1}/${config.roomCount}`);
    return this.state;
  }

  nextRoom(): ZoneState | null {
    if (!this.state) return null;
    const { config } = this.state;
    const nextIdx = this.state.roomIndex + 1;

    if (config.isEndless === 'procgen') {
      this.endlessRoomCount++;
      const template = this.pickTemplate(config, 0);
      this.state = { ...this.state, roomIndex: nextIdx, currentTemplate: template };
      return this.state;
    }

    if (nextIdx >= config.roomCount) {
      if (config.nextZone) return this.transitionTo(config.nextZone);
      return null;
    }

    const template = this.pickTemplate(config, nextIdx);
    this.state = { ...this.state, roomIndex: nextIdx, currentTemplate: template };
    return this.state;
  }

  nextWave(): number {
    this.endlessWave++;
    if (!this.state) return 0;
    const template = this.pickTemplate(this.state.config, 0);
    this.state = { ...this.state, currentTemplate: template };
    return this.endlessWave;
  }

  getHpMult(zone: ZoneConfig): number {
    if (zone.isEndless === 'procgen') return zone.enemyHpMult * (1 + this.endlessRoomCount * 0.1);
    if (zone.isEndless === 'wave') return zone.enemyHpMult * (1 + this.endlessWave * 0.08);
    return zone.enemyHpMult;
  }

  getDmgMult(zone: ZoneConfig): number {
    if (zone.isEndless === 'procgen') return zone.enemyDmgMult * (1 + this.endlessRoomCount * 0.08);
    if (zone.isEndless === 'wave') return zone.enemyDmgMult * (1 + this.endlessWave * 0.06);
    return zone.enemyDmgMult;
  }

  getXpMult(zone: ZoneConfig): number {
    if (zone.isEndless === 'procgen') return zone.enemyXpMult * (1 + this.endlessRoomCount * 0.15);
    if (zone.isEndless === 'wave') return zone.enemyXpMult;
    return zone.enemyXpMult;
  }
}
