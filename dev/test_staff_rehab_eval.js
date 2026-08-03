// P7d-B: staffリハ記録画面の臨床評価折りたたみ — 1保存で rlog(追記) + chart.evals(upsert) を逐次チェーン
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_staff_rehab_eval.js
// 核心: (1)痛み全0+メモ空なら eval を生成しない(汚染防止) (2)eval は stampWho(savedRole=staff)・bySelf無し
//       (3)rlog は常に保存 (4)実施者未入力は保存前にreturn
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
var TODAY=todayStr();
var _dom={},_sliders=[];
document.getElementById=function(id){return _dom[id]||null;};
document.querySelectorAll=function(sel){if(sel==='.srl-pain')return _sliders;return[];};
function setEl(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function setSliders(obj){_sliders=Object.keys(obj).map(function(k){return{value:String(obj[k]),dataset:{k:k}};});}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
var _next=0;goSetNextMenu=function(){_next++;};goSaveAsTemplate=function(){_next++;};
function reset(){__alerts.length=0;setKey('rlog',[]);setKey('chart',[{injId:10,evals:[]}]);setKey('i',[{id:10,pid:1,part:'膝'}]);setKey('p',[{id:1,name:'A選手'}]);_dom={};_sliders=[];_next=0;}

print('--- 1) リハ記録+痛み(スライダ>0) → rlog1件+eval1件(stampWho staff) ---');
reset();
setEl('srl-date',TODAY);setEl('srl-implementer','中山');setEl('srl-comment','順調');setEl('srl-eval-note','');
setSliders({rest:0,motion:4,night:0,press:0});
doSaveRehabLogStaff(10,false,0);drain();
ok('rlog1件', store('rlog').length===1);
ok('rlog実施者', store('rlog')[0] && store('rlog')[0].implementer==='中山');
var chEv=store('chart')[0].evals;
ok('eval1件', chEv.length===1);
ok('eval pain.motion=4', chEv[0] && chEv[0].pain.motion===4);
ok('eval stampWho savedRole=staff', chEv[0] && chEv[0].savedRole==='staff');
ok('eval bySelf無し(臨床評価)', chEv[0] && !chEv[0].bySelf);
ok('保存後に次画面へ遷移', _next===1);

print('--- 2) 痛み全0+メモ空 → rlogのみ・eval生成せず(汚染防止) ---');
reset();
setEl('srl-date',TODAY);setEl('srl-implementer','中山');setEl('srl-comment','');setEl('srl-eval-note','');
setSliders({rest:0,motion:0,night:0,press:0});
doSaveRehabLogStaff(10,false,0);drain();
ok('rlog1件', store('rlog').length===1);
ok('eval生成されない', store('chart')[0].evals.length===0);
ok('遷移は1回', _next===1);

print('--- 3) メモのみ(痛み全0) → eval生成(note非空でhasEval) ---');
reset();
setEl('srl-date',TODAY);setEl('srl-implementer','中山');setEl('srl-comment','');setEl('srl-eval-note','夜間の張り残存');
setSliders({rest:0,motion:0,night:0,press:0});
doSaveRehabLogStaff(10,false,0);drain();
ok('eval1件', store('chart')[0].evals.length===1);
ok('note保存', store('chart')[0].evals[0] && store('chart')[0].evals[0].note==='夜間の張り残存');
// [レビュー] スライダ未操作なら pain は空。0埋めすると「最新の痛み0/10（緑）」で前日までの痛みを塗り替える
ok('pain={}（0埋めしない）', store('chart')[0].evals[0] && Object.keys(store('chart')[0].evals[0].pain).length===0);

print('--- 3b) 痛みを動かした場合は pain に値が入る ---');
reset();
setEl('srl-date',TODAY);setEl('srl-implementer','中山');setEl('srl-comment','');setEl('srl-eval-note','');
setSliders({rest:0,motion:7,night:0,press:0});
doSaveRehabLogStaff(10,false,0);drain();
var ev3b=store('chart')[0].evals[0];
ok('pain.motion=7', ev3b && ev3b.pain.motion===7);
ok('pain全キーが入る', ev3b && Object.keys(ev3b.pain).length===4);

print('--- 4) 実施者未入力 → alertで保存しない(rlogもevalも無し) ---');
reset();
setEl('srl-date',TODAY);setEl('srl-implementer','');setEl('srl-comment','');setEl('srl-eval-note','');
setSliders({rest:0,motion:5,night:0,press:0});
doSaveRehabLogStaff(10,false,0);drain();
ok('rlog0件', store('rlog').length===0);
ok('eval0件', store('chart')[0].evals.length===0);
ok('実施者alert', __alerts.some(function(a){return /実施者/.test(a);}));

print(__fail===0?'ALL STAFF-REHAB-EVAL TESTS PASSED':(__fail+' TESTS FAILED'));
