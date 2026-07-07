// Phase 7 (player側): ウエイト時間帯アンケート(wg) + グループ表示
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tgroup_player.js
// 仕様（プランPhase 7節）:
//  - p.wg={f5:[...],far,pref,upd}。T.mypageプロフィールカードに申告UI+saveMyWg（svSafeUpdate('p')でwgのみ更新）
//  - 新キーtgroup（SK/D追加）。myGroupInfo()=最新tgroupから自分の所属を返す（未設定/除外/未割当はnull）
//  - myGroupCardHtml()=「午前組・A班（同じ班：…）」。mode singleは「A班」。未所属は''
//  - T.training今日カード直下 / T.homeのppカード下にグループ表示
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
drain(); // 起動時のld()→go('home')チェーンを流しきる
confirm=function(m){return true;};

var TODAY=todayStr();

// ============ 0. SK/D に tgroup が追加されている ============
print('--- SK/D: tgroupキー ---');
ok('SKにtgroup',SK.tgroup==='rm_tgroup');
ok('D.tgroupが配列で初期化',Array.isArray(D.tgroup));

// ---- 共通データ ----
myPid=1;
D.p=[{id:1,name:'田中 蓮',position:'PR',year:2,height:'180',weight:'100'},
     {id:2,name:'山田 太郎',position:'LO',year:3,height:'185',weight:'105'},
     {id:3,name:'佐藤 次郎',position:'HO',year:1,height:'175',weight:'95'}];
D.std=[];D.offday=[];D.ann=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];D.ph=[];D.bc=[];D.f=[];D.tlog=[];D.chart=[];D.pp=[];D.texlist=[];D.tgroup=[];
_tlogArchLoaded=true;
D.tmenu=[];D.cal=[];
__store['p']=JSON.stringify(D.p);
__store['tgroup']=JSON.stringify([]);

// ============ 1. T.mypage 申告UI（プリフィルなし=初期状態） ============
print('--- T.mypage: 申告UI（wg未設定=空） ---');
subView=null;
T.mypage();
var mp=__els['main'].innerHTML;
ok('アンケート見出し(WEIGHT SESSION)',has(mp,'WEIGHT SESSION')&&has(mp,'ウエイト時間帯アンケート'));
ok('5限チェック(月水金)',has(mp,'id="wg-mon"')&&has(mp,'id="wg-wed"')&&has(mp,'id="wg-fri"'));
ok('遠方チェック',has(mp,'id="wg-far"'));
ok('希望セレクト',has(mp,'id="wg-pref"')&&has(mp,'午前がいい')&&has(mp,'午後がいい')&&has(mp,'どちらでも'));
ok('保存ボタン(saveMyWg)',has(mp,'saveMyWg()'));
ok('未設定時はcheckedなし',!has(mp,'checked'));

// ============ 2. T.mypage プリフィル ============
print('--- T.mypage: プリフィル（wg設定済み） ---');
D.p[0].wg={f5:['mon','fri'],far:true,pref:'pm',upd:'2026-07-01T00:00:00.000Z'};
T.mypage();
var mp2=__els['main'].innerHTML;
ok('月がchecked',has(mp2,'id="wg-mon" checked'));
ok('金がchecked',has(mp2,'id="wg-fri" checked'));
ok('水はcheckedでない',has(mp2,'id="wg-wed">'));
ok('遠方がchecked',has(mp2,'id="wg-far" checked'));
ok('希望pmがselected',has(mp2,'value="pm" selected'));

// ============ 3. saveMyWg（保存・他フィールド不変） ============
print('--- saveMyWg: 保存 ---');
D.p[0].wg=undefined;
__store['p']=JSON.stringify(D.p);
document.getElementById('wg-mon').checked=true;document.getElementById('wg-wed').checked=false;document.getElementById('wg-fri').checked=true;
document.getElementById('wg-far').checked=false;document.getElementById('wg-pref').value='am';
__alerts.length=0;
saveMyWg();drain();
var pStore=JSON.parse(__store['p']);
var meRec=pStore.find(function(x){return x.id===1;});
ok('wgが保存される',meRec&&meRec.wg&&typeof meRec.wg==='object');
ok('f5=[mon,fri]',meRec.wg.f5.length===2&&meRec.wg.f5.indexOf('mon')>=0&&meRec.wg.f5.indexOf('fri')>=0&&meRec.wg.f5.indexOf('wed')<0);
ok('far=false',meRec.wg.far===false);
ok('pref=am',meRec.wg.pref==='am');
ok('updがISO文字列',typeof meRec.wg.upd==='string'&&meRec.wg.upd.length>0);
ok('他フィールド不変(name/position/height)',meRec.name==='田中 蓮'&&meRec.position==='PR'&&meRec.height==='180');
ok('別選手のwgは付かない',!pStore.find(function(x){return x.id===2;}).wg);
ok('D.pもメモリ更新',D.p.find(function(x){return x.id===1;}).wg.pref==='am');

