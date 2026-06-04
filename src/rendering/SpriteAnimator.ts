import { Texture, AnimatedSprite, Rectangle, BaseTexture } from 'pixi.js';

const FRAME_W = 96;
const FRAME_H = 84;

export type AnimName = 'idle' | 'walk' | 'attack';

const ANIM_URLS: Record<AnimName, string> = {
  idle: 'sprites/warrior/idle.png',
  walk: 'sprites/warrior/walk.png',
  attack: 'sprites/warrior/attack.png',
};

let cachedFrames: Record<AnimName, Texture[]> | null = null;

export function isLoaded(): boolean {
  return cachedFrames !== null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

export async function loadWarriorAnimations(): Promise<void> {
  if (cachedFrames) return;
  const result = {} as Record<AnimName, Texture[]>;

  for (const [name, url] of Object.entries(ANIM_URLS) as [AnimName, string][]) {
    try {
      const img = await loadImage(url);
      const base = new BaseTexture(img);
      const frameCount = Math.floor(base.width / FRAME_W);
      const frames: Texture[] = [];
      for (let i = 0; i < frameCount; i++) {
        frames.push(new Texture(base, new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H)));
      }
      result[name] = frames;
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = FRAME_W;
      canvas.height = FRAME_H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#8844aa';
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(name, 24, 48);
      const tex = Texture.from(canvas);
      result[name] = [tex, tex, tex, tex, tex, tex, tex, tex];
    }
  }

  cachedFrames = result;
}

export function createWarriorSprite(): AnimatedSprite {
  if (!cachedFrames) {
    const sprite = new AnimatedSprite([Texture.WHITE]);
    sprite.anchor.set(0.5, 0.5);
    sprite.tint = 0x8844aa;
    return sprite;
  }
  const sprite = new AnimatedSprite(cachedFrames.idle);
  sprite.anchor.set(0.5, 0.5);
  sprite.animationSpeed = 0.12;
  sprite.play();
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
