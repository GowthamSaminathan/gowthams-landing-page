/* anim2.js — per-frame render, main loop, controls, init */
const GROUPS = { gInput, gBeams, gL1, gNeuron, gL2, gOut, gWta, gOutLed, gShift };
function render(now) {
  const phase = PHASES[idx], c = cycle;
  const on = {
    gInput: ['input', 'l1', 'shift'], gBeams: ['l1'], gL1: ['l1'],
    gNeuron: ['l1', 'neuron'], gL2: ['l2'], gOut: ['l2', 'rails', 'wta'],
    gWta: ['wta', 'output'], gOutLed: ['wta', 'output'], gShift: ['shift'],
  };
  for (const g in on) GROUPS[g].style.opacity = on[g].includes(phase) ? 1 : 0.38;
  for (const k in stageLabels) {
    stageLabels[k].setAttribute('fill', k === phase ? AMBER : '#4d6474');
    stageLabels[k].setAttribute('font-weight', k === phase ? 700 : 400);
  }
  const pulse = phase === 'input' ? 0.55 + 0.45 * Math.sin(now / 110) : 1;
  haloEls.forEach(h => { h.h1.setAttribute('opacity', 0.18 * pulse + 0.06); });
  for (let j = 0; j < 64; j++) {
    const h = c.hidden[j] / hMax;
    const flash = phase === 'neuron' && c.hidden[j] > 0 ? 0.7 + 0.3 * Math.sin(now / 60 + j) : 1;
    triEls[j].setAttribute('opacity', (0.15 + 0.85 * h) * flash);
    drvEls[j].setAttribute('opacity', (0.12 + 0.88 * h) * flash);
  }
  let n = 0;
  const fire = (x, y, op) => {
    if (n >= PULSES.length) return;
    const p = PULSES[n++];
    p.setAttribute('cx', x); p.setAttribute('cy', y); p.setAttribute('opacity', op);
    p.style.display = 'block';
  };
  if (phase === 'l1') {
    const srcs = c.window.map((ch, s) => [XCOL[s], Y(ch)]);
    srcs.push([BIASX, Y(0)]);
    srcs.forEach(([sx, sy], si) => {
      for (let p = 0; p < 4; p++) {
        const tt = t * 1.9 - p * 0.14 - si * 0.05;
        if (tt <= 0 || tt >= 1) continue;
        const ty = Yn((si * 17 + p * 29) % 64);
        fire(sx + (398 - sx) * tt, sy + (ty - sy) * tt, 0.95 - tt * 0.5);
      }
    });
  } else if (phase === 'l2') {
    let i2 = 0;
    for (let j = 0; j < 64; j++) {
      if (c.hidden[j] <= 0) continue;
      for (let p = 0; p < 2; p++) {
        const tt = t * 1.9 - i2 * 0.09 - p * 0.16;
        if (tt <= 0 || tt >= 1) continue;
        const ty = Yo((j * 7 + p * 13) % 27);
        fire(486 + (700 - 486) * tt, Yn(j) + (ty - Yn(j)) * tt, 0.95 - tt * 0.5);
      }
      i2++;
    }
  }
  for (; n < PULSES.length; n++) PULSES[n].style.display = 'none';
  for (let k = 0; k < 27; k++) {
    const amp = phase === 'rails' ? 1.2 + 2.6 * temp : 0.5 + 0.4 * temp;
    let pts = '';
    for (let i = 0; i <= 17; i++)
      pts += (742 + i * (120 / 17)).toFixed(1) + ',' + (Yo(k) + Math.sin(now / 75 + k * 2.1 + i * 1.25) * amp).toFixed(1) + ' ';
    const win = k === c.winner && ['rails', 'wta', 'output'].includes(phase);
    railEls[k].setAttribute('points', pts);
    railEls[k].setAttribute('stroke', win ? AMBER : '#c98f3d');
    railEls[k].setAttribute('stroke-width', win ? 2.6 : 1.1);
    railEls[k].setAttribute('opacity', win ? 1 : 0.15 + 0.55 * rn(k));
    if (win) railEls[k].setAttribute('filter', 'url(#glow)'); else railEls[k].removeAttribute('filter');
  }
  const wtaOn = ['wta', 'output'].includes(phase);
  for (let k = 0; k < 27; k++)
    wtaLines[k].setAttribute('opacity', wtaOn ? (k === c.winner ? 1 : 0.35) : (phase === 'input' ? 0 : 0.12));
  wtaRect.setAttribute('stroke-width', phase === 'wta' ? 1.4 + 1.6 * Math.abs(Math.sin(now / 130)) : 1.2);
  winArrow.setAttribute('opacity', wtaOn ? 1 : 0);
  for (let i = 0; i < 27; i++) {
    const win = i === c.winner && ['output', 'shift'].includes(phase);
    const pop = win && phase === 'output' ? 1 + 0.5 * Math.sin(Math.PI * clamp01(t * 1.3)) : 1;
    outHalo[i].setAttribute('opacity', win ? 0.16 : 0);
    outLed[i].setAttribute('r', 3.6 * (win ? pop : 1));
    outLed[i].setAttribute('fill', win ? AMBER : '#101c24');
    outLed[i].setAttribute('stroke', win ? '#ffe1ae' : EDGE);
    if (win) outLed[i].setAttribute('filter', 'url(#glow)'); else outLed[i].removeAttribute('filter');
  }
  bigChar.setAttribute('opacity', ['output', 'shift'].includes(phase) ? 1 : 0.15);
  const slide = phase === 'shift' ? ease(t) : 0;
  for (let i = 0; i < 5; i++) {
    const x = 300 + i * 118 - 118 * slide;
    const fading = i === 0 ? 1 - slide : i === 4 ? slide : 1;
    tileEls[i].r.setAttribute('x', x);
    tileEls[i].t1.setAttribute('x', x + 48);
    tileEls[i].t2.setAttribute('x', x + 48);
    tileEls[i].g.setAttribute('opacity', fading);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = now - last;
  last = now;
  if (!playing) return;
  t += dt / (DUR[PHASES[idx]] / speed);
  if (t >= 1) {
    t = 0;
    idx = (idx + 1) % PHASES.length;
    enterPhase(PHASES[idx]);
  }
  render(now);
}

function setPlaying(p) {
  playing = p;
  $('btnPlay').textContent = playing ? '❚❚ pause' : '▶ run';
  $('btnStep').disabled = playing;
}
$('btnPlay').onclick = () => setPlaying(!playing);
$('btnStep').onclick = () => { stepping = true; setPlaying(true); };
document.querySelectorAll('.speeds button').forEach(b => {
  b.onclick = () => {
    speed = parseFloat(b.dataset.s);
    document.querySelectorAll('.speeds button').forEach(x => x.classList.toggle('on', x === b));
  };
});
$('tempSlider').oninput = e => {
  temp = parseFloat(e.target.value);
  $('tempVal').textContent = temp.toFixed(2);
  cycle = forward(cycle.window, temp, rng);
  applyCycle();
  setPhase(PHASES[idx]);
};
$('btnReset').onclick = () => {
  rng = makeRng(7);
  seen.clear();
  cycle = forward(SEED, temp, rng);
  text = 'the '; charCount = 0; idx = 0; t = 0; loopStuck = false;
  $('warn').classList.remove('show');
  applyCycle(); renderConsole(); setPhase('input');
};

applyCycle();
renderConsole();
setPhase('input');
requestAnimationFrame(frame);