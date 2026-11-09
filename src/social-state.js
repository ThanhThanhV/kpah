const FRIENDS=[
  {id:'phong-van',name:'PhongVân',level:27,profession:'Kiếm khách',status:'online'},
  {id:'hoa-long',name:'HỏaLong',level:31,profession:'Chiến binh',status:'online'},
  {id:'nguyet-nhi',name:'NguyệtNhi',level:24,profession:'Cung thủ',status:'online'}
];
const clone=value=>JSON.parse(JSON.stringify(value));
export function createSocialState(){
  let friends=clone(FRIENDS);
  let party=null;
  let invitations=[];
  let log=[];
  function snapshot(){return {friends:clone(friends),party:clone(party),invitations:clone(invitations),log:[...log]};}
  function inviteFriend(id){
    const friend=friends.find(item=>item.id===id);
    if(!friend)return {ok:false,message:'Không tìm thấy người chơi.'};
    if(friend.status!=='online')return {ok:false,message:'Người chơi hiện không trực tuyến.'};
    if(!party)party={leader:'player',members:[{id:'player',name:'Kiếm Khách',level:25,profession:'Kiếm khách',role:'leader'}]};
    if(party.members.some(item=>item.id===id))return {ok:false,message:'Người chơi đã ở trong tổ đội.'};
    if(party.members.length>=5)return {ok:false,message:'Tổ đội đã đủ 5 thành viên.'};
    invitations.push({id:'invite-'+id,friendId:id,name:friend.name,status:'pending'});
    log.unshift('Đã gửi lời mời tổ đội tới '+friend.name+'.');
    return {ok:true,message:'Đã gửi lời mời tới '+friend.name+'.'};
  }
  function resolveInvitation(id,accepted){
    const invite=invitations.find(item=>item.id===id&&item.status==='pending');
    if(!invite)return {ok:false,message:'Lời mời không còn hiệu lực.'};
    invite.status=accepted?'accepted':'declined';
    if(accepted){
      const friend=friends.find(item=>item.id===invite.friendId);
      if(!party)party={leader:'player',members:[{id:'player',name:'Kiếm Khách',level:25,profession:'Kiếm khách',role:'leader'}]};
      if(party.members.length>=5)return {ok:false,message:'Tổ đội đã đủ 5 thành viên.'};
      party.members.push({...clone(friend),role:'member'});
    }
    log.unshift((accepted?'Đã chấp nhận':'Đã từ chối')+' lời mời của '+invite.name+'.');
    return {ok:true,message:accepted?'Đã thêm '+invite.name+' vào tổ đội.':'Đã từ chối lời mời.'};
  }
  function leaveParty(){if(!party)return {ok:false,message:'Bạn chưa có tổ đội.'};party=null;log.unshift('Bạn đã rời tổ đội.');return {ok:true,message:'Đã rời tổ đội.'};}
  function removeMember(id){if(!party||party.leader!=='player')return {ok:false,message:'Chỉ đội trưởng mới có thể mời hoặc loại thành viên.'};party.members=party.members.filter(item=>item.id!==id);return {ok:true,message:'Đã mời thành viên rời tổ đội.'};}
  function restore(saved){
    if(!saved||typeof saved!=='object')return false;
    const base=new Map(FRIENDS.map(friend=>[friend.id,clone(friend)]));
    if(Array.isArray(saved.friends))for(const item of saved.friends.slice(0,100)){
      if(!item||typeof item.id!=='string'||typeof item.name!=='string')continue;
      if(base.has(item.id)){base.get(item.id).status=item.status==='offline'?'offline':'online';}
      else if(item.id.startsWith('friend-')&&item.name.trim().length>=2&&item.name.trim().length<=20){base.set(item.id,{id:item.id,name:item.name.trim(),level:Math.max(1,Math.min(10000,Math.floor(Number(item.level)||1))),profession:typeof item.profession==='string'?item.profession.slice(0,40):'Chưa rõ',status:'offline'});}
    }
    friends=[...base.values()];
    if(saved.party&&saved.party.leader==='player'&&Array.isArray(saved.party.members)){
      const allowed=new Map(friends.map(friend=>[friend.id,friend]));
      const members=[{id:'player',name:'Kiếm Khách',level:25,profession:'Kiếm khách',role:'leader'}];
      for(const member of saved.party.members){const friend=allowed.get(member?.id);if(friend&&!members.some(entry=>entry.id===friend.id)&&members.length<5)members.push({...clone(friend),role:'member'});}
      party=members.length>1?{leader:'player',members}:null;
    }else party=null;
    invitations=Array.isArray(saved.invitations)?saved.invitations.filter(item=>item&&friends.some(friend=>friend.id===item.friendId)&&['pending','accepted','declined'].includes(item.status)).slice(0,50).map(item=>({id:'invite-'+item.friendId,friendId:item.friendId,name:friends.find(friend=>friend.id===item.friendId).name,status:item.status})):[];
    log=Array.isArray(saved.log)?saved.log.filter(item=>typeof item==='string').slice(0,30):[];
    return true;
  }
  function addFriend(name){
    const value=String(name||'').trim();
    if(value.length<2||value.length>20)return {ok:false,message:'Tên nhân vật phải có từ 2 đến 20 ký tự.'};
    if(friends.some(item=>item.name.toLowerCase()===value.toLowerCase()))return {ok:false,message:'Người chơi đã có trong danh sách.'};
    const friend={id:'friend-'+Date.now(),name:value,level:1,profession:'Chưa rõ',status:'offline'};
    friends.push(friend);log.unshift('Đã thêm '+value+' vào danh sách bạn bè.');
    return {ok:true,message:'Đã thêm '+value+' vào danh sách bạn bè.'};
  }
  return {snapshot,restore,inviteFriend,resolveInvitation,leaveParty,removeMember,addFriend};
}
