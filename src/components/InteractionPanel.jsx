import PropTypes from "prop-types";
import { useState, useRef } from "react";
import { AGENTS, P } from "../constants/world";
import { renderMarkdown } from "../utils/renderMarkdown";

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
  feedTopRef,
  feedEndRef,
  threadEndRef,
}) {
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/api/document/extract", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAttachedFile({
        name: data.filename,
        content: data.content,
      });
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to extract text from document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    sendMission(attachedFile);
    setAttachedFile(null);
  };
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
              <div ref={feedTopRef} />
              {agentFeed.length === 0 && <div style={{ fontSize: "13px", color: "#475569" }}>Initializing encrypted feed...</div>}
              {agentFeed.map((f) => (
                <div key={f.id} style={{ borderLeft: `3px solid ${f.color}`, paddingLeft: 12, background: "rgba(255,255,255,0.02)", padding: "8px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "11px", color: f.color, fontWeight: 800 }}>{f.speaker}</span>
                    <span style={{ fontSize: "10px", color: "#475569" }}>{f.time}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#f1f5f9", lineHeight: 1.5 }}>
                    {f.speaker === "USER" || f.speaker.startsWith("COMMANDER →") ? f.text : renderMarkdown(f.text)}
                  </div>
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
                const agentCurrentStatus = agentStatus[activeTarget]?.status;
                const isTyping = isLast && m.role === "assistant" && (agentCurrentStatus === "responding" || agentCurrentStatus === "thinking");
                const isUser = m.role === "user";

                const assignTags = m.role === "assistant" ? [...m.content.matchAll(/\[ASSIGN:(scribe|amplifier|registry)\]/gi)].map((x) => x[1]) : [];
                const displayContent = m.role === "assistant" ? m.content.replaceAll(/\[ASSIGN:(scribe|amplifier|registry)\][^[\]\n]*/gi, "").trim() : m.content;

                const isWaitingForFirstToken = isTyping && displayContent.trim() === "";

                return (
                  <div
                    key={`${m.role}-${i}`}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      width: isUser ? "fit-content" : "100%",
                      maxWidth: isUser ? "82%" : "100%",
                      background: isUser ? "#1e293b" : "transparent",
                      border: isUser ? "1px solid #334155" : "none",
                      borderLeft: isUser ? undefined : `3px solid ${activeAgent?.color}44`,
                      padding: isUser ? "8px 12px 6px 12px" : "10px 0 10px 14px",
                      borderRadius: isUser ? "12px 2px 12px 12px" : 0,
                      boxShadow: isUser ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                    }}
                  >
                    {/* Name label (Agents only) */}
                    {!isUser && (
                      <div style={{ fontSize: "10px", color: activeAgent?.color, fontWeight: 800, marginBottom: 6, textTransform: "uppercase" }}>
                        {activeAgent?.name}
                      </div>
                    )}

                    {/* Content or typing animation */}
                    {isWaitingForFirstToken ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0", color: activeAgent?.color }}>
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#f1f5f9", lineHeight: 1.6, whiteSpace: isUser ? "pre-wrap" : undefined }}>
                        {isUser && m.fileName && (
                          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, background: "#0f172a", padding: "8px 12px", borderRadius: 8, border: "1px solid #1e293b", width: "fit-content" }}>
                            <span style={{ fontSize: "16px" }}>📄</span>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attachment</span>
                              <span style={{ fontSize: "12px", color: "#f1f5f9" }}>{m.fileName}</span>
                            </div>
                          </div>
                        )}
                        {isUser ? displayContent : renderMarkdown(displayContent)}
                        {isTyping && (
                          <span className="blink" style={{ color: activeAgent?.color, marginLeft: 2, fontWeight: "bold" }}>
                            ▮
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timestamp at the bottom */}
                    {m.ts && (
                      <div style={{ marginTop: isUser ? 2 : 6, textAlign: isUser ? "right" : "left" }}>
                        <span style={{ fontSize: "9px", color: isUser ? "#64748b" : "#334155" }}>
                          {new Date(m.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: isUser ? undefined : "2-digit" })}
                        </span>
                      </div>
                    )}

                    {/* Dispatch tags */}
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
          {attachedFile && (
            <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8, background: "#1e293b", padding: "6px 10px", borderRadius: 6, border: "1px solid #334155" }}>
              <span style={{ fontSize: "14px" }}>📎</span>
              <span style={{ fontSize: "12px", color: "#f1f5f9", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachedFile.name} (Ready)</span>
              <button
                onClick={() => setAttachedFile(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ position: "relative" }}>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isUploading ? "Uploading & Parsing..." : `Communicate with ${activeAgent?.name}...`}
              disabled={isUploading}
              style={{
                width: "100%",
                height: 80,
                resize: "none",
                background: "#030712",
                border: "1px solid #374151",
                color: "#f9fafb",
                padding: "10px 42px 10px 12px", // Extra right padding for paperclip
                fontSize: "14px",
                fontFamily: "'Syne Mono', monospace",
                outline: "none",
                borderRadius: 4,
                opacity: isUploading ? 0.6 : 1,
              }}
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              hidden
              accept=".pdf,.txt,.md,.csv"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || loading}
              title="Attach Document (PDF, TXT, CSV, MD)"
              style={{
                position: "absolute",
                right: 12,
                top: 10,
                background: "none",
                border: "none",
                color: P.textMuted,
                cursor: "pointer",
                padding: "4px",
                fontSize: "18px",
                opacity: (isUploading || loading) ? 0.5 : 1,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = activeAgent?.color)}
              onMouseLeave={(e) => (e.target.style.color = P.textMuted)}
            >
              📎
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={(!userInput.trim() && !attachedFile) || loading || isUploading}
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
              opacity: (!userInput.trim() && !attachedFile) || loading || isUploading ? 0.4 : 1,
            }}
          >
            {isUploading ? "UPLOADING..." : loading ? "PROCESSING ENGINE..." : "EXECUTE COMMAND"}
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
  feedTopRef: PropTypes.object,
  feedEndRef: PropTypes.object,
  threadEndRef: PropTypes.object,
};
