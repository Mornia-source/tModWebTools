package org.example.tmodloadertools.tmodunpacker;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class TModUnpackerService {

    public byte[] unpackToZipBytes(MultipartFile file) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream(1024 * 1024);
        unpackToZipStream(file, bos);
        return bos.toByteArray();
    }

    public void unpackToZipStream(MultipartFile file, OutputStream outputStream) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("未选择文件");
        }

        byte[] bytes = file.getBytes();
        TModUnpackCore.ParsedMod mod = TModUnpackCore.parse(bytes);
        List<TModUnpackCore.FileEntry> entries = TModUnpackCore.listFiles(mod);

        try (ZipOutputStream zos = new ZipOutputStream(outputStream)) {
            for (TModUnpackCore.FileEntry fe : entries) {
                byte[] data = TModUnpackCore.readFileBytes(mod, fe);

                String name = fe.path();
                if (name == null || name.isBlank()) {
                    continue;
                }

                // 对齐 C#：.rawimg -> .png
                if (name.toLowerCase().endsWith(".rawimg")) {
                    data = RawImgConverter.rawImgToPng(data);
                    name = name.substring(0, name.length() - ".rawimg".length()) + ".png";
                }

                ZipEntry ze = new ZipEntry(mod.modName() + "/" + name);
                zos.putNextEntry(ze);
                zos.write(data);
                zos.closeEntry();
            }
        }
    }
}

