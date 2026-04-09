(function () {
  "use strict";

  var shell = document.getElementById("appShell");
  var btn = document.getElementById("sidebarToggle");
  var btnInSidebar = document.getElementById("sidebarToggleInSidebar");
  var sidebar = document.getElementById("appSidebar");
  if (!shell || !sidebar || (!btn && !btnInSidebar)) return;

  var KEY = "trtools.sidebarCollapsed";

  function twtT(k, fb) {
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.t === "function") return window.TWT_I18N.t(k);
    } catch (_) {}
    return fb;
  }

  /** 与 trtools.css 中手机抽屉断点一致；仅在此宽度下启用「点击侧栏外收起」 */
  function isMobileDrawerLayout() {
    try {
      return !!(window.matchMedia && window.matchMedia("(max-width: 720px)").matches);
    } catch (_) {
      return false;
    }
  }

  var backdrop = null;

  function apply(collapsed) {
    shell.classList.toggle("appShell--sidebarCollapsed", collapsed);
    [btn, btnInSidebar].forEach(function (b) {
      if (!b) return;
      b.setAttribute("aria-expanded", collapsed ? "false" : "true");
      b.setAttribute(
        "aria-label",
        collapsed ? twtT("sidebar.expand", "展开侧边栏") : twtT("sidebar.collapse", "收起侧边栏")
      );
    });

    // 手机抽屉：用遮罩层接收点击/tap，避免部分移动端/反代环境下 document click 不触发
    if (isMobileDrawerLayout()) {
      try {
        if (!backdrop) {
          backdrop = document.createElement("div");
          backdrop.className = "appSidebarBackdrop";
          backdrop.setAttribute("aria-hidden", "true");
          document.body.appendChild(backdrop);

          var closeIfOpen = function () {
            if (!isMobileDrawerLayout()) return;
            if (shell.classList.contains("appShell--sidebarCollapsed")) return;
            apply(true);
          };

          backdrop.addEventListener("click", closeIfOpen);
          backdrop.addEventListener("touchstart", closeIfOpen, { passive: true });
        }
        backdrop.style.display = collapsed ? "none" : "block";
      } catch (_) {}
    } else if (backdrop) {
      backdrop.style.display = "none";
    }
  }

  try {
    var fromStorage = localStorage.getItem(KEY) === "1";
    // 手机默认折叠隐藏；平板(>720px)仍按存储状态。
    apply(isMobileDrawerLayout() ? true : fromStorage);
  } catch (_) {
    apply(false);
  }

  function onToggle() {
    var collapsed = !shell.classList.contains("appShell--sidebarCollapsed");
    apply(collapsed);
    try {
      localStorage.setItem(KEY, collapsed ? "1" : "0");
    } catch (_) {}
  }

  /** 移动端（抽屉）状态：点侧栏以外区域收起（不依赖 backdrop 层级，兼容各种触控/反代环境） */
  function handleOutsidePointerDown(e) {
    if (!isMobileDrawerLayout()) return;
    if (shell.classList.contains("appShell--sidebarCollapsed")) return;
    if (!e) return;

    var t = e.target;
    if (t && t.nodeType !== 1) t = t.parentElement;
    if (!t || t.nodeType !== 1) return;

    if (sidebar.contains(t)) return;
    if (btn && (btn === t || btn.contains(t))) return;
    if (btnInSidebar && (btnInSidebar === t || btnInSidebar.contains(t))) return;

    apply(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch (_) {}
  }

  if (btn) btn.addEventListener("click", onToggle);
  if (btnInSidebar) btnInSidebar.addEventListener("click", onToggle);

  document.addEventListener("pointerdown", handleOutsidePointerDown, { capture: true });

  window.addEventListener("twt:i18n-applied", function () {
    var collapsed = shell.classList.contains("appShell--sidebarCollapsed");
    apply(collapsed);
  });
})();
