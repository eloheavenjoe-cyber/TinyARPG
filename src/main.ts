import { Application } from 'pixi.js';
import { Game, SCREEN_WIDTH, SCREEN_HEIGHT } from './core/Game';
import { Logger } from './core/Logger';

async function bootstrap() {
  Logger.log('game', '=== TinyARPG v0.1.0 ===');

  const app = new Application({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 0x0a0a1a,
    antialias: false,
    resolution: 1,
  });

  document.body.appendChild(app.view as HTMLCanvasElement);
  Logger.log('game', `Canvas ${SCREEN_WIDTH}x${SCREEN_HEIGHT} mounted`);

  const game = new Game(app);
  await game.start();
}

bootstrap().catch((err) => {
  Logger.error('game', 'Bootstrap failed', err);
  document.body.innerHTML = `<pre style="color:#f66;background:#111;padding:2rem;font-size:1.2rem">Failed to load: ${err instanceof Error ? err.message : err}</pre>`;
});
