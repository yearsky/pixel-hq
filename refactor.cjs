const fs = require('fs');
const path = 'src/components/OfficeWorld.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const constStart = lines.findIndex(l => l.startsWith('const T = 14;'));
const shadeStart = lines.findIndex(l => l.startsWith('function shade('));
const crossTalkStart = lines.findIndex(l => l.startsWith('function buildCrossTalk('));

const renderLines = lines.slice(shadeStart, crossTalkStart - 1).map(l => {
    if (l.startsWith('function ')) return 'export ' + l;
    return l;
});

const renderHeader = `import { T, CW, CH, HOUSE, P, AGENTS, STATUS_CFG, ROOM_AREAS, ROAM_BOUNDS } from '../constants/world';\n\n`;

if (!fs.existsSync('src/utils')) fs.mkdirSync('src/utils');
fs.writeFileSync('src/utils/canvasRenderer.js', renderHeader + renderLines.join('\n'));

const importsStr = `import { T, CW, CH, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, HOUSE, P, AGENTS, STATUS_CFG, ROOM_AREAS, ROAM_BOUNDS, SPAWN_POINTS } from '../constants/world';
import { shade, px, drawRoomAmbiance, drawTree, drawFlower, drawFence, drawLamp, drawOutdoor, drawHouseShell, drawRug, drawStairs, drawBookshelf, drawFilingCabinet, drawTrophyCabinet, drawTacticalMap, drawDesk, drawPlant, drawChair, drawTVSet, drawMeetingRoom, drawKitchenRoom, drawLivingRoom, drawWorkspaceRoom, drawOpenPlanDecor, drawZoneLabel, drawStatus, drawName, drawSpeechBubble, drawAgent3D } from '../utils/canvasRenderer';
`;

let newLines = [
    ...lines.slice(0, constStart),
    importsStr,
    ...lines.slice(crossTalkStart)
];

fs.writeFileSync(path, newLines.join('\n'));
