/*
 * ISE Day 2026 Story Generator
 *
 * Everything runs client-side. The uploaded photo is read with FileReader and
 * drawn straight to a canvas — it is never sent anywhere.
 *
 * The renderer is resolution-independent: render(ctx, W, H) reads percentage
 * coordinates from templates.js, so the same code paints the 1080x1350 preview
 * and the 2160x2700 export.
 */

import { TEMPLATES, CANVAS_W, CANVAS_H, SLIDE_IN, WOLFPACK_RED, caption } from './templates.js';

/* ---------------------------------------------------------------- state */

const state = {
  tpl: TEMPLATES[0],
  values: {},                                  // fieldKey -> string
  photo: null,                                 // HTMLImageElement | null
  crop: { zoom: 1, ox: 0, oy: 0 },             // ox/oy as a fraction of box size
  frames: new Map(),                           // id -> HTMLImageElement
  logos: {}
};

const $ = (id) => document.getElementById(id);
const els = {
  picker: $('picker'), form: $('form'), canvas: $('preview'), status: $('status'),
  photo: $('photo'), filename: $('filename'), crop: $('crop'), zoom: $('zoom'),
  download: $('download'), captionText: $('captionText'), copyCaption: $('copyCaption')
};
const ctx = els.canvas.getContext('2d');

/* ------------------------------------------------------------- plumbing */

const loadImage = (src) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => rej(new Error(`Could not load ${src}`));
  img.src = src;
});

async function frameFor(tpl) {
  if (!state.frames.has(tpl.id)) {
    state.frames.set(tpl.id, await loadImage(`assets/frames/${tpl.id}.jpg`));
  }
  return state.frames.get(tpl.id);
}

// Points at the original 11.25in slide scale -> pixels on a W-wide canvas.
const ptPx = (pt, W) => (pt / 72) * (W / SLIDE_IN);

const fontStr = (p, W, scale = 1) =>
  `${p.weight || 400} ${ptPx(p.pt, W) * scale}px ${p.font}, Arial, sans-serif`;

/* ------------------------------------------------------------ text draw */

/** Greedy word wrap. Respects explicit newlines. */
function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    if (para.trim() === '') { out.push(''); continue; }
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

/**
 * Lay out a slot's paragraphs at a given scale, returning the lines and the
 * total height. Pure measurement — nothing is painted.
 */
function layout(ctx, slot, W, scale) {
  const inset = slot.inset || { x: 0, y: 0 };
  const maxW = (slot.box.w - inset.x * 2) / 100 * W;
  const lines = [];
  let h = 0;
  let intended = 0;                    // lines the user actually typed

  for (const p of slot.paragraphs) {
    const raw = (state.values[p.from] || '').trim();
    if (!raw) continue;
    const text = p.uppercase ? raw.toUpperCase() : raw;
    intended += text.split('\n').filter((l) => l.trim() !== '').length;
    ctx.font = fontStr(p, W, scale);
    const lh = ptPx(p.pt, W) * scale * (p.lineHeight || 1.2);
    for (const l of wrap(ctx, text, maxW)) { lines.push({ text: l, p, lh }); h += lh; }
  }
  return { lines, height: h, intended };
}

/**
 * Draw a slot, shrinking the type until it fits its box.
 *
 * This is the failure the 2025 prototype had: text that overflowed its box was
 * simply painted past the edge (or off-canvas entirely). Here we measure first
 * and step the scale down until the block fits, so a long story always lands
 * inside its frame.
 */
