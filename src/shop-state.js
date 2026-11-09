const SHOP_CATALOG = [
  {id:'small-potion',name:'Bình máu nhỏ',description:'Hồi phục sinh lực khi sử dụng.',price:150,icon:'🧪'},
  {id:'small-mana',name:'Bình mana nhỏ',description:'Hồi phục nội lực khi sử dụng.',price:150,icon:'🧴'},
  {id:'upgrade-stone',name:'Đá cường hóa',description:'Nguyên liệu dùng cho hệ thống nâng cấp.',price:450,icon:'◆'}
];

export function createShopState(characterState) {
  function snapshot() {
    return {items:SHOP_CATALOG.map(item=>({...item})),currency:characterState.snapshot().currency};
  }
  function buy(itemId,quantity=1) {
    const item=SHOP_CATALOG.find(entry=>entry.id===itemId);
    const amount=Math.max(1,Math.min(99,Math.floor(Number(quantity)||1)));
    if(!item)return {ok:false,message:'Vật phẩm không có trong cửa hàng.'};
    const character=characterState.snapshot();
    const alreadyOwned=character.inventory.some(entry=>entry.id===itemId);
    if(!alreadyOwned&&character.inventory.length>=character.inventoryCapacity)return {ok:false,message:'Hành trang đã đầy.'};
    const total=item.price*amount;
    const payment=characterState.spendCurrency(total);
    if(!payment.ok)return {ok:false,message:'Không đủ Xu để mua '+item.name+'.'};
    const received=characterState.addItem(itemId,amount);
    if(!received.ok){
      characterState.addCurrency(total);
      return {ok:false,message:received.message};
    }
    return {ok:true,message:'Đã mua '+amount+' × '+item.name+'.',total,currency:characterState.snapshot().currency};
  }
  return {snapshot,buy};
}
