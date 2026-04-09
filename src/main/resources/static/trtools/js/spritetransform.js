const el = (id) => document.getElementById(id);

function T(k, vars) {
  return window.TWT_I18N && window.TWT_I18N.t ? window.TWT_I18N.t(k, vars) : k;
}

const OUT_W = 360;
const OUT_H = 224;
const SHEET_W = 40;
const SHEET_H = 1120;

/**
 * 与 TerrariaSpriteTransform.java 中 drawImage 顺序、坐标一致。
 * 每项: [which: 'body'|'arm'|'female', sx, sy, sw, sh, dx, dy, dw, dh]
 */
const BLITS = [
  ["body", 12, 14, 22, 20, 12, 14, 22, 20],
  ["body", 12, 90, 16, 16, 12, 34, 16, 16],
  ["body", 12, 306, 20, 16, 52, 26, 20, 16],
  ["body", 32, 416, 6, 18, 108, 142, 6, 18],
  ["body", 30, 416, 8, 18, 148, 138, 8, 18],
  ["body", 32, 416, 6, 18, 188, 142, 6, 18],
  ["body", 30, 416, 8, 18, 148, 194, 8, 18],
  ["body", 28, 416, 10, 18, 188, 194, 10, 18],
  ["body", 32, 416, 6, 18, 228, 194, 6, 18],
  ["body", 34, 416, 4, 18, 268, 196, 4, 18],
  ["body", 24, 294, 12, 16, 104, 182, 12, 16],
  ["arm", 0, 0, 40, 56, 80, 0, 40, 56],
  ["arm", 0, 56, 40, 56, 120, 0, 40, 56],
  ["arm", 0, 112, 40, 56, 160, 0, 40, 56],
  ["arm", 0, 168, 40, 56, 200, 0, 40, 56],
  ["arm", 0, 224, 40, 56, 240, 0, 40, 56],
  ["arm", 4, 16, 18, 32, 284, 16, 18, 32],
  ["arm", 4, 16, 18, 32, 284, 70, 18, 32],
  ["arm", 4, 16, 18, 32, 284, 124, 18, 32],
  ["arm", 4, 16, 18, 32, 284, 178, 18, 32],
  ["arm", 4, 30, 18, 18, 338, 30, 18, 18],
  ["arm", 4, 30, 18, 18, 338, 84, 18, 18],
  ["arm", 4, 30, 18, 18, 338, 138, 18, 18],
  ["arm", 4, 30, 18, 18, 338, 192, 18, 18],
  ["arm", 4, 862, 26, 26, 244, 80, 26, 26],
  ["arm", 0, 280, 40, 56, 80, 56, 40, 56],
  ["arm", 0, 336, 40, 56, 120, 56, 40, 56],
  ["arm", 0, 560, 40, 56, 160, 56, 40, 56],
  ["arm", 0, 952, 40, 56, 200, 56, 40, 56],
  ["female", 12, 14, 22, 22, 12, 126, 22, 22],
  ["female", 12, 92, 16, 16, 12, 148, 16, 16],
  ["female", 12, 306, 20, 16, 52, 138, 20, 16],
];

const refs = {
  fileBody: el("stFileBody"),
  fileArm: el("stFileArm"),
  fileFemale: el("stFileFemale"),
  pathBody: el("stPathBody"),
  pathArm: el("stPathArm"),
  pathFemale: el("stPathFemale"),
  useBodyForFemale: el("stUseBodyForFemale"),
  browseBody: el("stBrowseBody"),
  browseArm: el("stBrowseArm"),
  browseFemale: el("stBrowseFemale"),
  btnTransform: el("stTransform"),
  btnDownload: el("stDownload"),
  status: el("stStatus"),
  preview: el("stPreview"),
  previewHost: el("stPreviewHost"),
  onlineCount: el("onlineCount"),
  femaleRow: el("stFemaleRow"),
  toTop: el("toTop"),
};

let imgBody = null;
let imgArm = null;
let imgFemale = null;
let lastOutBlob = null;

function setStatus(msg) {
  refs.status.textContent = msg || "";
}

