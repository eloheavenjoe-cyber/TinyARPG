import { Texture } from 'pixi.js';
import { loadTileSheet } from './TileLoader';
import { TILE_CONFIGS, tileTextures, setTileTextures } from '../core/TileConfigs';
import { BiomeId } from '../core/ZoneConfig';

export class Sprites {
  static player: Texture;
  static ranger: Texture;
  static enemy: Texture;
  static archer: Texture;
  static cultist: Texture;
  static juggernaut: Texture;
  static golem: Texture;
  static reaper: Texture;
  static wall: Texture;
  static floor: Texture;
  static tree: Texture;
  static rock: Texture;
  static bush: Texture;
  static chestClosed: Texture;
  static chestOpen: Texture;
  static breakablePot: Texture;
  static breakableBarrel: Texture;
  static grassTuft: Texture;
  static flower: Texture;
  static buildVendor: Texture;
  static buildStash: Texture;
  static fountain: Texture;
  static statue: Texture;
  static pathTile: Texture;

  static generateAll(): void {

    Sprites.player = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#5a7ab5';
      ctx.fillRect(10, 0, 12, 6);
      ctx.fillStyle = '#e8c99b';
      ctx.fillRect(12, 4, 8, 5);
      ctx.fillStyle = '#4a6fa5';
      ctx.fillRect(8, 9, 16, 11);
      ctx.fillStyle = '#6a8ac5';
      ctx.fillRect(10, 10, 12, 2);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(8, 20, 16, 2);
      ctx.fillStyle = '#3a5a8a';
      ctx.fillRect(9, 22, 6, 6);
      ctx.fillRect(17, 22, 6, 6);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(8, 28, 7, 4);
      ctx.fillRect(17, 28, 7, 4);
    });

    Sprites.ranger = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#2d5a1e';
      ctx.fillRect(9, 0, 14, 6);
      ctx.fillStyle = '#e8c99b';
      ctx.fillRect(12, 4, 8, 5);
      ctx.fillStyle = '#3a7a28';
      ctx.fillRect(7, 9, 18, 11);
      ctx.fillStyle = '#4a9a35';
      ctx.fillRect(9, 10, 14, 2);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(8, 20, 16, 2);
      ctx.fillStyle = '#2a6a1a';
      ctx.fillRect(9, 22, 6, 6);
      ctx.fillRect(17, 22, 6, 6);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(8, 28, 7, 4);
      ctx.fillRect(17, 28, 7, 4);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(22, 6, 3, 14);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(22, 6, 1, 14);
    });

    Sprites.enemy = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#3a1010';
      ctx.fillRect(10, 2, 12, 8);
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(12, 4, 3, 3);
      ctx.fillRect(17, 4, 3, 3);
      ctx.fillStyle = '#4a1515';
      ctx.fillRect(8, 10, 16, 12);
      ctx.fillStyle = '#5a2020';
      ctx.fillRect(10, 12, 12, 4);
      ctx.fillStyle = '#3a0e0e';
      ctx.fillRect(9, 22, 6, 6);
      ctx.fillRect(17, 22, 6, 6);
      ctx.fillStyle = '#2a0808';
      ctx.fillRect(8, 28, 8, 4);
      ctx.fillRect(16, 28, 8, 4);
    });

    Sprites.archer = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#2a4a1a';
      ctx.fillRect(10, 2, 12, 6);
      ctx.fillStyle = '#cc3333';
      ctx.fillRect(13, 4, 2, 2);
      ctx.fillRect(17, 4, 2, 2);
      ctx.fillStyle = '#3a5a28';
      ctx.fillRect(8, 8, 16, 12);
      ctx.fillStyle = '#4a7a35';
      ctx.fillRect(10, 10, 12, 3);
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(22, 6, 4, 14);
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(23, 6, 2, 14);
      ctx.fillStyle = '#2a3a18';
      ctx.fillRect(9, 20, 14, 2);
      ctx.fillStyle = '#1a2a0e';
      ctx.fillRect(10, 22, 5, 6);
      ctx.fillRect(17, 22, 5, 6);
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(9, 28, 6, 4);
      ctx.fillRect(17, 28, 6, 4);
    });

    Sprites.cultist = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#2a0a3a';
      ctx.fillRect(9, 1, 14, 7);
      ctx.fillStyle = '#aa44dd';
      ctx.fillRect(12, 3, 3, 3);
      ctx.fillRect(17, 3, 3, 3);
      ctx.fillStyle = '#3a1050';
      ctx.fillRect(7, 8, 18, 14);
      ctx.fillStyle = '#4a1860';
      ctx.fillRect(9, 10, 14, 4);
      ctx.fillStyle = '#1a0525';
      ctx.fillRect(8, 22, 16, 2);
      ctx.fillStyle = '#2a0a3a';
      ctx.fillRect(9, 24, 5, 6);
      ctx.fillRect(18, 24, 5, 6);
      ctx.fillStyle = '#1a0425';
      ctx.fillRect(8, 28, 7, 4);
      ctx.fillRect(17, 28, 7, 4);
    });

    Sprites.juggernaut = Sprites.createTexture(48, 48, (ctx) => {
      ctx.fillStyle = '#2a0808';
      ctx.fillRect(14, 2, 20, 10);
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(18, 4, 5, 4);
      ctx.fillRect(25, 4, 5, 4);
      ctx.fillStyle = '#3a0e0e';
      ctx.fillRect(10, 12, 28, 18);
      ctx.fillStyle = '#4a1515';
      ctx.fillRect(14, 14, 20, 8);
      ctx.fillStyle = '#2a0808';
      ctx.fillRect(12, 30, 10, 10);
      ctx.fillRect(26, 30, 10, 10);
      ctx.fillStyle = '#1a0404';
      ctx.fillRect(10, 40, 12, 8);
      ctx.fillRect(26, 40, 12, 8);
    });

    Sprites.floor = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(15, 0, 1, 32);
      ctx.fillStyle = '#404040';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#383838';
      ctx.fillRect(4, 4, 24, 24);
    });

    Sprites.wall = Sprites.createTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(0, 7, 32, 1);
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(0, 23, 32, 1);
      ctx.fillRect(15, 0, 1, 8);
      ctx.fillRect(7, 8, 1, 8);
      ctx.fillRect(23, 8, 1, 8);
      ctx.fillRect(15, 16, 1, 8);
      ctx.fillRect(7, 24, 1, 8);
      ctx.fillRect(23, 24, 1, 8);
    });

    Sprites.golem = Sprites.createTexture(90, 80, (ctx) => {
      const ox = 44, oy = 44;
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(ox - 32, oy - 20, 64, 50);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(ox - 16, oy - 40, 32, 24);
      ctx.fillStyle = '#ff8844';
      ctx.fillRect(ox - 10, oy - 34, 6, 4);
      ctx.fillRect(ox + 4, oy - 34, 6, 4);
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(ox - 42, oy - 16, 12, 36);
      ctx.fillRect(ox + 30, oy - 16, 12, 36);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(ox - 44, oy + 16, 16, 12);
      ctx.fillRect(ox + 28, oy + 16, 16, 12);
      ctx.strokeStyle = '#ff8844';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(ox - 8, oy - 6);
      ctx.lineTo(ox, oy + 4);
      ctx.lineTo(ox + 8, oy - 6);
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(ox, oy + 28, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    Sprites.tree = Sprites.createTexture(48, 64, (ctx) => {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(20, 32, 8, 32);
      ctx.fillStyle = '#3a7a28';
      ctx.beginPath();
      ctx.arc(24, 24, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a6a1a';
      ctx.beginPath();
      ctx.arc(16, 20, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 20, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    Sprites.rock = Sprites.createTexture(36, 28, (ctx) => {
      ctx.fillStyle = '#6a6a6a';
      ctx.beginPath();
      ctx.ellipse(18, 22, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.ellipse(14, 18, 10, 12, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    Sprites.bush = Sprites.createTexture(32, 24, (ctx) => {
      ctx.fillStyle = '#2a6a1a';
      ctx.beginPath();
      ctx.ellipse(16, 18, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8a2a';
      ctx.beginPath();
      ctx.ellipse(10, 14, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(22, 14, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    Sprites.chestClosed = Sprites.createTexture(32, 24, (ctx) => {
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(4, 8, 24, 16);
      ctx.fillStyle = '#a07a4a';
      ctx.fillRect(4, 8, 24, 6);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(4, 8, 24, 2);
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(14, 14, 4, 4);
    });

    Sprites.chestOpen = Sprites.createTexture(32, 24, (ctx) => {
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(4, 12, 24, 12);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(4, 8, 24, 6);
      ctx.fillStyle = '#a07a4a';
      ctx.fillRect(4, 8, 24, 3);
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(14, 16, 4, 4);
    });

    Sprites.breakablePot = Sprites.createTexture(20, 24, (ctx) => {
      ctx.fillStyle = '#8a5030';
      ctx.fillRect(4, 8, 12, 14);
      ctx.fillStyle = '#9a6040';
      ctx.fillRect(6, 6, 8, 4);
      ctx.fillStyle = '#6a3a20';
      ctx.fillRect(2, 20, 4, 4);
      ctx.fillRect(14, 20, 4, 4);
    });

    Sprites.breakableBarrel = Sprites.createTexture(28, 28, (ctx) => {
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(2, 6, 24, 20);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(2, 6, 24, 3);
      ctx.fillRect(2, 23, 24, 3);
      ctx.fillRect(0, 12, 28, 2);
      ctx.fillRect(0, 18, 28, 2);
      ctx.fillStyle = '#4a2a0a';
      ctx.fillRect(10, 2, 8, 6);
    });

    Sprites.grassTuft = Sprites.createTexture(12, 12, (ctx) => {
      ctx.fillStyle = '#4a9a2a';
      ctx.fillRect(2, 6, 2, 6);
      ctx.fillRect(5, 4, 2, 8);
      ctx.fillRect(8, 6, 2, 6);
    });

    Sprites.flower = Sprites.createTexture(10, 12, (ctx) => {
      ctx.fillStyle = '#3a7a1a';
      ctx.fillRect(4, 6, 2, 6);
      ctx.fillStyle = '#ff6688';
      ctx.fillRect(3, 2, 4, 4);
      ctx.fillStyle = '#ffaa44';
      ctx.fillRect(4, 3, 2, 2);
    });

    Sprites.reaper = Sprites.createTexture(64, 68, (ctx) => {
      const ox = 24, oy = 40;
      ctx.fillStyle = '#2a1a2a';
      ctx.fillRect(ox - 16, oy - 12, 32, 40);
      ctx.fillStyle = '#1a0a1a';
      ctx.fillRect(ox - 14, oy - 24, 28, 20);
      ctx.fillStyle = '#334444';
      ctx.fillRect(ox - 6, oy - 18, 4, 6);
      ctx.fillRect(ox + 2, oy - 18, 4, 6);
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(ox - 5, oy - 17, 2, 2);
      ctx.fillRect(ox + 3, oy - 17, 2, 2);
      ctx.strokeStyle = '#5a3a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox + 18, oy - 20);
      ctx.lineTo(ox - 4, oy + 28);
      ctx.stroke();
      ctx.fillStyle = '#888899';
      ctx.beginPath();
      ctx.moveTo(ox + 20, oy - 22);
      ctx.lineTo(ox + 32, oy - 12);
      ctx.lineTo(ox + 14, oy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#442244';
      ctx.beginPath();
      ctx.ellipse(ox, oy + 28, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });


Sprites.buildVendor = Sprites.createTexture(160, 100, (ctx) => {
  // Wall — warm brown stone
  const wc = '#8a7a5a';
  ctx.fillStyle = wc;
  ctx.fillRect(0, 30, 160, 70);
  // Brick pattern
  ctx.strokeStyle = '#7a6a4a';
  ctx.lineWidth = 1;
  for (let row = 0; row < 7; row++) {
    const y = 30 + row * 10;
    const offset = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 20; col++) {
      const x = col * 16 + offset;
      ctx.strokeRect(x, y, 16, 10);
    }
  }
  // Roof — dark brown tiles
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(80, 0);
  ctx.lineTo(160, 30);
  ctx.closePath();
  ctx.fill();
  // Roof tile lines
  ctx.strokeStyle = '#4a2a0a';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    const lx = 80 * (1 - t);
    const rx = 160 - lx;
    const ly = 30 * (1 - t);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ly);
    ctx.stroke();
  }
  // Roof ridge line
  ctx.strokeStyle = '#4a2a0a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(80, 2);
  ctx.lineTo(160, 28);
  ctx.stroke();
  // Door — centered, wooden
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(68, 65, 24, 35);
  ctx.strokeStyle = '#4a2a0a';
  ctx.lineWidth = 1;
  ctx.strokeRect(68, 65, 24, 35);
  // Door handle
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(86, 80, 3, 3);
  // Windows
  ctx.fillStyle = '#88bbff';
  ctx.fillRect(22, 40, 24, 24);
  ctx.fillRect(114, 40, 24, 24);
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 40, 24, 24);
  ctx.strokeRect(114, 40, 24, 24);
  // Window cross
  ctx.beginPath();
  ctx.moveTo(34, 40); ctx.lineTo(34, 64);
  ctx.moveTo(22, 52); ctx.lineTo(46, 52);
  ctx.moveTo(126, 40); ctx.lineTo(126, 64);
  ctx.moveTo(114, 52); ctx.lineTo(138, 52);
  ctx.stroke();
  // Window glow
  ctx.fillStyle = '#ffeeaa';
  ctx.globalAlpha = 0.15;
  ctx.fillRect(23, 41, 22, 22);
  ctx.fillRect(115, 41, 22, 22);
  ctx.globalAlpha = 1;
  // Awning
  ctx.fillStyle = '#7a3a2a';
  ctx.fillRect(16, 34, 128, 8);
  ctx.fillStyle = '#6a2a1a';
  ctx.fillRect(16, 34, 128, 2);
  // Sign
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(62, 30, 36, 16);
  ctx.fillStyle = '#ffcc88';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SHOP', 80, 42);
});

Sprites.buildStash = Sprites.createTexture(160, 100, (ctx) => {
  // Wall — cool gray stone
  ctx.fillStyle = '#6a7a7a';
  ctx.fillRect(0, 30, 160, 70);
  // Stone block pattern
  ctx.strokeStyle = '#5a6a6a';
  ctx.lineWidth = 1;
  for (let row = 0; row < 5; row++) {
    const y = 38 + row * 12;
    const offset = row % 2 === 0 ? 0 : 12;
    for (let col = -1; col < 12; col++) {
      const x = col * 24 + offset;
      ctx.strokeRect(x, y, 24, 12);
    }
  }
  // Roof — slate blue
  ctx.fillStyle = '#3a4a5a';
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(80, 0);
  ctx.lineTo(160, 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    const lx = 80 * (1 - t);
    const rx = 160 - lx;
    const ly = 30 * (1 - t);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ly);
    ctx.stroke();
  }
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(80, 2);
  ctx.lineTo(160, 28);
  ctx.stroke();
  // Double door
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(64, 65, 14, 35);
  ctx.fillRect(82, 65, 14, 35);
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1;
  ctx.strokeRect(64, 65, 14, 35);
  ctx.strokeRect(82, 65, 14, 35);
  // Door handles
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(75, 80, 3, 3);
  ctx.fillRect(83, 80, 3, 3);
  // Windows — barred
  ctx.fillStyle = '#446688';
  ctx.fillRect(20, 40, 22, 22);
  ctx.fillRect(118, 40, 22, 22);
  ctx.strokeStyle = '#5a6a7a';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 40, 22, 22);
  ctx.strokeRect(118, 40, 22, 22);
  // Bars
  ctx.strokeStyle = '#5a6a7a';
  ctx.lineWidth = 1;
  for (let bar = 0; bar < 3; bar++) {
    const bx = 20 + 6 + bar * 5;
    ctx.beginPath();
    ctx.moveTo(bx, 40); ctx.lineTo(bx, 62);
    ctx.moveTo(bx + 98, 40); ctx.lineTo(bx + 98, 62);
    ctx.stroke();
  }
  // Awning
  ctx.fillStyle = '#2a4a5a';
  ctx.fillRect(14, 34, 132, 8);
  ctx.fillStyle = '#1a3a4a';
  ctx.fillRect(14, 34, 132, 2);
  // Sign
  ctx.fillStyle = '#3a4a4a';
  ctx.fillRect(60, 30, 40, 16);
  ctx.fillStyle = '#88ccff';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STASH', 80, 42);
});

Sprites.fountain = Sprites.createTexture(64, 48, (ctx) => {
  // Base — wide stone ring
  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath();
  ctx.ellipse(32, 40, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a7a8a';
  ctx.beginPath();
  ctx.ellipse(32, 38, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Middle tier
  ctx.fillStyle = '#5a5a6a';
  ctx.beginPath();
  ctx.ellipse(32, 32, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath();
  ctx.ellipse(32, 30, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Center pillar
  ctx.fillStyle = '#8a8a9a';
  ctx.fillRect(28, 10, 8, 24);
  ctx.fillStyle = '#9a9aaa';
  ctx.fillRect(30, 8, 4, 6);
  // Water surface — blue tint
  ctx.fillStyle = '#4488cc';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(32, 36, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Stone rim highlight
  ctx.strokeStyle = '#8a8a9a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(32, 38, 24, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
});

Sprites.statue = Sprites.createTexture(24, 40, (ctx) => {
  // Pedestal
  ctx.fillStyle = '#7a7a6a';
  ctx.fillRect(4, 28, 16, 12);
  ctx.fillStyle = '#8a8a7a';
  ctx.fillRect(2, 30, 20, 8);
  // Body
  ctx.fillStyle = '#9a9a8a';
  ctx.fillRect(7, 12, 10, 18);
  // Head
  ctx.fillStyle = '#aaaa8a';
  ctx.fillRect(8, 4, 8, 10);
  // Arms
  ctx.fillRect(3, 14, 5, 3);
  ctx.fillRect(16, 14, 5, 3);
  // Sword (right arm held out)
  ctx.strokeStyle = '#ccccaa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 15);
  ctx.lineTo(22, 6);
  ctx.stroke();
  // Base shadow
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.ellipse(12, 40, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
});

Sprites.pathTile = Sprites.createTexture(32, 32, (ctx) => {
  // Stone tile base
  ctx.fillStyle = '#7a7a6a';
  ctx.fillRect(0, 0, 32, 32);
  // Stone texture noise
  ctx.fillStyle = '#6a6a5a';
  ctx.fillRect(2, 2, 12, 14);
  ctx.fillRect(18, 4, 10, 10);
  ctx.fillRect(4, 20, 20, 8);
  ctx.fillRect(26, 16, 4, 14);
  // Mortar lines
  ctx.strokeStyle = '#5a5a4a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 32, 32);
  ctx.strokeRect(0, 15, 32, 1);
  ctx.strokeRect(15, 0, 1, 32);
  // Highlight
  ctx.fillStyle = '#8a8a7a';
  ctx.fillRect(1, 1, 6, 6);
  ctx.fillRect(16, 16, 6, 6);
});

  }

  private static createTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);
    return Texture.from(canvas);
  }
}

export async function loadTileSet(biomeId: string): Promise<void> {
  const config = TILE_CONFIGS[biomeId as BiomeId];
  if (!config) return;
  const textures = await loadTileSheet(config.sheetUrl, config.jsonUrl);
  setTileTextures({ ...tileTextures, ...textures });
}
