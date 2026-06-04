import { Texture, AnimatedSprite, Rectangle, BaseTexture } from 'pixi.js';

const FRAME_W = 96;
const FRAME_H = 84;

export type AnimName = 'idle' | 'walk' | 'attack';

let cachedFrames: Record<AnimName, Texture[]> | null = null;
let pendingSprites: AnimatedSprite[] = [];

export function isLoaded(): boolean {
  return cachedFrames !== null;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(objUrl); };
    img.onerror = () => { console.error(`[SpriteAnimator] failed: ${url} (${blob.size} bytes)`); reject(); };
    img.src = objUrl;
  });
}

async function loadSheet(name: AnimName, url: string): Promise<Texture[]> {
  const img = await loadImage(url);
  console.log(`[SpriteAnimator] ${name}: ${img.width}x${img.height}`);
  const base = new BaseTexture(img);
  const frameCount = Math.floor(base.width / FRAME_W);
  const frames: Texture[] = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push(new Texture(base, new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H)));
  }
  console.log(`[SpriteAnimator] ${name}: ${frameCount} frames`);
  return frames;
}

export async function loadWarriorAnimations(): Promise<void> {
  if (cachedFrames) return;
  const result = {} as Record<AnimName, Texture[]>;
  const entries: [AnimName, string][] = [
    ['attack', 'sprites/warrior/attack.png'],
    ['idle', 'sprites/warrior/idle.png'],
    ['walk', 'sprites/warrior/walk.png'],
  ];

  for (const [name, url] of entries) {
    try {
      result[name] = await loadSheet(name, url);
    } catch {
      console.warn(`[SpriteAnimator] fallback for ${name}`);
      const canvas = document.createElement('canvas');
      canvas.width = FRAME_W;
      canvas.height = FRAME_H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#8844aa';
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(name, 24, 48);
      result[name] = [Texture.from(canvas), Texture.from(canvas), Texture.from(canvas)];
    }
  }

  cachedFrames = result;

  for (const sprite of pendingSprites) {
    const f = cachedFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingSprites = [];
}

export function createWarriorSprite(): AnimatedSprite {
  if (cachedFrames && cachedFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(cachedFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x8844aa;
  pendingSprites.push(sprite);
  return sprite;
}

export function playAnimation(sprite: AnimatedSprite, name: AnimName, loop: boolean = true) {
  if (!cachedFrames) return;
  const frames = cachedFrames[name];
  if (!frames || frames.length === 0 || sprite.textures === frames) return;
  sprite.textures = frames;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.2 : 0.12;
  sprite.gotoAndPlay(0);
}
