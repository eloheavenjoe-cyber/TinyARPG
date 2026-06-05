import { Texture, BaseTexture, Rectangle } from 'pixi.js';

interface TileFrame {
  x: number; y: number; w: number; h: number;
  seamless?: boolean;
}

interface TileSheetData {
  file: string;
  tiles: Record<string, TileFrame>;
}

export async function loadTileSheet(sheetUrl: string, jsonUrl: string): Promise<Record<string, Texture>> {
  const [jsonRes, pngRes] = await Promise.all([
    fetch(jsonUrl).then(r => r.json() as Promise<TileSheetData>),
    fetch(sheetUrl).then(r => r.blob()),
  ]);

  const blobUrl = URL.createObjectURL(pngRes);
  const img = new Image();
  img.src = blobUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const base = new BaseTexture(img);
  const textures: Record<string, Texture> = {};

  for (const [name, frame] of Object.entries(jsonRes.tiles)) {
    textures[name] = new Texture(base, new Rectangle(frame.x, frame.y, frame.w, frame.h));
  }

  URL.revokeObjectURL(blobUrl);
  return textures;
}
