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

// ===== 0-B: アーカイブ =====
function agoS(n){return toDateStr(new Date(Date.now()-n*86400000));}

print('--- 0-B: 半期キー ---');
ok('tlaHalf 6月=h1',tlaHalf('2026-06-21')==='2026h1');
ok('tlaHalf 7月=h2',tlaHalf('2026-07-01')==='2026h2');
ok('tlaHalf 12月=h2',tlaHalf('2026-12-31')==='2026h2');
ok('tlaKey形式',tlaKey(17,'2026h1')==='tla_17_2026h1');
var hv=tlaHalves();
ok('tlaHalvesは2026h1から今日の半期まで',hv[0]==='2026h1'&&hv[hv.length-1]===tlaHalf(todayStr())&&hv.length>=1);

print('--- 0-B: tlogAllのidマージ ---');
D.tlog=[{id:'m1',pid:1,date:agoS(1)},{id:'dup',pid:1,date:agoS(2),src:'main'}];
_tlogArch=[{id:'a1',pid:1,date:'2026-06-01'},{id:'dup',pid:1,date:agoS(2),src:'arch'}];
_tlaCache=null;
var all=tlogAll();
ok('マージ後3件（id重複は1件）',all.length===3);
ok('重複idはメインdoc側が勝つ',all.filter(function(l){return l.id==='dup';})[0].src==='main');
ok('参照キャッシュ（同一参照を返す）',tlogAll()===all);
D.tlog=D.tlog.slice();
ok('D.tlog参照変更で再計算',tlogAll()!==all&&tlogAll().length===3);

print('--- 0-B: archiveTlog 移送+in-placeスリム化 ---');
var oldD1=agoS(20),oldD2=agoS(40),recentD=agoS(3);
function mkBloat(id,pid,date){return{id:id,pid:pid,menuId:10,date:date,ts:date+'T10:00:00.000Z',
  results:[{exName:'ベンチプレス',estBase:'bench',targetSets:3,targetReps:5,targetRir:2,note:'x',videoUrl:'v',
    estWeight:80,oneRM:100,prevEx:{sets:[{weight:1,reps:1}],date:'2026-01-01'},
    sets:[{weight:80,reps:5,rir:null}],skipped:false,skipReason:'',volume:400,lastVolume:0,lastVolumeDate:null}],
  totalVolume:400};}
D.tlog=[mkBloat('o1',1,oldD1),mkBloat('o2',2,oldD1),mkBloat('o3',1,oldD2),mkBloat('r1',1,recentD)];
__store['tlog']=JSON.stringify(D.tlog);
delete __store[tlaKey(1,tlaHalf(oldD1))];delete __store[tlaKey(2,tlaHalf(oldD1))];delete __store[tlaKey(1,tlaHalf(oldD2))];
_tlogArch=[];_tlogArchLoaded=false;_tlaPid=null;_tlaCbs=null;_tlaCache=null;_tlogArchRan=false;
myPid=1;
archiveTlog();
drain();
var mainAfter=JSON.parse(__store['tlog']);
ok('メインdocは直近のみ残る',mainAfter.length===1&&mainAfter[0].id==='r1');
ok('残存レコードもin-placeスリム化',!('prevEx'in mainAfter[0].results[0])&&!('note'in mainAfter[0].results[0]));
var a1=JSON.parse(__store[tlaKey(1,tlaHalf(oldD1))]||'[]');
var a2=JSON.parse(__store[tlaKey(2,tlaHalf(oldD1))]||'[]');
ok('選手1のアーカイブに移送',a1.some(function(l){return l.id==='o1';}));
ok('選手2は別docへ移送',a2.length===1&&a2[0].id==='o2');
var halfSame=tlaHalf(oldD1)===tlaHalf(oldD2);
var a3=JSON.parse(__store[tlaKey(1,tlaHalf(oldD2))]||'[]');
ok('半期が同じなら同doc・違えば別doc',halfSame?(a1.length===2):(a1.length===1&&a3.length===1&&a3[0].id==='o3'));
ok('アーカイブ側もスリム化済み',!('prevEx'in a1[0].results[0])&&!('oneRM'in a1[0].results[0]));
ok('D.tlogもメモリ上で更新',D.tlog.length===1);

