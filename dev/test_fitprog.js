// Phase 8: Fitプログラム（ptype:'fitness'）テスト（staff/player 両対応・自動判別）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_fitprog.js
//       jsc dev/prelude.js /tmp/player.js dev/test_fitprog.js
// 仕様:
//  staff: saveFitProg（ptype:'fitness'・items整形・exercises:[]・スロット不変条件なし）/ V.trainingで通常メニューと分離 /
//         goFitProgDetail 実施者一覧=tlogのprogramId照合（数値/文字列両対応・自由記録=programIdなしは除外）
//  player: getMyMenusからfitness除外・getFitMenusで別出し / startFitProgram プレフィル / saveSelfFitness programId付与 /
//         フィットネスログ(programId付)がslimTlogRec/集計を素通り（exercises:[]・results:[]で例外ゼロ）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,s){return String(h).indexOf(s)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
if(typeof window.scrollY==='undefined')window.scrollY=0;
// 起動時のld()→go()チェーンを流しきる（後のdrain()で画面が上書きされる偽NGを防ぐ）
drain();

var TODAY=todayStr();
var __pushedTitle='',__pushedHtml='';

var IS_STAFF=(typeof saveFitProg==='function');
var IS_PLAYER=(typeof startFitProgram==='function');

// ============================================================
if(IS_STAFF){
  print('=== STAFF: フィットネスプログラム ===');
  pushView=function(t,h){__pushedTitle=t;__pushedHtml=h;};popView=function(){};toast=function(){};
  D.p=[{id:1,name:'田中',position:'PR',year:2},{id:2,name:'佐藤',position:'FL',year:3}];
  D.texlist=[];D.tlog=[];__store={};

  function setFitForm(name,scope,desc){
    __els['fp-name']=mkEl();__els['fp-name'].value=name;
    __els['fp-scope']=mkEl();__els['fp-scope'].value=scope;
    __els['fp-desc']=mkEl();__els['fp-desc'].value=desc;
  }

  print('--- saveFitProg: 新規作成・items整形 ---');
  setFitForm('オフ フィットA','all','有酸素メイン');
  _fitItems=[{kind:'ランニング',count:'',minutes:'30',rest:'',rpe:'6',note:'ゆっくり'},
             {kind:'坂道ダッシュ',count:'10',minutes:'0.5',rest:'90',rpe:'9',note:''},
             {kind:'  ',count:'3',minutes:'5',rest:'',rpe:'',note:'空/空白kind=除外'}];
  D.tmenu=[];__store['tmenu']=JSON.stringify([]);
  saveFitProg(null);drain();
  var f=JSON.parse(__store['tmenu']||'[]');
  ok('新規1件作成',f.length===1);
  var fp=f[0];
  ok('ptype=fitness',fp.ptype==='fitness');
  ok('exercises:[]（旧コード安全）',Array.isArray(fp.exercises)&&fp.exercises.length===0);
  ok('desc保持',fp.desc==='有酸素メイン');
  ok('scope=all',fp.scope==='all');
  ok('空/空白kind項目は除外→2項目',fp.items.length===2);
  ok('count: 空→null',fp.items[0].count===null);
  ok('count: 数値パース',fp.items[1].count===10);
  ok('minutes: 小数パース',fp.items[1].minutes===0.5);
  ok('rest: 数値パース',fp.items[1].rest===90);
  ok('rest: 空→null',fp.items[0].rest===null);
  ok('rpe: 数値パース',fp.items[0].rpe===6);
  ok('kind trim',fp.items[0].kind==='ランニング');
  ok('createdBy/At付与',fp.createdBy==='スタッフ'&&fp.createdAt===TODAY);
  ok('ptypeTsは付かない（スロットではない）',fp.ptypeTs===undefined);
  ok('idは数値',typeof fp.id==='number');

  print('--- saveFitProg: バリデーション ---');
  __alerts.length=0;
  setFitForm('','all','');_fitItems=[{kind:'ラン',minutes:'20'}];
  var beforeN=JSON.parse(__store['tmenu']).length;
  saveFitProg(null);drain();
  ok('名前空→alert・保存されない',__alerts.length===1&&JSON.parse(__store['tmenu']).length===beforeN);
  __alerts.length=0;
  setFitForm('項目なし','all','');_fitItems=[{kind:'',minutes:'20'},{kind:'   ',count:'3'}];
  saveFitProg(null);drain();
  ok('有効項目0→alert・保存されない',__alerts.length===1&&JSON.parse(__store['tmenu']).length===beforeN);

  print('--- saveFitProg: 編集（ptype/exercises維持） ---');
  var editId=fp.id;
  D.tmenu=JSON.parse(__store['tmenu']);
  setFitForm('オフ フィットA改','2','変更後');
  _fitItems=[{kind:'水泳',count:'',minutes:'40',rest:'',rpe:'7',note:''}];
  saveFitProg(String(editId));drain();
  var f2=JSON.parse(__store['tmenu']);
  var e=f2.find(function(x){return idEq(x.id,editId);});
  ok('編集: 名前更新',e.name==='オフ フィットA改');
  ok('編集: scope更新（個別）',idEq(e.scope,2));
  ok('編集: desc更新',e.desc==='変更後');
  ok('編集: items差し替え',e.items.length===1&&e.items[0].kind==='水泳');
  ok('編集: ptype=fitness維持',e.ptype==='fitness');
  ok('編集: exercises:[]維持',Array.isArray(e.exercises)&&e.exercises.length===0);
  ok('編集: 件数増えない',f2.length===1);

  print('--- V.training: フィットネスセクション分離 ---');
  D.tmenu=[
    {id:1,name:'PUSHメニュー',scope:'all',ptype:'push',ptypeTs:'2026-01-01T00:00:00.000Z',exercises:[{name:'BP'}],createdAt:'2026-07-01'},
    {id:2,name:'個別ウエイト',scope:1,exercises:[{name:'リハ'}],createdAt:'2026-07-02'},
    {id:3,name:'オフフィット',scope:'all',ptype:'fitness',items:[{kind:'ラン',minutes:30}],exercises:[],createdAt:'2026-07-03'}
  ];
  D.tlog=[{id:'l1',pid:1,date:'2026-07-05',fitness:{ftype:'ラン',minutes:30},programId:3,results:[],totalVolume:0}];
  __els['tr-tab-sel']=mkEl();__els['tr-tab-sel'].value='menus';
  V.training();
  var vh=__els['main-ct'].innerHTML;
  ok('フィットネスセクション見出し',has(vh,'フィットネスプログラム'));
  ok('作成ボタン導線',has(vh,'goAddFitProg()'));
  ok('フィットネスmenuカード＋詳細導線',has(vh,'オフフィット')&&has(vh,"goFitProgDetail('3')"));
  ok('フィットネスは通常メニュー一覧に混ざらない（出現1回）',vh.split('オフフィット').length===2);
  ok('実施人数バッジ（1名）',has(vh,'実施1名'));
  ok('通常一覧に個別ウエイトは残る',has(vh,'個別ウエイト'));
  ok('getSlotMenuはfitnessを拾わない（push/pullのみ）',getSlotMenu('push')&&getSlotMenu('push').name==='PUSHメニュー');

  print('--- goFitProgDetail: 実施者一覧（programId照合） ---');
  D.tlog=[
    {id:'l1',pid:1,date:'2026-07-05',fitness:{ftype:'ラン',minutes:30,rpe:6},programId:3,results:[],totalVolume:0},
    {id:'l2',pid:2,date:'2026-07-06',fitness:{ftype:'ラン',minutes:25},programId:'3',results:[],totalVolume:0},
    {id:'l3',pid:1,date:'2026-07-05',fitness:{ftype:'バイク',minutes:44},results:[],totalVolume:0},
    {id:'l4',pid:2,date:'2026-07-05',fitness:{ftype:'ラン',minutes:11},programId:99,results:[],totalVolume:0}
  ];
  goFitProgDetail('3');
  var dh=__pushedHtml;
  ok('項目表示',has(dh,'ラン'));
  ok('実施者2名（progId数値3＋文字列"3"の両方）',has(dh,'実施した選手（2）'));
  ok('実施者に田中',has(dh,'田中'));
  ok('実施者に佐藤',has(dh,'佐藤'));
  ok('自由記録(programIdなし)は含まない',dh.split('44分').length===1);
  ok('別プログラムのログは含まない',dh.split('11分').length===1);
  ok('削除/編集導線',has(dh,"delTMenu('3')")&&has(dh,"goEditFitProg('3')"));

  print('--- goFitProgDetail: 実施ゼロ ---');
  D.tlog=[];
  goFitProgDetail('3');
  ok('実施ゼロ表示',has(__pushedHtml,'実施した選手（0）')&&has(__pushedHtml,'まだ実施記録はありません'));
}

