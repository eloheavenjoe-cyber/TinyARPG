import { Container, Text, TextStyle, Graphics, Sprite } from 'pixi.js';
import { InventorySlot, OrbInfo } from '../entities/Player';
import { StashTab } from '../core/SaveManager';
import { Logger } from '../core/Logger';
import { buildItemTooltip, buildOrbTooltip } from './Tooltip';
import { getItemTexture, isItemIconsLoaded } from '../rendering/ItemIcons';

const SLOT = 50;
const GAP = 6;
const INV_COLS = 5;
const STASH_COLS = 6;
const STASH_ROWS = 10;

export class StashScreen {
  container: Container;
  private onDeposit: ((invIndex: number) => void) | null = null;
  private onWithdraw: ((tabIndex: number, slotIndex: number) => void) | null = null;
  private onRenameTab: ((tabIndex: number, name: string) => void) | null = null;
  private onClose: (() => void) | null = null;
  private activeTab = 0;
  private tabs: StashTab[];
  private tabButtons: Container[] = [];
  private stashSlotContainers: Container[] = [];
  private inventory: InventorySlot[] = [];
  private messageText?: Text;
  private messageTimer = 0;
  private tooltip?: Container;
  private screenWidth: number;

  constructor(
    screenWidth: number, screenHeight: number,
    tabs: StashTab[],
    inventory: InventorySlot[],
  ) {
    this.tabs = tabs;
    this.inventory = inventory;
    this.screenWidth = screenWidth;
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Stash', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 32, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = 20;
    this.container.addChild(title);

    // Column headers
    const invLabel = new Text('Inventory', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    invLabel.anchor.set(0.5, 0);
    invLabel.x = screenWidth * 0.2;
    invLabel.y = 70;
    this.container.addChild(invLabel);

    const stashLabel = new Text('Stash', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    stashLabel.anchor.set(0.5, 0);
    stashLabel.x = screenWidth * 0.6;
    stashLabel.y = 60;
    this.container.addChild(stashLabel);

    // Tab buttons
    this.renderTabButtons(screenWidth);

    // Stash grid (right side, 6x10)
    this.renderStashGrid(screenWidth);

    // Player inventory (left side, 5x6)
    this.renderInventoryGrid(screenWidth);

    const closeHint = new Text('Press ESC to close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#4a4a5a',
    }));
    closeHint.anchor.set(0.5);
    closeHint.x = screenWidth / 2;
    closeHint.y = screenHeight - 20;
    this.container.addChild(closeHint);

    // Message text
    this.messageText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ffcc44',
      stroke: '#000', strokeThickness: 2,
    }));
    this.messageText.anchor.set(0.5);
    this.messageText.x = screenWidth / 2;
    this.messageText.y = screenHeight - 40;
    this.messageText.visible = false;
    this.container.addChild(this.messageText);

    Logger.log('ui', 'Stash screen opened');
  }

  private renderTabButtons(screenWidth: number) {
    this.tabButtons = [];
    const startX = screenWidth * 0.6 - 155;
    for (let i = 0; i < 4; i++) {
      const btn = new Container();
      const bg = new Graphics();
      bg.beginFill(i === this.activeTab ? 0x2a2a4a : 0x1a1a2e);
      bg.drawRoundedRect(0, 0, 70, 24, 4);
      bg.endFill();
      bg.lineStyle(1, i === this.activeTab ? 0x6a4a2a : 0x3a3a4a);
      bg.drawRoundedRect(0, 0, 70, 24, 4);
      const txt = new Text(this.tabs[i]?.name || `Stash ${i + 1}`, new TextStyle({
        fontFamily: 'monospace', fontSize: 11, fill: '#c0a060',
      }));
      txt.anchor.set(0.5);
      txt.x = 35;
      txt.y = 12;
      btn.addChild(bg, txt);
      btn.x = startX + i * 75;
      btn.y = 85;
      const idx = i;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => this.selectTab(idx));
      // Double-click to rename
      let lastClick = 0;
      btn.on('pointerdown', () => {
        const now = Date.now();
        if (now - lastClick < 400 && idx === this.activeTab) {
          this.startRename(idx);
        }
        lastClick = now;
      });
      this.container.addChild(btn);
      this.tabButtons.push(btn);
    }
  }

  private startRename(tabIndex: number) {
    const currentName = this.tabs[tabIndex]?.name || `Stash ${tabIndex + 1}`;
    const newName = prompt('Rename stash tab:', currentName);
    if (newName && newName.trim().length > 0 && newName !== currentName) {
      this.tabs[tabIndex].name = newName.trim();
      this.onRenameTab?.(tabIndex, newName.trim());
      this.refreshTabButtons();
    }
  }

  private refreshTabButtons() {
    for (const btn of this.tabButtons) btn.destroy({ children: true });
    this.tabButtons = [];
    this.renderTabButtons(1920);
  }

  private selectTab(index: number) {
    this.activeTab = index;
    this.refreshStashGrid();
    this.refreshTabButtons();
  }

  private renderStashGrid(screenWidth: number) {
    this.stashSlotContainers = [];
    const startX = screenWidth * 0.6 - ((STASH_COLS * (SLOT + GAP)) / 2);
    const startY = 120;
    const slots = this.tabs[this.activeTab]?.slots || [];
    for (let i = 0; i < STASH_COLS * STASH_ROWS; i++) {
      const col = i % STASH_COLS;
      const row = Math.floor(i / STASH_COLS);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const entry = (slots[i] || null) as InventorySlot;
      const slot = this.createSlot(x, y, entry);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onWithdraw?.(this.activeTab, idx));
      slot.on('pointerover', () => this.showTooltipFor(entry, x, y));
      slot.on('pointerout', () => this.hideTooltip());
      this.container.addChild(slot);
      this.stashSlotContainers.push(slot);
    }
  }

  private renderInventoryGrid(screenWidth: number) {
    const startX = screenWidth * 0.2 - ((INV_COLS * (SLOT + GAP)) / 2);
    const startY = 100;
    for (let i = 0; i < this.inventory.length; i++) {
      const col = i % INV_COLS;
      const row = Math.floor(i / INV_COLS);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const entry = this.inventory[i];
      const slot = this.createSlot(x, y, entry);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onDeposit?.(idx));
      slot.on('pointerover', () => this.showTooltipFor(entry, x, y));
      slot.on('pointerout', () => this.hideTooltip());
      this.container.addChild(slot);
    }
  }

  private createSlot(x: number, y: number, slot: InventorySlot): Container {
    const c = new Container();
    const bg = new Graphics();
    if (!slot) {
      bg.beginFill(0x111122);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
    } else if (slot.kind === 'orb') {
      bg.beginFill(0x1a1a2e);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
      bg.lineStyle(1, 0x44aacc);
      bg.drawRect(0, 0, SLOT, SLOT);
    } else {
      const rarityColors: Record<string, number> = { normal: 0x444444, magic: 0x4444cc, rare: 0xcc8844, unique: 0xcc4444 };
      bg.beginFill(0x1a1a2e);
      bg.drawRect(0, 0, SLOT, SLOT);
      bg.endFill();
      bg.lineStyle(2, rarityColors[slot.item.rarity] || 0x444444);
      bg.drawRect(0, 0, SLOT, SLOT);
    }
    c.addChild(bg);

    // Item icon
    if (slot) {
      const icon = new Sprite();
      icon.anchor.set(0.5);
      icon.x = SLOT / 2;
      icon.y = SLOT / 2;
      icon.visible = false;
      if (isItemIconsLoaded()) {
        const key = slot.kind === 'equip' ? `${slot.item.base.id}_${slot.item.rarity}` : slot.orbId;
        const tex = getItemTexture(key);
        if (tex) {
          icon.texture = tex;
          icon.visible = true;
        }
      }
      c.addChild(icon);
    }

    c.x = x;
    c.y = y;
    return c;
  }

  private refreshStashGrid() {
    for (const c of this.stashSlotContainers) { this.container.removeChild(c); c.destroy({ children: true }); }
    this.stashSlotContainers = [];
    this.renderStashGrid(1920);
  }

  onDepositCallback(cb: (invIndex: number) => void) { this.onDeposit = cb; }
  onWithdrawCallback(cb: (tabIndex: number, slotIndex: number) => void) { this.onWithdraw = cb; }
  onRenameTabCallback(cb: (tabIndex: number, name: string) => void) { this.onRenameTab = cb; }
  onCloseCallback(cb: () => void) { this.onClose = cb; }

  private showTooltipFor(slot: InventorySlot, sx: number, sy: number) {
    if (!slot) return;
    this.hideTooltip();
    if (slot.kind === 'orb') {
      this.tooltip = buildOrbTooltip(slot);
    } else {
      this.tooltip = buildItemTooltip(slot.item);
    }
    if (this.tooltip) {
      this.tooltip.x = Math.min(sx + SLOT + 10, this.screenWidth - this.tooltip.width - 10);
      this.tooltip.y = Math.min(sy, 1080 - this.tooltip.height - 10);
      this.container.addChild(this.tooltip);
    }
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.container.removeChild(this.tooltip);
      this.tooltip.destroy({ children: true });
      this.tooltip = undefined;
    }
  }

  update() {
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer <= 0 && this.messageText) {
        this.messageText.visible = false;
      }
    }
  }

  showMessage(msg: string) {
    if (this.messageText) {
      this.messageText.text = msg;
      this.messageText.visible = true;
      this.messageTimer = 120;
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
