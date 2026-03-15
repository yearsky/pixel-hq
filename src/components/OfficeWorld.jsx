/**
 * OfficeWorld.jsx — PixelForce HQ pixel office world
 *
 * Architecture overview:
 * - A <canvas> handles ALL animation via requestAnimationFrame
 * - React state only manages: selectedAgent (chat panel), hoveredAgent (cursor)
 * - All mutable game state (positions, frames, timers) lives in a ref
 *   so the RAF loop NEVER gets recreated on state changes
 * - Chat panel is a React sidebar rendered alongside the canvas
 */

import { useRef, useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   WORLD CONSTANTS
═══════════════════════════════════════════════════════════════ */
const T  = 16;   // 1 tile = 16 logical pixels
const CW = 54 * T; // canvas width  = 864px
const CH = 36 * T; // canvas height = 576px

/* ═══════════════════════════════════════════════════════════════
   ROOM DEFINITIONS  (all values in tile units)
   Each room is a rectangle on the tile grid.
   The corridor divides them: col 25-28 vertical, row 16-18 horizontal.
═══════════════════════════════════════════════════════════════ */
const ROOMS = {
  commander: {
    tx: 1, ty: 1, tw: 23, th: 14,
    floor1: "#110d00", floor2: "#180f00",
    wall:   "#2a1a00", accent: "#FFD700",
  },
  scribe: {
    tx: 30, ty: 1, tw: 23, th: 14,
    floor1: "#00120a", floor2: "#001a0e",
    wall:   "#002a14", accent: "#00E5A0",
  },
  amplifier: {
    tx: 1, ty: 20, tw: 23, th: 15,
    floor1: "#120300", floor2: "#180400",
    wall:   "#280800", accent: "#FF6B6B",
  },
  registry: {
    tx: 30, ty: 20, tw: 23, th: 15,
    floor1: "#00091a", floor2: "#000c1f",
    wall:   "#001830", accent: "#60A5FA",
  },
};

/* ═══════════════════════════════════════════════════════════════
   CHARACTER SPRITES  (8 wide × 10 tall, each cell = 1 "pixel")
   Color index meanings:
     0 = transparent
     1 = body color  (agent accent)
     2 = skin        (#F4C4A4)
     3 = dark        (#1a0a00)
     4 = hair        (agent hair color, derived from accent)
═══════════════════════════════════════════════════════════════ */
const SPR = {
  // Standing, facing camera
  idle: [
    [0,0,0,4,4,0,0,0],
    [0,0,4,4,4,4,0,0],
    [0,3,2,2,2,2,3,0],
    [0,3,2,2,2,2,3,0],
    [0,0,3,2,2,3,0,0],
    [3,1,1,1,1,1,1,3],
    [3,1,1,1,1,1,1,3],
    [0,1,1,1,1,1,1,0],
    [0,1,0,3,3,0,1,0],
    [0,3,0,0,0,0,3,0],
  ],
  // Walk frame A — left foot forward
  wA: [
    [0,0,0,4,4,0,0,0],
    [0,0,4,4,4,4,0,0],
    [0,3,2,2,2,2,3,0],
    [0,3,2,2,2,2,3,0],
    [0,0,3,2,2,3,0,0],
    [3,1,1,1,1,1,1,3],
    [3,1,1,1,1,1,1,3],
    [0,1,1,1,1,1,1,0],
    [3,1,0,3,0,0,0,0],
    [0,1,0,0,0,1,3,0],
  ],
  // Walk frame B — right foot forward
  wB: [
    [0,0,0,4,4,0,0,0],
    [0,0,4,4,4,4,0,0],
    [0,3,2,2,2,2,3,0],
    [0,3,2,2,2,2,3,0],
    [0,0,3,2,2,3,0,0],
    [3,1,1,1,1,1,1,3],
    [3,1,1,1,1,1,1,3],
    [0,1,1,1,1,1,1,0],
    [0,0,0,0,3,0,1,3],
    [0,3,1,0,0,0,1,0],
  ],
  // Side-facing (left direction; mirror for right)
  sideA: [
    [0,0,4,4,4,0,0,0],
    [0,4,4,4,4,3,0,0],
    [0,3,2,2,3,0,0,0],
    [0,3,2,2,3,0,0,0],
    [0,0,3,2,3,0,0,0],
    [3,1,1,1,1,3,0,0],
    [3,1,1,1,1,3,0,0],
    [0,1,1,1,1,0,0,0],
    [3,1,0,1,0,0,0,0],
    [0,3,0,3,0,0,0,0],
  ],
  sideB: [
    [0,0,4,4,4,0,0,0],
    [0,4,4,4,4,3,0,0],
    [0,3,2,2,3,0,0,0],
    [0,3,2,2,3,0,0,0],
    [0,0,3,2,3,0,0,0],
    [3,1,1,1,1,3,0,0],
    [3,1,1,1,1,3,0,0],
    [0,1,1,1,1,0,0,0],
    [0,1,3,0,0,0,0,0],
    [3,0,0,0,3,0,0,0],
  ],
};

const SPRITE_PX = 2; // each sprite pixel = 2 canvas pixels

/* ═══════════════════════════════════════════════════════════════
   AGENT DEFINITIONS  (position = tile center of their room)
═══════════════════════════════════════════════════════════════ */
const AGENTS = [
  {
    id: "commander", name: "COMMANDER", role: "Manager",
    color: "#FFD700", hairColor: "#8B6500", roomKey: "commander",
    system: `You are COMMANDER, the AI Manager agent of PixelForce HQ — a retro pixel-themed digital agency. You lead SCRIBE (Content Writer), AMPLIFIER (Marketing), and REGISTRY (Administration).
Role: Project strategy, task delegation, resource planning, team sync.
Personality: Decisive, tactical, slightly theatrical like an RPG general. Speak with authority and brevity. When given a project brief, break it into concrete subtasks and name which squad member handles each. Use military/RPG metaphors naturally — deploy, mission, squad, flank, quest. Max 4 sentences unless laying out a full plan.`,
  },
  {
    id: "scribe", name: "SCRIBE", role: "Content Writer",
    color: "#00E5A0", hairColor: "#005a40", roomKey: "scribe",
    system: `You are SCRIBE, the AI Content Writer of PixelForce HQ — a retro pixel-themed digital agency. You work under COMMANDER alongside AMPLIFIER and REGISTRY.
Role: Blog posts, landing page copy, scripts, captions, newsletters, SEO articles, brand voice.
Personality: Word-obsessed, enthusiastic craftsperson. You reference narrative arcs and writing techniques. You frequently offer to draft content immediately — that's your instinct. Use 8-bit metaphors naturally: render, pixel-perfect prose, loading the next chapter. Keep energy high.`,
  },
  {
    id: "amplifier", name: "AMPLIFIER", role: "Marketing",
    color: "#FF6B6B", hairColor: "#7a1010", roomKey: "amplifier",
    system: `You are AMPLIFIER, the AI Marketing agent of PixelForce HQ — a retro pixel-themed digital agency. You work under COMMANDER alongside SCRIBE and REGISTRY.
Role: Marketing strategy, campaign design, growth hacking, social media, branding, audience targeting, conversion funnels.
Personality: High-energy, trend-obsessed, metric-driven. You think in reach, virality, and conversion rates. Use game metaphors naturally — level up, boss fight with competitors, unlock new audiences, high score. Always tie ideas to measurable outcomes. Be punchy, never fluff.`,
  },
  {
    id: "registry", name: "REGISTRY", role: "Administration",
    color: "#60A5FA", hairColor: "#1a3a7a", roomKey: "registry",
    system: `You are REGISTRY, the AI Administration agent of PixelForce HQ — a retro pixel-themed digital agency. You work under COMMANDER alongside SCRIBE and AMPLIFIER.
Role: SOPs, scheduling, documentation, process design, operational efficiency, record-keeping, compliance tracking.
Personality: Meticulous, systematic, completely calm under chaos. You love airtight checklists and well-structured processes. Use database/system metaphors naturally — logging, indexing, queuing, syncing. Always provide structured, actionable output.`,
  },
];

/* ═══════════════════════════════════════════════════════════════
   DRAW HELPERS
═══════════════════════════════════════════════════════════════ */

/** Draw a single sprite frame at (x,y) with a given pixel scale */
function drawSprite(ctx, frame, x, y, px, bodyColor, hairColor) {
  const palette = [null, bodyColor, "#F4C4A4", "#1a0a00", hairColor];
  frame.forEach((row, ry) => {
    row.forEach((ci, cx) => {
      if (!ci) return;
      ctx.fillStyle = palette[ci];
      ctx.fillRect(x + cx * px, y + ry * px, px, px);
    });
  });
}

/** Pixel-perfect rectangle (optionally with 1px border) */
function pr(ctx, x, y, w, h, fill, border) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (border) {
    ctx.fillStyle = border;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FURNITURE DRAWING FUNCTIONS  (one per room)
   Each receives (ctx, room, T) where room is the ROOMS entry.
═══════════════════════════════════════════════════════════════ */

function drawCommanderRoom(ctx, rm) {
  const X = rm.tx * T, Y = rm.ty * T;
  const gold = "#FFD700", dGold = "#6B5000";
  const wood = "#5C3A1E", dWood = "#3A2010";

  // ── Big command desk ──
  pr(ctx, X+3*T, Y+4*T, 9*T, 4*T, wood, dWood);
  pr(ctx, X+3*T+2, Y+4*T+2, 9*T-4, 4*T-4, "#6B4020");
  // Papers on desk
  pr(ctx, X+4*T, Y+4*T+4, 2*T+4, T, "#eeeedd", "#aaa");
  pr(ctx, X+6*T+4, Y+4*T+8, T+8, T-4, "#d8d8c0", "#999");
  // Gold nameplate
  pr(ctx, X+3*T+6, Y+5*T+6, 3*T, 5, gold, dGold);

  // ── Tactical map board (north wall) ──
  pr(ctx, X+14*T, Y+T+4, 7*T, 5*T+4, "#111c38", "#3355aa");
  pr(ctx, X+14*T+3, Y+T+7, 7*T-6, 5*T-4, "#0a1428");
  // Grid lines
  ctx.fillStyle = "#334488";
  for (let i = 0; i < 6; i++) ctx.fillRect(X+14*T+3, Y+T+9+i*9, 7*T-6, 1);
  for (let i = 0; i < 5; i++) ctx.fillRect(X+14*T+3+i*14, Y+T+7, 1, 5*T-4);
  // Map markers (gold dots)
  ctx.fillStyle = gold;
  [[1,1],[3,2],[5,1],[2,3],[4,4],[1,4]].forEach(([mx,my]) => {
    ctx.fillRect(X+14*T+4+mx*14, Y+T+10+my*9, 4, 4);
  });
  // Connection lines between markers
  ctx.strokeStyle = gold + "88"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X+14*T+6, Y+T+13); ctx.lineTo(X+14*T+20, Y+T+22);
  ctx.lineTo(X+14*T+48, Y+T+13); ctx.stroke();
  // Label
  ctx.fillStyle = gold; ctx.font = "bold 6px monospace";
  ctx.fillText("TACTICAL MAP", X+14*T+4, Y+T+6);

  // ── Flag pole + banner ──
  pr(ctx, X+21*T, Y+T+2, 2, 6*T, "#888");
  pr(ctx, X+21*T+2, Y+T+2, 3*T, T+6, gold, dGold);
  ctx.fillStyle = dGold;
  ctx.fillRect(X+22*T+2, Y+T+5, 8, 8); // star/emblem

  // ── Tall bookshelf (east wall) ──
  pr(ctx, X+20*T+4, Y+7*T, 2*T, 6*T, wood, dWood);
  const bkColors = [gold,"#cc4444","#4466cc",gold,"#44cc66","#cc44cc"];
  bkColors.forEach((c,i) => {
    pr(ctx, X+20*T+6+i*5, Y+7*T+3, 4, 6*T-6, c, "#222");
  });

  // ── Commander chair ──
  pr(ctx, X+6*T, Y+9*T, 3*T, 3*T, "#2a1200", "#111");
  pr(ctx, X+6*T+4, Y+8*T+4, 2*T-8, T+4, "#2a1200", "#111");

  // ── Floor lamp ──
  pr(ctx, X+2*T, Y+9*T, 2, 4*T, "#666");
  pr(ctx, X+2*T-10, Y+9*T, 22, T, gold, dGold);
  ctx.fillStyle = "rgba(255,215,0,0.1)";
  ctx.beginPath(); ctx.arc(X+2*T+1, Y+9*T+8, 28, 0, Math.PI*2); ctx.fill();

  // ── Trophy/award on desk corner ──
  pr(ctx, X+11*T, Y+4*T+3, 6, 8, gold, dGold);
  pr(ctx, X+11*T-2, Y+4*T+10, 10, 3, dGold);
}

function drawScribeRoom(ctx, rm) {
  const X = rm.tx * T, Y = rm.ty * T;
  const teal = "#00E5A0", dTeal = "#006644";
  const wood = "#4A3020", dWood = "#2A1800";

  // ── Wide bookshelf (north wall) ──
  pr(ctx, X+2*T, Y+T+4, 20*T, 3*T, wood, dWood);
  const bkC = [teal,"#e8b030","#c05050","#7080cc",teal,"#d05080","#50aa50","#cc44cc",teal,"#e08030","#7078dd","#40aabb","#ee8844",teal,"#bb3377","#66aa66","#dd5050",teal];
  bkC.forEach((c,i) => {
    pr(ctx, X+2*T+4+i*(T-1), Y+T+6, T-3, 3*T-8, c, "#111");
    ctx.fillStyle = "#ffffff33";
    ctx.fillRect(X+2*T+6+i*(T-1), Y+T+10, T-7, 1);
  });

  // ── Writing desk ──
  pr(ctx, X+3*T, Y+5*T, 7*T, 3*T+4, wood, dWood);
  pr(ctx, X+3*T+2, Y+5*T+2, 7*T-4, 3*T, "#5A4030");
  // Scattered papers
  for (let i = 0; i < 6; i++) {
    const px2 = X+3*T+4+i*(T+2), py2 = Y+5*T+4+(i%3)*4;
    pr(ctx, px2, py2, T+6, T-2, "#eeeecc", "#aaa");
    ctx.fillStyle = "#88888880";
    for (let l = 0; l < 3; l++) ctx.fillRect(px2+2, py2+3+l*4, T, 1);
  }

  // ── Typewriter ──
  pr(ctx, X+3*T+4, Y+6*T, 3*T+4, 2*T, "#2a2a2a", "#111");
  // Keys row
  for (let k = 0; k < 8; k++) ctx.fillStyle = "#555", ctx.fillRect(X+3*T+6+k*6, Y+6*T+T+2, 5, 4);
  // Paper in typewriter
  pr(ctx, X+4*T+2, Y+5*T+2, T+8, T-2, "#fffef0", "#ccc");
  // Text on paper
  ctx.fillStyle = "#33333360";
  for (let l = 0; l < 2; l++) ctx.fillRect(X+4*T+4, Y+5*T+5+l*4, T+2, 1);

  // ── Lamp on desk ──
  pr(ctx, X+9*T, Y+5*T, 2, 2*T+4, "#888");
  pr(ctx, X+9*T-8, Y+5*T, 18, T, teal, dTeal);
  ctx.fillStyle = "rgba(0,229,160,0.1)";
  ctx.beginPath(); ctx.arc(X+9*T+1, Y+5*T+6, 22, 0, Math.PI*2); ctx.fill();

  // ── Cork/ideas board (east wall) ──
  pr(ctx, X+20*T+4, Y+T+4, 3*T, 4*T+8, "#8B6010", "#5A4008");
  [["#fff9c4","#ffccbc"],["#e8f5e9","#d0edff"]].flat().forEach((nc, i) => {
    const nx = X+20*T+6+(i%2)*(T+2), ny = Y+T+8+Math.floor(i/2)*2*T;
    pr(ctx, nx, ny, T+4, T+6, nc, "#bbb");
    ctx.fillStyle = "#88888880";
    for (let l = 0; l < 3; l++) ctx.fillRect(nx+2, ny+4+l*4, T, 1);
    ctx.fillStyle = "#ff5555"; ctx.fillRect(nx+T/2, ny+1, 3, 3); // pin
  });

  // ── Chair ──
  pr(ctx, X+5*T, Y+9*T, 3*T, 3*T, "#2A1800", "#111");
  pr(ctx, X+5*T+4, Y+8*T+4, 2*T-8, T+4, "#2A1800", "#111");

  // ── Potted plant (corner) ──
  pr(ctx, X+21*T+4, Y+9*T+T, 2*T, T+4, "#7B3F00", "#5A2A00");
  ctx.fillStyle = "#246800";
  ctx.beginPath(); ctx.arc(X+22*T+4, Y+9*T+4, T+2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#34A820";
  ctx.beginPath(); ctx.arc(X+22*T+10, Y+9*T, 9, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(X+22*T-2, Y+9*T+2, 7, 0, Math.PI*2); ctx.fill();
}

function drawAmplifierRoom(ctx, rm) {
  const X = rm.tx * T, Y = rm.ty * T;
  const red = "#FF6B6B", dRed = "#7a1010";

  // ── Standing desk (center) ──
  pr(ctx, X+2*T, Y+5*T, 11*T, 3*T+4, "#3a1400", "#280a00");
  // Monitor stands
  pr(ctx, X+4*T, Y+3*T+4, T, 2*T, "#222", "#111");
  pr(ctx, X+7*T, Y+3*T+4, T, 2*T, "#222", "#111");
  // Two monitors
  pr(ctx, X+3*T, Y+T+6, 3*T, 2*T+4, "#111", "#1a1a1a");
  pr(ctx, X+6*T+4, Y+T+6, 3*T, 2*T+4, "#111", "#1a1a1a");
  // Screen 1 — bar chart
  pr(ctx, X+3*T+4, Y+T+10, 3*T-8, 2*T-4, "#060820");
  [[3,18],[7,12],[11,20],[15,8],[19,22],[23,15]].forEach(([bx,bh]) => {
    ctx.fillStyle = bx % 8 === 3 ? red : red + "88";
    ctx.fillRect(X+3*T+4+bx, Y+T+10+(2*T-8)-bh, 5, bh);
  });
  // Screen 2 — trending line
  pr(ctx, X+6*T+8, Y+T+10, 3*T-8, 2*T-4, "#062008");
  ctx.strokeStyle = "#00ff66"; ctx.lineWidth = 1;
  ctx.beginPath();
  [[2,18],[7,14],[13,16],[18,9],[24,11],[30,5],[36,7]].forEach(([lx,ly], i) => {
    const fx = X+6*T+10+lx, fy = Y+T+10+ly;
    i === 0 ? ctx.moveTo(fx,fy) : ctx.lineTo(fx,fy);
  });
  ctx.stroke();
  // Energy drinks
  pr(ctx, X+12*T, Y+5*T+4, 6, T+4, red, dRed);
  pr(ctx, X+12*T+8, Y+5*T+6, 6, T+2, "#aaa", "#555");
  pr(ctx, X+12*T+16, Y+5*T+8, 6, T, red + "88", dRed);

  // ── Whiteboard (north wall) ──
  pr(ctx, X+13*T, Y+T+2, 9*T, 7*T, "#f4f4f0", "#aaa");
  pr(ctx, X+13*T+3, Y+T+5, 9*T-6, 7*T-6, "#fafaf8");
  // Funnel diagram on whiteboard
  ctx.fillStyle = red + "55";
  ctx.beginPath();
  ctx.moveTo(X+13*T+6, Y+T+8); ctx.lineTo(X+22*T-6, Y+T+8);
  ctx.lineTo(X+19*T, Y+T+4*T); ctx.lineTo(X+16*T, Y+T+4*T);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = red; ctx.lineWidth = 1; ctx.stroke();
  // Labels
  ctx.fillStyle = dRed; ctx.font = "bold 6px monospace";
  ctx.fillText("FUNNEL →CONVERT", X+13*T+5, Y+T+7);
  ctx.fillStyle = red; ctx.font = "5px monospace";
  ["REACH","ENGAGE","CONVERT"].forEach((lbl,i) => {
    ctx.fillText(lbl, X+15*T+i*4, Y+T+14+i*14);
  });
  // Arrow
  ctx.fillStyle = dRed;
  ctx.beginPath();
  ctx.moveTo(X+17*T+4, Y+T+4*T+4);
  ctx.lineTo(X+17*T+10, Y+T+5*T+2);
  ctx.lineTo(X+17*T-2, Y+T+5*T+2);
  ctx.closePath(); ctx.fill();

  // ── Poster (east wall) ──
  pr(ctx, X+20*T, Y+T+4, 3*T, 5*T, "#1a0808", "#440000");
  ctx.fillStyle = red; ctx.font = "bold 9px monospace";
  ctx.fillText("GROW", X+20*T+4, Y+2*T+4);
  ctx.fillStyle = "#ff9966"; ctx.font = "7px monospace";
  ctx.fillText("OR DIE", X+20*T+6, Y+3*T);
  // Sparkline on poster
  ctx.strokeStyle = red+"88"; ctx.lineWidth = 1;
  ctx.beginPath();
  [[2,24],[6,20],[10,22],[14,14],[20,8],[26,10],[32,4],[38,6]].forEach(([lx,ly],i) => {
    const fx = X+20*T+lx, fy = Y+T+4+ly;
    i===0 ? ctx.moveTo(fx,fy) : ctx.lineTo(fx,fy);
  });
  ctx.stroke();

  // ── Chair ──
  pr(ctx, X+5*T, Y+9*T+4, 3*T, 3*T, "#1a0800", "#111");
  pr(ctx, X+5*T+4, Y+9*T, 2*T-8, T+6, "#1a0800", "#111");
}

function drawRegistryRoom(ctx, rm) {
  const X = rm.tx * T, Y = rm.ty * T;
  const blue = "#60A5FA", dBlue = "#1a3a7a";

  // ── Tidy desk (center-left) ──
  pr(ctx, X+3*T, Y+6*T, 7*T, 3*T, "#1a2a3a", "#0a1828");
  pr(ctx, X+3*T+2, Y+6*T+2, 7*T-4, 3*T-4, "#1e3040");
  // Single neat monitor + stand
  pr(ctx, X+5*T+4, Y+3*T+4, T+4, 2*T+4, "#222", "#111");
  pr(ctx, X+4*T+4, Y+T+6, 4*T, 2*T+4, "#111", "#1a1a22");
  pr(ctx, X+4*T+8, Y+T+10, 4*T-8, 2*T-4, "#060830");
  // Terminal lines on screen
  ctx.fillStyle = blue; ctx.font = "4px monospace";
  ["> LOG_001 ✓","> INDEX OK","> SYNC...","> ALL CLEAR"].forEach((line,i) => {
    ctx.fillText(line, X+4*T+10, Y+T+14+i*7);
  });
  // Keyboard
  pr(ctx, X+3*T+4, Y+7*T, 4*T, 5, "#333", "#555");
  // Mouse
  pr(ctx, X+8*T, Y+6*T+6, T, T+2, "#444", "#333");
  pr(ctx, X+8*T+3, Y+6*T+2, T-6, 5, "#333");

  // ── Filing cabinets (east wall) ──
  for (let ci = 0; ci < 3; ci++) {
    const cx = X+20*T+ci*(T+4);
    pr(ctx, cx, Y+T+4, T, 9*T, "#1e2e40", "#0e1e30");
    // Drawers
    for (let di = 0; di < 4; di++) {
      pr(ctx, cx+2, Y+T+8+di*2*T, T-4, T+6, "#243444", "#101e2c");
      pr(ctx, cx+4, Y+T+12+di*2*T, T-8, 4, blue, dBlue); // handle
    }
    // Labels
    ctx.fillStyle = "#ffffff44"; ctx.font = "4px monospace";
    ["A–F","G–M","N–T","U–Z"].forEach((lbl,di) => {
      ctx.fillText(lbl, cx+2, Y+T+8+di*2*T+4);
    });
  }

  // ── Clock on north wall ──
  ctx.fillStyle = "#f0f0f8";
  ctx.beginPath(); ctx.arc(X+15*T+4, Y+T+T+2, T, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#2a3a4a"; ctx.lineWidth = 1; ctx.stroke();
  // Ticks
  for (let h = 0; h < 12; h++) {
    const ang = h/12*Math.PI*2 - Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(X+15*T+4+Math.cos(ang)*(T-4), Y+T+T+2+Math.sin(ang)*(T-4));
    ctx.lineTo(X+15*T+4+Math.cos(ang)*T, Y+T+T+2+Math.sin(ang)*T);
    ctx.stroke();
  }
  // Hands (9:15)
  ctx.strokeStyle = "#1a2a3a"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X+15*T+4,Y+T+T+2); ctx.lineTo(X+15*T-4,Y+T+T+2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X+15*T+4,Y+T+T+2); ctx.lineTo(X+15*T+4,Y+T+T-8); ctx.stroke();

  // ── Organized shelving (top-left area) ──
  pr(ctx, X+2*T, Y+T+4, 9*T, 3*T, "#1a2a3a", "#0a1828");
  const bndrC = [blue,"#3a7acc",dBlue,"#4a8acc",blue,dBlue,"#2a6aaa","#5a9add",blue];
  bndrC.forEach((c,i) => {
    pr(ctx, X+2*T+4+i*(T-1), Y+T+6, T-3, 3*T-8, c, "#111");
    ctx.fillStyle = "#ffffff44"; ctx.fillRect(X+2*T+6+i*(T-1), Y+T+8, T-7, 1);
    ctx.fillRect(X+2*T+6+i*(T-1), Y+T+12, T-10, 1);
  });

  // ── Chair (tidy, aligned) ──
  pr(ctx, X+5*T, Y+10*T, 3*T, 3*T, "#0a1828", "#111");
  pr(ctx, X+5*T+4, Y+9*T+4, 2*T-8, T+4, "#0a1828", "#111");

  // ── Stack of files on corner ──
  [6,4,2].forEach((w,i) => {
    pr(ctx, X+12*T+i*2, Y+6*T+i*2, T*2-i*4, 3, ["#dde","#ccd","#bbc"][i], "#999");
  });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function OfficeWorld({ onBack, chats, setChats }) {
  const canvasRef     = useRef(null);
  const gameRef       = useRef(null);   // all mutable game state — never triggers re-render
  const hoveredRef    = useRef(null);   // ref so RAF can read current hover without re-create
  const selectedRef   = useRef(null);   // same for selected
  const rafRef        = useRef(null);

  const [selectedId, _setSelectedId] = useState(null);
  const [, forceRender]              = useState(0);   // used to refresh chat panel only

  // Keep refs in sync with state setters
  const setSelectedId = (id) => {
    _setSelectedId(id);
    selectedRef.current = id;
    forceRender(n => n + 1);
  };

  const selectedAgent = AGENTS.find(a => a.id === selectedId);
  const msgs          = selectedId ? (chats[selectedId] || []) : [];

  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  // ── Pick a new random walking target inside an agent's room ──
  const pickTarget = useCallback((ag) => {
    const rm = ROOMS[ag.roomKey];
    const margin = 4; // stay this many tiles away from walls
    ag.tx = (rm.tx + margin + Math.random() * (rm.tw - margin * 2 - 1)) * T;
    ag.ty = (rm.ty + margin + 2 + Math.random() * (rm.th - margin * 2 - 3)) * T;
  }, []);

  // ── Initialize game state once ──
  useEffect(() => {
    gameRef.current = {
      tick: 0,
      agents: AGENTS.map(agDef => {
        const rm = ROOMS[agDef.roomKey];
        const startX = (rm.tx + Math.floor(rm.tw / 2)) * T;
        const startY = (rm.ty + Math.floor(rm.th / 2) + 1) * T;
        return {
          id:          agDef.id,
          roomKey:     agDef.roomKey,
          x:           startX,
          y:           startY,
          tx:          startX,  // walk target x
          ty:          startY,  // walk target y
          dir:         "idle",  // idle | left | right | up | down
          walkFrame:   0,       // 0 or 1
          frameTick:   0,       // counts up to FRAME_DURATION
          idleTick:    0,       // how long we've been idle
          idleDuration: 80 + Math.random() * 140, // random idle time
          speed:       1.2,
        };
      }),
    };

    // Kick off initial targets so they start moving right away
    gameRef.current.agents.forEach(ag => pickTarget(ag));
  }, [pickTarget]);

  // ── Main RAF render + update loop ──
  useEffect(() => {
    if (!gameRef.current) return;

    const FRAME_DUR = 10; // ticks per walk frame switch

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const { agents } = gameRef.current;
      gameRef.current.tick++;

      /* ─── UPDATE ─────────────────────────────────── */
      agents.forEach(ag => {
        ag.frameTick++;
        if (ag.frameTick >= FRAME_DUR) {
          ag.walkFrame = 1 - ag.walkFrame;
          ag.frameTick = 0;
        }

        const dx = ag.tx - ag.x;
        const dy = ag.ty - ag.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
          // Arrived — idle until timer runs out, then pick new target
          ag.dir = "idle";
          ag.idleTick++;
          if (ag.idleTick >= ag.idleDuration) {
            ag.idleTick = 0;
            ag.idleDuration = 80 + Math.random() * 160;
            pickTarget(ag);
          }
        } else {
          const vx = (dx / dist) * ag.speed;
          const vy = (dy / dist) * ag.speed;
          ag.x += vx;
          ag.y += vy;
          // Determine direction by dominant axis
          if (Math.abs(dx) > Math.abs(dy)) {
            ag.dir = dx > 0 ? "right" : "left";
          } else {
            ag.dir = dy > 0 ? "down" : "up";
          }
        }
      });

      /* ─── RENDER ─────────────────────────────────── */
      // Background
      ctx.fillStyle = "#030310";
      ctx.fillRect(0, 0, CW, CH);

      // Corridors
      ctx.fillStyle = "#080814";
      ctx.fillRect(0, 16*T, CW, 3*T);       // horizontal
      ctx.fillRect(25*T, 0, 4*T, CH);        // vertical
      // Corridor subtle tile lines
      ctx.fillStyle = "#ffffff04";
      for (let x = 0; x <= CW; x += T) ctx.fillRect(x, 16*T, 1, 3*T);
      for (let y = 0; y <= CH; y += T) ctx.fillRect(25*T, y, 4*T, 1);
      // Center HQ logo area
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(25*T, 16*T, 4*T, 3*T);
      ctx.fillStyle = "#7B61FF44";
      ctx.font = "bold 5px monospace";
      ctx.fillText("HQ", 25*T + T + 4, 16*T + T + 8);

      // Draw all rooms (floor + walls + furniture)
      Object.entries(ROOMS).forEach(([, rm]) => {
        const rx = rm.tx * T, ry = rm.ty * T;
        const rw = rm.tw * T, rh = rm.th * T;

        // Checkerboard floor
        for (let ty = 0; ty < rm.th; ty++) {
          for (let tx2 = 0; tx2 < rm.tw; tx2++) {
            ctx.fillStyle = (tx2 + ty) % 2 === 0 ? rm.floor1 : rm.floor2;
            ctx.fillRect(rx + tx2 * T, ry + ty * T, T, T);
          }
        }

        // Thick walls (1 tile)
        ctx.fillStyle = rm.wall;
        ctx.fillRect(rx, ry, rw, T);                   // north
        ctx.fillRect(rx, ry + rh - T, rw, T);          // south
        ctx.fillRect(rx, ry, T, rh);                   // west
        ctx.fillRect(rx + rw - T, ry, T, rh);          // east

        // Inner accent line
        ctx.fillStyle = rm.accent + "28";
        ctx.fillRect(rx + T, ry + T, rw - 2 * T, 2);
        ctx.fillRect(rx + T, ry + T, 2, rh - 2 * T);
        ctx.fillStyle = rm.accent + "80";
        ctx.fillRect(rx + T + 2, ry + T + 2, 4, 4);   // corner dot
      });

      // Furniture per room
      drawCommanderRoom(ctx, ROOMS.commander);
      drawScribeRoom(ctx,    ROOMS.scribe);
      drawAmplifierRoom(ctx, ROOMS.amplifier);
      drawRegistryRoom(ctx,  ROOMS.registry);

      // ── Draw agents ──────────────────────────────
      agents.forEach(ag => {
        const agDef  = AGENTS.find(a => a.id === ag.id);
        const isHov  = hoveredRef.current === ag.id;
        const isSel  = selectedRef.current === ag.id;
        const PX     = SPRITE_PX;

        // Ground shadow ellipse
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.ellipse(ag.x + 8, ag.y + 19, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hover/select glow ring
        if (isHov || isSel) {
          ctx.strokeStyle = agDef.color + (isSel ? "ee" : "88");
          ctx.lineWidth = isSel ? 2 : 1;
          ctx.setLineDash(isSel ? [2, 2] : []);
          ctx.strokeRect(ag.x - 3, ag.y - 4, 8 * PX + 6, 10 * PX + 8);
          ctx.setLineDash([]);
        }

        // Pick sprite frame based on direction
        let frame;
        if (ag.dir === "idle" || ag.dir === "up") {
          frame = SPR.idle;
        } else if (ag.dir === "left") {
          frame = ag.walkFrame === 0 ? SPR.sideA : SPR.sideB;
        } else if (ag.dir === "right") {
          frame = ag.walkFrame === 0 ? SPR.sideA : SPR.sideB; // mirrored below
        } else {
          frame = ag.walkFrame === 0 ? SPR.wA : SPR.wB;
        }

        // Mirror canvas for right-facing
        ctx.save();
        if (ag.dir === "right") {
          ctx.translate(ag.x + 8 * PX, 0);
          ctx.scale(-1, 1);
          drawSprite(ctx, frame, 0, ag.y - 2, PX, agDef.color, agDef.hairColor);
        } else {
          drawSprite(ctx, frame, ag.x, ag.y - 2, PX, agDef.color, agDef.hairColor);
        }
        ctx.restore();

        // Name label above character
        const labelW = agDef.name.length * 5 + 8;
        const labelX = ag.x + 8 - labelW / 2;
        const labelY = ag.y - 9;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(labelX, labelY, labelW, 8);
        ctx.fillStyle = isSel ? agDef.color : agDef.color + "bb";
        ctx.strokeStyle = agDef.color + "44";
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX, labelY, labelW, 8);
        ctx.font = "5px monospace";
        ctx.fillText(agDef.name, labelX + 4, labelY + 6);
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [pickTarget]);

  // ── Click handler ──
  const handleClick = useCallback((e) => {
    if (!canvasRef.current || !gameRef.current) return;
    const rect  = canvasRef.current.getBoundingClientRect();
    const mx    = (e.clientX - rect.left) * (CW / rect.width);
    const my    = (e.clientY - rect.top)  * (CH / rect.height);
    let nearest = null, minD = 36;
    gameRef.current.agents.forEach(ag => {
      const d = Math.hypot(mx - (ag.x + 8), my - (ag.y + 10));
      if (d < minD) { minD = d; nearest = ag.id; }
    });
    setSelectedId(nearest === selectedRef.current ? null : nearest);
  }, []);

  // ── Mouse move handler ──
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || !gameRef.current) return;
    const rect  = canvasRef.current.getBoundingClientRect();
    const mx    = (e.clientX - rect.left) * (CW / rect.width);
    const my    = (e.clientY - rect.top)  * (CH / rect.height);
    let nearest = null, minD = 36;
    gameRef.current.agents.forEach(ag => {
      const d = Math.hypot(mx - (ag.x + 8), my - (ag.y + 10));
      if (d < minD) { minD = d; nearest = ag.id; }
    });
    hoveredRef.current = nearest;
    canvasRef.current.style.cursor = nearest ? "pointer" : "default";
  }, []);

  // ── Send message ──
  const send = useCallback(async () => {
    if (!input.trim() || loading || !selectedId) return;
    const agDef   = AGENTS.find(a => a.id === selectedId);
    const userMsg = { role: "user", content: input.trim() };
    const history = chats[selectedId] || [];
    const next    = [...history, userMsg];
    setChats(p => ({ ...p, [selectedId]: next }));
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: agDef.system,
          messages: next,
        }),
      });
      const data = await res.json();
      setChats(p => ({
        ...p,
        [selectedId]: [...next, { role: "assistant", content: data.content[0].text }],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedId, chats, setChats]);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div style={{
      display: "flex", height: "100vh", background: "#030310",
      overflow: "hidden", fontFamily: "'Press Start 2P', monospace",
    }}>
      {/* ── LEFT: World canvas + header ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          padding: "10px 20px", background: "#0a0a1e",
          borderBottom: "2px solid #ffffff10",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              {["#7B61FF","#00E5A0","#FF6B6B","#FFD700"].map((c,i) => (
                <div key={i} className={i%2?"blink2":"blink"}
                  style={{ width: 8, height: 8, background: c }} />
              ))}
            </div>
            <span style={{ fontSize: "0.6rem", color: "#fff" }}>PIXELFORCE HQ</span>
            <span style={{ fontSize: "0.26rem", color: "#7B61FF", letterSpacing: "0.1em" }}>
              ▸ OFFICE WORLD ◂
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: "0.26rem", color: "#ffffff30", letterSpacing: "0.08em" }}>
              {selectedAgent
                ? `COMMS: ${selectedAgent.name}`
                : "CLICK AN AGENT TO OPEN COMMS"}
            </span>
            <button onClick={onBack} style={{
              background: "none", border: "1px solid #ffffff18",
              color: "#ffffff40", padding: "5px 10px", cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace", fontSize: "0.28rem",
            }}>← HOME</button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#030310" }}>
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", display: "block",
              imageRendering: "pixelated",
            }}
          />

          {/* Room name overlays (CSS, not canvas — so they don't re-trigger RAF) */}
          {Object.entries(ROOMS).map(([key, rm]) => {
            const agDef = AGENTS.find(a => a.roomKey === key);
            const cssX  = `${(rm.tx + 1.2) * T / CW * 100}%`;
            const cssY  = `${(rm.ty + 0.6) * T / CH * 100}%`;
            return (
              <div key={key} style={{
                position: "absolute", left: cssX, top: cssY,
                fontSize: "0.22rem", color: rm.accent + "88",
                letterSpacing: "0.12em", pointerEvents: "none",
                fontFamily: "'Press Start 2P', monospace",
              }}>
                {agDef.role.toUpperCase()}
              </div>
            );
          })}
        </div>

        {/* Bottom legend */}
        <div style={{
          padding: "8px 20px", background: "#060612",
          borderTop: "1px solid #ffffff08",
          display: "flex", gap: 24, alignItems: "center", flexShrink: 0,
        }}>
          {AGENTS.map(a => (
            <div key={a.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div className="blink2" style={{ width: 6, height: 6, background: a.color }} />
              <span style={{ fontSize: "0.24rem", color: a.color + "aa", letterSpacing: "0.08em" }}>
                {a.name}
              </span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: "0.22rem", color: "#ffffff20" }}>
            v1.0.0 · POWERED BY CLAUDE
          </span>
        </div>
      </div>

      {/* ── RIGHT: Chat panel (slides in) ── */}
      {selectedAgent && (
        <div style={{
          width: 380, flexShrink: 0,
          background: "#07070f",
          borderLeft: `2px solid ${selectedAgent.color}`,
          display: "flex", flexDirection: "column",
          animation: "slideUp 0.18s ease-out",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${selectedAgent.color}20`,
            background: "#0c0c1e",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <p style={{ fontSize: "0.5rem", color: selectedAgent.color, marginBottom: 5 }}>
                {selectedAgent.name}
              </p>
              <p style={{ fontSize: "0.26rem", color: "#ffffff35" }}>
                {selectedAgent.role} · PixelForce HQ
              </p>
            </div>
            <button onClick={() => setSelectedId(null)} style={{
              background: "none", border: "1px solid #ffffff18",
              color: "#ffffff45", padding: "5px 8px", cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace", fontSize: "0.35rem",
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "12px 12px 0",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {msgs.length === 0 && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "36px 16px", textAlign: "center",
              }}>
                {/* Mini sprite in welcome state */}
                <div style={{ marginBottom: 18 }}>
                  {SPR.idle.map((row, ri) => (
                    <div key={ri} style={{ display: "flex", justifyContent: "center" }}>
                      {row.map((ci, ci2) => (
                        <div key={ci2} style={{
                          width: 4, height: 4,
                          background: ci === 0 ? "transparent"
                            : ci === 1 ? selectedAgent.color
                            : ci === 2 ? "#F4C4A4"
                            : ci === 3 ? "#1a0a00"
                            : selectedAgent.hairColor,
                        }} />
                      ))}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.36rem", color: selectedAgent.color, marginBottom: 8 }}>
                  {selectedAgent.name} ON DUTY
                </p>
                <p style={{ fontSize: "0.26rem", color: "#ffffff20", lineHeight: 2.2 }}>
                  Assign your mission below.
                </p>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                animation: "slideUp 0.12s ease-out",
              }}>
                <div style={{
                  maxWidth: "86%",
                  border: m.role === "user"
                    ? "1px solid #ffffff12"
                    : `1px solid ${selectedAgent.color}28`,
                  borderLeft: m.role === "assistant"
                    ? `2px solid ${selectedAgent.color}` : undefined,
                  background: m.role === "user" ? "#101020" : "#0b0b1e",
                  padding: "8px 10px",
                }}>
                  {m.role === "assistant" && (
                    <span style={{
                      display: "block", fontSize: "0.24rem",
                      color: selectedAgent.color, marginBottom: 4, letterSpacing: "0.08em",
                    }}>
                      [{selectedAgent.name}]
                    </span>
                  )}
                  <p style={{
                    fontSize: "0.35rem", lineHeight: 2,
                    color: m.role === "user" ? "#b8b8c8" : "#d0d0dc",
                    whiteSpace: "pre-wrap", margin: 0,
                  }}>{m.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", paddingBottom: 8 }}>
                <div style={{
                  border: `1px solid ${selectedAgent.color}28`,
                  borderLeft: `2px solid ${selectedAgent.color}`,
                  background: "#0b0b1e", padding: "8px 10px",
                }}>
                  <span style={{ fontSize: "0.28rem", color: selectedAgent.color, marginBottom: 4, display: "block" }}>
                    [{selectedAgent.name}]
                  </span>
                  <span className="blink" style={{ fontSize: "0.36rem", color: selectedAgent.color }}>
                    ▌ PROCESSING...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: 8 }} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: `1px solid ${selectedAgent.color}20`,
            background: "#050510",
            display: "flex", gap: 6, alignItems: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "0.48rem", color: selectedAgent.color, flexShrink: 0 }}>▸</span>
            <input
              className="pixel-input"
              style={{ "--ac": selectedAgent.color }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="TYPE YOUR MISSION..."
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                flexShrink: 0,
                background: selectedAgent.color,
                border: "none", color: "#000",
                padding: "8px 10px",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "0.3rem", cursor: "pointer",
                opacity: !input.trim() || loading ? 0.4 : 1,
                transition: "opacity 0.12s",
              }}
            >GO</button>
          </div>
        </div>
      )}
    </div>
  );
}