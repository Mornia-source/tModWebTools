package org.example.tmodloadertools.stats;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 按「自然日 + 小时」统计独立访客（同一 IP 在同一小时内只计 1 次）。
 * 数据持久化到 jar 同级目录的 {@link #CSV_FILE_NAME}，进程重启后从文件恢复。
 */
@Service
public class VisitStatsService {

    private static final Logger log = LoggerFactory.getLogger(VisitStatsService.class);

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    /** 内存与 CSV 中保留的天数（含今天），更早的日期会被丢弃 */
    private static final int RETENTION_DAYS = 30;
    static final String CSV_FILE_NAME = "trtools-visit-stats.csv";

    /** key: yyyy-MM-dd#0..23 */
    private final ConcurrentHashMap<String, Set<String>> uniqueIpsByDayHour = new ConcurrentHashMap<>();

    private final Path csvPath = JarNeighborPaths.jarDirectory().resolve(CSV_FILE_NAME);
    private final AtomicBoolean dirty = new AtomicBoolean(false);
    private final ScheduledExecutorService saveScheduler =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "trtools-visit-stats-csv");
                t.setDaemon(true);
                return t;
            });

    @PostConstruct
    void start() {
        log.info("访问统计 CSV 路径: {}", csvPath.toAbsolutePath());
        loadFromCsv();
        saveScheduler.scheduleAtFixedRate(this::flushIfDirty, 45, 45, TimeUnit.SECONDS);
    }

    @PreDestroy
    void shutdown() {
        saveScheduler.shutdown();
        try {
            if (!saveScheduler.awaitTermination(8, TimeUnit.SECONDS)) {
                saveScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            saveScheduler.shutdownNow();
        }
        flushToDisk();
    }

    public void recordVisit(String normalizedIp) {
        if (normalizedIp == null || normalizedIp.isBlank()) {
            normalizedIp = "unknown";
        }
        LocalDate today = LocalDate.now(ZONE);
        int hour = java.time.LocalTime.now(ZONE).getHour();
        String slot = today + "#" + hour;
        uniqueIpsByDayHour.computeIfAbsent(slot, k -> ConcurrentHashMap.newKeySet()).add(normalizedIp);
        pruneOlderThanRetention(today);
        dirty.set(true);
    }

    private void pruneOlderThanRetention(LocalDate today) {
        LocalDate cutoff = today.minusDays(RETENTION_DAYS - 1L);
        for (String key : new ArrayList<>(uniqueIpsByDayHour.keySet())) {
            int hash = key.indexOf('#');
            if (hash < 10) {
                uniqueIpsByDayHour.remove(key);
                continue;
            }
            try {
                LocalDate d = LocalDate.parse(key.substring(0, 10));
                if (d.isBefore(cutoff)) {
                    uniqueIpsByDayHour.remove(key);
                }
            } catch (Exception e) {
                uniqueIpsByDayHour.remove(key);
            }
        }
    }

    public Map<String, Object> todaySeries() {
        LocalDate today = LocalDate.now(ZONE);
        String dayStr = today.toString();
        List<String> labels = new ArrayList<>(24);
        List<Integer> visitors = new ArrayList<>(24);
        for (int h = 0; h < 24; h++) {
            labels.add(String.format("%02d:00", h));
            String slot = dayStr + "#" + h;
            Set<String> set = uniqueIpsByDayHour.get(slot);
            visitors.add(set == null ? 0 : set.size());
        }
        return Map.of(
                "date", dayStr,
                "timezone", "Asia/Shanghai",
                "labels", labels,
                "visitors", visitors
        );
    }

    private void flushIfDirty() {
        if (dirty.compareAndSet(true, false)) {
            flushToDisk();
        }
    }

    private void loadFromCsv() {
        if (!Files.isRegularFile(csvPath)) {
            return;
        }
        try {
            List<String> lines = Files.readAllLines(csvPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line.isBlank() || line.startsWith("date,")) {
                    continue;
                }
                String[] parts = line.split(",", 3);
                if (parts.length < 3) {
                    continue;
                }
                String dateStr = trimCsvField(parts[0]);
                String hourStr = trimCsvField(parts[1]);
                String ip = trimCsvField(parts[2]);
                if (ip.isEmpty()) {
                    ip = "unknown";
                }
                int hour;
                try {
                    hour = Integer.parseInt(hourStr);
                } catch (NumberFormatException e) {
                    continue;
                }
                if (hour < 0 || hour > 23) {
                    continue;
                }
                LocalDate d;
                try {
                    d = LocalDate.parse(dateStr);
                } catch (Exception e) {
                    continue;
                }
                LocalDate today = LocalDate.now(ZONE);
                LocalDate cutoff = today.minusDays(RETENTION_DAYS - 1L);
                if (d.isBefore(cutoff)) {
                    continue;
                }
                String slot = dateStr + "#" + hour;
                uniqueIpsByDayHour.computeIfAbsent(slot, k -> ConcurrentHashMap.newKeySet()).add(ip);
            }
            pruneOlderThanRetention(LocalDate.now(ZONE));
        } catch (IOException e) {
            log.warn("读取访问统计 CSV 失败，将以空数据启动: {}", e.getMessage());
        }
    }

    private void flushToDisk() {
        Map<String, Set<String>> snapshot = new HashMap<>();
        for (Map.Entry<String, Set<String>> e : uniqueIpsByDayHour.entrySet()) {
            snapshot.put(e.getKey(), new HashSet<>(e.getValue()));
        }
        Path dir = csvPath.getParent();
        try {
            if (dir != null && !Files.isDirectory(dir)) {
                Files.createDirectories(dir);
            }
        } catch (IOException e) {
            return;
        }
        Path tmp = csvPath.resolveSibling(csvPath.getFileName().toString() + ".tmp");
        try (BufferedWriter w = Files.newBufferedWriter(tmp, StandardCharsets.UTF_8)) {
            w.write("date,hour,ip\n");
            List<String> keys = new ArrayList<>(snapshot.keySet());
            keys.sort(String::compareTo);
            for (String slot : keys) {
                int hash = slot.indexOf('#');
                if (hash < 10) {
                    continue;
                }
                String datePart = slot.substring(0, hash);
                String hourPart = slot.substring(hash + 1);
                for (String ip : snapshot.get(slot)) {
                    w.write(escapeCsvField(datePart));
                    w.write(',');
                    w.write(escapeCsvField(hourPart));
                    w.write(',');
                    w.write(escapeCsvField(ip));
                    w.write('\n');
                }
            }
        } catch (IOException e) {
            try {
                Files.deleteIfExists(tmp);
            } catch (IOException ignored) {
            }
            return;
        }
        try {
            Files.move(tmp, csvPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException e) {
            try {
                Files.move(tmp, csvPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException ex) {
                try {
                    Files.deleteIfExists(tmp);
                } catch (IOException ignored) {
                }
            }
        } catch (IOException e) {
            try {
                Files.deleteIfExists(tmp);
            } catch (IOException ignored) {
            }
        }
    }

    private static String escapeCsvField(String s) {
        if (s == null) {
            return "";
        }
        if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private static String trimCsvField(String s) {
        if (s == null) {
            return "";
        }
        String t = s.trim();
        if (t.length() >= 2 && t.startsWith("\"") && t.endsWith("\"")) {
            return t.substring(1, t.length() - 1).replace("\"\"", "\"");
        }
        return t;
    }
}
