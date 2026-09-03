// ダウンブロンコ測定入力（downbroncoフィールド・秒・小さいほど良い）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_downbronco.js
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_downbronco.js
// 核心: broncoと同型のタイム系種目として保存・編集・ベスト/最新判定（min極性・>0ガード）が両サイトで揃うこと。
//       staffの一括保存はbk-cn/bk-cl欄がDOMに無くてもクラッシュしない（null安全読みの回帰も兼ねる）。
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function flushTimers(){__timeouts.splice(0).forEach(function(f){f();});}
function daysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return toDateStr(d);}
var TODAY=todayStr();
var _dom={};
document.getElementById=function(id){return _dom[id]||null;};
document.querySelectorAll=function(){return[];};
function setEl(id,v){_dom[id]={value:(v==null?'':String(v)),style:{},textContent:''};}
function btn(){return{dataset:{},style:{},innerHTML:'',textContent:''};}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function store(k){return JSON.parse(__store[k]||'[]');}
var IS_PLAYER=(typeof doPhys==='function');
var IS_STAFF=(typeof doAddPhys==='function');

print('--- 1) getBest/getLatest: downbroncoはmin極性・0除外（共通ヘルパー） ---');
D.ph=[
  {id:1,pid:1,date:daysAgo(20),downbronco:380,inputAt:'a'},
  {id:2,pid:1,date:daysAgo(2), downbronco:395,inputAt:'b'},
  {id:3,pid:1,date:daysAgo(1), downbronco:0,  inputAt:'c'}
];
ok('getBest=380（最小値・0は除外）', getBest(1,'downbronco')===380);
ok('getLatest=395（最新日付・0は除外）', getLatest(1,'downbronco')===395);
ok('記録なし選手はnull', getBest(2,'downbronco')===null);

if(IS_PLAYER){
  go=function(){};toast=function(){};showSub=function(h){_lastSub=h;};
  var _pb='';pbFlash=function(m){_pb=String(m);};
  var _lastSub='';
  function resetP(){__alerts.length=0;__timeouts.length=0;_pb='';_lastSub='';_dom={};
    setKey('ph',[]);setKey('msess',[]);setKey('p',[{id:1,name:'A選手'}]);setKey('phskip',[]);}
  function fullInputs(o){o=o||{};setEl('pf-date',TODAY);
    setEl('pf-sq',o.sq||'');setEl('pf-bp','');setEl('pf-dl','');setEl('pf-cn','');setEl('pf-cl','');
    setEl('pf-br-m',o.brm||'');setEl('pf-br-s',o.brs||'');
    setEl('pf-db-m',o.dbm||'');setEl('pf-db-s',o.dbs||'');}
  myPid=1;

  print('--- 2) player: 全種目フォームでダウンブロンコのみ入力 → 保存される ---');
  resetP();
  fullInputs({dbm:'5',dbs:'30'});
  doPhys(btn());drain();
  ok('1件保存', store('ph').length===1);
  ok('downbronco=330秒', store('ph')[0] && store('ph')[0].downbronco===330);
  ok('broncoはnull', store('ph')[0] && store('ph')[0].bronco==null);

  print('--- 3) player: ブロンコ単独モード（pf-db欄DOM不在）でもクラッシュせずdownbronco=null ---');
  resetP();
  setEl('pf-date',TODAY);setEl('pf-br-m','5');setEl('pf-br-s','0');
  doPhys(btn(),'bronco');drain();
  ok('1件保存', store('ph').length===1);
  ok('bronco=300秒', store('ph')[0] && store('ph')[0].bronco===300);
  ok('downbroncoはnull', store('ph')[0] && store('ph')[0].downbronco==null);

  print('--- 4) player: ダウンブロンコ自己ベスト更新でpbFlash ---');
  resetP();
  setKey('ph',[{id:1,pid:1,date:daysAgo(30),downbronco:400,inputAt:'a'}]);
  fullInputs({dbm:'6',dbs:'20'});
  doPhys(btn());drain();flushTimers();
  ok('保存2件', store('ph').length===2);
  ok('pbFlashにダウンブロンコ更新', _pb.indexOf('ダウンブロンコ自己ベスト更新')>=0);
  ok('結果シートにダウンブロンコ行', _lastSub.indexOf('ダウンブロンコ')>=0);

  print('--- 5) player: 修正フォームにダウンブロンコ欄がプレフィルされる ---');
  resetP();
  setKey('ph',[{id:5,pid:1,date:daysAgo(3),bronco:300,downbronco:370,inputAt:'a'}]);
  showEditPhysRec(5);
  ok('修正フォームにeph-db欄', _lastSub.indexOf('eph-db-m')>=0);
  ok('プレフィル6分', _lastSub.indexOf('id="eph-db-m" value="6"')>=0);

  print('--- 6) player: doEditPhysRecでダウンブロンコを修正できる ---');
  resetP();
  setKey('ph',[{id:5,pid:1,date:daysAgo(3),bronco:300,downbronco:370,inputAt:'a'}]);
  setEl('eph-sq','');setEl('eph-bp','');setEl('eph-dl','');setEl('eph-cn','');setEl('eph-cl','');
  setEl('eph-br-m','5');setEl('eph-br-s','0');
  setEl('eph-db-m','6');setEl('eph-db-s','30');
  doEditPhysRec('5',btn());drain();
  ok('downbronco=390秒に更新', store('ph')[0] && store('ph')[0].downbronco===390);
  setEl('eph-db-m','0');setEl('eph-db-s','0');
  doEditPhysRec('5',btn());drain();
  ok('0分0秒はnullとして保存', store('ph')[0] && store('ph')[0].downbronco==null);
}

