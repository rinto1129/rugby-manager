// Phase 7 (player側): ウエイト時間帯アンケート(wg) + グループ表示（曜日タブ）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_tgroup_player.js
// 仕様（プランPhase 7節＋ウエイトグループ分けv2＋2026-09-13仕様変更「選手の入力を元の形に戻す／スタッフの曜日指定／曜日タブ表示」）:
//  - p.wg={f5:[5限の曜日],far,pref,upd, ov:{mon,tue,thu:'am'|'pm'|''}(任意),ovUpd(任意)}。f5/far/pref/upd=選手の自己申告、ov/ovUpd=スタッフの曜日指定（staffのdoSaveWgだけが書く）
//  - wgNorm(wg)→null | {f5,ov,hasOv,days(実効値=ov優先・無ければ5限の曜日は'am'),far,pref,upd,ovUpd,answered}。一時形式{v:2,days}は'am'→f5・'pm'→ov'pm'として読む。冪等・非破壊
//  - プロフィール設定サブ画面: 5限チェック(wg-mon/tue/thu)＋wg-far＋wg-pref（曜日別3択ボタンは無い）。hasOvならalert-infoにwgOvTxt（読み取り専用）
//  - saveMyWg(btnEl): {f5,far,pref,upd}を書き、サーバー最新のov/ovUpdをhasOvなら引き継ぐ（updateFnはlatestだけから計算＝純粋・再実行可）
//  - マイページ要約 _wgTxt: '5限 火・木／午後希望'・未回答は赤'未回答'・hasOvなら'火は午後（スタッフ設定）'
//  - myGroupInfo: 班未定のゲスト(gi==null)も guests に {gi:null,groupLetter:null,members:[]} で入る。ホーム組を指すゲストは除外。ホームも班の決まったゲストも無ければnull
//  - myGroupScheduleTxt「月・火: 午前 A班 ／ 木: 午後 C班」（「（ゲスト）」は付けない）・班未定は「木: 午後（班未定）」
//  - myGroupCardHtml: ホームが無い時は班の決まった最初のゲスト先＋班の文字の下に「火・木のみ」（「ゲスト」ではない）。行き先行は guests があれば表示
//  - showAllGroups: 曜日タブ(tgDayTabsHtml(day,'agSetDay')・window._agDay・agSetDay(day)で再描画)。その曜日の実際の班をtgDayShiftsで表示:
//    here の人（ゲストは '木のみ' 印・破線枠）、away の人は opacity .55 で '木曜は → 午後 A班'（班未定は '火曜は → 午後（班未定）'・「未配置」の語は出さない）。MY バッジ=その日その班に自分がいる時。mode singleは曜日タブ無し
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function cnt(h,sub){return String(h).split(sub).length-1;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
drain(); // 起動時のld()→go('home')チェーンを流しきる
confirm=function(m){return true;};

var TODAY=todayStr();
// 5限チェック(wg-mon/tue/thu)の状態をまとめて設定（モック要素は__elsに残るので毎回全曜日を明示する）
function setF5(days){WG_DAYS.forEach(function(d){document.getElementById('wg-'+d.k).checked=days.indexOf(d.k)>=0;});}

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

// ============ 1. wgNorm / wgDayShift / wgF5Txt / wgOvTxt（読み側の正規化） ============
print('--- wgNorm: 正規化（旧形式・ov・一時形式v2・冪等・非破壊） ---');
ok('wgが無い/オブジェクトでない→null',wgNorm(undefined)===null&&wgNorm(null)===null&&wgNorm('x')===null&&wgNorm(5)===null);
var rawA={f5:['mon','thu','wed'],far:1,pref:'pm',upd:'2026-07-01T00:00:00.000Z'};
var rawAJson=JSON.stringify(rawA);
var nA=wgNorm(rawA);
ok('申告のみ: f5はWG_DAYS内だけ（水は破棄）',nA.f5.length===2&&nA.f5[0]==='mon'&&nA.f5[1]==='thu');
ok('申告のみ: days=5限の曜日は午前・他は\'\'',nA.days.mon==='am'&&nA.days.tue===''&&nA.days.thu==='am');
ok('申告のみ: far真偽化・pref・upd・answered',nA.far===true&&nA.pref==='pm'&&nA.upd===rawA.upd&&nA.answered===true);
ok('申告のみ: ovは全て\'\'・hasOv=false・ovUpd=null',nA.ov.mon===''&&nA.ov.tue===''&&nA.ov.thu===''&&nA.hasOv===false&&nA.ovUpd===null);
ok('入力は変更しない（非破壊）',JSON.stringify(rawA)===rawAJson);
ok('冪等（正規化済みを再度通しても同じ）',JSON.stringify(wgNorm(nA))===JSON.stringify(nA));
var nB=wgNorm({f5:['tue'],far:false,pref:null,upd:'2026-07-01T00:00:00.000Z',ov:{tue:'pm',thu:'am',mon:'zzz'},ovUpd:'2026-09-13T00:00:00.000Z'});
ok('ov: 5限より優先（火=5限だがov午後→days.tue=pm）',nB.days.tue==='pm');
ok('ov: 木=午前・不正値(mon)は\'\'',nB.days.thu==='am'&&nB.ov.thu==='am'&&nB.ov.mon===''&&nB.days.mon==='');
ok('ov: hasOv=true・ovUpd',nB.hasOv===true&&nB.ovUpd==='2026-09-13T00:00:00.000Z');
ok('ov: f5は申告のまま',nB.f5.length===1&&nB.f5[0]==='tue');
var nC=wgNorm({ov:{mon:'pm'}});
ok('ovだけ（未回答）: answered=false・hasOv=true・days.mon=pm',nC.answered===false&&nC.hasOv===true&&nC.days.mon==='pm'&&nC.f5.length===0);
var nD=wgNorm({v:2,days:{mon:'am',tue:'pm',thu:''},far:true,pref:'am',upd:'2026-09-13T00:00:00.000Z'});
ok('一時形式v2: am→5限扱い',nD.f5.length===1&&nD.f5[0]==='mon');
ok('一時形式v2: pm→指定pm（hasOv）',nD.ov.tue==='pm'&&nD.hasOv===true&&nD.ov.mon===''&&nD.ov.thu==='');
ok('一時形式v2: days実効値・far/pref/upd',nD.days.mon==='am'&&nD.days.tue==='pm'&&nD.days.thu===''&&nD.far===true&&nD.pref==='am'&&nD.answered===true);
ok('一時形式v2: ovが明示されていればそちらが優先',wgNorm({v:2,days:{tue:'pm'},ov:{tue:'am'}}).ov.tue==='am');
ok('wgDayShift: 生のwgでも正規化済みでも実効値',wgDayShift({f5:['thu'],upd:'x',ov:{tue:'pm'}},'thu')==='am'&&wgDayShift(nB,'tue')==='pm'&&wgDayShift(undefined,'mon')===''&&wgDayShift(nA,'tue')==='');
ok('wgF5Txt: 5限 火・木 / 5限なし / 未回答は\'\'',wgF5Txt(wgNorm({f5:['tue','thu'],upd:'x'}))==='5限 火・木'&&wgF5Txt(wgNorm({f5:[],upd:'x'}))==='5限なし'&&wgF5Txt(wgNorm({ov:{mon:'am'}}))===''&&wgF5Txt(null)==='');
ok('wgOvTxt: 火は午後・木は午前 / 指定なしは\'\'',wgOvTxt(nB)==='火は午後・木は午前'&&wgOvTxt(nA)===''&&wgOvTxt(null)==='');

// ============ 2. T.mypage 導線カード（WG UIは設定サブ画面へ移設） ============
print('--- T.mypage: プロフィール導線カード ---');
subView=null;
T.mypage();
var mp=__els['main'].innerHTML;
ok('プロフィール設定への導線',has(mp,'showProfileSettings()')&&has(mp,'プロフィール設定'));
ok('WG UIはmypageに出ない',!has(mp,'id="wg-mon"'));
ok('身長サマリー(180cm)',has(mp,'180cm'));
ok('wg未回答サマリー',has(mp,'未回答'));
ok('未回答時はスタッフ設定表示なし',!has(mp,'スタッフ設定'));

print('--- showProfileSettings: サブ画面にWG UI（wg未設定=空） ---');
subView=null;
showProfileSettings();
var ps=__els['main'].innerHTML;
ok('サブ: 身長input',has(ps,'id="mh-input"'));
ok('サブ: アンケート見出し(WEIGHT SESSION)',has(ps,'WEIGHT SESSION')&&has(ps,'ウエイト時間帯アンケート'));
ok('サブ: 5限がある曜日のチェック(wg-mon/tue/thu)',has(ps,'月・火・木で5限がある曜日')&&has(ps,'type="checkbox" id="wg-mon"')&&has(ps,'type="checkbox" id="wg-tue"')&&has(ps,'type="checkbox" id="wg-thu"'));
ok('サブ: 曜日別3択ボタンは無い',!has(ps,'id="wg-mon-am"')&&!has(ps,'id="wg-tue-pm"')&&!has(ps,'id="wg-thu-any"')&&!has(ps,'>午前のみ<')&&!has(ps,'>午後のみ<')&&!has(ps,'aria-pressed'));
ok('サブ: 遠方チェック',has(ps,'type="checkbox" id="wg-far"'));
ok('サブ: 時間帯の希望セレクト',has(ps,'id="wg-pref"')&&has(ps,'時間帯の希望')&&has(ps,'>どちらでも<')&&has(ps,'午前がいい')&&has(ps,'午後がいい'));
ok('サブ: 保存ボタン(saveMyWg(this))',has(ps,'saveMyWg(this)'));
ok('サブ: subView=true',subView===true);
ok('未回答時は何もcheckedされていない',!has(ps,' checked'));
ok('未回答時は「どちらでも」がselected',has(ps,'value="" selected'));
ok('未回答時はスタッフ設定の案内なし',!has(ps,'スタッフの設定'));
ok('旧形式の注意は出ない（f5が正式形）',!has(ps,'前の形式'));

// ============ 3. プリフィル＋mypageサマリー ============
print('--- showProfileSettings: 申告のプリフィル（5限 月・木／遠方／午後希望） ---');
D.p[0].wg={f5:['mon','thu'],far:true,pref:'pm',upd:'2026-07-01T00:00:00.000Z'};
subView=null;
showProfileSettings();
var mp2=__els['main'].innerHTML;
ok('月・木がchecked',has(mp2,'id="wg-mon" checked')&&has(mp2,'id="wg-thu" checked'));
ok('火はcheckedでない',!has(mp2,'id="wg-tue" checked'));
ok('遠方がchecked',has(mp2,'id="wg-far" checked'));
ok('希望pmがselected',has(mp2,'value="pm" selected')&&!has(mp2,'value="" selected'));
ok('指定なし→スタッフ設定の案内なし',!has(mp2,'スタッフの設定'));
subView=null;
T.mypage();
var mpSum=__els['main'].innerHTML;
ok('サマリー: 5限 月・木／午後希望',has(mpSum,'5限 月・木／午後希望'));
ok('サマリー: 未回答/要更新/スタッフ設定は出ない',!has(mpSum,'未回答')&&!has(mpSum,'要更新')&&!has(mpSum,'スタッフ設定'));

print('--- showProfileSettings/T.mypage: スタッフの曜日指定(ov)あり ---');
D.p[0].wg={f5:['tue','thu'],far:false,pref:null,upd:'2026-07-01T00:00:00.000Z',ov:{tue:'pm'},ovUpd:'2026-09-13T00:00:00.000Z'};
subView=null;
showProfileSettings();
var mp3=__els['main'].innerHTML;
ok('火・木がchecked・月は未',has(mp3,'id="wg-tue" checked')&&has(mp3,'id="wg-thu" checked')&&!has(mp3,'id="wg-mon" checked'));
ok('遠方は未・希望どちらでも',!has(mp3,'id="wg-far" checked')&&has(mp3,'value="" selected'));
ok('スタッフの設定を読み取り表示（alert-info・火は午後）',has(mp3,'alert-info')&&has(mp3,'スタッフの設定: <b>火は午後</b>'));
ok('指定は編集部品にならない（曜日指定のボタン/hiddenは無い）',!has(mp3,'id="wg-tue-pm"')&&!has(mp3,'ewg-'));
subView=null;
T.mypage();
var mpSum3=__els['main'].innerHTML;
ok('サマリー: 5限 火・木',has(mpSum3,'5限 火・木'));
ok('サマリー: 火は午後（スタッフ設定）',has(mpSum3,'火は午後（スタッフ設定）'));
ok('サマリー: 希望なしなら／は付かない',!has(mpSum3,'5限 火・木／'));

print('--- T.mypage: 未回答＋指定だけ ---');
D.p[0].wg={ov:{mon:'am'},ovUpd:'2026-09-13T00:00:00.000Z'};
subView=null;
T.mypage();
var mpSum4=__els['main'].innerHTML;
ok('サマリー: 未回答（赤）',has(mpSum4,'未回答'));
ok('サマリー: 月は午前（スタッフ設定）も併記',has(mpSum4,'月は午前（スタッフ設定）'));
subView=null;
showProfileSettings();
var ps4=__els['main'].innerHTML;
ok('サブ: 未回答なので5限チェックは全て未・スタッフの設定は表示',!has(ps4,'id="wg-mon" checked')&&!has(ps4,'id="wg-tue" checked')&&!has(ps4,'id="wg-thu" checked')&&has(ps4,'スタッフの設定: <b>月は午前</b>'));

print('--- 一時形式v2（曜日別3択・本番1名）の読み ---');
D.p[0].wg={v:2,days:{mon:'am',tue:'pm',thu:''},far:false,pref:'am',upd:'2026-09-13T00:00:00.000Z'};
subView=null;
showProfileSettings();
var ps5=__els['main'].innerHTML;
ok('am→5限（月checked）・pm/\'\'は未',has(ps5,'id="wg-mon" checked')&&!has(ps5,'id="wg-tue" checked')&&!has(ps5,'id="wg-thu" checked'));
ok('pm→スタッフの設定 火は午後',has(ps5,'スタッフの設定: <b>火は午後</b>'));
ok('希望amがselected',has(ps5,'value="am" selected'));
subView=null;
T.mypage();
ok('サマリー: 5限 月／午前希望 ＋ 火は午後（スタッフ設定）',has(__els['main'].innerHTML,'5限 月／午前希望')&&has(__els['main'].innerHTML,'火は午後（スタッフ設定）'));

// ============ 4. saveMyWg（{f5,far,pref,upd}保存・ov引き継ぎ・他フィールド不変・完了後サブ画面維持） ============
print('--- saveMyWg: {f5,far,pref,upd} で保存 ---');
D.p[0].wg=undefined;
__store['p']=JSON.stringify(D.p);
subView=null;
showProfileSettings(); // WG UIを描画してidを用意
setF5(['tue','thu']);
document.getElementById('wg-far').checked=false;document.getElementById('wg-pref').value='am';
__alerts.length=0;
var __t0=new Date().toISOString();
saveMyWg(mkEl());drain();
ok('保存完了後もサブ画面維持(subView=true)',subView===true);
var pStore=JSON.parse(__store['p']);
var meRec=pStore.find(function(x){return x.id===1;});
ok('wgが保存される',meRec&&meRec.wg&&typeof meRec.wg==='object');
ok('f5=[tue,thu]',Array.isArray(meRec.wg.f5)&&meRec.wg.f5.length===2&&meRec.wg.f5[0]==='tue'&&meRec.wg.f5[1]==='thu');
ok('far=false',meRec.wg.far===false);
ok('pref=am',meRec.wg.pref==='am');
ok('updがISO文字列（今）',typeof meRec.wg.upd==='string'&&meRec.wg.upd>=__t0);
ok('v/days/legacyは保存しない',!('v' in meRec.wg)&&!('days' in meRec.wg)&&!('legacy' in meRec.wg));
ok('指定が無ければov/ovUpdキーを書かない',!('ov' in meRec.wg)&&!('ovUpd' in meRec.wg));
ok('他フィールド不変(name/position/height)',meRec.name==='田中 蓮'&&meRec.position==='PR'&&meRec.height==='180');
ok('別選手のwgは付かない',!pStore.find(function(x){return x.id===2;}).wg);
ok('D.pもメモリ更新',D.p.find(function(x){return x.id===1;}).wg.pref==='am');
ok('保存フローでalertなし',__alerts.length===0);
subView=null;T.mypage();
ok('保存後のサマリー: 5限 火・木／午前希望',has(__els['main'].innerHTML,'5限 火・木／午前希望')&&!has(__els['main'].innerHTML,'未回答'));

print('--- saveMyWg: 5限なし・希望どちらでも→f5=[]・pref=null ---');
subView=null;showProfileSettings();
setF5([]);
document.getElementById('wg-far').checked=true;document.getElementById('wg-pref').value='';
saveMyWg();drain();
var wgNull=JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg;
ok('f5=[]（5限なし）',Array.isArray(wgNull.f5)&&wgNull.f5.length===0);
ok('pref=null（どちらでも）',wgNull.pref===null);
ok('far=true',wgNull.far===true);
subView=null;T.mypage();
ok('サマリー: 5限なし',has(__els['main'].innerHTML,'5限なし'));

print('--- saveMyWg: サーバー最新のov/ovUpdを引き継ぐ（updateFnをlatestで直接実行） ---');
// サーバー側にだけスタッフの指定がある状態（メモリのD.pは古い）＝updateFnがlatestから計算していることを確かめる
var srvP=JSON.parse(__store['p']);
srvP.find(function(x){return x.id===1;}).wg={f5:['mon'],far:false,pref:null,upd:'2026-07-01T00:00:00.000Z',ov:{tue:'pm'},ovUpd:'2026-09-13T00:00:00.000Z'};
__store['p']=JSON.stringify(srvP);
D.p[0].wg={f5:['mon'],far:false,pref:null,upd:'2026-07-01T00:00:00.000Z'}; // メモリはov無し（古い）
subView=null;showProfileSettings();
ok('メモリが古ければ画面にはスタッフ設定は出ない（前提確認）',!has(__els['main'].innerHTML,'スタッフの設定'));
setF5(['mon','thu']);
document.getElementById('wg-far').checked=false;document.getElementById('wg-pref').value='pm';
var _svSafeUpdate=svSafeUpdate,__capFn=null,__capK=null;
svSafeUpdate=function(k,fn,cb,err){__capK=k;__capFn=fn;return _svSafeUpdate(k,fn,cb,err);};
saveMyWg(mkEl());drain();
svSafeUpdate=_svSafeUpdate;
ok('svSafeUpdate(\'p\')で保存',__capK==='p'&&typeof __capFn==='function');
var wgOv=JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg;
ok('申告は新しい値（f5=[mon,thu]・pref=pm）',wgOv.f5.length===2&&wgOv.f5[1]==='thu'&&wgOv.pref==='pm');
ok('サーバー最新のovを引き継ぐ（火=午後）',wgOv.ov&&wgOv.ov.tue==='pm'&&!wgOv.ov.mon&&!wgOv.ov.thu);
ok('ovUpdも引き継ぐ',wgOv.ovUpd==='2026-09-13T00:00:00.000Z');
ok('updは新しくなる',wgOv.upd>'2026-07-01T00:00:00.000Z');
// updateFnをlatestで直接実行: 純粋（同じlatestで何度実行しても同じ結果・DOMやD.pに依存しない）
var latest1=[{id:1,name:'田中 蓮',wg:{f5:['tue'],far:true,pref:'am',upd:'2026-07-01T00:00:00.000Z',ov:{thu:'am'},ovUpd:'2026-09-10T00:00:00.000Z'}},{id:2,name:'山田 太郎'}];
setF5([]);document.getElementById('wg-pref').value='';document.getElementById('wg-far').checked=true; // DOMを変えてもupdateFnの結果は変わらない（外で読んだ変数を使う）
var r1=__capFn(JSON.parse(JSON.stringify(latest1)));
var r2=__capFn(JSON.parse(JSON.stringify(latest1)));
ok('updateFn直接実行: 申告はDOM由来ではなく呼び出し時の値（f5=[mon,thu]・pref=pm・far=false）',r1[0].wg.f5.length===2&&r1[0].wg.f5[0]==='mon'&&r1[0].wg.pref==='pm'&&r1[0].wg.far===false);
ok('updateFn直接実行: latestのov/ovUpdを引き継ぐ（木=午前）',r1[0].wg.ov.thu==='am'&&r1[0].wg.ov.tue===''&&r1[0].wg.ovUpd==='2026-09-10T00:00:00.000Z');
ok('updateFn直接実行: 再実行しても同じ結果（純粋）',JSON.stringify(r1)===JSON.stringify(r2));
ok('updateFn直接実行: 他選手は無変更・配列を返す',Array.isArray(r1)&&r1.length===2&&!r1[1].wg&&r1[1].name==='山田 太郎');
var r3=__capFn([{id:1,name:'田中 蓮',wg:{f5:['tue'],upd:'x'}}]);
ok('updateFn直接実行: latestに指定が無ければov/ovUpdキーを書かない',!('ov' in r3[0].wg)&&!('ovUpd' in r3[0].wg));
var r4=__capFn([{id:1,name:'田中 蓮',wg:{v:2,days:{mon:'am',tue:'pm',thu:''},upd:'x'}}]);
ok('updateFn直接実行: 一時形式v2のpmは指定として引き継ぎ・v/daysは消える',r4[0].wg.ov&&r4[0].wg.ov.tue==='pm'&&!('v' in r4[0].wg)&&!('days' in r4[0].wg)&&r4[0].wg.f5.length===2);
var r5=__capFn([{id:9,name:'他人'}]);
ok('updateFn直接実行: 自分がlatestに居なければそのまま返す',r5.length===1&&!r5[0].wg);
ok('保存後の画面にスタッフの設定（火は午後）',has(__els['main'].innerHTML,'スタッフの設定: <b>火は午後</b>'));

print('--- saveMyWg: 保存失敗時はボタン解放＋alert ---');
var _rt=db.runTransaction;
db.runTransaction=function(){return Promise.reject(new Error('offline'));};
subView=null;showProfileSettings();
setF5(['mon']);
var failBtn=mkEl();failBtn.innerHTML='時間帯を保存';
__alerts.length=0;
saveMyWg(failBtn);
ok('保存中はボタンがdisabled',failBtn.disabled===true);
drain();
db.runTransaction=_rt;
ok('失敗→alert',__alerts.length===1&&has(__alerts[0],'保存できませんでした'));
ok('失敗→ボタン解放',failBtn.disabled===false&&failBtn.innerHTML==='時間帯を保存');
D.p[0].wg=JSON.parse(__store['p']).find(function(x){return x.id===1;}).wg;

// ============ 5. myGroupInfo / myGroupCardHtml（変更なし） ============
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
ok('ホーム=午前A班・ゲスト2件（木=午後B班／月=午後・班未定もguestsに入る）',gv&&gv.shiftLabel==='午前'&&gv.groupLetter==='A'&&gv.guests.length===2);
var gvThu=gv.guests.filter(function(x){return x.day==='thu';})[0],gvMon=gv.guests.filter(function(x){return x.day==='mon';})[0];
ok('木のゲスト: 午後B班・members=B班',gvThu&&gvThu.groupLetter==='B'&&gvThu.shiftLabel==='午後'&&gvThu.shiftKey==='pm'&&gvThu.shiftIdx===1&&gvThu.gi===1&&gvThu.members.length===2&&gvThu.members[0]===12);
ok('月のゲスト（班未定）: gi=null・groupLetter=null・members=[]・午後',gvMon&&gvMon.gi===null&&gvMon.groupLetter===null&&Array.isArray(gvMon.members)&&gvMon.members.length===0&&gvMon.shiftLabel==='午後'&&gvMon.shiftKey==='pm'&&gvMon.shiftIdx===1);
ok('曜日別の行き先: 月=午後・班未定／火=午前A班／木=午後B班（曜日順）',gv.schedule.length===3&&gv.schedule[0].label==='月'&&gv.schedule[0].groupLetter===null&&gv.schedule[0].shiftLabel==='午後'&&gv.schedule[0].guest===true&&
  gv.schedule[1].label==='火'&&gv.schedule[1].groupLetter==='A'&&gv.schedule[1].guest===false&&gv.schedule[2].label==='木'&&gv.schedule[2].groupLetter==='B'&&gv.schedule[2].guest===true);
ok('myGroupScheduleTxt: 班未定は「午後（班未定）」・「（ゲスト）」は付かない',myGroupScheduleTxt(gv)==='月: 午後（班未定） ／ 火: 午前 A班 ／ 木: 午後 B班');
var cv=myGroupCardHtml();
ok('カードに曜日別の行き先（班未定を含む）',has(cv,'月: 午後（班未定） ／ 火: 午前 A班 ／ 木: 午後 B班')&&!has(cv,'（ゲスト）')&&!has(cv,'未配置'));
ok('カードはホームの班（午前組・A班）・「のみ」印は無い',has(cv,'午前組')&&has(cv,'A班')&&!has(cv,'のみ</div>'));
ok('カードに班メンバーの1セット重量（記録なしの種目は—）',has(cv,'BP80 SQ120 DL140')&&has(cv,'BP85 SQ— DL—'));
ok('myGroupScheduleTxt: null/scheduleなしは空文字',myGroupScheduleTxt(null)===''&&myGroupScheduleTxt({})==='');

print('--- myGroupInfo: 班の決まったゲストだけ（月・火: 午前 A班 ／ 木: 午後 B班） ---');
D.tgroup=[{id:16,ts:16,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2],[3]],guests:[]},
  {key:'pm',label:'午後',groups:[[10,11],[12,13]],guests:[{pid:1,day:'thu',gi:1}]}
]}];
var gb=myGroupInfo();
ok('schedule 2件: 月・火=午前A班（guest:false）／木=午後B班（guest:true）',gb&&gb.guests.length===1&&gb.schedule.length===2&&gb.schedule[0].label==='月・火'&&gb.schedule[0].guest===false&&gb.schedule[0].days.join()==='mon,tue'&&gb.schedule[1].label==='木'&&gb.schedule[1].guest===true);
ok('行き先の1行: 月・火: 午前 A班 ／ 木: 午後 B班',myGroupScheduleTxt(gb)==='月・火: 午前 A班 ／ 木: 午後 B班');
ok('カードに行き先・（ゲスト）無し',has(myGroupCardHtml(),'月・火: 午前 A班 ／ 木: 午後 B班')&&!has(myGroupCardHtml(),'（ゲスト）'));

