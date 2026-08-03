// P8d: staff IA — 要対応キュー(reqQueue/バッジ)・選手名検索・今週の伸び(physAlertsData)・当日実施マトリクス・dash統合
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_staff_ia_p8d.js
// 核心: (1)reqQueue=怪我承認+rtest承認(両クリアのみ)+レッドフラグ(当日RPE>=8/睡眠<=5)+督促(2日以上)
//       (2)バッジは0件で非表示 (3)検索は名前/ポジション部分一致→goPlayerDetail
//       (4)physAlertsData(since)は最新記録が今週の分だけ (5)マトリクス=実施/休/未実施の3状態
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function d(n){return toDateStr(new Date(new Date(todayStr()+'T00:00:00').getTime()-n*86400000));}
var _els={};
var _origGet=document.getElementById;
document.getElementById=function(id){if(!_els[id])_els[id]=_origGet(id);return _els[id];};
function el(id){return document.getElementById(id);}

setKey('p',[{id:1,name:'山田太郎',position:'PR',year:2},{id:2,name:'佐藤次郎',position:'SO',year:3}]);
['i','r','f','ph','a','md','wc','bc','ann','offday','cal','matchsel','tape','tapeslot','phskip','rtpl','rplan','rlog','rtest_tpl','rtest','msess','injcomm','chart','taperec','tmenu','tlog','texlist','e1rm','pp','std','tgroup','gs','ms','trainers'].forEach(function(k){setKey(k,[]);});

print('--- 1) reqQueue: 各要素の集計 ---');
// 全員に今日のコンディションを与えて督促・レッドフラグを消す基線
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:5,sleep:7},{id:2,pid:2,date:todayStr(),rpe:5,sleep:7}]);
var q=reqQueue();
ok('基線は0件',q.count===0);
// 怪我承認待ち
setKey('i',[{id:10,pid:1,resolved:false,source:'player',approved:null,part:'膝',type:'捻挫',date:todayStr()}]);
q=reqQueue();
ok('怪我承認待ち1',q.pendingInj.length===1&&q.count===1);
// rtest承認待ち（両方クリアのみ）
setKey('i',[{id:10,pid:1,resolved:false,source:'staff',approved:true,part:'膝',type:'捻挫',date:d(30)}]);
setKey('rtest',[{id:'rt1',injId:10,date:d(1),physPassed:true,fitPassed:false}]);
ok('片方クリアでは載らない',reqQueue().rtestPend.length===0);
setKey('rtest',[{id:'rt1',injId:10,date:d(2),physPassed:false,fitPassed:false},{id:'rt2',injId:10,date:d(1),physPassed:true,fitPassed:true}]);
ok('直近が両クリア→載る',reqQueue().rtestPend.length===1);
setKey('i',[{id:10,pid:1,resolved:false,source:'staff',approved:true,part:'膝',type:'捻挫',date:d(30),rtestApproved:true}]);
ok('承認済みは載らない',reqQueue().rtestPend.length===0);
setKey('i',[]);setKey('rtest',[]);
// レッドフラグ
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:9,sleep:7},{id:2,pid:2,date:todayStr(),rpe:5,sleep:4.5}]);
q=reqQueue();
ok('レッドフラグ2件(RPE9+睡眠4.5)',q.red.length===2);
// 督促（昨日も今日も無し・最終が2日以上前）
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:5,sleep:7},{id:3,pid:2,date:d(3),rpe:5,sleep:7}]);
q=reqQueue();
ok('督促1件(3日前が最終)',q.late.length===1&&q.late[0].pid===2);

print('--- 2) updateQueueBadge ---');
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:5,sleep:7},{id:2,pid:2,date:todayStr(),rpe:5,sleep:7}]);
updateQueueBadge();
ok('0件は非表示',el('queue-badge').style.display==='none');
setKey('i',[{id:10,pid:1,resolved:false,source:'player',approved:null,part:'膝',type:'捻挫',date:todayStr()}]);
updateQueueBadge();
ok('1件で表示+文言',el('queue-badge').style.display==='inline-flex'&&el('queue-badge').textContent==='要対応 1');
setKey('i',[]);
// P8レビュー(8): 督促(late)はバッジ件数に含めない（新入部員等で恒常膨張し警報機能が死ぬため。dashの提出パネルが担当）
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:5,sleep:7},{id:3,pid:2,date:d(5),rpe:5,sleep:7}]);
updateQueueBadge();
ok('督促のみではバッジ非表示',el('queue-badge').style.display==='none'&&reqQueue().late.length===1);
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:5,sleep:7},{id:2,pid:2,date:todayStr(),rpe:5,sleep:7}]);

