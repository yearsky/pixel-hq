import PropTypes from "prop-types";
import { AGENTS, P } from "../constants/world";

export default function InteractionPanel({
  isStacked,
  activeTab,
  setActiveTab,
  setActiveTarget,
  setSelectedId,
  agentFeed,
  activeThread,
  activeAgent,
  agentStatus,
  activeTarget,
  userInput,
  setUserInput,
  sendMission,
  loading,
  feedContainerRef,
  threadContainerRef,
  feedEndRef,
  threadEndRef,
}) {
  return (
    <aside
      style={{
        borderLeft: isStacked ? "none" : `1px solid ${P.panelBorder}`,
        borderTop: isStacked ? `1px solid ${P.panelBorder}` : "none",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* TABS HEADER */}
      <div style={{ display: "flex", borderBottom: `1px solid ${P.panelBorder}`, background: "#161e35" }}>
        <button
          onClick={() => setActiveTab("feed")}
          style={{
            flex: 1.5,
            padding: "14px 6px",
            cursor: "pointer",
            background: activeTab === "feed" ? "#222c4a" : "transparent",
            color: activeTab === "feed" ? "#fff" : "#718096",
            border: "none",
            borderBottom: activeTab === "feed" ? "3px solid #60a5fa" : "3px solid transparent",
            fontSize: "13px",
            fontWeight: 800,
            fontFamily: "'Syne Mono', monospace",
            transition: "all 0.2s",
          }}
        >
          FEED
        </button>
        {AGENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setActiveTab(a.id);
              setActiveTarget(a.id);
              setSelectedId(a.id);
            }}
            style={{
              flex: 1,
              padding: "14px 6px",
              cursor: "pointer",
              background: activeTab === a.id ? `${a.color}22` : "transparent",
              color: activeTab === a.id ? a.color : "#718096",
              border: "none",
              borderBottom: activeTab === a.id ? `3px solid ${a.color}` : "3px solid transparent",
              fontSize: "13px",
              fontWeight: 800,
              fontFamily: "'Syne Mono', monospace",
              transition: "all 0.2s",
            }}
          >
            {a.id[0].toUpperCase()}
          </button>
        ))}
      </div>

      {/* CHAT CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0a0d18" }}>
        {activeTab === "feed" ? (
          <div ref={feedContainerRef} style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
            <div style={{ fontSize: "11px", color: P.textMuted, marginBottom: 12, letterSpacing: "0.05em" }}>GLOBAL BROADCAST CHANNEL</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {agentFeed.length === 0 && <div style={{ fontSize: "13px", color: "#475569" }}>Initializing encrypted feed...</div>}
              {agentFeed.map((f) => (
                <div key={f.id} style={{ borderLeft: `3px solid ${f.color}`, paddingLeft: 12, background: "rgba(255,255,255,0.02)", padding: "8px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "11px", color: f.color, fontWeight: 800 }}>{f.speaker}</span>
                    <span style={{ fontSize: "10px", color: "#475569" }}>{f.time}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#f1f5f9", lineHeight: 1.5 }}>{f.text}</div>
                </div>
              ))}
              <div ref={feedEndRef} />
            </div>
          </div>
        ) : (
          <div ref={threadContainerRef} style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
            <div style={{ fontSize: "11px", color: P.textMuted, marginBottom: 16, letterSpacing: "0.05em" }}>SECURE SESSION: {activeAgent?.name}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeThread.length === 0 && <div style={{ fontSize: "13px", color: "#475569" }}>Awaiting mission parameters for {activeAgent?.name}...</div>}
              {activeThread.map((m, i) => {
                const isLast = i === activeThread.length - 1;
                const isTyping = isLast && m.role === "assistant" && agentStatus[activeTarget]?.status === "responding";
                const isUser = m.role === "user";

                const assignTags = m.role === "assistant" ? [...m.content.matchAll(/\[ASSIGN:(scribe|amplifier|registry)\]/gi)].map((x) => x[1]) : [];
                const displayContent = m.role === "assistant" ? m.content.replaceAll(/\[ASSIGN:(scribe|amplifier|registry)\][^[\]\n]*/gi, "").trim() : m.content;

                return (
                  <div
                    key={`${m.role}-${i}`}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "90%",
                      background: isUser ? "#1e293b" : "#111827",
                      border: isUser ? "1px solid #334155" : `1px solid ${activeAgent?.color}33`,
                      padding: "10px 14px",
                      borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: isUser ? "#94a3b8" : activeAgent?.color, fontWeight: 800, marginBottom: 6, textTransform: "uppercase" }}>{isUser ? "YOU" : activeAgent?.name}</div>
                    <div style={{ fontSize: "14px", color: "#f1f5f9", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {displayContent}
                      {isTyping && (
                        <span className="blink" style={{ color: activeAgent?.color, marginLeft: 2, fontWeight: "bold" }}>
                          ▮
                        </span>
                      )}
                    </div>
                    {assignTags.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {assignTags.map((tag) => {
                          const a = AGENTS.find((ag) => ag.id === tag);
                          return a ? (
                            <span key={tag} style={{ fontSize: "10px", padding: "2px 8px", background: `${a.color}22`, border: `1px solid ${a.color}66`, color: a.color, borderRadius: 12 }}>
                              ⚡ {a.name} dispatched
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      {activeTab !== "feed" && (
        <div style={{ padding: 16, borderTop: `1px solid ${P.panelBorder}`, background: "#111827" }}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMission();
              }
            }}
            placeholder={`Communicate with ${activeAgent?.name}...`}
            style={{
              width: "100%",
              height: 70,
              resize: "none",
              background: "#030712",
              border: "1px solid #374151",
              color: "#f9fafb",
              padding: "10px 12px",
              fontSize: "14px",
              fontFamily: "'Syne Mono', monospace",
              outline: "none",
              borderRadius: 4,
            }}
          />
          <button
            onClick={sendMission}
            disabled={!userInput.trim() || loading}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "12px",
              background: activeAgent?.color,
              color: "#000",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              borderRadius: 4,
              transition: "all 0.2s",
              opacity: !userInput.trim() || loading ? 0.4 : 1,
            }}
          >
            {loading ? "PROCESSING ENGINE..." : "EXECUTE COMMAND"}
          </button>
        </div>
      )}
    </aside>
  );
}

InteractionPanel.propTypes = {
  isStacked: PropTypes.bool.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  setActiveTarget: PropTypes.func.isRequired,
  setSelectedId: PropTypes.func.isRequired,
  agentFeed: PropTypes.array.isRequired,
  activeThread: PropTypes.array.isRequired,
  activeAgent: PropTypes.object,
  agentStatus: PropTypes.object.isRequired,
  activeTarget: PropTypes.string.isRequired,
  userInput: PropTypes.string.isRequired,
  setUserInput: PropTypes.func.isRequired,
  sendMission: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  feedContainerRef: PropTypes.object,
  threadContainerRef: PropTypes.object,
  feedEndRef: PropTypes.object,
  threadEndRef: PropTypes.object,
};
