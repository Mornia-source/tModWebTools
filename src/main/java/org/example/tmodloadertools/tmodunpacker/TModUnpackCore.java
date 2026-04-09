package org.example.tmodloadertools.tmodunpacker;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.Inflater;
import java.util.zip.InflaterInputStream;

import static java.nio.charset.StandardCharsets.US_ASCII;

/**
 * Java 版 tModUnpacker：按 C# 源码逻辑解析并导出文件（含旧格式整体 deflate 与新格式分文件 deflate）。
 */
final class TModUnpackCore {

    record FileEntry(String path, int size, int compressedLen, int dataOffset) {}

    record ParsedMod(String modName, Map<String, FileEntry> files, byte[] dataBlob, boolean oldFormat) {}

    private TModUnpackCore() {}

    static ParsedMod parse(byte[] tmodBytes) throws IOException {
        if (tmodBytes == null || tmodBytes.length < 8) {
            throw new IOException("文件过小，疑似不是有效的 .tmod");
        }

        ByteArrayInputStream headerIn = new ByteArrayInputStream(tmodBytes);
        DotNetBinaryReader br = new DotNetBinaryReader(headerIn);

        byte[] magic = br.readBytesExact(4);
        if (!"TMOD".equals(new String(magic, US_ASCII))) {
            throw new IOException("无法读取 TMOD 魔数（不是 .tmod）");
        }

        String loaderVerStr = br.readDotNetString();
        boolean old = compareVersion(loaderVerStr, "0.11") < 0;

        // hash(20) + signature(256) + skip4
        br.skipFully(20L + 256L + 4L);

        int restOffset = tmodBytes.length - headerIn.available();
        byte[] rest = new byte[tmodBytes.length - restOffset];
        System.arraycopy(tmodBytes, restOffset, rest, 0, rest.length);

        byte[] innerBlob = old ? inflateAll(rest) : rest;

        ByteArrayInputStream innerIn = new ByteArrayInputStream(innerBlob);
        DotNetBinaryReader ir = new DotNetBinaryReader(innerIn);

        String modName = ir.readDotNetString();
        ir.readDotNetString(); // modversion
        int fileCount = ir.readInt32LE();

        Map<String, FileEntry> files = new LinkedHashMap<>();

        if (old) {
            // 旧格式：文件数据直接顺序存放在 header 后面
            for (int i = 0; i < fileCount; i++) {
                String path = normalizePath(ir.readDotNetString());
                int size = ir.readInt32LE();
                int dataOffset = innerBlob.length - innerIn.available();
                ir.skipFully(size);
                files.put(path, new FileEntry(path, size, size, dataOffset));
            }
            return new ParsedMod(modName, files, innerBlob, true);
        }

        // 新格式：先读文件表，再读数据区（每个文件可能 deflate 压缩）
        record TempRow(String path, int size, int compressedLen, int start) {}
        List<TempRow> temp = new ArrayList<>(fileCount);
        int cursor = 0;
        for (int i = 0; i < fileCount; i++) {
            String path = normalizePath(ir.readDotNetString());
            int size = ir.readInt32LE();
            int compressedLen = ir.readInt32LE();
            temp.add(new TempRow(path, size, compressedLen, cursor));
            cursor += compressedLen;
        }

        int dataStart = innerBlob.length - innerIn.available();
        for (TempRow r : temp) {
            int dataOffset = dataStart + r.start;
            files.put(r.path, new FileEntry(r.path, r.size, r.compressedLen, dataOffset));
        }

        return new ParsedMod(modName, files, innerBlob, false);
    }

    static List<FileEntry> listFiles(ParsedMod mod) {
        List<FileEntry> list = new ArrayList<>(mod.files.values());
        list.sort(Comparator.comparing(FileEntry::path));
        return list;
    }

    static byte[] readFileBytes(ParsedMod mod, FileEntry fe) throws IOException {
        if (fe.dataOffset < 0 || fe.dataOffset + fe.compressedLen > mod.dataBlob.length) {
            throw new IOException("文件偏移越界：" + fe.path);
        }
        byte[] slice = new byte[fe.compressedLen];
        System.arraycopy(mod.dataBlob, fe.dataOffset, slice, 0, slice.length);

        if (mod.oldFormat || fe.compressedLen == fe.size) {
            return slice;
        }
        return inflateExact(slice, fe.size);
    }

    private static String normalizePath(String path) {
        if (path == null) return "";
        return path.replace("\\", "/");
    }

    private static byte[] inflateAll(byte[] deflated) throws IOException {
        return inflateTryBoth(deflated, Math.max(16_384, deflated.length * 2));
    }

    private static byte[] inflateExact(byte[] deflated, int expectedSize) throws IOException {
        byte[] data = inflateTryBoth(deflated, Math.max(expectedSize, 16_384));
        if (expectedSize >= 0 && data.length != expectedSize) {
            // 与原 C# 行为保持温和兼容：长度不一致不强制失败
        }
        return data;
    }

    private static byte[] inflateTryBoth(byte[] deflated, int initialSize) throws IOException {
        IOException last = null;
        // .NET DeflateStream 常见为 raw deflate（nowrap=true），先按该模式尝试
        boolean[] nowrapModes = new boolean[] { true, false };
        for (boolean nowrap : nowrapModes) {
            try (InflaterInputStream in = new InflaterInputStream(
                    new ByteArrayInputStream(deflated),
                    new Inflater(nowrap)
            );
                 ByteArrayOutputStream out = new ByteArrayOutputStream(initialSize)) {
                in.transferTo(out);
                return out.toByteArray();
            } catch (IOException e) {
                last = e;
            }
        }
        throw last != null ? last : new IOException("deflate 解压失败");
    }

    /**
     * 简单版本比较：按 '.' 分段整数比较；不足段视为 0。
     */
    private static int compareVersion(String a, String b) {
        int[] av = parseVersion(a);
        int[] bv = parseVersion(b);
        int n = Math.max(av.length, bv.length);
        for (int i = 0; i < n; i++) {
            int ai = i < av.length ? av[i] : 0;
            int bi = i < bv.length ? bv[i] : 0;
            if (ai != bi) return Integer.compare(ai, bi);
        }
        return 0;
    }

    private static int[] parseVersion(String s) {
        if (s == null) return new int[] {0};
        String[] parts = s.trim().split("\\.");
        int[] out = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            try {
                out[i] = Integer.parseInt(parts[i].replaceAll("[^0-9]", ""));
            } catch (Exception e) {
                out[i] = 0;
            }
        }
        return out;
    }
}