// 希望「どちらでも」→pref=null
print('--- saveMyWg: どちらでも→pref=null ---');
document.getElementById('wg-pref').value='';document.getElementById('wg-mon').checked=false;document.getElementById('wg-fri').checked=false;
saveMyWg();drain();
ok('pref=null（どちらでも）',JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg.pref===null);

// ============ 4. myGroupInfo / myGroupCardHtml ============
print('--- myGroupInfo: tgroup未設定はnull ---');
D.tgroup=[];
ok('tgroup空→null',myGroupInfo()===null);
ok('カードも空文字',myGroupCardHtml()==='');

print('--- myGroupInfo: ampmモード ---');
D.tgroup=[{id:1,ts:1,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2,3]]},
  {key:'pm',label:'午後',groups:[[10,11,12]]}
]}];
var gi=myGroupInfo();
ok('自分は午前・A班',gi&&gi.mode==='ampm'&&gi.shiftLabel==='午前'&&gi.groupLetter==='A');
ok('同じ班メンバー2名（自分除く・名前解決）',gi.mates.length===2&&gi.mates.indexOf('山田 太郎')>=0&&gi.mates.indexOf('佐藤 次郎')>=0);
var card=myGroupCardHtml();
ok('カードに「午前組・A班」',has(card,'午前組・A班'));
ok('カードに同じ班メンバー',has(card,'山田 太郎')&&has(card,'佐藤 次郎'));
ok('カードにMY GROUP見出し',has(card,'MY GROUP'));

print('--- myGroupInfo: 2班目(B班)・午後 ---');
D.tgroup=[{id:2,ts:2,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[10,11,12]]},
  {key:'pm',label:'午後',groups:[[20,21],[1,2]]}
]}];
var gi2=myGroupInfo();
ok('自分は午後・B班(2グループ目)',gi2&&gi2.shiftLabel==='午後'&&gi2.groupLetter==='B');
ok('同じ班は山田のみ',gi2.mates.length===1&&gi2.mates[0]==='山田 太郎');

print('--- myGroupInfo: singleモード ---');
D.tgroup=[{id:3,ts:3,date:TODAY,by:'staff',mode:'single',excluded:[],shifts:[
  {key:'all',label:'',groups:[[5,6],[1,3]]}
]}];
var gi3=myGroupInfo();
ok('single: shiftLabelは空',gi3&&gi3.mode==='single'&&gi3.shiftLabel==='');
ok('single: B班',gi3.groupLetter==='B');
var card3=myGroupCardHtml();
ok('singleカードは「B班」のみ（組なし）',has(card3,'B班')&&!has(card3,'組・'));

print('--- myGroupInfo: 除外/未割当はnull ---');
D.tgroup=[{id:4,ts:4,date:TODAY,by:'staff',mode:'ampm',excluded:[1],shifts:[
  {key:'am',label:'午前',groups:[[2,3]]},{key:'pm',label:'午後',groups:[]}
]}];
ok('除外選手→null',myGroupInfo()===null);
ok('除外→カード空',myGroupCardHtml()==='');

// idEqの数値/文字列混在耐性
print('--- myGroupInfo: id文字列混在でも一致 ---');
D.tgroup=[{id:5,ts:5,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[['1','2','3']]},{key:'pm',label:'午後',groups:[]}
]}];
ok('文字列id "1"でも自分と判定',myGroupInfo()!==null&&myGroupInfo().groupLetter==='A');

// ============ 5. T.training / T.home にグループ表示が出る ============
print('--- T.training / T.home: グループ表示 ---');
D.tgroup=[{id:6,ts:6,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2,3]]},{key:'pm',label:'午後',groups:[]}
]}];
subView=null;
T.training();
ok('T.trainingに午前組・A班',has(__els['main'].innerHTML,'午前組・A班'));
subView=null;curTab='home';
T.home();
ok('T.homeに午前組・A班',has(__els['main'].innerHTML,'午前組・A班'));
// tgroup未設定なら両画面ともグループカードなし（クラッシュしない）
D.tgroup=[];
subView=null;T.training();
ok('未設定時 T.trainingにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));
subView=null;curTab='home';T.home();
ok('未設定時 T.homeにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_player tests failed');}
print('\nALL TGROUP-PLAYER TESTS PASSED');
