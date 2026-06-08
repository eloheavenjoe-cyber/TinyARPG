import { Application, Container, Point, Graphics, Text, TextStyle, AnimatedSprite, Sprite } from 'pixi.js';
import { InputManager } from './InputManager';
import { Camera } from './Camera';
import { Logger } from './Logger';
import { Sprites, loadTileSet } from '../rendering/Sprites';
import { MainMenu } from '../ui/MainMenu';
import { ClassSelect } from '../ui/ClassSelect';
import { AbilitySelect } from '../ui/AbilitySelect';
import { DeathScreen } from '../ui/DeathScreen';
import { HUD } from '../ui/HUD';
import { SkillBar } from '../ui/SkillBar';
import { Room, ROOM_WIDTH, ROOM_HEIGHT, rectsOverlap, resolveCollision } from '../world/Room';
import { Player, InventorySlot, EquipSlot } from '../entities/Player';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Minion } from '../entities/Minion';
import { Projectile } from '../entities/Projectile';
import { CombatTextManager } from '../entities/CombatText';
import { ItemDrop, createRandomLoot, isEquippableDrop, createItemDrop, createJewelDrop, isOrbDrop, createOrbDrop, isPortalScrollDrop, isJewelDrop } from '../entities/ItemDrop';
import { decorateRoom } from '../world/RoomDecorator';
import { TILE_CONFIGS } from '../core/TileConfigs';
import { BiomeId } from './ZoneConfig';
import { Chest } from '../entities/Chest';
import { Breakable } from '../entities/Breakable';
import { SecretBush } from '../entities/SecretBush';
import { CursedUrn, UrnRarity } from '../entities/CursedUrn';
import * as UrnConfig from './UrnConfig';
import { rollCurses, CurseDef } from './CurseMods';
import { ClassType } from './SkillDefs';
import { PassiveTreeScreen } from '../ui/PassiveTreeScreen';
import { SkillSubTreeScreen } from '../ui/SkillSubTreeScreen';
import { InventoryScreen } from '../ui/InventoryScreen';
import { CharacterScreen } from '../ui/CharacterScreen';
import { generateItemDrop, generateOrbDrop, generateJewel, GeneratedItem, getMaxSockets, SocketSlot } from './ItemGenerator';
import { Slot, ITEM_BASES, AFFIXES, UNIQUE_ITEMS } from './ItemDefs';
import { DeveloperConsole } from '../ui/DeveloperConsole';
import { ZoneManager } from './ZoneManager';
import { TutorialScreen, TutorialStage } from '../ui/TutorialScreen';
import { HubTip } from '../ui/HubTip';
import { loadWarriorAnimations, loadRangerAnimations, loadReaperAnimations, loadGolemAnimations, loadMonkAnimations, loadSummonerAnimations, loadCultistAnimations, loadArcherAnimations, loadGruntAnimations, loadJuggernautAnimations, loadCthulhuAnimations, loadChestAnimations, loadVendorAnimations, loadStashAnimations, createVendorSprite, createStashSprite, playMonkAnimation, playRangerRollAnimation, playAnimation } from '../rendering/SpriteAnimator';
import { loadItemIcons } from '../rendering/ItemIcons';
import { Boss, BossId } from '../entities/Boss';
import { BossHpBar } from '../ui/BossHpBar';
import { Minimap } from '../ui/Minimap';
import { SaveManager, SaveData, SerializedInventorySlot, SerializedItem } from './SaveManager';
import { EscapeMenu } from '../ui/EscapeMenu';
import { SaveSlotScreen } from '../ui/SaveSlotScreen';
import { SettingsPlaceholder } from '../ui/SettingsPlaceholder';
import { ALL_SKILLS } from './SkillDefs';
import { VendorScreen } from '../ui/VendorScreen';
import { StashScreen } from '../ui/StashScreen';
import { SoulVaultScreen } from '../ui/SoulVaultScreen';
import { generateVendorStock, VendorStockItem, calculateSellPrice } from '../core/VendorManager';
import { StashTab } from '../core/SaveManager';
import { getRandomMods } from './MonsterMods';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;

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

interface RainZone {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damageTimer: number;
  isPoison?: boolean;
}

interface ChillZone {
  x: number;
  y: number;
  life: number;
  radius: number;
}

interface CapturedSoul {
  enemyType: string;
  name: string;
  baseHp: number;
  baseDamage: number;
  baseSpeed: number;
  captureLevel: number;
}

