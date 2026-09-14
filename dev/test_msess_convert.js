// 測定会の特設ページ フェーズ2（staff）: 測定会の項目設定（作成/編集）・既存会の「特設ページ化」（統合の計画/適用・2段階実行・再試行・Undo・冪等）・
// 測定会詳細/一覧/ダッシュボードの表示。フィクスチャは本番の形（1件/複数日/同項目の値違い/期間外日付/msessId無し/統合済み/他の会）を縮約。
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_msess_convert.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function J(x){return JSON.stringify(x);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
var __els={};document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
var __toasts=[];toast=function(m,l,f){__toasts.push({m:String(m),l:l,f:f});};
var __alerts=[];alert=function(m){__alerts.push(String(m));};
var __pv=[];var __pvOrig=pushView;pushView=function(t,h,fn){__pv.push({t:t,h:h});if(fn)fn();};
var __pop=0;popView=function(){__pop++;};
var __pd=[];goPlayerDetail=function(pid){__pd.push(pid);};
drain(); // 起動時の ld().then(nav('dash')) を先に流す

var S0=daysAgo(7),S1=daysAgo(1),SB=daysAgo(11); // 会=7日前〜昨日。SB=期間前
D.p=[{id:1,name:'一人',position:'PR'},{id:2,name:'複数',position:'HO'},{id:3,name:'値違い',position:'LO'},{id:4,name:'期間外',position:'SH'},{id:5,name:'紐なし',position:'FL'},{id:6,name:'統合済',position:'FB'},{id:7,name:'未入力',position:'WTB'},{id:8,name:'免除済',position:'CTB'}];
D.std=[];D.f=[];D.bc=[];D.i=[];D.cal=[];D.rtest=[];D.phskip=[];D.tape=[];D.tapeslot=[];D.ann=[];
var SESS={id:'m2',name:'2026年第2回MAX測定',startDate:S0,endDate:S1,mtype:'phys'};
var OTHER={id:'m1',name:'ブロンコ測定',startDate:daysAgo(40),endDate:daysAgo(39),mtype:'bronco',closed:true};
D.msess=[OTHER,SESS];
var PID=function(n){return 1700000000000000+n;}; // 選手の newId 風=16桁
function base(){return [
  {id:PID(1),pid:1,date:S0,msessId:'m2',squat:150,bench:null,deadlift:null,chinning:60,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-07T10:00:00.000Z'},
  {id:PID(2),pid:2,date:S0,msessId:'m2',squat:120,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-07T10:01:00.000Z'},
  {id:PID(3),pid:2,date:daysAgo(4),msessId:'m2',squat:null,bench:90,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-10T10:00:00.000Z'},
  {id:1757000000000,pid:2,date:S1,msessId:'m2',squat:null,bench:null,deadlift:160,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-13T10:00:00.000Z'}, // staff入力(13桁)
  {id:PID(4),pid:3,date:S0,msessId:'m2',squat:100,bench:80,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-07T11:00:00.000Z'},
  {id:PID(5),pid:3,date:daysAgo(3),msessId:'m2',squat:110,bench:80,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-11T11:00:00.000Z'}, // SQ 100→110（後の値）・BP 同値
  {id:PID(6),pid:4,date:SB,msessId:'m2',squat:130,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-03T10:00:00.000Z'}, // 期間前の日付
  {id:PID(7),pid:5,date:daysAgo(5),msessId:null,squat:null,bench:70,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-09T10:00:00.000Z'}, // msessId無し・期間内
  {id:PID(8),pid:6,date:S0,msessId:'m2',squat:140,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{squat:S0},by:{squat:'player'},inputAt:'2026-09-07T12:00:00.000Z'}, // 統合済み
  {id:PID(9),pid:8,date:S0,msessId:'m2',squat:null,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,ex:{squat:'膝'},submitted:true,submittedAt:'2026-09-08T00:00:00.000Z',submittedBy:'staff',editedAt:'2026-09-08T00:00:00.000Z',inputAt:'2026-09-07T13:00:00.000Z'},
  {id:PID(10),pid:1,date:daysAgo(40),msessId:'m1',squat:null,bench:null,deadlift:null,chinning:null,clean:null,bronco:300,downbronco:null,inputAt:'2026-08-05T10:00:00.000Z'}, // 他の会
  {id:PID(11),pid:2,date:daysAgo(60),msessId:null,squat:100,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-07-15T10:00:00.000Z'} // 期間外・紐なし＝対象外
];}
D.ph=base();__store['ph']=J(D.ph);__store['msess']=J(D.msess);

print('--- msessConsolidatePlan（純粋）---');
var ids={};D.p.forEach(function(p){ids[String(p.id)]=900+p.id;});
var plan=msessConsolidatePlan(D.ph,SESS,ids);
ok('件数: 10件→7名（他の会・期間外は含めない）・複数日3名(2,3)…',plan.nRecs===10&&plan.nPlayers===7&&plan.nMulti===2);
ok('値違い1名(3)・期間外1名(4)・紐なし1件(5)・統合済み1名(6)',plan.nConflict===1&&plan.nClamped===1&&plan.nFallback===1&&plan.nAlready===1);
var row=function(pid){return plan.rows.filter(function(r){return r.pid===pid;})[0];};
var r2=row(2).rec;
ok('p2: 3件→1件・SQ/BP/DL に各日付・by は id 桁数（選手/選手/スタッフ）・id は予約分・date=最小・inputAt=最大',r2.id===902&&r2.squat===120&&r2.bench===90&&r2.deadlift===160&&r2.at.squat===S0&&r2.at.bench===daysAgo(4)&&r2.at.deadlift===S1&&r2.by.squat==='player'&&r2.by.deadlift==='staff'&&r2.date===S0&&r2.inputAt==='2026-09-13T10:00:00.000Z'&&r2.msessId==='m2');
ok('p2: 固定列7つ・ex/submitted 無し',['squat','bench','deadlift','chinning','clean','bronco','downbronco'].every(function(k){return k in r2;})&&!('ex' in r2)&&!('submitted' in r2));
var r3=row(3);
ok('p3: SQ は後の日付の110を採用・100は不採用として記録・BP 同値は食い違いに数えない',r3.rec.squat===110&&r3.rec.at.squat===daysAgo(3)&&r3.conflicts.length===1&&r3.conflicts[0].k==='squat'&&r3.conflicts[0].chosen===110&&J(r3.conflicts[0].dropped)===J([{val:100,at:S0}]));
var r1=row(1);
ok('p1: 1件は同じ id のまま・at/by が付く・chinning も残る',r1.single&&r1.rec.id===PID(1)&&r1.rec.at.squat===S0&&r1.rec.at.chinning===S0&&r1.rec.by.squat==='player'&&r1.rec.chinning===60&&!r1.already);
var r4=row(4);
ok('p4: 期間前の日付 → date は開始日にクランプ・at はそのまま',r4.clamped&&r4.rec.date===S0&&r4.rec.at.squat===SB);
var r5=row(5);
ok('p5: msessId 無し（期間内）→ 取り込み・msessId 明示',r5.fallback===1&&r5.rec.msessId==='m2'&&r5.rec.bench===70);
ok('p6: 統合済み → already（触らない）',row(6).already===true);
var r8=row(8).rec;
ok('p8: ex/submitted/editedAt は維持（統合しても提出が消えない）',r8.ex.squat==='膝'&&r8.submitted===true&&r8.submittedAt==='2026-09-08T00:00:00.000Z'&&r8.editedAt==='2026-09-08T00:00:00.000Z');
ok('p7（記録なし）は行に出ない・入力は変更しない',!row(7)&&J(D.ph)===J(base()));
ok('ids 無しの事前表示でも動く（複数の選手は仮 id）',msessConsolidatePlan(D.ph,SESS,null).rows.filter(function(r){return r.pid===2;})[0].rec.id===1757000000000);

print('--- msessConsolidateApply（冪等・他の会は不変）---');
var ap=msessConsolidateApply(JSON.parse(J(D.ph)),SESS,ids);
var L=ap.latest;
ok('結果: 7名分＋他の会2件＝9件',L.length===9);
ok('元の複数記録(2,3,4番/5,6番)は消え、統合記録が入る',!L.some(function(r){return r.id===PID(2)||r.id===PID(3)||r.id===1757000000000||r.id===PID(5);})&&L.some(function(r){return r.id===902;})&&L.some(function(r){return r.id===903;}));
ok('他の会（m1）と期間外の記録は不変',J(L.filter(function(r){return r.id===PID(10);})[0])===J(base()[10])&&J(L.filter(function(r){return r.id===PID(11);})[0])===J(base()[11]));
ok('統合済み(p6)は同一オブジェクト内容のまま',J(L.filter(function(r){return r.id===PID(8);})[0])===J(base()[8]));
var ap2=msessConsolidateApply(JSON.parse(J(L)),SESS,ids);
ok('もう一度適用しても変わらない（冪等）',J(ap2.latest.slice().sort(function(a,b){return String(a.id).localeCompare(String(b.id));}))===J(L.slice().sort(function(a,b){return String(a.id).localeCompare(String(b.id));}))&&ap2.plan.nAlready===7);
ok('適用後は各選手1件・phSessProgress で全項目が見える',(function(){var keep=D.ph;D.ph=L;var pg=phSessProgress(Object.assign({},SESS,{items:['squat','bench','deadlift']}),2);D.ph=keep;return !pg.unmerged&&pg.doneN===3&&pg.complete&&pg.items[1].at===daysAgo(4)&&pg.items[2].by==='staff';})());

print('--- goMSessConvert（事前表示）---');
__pv.length=0;goMSessConvert('m2');
var h=__pv[0].h;
ok('件数の表示 10件→7名・複数日2名・値違い1名',has(h,'>10<')&&has(h,'>7<')&&has(h,'複数日に分けた選手')&&/color:var\(--blue\)">2</.test(h)&&/color:var\(--amber\)">1</.test(h));
ok('既定の項目=値がある項目（SQ/BP/DL/CN）がチェック・BR は未チェック',has(h,'id="msc-it-squat" checked')&&has(h,'id="msc-it-bench" checked')&&has(h,'id="msc-it-deadlift" checked')&&has(h,'id="msc-it-chinning" checked')&&!has(h,'id="msc-it-bronco" checked'));
ok('値違いの行: 採用110と不採用100（取り消し線）・期間外/紐づけ追加/統合済みのバッジ',has(h,'>110<')&&has(h,'line-through">100 ')&&has(h,'期間外の日付')&&has(h,'紐づけ追加')&&has(h,'統合済み'));
ok('注意文: 後の日付の値を採用・期間内にそろえる・取り込む・バックアップ',has(h,'後の日付の値')&&has(h,'期間内にそろえます')&&has(h,'取り込みます')&&has(h,'exportAllJSON()'));
ok('生hex/rgba なし・実行ボタン',!/#[0-9a-fA-F]{6}\b/.test(h)&&has(h,"doMSessConvert('m2',this)"));

print('--- doMSessConvert（2段階実行・トースト Undo）---');
function setChecks(pfx,keys){PH_ITEMS.forEach(function(it){document.getElementById(pfx+'-it-'+it.k).checked=keys.indexOf(it.k)>=0;});}
setChecks('msc',['squat','bench','deadlift']);document.getElementById('msc-type').value='phys';
__toasts.length=0;__alerts.length=0;__pv.length=0;__pop=0;
var btn=mkEl();btn.innerHTML='実行';
doMSessConvert('m2',btn);drain();
var phS=JSON.parse(__store['ph']),msS=JSON.parse(__store['msess']);
ok('ph が統合された（9件）・msess.items=[SQ,BP,DL]・mtype=phys',phS.length===9&&J(msS[1].items)==='["squat","bench","deadlift"]'&&msS[1].mtype==='phys'&&J(msessItems(D.msess[1]))==='["squat","bench","deadlift"]');
ok('統合記録の id は newId（updateFn の外で予約）・D.ph も更新',phS.some(function(r){return r.pid===2&&r.deadlift===160&&String(r.id).length>=16;})&&D.ph.length===9);
ok('トースト「統合して特設ページにしました（10件 → 7名）」＋元に戻す・ボタン復帰・popView→詳細',__toasts.length===1&&has(__toasts[0].m,'10件 → 7名')&&typeof __toasts[0].f==='function'&&btn.disabled===false&&__pop===1&&__pv.length===1&&has(__pv[0].h,'特設ページ')&&__alerts.length===0);
ok('詳細: 項目が表示され「特設ページ化」の案内は出ない・編集フォームの項目は変えられない',has(__pv[0].h,'項目: スクワット・ベンチプレス・デッドリフト')&&!has(__pv[0].h,"goMSessConvert(")&&has(__pv[0].h,'記録がある会では変えられません')&&!has(__pv[0].h,'id="ms-e-items-on"'));
// Undo
var before=JSON.parse(J(base()));
__toasts[0].f();drain();
var phU=JSON.parse(__store['ph']),msU=JSON.parse(__store['msess']);
var sortId=function(a){return a.slice().sort(function(x,y){return String(x.id).localeCompare(String(y.id));});};
ok('元に戻す: 統合前の12件がそのまま復元・items が外れる',J(sortId(phU))===J(sortId(before))&&!('items' in msU[1])&&msessItems(D.msess[1]).length===0);
ok('Undo のトースト',__toasts.some(function(t){return has(t.m,'統合前に戻しました');}));

print('--- 冪等: 統合済みの会でもう一度実行しても変わらない ---');
doMSessConvert('m2',mkEl());drain();
var ph1=JSON.parse(__store['ph']);
var tid={};D.p.forEach(function(p){tid[String(p.id)]=1;});
var again=msessConsolidateApply(JSON.parse(J(ph1)),D.msess[1],{});
ok('再統合しても記録は変わらない（全員 already）',J(sortId(again.latest))===J(sortId(ph1))&&again.plan.nAlready===7);
ok('統合後に旧フォームで2件目が入ると未統合として検出される',(function(){var keep=D.ph;D.ph=ph1.concat([{id:PID(20),pid:1,date:S1,msessId:'m2',bench:100,inputAt:'2026-09-13T12:00:00.000Z'}]);var pg=phSessProgress(D.msess[1],1);var pl=msessConsolidatePlan(D.ph,D.msess[1],null);D.ph=keep;return pg.unmerged===true&&pl.nMulti===1&&pl.nAlready===6;})());

print('--- ②失敗 → _msConvPending と再試行 ---');
D.ph=base();__store['ph']=J(D.ph);D.msess=[OTHER,Object.assign({},SESS)];__store['msess']=J(D.msess);
var __origSSU=svSafeUpdate,__nCall=0;
svSafeUpdate=function(k,fn,okCb,errCb){__nCall++;if(k==='msess'){if(errCb)errCb(new Error('offline'));return;}return __origSSU(k,fn,okCb,errCb);};
__toasts.length=0;__alerts.length=0;__pv.length=0;
setChecks('msc',['squat','bench']);
doMSessConvert('m2',mkEl());drain();
ok('ph は統合済み・msess は未設定・alert・pending 保持',JSON.parse(__store['ph']).length===9&&!('items' in JSON.parse(__store['msess'])[1])&&__alerts.length===1&&has(__alerts[0],'再試行')&&window._msConvPending&&window._msConvPending.sessId==='m2'&&J(window._msConvPending.items)==='["squat","bench"]');
ok('詳細に再試行バナー',__pv.length===1&&has(__pv[0].h,'項目の設定を再試行')&&has(__pv[0].h,"msessConvertRetry('m2')"));
svSafeUpdate=__origSSU;
__toasts.length=0;__pv.length=0;
msessConvertRetry('m2');drain();
ok('再試行: items が入り pending 解除・トースト（元に戻す付き）',J(JSON.parse(__store['msess'])[1].items)==='["squat","bench"]'&&window._msConvPending===null&&__toasts.length===1&&has(__toasts[0].m,'項目を設定しました')&&typeof __toasts[0].f==='function');
__toasts[0].f();drain();
ok('再試行後の Undo も統合前に戻る',J(sortId(JSON.parse(__store['ph'])))===J(sortId(base()))&&!('items' in JSON.parse(__store['msess'])[1]));
ok('①失敗 → 記録は変わらず・alert・pending なし',(function(){svSafeUpdate=function(k,fn,okCb,errCb){if(errCb)errCb(new Error('offline'));};__alerts.length=0;var b=mkEl();doMSessConvert('m2',b);drain();svSafeUpdate=__origSSU;return __alerts.length===1&&has(__alerts[0],'記録は変わっていません')&&J(sortId(JSON.parse(__store['ph'])))===J(sortId(base()))&&!window._msConvPending&&b.disabled===false;})());
ok('項目を選ばずに実行 → alert',(function(){setChecks('msc',[]);__alerts.length=0;doMSessConvert('m2',mkEl());drain();return __alerts.length===1&&has(__alerts[0],'項目を1つ以上');})());

print('--- 作成/編集フォームの項目 ---');
__pv.length=0;goAddMSess();
ok('作成: 項目チェック（既定 SQ/BP/DL）・種別 phys',has(__pv[0].h,'id="ms-it-squat" checked')&&has(__pv[0].h,'id="ms-it-bench" checked')&&has(__pv[0].h,'id="ms-it-deadlift" checked')&&!has(__pv[0].h,'id="ms-it-bronco" checked')&&has(__pv[0].h,'value="phys" selected'));
D.msess=[OTHER,Object.assign({},SESS,{items:['bronco','downbronco']})];
__pv.length=0;goAddMSess();
ok('作成: 既定は直近の項目制の会の items・種別は bronco 既定',has(__pv[0].h,'id="ms-it-bronco" checked')&&has(__pv[0].h,'id="ms-it-downbronco" checked')&&!has(__pv[0].h,'id="ms-it-squat" checked')&&has(__pv[0].h,'value="bronco" selected'));
ok('msAutoType: time だけなら bronco・混在/空は phys',msAutoType(['bronco','downbronco'])==='bronco'&&msAutoType(['bronco','squat'])==='phys'&&msAutoType([])==='phys');
ok('msSyncType: チェックに合わせて種別セレクトを更新',(function(){setChecks('ms',['bronco']);document.getElementById('ms-type').value='phys';msSyncType('ms');var a=document.getElementById('ms-type').value;setChecks('ms',['squat']);msSyncType('ms');return a==='bronco'&&document.getElementById('ms-type').value==='phys';})());
D.msess=[OTHER,Object.assign({},SESS)];__store['msess']=J(D.msess);
document.getElementById('ms-name').value='第3回';document.getElementById('ms-start').value=S1;document.getElementById('ms-end').value=daysAgo(0);document.getElementById('ms-type').value='phys';document.getElementById('ms-note').value='';
setChecks('ms',['squat','bronco']);
doAddMSess();drain();
var added=JSON.parse(__store['msess']).slice(-1)[0];
ok('doAddMSess: items=[squat,bronco] を保存（順序はカタログ順）',added.name==='第3回'&&J(added.items)==='["squat","bronco"]');
setChecks('ms',[]);document.getElementById('ms-name').value='従来';doAddMSess();drain();
ok('項目なしで作成 → items キー無し（従来の測定会）',!('items' in JSON.parse(__store['msess']).slice(-1)[0]));
D.msess=JSON.parse(__store['msess']);
var s3=added;
__pv.length=0;goMSessDetail(s3.id);
ok('記録の無い会の詳細: 編集フォームに項目チェック（現在の items が選択）＋hidden ms-e-items-on・特設ページ化の案内は無い',has(__pv[0].h,'id="ms-e-it-squat" checked')&&has(__pv[0].h,'id="ms-e-it-bronco" checked')&&has(__pv[0].h,'id="ms-e-items-on" value="1"')&&!has(__pv[0].h,'goMSessConvert('));
document.getElementById('ms-e-name').value='第3回';document.getElementById('ms-e-start').value=S1;document.getElementById('ms-e-end').value=daysAgo(0);document.getElementById('ms-e-type').value='phys';document.getElementById('ms-e-items-on').value='1';
setChecks('ms-e',['deadlift']);
doEditMSess(s3.id);drain();
ok('doEditMSess: 記録の無い会は items を差し替えられる',J(JSON.parse(__store['msess']).filter(function(x){return x.id===s3.id;})[0].items)==='["deadlift"]');
setChecks('ms-e',[]);doEditMSess(s3.id);drain();
ok('全て外すと items キーが消える（従来の測定会に戻る）',!('items' in JSON.parse(__store['msess']).filter(function(x){return x.id===s3.id;})[0]));
document.getElementById('ms-e-items-on').value='';setChecks('ms-e',['squat']);
D.msess=JSON.parse(__store['msess']);
doEditMSess('m2');drain();
ok('記録がある会（hidden 無し）は編集で items を触らない',!('items' in JSON.parse(__store['msess']).filter(function(x){return x.id==='m2';})[0]));
__pv.length=0;goMSessDetail('m2');
ok('記録がある非項目制の会: 「特設ページ化する」の案内・編集フォームに項目チェック無し',has(__pv[0].h,"goMSessConvert('m2')")&&!has(__pv[0].h,'id="ms-e-it-squat"'));
ok('詳細の3カウンタは従来どおり（done=6・skip=0・missed=2）',(function(){var t=__pv[0].h.replace(/<[^>]+>/g,' ');return /\b6\s+入力済み/.test(t)&&/\b0\s+測定なし/.test(t)&&/\b2\s+未入力/.test(t);})());

print('--- 一覧とダッシュボード ---');
D.msess=[OTHER,Object.assign({},SESS,{items:['squat','bench'],endDate:daysAgo(0)})]; // 今日が期間内
V.msess();
var lh=__els['main-ct'].innerHTML;
ok('一覧: 項目制の会に「特設ページ」バッジと SQ・BP（msessId 無しの p5 は項目制では数えない＝6名）',has(lh,'特設ページ')&&has(lh,'SQ・BP')&&has(lh,'入力済: 6名'));
V.dash();
var dh=__els['main-ct'].innerHTML;
ok('ダッシュボード「本日の測定会」: 期間内の会が出て項目を表示（以前は常に空だった死コード）',has(dh,'本日の測定会')&&has(dh,'2026年第2回MAX測定')&&has(dh,'SQ・BP'));
D.msess=[OTHER,Object.assign({},SESS,{startDate:daysAgo(30),endDate:daysAgo(20)})];
V.dash();
ok('期間外の会は「本日の測定会」に出ない',!has(__els['main-ct'].innerHTML,'本日の測定会'));

pushView=__pvOrig;
print('--- レビュー修正: 再統合（既に項目制の会）は at/ex/submitted を引き継ぎ項目を変えない・Undo は統合後の入力を残す・種別も戻す ---');
pushView=function(t,h,fn){__pv.push({t:t,h:h});if(fn)fn();};
(function(){
  var SI=Object.assign({},SESS,{items:['squat','bench']});
  D.msess=[OTHER,SI];
  D.p.push({id:9,name:'再統合',position:'PR'});
  var merged={id:PID(20),pid:9,date:S0,msessId:'m2',squat:null,bench:100,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{bench:daysAgo(2)},by:{bench:'staff'},ex:{squat:'膝'},submitted:true,submittedAt:'2026-09-12T00:00:00.000Z',submittedBy:'staff',inputAt:'2026-09-12T10:00:00.000Z'};
  var stray={id:1757000000001,pid:9,date:S1,msessId:'m2',squat:null,bench:null,deadlift:180,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-13T10:00:00.000Z'};
  D.ph=[merged,stray];__store['ph']=J(D.ph);__store['msess']=J(D.msess);
  var plan=msessConsolidatePlan(D.ph,SI,{'9':950});
  var r=plan.rows[0].rec;
  ok('再統合: BP の測定日は at[bench]（記録の date ではない）・DL は迷子から・ex.squat と submitted を維持',r.at.bench===daysAgo(2)&&r.deadlift===180&&r.at.deadlift===S1&&r.ex.squat==='膝'&&r.submitted===true&&r.submittedBy==='staff'&&r.id===950);
  ok('迷子に値のある項目の免除は外れる',(function(){var s2={id:1757000000002,pid:9,date:S1,msessId:'m2',squat:130,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-13T11:00:00.000Z'};var p=msessConsolidatePlan([merged,stray,s2],SI,{'9':950});var rr=p.rows[0].rec;return rr.squat===130&&!('ex' in rr)&&rr.submitted===true;})());
  ok('項目ごとの日付で後の値を採る（統合済みの at が迷子の date より後なら統合済みの値・迷子の値は不採用に）',(function(){var m2=JSON.parse(J(merged));m2.at.bench=S1;var s3={id:1757000000003,pid:9,date:daysAgo(3),msessId:'m2',squat:null,bench:95,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-13T12:00:00.000Z'};var p=msessConsolidatePlan([m2,s3],SI,{'9':950});var rr=p.rows[0];return rr.rec.bench===100&&rr.rec.at.bench===S1&&rr.conflicts.length===1&&rr.conflicts[0].dropped[0].val===95&&rr.conflicts[0].dropped[0].at===daysAgo(3);})());
  ok('項目制の会は msessId 無しの期間内記録を統合対象にしない',(function(){var f={id:1757000000004,pid:9,date:S1,msessId:null,squat:null,bench:null,deadlift:null,chinning:50,clean:null,bronco:null,downbronco:null,inputAt:'2026-09-13T13:00:00.000Z'};var p=msessConsolidatePlan([merged,stray,f],SI,{'9':950});return p.nRecs===2&&!p.rows[0].rec.chinning;})());
  __pv.length=0;goMSessConvert('m2');
  var ch=__pv[0].h;
  ok('goMSessConvert(項目制): 項目は disabled で会の項目のまま・種別セレクト無し・「記録を統合する」',has(ch,'id="msc-it-squat" checked disabled')&&has(ch,'id="msc-it-bench" checked disabled')&&!has(ch,'id="msc-it-deadlift" checked')&&!has(ch,'id="msc-type"')&&has(ch,'記録を統合する')&&has(ch,'項目と種別は変わりません'));
  var b=mkEl();__toasts.length=0;__pv.length=0;doMSessConvert('m2',b);drain();
  var ph2=JSON.parse(__store['ph']),ms2=JSON.parse(__store['msess']);
  ok('実行: 記録が1件に・items/mtype は不変・トースト「記録を統合しました（2件 → 1名）」',ph2.filter(function(x){return x.pid===9;}).length===1&&J(ms2[1].items)==='["squat","bench"]'&&ms2[1].mtype==='phys'&&has(__toasts[0].m,'記録を統合しました')&&has(__toasts[0].m,'2件 → 1名')&&b.disabled===false);
  // 統合後に入力があった選手は Undo で戻さない
  var mg=ph2.filter(function(x){return x.pid===9;})[0];mg.bench=105;mg.inputAt='2026-09-14T00:00:00.000Z';__store['ph']=J(ph2);D.ph=ph2;
  __toasts[0].f();drain();
  var ph3=JSON.parse(__store['ph']);
  ok('Undo: 統合後に書き込みがあった選手は戻さない（1件のまま・BP 105）・items は残る・トーストに人数',ph3.filter(function(x){return x.pid===9;}).length===1&&ph3.filter(function(x){return x.pid===9;})[0].bench===105&&J(JSON.parse(__store['msess'])[1].items)==='["squat","bench"]'&&has(__toasts[__toasts.length-1].m,'1名は戻していません'));
  // 種別を変えて特設ページ化 → Undo で種別も items も元に戻る
  D.msess=[OTHER,Object.assign({},SESS)];D.ph=base();__store['ph']=J(D.ph);__store['msess']=J(D.msess);
  __pv.length=0;goMSessConvert('m2');setChecks('msc',['bronco']);document.getElementById('msc-type').value='bronco';
  __toasts.length=0;doMSessConvert('m2',mkEl());drain();
  ok('種別 bronco・items=[BR] で特設ページ化',JSON.parse(__store['msess'])[1].mtype==='bronco'&&J(JSON.parse(__store['msess'])[1].items)==='["bronco"]');
  __toasts[0].f();drain();
  ok('Undo で種別 phys・items 無しに戻る',JSON.parse(__store['msess'])[1].mtype==='phys'&&!('items' in JSON.parse(__store['msess'])[1]));
  D.p.pop();
})();
print('--- レビュー修正: 種別と項目の整合（作成/編集）・締切済みの会に特設ページ化を出さない ---');
(function(){
  D.msess=[OTHER,Object.assign({},SESS)];__store['msess']=J(D.msess);D.ph=base();__store['ph']=J(D.ph);
  __pv.length=0;goAddMSess();
  ok('作成フォーム: 種別セレクトに msTypeSync',has(__pv[0].h,"msTypeSync('ms')"));
  document.getElementById('ms-name').value='ブロンコ会';document.getElementById('ms-start').value=daysAgo(0);document.getElementById('ms-end').value=daysAgo(-1);document.getElementById('ms-type').value='bronco';
  setChecks('ms',['squat','bench','deadlift']);
  msTypeSync('ms');
  ok('msTypeSync: 種別ブロンコに合わない選択（SQ/BP/DL）は BR だけに置き換わる',J(msItemsRead('ms'))==='["bronco"]');
  setChecks('ms',['squat']);__alerts.length=0;var n0=JSON.parse(__store['msess']).length;doAddMSess();drain();
  ok('ブロンコ会に time 項目が無ければ alert・保存しない',__alerts.length===1&&has(__alerts[0],'ブロンコ')&&JSON.parse(__store['msess']).length===n0);
  document.getElementById('ms-type').value='phys';setChecks('ms',['bronco']);__alerts.length=0;doAddMSess();drain();
  ok('フィジカル会に kg 項目が無ければ alert',__alerts.length===1&&has(__alerts[0],'kg'));
  setChecks('ms',[]);__alerts.length=0;doAddMSess();drain();
  ok('項目なし（従来の会）は種別に関係なく作成できる',__alerts.length===0&&JSON.parse(__store['msess']).length===n0+1);
  ok('msItemsFit',msItemsFit(['squat','bronco'],'bronco')&&msItemsFit(['squat','bronco'],'phys')&&!msItemsFit(['squat'],'bronco')&&!msItemsFit(['bronco'],'phys')&&msItemsFit([],'bronco'));
  D.msess=[Object.assign({},OTHER,{closed:true}),Object.assign({},SESS,{closed:true})];__store['msess']=J(D.msess);
  __pv.length=0;goMSessDetail('m2');
  ok('締切済みの会（記録あり・非項目制）には「特設ページ化」を出さない',!has(__pv[0].h,"goMSessConvert('m2')"));
  D.msess=[OTHER,Object.assign({},SESS)];__store['msess']=J(D.msess);
})();
if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('msess_convert tests failed');}
print('ALL MSESS-CONVERT TESTS PASSED');
