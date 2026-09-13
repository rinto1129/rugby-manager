// Phase 7 (player側): ウエイト時間帯アンケート(wg) + グループ表示
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tgroup_player.js
// 仕様（プランPhase 7節＋ウエイトグループ分けv2 フェーズ2）:
//  - p.wg v2={v:2,days:{mon,tue,thu:'am'|'pm'|''},far,pref,upd}。旧{f5,far,pref,upd}は読み側wgNormで変換（5限の曜日→午前のみ）し「要更新」表示
//  - プロフィール設定サブ画面に曜日別3択(wgSegHTML)+saveMyWg（未選択ガード・svSafeUpdate('p')でwgのみ更新）
//  - 新キーtgroup（SK/D追加）。myGroupInfo()=最新tgroupから自分の所属を返す（未設定/除外/未割当はnull）
//  - myGroupCardHtml()=「午前組・A班（同じ班：…）」。mode singleは「A班」。未所属は''
//  - v2: ゲスト（その曜日だけ逆の組の班）→myGroupInfo().guests/schedule・カードと全班一覧に曜日別の行き先と班メンバーのBP/SQ/DL（直近の記録）
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
ok('サブ: 曜日別3択(月火木×午前のみ/午後のみ/どちらでも)',has(ps,'id="wg-mon-am"')&&has(ps,'id="wg-tue-pm"')&&has(ps,'id="wg-thu-any"')&&has(ps,'>午前のみ<')&&has(ps,'>どちらでも<'));
ok('サブ: 曜日ごとの値はhidden input(wg-mon/tue/thu)',has(ps,'id="wg-mon"')&&has(ps,'id="wg-tue"')&&has(ps,'id="wg-thu"'));
ok('サブ: 遠方チェック',has(ps,'id="wg-far"'));
ok('サブ: 「どちらでも」の日の希望セレクト',has(ps,'id="wg-pref"')&&has(ps,'「どちらでも」の日の希望')&&has(ps,'午前がいい')&&has(ps,'午後がいい'));
ok('サブ: 保存ボタン(saveMyWg(this))',has(ps,'saveMyWg(this)'));
ok('サブ: subView=true',subView===true);
ok('未回答時は何も選択されていない・checkedなし',!has(ps,'aria-pressed="true"')&&!has(ps,' checked'));
ok('未回答時は旧形式の注意なし',!has(ps,'前の形式'));

// ============ 2. 旧形式wgのプリフィル＋mypageサマリー（読み側wgNormで変換） ============
print('--- showProfileSettings: 旧形式wgのプリフィル（5限の曜日→午前のみ） ---');
D.p[0].wg={f5:['mon','thu'],far:true,pref:'pm',upd:'2026-07-01T00:00:00.000Z'};
subView=null;
showProfileSettings();
var mp2=__els['main'].innerHTML;
ok('月=午前のみが選択',has(mp2,'id="wg-mon-am" aria-pressed="true"')&&has(mp2,'id="wg-mon" value="am"'));
ok('木=午前のみが選択',has(mp2,'id="wg-thu-am" aria-pressed="true"'));
ok('火=どちらでもが選択',has(mp2,'id="wg-tue-any" aria-pressed="true"')&&has(mp2,'id="wg-tue" value="any"'));
ok('遠方がchecked',has(mp2,'id="wg-far" checked'));
ok('希望pmがselected',has(mp2,'value="pm" selected'));
ok('旧形式の注意（確認して保存）',has(mp2,'前の形式'));
subView=null;
T.mypage();
var mpSum=__els['main'].innerHTML;
ok('サマリー: 曜日別（月午前・火どちらでも・木午前）',has(mpSum,'月午前・火どちらでも・木午前'));
ok('サマリー: 午後希望',has(mpSum,'午後希望'));
ok('サマリー: 旧形式は要更新',has(mpSum,'要更新'));

// ============ 3. saveMyWg（v2保存・未選択ガード・他フィールド不変・完了後サブ画面維持） ============
print('--- saveMyWg: 未選択の曜日があると保存しない ---');
D.p[0].wg=undefined;
__store['p']=JSON.stringify(D.p);
subView=null;
showProfileSettings(); // WG UIを描画してidを用意
['mon','tue','thu'].forEach(function(k){document.getElementById('wg-'+k).value='';});
wgSegPick('wg','mon','am');wgSegPick('wg','thu','pm');
__alerts.length=0;
saveMyWg();drain();
ok('未選択(火)→alertで曜日を伝える',__alerts.length===1&&has(__alerts[0],'火'));
ok('未選択→保存されない',!JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg);

print('--- saveMyWg: v2形で保存 ---');
wgSegPick('wg','tue','any');
document.getElementById('wg-far').checked=false;document.getElementById('wg-pref').value='am';
__alerts.length=0;
saveMyWg(mkEl());drain();
ok('保存完了後もサブ画面維持(subView=true)',subView===true);
var pStore=JSON.parse(__store['p']);
var meRec=pStore.find(function(x){return x.id===1;});
ok('wgが保存される',meRec&&meRec.wg&&typeof meRec.wg==='object');
ok('v:2',meRec.wg.v===2);
ok('days=月am/火""(どちらでも)/木pm',meRec.wg.days.mon==='am'&&meRec.wg.days.tue===''&&meRec.wg.days.thu==='pm');
ok('旧f5・legacyフラグは保存しない',!('f5' in meRec.wg)&&!('legacy' in meRec.wg));
ok('far=false',meRec.wg.far===false);
ok('pref=am',meRec.wg.pref==='am');
ok('updがISO文字列',typeof meRec.wg.upd==='string'&&meRec.wg.upd.length>0);
ok('他フィールド不変(name/position/height)',meRec.name==='田中 蓮'&&meRec.position==='PR'&&meRec.height==='180');
ok('別選手のwgは付かない',!pStore.find(function(x){return x.id===2;}).wg);
ok('D.pもメモリ更新',D.p.find(function(x){return x.id===1;}).wg.pref==='am');
ok('保存フローでalertなし',__alerts.length===0);
subView=null;T.mypage();
ok('v2保存後のサマリーは要更新なし',!has(__els['main'].innerHTML,'要更新')&&has(__els['main'].innerHTML,'月午前・火どちらでも・木午後'));

