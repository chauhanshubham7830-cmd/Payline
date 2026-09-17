const defaultPaylines = ['1,1,1,1,1', '2,2,2,2,2', '3,3,3,3,3', '1,2,3,2,1', '3,2,1,2,3'];
const state = { reels: 5, rows: 3, paylines: [...defaultPaylines] };
const bulkInput = document.getElementById('bulkPaylinesInput');
const preview = document.getElementById('paylinePreview');
const errorBox = document.getElementById('errorBox');
const reelsInput = document.getElementById('reelsInput');
const rowsInput = document.getElementById('rowsInput');

function parseLine(value) { return String(value).trim().split(/[\s,]+/).filter(Boolean); }
function normalizeLine(line) {
  const values = parseLine(line).map(Number);
  return values.includes(0) ? values.map((value) => value + 1) : values;
}
function showError(message) { errorBox.textContent = message; errorBox.classList.remove('hidden'); }
function clearError() { errorBox.textContent = ''; errorBox.classList.add('hidden'); }
function syncInput() { state.paylines = bulkInput.value.split('\n').map((line) => line.trim()).filter(Boolean); }
function updateDimensions() {
  state.reels = Math.max(3, Number(reelsInput.value) || 5);
  state.rows = Math.max(3, Number(rowsInput.value) || 3);
  reelsInput.value = state.reels;
  rowsInput.value = state.rows;
}
function validate(line) {
  const values = parseLine(line);
  if (values.length !== state.reels) return `Each payline must contain exactly ${state.reels} numbers.`;
  const zeroBased = values.includes('0');
  const minimum = zeroBased ? 0 : 1;
  const maximum = zeroBased ? state.rows - 1 : state.rows;
  if (values.some((value) => Number(value) < minimum || Number(value) > maximum || !/^\d+$/.test(value))) {
    return `Values must be whole numbers from ${minimum} to ${maximum}.`;
  }
  return null;
}
function createGrid(line, index) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 500 300');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Payline ${index + 1}`);
  const padding = 24;
  const gridWidth = (500 - padding * 2) / state.reels;
  const gridHeight = (300 - padding * 2) / state.rows;
  for (let row = 0; row <= state.rows; row += 1) {
    const y = padding + row * gridHeight;
    const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineElement.setAttribute('x1', padding); lineElement.setAttribute('y1', y);
    lineElement.setAttribute('x2', 500 - padding); lineElement.setAttribute('y2', y);
    lineElement.classList.add('grid-line'); svg.appendChild(lineElement);
  }
  for (let col = 0; col <= state.reels; col += 1) {
    const x = padding + col * gridWidth;
    const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineElement.setAttribute('x1', x); lineElement.setAttribute('y1', padding);
    lineElement.setAttribute('x2', x); lineElement.setAttribute('y2', 300 - padding);
    lineElement.classList.add('grid-line'); svg.appendChild(lineElement);
  }
  const points = line.map((value, col) => `${padding + (col + 0.5) * gridWidth},${padding + (Number(value) - 0.5) * gridHeight}`);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('points', points.join(' ')); path.classList.add('payline-path'); svg.appendChild(path);
  points.forEach((point) => {
    const [cx, cy] = point.split(',');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', 14);
    dot.classList.add('payline-dot'); svg.appendChild(dot);
  });
  return svg;
}
function render() {
  preview.innerHTML = '';
  const validLines = state.paylines.map(normalizeLine).filter((line) => !validate(line.join(',')));
  if (!validLines.length) { preview.innerHTML = '<p class="empty-state">No valid paylines to display.</p>'; return; }
  validLines.forEach((line, index) => {
    const card = document.createElement('article'); card.className = 'payline-card';
    const heading = document.createElement('h3'); heading.textContent = `Line ${index + 1}`;
    const copyButton = document.createElement('button'); copyButton.className = 'copy-button'; copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => navigator.clipboard.writeText(line.join(',')));
    const chart = document.createElement('div'); chart.className = 'chart'; chart.appendChild(createGrid(line, index));
    const header = document.createElement('div'); header.className = 'card-header'; header.append(heading, copyButton);
    card.append(header, chart); preview.appendChild(card);
  });
}
function generate() {
  clearError(); updateDimensions(); syncInput();
  const invalidIndex = state.paylines.findIndex((line) => validate(line));
  if (invalidIndex !== -1) { showError(`Invalid payline at Line ${invalidIndex + 1}: ${validate(state.paylines[invalidIndex])}`); return; }
  render();
}
document.getElementById('generateBtn').addEventListener('click', generate);
document.getElementById('resetBtn').addEventListener('click', () => { state.paylines = [...defaultPaylines]; state.reels = 5; state.rows = 3; reelsInput.value = 5; rowsInput.value = 3; bulkInput.value = state.paylines.join('\n'); clearError(); render(); });
document.getElementById('addPaylineBtn').addEventListener('click', () => { state.paylines.push('1,1,1,1,1'); bulkInput.value = state.paylines.join('\n'); render(); });
document.getElementById('copyAllBtn').addEventListener('click', () => navigator.clipboard.writeText(state.paylines.join('\n')));
document.getElementById('exportBtn').addEventListener('click', async () => {
  const canvas = await html2canvas(preview, { backgroundColor: '#ffffff', scale: 2 });
  const link = document.createElement('a'); link.download = 'slot-paylines.png'; link.href = canvas.toDataURL('image/png'); link.click();
});
bulkInput.value = defaultPaylines.join('\n');
bulkInput.addEventListener('input', () => { syncInput(); render(); });
reelsInput.addEventListener('change', generate); rowsInput.addEventListener('change', generate);
render();