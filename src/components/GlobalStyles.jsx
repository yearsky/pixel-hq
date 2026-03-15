export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Syne:wght@400;500;600;700;800&family=Syne+Mono&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /*
        NOTE: html/body background is intentionally NOT set here.
        - LandingPage owns it via useEffect, syncing to the active theme.
        - PixelForceHQ (HQ view) sets it inline on its own wrapper.
        This avoids the "dark sidebar bleed" bug where body color
        shows through the gap created by #root's max-width + margin: auto.
      */

      @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes flicker  { 0%,100%{opacity:1} 92%{opacity:.85} 94%{opacity:1} 97%{opacity:.9} }
      @keyframes slideUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      @keyframes boot     { 0%{width:0} 100%{width:100%} }
      @keyframes gridPan  { from{background-position:0 0} to{background-position:32px 32px} }
      @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.9)} }

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

      .try-btn {
        background: #7B61FF;
        border: none;
        color: #fff;
        font-family: 'Syne', sans-serif;
        font-size: 14px;
        font-weight: 600;
        padding: 14px 28px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.18s, transform 0.12s;
        letter-spacing: 0.02em;
        position: relative;
        overflow: hidden;
      }
      .try-btn::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        transition: left 0.45s;
      }
      .try-btn:hover::before { left: 100%; }
      .try-btn:hover { background: #9B81FF; transform: translateY(-2px); }
      .try-btn:active { transform: translateY(0); }
    `}</style>
  );
}