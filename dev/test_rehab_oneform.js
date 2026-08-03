// P7d-C: 選手リハビリ1シート化 — doRehab が rlog(追記) と痛み自己記録(chart.evals bySelf) の2ストアへ振り分ける
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_rehab_oneform.js
// 核心: (1)痛み全0+メモ空なら eval を生成しない(0埋め汚染防止) (2)リハ空でも痛みだけ保存可・逆も可
//       (3)両方空はalertで保存しない (4)rlogは'rlog'キー/痛みはchart.evals bySelf へ正しく振り分け
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
myPid=1;
var TODAY=todayStr();
var _dom={},_sliders=[];
document.getElementById=function(id){return _dom[id]||null;};
document.querySelectorAll=function(sel){return sel==='.self-pain'?_sliders:[];};
function setInput(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function setSliders(obj){_sliders=Object.keys(obj).map(function(k){return{value:String(obj[k]),dataset:{k:k}};});}
function btn(){return{dataset:{},style:{},innerHTML:'',textContent:''};}
go=function(){};showMyChart=function(){};showSub=function(){};
var _toasts=[];toast=function(m){_toasts.push(m);};
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
function reset(){_toasts=[];__alerts.length=0;setKey('rlog',[]);setKey('chart',[]);setKey('r',[{id:20,injId:10,pid:1,stage:0}]);setKey('p',[{id:1,name:'テスト選手'}]);_dom={};_sliders=[];}

print('--- 1) リハ内容のみ → rlog1件・chart.evals0件 ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','スクワット3セット');setInput('self-note','');
doRehab(20,btn());drain();
ok('rlog 1件追記', store('rlog').length===1);
ok('rlog内容一致', store('rlog')[0] && store('rlog')[0].content==='スクワット3セット');
ok('rlog injId=10', store('rlog')[0] && idEq(store('rlog')[0].injId,10));
ok('痛みevalは生成されない(chart空)', store('chart').length===0);

print('--- 2) 痛みのみ(スライダ>0) → rlog0件・chart.evals bySelf1件 ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','');setInput('self-note','');
setSliders({rest:0,motion:5,night:0,press:0});
doRehab(20,btn());drain();
ok('rlogは生成されない', store('rlog').length===0);
ok('chart 1件', store('chart').length===1);
var ev1=store('chart')[0] && store('chart')[0].evals[0];
ok('eval bySelf', ev1 && ev1.bySelf===true);
ok('eval pain.motion=5', ev1 && ev1.pain.motion===5);
ok('eval date=当日(rl-date)', ev1 && ev1.date===TODAY);

print('--- 3) 両方 → rlog1件＋chart.evals1件 ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','リハ内容');setInput('self-note','');
setSliders({rest:0,motion:3,night:0,press:0});
doRehab(20,btn());drain();
ok('rlog1件', store('rlog').length===1);
ok('chart eval1件', store('chart').length===1 && store('chart')[0].evals.length===1);

print('--- 4) 両方空 → 保存しない・alert ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','');setInput('self-note','');
setSliders({rest:0,motion:0,night:0,press:0});
doRehab(20,btn());drain();
ok('rlog0件', store('rlog').length===0);
ok('chart0件', store('chart').length===0);
ok('alert表示(どちらか)', __alerts.some(function(a){return /どちらか/.test(a);}));

print('--- 5) スライダ全0+メモ空・リハ内容あり → rlogのみ・痛みeval生成せず(汚染防止) ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','リハのみ');setInput('self-note','');
setSliders({rest:0,motion:0,night:0,press:0});
doRehab(20,btn());drain();
ok('rlog1件', store('rlog').length===1);
ok('痛みeval無し(全0スライダは臨床評価を汚染しない)', store('chart').length===0);

print('--- 6) メモのみ(スライダ全0) → note非空でeval生成 ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','');setInput('self-note','張りが残る');
setSliders({rest:0,motion:0,night:0,press:0});
doRehab(20,btn());drain();
ok('chart eval1件(メモでhasPain)', store('chart').length===1);
var ev6=store('chart')[0] && store('chart')[0].evals[0];
ok('note選手記録プレフィクス', ev6 && /\[選手記録\] 張りが残る/.test(ev6.note));
ok('rlog無し', store('rlog').length===0);

print('--- 6b) [レビュー] メモのみなら pain は空（0埋めで最新痛みを塗り替えない） ---');
ok('pain={}（0埋めしない）', ev6 && ev6.pain && Object.keys(ev6.pain).length===0);

print('--- 6c) [レビュー] 過去日で痛みを入れると保存をブロック（当日ゲート外の記録を作らない） ---');
reset();
setInput('rl-date','2020-01-02');setInput('rl-ct','昨日のリハ');setInput('self-note','');
setSliders({rest:0,motion:6,night:0,press:0});
doRehab(20,btn());drain();
ok('rlogも保存されない', store('rlog').length===0);
ok('痛みevalも作られない', store('chart').length===0);
ok('当日のみのalert', __alerts.some(function(a){return /当日分のみ/.test(a);}));

print('--- 6d) [レビュー] 過去日でも痛みが空ならリハ記録だけは保存できる ---');
reset();
setInput('rl-date','2020-01-02');setInput('rl-ct','昨日のリハ');setInput('self-note','');
setSliders({rest:0,motion:0,night:0,press:0});
doRehab(20,btn());drain();
ok('rlogは保存される', store('rlog').length===1);
ok('日付は入力どおり', store('rlog')[0] && store('rlog')[0].date==='2020-01-02');
ok('痛みevalは無し', store('chart').length===0);

print('--- 7) rレコード無し(rid不正) → 保存せずalert ---');
reset();
setInput('rl-date',TODAY);setInput('rl-ct','内容');setInput('self-note','');
doRehab(999,btn());drain();
ok('rlog0件(不正ridは保存しない)', store('rlog').length===0);
ok('見つからないalert', __alerts.some(function(a){return /見つかりません/.test(a);}));

print(__fail===0?'ALL REHAB-ONEFORM TESTS PASSED':(__fail+' TESTS FAILED'));
