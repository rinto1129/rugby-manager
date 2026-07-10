// Phase 5: 測定会の判定統一(msessStatus) と 締切(closeMSess/reopenMSess) の模擬実行テスト（staff）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eqn(name,got,want){var o=(typeof want==='number'&&typeof got==='number')?Math.abs(got-want)<0.0051:(got===want);if(!o){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function sortNums(a){return a.slice().sort(function(x,y){return x-y;});}
function sameSet(name,got,want){var g=sortNums(got).join(','),w=sortNums(want).join(',');if(g!==w){__fail++;print('  NG '+name+': got=['+g+'] want=['+w+']');}else print('  ok '+name+' = ['+g+']');}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
var __confirmAnswer=true;confirm=function(m){return __confirmAnswer;};
var __toasts=[];toast=function(m){__toasts.push(String(m));};

// ---- テストデータ ----
D.p=[{id:1,name:'p1',position:'PR'},{id:2,name:'p2',position:'HO'},{id:3,name:'p3',position:'LO'},{id:4,name:'p4',position:'SH'},{id:5,name:'p5',position:'FL'},{id:6,name:'p6',position:'FB'}];
D.ph=[
  {id:1,pid:1,date:'2026-06-16',msessId:'sA',squat:150},   // sA done（msessId一致）
  {id:2,pid:2,date:'2026-06-18',squat:140},                 // sA done（msessId無し＆期間内fallback）
  {id:3,pid:5,date:'2026-06-17',msessId:'sA',squat:120},    // sA done（skipより優先）
  {id:4,pid:1,date:'2026-06-25',msessId:'sB',bronco:300},   // sB done（bronco有）
  {id:5,pid:2,date:'2026-06-25',msessId:'sB',squat:135},    // sB: bronco無し→未入力扱い
  {id:6,pid:3,date:'2026-06-25',bronco:280}                 // sB done（fallback＋bronco有）
];
D.phskip=[
  {pid:3,date:'2026-06-19',msessId:'sA',reason:'怪我'},     // sA skip
  {pid:4,date:'2026-06-16',reason:'欠席'},                   // sA skip（msessId無し＆期間内fallback）
  {pid:5,date:'2026-06-18',msessId:'sA',reason:'二重'},     // p5はdone→skipから除外される
  {pid:4,date:'2026-06-25',msessId:'sB',reason:'病気'}      // sB skip
];
D.msess=[
  {id:'sA',name:'第1回MAX測定',startDate:'2026-06-15',endDate:'2026-06-20'},
  {id:'sB',name:'ブロンコ測定会',fromCalType:'bronco_measure',startDate:'2026-06-25',endDate:'2026-06-25'}
];
D.std=[];D.f=[];D.bc=[];

print('--- msessStatus: 非ブロンコ測定会 sA（fallback＆done優先） ---');
var sA=D.msess[0];
var stA=msessStatus(sA);
ok('sA isBronco=false',stA.isBronco===false);
sameSet('sA done={1,2,5}',stA.donePids,[1,2,5]);
sameSet('sA skip={3,4}',stA.skippedPids,[3,4]);
sameSet('sA missed={6}',stA.missedPids,[6]);
eqn('sA 3分割合計=全選手6',stA.donePids.length+stA.skippedPids.length+stA.missedPids.length,6);

print('--- msessStatus: ブロンコ測定会 sB（bronco!=nullのみ入力済み） ---');
var sB=D.msess[1];
var stB=msessStatus(sB);
ok('sB isBronco=true',stB.isBronco===true);
sameSet('sB done={1,3}',stB.donePids,[1,3]);
sameSet('sB skip={4}',stB.skippedPids,[4]);
sameSet('sB missed={2,5,6}(p2はbronco無しで未入力)',stB.missedPids,[2,5,6]);
eqn('sB 3分割合計=全選手6',stB.donePids.length+stB.skippedPids.length+stB.missedPids.length,6);

print('--- 名前に「ブロンコ」でもブロンコ系判定（手動作成の測定会用） ---');
var stName=msessStatus({id:'sX',name:'6月 ブロンコ計測',startDate:'2026-06-25',endDate:'2026-06-25'});
ok('名前判定 isBronco=true',stName.isBronco===true);

print('--- V.msess 一覧: 件数がmsessStatusと一致（一覧⇔詳細の不一致バグ解消） ---');
V.msess();
var hl=document.getElementById('main-ct').innerHTML;
ok('sA 入力済3名',has(hl,'入力済: 3名'));
ok('sA 測定なし2名',has(hl,'測定なし: 2名'));
ok('sA 未入力1名',has(hl,'未入力: 1名'));
ok('sB 入力済2名',has(hl,'入力済: 2名'));
ok('sB 測定なし1名',has(hl,'測定なし: 1名'));
ok('sB 未入力3名',has(hl,'未入力: 3名'));
ok('未締切なので締切済バッジ無し',!has(hl,'締切済'));

