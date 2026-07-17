/* scene.js — builds the SVG machine (part 1: input, beams, L1, neurons, L2) */
const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('scene');
function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e);
  return e;
}
const Y = i => 70 + i * (340 / 26);
const Yn = j => 60 + j * (350 / 63);
const Yo = k => 136 + k * (220 / 26);
const XCOL = [36, 58, 80, 102], BIASX = 124;
const AMBER = '#ffb347', CYAN = '#5fd7ff', RED = '#ff6b81', GREEN = '#7dffb0',
      DIMC = '#5d7280', EDGE = '#2c4552';
const show = i => (VOCAB[i] === ' ' ? '␣' : VOCAB[i]);
const wstr = w => w.map(show).join('');
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = v => Math.max(0, Math.min(1, v));

const defs = el('defs', {});
defs.innerHTML = '<filter id="glow" x="-80%" y="-80%" width="260%" height="260%">' +
  '<feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/>' +
  '<feMergeNode in="SourceGraphic"/></feMerge></filter>';

function txt(parent, x, y, s, attrs) {
  const t = el('text', Object.assign({ x, y, 'font-family': 'ui-monospace,monospace' }, attrs || {}), parent);
  t.textContent = s;
  return t;
}
function group() { const g = el('g', { 'class': 'dim' }); g.style.transition = 'opacity .45s ease'; return g; }

const stageLabels = {};
[['input', 80, '① INPUT'], ['l1', 268, '② L1 MASKS'], ['neuron', 440, '③ 64 NEURONS'],
 ['l2', 604, '④ L2 MASKS'], ['rails', 800, '⑤ OUTPUT RAILS'], ['wta', 936, '⑥ WINNER-TAKE-ALL'],
 ['output', 1050, '⑦ OUTPUT']].forEach(([k, x, s]) => {
  stageLabels[k] = txt(svg, x, 22, s, { 'text-anchor': 'middle', 'font-size': 11, fill: '#4d6474' });
});

/* input panel */
const gInput = group();
el('rect', { x: 14, y: 44, width: 132, height: 392, rx: 10, fill: '#0e1820', stroke: EDGE }, gInput);
for (let i = 0; i < 27; i++)
  txt(gInput, 8, Y(i) + 3, show(i), { 'text-anchor': 'end', 'font-size': 8, fill: DIMC });
const ledEls = [];
for (let s = 0; s < 4; s++) {
  ledEls[s] = [];
  for (let i = 0; i < 27; i++)
    ledEls[s][i] = el('circle', { cx: XCOL[s], cy: Y(i), r: 3.1, fill: '#101c24', stroke: EDGE, 'stroke-width': 1 }, gInput);
}
const haloEls = [];
for (let s = 0; s < 5; s++) {
  haloEls.push({
    h1: el('circle', { r: 7.5, fill: AMBER, opacity: 0.18 }, gInput),
    h2: el('circle', { r: 5, fill: AMBER, opacity: 0.3 }, gInput),
  });
}
const winHead = [];
for (let s = 0; s < 4; s++)
  winHead.push(txt(gInput, XCOL[s], 40, '', { 'text-anchor': 'middle', 'font-size': 12, fill: AMBER, 'font-weight': 700 }));
txt(gInput, BIASX, Y(0) - 10, 'bias', { 'text-anchor': 'middle', 'font-size': 7, fill: DIMC });
el('circle', { cx: BIASX, cy: Y(0), r: 3.1, fill: AMBER, stroke: '#ffe1ae', filter: 'url(#glow)' }, gInput);

/* beams to L1 */
const gBeams = group();
const beamLines = [];
for (let s = 0; s < 4; s++) {
  beamLines[s] = [];
  [60, 240, 420].forEach(yy =>
    beamLines[s].push(el('line', { x2: 196, y2: yy, stroke: AMBER, 'stroke-width': 0.7 }, gBeams)));
}

/* L1 masks — generated from the actual trained weights */
const gL1 = group();
IMG.l1pos = maskDataURL(W1, 109, 64, true);
IMG.l1neg = maskDataURL(W1, 109, 64, false);
el('image', { href: IMG.l1pos, x: 196, y: 44, width: 74, height: 392, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }, gL1);
el('image', { href: IMG.l1neg, x: 288, y: 44, width: 74, height: 392, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }, gL1);
el('rect', { x: 196, y: 44, width: 74, height: 392, fill: 'none', stroke: '#4a6b78' }, gL1);
el('rect', { x: 288, y: 44, width: 74, height: 392, fill: 'none', stroke: '#4a6b78' }, gL1);
txt(gL1, 233, 446, 'L1_pos', { 'text-anchor': 'middle', 'font-size': 8, fill: '#8fa6b3' });
txt(gL1, 325, 446, 'L1_neg', { 'text-anchor': 'middle', 'font-size': 8, fill: '#8fa6b3' });
txt(gL1, 279, 456, 'printed transparency film', { 'text-anchor': 'middle', 'font-size': 7.5, fill: DIMC });

/* photodiodes + op-amps + drivers */
const gNeuron = group();
const pdPos = [], pdNeg = [], triEls = [], drvEls = [];
for (let j = 0; j < 64; j++) {
  pdPos.push(el('circle', { cx: 398, cy: Yn(j), r: 1.9, fill: AMBER }, gNeuron));
  pdNeg.push(el('circle', { cx: 414, cy: Yn(j), r: 1.9, fill: RED }, gNeuron));
  triEls.push(el('path', { d: `M444,${Yn(j) - 3.4} L444,${Yn(j) + 3.4} L452,${Yn(j)} Z` }, gNeuron));
  drvEls.push(el('circle', { cx: 484, cy: Yn(j), r: 2.2 }, gNeuron));
}
el('circle', { cx: 484, cy: 44, r: 2.2, fill: AMBER }, gNeuron);
txt(gNeuron, 398, 52, '+', { 'text-anchor': 'middle', 'font-size': 6.5, fill: AMBER });
txt(gNeuron, 414, 52, '−', { 'text-anchor': 'middle', 'font-size': 6.5, fill: RED });
txt(gNeuron, 448, 446, 'op-amp: pos−neg → rectifier', { 'text-anchor': 'middle', 'font-size': 7.5, fill: DIMC });
txt(gNeuron, 484, 34, 'bias', { 'text-anchor': 'middle', 'font-size': 6.5, fill: DIMC });

/* L2 masks */
const gL2 = group();
IMG.l2pos = maskDataURL(W2, 65, 27, true);
IMG.l2neg = maskDataURL(W2, 65, 27, false);
el('image', { href: IMG.l2pos, x: 540, y: 130, width: 56, height: 230, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }, gL2);
el('image', { href: IMG.l2neg, x: 612, y: 130, width: 56, height: 230, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }, gL2);
el('rect', { x: 540, y: 130, width: 56, height: 230, fill: 'none', stroke: '#4a6b78' }, gL2);
el('rect', { x: 612, y: 130, width: 56, height: 230, fill: 'none', stroke: '#4a6b78' }, gL2);
txt(gL2, 568, 372, 'L2_pos', { 'text-anchor': 'middle', 'font-size': 8, fill: '#8fa6b3' });
txt(gL2, 640, 372, 'L2_neg', { 'text-anchor': 'middle', 'font-size': 8, fill: '#8fa6b3' });