print('--- myGroupInfo/myGroupCardHtml: ホームの班が無くゲストだけ ---');
D.tgroup=[{id:11,ts:11,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[5,6]],guests:[{pid:1,day:'tue',gi:0}]},
  {key:'pm',label:'午後',groups:[[7]],guests:[]}
]}];
var go=myGroupInfo();
ok('ホームの班が無くゲストだけでも情報を返す',go&&go.groupLetter===null&&go.shiftKey===null&&go.members.length===0&&go.mates.length===0&&go.guests.length===1&&go.schedule.length===1&&go.schedule[0].label==='火');
var co=myGroupCardHtml();
ok('ゲストだけのカード: A班＋班の文字の下は「火のみ」（「ゲスト」ではない）',has(co,'A班')&&has(co,'>火のみ</div>')&&!has(co,'>ゲスト</div>'));
ok('ゲストだけのカード: 行き先組のチップ（午前組）',has(co,'午前組')&&!has(co,'午後組'));
ok('ゲストだけのカード: 行き先行「火: 午前 A班」',has(co,'火: 午前 A班'));
D.tgroup=[{id:17,ts:17,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[5,6]],guests:[{pid:1,day:'tue',gi:0},{pid:1,day:'thu',gi:0}]},
  {key:'pm',label:'午後',groups:[[7]],guests:[]}
]}];
var go2=myGroupInfo();
ok('ゲストだけ（火・木とも午前A班）: scheduleは1件にまとまる',go2&&go2.guests.length===2&&go2.schedule.length===1&&go2.schedule[0].label==='火・木');
var co2=myGroupCardHtml();
ok('ゲストだけのカード: 班の文字の下「火・木のみ」',has(co2,'>火・木のみ</div>')&&has(co2,'火・木: 午前 A班'));
D.tgroup=[{id:18,ts:18,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[5,6]],guests:[{pid:1,day:'tue',gi:0}]},
  {key:'pm',label:'午後',groups:[[7]],guests:[{pid:1,day:'thu',gi:null}]}
]}];
var go3=myGroupInfo();
ok('ゲストだけ（火=午前A班・木=午後 班未定）: 両方guestsに入る',go3&&go3.groupLetter===null&&go3.guests.length===2&&go3.schedule.length===2);
var co3=myGroupCardHtml();
ok('カードは班の決まった行き先（午前A班）・下は「火のみ」（未定の木は数えない）',has(co3,'午前組')&&has(co3,'A班')&&has(co3,'>火のみ</div>')&&!has(co3,'火・木のみ'));
ok('カードの行き先行に班未定も出る',has(co3,'火: 午前 A班 ／ 木: 午後（班未定）')&&!has(co3,'未配置'));
D.tgroup=[{id:19,ts:19,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[5,6]],guests:[]},
  {key:'pm',label:'午後',groups:[[7]],guests:[{pid:1,day:'tue',gi:null},{pid:1,day:'thu',gi:null}]}
]}];
ok('ホームが無く班未定のゲストだけ→null',myGroupInfo()===null);
ok('ホームが無く班未定のゲストだけ→カード空文字',myGroupCardHtml()==='');

