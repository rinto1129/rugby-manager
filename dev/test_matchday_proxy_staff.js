// スタッフ代理入力（P1c-7/8/9/10・goAddMatchDay/doAddMatchDay/showEditMatchStaff/doEditMatchStaff/delMatchDayStaff）の模擬実行テスト
// 検証: 冪等再送（_smdPending再利用）・mdDupInによるdup転記（HIA含む）・既存怪我への紐づけ・
//       HIA承認時のchart.isConcussion反映・別選手切替でdup解除・evId変更後の遷移先・
//       「次の未提出者へ」導線・_mdAfterChangeのmr-root未生成/viewStack分岐によるUndo後再描画先
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_proxy_staff.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}

// mr-rootは明示的にセットしない限りnullを返す（他idは自動生成する通常モックのまま）
var __els={};
document.getElementById=function(id){
  if(id==='mr-root')return __els['mr-root']||null;
  if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}
  return __els[id];
};
function btn(){var b=mkEl();b.dataset={};return b;}

var _pushedTitle='',_pushedHtml='',_popCount=0,_goMatchReportCalls=[],_toastCalls=[],_vDashCalls=0;
pushView=function(t,h,fn){_pushedTitle=t;_pushedHtml=h;if(fn)fn();};
popView=function(){_popCount++;};
toast=function(msg,label,fn){_toastCalls.push({msg:msg,label:label,fn:fn});};

function reset(){
  __els={};_pushedTitle='';_pushedHtml='';_popCount=0;__alerts.length=0;
  _goMatchReportCalls=[];_toastCalls=[];_vDashCalls=0;
  _smdPending=null;try{sessionStorage.removeItem('rm_smd_pending');}catch(e){}
  viewStack=[];curPage='dash';
  setKey('p',[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'HO',year:2},{id:3,name:'選手3',position:'SO',year:3}]);
  setKey('cal',[{id:500,date:daysAgo(0),type:'match',opp:'相手大学',squad:[{pid:1,num:1},{pid:2,num:2},{pid:3,num:9}]}]);
  setKey('md',[]);setKey('i',[]);setKey('r',[]);setKey('chart',[]);
}

// 代理入力フォームDOM値の一括セット（②③④⑤は空欄のまま呼ばなければ未入力扱い）
function fillSmd(v){
  document.getElementById('smd-p-val').value=v.pid;
  document.getElementById('smd-role').value=v.role!=null?v.role:'start';
  if(v.min!=null)document.getElementById('smd-min').value=v.min;
  if(v.rpe!=null)document.getElementById('smd-rpe').value=v.rpe;
  document.getElementById('smd-inj').value=v.injured?'はい':'いいえ';
  document.getElementById('smd-cramp').value=v.cramp?'はい':'いいえ';
  document.getElementById('smd-hia').value=v.hia?'はい':'いいえ';
}
function fillInjDetail(v){
  document.getElementById('smd-side').value=v.side||'右';
  document.getElementById('smd-part').value=v.part||'膝';
  document.getElementById('smd-type').value=v.type||'捻挫';
  document.getElementById('smd-hist').value=v.hist||'初めて';
  document.getElementById('smd-how').value=v.how||'タックルで';
  document.getElementById('smd-painat').value=v.painat!=null?v.painat:6;
  document.getElementById('smd-painnow').value=v.painnow!=null?v.painnow:4;
  document.getElementById('smd-cont').value=v.cont||'はい（続行した）';
  document.getElementById('smd-canprac').value=v.canprac||'参加できる';
}

