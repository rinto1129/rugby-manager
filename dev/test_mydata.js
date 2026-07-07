// Phase 5: マイデータタブ（T.mydata / getMyInsights / getMdAttendance / drawMdExChart）のテスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_mydata.js
// 仕様（プランPhase 5節）:
//  - 4タブ目マイデータ・期間セレクタ_mdRange('30'/'90'/'all'既定'90')
//  - ①考察 getMyInsights（coach insPlayer移植＋追加ルール：自主good/体脂肪±/出席率<70%warn/e1rm30日good）
//    【Low-4】出席率は kind!=='self'フィルタ＋分母=期間内カレンダーweight日数
//  - ②コンディション（RPE+睡眠+体重f/bc統合）③体組成FFMI ④週間ボリューム棒+種目別+出席率+自主回数 ⑤5種目+ブロンコ推移+ランクバッジ ⑥GPS(D.gsのみ) ⑦怪我履歴
//  - md_接頭辞チャート・dC先行・固定高（onSnapshot再描画に冪等）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function flush(){var g=0;while(__timeouts.length&&g<50){var t=__timeouts.splice(0);t.forEach(function(fn){try{fn();}catch(e){print('  TIMEOUT ERR '+e);__fail++;}});g++;}}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
drain(); // 起動時のld()→go('home')チェーンを流しきる

var TODAY=todayStr();
function resetD(){
  D.p=[{id:1,name:'テスト選手',position:'PR',year:2,height:'180',weight:'100'},{id:2,name:'選手2',position:'WTB',year:3,height:'175',weight:'85'}];
  D.std=[];D.offday=[];D.ann=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.a=[];
  D.e1rm=[];D.rplan=[];D.r=[];D.ph=[];D.bc=[];D.f=[];D.tlog=[];D.chart=[];D.pp=[];D.texlist=[];D.tmenu=[];D.cal=[];
  if(typeof D.gs!=='undefined')delete D.gs;
  _tlogArchLoaded=true;_tlogArch=[];
  window._mdRange='90';window._mdEx='';
  myPid=1;subView=null;curTab='mydata';
}
function insText(range){return getMyInsights(range||'90').map(function(x){return x.t+'|'+x.d;}).join('\n');}

// ============ 1. getMyInsights: 空データでも例外なし・[]返し ============
print('--- getMyInsights: 空データ ---');
resetD();
var e0=null;try{e0=getMyInsights('90');}catch(e){e0=e;}
ok('空データで例外なく配列を返す',Array.isArray(e0)&&e0.length===0);

// ============ 2. getMdAttendance【Low-4】: 分母=カレンダーweight日数・kind!=='self'除外 ============
print('--- getMdAttendance: カレンダーweight日数が分母・自主は分子から除外 ---');
resetD();
D.cal=[{id:1,date:TODAY,type:'weight'},{id:2,date:agoStr(2),type:'weight'},{id:3,date:agoStr(4),type:'weight'},{id:4,date:agoStr(3),type:'practice'}];
D.tlog=[
  {id:11,pid:1,date:TODAY,totalVolume:1000},          // チーム実施（kind未定義=team）
  {id:12,pid:1,date:agoStr(2),totalVolume:1200},        // チーム実施
  {id:13,pid:1,date:agoStr(4),kind:'self',totalVolume:0}// 自主（weight日だが分子に入れない）
];
var att=getMdAttendance(1,'90');
ok('分母=weight日数のみ（practice除外）total=3',att&&att.total===3);
ok('分子=非自主のweight日参加 attended=2',att.attended===2);
ok('出席率=round(2/3)=67',att.rate===67);
// 自主トレしか無い日は出席に数えない（Low-4）
D.tlog=[{id:13,pid:1,date:agoStr(4),kind:'self',totalVolume:0}];
var att2=getMdAttendance(1,'90');
ok('自主トレのみの日は出席0',att2.attended===0&&att2.total===3);
// カレンダーにweight日が無ければnull
D.cal=[{id:9,date:TODAY,type:'practice'}];
ok('weight日ゼロならnull',getMdAttendance(1,'90')===null);