function drawSlot(ctx, slot, W, H) {
  const inset = slot.inset || { x: 0, y: 0 };
  const bx = slot.box.x / 100 * W + inset.x / 100 * W;
  const by = slot.box.y / 100 * H + inset.y / 100 * H;
  const bw = (slot.box.w - inset.x * 2) / 100 * W;
  const bh = (slot.box.h - inset.y * 2) / 100 * H;

  let scale = 1, out = layout(ctx, slot, W, scale);
  if (slot.autofit) {
    // Floor exists so type never shrinks below the size its contrast ratio was
    // checked at — see the tellme_2 story note in templates.js.
    const floor = slot.minScale ?? 0.6;
    const tooTall = () => out.height > bh;
    const tooMany = () => slot.maxLines && out.lines.length > slot.maxLines;
    // `fitLines` slots are the ones whose form field says "one per line" —
    // a name, a job title, a degree. Letting those wrap strands a word on its
    // own line ("…Class of / 2015"), so shrink the type to keep the breaks the
    // user actually typed.
    const wrapped = () => slot.fitLines && out.lines.length > out.intended;
    while ((tooTall() || tooMany() || wrapped()) && scale > floor) {
      scale -= 0.02;
      out = layout(ctx, slot, W, scale);
    }
  }
  if (!out.lines.length) return;

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = slot.align === 'center' ? 'center' : 'left';
  const x = slot.align === 'center' ? bx + bw / 2 : bx;

  let y = by;
  for (const ln of out.lines) {
    ctx.font = fontStr(ln.p, W, scale);
    ctx.fillStyle = ln.p.color;
    // baseline sits ~80% down the line box, which matches PowerPoint closely enough
    ctx.fillText(ln.text, x, y + ln.lh * 0.8);
    y += ln.lh;
  }
}

/** The shared "Celebrate #ISEDay on Sept. 14!" call-to-action. */
function drawFooter(ctx, tpl, W, H) {
  const f = tpl.footer;
  if (!f) return;                                     // baked into the frame art
  const base = f.color;
  let y = (f.box.y + f.inset.y) / 100 * H;
  const x = (f.box.x + f.inset.x) / 100 * W;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const line of f.lines) {
    const lh = ptPx(line.pt, W) * 1.2;
    ctx.font = `700 ${ptPx(line.pt, W)}px Montserrat, Arial, sans-serif`;
    let cx = x;
    for (const run of line.runs) {
      ctx.fillStyle = run.accent ? f.accent : base;
      ctx.fillText(run.t, cx, y + lh * 0.8);
      cx += ctx.measureText(run.t).width;
    }
    y += lh;
  }
}

/**
 * NC State co-branding: a Wolfpack Red rule over the departmental ISE logo.
 *
 * A full-width red band isn't possible here — the bottom of every frame is
 * already occupied (ISE Day logo, or the baked-in footer), and differently in
 * each one. So the lockup is placed per template in that frame's clear space,
 * with the red rule carrying the brand color. Red as a keyline rather than as
 * type avoids the contrast problem of #CC0000 on navy.
 */
function drawCobrand(ctx, tpl, W, H) {
  const c = tpl.cobrand;
  const logo = state.logos[c.variant];
  if (!c || !logo) return;

  // Rule and gap are proportional to the lockup width, so resizing `cobrand.w`
  // scales the whole mark as a unit instead of leaving a hairline rule under a
  // large logo.
  const w = c.w / 100 * W;
  const ruleH = w * 0.014;
  const gap = w * 0.038;
  const x = c.x / 100 * W;
  const y = c.y / 100 * H;

  ctx.fillStyle = WOLFPACK_RED;
  ctx.fillRect(x, y, w, ruleH);
  ctx.drawImage(logo, x, y + ruleH + gap, w, w * (logo.height / logo.width));
}

/* -------------------------------------------------------------- photo */

/** Geometry of the photo clip region, in canvas pixels. */
const photoBox = (tpl, W, H) => ({
  x: tpl.photo.x / 100 * W, y: tpl.photo.y / 100 * H,
  w: tpl.photo.w / 100 * W, h: tpl.photo.h / 100 * H
});

/** Where the photo lands, given the current zoom/offset. Clamped to cover the box. */
function photoRect(box) {
  const img = state.photo;
  const cover = Math.max(box.w / img.width, box.h / img.height);
  const s = cover * state.crop.zoom;
  const dw = img.width * s, dh = img.height * s;
  const maxOX = Math.max(0, (dw - box.w) / 2);
  const maxOY = Math.max(0, (dh - box.h) / 2);
  const ox = Math.max(-maxOX, Math.min(maxOX, state.crop.ox * box.w));
  const oy = Math.max(-maxOY, Math.min(maxOY, state.crop.oy * box.h));
  return { x: box.x + (box.w - dw) / 2 + ox, y: box.y + (box.h - dh) / 2 + oy, w: dw, h: dh };
}

function drawPhoto(ctx, tpl, W, H) {
  if (!state.photo) return;
  const box = photoBox(tpl, W, H);
  const r = photoRect(box);

  ctx.save();
  ctx.beginPath();
  if (tpl.photo.shape === 'ellipse') {
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, box.w / 2, box.h / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(box.x, box.y, box.w, box.h);
  }
  ctx.clip();
  ctx.drawImage(state.photo, r.x, r.y, r.w, r.h);
  ctx.restore();
}

