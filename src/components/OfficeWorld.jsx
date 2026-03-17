import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";

import { CW, CH, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, P, AGENTS, ROOM_AREAS, ROAM_BOUNDS, SPAWN_POINTS } from '../constants/world';
import { drawOutdoor, drawHouseShell, drawOpenPlanDecor, drawZoneLabel, drawAgent3D } from '../utils/canvasRenderer';
import { streamChatResponse } from '../utils/aiService';
import SquadStatusPanel from "./SquadStatusPanel";
import InteractionPanel from "./InteractionPanel";

// --- Helpers to reduce component nesting and cognitive complexity ---

const updateAgentStatus = (agentId, status, activity, setter) => {
  setter(prev => ({
    ...prev,
    [agentId]: { ...prev[agentId], status, activity },
  }));
};

const updateAgentChat = (agentId, assistantTs, fullContent, setter) => {
  setter(prev => {
    const thread = [...(prev[agentId] || [])];
    const idx = thread.findIndex(m => m.role === "assistant" && m.ts === assistantTs);
    if (idx !== -1) thread[idx] = { ...thread[idx], content: fullContent };
    return { ...prev, [agentId]: thread };
  });
};

const getNearestAgent = (gameRef, worldX, worldY) => {
  if (!gameRef.current?.agents) return null;
  let nearest = null;
  let best = 24;
  gameRef.current.agents.forEach((ag) => {
    const d = Math.hypot(worldX - (ag.x + 10), worldY - (ag.y + 16));
    if (d < best) {
      best = d;
      nearest = ag.id;
    }
  });
  return nearest;
};

