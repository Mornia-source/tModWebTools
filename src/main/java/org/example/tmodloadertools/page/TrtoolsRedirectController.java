package org.example.tmodloadertools.page;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;
import java.lang.reflect.Method;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Controller
public class TrtoolsRedirectController {

    private final ResourceLoader resourceLoader;
    private final ToolRegistry registry;
    private final RequestMappingHandlerMapping handlerMapping;

    public TrtoolsRedirectController(ResourceLoader resourceLoader, ToolRegistry registry,
                                     RequestMappingHandlerMapping requestMappingHandlerMapping) {
        this.resourceLoader = resourceLoader;
        this.registry = registry;
        this.handlerMapping = requestMappingHandlerMapping;
    }

    /**
     * 按工具清单（tools.json）为每个工具注册两条路由：
     * - /{page}.html          → 302 到 /?tool={key}（根页 iframe 外壳）
     * - /trtools/{page}.html  → 直接返回工具页 HTML
     * 切片图工具的 page 为 index，不注册根路径跳转，避免与根页 /index.html 冲突。
     */
    @EventListener(ApplicationReadyEvent.class)
    public void registerToolRoutes() throws NoSuchMethodException {
        Method redirect = getClass().getMethod("redirectToRoot", HttpServletRequest.class);
        Method serve = getClass().getMethod("serveToolPage", HttpServletRequest.class);
        RequestMappingInfo.BuilderConfiguration config = handlerMapping.getBuilderConfiguration();
        for (ToolRegistry.Tool tool : registry.tools()) {
            if (!"index".equals(tool.page())) {
                handlerMapping.registerMapping(
                        RequestMappingInfo.paths("/" + tool.page() + ".html").methods(RequestMethod.GET).options(config).build(),
                        this, redirect);
            }
            handlerMapping.registerMapping(
                    RequestMappingInfo.paths("/trtools/" + tool.page() + ".html").methods(RequestMethod.GET).options(config).build(),
                    this, serve);
        }
    }

    // 使用「仅路径」的 Location（如 /?tool=），不用 redirect: 字符串。
    // 否则 Servlet 会在 X-Forwarded-Proto 未透传时生成 http://…，在 HTTPS iframe 里触发 Mixed Content 拦截。
    public ResponseEntity<Void> redirectToRoot(HttpServletRequest request) {
        ToolRegistry.Tool tool = registry.byPage(pageOf(request, "/"));
        if (tool == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/?tool=" + tool.key())).build();
    }

    // 始终直接返回 classpath 静态 HTML，不再根据 embed 做 redirect:/，
    // 避免 Cloudflare / 多层反代下 Location 异常、iframe 内重定向链卡住等问题。
    public ResponseEntity<byte[]> serveToolPage(HttpServletRequest request) {
        String page = pageOf(request, "/trtools/");
        if (registry.byPage(page) == null) {
            return ResponseEntity.notFound().build();
        }
        Resource r = resourceLoader.getResource("classpath:/static/trtools/html/" + page + ".html");
        if (!r.exists()) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = r.getInputStream().readAllBytes();
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .contentType(MediaType.TEXT_HTML)
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /** 前端读取的工具清单：window.TWT_TOOLS = [...] */
    @GetMapping("/trtools/js/tool-registry.js")
    public ResponseEntity<byte[]> toolRegistryScript() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .contentType(new MediaType("text", "javascript", StandardCharsets.UTF_8))
                .body(registry.registryScript().getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/download/armor-preview-1413.aseprite-extension")
    public ResponseEntity<byte[]> downloadAsepritePlugin() {
        Path filePath = Path.of("armor-preview-1413.aseprite-extension");
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = Files.readAllBytes(filePath);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"armor-preview-1413.aseprite-extension\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // "/trtools/npcframes.html" + "/trtools/" → "npcframes"
    private static String pageOf(HttpServletRequest request, String prefix) {
        String uri = request.getRequestURI();
        if (!uri.startsWith(prefix) || !uri.endsWith(".html")) {
            return "";
        }
        return uri.substring(prefix.length(), uri.length() - ".html".length());
    }
}
