const CATALOG=[
 {id:'thien-kiem',name:'Thiên Kiếm',level:4,members:18,notice:'Đoàn kết săn quái và hỗ trợ tân thủ.',requirement:1},
 {id:'bach-nguyet',name:'Bạch Nguyệt',level:2,members:9,notice:'Ưu tiên hoạt động và nhiệm vụ bang hội.',requirement:10},
 {id:'long-mon',name:'Long Môn',level:1,members:5,notice:'Bang hội mới, cùng nhau phát triển.',requirement:1}
];
const copy=value=>JSON.parse(JSON.stringify(value));
export function createGuildState(){
 let guild=null,applications=[],log=[];
 function snapshot(){return {guild:copy(guild),catalog:copy(CATALOG),applications:copy(applications),log:[...log]};}
 function restore(saved){
  if(!saved||typeof saved!=='object')return false;
  guild=null;applications=[];log=[];
  const id=saved.guild?.id;
  if(CATALOG.some(item=>item.id===id)){const target=CATALOG.find(item=>item.id===id);const contribution=Math.max(0,Math.min(100000000,Math.floor(Number(saved.guild.contribution)||0)));guild={...copy(target),memberCount:target.members,role:'Thành viên',contribution,donations:Math.max(0,Math.min(1000000,Math.floor(Number(saved.guild.donations)||0))),members:[{id:'player',name:'Kiếm Khách',role:'Bang chúng',contribution},{id:'guild-leader',name:'ThiênMệnh',role:'Bang chủ',contribution:5200},{id:'guild-officer',name:'PhongVân',role:'Trưởng lão',contribution:2100}]};}
  applications=Array.isArray(saved.applications)?saved.applications.filter(value=>CATALOG.some(item=>item.id===value)&&(!guild||guild.id!==value)):[];
  log=Array.isArray(saved.log)?saved.log.filter(value=>typeof value==='string').slice(0,30):[];
  return true;
 }
 function apply(id){if(guild)return {ok:false,message:'Bạn đã thuộc một bang hội.'};const target=CATALOG.find(item=>item.id===id);if(!target)return {ok:false,message:'Không tìm thấy bang hội.'};if(applications.includes(id))return {ok:false,message:'Bạn đã gửi đơn vào bang hội này.'};applications.push(id);log.unshift('Đã gửi đơn xin gia nhập '+target.name+'.');return {ok:true,message:'Đã gửi đơn xin gia nhập '+target.name+'.'};}
 function join(id){if(guild)return {ok:false,message:'Bạn đã thuộc một bang hội.'};const target=CATALOG.find(item=>item.id===id);if(!target)return {ok:false,message:'Không tìm thấy bang hội.'};guild={...copy(target),memberCount:target.members,role:'Thành viên',contribution:0,donations:0,members:[{id:'player',name:'Kiếm Khách',role:'Bang chúng',contribution:0},{id:'guild-leader',name:'ThiênMệnh',role:'Bang chủ',contribution:5200},{id:'guild-officer',name:'PhongVân',role:'Trưởng lão',contribution:2100}]};applications=applications.filter(value=>value!==id);log.unshift('Đã gia nhập bang hội '+target.name+'.');return {ok:true,message:'Đã gia nhập '+target.name+'.'};}
 function donate(amount){if(!guild)return {ok:false,message:'Bạn chưa gia nhập bang hội.'};if(!Number.isInteger(amount)||amount<100||amount>10000)return {ok:false,message:'Mỗi lần cống hiến từ 100 đến 10.000 Xu.'};guild.contribution+=amount;guild.donations++;guild.members[0].contribution+=amount;log.unshift('Đã cống hiến '+amount.toLocaleString('vi-VN')+' Xu cho bang hội.');return {ok:true,message:'Cống hiến thành công '+amount.toLocaleString('vi-VN')+' Xu.'};}
 function leave(){if(!guild)return {ok:false,message:'Bạn chưa gia nhập bang hội.'};const name=guild.name;guild=null;log.unshift('Đã rời bang hội '+name+'.');return {ok:true,message:'Đã rời bang hội.'};}
 return {snapshot,restore,apply,join,donate,leave};
}
