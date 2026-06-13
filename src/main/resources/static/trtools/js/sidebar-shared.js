(function () {
  "use strict";

  var PARTIAL_URL = "/trtools/html/partials/app-sidebar-inner.html?v=9";
  var SHELL_CSS_URL = "/trtools/css/trtools-shell.css?v=6";

  function ensureShellStyles() {
    if (document.getElementById("twtShellStyles")) return;
    var link = document.createElement("link");
    link.id = "twtShellStyles";
    link.rel = "stylesheet";
    link.href = SHELL_CSS_URL;
    document.head.appendChild(link);
  }

  function ensureTheme() {
    try {
      var theme = localStorage.getItem("trtools.theme") || "emerald";
      document.documentElement.setAttribute("data-trtheme", theme);
    } catch (_) {}
  }

  function applySidebarActive() {
    var active = "";
    try {
      active = (document.body && document.body.getAttribute("data-twt-active")) || "";
    } catch (_) {}

    document.querySelectorAll(".appNav a.pageTab.active").forEach(function (a) {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    });

    if (active) {
      var link = document.querySelector('.appNav a.pageTab[data-twt-page="' + active + '"]');
      if (link) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    }

    document.querySelectorAll("a.appNavLink--settings").forEach(function (a) {
      a.classList.remove("appNavLink--settingsActive");
      a.removeAttribute("aria-current");
    });
    document.querySelectorAll("a.appNavLink--stats").forEach(function (a) {
      a.classList.remove("appNavLink--statsActive");
      a.removeAttribute("aria-current");
    });

    if (active === "settings") {
      var s = document.querySelector("a.appNavLink--settings[href]");
      if (s) {
        s.classList.add("appNavLink--settingsActive");
        s.setAttribute("aria-current", "page");
      }
    } else if (active === "stats") {
      var t = document.querySelector("a.appNavLink--stats[href]");
      if (t) {
        t.classList.add("appNavLink--statsActive");
        t.setAttribute("aria-current", "page");
      }
    }
  }

  function dispatchReady() {
    try {
      document.dispatchEvent(new CustomEvent("twt:sidebar-ready", { detail: {} }));
    } catch (_) {}
  }

  function injectSidebar(html) {
    var mount = document.getElementById("appSidebarInnerMount");
    if (!mount || !mount.parentNode) return false;
    mount.outerHTML = String(html || "").trim();
    applySidebarActive();
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.apply === "function") {
        window.TWT_I18N.apply(document);
      }
    } catch (_) {}
    dispatchReady();
    return true;
  }

  function loadSharedSidebar() {
    var mount = document.getElementById("appSidebarInnerMount");
    if (!mount) return Promise.resolve(false);

    var url = PARTIAL_URL;
    try {
      url = new URL(PARTIAL_URL, location.href).toString();
    } catch (_) {}

    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("sidebar partial " + r.status);
        return r.text();
      })
      .then(function (txt) {
        return injectSidebar(txt);
      })
      .catch(function () {
        mount.innerHTML =
          '<div class="appSidebarInner"><div class="hint" style="padding:12px">侧边栏加载失败（请用 http(s) 打开本站，并确认静态路径 /trtools/html/partials/ 可访问）。</div></div>';
        dispatchReady();
        return false;
      });
  }

  ensureTheme();
  ensureShellStyles();

  try {
    window.addEventListener("storage", function (e) {
      if (e && e.key === "trtools.theme") ensureTheme();
    });
  } catch (_) {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      loadSharedSidebar();
    }, { once: true });
  } else {
    loadSharedSidebar();
  }
})();
