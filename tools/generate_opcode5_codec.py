#!/usr/bin/env python3
"""Generate source-backed S2C opcode 5 world entity snapshot codecs."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; SPEC=ROOT/'protocol/protocol.yaml'
JS=ROOT/'src/protocol/generated/opcode5-codec.js'; JAVA=ROOT/'protocol/generated/java/com/kpah/protocol/generated/ProtocolOpcode5Codec.java'
JT=ROOT/'tools/opcode5-codec.js.template'; CT=ROOT/'tools/ProtocolOpcode5Codec.java.template'
def outputs():
 s=json.loads(SPEC.read_text(encoding='utf-8')); a=[x for x in s.get('packetSchemas',[]) if x.get('direction')=='S2C' and x.get('opcode')==5 and x.get('name')=='WORLD_ENTITY_SNAPSHOT']
 if len(a)!=1 or a[0].get('evidenceSource')!='ka.java:case5; z.java fields': raise ValueError('Missing opcode 5 source schema')
 return {JS:JT.read_text(encoding='utf-8'),JAVA:CT.read_text(encoding='utf-8')}
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();bad=[]
 for f,c in outputs().items():
  if a.check:
   if not f.is_file() or f.read_text(encoding='utf-8')!=c:bad.append(str(f.relative_to(ROOT)))
  else:f.parent.mkdir(parents=True,exist_ok=True);f.write_text(c,encoding='utf-8')
 if bad:raise SystemExit('Stale opcode 5 outputs: '+', '.join(bad))
 print('Opcode 5 codec '+('check' if a.check else 'generated')+': 2 files')
if __name__=='__main__':main()
