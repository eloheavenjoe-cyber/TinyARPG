import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Logger } from '../core/Logger';

export interface LootItem {
  type: 'gold' | 'healthPotion' | 'manaPotion';
  name: string;
  color: number;
  value: number;
}

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
      fontFamily: 'monospace',
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

export function createRandomLoot(x: number, y: number): ItemDrop[] {
  const drops: ItemDrop[] = [];

  const goldAmount = 1 + Math.floor(Math.random() * 6);
  drops.push(new ItemDrop(x, y, {
    type: 'gold',
    name: `${goldAmount} Gold`,
    color: 0xffd700,
    value: goldAmount,
  }));

  if (Math.random() < 0.35) {
    drops.push(new ItemDrop(x + (Math.random() - 0.5) * 30, y + 20, {
      type: 'healthPotion',
      name: 'Health Potion',
      color: 0xff4444,
      value: 30,
    }));
  }

  if (Math.random() < 0.2) {
    drops.push(new ItemDrop(x + (Math.random() - 0.5) * 30, y - 20, {
      type: 'manaPotion',
      name: 'Mana Potion',
      color: 0x4488ff,
      value: 20,
    }));
  }

  return drops;
}
