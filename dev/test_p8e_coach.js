// P8e: coach IA — 週報カード(今週vs先週)・選手名検索・ポジションマトリクス選手タップ・ホーム統合
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_p8e_coach.js
// 核心: (1)weeklyDeltaData=月曜起点で今週/先週を分計（提出率は経過日数補正・BIG3は週内測定者のみ/無週はnull）
//       (2)週報カードは増減チップ（怪我は減=緑）・比較なし表示 (3)検索→openPlayer
//       (4)ポジション行タップで選手一覧展開→選手タップで個人レポート
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
var _els={};
var _origGet=document.getElementById;
document.getElementById=function(id){if(!_els[id])_els[id]=_origGet(id);return _els[id];};
function el(id){return document.getElementById(id);}

// 今週月曜/先週の日付をプロダクションと同じ式で導出（曜日に依存しないテストにする）
var _now=new Date(todayStr()+'T00:00:00');var _dow=(_now.getDay()+6)%7;
var MON=new Date(_now);MON.setDate(_now.getDate()-_dow);var MONS=toDateStr(MON);
var LMON=new Date(MON);LMON.setDate(MON.getDate()-7);var LMONS=toDateStr(LMON);
var LTUE=new Date(LMON);LTUE.setDate(LMON.getDate()+1);var LTUES=toDateStr(LTUE);
var TODAY=todayStr();

setKey('p',[{id:1,name:'山田太郎',position:'PR',year:2},{id:2,name:'佐藤次郎',position:'SO',year:3}]);
['i','r','f','ph','a','md','wc','bc','ann','offday','cal','matchsel','tape','tapeslot','phskip','rtpl','rplan','rlog','rtest_tpl','rtest','msess','injcomm','chart','tmenu','tlog','texlist','e1rm','pp','std','tgroup','gs','ms'].forEach(function(k){setKey(k,[]);});

print('--- 1) weeklyDeltaData ---');
setKey('tlog',[
  {id:1,pid:1,date:TODAY,results:[],kind:'team'},           // 今週1件
  {id:2,pid:2,date:TODAY,absent:true},                       // 欠席は数えない
  {id:3,pid:1,date:LMONS,results:[],kind:'team'},            // 先週2件
  {id:4,pid:2,date:LTUES,results:[],kind:'team'},
  {id:5,pid:1,date:LTUES,results:[],kind:'self'}             // 自主は数えない
]);
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:LMONS}]); // 先週の新規1
setKey('f',[{id:1,pid:1,date:TODAY,rpe:5,sleep:7},{id:2,pid:2,date:TODAY,rpe:5,sleep:7},
            {id:3,pid:1,date:LMONS,rpe:5,sleep:7}]);
setKey('ph',[
  {id:1,pid:1,date:TODAY,squat:150,bench:100,deadlift:180},  // 今週BIG3=430
  {id:2,pid:1,date:LTUES,squat:140,bench:100,deadlift:170}   // 先週BIG3=410
]);
var w=weeklyDeltaData();
ok('稼働 今週1/先週2',w.tr[0]===1&&w.tr[1]===2);
ok('新規怪我 今週0/先週1',w.inj[0]===0&&w.inj[1]===1);
// P8レビュー(9): 却下済み(approved===false)の誤報告は数えない
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:LMONS},
            {id:11,pid:2,resolved:false,part:'肩',type:'打撲',date:LMONS,approved:false,source:'player'}]);
ok('却下済みは新規怪我に数えない',weeklyDeltaData().inj[1]===1);
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:LMONS}]);
ok('BIG3平均 今週430/先週410',w.big3[0]===430&&w.big3[1]===410);
// 提出率: 今週=2件/(2名×経過日数)・先週=1件/(2名×7日)
var daysThis=_dow+1;
ok('提出率の分母補正',w.sub[0]===Math.round(2/(2*daysThis)*100)&&w.sub[1]===Math.round(1/14*100));

print('--- 2) weeklyReportCard ---');
var wc=weeklyReportCard();
ok('4行そろう',has(wc,'ウエイト・トレ実施')&&has(wc,'新規の怪我')&&has(wc,'コンディション提出率')&&has(wc,'BIG3平均'));
ok('怪我は減=緑(bd-g -1件)',/新規の怪我[\s\S]{0,400}?bd-g">-1件/.test(wc));
ok('BIG3は増=緑(+20kg)',/BIG3平均[\s\S]{0,400}?bd-g">\+20kg/.test(wc));
setKey('ph',[]);
ok('測定なし週は比較なし',has(weeklyReportCard(),'比較なし'));

print('--- 3) coachSearch ---');
el('csearch').value='山田';
coachSearch();
ok('名前ヒット',has(el('csearch-dd').innerHTML,'山田太郎')&&!has(el('csearch-dd').innerHTML,'佐藤'));
el('csearch').value='';
coachSearch();
ok('空文字でクローズ',el('csearch-dd').style.display==='none');
var opCalls=[];var _op=openPlayer;openPlayer=function(pid){opCalls.push(pid);};
coachSearchGo(2);
ok('選択→openPlayer(2)',opCalls.join()==='2');
openPlayer=_op;

print('--- 4) ポジションマトリクス 選手タップ ---');
window._posMxOpen={};
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:LMONS}]);
setKey('chart',[]);
var mx=renderPosMatrix();
ok('PR行に展開リスト（初期閉）',has(mx,'id="posmx-PR"')&&has(mx,'display:none'));
ok('展開内に選手名+openPlayer',has(mx,'山田太郎')&&has(mx,'openPlayer(1)'));
window._posMxOpen={PR:true};
mx=renderPosMatrix();
ok('開状態はdisplay:block',/id="posmx-PR" style="display:block/.test(mx));
window._posMxOpen={};

print('--- 5) ホーム統合スモーク ---');
curTab='home';_detailPid=null;
renderHomeView();
var hm=el('main').innerHTML;
ok('週報セクション',has(hm,'WEEKLY REPORT')&&has(hm,'今週 vs 先週'));
ok('マトリクスの展開ヒント',has(hm,'行をタップすると選手一覧'));

print(__fail===0?'ALL P8E-COACH TESTS PASSED':(__fail+' TESTS FAILED'));
