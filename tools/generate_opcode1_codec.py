#!/usr/bin/env python3
"""Generate source-bounded S2C opcode 1 global configuration decoders."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SPEC=ROOT/'protocol/protocol.yaml'
JS=ROOT/'src/protocol/generated/opcode1-codec.js'
JAVA=ROOT/'protocol/generated/java/com/kpah/protocol/generated/ProtocolOpcode1Codec.java'
JT=ROOT/'tools/opcode1-codec.js.template'
CT=ROOT/'tools/ProtocolOpcode1Codec.java.template'
def outputs():
 spec=json.loads(SPEC.read_text(encoding='utf-8'))
 schemas=spec.get('packetSchemas',[])
 matches=[s for s in schemas if s.get('direction')=='S2C' and s.get('opcode')==1 and s.get('name')=='GLOBAL_CLIENT_CONFIGURATION']
 if len(matches)!=1 or matches[0].get('evidenceSource')!='ka.java:case1': raise ValueError('Missing source-backed opcode 1 schema')
 if matches[0].get('sections')!=['movement+ticket','skill-definitions','profession-slot-counts','five-profession-skill-catalogs','optional-unlock-and-5x5-matrices','four-global-bytes','stat-label-catalog','support-hotline','paired-lookups','quest-objective-catalog','external-url','named-tile-blobs','part-data-table-best-effort']:
  raise ValueError('Opcode 1 section order differs from generator contract')
 return {JS:JT.read_text(encoding='utf-8'),JAVA:CT.read_text(encoding='utf-8')}
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();stale=[]
 for path,content in outputs().items():
  if a.check:
   if not path.is_file() or path.read_text(encoding='utf-8')!=content:stale.append(str(path.relative_to(ROOT)))
  else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8')
 if stale:raise SystemExit('Stale opcode 1 outputs: '+', '.join(stale))
 print('Opcode 1 codec '+('check' if a.check else 'generated')+': 2 files')
if __name__=='__main__':main()
