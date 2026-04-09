package org.example.tmodloadertools.tmodunpacker;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * 最小实现：兼容 .NET BinaryReader 的 ReadString（7-bit 编码长度 + UTF-8）。
 * 以及 little-endian 的 Int32。
 */
final class DotNetBinaryReader {
    private final InputStream in;

    DotNetBinaryReader(InputStream in) {
        this.in = in;
    }

    int readInt32LE() throws IOException {
        int b1 = in.read();
        int b2 = in.read();
        int b3 = in.read();
        int b4 = in.read();
        if ((b1 | b2 | b3 | b4) < 0) throw new EOFException();
        return (b1 & 0xff) | ((b2 & 0xff) << 8) | ((b3 & 0xff) << 16) | ((b4 & 0xff) << 24);
    }

    long skipFully(long n) throws IOException {
        long left = n;
        while (left > 0) {
            long s = in.skip(left);
            if (s <= 0) {
                // 尝试读一个字节推进
                if (in.read() < 0) break;
                left--;
            } else {
                left -= s;
            }
        }
        return n - left;
    }

    byte[] readBytesExact(int len) throws IOException {
        byte[] buf = new byte[len];
        int off = 0;
        while (off < len) {
            int r = in.read(buf, off, len - off);
            if (r < 0) throw new EOFException();
            off += r;
        }
        return buf;
    }

    String readDotNetString() throws IOException {
        int len = read7BitEncodedInt();
        if (len < 0) throw new IOException("Invalid string length");
        if (len == 0) return "";
        byte[] bytes = readBytesExact(len);
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private int read7BitEncodedInt() throws IOException {
        int count = 0;
        int shift = 0;
        while (shift != 35) {
            int b = in.read();
            if (b < 0) throw new EOFException();
            count |= (b & 0x7F) << shift;
            shift += 7;
            if ((b & 0x80) == 0) return count;
        }
        throw new IOException("Invalid 7-bit encoded int");
    }
}

