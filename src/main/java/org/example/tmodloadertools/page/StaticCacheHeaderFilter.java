package org.example.tmodloadertools.page;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * 统一静态资源缓存策略。
 * 不设 Cache-Control 时浏览器会按 Last-Modified 启发式缓存 HTML，部署新 jar 后旧页面仍引用
 * 已不存在的旧指纹文件，导致样式/脚本加载失败。因此：
 * - HTML（含根路径）：no-cache，每次向服务器校验，保证拿到最新的指纹引用；
 * - 带 10 位内容哈希的文件：一年 + immutable，内容变了文件名就会变；
 * - 其余 js/css/json（未加指纹的第三方库、数据）：no-cache；
 * - 图片/字体等：缓存一天。
 * 控制器自行设置了 Cache-Control 的响应不会被覆盖。
 */
@Component
public class StaticCacheHeaderFilter extends OncePerRequestFilter {

    private static final Pattern FINGERPRINTED = Pattern.compile(".+\\.[0-9a-f]{10}\\.(?:js|css|html)$");
    private static final Pattern REVALIDATE = Pattern.compile(".+\\.(?:html|js|mjs|css|json)$");
    private static final Pattern MEDIA = Pattern.compile(".+\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|wasm)$");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String value = cacheControlFor(request.getRequestURI().toLowerCase());
        if (value != null) {
            response.setHeader("Cache-Control", value);
        }
        chain.doFilter(request, response);
    }

    static String cacheControlFor(String path) {
        if (path.equals("/") || path.endsWith("/")) {
            return "no-cache";
        }
        if (FINGERPRINTED.matcher(path).matches()) {
            return "public, max-age=31536000, immutable";
        }
        if (REVALIDATE.matcher(path).matches()) {
            return "no-cache";
        }
        if (MEDIA.matcher(path).matches()) {
            return "public, max-age=86400";
        }
        return null;
    }
}
