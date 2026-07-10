// ステップ4: T.rankingのアロメトリック補正スコア順の模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

// ---- テストデータ ----
// 軽量選手(70kg SQ140=体重比2.0)と重量選手(110kg SQ180=体重比1.64)
// 実測順: 重量180 > 軽量140 / 補正順(b=0.33): 軽量 140/70^.33=34.4 > 重量 180/110^.33=38.1?
// 計算: 70^0.33=e^(0.33*ln70)=e^(0.33*4.2485)=e^1.402=4.063 → 140/4.063=34.5
//       110^0.33=e^(0.33*4.7005)=e^1.5512=4.717 → 180/4.717=38.2 → 重量選手が補正でも上
// → 補正で順位が入れ替わるデータにする: 軽量 SQ165 → 165/4.063=40.6 > 38.2
D.p=[
  {id:1,name:'軽量選手',position:'SH',year:2,height:'170',weight:'70'},
  {id:2,name:'重量選手',position:'PR',year:3,height:'185',weight:'110'},
  {id:3,name:'体重不明',position:'LO',year:1,height:'',weight:''}
];
D.ph=[
  {id:11,pid:1,date:'2026-06-20',squat:165},
  {id:12,pid:2,date:'2026-06-21',squat:180},
  {id:13,pid:3,date:'2026-06-22',squat:200},
  // ブロンコ: SH(gold265)260=ゴールド達成✓ / PR(gold310)330=シルバー / LO(gold290)450=目標未達
  {id:21,pid:1,date:'2026-06-20',bronco:260},
  {id:22,pid:2,date:'2026-06-21',bronco:330},
  {id:23,pid:3,date:'2026-06-22',bronco:450}
];
D.bc=[];D.f=[];D.std=[];D.msess=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.tlog=[];

myPid=1;
window._rkFO=false; // フィルタ折りたたみ既定
print('--- 実測モード（デフォルト・フィルタ折りたたみ） ---');
T.ranking();
var r1=document.getElementById('main').innerHTML;
ok('種目セクションあり',has(r1,'種目'));
ok('絞り込みトグルあり',has(r1,'絞り込み'));
ok('既定は並び順トグル非表示(折りたたみ内)',!has(r1,'並び順'));
// 1位は中央高ポディウムの.rkp-col firstに載る（semanticマーカーで判定・DOM順は順位順）
var __li=r1.indexOf('rkp-col first');
ok('実測1位=体重不明200kg（表彰台1位）',__li>=0&&r1.substring(__li,__li+700).indexOf('体重不明')>=0);
ok('実測順: 重量180が軽量165より上',r1.indexOf('重量選手')<r1.indexOf('軽量選手'));
ok('表彰台(rkp-podium)描画',has(r1,'rkp-podium'));
ok('自分の順位チップ(YOUR RANK)',has(r1,'YOUR RANK'));
ok('レジストリ: 7種目ピル(BIG3/ブロンコ/チンニング/クリーン)',has(r1,'BIG3')&&has(r1,'ブロンコ')&&has(r1,'チンニング')&&has(r1,'クリーン'));

print('--- 絞り込みを開く ---');
rankToggleFilters();
var r1b=document.getElementById('main').innerHTML;
ok('展開で並び順トグル出現',has(r1b,'並び順'));
ok('展開で補正スコアボタン出現',has(r1b,'補正スコア'));
ok('展開で測定会/グループ/学年',has(r1b,'測定会')&&has(r1b,'グループ')&&has(r1b,'学年'));
ok('展開しても表彰台は維持',has(r1b,'rkp-podium'));

print('--- 補正スコアモード ---');
rankSM('allo');
var r2=document.getElementById('main').innerHTML;
ok('説明文あり',has(r2,'体格差の影響を除いた'));
ok('補正順: 軽量が重量より上に入れ替わる',r2.indexOf('軽量選手')<r2.indexOf('重量選手'));
ok('体重不明選手は除外',!has(r2,'体重不明'));
ok('実測1RMが添えられる',has(r2,'1RM 165kg'));
ok('補正スコア値40.6表示',has(r2,'40.6'));
ok('補正スコア値38.2表示',has(r2,'38.2'));

print('--- 実測に戻す ---');
rankSM('raw');
var r3=document.getElementById('main').innerHTML;
ok('体重不明選手が戻る',has(r3,'体重不明'));

print('--- ブロンコでは並び順トグル非表示＋目標ランクバッジ ---');
rankSF('bronco');
var r4=document.getElementById('main').innerHTML;
ok('トグル消滅',!has(r4,'並び順'));
ok('ブロンコ凡例',has(r4,'バッジ＝ポジション別の目標ランク'));
ok('ゴールドバッジ色(#FFD24A)',has(r4,'background:#FFD24A'));   // SH 260=達成
ok('達成マーク(i-check)がバッジに',has(r4,'#i-check'));
ok('シルバーバッジ色(#C9D4E4)',has(r4,'background:#C9D4E4'));   // PR 330=シルバー
ok('ランク外は目標未達バッジ',has(r4,'目標未達'));               // LO 450
ok('ブロンコ昇順1位=軽量選手(SH 260)',r4.indexOf('軽量選手')<r4.indexOf('重量選手'));
rankSF('squat');

print('--- ブロンコからSQに戻ってもモード保持で壊れない ---');
var r5=document.getElementById('main').innerHTML;
ok('SQ表示復帰',has(r5,'並び順'));
ok('SQ表示ではブロンコ凡例なし',!has(r5,'バッジ＝ポジション別の目標ランク'));
ok('SQ表示では目標未達バッジなし',!has(r5,'目標未達'));

print('--- 種目切替(BIG3)で例外なく描画継続 ---');
rankSF('big3');
var rb=document.getElementById('main').innerHTML;
ok('BIG3で表彰台描画',has(rb,'rkp-podium')&&has(rb,'ランキング'));
rankSF('squat');

print('--- 0件時（学年フィルタで対象なし） ---');
rankSY('4'); // 4年生はテストデータに不在
var r0=document.getElementById('main').innerHTML;
ok('0件でデータなし表示',has(r0,'データがありません'));
ok('0件でも表彰台は出さない',!has(r0,'rkp-podium'));
rankSY('');
var r6=document.getElementById('main').innerHTML;
ok('学年リセットで表彰台復帰',has(r6,'rkp-podium'));

print('--- 測定会フィルタの既定は「全期間」(all)（最新測定会固定を廃止） ---');
D.msess=[{id:'s1',name:'6月測定会',startDate:'2026-06-15'}];
T.ranking();
var r7=document.getElementById('main').innerHTML;
ok('全期間ボタンが既定でアクティブ(btn-p)',has(r7,'btn btn-sm btn-p" onclick="rankSSess(0)"'));
ok('測定会s1ボタンは既定で非アクティブ',!has(r7,'btn btn-sm btn-p" onclick="rankSSessIdx(0)"'));
D.msess=[];

print(__fail===0?'ALL RANKING TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('ranking tests failed');
