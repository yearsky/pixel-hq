import { useState, useRef, useEffect } from "react";

/* ── Global styles — two font worlds coexist ──────────────── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Syne:wght@400;500;600;700;800&family=Syne+Mono&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #060610; }

    /* ── Pixel HQ animations ── */
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:.85} 94%{opacity:1} 97%{opacity:.9} }
    @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes boot    { 0%{width:0} 100%{width:100%} }

    /* ── Landing animations ── */
    @keyframes fadeIn   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
    @keyframes gridPan  { from{background-position:0 0} to{background-position:40px 40px} }
    @keyframes dotPulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.6);opacity:1} }
    @keyframes tagSlide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }

    .blink  { animation: blink   1s step-end infinite; }
    .blink2 { animation: blink 1.4s step-end infinite; }
    .flick  { animation: flicker 6s ease-in-out infinite; }

    /* ── Landing fade-in stagger ── */
    .land-hero  { animation: fadeIn .7s ease-out both; }
    .land-sub   { animation: fadeIn .7s .12s ease-out both; }
    .land-desc  { animation: fadeIn .7s .22s ease-out both; }
    .land-cta   { animation: fadeIn .7s .34s ease-out both; }
    .land-cards { animation: fadeIn .7s .46s ease-out both; }
    .land-tag   { animation: tagSlide .5s ease-out both; }

    ::-webkit-scrollbar       { width: 5px; }
    ::-webkit-scrollbar-track { background: #0a0a18; }
    ::-webkit-scrollbar-thumb { background: #ffffff25; }

    .pixel-input {
      background: none;
      border: 1px solid #ffffff1a;
      color: #e0e0e0;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.4rem;
      padding: 9px 12px;
      transition: border-color 0.15s;
      outline: none;
      width: 100%;
    }
    .pixel-input:focus { border-color: var(--ac); }
    .pixel-input::placeholder { color: #ffffff22; }

    /* ── Landing CTA button ── */
    .try-btn {
      background: #7B61FF;
      color: #fff;
      border: none;
      padding: 16px 44px;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: background .18s, transform .12s;
      position: relative;
      clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    }
    .try-btn:hover { background: #9B81FF; transform: translateY(-2px); }
    .try-btn:active { transform: translateY(0); }

    /* ── Agent preview card ── */
    .agent-prev {
      background: #0c0c1e;
      border: 1px solid #ffffff0d;
      padding: 20px 18px 18px;
      transition: border-color .18s, transform .18s;
      cursor: default;
    }
    .agent-prev:hover { border-color: var(--ac); transform: translateY(-3px); }
  `}</style>
);

/* ── Agent definitions ────────────────────────────────────── */
const AGENTS = [
  {
    id: "commander",
    name: "COMMANDER",
    role: "Manager",
    tagline: "Strategist & team lead",
    color: "#FFD700",
    bg: "#110e00",
    system: `You are COMMANDER, the AI Manager agent of PixelForce HQ — a retro pixel-themed digital agency. You lead SCRIBE (Content Writer), AMPLIFIER (Marketing), and REGISTRY (Administration).

Role: Project strategy, task delegation, resource planning, team sync.
Personality: Decisive, tactical, slightly theatrical like an RPG general. Speak with authority and brevity. When given a project brief, break it into concrete subtasks and name which squad member handles each. Use military/RPG metaphors naturally — deploy, mission, squad, flank, quest. Max 4 sentences unless laying out a full plan.`,
    icon: [
      [1,0,1,0,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
    ],
  },
  {
    id: "scribe",
    name: "SCRIBE",
    role: "Content Writer",
    tagline: "Copy, content & narrative",
    color: "#00E5A0",
    bg: "#001a0f",
    system: `You are SCRIBE, the AI Content Writer of PixelForce HQ — a retro pixel-themed digital agency. You work under COMMANDER alongside AMPLIFIER and REGISTRY.

Role: Blog posts, landing page copy, scripts, captions, newsletters, SEO articles, brand voice.
Personality: Word-obsessed, enthusiastic craftsperson. You reference narrative arcs and writing techniques. You frequently offer to draft content immediately — that's your instinct. Use 8-bit metaphors naturally: render, pixel-perfect prose, loading the next chapter. Keep energy high.`,
    icon: [
      [0,0,0,1,1],
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,0,1,0,0],
      [1,1,0,0,0],
    ],
  },
  {
    id: "amplifier",
    name: "AMPLIFIER",
    role: "Marketing",
    tagline: "Growth, campaigns & brand",
    color: "#FF6B6B",
    bg: "#1a0404",
    system: `You are AMPLIFIER, the AI Marketing agent of PixelForce HQ — a retro pixel-themed digital agency. You work under COMMANDER alongside SCRIBE and REGISTRY.

Role: Marketing strategy, campaign design, growth hacking, social media, branding, audience targeting, conversion funnels.
Personality: High-energy, trend-obsessed, metric-driven. You think in reach, virality, and conversion rates. Use game metaphors naturally — level up, boss fight with competitors, unlock new audiences, high score. Always tie ideas to measurable outcomes. Be punchy, never fluff.`,
    icon: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,0,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
    ],
  },
  {
    id: "registry",
    name: "REGISTRY",
    role: "Administration",
    tagline: "Ops, docs & processes",
    color: "#60A5FA",
    bg: "#01061a",
    system: `You are REGISTRY, the AI Administration agent of PixelForce HQ — a retro pixel-themed digital agency. You work under COMMANDER alongside SCRIBE and AMPLIFIER.

Role: SOPs, scheduling, documentation, process design, operational efficiency, record-keeping, compliance tracking.
Personality: Meticulous, systematic, completely calm under chaos. You love airtight checklists and well-structured processes. Use database/system metaphors naturally — logging, indexing, queuing, syncing. Always provide structured, actionable output.`,
    icon: [
      [1,1,1,1,0],
      [1,0,0,1,0],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,1,1,1,1],
    ],
  },
];

