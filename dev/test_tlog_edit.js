// P2: tlog編集/削除 + rebuildE1rmFrom（推定1RMのリプレイ再生成）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tlog_edit.js
// 核心=誤高値による「抑圧レコード」の復元。ほか前回比の自己除外・notFoundガード・in-place温存・
//       同日max集約・同一estBase重複max・date欠落温存・fitness跨ぎ・複数pid隔離・値下げ編集・Undo完全復元。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

// --- テスト用の共通土台 ---
myPid=1;
if(typeof D.p==='undefined'||!D.p.length)D.p=[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'CTB',year:1}];
D.tmenu=D.tmenu||[];
var _toasts=[];
toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};   // トーストを捕捉（Undoのaction関数も保持）
showTrainingHistory=function(){};                          // 再描画はDOM依存のためno-op化（データ検証に集中）

function E(w){return estimateOneRM(w,5,2);}                // reps5/rir2固定のe1rm
function V(w){return{squat:{e1rm:E(w),weight:w,reps:5,rir:2}};}
function e1rec(date,vals,pid){return{id:'e'+date+'_'+(pid||1),pid:pid||1,date:date,inputAt:date+'T10:00:00.000Z',values:vals};}
function sess(date,w,opt){opt=opt||{};return{id:opt.id||('T'+date),pid:opt.pid||1,date:date,ts:opt.ts||(date+'T10:00:00.000Z'),kind:opt.kind,menuId:opt.menuId,
  results:[{exName:opt.ex||'スクワット',estBase:opt.estBase||'squat',sets:[{weight:w,reps:5,rir:2}]}],totalVolume:w*5};}
function reset(tlogs,e1rms){
  D.tlog=tlogs||[];__store['tlog']=JSON.stringify(D.tlog);
  D.e1rm=e1rms||[];__store['e1rm']=JSON.stringify(D.e1rm);
  _tlogArch=[];_tlaCache=null;_tlogArchLoaded=true;_tlaPid=1;   // アーカイブ非同期ロードを回避
  _e1rmRebuildGen=0;_pendingRebuild=null;_toasts=[];window._etl=null;window._trCompareMode=null;_curTLog=null;
}
function pidE1(pid){return D.e1rm.filter(function(r){return idEq(r.pid,pid);});}

// ============================================================
print('--- 1) 誤高値による抑圧レコードの復元【核心】 ---');
// 履歴: day1=100(記録), day3=200誤(記録), day5=120(抑圧・記録なし), day7=130(抑圧・記録なし)
reset(
  [sess('2026-07-01',100),sess('2026-07-03',200),sess('2026-07-05',120),sess('2026-07-07',130)],
  [e1rec('2026-07-01',V(100)),e1rec('2026-07-03',V(200))]
);
delTlog('T2026-07-03');   // 誤高値セッションを削除→rebuildE1rmFrom(1,'2026-07-03')
drain();
ok('誤高値(E200)がe1rmから消えた', !D.e1rm.some(function(r){return r.values&&r.values.squat&&r.values.squat.e1rm===E(200);}));
ok('day1(E100)は温存', D.e1rm.some(function(r){return r.date==='2026-07-01'&&!r.source;}));
ok('抑圧されていたday5/day7が復元(rebuild2件)', D.e1rm.filter(function(r){return r.source==='rebuild';}).length===2);
ok('最新e1rm=day7(E130)に回復', getLatestE1RM(1).squat.e1rm===E(130));
ok('day5がE120で復元', D.e1rm.some(function(r){return r.date==='2026-07-05'&&r.values.squat.e1rm===E(120);}));
ok('削除セッションはtlogから消えた', !D.tlog.some(function(l){return idEq(l.id,'T2026-07-03');}));

