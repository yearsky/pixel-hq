/**
 * OfficeWorld.jsx  v2
 *
 * Warm RPG-style pixel office — matches the agent-dashboard aesthetic:
 * ─ Cream walls · wood/carpet floors · grass + trees outside
 * ─ Characters with THINKING / RESTING / WAITING status badges
 * ─ Speech bubbles during API calls
 * ─ System Roster right panel (dark theme) with token progress bars
 *
 * Architecture:
 * ─ <canvas> owns ALL animation via requestAnimationFrame
 * ─ Mutable agent positions live in gameRef (plain JS, never setState)
 * ─ Only agentStatus + selectedId trigger React re-renders (right panel only)
 */

import { useRef, useEffect, useState, useCallback } from "react";

/* ══════════════════════════════════════════════════════
   §1  CONSTANTS
══════════════════════════════════════════════════════ */
const T  = 14;          // 1 tile = 14 logical px
const CW = 60 * T;      // 840 canvas width
const CH = 44 * T;      // 616 canvas height
const SP = 3;           // sprite pixel scale

/* Warm RPG office palette */
const P = {
  grass:"#5a9940", grassD:"#4a8930", grassH:"#6aaa50",
  path:"#c8b898",  pathD:"#b8a888",
  treeDk:"#1e6b10", treeMd:"#2d8a1c", treeLt:"#3aaa28", treeHi:"#50bb3a",
  trunk:"#7a5010",  trunkD:"#5a3800",
  wallCream:"#d8c8a4", wallLight:"#ede0c0", wallShadow:"#c0b090",
  wd1:"#c49a6a", wd2:"#b08858",
  cp1:"#9898b2", cp2:"#8484a0",
  tl1:"#d8d0bc", tl2:"#c8c0ac",
  gr1:"#6a9060", gr2:"#5a8050",
  deskBr:"#8b5e30", deskLt:"#a07040",
  chairGr:"#4a7040", chairBk:"#3a6030",
  monitor:"#101820", monScr:"#0a1428",
  white:"#f4f4ee",
  bookColors:["#cc4444","#4466cc","#44aa66","#cc8822","#8844cc","#22aacc","#cc4488","#44cc88"],
};

/* ══════════════════════════════════════════════════════
   §2  ROOM DEFINITIONS  (tile coords)
══════════════════════════════════════════════════════ */
const ROOMS = {
  commander:{ tx:1,  ty:3,  tw:27, th:18, f1:P.wd1, f2:P.wd2, wall:P.wallCream,  accent:"#FFD700" },
  scribe:   { tx:32, ty:3,  tw:27, th:18, f1:P.gr1, f2:P.gr2, wall:P.wallLight,  accent:"#00E5A0" },
  amplifier:{ tx:1,  ty:24, tw:27, th:18, f1:P.cp1, f2:P.cp2, wall:P.wallCream,  accent:"#FF6B6B" },
  registry: { tx:32, ty:24, tw:27, th:18, f1:P.tl1, f2:P.tl2, wall:P.wallShadow, accent:"#60A5FA" },
};

/* ══════════════════════════════════════════════════════
   §3  AGENT DEFINITIONS
══════════════════════════════════════════════════════ */
const AGENTS = [
  {
    id:"commander", name:"COMMANDER", role:"Manager",
    color:"#FFD700", hair:"#5a3800", skin:"#f0b880", roomKey:"commander",
    system:`You are COMMANDER, the AI Manager of PixelForce HQ — a retro pixel-themed digital agency. You lead SCRIBE (Content Writer), AMPLIFIER (Marketing), and REGISTRY (Administration).
Role: Project strategy, task delegation, resource planning, team sync.
Personality: Decisive, tactical, theatrical like an RPG general. Break projects into subtasks and name which squad member handles each. Use military/RPG metaphors naturally — deploy, mission, squad, flank, quest. Max 4 sentences unless laying out a full plan.`,
  },
  {
    id:"scribe", name:"SCRIBE", role:"Content Writer",
    color:"#00E5A0", hair:"#004a30", skin:"#f4c090", roomKey:"scribe",
    system:`You are SCRIBE, the AI Content Writer of PixelForce HQ.
Role: Blog posts, landing page copy, scripts, captions, newsletters, SEO articles, brand voice.
Personality: Word-obsessed, enthusiastic craftsperson. Draft content immediately — that's your instinct. Use 8-bit metaphors: render, pixel-perfect prose, loading the next chapter. Keep energy high.`,
  },
  {
    id:"amplifier", name:"AMPLIFIER", role:"Marketing",
    color:"#FF6B6B", hair:"#6a1010", skin:"#f4b878", roomKey:"amplifier",
    system:`You are AMPLIFIER, the AI Marketing agent of PixelForce HQ.
Role: Marketing strategy, campaign design, growth hacking, social media, audience targeting, conversion funnels.
Personality: High-energy, metric-driven. Think in reach, virality, and conversion rates. Use game metaphors naturally — level up, boss fight with competitors, unlock new audiences, high score. Always tie ideas to measurable outcomes. Be punchy, never fluff.`,
  },
  {
    id:"registry", name:"REGISTRY", role:"Administration",
    color:"#60A5FA", hair:"#0a2860", skin:"#f0c090", roomKey:"registry",
    system:`You are REGISTRY, the AI Administration agent of PixelForce HQ.
Role: SOPs, scheduling, documentation, process design, operational efficiency, record-keeping, compliance tracking.
Personality: Meticulous, systematic, completely calm under chaos. Use database/system metaphors naturally — logging, indexing, queuing, syncing. Always provide structured, actionable output.`,
  },
];

