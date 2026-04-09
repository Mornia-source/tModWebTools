package org.example.tmodloadertools.tmodunpacker;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * 对齐 C# RawImage.RawToPng：
 * - 跳过 4 字节
 * - width(int32 LE), height(int32 LE)
 * - 像素按 RGBA 顺序读取
 */
final class RawImgConverter {

    private RawImgConverter() {}

    static byte[] rawImgToPng(byte[] rawImgBytes) throws IOException {
        if (rawImgBytes == null || rawImgBytes.length < 12) {
            throw new IOException("rawimg 数据过小");
        }
        ByteArrayInputStream in = new ByteArrayInputStream(rawImgBytes);
        DotNetBinaryReader br = new DotNetBinaryReader(in);
        br.skipFully(4);
        int width = br.readInt32LE();
        int height = br.readInt32LE();
        if (width <= 0 || height <= 0 || width > 20000 || height > 20000) {
            throw new IOException("rawimg 宽高非法：" + width + "x" + height);
        }

        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        int pixels = width * height;
        for (int i = 0; i < pixels; i++) {
            int r = in.read();
            int g = in.read();
            int b = in.read();
            int a = in.read();
            if ((r | g | b | a) < 0) {
                throw new IOException("rawimg 数据截断");
            }
            int argb = ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
            int x = i % width;
            int y = i / width;
            img.setRGB(x, y, argb);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(16_384, rawImgBytes.length));
        if (!ImageIO.write(img, "png", out)) {
            throw new IOException("PNG 编码失败");
        }
        return out.toByteArray();
    }
}

