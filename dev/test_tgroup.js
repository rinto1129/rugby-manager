// Phase 7 (staff側): グループ分け（午前/午後シフト → 班）。v2（1セット重量が近い班・曜日タブ表示・スタッフの曜日指定）で更新
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup.js
// 仕様（プランPhase 7節＋dev/audit/PLAN_tgroup_v2.md＋2026-09-13の仕様変更）:
//  - getLatestE1RM移植（推定重量ヒントでも使用）
//  - 状態: tgInit(size/splitUnit/pinned/guests)・tgSetMode/tgToggleExcludeは前回の班を残して未生成に戻す
//  - tgGenerate→tgSave=履歴に追加（v2フィールド込み・詳細はtest_tgroup_save.js）/ 2タップ入替 / 未配置の手動配置=自動ピン
//  - 申告 p.wg={f5,far,pref,upd}（選手の自己申告）＋ov/ovUpd（スタッフだけの「曜日の指定」）。読みはwgNorm（一時形式v:2も吸収）
//  - 代理編集goEditWg（5限チェックewg-mon/tue/thu・ewg-far・ewg-pref＋曜日の指定wgSegHTML('ewg')）
//    doSaveWg（申告が変わった時だけupd＝今・指定が変わった時だけovUpd＝今・指定が全て自動ならov/ovUpdを書かない）
//  - 申告一覧（見出しの人数・未回答が先・tgWgBadges）／結果と保存済み編成カードは曜日タブ（tgDay/tgSetDay・tgDayShiftsのhere/away）
//  ※アルゴリズム本体の詳細はdev/test_tgroup_algo.js、手動編集はdev/test_tgroup_ui.js、共通ヘルパーはdev/test_tgroup_helpers.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function isoAgo(n){return new Date(Date.now()-n*86400000).toISOString();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
pushView=function(){};popView=function(){};toast=function(){};confirm=function(){return true;};
function main(){return __els['main-ct'].innerHTML;}
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
  {pid:1,date:daysAgo(60),values:{squat:{e1rm:100},bench:{e1rm:70},deadlift:{e1rm:120}}},
  {pid:1,date:daysAgo(30),values:{squat:{e1rm:150},bench:{e1rm:100},deadlift:{e1rm:180}}}
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
D.tgroup=[{id:9,ts:9,date:daysAgo(40),by:'staff',mode:'single',size:4,splitUnit:false,excluded:[99],pinned:[31],shifts:[{key:'all',label:'',groups:[[31,32],[33]],guests:[]}]}];
tgInit(true);
ok('saved記録からmode/size/splitUnit/pinned復元',window._tgState.mode==='single'&&window._tgState.size===4&&window._tgState.splitUnit===false&&window._tgState.pinned[0]===31);
ok('saved記録からgroups復元',window._tgState.shifts[0].groups.length===2&&window._tgState.generated===true);
window._tgState=undefined;
D.tgroup=[{id:8,ts:8,date:daysAgo(70),by:'staff',mode:'ampm',excluded:[],shifts:[{key:'am',label:'午前',groups:[[31]]}]}];
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

print('--- tgSave: gi:null のゲストがある時だけトーストに「班未定」の注記 ---');
var __toasts=[],__toastOrig=toast;toast=function(m,label,fn){__toasts.push({m:String(m),label:label});};
__store['tgroup']=JSON.stringify([]);
tgSave();drain();
ok('ゲスト未配置なし: 保存トーストに「班未定」の注記なし',__toasts.length===1&&has(__toasts[0].m,'グループを保存しました')&&!has(__toasts[0].m,'ゲスト未配置')&&!has(__toasts[0].m,'班未定'));
__toasts.length=0;
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'am',label:'午前',groups:[[100,101],[]],pool:[],guests:[{pid:104,day:'tue',gi:null},{pid:105,day:'thu',gi:0}]},
  {key:'pm',label:'午後',groups:[[104,105]],pool:[],guests:[{pid:100,day:'mon',gi:null}]}
]};
tgSave();drain();
var svU=JSON.parse(__store['tgroup']);svU=svU[svU.length-1];
ok('ゲスト未配置2件（午前1+午後1）: 「。ゲスト未配置2件は選手に「班未定」と表示されます」',__toasts.length===1&&has(__toasts[0].m,'。ゲスト未配置2件は選手に「班未定」と表示されます')&&__toasts[0].label==='元に戻す');
ok('保存レコードの形は変わらない（gi:nullのまま・注記用のフィールドは無い）',svU.shifts[0].guests[0].gi===null&&svU.shifts[0].guests[1].gi===0&&svU.shifts[1].guests[0].gi===null&&Object.keys(svU.shifts[0].guests[0]).sort().join()==='day,gi,pid'&&!('ugN' in svU));
__toasts.length=0;
// 空の班を指すゲストは保存時の詰めでgi:null → 件数に含む
window._tgState.shifts=[
  {key:'am',label:'午前',groups:[[],[100,101]],pool:[],guests:[{pid:104,day:'tue',gi:0},{pid:105,day:'thu',gi:1}]},
  {key:'pm',label:'午後',groups:[[104,105]],pool:[],guests:[]}
];
tgSave();drain();
svU=JSON.parse(__store['tgroup']);svU=svU[svU.length-1];
ok('空の班を指すゲストは保存でgi:null（班indexは詰める）→ 「ゲスト未配置1件」',svU.shifts[0].guests[0].gi===null&&svU.shifts[0].guests[1].gi===0&&__toasts.length===1&&has(__toasts[0].m,'。ゲスト未配置1件は選手に「班未定」と表示されます'));
toast=__toastOrig;

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

