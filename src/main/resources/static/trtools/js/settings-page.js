(function () {
  "use strict";

  var I = window.TWT_I18N;
  if (!I) return;

  function syncLangButtons() {
    var cur = I.getLang();
    var want = cur === "en" ? "en" : cur === "es" ? "es" : "zh-CN";
    document.querySelectorAll(".settingsLangBtn[data-lang]").forEach(function (b) {
      var on = b.getAttribute("data-lang") === want;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("settingsLangBtn--active", on);
    });
  }

  function syncThemeSwatches() {
    // 显示用户自己的选择；节日强制主题期间给出提示
    var th = I.getChosenTheme ? I.getChosenTheme() : I.getTheme();
    var hint = document.getElementById("themeForceHint");
    if (hint) hint.hidden = !I.forcedTheme;
    document.querySelectorAll("#themeSwatches .settingsSwatch").forEach(function (b) {
      var on = b.getAttribute("data-theme") === th;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  document.querySelectorAll(".settingsLangBtn[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      var code = b.getAttribute("data-lang");
      if (!code) return;
      I.setLang(code === "en" ? "en" : code === "es" ? "es" : "zh-CN");
      syncLangButtons();
    });
  });

  document.querySelectorAll("#themeSwatches .settingsSwatch").forEach(function (b) {
    b.addEventListener("click", function () {
      var name = b.getAttribute("data-theme");
      if (!name) return;
      I.setTheme(name);
      syncThemeSwatches();
    });
  });

  syncLangButtons();
  syncThemeSwatches();

  window.addEventListener("twt:i18n-applied", function () {
    syncLangButtons();
    syncThemeSwatches();
    // 勿在此调用 I.apply：apply 会再次派发 twt:i18n-applied，造成无限递归
  });
})();
