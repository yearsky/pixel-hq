import AgentCard from "./AgentCard";

export default function AgentRoster({ agents, chats, active, onSelect }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 22,
      }}
    >
      {agents.map((a) => {
        const msgCount = Math.floor((chats[a.id]?.length || 0) / 2);
        const isOn = active === a.id;
        return (
          <AgentCard
            key={a.id}
            agent={a}
            msgCount={msgCount}
            isActive={isOn}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