// ============ 6. goEditWg/doSaveWg 代理編集（申告＋スタッフの曜日指定） ============
print('--- goEditWg: 申告のプリフィル＋曜日の指定（スタッフ用） ---');
var U0=isoAgo(30),OV0=isoAgo(20);
D.p=[{id:201,name:'代理対象',position:'PR',year:2,height:'180',wg:{f5:['thu'],far:true,pref:null,upd:U0}},
     {id:202,name:'他',position:'LO',year:3},
     {id:203,name:'指定あり',position:'SH',year:1,wg:{f5:['mon'],far:false,pref:'pm',upd:U0,ov:{mon:'',tue:'pm',thu:''},ovUpd:OV0}}];
__store['p']=JSON.stringify(D.p);
var __pvH='',__pvOrig=pushView;pushView=function(t,h){__pvH=h;};
goEditWg(201);
ok('代理編集: 5限の曜日チェック(ewg-mon/tue/thu)・木だけchecked',has(__pvH,'月・火・木で5限がある曜日')&&has(__pvH,'id="ewg-mon"')&&!has(__pvH,'id="ewg-mon" checked')&&!has(__pvH,'id="ewg-tue" checked')&&has(__pvH,'id="ewg-thu" checked'));
ok('代理編集: 遠方checked・希望select（どちらでも選択）',has(__pvH,'id="ewg-far" checked')&&has(__pvH,'id="ewg-pref"')&&has(__pvH,'value="" selected>どちらでも'));
ok('代理編集: 曜日の指定（スタッフ用）= 自動/午前/午後（ewg-曜日-auto|am|pm・指定なしは自動が選択）',has(__pvH,'曜日の指定（スタッフ用）')&&has(__pvH,'id="ewg-mon-auto" aria-pressed="true"')&&has(__pvH,'id="ewg-tue-pm" aria-pressed="false"')&&has(__pvH,'id="ewg-thu-auto" aria-pressed="true"')&&has(__pvH,'>自動<')&&has(__pvH,'>午前<')&&has(__pvH,'>午後<'));
ok('代理編集: 曜日別3択（午前のみ/午後のみ/-any）と旧形式の注意は無い',!has(__pvH,'午前のみ')&&!has(__pvH,'午後のみ')&&!has(__pvH,'-any"')&&!has(__pvH,'旧形式'));
ok('代理編集: 指定の説明（5限より優先・午前の日/午後の日の多い方が基本の組・逆になる曜日だけ逆の組・例）',has(__pvH,'5限の有無より優先')&&has(__pvH,'午前の日・午後の日の多い方が基本の組')&&has(__pvH,'指定も5限も無い曜日は「時間帯の希望」で数える')&&has(__pvH,'指定/5限で逆になる曜日だけ逆の組の班に入ります')&&has(__pvH,'午前がいい＋火曜を午後に指定→基本は午前・火曜だけ午後'));
ok('代理編集: 回答済みなので未回答の注意なし・「回答として記録」チェック(ewg-ans)も無い・保存ボタンdoSaveWg(id,this)',!has(__pvH,'未回答です')&&!has(__pvH,'id="ewg-ans"')&&!has(__pvH,'選手に聞いた回答として記録する')&&has(__pvH,'doSaveWg(201,this)'));
ok('代理編集: 開いた時点の値を_ewgBaseに控える（pid/f5/far/pref/ov）',window._ewgBase&&window._ewgBase.pid===201&&window._ewgBase.f5.join()==='thu'&&window._ewgBase.far===true&&window._ewgBase.pref===null&&window._ewgBase.ov.mon===''&&window._ewgBase.ov.tue===''&&window._ewgBase.ov.thu==='');
function idCount(h,id){return (String(h).match(new RegExp('id="'+id+'"','g'))||[]).length;}
function noDupIds(h){var ids=String(h).match(/id="[^"]+"/g)||[],seen={};return ids.every(function(x){if(seen[x])return false;seen[x]=1;return true;});}
ok('代理編集(回答済): 同じidが2回出ない（5限チェックewg-曜日と指定のhidden ewg-ov-曜日は別ID）',idCount(__pvH,'ewg-mon')===1&&idCount(__pvH,'ewg-tue')===1&&idCount(__pvH,'ewg-thu')===1&&idCount(__pvH,'ewg-ov-mon')===1&&idCount(__pvH,'ewg-ov-tue')===1&&idCount(__pvH,'ewg-ov-thu')===1&&noDupIds(__pvH));
goEditWg(202);
ok('未回答の選手: 注意文（曜日の指定だけなら未回答のまま）・全て未チェック',has(__pvH,'未回答です。選手に聞いた内容を入れて保存すると回答済みになります（曜日の指定だけなら未回答のまま）。')&&!has(__pvH,'id="ewg-thu" checked')&&!has(__pvH,'id="ewg-far" checked')&&has(__pvH,'doSaveWg(202,this)'));
ok('未回答の選手: 「選手に聞いた回答として記録する」チェック(ewg-ans・未チェック)がある',idCount(__pvH,'ewg-ans')===1&&has(__pvH,'<input type="checkbox" id="ewg-ans">')&&has(__pvH,'選手に聞いた回答として記録する'));
ok('代理編集(未回答): 同じidが2回出ない',noDupIds(__pvH));
goEditWg(203);
ok('指定ありの選手: 火=午後が初期選択・hidden(ewg-ov-tue)値pm・月/木は自動（hidden値""）',has(__pvH,'id="ewg-tue-pm" aria-pressed="true"')&&has(__pvH,'id="ewg-ov-tue" value="pm"')&&has(__pvH,'id="ewg-ov-mon" value=""')&&has(__pvH,'id="ewg-ov-thu" value=""')&&has(__pvH,'id="ewg-mon-auto" aria-pressed="true"')&&has(__pvH,'id="ewg-thu-auto" aria-pressed="true"'));
ok('指定ありの選手: 旧ID(hidden id="ewg-tue" value=…)は出ない',!has(__pvH,'id="ewg-tue" value='));
ok('指定ありの選手: 月checked・午後希望selected・回答済みなのでewg-ans無し',has(__pvH,'id="ewg-mon" checked')&&has(__pvH,'value="pm" selected>午後がいい')&&!has(__pvH,'id="ewg-ans"'));
ok('代理編集(指定あり): 同じidが2回出ない',noDupIds(__pvH)&&idCount(__pvH,'ewg-tue')===1&&idCount(__pvH,'ewg-ov-tue')===1);
ok('_ewgBaseは最後に開いた選手(203)・ov.tue=pm',window._ewgBase.pid===203&&window._ewgBase.ov.tue==='pm'&&window._ewgBase.pref==='pm');
pushView=__pvOrig;
// wgSegPick/wgSegRead は hidden「ewg-ov-曜日」を読み書きする（5限チェックボックス「ewg-曜日」には触らない）
document.getElementById('ewg-tue').checked=true;document.getElementById('ewg-tue').value='on';
wgSegPick('ewg','tue','am');
ok('wgSegPick: hidden ewg-ov-tue=am・ボタンaria-pressed更新・5限チェック(ewg-tue)の値/チェックは不変',document.getElementById('ewg-ov-tue').value==='am'&&document.getElementById('ewg-tue-am').style.background==='var(--maroon)'&&document.getElementById('ewg-tue-pm').style.background===''&&document.getElementById('ewg-tue').value==='on'&&document.getElementById('ewg-tue').checked===true);
document.getElementById('ewg-ov-mon').value='bogus';document.getElementById('ewg-ov-thu').value='pm';
var sr=wgSegRead('ewg');
ok('wgSegRead: ewg-ov-曜日を読む（不正値は""）',sr.mon===''&&sr.tue==='am'&&sr.thu==='pm');

// 画面の入力状態を作る（5限チェック=ewg-曜日のchecked／指定=hidden ewg-ov-曜日のvalue（wgSegPick経由）／未回答時のみのewg-ans）
function setEwg(o){
  WG_DAYS.forEach(function(d){var el=document.getElementById('ewg-'+d.k);el.checked=(o.f5||[]).indexOf(d.k)>=0;el.value='on';}); // 実ブラウザのcheckbox既定value='on'（読まれないこと）
  document.getElementById('ewg-far').checked=!!o.far;
  document.getElementById('ewg-pref').value=o.pref||'';
  document.getElementById('ewg-ans').checked=!!o.ans;
  WG_DAYS.forEach(function(d){wgSegPick('ewg',d.k,(o.ov&&o.ov[d.k])||'');});
}
function pRec(id){return JSON.parse(__store['p']).find(function(x){return x.id===id;});}

print('--- doSaveWg: 指定だけ追加（申告そのまま）→ upd不変・ovUpd付与 ---');
setEwg({f5:['thu'],far:true,pref:'',ov:{tue:'pm'}});
__alerts.length=0;
var btn=mkEl();
doSaveWg(201,btn);drain();
var t=pRec(201);
ok('申告(f5/far/pref)は変わらず保存',t.wg&&t.wg.f5.join()==='thu'&&t.wg.far===true&&t.wg.pref===null);
ok('upd=元のまま（申告は未変更）',t.wg.upd===U0);
ok('ov={mon:"",tue:"pm",thu:""}・ovUpdは今のISO',t.wg.ov&&t.wg.ov.mon===''&&t.wg.ov.tue==='pm'&&t.wg.ov.thu===''&&typeof t.wg.ovUpd==='string'&&t.wg.ovUpd>U0);
ok('wgNormで読める（hasOv・days=月""/火pm/木am・answered）',(function(n){return n.hasOv&&n.days.mon===''&&n.days.tue==='pm'&&n.days.thu==='am'&&n.answered;})(wgNorm(t.wg)));
ok('一時形式のキー(v/days)は書かない',!('v' in t.wg)&&!('days' in t.wg));
ok('他フィールド不変',t.name==='代理対象'&&t.position==='PR'&&t.height==='180');
ok('別選手にwg付かない',!pRec(202).wg);
ok('保存フローでalertなし・ボタン解放',__alerts.length===0&&btn.disabled===false);

print('--- doSaveWg: 申告だけ変更（指定そのまま）→ upd更新・ovUpd不変 ---');
D.p=JSON.parse(__store['p']); // onSnapshot相当
var OV1=pRec(201).wg.ovUpd;
setEwg({f5:['mon','thu'],far:true,pref:'pm',ov:{tue:'pm'}});
doSaveWg(201,mkEl());drain();
t=pRec(201);
ok('f5=月・木／pref=pm／far維持',t.wg.f5.join()==='mon,thu'&&t.wg.pref==='pm'&&t.wg.far===true);
ok('upd=今に更新',typeof t.wg.upd==='string'&&t.wg.upd>U0);
ok('ov/ovUpdは不変',t.wg.ov.tue==='pm'&&t.wg.ov.mon===''&&t.wg.ovUpd===OV1);

print('--- doSaveWg: 指定を全て「自動」→ ov/ovUpdキーを書かない ---');
D.p=JSON.parse(__store['p']);
var U1=pRec(201).wg.upd;
setEwg({f5:['mon','thu'],far:true,pref:'pm',ov:{}});
doSaveWg(201,mkEl());drain();
t=pRec(201);
ok('ov/ovUpdキーなし',!('ov' in t.wg)&&!('ovUpd' in t.wg));
ok('申告は不変・updも不変',t.wg.f5.join()==='mon,thu'&&t.wg.pref==='pm'&&t.wg.upd===U1);
ok('wgNorm: hasOv=false・days=5限どおり(月am/火""/木am)',(function(n){return !n.hasOv&&n.days.mon==='am'&&n.days.tue===''&&n.days.thu==='am';})(wgNorm(t.wg)));

print('--- doSaveWg: 未回答の選手に指定だけ → 未回答のまま（upd無し）・指定は保存 ---');
D.p=JSON.parse(__store['p']);
setEwg({f5:[],far:false,pref:'',ov:{mon:'am'}});
doSaveWg(202,mkEl());drain();
t=pRec(202);
ok('wgが付き ov.mon=am・ovUpdあり',t.wg&&t.wg.ov&&t.wg.ov.mon==='am'&&t.wg.ov.tue===''&&typeof t.wg.ovUpd==='string');
ok('updは無し（=未回答のまま・hasOv）',t.wg.upd===null&&!wgNorm(t.wg).answered&&wgNorm(t.wg).hasOv);
ok('申告欄は空のまま',t.wg.f5.length===0&&t.wg.far===false&&t.wg.pref===null);
D.p=JSON.parse(__store['p']);
setEwg({f5:['tue'],far:false,pref:'',ov:{mon:'am'}});
doSaveWg(202,mkEl());drain();
t=pRec(202);
ok('5限を入れて保存→回答済み(upd付与)・指定は維持',typeof t.wg.upd==='string'&&wgNorm(t.wg).answered&&t.wg.f5.join()==='tue'&&t.wg.ov.mon==='am');

print('--- doSaveWg: 一時形式{v:2,days}は保存で標準形に ---');
D.p=JSON.parse(__store['p']);
D.p.push({id:204,name:'一時形式',position:'FB',year:2,wg:{v:2,days:{mon:'am',tue:'pm',thu:''},far:false,pref:null,upd:U0}});
__store['p']=JSON.stringify(D.p);
pushView=function(t,h){__pvH=h;};goEditWg(204);pushView=__pvOrig;
ok('一時形式のプリフィル: 月checked(5限)・火は未チェックで指定=午後',has(__pvH,'id="ewg-mon" checked')&&!has(__pvH,'id="ewg-tue" checked')&&has(__pvH,'id="ewg-tue-pm" aria-pressed="true"')&&!has(__pvH,'未回答です'));
setEwg({f5:['mon'],far:false,pref:'',ov:{tue:'pm'}}); // 画面の初期値どおり＝何も変えずに保存
doSaveWg(204,mkEl());drain();
t=pRec(204);
ok('標準形{f5:[mon],ov:{tue:pm}}になりv/daysは消える',t.wg.f5.join()==='mon'&&t.wg.ov.tue==='pm'&&!('v' in t.wg)&&!('days' in t.wg));
ok('変更なしなのでupd不変・ovUpdはnull(元から無し)',t.wg.upd===U0&&t.wg.ovUpd===null);
ok('wgNorm: 保存前後で同じ実効値（月am/火pm/木""）',(function(n){return n.days.mon==='am'&&n.days.tue==='pm'&&n.days.thu==='';})(wgNorm(t.wg)));

print('--- doSaveWg: 開いている間に選手が別端末で再回答 → スタッフが申告を触らなければ選手の回答が残る ---');
D.p=JSON.parse(__store['p']);
var U2=isoAgo(40);
D.p.push({id:205,name:'再回答',position:'CTB',year:2,wg:{f5:['thu'],far:false,pref:null,upd:U2}});
__store['p']=JSON.stringify(D.p);
pushView=function(t,h){__pvH=h;};goEditWg(205);pushView=__pvOrig;
ok('_ewgBase=205の開いた時点の値',window._ewgBase&&window._ewgBase.pid===205&&window._ewgBase.f5.join()==='thu');
// 選手が別端末で再回答（サーバーだけ更新・D.pはまだ古い＝onSnapshot前）
var UP=new Date(Date.now()-60000).toISOString();
(function(){var arr=JSON.parse(__store['p']);var r=arr.find(function(x){return x.id===205;});r.wg={f5:['mon','tue'],far:true,pref:'am',upd:UP};__store['p']=JSON.stringify(arr);})();
setEwg({f5:['thu'],far:false,pref:'',ov:{tue:'pm'}}); // 申告欄は開いた時のまま・指定だけ火=午後に
document.getElementById('ewg-tok').value=window._ewgBase.tok; // この編集画面が表示中（jscはinnerHTMLを解釈しないので目印を再現）
doSaveWg(205,mkEl());drain();
t=pRec(205);
ok('選手の再回答(f5=月・火/遠方/午前希望/upd)がそのまま残る',t.wg.f5.join()==='mon,tue'&&t.wg.far===true&&t.wg.pref==='am'&&t.wg.upd===UP);
ok('スタッフの指定(火=午後)は保存・ovUpd=今',t.wg.ov&&t.wg.ov.tue==='pm'&&t.wg.ov.mon===''&&t.wg.ov.thu===''&&typeof t.wg.ovUpd==='string'&&t.wg.ovUpd>UP);
ok('保存成功で_ewgBaseをクリア',window._ewgBase===null);
// 逆: 開いている間にサーバーで指定が変わっても、スタッフが指定を触らず申告だけ変えたらサーバーの指定が残る
D.p=JSON.parse(__store['p']);
pushView=function(t,h){__pvH=h;};goEditWg(205);pushView=__pvOrig;
(function(){var arr=JSON.parse(__store['p']);var r=arr.find(function(x){return x.id===205;});r.wg.ov={mon:'am',tue:'pm',thu:''};r.wg.ovUpd=UP;__store['p']=JSON.stringify(arr);})();
setEwg({f5:['mon'],far:true,pref:'am',ov:{tue:'pm'}}); // 5限の火を外しただけ（指定は開いた時のまま）
doSaveWg(205,mkEl());drain();
t=pRec(205);
ok('申告はフォーム値（f5=月）・upd=今',t.wg.f5.join()==='mon'&&typeof t.wg.upd==='string'&&t.wg.upd>UP);
ok('指定はサーバー最新（月am/火pm）・ovUpdもサーバーのまま',t.wg.ov.mon==='am'&&t.wg.ov.tue==='pm'&&t.wg.ovUpd===UP);
// 何も変えずに保存 → サーバー最新をそのまま保つ（開いた後の変更も巻き戻さない）
D.p=JSON.parse(__store['p']);
pushView=function(t,h){__pvH=h;};goEditWg(205);pushView=__pvOrig;
var UP2=new Date(Date.now()-30000).toISOString();
(function(){var arr=JSON.parse(__store['p']);var r=arr.find(function(x){return x.id===205;});r.wg={f5:['thu'],far:false,pref:'pm',upd:UP2};__store['p']=JSON.stringify(arr);})();
setEwg({f5:['mon'],far:true,pref:'am',ov:{mon:'am',tue:'pm'}}); // 開いた時の値のまま
doSaveWg(205,mkEl());drain();
t=pRec(205);
ok('変更なし保存: サーバー最新の申告(f5=木/午後/upd)を保ち、指定はサーバーに無いのでov/ovUpdキーなし',t.wg.f5.join()==='thu'&&t.wg.pref==='pm'&&t.wg.far===false&&t.wg.upd===UP2&&!('ov' in t.wg)&&!('ovUpd' in t.wg));

print('--- doSaveWg: 未回答の選手を「回答として記録」(ewg-ans) → 5限なし・どちらでもでも回答済み ---');
D.p=JSON.parse(__store['p']);
D.p.push({id:206,name:'口頭回答',position:'WTB',year:1});
__store['p']=JSON.stringify(D.p);
pushView=function(t,h){__pvH=h;};goEditWg(206);pushView=__pvOrig;
ok('未回答なのでewg-ansあり',has(__pvH,'id="ewg-ans"'));
setEwg({f5:[],far:false,pref:'',ov:{}}); // チェックOFF・何も変えない
doSaveWg(206,mkEl());drain();
t=pRec(206);
ok('ewg-ans OFF・変更なし → 未回答のまま（upd無し・ovキー無し）',t.wg&&!t.wg.upd&&!wgNorm(t.wg).answered&&!('ov' in t.wg));
D.p=JSON.parse(__store['p']);
pushView=function(t,h){__pvH=h;};goEditWg(206);pushView=__pvOrig;
setEwg({f5:[],far:false,pref:'',ov:{},ans:true});
doSaveWg(206,mkEl());drain();
t=pRec(206);
ok('ewg-ans ON → 回答済み（upd=今・f5=[]・far=false・pref=null）',typeof t.wg.upd==='string'&&wgNorm(t.wg).answered&&t.wg.f5.length===0&&t.wg.far===false&&t.wg.pref===null&&!('ov' in t.wg));
document.getElementById('ewg-ans').checked=false;

print('--- doSaveWg: 二重送信ガード ---');
D.p=JSON.parse(__store['p']);
var busy=mkEl();busy.dataset.busy='1';
var before=__store['p'];
setEwg({f5:['mon','tue','thu'],far:false,pref:'',ov:{}});
doSaveWg(204,busy);drain();
ok('busyボタンでは保存しない',__store['p']===before);

print('--- tgWgBadges: 5限の曜日／遠方／希望／指定（紫）／未回答 ---');
var U=isoAgo(3);
var b1=tgWgBadges({wg:{f5:['tue','thu'],far:true,pref:'am',upd:U}});
ok('5限 火・木／遠方／午前希望',has(b1,'5限 火・木')&&has(b1,'遠方')&&has(b1,'午前希望')&&!has(b1,'未回答')&&!has(b1,'指定'));
var b2=tgWgBadges({wg:{f5:[],far:false,pref:'pm',upd:U}});
ok('5限なし／午後希望・遠方なし',has(b2,'5限なし')&&has(b2,'午後希望')&&!has(b2,'遠方'));
var b3=tgWgBadges({wg:{f5:['mon'],far:false,pref:null,upd:U,ov:{mon:'',tue:'pm',thu:'am'},ovUpd:U}});
ok('指定 火:午後・指定 木:午前（紫）＋5限 月（月は指定なし）',has(b3,'指定 火:午後')&&has(b3,'指定 木:午前')&&has(b3,'var(--purple)')&&has(b3,'5限 月')&&!has(b3,'指定 月'));
var b4=tgWgBadges({wg:{ov:{mon:'am',tue:'',thu:''},ovUpd:U}});
ok('指定だけの未回答: 未回答(赤)＋指定 月:午前',has(b4,'未回答')&&has(b4,'var(--red)')&&has(b4,'指定 月:午前')&&!has(b4,'5限'));
ok('未回答（wg無し/null）',has(tgWgBadges({}),'未回答')&&has(tgWgBadges({wg:null}),'未回答'));
var b5=tgWgBadges({wg:{v:2,days:{mon:'am',tue:'pm',thu:''},far:false,pref:null,upd:U}});
ok('一時形式(v:2): 月am→5限 月・火pm→指定 火:午後',has(b5,'5限 月')&&has(b5,'指定 火:午後')&&!has(b5,'未回答'));
ok('曜日別3択の文言（午前のみ/どちらでも/旧形式）は出ない',[b1,b2,b3,b4,b5].every(function(b){return !has(b,'午前のみ')&&!has(b,'どちらでも')&&!has(b,'旧形式');}));

// ============ 7. V.tgroup レンダリング smoke ============
print('--- V.tgroup レンダリング ---');
window._tgState=undefined;window._tgDay=undefined;
D.tgroup=[];D.i=[];D.e1rm=[];D.ph=[];
D.p=[{id:301,name:'甲',position:'PR',year:2,wg:{f5:['mon'],far:false,pref:null,upd:isoAgo(10)}},
     {id:302,name:'乙',position:'LO',year:3}];
D.tlog=[tl('v1',301,120,180,220),tl('v2',302,110,null,null)];
V.tgroup();
var out=main();
ok('モードトグル描画',has(out,'振り分けモード')&&has(out,"tgSetMode('single')"));
ok('申告一覧トグル',has(out,'選手の申告一覧')&&has(out,'tgToggleSurvey()')&&has(out,'代理入力・曜日の指定'));
ok('見出しの人数: 回答済 1名 / 未回答 1名（赤）・指定なしなら「曜日の指定あり」は出ない',has(out,'回答済 1名')&&has(out,'未回答 <span style="color:var(--red);font-weight:700">1名</span>')&&!has(out,'曜日の指定あり'));
ok('自動で組むボタン',has(out,'tgGenerate()'));
ok('説明文: 直近60日の1セット重量・曜日の指定・曜日タブ',has(out,'直近60日の1セット重量')&&has(out,'曜日の指定')&&has(out,'曜日タブ'));
ok('説明文: 午前の日・午後の日が多い方が基本の組',has(out,'午前の日・午後の日が多い方が基本の組'));
ok('曜日別3択・旧形式の文言は無い',!has(out,'午前のみ')&&!has(out,'旧形式'));
_tlogArchLoaded=false;V.tgroup();
ok('アーカイブ読込中の注記',has(main(),'過去60日のトレーニング記録を読み込み中'));
_tlogArchLoaded=true;

print('--- V.tgroup 申告一覧（開）: 未回答が先・バッジ・見出しの人数 ---');
var __pFix=D.p;
D.p=[{id:311,name:'あ回答',position:'PR',year:2,wg:{f5:['mon','tue'],far:false,pref:null,upd:isoAgo(1)}},
     {id:312,name:'い未回答',position:'LO',year:3},
     {id:313,name:'う指定',position:'SH',year:1,wg:{f5:[],far:true,pref:null,upd:isoAgo(2),ov:{mon:'',tue:'',thu:'pm'},ovUpd:isoAgo(1)}},
     {id:314,name:'え未回答指定',position:'FB',year:1,wg:{ov:{mon:'am',tue:'',thu:''},ovUpd:isoAgo(1)}}];
window._tgSurveyOpen=true;
V.tgroup();
var sv0=main();
ok('見出し: 回答済 2名 / 未回答 2名 / 曜日の指定あり 2名（紫）',has(sv0,'回答済 2名')&&has(sv0,'未回答 <span style="color:var(--red);font-weight:700">2名</span>')&&has(sv0,'曜日の指定あり <span style="color:var(--purple);font-weight:700">2名</span>'));
var iA=sv0.indexOf('あ回答'),iI=sv0.indexOf('い未回答'),iU=sv0.indexOf('う指定'),iE=sv0.indexOf('え未回答指定');
ok('並び=未回答（い→え）が先・回答済（あ→う）が後',iI>=0&&iE>iI&&iA>iE&&iU>iA);
ok('一覧のバッジ: 5限 月・火／5限なし／遠方／指定 木:午後／指定 月:午前／未回答',has(sv0,'5限 月・火')&&has(sv0,'5限なし')&&has(sv0,'遠方')&&has(sv0,'指定 木:午後')&&has(sv0,'指定 月:午前')&&has(sv0,'>未回答</span>'));
ok('説明: 選手は5限・遠方・希望だけ／曜日の指定は「編集」で（5限より優先）・午前のみ等の文言なし',has(sv0,'「編集」で曜日を指定')&&has(sv0,'5限より優先')&&!has(sv0,'午前のみ')&&!has(sv0,'旧形式'));
ok('編集ボタン goEditWg(id)',has(sv0,'goEditWg(312)')&&has(sv0,'goEditWg(314)')&&has(sv0,' 編集</button>'));
window._tgSurveyOpen=false;
D.p=__pFix; // 以降の生成テスト用フィクスチャへ戻す
// 生成後の描画（曜日タブ付き）
window._tgDay='mon';
tgGenerate();
var out2=main();
ok('生成後: 午前組/午後組の見出し（曜日付き）',has(out2,'午前組')&&has(out2,'午後組')&&has(out2,'月曜'));
ok('生成後: 曜日タブ（月/火/木・月が選択中）',has(out2,'表示する曜日')&&has(out2,'aria-pressed="true" onclick="tgSetDay(\'mon\')"')&&has(out2,'aria-pressed="false" onclick="tgSetDay(\'tue\')"')&&has(out2,"tgSetDay('thu')"));
ok('生成後: 班チップ(tgChipTap)',has(out2,'tgChipTap('));
ok('生成後: 保存ボタン(tgSave)',has(out2,'tgSave(this)'));
ok('生成後: チップに1セット重量（記録なしの種目は—）',has(out2,'BP120 SQ180 DL220')&&has(out2,'BP110 SQ— DL—'));
ok('生成後: 根拠バッジ（甲=5限・乙=自動）',has(out2,'>5限</span>')&&has(out2,'>自動</span>'));

print('--- V.tgroup: 曜日タブ（here/away・ゲスト「木のみ」・その曜日のゲスト未配置） ---');
D.p=[{id:301,name:'甲',position:'PR',year:2,wg:{f5:['mon'],far:false,pref:null,upd:isoAgo(10)}},
     {id:302,name:'乙',position:'LO',year:3},
     {id:303,name:'丙',position:'HO',year:1}];
D.tlog=[tl('v1',301,120,180,220),tl('v2',302,110,null,null),tl('v3',303,100,150,200)];
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'am',label:'午前',groups:[[301]],pool:[],guests:[{pid:302,day:'thu',gi:0}]},
  {key:'pm',label:'午後',groups:[[302]],pool:[303],guests:[{pid:301,day:'mon',gi:null}]}
]};
window._tgDay='thu';V.tgroup();
var gh=main();
ok('木曜タブ: 午前A班にゲスト乙「木のみ」（tgGuestTap(0,0)・重量）',has(gh,'木のみ</span>')&&has(gh,'tgGuestTap(0,0)')&&has(gh,'BP110'));
ok('木曜タブ: 午前A班の人数=2名（木のみ1）・班内の最大差はその日いる人で計算',has(gh,'2名（木のみ1）')&&has(gh,'班内の最大差'));
ok('木曜タブ: 午後A班の乙は薄く「木曜は → 午前 A班」（タップは通常のtgChipTap）',has(gh,'opacity:.55')&&has(gh,'木曜は → 午前 A班')&&has(gh,'tgChipTap(1,0,0)'));
ok('木曜タブ: 月曜のゲスト(甲)は出ない・「◯曜のゲスト未配置（N名）」の欄なし',!has(gh,'月のみ')&&!has(gh,'曜のゲスト未配置（')&&!has(gh,'tgGuestTap(1,0)'));
ok('木曜タブ: 午後組の見出しは全曜日分「ゲスト未配置1件（月1）」（amber）・午前組には出ない',has(gh,'<span style="color:var(--amber);font-weight:700">ゲスト未配置1件（月1）</span>')&&(gh.match(/ゲスト未配置\d+件/g)||[]).length===1&&gh.indexOf('ゲスト未配置1件（月1）')>gh.indexOf('>午後組<'));
ok('未配置(記録あり)の見出し（「うち記録なし」は出ない）・タップで選択',has(gh,'未配置 1名')&&!has(gh,'うち記録なし')&&has(gh,'tgPoolTap(1,0)'));
ok('班を追加ボタン・組み直すボタン',has(gh,'tgAddGroup(0)')&&has(gh,'組み直す'));
tgSetDay('mon');
var gm=main();
ok('tgSetDay(月)→_tgDay=mon・月タブが選択中',window._tgDay==='mon'&&has(gm,'aria-pressed="true" onclick="tgSetDay(\'mon\')"')&&has(gm,'aria-pressed="false" onclick="tgSetDay(\'thu\')"'));
ok('月曜タブ: 午前A班の甲は薄く「月曜は → 午後 未配置」',has(gm,'月曜は → 午後 未配置'));
ok('月曜タブ: 午後組に「月曜のゲスト未配置（1名）」カード＋甲「月のみ」(tgGuestTap(1,0))',has(gm,'月曜のゲスト未配置（1名）')&&has(gm,'月のみ</span>')&&has(gm,'tgGuestTap(1,0)')&&gm.indexOf('月曜のゲスト未配置（1名）')>gm.indexOf('>午後組<'));
ok('月曜タブ: 見出しの件数は曜日タブに依らず「ゲスト未配置1件（月1）」',has(gm,'ゲスト未配置1件（月1）')&&(gm.match(/ゲスト未配置\d+件/g)||[]).length===1);
ok('月曜タブ: 旧形式の見出し「月曜のゲスト未配置1名」は出ない',!has(gm,'月曜のゲスト未配置1名'));
ok('月曜タブ: 木曜のゲスト表示は消える',!has(gm,'木のみ')&&!has(gm,'木曜は'));
tgSetDay('tue');
var gt=main();
ok('火曜タブ: ゲスト無し＝全員ホーム班（のみ/→の表示なし・通常チップ）',!has(gt,'のみ</span>')&&!has(gt,'曜は → ')&&has(gt,'tgChipTap(0,0,0)')&&has(gt,'tgChipTap(1,0,0)')&&!has(gt,'opacity:.55'));
window._tgState.sel={k:'m',si:0,gi:0,sli:0};
tgSetDay('xxx');
ok('不正な曜日は無視（選択も解除しない）',window._tgDay==='tue'&&window._tgState.sel&&window._tgState.sel.k==='m');
tgSetDay('thu');
ok('tgSetDay: 曜日を切り替えると選択解除（sel=null）',window._tgDay==='thu'&&window._tgState.sel===null);
// 見出しの全曜日分のゲスト未配置件数（複数曜日）。ゲストは午前ホームの人（甲=午前班・丙=午前の未配置）→ 午後組
window._tgState.shifts[0].pool=[303];window._tgState.shifts[1].pool=[];
window._tgState.shifts[1].guests=[{pid:301,day:'mon',gi:null},{pid:303,day:'thu',gi:null},{pid:303,day:'mon',gi:null}];
V.tgroup();
ok('見出し: ゲスト未配置3件（月2・木1）＝曜日順・どのタブでも同じ',has(main(),'ゲスト未配置3件（月2・木1）'));
ok('木曜タブ: 「木曜のゲスト未配置（1名）」カードは表示中の曜日の分だけ',has(main(),'木曜のゲスト未配置（1名）')&&!has(main(),'月曜のゲスト未配置（'));
tgSetDay('tue');
ok('火曜タブ: 見出しは3件（月2・木1）のまま・火曜のゲスト未配置カードなし',has(main(),'ゲスト未配置3件（月2・木1）')&&!has(main(),'曜のゲスト未配置（'));
tgSetDay('mon');
ok('月曜タブ: 「月曜のゲスト未配置（2名）」（甲・丙）',has(main(),'月曜のゲスト未配置（2名）')&&has(main(),'ゲスト未配置3件（月2・木1）'));
window._tgState.shifts[0].pool=[];window._tgState.shifts[1].pool=[303];
window._tgState.shifts[1].guests=[{pid:301,day:'mon',gi:null}];
window._tgState.mode='single';window._tgState.shifts=[{key:'all',label:'',groups:[[301,302]],pool:[303],guests:[]}];
V.tgroup();
ok('分割なしは曜日タブ無し・全員表示',!has(main(),'表示する曜日')&&!has(main(),"tgSetDay('mon')")&&has(main(),'tgChipTap(0,0,1)'));

