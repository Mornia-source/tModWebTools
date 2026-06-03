// DEPLOY_MARKER: armorcodegen-manual-materials-only-v10
const armorCodeEl = (id) => document.getElementById(id);

const ARMOR_CODE_PROFESSIONS = [
  ["Vanguard", "先锋"],
  ["Guard", "近卫"],
  ["Defender", "重装"],
  ["Sniper", "狙击"],
  ["Caster", "术士"],
  ["Medic", "医疗"],
  ["Supporter", "辅助"],
  ["Specialist", "特种"]
];

const ARMOR_CODE_PARTS = [
  { key: "head", label: "头部", vanityItem: "Head", armorClass: "Head", baseClass: "ArknightsArmorHead", vanityBase: "ArknightsVanityHead", defaultDefense: 0, defaultLife: 140, itemSuffix: "_Head_item.png", splitSuffix: "_Head.png", outItem: "Head.png", outSplit: "Head_Head.png" },
  { key: "body", label: "身体", vanityItem: "Body", armorClass: "Body", baseClass: "ArknightsArmorBody", vanityBase: "ArknightsVanityBody", defaultDefense: 13, defaultLife: 70, itemSuffix: "_Body_item.png", splitSuffix: "_Body1.4.png", outItem: "Body.png", outSplit: "Body_Body.png" },
  { key: "legs", label: "腿部", vanityItem: "Legs", armorClass: "Legs", baseClass: "ArknightsArmorLegs", vanityBase: "ArknightsVanityLegs", defaultDefense: 4, defaultLife: 70, itemSuffix: "_Legs_item.png", splitSuffix: "_Legs.png", outItem: "Legs.png", outSplit: "Legs_Legs.png" }
];

const armorCodeRefs = {
  raritySelect: armorCodeEl("raritySelect"),
  professionSelect: armorCodeEl("professionSelect"),
  operatorInput: armorCodeEl("operatorInput"),
  operatorPickerToggle: armorCodeEl("operatorPickerToggle"),
  operatorPickerPanel: armorCodeEl("operatorPickerPanel"),
  operatorPickerSearch: armorCodeEl("operatorPickerSearch"),
  operatorPickerList: armorCodeEl("operatorPickerList"),
  operatorCodePreview: armorCodeEl("operatorCodePreview"),
  partConfigGrid: armorCodeEl("partConfigGrid"),
  effectSelect: armorCodeEl("effectSelect"),
  addEffectBtn: armorCodeEl("addEffectBtn"),
  selectedEffects: armorCodeEl("selectedEffects"),
  materialSections: armorCodeEl("materialSections"),
  generateBtn: armorCodeEl("generateBtn"),
  generateBtnText: armorCodeEl("generateBtnText"),
  writeFilesBtn: armorCodeEl("writeFilesBtn"),
  downloadZipBtn: armorCodeEl("downloadZipBtn"),
  copyCurrentBtn: armorCodeEl("copyCurrentBtn"),
  armorCodeStatus: armorCodeEl("armorCodeStatus"),
  fileSelect: armorCodeEl("fileSelect"),
  outputCode: armorCodeEl("outputCode"),
  exportSummary: armorCodeEl("exportSummary"),
  onlineCount: armorCodeEl("onlineCount"),
  sourceDirDisplay: armorCodeEl("sourceDirDisplay"),
  sourceDirHint: armorCodeEl("sourceDirHint"),
  pickSourceDirBtn: armorCodeEl("pickSourceDirBtn"),
  vanityFileInput: armorCodeEl("vanityFileInput"),
  pickVanityFilesBtn: armorCodeEl("pickVanityFilesBtn"),
  vanitySelectionTitle: armorCodeEl("vanitySelectionTitle"),
  vanitySelectionSub: armorCodeEl("vanitySelectionSub"),
  vanitySelectionCount: armorCodeEl("vanitySelectionCount"),
  vanityFilesWrap: armorCodeEl("vanityFilesWrap"),
  vanityFileHint: armorCodeEl("vanityFileHint"),
  armorModeWrap: armorCodeEl("armorModeWrap"),
  topHint: armorCodeEl("armorCodegenTopHint")
};

const armorCodeState = {
  materials: [],
  effects: [],
  operators: {},
  operatorList: [],
  selectedEffects: [],
  recipeMaterials: { head: [], body: [], legs: [] },
  generatedFiles: [],
  selectedSourceHandle: null,
  selectedSourceName: "",
  vanityFiles: []
};

const armorCodeMaterialUX = {
  openPart: null,
  pending: { head: null, body: null, legs: null },
  docBound: false
};

const armorCodeOperatorUX = {
  open: false,
  filter: "",
  docBound: false
};

function armorCodeSetStatus(lines) {
  armorCodeRefs.armorCodeStatus.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}

function armorCodeMode() {
  const el = document.querySelector('input[name="armorCodegenMode"]:checked');
  return el ? el.value : "armor";
}

function armorCodeIsArmorMode() {
  return armorCodeMode() === "armor";
}

function armorCodeSelectedProfession() {
  return armorCodeRefs.professionSelect.value || "Guard";
}

function armorCodeTrim(value) {
  return String(value || "").trim();
}

function armorCodeSlug(value) {
  const stripped = armorCodeTrim(value).replace(/[^A-Za-z0-9_]/g, "");
  return stripped.replace(/^[0-9]+/, "") || "";
}

function armorCodePascal(value) {
  const slug = armorCodeSlug(value);
  if (!slug) return "";
  return slug[0].toUpperCase() + slug.slice(1);
}

function armorCodeEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function armorCodeOperatorMapped() {
  const entered = armorCodeTrim(armorCodeRefs.operatorInput.value);
  if (!entered) return "";
  return armorCodeState.operators[entered] || armorCodePascal(entered);
}

function armorCodeOperatorList() {
  return Array.isArray(armorCodeState.operatorList) && armorCodeState.operatorList.length
    ? armorCodeState.operatorList
    : Object.entries(armorCodeState.operators).map(([cn, en]) => ({ cn, en, profession: "" }));
}

