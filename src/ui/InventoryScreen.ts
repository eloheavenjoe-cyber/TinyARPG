import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { Slot } from '../core/ItemDefs';
import { GeneratedItem } from '../core/ItemGenerator';

const COLORS = {
  bg: 0x0c0c1a,
  panel: 0x141428,
  slotBg: 0x1a1a30,
  slotBorder: 0x2a2a44,
  slotHover: 0x3a3a55,
  selected: 0x5588cc,
  text: '#ccccdd',
  textDim: '#555566',
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
  private gridSlots: { bg: Graphics; item: Text; index: number }[] = [];
  private equipSlots: { bg: Graphics; item: Text; label: Text; slot: Slot }[] = [];
  private selectedIndex = -1;
  private hoveredSlot: number | Slot | null = null;
  private statTexts: Text[] = [];
  private onEquip: (gridIndex: number) => void = () => {};
  private onUnequip: (slot: Slot) => void = () => {};
  private tooltip?: Container;
  private mouseX = 0;
  private mouseY = 0;

  constructor(
    screenW: number, screenH: number,
    inventory: (GeneratedItem | null)[],
    equipment: Record<Slot, GeneratedItem | null>,
    computedStats: any,
  ) {
    this.container = new Container();

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

    // Inventory grid (left side, centered)
    const gridLeft = screenW / 2 - 185;
    const gridTop = 80;
    const slotSize = 50;
    const gap = 6;
    const cols = 5;
    const rows = 6;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const sx = gridLeft + col * (slotSize + gap);
        const sy = gridTop + row * (slotSize + gap);
        const item = inventory[idx];

        const g = new Graphics();
        g.beginFill(COLORS.slotBg);
        g.lineStyle(1, COLORS.slotBorder);
        g.drawRoundedRect(0, 0, slotSize, slotSize, 4);
        g.endFill();
        g.x = sx;
        g.y = sy;
        this.container.addChild(g);

        const txt = new Text(item ? item.base.name : '', new TextStyle({
          fontFamily: 'monospace',
          fontSize: 9,
          fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
        }));
        txt.anchor.set(0.5);
        txt.x = sx + slotSize / 2;
        txt.y = sy + slotSize / 2;
        this.container.addChild(txt);

        this.gridSlots.push({ bg: g, item: txt, index: idx });
      }
    }

    // Equipment panel (right side)
    const equipX = screenW / 2 + 60;
    const equipStartY = 80;
    const equipSlotSize = 60;
    const equipGap = 10;
    const slotLabels: { slot: Slot; label: string }[] = [
      { slot: 'weapon', label: 'Weapon' },
      { slot: 'body', label: 'Body' },
      { slot: 'helmet', label: 'Helmet' },
      { slot: 'boots', label: 'Boots' },
      { slot: 'ring', label: 'Ring 1' },
      { slot: 'ring2', label: 'Ring 2' },
      { slot: 'amulet', label: 'Amulet' },
    ];

    const panelBg = new Graphics();
    panelBg.beginFill(COLORS.panel, 0.8);
    panelBg.drawRoundedRect(
      equipX - 10, equipStartY - 10,
      equipSlotSize + 130, slotLabels.length * (equipSlotSize + equipGap) + 10, 6,
    );
    panelBg.endFill();
    this.container.addChild(panelBg);

    for (let i = 0; i < slotLabels.length; i++) {
      const { slot, label } = slotLabels[i];
      const sy = equipStartY + i * (equipSlotSize + equipGap);
      const item = equipment[slot];

      const g = new Graphics();
      g.beginFill(item ? 0x222244 : COLORS.slotBg);
      g.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
      g.drawRoundedRect(0, 0, equipSlotSize, equipSlotSize, 4);
      g.endFill();
      g.x = equipX;
      g.y = sy;
      this.container.addChild(g);

      const labelTxt = new Text(label, new TextStyle({
        fontFamily: 'monospace', fontSize: 10, fill: COLORS.textDim,
      }));
      labelTxt.x = equipX + equipSlotSize + 8;
      labelTxt.y = sy + 4;
      this.container.addChild(labelTxt);

      const itemTxt = new Text(item ? item.base.name : '', new TextStyle({
        fontFamily: 'monospace', fontSize: 10,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      }));
      itemTxt.x = equipX + equipSlotSize + 8;
      itemTxt.y = sy + 20;
      this.container.addChild(itemTxt);

      this.equipSlots.push({ bg: g, item: itemTxt, label: labelTxt, slot });
    }

    // Stats panel
    const statsX = screenW / 2 + 60;
    const statsY = equipStartY + slotLabels.length * (equipSlotSize + equipGap) + 30;

    const header = new Text('Character Stats', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: COLORS.textStat,
      stroke: '#000', strokeThickness: 2,
    }));
    header.x = statsX;
    header.y = statsY;
    this.container.addChild(header);

    this.refreshStats(computedStats, statsX, statsY);
  }

  private refreshStats(computedStats: any, x: number, y: number) {
    for (const t of this.statTexts) this.container.removeChild(t);
    this.statTexts = [];

    const lines = [
      `Life: ${computedStats?.maxHp || 0}`,
      `Mana: ${computedStats?.maxMana || 0}`,
      `Armor DR: ${computedStats?.damageReduction || 0}%`,
      `Attack Speed: ${((computedStats?.attackSpeedMult || 1) * 100).toFixed(0)}%`,
      `Move Speed: ${((computedStats?.moveSpeedMult || 1) * 100).toFixed(0)}%`,
      `Dodge: ${computedStats?.dodgePct || 0}%`,
    ];

    for (let i = 0; i < lines.length; i++) {
      const t = new Text(lines[i], new TextStyle({
        fontFamily: 'monospace', fontSize: 12, fill: COLORS.text,
      }));
      t.x = x;
      t.y = y + 24 + i * 20;
      this.container.addChild(t);
      this.statTexts.push(t);
    }
  }

  private showTooltip(item: GeneratedItem, x: number, y: number) {
    if (this.tooltip) this.container.removeChild(this.tooltip);

    const lines: string[] = [item.computedName];
    lines.push(`Base: ${item.base.name}`);
    if (item.damageRoll > 0) lines.push(`Damage: ${item.damageRoll}`);
    for (const a of item.affixes) {
      if (a.affix.name) {
        lines.push(`  ${a.affix.name}: ${a.roll > 0 ? '+' : ''}${a.roll}`);
      }
    }

    this.tooltip = new Container();
    const txt = new Text(lines.join('\n'), new TextStyle({
      fontFamily: 'monospace', fontSize: 11,
      fill: getRarityColor(item.rarity), lineHeight: 16,
    }));

    const pad = 8;
    const bg = new Graphics();
    bg.beginFill(0x0a0a18, 0.95);
    bg.lineStyle(1, getRarityColor(item.rarity), 0.6);
    bg.drawRoundedRect(-pad, -pad, txt.width + pad * 2, txt.height + pad * 2, 4);
    bg.endFill();

    this.tooltip.addChild(bg, txt);
    this.tooltip.x = Math.min(x + 20, 1920 - txt.width - pad * 2 - 10);
    this.tooltip.y = Math.min(y + 20, 1080 - txt.height - pad * 2 - 10);
    this.container.addChild(this.tooltip);
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.container.removeChild(this.tooltip);
      this.tooltip = undefined;
    }
  }

  onEquipCallback(cb: (gridIndex: number) => void) { this.onEquip = cb; }
  onUnequipCallback(cb: (slot: Slot) => void) { this.onUnequip = cb; }

  update(
    inventory: (GeneratedItem | null)[],
    equipment: Record<Slot, GeneratedItem | null>,
    computedStats: any,
    input?: InputManager,
  ) {
    if (!input) return;
    this.mouseX = input.mouseX;
    this.mouseY = input.mouseY;

    if (input.consumeClick()) {
      this.handleClick(inventory, equipment);
    }

    // Hover detection for tooltip
    let hoveredItem: GeneratedItem | null = null;
    this.hoveredSlot = null;
    for (const g of this.gridSlots) {
      if (this.mouseX >= g.bg.x && this.mouseX <= g.bg.x + 50 &&
          this.mouseY >= g.bg.y && this.mouseY <= g.bg.y + 50) {
        this.hoveredSlot = g.index;
        if (inventory[g.index]) hoveredItem = inventory[g.index];
        break;
      }
    }
    if (!hoveredItem) {
      for (const s of this.equipSlots) {
        if (this.mouseX >= s.bg.x && this.mouseX <= s.bg.x + 60 &&
            this.mouseY >= s.bg.y && this.mouseY <= s.bg.y + 60) {
          this.hoveredSlot = s.slot as any;
          if (equipment[s.slot]) hoveredItem = equipment[s.slot];
          break;
        }
      }
    }
    if (hoveredItem) {
      this.showTooltip(hoveredItem, this.mouseX, this.mouseY);
    } else {
      this.hideTooltip();
    }

    // Update grid visuals
    for (let i = 0; i < this.gridSlots.length; i++) {
      const slot = this.gridSlots[i];
      const item = inventory[i];
      const isHover = this.hoveredSlot === i;
      const isSelected = i === this.selectedIndex;

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
      slot.bg.drawRoundedRect(0, 0, 50, 50, 4);
      slot.bg.endFill();
      slot.item.text = item ? item.base.name : '';
      slot.item.style = new TextStyle({
        fontFamily: 'monospace', fontSize: 9,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      });
    }

    // Update equipment visuals
    for (const s of this.equipSlots) {
      const item = equipment[s.slot];
      s.bg.clear();
      s.bg.beginFill(item ? 0x222244 : COLORS.slotBg);
      s.bg.lineStyle(1, item ? 0x4466aa : COLORS.slotBorder);
      s.bg.drawRoundedRect(0, 0, 60, 60, 4);
      s.bg.endFill();
      s.item.text = item ? item.base.name : '';
      s.item.style = new TextStyle({
        fontFamily: 'monospace', fontSize: 10,
        fill: item ? getRarityColor(item.rarity) : COLORS.textDim,
      });
    }

    // Update stats
    const statsX = 1920 / 2 + 60;
    const statsY = 80 + 7 * (60 + 10) + 30;
    this.refreshStats(computedStats, statsX, statsY);
  }

  private handleClick(inventory: (GeneratedItem | null)[], equipment: Record<Slot, GeneratedItem | null>) {
    const mx = this.mouseX;
    const my = this.mouseY;

    for (const g of this.gridSlots) {
      if (mx >= g.bg.x && mx <= g.bg.x + 50 && my >= g.bg.y && my <= g.bg.y + 50) {
        if (inventory[g.index]) {
          if (this.selectedIndex === g.index) {
            this.selectedIndex = -1;
            this.onEquip(g.index);
          } else {
            this.selectedIndex = g.index;
          }
        } else {
          this.selectedIndex = -1;
        }
        return;
      }
    }

    for (const s of this.equipSlots) {
      if (mx >= s.bg.x && mx <= s.bg.x + 60 && my >= s.bg.y && my <= s.bg.y + 60) {
        if (this.selectedIndex >= 0 && inventory[this.selectedIndex]) {
          this.onEquip(this.selectedIndex);
          this.selectedIndex = -1;
        } else if (equipment[s.slot]) {
          this.onUnequip(s.slot);
        }
        return;
      }
    }

    this.selectedIndex = -1;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
