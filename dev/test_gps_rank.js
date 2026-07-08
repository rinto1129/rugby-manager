// Phase 9-B: player ランキングのGPS種目（src:'gs'）テスト
// 純関数（gpsWindowCutoff/gpsSelSessions/gpsAggValues）＋ T.ranking 統合（セッション/累計セレクタ・0分除外・加重wr）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

// ---- 1. 純関数: gpsWindowCutoff ----
print('--- gpsWindowCutoff ---');
ok('2026-07-09 -30日=2026-06-09',gpsWindowCutoff('2026-07-09',30)==='2026-06-09');
ok('2026-07-09 -90日=2026-04-10',gpsWindowCutoff('2026-07-09',90)==='2026-04-10');
ok('月跨ぎ 2026-03-05 -10日=2026-02-23',gpsWindowCutoff('2026-03-05',10)==='2026-02-23');

// ---- 2. 純関数: gpsSelSessions ----
print('--- gpsSelSessions ---');
var GS=[
  {id:1,date:'2026-07-08',kind:'match'},
  {id:2,date:'2026-06-20',kind:'practice'},
  {id:3,date:'2026-03-01',kind:'practice'}
];
ok('特定id選択=そのセッションのみ',gpsSelSessions(2,GS,'2026-07-09').length===1&&gpsSelSessions(2,GS,'2026-07-09')[0].id===2);
ok('存在しないid=空',gpsSelSessions(999,GS,'2026-07-09').length===0);
var r30=gpsSelSessions('r30',GS,'2026-07-09');
ok('r30=直近30日は2件(7/8,6/20)',r30.length===2&&r30.some(function(s){return s.id===1;})&&r30.some(function(s){return s.id===2;}));
ok('r30に3/1は含まれない',!r30.some(function(s){return s.id===3;}));
var r90=gpsSelSessions('r90',GS,'2026-07-09');
ok('r90=直近90日は2件(7/8,6/20)・3/1は範囲外',r90.length===2&&!r90.some(function(s){return s.id===3;}));

// ---- 3. 純関数: gpsAggValues ----
print('--- gpsAggValues（単一/累計/0分除外/加重wr/max）---');
// 単一セッション: 距離降順=p3>p1>p2、p4は0分で除外
var single=[[
  {pid:1,min:60,dist:6000,wr:100,hsr:800,spr:300,sprN:5,max:8.5},
  {pid:2,min:60,dist:5000,wr:83,hsr:600,spr:200,sprN:3,max:9.0},
  {pid:3,min:60,dist:7000,wr:117,hsr:900,spr:400,sprN:7,max:7.0},
  {pid:4,min:0,dist:9999,wr:0,hsr:0,spr:0,sprN:0,max:0}
]];
var d1=gpsAggValues(single,'gpsDist');
ok('単一 dist p1=6000',d1[1]===6000);
ok('単一 dist p3=7000',d1[3]===7000);
ok('単一 0分のp4は除外(mapに無し)',d1[4]===undefined);
ok('単一 max p2=9.0',gpsAggValues(single,'gpsMaxSpd')[2]===9.0);
ok('単一 sprN p3=7',gpsAggValues(single,'gpsSprN')[3]===7);
ok('単一 wr p1=100(=6000/60)',gpsAggValues(single,'gpsWr')[1]===100);

