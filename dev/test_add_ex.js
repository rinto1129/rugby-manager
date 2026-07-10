// Phase 4: 種目追加ゲート緩和 + ホーム整理 + 身長自己編集 のテスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_add_ex.js
// 仕様（プランPhase 4節）:
//  - 種目追加: renderTrainingExecの種目追加UIを自主だけでなくチームメニュー実施中も表示（gate緩和）。addedByPlayer:true・estBase自動判定・texlistマージは既存共通実装
//  - ホーム: 今週=今日+次の予定+折りたたみ / 体組成チームリスト撤去 / ランキングTOP3→リンク行 / お知らせ2件+折りたたみ
//  - 身長: T.mypageプロフィールカード+saveMyHeight（100〜230検証→svSafeUpdate('p')でheight更新・他フィールド不変）
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

// ---- 共通データ ----
myPid=1;
D.p=[{id:1,name:'テスト選手',position:'PR',year:2,height:'180',weight:'100'},{id:2,name:'選手2',position:'WTB',year:3,height:'175',weight:'85'}];
D.std=[];D.offday=[];D.ann=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];D.ph=[];D.bc=[];D.f=[];D.tlog=[];D.chart=[];D.pp=[];D.texlist=['スクワット'];
_tlogArchLoaded=true; // アーカイブ取得スキップ
D.tmenu=[{id:200,name:'胸の日',scope:'all',ptype:'push',exercises:[{name:'ベンチプレス',estBase:'bench',sets:3,reps:5,rir:2}]}];
D.cal=[{id:1,date:TODAY,type:'weight'}];
__store['tlog']=JSON.stringify([]);
__store['e1rm']=JSON.stringify([]);
__store['texlist']=JSON.stringify(['スクワット']);
__store['p']=JSON.stringify(D.p);

// ============ 1. 種目追加ゲート緩和（チームメニュー実施中もUIが出る） ============
print('--- 種目追加: チームメニュー実施中も種目追加UIが出る ---');
startTrainingFresh(200);drain();
ok('チーム_curTLog生成（kind未定義=team）',_curTLog&&_curTLog.menuId===200&&_curTLog.kind===undefined);
var exHtml=__els['main'].innerHTML;
ok('種目追加UIが表示される(tr-add-ex/addTrainingEx)',has(exHtml,'tr-add-ex')&&has(exHtml,'addTrainingEx()'));
ok('チーム向けヒント文が出る',has(exHtml,'メニューにない種目'));
ok('自主向けヒント文（BIG3…）は出ない',!has(exHtml,'BIG3系は推定1RMにも反映'));
ok('texlist候補（スクワット）がdatalistに出る',has(exHtml,'<option value="スクワット">'));

print('--- 種目追加: addTrainingEx（addedByPlayer/estBase自動判定） ---');
// メニュー既存の「ベンチプレス」ではなく未収録の「デッドリフト」を追加（重複拒否を避ける）
var beforeLen=_curTLog.results.length;
document.getElementById('tr-add-ex').value='デッドリフト';
addTrainingEx();
ok('results +1',_curTLog.results.length===beforeLen+1);
var added=_curTLog.results[_curTLog.results.length-1];
ok('exName=デッドリフト',added.exName==='デッドリフト');
ok('addedByPlayer:true',added.addedByPlayer===true);
ok('estBase自動判定（EST_BASESラベル一致=deadlift）',added.estBase==='deadlift');
ok('sets初期3本',Array.isArray(added.sets)&&added.sets.length===3);
// 同名の重複追加は拒否（alert）
__alerts.length=0;
document.getElementById('tr-add-ex').value='デッドリフト';
addTrainingEx();
ok('同名種目の重複追加はalert・増えない',__alerts.length===1&&_curTLog.results.length===beforeLen+1);
// メニュー既存の種目名（ベンチプレス）も重複扱いで拒否
__alerts.length=0;
document.getElementById('tr-add-ex').value='ベンチプレス';
addTrainingEx();
ok('メニュー既存種目の追加も重複拒否',__alerts.length===1&&_curTLog.results.length===beforeLen+1);

