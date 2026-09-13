// Phase 7 (staff側): グループ分け（午前/午後シフト → 班）。v2（1セット重量が近い班・曜日別申告）で更新
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup.js
// 仕様（プランPhase 7節＋dev/audit/PLAN_tgroup_v2.md）:
//  - getLatestE1RM移植（推定重量ヒントでも使用）
//  - 状態: tgInit(size/splitUnit/pinned/guests)・tgSetMode/tgToggleExcludeは前回の班を残して未生成に戻す
//  - tgGenerate→tgSave=履歴に追加（v2フィールド込み・詳細はtest_tgroup_save.js）/ 2タップ入替 / 未配置の手動配置=自動ピン
//  - 代理編集goEditWg/doSaveWg（曜日別3択・wgのみ更新）/ 申告一覧・保存済み編成カード
//  ※アルゴリズム本体の詳細はdev/test_tgroup_algo.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
pushView=function(){};popView=function(){};toast=function(){};confirm=function(){return true;};
function tl(id,pid,bp,sq,dl){
  var r=[];
  if(bp!=null)r.push({exName:'ベンチプレス',estBase:'bench',sets:[{weight:bp,reps:3}]});
  if(sq!=null)r.push({exName:'スクワット',sets:[{weight:sq,reps:3}]});
  if(dl!=null)r.push({exName:'デッドリフト',sets:[{weight:dl,reps:2}]});
  return {id:id,pid:pid,menuId:1,date:todayStr(),ts:'2026-09-01T10:00:00.000Z',results:r};
}

// ============ 0. SK/D ============
print('--- SK/D: tgroup ---');
ok('SKにtgroup',SK.tgroup==='rm_tgroup');
ok('D.tgroup配列',Array.isArray(D.tgroup));

// 共通データ
D.p=[];D.i=[];D.ph=[];D.e1rm=[];D.tgroup=[];D.tlog=[];
_tlogArch=[];_tlogArchLoaded=true;_tlaCbs=null;_tlaCache=null;

// ============ 1. getLatestE1RM ============
print('--- getLatestE1RM ---');
D.e1rm=[
  {pid:1,date:'2026-06-01',values:{squat:{e1rm:100},bench:{e1rm:70},deadlift:{e1rm:120}}},
  {pid:1,date:'2026-07-01',values:{squat:{e1rm:150},bench:{e1rm:100},deadlift:{e1rm:180}}}
];
var e1=getLatestE1RM(1);
ok('最新日付を採用(squat=150)',e1.squat&&e1.squat.e1rm===150);
ok('全種目取得',e1.bench.e1rm===100&&e1.deadlift.e1rm===180);
ok('未登録選手は空オブジェクト',Object.keys(getLatestE1RM(999)).length===0);
D.e1rm=[];

// ============ 2. 状態: tgInit/tgSetMode/tgToggleExclude ============
print('--- tgInit/tgSetMode/tgToggleExclude ---');
window._tgState=undefined;
D.tgroup=[];
D.p=[{id:31,name:'p1',position:'PR'},{id:32,name:'p2',position:'LO'},{id:33,name:'p3',position:'SH'}];
D.i=[{id:1,pid:32,resolved:false}]; // p2は未解決怪我
tgInit(true);
ok('初期: ampm・班サイズ3・FW/BK分離ON・ピン空',window._tgState.mode==='ampm'&&window._tgState.size===3&&window._tgState.splitUnit===true&&window._tgState.pinned.length===0);
ok('未解決怪我(32)は既定で除外',window._tgState.excluded.indexOf(32)>=0);
ok('健常者は除外されない',window._tgState.excluded.indexOf(31)<0);
window._tgState.shifts=[{key:'am',label:'午前',groups:[[31]],pool:[],guests:[]}];window._tgState.generated=true;
tgSetMode('single');
ok('モード切替でsingle・未生成に戻る',window._tgState.mode==='single'&&window._tgState.generated===false);
ok('モード切替でも前回の班は残す（ピンの核に使う）',window._tgState.shifts.length===1);
tgToggleExclude(31);
ok('手動除外追加(31)',window._tgState.excluded.indexOf(31)>=0);
tgToggleExclude(32);
ok('怪我者の除外解除(32)',window._tgState.excluded.indexOf(32)<0);

