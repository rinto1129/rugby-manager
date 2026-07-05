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
  {id:13,pid:3,date:'2026-06-22',squat:200}
];
D.bc=[];D.f=[];D.std=[];D.msess=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.tlog=[];

myPid=1;
print('--- 実測モード（デフォルト） ---');
T.ranking();
var r1=document.getElementById('main').innerHTML;
ok('並び順トグルあり',has(r1,'並び順'));
ok('補正スコアボタンあり',has(r1,'補正スコア'));
// 表彰台はHTML上 [2位,1位,3位] の順に並ぶため、1位判定は👑直後のカラムに名前があるかで見る
ok('実測1位=体重不明200kg（👑カラム）',r1.substring(r1.indexOf('👑'),r1.indexOf('👑')+900).indexOf('体重不明')>=0);
ok('実測順: 重量180が軽量165より上',r1.indexOf('重量選手')<r1.indexOf('軽量選手'));

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

print('--- ブロンコでは並び順トグル非表示 ---');
rankSF('bronco');
var r4=document.getElementById('main').innerHTML;
ok('トグル消滅',!has(r4,'並び順'));
rankSF('squat');

print('--- ブロンコからSQに戻ってもモード保持で壊れない ---');
var r5=document.getElementById('main').innerHTML;
ok('SQ表示復帰',has(r5,'並び順'));

print(__fail===0?'ALL RANKING TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('ranking tests failed');