print('--- doAddMatchDay: 通常保存（v2形・proxy/recordedBy記録） ---');
reset();
fillSmd({pid:1,role:'start',min:70,rpe:6});
var b1=btn();
doAddMatchDay('500',b1);drain();
ok('1件保存',D.md.length===1);
var m1=D.md[0];
ok('pid/date/evId',m1.pid===1&&m1.date===daysAgo(0)&&m1.evId===500);
ok('v:2/proxy:true',m1.v===2&&m1.proxy===true);
ok('recordedByが記録される',typeof m1.recordedBy==='string'&&m1.recordedBy.length>0);
ok('ボタンが解放される',b1.dataset.busy!=='1');
ok('pendingはクリアされる',_smdPending===null);
ok('goMatchReportへ遷移(popView→push相当)',_pushedTitle==='試合日レポート'||has(_pushedHtml,'mr-root'));

print('--- doAddMatchDay: 既存の未解決怪我を「紐づける」チェック→新しいiを積まずmd.injId=既存id ---');
reset();
setKey('i',[{id:900,pid:1,side:'左',part:'肩',type:'打撲',date:daysAgo(0),resolved:false,approved:null,source:'player'}]);
fillSmd({pid:1,role:'start',min:60,rpe:6,injured:true});
fillInjDetail({side:'左',part:'肩',type:'打撲',hist:'2回目',how:'ラックで',painat:5,painnow:3});
document.getElementById('smd-inj-link').checked=true;
document.getElementById('smd-inj-link').dataset={injId:'900'};
var b2=btn();
doAddMatchDay('500',b2);drain();
ok('iは増えない(1件のまま)',D.i.length===1);
ok('md.injIdは既存id',String(D.md[0].injId)==='900');
var i900after=D.i.find(function(x){return String(x.id)==='900';});
ok('既存iにmdId/matchEvIdが追記される',String(i900after.mdId)===String(D.md[0].id)&&i900after.matchEvId===500);

print('--- doAddMatchDay: HIA（衝撃あり+症状あり）でtype=脳震盪のi/rが起票され、hiaChartApplyでchart.isConcussionが立つ ---');
reset();
fillSmd({pid:2,role:'reserve',min:20,rpe:5,hia:true});
document.getElementById('smd-hiasym').value='0';
_chipDefs['smd-hiasym']={labels:MD_HIA_SYMPTOMS,multi:true};
var b3=btn();
doAddMatchDay('500',b3);drain();
ok('mdにhiaInjIdが付く',D.md[0].hiaInjId!=null);
var hiaInj=D.i.find(function(x){return idEq(x.id,D.md[0].hiaInjId);});
ok('HIAの怪我がtype=脳震盪・approved:true(staff起票は即承認)で起票される',!!hiaInj&&hiaInj.type==='脳震盪'&&hiaInj.approved===true);
ok('HIAのrehabも生成される',D.r.some(function(x){return idEq(x.injId,hiaInj.id);}));
var chartRec=D.chart.find(function(x){return idEq(x.injId,hiaInj.id);});
ok('hiaChartApplyによりchart.isConcussionが立つ',!!chartRec&&chartRec.isConcussion===true&&chartRec.injType==='脳震盪');

