// 装备帧模板（128×80）拆解规则：装备帧生成器与 NPC帧图生成器共用。
// 输出为玩家 20 帧竖排（每帧 20×28 美术像素，共 20×560），之后由各工具自行叠放 / 放大。
// 玩家帧：0 站立 / 1~4 使用物品（挥动手臂）/ 5 跳跃 / 6~19 行走。
(function () {
  "use strict";

  const frontArmOffsets = [0, -1, -1, -1, -1, 0, 0, 0, 1, 2, 2, 1, 0, 0];
  const backArmOffsets = [0, 1, 1, 1, 0, 0, 0, 0, -1, -2, -2, -1, 0, 0];
  const bodyHeadOffsets = [0, 0, 0, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0];
  const legMapping = [[5], [7], [8], [9], [10], [13], [14], [15], [16], [17, 18]];

  function createPixelCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").imageSmoothingEnabled = false;
    return c;
  }

  function ctx2d(c) {
    return c.getContext("2d", { willReadFrequently: true });
  }

  // 只拷贝不透明像素（叠加而非覆盖）；ignored 为源图中要跳过的像素坐标
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
    const tmp = createPixelCanvas(20, 560);
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

  function actionTorso(s, d, female = false) {
    for (let k = 0; k < 20; k++) {
      const sy = k === 5 ? 48 : 19;
      const sx = female ? 44 : 23;
      const ignored = female || (k !== 1 && k <= 5) ? null : [[37, sy + 16], [37, sy + 17]];
      copyRect(s, d, sx, sy, 20, 28, 0, k * 28 + bodyHeadOffsets[k], ignored);
    }
  }

  // 身体 = 后臂 + 躯干 + 前臂
  function actionBody(s, d, female = false) {
    actionBackArm(s, d);
    actionTorso(s, d, female);
    actionFrontArm(s, d);
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

  // 模板必须为 128×80；常见误用是导出为整数倍（如 256×160），这里最近邻缩回 128×80
  // @returns {{ ok: boolean, canvas: HTMLCanvasElement, scale: number|null, w: number, h: number }}
  function normalizeTemplateCanvas(src) {
    const w = src.width;
    const h = src.height;
    if (w === 128 && h === 80) return { ok: true, canvas: src, scale: 1, w, h };
    const kw = w / 128;
    const kh = h / 80;
    if (kw === kh && Number.isInteger(kw) && kw >= 2) {
      const out = createPixelCanvas(128, 80);
      const ctx = out.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, w, h, 0, 0, 128, 80);
      return { ok: true, canvas: out, scale: kw, w, h };
    }
    return { ok: false, canvas: src, scale: null, w, h };
  }

  async function fileToCanvas(file) {
    const bmp = await createImageBitmap(file);
    const c = createPixelCanvas(bmp.width, bmp.height);
    c.getContext("2d").drawImage(bmp, 0, 0);
    return c;
  }

  window.TWT_ARMOR_TPL = {
    frontArmOffsets,
    backArmOffsets,
    bodyHeadOffsets,
    legMapping,
    createPixelCanvas,
    ctx2d,
    copyRect,
    fillRect,
    actionFrontArm,
    actionBackArm,
    actionHead,
    actionTorso,
    actionBody,
    actionLegs,
    normalizeTemplateCanvas,
    fileToCanvas
  };
})();
