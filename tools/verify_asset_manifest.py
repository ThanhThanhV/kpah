#!/usr/bin/env python3
"""Verify decoded KPAH asset hashes and the content-derived manifest version."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys

SHA256_RE = re.compile(r"^[a-f0-9]{64}$", re.IGNORECASE)
VERSION_RE = re.compile(r"^[a-f0-9]{16}$", re.IGNORECASE)


def safe_asset_path(root: Path, relative: str) -> Path:
    if not isinstance(relative, str) or not relative or "\\" in relative or "\x00" in relative:
        raise ValueError(f"Invalid asset output path: {relative!r}")
    path = PurePosixPath(relative)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise ValueError(f"Unsafe asset output path: {relative!r}")
    target = root.joinpath(*path.parts).resolve()
    resolved_root = root.resolve()
    if target != resolved_root and resolved_root not in target.parents:
        raise ValueError(f"Asset path escapes output root: {relative!r}")
    return target


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def expected_asset_version(manifest: dict) -> str:
    entries = manifest.get("entries")
    decoded = manifest.get("decodedPackedEntries")
    if not isinstance(entries, list) or not isinstance(decoded, list):
        raise ValueError("Manifest thiếu entries hoặc decodedPackedEntries")
    files = []
    for item in entries:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str) or not SHA256_RE.fullmatch(str(item.get("sha256", ""))):
            raise ValueError("Archive entry thiếu path/sha256 hợp lệ")
        files.append((item["path"], item["sha256"]))
    for item in decoded:
        if not isinstance(item, dict) or not isinstance(item.get("output"), str) or not SHA256_RE.fullmatch(str(item.get("sha256", ""))):
            raise ValueError("Decoded entry thiếu output/sha256 hợp lệ")
        files.append((item["output"], item["sha256"]))
    material = json.dumps({
        "sourceSha256": manifest.get("sourceSha256"),
        "files": files,
    }, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(material).hexdigest()[:16]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("assets", type=Path, help="Directory containing archive-manifest.json and decoded files")
    parser.add_argument("--jar", type=Path, help="Optionally verify the original source JAR SHA-256")
    args = parser.parse_args()

    manifest_path = args.assets / "archive-manifest.json"
    if not manifest_path.is_file():
        parser.error(f"Manifest not found: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors = []
    source_hash = str(manifest.get("sourceSha256", ""))
    if not SHA256_RE.fullmatch(source_hash):
        errors.append("sourceSha256 không hợp lệ hoặc thiếu")
    if manifest.get("hashAlgorithm") != "SHA-256":
        errors.append("hashAlgorithm phải là SHA-256")
    if args.jar:
        if not args.jar.is_file():
            errors.append(f"Không tìm thấy JAR nguồn: {args.jar}")
        elif source_hash and sha256_file(args.jar).lower() != source_hash.lower():
            errors.append("SHA-256 của JAR không khớp sourceSha256 trong manifest")

    decoded = manifest.get("decodedPackedEntries", [])
    if not isinstance(decoded, list):
        errors.append("decodedPackedEntries không phải danh sách")
        decoded = []
    verified = 0
    seen_outputs = set()
    for item in decoded:
        try:
            if not isinstance(item, dict):
                raise ValueError("decoded entry không phải object")
            relative = item.get("output")
            target = safe_asset_path(args.assets, relative)
            if relative in seen_outputs:
                raise ValueError(f"Trùng output path: {relative}")
            seen_outputs.add(relative)
            expected = str(item.get("sha256", ""))
            if not SHA256_RE.fullmatch(expected):
                raise ValueError(f"SHA-256 không hợp lệ: {relative}")
            if not target.is_file():
                raise ValueError(f"Thiếu file: {relative}")
            actual = sha256_file(target)
            if actual.lower() != expected.lower():
                raise ValueError(f"Hash không khớp: {relative}")
            verified += 1
        except Exception as exc:
            errors.append(str(exc))

    try:
        version = expected_asset_version(manifest)
        stored_version = str(manifest.get("assetVersion", ""))
        if not VERSION_RE.fullmatch(stored_version) or version.lower() != stored_version.lower():
            errors.append("assetVersion không khớp nội dung manifest")
    except Exception as exc:
        version = "unavailable"
        errors.append(str(exc))

    print(f"Decoded resources: {len(decoded)}; verified: {verified}; errors: {len(errors)}")
    print(f"assetVersion: {manifest.get('assetVersion', 'missing')} (calculated: {version})")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
