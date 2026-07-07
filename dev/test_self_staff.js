// Phase 3: 自主トレ記録のstaff側テスト（バッジ+fitness表示+集計無傷）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_self_staff.js
// 仕様: renderTrainingStatus/renderTrainTab/trSessDetailに「自主」バッジ+fitness表示。
//       種目推移(exAgg/getExSeries)は自主ウエイトを自動包含（=完全統合が仕様）。
//       fitnessレコードはresults:[]+totalVolume:0の不変条件により既存集計が無傷で通る。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function agoS(n){return toDateStr(new Date(Date.now()-n*86400000));}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

var TODAY=todayStr();
D.p=[{id:1,name:'選手A',position:'PR',year:2}];
D.f=[];D.i=[];D.ph=[];D.e1rm=[];
D.tmenu=[{id:102,name:'チームメニュー',scope:'all',exercises:[{name:'スクワット',estBase:'squat',sets:3,reps:5,rir:2}]}];
_tlogArchLoaded=true;
D.tlog=[
  // チーム記録
  {id:9001,pid:1,menuId:102,date:agoS(3),ts:'2026-07-04T10:00:00.000Z',
   results:[{exName:'スクワット',estBase:'squat',sets:[{weight:100,reps:5,rir:2}],volume:500}],totalVolume:500},
  // 自主ウエイト
  {id:9002,pid:1,menuId:null,kind:'self',date:agoS(2),ts:'2026-07-05T10:00:00.000Z',
   results:[{exName:'ベンチプレス',estBase:'bench',sets:[{weight:80,reps:8,rir:2}],volume:640,addedByPlayer:true}],totalVolume:640},
  // フィットネス（不変条件: results:[]+totalVolume:0）
  {id:9003,pid:1,menuId:null,kind:'self',date:agoS(1),ts:'2026-07-06T10:00:00.000Z',
   fitness:{ftype:'ランニング',minutes:30,km:5.2,rpe:7,note:'朝ラン'},results:[],totalVolume:0},
  // 欠席
  {id:9004,pid:1,menuId:102,date:TODAY,ts:new Date().toISOString(),absent:true,absentReason:'体調不良',results:[],totalVolume:0}
];

print('--- renderTrainTab: セッション履歴のバッジ+fitness表示 ---');
window._dtPid=1;window._trEx=null;window._trMetric=null;
var okTab=true;
try{renderTrainTab();}catch(e){okTab=false;print('  exception: '+e);}
ok('renderTrainTab完走（self/fitness混在で例外なし）',okTab);
var h5=__els['dt5'].innerHTML;
ok('自主バッジ表示',has(h5,'>自主<'));
ok('自主ウエイトの名称=自主トレ（ウエイト）',has(h5,'自主トレ（ウエイト）'));
ok('fitness行: 種類+時間表示',has(h5,'ランニング')&&has(h5,'30分'));
ok('fitness行: 距離/RPEも表示',has(h5,'5.2km')&&has(h5,'RPE7'));
ok('fitness行: 0kg表示にしない',!has(h5,'ランニング</span><span style="font-size:12px;color:var(--text-secondary);margin-right:8px">0種目'));
ok('チーム行は従来表示（種目数+kg）',has(h5,'チームメニュー')&&has(h5,'1種目')&&has(h5,'500kg'));
ok('欠席行は従来表示',has(h5,'欠席'));
// 種目推移: 自主ウエイトの種目が候補に自動包含（完全統合）
ok('種目推移セレクタに自主種目が入る',has(h5,'ベンチプレス'));
var series=getExSeries(1,'ベンチプレス');
ok('getExSeries: 自主ウエイトを包含',series.length===1&&series[0].vol===640&&series[0].topW===80);
var seriesT=getExSeries(1,'スクワット');
ok('getExSeries: チーム記録も従来どおり',seriesT.length===1&&seriesT[0].vol===500);

print('--- trSessDetail: fitnessの展開内容 ---');
var fd=trSessDetail(D.tlog[2]);
ok('fitness詳細: 種類',has(fd,'ランニング'));
ok('fitness詳細: 時間/距離/RPE',has(fd,'時間 30分')&&has(fd,'距離 5.2km')&&has(fd,'RPE 7'));
ok('fitness詳細: メモ',has(fd,'朝ラン'));
ok('fitness詳細: 自主バッジ',has(fd,'>自主<'));
var wd=trSessDetail(D.tlog[1]);
ok('自主ウエイト詳細: 従来のセット表示',has(wd,'ベンチプレス')&&has(wd,'80kg×8'));

print('--- renderTrainingStatus: 実施状況カード ---');
var okSt=true,hs='';
try{hs=renderTrainingStatus();}catch(e){okSt=false;print('  exception: '+e);}
ok('renderTrainingStatus完走',okSt);
ok('実施カード: 自主バッジ',has(hs,'>自主<'));
ok('実施カード: fitnessは種類+時間表示',has(hs,'ランニング')&&has(hs,'30分'));
ok('実施カード: fitnessに「0種目 ・ ボリューム 0kg」を出さない',!has(hs,'0種目 ・ ボリューム 0kg'));
ok('実施カード: 自主ウエイトは種目数+kg表示',has(hs,'1種目 ・ ボリューム 640kg'));
ok('実施カード: 欠席カードは従来どおり',has(hs,'欠席'));

print('--- 既存集計の無傷確認 ---');
var okAgg=true;
try{
  getConsecutiveSkipsStaff(1);
  getCompareEx(1,'スクワット',TODAY,'prev',null,null);
  getExEstBase(1,'ベンチプレス');
}catch(e){okAgg=false;print('  exception: '+e);}
ok('集計関数群にself/fitnessを食わせて例外ゼロ',okAgg);
ok('getExEstBase: 自主追加種目のestBase取得',getExEstBase(1,'ベンチプレス')==='bench');

if(__fail===0)print('ALL SELF-STAFF TESTS PASSED');else print(__fail+' TESTS FAILED');
