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
    backdrop.beginFill(0x000000, 0.5);
    backdrop.drawRect(0, 0, this.SCREEN_W, this.SCREEN_H);
    backdrop.endFill();
    backdrop.eventMode = 'static';
    this.container.addChild(backdrop);

    const panel = new Graphics();
    panel.beginFill(0x141428, 0.93);
    panel.drawRoundedRect(this.panelX, this.panelY, this.PANEL_W, this.PANEL_H, 8);
    panel.endFill();
    this.container.addChild(panel);

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
    const tabY = this.panelY + 10;

    for (const tab of ['stats', 'abilities'] as const) {
      const x = tabStartX + (tab === 'stats' ? 0 : tabW + tabGap);
      const isActive = this.activeTab === tab;

      const bg = new Graphics();
      bg.beginFill(isActive ? 0x334466 : 0x1a1a30);
      bg.drawRoundedRect(x, tabY, tabW, tabH, 4);
      bg.endFill();
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      const capturedTab = tab;
      bg.on('pointerdown', () => {
        this.activeTab = capturedTab;
        this.rebuild();
      });
      this.container.addChild(bg);

      const label = new Text(tab === 'stats' ? 'Stats' : 'Abilities', new TextStyle({
        fontFamily: 'monospace', fontSize: 14,
        fill: isActive ? '#ffffff' : '#888899',
      }));
      label.anchor.set(0.5);
      label.x = x + tabW / 2;
      label.y = tabY + tabH / 2;
      this.container.addChild(label);
    }
  }

  private buildStatsContent() {
    const attrs = this.player.attrs;
    const s = this.player.computedStats;
    const cx = this.panelX + 30;
    let cy = this.panelY + 55;
    const col2 = this.panelX + this.PANEL_W / 2 + 10;
    const lh = 20;
    const sectionGap = 10;

    const sectionStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold',
      fill: '#ffdd88', stroke: '#000', strokeThickness: 2,
    });
    const statStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#ccccdd',
    });
    const valueStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#ffffff',
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
    cy += 4 * lh + sectionGap;

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
    let cy = this.panelY + 55;
    const lh = 24;

    const nameStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold',
      fill: '#ffdd88', stroke: '#000', strokeThickness: 2,
    });
    const detailStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 11, fill: '#ccccdd',
    });
    const emptyStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 12, fill: '#555566', fontStyle: 'italic',
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
        fontFamily: 'monospace', fontSize: 10, fill: badgeColor,
      }));
      badge.x = cx;
      badge.y = cy;
      this.container.addChild(badge);

      const name = new Text(skill.name, nameStyle);
      name.x = cx + 70;
      name.y = cy;
      this.container.addChild(name);
      cy += lh;

      if (skill.damageMult > 0) {
        const dmg = this.player.calcDamage(skill);
        const cd = this.player.getSkillCooldown(skill);
        const cdSec = (cd / 60).toFixed(1);
        const detail = new Text(`Damage: ${dmg}  |  Cooldown: ${cdSec}s  |  Mana: ${skill.manaCost}`, detailStyle);
        detail.x = cx + 130;
        detail.y = cy - lh + 4;
        this.container.addChild(detail);
      } else {
        const desc = skill.description || '';
        const detail = new Text(desc, new TextStyle({
          fontFamily: 'monospace', fontSize: 11, fill: '#88aacc',
        }));
        detail.x = cx + 130;
        detail.y = cy - lh + 4;
        this.container.addChild(detail);
      }

      cy += 4;
    }
  }

  update() {
    this.rebuild();
  }

  destroy() {
    this.container.removeChildren();
    this.container.destroy();
  }
}