/* --------------------------------------------------------------- render */

async function render(ctx, W, H, tpl = state.tpl) {
  const frame = await frameFor(tpl);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(frame, 0, 0, W, H);
  drawPhoto(ctx, tpl, W, H);
  for (const slot of tpl.slots) drawSlot(ctx, slot, W, H);
  drawFooter(ctx, tpl, W, H);
  drawCobrand(ctx, tpl, W, H);
}

let pending = false;
function scheduleRender() {
  if (pending) return;
  pending = true;
  const run = async () => {
    pending = false;
    try { await render(ctx, els.canvas.width, els.canvas.height); }
    catch (e) { els.status.textContent = e.message; }
  };
  // rAF is paused entirely while the tab is in the background, which would
  // leave the preview stale. Fall back to a timer so state still converges.
  if (document.hidden) setTimeout(run, 0);
  else requestAnimationFrame(run);
}

/* ------------------------------------------------------------------ UI */

function buildPicker() {
  els.picker.innerHTML = '<legend class="sr-only">Template</legend>';
  for (const t of TEMPLATES) {
    const d = document.createElement('div');
    d.className = 'tpl';
    d.innerHTML = `
      <input type="radio" name="tpl" id="tpl_${t.id}" value="${t.id}"
             ${t.id === state.tpl.id ? 'checked' : ''}>
      <label for="tpl_${t.id}">
        <img src="assets/thumbs/${t.id}.jpg" alt="" loading="lazy">
        <span class="cap"><b>${t.label}</b>${t.variant} &middot; ${t.blurb}</span>
      </label>`;
    d.querySelector('input').addEventListener('change', () => selectTemplate(t));
    els.picker.appendChild(d);
  }
}

