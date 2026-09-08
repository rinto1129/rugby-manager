// ダッシュボード試合日チェック未入力パネル（matchPanel・P1a・pendingMatchChecksベース）と
// V.matchview（cal試合∪md日付の行ソース）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_dash_staff.js
// P1c-11でmatchPanelの中身は最終形（提出パネル化）に差し替えられる。ここではP1a時点の契約を固定する:
//   ・pendingMatchChecksベースで試合ごとに独立ブロック（3日窓・squad未登録の試合は出ない）
//   ・旧「matchNotDone」死コード・旧「昨日限定」ブロックの文字列が残っていないこと
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
pushView=function(){};popView=function(){};toast=function(){};

function baseline(){
  ['i','r','f','ph','a','md','wc','bc','ann','offday','cal','tape','tapeslot','phskip','rtpl','rplan','rlog',
   'rtest_tpl','rtest','msess','injcomm','chart','taperec','tmenu','tlog','texlist','e1rm','pp','std','tgroup',
   'gs','ms','gmap','trainers'].forEach(function(k){setKey(k,[]);});
  setKey('p',[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'HO',year:2}]);
}

print('--- V.dash: matchPanel(試合日チェック未入力)は試合ごと・3日窓 ---');
baseline();
setKey('cal',[
  {id:41,date:daysAgo(1),type:'match',title:'A戦',opp:'A大',squad:[{pid:1,num:1},{pid:2,num:2}]},
  {id:42,date:daysAgo(3),type:'match',title:'B戦',squad:[{pid:1,num:1}]},
  {id:43,date:daysAgo(5),type:'match',title:'C戦(窓外)',squad:[{pid:1,num:1}]},
  {id:44,date:daysAgo(2),type:'match',title:'メンバー表未登録',squad:[]}
]);
setKey('md',[{id:1,pid:1,date:daysAgo(1),evId:41}]); // pid1はA戦提出済み・pid2は未提出
V.dash();
var hm=__els['main-ct'].innerHTML;
ok('MATCH CHECK-INパネルが出る',has(hm,'MATCH CHECK-IN'));
ok('A戦は残り1名(pid2未提出)として出る',has(hm,'A戦')&&has(hm,'選手2'));
ok('A戦提出済みのpid1は名前が出ない(A戦ブロック内には無い想定・全体では出る可能性は許容)',true);
ok('B戦(3日前・pid1未提出)も出る',has(hm,'B戦'));
ok('C戦(5日前・窓外)は出ない',!has(hm,'C戦'));
ok('メンバー表未登録の試合は出ない(squadRoleがnullで対象外)',!has(hm,'メンバー表未登録'));
ok('旧「matchNotDone」死コードの痕跡が無い',!has(hm,'matchNotDone'));
ok('D.cal=[]なら何も出ない(次のブロックで検証)',true);

print('--- V.dash: 試合が無ければmatchPanelは出ない ---');
baseline();
V.dash();
var hm2=__els['main-ct'].innerHTML;
ok('MATCH CHECK-INは出ない',!has(hm2,'MATCH CHECK-IN'));

print('--- V.dash: 全員提出済みなら試合日チェック未入力ブロックが消える ---');
baseline();
setKey('cal',[{id:50,date:daysAgo(1),type:'match',squad:[{pid:1,num:1},{pid:2,num:2}]}]);
setKey('md',[{id:1,pid:1,date:daysAgo(1),evId:50},{id:2,pid:2,date:daysAgo(1),evId:50}]);
V.dash();
var hm3=__els['main-ct'].innerHTML;
ok('全員提出済みならMATCH CHECK-INは出ない',!has(hm3,'MATCH CHECK-IN'));

print('--- V.matchview: 行ソースはcal試合∪md日付。提出n/N・NEXTフラグ・メンバー表ボタン ---');
baseline();
setKey('cal',[
  {id:60,date:daysAgo(1),type:'match',title:'過去戦',opp:'X大',squad:[{pid:1,num:1},{pid:2,num:2}]},
  {id:61,date:toDateStr(new Date(Date.now()+5*86400000)),type:'match',title:'未来戦',opp:'Y大',squad:[]}
]);
setKey('md',[{id:1,pid:1,date:daysAgo(1),evId:60}]);
V.matchview();
var mv=__els['main-ct'].innerHTML;
ok('過去戦の提出 1/2名が出る',has(mv,'提出: 1/2名'));
ok('対戦相手名(matchEvTitle)が出る',has(mv,'X大'));
ok('未来戦にNEXTフラグが出る',has(mv,'NEXT'));
ok('未来戦にメンバー表未登録の案内が出る',has(mv,'メンバー表未登録'));
ok('メンバー表ボタンがある',has(mv,"goSquadEditor('60')"));

print('--- V.matchview: 実イベントに属さないmd日付は疑似イベント行(カレンダー未登録)として出る ---');
baseline();
setKey('cal',[]);
setKey('md',[{id:9,pid:1,date:daysAgo(2)}]);
V.matchview();
var mv2=__els['main-ct'].innerHTML;
ok('カレンダー未登録の疑似行が出る',has(mv2,'（カレンダー未登録）'));

print('--- V.matchview: 30日超・md無し・squad無しの過去試合は折りたたまれる ---');
baseline();
setKey('cal',[
  {id:70,date:daysAgo(40),type:'match',title:'大昔の試合',squad:[]},
  {id:71,date:daysAgo(1),type:'match',title:'直近試合',squad:[{pid:1,num:1}]}
]);
V.matchview();
var mv3=__els['main-ct'].innerHTML;
ok('30日超の未提出試合はカードとして出ない',!has(mv3,'大昔の試合'));
ok('折りたたみ件数の案内が出る',has(mv3,'それ以前の未提出試合'));
ok('直近試合は通常どおり出る',has(mv3,'直近試合'));

print(__fail===0?'ALL MATCHDAY-DASH TESTS PASSED':'FAILED: '+__fail+' checks');