// tgInitはsaved記録から復元（v2フィールド込み）
window._tgState=undefined;
D.tgroup=[{id:9,ts:9,date:'2026-07-01',by:'staff',mode:'single',size:4,splitUnit:false,excluded:[99],pinned:[31],shifts:[{key:'all',label:'',groups:[[31,32],[33]],guests:[]}]}];
tgInit(true);
ok('saved記録からmode/size/splitUnit/pinned復元',window._tgState.mode==='single'&&window._tgState.size===4&&window._tgState.splitUnit===false&&window._tgState.pinned[0]===31);
ok('saved記録からgroups復元',window._tgState.shifts[0].groups.length===2&&window._tgState.generated===true);
window._tgState=undefined;
D.tgroup=[{id:8,ts:8,date:'2026-06-01',by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[31]]}]}];
tgInit(true);
ok('旧記録(size等なし)は既定値で補う',window._tgState.size===3&&window._tgState.splitUnit===true&&window._tgState.pinned.length===0&&Array.isArray(window._tgState.shifts[0].guests));

// ============ 3. tgGenerate + tgSave ============
print('--- tgGenerate + tgSave（履歴に追加・v2フィールド） ---');
window._tgState=undefined;
D.tgroup=[];D.i=[];D.ph=[];D.p=[];D.tlog=[];
for(var i=0;i<8;i++){D.p.push({id:100+i,name:'選手'+i,position:'PR'});D.tlog.push(tl('t'+i,100+i,150-i*3,200-i*5,250-i*4));}
tgInit(true);
window._tgState.mode='ampm';
tgGenerate();
var st=window._tgState;
ok('生成済みフラグ',st.generated===true);
ok('ampm=2シフト',st.shifts.length===2);
var totalAssigned=0;st.shifts.forEach(function(sh){sh.groups.forEach(function(g){totalAssigned+=g.length;});});
ok('全8名が班に配置（記録ありなのでプールなし）',totalAssigned===8&&st.shifts.every(function(sh){return sh.pool.length===0;}));
__store['tgroup']=JSON.stringify([]);window._tgAnnOff=true;
tgSave();drain();
var saved=JSON.parse(__store['tgroup']);
ok('tgroupに1件保存',saved.length===1);
ok('保存レコードにmode/shifts/excluded/size/splitUnit/pinned',saved[0].mode==='ampm'&&Array.isArray(saved[0].shifts)&&Array.isArray(saved[0].excluded)&&saved[0].size===3&&saved[0].splitUnit===true&&Array.isArray(saved[0].pinned));
ok('保存レコードにby=staff/date',saved[0].by==='staff'&&typeof saved[0].date==='string');
ok('shiftsはkey/label/groups/guests（poolは保存しない）',saved[0].shifts[0].key!==undefined&&saved[0].shifts[0].groups!==undefined&&Array.isArray(saved[0].shifts[0].guests)&&saved[0].shifts[0].pool===undefined);
tgSave();drain();
ok('再保存で履歴に追加（末尾=最新・詳細はtest_tgroup_save.js）',JSON.parse(__store['tgroup']).length===2);

// ============ 4. tgChipTap 入替 ============
print('--- tgChipTap 入替（同シフト内 / シフト跨ぎ手動バッジ） ---');
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'am',label:'午前',groups:[[1,2,3]],pool:[],guests:[]},
  {key:'pm',label:'午後',groups:[[4,5,6]],pool:[],guests:[]}
]};
tgChipTap(0,0,0);
ok('1回目タップで選択',window._tgState.sel&&window._tgState.sel.si===0&&window._tgState.sel.sli===0);
tgChipTap(0,0,2);
ok('入替後 group[0]=[3,2,1]',window._tgState.shifts[0].groups[0][0]===3&&window._tgState.shifts[0].groups[0][2]===1);
ok('入替後selクリア',window._tgState.sel===null);
tgChipTap(0,0,0);tgChipTap(0,0,0);
ok('同一チップ再タップで解除',window._tgState.sel===null);
tgChipTap(0,0,0);
tgChipTap(1,0,0);
ok('シフト跨ぎ入替: am先頭が4',window._tgState.shifts[0].groups[0][0]===4);
ok('シフト跨ぎ入替: pm先頭が3',window._tgState.shifts[1].groups[0][0]===3);
ok('跨ぎ入替した2名は手動バッジ',window._tgState._reason[3]==='手動'&&window._tgState._reason[4]==='手動');

