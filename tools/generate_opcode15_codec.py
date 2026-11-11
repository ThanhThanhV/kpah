#!/usr/bin/env python3
"""Generate evidence-bounded S2C opcode 15 variants from protocol.yaml."""
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SPEC=ROOT/'protocol/protocol.yaml'
JS=ROOT/'src/protocol/generated/opcode15-codec.js'
JAVA=ROOT/'protocol/generated/java/com/kpah/protocol/generated/ProtocolOpcode15Codec.java'
JS_TEMPLATE=ROOT/'tools/opcode15-codec.js.template'
JAVA_TEMPLATE=ROOT/'tools/ProtocolOpcode15Codec.java.template'
def outputs():
    spec=json.loads(SPEC.read_text(encoding='utf-8'))
    schemas=spec.get('variantSchemas',[])
    expected={(15,0,'SHOP_CONTEXT_VARIANT_0'),(15,'nonzero','PET_EQUIPMENT_IMAGE_NONZERO')}
    actual={(int(s['opcode']),s['subtype'],s['name']) for s in schemas}
    if actual != expected: raise ValueError(f'Opcode 15 schema declarations mismatch: {actual}')
    for s in schemas:
        if s.get('direction')!='S2C' or s.get('evidenceSource')!='ka.java:case15': raise ValueError('Opcode 15 schema lacks CFR evidence')
        layout=s.get('layout',{})
        if not isinstance(layout.get('header'),list) or len(layout.get('header'))!=3:
            raise ValueError('Opcode 15 variant must declare the 3-field packet header')
        if not isinstance(layout.get('itemRecord'),list) or not layout['itemRecord']:
            raise ValueError('Opcode 15 variant must declare its item record order')
        if not isinstance(layout.get('trailer'),list) or not layout['trailer']:
            raise ValueError('Opcode 15 variant must declare its trailer')
    return {JS:JS_TEMPLATE.read_text(encoding='utf-8'),JAVA:JAVA_TEMPLATE.read_text(encoding='utf-8')}
def main():
    p=argparse.ArgumentParser(); p.add_argument('--check',action='store_true'); a=p.parse_args(); stale=[]
    for path,content in outputs().items():
        if a.check:
            if not path.is_file() or path.read_text(encoding='utf-8')!=content: stale.append(str(path.relative_to(ROOT)))
        else: path.parent.mkdir(parents=True,exist_ok=True); path.write_text(content,encoding='utf-8')
    if stale: raise SystemExit('Stale opcode 15 outputs: '+', '.join(stale))
    print('Opcode 15 codec '+('check' if a.check else 'generated')+': 2 files')
if __name__=='__main__': main()
