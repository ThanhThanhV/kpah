#!/usr/bin/env python3
"""Index Java class files and extract method call edges and bytecode evidence.

Run after extracting KPAH_278.jar with --include-classes:
  python tools/extract_kpah_jar.py KPAH_278.jar --include-classes
  python tools/analyze_class_files.py public/assets/kpah-original

The tool does not rename obfuscated symbols or infer game semantics.
"""
from __future__ import annotations

import argparse
import json
import struct
from collections import Counter
from pathlib import Path
from typing import Any


OPCODE_NAMES: dict[int, str] = {}

def _opcodes(start: int, names: str) -> None:
    OPCODE_NAMES.update({start + index: name for index, name in enumerate(names.split())})


_opcodes(0x00, "nop aconst_null iconst_m1 iconst_0 iconst_1 iconst_2 iconst_3 iconst_4 iconst_5 lconst_0 lconst_1 fconst_0 fconst_1 fconst_2 dconst_0 dconst_1")
_opcodes(0x10, "bipush sipush ldc ldc_w ldc2_w iload lload fload dload aload")
_opcodes(0x1A, "iload_0 iload_1 iload_2 iload_3 lload_0 lload_1 lload_2 lload_3 fload_0 fload_1 fload_2 fload_3 dload_0 dload_1 dload_2 dload_3 aload_0 aload_1 aload_2 aload_3")
_opcodes(0x2E, "iaload laload faload daload aaload baload caload saload")
_opcodes(0x36, "istore lstore fstore dstore astore")
_opcodes(0x3B, "istore_0 istore_1 istore_2 istore_3 lstore_0 lstore_1 lstore_2 lstore_3 fstore_0 fstore_1 fstore_2 fstore_3 dstore_0 dstore_1 dstore_2 dstore_3 astore_0 astore_1 astore_2 astore_3")
_opcodes(0x4F, "iastore lastore fastore dastore aastore bastore castore sastore")
_opcodes(0x57, "pop pop2 dup dup_x1 dup_x2 dup2 dup2_x1 dup2_x2 swap")
_opcodes(0x60, "iadd ladd fadd dadd isub lsub fsub dsub imul lmul fmul dmul idiv ldiv fdiv ddiv irem lrem frem drem")
_opcodes(0x74, "ineg lneg fneg dneg ishl lshl ishr lshr iushr lushr iand land ior lor ixor lxor iinc")
_opcodes(0x85, "i2l i2f i2d l2i l2f l2d f2i f2l f2d d2i d2l d2f i2b i2c i2s")
_opcodes(0x94, "lcmp fcmpl fcmpg dcmpl dcmpg")
_opcodes(0x99, "ifeq ifne iflt ifge ifgt ifle if_icmpeq if_icmpne if_icmplt if_icmpge if_icmpgt if_icmple if_acmpeq if_acmpne")
_opcodes(0xA7, "goto jsr ret tableswitch lookupswitch")
_opcodes(0xAC, "ireturn lreturn freturn dreturn areturn return")
_opcodes(0xB2, "getstatic putstatic getfield putfield invokevirtual invokespecial invokestatic invokeinterface invokedynamic")
_opcodes(0xBB, "new newarray anewarray arraylength athrow checkcast instanceof monitorenter monitorexit wide multianewarray ifnull ifnonnull goto_w jsr_w")

OPERAND_LENGTHS: dict[int, int] = {}
for _opcode in (0x10, 0x12, 0x15, 0x16, 0x17, 0x18, 0x19, 0x36, 0x37, 0x38, 0x39, 0x3A, 0xA9, 0xBC):
    OPERAND_LENGTHS[_opcode] = 1
for _opcode in (0x11, 0x13, 0x14, *range(0x99, 0xA9), *range(0xB2, 0xB9), 0xBB, 0xBD, 0xC0, 0xC1, 0xC6, 0xC7):
    OPERAND_LENGTHS[_opcode] = 2
OPERAND_LENGTHS.update({0x84: 2, 0xB9: 4, 0xBA: 4, 0xC5: 3, 0xC8: 4, 0xC9: 4})


class ClassFormatError(ValueError):
    pass


