// Phase 7 (staff側): グループ分け（午前/午後シフト → 強度3人組）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup.js
// 仕様（プランPhase 7節）:
//  - getLatestE1RM移植 / groupScore=各種目「最新e1rm→getBest(ph)」合計・1種目欠測でnull
//  - シフト自動振分: 5限→午前固定 > 本人希望 > 遠方→午後 > 人数バランス
//  - 端数規則: n<=4→1組 / n=5→3+2 / n%3==0→全3 / n%3==1→末尾4×1 / n%3==2→末尾4×2(n>=8)
//  - tgroup=常に1レコード全置換 / 代理編集doSaveWg（wgのみ更新・他不変）
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function sizes(groups){return groups.map(function(g){return g.length;}).join(',');}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};
pushView=function(){};popView=function(){};toast=function(){};confirm=function(){return true;};

// ============ 0. SK/D ============
print('--- SK/D: tgroup ---');
ok('SKにtgroup',SK.tgroup==='rm_tgroup');
ok('D.tgroup配列',Array.isArray(D.tgroup));

// 共通データ
D.p=[];D.i=[];D.ph=[];D.e1rm=[];D.tgroup=[];

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

// ============ 2. groupScore ============
print('--- groupScore ---');
D.e1rm=[{pid:1,date:'2026-07-01',values:{squat:{e1rm:150},bench:{e1rm:100},deadlift:{e1rm:180}}}];
D.ph=[];
ok('e1rm全種目→合計430',groupScore(1)===430);
// e1rm2種目 + ph1種目フォールバック
D.e1rm=[{pid:2,date:'2026-07-01',values:{squat:{e1rm:140},bench:{e1rm:90}}}];
D.ph=[{pid:2,date:'2026-06-01',squat:120,bench:80,deadlift:170}];
ok('e1rm2種目+ph deadlift170→400',groupScore(2)===400);
// e1rmもphも欠測 → null
D.e1rm=[{pid:3,date:'2026-07-01',values:{squat:{e1rm:140}}}];
D.ph=[];
ok('1種目でも欠測→null',groupScore(3)===null);
// ph only
D.e1rm=[];
D.ph=[{pid:4,date:'2026-06-01',squat:130,bench:85,deadlift:160}];
ok('ph実測のみ→375',groupScore(4)===375);
// ph複数→getBestは最大
D.ph=[{pid:4,squat:130,bench:85,deadlift:160},{pid:4,squat:135,bench:80,deadlift:165}];
ok('ph複数はベスト合計(135+85+165=385)',groupScore(4)===385);

// ============ 3. chunkGroups 端数規則 ============
print('--- chunkGroups 端数規則 ---');
function ids(n){var a=[];for(var i=1;i<=n;i++)a.push(i);return a;}
ok('n=0→空',sizes(chunkGroups(ids(0)))==='');
ok('n=1→1',sizes(chunkGroups(ids(1)))==='1');
ok('n=2→2',sizes(chunkGroups(ids(2)))==='2');
ok('n=3→3',sizes(chunkGroups(ids(3)))==='3');
ok('n=4→4',sizes(chunkGroups(ids(4)))==='4');
ok('n=5→3,2',sizes(chunkGroups(ids(5)))==='3,2');
ok('n=6→3,3',sizes(chunkGroups(ids(6)))==='3,3');
ok('n=7→3,4',sizes(chunkGroups(ids(7)))==='3,4');
ok('n=8→4,4',sizes(chunkGroups(ids(8)))==='4,4');
ok('n=9→3,3,3',sizes(chunkGroups(ids(9)))==='3,3,3');
ok('n=10→3,3,4',sizes(chunkGroups(ids(10)))==='3,3,4');
ok('n=11→3,4,4',sizes(chunkGroups(ids(11)))==='3,4,4');
ok('n=12→3,3,3,3',sizes(chunkGroups(ids(12)))==='3,3,3,3');
// 全員が保持される（欠落なし）
var g13=chunkGroups(ids(13));var flat13=[];g13.forEach(function(g){g.forEach(function(x){flat13.push(x);});});
ok('n=13で全員保持(13名)',flat13.length===13&&sizes(g13)==='3,3,3,4');

