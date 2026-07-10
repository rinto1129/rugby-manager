// Phase2: 測定会編集(doEditMSess/doAddMSess) と mtype正式化(msessType) の模擬実行テスト
// 共有関数(msessType/getCurrentMSess/msessStatus)は player/staff 双方で、staff専用UI(doEditMSess等)は存在時のみ検証。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eq(name,got,want){var o=(got===want);if(!o){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
function setVal(id,v){var e=document.getElementById(id);e.value=v;}
var __alerts=[];alert=function(m){__alerts.push(String(m));};
var __toasts=[];if(typeof toast!=='undefined')toast=function(m){__toasts.push(String(m));};

print('--- msessType: 4段フォールバック（mtype > fromCalType > 名前 > phys） ---');
eq('mtype=bronco優先',msessType({mtype:'bronco',name:'MAX測定'}),'bronco');
eq('mtype=phys が名前「ブロンコ」を上書き',msessType({mtype:'phys',name:'6月ブロンコ計測'}),'phys');
eq('fromCalType=bronco_measure→bronco',msessType({fromCalType:'bronco_measure'}),'bronco');
eq('名前「ブロンコ」含み→bronco',msessType({name:'6月 ブロンコ計測'}),'bronco');
eq('該当なし→phys',msessType({name:'第1回MAX測定'}),'phys');
eq('空→phys',msessType({}),'phys');

print('--- msessStatus: mtype=phys が名前「ブロンコ」の罠を根絶 ---');
if(typeof D.p==='undefined'||!D.p)D.p=[];
D.p=[{id:1,name:'p1',position:'PR'}];D.ph=[];D.phskip=[];D.std=[];D.f=[];D.bc=[];
ok('名前ブロンコ+mtype:phys → isBronco=false',msessStatus({id:'z',name:'ブロンコ測定会',mtype:'phys',startDate:'2026-06-01',endDate:'2026-06-01'}).isBronco===false);
ok('名前ブロンコ+mtype無し → isBronco=true',msessStatus({id:'z',name:'ブロンコ測定会',startDate:'2026-06-01',endDate:'2026-06-01'}).isBronco===true);

print('--- getCurrentMSess(typeOpt): 種別で現在会を絞る ---');
todayStr=function(){return'2026-07-10';};
D.msess=[
  {id:'b',mtype:'bronco',startDate:'2026-07-08',endDate:'2026-07-10'},
  {id:'p',mtype:'phys',startDate:'2026-07-09',endDate:'2026-07-10'},
  {id:'oldname',name:'旧ブロンコ会',startDate:'2026-07-07',endDate:'2026-07-09'} // mtype無し・名前でbronco
];
eq("getCurrentMSess('bronco')は種別bronco",getCurrentMSess('bronco')&&getCurrentMSess('bronco').mtype==='bronco'?'bronco':getCurrentMSess('bronco')&&msessType(getCurrentMSess('bronco')),'bronco');
eq("getCurrentMSess('phys').id",getCurrentMSess('phys').id,'p');
ok("getCurrentMSess()（無指定）は非null",getCurrentMSess()!=null);
// mtype:'phys'は'bronco'指定にヒットしない
D.msess=[{id:'x',name:'ブロンコっぽい',mtype:'phys',startDate:'2026-07-09',endDate:'2026-07-10'}];
ok("mtype:phys は getCurrentMSess('bronco')にヒットしない",getCurrentMSess('bronco')==null);
ok("mtype:phys は getCurrentMSess('phys')にヒットする",getCurrentMSess('phys')!=null);

// ============ staff専用UI ============
if(typeof doEditMSess==='function'){
  print('--- doAddMSess: mtypeを保存 ---');
  D.msess=[];__store['msess']=JSON.stringify(D.msess);
  setVal('ms-name','2026年 第1回ブロンコ');setVal('ms-start','2026-07-01');setVal('ms-end','2026-07-05');setVal('ms-type','bronco');setVal('ms-note','');
  if(typeof popView!=='function')popView=function(){};
  doAddMSess();drain();
  ok('doAddMSess: 1件作成',D.msess.length===1);
  eq('doAddMSess: mtype=bronco保存',D.msess[0].mtype,'bronco');
  eq('doAddMSess: 名前保存',D.msess[0].name,'2026年 第1回ブロンコ');

  print('--- doEditMSess: 名前/日付/種別の更新反映 ---');
  D.msess=[{id:'e1',name:'旧名',startDate:'2026-06-01',endDate:'2026-06-03',mtype:'phys'}];
  __store['msess']=JSON.stringify(D.msess);
  setVal('ms-e-name','新・第2回測定');setVal('ms-e-start','2026-06-10');setVal('ms-e-end','2026-06-12');setVal('ms-e-type','bronco');
  doEditMSess('e1');drain();
  eq('doEditMSess: 名前更新',D.msess[0].name,'新・第2回測定');
  eq('doEditMSess: 開始日更新',D.msess[0].startDate,'2026-06-10');
  eq('doEditMSess: 終了日更新',D.msess[0].endDate,'2026-06-12');
  eq('doEditMSess: 種別更新(phys→bronco)',D.msess[0].mtype,'bronco');

  print('--- doEditMSess: 検証エラーは保存しない ---');
  D.msess=[{id:'e2',name:'元名',startDate:'2026-06-01',endDate:'2026-06-03',mtype:'phys'}];
  __store['msess']=JSON.stringify(D.msess);__alerts=[];
  setVal('ms-e-name','   ');setVal('ms-e-start','2026-06-01');setVal('ms-e-end','2026-06-03');setVal('ms-e-type','phys');
  doEditMSess('e2');drain();
  ok('空名はalertで拒否',__alerts.length>0);
  eq('空名では更新されない',D.msess[0].name,'元名');
  __alerts=[];
  setVal('ms-e-name','OK名');setVal('ms-e-start','2026-06-20');setVal('ms-e-end','2026-06-10');setVal('ms-e-type','phys');
  doEditMSess('e2');drain();
  ok('start>endはalertで拒否',__alerts.length>0);
  eq('start>endでは更新されない',D.msess[0].name,'元名');

  print('--- goMSessDetail: 編集フォームが値プリフィル＋種別selected ---');
  if(typeof pushView==='function'){
    var __pushed='';pushView=function(t,html){__pushed=html;};
    D.p=[{id:1,name:'田中',position:'PR'}];D.ph=[];D.phskip=[];
    D.msess=[{id:'d1',name:'第3回<測定>',startDate:'2026-05-01',endDate:'2026-05-03',mtype:'bronco'}];
    goMSessDetail('d1');
    ok('編集フォームname入力あり',has(__pushed,'id="ms-e-name"'));
    ok('名前はescapeHtmlされる',has(__pushed,'第3回&lt;測定&gt;'));
    ok('bronco種別がselected',has(__pushed,'value="bronco" selected')||has(__pushed,"value=\"bronco\" selected"));
    ok('保存ボタンにdoEditMSess',has(__pushed,"doEditMSess('d1')"));
  }
}

print(__fail===0?'ALL MSESS-EDIT TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('msess edit tests failed');
