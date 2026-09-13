// ウエイトグループ分けv2 フェーズ4: 手動編集UI（staff）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_ui.js
// 仕様（dev/audit/PLAN_tgroup_v2.md #5/#6/#7/#10/#17）:
//  - タップで選択→「ここへ」で移動（人数増減OK・午前⇔午後も可＝ゲストを付け直す）／選手同士・未配置⇔班の選手で入替
//  - 未配置から入れた人は自動ピン・未配置へ戻すとピン解除／ピン留めの切替／未配置には推定重量が近い班を提案（自動では入れない）
//  - ゲストは同じ組の班へ移動・未配置化／班の追加・空の班だけ削除（ゲストの班indexを詰める）
//  - 班の人数・FW/BK分離の変更は組み直し（ピン維持・トーストで元に戻す）／リセットはconfirmを使わずUndoトースト
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
var __confirmCalls=0;confirm=function(){__confirmCalls++;return true;};
drain();
function main(){return __els['main-ct'].innerHTML;}
function ids(groups){return groups.map(function(g){return g.join(',');}).join(' | ');}
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
D.i=[];D.e1rm=[];D.tmenu=[];D.tgroup=[];
D.ph=[{id:1,pid:8,date:daysAgo(20),bench:100}];
D.tlog=[tl('l1',1,120,180,220),tl('l2',2,118,175,215),tl('l3',3,100,150,190),tl('l4',4,100,150,190),tl('l5',5,98,148,185),
        tl('l6',6,90,130,160),tl('l7',7,88,128,158),tl('l9',9,70,100,130)];
_tlogArch=[];_tlogArchLoaded=true;_tlaCbs=null;_tlaCache=null;
function fresh(){window._tgState=undefined;D.tgroup=[];tgInit(true);tgGenerate();__toasts.length=0;return window._tgState;}

// ============ A. 選択→同じ組の班へ移動 ============
print('--- 選択と「ここへ」: 同じ組の別の班へ ---');
var st=fresh(),am=st.shifts[0],pm=st.shifts[1];
ok('前提: AM=[1,2,3]|[6]・未配置[8]／PM=[4,5]|[7,9]・ゲスト3(木→PMの班0)',ids(am.groups)==='1,2,3 | 6'&&am.pool.join()==='8'&&ids(pm.groups)==='4,5 | 7,9'&&pm.guests.length===1&&pm.guests[0].pid===3&&pm.guests[0].gi===0);
var h0=main();
ok('未選択では「ここへ」も操作バーも出ない',!has(h0,'tgMoveTo(')&&!has(h0,'選択中:'));
ok('班内の最大差を色つき表示（[1,2,3]=BP20・SQ30・DL30→赤）',has(h0,'color:var(--red)">BP20・SQ30・DL30'));
ok('FW/BKタグ・班を追加・組み直す',has(h0,'>FW</span>')&&has(h0,'>BK</span>')&&has(h0,'tgAddGroup(1)')&&has(h0,'組み直す'));
ok('未配置8は1RM(ph100)からの推定重量をグレー＋「推定」',has(h0,'BP80 SQ— DL—')&&has(h0,'>推定</span>'));
tgChipTap(0,0,0);
var h1=main();
ok('選手1を選択→操作バー（ピン留め/未配置へ戻す/解除）',st.sel&&st.sel.k==='m'&&has(h1,'選択中: F1')&&has(h1,'tgTogglePin()')&&has(h1,'tgToPool()')&&has(h1,'tgClearSel()'));
ok('「ここへ」は今の班以外の全班（午前⇔午後も）',!has(h1,'tgMoveTo(0,0)')&&has(h1,'tgMoveTo(0,1)')&&has(h1,'tgMoveTo(1,0)')&&has(h1,'tgMoveTo(1,1)'));
tgMoveTo(0,1);
ok('同じ組の別の班へ移動（人数の増減OK）・選択解除',ids(am.groups)==='2,3 | 6,1'&&st.sel===null);
ok('同じ組内の移動は振分理由を変えない',st._reason[1]==='固定');
tgChipTap(0,0,0);tgClearSel();
ok('解除ボタンで選択解除',st.sel===null);
tgChipTap(0,0,0);tgChipTap(0,0,0);
ok('同じ選手をもう一度タップでも解除',st.sel===null);

