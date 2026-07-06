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
// 弱点=FOCUSバッジ数（本体+処方箋の2件のみ）
var badgeCount=(h.match(/>FOCUS</g)||[]).length;
ok('FOCUSバッジは2件（本体+処方箋）',badgeCount===2);
ok('maroonの強調枠あり',has(h,'border-left:3px solid var(--maroon-vivid);box-shadow:0 0 14px rgba(141,0,0,.14);'));

// カードごとの区切りで検証（tr-ex-card-N。style属性はid属性より前に出るので開始タグ<div class="card"から取る）
function cardHtml(idx){
  var idPos=h.indexOf('id="tr-ex-card-'+idx+'"');if(idPos<0)return'';
  var start=h.lastIndexOf('<div class="card"',idPos);
  var nextIdPos=h.indexOf('id="tr-ex-card-'+(idx+1)+'"');
  var end=nextIdPos>=0?h.lastIndexOf('<div class="card"',nextIdPos):h.length;
  return h.substring(start,end);
}
ok('カード0(ベンチプレス)にFOCUSバッジ',has(cardHtml(0),'>FOCUS<'));
ok('カード1(ダンベルプレス)にFOCUSバッジ',has(cardHtml(1),'>FOCUS<'));
ok('カード2(スクワット)はFOCUSバッジなし',!has(cardHtml(2),'>FOCUS<'));
ok('カード3(サイドプランク)はFOCUSバッジなし',!has(cardHtml(3),'>FOCUS<'));
ok('カード2(スクワット)はmaroon枠なし',!has(cardHtml(2),'border-left:3px solid var(--maroon-vivid)'));
ok('スキップ中のカード3はopacity維持',has(cardHtml(3),'opacity:.7'));

print('--- P7: stickyタイマーバー ---');
ok('stickyバー(rt-bar)あり',has(h,'id="rest-timer-bar"')&&has(h,'class="card rt-bar"'));
ok('rest-timer-disp維持',has(h,'id="rest-timer-disp"'));
ok('rest-timer-btn維持',has(h,'id="rest-timer-btn"'));
ok('リング要素あり',has(h,'id="rest-timer-ring"'));
ok('TIME OFF語彙',has(h,'TIME OFF・休憩'));
ok('▶/⏱絵文字が消えic()化',!has(h,'▶ スタート')&&!has(h,'⏱')&&has(h,'#i-play')&&has(h,'#i-timer'));

print('--- P7: 44px縦のみ ---');
ok('±ボタンはwidth:40px維持+height:44px',has(h,'width:40px;height:44px')&&!has(h,'width:40px;height:40px'));
ok('ステッパー入力はmin-width:34px',has(h,'min-width:34px'));

print('--- P7: MD-1テーパーヒント ---');
ok('試合予定なしではMD-1ヒントなし',!has(h,'>MD-1<'));
var tomorrowS=toDateStr(new Date(new Date(todayStr()).getTime()+86400000));
D.cal=[{id:1,date:tomorrowS,type:'match',title:'テストマッチ'}];
renderTrainingExec({name:'テストメニュー',exercises:[]});
var h2=document.getElementById('main').innerHTML;
ok('明日試合ならMD-1ヒント表示',has(h2,'>MD-1<')&&has(h2,'低ボリューム×高速度'));
D.cal=[{id:1,date:tomorrowS,type:'weight',title:'ウエイト'}];
renderTrainingExec({name:'テストメニュー',exercises:[]});
ok('明日ウエイトではMD-1ヒントなし',!has(document.getElementById('main').innerHTML,'>MD-1<'));
D.cal=[];

print(__fail===0?'ALL TRAIN-WEAK TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('train-weak tests failed');
