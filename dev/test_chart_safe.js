// P1b: chartUpdate(injId,fn)による操作単位保存のロストアップデート防止テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_chart_safe.js
//       jsc dev/prelude.js /tmp/trainer.js dev/test_chart_safe.js
// シナリオ: 端末A(このプロセス)がカルテを開いた後、端末B(=__store直接書換で模擬)が同じinjIdに
// evalを追加。その後Aが受傷診断/SOAP/復帰基準/RTPを保存しても、Bのevalが消えないことを確認する。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function storeChart(){var raw=__store['chart'];return raw?JSON.parse(raw):[];} // preludeモックは__store[k]=JSON文字列
function rec(){return storeChart().find(function(x){return idEq(x.injId,101);});}
function otherDeviceAddsEval(tag){
  // 端末B: サーバー上のchartに直接evalを追記（Aのローカル D.chart には反映されない）
  var arr=storeChart();
  var i=arr.findIndex(function(x){return idEq(x.injId,101);});
  if(i<0){arr.push({injId:101,injDetail:{},medical:{},evals:[],soaps:[],returnCriteria:{},images:[],metrics:[],mmtTargets:[]});i=arr.length-1;}
  if(!arr[i].evals)arr[i].evals=[];
  arr[i].evals.push({id:'ev_'+tag,date:'2026-07-13',pain:{rest:2},note:'端末Bの評価 '+tag});
  __store['chart']=JSON.stringify(arr);
}

// --- 前提データ ---
D.p=[{id:1,name:'テスト選手',position:'PR',year:2}];
D.i=[{id:101,pid:1,part:'膝',side:'右',kind:'靭帯損傷',date:'2026-07-01',resolved:false}];
D.chart=[{injId:101,injDetail:{},medical:{},evals:[],soaps:[],returnCriteria:{},images:[],metrics:[],mmtTargets:[]}];
__store['chart']=JSON.stringify(D.chart);
if(typeof myTrainer!=='undefined')myTrainer={id:'t1',name:'テストトレーナー'};

// --- 1) 受傷診断: Bのevalが生き残るか ---
var __vals={'cd-mech':'コンタクト（タックル）','cd-scene':'練習','cd-tissue':'靭帯','cd-sev':'中等症（1-3週）','cd-situation':'','cd-firstaid':'',
  'cd-visitdate':'2026-07-02','cd-hospital':'テスト病院','cd-doctor':'','cd-diagnosis':'MCL損傷II度','cd-imgfind':'','cd-treatment':'',
  'cd-surgdate':'','cd-surgname':''};
var __els={};
document.getElementById=function(id){
  if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}
  if(__vals[id]!=null)__els[id].value=__vals[id]; // __valsの後発変更も毎回反映（キャッシュ値の固着防止）
  return __els[id];
};
document.querySelectorAll=function(){return[];};
otherDeviceAddsEval('A');           // Aが画面を開いている間にBがevalを追加
saveChartDiagnosis(101);
drain();
var r1=rec();
ok('診断が保存された', r1&&r1.medical&&r1.medical.diagnosis==='MCL損傷II度');
ok('診断の機転も保存', r1&&r1.injDetail&&r1.injDetail.mechanism==='コンタクト（タックル）');
ok('端末Bのevalが消えていない【核心】', r1&&(r1.evals||[]).some(function(e){return e.id==='ev_A';}));

// --- 2) SOAP追加(staffのみ): Bのevalが生き残るか ---
if(typeof saveSOAP==='function'&&typeof chartTab==='function'){
  // chartTab再描画はDOMモックで完走しないことがあるため差し替え
  chartTab=function(){};
  __vals['sp-date']='2026-07-13';__vals['sp-s']='痛み軽減';__vals['sp-o']='ROM改善';__vals['sp-a']='順調';__vals['sp-p']='継続';__vals['sp-menu']='';__vals['sp-author']='テスト';
  otherDeviceAddsEval('B');
  saveSOAP(101,null,mkEl()); // 第3引数btn: trainer版はguardSubmit必須（毎回新規要素でガード非干渉）
  drain();
  var r2=rec();
  ok('SOAPが追加された', r2&&(r2.soaps||[]).length===1&&r2.soaps[0].s==='痛み軽減');
  ok('SOAP保存でもBのevalが無事', r2&&(r2.evals||[]).some(function(e){return e.id==='ev_B';}));
  // --- SOAP編集で他SOAPが消えないか ---
  var sid=r2.soaps[0].id;
  __vals['sp-s']='編集後S';
  saveSOAP(101,sid,mkEl());
  drain();
  var r2b=rec();
  ok('SOAP編集が反映', r2b.soaps[0].s==='編集後S'&&r2b.soaps.length===1);
  // --- SOAP削除 ---
  delSOAP(101,sid);
  drain();
  ok('SOAP削除が反映', (rec().soaps||[]).length===0);
}else{
  print('  -- saveSOAP無し（trainer）: スキップ');
}

// --- 3) 復帰基準トグル: Bのevalが生き残るか ---
otherDeviceAddsEval('C');
var fakeEl={dataset:{k:'痛みなし(安静時)'},checked:true};
toggleReturnCriteria(101,fakeEl);
drain();
var r3=rec();
ok('復帰基準が保存された', r3&&r3.returnCriteria&&r3.returnCriteria['痛みなし(安静時)']===true);
ok('復帰基準トグルでもBのevalが無事', r3&&(r3.evals||[]).some(function(e){return e.id==='ev_C';}));

// --- 4) RTPレベル: Bのevalが生き残るか ---
if(typeof renderChartTab==='function')renderChartTab=function(){};
otherDeviceAddsEval('D');
setRtpLevel(101,'rehab');
drain();
var r4=rec();
ok('RTPレベルが保存された', r4&&r4.rtpLevel==='rehab');
ok('RTP変更でもBのevalが無事', r4&&(r4.evals||[]).some(function(e){return e.id==='ev_D';}));
ok('累計evalが4件とも残存', (r4.evals||[]).length===4);

// --- 5) chartUpdateが未知injIdで雛形を作る ---
chartUpdate(999,function(ch){ch.rtpLevel='rest';});
drain();
var r5=storeChart().find(function(x){return idEq(x.injId,999);});
ok('未知injIdで雛形生成+反映', r5&&r5.rtpLevel==='rest'&&Array.isArray(r5.evals));

if(__fail)throw new Error(__fail+' failed');
print('ALL CHART-SAFE TESTS PASSED');
