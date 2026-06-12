import { Container, Graphics, Text, TextStyle } from 'pixi.js';

interface CapturedSoul {
  enemyType: string;
  name: string;
  baseHp: number;
  baseDamage: number;
  baseSpeed: number;
  captureLevel: number;
}

export class SoulVaultScreen {
  container: Container;
  visible: boolean = false;
  private bg: Graphics;
  private cards: { bg: Graphics; soul: CapturedSoul | null }[] = [];
  private activeCard: Graphics = new Graphics();
  private activeLabel: Text;
  private onDeploy: (soul: CapturedSoul) => void;
  private onReturn: () => void;
  private closeCallback: () => void;

  constructor(
    screenWidth: number, screenHeight: number,
    onDeploy: (soul: CapturedSoul) => void,
    onReturn: () => void,
    onClose: () => void,
  ) {
    this.onDeploy = onDeploy;
    this.onReturn = onReturn;
    this.closeCallback = onClose;
    this.container = new Container();
    this.container.visible = false;

    this.bg = new Graphics();
    this.bg.beginFill(0x0a0810, 0.95);
    this.bg.drawRect(0, 0, screenWidth, screenHeight);
    this.bg.endFill();
    this.container.addChild(this.bg);

    const title = new Text('Soul Vault', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 32, fill: '#f0c060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 3,
    }));
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = 60;
    this.container.addChild(title);

    const activeLabel = new Text('Active Spectre', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 18, fill: '#ddaa55',
    }));
    activeLabel.x = screenWidth / 2 - 200;
    activeLabel.y = 120;
    this.container.addChild(activeLabel);

    this.activeLabel = new Text('None', new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 16, fill: '#666666',
    }));
    this.activeLabel.x = screenWidth / 2 - 200;
    this.activeLabel.y = 150;
    this.container.addChild(this.activeLabel);

    this.activeCard = new Graphics();
    this.activeCard.x = screenWidth / 2 - 200;
    this.activeCard.y = 180;
    this.container.addChild(this.activeCard);

    const storageLabel = new Text('Stored Souls', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 18, fill: '#ddaa55',
    }));
    storageLabel.x = screenWidth / 2 - 200;
    storageLabel.y = 280;
    this.container.addChild(storageLabel);

    const startX = screenWidth / 2 - 380;
    const startY = 320;
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const cx = startX + col * 200;
      const cy = startY + row * 180;
      const bg = new Graphics();
      bg.lineStyle(1, 0x6b4c1e);
      bg.beginFill(0x0a0810);
      bg.drawRoundedRect(cx, cy, 180, 160, 6);
      bg.endFill();
      bg.interactive = true;
      bg.cursor = 'pointer';
      bg.eventMode = 'static';
      this.container.addChild(bg);
      this.cards.push({ bg, soul: null });

      const idx = i;
      bg.on('pointerdown', () => this.handleCardClick(idx));
    }
  }

  private handleCardClick(index: number) {
    const card = this.cards[index];
    if (!card.soul) return;
    this.onDeploy(card.soul);
  }

  update(souls: CapturedSoul[], active: CapturedSoul | null, onDeploy: (soul: CapturedSoul) => void) {
    this.onDeploy = onDeploy;

    this.activeCard.removeChildren();
    this.activeCard.clear();
    if (active) {
      this.activeLabel.text = active.name;
      this.activeLabel.style.fill = '#88ccff';
      this.activeCard.lineStyle(2, 0xddaa55);
      this.activeCard.beginFill(0x0a0810);
      this.activeCard.drawRoundedRect(0, 0, 360, 60, 6);
      this.activeCard.endFill();

      const infoText = new Text(
        `Type: ${active.enemyType} | HP: ${active.baseHp} | DMG: ${active.baseDamage} | Speed: ${active.baseSpeed}`,
        new TextStyle({ fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#e8dcc8' }),
      );
      infoText.x = 10;
      infoText.y = 10;
      this.activeCard.addChild(infoText);

      const clickText = new Text('Click to return to vault', new TextStyle({
        fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#996644',
      }));
      clickText.x = 10;
      clickText.y = 35;
      this.activeCard.addChild(clickText);

      this.activeCard.interactive = true;
      this.activeCard.eventMode = 'static';
      this.activeCard.cursor = 'pointer';
      this.activeCard.removeAllListeners('pointerdown');
      this.activeCard.on('pointerdown', () => this.onReturn());
    } else {
      this.activeLabel.text = 'None';
      this.activeLabel.style.fill = '#666666';
      this.activeCard.lineStyle(1, 0x444444);
      this.activeCard.beginFill(0x080610);
      this.activeCard.drawRoundedRect(0, 0, 360, 60, 6);
      this.activeCard.endFill();
      this.activeCard.interactive = false;
    }

    for (let i = 0; i < souls.length; i++) {
      const card = this.cards[i];
      card.bg.removeChildren();
      card.soul = souls[i] || null;

      card.bg.clear();
      if (souls[i]) {
        card.bg.lineStyle(2, 0x8844cc);
        card.bg.beginFill(0x0a0810);
        card.bg.drawRoundedRect(0, 0, 180, 160, 6);
        card.bg.endFill();

        const s = souls[i];
        const nameText = new Text(s.name, new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 15, fill: '#88ccff',
        }));
        nameText.x = 10;
        nameText.y = 10;
        card.bg.addChild(nameText);

        const info = [
          `Type: ${s.enemyType}`,
          `HP: ${s.baseHp}`,
          `DMG: ${s.baseDamage}`,
          `Speed: ${s.baseSpeed}`,
          `Lvl: ${s.captureLevel}`,
        ];
        info.forEach((line, li) => {
          const t = new Text(line, new TextStyle({
            fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#b0a090',
          }));
          t.x = 10;
          t.y = 35 + li * 18;
          card.bg.addChild(t);
        });

        card.bg.interactive = true;
        card.bg.eventMode = 'static';
        card.bg.cursor = 'pointer';
      } else {
        card.bg.lineStyle(1, 0x333333);
        card.bg.beginFill(0x060408);
        card.bg.drawRoundedRect(0, 0, 180, 160, 6);
        card.bg.endFill();
        const emptyText = new Text('Empty', new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 14, fill: '#444444', fontStyle: 'italic',
        }));
        emptyText.x = 70;
        emptyText.y = 70;
        card.bg.addChild(emptyText);
        card.bg.interactive = false;
      }
    }
  }

  toggle() {
    this.visible = !this.visible;
    this.container.visible = this.visible;
  }

  destroy() {
    this.container.removeChildren();
  }
}
