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
 expected={4:'ENTITY_SPAWN_UPDATE',6:'COMBAT_EVENT_VARIANT_A',7:'ENTITY_STATE_UPDATE',8:'ENTITY_DESPAWN_LIST',9:'COMBAT_EVENT_VARIANT_B',12:'MAP_TRANSITION',17:'WORLD_ENTITY_ACTION_EVENT',18:'GROUND_ITEM_PICKUP',19:'GROUND_ITEM_REWARD',20:'ENTITY_REMOVE_TYPED',21:'INVENTORY_ITEM_UPDATE',27:'CHAT_BUBBLE_EVENT',28:'INVENTORY_ITEM_SOLD',30:'EXPERIENCE_UPDATE',32:'CHARACTER_RESOURCE_UPDATE',33:'CHARACTER_LEVEL_UP',2:'SERVER_TEXT_AND_OPTION_LIST',22:'WORLD_ENTITY_AUXILIARY_UPDATE',23:'INVENTORY_CONTEXT_VARIANTS',25:'STATIC_ITEM_AND_SHOP_CATALOG',26:'WORLD_RESOURCE_BUNDLE',35:'SKILL_PROGRESSION_GRID',64:'SKILL_RECORD_LIST',-5:'CHAT_MESSAGE_BATCH',37:'SERVER_DIALOG_EVENT',38:'WORLD_NOTICE_ENTRY',39:'REGISTRATION_SMS_RESULT',105:'MULTI_LEVEL_LOOKUP_TABLES',-27:'CHARACTER_PORTRAIT_IMAGE_UPDATE',-43:'WORLD_SPRITE_BUNDLE',-38:'WORLD_ENTITY_MARKER_LIST',-39:'WORLD_ENTITY_COUNTER_UPDATE',-42:'WORLD_ENTITY_BYTE_PAIR_MAP',-8:'RESOURCE_TRANSFER_VARIANTS',-9:'SHORT_ID_LIST_AND_MESSAGE',-10:'CHARACTER_PANEL_MESSAGE',-11:'CONFIRMATION_RESULT_VARIANTS',-12:'GUILD_OR_SOCIAL_RECORD',-17:'SYSTEM_ANNOUNCEMENT_LIST',-18:'GUILD_CHAT_MESSAGE',-19:'RANKING_RESULT_VARIANTS',-20:'GUILD_CURRENCY_REWARD',-22:'PET_EQUIPMENT_CONTEXT',-24:'WORLD_NOTICE_ACTION',-26:'WORLD_ENTITY_TEXT_UPDATE',-28:'WORLD_ENTITY_BINARY_UPDATE',-30:'WORLD_ENTITY_OPTION_LIST',-31:'WORLD_ENTITY_TEXT_OPTION',-32:'WORLD_ENTITY_TEXT_CONFIRMATION','PET_EQUIPMENT_CONTEXT',61:'INVENTORY_ITEM_DROP_EVENT',78:'WAREHOUSE_ITEM_SALE'}
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
