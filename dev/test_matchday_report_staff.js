// 試合日レポート（goMatchReport・P1c-3/4最終形）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_report_staff.js
// 検証: matchEvTitleのescape・孤児evId(cal未存在)でも日付一致で拾われる・同pidの重複mdにバッジ+古い方の削除ボタン・
//       要対応(mdTriage rank!=null)セクションが「その他の提出」より前に出る
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
var _pushedTitle='',_pushedHtml='',_popCount=0;
pushView=function(t,h,fn){_pushedTitle=t;_pushedHtml=h;if(fn)fn();};
popView=function(){_popCount++;};
toast=function(){};

function reset(){__els={};_pushedTitle='';_pushedHtml='';_popCount=0;__alerts.length=0;}

function baseline(){
  ['i','r','f','ph','a','md','wc','bc','ann','offday','cal','tape','tapeslot','phskip','rtpl','rplan','rlog',
   'rtest_tpl','rtest','msess','injcomm','chart','taperec','tmenu','tlog','texlist','e1rm','pp','std','tgroup',
   'gs','ms','gmap','trainers'].forEach(function(k){setKey(k,[]);});
  setKey('p',[
    {id:1,name:'選手1',position:'PR',year:2},
    {id:2,name:'選手2',position:'HO',year:2},
    {id:3,name:'選手3',position:'SO',year:3}
  ]);
}

print('--- goMatchReport: matchEvTitle(対戦相手名)はescapeされる ---');
reset();baseline();
setKey('cal',[{id:1,date:daysAgo(1),type:'match',opp:'<script>alert(1)</script>大学',squad:[{pid:1,num:1}]}]);
setKey('md',[]);
goMatchReport('1');
ok('生の<script>タグは出ない',!has(_pushedHtml,'<script>alert'));
ok('エスケープされた文字列は出る',has(_pushedHtml,'&lt;script&gt;'));

print('--- goMatchReport: cal未登録の孤児evIdでも日付一致で疑似イベントとして拾われる ---');
reset();baseline();
setKey('cal',[]); // evId=999のイベントはcalに存在しない
setKey('md',[{id:10,pid:1,date:daysAgo(2),evId:999,v:2,role:'start',minutes:80,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
goMatchReport(daysAgo(2));
ok('選手1の記録が出る',has(_pushedHtml,'選手1'));
ok('レポートのルート(mr-root)が描画される',has(_pushedHtml,'mr-root'));

print('--- goMatchReport: 同一選手の重複md提出にバッジと旧レコード削除ボタン ---');
reset();baseline();
setKey('cal',[{id:2,date:daysAgo(1),type:'match',opp:'A大',squad:[{pid:1,num:1}]}]);
setKey('md',[
  {id:20,pid:1,date:daysAgo(1),evId:2,v:2,role:'start',minutes:80,rpe:5,inputAt:'2020-01-01T00:00:00Z'},
  {id:21,pid:1,date:daysAgo(1),evId:2,v:2,role:'start',minutes:80,rpe:6,inputAt:'2020-01-02T00:00:00Z'}
]);
goMatchReport('2');
ok('重複バッジが出る',has(_pushedHtml,'重複 2件'));
ok('古い方(id20)の削除ボタンが出る',has(_pushedHtml,"delMatchDayStaff('20'"));
ok('新しい方(id21)は代表行として修正ボタンを持つ',has(_pushedHtml,"showEditMatchStaff('21'"));

print('--- goMatchReport: 要対応(HIA/怪我等)は「その他の提出」より前に描画される ---');
reset();baseline();
setKey('cal',[{id:3,date:daysAgo(1),type:'match',opp:'B大',squad:[
  {pid:1,num:1},{pid:2,num:2},{pid:3,num:9}
]}]);
setKey('md',[
  // pid1: 通常提出(要対応なし)
  {id:30,pid:1,date:daysAgo(1),evId:3,v:2,role:'start',minutes:80,rpe:5,postFatigue:2,soreness:1,perf:3,inputAt:'2020-01-01T00:00:00Z'},
  // pid2: HIA疑い→mdHia=true→rank0で最上段
  {id:31,pid:2,date:daysAgo(1),evId:3,v:2,role:'start',minutes:80,rpe:5,hiaImpact:true,hiaSymptoms:['頭痛'],inputAt:'2020-01-01T00:00:00Z'}
]);
goMatchReport('3');
var idxTodo=_pushedHtml.indexOf('要対応');
var idxOthers=_pushedHtml.indexOf('その他の提出');
ok('要対応セクションが出る',idxTodo>=0);
ok('その他の提出セクションが出る',idxOthers>=0);
ok('要対応がその他の提出より前に描画される',idxTodo>=0&&idxOthers>=0&&idxTodo<idxOthers);
ok('HIAバッジが要対応セクション内に出る',has(_pushedHtml.slice(idxTodo,idxOthers),'HIA'));

print('--- goMatchReport: 対象試合が見つからない場合はalertのみでクラッシュしない ---');
reset();baseline();
goMatchReport('no-such-key-xyz-999');
ok('alertが出る',__alerts.length>0);

print(__fail===0?'ALL MATCHDAY-REPORT TESTS PASSED':'FAILED: '+__fail+' checks');
