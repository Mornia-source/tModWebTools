const SLICE_W = 40;
const SLICE_H = 56;
const SRC_COLS = 9;
const SRC_ROWS = 4;
const SRC_W = SLICE_W * SRC_COLS;   // 360
const SRC_H = SLICE_H * SRC_ROWS;   // 224
const OUT_FRAMES = 20;
const OUT_W = SLICE_W;
const OUT_H = SLICE_H * OUT_FRAMES; // 1120

// 记录：1~36 分片语义（方便后续维护/修改）
const INPUT_SLICE_NOTES = {
  1: "男性身体-正常",
  2: "男性身体-跳跃样子",
  3: "挥砍右手臂1",
  4: "挥砍右手臂2",
  5: "挥砍右手臂3",
  6: "挥砍右手臂4",
  7: "挥砍右手臂5",
  8: "高尔夫右手臂1",
  9: "高尔夫左手臂1",
  10: "男性肩甲",
  11: "空白",
  12: "跳跃右手臂",
  13: "行走右手臂1",
  14: "行走右手臂2",
  15: "行走右手臂3",
  16: "行走右手臂4",
  17: "高尔夫右手臂2",
  18: "高尔夫左手臂2",
  19: "女性身体常态",
  20: "女性身体跳跃",
  21: "挥砍左手臂1",
  22: "挥砍左手臂2",
  23: "挥砍左手臂3",
  24: "挥砍左手臂4（固定空白）",
  25: "挥砍左手臂5（固定空白）",
  26: "高尔夫右手臂3",
  27: "高尔夫左手臂3",
  28: "女性肩甲",
  29: "空白",
  30: "跳跃左手臂",
  31: "行走左手臂1",
  32: "行走左手臂2",
  33: "行走左手臂3",
  34: "行走左手臂4",
  35: "高尔夫右手臂4",
  36: "高尔夫左手臂4"
};

// 记录：盔甲图输出帧规则（20 帧已完成）
// 含义：输出第 N 帧 = 叠加输入分片列表（按数组顺序覆盖绘制）
const ARMOR_FRAME_RULES = {
  1: [1, 3, 21],
  2: [1, 4, 22],
  3: [1, 5, 23],
  4: [1, 6, 24],
  5: [1, 7, 25],
  6: [2, 12, 30],
  7: [1, 13, 31],
  8: [1, 14, 32],
  9: [1, 14, 32],
  10: [1, 14, 32],
  11: [1, 14, 31],
  12: [1, 13, 31],
  13: [1, 13, 31],
  14: [1, 13, 31],
  15: [1, 15, 33],
  16: [1, 16, 34],
  17: [1, 16, 34],
  18: [1, 15, 33],
  19: [1, 13, 31],
  20: [1, 13, 31]
};

// 记录：手臂贴图输出帧规则（20 帧已完成）
// 含义：输出第 N 帧 = 使用输入分片 idx（单片）
const ARMS_FRAME_RULES = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 12,
  7: 13,
  8: 14,
  9: 14,
  10: 14,
  11: 14,
  12: 15,
  13: 15,
  14: 15,
  15: 16,
  16: 16,
  17: 16,
  18: 15,
  19: 14,
  20: 14
};

// 这些帧需要在输出分片内整体上移 2px（盔甲图/手臂图都适用）
const FRAME_UP_SHIFT = new Set([8, 9, 10, 15, 16, 17]);

// 盔甲图勾选肩甲时：第 1~6 帧不绘制肩甲（第 7~20 帧肩甲为最顶层覆盖）
const ARMOR_SHOULDER_MIN_FRAME = 7;

const el = (id) => document.getElementById(id);
const refs = {
  file: el("srcFile"),
  pick: el("pickFile"),
  clear: el("clearFile"),
  fileText: el("fileText"),
  modeArmor: el("modeArmor"),
  modeArms: el("modeArms"),
  useFemaleBody: el("useFemaleBody"),
  useShoulder: el("useShoulder"),
  shiftUp2px: el("shiftUp2px"),
  addIndex: el("addIndex"),
  previewGrid: el("previewGrid"),
  run: el("runBuild"),
  download: el("downloadOut"),
  status: el("status"),
  onlineCount: el("onlineCount"),
  inputPreview: el("inputPreview"),
  outputPreview: el("outputPreview")
};

const state = {
  sourceFile: null,
  outputCanvas: null
};

function logStatus(lines) {
  refs.status.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}

function setFileText() {
  refs.fileText.textContent = state.sourceFile ? state.sourceFile.name : "未选择文件";
}

function idxToRect(index1Based) {
  const i = index1Based - 1;
  const row = Math.floor(i / SRC_COLS);
  const col = i % SRC_COLS;
  return { sx: col * SLICE_W, sy: row * SLICE_H, sw: SLICE_W, sh: SLICE_H };
}

function createCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return c;
}

async function fileToCanvas(file) {
  const bmp = await createImageBitmap(file);
  const c = createCanvas(bmp.width, bmp.height);
  c.getContext("2d").drawImage(bmp, 0, 0);
  return c;
}

function normalizeTo360x224(srcCanvas) {
  const ratio = srcCanvas.width / srcCanvas.height;
  const targetRatio = SRC_W / SRC_H;
  if (Math.abs(ratio - targetRatio) > 1e-6) {
    return { ok: false, canvas: srcCanvas };
  }
  if (srcCanvas.width === SRC_W && srcCanvas.height === SRC_H) {
    return { ok: true, canvas: srcCanvas, scaled: false };
  }
  const out = createCanvas(SRC_W, SRC_H);
  out.getContext("2d").drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, SRC_W, SRC_H);
  return { ok: true, canvas: out, scaled: true };
}

function drawFrameIndex(ctx, frameNo, dx, dy) {
  const text = String(frameNo);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const padX = 2;
  const padY = 1;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width) + padX * 2;
  const h = 12;
  const x = dx + OUT_W - w - 2;
  const y = dy + 2;
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x + padX, y + padY);
  ctx.restore();
}

function remapBodyPartIndex(idx, useFemaleBody) {
  if (!useFemaleBody) return idx;
  if (idx === 1) return 19;
  if (idx === 2) return 20;
  return idx;
}

function buildArmorOutput(normSrc, addIndex, useFemaleBody, useShoulder, shiftUp2px) {
  const out = createCanvas(OUT_W, OUT_H);
  const outCtx = out.getContext("2d");

  for (let frame = 1; frame <= OUT_FRAMES; frame++) {
    const dy = (frame - 1) * SLICE_H;
    const parts = ARMOR_FRAME_RULES[frame];
    if (!parts) continue;
    const frameOffsetY = shiftUp2px && FRAME_UP_SHIFT.has(frame) ? -2 : 0;
    for (const rawIdx of parts) {
      const idx = remapBodyPartIndex(rawIdx, useFemaleBody);
      const { sx, sy, sw, sh } = idxToRect(idx);
      outCtx.drawImage(normSrc, sx, sy, sw, sh, 0, dy + frameOffsetY, sw, sh);
    }
    // 肩甲为最顶层（覆盖下方组合）；盔甲图仅第 7~20 帧绘制
    if (useShoulder && frame >= ARMOR_SHOULDER_MIN_FRAME) {
      const shoulderIdx = useFemaleBody ? 28 : 10;
      const { sx, sy, sw, sh } = idxToRect(shoulderIdx);
      outCtx.drawImage(normSrc, sx, sy, sw, sh, 0, dy + frameOffsetY, sw, sh);
    }
    if (addIndex) drawFrameIndex(outCtx, frame, 0, dy);
  }
  return out;
}

function buildArmsOutput(normSrc, addIndex, useFemaleBody, useShoulder, shiftUp2px) {
  const out = createCanvas(OUT_W, OUT_H);
  const outCtx = out.getContext("2d");

  for (let frame = 1; frame <= OUT_FRAMES; frame++) {
    const dy = (frame - 1) * SLICE_H;
    const idx = ARMS_FRAME_RULES[frame];
    if (!idx) continue;
    const frameOffsetY = shiftUp2px && FRAME_UP_SHIFT.has(frame) ? -2 : 0;
    const { sx, sy, sw, sh } = idxToRect(idx);
    outCtx.drawImage(normSrc, sx, sy, sw, sh, 0, dy + frameOffsetY, sw, sh);
    if (useShoulder) {
      const shoulderIdx = useFemaleBody ? 28 : 10;
      const r = idxToRect(shoulderIdx);
      outCtx.drawImage(normSrc, r.sx, r.sy, r.sw, r.sh, 0, dy + frameOffsetY, r.sw, r.sh);
    }
    if (addIndex) drawFrameIndex(outCtx, frame, 0, dy);
  }
  return out;
}

function drawPreview(canvas, target) {
  target.width = canvas.width;
  target.height = canvas.height;
  const ctx = target.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  if (target.id === "outputPreview" && refs.previewGrid?.checked) {
    // 1:1 像素棋盘格背景，便于观察透明与像素边界
    if (!target.__checkerPat) {
      const pc = document.createElement("canvas");
      pc.width = 2;
      pc.height = 2;
      const gx = pc.getContext("2d");
      gx.fillStyle = "#e8e8e8";
      gx.fillRect(0, 0, 2, 2);
      gx.fillStyle = "#c4c4c4";
      gx.fillRect(0, 0, 1, 1);
      gx.fillRect(1, 1, 1, 1);
      target.__checkerPat = ctx.createPattern(pc, "repeat");
    }
    ctx.fillStyle = target.__checkerPat;
    ctx.fillRect(0, 0, target.width, target.height);
  } else {
    ctx.clearRect(0, 0, target.width, target.height);
  }
  ctx.drawImage(canvas, 0, 0);
}

