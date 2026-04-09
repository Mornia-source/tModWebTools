const ARMOR_MODES = [
  { key: "Head", labelKey: "armor.modeHead", label: "头部 (Head)", gif: false },
  { key: "Body", labelKey: "armor.modeBody", label: "身体 (Body)", gif: false },
  { key: "Female", labelKey: "armor.modeFemale", label: "身体-女 (Body Female)", gif: false },
  { key: "Legs", labelKey: "armor.modeLegs", label: "腿部 (Legs)", gif: false },
  { key: "Arms", labelKey: "armor.modeArms", label: "手臂 (Arms)", gif: false },
  { key: "FullArmor", labelKey: "armor.modeFull", label: "完整套装 (Full Armor)", gif: false },
  { key: "FullArmorFemale", labelKey: "armor.modeFullF", label: "完整套装-女 (Full Armor Female)", gif: false },
  { key: "GIFFullArmor", labelKey: "armor.modeGifFull", label: "完整套装GIF (GIF Full Armor)", gif: true },
  { key: "GIFFullArmorFemale", labelKey: "armor.modeGifFullF", label: "完整套装GIF-女 (GIF Full Armor Female)", gif: true }
];

function twtT(k, vars) {
  try {
    if (typeof window.TWT_I18N !== "undefined" && window.TWT_I18N.t) return window.TWT_I18N.t(k, vars);
  } catch (_) {}
  return k;
}

function armorModeLabel(m) {
  const t = twtT(m.labelKey);
  return t === m.labelKey ? m.label : t;
}

const frontArmOffsets = [0, -1, -1, -1, -1, 0, 0, 0, 1, 2, 2, 1, 0, 0];
const backArmOffsets = [0, 1, 1, 1, 0, 0, 0, 0, -1, -2, -2, -1, 0, 0];
const bodyHeadOffsets = [0, 0, 0, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0];
const legMapping = [[5], [7], [8], [9], [10], [13], [14], [15], [16], [17, 18]];

const el = (id) => document.getElementById(id);
const refs = {
  armorDrop: el("armorDrop"),
  armorFiles: el("armorFiles"),
  pickArmorFiles: el("pickArmorFiles"),
  clearArmorFiles: el("clearArmorFiles"),
  armorFileText: el("armorFileText"),
  modeList: el("modeList"),
  zipMode: el("zipMode"),
  runArmor: el("runArmor"),
  previewOnly: el("previewOnly"),
  armorStatus: el("armorStatus"),
  inputPreview: el("inputPreview"),
  inputPreviewHost: el("inputPreviewHost"),
  outputPreview: el("outputPreview"),
  outputScroller: el("outputScroller"),
  onlineCount: el("onlineCount")
};

const state = {
  templates: [],
  lastOutput: null
};

function logStatus(lines) {
  refs.armorStatus.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}

function drawPreview(canvas, target) {
  target.width = canvas.width;
  target.height = canvas.height;
  target.classList.toggle("previewSheetNarrow", canvas.width > 0 && canvas.width <= 96);
  const ctx = target.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(canvas, 0, 0);
  if (target.id === "outputPreview" && refs.outputScroller) {
    refs.outputScroller.classList.remove("previewFrame--empty");
  }
  if (target.id === "inputPreview" && refs.inputPreviewHost) {
    refs.inputPreviewHost.classList.remove("previewFrame--empty");
  }
}

function resetOutputPreview() {
  const c = refs.outputPreview;
  c.classList.remove("previewSheetNarrow");
  c.width = 40;
  c.height = 48;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0,0,0,.05)";
  ctx.fillRect(0, 0, c.width, c.height);
  if (refs.outputScroller) refs.outputScroller.classList.add("previewFrame--empty");
}

async function fileToCanvas(file) {
  const bmp = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext("2d").drawImage(bmp, 0, 0);
  return c;
}

function createPixelCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return c;
}

function upscale2x(src) {
  const out = createPixelCanvas(src.width * 2, src.height * 2);
  out.getContext("2d").drawImage(src, 0, 0, out.width, out.height);
  return out;
}

