import { Texture } from 'pixi.js';

export class Sprites {
  static player: Texture;
  static ranger: Texture;
  static enemy: Texture;
  static juggernaut: Texture;
  static wall: Texture;
  static floor: Texture;

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