interface UrnSpawnGroup {
  urnId: number;
  totalSpawned: number;
  totalKilled: number;
  lootDropped: boolean;
  urnX: number;
  urnY: number;
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
  private minions: Minion[] = [];
  private recentCorpses: { x: number; y: number; maxHp: number; deathFrame: number }[] = [];
  private frameCount: number = 0;
  private projectiles: Projectile[] = [];
  private waveCooldown = 0;
  private itemDrops: ItemDrop[] = [];
  private decorationSprites: Container[] = [];
  private chests: Chest[] = [];
  private breakables: Breakable[] = [];
  private urns: CursedUrn[] = [];
  private activeUrnOrb: string | null = null;
  private urnSpawnGroups: Map<number, UrnSpawnGroup> = new Map();
  private urnSpawnQueue: { enemy: Enemy; urnId: number }[] = [];
  private urnStaggerTimer: number = 0;
  private combatText: CombatTextManager = new CombatTextManager();
  private vfx: VfxEffect[] = [];
  private modGfx: Graphics[] = [];
  private dash: DashState | null = null;
  private rainZones: RainZone[] = [];
  private chillZones: ChillZone[] = [];
  private zoneManager: ZoneManager = new ZoneManager();
  private camera?: Camera;
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
  private characterScreenOpen = false;
  private characterScreen?: CharacterScreen;
  private wasCKeyDown = false;
  private wasVKeyDown = false;
  private devConsole: DeveloperConsole;
  private tutorialStage: TutorialStage | null = null;
  private tutorialKeys: Set<string> = new Set();
  private tutorialScreen?: TutorialScreen;
  private tutorialKeyWasDown: Set<string> = new Set();
  private boss: Boss | null = null;
  private bossHpBar?: BossHpBar;
  private minimap?: Minimap;
  private bossSpawned = false;
  private currentSaveSlot: number | null = null;
  private autoSaveTimer = 0;
  private escapeMenuOpen = false;
  private escapeMenu?: EscapeMenu;
  private saveSlotScreen?: SaveSlotScreen;
  private settingsPlaceholder?: SettingsPlaceholder;
  private wasEscapeKeyDown = false;
  private wasKKeyDown = false;
  private subTreeScreen?: SkillSubTreeScreen;
  private vendorOpen = false;
  private stashOpen = false;
  private vendorScreen?: VendorScreen;
  private stashScreen?: StashScreen;
  private vendorStock: VendorStockItem[] = [];
  private stashTabs: StashTab[] = this.getDefaultStashTabs();
  private interactPrompt?: Text;
  /* PERF: track last zone name to skip redundant text assignments */
  private lastZoneName = '';
  /* PERF: track last player position to skip redundant prompt position updates */
  private lastPromptPlayerX = -9999;
  private lastPromptPlayerY = -9999;
  private wasEKeyDown = false;
  private secretBush: SecretBush | null = null;
  private bushRevealed: boolean = false;
  private cryptWaveCount: number = 0;
  private cryptWaveActive: boolean = false;
  private jackpotChest: Chest | null = null;
  private cryptJackpotClaimed: boolean = false;
  private playerPullTimer: number = 0;
  private currentSaveData: SaveData | null = null;
  private hasSeenHubTip: boolean = false;
  private hubTip?: HubTip;
  private soulVault: CapturedSoul[] = [];
  private activeSpectre: CapturedSoul | null = null;
  private activeSpectreMinion: Minion | null = null;
  private soulDrops: { x: number; y: number; enemyType: string; label: string; container: Container }[] = [];
  soulVaultScreen?: SoulVaultScreen;
  soulVaultOpen: boolean = false;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager(app.view as HTMLCanvasElement);
    Sprites.generateAll();
    this.devConsole = new DeveloperConsole();
    this.setupConsoleCommands();
    Logger.log('game', 'TinyARPG initialized');
  }

  async start() {
    const loadingText = new Text('Loading...', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 28, fill: '#c8963e',
    }));
    loadingText.anchor.set(0.5);
    loadingText.x = SCREEN_WIDTH / 2;
    loadingText.y = SCREEN_HEIGHT / 2 - 40;
    this.app.stage.addChild(loadingText);

    const barBg = new Graphics();
    barBg.beginFill(0x222233, 0.8);
    barBg.drawRoundedRect(0, 0, 400, 20, 4);
    barBg.endFill();
    barBg.x = SCREEN_WIDTH / 2 - 200;
    barBg.y = SCREEN_HEIGHT / 2 + 10;
    this.app.stage.addChild(barBg);

    const barFill = new Graphics();
    barFill.x = barBg.x + 2;
    barFill.y = barBg.y + 2;
    barFill.beginFill(0xcc8844);
    barFill.drawRect(0, 0, 0, 16);
    barFill.endFill();
    this.app.stage.addChild(barFill);

    await Promise.all([
      loadWarriorAnimations(),
      loadRangerAnimations(),
      loadReaperAnimations(),
      loadGolemAnimations(),
      loadMonkAnimations(),
      loadSummonerAnimations(),
      loadCultistAnimations(),
      loadArcherAnimations(),
      loadGruntAnimations(),
      loadJuggernautAnimations(),
      loadCthulhuAnimations(),
      loadChestAnimations(),
      loadVendorAnimations(),
      loadStashAnimations(),
      loadItemIcons(),
      ...Object.keys(TILE_CONFIGS).map(biomeId => loadTileSet(biomeId)),
    ]);

    barFill.clear();
    barFill.beginFill(0xcc8844);
    barFill.drawRect(0, 0, 396, 16);
    barFill.endFill();

    this.app.stage.removeChild(loadingText);
    this.app.stage.removeChild(barBg);
    this.app.stage.removeChild(barFill);
    loadingText.destroy();
    barBg.destroy();
    barFill.destroy();

    this.app.ticker.add((dt) => this.update(dt));
    /* PERF: pause game loop when tab is hidden to save CPU/GPU */
    document.addEventListener('visibilitychange', () => {
      this.app.ticker.started = !document.hidden;
    });
    this.showMainMenu();
  }

  private showMainMenu() {
    if (this.mainMenu) {
      this.app.stage.removeChild(this.mainMenu.container);
      this.mainMenu.destroy();
      this.mainMenu = undefined;
    }
    this.state = State.Menu;
    this.mainMenu = new MainMenu(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.mainMenu.onStart(() => this.showClassSelect());
    this.mainMenu.onContinue(() => {
      const slot = SaveManager.getFirstOccupiedSlot();
      if (slot >= 0) this.loadGame(slot);
    });
    this.mainMenu.onLoadGame(() => this.showSaveSlotScreen('load'));
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
    if (this.gameContainer) {
      Logger.log('game', 'Cleaning up stale session before startGame');
      this.cleanupGameSession();
    }
    if (this.abilitySelect) {
      this.app.stage.removeChild(this.abilitySelect.container);
      this.abilitySelect.destroy();
      this.abilitySelect = undefined;
    }
    this.state = State.Playing;
    this.currentSaveSlot = SaveManager.getFirstEmptySlot();
    this.autoSaveTimer = 0;
    this.gameContainer = new Container();
    this.camera = new Camera(SCREEN_WIDTH, SCREEN_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT);
    this.gameContainer.x = 0;
    this.gameContainer.y = 0;
    this.app.stage.addChild(this.gameContainer);
    this.room = new Room();
    this.gameContainer.addChild(this.room.container);
    this.player = new Player(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, classType);
    this.player.skills.selectMainAbility(abilityId);
    this.player.onCurseExpired = (curseId: string) => {
      Logger.log('combat', `Curse expired: ${curseId}`);
      if (curseId === 'marked') {
        for (const e of this.enemies) { e.alwaysAggro = false; }
      }
    };
    this.gameContainer.addChild(this.player.sprite);
    this.gameContainer.addChild(this.combatText.container);
    this.hud = new HUD();
    this.hud.onPassiveClick = () => {
      if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen && !this.subTreeScreen) {
        this.toggleTree();
      }
    };
    this.hud.onSubTreeClick = () => {
      if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen && !this.subTreeScreen) {
        this.toggleSubTree();
      }
    };
    this.app.stage.addChild(this.hud.container);
    this.skillBar = new SkillBar();
    this.skillBar.container.x = 960;
    this.skillBar.container.y = 1002;
    this.app.stage.addChild(this.skillBar.container);
    this.minimap = new Minimap();
    this.app.stage.addChild(this.minimap.container);
    this.zoneManager.transitionTo('tutorial');
    this.buildCurrentZoneRoom();
    this.tutorialStage = 'move';
    this.tutorialKeys = new Set();
    this.tutorialKeyWasDown = new Set();
    this.tutorialScreen = new TutorialScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.app.stage.addChild(this.tutorialScreen.container);

    if (classType === 'summoner') {
      this.soulVaultScreen = new SoulVaultScreen(
        1920, 1080,
        (soul) => this.summonSpectre(soul),
        () => this.despawnSpectre(),
        () => { this.soulVaultScreen?.toggle(); this.soulVaultOpen = false; },
      );
      this.app.stage.addChild(this.soulVaultScreen.container);
    }
  }

  private loadGame(slotIndex: number) {
    const data = SaveManager.loadFromSlot(slotIndex);
    if (!data) return;

    if (this.gameContainer) {
      Logger.log('game', 'Cleaning up stale session before loadGame');
      this.cleanupGameSession();
    }

    this.state = State.Playing;
    this.currentSaveSlot = slotIndex;
    this.autoSaveTimer = 0;

    this.gameContainer = new Container();
    this.camera = new Camera(SCREEN_WIDTH, SCREEN_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT);
    this.gameContainer.x = 0;
    this.gameContainer.y = 0;
    this.app.stage.addChild(this.gameContainer);

    this.room = new Room();
    this.gameContainer.addChild(this.room.container);

    // Create player with saved state
    this.player = new Player(data.player.x, data.player.y, data.classType);
    this.player.level = data.player.level;
    this.player.xp = data.player.xp;
    this.player.gold = data.player.gold;
    this.player.health = data.player.health;
    this.player.mana = data.player.mana;
    this.player.attrs = { ...data.player.attrs };
    this.player.unspentAttrPoints = data.player.unspentAttrPoints;
    this.player.passivePoints = data.player.passivePoints;

    // Restore passive tree allocations
    for (const nodeId of data.player.passiveTree.allocatedNodeIds) {
      this.player.passiveTree.allocate(nodeId);
    }

    // Restore sub skill tree allocations
    if (data.player.skillSubTrees) {
      this.player.skillSubPoints = data.player.skillSubPoints || 0;
      for (const [abilityId, nodeIds] of Object.entries(data.player.skillSubTrees)) {
        const tree = this.player.skillSubTrees.get(abilityId);
        if (tree) {
          for (const nid of nodeIds) {
            if (tree.canAllocate(nid)) tree.allocate(nid);
          }
        }
      }
    }

    // Restore inventory
    try {
      this.player.inventory = this.deserializeInventory(data.player.inventory);
    } catch (e) {
      Logger.log('game', `Failed to deserialize inventory: ${e}`);
      this.player.inventory = new Array(30).fill(null);
    }

    // Restore equipment
    try {
      this.player.equipment = this.deserializeEquipment(data.player.equipment);
    } catch (e) {
      Logger.log('game', `Failed to deserialize equipment: ${e}`);
      this.player.equipment = { weapon: null, body: null, helmet: null, boots: null, ring: null, ring2: null, amulet: null };
    }

    // Restore skill slots
    for (let i = 0; i < data.player.skills.slotIds.length && i < 6; i++) {
      const skillId = data.player.skills.slotIds[i];
      if (skillId) {
        const skill = ALL_SKILLS.find(s => s.id === skillId);
        if (skill) this.player.skills.slots[i] = skill;
      }
    }
    if (data.classType === 'monk' && data.player.skills.currentStance) {
      this.player.skills.currentStance = data.player.skills.currentStance;
    }
    this.player.skills.mainAbility = this.player.skills.slots[0];

    // Restore soul vault and spectre
    if (data.player.soulVault) {
      this.soulVault = data.player.soulVault;
    }
    if (data.player.activeSpectre) {
      this.activeSpectre = data.player.activeSpectre;
      this.summonSpectre(data.player.activeSpectre);
    }

    this.player.recalcStats();

    this.gameContainer.addChild(this.player.sprite);
    this.gameContainer.addChild(this.combatText.container);

    this.hud = new HUD();
    this.hud.onPassiveClick = () => {
      if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen && !this.subTreeScreen) {
        this.toggleTree();
      }
    };
    this.hud.onSubTreeClick = () => {
      if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen && !this.subTreeScreen) {
        this.toggleSubTree();
      }
    };
    this.app.stage.addChild(this.hud.container);
    this.skillBar = new SkillBar();
    this.skillBar.container.x = 960;
    this.skillBar.container.y = 1002;
    this.app.stage.addChild(this.skillBar.container);
    this.minimap = new Minimap();
    this.app.stage.addChild(this.minimap.container);

    // Restore zone state
    this.zoneManager = new ZoneManager();
    for (const zoneId of data.zone.completedZoneIds) {
      this.zoneManager.completedZoneIds.add(zoneId);
    }
    this.cryptJackpotClaimed = data.zone.cryptJackpotClaimed ?? false;
    this.zoneManager.transitionTo(data.zone.currentZoneId, data.zone.currentRoomIndex);
    this.buildCurrentZoneRoom();

    // Restore opened urns
    if (data.zone.urns) {
      for (const uData of data.zone.urns) {
        if (uData.opened) {
          const type = UrnConfig.URN_TYPES.find(t => t.id === uData.id) || UrnConfig.rollUrnType();
          const preOpened = { type, rarity: uData.rarity as UrnRarity, preOpened: true, rareName: uData.rareName };
          const urn = new CursedUrn(uData.x, uData.y, preOpened);
          this.urns.push(urn);
          this.gameContainer!.addChild(urn.container);
        }
      }
    }

    Logger.log('game', `Loaded save slot ${slotIndex}: ${data.playerName} level ${data.level}`);
    this.currentSaveData = data;
    // Deserialize stash slots from serialized format to live InventorySlot
    try {
      if (data.stashData) {
        this.stashTabs = data.stashData.tabs.map(t => ({
          name: t.name,
          slots: t.slots.map(s => s ? this.deserializeInventory([s])[0] : null),
        }));
      } else {
        this.stashTabs = this.getDefaultStashTabs();
      }
    } catch (e) {
      Logger.log('game', `Failed to deserialize stash: ${e}`);
      this.stashTabs = this.getDefaultStashTabs();
    }
  }

  private saveGame() {
    if (!this.player || this.currentSaveSlot === null || this.currentSaveSlot < 0) return;
    const p = this.player;

    const data: SaveData = {
      version: 1,
      timestamp: Date.now(),
      playerName: p.classType.charAt(0).toUpperCase() + p.classType.slice(1),
      level: p.level,
      classType: p.classType,
      zone: {
        currentZoneId: this.zoneManager.zoneId,
        currentRoomIndex: this.zoneManager.roomIndex,
        completedZoneIds: [...this.zoneManager.completedZoneIds],
        cryptJackpotClaimed: this.cryptJackpotClaimed || undefined,
        urns: this.urns.filter(u => u.isOpen).map(u => u.serialize()),
      },
      player: {
        x: p.x, y: p.y,
        health: p.health, mana: p.mana,
        gold: p.gold,
        level: p.level, xp: p.xp,
        attrs: { ...p.attrs },
        unspentAttrPoints: p.unspentAttrPoints,
        passivePoints: p.passivePoints,
        inventory: this.serializeInventory(p.inventory),
        equipment: this.serializeEquipment(p.equipment),
        skills: {
          slotIds: p.skills.slots.map(s => s?.id ?? null),
          currentStance: p.classType === 'monk' ? p.skills.currentStance : undefined,
        },
        passiveTree: {
          allocatedNodeIds: [...p.passiveTree.allocated],
        },
        skillSubPoints: p.skillSubPoints,
        soulVault: this.soulVault,
        activeSpectre: this.activeSpectre,
        skillSubTrees: (() => {
          const result: Record<string, string[]> = {};
          for (const [id, tree] of p.skillSubTrees) {
            result[id] = [...tree.allocated];
          }
          return result;
        })(),
      },
      stashData: {
        tabs: this.stashTabs.map(t => ({
          name: t.name,
          slots: t.slots.map(s => s ? this.serializeInventory([s])[0] : null),
        })),
      },
    };

    SaveManager.saveToSlot(this.currentSaveSlot, data);
    Logger.log('game', `Saved to slot ${this.currentSaveSlot}`);
  }

  private serializeSlots(socketSlots: SocketSlot[]): { jewel: SerializedItem | null }[] {
    return socketSlots.map(s => ({
      jewel: s.jewel ? {
        baseId: s.jewel.base.id,
        rarity: s.jewel.rarity,
        affixes: s.jewel.affixes.map(a => ({ affixId: a.affix.id, roll: a.roll })),
        damageRoll: s.jewel.damageRoll,
        customDisplayName: s.jewel.customDisplayName,
        ilvl: s.jewel.ilvl,
        levelReq: s.jewel.levelReq,
      } : null,
    }));
  }

  private serializeInventory(inv: InventorySlot[]): SerializedInventorySlot[] {
    return inv.map(slot => {
      if (!slot) return null;
      if (slot.kind === 'orb') return { kind: 'orb', orbId: slot.orbId, count: slot.count };
      const item = (slot as EquipSlot).item;
      return {
        kind: 'equip',
        item: {
          baseId: item.base.id,
          rarity: item.rarity,
          affixes: item.affixes.map((a: any) => ({ affixId: a.affix.id, roll: a.roll })),
          uniqueId: item.uniqueId,
          damageRoll: item.damageRoll,
          customDisplayName: item.customDisplayName,
          ilvl: item.ilvl,
          levelReq: item.levelReq,
          socketSlots: item.socketSlots.length > 0 ? this.serializeSlots(item.socketSlots) : undefined,
          warped: item.warped || false,
          warpOutcome: item.warpOutcome || null,
          warpImplicit: item.warpImplicit || null,
        },
      };
    });
  }

  private deserializeInventory(data: SerializedInventorySlot[]): InventorySlot[] {
    return data.map(slot => {
      if (!slot) return null;
      if (slot.kind === 'orb') return { kind: 'orb', orbId: slot.orbId, count: slot.count };
      return {
        kind: 'equip',
        item: this.deserializeItem(slot.item),
      };
    });
  }

  private serializeEquipment(equip: Record<Slot, GeneratedItem | null>): Record<string, SerializedItem | null> {
    const result: Record<string, SerializedItem | null> = {};
    for (const [key, item] of Object.entries(equip)) {
      if (!item) { result[key] = null; continue; }
      result[key] = {
        baseId: item.base.id,
        rarity: item.rarity,
        affixes: item.affixes.map(a => ({ affixId: a.affix.id, roll: a.roll })),
        uniqueId: item.uniqueId,
        damageRoll: item.damageRoll,
        customDisplayName: item.customDisplayName,
        ilvl: item.ilvl,
        levelReq: item.levelReq,
        socketSlots: item.socketSlots.length > 0 ? this.serializeSlots(item.socketSlots) : undefined,
        warped: item.warped || false,
        warpOutcome: item.warpOutcome || null,
        warpImplicit: item.warpImplicit || null,
      };
    }
    return result;
  }

  private deserializeEquipment(data: Record<string, SerializedItem | null>): Record<Slot, GeneratedItem | null> {
    const result: Record<Slot, GeneratedItem | null> = {
      weapon: null, body: null, helmet: null, boots: null,
      ring: null, ring2: null, amulet: null,
    };
    for (const [key, item] of Object.entries(data)) {
      if (!item) continue;
      if (key in result) {
        (result as any)[key] = this.deserializeItem(item);
      }
    }
    return result;
  }

  private deserializeItem(data: SerializedItem): GeneratedItem {
    const base = ITEM_BASES.find(b => b.id === data.baseId);
    if (!base) throw new Error(`Unknown base: ${data.baseId}`);
    const affixes = data.affixes.map(a => {
      const affix = AFFIXES.find(af => af.id === a.affixId);
      if (affix) return { affix, roll: a.roll };
      const uniqueItem = UNIQUE_ITEMS.find(u => Object.keys(u.fixedAffixes).includes(a.affixId));
      const val = uniqueItem?.fixedAffixes[a.affixId] ?? a.roll;
      return { affix: { id: a.affixId, name: '', type: 'prefix' as const, stat: a.affixId, min: val, max: val, tier: 1 }, roll: val };
    });
    const stats: Record<string, number> = { ...base.innateStats };
    if (data.damageRoll > 0) stats.damage = data.damageRoll;
    for (const a of affixes) {
      stats[a.affix.stat] = (stats[a.affix.stat] || 0) + a.roll;
    }
    const maxSockets = getMaxSockets(base);
    return {
      base,
      rarity: data.rarity,
      affixes,
      uniqueId: data.uniqueId,
      damageRoll: data.damageRoll,
      customDisplayName: data.customDisplayName,
      computedStats: stats,
      ilvl: data.ilvl,
      levelReq: data.levelReq,
      socketSlots: data.socketSlots
        ? data.socketSlots.map(s => ({
            jewel: s.jewel ? this.deserializeItem(s.jewel) : null,
          }))
        : base.id === 'jewel' ? [] : Array.from({ length: maxSockets }, () => ({ jewel: null })),
      maxSockets,
      id: `restored_${data.baseId}_${Date.now()}`,
      warped: data.warped || false,
      warpOutcome: data.warpOutcome || null,
      warpImplicit: data.warpImplicit || null,
    };
  }

  private exitToMenu() {
    this.state = State.Menu;
    try {
      this.saveGame();
    } catch (e) {
      Logger.log('game', `Save error during exit: ${e}`);
    }
    try {
      this.cleanupGameSession();
    } catch (e) {
      Logger.log('game', `Cleanup error during exit: ${e}`);
    }
    this.currentSaveSlot = null;
    this.autoSaveTimer = 0;
    this.showMainMenu();
  }

  private openVendor() {
    if (this.vendorOpen || !this.player) return;
    this.vendorOpen = true;
    const stock = this.vendorStock.length > 0 ? this.vendorStock : generateVendorStock(this.player.level);
    this.vendorScreen = new VendorScreen(SCREEN_WIDTH, SCREEN_HEIGHT, stock, this.player.inventory, this.player.gold);
    this.vendorScreen.onBuyCallback((stockItem: VendorStockItem) => {
      if (!this.player) return;
      if (this.player.gold < stockItem.buyPrice) {
        this.vendorScreen?.showMessage('Not enough gold!');
        return;
      }
      const freeSlot = this.player.inventory.findIndex(s => s === null);
      if (freeSlot === -1) {
        this.vendorScreen?.showMessage('Inventory full!');
        return;
      }
      this.player.gold -= stockItem.buyPrice;
      this.player.inventory[freeSlot] = { kind: 'equip', item: { ...stockItem.item, id: `owned_${crypto.randomUUID()}` } };
      this.vendorStock = this.vendorStock.filter(s => s.id !== stockItem.id);
      this.closeVendor();
      this.openVendor();
    });
    this.vendorScreen.onSellCallback((gridIndex: number) => {
      if (!this.player) return;
      const slot = this.player.inventory[gridIndex];
      if (!slot || slot.kind !== 'equip') return;
      const gold = calculateSellPrice(slot.item);
      this.player.gold += gold;
      this.player.inventory[gridIndex] = null;
      this.closeVendor();
      this.openVendor();
    });
    this.vendorScreen.onCloseCallback(() => this.closeVendor());
    this.app.stage.addChild(this.vendorScreen.container);
  }

  private closeVendor() {
    this.vendorOpen = false;
    if (this.vendorScreen) {
      this.app.stage.removeChild(this.vendorScreen.container);
      this.vendorScreen.destroy();
      this.vendorScreen = undefined;
    }
    if (this.interactPrompt) {
      this.gameContainer?.removeChild(this.interactPrompt);
      this.interactPrompt.destroy();
      this.interactPrompt = undefined;
    }
  }

  private openStash() {
    if (this.stashOpen || !this.player) return;
    this.stashOpen = true;
    this.stashScreen = new StashScreen(SCREEN_WIDTH, SCREEN_HEIGHT, this.stashTabs, this.player.inventory);
    this.stashScreen.onDepositCallback((invIndex: number) => {
      if (!this.player) return;
      const slot = this.player.inventory[invIndex];
      if (!slot) return;
      const tab = this.stashTabs[0];
      const emptyIdx = tab.slots.findIndex(s => s === null);
      if (emptyIdx === -1) {
        this.stashScreen?.showMessage('Stash tab full!');
        return;
      }
      tab.slots[emptyIdx] = slot;
      this.player.inventory[invIndex] = null;
      this.refreshStashAfterAction();
    });
    this.stashScreen.onWithdrawCallback((tabIndex: number, slotIndex: number) => {
      if (!this.player) return;
      const tab = this.stashTabs[tabIndex];
      if (!tab) return;
      const slot = tab.slots[slotIndex];
      if (!slot) return;
      const freeIdx = this.player.inventory.findIndex(s => s === null);
      if (freeIdx === -1) {
        this.stashScreen?.showMessage('Inventory full!');
        return;
      }
      this.player.inventory[freeIdx] = slot;
      tab.slots[slotIndex] = null;
      this.refreshStashAfterAction();
    });
    this.stashScreen.onRenameTabCallback((tabIndex: number, name: string) => {
      if (this.stashTabs[tabIndex]) {
        this.stashTabs[tabIndex].name = name;
      }
    });
    this.stashScreen.onCloseCallback(() => this.closeStash());
    this.app.stage.addChild(this.stashScreen.container);
  }

  private closeStash() {
    this.stashOpen = false;
    if (this.stashScreen) {
      this.app.stage.removeChild(this.stashScreen.container);
      this.stashScreen.destroy();
      this.stashScreen = undefined;
    }
    if (this.interactPrompt) {
      this.gameContainer?.removeChild(this.interactPrompt);
      this.interactPrompt.destroy();
      this.interactPrompt = undefined;
    }
  }

  private refreshStashAfterAction() {
    if (!this.player) return;
    this.closeStash();
    this.openStash();
  }

  private getDefaultStashTabs(): StashTab[] {
    return Array.from({ length: 4 }, (_, i) => ({
      name: `Stash ${i + 1}`,
      slots: new Array(60).fill(null),
    }));
  }

  private cleanupGameSession() {
    if (this.escapeMenuOpen) this.toggleEscapeMenu();
    if (this.inventoryOpen) this.toggleInventory();
    if (this.treeOpen) this.toggleTree();
    if (this.subTreeScreen) {
      this.app.stage.removeChild(this.subTreeScreen.container);
      this.subTreeScreen.destroy();
      this.subTreeScreen = undefined;
    }
    if (this.characterScreen) {
      this.app.stage.removeChild(this.characterScreen.container);
      this.characterScreen.destroy();
      this.characterScreen = undefined;
    }
    this.characterScreenOpen = false;
    if (this.deathScreen) {
      this.app.stage.removeChild(this.deathScreen.container);
      this.deathScreen.destroy();
      this.deathScreen = undefined;
    }
    if (this.hud) { this.app.stage.removeChild(this.hud.container); this.hud.destroy(); this.hud = undefined; }
    if (this.skillBar) { this.app.stage.removeChild(this.skillBar.container); this.skillBar.destroy(); this.skillBar = undefined; }
    if (this.minimap) { this.app.stage.removeChild(this.minimap.container); this.minimap.destroy(); this.minimap = undefined; }
    if (this.escapeMenu) { this.app.stage.removeChild(this.escapeMenu.container); this.escapeMenu.destroy(); this.escapeMenu = undefined; }
    if (this.saveSlotScreen) { this.app.stage.removeChild(this.saveSlotScreen.container); this.saveSlotScreen.destroy(); this.saveSlotScreen = undefined; }
    if (this.settingsPlaceholder) { this.app.stage.removeChild(this.settingsPlaceholder.container); this.settingsPlaceholder.destroy(); this.settingsPlaceholder = undefined; }
    if (this.vendorScreen) { this.app.stage.removeChild(this.vendorScreen.container); this.vendorScreen.destroy(); this.vendorScreen = undefined; }
    if (this.stashScreen) { this.app.stage.removeChild(this.stashScreen.container); this.stashScreen.destroy(); this.stashScreen = undefined; }
    if (this.soulVaultScreen) {
      this.soulVaultScreen.destroy();
      this.soulVaultScreen = undefined;
      this.soulVaultOpen = false;
    }
    if (this.tutorialScreen) {
      this.app.stage.removeChild(this.tutorialScreen.container);
      this.tutorialScreen.destroy();
      this.tutorialScreen = undefined;
    }
    this.tutorialStage = null;
    this.tutorialKeys = new Set();
    this.tutorialKeyWasDown = new Set();
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
    this.enemies = [];
    for (const m of this.minions) m.destroy();
    this.minions = [];
    this.recentCorpses = [];
    this.frameCount = 0;
    for (const p of this.projectiles) if (p.alive) { try { p.destroy(); } catch (_) {} }
    this.projectiles = [];
    this.itemDrops = [];
    this.soulDrops = [];
    this.soulVault = [];
    this.activeSpectre = null;
    this.activeSpectreMinion = null;
    this.rainZones = [];
    this.vfx = [];
    this.modGfx = [];
    this.chillZones = [];
    this.chests = [];
    this.breakables = [];
    this.decorationSprites = [];
    this.dash = null;
    this.waveCooldown = 0;
    this.zoneManager = new ZoneManager();
    if (this.gameContainer) {
      this.app.stage.removeChild(this.gameContainer);
      try { this.gameContainer.destroy({ children: true }); } catch (_) {}
      this.gameContainer = undefined;
    }
    this.devConsole.hide();
    this.combatText.destroy();
    this.combatText = new CombatTextManager();
    this.player = undefined;
    this.room = undefined;
    this.input.reset();
    this.lastKeys.clear();
    this.vendorOpen = false;
    this.stashOpen = false;
    this.vendorStock = [];
  }
 
  private toggleEscapeMenu() {
    if (!this.player) return;
    this.escapeMenuOpen = !this.escapeMenuOpen;
    if (this.escapeMenuOpen) {
      this.escapeMenu = new EscapeMenu(SCREEN_WIDTH, SCREEN_HEIGHT);
      this.escapeMenu.onResumeCallback(() => this.toggleEscapeMenu());
      this.escapeMenu.onSaveCallback(() => {
        this.saveGame();
        this.escapeMenu?.showSaveToast();
      });
      this.escapeMenu.onSettingsCallback(() => this.showSettingsPlaceholder());
      this.escapeMenu.onSaveAndExitCallback(() => this.exitToMenu());
      this.app.stage.addChild(this.escapeMenu.container);
    } else {
      if (this.settingsPlaceholder) {
        this.app.stage.removeChild(this.settingsPlaceholder.container);
        this.settingsPlaceholder.destroy();
        this.settingsPlaceholder = undefined;
      }
      if (this.escapeMenu) {
        this.app.stage.removeChild(this.escapeMenu.container);
        this.escapeMenu.destroy();
        this.escapeMenu = undefined;
      }
    }
  }

  private showSettingsPlaceholder() {
    if (!this.settingsPlaceholder) {
      this.settingsPlaceholder = new SettingsPlaceholder(SCREEN_WIDTH, SCREEN_HEIGHT);
      this.settingsPlaceholder.onBackCallback(() => {
        if (this.settingsPlaceholder) {
          this.app.stage.removeChild(this.settingsPlaceholder.container);
          this.settingsPlaceholder.destroy();
          this.settingsPlaceholder = undefined;
        }
      });
      this.app.stage.addChild(this.settingsPlaceholder.container);
    }
  }

  private showSaveSlotScreen(mode: 'load' | 'save') {
    if (this.mainMenu) {
      this.app.stage.removeChild(this.mainMenu.container);
      this.mainMenu.destroy();
      this.mainMenu = undefined;
    }
    this.saveSlotScreen = new SaveSlotScreen(SCREEN_WIDTH, SCREEN_HEIGHT, mode);
    this.saveSlotScreen.onSelectCallback((index: number) => {
      if (this.saveSlotScreen) {
        this.app.stage.removeChild(this.saveSlotScreen.container);
        this.saveSlotScreen.destroy();
        this.saveSlotScreen = undefined;
      }
      if (mode === 'load') {
        this.loadGame(index);
      }
    });
    this.saveSlotScreen.onBackCallback(() => {
      if (this.saveSlotScreen) {
        this.app.stage.removeChild(this.saveSlotScreen.container);
        this.saveSlotScreen.destroy();
        this.saveSlotScreen = undefined;
      }
      this.showMainMenu();
    });
    this.app.stage.addChild(this.saveSlotScreen.container);
  }

  private buildCurrentZoneRoom() {
    if (!this.gameContainer || !this.room || !this.player) return;

    // Clear existing entities
    for (const e of this.enemies) { try { this.gameContainer.removeChild(e.sprite); } catch (_) {} try { e.destroy(); } catch (_) {} }
    for (const p of this.projectiles) { try { this.gameContainer.removeChild(p.sprite); } catch (_) {} try { p.destroy(); } catch (_) {} }
    for (const d of this.itemDrops) { try { this.gameContainer.removeChild(d.container); } catch (_) {} try { d.destroy(); } catch (_) {} }
    for (const s of this.decorationSprites) { try { this.gameContainer.removeChild(s); } catch (_) {} try { s.destroy(); } catch (_) {} }
    for (const c of this.chests) { try { this.gameContainer.removeChild(c.container); } catch (_) {} try { c.destroy(); } catch (_) {} }
    for (const b of this.breakables) { try { this.gameContainer.removeChild(b.container); } catch (_) {} try { b.destroy(); } catch (_) {} }
    for (const u of this.urns) { try { this.gameContainer.removeChild(u.container); } catch (_) {} try { u.destroy(); } catch (_) {} }
    for (const m of this.minions) m.destroy();
    this.enemies = [];
    this.minions = [];
    this.projectiles = [];
    this.itemDrops = [];
    this.decorationSprites = [];
    this.chests = [];
    this.breakables = [];
    this.urns = [];
    if (this.secretBush) {
      try { this.gameContainer.removeChild(this.secretBush.container); } catch (_) {}
      try { this.secretBush.destroy(); } catch (_) {}
      this.secretBush = null;
    }
    this.jackpotChest = null;
    this.vfx = [];
    this.chillZones = [];
    this.dash = null;
    if (this.recallPortal) {
      try {
        if (this.recallPortal.graphic.parent) this.gameContainer.removeChild(this.recallPortal.graphic);
        this.recallPortal.graphic.destroy();
      } catch (_) {}
      this.recallPortal = null;
    }

    // Remove old room visuals
    this.gameContainer.removeChild(this.room.container);
    try {
      this.room.container.destroy({ children: true });
    } catch (e) {
      Logger.log('system', `Room destroy error: ${e}`);
    }

    // Build new room from zone state
    const state = this.zoneManager.state;
    if (!state) return;

    const zone = state.config;
    const template = state.currentTemplate;

    // Update camera clamp bounds for hub vs regular rooms
    if (this.camera) {
      if (zone.id === 'hub') {
        this.camera.setClampBounds({ x: 1600, y: 896, width: 3200, height: 1792 });
      } else {
        this.camera.setClampBounds();
      }
    }

    // Clean up tutorial when leaving the tutorial zone
    if (zone.id !== 'tutorial' && this.tutorialScreen) {
      this.app.stage.removeChild(this.tutorialScreen.container);
      this.tutorialScreen.destroy();
      this.tutorialScreen = undefined;
      // Preserve tutorialStage for return from crypt
      this.tutorialKeys = new Set();
      this.tutorialKeyWasDown = new Set();
    }

    // Recreate tutorial screen when returning to unfinished tutorial
    if (zone.id === 'tutorial' && !this.tutorialScreen && this.tutorialStage && this.tutorialStage !== 'complete') {
      this.tutorialScreen = new TutorialScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
      this.tutorialScreen.setStage(this.tutorialStage);
      this.app.stage.addChild(this.tutorialScreen.container);
    }

    this.room = new Room(zone.biome, template.doors, template.portals, template.decorationRects, template.buildings, template.npcs, (targetZone: string) => this.zoneManager.isZoneUnlocked(targetZone), template.playerStart, template.cabins, state.roomIndex);
    this.gameContainer.addChild(this.room.container);

    // Procedural decoration
    const tileConfig = zone.tileConfig ? TILE_CONFIGS[zone.tileConfig as BiomeId] : undefined;
    const roadBlock = template.doors.length > 0 ? (() => {
      const door = template.doors[0];
      const cx = door.rect.x + door.rect.width / 2;
      const cy = door.rect.y + door.rect.height / 2;
      const sx = template.playerStart.x;
      const sy = template.playerStart.y;
      let minX = Math.min(sx, cx) - 32;
      let maxX = Math.max(sx, cx) + 32;
      let minY = Math.min(sy, cy) - 32;
      let maxY = Math.max(sy, cy) + 32;
      if (zone.id === 'tutorial') {
        minX = Math.min(minX, 5580);
        maxX = Math.max(maxX, 5620);
        minY = Math.min(minY, 980);
        maxY = Math.max(maxY, 1020);
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    })() : undefined;
    const decor = decorateRoom(template, zone.biome, tileConfig, roadBlock);
    for (const d of decor.decorations) { this.gameContainer.addChild(d.sprite); this.decorationSprites.push(d.sprite); }
    for (const ob of decor.obstacles) this.room.walls.push(ob);
    for (const cp of decor.chests) {
      const chest = new Chest(cp.x, cp.y);
      this.chests.push(chest);
      this.gameContainer.addChild(chest.container);
    }
    for (const bp of decor.breakables) {
      const brk = new Breakable(bp.x, bp.y);
      this.breakables.push(brk);
      this.gameContainer.addChild(brk.container);
    }

    // Cursed urns
    this.spawnUrns(zone, template);

    // Cabin walls, spawn zones, and chests
    for (const c of template.cabins) {
      const doorW = c.width / 2 - 24;
      this.room.walls.push({ x: c.x, y: c.y, width: c.width, height: 8 });
      this.room.walls.push({ x: c.x + c.width - 8, y: c.y, width: 8, height: c.height });
      this.room.walls.push({ x: c.x, y: c.y, width: 8, height: c.height });
      this.room.walls.push({ x: c.x, y: c.y + c.height - 32, width: doorW, height: 8 });
      this.room.walls.push({ x: c.x + c.width / 2 + 24, y: c.y + c.height - 32, width: c.width / 2 - 24, height: 8 });

      for (const sz of c.spawnZones) {
        template.spawnZones.push(sz);
      }

      const chest = new Chest(c.chestPos.x, c.chestPos.y);
      chest.container.zIndex = 4;
      this.chests.push(chest);
      this.gameContainer.addChild(chest.container);
    }

    // Secret bush for hidden crypt door (tutorial zone only)
    if (zone.id === 'tutorial' && !this.bushRevealed) {
      this.secretBush = new SecretBush(5600, 1000, () => {
        this.bushRevealed = true;
        const t = this.zoneManager.state?.currentTemplate;
        if (!t) return;
        // Remember player position so we don't teleport them on rebuild
        const savedX = this.player?.x ?? 0;
        const savedY = this.player?.y ?? 0;
    t.doors.push({
      rect: { x: 5560, y: 960, width: 160, height: 100 },
      targetZone: 'secret_crypt',
      targetRoom: 0,
    });
        this.buildCurrentZoneRoom();
        // Restore player position so they stay where they were
        if (this.player && this.zoneManager.zoneId === 'tutorial') {
          this.player.x = savedX;
          this.player.y = savedY;
        }
      });
      this.gameContainer.addChild(this.secretBush.container);
    }

    // Hidden Crypt wave and jackpot setup
    if (zone.id === 'secret_crypt') {
      this.cryptWaveCount = 0;
      this.cryptWaveActive = true;

      if (!this.cryptJackpotClaimed) {
        this.jackpotChest = new Chest(3200, 2000, { isJackpot: true, locked: true });
        this.chests.push(this.jackpotChest);
        this.gameContainer.addChild(this.jackpotChest.container);
      }
    }

    // Hub-specific detailed visuals
    if (zone.id === 'hub') {
      const pathCenterY = 1792;
      const pathL = 1800;
      const pathR = 4600;

      // Stone pathway — 3 tiles wide for main axes
      for (let x = pathL - 32; x <= pathL + 32; x += 32) {
        for (let y = 1120; y < 2400; y += 32) {
          const tile = new Sprite(Sprites.pathTile);
          tile.x = x; tile.y = y;
          this.gameContainer.addChild(tile);
          this.decorationSprites.push(tile);
        }
      }
      for (let x = pathR - 32; x <= pathR + 32; x += 32) {
        for (let y = 1120; y < 2400; y += 32) {
          const tile = new Sprite(Sprites.pathTile);
          tile.x = x; tile.y = y;
          this.gameContainer.addChild(tile);
          this.decorationSprites.push(tile);
        }
      }
      // Horizontal cross path — 3 tiles wide
      for (let y = pathCenterY - 32; y <= pathCenterY + 32; y += 32) {
        for (let x = pathL; x < pathR; x += 32) {
          const tile = new Sprite(Sprites.pathTile);
          tile.x = x; tile.y = y;
          this.gameContainer.addChild(tile);
          this.decorationSprites.push(tile);
        }
      }

      // Pillars along the portal paths (between path and portals)
      for (const py of [1070, 1470, 1870]) {
        const pillarL = new Graphics();
        pillarL.beginFill(0x6a6a6a, 0.9);
        pillarL.drawRoundedRect(-6, -20, 12, 80, 3);
        pillarL.endFill();
        pillarL.lineStyle(1, 0x8a8a8a, 0.6);
        pillarL.drawRoundedRect(-6, -20, 12, 80, 3);
        pillarL.x = 1720; pillarL.y = py + 40;
        this.gameContainer.addChild(pillarL);
        this.decorationSprites.push(pillarL as any);

        const pillarR = new Graphics();
        pillarR.beginFill(0x6a6a6a, 0.9);
        pillarR.drawRoundedRect(-6, -20, 12, 80, 3);
        pillarR.endFill();
        pillarR.lineStyle(1, 0x8a8a8a, 0.6);
        pillarR.drawRoundedRect(-6, -20, 12, 80, 3);
        pillarR.x = 4680; pillarR.y = py + 40;
        this.gameContainer.addChild(pillarR);
        this.decorationSprites.push(pillarR as any);
      }

      // Building collision walls
      this.room.walls.push({ x: 2700, y: 1100, width: 400, height: 250 });
      this.room.walls.push({ x: 3300, y: 1100, width: 400, height: 250 });

      // Detailed building sprites
      const vendorSprite = new Sprite(Sprites.buildVendor);
      vendorSprite.x = 2700;
      vendorSprite.y = 1100;
      vendorSprite.scale.set(2.5, 2.5);
      this.gameContainer.addChild(vendorSprite);
      this.decorationSprites.push(vendorSprite);

      const stashSprite = new Sprite(Sprites.buildStash);
      stashSprite.x = 3300;
      stashSprite.y = 1100;
      stashSprite.scale.set(2.5, 2.5);
      this.gameContainer.addChild(stashSprite);
      this.decorationSprites.push(stashSprite);

      // Fountain at town center (scaled up 2x)
      const fountainSprite = new Sprite(Sprites.fountain);
      fountainSprite.anchor.set(0.5, 0.5);
      fountainSprite.scale.set(2);
      fountainSprite.x = 3200;
      fountainSprite.y = 1808;
      this.gameContainer.addChild(fountainSprite);
      this.decorationSprites.push(fountainSprite);
      // Fountain water VFX — larger animated spray
      this.addVfx((g, t) => {
        g.clear();
        const cx = 3200, cy = 1808;
        const spin = this.portalAngle;
        g.lineStyle(3, 0x66ccff, 0.3);
        for (let i = 0; i < 8; i++) {
          const a = spin + (i / 8) * Math.PI * 2;
          const len = 24 + 12 * Math.abs(Math.sin(a));
          g.moveTo(cx, cy - 24);
          g.lineTo(cx + Math.cos(a) * len, cy - 24 + Math.sin(a) * len);
        }
        for (let i = 0; i < 6; i++) {
          const a = spin * 2 + (i / 6) * Math.PI * 2;
          const dist = 20 + 10 * Math.sin(a);
          g.beginFill(0x88ddff, 0.5 - 0.4 * Math.abs(Math.sin(a)));
          g.drawCircle(cx + Math.cos(a) * dist, cy - 30 + Math.sin(a) * dist, 3);
          g.endFill();
        }
      }, 99999);

      // Statue near fountain (scaled up 2.5x)
      const statueSprite = new Sprite(Sprites.statue);
      statueSprite.anchor.set(0.5, 1);
      statueSprite.scale.set(2.5);
      statueSprite.x = 3200;
      statueSprite.y = 1730;
      this.gameContainer.addChild(statueSprite);
      this.decorationSprites.push(statueSprite);

      // Animated NPC sprites
      const vendorNpc = createVendorSprite();
      vendorNpc.x = 2900;
      vendorNpc.y = 1380;
      this.gameContainer.addChild(vendorNpc);
      this.decorationSprites.push(vendorNpc);

      const stashNpc = createStashSprite();
      stashNpc.scale.set(1.3);
      stashNpc.x = 3500;
      stashNpc.y = 1380;
      this.gameContainer.addChild(stashNpc);
      this.decorationSprites.push(stashNpc);

      // Generate vendor stock on hub entry
      this.vendorStock = generateVendorStock(this.player.level);

      // One-time hub tip on first entry
      if (!this.hasSeenHubTip) {
        this.hasSeenHubTip = true;
        this.hubTip = new HubTip(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.app.stage.addChild(this.hubTip.container);
      }
    }

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
        if (e.nameplate) this.gameContainer!.addChild(e.nameplate);
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
    const isBossRoom = state.roomIndex === zone.roomCount - 1 && zone.bossId && zone.id !== 'secret_crypt';
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
    const enemies = this.zoneManager.spawnEnemies(state.config, state.currentTemplate, state.roomIndex, this.player?.x, this.player?.y);
    for (const e of enemies) {
      this.enemies.push(e);
      this.gameContainer!.addChild(e.sprite);
      if (e.nameplate) this.gameContainer!.addChild(e.nameplate);
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
        if (e.nameplate) this.gameContainer!.addChild(e.nameplate);
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

  private spawnChestLoot(cx: number, cy: number) {
    for (const drop of createRandomLoot(cx, cy, 3)) {
      this.itemDrops.push(drop);
      this.gameContainer!.addChild(drop.container);
    }
    const gen = generateItemDrop(this.player?.level);
    const iDrop = createItemDrop(cx, cy, gen);
    this.itemDrops.push(iDrop);
    this.gameContainer!.addChild(iDrop.container);
    if (Math.random() < 0.3) {
      const gen2 = generateItemDrop(this.player?.level);
      const iDrop2 = createItemDrop(cx, cy, gen2);
      this.itemDrops.push(iDrop2);
      this.gameContainer!.addChild(iDrop2.container);
    }
    if (Math.random() < 0.15) {
      const orb = generateOrbDrop();
      const oDrop = createOrbDrop(cx, cy, orb.orbId, orb.name);
      this.itemDrops.push(oDrop);
      this.gameContainer!.addChild(oDrop.container);
    }
  }

  private spawnUrns(zone: { id: string; biome: any; enemyCount?: number | { min: number; max: number } }, template: { walls: { x: number; y: number; width: number; height: number }[]; spawnZones: { x: number; y: number; width: number; height: number }[]; doors: { rect: { x: number; y: number; width: number; height: number } }[]; portals: { rect: { x: number; y: number; width: number; height: number } }[] }) {
    const count = UrnConfig.URN_SPAWN_CONFIG.minPerZone + Math.floor(Math.random() * (UrnConfig.URN_SPAWN_CONFIG.maxPerZone - UrnConfig.URN_SPAWN_CONFIG.minPerZone + 1));
    let rareCount = 0;
    for (let i = 0; i < count; i++) {
      const rarity = UrnConfig.rollUrnRarity();
      if (rarity === 'rare' && rareCount >= UrnConfig.URN_SPAWN_CONFIG.maxRarePerZone) continue;
      if (rarity === 'rare') rareCount++;

      const type = UrnConfig.rollUrnType();

      // Find valid position via rejection sampling
      const margin = 80;
      let placed = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const x = 64 + Math.random() * (ROOM_WIDTH - 128);
        const y = 64 + Math.random() * (ROOM_HEIGHT - 128);
        const urnRect = { x: x - 30, y: y - 36, width: 60, height: 72 };

        let blocked = false;
        for (const wall of this.room?.walls ?? []) {
          if (rectsOverlap(urnRect, wall)) { blocked = true; break; }
        }
        if (blocked) continue;
        for (const door of template.doors) {
          if (rectsOverlap(urnRect, door.rect)) { blocked = true; break; }
        }
        if (blocked) continue;
        for (const portal of template.portals) {
          if (rectsOverlap(urnRect, portal.rect)) { blocked = true; break; }
        }
        if (blocked) continue;
        for (const chest of this.chests) {
          if (rectsOverlap(urnRect, { x: chest.x - 14, y: chest.y - 10, width: 28, height: 20 })) { blocked = true; break; }
        }
        if (blocked) continue;

        // Check if spawn was already restored from save
        const existing = this.urns.find(u => Math.abs(u.x - x) < 10 && Math.abs(u.y - y) < 10);
        if (existing) { blocked = true; break; }
        if (blocked) continue;

        const urn = new CursedUrn(x, y, { type, rarity });
        this.urns.push(urn);
        this.gameContainer!.addChild(urn.container);
        placed = true;
        Logger.log('system', `Cursed Urn spawned: ${type.name} (${rarity}) at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        break;
      }
    }
  }

  private spawnBreakableLoot(bx: number, by: number) {
    for (const drop of createRandomLoot(bx, by, 0.5)) {
      this.itemDrops.push(drop);
      this.gameContainer!.addChild(drop.container);
    }
    if (Math.random() < 0.05) {
      const item = generateItemDrop(this.player?.level);
      const iDrop = createItemDrop(bx, by, item);
      this.itemDrops.push(iDrop);
      this.gameContainer!.addChild(iDrop.container);
    }
    if (Math.random() < 0.03) {
      const orb = generateOrbDrop();
      const oDrop = createOrbDrop(bx, by, orb.orbId, orb.name);
      this.itemDrops.push(oDrop);
      this.gameContainer!.addChild(oDrop.container);
    }
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

      // Hub tip X key close
      if (this.hubTip && !this.hubTip.isClosed()) {
        if (this.input.isKeyDown('KeyX')) {
          this.hubTip.close();
          this.hubTip = undefined;
        }
        return;
      }

      // Escape key handling
      if (this.input.isKeyDown('Escape')) {
        if (!this.wasEscapeKeyDown) {
          if (this.soulVaultScreen?.visible) {
            this.soulVaultScreen.toggle();
            this.soulVaultOpen = false;
          } else if (this.vendorOpen) {
            this.closeVendor();
          } else if (this.stashOpen) {
            this.closeStash();
          } else if (this.characterScreenOpen) {
            this.toggleCharacterScreen();
          } else if (this.subTreeScreen) {
            this.toggleSubTree();
          } else if (!this.inventoryOpen && !this.treeOpen && !this.subTreeScreen) {
            this.toggleEscapeMenu();
          } else if (this.inventoryOpen) {
            this.toggleInventory();
          } else if (this.treeOpen) {
            this.toggleTree();
          }
          this.wasEscapeKeyDown = true;
        }
      } else {
        this.wasEscapeKeyDown = false;
      }
      if (!this.input.isKeyDown('KeyE')) {
        this.wasEKeyDown = false;
      }
      if (!this.input.isKeyDown('KeyV')) {
        this.wasVKeyDown = false;
      }
      if (this.characterScreenOpen) {
        const cDown = this.input.isKeyDown('KeyC');
        if (cDown && !this.wasCKeyDown) {
          this.wasCKeyDown = true;
          this.toggleCharacterScreen();
          return;
        }
        this.wasCKeyDown = cDown;
        this.characterScreen?.update();
        return;
      }
      if (this.escapeMenuOpen || this.vendorOpen || this.stashOpen) {
        this.escapeMenu?.update();
        this.vendorScreen?.update();
        this.stashScreen?.update();
        return;
      }
      if (this.subTreeScreen) {
        const kDown = this.input.isKeyDown('KeyK');
        if (kDown && !this.wasKKeyDown) {
          this.wasKKeyDown = true;
          this.toggleSubTree();
          return;
        }
        this.wasKKeyDown = kDown;

        const skill = this.player?.skills.mainAbility;
        const tree = skill?.subTreeId ? this.player?.skillSubTrees.get(skill.subTreeId) : undefined;
        if (tree && this.player) {
          this.subTreeScreen.update(this.input, tree, this.player.skillSubPoints);
        }
        return;
      }

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

      if (this.inventoryOpen) {
        const iDown = this.input.isKeyDown('KeyI');
        if (iDown && !this.wasIKeyDown) this.toggleInventory();
        this.wasIKeyDown = iDown;
        this.wasCKeyDown = false;
      } else {
        const pDown = this.input.isKeyDown('KeyP');
        if (pDown && !this.wasPKeyDown) this.toggleTree();
        this.wasPKeyDown = pDown;

        const kDown = this.input.isKeyDown('KeyK');
        if (kDown && !this.wasKKeyDown) {
          if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen) {
            this.toggleSubTree();
          }
        }
        this.wasKKeyDown = kDown;

        const iDown = this.input.isKeyDown('KeyI');
        if (iDown && !this.wasIKeyDown) this.toggleInventory();
        this.wasIKeyDown = iDown;

        const cDown = this.input.isKeyDown('KeyC');
        if (cDown && !this.wasCKeyDown) {
          if (!this.treeOpen && !this.inventoryOpen && !this.escapeMenuOpen && !this.vendorOpen && !this.stashOpen && !this.subTreeScreen) {
            this.toggleCharacterScreen();
          }
        }
        this.wasCKeyDown = cDown;

        // V key: Soul Vault (summoner only)
        if (this.player?.classType === 'summoner' && this.input.isKeyDown('KeyV') && !this.wasVKeyDown) {
          if (!this.devConsole.isVisible() && !this.vendorOpen && !this.stashOpen &&
              !this.inventoryOpen && !this.treeOpen &&
              !this.characterScreenOpen && !this.subTreeScreen && !this.escapeMenuOpen) {
            this.soulVaultScreen?.toggle();
            this.soulVaultOpen = !this.soulVaultOpen;
          }
          this.wasVKeyDown = true;
          return;
        }
      }
    }
    switch (this.state) {
      case State.Menu: this.mainMenu?.update(this.input, dt); break;
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
    if (this.soulVaultScreen?.visible) {
      this.soulVaultScreen.update(this.soulVault, this.activeSpectre, (soul) => this.summonSpectre(soul));
      return;
    }
    this.frameCount++;

    // Process urn enemy spawn queue (staggered)
    if (this.urnSpawnQueue.length > 0) {
      this.urnStaggerTimer -= dt;
      if (this.urnStaggerTimer <= 0) {
        const next = this.urnSpawnQueue.shift()!;
        this.enemies.push(next.enemy);
        this.gameContainer!.addChild(next.enemy.sprite);
        if (next.enemy.nameplate) {
          this.gameContainer!.addChild(next.enemy.nameplate);
        }
        this.urnStaggerTimer = this.urnSpawnQueue.length > 0
          ? 0.8 / this.urnSpawnQueue.length * 60
          : 0;
      }
    }

    // Clean up per-frame mod VFX
    for (const g of this.modGfx) {
      try { if (g.parent) this.gameContainer!.removeChild(g); } catch (_) {}
      try { g.destroy(); } catch (_) {}
    }
    this.modGfx = [];

    // Auto-save every 3600 frames (60s)
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 3600 && this.currentSaveSlot !== null) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }

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

      if (t >= 1) {
        this.dash = null;
        if (this.player.classType === 'ranger') {
          this.player.endRollAnimation();
          playAnimation(this.player.sprite as AnimatedSprite, 'idle', true, 'ranger');
        }
      }
    }

    const inputDisabled = this.playerPullTimer > 0;
    if (!inputDisabled) {
      this.player.update(this.input, mouseWX, mouseWY, this.room.walls, dt);
    }

    // HP regen from passive tree
    if (!this.player.regenDisabled && this.player.health < this.player.maxHealth) {
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

    // Frost aura slow
    let frostAuraSlow = false;
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.frostAuraActive) continue;
      if (Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) < enemy.frostAuraRadius) {
        frostAuraSlow = true;
        break;
      }
    }
    if (frostAuraSlow) {
      this.player.slowTimer = Math.max(this.player.slowTimer, 1);
    }

    // Per-frame monster mod VFX
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      // Frost aura ring
      if (enemy.frostAuraActive) {
        const ring = new Graphics();
        ring.lineStyle(2, 0x4488ff, 0.35);
        ring.drawCircle(0, 0, enemy.frostAuraRadius);
        ring.beginFill(0x4488ff, 0.06);
        ring.drawCircle(0, 0, enemy.frostAuraRadius);
        ring.endFill();
        ring.x = enemy.x;
        ring.y = enemy.y;
        this.gameContainer!.addChild(ring);
        this.modGfx.push(ring);

        const glow = new Graphics();
        glow.beginFill(0x4488ff, 0.04);
        glow.drawCircle(0, 0, enemy.frostAuraRadius * 0.6);
        glow.endFill();
        glow.x = enemy.x;
        glow.y = enemy.y;
        this.gameContainer!.addChild(glow);
        this.modGfx.push(glow);
      }

      // Volatile pulsing glow
      if (enemy.volatileActive) {
        const pulse = 0.5 + 0.5 * Math.sin(this.portalAngle * 0.1);
        const glow = new Graphics();
        glow.beginFill(0xff3333, 0.12 * pulse);
        glow.drawCircle(0, 0, 22);
        glow.endFill();
        glow.x = enemy.x;
        glow.y = enemy.y;
        this.gameContainer!.addChild(glow);
        this.modGfx.push(glow);
      }

      // Hasted speed lines
      if (enemy.hastedMultiplier > 1 && Math.random() < 0.04) {
        const streak = new Graphics();
        const len = 8 + Math.random() * 14;
        streak.lineStyle(1.5, 0xffffff, 0.4);
        streak.moveTo(-len, -1);
        streak.lineTo(0, -1);
        streak.x = enemy.x;
        streak.y = enemy.y;
        this.gameContainer!.addChild(streak);
        this.modGfx.push(streak);
      }
    }

    // Minion updates
    const mageFireProjectiles: { minion: Minion; angle: number; dmg: number }[] = [];
    for (const m of this.minions) {
      if (!m.alive) continue;
      m.update(this.player.x, this.player.y, this.enemies, this.room.walls, dt, this.minions);
      if (m.wantsToFire) {
        const nearest = this.findNearestEnemy(m.x, m.y);
        if (nearest) {
          mageFireProjectiles.push({
            minion: m,
            angle: Math.atan2(nearest.y - m.y, nearest.x - m.x),
            dmg: m.damage,
          });
        }
        m.wantsToFire = false;
      }
    }
    // Spawn mage projectiles
    for (const fp of mageFireProjectiles) {
      const p = new Projectile(fp.minion.x, fp.minion.y, fp.angle, 5, fp.dmg, false, false, 0x8844cc);
      p.lifetime = 90;
      this.projectiles.push(p);
      this.gameContainer!.addChild(p.sprite);
    }

    // Minion death cleanup
    for (let i = this.minions.length - 1; i >= 0; i--) {
      if (!this.minions[i].alive) {
        const dead = this.minions.splice(i, 1)[0];
        this.gameContainer!.removeChild(dead.sprite);
        if (dead.nameplate) this.gameContainer!.removeChild(dead.nameplate);
        dead.destroy();
      }
    }

    // Boss update
    if (this.boss?.alive) {
      this.boss.update(this.player.x, this.player.y, dt, this.room!.walls);

      // Cthulhu pull mechanic
      if (this.boss.pendingPull) {
        this.playerPullTimer = 30;
        const pull = this.boss.pendingPull;
        const pullTargetX = this.player.x + Math.cos(pull.angle) * pull.distance;
        const pullTargetY = this.player.y + Math.sin(pull.angle) * pull.distance;
        const resolved = resolveCollision(
          { x: pullTargetX - this.player.width / 2, y: pullTargetY - this.player.height / 2, width: this.player.width, height: this.player.height },
          this.room?.walls ?? []
        );
        this.player.x = resolved.x + this.player.width / 2;
        this.player.y = resolved.y + this.player.height / 2;
        this.boss.pendingPull = null;
      }
      if (this.playerPullTimer > 0) {
        this.playerPullTimer--;
      }

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

    // Update camera
    if (this.camera) {
      this.camera.update(this.player.x, this.player.y, dt);
      this.gameContainer!.x = -this.camera.x;
      this.gameContainer!.y = -this.camera.y;
    }

    // Update minimap
    if (this.minimap && this.room) {
      this.minimap.update(this.player.x, this.player.y, this.room.walls, this.enemies, this.chests, this.breakables, this.urns, this.room.doors);
    }

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

    // Rain of Arrows zone update
    for (let i = this.rainZones.length - 1; i >= 0; i--) {
      const rz = this.rainZones[i];
      rz.life -= dt;
      if (rz.life <= 0) {
        this.rainZones.splice(i, 1);
        continue;
      }
      const t = 1 - rz.life / rz.maxLife;

      const isPoison = rz.isPoison || false;
      const indicatorColor = isPoison ? 0x88ff44 : 0x44ff44;
      const indicatorColor2 = isPoison ? 0xbbff88 : 0x88ff88;

      // Draw ground indicator (pulsing ring)
      const pulseRadius = rz.radius * (0.95 + 0.05 * Math.sin(t * Math.PI * 4));
      this.addVfx((g, _ft) => {
        g.lineStyle(2, indicatorColor, 0.3 - 0.2 * t);
        g.drawCircle(0, 0, pulseRadius);
        g.lineStyle(1, indicatorColor2, 0.15 - 0.1 * t);
        g.drawCircle(0, 0, pulseRadius * 0.8);
      }, 2).position.set(rz.x, rz.y);

      // Arrow Storm: more arrows
      const baseArrowCount = isPoison ? 0 : 2 + Math.floor(Math.random() * 2);
      const arrowCount = this.player?.hasSubKeystone('ra_3') ? 4 + Math.floor(Math.random() * 3) : baseArrowCount;

      // Arrow Storm: +20% radius for arrow placement
      const arrowRadiusMult = this.player?.hasSubKeystone('ra_3') ? 1.2 : 1;

      // Falling arrow streaks
      for (let a = 0; a < arrowCount; a++) {
        const endX = rz.x + (Math.random() - 0.5) * rz.radius * 2 * arrowRadiusMult;
        const endY = rz.y + (Math.random() - 0.5) * rz.radius * 2 * arrowRadiusMult;
        const startX = endX + (Math.random() - 0.5) * 40;
        const startY = rz.y - rz.radius - 60 - Math.random() * 40;
        this.addVfx((g, ft) => {
          const alpha = Math.max(0, 1 - ft * 2);
          g.lineStyle(1, indicatorColor, alpha);
          g.moveTo(0, 0);
          g.lineTo(startX - endX, startY - endY);
        }, 8).position.set(endX, endY);

        // Frost Volley: create chilling ground patch on each arrow
        if (!isPoison && this.player?.hasSubKeystone('ra_6')) {
          this.chillZones.push({
            x: endX, y: endY,
            life: 30,
            radius: 60,
          });
        }

        // Bombardment: AoE damage on each arrow VFX
        if (!isPoison && this.player?.hasSubKeystone('ra_12')) {
          const bombardDmg = Math.round(25 * 0.3);
          for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (Math.hypot(enemy.x - endX, enemy.y - endY) < 60) {
              enemy.takeDamage(bombardDmg);
              this.combatText.showDamage(enemy.x, enemy.y - 20, bombardDmg, 0xff8844);
            }
          }
        }
      }

      // Damage tick
      const tickInterval = isPoison ? 15 : (this.player?.hasSubKeystone('ra_9') ? 5 : 15);
      rz.damageTimer += dt;
      if (rz.damageTimer >= tickInterval) {
        rz.damageTimer = 0;
        const baseDmg = Math.round(25 * 0.6);
        const dmg = isPoison ? Math.round(baseDmg * 0.5) : (this.player?.hasSubKeystone('ra_9') ? Math.round(baseDmg * 3) : baseDmg);
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const edx = enemy.x - rz.x;
          const edy = enemy.y - rz.y;
          if (Math.hypot(edx, edy) < rz.radius) {
            enemy.takeDamage(dmg);
            if (!isPoison) enemy.slowTimer = 20;
            this.combatText.showDamage(enemy.x, enemy.y - 20, dmg, isPoison ? 0x88ff44 : 0x44ff44);
          }
        }
      }
    }

    // Chill zones update
    for (let i = this.chillZones.length - 1; i >= 0; i--) {
      const cz = this.chillZones[i];
      cz.life -= dt;
      if (cz.life <= 0) {
        this.chillZones.splice(i, 1);
        continue;
      }
      this.addVfx((g, _ft) => {
        g.clear();
        g.beginFill(0x4488ff, 0.12);
        g.drawCircle(0, 0, cz.radius);
        g.endFill();
        g.lineStyle(2, 0x88ccff, 0.25);
        g.drawCircle(0, 0, cz.radius);
      }, 2).position.set(cz.x, cz.y);
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (Math.hypot(enemy.x - cz.x, enemy.y - cz.y) < cz.radius) {
          enemy.slowTimer = Math.max(enemy.slowTimer, 5);
        }
      }
    }

    // Chest interaction
    const interactKey = this.input.isKeyDown('KeyE');
    for (const chest of this.chests) {
      if (chest.isOpen) continue;
      const dist = Math.hypot(this.player.x - chest.x, this.player.y - chest.y);
      chest.showPrompt(dist < 48);
      if (dist < 48 && interactKey) {
        if (chest.locked) {
          this.combatText.showDamage(chest.x, chest.y - 30, 0, 0x8888ff);
          continue;
        }
        chest.open();
        if (chest.isJackpot) {
          this.itemDrops.push(new ItemDrop(chest.x, chest.y, {
            type: 'gold', name: '1000 Gold', color: 0xffd700, value: 1000,
          }));
          this.gameContainer!.addChild(this.itemDrops[this.itemDrops.length - 1].container);
          this.cryptJackpotClaimed = true;
        }
        this.spawnChestLoot(chest.x, chest.y);
      }
    }

    // Cursed Urn interaction
    for (const urn of this.urns) {
      if (urn.isOpen) continue;
      urn.update(dt, this.player.x, this.player.y, this.frameCount);
      if (urn.state !== 'idle') continue;

      const urnDist = Math.hypot(this.player.x - urn.x, this.player.y - urn.y);
      if (urnDist < 48 && interactKey) {
        // Check if player is using an orb on the urn
        if (this.activeUrnOrb) {
          this.applyUrnCurrency(urn, this.activeUrnOrb);
        } else {
          // Open urn
          const curses = urn.open();
          if (curses.length > 0) {
            this.player?.applyCurses(curses);
            // Apply marked curse: aggro all enemies
            if (curses.some(c => c.statEffect === 'marked')) {
              for (const e of this.enemies) { e.alwaysAggro = true; }
            }
            // Soul Tax: handled in applyCurseEffect
            // Shattered Flask: handled in applyCurseEffect
            // Open VFX: dark energy burst
            this.vfxUrnOpen(urn.x, urn.y, urn.type.bgColor);
          }
          this.spawnUrnEnemies(urn);
          this.saveGame();
        }
        this.wasEKeyDown = true;
        break;
      }
    }

    // Secret bush E-key interaction
    if (this.secretBush && this.secretBush.state !== 'destroyed') {
      const bushDist = Math.hypot(this.player.x - this.secretBush.x, this.player.y - this.secretBush.y);
      this.secretBush.showPrompt(bushDist < 48);
      if (bushDist < 48 && interactKey) {
        this.secretBush.interact();
      }
    }

    // Secret bush update (wobble/glow animation, proximity revert)
    this.secretBush?.update(dt, this.player.x, this.player.y);

    // Vendor proximity (hub only)
    const nearVendor = this.zoneManager.zoneId === 'hub' && Math.hypot(this.player.x - 2900, this.player.y - 1380) < 150;
    if (nearVendor && !this.vendorOpen && !this.stashOpen && !this.inventoryOpen && !this.treeOpen) {
      if (!this.interactPrompt) {
        this.interactPrompt = new Text('', new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 14, fill: '#f0c060',
          stroke: '#000', strokeThickness: 2,
        }));
        this.interactPrompt.anchor.set(0.5);
        this.gameContainer!.addChild(this.interactPrompt);
      }
      this.interactPrompt.text = 'Press E to trade';
      /* PERF: only update prompt position when player moves */
      if (Math.abs(this.player.x - this.lastPromptPlayerX) > 2 || Math.abs(this.player.y - this.lastPromptPlayerY) > 2) {
        this.interactPrompt.x = this.player.x;
        this.interactPrompt.y = this.player.y - 40;
        this.lastPromptPlayerX = this.player.x;
        this.lastPromptPlayerY = this.player.y;
      }
      this.interactPrompt.visible = true;
      if (this.input.isKeyDown('KeyE') && !this.wasEKeyDown) {
        this.wasEKeyDown = true;
        this.openVendor();
      }
    }

    // Stash proximity (hub only)
    const nearStash = this.zoneManager.zoneId === 'hub' && Math.hypot(this.player.x - 3500, this.player.y - 1380) < 150;
    if (nearStash && !this.stashOpen && !this.vendorOpen && !this.inventoryOpen && !this.treeOpen) {
      if (!this.interactPrompt) {
        this.interactPrompt = new Text('', new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 14, fill: '#f0c060',
          stroke: '#000', strokeThickness: 2,
        }));
        this.interactPrompt.anchor.set(0.5);
        this.gameContainer!.addChild(this.interactPrompt);
      }
      this.interactPrompt.text = 'Press E to access stash';
      /* PERF: only update prompt position when player moves */
      if (Math.abs(this.player.x - this.lastPromptPlayerX) > 2 || Math.abs(this.player.y - this.lastPromptPlayerY) > 2) {
        this.interactPrompt.x = this.player.x;
        this.interactPrompt.y = this.player.y - 40;
        this.lastPromptPlayerX = this.player.x;
        this.lastPromptPlayerY = this.player.y;
      }
      this.interactPrompt.visible = true;
      if (this.input.isKeyDown('KeyE') && !this.wasEKeyDown) {
        this.wasEKeyDown = true;
        this.openStash();
      }
    }

    // Hide interact prompt if not near any NPC
    if (!nearVendor && !nearStash && this.interactPrompt && !this.vendorOpen && !this.stashOpen) {
      this.interactPrompt.visible = false;
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
          if (!enemy.alive || p.hitTargets.has(enemy)) continue;
          if (rectsOverlap(p.getBounds(), enemy.getBounds())) {
            let dmg = p.damage;

            // Executioner: +50% damage to enemies below 50% HP (Snipe)
            if (this.player?.hasSubKeystone('sn_3') && p.skillId === 'snipe' && enemy.health < enemy.maxHealth * 0.5) {
              dmg = Math.round(dmg * 1.5);
            }

            // Marked for Death: set mark timer on Snipe hit
            if (this.player?.hasSubKeystone('sn_12') && p.skillId === 'snipe') {
              enemy.markedTimer = 240;
            }

            const killed = enemy.takeDamage(dmg);
            this.combatText.showDamage(enemy.x, enemy.y - 20, dmg, 0xffaa00);
            if (!p.hostile) this.vfxArrowImpact(enemy.x, enemy.y);
            p.hitTargets.add(enemy);

            // Split Shot: on kill by Snipe, spawn 3 projectiles
            if (killed && this.player?.hasSubKeystone('sn_9') && p.skillId === 'snipe') {
              for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const proj = new Projectile(enemy.x, enemy.y, angle, 8, Math.round(dmg * 0.3), false);
                proj.lifetime = 40;
                proj.skillId = 'split_shot';
                this.projectiles.push(proj);
                this.gameContainer!.addChild(proj.sprite);
              }
            }

            // Static Arrow chain lightning
            if (this.player?.hasSubKeystone('qs_9') && !p.hostile && !p.chained) {
              p.chained = true;
              const chainTargets = this.enemies
                .filter(o => o !== enemy && o.alive && Math.hypot(o.x - enemy.x, o.y - enemy.y) < 200)
                .slice(0, 2);
              for (const ct of chainTargets) {
                ct.takeDamage(Math.round(dmg * 0.5));
                this.combatText.showDamage(ct.x, ct.y - 20, Math.round(dmg * 0.5), 0x88ccff);
                this.addVfx((g, t) => {
                  g.clear();
                  g.lineStyle(1 + t * 2, 0x88ccff, Math.max(0, 0.6 - t * 0.5));
                  g.moveTo(enemy.x, enemy.y);
                  g.lineTo(ct.x, ct.y);
                }, 15);
              }
            }

            // Poison Nova: create poison cloud on multi_shot hit
            if (this.player?.hasSubKeystone('ms_6') && p.skillId === 'multi_shot') {
              this.rainZones.push({
                x: enemy.x, y: enemy.y,
                radius: 80,
                life: 180, maxLife: 180,
                damageTimer: 0,
                isPoison: true,
              });
            }

            // Point Blank: consecutive hits tracking
            if (this.player?.hasSubKeystone('ms_9') && !p.hostile) {
              if (!p.consecutiveHits) p.consecutiveHits = new Map();
              const hits = (p.consecutiveHits.get(enemy) || 0) + 1;
              p.consecutiveHits.set(enemy, hits);
              if (hits > 1) {
                const bonus = 1 + (hits - 1) * 0.2;
                enemy.takeDamage(Math.round(dmg * (bonus - 1)));
              }
            }

            // Ricochet bounce
            const canBounce = p.bounceCount > 0 && p.bounceRange > 0 && !p.hostile;
            let bounced = false;
            if (canBounce) {
              let nearest: Enemy | null = null;
              let nearestDist = p.bounceRange;
              for (const other of this.enemies) {
                if (!other.alive || p.hitTargets.has(other)) continue;
                const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
                if (d < nearestDist) { nearestDist = d; nearest = other; }
              }
              if (nearest) {
                p.bounceCount--;
                const ba = Math.atan2(nearest.y - p.y, nearest.x - p.x);
                p.vx = Math.cos(ba) * Math.hypot(p.vx, p.vy);
                p.vy = Math.sin(ba) * Math.hypot(p.vx, p.vy);
                bounced = true;
                Logger.log('combat', `[Ricochet] bounced to target, count remaining: ${p.bounceCount}`);
              } else {
                Logger.log('combat', `[Ricochet] no valid bounce target found (${this.enemies.length} enemies)`);
              }
            }

            if (!bounced && !p.pierce) {
              hit = true;
              break;
            }
          }
        }
        // Check boss hit
        if (!p.hostile && this.boss?.alive && !p.hitTargets.has(this.boss)) {
          if (rectsOverlap(p.getBounds(), this.boss.getBounds())) {
            let bossDmg = p.damage;
            if (this.player?.hasSubKeystone('sn_3') && p.skillId === 'snipe' && this.boss.health < this.boss.maxHealth * 0.5) {
              bossDmg = Math.round(bossDmg * 1.5);
            }
            this.boss.takeDamage(bossDmg);
            this.combatText.showDamage(this.boss.x, this.boss.y - 20, bossDmg, 0xffaa00);
            p.hitTargets.add(this.boss);
            if (!p.pierce) {
              hit = true;
            }
          }
        }
        // Check breakables hit by projectile
        for (const brk of this.breakables) {
          if (!brk.alive || p.hitTargets.has(brk)) continue;
          if (rectsOverlap(p.getBounds(), brk.getBounds())) {
            if (brk.takeDamage()) {
              this.spawnBreakableLoot(brk.x, brk.y);
            }
            if (!p.hostile) this.vfxArrowImpact(brk.x, brk.y);
            p.hitTargets.add(brk);
            if (!p.pierce) { hit = true; break; }
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

    // Boss attack damage (from executeAttack, not telegraph)
    if (this.boss?.alive && this.boss.pendingAttackDamage) {
      const t = this.boss.pendingAttackDamage;
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
        this.player.takeDamage(t.damageAmt);
        this.combatText.showDamage(this.player.x, this.player.y - 20, t.damageAmt, 0xff6666);
        // Cthulhu: on grasp hit, set pending pull
        if (this.boss?.bossId === 'cthulhu' && t.type === 'line') {
          this.boss.pendingPull = {
            distance: 180,
            angle: Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x),
          };
        }
      }

      // Boss attack VFX
      if (t.type === 'cone') {
        if (this.boss.bossId === 'reaper') {
          this.vfxGroundSlam(t.x, t.y, t.angle || 0);
          this.addVfx((g, t2) => {
            const alpha = Math.max(0, 1 - t2 * 1.5);
            g.lineStyle(3, 0xaa44cc, alpha);
            g.drawCircle(0, 0, 120 * t2);
          }, 20).position.set(t.x, t.y);
        } else {
          this.vfxGroundSlam(t.x, t.y, t.angle || 0);
        }
      } else if (t.type === 'circle') {
        this.vfxRing(t.x, t.y, 0xff6622, (t.radius || 80) * 1.5);
        this.vfxImpact(t.x, t.y);
        if (this.boss.bossId === 'reaper') {
          this.addVfx((g, t2) => {
            const r = 60 * t2;
            const alpha = Math.max(0, 1 - t2);
            g.lineStyle(4, 0x6622aa, alpha * 0.6);
            g.drawCircle(0, 0, r);
            g.lineStyle(2, 0x8844cc, alpha * 0.3);
            g.drawCircle(0, 0, r * 0.6);
          }, 25).position.set(t.x, t.y);
        }
      }

      this.boss.pendingAttackDamage = null;
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
        if (isJewelDrop(drop) && Math.hypot(mouseWX - drop.x, mouseWY - drop.y) < 30) {
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

    // Right click: capture soul drop (summoner only)
    if (this.player?.classType === 'summoner' && this.input.consumeRightClick()) {
      for (let i = this.soulDrops.length - 1; i >= 0; i--) {
        const drop = this.soulDrops[i];
        const d = Math.sqrt((drop.x - mouseWX) ** 2 + (drop.y - mouseWY) ** 2);
        if (d < 40) {
          if (this.soulVault.length >= 8) {
            Logger.log('ui', 'Soul vault is full!');
          } else {
            this.captureSoul(drop.enemyType, drop.label);
            this.gameContainer!.removeChild(drop.container);
            this.soulDrops.splice(i, 1);
            break;
          }
        }
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

        // Volatile explosion
        if (dead.volatileActive) {
          const volatileDmg = Math.round(dead.maxHealth * 0.5);
          for (const other of this.enemies) {
            if (!other.alive) continue;
            if (Math.hypot(other.x - dead.x, other.y - dead.y) < 120) {
              other.takeDamage(volatileDmg);
              if (other.alive) {
                this.combatText.showDamage(other.x, other.y - 20, volatileDmg, 0xff3333);
              }
            }
          }
          this.addVfx((g, t) => {
            const r = 120 * t;
            const alpha = Math.max(0, 1 - t);
            g.lineStyle(3, 0xff3333, alpha);
            g.drawCircle(0, 0, r);
            g.beginFill(0xff3333, alpha * 0.2);
            g.drawCircle(0, 0, r);
            g.endFill();
          }, 25).position.set(dead.x, dead.y);
        }

        this.gameContainer!.removeChild(dead.sprite);
        if (dead.nameplate) {
          this.gameContainer!.removeChild(dead.nameplate);
        }
        const healAmt = this.player.skills.healOnKill();
        if (healAmt > 0) this.player.heal(healAmt);
        if (this.player.addXp(dead.xpReward)) {
          this.combatText.showDamage(dead.x, dead.y - 30, this.player.level - 1, 0x44ff88);
          Logger.log('combat', `Player reached level ${this.player.level}`);
        }
        const rarityLootMult = dead.rarity === 'rare' ? 3 : dead.rarity === 'magic' ? 2 : 1;
        this.spawnLoot(dead.x, dead.y, rarityLootMult);

        // Soul drop for spectre capture (summoner only)
        if (this.player?.classType === 'summoner') {
          const soulDropChance = 0.04 * (1 + (this.player.computedStats.magicFindPct || 0) / 100);
          if (Math.random() < soulDropChance) {
            const soulLabel = new Text(`Soul of ${this.getEnemyDisplayName(dead.type)}`, new TextStyle({
              fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#66ccff',
              stroke: '#000', strokeThickness: 2,
            }));
            soulLabel.anchor.set(0.5);
            const soulContainer = new Container();
            soulContainer.addChild(soulLabel);
            soulContainer.x = dead.x;
            soulContainer.y = dead.y;
            this.gameContainer!.addChild(soulContainer);
            this.soulDrops.push({
              x: dead.x, y: dead.y,
              enemyType: dead.type,
              label: `Soul of ${this.getEnemyDisplayName(dead.type)}`,
              container: soulContainer,
            });
          }
        }

        dead.destroy();
        this.recentCorpses.push({
          x: dead.x, y: dead.y,
          maxHp: dead.maxHealth,
          deathFrame: this.frameCount,
        });
        this.recentCorpses = this.recentCorpses.filter(c => this.frameCount - c.deathFrame < 300).slice(-8);
      }
    }

    // Boss death
    if (this.boss && !this.boss.alive && this.bossSpawned) {
      this.bossSpawned = false;

      this.zoneManager.markZoneCompleted(this.zoneManager.state!.zoneId);

      this.spawnLoot(this.boss.x, this.boss.y);
      this.spawnLoot(this.boss.x - 40, this.boss.y);
      this.spawnLoot(this.boss.x + 40, this.boss.y);

      // Unlock jackpot chest for crypt boss
      if (this.boss.bossId === 'cthulhu' && this.jackpotChest) {
        this.jackpotChest.unlock();
      }

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

    // Hidden Crypt wave system (manual wave management)
    if (zone?.id === 'secret_crypt' && this.cryptWaveActive) {
      if (this.enemies.length === 0 && !this.boss && !this.bossSpawned) {
        this.cryptWaveCount++;
        if (this.cryptWaveCount >= 3) {
          this.cryptWaveActive = false;
          this.spawnBoss('cthulhu');
        } else {
          const count = 3 + this.cryptWaveCount;
          const hpMult = 2.0 + this.cryptWaveCount * 0.1;
          const template = this.zoneManager.state?.currentTemplate;
          if (!template) return;
          for (let i = 0; i < count; i++) {
            const spawnZone = template.spawnZones[Math.floor(Math.random() * template.spawnZones.length)];
            const x = spawnZone.x + Math.random() * spawnZone.width;
            const y = spawnZone.y + Math.random() * spawnZone.height;
            const type = Math.random() < 0.4 ? 'juggernaut' : 'grunt';
            const e = new Enemy(x, y, type as any);
            e.health = Math.round(e.health * hpMult);
            e.maxHealth = e.health;
            e.damage = Math.round(e.damage * 1.1);
            e.alwaysAggro = true;
            e.applyRarity('normal', []);
            this.enemies.push(e);
            this.gameContainer!.addChild(e.sprite);
            if (e.nameplate) this.gameContainer!.addChild(e.nameplate);
          }
          Logger.log('system', `Crypt wave ${this.cryptWaveCount} spawned (${count} enemies, ${hpMult}x HP)`);
        }
      }
    }

    // Door overlap check
    for (const door of this.room?.doors ?? []) {
      // Tutorial hub exit is locked until tutorial is complete
      if (zone?.id === 'tutorial' && this.tutorialStage !== 'complete' && door.targetZone === 'hub') {
        Logger.log('system', `Tutorial door locked (stage=${this.tutorialStage})`);
        continue;
      }

      Logger.log('system', `Door check: zone=${zone?.id} stage=${this.tutorialStage} player=(${Math.round(this.player?.x ?? 0)},${Math.round(this.player?.y ?? 0)}) door=(${door.rect.x},${door.rect.y},${door.rect.width},${door.rect.height})`);

      if (this.player && rectsOverlap(this.player.getBounds(), door.rect)) {
        Logger.log('system', 'Door collision detected!');
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
    this.hud?.update(this.player, dt);
    /* PERF: only set zone name when it changes */
    const zoneName = this.zoneManager.state?.config?.name ?? '';
    if (zoneName !== this.lastZoneName) {
      this.lastZoneName = zoneName;
      this.hud?.setZoneName(zoneName);
    }
    this.skillBar?.update(this.player.skills);
    if (!this.player.alive) this.showDeathScreen();
  }

  private getEnemyDisplayName(type: string): string {
    const names: Record<string, string> = {
      grunt: 'Grunt', archer: 'Archer', juggernaut: 'Juggernaut', cultist: 'Cultist',
    };
    return names[type] || type;
  }

  private getEnemyBaseConfig(type: string): { hp: number; damage: number; speed: number } {
    const configs: Record<string, { hp: number; damage: number; speed: number }> = {
      grunt: { hp: 40, damage: 8, speed: 2.2 },
      archer: { hp: 25, damage: 6, speed: 2.5 },
      juggernaut: { hp: 120, damage: 16, speed: 1.2 },
      cultist: { hp: 35, damage: 5, speed: 2.0 },
    };
    return configs[type] || { hp: 40, damage: 8, speed: 2.2 };
  }

  private captureSoul(enemyType: string, name: string): void {
    const cfg = this.getEnemyBaseConfig(enemyType);
    this.soulVault.push({
      enemyType,
      name: name.replace('Soul of ', ''),
      baseHp: cfg.hp,
      baseDamage: cfg.damage,
      baseSpeed: cfg.speed,
      captureLevel: this.player!.level,
    });
    // Capture VFX — expanding cyan ring at player
    this.addVfx((g, t) => {
      g.clear();
      g.beginFill(0x66ccff, 0.5 * (1 - t));
      g.drawCircle(this.player!.x, this.player!.y, 60 * t);
      g.endFill();
    }, 20).position.set(0, 0);
  }

  private summonSpectre(soul: CapturedSoul): void {
    if (this.activeSpectreMinion) this.despawnSpectre();

    const levelScale = 1 + (this.player!.level - soul.captureLevel) * 0.05;
    const minionDmgMult = 1 + (this.player!.computedStats.minionDmgPct || 0) / 100;
    const minionHpMult = 1 + (this.player!.computedStats.minionHpPct || 0) / 100;
    const hp = Math.round(soul.baseHp * levelScale * Math.max(1, minionHpMult));
    const dmg = Math.round(soul.baseDamage * levelScale * Math.max(1, minionDmgMult));
    const spd = soul.baseSpeed;

    this.activeSpectre = soul;
    this.activeSpectreMinion = new Minion(
      this.player!.x, this.player!.y - 30,
      'spectre', hp, dmg, spd,
    );
    this.activeSpectreMinion.sourceEnemyType = soul.enemyType;
    this.minions.push(this.activeSpectreMinion);
    this.gameContainer!.addChild(this.activeSpectreMinion.sprite);
  }

  private despawnSpectre(): void {
    if (this.activeSpectreMinion) {
      this.activeSpectreMinion.health = 0;
      this.activeSpectreMinion.alive = false;
      this.activeSpectreMinion = null;
      this.activeSpectre = null;
    }
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
      const alpha = Math.max(0, 0.6 - t * 1.2);
      g.lineStyle(2, 0xffee44, alpha);
      g.moveTo(0, 0);
      g.lineTo(-p.vx * 0.6, -p.vy * 0.6);
    }, 20).position.set(p.x, p.y);
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 0.3 - t * 0.8);
      g.lineStyle(1, 0xffffff, alpha);
      g.moveTo(0, 0);
      g.lineTo(-p.vx * 0.5, -p.vy * 0.5);
    }, 20).position.set(p.x, p.y);
  }

  private vfxArrowImpact(x: number, y: number) {
    this.addVfx((g, t) => {
      const r = 15 + 25 * t;
      const alpha = Math.max(0, 1 - t * 1.5);
      g.lineStyle(2, 0xffcc00, alpha);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.beginFill(0xffffaa, alpha * 0.4);
      g.drawCircle(0, 0, 6);
      g.endFill();
    }, 15).position.set(x, y);
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
      if (idx === 0) {
        if (this.player?.classType === 'monk') {
          this.useMainAbility();
        }
        continue;
      }
      this.useSupportSkill(idx, mouseWX, mouseWY);
    }
    this.lastKeys = now;
  }

  private useMainAbility() {
    if (!this.player?.alive) return;

    let mouseWX = this.input.mouseX;
    let mouseWY = this.input.mouseY;
    if (this.gameContainer) {
      const local = this.gameContainer.toLocal(new Point(this.input.mouseX, this.input.mouseY));
      mouseWX = local.x;
      mouseWY = local.y;
    }

    // Monk meditate channel
    if (this.player.classType === 'monk' && this.player.skills.mainAbility?.id === 'meditate') {
      const result = this.player.skills.consume(0, this.player.mana);
      if (!result) return;
      this.player.mana -= result.manaCost;
      this.player.startChannel('meditate', 60);
      const sprite = this.player.sprite as AnimatedSprite;
      playMonkAnimation(sprite, 'meditate', false);
      return;
    }

    const skill = this.player.skills.mainAbility;
    const angle = this.player.facingAngle;

    // Channel skills
    if (skill?.effectType === 'channel') {
      this.player.startChannel(skill.id, skill.duration || 120);
      const result = this.player.skills.consume(0, this.player.mana);
      if (result) {
        this.player.mana -= result.manaCost;
        this.player.triggerAttackAnimation(skill.id);
      }
      return;
    }

    // Corpse Explosion
    if (skill?.id === 'corpse_explosion') {
      let nearestCorpse: { x: number; y: number; maxHp: number; deathFrame: number } | null = null;
      let nearestDist = skill.range || 200;
      for (const c of this.recentCorpses) {
        const d = Math.sqrt((c.x - mouseWX) ** 2 + (c.y - mouseWY) ** 2);
        if (d < nearestDist) { nearestDist = d; nearestCorpse = c; }
      }
      if (nearestCorpse) {
        const result = this.player.skills.consume(0, this.player.mana);
        if (!result) return;
        this.player.mana -= result.manaCost;
        const explodeDmg = Math.round(nearestCorpse.maxHp * (skill.damageMult || 0.15));
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const d = Math.sqrt((e.x - nearestCorpse.x) ** 2 + (e.y - nearestCorpse.y) ** 2);
          if (d < 120) e.takeDamage(explodeDmg);
        }
        this.addVfx((g, t) => {
          g.clear();
          g.beginFill(0x8844cc, 0.4 * (1 - t));
          g.drawCircle(nearestCorpse!.x, nearestCorpse!.y, 120 * t);
          g.endFill();
        }, 20).position.set(0, 0);
        const idx = this.recentCorpses.indexOf(nearestCorpse);
        if (idx >= 0) this.recentCorpses.splice(idx, 1);
      }
      return;
    }

    const isProjectileType = skill?.effectType === 'projectile' || skill?.effectType === 'projectile_spread' || skill?.effectType === 'projectile_pierce';
    const isAoeTarget = skill?.effectType === 'aoe_target';

    if (isProjectileType || isAoeTarget) {
      const result = this.player.skills.consume(0, this.player.mana);
      if (!result) return;
      this.player.mana -= result.manaCost;

      this.player.triggerAttackAnimation(result.id);

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
        // Rain of Arrows — persistent AoE zone
        let mouseWX = this.input.mouseX;
        let mouseWY = this.input.mouseY;
        if (this.gameContainer) {
          const local = this.gameContainer.toLocal(new Point(this.input.mouseX, this.input.mouseY));
          mouseWX = local.x;
          mouseWY = local.y;
        }

        let rzRadius = 120;
        let rzLife = 120;
        if (this.player?.hasSubKeystone('ra_9')) {
          rzRadius = 60;
          rzLife = 360;
        }
        const rainZone: RainZone = {
          x: mouseWX, y: mouseWY,
          radius: rzRadius,
          life: rzLife,
          maxLife: rzLife,
          damageTimer: 0,
        };
        this.rainZones = [];
        this.rainZones.push(rainZone);
        this.vfxRing(rainZone.x, rainZone.y, 0x44ff44, rainZone.radius);
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

      // Check breakables hit by melee attack
      for (const brk of this.breakables) {
        if (!brk.alive) continue;
        if (Math.hypot(this.player.x - brk.x, this.player.y - brk.y) < 80) {
          if (brk.takeDamage()) {
            this.spawnBreakableLoot(brk.x, brk.y);
          }
        }
      }
    }
  }

  private useSupportSkill(slot: number, mouseWX: number, mouseWY: number) {
    if (!this.player?.alive) return;
    const skill = this.player.skills.getSkill(slot);
    if (!skill) return;
    const result = this.player.skills.consume(slot, this.player.mana);
    if (!result) return;

    // Monk stance toggle
    if (this.player.classType === 'monk' && result.id === 'stance_toggle') {
      const newStance = this.player.skills.cycleStance();
      const vfxColors: Record<string, number> = {
        tiger: 0xff8844,
        tortoise: 0x4488ff,
        crane: 0x44ff88,
      };
      this.addVfx((g, t) => {
        const r = 50 * t;
        const alpha = Math.max(0, 1 - t * 1.5);
        g.lineStyle(3, vfxColors[newStance], alpha);
        g.drawCircle(0, 0, r);
        g.lineStyle(1, vfxColors[newStance], alpha * 0.5);
        g.drawCircle(0, 0, r * 0.6);
      }, 20).position.set(this.player.x, this.player.y);
      return;
    }

    // Monk combat techniques
    if (this.player.classType === 'monk' && (result.effectType === 'single' || result.effectType === 'cone')) {
      this.player.mana -= result.manaCost;
      this.player.executeTechnique(result, this.enemies);
      return;
    }

    // Monk meditate channel
    if (this.player.classType === 'monk' && result.id === 'meditate') {
      this.player.startChannel('meditate', 60);
      const sprite = this.player.sprite as AnimatedSprite;
      playMonkAnimation(sprite, 'meditate', false);
      return;
    }

    const isProjectileType = result.effectType === 'projectile' || result.effectType === 'projectile_spread';

    if (isProjectileType) {
      this.player.mana -= result.manaCost;
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
          if (this.player.classType === 'ranger') {
            this.player.triggerRollAnimation();
            playRangerRollAnimation(this.player.sprite as AnimatedSprite);
          }
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
      case 'summon': {
        if (result.id === 'raise_skeleton') {
          const skeletonCount = this.minions.filter(m => m.type === 'skeleton_warrior' && m.alive).length;
          if (skeletonCount >= 3) {
            for (const m of this.minions) {
              if (m.type === 'skeleton_warrior' && m.alive) {
                m.health = Math.min(m.maxHealth, m.health + 30);
              }
            }
          } else {
            const m = new Minion(
              this.player.x + (Math.random() - 0.5) * 40,
              this.player.y + (Math.random() - 0.5) * 40,
              'skeleton_warrior', 60, 8, this.player.speed * 0.8,
            );
            this.minions.push(m);
            this.gameContainer!.addChild(m.sprite);
          }
        } else if (result.id === 'summon_mage') {
          const mageCount = this.minions.filter(m => m.type === 'skeleton_mage' && m.alive).length;
          if (mageCount < 2) {
            const m = new Minion(
              this.player.x + (Math.random() - 0.5) * 50,
              this.player.y + (Math.random() - 0.5) * 50,
              'skeleton_mage', 40, 10, this.player.speed * 0.7, 900,
            );
            this.minions.push(m);
            this.gameContainer!.addChild(m.sprite);
          }
        } else if (result.id === 'spectre_summon') {
          // Handle spectre summoning — will be wired in Task 7
        }
        break;
      }
      case 'aoe_target': {
        if (result.id === 'flesh_offering') {
          let nearestCorpse: { x: number; y: number; maxHp: number; deathFrame: number } | null = null;
          let nearestDist = 200;
          for (const c of this.recentCorpses) {
            const d = Math.sqrt((c.x - this.player.x) ** 2 + (c.y - this.player.y) ** 2);
            if (d < nearestDist) { nearestDist = d; nearestCorpse = c; }
          }
          if (nearestCorpse) {
            this.player.skills.addBuff('flesh_offering');
            const idx = this.recentCorpses.indexOf(nearestCorpse);
            if (idx >= 0) this.recentCorpses.splice(idx, 1);
          }
          return;
        }
        break;
      }
    }
  }

  private findNearestEnemy(x: number, y: number): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = 600;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2);
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }
    return nearest;
  }

  private spawnLoot(x: number, y: number, rarityMult: number = 1) {
    const pending: { drop: ItemDrop }[] = [];
    const iq = (1 + ((this.player?.computedStats.itemQuantityPct || 0) / 100)) * rarityMult;
    const mf = this.player?.computedStats.magicFindPct || 0;

    for (const drop of createRandomLoot(x, y, iq)) {
      pending.push({ drop });
    }
    if (Math.random() < 0.15) {
      const jewel = generateJewel(this.player?.level);
      pending.push({ drop: createJewelDrop(x, y, jewel) });
    } else if (Math.random() < 0.4 * iq) {
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

  private spawnUrnLoot(x: number, y: number, urn: CursedUrn) {
    const rarityMult = urn.rarity === 'rare' ? 3 : urn.rarity === 'magic' ? 2 : 1;
    const iq = 1 + ((this.player?.computedStats.itemQuantityPct || 0) / 100) * rarityMult;
    const mf = this.player?.computedStats.magicFindPct || 0;
    const pending: ItemDrop[] = [];

    switch (urn.type.id) {
      case 'reliquary': {
        // Weapons & Armour — equip items
        for (let i = 0; i < 1 + rarityMult; i++) {
          if (Math.random() < 0.6 * iq) {
            const gen = generateItemDrop(this.player?.level, mf);
            pending.push(createItemDrop(x, y, gen));
          }
        }
        break;
      }
      case 'miser': {
        // Currency & Crafting — gold + orbs
        for (const drop of createRandomLoot(x, y, 3 * iq * rarityMult)) {
          pending.push(drop);
        }
        for (let i = 0; i < rarityMult; i++) {
          if (Math.random() < 0.5) {
            const orb = generateOrbDrop();
            pending.push(createOrbDrop(x, y, orb.orbId, orb.name));
          }
        }
        break;
      }
      case 'adornments': {
        // Rings, Amulets & Jewellery
        const slotPool = ['ring', 'ring2', 'amulet'];
        for (let i = 0; i < 1 + rarityMult; i++) {
          if (Math.random() < 0.5) {
            const gen = generateItemDrop(this.player?.level, mf);
            gen.base = ITEM_BASES.find(b => b.id === slotPool[Math.floor(Math.random() * slotPool.length)])!;
            pending.push(createItemDrop(x, y, gen));
          }
        }
        if (Math.random() < 0.3) {
          const jewel = generateJewel(this.player?.level);
          pending.push(createJewelDrop(x, y, jewel));
        }
        break;
      }
      case 'alchemist': {
        // Flasks & Consumables — potions + scrolls
        for (const drop of createRandomLoot(x, y, 5 * iq * rarityMult)) {
          pending.push(drop);
        }
        break;
      }
      case 'forgotten': {
        // Mixed Rare Items — high chance of equipment
        for (let i = 0; i < 2 + rarityMult; i++) {
          if (Math.random() < 0.7) {
            const gen = generateItemDrop(this.player?.level, mf);
            gen.rarity = 'rare';
            pending.push(createItemDrop(x, y, gen));
          }
        }
        break;
      }
    }

    // Spread drops vertically
    const spacing = 25;
    if (pending.length > 0) {
      const startY = y - ((pending.length - 1) * spacing) / 2;
      for (let i = 0; i < pending.length; i++) {
        pending[i].y = startY + i * spacing;
        pending[i].container.y = pending[i].y;
        this.itemDrops.push(pending[i]);
        this.gameContainer!.addChild(pending[i].container);
      }
    }
  }

  private spawnUrnEnemies(urn: CursedUrn) {
    const zone = this.zoneManager.state?.config;
    if (!zone) return;

    const pool = zone.enemyPool;
    if (pool.length === 0) return;

    const rarity = urn.rarity;
    let minCount: number, maxCount: number;
    if (rarity === 'rare') { minCount = 9; maxCount = 10; }
    else if (rarity === 'magic') { minCount = 7; maxCount = 8; }
    else { minCount = 6; maxCount = 7; }

    const totalCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    const hpMult = this.zoneManager.getHpMult(zone);
    const dmgMult = this.zoneManager.getDmgMult(zone);

    const group: UrnSpawnGroup = {
      urnId: urn.id,
      totalSpawned: totalCount,
      totalKilled: 0,
      lootDropped: false,
      urnX: urn.x,
      urnY: urn.y,
    };
    this.urnSpawnGroups.set(urn.id, group);

    const innerRadius = 80;
    const outerRadius = 200;
    const angleStep = (Math.PI * 2) / totalCount;

    for (let i = 0; i < totalCount; i++) {
      let type: EnemyType;
      if (rarity === 'normal') {
        type = pool[Math.floor(Math.random() * pool.length)];
      } else if (rarity === 'magic' && i >= totalCount - 2) {
        type = pool[Math.floor(Math.random() * pool.length)];
      } else if (rarity === 'rare' && i === 0) {
        type = pool[Math.floor(Math.random() * pool.length)];
      } else {
        type = pool[Math.floor(Math.random() * pool.length)];
      }

      const baseAngle = angleStep * i + (Math.random() - 0.5) * 0.3;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      let ex = urn.x + Math.cos(baseAngle) * radius;
      let ey = urn.y + Math.sin(baseAngle) * radius;

      const enemyRect = { x: ex - 20, y: ey - 20, width: 40, height: 40 };

      if (this.room?.walls) {
        let wallBlocked = false;
        for (const wall of this.room.walls) {
          if (rectsOverlap(enemyRect, wall)) { wallBlocked = true; break; }
        }
        if (wallBlocked) {
          let found = false;
          for (let r = radius + 20; r <= outerRadius + 80; r += 20) {
            ex = urn.x + Math.cos(baseAngle) * r;
            ey = urn.y + Math.sin(baseAngle) * r;
            enemyRect.x = ex - 20;
            enemyRect.y = ey - 20;
            let clear = true;
            for (const wall of this.room.walls) {
              if (rectsOverlap(enemyRect, wall)) { clear = false; break; }
            }
            if (clear) { found = true; break; }
          }
          if (!found) continue;
        }
      }

      if (this.player) {
        const playerDist = Math.hypot(this.player.x - ex, this.player.y - ey);
        if (playerDist < 60) {
          let found = false;
          for (let r = Math.max(innerRadius, playerDist + 80); r <= outerRadius + 80; r += 20) {
            const nx = urn.x + Math.cos(baseAngle) * r;
            const ny = urn.y + Math.sin(baseAngle) * r;
            const nd = Math.hypot(this.player.x - nx, this.player.y - ny);
            if (nd >= 60) { ex = nx; ey = ny; found = true; break; }
          }
          if (!found) continue;
        }
      }

      ex = Math.max(64, Math.min(ROOM_WIDTH - 64, ex));
      ey = Math.max(64, Math.min(ROOM_HEIGHT - 64, ey));

      const enemy = new Enemy(ex, ey, type);
      enemy.maxHealth = Math.round(enemy.maxHealth * hpMult);
      enemy.health = enemy.maxHealth;
      enemy.damage = Math.round(enemy.damage * dmgMult);
      enemy.spawnSource = 'cursed_urn';
      enemy.urnId = urn.id;
      enemy.dropsLoot = false;
      enemy.xpMultiplier = 0.5;
      enemy.alwaysAggro = true;
      enemy.spawnAnimTimer = 0.2;
      enemy.sprite.scale.set(0);

      if (rarity === 'magic' && i >= totalCount - 2) {
        enemy.applyRarity('magic', getRandomMods(2));
      } else if (rarity === 'rare' && i === 0) {
        enemy.applyRarity('rare', getRandomMods(3));
      }

      this.urnSpawnQueue.push({ enemy, urnId: urn.id });
    }
  }

  private vfxUrnOpen(x: number, y: number, color: number) {
    // Dark energy burst
    this.addVfx((g, t) => {
      const r = 20 + 60 * t;
      const alpha = Math.max(0, 1 - t * 1.2);
      g.beginFill(color, alpha * 0.3);
      g.drawCircle(0, 0, r);
      g.endFill();
      g.lineStyle(3, 0x000000, alpha * 0.5);
      g.drawCircle(0, 0, r);
      // Rising particles
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 3;
        const pr = 10 + 15 * t;
        g.beginFill(color, alpha * 0.4);
        g.drawCircle(Math.cos(a) * pr, Math.sin(a) * pr - 30 * t, 4 * (1 - t));
        g.endFill();
      }
    }, 20).position.set(x, y);

    // Rarity-colored ring expansion
    const rarityColors: Record<string, number> = { normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00 };
    const ringColor = rarityColors[(this?.urns?.find(u => u.x === x && u.y === y)?.rarity) || 'normal'] || 0xffffff;
    this.vfxRing(x, y, ringColor, 80);
  }

  private applyUrnCurrency(urn: CursedUrn, orbId: string) {
    if (urn.isOpen || !this.player) return;

    const rarityColors: Record<string, number> = { normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00 };
    let success = false;
    let newRarity: UrnRarity = urn.rarity;
    let newCurses: CurseDef[] | null = null;

    switch (orbId) {
      case 'mutation': {
        if (urn.rarity === 'normal') {
          newRarity = 'magic';
          const extra = rollCurses(1, 1, 2);
          newCurses = [...urn.curses, ...extra];
          success = true;
        }
        break;
      }
      case 'ascendance': {
        if (urn.rarity === 'normal') {
          newRarity = 'rare';
          const extra = rollCurses(3 + Math.floor(Math.random() * 2), 1, 3, true);
          newCurses = extra;
          success = true;
        }
        break;
      }
      case 'growth': {
        if (urn.rarity === 'magic') {
          newCurses = rollCurses(2, 1, 3);
          success = true;
        }
        break;
      }
      case 'empowerment': {
        if (urn.rarity === 'magic') {
          newRarity = 'rare';
          const extra = rollCurses(1, 1, 3);
          newCurses = [...urn.curses, ...extra];
          success = true;
        }
        break;
      }
    }

    if (!success) return;

    // Consume the orb from inventory
    const orbIdx = this.player.inventory.findIndex(
      s => s !== null && s.kind === 'orb' && s.orbId === orbId
    );
    if (orbIdx < 0) return;
    const orbSlot = this.player.inventory[orbIdx] as any;
    orbSlot.count--;
    if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;

    // Apply the upgrade to the urn
    urn.rarity = newRarity;
    if (newCurses) urn.curses = newCurses;
    if (newRarity === 'rare') {
      const prefixes = ['Virulent', 'Wretched', 'Cursed', 'Blighted', 'Sanguine', 'Foul', 'Unholy', 'Dark', 'Twisted', 'Corrupted'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      urn.rareName = `${prefix} ${urn.type.name}`;
    }
    // Rebuild visuals to reflect new rarity
    urn['buildVisuals']();

    this.activeUrnOrb = null;
    Logger.log('combat', `Urn upgraded with ${orbId}: ${urn.type.name} (${newRarity})`);

    // Flash effect
    const flashColor = rarityColors[newRarity] || 0xffffff;
    this.addVfx((g, t) => {
      const alpha = Math.max(0, 1 - t * 3);
      g.beginFill(flashColor, alpha * 0.4);
      g.drawCircle(0, 0, 40);
      g.endFill();
    }, 10).position.set(urn.x, urn.y);
  }

  private tryPickupItems() {
    if (!this.player) return;
    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      if (drop.pickedUp) continue;
      if (isEquippableDrop(drop)) continue;
      if (isJewelDrop(drop)) continue;
      if (Math.hypot(drop.x - this.player.x, drop.y - this.player.y) < 50) {
        const item = drop.pickup();
        switch (item.type) {
          case 'gold':
            this.player!.gold += item.value;
            this.combatText.showDamage(drop.x, drop.y - 10, `+${item.value}`, 0xffd700);
            break;
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
      this.passiveTreeScreen.onRefundCallback((id) => {
        if (this.player) {
          const refunded = this.player.passiveTree.refund(id);
          this.player.passivePoints += refunded;
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

  private toggleSubTree() {
    if (!this.player) return;
    if (this.subTreeScreen) {
      this.app.stage.removeChild(this.subTreeScreen.container);
      this.subTreeScreen.destroy();
      this.subTreeScreen = undefined;
      this.app.ticker.started = true;
      return;
    }
    const skill = this.player.skills.mainAbility;
    if (!skill?.subTreeId) return;
    const tree = this.player.skillSubTrees.get(skill.subTreeId);
    if (!tree) return;

    this.subTreeScreen = new SkillSubTreeScreen(
      SCREEN_WIDTH, SCREEN_HEIGHT,
      tree, this.player.skillSubPoints,
    );
    this.subTreeScreen.onAllocateCallback((id: string) => {
      if (this.player && tree.allocate(id)) {
        this.player.skillSubPoints--;
        this.subTreeScreen?.update(this.input, tree, this.player.skillSubPoints);
      }
    });
    this.subTreeScreen.onRefundCallback((id: string) => {
      if (this.player) {
        const refunded = tree.refund(id);
        this.player.skillSubPoints += refunded;
        this.subTreeScreen?.update(this.input, tree, this.player.skillSubPoints);
      }
    });
    this.app.stage.addChild(this.subTreeScreen.container);
    this.app.ticker.started = true;
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
          case 'warp_stone': success = this.player.warpItem(slot); break;
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
          this.inventoryScreen?.update(
            this.player.inventory, this.player.equipment,
            this.player.computedStats, this.input,
          );
          this.inventoryScreen?.forceRefreshTooltip();
        }
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
          case 'warp_stone': success = this.player.warpInventoryItem(gridIndex); break;
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
          this.inventoryScreen?.update(
            this.player.inventory, this.player.equipment,
            this.player.computedStats, this.input,
          );
          this.inventoryScreen?.forceRefreshTooltip();
        }
        return success;
      });
      this.inventoryScreen.onSocketJewelCallback((slot: Slot, gridIndex: number) => {
        if (!this.player) return;
        const jewelEntry = this.player.inventory[gridIndex];
        if (!jewelEntry || jewelEntry.kind !== 'equip' || jewelEntry.item.base.id !== 'jewel') return;
        const success = this.player.socketJewel(slot, jewelEntry.item, gridIndex);
        if (success) {
          this.inventoryScreen?.update(this.player.inventory, this.player.equipment, this.player.computedStats, this.input);
          this.inventoryScreen?.forceRefreshTooltip();
        }
      });
      this.inventoryScreen.onDrillOrbCallback((slot: Slot) => {
        if (!this.player) return;
        const success = this.player.drillSockets(slot);
        if (success) {
          const orbIdx = this.player.inventory.findIndex(
            s => s !== null && s.kind === 'orb' && s.orbId === 'drilling'
          );
          if (orbIdx >= 0) {
            const orbSlot = this.player.inventory[orbIdx] as any;
            orbSlot.count--;
            if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;
          }
          this.inventoryScreen?.update(this.player.inventory, this.player.equipment, this.player.computedStats, this.input);
          this.inventoryScreen?.forceRefreshTooltip();
        }
      });
      this.inventoryScreen.onUnsocketOrbCallback((orbId: string, slot: Slot, socketIndex: number) => {
        if (!this.player) return;
        const destroy = orbId === 'shattering';
        const success = this.player.unsocketJewel(slot, socketIndex, destroy);
        if (success) {
          const orbIdx = this.player.inventory.findIndex(
            s => s !== null && s.kind === 'orb' && s.orbId === orbId
          );
          if (orbIdx >= 0) {
            const orbSlot = this.player.inventory[orbIdx] as any;
            orbSlot.count--;
            if (orbSlot.count <= 0) this.player.inventory[orbIdx] = null;
          }
          this.inventoryScreen?.update(this.player.inventory, this.player.equipment, this.player.computedStats, this.input);
          this.inventoryScreen?.forceRefreshTooltip();
        }
      });
      this.inventoryScreen.onUrnOrbSelect = (orbId: string | null) => {
        this.activeUrnOrb = orbId;
      };
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

  private toggleCharacterScreen() {
    if (!this.player) return;
    this.characterScreenOpen = !this.characterScreenOpen;
    if (this.characterScreenOpen) {
      this.characterScreen = new CharacterScreen(SCREEN_WIDTH, SCREEN_HEIGHT, this.player);
      this.app.stage.addChild(this.characterScreen.container);
    } else {
      if (this.characterScreen) {
        this.app.stage.removeChild(this.characterScreen.container);
        this.characterScreen.destroy();
        this.characterScreen = undefined;
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
        const valid = ['empowerment', 'flux', 'mutation', 'growth', 'ascendance', 'purification', 'warp_stone'];
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

    c.registerCommand({
      name: 'boss', aliases: [],
      description: 'Teleport to boss room for a zone',
      usage: '<zoneId>',
      run: (args) => {
        if (!this.player) return 'No player';
        const zoneId = args[0];
        const config = ZoneManager.getZone(zoneId);
        if (!config) return `Unknown zone: ${zoneId}. Try: forest, desert, ice`;
        if (!config.bossId) return `${config.name} has no boss`;
        this.zoneManager.transitionTo(zoneId, config.roomCount - 1);
        this.buildCurrentZoneRoom();
        return `Teleported to ${config.name} boss room`;
      },
    });

    c.registerCommand({
      name: 'subpoints', aliases: ['sp'],
      description: 'Add sub skill points',
      usage: '<count>',
      run: (args) => {
        if (!this.player) return 'No player';
        const count = parseInt(args[0]) || 1;
        this.player.skillSubPoints += count;
        return `Added ${count} sub skill point(s) (total: ${this.player.skillSubPoints})`;
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
    if (this.characterScreen) {
      this.app.stage.removeChild(this.characterScreen.container);
      this.characterScreen.destroy();
      this.characterScreen = undefined;
    }
    this.characterScreenOpen = false;
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
    if (this.minimap) { this.app.stage.removeChild(this.minimap.container); this.minimap.destroy(); this.minimap = undefined; }
    if (this.soulVaultScreen) {
      this.soulVaultScreen.destroy();
      this.soulVaultScreen = undefined;
    }
    this.soulVaultOpen = false;

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
      try { this.gameContainer.destroy({ children: true }); } catch (_) {}
      this.gameContainer = undefined;
    }
    this.devConsole.hide();
    if (this.tutorialScreen) {
      this.app.stage.removeChild(this.tutorialScreen.container);
      try { this.tutorialScreen.destroy(); } catch (_) {}
      this.tutorialScreen = undefined;
    }
    this.tutorialStage = null;
    this.tutorialKeys = new Set();
    this.tutorialKeyWasDown = new Set();
    this.enemies = [];
    this.minions = [];
    this.recentCorpses = [];
    this.frameCount = 0;
    for (const p of this.projectiles) { try { p.destroy(); } catch (_) {} }
    this.projectiles = [];
    this.itemDrops = [];
    this.soulDrops = [];
    this.soulVault = [];
    this.activeSpectre = null;
    this.activeSpectreMinion = null;
    this.vfx = [];
    this.modGfx = [];
    this.chillZones = [];
    this.chests = [];
    this.breakables = [];
    this.urns = [];
    this.activeUrnOrb = null;
    this.decorationSprites = [];
    this.waveCooldown = 0;
    this.zoneManager = new ZoneManager();
    if (this.recallPortal) { try { this.recallPortal.graphic.destroy(); } catch (_) {} this.recallPortal = null; }
    this.dash = null;
    this.rainZones = [];
    this.combatText.destroy();
    this.combatText = new CombatTextManager();
    this.player = undefined;
    this.room = undefined;
    this.input.reset();
    this.lastKeys.clear();
    this.showClassSelect();
  }
}