class Reader:
    def __init__(self, data: bytes):
        self.data = data
        self.pos = 0

    def take(self, size: int) -> bytes:
        if size < 0 or self.pos + size > len(self.data):
            raise ClassFormatError(f"Unexpected end of class data at offset {self.pos}")
        value = self.data[self.pos:self.pos + size]
        self.pos += size
        return value

    def u1(self) -> int:
        return self.take(1)[0]

    def u2(self) -> int:
        return int.from_bytes(self.take(2), "big")

    def u4(self) -> int:
        return int.from_bytes(self.take(4), "big")


def signed(value: int, bits: int) -> int:
    sign = 1 << (bits - 1)
    return value - (1 << bits) if value & sign else value


def decode_modified_utf8(data: bytes) -> str:
    units: list[int] = []
    i = 0
    while i < len(data):
        first = data[i]
        if first & 0x80 == 0:
            units.append(first)
            i += 1
        elif first & 0xE0 == 0xC0 and i + 1 < len(data):
            units.append(((first & 0x1F) << 6) | (data[i + 1] & 0x3F))
            i += 2
        elif first & 0xF0 == 0xE0 and i + 2 < len(data):
            units.append(((first & 0x0F) << 12) | ((data[i + 1] & 0x3F) << 6) | (data[i + 2] & 0x3F))
            i += 3
        else:
            units.append(0xFFFD)
            i += 1
    raw = b"".join(unit.to_bytes(2, "big") for unit in units)
    return raw.decode("utf-16-be", errors="replace")


def parse_constant_pool(reader: Reader) -> list[dict[str, Any] | None]:
    count = reader.u2()
    pool: list[dict[str, Any] | None] = [None] * count
    index = 1
    while index < count:
        tag = reader.u1()
        entry: dict[str, Any] = {"tag": tag}
        if tag == 1:
            entry["value"] = decode_modified_utf8(reader.take(reader.u2()))
        elif tag in (3, 4):
            raw = reader.take(4)
            entry["value"] = struct.unpack(">i" if tag == 3 else ">f", raw)[0]
        elif tag in (5, 6):
            raw = reader.take(8)
            entry["value"] = struct.unpack(">q" if tag == 5 else ">d", raw)[0]
            pool[index] = entry
            index += 1
            if index < count:
                pool[index] = {"tag": 0}
                index += 1
            continue
        elif tag in (7, 8, 16, 19, 20):
            entry["index"] = reader.u2()
        elif tag in (9, 10, 11, 12, 17, 18):
            entry["a"] = reader.u2()
            entry["b"] = reader.u2()
        elif tag == 15:
            entry["kind"] = reader.u1()
            entry["index"] = reader.u2()
        else:
            raise ClassFormatError(f"Unsupported constant-pool tag {tag} at index {index}")
        pool[index] = entry
        index += 1
    return pool


def cp_entry(pool: list[dict[str, Any] | None], index: int) -> dict[str, Any] | None:
    return pool[index] if 0 < index < len(pool) else None


def cp_utf8(pool: list[dict[str, Any] | None], index: int) -> str:
    entry = cp_entry(pool, index)
    return str(entry.get("value", "")) if entry and entry.get("tag") == 1 else ""


def cp_class(pool: list[dict[str, Any] | None], index: int) -> str:
    entry = cp_entry(pool, index)
    return cp_utf8(pool, int(entry.get("index", 0))).replace("/", ".") if entry and entry.get("tag") == 7 else ""


def cp_member(pool: list[dict[str, Any] | None], index: int) -> dict[str, str] | None:
    entry = cp_entry(pool, index)
    if not entry or entry.get("tag") not in (9, 10, 11):
        return None
    name_type = cp_entry(pool, int(entry["b"]))
    if not name_type or name_type.get("tag") != 12:
        return None
    return {
        "owner": cp_class(pool, int(entry["a"])),
        "name": cp_utf8(pool, int(name_type["a"])),
        "descriptor": cp_utf8(pool, int(name_type["b"])),
        "kind": {9: "field", 10: "method", 11: "interface-method"}[int(entry["tag"])],
    }


def parse_attributes(reader: Reader, pool: list[dict[str, Any] | None], *, method: bool = False) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for _ in range(reader.u2()):
        name = cp_utf8(pool, reader.u2())
        data = Reader(reader.take(reader.u4()))
        if method and name == "Code":
            max_stack = data.u2()
            max_locals = data.u2()
            code = data.take(data.u4())
            for _ in range(data.u2()):
                data.take(8)
            parse_attributes(data, pool)
            result["code"] = code
            result["maxStack"] = max_stack
            result["maxLocals"] = max_locals
    return result


