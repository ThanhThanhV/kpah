const STAT_LABELS = {
  strength: 'Sức mạnh',
  stamina: 'Thể lực',
  agility: 'Nhanh nhẹn',
  spirit: 'Tinh thần'
};

const EQUIPMENT_SLOTS = [
  ['head', 'Mũ', '♜'],
  ['body', 'Áo', '♧'],
  ['weapon', 'Vũ khí', '⚔'],
  ['gloves', 'Găng', '♢'],
  ['boots', 'Giày', '⌑'],
  ['ring', 'Nhẫn', '◉'],
  ['necklace', 'Dây chuyền', '◇'],
  ['charm', 'Bùa', '✧']
];

const INITIAL_ITEMS = [
  {id:'starter-sword',name:'Kiếm tân thủ',category:'equipment',slot:'weapon',icon:'⚔',quantity:1,bonus:{strength:8}},
  {id:'cloth-hat',name:'Mũ vải',category:'equipment',slot:'head',icon:'♜',quantity:1,bonus:{stamina:3}},
  {id:'cloth-armor',name:'Áo vải',category:'equipment',slot:'body',icon:'♧',quantity:1,bonus:{stamina:6}},
  {id:'small-potion',name:'Bình máu nhỏ',category:'consumable',icon:'🧪',quantity:5,restore:{hp:350}},
  {id:'small-mana',name:'Bình mana nhỏ',category:'consumable',icon:'🧴',quantity:5,restore:{mp:220}},
  {id:'bronze-ring',name:'Nhẫn đồng',category:'equipment',slot:'ring',icon:'◉',quantity:1,bonus:{agility:4}},
  {id:'upgrade-stone',name:'Đá cường hóa',category:'material',icon:'◆',quantity:8},
  {id:'village-charm',name:'Lá bùa',category:'quest',icon:'✧',quantity:1}
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createCharacterState() {
  const state = {
    name: 'Kiếm Khách',
    profession: 'Kiếm Khách',
    level: 25,
    experience: 72450,
    nextLevelExperience: 90000,
    baseStats: {strength:40,stamina:32,agility:28,spirit:20},
    statPoints: 5,
    currency: 125600,
    hp: 1250,
    mp: 680,
    inventoryCapacity: 30,
    inventory: clone(INITIAL_ITEMS.filter(item => !['starter-sword','cloth-hat','cloth-armor'].includes(item.id))),
    equipment: {head:'cloth-hat',body:'cloth-armor',weapon:'starter-sword',gloves:null,boots:null,ring:null,necklace:null,charm:null}
  };

  function findItem(id) {
    return state.inventory.find(item => item.id === id);
  }

  function effectiveStats() {
    const result = {...state.baseStats};
    for (const id of Object.values(state.equipment)) {
      const item = id && (findItem(id) || INITIAL_ITEMS.find(entry => entry.id === id));
      if (!item?.bonus) continue;
      for (const [key,value] of Object.entries(item.bonus)) {
        if (key in result) result[key] += value;
      }
    }
    return result;
  }

  function limits() {
    const stats = effectiveStats();
    return {maxHp:1000+stats.stamina*10,maxMp:500+stats.spirit*8};
  }

  function snapshot() {
    const stats = effectiveStats();
    const {maxHp,maxMp} = limits();
    state.hp = Math.min(state.hp,maxHp);
    state.mp = Math.min(state.mp,maxMp);
    return {
      ...clone(state),
      stats,
      maxHp,
      maxMp,
      equipmentSlots: clone(EQUIPMENT_SLOTS)
    };
  }

  function equip(itemId) {
    const item = findItem(itemId);
    if (!item || item.category !== 'equipment' || !item.slot || !(item.slot in state.equipment)) {
      return {ok:false,message:'Vật phẩm này không thể trang bị.'};
    }
    const previousId = state.equipment[item.slot];
    state.equipment[item.slot] = item.id;
    state.inventory = state.inventory.filter(entry => entry.id !== item.id);
    if (previousId) state.inventory.push(INITIAL_ITEMS.find(entry => entry.id === previousId) || {id:previousId,name:'Trang bị',category:'equipment',slot:item.slot,icon:'◇',quantity:1,bonus:{}});
    const {maxHp,maxMp} = limits();
    state.hp = Math.min(state.hp,maxHp);
    state.mp = Math.min(state.mp,maxMp);
    return {ok:true,message:'Đã trang bị '+item.name+'.'};
  }

  function unequip(slot) {
    const itemId = state.equipment[slot];
    if (!itemId) return {ok:false,message:'Ô trang bị đang trống.'};
    if (state.inventory.length >= state.inventoryCapacity) return {ok:false,message:'Hành trang đã đầy.'};
    const item = INITIAL_ITEMS.find(entry => entry.id === itemId);
    state.equipment[slot] = null;
    if (item) state.inventory.push(clone(item));
    const {maxHp,maxMp} = limits();
    state.hp = Math.min(state.hp,maxHp);
    state.mp = Math.min(state.mp,maxMp);
    return {ok:true,message:'Đã tháo trang bị.'};
  }

  function useItem(itemId) {
    const item = findItem(itemId);
    if (!item || item.category !== 'consumable') return {ok:false,message:'Không thể sử dụng vật phẩm này.'};
    const {maxHp,maxMp} = limits();
    let restored = 0;
    if (item.restore?.hp && state.hp < maxHp) {
      restored = Math.min(item.restore.hp,maxHp-state.hp);
      state.hp += restored;
    } else if (item.restore?.mp && state.mp < maxMp) {
      restored = Math.min(item.restore.mp,maxMp-state.mp);
      state.mp += restored;
    } else {
      return {ok:false,message:'Sinh lực hoặc nội lực đã đầy.'};
    }
    item.quantity -= 1;
    if (item.quantity <= 0) state.inventory = state.inventory.filter(entry => entry.id !== itemId);
    return {ok:true,message:'Đã hồi '+restored+' điểm.'};
  }

  function allocateStat(key) {
    if (!(key in STAT_LABELS) || state.statPoints <= 0) return {ok:false,message:'Không đủ điểm tiềm năng.'};
    state.baseStats[key] += 1;
    state.statPoints -= 1;
    const {maxHp,maxMp} = limits();
    if (key === 'stamina') state.hp = Math.min(maxHp,state.hp+10);
    if (key === 'spirit') state.mp = Math.min(maxMp,state.mp+8);
    return {ok:true,message:'Đã tăng '+STAT_LABELS[key]+'.'};
  }

  function setIdentity(name,profession) {
    if (typeof name === 'string' && name.trim()) state.name = name.trim().slice(0,16);
    if (typeof profession === 'string' && profession.trim()) state.profession = profession.trim();
  }

  function spendMp(amount) {
    if (!Number.isFinite(amount) || amount < 0 || state.mp < amount) return {ok:false,spent:0};
    state.mp -= amount;
    return {ok:true,spent:amount};
  }

  function receiveDamage(amount) {
    const damage = Math.max(0,Math.floor(Number(amount)||0));
    const dealt = Math.min(state.hp,damage);
    state.hp -= dealt;
    return {dealt,hp:state.hp,knockedOut:state.hp<=0};
  }

  function restoreHp(amount) {
    const {maxHp} = limits();
    const restored = Math.min(Math.max(0,Math.floor(Number(amount)||0)),maxHp-state.hp);
    state.hp += restored;
    return {restored,hp:state.hp};
  }

  function addExperience(amount) {
    const gained=Math.max(0,Math.floor(Number(amount)||0));
    state.experience+=gained;
    let levelsGained=0;
    while(state.experience>=state.nextLevelExperience){
      state.experience-=state.nextLevelExperience;
      state.level+=1;
      state.nextLevelExperience=Math.round(state.nextLevelExperience*1.18);
      state.statPoints+=3;
      levelsGained+=1;
    }
    return {gained,levelsGained,level:state.level,experience:state.experience,nextLevelExperience:state.nextLevelExperience};
  }

  function addCurrency(amount) {
    const gained=Math.max(0,Math.floor(Number(amount)||0));
    state.currency+=gained;
    return {gained,currency:state.currency};
  }

  function addItem(itemId,quantity=1) {
    const amount=Math.max(1,Math.floor(Number(quantity)||1));
    const template=INITIAL_ITEMS.find(item=>item.id===itemId);
    if(!template)return {ok:false,message:'Vật phẩm thưởng chưa có trong danh mục.'};
    const existing=findItem(itemId);
    if(existing){existing.quantity+=amount;return {ok:true,itemId,quantity:existing.quantity};}
    if(state.inventory.length>=state.inventoryCapacity)return {ok:false,message:'Hành trang đầy, không thể nhận vật phẩm.'};
    state.inventory.push({...clone(template),quantity:amount});
    return {ok:true,itemId,quantity:amount};
  }

  return {
    snapshot,
    equip,
    unequip,
    useItem,
    allocateStat,
    setIdentity,
    spendMp,
    receiveDamage,
    restoreHp,
    addExperience,
    addCurrency,
    addItem,
    get statLabels(){return {...STAT_LABELS};}
  };
}
