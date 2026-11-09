const QUEST_CATALOG = [
  {
    id:'meet-elder',
    title:'Lời chỉ dẫn của trưởng làng',
    description:'Đến gặp trưởng làng để nghe chỉ dẫn trước khi rời làng.',
    objective:{type:'talk',target:'elder',label:'Nói chuyện với trưởng làng',required:1},
    reward:{experience:120,currency:80,items:[]}
  },
  {
    id:'wolf-patrol',
    title:'Dọn dẹp bầy sói',
    description:'Đánh bại sói luyện tập để giúp dân làng giữ an toàn khu vực.',
    objective:{type:'kill',target:'training-wolf',label:'Đánh bại Sói luyện tập',required:3},
    reward:{experience:420,currency:260,items:[{id:'small-potion',quantity:2}]}
  },
  {
    id:'meet-hunter',
    title:'Lời nhắn của thợ săn',
    description:'Tìm thợ săn tại Rừng Trúc để nhận lời khuyên về bầy thú.',
    objective:{type:'talk',target:'hunter',label:'Nói chuyện với thợ săn',required:1},
    reward:{experience:260,currency:150,items:[]}
  },
  {
    id:'meet-guardian',
    title:'Cánh cổng Hang Đá Đen',
    description:'Gặp người canh hang để tìm hiểu lối vào khu vực nguy hiểm.',
    objective:{type:'talk',target:'guardian',label:'Nói chuyện với người canh hang',required:1},
    reward:{experience:350,currency:200,items:[]}
  },
  {
    id:'village-supply',
    title:'Chuẩn bị hành trang',
    description:'Hoàn thành một nhiệm vụ trong làng và nhận phần thưởng.',
    objective:{type:'claim',target:'any',label:'Nhận phần thưởng nhiệm vụ',required:1},
    reward:{experience:180,currency:120,items:[{id:'upgrade-stone',quantity:2}]}
  }
];

const clone = value => JSON.parse(JSON.stringify(value));

export function createQuestState() {
  const quests = Object.fromEntries(QUEST_CATALOG.map(quest=>[quest.id,{
    ...clone(quest),status:'available',progress:0
  }]));
  const log = ['Sổ nhiệm vụ đã sẵn sàng. Hãy nhận nhiệm vụ từ trưởng làng.'];

  function addLog(message){
    log.unshift(message);
    log.splice(8);
  }

  function snapshot(){
    return {
      quests:clone(Object.values(quests)),
      log:[...log],
      counts:{
        active:Object.values(quests).filter(q=>q.status==='active').length,
        completed:Object.values(quests).filter(q=>q.status==='completed').length,
        claimed:Object.values(quests).filter(q=>q.status==='claimed').length
      }
    };
  }

  function accept(id){
    const quest=quests[id];
    if(!quest||quest.status!=='available')return {ok:false,message:'Nhiệm vụ này hiện không thể nhận.'};
    quest.status='active';
    addLog('Đã nhận nhiệm vụ: '+quest.title+'.');
    return {ok:true,message:'Đã nhận: '+quest.title+'.'};
  }

  function record(type,target,amount=1){
    const changes=[];
    for(const quest of Object.values(quests)){
      if(quest.status!=='active'||quest.objective.type!==type||quest.objective.target!==target)continue;
      quest.progress=Math.min(quest.objective.required,quest.progress+Math.max(1,Math.floor(amount)||1));
      if(quest.progress>=quest.objective.required){
        quest.status='completed';
        addLog('Hoàn thành mục tiêu: '+quest.title+'.');
      }
      changes.push({id:quest.id,status:quest.status,progress:quest.progress});
    }
    return changes;
  }

  function claim(id){
    const quest=quests[id];
    if(!quest||quest.status!=='completed')return {ok:false,message:'Chưa hoàn thành điều kiện nhận thưởng.'};
    quest.status='claimed';
    addLog('Đã nhận thưởng nhiệm vụ: '+quest.title+'.');
    return {ok:true,message:'Đã nhận thưởng: '+quest.title+'.',reward:clone(quest.reward)};
  }

  return {snapshot,accept,record,claim};
}
