#!/usr/bin/env python3
"""Loopback-only KPAH 2.7.8 handshake/replay harness for an original MIDP client.

This is a synthetic local mock, not a production server and not a live-server client.
It captures the initial transport handshake and login request without logging credentials.
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import socket
from typing import Any

from kpah_protocol_reference import (
    decode_client_frame,
    decode_server_frame,
    derive_xor_key,
    encode_client_frame,
    encode_handshake_payload,
    encode_server_frame,
    signed_byte,
    xor_stream,
)


def recv_exact(connection: socket.socket, length: int) -> bytes:
    chunks = bytearray()
    while len(chunks) < length:
        chunk = connection.recv(length - len(chunks))
        if not chunk:
            raise ConnectionError(f"Connection closed after {len(chunks)} of {length} bytes")
        chunks.extend(chunk)
    return bytes(chunks)


def read_client_frame(connection: socket.socket, key: bytes | None = None,
                      cursor: int = 0) -> tuple[dict[str, Any], int]:
    raw_header = recv_exact(connection, 3)
    if key is None:
        header = raw_header
        next_cursor = cursor
    else:
        header, next_cursor = xor_stream(raw_header, key, cursor)
    length = int.from_bytes(header[1:3], "big")
    raw_payload = recv_exact(connection, length)
    if key is None:
        payload = raw_payload
    else:
        payload, next_cursor = xor_stream(raw_payload, key, next_cursor)
    frame = raw_header + raw_payload
    decoded = decode_client_frame(frame, key, cursor)
    if decoded["opcode"] != signed_byte(header[0]) or decoded["payload"] != payload:
        raise ValueError("Frame decode consistency check failed")
    return {
        "opcode": decoded["opcode"],
        "payload": decoded["payload"],
        "payloadLength": length,
        "payloadHex": decoded["payload"].hex(),
    }, decoded["nextCursor"]


def write_server_frame(connection: socket.socket, opcode: int, payload: bytes,
                       key: bytes | None = None, cursor: int = 0) -> int:
    frame, next_cursor = encode_server_frame(opcode, payload, key, cursor)
    connection.sendall(frame)
    return next_cursor


def capture_session(connection: socket.socket, encoded_key: bytes,
                    max_packets: int = 3) -> list[dict[str, Any]]:
    connection.settimeout(10)
    # The client queues its empty -40 packet before the key exists; the writer
    # holds it until this unencrypted server key frame arrives.
    write_server_frame(connection, -40, encode_handshake_payload(encoded_key))
    key = derive_xor_key(encoded_key)
    cursor = 0
    captured = []
    for _ in range(max_packets):
        packet, cursor = read_client_frame(connection, key, cursor)
        entry = {
            "direction": "C2S",
            "opcode": packet["opcode"],
            "payloadLength": packet["payloadLength"],
        }
        if packet["opcode"] == 1:
            entry["payload"] = "<redacted: login credentials and client identifiers>"
        else:
            entry["payloadHex"] = packet["payloadHex"]
        captured.append(entry)
        if packet["opcode"] == 1:
            break
    return captured


def self_test() -> None:
    left, right = socket.socketpair()
    try:
        key = derive_xor_key(bytes.fromhex("10 20 30 40"))
        payload = bytes.fromhex("01 02 03 04")
        encoded, _ = encode_client_frame(-1, payload, key, 0)
        left.sendall(encoded)
        packet, cursor = read_client_frame(right, key, 0)
        assert packet["opcode"] == -1
        assert packet["payload"] == payload
        assert cursor == len(encoded) % len(key)

        server_frame, next_cursor = encode_server_frame(-40, encode_handshake_payload(bytes.fromhex("10 20 30")), None)
        decoded = decode_server_frame(server_frame)
        assert decoded["opcode"] == -40
        assert decoded["payload"] == bytes.fromhex("03 10 20 30")
        assert next_cursor == 0
    finally:
        left.close()
        right.close()
    print("KPAH replay harness self-test: PASS (framing, XOR cursor, handshake packet)")


def serve(host: str, port: int, encoded_key: bytes, max_packets: int) -> int:
    if not ipaddress.ip_address(host).is_loopback:
        raise ValueError("The mock server only binds to loopback addresses")
    with socket.socket(socket.AF_INET6 if ":" in host else socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        listener.bind((host, port))
        listener.listen(1)
        actual_port = listener.getsockname()[1]
        print(json.dumps({"event": "listening", "host": host, "port": actual_port, "mode": "synthetic-handshake-only"}), flush=True)
        connection, address = listener.accept()
        with connection:
            captured = capture_session(connection, encoded_key, max_packets)
            print(json.dumps({"event": "captured", "peer": str(address), "packets": captured}, ensure_ascii=False), flush=True)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run offline socketpair vectors")
    parser.add_argument("--host", default="127.0.0.1", help="Loopback address only")
    parser.add_argument("--port", type=int, default=22100)
    parser.add_argument("--encoded-key", default="1020304050", help="Synthetic prefix-XOR key bytes in hex")
    parser.add_argument("--max-packets", type=int, default=3)
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    encoded_key = bytes.fromhex(args.encoded_key)
    if not encoded_key or len(encoded_key) > 127:
        parser.error("--encoded-key must contain 1..127 bytes")
    if not 1 <= args.max_packets <= 32:
        parser.error("--max-packets must be between 1 and 32")
    return serve(args.host, args.port, encoded_key, args.max_packets)


if __name__ == "__main__":
    raise SystemExit(main())