print('--- 種目追加: タイム種目(ブロンコ/1K)はウエイトに追加させない（ガード） ---');
var beforeGuard=_curTLog.results.length;
__alerts.length=0;
document.getElementById('tr-add-ex').value='ブロンコ';
addTrainingEx();
ok('ブロンコ追加はガードでalert・増えない',__alerts.length===1&&_curTLog.results.length===beforeGuard);
ok('ガード文言=タイム種目/フィットネス',__alerts.some(function(a){return a.indexOf('タイム種目')>=0&&a.indexOf('フィットネス')>=0;}));
__alerts.length=0;
document.getElementById('tr-add-ex').value='1km';
addTrainingEx();
ok('1kmもガード',__alerts.length===1&&_curTLog.results.length===beforeGuard);
__alerts.length=0;
document.getElementById('tr-add-ex').value='ブロンコテスト';
addTrainingEx();
ok('ブロンコ含む名もガード',__alerts.length===1&&_curTLog.results.length===beforeGuard);
__alerts.length=0;

print('--- 種目追加: mergeTexlistFromLog（addedByPlayerのみ・重複排除） ---');
__store['texlist']=JSON.stringify(['スクワット']);
mergeTexlistFromLog({results:[{exName:'ベンチプレス',addedByPlayer:true},{exName:'スクワット',addedByPlayer:false},{exName:'  懸垂  ',addedByPlayer:true}]});
drain();
var tex=JSON.parse(__store['texlist']);
ok('addedByPlayer種目（ベンチプレス）をtexlistへマージ',tex.indexOf('ベンチプレス')>=0);
ok('種目名はtrimされる（懸垂）',tex.indexOf('懸垂')>=0);
ok('addedByPlayer:false種目はマージしない・既存重複なし',tex.filter(function(n){return n==='スクワット';}).length===1);

// 自主トレ空実施では自主向けヒントが出る（gate分岐の回帰）
print('--- gate分岐: 自主トレ（空）は自主向けヒント ---');
localStorage.removeItem('rm_tdraft_1');localStorage.removeItem('rm_tdraft_1_t');
startSelfWeight();drain();
var selfHtml=__els['main'].innerHTML;
ok('自主トレは自主向けヒント',has(selfHtml,'BIG3系は推定1RMにも反映'));
ok('自主トレでも種目追加UIは出る',has(selfHtml,'tr-add-ex'));

// ============ 2. ホーム整理 ============
print('--- ホーム: 体組成撤去 / ランキングリンク化 / 今週圧縮+展開 / お知らせ2件+展開 ---');
subView=null;curTab='home';_curTLog=null;
window._homeWeekOpen=false;window._homeAnnOpen=false;
// 今週の各曜日に予定（T.homeと同じ週窓の計算で7日分＝rest>0を保証）
var now=new Date();var monDt=new Date(now);monDt.setDate(now.getDate()-now.getDay()+1);
var wcal=[];
for(var wi=0;wi<7;wi++){var d=new Date(monDt);d.setDate(monDt.getDate()+wi);wcal.push({id:300+wi,date:toDateStr(d),type:wi===2?'match':'weight',title:'予定'+wi});}
D.cal=wcal;
// お知らせ5件（チーム宛=targetPidなし）
D.ann=[];
for(var ai=0;ai<5;ai++){D.ann.push({id:400+ai,text:'お知らせ本文'+ai,date:'2026-07-0'+(ai+1)});}
D.bc=[];
T.home();
var home=__els['main'].innerHTML;
ok('体組成チームリスト撤去',!has(home,'本日の体組成測定者'));
ok('体組成オフ文言も撤去',!has(home,'体組成測定オフ'));
ok('ランキングTOP3カード撤去',!has(home,'ランキング TOP3'));
ok('ランキングはリンク行（go(ranking)）',has(home,'ランキング')&&has(home,"go('ranking')"));
ok('今週セクション見出し',has(home,'今週のスケジュール'));
ok('今週の折りたたみ（rest>0でclp生成）',has(home,'home-week-clp')&&has(home,'homeWeekToggle()'));
ok('今週のラベル切替スパン（すべて見る/閉じる）',has(home,'clp-lbl-c')&&has(home,'clp-lbl-o'));
ok('お知らせ見出し',has(home,'NOTICE BOARD'));
ok('お知らせ折りたたみ（5件>2でclp生成）',has(home,'home-ann-clp')&&has(home,'homeAnnToggle()'));
ok('お知らせ全5件がDOMに存在（2表示+3折りたたみ）',has(home,'お知らせ本文0')&&has(home,'お知らせ本文4'));

