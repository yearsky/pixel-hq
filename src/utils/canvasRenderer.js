import { T, CW, CH, HOUSE, P, AGENTS, STATUS_CFG, ROOM_AREAS, ROAM_BOUNDS } from '../constants/world';

export function shade(hex, amount) {
  const raw = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(raw.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(raw.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(raw.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

export function px(ctx, x, y, w, h, fill, stroke, depth = 0) {
  if (depth > 0) {
    ctx.fillStyle = shade(fill, -35); // Side face
    ctx.fillRect(x, y, w + depth, h + depth);
  }
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (!stroke) return;
  ctx.fillStyle = stroke;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

export function drawRoomAmbiance(ctx, x, y, w, h) {
  // Ambient Occlusion / Corner Shadows
  const grd = ctx.createRadialGradient(x + w / 2, y + h / 2, w / 4, x + w / 2, y + h / 2, w / 1.5);
  grd.addColorStop(0, "transparent");
  grd.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, w, h);
}

export function drawTree(ctx, x, y, r = 10) {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(x + r, y + r * 2 + 3, r + 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  px(ctx, x + r - 3, y + r * 2 - 2, 6, 10, P.trunkD);
  px(ctx, x + r - 2, y + r * 2 - 4, 4, 10, P.trunk);

  ctx.fillStyle = P.treeDk;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = P.treeMd;
  ctx.beginPath();
  ctx.arc(x + r - 2, y + r - 2, r - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + r + 3, y + r - 2, r - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = P.treeLt;
  ctx.beginPath();
  ctx.arc(x + r, y + r - 4, r - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = P.treeHi;
  ctx.beginPath();
  ctx.arc(x + r - 2, y + r - 6, Math.max(3, r / 2), 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlower(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 3, y, 3, 3);
  ctx.fillRect(x, y + 3, 3, 3);
  ctx.fillRect(x + 6, y + 3, 3, 3);
  ctx.fillRect(x + 3, y + 6, 3, 3);
  ctx.fillStyle = "#fff48a";
  ctx.fillRect(x + 3, y + 3, 3, 3);
}

export function drawFence(ctx, x, y, count) {
  for (let i = 0; i < count; i++) {
    const fx = x + i * 12;
    px(ctx, fx + 5, y, 2, 10, "#c49a6a", "#8b5e30");
    px(ctx, fx, y + 2, 12, 2, "#c49a6a", "#8b5e30");
    px(ctx, fx, y + 7, 12, 2, "#c49a6a", "#8b5e30");
  }
}

export function drawLamp(ctx, x, y) {
  px(ctx, x + 4, y + 7, 2, 14, "#666");
  px(ctx, x, y, 10, 8, "#ffd966", "#9f7b00");
  ctx.fillStyle = "rgba(255,220,110,0.12)";
  ctx.beginPath();
  ctx.arc(x + 5, y + 4, 15, 0, Math.PI * 2);
  ctx.fill();
}

export function drawOutdoor(ctx) {
  ctx.fillStyle = P.skyA;
  ctx.fillRect(0, 0, CW, CH);

  // Grass with Noise
  for (let c = 0; c < CW / T; c++) {
    for (let r = 0; r < CH / T; r++) {
      const isAlt = (c + r) % 2 === 0;
      ctx.fillStyle = isAlt ? P.grass : P.grassD;
      ctx.fillRect(c * T, r * T, T, T);
      
      // Fine grass noise
      if ((c * 3 + r * 7) % 5 === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(c * T + 4, r * T + 2, 2, 2);
      }
    }
  }

  // Large Path Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(HOUSE.x - 2.5 * T, HOUSE.y - 1.5 * T, HOUSE.w + 5 * T, HOUSE.h + 5 * T);

  px(
    ctx,
    HOUSE.x - 2 * T,
    HOUSE.y - 2 * T,
    HOUSE.w + 4 * T,
    HOUSE.h + 4 * T,
    P.path,
    "#9d8f74"
  );

  // Path texture bits
  for (let i = 0; i < 40; i++) {
    const tx = (HOUSE.x - 2 * T) + (Math.random() * (HOUSE.w + 4 * T));
    const ty = (HOUSE.y - 2 * T) + (Math.random() * (HOUSE.h + 4 * T));
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(tx, ty, 3, 2);
  }

  px(ctx, CW / 2 - 2 * T, HOUSE.y + HOUSE.h + 2 * T, 4 * T, CH - (HOUSE.y + HOUSE.h + 2 * T), P.path, "#9d8f74");

  drawFence(ctx, 2 * T, T + 2, 10);
  drawFence(ctx, 47 * T, T + 2, 10);
  drawFence(ctx, 2 * T, 48 * T + 2, 10);
  drawFence(ctx, 47 * T, 48 * T + 2, 10);

  drawLamp(ctx, 2 * T + 4, 3 * T);
  drawLamp(ctx, 72 * T, 3 * T);
  drawLamp(ctx, 2 * T + 4, 44 * T);
  drawLamp(ctx, 72 * T, 44 * T);

  [
    [2, 1, 11],
    [8, 0, 10],
    [15, 1, 11],
    [23, 0, 10],
    [31, 1, 11],
    [40, 0, 10],
    [49, 1, 11],
    [58, 0, 10],
    [66, 1, 11],
    [72, 0, 10],
  ].forEach(([c, y, r]) => drawTree(ctx, c * T, y * T, r));

  [
    [3, 46, 9],
    [10, 45, 10],
    [20, 46, 9],
    [30, 45, 10],
    [45, 46, 9],
    [55, 45, 10],
    [65, 46, 9],
  ].forEach(([c, y, r]) => drawTree(ctx, c * T, y * T, r));

  for (let i = 0; i < 22; i++) {
    const x = HOUSE.x - T + ((i * 37) % (HOUSE.w + 2 * T));
    const y = HOUSE.y - T + ((i * 53) % (HOUSE.h + 2 * T));
    px(ctx, x, y, 9, 7, i % 2 === 0 ? P.hedge : P.hedgeD, shade(P.hedge, -40), 1);
  }

  [
    [5 * T, 3 * T, "#ff90b6"],
    [6 * T + 6, 3 * T + 4, "#ffd26f"],
    [63 * T, 3 * T + 2, "#8ad6ff"],
    [64 * T + 8, 3 * T + 5, "#a8f08a"],
    [7 * T, 45 * T + 2, "#ff90b6"],
    [66 * T, 45 * T + 2, "#ffd26f"],
    [36 * T, 44 * T, "#8ad6ff"],
  ].forEach(([fx, fy, c]) => drawFlower(ctx, fx, fy, c));
}

export function drawHouseShell(ctx) {
  // Global Drop Shadow for House
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(HOUSE.x + 8, HOUSE.y + T, HOUSE.w, HOUSE.h + 4);

  // Outer Walls with Depth
  px(ctx, HOUSE.x, HOUSE.y, HOUSE.w, HOUSE.h, P.wall, P.wallD, 4);
  
  // Floor with Ambient Shading
  ctx.fillStyle = P.floorA;
  ctx.fillRect(HOUSE.x + T, HOUSE.y + T, HOUSE.w - 2 * T, HOUSE.h - 2 * T);

  for (let r = 1; r < HOUSE.h / T - 1; r++) {
    for (let c = 1; c < HOUSE.w / T - 1; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? P.floorA : P.floorB;
      ctx.fillRect(HOUSE.x + c * T, HOUSE.y + r * T, T, T);
    }
  }

  // Room Wall Caps (Top face of interior walls)
  ctx.fillStyle = shade(P.wall, 10);
  ctx.fillRect(HOUSE.x, HOUSE.y, HOUSE.w, T); // North wall top
  
  // Doorway Detail
  const doorW = 4 * T;
  const doorX = HOUSE.x + HOUSE.w / 2 - doorW / 2;
  px(ctx, doorX, HOUSE.y + HOUSE.h - T, doorW, T + 2, "#3a2510", "#1a1008", 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(doorX + doorW - 8, HOUSE.y + HOUSE.h - T + 6, 3, 3);

  // Windows
  for (let i = 0; i < 4; i++) {
    const wx = HOUSE.x + 8 * T + i * 14 * T;
    px(ctx, wx, HOUSE.y + 1, 5 * T, T - 1, "#0f172a", "#334155");
    ctx.fillStyle = "rgba(100, 200, 255, 0.2)";
    ctx.fillRect(wx + 2, HOUSE.y + 3, 5 * T - 4, T - 4);
  }
}

export function drawRug(ctx, x, y, w, h, c1, c2) {
  px(ctx, x - 2, y - 2, w + 4, h + 4, c2, shade(c2, -40));
  px(ctx, x, y, w, h, c1, shade(c1, -30));
  // Rug Texture/Fringe
  ctx.fillStyle = shade(c1, 15);
  for (let i = 0; i < w; i += 4) {
    ctx.fillRect(x + i, y - 1, 2, 1);
    ctx.fillRect(x + i, y + h, 2, 1);
  }
}

export function drawStairs(ctx, x, y, w, h) {
  const stepH = 5;
  const steps = Math.floor(h / stepH);
  for (let i = 0; i < steps; i++) {
    const tone = i % 2 === 0 ? "#7b6e56" : "#8d7c60";
    px(ctx, x, y + i * stepH, w, stepH, tone, shade(tone, -25), 1);
    // Highlight edge
    ctx.fillStyle = shade(tone, 15);
    ctx.fillRect(x, y + i * stepH, w, 1);
  }
}

export function drawBookshelf(ctx, x, y, w, h) {
  px(ctx, x, y, w, h, "#3a2512", "#1a1008", 2);
  const shelfH = 10;
  const shelves = Math.floor(h / shelfH);
  for (let s = 0; s < shelves; s++) {
    px(ctx, x + 2, y + 2 + s * shelfH, w - 4, 1, "#1a1008");
    let bx = x + 3;
    while (bx < x + w - 7) {
      const bw = 2 + Math.random() * 3;
      const bh = Math.min(shelfH - 3, 5 + Math.random() * 4);
      const bc = ["#e63946", "#457b9d", "#f1faee", "#a8dadc", "#1d3557"][Math.floor(Math.random() * 5)];
      px(ctx, bx, y + 2 + s * shelfH + (shelfH - bh - 2), bw, bh, bc, shade(bc, -50));
      // Book highlight
      ctx.fillStyle = shade(bc, 20);
      ctx.fillRect(bx, y + 2 + s * shelfH + (shelfH - bh - 2), bw, 1);
      bx += bw + 1;
    }
  }
}

export function drawFilingCabinet(ctx, x, y, w, h) {
  px(ctx, x, y, w, h, "#64748b", "#334155", 3);
  const drawerH = Math.floor((h - 4) / 4);
  for (let i = 0; i < 4; i++) {
    const dy = y + 2 + i * drawerH;
    px(ctx, x + 3, dy + 2, w - 6, drawerH - 4, "#94a3b8", "#475569");
    px(ctx, x + w / 2 - 4, dy + drawerH / 2, 8, 1, "#334155");
  }
}

export function drawTrophyCabinet(ctx, x, y, w, h) {
  px(ctx, x, y, w, h, "#4a2c10", "#2a1808", 2);
  ctx.fillStyle = "rgba(100, 180, 255, 0.1)";
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  // Reflection on glass
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + w - 4, y + 2); ctx.lineTo(x + 2, y + h - 4); ctx.fill();
  for (let i = 0; i < 2; i++) {
    const tx = x + 6 + i * 14;
    const ty = y + h - 14;
    px(ctx, tx, ty, 6, 8, "#d4af37", "#996515", 1);
    px(ctx, tx - 2, ty + 8, 10, 2, "#996515");
  }
}

export function drawTacticalMap(ctx, x, y, w, h) {
  px(ctx, x, y, w, h, "#0f172a", "#334155", 1);
  ctx.fillStyle = "rgba(56, 189, 248, 0.05)"; // Blue glow
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
  ctx.lineWidth = 1;
  for (let i = 4; i < w; i += 8) { ctx.beginPath(); ctx.moveTo(x + i, y + 2); ctx.lineTo(x + i, y + h - 2); ctx.stroke(); }
  for (let j = 4; j < h; j += 8) { ctx.beginPath(); ctx.moveTo(x + 2, y + j); ctx.lineTo(x + w - 2, y + j); ctx.stroke(); }
  ctx.fillStyle = "#fbbf24"; ctx.fillRect(x + 12, y + 12, 2, 2);
  ctx.fillStyle = "#ef4444"; ctx.fillRect(x + w - 15, y + h - 15, 2, 2);
}

export function drawDesk(ctx, x, y, w, h) {
  px(ctx, x, y, w, h, "#7a5030", "#3a2510", 3);
  px(ctx, x + 2, y + 2, w - 4, 1, "rgba(255,255,255,0.1)"); // Wood highlight
}

export function drawPlant(ctx, x, y, leaf = "#145228") {
  // Pot shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(x + 7, y + 15, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
  px(ctx, x + 3, y + 10, 8, 5, "#7a3a10", "#4a1c00", 2);
  ctx.fillStyle = leaf;
  ctx.beginPath(); ctx.arc(x + 7, y + 5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade(leaf, 20);
  ctx.beginPath(); ctx.arc(x + 9, y + 3, 4, 0, Math.PI * 2); ctx.fill();
}

export function drawChair(ctx, x, y, tone = "#475569") {
  const dark = shade(tone, -35);
  const light = shade(tone, 25);
  // Leg shadows
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(x + 1, y + T + 6, T + 6, 4);

  px(ctx, x + 2, y, T + 4, 8, light, dark, 2);
  px(ctx, x, y + 8, T + 8, T - 2, tone, dark, 2);
}

export function drawTVSet(ctx, x, y, w, h, screenColor = "#020617") {
  px(ctx, x, y, w, h, "#0f172a", "#334155", 4);
  px(ctx, x + 4, y + 4, w - 8, h - 11, screenColor, "#1e293b");
  // Glass Reflection
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.beginPath(); ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + w - 5, y + 5); ctx.lineTo(x + 5, y + h - 8); ctx.fill();
  // Stand
  px(ctx, x + w / 2 - 4, y + h - 7, 8, 4, "#1e293b", "#0f172a");
}

export function drawMeetingRoom(ctx) {
  const z = ROOM_AREAS.meeting;
  drawRug(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T, "#2e2116", "#1a130d");
  drawRoomAmbiance(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T);
  drawTacticalMap(ctx, z.x + 4 * T, z.y + 2, 10 * T, 3 * T);
  drawTrophyCabinet(ctx, z.x + z.w - 6 * T, z.y + 3 * T, 4 * T, 6 * T);
  
  // Big Command Table Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(z.x + z.w / 2 + 3, z.y + z.h / 2 + 5, 6.2 * T, 3.2 * T, 0, 0, Math.PI * 2); ctx.fill();
  
  ctx.fillStyle = "#5a3a1e";
  ctx.beginPath(); ctx.ellipse(z.x + z.w / 2, z.y + z.h / 2 + 2, 6 * T, 3 * T, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#3a2510"; ctx.lineWidth = 1; ctx.stroke();
  
  const chairPos = [
    {x: z.x + 5 * T, y: z.y + 3 * T}, {x: z.x + 9 * T, y: z.y + 3 * T}, {x: z.x + 13 * T, y: z.y + 3 * T},
    {x: z.x + 5 * T, y: z.y + 9 * T}, {x: z.x + 9 * T, y: z.y + 9 * T}, {x: z.x + 13 * T, y: z.y + 9 * T},
  ];
  chairPos.forEach(p => drawChair(ctx, p.x, p.y, "#b8860b"));
}

export function drawKitchenRoom(ctx) {
  const z = ROOM_AREAS.kitchen;
  drawRug(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T, "#064e3b", "#022c22");
  drawRoomAmbiance(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T);
  drawBookshelf(ctx, z.x + 2 * T, z.y + 2, z.w - 4 * T, 4 * T);
  
  drawDesk(ctx, z.x + 4 * T, z.y + 8 * T, 12 * T, 3 * T);
  px(ctx, z.x + z.w - 7 * T, z.y + 5 * T, 5 * T, 6 * T, "#c49a6c", "#8b5e3c", 2);
  
  drawChair(ctx, z.x + 8 * T, z.y + 11 * T, "#0f766e");
  drawPlant(ctx, z.x + 2 * T, z.y + z.h - 4 * T, "#065f46");
}

export function drawLivingRoom(ctx) {
  const z = ROOM_AREAS.living;
  drawRug(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T, "#1e293b", "#0f172a");
  drawRoomAmbiance(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T);
  
  drawTVSet(ctx, z.x + z.w / 2 - 5 * T, z.y + 2, 10 * T, 6 * T, "#020617");
  // Growth Glow
  ctx.strokeStyle = "rgba(74, 222, 128, 0.4)"; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(z.x + z.w / 2 - 4 * T, z.y + 5 * T); ctx.lineTo(z.x + z.w / 2, z.y + 4 * T); ctx.lineTo(z.x + z.w / 2 + 4 * T, z.y + 3 * T); ctx.stroke();
  
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.ellipse(z.x + z.w / 2 + 3, z.y + 11 * T + 3, 6.2 * T, 3.2 * T, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.beginPath(); ctx.ellipse(z.x + z.w / 2, z.y + 11 * T, 6 * T, 3 * T, 0, 0, Math.PI * 2); ctx.fill();
  
  drawChair(ctx, z.x + 4 * T, z.y + 10 * T, "#991b1b");
  drawChair(ctx, z.x + 12 * T, z.y + 10 * T, "#991b1b");
  
  px(ctx, z.x + 2 * T, z.y + 5 * T, 2 * T, 4 * T, "#991b1b", "#450a0a", 1);
  drawPlant(ctx, z.x + 2 * T, z.y + z.h - 4 * T, "#7f1d1d");
}

export function drawWorkspaceRoom(ctx) {
  const z = ROOM_AREAS.workspace;
  drawRug(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T, "#cbd5e1", "#94a3b8");
  drawRoomAmbiance(ctx, z.x + T, z.y + T, z.w - 2 * T, z.h - 2 * T);
  
  drawFilingCabinet(ctx, z.x + z.w - 6 * T, z.y + 3 * T, 4 * T, 10 * T);
  drawDesk(ctx, z.x + 3 * T, z.y + 5 * T, 12 * T, 4 * T);
  px(ctx, z.x + 7 * T, z.y + 6 * T, 4 * T, 2 * T, "#020617", "#1e293b", 1);
  // Terminal Glow
  ctx.fillStyle = "#22c55e"; ctx.fillRect(z.x + 7 * T + 2, z.y + 6 * T + 2, 2, 1);
  
  ctx.fillStyle = "#f8fafc"; ctx.beginPath(); ctx.arc(z.x + z.w / 2, z.y + T + 4, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#475569"; ctx.stroke();
  
  drawChair(ctx, z.x + 8 * T, z.y + 10 * T, "#1d4ed8");
  drawStairs(ctx, z.x + 2, z.y + z.h - 8 * T, 4 * T, 6 * T);
}

export function drawOpenPlanDecor(ctx) {
  drawMeetingRoom(ctx);
  drawKitchenRoom(ctx);
  drawLivingRoom(ctx);
  drawWorkspaceRoom(ctx);

  // Interior Dividing Walls (Vertical)
  px(ctx, HOUSE.x + 26.5 * T, HOUSE.y + T, 1.5 * T, HOUSE.h - 2 * T, P.wallD, shade(P.wallD, -20));
  ctx.fillStyle = shade(P.wall, 10); // Wall Top
  ctx.fillRect(HOUSE.x + 26.5 * T, HOUSE.y + T, 1.5 * T, 3);
  
  for (let i = 0; i < 7; i++) {
    drawPlant(ctx, HOUSE.x + 26.5 * T + 2, HOUSE.y + 4 * T + i * 4 * T, i % 2 === 0 ? "#166534" : "#14532d");
  }

  // Central Hallway definition
  px(ctx, HOUSE.x + T, HOUSE.y + 16 * T, HOUSE.w - 2 * T, 2 * T, "#2e1e12", "#1a1008");
  drawStairs(ctx, HOUSE.x + HOUSE.w / 2 - 3 * T, HOUSE.y + 16 * T, 6 * T, 2 * T);
}

export function drawZoneLabel(ctx, x, y, text, color) {
  const w = text.length * 5 + 10;
  px(ctx, x - w / 2, y, w, 11, "rgba(0,0,0,0.62)", color);
  ctx.fillStyle = color;
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 8);
  ctx.textAlign = "left";
}

export function drawStatus(ctx, x, y, status, activity) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.idle;
  const labelW = cfg.label.length * 6 + 20;
  px(ctx, x - labelW / 2, y, labelW, 15, cfg.bg, cfg.color);
  ctx.fillStyle = cfg.color;
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText(cfg.label, x, y + 11);

  const trimmed = (activity || "Idling...").slice(0, 18);
  const activityW = trimmed.length * 6 + 14;
  px(ctx, x - activityW / 2, y + 17, activityW, 13, "rgba(0,0,0,0.68)", "#8fa3c8");
  ctx.fillStyle = "#c4d2ee";
  ctx.font = "7px monospace";
  ctx.fillText(trimmed, x, y + 26);
  ctx.textAlign = "left";
}

export function drawName(ctx, x, y, name, color) {
  const w = name.length * 6 + 14;
  px(ctx, x - w / 2, y, w, 13, "rgba(0,0,0,0.8)", color);
  ctx.fillStyle = color;
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y + 10);
  ctx.textAlign = "left";
}

export function drawSpeechBubble(ctx, x, y, text, color) {
  const w = text.length * 5 + 12;
  const h = 14;
  px(ctx, x - w / 2, y - h, w, h, "#ffffff", color, 1);
  // Tail
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x, y + 4);
  ctx.fill();

  ctx.fillStyle = "#0a1120";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y - 5);
  ctx.textAlign = "left";
}

export function drawAgent3D(ctx, ag, def, st, isSelected, isHover) {
  const x = Math.round(ag.x);
  const y = Math.round(ag.y + Math.sin(ag.bob || 0) * 1.5);

  // Speech Bubble for thinking/typing
  if (st.status === "thinking") {
    drawSpeechBubble(ctx, x + 10, y - 10, "thinking", def.color);
  } else if (st.status === "responding") {
    const dots = ".".repeat((Math.floor(Date.now() / 300) % 3) + 1);
    drawSpeechBubble(ctx, x + 10, y - 10, "typing" + dots, def.color);
  }

  // Better Under-Foot Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 32, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = def.color;
  const bodyD = shade(body, -35);
  const bodyL = shade(body, 25);

  // Legs with shading
  px(ctx, x + 5, y + 24, 4, 6, "#1e293b", "#0f172a");
  px(ctx, x + 12, y + 24, 4, 6, "#1e293b", "#0f172a");

  // Torso (3D feel)
  px(ctx, x + 2, y + 10, 16, 14, body, bodyD, 1);
  ctx.fillStyle = bodyL;
  ctx.fillRect(x + 3, y + 11, 2, 12); // Front-side highlight

  // Head with 3 layers
  px(ctx, x + 5, y + 2, 11, 9, def.skin, shade(def.skin, -30));
  
  // Hair with volume
  px(ctx, x + 5, y, 11, 4, def.hair, shade(def.hair, -40), 1);
  ctx.fillStyle = shade(def.hair, 20);
  ctx.fillRect(x + 6, y, 3, 2);

  // Agent Specific Accessories
  if (def.id === "commander") {
    ctx.fillStyle = "#fbbf24"; ctx.fillRect(x + 9, y + 16, 2, 4); // Medal
  }
  if (def.id === "scribe") {
    px(ctx, x + 16, y + 14, 5, 8, "#f8fafc", "#cbd5e1", 1); // Paper
  }
  if (def.id === "amplifier") {
    px(ctx, x + 4, y + 5, 12, 1, "#020617"); // Shades
  }
  if (def.id === "registry") {
    px(ctx, x + 16, y + 15, 6, 8, "#e2e8f0", "#94a3b8"); // Clipboard
  }

  // Selection Pulse
  if (isSelected || isHover) {
    ctx.strokeStyle = isSelected ? def.color : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash(isSelected ? [4, 4] : []);
    ctx.strokeRect(x - 3, y - 3, 26, 36);
    ctx.setLineDash([]);
    
    if (isSelected) {
      // Glow under feet
      const grd = ctx.createRadialGradient(x + 10, y + 32, 2, x + 10, y + 32, 15);
      grd.addColorStop(0, `${def.color}44`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(x - 10, y + 10, 40, 40);
    }
  }

  drawStatus(ctx, x + 10, y - 24, st.status, st.activity);
  drawName(ctx, x + 10, y - 38, def.name, def.color);
}