// ============ B. 午前⇔午後の移動とゲストの付け直し ============
print('--- 午前⇔午後の移動: ゲストを付け直す ---');
st=fresh();am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,0,2); // 3（AM申告・木だけPMゲスト）
tgMoveTo(1,0);
ok('午後の班へ移動・理由=手動',ids(pm.groups)==='4,5,3 | 7,9'&&st._reason[3]==='手動');
ok('PM側にあった3のゲスト(木)は消える',pm.guests.filter(function(x){return x.pid===3;}).length===0);
var g3am=am.guests.filter(function(x){return x.pid===3;});
ok('申告の午前のみ(月・火)がAMのFW班へゲストとして付け直される',g3am.length===2&&g3am.map(function(x){return x.day;}).join(',')==='mon,tue'&&g3am.every(function(x){return x.gi===0;}));

// ============ C. 入替（午前⇔午後） ============
print('--- 選手同士の入替（午前⇔午後） ---');
st=fresh();am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,0,0);tgChipTap(1,0,0); // AMの1 ⇔ PMの4
ok('午前⇔午後で入替・両者の理由=手動',am.groups[0][0]===4&&pm.groups[0][0]===1&&st._reason[1]==='手動'&&st._reason[4]==='手動');
ok('入替えた2人のゲストを付け直す（1=午前のみ3日→AMへ／4=午後のみ3日→PMへ）',am.guests.filter(function(x){return x.pid===1;}).length===3&&pm.guests.filter(function(x){return x.pid===4;}).length===3);
ok('関係ない3のゲストはそのまま',pm.guests.filter(function(x){return x.pid===3;}).length===1);

// ============ D. 未配置の配置・戻す・入替 ============
print('--- 未配置: 推定重量が近い班の提案→配置(自動ピン)→戻す→入替 ---');
st=fresh();am=st.shifts[0];
tgPoolTap(0,0);
var hp=main();
ok('未配置8を選択→推定重量が近いBK班(B班)を提案',st.sel.k==='p'&&has(hp,'onclick="tgMoveTo(0,1)">推定重量が近いB班へ'));
ok('未配置の選択中は全班に「ここへ」',has(hp,'tgMoveTo(0,0)')&&has(hp,'tgMoveTo(1,1)'));
tgMoveTo(0,1);
ok('提案の班へ配置→自動ピン',ids(am.groups)==='1,2,3 | 6,8'&&am.pool.length===0&&st.pinned.join()==='8');
tgChipTap(0,1,1);tgToPool();
ok('未配置へ戻す→ピン解除',ids(am.groups)==='1,2,3 | 6'&&am.pool.join()==='8'&&st.pinned.length===0);
tgPoolTap(0,0);tgChipTap(0,1,0);
ok('未配置8→班の6をタップで入替（入れた8はピン・外した6は未配置）',ids(am.groups)==='1,2,3 | 8'&&am.pool.join()==='6'&&st.pinned.join()==='8');
tgChipTap(0,1,0);tgPoolTap(0,0);
ok('班の8→未配置6をタップでも入替（6がピン・8はピン解除）',ids(am.groups)==='1,2,3 | 6'&&am.pool.join()==='8'&&st.pinned.join()==='6');

// ============ E. ピン留めの切替 ============
print('--- ピン留めの切替 ---');
st=fresh();
tgChipTap(0,0,0);__toasts.length=0;tgTogglePin();
ok('ピン留め→pinnedに追加・トースト・選択解除',st.pinned.join()==='1'&&__toasts.length===1&&has(__toasts[0].m,'ピン留め')&&st.sel===null);
ok('画面にピン留め人数',has(main(),'ピン留め 1名'));
tgChipTap(0,0,0);tgTogglePin();
ok('もう一度でピンを外す',st.pinned.length===0&&has(__toasts[1].m,'ピンを外し'));

