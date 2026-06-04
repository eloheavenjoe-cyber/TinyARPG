export class Camera {
  x = 0;
  y = 0;
  private targetX = 0;
  private targetY = 0;
  private readonly lerpSpeed = 0.05;

  constructor(
    private screenWidth: number,
    private screenHeight: number,
    private roomWidth: number,
    private roomHeight: number,
  ) {}

  update(playerX: number, playerY: number, dt: number) {
    this.targetX = playerX - this.screenWidth / 2;
    this.targetY = playerY - this.screenHeight / 2;

    // Clamp so no dead space beyond room edges
    this.targetX = Math.max(0, Math.min(this.roomWidth - this.screenWidth, this.targetX));
    this.targetY = Math.max(0, Math.min(this.roomHeight - this.screenHeight, this.targetY));

    // Smooth lerp
    this.x += (this.targetX - this.x) * this.lerpSpeed * dt;
    this.y += (this.targetY - this.y) * this.lerpSpeed * dt;

    // Clamp post-lerp to prevent edge bleed
    this.x = Math.max(0, Math.min(this.roomWidth - this.screenWidth, this.x));
    this.y = Math.max(0, Math.min(this.roomHeight - this.screenHeight, this.y));
  }
}