// ============ 4. tgAutoAssignShifts 優先順位 ============
print('--- tgAutoAssignShifts 優先順位 ---');
D.e1rm=[];D.ph=[];
D.p=[
  {id:1,name:'A',wg:{f5:['mon'],far:false,pref:null}},   // 5限→午前
  {id:2,name:'B',wg:{f5:[],far:true,pref:'am'}},          // 午前希望（遠方でも午前）
  {id:3,name:'C',wg:{f5:[],far:false,pref:'pm'}},         // 午後希望
  {id:4,name:'D',wg:{f5:[],far:true,pref:null}},          // 遠方→午後
  {id:5,name:'E'},                                        // 自動
  {id:6,name:'F'}                                         // 自動
];
var as=tgAutoAssignShifts([1,2,3,4,5,6]);
ok('5限→午前',as.am.indexOf(1)>=0&&as.reason[1]==='5限');
ok('遠方でも午前希望→午前',as.am.indexOf(2)>=0&&as.reason[2]==='希望');
ok('午後希望→午後',as.pm.indexOf(3)>=0&&as.reason[3]==='希望');
ok('希望なし遠方→午後',as.pm.indexOf(4)>=0&&as.reason[4]==='遠方');
ok('自動2名(5,6)は自動バッジ',as.reason[5]==='自動'&&as.reason[6]==='自動');
ok('バランス配置で午前午後3名ずつ',as.am.length===3&&as.pm.length===3);
// バランス: 全員自動なら半々
var asB=tgAutoAssignShifts([5,6,1,2]);
// これらは上のp定義に依存するのでバランス確認は専用データで
D.p=[{id:11,name:'a'},{id:12,name:'b'},{id:13,name:'c'},{id:14,name:'d'}];
var asC=tgAutoAssignShifts([11,12,13,14]);
ok('全員自動→2:2バランス',asC.am.length===2&&asC.pm.length===2);

// ============ 5. tgMakeGroups ============
print('--- tgMakeGroups（強度順+対象外分離） ---');
D.e1rm=[];
D.ph=[
  {id:1,pid:21,squat:200,bench:150,deadlift:250}, // score 600
  {id:2,pid:22,squat:100,bench:80,deadlift:120},  // score 300
  {id:3,pid:23,squat:160,bench:110,deadlift:190}  // score 460
];
D.p=[{id:21,name:'強'},{id:22,name:'弱'},{id:23,name:'中'},{id:24,name:'欠'}];
var mg=tgMakeGroups([21,22,23,24]);
ok('対象外(24=測定なし)は分離',mg.unscored.length===1&&mg.unscored[0]===24);
ok('強度降順(21>23>22)',mg.groups[0][0]===21&&mg.groups[0][1]===23&&mg.groups[0][2]===22);

// ============ 6. 状態: tgInit/tgSetMode/tgToggleExclude ============
print('--- tgInit/tgSetMode/tgToggleExclude ---');
window._tgState=undefined;
D.tgroup=[];
D.p=[{id:31,name:'p1'},{id:32,name:'p2'},{id:33,name:'p3'}];
D.i=[{id:1,pid:32,resolved:false}]; // p2は未解決怪我
tgInit(true);
ok('初期モードampm',window._tgState.mode==='ampm');
ok('未解決怪我(32)は既定で除外',window._tgState.excluded.indexOf(32)>=0);
ok('健常者は除外されない',window._tgState.excluded.indexOf(31)<0);
tgSetMode('single');
ok('モード切替でsingle',window._tgState.mode==='single'&&window._tgState.generated===false);
tgToggleExclude(31);
ok('手動除外追加(31)',window._tgState.excluded.indexOf(31)>=0);
tgToggleExclude(32);
ok('怪我者の除外解除(32)',window._tgState.excluded.indexOf(32)<0);

// tgInitはsaved記録から復元
window._tgState=undefined;
D.tgroup=[{id:9,ts:9,date:'2026-07-01',by:'staff',mode:'single',excluded:[99],shifts:[{key:'all',label:'',groups:[[31,32],[33]]}]}];
tgInit(true);
ok('saved記録からmode復元',window._tgState.mode==='single');
ok('saved記録からgroups復元',window._tgState.shifts[0].groups.length===2&&window._tgState.generated===true);

// ============ 7. tgGenerate + tgSave ============
print('--- tgGenerate + tgSave（全置換レコード） ---');
window._tgState=undefined;
D.tgroup=[];
D.i=[];
D.e1rm=[];
D.ph=[];
D.p=[];
// 8名: 全員フルBIG3・自動振分（希望なし）→ ampmで4:4想定
for(var i=0;i<8;i++){D.p.push({id:100+i,name:'選手'+i});D.ph.push({id:i,pid:100+i,squat:200-i*5,bench:150-i*3,deadlift:250-i*4});}
tgInit(true);
window._tgState.mode='ampm';
tgGenerate();
var st=window._tgState;
ok('生成済みフラグ',st.generated===true);
ok('ampm=2シフト',st.shifts.length===2);
var totalAssigned=0;st.shifts.forEach(function(sh){sh.groups.forEach(function(g){totalAssigned+=g.length;});});
ok('全8名が班に配置',totalAssigned===8);
// 保存
__store['tgroup']=JSON.stringify([]);
tgSave();drain();
var saved=JSON.parse(__store['tgroup']);
ok('tgroupは1レコードのみ（全置換）',saved.length===1);
ok('保存レコードにmode/shifts/excluded',saved[0].mode==='ampm'&&Array.isArray(saved[0].shifts)&&Array.isArray(saved[0].excluded));
ok('保存レコードにby=staff/date',saved[0].by==='staff'&&typeof saved[0].date==='string');
ok('shiftsはkey/label/groupsのみ（pool等除去）',saved[0].shifts[0].key!==undefined&&saved[0].shifts[0].groups!==undefined&&saved[0].shifts[0].pool===undefined);
// 2回保存しても常に1件
tgSave();drain();
ok('再保存でも1件（全置換）',JSON.parse(__store['tgroup']).length===1);

