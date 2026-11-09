const SKILL_CATALOG = [
  {id:'basic',name:'Đánh thường',type:'active',icon:'⚔',description:'Đòn đánh cơ bản, không tiêu hao nội lực.',maxLevel:1,mpCost:0,cooldown:0,power:1,initialLevel:1,slot:1},
  {id:'sword-wave',name:'Kiếm khí',type:'active',icon:'✧',description:'Phóng kiếm khí gây sát thương lên mục tiêu.',maxLevel:5,mpCost:25,cooldown:1,power:1.65,initialLevel:1,slot:2},
  {id:'heal',name:'Hồi phục',type:'active',icon:'✚',description:'Hồi phục sinh lực cho bản thân.',maxLevel:5,mpCost:35,cooldown:3,power:0,heal:220,initialLevel:1,slot:3},
  {id:'combo-slash',name:'Liên hoàn trảm',type:'active',icon:'⚔',description:'Chuỗi đòn chém liên tiếp, gây sát thương lớn.',maxLevel:5,mpCost:48,cooldown:3,power:2.45,initialLevel:0,requiredPoints:2,slot:4},
  {id:'blade-storm',name:'Bạt kiếm thức',type:'active',icon:'✹',description:'Tuyệt kỹ tập trung sức mạnh vào một đòn đánh.',maxLevel:5,mpCost:85,cooldown:5,power:4.1,initialLevel:0,requiredPoints:3,slot:null},
  {id:'sword-heart',name:'Kiếm tâm',type:'passive',icon:'◈',description:'Tăng nhẹ sức mạnh các đòn tấn công.',maxLevel:5,mpCost:0,cooldown:0,power:0,initialLevel:0,requiredPoints:1,slot:null}
];

const clone = value => JSON.parse(JSON.stringify(value));

