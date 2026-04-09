const el = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
function twtT(k, vars) {
  try {
    if (typeof window.TWT_I18N !== "undefined" && window.TWT_I18N.t) return window.TWT_I18N.t(k, vars);
  } catch (_) {}
  return k;
}
const fmt = (n) => Number(n).toLocaleString("en-US");
const state = {
  files: [],
  lastOutCanvas: null,
  currentMode: "build",
  outNameAuto: true,
  lastAutoOutName: "",
};
const refs = {
  drop: el("drop"),
  fileInput: el("file"),
  pick: el("pick"),
  clear: el("clear"),
  fileList: el("fileList"),
  onlineCount: el("onlineCount"),
  preview: el("preview"),
  previewGrid: el("previewGrid"),
  status: el("status"),
  kv: el("kv"),
  busy: el("busy"),
  toTop: el("toTop"),
  tile: el("tile"),
  gap: el("gap"),
  cropTransparent: el("cropTransparent"),
  padRightTiles: el("padRightTiles"),
  padBottomTiles: el("padBottomTiles"),
  padMode: el("padMode"),
  outName: el("outName"),
  cols: el("cols"),
  rows: el("rows"),
  build: el("build"),
  download: el("download"),
  alphaThresholdStitch: el("alphaThresholdStitch"),
  minSeamStitch: el("minSeamStitch"),
  stitch: el("stitch"),
  downloadStitch: el("downloadStitch"),
  alphaThresholdSplit: el("alphaThresholdSplit"),
  minSeamSplit: el("minSeamSplit"),
  splitAxis: el("splitAxis"),
  splitCrop: el("splitCrop"),
  splitZip: el("splitZip"),
  split: el("split"),
  composeGap: el("composeGap"),
  compose: el("compose"),
  downloadCompose: el("downloadCompose"),
  dropHint: el("dropHint"),
  gif2sheetGap: el("gif2sheetGap"),
  gif2sheetRun: el("gif2sheetRun"),
  downloadGif2sheet: el("downloadGif2sheet"),
  sheet2gifFrameH: el("sheet2gifFrameH"),
  sheet2gifGap: el("sheet2gifGap"),
  sheet2gifCount: el("sheet2gifCount"),
  sheet2gifDelay: el("sheet2gifDelay"),
  sheet2gifRun: el("sheet2gifRun"),
};
const pctx = refs.preview.getContext("2d", { willReadFrequently: false });
pctx.imageSmoothingEnabled = false;
function showStatus(lines) {
  refs.status.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}
