package org.example.tmodloadertools.page;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;
import java.net.URI;

@Controller
public class TrtoolsRedirectController {

    /**
     * 使用「仅路径」的 Location（如 /?tool=），不用 redirect: 字符串。
     * 否则 Servlet 会按 X-Forwarded-Proto 未透传时生成 http://…，在 HTTPS iframe 里触发 Mixed Content 拦截。
     */
    private static ResponseEntity<Void> redirectRootTool(String tool) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/?tool=" + tool)).build();
    }

    @GetMapping("/oggconvert.html")
    public ResponseEntity<Void> ogg() {
        return redirectRootTool("oggconvert");
    }

    @GetMapping("/armorhelper.html")
    public ResponseEntity<Void> armorHelper() {
        return redirectRootTool("armorhelper");
    }

    @GetMapping("/spritetransform.html")
    public ResponseEntity<Void> spriteTransform() {
        return redirectRootTool("spritetransform");
    }

    @GetMapping("/texturesplitter.html")
    public ResponseEntity<Void> textureSplitter() {
        return redirectRootTool("texturesplitter");
    }

    @GetMapping("/stats.html")
    public ResponseEntity<Void> statsRoot() {
        return redirectRootTool("stats");
    }

    @GetMapping("/settings.html")
    public ResponseEntity<Void> settingsRoot() {
        return redirectRootTool("settings");
    }

    @GetMapping("/tmodunpacker.html")
    public ResponseEntity<Void> tmodUnpackerRoot() {
        return redirectRootTool("tmodunpacker");
    }

    @GetMapping("/terrasavr.html")
    public ResponseEntity<Void> terrasavrRoot() {
        return redirectRootTool("terrasavr");
    }

    @Autowired
    private ResourceLoader resourceLoader;

    @GetMapping("/trtools/index.html")
    public ResponseEntity<byte[]> trtoolsIndex() {
        return serveTrtoolsHtml("index");
    }

    @GetMapping("/trtools/oggconvert.html")
    public ResponseEntity<byte[]> trtoolsOgg() {
        return serveTrtoolsHtml("oggconvert");
    }

    @GetMapping("/trtools/armorhelper.html")
    public ResponseEntity<byte[]> trtoolsArmor() {
        return serveTrtoolsHtml("armorhelper");
    }

    @GetMapping("/trtools/spritetransform.html")
    public ResponseEntity<byte[]> trtoolsSprite() {
        return serveTrtoolsHtml("spritetransform");
    }

    @GetMapping("/trtools/texturesplitter.html")
    public ResponseEntity<byte[]> trtoolsTextureSplitter() {
        return serveTrtoolsHtml("texturesplitter");
    }

    @GetMapping("/trtools/stats.html")
    public ResponseEntity<byte[]> trtoolsStats() {
        return serveTrtoolsHtml("stats");
    }

    @GetMapping("/trtools/settings.html")
    public ResponseEntity<byte[]> trtoolsSettings() {
        return serveTrtoolsHtml("settings");
    }

    @GetMapping("/trtools/tmodunpacker.html")
    public ResponseEntity<byte[]> trtoolsTmodUnpacker() {
        return serveTrtoolsHtml("tmodunpacker");
    }

    @GetMapping("/trtools/terrasavr.html")
    public ResponseEntity<byte[]> trtoolsTerrasavr() {
        return serveTrtoolsHtml("terrasavr");
    }

    /**
     * 始终直接返回 classpath 静态 HTML，不再根据 embed 做 redirect:/。
     * 避免 Cloudflare / 多层反代下 Location 异常、iframe 内重定向链卡住等问题。
     */
    private ResponseEntity<byte[]> serveTrtoolsHtml(String fileBaseName) {
        String classpathPath = "classpath:/static/trtools/html/" + fileBaseName + ".html";
        Resource r = resourceLoader.getResource(classpathPath);
        if (!r.exists()) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = r.getInputStream().readAllBytes();
            return ResponseEntity
                    .ok()
                    .cacheControl(CacheControl.noStore())
                    .contentType(MediaType.TEXT_HTML)
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
