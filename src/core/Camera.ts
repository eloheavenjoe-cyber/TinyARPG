export class Camera {
  x = 0;
  y = 0;
  private targetX = 0;
  private targetY = 0;
  private readonly lerpSpeed = 0.05;
  private clampMinX: number;
  private clampMinY: number;
  private clampMaxX: number;
  private clampMaxY: number;

  constructor(
    private screenWidth: number,
    private screenHeight: number,
    private roomWidth: number,
    private roomHeight: number,
    clampBounds?: { x: number; y: number; width: number; height: number },
  ) {
    if (clampBounds) {
      this.clampMinX = clampBounds.x;
      this.clampMinY = clampBounds.y;
      this.clampMaxX = clampBounds.x + clampBounds.width;
      this.clampMaxY = clampBounds.y + clampBounds.height;
    } else {
      this.clampMinX = 0;
      this.clampMinY = 0;
      this.clampMaxX = roomWidth;
      this.clampMaxY = roomHeight;
    }
  }

  setClampBounds(bounds?: { x: number; y: number; width: number; height: number }) {
    if (bounds) {
      this.clampMinX = bounds.x;
      this.clampMinY = bounds.y;
      this.clampMaxX = bounds.x + bounds.width;
      this.clampMaxY = bounds.y + bounds.height;
    } else {
      this.clampMinX = 0;
      this.clampMinY = 0;
      this.clampMaxX = this.roomWidth;
      this.clampMaxY = this.roomHeight;
    }
  }

  update(playerX: number, playerY: number, dt: number) {
    this.targetX = playerX - this.screenWidth / 2;
    this.targetY = playerY - this.screenHeight / 2;

    // Clamp to active bounds so no dead space beyond edges
    this.targetX = Math.max(this.clampMinX, Math.min(this.clampMaxX - this.screenWidth, this.targetX));
    this.targetY = Math.max(this.clampMinY, Math.min(this.clampMaxY - this.screenHeight, this.targetY));

    // Smooth lerp
    this.x += (this.targetX - this.x) * this.lerpSpeed * dt;
    this.y += (this.targetY - this.y) * this.lerpSpeed * dt;

    // Clamp post-lerp to prevent edge bleed
    this.x = Math.max(this.clampMinX, Math.min(this.clampMaxX - this.screenWidth, this.x));
    this.y = Math.max(this.clampMinY, Math.min(this.clampMaxY - this.screenHeight, this.y));
  }
}