if(IS_STAFF){
  var _toast='';toast=function(m){_toast=String(m);};
  var _pushed='';pushView=function(t,h){_pushed=String(h||'');};popView=function(){};
  function resetS(){__alerts.length=0;__timeouts.length=0;_toast='';_pushed='';_dom={};
    setKey('ph',[]);setKey('msess',[]);setKey('p',[{id:1,name:'A選手'}]);}
  function addInputs(o){o=o||{};setEl('nph-p-val','1');setEl('nph-date',TODAY);
    setEl('nph-sq',o.sq||'');setEl('nph-bp','');setEl('nph-dl','');setEl('nph-cn','');setEl('nph-cl','');
    setEl('nph-br-m',o.brm||'');setEl('nph-br-s',o.brs||'');
    setEl('nph-db-m',o.dbm||'');setEl('nph-db-s',o.dbs||'');}

  print('--- 7) staff: 単体入力でダウンブロンコが保存される ---');
  resetS();
  addInputs({dbm:'6',dbs:'20'});
  doAddPhys();drain();
  ok('1件保存', store('ph').length===1);
  ok('downbronco=380秒', store('ph')[0] && store('ph')[0].downbronco===380);

  print('--- 8) staff: ダウンブロンコのベスト更新でtoast ---');
  resetS();
  setKey('ph',[{id:1,pid:1,date:daysAgo(30),downbronco:400,inputAt:'a'}]);
  addInputs({dbm:'6',dbs:'20'});
  doAddPhys();drain();flushTimers();
  ok('保存2件', store('ph').length===2);
  ok('toastにダウンブロンコ更新', _toast.indexOf('ダウンブロンコ更新')>=0);

  print('--- 9) staff: 一括入力（bk-cn/bk-cl欄DOM不在でもクラッシュしない） ---');
  resetS();
  setEl('bulk-date',TODAY);
  setEl('bk-sq-1','');setEl('bk-bp-1','');setEl('bk-dl-1','');
  setEl('bk-br-m-1','');setEl('bk-br-s-1','');
  setEl('bk-db-m-1','6');setEl('bk-db-s-1','40');
  var _crashed=false;
  try{doBulkPhys();}catch(e){_crashed=true;print('  例外: '+e);}
  drain();
  ok('クラッシュしない', !_crashed);
  ok('1件保存', store('ph').length===1);
  ok('downbronco=400秒', store('ph')[0] && store('ph')[0].downbronco===400);
  ok('chinning/cleanはnull', store('ph')[0] && store('ph')[0].chinning==null && store('ph')[0].clean==null);

  print('--- 10) staff: 編集フォームにダウンブロンコ欄・doEditPhysで保存 ---');
  resetS();
  setKey('ph',[{id:9,pid:1,date:daysAgo(3),bronco:300,downbronco:370,inputAt:'a'}]);
  goEditPhys(9);
  ok('編集フォームにeph-db欄', _pushed.indexOf('eph-db-m')>=0);
  ok('プレフィル6分', _pushed.indexOf('id="eph-db-m" value="6"')>=0);
  setEl('eph-date',daysAgo(3));
  setEl('eph-sq','');setEl('eph-bp','');setEl('eph-dl','');setEl('eph-cn','');setEl('eph-cl','');
  setEl('eph-br-m','5');setEl('eph-br-s','0');
  setEl('eph-db-m','6');setEl('eph-db-s','50');
  doEditPhys(9);drain();
  ok('downbronco=410秒に更新', store('ph')[0] && store('ph')[0].downbronco===410);
}

print(__fail===0?'ALL DOWNBRONCO TESTS PASSED':(__fail+' TESTS FAILED'));
