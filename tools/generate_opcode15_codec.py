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
    header=[['subtype','i8'],['targetCharacterId','i16'],['itemCount','i8']]
    item_base=[['itemType','i8'],['i','i16'],['r','i16'],['s','i8'],['y','i8'],['v','i16'],['u','i16'],
      ['K','i8'],['L','i8'],['n','i8'],['o','i8'],['p','i8'],['q','i8'],['C','i8'],['d','utf']]
    expected_layouts={
      'SHOP_CONTEXT_VARIANT_0': {
        'header':header,
        'itemRecord':item_base+[['w','u16'],['statCount','i8'],['stats','repeat(u8 statId,i16 statValue)']],
        'trailer':[['aS','i8'],['shortValues','i16[5]'],['optionalTextSentinel','i8'],
          ['if sentinel != -1',['optionalText','utf'],['am','i8']],['optionalContextSentinel','i8'],
          ['if sentinel != -1',['discardedTypeByte','i8'],['S','i16'],['M','i8'],['Y','utf'],['V','i32']]]
      },
      'PET_EQUIPMENT_IMAGE_NONZERO': {
        'header':header,
        'itemRecord':item_base+[['statCount','i8'],['stats','repeat(u8 statId,i16 statValue)']],
        'trailer':[['frameCount','i8'],['imageBytes','remaining-bytes']]
      }
    }
    for s in schemas:
        if s.get('direction')!='S2C' or s.get('evidenceSource')!='ka.java:case15': raise ValueError('Opcode 15 schema lacks CFR evidence')
        if s.get('layout') != expected_layouts[s['name']]:
            raise ValueError('Opcode 15 wire layout does not match the generator template: '+s['name'])
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
