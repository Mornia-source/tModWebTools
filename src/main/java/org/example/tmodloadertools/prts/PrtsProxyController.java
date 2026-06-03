package org.example.tmodloadertools.prts;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/trtools/prts")
public class PrtsProxyController {

    private final String apiUrl;
    private final int maxRetries;
    private final int requestTimeoutSeconds;
    private final HttpClient httpClient;

    public PrtsProxyController(
            @Value("${trtools.prts.api-url:https://prts.wiki/api.php}") String apiUrl,
            @Value("${trtools.prts.connect-timeout-seconds:30}") int connectTimeoutSeconds,
            @Value("${trtools.prts.request-timeout-seconds:90}") int requestTimeoutSeconds,
            @Value("${trtools.prts.max-retries:3}") int maxRetries) {
        this.apiUrl = apiUrl;
        this.maxRetries = Math.max(1, maxRetries);
        this.requestTimeoutSeconds = Math.max(10, requestTimeoutSeconds);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(Math.max(5, connectTimeoutSeconds)))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    @GetMapping(value = "/wikitext", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> fetchWikitext(@RequestParam("name") String operatorName) {
        if (operatorName == null || operatorName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "干员名不能为空"));
        }

        try {
            String query = "action=query&prop=revisions&titles="
                    + URLEncoder.encode(operatorName.trim(), StandardCharsets.UTF_8)
                    + "&rvprop=content&format=json";
            String url = apiUrl.contains("?") ? apiUrl + "&" + query : apiUrl + "?" + query;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(requestTimeoutSeconds))
                    .GET()
                    .header("User-Agent", "tModWebTools/PRTS-Armor-Generator")
                    .header("Accept", "application/json")
                    .header("Accept-Language", "zh-CN,zh;q=0.9")
                    .build();

            HttpResponse<String> response = sendWithRetry(request);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return ResponseEntity.internalServerError().body(Map.of("error", "PRTS 请求失败: HTTP " + response.statusCode()));
            }

            String body = response.body();
            String pageId = extractFirstPageId(body);
            if (pageId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "PRTS 返回数据异常"));
            }
            if ("-1".equals(pageId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "干员 " + operatorName + " 不存在"));
            }

            String wikitext = extractRevisionsWikitext(body);
            if (wikitext == null || wikitext.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "未找到干员页面内容"));
            }

            return ResponseEntity.ok(Map.of("wikitext", wikitext));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", friendlyError(e)));
        }
    }

    private HttpResponse<String> sendWithRetry(HttpRequest request) throws Exception {
        Exception last = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            } catch (Exception e) {
                last = e;
                if (attempt < maxRetries && isRetryable(e)) {
                    Thread.sleep(1500L * attempt);
                    continue;
                }
                throw e;
            }
        }
        throw last;
    }

    private static boolean isRetryable(Exception e) {
        if (e instanceof HttpConnectTimeoutException || e instanceof HttpTimeoutException) {
            return true;
        }
        String msg = e.getMessage();
        if (msg == null) {
            return false;
        }
        String lower = msg.toLowerCase();
        return lower.contains("timed out")
                || lower.contains("timeout")
                || lower.contains("connection reset")
                || lower.contains("connection refused")
                || lower.contains("no route to host");
    }

    private static String friendlyError(Exception e) {
        if (e instanceof HttpConnectTimeoutException) {
            return "连接 PRTS Wiki 超时，请确认服务器能访问 prts.wiki 后重试";
        }
        if (e instanceof HttpTimeoutException) {
            return "读取 PRTS Wiki 响应超时，请稍后重试";
        }
        String msg = e.getMessage();
        if (msg != null && msg.toLowerCase().contains("timed out")) {
            return "连接 PRTS Wiki 超时，请确认服务器能访问 prts.wiki 后重试";
        }
        return msg != null ? msg : "PRTS 请求失败";
    }

    private static String extractFirstPageId(String body) {
        int pagesIdx = body.indexOf("\"pages\"");
        if (pagesIdx < 0) return null;
        int braceIdx = body.indexOf('{', pagesIdx);
        if (braceIdx < 0) return null;
        int quoteStart = body.indexOf('"', braceIdx + 1);
        if (quoteStart < 0) return null;
        int quoteEnd = body.indexOf('"', quoteStart + 1);
        if (quoteEnd < 0) return null;
        return body.substring(quoteStart + 1, quoteEnd);
    }

    private static String extractRevisionsWikitext(String body) {
        int pagesIdx = body.indexOf("\"pages\"");
        if (pagesIdx < 0) return null;
        int revIdx = body.indexOf("\"revisions\"", pagesIdx);
        if (revIdx < 0) return null;
        int arrayIdx = body.indexOf('[', revIdx);
        if (arrayIdx < 0 || arrayIdx - revIdx > 20) return null;
        int starIdx = body.indexOf("\"*\"", arrayIdx);
        if (starIdx < 0) return null;
        int colonIdx = body.indexOf(':', starIdx);
        if (colonIdx < 0) return null;
        int openQuote = body.indexOf('"', colonIdx + 1);
        if (openQuote < 0) return null;
        return readJsonString(body, openQuote);
    }

    private static String readJsonString(String body, int openQuoteIdx) {
        StringBuilder out = new StringBuilder();
        for (int i = openQuoteIdx + 1; i < body.length(); i++) {
            char ch = body.charAt(i);
            if (ch == '\\' && i + 1 < body.length()) {
                char next = body.charAt(++i);
                switch (next) {
                    case '"', '\\', '/' -> out.append(next);
                    case 'b' -> out.append('\b');
                    case 'f' -> out.append('\f');
                    case 'n' -> out.append('\n');
                    case 'r' -> out.append('\r');
                    case 't' -> out.append('\t');
                    case 'u' -> {
                        if (i + 4 < body.length()) {
                            String hex = body.substring(i + 1, i + 5);
                            out.append((char) Integer.parseInt(hex, 16));
                            i += 4;
                        }
                    }
                    default -> out.append(next);
                }
            } else if (ch == '"') {
                return out.toString();
            } else {
                out.append(ch);
            }
        }
        return null;
    }
}