// ============================================================
if(IS_PLAYER){
  print('=== PLAYER: おすすめプログラム／プレフィル／programId ===');
  showSub=function(h){__els['main'].innerHTML=h;};
  myPid=1;
  D.p=[{id:1,name:'テスト選手',position:'PR',year:2,height:'180',weight:'100'}];
  D.tmenu=[
    {id:100,name:'PUSHメニュー',scope:'all',ptype:'push',exercises:[{name:'BP'}]},
    {id:101,name:'個別ウエイト',scope:1,exercises:[{name:'リハ'}]},
    {id:200,name:'オフフィットA',scope:'all',ptype:'fitness',desc:'有酸素の日',items:[
      {kind:'ランニング',count:null,minutes:20,rest:null,rpe:6,note:'ゆっくり'},
      {kind:'坂道ダッシュ',count:10,minutes:0.5,rest:90,rpe:9,note:null}
    ],exercises:[]},
    {id:201,name:'他人専用フィット',scope:2,ptype:'fitness',items:[{kind:'水泳',minutes:40}],exercises:[]}
  ];
  D.tlog=[];D.e1rm=[];D.i=[];D.cal=[];D.offday=[];D.f=[];D.bc=[];D.ph=[];D.std=[];D.a=[];D.wc=[];D.md=[];D.matchsel=[];D.pp=[];D.texlist=[];D.chart=[];D.r=[];D.rplan=[];D.phskip=[];
  __store={};__store['tlog']=JSON.stringify([]);

  print('--- getMyMenus / getFitMenus 分離 ---');
  var mm=getMyMenus();
  ok('getMyMenusにfitnessは含まない',!mm.some(function(m){return m.ptype==='fitness';}));
  ok('getMyMenusにウエイトは含む',mm.some(function(m){return idEq(m.id,100);})&&mm.some(function(m){return idEq(m.id,101);}));
  var fm=getFitMenus();
  ok('getFitMenusは自分配布のfitnessのみ（id200）',fm.length===1&&idEq(fm[0].id,200));
  ok('getFitMenusは他人専用(id201)を除外',!fm.some(function(m){return idEq(m.id,201);}));

  print('--- T.training: おすすめプログラムセクション ---');
  T.training();
  var th=__els['main'].innerHTML;
  ok('おすすめプログラム見出し',has(th,'おすすめプログラム'));
  ok('プログラム名表示',has(th,'オフフィットA'));
  ok('これをやる導線',has(th,"startFitProgram('200')"));
  ok('項目要約表示',has(th,'ランニング'));
  ok('他人専用は出ない',!has(th,'他人専用フィット'));
  ok('fitnessは配布メニュー一覧に出ない',th.split('オフフィットA').length===2);

  print('--- startFitProgram: プレフィル ---');
  startFitProgram('200');
  var pf=__els['main'].innerHTML;
  ok('参照カードにプログラム名',has(pf,'プログラム「オフフィットA」の内容'));
  ok('hidden progid=200',has(pf,'id="sf-progid" value="200"'));
  ok('種類=先頭項目のkind',has(pf,'id="sf-type" class="ipt" placeholder="例：ランニング" value="ランニング"'));
  ok('合計時間プレフィル（20 + 10*0.5 = 25分）',has(pf,'placeholder="30" value="25"'));
  ok('メモに説明+要約',has(pf,'有酸素の日')&&has(pf,'坂道ダッシュ'));
  ok('参照カードに休憩/RPE表示',has(pf,'休憩90秒')&&has(pf,'RPE9'));

  print('--- startFitProgram: 不明ID ---');
  __alerts.length=0;
  startFitProgram('999');
  ok('不明ID→alert',__alerts.length===1);

  print('--- saveSelfFitness: programId付与 ---');
  __els['sf-progid']=mkEl();__els['sf-progid'].value='200';
  __els['sf-type']=mkEl();__els['sf-type'].value='ランニング';
  __els['sf-min']=mkEl();__els['sf-min'].value='24';
  __els['sf-km']=mkEl();__els['sf-km'].value='';
  __els['sf-rpe']=mkEl();__els['sf-rpe'].value='';
  __els['sf-note']=mkEl();__els['sf-note'].value='実際は24分だった';
  D.tlog=[];__store['tlog']=JSON.stringify([]);
  saveSelfFitness(mkEl());drain();
  var saved=JSON.parse(__store['tlog']||'[]');
  ok('1件保存',saved.length===1);
  var log=saved[0];
  ok('programId付与（=200）',idEq(log.programId,200));
  ok('kind=self',log.kind==='self');
  ok('fitness.ftype保持',log.fitness&&log.fitness.ftype==='ランニング');
  ok('fitness.minutes保持',log.fitness.minutes===24);
  ok('不変条件 results:[]',Array.isArray(log.results)&&log.results.length===0);
  ok('不変条件 totalVolume:0',log.totalVolume===0);

  print('--- saveSelfFitness: 自由記録（programIdなし） ---');
  __els['sf-progid']=mkEl();__els['sf-progid'].value='';
  __els['sf-type']=mkEl();__els['sf-type'].value='バイク';
  __els['sf-min']=mkEl();__els['sf-min'].value='40';
  __els['sf-km']=mkEl();__els['sf-km'].value='';
  __els['sf-rpe']=mkEl();__els['sf-rpe'].value='';
  __els['sf-note']=mkEl();__els['sf-note'].value='';
  D.tlog=[];__store['tlog']=JSON.stringify([]);
  saveSelfFitness(mkEl());drain();
  var saved2=JSON.parse(__store['tlog']||'[]');
  ok('1件保存',saved2.length===1);
  ok('programIdは付かない',saved2[0].programId===undefined);
  ok('fitnessは保持',saved2[0].fitness&&saved2[0].fitness.ftype==='バイク');

  print('--- slimTlogRec: programId素通り ---');
  var slim=slimTlogRec({id:'x',pid:1,menuId:null,kind:'self',date:TODAY,fitness:{ftype:'ラン',minutes:30},programId:'200',results:[],totalVolume:0,hasInjurySkip:false});
  ok('slim後 programId保持',slim.programId==='200');
  ok('slim後 fitness保持',slim.fitness&&slim.fitness.ftype==='ラン');
  ok('slim後 results:[]保持',Array.isArray(slim.results)&&slim.results.length===0);
  ok('slim後 hasInjurySkip:false は省略',!('hasInjurySkip' in slim));

  print('--- 既存集計の素通り（例外ゼロ・fitness programId付き） ---');
  D.tlog=[{id:'f1',pid:1,menuId:null,kind:'self',date:TODAY,fitness:{ftype:'ラン',minutes:30,rpe:7},programId:'200',results:[],totalVolume:0}];
  var threw=false;
  try{ tlogAll(); if(typeof showTrainingHistory==='function'){showTrainingHistory();} }catch(err){threw=true;print('  例外: '+err);}
  ok('showTrainingHistory等がfitness(programId付)で例外を出さない',!threw);
}

if(!IS_STAFF&&!IS_PLAYER)print('  NG このファイルにはfitprog対象関数がありません');
if(__fail===0)print('ALL FITPROG TESTS PASSED');else print(__fail+' TESTS FAILED');
