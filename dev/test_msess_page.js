// 測定会の特設ページ フェーズ3（staff）: V.mp（表・列モード・セル即保存・上書きUndo・免除・提出/取消・進捗・未提出一覧・未統合）と
// 導線（V.msess/goMSessDetail/goAddPhysForSess）・書き込みゲート（doAddPhys/doBulkPhys は会の記録に追記、goEditPhys/doDelPhys は特設ページへ）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_msess_page.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function J(x){return JSON.stringify(x);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function cnt(h,sub){return String(h).split(sub).length-1;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
var __els={};document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
var __toasts=[];toast=function(m,l,f){__toasts.push({m:String(m),l:l,f:f});};
var __alerts=[];alert=function(m){__alerts.push(String(m));};
var __pv=[];var __pvOrig=pushView;pushView=function(t,h,fn){__pv.push({t:t,h:h});if(fn)fn();};
var __pop=0;popView=function(){__pop++;};
var __confirm=true;confirm=function(){return __confirm;};
function main(){return __els['main-ct'].innerHTML;}
function txt(h){return String(h).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');}
drain(); // 起動時の ld().then(nav('dash')) を先に流す（後の drain で画面が dash に切り替わらないように）

var S0=daysAgo(6),S1=daysAgo(-1),TODAY=daysAgo(0);
D.p=[{id:1,name:'田中 一',position:'PR'},{id:2,name:'鈴木 二',position:'HO'},{id:3,name:'佐藤 三',position:'SH'},{id:4,name:'高橋 四',position:'FB'},{id:5,name:'伊藤 五',position:'LO'}];
D.std=[];D.f=[];D.bc=[];D.i=[];D.cal=[];D.rtest=[];D.tape=[];D.tapeslot=[];D.ann=[];D.offday=[];
var SESS={id:'m2',name:'第2回MAX測定',startDate:S0,endDate:S1,mtype:'phys',items:['squat','bench','bronco']};
var OLD={id:'m1',name:'旧ブロンコ',startDate:daysAgo(40),endDate:daysAgo(39),mtype:'bronco',closed:true};
D.msess=[OLD,SESS];
D.phskip=[{id:9,pid:5,date:S0,msessId:'m2',reason:'欠席',by:'staff'}];
function base(){return [
  {id:101,pid:1,date:S0,msessId:'m2',squat:150,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{squat:S0},by:{squat:'player'},inputAt:'2026-09-08T10:00:00.000Z'},
  {id:102,pid:2,date:S0,msessId:'m2',squat:120,bench:90,deadlift:null,chinning:null,clean:null,bronco:305,downbronco:null,at:{squat:S0,bench:daysAgo(3),bronco:daysAgo(2)},by:{squat:'player',bench:'staff',bronco:'staff'},submitted:true,submittedAt:'2026-09-12T00:00:00.000Z',submittedBy:'staff',inputAt:'2026-09-12T10:00:00.000Z'},
  {id:103,pid:3,date:S0,msessId:'m2',squat:100,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{squat:S0},by:{squat:'staff'},ex:{bench:'肩の怪我'},inputAt:'2026-09-09T10:00:00.000Z'},
  {id:104,pid:4,date:S0,msessId:'m2',squat:110,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-09T11:00:00.000Z'},
  {id:105,pid:4,date:daysAgo(2),msessId:'m2',squat:null,bench:80,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-11T11:00:00.000Z'}, // p4 未統合
  {id:106,pid:1,date:daysAgo(40),msessId:'m1',squat:null,bench:null,deadlift:null,chinning:null,clean:null,bronco:300,downbronco:null,inputAt:'2026-08-05T10:00:00.000Z'}
];}
function reset(){D.ph=base();__store['ph']=J(D.ph);__store['msess']=J(D.msess);__toasts.length=0;__alerts.length=0;__pv.length=0;window._mp=null;window._mpPendingOpen=false;}
reset();

print('--- goMSessPage → nav(\'mp\') → V.mp（表モード）---');
goMSessPage('m2');
ok('curPage=mp・タイトル',curPage==='mp'&&__els['pg-title'].textContent==='測定会 特設ページ');
var h=main();
ok('ヘッダ: 会名・特設ページ・項目・測定日・検索・未提出の一覧（3）',has(h,'第2回MAX測定')&&has(h,'項目: スクワット・ベンチプレス・ブロンコ')&&has(h,'id="mp-date"')&&has(h,'id="mp-q"')&&has(h,'未提出の一覧（3）'));
ok('進捗: SQ 3/5（p4 は未統合＝最新の記録にSQ無し）・BP 3/5（90＋免除＋未統合の80）・BR 1/5',/SQ<\/span><span[^>]*>3<span[^>]*>\/5/.test(h)&&/BP<\/span><span[^>]*>3<span[^>]*>\/5/.test(h)&&/BR<\/span><span[^>]*>1<span[^>]*>\/5/.test(h));
ok('人数: 提出済1・進行中3（p1,p3,p4）・未着手0・測定なし1',has(h,'提出済 1')&&has(h,'進行中 3')&&has(h,'未着手 0')&&has(h,'測定なし 1'));
ok('未統合バナー（高橋 四）・統合ボタン',has(h,'未統合 1名')&&has(h,'高橋 四')&&has(h,"goMSessConvert('m2')"));
ok('セル: p1 SQ に 150・onchange=mpCell・BP は空欄・免除ボタン「…」',has(h,'id="mpc-1-squat" value="150"')&&has(h,"onchange=\"mpCell(1,'squat',this)\"")&&has(h,'id="mpc-1-bench" value=""')&&has(h,"mpExOpen(1,'bench')"));
ok('セル補足: p1 SQ に日付と入力者（選手）・BP は未入力',has(h,'id="mpm-1-squat"')&&has(h,'選手')&&has(h,'未入力'));
ok('time セル: p2 BR に 5分05秒（分=5・秒=5）・oninput=dirty・focusout で保存（onchange 無し）',has(h,'id="mpc-2-bronco-m" value="5"')&&has(h,'id="mpc-2-bronco-s" value="5"')&&has(h,"mpCellTDirty(2,'bronco')")&&has(h,"mpCellTOut(2,'bronco')")&&!has(h,"onchange=\"mpCellT("));
ok('免除セル: p3 BP に「免除 肩の怪我」＋解除ボタン・入力欄は出ない',has(h,'肩の怪我')&&has(h,"mpExempt(3,'bench',null)")&&!has(h,'id="mpc-3-bench"'));
ok('提出列: p2=提出済＋取消・p1=提出ボタン disabled（BP/BR 未）・p4=未統合',has(h,'mpSubmit(2,false)')&&/onclick="mpSubmit\(1,true\)" disabled/.test(h)&&has(h,'未統合'));
ok('p3 は SQ 値＋BP 免除だが BR 未 → 提出 disabled',/onclick="mpSubmit\(3,true\)" disabled/.test(h));
ok('未統合の p4 のセルは disabled',/id="mpc-4-squat"[^>]*disabled/.test(h)&&/id="mpc-4-bench"[^>]*disabled/.test(h));
ok('測定なし(p5): 進捗列に「測定なし」バッジ',has(h,'id="mpr-5"')&&has(h,'>測定なし<'));
ok('生hex/rgba なし',!/#[0-9a-fA-F]{6}\b/.test(h)&&!/rgba?\(\s*\d/.test(h));

print('--- セル保存（mpCell）: 追記・補足の局所更新・進捗更新 ---');
window._mp.date=TODAY;
var e=document.getElementById('mpc-1-bench');e.value='100';
__toasts.length=0;
mpCell(1,'bench',e);drain();
var r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('p1 BP=100・at=測定日(今日)・by=staff・SQ は不変・新規記録は作らない',r1.bench===100&&r1.at.bench===TODAY&&r1.by.bench==='staff'&&r1.squat===150&&r1.at.squat===S0&&JSON.parse(__store['ph']).length===6);
ok('トースト「田中 一 BP 100 を保存しました」',__toasts.length===1&&has(__toasts[0].m,'田中 一 BP 100 を保存しました')&&!__toasts[0].f);
ok('セル補足が更新（日付＋スタッフ）',has(__els['mpm-1-bench'].innerHTML,'スタッフ'));
ok('進捗ヘッダが更新: BP 4/5',/BP<\/span><span[^>]*>4<span[^>]*>\/5/.test(document.getElementById('mp-stats').innerHTML));
ok('全体再描画後: p1 の提出はまだ disabled（BR 未）',/onclick="mpSubmit\(1,true\)" disabled/.test(main()));

print('--- 上書き: トーストで元に戻す ---');
__toasts.length=0;
var e2=document.getElementById('mpc-1-squat');e2.value='140';
mpCell(1,'squat',e2);drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('SQ 150→140・at=今日・by=staff',r1.squat===140&&r1.at.squat===TODAY&&r1.by.squat==='staff');
ok('トースト「田中 一 SQ 150 → 140 に置き換えました」＋元に戻す',__toasts.length===1&&has(__toasts[0].m,'SQ 150 → 140')&&typeof __toasts[0].f==='function');
__toasts[0].f();drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('元に戻す: 値150・測定日S0・入力者=選手に復元',r1.squat===150&&r1.at.squat===S0&&r1.by.squat==='player');
ok('値の削除もトーストで戻せる',(function(){var e3=document.getElementById('mpc-1-squat');e3.value='';__toasts.length=0;mpCell(1,'squat',e3);drain();var a=JSON.parse(__store['ph']).find(function(r){return r.id===101;});var ok1=a.squat===null&&!('squat' in a.at)&&has(__toasts[0].m,'値を消しました');__toasts[0].f();drain();var b=JSON.parse(__store['ph']).find(function(r){return r.id===101;});return ok1&&b.squat===150&&b.at.squat===S0&&b.by.squat==='player';})());

print('--- time セル（mpCellT）と bronco 上書き ---');
document.getElementById('mpc-1-bronco-m').value='5';document.getElementById('mpc-1-bronco-s').value='30';
__toasts.length=0;mpCellT(1,'bronco');drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('BR=330秒・at=今日',r1.bronco===330&&r1.at.bronco===TODAY&&has(__toasts[0].m,'BR 5分30秒'));
ok('p1 は SQ/BP/BR 揃った → 提出ボタンが有効（btn-p・disabled なし）',/class="btn btn-sm btn-p"[^>]*onclick="mpSubmit\(1,true\)"(?! disabled)/.test(main()));
ok('分・秒とも空で保存 → 値の削除',(function(){document.getElementById('mpc-1-bronco-m').value='';document.getElementById('mpc-1-bronco-s').value='';__toasts.length=0;mpCellT(1,'bronco');drain();var a=JSON.parse(__store['ph']).find(function(r){return r.id===101;});var okA=a.bronco===null;__toasts[0].f();drain();return okA&&JSON.parse(__store['ph']).find(function(r){return r.id===101;}).bronco===330;})());

print('--- 免除（mpExOpen/mpExempt）---');
mpExOpen(3,'bronco');
h=main();
ok('免除フォーム: 理由の候補ボタン・入力欄・免除にする',has(h,"mpExReason('怪我')")&&has(h,'id="mp-ex-reason"')&&has(h,"mpExempt(3,'bronco',document.getElementById('mp-ex-reason').value)"));
ok('理由なしで免除 → alert',(function(){__alerts.length=0;mpExempt(3,'bronco','  ');return __alerts.length===1;})());
__toasts.length=0;mpExempt(3,'bronco','欠席');drain();
var r3=JSON.parse(__store['ph']).find(function(r){return r.id===103;});
ok('p3 BR 免除（値 null・ex.bronco=欠席）・トースト・フォームが閉じる',r3.ex.bronco==='欠席'&&r3.bronco===null&&has(__toasts[0].m,'免除にしました')&&!has(main(),'id="mp-ex-reason"'));
ok('p3 は SQ 値＋BP/BR 免除 → complete → 提出ボタン有効',/class="btn btn-sm btn-p"[^>]*onclick="mpSubmit\(3,true\)"(?! disabled)/.test(main()));
__toasts.length=0;mpExempt(3,'bench',null);drain();
r3=JSON.parse(__store['ph']).find(function(r){return r.id===103;});
ok('免除の解除: ex.bench が消える・トースト',!('bench' in r3.ex)&&has(__toasts[0].m,'免除を解除'));
mpExempt(3,'bench','肩の怪我');drain();

print('--- 提出/取消（mpSubmit）---');
__toasts.length=0;mpSubmit(1,true);drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('p1 提出: submitted/submittedAt/submittedBy=staff・トースト「提出しました」＋取り消す',r1.submitted===true&&r1.submittedBy==='staff'&&has(__toasts[0].m,'田中 一 を提出しました')&&__toasts[0].l==='取り消す');
ok('表: p1 の行が提出済（取消ボタン）・人数 提出済2',has(main(),'mpSubmit(1,false)')&&has(main(),'提出済 2'));
__toasts[0].f();drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('取り消す: submitted が消える・トースト',!('submitted' in r1)&&has(__toasts[__toasts.length-1].m,'提出を取り消しました'));
ok('不足があるのに提出（サーバー最新で再判定）→ 提出されずトーストに不足項目',(function(){var keep=JSON.parse(__store['ph']);var arr=JSON.parse(__store['ph']);arr.find(function(r){return r.id===101;}).bronco=null;__store['ph']=J(arr);__toasts.length=0;mpSubmit(1,true);drain();var r=JSON.parse(__store['ph']).find(function(x){return x.id===101;});var okA=!r.submitted&&has(__toasts[0].m,'まだ入力されていない項目')&&has(__toasts[0].m,'BR');__store['ph']=J(keep);D.ph=keep;return okA;})());

print('--- 未提出の一覧・検索・列モード ---');
mpTogglePending();
h=main();
ok('未提出の一覧: 田中（全項目あり＝残り —）・佐藤（残り —）・高橋（未統合・残り SQ・BR）',has(h,'田中 一<span')&&has(h,'佐藤 三')&&has(h,'高橋 四<span style="color:var(--text-secondary)">（残り SQ・BR）'));
mpTogglePending();
mpSetQ('SH');
h=main();
ok('検索 SH: 佐藤 三の行だけ',has(h,'id="mpr-3"')&&!has(h,'id="mpr-1"')&&!has(h,'id="mpr-2"'));
mpSetQ('');
mpSetCol('bench');
h=main();
ok('列モード: BP だけ・未入力(伊藤)→免除(佐藤)→入力済みの順',has(h,'列モード: ベンチプレス')&&(function(){var ids=window._mp._chain;return ids&&ids[0]==='mpc-5-bench'&&ids[1]==='mpc-3-bench'&&ids.slice(2).every(function(x){return /^mpc-(1|2|4)-bench$/.test(x);});})());
ok('列モードの Enter 連鎖（_chain）は入力できる行数分（未統合の p4 は除く）',window._mp._chain.length===4&&!window._mp._chain.some(function(id){return /^mpc-4-/.test(id);}));
ok('列モードでもセルの onchange は mpCell',has(h,"onchange=\"mpCell(1,'bench',this)\""));
mpSetCol('bronco');
ok('time の列モード: 未入力（伊藤）が先・_chain は -m（未統合の高橋は除く）',(function(){var c=window._mp._chain;return c[0]==='mpc-5-bronco-m'&&c[1]==='mpc-3-bronco-m';})());
mpSetCol('');
ok('表に戻る',!has(main(),'列モード')&&has(main(),'id="mp-tbl"'));
ok('mpKey: Enter で data-next の要素へ focus（getAttribute はモックで null → 何もしない・落ちない）',(function(){var el=mkEl();var f=false;mpKey({key:'Enter',preventDefault:function(){}},el);return true;})());
ok('無効な日付は無視・正しい日付は採用',(function(){mpSetDate('x');var a=window._mp.date;mpSetDate('2026-09-10');return a===TODAY&&window._mp.date==='2026-09-10';})());
window._mp.date=TODAY;

print('--- 導線 ---');
V.msess();
h=main();
ok('一覧: 項目制の会に「特設ページ」ボタン（stopPropagation）',has(h,"event.stopPropagation();goMSessPage('m2')")&&!has(h,"goMSessPage('m1')"));
__pv.length=0;goMSessDetail('m2');
h=__pv[0].h;
ok('詳細: 「特設ページを開く」・未入力行の入力ボタンは特設ページへ',has(h,"goMSessPage('m2')")&&has(h,'特設ページを開く')&&!has(h,'goAddPhysForSess('));
__pv.length=0;goAddPhysForSess(1,'m2');
ok('goAddPhysForSess（項目制）→ 特設ページへ',curPage==='mp'&&__pv.length===0);
__pv.length=0;goAddPhysForSess(1,'m1');
ok('goAddPhysForSess（従来の会）→ 従来のフォーム',__pv.length===1&&has(__pv[0].h,'id="spa-sq"'));

print('--- 書き込みゲート ---');
reset();D.msess=[OLD,SESS];
document.getElementById('nph-p-val').value='1';document.getElementById('nph-date').value=TODAY;
['nph-sq','nph-bp','nph-dl','nph-cn','nph-cl','nph-br-m','nph-br-s','nph-db-m','nph-db-s'].forEach(function(id){document.getElementById(id).value='';});
document.getElementById('nph-dl').value='180';document.getElementById('nph-bp').value='95';
__toasts.length=0;__pop=0;
doAddPhys();drain();
var ph=JSON.parse(__store['ph']);
r1=ph.find(function(r){return r.id===101;});
ok('doAddPhys（項目制の会が開いている）: 新規記録を作らず p1 の会の記録に追記（BP=95 項目内・DL=180 項目外でも保存）',ph.length===6&&r1.bench===95&&r1.deadlift===180&&r1.at.bench===TODAY&&r1.by.bench==='staff'&&__pop===1&&has(__toasts[0].m,'特設ページ'));
ok('項目外の DL は進捗に数えない',phSessProgress(SESS,1).items.every(function(x){return x.k!=='deadlift';}));
reset();D.msess=[OLD,SESS];
document.getElementById('bulk-date').value=TODAY;
D.p.forEach(function(p){['bk-sq-','bk-bp-','bk-dl-','bk-br-m-','bk-br-s-','bk-db-m-','bk-db-s-'].forEach(function(pf){document.getElementById(pf+p.id).value='';});});
document.getElementById('bk-sq-3').value='105';document.getElementById('bk-br-m-1').value='5';document.getElementById('bk-br-s-1').value='0';
__toasts.length=0;
doBulkPhys();drain();
ph=JSON.parse(__store['ph']);
ok('doBulkPhys（項目制）: 2名分を各自の会の記録に追記・件数は増えない',ph.length===6&&ph.find(function(r){return r.id===103;}).squat===105&&ph.find(function(r){return r.id===101;}).bronco===300&&has(__toasts[0].m,'2名分'));
__pv.length=0;goBulkPhys();
ok('一括入力の案内: 進行中の会と特設ページのボタン',has(__pv[0].h,'第2回MAX測定')&&has(__pv[0].h,"goMSessPage('m2')"));
reset();D.msess=[OLD,SESS];
__pv.length=0;goEditPhys(101);
ok('goEditPhys（項目制の記録）: フォームを出さず特設ページへの案内',__pv.length===1&&has(__pv[0].h,'特設ページの記録です')&&has(__pv[0].h,"goMSessPage('m2')")&&!has(__pv[0].h,'id="eph-sq"'));
__pv.length=0;goEditPhys(106);
ok('goEditPhys（従来の記録）: 従来のフォーム・紐づけ先の選択肢に項目制の会は出ない',__pv.length===1&&has(__pv[0].h,'id="eph-sq"')&&has(__pv[0].h,'value="m1"')&&!has(__pv[0].h,'value="m2"'));
__alerts.length=0;doDelPhys(101);drain();
ok('doDelPhys（項目制の記録）: 削除しない・alert（免除で代替）',JSON.parse(__store['ph']).length===6&&__alerts.length===1&&has(__alerts[0],'免除'));
__alerts.length=0;doDelPhys(106);drain();
ok('doDelPhys（従来の記録）: 従来どおり削除',JSON.parse(__store['ph']).length===5&&__alerts.length===0);

print('--- 会が無い/閉じた時 ---');
window._mp={sessId:'zzz'};V.mp();
ok('会が無い: 案内と測定会管理へ',has(main(),'選ばれていません'));
D.msess=[OLD,Object.assign({},SESS,{closed:true})];window._mp={sessId:'m2',date:TODAY};V.mp();
ok('締切済みの会でも表示（締切済バッジ）',has(main(),'締切済')&&has(main(),'id="mp-tbl"'));

print('--- フェーズ5: 要対応キュー・ダッシュボード・BIG3ランキング ---');
reset();D.msess=[OLD,SESS];
var rq=reqQueue();
ok('reqQueue.msessPend: 会1件・未提出3名（提出済p2/測定なしp5を除く）・進行中3・未着手0・urgentCount は増えない',rq.msessPend.length===1&&rq.msessPend[0].pids.length===3&&rq.msessPend[0].inProgress===3&&rq.msessPend[0].none===0&&rq.urgentCount===0&&rq.count>=1);
D.msess=[OLD,Object.assign({},SESS,{closed:true})];
ok('締切済みの会は督促に出ない',reqQueue().msessPend.length===0);
D.msess=[OLD,Object.assign({},SESS,{items:[]})];
ok('非項目制の会は督促に出ない',reqQueue().msessPend.length===0);
D.msess=[OLD,Object.assign({},SESS,{endDate:daysAgo(20),startDate:daysAgo(30)})];
ok('猶予14日を過ぎた会は出ない',reqQueue().msessPend.length===0);
D.msess=[OLD,SESS];
nav('dash');
ok('ダッシュボード: 「測定会 未提出 3」と特設ページへの導線',has(main(),'測定会 未提出')&&has(main(),"goMSessPage('m2')")&&has(main(),'進行中 3名'));
document.getElementById('rkm').value='big3';document.getElementById('rky').value='';document.getElementById('rkp').value='';
nav('rank');
ok('BIG3ランキング: 別レコードに分かれた p4 も種目ベスト合計 190（110+80）で出る（旧: レコード内合計 110）',has(main(),'高橋 四')&&has(main(),'190')&&(function(){var t=txt(main());return /高橋 四[^0-9]*190/.test(t);})());
pushView=__pvOrig;
print('--- レビュー修正: 0 は削除・測定日は日をまたぐと今日・免除理由の下書き・行の部分更新・遷移後は再描画しない・分秒の保存タイミング ---');
reset();goMSessPage('m2');
(function(){var e=document.getElementById('mpc-1-squat');e.value='0';__toasts.length=0;mpCell(1,'squat',e);drain();var r=JSON.parse(__store['ph']).find(function(x){return x.id===101;});ok('kg セルに 0 → 値の削除（トーストは「消しました」）',r.squat===null&&has(__toasts[0].m,'消しました')&&!has(__toasts[0].m,'→'));})();
(function(){var st=mpState();st.date='2000-01-01';st.dateSet='2000-01-01';goMSessPage('m2');ok('日をまたいだら測定日は今日に戻る',mpState().date===TODAY);mpSetDate('2000-01-02');goMSessPage('m2');ok('今日選んだ日付は保たれる',mpState().date==='2000-01-02');})();
reset();goMSessPage('m2');
mpExOpen(1,'bench');mpExReason('怪我');mpExDraft('怪我（右肩）');V.mp();
ok('免除理由の下書きは再描画をまたいで残る',has(main(),'value="怪我（右肩）"'));
mpExClose();
reset();goMSessPage('m2');
(function(){var ae=mkEl();ae.tagName='INPUT';ae.id='mpc-3-squat';document.activeElement=ae;var e=document.getElementById('mpc-1-bench');e.value='100';mpCell(1,'bench',e);drain();document.getElementById('mpc-1-bronco-m').value='4';document.getElementById('mpc-1-bronco-s').value='30';mpCellT(1,'bronco');drain();var sub=__els['mps-1'].innerHTML;ok('入力中の保存後: 提出セルだけ書き換わり提出ボタンが有効（全体は再描画しない）',has(sub,'mpSubmit(1,true)')&&!has(sub,'disabled')&&has(__els['mpg-1'].innerHTML,'3/3'));document.activeElement=null;})();
(function(){reset();goMSessPage('m2');var e=document.getElementById('mpc-1-bench');e.value='100';var pending=null;var orig=svSafeUpdate;svSafeUpdate=function(k,fn,okCb,errCb){pending=function(){orig(k,fn,okCb,errCb);};};mpCell(1,'bench',e);svSafeUpdate=orig;nav('msess');pending();drain();ok('保存完了時に別ページへ移動済みなら特設ページで上書きしない',curPage==='msess'&&!has(main(),'id="mp-tbl"'));})();
(function(){reset();goMSessPage('m2');var st=mpState();var e=document.getElementById('mpc-1-bench');e.value='100';var orig=svSafeUpdate;var held=null;svSafeUpdate=function(k,fn,okCb,errCb){held=function(){orig(k,fn,okCb,errCb);};};mpCell(1,'bench',e);svSafeUpdate=orig;ok('保存中は state に saving',!!st.saving&&st.saving.k==='bench'&&st.saving.val===100);V.mp();ok('保存中に再描画されても入れた値を表示',has(main(),'id="mpc-1-bench" value="100"'));held();drain();ok('保存完了で saving が消える',st.saving===null);})();
(function(){reset();goMSessPage('m2');var e=document.getElementById('mpc-1-bench');e.value='100';var orig=svSafeUpdate;svSafeUpdate=function(k,fn,okCb,errCb){if(errCb)errCb(new Error('offline'));};__toasts.length=0;__alerts.length=0;mpCell(1,'bench',e);svSafeUpdate=orig;ok('保存失敗: alert ではなく再試行付きトースト',__alerts.length===0&&__toasts.length===1&&__toasts[0].l==='再試行');__toasts[0].f();drain();ok('再試行で保存される',JSON.parse(__store['ph']).find(function(x){return x.id===101;}).bench===100);})();
(function(){reset();goMSessPage('m2');__store['ph']=J(D.ph);var m=document.getElementById('mpc-1-bronco-m'),sc=document.getElementById('mpc-1-bronco-s');m.value='4';sc.value='';mpCellTDirty(1,'bronco');document.activeElement=sc;mpCellTOut(1,'bronco');__timeouts.splice(0).forEach(function(f){f();});drain();ok('分だけ確定して秒欄へ移動 → まだ保存しない',JSON.parse(__store['ph']).find(function(x){return x.id===101;}).bronco===null);sc.value='30';mpCellTDirty(1,'bronco');document.activeElement=null;mpCellTOut(1,'bronco');__timeouts.splice(0).forEach(function(f){f();});drain();ok('ペアの外へ出たら1回で 4分30秒 を保存',JSON.parse(__store['ph']).find(function(x){return x.id===101;}).bronco===270);__store['ph']=J(JSON.parse(__store['ph']));var n=JSON.parse(__store['ph']).find(function(x){return x.id===101;}).inputAt;mpCellTOut(1,'bronco');__timeouts.splice(0).forEach(function(f){f();});drain();ok('dirty でなければ focusout でも保存しない',JSON.parse(__store['ph']).find(function(x){return x.id===101;}).inputAt===n);})();
print('--- レビュー修正: ダッシュボード（未提出は情報層・本日の測定会は特設ページへ）---');
(function(){reset();window._mp=null;nav('dash');var h=main();ok('未提出は「緊急 — 即対応」枠に入らない（このフィクスチャでは緊急枠自体が出ない・情報層の中にある）',has(h,'測定会 未提出')&&!has(h,'緊急 — 即対応')&&h.indexOf('測定会 未提出')>h.indexOf('<div class="rv" style="margin-bottom:1.25rem">'));ok('本日の測定会（項目制）は特設ページへ',has(h,'padding:5px 0" onclick="goMSessPage(\'m2\')"'));})();
if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('msess_page tests failed');}
print('ALL MSESS-PAGE TESTS PASSED');
