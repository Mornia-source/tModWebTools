import { FFmpeg } from "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js";
import { fetchFile, toBlobURL } from "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js";

/** file:// 下无法用 ES 模块相对路径，且 Worker 无法跨源；须用 http(s) 访问 */
const OGG_HTTP_ENV = /^https?:$/i.test(location.protocol);

const el = (id) => document.getElementById(id);

function twtT(k, vars) {
  try {
    if (typeof window.TWT_I18N !== "undefined" && window.TWT_I18N.t) return window.TWT_I18N.t(k, vars);
  } catch (_) {}
  return k;
}

const ACCEPT_EXT = new Set(["mp3", "wma", "m4a", "aac", "flac", "wav", "ogg", "oga"]);

const refs = {
  drop: el("oggDrop"),
  files: el("oggFiles"),
  pick: el("pickOgg"),
  clear: el("clearOgg"),
  summary: el("oggFileSummary"),
  list: el("oggFileList"),
  stripMeta: el("oggStripMeta"),
  progressWrap: el("oggProgressWrap"),
  progressBar: el("oggProgressBar"),
  btnLoadCore: el("btnLoadCore"),
  btnConvert: el("btnConvert"),
  btnZip: el("btnZip"),
  status: el("oggStatus"),
  log: el("oggLog"),
  onlineCount: el("onlineCount"),
  toTop: el("toTop"),
  dlList: el("oggDlList"),
};

/** @type {string[]} */
let dlUrls = [];

/** @type {File[]} */
let queue = [];
/** @type {{ name: string, blob: Blob }[]} */
let lastOutputs = [];

let ffmpegInst = null;
let loadPromise = null;

function logLine(msg) {
  refs.log.textContent += `${msg}\n`;
  refs.log.scrollTop = refs.log.scrollHeight;
}

function setStatus(msg) {
  refs.status.textContent = msg || "";
}

function setProgress(p) {
  const v = Math.max(0, Math.min(100, p));
  refs.progressBar.style.width = `${v}%`;
  refs.progressWrap.hidden = v <= 0;
}

