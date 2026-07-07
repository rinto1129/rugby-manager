// Phase 0: tlog容量対策のテスト（staff側: slimTlogRec/tlogAll/loadTlogArch(全選手)/archiveTlog）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tlog_arch_staff.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function agoS(n){return toDateStr(new Date(Date.now()-n*86400000));}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

print('--- staff: slimTlogRec（playerと同一挙動） ---');
var s=slimTlogRec({id:'L1',pid:1,date:'2026-07-01',results:[
  {exName:'BP',estBase:'bench',targetSets:3,targetReps:5,targetRir:null,note:'x',videoUrl:'v',estWeight:80,oneRM:100,
   prevEx:{sets:[],date:''},sets:[{weight:80,reps:5,rir:null}],skipped:false,skipReason:'',volume:400,lastVolume:0,lastVolumeDate:null}
],totalVolume:400,hasInjurySkip:false});
var r0=s.results[0];
ok('削除/省略フィールド',!('prevEx'in r0)&&!('note'in r0)&&!('targetSets'in r0)&&!('skipped'in r0)&&!('targetRir'in r0)&&!('hasInjurySkip'in s));
ok('保持フィールド',r0.exName==='BP'&&r0.targetReps===5&&r0.volume===400&&r0.sets[0].weight===80&&!('rir'in r0.sets[0]));
ok('冪等',JSON.stringify(slimTlogRec(s))===JSON.stringify(s));

print('--- staff: loadTlogArch（全選手×全半期を結合） ---');
D.p=[{id:1,name:'選手A',position:'PR',year:2},{id:2,name:'選手B',position:'HO',year:3}];
D.tlog=[{id:'m1',pid:1,date:agoS(1)}];
__store[tlaKey(1,'2026h1')]=JSON.stringify([{id:'a1',pid:1,date:'2026-06-01'}]);
__store[tlaKey(2,'2026h1')]=JSON.stringify([{id:'a2',pid:2,date:'2026-06-02'}]);
_tlogArch=[];_tlogArchLoaded=false;_tlaCbs=null;_tlaCache=null;
var cbRan=0;
loadTlogArch(function(){cbRan++;});
drain();
ok('取得完了+cb発火',_tlogArchLoaded&&cbRan===1);
ok('全選手分を結合',_tlogArch.some(function(l){return l.id==='a1';})&&_tlogArch.some(function(l){return l.id==='a2';}));
var all=tlogAll();
ok('tlogAll=メイン+アーカイブ',all.length===3);

print('--- staff: archiveTlog（移送+in-placeスリム+メモリ反映） ---');
var oldD=agoS(20);
D.tlog=[
  {id:'o9',pid:2,date:oldD,results:[{exName:'SQ',estBase:'squat',prevEx:{sets:[]},note:'n',sets:[{weight:100,reps:5,rir:null}],volume:500}],totalVolume:500},
  {id:'r9',pid:1,date:agoS(2),results:[{exName:'BP',prevEx:{sets:[]},sets:[{weight:80,reps:5}],volume:400}],totalVolume:400}
];
__store['tlog']=JSON.stringify(D.tlog);
delete __store[tlaKey(2,tlaHalf(oldD))];
_tlogArchRan=false;
archiveTlog();
drain();
var mainAfter=JSON.parse(__store['tlog']);
ok('メインは直近のみ+スリム化',mainAfter.length===1&&mainAfter[0].id==='r9'&&!('prevEx'in mainAfter[0].results[0]));
var arch=JSON.parse(__store[tlaKey(2,tlaHalf(oldD))]||'[]');
ok('アーカイブへ移送+スリム化',arch.length===1&&arch[0].id==='o9'&&!('prevEx'in arch[0].results[0])&&!('note'in arch[0].results[0]));
ok('メモリ上のアーカイブにも反映',_tlogArch.some(function(l){return l.id==='o9';}));
ok('tlogAllで全件見える',tlogAll().length===4); // m1はメインから消えた(=store書き換えでD.tlog更新)…a1,a2,o9(arch)+r9(main)

if(__fail===0)print('ALL TLOG-ARCH-STAFF TESTS PASSED');else print(__fail+' TESTS FAILED');
