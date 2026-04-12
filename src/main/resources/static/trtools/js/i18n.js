/**
 * tModWebTools 站点文案：localStorage trtools.lang = zh-CN | en | es（西语词条见 i18n-es.js，先于本文件加载）
 * 主题：trtools.theme = emerald|ocean|violet|amber|rose|teal（由设置页写入，head 内联脚本抢先读）
 */
(function () {
  "use strict";

  var LANG_KEY = "trtools.lang";
  var THEME_KEY = "trtools.theme";

  var ZH = {
    "loading.text": "加载中…",
    "meta.titleHome": "tModWebTools - 尊重每一位开发者的意愿 - Mornia-Cherry",
    "meta.titleStats": "访问统计 — tModWebTools",
    "meta.titleSettings": "设置 — tModWebTools",
    "meta.titleTerrasavr": "tModWebTools - Terrasavr 存档编辑器",
    "meta.titleTmodUnpacker": "tModUnpacker — tModWebTools",
    "meta.titleSprite": "躯干格式转换 — tModWebTools",
    "meta.titleTexture": "物块生成器 — tModWebTools",
    "meta.titleArmor": "装备帧生成器 — tModWebTools",
    "meta.titleOgg": "OGG 转换 — tModWebTools",
    "brand.short": "tModWebTools - TWT",
    "nav.aria": "工具导航",
    "nav.tilesheet": "切片图工具",
    "nav.armor": "装备帧生成器",
    "nav.sprite": "躯干格式转换器",
    "nav.ogg": "OGG 转换",
    "nav.texture": "物块生成器",
    "nav.tmod": ".tMod 文件解包",
    "nav.terrasavr": "角色存档编辑器",
    "footer.settings": "设置",
    "footer.stats": "访问统计",
    "sidebar.collapse": "收起侧边栏",
    "sidebar.expand": "展开侧边栏",
    "toTop": "回到顶部",
    "online.prefix": "当前在线",
    "online.suffix": "人",
    "online.tooltipIndex": "在线人数需通过本地服务端统计；file:// 打开无法统计",
    "online.tooltipDefault": "在线人数需部署 /count 接口",
    "online.tooltipArmor": "在线人数需要通过服务端 /events 接口统计。",
    "footer.credit": "tModLoader ArknightsMod - Mornia-Cherry",
    "footer.contact": "联系我",
    "footer.bug": "BUG反馈",
    "footer.bilibili": "哔哩哔哩",
    "stats.h1": "访问统计",
    "stats.sub": "今日按小时的独立访客折线图",
    "stats.section": "今日各小时独立访客",
    "stats.note": "说明：数据保存在服务端内存，进程重启后清零；反代后 IP 以 X-Forwarded-For 为准。",
    "stats.chartAria": "今日访问折线图",
    "stats.metaDay": "统计日",
    "stats.metaTz": "时区",
    "stats.loadFail": "加载失败：",
    "stats.dataset": "独立访客（人/小时）",
    "settings.h1": "设置",
    "settings.sub": "语言与主题仅保存在本机浏览器。",
    "settings.langTitle": "界面语言",
    "settings.langZh": "简体中文",
    "settings.langEn": "English",
    "settings.langEs": "Español",
    "settings.themeTitle": "主题色",
    "settings.themeEmerald": "翠绿",
    "settings.themeOcean": "海蓝",
    "settings.themeViolet": "紫罗兰",
    "settings.themeAmber": "琥珀",
    "settings.themeRose": "玫红",
    "settings.themeTeal": "青绿",
    "settings.aboutTitle": "关于本站",
    "settings.aboutBody":
      "本站工具集 tModWebTools（TWT）由 Mornia-Cherry 主要维护，面向 tModLoader / Terraria 资源与模组工作流程。若发现文案或翻译问题，欢迎反馈。",
    "settings.authorLine": "维护：Mornia-Cherry",
    "tsheet.h1": "Tilesheet 切片图工具 v26.5.0",
    "tsheet.tabBuild": "切片图",
    "tsheet.tabStitch": "切片图还原",
    "tsheet.tabGif2": "GIF转精灵图",
    "tsheet.tabSheet2": "精灵图转GIF",
    "tsheet.tabCompose": "单帧拼精灵图",
    "tsheet.tabSplit": "精灵分解帧",
    "tsheet.input": "输入",
    "tsheet.dropMain": "拖拽图片到这里",
    "tsheet.dropHint": "或点击选择。支持多张图片（按顺序作为动画帧）",
    "tsheet.pick": "选择图片",
    "tsheet.clear": "清空",
    "tsheet.params": "参数",
    "tsheet.lblTile": "tile 大小",
    "tsheet.lblGap": "gap",
    "tsheet.lblMargin": "留白（px）",
    "tsheet.helpMarginTitle":
      "在生成规则切片图（pad、取样、gap 铺排）之后，再向外扩透明边；填几即几像素（与 tile 无关）。左上补齐（物块）：加在右侧与下方；居中补齐：四边；水平居中+居下：左、右、上三侧。仅当补齐方式为「左上补齐（物块）」时可编辑；其他模式忽略（输入框禁用）。",
    "tsheet.helpMarginAria": "留白说明",
    "tsheet.lblStride": "源图格间距",
    "tsheet.helpStrideTitle":
      "（已不在界面配置；buildGapImage 仍保留 strideInPx 参数。生成时固定按 tile 步进取样。）",
    "tsheet.helpStrideAria": "源图格间距说明",
    "tsheet.mergeMulti": "多图时先纵向合并为一条再处理",
    "tsheet.cropTransparent": "裁剪透明外边框（推荐）",
    "tsheet.cropHint": "自动裁掉每帧四周全透明边距",
    "tsheet.padRight": "扩展右侧（tile）",
    "tsheet.padBottom": "扩展底部（tile）",
    "tsheet.padMode": "补齐方式",
    "tsheet.padTopLeft": "左上补齐（物块）",
    "tsheet.padCenter": "居中补齐",
    "tsheet.padCenterBottom": "水平居中 + 居下",
    "tsheet.outName": "输出文件名",
    "tsheet.cols": "期望 cols（可选）",
    "tsheet.rows": "期望 rows（可选）",
    "tsheet.preview": "生成预览",
    "tsheet.downloadPng": "下载 PNG",
    "tsheet.busy": "处理中…",
    "tsheet.stitchTitle": "切片图还原（去间隙）",
    "tsheet.stitchHint": "按透明像素识别间隙列/行并移除",
    "tsheet.alphaStitch": "空白判定 Alpha 阈值",
    "tsheet.minSeam": "最小间隙宽度",
    "tsheet.runStitch": "开始还原",
    "tsheet.splitTitle": "精灵分解帧（ZIP）",
    "tsheet.splitMode": "切分方式",
    "tsheet.splitModeSeam": "按透明缝（原有）",
    "tsheet.splitModeGrid": "固定网格（Terraria 物块图）",
    "tsheet.splitStrideW": "格间距 宽（px）",
    "tsheet.splitStrideH": "格间距 高（px）",
    "tsheet.splitCropW": "取样宽（px）",
    "tsheet.splitCropH": "取样高（px）",
    "tsheet.splitGridFull": "输出整格（取样 = 格间距，一般为 18×18）",
    "tsheet.splitGridHint":
      "从左到右、从上到下按格切出；适用于原版式物块贴图（每格右侧与下方各有 1px 间隔带）。",
    "tsheet.splitAxis": "切分方向",
    "tsheet.splitAxisX": "横向（按透明竖缝切分）",
    "tsheet.splitAxisY": "纵向（按透明横缝切分）",
    "tsheet.splitCrop": "切分后裁剪透明外边框",
    "tsheet.splitZip": "打包为 ZIP",
    "tsheet.runSplit": "开始切分并下载",
    "tsheet.composeTitle": "单帧拼精灵图",
    "tsheet.composeGap": "图片间距（px）",
    "tsheet.runCompose": "开始拼接",
    "tsheet.gif2Title": "GIF转精灵图",
    "tsheet.gif2Hint":
      "与「单帧拼精灵图」相同排布：各帧统一画布宽度、竖向堆叠。需浏览器支持 <code>ImageDecoder</code>（推荐 Chrome / Edge）。",
    "tsheet.frameGap": "帧间距（px）",
    "tsheet.gif2Run": "解码并生成预览",
    "tsheet.sheet2Title": "精灵图转GIF",
    "tsheet.sheet2Hint":
      "适用于「单帧拼精灵图」或本页「GIF转精灵图」生成的竖条：各帧等高、中间为透明或纯色间隙。输出 GIF 需联网加载 <code>gifenc</code> 编码库（约数 KB）。",
    "tsheet.frameH": "每帧高度（px）",
    "tsheet.frameCount": "帧数（0=自动）",
    "tsheet.delayMs": "每帧延时（ms）",
    "tsheet.sheet2Run": "生成并下载 GIF",
    "tsheet.outPreview": "输出预览",
    "tsheet.previewGrid": "显示像素窗格（预览）",
    "ogg.warnFile": "当前为本地文件（file://）打开。浏览器无法正确加载 FFmpeg 的模块与 Worker。请使用本地 HTTP 服务（如 VS Code Live Server、npx serve .）或宝塔站点，以 http:// 或 https:// 访问本目录下的页面。",
    "ogg.warnHtml":
      "<strong>当前为本地文件（file://）打开。</strong>浏览器无法正确加载 FFmpeg 的模块与 Worker。请使用本地 HTTP 服务（如 VS Code Live Server、<code>npx serve .</code>）或宝塔站点，以 <code>http://</code> 或 <code>https://</code> 访问本目录下的页面。",
    "ogg.h1": "tModLoader OGG转换工具 v26.4.1",
    "ogg.intro":
      "将常见音频转为 Terraria / tModLoader 常用格式：<strong>Ogg 容器 + Vorbis</strong>，44.1kHz，立体声，质量约 128–160 kbps；可选剥离元数据。",
    "ogg.inTitle": "输入音频",
    "ogg.dropMain": "拖拽文件到这里",
    "ogg.dropHint": "支持 MP3、WMA、M4A、FLAC、WAV、OGG（含非 Vorbis 的 Ogg）等",
    "ogg.pickFile": "选择文件",
    "ogg.clear": "清空",
    "ogg.none": "未选择文件",
    "ogg.optTitle": "选项",
    "ogg.stripMeta": "剥离元数据（<code>-map_metadata -1</code>，减少 tModLoader 对非标准标签的报错）",
    "ogg.encHint": "编码参数：<code>libvorbis</code> · 44100 Hz · 2 声道 · <code>-qscale:a 5</code>",
    "ogg.preload": "预载 FFmpeg 核心",
    "ogg.convert": "开始转换",
    "ogg.zip": "打包 ZIP",
    "ogg.helpTitle": "说明",
    "ogg.help1": "在浏览器内通过 <strong>ffmpeg.wasm</strong> 转换，<strong>首次</strong>需下载约 30MB 核心，请稍候。",
    "ogg.help2": "扩展名为 <code>.ogg</code> 但使用 <strong>Opus</strong> 等编码时，Terraria 会报错；本工具会统一重编码为 <strong>Vorbis</strong>。",
    "ogg.help3": "若某格式解码失败，多为当前 WASM 构建未包含对应解码器，可先用桌面版 FFmpeg 转 WAV 再试。",
    "ogg.logTitle": "FFmpeg 日志",
    "armor.h1": "ArmorHelper v1.0",
    "armor.intro": "输入模板必须是 128×80。输出为 20×560 后再 2x 放大到 40×1120。",
    "armor.inTitle": "输入模板",
    "armor.dropMain": "拖拽图片到这里",
    "armor.dropHint": "或点击选择。支持多文件批量导出",
    "armor.pick": "选择图片",
    "armor.clear": "清空",
    "armor.none": "未选择文件",
    "armor.exportOpts": "导出选项",
    "armor.zipDl": "打包 ZIP 下载",
    "armor.export": "导出",
    "armor.previewBtn": "预览",
    "armor.previewTitle": "预览",
    "armor.inTpl": "输入模板",
    "armor.outPrev": "输出预览",
    "armor.modeHead": "头部 (Head)",
    "armor.modeBody": "身体 (Body)",
    "armor.modeFemale": "身体-女 (Body Female)",
    "armor.modeLegs": "腿部 (Legs)",
    "armor.modeArms": "手臂 (Arms)",
    "armor.modeFull": "完整套装 (Full Armor)",
    "armor.modeFullF": "完整套装-女 (Full Armor Female)",
    "armor.modeGifFull": "完整套装GIF (GIF Full Armor)",
    "armor.modeGifFullF": "完整套装GIF-女 (GIF Full Armor Female)",
    "st.h1": "SpriteTransform v1.6.6",
    "st.intro":
      "将原版 <strong>40×1120</strong> 身体 / 手臂 / 女性身体贴图拼为一张 <strong>360×224</strong> 精灵表（与 Java 版 Terraria Sprite Transformer 一致）。",
    "st.inPng": "输入 PNG",
    "st.lblBody": "身体贴图（40×1120）",
    "st.lblArm": "手臂贴图（40×1120）",
    "st.lblFemale": "女性身体贴图（40×1120）",
    "st.sameBody": "女性身体贴图与身体贴图使用同一文件",
    "st.out": "输出",
    "st.transform": "转换",
    "st.download": "下载 PNG",
    "st.previewTitle": "预览（360×224）",
    "st.previewHint": "输出与原版工具相同；请先选择三张 40×1120 PNG（女性可与 Body 相同）。",
    "st.browse": "浏览",
    "st.phNone": "未选择文件",
    "st.footerCredit":
      "创意与工具来自 Pyromma 的 <a href=\"https://forums.terraria.org/index.php?threads/sprite-transformer-quickly-transform-body-sprite-sheets-from-1-3-to-1-4.96210/\" target=\"_blank\" rel=\"noopener noreferrer\">Sprite Transformer</a>（Terraria 论坛：1.3 转 1.4 身体精灵表）。",
    "tex.h1": "TextureSplitter v2.6",
    "tex.intro":
      "将 <strong>74×74</strong> 物块或 <strong>106×106</strong> 墙壁精灵展开为 Terraria / tModLoader 使用的贴图；程序代码出自叶子的物块生成器。",
    "tex.inPng": "输入 PNG",
    "tex.dropMain": "拖拽图片到这里",
    "tex.dropHint": "或点击选择。需为 <strong>74×74</strong>（物块）或 <strong>106×106</strong>（墙壁）",
    "tex.pick": "选择图片",
    "tex.modeTitle": "物块衔接模式",
    "tex.modeOnly74": "仅 74×74 物块需要选择（与原版程序输入数字对应）",
    "tex.gen": "生成贴图",
    "tex.download": "下载 PNG",
    "tex.sampleTitle": "示例（点击图像可加载示例）",
    "tex.tileLabel": "物块 74×74",
    "tex.wallLabel": "墙壁 106×106",
    "tex.tileTitle": "点击加载物块示例",
    "tex.wallTitle": "点击加载墙壁示例",
    "tex.previewTitle": "预览",
    "tex.outHint": "输出文件名默认为 <code>原名_Output.png</code>。墙壁贴图固定输出 468×180。",
    "tex.richAria": "物块衔接模式（带图标）",
    "tex.listAria": "物块衔接模式选项",
    "tex.mode0": "不与其他物块衔接（输出 234×90）",
    "tex.modeNeg1": "自定义衔接样式，不叠加材质（输出 288×270）",
    "tex.mode1": " — 土块（288×270 + 叠加）",
    "tex.mode2": " — 石块（288×270 + 叠加）",
    "tex.mode3": " — 泥块（288×270 + 叠加）",
    "tex.mode4": " — 雪块（288×270 + 叠加）",
    "tex.mode5": " — 树叶块（288×270 + 叠加）",
    "tex.mode6": " — 云（288×270 + 叠加）",
    "tex.mode7": " — 沙块（288×270 + 叠加）",
    "tex.mode8": " — 猩红沙块（288×270 + 叠加）",
    "tex.mode9": " — 黑檀沙块（288×270 + 叠加）",
    "tex.mode10": " — 珍珠沙块（288×270 + 叠加）",
    "tex.mode11": " — 灰烬块（288×270 + 叠加）",
    "tex.modePlaceholder": "请选择（仅 74×74 可用）",
    "tmu.h1": "tModUnpacker v1.3",
    "tmu.intro": "上传 .tmod 文件，服务端执行解包。",
    "tmu.inTitle": "输入 .tmod",
    "tmu.dropMain": "拖拽 .tmod 到这里",
    "tmu.dropHint": "或点击下方按钮选择文件",
    "tmu.pick": "选择 .tmod",
    "tmu.run": "开始解包",
    "tmu.none": "未选择文件",
    "tmu.saveHint": "保存路径：解包结果将以 ZIP 形式下载到浏览器默认下载目录。",
    "tmu.note": "说明：解包逻辑已内置在服务端，无需额外安装运行库。",
    "tmu.msgTitle": "消息",
    "tmu.origin": "原出处：",
    "tsv.h1": "Terrasavr 角色存档编辑器 v.Jan 28,2026",
    "tsv.hint": "已迁移 Terrasavr 核心功能到本站资源目录；更新兼容游戏版本1.4.5.x。",
    "tsv.iframeTitle": "Terrasavr",
    "tsheet.dropHintGif2": "或点击选择。请选择单个 GIF（按帧拆成与「单帧拼精灵图」相同的竖向精灵图）",
    "tsheet.dropHintSheet2": "或点击选择。请选择单张 PNG 竖向精灵图（各帧等高、固定间距）",
    "tsheet.msgPickFirst": "请先选择至少一张图片。",
    "tsheet.msgGifOnly": "当前模式请选择 GIF 文件。",
    "tsheet.msgPngStrip": "当前模式请选择 PNG 精灵图（竖向条带）。",
    "tsheet.msgDone": "完成：{w}×{h}",
    "tsheet.msgAfSuggest": "AnimationFrameHeight 建议：{n}",
    "tsheet.kvInputFrames": "输入帧数",
    "tsheet.kvTile": "tile",
    "tsheet.kvGap": "gap",
    "tsheet.kvFramePx": "每帧像素",
    "tsheet.kvOutPx": "输出像素",
    "tsheet.msgBuildFail": "生成失败：{e}",
    "tsheet.msgStitchDone": "还原完成：{w}×{h}",
    "tsheet.msgNoSeg": "未检测到可切分片段。",
    "tsheet.msgSplitDone": "切分完成：{n} 张",
    "tsheet.msgGridNoCells": "按当前网格参数切不出任何完整格：请检查宽高、格间距与取样尺寸。",
    "tsheet.msgComposeNeedMerge": "多图垂直拼接需勾选「多图时先纵向合并…」；取消合并时本模式仅支持单张图。",
    "tsheet.msgBuildMerged": "已将 {n} 张图合并为一条后再做切片拼条。",
    "tsheet.msgBuildBatchDl": "已对 {n} 张图分别完成切片拼条并已触发下载（每张对应一个 PNG）；预览为对齐后的纵向堆叠。此模式下「下载 PNG」已关闭，请使用已下载文件。",
    "tsheet.msgComposeDone": "拼接完成：{w}×{h}",
    "tsheet.errNoImageDecoder": "当前浏览器不支持 ImageDecoder API，请使用 Chrome 94+ / Edge 94+ 等浏览器。",
    "tsheet.errGifDecode": "GIF 解码失败：{e}",
    "tsheet.errGifNoFrames": "GIF 未解码出任何帧。",
    "tsheet.errFrameH": "每帧高度无效。",
    "tsheet.errNoFullFrames": "无法切出任何整帧：请检查每帧高度、间距与图片高度是否匹配。",
    "tsheet.errFrameOverflow": "第 {i} 帧超出图片高度（y={y}，图高={H}）。可减少帧数或检查参数。",
    "tsheet.msgNeedPngStrip": "请使用 PNG 精灵图（竖向条带）。",
    "tsheet.msgGifBuilt": "已生成 GIF：{n} 帧，{w}×{h}px，延时 {d}ms/帧",
    "tsheet.msgGifTail": "提示：图底部尚有约 {px}px 未纳入切片，若参数不对请调整帧高或间距。",
    "tsheet.kvFrames": "帧数",
    "tsheet.kvGap": "间距",
    "tsheet.kvSize": "尺寸",
    "tsheet.kvUnusedH": "未用高度",
    "tsheet.kvOut": "输出",
    "tsheet.msgGifFail": "生成 GIF 失败：{e}",
    "tsheet.msgGif2DoneLine1": "完成：{w}×{h}",
    "tsheet.msgGif2DoneLine2": "共 {n} 帧（与「单帧拼精灵图」相同的竖向拼接规则）",
    "tsheet.msgGifProcessFail": "GIF 处理失败：{e}",
    "tsheet.msgNeedGif": "请先选择 GIF 文件。",
    "tsheet.msgUseGif": "请使用 GIF 格式文件。",
    "tsheet.msgNeedPreview": "请先生成预览。",
    "tsheet.msgNeedStitch": "请先还原。",
    "tsheet.msgNeedCompose": "请先拼接。",
    "tex.errRules": "无法加载切片规则",
    "tex.errCanvas": "Canvas 不可用",
    "tex.msgPickPng": "请先选择 PNG 图片。",
    "tex.busy": "处理中…",
    "tex.msgWallSize": "墙壁贴图必须为 106×106。",
    "tex.msgWallOk": "已生成墙壁用贴图（468×180）。",
    "tex.msgPickTileWall": "请先选择 74×74（物块）或 106×106（墙壁）的 PNG。",
    "tex.msgTileSize": "物块贴图必须为 74×74。",
    "tex.msgTileOk0": "已生成物块贴图（234×90），模式：不与其他物块衔接。",
    "tex.msgTileOkCustom": "已生成物块贴图（288×270），模式：自定义衔接（无材质叠加）。",
    "tex.msgUnknownMode": "未知的物块格式选项。",
    "tex.errOverlay": "无法加载叠加图层 FG_{n}.png",
    "tex.msgPngType": "请使用 PNG 图片（与原版工具一致）。",
    "tex.readFail": "无法读取图片。",
    "tex.msgDimBad": "尺寸必须为 74×74（物块）或 106×106（墙壁）。",
    "tex.kindHintWall": "已识别：墙壁贴图 106×106 → 输出 468×180",
    "tex.wallReady": "已载入墙壁贴图，点击「生成贴图」。",
    "tex.kindHintTile": "已识别：物块贴图 74×74",
    "tex.tileReady": "已载入物块贴图，选择衔接模式后点击「生成贴图」。",
    "tex.loadingSample": "正在加载示例…",
    "tex.sampleMissing": "示例文件未找到（请确认已部署 /trtools/img/samples）",
    "tex.msgTileOk": "已生成物块贴图（288×270），模式：{mode}。",
    "ogg.dlNamed": "下载 {name}",
    "ogg.sumN": "已选 {n} 个文件",
    "ogg.maybeUnsupported": "{ext}（可能不支持）",
    "ogg.errHttp": "请使用 http:// 或 https:// 打开本页（勿用资源管理器双击生成的 file://），否则浏览器无法加载 FFmpeg Worker。",
    "ogg.loadingCore": "正在加载 FFmpeg 核心（约 30MB，仅首次）…",
    "ogg.logReady": "[init] FFmpeg 就绪。",
    "ogg.converting": "转换中 ({i}/{total})：{name}",
    "ogg.doneN": "完成：共 {n} 个 OGG。可单独下载或打包 ZIP。",
    "ogg.fail": "失败：{e}",
    "ogg.noJszip": "JSZip 未加载。",
    "ogg.zipping": "正在打包 ZIP…",
    "ogg.zipDone": "ZIP 已下载。",
    "ogg.coreReady": "FFmpeg 核心已就绪。",
    "ogg.preloadFail": "预载失败：{e}",
    "ogg.zipFail": "ZIP 失败：{e}",
    "ogg.fileProto": "当前为 file:// 打开：请改用本地服务器或宝塔以 http(s) 访问，否则无法加载转换核心。",
    "armor.filesN": "已选择 {n} 个文件",
    "armor.pickTpl": "请先选择模板图片。",
    "armor.pickMode": "请至少勾选一个导出选项。",
    "armor.badSize": "模板尺寸错误：{name}（必须 128×80）",
    "armor.doneN": "完成：导出 {n} 个文件",
    "armor.fail": "导出失败：{e}",
    "armor.previewNeed": "请先选择输入文件，或先执行一次导出。\n“预览”按钮不会下载文件。",
    "st.needBodyArm": "请选择 Body 与 Arm 的 PNG 文件。",
    "st.needFemale": "请选择女性身体贴图，或勾选「使用 Body 作为女性等价」。",
    "st.lblBodyShort": "身体贴图",
    "st.lblArmShort": "手臂贴图",
    "st.lblFemaleShort": "女性身体贴图",
    "st.badSize": "「{label}」须为 {w}×{h} 像素，当前为 {aw}×{ah}",
    "st.done": "转换完成。可下载 PNG。",
    "tmu.needFile": "请先选择 .tmod 文件",
    "tmu.logNoFile": "未选择文件，已取消解包。",
    "tmu.busy": "处理中，请稍候…",
    "tmu.logStart": "开始解包：{name}",
    "tmu.logErr": "服务端返回错误：{msg}",
    "tmu.errFail": "解包失败：{msg}",
    "tmu.noZip": "服务端未返回 ZIP 文件",
    "tmu.logDone": "解包完成。",
    "tmu.logSave": "若浏览器支持，将弹出保存位置选择；否则使用默认下载目录。",
    "tex.footerEn":
      "Web tool logic replicates Winter Leaf’s TextureSplitter (2025-04-29). Group chat for Terraria modding: 960277607.",
    "tex.creditEnP1":
      "Web tool logic replicates Winter Leaf’s TextureSplitter (2025-04-29).",
    "tex.creditEnP2": "Terraria modding group chat: 960277607."
  };

  var EN = {
    "loading.text": "Loading…",
    "meta.titleHome": "tModWebTools — Respecting every developer's wishes — Mornia-Cherry",
    "meta.titleStats": "Visit stats — tModWebTools",
    "meta.titleSettings": "Settings — tModWebTools",
    "meta.titleTerrasavr": "tModWebTools — Terrasavr",
    "meta.titleTmodUnpacker": "tModUnpacker — tModWebTools",
    "meta.titleSprite": "Body sprite transform — tModWebTools",
    "meta.titleTexture": "TextureSplitter — tModWebTools",
    "meta.titleArmor": "ArmorHelper — tModWebTools",
    "meta.titleOgg": "OGG convert — tModWebTools",
    "brand.short": "tModWebTools - TWT",
    "nav.aria": "Tools",
    "nav.tilesheet": "Tilesheet",
    "nav.armor": "ArmorHelper",
    "nav.sprite": "SpriteTransform",
    "nav.ogg": "OGG convert",
    "nav.texture": "TextureSplitter",
    "nav.tmod": ".tMod unpack",
    "nav.terrasavr": "Terrasavr",
    "footer.settings": "Settings",
    "footer.stats": "Visit stats",
    "sidebar.collapse": "Collapse sidebar",
    "sidebar.expand": "Expand sidebar",
    "toTop": "Back to top",
    "online.prefix": "Online",
    "online.suffix": "users",
    "online.tooltipIndex": "Live count needs a local server; file:// cannot be counted.",
    "online.tooltipDefault": "Live count needs the /count endpoint deployed.",
    "online.tooltipArmor": "Live count uses the server /events endpoint.",
    "footer.credit": "tModLoader ArknightsMod — Mornia-Cherry",
    "footer.contact": "Contact",
    "footer.bug": "Bug reports",
    "footer.bilibili": "Bilibili",
    "stats.h1": "Visit statistics",
    "stats.sub": "Unique visitors per hour today (line chart)",
    "stats.section": "Unique visitors by hour today",
    "stats.note":
      "Note: data is kept in server memory and resets when the process restarts; behind a reverse proxy, IP uses X-Forwarded-For.",
    "stats.chartAria": "Visits chart for today",
    "stats.metaDay": "Day",
    "stats.metaTz": "Time zone",
    "stats.loadFail": "Failed to load: ",
    "stats.dataset": "Unique visitors (per hour)",
    "settings.h1": "Settings",
    "settings.sub": "Language and theme are stored in this browser only.",
    "settings.langTitle": "Language",
    "settings.langZh": "简体中文",
    "settings.langEn": "English",
    "settings.langEs": "Español",
    "settings.themeTitle": "Theme color",
    "settings.themeEmerald": "Emerald",
    "settings.themeOcean": "Ocean",
    "settings.themeViolet": "Violet",
    "settings.themeAmber": "Amber",
    "settings.themeRose": "Rose",
    "settings.themeTeal": "Teal",
    "settings.aboutTitle": "About",
    "settings.aboutBody":
      "tModWebTools (TWT) is primarily maintained by Mornia-Cherry for tModLoader / Terraria asset and modding workflows. Please report any wording or translation issues.",
    "settings.authorLine": "Maintained by: Mornia-Cherry",
    "tsheet.h1": "Tilesheet v26.5.0",
    "tsheet.tabBuild": "Tilesheet",
    "tsheet.tabStitch": "Remove gaps",
    "tsheet.tabGif2": "GIF to sheet",
    "tsheet.tabSheet2": "Sheet to GIF",
    "tsheet.tabCompose": "Stack frames",
    "tsheet.tabSplit": "Split frames",
    "tsheet.input": "Input",
    "tsheet.dropMain": "Drop images here",
    "tsheet.dropHint": "Or click to choose. Multiple images supported (animation order).",
    "tsheet.pick": "Choose images",
    "tsheet.clear": "Clear",
    "tsheet.params": "Parameters",
    "tsheet.lblTile": "Tile size",
    "tsheet.lblGap": "Gap",
    "tsheet.lblMargin": "Bleed (px)",
    "tsheet.helpMarginTitle":
      "Applied after the regular tilesheet is built (pad, sample, gap layout). N = N px of transparent margin (not × tile). Top-left pad (tiles): right and bottom. Center: all four sides. Center + bottom: left, right, top. Editable only when padding mode is Top-left pad (tiles); otherwise ignored.",
    "tsheet.helpMarginAria": "About bleed",
    "tsheet.lblStride": "Source stride",
    "tsheet.helpStrideTitle":
      "(Not shown in the UI; buildGapImage still accepts strideInPx. The build uses a fixed stride equal to tile.)",
    "tsheet.helpStrideAria": "About source stride",
    "tsheet.mergeMulti": "When multiple images: merge vertically into one strip first",
    "tsheet.cropTransparent": "Crop transparent margins (recommended)",
    "tsheet.cropHint": "Trims fully transparent borders on each frame",
    "tsheet.padRight": "Extend right (tiles)",
    "tsheet.padBottom": "Extend bottom (tiles)",
    "tsheet.padMode": "Padding mode",
    "tsheet.padTopLeft": "Top-left pad (tiles)",
    "tsheet.padCenter": "Center pad",
    "tsheet.padCenterBottom": "Center horizontally, bottom align",
    "tsheet.outName": "Output filename",
    "tsheet.cols": "Target cols (optional)",
    "tsheet.rows": "Target rows (optional)",
    "tsheet.preview": "Build preview",
    "tsheet.downloadPng": "Download PNG",
    "tsheet.busy": "Working…",
    "tsheet.stitchTitle": "Remove sheet gaps",
    "tsheet.stitchHint": "Detects transparent seam columns/rows and removes them",
    "tsheet.alphaStitch": "Alpha threshold for “empty”",
    "tsheet.minSeam": "Minimum seam width",
    "tsheet.runStitch": "Run",
    "tsheet.splitTitle": "Split frames (ZIP)",
    "tsheet.splitMode": "Split mode",
    "tsheet.splitModeSeam": "Transparent seams (original)",
    "tsheet.splitModeGrid": "Fixed grid (Terraria tiles)",
    "tsheet.splitStrideW": "Cell stride W (px)",
    "tsheet.splitStrideH": "Cell stride H (px)",
    "tsheet.splitCropW": "Sample width (px)",
    "tsheet.splitCropH": "Sample height (px)",
    "tsheet.splitGridFull": "Output full cell (sample = stride, often 18×18)",
    "tsheet.splitGridHint":
      "Row-major cells from top-left; for vanilla-style tile sheets with 1px gutters on the right and bottom of each cell.",
    "tsheet.splitAxis": "Split direction",
    "tsheet.splitAxisX": "Horizontal (vertical transparent seams)",
    "tsheet.splitAxisY": "Vertical (horizontal transparent seams)",
    "tsheet.splitCrop": "Crop transparent margins after split",
    "tsheet.splitZip": "Zip download",
    "tsheet.runSplit": "Split and download",
    "tsheet.composeTitle": "Stack frames",
    "tsheet.composeGap": "Spacing (px)",
    "tsheet.runCompose": "Compose",
    "tsheet.gif2Title": "GIF to sprite sheet",
    "tsheet.gif2Hint":
      "Same layout as “Stack frames”: uniform width, vertical stack. Needs <code>ImageDecoder</code> (Chrome / Edge recommended).",
    "tsheet.frameGap": "Frame gap (px)",
    "tsheet.gif2Run": "Decode & preview",
    "tsheet.sheet2Title": "Sprite sheet to GIF",
    "tsheet.sheet2Hint":
      "For vertical strips from “Stack frames” or this page: equal frame height and fixed gaps. GIF export loads the <code>gifenc</code> library over the network (~few KB).",
    "tsheet.frameH": "Frame height (px)",
    "tsheet.frameCount": "Frame count (0 = auto)",
    "tsheet.delayMs": "Delay per frame (ms)",
    "tsheet.sheet2Run": "Build & download GIF",
    "tsheet.outPreview": "Preview",
    "tsheet.previewGrid": "Pixel grid (preview)",
    "ogg.warnFile":
      "Opened as file://. FFmpeg modules and workers cannot load correctly. Serve this folder over http(s) (e.g. VS Code Live Server, npx serve ., or your panel site).",
    "ogg.warnHtml":
      "<strong>Opened as file://.</strong> FFmpeg modules and workers cannot load correctly. Use a local HTTP server (e.g. VS Code Live Server, <code>npx serve .</code>, or your panel) and open this page over <code>http://</code> or <code>https://</code>.",
    "ogg.h1": "tModLoader OGG tool v26.4.1",
    "ogg.intro":
      "Convert common audio to Terraria / tModLoader-friendly <strong>Ogg + Vorbis</strong>, 44.1 kHz stereo, ~128–160 kbps equivalent; optional metadata strip.",
    "ogg.inTitle": "Input audio",
    "ogg.dropMain": "Drop files here",
    "ogg.dropHint": "MP3, WMA, M4A, FLAC, WAV, Ogg (including non-Vorbis Ogg), etc.",
    "ogg.pickFile": "Choose files",
    "ogg.clear": "Clear",
    "ogg.none": "No file selected",
    "ogg.optTitle": "Options",
    "ogg.stripMeta": "Strip metadata (<code>-map_metadata -1</code>) to reduce non-standard tag issues in tModLoader",
    "ogg.encHint": "Encoder: <code>libvorbis</code> · 44100 Hz · stereo · <code>-qscale:a 5</code>",
    "ogg.preload": "Preload FFmpeg core",
    "ogg.convert": "Convert",
    "ogg.zip": "Zip download",
    "ogg.helpTitle": "Notes",
    "ogg.help1": "Runs <strong>ffmpeg.wasm</strong> in the browser; <strong>first run</strong> downloads ~30 MB core.",
    "ogg.help2": "Files named <code>.ogg</code> but encoded with <strong>Opus</strong> (etc.) can error in Terraria; this tool re-encodes to <strong>Vorbis</strong>.",
    "ogg.help3": "If a format fails to decode, the WASM build may lack that decoder—try desktop FFmpeg to WAV first.",
    "ogg.logTitle": "FFmpeg log",
    "armor.h1": "ArmorHelper v1.0",
    "armor.intro": "Input template must be 128×80. Output is 20×560 then scaled 2× to 40×1120.",
    "armor.inTitle": "Input template",
    "armor.dropMain": "Drop images here",
    "armor.dropHint": "Or click to choose. Batch export supported",
    "armor.pick": "Choose images",
    "armor.clear": "Clear",
    "armor.none": "No file selected",
    "armor.exportOpts": "Export options",
    "armor.zipDl": "Download as ZIP",
    "armor.export": "Export",
    "armor.previewBtn": "Preview",
    "armor.previewTitle": "Preview",
    "armor.inTpl": "Input template",
    "armor.outPrev": "Output preview",
    "armor.modeHead": "Head",
    "armor.modeBody": "Body",
    "armor.modeFemale": "Body (female)",
    "armor.modeLegs": "Legs",
    "armor.modeArms": "Arms",
    "armor.modeFull": "Full armor",
    "armor.modeFullF": "Full armor (female)",
    "armor.modeGifFull": "Full armor (GIF)",
    "armor.modeGifFullF": "Full armor GIF (female)",
    "st.h1": "SpriteTransform v1.6.6",
    "st.intro":
      "Combine vanilla <strong>40×1120</strong> body / arms / female body into one <strong>360×224</strong> sheet (same idea as the Java Terraria Sprite Transformer).",
    "st.inPng": "Input PNG",
    "st.lblBody": "Body sheet (40×1120)",
    "st.lblArm": "Arms sheet (40×1120)",
    "st.lblFemale": "Female body sheet (40×1120)",
    "st.sameBody": "Use the same file as body for female body",
    "st.out": "Output",
    "st.transform": "Transform",
    "st.download": "Download PNG",
    "st.previewTitle": "Preview (360×224)",
    "st.previewHint": "Matches the original tool; pick three 40×1120 PNGs (female can match body).",
    "st.browse": "Browse",
    "st.phNone": "No file selected",
    "st.footerCredit":
      "Original concept and tool: Pyromma's <a href=\"https://forums.terraria.org/index.php?threads/sprite-transformer-quickly-transform-body-sprite-sheets-from-1-3-to-1-4.96210/\" target=\"_blank\" rel=\"noopener noreferrer\">Sprite Transformer: 1.3 to 1.4 body sprite sheets</a> (Terraria Community Forums).",
    "tex.h1": "TextureSplitter v2.6",
    "tex.intro":
      "Expand <strong>74×74</strong> tile or <strong>106×106</strong> wall sprites into Terraria / tModLoader textures; logic from Winter Leaf’s TextureSplitter tool.",
    "tex.inPng": "Input PNG",
    "tex.dropMain": "Drop image here",
    "tex.dropHint": "Or click to choose. Must be <strong>74×74</strong> (tile) or <strong>106×106</strong> (wall)",
    "tex.pick": "Choose image",
    "tex.modeTitle": "Tile blend mode",
    "tex.modeOnly74": "Only for 74×74 tiles (same numbers as the desktop tool)",
    "tex.gen": "Generate texture",
    "tex.download": "Download PNG",
    "tex.sampleTitle": "Samples (click to load)",
    "tex.tileLabel": "Tile 74×74",
    "tex.wallLabel": "Wall 106×106",
    "tex.tileTitle": "Load tile sample",
    "tex.wallTitle": "Load wall sample",
    "tex.previewTitle": "Preview",
    "tex.outHint": "Default output name: <code>original_Output.png</code>. Wall output is always 468×180.",
    "tex.richAria": "Tile blend mode (with icons)",
    "tex.listAria": "Tile blend options",
    "tex.mode0": "No neighbor blending (234×90)",
    "tex.modeNeg1": "Custom blend, no material overlay (288×270)",
    "tex.mode1": " — Dirt (288×270 + overlay)",
    "tex.mode2": " — Stone (288×270 + overlay)",
    "tex.mode3": " — Mud (288×270 + overlay)",
    "tex.mode4": " — Snow (288×270 + overlay)",
    "tex.mode5": " — Leaf (288×270 + overlay)",
    "tex.mode6": " — Cloud (288×270 + overlay)",
    "tex.mode7": " — Sand (288×270 + overlay)",
    "tex.mode8": " — Crimsand (288×270 + overlay)",
    "tex.mode9": " — Ebonsand (288×270 + overlay)",
    "tex.mode10": " — Pearlsand (288×270 + overlay)",
    "tex.mode11": " — Ash (288×270 + overlay)",
    "tex.modePlaceholder": "Choose (74×74 tile only)",
    "tmu.h1": "tModUnpacker v1.3",
    "tmu.intro": "Upload a .tmod file; the server unpacks it.",
    "tmu.inTitle": "Input .tmod",
    "tmu.dropMain": "Drop .tmod here",
    "tmu.dropHint": "Or use the button below",
    "tmu.pick": "Choose .tmod",
    "tmu.run": "Unpack",
    "tmu.none": "No file selected",
    "tmu.saveHint": "Result downloads as a ZIP to your browser’s default folder.",
    "tmu.note": "Unpacking runs on the server; no extra runtime install.",
    "tmu.msgTitle": "Messages",
    "tmu.origin": "Original: ",
    "tsv.h1": "Terrasavr v.Jan 28,2026",
    "tsv.hint": "Terrasavr is hosted from this site; updated for game 1.4.5.x.",
    "tsv.iframeTitle": "Terrasavr",
    "tsheet.dropHintGif2": "Or pick one GIF (frames become a vertical sheet like “Stack frames”).",
    "tsheet.dropHintSheet2": "Or pick one PNG vertical strip (equal frame height, fixed gap).",
    "tsheet.msgPickFirst": "Please choose at least one image.",
    "tsheet.msgGifOnly": "In this mode, choose a GIF file.",
    "tsheet.msgPngStrip": "In this mode, choose a PNG sprite strip.",
    "tsheet.msgDone": "Done: {w}×{h}",
    "tsheet.msgAfSuggest": "Suggested AnimationFrameHeight: {n}",
    "tsheet.kvInputFrames": "Input frames",
    "tsheet.kvTile": "tile",
    "tsheet.kvGap": "gap",
    "tsheet.kvFramePx": "Frame size",
    "tsheet.kvOutPx": "Output size",
    "tsheet.msgBuildFail": "Build failed: {e}",
    "tsheet.msgStitchDone": "Stitch done: {w}×{h}",
    "tsheet.msgNoSeg": "No splittable segments found.",
    "tsheet.msgSplitDone": "Split done: {n} file(s)",
    "tsheet.msgGridNoCells": "No full cells with the current grid settings; check size, stride, and sample dimensions.",
    "tsheet.msgComposeNeedMerge": "Stacking multiple images requires “merge into one strip first”. Unchecked mode only supports a single image here.",
    "tsheet.msgBuildMerged": "Merged {n} image(s) into one strip before building the tilesheet.",
    "tsheet.msgBuildBatchDl": "Processed {n} image(s) separately; downloads started (one PNG each). Preview is a stacked view; “Download PNG” is disabled—use the files from your downloads folder.",
    "tsheet.msgComposeDone": "Compose done: {w}×{h}",
    "tsheet.errNoImageDecoder": "This browser has no ImageDecoder API. Use Chrome 94+ / Edge 94+ or similar.",
    "tsheet.errGifDecode": "GIF decode failed: {e}",
    "tsheet.errGifNoFrames": "GIF produced no frames.",
    "tsheet.errFrameH": "Invalid frame height.",
    "tsheet.errNoFullFrames": "Cannot slice full frames: check frame height, gap, and image height.",
    "tsheet.errFrameOverflow": "Frame {i} exceeds image height (y={y}, H={H}). Reduce frame count or fix parameters.",
    "tsheet.msgNeedPngStrip": "Please use a PNG sprite strip.",
    "tsheet.msgGifBuilt": "GIF built: {n} frames, {w}×{h}px, {d} ms/frame",
    "tsheet.msgGifTail": "Note: about {px}px at the bottom was not used—adjust frame height or gap if wrong.",
    "tsheet.kvFrames": "Frames",
    "tsheet.kvGap": "Gap",
    "tsheet.kvSize": "Size",
    "tsheet.kvUnusedH": "Unused height",
    "tsheet.kvOut": "Output",
    "tsheet.msgGifFail": "GIF export failed: {e}",
    "tsheet.msgGif2DoneLine1": "Done: {w}×{h}",
    "tsheet.msgGif2DoneLine2": "{n} frames (same vertical layout as “Stack frames”)",
    "tsheet.msgGifProcessFail": "GIF processing failed: {e}",
    "tsheet.msgNeedGif": "Please choose a GIF file.",
    "tsheet.msgUseGif": "Please use a GIF file.",
    "tsheet.msgNeedPreview": "Generate a preview first.",
    "tsheet.msgNeedStitch": "Run stitch first.",
    "tsheet.msgNeedCompose": "Compose first.",
    "tex.errRules": "Failed to load split rules",
    "tex.errCanvas": "Canvas unavailable",
    "tex.msgPickPng": "Please choose a PNG image.",
    "tex.busy": "Working…",
    "tex.msgWallSize": "Wall sprite must be 106×106.",
    "tex.msgWallOk": "Wall texture generated (468×180).",
    "tex.msgPickTileWall": "Choose a 74×74 tile or 106×106 wall PNG.",
    "tex.msgTileSize": "Tile sprite must be 74×74.",
    "tex.msgTileOk0": "Tile texture generated (234×90), mode: no neighbor blend.",
    "tex.msgTileOkCustom": "Tile texture generated (288×270), mode: custom blend (no overlay).",
    "tex.msgUnknownMode": "Unknown tile format option.",
    "tex.errOverlay": "Failed to load overlay FG_{n}.png",
    "tex.msgPngType": "Please use a PNG image (same as the desktop tool).",
    "tex.readFail": "Could not read the image.",
    "tex.msgDimBad": "Size must be 74×74 (tile) or 106×106 (wall).",
    "tex.kindHintWall": "Detected: wall sprite 106×106 → output 468×180",
    "tex.wallReady": "Wall sprite loaded. Click “Generate texture”.",
    "tex.kindHintTile": "Detected: tile sprite 74×74",
    "tex.tileReady": "Tile loaded. Pick a blend mode, then click “Generate texture”.",
    "tex.loadingSample": "Loading sample…",
    "tex.sampleMissing": "Sample not found (check that /trtools/img/samples is deployed).",
    "tex.msgTileOk": "Tile texture generated (288×270), mode: {mode}.",
    "ogg.dlNamed": "Download {name}",
    "ogg.sumN": "{n} file(s) selected",
    "ogg.maybeUnsupported": "{ext} (may be unsupported)",
    "ogg.errHttp": "Open this page over http(s), not file://, or FFmpeg workers cannot load.",
    "ogg.loadingCore": "Loading FFmpeg core (~30 MB, first time only)…",
    "ogg.logReady": "[init] FFmpeg ready.",
    "ogg.converting": "Converting ({i}/{total}): {name}",
    "ogg.doneN": "Done: {n} OGG file(s). Download individually or as ZIP.",
    "ogg.fail": "Failed: {e}",
    "ogg.noJszip": "JSZip is not loaded.",
    "ogg.zipping": "Creating ZIP…",
    "ogg.zipDone": "ZIP downloaded.",
    "ogg.coreReady": "FFmpeg core ready.",
    "ogg.preloadFail": "Preload failed: {e}",
    "ogg.zipFail": "ZIP failed: {e}",
    "ogg.fileProto": "file:// cannot load the conversion core—use http(s).",
    "armor.filesN": "{n} file(s) selected",
    "armor.pickTpl": "Choose template image(s) first.",
    "armor.pickMode": "Select at least one export option.",
    "armor.badSize": "Bad template size: {name} (must be 128×80)",
    "armor.doneN": "Done: exported {n} file(s)",
    "armor.fail": "Export failed: {e}",
    "armor.previewNeed": "Choose input or run export once.\n“Preview” does not download files.",
    "st.needBodyArm": "Choose Body and Arm PNG files.",
    "st.needFemale": "Choose female body sheet or check “same as body”.",
    "st.lblBodyShort": "Body sheet",
    "st.lblArmShort": "Arms sheet",
    "st.lblFemaleShort": "Female body sheet",
    "st.badSize": "“{label}” must be {w}×{h}px, got {aw}×{ah}",
    "st.done": "Done. You can download the PNG.",
    "tmu.needFile": "Choose a .tmod file first",
    "tmu.logNoFile": "No file selected; unpack cancelled.",
    "tmu.busy": "Working, please wait…",
    "tmu.logStart": "Unpacking: {name}",
    "tmu.logErr": "Server error: {msg}",
    "tmu.errFail": "Unpack failed: {msg}",
    "tmu.noZip": "Server did not return a ZIP file",
    "tmu.logDone": "Unpack finished.",
    "tmu.logSave": "If supported, you can pick a save location; otherwise the browser uses the default download folder.",
    "tex.footerEn":
      "Web tool logic replicates Winter Leaf’s TextureSplitter (2025-04-29). Terraria modding group: 960277607.",
    "tex.creditEnP1":
      "Web tool logic replicates Winter Leaf’s TextureSplitter (2025-04-29).",
    "tex.creditEnP2": "Terraria modding group chat: 960277607."
  };

  var ES = {};
  (function mergeEs() {
    for (var k in EN) {
      if (Object.prototype.hasOwnProperty.call(EN, k)) ES[k] = EN[k];
    }
    var patch = typeof window !== "undefined" && window.__TWT_ES && typeof window.__TWT_ES === "object" ? window.__TWT_ES : null;
    if (patch) {
      for (var k2 in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k2)) ES[k2] = patch[k2];
      }
    }
  })();

  function htmlLangFromStored(stored) {
    if (stored === "en") return "en";
    if (stored === "es") return "es";
    return "zh-CN";
  }

  function getLang() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      if (v === "en") return "en";
      if (v === "es") return "es";
      return "zh-CN";
    } catch (_) {
      return "zh-CN";
    }
  }

  function getTheme() {
    try {
      var v = localStorage.getItem(THEME_KEY) || "emerald";
      if (/^(emerald|ocean|violet|amber|rose|teal)$/.test(v)) return v;
      return "emerald";
    } catch (_) {
      return "emerald";
    }
  }

  function tpl(str, map) {
    if (!str || !map || typeof map !== "object") return str;
    return String(str).replace(/\{(\w+)\}/g, function (_, name) {
      return map[name] != null ? String(map[name]) : "";
    });
  }

  function t(k, vars) {
    var L = getLang();
    var primary = L === "en" ? EN : L === "es" ? ES : ZH;
    var v = primary[k];
    if ((v == null || v === "") && L === "es") v = EN[k];
    if (v == null || v === "") v = ZH[k];
    if (v == null || v === "") v = k;
    return vars ? tpl(v, vars) : v;
  }

  function apply(root) {
    root = root || document;
    try {
      var titleEl = root.querySelector ? root.querySelector("title[data-i18n-doc]") : null;
      if (titleEl) {
        var dk = titleEl.getAttribute("data-i18n-doc");
        if (dk) document.title = t(dk);
      }
    } catch (_) {}

    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (!k) return;
      el.textContent = t(k);
    });
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-html");
      if (!k) return;
      el.innerHTML = t(k);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-placeholder");
      if (!k) return;
      el.setAttribute("placeholder", t(k));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-title");
      if (!k) return;
      el.setAttribute("title", t(k));
    });
    root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-aria");
      if (!k) return;
      el.setAttribute("aria-label", t(k));
    });
    try {
      if (document.body) {
        var Lb = getLang();
        document.body.classList.toggle("twt-lang--en", Lb === "en");
        document.body.classList.toggle("twt-lang--es", Lb === "es");
        document.body.classList.toggle("twt-lang--zh", Lb === "zh-CN");
      }
    } catch (_) {}
    try {
      document.documentElement.setAttribute("lang", htmlLangFromStored(getLang()));
    } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent("twt:i18n-applied", { detail: { lang: getLang() } }));
    } catch (_) {}
  }

  function setLang(code) {
    var v = code === "en" ? "en" : code === "es" ? "es" : "zh-CN";
    try {
      localStorage.setItem(LANG_KEY, v);
    } catch (_) {}
    document.documentElement.setAttribute("lang", htmlLangFromStored(v));
    apply(document);
  }

  function setTheme(name) {
    var th = /^(emerald|ocean|violet|amber|rose|teal)$/.test(name) ? name : "emerald";
    try {
      localStorage.setItem(THEME_KEY, th);
    } catch (_) {}
    document.documentElement.setAttribute("data-trtheme", th);
  }

  function init() {
    setTheme(getTheme());
    apply(document);
  }

  window.TWT_I18N = {
    LANG_KEY: LANG_KEY,
    THEME_KEY: THEME_KEY,
    getLang: getLang,
    getTheme: getTheme,
    t: t,
    apply: apply,
    setLang: setLang,
    setTheme: setTheme,
    init: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
