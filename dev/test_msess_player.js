// 測定会の特設ページ フェーズ4（player）: 進行中カード・今日やること・会の項目だけの入力画面（差分送信・上書きUndo・提出済み読み取り専用）・
// 入口の振り分け（physEntry/doPhys）・フィジカル一覧の修正/削除ゲート
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_msess_player.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function J(x){return JSON.stringify(x);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
var __els={};document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
var __toasts=[];toast=function(m,l,f){__toasts.push({m:String(m),l:l,f:f});};
var __alerts=[];alert=function(m){__alerts.push(String(m));};
var __confirm=true;confirm=function(){return __confirm;};
var __mr=[];var __mrOrig=showMeasureResult;showMeasureResult=function(ctx){__mr.push(ctx);};
var __pb=[];pbFlash=function(m){__pb.push(String(m));};
function main(){return __els['main'].innerHTML;}
drain(); // 起動処理を先に流す

var S0=daysAgo(6),S1=daysAgo(-1),TODAY=daysAgo(0);
D.p=[{id:1,name:'田中 一',position:'PR',year:2},{id:2,name:'鈴木 二',position:'HO',year:3},{id:3,name:'佐藤 三',position:'SH',year:1}];
D.std=[];D.f=[];D.bc=[];D.i=[];D.cal=[];D.ann=[];D.offday=[];D.tlog=[];D.tmenu=[];D.a=[];D.md=[];D.wc=[];D.r=[];D.e1rm=[];D.pp=[];D.tgroup=[];
var SESS={id:'m2',name:'第2回MAX測定',startDate:S0,endDate:S1,mtype:'phys',items:['squat','bench','bronco']};
var OLDS={id:'m1',name:'旧MAX',startDate:S0,endDate:S1,mtype:'phys'};
D.msess=[SESS];D.phskip=[];
function base(){return [
  {id:101,pid:1,date:S0,msessId:'m2',squat:150,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{squat:S0},by:{squat:'player'},inputAt:'2026-09-08T10:00:00.000Z'},
  {id:102,pid:2,date:S0,msessId:'m2',squat:120,bench:90,deadlift:null,chinning:null,clean:null,bronco:305,downbronco:null,at:{squat:S0,bench:daysAgo(3),bronco:daysAgo(2)},by:{squat:'player',bench:'staff',bronco:'staff'},submitted:true,submittedAt:'2026-09-12T00:00:00.000Z',submittedBy:'staff',inputAt:'2026-09-12T10:00:00.000Z'},
  {id:103,pid:3,date:S0,msessId:'m2',squat:100,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{squat:S0},by:{squat:'staff'},ex:{bench:'肩の怪我'},inputAt:'2026-09-09T10:00:00.000Z'},
  {id:106,pid:1,date:daysAgo(60),msessId:null,squat:null,bench:null,deadlift:null,chinning:null,clean:null,bronco:320,downbronco:null,inputAt:'2026-07-15T10:00:00.000Z'}
];}
function reset(){D.ph=base();__store['ph']=J(D.ph);__store['msess']=J(D.msess);__toasts.length=0;__alerts.length=0;__mr.length=0;__pb.length=0;window._psOpen=null;}
reset();myPid=1;curTab='home';subView=null;

print('--- 入口の振り分け（physEntry / doPhys）---');
subView=null;physEntry();
ok('項目制の会が開いている → showPhysSessForm（会の項目だけ・psf-squat あり・pf-sq 無し）',subView===true&&has(main(),'第2回MAX測定')&&has(main(),'id="psf-bench"')&&!has(main(),'id="pf-sq"'));
subView=null;physEntry('bronco');
ok('ブロンコ入口: 会にブロンコがある → 会の画面',has(main(),'id="psf-bronco-m"')&&!has(main(),'id="pf-br-m"'));
D.msess=[Object.assign({},SESS,{items:['squat','bench']})];subView=null;physEntry('bronco');
ok('ブロンコ入口: 会にブロンコが無い → 従来のブロンコ画面',has(main(),'id="pf-br-m"')&&!has(main(),'id="psf-squat"'));
D.msess=[OLDS];subView=null;physEntry();
ok('非項目制の会 → 従来の showPhysForm',has(main(),'id="pf-sq"'));
D.msess=[SESS];
subView=null;showPhysForm();document.getElementById('pf-sq').value='160';document.getElementById('pf-date').value=TODAY;
var b0=mkEl();doPhys(b0,'');drain();
ok('doPhys（項目制の会が開いている）: 保存せず会の画面へ・ボタンはガードされない',has(main(),'id="psf-bench"')&&JSON.parse(__store['ph']).length===4&&b0.disabled===false);

print('--- ホームの進行中カード・今日やること ---');
subView=null;curTab='home';T.home();
var h=main();
ok('進行中カード: 会名・SQ 150・BP —・BR —・1/3 項目・続きを入力',has(h,'MEASUREMENT')&&has(h,'第2回MAX測定')&&has(h,'SQ 150')&&has(h,'BP —')&&has(h,'BR —')&&has(h,'1/3 項目')&&has(h,"showPhysSessForm('m2')")&&has(h,'続きを入力'));
ok('従来の「未入力です！」アラートは項目制の会では出ない',!has(h,'測定が未入力です'));
ok('今日やること: 「測定会: 第2回MAX測定（残り BP・BR）」・未完了',has(h,'測定会: 第2回MAX測定（残り BP・BR）')&&/測定会: 第2回MAX測定（残り BP・BR）<\/span>\s*<span[^>]*>入力 →/.test(h));
myPid=2;T.home();h=main();
ok('提出済みの選手: 確定表示・入力ボタン無し・今日やることは done',has(h,'確定（スタッフ確認済み）')&&!has(h,'続きを入力')&&!has(h,'入力する</button>')&&/測定会: 第2回MAX測定（入力済み）/.test(h)&&!/測定会: 第2回MAX測定（入力済み）<\/span>\s*<span[^>]*>入力 →/.test(h));
myPid=3;T.home();h=main();
ok('免除のある選手: BP 免除・2/3（SQ＋免除）・残り BR',has(h,'BP 免除')&&has(h,'2/3 項目')&&has(h,'残り BR'));
var __keepPh=D.ph;D.ph=__keepPh.filter(function(r){return r.pid!==3;});D.phskip=[{id:9,pid:3,date:S0,msessId:'m2',reason:'欠席',by:'staff'}];T.home(); // 記録が無く測定なし申告のある選手
ok('測定なし申告の選手（記録なし）: カードも今日やることも出ない',!has(main(),'MEASUREMENT')&&!has(main(),'測定会: '));
D.phskip=[];D.ph=__keepPh;myPid=1;
D.msess=[Object.assign({},SESS,{endDate:daysAgo(1)})];T.home();h=main();
ok('猶予期間（終了日を過ぎた）: カードは出る（締切まで入力できます）が今日やることには出ない',has(h,'締切まで入力できます')&&!has(h,'測定会: 第2回MAX測定'));
D.msess=[OLDS];T.home();
ok('非項目制の会: 従来のアラート・カード無し',has(main(),'測定が未入力です')&&!has(main(),'MEASUREMENT'));
D.msess=[SESS];

print('--- showPhysSessForm（差分送信・読み取り表示・変更）---');
subView=null;showPhysSessForm('m2');h=main();
ok('SQ は入力済み表示（150 kg・日付・変更ボタン）・入力欄なし',has(h,'>150<span')&&has(h,fmt(S0))&&has(h,"psOpen('m2','squat')")&&!has(h,'id="psf-squat"'));
ok('BP/BR は入力欄（未入力バッジ）・保存ボタン・測定日',has(h,'id="psf-bench"')&&has(h,'id="psf-bronco-m"')&&has(h,'>未入力<')&&has(h,"doPhysSess('m2',this)")&&has(h,'id="psf-date"'));
psOpen('m2','squat');h=main();
ok('変更: SQ が入力欄になり今の値の注記',has(h,'id="psf-squat" ')&&has(h,'value="150"')&&has(h,'今の値: 150kg'));
document.getElementById('psf-squat').value='150';document.getElementById('psf-bench').value='100';document.getElementById('psf-bronco-m').value='';document.getElementById('psf-bronco-s').value='';document.getElementById('psf-date').value=TODAY;
var b1=mkEl();b1.innerHTML='保存する';
doPhysSess('m2',b1);drain();
var ph=JSON.parse(__store['ph']),r1=ph.find(function(r){return r.id===101;});
ok('差分送信: BP=100 だけ保存（at=今日・by=player）・SQ は同じ値なので at/by 不変・件数不変',r1.bench===100&&r1.at.bench===TODAY&&r1.by.bench==='player'&&r1.squat===150&&r1.at.squat===S0&&r1.by.squat==='player'&&ph.length===4);
ok('結果シート（NO SIDE）が BP だけで呼ばれる・トースト「記録しました」',__mr.length===1&&__mr[0].vals.bench===100&&__mr[0].vals.squat===null&&__toasts.some(function(t){return t.m==='記録しました';}));
ok('入力なしで保存 → alert',(function(){subView=null;showPhysSessForm('m2');__alerts.length=0;['psf-bronco-m','psf-bronco-s'].forEach(function(id){document.getElementById(id).value='';});doPhysSess('m2',mkEl());return __alerts.length===1&&has(__alerts[0],'入力された項目がありません');})());
// 上書き → トーストで元に戻す
D.ph=JSON.parse(__store['ph']);subView=null;psOpen('m2','bench');
document.getElementById('psf-bench').value='95';document.getElementById('psf-date').value=TODAY;['psf-bronco-m','psf-bronco-s'].forEach(function(id){document.getElementById(id).value='';});
__toasts.length=0;__mr.length=0;
doPhysSess('m2',mkEl());drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('上書き: BP 100→95・トースト「BP 100→95 に置き換えました」＋元に戻す',r1.bench===95&&__toasts.length===1&&has(__toasts[0].m,'BP 100→95')&&typeof __toasts[0].f==='function');
__toasts[0].f();drain();
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('元に戻す: BP=100・at=今日（前の値の測定日）・by=player',r1.bench===100&&r1.at.bench===TODAY&&r1.by.bench==='player');
// 自己ベスト更新の演出
D.ph=JSON.parse(__store['ph']);subView=null;showPhysSessForm('m2');
document.getElementById('psf-bronco-m').value='5';document.getElementById('psf-bronco-s').value='0';document.getElementById('psf-date').value=TODAY;
__pb.length=0;__mr.length=0;
doPhysSess('m2',mkEl());drain();__timeouts.splice(0).forEach(function(f){f();}); // pbFlash は setTimeout 経由
r1=JSON.parse(__store['ph']).find(function(r){return r.id===101;});
ok('BR=300 保存・過去ベスト320より速い → pbFlash（ブロンコ自己ベスト更新）',r1.bronco===300&&__pb.length===1&&has(__pb[0],'ブロンコ自己ベスト更新')&&__mr.length===1);
D.ph=JSON.parse(__store['ph']);
ok('全項目そろった → ホームは「全項目入力済み・スタッフの確認待ち」・今日やること done',(function(){subView=null;curTab='home';T.home();var hh=main();return has(hh,'全項目入力済み・スタッフの確認待ち')&&/測定会: 第2回MAX測定（入力済み）/.test(hh);})());
// 提出済み → 読み取り専用
myPid=2;subView=null;showPhysSessForm('m2');h=main();
ok('提出済み: 確定済みの案内・入力欄も保存ボタンも変更ボタンも無し',has(h,'確定済み')&&!/id="psf-(squat|bench|bronco|date)/.test(h)&&has(h,'id="psf-root"')&&!has(h,'doPhysSess(')&&!has(h,"psOpen("));
__alerts.length=0;doPhysSess('m2',mkEl());
ok('提出済みの選手が保存を呼んでも alert',__alerts.length===1&&has(__alerts[0],'確定済み'));
ok('提出済みで値が消された項目は「未入力（スタッフが確認中）」・null を出さない',(function(){var keep=D.ph;D.ph=JSON.parse(J(keep));var r=D.ph.find(function(x){return x.id===102;});r.squat=null;delete r.at.squat;subView=null;showPhysSessForm('m2');var hh=main();D.ph=keep;return has(hh,'未入力（スタッフが確認中）')&&!has(hh,'null');})());
// 免除の表示
myPid=3;subView=null;showPhysSessForm('m2');h=main();
ok('免除: 「スタッフの設定: 肩の怪我」・BP の入力欄なし・BR は入力欄',has(h,'スタッフの設定: 肩の怪我')&&!has(h,'id="psf-bench"')&&has(h,'id="psf-bronco-m"'));
// 未統合
myPid=1;D.ph.push({id:107,pid:1,date:TODAY,msessId:'m2',squat:null,bench:110,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-14T12:00:00.000Z'});
subView=null;showPhysSessForm('m2');
ok('記録が2件（未統合）: 入力できない案内・保存ボタン無し',has(main(),'記録が複数あります')&&!has(main(),'doPhysSess('));
D.ph.pop();

print('--- フィジカル一覧のゲート ---');
myPid=1;D.ph=JSON.parse(__store['ph']);curTab='physical';subView=null;T.physical();h=main();
ok('項目制の記録: 修正/削除ボタン無し・「測定会」バッジ・「測定会で入力」',!has(h,'showEditPhysRec(101)')&&!has(h,'delPhysRec(101)')&&has(h,'>測定会<')&&has(h,"showPhysSessForm('m2')"));
ok('従来の記録(106): 修正/削除ボタンあり',has(h,'showEditPhysRec(106)')&&has(h,'delPhysRec(106)'));
myPid=2;T.physical();
ok('提出済みの記録: 「確定」表示',has(main(),'>確定<'));
myPid=1;
subView=null;showEditPhysRec(101);
ok('showEditPhysRec（項目制・未提出）→ 会の画面へ',has(main(),'id="psf-bench"')||has(main(),"psOpen('m2'"));
myPid=2;__alerts.length=0;showEditPhysRec(102);
ok('showEditPhysRec（提出済み）→ alert',__alerts.length===1&&has(__alerts[0],'確定済み'));
myPid=1;__alerts.length=0;delPhysRec(101);drain();
ok('delPhysRec（項目制）→ 削除しない・alert',JSON.parse(__store['ph']).length===4&&__alerts.length===1&&has(__alerts[0],'削除できません'));
__alerts.length=0;delPhysRec(106);drain();
ok('delPhysRec（従来の記録）→ 従来どおり削除',JSON.parse(__store['ph']).length===3&&__alerts.length===0);

showMeasureResult=__mrOrig;
print('--- レビュー修正: 複数の会・確定済みの再判定・変更状態のリセット・従来経路の紐づけ・画面の元値 ---');
function cnt(h,sub){return String(h).split(sub).length-1;}
showMeasureResult=function(ctx){__mr.push(ctx);};
function clearPsf(){['psf-squat','psf-bench','psf-bronco-m','psf-bronco-s','psf-date'].forEach(function(id){document.getElementById(id).value='';});}
reset();myPid=1;
var BR={id:'m3',name:'ブロンコ測定',startDate:daysAgo(1),endDate:daysAgo(-3),mtype:'bronco',items:['bronco']};
D.msess=[Object.assign({},SESS,{items:['squat','bench']}),BR];__store['msess']=J(D.msess);
subView=null;curTab='home';T.home();h=main();
ok('ホーム: 開いている項目制の会が2つとも進行中カードに出る',has(h,'第2回MAX測定')&&has(h,'ブロンコ測定')&&cnt(h,'MEASUREMENT')===2);
ok('今日やること: 会ごとに1行',cnt(todayTodoHtml(),'測定会: ')===2);
subView=null;physEntry('bronco');ok('physEntry(bronco): ブロンコの会へ',has(main(),'ブロンコ測定')&&has(main(),'id="psf-bronco-m"'));
subView=null;physEntry();ok('physEntry(): kg の会（MAX）へ（SQ は入力済み＝変更ボタン・BP は入力欄）',has(main(),'第2回MAX測定')&&has(main(),'id="psf-bench"')&&has(main(),"psOpen('m2','squat')"));
D.msess=[BR];__store['msess']=J(D.msess);subView=null;physEntry();ok('kg の会が無ければ開いている会（ブロンコ）へ',has(main(),'ブロンコ測定'));
D.msess=[{id:'m4',name:'種別だけブロンコ',startDate:daysAgo(1),endDate:daysAgo(-3),mtype:'bronco',items:['squat']}];__store['msess']=J(D.msess);
subView=null;physEntry('bronco');ok('ブロンコを測る会が無ければ従来のブロンコフォーム',has(main(),'id="pf-br-m"'));
(function(){__store['ph']=J(D.ph);document.getElementById('pf-br-m').value='4';document.getElementById('pf-br-s').value='50';document.getElementById('pf-date').value=TODAY;__toasts.length=0;doPhys(mkEl(),'bronco');drain();var l=JSON.parse(__store['ph']);var n=l[l.length-1];D.ph=l;ok('doPhys(bronco): 記録は msessId 無し（項目制の会に紐づけない）・会の記録数は増えない',n.bronco===290&&n.msessId==null&&phSessRecs(D.msess[0],1).length===0);})();
D.msess=[SESS];__store['msess']=J(D.msess);
reset();subView=null;showPhysSessForm('m2');
(function(){clearPsf();var srv=JSON.parse(__store['ph']);srv.find(function(x){return x.id===101;}).submitted=true;__store['ph']=J(srv);document.getElementById('psf-bench').value='100';__alerts.length=0;var b=mkEl();doPhysSess('m2',b);drain();var l=JSON.parse(__store['ph']);ok('保存時にサーバーが確定済みなら書かずに alert・ボタン復帰',l.find(function(x){return x.id===101;}).bench===null&&__alerts.length===1&&has(__alerts[0],'確定済み')&&b.disabled===false);})();
reset();subView=null;showPhysSessForm('m2');
(function(){var srv=JSON.parse(__store['ph']);srv.push({id:199,pid:1,date:S0,msessId:'m2',squat:140,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-13T10:00:00.000Z'});__store['ph']=J(srv);clearPsf();document.getElementById('psf-bench').value='100';__alerts.length=0;doPhysSess('m2',null);drain();var l=JSON.parse(__store['ph']);ok('保存時にサーバーで未統合なら書かずに alert',!l.some(function(x){return x.bench===100;})&&__alerts.length===1&&has(__alerts[0],'まとめるまで'));})();
reset();subView=null;showPhysSessForm('m2');psOpen('m2','squat');
(function(){clearPsf();var el=document.getElementById('psf-squat'),g=el.getAttribute;el.getAttribute=function(a){return a==='data-orig'?'150':null;};el.value='150';var srv=JSON.parse(__store['ph']);srv.find(function(x){return x.id===101;}).squat=155;__store['ph']=J(srv);D.ph=srv;__alerts.length=0;doPhysSess('m2',null);drain();ok('開いた時の値(150)のまま保存 → 送らない（その間にスタッフが直した 155 を巻き戻さない）',JSON.parse(__store['ph']).find(function(x){return x.id===101;}).squat===155&&__alerts.length===1);el.getAttribute=g;})();
ok('入力欄に data-orig（今の値）',(function(){reset();subView=null;showPhysSessForm('m2');psOpen('m2','squat');return has(main(),'id="psf-squat" data-orig="150"');})());
reset();subView=null;showPhysSessForm('m2');psOpen('m2','squat');
(function(){clearPsf();document.getElementById('psf-squat').value='140';__toasts.length=0;doPhysSess('m2',null);drain();var t=__toasts[0];ok('上書きトースト（PB でない値）',!!t&&has(t.m,'150→140'));var srv=JSON.parse(__store['ph']);srv.find(function(x){return x.id===101;}).submitted=true;__store['ph']=J(srv);__alerts.length=0;t.f();drain();ok('元に戻す: サーバーが確定済みなら戻さず alert',JSON.parse(__store['ph']).find(function(x){return x.id===101;}).squat===140&&__alerts.length===1);})();
reset();subView=null;showPhysSessForm('m2');psOpen('m2','squat');ok('psOpen で変更状態',!!window._psOpen);go('home');ok('タブ移動で変更状態が消える',window._psOpen===null);
ok('psShowing: 表示中の会だけ真',(function(){subView=null;showPhysSessForm('m2');var e=__els['psf-root'];var g=e.getAttribute;e.getAttribute=function(a){return a==='data-sess'?'m2':null;};var r=psShowing('m2')&&!psShowing('m9');e.getAttribute=g;return r;})());
if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('msess_player tests failed');}
print('ALL MSESS-PLAYER TESTS PASSED');
