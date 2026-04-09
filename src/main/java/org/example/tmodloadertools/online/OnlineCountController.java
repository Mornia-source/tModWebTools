package org.example.tmodloadertools.online;

import jakarta.servlet.http.HttpServletRequest;
import org.example.tmodloadertools.util.ClientIpUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
public class OnlineCountController {
    /**
     * 按“唯一 IP”统计在线人数：
     * - refresh 会重复建立 SSE 连接，但同一 IP 只记一次
     * - 同时用 TTL 定时清理“可能未及时断开的旧连接对应 IP”
     */
    private static final long IP_TTL_MS = 45_000; // 超过该时间未出现新连接，视为离线
    private static final long CLEAN_INTERVAL_MS = 5_000;

    // ip -> 最近一次活动时间
    private final ConcurrentHashMap<String, Long> lastSeenByIp = new ConcurrentHashMap<>();
    // ip -> 该 IP 下的所有 SSE 连接（多标签页也不增加人数，只用于推送）
    private final ConcurrentHashMap<String, Set<SseEmitter>> emittersByIp = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final AtomicBoolean cleanupRunning = new AtomicBoolean(false);

    public OnlineCountController() {
        scheduler.scheduleAtFixedRate(this::cleanupExpiredIps, CLEAN_INTERVAL_MS, CLEAN_INTERVAL_MS, TimeUnit.MILLISECONDS);
    }

    @GetMapping(value = {"/count", "/trtools/count"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Integer> count(HttpServletRequest request) {
        cleanupExpiredIps();
        return Map.of("count", lastSeenByIp.size());
    }

    @GetMapping(value = {"/events", "/trtools/events"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> events(HttpServletRequest request) {
        String ip = ClientIpUtil.clientIp(request);
        if (ip == null || ip.isBlank()) ip = "unknown";
        final String ipFinal = ip;

        // 更新 IP 活跃时间
        long now = System.currentTimeMillis();
        lastSeenByIp.put(ip, now);

        SseEmitter emitter = new SseEmitter(0L); // TTL 负责“离线清理”
        emittersByIp.computeIfAbsent(ip, k -> ConcurrentHashMap.newKeySet()).add(emitter);

        HttpHeaders headers = new HttpHeaders();
        // 避免反代/网关缓冲 SSE 响应导致客户端“收不到更新”
        headers.set("Cache-Control", "no-cache, no-transform");
        headers.set("X-Accel-Buffering", "no");
        headers.set("Connection", "keep-alive");

        // 建连后立刻推送一次当前人数
        broadcast();
        try {
            emitter.send(Map.of("count", lastSeenByIp.size()));
        } catch (IOException | IllegalStateException e) {
            removeEmitter(ipFinal, emitter);
        }

        emitter.onCompletion(() -> removeEmitter(ipFinal, emitter));
        emitter.onTimeout(() -> removeEmitter(ipFinal, emitter));
        emitter.onError((ex) -> removeEmitter(ipFinal, emitter));

        return ResponseEntity.ok().headers(headers).body(emitter);
    }

    private void removeEmitter(String ip, SseEmitter emitter) {
        Set<SseEmitter> set = emittersByIp.get(ip);
        if (set != null) {
            set.remove(emitter);
            if (set.isEmpty()) {
                emittersByIp.remove(ip);
                // lastSeenByIp 不立刻删除：让 TTL 统一清理，避免 refresh 瞬间跳变
            }
        }
        broadcast();
    }

    private void broadcast() {
        cleanupExpiredIps();
        Map<String, Integer> msg = Map.of("count", lastSeenByIp.size());

        for (Map.Entry<String, Set<SseEmitter>> e : emittersByIp.entrySet()) {
            for (SseEmitter emitter : e.getValue()) {
                try {
                    emitter.send(msg);
                } catch (IOException | IllegalStateException ex) {
                    removeEmitter(e.getKey(), emitter);
                }
            }
        }
    }

    private void cleanupExpiredIps() {
        if (!cleanupRunning.compareAndSet(false, true)) return;
        try {
            long now = System.currentTimeMillis();
            // 仍有活跃 SSE 的 IP 持续刷新活动时间，避免“长连接仍在但 45s 后被误清理”导致人数在 0/1/2 间跳
            for (Map.Entry<String, Set<SseEmitter>> e : emittersByIp.entrySet()) {
                Set<SseEmitter> set = e.getValue();
                if (set != null && !set.isEmpty()) {
                    lastSeenByIp.put(e.getKey(), now);
                }
            }
            for (Map.Entry<String, Long> en : lastSeenByIp.entrySet()) {
                String ip = en.getKey();
                long last = en.getValue() == null ? 0L : en.getValue();
                if (now - last > IP_TTL_MS) {
                    lastSeenByIp.remove(ip);
                    Set<SseEmitter> set = emittersByIp.remove(ip);
                    if (set != null) {
                        for (SseEmitter emitter : set) {
                            try {
                                emitter.complete();
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            }
        } finally {
            cleanupRunning.set(false);
        }
    }

}

