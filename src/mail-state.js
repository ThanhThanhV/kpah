const copy=value=>JSON.parse(JSON.stringify(value));
export function createMailState(){
 let messages=[
  {id:'welcome-278',sender:'Hệ thống',subject:'Quà chào mừng',body:'Chào mừng bạn đến với thế giới Khí Phách Anh Hùng. Đây là thư minh họa cho giao diện hòm thư.',sentAt:'Hôm nay',attachments:[{type:'currency',amount:500}],claimed:false,read:false},
  {id:'travel-note',sender:'Trưởng làng',subject:'Lời nhắn trước chuyến đi',body:'Hãy chuẩn bị bình hồi phục trước khi tiến vào Rừng Trúc.',sentAt:'Hôm nay',attachments:[],claimed:true,read:false}
 ];
 function snapshot(){return {messages:copy(messages),unread:messages.filter(item=>!item.read).length};}
 function restore(saved){
  if(!saved||!Array.isArray(saved.messages))return false;
  for(const candidate of saved.messages){const message=messages.find(item=>item.id===candidate?.id);if(message){message.read=candidate.read===true;message.claimed=candidate.claimed===true;}}
  return true;
 }
 function read(id){const item=messages.find(value=>value.id===id);if(!item)return {ok:false,message:'Không tìm thấy thư.'};item.read=true;return {ok:true,message:'Đã mở thư.'};}
 function claim(id){const item=messages.find(value=>value.id===id);if(!item)return {ok:false,message:'Không tìm thấy thư.'};if(item.claimed)return {ok:false,message:'Phần thưởng đã được nhận.'};item.claimed=true;return {ok:true,message:'Đã nhận phần thưởng thư.',attachments:copy(item.attachments)};}
 return {snapshot,restore,read,claim};
}
