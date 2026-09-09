// ダッシュボード試合日チェックパネル（matchPanel・P1c-11最終形）と
// V.matchview（cal試合∪md日付の行ソース・P1c-3最終形）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_dash_staff.js
// P1c-11の契約: 「次の試合」1件に焦点（直近7日以内の未来戦優先、無ければ直近3日以内で未提出が残る過去戦）。
//   ・次の試合の見出し行（MD-n・メンバー表n名/未登録・メンバー表を開くボタン）
//   ・MATCH CHECK-IN（pitchProgressHtml・提出n/N・HIA n名/怪我 n名・未提出chip-late→goAddMatchDay）
//   ・全員提出済みなら「全員提出済み」の1行に畳まれる
//   ・当日でKO+2h前は「試合後に集計」の1行のみ（KO+2h経過後は通常表示に戻る）
//   ・レポートを開く／LINE用テキストをコピー導線
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function hhmm(d){return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
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

print('--- V.dash: matchPanel 次の試合1件に焦点・未来戦優先 ---');
baseline();
var futD=toDateStr(new Date(Date.now()+3*86400000));
setKey('cal',[
  {id:41,date:daysAgo(2),type:'match',title:'過去戦',opp:'A大',squad:[{pid:1,num:1},{pid:2,num:2}]},
  {id:42,date:futD,type:'match',title:'未来戦',opp:'B大',squad:[{pid:1,num:1},{pid:2,num:2}]}
]);
setKey('md',[]);
V.dash();
var hm=__els['main-ct'].innerHTML;
ok('次の試合パネルが出る',has(hm,'次の試合'));
ok('未来戦が優先して選ばれる(B大)',has(hm,'B大'));
ok('MD-nバッジが出る(未来なのでMD-3)',has(hm,'MD-3'));
ok('メンバー表n名が出る',has(hm,'メンバー表 2名'));
ok('MATCH CHECK-INパネルが出る',has(hm,'MATCH CHECK-IN'));
ok('未提出の選手がchip-lateで出る',has(hm,'選手1')&&has(hm,'選手2'));
ok('レポートを開くボタンがある',has(hm,'goMatchReport(\'42\')'));
ok('LINE用テキストをコピーがある',has(hm,'copyMdRemind(\'42\')'));

print('--- V.dash: matchPanel メンバー表未登録は案内バッジ ---');
baseline();
setKey('cal',[{id:43,date:futD,type:'match',title:'未来戦2',squad:[]}]);
V.dash();
var hm1b=__els['main-ct'].innerHTML;
ok('メンバー表未登録バッジが出る',has(hm1b,'メンバー表未登録'));
ok('提出n/N行(pitchProgressHtml)はsquad空なので出ない',!has(hm1b,'提出 0/'));

print('--- V.dash: matchPanel 全員提出済み(未来戦=常に表示対象)なら1行に畳む ---');
baseline();
setKey('cal',[{id:44,date:futD,type:'match',title:'全員提出戦',squad:[{pid:1,num:1},{pid:2,num:2}]}]);
setKey('md',[{id:1,pid:1,date:futD,evId:44},{id:2,pid:2,date:futD,evId:44}]);
V.dash();
var hm2=__els['main-ct'].innerHTML;
ok('全員提出済みの文言が出る',has(hm2,'全員提出済み'));
ok('goAddMatchDayへの未提出chipは出ない',!has(hm2,'goAddMatchDay'));

print('--- V.dash: matchPanel 過去戦は全員提出済みだと次の試合パネル自体が消える ---');
baseline();
setKey('cal',[{id:48,date:daysAgo(1),type:'match',title:'過去の全員提出戦',squad:[{pid:1,num:1},{pid:2,num:2}]}]);
setKey('md',[{id:1,pid:1,date:daysAgo(1),evId:48},{id:2,pid:2,date:daysAgo(1),evId:48}]);
V.dash();
var hm2c=__els['main-ct'].innerHTML;
ok('未提出者が残らない過去戦は次の試合パネルに出ない(対応不要のため)',!has(hm2c,'次の試合'));

print('--- V.dash: matchPanel 当日KO+2h前は集計待ちの1行のみ ---');
baseline();
var futKo=hhmm(new Date(Date.now()+60*60000)); // 1時間後キックオフ→まだKO+2h前
setKey('cal',[{id:45,date:daysAgo(0),type:'match',title:'本日の試合',ko:futKo,squad:[{pid:1,num:1}]}]);
V.dash();
var hm3=__els['main-ct'].innerHTML;
ok('集計待ちの文言が出る',has(hm3,'試合後に集計'));
ok('MATCH CHECK-INは出ない(集計待ち中)',!has(hm3,'MATCH CHECK-IN'));

print('--- V.dash: matchPanel 当日KO+2h経過後は通常表示に戻る ---');
baseline();
var pastKo=hhmm(new Date(Date.now()-4*60*60000)); // 4時間前キックオフ→KO+2hは2時間前で経過済み
setKey('cal',[{id:46,date:daysAgo(0),type:'match',title:'終わった試合',ko:pastKo,squad:[{pid:1,num:1}]}]);
V.dash();
var hm4=__els['main-ct'].innerHTML;
ok('KO+2h経過後はMATCH CHECK-INが出る',has(hm4,'MATCH CHECK-IN'));

print('--- V.dash: 窓外の試合しか無ければmatchPanelは出ない ---');
baseline();
setKey('cal',[{id:47,date:daysAgo(10),type:'match',title:'古い試合',squad:[{pid:1,num:1}]}]);
V.dash();
var hm5=__els['main-ct'].innerHTML;
ok('7日超未来/3日超過去の試合しか無ければ次の試合パネルは出ない',!has(hm5,'次の試合'));

print('--- V.dash: 試合が無ければmatchPanelは出ない ---');
baseline();
V.dash();
var hm2n=__els['main-ct'].innerHTML;
ok('次の試合パネルは出ない',!has(hm2n,'次の試合'));

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