function armorCodeProfessionLabel(profession) {
  const hit = ARMOR_CODE_PROFESSIONS.find(([en]) => en === profession);
  return hit ? `${hit[1]} (${hit[0]})` : profession || "";
}

function armorCodeFindOperatorEntry(value) {
  const entered = armorCodeTrim(value);
  if (!entered) return null;
  const lower = entered.toLowerCase();
  return armorCodeOperatorList().find((entry) =>
    entry.cn === entered
    || entry.en === entered
    || entry.en.toLowerCase() === lower
  ) || null;
}

function armorCodeOperatorClassBase() {
  return armorCodeOperatorMapped() || "Amiya";
}

function armorCodeArmorClassPrefix() {
  return `Armor${armorCodeOperatorClassBase()}`;
}

function armorCodeNamespaceBase() {
  return `ArknightsMod.Content.Items.Armor.Vanity.${armorCodeSelectedProfession()}.${armorCodeOperatorClassBase()}`;
}

function armorCodeArmorNamespace() {
  return `${armorCodeNamespaceBase()}.Armor`;
}

function armorCodeRarity() {
  return Math.max(1, Math.min(6, parseInt(armorCodeRefs.raritySelect.value || "3", 10) || 3));
}

function armorCodeOrundumCount() {
  return armorCodeRarity() * 10;
}

function armorCodeBuildSelectors() {
  armorCodeRefs.professionSelect.innerHTML = ARMOR_CODE_PROFESSIONS.map(([en, zh]) => `<option value="${en}">${zh} (${en})</option>`).join("");
  armorCodeRefs.raritySelect.innerHTML = [1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}"${value === 3 ? " selected" : ""}>${value}</option>`).join("");
}

function armorCodeBuildPartConfig() {
  armorCodeRefs.partConfigGrid.innerHTML = "";
  ARMOR_CODE_PARTS.forEach((part) => {
    const card = document.createElement("section");
    card.className = "armorCodePartCard";
    card.innerHTML = `
      <div class="armorCodePartTitle">${part.label}</div>
      <div class="grid">
        <div>
          <label for="${part.key}Defense">防御</label>
          <input id="${part.key}Defense" type="number" value="${part.defaultDefense}" min="0" step="1" />
        </div>
        <div>
          <label for="${part.key}Life">生命</label>
          <input id="${part.key}Life" type="number" value="${part.defaultLife}" min="0" step="1" />
        </div>
      </div>
    `;
    armorCodeRefs.partConfigGrid.appendChild(card);
  });
}

function armorCodeRenderEffectSelect() {
  armorCodeRefs.effectSelect.innerHTML = ['<option value="">选择套装效果</option>'].concat(
    armorCodeState.effects.map((effect) => `<option value="${effect.id}">${effect.name}</option>`)
  ).join("");
}

function armorCodeSyncOperatorPreview() {
  const entry = armorCodeFindOperatorEntry(armorCodeRefs.operatorInput.value);
  armorCodeRefs.operatorCodePreview.value = entry ? entry.en : armorCodeOperatorClassBase();
  armorCodeRefs.operatorPickerToggle.textContent = entry
    ? `${entry.cn} / ${entry.en}${entry.profession ? ` / ${armorCodeProfessionLabel(entry.profession)}` : ""}`
    : (armorCodeTrim(armorCodeRefs.operatorInput.value)
      ? `${armorCodeTrim(armorCodeRefs.operatorInput.value)} / ${armorCodeOperatorClassBase()}`
      : "选择干员或输入自定义英文名");
}

function armorCodeCloseOperatorPicker() {
  if (!armorCodeOperatorUX.open) return;
  armorCodeOperatorUX.open = false;
  armorCodeRefs.operatorPickerPanel.classList.remove("armorCodeOperatorPanel--open");
  armorCodeRefs.operatorPickerPanel.hidden = true;
  armorCodeRefs.operatorPickerToggle.setAttribute("aria-expanded", "false");
  armorCodeRefs.operatorPickerToggle.classList.remove("armorCodeOperatorToggle--open");
}

function armorCodeOpenOperatorPicker() {
  armorCodeOperatorUX.open = true;
  armorCodeRefs.operatorPickerPanel.hidden = false;
  armorCodeRefs.operatorPickerPanel.classList.add("armorCodeOperatorPanel--open");
  armorCodeRefs.operatorPickerToggle.setAttribute("aria-expanded", "true");
  armorCodeRefs.operatorPickerToggle.classList.add("armorCodeOperatorToggle--open");
  armorCodeRenderOperatorPicker(armorCodeRefs.operatorPickerSearch.value || "");
  requestAnimationFrame(() => armorCodeRefs.operatorPickerSearch.focus());
}

function armorCodeApplyOperatorSelection(value, profession) {
  armorCodeRefs.operatorInput.value = armorCodeTrim(value);
  if (profession) armorCodeRefs.professionSelect.value = profession;
  armorCodeSyncOperatorPreview();
  armorCodeCloseOperatorPicker();
}

