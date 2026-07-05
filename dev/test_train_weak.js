// ステップ7: トレーニング実施画面(renderTrainingExec)の弱点種目強調テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

D.p=[{id:1,name:'テストPR',position:'PR',year:2,height:'180',weight:'100'}];
// SQ比率.967(silver圏)/BP比率.72(bronze圏=最弱)/DL比率1.05(gold圏) → 弱点=BP
D.ph=[{id:11,pid:1,date:'2026-06-20',squat:150,bench:90,deadlift:200}];
D.bc=[];D.f=[];D.std=[];D.i=[];D.r=[];D.tlog=[];
myPid=1;

var weak=getWeakLift(1);
ok('弱点判定=ベンチプレス(bp)',weak&&weak.lift==='bp');

_curTLog={
  id:1,pid:1,menuId:1,date:todayStr(),ts:new Date().toISOString(),
  results:[
    {exName:'ベンチプレス',estBase:'bench',targetSets:3,targetReps:5,targetRir:2,estWeight:80,sets:[{weight:80,reps:5,rir:2}]},
    {exName:'ダンベルプレス',estBase:null,targetSets:3,targetReps:8,targetRir:2,sets:[{weight:20,reps:8,rir:2}]}, // bp処方箋の1つ
    {exName:'スクワット',estBase:'squat',targetSets:3,targetReps:5,targetRir:2,estWeight:140,sets:[{weight:140,reps:5,rir:2}]},
    {exName:'サイドプランク',estBase:null,targetSets:3,targetReps:30,targetRir:null,sets:[{weight:'',reps:30,rir:''}],skipped:true,skipReason:'その他'}
  ],
  totalVolume:0
};

renderTrainingExec({name:'テストメニュー',exercises:[]});
var h=document.getElementById('main').innerHTML;

ok('メニュー名表示',has(h,'テストメニュー'));
// 弱点バッジ数（本体+処方箋の2件のみ）
var badgeCount=(h.match(/🎯 弱点/g)||[]).length;
ok('弱点バッジは2件（本体+処方箋）',badgeCount===2);
ok('amberの強調枠あり',has(h,'border-left:3px solid var(--amber);box-shadow:0 0 14px rgba(251,191,36,.16);'));

// カードごとの区切りで検証（tr-ex-card-N。style属性はid属性より前に出るので開始タグ<div class="card"から取る）
function cardHtml(idx){
  var idPos=h.indexOf('id="tr-ex-card-'+idx+'"');if(idPos<0)return'';
  var start=h.lastIndexOf('<div class="card"',idPos);
  var nextIdPos=h.indexOf('id="tr-ex-card-'+(idx+1)+'"');
  var end=nextIdPos>=0?h.lastIndexOf('<div class="card"',nextIdPos):h.length;
  return h.substring(start,end);
}
ok('カード0(ベンチプレス)に弱点バッジ',has(cardHtml(0),'🎯 弱点'));
ok('カード1(ダンベルプレス)に弱点バッジ',has(cardHtml(1),'🎯 弱点'));
ok('カード2(スクワット)は弱点バッジなし',!has(cardHtml(2),'🎯 弱点'));
ok('カード3(サイドプランク)は弱点バッジなし',!has(cardHtml(3),'🎯 弱点'));
ok('カード2(スクワット)はamber枠なし',!has(cardHtml(2),'border-left:3px solid var(--amber)'));
ok('スキップ中のカード3はopacity維持',has(cardHtml(3),'opacity:.7'));

print(__fail===0?'ALL TRAIN-WEAK TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('train-weak tests failed');
