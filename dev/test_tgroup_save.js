// ウエイトグループ分けv2 フェーズ5: 保存履歴・保存の取り消し・お知らせ・履歴の読み込み（staff）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_save.js
// 仕様（dev/audit/PLAN_tgroup_v2.md #13/#14）:
//  - tgroupは直近5件の履歴（末尾=最新＝選手に公開）。保存直後のトーストで取り消し（今回の記録とお知らせを削除）
//  - 「お知らせも投稿する」既定ON→annへチーム宛て（targetPid:null）。OFFなら投稿しない（再描画してもOFFを保持）
//  - 保存失敗はalert＋ボタン復帰（編成は画面に残る）。updateFnが再実行されても同じ記録は1件
//  - 保存履歴: 新しい順・公開中は最新だけ・「読み込む」「引き継いで組み直す」（人数/FW/BK/除外/ピンを引き継ぐ）・Undo
//  - 保存済み編成の読み込み時、編成に居ない対象選手は申告どおりの組の未配置へ（画面から消えない）
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
pushView=function(){};popView=function(){};
var __toasts=[];toast=function(m,label,fn){__toasts.push({m:String(m),label:label,fn:fn});};
drain();
function main(){return __els['main-ct'].innerHTML;}
function ids(groups){return groups.map(function(g){return g.join(',');}).join(' | ');}
function sortedJoin(a){return a.slice().sort(function(x,y){return x-y;}).join(',');}
function tl(id,pid,bp,sq,dl){
  return {id:id,pid:pid,menuId:1,date:daysAgo(2),ts:'2026-09-01T10:00:00.000Z',results:[
    {exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:bp,reps:3}]},{exName:'スクワット(スピード)',sets:[{weight:sq,reps:3}]},{exName:'デットリフト(スピード)',sets:[{weight:dl,reps:2}]}]};
}
var AM3={v:2,days:{mon:'am',tue:'am',thu:'am'}},PM3={v:2,days:{mon:'pm',tue:'pm',thu:'pm'}};
D.p=[
  {id:1,name:'F1',position:'PR',wg:AM3},{id:2,name:'F2',position:'HO',wg:AM3},{id:3,name:'F3',position:'LO',wg:{v:2,days:{mon:'am',tue:'am',thu:'pm'}}},
  {id:4,name:'F4',position:'FL',wg:PM3},{id:5,name:'F5',position:'PR',wg:PM3},
  {id:6,name:'B6',position:'SH',wg:AM3},{id:7,name:'B7',position:'SO',wg:PM3},{id:8,name:'B8',position:'CTB',wg:AM3},{id:9,name:'B9',position:'WTB',wg:PM3}
];
D.i=[];D.e1rm=[];D.tmenu=[];D.tgroup=[];D.ann=[];D.ph=[];
D.tlog=[tl('l1',1,120,180,220),tl('l2',2,118,175,215),tl('l3',3,100,150,190),tl('l4',4,100,150,190),tl('l5',5,98,148,185),
        tl('l6',6,90,130,160),tl('l7',7,88,128,158),tl('l9',9,70,100,130)];
_tlogArch=[];_tlogArchLoaded=true;_tlaCbs=null;_tlaCache=null;
curPage='tgroup';viewStack=[];
function fresh(){window._tgState=undefined;D.tgroup=[];tgInit(true);tgGenerate();__toasts.length=0;return window._tgState;}

