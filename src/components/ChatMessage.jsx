export default function ChatMessage({ message, agent }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "slideUp 0.15s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: "84%",
          border: isUser ? "1px solid #ffffff18" : `1px solid ${agent.color}38`,
          borderLeft: isUser ? undefined : `3px solid ${agent.color}`,
          backgroundColor: isUser ? "#101020" : agent.bg,
          padding: "9px 13px",
        }}
      >
        {!isUser && (
          <span
            style={{
              display: "block",
              fontSize: "0.3rem",
              color: agent.color,
              marginBottom: 5,
              letterSpacing: "0.1em",
            }}
          >
            [ {agent.name} ]
          </span>
        )}
        <p
          style={{
            fontSize: "0.4rem",
            lineHeight: 2.1,
            color: isUser ? "#c8c8c8" : "#d4d4d4",
            whiteSpace: "pre-wrap",
            margin: 0,
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
