# Pixel-Art Arch Doors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace yellow-bordered door rectangles with programmatic pixel-art stone arches (concrete, moss, vines).

**Architecture:** Rewrite `Room.renderDoors()` to draw an arch frame (stone pillars + stepped arch top) around each door rect, with moss blobs, hanging vines, and an updated label. All drawing uses PixiJS Graphics primitives in a single method.

**Tech Stack:** TypeScript + PixiJS 7

**Files:**
- Modify: `src/world/Room.ts:184-204`

---

### Task 1: Rewrite renderDoors() with arch drawing

**Files:**
- Modify: `src/world/Room.ts:184-204` (current renderDoors method)

- [ ] **Step 1: Read current Room.ts to understand imports and context**

Read the file to confirm the existing imports, method placement, and surrounding code.

- [ ] **Step 2: Replace renderDoors() with arch implementation**

Replace the current `renderDoors()` method (lines 184-204) with the following:

```typescript
  private renderDoors() {
    for (const door of this.doors) {
      const g = new Graphics();
      const x = door.rect.x;
      const y = door.rect.y;
      const w = door.rect.width;
      const h = door.rect.height;
      const pillarW = 28;
      const archH = 40;

      // 1. Dark opening (transition zone)
      g.beginFill(0x000000, 0.6);
      g.drawRect(x, y, w, h);
      g.endFill();

      // 2. Stone pillars with block grid
      const stoneBase = 0x8a8a8a;
      const stoneDark = 0x7a7a7a;
      const stoneLight = 0x9a9a9a;
      const mortar = 0x6a6a6a;
      const moss = 0x3a7a2a;
      const mossLight = 0x4a8a3a;
      const vine = 0x2a6a1a;
      const leaf = 0x3a8a2a;

      const drawPillar = (px: number) => {
        // Pillar fill
        g.beginFill(stoneBase);
        g.drawRect(px, y, pillarW, h);
        g.endFill();
        // Inner highlight
        g.beginFill(stoneLight);
        g.drawRect(px + 2, y, 3, h);
        g.endFill();
        // Outer shadow
        g.beginFill(stoneDark);
        g.drawRect(px + pillarW - 3, y, 3, h);
        g.endFill();
        // Horizontal mortar lines every 14px
        g.lineStyle(1, mortar, 0.5);
        for (let ly = y + 14; ly < y + h; ly += 14) {
          g.moveTo(px, ly);
          g.lineTo(px + pillarW, ly);
        }
        // Vertical mortar splits (staggered)
        g.lineStyle(1, mortar, 0.4);
        for (let ly = y; ly < y + h; ly += 28) {
          const splitX = px + (Math.floor(ly / 14) % 2 === 0 ? 12 : 16);
          g.moveTo(px + splitX, ly);
          g.lineTo(px + splitX, Math.min(ly + 14, y + h));
        }
      };

      drawPillar(x - pillarW);
      drawPillar(x + w);

      // 3. Stepped arch top
      const totalArchW = w + pillarW * 2;
      const archLeft = x - pillarW;
      const steps = 6;
      const stepW = totalArchW / (steps * 2);
      const stepH = archH / steps;
      for (let i = 0; i < steps; i++) {
        const stepTop = y - archH + i * stepH;
        const stepBottom = stepTop + stepH;
        // Left side
        const leftStart = archLeft + i * stepW;
        const leftEnd = archLeft + (i + 1) * stepW;
        g.beginFill(stoneBase);
        g.drawRect(leftStart, stepTop, leftEnd - leftStart, stepBottom - stepTop);
        g.endFill();
        // Right side
        const rightStart = archLeft + totalArchW - (i + 1) * stepW;
        const rightEnd = archLeft + totalArchW - i * stepW;
        g.beginFill(stoneBase);
        g.drawRect(rightStart, stepTop, rightEnd - rightStart, stepBottom - stepTop);
        g.endFill();
      }
      // Top cap (center block)
      g.beginFill(stoneBase);
      g.drawRect(archLeft + steps * stepW, y - archH, stepW * 2, stepH);
      g.endFill();
      // Dark underside of arch top
      g.beginFill(stoneDark);
      g.drawRect(x, y - 4, w, 4);
      g.endFill();
      // Arch top mortar lines (horizontal)
      g.lineStyle(1, mortar, 0.5);
      for (let ly = y - archH + 8; ly < y; ly += 8) {
        g.moveTo(archLeft, ly);
        g.lineTo(archLeft + totalArchW, ly);
      }

      // 4. Moss patches
      const seed = Math.abs(x * 7 + y * 13 + w * 3) + 1;
      const rngVal = (i: number) => { const s = (seed + i) * 9301 + 49297; return (s % 233280) / 233280; };
      const drawMossBlob = (mx: number, my: number, size: number) => {
        g.beginFill(rngVal(Math.round(mx + my)) > 0.5 ? moss : mossLight);
        for (let dx = -size; dx <= size; dx += 4) {
          for (let dy = -size; dy <= size; dy += 4) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < size && rngVal(Math.round(mx + dx + my + dy)) > 0.3) {
              g.drawRect(mx + dx, my + dy, 4, 4);
            }
          }
        }
        g.endFill();
      };
      const mossPositions = [
        { mx: x - pillarW, my: y + h - 6, size: 10 },
        { mx: x + w, my: y + h - 8, size: 8 },
        { mx: x - pillarW + 4, my: y + 30, size: 6 },
        { mx: x - pillarW, my: y - archH + 6, size: 8 },
        { mx: x + w + pillarW - 4, my: y - archH + 10, size: 6 },
      ];
      for (const mp of mossPositions) {
        drawMossBlob(mp.mx, mp.my, mp.size);
      }

      // 5. Hanging vines
      const vineCount = 3 + Math.floor(rngVal(1) * 3);
      for (let vi = 0; vi < vineCount; vi++) {
        const vx = archLeft + 20 + Math.floor(rngVal(2 + vi) * (totalArchW - 40));
        const vineLen = 20 + Math.floor(rngVal(10 + vi) * 20);
        g.lineStyle(2, vine, 0.8);
        g.moveTo(vx, y - archH);
        g.lineTo(vx, y - archH + vineLen);
        // Leaves
        const leafCount = 1 + Math.floor(rngVal(20 + vi) * 2);
        for (let li = 0; li < leafCount; li++) {
          const lyOffset = 6 + Math.floor(rngVal(30 + vi + li) * (vineLen - 10));
          const lxOffset = rngVal(40 + vi + li) > 0.5 ? -4 : 4;
          g.beginFill(leaf);
          g.drawRect(vx + lxOffset, y - archH + lyOffset, 3, 3);
          g.endFill();
        }
      }

      // 6. Arch top outer border
      g.lineStyle(1, stoneDark, 0.6);
      // Left pillar outer edge
      g.moveTo(x - pillarW, y + h);
      g.lineTo(x - pillarW, y);
      // Stepped arch left outer edge
      for (let i = 0; i < steps; i++) {
        const stepTop = y - archH + i * stepH;
        const lx = archLeft + i * stepW;
        g.lineTo(lx, stepTop);
      }
      g.lineTo(archLeft + steps * stepW, y - archH);
      g.lineTo(archLeft + (steps + 1) * stepW, y - archH);
      // Right side
      for (let i = steps - 1; i >= 0; i--) {
        const stepTop = y - archH + i * stepH;
        const rx = archLeft + totalArchW - i * stepW;
        g.lineTo(rx, stepTop);
      }
      g.lineTo(x + w + pillarW, y);
      g.lineTo(x + w + pillarW, y + h);

      this.container.addChild(g);

      // 7. Label
      const cx = x + w / 2;
      const labelText = door.targetZone === 'hub' ? 'Enter Town' : '\u25B6 Exit ' + door.targetZone;
      const label = new Text(labelText, new TextStyle({
        fontFamily: 'monospace', fontSize: 14, fill: '#ffff88',
      }));
      label.anchor.set(0.5, 1);
      label.x = cx;
      label.y = y - archH - 6;
      this.container.addChild(label);
    }
  }
```

- [ ] **Step 3: Verify with type-check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/world/Room.ts
git commit -m "feat: replace door rectangles with pixel-art stone arches

Draws a concrete arch (stone pillars + stepped Gothic-style top) with
moss blobs and hanging vines for each zone transition door. Hub-bound
doors now show 'Enter Town' instead of '▶ Exit Town'."
```
