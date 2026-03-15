export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { background: #060610; }

      @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes march   { to { background-position: 16px 0; } }
      @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:.85} 94%{opacity:1} 97%{opacity:.9} }
      @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      @keyframes boot    { 0%{width:0} 100%{width:100%} }

      .blink  { animation: blink   1s step-end infinite; }
      .blink2 { animation: blink 1.4s step-end infinite; }
      .flick  { animation: flicker 6s ease-in-out infinite; }

      ::-webkit-scrollbar       { width: 5px; }
      ::-webkit-scrollbar-track { background: #0a0a18; }
      ::-webkit-scrollbar-thumb { background: #ffffff25; }

      .pixel-input {
        background: none;
        border: 1px solid #ffffff1a;
        color: #e0e0e0;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.4rem;
        padding: 9px 12px;
        transition: border-color 0.15s;
        outline: none;
        width: 100%;
      }
      .pixel-input:focus { border-color: var(--ac); }
      .pixel-input::placeholder { color: #ffffff22; }
    `}</style>
  );
}
