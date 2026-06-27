(function () {
  "use strict";

  function T(k) {
    return window.TWT_I18N && window.TWT_I18N.t ? window.TWT_I18N.t(k) : k;
  }

  var lastXml = "";

  function boolVal(id) {
    var el = document.getElementById(id);
    return el && el.checked ? "true" : "false";
  }

  function strVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function selectVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  function escapeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function buildConfig() {
    var inputDir = strVal("xnbInputDir") || "default";
    var outputDir = strVal("xnbOutputDir") || "default";
    var intermedDir = strVal("xnbIntermedDir") || "default";
    var profile = selectVal("xnbProfile") || "Reach";
    var modelScale = strVal("xnbModelScale") || "1.0";
    var extEffect = strVal("xnbExtEffect") || ".xnb";
    var extTexture = strVal("xnbExtTexture") || ".xnb";
    var extFont = strVal("xnbExtFont") || ".xnb";
    var extModel = strVal("xnbExtModel") || ".xnb";
    var extMaterial = strVal("xnbExtMaterial") || ".xnb";

    return '<?xml version="1.0" encoding="utf-8" ?>\n'
      + '<configuration>\n'
      + '\t<appSettings>\n'
      + '\t\t<!--Should fonts be compiled. => | true | false |-->\n'
      + '\t\t<add key="CompileFonts" value="' + boolVal("xnbCompileFonts") + '" />\n'
      + '\t\t<!--Should materials be compiled separately, or included with the model. => | true | false |-->\n'
      + '\t\t<add key="CompileMaterialsSeperate" value="' + boolVal("xnbCompileMaterials") + '" />\n'
      + '\t\t<!--Should textures be compiled. => | true | false |-->\n'
      + '\t\t<add key="CompileTextures" value="' + boolVal("xnbCompileTextures") + '" />\n'
      + '\t\t<!--Should pngs be ignored when compiling textures. => | true | false |-->\n'
      + '\t\t<add key="IgnorePng" value="' + boolVal("xnbIgnorePng") + '" />\n'
      + '\n'
      + '\t\t<!--Target profile options. => | HiDef | Reach |-->\n'
      + '\t\t<add key="TargetProfile" value="' + escapeXml(profile) + '" />\n'
      + '\t\t<!--Compress output options. => | true | false |-->\n'
      + '\t\t<add key="CompressOutput" value="' + boolVal("xnbCompress") + '" />\n'
      + '\n'
      + '\t\t<!--Full path to input folder. Default => | default |-->\n'
      + '\t\t<add key="InputDirectory" value="' + escapeXml(inputDir) + '" />\n'
      + '\t\t<!--Full path to intermediate folder. Default => | default |-->\n'
      + '\t\t<add key="IntermediateDirectory" value="' + escapeXml(intermedDir) + '" />\n'
      + '\t\t<!--Full path to output folder. Default => | default |-->\n'
      + '\t\t<add key="OutputDirectory" value="' + escapeXml(outputDir) + '" />\n'
      + '\n'
      + '\t\t<!--Should files be rebuilt if an xnb already exists. => | true | false |-->\n'
      + '\t\t<add key="RebuildAll" value="' + boolVal("xnbRebuildAll") + '" />\n'
      + '\t\t<!--Close immediately after compiling, skips the timer. => | true | false |-->\n'
      + '\t\t<add key="CloseImmediately" value="' + boolVal("xnbCloseImmediate") + '" />\n'
      + '\t\t<!--Wait for input when an error occurs. => | true | false |-->\n'
      + '\t\t<add key="WaitForInputOnError" value="' + boolVal("xnbWaitError") + '" />\n'
      + '\n'
      + '\t\t<!--Scale multiplier for compiled models. Default => | 1f |-->\n'
      + '\t\t<add key="ModelScale" value="' + escapeXml(modelScale) + '" />\n'
      + '\t\t<!--Should the vertex winding order be swapped for compiled models. Default => | false |-->\n'
      + '\t\t<add key="ModelSwapWindingOrder" value="' + boolVal("xnbSwapWinding") + '" />\n'
      + '\t\t<!--Should tangents be generated for compiled models. Default => | false |-->\n'
      + '\t\t<add key="ModelGenerateTangentFrames" value="' + boolVal("xnbTangents") + '" />\n'
      + '\n'
      + '\t\t<!--Should the output be shader bytecode (.fxc file) instead of xnb. Default => | false |-->\n'
      + '\t\t<add key="OutputEffectBytecode" value="' + boolVal("xnbEffectBytecode") + '" />\n'
      + '\n'
      + '\t\t<!--Output file extensions (include the period) -->\n'
      + '\t\t<add key="EffectExtension" value="' + escapeXml(extEffect) + '" />\n'
      + '\t\t<add key="FontExtension" value="' + escapeXml(extFont) + '" />\n'
      + '\t\t<add key="TextureExtension" value="' + escapeXml(extTexture) + '" />\n'
      + '\t\t<add key="ModelExtension" value="' + escapeXml(extModel) + '" />\n'
      + '\t\t<add key="MaterialExtension" value="' + escapeXml(extMaterial) + '" />\n'
      + '\t</appSettings>\n'
      + '</configuration>';
  }

  function generate() {
    lastXml = buildConfig();
    var preview = document.getElementById("xnbPreview");
    if (preview) preview.textContent = lastXml;
    var dlBtn = document.getElementById("xnbDownload");
    if (dlBtn) dlBtn.disabled = false;
  }

  function download() {
    if (!lastXml) { generate(); }
    var blob = new Blob([lastXml], { type: "text/xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    try {
      var a = document.createElement("a");
      a.href = url;
      a.download = "App.config";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  }

  function copyToClipboard() {
    if (!lastXml) { generate(); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastXml).then(function () {
        var btn = document.getElementById("xnbCopy");
        if (!btn) return;
        var orig = btn.querySelector("span") ? btn.querySelector("span").textContent : "";
        btn.querySelector("span").textContent = T("xnb.copied");
        setTimeout(function () {
          if (btn.querySelector("span")) btn.querySelector("span").textContent = orig || T("xnb.btnCopy");
        }, 1500);
      }).catch(function () {});
    }
  }

  var genBtn = document.getElementById("xnbGenerate");
  var dlBtn = document.getElementById("xnbDownload");
  var copyBtn = document.getElementById("xnbCopy");

  if (genBtn) genBtn.addEventListener("click", generate);
  if (dlBtn) dlBtn.addEventListener("click", download);
  if (copyBtn) copyBtn.addEventListener("click", copyToClipboard);

  // 自动生成一次初始预览
  generate();
})();
