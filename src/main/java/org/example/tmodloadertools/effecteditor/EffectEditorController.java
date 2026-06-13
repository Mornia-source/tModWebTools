package org.example.tmodloadertools.effecteditor;

import org.example.tmodloadertools.stats.JarNeighborPaths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * 「特效编辑生成器 1.4.4」(tEffectEditor) 的静态托管。
 *
 * <p>tEffectEditor 是一个独立维护的纯前端项目，<b>不</b>打进本 jar。部署时只需把整个
 * {@code tEffectEditor/} 目录上传到与可执行 jar <b>同级</b>的位置即可；本控制器会把
 * {@code /effecteditor-app/**} 映射到该目录下的文件，主工具页用 iframe 嵌入它。
 * 这样 twt 与编辑器可以各自独立更新发布。</p>
 *
 * <p>探测顺序：配置项 {@code trtools.effecteditor.dir} → jar 同级 {@code tEffectEditor/}
 * → jar 上级 {@code ../tEffectEditor/} → 工作目录 {@code ./tEffectEditor/}。</p>
 */
@Controller
public class EffectEditorController {

    private static final String BASE_URL = "/effecteditor-app";

    @Value("${trtools.effecteditor.dir:}")
    private String configuredDir;

    private static final Map<String, String> CONTENT_TYPES = Map.ofEntries(
            Map.entry("html", "text/html; charset=utf-8"),
            Map.entry("htm", "text/html; charset=utf-8"),
            Map.entry("js", "text/javascript; charset=utf-8"),
            Map.entry("mjs", "text/javascript; charset=utf-8"),
            Map.entry("css", "text/css; charset=utf-8"),
            Map.entry("json", "application/json; charset=utf-8"),
            Map.entry("tfx", "application/json; charset=utf-8"),
            Map.entry("svg", "image/svg+xml"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("gif", "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("ico", "image/x-icon"),
            Map.entry("woff", "font/woff"),
            Map.entry("woff2", "font/woff2"),
            Map.entry("ttf", "font/ttf"),
            Map.entry("map", "application/json; charset=utf-8"),
            Map.entry("txt", "text/plain; charset=utf-8"),
            Map.entry("md", "text/markdown; charset=utf-8"));

    /** 解析编辑器根目录（探测多个候选位置）。返回 null 表示未部署。 */
    private Path resolveBaseDir() {
        Set<Path> candidates = new LinkedHashSet<>();
        if (configuredDir != null && !configuredDir.isBlank()) {
            candidates.add(Path.of(configuredDir.trim()));
        }
        Path jarDir = JarNeighborPaths.jarDirectory();
        candidates.add(jarDir.resolve("tEffectEditor"));
        candidates.add(jarDir.getParent() == null ? jarDir.resolve("tEffectEditor")
                : jarDir.getParent().resolve("tEffectEditor"));
        candidates.add(Path.of(System.getProperty("user.dir", "."), "tEffectEditor"));
        for (Path c : candidates) {
            try {
                if (c != null && Files.isDirectory(c) && Files.exists(c.resolve("index.html"))) {
                    return c.toAbsolutePath().normalize();
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    @GetMapping({BASE_URL, BASE_URL + "/"})
    public ResponseEntity<byte[]> index() {
        return serve("index.html");
    }

    @GetMapping(BASE_URL + "/**")
    public ResponseEntity<byte[]> asset(HttpServletRequest request) {
        // 直接从请求路径中剥离前缀，得到相对路径（兼容 PathPattern，避免依赖匹配属性）
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            uri = uri.substring(ctx.length());
        }
        String decoded = java.net.URLDecoder.decode(uri, java.nio.charset.StandardCharsets.UTF_8);
        String rel = decoded.length() > BASE_URL.length() ? decoded.substring(BASE_URL.length()) : "";
        if (rel.startsWith("/")) {
            rel = rel.substring(1);
        }
        if (rel.isEmpty()) {
            rel = "index.html";
        }
        return serve(rel);
    }

    private ResponseEntity<byte[]> serve(String relativePath) {
        Path base = resolveBaseDir();
        if (base == null) {
            return notDeployedNotice();
        }
        // 去掉查询缓存参数（?v=N）与防目录穿越
        String clean = relativePath;
        int q = clean.indexOf('?');
        if (q >= 0) {
            clean = clean.substring(0, q);
        }
        Path target;
        try {
            target = base.resolve(clean).normalize();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        if (!target.startsWith(base)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (Files.isDirectory(target)) {
            target = target.resolve("index.html");
        }
        if (!Files.isRegularFile(target) || !Files.isReadable(target)) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = Files.readAllBytes(target);
            String ct = CONTENT_TYPES.getOrDefault(extensionOf(target), "application/octet-stream");
            boolean isHtml = ct.startsWith("text/html");
            CacheControl cache = isHtml
                    ? CacheControl.noCache()
                    : CacheControl.maxAge(1, TimeUnit.HOURS);
            return ResponseEntity.ok()
                    .header("Content-Type", ct)
                    .cacheControl(cache)
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private static String extensionOf(Path p) {
        String name = p.getFileName().toString();
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /** 编辑器目录尚未上传时，iframe 内展示的友好提示页。 */
    private ResponseEntity<byte[]> notDeployedNotice() {
        String html = "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<title>tEffectEditor 未部署</title>"
                + "<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;"
                + "background:#1d1d1d;color:#d6d6d6;font:14px/1.7 'Segoe UI','Microsoft YaHei',sans-serif}"
                + ".box{max-width:520px;padding:28px 32px;border:1px solid #383838;border-radius:8px;background:#252526}"
                + "b{color:#2d8ceb} code{background:#2d2d2d;padding:1px 6px;border-radius:3px}</style></head>"
                + "<body><div class=\"box\"><h2><b>tFX</b> 特效编辑生成器 未部署</h2>"
                + "<p>请把独立的 <code>tEffectEditor</code> 目录上传到与本服务 <b>jar 文件同级</b>的位置"
                + "（或在 <code>application.properties</code> 设置 <code>trtools.effecteditor.dir</code> 指向其绝对路径），"
                + "刷新本页即可加载编辑器。</p>"
                + "<p style=\"color:#9b9b9b\">该编辑器为独立维护项目，不随主程序打包，便于各自单独更新。</p>"
                + "</div></body></html>";
        return ResponseEntity.status(HttpStatus.OK)
                .header("Content-Type", "text/html; charset=utf-8")
                .cacheControl(CacheControl.noStore())
                .body(html.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