/* ══════════════════════════════════════════════════════
   §4  SPRITE DATA  (8w × 13h, scale SP)
   Palette: 0=transparent 1=body 2=skin 3=hair 4=dark 5=pants
══════════════════════════════════════════════════════ */
const SPR = {
  idle:[
    [0,0,3,3,3,3,0,0],[0,3,3,3,3,3,3,0],[0,3,2,2,2,2,3,0],[0,2,2,2,2,2,2,0],
    [0,2,4,2,2,4,2,0],[0,2,2,2,4,2,2,0],[0,0,2,4,4,2,0,0],[4,1,1,1,1,1,1,4],
    [0,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,0],[0,5,5,0,0,5,5,0],[0,5,5,0,0,5,5,0],[0,4,4,0,0,4,4,0],
  ],
  wA:[
    [0,0,3,3,3,3,0,0],[0,3,3,3,3,3,3,0],[0,3,2,2,2,2,3,0],[0,2,2,2,2,2,2,0],
    [0,2,4,2,2,4,2,0],[0,2,2,2,4,2,2,0],[0,0,2,4,4,2,0,0],[4,1,1,1,1,1,1,4],
    [0,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,0],[4,5,5,0,0,5,0,0],[0,4,5,0,0,0,5,0],[0,0,4,0,0,0,4,0],
  ],
  wB:[
    [0,0,3,3,3,3,0,0],[0,3,3,3,3,3,3,0],[0,3,2,2,2,2,3,0],[0,2,2,2,2,2,2,0],
    [0,2,4,2,2,4,2,0],[0,2,2,2,4,2,2,0],[0,0,2,4,4,2,0,0],[4,1,1,1,1,1,1,4],
    [0,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,0],[0,0,5,0,0,5,4,4],[0,5,0,0,0,5,4,0],[0,4,0,0,0,4,0,0],
  ],
};

const SW = 8 * SP;   // sprite canvas width  = 24
const SH = 13 * SP;  // sprite canvas height = 39

/* ══════════════════════════════════════════════════════
   §5  DRAW UTILITIES
══════════════════════════════════════════════════════ */
function px(ctx, x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.fillStyle = stroke;
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y+h-1, w, 1);
    ctx.fillRect(x, y, 1, h); ctx.fillRect(x+w-1, y, 1, h);
  }
}

function drawSprite(ctx, frame, cx, cy, scale, bodyColor, hairColor, skinColor) {
  const pal = [null, bodyColor, skinColor||"#f4c090", hairColor||"#5a3800", "#2a1800", "#3a2e60"];
  frame.forEach((row, ry) => {
    row.forEach((ci, rx) => {
      if (!ci) return;
      ctx.fillStyle = pal[ci];
      ctx.fillRect(cx + rx*scale, cy + ry*scale, scale, scale);
    });
  });
}

