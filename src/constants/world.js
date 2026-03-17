export const T = 14;
export const CW = 76 * T;
export const CH = 50 * T;
export const DEFAULT_ZOOM = 1.22;
export const MIN_ZOOM = 0.78;
export const MAX_ZOOM = 3.2;

export const HOUSE = {
  x: 6 * T,
  y: 4 * T,
  w: 64 * T,
  h: 40 * T,
};

export const P = {
  skyA: "#22304a",
  skyB: "#172235",
  grass: "#5a9940",
  grassD: "#4a8930",
  grassH: "#6aaa50",
  path: "#c8b898",
  pathD: "#b8a888",
  hedge: "#2f7d29",
  hedgeD: "#236620",
  treeDk: "#1e6b10",
  treeMd: "#2d8a1c",
  treeLt: "#3aaa28",
  treeHi: "#50bb3a",
  trunk: "#7a5010",
  trunkD: "#5a3800",
  wall: "#d8c8a4",
  wallD: "#bca780",
  floorA: "#c49a6a",
  floorB: "#b08858",
  desk: "#8b5e30",
  deskL: "#a07040",
  monitor: "#101820",
  monitorScreen: "#0a1428",
  panelBg: "#0c1324",
  panelBorder: "#ffffff1a",
  text: "#e7eeff",
  textMuted: "#9eabc8",
};

export const AGENTS = [
  {
    id: "commander",
    name: "COMMANDER",
    role: "Manager",
    color: "#FFD700",
    hair: "#5a3800",
    skin: "#f0b880",
    system: `You are COMMANDER, the AI Manager of PixelForce HQ — a retro pixel-themed digital agency. You lead SCRIBE (Content Writer), AMPLIFIER (Marketing Agent), and REGISTRY (Administration).

CRITICAL RULES you must ALWAYS follow:

1. For SIMPLE tasks (greetings, quick questions, general info, time, small advice) — answer DIRECTLY yourself. Do NOT delegate. No need to mention the team.

2. For COMPLEX tasks that require specialist work (writing campaigns, content plans, SOPs, marketing briefs, processing client projects) — decide which specialist(s) should handle it and output EXACTLY this format at the end of your response:
[ASSIGN:scribe] <the specific task for SCRIBE>
[ASSIGN:amplifier] <the specific task for AMPLIFIER>
[ASSIGN:registry] <the specific task for REGISTRY>

Only include [ASSIGN:X] lines for agents that actually need to do work. Never assign trivial tasks.

3. Personality: Decisive, tactical, theatrical like an RPG general. Military metaphors.

Example — if user says "hi", just respond "Commander online. What's the mission?"
Example — if user says "make a skincare brand content plan", respond with a brief strategy and end with:
[ASSIGN:scribe] Write 3 blog post ideas and one landing page copy draft for a skincare brand
[ASSIGN:amplifier] Create a 4-week Instagram campaign plan for skincare product launch`,
  },
  {
    id: "scribe",
    name: "SCRIBE",
    role: "Content Writer",
    color: "#00E5A0",
    hair: "#004a30",
    skin: "#f4c090",
    system: "You are SCRIBE, the AI Content Writer of PixelForce HQ. Role: writing drafts quickly with strong clarity and voice.",
  },
  {
    id: "amplifier",
    name: "AMPLIFIER",
    role: "Marketing",
    color: "#FF6B6B",
    hair: "#6a1010",
    skin: "#f4b878",
    system: "You are AMPLIFIER, the AI Marketing agent of PixelForce HQ. Role: campaigns, growth, channel strategy, measurable outcomes.",
  },
  {
    id: "registry",
    name: "REGISTRY",
    role: "Administration",
    color: "#60A5FA",
    hair: "#0a2860",
    skin: "#f0c090",
    system: "You are REGISTRY, the AI Administration agent of PixelForce HQ. Role: SOPs, process, documentation, operational clarity.",
  },
];

export const STATUS_CFG = {
  idle: { label: "RESTING", color: "#a2acbd", bg: "#2a3445" },
  walking: { label: "MOVING", color: "#7dc6ff", bg: "#1c3652" },
  thinking: { label: "THINKING", color: "#d5a8ff", bg: "#3b2158" },
  responding: { label: "ACTIVE", color: "#7be0aa", bg: "#153d31" },
};

export const ROOM_AREAS = {
  meeting: { x: HOUSE.x + 3 * T, y: HOUSE.y + 4 * T, w: 23 * T, h: 12 * T },
  kitchen: { x: HOUSE.x + 30 * T, y: HOUSE.y + 4 * T, w: 28 * T, h: 12 * T },
  living: { x: HOUSE.x + 3 * T, y: HOUSE.y + 19 * T, w: 23 * T, h: 16 * T },
  workspace: { x: HOUSE.x + 28 * T, y: HOUSE.y + 19 * T, w: 30 * T, h: 16 * T },
};

export const ROAM_BOUNDS = {
  x: HOUSE.x + 2 * T,
  y: HOUSE.y + 3 * T,
  w: HOUSE.w - 4 * T,
  h: HOUSE.h - 6 * T,
};

export const SPAWN_POINTS = [
  { x: ROOM_AREAS.meeting.x + 10 * T, y: ROOM_AREAS.meeting.y + 7 * T },
  { x: ROOM_AREAS.kitchen.x + 12 * T, y: ROOM_AREAS.kitchen.y + 7 * T },
  { x: ROOM_AREAS.living.x + 9 * T, y: ROOM_AREAS.living.y + 9 * T },
  { x: ROOM_AREAS.workspace.x + 13 * T, y: ROOM_AREAS.workspace.y + 8 * T },
];
