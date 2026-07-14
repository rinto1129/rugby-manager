// P7a: 体重dedup と sRPE/durMin(effDur/sLoad/syncSessionDurToF) の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_p7a.js
// 核心=(A)getCurrentWeightInfoが同日f/bcを二重計上しない (B)effDurの優先順位 durMin>duration>tlog (C)sLoad=rpe*effDur
//      (E)syncSessionDurToF(当日fにdurMin追記・未提出はスキップ) (F)doCondition=体重はfのみ・bc(体組成)は汚さない
// ※cond-bc materializeは不採用（コンディション体重はgetCurrentWeightInfoのf読みで平均に反映＝bcを汚さない）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

myPid=1;
var T=todayStr();
var _dom={};
document.getElementById=function(id){return _dom[id]||{value:'',style:{},textContent:''};};
function setInput(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function btn(){return{dataset:{},style:{},innerHTML:'',disabled:false};}
go=function(){};
var _toasts=[];toast=function(m){_toasts.push(m);};
function storeArr(k){return JSON.parse(__store[k]||'[]');}
function setStore(k,arr){__store[k]=JSON.stringify(arr||[]);}

// ============ A) getCurrentWeightInfo 体重dedup ============
print('--- A) getCurrentWeightInfo 同日f/bcの二重計上なし ---');
D.f=[{pid:1,date:T,weight:85}];
D.bc=[{pid:1,date:T,weight:85,source:'cond'}]; // 同日にcond-bc（同値）
var wA=getCurrentWeightInfo(1);
ok('同日f+bcは1回のみ計上（2回にならない）', wA&&/・1回/.test(wA.src));
ok('平均は85（二重でも歪まない）', wA&&wA.w===85);

D.f=[{pid:1,date:T,weight:80}];
D.bc=[{pid:1,date:T,weight:85}]; // 同日・実測bc・別値
var wA2=getCurrentWeightInfo(1);
ok('同日はbc優先（f80よりbc85）', wA2&&wA2.w===85&&/・1回/.test(wA2.src));

var d2=toDateStr(new Date(Date.now()-2*86400000));
D.f=[{pid:1,date:T,weight:80}];
D.bc=[{pid:1,date:d2,weight:90}]; // 別日
var wA3=getCurrentWeightInfo(1);
ok('別日は各1回で平均((80+90)/2=85)', wA3&&wA3.w===85&&/・2回/.test(wA3.src));

D.f=[];D.bc=[];
ok('記録皆無ならnull（登録体重も無いpid）', getCurrentWeightInfo(999)===null);

// getWeightInfoAt も同様にdedup
D.f=[{pid:1,date:T,weight:88}];
D.bc=[{pid:1,date:T,weight:88,source:'cond'}];
var wB=getWeightInfoAt(1,T);
ok('getWeightInfoAtも同日dedup（1回）', wB&&/・1回/.test(wB.src)&&wB.w===88);

// ============ B) effDur 優先順位（duration手動>durMin実測>tlog>0） ============
print('--- B) effDur: duration>durMin>tlog>0 ---');
D.tlog=[];
ok('手動duration最優先（duration60,durMin75→60）', effDur({pid:1,date:T,durMin:75,duration:60})===60);
ok('duration無→実測durMinで補完（75）', effDur({pid:1,date:T,durMin:75})===75);
ok('duration=0(空)→durMinで補完（朝入力の空欄ケース）', effDur({pid:1,date:T,duration:0,durMin:75})===75);
D.tlog=[{pid:1,date:T,durMin:50}];
ok('duration/durMin無→当日tlogのdurMin(50)', effDur({pid:1,date:T,rpe:5})===50);
D.tlog=[{pid:1,date:T,durMin:40},{pid:1,date:T,durMin:55}];
ok('当日tlog複数→最大(55)', effDur({pid:1,date:T})===55);
D.tlog=[{pid:2,date:T,durMin:99}];
ok('別選手のtlogは拾わない→0', effDur({pid:1,date:T})===0);
D.tlog=[{pid:1,date:d2,durMin:99}];
ok('別日のtlogは拾わない→0', effDur({pid:1,date:T})===0);
ok('duration>0なら壁時計durMin過大でも手動を勝たせる（duration45,durMin300→45）', effDur({pid:1,date:T,duration:45,durMin:300})===45);
ok('durMin=0はdurationにフォールバック（0短絡しない）', effDur({pid:1,date:T,durMin:0,duration:70})===70);
ok('null安全', effDur(null)===0);

// ============ C) sLoad = rpe*effDur ============
print('--- C) sLoad ---');
D.tlog=[];
ok('rpe6×durMin75=450', sLoad({pid:1,date:T,rpe:6,durMin:75})===450);
ok('rpe欠測は0扱い', sLoad({pid:1,date:T,durMin:75})===0);
ok('null安全', sLoad(null)===0);

// ============ E) syncSessionDurToF（D.fの当日候補ガード＋当日fにdurMin追記） ============
print('--- E) syncSessionDurToF ---');
function seedF(arr){D.f=arr.map(function(r){return r;});setStore('f',arr);}
// E-1 当日f有 → durMin追記
seedF([{id:'f1',pid:1,date:T,rpe:6,sleep:7,duration:0,inputAt:'2026-07-14T07:00:00Z'}]);
syncSessionDurToF({pid:1,date:T,durMin:80});drain();
var e1=storeArr('f');
ok('当日fにdurMin=80追記', e1[0]&&e1[0].durMin===80);
ok('editedAt付与', e1[0]&&!!e1[0].editedAt);

// E-2 当日f未提出 → ガードで書かない（f全体docの無駄な再書込みも避ける）
seedF([{id:'f2',pid:1,date:d2,rpe:5,inputAt:'x'}]);
var e2before=__store['f'];
syncSessionDurToF({pid:1,date:T,durMin:80});drain();
var e2=storeArr('f');
ok('当日f無→別日fにdurMin付かない', e2.length===1&&e2[0].durMin===undefined);
ok('当日f無→Firestoreへ書き込まない（redundant write回避）', __store['f']===e2before);

// E-2b 他選手のみ当日f有 → 自分のガードは通らない（書かない）
seedF([{id:'o1',pid:2,date:T,rpe:5,inputAt:'x'}]);
syncSessionDurToF({pid:1,date:T,durMin:80});drain();
ok('他選手の当日fでは自分の書込みは起きない', storeArr('f')[0].durMin===undefined);

// E-3 durMin無/0 → 無操作
seedF([{id:'f1',pid:1,date:T,rpe:6,inputAt:'x'}]);
syncSessionDurToF({pid:1,date:T,durMin:0});drain();
ok('durMin0は無操作', storeArr('f')[0].durMin===undefined);
syncSessionDurToF(null);drain();
ok('null logは無操作', storeArr('f').length===1);

// E-4 同日複数f → inputAt最新へ
seedF([
  {id:'fa',pid:1,date:T,rpe:5,inputAt:'2026-07-14T07:00:00Z'},
  {id:'fb',pid:1,date:T,rpe:7,inputAt:'2026-07-14T20:00:00Z'}
]);
syncSessionDurToF({pid:1,date:T,durMin:65});drain();
var e4=storeArr('f');
ok('最新inputAt(fb)にdurMin付与', e4.find(function(r){return r.id==='fb';}).durMin===65);
ok('古いfaには付かない', e4.find(function(r){return r.id==='fa';}).durMin===undefined);

// ============ F) doCondition: 体重はfに保存・bc(体組成)は汚さない（cond-bc不採用の回帰ガード） ============
print('--- F) doCondition: 体重はf保存・bcは生成しない ---');
D.f=[];setStore('f',[]);setStore('bc',[]);
_toasts=[];__alerts.length=0;
setInput('cf-rpe','6');setInput('cf-date',T);setInput('cf-sleep','7');setInput('cf-dur','');
setInput('cf-note','');setInput('cf-weight','88.5');
doCondition(btn());drain();
var fF=storeArr('f'),bF=storeArr('bc');
ok('fが1件保存された', fF.length===1&&fF[0].rpe===6);
ok('f.weight=88.5も保存', fF[0]&&fF[0].weight===88.5);
ok('bc(体組成)は生成されない＝コンディション体重で体組成を汚さない', bF.length===0);
ok('記録トースト', _toasts.some(function(t){return /記録/.test(t);}));
// 体重はgetCurrentWeightInfo経由で体重平均に反映される（fを読むため・bc materialize不要）
D.f=fF;D.bc=[];
ok('コンディション体重は体重平均に反映される(88.5)', getCurrentWeightInfo(1).w===88.5);

print(__fail===0?'\nALL P7a TESTS PASSED':('\n'+__fail+' FAILED'));
if(__fail>0)throw new Error('p7a tests failed');