// 希望「どちらでも」→pref=null
print('--- saveMyWg: どちらでも→pref=null ---');
subView=null;showProfileSettings();
wgSegPick('wg','mon','pm');wgSegPick('wg','tue','pm');wgSegPick('wg','thu','pm');
document.getElementById('wg-pref').value='';
saveMyWg();drain();
var wgNull=JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg;
ok('pref=null（どちらでも）',wgNull.pref===null);
ok('3日とも午後のみ',wgNull.days.mon==='pm'&&wgNull.days.tue==='pm'&&wgNull.days.thu==='pm');

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

print('--- myGroupInfo/myGroupCardHtml: ゲスト曜日（v2）・班メンバーの1セット重量 ---');
D.tlog=[
  {id:'w1',pid:1,menuId:9,date:TODAY,ts:'2026-09-01T10:00:00.000Z',results:[{exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:80,reps:3}]},{exName:'スクワット(スピード)',sets:[{weight:120,reps:3}]},{exName:'デットリフト(スピード)',sets:[{weight:140,reps:2}]}]},
  {id:'w2',pid:2,menuId:9,date:TODAY,ts:'2026-09-01T10:00:00.000Z',results:[{exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:85,reps:3}]}]}
];
D.tgroup=[{id:10,ts:10,date:TODAY,by:'staff',mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2],[3]],guests:[]},
  {key:'pm',label:'午後',groups:[[10,11],[12,13]],guests:[{pid:1,day:'thu',gi:1},{pid:1,day:'mon',gi:null}]}
]}];
var gv=myGroupInfo();
ok('ホーム=午前A班・ゲスト=木だけ午後B班（未配置のゲストは数えない）',gv&&gv.shiftLabel==='午前'&&gv.groupLetter==='A'&&gv.guests.length===1&&gv.guests[0].day==='thu'&&gv.guests[0].groupLetter==='B'&&gv.guests[0].shiftLabel==='午後');
ok('曜日別の行き先: 月・火=午前A班／木=午後B班（ゲスト）',gv.schedule.length===2&&gv.schedule[0].label==='月・火'&&gv.schedule[0].guest===false&&gv.schedule[1].label==='木'&&gv.schedule[1].guest===true);
var cv=myGroupCardHtml();
ok('カードに曜日別の行き先',has(cv,'月・火: 午前 A班 ／ 木: 午後 B班（ゲスト）'));
ok('カードに班メンバーの1セット重量（記録なしの種目は—）',has(cv,'BP80 SQ120 DL140')&&has(cv,'BP85 SQ— DL—'));
D.tgroup=[{id:11,ts:11,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[5,6]],guests:[{pid:1,day:'tue',gi:0}]},
  {key:'pm',label:'午後',groups:[[7]],guests:[]}
]}];
var go=myGroupInfo();
ok('ホームの班が無くゲストだけでも情報を返す',go&&go.groupLetter===null&&go.guests.length===1&&go.schedule.length===1&&go.schedule[0].label==='火');
var co=myGroupCardHtml();
ok('ゲストだけのカード: A班＋ゲスト表示',has(co,'A班')&&has(co,'>ゲスト</div>'));
D.tgroup=[{id:12,ts:12,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[1,2,3]]},{key:'pm',label:'午後',groups:[]}]}];
ok('ゲストが無ければ曜日別の行き先は出さない（旧記録=guests無しでも動く）',myGroupInfo().schedule.length===1&&!has(myGroupCardHtml(),'（ゲスト）'));
D.tlog=[];

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
// P8b: グループカードはトレーニングタブへ移設＝ホームには出ない
ok('T.homeにMY GROUPは出ない(P8b)',!has(__els['main'].innerHTML,'MY GROUP'));
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

print('--- showAllGroups: ゲストの表示・MY（ゲスト）・1セット重量 ---');
D.tgroup=[{id:13,ts:13,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3]],guests:[{pid:1,day:'thu',gi:0}]}
]}];
D.tlog=[{id:'w3',pid:3,menuId:9,date:TODAY,ts:'2026-09-01T10:00:00.000Z',results:[{exName:'スクワット(スピード)',sets:[{weight:130,reps:3}]}]}];
subView=null;curTab='training';
showAllGroups();
var ag2=__els['main'].innerHTML;
ok('ゲスト先の班に「ゲスト（木）」と自分・MY（木・ゲスト）',has(ag2,'ゲスト（木）')&&has(ag2,'MY（木・ゲスト）'));
ok('あなたの行き先（曜日別）',has(ag2,'あなたの行き先')&&has(ag2,'月・火: 午前 A班 ／ 木: 午後 A班（ゲスト）'));
ok('メンバーの1セット重量',has(ag2,'BP— SQ130 DL—'));
D.tlog=[];

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
