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

// All weeks (last year from GitHub API)
const filteredWeeks = weeks;

const cellSize = 13;
const cellGap = 3;
const offsetX = 55;
const offsetY = 70;

function getColor(count) {
  if (count === 0) return "#0a1a0a";
  if (count <= 2) return "#0d3a0d";
  if (count <= 5) return "#1a6b1a";
  if (count <= 10) return "#2a9e2a";
  return "#00ff41";
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

// Find ghost position - Gengar hides in the grid
const ghostWeek = Math.floor(filteredWeeks.length * 0.35);
const ghostDay = 3;
const ghostX = offsetX + ghostWeek * (cellSize + cellGap) + 2;
const ghostY = offsetY + ghostDay * (cellSize + cellGap) - 2;

filteredWeeks.forEach((week, wi) => {
  week.contributionDays.forEach((day, di) => {
    const x = offsetX + wi * (cellSize + cellGap);
    const y = offsetY + di * (cellSize + cellGap);
    const color = getColor(day.contributionCount);
    const filter = getFilter(day.contributionCount);
    const stroke = day.contributionCount > 0 ? "#00ff41" : "#0d1a0d";
    const strokeOpacity = day.contributionCount > 0 ? 0.3 : 0.15;
    const opacity = day.contributionCount > 10 ? 0.9 : 0.8;
    cells += `  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" stroke="${stroke}" stroke-width="0.5" stroke-opacity="${strokeOpacity}" filter="${filter}" opacity="${opacity}"/>\n`;

    const m = new Date(day.date).getMonth();
    if (di === 0 && m !== lastMonth) {
      monthLabels += `  <text x="${x}" y="${offsetY - 8}" font-size="9" fill="#00ff41" opacity="0.3" font-family="Courier New, monospace">${monthNames[m]}</text>\n`;
      lastMonth = m;
    }
  });
});

let dayLabels = "";
const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
[1, 3, 5].forEach(i => {
  const y = offsetY + i * (cellSize + cellGap) + 10;
  dayLabels += `  <text x="28" y="${y}" font-size="8" fill="#00ff41" opacity="0.25" text-anchor="end" font-family="Courier New, monospace">${dayNames[i]}</text>\n`;
});

// Count only filtered contributions
let filteredTotal = 0;
filteredWeeks.forEach(w => w.contributionDays.forEach(d => { filteredTotal += d.contributionCount; }));

const gridWidth = offsetX + filteredWeeks.length * (cellSize + cellGap) + 30;
const W = Math.max(880, gridWidth);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 230" width="100%">
  <defs>
    <filter id="glow-cell">
      <feGaussianBlur stdDeviation="1.2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-dim">
      <feGaussianBlur stdDeviation="0.6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="phosphor">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="gengar-glow">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:#0a1a0a; stop-opacity:0"/>
      <stop offset="100%" style="stop-color:#000000; stop-opacity:0.5"/>
    </radialGradient>
    <pattern id="scan" patternUnits="userSpaceOnUse" width="${W}" height="3">
      <rect width="${W}" height="1.5" fill="transparent"/>
      <rect y="1.5" width="${W}" height="1.5" fill="rgba(0,0,0,0.1)"/>
    </pattern>
  </defs>

  <style>
    text { font-family: "Courier New", Consolas, monospace; }
    @keyframes flicker {
      0%, 100% { opacity: 0.97; }
      93% { opacity: 0.90; }
      94% { opacity: 0.97; }
    }
    @keyframes ghost-float {
      0%, 100% { transform: translate(0px, 0px); }
      25% { transform: translate(3px, -2px); }
      50% { transform: translate(0px, -3px); }
      75% { transform: translate(-3px, -2px); }
    }
    @keyframes ghost-fade {
      0%, 100% { opacity: 0.12; }
      50% { opacity: 0.3; }
    }
    .screen { animation: flicker 5s infinite; }
    .ghost {
      animation: ghost-float 4s ease-in-out infinite, ghost-fade 6s ease-in-out infinite;
    }
  </style>

  <!-- Casing -->
  <rect width="${W}" height="215" rx="12" fill="#1a1a0e"/>
  <rect x="3" y="3" width="${W - 6}" height="224" rx="10" fill="#0d0d06" stroke="#2a2a1a" stroke-width="2"/>
  <circle cx="14" cy="14" r="3" fill="none" stroke="#3a3a2a" stroke-width="1"/>
  <circle cx="${W - 14}" cy="14" r="3" fill="none" stroke="#3a3a2a" stroke-width="1"/>

  <!-- Screen -->
  <rect x="8" y="8" width="${W - 16}" height="214" rx="8" fill="#0a1a0a"/>

  <g class="screen">
    <text x="30" y="30" font-size="13" fill="#00ff41" filter="url(#phosphor)" letter-spacing="3">WASTELAND LOG</text>
    <text x="${W - 30}" y="30" text-anchor="end" font-size="11" fill="#00ff41" filter="url(#glow-cell)" letter-spacing="1" opacity="0.7">${total} COMMITS</text>

    <text x="${W - 280}" y="48" font-size="8" fill="#00ff41" opacity="0.3">LESS</text>
    <rect x="${W - 250}" y="40" width="10" height="10" rx="2" fill="#0a1a0a" stroke="#00ff41" stroke-width="0.3" stroke-opacity="0.2"/>
    <rect x="${W - 236}" y="40" width="10" height="10" rx="2" fill="#0d3a0d"/>
    <rect x="${W - 222}" y="40" width="10" height="10" rx="2" fill="#1a6b1a"/>
    <rect x="${W - 208}" y="40" width="10" height="10" rx="2" fill="#2a9e2a"/>
    <rect x="${W - 194}" y="40" width="10" height="10" rx="2" fill="#00ff41" filter="url(#glow-cell)"/>
    <text x="${W - 180}" y="48" font-size="8" fill="#00ff41" opacity="0.3">MORE</text>

    <line x1="20" y1="55" x2="${W - 20}" y2="55" stroke="#00ff41" stroke-width="0.3" opacity="0.2"/>

${monthLabels}
${dayLabels}
${cells}
    <g class="ghost" filter="url(#gengar-glow)" transform="translate(${ghostX}, ${ghostY}) scale(1.2)">
      <ellipse cx="7.5" cy="8" rx="7" ry="6.5" fill="#00ff41" opacity="0.12"/>
      <path d="M2,5 L0,0 L4,3 Z" fill="#00ff41" opacity="0.1"/>
      <path d="M7.5,2 L7.5,-2 L9,3 Z" fill="#00ff41" opacity="0.1"/>
      <path d="M12,4 L15,1 L13,4 Z" fill="#00ff41" opacity="0.1"/>
      <ellipse cx="5" cy="7" rx="2" ry="1.5" fill="#00ff41" opacity="0.25"/>
      <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#00ff41" opacity="0.25"/>
      <circle cx="5.5" cy="6.8" r="0.7" fill="#0a1a0a"/>
      <circle cx="11" cy="6.8" r="0.7" fill="#0a1a0a"/>
      <path d="M4.5,11 Q5.5,13 7.5,11 Q9.5,13 10.5,11" fill="none" stroke="#00ff41" stroke-width="0.6" opacity="0.2"/>
    </g>

    <text x="${W / 2}" y="218" text-anchor="middle" font-size="8" fill="#00ff41" opacity="0.12" letter-spacing="2">LAST YEAR  //  REUZ</text>

    <!-- Vignette + Scanlines -->
    <rect x="8" y="8" width="${W - 16}" height="214" rx="8" fill="url(#vignette)"/>
    <rect x="8" y="8" width="${W - 16}" height="214" rx="8" fill="url(#scan)"/>
  </g>
</svg>`;

fs.writeFileSync("contributions.svg", svg);
console.log(`Generated: ${filteredWeeks.length} weeks (6mo), ${filteredTotal}/${total} contributions, ghost at (${ghostX},${ghostY})`);
