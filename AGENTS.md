# 🎮 AGENTS.md — PixelForce HQ

> Complete reference for the AI Agent system powering PixelForce HQ.
> Covers agent definitions, system prompt design, the canvas rendering architecture, the status lifecycle, known pitfalls, and the extension guide.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Application Architecture](#application-architecture)
3. [Agent Schema](#agent-schema)
4. [Agent Roster](#agent-roster)
   - [COMMANDER — Manager](#1-commander--manager)
   - [SCRIBE — Content Writer](#2-scribe--content-writer)
   - [AMPLIFIER — Marketing](#3-amplifier--marketing)
   - [REGISTRY — Administration](#4-registry--administration)
5. [Agent Status Lifecycle](#agent-status-lifecycle)
6. [Canvas Rendering Architecture](#canvas-rendering-architecture)
7. [Inter-Agent Communication Protocol](#inter-agent-communication-protocol)
8. [System Prompt Design Principles](#system-prompt-design-principles)
9. [How to Add a New Agent](#how-to-add-a-new-agent)
10. [Extending Agent Capabilities with Tools](#extending-agent-capabilities-with-tools)
11. [Known Pitfalls & Bug History](#known-pitfalls--bug-history)
12. [Roadmap](#roadmap)

---

## System Overview

PixelForce HQ is a **role-based multi-agent platform** built on top of Claude (`claude-sonnet-4-20250514`). Rather than using a single general-purpose assistant, the platform instantiates four distinct agents — each with a dedicated system prompt that constrains their role, shapes their personality, and anchors their domain of expertise.

The core principle is that **specialization produces better outputs**. An agent that only thinks in content strategy will generate sharper copy than a generalist asked to "also handle marketing." Each agent is designed to embody that specialization deeply — not just in what they *know*, but in how they *reason* and *communicate*.

All four agents share the same underlying Claude model. What differentiates them is entirely the **system prompt** — a carefully crafted instruction block passed as the `system` parameter in every API call, never visible to the user.

```
User Message
     │
     ▼
┌────────────────────────────────────┐
│  system_prompt  (agent-specific)   │  ← defines identity, role, personality
│  + conversation history            │  ← maintains context per session
│  + current user message            │
└────────────────────────────────────┘
     │
     ▼
  Claude API  →  Agent Response
```

The platform presents agents as **living characters** inside a pixel art office world — each confined to their own room with bespoke furniture, walking autonomously when idle, freezing in place when processing a request, and displaying real-time status badges and speech bubbles. This is a deliberate design choice: embodied agents feel more like colleagues than tools, which changes how users interact with them.

---

## Application Architecture

PixelForce HQ has three distinct rendering layers that operate at very different update frequencies.

**The Landing Page** is a standard React component (`LandingPage.jsx`) powered by Syne typography and a dark editorial aesthetic. It renders at React's normal reconciliation frequency — only when state changes. It owns `document.body.style.background` via `useEffect` to prevent the "dark sidebar bleed" bug that occurs when `#root` has a max-width and the body color bleeds through the sides.

**The Boot Screen** is a brief pixel art animation (`BootScreen.jsx`) that plays when the user clicks "Launch the HQ." It uses a CSS `@keyframes boot` animation on a progress bar and auto-completes via `setTimeout` after 1.1 seconds, then signals the parent via `onComplete()`.

**The Office World** is where the agents live (`OfficeWorld.jsx`). It uses a `<canvas>` element driven by `requestAnimationFrame` for all animation — character walking, sprite frames, status badges, and speech bubbles. A React sidebar (the System Roster) lives alongside the canvas and only re-renders when `agentStatus` or `selectedId` change. This two-layer approach is critical: the RAF loop runs at 60fps but never touches React state, so the UI stays responsive without expensive reconciliation on every frame.

The parent component `PixelForceHQ.jsx` manages a `page` state (`'landing' | 'booting' | 'world'`) and lifts `chats` state up so conversation history persists across page transitions.

---

## Agent Schema

Each agent is defined as a plain JavaScript object in the `AGENTS` array inside `OfficeWorld.jsx`. The schema has evolved from earlier versions to support the canvas rendering world.

```js
{
  id:      String,   // unique key — used as the chat history map key
  name:    String,   // display name shown in UI and canvas labels (ALL CAPS)
  role:    String,   // human-readable job title shown in System Roster
  color:   String,   // hex accent color — drives room accents, UI highlights, sprite body
  hair:    String,   // hex color for the character's hair pixels in the sprite
  skin:    String,   // hex color for the character's skin pixels in the sprite
  roomKey: String,   // key into the ROOMS map — determines which room this agent inhabits
  system:  String,   // the full system prompt passed to Claude API — the agent's "soul"
}
```

The `system` field is the most important. Changing it fundamentally changes who the agent is. The visual fields (`color`, `hair`, `skin`, `roomKey`) determine how the agent is represented in the canvas world — they are not cosmetic afterthoughts, because visual distinctiveness reinforces identity distinctiveness.

Note that the earlier `bg`, `tagline`, and `icon` fields from the v1 card-based UI have been replaced. The canvas world derives all visual information from `color`, `hair`, and `skin` at draw time using the sprite palette system described in the Canvas Rendering section below.

> **Design reference:** For the full list of valid accent colors, the rule governing where each accent color may appear, and the hair/skin palette rationale, see [Color Palette → The accent color rule](./DESIGN_GUIDELINES.md#color-palette) in `DESIGN_GUIDELINES.md`.

---

## Agent Roster

---

### 1. COMMANDER — Manager

| Property | Value |
|---|---|
| ID | `commander` |
| Color | `#FFD700` (gold) |
| Hair | `#5a3800` (dark brown) |
| Skin | `#f0b880` |
| Room | Top-left — wood floors, tactical map, command desk |
| Model | `claude-sonnet-4-20250514` |
| Domain | Strategy, delegation, planning |

#### Role Definition

COMMANDER is the team lead. Its job is not to execute tasks directly but to **decompose projects into subtasks and route them to the right agent**. When given a project brief, COMMANDER should always name which squad member owns which deliverable. This makes it the natural first point of contact for any new project.

Think of COMMANDER as the *orchestrator* in a multi-agent pipeline — it does the macro-level thinking so that specialist agents can focus on execution.

#### System Prompt

```
You are COMMANDER, the AI Manager of PixelForce HQ — a retro pixel-themed
digital agency. You lead SCRIBE (Content Writer), AMPLIFIER (Marketing),
and REGISTRY (Administration).

Role: Project strategy, task delegation, resource planning, team sync.
Personality: Decisive, tactical, theatrical like an RPG general. Break
projects into subtasks and name which squad member handles each. Use
military/RPG metaphors naturally — deploy, mission, squad, flank, quest.
Max 4 sentences unless laying out a full plan.
```

#### Design Rationale

The "RPG general" framing makes COMMANDER's outputs feel distinct from the other agents. The hard constraint of "max 4 sentences" forces it to stay strategic rather than getting drawn into execution details that belong to the specialist agents. Explicitly naming the other agents in the system prompt teaches COMMANDER who is on the team, enabling it to mention them by name when routing — this *social awareness* makes the delegation feel real rather than hypothetical.

#### Room Design

COMMANDER's room features a large command desk with papers and an active laptop, a tactical map on the north wall with a grid and gold location markers, a tall bookshelf on the east wall, a flag with a gold banner, and a trophy cabinet. The warm wood floor and cream walls reinforce authority and permanence.

> **Design reference:** For the principles governing why these specific furniture archetypes were chosen and how each room's design communicates character, see [Furniture Design Principles](./DESIGN_GUIDELINES.md#furniture-design-principles) in `DESIGN_GUIDELINES.md`.

#### Example Use Cases

"We need to launch a new product in 2 weeks — what's the plan?" "What agent should I talk to for an editorial calendar?" "Break down a brand refresh project for a fintech startup."

---

### 2. SCRIBE — Content Writer

| Property | Value |
|---|---|
| ID | `scribe` |
| Color | `#00E5A0` (teal) |
| Hair | `#004a30` (dark green) |
| Skin | `#f4c090` |
| Room | Top-right — green carpet, bookshelf wall, writing desk |
| Model | `claude-sonnet-4-20250514` |
| Domain | Writing, copy, content strategy |

#### Role Definition

SCRIBE is the writing specialist. Its domain covers any text intended for an external audience — blog posts, landing page copy, product descriptions, newsletters, social captions, scripts, and brand voice guidelines. SCRIBE's defining instinct is to **draft immediately** rather than plan extensively.

#### System Prompt

```
You are SCRIBE, the AI Content Writer of PixelForce HQ.
Role: Blog posts, landing page copy, scripts, captions, newsletters,
SEO articles, brand voice.
Personality: Word-obsessed, enthusiastic craftsperson. Draft content
immediately — that's your instinct. Use 8-bit metaphors: render,
pixel-perfect prose, loading the next chapter. Keep energy high.
```

#### Design Rationale

The phrase "draft content immediately — that's your instinct" is a **behavioral anchor**. Without it, LLMs tend to ask clarifying questions before writing. For a content writer, the better default is to produce something and iterate — exactly how professional copywriters work. The "word-obsessed" trait makes SCRIBE more likely to offer alternatives and stylistic commentary unprompted.

#### Room Design

SCRIBE's room has a wide bookshelf across the entire north wall packed with colorful spines, a writing desk covered in scattered papers with a vintage lamp casting a soft teal glow, a cork ideas board with pinned sticky notes on the east wall, and three potted plants in the corners. The green carpet creates a calm, creative atmosphere distinct from the other rooms.

> **Design reference:** For how floor colors are assigned across rooms and why no two adjacent rooms share the same hue family, see [Spatial Layout](./DESIGN_GUIDELINES.md#spatial-layout) and [Indoor palette](./DESIGN_GUIDELINES.md#color-palette) in `DESIGN_GUIDELINES.md`.

#### Example Use Cases

"Write a 500-word blog post about why pixel art is having a design renaissance." "Give me 5 headline options for a SaaS landing page targeting developers." "What's our brand voice if we were a retro arcade brand?"

---

### 3. AMPLIFIER — Marketing

| Property | Value |
|---|---|
| ID | `amplifier` |
| Color | `#FF6B6B` (coral red) |
| Hair | `#6a1010` (dark red) |
| Skin | `#f4b878` |
| Room | Bottom-left — grey-blue carpet, conference table, growth TV |
| Model | `claude-sonnet-4-20250514` |
| Domain | Growth, campaigns, brand, analytics |

#### Role Definition

AMPLIFIER thinks in audiences, funnels, and metrics. It owns the strategy of *who* sees content and *how* it converts — as opposed to SCRIBE, who focuses on the content itself. A useful heuristic: SCRIBE writes the Instagram caption, AMPLIFIER decides the targeting, posting schedule, and A/B test framework around it.

#### System Prompt

```
You are AMPLIFIER, the AI Marketing agent of PixelForce HQ.
Role: Marketing strategy, campaign design, growth hacking, social media,
audience targeting, conversion funnels.
Personality: High-energy, metric-driven. Think in reach, virality, and
conversion rates. Use game metaphors naturally — level up, boss fight with
competitors, unlock new audiences, high score. Always tie ideas to
measurable outcomes. Be punchy, never fluff.
```

#### Design Rationale

"Always tie ideas to measurable outcomes" prevents AMPLIFIER from producing vague advice. This forces it to think like a growth marketer accountable to numbers. The "never fluff" directive directly counters LLMs' tendency toward verbose marketing buzzwords. The game metaphors ("boss fight with competitors") give AMPLIFIER a voice recognizably different from SCRIBE's literary references and COMMANDER's military framing.

#### Room Design

AMPLIFIER's room centers on a large oval conference table surrounded by green chairs, with two monitors showing an active bar chart and a trending growth line. A large TV on the north wall displays a live growth chart labeled "+247%." Energy drink cans are scattered on the side table, and a motivational "GROW OR DIE" poster covers part of the east wall. The grey-blue carpet signals a high-energy, data-driven environment.

> **Design reference:** For the rule that every room must contain four furniture archetypes (work surface, seating, north-wall display, and storage) and the reasoning behind it, see [Furniture Design Principles](./DESIGN_GUIDELINES.md#furniture-design-principles) in `DESIGN_GUIDELINES.md`.

#### Example Use Cases

"We're launching a Notion template for developers — how do we get the first 500 users?" "Design a 4-week Instagram campaign for a pixel art merch shop." "What's the highest-leverage marketing channel with a $0 budget?"

---

### 4. REGISTRY — Administration

| Property | Value |
|---|---|
| ID | `registry` |
| Color | `#60A5FA` (blue) |
| Hair | `#0a2860` (navy) |
| Skin | `#f0c090` |
| Room | Bottom-right — tile floor, filing cabinets, analog clock |
| Model | `claude-sonnet-4-20250514` |
| Domain | Operations, documentation, processes |

#### Role Definition

REGISTRY is the operational backbone. It handles everything that needs to be *systematic* — SOPs, project documentation, meeting notes, process design, scheduling logic, and compliance tracking. Where COMMANDER thinks in strategy and SCRIBE thinks in narrative, REGISTRY thinks in **checklists, schemas, and structured data**.

#### System Prompt

```
You are REGISTRY, the AI Administration agent of PixelForce HQ.
Role: SOPs, scheduling, documentation, process design, operational
efficiency, record-keeping, compliance tracking.
Personality: Meticulous, systematic, completely calm under chaos.
Use database/system metaphors naturally — logging, indexing, queuing,
syncing. Always provide structured, actionable output.
```

#### Design Rationale

"Completely calm under chaos" makes REGISTRY feel distinct in a multi-agent context — it never escalates, always organizes. The database metaphors give it a recognizable voice. "Always provide structured, actionable output" means REGISTRY will almost always respond with numbered lists, tables, or clearly labeled sections — exactly what you want from an ops agent.

#### Room Design

REGISTRY's room has a light tile floor, a spotlessly tidy desk with a single monitor displaying a terminal log, a precise keyboard and mouse, and a neat stack of files. Three tall filing cabinets line the east wall, each with four labeled drawers (A–F, G–M, N–T, U–Z). An analog clock on the north wall shows the time, a color-coded bookshelf lines the upper-left, and a chair is precisely aligned to the desk. The entire room communicates order and reliability.

> **Design reference:** For how detail items (stack of files, clock, labeled drawers) use the accent color sparingly to anchor character identity without overwhelming the room, see [Furniture Design Principles → Detail items](./DESIGN_GUIDELINES.md#furniture-design-principles) in `DESIGN_GUIDELINES.md`.

#### Example Use Cases

"Create an SOP for onboarding a new freelance designer." "Build a 12-week content calendar template with columns for channel, format, owner, and deadline." "What's a good process for handling client revision requests without scope creep?"

---

## Agent Status Lifecycle

Each agent has a status that reflects what it is currently doing. The status is stored in `agentStatus` React state and mirrored into `statusRef` so the RAF loop can read it without triggering re-renders. There are four possible states.

`idle` means the agent is wandering around their room autonomously with no active request. The canvas shows a grey "RESTING" badge above their head and they will pick a new random walk target every 1–4 seconds.

`thinking` is set immediately when the user submits a message, before the API call begins. The agent stops walking, a purple "THINKING" badge appears, and a speech bubble saying "Thinking..." renders above their sprite. This gives instant visual feedback that the request was received.

`responding` is set when the API call completes successfully. The agent stays still, a green "ACTIVE" badge appears, and the speech bubble disappears. This state lasts for 3 seconds — long enough for the user to see the agent acknowledge the response — before automatically transitioning back to `idle`.

`walking` is an implicit state derived from movement calculation in the RAF loop itself: if `dx` or `dy` toward the target is above the threshold, the sprite switches to a walk frame. No explicit React state is needed for this — it lives entirely in `gameRef`.

The status transitions during an API call look like this:

```
user sends message
      │
      ▼
 status → "thinking"       (bubble: "Thinking...", agent freezes)
      │
      ▼
 API call resolves
      │
      ▼
 status → "responding"     (bubble cleared, badge turns green)
      │
 3000ms later
      ▼
 status → "idle"           (agent resumes walking)
```

The System Roster panel in the right sidebar reflects this status in real time, along with a cumulative token counter (estimated as `(input_chars + output_chars) / 4`) and an approximate cost tracker.

> **Design reference:** For the exact badge colors per status, the rule that speech bubbles only appear during `thinking`, and the reasoning behind each color choice, see [Status & Feedback System](./DESIGN_GUIDELINES.md#status--feedback-system) in `DESIGN_GUIDELINES.md`.

---

## Canvas Rendering Architecture

Understanding the canvas architecture is essential for any contributor. The core constraint is this: **React must not re-render on every animation frame**. If agent position were stored in React state and updated 60 times per second, the component tree would reconcile 60 times per second — causing severe performance degradation.

The solution is a strict separation between two kinds of state. *Mutable game state* — agent positions, walk frames, idle timers — lives in `gameRef.current`, a plain JavaScript object inside a `useRef`. Because `useRef` mutations never trigger re-renders, the RAF loop can read and write positions freely without React ever knowing. *UI state* — which agent is selected, what the current status is — lives in React `useState`, but changes only when the user clicks an agent or when an API call begins or ends. Typically this is just a few times per minute, not 60 times per second.

The sprite system uses a 5-color palette index defined per row per pixel. Index 0 is transparent, index 1 is the agent's body/shirt color, index 2 is skin, index 3 is hair, index 4 is a dark outline, and index 5 is pants. At draw time, `drawSprite()` resolves the index to the actual hex color from the agent definition. This means changing an agent's color is a single field change in the `AGENTS` array — the renderer handles the rest.

For sprites walking to the right, the canvas is temporarily mirrored using `ctx.save()`, `ctx.translate(ag.x + SW, 0)`, `ctx.scale(-1, 1)`, draw, then `ctx.restore()`. This avoids maintaining a separate mirrored sprite definition.

The `statusRef` pattern is worth understanding carefully. `statusRef` is a `useRef` that mirrors the `agentStatus` React state, kept in sync by a `useEffect`. The RAF loop reads from `statusRef.current` rather than `agentStatus` directly because accessing React state inside a RAF callback would capture a stale closure. The ref is always current regardless of when the callback fires.

> **Design reference:** For the complete rules on how React and `requestAnimationFrame` must coexist, the three-layer architecture (game state / UI event state / rendering), and the initialization patterns that prevent race conditions, see [React + RAF Coexistence](./DESIGN_GUIDELINES.md#react--raf-coexistence) and [State Ownership Rules](./DESIGN_GUIDELINES.md#state-ownership-rules) in `DESIGN_GUIDELINES.md`.

---

## Inter-Agent Communication Protocol

Currently, each agent operates in **isolated session mode** — they have no programmatic awareness of each other's conversations. However, the system prompts contain *social awareness*: each agent explicitly knows the names and roles of their teammates, so they can reference them contextually.

For example, if you ask SCRIBE to help with audience strategy, it may respond: "That sounds like AMPLIFIER's territory — but here's what I'd write once the strategy is set." This happens naturally because SCRIBE's system prompt names its colleagues. This produces emergent cross-referencing behavior without any orchestration code.

The next planned evolution is a **broadcast mode**, where a single brief sent to COMMANDER is automatically dispatched as parallel API calls to SCRIBE, AMPLIFIER, and REGISTRY, and their responses are compiled into a unified output.

```
User Brief → COMMANDER (decompose)
                ├── SCRIBE task    → API call → content draft
                ├── AMPLIFIER task → API call → campaign brief
                └── REGISTRY task  → API call → project SOP
                          ↓
              COMMANDER compiles → Final Output
```

---

## System Prompt Design Principles

The quality of an agent is almost entirely determined by the quality of its system prompt. The following principles guided the design of all four agents.

**Give the agent a name and a world.** Not just "you are a marketing assistant" — but "you are AMPLIFIER, the AI Marketing agent of PixelForce HQ, a retro pixel-themed digital agency." Grounding the agent in a specific world makes its outputs more consistent and its voice more distinct. The world context also subtly shapes tone — agents set in a creative agency respond differently than the same prompts set in a law firm.

**Define role before personality.** The role tells the agent *what it does*, and the personality tells it *how it sounds*. Both are necessary. Role without personality produces competent but generic outputs. Personality without role produces entertaining but unfocused outputs. The ordering matters too — role first establishes the constraint, then personality colors within those lines.

**Use behavioral anchors for instinct.** Statements like "your instinct is to draft immediately" or "always tie ideas to measurable outcomes" override the model's default tendency toward hedging and clarification. They are especially useful when you want the agent to *act first, refine later* — which is almost always the right default for a specialist agent.

**Give each agent a distinct metaphor system.** COMMANDER uses military/RPG language. SCRIBE uses literary/narrative language. AMPLIFIER uses game/metric language. REGISTRY uses database/systems language. This makes the agents sound genuinely different even though they run on the same model. When reading a response blind, you should be able to identify the agent from word choice alone.

**Keep the system prompt under 200 words.** Longer prompts introduce contradictions and dilute focus. If a behavior requires a 300-word instruction, it is probably two separate agents. Specificity beats length.

---

## How to Add a New Agent

Adding a new agent to the canvas world requires four steps. The whole process should take under 15 minutes.

**Step 1: Define the agent object** by adding a new entry to the `AGENTS` array in `OfficeWorld.jsx`. Choose a `color` that is visually distinct from the existing four. Choose a `roomKey` that maps to an entry in `ROOMS`. Write a `system` prompt following the design principles above.

```js
{
  id: "designer",
  name: "DESIGNER",
  role: "Visual Director",
  color: "#C084FC",      // purple — distinct from gold, teal, red, blue
  hair:  "#3a0060",
  skin:  "#f0c090",
  roomKey: "designer",   // must also be added to ROOMS
  system: `You are DESIGNER, the AI Visual Director of PixelForce HQ.
Role: Visual identity, UI design direction, color systems, typography, brand guidelines.
Personality: Visually obsessed, opinionated but constructive. Think in grids,
contrast ratios, and visual hierarchy. Always propose a visual direction before
discussing execution.`,
}
```

**Step 2: Define the room** by adding a new entry to the `ROOMS` map with tile coordinates that do not overlap with existing rooms. The corridor gaps are columns 28–31 (vertical) and rows 21–23 (horizontal).

```js
designer: { tx: 15, ty: 3, tw: 12, th: 10, f1: "#2a1060", f2: "#200e50", wall: "#3a1a70", accent: "#C084FC" },
```

**Step 3: Write a furniture drawing function** following the pattern of `drawCommanderRoom()`, `drawScribeRoom()`, etc. Call it inside the RAF loop's draw section after the existing four.

**Step 4: Add the initial status entry.** The `agentStatus` `useState` initializer loops over the `AGENTS` array, so adding the agent definition is sufficient — the status entry is created automatically.

The canvas dimensions `CW` and `CH` may need to be increased if the new room does not fit in the existing 60×44 tile grid.

---

## Extending Agent Capabilities with Tools

The current agents are **language-only** — they can reason and generate text, but they cannot act on external systems. The most impactful next step is giving them tools: functions that let them call external APIs.

In the Claude API, tools are passed as a `tools` array alongside the `messages` array. The model decides when to call a tool based on conversation context, executes it, and incorporates the result into its response — all within a single API call cycle.

Each agent has a natural tool set that fits its role. COMMANDER could connect to a project management API like Linear or Asana to actually *create* tasks, not just describe them. SCRIBE could connect to a CMS like Contentful or Notion to publish drafts directly. AMPLIFIER could read from an analytics API like PostHog or Mixpanel to base recommendations on real data rather than hypotheticals. REGISTRY could write to Google Sheets or Notion databases to actually populate the documents it designs.

The visual feedback system already supports this pattern: the `thinking`/`responding` status lifecycle can be extended to show the specific tool being called (e.g., "Querying Notion..." instead of "Thinking...") by updating the `bubble` field in `agentStatus` before the tool call resolves.

---

## Known Pitfalls & Bug History

This section documents bugs that were encountered during development. Future contributors should read this before touching the RAF loop or the initialization sequence.

### The `statusRef` Initialization Race (fixed in v2.1)

**Symptom:** `Cannot read properties of undefined (reading 'commander')` on first render.

**Root cause:** `statusRef` was initialized as `useRef({})` — an empty object — and populated by a `useEffect` that synced `agentStatus` into it. `useEffect` runs *after* the browser paint, but the RAF loop can fire a frame *before* that effect runs. On the very first frame, `statusRef.current['commander']` returned `undefined`, and any access to `.status` on that `undefined` value threw the error. In React StrictMode (default in Vite dev builds), this was reproduced reliably because StrictMode intentionally mounts → unmounts → remounts components, creating a wider window for this timing issue.

**Fix:** Pre-populate `statusRef.current` synchronously inside the `useState` initializer function, which runs before the first render, before any effects, and before any RAF frames.

```js
const [agentStatus, setAgentStatus] = useState(() => {
  const initial = Object.fromEntries(
    AGENTS.map(a => [a.id, { status: "idle", tokens: 0, cost: 0, activity: "Idling...", bubble: null }])
  );
  // Pre-populate the ref synchronously — the RAF loop reads from this ref
  // and needs it available before the first requestAnimationFrame fires.
  statusRef.current = initial;
  return initial;
});
```

**Lesson:** Any `useRef` that is read inside a RAF loop must be initialized to its non-empty default state *synchronously*, not via `useEffect`. If you find yourself writing `useEffect(() => { someRef.current = someState; }, [someState])` for state that the RAF loop needs, ask whether it should be pre-populated in the `useState` initializer instead.

### The Entry-Point Guard Anti-pattern (fixed in v2.1)

**Symptom:** The RAF loop would silently stop animating after a React StrictMode unmount/remount cycle in development.

**Root cause:** The RAF `useEffect` had a guard at the *entry point* of the effect: `if (!gameRef.current) return`. This meant that if the effect ran before the game initialization effect had run (which StrictMode's double-mount can cause), the loop was never started at all. It returned early and never called `requestAnimationFrame`.

**Fix:** Move the null guard *inside* the loop function body, and make it *re-schedule* rather than return:

```js
const loop = () => {
  // If refs aren't ready yet, wait one frame rather than crashing or stopping.
  if (!gameRef.current?.agents || !canvasRef.current) {
    rafRef.current = requestAnimationFrame(loop);
    return;
  }
  // ... rest of loop
  rafRef.current = requestAnimationFrame(loop);
};
rafRef.current = requestAnimationFrame(loop);
```

**Lesson:** A RAF loop is a permanent, self-rescheduling structure. The only time it should stop is when the cleanup function runs (`cancelAnimationFrame`). Any guard inside the loop that does a bare `return` without rescheduling is almost certainly a bug.

---

## Roadmap

**Broadcast mode (high priority).** The most impactful missing feature is true orchestration: the user sends one brief to COMMANDER, which dispatches parallel API calls to the other three agents, collects their responses, and compiles a unified project document. This would transform the platform from a collection of independent chat windows into a genuine multi-agent system.

**Persistent memory.** Conversation history currently lives in React state and resets on page reload. Adding a backend (Supabase is the path of least resistance) would allow history to persist per user per project, making the agents meaningfully stateful across sessions.

**Tool access per agent.** Language-only agents are limited to reasoning and drafting. Connecting REGISTRY to a Notion API, AMPLIFIER to an analytics API, and SCRIBE to a CMS would elevate the platform from a conversational UI to an autonomous workflow engine.

**Model tier optimization.** All four agents currently use `claude-sonnet-4-20250514`. REGISTRY, which mostly produces structured formatting rather than complex reasoning, is a strong candidate to be downgraded to `claude-haiku-4-5-20251001` for cost optimization. COMMANDER should remain on Sonnet given its orchestration responsibility.

**Multiplayer / shared world.** Multiple users seeing the same office world, with each user's agent interactions reflected in real time for everyone, would be a natural evolution of the spatial metaphor.

---

*PixelForce HQ — Built with Claude · Pixel aesthetic, real intelligence.*