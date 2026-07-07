// Phase 3: 自主トレ記録のcoach側テスト（バッジ+fitness表示+KPIフィルタ）
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_self_coach.js
// 仕様: buildHistCoach/trSessDetailCにバッジ+fitness表示。
//       insTraining欠席率の分母・trained14(ホームKPI)・doneCount(トレーニングKPI)はkind!=='self'でフィルタ
//       （チーム練習参加の指標のため。レビューLow-6+欠席率分母）。週間ボリューム(teamVolume)は自主トレを包含のまま=完全統合。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function agoS(n){return toDateStr(new Date(Date.now()-n*86400000));}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

function resetD(){
  D.p=[];D.i=[];D.r=[];D.ph=[];D.a=[];D.f=[];D.md=[];D.wc=[];D.bc=[];D.ann=[];D.offday=[];D.cal=[];
  D.matchsel=[];D.tape=[];D.tapeslot=[];D.trainers=[];D.rtpl=[];D.rplan=[];D.rlog=[];D.phskip=[];
  D.rtest_tpl=[];D.rtest=[];D.msess=[];D.injcomm=[];D.chart=[];D.taperec=[];D.tmenu=[];D.tlog=[];
  D.texlist=[];D.e1rm=[];D.std=[];
}
resetD();
_tlogArchLoaded=true;
D.p=[{id:1,name:'選手A',position:'PR',year:2},{id:2,name:'選手B',position:'HO',year:3}];
D.tmenu=[{id:102,name:'チームメニュー',scope:'all',exercises:[{name:'スクワット',estBase:'squat'}]}];

// 直近14日: チーム実施2+チーム欠席1+自主ウエイト1+フィットネス1
D.tlog=[
  {id:9001,pid:1,menuId:102,date:agoS(3),ts:'2026-07-04T10:00:00.000Z',
   results:[{exName:'スクワット',estBase:'squat',sets:[{weight:100,reps:5,rir:2}],volume:500}],totalVolume:500},
  {id:9002,pid:2,menuId:102,date:agoS(3),ts:'2026-07-04T11:00:00.000Z',
   results:[{exName:'スクワット',estBase:'squat',sets:[{weight:120,reps:5,rir:2}],volume:600}],totalVolume:600},
  {id:9003,pid:1,menuId:102,date:agoS(2),ts:'2026-07-05T10:00:00.000Z',absent:true,absentReason:'体調不良',results:[],totalVolume:0},
  {id:9004,pid:1,menuId:null,kind:'self',date:agoS(2),ts:'2026-07-05T18:00:00.000Z',
   results:[{exName:'ベンチプレス',estBase:'bench',sets:[{weight:80,reps:8,rir:2}],volume:640,addedByPlayer:true}],totalVolume:640},
  {id:9005,pid:1,menuId:null,kind:'self',date:agoS(1),ts:'2026-07-06T10:00:00.000Z',
   fitness:{ftype:'ランニング',minutes:30,km:5.2,rpe:7,note:'朝ラン'},results:[],totalVolume:0}
];

// kpiタイルは値がdata-cnt="N"に入る。ラベル直前200文字からdata-cntを拾う
function kpiVal(h,label){
  var i=String(h).indexOf(label);
  if(i<0)return null;
  var m=String(h).slice(Math.max(0,i-260),i).match(/data-cnt="(\d+)"/g);
  if(!m||!m.length)return null;
  return parseInt(m[m.length-1].match(/\d+/)[0]);
}

print('--- ホームKPI: trained14はチーム練習のみ（Low-6） ---');
var okHome=true,hh='';
try{renderHomeView();hh=__els['main'].innerHTML;}catch(e){okHome=false;print('  exception: '+e);}
ok('renderHomeView完走（self/fitness混在で例外なし）',okHome);
ok('トレーニング記録（14日）=2（チーム実施のみ・自主2件を含めない）',kpiVal(hh,'トレーニング記録（14日）')===2);

print('--- トレーニングビューKPI: doneCountはチーム練習のみ（Low-6） ---');
var okTr=true,ht='';
try{renderTrainingView();ht=__els['main'].innerHTML;}catch(e){okTr=false;print('  exception: '+e);}
ok('renderTrainingView完走',okTr);
ok('実施記録（14日）=2（自主2件を含めない）',kpiVal(ht,'実施記録（14日）')===2);
ok('欠席（14日）=1（従来どおり）',kpiVal(ht,'欠席（14日）')===1);
// 週間ボリュームは自主トレを包含（完全統合が仕様）
var v7=teamVolume(agoS(6),todayStr());
ok('週間ボリューム: 自主ウエイトを包含（500+600+640）',v7===1740);