// ============ 5. 未配置の手動配置（タップで選択→「ここへ」） ============
print('--- 未配置→班へ（自動ピン） ---');
window._tgState={mode:'single',size:3,splitUnit:true,excluded:[],pinned:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'all',label:'',groups:[[1,2,3],[4,5]],pool:[99],guests:[]}
]};
tgPoolTap(0,0);
ok('未配置をタップで選択',window._tgState.sel&&window._tgState.sel.k==='p'&&window._tgState.sel.pi===0);
tgMoveTo(0,1);
ok('未配置99が選んだ班([4,5])へ',window._tgState.shifts[0].groups[1].indexOf(99)>=0);
ok('poolから除去・選択解除',window._tgState.shifts[0].pool.length===0&&window._tgState.sel===null);
ok('手動配置した99は自動でピン留め',window._tgState.pinned.indexOf(99)>=0);

// ============ 6. goEditWg/doSaveWg 代理編集（v2: 曜日別3択） ============
print('--- goEditWg: 旧形式のプリフィル＋注意 ---');
D.p=[{id:201,name:'代理対象',position:'PR',year:2,height:'180',wg:{f5:['thu'],far:true,pref:null,upd:'2026-07-01T00:00:00.000Z'}},{id:202,name:'他',position:'LO',year:3}];
__store['p']=JSON.stringify(D.p);
var __pvH='',__pvOrig=pushView;pushView=function(t,h){__pvH=h;};
goEditWg(201);
pushView=__pvOrig;
ok('代理編集: 曜日別3択(ewg-*)',has(__pvH,'id="ewg-mon-am"')&&has(__pvH,'id="ewg-thu-any"')&&has(__pvH,'>午後のみ<'));
ok('代理編集: 旧形式の木5限→午前のみ・他→どちらでもを初期選択',has(__pvH,'id="ewg-thu-am" aria-pressed="true"')&&has(__pvH,'id="ewg-mon-any" aria-pressed="true"'));
ok('代理編集: 旧形式の注意',has(__pvH,'旧形式'));
ok('代理編集: 遠方checked・保存ボタンdoSaveWg(id,this)',has(__pvH,'id="ewg-far" checked')&&has(__pvH,'doSaveWg(201,this)'));
print('--- doSaveWg: 未選択ガード→v2保存（wgのみ更新） ---');
['mon','tue','thu'].forEach(function(k){document.getElementById('ewg-'+k).value='';});
wgSegPick('ewg','mon','pm');wgSegPick('ewg','thu','am');
__alerts.length=0;
doSaveWg(201);drain();
ok('未選択(火)→alert・保存しない（旧形式のまま）',__alerts.length===1&&has(__alerts[0],'火')&&Array.isArray(JSON.parse(__store['p'])[0].wg.f5));
wgSegPick('ewg','tue','any');
document.getElementById('ewg-far').checked=true;
document.getElementById('ewg-pref').value='pm';
__alerts.length=0;
doSaveWg(201,mkEl());drain();
var pS=JSON.parse(__store['p']);
var t=pS.find(function(x){return x.id===201;});
ok('wg v2保存(月pm/火""/木am)',t.wg&&t.wg.v===2&&t.wg.days.mon==='pm'&&t.wg.days.tue===''&&t.wg.days.thu==='am');
ok('旧f5は消える',!('f5' in t.wg));
ok('far=true',t.wg.far===true);
ok('pref=pm',t.wg.pref==='pm');
ok('他フィールド不変',t.name==='代理対象'&&t.position==='PR'&&t.height==='180');
ok('別選手にwg付かない',!pS.find(function(x){return x.id===202;}).wg);
ok('保存フローでalertなし',__alerts.length===0);

