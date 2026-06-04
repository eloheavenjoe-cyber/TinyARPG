import { Logger } from './Logger';

export class InputManager {
  private keys: Set<string> = new Set();
  mouseX = 0;
  mouseY = 0;
  private mouseClicked = false;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        Logger.log('input', `Key pressed: ${e.code}`);
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseClicked = true;
        Logger.log('input', `Mouse clicked at (${this.mouseX.toFixed(0)}, ${this.mouseY.toFixed(0)})`);
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  consumeClick(): boolean {
    if (this.mouseClicked) {
      this.mouseClicked = false;
      return true;
    }
    return false;
  }

  reset(): void {
    this.keys.clear();
    this.mouseClicked = false;
  }
}