function armorCodeRenderOperatorPicker(filterValue) {
  const filter = armorCodeTrim(filterValue).toLowerCase();
  armorCodeOperatorUX.filter = filterValue || "";
  const selectedEntry = armorCodeFindOperatorEntry(armorCodeRefs.operatorInput.value);
  const rows = armorCodeOperatorList().filter((entry) => {
    if (!filter) return true;
    return entry.cn.toLowerCase().includes(filter)
      || entry.en.toLowerCase().includes(filter)
      || armorCodeProfessionLabel(entry.profession).toLowerCase().includes(filter);
  });
  const fragments = [];
  if (filter && armorCodeSlug(filterValue)) {
    fragments.push(`
      <button type="button" class="armorCodeOperatorRow" data-custom="${armorCodeEscape(filterValue)}">
        <span class="armorCodeOperatorMeta">
          <span class="armorCodeOperatorTitle">使用自定义英文类名</span>
          <span class="armorCodeOperatorSub">${armorCodeEscape(armorCodePascal(filterValue))}</span>
        </span>
        <span class="armorCodeOperatorTag">自定义</span>
      </button>
    `);
  }
  if (!rows.length) {
    fragments.push('<div class="hint" style="padding:12px">没有匹配的干员。</div>');
  } else {
    fragments.push(rows.map((entry) => `
      <button type="button" class="armorCodeOperatorRow${selectedEntry && selectedEntry.cn === entry.cn ? " armorCodeOperatorRow--active" : ""}" data-cn="${armorCodeEscape(entry.cn)}">
        <span class="armorCodeOperatorMeta">
          <span class="armorCodeOperatorTitle">${entry.cn} / ${entry.en}</span>
          <span class="armorCodeOperatorSub">${entry.profession ? armorCodeProfessionLabel(entry.profession) : "未标注职业"}</span>
        </span>
        <span class="armorCodeOperatorTag">${entry.profession || "Custom"}</span>
      </button>
    `).join(""));
  }
  armorCodeRefs.operatorPickerList.innerHTML = fragments.join("");
  armorCodeRefs.operatorPickerList.querySelectorAll("[data-cn]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = armorCodeFindOperatorEntry(button.getAttribute("data-cn"));
      if (entry) armorCodeApplyOperatorSelection(entry.cn, entry.profession);
    });
  });
  armorCodeRefs.operatorPickerList.querySelectorAll("[data-custom]").forEach((button) => {
    button.addEventListener("click", () => {
      armorCodeApplyOperatorSelection(armorCodePascal(button.getAttribute("data-custom") || ""), "");
    });
  });
}

function armorCodeApplyModeUI() {
  const armorMode = armorCodeIsArmorMode();
  armorCodeRefs.armorModeWrap.hidden = !armorMode;
  armorCodeRefs.vanityFilesWrap.hidden = armorMode;
  armorCodeRefs.generateBtnText.textContent = armorMode ? "生成文件" : "生成时装";
  armorCodeRefs.topHint.textContent = armorMode
    ? "按桌面版原始规则生成 Armor 子目录、盔甲三件套、SetPlayer 与配方。"
    : "按桌面版原始规则生成时装三件套、重命名 PNG，并在提供原图时生成 VanityBag。";
}

function armorCodeFindMaterial(name) {
  return armorCodeState.materials.find((item) => item.en === name || item.cn === name) || null;
}

function armorCodeCloseMaterialPicker() {
  const key = armorCodeMaterialUX.openPart;
  if (!key) return;
  const panel = armorCodeEl(`${key}MatPickerPanel`);
  const toggle = armorCodeEl(`${key}MatPickerToggle`);
  if (panel) {
    panel.classList.remove("armorCodeMatPickerPanel--open");
    panel.hidden = true;
  }
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("armorCodeMatPickerToggle--open");
  }
  armorCodeMaterialUX.openPart = null;
}

function armorCodeOpenMaterialPicker(partKey) {
  armorCodeCloseMaterialPicker();
  armorCodeMaterialUX.openPart = partKey;
  const panel = armorCodeEl(`${partKey}MatPickerPanel`);
  const toggle = armorCodeEl(`${partKey}MatPickerToggle`);
  if (panel) {
    panel.hidden = false;
    panel.classList.add("armorCodeMatPickerPanel--open");
  }
  if (toggle) {
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("armorCodeMatPickerToggle--open");
  }
  armorCodeFillMaterialPickerScroll(partKey);
}

function armorCodeUpdateMaterialPickerToggleLabel(partKey) {
  const label = document.querySelector(`#${partKey}MatPickerToggle .armorCodeMatPickerToggleLabel`);
  const pending = armorCodeMaterialUX.pending[partKey];
  if (!label) return;
  if (!pending) {
    label.textContent = "展开材料列表";
    return;
  }
  const material = armorCodeFindMaterial(pending);
  label.textContent = material ? `${material.cn} (${material.en})` : pending;
}

function armorCodeGetMaterialSearchQuery(partKey) {
  const input = armorCodeEl(`${partKey}MatPickerSearch`);
  return input ? String(input.value || "").trim().toLowerCase() : "";
}

function armorCodeMaterialsFilteredForPicker(partKey) {
  const list = armorCodeState.materials || [];
  const query = armorCodeGetMaterialSearchQuery(partKey);
  if (!query) return list;
  return list.filter((item) => String(item.cn || "").toLowerCase().includes(query) || String(item.en || "").toLowerCase().includes(query));
}

function armorCodeFillMaterialPickerScroll(partKey) {
  const scroll = armorCodeEl(`${partKey}MatPickerScroll`);
  if (!scroll) return;
  scroll.innerHTML = "";
  const pending = armorCodeMaterialUX.pending[partKey];
  const items = armorCodeMaterialsFilteredForPicker(partKey);
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.style.padding = "14px 12px";
    empty.textContent = "没有符合条件的材料";
    scroll.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "armorCodeMatPickerRow";
    if (pending === item.en) button.classList.add("armorCodeMatPickerRow--active");
    if (item.img) {
      button.innerHTML = `
        <img class="armorCodeMatPickerRowImg" src="/trtools/data/armor-code-generator/${item.img}" alt="" />
        <div class="armorCodeMatPickerRowText">
          <span class="armorCodeMatPickerRowTitle">${item.cn || item.en}</span>
          <span class="armorCodeMatPickerRowSub">${item.en || ""}</span>
        </div>
      `;
    } else {
      button.innerHTML = `
        <div class="armorCodeMatPickerRowImg" aria-hidden="true"></div>
        <div class="armorCodeMatPickerRowText">
          <span class="armorCodeMatPickerRowTitle">${item.cn || item.en}</span>
          <span class="armorCodeMatPickerRowSub">${item.en || ""}</span>
        </div>
      `;
    }
    button.addEventListener("click", () => {
      armorCodeMaterialUX.pending[partKey] = item.en;
      armorCodeFillMaterialPickerScroll(partKey);
      armorCodeUpdateMaterialPickerToggleLabel(partKey);
    });
    scroll.appendChild(button);
  });
}

function armorCodeOnDocPointerDown(event) {
  if (!armorCodeMaterialUX.openPart) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const stack = target.closest(".armorCodeMaterialPickerStack");
  if (stack && stack.getAttribute("data-ac-mat-part") === armorCodeMaterialUX.openPart) return;
  armorCodeCloseMaterialPicker();
}