function extOf(name) {
  const m = /\.([^.]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

function baseNameNoExt(name) {
  return name.replace(/\.[^.]+$/, "") || "sound";
}

function revokeDlUrls() {
  dlUrls.forEach((u) => {
    try {
      URL.revokeObjectURL(u);
    } catch (_) {}
  });
  dlUrls = [];
}

function renderDownloadLinks() {
  revokeDlUrls();
  refs.dlList.innerHTML = "";
  lastOutputs.forEach(({ name, blob }) => {
    const u = URL.createObjectURL(blob);
    dlUrls.push(u);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.className = "btn secondary";
    a.style.margin = "0 8px 8px 0";
    a.textContent = twtT("ogg.dlNamed", { name });
    refs.dlList.appendChild(a);
  });
}

function refreshList() {
  refs.summary.textContent = queue.length ? twtT("ogg.sumN", { n: queue.length }) : twtT("ogg.none");
  refs.btnConvert.disabled = queue.length === 0 || !OGG_HTTP_ENV;
  refs.btnZip.disabled = lastOutputs.length === 0 || !OGG_HTTP_ENV;

  refs.list.innerHTML = "";
  if (!queue.length) {
    refs.list.hidden = true;
    return;
  }
  refs.list.hidden = false;
  queue.forEach((f, i) => {
    const li = document.createElement("li");
    const ext = extOf(f.name);
    const ok = ACCEPT_EXT.has(ext);
    const meta = ok ? ext : twtT("ogg.maybeUnsupported", { ext });
    li.innerHTML = `<span class="oggFileName">${f.name}</span><span class="oggFileMeta">${meta}</span>`;
    if (!ok) li.classList.add("oggWarn");
    refs.list.appendChild(li);
  });
}

function addFiles(fileList) {
  const next = Array.from(fileList || []);
  queue.push(...next);
  refreshList();
}

async function ensureFfmpeg() {
  if (!OGG_HTTP_ENV) {
    throw new Error(twtT("ogg.errHttp"));
  }
  if (ffmpegInst) return ffmpegInst;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => logLine(message));
    const ver = "0.12.10";
    const coreBase = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${ver}/dist/esm`;
    const loadCfg = {
      coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm"),
    };
    // 关键：worker.js 必须从“同源”加载，否则宝塔/域名环境下会触发 CORS 导致 Worker 构造失败。
    // 同时设置 workerURL / classWorkerURL，兼容 @ffmpeg/ffmpeg 内部对字段名的差异。
    const workerLocalUrl = new URL("/trtools/js/ffmpeg-local/worker.js", location.origin).href;
    loadCfg.workerURL = workerLocalUrl;
    loadCfg.classWorkerURL = workerLocalUrl;
    setStatus(twtT("ogg.loadingCore"));
    logLine(`[init] loading core ${ver} …`);
    await ffmpeg.load(loadCfg);
    logLine(twtT("ogg.logReady"));
    ffmpegInst = ffmpeg;
    setStatus("");
    return ffmpeg;
  })().catch((err) => {
    loadPromise = null;
    ffmpegInst = null;
    throw err;
  });

  return loadPromise;
}

async function convertAll() {
  if (!queue.length) return;
  lastOutputs = [];
  revokeDlUrls();
  refs.dlList.innerHTML = "";
  refs.btnZip.disabled = true;
  refs.btnConvert.disabled = true;
  refs.btnLoadCore.disabled = true;
  setProgress(0);
  refs.log.textContent = "";

  try {
    const ffmpeg = await ensureFfmpeg();
    const strip = refs.stripMeta.checked;
    const total = queue.length;

    for (let i = 0; i < total; i++) {
      const file = queue[i];
      const ext = extOf(file.name) || "dat";
      const inName = `in_${i}.${ext}`;
      const outName = `out_${i}.ogg`;
      setStatus(twtT("ogg.converting", { i: i + 1, total, name: file.name }));
      setProgress(((i + 0.2) / total) * 100);

      await ffmpeg.writeFile(inName, await fetchFile(file));
      const args = [
        "-i",
        inName,
        "-y",
        "-vn",
        "-c:a",
        "libvorbis",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-qscale:a",
        "5",
      ];
      if (strip) {
        args.push("-map_metadata", "-1");
      }
      args.push(outName);

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outName);
      try {
        await ffmpeg.deleteFile(inName);
      } catch (_) {}
      try {
        await ffmpeg.deleteFile(outName);
      } catch (_) {}

      const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
      const blob = new Blob([buf], { type: "audio/ogg" });
      const outFn = `${baseNameNoExt(file.name)}.ogg`;
      lastOutputs.push({ name: outFn, blob });
      setProgress(((i + 1) / total) * 100);
    }

    setStatus(twtT("ogg.doneN", { n: lastOutputs.length }));
    refs.btnZip.disabled = false;
    renderDownloadLinks();
  } catch (err) {
    logLine(`[error] ${err?.message || err}`);
    setStatus(twtT("ogg.fail", { e: err?.message || err }));
  } finally {
    refs.btnConvert.disabled = queue.length === 0;
    refs.btnLoadCore.disabled = false;
    setTimeout(() => setProgress(0), 400);
  }
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function zipAll() {
  if (!lastOutputs.length) return;
  const JSZip = window.JSZip;
  if (!JSZip) {
    setStatus(twtT("ogg.noJszip"));
    return;
  }
  setStatus(twtT("ogg.zipping"));
  const zip = new JSZip();
  for (const { name, blob } of lastOutputs) {
    zip.file(name, blob);
  }
  const zblob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zblob, "terraria_sounds_vorbis.zip");
  setStatus(twtT("ogg.zipDone"));
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

refs.pick.addEventListener("click", () => refs.files.click());
refs.clear.addEventListener("click", () => {
  queue = [];
  lastOutputs = [];
  refs.files.value = "";
  revokeDlUrls();
  refs.dlList.innerHTML = "";
  refreshList();
  refs.btnZip.disabled = true;
  setStatus("");
});

refs.files.addEventListener("change", () => {
  addFiles(refs.files.files);
  refs.files.value = "";
});

refs.drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  refs.drop.classList.add("dragover");
});
refs.drop.addEventListener("dragleave", () => refs.drop.classList.remove("dragover"));
refs.drop.addEventListener("drop", (e) => {
  e.preventDefault();
  refs.drop.classList.remove("dragover");
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
});

refs.btnLoadCore.addEventListener("click", async () => {
  refs.btnLoadCore.disabled = true;
  try {
    await ensureFfmpeg();
    setStatus(twtT("ogg.coreReady"));
  } catch (err) {
    setStatus(twtT("ogg.preloadFail", { e: err?.message || err }));
  } finally {
    refs.btnLoadCore.disabled = false;
  }
});

refs.btnConvert.addEventListener("click", () => convertAll());
refs.btnZip.addEventListener("click", () => zipAll().catch((e) => setStatus(twtT("ogg.zipFail", { e: e?.message || e }))));

window.addEventListener("scroll", () => {
  refs.toTop.style.display = window.scrollY > 500 ? "flex" : "none";
}, { passive: true });
refs.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

function initOggFileProtocolUi() {
  if (OGG_HTTP_ENV) return;
  const warn = el("oggFileProtocolWarn");
  if (warn) warn.hidden = false;
  refs.btnLoadCore.disabled = true;
  refs.btnConvert.disabled = true;
  refs.btnZip.disabled = true;
  setStatus(twtT("ogg.fileProto"));
}

refreshList();
initOggFileProtocolUi();
initOnlineCount();
window.addEventListener("twt:i18n-applied", () => {
  refreshList();
  if (lastOutputs.length) renderDownloadLinks();
});
