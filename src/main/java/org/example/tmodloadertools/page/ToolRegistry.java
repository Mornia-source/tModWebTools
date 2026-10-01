package org.example.tmodloadertools.page;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 工具清单的唯一来源：classpath:/static/trtools/tools.json。
 * 每项 key 为 ?tool= 参数，page 为 /trtools/html/{page}.html。
 * 后端据此注册路由，前端（根页 index.html、hot-switch.js）通过 /trtools/js/tool-registry.js 读取。
 */
@Component
public class ToolRegistry {

    public record Tool(String key, String page) {
    }

    private static final String RESOURCE = "static/trtools/tools.json";
    private static final Pattern ENTRY = Pattern.compile(
            "\\{\\s*\"key\"\\s*:\\s*\"([a-z0-9-]+)\"\\s*,\\s*\"page\"\\s*:\\s*\"([a-z0-9-]+)\"\\s*}");

    private final String json;
    private final List<Tool> tools;
    private final Map<String, Tool> byPage = new LinkedHashMap<>();

    public ToolRegistry() {
        try {
            json = new String(new ClassPathResource(RESOURCE).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("无法读取工具清单 " + RESOURCE, e);
        }
        List<Tool> list = new ArrayList<>();
        Matcher m = ENTRY.matcher(json);
        while (m.find()) {
            Tool t = new Tool(m.group(1), m.group(2));
            list.add(t);
            byPage.put(t.page(), t);
        }
        if (list.isEmpty()) {
            throw new IllegalStateException("工具清单为空或格式不正确：" + RESOURCE);
        }
        tools = Collections.unmodifiableList(list);
    }

    public List<Tool> tools() {
        return tools;
    }

    public Tool byPage(String page) {
        return byPage.get(page);
    }

    /** 提供给前端的脚本：window.TWT_TOOLS = [{key, page}, …] */
    public String registryScript() {
        return "window.TWT_TOOLS = " + json.trim() + ";\n";
    }
}