print('--- insTraining: 欠席率の分母からkind=selfを除外 ---');
// チーム6件（うち欠席2）+自主10件 → フィルタ無しなら2/16=13%で警告なし、フィルタ有りなら2/6=33%で警告
resetD();
D.p=[{id:1,name:'選手A',position:'PR',year:2}];
D.tmenu=[{id:102,name:'チームメニュー',scope:'all',exercises:[]}];
var logs=[];
for(var i=0;i<4;i++)logs.push({id:100+i,pid:1,menuId:102,date:agoS(3),ts:'2026-07-04T0'+i+':00:00.000Z',results:[{exName:'スクワット',sets:[{weight:100,reps:5}],volume:500}],totalVolume:500});
for(var j=0;j<2;j++)logs.push({id:200+j,pid:1,menuId:102,date:agoS(2),ts:'2026-07-05T0'+j+':00:00.000Z',absent:true,absentReason:'体調不良',results:[],totalVolume:0});
for(var k=0;k<10;k++)logs.push({id:300+k,pid:1,menuId:null,kind:'self',date:agoS(1),ts:'2026-07-06T0'+(k%10)+':00:00.000Z',fitness:{ftype:'ランニング',minutes:20},results:[],totalVolume:0});
D.tlog=logs;
var ins=insTraining();
var absIns=ins.filter(function(x){return has(x.t,'欠席率');})[0];
ok('欠席率考察が出る（分母=チーム6件→33%）',!!absIns&&has(absIns.t,'33%'));
ok('欠席件数の表記は2件/6件',!!absIns&&has(absIns.d,'欠席2件/6件'));

print('--- buildHistCoach: バッジ+fitness表示 ---');
resetD();
D.p=[{id:1,name:'選手A',position:'PR',year:2}];
D.tmenu=[{id:102,name:'チームメニュー',scope:'all',exercises:[]}];
D.tlog=[
  {id:9001,pid:1,menuId:102,date:agoS(3),ts:'2026-07-04T10:00:00.000Z',results:[{exName:'スクワット',sets:[{weight:100,reps:5,rir:2}],volume:500}],totalVolume:500},
  {id:9004,pid:1,menuId:null,kind:'self',date:agoS(2),ts:'2026-07-05T18:00:00.000Z',results:[{exName:'ベンチプレス',estBase:'bench',sets:[{weight:80,reps:8,rir:2}],volume:640}],totalVolume:640},
  {id:9005,pid:1,menuId:null,kind:'self',date:agoS(1),ts:'2026-07-06T10:00:00.000Z',fitness:{ftype:'ランニング',minutes:30,km:5.2,rpe:7,note:'朝ラン'},results:[],totalVolume:0}
];
var hb=buildHistCoach(1);
ok('自主バッジ表示',has(hb,'>自主<'));
ok('自主ウエイトの名称=自主トレ（ウエイト）',has(hb,'自主トレ（ウエイト）'));
ok('fitness行: 種類+時間+距離+RPE',has(hb,'ランニング')&&has(hb,'30分')&&has(hb,'5.2km')&&has(hb,'RPE7'));
ok('fitness行: 0種目/0kg表示にしない',!has(hb,'ランニング</span><span style="font-size:11px;color:var(--txt-2);margin-right:8px">0種目'));
ok('チーム行は従来表示',has(hb,'チームメニュー')&&has(hb,'500kg'));

print('--- trSessDetailC: fitnessの展開内容 ---');
var fd=trSessDetailC(D.tlog[2],1);
ok('fitness詳細: 種類+自主バッジ',has(fd,'ランニング')&&has(fd,'>自主<'));
ok('fitness詳細: 時間/距離/RPE',has(fd,'時間 30分')&&has(fd,'距離 5.2km')&&has(fd,'RPE 7'));
ok('fitness詳細: メモ',has(fd,'朝ラン'));
var wd=trSessDetailC(D.tlog[1],1);
ok('自主ウエイト詳細: 従来のセット表示',has(wd,'ベンチプレス')&&has(wd,'80kg×8'));

print('--- 既存集計の無傷確認 ---');
var okAgg=true;
try{
  getExSeries(1,'ベンチプレス');
  getCompareEx(1,'スクワット',todayStr(),'prev',null,null);
  insTraining();
  insHome();
}catch(e){okAgg=false;print('  exception: '+e);}
ok('集計/考察関数にself/fitnessを食わせて例外ゼロ',okAgg);
ok('getExSeries: 自主ウエイトを包含',getExSeries(1,'ベンチプレス').length===1);

if(__fail===0)print('ALL SELF-COACH TESTS PASSED');else print(__fail+' TESTS FAILED');
