/**
 * Decode the source-backed binary definition stored in d.i by opcode 26.
 * DataInputStream fields are big-endian. Unknown header/auxiliary bytes are
 * retained verbatim rather than assigned guessed gameplay semantics.
 */
export function decodeEffectDefinition(payload) {
  if (!(payload instanceof Uint8Array)) throw new TypeError("Effect definition must be Uint8Array");
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  let offset = 0;
  const requireBytes = (count, label) => {
    if (!Number.isInteger(count) || count < 0 || offset + count > payload.length) {
      throw new RangeError(`Truncated effect definition while reading ${label}`);
    }
  };
  const readU8 = label => { requireBytes(1, label); return view.getUint8(offset++); };
  const readI8 = label => { requireBytes(1, label); return view.getInt8(offset++); };
  const readI16 = label => { requireBytes(2, label); const value=view.getInt16(offset,false); offset+=2; return value; };
  const readBytes = (count,label) => { requireBytes(count,label); const value=payload.slice(offset,offset+count); offset+=count; return value; };
  const readCount = (label, signed=true) => {
    const count=signed?readI8(label):readU8(label);
    if(count<0) throw new RangeError(`Negative ${label}`);
    return count;
  };

  const regionCount=readCount("region count");
  const regions=[];
  for(let i=0;i<regionCount;i++){
    regions.push({
      headerTag:readU8("region header tag"),
      x:readU8("region x"), y:readU8("region y"),
      width:readU8("region width"), height:readU8("region height"),
    });
  }
  const frameCount=readI16("frame count");
  if(frameCount<0) throw new RangeError("Negative effect frame count");
  const frames=[];
  for(let frameIndex=0;frameIndex<frameCount;frameIndex++){
    const partCount=readCount(`frame ${frameIndex} part count`);
    const groupZero=[],groupNonZero=[];
    for(let partIndex=0;partIndex<partCount;partIndex++){
      const part={
        x:readI16("part x"),
        y:readI16("part y"),
        regionIndex:readI8("part region index"),
        auxiliaryX:readI16("part auxiliary x"),
        auxiliaryY:readI16("part auxiliary y"),
        auxiliaryRegionIndex:readI8("part auxiliary region index"),
        auxiliaryFlag:readI8("part auxiliary flag"),
        groupFlag:readI8("part group flag"),
      };
      (part.groupFlag===0?groupZero:groupNonZero).push(part);
    }
    frames.push({index:frameIndex,groupZero,groupNonZero});
  }
  const sequenceCount=readCount("frame sequence count",false);
  const frameSequence=[];
  for(let i=0;i<sequenceCount;i++) frameSequence.push(readI16("frame sequence entry") & 0xff);
  const sequenceHeaderByte=readI8("sequence header byte");
  const readByteArray=(label)=>{
    const count=readCount(`${label} count`);
    return readBytes(count,label);
  };
  const auxiliaryArrays={
    array0:readByteArray("auxiliary array 0"),
    array1:readByteArray("auxiliary array 1"),
    array3:readByteArray("auxiliary array 3"),
  };
  return {
    regions,frames,frameSequence,sequenceHeaderByte,auxiliaryArrays,
    trailingBytes:payload.slice(offset),
    consumedBytes:offset,
  };
}
