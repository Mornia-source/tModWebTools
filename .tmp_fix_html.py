# -*- coding: utf-8 -*-
import pathlib

d = pathlib.Path(__file__).resolve().parent / "src/main/resources/static/trtools/html"
fixes = [
    ('title="\u6536\u8d77\u4fa7\u8fb9\ufffd? aria-expanded=', 'title="\u6536\u8d77\u4fa7\u8fb9\u680f" aria-expanded='),
    ('aria-label="\u6536\u8d77\u4fa7\u8fb9\ufffd?>', 'aria-label="\u6536\u8d77\u4fa7\u8fb9\u680f">'),
    ('aria-label="\u6536\u8d77\u4fa7\u8fb9\ufffd? aria-expanded=', 'aria-label="\u6536\u8d77\u4fa7\u8fb9\u680f" aria-expanded='),
]
for f in sorted(d.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    o = t
    for a, b in fixes:
        t = t.replace(a, b)
    if t != o:
        f.write_text(t, encoding="utf-8", newline="\n")
        print("patched", f.name)
