# -*- coding: utf-8 -*-
"""Fix remaining U+FFFD-truncated placeholders in trtools HTML."""
import pathlib
import re

d = pathlib.Path(__file__).resolve().parent / "src/main/resources/static/trtools/html"

# (pattern, replacement) regex on full file text
subs = [
    (r"tModUnpacker\s*\ufffd\?tModWebTools", "tModUnpacker — tModWebTools"),
    (r"切片图工\ufffd</span>", "切片图工具</span>"),
    (r"躯干格式转换\ufffd</span>", "躯干格式转换器</span>"),
    (r"物块生成\ufffd</span>", "物块生成器</span>"),
    (r"角色存档编辑\ufffd</span>", "角色存档编辑器</span>"),
    (r'(<span data-i18n="online\.suffix">)\ufffd(</span>)', r"\1人\2"),
    (r"拖拽 \.tmod 到这\ufffd</div>", "拖拽 .tmod 到这里</div>"),
    (r"开始解\ufffd</span>", "开始解包</span>"),
    (r"联系\ufffd</span>", "联系我</span>"),
]

for f in sorted(d.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    o = t
    for pat, rep in subs:
        t = re.sub(pat, rep, t)
    if t != o:
        f.write_text(t, encoding="utf-8", newline="\n")
        print("fixed2", f.name)
