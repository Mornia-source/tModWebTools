(function () {
  "use strict";

  function T(k, vars) {
    return window.TWT_I18N && window.TWT_I18N.t ? window.TWT_I18N.t(k, vars) : k;
  }

  const MODE_KEYS = {
    "0": "tex.mode0",
    "-1": "tex.modeNeg1",
    "1": "tex.mode1",
    "2": "tex.mode2",
    "3": "tex.mode3",
    "4": "tex.mode4",
    "5": "tex.mode5",
    "6": "tex.mode6",
    "7": "tex.mode7",
    "8": "tex.mode8",
    "9": "tex.mode9",
    "10": "tex.mode10",
    "11": "tex.mode11",
  };

  const MODE_ICONS = {
    "1": "/trtools/img/土块.png",
    "2": "/trtools/img/石块.png",
    "3": "/trtools/img/泥块.png",
    "4": "/trtools/img/雪块.png",
    "5": "/trtools/img/树叶块.png",
    "6": "/trtools/img/云.png",
    "7": "/trtools/img/沙块.png",
    "8": "/trtools/img/猩红沙块.png",
    "9": "/trtools/img/黑檀沙块.png",
    "10": "/trtools/img/珍珠沙块.png",
    "11": "/trtools/img/灰烬块.png",
  };

  /** @type {Promise<any>|null} */
  let blitsPromise = null;

  function loadBlits() {
    if (!blitsPromise) {
      blitsPromise = fetch("/trtools/js/_texture_splitter_blits.json")
        .then((r) => {
          if (!r.ok) throw new Error(T("tex.errRules"));
          return r.json();
        });
    }
    return blitsPromise;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {CanvasImageSource} src
   * @param {number[][]} blits [dx,dy,dw,dh,sx,sy,sw,sh]
   */
  function applyBlits(ctx, src, blits) {
    for (const b of blits) {
      const [dx, dy, dw, dh, sx, sy, sw, sh] = b;
      ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  }

  /**
   * @param {CanvasImageSource} src
   * @param {number} w
   * @param {number} h
   * @param {number[][]} blits
   */
  function renderWithBlits(src, w, h, blits) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(T("tex.errCanvas"));
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    applyBlits(ctx, src, blits);
    return canvas;
  }

  /**
   * @param {number} tt 1..11 叠加 FG_tt.png；-1 与 0 不叠加
   */
  function overlayUrl(tt) {
    return `/trtools/img/texture-splitter-overlays/FG_${tt}.png`;
  }

  const refs = {
    drop: document.getElementById("tsDrop"),
    file: document.getElementById("tsFile"),
    pick: document.getElementById("tsPick"),
    modeWrap: document.getElementById("tsModeWrap"),
    modeSelect: document.getElementById("tsMode"),
    modeRich: document.getElementById("tsModeRich"),
    modeRichBtn: document.getElementById("tsModeRichBtn"),
    modeRichIcon: document.getElementById("tsModeRichIcon"),
    modeRichText: document.getElementById("tsModeRichText"),
    modeRichMenu: document.getElementById("tsModeRichMenu"),
    modeRichList: document.getElementById("tsModeRichList"),
    run: document.getElementById("tsRun"),
    download: document.getElementById("tsDownload"),
    status: document.getElementById("tsStatus"),
    previewHost: document.getElementById("tsPreviewHost"),
    preview: document.getElementById("tsPreview"),
    kindHint: document.getElementById("tsKindHint"),
    samplePickTile: document.getElementById("tsSamplePickTile"),
    samplePickWall: document.getElementById("tsSamplePickWall"),
    onlineCount: document.getElementById("onlineCount"),
    toTop: document.getElementById("toTop"),
  };

  let lastBlobUrl = null;
  /** @type {File|null} */
  let currentFile = null;
  /** @type {"tile"|"wall"|null} */
  let detectedKind = null;

  function setStatus(msg, isError) {
    refs.status.textContent = msg || "";
    refs.status.style.color = isError ? "var(--danger, #b91c1c)" : "";
  }

  function revokeLast() {
    if (lastBlobUrl) {
      URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = null;
    }
  }

  function setPreviewEmpty() {
    const c = refs.preview;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, c.width, c.height);
    }
    refs.previewHost.classList.add("previewFrame--empty");
    refs.download.disabled = true;
    revokeLast();
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  function showPreview(canvas) {
    const c = refs.preview;
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, 0);
    refs.previewHost.classList.remove("previewFrame--empty");
    revokeLast();
    lastBlobUrl = canvas.toDataURL("image/png");
    refs.download.disabled = false;
  }

  async function processCurrent() {
    if (!currentFile) {
      setStatus(T("tex.msgPickPng"), true);
      return;
    }
    setStatus(T("tex.busy"));
    refs.download.disabled = true;

    try {
      const blitsData = await loadBlits();
      const bmp = await createImageBitmap(currentFile);

      if (detectedKind === "wall") {
        if (bmp.width !== 106 || bmp.height !== 106) {
          setStatus(T("tex.msgWallSize"), true);
          return;
        }
        const canvas = renderWithBlits(
          bmp,
          468,
          180,
          blitsData.wall468x180
        );
        showPreview(canvas);
        setStatus(T("tex.msgWallOk"));
        return;
      }

      if (detectedKind !== "tile") {
        setStatus(T("tex.msgPickTileWall"), true);
        return;
      }

      if (bmp.width !== 74 || bmp.height !== 74) {
        setStatus(T("tex.msgTileSize"), true);
        return;
      }

      const mode = refs.modeSelect.value;

      if (mode === "0") {
        const canvas = renderWithBlits(
          bmp,
          234,
          90,
          blitsData.tile234x90
        );
        showPreview(canvas);
        setStatus(T("tex.msgTileOk0"));
        return;
      }

      const canvas288 = document.createElement("canvas");
      canvas288.width = 288;
      canvas288.height = 270;
      const ctx = canvas288.getContext("2d");
      if (!ctx) throw new Error(T("tex.errCanvas"));
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 288, 270);
      applyBlits(ctx, bmp, blitsData.tile288x270);

      if (mode === "-1") {
        showPreview(canvas288);
        setStatus(T("tex.msgTileOkCustom"));
        return;
      }

      const tt = parseInt(mode, 10);
      if (tt < 1 || tt > 11) {
        setStatus(T("tex.msgUnknownMode"), true);
        return;
      }

      const ol = new Image();
      ol.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        ol.onload = () => resolve();
        ol.onerror = () => reject(new Error(T("tex.errOverlay", { n: tt })));
        ol.src = overlayUrl(tt);
      });

      ctx.drawImage(ol, 0, 0, 288, 270, 0, 0, 288, 270);
      showPreview(canvas288);
      setStatus(T("tex.msgTileOk", { mode: T(MODE_KEYS[String(mode)]) }));
    } catch (e) {
      console.error(e);
      setStatus(e?.message || String(e), true);
      setPreviewEmpty();
    }
  }

  function detectKind(w, h) {
    if (w === 74 && h === 74) return "tile";
    if (w === 106 && h === 106) return "wall";
    return null;
  }

  /** 物块衔接模式：仅 74×74 物块时可操作，其余时候灰显 */
  function setModeUiEnabled(enabled) {
    if (!refs.modeWrap) return;
    refs.modeWrap.classList.toggle("tsModeWrap--disabled", !enabled);
    if (refs.modeSelect) {
      refs.modeSelect.disabled = !enabled;
      refs.modeSelect.setAttribute("aria-disabled", String(!enabled));
    }

    if (refs.modeRichBtn) {
      refs.modeRichBtn.disabled = !enabled;
      refs.modeRichBtn.setAttribute("aria-disabled", String(!enabled));
    }
    if (refs.modeRichMenu) {
      refs.modeRichMenu.hidden = true;
    }

    if (!enabled) {
      if (refs.modeRichText) refs.modeRichText.textContent = T("tex.modePlaceholder");
      if (refs.modeRichIcon) {
        refs.modeRichIcon.src = "";
        refs.modeRichIcon.style.display = "none";
      }
      if (refs.modeRichList) {
        Array.from(refs.modeRichList.querySelectorAll("[aria-selected]")).forEach((el) => {
          el.setAttribute("aria-selected", "false");
        });
      }
      return;
    }

    // enabled: 同步 rich 下拉显示与隐藏 select 的当前值
    if (refs.modeSelect) updateModeRichFromSelect();
  }

  function clearSampleActive() {
    if (refs.samplePickTile) refs.samplePickTile.classList.remove("tsFormatHintPick--active");
    if (refs.samplePickWall) refs.samplePickWall.classList.remove("tsFormatHintPick--active");
  }

  function updateModeRichUI(value) {
    if (!refs.modeRichBtn || !refs.modeRichText || !refs.modeRichIcon) return;
    const vk = String(value);
    const key = MODE_KEYS[vk] || MODE_KEYS["0"];
    refs.modeRichText.textContent = T(key);
    const iconUrl = MODE_ICONS[vk];
    if (iconUrl) {
      refs.modeRichIcon.src = iconUrl;
      refs.modeRichIcon.style.display = "";
    } else {
      refs.modeRichIcon.src = "";
      refs.modeRichIcon.style.display = "none";
    }

    if (refs.modeRichList) {
      Array.from(refs.modeRichList.querySelectorAll(".tsRichSelectItem")).forEach((li) => {
        const v = li.getAttribute("data-value");
        li.setAttribute("aria-selected", v === String(value) ? "true" : "false");
      });
    }
  }

  function updateModeRichFromSelect() {
    if (!refs.modeSelect) return;
    updateModeRichUI(refs.modeSelect.value);
  }

  function initModeRichSelect() {
    if (!refs.modeRichBtn || !refs.modeRichList) return;

    var optionOrder = ["0", "-1", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
    // 构建下拉列表
    for (var i = 0; i < optionOrder.length; i++) {
      var v = optionOrder[i];
      var mkey = MODE_KEYS[v] || MODE_KEYS["0"];
      var iu = MODE_ICONS[v];
      var li = document.createElement("li");
      li.className = "tsRichSelectItem";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.setAttribute("data-value", v);
      li.tabIndex = -1;

      var iconTag = "";
      if (iu) {
        iconTag =
          '<img class="tsRichSelectIcon" src="' +
          iu +
          '" alt="" decoding="async" fetchpriority="low" />';
      } else {
        iconTag =
          '<img class="tsRichSelectIcon" alt="" decoding="async" fetchpriority="low" style="display:none" />';
      }

      li.innerHTML =
        iconTag +
        '<span class="tsRichSelectValueText">' +
        T(mkey) +
        "</span>";
      refs.modeRichList.appendChild(li);
    }

    /** 用 fixed 对齐到按钮，避免任意祖先 overflow:hidden 裁切下拉（CSS 里 tsRichSelectHost 仍保留为兜底） */
    function syncModeRichMenuLayout() {
      if (!refs.modeRichMenu || !refs.modeRichBtn || !refs.modeRichList) return;
      if (refs.modeRichMenu.hidden) {
        refs.modeRichList.removeAttribute("style");
        refs.modeRichList.classList.remove("tsRichSelectList--fixed");
        return;
      }
      var rect = refs.modeRichBtn.getBoundingClientRect();
      var margin = 6;
      var pad = 8;
      var vv = window.visualViewport;
      var vh = vv && vv.height ? vv.height : window.innerHeight;
      var maxH = Math.max(120, Math.min(440, vh - rect.bottom - margin - pad));
      var w = Math.min(rect.width, window.innerWidth - 2 * pad);
      var left = rect.left;
      if (left + w > window.innerWidth - pad) left = window.innerWidth - pad - w;
      if (left < pad) left = pad;
      refs.modeRichList.classList.add("tsRichSelectList--fixed");
      var s = refs.modeRichList.style;
      s.position = "fixed";
      s.left = left + "px";
      s.top = rect.bottom + margin + "px";
      s.width = w + "px";
      s.maxHeight = maxH + "px";
      s.right = "auto";
      s.boxSizing = "border-box";
      s.zIndex = "400";
      s.overflow = "auto";
    }

    function setModeRichMenuOpen(open) {
      var on = !!open;
      if (refs.modeRich) refs.modeRich.classList.toggle("tsRichSelect--open", on);
      var host = refs.modeRich && refs.modeRich.closest(".tsRichSelectHost");
      if (host) host.classList.toggle("tsRichSelectHost--open", on);
      if (!on) {
        if (refs.modeRichList) {
          refs.modeRichList.removeAttribute("style");
          refs.modeRichList.classList.remove("tsRichSelectList--fixed");
        }
      } else {
        requestAnimationFrame(function () {
          requestAnimationFrame(syncModeRichMenuLayout);
        });
      }
    }

    function onModeRichMenuLayoutTick() {
      if (refs.modeRichMenu && !refs.modeRichMenu.hidden) syncModeRichMenuLayout();
    }

    refs.modeRichList.addEventListener("click", (e) => {
      var item = e.target.closest(".tsRichSelectItem");
      if (!item || refs.modeRichBtn.disabled) return;
      var v = item.getAttribute("data-value");
      if (refs.modeSelect) refs.modeSelect.value = v;
      updateModeRichUI(v);
      if (refs.modeRichMenu) refs.modeRichMenu.hidden = true;
      setModeRichMenuOpen(false);
    });

    // 打开/关闭
    refs.modeRichBtn.addEventListener("click", () => {
      if (refs.modeRichBtn.disabled) return;
      if (!refs.modeRichMenu) return;
      refs.modeRichMenu.hidden = !refs.modeRichMenu.hidden;
      setModeRichMenuOpen(!refs.modeRichMenu.hidden);
    });

    function closeModeRichMenuFromOutside(ev) {
      if (!refs.modeRichMenu || refs.modeRichBtn.disabled) return;
      var t = ev.target;
      if (!t) return;
      if (t.closest("#tsModeRich")) return;
      refs.modeRichMenu.hidden = true;
      setModeRichMenuOpen(false);
    }

    document.addEventListener("mousedown", closeModeRichMenuFromOutside);
    document.addEventListener("touchstart", closeModeRichMenuFromOutside, { passive: true });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!refs.modeRichMenu || refs.modeRichMenu.hidden) return;
      refs.modeRichMenu.hidden = true;
      setModeRichMenuOpen(false);
    });

    window.addEventListener("scroll", onModeRichMenuLayoutTick, true);
    window.addEventListener("resize", onModeRichMenuLayoutTick);

    // 初始化显示为 select 当前值
    updateModeRichFromSelect();
  }

  function setSampleActive(kind) {
    if (refs.samplePickTile)
      refs.samplePickTile.classList.toggle("tsFormatHintPick--active", kind === "tile");
    if (refs.samplePickWall)
      refs.samplePickWall.classList.toggle("tsFormatHintPick--active", kind === "wall");
  }

  async function onFileSelected(file, opts) {
    const fromSample = !!(opts && opts.fromSample);
    currentFile = file;
    setPreviewEmpty();
    if (!file) {
      refs.kindHint.textContent = "";
      detectedKind = null;
      setModeUiEnabled(false);
      clearSampleActive();
      return;
    }

    if (!fromSample) clearSampleActive();

    if (!file.type.match(/^image\/(png|webp)/) && !/\.png$/i.test(file.name)) {
      setStatus(T("tex.msgPngType"), true);
      refs.kindHint.textContent = "";
      detectedKind = null;
      setModeUiEnabled(false);
      if (fromSample) clearSampleActive();
      return;
    }

    let bmp;
    try {
      bmp = await createImageBitmap(file);
    } catch (_) {
      setStatus(T("tex.readFail"), true);
      detectedKind = null;
      setModeUiEnabled(false);
      if (fromSample) clearSampleActive();
      return;
    }

    const kind = detectKind(bmp.width, bmp.height);
    detectedKind = kind;
    bmp.close();

    if (!kind) {
      setStatus(T("tex.msgDimBad"), true);
      refs.kindHint.textContent = "";
      setModeUiEnabled(false);
      if (fromSample) clearSampleActive();
      return;
    }

    if (kind === "wall") {
      refs.kindHint.textContent = T("tex.kindHintWall");
      setModeUiEnabled(false);
      setStatus(T("tex.wallReady"));
      if (fromSample) setSampleActive("wall");
      return;
    }

    refs.kindHint.textContent = T("tex.kindHintTile");
    setModeUiEnabled(true);
    setStatus(T("tex.tileReady"));
    if (fromSample) setSampleActive("tile");
  }

  async function loadSamplePng(url, filename) {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(T("tex.sampleMissing"));
    const blob = await res.blob();
    return new File([blob], filename, { type: "image/png" });
  }

  refs.pick.addEventListener("click", (e) => {
    e.stopPropagation();
    refs.file.click();
  });
  refs.file.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    onFileSelected(f || null);
  });

  ["dragenter", "dragover"].forEach((ev) => {
    refs.drop.addEventListener(ev, (e) => {
      e.preventDefault();
      refs.drop.classList.add("drop--hover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    refs.drop.addEventListener(ev, (e) => {
      e.preventDefault();
      refs.drop.classList.remove("drop--hover");
    });
  });
  refs.drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFileSelected(f);
  });
  refs.drop.addEventListener("click", (e) => {
    if (e.target.closest("#tsPick")) return;
    refs.file.click();
  });

  function wireSamplePick(btn, url, filename) {
    if (!btn) return;
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        setStatus(T("tex.loadingSample"));
        const f = await loadSamplePng(url, filename);
        await onFileSelected(f, { fromSample: true });
      } catch (err) {
        console.error(err);
        setStatus(err?.message || String(err), true);
        clearSampleActive();
      }
    });
  }
  wireSamplePick(
    refs.samplePickTile,
    "/trtools/img/samples/sample-tile-74x74.png",
    "电镀箱块.png"
  );
  wireSamplePick(
    refs.samplePickWall,
    "/trtools/img/samples/sample-wall-106x106.png",
    "带栏线路走廊墙.png"
  );

  refs.run.addEventListener("click", () => processCurrent());

  refs.download.addEventListener("click", () => {
    if (!lastBlobUrl || refs.download.disabled) return;
    const base = (currentFile && currentFile.name.replace(/\.[^.]+$/, "")) || "texture_output";
    const a = document.createElement("a");
    a.href = lastBlobUrl;
    a.download = base + "_Output.png";
    a.click();
  });

  setPreviewEmpty();
  initModeRichSelect();
  setModeUiEnabled(false);

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
      if (refs.onlineCount) refs.onlineCount.textContent = "-";
    }
  }

  function syncTexRichListLabels() {
    if (!refs.modeRichList) return;
    refs.modeRichList.querySelectorAll(".tsRichSelectItem").forEach(function (li) {
      var v = li.getAttribute("data-value");
      var sp = li.querySelector(".tsRichSelectValueText");
      if (!sp || !MODE_KEYS[v]) return;
      sp.textContent = T(MODE_KEYS[v]);
    });
    updateModeRichFromSelect();
  }

  /* 不可在监听里调用 TWT_I18N.apply：apply 会再次派发 twt:i18n-applied，导致无限递归与页面卡死 */
  window.addEventListener("twt:i18n-applied", function () {
    syncTexRichListLabels();
    if (currentFile) {
      if (detectedKind === "wall") {
        refs.kindHint.textContent = T("tex.kindHintWall");
        setStatus(T("tex.wallReady"));
      } else if (detectedKind === "tile") {
        refs.kindHint.textContent = T("tex.kindHintTile");
        setStatus(T("tex.tileReady"));
      }
    }
  });

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
})();
