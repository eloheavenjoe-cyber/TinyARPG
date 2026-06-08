import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';

export class CharacterScreen {
  container: Container;
  private player: Player;
  private activeTab: 'stats' | 'abilities' = 'stats';
  private panelX: number;
  private panelY: number;
  private readonly PANEL_W = 800;
  private readonly PANEL_H = 650;
  private readonly SCREEN_W: number;
  private readonly SCREEN_H: number;
  /* PERF: dirty-flag skips full rebuild when displayed values haven't changed */
  private lastSnapshot = '';

  constructor(screenW: number, screenH: number, player: Player) {
    this.player = player;
    this.SCREEN_W = screenW;
    this.SCREEN_H = screenH;
    this.container = new Container();
    this.panelX = (screenW - this.PANEL_W) / 2;
    this.panelY = (screenH - this.PANEL_H) / 2;
    this.rebuild();
  }

  private rebuild() {
    this.container.removeChildren();

    const backdrop = new Graphics();
    backdrop.beginFill(0x000000, 0.55);
    backdrop.drawRect(0, 0, this.SCREEN_W, this.SCREEN_H);
    backdrop.endFill();
    backdrop.eventMode = 'static';
    this.container.addChild(backdrop);

    // Outer glow
    const glow = new Graphics();
    glow.beginFill(0xc8963e, 0.04);
    glow.drawRoundedRect(this.panelX - 6, this.panelY - 6, this.PANEL_W + 12, this.PANEL_H + 12, 10);
    glow.endFill();
    glow.beginFill(0xc8963e, 0.07);
    glow.drawRoundedRect(this.panelX - 3, this.panelY - 3, this.PANEL_W + 6, this.PANEL_H + 6, 9);
    glow.endFill();
    this.container.addChild(glow);

    // Panel
    const panel = new Graphics();
    panel.beginFill(0x0a0810, 0.93);
    panel.drawRoundedRect(this.panelX, this.panelY, this.PANEL_W, this.PANEL_H, 8);
    panel.endFill();
    panel.lineStyle(1, 0x6b4c1e, 0.6);
    panel.drawRoundedRect(this.panelX, this.panelY, this.PANEL_W, this.PANEL_H, 8);
    panel.lineStyle(1, 0xc8963e, 0.15);
    panel.moveTo(this.panelX + 12, this.panelY + 2);
    panel.lineTo(this.panelX + this.PANEL_W - 12, this.panelY + 2);
    this.container.addChild(panel);

    // Title
    const title = new Text('Character', new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 22, fill: '#f0c060',
      stroke: '#000', strokeThickness: 2,
    }));
    title.anchor.set(0.5, 0);
    title.x = this.SCREEN_W / 2;
    title.y = this.panelY + 10;
    this.container.addChild(title);

    this.buildTabBar();
    if (this.activeTab === 'stats') {
      this.buildStatsContent();
    } else {
      this.buildAbilitiesContent();
    }
  }

  private buildTabBar() {
    const tabW = 120;
    const tabH = 30;
    const tabGap = 10;
    const tabsTotalW = tabW * 2 + tabGap;
    const tabStartX = this.panelX + (this.PANEL_W - tabsTotalW) / 2;
    const tabY = this.panelY + 40;

    for (const tab of ['stats', 'abilities'] as const) {
      const x = tabStartX + (tab === 'stats' ? 0 : tabW + tabGap);
      const isActive = this.activeTab === tab;

      const bg = new Graphics();
      bg.beginFill(isActive ? 0x1a1210 : 0x0a0805);
      this.drawChamferedRect(bg, x, tabY, tabW, tabH, 4);
      bg.endFill();
      if (isActive) {
        bg.lineStyle(1, 0xc8963e, 0.6);
        this.drawChamferedRect(bg, x, tabY, tabW, tabH, 4);
        // Gold bottom bar
        bg.lineStyle(2, 0xc8963e, 0.4);
        bg.moveTo(x + 6, tabY + tabH);
        bg.lineTo(x + tabW - 6, tabY + tabH);
      } else {
        bg.lineStyle(1, 0x6b4c1e, 0.4);
        this.drawChamferedRect(bg, x, tabY, tabW, tabH, 4);
      }
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      const capturedTab = tab;
      bg.on('pointerdown', () => {
        this.activeTab = capturedTab;
        this.rebuild();
      });
      this.container.addChild(bg);

      const label = new Text(tab === 'stats' ? 'Stats' : 'Abilities', new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 14,
        fill: isActive ? '#f0c060' : '#6b4c1e',
      }));
      label.anchor.set(0.5);
      label.x = x + tabW / 2;
      label.y = tabY + tabH / 2;
      this.container.addChild(label);
    }
  }

  private drawChamferedRect(g: Graphics, x: number, y: number, w: number, h: number, c: number) {
    if (c <= 0) { g.drawRect(x, y, w, h); return; }
    g.moveTo(x + c, y);
    g.lineTo(x + w - c, y);
    g.lineTo(x + w, y + c);
    g.lineTo(x + w, y + h - c);
    g.lineTo(x + w - c, y + h);
    g.lineTo(x + c, y + h);
    g.lineTo(x, y + h - c);
    g.lineTo(x, y + c);
    g.closePath();
  }

  private buildStatsContent() {
    const attrs = this.player.attrs;
    const s = this.player.computedStats;
    const cx = this.panelX + 30;
    let cy = this.panelY + 85;
    const col2 = this.panelX + this.PANEL_W / 2 + 10;
    const lh = 20;
    const sectionGap = 10;

    const sectionStyle = new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 'bold',
      fill: '#f0c060', stroke: '#000', strokeThickness: 2,
    });
    const statStyle = new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#e8dcc8',
    });
    const valueStyle = new TextStyle({
      fontFamily: 'Uncial Antiqua, serif', fontSize: 12, fill: '#f0c060',
    });

    const addStat = (label: string, value: string, x: number, refY: number) => {
      const l = new Text(label, statStyle);
      l.x = x;
      l.y = refY;
      this.container.addChild(l);
      const v = new Text(value, valueStyle);
      v.x = x + 210;
      v.y = refY;
      this.container.addChild(v);
    };

    const addSection = (title: string, stats: [string, string][], x: number, refY: number) => {
      const h = new Text(title, sectionStyle);
      h.x = x;
      h.y = refY;
      this.container.addChild(h);
      // Gold underline
      const ul = new Graphics();
      ul.lineStyle(1, 0xc8963e, 0.25);
      ul.moveTo(x, refY + 18);
      ul.lineTo(x + 180, refY + 18);
      this.container.addChild(ul);
      let yy = refY + lh;
      for (const [label, value] of stats) {
        addStat(`  ${label}`, value, x, yy);
        yy += lh;
      }
      return yy;
    };

    addSection('Attributes', [
      ['STR', `${attrs.str}`],
      ['DEX', `${attrs.dex}`],
      ['INT', `${attrs.int}`],
      ['Unspent Points', `${this.player.unspentAttrPoints}`],
    ], cx, cy);
    cy += 5 * lh + sectionGap;

    const offY = cy;
    addSection('Offensive', [
      ['Melee Damage', `${((s.meleeDmgMult - 1) * 100).toFixed(0)}%`],
      ['Projectile Dmg', `${((s.projectileDmgMult - 1) * 100).toFixed(0)}%`],
      ['Attack Speed', `${((s.attackSpeedMult - 1) * 100).toFixed(0)}%`],
      ['Cold Damage', `${s.coldDmg || 0}`],
      ['Lightning Dmg', `${s.lightningDmg || 0}`],
      ['Extra Projectiles', `${s.additionalProjectiles || 0}`],
      ['Skill AOE', `${(s.skillAoePct || 0).toFixed(0)}%`],
      ['Culling Strike', `${(s.cullingStrikePct || 0).toFixed(0)}%`],
    ], cx, offY);

    addSection('Defensive', [
      ['Max HP', `${s.maxHp || 0}`],
      ['Max Mana', `${s.maxMana || 0}`],
      ['Armor DR', `${(s.damageReduction || 0).toFixed(0)}%`],
      ['Dodge', `${(s.dodgePct || 0).toFixed(0)}%`],
      ['Fortify on Hit', `${(s.fortifyOnHit || 0).toFixed(0)}`],
      ['HP Regen', `${(s.hpRegen || 0).toFixed(1)}`],
    ], col2, offY);

    cy = offY + 9 * lh + sectionGap;
    addSection('Utility', [
      ['Move Speed', `${((s.moveSpeedMult - 1) * 100).toFixed(0)}%`],
      ['Cooldown Red.', `${(s.cooldownReductionPct || 0).toFixed(0)}%`],
      ['Mana Regen', `${(s.manaRegenPct || 0).toFixed(0)}%`],
      ['Skill Duration', `${(s.skillDurationPct || 0).toFixed(0)}%`],
      ['Life Leech', `${(s.lifeLeechPct || 0).toFixed(1)}%`],
      ['Magic Find', `${(s.magicFindPct || 0).toFixed(0)}%`],
      ['Item Quantity', `${(s.itemQuantityPct || 0).toFixed(0)}%`],
    ], cx, cy);
  }

  private buildAbilitiesContent() {
    const cx = this.panelX + 30;
    let cy = this.panelY + 85;
    const lh = 24;

    const nameStyle = new TextStyle({
      fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 'bold',
      fill: '#f0c060', stroke: '#000', strokeThickness: 2,
    });
    const detailStyle = new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#e8dcc8',
    });
    const emptyStyle = new TextStyle({
      fontFamily: 'MedievalSharp, serif', fontSize: 12, fill: '#555555', fontStyle: 'italic',
    });

    for (let i = 0; i < 6; i++) {
      const skill = this.player.skills.getSkill(i);
      if (!skill) {
        const t = new Text('(Empty)', emptyStyle);
        t.x = cx;
        t.y = cy;
        this.container.addChild(t);
        cy += lh;
        continue;
      }

      const et = skill.effectType;
      let badgeText = '[Melee]';
      let badgeColor = '#cc6666';
      if (et === 'dash') { badgeText = '[Dash]'; badgeColor = '#88aadd'; }
      else if (['buff', 'debuff', 'passive'].includes(et)) { badgeText = '[Buff]'; badgeColor = '#66cc88'; }
      else if (['projectile', 'projectile_spread', 'projectile_pierce', 'aoe_target'].includes(et)) { badgeText = '[Projectile]'; badgeColor = '#ddaa44'; }

      const badge = new Text(badgeText, new TextStyle({
        fontFamily: 'Cinzel, serif', fontSize: 10, fill: badgeColor,
      }));
      badge.x = cx;
      badge.y = cy;
      this.container.addChild(badge);

      const name = new Text(skill.name, nameStyle);
      name.x = cx + 72;
      name.y = cy;
      this.container.addChild(name);
      cy += lh;

      if (skill.damageMult > 0) {
        const dmg = this.player.calcDamage(skill);
        const cd = this.player.getSkillCooldown(skill);
        const cdSec = (cd / 60).toFixed(1);
        const detail = new Text(`Damage: ${dmg}  |  Cooldown: ${cdSec}s  |  Mana: ${skill.manaCost}`, detailStyle);
        detail.x = cx + 135;
        detail.y = cy - lh + 4;
        this.container.addChild(detail);
      } else {
        const desc = skill.description || '';
        const detail = new Text(desc, new TextStyle({
          fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#88aacc',
        }));
        detail.x = cx + 135;
        detail.y = cy - lh + 4;
        this.container.addChild(detail);
      }

      cy += 4;
    }
  }

  update() {
    /* PERF: only rebuild when displayed values actually change */
    const s = this.player.computedStats;
    let skillSnap = '';
    for (let i = 0; i < 6; i++) {
      const sk = this.player.skills.getSkill(i);
      skillSnap += sk ? `${sk.id},` : 'empty,';
    }
    const snap = `${this.player.attrs.str},${this.player.attrs.dex},${this.player.attrs.int},${this.player.unspentAttrPoints}|${s.meleeDmgMult},${s.projectileDmgMult},${s.attackSpeedMult},${s.maxHp},${s.maxMana},${s.damageReduction},${s.dodgePct},${s.moveSpeedMult},${s.cooldownReductionPct}|${skillSnap}`;
    if (snap === this.lastSnapshot) return;
    this.lastSnapshot = snap;
    this.rebuild();
  }

  destroy() {
    this.container.removeChildren();
    this.container.destroy();
  }
}
