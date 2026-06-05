import { GeneratedItem, generateVendorItem } from './ItemGenerator';
import { ITEM_BASES } from './ItemDefs';

export interface VendorStockItem {
  id: string;
  item: GeneratedItem;
  buyPrice: number;
}

const BASE_PRICES: Record<string, number> = {
  sword: 5, bow: 5, body: 8, helmet: 6, boots: 6, ring: 12, amulet: 15,
};

const RARITY_MULT: Record<string, number> = {
  normal: 1, magic: 2, rare: 5, unique: 15,
};

export function calculateSellPrice(item: GeneratedItem): number {
  const base = BASE_PRICES[item.base.id] || 5;
  const rarityMult = RARITY_MULT[item.rarity] || 1;
  const affixBonus = item.affixes.reduce((sum, a) => sum + a.affix.tier * 2, 0);
  return base * rarityMult + affixBonus;
}

export function generateVendorStock(playerLevel: number): VendorStockItem[] {
  const count = 8 + Math.floor(Math.random() * 5);
  const stock: VendorStockItem[] = [];
  for (let i = 0; i < count; i++) {
    const weighting = { normal: 40, magic: 40, rare: 15, unique: 5 };
    const item = generateVendorItem(playerLevel, weighting);
    const sellPrice = calculateSellPrice(item);
    stock.push({ id: `vs_${Date.now()}_${i}`, item, buyPrice: sellPrice * 3 });
  }
  return stock;
}
