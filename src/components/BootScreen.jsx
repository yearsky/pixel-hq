import { useEffect } from "react";

export default function BootScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete && onComplete();
    }, 1100); // Match the animation duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060610",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      <div style={{ color: "#7B61FF", fontSize: "0.9rem", letterSpacing: "0.08em", marginBottom: 28 }}>
        PIXELFORCE HQ
      </div>
      <div
        style={{
          width: 220,
          height: 6,
          backgroundColor: "#ffffff10",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "#7B61FF",
            animation: "boot 1.1s ease-out forwards",
          }}
        />
      </div>
      <div style={{ color: "#ffffff30", fontSize: "0.38rem", marginTop: 16, letterSpacing: "0.12em" }}>
        LOADING AGENTS...
      </div>
    </div>
  );
}
