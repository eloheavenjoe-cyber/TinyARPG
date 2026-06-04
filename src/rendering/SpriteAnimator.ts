import { Texture, AnimatedSprite, Rectangle, BaseTexture } from 'pixi.js';

const FRAME_W = 96;
const FRAME_H = 84;

export type AnimName = 'idle' | 'walk' | 'attack';

let warriorFrames: Record<AnimName, Texture[]> | null = null;
let rangerFrames: Record<AnimName, Texture[]> | null = null;
let pendingWarriorSprites: AnimatedSprite[] = [];
let pendingRangerSprites: AnimatedSprite[] = [];

function getFrames(classType: 'warrior' | 'ranger'): Record<AnimName, Texture[]> | null {
  return classType === 'ranger' ? rangerFrames : warriorFrames;
}

export function isLoaded(classType: 'warrior' | 'ranger' = 'warrior'): boolean {
  return getFrames(classType) !== null;
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

async function loadRangerFrames(baseUrl: string, name: AnimName, filePattern: string, count: number): Promise<Texture[]> {
  const frames: Texture[] = [];
  for (let i = 1; i <= count; i++) {
    const url = `${baseUrl}/${filePattern.replace('{n}', String(i))}`;
    try {
      const img = await loadImage(url);
      console.log(`[SpriteAnimator] ranger ${name} frame ${i}: ${img.width}x${img.height}`);
      frames.push(new Texture(new BaseTexture(img)));
    } catch {
      console.warn(`[SpriteAnimator] fallback for ranger ${name} frame ${i}`);
      const canvas = document.createElement('canvas');
      canvas.width = 288;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#44aa44';
      ctx.fillRect(0, 0, 288, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`${name}_${i}`, 100, 64);
      frames.push(Texture.from(canvas));
    }
  }
  return frames;
}

export async function loadWarriorAnimations(): Promise<void> {
  if (warriorFrames) return;
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

  warriorFrames = result;

  for (const sprite of pendingWarriorSprites) {
    const f = warriorFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingWarriorSprites = [];
}

export async function loadRangerAnimations(): Promise<void> {
  if (rangerFrames) return;
  const result = {} as Record<AnimName, Texture[]>;

  result.idle = await loadRangerFrames('sprites/ranger', 'idle', 'idle_{n}.png', 12);
  result.walk = await loadRangerFrames('sprites/ranger', 'walk', 'run_{n}.png', 10);
  result.attack = await loadRangerFrames('sprites/ranger', 'attack', '1_atk_{n}.png', 10);

  rangerFrames = result;

  for (const sprite of pendingRangerSprites) {
    const f = rangerFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingRangerSprites = [];
}

export function createWarriorSprite(): AnimatedSprite {
  if (warriorFrames && warriorFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(warriorFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x8844aa;
  pendingWarriorSprites.push(sprite);
  return sprite;
}

export function createRangerSprite(): AnimatedSprite {
  if (rangerFrames && rangerFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(rangerFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x44aa44;
  pendingRangerSprites.push(sprite);
  return sprite;
}

export function playAnimation(sprite: AnimatedSprite, name: AnimName, loop: boolean = true, classType: 'warrior' | 'ranger' = 'warrior') {
  const frames = getFrames(classType);
  if (!frames) return;
  const f = frames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.2 : 0.12;
  sprite.gotoAndPlay(0);
}
