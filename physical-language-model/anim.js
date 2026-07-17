/* anim.js — state machine + per-cycle visuals */
const PHASES = ['input', 'l1', 'neuron', 'l2', 'rails', 'wta', 'output', 'shift'];
const DUR = { input: 850, l1: 1500, neuron: 1150, l2: 1500, rails: 1700, wta: 1050, output: 1050, shift: 1150 };
const PHASE_TITLE = {
  input: '① Input panel — the window is lit',
  l1: '② Light through the L1 weight masks',
  neuron: '③ 64 op-amp neurons — subtract & rectify',
  l2: '④ Driver LEDs through the L2 masks',
  rails: '⑤ 27 noisy analog output rails',
  wta: '⑥ Winner-take-all — hardware argmax',
  output: '⑦ The winning letter lights up',
  shift: '⑧ Shift register slides the window',
};
function phaseBody(p, c) {
  const nw = [...c.window.slice(1), c.winner];
  switch (p) {
    case 'input': return `The window “${wstr(c.window)}” sits on the panel — 4 LEDs lit of 108 (one per slot), plus the always-on bias line.`;
    case 'l1': return 'Light fans out through the printed L1 masks. 6,468 printed gray squares each attenuate one connection — brighter square, stronger weight.';
    case 'neuron': return `128 photodiodes turn light into current. Each op-amp computes pos − neg, then the precision rectifier clips at zero — ReLU in silicon. ${c.active}/64 neurons fire.`;
    case 'l2': return `The ${c.active} surviving neurons re-drive their LEDs through the L2 masks — 1,698 more printed weights, down to 27 channels.`;
    case 'rails': return `27 analog scores ride the rails. Thermal noise (σ = 0.6 × ${temp.toFixed(2)}) is the sampling temperature — it is what keeps the text from looping.`;
    case 'wta': return `A diode-OR maximum + 27 comparators find the strongest rail. No arithmetic, no processor. Margin over runner-up: ${c.margin.toFixed(3)}.`;
    case 'output': return `“${show(c.winner)}” wins. Its LED lights and the letter joins the generated text below.`;
    case 'shift': return `The 108-bit window slides one step: “${wstr(c.window)}” → “${wstr(nw)}”. The loop closes — next character.`;
  }
}

let rng = makeRng(7);
let cycle = forward(SEED, 1, rng);
let temp = 1, speed = 1, playing = true, idx = 0, t = 0, last = performance.now();
let text = 'the ', charCount = 0, stepping = false, loopStuck = false;
const seen = new Map();
let rMin = 0, rMax = 1, hMax = 1;
const rn = k => (cycle.rails[k] - rMin) / (rMax - rMin + 1e-9);

const $ = id => document.getElementById(id);
const barsEl = $('bars'), barlblEl = $('barlbl');
const barDivs = [];
for (let k = 0; k < 27; k++) barDivs.push(barsEl.appendChild(document.createElement('i')));
for (let k = 0; k < 27; k++) {
  const s = document.createElement('span');
  s.textContent = show(k);
  barlblEl.appendChild(s);
}

function applyCycle() {
  const c = cycle;
  rMin = Math.min(...c.rails); rMax = Math.max(...c.rails);
  hMax = Math.max(...c.hidden, 1e-9);
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 27; i++) {
      const lit = c.window[s] === i, e = ledEls[s][i];
      e.setAttribute('fill', lit ? AMBER : '#101c24');
      e.setAttribute('stroke', lit ? '#ffe1ae' : EDGE);
      if (lit) e.setAttribute('filter', 'url(#glow)'); else e.removeAttribute('filter');
    }
    winHead[s].textContent = show(c.window[s]);
    haloEls[s].h1.setAttribute('cx', XCOL[s]); haloEls[s].h1.setAttribute('cy', Y(c.window[s]));
    haloEls[s].h2.setAttribute('cx', XCOL[s]); haloEls[s].h2.setAttribute('cy', Y(c.window[s]));
    beamLines[s].forEach(L => {
      L.setAttribute('x1', XCOL[s] + 4); L.setAttribute('y1', Y(c.window[s]));
    });
  }
  haloEls[4].h1.setAttribute('cx', BIASX); haloEls[4].h1.setAttribute('cy', Y(0));
  haloEls[4].h2.setAttribute('cx', BIASX); haloEls[4].h2.setAttribute('cy', Y(0));
  for (let j = 0; j < 64; j++) {
    const h = c.hidden[j] / hMax;
    pdPos[j].setAttribute('opacity', 0.25 + 0.6 * h);
    pdNeg[j].setAttribute('opacity', 0.15 + 0.5 * h);
    triEls[j].setAttribute('fill', c.hidden[j] > 0 ? GREEN : '#132029');
    drvEls[j].setAttribute('fill', c.hidden[j] > 0 ? AMBER : '#101c24');
  }
  for (let k = 0; k < 27; k++) {
    odPos[k].setAttribute('opacity', 0.2 + 0.7 * rn(k));
    odNeg[k].setAttribute('opacity', 0.12 + 0.45 * rn(k));
    wtaLines[k].setAttribute('stroke', k === c.winner ? AMBER : EDGE);
    wtaLines[k].setAttribute('stroke-width', k === c.winner ? 2 : 0.7);
  }
  winArrow.setAttribute('y2', Y(c.winner));
  bigChar.textContent = show(c.winner);
  for (let i = 0; i < 27; i++) {
    const win = i === c.winner;
    outLbl[i].setAttribute('fill', win ? '#fff' : DIMC);
    outLbl[i].setAttribute('font-size', win ? 11 : 8);
    outLbl[i].setAttribute('font-weight', win ? 700 : 400);
  }
  const tiles = [...c.window, c.winner];
  for (let i = 0; i < 5; i++) {
    tileEls[i].t1.textContent = show(tiles[i]);
    tileEls[i].t2.textContent = i === 4 ? 'new' : 'slot ' + i;
    tileEls[i].r.setAttribute('fill', i === 4 ? '#1a2a1e' : '#0e1820');
    tileEls[i].r.setAttribute('stroke', i === 4 ? GREEN : EDGE);
    tileEls[i].t1.setAttribute('fill', i === 4 ? GREEN : AMBER);
  }
  $('stNeurons').textContent = c.active + '/64';
  $('stWinner').textContent = show(c.winner);
  $('stMargin').textContent = c.margin.toFixed(3);
  for (let k = 0; k < 27; k++) {
    barDivs[k].style.height = (8 + 92 * rn(k)) + '%';
    barDivs[k].className = k === c.winner ? 'win' : '';
  }
}

function renderConsole() {
  const t400 = text.slice(-400);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = esc(t400.slice(0, -1)) + '<span class="last">' + esc(t400.slice(-1)) + '</span>';
  $('genText').innerHTML = body + '<span class="cursor"></span>';
  $('stChars').textContent = charCount;
}

function setPhase(p) {
  $('phaseTitle').textContent = PHASE_TITLE[p];
  $('phaseBody').textContent = phaseBody(p, cycle);
}

function enterPhase(p) {
  if (p === 'output') {
    text += VOCAB[cycle.winner];
    charCount++;
    renderConsole();
  }
  if (p === 'shift') {
    const nw = [...cycle.window.slice(1), cycle.winner];
    cycle = forward(nw, temp, rng);
    const key = nw.join(',');
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    loopStuck = temp < 0.05 && n >= 3;
    $('warn').classList.toggle('show', loopStuck);
    applyCycle();
  }
  if (p === 'input' && stepping) { stepping = false; setPlaying(false); }
  setPhase(p);
}