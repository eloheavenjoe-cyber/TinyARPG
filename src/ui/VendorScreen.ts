import { Container, Text, TextStyle, Graphics, Sprite } from 'pixi.js';
import { VendorStockItem, calculateSellPrice } from '../core/VendorManager';
import { InventorySlot, OrbInfo } from '../entities/Player';
import { GeneratedItem } from '../core/ItemGenerator';
import { Logger } from '../core/Logger';
import { buildItemTooltip, buildOrbTooltip } from './Tooltip';
import { getItemTexture, isItemIconsLoaded } from '../rendering/ItemIcons';

const SLOT = 50;
const GAP = 6;
const COLS = 5;

export class VendorScreen {
  container: Container;
  private onBuy: ((stockItem: VendorStockItem) => void) | null = null;
  private onSell: ((gridIndex: number) => void) | null = null;
  private onClose: (() => void) | null = null;
  private playerGold = 0;
  private messageText?: Text;
  private messageTimer = 0;
  private stockSlots: Container[] = [];
  private invSlots: Container[] = [];
  private tooltip?: Container;
  private screenWidth: number;
  private screenHeight: number;

  constructor(
    screenWidth: number, screenHeight: number,
    stock: VendorStockItem[],
    inventory: InventorySlot[],
    gold: number,
  ) {
    this.playerGold = gold;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Vendor', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 32, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = 20;
    this.container.addChild(title);

    // Gold display
    const goldText = new Text(`Gold: ${gold}`, new TextStyle({
      fontFamily: 'monospace', fontSize: 16, fill: '#ffcc44',
    }));
    goldText.x = screenWidth / 2 - 60;
    goldText.y = 65;
    this.container.addChild(goldText);

    // Column headers
    const invLabel = new Text('Your Items', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    invLabel.anchor.set(0.5, 0);
    invLabel.x = screenWidth * 0.25;
    invLabel.y = 100;
    this.container.addChild(invLabel);

    const shopLabel = new Text('Shop', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    shopLabel.anchor.set(0.5, 0);
    shopLabel.x = screenWidth * 0.7;
    shopLabel.y = 100;
    this.container.addChild(shopLabel);

    // Player inventory (left side, 5x6)
    this.renderInventoryGrid(screenWidth, inventory);

    // Vendor stock (right side, 4-col grid)
    this.renderStockGrid(screenWidth, stock);

    // Message text (hidden by default)
    this.messageText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ffcc44',
      stroke: '#000', strokeThickness: 2,
    }));
    this.messageText.anchor.set(0.5);
    this.messageText.x = screenWidth / 2;
    this.messageText.y = screenHeight - 40;
    this.messageText.visible = false;
    this.container.addChild(this.messageText);

    // Close button hint
    const closeHint = new Text('Press ESC to close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#4a4a5a',
    }));
    closeHint.anchor.set(0.5);
    closeHint.x = screenWidth / 2;
    closeHint.y = screenHeight - 20;
    this.container.addChild(closeHint);

    Logger.log('ui', 'Vendor screen opened');
  }

  private renderInventoryGrid(screenWidth: number, inventory: InventorySlot[]) {
    this.invSlots = [];
    const startX = screenWidth * 0.25 - ((COLS * (SLOT + GAP)) / 2);
    const startY = 130;
    for (let i = 0; i < inventory.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const slot = this.createSlot(x, y, inventory[i]);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onSell?.(idx));
      slot.on('pointerover', () => this.showSlotTooltip(inventory[idx], x, y));
      slot.on('pointerout', () => this.hideTooltip());
      this.container.addChild(slot);
      this.invSlots.push(slot);
    }
  }

  private renderStockGrid(screenWidth: number, stock: VendorStockItem[]) {
    this.stockSlots = [];
    const stockCols = 4;
    const startX = screenWidth * 0.7 - ((stockCols * (SLOT + GAP)) / 2);
    const startY = 130;
    for (let i = 0; i < stock.length; i++) {
      const col = i % stockCols;
      const row = Math.floor(i / stockCols);
      const x = startX + col * (SLOT + GAP);
      const y = startY + row * (SLOT + GAP);
      const item = stock[i];
      const slot = this.createSlot(x, y, { kind: 'equip', item: item.item });
      const priceText = new Text(`${item.buyPrice}g`, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: '#ffcc44',
      }));
      priceText.x = x + 2;
      priceText.y = y + SLOT - 12;
      this.container.addChild(priceText);
      const idx = i;
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointerdown', () => this.onBuy?.(stock[idx]));
      slot.on('pointerover', () => this.showStockTooltip(stock[idx], x, y));
      slot.on('pointerout', () => this.hideTooltip());
      this.container.addChild(slot);
      this.stockSlots.push(slot);
    }
  }

  private showSlotTooltip(slot: InventorySlot, sx: number, sy: number) {
    if (!slot) return;
    this.hideTooltip();
    if (slot.kind === 'orb') {
      this.tooltip = buildOrbTooltip(slot);
    } else {
      this.tooltip = buildItemTooltip(slot.item);
    }
    if (this.tooltip) {
      this.tooltip.x = Math.min(sx + SLOT + 10, this.screenWidth - this.tooltip.width - 10);
      this.tooltip.y = Math.min(sy, this.screenHeight - this.tooltip.height - 10);
      this.container.addChild(this.tooltip);
    }
  }

  private showStockTooltip(item: VendorStockItem, sx: number, sy: number) {
    this.hideTooltip();
    this.tooltip = buildItemTooltip(item.item);
    if (this.tooltip) {
      this.tooltip.x = Math.min(sx + SLOT + 10, this.screenWidth - this.tooltip.width - 10);
      this.tooltip.y = Math.min(sy, this.screenHeight - this.tooltip.height - 10);
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

  onBuyCallback(cb: (item: VendorStockItem) => void) { this.onBuy = cb; }
  onSellCallback(cb: (gridIndex: number) => void) { this.onSell = cb; }
  onCloseCallback(cb: () => void) { this.onClose = cb; }

  showMessage(msg: string) {
    if (this.messageText) {
      this.messageText.text = msg;
      this.messageText.visible = true;
      this.messageTimer = 120;
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

  refreshGold(gold: number) {
    this.playerGold = gold;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
