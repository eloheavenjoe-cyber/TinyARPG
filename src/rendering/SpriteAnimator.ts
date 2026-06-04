import { Texture, AnimatedSprite, Rectangle, BaseTexture } from 'pixi.js';

const FRAME_W = 96;
const FRAME_H = 84;

export type AnimName = 'idle' | 'walk' | 'attack';
export type ReaperAnimName = 'idle' | 'attack' | 'death' | 'summon';
export type GolemAnimName = 'idle' | 'walk' | 'attack' | 'death';

let warriorFrames: Record<AnimName, Texture[]> | null = null;
let rangerFrames: Record<AnimName, Texture[]> | null = null;
let reaperFrames: Record<ReaperAnimName, Texture[]> | null = null;
let golemFrames: Record<GolemAnimName, Texture[]> | null = null;
let pendingWarriorSprites: AnimatedSprite[] = [];
let pendingRangerSprites: AnimatedSprite[] = [];
let pendingReaperSprites: AnimatedSprite[] = [];
let pendingGolemSprites: AnimatedSprite[] = [];

function getFrames(classType: 'warrior' | 'ranger'): Record<AnimName, Texture[]> | null {
  return classType === 'ranger' ? rangerFrames : warriorFrames;
}

export function isLoaded(classType: 'warrior' | 'ranger' = 'warrior'): boolean {
  return getFrames(classType) !== null;
}

export function isReaperLoaded(): boolean {
  return reaperFrames !== null;
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

async function loadMultiRowSheet(url: string, frameW: number, frameH: number, totalFrames: number, cols: number): Promise<Texture[]> {
  const img = await loadImage(url);
  console.log(`[SpriteAnimator] multi-row: ${url} ${img.width}x${img.height} -> ${frameW}x${frameH} ${totalFrames}f ${cols}cols`);
  const base = new BaseTexture(img);
  const frames: Texture[] = [];
  for (let i = 0; i < totalFrames; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    frames.push(new Texture(base, new Rectangle(col * frameW, row * frameH, frameW, frameH)));
  }
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
  result.attack = await loadRangerFrames('sprites/ranger', 'attack', '2_atk_{n}.png', 15);

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

const REAPER_SHEETS: Record<ReaperAnimName, { url: string; frameW: number; frameH: number; frames: number; cols: number }> = {
  idle: { url: 'sprites/reaper/idle2.png', frameW: 100, frameH: 100, frames: 8, cols: 4 },
  attack: { url: 'sprites/reaper/attacking.png', frameW: 100, frameH: 100, frames: 14, cols: 6 },
  death: { url: 'sprites/reaper/death.png', frameW: 125, frameH: 100, frames: 10, cols: 8 },
  summon: { url: 'sprites/reaper/summon.png', frameW: 100, frameH: 100, frames: 5, cols: 4 },
};

export async function loadReaperAnimations(): Promise<void> {
  if (reaperFrames) return;
  const result = {} as Record<ReaperAnimName, Texture[]>;
  const entries = Object.entries(REAPER_SHEETS) as [ReaperAnimName, typeof REAPER_SHEETS[ReaperAnimName]][];

  for (const [name, cfg] of entries) {
    try {
      result[name] = await loadMultiRowSheet(cfg.url, cfg.frameW, cfg.frameH, cfg.frames, cfg.cols);
    } catch {
      console.warn(`[SpriteAnimator] fallback for reaper ${name}`);
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#442266';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(name, 20, 52);
      result[name] = [Texture.from(canvas)];
    }
  }

  reaperFrames = result;

  for (const sprite of pendingReaperSprites) {
    const f = reaperFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.1;
      sprite.play();
    }
  }
  pendingReaperSprites = [];
}

export function createReaperSprite(): AnimatedSprite {
  if (reaperFrames && reaperFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(reaperFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.1;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x8844aa;
  pendingReaperSprites.push(sprite);
  return sprite;
}

export function playReaperAnimation(sprite: AnimatedSprite, name: ReaperAnimName, loop = true) {
  if (!reaperFrames) return;
  const f = reaperFrames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'idle' ? 0.1 : 0.15;
  sprite.gotoAndPlay(0);
}

export async function loadGolemAnimations(): Promise<void> {
  if (golemFrames) return;
  const result = {} as Record<GolemAnimName, Texture[]>;
  const entries: [GolemAnimName, string, number][] = [
    ['idle', 'idle_{n}.png', 6],
    ['walk', 'walk_{n}.png', 10],
    ['attack', '1_atk_{n}.png', 14],
    ['death', 'death_{n}.png', 16],
  ];

  for (const [name, pattern, count] of entries) {
    try {
      result[name] = await loadRangerFrames('sprites/golem', name as AnimName, pattern, count);
    } catch {
      console.warn(`[SpriteAnimator] fallback for golem ${name}`);
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#665544';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(name, 20, 52);
      result[name] = [Texture.from(canvas)];
    }
  }

  golemFrames = result;

  for (const sprite of pendingGolemSprites) {
    const f = golemFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.1;
      sprite.play();
    }
  }
  pendingGolemSprites = [];
}

export function createGolemSprite(): AnimatedSprite {
  if (golemFrames && golemFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(golemFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.1;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x886644;
  pendingGolemSprites.push(sprite);
  return sprite;
}

export function playGolemAnimation(sprite: AnimatedSprite, name: GolemAnimName, loop = true) {
  if (!golemFrames) return;
  const f = golemFrames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.15 : name === 'death' ? 0.1 : 0.12;
  sprite.gotoAndPlay(0);
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
