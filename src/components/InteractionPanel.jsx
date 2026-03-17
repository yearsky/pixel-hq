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
  agentConfigs,
  setAgentConfigs,
  atlassianConfig,
  setAtlassianConfig,
}) {
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAtlassianModal, setShowAtlassianModal] = useState(false);
  const fileInputRef = useRef(null);

  const currentCfg = agentConfigs[activeTarget] || {};
  const isCommander = activeTarget === "commander";

  const updateCfg = (key, val) => {
    setAgentConfigs(prev => ({
      ...prev,
      [activeTarget]: { ...prev[activeTarget], [key]: val }
    }));
  };

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
        <button
          onClick={() => setShowAtlassianModal(true)}
          style={{
            flex: 1.2,
            padding: "14px 6px",
            cursor: "pointer",
            background: "transparent",
            color: atlassianConfig.url && atlassianConfig.pat ? "#34d399" : "#f87171",
            border: "none",
            borderBottom: "3px solid transparent",
            fontSize: "10px",
            fontWeight: 800,
            fontFamily: "'Syne Mono', monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span>ENT</span>
          <span style={{ fontSize: "8px" }}>{atlassianConfig.url ? "ON" : "OFF"}</span>
        </button>
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
            <div style={{ fontSize: "11px", color: P.textMuted, marginBottom: 16, letterSpacing: "0.05em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>SECURE SESSION: {currentCfg.name || activeAgent?.name}</span>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                style={{ background: "none", border: "none", color: showSettings ? activeAgent?.color : P.textMuted, cursor: "pointer", fontSize: "10px", fontWeight: 800 }}
              >
                {showSettings ? "[ CLOSE CONFIG ]" : "[ CONFIG AGENT ]"}
              </button>
            </div>

            {showSettings && (
              <div style={{ marginBottom: 20, padding: 12, background: "#111827", border: `1px solid ${activeAgent?.color}33`, borderRadius: 4 }}>
                <div style={{ fontSize: "10px", color: activeAgent?.color, fontWeight: 800, marginBottom: 8 }}>AGENT IDENTITY CONFIGURATION</div>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: "9px", color: P.textMuted, display: "block", marginBottom: 4 }}>OPERATIONAL CODENAME</label>
                  <input 
                    value={currentCfg.name} 
                    onChange={(e) => updateCfg("name", e.target.value.toUpperCase())}
                    disabled={isCommander}
                    style={{ width: "100%", background: "#030712", border: "1px solid #374151", color: isCommander ? "#4b5563" : "#fff", padding: "6px 8px", fontSize: "12px", fontFamily: "monospace", borderRadius: 2 }}
                  />
                  {isCommander && <span style={{ fontSize: "8px", color: "#4b5563" }}>Commander identity is hardcoded.</span>}
                </div>

                <div>
                  <label style={{ fontSize: "9px", color: P.textMuted, display: "block", marginBottom: 4 }}>BEHAVIORAL SOUL (SYSTEM PROMPT)</label>
                  <textarea 
                    value={currentCfg.system} 
                    onChange={(e) => updateCfg("system", e.target.value)}
                    placeholder={isCommander ? "Commander logic is handled by the backend registry." : "Define how this agent should think and act..."}
                    disabled={isCommander}
                    style={{ width: "100%", height: 80, resize: "none", background: "#030712", border: "1px solid #374151", color: isCommander ? "#4b5563" : "#f1f5f9", padding: "6px 8px", fontSize: "12px", fontFamily: "monospace", borderRadius: 2 }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: "9px", color: "#475569" }}>
                  * Changes are session-only and injected into OpenRouter requests.
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeThread.length === 0 && <div style={{ fontSize: "13px", color: "#475569" }}>Awaiting mission parameters for {currentCfg.name || activeAgent?.name}...</div>}
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
                        {currentCfg.name || activeAgent?.name}
                      </div>
                    )}

                    {/* Content or typing animation */}
                    {isWaitingForFirstToken ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", color: activeAgent?.color }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                        <span style={{ fontSize: "11px", fontStyle: "italic", opacity: 0.8 }}>
                          {agentStatus[activeTarget]?.activity === "Idling around" ? "Thinking..." : agentStatus[activeTarget]?.activity}
                        </span>
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
                        {!isUser && (displayContent.includes("SETUP_REQUIRED") || 
                          displayContent.includes("CONFIG_REQUIRED") || 
                          (displayContent.toLowerCase().includes("atlassian credentials") && displayContent.toLowerCase().includes("config"))) && (
                          <button
                            onClick={() => setShowAtlassianModal(true)}
                            style={{
                              marginTop: 12,
                              background: "rgba(59, 130, 246, 0.15)",
                              border: "1px solid #3b82f6",
                              color: "#60a5fa",
                              padding: "8px 16px",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                              borderRadius: 4,
                              fontFamily: "'Syne Mono', monospace",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              transition: "all 0.2s",
                              boxShadow: "0 0 10px rgba(59, 130, 246, 0.2)"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(59, 130, 246, 0.3)";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            ⚡ [ SETTING KREDENSIAL ]
                          </button>
                        )}
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
                          const tagCfg = agentConfigs[tag] || {};
                          return a ? (
                            <span key={tag} style={{ fontSize: "10px", padding: "2px 8px", background: `${a.color}22`, border: `1px solid ${a.color}66`, color: a.color, borderRadius: 12 }}>
                              ⚡ {tagCfg.name || a.name} dispatched
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
              placeholder={isUploading ? "Uploading & Parsing..." : `Communicate with ${currentCfg.name || activeAgent?.name}...`}
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
      {/* ATLASSIAN MODAL */}
      {showAtlassianModal && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            width: "100%",
            maxWidth: 320,
            background: "#0f172a",
            border: `2px solid #3b82f6`,
            padding: 20,
            borderRadius: 8,
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#3b82f6" }}>ATLASSIAN ENTERPRISE</div>
              <button onClick={() => setShowAtlassianModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: 6 }}>JIRA/CONFLUENCE URL</label>
                <input 
                  placeholder="https://your-domain.atlassian.net"
                  value={atlassianConfig.url}
                  onChange={(e) => setAtlassianConfig(prev => ({ ...prev, url: e.target.value }))}
                  style={{ width: "100%", background: "#030712", border: "1px solid #334155", color: "#fff", padding: "10px", fontSize: "12px", borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: 6 }}>PERSONAL ACCESS TOKEN (PAT)</label>
                <input 
                  type="password"
                  placeholder="Bearer token or PAT"
                  value={atlassianConfig.pat}
                  onChange={(e) => setAtlassianConfig(prev => ({ ...prev, pat: e.target.value }))}
                  style={{ width: "100%", background: "#030712", border: "1px solid #334155", color: "#fff", padding: "10px", fontSize: "12px", borderRadius: 4 }}
                />
              </div>

              <div style={{ fontSize: "9px", color: "#475569", lineHeight: 1.4 }}>
                * Credentials are saved locally in your browser and sent to the agent bridge for tool execution.
              </div>

              <button 
                onClick={() => setShowAtlassianModal(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#3b82f6",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: "none",
                  borderRadius: 4,
                }}
              >
                SAVE & SYNC CREDENTIALS
              </button>
            </div>
          </div>
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
  agentConfigs: PropTypes.object.isRequired,
  setAgentConfigs: PropTypes.func.isRequired,
  atlassianConfig: PropTypes.object.isRequired,
  setAtlassianConfig: PropTypes.func.isRequired,
};