print('--- tgDefaultDay / tgDay ---');
function dow(n){var d=new Date(2026,8,13);while(d.getDay()!==n)d.setDate(d.getDate()+1);return d;}
ok('月→mon 火→tue 水/木→thu 金/土/日→mon',tgDefaultDay(dow(1))==='mon'&&tgDefaultDay(dow(2))==='tue'&&tgDefaultDay(dow(3))==='thu'&&tgDefaultDay(dow(4))==='thu'&&tgDefaultDay(dow(5))==='mon'&&tgDefaultDay(dow(6))==='mon'&&tgDefaultDay(dow(0))==='mon');
window._tgDay=undefined;ok('tgDay: 未設定は今日から既定',tgDay()===tgDefaultDay());
window._tgDay='bad';ok('tgDay: 不正値は既定へ',tgDay()===tgDefaultDay());
window._tgDay='thu';ok('tgDay: 設定値',tgDay()==='thu');

// ============ 8. 保存済み編成カード（読み取り専用・_tgStateと独立・曜日タブ） ============
print('--- V.tgroup 保存済み編成カード（曜日タブ・here/away） ---');
var TD=todayStr();
D.p=[{id:401,name:'班長',position:'PR',year:2},{id:402,name:'副班',position:'LO',year:3},{id:403,name:'三番',position:'HO',year:1}];
D.tgroup=[{id:99,ts:99,date:TD,by:'staff',mode:'ampm',excluded:[],shifts:[
  {key:'am',label:'午前',groups:[[401,402]],guests:[{pid:403,day:'tue',gi:0}]},
  {key:'pm',label:'午後',groups:[[403]],guests:[]}
]}];
window._tgSavedOpen=undefined;window._tgState=undefined;window._tgDay='mon';
V.tgroup();
var svc=main(),sc=tgSavedCardHtml();
ok('保存済み編成カード見出し',has(svc,'現在の保存済み編成'));
ok('選手に公開中バッジ',has(sc,'選手に公開中'));
ok('保存日表示',has(sc,fmt(TD)));
ok('カードに曜日タブ（tgSetDay・月が選択中）',has(sc,'表示する曜日')&&has(sc,'aria-pressed="true" onclick="tgSetDay(\'mon\')"'));
ok('午前組/午後組ラベル＋曜日',has(sc,'午前組')&&has(sc,'午後組')&&has(sc,'月曜</span>'));
ok('月曜: 午前A班2名（班長・副班）・午後A班に三番・ゲスト印なし',has(sc,'A班 <span style="font-size:10px;color:var(--text-secondary);font-weight:400">2名</span>')&&has(sc,'班長')&&has(sc,'副班')&&has(sc,'三番')&&!has(sc,'火のみ')&&!has(sc,'opacity:.55'));
tgSetDay('tue');
var sc2=tgSavedCardHtml();
ok('火曜: 午前A班3名・三番は「火のみ」・午後では薄く「→ 午前 A班」',has(sc2,'>3名</span>')&&has(sc2,'火のみ</span>')&&has(sc2,'→ 午前 A班')&&has(sc2,'opacity:.55'));
ok('保存履歴の読み込み/引き継ぎボタン',has(sc2,"tgLoadRecord('99',false)")&&has(sc2,"tgLoadRecord('99',true)")&&has(sc2,'公開中'));

print('--- tgSetMode後も保存済みカードは残る（_tgStateと独立） ---');
tgSetMode('single');
var svc2=main();
ok('モード変更後も保存済み編成が残る',has(svc2,'現在の保存済み編成')&&has(svc2,'班長'));

print('--- 折りたたみ（既定=開→トグルで閉） ---');
window._tgSavedOpen=undefined;window._tgSurveyOpen=false;
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],shifts:[],generated:false,_reason:{},sel:null};
V.tgroup();
// min-width:118px は保存済みカードの班カード固有マーカー（編集エリアの除外ドロップダウン等と混同しない）
ok('既定は開いて明細表示',has(main(),'min-width:118px'));
tgSavedToggle();
var svc3=main();
ok('トグルで閉じて明細消える',!has(svc3,'min-width:118px'));
ok('閉じてもヘッダーは残る',has(svc3,'現在の保存済み編成'));

print('--- 保存済みなしのメッセージ ---');
D.tgroup=[];window._tgState=undefined;
V.tgroup();
ok('保存なしメッセージ',has(main(),'保存済みの編成はまだありません'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup tests failed');}
print('\nALL TGROUP TESTS PASSED');