print('--- myGroupInfo: ホーム組を指すゲスト（異常データ）は無視 ---');
D.tgroup=[{id:20,ts:20,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2],[3]],guests:[{pid:1,day:'thu',gi:1},{pid:1,day:'tue',gi:null}]},
  {key:'pm',label:'午後',groups:[[4,5]],guests:[]}
]}];
var gh=myGroupInfo();
ok('ホーム組(午前)を指すゲストはguestsから除外',gh&&gh.groupLetter==='A'&&gh.shiftLabel==='午前'&&gh.guests.length===0);
ok('scheduleは全曜日ホーム1件・カードに行き先行なし',gh.schedule.length===1&&gh.schedule[0].label==='月・火・木'&&!has(myGroupCardHtml(),'班未定')&&!has(myGroupCardHtml(),'月・火・木:'));
D.tgroup=[{id:21,ts:21,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[{pid:1,day:'mon',gi:0}]},
  {key:'pm',label:'午後',groups:[[4,5]],guests:[{pid:1,day:'thu',gi:0}]}
]}];
var gh2=myGroupInfo();
ok('異常データ＋正しいゲストの混在: 正しい方（木=午後A班）だけ残る',gh2&&gh2.guests.length===1&&gh2.guests[0].day==='thu'&&myGroupScheduleTxt(gh2)==='月・火: 午前 A班 ／ 木: 午後 A班');