print('--- tgWgBadges: 曜日別チップ・旧形式バッジ ---');
var bOld=tgWgBadges({wg:{f5:['mon'],far:true,pref:'am'}});
ok('旧形式: 月午前のみ/火どちらでも/遠方/午前希望/旧形式・要更新',has(bOld,'月午前のみ')&&has(bOld,'火どちらでも')&&has(bOld,'遠方')&&has(bOld,'午前希望')&&has(bOld,'旧形式・要更新'));
var bV2=tgWgBadges({wg:{v:2,days:{mon:'pm',tue:'am',thu:''},far:false,pref:null}});
ok('v2: 月午後のみ/火午前のみ/木どちらでも・要更新/遠方/希望なし',has(bV2,'月午後のみ')&&has(bV2,'火午前のみ')&&has(bV2,'木どちらでも')&&!has(bV2,'要更新')&&!has(bV2,'遠方')&&!has(bV2,'希望'));
ok('未回答',has(tgWgBadges({}),'未回答')&&has(tgWgBadges({wg:null}),'未回答'));

// ============ 7. V.tgroup レンダリング smoke ============
print('--- V.tgroup レンダリング ---');
window._tgState=undefined;
D.tgroup=[];D.i=[];D.e1rm=[];D.ph=[];
D.p=[{id:301,name:'甲',position:'PR',year:2,wg:{f5:['mon'],far:false,pref:null,upd:'2026-07-01T00:00:00Z'}},
     {id:302,name:'乙',position:'LO',year:3}];
D.tlog=[tl('v1',301,120,180,220),tl('v2',302,110,null,null)];
V.tgroup();
var out=__els['main-ct'].innerHTML;
ok('モードトグル描画',has(out,'振り分けモード')&&has(out,"tgSetMode('single')"));
ok('申告一覧トグル',has(out,'選手の申告一覧')&&has(out,'tgToggleSurvey()'));
ok('未回答カウント表示',has(out,'未回答'));
ok('自動で組むボタン',has(out,'tgGenerate()'));
ok('説明文: 直近60日の1セット重量・ゲスト',has(out,'直近60日の1セット重量')&&has(out,'ゲスト'));
ok('旧形式の要更新カウント(1名)',has(out,'うち旧形式・要更新')&&has(out,'>1名</span>）'));
_tlogArchLoaded=false;V.tgroup();
ok('アーカイブ読込中の注記',has(__els['main-ct'].innerHTML,'過去60日のトレーニング記録を読み込み中'));
_tlogArchLoaded=true;
print('--- V.tgroup 申告一覧（開）: 未回答→旧形式→v2の順 ---');
var __pFix=D.p;
D.p=[{id:311,name:'あv2',position:'PR',year:2,wg:{v:2,days:{mon:'am',tue:'am',thu:'am'},far:false,pref:null,upd:'2026-09-13T00:00:00Z'}},
     {id:312,name:'い旧',position:'LO',year:3,wg:{f5:['mon'],far:false,pref:null,upd:'2026-07-01T00:00:00Z'}},
     {id:313,name:'う未',position:'SH',year:1}];
window._tgSurveyOpen=true;
V.tgroup();
var sv0=__els['main-ct'].innerHTML;
var iU=sv0.indexOf('う未'),iL=sv0.indexOf('い旧'),iV=sv0.indexOf('あv2');
ok('並び=未回答→旧形式→v2',iU>=0&&iL>iU&&iV>iL);
ok('一覧に曜日別バッジと旧形式バッジ',has(sv0,'月午前のみ')&&has(sv0,'旧形式・要更新'));
ok('代理入力ボタン',has(sv0,'goEditWg(313)'));
window._tgSurveyOpen=false;
D.p=__pFix; // 以降の生成テスト用フィクスチャへ戻す
// 生成後の描画
tgGenerate();
var out2=__els['main-ct'].innerHTML;
ok('生成後: 午前組/午後組の見出し',has(out2,'午前組')||has(out2,'午後組'));
ok('生成後: 班チップ(tgChipTap)',has(out2,'tgChipTap('));
ok('生成後: 保存ボタン(tgSave)',has(out2,'tgSave(this)'));
ok('生成後: チップに1セット重量（記録なしの種目は—）',has(out2,'BP120 SQ180 DL220')&&has(out2,'BP110 SQ— DL—'));