// ============ 3. 考察ルール境界 ============
// 3a) 直近7日 平均疲労度>=8 → bad
print('--- 考察: RPE平均8境界 ---');
resetD();
D.f=[{id:1,pid:1,date:TODAY,rpe:8,sleep:7},{id:2,pid:1,date:agoStr(1),rpe:8,sleep:7},{id:3,pid:1,date:agoStr(2),rpe:8,sleep:7}];
ok('平均RPE8で高疲労の考察が出る',has(insText(),'平均疲労度'));
D.f=[{id:1,pid:1,date:TODAY,rpe:7,sleep:7}];
ok('平均RPE7では高疲労の考察は出ない',!has(insText(),'平均疲労度が'));

// 3b) 週間ボリューム 先週比+30% → warn / -30% → info
print('--- 考察: 週間ボリューム±30%境界 ---');
resetD();
D.tlog=[{id:1,pid:1,date:agoStr(1),totalVolume:1300},{id:2,pid:1,date:agoStr(8),totalVolume:1000}];
ok('先週比+30%で急増warn',has(insText(),'先週比 +30%'));
D.tlog=[{id:1,pid:1,date:agoStr(1),totalVolume:700},{id:2,pid:1,date:agoStr(8),totalVolume:1000}];
ok('先週比-30%で減少info',has(insText(),'先週比 -30%'));
D.tlog=[{id:1,pid:1,date:agoStr(1),totalVolume:1100},{id:2,pid:1,date:agoStr(8),totalVolume:1000}];
ok('先週比+10%では考察なし',!has(insText(),'先週比'));

// 3c) 体脂肪率トレンド +2% → warn / -2% → good
print('--- 考察: 体脂肪率±2%境界 ---');
resetD();
D.bc=[{id:1,pid:1,date:agoStr(20),weight:100,fat:15},{id:2,pid:1,date:agoStr(2),weight:100,fat:17}];
ok('体脂肪+2%で上昇warn',has(insText(),'体脂肪率が +2% 上がっています'));
D.bc=[{id:1,pid:1,date:agoStr(20),weight:100,fat:17},{id:2,pid:1,date:agoStr(2),weight:100,fat:15}];
ok('体脂肪-2%で減少good',has(insText(),'体脂肪率が -2% 下がっています'));
D.bc=[{id:1,pid:1,date:agoStr(20),weight:100,fat:15},{id:2,pid:1,date:agoStr(2),weight:100,fat:16}];
ok('体脂肪+1%では考察なし',!has(insText(),'体脂肪率が'));

// 3d) 推定1RM 過去30日の伸び → good
print('--- 考察: e1rm 過去30日の伸び ---');
resetD();
D.e1rm=[{id:1,pid:1,date:agoStr(40),values:{squat:{e1rm:100}}},{id:2,pid:1,date:agoStr(5),values:{squat:{e1rm:110}}}];
var it=insText();
ok('30日でe1rm伸長のgood考察',has(it,'推定1RMが過去30日で伸びています')&&has(it,'SQ +10kg'));
// 30日以内に基準が無ければ出ない（両方とも30日以内）
D.e1rm=[{id:1,pid:1,date:agoStr(20),values:{squat:{e1rm:100}}},{id:2,pid:1,date:agoStr(5),values:{squat:{e1rm:110}}}];
ok('30日超の基準が無ければe1rm考察は出ない',!has(insText(),'推定1RMが過去30日'));

// 3e) 自主トレ回数>=3 → good
print('--- 考察: 自主トレ回数 ---');
resetD();
D.tlog=[{id:1,pid:1,date:agoStr(1),kind:'self',totalVolume:0},{id:2,pid:1,date:agoStr(3),kind:'self',totalVolume:0},{id:3,pid:1,date:agoStr(5),kind:'self',totalVolume:0}];
ok('自主3回でgood考察',has(insText('90'),'自主トレを 3回 記録'));
D.tlog=[{id:1,pid:1,date:agoStr(40),kind:'self',totalVolume:0},{id:2,pid:1,date:agoStr(45),kind:'self',totalVolume:0},{id:3,pid:1,date:agoStr(50),kind:'self',totalVolume:0}];
ok('期間外(30日)だと自主考察は出ない',!has(insText('30'),'自主トレを 3回'));
ok('全期間なら自主考察は出る',has(insText('all'),'自主トレを 3回'));

// 3f) 出席率<70% → warn（Low-4分母）
print('--- 考察: 出席率<70% warn ---');
resetD();
D.cal=[{id:1,date:TODAY,type:'weight'},{id:2,date:agoStr(2),type:'weight'},{id:3,date:agoStr(4),type:'weight'}];
D.tlog=[{id:11,pid:1,date:TODAY,totalVolume:1000}]; // 3日中1日=33%
ok('出席率33%でwarn考察',has(insText(),'出席率が 33% です'));

