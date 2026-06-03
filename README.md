# tModWebTools

面向 Terraria / tModLoader 模组开发的在线工具集：贴图与精灵处理、音频转换、`.tmod` 解包、PRTS 盔甲代码生成等，全部在浏览器中完成，可自建部署。

- 线上站点：https://trtool.yingtaoshu.org/
- 定位：轻量、实用、可自托管，方便模组作者日常资源处理

---

## 功能概览

### 工具页（`/trtools/html/`）

| 工具 | 说明 |
|------|------|
| 切片图工具 | 图集切片、拼接、GIF 与精灵表互转等 |
| 装备帧生成器（ArmorHelper） | 按模板批量导出盔甲帧 |
| PRTS 盔甲生成器 | 从 PRTS Wiki 拉取干员数据，生成 ArknightsMod 盔甲 C# 代码 |
| 盔甲代码生成器 | 基于材料/干员配置的盔甲代码生成（网页移植版） |
| 躯干格式转换器 | 1.4 / 1.3 躯干精灵格式互转 |
| 1.4 材质图转 1.3 | 盔甲材质图版本转换 |
| 物块生成器（TextureSplitter） | 物块/墙贴图拆分与处理 |
| OGG 转换 | 批量将音频转为 Terraria 常用 OGG（浏览器端 FFmpeg） |
| .tMod 文件解包 | 上传 `.tmod`，服务端解包并下载资源 |
| 角色存档编辑器（Terrasavr） | 内嵌 Terrasavr 页面 |
| Aseprite 插件 | 插件说明与下载入口 |

### 站点能力

- **多语言界面**：简体中文 / English / Español（语言与主题保存在浏览器 `localStorage`）
- **主题切换**：翡翠、海洋、紫罗兰、琥珀、玫瑰、青绿等配色
- **共享侧栏**：各工具页共用 `partials/app-sidebar-inner.html`，由 `sidebar-shared.js` 动态加载
- **访问统计**：按小时/日/周/月记录独立访客（CSV 持久化，默认保留 30 天）
- **在线人数**：SSE `/trtools/events` + 轮询 `/trtools/count` 兜底
- **自建视频页**：`/video/` 自动扫描 JAR 同级目录下的视频文件，支持多文件选择与 Range 流式播放

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Java **21**（必须，低于 21 无法运行打包后的 JAR） |
| 后端 | Spring Boot 4.x（Web） |
| 前端 | 静态 HTML / CSS / JavaScript（无 Node 构建步骤） |
| 构建 | Maven Wrapper（`mvnw` / `mvnw.cmd`） |

构建时会在 `process-classes` 阶段执行 `StaticAssetFingerprintTool`，为静态资源生成指纹清单（`asset-manifest.json`），便于缓存更新。

---

## 目录结构（简要）

```
tModWebTools/
├── src/main/java/          # Spring 控制器与服务（解包、统计、PRTS 代理等）
├── src/main/resources/
│   ├── application.properties
│   └── static/
│       ├── index.html      # 根路径壳页（iframe 加载具体工具）
│       ├── trtools/        # 工具页、JS、CSS、数据与图片
│       └── video/          # 视频页前端
├── scripts/
│   ├── dev-restart.ps1     # Windows 本地重启（停 8080 + spring-boot:run）
│   └── emit-i18n-es.mjs    # 从 i18n.js 再生西语包 i18n-es.js
├── mvnw / mvnw.cmd
└── pom.xml
```

---

## 本地开发

### 环境要求

- **JDK 21**（Maven 若默认指向 Java 17，需设置 `JAVA_HOME`）
- 无需单独安装 Maven（使用项目自带 Wrapper）

### Windows 快速启动

```powershell
# 按本机 JDK 21 路径修改 JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.6.7-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

cd "你的项目路径\tModWebTools"
.\mvnw.cmd spring-boot:run
```

