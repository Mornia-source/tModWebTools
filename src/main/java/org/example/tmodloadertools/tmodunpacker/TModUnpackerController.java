package org.example.tmodloadertools.tmodunpacker;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping
public class TModUnpackerController {

    private final TModUnpackerService service;

    public TModUnpackerController(TModUnpackerService service) {
        this.service = service;
    }

    @PostMapping(
            value = {"/trtools/unpack", "/api/unpack"},
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> unpack(@RequestParam("file") MultipartFile file) {
        String original = file != null ? file.getOriginalFilename() : null;
        String baseName = "unpacked";
        if (original != null && !original.isBlank()) {
            int dot = original.lastIndexOf('.');
            baseName = dot > 0 ? original.substring(0, dot) : original;
        }

        final byte[] zipBytes;
        try {
            zipBytes = service.unpackToZipBytes(file);
        } catch (Exception e) {
            String msg = e != null && e.getMessage() != null ? e.getMessage() : "解包失败";
            return ResponseEntity.badRequest().contentType(MediaType.TEXT_PLAIN).body(msg);
        }

        String zipName = baseName + "-tmodunpacker.zip";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zipName + "\"");
        return ResponseEntity.ok().headers(headers).body(zipBytes);
    }
}

