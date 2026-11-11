#!/usr/bin/env python3
"""Generate the independently guarded S2C opcode 3 extension decoder."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SPEC=ROOT/'protocol/protocol.yaml'
JS=ROOT/'src/protocol/generated/opcode3-extension-codec.js'
JAVA=ROOT/'protocol/generated/java/com/kpah/protocol/generated/ProtocolOpcode3ExtensionCodec.java'
JT=ROOT/'tools/opcode3-extension-codec.js.template'
CT=ROOT/'tools/ProtocolOpcode3ExtensionCodec.java.template'
def outputs():
 spec=json.loads(SPEC.read_text(encoding='utf-8'))
 schemas=spec.get('extensionSchemas',[])
 found=[s for s in schemas if s.get('direction')=='S2C' and s.get('opcode')==3 and s.get('name')=='CHARACTER_SNAPSHOT_EXTENSION']
 if len(found)!=1 or found[0].get('evidenceSource')!='ka.java:case3': raise ValueError('Missing opcode 3 extension schema')
 expected=['main-character-fields','pair-a','triple-b','triple-c','counted-short-byte-mapping-and-utf','bf-short','group-d-four-fields','group-e-three-fields']
 if found[0].get('groups')!=expected: raise ValueError('Opcode 3 extension group order differs from generator contract')
 return {JS:JT.read_text(encoding='utf-8'),JAVA:CT.read_text(encoding='utf-8')}
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();stale=[]
 for path,content in outputs().items():
  if a.check:
   if not path.is_file() or path.read_text(encoding='utf-8')!=content:stale.append(str(path.relative_to(ROOT)))
  else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8')
 if stale:raise SystemExit('Stale opcode 3 extension outputs: '+', '.join(stale))
 print('Opcode 3 extension codec '+('check' if a.check else 'generated')+': 2 files')
if __name__=='__main__':main()
