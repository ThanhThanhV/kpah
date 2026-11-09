export const WORLD_ZONES = [
  {
    id:'village',name:'Làng Sói Trắng',title:'LÀNG SÓI TRẮNG',subtitle:'Vùng đất khởi nguyên',kind:'safe',kindLabel:'Khu vực an toàn',recommendedLevel:1,requiredLevel:1,
    palette:{top:0x344c39,bottom:0x243b31,ground:0x3b563e,path:0x9a8867,accent:0x9a5542},
    entry:{x:480,y:330},exit:{x:920,y:395},npcs:[{name:'Trưởng làng',x:370,y:325,color:0xf0c16b,role:'elder'},{name:'Thương nhân',x:715,y:320,color:0x7ec3c8,role:'merchant'}],
    spawns:[{id:'wolf-east-1',type:'training-wolf',x:180,y:385},{id:'wolf-east-2',type:'training-wolf',x:265,y:455},{id:'wolf-west-1',type:'training-wolf',x:820,y:390},{id:'wolf-west-2',type:'training-wolf',x:755,y:455},{id:'wolf-alpha-1',type:'pack-leader',x:570,y:475}],
    connections:['forest']
  },
  {
    id:'forest',name:'Rừng Trúc',title:'RỪNG TRÚC',subtitle:'Lối mòn giữa rừng già',kind:'field',kindLabel:'Khu vực luyện cấp',recommendedLevel:15,requiredLevel:15,
    palette:{top:0x294b3c,bottom:0x1b382f,ground:0x315d42,path:0x887451,accent:0x537b49},
    entry:{x:65,y:410},exit:{x:900,y:405},npcs:[{name:'Thợ săn',x:180,y:345,color:0x9cbd75,role:'hunter'}],
    spawns:[{id:'forest-wolf-1',type:'training-wolf',x:350,y:370},{id:'forest-wolf-2',type:'training-wolf',x:460,y:450},{id:'forest-wolf-3',type:'training-wolf',x:650,y:360},{id:'forest-alpha-1',type:'pack-leader',x:790,y:470}],
    connections:['village','cave']
  },
  {
    id:'cave',name:'Hang Đá Đen',title:'HANG ĐÁ ĐEN',subtitle:'Hang động nguy hiểm',kind:'danger',kindLabel:'Khu vực nguy hiểm',recommendedLevel:20,requiredLevel:20,
    palette:{top:0x34353b,bottom:0x202329,ground:0x45434a,path:0x71665a,accent:0x856052},
    entry:{x:70,y:420},exit:{x:900,y:410},npcs:[{name:'Người canh hang',x:180,y:340,color:0xb18b6e,role:'guardian'}],
    spawns:[{id:'cave-wolf-1',type:'training-wolf',x:350,y:380},{id:'cave-wolf-2',type:'training-wolf',x:520,y:450},{id:'cave-alpha-1',type:'pack-leader',x:760,y:420}],
    connections:['forest']
  }
];

const clone=value=>JSON.parse(JSON.stringify(value));
export function getWorldZone(id){const zone=WORLD_ZONES.find(item=>item.id===id);return zone?clone(zone):null;}

export function createWorldMapState(initialZone='village'){
  let currentId=WORLD_ZONES.some(zone=>zone.id===initialZone)?initialZone:'village';
  function snapshot(){const current=getWorldZone(currentId);return {current,zones:WORLD_ZONES.map(zone=>({...clone(zone),connected:current.connections.includes(zone.id)}))};}
  function travel(zoneId,characterLevel=1){
    const destination=WORLD_ZONES.find(zone=>zone.id===zoneId);
    if(!destination)return {ok:false,message:'Không tìm thấy bản đồ.'};
    if(destination.id===currentId)return {ok:false,message:'Bạn đang ở khu vực này.'};
    const current=WORLD_ZONES.find(zone=>zone.id===currentId);
    if(!current.connections.includes(destination.id))return {ok:false,message:'Chưa có đường đi tới khu vực này.'};
    if(characterLevel<destination.requiredLevel)return {ok:false,message:'Cần đạt cấp '+destination.requiredLevel+' để tới '+destination.name+'.'};
    currentId=destination.id;
    return {ok:true,zone:getWorldZone(currentId),message:'Đã di chuyển tới '+destination.name+'.'};
  }
  function setCurrent(zoneId){
    if(!WORLD_ZONES.some(zone=>zone.id===zoneId))return null;
    currentId=zoneId;
    return getWorldZone(currentId);
  }
  return {snapshot,travel,setCurrent,getCurrent:()=>getWorldZone(currentId)};
}
