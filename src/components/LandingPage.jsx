export default function LandingPage({ onEnter }) {
  return (
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
        maxWidth: 1200, margin: "0 auto",
        padding: "80px 40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 16,
          }}>Meet your AI squad</h2>
          <p style={{
            fontSize: 16, color: "#9090b0", maxWidth: 480, margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Four specialized agents, each with their own personality and expertise, ready to tackle any challenge.
          </p>
        </div>

        <div className="land-cards" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {[
            { name: "COMMANDER", role: "Manager", color: "#FFD700", desc: "Strategic leadership and task delegation" },
            { name: "SCRIBE", role: "Content Writer", color: "#00E5A0", desc: "Creative writing and copy production" },
            { name: "AMPLIFIER", role: "Marketing", color: "#FF6B6B", desc: "Growth strategies and campaigns" },
            { name: "REGISTRY", role: "Administration", color: "#60A5FA", desc: "Operations and documentation" },
          ].map((agent, i) => (
            <div key={i} className="agent-prev" style={{
              "--ac": agent.color,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 12, height: 12, backgroundColor: agent.color,
                  borderRadius: "50%", animation: "dotPulse 2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
                <span style={{
                  fontSize: 14, fontWeight: 700, color: agent.color,
                  letterSpacing: "0.04em",
                }}>{agent.name}</span>
              </div>
              <h3 style={{
                fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8,
              }}>{agent.role}</h3>
              <p style={{
                fontSize: 14, color: "#9090b0", lineHeight: 1.5,
              }}>{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{
        position: "relative", zIndex: 10,
        background: "#0a0a14",
        padding: "80px 40px",
        borderTop: "1px solid #ffffff05",
      }}>
        <div style={{
          maxWidth: 1000, margin: "0 auto", textAlign: "center",
        }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 16,
          }}>How it works</h2>
          <p style={{
            fontSize: 16, color: "#9090b0", maxWidth: 600, margin: "0 auto 48px",
            lineHeight: 1.6,
          }}>
            Each agent has a specialized role and personality, working together to deliver comprehensive solutions.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
            textAlign: "left",
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
                <h3 style={{
                  fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8,
                }}>{item.title}</h3>
                <p style={{
                  fontSize: 14, color: "#9090b0", lineHeight: 1.5,
                }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: "relative", zIndex: 10,
        padding: "40px 64px",
        borderTop: "1px solid #ffffff05",
        textAlign: "center",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          marginBottom: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {["#7B61FF","#00E5A0","#FF6B6B","#FFD700"].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, backgroundColor: c }} />
            ))}
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
            PixelForce HQ
          </span>
        </div>
        <p style={{
          fontSize: 12, color: "#ffffff25", marginBottom: 24,
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