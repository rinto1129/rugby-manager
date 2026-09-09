// 試合日チェックのtodo/ストリーク/マイページ連動（P1b-10・11）の模擬実行テスト
// 核心: 当日がメンバー表所属または提出済みならコンディション項目の代わりに試合日チェック項目が出る（KO前は「試合後に入力」注記）・
//       過去分(pendingMatchChecks)は当日を除外しevId版onclickを持つ・condStreakはmd提出日も加算・
//       mypageの試合カードは未入力n件/入力済みを表示しコンディションカードはhasCondOn(f無しmdありでも入力済み)扱いになる
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_todo.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

function reset(){
  __els={};
  try{sessionStorage.removeItem('rm_todo_sig');}catch(e){}
  setKey('p',[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'HO',year:2}]);
  setKey('cal',[]);setKey('md',[]);setKey('f',[]);setKey('i',[]);setKey('wc',[]);setKey('a',[]);
  D.offday=[];D.tmenu=[];D.tlog=[];D.bc=[];
  myPid=1;
}

print('--- todayTodoHtml: 今日が試合日でメンバー表所属・未提出→試合日チェック項目が出る（コンディション項目は出ない） ---');
reset();
setKey('cal',[{id:600,date:daysAgo(0),type:'match',opp:'A大学',squad:[{pid:1,num:1}]}]);
var t1=todayTodoHtml();
ok('コンディション入力の文言は出ない',!has(t1,'コンディション入力</span>'));
ok('今日の試合日チェックが出る',has(t1,'今日の試合日チェック'));
ok('urgent(未入力)強調',has(t1,'background:var(--red-bg)'));
try{sessionStorage.removeItem('rm_todo_sig');}catch(e){}

print('--- todayTodoHtml: KOが未来なら「試合後に入力」の注記が付く ---');
reset();
var future=new Date();future.setHours(future.getHours()+3);
var hh=('0'+future.getHours()).length>2?String(future.getHours()):('0'+future.getHours());
setKey('cal',[{id:601,date:daysAgo(0),type:'match',opp:'B大学',ko:hh+':00',squad:[{pid:1,num:1}]}]);
var t2=todayTodoHtml();
ok('試合後に入力の注記',has(t2,'試合後に入力'));
try{sessionStorage.removeItem('rm_todo_sig');}catch(e){}

print('--- todayTodoHtml: 今日提出済みなら完了扱い（打ち消し線・チェック） ---');
reset();
setKey('cal',[{id:602,date:daysAgo(0),type:'match',opp:'C大学',squad:[{pid:1,num:1}]}]);
setKey('md',[{id:701,pid:1,date:daysAgo(0),evId:602,v:2,role:'start',minutes:80,rpe:6,postFatigue:3,soreness:2,inputAt:new Date().toISOString()}]);
var t3=todayTodoHtml();
ok('今日の試合日チェックはdone(打ち消し線)',has(t3,'今日の試合日チェック')&&has(t3,'text-decoration:line-through'));
try{sessionStorage.removeItem('rm_todo_sig');}catch(e){}

print('--- todayTodoHtml: 過去分(daysAgo>0)は当日と重複せずevId版onclickを持つ ---');
reset();
var yd=toDateStr(new Date(Date.now()-86400000));
setKey('cal',[{id:603,date:yd,type:'match',opp:'D大学',squad:[{pid:1,num:1}]}]);
var t4=todayTodoHtml();
ok('昨日の試合日チェック項目',has(t4,'昨日の試合日チェック'));
ok('onclickはevId版(showMatchFormにevKeyと\'home\'を渡す)',has(t4,"showMatchForm('603','home')"));
try{sessionStorage.removeItem('rm_todo_sig');}catch(e){}

print('--- todayTodoHtml: 今日試合があってもメンバー表外かつ未提出ならコンディション項目のまま ---');
reset();
setKey('cal',[{id:604,date:daysAgo(0),type:'match',opp:'E大学',squad:[{pid:2,num:1}]}]); // pid1は入っていない
var t5=todayTodoHtml();
ok('コンディション入力のまま',has(t5,'コンディション入力'));
ok('今日の試合日チェックは出ない',!has(t5,'今日の試合日チェック'));
try{sessionStorage.removeItem('rm_todo_sig');}catch(e){}

print('--- condStreak: 試合日チェック提出日もストリークに加算される ---');
reset();
setKey('f',[{id:1,pid:1,date:daysAgo(1),rpe:5,sleep:7,duration:60}]);
setKey('md',[{id:702,pid:1,date:daysAgo(0),evId:900,v:2,role:'start',minutes:80,rpe:6,postFatigue:3,soreness:2}]);
ok('今日md提出＋昨日f提出で連続2日',condStreak(1)===2);

print('--- mypage: 未入力の試合日チェックがあれば試合カードに件数が出る／hasCondOn連動でコンディションカードが試合日チェック詳細に切り替わる ---');
reset();
setKey('cal',[{id:605,date:daysAgo(0),type:'match',opp:'F大学',squad:[{pid:1,num:1}]}]);
setKey('md',[{id:703,pid:1,date:daysAgo(0),evId:605,v:2,role:'start',minutes:80,rpe:6,postFatigue:3,soreness:2,inputAt:new Date().toISOString()}]);
T.mypage();
var mp1=document.getElementById('main').innerHTML;
ok('コンディションカードが試合日チェック入力済み表示に切り替わる',has(mp1,'試合日チェック入力済み'));
ok('コンディション未入力の赤文字は出ない(hasCondOnでtodayDone扱い)',!has(mp1,'コンディション入力</div><div style="font-size:11px;color:var(--red)'));

reset();
var yd2=toDateStr(new Date(Date.now()-2*86400000));
setKey('cal',[{id:606,date:yd2,type:'match',opp:'G大学',squad:[{pid:1,num:1}]}]);
T.mypage();
var mp2=document.getElementById('main').innerHTML;
ok('試合カードに未入力件数が出る',has(mp2,'未入力 1件'));

print(__fail===0?'ALL MATCHDAY-TODO TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('matchday todo tests failed');
