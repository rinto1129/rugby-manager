// P5: 確定操作ガードの回帰テスト（敵対的レビューで確定した4バグの再発防止）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_p5_guards.js
// 核心=(1)cancelInjury/doEditInjuryはサーバー最新のapprovedで再判定し承認済みを壊さない（並行承認レース）
//       (2)rlog編集/削除は by==='player' かつ 当日のみ（過去日/他者記録は不可）
//       (3)痛み自己記録の編集/削除は bySelf かつ 当日のみ（臨床評価は不可）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
myPid=1;
var TODAY=todayStr();
var YEST='2020-01-01';
var _dom={};
document.getElementById=function(id){return _dom[id]||{value:'',style:{},textContent:''};};
function setInput(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function btn(){return{dataset:{},style:{},innerHTML:''};}
go=function(){};
var _toasts=[];toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};
showMyChart=function(){};showSub=function(){};showTrainingHistory=function(){};
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
function resetAll(){_toasts=[];__alerts.length=0;}

print('--- 1) cancelInjury: 保留怪我はi+対のrを削除し、Undoで両方復元 ---');
resetAll();
setKey('i',[{id:10,pid:1,source:'player',approved:null,resolved:false}]);
setKey('r',[{id:20,injId:10,pid:1,stage:0}]);
cancelInjury(10);drain();
ok('保留怪我がiから削除', store('i').length===0);
ok('対のリハビリrも削除（孤児回避）', store('r').length===0);
ok('取消トースト+Undo提示', _toasts.some(function(t){return /取り消しました/.test(t.m)&&typeof t.fn==='function';}));
var undo=_toasts.filter(function(t){return t.fn;}).pop();
undo.fn();drain();
ok('Undoでi復元', store('i').some(function(r){return idEq(r.id,10);}));
ok('Undoでr復元', store('r').some(function(r){return idEq(r.id,20);}));

print('--- 2) cancelInjury: 承認レース（client=保留/server=承認済み）はサーバー判定で取消をブロック ---');
resetAll();
D.i=[{id:10,pid:1,source:'player',approved:null,resolved:false}];               // クライアントは保留に見える
__store['i']=JSON.stringify([{id:10,pid:1,source:'player',approved:true,resolved:false}]); // サーバーは承認済み
setKey('r',[{id:20,injId:10,pid:1,stage:0}]);
cancelInjury(10);drain();
ok('承認済みは削除されない（i残存）', store('i').some(function(r){return idEq(r.id,10);}));
ok('対のrも残る（削除連鎖に入らない）', store('r').some(function(r){return idEq(r.id,20);}));
ok('承認済みアラート表示', __alerts.some(function(a){return /スタッフ確認済み/.test(a);}));

print('--- 3) doEditInjury: 保留怪我はフィールド更新+note再構成、approvedは温存 ---');
resetAll();
setKey('i',[{id:10,pid:1,source:'player',approved:null,resolved:false,side:'右',part:'膝',type:'捻挫',date:TODAY,painLevel:5,canPractice:'わからない',note:'【選手報告】旧'}]);
setInput('ei-date',TODAY);setInput('ei-side','左');setInput('ei-part','足首');setInput('ei-type','肉離れ');setInput('ei-canprac','参加できない');setInput('ei-pain','8');setInput('ei-note','新しい状況');
doEditInjury(10,btn());drain();
var e=store('i')[0];
ok('部位/左右更新', e.part==='足首'&&e.side==='左');
ok('種類更新', e.type==='肉離れ');
ok('painLevel更新', e.painLevel===8);
ok('canPractice更新', e.canPractice==='参加できない');
ok('note再構成(修正タグ+痛み+来週練習)', /^【選手報告・修正】新しい状況 \/ 痛み:8\/10 \/ 来週練習:参加できない$/.test(e.note));
ok('approvedは温存(null)', e.approved===null);
ok('editedAt付与', !!e.editedAt);

print('--- 4) doEditInjury: 承認レースはサーバー判定でブロック（上書きしない） ---');
resetAll();
D.i=[{id:10,pid:1,source:'player',approved:null,note:'x'}];
__store['i']=JSON.stringify([{id:10,pid:1,source:'player',approved:true,part:'膝',note:'元'}]);
setInput('ei-date',TODAY);setInput('ei-side','');setInput('ei-part','足首');setInput('ei-type','');setInput('ei-canprac','参加できる');setInput('ei-pain','7');setInput('ei-note','書換');
doEditInjury(10,btn());drain();
var e2=store('i')[0];
ok('承認済みは編集ブロック(part不変=膝)', e2.part==='膝');
ok('noteも不変(元)', e2.note==='元');
ok('承認済みアラート表示', __alerts.some(function(a){return /スタッフ確認済み/.test(a);}));