// ============ A. 保存（お知らせ既定ON）→取り消し ============
print('--- 保存: 履歴に追加・お知らせ投稿・トースト ---');
var st=fresh();
__store['tgroup']=JSON.stringify([]);__store['ann']=JSON.stringify([{id:1,date:'2026-09-01',text:'既存',targetPid:null}]);
window._tgAnnOff=undefined;
var btn=mkEl();
tgSave(btn);drain();
var tg=JSON.parse(__store['tgroup']),an=JSON.parse(__store['ann']);
ok('tgroupに1件保存（v2フィールド）',tg.length===1&&tg[0].size===3&&tg[0].splitUnit===true&&Array.isArray(tg[0].pinned));
ok('お知らせ既定ON: annにチーム宛て1件',an.length===2&&an[1].targetPid===null&&has(an[1].text,'ウエイトグループが更新されました')&&an[1].date===todayStr());
ok('ボタンは処理後に復帰',btn.disabled===false&&btn.dataset.busy==='');
var tS=__toasts.filter(function(t){return t.label==='元に戻す';})[0];
ok('保存トースト（お知らせ投稿つき・元に戻す）',!!tS&&has(tS.m,'保存しました')&&has(tS.m,'お知らせを投稿'));
ok('D.tgroup/D.annにも反映',D.tgroup.length===1&&D.ann.length===2);
ok('保存後も画面は編集中の編成',has(main(),'現在の保存済み編成')&&has(main(),'組み直す'));
print('--- 保存の取り消し ---');
tS.fn();drain();
ok('取り消し: 今回の記録とお知らせだけ削除',JSON.parse(__store['tgroup']).length===0&&JSON.parse(__store['ann']).length===1&&JSON.parse(__store['ann'])[0].text==='既存');
ok('取り消しトースト',__toasts.some(function(t){return has(t.m,'取り消しました');}));
ok('編集中の編成は残る',window._tgState.generated===true);

// ============ B. お知らせOFF ============
print('--- お知らせOFF ---');
__toasts.length=0;window._tgAnnOff=true;
tgSave();drain();
ok('annは増えない・tgroupは保存',JSON.parse(__store['ann']).length===1&&JSON.parse(__store['tgroup']).length===1);
ok('トーストにお知らせの文言なし',__toasts.length===1&&!has(__toasts[0].m,'お知らせ'));
V.tgroup();
ok('再描画してもOFFのまま（チェックなし）',has(main(),'id="tg-ann"')&&!has(main(),'id="tg-ann" checked'));
window._tgAnnOff=undefined;V.tgroup();
ok('既定はON（チェックあり）・保存ボタンはtgSave(this)',has(main(),'id="tg-ann" checked')&&has(main(),'tgSave(this)'));

// ============ C. 履歴は最大5件 ============
print('--- 履歴は最大5件（末尾=最新） ---');
var old=[];
for(var i=0;i<5;i++)old.push({id:1000+i,ts:1000+i,date:'2026-08-0'+(i+1),by:'staff',mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],
  shifts:[{key:'am',label:'午前',groups:[[1]],guests:[]},{key:'pm',label:'午後',groups:[[4]],guests:[]}]});
__store['tgroup']=JSON.stringify(old);window._tgAnnOff=true;
tgSave();drain();
var h5=JSON.parse(__store['tgroup']);
ok('最古(1000)を落として末尾に最新',h5.length===5&&h5[0].id===1001&&h5[3].id===1004&&h5[4].id!==1004&&h5[4].date===todayStr());

// ============ D. updateFnの再実行・保存失敗 ============
print('--- updateFnの再実行で重複しない／保存失敗はalert＋ボタン復帰 ---');
var __origSSU=svSafeUpdate;
svSafeUpdate=function(k,fn,okCb,errCb){var cur=JSON.parse(__store[k]||'[]');var r2=fn(fn(cur));__store[k]=JSON.stringify(r2);D[k]=r2;if(okCb)okCb();};
__store['tgroup']=JSON.stringify([]);
tgSave();
ok('同じ記録が2回適用されても1件',JSON.parse(__store['tgroup']).length===1);
svSafeUpdate=function(k,fn,okCb,errCb){if(errCb)errCb(new Error('offline'));};
__alerts.length=0;var btn2=mkEl();
tgSave(btn2);
ok('保存失敗: alert＋ボタン復帰',__alerts.length===1&&has(__alerts[0],'保存できませんでした')&&btn2.disabled===false);
svSafeUpdate=__origSSU;

