/* engine.js — the physics: frozen 2% component error + analog noise, exact port of the kit */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const M1 = new Float64Array(109 * 64), M2 = new Float64Array(65 * 27);
{
  const r = makeRng(1337);
  for (let i = 0; i < M1.length; i++) M1[i] = W1[i] / 15 + gauss(r) * 0.02;
  for (let i = 0; i < M2.length; i++) M2[i] = W2[i] / 15 + gauss(r) * 0.02;
}
const SEED = [19, 7, 4, 26];
function forward(window, temp, rng) {
  const rows = [window[0], 27 + window[1], 54 + window[2], 81 + window[3], 108];
  const hidden = new Float64Array(64);
  let active = 0;
  for (let j = 0; j < 64; j++) {
    let z = 0;
    for (const r of rows) z += M1[r * 64 + j];
    if (z > 0) { hidden[j] = z; active++; }
  }
  const clean = new Float64Array(27);
  for (let k = 0; k < 27; k++) {
    let s = M2[64 * 27 + k];
    for (let j = 0; j < 64; j++) if (hidden[j] !== 0) s += hidden[j] * M2[j * 27 + k];
    clean[k] = s;
  }
  const rails = new Float64Array(27);
  let winner = 0;
  for (let k = 0; k < 27; k++) {
    rails[k] = clean[k] + gauss(rng) * 0.6 * temp;
    if (rails[k] > rails[winner]) winner = k;
  }
  let best = -Infinity, second = -Infinity;
  for (let k = 0; k < 27; k++) {
    if (rails[k] > best) { second = best; best = rails[k]; }
    else if (rails[k] > second) second = rails[k];
  }
  return { window, hidden, rails, clean, winner, margin: best - second, active };
}
/* weight masks drawn straight from the trained levels — no image files needed */
function maskDataURL(W, rows, cols, pos) {
  const cv = document.createElement('canvas');
  cv.width = cols; cv.height = rows;
  const ctx = cv.getContext('2d');
  const im = ctx.createImageData(cols, rows);
  for (let i = 0; i < rows * cols; i++) {
    const v = pos ? Math.max(0, W[i]) : Math.max(0, -W[i]);
    const g = Math.round(v / 15 * 255);
    im.data[i * 4] = g; im.data[i * 4 + 1] = g; im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  return cv.toDataURL('image/png');
}
const IMG = {};