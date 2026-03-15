import Sprite from "./Sprite";

export default function AgentCard({ agent, msgCount, isActive, onSelect }) {
  return (
    <div
      onClick={() => onSelect(isActive ? null : agent.id)}
      style={{
        border: `2px solid ${isActive ? agent.color : agent.color + "40"}`,
        backgroundColor: isActive ? agent.bg : "#080812",
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.12s, background-color 0.12s",
        animation: isActive ? "slideUp 0.2s ease-out" : undefined,
        "--ac": agent.color,
      }}
    >
      <div
        style={{
          padding: "13px 13px 10px",
          borderBottom: `1px solid ${agent.color}22`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Sprite pattern={agent.icon} color={agent.color} px={9} />
        <div style={{ textAlign: "right" }}>
          <div
            className="blink2"
            style={{
              width: 7,
              height: 7,
              backgroundColor: agent.color,
              marginLeft: "auto",
              marginBottom: 5,
            }}
          />
          <span
            style={{
              fontSize: "0.28rem",
              color: agent.color,
              letterSpacing: "0.1em",
            }}
          >
            READY
          </span>
        </div>
      </div>

      <div style={{ padding: "11px 13px 14px" }}>
        <h3
          style={{
            fontSize: "0.55rem",
            color: agent.color,
            marginBottom: 6,
            letterSpacing: "0.04em",
          }}
        >
          {agent.name}
        </h3>
        <p
          style={{
            fontSize: "0.33rem",
            color: "#ffffff45",
            marginBottom: 5,
            letterSpacing: "0.08em",
          }}
        >
          {agent.role}
        </p>
        <p
          style={{
            fontSize: "0.3rem",
            color: "#ffffff28",
            lineHeight: 1.9,
          }}
        >
          {agent.tagline}
        </p>
      </div>

      {msgCount > 0 && (
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 17,
            height: 17,
            backgroundColor: agent.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.32rem",
            color: "#000",
          }}
        >
          {msgCount}
        </div>
      )}

      {isActive && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: agent.color,
          }}
        />
      )}
    </div>
  );
}