D.tgroup=[{id:12,ts:12,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[1,2,3]]},{key:'pm',label:'午後',groups:[]}]}];
ok('ゲストが無ければ曜日別の行き先は出さない（旧記録=guests無しでも動く）',myGroupInfo().schedule.length===1&&myGroupInfo().guests.length===0&&!has(myGroupCardHtml(),'月・火・木:'));
D.tlog=[];

// ============ 6. T.training / T.home にグループ表示が出る ============
print('--- T.training / T.home: グループ表示 ---');
D.tgroup=[{id:6,ts:6,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2,3]]},{key:'pm',label:'午後',groups:[]}
]}];
subView=null;
T.training();
ok('T.trainingにMY GROUP・A班',has(__els['main'].innerHTML,'MY GROUP')&&has(__els['main'].innerHTML,'A班'));
subView=null;curTab='home';
T.home();
// P8b: ホームには出さない（2026-09-15 ユーザー判断で再確認）。自分の班はマイページで確認する
ok('T.homeにMY GROUPは出ない',!has(__els['main'].innerHTML,'MY GROUP'));
subView=null;curTab='mypage';T.mypage();
ok('T.mypageにコンパクトなMY GROUP（A班・メンバー・全班一覧へ）',has(__els['main'].innerHTML,'id="mp-mygroup"')&&has(__els['main'].innerHTML,'A班')&&has(__els['main'].innerHTML,'メンバー: 山田 太郎・佐藤 次郎')&&has(__els['main'].innerHTML,'onclick="showAllGroups()"')&&!has(__els['main'].innerHTML,'一緒に'));
ok('マイページではプロフィール設定の直後',__els['main'].innerHTML.indexOf('id="mp-mygroup"')>__els['main'].innerHTML.indexOf('プロフィール設定'));
curTab='home';
// tgroup未設定なら両画面ともグループカードなし（クラッシュしない）
D.tgroup=[];
subView=null;T.training();
ok('未設定時 T.trainingにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));
subView=null;curTab='home';T.home();
ok('未設定時 T.homeにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));
subView=null;curTab='mypage';T.mypage();
ok('未設定時 T.mypageにMY GROUPなし',!has(__els['main'].innerHTML,'MY GROUP'));
curTab='home';

print('--- myGroupMiniHtml（マイページ）: 今日の曜日の行き先 ---');
D.tgroup=[{id:16,ts:16,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2],[3]],guests:[]},
  {key:'pm',label:'午後',groups:[[10,11],[12,13]],guests:[{pid:1,day:'thu',gi:1}]}
]}];
D.p.push({id:12,name:'鈴木 十二',position:'SH',year:1},{id:13,name:'高橋 十三',position:'FB',year:1});
var MON=new Date(2026,8,14),TUE=new Date(2026,8,15),WED=new Date(2026,8,16),THU=new Date(2026,8,17),SUN=new Date(2026,8,20);
var hMon=myGroupMiniHtml(MON);
ok('月曜: 「今日（月）」午前 A班・メンバー 山田 太郎',has(hMon,'今日（月）')&&has(hMon,'午前 A班')&&has(hMon,'メンバー: 山田 太郎')&&!has(hMon,'鈴木'));
var hThu=myGroupMiniHtml(THU);
ok('木曜（ゲスト日）: 「今日（木）」午後 B班・メンバー その班の2人',has(hThu,'今日（木）')&&has(hThu,'午後 B班')&&has(hThu,'メンバー: 鈴木 十二・高橋 十三')&&!has(hThu,'山田'));
var hSun=myGroupMiniHtml(SUN);
ok('日曜（ウエイト曜日でない）: 「あなたの班」午前 A班＋曜日別の行き先',has(hSun,'あなたの班')&&has(hSun,'午前 A班')&&has(hSun,'月・火: 午前 A班 ／ 木: 午後 B班'));
ok('水曜も曜日の行き先ではなくふだんの班',has(myGroupMiniHtml(WED),'あなたの班'));
ok('火曜: 今日の行き先があれば曜日別の行き先の行は出さない',has(myGroupMiniHtml(TUE),'今日（火）')&&!has(myGroupMiniHtml(TUE),'／'));
D.tgroup=[{id:17,ts:17,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[]},
  {key:'pm',label:'午後',groups:[[10,11]],guests:[{pid:1,day:'tue',gi:null}]}
]}];
ok('班未定のゲスト日: 「今日（火）」午後（班未定）・メンバーは出ない',(function(){var x=myGroupMiniHtml(TUE);return has(x,'今日（火）')&&has(x,'午後 （班未定）')&&!has(x,'メンバー');})());
D.tgroup=[{id:18,ts:18,date:TODAY,by:'staff',mode:'single',excluded:[],shifts:[{key:'all',label:'',groups:[[3],[1,2]]}]}];
ok('分割なし(single): 曜日に関係なく「あなたの班」B班・組名なし',(function(){var x=myGroupMiniHtml(MON);return has(x,'あなたの班')&&has(x,'>B班<')&&!has(x,'今日（');})());
D.tgroup=[{id:19,ts:19,date:TODAY,by:'staff',mode:'ampm',excluded:[1],shifts:[{key:'am',label:'午前',groups:[[2,3]]}]}];
ok('班に入っていない → 空文字',myGroupMiniHtml(MON)==='');
ok('escape: 名前は escapeHtml 済み',(function(){D.tgroup=[{id:20,ts:20,date:TODAY,by:'staff',mode:'single',shifts:[{key:'all',label:'',groups:[[1,99]]}]}];D.p.push({id:99,name:'<b>x</b>',position:'PR',year:1});var x=myGroupMiniHtml(SUN);D.p.pop();return has(x,'&lt;b&gt;x&lt;/b&gt;')&&!has(x,'<b>x</b>');})());
D.p=D.p.filter(function(x){return x.id!==12&&x.id!==13;});
D.tgroup=[];

