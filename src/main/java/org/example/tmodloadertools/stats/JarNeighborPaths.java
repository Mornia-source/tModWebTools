package org.example.tmodloadertools.stats;

import org.example.tmodloadertools.TModLoaderToolsApplication;
import org.springframework.boot.system.ApplicationHome;

import java.nio.file.Path;

/**
 * 可执行 jar 所在目录（与 jar 同级放置数据文件时使用）。
 * 开发时（IDE / mvn spring-boot:run）通常为 {@code target/}。
 */
public final class JarNeighborPaths {

    private JarNeighborPaths() {}

    public static Path jarDirectory() {
        ApplicationHome home = new ApplicationHome(TModLoaderToolsApplication.class);
        if (home.getDir() != null) {
            return home.getDir().toPath();
        }
        return Path.of(System.getProperty("user.dir", "."));
    }
}
