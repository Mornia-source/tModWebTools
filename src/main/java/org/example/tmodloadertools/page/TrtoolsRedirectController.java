package org.example.tmodloadertools.page;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;

@Controller
public class TrtoolsRedirectController {

    // 浣跨敤銆屼粎璺緞銆嶇殑 Location锛堝 /?tool=锛夛紝涓嶇敤 redirect: 瀛楃涓层€?
    // 鍚﹀垯 Servlet 浼氭寜 X-Forwarded-Proto 鏈€忎紶鏃剁敓鎴?http://鈥︼紝鍦?HTTPS iframe 閲岃Е鍙?Mixed Content 鎷︽埅銆?
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

    @GetMapping("/armorcodegen.html")
    public ResponseEntity<Void> armorCodeGen() {
        return redirectRootTool("armorcodegen");
    }

    @GetMapping("/prtsarmorgen.html")
    public ResponseEntity<Void> prtsArmorGen() {
        return redirectRootTool("prtsarmorgen");
    }

    @GetMapping("/tool14to13.html")
    public ResponseEntity<Void> tool14To13() {
        return redirectRootTool("tool14to13");
    }

    @GetMapping("/spritetransform.html")
    public ResponseEntity<Void> spriteTransform() {
        return redirectRootTool("spritetransform");
    }

    @GetMapping("/aseprite-plugin.html")
    public ResponseEntity<Void> asepritePluginRoot() {
        return redirectRootTool("asepriteplugin");
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

    @GetMapping("/trtools/armorcodegen.html")
    public ResponseEntity<byte[]> trtoolsArmorCode() {
        return serveTrtoolsHtml("armorcodegen");
    }

    @GetMapping("/trtools/prtsarmorgen.html")
    public ResponseEntity<byte[]> trtoolsPrtsArmorGen() {
        return serveTrtoolsHtml("prtsarmorgen");
    }

    @GetMapping("/trtools/tool14to13.html")
    public ResponseEntity<byte[]> trtoolsTool14To13() {
        return serveTrtoolsHtml("tool14to13");
    }

    @GetMapping("/trtools/spritetransform.html")
    public ResponseEntity<byte[]> trtoolsSprite() {
        return serveTrtoolsHtml("spritetransform");
    }

    @GetMapping("/trtools/aseprite-plugin.html")
    public ResponseEntity<byte[]> trtoolsAsepritePlugin() {
        return serveTrtoolsHtml("aseprite-plugin");
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

    // 濮嬬粓鐩存帴杩斿洖 classpath 闈欐€?HTML锛屼笉鍐嶆牴鎹?embed 鍋?redirect:/銆?
    // 閬垮厤 Cloudflare / 澶氬眰鍙嶄唬涓?Location 寮傚父銆乮frame 鍐呴噸瀹氬悜閾惧崱浣忕瓑闂銆?
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
