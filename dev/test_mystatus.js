// ステップ3: T.mystatus詳細画面＋getAlloTeamRank/getWeakWeeklyVolumeの模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eqn(name,got,want){var o=(typeof want==='number'&&typeof got==='number')?Math.abs(got-want)<0.051:(got===want);if(!o){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

// ---- テストデータ ----
D.p=[
  {id:1,name:'テストPR',position:'PR',year:2,height:'180',weight:'100'},
  {id:2,name:'テストWTB',position:'WTB',year:3,height:'175',weight:'85'},
  {id:3,name:'未登録SH',position:'SH',year:1,height:'',weight:''},
  {id:4,name:'ポジなし',position:'',year:1,height:'170',weight:'75'}
];
D.ph=[
  {id:11,pid:1,date:'2026-06-20',squat:150,bench:110,deadlift:180},
  {id:13,pid:2,date:'2026-06-25',squat:150,bench:100}
];
D.bc=[{id:21,pid:1,date:'2026-06-28',weight:102,fat:16,muscle:48}];
D.f=[{id:31,pid:1,date:'2026-07-01',rpe:5,sleep:7,duration:60,weight:101,inputAt:'2026-07-01T08:00:00'}];
D.std=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];D.tlog=[];

print('--- getAlloTeamRank ---');
var ar1=getAlloTeamRank(1,'sq');
eqn('母数=2（体重ありの2人）',ar1.total,2);
eqn('PRは2位（WTBの補正スコアが上）',ar1.rank,2);
var ar2=getAlloTeamRank(2,'sq');
eqn('WTBは1位',ar2.rank,1);
ok('スコアなし選手はnull',getAlloTeamRank(3,'sq')===null);

print('--- getWeakWeeklyVolume ---');
var lastWeek=toDateStr(new Date(Date.now()-7*86400000));
D.tlog=[
  {id:101,pid:1,date:todayStr(),results:[
    {exName:'スクワット',estBase:'squat',sets:[{weight:100,reps:5},{weight:100,reps:5},{weight:100,reps:5}]},
    {exName:'フロントスクワット',sets:[{weight:60,reps:8}]},
    {exName:'ベンチプレス',estBase:'bench',sets:[{weight:80,reps:5}]},
    {exName:'スキップ種目',estBase:'squat',skipped:true,sets:[{weight:200,reps:5}]}
  ]},
  {id:102,pid:1,date:lastWeek,results:[{exName:'スクワット',estBase:'squat',sets:[{weight:100,reps:5}]}]},
  {id:103,pid:1,date:todayStr(),absent:true,results:[{exName:'スクワット',estBase:'squat',sets:[{weight:999,reps:9}]}]},
  {id:104,pid:2,date:todayStr(),results:[{exName:'スクワット',estBase:'squat',sets:[{weight:50,reps:5}]}]}
];
var wv=getWeakWeeklyVolume(1,'sq',5);
eqn('5週分',wv.length,5);
eqn('今週=SQ1500+フロントSQ480（bench/skipped/absent/他人は除外）',wv[4].vol,1980);
eqn('先週=500',wv[3].vol,500);
eqn('3週前=0',wv[1].vol,0);

print('--- T.mystatus (PR: フル表示) ---');
myPid=1;
T.mystatus();
var ms=document.getElementById('main').innerHTML;
ok('タイトル',has(ms,'マイフィジカル詳細'));
ok('ランク凡例（ダイヤ×1.2）',has(ms,'ダイヤ×1.2'));
ok('SQカード ゴールド基準',has(ms,'ゴールド基準 157.3kg'));
ok('進捗バーあり',has(ms,'bar-fill')&&has(ms,'linear-gradient(90deg,var(--rose)'));
ok('次ランクまで（SQ→ゴールドまで あと7.5kg）',has(ms,'ゴールドまで あと7.5kg'));
ok('達成率表示',has(ms,'達成率'));
ok('補正スコア表示',has(ms,'補正スコア'));
ok('チーム順位表示',has(ms,'チーム2位/2人'));
ok('弱点バッジ（FOCUS）',has(ms,'>FOCUS<'));
ok('処方箋にナローベンチ',has(ms,'ナローベンチプレス'));
ok('推奨重量87.5kg（BP110×RPE表78.6%→2.5kg丸め）',has(ms,'目安 87.5kg'));
ok('週次ボリュームカード',has(ms,'弱点系ボリューム'));
ok('体重帯カード',has(ms,'体重・体組成基準'));
ok('帯内メッセージ',has(ms,'推奨帯内です'));
ok('FFMI表示26.4',has(ms,'>26.4<'));
ok('FFMI帯内チップ',has(ms,'帯内 ')&&has(ms,'#i-check'));

print('--- T.mystatus (WTB: DL未測定CTA・FFMI CTA・BP弱点ボリューム) ---');
myPid=2;
T.mystatus();
var ms2=document.getElementById('main').innerHTML;
ok('DL未測定CTA',has(ms2,'フィジカル測定で1RMを記録するとランクが判定されます'));
ok('FFMI測定CTA',has(ms2,'体脂肪率つきの体組成を記録すると'));
ok('弱点=ベンチプレス処方箋',has(ms2,'処方箋 — 弱点: ベンチプレス'));
ok('BP系記録なしメッセージ',has(ms2,'ベンチプレス系トレーニング記録がまだありません'));

print('--- T.mystatus (SH: 体重なし) ---');
myPid=3;
T.mystatus();
var ms3=document.getElementById('main').innerHTML;
ok('体重なし案内',has(ms3,'体重データがありません'));

print('--- T.mystatus (ポジ未登録) ---');
myPid=4;
T.mystatus();
var ms4=document.getElementById('main').innerHTML;
ok('ポジ未登録案内',has(ms4,'ポジションが未登録'));

print('--- ホームのカードからmystatusへの導線 ---');
myPid=1;
var hc=myPhysCardHtml();
ok('カードにgo(mystatus)',has(hc,"go('mystatus')")||has(hc,'go(&#39;mystatus&#39;)')||has(hc,'mystatus'));
ok('詳しく見るヒント',has(hc,'詳しく見る →'));

print(__fail===0?'ALL MYSTATUS TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('mystatus tests failed');