function showKV(obj) {
  if (!obj) {
    refs.kv.style.display = "none";
    refs.kv.innerHTML = "";
    return;
  }
  refs.kv.style.display = "grid";
  refs.kv.innerHTML = "";
  for (const [k, v] of Object.entries(obj)) {
    const a = document.createElement("div");
    a.textContent = k;
    const b = document.createElement("div");
    b.textContent = v;
    refs.kv.appendChild(a);
    refs.kv.appendChild(b);
  }
}
function setBusy(v) {
  refs.busy.style.display = v ? "" : "none";
  const ids = [
    "pick","clear","fileInput","build","stitch","split","compose",
    "tile","gap","cropTransparent","padRightTiles","padBottomTiles","padMode",
    "cols","rows","outName","alphaThresholdStitch","minSeamStitch",
    "alphaThresholdSplit","minSeamSplit","splitAxis","splitCrop","splitZip","composeGap",
    "gif2sheetGap","gif2sheetRun","downloadGif2sheet",
    "sheet2gifFrameH","sheet2gifGap","sheet2gifCount","sheet2gifDelay","sheet2gifRun",
  ];
  for (const k of ids) if (refs[k]) refs[k].disabled = v;
}
function renderPreview() {
  const previewHost = refs.preview && refs.preview.parentElement;
  const setPreviewFrameEmpty = (empty) => {
    if (previewHost && previewHost.classList.contains("previewFrame")) {
      previewHost.classList.toggle("previewFrame--empty", empty);
    }
  };

  if (!state.lastOutCanvas) {
    const sc = refs.preview.parentElement;
    let w = Math.floor((sc && sc.clientWidth > 0 ? sc.clientWidth : 520) - 20);
    if (w < 200) w = 420;
    w = clamp(w, 320, 980);
    const maxEmptyH = 300;
    const h = clamp(Math.round(w * 0.56), 160, maxEmptyH);
    refs.preview.width = w;
    refs.preview.height = h;
    pctx.imageSmoothingEnabled = false;
    pctx.fillStyle = "rgba(0,0,0,.06)";
    pctx.fillRect(0, 0, w, h);
    setPreviewFrameEmpty(true);
    return;
  }
  setPreviewFrameEmpty(false);
  refs.preview.width = state.lastOutCanvas.width;
  refs.preview.height = state.lastOutCanvas.height;
  pctx.imageSmoothingEnabled = false;
  if (refs.previewGrid.checked) {
    // 与图像像素 1:1 对齐的棋盘格（每格 1px），便于查看透明像素
    const g = refs.preview.__checkerPat;
    if (!g || g.w !== 2 || g.h !== 2) {
      const pc = document.createElement("canvas");
      pc.width = 2;
      pc.height = 2;
      const gx = pc.getContext("2d");
      gx.fillStyle = "#e8e8e8";
      gx.fillRect(0, 0, 2, 2);
      gx.fillStyle = "#c4c4c4";
      gx.fillRect(0, 0, 1, 1);
      gx.fillRect(1, 1, 1, 1);
      refs.preview.__checkerPat = { w: 2, h: 2, pat: pctx.createPattern(pc, "repeat") };
    }
    pctx.fillStyle = refs.preview.__checkerPat.pat;
    pctx.fillRect(0, 0, refs.preview.width, refs.preview.height);
  } else {
    pctx.clearRect(0, 0, refs.preview.width, refs.preview.height);
  }
  pctx.drawImage(state.lastOutCanvas, 0, 0);
}
async function canvasToBlob(canvas) {
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
async function downloadCanvas(canvas, filename) {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.toLowerCase().endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  requestAnimationFrame(() => { a.click(); a.remove(); });
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function baseName(name) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}
function canvasFromBitmap(bitmap) {
  const c = document.createElement("canvas");
  c.width = bitmap.width; c.height = bitmap.height;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, 0, 0);
  return c;
}
async function ensureSingleInput() {
  if (!state.files.length) {
    showStatus(twtT("tsheet.msgPickFirst"));
    return null;
  }
  const b = await createImageBitmap(state.files[0]);
  return canvasFromBitmap(b);
}
function updateFileList() {
  if (!state.files.length) {
    refs.fileList.style.display = "none";
    refs.fileList.innerHTML = "";
    return;
  }
  refs.fileList.style.display = "block";
  refs.fileList.innerHTML = "";
  state.files.forEach((f, idx) => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.index = String(idx);
    const left = document.createElement("div");
    left.className = "frameLeft";
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const img = document.createElement("img");
    img.src = f.__url; thumb.appendChild(img);
    const meta = document.createElement("div");
    meta.className = "frameMeta";
    const name = document.createElement("div");
    name.className = "frameName";
    name.innerHTML = `<span class="mono">${idx + 1}.</span> ${f.name}`;
    const size = document.createElement("div");
    size.className = "mono muted";
    size.textContent = `${fmt(f.size)}B`;
    meta.appendChild(name); meta.appendChild(size);
    left.appendChild(thumb); left.appendChild(meta);
    const actions = document.createElement("div");
    actions.className = "frameActions";
    const mkBtn = (html, click, disabled) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "iconBtn"; b.innerHTML = html;
      b.disabled = !!disabled; b.addEventListener("click", click);
      return b;
    };
    const up = mkBtn('<i class="fas fa-arrow-up"></i>', () => moveFrame(idx, -1), idx === 0);
    const down = mkBtn('<i class="fas fa-arrow-down"></i>', () => moveFrame(idx, +1), idx === state.files.length - 1);
    actions.appendChild(up); actions.appendChild(down);
    li.appendChild(left); li.appendChild(actions);
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(idx));
      e.dataTransfer.effectAllowed = "move";
    });
    li.addEventListener("dragover", (e) => e.preventDefault());
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const to = idx;
      if (Number.isFinite(from) && from !== to) {
        const item = state.files.splice(from, 1)[0];
        state.files.splice(to, 0, item);
        updateFileList();
      }
    });
    refs.fileList.appendChild(li);
  });
}
function resetOutputDownloads() {
  state.lastOutCanvas = null;
  refs.download.disabled = true;
  refs.downloadStitch.disabled = true;
  refs.downloadCompose.disabled = true;
  if (refs.downloadGif2sheet) refs.downloadGif2sheet.disabled = true;
}

