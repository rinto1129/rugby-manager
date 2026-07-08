// Phase 9-D: 試合スタッツ取込＋ランキング（staff/player 両対応・自動判別）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_mstat.js
//       jsc dev/prelude.js /tmp/player.js dev/test_mstat.js
// 仕様（プランPhase 9-D節）:
//  staff : parseMstatGrid/TSV=固定列プリセット・データ開始後の非採用行で打ち切り / mstatCommit=msr_<id>直set→ms索引svSafeUpdate(冪等)→gmap学習 / msLoadRows / msDelSession
//  player: msAggValues=tkl/carry/lb合算・成功率Σmade/Σatt×100(3本未満はnull) / RANK_EVENTS(src:'ms')4種目 / T.ranking 試合セッション/累計セレクタ
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eq(name,got,want){var e;if(typeof want==='number'&&typeof got==='number')e=Math.abs(got-want)<0.051;else e=(got===want);if(!e){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){for(var i=0;i<8;i++){if(typeof drainMicrotasks==='function')drainMicrotasks();}}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
alert=function(){};confirm=function(){return true;};
drain(); // 起動時のld()→go()チェーンを流しきる

var IS_STAFF=(typeof parseMstatGrid==='function');
var IS_PLAYER=(typeof msAggValues==='function');

// ============================================================
if(IS_STAFF){
  print('=== STAFF: 試合スタッツ取込エンジン ===');

  // ---- 0. SK/D 配線 ----
  print('--- SK/D ---');
  ok('SKにms',SK.ms==='rm_match_stats');
  ok('D.ms配列',Array.isArray(D.ms));

  // ---- 1. MS_COLS 列プリセット ----
  print('--- MS_COLS ---');
  eq('name列=1',MS_COLS.name,1);
  eq('tkl列=2',MS_COLS.tkl,2);
  eq('Dominate列=4',MS_COLS.tklD,4);
  eq('Miss列=7',MS_COLS.tklM,7);
  eq('carry列=9',MS_COLS.carry,9);
  eq('lb列=10',MS_COLS.lb,10);
  eq('passM列=13',MS_COLS.passM,13);

  // ---- 2. parseMstatGrid（実レイアウト再現） ----
  print('--- parseMstatGrid ---');
  // 列: No/名前/tkl/pct/D/G/P/Miss/Steal/carry/LB/Beaten/Pass+/Pass-
  function mrow(no,name,tkl,pct,d,g,p,miss,steal,carry,lb,beaten,pp,pm){
    return [no,name,tkl,pct,d,g,p,miss,steal,carry,lb,beaten,pp,pm];
  }
  var hdr=['No','名前','タックル','成功%','Dominate','Good','Passive','Miss','Steal','キャリー','LB','Beaten','Pass+','Pass-'];
  var grid=[
    hdr,
    mrow(1,'宮本',8,'75%',3,2,1,2,1,10,2,1,15,1),   // made=6 att=8 →75%
    mrow(7,'田中',4,'100%',2,2,0,0,0,6,1,0,8,0),      // made=4 att=4 →100%
    mrow(23,'新人',0,'-',0,0,0,0,0,0,0,0,0,0),         // 全0（実名）→採用される
    [], // 空行 → データ開始後なので打ち切り
    mrow(99,'合計',12,'',5,4,1,2,1,16,3,1,23,1)        // 打ち切り後なので拾わない（"合計"はSTOPNAMEでもある）
  ];
  var pm=parseMstatGrid(grid);
  eq('採用行数=3',pm.rows.length,3);
  ok('データ開始後の空行で打ち切り',/^row/.test(pm.stopped));
  eq('宮本 no',pm.rows[0].no,1);
  eq('宮本 tkl',pm.rows[0].tkl,8);
  eq('宮本 tklD',pm.rows[0].tklD,3);
  eq('宮本 tklG',pm.rows[0].tklG,2);
  eq('宮本 tklP',pm.rows[0].tklP,1);
  eq('宮本 tklM',pm.rows[0].tklM,2);
  eq('宮本 carry',pm.rows[0].carry,10);
  eq('宮本 lb',pm.rows[0].lb,2);
  eq('宮本 passP',pm.rows[0].passP,15);
  eq('宮本 passM',pm.rows[0].passM,1);
  ok('成功%(pct)は保存しない',pm.rows[0].pct===undefined);
  eq('田中 tkl',pm.rows[1].tkl,4);
  eq('全0の実名も採用(tkl0)',pm.rows[2].tkl,0);
  eq('先頭は宮本(ヘッダ行は採用しない)',pm.rows[0].name,'宮本');
  eq('空グリッドは0行',parseMstatGrid([]).rows.length,0);

  // ---- 3. parseMstatTSV ----
  print('--- parseMstatTSV ---');
  var tsv=['No\t名前\tタックル\t成功%\tD\tG\tP\tMiss\tSteal\tキャリー\tLB\tBeaten\tPass+\tPass-',
    '5\t黒岩\t6\t83%\t2\t2\t1\t1\t0\t8\t1\t0\t10\t0',
    '9\t平山\t3\t66%\t1\t1\t0\t1\t0\t4\t0\t1\t6\t2'].join('\n');
  var pt=parseMstatTSV(tsv);
  eq('TSV採用行数=2',pt.rows.length,2);
  eq('TSV 黒岩 tkl',pt.rows[0].tkl,6);
  eq('TSV 平山 tklM',pt.rows[1].tklM,1);
  eq('TSV 平山 no',pt.rows[1].no,9);

  // ---- 4. mstatCommit（保存・冪等・学習） ----
  print('--- mstatCommit ---');
  var players=[{id:1,name:'宮本 偉申'},{id:2,name:'田中 太郎'},{id:3,name:'古賀 一'},{id:4,name:'古賀 渉斗'}];
  __store={};D.ms=[];D.gmap=[];_msrCache={};D.p=players;
  var committed=null;
  var matched=[
    {name:'宮本',key:'宮本',row:pm.rows[0],pid:1,status:'auto',cand:[]},
    {name:'田中',key:'田中',row:pm.rows[1],pid:2,status:'auto',cand:[]},
    {name:'知らない',key:'知らない',row:pm.rows[2],pid:null,status:'none',cand:[]} // pid null→保存対象外
  ];
  mstatCommit(matched,{id:555,date:'2026-07-04',label:'vs 福岡工大',team:'A'},function(id,n){committed={id:id,n:n};});
  drain();
  ok('onDone発火',committed!==null);
  eq('保存人数=2(pid確定のみ)',committed&&committed.n,2);
  ok('msr_555がstoreに存在',__store['msr_555']!=null);
  var saved=JSON.parse(__store['msr_555']||'[]');
  eq('msr_555 行数=2',saved.length,2);
  eq('msr_555 先頭pid=1',saved[0].pid,1);
  eq('msr_555 先頭tkl=8',saved[0].tkl,8);
  eq('msr_555 先頭tklD=3',saved[0].tklD,3);
  eq('msr_555 先頭carry=10',saved[0].carry,10);
  ok('msr行にkindやpctは持たない',saved[0].kind===undefined&&saved[0].pct===undefined);
  eq('D.ms 索引1件',D.ms.length,1);
  eq('ms.id=555',D.ms[0].id,555);
  eq('ms.n=2',D.ms[0].n,2);
  eq('ms.date',D.ms[0].date,'2026-07-04');
  eq('ms.label',D.ms[0].label,'vs 福岡工大');
  eq('ms.team',D.ms[0].team,'A');
  ok('ms索引にkindは無い（常に試合）',D.ms[0].kind===undefined);
  // gmap学習: 宮本→1, 田中→2
  var nm=gpsNameMap();
  eq('gmap学習 宮本→1',nm['宮本'],1);
  eq('gmap学習 田中→2',nm['田中'],2);
  // 冪等: 同id再コミット→ms重複しない
  mstatCommit(matched,{id:555,date:'2026-07-04',label:'vs 福岡工大',team:'A'},function(){});
  drain();
  eq('冪等: 同id再コミットでもmsは1件',D.ms.length,1);

  // gmap学習ガード（曖昧姓は学習しない）
  print('--- gmap学習ガード（曖昧姓・GPSと共通） ---');
  __store={};D.ms=[];D.gmap=[];_msrCache={};D.p=players; // 古賀×2
  var amb=[{name:'古賀',key:'古賀',row:pm.rows[0],pid:3,status:'manual',cand:[3,4]}];
  mstatCommit(amb,{id:556,date:'2026-07-05',label:'',team:''},function(){});
  drain();
  ok('曖昧姓(古賀×2)はgmapに学習しない',gpsNameMap()['古賀']===undefined);
  eq('曖昧姓の行自体は保存される(1名)',D.ms[0].n,1);

  // ---- 5. msLoadRows / msDelSession ----
  print('--- msLoadRows / msDelSession ---');
  delete _msrCache[555];
  __store={};D.ms=[];_msrCache={};D.p=players;
  mstatCommit(matched,{id:777,date:'2026-07-04',label:'x',team:''},function(){});
  drain();
  delete _msrCache[777];
  var loaded=null;
  msLoadRows(777,function(rows){loaded=rows;});
  drain();
  ok('msLoadRowsで復元',loaded&&loaded.length===2);
  eq('復元先頭pid',loaded[0].pid,1);
  msDelSession(777);
  drain();
  eq('削除後ms=0件',D.ms.length,0);
  eq('msr_777は空化',__store['msr_777'],'[]');
  ok('キャッシュも破棄',_msrCache[777]===undefined);

  // ---- 6. gpsSetType の種別リセット（レビュー確定所見の回帰ガード：match→gps でkindが試合のまま残らない）----
  print('--- gpsSetType 種別リセット（回帰ガード） ---');
  var __vgps=V.gps; V.gps=function(){}; // 全画面描画をスタブ（状態遷移だけ検証）
  window._gpsWiz=null; gpsWizInit(true);
  eq('初期kind=practice',window._gpsWiz.meta.kind,'practice');
  gpsSetType('match');
  eq('match選択でkind=match',window._gpsWiz.meta.kind,'match');
  gpsSetType('gps');
  eq('gpsに戻すとkind=practiceへ復帰(試合のまま残らない)',window._gpsWiz.meta.kind,'practice');
  V.gps=__vgps;

  print(__fail===0?'\nALL PASS (test_mstat STAFF)':'\n'+__fail+' FAILED (test_mstat STAFF)');
}

// ============================================================
if(IS_PLAYER){
  print('=== PLAYER: 試合スタッツ集計＋ランキング ===');

  // ---- 1. RANK_EVENTS に src:'ms' 4種目 ----
  print('--- msAggValues 純関数 ---');
  // 単一試合: made=D+G+P, att=made+Miss
  var single=[[
    {pid:1,no:1,tkl:8,tklD:3,tklG:2,tklP:1,tklM:2,carry:10,lb:2},   // made=6 att=8 →75%
    {pid:2,no:7,tkl:5,tklD:4,tklG:0,tklP:1,tklM:0,carry:6,lb:1},    // made=5 att=5 →100%
    {pid:3,no:9,tkl:2,tklD:1,tklG:0,tklP:0,tklM:1,carry:3,lb:0}     // made=1 att=2 →3本未満で除外
  ]];
  var t1=msAggValues(single,'msTkl');
  eq('単一 msTkl p1=8(源のtkl)',t1[1],8);
  eq('単一 msTkl p2=5',t1[2],5);
  eq('単一 msCarry p1=10',msAggValues(single,'msCarry')[1],10);
  eq('単一 msLb p2=1',msAggValues(single,'msLb')[2],1);
  var pct1=msAggValues(single,'msTklPct');
  eq('成功率 p1=75.0(6/8)',pct1[1],75);
  eq('成功率 p2=100.0(5/5)',pct1[2],100);
  ok('成功率 p3=att2で3本未満→除外(null)',pct1[3]===null);

  // 累計: p1が2試合。tkl合算、成功率=Σmade/Σatt
  var cum=[
    [{pid:1,tkl:8,tklD:3,tklG:2,tklP:1,tklM:2,carry:10,lb:2}],   // made6 att8
    [{pid:1,tkl:4,tklD:1,tklG:1,tklP:0,tklM:0,carry:5,lb:1}]     // made2 att2
  ];
  eq('累計 msTkl p1=12(合算)',msAggValues(cum,'msTkl')[1],12);
  eq('累計 msCarry p1=15(合算)',msAggValues(cum,'msCarry')[1],15);
  eq('累計 msLb p1=3(合算)',msAggValues(cum,'msLb')[1],3);
  // 成功率累計 = (6+2)/(8+2)=8/10=80.0（各試合平均(75+100)/2=87.5ではない＝分子分母合算で判定）
  eq('累計 成功率 p1=80.0(Σmade/Σatt・平均でない)',msAggValues(cum,'msTklPct')[1],80);
  // 3本以上ゲート: 累計attがちょうど3で有効・made=2→66.7%
  var gate=[[{pid:5,tkl:3,tklD:1,tklG:1,tklP:0,tklM:1,carry:0,lb:0}]]; // made2 att3
  eq('成功率 att=3ちょうど→有効66.7%',msAggValues(gate,'msTklPct')[5],66.7);
  // pid null は無視
  ok('pid null 行は無視',Object.keys(msAggValues([[{pid:null,tkl:9,tklD:9,tklG:0,tklP:0,tklM:0}]],'msTkl')).length===0);

  // ---- 2. T.ranking 統合 ----
  print('--- T.ranking 試合スタッツ統合 ---');
  D.p=[
    {id:1,name:'突 太郎',position:'FL',year:2},
    {id:2,name:'刺 次郎',position:'No.8',year:3},
    {id:3,name:'運 三郎',position:'CTB',year:4},
    {id:4,name:'控 四郎',position:'PR',year:1}
  ];
  D.ph=[{id:11,pid:1,date:'2026-06-01',squat:150}];
  D.msess=[];D.bc=[];D.f=[];D.std=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.tlog=[];D.gs=[];
  function __recent(daysAgo){var d=new Date(todayStr());d.setDate(d.getDate()-daysAgo);return toDateStr(d);}
  D.ms=[
    {id:201,date:__recent(2),label:'vs 工大A',team:'A',ts:2000},
    {id:202,date:__recent(30),label:'vs 産大',team:'A',ts:1000}
  ];
  _msrCache[201]=[
    {pid:1,tkl:12,tklD:5,tklG:4,tklP:1,tklM:2,carry:8,lb:2},  // made10 att12 →83.3%
    {pid:2,tkl:9, tklD:3,tklG:3,tklP:0,tklM:3,carry:12,lb:4}, // made6 att9 →66.7% carryトップ
    {pid:3,tkl:8, tklD:4,tklG:2,tklP:0,tklM:2,carry:5,lb:1},  // made6 att8 →75.0%
    {pid:4,tkl:2, tklD:1,tklG:0,tklP:0,tklM:1,carry:3,lb:0}   // made1 att2→3本未満で成功率除外
  ];
  _msrCache[202]=[
    {pid:1,tkl:6,tklD:2,tklG:2,tklP:0,tklM:2,carry:4,lb:0},
    {pid:2,tkl:4,tklD:2,tklG:1,tklP:0,tklM:1,carry:6,lb:2}
  ];

  myPid=1;window._rkFO=false;
  window._rkS={ev:'msTkl',mssess:201};
  T.ranking();
  var m1=document.getElementById('main').innerHTML;
  ok('試合スタッツ種目ピルが並ぶ',has(m1,'タックル')&&has(m1,'キャリー')&&has(m1,'ラインブレイク'));
  ok('試合・期間セレクタ表示',has(m1,'試合・期間')&&has(m1,'gps-chips'));
  ok('累計チップ(直近30日/90日)表示',has(m1,'直近30日累計')&&has(m1,'直近90日累計'));
  ok('試合ラベルがチップに出る',has(m1,'vs 工大A'));
  ok('試合スタッツでは測定会セレクタを出さない',!has(m1,'>測定会<'));
  // 単一201 msTkl降順: p1(12)>p2(9)>p3(2)、p4は0でも値あり=表示（tkl0は集計対象・null化しない）
  var __pf=m1.indexOf('rkp-col first');
  ok('単一201 msTkl 1位=突 太郎(12)',__pf>=0&&m1.substring(__pf,__pf+700).indexOf('突 太郎')>=0);
  ok('スピードテーマ装飾クラス(gps-spd)適用',has(m1,'gps-spd'));
  ok('YOUR RANK(自分=突太郎)チップ',has(m1,'YOUR RANK'));

  print('--- 種目切替: 成功率(3本以上のみ) ---');
  rankSF('msTklPct');
  var m2=document.getElementById('main').innerHTML;
  // 単一201 成功率: p1=83.3, p3=75.0, p2=66.7（3人・表彰台）、p4=att2で除外 → 1位=突太郎
  var __pf2=m2.indexOf('rkp-col first');
  ok('成功率1位=突 太郎(83.3%)',__pf2>=0&&m2.substring(__pf2,__pf2+700).indexOf('突 太郎')>=0);
  ok('成功率% 表示',has(m2,'83.3 %')||has(m2,'83.3%'));
  ok('att<3(控四郎)は成功率ランキングから除外',!has(m2,'控 四郎'));

  print('--- 種目切替: キャリー ---');
  rankSF('msCarry');
  var m3=document.getElementById('main').innerHTML;
  // 単一201 carry: p2=12>p1=8>p3=5 → 1位=刺次郎
  var __pf3=m3.indexOf('rkp-col first');
  ok('キャリー1位=刺 次郎(12)',__pf3>=0&&m3.substring(__pf3,__pf3+700).indexOf('刺 次郎')>=0);

  print('--- 累計(r90)で合算集計 ---');
  rankSF('msTkl');rankMSess('r90');
  var m4=document.getElementById('main').innerHTML;
  // 累計 msTkl: p1=18, p2=13 → 1位=突太郎
  var __pf4=m4.indexOf('rkp-col first');
  ok('累計r90 msTkl 1位=突 太郎(18)',__pf4>=0&&m4.substring(__pf4,__pf4+700).indexOf('突 太郎')>=0);
  ok('累計r90: p1,p2表示',has(m4,'突 太郎')&&has(m4,'刺 次郎'));

  print('--- 累計成功率(Σmade/Σatt) ---');
  rankSF('msTklPct');
  var m5=document.getElementById('main').innerHTML;
  // 累計 p1:made(10+4)=14 att(12+6)=18 →77.8%, p3:made6 att8 →75.0%, p2:made(6+3)=9 att(9+4)=13 →69.2% → 1位=突太郎
  var __pf5=m5.indexOf('rkp-col first');
  ok('累計成功率1位=突 太郎(77.8%)',__pf5>=0&&m5.substring(__pf5,__pf5+700).indexOf('突 太郎')>=0);
  ok('累計成功率 77.8%表示',has(m5,'77.8 %')||has(m5,'77.8%'));

  print('--- ウエイト(squat)へ戻すと試合スタッツUIは消える ---');
  rankSF('squat');
  var m6=document.getElementById('main').innerHTML;
  ok('squatで例外なく描画',has(m6,'ランキング')&&has(m6,'スクワット'));
  ok('squatでは試合・期間セレクタ非表示',!has(m6,'試合・期間'));
  rankSF('msTkl');

  print('--- 試合スタッツが空(D.ms=[]) ---');
  D.ms=[];window._rkS={ev:'msTkl'};
  T.ranking();
  var m7=document.getElementById('main').innerHTML;
  ok('空: データがありません',has(m7,'データがありません'));
  ok('空: 案内文(試合スタッツがまだありません)',has(m7,'試合スタッツがまだありません'));
  ok('空: 表彰台は出さない',!has(m7,'rkp-podium'));

  // GPS種目との独立性: gsess/mssessが別々に永続化される
  print('--- GPS/試合スタッツのセッション永続化が独立 ---');
  D.ms=[{id:201,date:__recent(2),label:'vs 工大A',team:'A',ts:2000}];
  D.gs=[{id:101,date:__recent(2),kind:'match',label:'GPS試合',ts:2000}];
  _grCache[101]=[{pid:1,min:60,dist:6000,wr:100,hsr:500,spr:200,sprN:3,max:8}];
  window._rkS={ev:'msTkl',gsess:101,mssess:201};
  T.ranking();
  ok('persistRkにgsess/mssess両方保持',window._rkS.gsess!=null&&window._rkS.mssess!=null);

  print(__fail===0?'\nALL PASS (test_mstat PLAYER)':'\n'+__fail+' FAILED (test_mstat PLAYER)');
}

if(!IS_STAFF&&!IS_PLAYER)print('SKIP: 試合スタッツ関数が見つかりません');
if(__fail>0)throw new Error(__fail+' test(s) failed');
