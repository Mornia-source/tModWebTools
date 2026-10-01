// 页面启动脚本：在 <head> 中同步加载（不要 defer），须在首次绘制前执行，避免主题/标题闪烁。
// 统一提供：
//   window.TWT_THEME —— 主题判定（默认主题、节日强制主题）的唯一出处，i18n.js 与 sidebar-shared.js 共用
//   window.twtT      —— 取翻译文案（i18n.js 加载后生效，之前返回 key）
(function () {
  "use strict";

  var THEME_KEY = "trtools.theme";
  var THEME_CHOSEN_KEY = "trtools.themeChosen";
  var THEME_RE = /^(national|emerald|ocean|violet|amber|rose|teal)$/;
  // 默认主题：临时为“国庆”。
  var DEFAULT_THEME = "national";
  // 节日期间强制使用的主题（为空则不强制）。节后改为 "" 即可恢复用户自己的选择。
  var FORCE_THEME = "national";

  // 用户自己选择（或默认）的主题，不受强制影响。
  // 只有在设置页手动选择过（themeChosen=1）才使用存储值；旧版会自动把 emerald 写入存储，故视为未选择。
  function chosen() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      var picked = localStorage.getItem(THEME_CHOSEN_KEY) === "1";
      if (!picked && (!v || v === "emerald")) return DEFAULT_THEME;
      return THEME_RE.test(v) ? v : DEFAULT_THEME;
    } catch (_) {
      return DEFAULT_THEME;
    }
  }

  window.TWT_THEME = {
    KEY: THEME_KEY,
    CHOSEN_KEY: THEME_CHOSEN_KEY,
    RE: THEME_RE,
    DEFAULT: DEFAULT_THEME,
    FORCE: FORCE_THEME,
    chosen: chosen,
    // 实际显示的主题
    current: function () {
      return FORCE_THEME || chosen();
    }
  };

  window.twtT = function (k, vars) {
    try {
      if (window.TWT_I18N && window.TWT_I18N.t) return window.TWT_I18N.t(k, vars);
    } catch (_) {}
    return k;
  };

  // 页面标题：i18n.js 加载前先按语言设置，避免标签页标题闪现中文
  var TITLES = {
    "meta.titleHome": { zh: "tModWebTools - 尊重每一位开发者的意愿 - Mornia-Cherry", en: "tModWebTools — Respecting every developer's wishes — Mornia-Cherry", es: "tModWebTools — Respetando los deseos de cada desarrollador — Mornia-Cherry" },
    "meta.titleArmor": { zh: "装备帧生成器 — tModWebTools", en: "ArmorHelper — tModWebTools", es: "ArmorHelper — tModWebTools" },
    "meta.titleNpcFrames": { zh: "NPC帧图生成器 — tModWebTools", en: "NPC frame generator — tModWebTools", es: "Generador de fotogramas NPC — tModWebTools" },
    "meta.titleOgg": { zh: "OGG 转换 — tModWebTools", en: "OGG convert — tModWebTools", es: "Conversión OGG — tModWebTools" },
    "meta.titleStats": { zh: "访问统计 — tModWebTools", en: "Visit stats — tModWebTools", es: "Estadísticas de visitas — tModWebTools" },
    "meta.titleSettings": { zh: "设置 — tModWebTools", en: "Settings — tModWebTools", es: "Ajustes — tModWebTools" },
    "meta.titleTmodUnpacker": { zh: "tModUnpacker — tModWebTools", en: "tModUnpacker — tModWebTools", es: "tModUnpacker — tModWebTools" },
    "meta.titleSprite": { zh: "躯干格式转换 — tModWebTools", en: "Body sprite transform — tModWebTools", es: "Transformación de sprite corporal — tModWebTools" },
    "meta.titleTexture": { zh: "物块生成器 — tModWebTools", en: "TextureSplitter — tModWebTools", es: "TextureSplitter — tModWebTools" },
    "meta.titleAseprite": { zh: "Aseprite 插件 — tModWebTools", en: "Aseprite extension — tModWebTools", es: "Extensión de Aseprite — tModWebTools" },
    "meta.titleEffectEditor": { zh: "特效编辑生成器 1.4.4 — tModWebTools", en: "Effect Editor & Generator 1.4.4 — tModWebTools", es: "Editor y generador de efectos 1.4.4 — tModWebTools" },
    "meta.titleXnbCompiler": { zh: "XNB 编译器 — tModWebTools", en: "XNB Compiler — tModWebTools", es: "Compilador XNB — tModWebTools" }
  };

  try {
    var lang = localStorage.getItem("trtools.lang") || "zh-CN";
    var lt = lang === "en" ? "en" : lang === "es" ? "es" : "zh";
    var titleEl = document.querySelector("title[data-i18n-doc]");
    var key = titleEl && titleEl.getAttribute("data-i18n-doc");
    if (key && TITLES[key]) document.title = TITLES[key][lt];
    document.documentElement.setAttribute("lang", lang === "zh-CN" ? "zh-CN" : lang === "es" ? "es" : "en");
  } catch (_) {}
  document.documentElement.setAttribute("data-trtheme", window.TWT_THEME.current());
})();
