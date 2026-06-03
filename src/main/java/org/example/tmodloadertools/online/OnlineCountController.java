package org.example.tmodloadertools.online;

import jakarta.servlet.http.HttpServletRequest;
import org.example.tmodloadertools.stats.VisitStatsService;
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

@RestController
public class OnlineCountController {

    private static final long BROADCAST_INTERVAL_MS = 8_000;

    private final VisitStatsService visitStatsService;
    private final Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "trtools-online-count-broadcast");
        t.setDaemon(true);
        return t;
    });

    public OnlineCountController(VisitStatsService visitStatsService) {
        this.visitStatsService = visitStatsService;
        scheduler.scheduleAtFixedRate(this::broadcastCount, BROADCAST_INTERVAL_MS, BROADCAST_INTERVAL_MS, TimeUnit.MILLISECONDS);
    }

    @GetMapping(value = {"/count", "/trtools/count"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Integer> count() {
        return Map.of("count", visitStatsService.currentHourUniqueCount());
    }

    @GetMapping(value = {"/events", "/trtools/events"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> events(HttpServletRequest request) {
        visitStatsService.recordVisit(ClientIpUtil.clientIp(request));

        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Cache-Control", "no-cache, no-transform");
        headers.set("X-Accel-Buffering", "no");
        headers.set("Connection", "keep-alive");

        sendCount(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        return ResponseEntity.ok().headers(headers).body(emitter);
    }

    public void broadcastCount() {
        Map<String, Integer> msg = Map.of("count", visitStatsService.currentHourUniqueCount());
        for (SseEmitter emitter : emitters) {
            sendCount(emitter, msg);
        }
    }

    private void sendCount(SseEmitter emitter) {
        sendCount(emitter, Map.of("count", visitStatsService.currentHourUniqueCount()));
    }

    private void sendCount(SseEmitter emitter, Map<String, Integer> msg) {
        try {
            emitter.send(msg);
        } catch (IOException | IllegalStateException e) {
            emitters.remove(emitter);
        }
    }
}
