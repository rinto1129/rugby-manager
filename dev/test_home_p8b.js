// P8b: ホーム再構成 — 7ブロック化・怪我クイック報告・週間振り返り・ストリーク・pp/グループのトレーニング移設
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_home_p8b.js
// 核心: (1)ホームからmyPhys/バッジ/pp/グループ/チーム系一覧が消えランキング・バッジリンクに集約
//       (2)怪我なし=報告赤ボタン/怪我あり=RTPカード（ボタンは重複させない）
//       (3)週間振り返りは月曜のみ・考察はgetMyInsightsの計算済み値
//       (4)condStreakは今日未入力なら昨日から遡る・空白日で途切れる
//       (5)quickInjuryTapは 0件=報告フォーム/1件=カルテ直行/複数=リハタブ
//       (6)ppカードはトレーニングタブへ（表示のみ=ppFlip無し）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
var _els={};
var _origGet=document.getElementById;
document.getElementById=function(id){if(!_els[id])_els[id]=_origGet(id);return _els[id];};

myPid=1;
setKey('p',[{id:1,name:'テスト選手',position:'PR',year:2}]);
['i','r','f','ann','cal','tmenu','tlog','wc','md','matchsel','offday','pp','a','ph','bc','msess','phskip','chart','rplan','rtpl','injcomm','e1rm','std','tape'].forEach(function(k){setKey(k,[]);});

print('--- 1) ホーム: 重複ブロック撤去とリンク集約 ---');
curTab='home';subView=null;
T.home();
var hm=_els['main'].innerHTML;
ok('myPhysカードは出ない',!has(hm,'myphys-card'));
ok('バッジカードは出ない',!has(hm,'badge-chip')&&!has(hm,'個のバッジ'));
ok('ppカードは出ない',!has(hm,'次のウエイト'));
ok('ランキング・バッジリンクに集約',has(hm,'ランキング・バッジ')&&has(hm,"go('ranking')"));

print('--- 2) チーム系一覧はstaff管掌＝playerホームに出ない ---');
setKey('cal',[{id:1,date:toDateStr(new Date(Date.now()-86400000)),type:'match',title:'試合'}]);
setKey('matchsel',[1]);
setKey('msess',[{id:'ms1',name:'夏測定',startDate:todayStr(),endDate:todayStr(),closed:false}]);
T.home();
hm=_els['main'].innerHTML;
ok('試合日チェック未入力一覧は出ない',!has(hm,'試合日チェック未入力'));
ok('あとN名チップは出ない',!has(hm,'あと1名'));
setKey('cal',[]);setKey('matchsel',[]);setKey('msess',[]);

print('--- 3) 怪我クイック報告: 怪我なし=赤ボタン/怪我あり=RTPカードのみ ---');
T.home();
hm=_els['main'].innerHTML;
ok('怪我なし→報告ボタン',has(hm,'怪我・痛みを報告する'));
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:todayStr()}]);
T.home();
hm=_els['main'].innerHTML;
ok('怪我あり→報告ボタン非表示',!has(hm,'怪我・痛みを報告する'));
ok('怪我あり→RTPカード',has(hm,'RETURN TO PLAY'));
setKey('i',[]);

print('--- 4) quickInjuryTap の分岐 ---');
var calls=[];
var _sir=showInjuryReport,_smc=showMyChart,_go=go;
showInjuryReport=function(){calls.push('report');};
showMyChart=function(id){calls.push('chart:'+id);};
go=function(t){calls.push('go:'+t);};
quickInjuryTap();
ok('0件→報告フォーム',calls.join()==='report');
setKey('i',[{id:10,pid:1,resolved:false}]);
calls=[];quickInjuryTap();
ok('1件→カルテ直行',calls.join()==='chart:10');
setKey('i',[{id:10,pid:1,resolved:false},{id:11,pid:1,resolved:false}]);
calls=[];quickInjuryTap();
ok('複数→リハタブ',calls.join()==='go:injury');
showInjuryReport=_sir;showMyChart=_smc;go=_go;setKey('i',[]);

print('--- 5) condStreak ---');
function d(n){return toDateStr(new Date(new Date(todayStr()+'T00:00:00').getTime()-n*86400000));}
setKey('f',[{id:1,pid:1,date:d(0)},{id:2,pid:1,date:d(1)},{id:3,pid:1,date:d(2)}]);
ok('3日連続',condStreak(1)===3);
setKey('f',[{id:2,pid:1,date:d(1)},{id:3,pid:1,date:d(2)}]);
ok('今日未入力なら昨日から2',condStreak(1)===2);
setKey('f',[{id:1,pid:1,date:d(0)},{id:3,pid:1,date:d(2)}]);
ok('空白日で途切れて1',condStreak(1)===1);
setKey('f',[{id:9,pid:2,date:d(0)}]);
ok('他人の記録は数えない',condStreak(1)===0);
setKey('f',[]);

print('--- 6) 週間振り返り: 月曜のみ・考察値を転記 ---');
var _ins=getMyInsights,_today=todayStr;
getMyInsights=function(){return[{lv:'good',t:'出席率が高い',d:''},{lv:'warn',t:'睡眠が短い',d:''}];};
todayStr=function(){return'2026-08-03';}; // 月曜
var wk=weeklyReviewCardHtml();
ok('月曜はカード表示',has(wk,'WEEKLY REVIEW')&&has(wk,'出席率が高い'));
todayStr=function(){return'2026-08-04';}; // 火曜
ok('火曜は非表示',weeklyReviewCardHtml()==='');
getMyInsights=function(){return[];};
todayStr=function(){return'2026-08-03';};
ok('考察ゼロなら非表示',weeklyReviewCardHtml()==='');
getMyInsights=_ins;todayStr=_today;

print('--- 7) トレーニングタブにpp（表示のみ）とグループ ---');
setKey('pp',[{type:'push',date:d(1),by:'staff'}]);
curTab='training';subView=null;
T.training();
var tr=_els['main'].innerHTML;
ok('ppカード表示',has(tr,'次のウエイト'));
ok('flip/undoボタンは無い(staff集約)',!has(tr,'ppFlip')&&!has(tr,'ppUndo'));
setKey('pp',[]);

print(__fail===0?'ALL HOME-P8B TESTS PASSED':(__fail+' TESTS FAILED'));
