package org.example.tmodloadertools.util;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpUtil {

    private ClientIpUtil() {}

    /**
     * 解析“真实访客”IP。CDN（尤其 Cloudflare）直连源站时远端地址往往是 CDN 节点 IP；
     * Cloudflare 会把访客 IP 放在 {@code CF-Connecting-IP}（及企业版的 {@code True-Client-IP}）。源站前的 Nginx/反代需透传这些头。
     */
    public static String clientIp(HttpServletRequest request) {
        // Cloudflare：最可靠的访客 IP（需在反代中透传，见 application.properties 注释）
        String cf = trimHeader(request, "CF-Connecting-IP");
        if (cf != null) {
            return normalizeIp(cf);
        }
        String trueClient = trimHeader(request, "True-Client-IP");
        if (trueClient != null) {
            return normalizeIp(trueClient);
        }
        // 常见反代链：多段时取最左侧一般为最初客户端（RFC 7239 / 常见约定）
        String xff = trimHeader(request, "X-Forwarded-For");
        if (xff != null) {
            return normalizeIp(xff.split(",")[0].trim());
        }
        String xrip = trimHeader(request, "X-Real-IP");
        if (xrip != null) {
            return normalizeIp(xrip);
        }
        return normalizeIp(request.getRemoteAddr());
    }

    private static String trimHeader(HttpServletRequest request, String name) {
        String v = request.getHeader(name);
        if (v == null) {
            return null;
        }
        v = v.trim();
        return v.isEmpty() ? null : v;
    }

    /**
     * 本机同时用 IPv4/IPv6 访问时 remoteAddr 可能在 127.0.0.1 与 ::1 间切换，合并为同一键避免算成 2 人。
     */
    public static String normalizeIp(String raw) {
        if (raw == null || raw.isBlank()) {
            return "unknown";
        }
        String t = raw.trim();
        if ("127.0.0.1".equals(t) || "::1".equals(t) || "0:0:0:0:0:0:0:1".equals(t)) {
            return "loopback";
        }
        if (t.startsWith("::ffff:")) {
            String v4 = t.substring(7);
            if ("127.0.0.1".equals(v4)) {
                return "loopback";
            }
        }
        return t;
    }
}