function copyRect(sourceCtx, destCtx, sx, sy, sw, sh, dx, dy, ignored = null) {
  const src = sourceCtx.getImageData(sx, sy, sw, sh);
  const dst = destCtx.getImageData(dx, dy, sw, sh);
  const ignoreSet = new Set((ignored || []).map(([x, y]) => `${x},${y}`));

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const a = src.data[i + 3];
      if (a <= 1) continue;
      if (ignoreSet.has(`${sx + x},${sy + y}`)) continue;
      dst.data[i] = src.data[i];
      dst.data[i + 1] = src.data[i + 1];
      dst.data[i + 2] = src.data[i + 2];
      dst.data[i + 3] = a;
    }
  }

  destCtx.putImageData(dst, dx, dy);
}

function fillRect(destCtx, x, y, w, h, rgba = [0, 0, 0, 0]) {
  const img = destCtx.getImageData(x, y, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = rgba[0];
    img.data[i + 1] = rgba[1];
    img.data[i + 2] = rgba[2];
    img.data[i + 3] = rgba[3];
  }
  destCtx.putImageData(img, x, y);
}

function actionFrontArm(srcCtx, dstCtx) {
  copyRect(srcCtx, dstCtx, 1, 1, 12, 16, 0, 9);
  copyRect(srcCtx, dstCtx, 14, 1, 12, 16, 0, 33);
  copyRect(srcCtx, dstCtx, 27, 1, 16, 16, 2, 61);
  copyRect(srcCtx, dstCtx, 44, 1, 17, 16, 2, 92);
  copyRect(srcCtx, dstCtx, 62, 1, 16, 16, 2, 121);
  copyRect(srcCtx, dstCtx, 14, 1, 12, 16, 0, 145, [[22, 9], [22, 10], [22, 11], [22, 12]]);

  for (let k = 0; k < 14; k++) {
    const frame = k + 6;
    copyRect(srcCtx, dstCtx, 79, 1, 13, 11, frontArmOffsets[k], frame * 28 + 12 + bodyHeadOffsets[frame]);
  }
}

function actionBackArm(srcCtx, dstCtx) {
  const tmp = createPixelCanvas(20, 560);
  const tctx = tmp.getContext("2d");

  copyRect(srcCtx, tctx, 94, 1, 12, 11, 7, 14);
  copyRect(srcCtx, tctx, 94, 1, 12, 11, 8, 40);
  copyRect(srcCtx, tctx, 94, 1, 12, 11, 7, 70);

  for (let k = 0; k < 14; k++) {
    const frame = k + 6;
    copyRect(srcCtx, tctx, 94, 1, 12, 11, 8 + backArmOffsets[k], frame * 28 + 12 + bodyHeadOffsets[frame]);
    if (backArmOffsets[k] === -2) copyRect(srcCtx, tctx, 101, 8, 1, 1, 14, frame * 28 + 18);
  }

  for (let i = 0; i < 20; i++) fillRect(tctx, 8, 21 + 28 * i, 6, 1, [0, 0, 0, 0]);
  fillRect(tctx, 0, 0, 13, 560, [0, 0, 0, 0]);
  copyRect(tctx, dstCtx, 0, 0, 20, 560, 0, 0);
}

function actionHead(srcCtx, dstCtx) {
  for (let k = 0; k < 20; k++) copyRect(srcCtx, dstCtx, 1, 19, 20, 28, 0, k * 28 + bodyHeadOffsets[k]);
}

function actionBody(srcCtx, dstCtx, female = false) {
  actionBackArm(srcCtx, dstCtx);
  for (let k = 0; k < 20; k++) {
    const sy = k === 5 ? 48 : 19;
    const sx = female ? 44 : 23;
    const ignored = female || (k !== 1 && k <= 5) ? null : [[37, sy + 16], [37, sy + 17]];
    copyRect(srcCtx, dstCtx, sx, sy, 20, 28, 0, k * 28 + bodyHeadOffsets[k], ignored);
  }
  actionFrontArm(srcCtx, dstCtx);
}

