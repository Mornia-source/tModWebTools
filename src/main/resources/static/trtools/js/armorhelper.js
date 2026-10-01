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

// twtT 由 page-boot.js 全局提供
function armorModeLabel(m) {
  const t = twtT(m.labelKey);
  return t === m.labelKey ? m.label : t;
}

// 模板拆解规则与 NPC帧图生成器共用（armor-template.js）
const {
  createPixelCanvas,
  actionFrontArm,
  actionHead,
  actionBody,
  actionLegs,
  fileToCanvas,
  normalizeTemplateCanvas: normalizeArmorTemplateCanvas
} = window.TWT_ARMOR_TPL;

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
  lastOutput: null,
  pendingDownload: null
};

function logStatus(lines) {
  refs.armorStatus.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}

async function canvasToPngBlob(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob) return blob;
  // 某些浏览器/边界情况下 toBlob 可能返回 null，降级用 dataURL 转换
  const dataUrl = canvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  return await res.blob();
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  // 立即触发一次下载；若被浏览器拦截，将由“二次点击下载”兜底
  try { a.click(); } catch (_) {}
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function clearPendingDownload() {
  if (state.pendingDownload?.url) {
    try { URL.revokeObjectURL(state.pendingDownload.url); } catch (_) {}
  }
  state.pendingDownload = null;
  if (refs.runArmor) {
    refs.runArmor.classList.remove("secondary");
    refs.runArmor.innerHTML = '<i class="fas fa-cogs" style="margin-right:8px"></i><span data-i18n="armor.export">导出</span>';
  }
}

function setPendingDownload(blob, filename) {
  clearPendingDownload();
  const url = URL.createObjectURL(blob);
  state.pendingDownload = { blob, filename, url };
  if (refs.runArmor) {
    refs.runArmor.classList.add("secondary");
    refs.runArmor.innerHTML = '<i class="fas fa-download" style="margin-right:8px"></i><span>点击下载</span>';
  }
}

function tryDownloadPending() {
  const p = state.pendingDownload;
  if (!p) return false;
  const a = document.createElement("a");
  a.href = p.url;
  a.download = p.filename;
  document.body.appendChild(a);
  try { a.click(); } catch (_) {}
  a.remove();
  // 下载动作触发后清理（保留 URL 一小会儿，避免极端情况下浏览器还没来得及读取）
  setTimeout(() => clearPendingDownload(), 2000);
  return true;
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

function upscale2x(src) {
  const out = createPixelCanvas(src.width * 2, src.height * 2);
  out.getContext("2d").drawImage(src, 0, 0, out.width, out.height);
  return out;
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
      workerScript: "/trtools/js/gif-local/gif.worker.js"
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

async function runExport() {
  if (tryDownloadPending()) return;
  if (!refs.armorFiles.files.length) return logStatus(twtT("armor.pickTpl"));

  state.templates = Array.from(refs.armorFiles.files);
  const modes = selectedModes();
  if (!modes.length) return logStatus(twtT("armor.pickMode"));

  refs.runArmor.disabled = true;
  try {
    // 浏览器通常会拦截一次操作中触发的多次自动下载；输出>1时强制 ZIP 一次性下载更稳定
    const expectedOutputs = state.templates.length * modes.length;
    const forceZip = expectedOutputs > 1;
    const needZip = refs.zipMode.checked || forceZip;
    if (needZip && typeof window.JSZip === "undefined") {
      logStatus(twtT("armor.noJszip"));
      return;
    }
    const zip = needZip ? new JSZip() : null;
    let firstOutput = null;
    let count = 0;
    const notes = [];

    for (const file of state.templates) {
      const raw = await fileToCanvas(file);
      const norm = normalizeArmorTemplateCanvas(raw);
      if (!norm.ok) {
        notes.push(twtT("armor.badSizeDetail", { name: file.name, w: norm.w, h: norm.h }));
        continue;
      }
      const src = norm.canvas;
      if (norm.scale && norm.scale > 1) {
        notes.push(twtT("armor.scaledNote", { name: file.name, sw: norm.w, sh: norm.h, k: norm.scale }));
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
            // 单文件导出：先生成，交给二次点击触发下载（避免浏览器拦截）
            setPendingDownload(gifBlob, gifName);
          }
        } else {
          const pngBlob = await canvasToPngBlob(out);
          const pngName = `${base}_${mode}.png`;
          if (zip) {
            zip.file(pngName, pngBlob);
          } else {
            setPendingDownload(pngBlob, pngName);
          }
        }

        count++;
      }
    }

    if (count === 0) {
      clearPendingDownload();
      logStatus([twtT("armor.noOutput"), ...notes].filter(Boolean));
      return;
    }

    if (firstOutput) {
      state.lastOutput = firstOutput;
      drawPreview(firstOutput, refs.outputPreview);
      refs.previewOnly.disabled = false;
    }

    if (zip) {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      setPendingDownload(zipBlob, "armorhelper_export.zip");
    }

    const msg = [
      twtT("armor.doneN", { n: count }),
      "已生成文件：请再点击一次“点击下载”按钮开始下载。",
      ...notes
    ];
    if (forceZip && !refs.zipMode.checked) {
      msg.push("提示：检测到输出文件数>1，已自动改为 ZIP 打包（避免浏览器拦截多次下载）。");
    }
    logStatus(msg);
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
