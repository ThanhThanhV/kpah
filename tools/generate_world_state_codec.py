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
 expected={4:'ENTITY_SPAWN_UPDATE',6:'COMBAT_EVENT_VARIANT_A',7:'ENTITY_STATE_UPDATE',8:'ENTITY_DESPAWN_LIST',9:'COMBAT_EVENT_VARIANT_B',12:'MAP_TRANSITION',17:'WORLD_ENTITY_ACTION_EVENT',18:'GROUND_ITEM_PICKUP',19:'GROUND_ITEM_REWARD',20:'ENTITY_REMOVE_TYPED',21:'INVENTORY_ITEM_UPDATE',27:'CHAT_BUBBLE_EVENT',28:'INVENTORY_ITEM_SOLD',30:'EXPERIENCE_UPDATE',32:'CHARACTER_RESOURCE_UPDATE',33:'CHARACTER_LEVEL_UP',2:'SERVER_TEXT_AND_OPTION_LIST',22:'WORLD_ENTITY_AUXILIARY_UPDATE',23:'INVENTORY_CONTEXT_VARIANTS',25:'STATIC_ITEM_AND_SHOP_CATALOG',26:'WORLD_RESOURCE_BUNDLE',35:'SKILL_PROGRESSION_GRID',64:'SKILL_RECORD_LIST',13:'CHARACTER_SELECTION_SERVER_ROSTER',15:'SHOP_CATALOG_VARIANTS',100:'RESOURCE_SLOT_METADATA_UPDATE',106:'MULTI_TARGET_COMBAT_EVENT',83:'TARGET_GROUP_STATE_UPDATE',10:'WORLD_ENTITY_SHORT_INT_PAIR_UPDATE',87:'WORLD_ACTIVITY_PANEL_VARIANTS',-7:'SOCIAL_CHARACTER_LIST_TYPE_1',-53:'SOCIAL_CHARACTER_LIST_TYPE_6',-5:'CHAT_MESSAGE_BATCH',37:'SERVER_DIALOG_EVENT',38:'WORLD_NOTICE_ENTRY',39:'REGISTRATION_SMS_RESULT',105:'MULTI_LEVEL_LOOKUP_TABLES',-27:'CHARACTER_PORTRAIT_IMAGE_UPDATE',-43:'WORLD_SPRITE_BUNDLE',-38:'WORLD_ENTITY_MARKER_LIST',-39:'WORLD_ENTITY_COUNTER_UPDATE',-42:'WORLD_ENTITY_BYTE_PAIR_MAP',-8:'RESOURCE_TRANSFER_VARIANTS',-9:'SHORT_ID_LIST_AND_MESSAGE',-10:'CHARACTER_PANEL_MESSAGE',-11:'CONFIRMATION_RESULT_VARIANTS',-12:'GUILD_OR_SOCIAL_RECORD',-17:'SYSTEM_ANNOUNCEMENT_LIST',-18:'GUILD_CHAT_MESSAGE',-19:'RANKING_RESULT_VARIANTS',-20:'GUILD_CURRENCY_REWARD',-22:'PET_EQUIPMENT_CONTEXT',-24:'WORLD_NOTICE_ACTION',-26:'WORLD_ENTITY_TEXT_UPDATE',-28:'WORLD_ENTITY_BINARY_UPDATE',-30:'WORLD_ENTITY_OPTION_LIST',-31:'WORLD_ENTITY_TEXT_OPTION',-32:'WORLD_ENTITY_TEXT_CONFIRMATION',-33:'WORLD_MAP_MARKER_UPDATE',-37:'QUEST_PROGRESS_VARIANTS',-50:'WORLD_ENTITY_POSITION_LABEL',-52:'WORLD_CONTEXT_CHOICE_LIST',-59:'WORLD_NPC_SPAWN_BATCH',-46:'RESOURCE_PANEL_VARIANT',-47:'RESOURCE_SLOT_BLOB',-48:'RESOURCE_TARGET_BLOB_VARIANT',-49:'ANIMATION_ASSET_VARIANTS',-51:'ANIMATION_IMAGE_REFRESH',-56:'COMPANION_RECORD_GROUPS',-57:'COMPANION_STATE_AND_SPRITE_DATA',-55:'WORLD_OBJECT_SPAWN_BATCH',-60:'WORLD_NOTICE_TEXT',-61:'WORLD_EVENT_MARKER',-62:'LUCKY_BOX_RESULT_VARIANTS',-63:'GRID_SELECTION_VALUES',-65:'WORLD_ENTITY_SHORT_SHORT_BYTE_EVENT',-41:'WORLD_ENTITY_SHORT_BYTE_SHORT_EVENT',58:'WORLD_SHORT_ID_LIST',61:'INVENTORY_ITEM_DROP_EVENT',78:'WAREHOUSE_ITEM_SALE'}
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
