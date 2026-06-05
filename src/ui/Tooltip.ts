import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GeneratedItem } from '../core/ItemGenerator';
import { OrbInfo } from '../entities/Player';

function getRarityColor(rarity: string): number {
  const colors: Record<string, number> = {
    normal: 0xffffff, magic: 0x4488ff, rare: 0xffcc00, unique: 0xff6600,
  };
  return colors[rarity] || 0xffffff;
}

function statLabel(stat: string): string {
  const labels: Record<string, string> = {
    hp: 'HP', mana: 'Mana', armor: 'Armor', damage: 'Damage',
    damagePct: 'Dmg %', attackSpeedPct: 'Atk Spd', moveSpeedPct: 'Move Spd',
    str: 'STR', dex: 'DEX', int: 'INT',
    armorPct: 'Armor %', hpRegen: 'HP Regen',
    fireDmg: 'Fire Dmg', damageReduction: 'Dmg Red', projectileDmgPct: 'Proj Dmg',
  };
  return labels[stat] || stat;
}

export function buildItemTooltip(item: GeneratedItem): Container {
  const c = new Container();
  const pad = 10;
  const lineH = 16;
  const rarityColor = getRarityColor(item.rarity);

  interface Line { left: Text; right?: Text }
  const elems: Line[] = [];
  let cy = pad;

  const addText = (text: string, overrides: Partial<TextStyle>, xOff = 0): Text => {
    const t = new Text(text, new TextStyle({ fontFamily: 'monospace', ...overrides }));
    t.x = pad + xOff;
    t.y = cy;
    return t;
  };

  elems.push({ left: addText(item.computedName, { fontSize: 14, fontWeight: 'bold', fill: rarityColor }) });
  cy += 20;

  elems.push({ left: addText(`── ${item.base.name} ──`, { fontSize: 10, fill: '#777788' }) });
  cy += 12;

  const prefixes = item.affixes.filter(a => a.affix.type === 'prefix');
  const suffixes = item.affixes.filter(a => a.affix.type === 'suffix');

  if (prefixes.length > 0) {
    cy += 2;
    elems.push({ left: addText('Prefixes', { fontSize: 10, fill: '#556688', fontStyle: 'italic' }) });
    cy += 14;
    for (const a of prefixes) {
      const left = addText(`◆ ${a.affix.name}`, { fontSize: 11, fill: '#88aacc' }, 6);
      const right = addText(`${a.roll > 0 ? '+' : ''}${a.roll}`, { fontSize: 11, fill: '#ccccdd' });
      elems.push({ left, right });
      cy += lineH;
    }
  }

  if (suffixes.length > 0) {
    cy += 2;
    elems.push({ left: addText('Suffixes', { fontSize: 10, fill: '#556688', fontStyle: 'italic' }) });
    cy += 14;
    for (const a of suffixes) {
      const left = addText(`◆ ${a.affix.name}`, { fontSize: 11, fill: '#88aacc' }, 6);
      const right = addText(`${a.roll > 0 ? '+' : ''}${a.roll}`, { fontSize: 11, fill: '#ccccdd' });
      elems.push({ left, right });
      cy += lineH;
    }
  }

  cy += 2;
  const nonZeroStats = Object.entries(item.computedStats).filter(([, v]) => v !== 0);
  if (nonZeroStats.length > 0) {
    elems.push({ left: addText('Stats', { fontSize: 10, fill: '#556688', fontStyle: 'italic' }) });
    cy += 14;
    for (const [stat, val] of nonZeroStats) {
      const left = addText(`  ${statLabel(stat)}`, { fontSize: 11, fill: '#aaaabc' });
      const right = addText(`${val > 0 ? '+' : ''}${val}`, { fontSize: 11, fill: '#ccccdd' });
      elems.push({ left, right });
      cy += lineH;
    }
  }

  if (item.levelReq > 1) {
    cy += 2;
    elems.push({ left: addText(`Requires Level ${item.levelReq}`, { fontSize: 10, fill: '#cc8866', fontStyle: 'italic' }) });
    cy += 14;
  }

  cy += pad;

  let maxW = pad * 2;
  for (const e of elems) {
    const eRight = e.left.x + e.left.width + pad;
    maxW = Math.max(maxW, eRight);
    if (e.right) {
      const eRight2 = e.right.x + e.right.width + pad;
      maxW = Math.max(maxW, eRight2);
    }
  }
  maxW = Math.max(maxW, 140);

  for (const e of elems) {
    if (e.right) {
      e.right.x = maxW - pad - e.right.width;
    }
  }

  const bg = new Graphics();
  bg.beginFill(0x0a0a18, 0.95);
  bg.lineStyle(2, rarityColor, 0.6);
  bg.drawRoundedRect(0, 0, maxW, cy, 4);
  bg.endFill();
  c.addChild(bg);

  for (const e of elems) {
    c.addChild(e.left);
    if (e.right) c.addChild(e.right);
  }

  return c;
}

export function buildOrbTooltip(orb: OrbInfo): Container {
  const descriptions: Record<string, string> = {
    empowerment: 'Adds a random affix to a\nrare item',
    flux: 'Re-rolls all affixes on a\nrare item',
    mutation: 'Upgrades a normal item to\nmagic with 2 affixes',
    growth: 'Adds a random affix to a\nmagic item (max 4)',
    ascendance: 'Upgrades a normal item to\nrare with 4-6 affixes',
    purification: 'Removes all affixes from a\nmagic or rare item',
  };
  const orbNames: Record<string, string> = {
    empowerment: 'Orb of Empowerment',
    flux: 'Orb of Flux',
    mutation: 'Orb of Mutation',
    growth: 'Orb of Growth',
    ascendance: 'Orb of Ascendance',
    purification: 'Orb of Purification',
  };
  const name = orbNames[orb.orbId] || orb.orbId;
  const c = new Container();
  const txt = new Text(`${name} (${orb.count})\n${descriptions[orb.orbId] || ''}`, new TextStyle({
    fontFamily: 'monospace', fontSize: 11, fill: 0x44dddd, lineHeight: 16,
  }));
  const pad = 8;
  const bg = new Graphics();
  bg.beginFill(0x0a0a18, 0.95);
  bg.lineStyle(1, 0x44dddd, 0.6);
  bg.drawRoundedRect(-pad, -pad, txt.width + pad * 2, txt.height + pad * 2, 4);
  bg.endFill();
  c.addChild(bg, txt);
  return c;
}
