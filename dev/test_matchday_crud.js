// 試合日チェックのCRUD（P1b-6〜9・showMatchDetail/showEditMatch(V2)/doEditMatch(V2)/delMatchDay/showInjuryReportのmdId連携）の模擬実行テスト
// 核心: v2は新フォーム(showEditMatchV2)へ・旧md(v無し)はroleが日本語文字列のまま・vフィールドも無いままdoEditMatch(旧)で編集される（互換維持）・
//       delMatchDayはconfirm無し即削除+Undoトースト（復元時にmdDupInで二重復元しない）・
//       試合日チェックから「追加で報告する」→showInjuryReport(opts)でsource:'match'・mdId連携・完了後にmd.injured/injIdが転記される
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_crud.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function flushTimers(){var t=__timeouts.slice();__timeouts.length=0;t.forEach(function(fn){fn();});}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

var _toasts=[];
var _origToast=toast;
toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};

var _goCalls=[];
var _origGo=go;
go=function(tab){_goCalls.push(tab);}; // 画面遷移は記録のみ（実DOM描画不要なテストのため上書き）

function btn(){var b=mkEl();b.dataset={};return b;}

function reset(){
  __els={};_toasts.length=0;_goCalls.length=0;__alerts.length=0;
  _mdPending=null;_irOpts=null;
  setKey('p',[{id:1,name:'選手1',position:'PR',year:2}]);
  setKey('cal',[{id:800,date:daysAgo(3),type:'match',opp:'テスト大学',squad:[{pid:1,num:1}]}]);
  setKey('md',[]);setKey('i',[]);setKey('r',[]);
  myPid=1;
}

print('--- showEditMatch: v2レコードはshowEditMatchV2へ分岐しemd2-系のフィールドが復元される ---');
reset();
setKey('md',[{id:810,pid:1,date:daysAgo(3),evId:800,v:2,role:'start',minutes:70,rpe:6,postFatigue:3,soreness:2,sorenessParts:['大腿'],perf:4,inputAt:new Date().toISOString()}]);
showEditMatch(810);flushTimers();
ok('emd2-roleに値が復元される',document.getElementById('emd2-role').value==='start');
ok('emd2-minに値が復元される',String(document.getElementById('emd2-min').value)==='70');
ok('emd2-rpeに値が復元される',String(document.getElementById('emd2-rpe').value)==='6');

print('--- doEditMatchV2: 出場分>0のままRPE/パフォーマンスを空にすると保存拒否・alertが出る ---');
reset();
setKey('md',[{id:811,pid:1,date:daysAgo(3),evId:800,v:2,role:'start',minutes:70,rpe:6,postFatigue:3,soreness:2,perf:4}]);
showEditMatch(811);flushTimers();
document.getElementById('emd2-rpe').value='';
document.getElementById('emd2-perf').value='';
document.getElementById('emd2-fpost').value=4;
document.getElementById('emd2-sore').value=2;
var eb1=btn();
doEditMatchV2(811,eb1);drain();
ok('保存されない(元の値のまま)',D.md.find(function(m){return idEq(m.id,811);}).rpe===6);
ok('alertが出る',__alerts.length>=1);

print('--- doEditMatchV2: 正しく入力すれば更新され、修正した値が反映される ---');
reset();
setKey('md',[{id:812,pid:1,date:daysAgo(3),evId:800,v:2,role:'start',minutes:70,rpe:6,postFatigue:3,soreness:2,perf:4}]);
showEditMatch(812);flushTimers();
document.getElementById('emd2-role').value='reserve';
document.getElementById('emd2-min').value=20;
document.getElementById('emd2-rpe').value=5;
document.getElementById('emd2-fpost').value=2;
document.getElementById('emd2-sore').value=1;
document.getElementById('emd2-perf').value=3;
var eb2=btn();
doEditMatchV2(812,eb2);drain();
var m812=D.md.find(function(m){return idEq(m.id,812);});
ok('roleが更新される',m812.role==='reserve');
ok('minutes/rpeが更新される',m812.minutes===20&&m812.rpe===5);
ok('editedAtが付く',typeof m812.editedAt==='string');
ok('ボタンが解放される',eb2.dataset.busy!=='1');