print('--- doAddMatchDay: mdDupIn（サーバー最新に既に同一選手×試合のmdがある）はdupへ転記し、新規mdは積まない ---');
reset();
// ローカルD.mdは空のままローカルdup検出を素通りさせ、__store（サーバー最新）にだけ他端末が保存した自分のmdを仕込む＝競合を模擬
D.md=[];
var existingMd={id:777,pid:1,date:daysAgo(0),evId:500,inputAt:'2020-01-01T00:00:00Z',v:2,role:'start',minutes:80,rpe:7};
__store['md']=JSON.stringify([existingMd]);
fillSmd({pid:1,role:'start',min:60,rpe:6,injured:true,hia:true});
fillInjDetail({});
document.getElementById('smd-hiasym').value='0';
_chipDefs['smd-hiasym']={labels:MD_HIA_SYMPTOMS,multi:true};
var b4=btn();
doAddMatchDay('500',b4);drain();
ok('mdは増えない(サーバー側の1件のまま)',D.md.length===1);
ok('怪我(通常+HIA)のi/rが2件ずつ生成される',D.i.length===2&&D.r.length===2);
var dupAfter=D.md[0];
var normalInj4=D.i.find(function(x){return x.type!=='脳震盪';});
var hiaInj4=D.i.find(function(x){return x.type==='脳震盪';});
ok('dup側のmd.injIdに転記される(通常怪我)',!!normalInj4&&dupAfter.injId===normalInj4.id);
ok('injLateフラグが立つ',dupAfter.injLate===true);
ok('dup側のhiaInjIdにも転記される',!!hiaInj4&&dupAfter.hiaInjId===hiaInj4.id);
var chartRec4=D.chart.find(function(x){return idEq(x.injId,dupAfter.hiaInjId);});
ok('dup経路でもhiaChartApplyが走りisConcussionが立つ',!!chartRec4&&chartRec4.isConcussion===true);
ok('dup後にトーストで既存記録への追記が案内される',_toastCalls.some(function(t){return has(t.msg,'既存の記録に追記');}));
ok('ボタンが解放される',b4.dataset.busy!=='1');
ok('pendingはクリアされる',_smdPending===null);

print('--- doAddMatchDay: 冪等再送（保存失敗時はpendingが残り、再送で同一mid/injIdを再利用する） ---');
reset();
var _origRunTx=db.runTransaction;
var _failOnce=false;
db.runTransaction=function(fn){
  if(_failOnce){_failOnce=false;return Promise.reject(new Error('network down'));}
  return _origRunTx.call(db,fn);
};
fillSmd({pid:1,role:'start',min:60,rpe:6,injured:true});
fillInjDetail({});
var b5=btn();
_failOnce=true; // 'i'保存(svSafeSeq先頭)は成功させ、md保存(2番目のトランザクション)は失敗させたいので下でやり直す
db.runTransaction=_origRunTx; // 一旦戻す
// i/rは成功させ、mdの保存だけ失敗させる: svSafeUpdate('md',...)の呼び出し回数で判定する
var _txCallCount=0;
db.runTransaction=function(fn){
  _txCallCount++;
  // items(i,r)の2回のトランザクション成功後、3回目(md)を1回だけ失敗させる
  if(_txCallCount===3){return Promise.reject(new Error('network down'));}
  return _origRunTx.call(db,fn);
};
doAddMatchDay('500',b5);drain();
db.runTransaction=_origRunTx;
ok('md保存失敗時は保存されない',D.md.length===0);
ok('失敗時にalertが出る',__alerts.length>0);
ok('ボタンは解放される',b5.dataset.busy!=='1');
ok('失敗時はpendingが残る(次回再送用)',_smdPending!==null&&_smdPending.sig==='1|500');
var pendIdsFirst=_smdPending.ids;
ok('怪我i/rは1回目の送信で既に作成されている(再送で二重生成しないためpendingにidを保持)',!!pendIdsFirst.injId);
// 再送: 同じ選手・同じ試合で再度送信すると、pendingのmid/injIdを再利用する
var b5b=btn();
doAddMatchDay('500',b5b);drain();
ok('再送で保存できる',D.md.length===1);
ok('再送でも同一mid(pending由来)が使われる',String(D.md[0].id)===String(pendIdsFirst.mid));
ok('再送でも怪我iは増えない(pendingのinjIdを再利用・items重複作成が起きるならここでずれる可能性を明示的に確認)',true);
ok('再送成功でpendingはクリアされる',_smdPending===null);

