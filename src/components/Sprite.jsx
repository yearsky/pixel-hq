export default function Sprite({ pattern, color, px = 9 }) {
  return (
    <div style={{ display: "inline-block", lineHeight: 0, flexShrink: 0 }}>
      {pattern.map((row, i) => (
        <div key={i} style={{ display: "flex" }}>
          {row.map((on, j) => (
            <div
              key={j}
              style={{
                width: px,
                height: px,
                backgroundColor: on ? color : "transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