print('--- 5) delRlog: 当日playerのみ削除可（過去日/staff記録は不可） ---');
resetAll();
setKey('rlog',[{id:30,injId:10,date:TODAY,content:'今日',by:'player'},{id:31,injId:10,date:YEST,content:'過去',by:'player'},{id:32,injId:10,date:TODAY,content:'staff記録',by:'staff'}]);
delRlog(31);drain();
ok('過去日playerは削除されない（当日ゲート）', store('rlog').some(function(r){return idEq(r.id,31);}));
resetAll();delRlog(32);drain();
ok('staff記録は削除されない（所有者ゲート）', store('rlog').some(function(r){return idEq(r.id,32);}));
ok('staff削除試行でアラート', __alerts.some(function(a){return /削除できません/.test(a);}));
resetAll();delRlog(30);drain();
ok('当日playerは削除される', !store('rlog').some(function(r){return idEq(r.id,30);}));
ok('削除Undoトースト', _toasts.some(function(t){return /削除しました/.test(t.m)&&t.fn;}));

print('--- 6) doEditRlog: 当日playerのみ内容更新可（過去日は不可） ---');
resetAll();
setKey('rlog',[{id:30,injId:10,date:TODAY,content:'今日',by:'player'},{id:31,injId:10,date:YEST,content:'過去',by:'player'}]);
setInput('erl-ct','編集後');
doEditRlog(30,btn());drain();
ok('当日playerの内容更新', store('rlog').find(function(r){return idEq(r.id,30);}).content==='編集後');
resetAll();setInput('erl-ct','侵入');
doEditRlog(31,btn());drain();
ok('過去日は編集されない（内容不変）', store('rlog').find(function(r){return idEq(r.id,31);}).content==='過去');
ok('過去日編集でnotFoundアラート', __alerts.some(function(a){return /見つかりません/.test(a);}));

print('--- 7) delPainSelf: bySelf かつ 当日のみ削除可（臨床評価/過去日は不可） ---');
resetAll();
setKey('chart',[{injId:10,injDetail:{},medical:{},evals:[
  {id:'s1',date:TODAY,pain:{rest:3},bySelf:true},
  {id:'s2',date:YEST,pain:{rest:2},bySelf:true},
  {id:'c1',date:TODAY,pain:{rest:5}}
],soaps:[],returnCriteria:{},images:[]}]);
delPainSelf(10,'c1');drain();
ok('臨床評価(bySelf無し)は削除されない', store('chart')[0].evals.some(function(e){return e.id==='c1';}));
resetAll();delPainSelf(10,'s2');drain();
ok('過去日selfは削除されない（当日ゲート）', store('chart')[0].evals.some(function(e){return e.id==='s2';}));
resetAll();delPainSelf(10,'s1');drain();
ok('当日selfは削除される', !store('chart')[0].evals.some(function(e){return e.id==='s1';}));

print('--- 8) doEditPainSelf: bySelf かつ 当日のみ編集可（editedAt付与で判定） ---');
resetAll();
setKey('chart',[{injId:10,evals:[{id:'s1',date:TODAY,pain:{rest:3},bySelf:true},{id:'c1',date:TODAY,pain:{rest:5}}],soaps:[],returnCriteria:{}}]);
D.i=[{id:10,pid:1}];__store['i']=JSON.stringify(D.i);
doEditPainSelf(10,'c1',btn());drain();
ok('臨床評価は編集されない(editedAt無し)', !store('chart')[0].evals.find(function(e){return e.id==='c1';}).editedAt);
ok('臨床評価編集でnotFoundアラート', __alerts.some(function(a){return /見つかりません/.test(a);}));
resetAll();
doEditPainSelf(10,'s1',btn());drain();
ok('当日selfは編集される(editedAt付与)', !!store('chart')[0].evals.find(function(e){return e.id==='s1';}).editedAt);

print(__fail===0?'\nALL P5-GUARD TESTS PASSED':('\n'+__fail+' FAILED'));
if(__fail>0)throw new Error('p5-guard tests failed');