// ============ E. 保存履歴カード ============
print('--- 保存履歴カード ---');
D.tgroup=old.slice();window._tgSavedOpen=undefined;
var card=tgSavedCardHtml();
ok('見出し・件数',has(card,'保存履歴（最大5件）')&&has(card,'履歴5件'));
ok('新しい順（8/5が8/4より上）・公開中は最新だけ',card.indexOf(fmt('2026-08-04'))>card.indexOf('保存履歴')&&card.lastIndexOf(fmt('2026-08-05'))<card.indexOf(fmt('2026-08-04'))&&card.split('>公開中<').length-1===1);
ok('各履歴に「読み込む」「引き継いで組み直す」',has(card,"tgLoadRecord('1004',false)")&&has(card,"tgLoadRecord('1000',true)"));

// ============ F. 読み込む（そのまま） ============
print('--- 読み込む: その編成をそのまま・居ない選手は未配置・元に戻す ---');
var before=fresh();
D.tgroup=old.slice();__toasts.length=0;
tgLoadRecord('1000',false);
st=window._tgState;
ok('その編成（AM[1]・PM[4]）がそのまま編集画面に',ids(st.shifts[0].groups)==='1'&&ids(st.shifts[1].groups)==='4'&&st.generated===true);
ok('編成に居ない対象選手は申告どおりの組の未配置（AM:2,3,6,8／PM:5,7,9）',sortedJoin(st.shifts[0].pool)==='2,3,6,8'&&sortedJoin(st.shifts[1].pool)==='5,7,9');
var tL=__toasts.filter(function(t){return t.label==='元に戻す';})[0];
ok('読み込みはトーストで元に戻せる',!!tL&&has(tL.m,'読み込みました'));
tL.fn();
ok('元に戻す→読み込み前の編集状態',ids(window._tgState.shifts[0].groups)===ids(before.shifts[0].groups)&&window._tgState.shifts[0].pool.join()===before.shifts[0].pool.join());

// ============ G. 引き継いで組み直す ============
print('--- 引き継いで組み直す: 人数・FW/BK・除外・ピンを引き継ぐ ---');
var withPin={id:2000,ts:2000,date:'2026-08-20',by:'staff',mode:'ampm',size:2,splitUnit:true,excluded:[9],pinned:[1,3],
  shifts:[{key:'am',label:'午前',groups:[[1,3],[2]],guests:[]},{key:'pm',label:'午後',groups:[[4,5]],guests:[]}]};
D.tgroup=[withPin];__toasts.length=0;
tgLoadRecord('2000',true);
st=window._tgState;
ok('人数2・FW/BK分離・除外[9]を引き継いで生成',st.size===2&&st.splitUnit===true&&st.excluded.join()==='9'&&st.generated===true);
ok('ピン[1,3]は同じ班のまま',st.shifts[0].groups.some(function(g){return g.indexOf(1)>=0&&g.indexOf(3)>=0;}));
ok('除外9はどこにも居ない',[].concat.apply([],st.shifts[0].groups.concat(st.shifts[1].groups)).concat(st.shifts[0].pool,st.shifts[1].pool).indexOf(9)<0);
ok('記録の無い8はAMの未配置',st.shifts[0].pool.indexOf(8)>=0);
ok('組み直しのトースト（元に戻せる）',__toasts.some(function(t){return t.label==='元に戻す'&&has(t.m,'組み直しました');}));

// ============ H. 初回表示の読み込みでも未配置を補う ============
print('--- 初回表示（tgInit）でも居ない選手は未配置へ ---');
D.tgroup=[old[0]];window._tgState=undefined;
tgInit(false);
ok('AM未配置4名・PM未配置3名',window._tgState.shifts[0].pool.length===4&&window._tgState.shifts[1].pool.length===3);

// ============ I. 別ページへ移動した後の取り消しは画面を書き換えない ============
print('--- 取り消しの再描画ガード ---');
curPage='dash';__els['main-ct'].innerHTML='DASH';
__store['tgroup']=JSON.stringify([old[0]]);
tgUndoSave(1000,null);drain();
ok('記録は削除・画面はダッシュボードのまま',JSON.parse(__store['tgroup']).length===0&&__els['main-ct'].innerHTML==='DASH');
curPage='tgroup';

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_save tests failed');}
print('\nALL TGROUP-SAVE TESTS PASSED');