// 累計: p1が2セッション+1つは0分。dist合算=10000、wr加重=10000/100=100、max=8.5
var cum=[
  [{pid:1,min:60,dist:6000,wr:100,hsr:800,spr:300,sprN:5,max:8.5},
   {pid:2,min:70,dist:6000,wr:86,hsr:700,spr:250,sprN:4,max:9.2}],
  [{pid:1,min:40,dist:4000,wr:100,hsr:500,spr:200,sprN:3,max:8.0},
   {pid:1,min:0,dist:9999,wr:0,hsr:9999,spr:9999,sprN:99,max:99}]  // 0分行=無視されるべき
];
ok('累計 dist p1=10000(合算)',gpsAggValues(cum,'gpsDist')[1]===10000);
ok('累計 hsr p1=1300(0分行を含めない)',gpsAggValues(cum,'gpsHsr')[1]===1300);
ok('累計 spr p1=500(0分行を含めない)',gpsAggValues(cum,'gpsSpr')[1]===500);
ok('累計 sprN p1=8(0分行を含めない)',gpsAggValues(cum,'gpsSprN')[1]===8);
ok('累計 max p1=8.5(最大・0分の99は無視)',gpsAggValues(cum,'gpsMaxSpd')[1]===8.5);
ok('累計 wr p1=100(加重平均10000/100)',gpsAggValues(cum,'gpsWr')[1]===100);
// 加重wrが単純平均と異なるケース: min違い
var cum2=[[{pid:9,min:100,dist:12000,wr:120,max:8}],[{pid:9,min:20,dist:1000,wr:50,max:8}]];
// 加重=13000/120=108.33→108.3、単純平均=(120+50)/2=85 → 加重で判定していることを確認
ok('加重wr=108.3(単純平均85でない)',gpsAggValues(cum2,'gpsWr')[9]===108.3);
// 0分のみの選手はマップに出ない
ok('0分のみの選手はnull(mapに無し)',gpsAggValues([[{pid:7,min:0,dist:5000,max:5}]],'gpsDist')[7]===undefined);

// ---- 4. T.ranking 統合 ----
print('--- T.ranking GPS統合 ---');
D.p=[
  {id:1,name:'ラン 太郎',position:'WTB',year:2},
  {id:2,name:'スピ 次郎',position:'FB',year:3},
  {id:3,name:'ディ 三郎',position:'No.8',year:4},
  {id:4,name:'休 四郎',position:'PR',year:1}
];
// 測定会系は空、フィジカルは squat のみ最小限（種目切替テスト用）
D.ph=[{id:11,pid:1,date:'2026-06-01',squat:150},{id:12,pid:2,date:'2026-06-01',squat:120}];
D.msess=[];D.bc=[];D.f=[];D.std=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.tlog=[];
// GPSセッション: dates=最近（r30/r90に必ず入るよう today 基準で生成）
function __recent(daysAgo){var d=new Date(todayStr());d.setDate(d.getDate()-daysAgo);return toDateStr(d);}
D.gs=[
  {id:101,date:__recent(1),kind:'practice',label:'直近練習',ts:2000},
  {id:102,date:__recent(3),kind:'match',label:'vs 工大',team:'A',ts:1000}
];
// gr_行データをキャッシュに直接投入（オンデマンド取得を同期化）
_grCache[101]=[
  {pid:1,min:60,dist:6000,wr:100,hsr:800,spr:300,sprN:5,max:8.5},
  {pid:2,min:60,dist:5000,wr:83,hsr:600,spr:200,sprN:3,max:9.0},
  {pid:3,min:60,dist:7000,wr:117,hsr:900,spr:400,sprN:7,max:7.0},
  {pid:4,min:0,dist:0,wr:0,hsr:0,spr:0,sprN:0,max:0}
];
_grCache[102]=[
  {pid:1,min:40,dist:4000,wr:100,hsr:500,spr:200,sprN:3,max:8.2},
  {pid:2,min:70,dist:6500,wr:93,hsr:700,spr:260,sprN:4,max:9.4}
];

