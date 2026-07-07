// ステップ2: ダッシュボード刷新（myPhysCardHtml / todayTodoHtml / T.home / T.mypage）の模擬実行テスト
var __fail=0;
function ok(name,cond){
  if(!cond){__fail++;print('  NG '+name);}
  else print('  ok '+name);
}
function has(h,sub){return String(h).indexOf(sub)>=0;}

// getElementById を永続レジストリ化（$m()の描画結果を検査できるように）
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
D.std=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];

print('--- myPhysCardHtml (PR: ランクあり・帯内・弱点BP) ---');
myPid=1;
var h1=myPhysCardHtml();
ok('カードclass',has(h1,'myphys-card'));
ok('ポジ基準バッジ',has(h1,'PR基準'));
ok('SQ 1RM表示',has(h1,'>150<'));
ok('シルバーランク表示',has(h1,'シルバー'));
ok('次ランク表示(SQ ゴールドまで+7.5kg)',has(h1,'ゴールドまで +7.5kg'));
ok('弱点強化ポイント=ベンチプレス',has(h1,'強化ポイント: ベンチプレス'));
ok('弱点マーカーあり(i-target)',has(h1,'#i-target'));
ok('体重帯 帯内チップ',has(h1,'帯内 ')&&has(h1,'#i-check'));
ok('推奨帯の数値(94.2〜113.4)',has(h1,'推奨 94.2〜113.4kg'));
ok('体重の根拠表示',has(h1,'体重の根拠: 直近30日平均'));

print('--- myPhysCardHtml (WTB: DL未測定) ---');
myPid=2;
var h2=myPhysCardHtml();
ok('DL未測定表示',has(h2,'未測定'));
ok('WTB基準',has(h2,'WTB基準'));
ok('登録体重フォールバックの根拠',has(h2,'選手登録の体重'));

print('--- myPhysCardHtml (SH: 体重データなし) ---');
myPid=3;
var h3=myPhysCardHtml();
ok('体重なし案内',has(h3,'体重データがないため判定できません'));
ok('ランクバッジは出ない',!has(h3,'rkb'));

print('--- myPhysCardHtml (ポジション未登録) ---');
myPid=4;
var h4=myPhysCardHtml();
ok('ポジ未登録案内',has(h4,'ポジションが未登録'));

print('--- todayTodoHtml (未入力状態) ---');
myPid=1;
var t1=todayTodoHtml();
ok('コンディション項目あり',has(t1,'コンディション入力'));
ok('未完了カウント形式',has(t1,'完了'));
ok('取り消し線なし(未完了)',!has(t1,'line-through'));

print('--- todayTodoHtml (本日コンディション入力済み) ---');
D.f.push({id:32,pid:1,date:todayStr(),rpe:4,sleep:8,duration:30,inputAt:'T08:00'});
var t2=todayTodoHtml();
ok('入力済みで取り消し線',has(t2,'line-through'));

print('--- todayTodoHtml (昨日試合・未チェック) ---');
var yd=new Date();yd.setDate(yd.getDate()-1);var ydS=toDateStr(yd);
D.cal=[{id:41,date:ydS,type:'match',title:'練習試合'}];
D.matchsel=[1];
var t3=todayTodoHtml();
ok('試合日チェック項目',has(t3,'昨日の試合日チェック'));
ok('試合日チェックはurgent強調(赤背景)',has(t3,'background:var(--red-bg)'));
ok('試合日チェックはurgent強調(i-warnアイコン)',has(t3,'#i-warn')&&has(t3,'昨日の試合日チェック'));
ok('urgent強調は試合日チェックの1件のみ(コンディション入力等は対象外)',(t3.match(/background:var\(--red-bg\)/g)||[]).length===1);
D.md=[{id:51,pid:1,date:ydS}];
var t4=todayTodoHtml();
ok('チェック済みなら項目消える',!has(t4,'昨日の試合日チェック'));
D.cal=[];D.matchsel=[];D.md=[];

print('--- todayTodoHtml (トレーニング項目の出現条件) ---');
D.tmenu=[{id:91,scope:'all',title:'全体メニュー'}];
var tw1=todayTodoHtml();
ok('カレンダーにウエイトが無い日はトレ項目が出ない',!has(tw1,'ウエイトトレーニング'));
D.cal=[{id:42,date:todayStr(),type:'weight',title:'ウエイト'}];
var tw2=todayTodoHtml();
ok('ウエイト日+メニューありでトレ項目が出る',has(tw2,'ウエイトトレーニング'));
D.tmenu=[];
var tw3=todayTodoHtml();
ok('配信メニューが無ければ出ない',!has(tw3,'ウエイトトレーニング'));
D.tmenu=[{id:91,scope:'all',title:'全体メニュー'}];
D.offday=[todayStr()];
var tw4=todayTodoHtml();
ok('オフ日は出ない',!has(tw4,'ウエイトトレーニング'));
D.offday=[];
D.tlog=[{id:81,pid:1,menuId:91,date:todayStr(),results:[]}];
var tw5=todayTodoHtml();
ok('tlogレコード(実施/欠席申告)があればdone(onclick消失)',has(tw5,'ウエイトトレーニング')&&!has(tw5,"go('training')"));
D.cal=[];D.tmenu=[];D.tlog=[];

print('--- todayTodoHtml (怪我中・週次チェック未提出) ---');
D.i=[{id:61,pid:1,part:'膝',type:'捻挫',side:'右',resolved:false}];
var t5=todayTodoHtml();
ok('週次怪我チェック項目',has(t5,'週次怪我チェック（右膝）'));
D.wc=[{id:71,pid:1,injId:61,date:todayStr()}];
var t6=todayTodoHtml();
ok('提出済みなら消える',!has(t6,'週次怪我チェック'));
D.i=[];D.wc=[];

print('--- T.home (ログイン時=個人ダッシュボード) ---');
myPid=1;curTab='home';
T.home();
var home1=document.getElementById('main').innerHTML;
ok('あいさつに名前',has(home1,'テストPR'));
ok('今日やること統合',has(home1,'今日やること'));
ok('マイフィジカルカード',has(home1,'myphys-card'));
ok('チーム用ヘッダーは出ない',!has(home1,'福岡大学ラグビー部'));
ok('ランキングはリンク行に集約（TOP3カードは撤去）',has(home1,'ランキング')&&has(home1,"go('ranking')")&&!has(home1,'ランキング TOP3'));

print('--- T.home (未ログイン=チーム画面) ---');
myPid=null;
T.home();
var home2=document.getElementById('main').innerHTML;
ok('チーム用ヘッダー',has(home2,'福岡大学ラグビー部'));
ok('個人カードは出ない',!has(home2,'myphys-card'));
ok('今日やることは出ない',!has(home2,'今日やること'));

print('--- T.mypage (今日やることが撤去されている) ---');
myPid=1;
T.mypage();
var mp=document.getElementById('main').innerHTML;
ok('今日やることは出ない',!has(mp,'今日やること'));
ok('入力・記録メニューは残る',has(mp,'入力・記録'));
ok('フィジカルベストは残る',has(mp,'フィジカルベスト'));
ok('試合日翌日アラートは出ない',!has(mp,'試合日チェックが未入力です'));

print(__fail===0?'ALL DASH TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('dash tests failed');
