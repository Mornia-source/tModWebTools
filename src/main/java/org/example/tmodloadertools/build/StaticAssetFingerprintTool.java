package org.example.tmodloadertools.build;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class StaticAssetFingerprintTool {

    private static final Pattern HTML_ASSET_REF = Pattern.compile(
        "/trtools/(js|css)/([A-Za-z0-9_.-]+\\.(?:js|css))(?:\\?v=[A-Za-z0-9_.-]+)?"
    );

    private StaticAssetFingerprintTool() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("Expected one argument: <staticRoot>");
        }

        Path staticRoot = Path.of(args[0]).toAbsolutePath().normalize();
        Path trtoolsRoot = staticRoot.resolve("trtools");
        Path htmlDir = trtoolsRoot.resolve("html");
        Path jsDir = trtoolsRoot.resolve("js");
        Path cssDir = trtoolsRoot.resolve("css");

        if (!Files.isDirectory(htmlDir) || !Files.isDirectory(jsDir) || !Files.isDirectory(cssDir)) {
            throw new IllegalStateException("Expected trtools html/js/css directories under " + staticRoot);
        }

        Map<String, String> manifest = new HashMap<>();
        fingerprintDirectory(jsDir, "js", manifest);
        fingerprintDirectory(cssDir, "css", manifest);
        rewriteHtmlFiles(htmlDir, manifest);
        rewriteJsFiles(jsDir, manifest);
        writeManifest(trtoolsRoot.resolve("asset-manifest.json"), manifest);
    }

    private static void fingerprintDirectory(Path dir, String kind, Map<String, String> manifest) throws Exception {
        List<Path> files = new ArrayList<>();
        try (var stream = Files.list(dir)) {
            stream.filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().endsWith("." + kind))
                .filter(path -> !isFingerprinted(path.getFileName().toString(), kind))
                .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                .forEach(files::add);
        }

        for (Path file : files) {
            byte[] content = Files.readAllBytes(file);
            String fileName = file.getFileName().toString();
            int dot = fileName.lastIndexOf('.');
            String baseName = fileName.substring(0, dot);
            String ext = fileName.substring(dot);
            String hash = sha256Hex(content).substring(0, 10);
            String fingerprintedName = baseName + "." + hash + ext;
            Path fingerprintedPath = file.resolveSibling(fingerprintedName);
            Files.write(fingerprintedPath, content);
            manifest.put("/trtools/" + kind + "/" + fileName, "/trtools/" + kind + "/" + fingerprintedName);
        }
    }

    private static boolean isFingerprinted(String fileName, String kind) {
        return fileName.matches(".+\\.[0-9a-f]{10}\\." + Pattern.quote(kind));
    }

    private static void rewriteHtmlFiles(Path htmlDir, Map<String, String> manifest) throws IOException {
        try (var stream = Files.list(htmlDir)) {
            for (Path htmlFile : stream.filter(Files::isRegularFile).filter(path -> path.getFileName().toString().endsWith(".html")).toList()) {
                rewriteAssetRefs(htmlFile, manifest);
            }
        }
    }

    private static void rewriteJsFiles(Path jsDir, Map<String, String> manifest) throws IOException {
        try (var stream = Files.list(jsDir)) {
            for (Path jsFile : stream.filter(Files::isRegularFile).filter(path -> path.getFileName().toString().endsWith(".js")).toList()) {
                if (isFingerprinted(jsFile.getFileName().toString(), "js")) {
                    continue;
                }
                rewriteAssetRefs(jsFile, manifest);
            }
        }
    }

    private static void rewriteAssetRefs(Path file, Map<String, String> manifest) throws IOException {
        String content = Files.readString(file, StandardCharsets.UTF_8);
        Matcher matcher = HTML_ASSET_REF.matcher(content);
        StringBuffer rewritten = new StringBuffer();
        while (matcher.find()) {
            String originalPath = "/trtools/" + matcher.group(1) + "/" + matcher.group(2);
            String replacement = manifest.getOrDefault(originalPath, originalPath);
            matcher.appendReplacement(rewritten, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(rewritten);
        Files.writeString(file, rewritten.toString(), StandardCharsets.UTF_8);
    }

    private static void writeManifest(Path manifestPath, Map<String, String> manifest) throws IOException {
        List<String> keys = manifest.keySet().stream().sorted().toList();
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        for (int i = 0; i < keys.size(); i++) {
            String key = keys.get(i);
            json.append("  \"").append(escapeJson(key)).append("\": \"")
                .append(escapeJson(manifest.get(key))).append("\"");
            if (i < keys.size() - 1) {
                json.append(',');
            }
            json.append('\n');
        }
        json.append("}\n");
        Files.writeString(manifestPath, json.toString(), StandardCharsets.UTF_8);
    }

    private static String sha256Hex(byte[] bytes) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(bytes);
        StringBuilder out = new StringBuilder(hash.length * 2);
        for (byte value : hash) {
            out.append(Character.forDigit((value >>> 4) & 0xF, 16));
            out.append(Character.forDigit(value & 0xF, 16));
        }
        return out.toString();
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