或使用脚本（会先释放 8080 端口）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev-restart.ps1
```

启动后访问：

- 首页：http://127.0.0.1:8080/
- 切片图：http://127.0.0.1:8080/trtools/html/index.html
- 访问统计：http://127.0.0.1:8080/?tool=stats
- 设置：http://127.0.0.1:8080/?tool=settings

> 说明：根路径 `/` 通过 `static/index.html` 用 iframe 加载工具页（带 `?embed=1`），地址栏保持为 `/`，当前工具由 `sessionStorage` 的 `trtoolsTool` 记住。

### Linux / macOS

```bash
export JAVA_HOME=/path/to/jdk-21
./mvnw spring-boot:run
```

---

## 打包部署

### 构建 JAR

```bash
./mvnw clean package -DskipTests
```

Windows：

```powershell
.\mvnw.cmd clean package -DskipTests
```

生成的**可执行包**（上传服务器用这一个）：

```
target/tModLoaderTools-0.0.1-SNAPSHOT.jar
```

同目录下的 `*.jar.original` 为未 repackage 的瘦包，**不要**用于部署。

### 运行

```bash
java -jar tModLoaderTools-0.0.1-SNAPSHOT.jar --server.port=8080
```

### 宝塔 / Nginx 反代建议

1. 服务器安装 **Java 21**，将 JAR 放到如 `/www/wwwroot/trtool/`。
2. 用 Supervisor、宝塔 Java 项目管理或 systemd 守护进程，工作目录设为 JAR 所在目录。
3. Nginx 反代到 `127.0.0.1:8080`，并透传真实 IP 与协议（在线人数与访问统计依赖此项）：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
# 若经 Cloudflare，建议增加：
# proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
```

4. **PRTS 盔甲生成器**需要服务器能出站访问 `https://prts.wiki`（可在 `application.properties` 调整超时与重试）。
5. **访问统计 CSV** 默认写在 **JAR 同级目录** 的 `trtools-visit-stats.csv`，请保证该目录可写。
6. **`.tmod` 解包**上传上限约 200MB（见 `application.properties` 中 `spring.servlet.multipart` 配置）。

### 可选：JAR 旁视频文件

将视频文件放在与 JAR **同一目录**，访问 `/video/` 即可在页面上选择播放；流地址形如 `/video/stream?name=文件名`。

---

## 配置说明

主要配置位于 `src/main/resources/application.properties`：

| 配置项 | 含义 |
|--------|------|
| `server.forward-headers-strategy=framework` | 反代后正确识别 HTTPS 与 Host |
| `spring.servlet.multipart.max-file-size` | `.tmod` 上传大小上限 |
| `trtools.prts.api-url` | PRTS Wiki API 地址 |
| `trtools.prts.*-timeout-*` / `max-retries` | PRTS 请求超时与重试 |

生产环境也可通过外部 `application.properties` 或启动参数覆盖，例如：

```bash
java -jar tModLoaderTools-0.0.1-SNAPSHOT.jar --server.port=8080 --trtools.prts.request-timeout-seconds=120
```

---

## 维护说明

### 更新西语翻译

修改 `src/main/resources/static/trtools/js/i18n.js` 后，可用脚本再生西语包：

```bash
node scripts/emit-i18n-es.mjs
```

### 不应提交到 Git 的文件

以下文件已在 `.gitignore` 中忽略，部署时会在服务器自动生成：

- `trtools-visit-stats.csv`（访问统计）
- `server-*.log`、`.tmp_out.txt` 等本地临时文件

---

## 主要 API（自用参考）

| 路径 | 说明 |
|------|------|
| `GET /trtools/count` | 当前在线人数 |
| `GET /trtools/events` | 在线人数 SSE |
| `POST /trtools/track` | 记录访问（前端 `visit-track.js`） |
| `GET /trtools/stats/*` | 访问统计 JSON |
| `POST /trtools/unpack` | `.tmod` 解包 |
| `GET /trtools/prts/wikitext` | PRTS Wiki 代理 |
| `GET /video/catalog`、`GET /video/stream` | 视频目录与流 |

---

## 致谢与说明

本站由 **Mornia-Cherry** 维护，面向 tModLoader 模组制作流程中的常见资源处理需求。PRTS 盔甲生成等部分逻辑移植自相关开源项目，具体署名见各工具页页脚。

如有文案或翻译错误，欢迎通过站点页脚的反馈渠道联系。