function drawTree(ctx, x, y, r) {
  r = r || 11;
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(x+r, y+r*2+4, r+2, 5, 0, 0, Math.PI*2); ctx.fill();
  px(ctx, x+r-3, y+r*2-2, 6, 10, P.trunkD);
  px(ctx, x+r-2, y+r*2-4, 4, 10, P.trunk);
  ctx.fillStyle=P.treeDk; ctx.beginPath(); ctx.arc(x+r, y+r, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle=P.treeMd; ctx.beginPath(); ctx.arc(x+r-2, y+r-2, r-2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r+2, y+r-2, r-3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle=P.treeLt; ctx.beginPath(); ctx.arc(x+r, y+r-3, r-3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle=P.treeHi; ctx.beginPath(); ctx.arc(x+r-2, y+r-5, r/2, 0, Math.PI*2); ctx.fill();
}

function drawBush(ctx, x, y) {
  ctx.fillStyle=P.treeDk; ctx.beginPath(); ctx.arc(x+8,y+8,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.treeMd; ctx.beginPath(); ctx.arc(x+6,y+6,6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+11,y+7,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.treeLt; ctx.beginPath(); ctx.arc(x+8,y+4,5,0,Math.PI*2); ctx.fill();
}

function drawFlower(ctx, x, y, col) {
  ctx.fillStyle = col||"#ff88aa";
  [[0,3],[3,0],[6,3],[3,6],[3,3]].forEach(([fx,fy])=>ctx.fillRect(x+fx,y+fy,3,3));
  ctx.fillStyle="#ffff80"; ctx.fillRect(x+3,y+3,3,3);
}

function drawStatusBadge(ctx, x, y, label, color, bg) {
  const w = label.length * 4.5 + 8, h = 9;
  px(ctx, x-w/2, y, w, h, bg||"#222233", color);
  ctx.fillStyle=color; ctx.font="bold 5px monospace";
  ctx.textAlign="center"; ctx.fillText(label, x, y+h-2); ctx.textAlign="left";
}

function drawNameTag(ctx, x, y, name, color) {
  const w = name.length * 4.5 + 8;
  px(ctx, x-w/2, y, w, 9, "rgba(0,0,0,0.75)", color);
  ctx.fillStyle=color; ctx.font="bold 5px monospace";
  ctx.textAlign="center"; ctx.fillText(name, x, y+7); ctx.textAlign="left";
}

function drawSpeechBubble(ctx, x, y, text) {
  const tw = text.length * 4.8, bw = tw+10, bh = 13;
  const bx = x-bw/2, by = y-bh-6;
  px(ctx, bx, by, bw, bh, "#ffffff", "#cccccc");
  ctx.fillStyle="#444"; ctx.font="italic 6px sans-serif";
  ctx.textAlign="center"; ctx.fillText(text, x, by+bh-3); ctx.textAlign="left";
  ctx.fillStyle="#ffffff";
  ctx.beginPath(); ctx.moveTo(x-4,by+bh); ctx.lineTo(x+4,by+bh); ctx.lineTo(x,by+bh+6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#ccc"; ctx.lineWidth=0.5; ctx.stroke();
}

/* ══════════════════════════════════════════════════════
   §6  OUTDOOR
══════════════════════════════════════════════════════ */
function drawOutdoor(ctx) {
  // Top grass strip (rows 0-2)
  for (let c=0;c<CW/T;c++) for (let r=0;r<3;r++) {
    ctx.fillStyle=(c+r)%2===0?P.grass:P.grassD; ctx.fillRect(c*T,r*T,T,T);
  }
  // Bottom strip (rows 42-43)
  for (let c=0;c<CW/T;c++) for (let r=42;r<44;r++) {
    ctx.fillStyle=(c+r)%2===0?P.grass:P.grassD; ctx.fillRect(c*T,r*T,T,T);
  }
  // Side strips (cols 0 and 59)
  for (let r=0;r<CH/T;r++) {
    ctx.fillStyle=r%2===0?P.grass:P.grassD;
    ctx.fillRect(0,r*T,T,T); ctx.fillRect(CW-T,r*T,T,T);
  }
  // Vertical gap between rooms (cols 28-31, green corridor)
  for (let c=28;c<32;c++) for (let r=3;r<42;r++) {
    ctx.fillStyle=(c+r)%2===0?P.grass:P.grassD; ctx.fillRect(c*T,r*T,T,T);
  }
  // Horizontal gap between rooms (rows 21-23, path)
  for (let c=0;c<CW/T;c++) for (let r=21;r<24;r++) {
    ctx.fillStyle=P.path; ctx.fillRect(c*T,r*T,T,T);
  }
  // Path dots
  ctx.fillStyle=P.pathD;
  for (let c=2;c<60;c+=4) ctx.fillRect(c*T+6,22*T+6,2,2);

  // Trees along top
  [[1,0,11],[4,2,10],[8,0,12],[12,4,10],[17,0,11],[21,2,10],[26,0,11],
   [34,2,10],[38,0,12],[42,4,10],[46,0,11],[50,2,10],[55,0,11],[57,2,10]
  ].forEach(([col,offset,r])=>drawTree(ctx, col*T, offset, r));

  // Bushes in vertical corridor
  [[28*T+4,5*T],[29*T+2,10*T],[30*T,15*T],[28*T+8,27*T],[30*T+2,33*T]].forEach(([bx,by])=>drawBush(ctx,bx,by));

  // Flowers
  [[2*T+4,T+6,"#ff88aa"],[6*T,T+4,"#ffff60"],[33*T,2*T,"#ff99bb"],
   [36*T,T+2,"#88ddff"],[44*T,2*T+4,"#ffbb44"],[56*T,T+6,"#aaff88"],
   [2*T+8,26*T,"#ff88aa"],[3*T+4,38*T,"#88ddff"]
  ].forEach(([fx,fy,fc])=>drawFlower(ctx,fx,fy,fc));
}

/* ══════════════════════════════════════════════════════
   §7  ROOM FURNITURE
══════════════════════════════════════════════════════ */
function drawCommanderRoom(ctx, rm) {
  const X=rm.tx*T, Y=rm.ty*T;

  // Tactical map (north wall)
  px(ctx, X+14*T, Y+T+2, 10*T, 6*T, "#101828", "#334488");
  px(ctx, X+14*T+2, Y+T+4, 10*T-4, 6*T-4, "#0a1020");
  ctx.fillStyle="#223366";
  for(let i=0;i<5;i++) ctx.fillRect(X+14*T+2, Y+T+6+i*10, 10*T-4, 1);
  for(let i=0;i<7;i++) ctx.fillRect(X+14*T+2+i*14, Y+T+4, 1, 6*T-4);
  ctx.fillStyle="#FFD700";
  [[2,2],[5,1],[9,3],[3,4],[7,4],[6,2]].forEach(([mx,my])=>ctx.fillRect(X+14*T+3+mx*14, Y+T+5+my*10, 4, 4));
  ctx.strokeStyle="#FFD70066"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(X+14*T+5,Y+T+8); ctx.lineTo(X+14*T+19,Y+T+13); ctx.lineTo(X+14*T+47,Y+T+8); ctx.stroke();
  ctx.fillStyle="#FFD700"; ctx.font="bold 5px monospace"; ctx.fillText("TACTICAL MAP", X+14*T+3, Y+T+3);

  // Command desk
  px(ctx, X+3*T, Y+10*T, 12*T, 4*T, P.deskBr, "#5a3010");
  px(ctx, X+3*T+2, Y+10*T+2, 12*T-4, 4*T-4, P.deskLt);
  px(ctx, X+5*T, Y+10*T+3, 3*T, 2*T, P.monitor, "#333");
  px(ctx, X+5*T+3, Y+10*T+5, 3*T-6, 2*T-5, P.monScr);
  ctx.fillStyle="#FFD700"; ctx.font="4px monospace";
  ["MISSION:","DEPLOY >"].forEach((t,i)=>ctx.fillText(t, X+5*T+4, Y+10*T+9+i*5));
  px(ctx, X+9*T, Y+10*T+4, 2*T+4, T-2, "#fffcdc", "#ccc");
  px(ctx, X+11*T+2, Y+10*T+8, 2*T, T-4, "#fff8d8", "#bbb");

  // East bookshelf
  px(ctx, X+24*T+2, Y+4*T, T+4, 9*T, P.deskBr, "#5a3010");
  P.bookColors.slice(0,5).forEach((c,i)=>px(ctx, X+24*T+4, Y+4*T+3+i*(T+2), T, T-2, c, "#111"));

  // Flag
  px(ctx, X+2*T+4, Y+T+2, 2, 7*T, "#888");
  px(ctx, X+2*T+6, Y+T+2, 3*T+4, T+4, "#FFD700", "#8B6500");

  // Trophy
  px(ctx, X+2*T, Y+8*T, 4*T, 3*T, "#1a1008", "#2a1a10");
  px(ctx, X+2*T+4, Y+8*T+4, T, T+4, "#FFD700", "#8B6500");

  // Chair
  px(ctx, X+7*T, Y+14*T+4, 3*T, 3*T, P.chairBk, "#111");
  px(ctx, X+7*T+3, Y+14*T, 2*T-6, T+4, P.chairBk, "#111");
}

function drawScribeRoom(ctx, rm) {
  const X=rm.tx*T, Y=rm.ty*T;

  // Bookshelf (north wall)
  px(ctx, X+2*T, Y+T+3, 23*T, 3*T, P.deskBr, "#5a3010");
  P.bookColors.forEach((c,i)=>{
    px(ctx, X+2*T+4+i*(T+2), Y+T+5, T, 3*T-6, c, "#111");
    ctx.fillStyle="#ffffff33"; ctx.fillRect(X+2*T+6+i*(T+2), Y+T+8, T-4, 1);
  });

  // Writing desk
  px(ctx, X+3*T, Y+6*T, 8*T, 3*T+4, P.deskBr, "#5a3010");
  px(ctx, X+3*T+2, Y+6*T+2, 8*T-4, 3*T, P.deskLt);
  for(let i=0;i<5;i++){
    const ppx=X+3*T+4+i*(T+3), ppy=Y+6*T+4+(i%3)*3;
    px(ctx, ppx, ppy, T+4, T-2, "#fffce8", "#bbb");
    ctx.fillStyle="#88888860"; for(let l=0;l<3;l++) ctx.fillRect(ppx+2,ppy+3+l*4,T,1);
  }
  // Desk lamp
  px(ctx, X+10*T+4, Y+6*T, 2, 3*T, "#888");
  px(ctx, X+10*T-6, Y+6*T, 14, T, "#00E5A0", "#00a070");
  ctx.fillStyle="rgba(0,229,160,0.1)";
  ctx.beginPath(); ctx.arc(X+10*T+5, Y+6*T+6, 24, 0, Math.PI*2); ctx.fill();

  // Cork board
  px(ctx, X+24*T+2, Y+T+3, 2*T, 5*T+4, "#9a7020", "#6a4800");
  ["#fff9c4","#d0f8e0","#e8d0ff","#ffd0d0"].forEach((nc,i)=>{
    const nx=X+24*T+4+(i%2)*T, ny=Y+T+5+Math.floor(i/2)*(2*T+4);
    px(ctx, nx, ny, T+2, T+6, nc, "#bbb");
    ctx.fillStyle="#88888870"; for(let l=0;l<2;l++) ctx.fillRect(nx+2,ny+4+l*5,T-2,1);
    ctx.fillStyle="#ff4444"; ctx.fillRect(nx+T/2,ny+1,3,3);
  });

  // Plants
  [[2*T,13*T],[24*T,13*T],[13*T,5*T+6]].forEach(([px2,py2])=>{
    px(ctx, px2+4, py2+T+4, T+4, T, "#8b4010","#5a2800");
    ctx.fillStyle="#246020"; ctx.beginPath(); ctx.arc(px2+T,py2+T,T,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#3aaa28";
    ctx.beginPath(); ctx.arc(px2+T+5,py2+T-4,7,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px2+T-5,py2+T-3,6,0,Math.PI*2); ctx.fill();
  });

  // Chair
  px(ctx, X+6*T, Y+10*T+4, 3*T, 3*T, P.chairGr, "#111");
  px(ctx, X+6*T+3, Y+10*T, 2*T-6, T+4, P.chairGr, "#111");
}

function drawAmplifierRoom(ctx, rm) {
  const X=rm.tx*T, Y=rm.ty*T;

  // Conference table (big oval)
  ctx.fillStyle=P.deskLt;
  ctx.beginPath(); ctx.ellipse(X+13*T, Y+12*T, 8*T, 4*T, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle=P.deskBr; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=P.deskBr+"aa";
  ctx.beginPath(); ctx.ellipse(X+13*T, Y+12*T, 8*T-3, 4*T-3, 0, 0, Math.PI*2); ctx.fill();
  // Chairs around table
  [0,0.33,0.67,1,1.33,1.67].forEach(ang=>{
    const cx2=X+13*T+Math.cos(ang*Math.PI)*(8*T+8);
    const cy2=Y+12*T+Math.sin(ang*Math.PI)*(4*T+8);
    px(ctx, cx2-8, cy2-8, 16, 16, P.chairGr, P.chairBk);
  });
  [[X+7*T,Y+6*T+6],[X+13*T+4,Y+6*T+6],[X+18*T+4,Y+6*T+6],
   [X+7*T,Y+16*T+4],[X+13*T+4,Y+16*T+4],[X+18*T+4,Y+16*T+4]
  ].forEach(([cx2,cy2])=>px(ctx,cx2,cy2,T,T+4,P.chairGr,P.chairBk));
  // Laptop on table
  px(ctx, X+10*T, Y+11*T, 2*T, T, P.monitor, "#333");
  px(ctx, X+10*T+2, Y+11*T+2, 2*T-4, T-4, P.monScr);
  ctx.fillStyle="#FF6B6B"; ctx.font="4px monospace"; ctx.fillText("CAMPAIGN", X+10*T+3, Y+11*T+8);

  // TV/whiteboard (north wall)
  px(ctx, X+3*T, Y+T+2, 16*T, 5*T+4, "#222", "#333");
  px(ctx, X+3*T+3, Y+T+5, 16*T-6, 5*T-2, "#181828");
  ctx.strokeStyle="#FF6B6B"; ctx.lineWidth=1.5;
  ctx.beginPath();
  [[4,40],[12,34],[20,36],[28,24],[36,26],[44,18],[52,20],[60,10],[68,12]].forEach(([lx,ly],i)=>{
    i===0?ctx.moveTo(X+3*T+5+lx,Y+T+8+ly):ctx.lineTo(X+3*T+5+lx,Y+T+8+ly);
  });
  ctx.stroke();
  ctx.fillStyle="#FF6B6B"; ctx.font="bold 5px monospace"; ctx.fillText("GROWTH ↑ +247%", X+3*T+5, Y+T+7);

  // Energy drinks
  [[X+21*T,Y+T+3],[X+21*T+8,Y+T+5],[X+21*T+16,Y+T+8]].forEach(([ex,ey],i)=>{
    px(ctx, ex, ey, 7, T+4, ["#FF6B6B","#aaa","#FF6B6B80"][i], "#444");
  });

  // Poster
  px(ctx, X+22*T, Y+5*T, 4*T, 6*T, "#1a0606", "#440000");
  ctx.fillStyle="#FF6B6B"; ctx.font="bold 8px monospace"; ctx.fillText("GROW", X+22*T+5, Y+7*T);
  ctx.fillStyle="#ff9966"; ctx.font="6px monospace";
  ctx.fillText("OR", X+22*T+12, Y+8*T+2); ctx.fillText("DIE", X+22*T+8, Y+9*T+2);
}

function drawRegistryRoom(ctx, rm) {
  const X=rm.tx*T, Y=rm.ty*T;

  // Tidy desk
  px(ctx, X+3*T, Y+7*T, 8*T, 3*T, "#283848","#1a2838");
  px(ctx, X+3*T+2, Y+7*T+2, 8*T-4, 3*T-4, "#2e3f50");
  px(ctx, X+5*T, Y+4*T, T+6, 3*T+2, "#1a1a22","#222");
  px(ctx, X+4*T+4, Y+T+8, 4*T, 3*T+4, P.monitor,"#222");
  px(ctx, X+4*T+7, Y+T+11, 4*T-6, 3*T, P.monScr);
  ctx.fillStyle="#60A5FA"; ctx.font="4px monospace";
  ["> LOG_001 ✓","> SYNC OK","> INDEX...","> READY"].forEach((ln,i)=>ctx.fillText(ln, X+4*T+9, Y+T+15+i*6));
  px(ctx, X+3*T+4, Y+8*T, 4*T+4, 5, "#2a2a3a","#444");

  // Neat file stack
  [[0,0],[2,2],[4,4]].forEach(([ox,oy])=>px(ctx, X+10*T+ox, Y+7*T+oy, 2*T+4, 4, ["#dde","#ccd","#bbc"][ox/2],"#888"));

  // Filing cabinets (east wall)
  for(let ci=0;ci<3;ci++){
    const fx=X+22*T+ci*(T+6);
    px(ctx, fx, Y+T+3, T+2, 10*T, "#1e2e40","#0e1e30");
    for(let di=0;di<4;di++){
      px(ctx, fx+2, Y+T+7+di*(2*T+2), T-2, T+8, "#253545","#0f1f2f");
      px(ctx, fx+3, Y+T+11+di*(2*T+2), T-4, 4, "#60A5FA","#1a3a7a");
    }
    ctx.fillStyle="#ffffff44"; ctx.font="4px monospace";
    ["A-F","G-M","N-T","U-Z"].forEach((lbl,di)=>ctx.fillText(lbl, fx+2, Y+T+8+di*(2*T+2)));
  }

  // Analog clock (north wall)
  const cxc=X+15*T, cyc=Y+2*T+6;
  ctx.fillStyle="#f0f0e8"; ctx.beginPath(); ctx.arc(cxc,cyc,T,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#2a3040"; ctx.lineWidth=1; ctx.stroke();
  for(let h=0;h<12;h++){
    const a=h/12*Math.PI*2-Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cxc+Math.cos(a)*(T-4), cyc+Math.sin(a)*(T-4));
    ctx.lineTo(cxc+Math.cos(a)*T, cyc+Math.sin(a)*T); ctx.stroke();
  }
  ctx.strokeStyle="#1a2040"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(cxc,cyc); ctx.lineTo(cxc-6,cyc); ctx.stroke();
  ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cxc,cyc); ctx.lineTo(cxc,cyc-8); ctx.stroke();

  // Bookshelf
  px(ctx, X+2*T, Y+T+3, 10*T, 3*T, "#1e2e40","#0e1e30");
  P.bookColors.slice(0,6).forEach((c,i)=>{
    px(ctx, X+2*T+4+i*(T+2), Y+T+5, T, 3*T-6, c,"#111");
    ctx.fillStyle="#ffffff44"; ctx.fillRect(X+2*T+6+i*(T+2), Y+T+8, T-4, 1);
  });

  // Chair
  px(ctx, X+5*T, Y+11*T, 3*T, 3*T, "#0a1828","#111");
  px(ctx, X+5*T+3, Y+10*T+4, 2*T-6, T+4, "#0a1828","#111");
}

/* ══════════════════════════════════════════════════════
   §8  STATUS CONFIG
══════════════════════════════════════════════════════ */
const STATUS_CFG = {
  idle:      { label:"RESTING",  color:"#909098", bg:"#222230" },
  walking:   { label:"MOVING",   color:"#60A5FA", bg:"#0a2040" },
  thinking:  { label:"THINKING", color:"#a78bfa", bg:"#2e1060" },
  responding:{ label:"ACTIVE",   color:"#34d399", bg:"#052820" },
};

/* ══════════════════════════════════════════════════════
   §9  MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function OfficeWorld({ onBack, chats, setChats }) {
  const canvasRef    = useRef(null);
  const gameRef      = useRef(null);
  const hoveredRef   = useRef(null);
  const selectedRef  = useRef(null);
  const statusRef    = useRef({});
  const rafRef       = useRef(null);

  const [selectedId, _setSelectedId] = useState(null);
  const [agentStatus, setAgentStatus] = useState(() => {
    const initial = Object.fromEntries(
      AGENTS.map(a=>[a.id,{status:"idle",tokens:0,cost:0,activity:"Idling...",bubble:null}])
    );
    // Pre-populate statusRef synchronously so the RAF loop never reads
    // an empty {} on its very first frame — which was the root cause of the
    // "Cannot read properties of undefined (reading 'commander')" error.
    statusRef.current = initial;
    return initial;
  });
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [,tick] = useState(0);

  const setSelectedId = id => {
    _setSelectedId(id); selectedRef.current=id; tick(n=>n+1);
  };

  const selectedAgent = AGENTS.find(a=>a.id===selectedId);
  const msgs          = selectedId ? (chats[selectedId]||[]) : [];
  const messagesEndRef = useRef(null);

  useEffect(()=>{ statusRef.current = agentStatus; }, [agentStatus]);
  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs, loading]);

  const pickTarget = useCallback(ag=>{
    const rm=ROOMS[ag.roomKey], m=3;
    ag.tx=(rm.tx+m+Math.random()*(rm.tw-m*2))*T;
    ag.ty=(rm.ty+m+2+Math.random()*(rm.th-m*2-3))*T;
  },[]);

  // Init
  useEffect(()=>{
    gameRef.current = {
      agents: AGENTS.map(agDef=>{
        const rm=ROOMS[agDef.roomKey];
        const sx=(rm.tx+Math.floor(rm.tw/2))*T, sy=(rm.ty+Math.floor(rm.th/2)+1)*T;
        return {id:agDef.id,roomKey:agDef.roomKey,x:sx,y:sy,tx:sx,ty:sy,
          dir:"idle",walkFrame:0,frameTick:0,idleTick:0,
          idleDuration:90+Math.random()*120,speed:1.0};
      }),
    };
    gameRef.current.agents.forEach(ag=>pickTarget(ag));
  },[pickTarget]);

  // RAF loop
  useEffect(()=>{
    const FDUR=12;
    const loop=()=>{
      // ── Guard is INSIDE the loop (not just at effect entry).
      //    React StrictMode mounts → unmounts → remounts in dev, which means
      //    the RAF callback can fire between the unmount cleanup and the second
      //    mount's init useEffect. By re-scheduling instead of crashing we let
      //    the loop recover gracefully on the very next frame.
      if(!gameRef.current?.agents || !canvasRef.current){
        rafRef.current=requestAnimationFrame(loop); return;
      }
      // statusRef starts as {} — wait until the sync effect has populated it
      // so we never hit "Cannot read properties of undefined (reading 'commander')"
      if(!statusRef.current[AGENTS[0].id]){
        rafRef.current=requestAnimationFrame(loop); return;
      }

      const canvas=canvasRef.current;
      const ctx=canvas.getContext("2d");
      const {agents}=gameRef.current;

      // Update positions
      agents.forEach(ag=>{
        // Nullish fallback keeps us safe on the very first frames
        const st=statusRef.current[ag.id] ?? {status:"idle"};
        if(st.status==="thinking"||st.status==="responding"){ag.dir="idle";return;}
        ag.frameTick++;
        if(ag.frameTick>=FDUR){ag.walkFrame=1-ag.walkFrame;ag.frameTick=0;}
        const dx=ag.tx-ag.x, dy=ag.ty-ag.y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<2){
          ag.dir="idle"; ag.idleTick++;
          if(ag.idleTick>=ag.idleDuration){ag.idleTick=0;ag.idleDuration=80+Math.random()*160;pickTarget(ag);}
        } else {
          ag.x+=(dx/d)*ag.speed; ag.y+=(dy/d)*ag.speed;
          ag.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
        }
      });

      // Background
      ctx.fillStyle=P.grassD; ctx.fillRect(0,0,CW,CH);

      // Outdoor layer
      drawOutdoor(ctx);

      // Rooms (floor + walls)
      Object.entries(ROOMS).forEach(([key,rm])=>{
        const rx=rm.tx*T,ry=rm.ty*T,rw=rm.tw*T,rh=rm.th*T;
        for(let ty2=0;ty2<rm.th;ty2++) for(let tx2=0;tx2<rm.tw;tx2++){
          ctx.fillStyle=(tx2+ty2)%2===0?rm.f1:rm.f2; ctx.fillRect(rx+tx2*T,ry+ty2*T,T,T);
        }
        // Thick north+west walls
        ctx.fillStyle=rm.wall;
        ctx.fillRect(rx,ry,rw,T+T); ctx.fillRect(rx,ry,T+T,rh);
        ctx.fillRect(rx,ry+rh-T,rw,T); ctx.fillRect(rx+rw-T,ry,T,rh);
        // Accent detail
        ctx.fillStyle=rm.accent+"20";
        ctx.fillRect(rx+T*2,ry+T*2,rw-T*3,2); ctx.fillRect(rx+T*2,ry+T*2,2,rh-T*3);
        ctx.fillStyle=rm.accent+"80"; ctx.fillRect(rx+T*2+2,ry+T*2+2,5,5);
        // Room label
        const agDef=AGENTS.find(a=>a.roomKey===key);
        ctx.fillStyle=rm.accent+"90"; ctx.font="bold 6px monospace";
        ctx.fillText(agDef.role.toUpperCase(), rx+T*2+4, ry+T+8);
      });

      // Furniture
      drawCommanderRoom(ctx, ROOMS.commander);
      drawScribeRoom(ctx,    ROOMS.scribe);
      drawAmplifierRoom(ctx, ROOMS.amplifier);
      drawRegistryRoom(ctx,  ROOMS.registry);

      // Characters
      agents.forEach(ag=>{
        const agDef=AGENTS.find(a=>a.id===ag.id);
        if(!agDef) return; // safety guard
        const st=statusRef.current[ag.id] ?? {status:"idle"};
        const isHov=hoveredRef.current===ag.id, isSel=selectedRef.current===ag.id;
        const CX=ag.x+SW/2;

        ctx.fillStyle="rgba(0,0,0,0.22)";
        ctx.beginPath(); ctx.ellipse(CX,ag.y+SH+2,SW/2+2,4,0,0,Math.PI*2); ctx.fill();

        if(isHov||isSel){
          ctx.strokeStyle=agDef.color+(isSel?"ee":"55");
          ctx.lineWidth=isSel?2:1; ctx.setLineDash(isSel?[3,2]:[]);
          ctx.strokeRect(ag.x-3,ag.y-4,SW+6,SH+8); ctx.setLineDash([]);
        }

        const frame=ag.dir==="idle"||ag.dir==="up"?SPR.idle:ag.walkFrame===0?SPR.wA:SPR.wB;
        ctx.save();
        if(ag.dir==="right"){
          ctx.translate(ag.x+SW,0); ctx.scale(-1,1);
          drawSprite(ctx,frame,0,ag.y,SP,agDef.color,agDef.hair,agDef.skin);
        } else {
          drawSprite(ctx,frame,ag.x,ag.y,SP,agDef.color,agDef.hair,agDef.skin);
        }
        ctx.restore();

        if(st?.status==="thinking"&&st?.bubble) drawSpeechBubble(ctx,CX,ag.y-2,st.bubble);
        const sc=STATUS_CFG[st?.status||"idle"];
        drawStatusBadge(ctx,CX,ag.y-14,sc.label,sc.color,sc.bg);
        drawNameTag(ctx,CX,ag.y-26,agDef.name,agDef.color);
      });

      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[pickTarget]);

  const handleClick=useCallback(e=>{
    if(!canvasRef.current||!gameRef.current)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(CW/rect.width), my=(e.clientY-rect.top)*(CH/rect.height);
    let nearest=null,minD=44;
    gameRef.current.agents.forEach(ag=>{
      const d=Math.hypot(mx-(ag.x+SW/2),my-(ag.y+SH/2)); if(d<minD){minD=d;nearest=ag.id;}
    });
    setSelectedId(nearest===selectedRef.current?null:nearest);
  },[]);

  const handleMouseMove=useCallback(e=>{
    if(!canvasRef.current||!gameRef.current)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(CW/rect.width), my=(e.clientY-rect.top)*(CH/rect.height);
    let nearest=null,minD=44;
    gameRef.current.agents.forEach(ag=>{
      const d=Math.hypot(mx-(ag.x+SW/2),my-(ag.y+SH/2)); if(d<minD){minD=d;nearest=ag.id;}
    });
    hoveredRef.current=nearest; canvasRef.current.style.cursor=nearest?"pointer":"default";
  },[]);

  const send=useCallback(async()=>{
    if(!input.trim()||loading||!selectedId)return;
    const agDef=AGENTS.find(a=>a.id===selectedId);
    const userMsg={role:"user",content:input.trim()};
    const history=chats[selectedId]||[], next=[...history,userMsg];
    setChats(p=>({...p,[selectedId]:next})); setInput(""); setLoading(true);
    setAgentStatus(s=>({...s,[selectedId]:{...s[selectedId],status:"thinking",activity:"Processing request...",bubble:"Thinking..."}}));
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:agDef.system,messages:next}),
      });
      const data=await res.json();
      const aiMsg={role:"assistant",content:data.content[0].text};
      setChats(p=>({...p,[selectedId]:[...next,aiMsg]}));
      const newTok=Math.floor((userMsg.content.length+aiMsg.content.length)/4);
      const newCost=parseFloat((newTok*0.000003).toFixed(6));
      setAgentStatus(s=>({...s,[selectedId]:{
        status:"responding",bubble:null,
        tokens:(s[selectedId].tokens||0)+newTok,
        cost:parseFloat(((s[selectedId].cost||0)+newCost).toFixed(6)),
        activity:`> ${aiMsg.content.slice(0,26)}...`,
      }}));
      setTimeout(()=>setAgentStatus(s=>({...s,[selectedId]:{...s[selectedId],status:"idle",activity:"Idling...",bubble:null}})),3000);
    }catch(err){console.error(err);setAgentStatus(s=>({...s,[selectedId]:{...s[selectedId],status:"idle",bubble:null}}));}
    finally{setLoading(false);}
  },[input,loading,selectedId,chats,setChats]);

  /* ── RENDER ── */
  return (
    <div style={{display:"flex",height:"100vh",background:"#0d0d1a",overflow:"hidden",fontFamily:"'Press Start 2P', monospace"}}>

      {/* Canvas world */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <div style={{padding:"10px 18px",background:"#0a0a1a",borderBottom:"2px solid #ffffff10",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
              {["#7B61FF","#00E5A0","#FF6B6B","#FFD700"].map((c,i)=>(
                <div key={i} className={i%2?"blink2":"blink"} style={{width:8,height:8,background:c}} />
              ))}
            </div>
            <span style={{fontSize:"0.55rem",color:"#fff",letterSpacing:"0.06em"}}>PIXELFORCE HQ</span>
            <span style={{fontSize:"0.24rem",color:"#5a9940",border:"1px solid #3a7020",padding:"2px 8px",letterSpacing:"0.1em"}}>● LIVE</span>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:"0.24rem",color:"#ffffff25",letterSpacing:"0.06em"}}>Operational Floorplan</span>
            <button onClick={onBack} style={{background:"none",border:"1px solid #ffffff15",color:"#ffffff40",padding:"5px 10px",cursor:"pointer",fontFamily:"'Press Start 2P', monospace",fontSize:"0.26rem"}}>← HOME</button>
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden",background:P.grassD}}>
          <canvas ref={canvasRef} width={CW} height={CH} onClick={handleClick} onMouseMove={handleMouseMove}
            style={{width:"100%",height:"100%",objectFit:"contain",display:"block",imageRendering:"pixelated"}} />
        </div>
      </div>

      {/* System Roster */}
      <div style={{width:380,flexShrink:0,background:"#0a0a14",borderLeft:"1px solid #ffffff10",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #ffffff0d",flexShrink:0}}>
          <p style={{fontSize:"0.52rem",color:"#e0e0f0",letterSpacing:"0.04em"}}>System Roster</p>
          <p style={{fontSize:"0.26rem",color:"#ffffff30",marginTop:4,letterSpacing:"0.08em"}}>
            {selectedId?`COMMS: ${selectedAgent?.name}`:"Click an agent to open comms"}
          </p>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {AGENTS.map(agDef=>{
            const st=agentStatus[agDef.id], sc=STATUS_CFG[st?.status||"idle"];
            const isSel=selectedId===agDef.id, msgCount=Math.floor((chats[agDef.id]?.length||0)/2);
            return (
              <div key={agDef.id} onClick={()=>setSelectedId(isSel?null:agDef.id)} style={{
                padding:"14px 16px",borderBottom:"1px solid #ffffff06",cursor:"pointer",
                borderLeft:isSel?`2px solid ${agDef.color}`:"2px solid transparent",
                background:isSel?agDef.color+"08":"transparent",transition:"background 0.15s",
              }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div className="blink2" style={{width:6,height:6,background:agDef.color}} />
                    <span style={{fontSize:"0.38rem",color:agDef.color,letterSpacing:"0.04em"}}>{agDef.name}</span>
                    {msgCount>0&&<span style={{fontSize:"0.26rem",color:"#000",background:agDef.color,padding:"1px 5px"}}>{msgCount}</span>}
                  </div>
                  <span style={{fontSize:"0.26rem",color:sc.color,background:sc.bg,border:`1px solid ${sc.color}44`,padding:"2px 7px",letterSpacing:"0.08em"}}>{sc.label}</span>
                </div>
                <p style={{fontSize:"0.26rem",color:"#60A5Fa70",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  CMD&gt; {st?.activity||"Idling..."}
                </p>
                <div style={{height:4,background:"#1a1a2a",marginBottom:6,overflow:"hidden"}}>
                  <div style={{display:"flex",height:"100%"}}>
                    <div style={{width:`${Math.min(70,(st?.tokens||0)/20)}%`,background:"#34d399",minWidth:(st?.tokens||0)>0?2:0,transition:"width 0.4s"}} />
                    <div style={{width:`${Math.min(30,(st?.tokens||0)/40)}%`,background:"#a78bfa",transition:"width 0.4s"}} />
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:"0.24rem",color:"#ffffff30"}}>TX: {st?.tokens||0} tok</span>
                  <span style={{fontSize:"0.24rem",color:"#ffffff30"}}>${(st?.cost||0).toFixed(4)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat panel */}
        {selectedAgent&&(
          <div style={{borderTop:`1px solid ${selectedAgent.color}30`,display:"flex",flexDirection:"column",height:300,flexShrink:0}}>
            <div style={{padding:"9px 14px",background:selectedAgent.color+"0a",borderBottom:`1px solid ${selectedAgent.color}18`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontSize:"0.34rem",color:selectedAgent.color}}>{selectedAgent.name} · {selectedAgent.role}</span>
              <button onClick={()=>setSelectedId(null)} style={{background:"none",border:"1px solid #ffffff18",color:"#ffffff40",padding:"3px 7px",cursor:"pointer",fontFamily:"'Press Start 2P', monospace",fontSize:"0.32rem"}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
              {msgs.length===0&&(
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px",textAlign:"center"}}>
                  <div style={{marginBottom:10}}>
                    {SPR.idle.slice(0,6).map((row,ri)=>(
                      <div key={ri} style={{display:"flex",justifyContent:"center"}}>
                        {row.map((ci,cj)=>(
                          <div key={cj} style={{width:3,height:3,background:!ci?"transparent":ci===1?selectedAgent.color:ci===2?selectedAgent.skin||"#f4c090":ci===3?selectedAgent.hair:"#2a1800"}} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:"0.3rem",color:selectedAgent.color,marginBottom:6}}>{selectedAgent.name} ON DUTY</p>
                  <p style={{fontSize:"0.22rem",color:"#ffffff18",lineHeight:2.4}}>Assign your mission.</p>
                </div>
              )}
              {msgs.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"88%",border:m.role==="user"?"1px solid #ffffff10":`1px solid ${selectedAgent.color}22`,borderLeft:m.role==="assistant"?`2px solid ${selectedAgent.color}`:undefined,background:m.role==="user"?"#0f0f1e":"#0c0c1e",padding:"7px 9px"}}>
                    {m.role==="assistant"&&<span style={{display:"block",fontSize:"0.22rem",color:selectedAgent.color,marginBottom:3}}>[{selectedAgent.name}]</span>}
                    <p style={{fontSize:"0.32rem",lineHeight:1.9,color:m.role==="user"?"#aab0cc":"#c8cce0",whiteSpace:"pre-wrap",margin:0}}>{m.content}</p>
                  </div>
                </div>
              ))}
              {loading&&(
                <div style={{display:"flex"}}>
                  <div style={{border:`1px solid ${selectedAgent.color}22`,borderLeft:`2px solid ${selectedAgent.color}`,background:"#0c0c1e",padding:"7px 9px"}}>
                    <span style={{fontSize:"0.22rem",color:selectedAgent.color,display:"block",marginBottom:3}}>[{selectedAgent.name}]</span>
                    <span className="blink" style={{fontSize:"0.32rem",color:selectedAgent.color}}>▌ THINKING...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} style={{height:4}} />
            </div>
            <div style={{padding:"8px 10px",borderTop:`1px solid ${selectedAgent.color}18`,background:"#050510",display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:"0.44rem",color:selectedAgent.color,flexShrink:0}}>▸</span>
              <input className="pixel-input" style={{"--ac":selectedAgent.color,fontSize:"0.32rem",padding:"7px 10px"}}
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="ASSIGN MISSION..." />
              <button onClick={send} disabled={!input.trim()||loading} style={{flexShrink:0,background:selectedAgent.color,border:"none",color:"#000",padding:"7px 9px",fontFamily:"'Press Start 2P', monospace",fontSize:"0.26rem",cursor:"pointer",opacity:!input.trim()||loading?0.4:1}}>GO</button>
            </div>
          </div>
        )}

        {/* Agent portrait strip */}
        <div style={{padding:"10px 16px",borderTop:"1px solid #ffffff08",background:"#070710",display:"flex",gap:12,alignItems:"center",flexShrink:0}}>
          {AGENTS.map(agDef=>{
            const st=agentStatus[agDef.id], sc=STATUS_CFG[st?.status||"idle"];
            return (
              <div key={agDef.id} onClick={()=>setSelectedId(selectedId===agDef.id?null:agDef.id)} style={{cursor:"pointer",textAlign:"center"}}>
                <div style={{width:24,height:24,background:agDef.color+"18",border:`1px solid ${agDef.color}44`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:3}}>
                  {SPR.idle.slice(0,4).map((row,ri)=>(
                    <div key={ri} style={{display:"flex"}}>
                      {row.map((ci,cj)=>(
                        <div key={cj} style={{width:2,height:2,background:!ci?"transparent":ci===1?agDef.color:ci===2?agDef.skin||"#f4c090":ci===3?agDef.hair:"#2a1800"}} />
                      ))}
                    </div>
                  ))}
                </div>
                <p style={{fontSize:"0.2rem",color:sc.color,letterSpacing:"0.04em"}}>{sc.label.slice(0,7)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}