// ============================================================
print('--- 2) 編集時の前回比が自己/未来を拾わない（getCompareVolume自己除外・_curTLog=null） ---');
reset([sess('2026-07-08',100,{id:'A'}),sess('2026-07-10',110,{id:'B'})]);
_curTLog=null; // 編集経路は実施画面を通らない＝グローバル_curTLogは無い
var clean=[{exName:'スクワット',estBase:'squat',sets:[{weight:120,reps:5,rir:null}]}];
var cv=computeTlogVolumes(clean,1,'2026-07-10','prev','B','2026-07-10T10:00:00.000Z');
ok('lastVolumeDateが前セッション(7/8)を指す', cv.results[0].lastVolumeDate==='2026-07-08');
ok('lastVolume=前回volume(500)', cv.results[0].lastVolume===500);
ok('自己(B)・未来を前回比に拾わない', cv.results[0].lastVolume!==110*5&&cv.results[0].lastVolumeDate!=='2026-07-10');

// ============================================================
print('--- 3) notFoundガード（移送済み/存在しないidの削除・編集） ---');
reset([sess('2026-07-05',100,{id:'X'})],[]);
var before=D.tlog.length;
delTlog('NOPE');drain();
ok('削除notFound: tlog不変', D.tlog.length===before);
ok('削除notFound: 移送済みトースト', _toasts.some(function(t){return /移送済み/.test(t.m);}));
_toasts=[];
window._etl={recId:'NOPE',results:[{exName:'スクワット',estBase:'squat',skipped:false,sets:[{weight:120,reps:5,rir:2}]}]};
doEditTlog('NOPE',mkEl());drain();
ok('編集notFound: 移送済みトースト', _toasts.some(function(t){return /移送済み/.test(t.m);}));

// ============================================================
print('--- 4) 編集はin-place更新（ts/kind/menuIdを温存・setsのみ差替） ---');
reset([sess('2026-07-05',100,{id:'Y',kind:'self',menuId:'M9',ts:'2026-07-05T09:00:00.000Z'})],[]);
window._etl={recId:'Y',results:[{exName:'スクワット',estBase:'squat',skipped:false,sets:[{weight:120,reps:5,rir:2}]}]};
doEditTlog('Y',mkEl());drain();
var recY=D.tlog.find(function(l){return idEq(l.id,'Y');});
ok('kind温存', recY.kind==='self');
ok('menuId温存', recY.menuId==='M9');
ok('ts温存', recY.ts==='2026-07-05T09:00:00.000Z');
ok('weight反映(120)', recY.results[0].sets[0].weight===120);
ok('editedAt付与', !!recY.editedAt);
ok('編集後にe1rm再生成(E120)', getLatestE1RM(1).squat.e1rm===E(120));

// ============================================================
print('--- 5) 同日複数セッションは1レコードに集約しmaxを採る ---');
reset([sess('2026-07-05',140,{id:'D1',ts:'2026-07-05T09:00:00.000Z'}),sess('2026-07-05',150,{id:'D2',ts:'2026-07-05T15:00:00.000Z'})],[]);
rebuildE1rmFrom(1,'2026-07-01',function(){},function(){});drain();
var recs5=D.e1rm.filter(function(r){return r.date==='2026-07-05';});
ok('同日は1レコードに集約', recs5.length===1);
ok('同日maxを採用(E150)', recs5[0].values.squat.e1rm===E(150));
ok('getLatestE1RM=max(E150)', getLatestE1RM(1).squat.e1rm===E(150));

// ============================================================
print('--- 6) 1セッション内で同一estBaseが複数種目→結果横断max ---');
reset([{id:'S1',pid:1,date:'2026-07-05',ts:'2026-07-05T10:00:00.000Z',results:[
  {exName:'バックスクワット',estBase:'squat',sets:[{weight:150,reps:5,rir:2}]},
  {exName:'フロントスクワット',estBase:'squat',sets:[{weight:140,reps:5,rir:2}]}
],totalVolume:0}],[]);
rebuildE1rmFrom(1,'2026-07-01',function(){},function(){});drain();
ok('同一estBase重複はmax(E150)', getLatestE1RM(1).squat.e1rm===E(150));

