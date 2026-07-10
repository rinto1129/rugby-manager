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
ok('身長未登録導線は出ない（身長あり）',!has(md,'身長を登録'));
// 身長未登録→プロフィール設定サブ画面への導線
D.p[0].height='';
T.mydata();var md2=__els['main'].innerHTML;
ok('身長未登録でプロフィール設定導線',has(md2,'身長を登録')&&has(md2,'showProfileSettings()'));

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
ok('④週間ボリューム横スクロールラッパ',has(m,'id="md-wvol-scroll"')&&has(m,'overflow-x:auto'));
ok('④週間ボリューム各列flex:1 0 26px',has(m,'flex:1 0 26px'));
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

// ============ 7. GPS⑥（9-C）: ヒーロー/推移/自己ベスト/チーム内順位/非同期/期間連動/0分除外 ============
print('--- GPS⑥: D.gs無しは非表示 ---');
resetD();
D.ph=[{id:1,pid:1,date:agoStr(3),squat:150}];
_grCache={};
T.mydata();flush();var g1=__els['main'].innerHTML;
ok('D.gs無しでGPSセクション非表示',!has(g1,'md-gps-dist')&&!has(g1,'GPSデータを読み込み中')&&!has(g1,'走行距離'));

print('--- GPS⑥: 同期パス（_grCacheプリロード）でヒーロー/推移/自己ベスト/順位 ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'},{id:2,name:'スピ 次郎',position:'FB',year:3},{id:3,name:'ディ 三郎',position:'No.8',year:4}];
myPid=1;window._mdRange='90';
D.gs=[
  {id:101,date:agoStr(2),kind:'practice',label:'火曜練習',ts:2000},
  {id:102,date:agoStr(6),kind:'match',label:'vs 工大',team:'A',ts:1000}
];
_grCache={};
_grCache[101]=[
  {pid:1,min:70,dist:6800,wr:97,hsr:850,hsrN:40,spr:320,sprN:6,max:8.6},
  {pid:2,min:70,dist:5200,wr:74,hsr:600,hsrN:30,spr:210,sprN:3,max:9.1},
  {pid:3,min:70,dist:7400,wr:106,hsr:920,hsrN:44,spr:410,sprN:8,max:7.4}
];
_grCache[102]=[
  {pid:1,min:40,dist:4200,wr:105,hsr:520,hsrN:26,spr:260,sprN:4,max:8.9},
  {pid:2,min:80,dist:8000,wr:100,hsr:900,hsrN:50,spr:360,sprN:5,max:9.4},
  {pid:3,min:0,dist:0,wr:0,hsr:0,spr:0,sprN:0,max:0}   // p3は試合0分＝集計・順位から自動除外
];
T.mydata();flush();
var gm=__els['main'].innerHTML;
// ヒーロー：直近セッション=101(agoStr2>agoStr6)＝火曜練習・自分 dist6800→6.80km / max8.6→31.0km/h / sprN6
ok('ヒーローカード(gps-hero)',has(gm,'gps-hero'));
ok('ヒーロー直近=火曜練習(練習バッジ)',has(gm,'火曜練習')&&has(gm,'練習'));
ok('ヒーロー距離6.80km',has(gm,'6.80'));
ok('ヒーロー最高速度31.0km/h',has(gm,'31.0'));
ok('ヒーロースプリント6本',has(gm,'6<span class="u">本'));
ok('ヒーロー補助指標(ワークレート/高強度ラン/出場)',has(gm,'ワークレート')&&has(gm,'高強度ラン')&&has(gm,'出場'));
// ②距離＋高強度ラン推移チャート
ok('距離+高強度ラン推移 canvas',has(gm,'md-gps-dist'));
ok('charts.md_gps_dist=bar+line 2データセット',charts.md_gps_dist&&charts.md_gps_dist.config.data.datasets.length===2);
ok('  dataset0=bar(走行距離/y軸)',charts.md_gps_dist.config.data.datasets[0].type==='bar'&&charts.md_gps_dist.config.data.datasets[0].yAxisID==='y');
ok('  dataset1=line(高強度ラン/y1軸)',charts.md_gps_dist.config.data.datasets[1].type==='line'&&charts.md_gps_dist.config.data.datasets[1].yAxisID==='y1');
ok('  距離データ=[試4.2,火6.8]昇順',JSON.stringify(charts.md_gps_dist.config.data.datasets[0].data)==='[4.2,6.8]');
ok('  高強度ランデータ=[試520,火850]昇順',JSON.stringify(charts.md_gps_dist.config.data.datasets[1].data)==='[520,850]');
ok('  試合マーカー強調(pointRadius=[6,3])',JSON.stringify(charts.md_gps_dist.config.data.datasets[1].pointRadius)==='[6,3]');
// ③最高速度：推移＋自己ベスト（自己ベスト=max8.9→32.0km/h・直近ヒーローの31.0と別値）
ok('最高速度推移 canvas(2セッション)',has(gm,'md-gps-spd'));
ok('自己ベスト表示(32.0km/h)',has(gm,'自己ベスト')&&has(gm,'32.0'));
ok('charts.md_gps_spd=km/hデータ[試32.0,火31.0]',charts.md_gps_spd&&JSON.stringify(charts.md_gps_spd.config.data.datasets[0].data)==='[32,31]');
// ④チーム内順位（期間内・全選手集計・0分除外・名簿基準）。スプリントは本数(gpsSprN)＝ヒーロー3大数字と一致
// dist: p1=11000,p2=13200,p3=7400 → p1は2位/3 ; max: p1=8.9,p2=9.4,p3=7.4 → p1は2位/3 ; sprN: p1=10,p2=8,p3=8(102は0分除外) → p1は1位/3
ok('順位チップ(gps-rankchip)',has(gm,'gps-rankchip'));
ok('順位: 走行距離=2位',/rk">2<span class="u">位<\/span><\/div><div class="cap">走行距離/.test(gm));
ok('順位: 最高速度=2位',/rk">2<span class="u">位<\/span><\/div><div class="cap">最高速度/.test(gm));
ok('順位: スプリント(本数)=1位',/rk">1<span class="u">位<\/span><\/div><div class="cap">スプリント/.test(gm));
ok('順位: 母数=3人中',has(gm,'3人中'));
// 再描画冪等（onSnapshot 3連打でアニメ再発火/例外なし・dC先行）
var bfG=__fail;
T.mydata();flush();T.mydata();flush();
ok('GPS込み再描画（冪等）で例外なし',__fail===bfG&&!!charts.md_gps_dist);

print('--- GPS⑥: 非同期ロード（__store→loading→再描画・無限ループ無し） ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'}];
myPid=1;window._mdRange='90';curTab='mydata';subView=null;
D.gs=[{id:501,date:agoStr(1),kind:'practice',label:'月曜練習',ts:1}];
_grCache={};__store={};
__store['gr_501']=JSON.stringify([{pid:1,min:60,dist:6000,wr:100,hsr:700,hsrN:35,spr:300,sprN:5,max:8.0}]);
T.mydata();
var load1=__els['main'].innerHTML;
ok('未ロード時は「読み込み中」',has(load1,'GPSデータを読み込み中'));
ok('未ロード時はヒーロー未描画',!has(load1,'gps-hero'));
drain();flush(); // gpsLoadRowsRO の .then → callbackでT.mydata再描画 → チャートsetTimeout
var load2=__els['main'].innerHTML;
ok('ロード後にヒーロー表示(月曜練習)',has(load2,'gps-hero')&&has(load2,'月曜練習'));
ok('gr_行データがキャッシュされた',_grCache[501]&&_grCache[501].length===1);
ok('ロード後は「読み込み中」が消える（収束＝無限ループ無し）',!has(load2,'GPSデータを読み込み中'));

print('--- GPS⑥: 期間セレクタ(_mdRange)連動＝範囲外セッション除外 ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'}];
myPid=1;
D.gs=[{id:601,date:agoStr(5),kind:'practice',label:'今週',ts:2},{id:602,date:agoStr(200),kind:'practice',label:'半年前',ts:1}];
_grCache={};
_grCache[601]=[{pid:1,min:60,dist:6000,wr:100,hsr:700,hsrN:35,spr:300,sprN:5,max:8.0}];
_grCache[602]=[{pid:1,min:60,dist:9000,wr:150,hsr:1000,hsrN:50,spr:500,sprN:9,max:9.5}];
window._mdRange='30';T.mydata();flush();
var r30=__els['main'].innerHTML;
ok('30日: 範囲内601(今週)のみ・602(半年前)は除外',has(r30,'今週')&&!has(r30,'半年前'));
ok('30日: 1セッション→速度推移グラフ非表示＋案内',!has(r30,'md-gps-spd')&&has(r30,'2回以上になると'));
window._mdRange='all';T.mydata();flush();
ok('全期間: 601+602とも対象＝距離データ2点',charts.md_gps_dist&&charts.md_gps_dist.config.data.datasets[0].data.length===2);

print('--- GPS⑥: 自分が全セッション0分（出場なし）→ 案内・ヒーロー無し ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'},{id:2,name:'他 選手'}];
myPid=1;window._mdRange='90';
D.gs=[{id:701,date:agoStr(3),kind:'match',label:'欠場試合',ts:1}];
_grCache={};
_grCache[701]=[{pid:1,min:0,dist:0,wr:0,hsr:0,spr:0,sprN:0,max:0},{pid:2,min:60,dist:6000,wr:100,hsr:700,spr:300,sprN:5,max:8}];
T.mydata();flush();
var z=__els['main'].innerHTML;
ok('0分のみ→出場記録なし案内',has(z,'あなたが出場したGPSセッションの記録がありません'));
ok('0分のみ→ヒーロー無し',!has(z,'gps-hero'));