function armorCodeBindMaterialPickerDocOnce() {
  if (armorCodeMaterialUX.docBound) return;
  document.addEventListener("mousedown", armorCodeOnDocPointerDown);
  armorCodeMaterialUX.docBound = true;
}

function armorCodeRenderSelectedMaterials(partKey) {
  const host = armorCodeEl(`${partKey}MaterialList`);
  const rows = armorCodeState.recipeMaterials[partKey];
  host.innerHTML = "";
  if (!rows.length) {
    host.innerHTML = '<div class="hint">尚未添加额外材料</div>';
    return;
  }
  rows.forEach((row, index) => {
    const material = armorCodeFindMaterial(row.en) || { cn: row.en, en: row.en, img: "" };
    const item = document.createElement("div");
    item.className = "armorCodeSelectedRow";
    item.innerHTML = `
      <div class="armorCodeSelectedMeta">
        ${material.img ? `<img class="armorCodeMatIcon" src="/trtools/data/armor-code-generator/${material.img}" alt="" />` : ""}
        <div>
          <div>${material.cn}</div>
          <div class="muted mono">${material.en}</div>
        </div>
      </div>
      <div class="armorCodeCountTools">
        <input type="number" value="${row.count}" min="1" step="1" />
        <button type="button" class="iconBtn" title="删除"><i class="fas fa-times"></i></button>
      </div>
    `;
    item.querySelector("input").addEventListener("input", (event) => {
      row.count = Math.max(1, parseInt(event.target.value || "1", 10));
    });
    item.querySelector("button").addEventListener("click", () => {
      armorCodeState.recipeMaterials[partKey].splice(index, 1);
      armorCodeRenderSelectedMaterials(partKey);
    });
    host.appendChild(item);
  });
}

function armorCodeRenderMaterialSections() {
  armorCodeCloseMaterialPicker();
  armorCodeMaterialUX.pending = { head: null, body: null, legs: null };
  armorCodeRefs.materialSections.innerHTML = "";
  ARMOR_CODE_PARTS.forEach((part) => {
    const wrap = document.createElement("section");
    wrap.className = "armorCodeMaterialSection";
    wrap.innerHTML = `
      <div class="armorCodePartTitle">${part.label}配方</div>
      <div class="armorCodeMaterialPickerStack" data-ac-mat-part="${part.key}">
        <div class="armorCodePickerRow armorCodePickerRow--mat">
          <button type="button" class="btn secondary armorCodeMatPickerToggle" id="${part.key}MatPickerToggle" aria-expanded="false" aria-controls="${part.key}MatPickerPanel">
            <i class="fas fa-layer-group" style="margin-right:8px;opacity:.85" aria-hidden="true"></i><span class="armorCodeMatPickerToggleLabel">展开材料列表</span>
          </button>
          <input id="${part.key}MaterialCount" type="number" value="1" min="1" step="1" />
          <button type="button" class="btn secondary" id="${part.key}AddMaterialBtn"><i class="fas fa-plus" style="margin-right:8px"></i>添加</button>
        </div>
        <div id="${part.key}MatPickerPanel" class="armorCodeMatPickerPanel" role="region" hidden>
          <div class="armorCodeMatPickerSearchRow">
            <input type="search" id="${part.key}MatPickerSearch" class="textInput" placeholder="搜索材料" autocomplete="off" spellcheck="false" />
          </div>
          <div class="armorCodeMatPickerScroll" id="${part.key}MatPickerScroll"></div>
        </div>
      </div>
      <div id="${part.key}MaterialList" class="armorCodeSelectedList"></div>
    `;
    armorCodeRefs.materialSections.appendChild(wrap);
  });

  ARMOR_CODE_PARTS.forEach((part) => {
    armorCodeUpdateMaterialPickerToggleLabel(part.key);
    armorCodeEl(`${part.key}MatPickerToggle`).addEventListener("click", (event) => {
      event.stopPropagation();
      if (armorCodeMaterialUX.openPart === part.key) armorCodeCloseMaterialPicker();
      else armorCodeOpenMaterialPicker(part.key);
    });
    const searchEl = armorCodeEl(`${part.key}MatPickerSearch`);
    searchEl.addEventListener("input", () => armorCodeFillMaterialPickerScroll(part.key));
    armorCodeEl(`${part.key}AddMaterialBtn`).addEventListener("click", () => {
      const materialName = armorCodeMaterialUX.pending[part.key];
      const count = Math.max(1, parseInt(armorCodeEl(`${part.key}MaterialCount`).value || "1", 10));
      if (!materialName) {
        armorCodeSetStatus("请先在材料列表中选择一个材料。");
        return;
      }
      const existed = armorCodeState.recipeMaterials[part.key].find((entry) => entry.en === materialName);
      if (existed) existed.count = count;
      else armorCodeState.recipeMaterials[part.key].push({ en: materialName, count });
      armorCodeRenderSelectedMaterials(part.key);
    });
    armorCodeRenderSelectedMaterials(part.key);
  });
  armorCodeBindMaterialPickerDocOnce();
}

function armorCodeRenderSelectedEffects() {
  armorCodeRefs.selectedEffects.innerHTML = "";
  if (!armorCodeState.selectedEffects.length) {
    armorCodeRefs.selectedEffects.innerHTML = '<div class="hint">尚未添加套装效果</div>';
    return;
  }
  armorCodeState.selectedEffects.forEach((entry, index) => {
    const effect = armorCodeState.effects.find((item) => item.id === entry.id);
    if (!effect) return;
    const row = document.createElement("div");
    row.className = "armorCodeSelectedRow";
    row.innerHTML = `
      <div class="armorCodeSelectedMeta">
        <div>
          <div>${effect.name}</div>
          <div class="muted mono">${effect.id}</div>
        </div>
      </div>
      <div class="armorCodeCountTools">
        ${effect.requiresValue ? `<input type="number" value="${entry.value}" step="${effect.valueKind === "percent" ? "0.01" : "1"}" />` : ""}
        <button type="button" class="iconBtn" title="删除"><i class="fas fa-times"></i></button>
      </div>
    `;
    if (effect.requiresValue) {
      row.querySelector("input").addEventListener("input", (event) => {
        entry.value = event.target.value;
      });
    }
    row.querySelector("button").addEventListener("click", () => {
      armorCodeState.selectedEffects.splice(index, 1);
      armorCodeRenderSelectedEffects();
    });
    armorCodeRefs.selectedEffects.appendChild(row);
  });
}

