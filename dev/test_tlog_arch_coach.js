// Phase 0: tlog容量対策のテスト（coach側: tlogAll/loadTlogArch読み出しのみ・書き込み関数なし）
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_tlog_arch_coach.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function agoS(n){return toDateStr(new Date(Date.now()-n*86400000));}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

print('--- coach: 書き込み関数を持たないこと（閲覧専用） ---');
ok('archiveTlog未定義',typeof archiveTlog==='undefined');
ok('slimTlogRec未定義',typeof slimTlogRec==='undefined');
ok('svSafe未定義',typeof svSafe==='undefined');

print('--- coach: tlogAll/loadTlogArch ---');
D.p=[{id:1,name:'選手A',position:'PR',year:2},{id:2,name:'選手B',position:'HO',year:3}];
D.tlog=[{id:'m1',pid:1,date:agoS(2),results:[{exName:'ベンチプレス',sets:[{weight:100,reps:5}],volume:500}],totalVolume:500}];
__store[tlaKey(1,'2026h1')]=JSON.stringify([{id:'a1',pid:1,date:'2026-06-01',results:[{exName:'ベンチプレス',sets:[{weight:90,reps:5}],volume:450}],totalVolume:450}]);
__store[tlaKey(2,'2026h1')]=JSON.stringify([{id:'a2',pid:2,date:'2026-06-02',results:[],totalVolume:0}]);
var cbRan=0;
loadTlogArch(function(){cbRan++;});
drain();
ok('取得完了+cb発火',_tlogArchLoaded&&cbRan===1);
ok('全選手分を結合',tlogAll().length===3);
ok('取得済みなら即cb',(loadTlogArch(function(){cbRan++;}),cbRan===2));

print('--- coach: 消費関数がアーカイブ分を含むこと ---');
// getCompareEx: メインdocに無い過去セッション（アーカイブ側a1）を「前回」として見つける
var cmp=getCompareEx(1,'ベンチプレス',agoS(2),'prev','2026-07-05T10:00:00.000Z','m1');
ok('getCompareExがアーカイブの前回を発見',cmp&&cmp.vol===450);
// 直近14日カウント（trained14相当）は日付フィルタで古いアーカイブ分が混ざらない
function agoStr(n){return toDateStr(new Date(Date.now()-n*86400000));}
var t14=tlogAll().filter(function(l){return !l.absent&&l.date>=agoStr(13);}).length;
ok('直近14日カウントは古いアーカイブを含まない',t14===1);

if(__fail===0)print('ALL TLOG-ARCH-COACH TESTS PASSED');else print(__fail+' TESTS FAILED');