function addFiles(fileListLike) {
  const arr = Array.from(fileListLike);
  const mode = state.currentMode;

  if (mode === "gif2sheet") {
    const g = arr.find((f) => f.type === "image/gif" || /\.gif$/i.test(f.name));
    if (!g) {
      showStatus(twtT("tsheet.msgGifOnly"));
      return;
    }
    state.files.forEach((f) => f.__url && URL.revokeObjectURL(f.__url));
    state.files = [];
    if (!g.__url) Object.defineProperty(g, "__url", { value: URL.createObjectURL(g) });
    state.files.push(g);
    updateFileList();
    refs.outName.value = `${baseName(g.name)}_gif_sheet.png`;
    resetOutputDownloads();
    renderPreview();
    return;
  }
  if (mode === "sheet2gif") {
    const p = arr.find((f) => f.type === "image/png" || /\.png$/i.test(f.name));
    if (!p) {
      showStatus(twtT("tsheet.msgPngStrip"));
      return;
    }
    state.files.forEach((f) => f.__url && URL.revokeObjectURL(f.__url));
    state.files = [];
    if (!p.__url) Object.defineProperty(p, "__url", { value: URL.createObjectURL(p) });
    state.files.push(p);
    updateFileList();
    resetOutputDownloads();
    renderPreview();
    return;
  }

  for (const f of fileListLike) {
    if (!f.type.startsWith("image/")) continue;
    if (!f.__url) Object.defineProperty(f, "__url", { value: URL.createObjectURL(f) });
    state.files.push(f);
  }
  updateFileList();
  if (state.files.length) {
    refs.outName.value = `${baseName(state.files[0].name)}_gap1.png`;
  }
  resetOutputDownloads();
  renderPreview();
}
function moveFrame(idx, dir) {
  const to = idx + dir;
  if (to < 0 || to >= state.files.length) return;
  const item = state.files.splice(idx, 1)[0];
  state.files.splice(to, 0, item);
  updateFileList();
}
function cropTransparentBorder(srcCanvas) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const ctx = srcCanvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = img[(y * w + x) * 4 + 3];
    if (a !== 0) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return srcCanvas;
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  if (cw === w && ch === h) return srcCanvas;
  const out = document.createElement("canvas");
  out.width = cw; out.height = ch;
  out.getContext("2d").drawImage(srcCanvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}