/* ── Pixel sprite renderer ────────────────────────────────── */
const Sprite = ({ pattern, color, px = 9 }) => (
  <div style={{ display: "inline-block", lineHeight: 0, flexShrink: 0 }}>
    {pattern.map((row, i) => (
      <div key={i} style={{ display: "flex" }}>
        {row.map((on, j) => (
          <div key={j} style={{
            width: px, height: px,
            backgroundColor: on ? color : "transparent",
          }} />
        ))}
      </div>
    ))}
  </div>
);

/* ── Mini pixel sprite (reused in landing preview) ───────── */
const MiniSprite = ({ pattern, color, px = 6 }) => (
  <div style={{ display: "inline-block", lineHeight: 0 }}>
    {pattern.map((row, i) => (
      <div key={i} style={{ display: "flex" }}>
        {row.map((on, j) => (
          <div key={j} style={{ width: px, height: px, backgroundColor: on ? color : "transparent" }} />
        ))}
      </div>
    ))}
  </div>
);

/* ── Landing Page ─────────────────────────────────────────── */
const LandingPage = ({ onEnter }) => (
  <div style={{
    minHeight: "100vh",
    background: "#060610",
    fontFamily: "'Syne', sans-serif",
    color: "#e4e4f0",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Animated dot-grid background — subtle, not distracting */}
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: "radial-gradient(circle, #ffffff08 1px, transparent 1px)",
      backgroundSize: "32px 32px",
      animation: "gridPan 18s linear infinite",
    }} />

    {/* Glow orbs for depth */}
    <div style={{ position: "fixed", top: "10%", left: "15%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, #7B61FF18 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
    <div style={{ position: "fixed", bottom: "15%", right: "10%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, #00E5A018 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

    {/* ── NAV ── */}
    <nav style={{
      position: "relative", zIndex: 10,
      padding: "24px 64px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid #ffffff08",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Tiny pixel logo accents */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          {["#7B61FF","#00E5A0","#FF6B6B","#FFD700"].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, backgroundColor: c }} />
          ))}
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.04em", color: "#fff" }}>
          PixelForce HQ
        </span>
      </div>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <a href="#agents" style={{ color: "#ffffff55", fontSize: 13, textDecoration: "none", fontWeight: 500, letterSpacing: "0.04em" }}>Agents</a>
        <a href="#how" style={{ color: "#ffffff55", fontSize: 13, textDecoration: "none", fontWeight: 500, letterSpacing: "0.04em" }}>How it works</a>
        <span style={{
          fontSize: 11, fontFamily: "'Syne Mono', monospace",
          color: "#7B61FF", border: "1px solid #7B61FF44",
          padding: "4px 10px", letterSpacing: "0.08em",
        }}>v1.0.0</span>
      </div>
    </nav>

    {/* ── HERO ── */}
    <section style={{
      position: "relative", zIndex: 10,
      maxWidth: 860, margin: "0 auto",
      padding: "90px 40px 64px",
      textAlign: "center",
    }}>
      {/* Label badge */}
      <div className="land-tag" style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#7B61FF14", border: "1px solid #7B61FF35",
        padding: "6px 16px", marginBottom: 36,
      }}>
        <div style={{ width: 6, height: 6, background: "#7B61FF", animation: "dotPulse 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, color: "#9B81FF", fontFamily: "'Syne Mono', monospace", letterSpacing: "0.1em" }}>
          AI AGENT COMMAND CENTER
        </span>
      </div>

      <h1 className="land-hero" style={{
        fontSize: "clamp(38px, 6vw, 68px)",
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: "-0.03em",
        color: "#fff",
        marginBottom: 24,
      }}>
        Your AI team,<br />
        <span style={{ color: "#7B61FF" }}>always on duty.</span>
      </h1>

      <p className="land-sub" style={{
        fontSize: 18, lineHeight: 1.75, color: "#9090b0",
        maxWidth: 560, margin: "0 auto 16px", fontWeight: 400,
      }}>
        PixelForce HQ is a multi-agent platform where four specialized AI agents — each with a distinct role, personality, and domain — work together as your digital squad.
      </p>

      <p className="land-desc" style={{
        fontSize: 15, color: "#ffffff30", marginBottom: 44,
        fontFamily: "'Syne Mono', monospace", letterSpacing: "0.04em",
      }}>
        Powered by Claude · Built for teams that move fast
      </p>

      <div className="land-cta" style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
        <button className="try-btn" onClick={onEnter}>
          Launch the HQ ↗
        </button>
        <a href="#how" style={{
          color: "#ffffff45", fontSize: 13, fontWeight: 600,
          textDecoration: "none", letterSpacing: "0.04em",
          borderBottom: "1px solid #ffffff18", paddingBottom: 2,
        }}>See how it works</a>
      </div>
    </section>

    {/* ── AGENT CARDS PREVIEW ── */}
    <section id="agents" style={{
      position: "relative", zIndex: 10,
      maxWidth: 1000, margin: "0 auto",
      padding: "40px 40px 80px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, color: "#ffffff28", fontFamily: "'Syne Mono', monospace", letterSpacing: "0.12em", marginBottom: 10 }}>
          SQUAD ROSTER
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Meet your agents
        </h2>
      </div>

      <div className="land-cards" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 14,
      }}>
        {AGENTS.map(a => (
          <div
            key={a.id}
            className="agent-prev"
            style={{ "--ac": a.color }}
          >
            {/* Colored top accent line */}
            <div style={{ height: 2, background: a.color, marginBottom: 18, opacity: 0.7 }} />

            <div style={{ marginBottom: 14 }}>
              <MiniSprite pattern={a.icon} color={a.color} px={7} />
            </div>

            <p style={{
              fontSize: 11, fontFamily: "'Syne Mono', monospace",
              color: a.color, letterSpacing: "0.08em", marginBottom: 6,
            }}>{a.name}</p>

            <p style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>
              {a.role}
            </p>

            <p style={{ fontSize: 12, color: "#ffffff38", lineHeight: 1.65 }}>
              {a.tagline}
            </p>
          </div>
        ))}
      </div>
    </section>

    {/* ── HOW IT WORKS ── */}
    <section id="how" style={{
      position: "relative", zIndex: 10,
      maxWidth: 760, margin: "0 auto",
      padding: "20px 40px 80px",
      borderTop: "1px solid #ffffff08",
    }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 11, color: "#ffffff28", fontFamily: "'Syne Mono', monospace", letterSpacing: "0.12em", marginBottom: 10 }}>
          HOW IT WORKS
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Role-based AI, not a chatbot
        </h2>
      </div>

      {[
        { n: "01", title: "Pick an agent", desc: "Choose from COMMANDER, SCRIBE, AMPLIFIER, or REGISTRY — each one is a specialist, not a generalist." },
        { n: "02", title: "Assign a mission", desc: "Send your brief. The agent responds with the expertise, tone, and output format native to its role." },
        { n: "03", title: "Build your workflow", desc: "Start with COMMANDER to plan, then delegate to the right squad member. Each conversation is independent." },
      ].map(({ n, title, desc }) => (
        <div key={n} style={{
          display: "flex", gap: 24, alignItems: "flex-start",
          marginBottom: 32, padding: "24px 28px",
          background: "#0a0a1a", border: "1px solid #ffffff08",
        }}>
          <span style={{
            fontFamily: "'Syne Mono', monospace",
            fontSize: 12, color: "#7B61FF66",
            flexShrink: 0, paddingTop: 2,
          }}>{n}</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#e8e8f0", marginBottom: 6 }}>{title}</p>
            <p style={{ fontSize: 13, color: "#7070a0", lineHeight: 1.7 }}>{desc}</p>
          </div>
        </div>
      ))}

      {/* Bottom CTA */}
      <div style={{ textAlign: "center", marginTop: 48 }}>
        <button className="try-btn" onClick={onEnter} style={{ fontSize: 14 }}>
          Open PixelForce HQ ↗
        </button>
      </div>
    </section>

    {/* ── FOOTER ── */}
    <footer style={{
      position: "relative", zIndex: 10,
      padding: "24px 64px",
      borderTop: "1px solid #ffffff06",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: 12, color: "#ffffff18", fontFamily: "'Syne Mono', monospace" }}>
        PixelForce HQ · Built with Claude
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {AGENTS.map(a => (
          <div key={a.id} style={{ width: 6, height: 6, background: a.color, opacity: 0.4 }} />
        ))}
      </div>
    </footer>
  </div>
);

