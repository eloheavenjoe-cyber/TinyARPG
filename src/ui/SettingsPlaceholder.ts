import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Logger } from '../core/Logger';

export class SettingsPlaceholder {
  container: Container;
  private onBack: (() => void) | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const panel = new Graphics();
    panel.beginFill(0x1a1a2e, 0.95);
    panel.drawRoundedRect(-320, -280, 640, 560, 8);
    panel.endFill();
    panel.lineStyle(1, 0x5a4a2a);
    panel.drawRoundedRect(-320, -280, 640, 560, 8);
    panel.x = screenWidth / 2;
    panel.y = screenHeight / 2;

    const title = new Text('Settings', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 28, fill: '#c0a060',
    }));
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -250;
    panel.addChild(title);

    // Audio section
    const audioLabel = new Text('Audio', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    audioLabel.anchor.set(0.5, 0);
    audioLabel.x = 0;
    audioLabel.y = -200;
    panel.addChild(audioLabel);

    const musicLabel = new Text('Music Volume: [----o----]  50%', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#6a6a7a',
    }));
    musicLabel.anchor.set(0.5, 0);
    musicLabel.x = 0;
    musicLabel.y = -170;
    panel.addChild(musicLabel);

    const sfxLabel = new Text('SFX Volume:   [----o----]  50%', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#6a6a7a',
    }));
    sfxLabel.anchor.set(0.5, 0);
    sfxLabel.x = 0;
    sfxLabel.y = -145;
    panel.addChild(sfxLabel);

    // Graphics section
    const gfxLabel = new Text('Graphics', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    gfxLabel.anchor.set(0.5, 0);
    gfxLabel.x = 0;
    gfxLabel.y = -105;
    panel.addChild(gfxLabel);

    const qualityLabel = new Text('Quality:  Medium', new TextStyle({
      fontFamily: 'monospace', fontSize: 14, fill: '#6a6a7a',
    }));
    qualityLabel.anchor.set(0.5, 0);
    qualityLabel.x = 0;
    qualityLabel.y = -75;
    panel.addChild(qualityLabel);

    // Controls section
    const ctrlLabel = new Text('Controls', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#aaaacc',
    }));
    ctrlLabel.anchor.set(0.5, 0);
    ctrlLabel.x = 0;
    ctrlLabel.y = -35;
    panel.addChild(ctrlLabel);

    const binds = [
      'Move:         W A S D',
      'Skill 1-6:    1 2 3 4 5 6',
      'Interact:     E',
      'Inventory:    I',
      'Passive Tree: P',
      'Escape Menu:  Escape',
    ];
    for (let i = 0; i < binds.length; i++) {
      const line = new Text(binds[i], new TextStyle({
        fontFamily: 'monospace', fontSize: 13, fill: '#6a6a7a',
      }));
      line.anchor.set(0.5, 0);
      line.x = 0;
      line.y = -5 + i * 20;
      panel.addChild(line);
    }

    // Back button
    const backBtn = new Container();
    const backBg = new Graphics();
    backBg.beginFill(0x2a2a3a);
    backBg.drawRoundedRect(-50, -16, 100, 32, 4);
    backBg.endFill();
    backBg.lineStyle(1, 0x5a4a2a);
    backBg.drawRoundedRect(-50, -16, 100, 32, 4);
    const backText = new Text('Back', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 16, fill: '#c0a060',
    }));
    backText.anchor.set(0.5);
    backBtn.addChild(backBg, backText);
    backBtn.x = 0;
    backBtn.y = 230;
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    backBtn.on('pointerdown', () => this.onBack?.());
    panel.addChild(backBtn);

    this.container.addChild(panel);

    const placeholder = new Text('(Settings are visual placeholders only)', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 12, fill: '#4a4a5a', fontStyle: 'italic',
    }));
    placeholder.anchor.set(0.5);
    placeholder.x = screenWidth / 2;
    placeholder.y = screenHeight / 2 + 295;
    this.container.addChild(placeholder);

    Logger.log('ui', 'Settings placeholder opened');
  }

  onBackCallback(cb: () => void) { this.onBack = cb; }

  destroy() {
    this.container.destroy({ children: true });
  }
}