print('--- showEditMatch: 旧形式(v無し)はdoEditMatch(旧)のまま・role文字列・injured/crampサブフィールドは触らない ---');
reset();
setKey('md',[{id:820,pid:1,date:daysAgo(3),role:'スタート',fatiguePre:3,fatiguePost:5,sleepTime:'23:00',wakeTime:'07:00',breakfast:'はい',injured:true,injPart:'膝',injSide:'右',injType:'捻挫'}]);
showEditMatch(820);flushTimers(); // v無しなので旧フォーム
document.getElementById('emd-fpre').value=2;
document.getElementById('emd-fpost').value=4;
var eb3=btn();
doEditMatch(820,eb3);drain();
var m820=D.md.find(function(m){return idEq(m.id,820);});
ok('vフィールドは付与されない(旧のまま)',m820.v===undefined);
ok('roleは日本語文字列のまま',m820.role==='スタート');
ok('疲労度は更新される',m820.fatiguePost===4);
ok('怪我サブフィールドは変更されない(injPart)',m820.injPart==='膝');

print('--- delMatchDay: confirm無しで即削除され、Undoで復元できる ---');
reset();
setKey('md',[{id:830,pid:1,date:daysAgo(3),evId:800,v:2,role:'start',minutes:70,rpe:6,postFatigue:3,soreness:2,perf:4}]);
delMatchDay(830);drain();
ok('confirmは呼ばれていない前提でも即削除される',D.md.length===0);
ok('Undo付きトーストが出る',_toasts.length===1&&_toasts[0].a==='元に戻す');
_toasts[0].fn();drain();
ok('Undoで復元される',D.md.length===1&&idEq(D.md[0].id,830));

print('--- delMatchDay→Undo: 復元しようとした時点で既に同じ試合の別mdが存在する場合は復元しない(mdDupIn) ---');
reset();
setKey('md',[{id:831,pid:1,date:daysAgo(3),evId:800,v:2,role:'start',minutes:70,rpe:6,postFatigue:3,soreness:2,perf:4}]);
delMatchDay(831);drain();
var savedUndoFn=_toasts[0].fn;
// Undo実行前に、別端末が同じ試合へ新しいmdを保存した状況を模擬
setKey('md',[{id:999,pid:1,date:daysAgo(3),evId:800,v:2,role:'reserve',minutes:10,rpe:4,postFatigue:2,soreness:1,perf:3}]);
_toasts.length=0;
savedUndoFn();drain();
ok('831は復元されない(重複回避)',!D.md.some(function(m){return idEq(m.id,831);}));
ok('999はそのまま残る',D.md.some(function(m){return idEq(m.id,999);}));
ok('復元できなかった旨のトーストが出る',_toasts.length===1&&has(_toasts[0].m,'別の記録が既に登録されています'));

print('--- showInjuryReport(opts)→doInjuryReport: mdId連携で試合日チェック側にinjured/injIdが転記される ---');
reset();
setKey('md',[{id:840,pid:1,date:daysAgo(3),evId:800,v:2,role:'start',minutes:70,rpe:6,postFatigue:3,soreness:2,perf:4,injured:false}]);
showInjuryReport({mdId:840,evId:800,date:daysAgo(3)});
ok('_irOptsにmdIdが保持される',_irOpts&&_irOpts.mdId===840);
document.getElementById('ir-date').value=daysAgo(3);
document.getElementById('ir-side').value='左';
document.getElementById('ir-part').value='肩';
document.getElementById('ir-type').value='打撲';
document.getElementById('ir-how').value='コンタクトで';
document.getElementById('ir-pain').value=5;
document.getElementById('ir-canprac').value='参加できる';
document.getElementById('ir-note').value='';
var ib=btn();
doInjuryReport(ib);drain();
ok('iが1件生成されsource=match・mdIdが付く',D.i.length===1&&D.i[0].source==='match'&&D.i[0].mdId===840);
var m840=D.md.find(function(m){return idEq(m.id,840);});
ok('mdにinjured/injIdが転記される',m840.injured===true&&m840.injId===D.i[0].id);
ok('injLateフラグが立つ(後日申告)',m840.injLate===true);
ok('_irOptsはクリアされる',_irOpts===null);

go=_origGo;toast=_origToast;
print(__fail===0?'ALL MATCHDAY-CRUD TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('matchday crud tests failed');