function actionLegs(srcCtx, dstCtx) {
  for (let k = 0; k < 7; k++) {
    const frameY = (k < 5 ? k : (k === 5 ? 11 : 19)) * 28;
    for (let l = 0; l < 2; l++) {
      const swap = l === (k === 6 ? 0 : 1);
      const sx = l === 1 ? 100 : 110;
      copyRect(srcCtx, dstCtx, sx, 19, 9, 9, swap ? 5 : 7, 19 + frameY, [[sx + 1, 21], [sx + 7, 21]]);
    }
  }

  copyRect(srcCtx, dstCtx, 100, 19, 9, 9, 6, 187);
  copyRect(srcCtx, dstCtx, 100, 19, 9, 9, 6, 355);

  for (let m = 0; m < legMapping.length; m++) {
    const sx = m >= 5 ? 83 : 66;
    const sy = 19 + (m % 5) * 10;
    for (const row of legMapping[m]) copyRect(srcCtx, dstCtx, sx, sy, 16, 9, 3, 19 + row * 28);
  }
}

function buildSheet(srcCanvas, modeKey) {
  const srcCtx = srcCanvas.getContext("2d");
  const dst = createPixelCanvas(20, 560);
  const dstCtx = dst.getContext("2d");

  if (modeKey === "Head") actionHead(srcCtx, dstCtx);
  if (modeKey === "Body") actionBody(srcCtx, dstCtx, false);
  if (modeKey === "Female") actionBody(srcCtx, dstCtx, true);
  if (modeKey === "Legs") actionLegs(srcCtx, dstCtx);
  if (modeKey === "Arms") actionFrontArm(srcCtx, dstCtx);
  if (modeKey === "FullArmor") {
    actionLegs(srcCtx, dstCtx);
    actionBody(srcCtx, dstCtx, false);
    actionHead(srcCtx, dstCtx);
    actionFrontArm(srcCtx, dstCtx);
  }
  if (modeKey === "FullArmorFemale") {
    actionLegs(srcCtx, dstCtx);
    actionBody(srcCtx, dstCtx, true);
    actionHead(srcCtx, dstCtx);
    actionFrontArm(srcCtx, dstCtx);
  }

  return upscale2x(dst);
}

async function renderGifFromSheet(sheet40x1120) {
  return await new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: 40,
      height: 56,
      workerScript: "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js"
    });

    const temp = createPixelCanvas(40, 56);
    const tctx = temp.getContext("2d");

    for (let i = 0; i < 5; i++) {
      const pause = i === 2 || i === 4;
      const short = i === 3;
      const start = short ? 1 : (pause ? 0 : 6);
      const end = short ? 5 : (pause ? 10 : 20);

      for (let j = start; j < end; j++) {
        const row = pause ? 0 : j;
        tctx.clearRect(0, 0, 40, 56);
        tctx.drawImage(sheet40x1120, 0, row * 56, 40, 56, 0, 0, 40, 56);
        gif.addFrame(temp, { delay: 66, copy: true });
      }
    }

    gif.on("finished", resolve);
    gif.on("abort", () => reject(new Error("GIF aborted")));
    gif.render();
  });
}

function makeCheckboxes() {
  refs.modeList.innerHTML = "";
  ARMOR_MODES.forEach((m, i) => {
    const label = document.createElement("label");
    label.className = "armorModeOption";
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.className = "armorModeCb";
    inp.value = m.key;
    if (i < 5) inp.checked = true;
    const span = document.createElement("span");
    span.className = "armorModeLabel";
    span.textContent = armorModeLabel(m);
    label.append(inp, span);
    refs.modeList.appendChild(label);
  });
}

function selectedModes() {
  return Array.from(refs.modeList.querySelectorAll("input[type=checkbox]:checked")).map((x) => x.value);
}

function updateFileText() {
  const count = refs.armorFiles.files?.length || 0;
  refs.armorFileText.textContent = count ? twtT("armor.filesN", { n: count }) : twtT("armor.none");
}