// 3g) 前回測定からの伸び: 部分測定（bronco単独/単一種目）で偽の大増減を出さない（敵対的レビュー確定所見の回帰）
print('--- 考察: BIG3の伸び（部分測定を除外） ---');
resetD();
D.ph=[{id:1,pid:1,date:agoStr(30),squat:150,bench:110,deadlift:180,bronco:320},{id:2,pid:1,date:agoStr(5),squat:null,bench:null,deadlift:null,bronco:300}];
ok('bronco単独の後でも偽のBIG3増減を出さない',!has(insText(),'BIG3が'));
D.ph=[{id:1,pid:1,date:agoStr(30),squat:150,bench:110,deadlift:180},{id:2,pid:1,date:agoStr(5),squat:160,bench:115,deadlift:190}];
ok('3種目そろった2回の比較では伸びを出す(+25kg)',has(insText(),'前回の測定からBIG3が +25kg 伸びました'));
D.ph=[{id:1,pid:1,date:agoStr(30),squat:150,bench:110,deadlift:180},{id:2,pid:1,date:agoStr(10),squat:null,bench:112,deadlift:null},{id:3,pid:1,date:agoStr(5),squat:160,bench:115,deadlift:190}];
ok('間に単一種目測定があっても完全な2回で比較(+25kg)',has(insText(),'+25kg'));

// ============ 4. FFMI 表示（getCurrentFFMIInfo値がT.mydataに出る） ============
print('--- 体組成: FFMI値 ---');
resetD();
D.bc=[{id:1,pid:1,date:agoStr(3),weight:100,fat:15,muscle:45}];
// FFMI=100*(1-0.15)/(1.8^2)=85/3.24=26.2 / 除脂肪量=85 / 体脂肪率=15
var ffmi=getCurrentFFMIInfo(1);
ok('getCurrentFFMIInfo=26.2',ffmi&&ffmi.ffmi===26.2&&ffmi.ffm===85&&ffmi.fat===15);
T.mydata();var md=__els['main'].innerHTML;
ok('レンダーにFFMIラベル',has(md,'FFMI（除脂肪量指数）'));
ok('レンダーにFFMI値26.2',has(md,'26.2'));
ok('身長未登録導線は出ない（身長あり）',!has(md,'マイページで身長を登録'));
// 身長未登録→導線
D.p[0].height='';
T.mydata();var md2=__els['main'].innerHTML;
ok('身長未登録でマイページ導線',has(md2,'マイページで身長を登録'));

