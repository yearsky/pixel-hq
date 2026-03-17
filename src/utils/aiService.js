/**
 * Utility to handle streaming chat responses from the backend.
 */
export async function streamChatResponse({
  agentId,
  agentName,
  system,
  messages,
  atlassianUrl,
  atlassianPat,
  onToken,
  onStart,
  onEnd,
  onError
}) {
  try {
    if (onStart) onStart();

    const res = await fetch("http://localhost:8080/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "default",
        agentId,
        agentName, // Pass custom name if available
        system, // Dynamically injected soul
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        maxTokens: 2000,
        stream: true,
        atlassianUrl,
        atlassianPat
      }),
    });

    if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    const processChunk = (chunk) => {
      const lines = chunk.split("\n").filter(l => l.trim());
      for (const line of lines) {
        try {
          const ev = JSON.parse(line);
          if (ev.type === "token_delta" && ev.data?.delta) {
            fullContent += ev.data.delta;
            if (onToken) onToken(ev.data.delta, fullContent);
          }
        } catch (e) {
          console.warn("Parse error in stream line", e);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      processChunk(decoder.decode(value, { stream: true }));
    }

    if (onEnd) onEnd(fullContent);
    return fullContent;
  } catch (err) {
    console.error("Stream error:", err);
    if (onError) onError(err);
    throw err;
  }
}
