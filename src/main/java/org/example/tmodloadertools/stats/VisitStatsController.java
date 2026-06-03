package org.example.tmodloadertools.stats;

import jakarta.servlet.http.HttpServletRequest;
import org.example.tmodloadertools.online.OnlineCountController;
import org.example.tmodloadertools.util.ClientIpUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@RestController
public class VisitStatsController {

    private final VisitStatsService visitStatsService;
    private final OnlineCountController onlineCountController;

    public VisitStatsController(VisitStatsService visitStatsService, OnlineCountController onlineCountController) {
        this.visitStatsService = visitStatsService;
        this.onlineCountController = onlineCountController;
    }

    // 页面加载时调用，记录一次当日该小时内的独立访客
    @PostMapping(value = {"/trtools/track", "/api/track"})
    public ResponseEntity<Void> track(HttpServletRequest request) {
        visitStatsService.recordVisit(ClientIpUtil.clientIp(request));
        onlineCountController.broadcastCount();
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = {"/trtools/track", "/api/track"})
    public ResponseEntity<Void> trackGet(HttpServletRequest request) {
        visitStatsService.recordVisit(ClientIpUtil.clientIp(request));
        onlineCountController.broadcastCount();
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = {"/trtools/stats/today", "/stats/today"}, produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> today() {
        return visitStatsService.todaySeries();
    }

    @GetMapping(value = {"/trtools/stats/day", "/stats/day"}, produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> day(@RequestParam(required = false) String date) {
        LocalDate d = LocalDate.now(ZoneId.of("Asia/Shanghai"));
        if (date != null && !date.isBlank()) {
            try {
                d = LocalDate.parse(date.trim());
            } catch (Exception ignored) {
            }
        }
        return visitStatsService.daySeries(d);
    }

    @GetMapping(value = {"/trtools/stats/daily", "/stats/daily"}, produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> daily(
            @RequestParam(defaultValue = "week") String range,
            @RequestParam(required = false) String period) {
        return visitStatsService.dailyRangeSeries(range, period);
    }

    @GetMapping(value = {"/trtools/stats/csv-info", "/stats/csv-info"}, produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> csvInfo() {
        return visitStatsService.csvInfo();
    }
}
