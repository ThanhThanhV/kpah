const clone=value=>JSON.parse(JSON.stringify(value));

export function createGroundDropState(){
  let mapId='village';
  let sequence=0;
  let drops=[];
  function snapshot(){return {mapId,drops:clone(drops)};}
  function setMap(id){mapId=id;drops=[];return snapshot();}
  function spawn(monster,items,now=Date.now()){
    const created=items.map(item=>({
      id:'ground-drop-'+(++sequence),mapId,
      itemId:item.itemId,quantity:item.quantity,
      x:monster.x+((sequence%3)-1)*18,y:monster.y+20,
      createdAt:now,expiresAt:now+90000
    }));
    drops.push(...created);
    return clone(created);
  }
  function pickup(id,now=Date.now()){
    const index=drops.findIndex(item=>item.id===id);
    if(index<0)return {ok:false,message:'Vật phẩm không còn trên mặt đất.'};
    if(now>=drops[index].expiresAt){drops.splice(index,1);return {ok:false,message:'Vật phẩm đã biến mất.'};}
    const [item]=drops.splice(index,1);
    return {ok:true,item:clone(item)};
  }
  function update(now=Date.now()){
    const before=drops.length;
    drops=drops.filter(item=>item.expiresAt>now);
    return before-drops.length;
  }
  function nearest(x,y,maxDistance=80){
    let best=null,bestDistance=maxDistance;
    for(const item of drops){
      const distance=Math.hypot(item.x-x,item.y-y);
      if(distance<=bestDistance){best=item;bestDistance=distance;}
    }
    return best?{...clone(best),distance:bestDistance}:null;
  }
  return {snapshot,setMap,spawn,pickup,update,nearest};
}