print('--- goMSessDetail 詳細: 件数一致＋締切ボタン表示 ---');
goMSessDetail('sA');
var hd=document.getElementById('main-ct').innerHTML;
ok('詳細 入力済み3名',has(hd,'入力済み（3名）'));
ok('締切ボタン(入力を締め切る)',has(hd,'入力を締め切る')&&has(hd,"closeMSess('sA')"));
ok('未締切なので解除ボタン無し',!has(hd,'締切を解除'));

print('--- closeMSess: closed/closedAt を付与 ---');
__store['msess']=JSON.stringify(D.msess);
__toasts.length=0;__confirmAnswer=true;
closeMSess('sA');
drain();
var sAafter=D.msess.find(function(x){return x.id==='sA';});
ok('sA closed=true',sAafter.closed===true);
ok('sA closedAt付与',!!sAafter.closedAt);
ok('締切トースト',__toasts.some(function(t){return t.indexOf('締め切りました')>=0;}));

print('--- 締切後の詳細: 締切済バッジ＋解除ボタンに切替 ---');
goMSessDetail('sA');
var hd2=document.getElementById('main-ct').innerHTML;
ok('締切済バッジ',has(hd2,'締切済'));
ok('解除ボタン(締切を解除)',has(hd2,'締切を解除')&&has(hd2,"reopenMSess('sA')"));
ok('締切後は締め切るボタン無し',!has(hd2,'入力を締め切る'));

print('--- 一覧でも締切済バッジ ---');
V.msess();
ok('一覧に締切済',has(document.getElementById('main-ct').innerHTML,'締切済'));

print('--- reopenMSess: closed/closedAt を削除 ---');
__store['msess']=JSON.stringify(D.msess);
__toasts.length=0;
reopenMSess('sA');
drain();
var sAre=D.msess.find(function(x){return x.id==='sA';});
ok('sA closed解除',!sAre.closed);
ok('sA closedAt解除',!sAre.closedAt);
ok('解除トースト',__toasts.some(function(t){return t.indexOf('締切を解除')>=0;}));

print('--- キャンセル時は締め切らない ---');
__store['msess']=JSON.stringify(D.msess);
__confirmAnswer=false;
closeMSess('sA');
drain();
ok('キャンセルでclosedにならない',!D.msess.find(function(x){return x.id==='sA';}).closed);
__confirmAnswer=true;

print('--- getCurrentMSess: 締切除外＋期間中優先＋猶予14日＋未来除外（player/staff md5一致の共通関数） ---');
var _origTodayStr=todayStr;
todayStr=function(){return '2026-07-01';}; // 固定today（getCurrentMSess/grace計算の基準）
var mA={id:'A',name:'A',startDate:'2026-06-25',endDate:'2026-06-28'};              // 猶予中(end+14=07-12>=today)
var mB={id:'B',name:'B',startDate:'2026-06-30',endDate:'2026-07-03'};              // 期間中
var mC={id:'C',name:'C',startDate:'2026-06-01',endDate:'2026-06-10'};              // 猶予超過(end+14=06-24<today)
var mD={id:'D',name:'D',startDate:'2026-07-05',endDate:'2026-07-06'};              // 未来
var mE={id:'E',name:'E',startDate:'2026-06-29',endDate:'2026-07-02',closed:true};  // 期間中だが締切
D.msess=[mA,mB,mC,mD,mE];
var cur=getCurrentMSess();
ok('期間中Bを優先（締切E/猶予超過C/未来D/猶予Aより）',!!cur&&cur.id==='B');
D.msess=[mA,mC,mD,mE];
var cur2=getCurrentMSess();
ok('期間中なし→猶予中Aを採用',!!cur2&&cur2.id==='A');
D.msess=[mE];ok('締切済のみ→null',getCurrentMSess()===null);
D.msess=[mC];ok('猶予超過のみ→null',getCurrentMSess()===null);
D.msess=[mD];ok('未来のみ→null',getCurrentMSess()===null);
D.msess=[];ok('測定会なし→null',getCurrentMSess()===null);
var a1={id:'a1',name:'a1',startDate:'2026-06-25',endDate:'2026-06-26'}; // 猶予
var a2={id:'a2',name:'a2',startDate:'2026-06-27',endDate:'2026-06-28'}; // 猶予・startDate新
D.msess=[a1,a2];ok('猶予同順位→startDate最新a2',getCurrentMSess().id==='a2');
var b1={id:'b1',name:'b1',startDate:'2026-06-29',endDate:'2026-07-03'}; // 期間中
var b2={id:'b2',name:'b2',startDate:'2026-06-30',endDate:'2026-07-02'}; // 期間中・startDate新
D.msess=[b1,b2];ok('期間中同順位→startDate最新b2',getCurrentMSess().id==='b2');
todayStr=_origTodayStr;

print(__fail===0?'ALL MSESS-CLOSE TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('msess-close tests failed');
