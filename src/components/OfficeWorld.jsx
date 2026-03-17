import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";

import { CW, CH, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, P, AGENTS, ROOM_AREAS, ROAM_BOUNDS, SPAWN_POINTS } from '../constants/world';
import { drawOutdoor, drawHouseShell, drawOpenPlanDecor, drawZoneLabel, drawAgent3D } from '../utils/canvasRenderer';
import SquadStatusPanel from "./SquadStatusPanel";
import InteractionPanel from "./InteractionPanel";



export default function OfficeWorld({ onBack, chats, setChats }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const hoveredRef = useRef(null);
  const selectedRef = useRef(null);
  const rafRef = useRef(null);
  const statusRef = useRef({});
  const viewportRef = useRef({ w: CW, h: CH, dpr: 1 });
  const cameraRef = useRef({
    zoom: DEFAULT_ZOOM,
    x: 0,
    y: 0,
    initialized: false,
  });
  const dragRef = useRef({ panning: false, lastX: 0, lastY: 0, total: 0, blockClickUntil: 0 });

  const [activeTarget, setActiveTarget] = useState("commander");
  const [activeTab, setActiveTab] = useState("feed"); // "feed" | agentId
  const threadEndRef = useRef(null);
  const feedEndRef = useRef(null);
  const threadContainerRef = useRef(null);
  const feedContainerRef = useRef(null);

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentFeed, setAgentFeed] = useState([]);
  const [zoomUi, setZoomUi] = useState(Math.round(DEFAULT_ZOOM * 100));
  const [windowWidth, setWindowWidth] = useState(() =>
    globalThis.window !== undefined ? globalThis.window.innerWidth : 1440
  );

  const smartScroll = (anchorRef, containerRef) => {
    if (!anchorRef.current || !containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isNearBottom) {
      anchorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    smartScroll(threadEndRef, threadContainerRef);
  }, [chats, activeTarget, activeTab]);

  useEffect(() => {
    smartScroll(feedEndRef, feedContainerRef);
  }, [agentFeed, activeTab]);

  const [agentStatus, setAgentStatus] = useState(() => {
    const initial = Object.fromEntries(
      AGENTS.map((a) => [a.id, { status: "idle", tokens: 0, cost: 0, activity: "Idling around" }])
    );
    statusRef.current = initial;
    return initial;
  });

  const setSelectedId = useCallback((id) => {
    selectedRef.current = id;
  }, []);

  const isStacked = windowWidth < 1100;
  useEffect(() => {
    const onResize = () => setWindowWidth(globalThis.window.innerWidth);
    globalThis.window.addEventListener("resize", onResize);
    return () => globalThis.window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    statusRef.current = agentStatus;
  }, [agentStatus]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const clampCamera = useCallback((cam) => {
    const vw = viewportRef.current.w || CW;
    const vh = viewportRef.current.h || CH;
    const maxX = Math.max(0, CW - vw / cam.zoom);
    const maxY = Math.max(0, CH - vh / cam.zoom);
    cam.x = Math.min(Math.max(0, cam.x), maxX);
    cam.y = Math.min(Math.max(0, cam.y), maxY);
  }, []);

  const centerCamera = useCallback(
    (zoom = DEFAULT_ZOOM) => {
      const cam = cameraRef.current;
      cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
      const vw = viewportRef.current.w || CW;
      const vh = viewportRef.current.h || CH;
      cam.x = Math.max(0, (CW - vw / cam.zoom) / 2);
      cam.y = Math.max(0, (CH - vh / cam.zoom) / 2);
      clampCamera(cam);
      setZoomUi(Math.round(cam.zoom * 100));
    },
    [clampCamera]
  );

  const screenToWorld = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const cam = cameraRef.current;
    return {
      x: cam.x + (clientX - rect.left) / cam.zoom,
      y: cam.y + (clientY - rect.top) / cam.zoom,
    };
  }, []);

  const setZoomAround = useCallback(
    (nextZoom, anchorClientX, anchorClientY) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cam = cameraRef.current;

      const anchorX = typeof anchorClientX === "number" ? anchorClientX - rect.left : rect.width / 2;
      const anchorY = typeof anchorClientY === "number" ? anchorClientY - rect.top : rect.height / 2;

      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
      const worldX = cam.x + anchorX / cam.zoom;
      const worldY = cam.y + anchorY / cam.zoom;

      cam.zoom = clamped;
      cam.x = worldX - anchorX / cam.zoom;
      cam.y = worldY - anchorY / cam.zoom;
      clampCamera(cam);
      setZoomUi(Math.round(cam.zoom * 100));
    },
    [clampCamera]
  );

  const pickTarget = useCallback((agent) => {
    agent.tx = ROAM_BOUNDS.x + 14 + Math.random() * (ROAM_BOUNDS.w - 28);
    agent.ty = ROAM_BOUNDS.y + 12 + Math.random() * (ROAM_BOUNDS.h - 24);
  }, []);

  useEffect(() => {
    gameRef.current = {
      agents: AGENTS.map((a, idx) => {
        const spawn = SPAWN_POINTS[idx % SPAWN_POINTS.length];
        const startX = spawn.x;
        const startY = spawn.y;
        return {
          id: a.id,
          x: startX,
          y: startY,
          tx: startX,
          ty: startY,
          speed: 0.85,
          bob: Math.random() * Math.PI,
          frameTick: 0,
          idleTick: 0,
          idleDuration: 80 + Math.random() * 120,
          dir: "down",
        };
      }),
    };

    gameRef.current.agents.forEach((a) => pickTarget(a));
  }, [pickTarget]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.max(1, globalThis.window.devicePixelRatio || 1);

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));

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
      if (!canvasRef.current || !gameRef.current?.agents || !statusRef.current[AGENTS[0].id]) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const agents = gameRef.current.agents;
      const cam = cameraRef.current;
      const { dpr, w, h } = viewportRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      agents.forEach((ag) => {
        const st = statusRef.current[ag.id] || { status: "idle" };

        if (st.status === "thinking" || st.status === "responding") {
          ag.bob += 0.06;
          return;
        }

        ag.frameTick += 1;
        ag.bob += 0.12;

        const dx = ag.tx - ag.x;
        const dy = ag.ty - ag.y;
        const d = Math.hypot(dx, dy);

        if (d < 2) {
          ag.idleTick += 1;
          if (ag.idleTick > ag.idleDuration) {
            ag.idleTick = 0;
            ag.idleDuration = 90 + Math.random() * 130;
            pickTarget(ag);
          }
        } else {
          ag.x += (dx / d) * ag.speed;
          ag.y += (dy / d) * ag.speed;
          ag.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        }
      });

      ctx.save();
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      drawOutdoor(ctx);
      drawHouseShell(ctx);
      drawOpenPlanDecor(ctx);

      drawZoneLabel(
        ctx,
        ROOM_AREAS.meeting.x + ROOM_AREAS.meeting.w / 2,
        ROOM_AREAS.meeting.y - 12,
        "MEETING ROOM",
        "#FFD700"
      );
      drawZoneLabel(
        ctx,
        ROOM_AREAS.kitchen.x + ROOM_AREAS.kitchen.w / 2,
        ROOM_AREAS.kitchen.y - 12,
        "KITCHEN",
        "#60A5FA"
      );
      drawZoneLabel(
        ctx,
        ROOM_AREAS.living.x + ROOM_AREAS.living.w / 2,
        ROOM_AREAS.living.y - 12,
        "LIVING ROOM",
        "#FF6B6B"
      );
      drawZoneLabel(
        ctx,
        ROOM_AREAS.workspace.x + ROOM_AREAS.workspace.w / 2,
        ROOM_AREAS.workspace.y - 12,
        "WORKSPACE",
        "#00E5A0"
      );

      agents.forEach((ag) => {
        const def = AGENTS.find((a) => a.id === ag.id);
        if (!def) return;

        const st = statusRef.current[ag.id] || { status: "idle", activity: "Idling" };
        const walking = ag.tx && Math.hypot(ag.tx - ag.x, ag.ty - ag.y) > 2;
        const mergedStatus = walking && st.status === "idle" ? { ...st, status: "walking" } : st;

        drawAgent3D(
          ctx,
          ag,
          def,
          mergedStatus,
          selectedRef.current === ag.id,
          hoveredRef.current === ag.id
        );
      });

      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pickTarget]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current.panning = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    dragRef.current.total = 0;
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current.panning) return;
    dragRef.current.panning = false;
    if (dragRef.current.total > 4) {
      dragRef.current.blockClickUntil = performance.now() + 160;
    }
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredRef.current ? "pointer" : "grab";
    }
  }, []);

  useEffect(() => {
    const onWindowMouseUp = () => {
      handleMouseUp();
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, [handleMouseUp]);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.14 : -0.14;
      setZoomAround(cameraRef.current.zoom + step, e.clientX, e.clientY);
    },
    [setZoomAround]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!canvasRef.current || !gameRef.current) return;

      if (dragRef.current.panning) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        dragRef.current.total += Math.abs(dx) + Math.abs(dy);

        const cam = cameraRef.current;
        cam.x -= dx / cam.zoom;
        cam.y -= dy / cam.zoom;
        clampCamera(cam);
        return;
      }

      const world = screenToWorld(e.clientX, e.clientY);
      let nearest = null;
      let best = 24;

      gameRef.current.agents.forEach((ag) => {
        const d = Math.hypot(world.x - (ag.x + 10), world.y - (ag.y + 16));
        if (d < best) {
          best = d;
          nearest = ag.id;
        }
      });

      hoveredRef.current = nearest;
      canvasRef.current.style.cursor = nearest ? "pointer" : "grab";
    },
    [clampCamera, screenToWorld]
  );

  const handleCanvasClick = useCallback((e) => {
    if (performance.now() < dragRef.current.blockClickUntil) return;
    if (!canvasRef.current || !gameRef.current) return;

    const world = screenToWorld(e.clientX, e.clientY);

    let nearest = null;
    let best = 24;

    gameRef.current.agents.forEach((ag) => {
      const d = Math.hypot(world.x - (ag.x + 10), world.y - (ag.y + 16));
      if (d < best) {
        best = d;
        nearest = ag.id;
      }
    });

    if (!nearest) return;

    setSelectedId(nearest);
    setActiveTarget(nearest);
  }, [screenToWorld, setSelectedId]);

  const pushFeed = useCallback((items) => {
    setAgentFeed((prev) => [...items, ...prev].slice(0, 60));
  }, []);

  // Auto-dispatch: send a task directly to a sub-agent on COMMANDER's behalf
  const chatsRef = useRef({});
  const dispatchToAgent = useCallback(async (targetAgentId, taskText, setChatsRef, setAgentStatusRef, pushFeedRef) => {
    const target = AGENTS.find(a => a.id === targetAgentId);
    if (!target) return;

    const dispatchMsg = { role: "user", content: `[COMMANDER ASSIGNMENT] ${taskText}`, ts: Date.now() };

    setAgentStatusRef(prev => ({
      ...prev,
      [targetAgentId]: { ...prev[targetAgentId], status: "thinking", activity: "Receiving orders..." },
    }));

    pushFeedRef([{
      id: `${Date.now()}-dispatch-${targetAgentId}`,
      speaker: "COMMANDER → " + target.name,
      speakerId: targetAgentId,
      color: target.color,
      text: `📋 Mission assigned: ${taskText.slice(0, 100)}`,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }]);

    const currentHistory = (chatsRef.current[targetAgentId] || []).map(m => ({ role: m.role, content: m.content }));
    setChatsRef(prev => ({
      ...prev,
      [targetAgentId]: [...(prev[targetAgentId] || []), dispatchMsg],
    }));

    try {
      const res = await fetch("http://localhost:8080/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "default",
          agentId: targetAgentId,
          system: target.system,
          messages: [...currentHistory, { role: "user", content: `[COMMANDER ASSIGNMENT] ${taskText}` }],
          maxTokens: 800,
          stream: true,
        }),
      });

      if (!res.ok) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      const assistantTs = Date.now();

      setChatsRef(prev => ({
        ...prev,
        [targetAgentId]: [...(prev[targetAgentId] || []), { role: "assistant", content: "", ts: assistantTs }],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(l => l.trim())) {
          try {
            const ev = JSON.parse(line);
            if (ev.type === "token_delta" && ev.data?.delta) {
              fullContent += ev.data.delta;
              setChatsRef(prev => {
                const thread = [...(prev[targetAgentId] || [])];
                const idx = thread.findIndex(m => m.role === "assistant" && m.ts === assistantTs);
                if (idx !== -1) thread[idx] = { ...thread[idx], content: fullContent };
                return { ...prev, [targetAgentId]: thread };
              });
              setAgentStatusRef(prev => ({
                ...prev,
                [targetAgentId]: { ...prev[targetAgentId], status: "responding", activity: "TYPING..." },
              }));
            }
          } catch { /* ignore */ }
        }
      }

      const newTok = Math.floor(fullContent.length / 4);
      const newCost = parseFloat((newTok * 0.000003).toFixed(6));
      setAgentStatusRef(prev => ({
        ...prev,
        [targetAgentId]: {
          status: "responding",
          tokens: (prev[targetAgentId].tokens || 0) + newTok,
          cost: parseFloat(((prev[targetAgentId].cost || 0) + newCost).toFixed(4)),
          activity: "Task received",
        },
      }));

      pushFeedRef([{
        id: `${Date.now()}-${targetAgentId}-resp`,
        speaker: target.name,
        speakerId: target.id,
        color: target.color,
        text: fullContent,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }]);

      setTimeout(() => {
        setAgentStatusRef(prev => ({
          ...prev,
          [targetAgentId]: { ...prev[targetAgentId], status: "idle", activity: "Idling around" },
        }));
      }, 2500);
    } catch (err) {
      console.warn("Dispatch error:", err);
      setAgentStatusRef(prev => ({
        ...prev,
        [targetAgentId]: { ...prev[targetAgentId], status: "idle", activity: "Dispatch failed" },
      }));
    }
  }, []);

  // Parse COMMANDER response for explicit [ASSIGN:agentId] tags and dispatch
  const parseAndDispatch = useCallback((commanderResponse, setChatsRef, setAgentStatusRef, pushFeedRef) => {
    if (!commanderResponse) return;

    // Only match explicit structured tags: [ASSIGN:scribe] task text
    const assignRegex = /\[ASSIGN:(scribe|amplifier|registry)\]([^[\n]*)/gi;
    const dispatched = new Set();
    let match;
    let delay = 1500;

    while ((match = assignRegex.exec(commanderResponse)) !== null) {
      const agentId = match[1].toLowerCase();
      const task = match[2].trim();

      if (!task || dispatched.has(agentId)) continue;
      dispatched.add(agentId);

      setTimeout(() => {
        dispatchToAgent(agentId, task, setChatsRef, setAgentStatusRef, pushFeedRef);
      }, delay);
      delay += 1800;
    }
  }, [dispatchToAgent]);

  const sendMission = useCallback(async () => {
    const text = userInput.trim();
    if (!text || loading) return;

    const target = AGENTS.find((a) => a.id === activeTarget);
    if (!target) return;

    const userMsg = { role: "user", content: text, ts: Date.now() };
    const history = chats[activeTarget] || [];
    const next = [...history, userMsg];

    setChats((prev) => ({ ...prev, [activeTarget]: next }));
    setUserInput("");
    setLoading(true);

    setAgentStatus((prev) => ({
      ...prev,
      [activeTarget]: {
        ...prev[activeTarget],
        status: "thinking",
        activity: "Reading mission",
      },
    }));

    pushFeed([
      {
        id: `${Date.now()}-user`,
        speaker: "USER",
        speakerId: "user",
        color: "#ffe29b",
        text: `${target.name}: ${text.slice(0, 120)}`,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    try {
      // Integration with Go Backend (pixel-be) with STREAMing enabled
      const res = await fetch("http://localhost:8080/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "default",
          agentId: activeTarget,
          system: target.system,
          messages: next.map(m => ({ role: m.role, content: m.content })),
          maxTokens: 500,
          stream: true // Enable streaming for "typing" effect
        }),
      });

      if (!res.ok) throw new Error("Backend connection failed");

      // Handle NDJSON stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      // Use a stable timestamp to identify this assistant message
      const assistantTs = Date.now();

      // Initial empty placeholder for the assistant reply
      setChats((prev) => ({
        ...prev,
        [activeTarget]: [...next, { role: "assistant", content: "", ts: assistantTs }]
      }));

      const processStreamLine = (line) => {
        try {
          const ev = JSON.parse(line);
          if (ev.type === "token_delta" && ev.data?.delta) {
            fullContent += ev.data.delta;

            setAgentStatus((prev) => ({
              ...prev,
              [activeTarget]: {
                ...prev[activeTarget],
                status: "responding",
                activity: "TYPING...",
              },
            }));

            // Use assistantTs to find the exact message to update
            setChats((prev) => {
              const thread = [...(prev[activeTarget] || [])];
              const idx = thread.findIndex(m => m.role === "assistant" && m.ts === assistantTs);
              if (idx !== -1) {
                thread[idx] = { ...thread[idx], content: fullContent };
              }
              return { ...prev, [activeTarget]: thread };
            });
          }
        } catch (e) {
          console.warn("Parse error in stream line", e);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n").filter(l => l.trim()).forEach(processStreamLine);
      }

      // Finalize after stream ends
      const newTok = Math.floor((text.length + fullContent.length) / 4);
      const newCost = parseFloat((newTok * 0.000003).toFixed(6));

      setAgentStatus((prev) => ({
        ...prev,
        [activeTarget]: {
          status: "responding",
          tokens: (prev[activeTarget].tokens || 0) + newTok,
          cost: parseFloat(((prev[activeTarget].cost || 0) + newCost).toFixed(4)),
          activity: "DONE",
        },
      }));

      pushFeed([
        {
          id: `${Date.now()}-${activeTarget}`,
          speaker: target.name,
          speakerId: target.id,
          color: target.color,
          text: fullContent,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        }
      ]);

      // Auto-dispatch if COMMANDER assigned tasks to sub-agents
      if (activeTarget === "commander") {
        parseAndDispatch(fullContent, setChats, setAgentStatus, pushFeed);
      }

      setTimeout(() => {
        setAgentStatus((prev) => ({
          ...prev,
          [activeTarget]: {
            ...prev[activeTarget],
            status: "idle",
            activity: "Idling around",
          },
        }));
      }, 2300);
    } catch {
      const errText = "Request gagal. Cek endpoint/API key lalu coba lagi.";
      const errMsg = { role: "assistant", content: errText, ts: Date.now() };
      setChats((prev) => ({ ...prev, [activeTarget]: [...next, errMsg] }));

      setAgentStatus((prev) => ({
        ...prev,
        [activeTarget]: {
          ...prev[activeTarget],
          status: "idle",
          activity: "Network error",
        },
      }));

      pushFeed([
        {
          id: `${Date.now()}-error`,
          speaker: target.name,
          speakerId: target.id,
          color: target.color,
          text: errText,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeTarget, chats, loading, parseAndDispatch, pushFeed, setChats, userInput]);

  const activeThread = chats[activeTarget] || [];
  const activeAgent = AGENTS.find((a) => a.id === activeTarget);

  const zoomIn = useCallback(() => {
    setZoomAround(cameraRef.current.zoom + 0.14);
  }, [setZoomAround]);

  const zoomOut = useCallback(() => {
    setZoomAround(cameraRef.current.zoom - 0.14);
  }, [setZoomAround]);

  const zoomReset = useCallback(() => {
    centerCamera(DEFAULT_ZOOM);
  }, [centerCamera]);

  return (
    <div
      style={{
        height: "100dvh",
        width: "100vw",
        display: "grid",
        gridTemplateColumns: isStacked
          ? "1fr"
          : "240px 1fr 360px",
        gridTemplateRows: isStacked ? "200px 1fr 300px" : "1fr",
        background: "linear-gradient(180deg, #0b1222 0%, #0a1020 100%)",
        color: P.text,
        fontFamily: "'Syne Mono', ui-monospace, monospace",
        overflow: "hidden",
      }}
    >
      <SquadStatusPanel agentStatus={agentStatus} isStacked={isStacked} />

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
        <div
          style={{
            borderBottom: `1px solid ${P.panelBorder}`,
            padding: "12px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 3 }}>
              {AGENTS.map((a) => (
                <div key={a.id} style={{ width: 8, height: 8, background: a.color }} />
              ))}
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.58rem", color: "#f3f7ff" }}>
              PIXEL HOUSE HQ
            </div>
            <div
              style={{
                border: "1px solid #5ca66f",
                color: "#8ade9a",
                padding: "2px 8px",
                fontSize: "0.34rem",
                letterSpacing: "0.04em",
              }}
            >
              LIVE VIEW
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "0.4rem", color: "#a7b6d3" }}>Top-down open house monitor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={zoomOut}
                style={{
                  border: "1px solid #ffffff2a",
                  background: "#0c1527",
                  color: "#d0daef",
                  padding: "4px 8px",
                  fontSize: "0.42rem",
                  cursor: "pointer",
                  fontFamily: "'Syne Mono', ui-monospace, monospace",
                }}
              >
                -
              </button>
              <div style={{ minWidth: 58, textAlign: "center", fontSize: "0.37rem", color: "#9fd0ff" }}>{zoomUi}%</div>
              <button
                onClick={zoomIn}
                style={{
                  border: "1px solid #ffffff2a",
                  background: "#0c1527",
                  color: "#d0daef",
                  padding: "4px 8px",
                  fontSize: "0.42rem",
                  cursor: "pointer",
                  fontFamily: "'Syne Mono', ui-monospace, monospace",
                }}
              >
                +
              </button>
              <button
                onClick={zoomReset}
                style={{
                  border: "1px solid #ffffff2a",
                  background: "#0c1527",
                  color: "#d0daef",
                  padding: "4px 8px",
                  fontSize: "0.34rem",
                  cursor: "pointer",
                  fontFamily: "'Syne Mono', ui-monospace, monospace",
                }}
              >
                RESET
              </button>
            </div>
            <button
              onClick={onBack}
              style={{
                border: "1px solid #ffffff2a",
                background: "transparent",
                color: "#d0daef",
                padding: "6px 10px",
                fontSize: "0.38rem",
                cursor: "pointer",
                fontFamily: "'Syne Mono', ui-monospace, monospace",
              }}
            >
              HOME
            </button>
          </div>
        </div>

        <div ref={containerRef} style={{ flex: 1, minHeight: 0, background: "#081120", position: "relative" }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
              imageRendering: "pixelated",
              touchAction: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              border: "1px solid #ffffff24",
              background: "rgba(12, 19, 36, 0.86)",
              color: "#bad1f6",
              padding: "6px 8px",
              fontSize: "0.34rem",
              pointerEvents: "none",
            }}
          >
            Drag untuk geser • Wheel untuk zoom
          </div>
        </div>
      </main>

      <InteractionPanel
        isStacked={isStacked}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setActiveTarget={setActiveTarget}
        setSelectedId={setSelectedId}
        agentFeed={agentFeed}
        activeThread={activeThread}
        activeAgent={activeAgent}
        agentStatus={agentStatus}
        activeTarget={activeTarget}
        userInput={userInput}
        setUserInput={setUserInput}
        sendMission={sendMission}
        loading={loading}
        feedContainerRef={feedContainerRef}
        threadContainerRef={threadContainerRef}
        feedEndRef={feedEndRef}
        threadEndRef={threadEndRef}
      />
    </div>
  );
}

OfficeWorld.propTypes = {
  onBack: PropTypes.func.isRequired,
  chats: PropTypes.object.isRequired,
  setChats: PropTypes.func.isRequired,
};