export function createSkillCombatState() {
  const skills = Object.fromEntries(SKILL_CATALOG.map(skill => [skill.id,{...skill,level:skill.initialLevel}]));
  const state = {
    skillPoints: 6,
    loadout: ['basic','sword-wave','heal',null],
    cooldowns: {},
    target: {id:'training-wolf',name:'Sói luyện tập',level:18,maxHp:1800,hp:1800,defense:8},
    turn: 0,
    log: ['Đã vào khu luyện tập. Chọn kỹ năng để bắt đầu chiến đấu.'],
    battleActive: true
  };

  function passiveDamageBonus() {
    return 1 + (skills['sword-heart'].level * 0.04);
  }

  function snapshot() {
    return {
      skills: clone(Object.values(skills)),
      skillPoints: state.skillPoints,
      loadout: [...state.loadout],
      cooldowns: {...state.cooldowns},
      target: clone(state.target),
      turn: state.turn,
      log: [...state.log],
      battleActive: state.battleActive
    };
  }

  function addLog(message) {
    state.log.unshift(message);
    state.log = state.log.slice(0,8);
  }

  function learnOrUpgrade(skillId) {
    const skill = skills[skillId];
    if (!skill || skill.level >= skill.maxLevel) return {ok:false,message:'Kỹ năng đã đạt cấp tối đa.'};
    const cost = skill.level === 0 ? (skill.requiredPoints || 1) : 1;
    if (state.skillPoints < cost) return {ok:false,message:'Không đủ điểm kỹ năng.'};
    state.skillPoints -= cost;
    skill.level += 1;
    addLog(skill.name + ' tăng lên cấp ' + skill.level + '.');
    return {ok:true,message:skill.name + ' · cấp ' + skill.level};
  }

  function assignSkill(skillId, slot) {
    if (!Number.isInteger(slot) || slot < 1 || slot > 4) return {ok:false,message:'Ô kỹ năng không hợp lệ.'};
    const skill = skills[skillId];
    if (!skill || skill.type !== 'active' || skill.level <= 0) return {ok:false,message:'Cần học kỹ năng trước khi gán.'};
    if (state.loadout.includes(skillId)) {
      const previous = state.loadout.indexOf(skillId);
      state.loadout[previous] = state.loadout[slot-1];
    }
    state.loadout[slot-1] = skillId;
    return {ok:true,message:skill.name + ' đã gán vào ô ' + slot + '.'};
  }

  function unassignSkill(skillId) {
    const slot = state.loadout.indexOf(skillId);
    if (slot < 0) return {ok:false,message:'Kỹ năng chưa được gán vào thanh thao tác.'};
    state.loadout[slot] = null;
    return {ok:true,message:skills[skillId].name + ' đã được gỡ khỏi thanh thao tác.'};
  }

  function startBattle() {
    state.target.hp = state.target.maxHp;
    state.cooldowns = {};
    state.turn = 0;
    state.battleActive = true;
    state.log = ['Sói luyện tập xuất hiện. Trận chiến bắt đầu!'];
    return snapshot();
  }

  function useSlot(slot, character) {
    if (!Number.isInteger(slot) || slot < 1 || slot > 5) return {ok:false,message:'Ô thao tác không hợp lệ.'};
    if (character.hp <= 0) return {ok:false,message:'Nhân vật đã gục. Dùng bình HP rồi tiếp tục.'};
    if (!state.battleActive || state.target.hp <= 0) return {ok:false,message:'Hãy bắt đầu trận luyện tập mới.'};
    if (slot === 5) return {ok:false,message:'Dùng bình HP trong hành trang để hồi phục.'};
    const skillId = state.loadout[slot-1];
    const skill = skills[skillId];
    if (!skill || skill.level <= 0) return {ok:false,message:'Ô kỹ năng chưa được gán.'};
    if ((state.cooldowns[skillId] || 0) > 0) return {ok:false,message:'Kỹ năng còn ' + state.cooldowns[skillId] + ' lượt hồi chiêu.'};
    if (character.mp < skill.mpCost) return {ok:false,message:'Không đủ nội lực để sử dụng ' + skill.name + '.'};

    const levelScale = 1 + (skill.level-1)*0.22;
    const rawDamage = skill.power > 0
      ? Math.max(1,Math.round((character.stats.strength*2 + character.stats.agility)*skill.power*levelScale*passiveDamageBonus() - state.target.defense))
      : 0;
    const healing = skill.heal ? Math.round(skill.heal*levelScale) : 0;
    state.target.hp = Math.max(0,state.target.hp-rawDamage);
    state.turn += 1;
    for (const key of Object.keys(state.cooldowns)) state.cooldowns[key] = Math.max(0,state.cooldowns[key]-1);
    if (skill.cooldown > 0) state.cooldowns[skillId] = skill.cooldown;
    const defeated = state.target.hp <= 0;
    const enemyDamage = defeated ? 0 : (state.target.damage || 12 + Math.floor(state.turn*1.5));
    addLog(skill.name + (rawDamage ? ' gây ' + rawDamage.toLocaleString('vi-VN') + ' sát thương.' : ' được sử dụng.') + (healing ? ' Hồi ' + healing + ' HP.' : ''));

    if (defeated) {
      state.battleActive = false;
      addLog('Đã đánh bại Sói luyện tập!');
    } else {
      addLog('Sói luyện tập phản công, gây ' + enemyDamage + ' sát thương.');
    }
    return {
      ok:true,skillId,skillName:skill.name,mpCost:skill.mpCost,damage:rawDamage,
      healing,enemyDamage,defeated,targetHp:state.target.hp,targetMaxHp:state.target.maxHp,
      message:skill.name + (rawDamage ? ' · ' + rawDamage + ' sát thương' : '') + (healing ? ' · hồi ' + healing + ' HP' : '')
    };
  }

  function setTarget(target) {
    if (!target || !Number.isFinite(target.maxHp) || target.maxHp <= 0) return {ok:false,message:'Mục tiêu không hợp lệ.'};
    state.target = {
      id:String(target.id||'world-target'),
      name:String(target.name||'Mục tiêu'),
      level:Math.max(1,Math.floor(Number(target.level)||1)),
      maxHp:Math.floor(target.maxHp),
      hp:Math.max(0,Math.min(Math.floor(target.maxHp),Math.floor(Number(target.hp)||target.maxHp))),
      defense:Math.max(0,Math.floor(Number(target.defense)||0)),
      damage:Math.max(0,Math.floor(Number(target.damage)||0))
    };
    state.cooldowns = {};
    state.turn = 0;
    state.battleActive = state.target.hp > 0;
    state.log = [state.target.name+' đã được chọn làm mục tiêu.'];
    return {ok:true,target:clone(state.target)};
  }

  function syncTarget(target) {
    if (!target || !Number.isFinite(target.maxHp) || target.maxHp <= 0) return {ok:false,message:'Mục tiêu không hợp lệ.'};
    state.target = {
      ...state.target,
      id:String(target.id||state.target.id),
      name:String(target.name||state.target.name),
      level:Math.max(1,Math.floor(Number(target.level)||1)),
      maxHp:Math.floor(target.maxHp),
      hp:Math.max(0,Math.min(Math.floor(target.maxHp),Math.floor(Number(target.hp)||0))),
      defense:Math.max(0,Math.floor(Number(target.defense)||0)),
      damage:Math.max(0,Math.floor(Number(target.damage)||0))
    };
    state.battleActive = state.target.hp > 0;
    return {ok:true,target:clone(state.target)};
  }

  function resetTarget() {
    return startBattle();
  }

  return {snapshot,learnOrUpgrade,assignSkill,unassignSkill,useSlot,startBattle,setTarget,syncTarget,resetTarget};
}
