import PropTypes from "prop-types";
import { AGENTS, P } from "../constants/world";

export default function SquadStatusPanel({ agentStatus, isStacked, showWorld, onToggleWorld, agentConfigs }) {
  return (
    <aside
      style={{
        borderRight: isStacked ? "none" : `1px solid ${P.panelBorder}`,
        borderBottom: isStacked ? `1px solid ${P.panelBorder}` : "none",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div style={{ padding: "16px 14px 10px", borderBottom: `1px solid ${P.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.8rem", color: "#ffe29b" }}>
            SQUAD STATUS
          </div>
          <div style={{ marginTop: 6, fontSize: "11px", color: P.textMuted }}>
            Real-time ops metrics.
          </div>
        </div>
        {!isStacked && (
          <button 
            onClick={onToggleWorld}
            title={showWorld ? "Hide Office World" : "Show Office World"}
            style={{ 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              color: "#f3f7ff", 
              padding: "4px 8px", 
              fontSize: "12px", 
              cursor: "pointer", 
              fontFamily: "'Syne Mono', monospace",
              borderRadius: 4
            }}
          >
            {showWorld ? "CLOSE MAP" : "OPEN MAP"}
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: 12, overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {AGENTS.map((a) => {
            const st = agentStatus[a.id];
            const cfg = agentConfigs[a.id] || {};
            return (
              <div key={a.id} style={{ border: `1px solid ${a.color}33`, background: `${a.color}08`, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, background: a.color }} />
                    <span style={{ fontSize: "13px", color: a.color, fontWeight: 800 }}>{cfg.name || a.name}</span>
                  </div>
                  <span style={{ fontSize: "10px", color: "#8ade9a", background: "#064e3b", padding: "2px 6px", borderRadius: 2 }}>
                    {st.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: 4, fontFamily: "monospace" }}>
                  &gt; {st.activity}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 8, borderTop: "1px solid #ffffff11", paddingTop: 8, opacity: 0.9 }}>
                  <div>
                    <span style={{ fontSize: "10px", color: P.textMuted }}>TOKENS</span><br />
                    <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>{st.tokens}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: P.textMuted }}>COST</span><br />
                    <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>${st.cost.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 24, padding: "12px 4px", borderTop: `1px solid ${P.panelBorder}` }}>
            <div style={{ fontSize: "11px", color: P.textMuted, marginBottom: 4 }}>TOTAL SQUAD OPS</div>
            <div style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "'Press Start 2P', monospace" }}>
              ${Object.values(agentStatus).reduce((acc, s) => acc + s.cost, 0).toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

SquadStatusPanel.propTypes = {
  agentStatus: PropTypes.object.isRequired,
  isStacked: PropTypes.bool.isRequired,
  showWorld: PropTypes.bool.isRequired,
  onToggleWorld: PropTypes.func.isRequired,
  agentConfigs: PropTypes.object.isRequired,
};
