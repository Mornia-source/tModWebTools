(function () {
  "use strict";

  function tr(key, fallback) {
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.t === "function") {
        return window.TWT_I18N.t(key);
      }
    } catch (_) {}
    return fallback;
  }

  function initSidebarCollapse() {
    var shell = document.getElementById("appShell");
    var sidebar = document.getElementById("appSidebar");
    var btn = document.getElementById("sidebarToggle");
    var btnInSidebar = document.getElementById("sidebarToggleInSidebar");
    if (!shell || !sidebar || (!btn && !btnInSidebar)) return;

    var KEY = "trtools.sidebarCollapsed";
    var backdrop = null;

    function isMobile() {
      try {
        return !!(window.matchMedia && window.matchMedia("(max-width: 720px)").matches);
      } catch (_) {
        return false;
      }
    }

    function persist(collapsed) {
      try {
        localStorage.setItem(KEY, collapsed ? "1" : "0");
      } catch (_) {}
    }

    function ensureBackdrop() {
      if (backdrop) return backdrop;
      backdrop = document.createElement("div");
      backdrop.className = "appSidebarBackdrop";
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.addEventListener("click", function () {
        apply(true);
        persist(true);
      });
      document.body.appendChild(backdrop);
      return backdrop;
    }

    function apply(collapsed) {
      shell.classList.toggle("appShell--sidebarCollapsed", collapsed);
      [btn, btnInSidebar].forEach(function (item) {
        if (!item) return;
        item.setAttribute("aria-expanded", collapsed ? "false" : "true");
        item.setAttribute(
          "aria-label",
          collapsed ? tr("sidebar.expand", "展开侧边栏") : tr("sidebar.collapse", "收起侧边栏")
        );
      });

      if (isMobile()) {
        ensureBackdrop().style.display = collapsed ? "none" : "block";
      } else if (backdrop) {
        backdrop.style.display = "none";
      }
    }

    var initialCollapsed = false;
    try {
      initialCollapsed = isMobile() ? true : localStorage.getItem(KEY) === "1";
    } catch (_) {}
    apply(initialCollapsed);

    function toggle() {
      var collapsed = !shell.classList.contains("appShell--sidebarCollapsed");
      apply(collapsed);
      persist(collapsed);
    }

    if (btn) btn.addEventListener("click", toggle);
    if (btnInSidebar) btnInSidebar.addEventListener("click", toggle);

    document.addEventListener(
      "pointerdown",
      function (e) {
        if (!isMobile()) return;
        if (shell.classList.contains("appShell--sidebarCollapsed")) return;
        var target = e.target;
        if (!target || target.nodeType !== 1) return;
        if (sidebar.contains(target)) return;
        if (btn && (btn === target || btn.contains(target))) return;
        if (btnInSidebar && (btnInSidebar === target || btnInSidebar.contains(target))) return;
        apply(true);
        persist(true);
      },
      { capture: true }
    );

    window.addEventListener("resize", function () {
      if (!isMobile() && backdrop) {
        backdrop.style.display = "none";
      }
    });
  }

  function applyI18n() {
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.apply === "function") {
        window.TWT_I18N.apply(document);
      }
    } catch (_) {}
  }

  var didShellBoot = false;

  function boot() {
    if (didShellBoot) return;
    didShellBoot = true;
    initSidebarCollapse();
    applyI18n();
  }

  document.addEventListener("twt:sidebar-ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        if (document.querySelector(".appNav")) boot();
      },
      { once: true }
    );
  } else if (document.querySelector(".appNav")) {
    boot();
  }
})();