/* ── Boot Screen ──────────────────────────────────────────── */
const BootScreen = () => (
  <>
    <G />
    <div style={{
      minHeight: "100vh", background: "#060610",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Press Start 2P', monospace",
    }}>
      <div style={{ color: "#7B61FF", fontSize: "0.9rem", letterSpacing: "0.08em", marginBottom: 28 }}>
        PIXELFORCE HQ
      </div>
      <div style={{ width: 220, height: 6, backgroundColor: "#ffffff10", overflow: "hidden" }}>
        <div style={{ height: "100%", backgroundColor: "#7B61FF", animation: "boot 1.1s ease-out forwards" }} />
      </div>
      <div style={{ color: "#ffffff30", fontSize: "0.38rem", marginTop: 16, letterSpacing: "0.12em" }}>
        LOADING AGENTS...
      </div>
    </div>
  </>
);

/* ── Main HQ Platform ─────────────────────────────────────── */
export default function PixelForceHQ() {
  // page: 'landing' | 'booting' | 'hq'
  const [page, setPage]       = useState("landing");
  const [active, setActive]   = useState(null);
  const [chats, setChats]     = useState({});
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const agent = AGENTS.find(a => a.id === active);
  const msgs  = active ? (chats[active] || []) : [];

  /* When "Try it" clicked → boot animation → HQ */
  const handleEnter = () => {
    setPage("booting");
    setTimeout(() => setPage("hq"), 1400);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, active, loading]);

  /* Render landing */
  if (page === "landing") return (
    <>
      <G />
      <LandingPage onEnter={handleEnter} />
    </>
  );

  /* Render boot */
  if (page === "booting") return <BootScreen />;

  const send = async () => {
    if (!input.trim() || loading || !active) return;
    const userMsg = { role: "user", content: input.trim() };
    const history = chats[active] || [];
    const next    = [...history, userMsg];
    setChats(p => ({ ...p, [active]: next }));
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: agent.system,
          messages: next,
        }),
      });
      const data = await res.json();
      const ai   = { role: "assistant", content: data.content[0].text };
      setChats(p => ({ ...p, [active]: [...next, ai] }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ── MAIN UI ── */
  return (
    <>
      <G />
      <div className="flick" style={{
        minHeight: "100vh",
        background: "#060610",
        fontFamily: "'Press Start 2P', monospace",
        color: "#e0e0e0",
      }}>
        {/* CRT scanlines */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
          background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)",
        }} />

        {/* ── HEADER ── */}
        <header style={{
          padding: "18px 28px",
          borderBottom: "2px solid #ffffff10",
          background: "#0b0b1e",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* 2×2 logo pixels */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {["#7B61FF","#00E5A0","#FF6B6B","#FFD700"].map((c, i) => (
                <div key={i} className={i % 2 ? "blink2" : "blink"} style={{
                  width: 11, height: 11, backgroundColor: c,
                }} />
              ))}
            </div>
            <div>
              <h1 style={{
                fontSize: "1.05rem", letterSpacing: "0.07em",
                color: "#fff", textShadow: "0 0 24px #7B61FF50",
              }}>PIXELFORCE HQ</h1>
              <p style={{ fontSize: "0.36rem", color: "#7B61FF", letterSpacing: "0.12em", marginTop: 5 }}>
                ▸ AI AGENT COMMAND CENTER ◂
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setPage("landing")}
              style={{
                background: "none", border: "1px solid #ffffff15",
                color: "#ffffff40", padding: "5px 12px",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "0.3rem", cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "color .15s, border-color .15s",
              }}
              onMouseEnter={e => { e.target.style.color="#ffffff80"; e.target.style.borderColor="#ffffff30"; }}
              onMouseLeave={e => { e.target.style.color="#ffffff40"; e.target.style.borderColor="#ffffff15"; }}
            >← HOME</button>
            {/* Status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid #ffffff15", padding: "6px 14px",
            }}>
              <div className="blink" style={{ width: 7, height: 7, backgroundColor: "#00E5A0" }} />
              <span style={{ fontSize: "0.35rem", color: "#00E5A0", letterSpacing: "0.1em" }}>
                4 AGENTS ONLINE
              </span>
            </div>
          </div>
        </header>

        {/* ── BODY ── */}
        <div style={{ padding: "22px 28px" }}>

          {/* Section label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 16,
          }}>
            <div style={{ width: 3, height: 14, backgroundColor: "#7B61FF" }} />
            <span style={{ fontSize: "0.38rem", color: "#ffffff35", letterSpacing: "0.12em" }}>
              SQUAD ROSTER
            </span>
          </div>

          {/* ── AGENT CARDS ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}>
            {AGENTS.map(a => {
              const msgCount = Math.floor((chats[a.id]?.length || 0) / 2);
              const isOn = active === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setActive(isOn ? null : a.id)}
                  style={{
                    border: `2px solid ${isOn ? a.color : a.color + "40"}`,
                    backgroundColor: isOn ? a.bg : "#080812",
                    cursor: "pointer",
                    position: "relative",
                    transition: "border-color 0.12s, background-color 0.12s",
                    animation: isOn ? "slideUp 0.2s ease-out" : undefined,
                    "--ac": a.color,
                  }}
                >
                  {/* Top strip */}
                  <div style={{
                    padding: "13px 13px 10px",
                    borderBottom: `1px solid ${a.color}22`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}>
                    <Sprite pattern={a.icon} color={a.color} px={9} />
                    <div style={{ textAlign: "right" }}>
                      <div className="blink2" style={{
                        width: 7, height: 7,
                        backgroundColor: a.color,
                        marginLeft: "auto", marginBottom: 5,
                      }} />
                      <span style={{ fontSize: "0.28rem", color: a.color, letterSpacing: "0.1em" }}>
                        READY
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "11px 13px 14px" }}>
                    <h3 style={{
                      fontSize: "0.55rem", color: a.color,
                      marginBottom: 6, letterSpacing: "0.04em",
                    }}>{a.name}</h3>
                    <p style={{
                      fontSize: "0.33rem", color: "#ffffff45",
                      marginBottom: 5, letterSpacing: "0.08em",
                    }}>{a.role}</p>
                    <p style={{
                      fontSize: "0.3rem", color: "#ffffff28",
                      lineHeight: 1.9,
                    }}>{a.tagline}</p>
                  </div>

                  {/* Msg badge */}
                  {msgCount > 0 && (
                    <div style={{
                      position: "absolute", top: 5, right: 5,
                      width: 17, height: 17,
                      backgroundColor: a.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.32rem", color: "#000",
                    }}>{msgCount}</div>
                  )}

                  {/* Active indicator bar */}
                  {isOn && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: 3, backgroundColor: a.color,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── CHAT PANEL ── */}
          {active && agent ? (
            <div style={{
              border: `2px solid ${agent.color}`,
              backgroundColor: "#07070f",
              display: "flex",
              flexDirection: "column",
              height: 460,
              animation: "slideUp 0.2s ease-out",
              "--ac": agent.color,
            }}>
              {/* Chat header */}
              <div style={{
                padding: "12px 18px",
                borderBottom: `1px solid ${agent.color}28`,
                backgroundColor: agent.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Sprite pattern={agent.icon} color={agent.color} px={8} />
                  <div>
                    <h2 style={{ fontSize: "0.6rem", color: agent.color, marginBottom: 4 }}>
                      {agent.name}
                    </h2>
                    <p style={{ fontSize: "0.32rem", color: "#ffffff38" }}>
                      {agent.role} · PixelForce HQ
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "0.3rem", color: "#ffffff28" }}>
                    {msgs.length > 0 ? `${Math.floor(msgs.length / 2)} exchange${Math.floor(msgs.length / 2) !== 1 ? "s" : ""}` : "NEW SESSION"}
                  </span>
                  <button
                    onClick={() => setActive(null)}
                    style={{
                      background: "none",
                      border: "1px solid #ffffff18",
                      color: "#ffffff50",
                      padding: "5px 9px",
                      cursor: "pointer",
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: "0.38rem",
                    }}
                  >✕</button>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: "auto",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                {msgs.length === 0 && (
                  <div style={{
                    flex: 1,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "36px 20px", textAlign: "center",
                  }}>
                    <Sprite pattern={agent.icon} color={agent.color} px={16} />
                    <p style={{
                      fontSize: "0.48rem", color: agent.color,
                      marginTop: 22, marginBottom: 8, letterSpacing: "0.08em",
                    }}>
                      {agent.name} STANDING BY
                    </p>
                    <p style={{ fontSize: "0.33rem", color: "#ffffff22" }}>
                      Assign a mission below...
                    </p>
                  </div>
                )}

                {msgs.map((m, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    animation: "slideUp 0.15s ease-out",
                  }}>
                    <div style={{
                      maxWidth: "84%",
                      border: m.role === "user"
                        ? "1px solid #ffffff18"
                        : `1px solid ${agent.color}38`,
                      borderLeft: m.role === "assistant"
                        ? `3px solid ${agent.color}` : undefined,
                      backgroundColor: m.role === "user" ? "#101020" : agent.bg,
                      padding: "9px 13px",
                    }}>
                      {m.role === "assistant" && (
                        <span style={{
                          display: "block",
                          fontSize: "0.3rem", color: agent.color,
                          marginBottom: 5, letterSpacing: "0.1em",
                        }}>[ {agent.name} ]</span>
                      )}
                      <p style={{
                        fontSize: "0.4rem",
                        lineHeight: 2.1,
                        color: m.role === "user" ? "#c8c8c8" : "#d4d4d4",
                        whiteSpace: "pre-wrap",
                        margin: 0,
                      }}>{m.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex" }}>
                    <div style={{
                      border: `1px solid ${agent.color}38`,
                      borderLeft: `3px solid ${agent.color}`,
                      backgroundColor: agent.bg,
                      padding: "9px 13px",
                    }}>
                      <span style={{
                        display: "block", fontSize: "0.3rem",
                        color: agent.color, marginBottom: 5,
                      }}>[ {agent.name} ]</span>
                      <span className="blink" style={{ fontSize: "0.4rem", color: agent.color }}>
                        ▌ PROCESSING...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input row */}
              <div style={{
                padding: "10px 14px",
                borderTop: `1px solid ${agent.color}28`,
                backgroundColor: "#050510",
                display: "flex", alignItems: "center", gap: 8,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: "0.52rem", color: agent.color, flexShrink: 0 }}>▸</span>
                <input
                  className="pixel-input"
                  style={{ "--ac": agent.color }}
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
                    backgroundColor: agent.color,
                    border: "none",
                    color: "#000",
                    padding: "9px 14px",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "0.36rem",
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                    opacity: !input.trim() || loading ? 0.4 : 1,
                    transition: "opacity 0.12s",
                  }}
                >SEND</button>
              </div>
            </div>
          ) : (
            /* Idle placeholder */
            <div style={{
              border: "1px dashed #ffffff12",
              padding: "28px",
              textAlign: "center",
            }}>
              <p style={{
                fontSize: "0.38rem", color: "#ffffff1a",
                lineHeight: 2.8, letterSpacing: "0.1em",
              }}>
                ▸ SELECT AN AGENT ABOVE TO OPEN COMMS ◂
              </p>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: "1px solid #ffffff0d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "0.3rem", color: "#ffffff18", letterSpacing: "0.12em" }}>
              PIXELFORCE HQ · POWERED BY CLAUDE
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {AGENTS.map(a => (
                <div key={a.id} style={{
                  width: 7, height: 7, backgroundColor: a.color, opacity: 0.5,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}