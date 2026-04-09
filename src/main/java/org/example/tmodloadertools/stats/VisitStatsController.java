package org.example.tmodloadertools.stats;

import jakarta.servlet.http.HttpServletRequest;
import org.example.tmodloadertools.util.ClientIpUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class VisitStatsController {

    private final VisitStatsService visitStatsService;

    public VisitStatsController(VisitStatsService visitStatsService) {
        this.visitStatsService = visitStatsService;
    }

    /** 页面加载时调用，记录一次当日该小时内的独立访客 */
    @PostMapping(value = {"/trtools/track", "/api/track"})
    public ResponseEntity<Void> track(HttpServletRequest request) {
        visitStatsService.recordVisit(ClientIpUtil.clientIp(request));
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = {"/trtools/track", "/api/track"})
    public ResponseEntity<Void> trackGet(HttpServletRequest request) {
        visitStatsService.recordVisit(ClientIpUtil.clientIp(request));
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = {"/trtools/stats/today", "/stats/today"}, produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> today() {
        return visitStatsService.todaySeries();
    }
}
