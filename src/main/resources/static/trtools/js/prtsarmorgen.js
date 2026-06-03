// DEPLOY_MARKER: prts-armor-generator-v3
(function () {
  "use strict";

  const DATA_BASE = "/trtools/data/prts-armor-generator";
  const el = (id) => document.getElementById(id);

  const refs = {
    operatorInput: el("pagOperatorInput"),
    manualWrap: el("pagManualWrap"),
    fileWrap: el("pagFileWrap"),
    operatorFile: el("pagOperatorFile"),
    pickOperatorFileBtn: el("pagPickOperatorFileBtn"),
    clearOperatorFileBtn: el("pagClearOperatorFileBtn"),
    operatorFileHint: el("pagOperatorFileHint"),
    stepSelect: el("pagStepSelect"),
    saveIntermediate: el("pagSaveIntermediate"),
    quietMode: el("pagQuietMode"),
    runBtn: el("pagRunBtn"),
    downloadZipBtn: el("pagDownloadZipBtn"),
    copyCurrentBtn: el("pagCopyCurrentBtn"),
    downloadJsonBtn: el("pagDownloadJsonBtn"),
    status: el("pagStatus"),
    fileSelect: el("pagFileSelect"),
    outputCode: el("pagOutputCode"),
    outputJson: el("pagOutputJson"),
    resultTabs: el("pagResultTabs"),
    tabCode: el("pagTabCode"),
    tabJson: el("pagTabJson"),
    summary: el("pagSummary"),
    onlineCount: el("onlineCount")
  };

  const state = {
    materialsMap: {},
    classMap: {},
    obtainTypesMap: {},
    templates: { head: "", body: "", legs: "", vanity: "" },
    generatedFiles: [],
    jsonOutputs: [],
    activeResultTab: "code",
    operatorFileLines: null,
    operatorFileName: ""
  };

  const CHAR_MAP = {
    "ł": "l", "Ł": "L", "ø": "o", "Ø": "O", "æ": "ae", "Æ": "AE", "œ": "oe", "Œ": "OE", "ß": "ss",
    "ā": "a", "ă": "a", "ąć": "ac", "č": "c", "đ": "d", "ē": "e", "ė": "e", "ę": "e", "ğ": "g", "ī": "i",
    "ı": "i", "ń": "n", "ň": "n", "ő": "o", "ŕ": "r", "ř": "r", "ś": "s", "ş": "s", "š": "s", "ţ": "t",
    "ť": "t", "ū": "u", "ų": "u", "ů": "u", "ý": "y", "ź": "z", "ż": "z", "ž": "z",
    "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Е": "E", "Ё": "Yo", "Ж": "Zh", "З": "Z", "И": "I",
    "Й": "Y", "К": "K", "Л": "L", "М": "M", "Н": "N", "О": "O", "П": "P", "Р": "R", "С": "S", "Т": "T",
    "У": "U", "Ф": "F", "Х": "Kh", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Shch", "Ъ": "", "Ы": "Y", "Ь": "",
    "Э": "E", "Ю": "Yu", "Я": "Ya",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i",
    "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "",
    "э": "e", "ю": "yu", "я": "ya"
  };

  function t(key, fallback) {
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.t === "function") {
        const v = window.TWT_I18N.t(key);
        if (v) return v;
      }
    } catch (_) {}
    return fallback || key;
  }

  function inputMode() {
    const btn = document.querySelector(".twtSegmentBtn.active[data-pag-mode]");
    return btn ? btn.getAttribute("data-pag-mode") : "manual";
  }

  function setInputMode(mode) {
    document.querySelectorAll(".twtSegmentBtn[data-pag-mode]").forEach((btn) => {
      const active = btn.getAttribute("data-pag-mode") === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function isFileInputMode() {
    return inputMode() === "file";
  }

  function defaultFileHint() {
    return t("pag.fileHint", "每行一个干员名，支持 丰川祥子(Oblivionis) 格式。");
  }

  function clearOperatorFile() {
    state.operatorFileLines = null;
    state.operatorFileName = "";
    if (refs.operatorFile) refs.operatorFile.value = "";
    if (refs.clearOperatorFileBtn) refs.clearOperatorFileBtn.disabled = true;
    if (refs.operatorFileHint) refs.operatorFileHint.textContent = defaultFileHint();
  }

  function clearManualInput() {
    if (refs.operatorInput) refs.operatorInput.value = "";
  }

  function syncInputModeUI() {
    const fileMode = isFileInputMode();
    if (refs.manualWrap) refs.manualWrap.hidden = fileMode;
    if (refs.fileWrap) refs.fileWrap.hidden = !fileMode;
    if (refs.operatorInput) refs.operatorInput.disabled = fileMode;
    if (refs.pickOperatorFileBtn) refs.pickOperatorFileBtn.disabled = !fileMode;
    if (refs.operatorFile) refs.operatorFile.disabled = !fileMode;
    if (!fileMode && refs.clearOperatorFileBtn) refs.clearOperatorFileBtn.disabled = true;
  }

  function readyStatusMessage() {
    return isFileInputMode()
      ? t("pag.readyFile", "就绪。请选择干员列表文件后点击开始生成。")
      : t("pag.readyManual", "就绪。输入干员名后点击开始生成。");
  }

  function setStatus(lines) {
    refs.status.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
  }

  function trim(value) {
    return String(value || "").trim();
  }

  function sanitizeClassname(rawName) {
    if (!rawName) return "Unknown";
    let name = rawName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    let mapped = "";
    for (const ch of name) mapped += CHAR_MAP[ch] || ch;
    name = mapped.replace(/[^a-zA-Z0-9_]/g, "");
    if (!name) return "Unknown";
    if (/^\d/.test(name)) name = "C" + name;
    return name[0].toUpperCase() + name.slice(1);
  }

  function parseMaterialConsumption(text) {
    const pattern = /\{\{材料消耗\|([^|]+)\|([^}]+)\}\}/g;
    const result = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let amountStr = trim(match[2]);
      let num = 0;
      if (amountStr.endsWith("w")) {
        const parsed = parseFloat(amountStr.slice(0, -1));
        num = Number.isFinite(parsed) ? Math.trunc(parsed * 10000) : 0;
      } else {
        const parsed = parseInt(amountStr, 10);
        num = Number.isFinite(parsed) ? parsed : 0;
      }
      result.push({ item: match[1], amount: num });
    }
    return result;
  }

  function extractTemplateBalanced(wikitext, templateName) {
    const startPattern = new RegExp("\\{\\{" + templateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const match = startPattern.exec(wikitext);
    if (!match) return null;
    const startPos = match.index;
    let i = startPos + 2;
    let balance = 1;
    while (i < wikitext.length && balance > 0) {
      if (wikitext.slice(i, i + 2) === "{{") {
        balance += 1;
        i += 2;
      } else if (wikitext.slice(i, i + 2) === "}}") {
        balance -= 1;
        i += 2;
      } else {
        i += 1;
      }
    }
    if (balance !== 0) return null;
    return wikitext.slice(startPos + 2, i - 2);
  }

  async function fetchOperatorWikitext(operatorName) {
    const res = await fetch("/trtools/prts/wikitext?name=" + encodeURIComponent(operatorName));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "PRTS 请求失败");
    return data.wikitext;
  }

  function parseOperatorRaw(wikitext, cnName) {
    const enMatch = wikitext.match(/\|\s*干员外文名\s*=\s*([^\n|]+)/);
    const rarityMatch = wikitext.match(/\|\s*稀有度\s*=\s*([^\n|]+)/);
    const professionMatch = wikitext.match(/\|\s*职业\s*=\s*([^\n|]+)/);

    const propInner = extractTemplateBalanced(wikitext, "属性");
    let maxHp = 0;
    let maxDef = 0;
    if (propInner) {
      const hps = [...propInner.matchAll(/\|\s*精\d+_满级_生命上限\s*=\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
      const defs = [...propInner.matchAll(/\|\s*精\d+_满级_防御\s*=\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
      if (hps.length) maxHp = Math.max(...hps);
      if (defs.length) maxDef = Math.max(...defs);
    }
    if (maxHp === 0) {
      const allHp = [...wikitext.matchAll(/\|\s*[^\n]*生命上限[^\n]*=\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
      if (allHp.length) maxHp = Math.max(...allHp);
    }
    if (maxDef === 0) {
      const allDef = [...wikitext.matchAll(/\|\s*[^\n]*防御[^\n]*=\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
      if (allDef.length) maxDef = Math.max(...allDef);
    }

    const eliteInner = extractTemplateBalanced(wikitext, "精英化材料");
    const eliteMaterials = {};
    if (eliteInner) {
      const elite1 = eliteInner.match(/\|\s*精1\s*=\s*([^\n]+?)(?=\n\||$)/s);
      const elite2 = eliteInner.match(/\|\s*精2\s*=\s*([^\n]+?)(?=\n\||$)/s);
      if (elite1) eliteMaterials.elite_1 = parseMaterialConsumption(elite1[1]);
      if (elite2) eliteMaterials.elite_2 = parseMaterialConsumption(elite2[1]);
    }

    const skillInner = extractTemplateBalanced(wikitext, "技能升级材料");
    const skillMaterials = {};
    if (skillInner) {
      for (let level = 2; level < 8; level += 1) {
        const pattern = new RegExp("\\|\\s*" + level + "\\s*=\\s*([^\\n]+?)(?=\\n\\||$)", "s");
        const match = skillInner.match(pattern);
        if (match) skillMaterials["level_" + level] = parseMaterialConsumption(match[1]);
      }
      const skillKeys = {
        skill_1: ["一8", "一9", "一10"],
        skill_2: ["二8", "二9", "二10"],
        skill_3: ["三8", "三9", "三10"]
      };
      Object.entries(skillKeys).forEach(([skillName, keys]) => {
        const specMats = {};
        keys.forEach((key, idx) => {
          const level = 8 + idx;
          const pattern = new RegExp("\\|\\s*" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*=\\s*([^\\n]+?)(?=\\n\\||$)", "s");
          const match = skillInner.match(pattern);
          if (match) specMats["level_" + level] = parseMaterialConsumption(match[1]);
        });
        if (Object.keys(specMats).length) skillMaterials[skillName] = specMats;
      });
    }

    const obtainInner = extractTemplateBalanced(wikitext, "干员获得方式");
    let obtainMethod = null;
    let obtainPrefix = null;
    if (obtainInner) {
      const methodMatch = obtainInner.match(/\|\s*获得方式\s*=\s*([^\n|]+)/);
      if (methodMatch) obtainMethod = trim(methodMatch[1]);
      const prefixMatch = obtainInner.match(/\|\s*前缀\s*=\s*(.+?)(?=\n\||\n$)/s);
      if (prefixMatch) obtainPrefix = trim(prefixMatch[1]);
    }

    return {
      "中文名": cnName,
      "英文名": enMatch ? trim(enMatch[1]) : null,
      "稀有度": rarityMatch ? trim(rarityMatch[1]) : null,
      "职业": professionMatch ? trim(professionMatch[1]) : null,
      "最大生命": maxHp,
      "最大防御": maxDef,
      "获得方式": obtainMethod,
      "前缀": obtainPrefix,
      "精英化材料": eliteMaterials,
      "技能升级材料": skillMaterials
    };
  }

  function convertMaterialName(chineseName) {
    return state.materialsMap[chineseName]?.name || chineseName;
  }

  function convertProfession(chineseProf) {
    return state.classMap[chineseProf] || chineseProf;
  }

  function convertItemsInData(obj) {
    if (Array.isArray(obj)) return obj.map(convertItemsInData);
    if (obj && typeof obj === "object") {
      const next = {};
      Object.entries(obj).forEach(([k, v]) => {
        next[k] = k === "item" && typeof v === "string" ? convertMaterialName(v) : convertItemsInData(v);
      });
      return next;
    }
    return obj;
  }

  function calcArmorStats(hpElite2, defElite2) {
    const hpBase = Math.round(hpElite2 * 0.2);
    const defBase = Math.round(defElite2 * 0.1);
    return {
      head_life: Math.round(hpBase * 0.5),
      body_life: Math.round(hpBase * 0.25),
      legs_life: Math.round(hpBase * 0.25),
      head_defense: 0,
      body_defense: Math.round(defBase * 0.75),
      legs_defense: Math.round(defBase * 0.25)
    };
  }

  function lastN(list, n) {
    if (!Array.isArray(list)) return [];
    return list.length >= n ? list.slice(-n) : list.slice();
  }

  function extractMaterialsByRarity(data, rarityOriginal) {
    const elite = data["精英化材料"] || {};
    const skill = data["技能升级材料"] || {};

    if (rarityOriginal === 2) {
      return [
        lastN(skill.level_3, 1),
        lastN(skill.level_5, 1),
        lastN(skill.level_4, 1)
      ];
    }
    if (rarityOriginal === 3) {
      const head = lastN(elite.elite_1, 1).concat(lastN(elite.elite_2, 1)).slice(0, 2);
      const body = lastN(skill.level_5, 1).concat(lastN(skill.level_6, 1)).slice(0, 2);
      const legs = lastN(skill.level_4, 1).concat(lastN(skill.level_7, 1)).slice(0, 2);
      return [head, body, legs];
    }
    if (rarityOriginal === 4) {
      const head = lastN(elite.elite_2, 2);
      const s1 = skill.skill_1 || {};
      const s2 = skill.skill_2 || {};
      const body = lastN(s1.level_8, 2);
      const legs = lastN(s2.level_8, 2);
      return [head, body, legs];
    }
    if (rarityOriginal === 5) {
      const s1 = skill.skill_1 || {};
      const s2 = skill.skill_2 || {};
      const s3 = skill.skill_3 || {};
      return [lastN(s1.level_10, 2), lastN(s2.level_10, 2), lastN(s3.level_10, 2)];
    }
    return [[], [], []];
  }

  function processOperator(data) {
    const result = { ...data };
    let originalRarity = parseInt(result["稀有度"], 10);
    if (!Number.isFinite(originalRarity)) originalRarity = 0;

    if (result["英文名"]) result["英文名"] = sanitizeClassname(result["英文名"]);
    if (result["职业"]) result["职业"] = convertProfession(result["职业"]);

    const converted = convertItemsInData(result);
    const [headMats, bodyMats, legsMats] = extractMaterialsByRarity(converted, originalRarity);

    let armor = {};
    try {
      const hp = parseInt(converted["最大生命"], 10);
      const defense = parseInt(converted["最大防御"], 10);
      if (Number.isFinite(hp) && Number.isFinite(defense)) armor = calcArmorStats(hp, defense);
    } catch (_) {}

    return {
      name_cn: converted["中文名"],
      name_en: converted["英文名"],
      rarity: originalRarity + 1,
      class: converted["职业"],
      max_hp: parseInt(converted["最大生命"], 10) || 0,
      max_def: parseInt(converted["最大防御"], 10) || 0,
      head_materials: headMats,
      body_materials: bodyMats,
      legs_materials: legsMats,
      armor_stats: armor,
      obtain_method: converted["获得方式"] || null,
      obtain_prefix: converted["前缀"] || null
    };
  }

  function resolveObtainType(obtainMethod, obtainPrefix) {
    if (!obtainMethod) return "Default";
    if (obtainMethod.includes("联动寻访")) return "Limited_CrossOver";
    if (obtainMethod.includes("限定寻访") && obtainPrefix) {
      const m = obtainPrefix.match(/【(.+?)】/);
      if (m) return state.obtainTypesMap[m[1]] || "Default";
    }
    return "Default";
  }

  function injectRecipe(content, part, data) {
    const materialsKey = part + "_materials";
    const materials = data[materialsKey] || [];
    const orundumAmount = data.rarity * 10;
    const nameEn = data.name_en;
    const partCap = part[0].toUpperCase() + part.slice(1);

    const recipeLines = [
      "\t\t\tCreateRecipe()",
      "\t\t\t.AddIngredient<" + nameEn + partCap + ">(1)",
      "\t\t\t.AddIngredient<Orundum>(" + orundumAmount + ")"
    ];
    materials.forEach((mat) => {
      recipeLines.push("\t\t\t.AddIngredient<" + mat.item + ">(" + mat.amount + ")");
    });
    recipeLines.push("\t\t\t.AddTile(ModContent.TileType<FactoryTile>())");
    recipeLines.push("\t\t\t.AddCondition(NeoArmorUtils.NeedVanity)");
    recipeLines.push("\t\t\t.DisableDecraft()");
    recipeLines.push("\t\t\t.Register();");

    const newRecipeBody = recipeLines.join("\n");
    const methodPattern = /(public override void AddRecipes\(\)\s*\{)/;
    const match = methodPattern.exec(content);
    if (!match) return content;

    const startPos = match.index + match[0].length;
    let braceCount = 1;
    let endPos = startPos;
    for (let i = startPos; i < content.length; i += 1) {
      if (content[i] === "{") braceCount += 1;
      else if (content[i] === "}") {
        braceCount -= 1;
        if (braceCount === 0) {
          endPos = i;
          break;
        }
      }
    }
    return content.slice(0, startPos) + "\n" + newRecipeBody + "\n\t\t" + content.slice(endPos);
  }

  function generateArmorFromData(data) {
    const nameEn = data.name_en;
    const className = data.class;
    const rarity = data.rarity;
    const armorStats = data.armor_stats || {};
    const files = [];

    const baseReplacements = {
      "{name_en}": nameEn,
      "{class}": className,
      "{rarity}": String(rarity),
      "{head_life}": String(armorStats.head_life ?? 0),
      "{head_defense}": String(armorStats.head_defense ?? 0),
      "{body_life}": String(armorStats.body_life ?? 0),
      "{body_defense}": String(armorStats.body_defense ?? 0),
      "{legs_life}": String(armorStats.legs_life ?? 0),
      "{legs_defense}": String(armorStats.legs_defense ?? 0)
    };

    ["head", "body", "legs"].forEach((part) => {
      let content = state.templates[part];
      Object.entries(baseReplacements).forEach(([key, value]) => {
        content = content.split(key).join(value);
      });
      content = injectRecipe(content, part, data);
      const partCap = part[0].toUpperCase() + part.slice(1);
      const relPath = "Armor/" + className + "/" + nameEn + "/" + nameEn + partCap + ".cs";
      files.push({ path: relPath, content });
    });

    if (state.templates.vanity) {
      const obtainType = resolveObtainType(data.obtain_method, data.obtain_prefix);
      let content = state.templates.vanity;
      const bagReplacements = {
        "{name_en}": nameEn,
        "{class}": className,
        "{rarity}": String(rarity),
        "{obtain_type}": obtainType
      };
      Object.entries(bagReplacements).forEach(([key, value]) => {
        content = content.split(key).join(value);
      });
      files.push({ path: "Armor/" + className + "/" + nameEn + "/" + nameEn + "Default.cs", content });
    }

    return files;
  }

  function parseOperatorNames(text, fileLines) {
    const rawNames = [];
    const source = Array.isArray(fileLines) ? fileLines : trim(text).split(/[,，\n]/);
    source.forEach((part) => {
      const v = trim(part).replace(/（/g, "(").replace(/）/g, ")");
      if (v) rawNames.push(v);
    });
    return rawNames.map((raw) => {
      const m = raw.match(/^(.+?)\((.+?)\)$/);
      return m ? { cn: trim(m[1]), customEn: trim(m[2]) } : { cn: raw, customEn: null };
    });
  }

  function renderSummary(items) {
    refs.summary.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "kvRow";
      row.innerHTML = "<div class=\"kvKey\">" + item.key + "</div><div class=\"kvVal\">" + item.value + "</div>";
      refs.summary.appendChild(row);
    });
  }

  function updateFileSelect() {
    refs.fileSelect.innerHTML = "";
    state.generatedFiles.forEach((file, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = file.path;
      refs.fileSelect.appendChild(opt);
    });
    refs.downloadZipBtn.disabled = state.generatedFiles.length === 0;
    refs.copyCurrentBtn.disabled = state.generatedFiles.length === 0;
    if (state.generatedFiles.length) showCodeFile(0);
    else refs.outputCode.textContent = "";
  }

  function showCodeFile(index) {
    const file = state.generatedFiles[index];
    if (!file) return;
    refs.fileSelect.value = String(index);
    refs.outputCode.textContent = file.content;
  }

  function updateJsonOutput() {
    refs.outputJson.textContent = state.jsonOutputs.length
      ? JSON.stringify(state.jsonOutputs, null, 2)
      : "";
    refs.downloadJsonBtn.disabled = state.jsonOutputs.length === 0;
  }

  function setResultTab(tab) {
    state.activeResultTab = tab;
    refs.tabCode.classList.toggle("active", tab === "code");
    refs.tabJson.classList.toggle("active", tab === "json");
    refs.outputCode.hidden = tab !== "code";
    refs.outputJson.hidden = tab !== "json";
    refs.fileSelect.hidden = tab !== "code";
    refs.copyCurrentBtn.hidden = tab !== "code";
    refs.downloadZipBtn.hidden = tab !== "code";
    refs.downloadJsonBtn.hidden = tab !== "json";
  }

  async function loadStaticData() {
    const [materials, classes, obtainTypes, head, body, legs, vanity] = await Promise.all([
      fetch(DATA_BASE + "/arknights_materials.json").then((r) => r.json()),
      fetch(DATA_BASE + "/arknights_classes.json").then((r) => r.json()),
      fetch(DATA_BASE + "/arknights_obtain_types.json").then((r) => r.json()),
      fetch(DATA_BASE + "/Template_Head.template").then((r) => r.text()),
      fetch(DATA_BASE + "/Template_Body.template").then((r) => r.text()),
      fetch(DATA_BASE + "/Template_Legs.template").then((r) => r.text()),
      fetch(DATA_BASE + "/Template_VanityBag.template").then((r) => r.text())
    ]);
    state.materialsMap = materials;
    state.classMap = classes;
    state.obtainTypesMap = obtainTypes;
    state.templates = { head, body, legs, vanity };
  }

  async function runPipeline() {
    const step = refs.stepSelect.value;
    const saveIntermediate = refs.saveIntermediate.checked;
    const quiet = refs.quietMode.checked;
    const operators = isFileInputMode()
      ? parseOperatorNames("", state.operatorFileLines || [])
      : parseOperatorNames(refs.operatorInput.value, null);

    if (!operators.length) {
      setStatus(isFileInputMode()
        ? t("pag.errNoFile", "请先选择包含干员列表的文本文件。")
        : t("pag.errNoInput", "请至少输入一个干员名。"));
      return;
    }

    refs.runBtn.disabled = true;
    state.generatedFiles = [];
    state.jsonOutputs = [];
    const statusLines = [];
    const allFiles = [];
    const allJson = [];

    try {
      for (const op of operators) {
        statusLines.push("正在处理: " + op.cn);
        setStatus(statusLines);

        const wikitext = await fetchOperatorWikitext(op.cn);
        let rawData = parseOperatorRaw(wikitext, op.cn);
        if (op.customEn) rawData["英文名"] = op.customEn;

        if (step === "fetch") {
          allJson.push({ type: "raw", operator: op.cn, data: rawData });
          if (saveIntermediate) statusLines.push("  原始数据: 原始_" + op.cn + ".json");
          continue;
        }

        const finalData = processOperator(rawData);
        if (saveIntermediate) {
          allJson.push({ type: "raw", operator: op.cn, data: rawData });
        }

        if (step === "process") {
          allJson.push({ type: "final", operator: op.cn, data: finalData });
          statusLines.push("  已处理: " + op.cn);
          continue;
        }

        const files = generateArmorFromData(finalData);
        allFiles.push(...files);
        allJson.push({ type: "final", operator: op.cn, data: finalData });
        if (saveIntermediate) statusLines.push("  已生成盔甲: " + op.cn + " (" + files.length + " 个文件)");
        else statusLines.push("  已生成盔甲: " + op.cn);
      }

      state.generatedFiles = allFiles;
      state.jsonOutputs = allJson;
      updateFileSelect();
      updateJsonOutput();

      if (!quiet && allJson.length) {
        setResultTab(step === "armor" ? "code" : "json");
      }

      const summary = [
        { key: "执行步骤", value: step },
        { key: "干员数量", value: String(operators.length) },
        { key: "生成文件", value: String(allFiles.length) },
        { key: "JSON 条目", value: String(allJson.length) }
      ];
      renderSummary(summary);
      statusLines.push("完成。");
      setStatus(statusLines);
    } catch (err) {
      setStatus((statusLines.length ? statusLines.join("\n") + "\n" : "") + "错误: " + (err.message || err));
    } finally {
      refs.runBtn.disabled = false;
    }
  }

  async function downloadZip() {
    if (!window.JSZip || !state.generatedFiles.length) return;
    const zip = new JSZip();
    state.generatedFiles.forEach((file) => zip.file(file.path, file.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prts-armor-generated.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadJson() {
    if (!state.jsonOutputs.length) return;
    const blob = new Blob([JSON.stringify(state.jsonOutputs, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prts-armor-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function copyCurrent() {
    const idx = parseInt(refs.fileSelect.value, 10) || 0;
    const file = state.generatedFiles[idx];
    if (!file) return;
    navigator.clipboard.writeText(file.content).then(() => {
      setStatus("已复制: " + file.path);
    }).catch(() => setStatus("复制失败"));
  }

  function bindEvents() {
    document.querySelectorAll(".twtSegmentBtn[data-pag-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-pag-mode");
        if (!mode || mode === inputMode()) return;
        setInputMode(mode);
        if (isFileInputMode()) clearManualInput();
        else clearOperatorFile();
        syncInputModeUI();
        setStatus(readyStatusMessage());
      });
    });

    refs.runBtn.addEventListener("click", runPipeline);
    refs.fileSelect.addEventListener("change", () => showCodeFile(parseInt(refs.fileSelect.value, 10) || 0));
    refs.downloadZipBtn.addEventListener("click", downloadZip);
    refs.downloadJsonBtn.addEventListener("click", downloadJson);
    refs.copyCurrentBtn.addEventListener("click", copyCurrent);
    refs.tabCode.addEventListener("click", () => setResultTab("code"));
    refs.tabJson.addEventListener("click", () => setResultTab("json"));
    refs.pickOperatorFileBtn.addEventListener("click", () => refs.operatorFile.click());
    refs.clearOperatorFileBtn.addEventListener("click", clearOperatorFile);
    refs.operatorFile.addEventListener("change", async () => {
      const file = refs.operatorFile.files && refs.operatorFile.files[0];
      if (!file) {
        clearOperatorFile();
        return;
      }
      const text = await file.text();
      state.operatorFileLines = text.split(/\r?\n/);
      state.operatorFileName = file.name;
      const count = state.operatorFileLines.filter((line) => trim(line)).length;
      refs.clearOperatorFileBtn.disabled = false;
      refs.operatorFileHint.textContent = t("pag.fileLoaded", "已加载: {name}（{count} 个干员）")
        .replace("{name}", file.name)
        .replace("{count}", String(count));
    });
  }

  async function init() {
    bindEvents();
    setInputMode("manual");
    setResultTab("code");
    syncInputModeUI();
    try {
      await loadStaticData();
      setStatus(readyStatusMessage());
    } catch (err) {
      setStatus("加载模板或配置失败: " + (err.message || err));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
