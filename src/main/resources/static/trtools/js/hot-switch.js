(function () {
  "use strict";

  var STORAGE_KEY = "trtoolsTool";
  var overlay = null;
  var FILE_TO_TOOL = {
    "index.html": "tilesheet",
    "oggconvert.html": "oggconvert",
    "armorhelper.html": "armorhelper",
    "armorcodegen.html": "armorcodegen",
    "prtsarmorgen.html": "prtsarmorgen",
    "tool14to13.html": "tool14to13",
    "aseprite-plugin.html": "asepriteplugin",
    "spritetransform.html": "spritetransform",
    "texturesplitter.html": "texturesplitter",
    "stats.html": "stats",
    "settings.html": "settings",
    "tmodunpacker.html": "tmodunpacker",
    "terrasavr.html": "terrasavr",
    "effecteditor.html": "effecteditor"
  };

  function currentFile() {
    return location.pathname.split("/").pop() || "";
  }

  function currentToolKey() {
    return FILE_TO_TOOL[currentFile()] || "";
  }

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

  function redirectTopLevelToolToRoot() {
    if (isEmbeddedToolContext()) return;
    var tool = currentToolKey();
    if (!tool) return;
    try {
      location.replace("/?tool=" + encodeURIComponent(tool));
    } catch (_) {}
  }

  function patchToolHrefForEmbed(a) {
    var href = a.getAttribute("href") || "";
    if (!href || !href.endsWith(".html")) return;
    try {
      var url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      url.searchParams.set("embed", "1");
      a.setAttribute("href", url.pathname + url.search);
    } catch (_) {}
  }

  function patchPageTabHrefsForEmbed() {
    if (!isEmbeddedToolContext()) return;
    document.querySelectorAll("a.pageTab[href]").forEach(patchToolHrefForEmbed);
    document.querySelectorAll("a.appNavLink--stats[href], a.appNavLink--settings[href]").forEach(patchToolHrefForEmbed);
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "loadingOverlay";
    overlay.innerHTML =
      '<div class="loadingCard" role="status" aria-live="polite">' +
      '<div class="loadingSpinner" aria-hidden="true"></div>' +
      '<div class="small" data-i18n="loading.text">加载中...</div>' +
      "</div>";
    document.body.appendChild(overlay);
    return overlay;
  }

  function showLoading() {
    ensureOverlay().classList.add("show");
  }

  function hideLoading() {
    if (overlay) overlay.classList.remove("show");
  }

  function isSameOriginHtmlLink(a) {
    if (!a) return false;
    var href = a.getAttribute("href") || "";
    try {
      var to = new URL(href, location.href);
      return to.origin === location.origin && to.pathname.endsWith(".html");
    } catch (_) {
      return false;
    }
  }

  function toolKeyFromPathname(pathname) {
    var file = (pathname || "").split("/").pop() || "";
    return FILE_TO_TOOL[file] || "";
  }

  function persistToolKey(tool) {
    if (!tool) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, tool);
      if (window.top && window.top !== window.self) {
        window.top.sessionStorage.setItem(STORAGE_KEY, tool);
      }
    } catch (_) {}
  }

  function persistActiveTool() {
    persistToolKey(currentToolKey());
  }

  redirectTopLevelToolToRoot();
  persistActiveTool();

  function patchEmbedNavWhenReady() {
    patchPageTabHrefsForEmbed();
    persistActiveTool();
  }

  document.addEventListener("twt:sidebar-ready", patchEmbedNavWhenReady);

  if (document.querySelector(".appNav a.pageTab[href]")) {
    patchEmbedNavWhenReady();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a.pageTab, a.appNavLink--stats, a.appNavLink--settings");
    if (!isSameOriginHtmlLink(a)) return;

    var to = new URL(a.getAttribute("href"), location.href);
    if (to.pathname === location.pathname && to.search === location.search) return;
    if (isEmbeddedToolContext()) to.searchParams.set("embed", "1");

    var destTool = toolKeyFromPathname(to.pathname);
    if (destTool) persistToolKey(destTool);

    e.preventDefault();
    showLoading();
    location.assign(to.href);
  });

  if (document.readyState === "loading") {
    showLoading();
    window.addEventListener(
      "DOMContentLoaded",
      function () {
        setTimeout(hideLoading, 180);
      },
      { once: true }
    );
  } else {
    showLoading();
    setTimeout(hideLoading, 180);
  }

  window.addEventListener("load", hideLoading, { once: true });
  window.addEventListener("pageshow", function () {
    setTimeout(hideLoading, 0);
  });
  setTimeout(hideLoading, 10000);

  window.addEventListener("twt:i18n-applied", function () {
    if (!overlay) return;
    var el = overlay.querySelector('[data-i18n="loading.text"]');
    if (!el) return;
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.t === "function") {
        el.textContent = window.TWT_I18N.t("loading.text");
      }
    } catch (_) {}
  });
})();
