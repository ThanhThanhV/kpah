#!/usr/bin/env python3
"""Reference codec for the KPAH 2.7.8 transport framing observed in CFR output.

This is a protocol-analysis utility, not a live network client.
"""
from __future__ import annotations

import argparse
from typing import Any


def derive_xor_key(encoded_key: bytes) -> bytes:
    """Decode the cumulative-XOR key bytes read from the initial -40 packet."""
    if not encoded_key:
        raise ValueError("The XOR key must not be empty")
    key = bytearray(encoded_key)
    for index in range(len(key) - 1):
        key[index + 1] ^= key[index]
    return bytes(key)


def xor_stream(data: bytes, key: bytes | None, cursor: int = 0) -> tuple[bytes, int]:
    """XOR bytes with the independent send/receive cursor and wrap at key length."""
    if key is None:
        return bytes(data), cursor
    if not key:
        raise ValueError("The XOR key must not be empty")
    if cursor < 0:
        raise ValueError("The XOR cursor must be non-negative")
    output = bytearray(len(data))
    position = cursor
    for index, value in enumerate(data):
        output[index] = value ^ key[position]
        position += 1
        if position >= len(key):
            position %= len(key)
    return bytes(output), position


def signed_byte(value: int) -> int:
    return value - 256 if value >= 128 else value


def encode_client_frame(opcode: int, payload: bytes, key: bytes | None = None,
                        cursor: int = 0) -> tuple[bytes, int]:
    """Encode the observed client-to-server frame: opcode + unsigned short + body."""
    if not -128 <= opcode <= 255:
        raise ValueError("Opcode must fit in one byte")
    if len(payload) > 0xFFFF:
        raise ValueError("Observed client writer uses a 16-bit payload length")
    plain = bytes((opcode & 0xFF,)) + len(payload).to_bytes(2, "big") + payload
    return xor_stream(plain, key, cursor)


def decode_client_frame(frame: bytes, key: bytes | None = None,
                        cursor: int = 0) -> dict[str, Any]:
    """Decode a client frame for test-vector verification."""
    if len(frame) < 3:
        raise ValueError("Truncated client frame header")
    plain, next_cursor = xor_stream(frame, key, cursor)
    length = int.from_bytes(plain[1:3], "big")
    if len(plain) != 3 + length:
        raise ValueError("Client frame length does not match payload bytes")
    return {
        "opcode": signed_byte(plain[0]),
        "payload": plain[3:],
        "nextCursor": next_cursor,
    }


def encode_server_frame(opcode: int, payload: bytes, key: bytes | None = None,
                        cursor: int = 0, long_length: bool = False) -> tuple[bytes, int]:
    """Build a server-to-client frame according to the receive-side parser."""
    if not -128 <= opcode <= 255:
        raise ValueError("Opcode must fit in one byte")
    if long_length:
        header = bytes((0x80, opcode & 0xFF)) + len(payload).to_bytes(4, "big")
    else:
        if len(payload) > 0xFFFF:
            raise ValueError("A long-length frame is required above 65535 bytes")
        header = bytes((opcode & 0xFF,)) + len(payload).to_bytes(2, "big")
    return xor_stream(header + payload, key, cursor)


def decode_server_frame(frame: bytes, key: bytes | None = None,
                        cursor: int = 0) -> dict[str, Any]:
    """Decode server-to-client framing, including encrypted 0x80 long-length marker."""
    if not frame:
        raise ValueError("Empty frame")
    first, cursor = xor_stream(frame[:1], key, cursor)
    marker_or_opcode = first[0]
    long_length = key is not None and marker_or_opcode == 0x80
    if long_length:
        if len(frame) < 6:
            raise ValueError("Truncated long-length frame header")
        opcode_bytes, cursor = xor_stream(frame[1:2], key, cursor)
        length_bytes, cursor = xor_stream(frame[2:6], key, cursor)
        opcode = opcode_bytes[0]
        length = int.from_bytes(length_bytes, "big")
        body_offset = 6
    else:
        if len(frame) < 3:
            raise ValueError("Truncated short frame header")
        length_bytes, cursor = xor_stream(frame[1:3], key, cursor)
        opcode = marker_or_opcode
        length = int.from_bytes(length_bytes, "big")
        body_offset = 3
    if len(frame) != body_offset + length:
        raise ValueError("Server frame length does not match payload bytes")
    payload, cursor = xor_stream(frame[body_offset:], key, cursor)
    return {
        "opcode": signed_byte(opcode),
        "payload": payload,
        "nextCursor": cursor,
        "longLength": long_length,
    }


def self_test() -> None:
    encoded_key = bytes((0x10, 0x20, 0x30))
    key = derive_xor_key(encoded_key)
    assert key == bytes((0x10, 0x30, 0x00)), key

    plain_client, plain_cursor = encode_client_frame(1, bytes((1, 2, 3)))
    assert plain_client == bytes.fromhex("01 00 03 01 02 03")
    assert plain_cursor == 0
    decoded = decode_client_frame(plain_client)
    assert decoded["opcode"] == 1 and decoded["payload"] == bytes((1, 2, 3))

    encrypted_client, send_cursor = encode_client_frame(1, bytes((1, 2, 3)), key, 0)
    assert encrypted_client == bytes.fromhex("11 30 03 11 32 03")
    assert send_cursor == 0
    decoded = decode_client_frame(encrypted_client, key, 0)
    assert decoded["opcode"] == 1 and decoded["payload"] == bytes((1, 2, 3))
    assert decoded["nextCursor"] == send_cursor

    encrypted_server, server_cursor = encode_server_frame(0x2A, bytes((0xAA, 0xBB)), key, 1)
    assert encrypted_server == bytes.fromhex("1A 00 12 9A BB")
    decoded = decode_server_frame(encrypted_server, key, 1)
    assert decoded["opcode"] == 0x2A and decoded["payload"] == bytes((0xAA, 0xBB))
    assert decoded["nextCursor"] == server_cursor and not decoded["longLength"]

    encrypted_long, long_cursor = encode_server_frame(0x35, bytes((1, 2, 3)), key, 2, long_length=True)
    assert encrypted_long == bytes.fromhex("80 25 30 00 10 33 01 12 33")
    decoded = decode_server_frame(encrypted_long, key, 2)
    assert decoded["opcode"] == 0x35 and decoded["payload"] == bytes((1, 2, 3))
    assert decoded["nextCursor"] == long_cursor and decoded["longLength"]

    wrapped, wrapped_cursor = xor_stream(bytes(range(10)), key, 2)
    restored, restored_cursor = xor_stream(wrapped, key, 2)
    assert restored == bytes(range(10)) and restored_cursor == wrapped_cursor
    print("KPAH protocol reference self-test: PASS (key derivation, C2S, S2C, long length, cursor wrap)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run deterministic synthetic vectors")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
