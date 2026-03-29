const { execSync } = require("child_process");
const fs = require("fs");

const data = JSON.parse(
  execSync(
    'gh api graphql -f query=\'query { user(login: "Reuz93") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date weekday } } } } } }\'',
    { encoding: "utf8" }
  )
);

const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
const total = data.data.user.contributionsCollection.contributionCalendar.totalContributions;

const cellSize = 13;
const cellGap = 3;
const offsetX = 55;
const offsetY = 70;

function getColor(count) {
  if (count === 0) return "#111128";
  if (count <= 2) return "#1a3a1a";
  if (count <= 5) return "#2d6b2d";
  if (count <= 10) return "#4a9e3a";
  return "#72f862";
}

function getFilter(count) {
  if (count === 0) return "none";
  if (count <= 5) return "url(#glow-dim)";
  return "url(#glow-cell)";
}

let cells = "";
let monthLabels = "";
let lastMonth = -1;
const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

// Find ghost position - somewhere in the empty middle zone
const ghostWeek = 18;
const ghostDay = 3;
const ghostX = offsetX + ghostWeek * (cellSize + cellGap) + 1;
const ghostY = offsetY + ghostDay * (cellSize + cellGap) - 3;

weeks.forEach((week, wi) => {
  week.contributionDays.forEach((day, di) => {
    const x = offsetX + wi * (cellSize + cellGap);
    const y = offsetY + di * (cellSize + cellGap);
    const color = getColor(day.contributionCount);
    const filter = getFilter(day.contributionCount);
    const stroke = day.contributionCount > 0 ? color : "#1a1a2e";
    const opacity = day.contributionCount > 10 ? 1 : 0.9;
    cells += `  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" stroke="${stroke}" stroke-width="0.5" filter="${filter}" opacity="${opacity}"/>\n`;

    const m = new Date(day.date).getMonth();
    if (di === 0 && m !== lastMonth) {
      monthLabels += `  <text x="${x}" y="${offsetY - 8}" font-size="9" fill="#555577" font-family="Courier New, monospace">${monthNames[m]}</text>\n`;
      lastMonth = m;
    }
  });
});

let dayLabels = "";
const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
[1, 3, 5].forEach(i => {
  const y = offsetY + i * (cellSize + cellGap) + 10;
  dayLabels += `  <text x="28" y="${y}" font-size="8" fill="#444455" text-anchor="end" font-family="Courier New, monospace">${dayNames[i]}</text>\n`;
});

const gridWidth = offsetX + weeks.length * (cellSize + cellGap) + 30;
const W = Math.max(880, gridWidth);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 210">
  <defs>
    <filter id="glow-cell">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-dim">
      <feGaussianBlur stdDeviation="0.8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-title">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ghost-glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" patternUnits="userSpaceOnUse" width="${W}" height="4">
      <rect width="${W}" height="2" fill="transparent"/>
      <rect y="2" width="${W}" height="2" fill="rgba(0,0,0,0.08)"/>
    </pattern>
  </defs>

  <style>
    text { font-family: "Courier New", Consolas, monospace; }
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      93% { opacity: 0.87; }
      94% { opacity: 1; }
    }
    @keyframes ghost-float {
      0%, 100% { transform: translate(0px, 0px); }
      25% { transform: translate(3px, -2px); }
      50% { transform: translate(0px, -3px); }
      75% { transform: translate(-3px, -2px); }
    }
    @keyframes ghost-fade {
      0%, 100% { opacity: 0.22; }
      50% { opacity: 0.48; }
    }
    .screen { animation: flicker 6s infinite; }
    .ghost {
      animation: ghost-float 4s ease-in-out infinite, ghost-fade 5s ease-in-out infinite;
    }
  </style>

  <rect width="${W}" height="210" rx="8" fill="#0a0a1e"/>
  <rect x="2" y="2" width="${W - 4}" height="206" rx="7" fill="#050510" stroke="#2a2a4a" stroke-width="1"/>

  <g class="screen">
    <text x="30" y="30" font-size="14" fill="#ff6600" filter="url(#glow-title)" letter-spacing="3">BATTLE LOG</text>
    <text x="${W - 30}" y="30" text-anchor="end" font-size="12" fill="#72f862" filter="url(#glow-cell)" letter-spacing="1">${total} HITS</text>

    <text x="${W - 280}" y="50" font-size="9" fill="#444455">LESS</text>
    <rect x="${W - 250}" y="42" width="10" height="10" rx="2" fill="#111128" stroke="#1a1a2e" stroke-width="0.5"/>
    <rect x="${W - 236}" y="42" width="10" height="10" rx="2" fill="#1a3a1a"/>
    <rect x="${W - 222}" y="42" width="10" height="10" rx="2" fill="#2d6b2d"/>
    <rect x="${W - 208}" y="42" width="10" height="10" rx="2" fill="#4a9e3a"/>
    <rect x="${W - 194}" y="42" width="10" height="10" rx="2" fill="#72f862" filter="url(#glow-cell)"/>
    <text x="${W - 180}" y="50" font-size="9" fill="#444455">MORE</text>

    <line x1="20" y1="56" x2="${W - 20}" y2="56" stroke="#222244" stroke-width="1" stroke-dasharray="4,4"/>

${monthLabels}
${dayLabels}
${cells}
    <g class="ghost" filter="url(#ghost-glow)" transform="translate(${ghostX}, ${ghostY}) scale(1.1)">
      <ellipse cx="7.5" cy="8" rx="7" ry="6.5" fill="#59468b" opacity="0.5"/>
      <path d="M2,5 L0,0 L4,3 Z" fill="#59468b" opacity="0.4"/>
      <path d="M7.5,2 L7.5,-2 L9,3 Z" fill="#59468b" opacity="0.4"/>
      <path d="M12,4 L15,1 L13,4 Z" fill="#59468b" opacity="0.4"/>
      <ellipse cx="5" cy="7" rx="2" ry="1.5" fill="#ff2244" opacity="0.5"/>
      <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#ff2244" opacity="0.5"/>
      <circle cx="5.5" cy="6.8" r="0.7" fill="#1a1a2e"/>
      <circle cx="11" cy="6.8" r="0.7" fill="#1a1a2e"/>
      <path d="M4.5,11 Q5.5,13 7.5,11 Q9.5,13 10.5,11" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.4"/>
    </g>

    <text x="${W / 2}" y="200" text-anchor="middle" font-size="9" fill="#222244" letter-spacing="1">2025 .. 2026  //  REUZ</text>

    <rect x="2" y="2" width="${W - 4}" height="206" rx="7" fill="url(#scan)" opacity="0.4"/>
  </g>
</svg>`;

fs.writeFileSync("contributions.svg", svg);
console.log(`Generated: ${weeks.length} weeks, ${total} contributions, ghost at (${ghostX},${ghostY})`);
