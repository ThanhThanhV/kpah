#!/usr/bin/env python3
"""Suggest semantic roles for obfuscated KPAH classes from bytecode evidence."""
from __future__ import annotations
import argparse, json, re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

KNOWN_ANCHORS = {
    "game.GameMidlet": "MIDlet entry point",
    "km": "main Canvas / render and input loop",
    "tj": "abstract screen-state base",
    "uj": "server selector screen",
    "ro": "login screen",
    "lj": "character selection screen",
    "ls": "character creation screen",
    "li": "loading transition screen",
    "mj": "main world screen / renderer",
    "tb": "guild and game menu interface",
    "ba": "packed resource loader",
    "bc": "sprite-sheet region drawing helper",
    "acu": "outbound packet builder",
    "acv": "connection / transport state",
    "kv": "startup worker",
    "jy": "login handshake helper",
}
ROLE_RULES = [
    ("network_transport", "Network transport / socket", [
        (r"socketconnection|socket://|javax\.microedition\.io\.socketconnection", 8, "socket API or socket URL"),
        (r"inputstream|outputstream|datainputstream|dataoutputstream", 3, "binary stream API"),
        (r"connection", 2, "connection-related constant")]),
    ("protocol_packet", "Packet / protocol handling", [
        (r"writebyte|readbyte|writeutf|readutf|readshort|readint|writeint|writeshort", 4, "binary packet field operation"),
        (r"packet|message|opcode|command", 2, "packet or command terminology")]),
    ("resource_loader", "Resource loading / archive decoding", [
        (r"\.sh|\.wp|\.wps|\.png|/wpsplash/|/npc/|/eff/", 5, "packed resource path or extension"),
        (r"getresourceasstream|resource|image\.createimage", 3, "resource or image loading API"),
        (r"xor|decode|decrypt|archive", 2, "decoding terminology")]),
    ("rendering", "Canvas rendering / graphics", [
        (r"javax\.microedition\.lcdui\.graphics|drawregion|drawimage|drawstring|fillrect|drawrect", 6, "MIDP graphics operation"),
        (r"canvas|paint|repaint|flushgraphics", 3, "canvas rendering lifecycle")]),
    ("input", "Keyboard / pointer input", [
        (r"pointerpressed|pointerreleased|pointerdragged|keypressed|keyreleased|getkeycode", 6, "input callback"),
        (r"gameaction|keyevent|pointer", 2, "input terminology")]),
    ("screen_state", "Screen / UI state", [
        (r"javax\.microedition\.lcdui\.display|setcurrent|displayable|commandlistener", 6, "MIDP screen/display API"),
        (r"login|register|server|character|loading|menu|dialog", 2, "screen-related UI text")]),
    ("world_entity", "World / map / entity", [
        (r"map|tile|npc|monster|mob|player|drop|ground|zone", 3, "world entity or map terminology"),
        (r"collision|position|coordinate|camera|move", 2, "world movement terminology")]),
    ("persistence", "Local persistence / settings", [
        (r"recordstore|javax\.microedition\.rms|rms", 7, "MIDP RecordStore API"),
        (r"preferences|save|load|credential|password", 2, "persistence or credential terminology")]),
    ("thread_lifecycle", "Thread / startup / scheduling", [
        (r"java\.lang\.thread|runnable|start\(\)|run\(\)", 3, "thread lifecycle reference"),
        (r"sleep|currenttimemillis|schedule", 2, "timing or scheduling reference")]),
]