print('--- 0-B: 冪等性（再実行・両doc重複） ---');
// o1をわざとメインdocへ戻す（クラッシュで両docに残ったケースを再現）
var dupMain=JSON.parse(__store['tlog']);dupMain.push(mkBloat('o1',1,oldD1));
__store['tlog']=JSON.stringify(dupMain);D.tlog=dupMain;
_tlogArchRan=false;
archiveTlog();
drain();
var mainAfter2=JSON.parse(__store['tlog']);
var a1b=JSON.parse(__store[tlaKey(1,tlaHalf(oldD1))]||'[]');
ok('再実行でメインから重複が消える',mainAfter2.length===1&&mainAfter2[0].id==='r1');
ok('アーカイブ側は重複しない',a1b.filter(function(l){return l.id==='o1';}).length===1);
_tlogArchRan=false;
archiveTlog();
drain();
ok('staleゼロなら何もしない',JSON.parse(__store['tlog']).length===1);

print('--- 0-B: カットオフ境界 ---');
var cutD=toDateStr(new Date(Date.now()-TLOG_KEEP_DAYS*86400000));
D.tlog=[mkBloat('b1',1,cutD),mkBloat('b2',1,agoS(TLOG_KEEP_DAYS+1))];
__store['tlog']=JSON.stringify(D.tlog);
_tlogArchRan=false;
archiveTlog();
drain();
var mainB=JSON.parse(__store['tlog']);
ok('ちょうど15日前は残る・16日前は移送',mainB.length===1&&mainB[0].id==='b1');

print('--- 0-B: loadTlogArch（自分の分のみ・選手切替リセット） ---');
__store[tlaKey(1,'2026h1')]=JSON.stringify([{id:'h1a',pid:1,date:'2026-06-01'}]);
__store[tlaKey(2,'2026h1')]=JSON.stringify([{id:'h1b',pid:2,date:'2026-06-01'}]);
_tlogArch=[];_tlogArchLoaded=false;_tlaPid=null;_tlaCbs=null;_tlaCache=null;
myPid=1;
var cbRan=0;
loadTlogArch(function(){cbRan++;});
drain();
ok('取得完了+cb発火',_tlogArchLoaded&&cbRan===1);
ok('自分のアーカイブのみ取得',_tlogArch.some(function(l){return l.id==='h1a';})&&!_tlogArch.some(function(l){return l.id==='h1b';}));
loadTlogArch(function(){cbRan++;});
ok('取得済みなら即cb',cbRan===2);
myPid=2;
loadTlogArch(function(){cbRan++;});
drain();
ok('選手切替で再取得（選手2の分に入れ替わる）',_tlogArch.some(function(l){return l.id==='h1b';})&&!_tlogArch.some(function(l){return l.id==='h1a';}));

print('--- 0-B: エンジンswap（5週集計にアーカイブ分が乗る） ---');
myPid=1;
D.p=[{id:1,name:'テスト',position:'PR',year:2,weight:'100'}];
D.std=[];D.ph=[];D.i=[];D.r=[];D.bc=[];D.f=[];
var wOld=agoS(21),wNew=agoS(2); // 21日前=メインdocに無い週 / 2日前=メインdocの週
D.tlog=[{id:'w2',pid:1,date:wNew,results:[{exName:'ベンチプレス',estBase:'bench',sets:[{weight:100,reps:5}]}]}];
_tlogArch=[{id:'w1',pid:1,date:wOld,results:[{exName:'ベンチプレス',estBase:'bench',sets:[{weight:100,reps:10}]}]}];
_tlogArchLoaded=true;_tlaPid=1;_tlaCache=null;
var wvNo=getWeakWeeklyVolume(1,'bp',5);
var _sv=D.tlog;D.tlog=tlogAll();
var wvSwap;try{wvSwap=getWeakWeeklyVolume(1,'bp',5);}finally{D.tlog=_sv;}
function totVol(wv){return wv.reduce(function(s,x){return s+x.vol;},0);}
ok('swapなし=直近分のみ(500)',totVol(wvNo)===500);
ok('swapあり=アーカイブ分込み(1500)',totVol(wvSwap)===1500);
ok('swap後にD.tlogが復元される',D.tlog===_sv&&D.tlog.length===1);

if(__fail===0)print('ALL TLOG-ARCH TESTS PASSED');else print(__fail+' TESTS FAILED');