print('--- GPS⑥: 期間内にGPSセッションが無い（全て範囲外）→ 案内 ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'}];
myPid=1;window._mdRange='30';
D.gs=[{id:801,date:agoStr(120),kind:'practice',label:'昔の練習',ts:1}];
_grCache={};_grCache[801]=[{pid:1,min:60,dist:6000,wr:100,hsr:700,spr:300,sprN:5,max:8}];
T.mydata();flush();
var noRange=__els['main'].innerHTML;
ok('30日: 範囲内セッション0→「この期間のGPS記録がありません」',has(noRange,'この期間のGPS記録がありません'));
ok('30日: ヒーロー無し',!has(noRange,'gps-hero'));

// レビュー確定#2: チーム内順位の母数はD.p名簿基準（退部/卒業のorphan gr_行は除外＝9-Bランキングと同基準）
print('--- GPS⑥: 順位母数はD.p名簿基準（orphan pidを除外） ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'},{id:2,name:'現役 次郎'}]; // pid3は名簿に無い（退部想定）
myPid=1;window._mdRange='90';
D.gs=[{id:901,date:agoStr(3),kind:'practice',label:'練習',ts:1}];
_grCache={};
_grCache[901]=[
  {pid:1,min:60,dist:6000,wr:100,hsr:700,hsrN:35,spr:300,sprN:5,max:8.0},
  {pid:2,min:60,dist:5000,wr:83,hsr:600,hsrN:30,spr:250,sprN:4,max:7.8},
  {pid:3,min:60,dist:9000,wr:150,hsr:1000,hsrN:50,spr:500,sprN:9,max:9.9}  // orphan（名簿外）＝母数・順位から除外されるべき
];
T.mydata();flush();
var orphan=__els['main'].innerHTML;
// 名簿基準: 母数は在籍2名のみ。走行距離 p1=6000>p2=5000 → p1は1位/2人中（orphanの9000は無視）
ok('orphan除外: 母数=2人中（名簿在籍者のみ）',has(orphan,'2人中')&&!has(orphan,'3人中'));
ok('orphan除外: 走行距離=1位（名簿外の高値9000を無視）',/rk">1<span class="u">位<\/span><\/div><div class="cap">走行距離/.test(orphan));

// レビュー確定#1: スプリント順位はヒーローと同じ「本数(sprN)」基準（距離sprではない）
print('--- GPS⑥: スプリント順位は本数(sprN)基準でヒーローと一致 ---');
resetD();
D.p=[{id:1,name:'ラン 太郎',position:'WTB',year:2,height:'180'},{id:2,name:'距離 次郎'}];
myPid=1;window._mdRange='90';
D.gs=[{id:911,date:agoStr(3),kind:'practice',label:'練習',ts:1}];
_grCache={};
// p1: 本数多い(8本)・距離短い(200m) / p2: 本数少ない(2本)・距離長い(900m)
_grCache[911]=[
  {pid:1,min:60,dist:6000,wr:100,hsr:700,hsrN:40,spr:200,sprN:8,max:8.0},
  {pid:2,min:60,dist:6000,wr:100,hsr:700,hsrN:20,spr:900,sprN:2,max:8.0}
];
T.mydata();flush();
var sp=__els['main'].innerHTML;
ok('ヒーロー: 自分のスプリント本数=8本',has(sp,'8<span class="u">本'));
// 本数(sprN)基準なら p1(8本)>p2(2本) → 自分1位。もし距離(spr)基準ならp1(200)<p2(900)で2位になる＝本数基準であることを検証
ok('スプリント順位=1位（本数基準・距離基準なら2位のはず）',/rk">1<span class="u">位<\/span><\/div><div class="cap">スプリント/.test(sp));

// ============ 8. go('mydata')でルーティング ============
print('--- ルーティング: go(mydata) ---');
resetD();D.ph=[];
go('mydata');
ok('go(mydata)でcurTab=mydata',curTab==='mydata');
ok('データ薄でも完走（考察空メッセージ）',has(__els['main'].innerHTML,'記録が増えると'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('mydata tests failed');}
print('\nALL MYDATA TESTS PASSED');
