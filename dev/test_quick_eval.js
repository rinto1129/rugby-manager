// P7d-D: saveQuickEval廃止→saveEval(quick=1)へ統合。クイック評価も roleGuard('eval')/stampWho を通る1本化
// 実行: jsc dev/prelude.js /tmp/trainer.js dev/test_quick_eval.js
// 核心: (1)source:'quick'温存 (2)痛み.motion保存 (3)stampWho付与(旧saveQuickEvalは欠落) (4)空入力はalert
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
myTrainer={id:1,name:'鈴木トレーナー'};
var TODAY=todayStr();
var _dom={};
document.getElementById=function(id){return _dom[id]||null;};
document.querySelectorAll=function(){return[];};
function setEl(id,v,attrs){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:'',_a:attrs||{},getAttribute:function(k){return this._a[k]!=null?this._a[k]:null;},setAttribute:function(k,val){this._a[k]=val;}};}
function btn(){return{dataset:{},style:{},innerHTML:'',textContent:''};}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
qeShowResult=function(){};chartTab=function(){};
function reset(){__alerts.length=0;setKey('chart',[{injId:10,metrics:[],evals:[]}]);setKey('i',[{id:10,pid:1,part:'膝'}]);_dom={};}

print('--- 1) 痛みスライダーを動かして保存 → source:quick + pain.motion + stampWho ---');
reset();
setEl('qe-date',TODAY);setEl('qe-note','張り');setEl('qe-pain','4',{'data-moved':'1'});
saveEval(10,null,btn(),1);drain();
var evs=store('chart')[0].evals;
ok('eval 1件追記', evs.length===1);
ok('source=quick', evs[0] && evs[0].source==='quick');
ok('pain.motion=4', evs[0] && evs[0].pain && evs[0].pain.motion===4);
ok('stampWho savedRole=trainer', evs[0] && evs[0].savedRole==='trainer');
ok('stampWho savedBy=トレーナー名', evs[0] && evs[0].savedBy==='鈴木トレーナー');
ok('note保存', evs[0] && evs[0].note==='張り');

print('--- 2) 痛み未操作+指標なし → alertで保存しない ---');
reset();
setEl('qe-date',TODAY);setEl('qe-note','');setEl('qe-pain','0',{}); // data-moved無し=前回値複製防止
saveEval(10,null,btn(),1);drain();
ok('保存されない', store('chart')[0].evals.length===0);
ok('項目なしalert', __alerts.some(function(a){return /記録する項目がありません/.test(a);}));

print('--- 3) [レビューhigh] trTodoBadge: 選手の自己申告(bySelf)は臨床評価の間隔をリセットしない ---');
function daysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return toDateStr(d);}
reset();
setKey('r',[{id:20,injId:10,pid:1,stage:0}]);setKey('rplan',[]);setKey('rlog',[]);setKey('injcomm',[]);
var INJ={id:10,pid:1,part:'膝',date:daysAgo(60),resolved:false};
setKey('i',[INJ]);
// 臨床評価が30日前に1件だけ → 「評価が空いています」バッジが出る
setKey('chart',[{injId:10,metrics:[],evals:[{id:'clin',date:daysAgo(30),pain:{motion:3}}]}]);
var b1=trTodoBadge(INJ);
ok('臨床評価30日前 → 評価バッジが出る', !!b1 && /評価が\d+日空いています/.test(b1.label));
// そこへ選手の自己申告(bySelf・本日)が入っても、バッジは消えない
setKey('chart',[{injId:10,metrics:[],evals:[{id:'clin',date:daysAgo(30),pain:{motion:3}},{id:'self',date:TODAY,bySelf:true,pain:{motion:5}}]}]);
var b2=trTodoBadge(INJ);
ok('選手の自己申告ではリセットされない', !!b2 && /評価が\d+日空いています/.test(b2.label));
// トレーナーの臨床評価(本日)が入れば当然リセットされる
setKey('chart',[{injId:10,metrics:[],evals:[{id:'clin',date:daysAgo(30),pain:{motion:3}},{id:'clin2',date:TODAY,pain:{motion:2}}]}]);
var b3=trTodoBadge(INJ);
ok('臨床評価ならリセットされる', !b3 || !/評価が\d+日空いています/.test(b3.label));

print('--- 4) [レビューlow] SOAPのO欄下書きに選手の主観(bySelf)を混ぜない ---');
reset();
setKey('i',[{id:10,pid:1,part:'膝'}]);
setKey('chart',[{injId:10,metrics:[],evals:[
  {id:'clin',date:daysAgo(1),inputAt:'2020-01-01T01:00:00Z',pain:{motion:2}},
  {id:'self',date:TODAY,inputAt:'2020-01-02T01:00:00Z',bySelf:true,pain:{motion:9},note:'[選手記録] つらい'}
]}]);
var draft=buildSOAPObjectiveDraft(10);
ok('O欄下書きは臨床評価(痛み2)を使う', /2\/10/.test(draft));
ok('O欄下書きに自己申告(痛み9)は入らない', !/9\/10/.test(draft));

print(__fail===0?'ALL QUICK-EVAL TESTS PASSED':(__fail+' TESTS FAILED'));
