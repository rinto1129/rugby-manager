// Phase5: staff V.physical のブロンコ目標達成ボード（折りたたみ・集計・チップ）模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

// ---- テストデータ: PR達成 / PR未達(測定済) / PR未測定 / ポジ未登録 ----
D.p=[
  {id:1,name:'PR達成',position:'PR'},   // bronco300 < gold310 → ゴールド達成
  {id:2,name:'PR未達',position:'PR'},   // bronco350 → シルバー(未達)
  {id:3,name:'PR未測定',position:'PR'}, // 記録なし
  {id:4,name:'ポジ無し',position:''}    // ボード対象外
];
D.ph=[
  {id:11,pid:1,date:'2026-06-20',bronco:300},
  {id:12,pid:2,date:'2026-06-20',bronco:350}
];
D.bc=[];D.f=[];D.std=[];D.i=[];D.r=[];D.tlog=[];D.offday=[];D.msess=[];D.a=[];D.pp=[];D.e1rm=[];

print('--- ボード（既定=閉） ---');
window._phBroncoOpen=undefined;
V.physical();
var h1=document.getElementById('main-ct').innerHTML;
ok('ボードヘッダー表示',has(h1,'ブロンコ目標達成ボード'));
ok('サマリー: 達成1/測定済2/全3',has(h1,'>1</b> / 測定済 2 / 全 3名'));
ok('閉じている時は行明細なし',!has(h1,'ゴールド基準 5分10秒'));
ok('chevron下向き(閉)',has(h1,'#i-chevron-d'));
ok('記録一覧(既存)は無傷',has(h1,'記録一覧')||has(h1,'BIG3'));

print('--- 展開（phBroncoToggle） ---');
phBroncoToggle();
var h2=document.getElementById('main-ct').innerHTML;
ok('PR行 ゴールド基準5分10秒',has(h2,'ゴールド基準 5分10秒'));
ok('達成者名 PR達成',has(h2,'PR達成'));
ok('達成者ベスト 5分00秒',has(h2,'5分00秒'));
ok('未達者ベスト 5分50秒',has(h2,'5分50秒'));
ok('達成マーク i-check',has(h2,'#i-check'));
ok('未測定表示',has(h2,'未測定'));
ok('chevron上向き(開)',has(h2,'#i-chevron-u'));
ok('凡例 ゴールド達成',has(h2,'ゴールド達成'));
ok('展開でもサマリー維持',has(h2,'>1</b> / 測定済 2 / 全 3名'));

print('--- 再収納 ---');
phBroncoToggle();
var h3=document.getElementById('main-ct').innerHTML;
ok('再収納で明細消える',!has(h3,'ゴールド基準 5分10秒'));
ok('ヘッダーは残る',has(h3,'ブロンコ目標達成ボード'));

print('--- 全員未測定でも例外なく描画 ---');
D.ph=[];
window._phBroncoOpen=true;
V.physical();
var h4=document.getElementById('main-ct').innerHTML;
ok('達成0/測定済0/全3',has(h4,'>0</b> / 測定済 0 / 全 3名'));
ok('全員未測定表示',has(h4,'未測定'));

print(__fail===0?'ALL BRONCO-BOARD TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('bronco board staff tests failed');
