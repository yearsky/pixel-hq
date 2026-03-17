# 🎨 DESIGN_GUIDELINES.md — PixelForce HQ

> Visual language reference and coding standards derived from the RPG office world aesthetic.
> Every decision in this document traces back to a deliberate reason — not just "what looks good"
> but "why it communicates the right thing."

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Visual Language: The RPG Office World](#visual-language-the-rpg-office-world)
   - [Color Palette](#color-palette)
   - [Typography](#typography)
   - [Spatial Layout](#spatial-layout)
   - [Outdoor vs Indoor](#outdoor-vs-indoor)
   - [Furniture Design Principles](#furniture-design-principles)
   - [Character Design](#character-design)
   - [Status & Feedback System](#status--feedback-system)
3. [The Two-World Rule](#the-two-world-rule)
4. [System Roster Panel](#system-roster-panel)
5. [Animation Principles](#animation-principles)
6. [Coding Standards](#coding-standards)
   - [Architecture Patterns](#architecture-patterns)
   - [Canvas Best Practices](#canvas-best-practices)
   - [React + RAF Coexistence](#react--raf-coexistence)
   - [State Ownership Rules](#state-ownership-rules)
   - [Drawing Functions](#drawing-functions)
   - [Naming Conventions](#naming-conventions)
   - [Performance Rules](#performance-rules)
7. [Do and Don't Reference](#do-and-dont-reference)

---

## Design Philosophy

PixelForce HQ communicates one core idea through everything it draws: **AI agents are colleagues, not tools**. This shapes every visual decision. A tool has a form — a text input, a button, a response box. A colleague has a presence — a room they inhabit, a posture, a status, a name visible across the office floor.

The RPG office aesthetic was chosen deliberately because the top-down RPG genre has a 30-year visual vocabulary for communicating exactly this: characters as entities with locations, roles, and states. When a player sees a character standing at a desk in an RPG, they intuitively understand that the character has a purpose, an identity, and an activity. We borrow that intuition to make AI agents feel situated and real.

Everything in this document serves that goal. The warm palette makes the world feel inhabited rather than sterile. The monospace fonts make agent labels feel like system output, not UI chrome. The speech bubbles tie processing state to the character rather than to an abstract loading indicator. The status badges create at-a-glance situational awareness — just like glancing across a real office.

---

## Visual Language: The RPG Office World

### Color Palette

The palette is divided into three functional groups: the outdoor world, the indoor world, and the UI layer. These groups should never bleed into each other.

**Outdoor palette — living, organic, warm greens**

The outside world uses only natural earth and plant tones. Trees use a five-value foliage stack that creates depth illusion on a flat surface. The rule is that outdoor colors should never appear inside a room, and indoor colors should never appear outside.

```
Grass base:     #5a9940    Used for the main grass fill
Grass dark:     #4a8930    Used for checkerboard alternation on grass tiles
Grass highlight:#6aaa50    Used only on tree top highlights, never on flat ground

Tree dark:      #1e6b10    Outermost foliage ring — always darkest
Tree mid:       #2d8a1c    Second foliage ring
Tree light:     #3aaa28    Third foliage ring
Tree highlight: #50bb3a    Top highlight spot — only a small arc, not the whole crown

Trunk dark:     #5a3800    Shadow side of trunk
Trunk light:    #7a5010    Light side of trunk

Path fill:      #c8b898    Corridor/pathway between rooms
Path dark:      #b8a888    Checkerboard alternation on path tiles
```

**Indoor palette — warm wood, functional neutrals, distinct per room**

Each room has its own floor color pair used for checkerboard tiling. The rule is that no two adjacent rooms share the same floor family. This makes room boundaries immediately legible even without explicit wall labels.

```
Wood floor:       #c49a6a / #b08858    Commander — authority, warmth
Green carpet:     #6a9060 / #5a8050    Scribe — calm, creative
Grey-blue carpet: #9898b2 / #8484a0    Amplifier — energetic, modern
Tile floor:       #d8d0bc / #c8c0ac    Registry — clean, systematic

Wall cream:       #d8c8a4              Commander and Amplifier rooms
Wall light:       #ede0c0              Scribe room — slightly brighter, more open
Wall shadow:      #c0b090              Registry room — slightly cooler, more formal

Desk brown:       #8b5e30              All desks — consistent material language
Desk light:       #a07040              Desk surface highlight

Chair green:      #4a7040              Accent chairs (Scribe, Amplifier conference)
Chair dark:       #3a6030              Chair dark edge
```

**The accent color rule.** Each agent has one accent color — gold, teal, red, or blue. That accent color appears in exactly four places: the agent's sprite body/shirt, the room's accent detail line (the inner wall highlight), the name tag above the character, and the UI elements associated with that agent in the System Roster. Using the accent in more places dilutes its signal value. Using it in fewer places makes the character feel unanchored from the world.

```
COMMANDER accent:  #FFD700   Gold — authority, leadership
SCRIBE accent:     #00E5A0   Teal — creativity, freshness
AMPLIFIER accent:  #FF6B6B   Coral red — energy, urgency
REGISTRY accent:   #60A5FA   Blue — reliability, precision
```

### Typography

Two fonts are used across the entire platform, each with a strict domain.

`Press Start 2P` is the pixel font — the visual signature of the world. It is used for all canvas labels (name tags, status badges, room labels), all HQ UI text (the top bar, the System Roster headers), and all chat interface text inside the world view. It should never appear on the landing page. The key rule: use it at `5px` or `6px` on canvas for labels, and in `rem` units for React UI text where the values `0.22rem` through `0.6rem` are the defined range.

`Syne` is the modern editorial font — it belongs exclusively to the landing page. Syne Bold 800 is for the hero headline. Syne Regular 400 is for body text. `Syne Mono` is for small code-style labels (the version badge, the monospace subtitle lines). Once the user clicks "Launch the HQ", Syne disappears entirely. The two fonts should never coexist on the same screen.

**Font size scale for canvas labels** (these are the only permitted sizes):

```
5px monospace   — name tags, status badge text, room labels, terminal lines
6px monospace   — section headers within canvas (e.g. "TACTICAL MAP")
4px monospace   — sub-labels within furniture (keyboard labels, file drawer text)
```

### Spatial Layout

The office world is a 60×44 tile grid. A tile is 14 logical pixels (`T = 14`). The layout principle is a 2×2 grid of rooms separated by a cross-shaped corridor — a vertical gap at columns 28–31 and a horizontal gap at rows 21–23.

The corridor gap serves three functions. First, it gives characters a traversable buffer between rooms, which is never used today but supports future corridor-walking behavior. Second, it creates visual breathing room that makes each room feel like a distinct space rather than a quadrant of one large map. Third, it anchors the center of the world — the intersection of the two corridors is the logical "HQ center" where a future shared space (lobby, meeting room, bulletin board) could be placed.

Walls are drawn two tiles thick on the north and west sides of each room, and one tile thick on the south and east sides. This creates a subtle pseudo-isometric depth effect: north/west walls appear as the "back" face of a 3D room, while south/east walls are the "front" threshold. It is not true isometric, but the asymmetry reads as depth to the eye.

Room corners always have a 5×5 pixel accent dot in the room's accent color. This is a small detail that serves a clear purpose: it ties the wall material to the agent's identity, and it creates a consistent visual grammar that signals "this is where a room begins."

### Outdoor vs Indoor

The boundary between outdoor and indoor is one of the most important visual signals in the world. It must be immediately readable. The rules:

The outdoor strip is exactly 3 tiles wide on the top and bottom edges, and 1 tile wide on the left and right edges. Trees are placed exclusively in these strips. Flowers are placed within the strips and in the vertical corridor between the left and right room pairs, never inside a room. Bushes appear in the vertical corridor, softening the transition between the two room columns.

Never place any outdoor element (grass, tree, flower, bush) inside a room boundary. Never place any indoor furniture (desk, chair, shelf) outside a room boundary. The contrast between the warm green outdoors and the warm cream indoors is what makes the rooms feel like destinations.

The path tiles in the horizontal corridor use a different texture from the grass — a sandy cream (`#c8b898`) that reads as an interior-style floor while still being clearly a transition zone, not a room.

### Furniture Design Principles

Furniture communicates identity. Before drawing any piece of furniture, ask: what does this object tell you about the person who works here? The filing cabinets in Registry tell you the person is systematic and values organization. The energy drinks in Amplifier tell you the person works fast and doesn't slow down for comfort. The typewriter-era writing desk in Scribe tells you the person is in love with the craft of words, not just the output.

Every room must have four furniture archetypes: a primary work surface (desk or table), a seating element (chair or chairs), a north-wall display (map, whiteboard, TV, clock), and storage (bookshelf, cabinet, cork board). These four archetypes create visual balance and narrative completeness — a room without seating doesn't feel like a workspace, a room without a north-wall display lacks a focal point.

Furniture is drawn using flat-fill pixel rectangles with a 1-pixel border in a darker shade of the same hue. Do not use drop shadows, gradients, or anti-aliasing on any furniture element. The flatness is what makes the aesthetic cohesive — any blending would make it feel like two different art styles colliding.

Detail items (papers on a desk, books on a shelf, a nameplate, a trophy) should use the room's accent color sparingly. One or two accent-colored detail items per room is the maximum — more than that and the accent loses its signal value.

### Character Design

Characters are 8 pixels wide by 13 pixels tall, rendered at 3× scale (24×39 canvas pixels). This size was chosen deliberately: large enough to read clearly on the canvas, small enough to feel like they occupy the office rather than dominate it.

The sprite palette uses 5 color indices. Index 1 (body/shirt) maps to the agent's accent color. Index 2 (skin) and index 3 (hair) are unique to each agent. Index 4 (dark outline/shadow) is always `#2a1800`. Index 5 (pants) is always `#3a2e60`. This constrained palette means two things: every character is immediately identifiable by their shirt color, and every character belongs to the same visual family.

There are three sprite frames: `idle`, `wA` (walk frame A, left foot forward), and `wB` (walk frame B, right foot forward). Right-facing movement uses the canvas mirror transform (`ctx.scale(-1, 1)`) applied to the left-facing frames — never a separate sprite. This keeps the sprite definition compact and ensures visual consistency.

A character ground shadow is drawn as a dark ellipse beneath each sprite, offset slightly toward the south. This tiny detail does outsized work: it anchors characters to the floor and prevents the floating-on-nothing problem that plagues top-down pixel art.

### Status & Feedback System

The status system is the most important feedback mechanism in the world. It communicates agent state without requiring the user to look at the System Roster panel.

Each character carries three stacked visual layers above their head, from top to bottom: the name tag (always visible, colored in the agent's accent), the status badge (always visible, color changes with status), and the speech bubble (only visible during the `thinking` state).

Status badge color is semantic and consistent:

```
RESTING   →  grey text (#909098) on dark grey bg (#222230)   — neutral, not urgent
MOVING    →  blue text (#60A5FA) on dark blue bg (#0a2040)   — active, transitional
THINKING  →  purple text (#a78bfa) on dark purple bg (#2e1060) — processing, cognitive load
ACTIVE    →  green text (#34d399) on dark green bg (#052820)  — responding, alive
```

The speech bubble only appears during `thinking`. It says "Thinking..." and has a white fill with a tail pointing down toward the character. The bubble disappears the moment the API response arrives. This mirrors how humans signal deep thought — you stop moving and you visibly pause — which is why the agent also freezes in place during this state.

Never show a speech bubble during `idle`, `moving`, or `responding`. The bubble is a focused signal. If it appeared in multiple states it would become noise.

---

## The Two-World Rule

The most important design principle in PixelForce HQ is that the platform has exactly two visual worlds that must never bleed into each other.

**World 1 — The Landing Page** is modern, editorial, and Syne-typed. It uses dark backgrounds (`#060610`) in dark mode and light cream (`#f8f9fa`) in light mode. It has no pixel art, no `Press Start 2P` font, and no game UI conventions. It communicates sophistication and product quality to a user who may be encountering the platform for the first time. Its job is to explain what PixelForce HQ is and invite the user in.

**World 2 — The Office World** is retro, warm, and pixel-typed. It uses the canvas with RPG office aesthetics. It has no Syne font, no smooth gradients, and no landing-page conventions. Its job is to make the AI agents feel alive and situated.

The transition between these worlds is the boot screen — a brief pixel animation that acts as a "portal" between aesthetic registers. This transition matters because it gives the user a moment to mentally shift modes. Without it, the jump from modern landing page to pixel world would feel jarring.

When adding new UI elements, the first question must always be: which world does this belong to? A feature added to the wrong world — for example, a smooth gradient button inside the HQ, or a pixel font on the landing page — will read as a visual error even to users who cannot articulate why.

---

## System Roster Panel

The System Roster is the bridge between the two worlds. It sits on the right side of the HQ view, using a dark theme (`#0a0a14` background) that feels like a monitoring dashboard rather than a game UI. It deliberately does not use the warm palette of the canvas world — it uses muted purples, greens, and blues that read as "system" rather than "environment."

The Roster communicates four things per agent: identity (name + accent color dot), status (badge with semantic color), activity (current terminal-style command line), and resource usage (token progress bar + cost).

The progress bar uses two colors in a single bar: green for input tokens and purple for output tokens. This dual-color approach mirrors professional monitoring tools (like the reference screenshot's Anthropic console) and communicates that the two token types have different costs and implications. The bar starts empty and fills as the agent accumulates usage across the session.

The terminal-style activity line (`CMD> Idling...`, `CMD> Processing request...`) uses the font at its smallest permitted size (`0.26rem`). The `CMD>` prefix is not decorative — it signals that this is a machine output, not a human message, which helps users correctly interpret it as system status rather than agent speech.

---

## Animation Principles

Animation in PixelForce HQ follows three rules: purpose, restraint, and consistency.

**Purpose** means every animation communicates something. The walk cycle communicates that agents are active entities with autonomous behavior. The sprite frame switch communicates forward motion. The status badge color change communicates an event (a request was received). No animation exists purely as decoration.

**Restraint** means the minimum animation necessary. There are only three moving elements in the world at any time: the agent walk cycle (frame alternation every 12 ticks), the blinking dot in the HQ header, and the status badge transition when an agent goes from idle to thinking. That's it. More animation would make the scene feel noisy and would actually reduce the communicative value of each animation.

**Consistency** means animation parameters are defined as constants, not scattered magic numbers. Frame duration is `FDUR = 12` ticks. Walk speed is `1.0` units per tick. Idle duration before picking a new target is `80–240` ticks (randomly distributed to prevent all agents from walking synchronously). These values can be tuned in one place.

The walk animation alternates between two frames (`wA` and `wB`) at the `FDUR` interval. An agent walking 30 pixels per second at 60fps changes frame approximately every 3–4 steps, which matches the natural pace of human walking animation in 8-bit games. This is not accidental — the reference material for this aesthetic is the SNES-era RPG, where character walk cycles were refined over years of player testing.

---

## Coding Standards

### Architecture Patterns

PixelForce HQ uses a strict three-layer architecture. Understanding the layer each piece of code belongs to prevents the most common class of bugs in this codebase.

**Layer 1 — Game state** is everything that changes at animation frequency (60fps). Agent x/y position, walk frame index, idle timer countdown, direction. This layer lives exclusively in `gameRef.current` — a plain JavaScript object in a `useRef`. It never touches React. It is read and written by the RAF loop only. Nothing outside the RAF loop should write to `gameRef`.

**Layer 2 — UI event state** is everything that changes at user-interaction frequency (a few times per minute). Which agent is selected, what the current status is, the chat message history. This layer lives in React `useState`. It is written by event handlers (click, keyboard) and API response callbacks. It is never written by the RAF loop.

**Layer 3 — Rendering** is the RAF loop itself. It reads from both Layer 1 and Layer 2 (via refs), produces pixel output on the canvas, and schedules the next frame. It writes to Layer 1 (updating positions) but never to Layer 2 (never calls `setState`).

Any code that violates these layer boundaries — for example, an event handler that writes to `gameRef`, or the RAF loop calling `setState` — is a bug waiting to happen.

### Canvas Best Practices

The canvas `getContext("2d")` call is made inside the loop on every frame. This is intentional: `getContext` on an already-initialized context returns the cached context object, so there is no performance cost. The alternative — caching the context in a ref — creates a subtle bug where the cached context can become stale after a canvas resize. Getting it fresh each frame is the safe pattern.

Always call `ctx.save()` and `ctx.restore()` around any transform operations (`translate`, `scale`, `rotate`). Never manually undo a transform by applying the inverse — this accumulates floating point error. The save/restore stack is exactly what it exists for.

Set `imageRendering: "pixelated"` on the canvas CSS. Without this, browsers will apply bilinear interpolation when the canvas is scaled to fill its container, which blurs the pixel art. Pixelated rendering uses nearest-neighbor interpolation, which preserves crisp edges.

```css
canvas {
  image-rendering: pixelated;   /* Chrome, Edge, Opera */
  image-rendering: crisp-edges; /* Firefox (also add this for compatibility) */
}
```

Always set `ctx.textAlign = "left"` after any use of `ctx.textAlign = "center"`. Forgetting to reset text alignment after drawing a centered label is one of the most common sources of mysterious text positioning bugs in this codebase, because canvas text alignment is a persistent state — it affects all subsequent `fillText` calls until explicitly reset.

### React + RAF Coexistence

The core challenge in this codebase is making React and `requestAnimationFrame` cooperate without interfering with each other. The rules below prevent the entire class of bugs that arise from their interaction.

**Populate refs synchronously, not via `useEffect`.** Any ref that the RAF loop reads must be initialized to its non-empty default value inside the `useState` initializer function, not a `useEffect`. The `useEffect` runs after the browser paint — the RAF loop can fire before that. The pattern looks like this:

```js
// WRONG — statusRef starts empty, RAF can read it before useEffect fires
const statusRef = useRef({});
useEffect(() => { statusRef.current = agentStatus; }, [agentStatus]);

// RIGHT — statusRef is populated synchronously at the same time as the state
const statusRef = useRef(null);
const [agentStatus, setAgentStatus] = useState(() => {
  const initial = Object.fromEntries(
    AGENTS.map(a => [a.id, { status: "idle" }])
  );
  statusRef.current = initial; // synchronous, before any effect or RAF frame
  return initial;
});
```

**The RAF loop must always self-reschedule, including on early returns.** A bare `return` inside the loop body stops the loop permanently — which is almost never what you want. When a guard condition is not met (e.g., refs not yet ready), reschedule and wait one frame:

```js
const loop = () => {
  // Guard: if not ready, wait one frame rather than stopping or crashing
  if (!gameRef.current?.agents || !canvasRef.current) {
    rafRef.current = requestAnimationFrame(loop);
    return; // ← rescheduled before return, so the loop continues
  }
  // ... main loop body ...
  rafRef.current = requestAnimationFrame(loop); // ← always at the end
};
```

**Never read React state inside a RAF callback.** React state captured in a closure becomes stale — it holds the value from when the closure was created, not the current value. Always use a `ref` that is kept in sync with the state instead. The `statusRef` pattern in this codebase is the canonical example.

**Use `useCallback` for event handlers that interact with refs.** Event handlers like click and mousemove read from `gameRef` and `canvasRef`. Wrapping them in `useCallback` with an empty dependency array ensures they are created once and always access the current ref values (since refs are mutable objects, the reference itself never changes).

### State Ownership Rules

These rules define which piece of code "owns" each kind of state — meaning it is the only code allowed to write to it.

The `gameRef.current` object is owned exclusively by the RAF loop. No event handler, no API callback, no React component should directly write `gameRef.current.agents[i].x = ...`. If an external action needs to affect agent position (for example, teleporting an agent to a specific location), it should do so by setting the agent's `tx`/`ty` target, not by directly setting `x`/`y` — the loop handles the movement to that target.

The `chats` state is owned by the `send` function and by the component that initializes it. The RAF loop reads agent status to show speech bubbles, but it never reads or writes `chats` directly. The canvas world does not know what the conversations say — it only knows whether an agent is thinking or not.

The `agentStatus` state is written in exactly three places: the `send` function (when a request is sent), the `send` function's success callback (when the response arrives), and the `setTimeout` cleanup (3 seconds after response, returning to idle). Writing to `agentStatus` anywhere else is a bug.

### Drawing Functions

All canvas drawing is organized into pure functions that take `(ctx, ...params)` and return nothing. A drawing function must not read any external state — everything it needs is passed as arguments. This makes drawing functions testable, reusable, and easy to reason about in isolation.

The naming convention for drawing functions is `draw + PascalCase + noun`. Functions that draw composite objects (full rooms, full characters) are named for the object: `drawCommanderRoom`, `drawSprite`, `drawTree`. Functions that draw UI primitives are named for the primitive: `drawStatusBadge`, `drawSpeechBubble`, `drawNameTag`.

The `px()` utility function wraps a fill-rect with an optional 1-pixel border. It is the most frequently called function in the entire codebase and its signature is fixed: `px(ctx, x, y, w, h, fillColor, borderColor)`. The border argument is optional — when omitted, no border is drawn. Never inline a `fillRect` + border loop — always use `px()`. This keeps drawing code readable and ensures the 1px border style is visually consistent across all furniture.

```js
// WRONG — don't inline border drawing
ctx.fillStyle = "#8b5e30";
ctx.fillRect(x, y, w, h);
ctx.fillStyle = "#5a3010";
ctx.fillRect(x, y, w, 1);      // top
ctx.fillRect(x, y+h-1, w, 1);  // bottom
ctx.fillRect(x, y, 1, h);      // left
ctx.fillRect(x+w-1, y, 1, h);  // right

// RIGHT — use the utility
px(ctx, x, y, w, h, "#8b5e30", "#5a3010");
```

### Naming Conventions

Constants that represent physical units use short uppercase names: `T` for tile size, `CW` and `CH` for canvas width/height, `SP` for sprite pixel scale, `SW` and `SH` for sprite canvas width/height. These appear so frequently in coordinate calculations that long names would make the math unreadable.

Variables local to a drawing function that represent derived coordinates use the pattern `X` and `Y` (uppercase) for the room's top-left corner in canvas pixels, since they appear in nearly every expression in the function body. Variables in the RAF loop use full lowercase names (`agents`, `agent`, `dx`, `dy`, `dist`).

Agent IDs are always lowercase strings matching the key in the `ROOMS` map exactly: `"commander"`, `"scribe"`, `"amplifier"`, `"registry"`. Room keys in the `ROOMS` object match agent IDs exactly. This one-to-one correspondence is relied upon in several places and must be maintained.

Status strings are always lowercase: `"idle"`, `"thinking"`, `"responding"`, `"walking"`. Status display labels (shown in the UI) are always uppercase: `"RESTING"`, `"THINKING"`, `"ACTIVE"`, `"MOVING"`. The `STATUS_CFG` map bridges between them.

### Performance Rules

The RAF loop renders the entire canvas on every frame — background, outdoor, all four rooms, all furniture, all characters, all labels. At 60fps, this means approximately 60 full redraws per second. Several rules keep this performant.

Do not create new objects inside the RAF loop. Object allocation in a hot loop triggers garbage collection pauses that manifest as frame drops. The agent array, the AGENTS array, and the ROOMS object are all defined outside the loop and accessed by reference.

Do not call `getComputedStyle` or `getBoundingClientRect` inside the RAF loop. These force style recalculation and layout reflow. The canvas bounding rect is only needed in event handlers (click, mousemove), where it is acceptable.

Keep drawing operations batched by fill color where possible. The `ctx.fillStyle` assignment is not free — changing it repeatedly in a tight loop is more expensive than grouping all rectangles of the same color together. In the checkerboard floor rendering, the odd/even branch alternates fill styles on every tile — this is unavoidable, but it is isolated to the floor layer where the overhead is proportional to the small number of tiles.

The `ctx.beginPath()` / `ctx.arc()` / `ctx.fill()` sequence for drawing circles (tree foliage, shadows, lamp glow) is more expensive than rectangle fills. Limit arcs to elements where the circle shape is semantically important (trees, shadows, lamp glow). Use rectangles for everything else, even if a rounded corner would look slightly better.

---

## Do and Don't Reference

This section is a quick visual checklist for common decisions.

**Palette decisions.** Use the defined palette constants only — do not introduce new hex colors without adding them to the palette table. When a new room needs a floor color, check that no adjacent room uses the same hue family. Use each agent's accent color in exactly four places: sprite, room accent detail, name tag, System Roster. Do not use accent colors on furniture, walls, or outdoor elements.

**Typography decisions.** Use `Press Start 2P` only inside the HQ view (canvas labels and React UI). Use `Syne` only on the landing page. Never mix them on the same screen. Keep canvas label sizes within the defined scale (4px, 5px, 6px). Do not use `Press Start 2P` at sizes above `0.6rem` in the React UI.

**Animation decisions.** Animate only what communicates state change. Do not add ambient animations (spinning icons, pulsing colors, idle bobbing) to furniture or rooms — they add noise without signal. If an animation makes the scene feel "more alive" without communicating anything specific, remove it.

**Drawing function decisions.** Every new piece of furniture or environment element must have its own named drawing function — do not add drawing code directly to the RAF loop body. A drawing function must be pure: no side effects, no external state reads, everything passed as arguments.

**State decisions.** If a value changes at animation frequency, it belongs in `gameRef`. If it changes at user-interaction frequency, it belongs in React `useState`. Never put animation-frequency data in React state. Never put UI event data in `gameRef`. If you are unsure, ask: "does the canvas need to redraw when this changes?" If yes, it can stay in a ref. If React components need to re-render when this changes, it needs to be in state.

**World boundary decisions.** If a UI element is being added and the question is "which world does this belong to?" — the landing page or the HQ — the answer depends on what the element is communicating. Marketing, explanation, and onboarding belong on the landing page. System status, agent communication, and world interaction belong in the HQ. If an element could belong in either, it belongs in the HQ.

---

*PixelForce HQ — Design with intent, code with clarity.*