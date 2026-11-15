#!/usr/bin/env python3
"""Audit wordmark SVGs and build a dependency-free visual test sheet."""

import argparse
import html
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET


FORBIDDEN = {"text", "image", "filter", "mask", "clipPath"}


def local(tag):
    return tag.rsplit("}", 1)[-1]


def inspect(path):
    raw = path.read_text(encoding="utf-8")
    root = ET.fromstring(raw)
    tags = [local(el.tag) for el in root.iter()]
    forbidden = sorted(set(tags) & FORBIDDEN)
    paths = [el for el in root.iter() if local(el.tag) == "path"]
    strokes = [el for el in root.iter() if el.get("stroke") not in (None, "none")]
    viewbox = root.get("viewBox")
    title = next((el.text for el in root.iter() if local(el.tag) == "title"), None)
    coords = []
    for el in paths:
        coords.extend(re.findall(r"-?\d+(?:\.\d+)?", el.get("d", "")))
    colours = sorted(set(re.findall(r"#[0-9a-fA-F]{3,8}\b", raw)))
    issues = []
    if not viewbox:
        issues.append("missing viewBox")
    if not title:
        issues.append("missing title")
    if forbidden:
        issues.append("forbidden elements: " + ", ".join(forbidden))
    if len(coords) > 600:
        issues.append("high coordinate count")
    if len(colours) > 2:
        issues.append("more than two colours")
    return {
        "path": path,
        "raw": raw,
        "viewbox": viewbox or "—",
        "paths": len(paths),
        "coords": len(coords),
        "strokes": len(strokes),
        "colours": colours,
        "issues": issues,
    }


def data_uri(raw):
    import base64
    return "data:image/svg+xml;base64," + base64.b64encode(raw.encode()).decode()


def build_html(items, output):
    cards = []
    for item in items:
        uri = data_uri(item["raw"])
        status = "PASS" if not item["issues"] else "CHECK"
        issue_text = "; ".join(item["issues"]) or "No structural issues"
        ladders = "".join(f'<img src="{uri}" style="height:{h}px" alt="{h}px">' for h in (64, 32, 24, 16))
        cards.append(f"""
        <section class="card">
          <h2>{html.escape(item['path'].name)} <span>{status}</span></h2>
          <div class="hero"><img src="{uri}"></div>
          <div class="ladder">{ladders}</div>
          <div class="dark"><img src="{uri}"></div>
          <div class="lemon"><img src="{uri}"></div>
          <p>{html.escape(issue_text)}</p>
          <small>viewBox {html.escape(item['viewbox'])} · paths {item['paths']} · coordinates {item['coords']} · strokes {item['strokes']}</small>
        </section>""")
    doc = f"""<!doctype html><meta charset="utf-8"><title>Wordmark tests</title>
    <style>
    *{{box-sizing:border-box}} body{{margin:0;padding:32px;background:#eee;font:14px Arial,sans-serif;color:#111}}
    h1{{margin:0 0 24px}} .grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}}
    .card{{background:#fff;border-radius:16px;padding:20px}} h2{{display:flex;justify-content:space-between;margin:0 0 16px}}
    h2 span{{font-size:12px}} .hero,.dark,.lemon{{height:180px;display:flex;align-items:center;justify-content:center;padding:24px}}
    .hero img,.dark img,.lemon img{{max-width:100%;max-height:100%}} .dark{{background:#111;filter:invert(1)}}
    .lemon{{background:#ffdf22}} .ladder{{display:flex;align-items:end;gap:20px;height:90px;padding:12px 0}}
    .ladder img{{max-width:45%}} p{{font-weight:700}} small{{color:#666}}
    </style><h1>Fashion wordmark test sheet</h1><div class="grid">{''.join(cards)}</div>"""
    output.write_text(doc, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+")
    parser.add_argument("--html", default="wordmark-tests.html")
    args = parser.parse_args()
    items = []
    failed = False
    for name in args.files:
        try:
            item = inspect(Path(name))
            items.append(item)
            failed |= bool(item["issues"])
            print(f"{item['path'].name}: {'PASS' if not item['issues'] else 'CHECK'} — " + ("; ".join(item["issues"]) or "clean structure"))
        except Exception as exc:
            failed = True
            print(f"{name}: FAIL — {exc}", file=sys.stderr)
    if items:
        build_html(items, Path(args.html))
        print(f"wrote {args.html}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
