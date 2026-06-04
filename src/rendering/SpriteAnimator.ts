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

export type MonkAnimName = 'idle' | 'run' | 'basic_strike' | 'dragon_palm' | 'whirlwind_kick' | 'meditate';

let monkFrames: Record<MonkAnimName, Texture[]> | null = null;
let pendingMonkSprites: AnimatedSprite[] = [];

function getFrames(classType: 'warrior' | 'ranger' | 'monk'): Record<AnimName, Texture[]> | null {
  if (classType === 'monk') return null;
  return classType === 'ranger' ? rangerFrames : warriorFrames;
}

export function isLoaded(classType: 'warrior' | 'ranger' | 'monk' = 'warrior'): boolean {
  return getFrames(classType) !== null;
}

export function isReaperLoaded(): boolean {
  return reaperFrames !== null;
}

export function isMonkLoaded(): boolean {
  return monkFrames !== null;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(objUrl); };
    img.onerror = () => { reject(); };
    img.src = objUrl;
  });
}

async function loadSheet(name: AnimName, url: string): Promise<Texture[]> {
  const img = await loadImage(url);
  const base = new BaseTexture(img);
  const frameCount = Math.floor(base.width / FRAME_W);
  const frames: Texture[] = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push(new Texture(base, new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H)));
  }
  return frames;
}

async function loadMultiRowSheet(url: string, frameW: number, frameH: number, totalFrames: number, cols: number): Promise<Texture[]> {
  const img = await loadImage(url);
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
  const results = await Promise.all(Array.from({ length: count }, async (_, i) => {
    const frameNum = i + 1;
    const url = `${baseUrl}/${filePattern.replace('{n}', String(frameNum))}`;
    try {
      const img = await loadImage(url);
      return new Texture(new BaseTexture(img));
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 288;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#44aa44';
      ctx.fillRect(0, 0, 288, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`${name}_${frameNum}`, 100, 64);
      return Texture.from(canvas);
    }
  }));
  return results;
}

