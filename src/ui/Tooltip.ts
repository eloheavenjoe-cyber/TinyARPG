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
  const dividerYs: number[] = [];
  let cy = pad;

  const addText = (text: string, overrides: Partial<TextStyle>, xOff = 0): Text => {
    const t = new Text(text, new TextStyle({ fontFamily: 'MedievalSharp, serif', ...overrides }));
    t.x = pad + xOff;
    t.y = cy;
    return t;
  };

  // Item name — Cinzel bold at rarity color
  elems.push({ left: addText(item.computedName, { fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 'bold', fill: rarityColor }) });
  cy += 20;

  // Base type line
  const baseLabel = addText(item.base.name, { fontSize: 10, fill: '#8a7a5a' });
  elems.push({ left: baseLabel });
  cy += 12;
  dividerYs.push(cy);

  const prefixes = item.affixes.filter(a => a.affix.type === 'prefix');
  const suffixes = item.affixes.filter(a => a.affix.type === 'suffix');

  if (prefixes.length > 0) {
    cy += 2;
    elems.push({ left: addText('Prefixes', { fontSize: 10, fill: '#c8963e', fontStyle: 'italic' }) });
    cy += 14;
    for (const a of prefixes) {
      const left = addText(`❖ ${a.affix.name}`, { fontSize: 11, fill: '#88aacc' }, 6);
      const right = addText(`${a.roll > 0 ? '+' : ''}${a.roll}`, { fontFamily: 'Uncial Antiqua, serif', fontSize: 11, fill: '#f0c060' });
      elems.push({ left, right });
      cy += lineH;
    }
    dividerYs.push(cy);
  }

  if (suffixes.length > 0) {
    cy += 2;
    elems.push({ left: addText('Suffixes', { fontSize: 10, fill: '#c8963e', fontStyle: 'italic' }) });
    cy += 14;
    for (const a of suffixes) {
      const left = addText(`❖ ${a.affix.name}`, { fontSize: 11, fill: '#88aacc' }, 6);
      const right = addText(`${a.roll > 0 ? '+' : ''}${a.roll}`, { fontFamily: 'Uncial Antiqua, serif', fontSize: 11, fill: '#f0c060' });
      elems.push({ left, right });
      cy += lineH;
    }
    dividerYs.push(cy);
  }

  cy += 2;
  const nonZeroStats = Object.entries(item.computedStats).filter(([, v]) => v !== 0);
  if (nonZeroStats.length > 0) {
    elems.push({ left: addText('Stats', { fontSize: 10, fill: '#c8963e', fontStyle: 'italic' }) });
    cy += 14;
    for (const [stat, val] of nonZeroStats) {
      const left = addText(`  ${statLabel(stat)}`, { fontSize: 11, fill: '#aaaabc' });
      const right = addText(`${val > 0 ? '+' : ''}${val}`, { fontFamily: 'Uncial Antiqua, serif', fontSize: 11, fill: '#f0c060' });
      elems.push({ left, right });
      cy += lineH;
    }
  }

  if (item.levelReq > 1) {
    cy += 2;
    elems.push({ left: addText(`Requires Level ${item.levelReq}`, { fontSize: 10, fill: '#8a7a5a', fontStyle: 'italic' }) });
    cy += 14;
  }

  // Socketed jewels section
  if (item.socketSlots && item.socketSlots.length > 0) {
    const filledSockets = item.socketSlots.filter(s => s.jewel);
    if (filledSockets.length > 0) {
      cy += 2;
      elems.push({ left: addText('Socketed Jewels', { fontSize: 10, fill: '#c8963e', fontStyle: 'italic' }) });
      cy += 14;
      for (const slot of item.socketSlots) {
        if (!slot.jewel) {
          elems.push({ left: addText('  (Empty)', { fontSize: 10, fill: '#555555', fontStyle: 'italic' }, 6) });
          cy += lineH;
          continue;
        }
        const jewel = slot.jewel;
        const jColor = getRarityColor(jewel.rarity);
        elems.push({ left: addText(`⬠ ${jewel.computedName}`, { fontSize: 10, fill: jColor, fontWeight: 'bold' }, 6) });
        cy += 14;
        for (const aff of jewel.affixes) {
          const left = addText(`  ${aff.affix.name}`, { fontSize: 10, fill: '#88aacc' }, 6);
          const right = addText(`${aff.roll > 0 ? '+' : ''}${aff.roll}`, { fontFamily: 'Uncial Antiqua, serif', fontSize: 10, fill: '#f0c060' });
          elems.push({ left, right });
          cy += 14;
        }
      }
    }
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

  // Drop shadow
  const shadow = new Graphics();
  shadow.beginFill(0x000000, 0.45);
  shadow.drawRoundedRect(4, 4, maxW, cy, 4);
  shadow.endFill();
  c.addChild(shadow);

  // Main background — dark parchment
  const bg = new Graphics();
  bg.beginFill(0x0a0810, 0.95);
  bg.drawRoundedRect(0, 0, maxW, cy, 4);
  bg.endFill();
  // Outer rarity border
  bg.lineStyle(3, rarityColor, 0.6);
  bg.drawRoundedRect(0, 0, maxW, cy, 4);
  // Inner bronze frame
  bg.lineStyle(1, 0x6b4c1e, 0.5);
  bg.drawRoundedRect(3, 3, maxW - 6, cy - 6, 3);

  // Decorative scalloped top edge
  bg.lineStyle(1, 0xc8963e, 0.2);
  for (let i = 0; i < Math.ceil(maxW / 10); i++) {
    bg.arc(5 + i * 10, 2, 3, Math.PI, 0);
  }

  c.addChild(bg);

  // Gold ruled dividers between sections
  for (const dy of dividerYs) {
    const line = new Graphics();
    line.lineStyle(1, 0xc8963e, 0.25);
    line.moveTo(pad, dy);
    line.lineTo(maxW - pad, dy);
    c.addChild(line);
  }

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
    fontFamily: 'MedievalSharp, serif', fontSize: 11, fill: '#7bb8d4', lineHeight: 16,
  }));
  const pad = 8;
  const w = txt.width + pad * 2;
  const h = txt.height + pad * 2;

  // Shadow
  const shadow = new Graphics();
  shadow.beginFill(0x000000, 0.45);
  shadow.drawRoundedRect(-pad + 3, -pad + 3, w, h, 4);
  shadow.endFill();
  c.addChild(shadow);

  // Background
  const bg = new Graphics();
  bg.beginFill(0x0a0810, 0.95);
  bg.drawRoundedRect(-pad, -pad, w, h, 4);
  bg.endFill();
  bg.lineStyle(2, 0x44dddd, 0.55);
  bg.drawRoundedRect(-pad, -pad, w, h, 4);
  bg.lineStyle(1, 0x6b4c1e, 0.4);
  bg.drawRoundedRect(-pad + 2, -pad + 2, w - 4, h - 4, 3);

  c.addChild(bg, txt);
  return c;
}