def parse_class(data: bytes, file_path: str) -> dict[str, Any]:
    reader = Reader(data)
    if reader.u4() != 0xCAFEBABE:
        raise ClassFormatError("Invalid class magic")
    minor, major = reader.u2(), reader.u2()
    pool = parse_constant_pool(reader)
    access = reader.u2()
    this_class, super_class = reader.u2(), reader.u2()
    class_name = cp_class(pool, this_class)
    interfaces = [cp_class(pool, reader.u2()) for _ in range(reader.u2())]

    fields = []
    for _ in range(reader.u2()):
        flags, name, descriptor = reader.u2(), reader.u2(), reader.u2()
        parse_attributes(reader, pool)
        fields.append({"name": cp_utf8(pool, name), "descriptor": cp_utf8(pool, descriptor), "accessFlags": flags})

    methods = []
    for _ in range(reader.u2()):
        flags, name, descriptor = reader.u2(), reader.u2(), reader.u2()
        attrs = parse_attributes(reader, pool, method=True)
        methods.append({
            "name": cp_utf8(pool, name),
            "descriptor": cp_utf8(pool, descriptor),
            "accessFlags": flags,
            "codeLength": len(attrs.get("code", b"")),
            "maxStack": attrs.get("maxStack"),
            "maxLocals": attrs.get("maxLocals"),
            "_code": attrs.get("code", b""),
        })
    parse_attributes(reader, pool)

    strings = [cp_utf8(pool, int(entry["index"])) for entry in pool if entry and entry.get("tag") == 8]
    return {
        "file": file_path,
        "className": class_name or Path(file_path).stem,
        "majorVersion": major,
        "minorVersion": minor,
        "accessFlags": access,
        "superClass": cp_class(pool, super_class) if super_class else None,
        "interfaces": interfaces,
        "fields": fields,
        "methods": methods,
        "stringConstants": strings,
        "_pool": pool,
    }


