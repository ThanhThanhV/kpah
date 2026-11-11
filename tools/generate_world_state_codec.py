#!/usr/bin/env python3
"""Generate source-bounded S2C world entity/map packet decoders."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SPEC=ROOT/'protocol/protocol.yaml'
JS=ROOT/'src/protocol/generated/world-state-codec.js'
JAVA=ROOT/'protocol/generated/java/com/kpah/protocol/generated/ProtocolWorldStateCodec.java'
JT=ROOT/'tools/world-state-codec.js.template'
CT=ROOT/'tools/ProtocolWorldStateCodec.java.template'
def outputs():
 spec=json.loads(SPEC.read_text(encoding='utf-8'))
 schemas=spec.get('packetSchemas',[])
 expected={4:'ENTITY_SPAWN_UPDATE',8:'ENTITY_DESPAWN_LIST',12:'MAP_TRANSITION'}
 for opcode,name in expected.items():
  matches=[s for s in schemas if s.get('direction')=='S2C' and s.get('opcode')==opcode and s.get('name')==name]
  if len(matches)!=1 or matches[0].get('evidenceSource')!='ka.java:case'+str(opcode): raise ValueError('Missing world packet schema '+name)
 return {JS:JT.read_text(encoding='utf-8'),JAVA:CT.read_text(encoding='utf-8')}
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();stale=[]
 for path,content in outputs().items():
  if a.check:
   if not path.is_file() or path.read_text(encoding='utf-8')!=content:stale.append(str(path.relative_to(ROOT)))
  else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8')
 if stale:raise SystemExit('Stale world-state outputs: '+', '.join(stale))
 print('World-state codec '+('check' if a.check else 'generated')+': 2 files')
if __name__=='__main__':main()