// トグル関数がクラスをその場で切替（再描画しない）
print('--- ホーム: 折りたたみトグル ---');
window._homeWeekOpen=false;
homeWeekToggle();
ok('homeWeekToggleでフラグON',window._homeWeekOpen===true);
homeWeekToggle();
ok('再度でフラグOFF',window._homeWeekOpen===false);
homeAnnToggle();
ok('homeAnnToggleでフラグON',window._homeAnnOpen===true);

// お知らせが2件以下なら折りたたみUIは出ない
print('--- ホーム: お知らせ1件は折りたたみUIなし ---');
D.ann=[{id:500,text:'単発のお知らせ',date:'2026-07-05'}];
T.home();
var home2=__els['main'].innerHTML;
ok('お知らせ1件はclpなし',!has(home2,'home-ann-clp'));
ok('お知らせ1件でも本文は出る',has(home2,'単発のお知らせ'));

// ============ 3. 身長自己編集（設定サブ画面へ移設） ============
print('--- マイページ: プロフィール導線→設定サブ画面 ---');
myPid=1;subView=null;
T.mypage();
var mp=__els['main'].innerHTML;
ok('導線カード（PROFILE/プロフィール設定/showProfileSettings）',has(mp,'PROFILE')&&has(mp,'プロフィール設定')&&has(mp,'showProfileSettings()'));
ok('身長サマリー(180cm)',has(mp,'180cm'));
subView=null;
showProfileSettings();
var mp=__els['main'].innerHTML;
ok('設定サブ画面（mh-input/saveMyHeight）',has(mp,'mh-input')&&has(mp,'saveMyHeight()'));
ok('現在の身長がプリフィル(value=180)',has(mp,'value="180"'));

print('--- saveMyHeight: バリデーション ---');
__alerts.length=0;
document.getElementById('mh-input').value='';
saveMyHeight();
ok('空入力→alert・保存しない',__alerts.length===1);
__alerts.length=0;
document.getElementById('mh-input').value='250';
saveMyHeight();
ok('230超→alert',__alerts.length===1);
__alerts.length=0;
document.getElementById('mh-input').value='90';
saveMyHeight();
ok('100未満→alert',__alerts.length===1);
__alerts.length=0;
document.getElementById('mh-input').value='abc';
saveMyHeight();
ok('数値でない→alert',__alerts.length===1);

print('--- saveMyHeight: 正常保存（他フィールド不変） ---');
__store['p']=JSON.stringify(D.p);
__alerts.length=0;
document.getElementById('mh-input').value='183.5';
saveMyHeight();drain();
var pStore=JSON.parse(__store['p']);
var meRec=pStore.find(function(x){return x.id===1;});
ok('身長が保存される(183.5)',meRec&&meRec.height==='183.5');
ok('他フィールド不変（position/weight/name）',meRec.position==='PR'&&meRec.weight==='100'&&meRec.name==='テスト選手');
ok('別選手のレコードは不変',pStore.find(function(x){return x.id===2;}).height==='175');
ok('D.pもメモリ更新（再描画に反映）',D.p.find(function(x){return x.id===1;}).height==='183.5');
ok('保存後の失敗alertなし',__alerts.length===0);

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('add_ex tests failed');}
print('\nALL ADD-EX TESTS PASSED');