print('--- V.tgroup: ゲスト表示・記録なしプール ---');
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'am',label:'午前',groups:[[301]],pool:[],guests:[{pid:302,day:'thu',gi:0}]},
  {key:'pm',label:'午後',groups:[[302]],pool:[301],guests:[{pid:301,day:'mon',gi:null}]}
]};
V.tgroup();
var gh=__els['main-ct'].innerHTML;
ok('班カードにゲスト（木）と名前・重量',has(gh,'ゲスト（木）')&&has(gh,'乙')&&has(gh,'BP110'));
ok('未配置ゲストの一覧（タップで選択できる）',has(gh,'ゲスト未配置')&&has(gh,'ゲスト（月）')&&has(gh,'tgGuestTap(1,0)'));
ok('未配置の見出し（記録ありの人は「記録なし」内訳に数えない）・タップで選択',has(gh,'未配置 1名')&&!has(gh,'うち記録なし')&&has(gh,'tgPoolTap(1,0)'));
ok('班を追加ボタン・組み直すボタン',has(gh,'tgAddGroup(0)')&&has(gh,'組み直す'));

// ============ 8. 保存済み編成カード（読み取り専用・_tgStateと独立） ============
print('--- V.tgroup 保存済み編成カード ---');
var TD=todayStr();
D.p=[{id:401,name:'班長',position:'PR',year:2},{id:402,name:'副班',position:'LO',year:3},{id:403,name:'三番',position:'HO',year:1}];
D.tgroup=[{id:99,ts:99,date:TD,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[401,402]]},
  {key:'pm',label:'午後',groups:[[403]]}
]}];
window._tgSavedOpen=undefined;window._tgState=undefined;
V.tgroup();
var svc=__els['main-ct'].innerHTML;
ok('保存済み編成カード見出し',has(svc,'現在の保存済み編成'));
ok('選手に公開中バッジ',has(svc,'選手に公開中'));
ok('保存日表示',has(svc,fmt(TD)));
ok('午前組/午後組ラベル',has(svc,'午前組')&&has(svc,'午後組'));
ok('A班表示',has(svc,'A班'));
ok('メンバー名表示',has(svc,'班長')&&has(svc,'副班')&&has(svc,'三番'));

print('--- tgSetMode後も保存済みカードは残る（_tgStateと独立） ---');
tgSetMode('single');
var svc2=__els['main-ct'].innerHTML;
ok('モード変更後も保存済み編成が残る',has(svc2,'現在の保存済み編成')&&has(svc2,'班長'));

print('--- 折りたたみ（既定=開→トグルで閉） ---');
window._tgSavedOpen=undefined;window._tgSurveyOpen=false;
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],shifts:[],generated:false,_reason:{},sel:null};
V.tgroup();
// min-width:118px は保存済みカードの班カード固有マーカー（編集エリアの除外ドロップダウン等と混同しない）
ok('既定は開いて明細表示',has(__els['main-ct'].innerHTML,'min-width:118px'));
tgSavedToggle();
var svc3=__els['main-ct'].innerHTML;
ok('トグルで閉じて明細消える',!has(svc3,'min-width:118px'));
ok('閉じてもヘッダーは残る',has(svc3,'現在の保存済み編成'));

print('--- 保存済みなしのメッセージ ---');
D.tgroup=[];window._tgState=undefined;
V.tgroup();
ok('保存なしメッセージ',has(__els['main-ct'].innerHTML,'保存済みの編成はまだありません'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup tests failed');}
print('\nALL TGROUP TESTS PASSED');
