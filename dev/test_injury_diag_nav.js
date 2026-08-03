// P7d-A: 受傷登録→「受傷・診断」タブへ自動遷移（軽量版の1フォーム化）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_injury_diag_nav.js
// 核心: (1)doAddInjury は i+r を保存し、カルテを diagnosis タブで開く (2)initTab省略時は overview のまま
//       (3)chart は先行生成しない（診断保存時の遅延生成を維持＝injId重複appendを作らない）
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
// 例外を握り潰さない（握り潰すと描画クラッシュを検出できず偽PASSになる）
function flushTimers(){var t=__timeouts.slice();__timeouts.length=0;t.forEach(function(fn){fn();});}
// 描画された本文を捕捉（curChartTabの代入はrenderChartTabより前なので、タブ名だけでは描画成功を保証できない）
var _body={value:'',style:{},textContent:'',innerHTML:''};
var TODAY=todayStr();
var _dom={};
document.getElementById=function(id){
  if(id==='chart-body')return _body;
  return _dom[id]||{value:'',style:{},textContent:'',innerHTML:'',classList:{add:function(){},remove:function(){},toggle:function(){}}};
};
function setEl(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:'',innerHTML:''};}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
var _pushed=0;pushView=function(){_pushed++;};popView=function(){};toast=function(){};
function reset(){__alerts.length=0;__timeouts.length=0;_pushed=0;curChartTab='overview';_body.innerHTML='';
  setKey('i',[]);setKey('r',[]);setKey('chart',[]);setKey('p',[{id:1,name:'A選手',position:'PR',year:2}]);_dom={};}

print('--- 1) doAddInjury: i+r保存 → 受傷・診断タブでカルテを開く ---');
reset();
setEl('ni-p-val','1');setEl('ni-part','膝');setEl('ni-type','捻挫');setEl('ni-side','右');
setEl('ni-date',TODAY);setEl('ni-ret','');setEl('ni-hv','0');setEl('ni-hd','');setEl('ni-note','練習中');
doAddInjury();drain();
ok('i 1件保存', store('i').length===1);
ok('source=staff / approved=true', store('i')[0] && store('i')[0].source==='staff' && store('i')[0].approved===true);
ok('r 1件保存(stage:0)', store('r').length===1 && store('r')[0].stage===0);
ok('カルテをpushView', _pushed===1);
flushTimers();
ok('診断タブが開く(curChartTab=diagnosis)', curChartTab==='diagnosis');
ok('受傷・診断フォームが実際に描画される(受傷機転欄)', /cd-mech/.test(_body.innerHTML));
ok('診断名欄も描画される', /cd-diagnosis/.test(_body.innerHTML));
ok('chartは先行生成しない(遅延生成を維持)', store('chart').length===0);

print('--- 2) goInjuryDetail(iid) 単独: initTab省略なら overview のまま ---');
reset();
setKey('i',[{id:10,pid:1,part:'膝',type:'捻挫',side:'右',resolved:false}]);
goInjuryDetail(10);
flushTimers();
ok('overviewのまま', curChartTab==='overview');
ok('概要が描画され受傷機転欄は出ない', _body.innerHTML.length>0 && !/cd-mech/.test(_body.innerHTML));

print('--- 3) goInjuryDetail(iid,"diagnosis"): 明示指定で診断タブ ---');
reset();
setKey('i',[{id:10,pid:1,part:'膝',type:'捻挫',side:'右',resolved:false}]);
goInjuryDetail(10,'diagnosis');
flushTimers();
ok('diagnosisタブ', curChartTab==='diagnosis');
ok('受傷・診断フォームが描画', /cd-mech/.test(_body.innerHTML));

print('--- 4) doAddInjury: 選手未選択なら保存しない ---');
reset();
setEl('ni-p-val','');
doAddInjury();drain();
ok('i 0件', store('i').length===0);
ok('選手選択alert', __alerts.some(function(a){return /選手を選択/.test(a);}));

print(__fail===0?'ALL INJURY-DIAG-NAV TESTS PASSED':(__fail+' TESTS FAILED'));
