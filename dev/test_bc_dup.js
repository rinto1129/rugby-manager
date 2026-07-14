// P5: 体組成(bc)の同日重複チェック（source:'cond'除外＋昇格上書き分岐）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_bc_dup.js
// 核心=(a)同日実測ありは追記をブロックしshowEditBCへ誘導 (b)同日cond由来は実測で上書き昇格(source除去) (c)cond除外
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

myPid=1;
var TODAY=todayStr();
// DOM入力スタブ（prelude既定は毎回空要素を返すため値制御用に差し替え）
var _dom={};
document.getElementById=function(id){return _dom[id]||{value:'',style:{},textContent:''};};
function setInput(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function btn(){return{dataset:{},style:{},innerHTML:''};}
// 保存後の遷移/通知/編集導線を捕捉
go=function(){};
var _toasts=[];toast=function(m){_toasts.push(m);};
var _editBC=null;showEditBC=function(id){_editBC=id;};

function reset(bc){
  D.bc=bc||[];__store['bc']=JSON.stringify(D.bc);
  _toasts=[];_editBC=null;__alerts.length=0;
}
function storeBC(){return JSON.parse(__store['bc']||'[]');}

print('--- 1) 同日レコードなし → 通常追記 ---');
reset([]);
setInput('bc-date',TODAY);setInput('bc-w','85');setInput('bc-fat','15');setInput('bc-muscle','42');
doBCInput(btn());drain();
var b1=storeBC();
ok('1件追記された', b1.length===1);
ok('weight=85', b1[0]&&b1[0].weight===85);
ok('fat=15/muscle=42', b1[0]&&b1[0].fat===15&&b1[0].muscle===42);
ok('sourceは付かない', b1[0]&&b1[0].source===undefined);
ok('記録トースト', _toasts.some(function(t){return /記録/.test(t);}));

print('--- 2) 同日cond由来 → 実測で昇格上書き（1件のまま・source除去） ---');
reset([{id:'c1',pid:1,date:TODAY,weight:80,fat:null,muscle:null,source:'cond'}]);
setInput('bc-date',TODAY);setInput('bc-w','90');setInput('bc-fat','16');setInput('bc-muscle','43');
doBCInput(btn());drain();
var b2=storeBC();
ok('件数は1のまま（追記されない）', b2.length===1);
ok('同一id c1を上書き', b2[0]&&idEq(b2[0].id,'c1'));
ok('weight=90に更新', b2[0]&&b2[0].weight===90);
ok('fat/muscleも更新', b2[0]&&b2[0].fat===16&&b2[0].muscle===43);
ok('sourceセンチネル除去（実測へ格上げ）', b2[0]&&b2[0].source===undefined);
ok('editedAt付与', b2[0]&&!!b2[0].editedAt);
ok('重複alertは出ない', !__alerts.some(function(a){return /記録済/.test(a);}));

print('--- 3) 同日に実測（source無し）あり → ブロック＋編集導線 ---');
reset([{id:'r1',pid:1,date:TODAY,weight:85}]);
setInput('bc-date',TODAY);setInput('bc-w','88');
doBCInput(btn());drain();
var b3=storeBC();
ok('新規追記されない（1件のまま）', b3.length===1);
ok('既存値は不変(weight=85)', b3[0]&&b3[0].weight===85);
ok('重複alert', __alerts.some(function(a){return /記録済/.test(a);}));
ok('showEditBC(r1)へ誘導', idEq(_editBC,'r1'));

print('--- 4) 同日cond＋実測 両方 → 実測優先でブロック（昇格しない） ---');
reset([{id:'c1',pid:1,date:TODAY,weight:80,source:'cond'},{id:'r1',pid:1,date:TODAY,weight:85}]);
setInput('bc-date',TODAY);setInput('bc-w','92');
doBCInput(btn());drain();
var b4=storeBC();
ok('件数不変(2件)', b4.length===2);
ok('condは昇格されない(weight=80のまま)', b4.find(function(r){return idEq(r.id,'c1');}).weight===80);
ok('重複alert', __alerts.some(function(a){return /記録済/.test(a);}));

print('--- 5) condが別日 → 同日扱いされず通常追記 ---');
reset([{id:'c1',pid:1,date:'2020-01-01',weight:80,source:'cond'}]);
setInput('bc-date',TODAY);setInput('bc-w','91');
doBCInput(btn());drain();
var b5=storeBC();
ok('2件になる（別日condは無関係）', b5.length===2);
ok('別日condは不変', b5.find(function(r){return idEq(r.id,'c1');}).weight===80);

print('--- 6) 他選手の同日実測 → 自分はブロックされない ---');
reset([{id:'o1',pid:2,date:TODAY,weight:70}]);
setInput('bc-date',TODAY);setInput('bc-w','93');
doBCInput(btn());drain();
var b6=storeBC();
ok('自分の記録が追記される(2件)', b6.length===2);
ok('自分のweight=93が入る', b6.some(function(r){return idEq(r.pid,1)&&r.weight===93;}));

print('--- 7) 過去日入力: その過去日に実測あり → ブロック（recDate基準／todayStrズレなし） ---');
reset([{id:'p1',pid:1,date:'2026-07-10',weight:84}]);
setInput('bc-date','2026-07-10');setInput('bc-w','86');
doBCInput(btn());drain();
var b7=storeBC();
ok('過去日でも重複ブロック(1件のまま)', b7.length===1);
ok('showEditBC(p1)へ誘導', idEq(_editBC,'p1'));

print(__fail===0?'\nALL BC-DUP TESTS PASSED':('\n'+__fail+' FAILED'));
if(__fail>0)throw new Error('bc-dup tests failed');
