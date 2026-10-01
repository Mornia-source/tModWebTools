// NPC 帧图生成器：由「装备帧模板(128×80)」+「1.4 身体贴图(360×224)」生成可直接用于城镇 NPC 的帧图。
// 全程在「美术像素」尺度（每帧 20×28）合成，最后 2× 放大到 40×56，与装备帧生成器一致。
// 帧顺序参照原版城镇 NPC（NPC.FindFrame）：
//   0 站立 / 1 空中 / 2.. 行走 / 手势×2 / 坐下 / 说话 / 眨眼 / 攻击×4
//   即 ExtraFramesCount = 9、AttackFrameCount = 4。

(function () {
  "use strict";

  const FW = 20; // 美术像素帧宽
  const FH = 28; // 美术像素帧高

  // —— 与装备帧生成器（armorhelper.js）相同的模板拆解规则 ——
  const frontArmOffsets = [0, -1, -1, -1, -1, 0, 0, 0, 1, 2, 2, 1, 0, 0];
  const backArmOffsets = [0, 1, 1, 1, 0, 0, 0, 0, -1, -2, -2, -1, 0, 0];
  const bodyHeadOffsets = [0, 0, 0, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0];
  const legMapping = [[5], [7], [8], [9], [10], [13], [14], [15], [16], [17, 18]];

  // 手臂姿势：1.4 身体贴图第 0 行 (3,0)~(6,0)，对应玩家帧 1~4 的挥动手臂
  const POSES = [
    { key: "up", cell: 3, playerFrame: 1, zh: "上举" },
    { key: "upDiag", cell: 4, playerFrame: 2, zh: "斜上" },
    { key: "forward", cell: 5, playerFrame: 3, zh: "平举" },
    { key: "downDiag", cell: 6, playerFrame: 4, zh: "斜下" }
  ];

  const DEFAULT_EYES = [[9, 11], [10, 11], [13, 11]];
  const DEFAULT_MOUTH = [[10, 13], [11, 13]];

  const el = (id) => document.getElementById(id);
  const refs = {
    tplDrop: el("npcTplDrop"), tplFile: el("npcTplFile"), tplPick: el("npcTplPick"), tplText: el("npcTplText"),
    bodyDrop: el("npcBodyDrop"), bodyFile: el("npcBodyFile"), bodyPick: el("npcBodyPick"), bodyText: el("npcBodyText"),
    gender: el("npcGender"), layout: el("npcLayout"), faceLeft: el("npcFaceLeft"),
    gestA: el("npcGestA"), gestB: el("npcGestB"),
    sitBodyDy: el("npcSitBodyDy"), sitLegDx: el("npcSitLegDx"), sitLegDy: el("npcSitLegDy"),
    atkDx: el("npcAtkDx"), atkDy: el("npcAtkDy"), atkUnder: el("npcAtkUnder"),
    atkSrc: el("npcAtkSrc"), atkHideFront: el("npcAtkHideFront"),
    faceCanvas: el("npcFaceCanvas"), faceResetBtn: el("npcFaceReset"),
    editEyes: el("npcEditEyes"), editMouth: el("npcEditMouth"),
    strip: el("npcStrip"), stripHost: el("npcStripHost"),
    anim: el("npcAnim"), animSel: el("npcAnimSel"),
    download: el("npcDownload"), downloadStrip: el("npcDownloadStrip"),
    code: el("npcCode"), status: el("npcStatus")
  };

  const state = {
    tpl: null,      // 128×80 canvas
    body: null,     // 1.4 身体贴图（降采样到美术像素 180×112）
    eyes: DEFAULT_EYES.map((p) => p.slice()),
    mouth: DEFAULT_MOUTH.map((p) => p.slice()),
    editTarget: "eyes",
    frames: null,   // 最终 40×56 帧（已处理朝向）
    labels: null,
    sheet: null,
    animTimer: null
  };

  function twtT(k, vars) {
    try {
      if (window.TWT_I18N && window.TWT_I18N.t) return window.TWT_I18N.t(k, vars);
    } catch (_) {}
    return k;
  }
  function tr(k, fallback, vars) {
    const v = twtT(k, vars);
    return v === k ? fallback : v;
  }

  function setStatus(msg) {
    refs.status.textContent = Array.isArray(msg) ? msg.join("\n") : String(msg || "");
  }

  // ---------- 画布工具 ----------
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").imageSmoothingEnabled = false;
    return c;
  }

  function ctx2d(c) {
    return c.getContext("2d", { willReadFrequently: true });
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

  function fillRect(destCtx, x, y, w, h, rgba) {
    const img = destCtx.getImageData(x, y, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = rgba[0];
      img.data[i + 1] = rgba[1];
      img.data[i + 2] = rgba[2];
      img.data[i + 3] = rgba[3];
    }
    destCtx.putImageData(img, x, y);
  }

  // 把 src 叠加到 dst 的 (dx,dy)；越界部分裁掉
  function overlay(dst, src, dx = 0, dy = 0) {
    dst.getContext("2d").drawImage(src, dx, dy);
  }

  // ---------- 模板拆层（玩家 20 帧，20×560） ----------
  function partSheet(tplCtx, fn) {
    const c = canvas(FW, FH * 20);
    fn(tplCtx, ctx2d(c));
    return c;
  }

  function actionFrontArm(s, d) {
    copyRect(s, d, 1, 1, 12, 16, 0, 9);
    copyRect(s, d, 14, 1, 12, 16, 0, 33);
    copyRect(s, d, 27, 1, 16, 16, 2, 61);
    copyRect(s, d, 44, 1, 17, 16, 2, 92);
    copyRect(s, d, 62, 1, 16, 16, 2, 121);
    copyRect(s, d, 14, 1, 12, 16, 0, 145, [[22, 9], [22, 10], [22, 11], [22, 12]]);
    for (let k = 0; k < 14; k++) {
      const frame = k + 6;
      copyRect(s, d, 79, 1, 13, 11, frontArmOffsets[k], frame * 28 + 12 + bodyHeadOffsets[frame]);
    }
  }

  function actionBackArm(s, d) {
    const tmp = canvas(20, 560);
    const t = ctx2d(tmp);
    copyRect(s, t, 94, 1, 12, 11, 7, 14);
    copyRect(s, t, 94, 1, 12, 11, 8, 40);
    copyRect(s, t, 94, 1, 12, 11, 7, 70);
    for (let k = 0; k < 14; k++) {
      const frame = k + 6;
      copyRect(s, t, 94, 1, 12, 11, 8 + backArmOffsets[k], frame * 28 + 12 + bodyHeadOffsets[frame]);
      if (backArmOffsets[k] === -2) copyRect(s, t, 101, 8, 1, 1, 14, frame * 28 + 18);
    }
    for (let i = 0; i < 20; i++) fillRect(t, 8, 21 + 28 * i, 6, 1, [0, 0, 0, 0]);
    fillRect(t, 0, 0, 13, 560, [0, 0, 0, 0]);
    copyRect(t, d, 0, 0, 20, 560, 0, 0);
  }

  function actionHead(s, d) {
    for (let k = 0; k < 20; k++) copyRect(s, d, 1, 19, 20, 28, 0, k * 28 + bodyHeadOffsets[k]);
  }

  function actionTorso(s, d, female) {
    for (let k = 0; k < 20; k++) {
      const sy = k === 5 ? 48 : 19;
      const sx = female ? 44 : 23;
      const ignored = female || (k !== 1 && k <= 5) ? null : [[37, sy + 16], [37, sy + 17]];
      copyRect(s, d, sx, sy, 20, 28, 0, k * 28 + bodyHeadOffsets[k], ignored);
    }
  }

  function actionLegs(s, d) {
    for (let k = 0; k < 7; k++) {
      const frameY = (k < 5 ? k : (k === 5 ? 11 : 19)) * 28;
      for (let l = 0; l < 2; l++) {
        const swap = l === (k === 6 ? 0 : 1);
        const sx = l === 1 ? 100 : 110;
        copyRect(s, d, sx, 19, 9, 9, swap ? 5 : 7, 19 + frameY, [[sx + 1, 21], [sx + 7, 21]]);
      }
    }
    copyRect(s, d, 100, 19, 9, 9, 6, 187);
    copyRect(s, d, 100, 19, 9, 9, 6, 355);
    for (let m = 0; m < legMapping.length; m++) {
      const sx = m >= 5 ? 83 : 66;
      const sy = 19 + (m % 5) * 10;
      for (const row of legMapping[m]) copyRect(s, d, sx, sy, 16, 9, 3, 19 + row * 28);
    }
  }

  function frameOf(sheet, k) {
    const c = canvas(FW, FH);
    c.getContext("2d").drawImage(sheet, 0, k * FH, FW, FH, 0, 0, FW, FH);
    return c;
  }

  // ---------- 1.4 身体贴图：取手臂姿势 ----------
  function armFromBody14(cellX, cellY) {
    const c = canvas(FW, FH);
    c.getContext("2d").drawImage(state.body, cellX * FW, cellY * FH, FW, FH, 0, 0, FW, FH);
    return c;
  }

  // ---------- 合成 ----------
  function buildLayers() {
    const s = ctx2d(state.tpl);
    const female = refs.gender.value === "female";
    return {
      legs: partSheet(s, actionLegs),
      backArm: partSheet(s, actionBackArm),
      torso: partSheet(s, (a, b) => actionTorso(a, b, female)),
      front: partSheet(s, actionFrontArm),
      head: partSheet(s, actionHead)
    };
  }

  // 与装备帧生成器「完整套装」相同的叠放顺序
  function fullFrame(L, k) {
    const c = canvas(FW, FH);
    for (const part of [L.legs, L.backArm, L.torso, L.front, L.head, L.front]) overlay(c, frameOf(part, k));
    return c;
  }

  // 站立帧去掉前臂（手臂画在身体前面时换手用）
  function idleWithoutFrontArm(L) {
    const c = canvas(FW, FH);
    for (const part of [L.legs, L.backArm, L.torso, L.head]) overlay(c, frameOf(part, 0));
    return c;
  }

  // 站立帧去掉后臂，并把 arm 画在躯干后面（后侧那只手做动作）
  function idleWithBackArm(L, arm, dx = 0, dy = 0) {
    const c = canvas(FW, FH);
    overlay(c, frameOf(L.legs, 0));
    if (arm) overlay(c, arm, dx, dy);
    for (const part of [L.torso, L.front, L.head, L.front]) overlay(c, frameOf(part, 0));
    return c;
  }

  function poseArm(L, poseIdx) {
    const p = POSES[poseIdx] || POSES[0];
    return state.body ? armFromBody14(p.cell, 0) : frameOf(L.front, p.playerFrame);
  }

  // 攻击挥手：1.4 身体第 1 行 (3,1)~(6,1) 的四段水平手臂；无 1.4 贴图时退回模板的后臂
  function attackArm(L, i) {
    return state.body ? armFromBody14(3 + i, 1) : frameOf(L.backArm, i);
  }

  function intVal(input, def) {
    const v = parseInt(input.value, 10);
    return Number.isFinite(v) ? v : def;
  }

  function applyPixels(c, pixels, colorFn) {
    const x2d = ctx2d(c);
    const img = x2d.getImageData(0, 0, FW, FH);
    for (const [x, y] of pixels) {
      if (x < 0 || y < 0 || x >= FW || y >= FH) continue;
      const col = colorFn(img, x, y);
      if (!col) continue;
      const i = (y * FW + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = col[3];
    }
    x2d.putImageData(img, 0, 0);
  }

  function pixelAt(img, x, y) {
    const i = (y * FW + x) * 4;
    return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
  }

  // 说话：在嘴的位置画黑线
  function talkFrame(base) {
    const c = canvas(FW, FH);
    overlay(c, base);
    applyPixels(c, state.mouth, () => [0, 0, 0, 255]);
    return c;
  }

  // 把标记的眼睛像素按 8 连通拆成一只只眼睛
  function eyeGroups() {
    const left = new Set(state.eyes.map(([x, y]) => `${x},${y}`));
    const groups = [];
    for (const [sx, sy] of state.eyes) {
      if (!left.has(`${sx},${sy}`)) continue;
      const g = [];
      const stack = [[sx, sy]];
      left.delete(`${sx},${sy}`);
      while (stack.length) {
        const [x, y] = stack.pop();
        g.push([x, y]);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const k = `${x + dx},${y + dy}`;
            if (left.has(k)) {
              left.delete(k);
              stack.push([x + dx, y + dy]);
            }
          }
        }
      }
      groups.push(g);
    }
    return groups;
  }

  // 眨眼：每只眼睛逐行取右侧一格的皮肤色向左覆盖（右侧不可用时取左侧），
  // 再只在这只眼睛最下面一行画黑线——两格高的眼睛闭上后是一格高的黑线
  function blinkFrame(base) {
    const c = canvas(FW, FH);
    overlay(c, base);
    const x2d = ctx2d(c);
    const img = x2d.getImageData(0, 0, FW, FH);
    const marked = new Set(state.eyes.map(([x, y]) => `${x},${y}`));
    const usable = (x, y) => {
      if (x < 0 || x >= FW || y < 0 || y >= FH || marked.has(`${x},${y}`)) return null;
      const p = pixelAt(img, x, y);
      return p[3] > 0 ? p : null;
    };
    const black = [];
    for (const g of eyeGroups()) {
      const rows = new Map();
      for (const [x, y] of g) {
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push(x);
      }
      for (const [y, xs] of rows) {
        const skin = usable(Math.max(...xs) + 1, y) || usable(Math.min(...xs) - 1, y);
        if (!skin) continue;
        for (const x of xs) img.data.set(skin, (y * FW + x) * 4);
      }
      const bottom = Math.max(...g.map(([, y]) => y));
      const xs = g.map(([x]) => x);
      for (let x = Math.min(...xs); x <= Math.max(...xs); x++) black.push([x, bottom]);
    }
    x2d.putImageData(img, 0, 0);
    applyPixels(c, black, () => [0, 0, 0, 255]);
    return c;
  }

  function generate() {
    if (!state.tpl) {
      setStatus(tr("npcf.needTpl", "请先上传装备帧模板（128×80）。"));
      return false;
    }
    const L = buildLayers();
    const walkCount = refs.layout.value === "23" ? 12 : 14;
    const frames = [];
    const labels = [];
    const push = (c, label) => {
      frames.push(c);
      labels.push(label);
    };

    const idle = fullFrame(L, 0);
    push(idle, tr("npcf.lIdle", "站立"));
    push(fullFrame(L, 5), tr("npcf.lJump", "空中"));
    for (let i = 0; i < walkCount; i++) push(fullFrame(L, 6 + i), tr("npcf.lWalk", "行走") + (i + 1));

    // 偏移量按最终输出朝向填写（参考图以朝左的 NPC 贴图为准）；合成在朝右的模板空间进行，朝左输出时水平取反
    const hx = (v) => (refs.faceLeft.checked ? -v : v);

    // 手势 ×2：后侧那只手换成 1.4 身体的手臂姿势，画在躯干后面，前臂保持站立
    for (const sel of [refs.gestA, refs.gestB]) {
      push(idleWithBackArm(L, poseArm(L, parseInt(sel.value, 10))), tr("npcf.lGesture", "手势"));
    }

    // 坐下：头与躯干（含手臂）下移，腿部站立帧单独平移
    {
      const c = canvas(FW, FH);
      overlay(c, frameOf(L.legs, 0), hx(intVal(refs.sitLegDx, 1)), intVal(refs.sitLegDy, 0));
      const upper = canvas(FW, FH);
      for (const part of [L.backArm, L.torso, L.front, L.head, L.front]) overlay(upper, frameOf(part, 0));
      overlay(c, upper, 0, intVal(refs.sitBodyDy, 1));
      push(c, tr("npcf.lSit", "坐下"));
    }

    push(talkFrame(idle), tr("npcf.lTalk", "说话"));
    push(blinkFrame(idle), tr("npcf.lBlink", "眨眼"));

    // 攻击 ×4：1.4 身体挥动手臂四帧，默认画在身体下方并右移
    const atkDx = hx(intVal(refs.atkDx, 3));
    const atkDy = intVal(refs.atkDy, 0);
    const hideSame = refs.atkHideFront.checked;
    for (let p = 0; p < 4; p++) {
      const arm = refs.atkSrc.value === "row1" ? attackArm(L, p) : poseArm(L, p);
      let c;
      if (refs.atkUnder.checked) {
        // 画在身体下方 = 后侧那只手挥动；勾选“换手”时去掉站立的后臂
        if (hideSame) {
          c = idleWithBackArm(L, arm, atkDx, atkDy);
        } else {
          c = canvas(FW, FH);
          overlay(c, arm, atkDx, atkDy);
          overlay(c, idle);
        }
      } else {
        c = canvas(FW, FH);
        overlay(c, hideSame ? idleWithoutFrontArm(L) : idle);
        overlay(c, arm, atkDx, atkDy);
      }
      push(c, tr("npcf.lAttack", "攻击") + (p + 1));
    }

    // 放大 2× 并处理朝向（原版城镇 NPC 贴图朝左）
    const flip = refs.faceLeft.checked;
    state.frames = frames.map((f) => {
      const out = canvas(FW * 2, FH * 2);
      const o = out.getContext("2d");
      o.imageSmoothingEnabled = false;
      if (flip) {
        o.translate(out.width, 0);
        o.scale(-1, 1);
      }
      o.drawImage(f, 0, 0, out.width, out.height);
      return out;
    });
    state.labels = labels;

    const sheet = canvas(FW * 2, FH * 2 * frames.length);
    state.frames.forEach((f, i) => sheet.getContext("2d").drawImage(f, 0, i * FH * 2));
    state.sheet = sheet;

    renderStrip();
    renderCode(frames.length);
    restartAnim();
    refs.download.disabled = false;
    refs.downloadStrip.disabled = false;
    setStatus(tr("npcf.done", "已生成 {n} 帧（{w}×{h}）。", { n: frames.length, w: sheet.width, h: sheet.height }));
    return true;
  }

  // ---------- 预览 ----------
  function renderStrip() {
    const n = state.frames.length;
    const cellW = 44;
    const scale = 2;
    const c = refs.strip;
    c.width = n * cellW * scale;
    c.height = (56 + 14) * scale;
    // 预览容器的通用样式会把 canvas 缩到容器宽度，这里固定为实际像素尺寸，靠横向滚动查看
    c.style.width = c.width + "px";
    c.style.height = c.height + "px";
    c.style.maxWidth = "none";
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, c.width, c.height);
    x.font = `${10 * scale}px sans-serif`;
    x.textAlign = "center";
    const css = getComputedStyle(document.body);
    x.fillStyle = css.color || "#333";
    state.frames.forEach((f, i) => {
      x.fillText(String(i), (i * cellW + cellW / 2) * scale, 11 * scale);
      x.drawImage(f, (i * cellW + 2) * scale, 14 * scale, 40 * scale, 56 * scale);
    });
    c.title = state.labels.map((l, i) => `${i}: ${l}`).join("\n");
    refs.stripHost.classList.remove("previewFrame--empty");
  }

  function animSequence() {
    const n = state.frames.length;
    const base = n - 9;
    switch (refs.animSel.value) {
      case "attack": return [0, base + 5, base + 6, base + 7, base + 8, 0];
      case "talk": return [0, base + 3, 0, base + 3, 0, base + 4, 0, base, base + 1, 0];
      case "sit": return [base + 2];
      default: return Array.from({ length: base - 2 }, (_, i) => i + 2);
    }
  }

  function restartAnim() {
    if (state.animTimer) clearInterval(state.animTimer);
    if (!state.frames) return;
    const seq = animSequence();
    let i = 0;
    const c = refs.anim;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    const tick = () => {
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(state.frames[seq[i % seq.length]], 0, 0, c.width, c.height);
      i++;
    };
    tick();
    state.animTimer = setInterval(tick, refs.animSel.value === "walk" ? 90 : 220);
  }

  function renderCode(total) {
    refs.code.value =
      `// SetStaticDefaults()\n` +
      `Main.npcFrameCount[Type] = ${total};\n` +
      `NPCID.Sets.ExtraFramesCount[Type] = 9;\n` +
      `NPCID.Sets.AttackFrameCount[Type] = 4;`;
  }

  // ---------- 眼睛 / 嘴巴编辑 ----------
  const ZOOM = 14;

  function drawFaceEditor() {
    const c = refs.faceCanvas;
    c.width = FW * ZOOM;
    c.height = FH * ZOOM;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, c.width, c.height);
    if (state.tpl) {
      const L = buildLayers();
      x.drawImage(fullFrame(L, 0), 0, 0, c.width, c.height);
    }
    x.strokeStyle = "rgba(0,0,0,.12)";
    for (let i = 0; i <= FW; i++) { x.beginPath(); x.moveTo(i * ZOOM + 0.5, 0); x.lineTo(i * ZOOM + 0.5, c.height); x.stroke(); }
    for (let j = 0; j <= FH; j++) { x.beginPath(); x.moveTo(0, j * ZOOM + 0.5); x.lineTo(c.width, j * ZOOM + 0.5); x.stroke(); }
    const mark = (pts, color) => {
      x.strokeStyle = color;
      x.lineWidth = 3;
      for (const [px, py] of pts) x.strokeRect(px * ZOOM + 2, py * ZOOM + 2, ZOOM - 4, ZOOM - 4);
      x.lineWidth = 1;
    };
    mark(state.eyes, "#00b7ff");
    mark(state.mouth, "#ff2fa6");
  }

  function togglePixel(list, x, y) {
    const i = list.findIndex(([a, b]) => a === x && b === y);
    if (i >= 0) list.splice(i, 1);
    else list.push([x, y]);
  }

  refs.faceCanvas.addEventListener("click", (e) => {
    const r = refs.faceCanvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * FW);
    const y = Math.floor(((e.clientY - r.top) / r.height) * FH);
    togglePixel(state.editTarget === "eyes" ? state.eyes : state.mouth, x, y);
    drawFaceEditor();
    if (state.frames) generate();
  });

  function setEditTarget(t) {
    state.editTarget = t;
    refs.editEyes.classList.toggle("secondary", t !== "eyes");
    refs.editMouth.classList.toggle("secondary", t !== "mouth");
  }
  refs.editEyes.addEventListener("click", () => setEditTarget("eyes"));
  refs.editMouth.addEventListener("click", () => setEditTarget("mouth"));
  refs.faceResetBtn.addEventListener("click", () => {
    state.eyes = DEFAULT_EYES.map((p) => p.slice());
    state.mouth = DEFAULT_MOUTH.map((p) => p.slice());
    drawFaceEditor();
    if (state.frames) generate();
  });

  // ---------- 输入 ----------
  async function fileToCanvas(file) {
    const bmp = await createImageBitmap(file);
    const c = canvas(bmp.width, bmp.height);
    c.getContext("2d").drawImage(bmp, 0, 0);
    return c;
  }

  // 按整数倍最近邻缩放到目标尺寸；不是整数倍则返回 null
  function normalizeTo(src, w, h) {
    const k = src.width / w;
    if (k !== src.height / h || !Number.isInteger(k) || k < 1) return null;
    if (k === 1) return src;
    const out = canvas(w, h);
    const o = out.getContext("2d");
    o.imageSmoothingEnabled = false;
    o.drawImage(src, 0, 0, w, h);
    return out;
  }

  async function loadTemplate(file) {
    const c = await fileToCanvas(file);
    const n = normalizeTo(c, 128, 80);
    if (!n) {
      setStatus(tr("npcf.badTpl", "装备帧模板尺寸应为 128×80（或其整数倍），当前为 {w}×{h}。", { w: c.width, h: c.height }));
      return;
    }
    state.tpl = n;
    refs.tplText.textContent = `${file.name}（${c.width}×${c.height}）`;
    drawFaceEditor();
    generate();
  }

  async function loadBody(file) {
    const c = await fileToCanvas(file);
    // 1.4 身体贴图为 360×224（40×56 的 9×4 格），合成在美术像素尺度进行，因此降到 180×112
    const k = c.width / 360;
    if (k !== c.height / 224 || !Number.isInteger(k) || k < 1) {
      setStatus(tr("npcf.badBody", "1.4 身体贴图尺寸应为 360×224（或其整数倍），当前为 {w}×{h}。", { w: c.width, h: c.height }));
      return;
    }
    state.body = normalizeTo(c, 180, 112);
    refs.bodyText.textContent = `${file.name}（${c.width}×${c.height}）`;
    if (state.tpl) generate();
  }

  function wireDrop(drop, input, pick, loader) {
    pick.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      if (input.files && input.files[0]) loader(input.files[0]).catch((e) => setStatus(String(e && e.message || e)));
    });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("dragover"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loader(f).catch((err) => setStatus(String(err && err.message || err)));
    });
  }

  wireDrop(refs.tplDrop, refs.tplFile, refs.tplPick, loadTemplate);
  wireDrop(refs.bodyDrop, refs.bodyFile, refs.bodyPick, loadBody);

  // ---------- 选项 / 下载 ----------
  function fillPoseSelect(sel, def) {
    sel.innerHTML = "";
    POSES.forEach((p, i) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = tr("npcf.pose." + p.key, p.zh) + ` (${p.cell},0)`;
      sel.appendChild(o);
    });
    sel.value = String(def);
  }
  fillPoseSelect(refs.gestA, 3);
  fillPoseSelect(refs.gestB, 2);

  [refs.gender, refs.layout, refs.faceLeft, refs.gestA, refs.gestB, refs.sitBodyDy, refs.sitLegDx, refs.sitLegDy, refs.atkDx, refs.atkDy, refs.atkUnder, refs.atkSrc, refs.atkHideFront]
    .forEach((inp) => inp.addEventListener("change", () => {
      if (inp === refs.gender) drawFaceEditor();
      if (state.tpl) generate();
    }));
  refs.animSel.addEventListener("change", restartAnim);

  function downloadCanvas(c, name) {
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  }

  function baseName() {
    const f = refs.tplFile.files && refs.tplFile.files[0];
    return f ? f.name.replace(/\.[^.]+$/, "") : "NPC";
  }

  refs.download.addEventListener("click", () => {
    if (state.sheet) downloadCanvas(state.sheet, `${baseName()}_NPC.png`);
  });
  refs.downloadStrip.addEventListener("click", () => {
    if (!state.frames) return;
    const c = canvas(40 * state.frames.length, 56);
    state.frames.forEach((f, i) => c.getContext("2d").drawImage(f, i * 40, 0));
    downloadCanvas(c, `${baseName()}_NPC_horizontal.png`);
  });

  window.addEventListener("twt:i18n-applied", () => {
    const a = refs.gestA.value;
    const b = refs.gestB.value;
    fillPoseSelect(refs.gestA, a);
    fillPoseSelect(refs.gestB, b);
    if (state.tpl) generate();
  });

  setEditTarget("eyes");
  drawFaceEditor();
})();
