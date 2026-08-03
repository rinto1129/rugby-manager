// P7d-F レビュー修正: ブロンコ統合の同日重複ガードが測定会紐付けを壊さないこと
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_p7d_bronco.js
// 核心: 同日に「ウエイトのみ」の記録があってもブロンコは別レコードで新規保存され、
//       ブロンコ測定会のmsessIdが正しく付く（修正画面へ誘導するとmsessIdがフィジカル回のまま固定され未実施扱いになる）
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
myPid=1;
var TODAY=todayStr();
var _dom={};
document.getElementById=function(id){return _dom[id]||null;};
document.querySelectorAll=function(){return[];};
function setEl(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function btn(){return{dataset:{},style:{},innerHTML:'',textContent:''};}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
go=function(){};toast=function(){};pbFlash=function(){};showSub=function(){};
var _editOpened=0;showEditPhysRec=function(){_editOpened++;};
// フィジカル回(77)とブロンコ回(88)が同時開催
function sessions(){return[
  {id:77,name:'フィジカル測定会',mtype:'phys',startDate:TODAY,endDate:TODAY},
  {id:88,name:'ブロンコ測定会',mtype:'bronco',startDate:TODAY,endDate:TODAY}
];}
function reset(){__alerts.length=0;_editOpened=0;_dom={};setKey('ph',[]);setKey('msess',sessions());setKey('p',[{id:1,name:'A選手'}]);setKey('phskip',[]);}
function broncoInputs(m,s){setEl('pf-date',TODAY);setEl('pf-br-m',String(m));setEl('pf-br-s',String(s));}

print('--- 1) 同日にウエイトのみの記録あり → ブロンコは別レコードで新規保存（重複誘導しない） ---');
reset();
setKey('ph',[{id:1,pid:1,date:TODAY,squat:150,bench:null,deadlift:null,bronco:null,msessId:77}]);
broncoInputs(5,0);
doPhys(btn(),'bronco');drain();
ok('修正画面へ誘導しない', _editOpened===0);
ok('ph が2件（別レコード）', store('ph').length===2);
var br=store('ph').filter(function(r){return r.bronco!=null;})[0];
ok('ブロンコ値が保存される(300秒)', br && br.bronco===300);
ok('msessId=88（ブロンコ回に正しく紐付く）', br && br.msessId===88);
ok('元のウエイト記録は無傷(msessId=77)', store('ph').some(function(r){return r.squat===150&&r.msessId===77;}));

print('--- 2) 同日に既にブロンコ値がある → 真の重複として修正画面へ誘導（新規作成しない） ---');
reset();
setKey('ph',[{id:1,pid:1,date:TODAY,squat:null,bench:null,deadlift:null,bronco:300,msessId:88}]);
broncoInputs(4,50);
doPhys(btn(),'bronco');drain();
ok('修正画面へ誘導', _editOpened===1);
ok('新規レコードは作られない', store('ph').length===1);

print('--- 3) 通常モード(全種目)の同日重複ガードは従来どおり ---');
reset();
setKey('ph',[{id:1,pid:1,date:TODAY,squat:150,bronco:null,msessId:77}]);
setEl('pf-date',TODAY);setEl('pf-sq','160');setEl('pf-bp','');setEl('pf-dl','');setEl('pf-cn','');setEl('pf-cl','');setEl('pf-br-m','');setEl('pf-br-s','');
doPhys(btn());drain();
ok('修正画面へ誘導（従来動作）', _editOpened===1);
ok('新規レコードは作られない', store('ph').length===1);

print('--- 4) 同日記録なし → ブロンコは通常どおり新規保存・msessId=88 ---');
reset();
broncoInputs(5,30);
doPhys(btn(),'bronco');drain();
ok('1件保存', store('ph').length===1);
ok('bronco=330秒', store('ph')[0] && store('ph')[0].bronco===330);
ok('msessId=88', store('ph')[0] && store('ph')[0].msessId===88);
ok('ウエイト欄はnull(DOM不在でもクラッシュしない)', store('ph')[0] && store('ph')[0].squat===null);

print(__fail===0?'ALL P7D-BRONCO TESTS PASSED':(__fail+' TESTS FAILED'));