// ============ 7. 曜日別表示の共通ヘルパー（tgDayShifts / tgDefaultDay / tgIsDay / tgDayTabsHtml） ============
print('--- tgDayShifts: その曜日の実際の班構成 ---');
var SH=[{key:'am',label:'午前',groups:[[1,2,3]],guests:[]},{key:'pm',label:'午後',groups:[[4,5]],guests:[{pid:1,day:'thu',gi:0}]}];
var dvT=tgDayShifts(SH,'thu');
ok('shiftごとにsi/key/label',dvT.length===2&&dvT[0].si===0&&dvT[0].key==='am'&&dvT[0].label==='午前'&&dvT[1].si===1&&dvT[1].key==='pm');
ok('木: 午前A班のhere=2,3（元index保持・guest:false）',dvT[0].groups[0].here.length===2&&dvT[0].groups[0].here[0].pid===2&&dvT[0].groups[0].here[0].sli===1&&dvT[0].groups[0].here[0].guest===false&&dvT[0].groups[0].here[1].pid===3&&dvT[0].groups[0].here[1].sli===2);
ok('木: 午前A班のaway=1（行き先 si=1/gi=0・sli=0）',dvT[0].groups[0].away.length===1&&dvT[0].groups[0].away[0].pid===1&&dvT[0].groups[0].away[0].sli===0&&dvT[0].groups[0].away[0].si===1&&dvT[0].groups[0].away[0].gi===0);
ok('木: 午後A班のhere=4,5＋ゲスト1（xi=0・guest:true）',dvT[1].groups[0].here.length===3&&dvT[1].groups[0].here[2].pid===1&&dvT[1].groups[0].here[2].xi===0&&dvT[1].groups[0].here[2].guest===true&&dvT[1].groups[0].away.length===0);
ok('木: unplaced無し・pool=[]',dvT[1].unplaced.length===0&&Array.isArray(dvT[1].pool)&&dvT[1].pool.length===0);
var dvM=tgDayShifts(SH,'mon');
ok('月: ゲスト無しの曜日は全員ホーム',dvM[0].groups[0].here.length===3&&dvM[0].groups[0].away.length===0&&dvM[1].groups[0].here.length===2);
var dvN=tgDayShifts(SH,null);
ok('day=null: 全員here（ゲストは反映しない）',dvN[0].groups[0].here.length===3&&dvN[0].groups[0].away.length===0&&dvN[1].groups[0].here.length===2);
var SH2=[{key:'am',label:'午前',groups:[[1,2]],guests:[],pool:[9]},{key:'pm',label:'午後',groups:[[3]],guests:[{pid:1,day:'tue',gi:null}]}];
var dvU=tgDayShifts(SH2,'tue');
ok('未配置のゲスト: 元の班ではaway(gi:null)・行き先shiftのunplacedに出る',dvU[0].groups[0].away.length===1&&dvU[0].groups[0].away[0].gi===null&&dvU[0].groups[0].here.length===1&&dvU[1].unplaced.length===1&&dvU[1].unplaced[0].pid===1&&dvU[1].unplaced[0].xi===0);
ok('poolはコピーされる',dvU[0].pool.length===1&&dvU[0].pool[0]===9&&dvU[0].pool!==SH2[0].pool);
var SH3=[{key:'am',label:'午前',groups:[[1,2],[3]],guests:[{pid:1,day:'thu',gi:1},{pid:2,day:'thu',gi:null}]},{key:'pm',label:'午後',groups:[[4,5]],guests:[]}];
var dvH=tgDayShifts(SH3,'thu');
ok('ホーム組を指すゲスト（異常データ）: 元の班のhereのまま・awayにもゲスト先のhereにもunplacedにも出ない',dvH[0].groups[0].here.length===2&&dvH[0].groups[0].away.length===0&&dvH[0].groups[1].here.length===1&&dvH[0].groups[1].here[0].pid===3&&dvH[0].unplaced.length===0&&dvH[1].unplaced.length===0);
ok('guests無しの旧レコードでも動く',tgDayShifts([{key:'am',label:'午前',groups:[[1]]}],'mon')[0].groups[0].here.length===1);
ok('入力は変更しない',JSON.stringify(SH)===JSON.stringify([{key:'am',label:'午前',groups:[[1,2,3]],guests:[]},{key:'pm',label:'午後',groups:[[4,5]],guests:[{pid:1,day:'thu',gi:0}]}]));

