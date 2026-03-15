import { useState, useEffect } from "react";
import GlobalStyles from "./GlobalStyles";
import BootScreen from "./BootScreen";
import AgentRoster from "./AgentRoster";
import ChatPanel from "./ChatPanel";
import { AGENTS } from "./agents";

export default function PixelForceHQ() {
  const [active, setActive] = useState(null);
  const [chats, setChats] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);

  const agent = AGENTS.find((a) => a.id === active);
  const msgs = active ? chats[active] || [] : [];

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const send = async () => {
    if (!input.trim() || loading || !active) return;

    const userMsg = { role: "user", content: input.trim() };
    const history = chats[active] || [];
    const next = [...history, userMsg];

    setChats((p) => ({ ...p, [active]: next }));
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
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
      const ai = { role: "assistant", content: data.content[0].text };
      setChats((p) => ({ ...p, [active]: [...next, ai] }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!booted) return (
    <>
      <GlobalStyles />
      <BootScreen />
    </>
  );

  return (
    <>
      <GlobalStyles />
      <div className="flick" style={{
        minHeight: "100vh",
        background: "#060610",
        fontFamily: "'Press Start 2P', monospace",
        color: "#e0e0e0",
      }}>
        <div style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 999,
          background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)",
        }} />

        <header style={{
          padding: "18px 28px",
          borderBottom: "2px solid #ffffff10",
          background: "#0b0b1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {["#7B61FF", "#00E5A0", "#FF6B6B", "#FFD700"].map((c, i) => (
                <div
                  key={i}
                  className={i % 2 ? "blink2" : "blink"}
                  style={{ width: 11, height: 11, backgroundColor: c }}
                />
              ))}
            </div>
            <div>
              <h1 style={{
                fontSize: "1.05rem",
                letterSpacing: "0.07em",
                color: "#fff",
                textShadow: "0 0 24px #7B61FF50",
              }}>PIXELFORCE HQ</h1>
              <p style={{
                fontSize: "0.36rem",
                color: "#7B61FF",
                letterSpacing: "0.12em",
                marginTop: 5,
              }}>
                ▸ AI AGENT COMMAND CENTER ◂
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: "0.33rem", color: "#ffffff20", letterSpacing: "0.1em" }}>
              v1.0.0
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #ffffff15",
              padding: "6px 14px",
            }}>
              <div className="blink" style={{ width: 7, height: 7, backgroundColor: "#00E5A0" }} />
              <span style={{ fontSize: "0.35rem", color: "#00E5A0", letterSpacing: "0.1em" }}>
                4 AGENTS ONLINE
              </span>
            </div>
          </div>
        </header>

        <div style={{ padding: "22px 28px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}>
            <div style={{ width: 3, height: 14, backgroundColor: "#7B61FF" }} />
            <span style={{
              fontSize: "0.38rem",
              color: "#ffffff35",
              letterSpacing: "0.12em",
            }}>
              SQUAD ROSTER
            </span>
          </div>

          <AgentRoster agents={AGENTS} chats={chats} active={active} onSelect={setActive} />

          {active && agent ? (
            <ChatPanel
              agent={agent}
              msgs={msgs}
              input={input}
              setInput={setInput}
              loading={loading}
              onSend={send}
              onClose={() => setActive(null)}
            />
          ) : (
            <div style={{
              border: "1px dashed #ffffff12",
              padding: "28px",
              textAlign: "center",
            }}>
              <p style={{
                fontSize: "0.38rem",
                color: "#ffffff1a",
                lineHeight: 2.8,
                letterSpacing: "0.1em",
              }}>
                ▸ SELECT AN AGENT ABOVE TO OPEN COMMS ◂
              </p>
            </div>
          )}

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
              {AGENTS.map((a) => (
                <div
                  key={a.id}
                  style={{ width: 7, height: 7, backgroundColor: a.color, opacity: 0.5 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}