// ============================================================
print('--- 7) date欠落のe1rmレコードは削除されず温存（kept式の対称性） ---');
reset([sess('2026-07-05',100,{id:'Z'})],[{id:'bad',pid:1,values:{squat:{e1rm:999}}}]);
rebuildE1rmFrom(1,'2026-07-01',function(){},function(){});drain();
ok('date欠落レコードは温存', D.e1rm.some(function(r){return r.id==='bad';}));
ok('正常分は再生成される', D.e1rm.some(function(r){return r.date==='2026-07-05'&&r.source==='rebuild';}));

// ============================================================
print('--- 8) fitnessレコードを跨ぐリプレイ／fitness削除でresults系に影響なし ---');
reset([sess('2026-07-03',100,{id:'W'}),
  {id:'F1',pid:1,date:'2026-07-05',ts:'2026-07-05T10:00:00.000Z',fitness:{ftype:'ランニング',minutes:30},totalVolume:0,results:[]},
  sess('2026-07-07',130,{id:'W2'})],[]);
rebuildE1rmFrom(1,'2026-07-01',function(){},function(){});drain();
ok('fitness跨ぎ: squat正しく再生成(2件)', D.e1rm.filter(function(r){return r.values.squat;}).length===2);
ok('fitness跨ぎ: 最新=E130', getLatestE1RM(1).squat.e1rm===E(130));
delTlog('F1');drain();
ok('fitness削除: tlogから消える', !D.tlog.some(function(l){return idEq(l.id,'F1');}));
ok('fitness削除: squat e1rm不変(E130)', getLatestE1RM(1).squat.e1rm===E(130));

// ============================================================
print('--- 9) 複数pid隔離（pid1の削除でpid2のe1rmを巻き込まない） ---');
reset([sess('2026-07-05',100,{id:'P1',pid:1}),sess('2026-07-05',100,{id:'P2',pid:2})],
  [e1rec('2026-07-05',V(100),1),e1rec('2026-07-05',V(100),2)]);
delTlog('P1');drain(); // myPid=1
ok('pid2のe1rmは温存', pidE1(2).length===1&&pidE1(2)[0].values.squat.e1rm===E(100));
ok('pid1はセッション消滅で該当e1rm無し', !pidE1(1).some(function(r){return r.values&&r.values.squat;}));

// ============================================================
print('--- 10) 値を下げる編集で誤高値e1rmが正しく訂正される ---');
reset([sess('2026-07-05',200,{id:'L1',ts:'2026-07-05T10:00:00.000Z'})],[e1rec('2026-07-05',V(200))]);
window._etl={recId:'L1',results:[{exName:'スクワット',estBase:'squat',skipped:false,sets:[{weight:120,reps:5,rir:2}]}]};
doEditTlog('L1',mkEl());drain();
ok('値下げ編集: e1rm=E120', getLatestE1RM(1).squat.e1rm===E(120));
ok('値下げ編集: E200が消滅', !D.e1rm.some(function(r){return r.values&&r.values.squat&&r.values.squat.e1rm===E(200);}));

// ============================================================
print('--- 11) 削除→Undoで完全復元（tlog・e1rm両方） ---');
reset([sess('2026-07-05',150,{id:'U1'})],[e1rec('2026-07-05',V(150))]);
delTlog('U1');drain();
ok('削除後: 該当pidのsquat e1rm無し', !pidE1(1).some(function(r){return r.values&&r.values.squat;}));
var undoToast=_toasts.filter(function(t){return typeof t.fn==='function';}).pop();
ok('削除トーストにUndo(action)が付く', undoToast&&typeof undoToast.fn==='function');
undoToast.fn();drain(); // 「元に戻す」を押す
ok('Undo後: tlog復元', D.tlog.some(function(l){return idEq(l.id,'U1');}));
ok('Undo後: e1rm再生成(E150)', getLatestE1RM(1).squat.e1rm===E(150));
ok('Undo二度押しでtlog二重化しない', (function(){undoToast.fn();drain();return D.tlog.filter(function(l){return idEq(l.id,'U1');}).length===1;})());

if(__fail)throw new Error(__fail+' failed');
print('ALL TLOG-EDIT TESTS PASSED');
