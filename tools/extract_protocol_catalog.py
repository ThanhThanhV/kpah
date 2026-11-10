#!/usr/bin/env python3
"""Extract observed C2S writers and S2C dispatch cases from CFR-decompiled KPAH sources."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

METHOD_RE = re.compile(
    r"(?m)^\s*(?:public|private|protected)\s+(?:(?:static|final|synchronized)\s+)*"
    r"[\w.$<>\[\]]+\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{"
)
PACKET_CREATE_RE = re.compile(
    r"(?:jy\.b\(\s*((?:\(byte\)\s*)?[^()]*)\s*\)|new\s+acu\(\s*([^()]*)\s*\))"
)
CASE_RE = re.compile(r"\bcase\s+(-?\d+)\s*:\s*\{")
WRITE_RE = re.compile(r"\.write(Byte|Short|Int|Long|UTF|Boolean)\s*\(")
READ_RE = re.compile(r"\.read(UnsignedByte|UnsignedShort|Byte|Short|Int|Long|UTF|Boolean)\s*\(")


def matching_brace(source: str, opening: int) -> int:
    depth = 0
    quote = None
    escaped = False
    line_comment = False
    block_comment = False
    index = opening
    while index < len(source):
        char = source[index]
        next_char = source[index + 1] if index + 1 < len(source) else ""
        if line_comment:
            if char == "\n":
                line_comment = False
        elif block_comment:
            if char == "*" and next_char == "/":
                block_comment = False
                index += 1
        elif quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
        elif char == "/" and next_char == "/":
            line_comment = True
            index += 1
        elif char == "/" and next_char == "*":
            block_comment = True
            index += 1
        elif char in ("'", '"'):
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    raise ValueError(f"Unclosed Java block at offset {opening}")


def extract_blocks(source: str, pattern: re.Pattern[str]) -> list[dict[str, Any]]:
    blocks = []
    for match in pattern.finditer(source):
        opening = match.end() - 1
        closing = matching_brace(source, opening)
        blocks.append({
            "name": match.group(1),
            "signature": match.group(0).strip().split("{", 1)[0].strip(),
            "body": source[opening + 1:closing],
            "line": source.count("\n", 0, match.start()) + 1,
        })
    return blocks


def call_arguments(source: str, opening: int) -> tuple[str, int]:
    depth = 1
    quote = None
    escaped = False
    index = opening + 1
    start = index
    while index < len(source):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
        elif char in ("'", '"'):
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return source[start:index].strip(), index + 1
        index += 1
    return source[start:].strip(), len(source)


def extract_write_operations(body: str) -> list[dict[str, Any]]:
    operations = []
    for match in WRITE_RE.finditer(body):
        argument, _ = call_arguments(body, match.end() - 1)
        operations.append({"type": "write" + match.group(1), "argument": argument, "offset": match.start()})
    return operations


def extract_read_operations(body: str) -> list[str]:
    return ["read" + match.group(1) for match in READ_RE.finditer(body)]


def extract_outbound(java_file: Path) -> list[dict[str, Any]]:
    source = java_file.read_text(encoding="utf-8", errors="replace")
    records = []
    for method in extract_blocks(source, METHOD_RE):
        body = method["body"]
        creations = list(PACKET_CREATE_RE.finditer(body))
        for index, match in enumerate(creations):
            expression = (match.group(1) if match.group(1) is not None else match.group(2)).strip()
            normalized = re.sub(r"^\(byte\)\s*", "", expression).strip()
            numeric_match = re.fullmatch(r"-?\d+", normalized)
            opcode = int(normalized) if numeric_match else None
            end = creations[index + 1].start() if index + 1 < len(creations) else len(body)
            segment = body[match.start():end]
            variable_match = re.search(r"\bacu\s+([A-Za-z_$][\w$]*)\s*=\s*$", body[max(0, match.start() - 100):match.start()])
            variable = variable_match.group(1) if variable_match else None
            send_calls = len(re.findall(r"\.a\(\s*" + re.escape(variable) + r"\s*\)", segment)) if variable else len(re.findall(r"\.a\(\s*acu\d*\s*\)", segment))
            records.append({
                "method": method["name"],
                "signature": method["signature"],
                "sourceLine": method["line"],
                "opcode": opcode,
                "opcodeExpression": expression,
                "opcodeHex": "0x{0:02X}".format(opcode & 0xFF) if opcode is not None else None,
                "payloadWrites": extract_write_operations(segment),
                "sendCallCount": send_calls,
                "sourceFile": java_file.name,
            })
    return records


def extract_inbound(java_file: Path) -> list[dict[str, Any]]:
    source = java_file.read_text(encoding="utf-8", errors="replace")
    records = []
    for case in CASE_RE.finditer(source):
        opening = case.end() - 1
        closing = matching_brace(source, opening)
        body = source[opening + 1:closing]
        dispatches = re.findall(r"([A-Za-z_$][\w.$]*)\s*\(\s*acu2\s*\)", body)
        records.append({
            "opcode": int(case.group(1)),
            "opcodeHex": "0x{0:02X}".format(int(case.group(1)) & 0xFF),
            "sourceLine": source.count("\n", 0, case.start()) + 1,
            "readOperations": extract_read_operations(body),
            "dispatchTargets": sorted(set(dispatches)),
            "hasAcuPayloadRead": "acu2.b()" in body,
            "sourceFile": java_file.name,
        })
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cfr_source", type=Path, help="Directory containing CFR-decompiled Java files")
    parser.add_argument("--json", type=Path, default=Path("tools/reports/protocol-opcode-catalog.json"))
    parser.add_argument("--markdown", type=Path, default=Path("tools/reports/protocol-opcode-catalog.md"))
    args = parser.parse_args()
    jy_file = args.cfr_source / "jy.java"
    ka_file = args.cfr_source / "ka.java"
    missing = [str(path) for path in (jy_file, ka_file) if not path.is_file()]
    if missing:
        parser.error("Missing required CFR source file(s): " + ", ".join(missing))
    java_files = sorted(args.cfr_source.rglob("*.java"))
    outbound = []
    for java_file in java_files:
        outbound.extend(extract_outbound(java_file))
    inbound = extract_inbound(ka_file)
    numeric_declarations = {item["opcode"] for item in outbound if item["opcode"] is not None}
    numeric_sent = {item["opcode"] for item in outbound if item["opcode"] is not None and item["sendCallCount"] > 0}
    report = {
        "sourceFiles": {
            "jy.java": hashlib.sha256(jy_file.read_bytes()).hexdigest(),
            "ka.java": hashlib.sha256(ka_file.read_bytes()).hexdigest(),
        },
        "outboundSourceFileCount": len(java_files),
        "outboundWriterDeclarationCount": len(outbound),
        "outboundDynamicOpcodeDeclarationCount": sum(item["opcode"] is None for item in outbound),
        "outboundUnsentDeclarationCount": sum(item["sendCallCount"] == 0 for item in outbound),
        "outboundUniqueDeclaredOpcodeCount": len(numeric_declarations),
        "outboundUniqueSentOpcodeCount": len(numeric_sent),
        "inboundCaseCount": len(inbound),
        "inboundUniqueOpcodeCount": len({item["opcode"] for item in inbound}),
        "outbound": outbound,
        "inbound": inbound,
        "warning": "This catalog records source-level opcode and read/write evidence. Method names are obfuscated and payload semantics must be reviewed before assigning business meaning.",
    }
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.markdown.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# KPAH protocol opcode catalog", "",
        "- CFR source files scanned for packet builders: " + str(report["outboundSourceFileCount"]),
        "- Outbound packet-builder declarations: " + str(report["outboundWriterDeclarationCount"]),
        "- Dynamic opcode expressions: " + str(report["outboundDynamicOpcodeDeclarationCount"]),
        "- Unique C2S opcodes actually enqueued: " + str(report["outboundUniqueSentOpcodeCount"]),
        "- Writer declarations not enqueued: " + str(report["outboundUnsentDeclarationCount"]),
        "- Inbound dispatcher cases: " + str(report["inboundCaseCount"]),
        "- Unique S2C opcodes: " + str(report["inboundUniqueOpcodeCount"]), "",
        "> Evidence extracted from CFR source. Opcode meaning and payload business semantics are not inferred.", "",
        "## Client to server writers", "",
        "| Opcode | Status | Source | Method | Payload writes (source order) |",
        "|---|---|---|---|---|",
    ]
    for item in outbound:
        writes = "; ".join(operation["type"] + "(" + operation["argument"] + ")" for operation in item["payloadWrites"]) or "(empty payload)"
        status = "not enqueued" if item["sendCallCount"] == 0 else "enqueued x" + str(item["sendCallCount"])
        opcode_label = str(item["opcode"]) + " / " + str(item["opcodeHex"]) if item["opcode"] is not None else "dynamic: " + item["opcodeExpression"]
        lines.append("| {0} | {1} | {2} ({3}) | {4} | {5} |".format(
            opcode_label, status, item["sourceFile"], item["sourceLine"], item["signature"], writes.replace("|", "\\|")))
    lines.extend(["", "## Server to client dispatch", "",
        "| Opcode | Payload reads | Dispatch targets |",
        "|---:|---|---|"])
    for item in inbound:
        lines.append("| {0} / {1} | {2} | {3} |".format(
            item["opcode"], item["opcodeHex"],
            ", ".join(item["readOperations"]) or "—",
            ", ".join(item["dispatchTargets"]) or "—"))
    args.markdown.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Source files: {0}; C2S declarations: {1}; dynamic opcodes: {2}; sent opcodes: {3}; unsent: {4}; S2C cases: {5} ({6} unique)".format(
        report["outboundSourceFileCount"], report["outboundWriterDeclarationCount"],
        report["outboundDynamicOpcodeDeclarationCount"], report["outboundUniqueSentOpcodeCount"],
        report["outboundUnsentDeclarationCount"], report["inboundCaseCount"], report["inboundUniqueOpcodeCount"]))
    print("JSON: " + str(args.json))
    print("Markdown: " + str(args.markdown))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