function addOuterPadding(srcCanvas, rightPx, bottomPx) {
  const out = document.createElement("canvas");
  out.width = srcCanvas.width + Math.max(0, rightPx);
  out.height = srcCanvas.height + Math.max(0, bottomPx);
  out.getContext("2d").drawImage(srcCanvas, 0, 0);
  return out;
}
function padToMultiple(srcCanvas, tile, mode) {
  const targetW = Math.ceil(srcCanvas.width / tile) * tile;
  const targetH = Math.ceil(srcCanvas.height / tile) * tile;
  const out = document.createElement("canvas");
  out.width = targetW; out.height = targetH;
  const dx = mode === "center" || mode === "centerBottom" ? Math.floor((targetW - srcCanvas.width) / 2) : 0;
  const dy = mode === "center" ? Math.floor((targetH - srcCanvas.height) / 2) : (mode === "centerBottom" ? targetH - srcCanvas.height : 0);
  out.getContext("2d").drawImage(srcCanvas, dx, dy);
  return out;
}
function buildGapImage(srcCanvas, tile, gap) {
  const tilesX = Math.floor(srcCanvas.width / tile);
  const tilesY = Math.floor(srcCanvas.height / tile);
  const out = document.createElement("canvas");
  out.width = tilesX * tile + (tilesX - 1) * gap;
  out.height = tilesY * tile + (tilesY - 1) * gap;
  const ctx = out.getContext("2d");
  for (let y = 0; y < tilesY; y++) for (let x = 0; x < tilesX; x++) {
    const sx = x * tile, sy = y * tile;
    const dx = x * (tile + gap), dy = y * (tile + gap);
    ctx.drawImage(srcCanvas, sx, sy, tile, tile, dx, dy, tile, tile);
  }
  return out;
}
function padCanvasToWidth(c, targetW, centered = true) {
  if (c.width === targetW) return c;
  const out = document.createElement("canvas");
  out.width = targetW; out.height = c.height;
  const dx = centered ? Math.floor((targetW - c.width) / 2) : 0;
  out.getContext("2d").drawImage(c, dx, 0);
  return out;
}
function stackVertical(canvases, gap = 0) {
  const w = canvases[0].width;
  const h = canvases.reduce((s, c) => s + c.height, 0) + gap * (canvases.length - 1);
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const ctx = out.getContext("2d");
  let y = 0;
  for (const c of canvases) { ctx.drawImage(c, 0, y); y += c.height + gap; }
  return out;
}
function isColumnTransparent(imgData, x, alpha) {
  const { width: w, height: h, data } = imgData;
  for (let y = 0; y < h; y++) if (data[(y * w + x) * 4 + 3] > alpha) return false;
  return true;
}
function isRowTransparent(imgData, y, alpha) {
  const { width: w, data } = imgData;
  const row = y * w * 4;
  for (let x = 0; x < w; x++) if (data[row + x * 4 + 3] > alpha) return false;
  return true;
}
function removeTransparentSeams(srcCanvas, axis, alpha, minSeam) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const img = srcCanvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h);
  const keep = [];
  const limit = axis === "x" ? w : h;
  let p = 0;
  const blank = (i) => axis === "x" ? isColumnTransparent(img, i, alpha) : isRowTransparent(img, i, alpha);
  while (p < limit) {
    if (blank(p)) {
      const s = p; while (p < limit && blank(p)) p++;
      if (p - s < minSeam) for (let i = s; i < p; i++) keep.push(i);
    } else keep.push(p++);
  }
  const out = document.createElement("canvas");
  out.width = axis === "x" ? keep.length : w;
  out.height = axis === "x" ? h : keep.length;
  const octx = out.getContext("2d");
  const outImg = octx.createImageData(out.width, out.height);
  if (axis === "x") {
    for (let ox = 0; ox < keep.length; ox++) {
      const sx = keep[ox];
      for (let y = 0; y < h; y++) {
        const si = (y * w + sx) * 4, di = (y * out.width + ox) * 4;
        outImg.data.set(img.data.slice(si, si + 4), di);
      }
    }
  } else {
    for (let oy = 0; oy < keep.length; oy++) {
      const sy = keep[oy];
      for (let x = 0; x < w; x++) {
        const si = (sy * w + x) * 4, di = (oy * w + x) * 4;
        outImg.data.set(img.data.slice(si, si + 4), di);
      }
    }
  }
  octx.putImageData(outImg, 0, 0);
  return out;
}
function findSegmentsByTransparentSeams(srcCanvas, axis, alpha, minSeam) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const img = srcCanvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h);
  const blank = (i) => axis === "x" ? isColumnTransparent(img, i, alpha) : isRowTransparent(img, i, alpha);
  const limit = axis === "x" ? w : h;
  const seg = [];
  let p = 0;
  while (p < limit) {
    while (p < limit && blank(p)) p++;
    if (p >= limit) break;
    const start = p;
    while (p < limit) {
      if (!blank(p)) { p++; continue; }
      const seamStart = p;
      while (p < limit && blank(p)) p++;
      if (p - seamStart >= minSeam) break;
    }
    if (p > start) seg.push({ start, end: p });
  }
  return seg;
}
function extractSegmentCanvas(src, axis, seg) {
  const out = document.createElement("canvas");
  if (axis === "x") {
    out.width = seg.end - seg.start; out.height = src.height;
    out.getContext("2d").drawImage(src, seg.start, 0, out.width, out.height, 0, 0, out.width, out.height);
  } else {
    out.width = src.width; out.height = seg.end - seg.start;
    out.getContext("2d").drawImage(src, 0, seg.start, out.width, out.height, 0, 0, out.width, out.height);
  }
  return out;
}
async function buildMain() {
  if (!state.files.length) return showStatus(twtT("tsheet.msgPickFirst"));
  const tile = Math.max(1, parseInt(refs.tile.value || "16", 10));
  const gap = Math.max(0, parseInt(refs.gap.value || "1", 10));
  const crop = !!refs.cropTransparent.checked;
  const padRightPx = Math.max(0, parseInt(refs.padRightTiles.value || "0", 10)) * tile;
  const padBottomPx = Math.max(0, parseInt(refs.padBottomTiles.value || "0", 10)) * tile;
  const padMode = refs.padMode.value || "topleft";
  const centered = padMode !== "topleft";
  setBusy(true);
  try {
    const outFrames = [];
    for (const f of state.files) {
      let c = canvasFromBitmap(await createImageBitmap(f));
      if (crop) c = cropTransparentBorder(c);
      c = addOuterPadding(c, padRightPx, padBottomPx);
      c = padToMultiple(c, tile, padMode);
      c = buildGapImage(c, tile, gap);
      outFrames.push(c);
    }
    let maxW = 0; for (const f of outFrames) maxW = Math.max(maxW, f.width);
    for (let i = 0; i < outFrames.length; i++) outFrames[i] = padCanvasToWidth(outFrames[i], maxW, centered);
    state.lastOutCanvas = stackVertical(outFrames, 0);
    refs.download.disabled = false;
    renderPreview();
    const fh = outFrames[0]?.height || 0;
    showStatus([
      twtT("tsheet.msgDone", { w: state.lastOutCanvas.width, h: state.lastOutCanvas.height }),
      twtT("tsheet.msgAfSuggest", { n: fh }),
    ]);
    showKV({
      [twtT("tsheet.kvInputFrames")]: String(state.files.length),
      [twtT("tsheet.kvTile")]: String(tile),
      [twtT("tsheet.kvGap")]: String(gap),
      [twtT("tsheet.kvFramePx")]: `${outFrames[0].width} × ${outFrames[0].height}`,
      [twtT("tsheet.kvOutPx")]: `${state.lastOutCanvas.width} × ${state.lastOutCanvas.height}`,
    });
  } catch (e) {
    showStatus(twtT("tsheet.msgBuildFail", { e: e?.message || e }));
  } finally { setBusy(false); }
}
async function runStitch() {
  setBusy(true);
  try {
    const src = await ensureSingleInput(); if (!src) return;
    const alpha = clamp(parseInt(refs.alphaThresholdStitch.value || "0", 10), 0, 255);
    const min = Math.max(1, parseInt(refs.minSeamStitch.value || "1", 10));
    let out = removeTransparentSeams(src, "x", alpha, min);
    out = removeTransparentSeams(out, "y", alpha, min);
    state.lastOutCanvas = out;
    refs.downloadStitch.disabled = false;
    refs.download.disabled = false;
    refs.outName.value = `${baseName(state.files[0].name)}_stitched.png`;
    renderPreview();
    showStatus(twtT("tsheet.msgStitchDone", { w: out.width, h: out.height }));
  } finally { setBusy(false); }
}
async function runSplit() {
  setBusy(true);
  try {
    const src = await ensureSingleInput(); if (!src) return;
    const axis = refs.splitAxis.value === "y" ? "y" : "x";
    const alpha = clamp(parseInt(refs.alphaThresholdSplit.value || "0", 10), 0, 255);
    const min = Math.max(1, parseInt(refs.minSeamSplit.value || "1", 10));
    const seg = findSegmentsByTransparentSeams(src, axis, alpha, min);
    if (!seg.length) return showStatus(twtT("tsheet.msgNoSeg"));
    const base = baseName(state.files[0].name);
    const zipMode = !!refs.splitZip.checked;
    const zip = zipMode ? new JSZip() : null;
    const outs = [];
    for (let i = 0; i < seg.length; i++) {
      let c = extractSegmentCanvas(src, axis, seg[i]);
      if (refs.splitCrop.checked) c = cropTransparentBorder(c);
      outs.push(c);
      if (zipMode) zip.file(`${base}_${String(i + 1).padStart(3, "0")}.png`, await canvasToBlob(c));
    }
    state.lastOutCanvas = outs[0];
    renderPreview();
    if (zipMode) {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${base}_split.zip`;
      document.body.appendChild(a);
      requestAnimationFrame(() => { a.click(); a.remove(); });
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } else {
      for (let i = 0; i < outs.length; i++) {
        await downloadCanvas(outs[i], `${base}_${String(i + 1).padStart(3, "0")}.png`);
      }
    }
    showStatus(twtT("tsheet.msgSplitDone", { n: outs.length }));
  } finally { setBusy(false); }
}
async function runCompose() {
  if (!state.files.length) return showStatus(twtT("tsheet.msgPickFirst"));
  setBusy(true);
  try {
    const frames = [];
    for (const f of state.files) frames.push(canvasFromBitmap(await createImageBitmap(f)));
    let maxW = 0; for (const c of frames) maxW = Math.max(maxW, c.width);
    for (let i = 0; i < frames.length; i++) frames[i] = padCanvasToWidth(frames[i], maxW, true);
    const gap = Math.max(0, parseInt(refs.composeGap.value || "2", 10));
    state.lastOutCanvas = stackVertical(frames, gap);
    refs.downloadCompose.disabled = false;
    refs.download.disabled = false;
    refs.outName.value = `${baseName(state.files[0].name)}_vertical.png`;
    renderPreview();
    showStatus(twtT("tsheet.msgComposeDone", { w: state.lastOutCanvas.width, h: state.lastOutCanvas.height }));
  } finally { setBusy(false); }
}

/** GIF 的 frameCount 在部分文件/浏览器上会误报为 1，改为按 frameIndex 递增解码直到失败，以拿到全部动画帧。 */
function preferAnimatedImageTrack(decoder) {
  const list = decoder.tracks;
  if (!list || list.length <= 1) return;
  let bestIdx = 0;
  let bestFc = list[0]?.frameCount ?? 0;
  for (let i = 1; i < list.length; i++) {
    const fc = list[i]?.frameCount ?? 0;
    if (fc > bestFc) {
      bestFc = fc;
      bestIdx = i;
    }
  }
  try {
    list.selectedIndex = bestIdx;
  } catch (_) {}
}

/**
 * @returns {Promise<{ canvas: HTMLCanvasElement, delayMs: number }[]>}
 */
async function decodeGifToFrames(file) {
  if (typeof ImageDecoder === "undefined") {
    throw new Error(twtT("tsheet.errNoImageDecoder"));
  }
  const buf = await file.arrayBuffer();
  const decoder = new ImageDecoder({ data: buf, type: "image/gif" });
  const MAX_FRAMES = 4096;
  try {
    await decoder.completed;
    const trList = decoder.tracks;
    if (trList && typeof trList.ready?.then === "function") {
      await trList.ready;
    }
    preferAnimatedImageTrack(decoder);
    const out = [];
    for (let i = 0; i < MAX_FRAMES; i++) {
      let result;
      try {
        result = await decoder.decode({ frameIndex: i });
      } catch (e) {
        if (i === 0) {
          throw new Error(twtT("tsheet.errGifDecode", { e: e?.message || e }));
        }
        break;
      }
      const vf = result.image;
      const bmp = await createImageBitmap(vf);
      let delayMs = 100;
      if (vf.duration != null && vf.duration > 0) {
        delayMs = Math.max(20, Math.round(vf.duration / 1000));
      }
      const canvas = canvasFromBitmap(bmp);
      try {
        vf.close();
      } catch (_) {}
      try {
        bmp.close();
      } catch (_) {}
      out.push({ canvas, delayMs });
    }
    if (!out.length) throw new Error(twtT("tsheet.errGifNoFrames"));
    return out;
  } finally {
    try {
      decoder.close();
    } catch (_) {}
  }
}

function extractUniformFramesFromStrip(canvas, frameH, gap, count) {
  const W = canvas.width;
  const H = canvas.height;
  const fh = Math.max(1, Math.floor(frameH));
  const g = Math.max(0, Math.floor(gap));
  const step = fh + g;
  if (step < 1) throw new Error(twtT("tsheet.errFrameH"));
  let n = Math.max(0, Math.floor(count));
  if (n === 0) {
    n = 0;
    for (let y = 0; y + fh <= H; y += step) n++;
  }
  if (n < 1) throw new Error(twtT("tsheet.errNoFullFrames"));
  const frames = [];
  for (let i = 0, y = 0; i < n; i++, y += step) {
    if (y + fh > H) {
      throw new Error(twtT("tsheet.errFrameOverflow", { i: i + 1, y, H }));
    }
    const c = document.createElement("canvas");
    c.width = W;
    c.height = fh;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, y, W, fh, 0, 0, W, fh);
    frames.push(c);
  }
  const used = (n - 1) * step + fh;
  return { frames, usedH: used, frameCount: n };
}

async function runGif2Sheet() {
  if (!state.files.length) return showStatus(twtT("tsheet.msgNeedGif"));
  const f = state.files[0];
  if (f.type !== "image/gif" && !/\.gif$/i.test(f.name)) {
    return showStatus(twtT("tsheet.msgUseGif"));
  }
  setBusy(true);
  try {
    const decoded = await decodeGifToFrames(f);
    if (!decoded.length) throw new Error(twtT("tsheet.errGifNoFrames"));
    const frames = decoded.map((d) => d.canvas);
    let maxW = 0;
    for (const c of frames) maxW = Math.max(maxW, c.width);
    for (let i = 0; i < frames.length; i++) frames[i] = padCanvasToWidth(frames[i], maxW, true);
    const gap = Math.max(0, parseInt(refs.gif2sheetGap.value || "2", 10));
    state.lastOutCanvas = stackVertical(frames, gap);
    if (refs.downloadGif2sheet) refs.downloadGif2sheet.disabled = false;
    refs.download.disabled = false;
    refs.outName.value = `${baseName(f.name)}_gif_sheet.png`;
    renderPreview();
    showStatus([
      twtT("tsheet.msgGif2DoneLine1", { w: state.lastOutCanvas.width, h: state.lastOutCanvas.height }),
      twtT("tsheet.msgGif2DoneLine2", { n: decoded.length }),
    ]);
    showKV({
      [twtT("tsheet.kvFrames")]: String(decoded.length),
      [twtT("tsheet.kvGap")]: `${gap}px`,
      [twtT("tsheet.kvOut")]: `${state.lastOutCanvas.width}×${state.lastOutCanvas.height}`,
    });
  } catch (e) {
    showStatus(twtT("tsheet.msgGifProcessFail", { e: e?.message || e }));
    showKV(null);
  } finally {
    setBusy(false);
  }
}

async function runSheet2Gif() {
  setBusy(true);
  try {
    const src = await ensureSingleInput();
    if (!src) return;
    if (state.files[0].type !== "image/png" && !/\.png$/i.test(state.files[0].name)) {
      return showStatus(twtT("tsheet.msgNeedPngStrip"));
    }
    const frameH = Math.max(1, parseInt(refs.sheet2gifFrameH.value || "32", 10));
    const gap = Math.max(0, parseInt(refs.sheet2gifGap.value || "2", 10));
    const countOpt = parseInt(refs.sheet2gifCount.value || "0", 10);
    const delayMs = Math.max(20, parseInt(refs.sheet2gifDelay.value || "100", 10));

    const { frames, usedH, frameCount } = extractUniformFramesFromStrip(
      src,
      frameH,
      gap,
      countOpt
    );
    const W = frames[0].width;
    const H = frames[0].height;

    const mod = await import("https://unpkg.com/gifenc@1.0.1/dist/gifenc.esm.js");
    const { GIFEncoder, quantize, applyPalette } = mod;
    const gif = GIFEncoder();

    for (let fi = 0; fi < frames.length; fi++) {
      const c = frames[fi];
      const ctx = c.getContext("2d", { willReadFrequently: true });
      const { data } = ctx.getImageData(0, 0, W, H);
      const uint32 = new Uint32Array(data.buffer, data.byteOffset, (W * H) | 0);
      const palette = quantize(uint32, 256);
      const index = applyPalette(uint32, palette);
      if (fi === 0) {
        gif.writeFrame(index, W, H, { palette, delay: delayMs });
      } else {
        gif.writeFrame(index, W, H, { delay: delayMs });
      }
    }
    gif.finish();
    const u8 = gif.bytes();
    const blob = new Blob([u8], { type: "image/gif" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(state.files[0].name)}_sheet.gif`;
    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      a.remove();
    });
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    state.lastOutCanvas = frames[0];
    renderPreview();
    const tail = src.height - usedH;
    showStatus(
      [
        twtT("tsheet.msgGifBuilt", { n: frameCount, w: W, h: H, d: delayMs }),
        tail > 2 ? twtT("tsheet.msgGifTail", { px: tail }) : "",
      ].filter(Boolean)
    );
    showKV({
      [twtT("tsheet.kvFrames")]: String(frameCount),
      [twtT("tsheet.kvSize")]: `${W}×${H}`,
      [twtT("tsheet.kvUnusedH")]: `${src.height - usedH}px`,
    });
  } catch (e) {
    showStatus(twtT("tsheet.msgGifFail", { e: e?.message || e }));
    showKV(null);
  } finally {
    setBusy(false);
  }
}

