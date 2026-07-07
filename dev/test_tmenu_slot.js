// Phase 2: tmenu.ptype拡張+PUSH/PULLスロット（staff）のテスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tmenu_slot.js
// 仕様: saveTMenuはsvSafeUpdate統一・同ptypeスロットはアクティブ1件（同一トランザクションで他からptype除去）
//       読み取りはgetSlotMenu（異常時複数はptypeTs最新→id大タイブレーク=Medium-4）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

// DOMモック: idごとに要素を保持（フォーム値の受け渡しに必要）
var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
// pushView/popView/toastは画面遷移なのでスタブ（本テストの対象はデータ整合）
pushView=function(){};popView=function(){};toast=function(){};

function tmenuNow(){return JSON.parse(__store['tmenu']||'[]');}
function setTmenu(arr){D.tmenu=JSON.parse(JSON.stringify(arr));__store['tmenu']=JSON.stringify(arr);}
function setForm(name,scope,ptype){
  __els['tm-name']=mkEl();__els['tm-name'].value=name;
  __els['tm-scope']=mkEl();__els['tm-scope'].value=scope;
  __els['tm-ptype']=mkEl();__els['tm-ptype'].value=ptype;
}

D.p=[{id:1,name:'選手A',position:'PR',year:2}];
__store['texlist']=JSON.stringify([]);D.texlist=[];

print('--- getSlotMenu: タイブレーク（Medium-4） ---');
setTmenu([]);
ok('スロット無し → null',getSlotMenu('push')===null);
setTmenu([
  {id:1,name:'旧push',scope:'all',ptype:'push',ptypeTs:'2026-07-01T00:00:00.000Z',exercises:[{name:'BP'}]},
  {id:2,name:'新push',scope:'all',ptype:'push',ptypeTs:'2026-07-06T00:00:00.000Z',exercises:[{name:'BP'}]},
  {id:3,name:'pull',scope:'all',ptype:'pull',ptypeTs:'2026-07-02T00:00:00.000Z',exercises:[{name:'DL'}]}
]);
ok('異常時複数 → ptypeTs最新を採用',getSlotMenu('push').name==='新push');
ok('pullスロットは独立',getSlotMenu('pull').name==='pull');
setTmenu([
  {id:10,name:'ts無しA',scope:'all',ptype:'push',exercises:[]},
  {id:20,name:'ts無しB',scope:'all',ptype:'push',exercises:[]}
]);
ok('ptypeTs無し同士 → id大を採用',getSlotMenu('push').name==='ts無しB');

print('--- saveTMenu: 新規作成（svSafeUpdate統一） ---');
setTmenu([]);
_tmenuEx=[{name:'ベンチプレス',estBase:'bench',sets:'3',reps:'5',rir:'2'}];
setForm('7月PUSH','all','push');
saveTMenu(null);drain();
var t1=tmenuNow();
ok('新規: 1件作成',t1.length===1);
ok('新規: ptype=push',t1[0].ptype==='push');
ok('新規: ptypeTsが付与される',typeof t1[0].ptypeTs==='string'&&t1[0].ptypeTs.length>0);
ok('新規: 種目整形は従来どおり',t1[0].exercises.length===1&&t1[0].exercises[0].name==='ベンチプレス'&&t1[0].exercises[0].sets===3);
ok('新規: createdAt/createdBy維持',t1[0].createdAt===todayStr()&&t1[0].createdBy==='スタッフ');
ok('texlistへ種目名マージ',JSON.parse(__store['texlist']).indexOf('ベンチプレス')>=0);

print('--- saveTMenu: 同ptypeスロットの単一不変条件 ---');
_tmenuEx=[{name:'インクラインベンチ',estBase:'bench',sets:'3',reps:'8',rir:'2'}];
setForm('8月PUSH','all','push');
saveTMenu(null);drain();
var t2=tmenuNow();
ok('2件目のpushスロット作成 → 計2件',t2.length===2);
var old=t2.find(function(x){return x.name==='7月PUSH';});
var neu=t2.find(function(x){return x.name==='8月PUSH';});
ok('旧pushスロットからptypeが外れる（通常メニュー化）',old&&old.ptype===undefined&&old.ptypeTs===undefined);
ok('新pushスロットがアクティブ',neu&&neu.ptype==='push');
ok('getSlotMenuが新スロットを返す',getSlotMenu('push').name==='8月PUSH');
ok('旧メニュー自体は消えない（中身温存）',old&&old.exercises.length===1);