async function fileToImageBitmap(file) {
  if (!file) return null;
  return createImageBitmap(file);
}

function validateSize(bmp, labelKey) {
  if (bmp.width !== SHEET_W || bmp.height !== SHEET_H) {
    throw new Error(
      T("st.badSize", {
        label: T(labelKey),
        w: SHEET_W,
        h: SHEET_H,
        aw: bmp.width,
        ah: bmp.height,
      })
    );
  }
}

function transform(body, arm, female) {
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, OUT_W, OUT_H);

  const pick = (which) => {
    if (which === "body") return body;
    if (which === "arm") return arm;
    return female;
  };

  for (const row of BLITS) {
    const [which, sx, sy, sw, sh, dx, dy, dw, dh] = row;
    const src = pick(which);
    ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  return canvas;
}

async function runTransform() {
  setStatus("");
  lastOutBlob = null;
  refs.btnDownload.disabled = true;
  if (refs.previewHost) refs.previewHost.classList.add("previewFrame--empty");
  if (refs.preview) {
    const px = refs.preview.getContext("2d");
    px.clearRect(0, 0, OUT_W, OUT_H);
  }

  try {
    if (!refs.fileBody.files?.[0] || !refs.fileArm.files?.[0]) {
      setStatus(T("st.needBodyArm"));
      return;
    }
    const useSame = refs.useBodyForFemale.checked;
    if (!useSame && !refs.fileFemale.files?.[0]) {
      setStatus(T("st.needFemale"));
      return;
    }

    imgBody = await fileToImageBitmap(refs.fileBody.files[0]);
    imgArm = await fileToImageBitmap(refs.fileArm.files[0]);
    validateSize(imgBody, "st.lblBodyShort");
    validateSize(imgArm, "st.lblArmShort");

    if (useSame) {
      imgFemale = imgBody;
    } else {
      imgFemale = await fileToImageBitmap(refs.fileFemale.files[0]);
      validateSize(imgFemale, "st.lblFemaleShort");
    }

    const canvas = transform(imgBody, imgArm, imgFemale);
    const pctx = refs.preview.getContext("2d");
    pctx.imageSmoothingEnabled = false;
    refs.preview.width = OUT_W;
    refs.preview.height = OUT_H;
    pctx.clearRect(0, 0, OUT_W, OUT_H);
    pctx.drawImage(canvas, 0, 0);

    lastOutBlob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    refs.btnDownload.disabled = !lastOutBlob;
    if (refs.previewHost) refs.previewHost.classList.remove("previewFrame--empty");
    setStatus(T("st.done"));
  } catch (e) {
    setStatus(e?.message || String(e));
  }
}

function wireBrowse(fileInput, pathInput, browseBtn) {
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    pathInput.value = f ? f.name : "";
    if (!f) pathInput.setAttribute("placeholder", T("st.phNone"));
  });
}

wireBrowse(refs.fileBody, refs.pathBody, refs.browseBody);
wireBrowse(refs.fileArm, refs.pathArm, refs.browseArm);
wireBrowse(refs.fileFemale, refs.pathFemale, refs.browseFemale);

refs.useBodyForFemale.addEventListener("change", () => {
  const on = refs.useBodyForFemale.checked;
  refs.fileFemale.disabled = on;
  refs.browseFemale.disabled = on;
  if (refs.femaleRow) refs.femaleRow.classList.toggle("stDisabled", on);
  if (on) {
    refs.pathFemale.value = "";
    refs.fileFemale.value = "";
  }
});

refs.btnTransform.addEventListener("click", () => runTransform());

refs.btnDownload.addEventListener("click", async () => {
  if (!lastOutBlob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(lastOutBlob);
  a.download = "sprite_transform.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
});

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
          applyCount(await res.json());
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

refs.useBodyForFemale.dispatchEvent(new Event("change"));
initOnlineCount();

if (refs.toTop) {
  window.addEventListener(
    "scroll",
    () => {
      refs.toTop.style.display = window.scrollY > 500 ? "flex" : "none";
    },
    { passive: true }
  );
  refs.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