def collect_text(item: dict[str, Any], outgoing: list[dict[str, Any]], incoming: list[dict[str, Any]], field_refs: list[dict[str, Any]], type_refs: list[dict[str, Any]]) -> str:
    pieces = [
        str(item.get("className", "")), str(item.get("superClass", "")),
        " ".join(map(str, item.get("interfaces", []))),
        " ".join(map(str, item.get("stringConstants", []))),
        " ".join(str(field.get("descriptor", "")) for field in item.get("fields", [])),
        " ".join(str(method.get("name", "")) + " " + str(method.get("descriptor", "")) for method in item.get("methods", [])),
        " ".join(str(edge.get("to", "")) for edge in outgoing),
        " ".join(str(edge.get("from", "")) for edge in incoming),
        " ".join(str(edge.get("to", "")) for edge in field_refs),
        " ".join(str(edge.get("to", "")) for edge in type_refs)]
    return "\n".join(pieces).casefold()

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path)
    parser.add_argument("--json", type=Path, default=Path("tools/reports/class-role-candidates.json"))
    parser.add_argument("--markdown", type=Path, default=Path("tools/reports/class-role-candidates.md"))
    parser.add_argument("--min-score", type=int, default=3)
    args = parser.parse_args()
    data = json.loads(args.report.read_text(encoding="utf-8"))
    classes, graph = data.get("classes"), data.get("callGraph")
    field_graph = data.get("fieldReferenceGraph", [])
    type_graph = data.get("typeReferenceGraph", [])
    if not isinstance(classes, list) or not isinstance(graph, list):
        parser.error("Analysis report must contain classes[] and callGraph[]")
    if not isinstance(field_graph, list) or not isinstance(type_graph, list):
        parser.error("Reference graphs must be arrays")
    by_name = {str(item.get("className")): item for item in classes if isinstance(item, dict)}
    outgoing: dict[str, list[dict[str, Any]]] = defaultdict(list)
    incoming: dict[str, list[dict[str, Any]]] = defaultdict(list)
    field_refs_by_class: dict[str, list[dict[str, Any]]] = defaultdict(list)
    type_refs_by_class: dict[str, list[dict[str, Any]]] = defaultdict(list)
    def owning_class(method_reference: str) -> str:
        # Match the longest known class-name prefix so package-qualified names
        # such as game.GameMidlet are not truncated at the package separator.
        matches = [name for name in by_name if method_reference.startswith(name + ".")]
        return max(matches, key=len) if matches else method_reference.rsplit(".", 1)[0]

    for edge in graph:
        if isinstance(edge, dict):
            source_class = owning_class(str(edge.get("from", "")))
            target_class = owning_class(str(edge.get("to", "")))
            outgoing[source_class].append(edge)
            incoming[target_class].append(edge)
    for edge in field_graph:
        if isinstance(edge, dict):
            field_refs_by_class[owning_class(str(edge.get("from", "")))].append(edge)
    for edge in type_graph:
        if isinstance(edge, dict):
            source_class = owning_class(str(edge.get("from", "")))
            target_name = str(edge.get("to", ""))
            target_class = target_name if target_name in by_name else owning_class(target_name)
            type_refs_by_class[source_class].append({**edge, "targetClass": target_class})
    results = []
    for name, item in by_name.items():
        out_edges, in_edges = outgoing[name], incoming[name]
        field_edges, type_edges = field_refs_by_class[name], type_refs_by_class[name]
        corpus = collect_text(item, out_edges, in_edges, field_edges, type_edges)
        callee_counts = Counter(owning_class(str(edge.get("to", ""))) for edge in out_edges)
        caller_counts = Counter(owning_class(str(edge.get("from", ""))) for edge in in_edges)
        field_owner_counts = Counter(owning_class(str(edge.get("to", ""))) for edge in field_edges)
        type_owner_counts = Counter(str(edge.get("targetClass", "")) for edge in type_edges)
        related_classes = {
            "callees": [{"className": key, "references": count} for key, count in callee_counts.most_common(12) if key != name],
            "callers": [{"className": key, "references": count} for key, count in caller_counts.most_common(12) if key != name],
            "fieldOwners": [{"className": key, "references": count} for key, count in field_owner_counts.most_common(12) if key != name],
            "typeReferences": [{"className": key, "references": count} for key, count in type_owner_counts.most_common(12) if key and key != name],
        }
        string_samples = [
            value for value in item.get("stringConstants", [])
            if isinstance(value, str) and re.search(
                r"socket|http|https|\.sh|\.wp|\.png|login|server|character|map|npc|monster|skill|recordstore|canvas|command|guild",
                value, re.IGNORECASE)
        ][:12]
        candidates = []
        for role_id, label, rules in ROLE_RULES:
            score, evidence = 0, []
            for pattern, weight, description in rules:
                if re.search(pattern, corpus, re.IGNORECASE):
                    score += weight
                    evidence.append({"weight": weight, "evidence": description})
            if score >= args.min_score:
                candidates.append({"roleId": role_id, "label": label, "score": score, "evidence": evidence})
        candidates.sort(key=lambda x: (-x["score"], x["roleId"]))
        anchor = KNOWN_ANCHORS.get(name)
        status = "verified-anchor" if anchor else ("hypothesis-needs-review" if candidates else "unclassified")
        results.append({
            "className": name, "status": status, "verifiedAnchorDescription": anchor,
            "methodCount": len(item.get("methods", [])),
            "outgoingCallCount": len(out_edges), "incomingCallCount": len(in_edges),
            "fieldReferenceCount": len(field_edges), "typeReferenceCount": len(type_edges),
            "superClass": item.get("superClass"),
            "interfaces": item.get("interfaces", []),
            "fields": [{"name": x.get("name"), "descriptor": x.get("descriptor")} for x in item.get("fields", [])[:20]],
            "stringEvidenceSamples": string_samples,
            "relatedClasses": related_classes,
            "roleCandidates": candidates})
    results.sort(key=lambda x: (0 if x["status"] == "verified-anchor" else 1,
        -max((c["score"] for c in x["roleCandidates"]), default=0), x["className"]))
    output = {
        "sourceReport": str(args.report), "classCount": len(results),
        "verifiedAnchorCount": sum(x["status"] == "verified-anchor" for x in results),
        "hypothesisCount": sum(x["status"] == "hypothesis-needs-review" for x in results),
        "unclassifiedCount": sum(x["status"] == "unclassified" for x in results),
        "warning": "Role candidates are heuristic hypotheses. Do not rename classes from this report alone.",
        "classes": results}
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.markdown.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# KPAH class role candidates", "",
        "- Classes analyzed: " + str(len(results)),
        "- Existing verified anchors: " + str(output["verifiedAnchorCount"]),
        "- Heuristic hypotheses requiring review: " + str(output["hypothesisCount"]),
        "- Unclassified: " + str(output["unclassifiedCount"]), "",
        "> This is a review queue, not an automatic rename map. Validate each hypothesis against bytecode, callers/callees and original UI/resource behavior.", "",
        "| Class | Status | Candidate role | Score | Evidence | Related classes | String samples |",
        "|---|---|---|---:|---|---|---|"]
    for item in results:
        if not item["roleCandidates"]:
            lines.append("| " + item["className"] + " | " + item["status"] + " | — | — | — | — | — |")
        related = ", ".join(
            [x["className"] + " (" + str(x["references"]) + ")" for x in item["relatedClasses"]["callees"][:3]] +
            [x["className"] + " ← " + str(x["references"]) for x in item["relatedClasses"]["callers"][:3]] +
            [x["className"] + " [field]" for x in item["relatedClasses"]["fieldOwners"][:2]] +
            [x["className"] + " [type]" for x in item["relatedClasses"]["typeReferences"][:2]])
        samples = "; ".join(item["stringEvidenceSamples"][:5]).replace("|", "\\|")
        for candidate in item["roleCandidates"][:3]:
            evidence = "; ".join(e["evidence"] for e in candidate["evidence"])
            lines.append("| " + item["className"] + " | " + item["status"] + " | " +
                candidate["label"] + " | " + str(candidate["score"]) + " | " + evidence +
                " | " + related + " | " + samples + " |")
    args.markdown.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Classes: {0}; anchors: {1}; hypotheses: {2}; unclassified: {3}".format(
        len(results), output["verifiedAnchorCount"], output["hypothesisCount"], output["unclassifiedCount"]))
    print("JSON: " + str(args.json))
    print("Markdown: " + str(args.markdown))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
