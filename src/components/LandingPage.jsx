import { useState, useEffect } from "react";

export default function LandingPage({ onEnter }) {
  const [isDark, setIsDark] = useState(true);

  // Sync body + html background with theme so the sides don't stay dark
  // when the root container has a max-width and margins show through
  useEffect(() => {
    const bg = isDark ? "#060610" : "#f8f9fa";
    document.body.style.background = bg;
    document.documentElement.style.background = bg;

    // Cleanup: reset to dark when navigating away to HQ
    return () => {
      document.body.style.background = "#060610";
      document.documentElement.style.background = "#060610";
    };
  }, [isDark]);

  const theme = {
    background: isDark ? "#060610" : "#f8f9fa",
    text: isDark ? "#e4e4f0" : "#1a1a2e",
    textSecondary: isDark ? "#9090b0" : "#6c757d",
    textMuted: isDark ? "#ffffff30" : "#adb5bd",
    accent: "#7B61FF",
    accentLight: isDark ? "#7B61FF18" : "#7B61FF10",
    border: isDark ? "#ffffff08" : "#e9ecef",
    cardBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    navText: isDark ? "#ffffff55" : "#6c757d",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.background,
      fontFamily: "'Syne', sans-serif",
      color: theme.text,
      position: "relative",
      overflow: "hidden",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      {/* Animated dot-grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(circle, ${isDark ? "#ffffff08" : "#00000008"} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        animation: "gridPan 18s linear infinite",
      }} />

      {/* Glow orbs */}
      <div style={{
        position: "fixed", top: "10%", left: "15%",
        width: 360, height: 360, borderRadius: "50%",
        background: `radial-gradient(circle, ${isDark ? "#7B61FF18" : "rgba(123,107,255,0.03)"} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.3s ease",
      }} />
      <div style={{
        position: "fixed", bottom: "15%", right: "10%",
        width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${isDark ? "#00E5A018" : "rgba(0,229,160,0.02)"} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.3s ease",
      }} />

      {/* ── NAV ── */}
      <nav style={{
        position: "relative", zIndex: 10,
        padding: "24px 64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {["#7B61FF", "#00E5A0", "#FF6B6B", "#FFD700"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, backgroundColor: c }} />
            ))}
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.04em", color: theme.text }}>
            PixelForce HQ
          </span>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#agents" style={{ color: theme.navText, fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
            Agents
          </a>
          <a href="#how" style={{ color: theme.navText, fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
            How it works
          </a>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
              border: `1px solid ${theme.border}`,
              color: theme.text,
              fontSize: 11,
              fontFamily: "'Syne Mono', monospace",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#7B61FF";
              e.currentTarget.style.color = "#7B61FF";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.color = theme.text;
            }}
          >
            {isDark ? "🌙 DARK" : "☀️ LIGHT"}
          </button>

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
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: theme.accentLight, border: "1px solid #7B61FF35",
          padding: "6px 16px", marginBottom: 36,
        }}>
          <div style={{ width: 6, height: 6, background: "#7B61FF", animation: "dotPulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, color: "#7B61FF", fontFamily: "'Syne Mono', monospace", letterSpacing: "0.1em" }}>
            AI AGENT COMMAND CENTER
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(38px, 6vw, 68px)",
          fontWeight: 800, lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: theme.text, marginBottom: 24,
        }}>
          Your AI team,<br />
          <span style={{ color: "#7B61FF" }}>always on duty.</span>
        </h1>

        <p style={{
          fontSize: 18, lineHeight: 1.75, color: theme.textSecondary,
          maxWidth: 560, margin: "0 auto 16px", fontWeight: 400,
        }}>
          PixelForce HQ is a multi-agent platform where four specialized AI agents — each with a distinct role, personality, and domain — work together as your digital squad.
        </p>

        <p style={{
          fontSize: 15, color: theme.textMuted, marginBottom: 44,
          fontFamily: "'Syne Mono', monospace", letterSpacing: "0.04em",
        }}>
          Powered by Claude · Built for teams that move fast
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
          <button className="try-btn" onClick={onEnter}>
            Launch the HQ ↗
          </button>
          <a href="#how" style={{
            color: theme.textMuted, fontSize: 13, fontWeight: 600,
            textDecoration: "none", borderBottom: `1px solid ${theme.border}`, paddingBottom: 2,
          }}>
            See how it works
          </a>
        </div>
      </section>

      {/* ── AGENT CARDS PREVIEW ── */}
      <section id="agents" style={{
        position: "relative", zIndex: 10,
        maxWidth: 1200, margin: "0 auto",
        padding: "80px 40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700, color: theme.text, marginBottom: 16,
          }}>Meet your AI squad</h2>
          <p style={{ fontSize: 16, color: theme.textSecondary, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Four specialized agents, each with their own personality and expertise, ready to tackle any challenge.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 24,
        }}>
          {[
            { name: "COMMANDER", role: "Manager", color: "#FFD700", desc: "Strategic leadership and task delegation" },
            { name: "SCRIBE", role: "Content Writer", color: "#00E5A0", desc: "Creative writing and copy production" },
            { name: "AMPLIFIER", role: "Marketing", color: "#FF6B6B", desc: "Growth strategies and campaigns" },
            { name: "REGISTRY", role: "Administration", color: "#60A5FA", desc: "Operations and documentation" },
          ].map((a, i) => (
            <div key={i} style={{
              background: isDark ? "#0c0c1e" : "#ffffff",
              border: `1px solid ${isDark ? "#ffffff0d" : "#e9ecef"}`,
              padding: "20px 18px 18px",
              transition: "border-color 0.18s, transform 0.18s, background 0.3s",
              "--ac": a.color,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "#ffffff0d" : "#e9ecef"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ height: 2, background: a.color, marginBottom: 18, opacity: 0.7 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 10, height: 10, backgroundColor: a.color,
                  animation: "dotPulse 2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
                <span style={{ fontSize: 11, fontFamily: "'Syne Mono', monospace", color: a.color, letterSpacing: "0.08em" }}>
                  {a.name}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{a.role}</h3>
              <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.65 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{
        position: "relative", zIndex: 10,
        background: isDark ? "#0a0a14" : "#f1f3f4",
        padding: "80px 40px",
        borderTop: `1px solid ${theme.border}`,
        transition: "background 0.3s ease",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700, color: theme.text, marginBottom: 16,
          }}>How it works</h2>
          <p style={{
            fontSize: 16, color: theme.textSecondary, maxWidth: 600,
            margin: "0 auto 48px", lineHeight: 1.6,
          }}>
            Each agent has a specialized role and personality, working together to deliver comprehensive solutions.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32, textAlign: "left",
          }}>
            {[
              { step: "01", title: "Choose your agent", desc: "Select from COMMANDER, SCRIBE, AMPLIFIER, or REGISTRY based on your needs." },
              { step: "02", title: "Give clear instructions", desc: "Each agent understands their domain and will ask for clarification if needed." },
              { step: "03", title: "Get specialized output", desc: "Receive tailored responses from agents with distinct personalities and expertise." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "24px 0" }}>
                <div style={{
                  fontSize: 12, color: "#7B61FF", fontFamily: "'Syne Mono', monospace",
                  letterSpacing: "0.1em", marginBottom: 12, fontWeight: 600,
                }}>{item.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: "relative", zIndex: 10,
        padding: "40px 64px",
        borderTop: `1px solid ${theme.border}`,
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {["#7B61FF", "#00E5A0", "#FF6B6B", "#FFD700"].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, backgroundColor: c }} />
            ))}
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>PixelForce HQ</span>
        </div>
        <p style={{
          fontSize: 12, color: theme.textMuted, marginBottom: 24,
          fontFamily: "'Syne Mono', monospace", letterSpacing: "0.04em",
        }}>
          Built with Claude · Pixel aesthetic, real intelligence
        </p>
        <button className="try-btn" onClick={onEnter} style={{ fontSize: 14, padding: "12px 32px" }}>
          Get Started
        </button>
      </footer>
    </div>
  );
}