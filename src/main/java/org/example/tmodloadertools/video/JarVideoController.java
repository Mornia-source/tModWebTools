package org.example.tmodloadertools.video;

import org.example.tmodloadertools.stats.JarNeighborPaths;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;

/**
 * 扫描可执行 jar 同目录下的视频文件；{@code /video/} 列表选择；{@code /video/stream?name=} 拉流（支持 Range）。
 */
@Controller
public class JarVideoController {

    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "webm", "ogv", "mov", "m4v", "mpeg", "mpg");

    @Autowired
    private ResourceLoader resourceLoader;

    public record VideoFileDto(String name, String streamUrl) {}

    @GetMapping(value = "/video/catalog", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public List<VideoFileDto> videoCatalog() throws IOException {
        return listJarNeighborVideos();
    }

    @GetMapping({"/video", "/video/"})
    public ResponseEntity<byte[]> videoPage() {
        Resource r = resourceLoader.getResource("classpath:/static/video/index.html");
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

    @GetMapping("/video/stream")
    public ResponseEntity<ResourceRegion> streamVideo(
            @RequestParam("name") String name,
            @RequestHeader HttpHeaders headers) throws IOException {
        Path file = resolveVideoFile(name);
        if (file == null || !Files.isRegularFile(file) || !Files.isReadable(file)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        long contentLength = resource.contentLength();
        if (contentLength <= 0) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = mediaTypeForFile(file);

        List<HttpRange> ranges = headers.getRange();
        HttpRange range = ranges.isEmpty() ? null : ranges.getFirst();

        if (range == null) {
            ResourceRegion full = new ResourceRegion(resource, 0, contentLength);
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic())
                    .body(full);
        }

        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);
        long regionLen = end - start + 1;
        ResourceRegion region = new ResourceRegion(resource, start, regionLen);
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + contentLength)
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic())
                .body(region);
    }

    private List<VideoFileDto> listJarNeighborVideos() throws IOException {
        Path base = JarNeighborPaths.jarDirectory().normalize();
        if (!Files.isDirectory(base)) {
            return List.of();
        }
        try (Stream<Path> stream = Files.list(base)) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .filter(this::isAllowedVideoBasename)
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .map(n -> new VideoFileDto(n, streamUrlForName(n)))
                    .toList();
        }
    }

    private String streamUrlForName(String basename) {
        return "/video/stream?name=" + UriUtils.encodeQueryParam(basename, StandardCharsets.UTF_8);
    }

    private boolean isAllowedVideoBasename(String filename) {
        if (filename == null || filename.isBlank()) {
            return false;
        }
        if (filename.contains("..") || filename.indexOf('/') >= 0 || filename.indexOf('\\') >= 0) {
            return false;
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return false;
        }
        String ext = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        return VIDEO_EXTENSIONS.contains(ext);
    }

    private Path resolveVideoFile(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        String trimmed = name.trim();
        if (!isAllowedVideoBasename(trimmed)) {
            return null;
        }
        Path base = JarNeighborPaths.jarDirectory().normalize();
        Path resolved = base.resolve(trimmed).normalize();
        if (!resolved.startsWith(base)) {
            return null;
        }
        return resolved;
    }

    private static MediaType mediaTypeForFile(Path file) {
        String n = file.getFileName().toString().toLowerCase(Locale.ROOT);
        if (n.endsWith(".webm")) {
            return MediaType.parseMediaType("video/webm");
        }
        if (n.endsWith(".ogv")) {
            return MediaType.parseMediaType("video/ogg");
        }
        if (n.endsWith(".mov")) {
            return MediaType.parseMediaType("video/quicktime");
        }
        if (n.endsWith(".m4v")) {
            return MediaType.parseMediaType("video/x-m4v");
        }
        if (n.endsWith(".mpeg") || n.endsWith(".mpg")) {
            return MediaType.parseMediaType("video/mpeg");
        }
        return MediaType.parseMediaType("video/mp4");
    }
}