export default function OfficeWorld({ onBack, chats, setChats }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const hoveredRef = useRef(null);
  const selectedRef = useRef(null);
  const rafRef = useRef(null);
  const statusRef = useRef({});
  const chatsRef = useRef({});
  const viewportRef = useRef({ w: CW, h: CH, dpr: 1 });
  const cameraRef = useRef({ zoom: DEFAULT_ZOOM, x: 0, y: 0, initialized: false });
  const dragRef = useRef({ panning: false, lastX: 0, lastY: 0, total: 0, blockClickUntil: 0 });

  const [activeTarget, setActiveTarget] = useState("commander");
  const [activeTab, setActiveTab] = useState("feed");
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentFeed, setAgentFeed] = useState([]);
  const [zoomUi, setZoomUi] = useState(Math.round(DEFAULT_ZOOM * 100));
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1440));

  const threadEndRef = useRef(null);
  const feedEndRef = useRef(null);
  const threadContainerRef = useRef(null);
  const feedContainerRef = useRef(null);

  const [agentStatus, setAgentStatus] = useState(() => {
    const initial = Object.fromEntries(AGENTS.map((a) => [a.id, { status: "idle", tokens: 0, cost: 0, activity: "Idling around" }]));
    statusRef.current = initial;
    return initial;
  });

  // Sync refs for RAF loop access
  useEffect(() => { statusRef.current = agentStatus; }, [agentStatus]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

  const smartScroll = (anchorRef, containerRef) => {
    if (!anchorRef.current || !containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isNearBottom) anchorRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { smartScroll(threadEndRef, threadContainerRef); }, [chats, activeTarget, activeTab]);
  useEffect(() => { smartScroll(feedEndRef, feedContainerRef); }, [agentFeed, activeTab]);

  const setSelectedId = useCallback((id) => { selectedRef.current = id; }, []);
  const pushFeed = useCallback((items) => { setAgentFeed((prev) => [...items, ...prev].slice(0, 60)); }, []);

  const clampCamera = useCallback((cam) => {
    const { w, h } = viewportRef.current;
    const maxX = Math.max(0, CW - w / cam.zoom);
    const maxY = Math.max(0, CH - h / cam.zoom);
    cam.x = Math.min(Math.max(0, cam.x), maxX);
    cam.y = Math.min(Math.max(0, cam.y), maxY);
  }, []);

  const centerCamera = useCallback((zoom = DEFAULT_ZOOM) => {
    const cam = cameraRef.current;
    cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    const { w, h } = viewportRef.current;
    cam.x = Math.max(0, (CW - w / cam.zoom) / 2);
    cam.y = Math.max(0, (CH - h / cam.zoom) / 2);
    clampCamera(cam);
    setZoomUi(Math.round(cam.zoom * 100));
  }, [clampCamera]);

  const screenToWorld = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const cam = cameraRef.current;
    return {
      x: cam.x + (clientX - rect.left) / cam.zoom,
      y: cam.y + (clientY - rect.top) / cam.zoom,
    };
  }, []);

  const setZoomAround = useCallback((nextZoom, anchorClientX, anchorClientY) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cam = cameraRef.current;
    const anchorX = typeof anchorClientX === "number" ? anchorClientX - rect.left : rect.width / 2;
    const anchorY = typeof anchorClientY === "number" ? anchorClientY - rect.top : rect.height / 2;
    const worldX = cam.x + anchorX / cam.zoom;
    const worldY = cam.y + anchorY / cam.zoom;
    cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    cam.x = worldX - anchorX / cam.zoom;
    cam.y = worldY - anchorY / cam.zoom;
    clampCamera(cam);
    setZoomUi(Math.round(cam.zoom * 100));
  }, [clampCamera]);

  const pickTarget = useCallback((agent) => {
    agent.tx = ROAM_BOUNDS.x + 14 + Math.random() * (ROAM_BOUNDS.w - 28);
    agent.ty = ROAM_BOUNDS.y + 12 + Math.random() * (ROAM_BOUNDS.h - 24);
  }, []);

  useEffect(() => {
    gameRef.current = {
      agents: AGENTS.map((a, idx) => {
        const spawn = SPAWN_POINTS[idx % SPAWN_POINTS.length];
        return {
          id: a.id, x: spawn.x, y: spawn.y, tx: spawn.x, ty: spawn.y,
          speed: 0.85, bob: Math.random() * Math.PI, frameTick: 0, idleTick: 0,
          idleDuration: 80 + Math.random() * 120, dir: "down",
        };
      }),
    };
    gameRef.current.agents.forEach(pickTarget);
  }, [pickTarget]);

  useEffect(() => {
    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;
      viewportRef.current = { w, h, dpr };
      if (!cameraRef.current.initialized) {
        centerCamera(DEFAULT_ZOOM);
        cameraRef.current.initialized = true;
      } else {
        clampCamera(cameraRef.current);
      }
    };
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(containerRef.current);
    resizeCanvas();
    return () => observer.disconnect();
  }, [centerCamera, clampCamera]);

  useEffect(() => {
    const loop = () => {
      if (!canvasRef.current || !gameRef.current?.agents) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvasRef.current.getContext("2d");
      const { dpr, w, h } = viewportRef.current;
      const cam = cameraRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      gameRef.current.agents.forEach((ag) => {
        const st = statusRef.current[ag.id] || { status: "idle" };
        if (st.status === "thinking" || st.status === "responding") { ag.bob += 0.06; return; }
        ag.frameTick++; ag.bob += 0.12;
        const dx = ag.tx - ag.x, dy = ag.ty - ag.y, d = Math.hypot(dx, dy);
        if (d < 2) {
          ag.idleTick++;
          if (ag.idleTick > ag.idleDuration) { ag.idleTick = 0; ag.idleDuration = 90 + Math.random() * 130; pickTarget(ag); }
        } else {
          ag.x += (dx / d) * ag.speed; ag.y += (dy / d) * ag.speed;
          ag.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        }
      });

      ctx.save();
      ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
      drawOutdoor(ctx); drawHouseShell(ctx); drawOpenPlanDecor(ctx);
      const labels = [
        { x: ROOM_AREAS.meeting.x + ROOM_AREAS.meeting.w / 2, y: ROOM_AREAS.meeting.y - 12, text: "MEETING ROOM", color: "#FFD700" },
        { x: ROOM_AREAS.kitchen.x + ROOM_AREAS.kitchen.w / 2, y: ROOM_AREAS.kitchen.y - 12, text: "KITCHEN", color: "#60A5FA" },
        { x: ROOM_AREAS.living.x + ROOM_AREAS.living.w / 2, y: ROOM_AREAS.living.y - 12, text: "LIVING ROOM", color: "#FF6B6B" },
        { x: ROOM_AREAS.workspace.x + ROOM_AREAS.workspace.w / 2, y: ROOM_AREAS.workspace.y - 12, text: "WORKSPACE", color: "#00E5A0" },
      ];
      labels.forEach(l => drawZoneLabel(ctx, l.x, l.y, l.text, l.color));
      gameRef.current.agents.forEach((ag) => {
        const def = AGENTS.find(a => a.id === ag.id);
        if (!def) return;
        const st = statusRef.current[ag.id] || { status: "idle", activity: "Idling" };
        const walking = ag.tx && Math.hypot(ag.tx - ag.x, ag.ty - ag.y) > 2;
        drawAgent3D(ctx, ag, def, (walking && st.status === "idle" ? { ...st, status: "walking" } : st), selectedRef.current === ag.id, hoveredRef.current === ag.id);
      });
      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pickTarget]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current = { ...dragRef.current, panning: true, lastX: e.clientX, lastY: e.clientY, total: 0 };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current.panning) return;
    dragRef.current.panning = false;
    if (dragRef.current.total > 4) dragRef.current.blockClickUntil = performance.now() + 160;
    if (canvasRef.current) canvasRef.current.style.cursor = hoveredRef.current ? "pointer" : "grab";
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || !gameRef.current) return;
    if (dragRef.current.panning) {
      const dx = e.clientX - dragRef.current.lastX, dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX; dragRef.current.lastY = e.clientY; dragRef.current.total += Math.abs(dx) + Math.abs(dy);
      cameraRef.current.x -= dx / cameraRef.current.zoom; cameraRef.current.y -= dy / cameraRef.current.zoom;
      clampCamera(cameraRef.current); return;
    }
    const world = screenToWorld(e.clientX, e.clientY);
    const nearest = getNearestAgent(gameRef, world.x, world.y);
    hoveredRef.current = nearest;
    canvasRef.current.style.cursor = nearest ? "pointer" : "grab";
  }, [clampCamera, screenToWorld]);

  const handleCanvasClick = useCallback((e) => {
    if (performance.now() < dragRef.current.blockClickUntil) return;
    const world = screenToWorld(e.clientX, e.clientY);
    const nearest = getNearestAgent(gameRef, world.x, world.y);
    if (nearest) { setSelectedId(nearest); setActiveTarget(nearest); }
  }, [screenToWorld, setSelectedId]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoomAround(cameraRef.current.zoom + (e.deltaY < 0 ? 0.14 : -0.14), e.clientX, e.clientY);
  }, [setZoomAround]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const dispatchToAgent = useCallback(async (targetAgentId, taskText, setChatsRef, setAgentStatusRef, pushFeedRef) => {
    const target = AGENTS.find(a => a.id === targetAgentId); if (!target) return;
    const taskLabel = `[COMMANDER ASSIGNMENT] ${taskText}`;
    updateAgentStatus(targetAgentId, "thinking", "Receiving orders...", setAgentStatusRef);
    pushFeedRef([{
      id: `${Date.now()}-dispatch-${targetAgentId}`, speaker: "COMMANDER → " + target.name,
      speakerId: targetAgentId, color: target.color, text: `📋 Mission assigned: ${taskText.slice(0, 100)}`,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }]);
    const history = (chatsRef.current[targetAgentId] || []).map(m => ({ role: m.role, content: m.content }));
    setChatsRef(prev => ({ ...prev, [targetAgentId]: [...(prev[targetAgentId] || []), { role: "user", content: taskLabel, ts: Date.now() }] }));
    try {
      const assistantTs = Date.now();
      setChatsRef(prev => ({ ...prev, [targetAgentId]: [...(prev[targetAgentId] || []), { role: "assistant", content: "", ts: assistantTs }] }));
      const fullContent = await streamChatResponse({
        agentId: targetAgentId, system: target.system, messages: [...history, { role: "user", content: taskLabel }],
        onToken: (delta, currentFull) => { updateAgentChat(targetAgentId, assistantTs, currentFull, setChatsRef); updateAgentStatus(targetAgentId, "responding", "TYPING...", setAgentStatusRef); },
      });
      const newTok = Math.floor(fullContent.length / 4);
      setAgentStatusRef(prev => ({
        ...prev, [targetAgentId]: {
          status: "responding", tokens: (prev[targetAgentId].tokens || 0) + newTok,
          cost: parseFloat(((prev[targetAgentId].cost || 0) + (newTok * 0.000003)).toFixed(4)), activity: "Task received",
        },
      }));
      pushFeedRef([{ id: `${Date.now()}-${targetAgentId}-resp`, speaker: target.name, speakerId: target.id, color: target.color, text: fullContent, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }]);
      setTimeout(() => updateAgentStatus(targetAgentId, "idle", "Idling around", setAgentStatusRef), 2500);
    } catch (err) { updateAgentStatus(targetAgentId, "idle", "Dispatch failed", setAgentStatusRef); }
  }, []);

  const parseAndDispatch = useCallback((commanderResponse, setChatsRef, setAgentStatusRef, pushFeedRef) => {
    if (!commanderResponse) return;
    const assignRegex = /\[ASSIGN:(scribe|amplifier|registry)\]([^[\n]*)/gi;
    const dispatched = new Set(); let match, delay = 1500;
    while ((match = assignRegex.exec(commanderResponse)) !== null) {
      const agentId = match[1].toLowerCase(), task = match[2].trim();
      if (!task || dispatched.has(agentId)) continue;
      dispatched.add(agentId);
      setTimeout(() => dispatchToAgent(agentId, task, setChatsRef, setAgentStatusRef, pushFeedRef), delay);
      delay += 1800;
    }
  }, [dispatchToAgent]);

  const sendMission = useCallback(async () => {
    const text = userInput.trim(); if (!text || loading) return;
    const target = AGENTS.find((a) => a.id === activeTarget); if (!target) return;
    const history = chats[activeTarget] || [];
    setChats((prev) => ({ ...prev, [activeTarget]: [...history, { role: "user", content: text, ts: Date.now() }] }));
    setUserInput(""); setLoading(true);
    updateAgentStatus(activeTarget, "thinking", "Reading mission", setAgentStatus);
    pushFeed([{ id: `${Date.now()}-user`, speaker: "USER", speakerId: "user", color: "#ffe29b", text: `${target.name}: ${text.slice(0, 120)}`, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }]);
    try {
      const assistantTs = Date.now();
      setChats((prev) => ({ ...prev, [activeTarget]: [...(prev[activeTarget] || []), { role: "assistant", content: "", ts: assistantTs }] }));
      const fullContent = await streamChatResponse({
        agentId: activeTarget, system: target.system, messages: [...history, { role: "user", content: text }],
        onToken: (delta, currentFull) => { updateAgentStatus(activeTarget, "responding", "TYPING...", setAgentStatus); updateAgentChat(activeTarget, assistantTs, currentFull, setChats); },
      });
      const newTok = Math.floor((text.length + fullContent.length) / 4);
      setAgentStatus((prev) => ({
        ...prev, [activeTarget]: { status: "responding", tokens: (prev[activeTarget].tokens || 0) + newTok, cost: parseFloat(((prev[activeTarget].cost || 0) + (newTok * 0.000003)).toFixed(4)), activity: "DONE" },
      }));
      pushFeed([{ id: `${Date.now()}-${activeTarget}`, speaker: target.name, speakerId: target.id, color: target.color, text: fullContent, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }]);
      if (activeTarget === "commander") parseAndDispatch(fullContent, setChats, setAgentStatus, pushFeed);
      setTimeout(() => updateAgentStatus(activeTarget, "idle", "Idling around", setAgentStatus), 2300);
    } catch { updateAgentStatus(activeTarget, "idle", "Network error", setAgentStatus); } finally { setLoading(false); }
  }, [activeTarget, chats, loading, parseAndDispatch, pushFeed, setChats, userInput]);

  const isStacked = windowWidth < 1100;
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeThread = chats[activeTarget] || [];
  const activeAgent = AGENTS.find((a) => a.id === activeTarget);

  return (
    <div style={{ height: "100dvh", width: "100vw", display: "grid", gridTemplateColumns: isStacked ? "1fr" : "240px 1fr 360px", gridTemplateRows: isStacked ? "200px 1fr 300px" : "1fr", background: "linear-gradient(180deg, #0b1222 0%, #0a1020 100%)", color: P.text, fontFamily: "'Syne Mono', ui-monospace, monospace", overflow: "hidden" }}>
      <SquadStatusPanel agentStatus={agentStatus} isStacked={isStacked} />
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
        <div style={{ borderBottom: `1px solid ${P.panelBorder}`, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 3 }}>{AGENTS.map((a) => (<div key={a.id} style={{ width: 8, height: 8, background: a.color }} />))}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.58rem", color: "#f3f7ff" }}>PIXEL HOUSE HQ</div>
            <div style={{ border: "1px solid #5ca66f", color: "#8ade9a", padding: "2px 8px", fontSize: "0.34rem", letterSpacing: "0.04em" }}>LIVE VIEW</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "0.4rem", color: "#a7b6d3" }}>Top-down open house monitor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => centerCamera(DEFAULT_ZOOM)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a7b6d3", padding: "4px 8px", fontSize: "0.4rem", cursor: "pointer" }}>RESET</button>
              <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ fontSize: "0.4rem", color: "#a7b6d3", minWidth: 34, textAlign: "right" }}>{zoomUi}%</div>
            </div>
            <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f3f7ff", padding: "4px 12px", fontSize: "0.42rem", cursor: "pointer", fontFamily: "'Syne Mono', monospace" }}>HOME</button>
          </div>
        </div>
        <div ref={containerRef} style={{ flex: 1, minHeight: 0, background: "#081120", position: "relative" }}>
          <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseMove={handleMouseMove} onClick={handleCanvasClick} onContextMenu={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", imageRendering: "pixelated", touchAction: "none" }} />
          <div style={{ position: "absolute", right: 10, bottom: 10, border: "1px solid #ffffff24", background: "rgba(12, 19, 36, 0.86)", color: "#bad1f6", padding: "6px 8px", fontSize: "0.34rem", pointerEvents: "none" }}>Drag untuk geser • Wheel untuk zoom</div>
        </div>
      </main>
      <InteractionPanel isStacked={isStacked} activeTab={activeTab} setActiveTab={setActiveTab} setActiveTarget={setActiveTarget} setSelectedId={setSelectedId} agentFeed={agentFeed} activeThread={activeThread} activeAgent={activeAgent} agentStatus={agentStatus} activeTarget={activeTarget} userInput={userInput} setUserInput={setUserInput} sendMission={sendMission} loading={loading} feedContainerRef={feedContainerRef} threadContainerRef={threadContainerRef} feedEndRef={feedEndRef} threadEndRef={threadEndRef} />
    </div>
  );
}

OfficeWorld.propTypes = {
  onBack: PropTypes.func.isRequired,
  chats: PropTypes.object.isRequired,
  setChats: PropTypes.func.isRequired,
};