// ============ F. ゲストの移動・未配置化 ============
print('--- ゲスト: 同じ組の班だけへ移動・未配置にする ---');
st=fresh();pm=st.shifts[1];
tgGuestTap(1,0);
var hg=main();
ok('ゲストを選択→操作バー（未配置にする）',st.sel.k==='g'&&has(hg,'選択中: F3')&&has(hg,'tgUnplaceGuest()'));
ok('ゲストの「ここへ」は同じ組(PM)の今の班以外だけ',has(hg,'tgMoveTo(1,1)')&&!has(hg,'tgMoveTo(1,0)')&&!has(hg,'tgMoveTo(0,0)')&&!has(hg,'tgMoveTo(0,1)'));
tgMoveTo(0,0);
ok('別の組の班へは移せない（無視・選択は残る）',pm.guests[0].gi===0&&st.sel!==null);
tgMoveTo(1,1);
ok('同じ組の別の班へゲスト移動',pm.guests[0].gi===1&&st.sel===null);
tgGuestTap(1,0);tgUnplaceGuest();
ok('未配置にする→gi=null・ゲスト未配置に出る',pm.guests[0].gi===null&&has(main(),'ゲスト未配置（1件）'));

// ============ G. 班の追加・空の班の削除 ============
print('--- 班の追加・空の班だけ削除 ---');
st=fresh();pm=st.shifts[1];
tgAddGroup(1);tgAddGroup(1);
ok('班を追加→空の班×2（削除ボタン付き）',pm.groups.length===4&&pm.groups[2].length===0&&has(main(),'空の班')&&has(main(),'tgDelGroup(1,3)'));
pm.guests[0].gi=3;
tgDelGroup(1,2);
ok('空の班を削除→後ろの班を指すゲストのindexを詰める(3→2)',pm.groups.length===3&&pm.guests[0].gi===2);
tgDelGroup(1,2);
ok('ゲストがいた空の班を削除→そのゲストは未配置',pm.groups.length===2&&pm.guests[0].gi===null);
tgDelGroup(1,0);
ok('人がいる班は削除できない',ids(pm.groups)==='4,5 | 7,9');

// ============ H. 人数・FW/BK分離の変更＝組み直し（ピン維持・元に戻す） ============
print('--- 班の人数・FW/BK分離の変更 ---');
st=fresh();st.pinned=[1,2];__toasts.length=0;
tgSetSize('2');
st=window._tgState;am=st.shifts[0];
ok('人数2に変更→組み直し（ピン[1,2]はそのまま・3は1人班）',st.size===2&&ids(am.groups).indexOf('1,2 | ')===0&&am.groups.some(function(g){return g.join()==='3';}));
var tU=__toasts.filter(function(t){return t.label==='元に戻す';})[0];
ok('組み直しはトーストで元に戻せる',!!tU&&has(tU.m,'組み直しました'));
tU.fn();
ok('元に戻す→人数3の編成に戻る（人数設定も戻る）',window._tgState.size===3&&ids(window._tgState.shifts[0].groups)==='1,2,3 | 6');
__toasts.length=0;
tgToggleSplit();
ok('FW/BK分離OFF→組み直し（元に戻せる）',window._tgState.splitUnit===false&&window._tgState.generated===true&&__toasts.some(function(t){return t.label==='元に戻す';}));
window._tgState.generated=false;tgSetSize('4');
ok('未生成なら人数変更だけ（組み直さない）',window._tgState.size===4&&window._tgState.generated===false);
ok('画面の人数セレクト/FW/BKスイッチ',has(main(),'id="tg-size"')&&has(main(),'value="4" selected')&&has(main(),'id="tg-split"'));

// ============ I. リセット（confirmなし・Undo） ============
print('--- リセット: confirmを使わず元に戻せる ---');
st=fresh();tgAddGroup(0);__confirmCalls=0;__toasts.length=0;
tgResetState();
ok('リセットはconfirmを使わない',__confirmCalls===0);
ok('保存済みが無ければ初期状態（未生成）に戻る',window._tgState.generated===false);
var tR=__toasts.filter(function(t){return t.label==='元に戻す';})[0];
ok('トーストで元に戻せる',!!tR&&has(tR.m,'戻しました'));
tR.fn();
ok('元に戻す→追加した班も含めて復元',window._tgState.generated===true&&window._tgState.shifts[0].groups.length===3);

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_ui tests failed');}
print('\nALL TGROUP-UI TESTS PASSED');
