(function () {
  /**
   * 使用整页跳转，不用 fetch + document.write。
   * 原因：write 注入后仍共用同一 Window，trtools.js / armorhelper.js 顶层的 const el 会重复声明导致整页脚本崩溃；
   * 且 document.write 会触发外链脚本的 parser-blocking 警告。
   */
  let overlay = null;

  function isEmbeddedToolContext() {
    try {
      if (window.self !== window.top) return true;
    } catch (_) {
      return true;
    }
    try {
      return new URL(location.href).searchParams.has("embed");
    } catch (_) {
      return false;
    }
  }

  /** 根页 iframe 内地址栏常被 replace 成 /，仅靠 search 无法判断；必须在 iframe 里始终给侧栏链上 embed，避免走 redirect:/ */
  function patchToolHtmlHrefForEmbed(a) {
    const href = a.getAttribute("href") || "";
    if (!href.endsWith(".html")) return;
    try {
      const u = new URL(href, location.href);
      if (!/^\/trtools\/[^/]+\.html$/i.test(u.pathname)) return;
      u.searchParams.set("embed", "1");
      a.setAttribute("href", u.pathname + u.search);
    } catch (_) {}
  }

  function patchPageTabHrefsForEmbed() {
    if (!isEmbeddedToolContext()) return;
    document.querySelectorAll("a.pageTab[href]").forEach(patchToolHtmlHrefForEmbed);
    document.querySelectorAll("a.appNavLink--stats[href], a.appNavLink--settings[href]").forEach(patchToolHtmlHrefForEmbed);
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "loadingOverlay";
    var lt =
      typeof window.TWT_I18N !== "undefined" && window.TWT_I18N.t
        ? window.TWT_I18N.t("loading.text")
        : "加载中…";
    overlay.innerHTML =
      '<div class="loadingCard" role="status" aria-live="polite">' +
      '<div class="loadingSpinner" aria-hidden="true"></div>' +
      '<div class="small" data-i18n="loading.text">' +
      lt +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
    return overlay;
  }

  function showLoading() {
    ensureOverlay().classList.add("show");
  }

  function hideLoading() {
    if (!overlay) return;
    overlay.classList.remove("show");
  }

  patchPageTabHrefsForEmbed();

  function isPageTabLink(a) {
    if (!a) return false;
    const href = a.getAttribute("href") || "";
    try {
      const to = new URL(href, location.href);
      if (!to.pathname.endsWith(".html")) return false;
      return to.origin === location.origin;
    } catch (_) {
      return false;
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a.pageTab, a.appNavLink--stats, a.appNavLink--settings");
    if (!isPageTabLink(a)) return;
    const to = new URL(a.getAttribute("href"), location.href);
    if (to.pathname === location.pathname) return;
    try {
      if (isEmbeddedToolContext()) {
        to.searchParams.set("embed", "1");
      }
    } catch (_) {}
    e.preventDefault();
    showLoading();
    location.assign(to.href);
  });

  function scheduleInitialHide() {
    setTimeout(hideLoading, 180);
  }

  if (document.readyState === "loading") {
    showLoading();
    window.addEventListener("DOMContentLoaded", scheduleInitialHide, { once: true });
  } else {
    showLoading();
    scheduleInitialHide();
  }

  window.addEventListener("load", () => hideLoading(), { once: true });
  window.addEventListener("pageshow", () => setTimeout(hideLoading, 0));
  setTimeout(hideLoading, 10000);

  window.addEventListener("twt:i18n-applied", () => {
    if (!overlay) return;
    const el = overlay.querySelector("[data-i18n=\"loading.text\"]");
    if (el && window.TWT_I18N && window.TWT_I18N.t) el.textContent = window.TWT_I18N.t("loading.text");
  });

  /** 记录当前工具页，供根路径 / 刷新后仍打开同一选项卡（与 static/index.html 中 sessionStorage 配合） */
  (function persistActiveTool() {
    try {
      var path = location.pathname.split("/").pop() || "";
      var byFile = {
        "index.html": "tilesheet",
        "oggconvert.html": "oggconvert",
        "armorhelper.html": "armorhelper",
        "spritetransform.html": "spritetransform",
        "texturesplitter.html": "texturesplitter",
        "stats.html": "stats",
        "settings.html": "settings",
        "tmodunpacker.html": "tmodunpacker",
        "terrasavr.html": "terrasavr"
      };
      for (var file in byFile) {
        if (Object.prototype.hasOwnProperty.call(byFile, file) && path.endsWith(file)) {
          sessionStorage.setItem("trtoolsTool", byFile[file]);
          break;
        }
      }
    } catch (_) {}
  })();
})();