function armorCodeEffectValue(effect, rawValue) {
  if (!effect || !effect.requiresValue) return "";
  if (effect.valueKind === "percent") {
    const number = Number(rawValue ?? effect.defaultValue ?? 0);
    return Number.isFinite(number) ? String(number) : "0";
  }
  const number = Math.round(Number(rawValue ?? effect.defaultValue ?? 0));
  return Number.isFinite(number) ? String(number) : "0";
}

function armorCodeApplyEffectTokens(code, activeFlag, value) {
  return String(code || "")
    .replaceAll("{ActiveFlag}", activeFlag)
    .replaceAll("{Value}", value)
    .replaceAll("MelanthaSetActive", activeFlag)
    .replaceAll("UtageSetActive", activeFlag);
}

function armorCodeArmorIngredientLines(part) {
  const selectedMaterials = armorCodeState.recipeMaterials[part.key] || [];
  if (!selectedMaterials.length) return "";
  const lines = [];
  selectedMaterials.forEach((entry) => {
    lines.push(`.AddIngredient(ModContent.ItemType<${entry.en}>(), ${entry.count})`);
  });
  return lines.map((line) => `\t\t\t${line}`).join("\n");
}

function armorCodeArmorPartCode(part) {
  const className = `${armorCodeArmorClassPrefix()}${part.armorClass}`;
  const defense = Math.max(0, parseInt(armorCodeEl(`${part.key}Defense`).value || "0", 10));
  const life = Math.max(0, parseInt(armorCodeEl(`${part.key}Life`).value || "0", 10));
  const usingMaterial = true;
  const usingTerrariaId = part.key === "head";
  const recipeLines = armorCodeArmorIngredientLines(part);
  const header = [
    usingMaterial ? "using ArknightsMod.Content.Items.Material;" : "",
    `using ${armorCodeNamespaceBase()};`,
    "using ArknightsMod.Content.Tiles.Infrastructure;",
    "using Terraria;",
    usingTerrariaId ? "using Terraria.ID;" : "",
    "using Terraria.ModLoader;"
  ].filter(Boolean).join("\n");
  const armorSetBlock = part.key === "head" ? `
\t\tpublic override bool IsArmorSet(Item head, Item body, Item legs) {
\t\t\treturn body.type == ModContent.ItemType<${armorCodeArmorClassPrefix()}Body>() &&
\t\t\t\tlegs.type == ModContent.ItemType<${armorCodeArmorClassPrefix()}Legs>();
\t\t}
\t\tpublic override void UpdateArmorSet(Player player) {
\t\t\tplayer.setBonus = "";
\t\t\tplayer.GetModPlayer<${armorCodeOperatorClassBase()}SetPlayer>().${armorCodeOperatorClassBase()}SetActive = true;
\t\t}
` : "";
  return `${header}

namespace ${armorCodeArmorNamespace()}
{
\t[AutoloadEquip(EquipType.${part.armorClass})]
\tpublic class ${className} : ${part.baseClass}
\t{
\t\tpublic override int Rarity => ${armorCodeRarity()};
\t\tpublic override void SetArmorDefaults() {
\t\t\tItem.defense = ${defense};
\t\t}
${part.key === "head" ? "\t\tpublic override int LifeBonus => " + life + ";\n" : "\t\tpublic override int LifeBonus => " + life + ";\n"}${armorSetBlock}${recipeLines ? `\t\tpublic override void AddRecipes() {
\t\t\tCreateRecipe()
\n${recipeLines}
\t\t\t.AddTile(ModContent.TileType<FactoryTile>())
\t\t\t.Register();
\t\t}
\n` : ""}
\t}
}
`;
}

function armorCodeSetPlayerCode() {
  const selected = armorCodeState.selectedEffects.map((entry) => {
    const effect = armorCodeState.effects.find((item) => item.id === entry.id);
    if (!effect) return null;
    return { effect, value: armorCodeEffectValue(effect, entry.value) };
  }).filter(Boolean);
  const activeFlag = `${armorCodeOperatorClassBase()}SetActive`;
  const groups = new Map();

  selected.forEach(({ effect, value }) => {
    if (effect.code) {
      const code = armorCodeApplyEffectTokens(effect.code, activeFlag, value);
      groups.set(`__full__${effect.id}`, code);
      return;
    }
    const signature = effect.methodSignature || "";
    const body = armorCodeApplyEffectTokens(effect.methodBody || "", activeFlag, value);
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(body);
  });

  const methods = [];
  groups.forEach((value, key) => {
    if (key.startsWith("__full__")) {
      methods.push(value);
      return;
    }
    methods.push(`${key} {\n${value.map((block) => block.split("\n").map((line) => `\t\t${line}`).join("\n")).join("\n\n")}\n\t\t}`);
  });

  return `using Terraria;
using Terraria.ModLoader;

namespace ${armorCodeArmorNamespace()}
{
\tinternal class ${armorCodeOperatorClassBase()}SetPlayer : ArknightsArmorPlayer
\t{
\t\tpublic bool ${activeFlag};

\t\tpublic override void ResetEffects() {
\t\t\t${activeFlag} = false;
\t\t}
${methods.length ? methods.map((method) => `\t\t${method.replace(/\n/g, "\n\t\t")}`).join("\n\n").replace(/\t\t\t#region/g, "\t\t#region").replace(/\t\t\t#endregion/g, "\t\t#endregion") : ""}
\t}
}
`;
}

function armorCodeVanityPartCode(part) {
  return `using Terraria.ModLoader;

namespace ${armorCodeNamespaceBase()}
{
\t[AutoloadEquip(EquipType.${part.armorClass})]
\tpublic class ${armorCodeOperatorClassBase()}${part.armorClass} : ${part.vanityBase}
\t{
\t\tpublic override int Rarity => ${armorCodeRarity()};
\t}
}
`;
}