function applyModeChrome() {
  const m = state.currentMode;
  if (refs.dropHint) {
    if (m === "gif2sheet") {
      refs.dropHint.textContent = twtT("tsheet.dropHintGif2");
    } else if (m === "sheet2gif") {
      refs.dropHint.textContent = twtT("tsheet.dropHintSheet2");
    } else {
      refs.dropHint.textContent = twtT("tsheet.dropHint");
    }
  }
  if (refs.fileInput) {
    refs.fileInput.multiple = m === "gif2sheet" || m === "sheet2gif" ? false : true;
    if (m === "gif2sheet") refs.fileInput.accept = ".gif,image/gif";
    else if (m === "sheet2gif") refs.fileInput.accept = ".png,image/png";
    else refs.fileInput.accept = "image/*";
  }
}

function clearStateOnSubtabSwitch() {
  state.files.forEach((f) => f.__url && URL.revokeObjectURL(f.__url));
  state.files = [];
  if (refs.fileInput) refs.fileInput.value = "";
  updateFileList();
  resetOutputDownloads();
  if (refs.outName) refs.outName.value = "tilesheet_gap1.png";
  showKV(null);
  showStatus("");
  renderPreview();
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = {
    build: el("panel-build"),
    stitch: el("panel-stitch"),
    split: el("panel-split"),
    compose: el("panel-compose"),
    gif2sheet: el("panel-gif2sheet"),
    sheet2gif: el("panel-sheet2gif"),
  };
  const setMode = (m) => {
    if (m !== state.currentMode) {
      clearStateOnSubtabSwitch();
    }
    state.currentMode = m;
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === m));
    Object.entries(panels).forEach(([k, p]) => {
      if (p) p.classList.toggle("active", k === m);
    });
    applyModeChrome();
  };
  tabs.forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
  setMode("build");
}
function initOnlineCount() {
  try {
    if (!refs.onlineCount) return;
    if (!/^https?:$/.test(location.protocol)) return;
    const sseUrl = new URL("./events", location.href).toString();
    const countUrl = new URL("./count", location.href).toString();

    const applyCount = (msg) => {
      if (typeof msg.count === "number") refs.onlineCount.textContent = String(msg.count);
    };

    (async () => {
      let ok = false;
      try {
        const res = await fetch(countUrl, { cache: "no-store" });
        if (res.ok) {
          const msg = await res.json();
          applyCount(msg);
          ok = true;
        }
      } catch (_) {}
      if (!ok) {
        refs.onlineCount.textContent = "-";
        return;
      }

      let pollTimer = null;
      const poll = async () => {
        try {
          const res = await fetch(countUrl, { cache: "no-store" });
          if (!res.ok) return;
          applyCount(await res.json());
        } catch (_) {}
      };

      const startPolling = () => {
        if (pollTimer) return;
        pollTimer = setInterval(poll, 8000);
      };

      try {
        const es = new EventSource(sseUrl);
        es.onmessage = (ev) => {
          try {
            applyCount(JSON.parse(ev.data || "{}"));
          } catch (_) {}
        };
        es.onerror = () => {
          try {
            es.close();
          } catch (_) {}
          startPolling();
        };
      } catch (_) {
        startPolling();
      }
    })();
  } catch (_) {
    refs.onlineCount.textContent = "-";
  }
}
refs.pick.addEventListener("click", () => refs.fileInput.click());
refs.fileInput.addEventListener("change", () => addFiles(refs.fileInput.files));
refs.clear.addEventListener("click", () => clearStateOnSubtabSwitch());
refs.drop.addEventListener("dragover", (e) => { e.preventDefault(); refs.drop.classList.add("dragover"); });
refs.drop.addEventListener("dragleave", () => refs.drop.classList.remove("dragover"));
refs.drop.addEventListener("drop", (e) => {
  e.preventDefault(); refs.drop.classList.remove("dragover");
  addFiles(e.dataTransfer.files);
});
refs.build.addEventListener("click", buildMain);
refs.stitch.addEventListener("click", runStitch);
refs.split.addEventListener("click", runSplit);
refs.compose.addEventListener("click", runCompose);
if (refs.gif2sheetRun) refs.gif2sheetRun.addEventListener("click", runGif2Sheet);
if (refs.sheet2gifRun) refs.sheet2gifRun.addEventListener("click", runSheet2Gif);
refs.download.addEventListener("click", async () => {
  if (!state.lastOutCanvas) return showStatus(twtT("tsheet.msgNeedPreview"));
  await downloadCanvas(state.lastOutCanvas, refs.outName.value || "tilesheet.png");
});
refs.downloadStitch.addEventListener("click", async () => {
  if (!state.lastOutCanvas) return showStatus(twtT("tsheet.msgNeedStitch"));
  await downloadCanvas(state.lastOutCanvas, refs.outName.value || "stitched.png");
});
refs.downloadCompose.addEventListener("click", async () => {
  if (!state.lastOutCanvas) return showStatus(twtT("tsheet.msgNeedCompose"));
  await downloadCanvas(state.lastOutCanvas, refs.outName.value || "vertical.png");
});
if (refs.downloadGif2sheet) {
  refs.downloadGif2sheet.addEventListener("click", async () => {
    if (!state.lastOutCanvas) return showStatus(twtT("tsheet.msgNeedPreview"));
    await downloadCanvas(state.lastOutCanvas, refs.outName.value || "gif_sheet.png");
  });
}
refs.previewGrid.addEventListener("change", renderPreview);
const previewScrollHost = refs.preview && refs.preview.parentElement;
if (typeof ResizeObserver !== "undefined" && previewScrollHost) {
  new ResizeObserver(() => {
    if (!state.lastOutCanvas) renderPreview();
  }).observe(previewScrollHost);
}
window.addEventListener("scroll", () => refs.toTop.style.display = window.scrollY > 500 ? "flex" : "none", { passive: true });
refs.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
initTabs();
window.addEventListener("twt:i18n-applied", applyModeChrome);
initOnlineCount();
renderPreview();
requestAnimationFrame(() => {
  if (!state.lastOutCanvas) renderPreview();
});
showStatus("");