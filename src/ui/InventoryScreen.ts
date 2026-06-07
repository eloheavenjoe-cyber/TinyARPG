import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Slot } from '../core/ItemDefs';
import { GeneratedItem } from '../core/ItemGenerator';
import { InventorySlot, OrbInfo, EquipSlot } from '../entities/Player';
import { getItemTexture, isItemIconsLoaded } from '../rendering/ItemIcons';

const COLORS = {
  bg: 0x0c0c1a,
  panel: 0x141428,
  slotBg: 0x1a1a30,
  slotBorder: 0x2a2a44,
  slotHover: 0x3a3a55,
  selected: 0x5588cc,
  text: 0xccccdd,
  textDim: 0x555566,
  textStat: '#ffdd88',
};

function getRarityColor(rarity: string): number {
  const colors: Record<string, number> = {
    normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00, unique: 0xff6600,
  };
  return colors[rarity] || 0xffffff;
}

export class InventoryScreen {
  container: Container;
  private gridSlots: { bg: Graphics; item: Text; index: number; icon: Sprite }[] = [];
  private equipSlotsData: {
    slot: Slot; bg: Graphics; item: Text; label: Text; icon: Sprite;
    socketContainer: Container;
    w: number; h: number;
  }[] = [];
  private selectedIndex = -1;
  private hoveredSlot: number | Slot | null = null;
  private onEquip: (gridIndex: number) => void = () => {};
  private onUnequip: (slot: Slot) => void = () => {};
  private tooltip?: Container;
  private mouseX = 0;
  private mouseY = 0;
  private equipment: Record<Slot, GeneratedItem | null>;
  private activeOrb: string | null = null;
  private craftMessage: string | null = null;
  private craftMessageTimer = 0;
  private craftMessageText: Text;
  private onCraftOrb: (orbId: string, slot: Slot) => boolean = () => false;
  private onCraftOrbGrid: (orbId: string, gridIndex: number) => boolean = () => false;
  private onConsumePortalScroll: () => void = () => {};
  private onSocketJewel: (slot: Slot, gridIndex: number) => void = () => {};
  private onDrillOrb: (slot: Slot) => void = () => {};
  private onUnsocketOrb: (orbId: string, slot: Slot, socketIndex: number) => void = () => {};
  private activeSocketJewel: number | null = null;
  private draggingJewel: { gridIndex: number; icon: Sprite } | null = null;
  onSocketJewelCallback(cb: (slot: Slot, gridIndex: number) => void) { this.onSocketJewel = cb; }
  onDrillOrbCallback(cb: (slot: Slot) => void) { this.onDrillOrb = cb; }
  onUnsocketOrbCallback(cb: (orbId: string, slot: Slot, socketIndex: number) => void) { this.onUnsocketOrb = cb; }
  onCraftOrbCallback(cb: (orbId: string, slot: Slot) => boolean) { this.onCraftOrb = cb; }
  onCraftOrbGridCallback(cb: (orbId: string, gridIndex: number) => boolean) { this.onCraftOrbGrid = cb; }
  onConsumePortalScrollCallback(cb: () => void) { this.onConsumePortalScroll = cb; }