function armorCodeVanityBagCode() {
  return `using ${armorCodeNamespaceBase()};
using System.Collections.Generic;
using Terraria.ModLoader;

namespace ArknightsMod.Content.Items.Consumables.VanityBags
{
\tpublic class ${armorCodeOperatorClassBase()}Default : ArknightsVanityBag
\t{
\t\tprotected override List<int> GetItems() {
\t\t\treturn
\t\t\t[
\t\t\tModContent.ItemType<${armorCodeOperatorClassBase()}Head>(),
\t\t\tModContent.ItemType<${armorCodeOperatorClassBase()}Body>(),
\t\t\tModContent.ItemType<${armorCodeOperatorClassBase()}Legs>()
\t\t];
\t\t}
\t}
}
`;
}

function armorCodeValidateBaseInput() {
  const entered = armorCodeTrim(armorCodeRefs.operatorInput.value);
  if (!entered) {
    throw new Error("请输入干员中文名，或可以转成 C# 类名的英文名。");
  }
  const mapped = armorCodeOperatorClassBase();
  if (!mapped) {
    throw new Error("当前输入无法映射出有效的英文类名。");
  }
}

async function armorCodeReadRootArmorPngFiles() {
  const handle = armorCodeState.selectedSourceHandle;
  if (!handle) return [];
  const files = [];
  for await (const entry of handle.values()) {
    if (entry.kind !== "file" || !entry.name.toLowerCase().endsWith(".png")) continue;
    const file = await entry.getFile();
    const targetName = entry.name.startsWith("Armor") ? entry.name : `Armor${entry.name}`;
    files.push({
      name: targetName,
      binary: await file.arrayBuffer(),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/Armor/${targetName}`
    });
  }
  return files;
}

function armorCodeVanityFileMap() {
  const files = armorCodeState.vanityFiles || [];
  const matched = {};
  const extras = [];
  const lowerMap = new Map();

  files.forEach((file) => {
    lowerMap.set(file.name.toLowerCase(), file);
  });

  ARMOR_CODE_PARTS.forEach((part) => {
    matched[part.key] = {
      item: files.find((file) => file.name.toLowerCase().endsWith(part.itemSuffix.toLowerCase())) || null,
      split: files.find((file) => file.name.toLowerCase().endsWith(part.splitSuffix.toLowerCase())) || null
    };
  });

  const used = new Set();
  Object.values(matched).forEach((pair) => {
    if (pair.item) used.add(pair.item.name);
    if (pair.split) used.add(pair.split.name);
  });

  let original = null;
  const originalPrefix = armorCodeTrim(armorCodeRefs.operatorInput.value);
  if (originalPrefix) {
    const exact = lowerMap.get(`${originalPrefix}原图.png`.toLowerCase());
    if (exact) {
      original = exact;
      used.add(exact.name);
    }
  }

  files.forEach((file) => {
    if (!used.has(file.name)) extras.push(file);
  });

  return { matched, original, extras };
}

async function armorCodeBuildArmorFiles() {
  armorCodeValidateBaseInput();
  const files = [
    {
      name: `Armor${armorCodeOperatorClassBase()}Head.cs`,
      content: armorCodeArmorPartCode(ARMOR_CODE_PARTS[0]),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/Armor/Armor${armorCodeOperatorClassBase()}Head.cs`
    },
    {
      name: `Armor${armorCodeOperatorClassBase()}Body.cs`,
      content: armorCodeArmorPartCode(ARMOR_CODE_PARTS[1]),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/Armor/Armor${armorCodeOperatorClassBase()}Body.cs`
    },
    {
      name: `Armor${armorCodeOperatorClassBase()}Legs.cs`,
      content: armorCodeArmorPartCode(ARMOR_CODE_PARTS[2]),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/Armor/Armor${armorCodeOperatorClassBase()}Legs.cs`
    },
    {
      name: `${armorCodeOperatorClassBase()}SetPlayer.cs`,
      content: armorCodeSetPlayerCode(),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/Armor/${armorCodeOperatorClassBase()}SetPlayer.cs`
    }
  ];
  const pngFiles = await armorCodeReadRootArmorPngFiles();
  return files.concat(pngFiles);
}

async function armorCodeBuildVanityFiles() {
  armorCodeValidateBaseInput();
  const { matched, original, extras } = armorCodeVanityFileMap();
  ARMOR_CODE_PARTS.forEach((part) => {
    if (!matched[part.key].item || !matched[part.key].split) {
      throw new Error(`时装素材不完整，缺少 ${part.label} 的物品图或拆分图。`);
    }
  });

  const files = [
    {
      name: `${armorCodeOperatorClassBase()}Head.cs`,
      content: armorCodeVanityPartCode(ARMOR_CODE_PARTS[0]),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/${armorCodeOperatorClassBase()}Head.cs`
    },
    {
      name: `${armorCodeOperatorClassBase()}Body.cs`,
      content: armorCodeVanityPartCode(ARMOR_CODE_PARTS[1]),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/${armorCodeOperatorClassBase()}Body.cs`
    },
    {
      name: `${armorCodeOperatorClassBase()}Legs.cs`,
      content: armorCodeVanityPartCode(ARMOR_CODE_PARTS[2]),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/${armorCodeOperatorClassBase()}Legs.cs`
    }
  ];

  for (const part of ARMOR_CODE_PARTS) {
    const pair = matched[part.key];
    files.push({
      name: `${armorCodeOperatorClassBase()}${part.outItem}`,
      binary: await pair.item.arrayBuffer(),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/${armorCodeOperatorClassBase()}${part.outItem}`
    });
    files.push({
      name: `${armorCodeOperatorClassBase()}${part.outSplit}`,
      binary: await pair.split.arrayBuffer(),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/${armorCodeOperatorClassBase()}${part.outSplit}`
    });
  }

  let extraIndex = 1;
  for (const extra of extras) {
    files.push({
      name: `${armorCodeOperatorClassBase()}_${extraIndex}.png`,
      binary: await extra.arrayBuffer(),
      relativePath: `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/${armorCodeOperatorClassBase()}_${extraIndex}.png`
    });
    extraIndex += 1;
  }

  if (original) {
    files.push({
      name: `${armorCodeOperatorClassBase()}Default.cs`,
      content: armorCodeVanityBagCode(),
      relativePath: `Content/Items/Consumables/VanityBags/${armorCodeOperatorClassBase()}Default.cs`
    });
    files.push({
      name: `${armorCodeOperatorClassBase()}Default.png`,
      binary: await original.arrayBuffer(),
      relativePath: `Content/Items/Consumables/VanityBags/${armorCodeOperatorClassBase()}Default.png`
    });
  }

  return files;
}

function armorCodeBuildSummary() {
  armorCodeRefs.exportSummary.innerHTML = "";
  const armorCopiedPngCount = armorCodeIsArmorMode()
    ? armorCodeState.generatedFiles.filter((file) => file.binary && /\/Armor\/Armor.*\.png$/i.test(file.relativePath || "")).length
    : 0;
  const info = {
    模式: armorCodeIsArmorMode() ? "盔甲" : "时装",
    职业: armorCodeSelectedProfession(),
    英文名: armorCodeOperatorClassBase(),
    文件数: String(armorCodeState.generatedFiles.length),
    复制贴图: armorCodeIsArmorMode()
      ? (armorCopiedPngCount ? `已附带 ${armorCopiedPngCount} 个源目录 PNG` : "未附带源目录 PNG")
      : `${armorCodeState.vanityFiles.length} 个素材文件`,
    输出目录: armorCodeIsArmorMode()
      ? `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}/Armor`
      : `Content/Items/Armor/Vanity/${armorCodeSelectedProfession()}/${armorCodeOperatorClassBase()}`
  };
  Object.entries(info).forEach(([key, value]) => {
    const left = document.createElement("div");
    const right = document.createElement("div");
    left.textContent = key;
    right.textContent = value;
    armorCodeRefs.exportSummary.appendChild(left);
    armorCodeRefs.exportSummary.appendChild(right);
  });
}

function armorCodeRenderGeneratedFiles() {
  armorCodeRefs.fileSelect.innerHTML = "";
  armorCodeState.generatedFiles.forEach((file, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = file.relativePath || file.name;
    armorCodeRefs.fileSelect.appendChild(option);
  });
  const hasFiles = armorCodeState.generatedFiles.length > 0;
  armorCodeRefs.downloadZipBtn.disabled = !hasFiles;
  armorCodeRefs.copyCurrentBtn.disabled = !hasFiles;
  armorCodeRefs.writeFilesBtn.disabled = !hasFiles || !armorCodeState.selectedSourceHandle;
  if (hasFiles) armorCodeShowGeneratedFile(0);
  else armorCodeRefs.outputCode.textContent = "";
}

function armorCodeShowGeneratedFile(index) {
  const file = armorCodeState.generatedFiles[index];
  if (!file) return;
  armorCodeRefs.fileSelect.value = String(index);
  armorCodeRefs.outputCode.textContent = file.content || `[二进制文件]\n${file.relativePath || file.name}`;
}

async function armorCodeDownloadZip() {
  if (!armorCodeState.generatedFiles.length || typeof JSZip === "undefined") return;
  const zip = new JSZip();
  armorCodeState.generatedFiles.forEach((file) => {
    if (file.binary) zip.file(file.relativePath || file.name, file.binary);
    else zip.file(file.relativePath || file.name, file.content || "");
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${armorCodeOperatorClassBase()}_${armorCodeMode()}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function armorCodeCopyCurrent() {
  const index = parseInt(armorCodeRefs.fileSelect.value || "0", 10);
  const file = armorCodeState.generatedFiles[index];
  if (!file || !file.content) return;
  await navigator.clipboard.writeText(file.content);
  armorCodeSetStatus(`已复制 ${file.name}`);
}

async function armorCodePickSourceDir() {
  if (typeof window.showDirectoryPicker !== "function") {
    armorCodeSetStatus("当前浏览器不支持目录选择，只能下载 ZIP。");
    return;
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  armorCodeState.selectedSourceHandle = handle;
  armorCodeState.selectedSourceName = handle.name || "";
  armorCodeRefs.sourceDirDisplay.value = handle.name || "";
  armorCodeRefs.writeFilesBtn.disabled = !armorCodeState.generatedFiles.length;
  if (handle.name !== "ArknightsMod") {
    armorCodeRefs.sourceDirHint.textContent = "已选择目录，但它不是 ArknightsMod。写入前请再次确认。";
  } else {
    armorCodeRefs.sourceDirHint.textContent = "已选择 ArknightsMod，可直接写入生成结果。";
  }
}

async function armorCodeEnsurePath(rootHandle, parts) {
  let handle = rootHandle;
  for (const part of parts) {
    handle = await handle.getDirectoryHandle(part, { create: true });
  }
  return handle;
}

async function armorCodeWriteFiles() {
  if (!armorCodeState.selectedSourceHandle) {
    armorCodeSetStatus("请先选择模组源文件夹。");
    return;
  }
  for (const file of armorCodeState.generatedFiles) {
    const parts = (file.relativePath || file.name).split("/");
    const fileName = parts.pop();
    const dirHandle = await armorCodeEnsurePath(armorCodeState.selectedSourceHandle, parts);
    const writable = await (await dirHandle.getFileHandle(fileName, { create: true })).createWritable();
    if (file.binary) await writable.write(file.binary);
    else await writable.write(file.content || "");
    await writable.close();
  }
  armorCodeSetStatus("文件已写入所选目录。");
}

async function armorCodeGenerate() {
  try {
    armorCodeSetStatus("正在生成...");
    const files = armorCodeIsArmorMode() ? await armorCodeBuildArmorFiles() : await armorCodeBuildVanityFiles();
    armorCodeState.generatedFiles = files;
    armorCodeBuildSummary();
    armorCodeRenderGeneratedFiles();
    armorCodeSetStatus([
      `已生成 ${files.length} 个文件。`,
      armorCodeIsArmorMode()
        ? `模板已按桌面版的命名空间、Armor 前缀、FactoryTile 配方与 SetPlayer 结构输出${armorCodeState.selectedSourceHandle ? "，并会附带复制所选 ArknightsMod 根目录里的 PNG。" : "。如需附带复制 PNG，请先选择 ArknightsMod 目录。" }`
        : "时装代码、PNG 重命名结果与 VanityBag 已按桌面版规则输出。"
    ]);
  } catch (error) {
    armorCodeSetStatus(`生成失败：${error && error.message ? error.message : error}`);
  }
}

async function armorCodeLoadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return await res.json();
}

function armorCodeInitEvents() {
  document.querySelectorAll('input[name="armorCodegenMode"]').forEach((radio) => {
    radio.addEventListener("change", armorCodeApplyModeUI);
  });
  armorCodeRefs.operatorPickerToggle.addEventListener("click", () => {
    if (armorCodeOperatorUX.open) armorCodeCloseOperatorPicker();
    else armorCodeOpenOperatorPicker();
  });
  armorCodeRefs.operatorPickerSearch.addEventListener("input", () => {
    armorCodeRenderOperatorPicker(armorCodeRefs.operatorPickerSearch.value || "");
  });
  armorCodeRefs.operatorPickerSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      armorCodeCloseOperatorPicker();
      armorCodeRefs.operatorPickerToggle.focus();
    }
  });
  if (!armorCodeOperatorUX.docBound) {
    document.addEventListener("click", (event) => {
      if (!armorCodeOperatorUX.open) return;
      const target = event.target;
      if (
        target instanceof Node
        && !armorCodeRefs.operatorPickerPanel.contains(target)
        && !armorCodeRefs.operatorPickerToggle.contains(target)
      ) {
        armorCodeCloseOperatorPicker();
      }
    });
    armorCodeOperatorUX.docBound = true;
  }
  armorCodeRefs.addEffectBtn.addEventListener("click", () => {
    const id = armorCodeRefs.effectSelect.value;
    if (!id || armorCodeState.selectedEffects.some((entry) => entry.id === id)) return;
    const effect = armorCodeState.effects.find((item) => item.id === id);
    armorCodeState.selectedEffects.push({ id, value: effect && effect.defaultValue != null ? effect.defaultValue : "" });
    armorCodeRenderSelectedEffects();
  });
  armorCodeRefs.generateBtn.addEventListener("click", armorCodeGenerate);
  armorCodeRefs.downloadZipBtn.addEventListener("click", armorCodeDownloadZip);
  armorCodeRefs.copyCurrentBtn.addEventListener("click", armorCodeCopyCurrent);
  armorCodeRefs.fileSelect.addEventListener("change", () => armorCodeShowGeneratedFile(parseInt(armorCodeRefs.fileSelect.value || "0", 10)));
  armorCodeRefs.pickSourceDirBtn.addEventListener("click", armorCodePickSourceDir);
  armorCodeRefs.writeFilesBtn.addEventListener("click", armorCodeWriteFiles);
  armorCodeRefs.pickVanityFilesBtn.addEventListener("click", () => armorCodeRefs.vanityFileInput.click());
  armorCodeRefs.vanityFileInput.addEventListener("change", () => {
    armorCodeState.vanityFiles = Array.from(armorCodeRefs.vanityFileInput.files || []);
    const first = armorCodeState.vanityFiles[0];
    const folderName = first && first.webkitRelativePath ? first.webkitRelativePath.split("/")[0] : "";
    armorCodeRefs.vanitySelectionTitle.textContent = folderName
      ? `已选择素材文件夹：${folderName}`
      : (armorCodeState.vanityFiles.length ? "已选择时装素材文件夹" : "尚未选择时装素材文件夹");
    armorCodeRefs.vanitySelectionSub.textContent = armorCodeState.vanityFiles.length
      ? `已读取 ${armorCodeState.vanityFiles.length} 个 PNG/素材文件，生成时会自动匹配部位图并保留额外 PNG。`
      : "选择后会读取头部、身体、腿部的物品图与拆分图，并保留额外 PNG。";
    armorCodeRefs.vanitySelectionCount.textContent = `${armorCodeState.vanityFiles.length} PNG`;
    armorCodeRefs.vanityFileHint.textContent = armorCodeState.vanityFiles.length
      ? `已选择 ${armorCodeState.vanityFiles.length} 个 PNG 文件。`
      : "按桌面版规则读取 `_Head_item`、`_Head`、`_Body_item`、`_Body1.4`、`_Legs_item`、`_Legs` 这些 PNG。";
  });
}

async function armorCodeBoot() {
  armorCodeBuildSelectors();
  armorCodeBuildPartConfig();
  armorCodeRenderMaterialSections();
  armorCodeInitEvents();
  try {
    const [materials, effects, operatorList] = await Promise.all([
      armorCodeLoadJson("/trtools/data/armor-code-generator/materials.json"),
      armorCodeLoadJson("/trtools/data/armor-code-generator/ArmorSetEffects.json"),
      armorCodeLoadJson("/trtools/data/armor-code-generator/operators.json")
    ]);
    armorCodeState.materials = materials || [];
    armorCodeState.effects = effects || [];
    armorCodeState.operatorList = Array.isArray(operatorList) ? operatorList : [];
    armorCodeState.operators = armorCodeState.operatorList.reduce((acc, entry) => {
      if (entry && entry.cn && entry.en) acc[entry.cn] = entry.en;
      return acc;
    }, {});
    armorCodeRenderEffectSelect();
    armorCodeRenderSelectedEffects();
    armorCodeRefs.operatorInput.value = armorCodeState.operators["阿米娅"] ? "阿米娅" : "Amiya";
    const defaultEntry = armorCodeFindOperatorEntry(armorCodeRefs.operatorInput.value);
    if (defaultEntry && defaultEntry.profession) armorCodeRefs.professionSelect.value = defaultEntry.profession;
    armorCodeSyncOperatorPreview();
    armorCodeApplyModeUI();
    armorCodeSetStatus("数据加载完成。");
  } catch (error) {
    armorCodeApplyModeUI();
    armorCodeSetStatus(`加载失败：${error && error.message ? error.message : error}`);
  }
}

armorCodeBoot();
