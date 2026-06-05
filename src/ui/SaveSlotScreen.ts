import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { SaveManager, SlotMeta } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export class SaveSlotScreen {
  container: Container;
  private onSelect: ((index: number) => void) | null = null;
  private onBack: (() => void) | null = null;
  private slots: (SlotMeta | null)[] = [];
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number, mode: 'load' | 'save') {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.slots = SaveManager.getAllSlots();

    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, screenWidth, screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text(mode === 'load' ? 'Load Game' : 'Select Save Slot', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 36, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = 60;
    this.container.addChild(title);

    this.createSlotButtons(screenWidth);

    // Back button
    const backBtn = new Container();
    const backBg = new Graphics();
    backBg.beginFill(0x2a2a3a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    backBg.endFill();
    backBg.lineStyle(1, 0x5a4a2a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    const backText = new Text('Back', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#c0a060',
    }));
    backText.anchor.set(0.5);
    backBtn.addChild(backBg, backText);
    backBtn.x = screenWidth / 2;
    backBtn.y = screenHeight - 60;
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    backBtn.on('pointerdown', () => this.onBack?.());
    this.container.addChild(backBtn);

    Logger.log('ui', `SaveSlotScreen opened (mode: ${mode})`);
  }

  private createSlotButtons(screenWidth: number) {
    const startY = 130;
    const slotHeight = 90;
    const gap = 10;
    const slotWidth = 600;
    const startX = (screenWidth - slotWidth) / 2;

    for (let i = 0; i < 5; i++) {
      const meta = this.slots[i];
      const y = startY + i * (slotHeight + gap);
      const isOccupied = meta?.occupied;

      const card = new Container();

      const cardBg = new Graphics();
      cardBg.beginFill(isOccupied ? 0x1a1a2e : 0x111122);
      cardBg.drawRoundedRect(0, 0, slotWidth, slotHeight, 6);
      cardBg.endFill();
      cardBg.lineStyle(1, isOccupied ? 0x5a4a2a : 0x2a2a3a);
      cardBg.drawRoundedRect(0, 0, slotWidth, slotHeight, 6);
      card.addChild(cardBg);

      const slotNum = new Text(`Slot ${i + 1}`, new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 16, fill: isOccupied ? '#c0a060' : '#4a4a5a',
      }));
      slotNum.x = 15;
      slotNum.y = 10;
      card.addChild(slotNum);

      if (isOccupied && meta) {
        const cls = new Text(`${meta.playerName}  (${meta.classType})`, new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: 14, fill: '#aaaacc',
        }));
        cls.x = 15;
        cls.y = 35;
        card.addChild(cls);

        const lvl = new Text(`Level ${meta.level}`, new TextStyle({
          fontFamily: 'monospace', fontSize: 13, fill: '#6a6a7a',
        }));
        lvl.x = 15;
        lvl.y = 58;
        card.addChild(lvl);

        const zone = new Text(meta.zoneName, new TextStyle({
          fontFamily: 'monospace', fontSize: 12, fill: '#4a4a5a',
        }));
        zone.x = slotWidth - 200;
        zone.y = 58;
        card.addChild(zone);

        const time = new Text(new Date(meta.timestamp).toLocaleString(), new TextStyle({
          fontFamily: 'monospace', fontSize: 11, fill: '#3a3a4a',
        }));
        time.x = 15;
        time.y = 75;
        card.addChild(time);

        // Delete button (X)
        const delBtn = new Container();
        const delBg = new Graphics();
        delBg.beginFill(0x3a1a1a);
        delBg.drawRoundedRect(-14, -14, 28, 28, 4);
        delBg.endFill();
        delBg.lineStyle(1, 0x6a2a2a);
        delBg.drawRoundedRect(-14, -14, 28, 28, 4);
        const delText = new Text('X', new TextStyle({
          fontFamily: 'monospace', fontSize: 14, fill: '#cc6666',
        }));
        delText.anchor.set(0.5);
        delBtn.addChild(delBg, delText);
        delBtn.x = slotWidth - 20;
        delBtn.y = 18;
        delBtn.eventMode = 'static';
        delBtn.cursor = 'pointer';
        const slotIdx = i;
        delBtn.on('pointerdown', (e: any) => {
          e.stopPropagation();
          this.showDeleteConfirm(slotIdx);
        });
        card.addChild(delBtn);

        // Click card to load/select
        card.eventMode = 'static';
        card.cursor = 'pointer';
        card.on('pointerdown', () => this.onSelect?.(slotIdx));
      } else {
        const emptyText = new Text('Empty Slot', new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: 16, fill: '#3a3a4a', fontStyle: 'italic',
        }));
        emptyText.anchor.set(0.5);
        emptyText.x = slotWidth / 2;
        emptyText.y = slotHeight / 2;
        card.addChild(emptyText);

        // Empty slots can be clicked too (for save mode)
        card.eventMode = 'static';
        card.cursor = 'pointer';
        const slotIdx = i;
        card.on('pointerdown', () => this.onSelect?.(slotIdx));
      }

      card.x = startX;
      card.y = y;
      this.container.addChild(card);
    }
  }

  private showDeleteConfirm(index: number) {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.6);
    overlay.drawRect(0, 0, this.screenWidth, this.screenHeight);
    overlay.endFill();
    overlay.eventMode = 'static';

    const confirmBox = new Container();
    const box = new Graphics();
    box.beginFill(0x1a1a2e, 0.95);
    box.drawRoundedRect(-160, -60, 320, 120, 6);
    box.endFill();
    box.lineStyle(1, 0x5a4a2a);
    box.drawRoundedRect(-160, -60, 320, 120, 6);

    const msg = new Text('Delete this save?', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#cc6666',
    }));
    msg.anchor.set(0.5);
    msg.y = -25;
    box.addChild(msg);

    // Yes button
    const yesBtn = new Container();
    const yesBg = new Graphics();
    yesBg.beginFill(0x3a1a1a);
    yesBg.drawRoundedRect(-40, -14, 80, 28, 4);
    yesBg.endFill();
    yesBg.lineStyle(1, 0x6a2a2a);
    yesBg.drawRoundedRect(-40, -14, 80, 28, 4);
    const yesText = new Text('Delete', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 14, fill: '#cc6666',
    }));
    yesText.anchor.set(0.5);
    yesBtn.addChild(yesBg, yesText);
    yesBtn.x = -80;
    yesBtn.y = 20;
    yesBtn.eventMode = 'static';
    yesBtn.cursor = 'pointer';
    const slotIdx = index;
    yesBtn.on('pointerdown', () => {
      SaveManager.deleteSlot(slotIdx);
      this.container.removeChild(overlay);
      this.refreshSlots();
    });
    box.addChild(yesBtn);

    // Cancel button
    const noBtn = new Container();
    const noBg = new Graphics();
    noBg.beginFill(0x2a2a3a);
    noBg.drawRoundedRect(-40, -14, 80, 28, 4);
    noBg.endFill();
    noBg.lineStyle(1, 0x5a4a2a);
    noBg.drawRoundedRect(-40, -14, 80, 28, 4);
    const noText = new Text('Cancel', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 14, fill: '#aaaacc',
    }));
    noText.anchor.set(0.5);
    noBtn.addChild(noBg, noText);
    noBtn.x = 80;
    noBtn.y = 20;
    noBtn.eventMode = 'static';
    noBtn.cursor = 'pointer';
    noBtn.on('pointerdown', () => this.container.removeChild(overlay));
    box.addChild(noBtn);

    confirmBox.addChild(box);
    confirmBox.x = this.screenWidth / 2;
    confirmBox.y = this.screenHeight / 2;
    overlay.addChild(confirmBox);
    this.container.addChild(overlay);
  }

  private refreshSlots() {
    this.slots = SaveManager.getAllSlots();
    while (this.container.children.length > 0) {
      const child = this.container.removeChildAt(0);
      try { child.destroy({ children: true }); } catch (_) {}
    }
    const bg = new Graphics();
    bg.beginFill(0x0a0a1a, 0.95);
    bg.drawRect(0, 0, this.screenWidth, this.screenHeight);
    bg.endFill();
    this.container.addChild(bg);

    const title = new Text('Load Game', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 36, fill: '#c0a060',
      stroke: '#000', strokeThickness: 3, letterSpacing: 4,
    }));
    title.anchor.set(0.5, 0);
    title.x = this.screenWidth / 2;
    title.y = 60;
    this.container.addChild(title);

    this.createSlotButtons(this.screenWidth);

    const backBtn = new Container();
    const backBg = new Graphics();
    backBg.beginFill(0x2a2a3a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    backBg.endFill();
    backBg.lineStyle(1, 0x5a4a2a);
    backBg.drawRoundedRect(-60, -18, 120, 36, 4);
    const backText = new Text('Back', new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 18, fill: '#c0a060',
    }));
    backText.anchor.set(0.5);
    backBtn.addChild(backBg, backText);
    backBtn.x = this.screenWidth / 2;
    backBtn.y = this.screenHeight - 60;
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    const savedOnBack = this.onBack;
    backBtn.on('pointerdown', () => savedOnBack?.());
    this.container.addChild(backBtn);
  }

  onSelectCallback(cb: (index: number) => void) { this.onSelect = cb; }
  onBackCallback(cb: () => void) { this.onBack = cb; }

  destroy() {
    this.container.destroy({ children: true });
  }
}