print('--- tgDefaultDay / tgIsDay / tgDayTabsHtml ---');
// 2026-01-04(日)から7日: getDay 0..6 → 日=mon 月=mon 火=tue 水=thu 木=thu 金=mon 土=mon
var expDef=['mon','mon','tue','thu','thu','mon','mon'],defOk=true;
for(var di=0;di<7;di++){var dd=new Date(2026,0,4+di);if(dd.getDay()!==di||tgDefaultDay(dd)!==expDef[di])defOk=false;}
ok('tgDefaultDay: 月→mon 火→tue 水木→thu 金土日→mon',defOk);
ok('tgDefaultDay: 引数省略でもWG_DAYS内',tgIsDay(tgDefaultDay()));
ok('tgIsDay',tgIsDay('mon')&&tgIsDay('tue')&&tgIsDay('thu')&&!tgIsDay('wed')&&!tgIsDay('')&&!tgIsDay(undefined)&&!tgIsDay('x'));
var tabs=tgDayTabsHtml('tue','agSetDay');
ok('曜日タブ3つ（onclick=agSetDay(曜日)）',cnt(tabs,'onclick="agSetDay(')===3&&has(tabs,"agSetDay('mon')")&&has(tabs,"agSetDay('tue')")&&has(tabs,"agSetDay('thu')"));
ok('選択中だけaria-pressed=true',cnt(tabs,'aria-pressed="true"')===1&&has(tabs,'aria-pressed="true" onclick="agSetDay(\'tue\')"')&&cnt(tabs,'aria-pressed="false"')===2);
ok('ラベル 月/火/木',has(tabs,'>月</button>')&&has(tabs,'>火</button>')&&has(tabs,'>木</button>'));

// ============ 8. showAllGroups（全班一覧サブ画面・曜日タブ） ============
D.p.push({id:4,name:'鈴木 四郎',position:'SH',year:2},{id:5,name:'高橋 五郎',position:'FB',year:4});
// 午前組/午後組の見出しでHTMLを区切る（各シフトの区間を取り出す）
function secAm(h){var a=h.indexOf('午前組'),b=h.indexOf('午後組');return a<0?'':h.substring(a,b<0?h.length:b);}
function secPm(h){var b=h.indexOf('午後組');return b<0?'':h.substring(b);}

print('--- showAllGroups: 全班一覧（ゲスト無し） ---');
D.tgroup=[{id:7,ts:7,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1],[3]]},  // A班:田中(自分) / B班:佐藤
  {key:'pm',label:'午後',groups:[[2]]}         // A班:山田
]}];
window._agDay='mon';
subView=null;curTab='training';
showAllGroups();
var ag=__els['main'].innerHTML;
ok('見出し ウエイトグループ編成',has(ag,'ウエイトグループ編成'));
ok('午前シフト見出し（月曜）',has(ag,'午前組')&&has(secAm(ag),'（月曜）'));
ok('午後シフト見出し',has(ag,'午後組'));
ok('A班・B班表示',has(ag,'A班')&&has(ag,'B班'));
ok('自分の班にMYマーク（1つ）',cnt(ag,'>MY<')===1&&has(secAm(ag),'>MY<'));
ok('全員名表示',has(ag,'田中 蓮')&&has(ag,'山田 太郎')&&has(ag,'佐藤 次郎'));
ok('自分に（自分）注記',has(ag,'（自分）'));
ok('曜日タブ3つ・月が選択中',cnt(ag,'onclick="agSetDay(')===3&&cnt(ag,'aria-pressed="true"')===1&&has(ag,'aria-pressed="true" onclick="agSetDay(\'mon\')"'));
ok('曜日タブの説明',has(ag,'表示する曜日'));
ok('ゲスト無し→「のみ」印・行き先表示なし',!has(ag,'のみ')&&!has(ag,'曜は →')&&!has(ag,'opacity:.55'));
ok('ゲスト無し→あなたの行き先カード無し',!has(ag,'あなたの行き先'));
ok('subView=true',subView===true);

print('--- showAllGroups: 曜日で組が変わる選手（木だけ午後A班） ---');
D.tgroup=[{id:13,ts:13,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2,3]],guests:[]},
  {key:'pm',label:'午後',groups:[[4,5]],guests:[{pid:1,day:'thu',gi:0}]}
]}];
D.tlog=[{id:'w3',pid:3,menuId:9,date:TODAY,ts:'2026-09-01T10:00:00.000Z',results:[{exName:'スクワット(スピード)',sets:[{weight:130,reps:3}]}]}];
window._agDay='thu';
subView=null;curTab='training';
showAllGroups();
var agT=__els['main'].innerHTML,amT=secAm(agT),pmT=secPm(agT);
ok('木タブ選択中',has(agT,'aria-pressed="true" onclick="agSetDay(\'thu\')"')&&cnt(agT,'aria-pressed="true"')===1);
ok('見出しに（木曜）',has(amT,'（木曜）')&&has(pmT,'（木曜）'));
ok('午後A班: 自分が「木のみ」付きでメンバーとして出る',has(pmT,'田中 蓮（自分）')&&has(pmT,'木のみ</span>')&&has(pmT,'border:1px dashed'));
ok('午後A班: MYバッジ＋自分の班の枠',has(pmT,'>MY<')&&has(pmT,'border:1.5px solid var(--maroon-vivid)'));
ok('午後A班: 人数=3名（木のみ 1名）',has(pmT,'3名（木のみ 1名）'));
ok('午後A班: 鈴木・高橋も出る',has(pmT,'鈴木 四郎')&&has(pmT,'高橋 五郎'));
ok('午前A班: 自分は薄く「木曜は → 午後 A班」',has(amT,'opacity:.55')&&has(amT,'田中 蓮（自分）')&&has(amT,'木曜は → 午後 A班'));
ok('午前A班: MYバッジ無し',!has(amT,'>MY<')&&!has(amT,'border:1.5px solid var(--maroon-vivid)'));
ok('午前A班: 人数=2名（自分を除く）',has(amT,'>2名<')&&!has(amT,'のみ'));
ok('午前A班: 山田・佐藤は通常表示',has(amT,'山田 太郎')&&has(amT,'佐藤 次郎'));
ok('MYは画面全体で1つ',cnt(agT,'>MY<')===1);
ok('あなたの行き先（曜日別）カード（（ゲスト）は付かない）',has(agT,'あなたの行き先')&&has(agT,'月・火: 午前 A班 ／ 木: 午後 A班')&&!has(agT,'（ゲスト）'));
ok('メンバーの1セット重量',has(amT,'BP— SQ130 DL—'));
ok('旧表記（ゲスト（木）/MY（木・ゲスト））は使わない',!has(agT,'ゲスト（木）')&&!has(agT,'MY（'));

window._agDay='mon';
subView=null;curTab='training';
showAllGroups();
var agM=__els['main'].innerHTML,amM=secAm(agM),pmM=secPm(agM);
ok('月タブ: 午前A班にMY・自分は通常表示・3名',has(amM,'>MY<')&&has(amM,'田中 蓮（自分）')&&!has(amM,'opacity:.55')&&has(amM,'>3名<'));
ok('月タブ: 午後A班に自分は出ない・MY無し・2名',!has(pmM,'田中')&&!has(pmM,'>MY<')&&has(pmM,'>2名<')&&!has(pmM,'のみ'));
ok('月タブ: 行き先カードは曜日に関係なく出る',has(agM,'あなたの行き先')&&has(agM,'月・火: 午前 A班 ／ 木: 午後 A班')&&!has(agM,'（ゲスト）'));
ok('月タブ: 見出しに（月曜）',has(amM,'（月曜）'));