export async function loadWarriorAnimations(): Promise<void> {
  if (warriorFrames) return;
  const entries: [AnimName, string][] = [
    ['attack', 'sprites/warrior/attack.png'],
    ['idle', 'sprites/warrior/idle.png'],
    ['walk', 'sprites/warrior/walk.png'],
  ];

  const results = await Promise.all(entries.map(async ([name, url]) => {
    try {
      return { name, frames: await loadSheet(name, url) };
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
      return { name, frames: [Texture.from(canvas), Texture.from(canvas), Texture.from(canvas)] };
    }
  }));

  const result = {} as Record<AnimName, Texture[]>;
  for (const { name, frames } of results) result[name] = frames;
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

  const [idle, walk, attack] = await Promise.all([
    loadRangerFrames('sprites/ranger', 'idle', 'idle_{n}.png', 12),
    loadRangerFrames('sprites/ranger', 'walk', 'run_{n}.png', 10),
    loadRangerFrames('sprites/ranger', 'attack', '2_atk_{n}.png', 15),
  ]);

  const result = { idle, walk, attack } as Record<AnimName, Texture[]>;
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
  const entries = Object.entries(REAPER_SHEETS) as [ReaperAnimName, typeof REAPER_SHEETS[ReaperAnimName]][];

  const results = await Promise.all(entries.map(async ([name, cfg]) => {
    try {
      return { name, frames: await loadMultiRowSheet(cfg.url, cfg.frameW, cfg.frameH, cfg.frames, cfg.cols) };
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#442266';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(name, 20, 52);
      return { name, frames: [Texture.from(canvas)] };
    }
  }));

  const result = {} as Record<ReaperAnimName, Texture[]>;
  for (const { name, frames } of results) result[name] = frames;
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
  const entries: [GolemAnimName, string, number][] = [
    ['idle', 'idle_{n}.png', 6],
    ['walk', 'walk_{n}.png', 10],
    ['attack', '1_atk_{n}.png', 14],
    ['death', 'death_{n}.png', 16],
  ];

  const results = await Promise.all(entries.map(async ([name, pattern, count]) => {
    try {
      return { name, frames: await loadRangerFrames('sprites/golem', name as AnimName, pattern, count) };
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#665544';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(name, 20, 52);
      return { name, frames: [Texture.from(canvas)] };
    }
  }));

  const result = {} as Record<GolemAnimName, Texture[]>;
  for (const { name, frames } of results) result[name] = frames;
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

const MONK_FRAME_CONFIGS: [MonkAnimName, string, number][] = [
  ['idle', 'idle_{n}.png', 6],
  ['run', 'run_{n}.png', 8],
  ['basic_strike', '1_atk_{n}.png', 6],
  ['dragon_palm', '2_atk_{n}.png', 12],
  ['whirlwind_kick', 'air_atk_{n}.png', 7],
  ['meditate', 'meditate_{n}.png', 16],
];

export async function loadMonkAnimations(): Promise<void> {
  if (monkFrames) return;

  const results = await Promise.all(MONK_FRAME_CONFIGS.map(async ([name, pattern, count]) => {
    try {
      return { name, frames: await loadRangerFrames('sprites/monk', name as AnimName, pattern, count) };
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#cc8844';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(name, 20, 52);
      return { name, frames: [Texture.from(canvas)] };
    }
  }));

  const result = {} as Record<MonkAnimName, Texture[]>;
  for (const { name, frames } of results) result[name] = frames;
  monkFrames = result;

  for (const sprite of pendingMonkSprites) {
    const f = monkFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingMonkSprites = [];
}

export function createMonkSprite(): AnimatedSprite {
  if (monkFrames && monkFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(monkFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0xcc8844;
  pendingMonkSprites.push(sprite);
  return sprite;
}

export function playMonkAnimation(sprite: AnimatedSprite, name: MonkAnimName, loop = true) {
  if (!monkFrames) return;
  const f = monkFrames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'basic_strike' || name === 'dragon_palm' ? 0.15 : 0.12;
  sprite.gotoAndPlay(0);
}

export type CultistAnimName = 'idle' | 'run' | 'attack' | 'death';

let cultistFrames: Record<CultistAnimName, Texture[]> | null = null;
let pendingCultistSprites: AnimatedSprite[] = [];

const CULTIST_SHEETS: Record<CultistAnimName, { url: string; frameW: number; frameH: number; frames: number; cols: number }> = {
  idle: { url: 'sprites/cultist/Idle.png', frameW: 231, frameH: 190, frames: 6, cols: 6 },
  run: { url: 'sprites/cultist/Run.png', frameW: 231, frameH: 190, frames: 8, cols: 8 },
  attack: { url: 'sprites/cultist/Attack1.png', frameW: 231, frameH: 190, frames: 8, cols: 8 },
  death: { url: 'sprites/cultist/Death.png', frameW: 231, frameH: 190, frames: 7, cols: 7 },
};

export async function loadCultistAnimations(): Promise<void> {
  if (cultistFrames) return;
  const entries = Object.entries(CULTIST_SHEETS) as [CultistAnimName, typeof CULTIST_SHEETS[CultistAnimName]][];

  const results = await Promise.all(entries.map(async ([name, cfg]) => {
    try {
      return { name, frames: await loadMultiRowSheet(cfg.url, cfg.frameW, cfg.frameH, cfg.frames, cfg.cols) };
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 231;
      canvas.height = 190;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#553366';
      ctx.fillRect(0, 0, 231, 190);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(name, 60, 100);
      return { name, frames: [Texture.from(canvas)] };
    }
  }));

  const result = {} as Record<CultistAnimName, Texture[]>;
  for (const { name, frames } of results) result[name] = frames;
  cultistFrames = result;

  for (const sprite of pendingCultistSprites) {
    const f = cultistFrames.idle;
    if (f && f.length > 0) {
      sprite.textures = f;
      sprite.tint = 0xffffff;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingCultistSprites = [];
}

export function createCultistSprite(): AnimatedSprite {
  if (cultistFrames && cultistFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(cultistFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x8844aa;
  pendingCultistSprites.push(sprite);
  return sprite;
}

export function playCultistAnimation(sprite: AnimatedSprite, name: CultistAnimName, loop = true) {
  if (!cultistFrames) return;
  const f = cultistFrames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.15 : 0.12;
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

// --- Juggernaut animated sprite ---
export type JuggernautAnimName = 'idle' | 'run' | 'attack';

let juggernautFrames: Record<JuggernautAnimName, Texture[]> | null = null;
let pendingJuggernautSprites: AnimatedSprite[] = [];

const JUGGERNAUT_SHEETS: Record<JuggernautAnimName, { url: string; frameW: number; frames: number }> = {
  idle: { url: 'sprites/juggernaut/juggernaut_idle.png', frameW: 200, frames: 5 },
  run: { url: 'sprites/juggernaut/juggernaut_run.png', frameW: 128, frames: 8 },
  attack: { url: 'sprites/juggernaut/juggernaut_attack.png', frameW: 112, frames: 9 },
};

export async function loadJuggernautAnimations(): Promise<void> {
  if (juggernautFrames) return;
  const result = {} as Record<JuggernautAnimName, Texture[]>;
  const entries = Object.entries(JUGGERNAUT_SHEETS) as [JuggernautAnimName, typeof JUGGERNAUT_SHEETS[JuggernautAnimName]][];

  const results = await Promise.all(entries.map(async ([name, cfg]) => {
    try {
      return { name, frames: await loadMultiRowSheet(cfg.url, cfg.frameW, 192, cfg.frames, cfg.frames) };
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = cfg.frameW;
      canvas.height = 192;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#5a3a2a';
      ctx.fillRect(0, 0, cfg.frameW, 192);
      return { name, frames: [Texture.from(canvas)] };
    }
  }));

  for (const { name, frames } of results) result[name] = frames;
  juggernautFrames = result;

  for (const sprite of pendingJuggernautSprites) {
    const f = juggernautFrames.idle;
    if (f.length > 0) {
      sprite.textures = f;
      sprite.animationSpeed = 0.12;
      sprite.play();
    }
  }
  pendingJuggernautSprites = [];
}

export function createJuggernautSprite(): AnimatedSprite {
  if (juggernautFrames && juggernautFrames.idle.length > 0) {
    const sprite = new AnimatedSprite(juggernautFrames.idle);
    sprite.anchor.set(0.5, 0.5);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  const sprite = new AnimatedSprite([Texture.WHITE]);
  sprite.anchor.set(0.5, 0.5);
  sprite.tint = 0x5a3a2a;
  pendingJuggernautSprites.push(sprite);
  return sprite;
}

export function playJuggernautAnimation(sprite: AnimatedSprite, name: JuggernautAnimName, loop = true) {
  if (!juggernautFrames) return;
  const f = juggernautFrames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.15 : 0.12;
  sprite.gotoAndPlay(0);
}

export function playAnimation(sprite: AnimatedSprite, name: AnimName, loop: boolean = true, classType: 'warrior' | 'ranger' | 'monk' = 'warrior') {
  if (classType === 'monk') return;
  const frames = getFrames(classType);
  if (!frames) return;
  const f = frames[name];
  if (!f || f.length === 0 || sprite.textures === f) return;
  sprite.textures = f;
  sprite.loop = loop;
  sprite.animationSpeed = name === 'attack' ? 0.2 : 0.12;
  sprite.gotoAndPlay(0);
}
