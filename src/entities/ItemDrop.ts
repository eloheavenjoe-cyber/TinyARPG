import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Logger } from '../core/Logger';
import { GeneratedItem, generateItemName } from '../core/ItemGenerator';

export interface ConsumableItem {
  type: 'gold' | 'healthPotion' | 'manaPotion' | 'portalScroll';
  name: string;
  color: number;
  value: number;
}

export interface EquippableItem {
  type: 'item';
  name: string;
  color: number;
  generated: GeneratedItem;
}

export interface OrbItem {
  type: 'orb';
  name: string;
  color: number;
  orbId: string;
  count: number;
}

export interface JewelItem {
  type: 'jewel';
  name: string;
  color: number;
  generated: GeneratedItem;
}

export type LootItem = ConsumableItem | EquippableItem | OrbItem | JewelItem;

const RARITY_COLORS: Record<string, number> = {
  normal: 0xffffff,
  magic: 0x4488ff,
  rare: 0xffcc00,
  unique: 0xff6600,
};

export class ItemDrop {
  x: number;
  y: number;
  item: LootItem;
  pickedUp = false;

  container: Container;
  private text: Text;
  private bg: Graphics;

  constructor(x: number, y: number, item: LootItem) {
    this.x = x;
    this.y = y;
    this.item = item;
    this.container = new Container();

    this.text = new Text(item.name, new TextStyle({
      fontFamily: 'MedievalSharp, serif',
      fontSize: 13,
      fill: item.color,
      stroke: 0x000000,
      strokeThickness: 3,
      fontWeight: 'bold',
    }));
    this.text.anchor.set(0.5, 0.5);

    this.bg = new Graphics();
    this.bg.beginFill(0x000000, 0.55);
    this.bg.drawRoundedRect(-this.text.width / 2 - 6, -10, this.text.width + 12, 20, 4);
    this.bg.endFill();

    const border = new Graphics();
    border.lineStyle(1, item.color, 0.4);
    border.drawRoundedRect(-this.text.width / 2 - 6, -10, this.text.width + 12, 20, 4);

    this.container.addChild(this.bg, border, this.text);
    this.container.x = x;
    this.container.y = y;
  }

  pickup(): LootItem {
    this.pickedUp = true;
    Logger.log('combat', `Item picked up: ${this.item.name}`);
    return this.item;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}

export function isEquippableDrop(drop: ItemDrop): drop is ItemDrop & { item: EquippableItem } {
  return drop.item.type === 'item';
}

export function createOrbDrop(x: number, y: number, orbId: string, name: string): ItemDrop {
  return new ItemDrop(x, y, {
    type: 'orb', name, color: 0x44dddd, orbId, count: 1,
  });
}

export function isOrbDrop(drop: ItemDrop): drop is ItemDrop & { item: OrbItem } {
  return drop.item.type === 'orb';
}

export function isJewelDrop(drop: ItemDrop): drop is ItemDrop & { item: JewelItem } {
  return drop.item.type === 'jewel';
}

export function isPortalScrollDrop(drop: ItemDrop): drop is ItemDrop & { item: ConsumableItem } {
  return drop.item.type === 'portalScroll';
}

export function createJewelDrop(x: number, y: number, generated: GeneratedItem): ItemDrop {
  const rarityColors: Record<string, number> = {
    normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00,
  };
  const color = generated.affixes.length >= 4 ? 0xff8800 : (rarityColors[generated.rarity] || 0xffffff);
  return new ItemDrop(x, y, {
    type: 'jewel',
    name: generateItemName(generated),
    color,
    generated,
  });
}

export function createItemDrop(x: number, y: number, generated: GeneratedItem): ItemDrop {
  const socketSuffix = generated.socketSlots && generated.maxSockets > 0
    ? ` (${generated.socketSlots.length})` : '';
  return new ItemDrop(x, y, {
    type: 'item',
    name: `${generateItemName(generated)}${socketSuffix}`,
    color: RARITY_COLORS[generated.rarity] || 0xffffff,
    generated,
  });
}

export function createRandomLoot(x: number, y: number, quantityMult: number = 1): ItemDrop[] {
  const drops: ItemDrop[] = [];

  const goldAmount = Math.round((1 + Math.floor(Math.random() * 6)) * quantityMult);
  if (goldAmount > 0) {
    drops.push(new ItemDrop(x, y, {
      type: 'gold',
      name: `${goldAmount} Gold`,
      color: 0xffd700,
      value: goldAmount,
    }));
  }

  for (let i = 0; i < Math.ceil(quantityMult); i++) {
    if (Math.random() < 0.35) {
      drops.push(new ItemDrop(x + (Math.random() - 0.5) * 30, y + 20, {
        type: 'healthPotion',
        name: 'Health Potion',
        color: 0xff4444,
        value: 30,
      }));
    }
  }

  for (let i = 0; i < Math.ceil(quantityMult); i++) {
    if (Math.random() < 0.2) {
      drops.push(new ItemDrop(x + (Math.random() - 0.5) * 30, y - 20, {
        type: 'manaPotion',
        name: 'Mana Potion',
        color: 0x4488ff,
        value: 20,
      }));
    }
  }

  for (let i = 0; i < Math.ceil(quantityMult); i++) {
    if (Math.random() < 0.08) {
      drops.push(new ItemDrop(x + (Math.random() - 0.5) * 30, y + 30, {
        type: 'portalScroll', name: 'Portal Scroll', color: 0xaa66ff, value: 1,
      }));
    }
  }

  return drops;
}