// ============ 8. tgChipTap 入替 ============
print('--- tgChipTap 入替（同シフト内 / シフト跨ぎ手動バッジ） ---');
window._tgState={mode:'ampm',excluded:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'am',label:'午前',groups:[[1,2,3]],pool:[]},
  {key:'pm',label:'午後',groups:[[4,5,6]],pool:[]}
]};
// 同シフト内 1と3を入替
tgChipTap(0,0,0); // select 1
ok('1回目タップで選択',window._tgState.sel&&window._tgState.sel.si===0&&window._tgState.sel.sli===0);
tgChipTap(0,0,2); // swap with 3
ok('入替後 group[0]=[3,2,1]',window._tgState.shifts[0].groups[0][0]===3&&window._tgState.shifts[0].groups[0][2]===1);
ok('入替後selクリア',window._tgState.sel===null);
// 同じチップ2連続タップで選択解除
tgChipTap(0,0,0);tgChipTap(0,0,0);
ok('同一チップ再タップで解除',window._tgState.sel===null);
// シフト跨ぎ入替（午前の3と午後の4）→両者手動バッジ
tgChipTap(0,0,0); // select am's [3]
tgChipTap(1,0,0); // swap with pm's [4]
ok('シフト跨ぎ入替: am先頭が4',window._tgState.shifts[0].groups[0][0]===4);
ok('シフト跨ぎ入替: pm先頭が3',window._tgState.shifts[1].groups[0][0]===3);
ok('跨ぎ入替した2名は手動バッジ',window._tgState._reason[3]==='手動'&&window._tgState._reason[4]==='手動');

// ============ 9. tgAddUnscored ============
print('--- tgAddUnscored（対象外を最小グループへ） ---');
window._tgState={mode:'single',excluded:[],_reason:{},sel:null,generated:true,shifts:[
  {key:'all',label:'',groups:[[1,2,3],[4,5]],pool:[99]}
]};
tgAddUnscored(0,0);
ok('対象外99が最小グループ([4,5])へ',window._tgState.shifts[0].groups[1].indexOf(99)>=0);
ok('poolから除去',window._tgState.shifts[0].pool.length===0);

// ============ 10. doSaveWg 代理編集 ============
print('--- doSaveWg（代理編集・wgのみ更新） ---');
D.p=[{id:201,name:'代理対象',position:'PR',year:2,height:'180'},{id:202,name:'他',position:'LO',year:3}];
__store['p']=JSON.stringify(D.p);
document.getElementById('ewg-mon').checked=true;
document.getElementById('ewg-wed').checked=false;
document.getElementById('ewg-fri').checked=true;
document.getElementById('ewg-far').checked=true;
document.getElementById('ewg-pref').value='pm';
doSaveWg(201);drain();
var pS=JSON.parse(__store['p']);
var t=pS.find(function(x){return x.id===201;});
ok('wg保存',t.wg&&t.wg.f5.length===2&&t.wg.f5.indexOf('mon')>=0&&t.wg.f5.indexOf('fri')>=0);
ok('far=true',t.wg.far===true);
ok('pref=pm',t.wg.pref==='pm');
ok('他フィールド不変',t.name==='代理対象'&&t.position==='PR'&&t.height==='180');
ok('別選手にwg付かない',!pS.find(function(x){return x.id===202;}).wg);

// ============ 11. V.tgroup レンダリング smoke ============
print('--- V.tgroup レンダリング ---');
window._tgState=undefined;
D.tgroup=[];D.i=[];
D.p=[{id:301,name:'甲',position:'PR',year:2,wg:{f5:['mon'],far:false,pref:null,upd:'2026-07-01T00:00:00Z'}},
     {id:302,name:'乙',position:'LO',year:3}];
D.e1rm=[];D.ph=[{id:1,pid:301,squat:180,bench:120,deadlift:220},{id:2,pid:302,squat:170,bench:110,deadlift:210}];
V.tgroup();
var out=__els['main-ct'].innerHTML;
ok('モードトグル描画',has(out,'振り分けモード')&&has(out,"tgSetMode('single')"));
ok('申告一覧トグル',has(out,'選手の申告一覧')&&has(out,'tgToggleSurvey()'));
ok('未回答カウント表示',has(out,'未回答'));
ok('自動で組むボタン',has(out,'tgGenerate()'));
// 生成後の描画
window._tgSurveyOpen=false;
tgGenerate();
var out2=__els['main-ct'].innerHTML;
ok('生成後: 午前組/午後組の見出し',has(out2,'午前組')||has(out2,'午後組'));
ok('生成後: 班チップ(tgChipTap)',has(out2,'tgChipTap('));
ok('生成後: 保存ボタン(tgSave)',has(out2,'tgSave()'));

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup tests failed');}
print('\nALL TGROUP TESTS PASSED');