print('--- 3) ヘッダー選手検索 ---');
el('psearch').value='山田';
hdrPlayerSearch();
ok('名前ヒット',has(el('psearch-dd').innerHTML,'山田太郎')&&!has(el('psearch-dd').innerHTML,'佐藤'));
el('psearch').value='so';
hdrPlayerSearch();
ok('ポジション小文字ヒット',has(el('psearch-dd').innerHTML,'佐藤次郎'));
el('psearch').value='該当なし語';
hdrPlayerSearch();
ok('該当なし表示',has(el('psearch-dd').innerHTML,'該当なし'));
el('psearch').value='';
hdrPlayerSearch();
ok('空文字でクローズ',el('psearch-dd').style.display==='none');
var _gpd=goPlayerDetail,gpdCalls=[];goPlayerDetail=function(pid){gpdCalls.push(pid);};
el('psearch').value='佐';
hdrSearchGo(2);
ok('選択→goPlayerDetail(2)+入力クリア',gpdCalls.join()==='2'&&el('psearch').value==='');
goPlayerDetail=_gpd;

print('--- 4) physAlertsData（since絞り） ---');
setKey('ph',[
  {id:1,pid:1,date:d(20),squat:100},{id:2,pid:1,date:d(0),squat:110},   // 最新=今日(+10 up)＝どの曜日でも今週内
  {id:3,pid:2,date:d(40),bench:100},{id:4,pid:2,date:d(30),bench:90}    // 先月 -10% down
]);
var alAll=physAlertsData();
ok('全期間はup+downの2件',alAll.length===2&&alAll.some(function(a){return a.t==='up';})&&alAll.some(function(a){return a.t==='down';}));
// 今週月曜以降に最新記録がある選手だけ
var mon=new Date(new Date(todayStr()+'T00:00:00'));mon.setDate(mon.getDate()-mon.getDay()+1);
var alWeek=physAlertsData(toDateStr(mon));
ok('今週分はupの1件のみ',alWeek.length===1&&alWeek[0].t==='up'&&alWeek[0].pid===1);
setKey('ph',[]);

print('--- 5) 当日実施マトリクス ---');
var mx=todayTrainingMatrixHtml();
ok('非weight日は案内文',has(mx,'ウエイト予定日ではありません'));
setKey('cal',[{id:1,date:todayStr(),type:'weight',title:'ウエイト'}]);
setKey('tmenu',[{id:70,name:'PUSH A',ptype:'push',scope:'all',exercises:[]}]);
setKey('pp',[{type:'push',date:d(1),by:'staff'}]);
setKey('tlog',[{id:80,pid:1,menuId:70,date:todayStr(),results:[],totalVolume:100}]);
mx=todayTrainingMatrixHtml();
ok('実施=✓メニュー名',has(mx,'PUSH A')&&/実施 <b[^>]*>1<\/b>/.test(mx));
ok('未実施=赤セル',has(mx,'未実施 →'));
ok('未実施1名カウント',/未実施 <b[^>]*>1<\/b>/.test(mx));
setKey('tlog',[{id:80,pid:1,menuId:70,date:todayStr(),results:[],totalVolume:100},{id:81,pid:2,date:todayStr(),absent:true,absentReason:'授業'}]);
mx=todayTrainingMatrixHtml();
ok('休養/欠席バッジ',has(mx,'休 授業')&&/未実施 <b[^>]*>0<\/b>/.test(mx));
setKey('cal',[]);setKey('tlog',[]);setKey('pp',[]);setKey('tmenu',[]);

print('--- 6) dash統合スモーク（rtest承認待ち+今週の伸び） ---');
setKey('f',[{id:1,pid:1,date:todayStr(),rpe:5,sleep:7},{id:2,pid:2,date:todayStr(),rpe:5,sleep:7}]);
setKey('i',[{id:10,pid:1,resolved:false,source:'staff',approved:true,part:'膝',type:'捻挫',date:d(30)}]);
setKey('rtest',[{id:'rt2',injId:10,date:d(1),physPassed:true,fitPassed:true}]);
setKey('ph',[{id:1,pid:1,date:d(20),squat:100},{id:2,pid:1,date:d(0),squat:110}]);
curPage='dash';
V.dash();
var dh=el('main-ct').innerHTML;
ok('復帰テスト承認待ちが緊急枠に',has(dh,'復帰テスト承認待ち'));
ok('今週の伸びカード',has(dh,'今週の伸び'));
ok('伸び内容(SQ 100→110)',has(dh,'100→110'));

print(__fail===0?'ALL STAFF-IA-P8D TESTS PASSED':(__fail+' TESTS FAILED'));
