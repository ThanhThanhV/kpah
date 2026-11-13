import assert from "node:assert/strict";
import { encodeServerFrame } from "../src/protocol/generated/transport-codec.js";
import { ServerFrameStreamDecoder } from "../src/protocol/server-frame-stream.js";

const decoder = new ServerFrameStreamDecoder();
const a = encodeServerFrame(16, Uint8Array.from([1, 2, 3])).data;
const b = encodeServerFrame(17, Uint8Array.from([4, 5])).data;
let result = decoder.push(a.slice(0, 2));
assert.equal(result.frames.length, 0);
assert.equal(result.bufferedBytes, 2);
result = decoder.push(a.slice(2, 4));
assert.equal(result.frames.length, 0);
assert.equal(result.bufferedBytes, 4);
result = decoder.push(new Uint8Array([...a.slice(4), ...b]));
assert.equal(result.frames.length, 2);
assert.equal(result.frames[0].opcode, 16);
assert.deepEqual([...result.frames[0].payload], [1, 2, 3]);
assert.equal(result.frames[1].opcode, 17);
assert.deepEqual([...result.frames[1].payload], [4, 5]);
assert.equal(result.bufferedBytes, 0);

const key = Uint8Array.from([0x10, 0x30, 0x00]);
const encryptedDecoder = new ServerFrameStreamDecoder({ key });
const encryptedA = encodeServerFrame(0x35, Uint8Array.from([9, 8, 7]), key, 0, true);
const encryptedB = encodeServerFrame(16, Uint8Array.from([6, 5]), key, encryptedA.cursor);
let encryptedResult = encryptedDecoder.push(encryptedA.data.slice(0, 5));
assert.equal(encryptedResult.frames.length, 0);
encryptedResult = encryptedDecoder.push(new Uint8Array([...encryptedA.data.slice(5), ...encryptedB.data]));
assert.equal(encryptedResult.frames.length, 2);
assert.equal(encryptedResult.frames[0].longLength, true);
assert.deepEqual([...encryptedResult.frames[0].payload], [9, 8, 7]);
assert.equal(encryptedResult.frames[1].opcode, 16);
assert.deepEqual([...encryptedResult.frames[1].payload], [6, 5]);
assert.equal(encryptedResult.cursor, encryptedB.cursor);

const handshakeDecoder = new ServerFrameStreamDecoder();
const clearHandshake = encodeServerFrame(-40, Uint8Array.from([3, 1, 2, 3])).data;
const followingEncrypted = encodeServerFrame(16, Uint8Array.from([7]), key, 0).data;
const mixed = handshakeDecoder.push(new Uint8Array([...clearHandshake, ...followingEncrypted]), { maxFrames: 1 });
assert.equal(mixed.frames[0].opcode, -40);
assert.equal(mixed.bufferedBytes, followingEncrypted.length);
handshakeDecoder.setKey(key);
const afterHandshake = handshakeDecoder.push(new Uint8Array());
assert.equal(afterHandshake.frames[0].opcode, 16);
assert.deepEqual([...afterHandshake.frames[0].payload], [7]);

assert.throws(() => new ServerFrameStreamDecoder({ maxFrameLength: 1 }).push(a), /maximum length/);
console.log("S2C stream frame decoder: PASS (partial chunks, coalesced frames, encrypted long header, cursor continuity, handshake key switch)");
