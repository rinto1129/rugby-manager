// Phase6: coach renderPhysicalView の BRONCO セクション（KPI×3＋ポジ別HTMLバー＋チーム最速）模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

function resetD(){
  D.p=[];D.i=[];D.r=[];D.ph=[];D.a=[];D.f=[];D.md=[];D.wc=[];D.bc=[];D.ann=[];D.offday=[];D.cal=[];
  D.matchsel=[];D.tape=[];D.tapeslot=[];D.trainers=[];D.rtpl=[];D.rplan=[];D.rlog=[];D.phskip=[];
  D.rtest_tpl=[];D.rtest=[];D.msess=[];D.injcomm=[];D.chart=[];D.taperec=[];D.tmenu=[];D.tlog=[];
  D.texlist=[];D.e1rm=[];D.std=[];D.gs=[];D.ms=[];
}

resetD();
// PR2名(達成/未達) + WTB1名(達成・最速) + SH1名(未測定)
D.p=[
  {id:1,name:'PR達成',position:'PR'},   // bronco310=gold310 ちょうど→達成
  {id:2,name:'PR未達',position:'PR'},   // bronco350→シルバー
  {id:3,name:'WTB最速',position:'WTB'}, // bronco260(<gold270)→達成・チーム最速
  {id:4,name:'SH未測定',position:'SH'}
];
D.ph=[
  {id:11,pid:1,date:'2026-06-20',bronco:310},
  {id:12,pid:2,date:'2026-06-20',bronco:350},
  {id:13,pid:3,date:'2026-06-20',bronco:260}
];

print('--- renderPhysicalView 完走＋BRONCOセクション ---');
renderPhysicalView();
var h=document.getElementById('main').innerHTML;
ok('セクション見出し ブロンコ目標達成',has(h,'ブロンコ目標達成'));
ok('KPI 測定済',has(h,'測定済'));
ok('KPI ゴールド達成',has(h,'ゴールド達成'));
ok('KPI 達成率',has(h,'達成率'));
// 測定済3 / 達成2 / 達成率67%（PR310ちょうど→達成に入る）
ok('測定済=3',has(h,'data-cnt="3"'));
ok('ゴールド達成=2',has(h,'data-cnt="2"'));
ok('達成率=67%(2/3)',has(h,'data-cnt="67"'));
ok('達成率に%単位',has(h,'>%</span>')||has(h,'%</span>'));
print('--- ポジ別リスト（n/m＋ゴールド基準タイム） ---');
ok('PR行 ゴールド基準5分10秒',has(h,'5分10秒'));
ok('PR行 達成1/2',has(h,'1/2'));
ok('WTB行 ゴールド基準4分30秒',has(h,'4分30秒'));
ok('WTB行 達成1/1',has(h,'1/1'));
print('--- チーム最速 ---');
ok('チーム最速ラベル',has(h,'チーム最速'));
ok('最速タイム4分20秒(WTB260)',has(h,'4分20秒'));
ok('最速選手名 WTB最速',has(h,'WTB最速'));

print('--- 記録が全く無くても例外なく描画（達成率は"-"） ---');
D.ph=[];
renderPhysicalView();
var h2=document.getElementById('main').innerHTML;
ok('記録なしでもセクション出る',has(h2,'ブロンコ目標達成'));
ok('測定済0',has(h2,'data-cnt="0"'));
ok('達成率は-表示',has(h2,'>-<')||has(h2,'記録がありません'));

print(__fail===0?'ALL BRONCO-COACH TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('bronco coach tests failed');