function buildForm() {
  els.form.innerHTML = '';
  for (const f of state.tpl.fields) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const id = `f_${f.key}`;
    const multi = f.type === 'textarea';
    wrap.innerHTML = `
      <label class="lbl" for="${id}">${f.label}</label>
      ${f.hint ? `<span class="hint">${f.hint}</span>` : ''}
      ${multi
        ? `<textarea id="${id}" rows="${f.rows || 4}" maxlength="${f.max}"
                     placeholder="${f.placeholder.replace(/"/g, '&quot;')}"></textarea>`
        : `<input type="text" id="${id}" maxlength="${f.max}"
                  placeholder="${f.placeholder.replace(/"/g, '&quot;')}">`}
      <div class="count" id="c_${f.key}">0 / ${f.max}</div>`;
    els.form.appendChild(wrap);

    const input = wrap.querySelector(multi ? 'textarea' : 'input');
    const count = wrap.querySelector('.count');
    input.value = state.values[f.key] || '';
    const sync = () => {
      state.values[f.key] = input.value;
      count.textContent = `${input.value.length} / ${f.max}`;
      count.classList.toggle('over', input.value.length > f.max * 0.9);
      updateCaption();
      scheduleRender();
    };
    input.addEventListener('input', sync);
    sync();
  }
}

function selectTemplate(t) {
  state.tpl = t;
  // Drop values whose fields don't exist on the new template
  const keys = new Set(t.fields.map((f) => f.key));
  for (const k of Object.keys(state.values)) if (!keys.has(k)) delete state.values[k];
  buildForm();
  updateCaption();
  scheduleRender();
}

function updateCaption() {
  els.captionText.value = caption(state.tpl, state.values);
}

/* ------------------------------------------------------------- cropper */

function setupPhotoInput() {
  els.photo.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    els.filename.textContent = file.name;
    els.status.textContent = 'Loading photo…';
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      URL.revokeObjectURL(url);
      state.photo = downscale(img, 2400);
      state.crop = { zoom: 1, ox: 0, oy: 0 };
      els.zoom.value = 100;
      els.crop.classList.add('on');
      els.canvas.classList.add('draggable');
      els.status.textContent = '';
      scheduleRender();
    } catch (err) {
      els.status.textContent = 'That file could not be read as an image.';
    }
  });

  els.zoom.addEventListener('input', () => {
    state.crop.zoom = els.zoom.value / 100;
    scheduleRender();
  });
}

/** Phone photos are often 12MP; drawing those every frame is needlessly slow. */
function downscale(img, maxEdge) {
  const longest = Math.max(img.width, img.height);
  if (longest <= maxEdge) return img;
  const s = maxEdge / longest;
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Pointer events give mouse and touch dragging in one code path. */
function setupDrag() {
  let dragging = false, lastX = 0, lastY = 0;

  els.canvas.addEventListener('pointerdown', (e) => {
    if (!state.photo) return;
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    els.canvas.setPointerCapture(e.pointerId);
    els.canvas.classList.add('dragging');
  });

  els.canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = els.canvas.getBoundingClientRect();
    const box = photoBox(state.tpl, els.canvas.width, els.canvas.height);
    // Convert screen delta -> canvas px -> fraction of the photo box
    const scale = els.canvas.width / rect.width;
    state.crop.ox += ((e.clientX - lastX) * scale) / box.w;
    state.crop.oy += ((e.clientY - lastY) * scale) / box.h;
    lastX = e.clientX; lastY = e.clientY;
    scheduleRender();
  });

  const end = (e) => {
    dragging = false;
    els.canvas.classList.remove('dragging');
    if (e.pointerId != null && els.canvas.hasPointerCapture?.(e.pointerId)) {
      els.canvas.releasePointerCapture(e.pointerId);
    }
  };
  els.canvas.addEventListener('pointerup', end);
  els.canvas.addEventListener('pointercancel', end);
}

/* --------------------------------------------------------------- export */

function setupDownload() {
  els.download.addEventListener('click', async () => {
    els.download.disabled = true;
    els.status.textContent = 'Building your image…';
    try {
      const c = document.createElement('canvas');
      c.width = CANVAS_W; c.height = CANVAS_H;
      await render(c.getContext('2d'), CANVAS_W, CANVAS_H);

      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      const safe = (state.values.name || 'ISEDay').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ISEDay2026_${safe}.png`;
      a.click();
      // Revoke on a delay, not inline: Safari in particular can abort the
      // download if the object URL disappears before the save actually starts.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      els.status.textContent = 'Downloaded. Post it with #ISEDay on Sept. 14.';
    } catch (e) {
      els.status.textContent = `Could not build the image: ${e.message}`;
    } finally {
      els.download.disabled = false;
    }
  });

  els.copyCaption.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(els.captionText.value);
      els.copyCaption.textContent = 'Copied';
      setTimeout(() => { els.copyCaption.textContent = 'Copy caption'; }, 1600);
    } catch {
      els.captionText.select();
      els.status.textContent = 'Press Cmd/Ctrl+C to copy.';
    }
  });
}

/* ----------------------------------------------------------------- boot */

// Faces the canvas draws with. Roboto is CSS-only and not needed here.
const FACES = ['400 32px Montserrat', '700 32px Montserrat', '700 32px MavenPro'];

/**
 * Canvas silently substitutes a system font when a webfont isn't ready, and
 * every measurement made against it is then wrong — text wraps at the wrong
 * width and autofit picks the wrong size. So don't just fire the loads and
 * hope: verify with check() afterwards and retry.
 *
 * `document.fonts.ready` alone is not enough. It resolves when nothing is
 * *pending*, which is also true when a load never started, so a face that
 * failed to kick off reads as "ready" while being entirely absent.
 */
async function ensureFonts(attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    await Promise.all(FACES.map((f) => document.fonts.load(f).catch(() => {})));
    await document.fonts.ready;
    if (FACES.every((f) => document.fonts.check(f))) return true;
  }
  return false;
}

async function init() {
  els.status.textContent = 'Loading…';

  // Render anyway if a face is missing — a slightly-off graphic beats a blank
  // page — but keep the warning visible rather than clearing it below.
  const fontWarning = await ensureFonts()
    ? '' : 'Some fonts did not load; spacing may be slightly off. Try reloading.';

  [state.logos.white, state.logos.color] = await Promise.all([
    loadImage('assets/logos/ise-logo-white.png'),
    loadImage('assets/logos/ise-logo-color.png')
  ]);

  buildPicker();
  buildForm();
  setupPhotoInput();
  setupDrag();
  setupDownload();
  updateCaption();
  await render(ctx, els.canvas.width, els.canvas.height);
  els.status.textContent = fontWarning;
}

init().catch((e) => { els.status.textContent = `Startup failed: ${e.message}`; });
