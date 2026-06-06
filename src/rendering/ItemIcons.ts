import { Texture, BaseTexture, Rectangle } from 'pixi.js';

const SHEET_PATH = 'sprites/items.png';
const CELL = 24;

let loaded = false;
let textures: Map<string, Texture> = new Map();

const BASE_ICONS: Record<string, { col: number; row: number }> = {
  sword_normal:  { col: 0, row: 7 },
  sword_magic:   { col: 7, row: 7 },
  sword_rare:    { col: 6, row: 7 },
  sword_unique:  { col: 7, row: 8 },
  bow_normal:    { col: 6, row: 11 },
  bow_magic:     { col: 6, row: 11 },
  bow_rare:      { col: 8, row: 12 },
  bow_unique:    { col: 8, row: 12 },
  body_normal:   { col: 0, row: 13 },
  body_magic:    { col: 0, row: 13 },
  body_rare:     { col: 1, row: 13 },
  body_unique:   { col: 2, row: 13 },
  helmet_normal: { col: 0, row: 12 },
  helmet_magic:  { col: 0, row: 12 },
  helmet_rare:   { col: 1, row: 12 },
  helmet_unique: { col: 2, row: 12 },
  boots_normal:  { col: 0, row: 15 },
  boots_magic:   { col: 3, row: 15 },
  boots_rare:    { col: 1, row: 15 },
  boots_unique:  { col: 2, row: 15 },
  ring_normal:   { col: 15, row: 3 },
  ring_magic:    { col: 14, row: 3 },
  ring_rare:     { col: 13, row: 3 },
  ring_unique:   { col: 12, row: 3 },
  amulet_normal: { col: 7, row: 14 },
  amulet_magic:  { col: 6, row: 15 },
  amulet_rare:   { col: 6, row: 14 },
  amulet_unique: { col: 8, row: 13 },
};

const JEWEL_ICONS: Record<string, { col: number; row: number }> = {
  jewel_normal: { col: 11, row: 0 },
  jewel_magic:  { col: 12, row: 0 },
  jewel_rare:   { col: 13, row: 0 },
};

const ORB_ICONS: Record<string, { col: number; row: number }> = {
  mutation:      { col: 9, row: 10 },
  purification:  { col: 9, row: 12 },
  empowerment:   { col: 9, row: 11 },
  flux:          { col: 9, row: 14 },
  growth:        { col: 9, row: 9 },
  ascendance:    { col: 9, row: 7 },
  portal_scroll: { col: 10, row: 0 },
  drilling:      { col: 11, row: 1 },
  shattering:    { col: 12, row: 1 },
  preservation:  { col: 13, row: 1 },
};

export function loadItemIcons(): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const base = new BaseTexture(img);
      for (const [key, pos] of Object.entries(BASE_ICONS)) {
        const tex = new Texture(base, new Rectangle(pos.col * CELL, pos.row * CELL, CELL, CELL));
        textures.set(key, tex);
      }
      for (const [key, pos] of Object.entries(ORB_ICONS)) {
        const tex = new Texture(base, new Rectangle(pos.col * CELL, pos.row * CELL, CELL, CELL));
        textures.set(key, tex);
      }
      for (const [key, pos] of Object.entries(JEWEL_ICONS)) {
        const tex = new Texture(base, new Rectangle(pos.col * CELL, pos.row * CELL, CELL, CELL));
        textures.set(key, tex);
      }
      loaded = true;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = SHEET_PATH;
  });
}

export function getItemTexture(key: string): Texture | undefined {
  return textures.get(key);
}

export function isItemIconsLoaded(): boolean {
  return loaded;
}
