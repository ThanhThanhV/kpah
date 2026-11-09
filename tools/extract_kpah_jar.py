#!/usr/bin/env python3
"""Extract original KPAH client resources and write a machine-readable archive inventory.

Usage:
  python tools/extract_kpah_jar.py KPAH_278.jar
  python tools/extract_kpah_jar.py KPAH_278.jar --output public/assets/kpah-original

Class files are intentionally not extracted into the web asset directory.
The original JAR remains the canonical evidence artifact.
"""
from __future__ import annotations

import argparse
import json
import zipfile
from collections import Counter
from pathlib import Path, PurePosixPath


def safe_target(root: Path, name: str) -> Path:
    relative = PurePosixPath(name)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"Unsafe archive path: {name!r}")
    target = root.joinpath(*relative.parts)
    if root.resolve() not in (target.resolve(), *target.resolve().parents):
        raise ValueError(f"Archive path escapes output directory: {name!r}")
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jar", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/assets/kpah-original"))
    parser.add_argument("--include-classes", action="store_true",
                        help="Also extract .class files (not needed by the browser client)")
    args = parser.parse_args()

    if not args.jar.is_file():
        parser.error(f"JAR not found: {args.jar}")

    args.output.mkdir(parents=True, exist_ok=True)
    entries = []
    extracted = 0
    with zipfile.ZipFile(args.jar) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            name = info.filename
            suffix = PurePosixPath(name).suffix.lower()
            item = {
                "path": name,
                "size": info.file_size,
                "compressedSize": info.compress_size,
                "extension": suffix or "[no-extension]",
                "isClass": suffix == ".class",
            }
            entries.append(item)
            if suffix == ".class" and not args.include_classes:
                continue
            target = safe_target(args.output, name)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(info))
            extracted += 1

    counts = Counter(item["extension"] for item in entries)
    manifest = {
        "source": args.jar.name,
        "entryCount": len(entries),
        "extractedCount": extracted,
        "classCount": sum(1 for item in entries if item["isClass"]),
        "extensionCounts": dict(sorted(counts.items())),
        "entries": entries,
    }
    manifest_path = args.output / "archive-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                             encoding="utf-8")
    print(f"Entries: {len(entries)}")
    print(f"Classes: {manifest['classCount']} (excluded={not args.include_classes})")
    print(f"Extracted files: {extracted}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
