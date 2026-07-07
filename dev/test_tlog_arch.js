// Phase 0: tlog容量対策のテスト（0-A: slimTlogRec / finishTrainingの保存スリム化）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tlog_arch.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

print('--- slimTlogRec: 削除・保持・省略 ---');
var bloated={
  id:'L1',pid:1,menuId:10,date:'2026-07-07',ts:'2026-07-07T10:00:00.000Z',
  results:[
    {exName:'ベンチプレス',estBase:'bench',targetSets:3,targetReps:5,targetRir:2,
     note:'フォーム注意',videoUrl:'https://example.com/v',estWeight:80,oneRM:100,
     prevEx:{sets:[{weight:80,reps:5,rir:2}],date:'2026-07-04'},
     sets:[{weight:80,reps:5,rir:2},{weight:80,reps:5,rir:null}],
     skipped:false,skipReason:'',volume:800,lastVolume:780,lastVolumeDate:'2026-07-04'},
    {exName:'サイドプランク',estBase:null,targetSets:3,targetReps:30,targetRir:null,
     note:'',videoUrl:'',estWeight:null,oneRM:null,prevEx:null,
     sets:[],skipped:true,skipReason:'痛み・怪我',volume:0,lastVolume:0,lastVolumeDate:null}
  ],
  totalVolume:800,hasInjurySkip:true
};
var s=slimTlogRec(bloated);
var r0=s.results[0],r1=s.results[1];
ok('prevEx削除',!('prevEx'in r0)&&!('prevEx'in r1));
ok('note/videoUrl削除',!('note'in r0)&&!('videoUrl'in r0));
ok('estWeight/oneRM削除',!('estWeight'in r0)&&!('oneRM'in r0));
ok('targetSets削除',!('targetSets'in r0));
ok('exName保持',r0.exName==='ベンチプレス');
ok('estBase保持(値あり)',r0.estBase==='bench');
ok('estBase省略(null)',!('estBase'in r1));
ok('targetReps保持',r0.targetReps===5&&r1.targetReps===30);
ok('targetRir保持(値あり)/省略(null)',r0.targetRir===2&&!('targetRir'in r1));
ok('skipped省略(false)/保持(true)',!('skipped'in r0)&&r1.skipped===true);
ok('skipReason省略(空)/保持',!('skipReason'in r0)&&r1.skipReason==='痛み・怪我');
ok('volume保持',r0.volume===800&&r1.volume===0);
ok('lastVolume保持(>0)/省略(0)',r0.lastVolume===780&&!('lastVolume'in r1));
ok('lastVolumeDate保持/省略(null)',r0.lastVolumeDate==='2026-07-04'&&!('lastVolumeDate'in r1));
ok('sets保持+rir:null省略',r0.sets.length===2&&r0.sets[0].rir===2&&!('rir'in r0.sets[1])&&r0.sets[1].weight===80);
ok('hasInjurySkip保持(true)',s.hasInjurySkip===true);
ok('トップレベル保持',s.id==='L1'&&s.pid===1&&s.menuId===10&&s.date==='2026-07-07'&&s.totalVolume===800);
ok('元オブジェクト非破壊',bloated.results[0].prevEx!=null&&bloated.results[0].note==='フォーム注意');

print('--- slimTlogRec: 冪等・hasInjurySkip:false省略 ---');
var s2=slimTlogRec(s);
ok('冪等(再適用で同一)',JSON.stringify(s2)===JSON.stringify(s));
var noInj=slimTlogRec({id:'L2',pid:1,date:'2026-07-07',results:[],totalVolume:0,hasInjurySkip:false});
ok('hasInjurySkip省略(false)',!('hasInjurySkip'in noInj));

print('--- slimTlogRec: 欠席レコード・将来フィールドのパススルー ---');
var abs=slimTlogRec({id:'L3',pid:1,menuId:10,date:'2026-07-07',ts:'x',absent:true,absentReason:'授業',results:[],totalVolume:0});
ok('欠席レコード無傷',abs.absent===true&&abs.absentReason==='授業'&&abs.results.length===0&&abs.totalVolume===0);
var fut=slimTlogRec({id:'L4',pid:1,menuId:null,date:'2026-07-07',kind:'self',programId:'pg1',
  fitness:{ftype:'ラン',minutes:30,km:5,rpe:7,note:'x'},results:[],totalVolume:0});
ok('将来フィールド(kind/fitness/programId)パススルー',fut.kind==='self'&&fut.programId==='pg1'&&fut.fitness.minutes===30);
ok('menuId:nullはトップレベルなので保持',('menuId'in fut)&&fut.menuId===null);

print('--- 消費側の互換: スリム済みレコードで既存表示が壊れない ---');
// showTrainingResult相当の読み方（r.skipped&& / ||\'スキップ\' / lastVolume>0）
ok('r.skippedのtruthy判定',!r0.skipped&&!!r1.skipped);
ok('skipReasonフォールバック',(r0.skipReason||'スキップ')==='スキップ');
ok('lastVolume>0判定',!(r1.lastVolume>0)&&(r0.lastVolume>0));
ok('targetRirのloose null判定',!(r1.targetRir!=null)&&(r0.targetRir!=null));

print('--- finishTraining: 保存レコードがスリム化される（E2E・Firestoreモック） ---');
D.p=[{id:1,name:'テスト',position:'PR',year:2,weight:'100'}];
D.ph=[];D.bc=[];D.f=[];D.std=[];D.i=[];D.r=[];D.tlog=[];D.e1rm=[];D.cal=[];D.tmenu=[];
myPid=1;
__store['tlog']=JSON.stringify([]);
_curTLog={
  id:'NEW1',pid:1,menuId:10,date:todayStr(),ts:'2026-07-07T10:00:00.000Z',
  results:[
    {exName:'ベンチプレス',estBase:'bench',targetSets:2,targetReps:5,targetRir:2,
     note:'メモ',videoUrl:'https://example.com/v',estWeight:80,oneRM:100,
     prevEx:{sets:[{weight:80,reps:5,rir:2}],date:'2026-07-04'},
     sets:[{weight:'80',reps:'5',rir:'2'},{weight:'',reps:'',rir:''}],
     skipped:false,skipReason:''}
  ],
  totalVolume:0
};
var _keepCur=_curTLog;
finishTraining(mkEl());
drain();
var saved=JSON.parse(__store['tlog']);
ok('tlogに1件保存',saved.length===1);
var sr=saved[0]&&saved[0].results&&saved[0].results[0];
ok('保存レコードにprevExなし',sr&&!('prevEx'in sr));
ok('保存レコードにnote/videoUrl/estWeight/oneRM/targetSetsなし',sr&&!('note'in sr)&&!('videoUrl'in sr)&&!('estWeight'in sr)&&!('oneRM'in sr)&&!('targetSets'in sr));
ok('空セット除外+数値化',sr&&sr.sets.length===1&&sr.sets[0].weight===80&&sr.sets[0].reps===5&&sr.sets[0].rir===2);
ok('volume計算',sr&&sr.volume===400&&saved[0].totalVolume===400);
ok('targetReps/targetRir保持',sr&&sr.targetReps===5&&sr.targetRir===2);
ok('_curTLogは温存（prevEx残存）',_keepCur.results[0].prevEx!=null&&_keepCur.results[0].note==='メモ');
ok('e1rm自動記録あり',__store['e1rm']!=null&&JSON.parse(__store['e1rm']).length===1);

if(__fail===0)print('ALL TLOG-ARCH TESTS PASSED');else print(__fail+' TESTS FAILED');