async function downloadCanvas(canvas, filename) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("toBlob 返回空值");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function previewInputImmediately() {
  if (!state.sourceFile) return;
  try {
    const src = await fileToCanvas(state.sourceFile);
    const norm = normalizeTo360x224(src);
    drawPreview(norm.ok ? norm.canvas : src, refs.inputPreview);
    if (!norm.ok) {
      logStatus(`尺寸不符合要求：${src.width}×${src.height}。\n必须是 360×224 或同比例缩放。`);
    } else {
      logStatus(norm.scaled ? `已加载预览：${src.width}×${src.height}（将按比例归一化到 ${SRC_W}×${SRC_H}）` : "已加载预览：标准尺寸 360×224。");
    }
  } catch (err) {
    logStatus(`预览失败：${err?.message || err}`);
  }
}

async function runBuild() {
  if (!state.sourceFile) {
    logStatus("请先选择输入材质图。");
    return;
  }

  refs.run.disabled = true;
  refs.download.disabled = true;
  try {
    const src = await fileToCanvas(state.sourceFile);
    const norm = normalizeTo360x224(src);
    if (!norm.ok) {
      logStatus(`尺寸不符合要求：${src.width}×${src.height}。\n必须是 360×224 或同比例缩放。`);
      return;
    }
    drawPreview(norm.canvas, refs.inputPreview);

    const addIndex = !!refs.addIndex?.checked;
    const useFemaleBody = !!refs.useFemaleBody?.checked;
    const useShoulder = !!refs.useShoulder?.checked;
    const shiftUp2px = refs.shiftUp2px ? !!refs.shiftUp2px.checked : true;
    const out = refs.modeArms?.checked
      ? buildArmsOutput(norm.canvas, addIndex, useFemaleBody, useShoulder, shiftUp2px)
      : buildArmorOutput(norm.canvas, addIndex, useFemaleBody, useShoulder, shiftUp2px);
    state.outputCanvas = out;
    drawPreview(out, refs.outputPreview);
    refs.download.disabled = false;

    const scaleText = norm.scaled ? `已按比例缩放为 ${SRC_W}×${SRC_H} 后处理。` : "输入尺寸为标准 360×224。";
    logStatus([
      `生成完成：${refs.modeArms?.checked ? "手臂图" : "盔甲图"} 40×1120（20 帧）。`,
      `${refs.modeArms?.checked ? "手臂图" : "盔甲图"} 1~20 帧组合已完成。`,
      !refs.modeArms?.checked && useFemaleBody ? "已启用：女性身体（1 -> 19，2 -> 20）。" : "",
      useShoulder
        ? `已启用：肩甲顶层（${useFemaleBody ? "女性 28" : "男性 10"}）；盔甲图仅第 7~20 帧绘制，手臂图每帧绘制。`
        : "",
      addIndex ? "已启用：添加序列标号（右上角 1~20）。" : "",
      scaleText
    ].filter(Boolean));
  } catch (err) {
    logStatus(`生成失败：${err?.message || err}`);
  } finally {
    refs.run.disabled = false;
  }
}

refs.pick.addEventListener("click", () => refs.file.click());
refs.file.addEventListener("change", () => {
  state.sourceFile = refs.file.files?.[0] || null;
  state.outputCanvas = null;
  refs.download.disabled = true;
  setFileText();
  previewInputImmediately().catch(() => {});
});
refs.clear.addEventListener("click", () => {
  refs.file.value = "";
  state.sourceFile = null;
  state.outputCanvas = null;
  refs.download.disabled = true;
  setFileText();
  logStatus("");
  const ictx = refs.inputPreview.getContext("2d");
  ictx.clearRect(0, 0, refs.inputPreview.width, refs.inputPreview.height);
  const octx = refs.outputPreview.getContext("2d");
  octx.clearRect(0, 0, refs.outputPreview.width, refs.outputPreview.height);
});
refs.run.addEventListener("click", runBuild);
refs.previewGrid?.addEventListener("change", () => {
  if (state.outputCanvas) drawPreview(state.outputCanvas, refs.outputPreview);
});
refs.download.addEventListener("click", async () => {
  if (!state.outputCanvas) {
    logStatus("请先生成再下载。");
    return;
  }
  try {
    const name = refs.modeArms?.checked ? "arms_1.4_to_1.3.png" : "armor_1.4_to_1.3.png";
    await downloadCanvas(state.outputCanvas, name);
  } catch (err) {
    logStatus(`下载失败：${err?.message || err}`);
  }
});

setFileText();
