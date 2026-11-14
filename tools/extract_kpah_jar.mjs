#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const jarPath=path.resolve(process.argv[2]||'KPAH_278.jar');
const outputRoot=path.resolve('public/assets/kpah-original');
const key=Buffer.from('NguyenVanMinh','utf8');
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
function fail(message){throw new Error(message);}
function sha256(data){return crypto.createHash('sha256').update(data).digest('hex');}
function xor(data){const out=Buffer.allocUnsafe(data.length);for(let i=0;i<data.length;i++)out[i]=data[i]^key[i%key.length];return out;}
function safePath(root,name){
 if(!name||name.includes('\0')||name.includes('\\')||name.startsWith('/'))fail('Unsafe archive path: '+JSON.stringify(name));
 const parts=name.split('/');
 if(parts.some(p=>p==='..'||p==='')||/^[A-Za-z]:/.test(parts[0]))fail('Unsafe archive path: '+JSON.stringify(name));
 const target=path.resolve(root,...parts);
 if(target!==root&&!target.startsWith(root+path.sep))fail('Path escapes output: '+name);
 return target;
}
function readZipEntries(buffer){
 const min=Math.max(0,buffer.length-0xffff-22);let eocd=-1;
 for(let i=buffer.length-22;i>=min;i--)if(buffer.readUInt32LE(i)===0x06054b50){eocd=i;break;}
 if(eocd<0)fail('Không tìm thấy ZIP central directory trong JAR.');
 const count=buffer.readUInt16LE(eocd+10);let pos=buffer.readUInt32LE(eocd+16);const entries=[];
 for(let n=0;n<count;n++){
  if(buffer.readUInt32LE(pos)!==0x02014b50)fail('ZIP central directory không hợp lệ tại entry '+n);
  const flags=buffer.readUInt16LE(pos+8),method=buffer.readUInt16LE(pos+10);
  const compressedSize=buffer.readUInt32LE(pos+20),size=buffer.readUInt32LE(pos+24);
  const nameLen=buffer.readUInt16LE(pos+28),extraLen=buffer.readUInt16LE(pos+30),commentLen=buffer.readUInt16LE(pos+32);
  const localOffset=buffer.readUInt32LE(pos+42);
  const name=buffer.subarray(pos+46,pos+46+nameLen).toString((flags&0x800)?'utf8':'latin1');
  pos+=46+nameLen+extraLen+commentLen;if(name.endsWith('/'))continue;
  if(flags&1)fail('JAR có entry mã hóa không được hỗ trợ: '+name);
  if(buffer.readUInt32LE(localOffset)!==0x04034b50)fail('ZIP local header không hợp lệ: '+name);
  const dataStart=localOffset+30+buffer.readUInt16LE(localOffset+26)+buffer.readUInt16LE(localOffset+28);
  const compressed=buffer.subarray(dataStart,dataStart+compressedSize);
  let data;if(method===0)data=Buffer.from(compressed);else if(method===8)data=zlib.inflateRawSync(compressed);else fail('ZIP compression method '+method+' chưa hỗ trợ: '+name);
  if(data.length!==size)fail('Kích thước giải nén không khớp: '+name);
  entries.push({name,data,compressedSize});
 }
 return entries;
}
function decodePack(data){
 if(!data.length)fail('Empty packed resource');let pos=1;const count=data[0],index=[];let payloadSize=0;
 for(let i=0;i<count;i++){
  if(pos>=data.length)fail('Packed header truncated');let nameLen=data[pos++];if(nameLen>=128)nameLen-=256;
  if(nameLen<=0||pos+nameLen+2>data.length)fail('Invalid packed name length');
  const name=xor(data.subarray(pos,pos+nameLen)).toString('utf8');pos+=nameLen;
  const size=data.readUInt16BE(pos);pos+=2;
  if(!name||name.startsWith('/')||name.split('/').includes('..')||name.includes('\\'))fail('Unsafe packed path: '+name);
  index.push({name,size});payloadSize+=size;
 }
 if(pos+payloadSize!==data.length)fail('Packed payload size mismatch');
 const payload=xor(data.subarray(pos));let offset=0;
 return index.map(item=>{const bytes=payload.subarray(offset,offset+item.size);offset+=item.size;return{name:item.name,data:bytes};});
}
function pngDimensions(data){
 if(data.length<24||!data.subarray(0,8).equals(pngSignature)||data.toString('ascii',12,16)!=='IHDR')return null;
 return{width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
}
function family(archive){
 const stem=path.posix.basename(archive,path.posix.extname(archive)).toLowerCase();
 const labels={arrow:'Mũi tên và con trỏ',box:'Khung và hộp giao diện',eff:'Hiệu ứng',font:'Font và chữ',g:'Tài nguyên đồ họa chung',main:'Giao diện và màn hình chính',npc:'Nhân vật và NPC',skillpublic:'Tài nguyên kỹ năng'};
 if(path.posix.extname(archive).toLowerCase()==='.wps')return['profession-preview','Ảnh giới thiệu môn phái','source-pack'];
 return labels[stem]?[stem,labels[stem],'source-pack']:['unclassified-pack','Gói chưa phân loại','unclassified'];
}
if(!fs.existsSync(jarPath))fail('Không tìm thấy '+jarPath+'. Hãy đặt KPAH_278.jar ở thư mục gốc dự án.');
const jar=fs.readFileSync(jarPath),sourceSha256=sha256(jar);fs.mkdirSync(outputRoot,{recursive:true});
const entries=readZipEntries(jar),seen=new Set(),manifestEntries=[],decodedPackedEntries=[],characterParts=[];let extractedCount=0;
for(const entry of entries){
 const name=entry.name,data=entry.data;if(seen.has(name))fail('Duplicate JAR entry: '+name);seen.add(name);
 const ext=path.posix.extname(name).toLowerCase();
 manifestEntries.push({path:name,size:data.length,compressedSize:entry.compressedSize,extension:ext||'[no-extension]',isClass:ext==='.class',sha256:sha256(data)});
 if(ext!=='.class'){const target=safePath(outputRoot,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);extractedCount++;}
 if(['.sh','.wp','.wps'].includes(ext)){
  for(const resource of decodePack(data)){
   const relative=ext==='.sh'?path.posix.join('decoded-sh',path.posix.basename(name,ext),resource.name):path.posix.join('decoded-packed',path.posix.dirname(name),path.posix.basename(name,ext)+ext,resource.name);
   const target=safePath(outputRoot,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,resource.data);
   const dim=pngDimensions(resource.data),f=family(name);
   decodedPackedEntries.push({archive:name,packType:ext,path:resource.name,size:resource.data.length,sha256:sha256(resource.data),output:relative,...(dim?{...dim,imageClassHint:dim.width<=96&&dim.height<=96?'small-image':dim.width/dim.height>=2.2?'wide-image':dim.width/dim.height<=.45?'tall-image':'general-image'}:{}),resourceFamily:f[0],resourceFamilyLabel:f[1],resourceFamilyBasis:f[2]});
  }
 }
 const parts=name.split('/');
 if(parts.length===3&&parts[0]==='c'&&['leg','body','head','hat','coat'].includes(parts[1])){
  if(data.length<4)fail('Truncated character part: '+name);
  const pngSize=data.readUInt16BE(0),pngEnd=2+pngSize;
  if(pngSize<8||pngEnd+2>data.length||!data.subarray(2,pngEnd).subarray(0,8).equals(pngSignature))fail('Invalid embedded PNG: '+name);
  const metadataSize=data.readUInt16BE(pngEnd),metadata=data.subarray(pngEnd+2);if(metadataSize!==metadata.length)fail('Character metadata length mismatch: '+name);
  const partId=parts[2],image='character-parts/'+parts[1]+'/'+partId+'.png',metadataFile='character-parts/'+parts[1]+'/'+partId+'.metadata.bin';
  for(const pair of [[image,data.subarray(2,pngEnd)],[metadataFile,metadata]]){const target=safePath(outputRoot,pair[0]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,pair[1]);}
  const dim=pngDimensions(data.subarray(2,pngEnd));
  const metadataFirstByte=metadata[0]??null;
  const metadataHeaderMinimumBytes=metadataFirstByte===null?null:1+metadataFirstByte*5+2;
  characterParts.push({
   partType:parts[1],partId,source:name,image,metadata:metadataFile,
   metadataBytes:metadata.length,metadataFirstByte,
   metadataHeaderMinimumBytes,
   metadataCanContainSimpleRegionHeader:metadataHeaderMinimumBytes!==null&&metadata.length>=metadataHeaderMinimumBytes,
   metadataPrefixHex:metadata.subarray(0,24).toString('hex').match(/.{1,2}/g)?.join(' ')??'',
   pngBytes:pngSize,sha256:sha256(data.subarray(2,pngEnd)),
   width:dim?.width??null,height:dim?.height??null
  });
 }
}
const extensionCounts={};for(const item of manifestEntries)extensionCounts[item.extension]=(extensionCounts[item.extension]||0)+1;
const versionMaterial=JSON.stringify({sourceSha256,files:[...manifestEntries.map(x=>[x.path,x.sha256]),...decodedPackedEntries.map(x=>[x.output,x.sha256])].sort((a,b)=>a[0].localeCompare(b[0]))});
const metadataGroups={};
for(const item of characterParts){
 const group=metadataGroups[item.partType]??={count:0,totalBytes:0,firstByteHistogram:{},simpleRegionHeaderCandidateCount:0};
 group.count++;group.totalBytes+=item.metadataBytes;
 if(item.metadataFirstByte!==null)group.firstByteHistogram[item.metadataFirstByte]=(group.firstByteHistogram[item.metadataFirstByte]||0)+1;
 if(item.metadataCanContainSimpleRegionHeader)group.simpleRegionHeaderCandidateCount++;
}
for(const group of Object.values(metadataGroups))group.averageBytes=Number((group.totalBytes/group.count).toFixed(2));
const manifest={source:path.basename(jarPath),hashAlgorithm:'SHA-256',sourceSha256,assetVersion:sha256(Buffer.from(versionMaterial)).slice(0,16),entryCount:manifestEntries.length,extractedCount,classCount:manifestEntries.filter(x=>x.isClass).length,extensionCounts:Object.fromEntries(Object.entries(extensionCounts).sort()),decodedPackedCount:decodedPackedEntries.length,decodedPackedEntries,characterPartCount:characterParts.length,characterMetadataAnalysis:{method:'Heuristic only: checks whether the trailer is long enough for a one-byte region count followed by five bytes per region; this does not prove the trailer format.',groups:metadataGroups},characterParts,entries:manifestEntries};
fs.writeFileSync(path.join(outputRoot,'archive-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log('Entries: '+manifest.entryCount);
console.log('Extracted files: '+extractedCount);
console.log('Decoded packed resources (.sh/.wp/.wps): '+decodedPackedEntries.length);
console.log('Original character parts: '+characterParts.length);
console.log('Manifest: '+path.join(outputRoot,'archive-manifest.json'));