  constructor(
    screenW: number, screenH: number,
    inventory: InventorySlot[],
    equipment: Record<Slot, GeneratedItem | null>,
    computedStats: any,
  ) {
    this.container = new Container();
    this.equipment = equipment;

    const bg = new Graphics();
    bg.beginFill(COLORS.bg, 0.92);
    bg.drawRect(0, 0, screenW, screenH);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Inventory', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 24, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenW / 2;
    title.y = 15;
    this.container.addChild(title);

    const hint = new Text('I: Close', new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#555566',
    }));
    hint.anchor.set(1, 0);
    hint.x = screenW - 20;
    hint.y = 10;
    this.container.addChild(hint);

    // Inventory grid (left third, centered)
    const gridLeft = 163;
    const gridTop = 80;
    const slotSize = 58;
    const gap = 6;
    const cols = 5;
    const rows = 6;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const sx = gridLeft + col * (slotSize + gap);
        const sy = gridTop + row * (slotSize + gap);
        const entry = inventory[idx];
        let displayName = '';
        let displayColor = COLORS.textDim;

        if (entry) {
          if (entry.kind === 'equip') {
            displayName = entry.item.base.name;
            displayColor = getRarityColor(entry.item.rarity);
          } else if (entry.kind === 'orb') {
            const names: Record<string, string> = {
              empowerment: 'Empower', flux: 'Flux',
              mutation: 'Mutate', growth: 'Growth',
              ascendance: 'Ascend', purification: 'Purify',
              drilling: 'Drill', shattering: 'Shatter', preservation: 'Preserve',
            };
            displayName = `${names[entry.orbId] || entry.orbId} x${entry.count}`;
            displayColor = 0x44dddd;
          }
        }

        const g = new Graphics();
        g.beginFill(COLORS.slotBg);
        g.lineStyle(1, COLORS.slotBorder);
        g.drawRoundedRect(0, 0, slotSize, slotSize, 4);
        g.endFill();
        g.x = sx;
        g.y = sy;
        this.container.addChild(g);

        const txt = new Text(displayName, new TextStyle({
          fontFamily: 'monospace', fontSize: 9, fill: displayColor,
        }));
        txt.anchor.set(0.5);
        txt.x = sx + slotSize / 2;
        txt.y = sy + slotSize / 2;
        this.container.addChild(txt);

        const icon = new Sprite();
        icon.anchor.set(0.5);
        icon.x = sx + slotSize / 2;
        icon.y = sy + slotSize / 2 - 6;
        icon.scale.set(1);
        icon.visible = false;
        this.container.addChild(icon);

        this.gridSlots.push({ bg: g, item: txt, index: idx, icon });
      }
    }

    // Paper doll (center third)
    const dollCenterX = screenW / 2;
    const dollCenterY = screenH / 2 - 10;

    const paperDollBg = new Graphics();
    paperDollBg.beginFill(COLORS.panel, 0.8);
    paperDollBg.drawRoundedRect(dollCenterX - 180, dollCenterY - 240, 400, 500, 8);
    paperDollBg.endFill();
    this.container.addChild(paperDollBg);

    const bodySilhouette = new Graphics();
    bodySilhouette.beginFill(0x1a1a30, 0.6);
    bodySilhouette.drawRoundedRect(dollCenterX - 14, dollCenterY - 40, 28, 80, 4);
    bodySilhouette.drawCircle(dollCenterX, dollCenterY - 75, 22);
    bodySilhouette.endFill();
    this.container.addChild(bodySilhouette);

    interface DollSlotDef {
      slot: Slot; dx: number; dy: number; label: string; w: number; h: number;
    }

    const CELL = 28;
    const dollSlots: DollSlotDef[] = [
      { slot: 'helmet', dx: 0 * CELL,       dy: -8 * CELL, label: 'Helm',    w: 2 * CELL, h: 2 * CELL },
      { slot: 'weapon', dx: -4 * CELL,       dy: -3 * CELL, label: 'Weapon', w: 2 * CELL, h: 4 * CELL },
      { slot: 'body',   dx: 0 * CELL,        dy: -3 * CELL, label: 'Chest',  w: 2 * CELL, h: 4 * CELL },
      { slot: 'ring',   dx: 4 * CELL,        dy: -4 * CELL, label: 'Ring 1', w: 1 * CELL, h: 1 * CELL },
      { slot: 'ring2',  dx: 4 * CELL,        dy: 1 * CELL,  label: 'Ring 2', w: 1 * CELL, h: 1 * CELL },
      { slot: 'boots',  dx: 0 * CELL,        dy: 4 * CELL,  label: 'Boots',  w: 2 * CELL, h: 2 * CELL },
      { slot: 'amulet', dx: 4 * CELL,        dy: 4 * CELL,  label: 'Amulet', w: 1 * CELL, h: 1 * CELL },
    ];

    for (const ds of dollSlots) {
      const item = equipment[ds.slot];
      const sx = dollCenterX + ds.dx;
      const sy = dollCenterY + ds.dy;

      const g = new Graphics();
      g.beginFill(item ? 0x222244 : COLORS.slotBg);
      g.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
      g.drawRoundedRect(-ds.w / 2, -ds.h / 2, ds.w, ds.h, 4);
      g.endFill();
      g.x = sx;
      g.y = sy;
      this.container.addChild(g);

      const labelTxt = new Text(ds.label, new TextStyle({
        fontFamily: 'monospace', fontSize: 9, fill: COLORS.textDim,
      }));
      labelTxt.anchor.set(0.5, 0);
      labelTxt.x = sx;
      labelTxt.y = sy + ds.h / 2 + 2;
      this.container.addChild(labelTxt);

      const itemTxt = new Text(item ? item.base.name : '', new TextStyle({
        fontFamily: 'monospace', fontSize: 8,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      }));
      itemTxt.anchor.set(0.5);
      itemTxt.x = sx;
      itemTxt.y = sy + 4;
      this.container.addChild(itemTxt);

      const equipIcon = new Sprite();
      equipIcon.anchor.set(0.5);
      equipIcon.x = sx;
      equipIcon.y = sy;
      equipIcon.visible = false;
      this.container.addChild(equipIcon);

      // Socket indicators inside bottom of slot
      const socketContainer = new Container();
      socketContainer.x = sx;
      socketContainer.y = sy + ds.h / 2 - 8;
      this.container.addChild(socketContainer);

      this.equipSlotsData.push({
        slot: ds.slot, bg: g, item: itemTxt, label: labelTxt, icon: equipIcon,
        socketContainer, w: ds.w, h: ds.h,
      });
    }

    // Bag placeholder (right third)
    const bagPanelX = screenW / 2 + 380;
    const bagPanelY = dollCenterY - 80;
    const bagBg = new Graphics();
    bagBg.beginFill(COLORS.panel, 0.8);
    bagBg.drawRoundedRect(bagPanelX, bagPanelY, 180, 200, 8);
    bagBg.endFill();
    this.container.addChild(bagBg);

    const bagTitle = new Text('Bag', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 16, fill: '#7a6a3a',
    }));
    bagTitle.anchor.set(0.5, 0);
    bagTitle.x = bagPanelX + 90;
    bagTitle.y = bagPanelY + 10;
    this.container.addChild(bagTitle);

    const bagHint = new Text('Coming soon', new TextStyle({
      fontFamily: 'monospace', fontSize: 10, fill: COLORS.textDim,
    }));
    bagHint.anchor.set(0.5, 0);
    bagHint.x = bagPanelX + 90;
    bagHint.y = bagPanelY + 50;
    this.container.addChild(bagHint);

    this.craftMessageText = new Text('', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#ffdd88',
      stroke: '#000', strokeThickness: 3,
    }));
    this.craftMessageText.anchor.set(0.5, 0);
    this.craftMessageText.x = screenW / 2;
    this.craftMessageText.y = screenH - 40;
    this.container.addChild(this.craftMessageText);
  }

  private statLabel(stat: string): string {
    const labels: Record<string, string> = {
      hp: 'HP', mana: 'Mana', armor: 'Armor', damage: 'Damage',
      damagePct: 'Dmg %', attackSpeedPct: 'Atk Spd', moveSpeedPct: 'Move Spd',
      str: 'STR', dex: 'DEX', int: 'INT',
      armorPct: 'Armor %', hpRegen: 'HP Regen',
      fireDmg: 'Fire Dmg', damageReduction: 'Dmg Red', projectileDmgPct: 'Proj Dmg',
    };
    return labels[stat] || stat;
  }

  private showTooltip(item: GeneratedItem, x: number, y: number) {
    if (this.tooltip) this.container.removeChild(this.tooltip);
    this.tooltip = new Container();

    const pad = 10;
    const lineH = 16;
    const rarityColor = getRarityColor(item.rarity);

    interface Line { left: Text; right?: Text }
    const elems: Line[] = [];
    let cy = pad;

    const addText = (text: string, overrides: Partial<TextStyle>, xOff = 0): Text => {
      const t = new Text(text, new TextStyle({ fontFamily: 'monospace', ...overrides }));
      t.x = pad + xOff;
      t.y = cy;
      return t;
    };

    // Header
    elems.push({ left: addText(item.computedName, { fontSize: 14, fontWeight: 'bold', fill: rarityColor }) });
    cy += 20;

    // Base type
    elems.push({ left: addText(`── ${item.base.name} ──`, { fontSize: 10, fill: '#777788' }) });
    cy += 12;

    const prefixes = item.affixes.filter(a => a.affix.type === 'prefix');
    const suffixes = item.affixes.filter(a => a.affix.type === 'suffix');

    // Prefixes section
    if (prefixes.length > 0) {
      cy += 2;
      elems.push({ left: addText('Prefixes', { fontSize: 10, fill: '#556688', fontStyle: 'italic' }) });
      cy += 14;
      for (const a of prefixes) {
        const left = addText(`◆ ${a.affix.name}`, { fontSize: 11, fill: '#88aacc' }, 6);
        const right = addText(`${a.roll > 0 ? '+' : ''}${a.roll}`, { fontSize: 11, fill: '#ccccdd' });
        elems.push({ left, right });
        cy += lineH;
      }
    }

    // Suffixes section
    if (suffixes.length > 0) {
      cy += 2;
      elems.push({ left: addText('Suffixes', { fontSize: 10, fill: '#556688', fontStyle: 'italic' }) });
      cy += 14;
      for (const a of suffixes) {
        const left = addText(`◆ ${a.affix.name}`, { fontSize: 11, fill: '#88aacc' }, 6);
        const right = addText(`${a.roll > 0 ? '+' : ''}${a.roll}`, { fontSize: 11, fill: '#ccccdd' });
        elems.push({ left, right });
        cy += lineH;
      }
    }

    // Stat summary
    cy += 2;
    const nonZeroStats = Object.entries(item.computedStats).filter(([, v]) => v !== 0);
    if (nonZeroStats.length > 0) {
      elems.push({ left: addText('Stats', { fontSize: 10, fill: '#556688', fontStyle: 'italic' }) });
      cy += 14;
      for (const [stat, val] of nonZeroStats) {
        const left = addText(`  ${this.statLabel(stat)}`, { fontSize: 11, fill: '#aaaabc' });
        const right = addText(`${val > 0 ? '+' : ''}${val}`, { fontSize: 11, fill: '#ccccdd' });
        elems.push({ left, right });
        cy += lineH;
      }
    }

    // Level requirement
    if (item.levelReq > 1) {
      cy += 2;
      elems.push({ left: addText(`Requires Level ${item.levelReq}`, { fontSize: 10, fill: '#cc8866', fontStyle: 'italic' }) });
      cy += 14;
    }

    cy += pad;

    // Calculate width: find widest element
    let maxW = pad * 2;
    for (const e of elems) {
      const eRight = e.left.x + e.left.width + pad;
      maxW = Math.max(maxW, eRight);
      if (e.right) {
        const eRight2 = e.right.x + e.right.width + pad;
        maxW = Math.max(maxW, eRight2);
      }
    }
    // Ensure minimum width
    maxW = Math.max(maxW, 140);

    // Position right-aligned values
    for (const e of elems) {
      if (e.right) {
        e.right.x = maxW - pad - e.right.width;
      }
    }

    // Background
    const bg = new Graphics();
    bg.beginFill(0x0a0a18, 0.95);
    bg.lineStyle(2, rarityColor, 0.6);
    bg.drawRoundedRect(0, 0, maxW, cy, 4);
    bg.endFill();
    this.tooltip.addChild(bg);

    // Add all text in order
    for (const e of elems) {
      this.tooltip.addChild(e.left);
      if (e.right) this.tooltip.addChild(e.right);
    }

    this.tooltip.x = Math.min(x + 20, 1920 - maxW - 10);
    this.tooltip.y = Math.min(y + 20, 1080 - cy - 10);
    this.container.addChild(this.tooltip);
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.container.removeChild(this.tooltip);
      this.tooltip = undefined;
    }
  }

  private showOrbTooltip(orb: OrbInfo) {
    if (this.tooltip) this.container.removeChild(this.tooltip);
    const descriptions: Record<string, string> = {
      empowerment: 'Adds a random affix to a\nrare item',
      flux: 'Re-rolls all affixes on a\nrare item',
      mutation: 'Upgrades a normal item to\nmagic with 2 affixes',
      growth: 'Adds a random affix to a\nmagic item (max 4)',
      ascendance: 'Upgrades a normal item to\nrare with 4-6 affixes',
      purification: 'Removes all affixes from a\nmagic or rare item',
      drilling: 'Re-rolls socket count on an\nitem (always different result)',
      shattering: 'Destroys a socketed jewel\nand empties the socket',
      preservation: 'Removes a socketed jewel\nand returns it to inventory',
    };
    const orbNames: Record<string, string> = {
      empowerment: 'Orb of Empowerment',
      flux: 'Orb of Flux',
      mutation: 'Orb of Mutation',
      growth: 'Orb of Growth',
      ascendance: 'Orb of Ascendance',
      purification: 'Orb of Purification',
      drilling: 'Drilling Orb',
      shattering: 'Shattering Orb',
      preservation: 'Preservation Orb',
    };
    const name = orbNames[orb.orbId] || orb.orbId;
    this.tooltip = new Container();
    const txt = new Text(`${name} (${orb.count})\n${descriptions[orb.orbId] || ''}`, new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: 0x44dddd, lineHeight: 16,
    }));
    const pad = 8;
    const bg = new Graphics();
    bg.beginFill(0x0a0a18, 0.95);
    bg.lineStyle(1, 0x44dddd, 0.6);
    bg.drawRoundedRect(-pad, -pad, txt.width + pad * 2, txt.height + pad * 2, 4);
    bg.endFill();
    this.tooltip.addChild(bg, txt);
    this.tooltip.x = Math.min(this.mouseX + 20, 1920 - txt.width - pad * 2 - 10);
    this.tooltip.y = Math.min(this.mouseY + 20, 1080 - txt.height - pad * 2 - 10);
    this.container.addChild(this.tooltip);
  }

  onEquipCallback(cb: (gridIndex: number) => void) { this.onEquip = cb; }
  onUnequipCallback(cb: (slot: Slot) => void) { this.onUnequip = cb; }

  update(
    inventory: InventorySlot[],
    equipment: Record<Slot, GeneratedItem | null>,
    computedStats: any,
    input?: InputManager,
  ) {
    if (!input) return;
    this.mouseX = input.mouseX;
    this.mouseY = input.mouseY;

    if (input.consumeRightClick()) {
      this.handleRightClick(inventory);
      if (!this.container.parent) return;
    }

    if (input.consumeClick()) {
      this.handleClick(inventory, equipment);
      if (!this.container.parent) return;
    }

    // Hover detection for tooltip
    let hoveredEntry: InventorySlot = null;
    this.hoveredSlot = null;
    for (const g of this.gridSlots) {
      if (this.mouseX >= g.bg.x && this.mouseX <= g.bg.x + 58 &&
          this.mouseY >= g.bg.y && this.mouseY <= g.bg.y + 58) {
        this.hoveredSlot = g.index;
        hoveredEntry = inventory[g.index];
        break;
      }
    }
    if (!hoveredEntry) {
      for (const esd of this.equipSlotsData) {
        const ex = esd.bg.x, ey = esd.bg.y;
        if (this.mouseX >= ex - esd.w / 2 && this.mouseX <= ex + esd.w / 2 &&
            this.mouseY >= ey - esd.h / 2 && this.mouseY <= ey + esd.h / 2) {
          this.hoveredSlot = esd.slot as any;
          if (equipment[esd.slot]) hoveredEntry = { kind: 'equip', item: equipment[esd.slot] } as EquipSlot;
          break;
        }
      }
    }
    if (hoveredEntry) {
      if (hoveredEntry.kind === 'equip') this.showTooltip(hoveredEntry.item, this.mouseX, this.mouseY);
      else if (hoveredEntry.kind === 'orb') this.showOrbTooltip(hoveredEntry);
      else this.hideTooltip();
    } else {
      this.hideTooltip();
    }

    // Update grid visuals
    for (let i = 0; i < this.gridSlots.length; i++) {
      const slot = this.gridSlots[i];
      const entry = inventory[i];
      const isHover = this.hoveredSlot === i;
      const isSelected = i === this.selectedIndex;

      let displayName = '';
      let displayColor = COLORS.textDim;
      if (entry) {
        if (entry.kind === 'equip') {
          displayName = entry.item.base.name;
          displayColor = getRarityColor(entry.item.rarity);
        } else if (entry.kind === 'orb') {
          const names: Record<string, string> = { empowerment: 'Empower', flux: 'Flux', drilling: 'Drill', shattering: 'Shatter', preservation: 'Preserve' };
          displayName = `${names[entry.orbId] || entry.orbId} x${entry.count}`;
          displayColor = 0x44dddd;
        }
      }

      slot.bg.clear();
      if (isSelected) {
        slot.bg.beginFill(COLORS.selected, 0.3);
        slot.bg.lineStyle(2, COLORS.selected);
      } else if (isHover) {
        slot.bg.beginFill(COLORS.slotHover);
        slot.bg.lineStyle(1, COLORS.slotBorder);
      } else {
        slot.bg.beginFill(COLORS.slotBg);
        slot.bg.lineStyle(1, COLORS.slotBorder);
      }
      slot.bg.drawRoundedRect(0, 0, 58, 58, 4);
      slot.bg.endFill();
      slot.item.text = displayName;
      slot.item.style = new TextStyle({
        fontFamily: 'monospace', fontSize: 9, fill: displayColor,
      });

      // Set icon
      if (entry && isItemIconsLoaded()) {
        let iconKey = '';
        if (entry.kind === 'equip') iconKey = `${entry.item.base.id}_${entry.item.rarity}`;
        else if (entry.kind === 'orb') iconKey = entry.orbId;
        const tex = iconKey ? getItemTexture(iconKey) : undefined;
        if (tex) {
          slot.icon.texture = tex;
          slot.icon.visible = true;
          slot.item.y = slot.bg.y + 36;
        } else {
          slot.icon.visible = false;
          slot.item.y = slot.bg.y + 25;
        }
      } else {
        slot.icon.visible = false;
        slot.item.y = slot.bg.y + 25;
      }
    }

    // Update equipment visuals
    for (const esd of this.equipSlotsData) {
      const item = equipment[esd.slot];
      esd.bg.clear();
      esd.bg.beginFill(item ? 0x222244 : COLORS.slotBg);
      esd.bg.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
      esd.bg.drawRoundedRect(-esd.w / 2, -esd.h / 2, esd.w, esd.h, 4);
      esd.bg.endFill();
      esd.item.text = item ? item.base.name : '';
      esd.item.style = new TextStyle({
        fontFamily: 'monospace', fontSize: 8,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      });
      if (item && isItemIconsLoaded()) {
        const key = `${item.base.id}_${item.rarity}`;
        const tex = getItemTexture(key);
        if (tex) {
          esd.icon.texture = tex;
          esd.icon.visible = true;
        } else {
          esd.icon.visible = false;
        }
      } else {
        esd.icon.visible = false;
      }

      // Socket indicators inside slot bottom
      esd.socketContainer.removeChildren();
      if (!item || item.maxSockets === 0) continue;

      const socketRadius = 4;
      const socketGap = 14;
      const totalW = item.maxSockets * socketGap;

      for (let i = 0; i < item.maxSockets; i++) {
        const sx = -totalW / 2 + i * socketGap + socketGap / 2;
        const dot = new Graphics();
        const hasJewel = item.socketSlots && i < item.socketSlots.length && item.socketSlots[i]?.jewel;
        if (hasJewel) {
          const jColor = getRarityColor(item.socketSlots[i].jewel!.rarity);
          dot.beginFill(jColor);
        } else {
          dot.beginFill(0x333333);
        }
        dot.lineStyle(1, 0x555555);
        dot.drawCircle(sx, 0, socketRadius);
        dot.endFill();
        esd.socketContainer.addChild(dot);
      }
    }

    // Craft message
    if (this.craftMessageTimer > 0) {
      this.craftMessageText.text = this.craftMessage || '';
      this.craftMessageTimer--;
    } else {
      this.craftMessageText.text = '';
    }

    // Drag-drop for jewels
    if (input.isMouseDown && !this.draggingJewel) {
      for (const g of this.gridSlots) {
        if (this.mouseX >= g.bg.x && this.mouseX <= g.bg.x + 58 &&
            this.mouseY >= g.bg.y && this.mouseY <= g.bg.y + 58) {
          const entry = inventory[g.index];
          if (entry && entry.kind === 'equip' && entry.item.base.id === 'jewel') {
            const icon = new Sprite();
            if (isItemIconsLoaded()) {
              const tex = getItemTexture(`${entry.item.base.id}_${entry.item.rarity}`);
              if (tex) icon.texture = tex;
            }
            icon.anchor.set(0.5);
            icon.scale.set(1.5);
            icon.x = this.mouseX;
            icon.y = this.mouseY;
            this.container.addChild(icon);
            this.draggingJewel = { gridIndex: g.index, icon };
            this.selectedIndex = -1;
            this.activeOrb = null;
            this.activeSocketJewel = null;
            break;
          }
        }
      }
    }

    if (this.draggingJewel) {
      this.draggingJewel.icon.x = this.mouseX;
      this.draggingJewel.icon.y = this.mouseY;

      if (!input.isMouseDown) {
        let dropped = false;
        for (const esd of this.equipSlotsData) {
          const ex = esd.bg.x, ey = esd.bg.y;
          if (this.mouseX >= ex - esd.w / 2 && this.mouseX <= ex + esd.w / 2 &&
              this.mouseY >= ey - esd.h / 2 && this.mouseY <= ey + esd.h / 2) {
            this.onSocketJewel(esd.slot, this.draggingJewel.gridIndex);
            dropped = true;
            break;
          }
        }
        this.container.removeChild(this.draggingJewel.icon);
        this.draggingJewel.icon.destroy();
        this.draggingJewel = null;
      }
    }
  }

  private handleRightClick(inventory: InventorySlot[]) {
    const mx = this.mouseX;
    const my = this.mouseY;

    for (const g of this.gridSlots) {
      if (mx >= g.bg.x && mx <= g.bg.x + 58 && my >= g.bg.y && my <= g.bg.y + 58) {
        const entry = inventory[g.index];
        if (entry && entry.kind === 'orb') {
          if (entry.orbId === 'portal_scroll') {
            this.onConsumePortalScroll();
            return;
          }
          this.activeOrb = this.activeOrb === entry.orbId ? null : entry.orbId;
          this.selectedIndex = this.activeOrb ? g.index : -1;
          this.activeSocketJewel = null;
        } else if (entry && entry.kind === 'equip' && entry.item.base.id === 'jewel') {
          this.activeSocketJewel = this.activeSocketJewel === g.index ? null : g.index;
          this.activeOrb = null;
          this.selectedIndex = this.activeSocketJewel !== null ? g.index : -1;
        }
        return;
      }
    }
  }

  private handleClick(inventory: InventorySlot[], equipment: Record<Slot, GeneratedItem | null>) {
    const mx = this.mouseX;
    const my = this.mouseY;

    // Check grid clicks
    for (const g of this.gridSlots) {
      if (mx >= g.bg.x && mx <= g.bg.x + 58 && my >= g.bg.y && my <= g.bg.y + 58) {
        const entry = inventory[g.index];
        if (entry) {
          if (entry.kind === 'equip') {
            if (this.activeOrb) {
              const success = this.onCraftOrbGrid(this.activeOrb, g.index);
              if (success) {
                this.craftMessage = 'Orb applied!';
              } else {
                this.craftMessage = 'Item not eligible';
              }
              this.craftMessageTimer = 120;
              this.activeOrb = null;
              this.selectedIndex = -1;
            } else if (this.selectedIndex === g.index) {
              this.selectedIndex = -1;
              this.onEquip(g.index);
            } else {
              this.selectedIndex = g.index;
            }
          }
        } else {
          this.activeOrb = null;
          this.activeSocketJewel = null;
          this.selectedIndex = -1;
        }
        return;
      }
    }

    // Check equipment slot clicks
    for (const esd of this.equipSlotsData) {
      const ex = esd.bg.x, ey = esd.bg.y;
      if (this.mouseX >= ex - esd.w / 2 && this.mouseX <= ex + esd.w / 2 &&
          this.mouseY >= ey - esd.h / 2 && this.mouseY <= ey + esd.h / 2) {
        if (this.activeSocketJewel !== null) {
          const jewelEntry = inventory[this.activeSocketJewel];
          if (jewelEntry && jewelEntry.kind === 'equip' && jewelEntry.item.base.id === 'jewel') {
            this.onSocketJewel(esd.slot, this.activeSocketJewel);
            this.activeSocketJewel = null;
            this.selectedIndex = -1;
            return;
          }
        }
        if (this.activeOrb && equipment[esd.slot]) {
          const orbId = this.activeOrb;
          if (orbId === 'drilling') {
            this.onDrillOrb(esd.slot);
          } else if (orbId === 'shattering' || orbId === 'preservation') {
            const socketIdx = this.getSocketAtPosition(esd.slot, this.mouseX, this.mouseY);
            if (socketIdx >= 0) {
              this.onUnsocketOrb(orbId, esd.slot, socketIdx);
            }
          } else {
            const success = this.onCraftOrb(this.activeOrb, esd.slot);
            if (success) {
              this.craftMessage = 'Orb applied!';
            } else {
              this.craftMessage = 'Item not eligible';
            }
          }
          this.craftMessageTimer = 120;
          this.activeOrb = null;
          this.selectedIndex = -1;
        } else if (this.selectedIndex >= 0) {
          const entry = inventory[this.selectedIndex];
          if (entry && entry.kind === 'equip') {
            this.onEquip(this.selectedIndex);
            this.selectedIndex = -1;
          }
        } else if (equipment[esd.slot]) {
          this.onUnequip(esd.slot);
        }
        return;
      }
    }

    this.activeOrb = null;
    this.activeSocketJewel = null;
    this.selectedIndex = -1;
  }

  private getSocketAtPosition(slot: Slot, mx: number, my: number): number {
    const esd = this.equipSlotsData.find(e => e.slot === slot);
    if (!esd) return -1;
    const item = this.equipment[slot] as any;
    if (!item?.socketSlots) return -1;

    const socketRadius = 4;
    const socketGap = 14;
    const totalW = item.maxSockets * socketGap;
    const socketY = esd.socketContainer.y;

    for (let i = 0; i < item.socketSlots.length; i++) {
      const sx = esd.socketContainer.x + (-totalW / 2 + i * socketGap + socketGap / 2);
      const dist = Math.hypot(mx - sx, my - socketY);
      if (dist < socketRadius + 4) return i;
    }
    return -1;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
