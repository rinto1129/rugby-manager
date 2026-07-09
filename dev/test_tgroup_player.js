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

// ============ 1. T.mypage 導線カード（WG UIは設定サブ画面へ移設） ============
print('--- T.mypage: プロフィール導線カード ---');
subView=null;
T.mypage();
var mp=__els['main'].innerHTML;
ok('プロフィール設定への導線',has(mp,'showProfileSettings()')&&has(mp,'プロフィール設定'));
ok('WG UIはmypageに出ない',!has(mp,'id="wg-mon"'));
ok('身長サマリー(180cm)',has(mp,'180cm'));
ok('wg未回答サマリー',has(mp,'未回答'));

print('--- showProfileSettings: サブ画面にWG UI（wg未設定=空） ---');
subView=null;
showProfileSettings();
var ps=__els['main'].innerHTML;
ok('サブ: 身長input',has(ps,'id="mh-input"'));
ok('サブ: アンケート見出し(WEIGHT SESSION)',has(ps,'WEIGHT SESSION')&&has(ps,'ウエイト時間帯アンケート'));
ok('サブ: 5限チェック(月水金)',has(ps,'id="wg-mon"')&&has(ps,'id="wg-wed"')&&has(ps,'id="wg-fri"'));
ok('サブ: 遠方チェック',has(ps,'id="wg-far"'));
ok('サブ: 希望セレクト',has(ps,'id="wg-pref"')&&has(ps,'午前がいい')&&has(ps,'午後がいい')&&has(ps,'どちらでも'));
ok('サブ: 保存ボタン(saveMyWg)',has(ps,'saveMyWg()'));
ok('サブ: subView=true',subView===true);
ok('未設定時はcheckedなし',!has(ps,'checked'));

// ============ 2. showProfileSettings プリフィル＋mypageサマリー反映 ============
print('--- showProfileSettings: プリフィル（wg設定済み） ---');
D.p[0].wg={f5:['mon','fri'],far:true,pref:'pm',upd:'2026-07-01T00:00:00.000Z'};
subView=null;
showProfileSettings();
var mp2=__els['main'].innerHTML;
ok('月がchecked',has(mp2,'id="wg-mon" checked'));
ok('金がchecked',has(mp2,'id="wg-fri" checked'));
ok('水はcheckedでない',has(mp2,'id="wg-wed">'));
ok('遠方がchecked',has(mp2,'id="wg-far" checked'));
ok('希望pmがselected',has(mp2,'value="pm" selected'));
subView=null;
T.mypage();
var mpSum=__els['main'].innerHTML;
ok('サマリーに午後希望',has(mpSum,'午後希望'));
ok('サマリーに5限 月・金',has(mpSum,'月・金'));

// ============ 3. saveMyWg（保存・他フィールド不変・完了後サブ画面維持） ============
print('--- saveMyWg: 保存 ---');
D.p[0].wg=undefined;
__store['p']=JSON.stringify(D.p);
subView=null;
showProfileSettings(); // WG UIを描画してidを用意
document.getElementById('wg-mon').checked=true;document.getElementById('wg-wed').checked=false;document.getElementById('wg-fri').checked=true;
document.getElementById('wg-far').checked=false;document.getElementById('wg-pref').value='am';
__alerts.length=0;
saveMyWg();drain();
ok('保存完了後もサブ画面維持(subView=true)',subView===true);
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
ok('カードにシフトチップ「午前組」',has(card,'午前組'));
ok('カードにA班',has(card,'A班'));
ok('カードに班メンバー全員(自分含む)',has(card,'田中 蓮')&&has(card,'山田 太郎')&&has(card,'佐藤 次郎'));
ok('カードにMY GROUP見出し',has(card,'MY GROUP'));
ok('カードは全班一覧への導線',has(card,'showAllGroups()')&&has(card,'全班を見る'));
ok('myGroupInfoにmembers配列',gi.members&&gi.members.length===3);

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
ok('singleカードは「B班」（シフトチップなし）',has(card3,'B班')&&!has(card3,'午前組')&&!has(card3,'午後組'));

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
ok('T.trainingにMY GROUP・A班',has(__els['main'].innerHTML,'MY GROUP')&&has(__els['main'].innerHTML,'A班'));
subView=null;curTab='home';
T.home();
ok('T.homeにMY GROUP・A班',has(__els['main'].innerHTML,'MY GROUP')&&has(__els['main'].innerHTML,'A班'));
// tgroup未設定なら両画面ともグループカードなし（クラッシュしない）
D.tgroup=[];
subView=null;T.training();
ok('未設定時 T.trainingにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));
subView=null;curTab='home';T.home();
ok('未設定時 T.homeにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));

// ============ 6. showAllGroups（全班一覧サブ画面） ============
print('--- showAllGroups: 全班一覧 ---');
D.tgroup=[{id:7,ts:7,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1],[3]]},  // A班:田中(自分) / B班:佐藤
  {key:'pm',label:'午後',groups:[[2]]}         // A班:山田
]}];
subView=null;curTab='training';
showAllGroups();
var ag=__els['main'].innerHTML;
ok('見出し ウエイトグループ編成',has(ag,'ウエイトグループ編成'));
ok('午前シフト見出し',has(ag,'午前組'));
ok('午後シフト見出し',has(ag,'午後組'));
ok('A班・B班表示',has(ag,'A班')&&has(ag,'B班'));
ok('自分の班にMYマーク',has(ag,'>MY<'));
ok('全員名表示',has(ag,'田中 蓮')&&has(ag,'山田 太郎')&&has(ag,'佐藤 次郎'));
ok('自分に（自分）注記',has(ag,'（自分）'));
ok('subView=true',subView===true);

print('--- showAllGroups: 空編成 ---');
D.tgroup=[];
subView=null;curTab='home';
showAllGroups();
ok('空編成メッセージ',has(__els['main'].innerHTML,'まだ編成がありません'));

print('--- showAllGroups: 戻り先はcurTab ---');
D.tgroup=[{id:8,ts:8,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[1]]},{key:'pm',label:'午後',groups:[]}]}];
subView=null;curTab='training';
showAllGroups();
ok('training→トレーニングに戻る',has(__els['main'].innerHTML,'トレーニングに戻る'));
subView=null;curTab='home';
showAllGroups();
ok('home→ホームに戻る',has(__els['main'].innerHTML,'ホームに戻る'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_player tests failed');}
print('\nALL TGROUP-PLAYER TESTS PASSED');