myPid=1;window._rkFO=false;
window._rkS={ev:'gpsDist',gsess:101};
T.ranking();
var g1=document.getElementById('main').innerHTML;
ok('GPS種目ピル(走行距離)が並ぶ',has(g1,'走行距離')&&has(g1,'最高速度')&&has(g1,'ワークレート'));
ok('セッション/期間セレクタ表示',has(g1,'セッション・期間')&&has(g1,'gps-chips'));
ok('累計チップ(直近30日/90日)表示',has(g1,'直近30日累計')&&has(g1,'直近90日累計'));
ok('試合セッションに「試」プレフィックス',has(g1,'試 vs 工大'));
ok('GPS種目では測定会セレクタは折りたたみ内でも出さない(既定折りたたみで非表示)',!has(g1,'>測定会<'));
// 単一セッション101: dist降順 p3(7000)>p1(6000)>p2(5000)、p4は0分で除外
var __pf=g1.indexOf('rkp-col first');
ok('単一101: 1位=ディ 三郎(7000m)',__pf>=0&&g1.substring(__pf,__pf+700).indexOf('ディ 三郎')>=0);
ok('単一101: 休 四郎(0分)は除外',!has(g1,'休 四郎'));
ok('km表示(7.00 km)',has(g1,'7.00km')||has(g1,'7.00 km'));
ok('YOUR RANK(自分=ラン太郎)チップ',has(g1,'YOUR RANK'));
ok('スピードテーマ装飾クラス(gps-spd)適用',has(g1,'gps-spd'));

print('--- セッション切替: 累計(r90)で加重集計 ---');
rankGSess('r90');
var g2=document.getElementById('main').innerHTML;
// 累計 dist: p1=10000, p2=11500, p3=7000 → 1位=スピ次郎
var __pf2=g2.indexOf('rkp-col first');
ok('累計r90: 1位=スピ 次郎(11500m)',__pf2>=0&&g2.substring(__pf2,__pf2+700).indexOf('スピ 次郎')>=0);
ok('累計r90: 3人全員表示(p1,p2,p3)',has(g2,'ラン 太郎')&&has(g2,'スピ 次郎')&&has(g2,'ディ 三郎'));

print('--- 種目切替: 最高速度(km/h併記) ---');
rankSF('gpsMaxSpd');
var g3=document.getElementById('main').innerHTML;
// r90維持: max p1=8.5, p2=9.4, p3=7.0 → 1位=スピ次郎、9.4*3.6=33.8km/h
var __pf3=g3.indexOf('rkp-col first');
ok('最高速度1位=スピ 次郎',__pf3>=0&&g3.substring(__pf3,__pf3+700).indexOf('スピ 次郎')>=0);
ok('km/h表示(33.8km/h)',has(g3,'33.8km/h')||has(g3,'33.8 km/h'));

print('--- 種目切替: ワークレート(加重平均) ---');
rankSF('gpsWr');
var g4=document.getElementById('main').innerHTML;
// r90: p1 wr=(6000+4000)/(60+40)=100, p2=(5000+6500)/(60+70)=88.46→88.5, p3=7000/60=116.7
var __pf4=g4.indexOf('rkp-col first');
ok('ワークレート1位=ディ 三郎(116.7)',__pf4>=0&&g4.substring(__pf4,__pf4+700).indexOf('ディ 三郎')>=0);
ok('m/分表示',has(g4,'m/分'));

print('--- 種目切替: ウエイト(squat)へ戻すとGPS UIは消える ---');
rankSF('squat');
var g5=document.getElementById('main').innerHTML;
ok('squatで例外なく描画',has(g5,'ランキング')&&has(g5,'スクワット'));
ok('squatではGPSセッションセレクタ非表示',!has(g5,'セッション・期間'));
ok('squat 1位=ラン太郎(150kg)',g5.indexOf('ラン 太郎')<g5.indexOf('スピ 次郎'));
rankSF('gpsDist'); // GPSに戻す

print('--- GPSデータが空(D.gs=[])のとき ---');
D.gs=[];window._rkS={ev:'gpsDist'};
T.ranking();
var g6=document.getElementById('main').innerHTML;
ok('空: データがありません',has(g6,'データがありません'));
ok('空: 案内文(GPSデータがまだありません)',has(g6,'GPSデータがまだありません'));
ok('空: 表彰台は出さない',!has(g6,'rkp-podium'));

print(__fail===0?'ALL GPS_RANK TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('gps_rank tests failed');