def disassemble(code: bytes, pool: list[dict[str, Any] | None]) -> list[dict[str, Any]]:
    instructions = []
    offset = 0
    while offset < len(code):
        start = offset
        opcode = code[offset]
        offset += 1
        name = OPCODE_NAMES.get(opcode, f"opcode_{opcode:02x}")
        item: dict[str, Any] = {"offset": start, "opcode": name, "opcodeHex": f"0x{opcode:02x}"}

        if opcode == 0xAA:
            offset += (4 - (offset % 4)) % 4
            default = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
            low = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
            high = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
            if high < low or high - low > 65535:
                raise ClassFormatError(f"Invalid tableswitch at bytecode offset {start}")
            targets = []
            for key in range(low, high + 1):
                jump = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
                targets.append({"key": key, "target": start + jump})
            item.update({"defaultTarget": start + default, "targets": targets})
        elif opcode == 0xAB:
            offset += (4 - (offset % 4)) % 4
            default = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
            pairs = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
            if pairs < 0 or pairs > 65535:
                raise ClassFormatError(f"Invalid lookupswitch at bytecode offset {start}")
            targets = []
            for _ in range(pairs):
                key = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
                jump = signed(int.from_bytes(code[offset:offset + 4], "big"), 32); offset += 4
                targets.append({"key": key, "target": start + jump})
            item.update({"defaultTarget": start + default, "targets": targets})
        elif opcode == 0xC4:
            widened = code[offset]; offset += 1
            local_index = int.from_bytes(code[offset:offset + 2], "big"); offset += 2
            item["wideOpcode"] = OPCODE_NAMES.get(widened, f"opcode_{widened:02x}")
            item["localIndex"] = local_index
            if widened == 0x84:
                item["increment"] = signed(int.from_bytes(code[offset:offset + 2], "big"), 16); offset += 2
        else:
            size = OPERAND_LENGTHS.get(opcode, 0)
            operands = code[offset:offset + size]
            if len(operands) != size:
                raise ClassFormatError(f"Truncated {name} at bytecode offset {start}")
            offset += size
            if size:
                item["operandsHex"] = operands.hex()
            if 0x99 <= opcode <= 0xA8 or opcode in (0xC6, 0xC7):
                item["target"] = start + signed(int.from_bytes(operands, "big"), 16)
            cp_index = None
            if opcode == 0x12 and size == 1:
                cp_index = operands[0]
            elif opcode in (0x13, 0x14) or 0xB2 <= opcode <= 0xB9 or opcode in (0xBA, 0xBB, 0xBD, 0xC0, 0xC1, 0xC5):
                cp_index = int.from_bytes(operands[:2], "big")
            if cp_index:
                item["constantPoolIndex"] = cp_index
                member = cp_member(pool, cp_index)
                if member:
                    item["reference"] = member
                else:
                    entry = cp_entry(pool, cp_index)
                    if entry and entry.get("tag") == 7:
                        item["classReference"] = cp_class(pool, cp_index)
                    elif entry and entry.get("tag") == 8:
                        item["stringConstant"] = cp_utf8(pool, int(entry["index"]))
                    elif entry and entry.get("tag") == 1:
                        item["constant"] = entry.get("value")
        instructions.append(item)
    return instructions


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Directory containing extracted .class files")
    parser.add_argument("--output", type=Path, default=Path("tools/reports/kpah-class-analysis.json"))
    parser.add_argument("--contains", help="Filter matches by class/method name or string constant")
    parser.add_argument("--opcode", action="append", default=[], help="Filter methods by opcode name or hex value; repeatable")
    parser.add_argument("--disassemble-all", action="store_true", help="Include bytecode for every method (large output)")
    args = parser.parse_args()

    class_files = sorted(args.input.rglob("*.class")) if args.input.is_dir() else []
    if not class_files:
        parser.error(f"No .class files found under {args.input}; extract with --include-classes first")

    classes = []
    call_graph = []
    opcode_counts: Counter[str] = Counter()
    matches = []
    errors = []
    contains = args.contains.casefold() if args.contains else None
    wanted_opcodes = {value.lower() for value in args.opcode}

    for path in class_files:
        try:
            parsed = parse_class(path.read_bytes(), path.relative_to(args.input).as_posix())
            pool = parsed.pop("_pool")
            string_constants = parsed["stringConstants"]
            class_name = parsed["className"]
            method_summaries = []
            for method in parsed["methods"]:
                code = method.pop("_code")
                instructions = disassemble(code, pool) if code else []
                for instruction in instructions:
                    opcode_counts[instruction["opcode"]] += 1
                    reference = instruction.get("reference")
                    if instruction["opcode"] in ("invokevirtual", "invokespecial", "invokestatic", "invokeinterface") and reference:
                        call_graph.append({
                            "from": f'{class_name}.{method["name"]}{method["descriptor"]}',
                            "to": f'{reference["owner"]}.{reference["name"]}{reference["descriptor"]}',
                            "opcode": instruction["opcode"],
                            "bytecodeOffset": instruction["offset"],
                        })
                method_summary = {key: value for key, value in method.items()}
                method_summaries.append(method_summary)
                text_match = contains and (
                    contains in class_name.casefold() or
                    contains in method["name"].casefold() or
                    any(contains in value.casefold() for value in string_constants)
                )
                opcode_match = wanted_opcodes and any(
                    instruction["opcode"].lower() in wanted_opcodes or instruction["opcodeHex"].lower() in wanted_opcodes
                    for instruction in instructions
                )
                if text_match or opcode_match:
                    matches.append({
                        "className": class_name,
                        "method": method_summary,
                        "matchedStrings": [value for value in string_constants if contains and contains in value.casefold()],
                        "instructions": instructions,
                    })
                elif args.disassemble_all and instructions:
                    method_summary["instructions"] = instructions
            parsed["methods"] = method_summaries
            classes.append(parsed)
        except Exception as exc:
            errors.append({"file": path.as_posix(), "error": str(exc)})

    args.output.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "input": str(args.input),
        "classFileCount": len(class_files),
        "parsedClassCount": len(classes),
        "errorCount": len(errors),
        "methodCount": sum(len(item["methods"]) for item in classes),
        "callEdgeCount": len(call_graph),
        "opcodeCounts": dict(sorted(opcode_counts.items())),
        "classes": classes,
        "callGraph": call_graph,
        "matches": matches,
        "errors": errors,
    }
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Class files: {len(class_files)}; parsed: {len(classes)}; errors: {len(errors)}")
    print(f"Methods: {report['methodCount']}; call edges: {len(call_graph)}; matches: {len(matches)}")
    print(f"Report: {args.output}")


if __name__ == "__main__":
    main()