print('--- agSetDay: 曜日切替で再描画 ---');
var before=__els['main'].innerHTML;
agSetDay('thu');
ok('window._agDay=thu',window._agDay==='thu');
ok('再描画される（内容が変わる）',__els['main'].innerHTML!==before&&has(__els['main'].innerHTML,'木曜は → 午後 A班')&&has(__els['main'].innerHTML,'aria-pressed="true" onclick="agSetDay(\'thu\')"'));
ok('サブ画面のまま',subView===true);
var beforeX=__els['main'].innerHTML;
agSetDay('x');
ok('不正な曜日は無視（_agDay不変・再描画なし）',window._agDay==='thu'&&__els['main'].innerHTML===beforeX);
agSetDay('wed');
ok('水曜も無視',window._agDay==='thu');
agSetDay('tue');
ok('火に切替→火タブ選択・自分は午前A班にMY',window._agDay==='tue'&&has(__els['main'].innerHTML,'aria-pressed="true" onclick="agSetDay(\'tue\')"')&&has(secAm(__els['main'].innerHTML),'>MY<')&&!has(__els['main'].innerHTML,'曜は →'));

print('--- showAllGroups: _agDay未設定なら既定の曜日 ---');
window._agDay=undefined;
subView=null;curTab='training';
showAllGroups();
ok('既定の曜日(tgDefaultDay)が選ばれ_agDayに保存',tgIsDay(window._agDay)&&window._agDay===tgDefaultDay()&&has(__els['main'].innerHTML,'aria-pressed="true" onclick="agSetDay(\''+window._agDay+'\')"'));
window._agDay='zzz';
subView=null;showAllGroups();
ok('不正な_agDayは既定に戻す',window._agDay===tgDefaultDay());

print('--- showAllGroups: 未配置のゲスト ---');
D.tgroup=[{id:14,ts:14,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3]],guests:[{pid:1,day:'tue',gi:null}]}
]}];
window._agDay='tue';
subView=null;curTab='training';
showAllGroups();
var agU=__els['main'].innerHTML,amU=secAm(agU),pmU=secPm(agU);
ok('火: 元の班では薄く「火曜は → 午後（班未定）」',has(amU,'opacity:.55')&&has(amU,'田中 蓮（自分）')&&has(amU,'火曜は → 午後（班未定）'));
ok('選手画面に「未配置」の語は出ない',!has(agU,'未配置'));
ok('火: 午後の班には出ない・MY無し',!has(pmU,'田中')&&!has(agU,'>MY<'));
// 行き先カード（あなたの行き先）と曜日タブの答えが一致する: 火=午後・班未定（どちらも）
ok('行き先カードに班未定の曜日も出る（月・木: 午前 A班 ／ 火: 午後（班未定））',has(agU,'あなたの行き先')&&has(agU,'月・木: 午前 A班 ／ 火: 午後（班未定）'));
var infU=myGroupInfo(),schU=infU&&infU.schedule.filter(function(s){return s.days.indexOf('tue')>=0;})[0];
var awU=tgDayShifts(D.tgroup[0].shifts,'tue')[0].groups[0].away.filter(function(x){return idEq(x.pid,myPid);})[0];
ok('一致: 行き先(schedule)の火=午後・班未定 ＝ 曜日タブ(away)の火=午後(si=1)・gi=null',schU&&awU&&schU.shiftKey==='pm'&&schU.groupLetter===null&&D.tgroup[0].shifts[awU.si].key===schU.shiftKey&&awU.gi===null);
agSetDay('mon');
var agUm=__els['main'].innerHTML;
ok('月タブ: 行き先カードの「午前 A班」と一致（午前A班にMY・曜は→なし）',has(secAm(agUm),'>MY<')&&!has(agUm,'曜は →')&&has(agUm,'月・木: 午前 A班'));
D.tlog=[];

print('--- showAllGroups: 分割なし(single)は曜日タブ無し ---');
D.tgroup=[{id:15,ts:15,date:TODAY,by:'staff',mode:'single',excluded:[],shifts:[
  {key:'all',label:'',groups:[[1,2],[3]]}
]}];
window._agDay='thu';
subView=null;curTab='training';
showAllGroups();
var agS=__els['main'].innerHTML;
ok('曜日タブ無し',!has(agS,'agSetDay(')&&!has(agS,'表示する曜日')&&!has(agS,'aria-pressed'));
ok('シフト見出し・曜日注記無し',!has(agS,'午前組')&&!has(agS,'午後組')&&!has(agS,'曜）')&&!has(agS,'（午前／午後シフト）'));
ok('A班にMY・B班',has(agS,'A班')&&has(agS,'B班')&&cnt(agS,'>MY<')===1&&has(agS,'田中 蓮（自分）')&&has(agS,'佐藤 次郎'));

print('--- showAllGroups: 空編成 ---');
D.tgroup=[];
subView=null;curTab='home';
showAllGroups();
ok('空編成メッセージ',has(__els['main'].innerHTML,'まだ編成がありません'));
ok('空編成に曜日タブ無し',!has(__els['main'].innerHTML,'agSetDay('));

print('--- showAllGroups: 戻り先はcurTab ---');
D.tgroup=[{id:8,ts:8,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[1]]},{key:'pm',label:'午後',groups:[]}]}];
subView=null;curTab='training';
showAllGroups();
ok('training→トレーニングに戻る',has(__els['main'].innerHTML,'トレーニングに戻る'));
subView=null;curTab='home';
showAllGroups();
ok('home→ホームに戻る',has(__els['main'].innerHTML,'ホームに戻る'));

// ============ 9. 修正5: 3曜日とも別の班へ行く選手（ホーム班に1日も行かない） ============
D.tlog=[];
print('--- myGroupCardHtml: ホーム午前A班だが月火木とも午後A班 ---');
D.tgroup=[{id:30,ts:30,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3,4]],guests:[{pid:1,day:'mon',gi:0},{pid:1,day:'tue',gi:0},{pid:1,day:'thu',gi:0}]}
]}];
var i30=myGroupInfo();
ok('前提: ホーム=午前A班・guests3件・scheduleは1件（月・火・木 午後A班 guest）',i30&&i30.groupLetter==='A'&&i30.shiftKey==='am'&&i30.guests.length===3&&i30.schedule.length===1&&i30.schedule[0].label==='月・火・木'&&i30.schedule[0].guest===true&&i30.schedule[0].groupLetter==='A'&&i30.schedule[0].shiftKey==='pm');
var c30=myGroupCardHtml();
ok('主表示は行き先の「A班」（午後組チップ・午前組チップ無し）',has(c30,'>A班</div>')&&has(c30,'午後組')&&!has(c30,'午前組'));
ok('メンバーは午後A班の3と4（ホームの2は出ない・自分も行に出ない）',has(c30,'佐藤 次郎')&&has(c30,'鈴木 四郎')&&!has(c30,'山田 太郎')&&!has(c30,'(自分)'));
ok('班文字の下に「のみ」は出ない（3曜日そろう）',!has(c30,'のみ')&&!has(c30,'班未定'));
ok('行き先行「月・火・木: 午後 A班」',has(c30,'月・火・木: 午後 A班'));
['mon','tue','thu'].forEach(function(dk){
  var dl=tgDayLabel(dk);
  window._agDay=dk;subView=null;curTab='training';
  showAllGroups();
  var a30=__els['main'].innerHTML,am30=secAm(a30),pm30=secPm(a30);
  ok(dl+'タブ: 午後A班に自分が出る・MYバッジ・自分の班の枠',has(pm30,'田中 蓮（自分）')&&has(pm30,'>MY<')&&has(pm30,'border:1.5px solid var(--maroon-vivid)'));
  ok(dl+'タブ: 午後A班で自分に「'+dl+'のみ」印・破線枠が付かない',!has(pm30,'のみ')&&!has(pm30,'dashed'));
  ok(dl+'タブ: 午後A班ヘッダは「3名」（のみ件数なし）',has(pm30,'>3名<'));
  ok(dl+'タブ: 午前A班では薄く「'+dl+'曜は → 午後 A班」・MY無し・1名',has(am30,'opacity:.55')&&has(am30,dl+'曜は → 午後 A班')&&!has(am30,'>MY<')&&has(am30,'>1名<'));
  ok(dl+'タブ: MYは画面全体で1つ・行き先カード',cnt(a30,'>MY<')===1&&has(a30,'あなたの行き先')&&has(a30,'月・火・木: 午後 A班'));
});

