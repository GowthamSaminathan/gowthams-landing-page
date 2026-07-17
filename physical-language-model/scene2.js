/* scene2.js — output diodes, rails, winner-take-all, output LEDs, shift register */
const gOut = group();
const odPos = [], odNeg = [], railEls = [];
for (let k = 0; k < 27; k++) {
  odPos.push(el('circle', { cx: 700, cy: Yo(k), r: 2, fill: AMBER }, gOut));
  odNeg.push(el('circle', { cx: 714, cy: Yo(k), r: 2, fill: RED }, gOut));
  railEls.push(el('polyline', { fill: 'none', stroke: '#c98f3d' }, gOut));
}
txt(gOut, 802, 126, '27 rails · noise σ=0.6×T', { 'text-anchor': 'middle', 'font-size': 7.5, fill: DIMC });

const gWta = group();
const wtaLines = [];
for (let k = 0; k < 27; k++)
  wtaLines.push(el('line', { x1: 864, y1: Yo(k), x2: 894, y2: 245, stroke: EDGE, 'stroke-width': 0.7, opacity: 0.12 }, gWta));
const wtaRect = el('rect', { x: 894, y: 205, width: 86, height: 80, rx: 9, fill: '#121d26', stroke: CYAN, 'stroke-width': 1.2 }, gWta);
txt(gWta, 937, 232, 'WINNER-', { 'text-anchor': 'middle', 'font-size': 9.5, fill: CYAN, 'font-weight': 700 });
txt(gWta, 937, 245, 'TAKE-ALL', { 'text-anchor': 'middle', 'font-size': 9.5, fill: CYAN, 'font-weight': 700 });
txt(gWta, 937, 259, 'analog max', { 'text-anchor': 'middle', 'font-size': 7.5, fill: DIMC });
const winArrow = el('line', { x1: 980, y1: 245, x2: 1022, y2: 245, stroke: AMBER, 'stroke-width': 2.2, filter: 'url(#glow)', opacity: 0 }, gWta);

const gOutLed = group();
const outLbl = [], outLed = [], outHalo = [];
for (let i = 0; i < 27; i++) {
  outLbl.push(txt(gOutLed, 1018, Y(i) + 3, show(i), { 'text-anchor': 'end', 'font-size': 8, fill: DIMC }));
  outHalo.push(el('circle', { cx: 1036, cy: Y(i), r: 11, fill: AMBER, opacity: 0 }, gOutLed));
  outLed.push(el('circle', { cx: 1036, cy: Y(i), r: 3.6, fill: '#101c24', stroke: EDGE, 'stroke-width': 1 }, gOutLed));
}
txt(gOutLed, 1130, 210, 'next character', { 'text-anchor': 'middle', 'font-size': 11, fill: '#8fa6b3', 'font-family': 'Inter,sans-serif' });
const bigChar = txt(gOutLed, 1130, 268, '', { 'text-anchor': 'middle', 'font-size': 58, fill: AMBER, 'font-weight': 700, filter: 'url(#glow)', opacity: 0.15 });

const gShift = group();
el('path', { d: 'M1072,440 L1072,528 L760,528', fill: 'none', stroke: '#3d5563', 'stroke-width': 1.4, 'stroke-dasharray': '5 5', 'class': 'flow-dash' }, gShift);
el('path', { d: 'M252,528 L80,528 L80,442', fill: 'none', stroke: '#3d5563', 'stroke-width': 1.4, 'stroke-dasharray': '5 5', 'class': 'flow-dash' }, gShift);
txt(gShift, 500, 492, 'SHIFT REGISTER — the 108-bit window slides one step, the loop re-fires',
  { 'text-anchor': 'middle', 'font-size': 9, fill: DIMC });
const tileEls = [];
for (let i = 0; i < 5; i++) {
  const g = el('g', {}, gShift);
  const r = el('rect', { y: 504, width: 96, height: 42, rx: 8 }, g);
  const t1 = txt(g, 0, 531, '', { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700 });
  const t2 = txt(g, 0, 559, '', { 'text-anchor': 'middle', 'font-size': 7, fill: DIMC });
  tileEls.push({ g, r, t1, t2 });
}

const PULSES = [];
for (let i = 0; i < 40; i++)
  PULSES.push(el('circle', { r: 2.6, fill: AMBER, filter: 'url(#glow)', style: 'display:none' }));