// ============ 5. T.mydata 完走 + セクション + チャート生成（冪等） ============
print('--- T.mydata: 完走・セクション・チャート ---');
resetD();
D.p[0].height='180';
D.f=[{id:1,pid:1,date:agoStr(10),rpe:6,sleep:7,weight:99},{id:2,pid:1,date:agoStr(3),rpe:7,sleep:8,weight:100}];
D.bc=[{id:1,pid:1,date:agoStr(20),weight:98,fat:16,muscle:44},{id:2,pid:1,date:agoStr(2),weight:100,fat:15,muscle:45}];
D.ph=[{id:1,pid:1,date:agoStr(30),squat:150,bench:110,deadlift:180,chinning:20,clean:90,bronco:320},{id:2,pid:1,date:agoStr(3),squat:160,bench:115,deadlift:190,chinning:22,clean:95,bronco:300}];
D.tmenu=[{id:200,name:'胸の日'}];
D.tlog=[
  {id:1,pid:1,date:agoStr(9),menuId:200,totalVolume:5000,results:[{exName:'ベンチプレス',sets:[{weight:100,reps:5},{weight:100,reps:5}]}]},
  {id:2,pid:1,date:agoStr(2),menuId:200,totalVolume:6000,results:[{exName:'ベンチプレス',sets:[{weight:105,reps:5},{weight:105,reps:5}]}]},
  {id:3,pid:1,date:agoStr(4),kind:'self',totalVolume:0,fitness:{ftype:'ランニング',minutes:30,km:5}}
];
D.cal=[{id:1,date:agoStr(9),type:'weight'},{id:2,date:agoStr(2),type:'weight'}];
D.i=[{id:1,pid:1,part:'膝',type:'捻挫',side:'右',date:agoStr(60),resolved:false,returnDate:agoStr(-5)},{id:2,pid:1,part:'肩',type:'脱臼',side:'左',date:agoStr(200),resolved:true,resolvedDate:agoStr(150)}];
D.r=[{id:1,injId:1,stage:2}];
T.mydata();flush();
var m=__els['main'].innerHTML;
ok('見出しMY DATA',has(m,'MY DATA'));
ok('期間セレクタ（setMdRange）',has(m,"setMdRange('30')")&&has(m,"setMdRange('all')"));
ok('①考察セクション',has(m,'あなたへの考察'));
ok('②コンディションセクション+canvas',has(m,'コンディション')&&has(m,'md-cond-chart'));
ok('③体組成セクション+canvas',has(m,'体組成')&&has(m,'md-bc-chart'));
ok('④トレーニングセクション+週間ボリューム',has(m,'トレーニング')&&has(m,'週間ボリューム'));
ok('④出席率タイル',has(m,'出席率'));
ok('④種目別セレクタ+canvas',has(m,'selectMdEx')&&has(m,'md-tex-chart'));
ok('⑤フィジカルセクション+canvas',has(m,'フィジカル')&&has(m,'md-ph-chart'));
ok('⑤Broncoチャート',has(m,'md-br-chart'));
ok('⑤ランクバッジ（SQ/BP/DL）',has(m,'SQ')&&has(m,'BP')&&has(m,'DL'));
ok('⑦怪我履歴セクション',has(m,'怪我の履歴'));
ok('⑦現在の怪我（膝 捻挫）',has(m,'右膝 捻挫'));
ok('⑦過去の怪我歴（肩 脱臼）',has(m,'左肩 脱臼'));
// チャートが生成された（md_接頭辞）
ok('charts.md_cond生成',!!charts.md_cond);
ok('charts.md_bc生成',!!charts.md_bc);
ok('charts.md_ph生成（5データセット）',charts.md_ph&&charts.md_ph.config.data.datasets.length===5);
ok('charts.md_br生成（軸反転）',charts.md_br&&charts.md_br.config.options.scales.y.reverse===true);
ok('charts.md_tex生成（種目別）',!!charts.md_tex);
// 再描画してもエラーなし（onSnapshot冪等・dC先行）
var beforeFail=__fail;
T.mydata();flush();
ok('再描画（冪等）で例外なし',__fail===beforeFail&&!!charts.md_ph);

// ============ 6. 期間切替（_mdRange）でチャート点数が変わる ============
print('--- 期間切替: _mdRangeで対象が変わる ---');
resetD();
D.p[0].height='180';
D.ph=[{id:1,pid:1,date:agoStr(5),squat:150},{id:2,pid:1,date:agoStr(20),squat:155},{id:3,pid:1,date:agoStr(100),squat:145}];
window._mdRange='30';T.mydata();flush();
var lab30=charts.md_ph?charts.md_ph.config.data.labels.length:0;
window._mdRange='all';T.mydata();flush();
var labAll=charts.md_ph?charts.md_ph.config.data.labels.length:0;
ok('30日=2点',lab30===2);
ok('全期間=3点',labAll===3);
ok('setMdRangeで_mdRange更新',(setMdRange('90'),window._mdRange==='90'));

// ============ 7. GPS枠: D.gsが無ければ非表示（P9まで） ============
print('--- GPS: D.gs無しは非表示 ---');
resetD();
D.ph=[{id:1,pid:1,date:agoStr(3),squat:150}];
T.mydata();var g1=__els['main'].innerHTML;
ok('D.gs無しでGPSセクション非表示',!has(g1,'GPS・試合スタッツ'));
D.gs=[{id:1,pid:1,date:TODAY}];
T.mydata();var g2=__els['main'].innerHTML;
ok('D.gsありでGPSセクション表示',has(g2,'GPS・試合スタッツ'));

// ============ 8. go('mydata')でルーティング ============
print('--- ルーティング: go(mydata) ---');
resetD();D.ph=[];
go('mydata');
ok('go(mydata)でcurTab=mydata',curTab==='mydata');
ok('データ薄でも完走（考察空メッセージ）',has(__els['main'].innerHTML,'記録が増えると'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('mydata tests failed');}
print('\nALL MYDATA TESTS PASSED');