print('--- myGroupCardHtml: 月火だけ午後A班・木はホーム午前A班 ---');
D.tgroup=[{id:31,ts:31,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3,4]],guests:[{pid:1,day:'mon',gi:0},{pid:1,day:'tue',gi:0}]}
]}];
var c31=myGroupCardHtml();
ok('主表示はホーム（午前組・A班・メンバー1と2）',has(c31,'午前組')&&!has(c31,'午後組')&&has(c31,'>A班</div>')&&has(c31,'田中 蓮(自分)')&&has(c31,'山田 太郎')&&!has(c31,'佐藤 次郎')&&!has(c31,'鈴木 四郎'));
ok('班文字の下に「のみ」は出ない',!has(c31,'のみ</div>'));
ok('行き先行「月・火: 午後 A班 ／ 木: 午前 A班」',has(c31,'月・火: 午後 A班 ／ 木: 午前 A班'));
window._agDay='mon';subView=null;curTab='training';showAllGroups();
var a31=__els['main'].innerHTML;
ok('月タブ: 午後A班では2曜日だけなので「月のみ」印・破線枠・（月のみ 1名）',has(secPm(a31),'月のみ</span>')&&has(secPm(a31),'dashed')&&has(secPm(a31),'3名（月のみ 1名）'));
agSetDay('thu');
ok('木タブ: 午前A班にMY・曜は→なし',has(secAm(__els['main'].innerHTML),'>MY<')&&!has(__els['main'].innerHTML,'曜は →'));

print('--- myGroupCardHtml: ホーム班に1日も行かず全曜日が班未定 ---');
D.tgroup=[{id:32,ts:32,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[1,2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3,4]],guests:[{pid:1,day:'mon',gi:null},{pid:1,day:'tue',gi:null},{pid:1,day:'thu',gi:null}]}
]}];
var c32='',e32=null;
try{c32=myGroupCardHtml();}catch(e){e32=e;}
ok('落ちない・カードは出る',e32===null&&has(c32,'MY GROUP'));
ok('主表示は「—」＋下に「班未定」（班の文字は出ない）',has(c32,'>—<div')&&has(c32,'>班未定</div>')&&!has(c32,'A班')&&!has(c32,'B班'));
ok('組チップは行き先の午後組',has(c32,'午後組')&&!has(c32,'午前組'));
ok('メンバー行・アバター・重量は出ない',!has(c32,'田中 蓮')&&!has(c32,'山田 太郎')&&!has(c32,'佐藤 次郎')&&!has(c32,'BP')&&!has(c32,'box-shadow:0 0 0 2px'));
ok('行き先行「月・火・木: 午後（班未定）」',has(c32,'月・火・木: 午後（班未定）')&&!has(c32,'未配置'));
var e32b=null;window._agDay='tue';subView=null;curTab='training';
try{showAllGroups();}catch(e){e32b=e;}
ok('全班一覧も落ちない・午前A班に「火曜は → 午後（班未定）」・MY無し',e32b===null&&has(secAm(__els['main'].innerHTML),'火曜は → 午後（班未定）')&&!has(__els['main'].innerHTML,'>MY<')&&!has(secPm(__els['main'].innerHTML),'田中'));

print('--- myGroupCardHtml: ホーム班なし＋火・木だけ午後A班 ---');
D.tgroup=[{id:33,ts:33,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3,4]],guests:[{pid:1,day:'tue',gi:0},{pid:1,day:'thu',gi:0}]}
]}];
var c33=myGroupCardHtml();
ok('主表示 A班＋「火・木のみ」・午後組・メンバー3と4',has(c33,'A班<div')&&has(c33,'>火・木のみ</div>')&&has(c33,'午後組')&&!has(c33,'午前組')&&has(c33,'佐藤 次郎')&&has(c33,'鈴木 四郎')&&!has(c33,'山田 太郎'));
ok('行き先行「火・木: 午後 A班」',has(c33,'火・木: 午後 A班'));
D.tgroup=[{id:34,ts:34,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[2]],guests:[]},
  {key:'pm',label:'午後',groups:[[3,4]],guests:[{pid:1,day:'mon',gi:0},{pid:1,day:'tue',gi:0},{pid:1,day:'thu',gi:0}]}
]}];
var c34=myGroupCardHtml();
ok('ホーム班なし＋3曜日とも午後A班: 「のみ」は出ない・A班',has(c34,'>A班</div>')&&!has(c34,'のみ')&&has(c34,'午後組'));

// ============ 10. 修正2: 空の班を指すゲストは班未定扱い ============
print('--- tgDayShifts/showAllGroups: 空の班(groups[gi]=[])を指すゲスト ---');
var SHE=[{key:'am',label:'午前',groups:[[1,2]],guests:[]},{key:'pm',label:'午後',groups:[[3],[]],guests:[{pid:1,day:'thu',gi:1}]}];
var dvE=tgDayShifts(SHE,'thu');
ok('tgDayShifts: 元の班のaway gi=null・空の班のhereに出ない・unplacedに出る',dvE[0].groups[0].away.length===1&&dvE[0].groups[0].away[0].gi===null&&dvE[0].groups[0].away[0].si===1&&dvE[1].groups[1].here.length===0&&dvE[1].groups[0].here.length===1&&dvE[1].unplaced.length===1&&idEq(dvE[1].unplaced[0].pid,1));
D.tgroup=[{id:35,ts:35,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:JSON.parse(JSON.stringify(SHE))}];
window._agDay='thu';subView=null;curTab='training';
showAllGroups();
var aE=__els['main'].innerHTML,amE=secAm(aE),pmE=secPm(aE);
ok('全班一覧: 午前A班で「木曜は → 午後（班未定）」',has(amE,'opacity:.55')&&has(amE,'木曜は → 午後（班未定）')&&!has(amE,'午後 B班'));
ok('全班一覧: 午後に自分は出ない・B班（空）も出ない・MY無し',!has(pmE,'田中')&&!has(pmE,'B班')&&!has(aE,'>MY<'));
// myGroupInfo も同じ答え（空の班・存在しない班を指す行は班未定）＝行き先カードと曜日タブが食い違わない
var giE=myGroupInfo();
ok('myGroupInfo: 空の班を指す木のゲスト→gi/groupLetter=null・members=[]',giE&&giE.guests.length===1&&giE.guests[0].day==='thu'&&giE.guests[0].gi===null&&giE.guests[0].groupLetter===null&&giE.guests[0].members.length===0);
ok('行き先: 「月・火: 午前 A班 ／ 木: 午後（班未定）」・カードにも同じ・「B班」は出ない',myGroupScheduleTxt(giE)==='月・火: 午前 A班 ／ 木: 午後（班未定）'&&has(aE,'木: 午後（班未定）')&&!has(myGroupCardHtml(),'B班')&&has(myGroupCardHtml(),'木: 午後（班未定）'));
D.tgroup=[{id:36,ts:36,date:TODAY,by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[1,2]],guests:[]},{key:'pm',label:'午後',groups:[[3]],guests:[{pid:1,day:'tue',gi:5}]}]}];
var giR=myGroupInfo();
ok('myGroupInfo: 存在しない班(gi:5)を指す行も班未定・行き先「月・木: 午前 A班 ／ 火: 午後（班未定）」',giR&&giR.guests.length===1&&giR.guests[0].gi===null&&myGroupScheduleTxt(giR)==='月・木: 午前 A班 ／ 火: 午後（班未定）');

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_player tests failed');}
print('\nALL TGROUP-PLAYER TESTS PASSED');