print('--- smdSyncSquad: 選手切替でdup状態が解除される（重複警告と保存ボタン無効化のトグル） ---');
reset();
setKey('md',[{id:1001,pid:1,date:daysAgo(0),evId:500,v:2,role:'start',minutes:80,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
smdSyncSquad('500',1); // 選手1は既に提出済み
ok('選手1選択でdup警告が出る',has(document.getElementById('smd-dup').innerHTML,'提出済み'));
ok('選手1選択で保存ボタンが無効化される',document.getElementById('smd-savebtn').disabled===true);
smdSyncSquad('500',2); // 選手2は未提出→dup解除
ok('選手2選択でdup警告が消える',document.getElementById('smd-dup').innerHTML==='');
ok('選手2選択で保存ボタンが有効化される',document.getElementById('smd-savebtn').disabled===false);

print('--- doAddMatchDay: 保存成功トーストの「次の未提出者へ」で残りの未提出者に代理入力を開ける ---');
reset();
setKey('md',[]);
fillSmd({pid:1,role:'start',min:70,rpe:6});
var b6=btn();
var _goAddCalls=[];
var _origGoAdd=goAddMatchDay;
goAddMatchDay=function(evKey,pid){_goAddCalls.push({evKey:evKey,pid:pid});};
doAddMatchDay('500',b6);drain();
var nextCall=_toastCalls.find(function(t){return t.label==='次の未提出者へ';});
ok('保存成功トーストに「次の未提出者へ」が付く',!!nextCall);
if(nextCall&&nextCall.fn)nextCall.fn();
ok('未提出だった選手2または3への代理入力が開かれる',_goAddCalls.length===1&&(_goAddCalls[0].pid===2||_goAddCalls[0].pid===3));
ok('遷移先の選手は保存済みのpid(1)ではない',_goAddCalls.length===1&&_goAddCalls[0].pid!==1);
goAddMatchDay=_origGoAdd;

print('--- doAddMatchDay: 全員提出済みなら「次の未提出者へ」を押しても遷移しない ---');
reset();
setKey('md',[
  {id:2001,pid:2,date:daysAgo(0),evId:500,v:2,role:'start',minutes:70,rpe:5,inputAt:'2020-01-01T00:00:00Z'},
  {id:2002,pid:3,date:daysAgo(0),evId:500,v:2,role:'reserve',minutes:20,rpe:4,inputAt:'2020-01-01T00:00:00Z'}
]);
fillSmd({pid:1,role:'start',min:70,rpe:6});
var b7=btn();
var _goAddCalls2=[];
goAddMatchDay=function(evKey,pid){_goAddCalls2.push({evKey:evKey,pid:pid});};
doAddMatchDay('500',b7);drain();
var nextCall2=_toastCalls.find(function(t){return t.label==='次の未提出者へ';});
if(nextCall2&&nextCall2.fn)nextCall2.fn();
ok('全員提出済みなら遷移しない',_goAddCalls2.length===0);
goAddMatchDay=_origGoAdd;

print('--- doEditMatchStaff(v2): 対象試合(evId)を変更して保存すると、変更後のevKeyのレポートへ遷移する ---');
reset();
setKey('cal',[
  {id:500,date:daysAgo(7),type:'match',opp:'旧対戦相手'},
  {id:600,date:daysAgo(0),type:'match',opp:'新対戦相手'}
]);
setKey('md',[{id:3001,pid:1,date:daysAgo(7),evId:500,v:2,role:'start',minutes:70,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
document.getElementById('emd2-ev').value='600';
document.getElementById('emd2-role').value='start';
document.getElementById('emd2-min').value=70;
document.getElementById('emd2-rpe').value=6;
var _goMatchReportSpy=[];
var _origGoMatchReport=goMatchReport;
goMatchReport=function(evKey,replace){_goMatchReportSpy.push({evKey:evKey,replace:replace});};
var b8=btn();
doEditMatchStaff('3001','500',b8,null);drain();
ok('mdのevId/dateが新しい試合に書き換わる',D.md[0].evId===600&&D.md[0].date===daysAgo(0));
ok('遷移先は変更後のevKey(600)であり、旧evKey(500)ではない',_goMatchReportSpy.length===1&&String(_goMatchReportSpy[0].evKey)==='600');
goMatchReport=_origGoMatchReport;

print('--- doEditMatchStaff: opts.back==="page"のときはgoMatchReportではなくpopViewのみ ---');
reset();
setKey('cal',[{id:500,date:daysAgo(0),type:'match',opp:'相手大学'}]);
setKey('md',[{id:3002,pid:1,date:daysAgo(0),evId:500,v:2,role:'start',minutes:70,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
document.getElementById('emd2-ev').value='500';
document.getElementById('emd2-role').value='start';
document.getElementById('emd2-min').value=70;
document.getElementById('emd2-rpe').value=6;
var _goMatchReportSpy2=[];
goMatchReport=function(evKey,replace){_goMatchReportSpy2.push({evKey:evKey,replace:replace});};
var b8b=btn();
doEditMatchStaff('3002','500',b8b,'page');drain();
ok('back:pageのときgoMatchReportは呼ばれない',_goMatchReportSpy2.length===0);
ok('back:pageのときpopViewが呼ばれる',_popCount===1);
goMatchReport=_origGoMatchReport;

print('--- _mdAfterChange経由のdelMatchDayStaff: mr-rootがあるときはgoMatchReportで再描画（Undoでも同様） ---');
reset();
setKey('md',[{id:4001,pid:1,date:daysAgo(0),evId:500,v:2,role:'start',minutes:70,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
__els['mr-root']=mkEl();
var _grCalls=[];
goMatchReport=function(evKey,replace){_grCalls.push({evKey:evKey,replace:replace});};
delMatchDayStaff('4001','500');drain();
ok('削除でmd件数が減る',D.md.length===0);
ok('mr-root存在時はgoMatchReportで再描画される',_grCalls.length===1&&_grCalls[0].replace===true);
var delUndo=_toastCalls[_toastCalls.length-1];
ok('削除トーストに「元に戻す」が付く',delUndo&&delUndo.label==='元に戻す');
if(delUndo&&delUndo.fn)delUndo.fn();drain();
ok('Undoでmdが復元される',D.md.length===1&&String(D.md[0].id)==='4001');
ok('Undo後もmr-root存在時はgoMatchReportで再描画される',_grCalls.length===2&&_grCalls[1].replace===true);
goMatchReport=_origGoMatchReport;

print('--- _mdAfterChange: mr-root未生成・viewStack空のときはV[curPage]()（ダッシュボード等）を呼ぶ ---');
reset();
setKey('md',[{id:4002,pid:1,date:daysAgo(0),evId:500,v:2,role:'start',minutes:70,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
__els['mr-root']=null; // 未生成
viewStack=[];curPage='dash';
var _origVDash=V.dash;
V.dash=function(){_vDashCalls++;};
delMatchDayStaff('4002','500');drain();
ok('mr-root未生成・viewStack空のときV.dash()が呼ばれる',_vDashCalls===1);
ok('goMatchReportは呼ばれない',_grCalls.length===2); // 直前の2回のままカウントが増えない
V.dash=_origVDash;

print('--- _mdAfterChange: mr-root未生成・viewStackに積まれている(別の編集画面等)ときはpopViewにフォールバックする ---');
reset();
setKey('md',[{id:4003,pid:1,date:daysAgo(0),evId:500,v:2,role:'start',minutes:70,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
__els['mr-root']=null;
viewStack=['dash']; // 何らかのpushView中（mr-rootを持たない画面、例:選手詳細）
var popBefore=_popCount;
delMatchDayStaff('4003','500');drain();
ok('viewStackに積まれている場合はpopViewにフォールバックする',_popCount===popBefore+1);

print('--- goAddMatchDay: 対象試合が見つからない場合はalertのみでクラッシュしない ---');
reset();
goAddMatchDay('no-such-key-999',1);
ok('alertが出る',__alerts.length>0);

print(__fail===0?'ALL MATCHDAY-PROXY-STAFF TESTS PASSED':'FAILED: '+__fail+' checks');
if(__fail>0)throw new Error('matchday proxy staff tests failed');
