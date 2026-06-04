import { Assets, Texture, AnimatedSprite, Rectangle } from 'pixi.js';

const FRAME_COUNT = 8;
const FRAME_W = 96;
const FRAME_H = 84;

export type AnimName = 'idle' | 'walk' | 'attack';

const ANIM_URLS: Record<AnimName, string> = {
  idle: '/sprites/warrior/idle.png',
  walk: '/sprites/warrior/walk.png',
  attack: '/sprites/warrior/attack.png',
};

let cachedFrames: Record<AnimName, Texture[]> | null = null;

export function isLoaded(): boolean {
  return cachedFrames !== null;
}

export async function loadWarriorAnimations(): Promise<void> {
  if (cachedFrames) return;
  const result = {} as Record<AnimName, Texture[]>;
  const entries = Object.entries(ANIM_URLS) as [AnimName, string][];

  for (const [name, url] of entries) {
    try {
      const tex = await Assets.load(url);
      const base = tex.baseTexture;
      const frames: Texture[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        frames.push(new Texture(base, new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H)));
      }
      result[name] = frames;
    } catch {
      // If file doesn't exist yet, create placeholder colored frames
      const canvas = document.createElement('canvas');
      canvas.width = FRAME_W;
      canvas.height = FRAME_H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = name === 'idle' ? '#4466aa' : name === 'walk' ? '#4488cc' : '#cc6644';
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(name, 24, 48);
      const placeholder = Texture.from(canvas);
      const frames: Texture[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        frames.push(placeholder);
      }
      result[name] = frames;
    }
  }

  cachedFrames = result;
}

export function createWarriorSprite(): AnimatedSprite {
  if (!cachedFrames) {
    const canvas = document.createElement('canvas');
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8844aa';
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);
    const placeholder = Texture.from(canvas);
    const sprite = new AnimatedSprite([placeholder]);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.15;
    return sprite;
  }

  const sprite = new AnimatedSprite(cachedFrames.idle);
  sprite.anchor.set(0.5, 0.5);
  sprite.animationSpeed = 0.15;
  sprite.play();
  return sprite;
}

export function playAnimation(sprite: AnimatedSprite, name: AnimName, loop: boolean = true) {
  if (!cachedFrames) return;
  const frames = cachedFrames[name];
  if (!frames || sprite.textures === frames) return;
  sprite.textures = frames;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.25 : 0.15;
  sprite.gotoAndPlay(0);
}