async function previewFirstInputFile() {
  const first = refs.armorFiles.files?.[0];
  if (!first) return;
  const c = await fileToCanvas(first);
  drawPreview(c, refs.inputPreview);
  refs.previewOnly.disabled = false;
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

async function runExport() {
  if (!refs.armorFiles.files.length) return logStatus(twtT("armor.pickTpl"));

  state.templates = Array.from(refs.armorFiles.files);
  const modes = selectedModes();
  if (!modes.length) return logStatus(twtT("armor.pickMode"));

  refs.runArmor.disabled = true;
  try {
    const zip = refs.zipMode.checked ? new JSZip() : null;
    let firstOutput = null;
    let count = 0;

    for (const file of state.templates) {
      const src = await fileToCanvas(file);
      if (src.width !== 128 || src.height !== 80) {
        logStatus(twtT("armor.badSize", { name: file.name }));
        continue;
      }

      drawPreview(src, refs.inputPreview);
      const base = file.name.replace(/\.[^.]+$/, "");

      for (const mode of modes) {
        const realMode = mode.startsWith("GIF") ? mode.replace(/^GIF/, "") : mode;
        const out = buildSheet(src, realMode);
        if (!firstOutput) firstOutput = out;

        if (mode.startsWith("GIF")) {
          const gifBlob = await renderGifFromSheet(out);
          const gifName = `${base}_${mode}.gif`;
          if (zip) {
            zip.file(gifName, gifBlob);
          } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(gifBlob);
            a.download = gifName;
            a.click();
          }
        } else {
          const pngBlob = await new Promise((resolve) => out.toBlob(resolve, "image/png"));
          const pngName = `${base}_${mode}.png`;
          if (zip) {
            zip.file(pngName, pngBlob);
          } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(pngBlob);
            a.download = pngName;
            a.click();
          }
        }

        count++;
      }
    }

    if (firstOutput) {
      state.lastOutput = firstOutput;
      drawPreview(firstOutput, refs.outputPreview);
      refs.previewOnly.disabled = false;
    }

    if (zip) {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "armorhelper_export.zip";
      a.click();
    }

    logStatus(twtT("armor.doneN", { n: count }));
  } catch (err) {
    logStatus(twtT("armor.fail", { e: err?.message || err }));
  } finally {
    refs.runArmor.disabled = false;
  }
}

refs.pickArmorFiles.addEventListener("click", () => refs.armorFiles.click());
refs.clearArmorFiles.addEventListener("click", () => {
  refs.armorFiles.value = "";
  refs.armorFileText.textContent = twtT("armor.none");
  state.lastOutput = null;
  refs.previewOnly.disabled = true;
  const ictx = refs.inputPreview.getContext("2d");
  ictx.clearRect(0, 0, refs.inputPreview.width, refs.inputPreview.height);
  if (refs.inputPreviewHost) refs.inputPreviewHost.classList.add("previewFrame--empty");
  resetOutputPreview();
});

refs.armorDrop.addEventListener("dragover", (e) => {
  e.preventDefault();
  refs.armorDrop.classList.add("dragover");
});
refs.armorDrop.addEventListener("dragleave", () => refs.armorDrop.classList.remove("dragover"));
refs.armorDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  refs.armorDrop.classList.remove("dragover");
  if (!e.dataTransfer?.files?.length) return;
  const dt = new DataTransfer();
  for (const f of e.dataTransfer.files) dt.items.add(f);
  refs.armorFiles.files = dt.files;
  updateFileText();
  previewFirstInputFile().catch(() => {});
});

refs.armorFiles.addEventListener("change", () => {
  updateFileText();
  previewFirstInputFile().catch(() => {});
});

refs.previewOnly.addEventListener("click", () => {
  if (!state.lastOutput) {
    logStatus(twtT("armor.previewNeed"));
    return;
  }
  drawPreview(state.lastOutput, refs.outputPreview);
});

refs.runArmor.addEventListener("click", runExport);

makeCheckboxes();
window.addEventListener("twt:i18n-applied", () => {
  const sel = selectedModes();
  makeCheckboxes();
  sel.forEach((k) => {
    const cb = refs.modeList.querySelector(`input[value="${k}"]`);
    if (cb) cb.checked = true;
  });
  updateFileText();
});
updateFileText();
resetOutputPreview();
initOnlineCount();
