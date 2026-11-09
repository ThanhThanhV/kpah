#!/usr/bin/env python3
"""Extract original KPAH client resources and decode verified packed resource files.

Usage:
  python tools/extract_kpah_jar.py KPAH_278.jar
  python tools/extract_kpah_jar.py KPAH_278.jar --output public/assets/kpah-original
  python tools/extract_kpah_jar.py KPAH_278.jar --no-decode-packed

Class files are intentionally excluded from the browser asset directory.
The original JAR remains the canonical evidence artifact.
"""
from __future__ import annotations

import argparse
import json
import zipfile
from collections import Counter
from pathlib import Path, PurePosixPath


SH_XOR_KEY = b"NguyenVanMinh"


def safe_target(root: Path, name: str) -> Path:
    relative = PurePosixPath(name)
    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
        raise ValueError(f"Unsafe archive path: {name!r}")
    target = root.joinpath(*relative.parts)
    if root.resolve() not in (target.resolve(), *target.resolve().parents):
        raise ValueError(f"Archive path escapes output directory: {name!r}")
    return target


def xor_repeating(data: bytes, key: bytes = SH_XOR_KEY) -> bytes:
    return bytes(value ^ key[index % len(key)] for index, value in enumerate(data))


def decode_packed(data: bytes) -> list[tuple[str, bytes]]:
    """Decode the indexed/XOR container used by the original ba resource loader (.sh/.wp/.wps)."""
    if not data:
        raise ValueError("Empty .sh resource pack")

    pos = 0
    entry_count = data[pos]
    pos += 1
    index: list[tuple[str, int]] = []
    payload_size = 0

    for entry_number in range(entry_count):
        if pos >= len(data):
            raise ValueError(f"Truncated .sh header before entry {entry_number}")

        # The original client reads the name length with DataInputStream.readByte().
        name_length = data[pos]
        if name_length >= 0x80:
            name_length -= 0x100
        pos += 1
        if name_length <= 0 or pos + name_length + 2 > len(data):
            raise ValueError(f"Invalid .sh name length at entry {entry_number}")

        raw_name = xor_repeating(data[pos:pos + name_length])
        pos += name_length
        try:
            name = raw_name.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError(f"Invalid UTF-8 resource name at entry {entry_number}") from exc

        size = int.from_bytes(data[pos:pos + 2], "big")
        pos += 2
        if not name or PurePosixPath(name).is_absolute() or ".." in PurePosixPath(name).parts:
            raise ValueError(f"Unsafe internal .sh resource path: {name!r}")

        index.append((name, size))
        payload_size += size

    if pos + payload_size != len(data):
        raise ValueError(
            f".sh payload size mismatch: header={payload_size}, "
            f"available={len(data) - pos}"
        )

    payload = xor_repeating(data[pos:pos + payload_size])
    decoded: list[tuple[str, bytes]] = []
    offset = 0
    seen: set[str] = set()
    for name, size in index:
        if name in seen:
            raise ValueError(f"Duplicate internal .sh resource name: {name!r}")
        seen.add(name)
        decoded.append((name, payload[offset:offset + size]))
        offset += size
    return decoded


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jar", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/assets/kpah-original"))
    parser.add_argument("--include-classes", action="store_true",
                        help="Also extract .class files (not needed by the browser client)")
    parser.add_argument("--decode-packed", action=argparse.BooleanOptionalAction, default=True,
                        help="Decode .sh, .wp and .wps packs using the format verified in class ba (default: on)")
    args = parser.parse_args()

    if not args.jar.is_file():
        parser.error(f"JAR not found: {args.jar}")

    args.output.mkdir(parents=True, exist_ok=True)
    entries = []
    decoded_entries = []
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

            raw = archive.read(info)
            target = safe_target(args.output, name)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
            extracted += 1

            if suffix in {".sh", ".wp", ".wps"} and args.decode_packed:
                # Keep the established decoded-sh path; isolate splash packs by archive
                # directory and extension so identically named entries cannot collide.
                if suffix == ".sh":
                    decoded_root = args.output / "decoded-sh" / PurePosixPath(name).stem
                else:
                    archive_path = PurePosixPath(name)
                    decoded_root = (args.output / "decoded-packed" /
                                    archive_path.parent / f"{archive_path.stem}{suffix}")
                for internal_name, internal_data in decode_packed(raw):
                    internal_target = safe_target(decoded_root, internal_name)
                    internal_target.parent.mkdir(parents=True, exist_ok=True)
                    internal_target.write_bytes(internal_data)
                    decoded_entries.append({
                        "archive": name,
                        "packType": suffix,
                        "path": internal_name,
                        "size": len(internal_data),
                        "output": internal_target.relative_to(args.output).as_posix(),
                    })

    counts = Counter(item["extension"] for item in entries)
    manifest = {
        "source": args.jar.name,
        "entryCount": len(entries),
        "extractedCount": extracted,
        "classCount": sum(1 for item in entries if item["isClass"]),
        "extensionCounts": dict(sorted(counts.items())),
        "decodedPackedCount": len(decoded_entries),
        "decodedPackedEntries": decoded_entries,
        "entries": entries,
    }
    manifest_path = args.output / "archive-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                             encoding="utf-8")
    print(f"Entries: {len(entries)}")
    print(f"Classes: {manifest['classCount']} (excluded={not args.include_classes})")
    print(f"Extracted files: {extracted}")
    print(f"Decoded packed resources (.sh/.wp/.wps): {len(decoded_entries)}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
