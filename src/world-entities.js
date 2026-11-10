import { getWorldZone } from './world-map.js';

const MONSTER_TYPES = [
  {id:'training-wolf',name:'Sói hoang',level:18,maxHp:620,defense:5,experience:45,damage:16,respawnSeconds:18,drops:[{itemId:'small-potion',chance:0.28,min:1,max:1},{itemId:'upgrade-stone',chance:0.18,min:1,max:1}]},
  {id:'pack-leader',name:'Sói đầu đàn',level:22,maxHp:1450,defense:13,experience:135,damage:29,respawnSeconds:32,drops:[{itemId:'small-potion',chance:0.65,min:1,max:2},{itemId:'upgrade-stone',chance:0.55,min:1,max:2}]}
];

const copy = value => JSON.parse(JSON.stringify(value));

export function createWorldEntityState(random = Math.random, initialMap = 'village') {
  let mapId = getWorldZone(initialMap)?.id || 'village';
  let monsters = createMonsters(mapId);
  function createMonsters(zoneId) {
    const zone = getWorldZone(zoneId);
    return (zone?.spawns || []).map(point => {
      const type = MONSTER_TYPES.find(entry => entry.id === point.type);
      return {...copy(type),...point,mapId:zoneId,hp:type.maxHp,alive:true,respawnAt:null};
    });
  }
  let selectedId = monsters[0]?.id || null;

  function snapshot() {
    return {mapId,monsters:copy(monsters),selectedId,selected:copy(monsters.find(item=>item.id===selectedId)||null)};
  }
  function setMap(zoneId) {
    const zone=getWorldZone(zoneId);
    if(!zone)return {ok:false,message:'Không tìm thấy dữ liệu quái của bản đồ.'};
    mapId=zoneId;
    monsters=createMonsters(zoneId);
    selectedId=monsters[0]?.id||null;
    return {ok:true,mapId,monsters:copy(monsters),selected:copy(monsters[0]||null)};
  }
  function select(id) {
    const monster=monsters.find(item=>item.id===id&&item.alive);
    if(!monster)return {ok:false,message:'Mục tiêu không còn ở đây.'};
    selectedId=id;
    return {ok:true,monster:copy(monster)};
  }
  function damage(id,amount,now=Date.now()) {
    const monster=monsters.find(item=>item.id===id&&item.alive);
    if(!monster)return {ok:false,defeated:false,damage:0};
    const dealt=Math.min(monster.hp,Math.max(0,Math.floor(Number(amount)||0)));
    monster.hp-=dealt;
    const defeated=monster.hp<=0;
    let drops=[];
    if(defeated){
      monster.alive=false;
      monster.respawnAt=now+monster.respawnSeconds*1000;
      drops=monster.drops.filter(drop=>random()<drop.chance).map(drop=>({itemId:drop.itemId,quantity:drop.min+Math.floor(random()*(drop.max-drop.min+1))}));
      if(selectedId===id)selectedId=monsters.find(item=>item.alive)?.id||null;
    }
    return {ok:true,defeated,damage:dealt,monster:copy(monster),experience:defeated?monster.experience:0,drops};
  }
  function update(now=Date.now()) {
    const revived=[];
    for(const monster of monsters){
      if(!monster.alive&&monster.respawnAt!==null&&now>=monster.respawnAt){
        monster.hp=monster.maxHp;monster.alive=true;monster.respawnAt=null;revived.push(monster.id);
      }
    }
    if(!monsters.some(item=>item.id===selectedId&&item.alive))selectedId=monsters.find(item=>item.alive)?.id||null;
    return revived;
  }
  function move(id,x,y) {
    const monster=monsters.find(item=>item.id===id&&item.alive);
    if(!monster||!Number.isFinite(x)||!Number.isFinite(y))return false;
    monster.x=x;monster.y=y;
    return true;
  }
  function get(id) { return copy(monsters.find(item=>item.id===id)||null); }
  return {snapshot,select,damage,update,get,move,setMap};
}