print('--- saveTMenu: 編集でptypeを外す/付ける ---');
setForm('8月PUSH改','all','');
_tmenuEx=[{name:'インクラインベンチ',estBase:'bench',sets:'3',reps:'8',rir:'2'}];
saveTMenu(String(neu.id));drain();
var t3=tmenuNow();
var edited=t3.find(function(x){return idEq(x.id,neu.id);});
ok('編集: 名前更新',edited&&edited.name==='8月PUSH改');
ok('編集: ptype外し → ptype/ptypeTs削除',edited&&edited.ptype===undefined&&edited.ptypeTs===undefined);
ok('pushスロットは空に',getSlotMenu('push')===null);
setForm('8月PUSH改','all','pull');
saveTMenu(String(neu.id));drain();
var t4=tmenuNow();
var edited2=t4.find(function(x){return idEq(x.id,neu.id);});
ok('編集: pullスロットへ変更',edited2&&edited2.ptype==='pull');
ok('getSlotMenu(pull)が編集後メニューを返す',getSlotMenu('pull')&&idEq(getSlotMenu('pull').id,neu.id));

print('--- saveTMenu: バリデーション ---');
__alerts.length=0;
var before=tmenuNow().length;
setForm('個別スロット','1','push');
_tmenuEx=[{name:'リハビリ',estBase:'',sets:'3',reps:'10',rir:''}];
saveTMenu(null);drain();
ok('ptype+個別scope → alertで拒否',__alerts.length===1&&__alerts[0].indexOf('全選手')>=0);
ok('拒否時は保存されない',tmenuNow().length===before);

print('--- V.training: スロットカード描画 ---');
setTmenu([
  {id:1,name:'現行PUSH',scope:'all',ptype:'push',ptypeTs:'2026-07-01T00:00:00.000Z',exercises:[{name:'BP'},{name:'OHP'}],createdAt:'2026-07-01'},
  {id:2,name:'個別メニュー',scope:1,exercises:[{name:'リハ'}],createdAt:'2026-07-02'}
]);
__els['tr-tab-sel']=mkEl();__els['tr-tab-sel'].value='menus';
V.training();
var html=__els['main-ct'].innerHTML;
ok('PUSHスロットカードにメニュー名',html.indexOf('現行PUSH')>=0);
ok('PUSHスロットに種目数表示',html.indexOf('2種目')>=0);
ok('PULLスロットは未設定表示',html.indexOf('未設定')>=0);
ok('未設定スロットに作成導線',html.indexOf("goAddTMenuSlot('pull')")>=0||html.indexOf('goAddTMenuSlot(\'pull\')')>=0);
ok('通常メニュー一覧に個別メニュー',html.indexOf('個別メニュー')>=0);
ok('スロットメニューは通常一覧に重複しない',html.split('現行PUSH').length===2); // 出現1回のみ
// 異常時: push2件 → 負けた方が通常一覧に出る（不可視にならない）
setTmenu([
  {id:1,name:'勝ちPUSH',scope:'all',ptype:'push',ptypeTs:'2026-07-06T00:00:00.000Z',exercises:[],createdAt:'2026-07-01'},
  {id:2,name:'負けPUSH',scope:'all',ptype:'push',ptypeTs:'2026-07-01T00:00:00.000Z',exercises:[],createdAt:'2026-07-02'}
]);
V.training();
var html2=__els['main-ct'].innerHTML;
ok('異常時: 勝った方がスロットカード',html2.indexOf('勝ちPUSH')>=0);
ok('異常時: 負けた方も通常一覧に可視',html2.indexOf('負けPUSH')>=0);

print('--- goTMenuDetail: スロットバッジ ---');
var pushedHtml='';
pushView=function(title,h){pushedHtml=h;};
setTmenu([{id:1,name:'現行PUSH',scope:'all',ptype:'push',ptypeTs:'2026-07-01T00:00:00.000Z',exercises:[{name:'BP'}],createdAt:'2026-07-01'}]);
goTMenuDetail('1');
ok('詳細にPUSHスロットバッジ',pushedHtml.indexOf('PUSHスロット')>=0);

if(__fail===0)print('ALL TMENU-SLOT TESTS PASSED');else print(__fail+' TESTS FAILED');
