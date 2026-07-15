// P7b: 「今日は休む」= tlog(absent) のみに保持する設計の回帰テスト（player側）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_absence_sync.js
// 核心=(1)休むは tlog にのみ記録し a には一切書かない（a汚染防止＝レビュー13件の根本対策）
//       (2)保存は取引内で冪等（サーバー最新に同日欠席があれば無変更＝連打/複数端末レース対策）
//       (3)cancelTrainingRest は当日の休むtlogをハード削除＋Undo（aは触らない）
//       (4)cancelAbsence(正式申告の取消)は a のみ操作し tlog には触れない
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
myPid=1;
var TD=todayStr();
go=function(){};
clearTDraft=function(){};
rebuildE1rmFrom=function(pid,date,okc,errc){if(okc)okc();};
showSub=function(){};showTrainingHistory=function(){};
subView=null;
var _toasts=[];toast=function(m,a,fn){_toasts.push({m:m,a:a,fn:fn});};
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
function reset(){_toasts=[];__alerts.length=0;confirm=function(){return true;};}

print('--- 1) saveTrainingAbsent: tlog にのみ記録・a には書かない ---');
reset();setKey('tlog',[]);setKey('a',[]);
saveTrainingAbsent('m1','痛み・怪我');drain();
var t1=store('tlog');
ok('tlogに欠席レコード1件', t1.length===1&&t1[0].absent===true&&t1[0].absentReason==='痛み・怪我');
ok('a には一切書かない（汚染防止）', store('a').length===0);

print('--- 2) 二重防止: ローカルガード＋取引内冪等 ---');
// (a) ローカルガード: 保存後 D.tlog 更新済み → 2回目は案内のみで作らない
var before=store('tlog').length;
saveTrainingAbsent('m1','体調不良');drain();
ok('本日休養済みなら二重tlogを作らない(ローカル)', store('tlog').length===before);
// (b) 取引内冪等: クライアントD.tlogが空(stale)でもサーバー最新に同日欠席があれば無変更
reset();
D.tlog=[]; // クライアントは空に見える(guardすり抜け)
__store['tlog']=JSON.stringify([{id:900,pid:1,absent:true,absentReason:'その他',date:TD,results:[],totalVolume:0}]); // サーバーには既にある
saveTrainingAbsent('m1','時間がない');drain();
ok('取引内でサーバー最新を再確認し重複追加しない', store('tlog').length===1);

print('--- 3) cancelTrainingRest: 当日の休むtlogをハード削除＋Undo・aは不干渉 ---');
reset();
setKey('tlog',[{id:100,pid:1,absent:true,absentReason:'その他',date:TD,results:[],totalVolume:0}]);
setKey('a',[{id:9,date:TD,label:'',absentees:[{pid:2,reason:'欠席：発熱',source:'player'}]}]); // 無関係なa
cancelTrainingRest();drain();
ok('休むtlogをハード削除', store('tlog').length===0);
ok('a は一切触らない', store('a').length===1&&store('a')[0].absentees.length===1);
var undo=_toasts.filter(function(t){return t.fn;}).pop();
ok('Undo提示あり', undo&&typeof undo.fn==='function');
undo.fn();drain();
ok('Undoでtlog復元', store('tlog').some(function(l){return l.id===100;}));

print('--- 4) cancelAbsence(正式申告の取消): a のみ操作・tlogに触れない ---');
reset();
setKey('a',[{id:9,date:TD,label:'',absentees:[{pid:1,reason:'欠席：発熱',source:'player'}]}]);
setKey('tlog',[{id:200,pid:1,absent:true,absentReason:'痛み・怪我',date:TD,results:[]}]); // 別途存在する休むtlog
cancelAbsence();drain();
ok('a: 自分の申告を除去', !store('a').some(function(s){return (s.absentees||[]).some(function(x){return x.pid===1;});}));
ok('tlog: 無関係な休むtlogは消さない（過剰削除しない）', store('tlog').some(function(l){return l.id===200;}));

print('--- 5) 実施済みなら休む不可（実施と欠席の矛盾防止） ---');
reset();
setKey('tlog',[{id:300,pid:1,menuId:'m1',date:TD,kind:undefined,absent:false,results:[{exName:'BP'}],totalVolume:5000}]); // 本日チーム練習実施済み
setKey('a',[]);
saveTrainingAbsent('m1','時間がない');drain();
ok('本日実施済みなら欠席tlogを作らない', !store('tlog').some(function(l){return l.absent;}));
ok('実施tlogは残る', store('tlog').some(function(l){return l.id===300;}));
// 自主トレのみなら休める
reset();
setKey('tlog',[{id:301,pid:1,menuId:'m1',date:TD,kind:'self',absent:false,results:[{exName:'run'}],totalVolume:0}]);
setKey('a',[]);
saveTrainingAbsent('m1','時間がない');drain();
ok('自主トレのみなら休むを記録できる', store('tlog').some(function(l){return l.absent;}));

print('--- 6) undoCancelTrainingRest: 取消→再休養→Undo で同日2件にしない ---');
reset();
var A={id:400,pid:1,menuId:'m1',date:TD,absent:true,absentReason:'その他',results:[],totalVolume:0};
var B={id:401,pid:1,menuId:'m1',date:TD,absent:true,absentReason:'体調不良',results:[],totalVolume:0}; // 再休養で出来た別id
setKey('tlog',[B]); // Aは取消済み、その後Bが出来ている状態
undoCancelTrainingRest([A]);drain();
ok('同日欠席が既にあればUndoでAを復元しない(同日1件維持)', store('tlog').filter(function(l){return l.absent&&idEq(l.pid,1)&&l.date===TD;}).length===1);

if(__fail)print('\n'+__fail+' FAIL');else print('\nALL ABSENCE-SYNC TESTS PASSED');
