import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import Sprite from "./Sprite";

export default function ChatPanel({
  agent,
  msgs,
  input,
  setInput,
  loading,
  onSend,
  onClose,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  return (
    <div
      style={{
        border: `2px solid ${agent.color}`,
        backgroundColor: "#07070f",
        display: "flex",
        flexDirection: "column",
        height: 460,
        animation: "slideUp 0.2s ease-out",
        "--ac": agent.color,
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: `1px solid ${agent.color}28`,
          backgroundColor: agent.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Sprite pattern={agent.icon} color={agent.color} px={8} />
          <div>
            <h2
              style={{
                fontSize: "0.6rem",
                color: agent.color,
                marginBottom: 4,
              }}
            >
              {agent.name}
            </h2>
            <p style={{ fontSize: "0.32rem", color: "#ffffff38" }}>
              {agent.role} · PixelForce HQ
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.3rem", color: "#ffffff28" }}>
            {msgs.length > 0
              ? `${Math.floor(msgs.length / 2)} exchange${Math.floor(msgs.length / 2) !== 1 ? "s" : ""}`
              : "NEW SESSION"}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #ffffff18",
              color: "#ffffff50",
              padding: "5px 9px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "0.38rem",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {msgs.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "36px 20px",
              textAlign: "center",
            }}
          >
            <Sprite pattern={agent.icon} color={agent.color} px={18} />
            <p
              style={{
                fontSize: "0.48rem",
                color: agent.color,
                marginTop: 22,
                marginBottom: 8,
                letterSpacing: "0.08em",
              }}
            >
              {agent.name} STANDING BY
            </p>
            <p style={{ fontSize: "0.33rem", color: "#ffffff22" }}>
              Assign a mission below...
            </p>
          </div>
        )}

        {msgs.map((m, i) => (
          <ChatMessage key={i} message={m} agent={agent} />
        ))}

        {loading && (
          <div style={{ display: "flex" }}>
            <div
              style={{
                border: `1px solid ${agent.color}38`,
                borderLeft: `3px solid ${agent.color}`,
                backgroundColor: agent.bg,
                padding: "9px 13px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.3rem",
                  color: agent.color,
                  marginBottom: 5,
                }}
              >
                [ {agent.name} ]
              </span>
              <span className="blink" style={{ fontSize: "0.4rem", color: agent.color }}>
                ▌ PROCESSING...
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${agent.color}28`,
          backgroundColor: "#050510",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "0.52rem", color: agent.color, flexShrink: 0 }}>▸</span>
        <input
          className="pixel-input"
          style={{ "--ac": agent.color }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          placeholder="TYPE YOUR MISSION..."
        />
        <button
          onClick={onSend}
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
        >
          SEND
        </button>
      </div>
    </div>
  );
}
