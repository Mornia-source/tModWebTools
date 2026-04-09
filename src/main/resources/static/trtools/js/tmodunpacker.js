(function () {
  "use strict";

  function T(k, vars) {
    return window.TWT_I18N && window.TWT_I18N.t ? window.TWT_I18N.t(k, vars) : k;
  }

  function logLocale() {
    try {
      return window.TWT_I18N && window.TWT_I18N.getLang() === "en" ? "en-US" : "zh-CN";
    } catch (_) {
      return "zh-CN";
    }
  }

  const el = (id) => document.getElementById(id);

  const refs = {
    file: el("tmuFile"),
    pick: el("tmuPick"),
    run: el("tmuRun"),
    log: el("tmuLog"),
    fileSummary: el("tmuFileSummary"),
    toTop: el("toTop"),
  };

  function setStatus(lines) {
    const text = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
    if (text) appendLog(text);
  }

  function clearLog() {
    if (refs.log) refs.log.textContent = "";
  }

  function appendLog(line) {
    if (!refs.log) return;
    const now = new Date();
    const ts = now.toLocaleTimeString(logLocale(), { hour12: false });
    refs.log.textContent += `[${ts}] ${line}\n`;
    refs.log.scrollTop = refs.log.scrollHeight;
  }

  async function downloadZipFromResponse(res, suggestedName) {
    const blob = await res.blob();
    if (!blob || blob.size === 0) {
      throw new Error(T("tmu.noZip"));
    }

    const cd = res.headers.get("Content-Disposition") || "";
    let fileName = suggestedName;
    const m = cd.match(/filename="?([^"]+)"?/i);
    if (m && m[1]) fileName = m[1];

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "ZIP Archive",
              accept: { "application/zip": [".zip"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        /* user cancel or API failure */
      }
    }

    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function run() {
    if (!refs.file || !refs.run) return;
    const f = refs.file.files && refs.file.files[0] ? refs.file.files[0] : null;
    if (!f) {
      setStatus(T("tmu.needFile"));
      appendLog(T("tmu.logNoFile"));
      return;
    }

    refs.run.disabled = true;
    refs.run.classList.add("isLoading");
    clearLog();
    setStatus(T("tmu.busy"));
    appendLog(T("tmu.logStart", { name: f.name }));

    try {
      const fd = new FormData();
      fd.append("file", f, f.name);
      const res = await fetch("/trtools/unpack", { method: "POST", body: fd });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt || "HTTP " + res.status;
        try {
          const obj = JSON.parse(txt);
          if (obj && (obj.message || obj.error)) {
            msg = obj.message || obj.error;
          }
        } catch (_) {}
        appendLog(T("tmu.logErr", { msg: msg }));
        throw new Error(T("tmu.errFail", { msg: msg }));
      }

      await downloadZipFromResponse(res, f.name.replace(/\.tmod$/i, "") + "-unpacked.zip");
      appendLog(T("tmu.logDone"));
      appendLog(T("tmu.logSave"));
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      appendLog(msg);
    } finally {
      refs.run.disabled = false;
      refs.run.classList.remove("isLoading");
    }
  }

  function syncFileSummaryI18n() {
    if (!refs.file || !refs.fileSummary) return;
    const f = refs.file.files && refs.file.files[0] ? refs.file.files[0] : null;
    refs.fileSummary.textContent = f ? f.name : T("tmu.none");
  }

  if (refs.pick && refs.file) {
    refs.pick.addEventListener("click", function () {
      refs.file.click();
    });
  }

  if (refs.file && refs.fileSummary) {
    refs.file.addEventListener("change", function () {
      syncFileSummaryI18n();
    });
  }

  if (refs.run) refs.run.addEventListener("click", run);

  window.addEventListener("twt:i18n-applied", syncFileSummaryI18n);

  if (refs.toTop) {
    window.addEventListener(
      "scroll",
      function () {
        refs.toTop.style.display = window.scrollY > 500 ? "flex" : "none";
      },
      { passive: true }
    );
    refs.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
})();
