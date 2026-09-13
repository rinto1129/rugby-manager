// ウエイトグループ分けv2 フェーズ4: 手動編集UI（staff）＋曜日表示（2026-09-13改訂）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_ui.js
// 仕様（dev/audit/PLAN_tgroup_v2.md #5/#6/#7/#10/#17）:
//  - タップで選択→「ここへ」で移動（人数増減OK・午前⇔午後も可＝ゲストを付け直す）／選手同士・未配置⇔班の選手で入替
//  - 未配置から入れた人は自動ピン・未配置へ戻すとピン解除／ピン留めの切替／未配置には推定重量が近い班を提案（自動では入れない）
//  - ゲストは同じ組の班へ移動・未配置化／班の追加・空の班だけ削除（ゲストの班indexを詰める）
//  - 班の人数・FW/BK分離の変更は組み直し（ピン維持・トーストで元に戻す）／リセットはconfirmを使わずUndoトースト
//  - 申告 p.wg は新モデル {f5:[5限の曜日],far,pref,upd, ov:{mon,tue,thu:'am'|'pm'|''},ovUpd}（wgNormで読む）。振分理由=ピン/指定/5限/希望/遠方/自動/手動
//  - 結果は曜日タブ（月/火/木・tgSetDay・window._tgDay）でその曜日の班構成を表示: その曜日のゲストは行き先の班に「火のみ」印のゲストチップ、
//    ホーム班では薄く（opacity）「火曜は → 午後 A班」。班内の最大差は「その日いる人」で計算。その曜日のゲスト未配置はその曜日だけ。分割なしは曜日タブ無し
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function count(s,t){return String(s).split(t).length-1;}
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
// HTMLの部分切り出し（from〜toの間。toが無ければ末尾まで）／onclick属性を持つ要素の開始タグ（薄い表示=opacityの検査用）
function sect(h,from,to){var i=String(h).indexOf(from);if(i<0)return '';var j=to?String(h).indexOf(to,i+from.length):-1;return j<0?String(h).slice(i):String(h).slice(i,j);}
function tagOf(h,onclick){var i=String(h).indexOf('onclick="'+onclick+'"');if(i<0)return '';return String(h).slice(i,String(h).indexOf('>',i));}
// 結果エリアの組ごと（午前組の見出し〜午後組の見出し／午後組の見出し〜保存ボタン）と、その中のA班カード
function amSect(h){return sect(h,'午前組</span>','午後組</span>');}
function pmSect(h){return sect(h,'午後組</span>','この編成を保存');}
function tl(id,pid,bp,sq,dl){
  return {id:id,pid:pid,menuId:1,date:daysAgo(2),ts:'2026-09-01T10:00:00.000Z',results:[
    {exName:'ベンチプレス(スピード)',estBase:'bench',sets:[{weight:bp,reps:3}]},{exName:'スクワット(スピード)',sets:[{weight:sq,reps:3}]},{exName:'デットリフト(スピード)',sets:[{weight:dl,reps:2}]}]};
}
// 申告フィクスチャ（新モデル）: AM3=3日とも5限あり→午前ホーム(5限)／PM3=スタッフ指定が3日とも午後→午後ホーム(指定)／
// AM2PM1=月火は5限(午前ホーム)＋木だけスタッフ指定で午後→木曜だけ午後組のゲスト
var __U=new Date(Date.now()-3*86400000).toISOString();
var AM3={f5:['mon','tue','thu'],far:false,pref:null,upd:__U};
var PM3={f5:[],far:false,pref:null,upd:__U,ov:{mon:'pm',tue:'pm',thu:'pm'},ovUpd:__U};
var AM2PM1={f5:['mon','tue'],far:false,pref:null,upd:__U,ov:{mon:'',tue:'',thu:'pm'},ovUpd:__U};
D.p=[
  {id:1,name:'F1',position:'PR',wg:AM3},{id:2,name:'F2',position:'HO',wg:AM3},{id:3,name:'F3',position:'LO',wg:AM2PM1},
  {id:4,name:'F4',position:'FL',wg:PM3},{id:5,name:'F5',position:'PR',wg:PM3},
  {id:6,name:'B6',position:'SH',wg:AM3},{id:7,name:'B7',position:'SO',wg:PM3},{id:8,name:'B8',position:'CTB',wg:AM3},{id:9,name:'B9',position:'WTB',wg:PM3}
];
D.i=[];D.e1rm=[];D.tmenu=[];D.tgroup=[];
D.ph=[{id:1,pid:8,date:daysAgo(20),bench:100}];
D.tlog=[tl('l1',1,120,180,220),tl('l2',2,118,175,215),tl('l3',3,100,150,190),tl('l4',4,100,150,190),tl('l5',5,98,148,185),
        tl('l6',6,90,130,160),tl('l7',7,88,128,158),tl('l9',9,70,100,130)];
_tlogArch=[];_tlogArchLoaded=true;_tlaCbs=null;_tlaCache=null;
// 表示曜日は月に固定（今日の曜日に依存させない。3のゲストは木曜なので月曜表示では全員ホーム班に出る）
function fresh(){window._tgState=undefined;window._tgDay='mon';D.tgroup=[];tgInit(true);tgGenerate();__toasts.length=0;return window._tgState;}

// ============ A. 選択→同じ組の班へ移動 ============
print('--- 選択と「ここへ」: 同じ組の別の班へ ---');
var st=fresh(),am=st.shifts[0],pm=st.shifts[1];
ok('前提: AM=[1,2,3]|[6]・未配置[8]／PM=[4,5]|[7,9]・ゲスト3(木→PMの班0)',ids(am.groups)==='1,2,3 | 6'&&am.pool.join()==='8'&&ids(pm.groups)==='4,5 | 7,9'&&pm.guests.length===1&&pm.guests[0].pid===3&&pm.guests[0].day==='thu'&&pm.guests[0].gi===0);
ok('振分理由: 5限あり=5限／指定3日とも午後=指定',st._reason[1]==='5限'&&st._reason[3]==='5限'&&st._reason[4]==='指定'&&st._reason[9]==='指定');
var h0=main();
ok('未選択では「ここへ」も操作バーも出ない',!has(h0,'tgMoveTo(')&&!has(h0,'選択中:'));
ok('班内の最大差を色つき表示（[1,2,3]=BP20・SQ30・DL30→赤）',has(h0,'color:var(--red)">BP20・SQ30・DL30'));
ok('FW/BKタグ・班を追加・組み直す',has(h0,'>FW</span>')&&has(h0,'>BK</span>')&&has(h0,'tgAddGroup(1)')&&has(h0,'組み直す'));
ok('未配置8は1RM(ph100)からの推定重量をグレー＋「推定」',has(h0,'BP80 SQ— DL—')&&has(h0,'>推定</span>'));
ok('理由バッジ（5限/指定）が班のチップに出る',has(h0,'>5限</span>')&&has(h0,'>指定</span>'));
tgChipTap(0,0,0);
var h1=main();
ok('選手1を選択→操作バー（ピン留め/未配置へ戻す/解除）',st.sel&&st.sel.k==='m'&&has(h1,'選択中: F1')&&has(h1,'tgTogglePin()')&&has(h1,'tgToPool()')&&has(h1,'tgClearSel()'));
ok('「ここへ」は今の班以外の全班（午前⇔午後も）',!has(h1,'tgMoveTo(0,0)')&&has(h1,'tgMoveTo(0,1)')&&has(h1,'tgMoveTo(1,0)')&&has(h1,'tgMoveTo(1,1)'));
tgMoveTo(0,1);
ok('同じ組の別の班へ移動（人数の増減OK）・選択解除',ids(am.groups)==='2,3 | 6,1'&&st.sel===null);
ok('同じ組内の移動は振分理由を変えない（5限のまま）',st._reason[1]==='5限');
tgChipTap(0,0,0);tgClearSel();
ok('解除ボタンで選択解除',st.sel===null);
tgChipTap(0,0,0);tgChipTap(0,0,0);
ok('同じ選手をもう一度タップでも解除',st.sel===null);

// ============ B. 午前⇔午後の移動とゲストの付け直し ============
print('--- 午前⇔午後の移動: ゲストを付け直す ---');
st=fresh();am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,0,2); // 3（月火5限=午前ホーム・木だけ指定で午後ゲスト）
tgMoveTo(1,0);
ok('午後の班へ移動・理由=手動',ids(pm.groups)==='4,5,3 | 7,9'&&st._reason[3]==='手動');
ok('PM側にあった3のゲスト(木)は消える',pm.guests.filter(function(x){return x.pid===3;}).length===0);
var g3am=am.guests.filter(function(x){return x.pid===3;});
ok('5限の曜日(月・火=午前)がAMのFW班へゲストとして付け直される',g3am.length===2&&g3am.map(function(x){return x.day;}).join(',')==='mon,tue'&&g3am.every(function(x){return x.gi===0;}));

// ============ C. 入替（午前⇔午後） ============
print('--- 選手同士の入替（午前⇔午後） ---');
st=fresh();am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,0,0);tgChipTap(1,0,0); // AMの1 ⇔ PMの4
ok('午前⇔午後で入替・両者の理由=手動',am.groups[0][0]===4&&pm.groups[0][0]===1&&st._reason[1]==='手動'&&st._reason[4]==='手動');
ok('入替えた2人のゲストを付け直す（1=5限3日→AMへ／4=指定3日とも午後→PMへ）',am.guests.filter(function(x){return x.pid===1;}).length===3&&pm.guests.filter(function(x){return x.pid===4;}).length===3);
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
// ゲストの移動は「表示中の曜日のゲストだけ」（見えていない曜日を動かさない）→ 3のゲスト(木)は木曜表示で操作する
st=fresh();pm=st.shifts[1];
tgChipTap(0,0,0);
ok('前提: 月曜表示で選手1を選択中',window._tgDay==='mon'&&st.sel&&st.sel.k==='m');
tgSetDay('thu');
ok('tgSetDay→選択解除（sel=null）・木曜表示に切替',st.sel===null&&window._tgDay==='thu'&&!has(main(),'選択中:')&&!has(main(),'tgMoveTo('));
tgGuestTap(1,0);
var hg=main();
ok('ゲストを選択→操作バー（未配置にする）・場所は「午後組・木のみ（ゲスト）」',st.sel.k==='g'&&has(hg,'選択中: F3')&&has(hg,'午後組・木のみ（ゲスト）')&&has(hg,'tgUnplaceGuest()'));
ok('ゲストの「ここへ」は同じ組(PM)の今の班以外だけ（木曜表示）',has(hg,'tgMoveTo(1,1)')&&!has(hg,'tgMoveTo(1,0)')&&!has(hg,'tgMoveTo(0,0)')&&!has(hg,'tgMoveTo(0,1)'));
tgMoveTo(0,0);
ok('別の組の班へは移せない（無視・選択は残る）',pm.guests[0].gi===0&&st.sel!==null);
// 別の曜日を表示したまま木曜のゲストを選んでいる（selを直接セット＝tgSetDayを経由しない異常系）
window._tgDay='mon';st.sel={k:'g',si:1,xi:0};V.tgroup();hg=main();
ok('月曜表示で木曜のゲストを選んだままでは「ここへ」がどの班にも出ない（tgCanDropもfalse）',has(hg,'選択中: F3')&&!has(hg,'tgMoveTo(')&&!tgCanDrop(st,1,1)&&!tgCanDrop(st,0,0));
tgMoveTo(1,1);
ok('…その状態で tgMoveTo(1,1) してもゲストのgiは変わらない（無視・選択は残る）',pm.guests[0].gi===0&&st.sel!==null);
tgSetDay('thu');
ok('木曜へ切替→選択解除',st.sel===null);
tgGuestTap(1,0);tgMoveTo(1,1);
ok('同じ組の別の班へゲスト移動',pm.guests[0].gi===1&&st.sel===null);
tgGuestTap(1,0);tgUnplaceGuest();
ok('未配置にする→gi=null',pm.guests[0].gi===null&&st.sel===null);
tgSetDay('mon');
ok('月曜表示では「木曜のゲスト未配置（N名）」カードは出ない',!has(main(),'曜のゲスト未配置（')&&!has(main(),'tgGuestTap('));
ok('組ヘッダのゲスト未配置は全曜日分（月曜表示でも午後組に「ゲスト未配置1件（木1）」・午前組には無し）',has(pmSect(main()),'ゲスト未配置1件（木1）')&&!has(amSect(main()),'ゲスト未配置'));
tgSetDay('thu');
ok('木曜表示で「木曜のゲスト未配置（1名）」に出る（タップ=tgGuestTap(1,0)）・組ヘッダ「ゲスト未配置1件（木1）」',has(main(),'木曜のゲスト未配置（1名）')&&has(sect(main(),'木曜のゲスト未配置（1名）'),'tgGuestTap(1,0)')&&has(pmSect(main()),'ゲスト未配置1件（木1）'));

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

// ============ J. 曜日表示（手作りの編成: 1が火曜だけ午後A班のゲスト） ============
print('--- 曜日表示: 火曜タブ（ゲストは行き先の班・ホーム班では薄く） ---');
// AM=[1,2,3]|[4,5]／PM=[6,7]・ゲスト{1,火,PMのA班}。重量: 1=120/180/220 2=118/175/215 3=100/150/190 6=90/130/160 7=88/128/158
function mkState(){
  return {mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
    shifts:[{key:'am',label:'午前',groups:[[1,2,3],[4,5]],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[6,7]],pool:[],guests:[{pid:1,day:'tue',gi:0}]}]};
}
D.tgroup=[];window._tgState=mkState();window._tgDay='tue';V.tgroup();
var h=main(),amS=amSect(h),pmS=pmSect(h),amA=sect(amS,'A班</span>','B班</span>'),pmA=sect(pmS,'A班</span>');
ok('前提: 組の見出し・A班カードが切り出せる',amS.length>0&&pmS.length>0&&amA.length>0&&pmA.length>0);
ok('曜日タブは3つ・選択中(火)だけaria-pressed="true"',count(h,"onclick=\"tgSetDay('")===3&&count(h,'aria-pressed="true"')===1&&has(h,'aria-pressed="true" onclick="tgSetDay(\'tue\')"'));
ok('組の見出しに「火曜」',has(amS,'>火曜</span>')&&has(pmS,'>火曜</span>'));
ok('午後A班に選手1のゲストチップ（「火のみ」・onclick tgGuestTap(1,0)）',has(pmA,'onclick="tgGuestTap(1,0)"')&&has(pmA,'>火のみ</span>')&&has(pmA,'F1'));
ok('午後A班の人数は3名（火のみ1）',has(pmA,'>3名（火のみ1）</span>'));
ok('午前A班では選手1が薄く（opacity）＋「火曜は → 午後 A班」',has(tagOf(amA,'tgChipTap(0,0,0)'),'opacity:.55')&&has(amA,'火曜は → 午後 A班'));
ok('午前A班の選手2/3は通常表示・元のindexのまま（tgChipTap(0,0,1)/(0,0,2)）',has(amA,'onclick="tgChipTap(0,0,1)"')&&!has(tagOf(amA,'tgChipTap(0,0,1)'),'opacity')&&has(amA,'onclick="tgChipTap(0,0,2)"')&&has(amA,'>2名</span>'));
ok('薄い表示は1件だけ・ゲストチップは午後だけ・午前に「のみ」印は無い',count(h,'opacity:.55')===1&&count(h,'tgGuestTap(')===1&&!has(amS,'のみ</span>'));
var TW=tgWeightsMap([1,2,3,4,5,6,7,8,9]);
ok('班内の最大差は「その日いる人」で計算（午前A=[2,3]・午後A=[6,7,1]）',has(amA,'班内の最大差 '+tgSpreadTxt(tgGroupSpread([2,3],TW)))&&has(pmA,'班内の最大差 '+tgSpreadTxt(tgGroupSpread([6,7,1],TW))));
ok('具体値: 午前A=BP18・SQ25・DL25(黄)／午後A=ゲスト込みBP32・SQ52・DL62(赤)',has(amA,'color:var(--amber)">BP18・SQ25・DL25')&&has(pmA,'color:var(--red)">BP32・SQ52・DL62'));

print('--- 曜日表示: 月曜タブ（ゲスト無し＝全員ホーム班） ---');
window._tgDay='mon';V.tgroup();
h=main();amS=amSect(h);pmS=pmSect(h);amA=sect(amS,'A班</span>','B班</span>');pmA=sect(pmS,'A班</span>');
ok('月曜: ゲストチップは出ず選手1は午前A班に通常表示',!has(h,'tgGuestTap(')&&!has(h,'のみ</span>')&&has(amA,'onclick="tgChipTap(0,0,0)"')&&!has(tagOf(amA,'tgChipTap(0,0,0)'),'opacity')&&!has(h,'曜は →'));
ok('月曜: 午前A=3名・午後A=2名・最大差は全員で（BP20・SQ30・DL30赤／BP2・SQ2・DL2緑）',has(amA,'>3名</span>')&&has(pmA,'>2名</span>')&&has(amA,'color:var(--red)">BP20・SQ30・DL30')&&has(pmA,'color:var(--green)">BP2・SQ2・DL2'));
ok('月曜タブがaria-pressed',has(h,'aria-pressed="true" onclick="tgSetDay(\'mon\')"')&&count(h,'aria-pressed="true"')===1);

print('--- tgSetDay ---');
tgSetDay('thu');
ok('tgSetDay(thu)→window._tgDay=thu・再描画（木タブ選択・見出し「木曜」）',window._tgDay==='thu'&&has(main(),'aria-pressed="true" onclick="tgSetDay(\'thu\')"')&&has(main(),'>木曜</span>'));
tgSetDay('xxx');
ok('不正な曜日は無視（thuのまま）',window._tgDay==='thu'&&has(main(),'aria-pressed="true" onclick="tgSetDay(\'thu\')"'));
ok('木曜: 火曜のゲストは出ない（1は午前A班に通常表示）',!has(main(),'tgGuestTap(')&&!has(tagOf(amSect(main()),'tgChipTap(0,0,0)'),'opacity'));

print('--- 曜日表示: その曜日のゲスト未配置（gi:null）はその曜日だけ ---');
// 午後組のゲスト: xi0={1,火,A班}／xi1={2,木,未配置}／xi2={3,月,未配置}
window._tgState=mkState();window._tgState.shifts[1].guests.push({pid:2,day:'thu',gi:null},{pid:3,day:'mon',gi:null});
window._tgDay='thu';V.tgroup();
h=main();amA=sect(amSect(h),'A班</span>','B班</span>');
ok('木曜: 「木曜のゲスト未配置（1名）」に選手2（tgGuestTap(1,1)）だけ（月曜の3は出ない）',has(h,'木曜のゲスト未配置（1名）')&&has(sect(h,'木曜のゲスト未配置（1名）'),'onclick="tgGuestTap(1,1)"')&&!has(h,'tgGuestTap(1,2)')&&count(h,'曜のゲスト未配置（')===1);
ok('組ヘッダのゲスト未配置は全曜日分「ゲスト未配置2件（月1・木1）」（午後組だけ）',has(pmSect(h),'ゲスト未配置2件（月1・木1）')&&!has(amSect(h),'ゲスト未配置'));
ok('木曜: 午前A班で選手2は薄く「木曜は → 午後 未配置」・選手1/3は通常',has(tagOf(amA,'tgChipTap(0,0,1)'),'opacity:.55')&&has(amA,'木曜は → 午後 未配置')&&!has(tagOf(amA,'tgChipTap(0,0,0)'),'opacity')&&!has(tagOf(amA,'tgChipTap(0,0,2)'),'opacity'));
window._tgDay='tue';V.tgroup();h=main();
ok('火曜タブには月/木曜のゲスト未配置カードは出ない（火曜のゲスト1だけ）・組ヘッダは全曜日分のまま',!has(h,'曜のゲスト未配置（')&&!has(h,'tgGuestTap(1,1)')&&!has(h,'tgGuestTap(1,2)')&&has(h,'tgGuestTap(1,0)')&&has(pmSect(h),'ゲスト未配置2件（月1・木1）'));
window._tgDay='mon';V.tgroup();h=main();
ok('月曜タブ: 「月曜のゲスト未配置（1名）」に選手3（tgGuestTap(1,2)）だけ',has(h,'月曜のゲスト未配置（1名）')&&has(sect(h,'月曜のゲスト未配置（1名）'),'onclick="tgGuestTap(1,2)"')&&!has(h,'tgGuestTap(1,1)')&&count(h,'曜のゲスト未配置（')===1);

print('--- 分割なし(single)は曜日タブ無し ---');
window._tgState={mode:'single',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,shifts:[{key:'all',label:'',groups:[[1,2],[3]],pool:[],guests:[]}]};
window._tgDay='tue';V.tgroup();h=main();
ok('曜日タブ・「表示する曜日」・薄い表示が無く全員通常表示',!has(h,'tgSetDay(')&&!has(h,'表示する曜日')&&!has(h,'opacity:.55')&&has(h,'onclick="tgChipTap(0,0,0)"')&&has(h,'onclick="tgChipTap(0,1,0)"'));

print('--- 操作バー: ゲスト選択中の場所に「火のみ」 ---');
window._tgState=mkState();window._tgDay='tue';tgGuestTap(1,0);h=main();
ok('「選択中: F1」＋「午後組・火のみ（ゲスト）」＋未配置にする',has(h,'選択中: F1')&&has(h,'午後組・火のみ（ゲスト）')&&has(h,'tgUnplaceGuest()'));
ok('選択中のゲストチップは紫（選択色）',has(tagOf(h,'tgGuestTap(1,0)'),'background:var(--purple)'));
tgClearSel();

print('--- 曜日表示中でも tgMoveTo / tgGuestTap / tgChipTap は従来どおり ---');
window._tgState=mkState();window._tgDay='tue';st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,0,1);tgMoveTo(0,1);
ok('tgMoveTo: 選手2を午前B班へ（火曜表示中）',ids(am.groups)==='1,3 | 4,5,2'&&st.sel===null);
tgAddGroup(1);tgGuestTap(1,0);h=main();
ok('空の班にはゲストの「ここへ」が出ない（午後B班=空）・tgCanDropもfalse',st.sel&&st.sel.k==='g'&&!has(h,'tgMoveTo(1,1)')&&!has(h,'tgMoveTo(1,0)')&&!tgCanDrop(st,1,1));
tgMoveTo(1,1);
ok('…空の班へ tgMoveTo してもゲストのgiは変わらない（選択は残る）',pm.guests[0].gi===0&&st.sel!==null);
tgChipTap(0,0,1);h=main();
ok('班の選手（午前A班の3）を選択中は空の班にも「ここへ」',st.sel.k==='m'&&has(h,'tgMoveTo(1,1)')&&tgCanDrop(st,1,1));
tgClearSel();st.shifts[0].pool=[8];tgPoolTap(0,0);h=main();
ok('未配置の人（8）を選択中も空の班に「ここへ」',st.sel.k==='p'&&has(h,'tgMoveTo(1,1)')&&tgCanDrop(st,1,1));
st.shifts[0].pool=[];tgClearSel();
tgChipTap(1,0,1);tgMoveTo(1,1); // 午後A班の7を空のB班へ（班の選手は空の班へ入れられる）
ok('班の選手7を空の午後B班へ移動',ids(pm.groups)==='6 | 7'&&st.sel===null);
tgGuestTap(1,0);tgMoveTo(1,1);
ok('tgGuestTap→tgMoveTo: ゲスト1を（空でなくなった）午後B班へ',pm.guests[0].gi===1&&st.sel===null);
h=main();pmS=pmSect(h);
ok('火曜表示: ゲストチップは午後B班に移り、A班からは消える',has(sect(pmS,'B班</span>'),'onclick="tgGuestTap(1,0)"')&&!has(sect(pmS,'A班</span>','B班</span>'),'tgGuestTap('));
tgChipTap(0,0,0);tgChipTap(1,0,0); // 薄い表示の1（午前A班）⇔ 午後A班の6
ok('tgChipTap: 薄い表示の選手1をタップ→午後の6と入替（理由=手動・ゲストを付け直す）',am.groups[0][0]===6&&pm.groups[0][0]===1&&st._reason[1]==='手動'&&st._reason[6]==='手動'&&am.guests.filter(function(x){return x.pid===1;}).length===3&&pm.guests.filter(function(x){return x.pid===1;}).length===0);

// ============ K. 未配置から同じ組の班へ入れた人にも申告/指定どおりのゲストを付ける ============
print('--- 未配置→同じ組の班: ゲストを付ける（tgMoveTo / tgPoolTap入替 / tgChipTap入替） ---');
// 10=午前がいい＋火曜だけスタッフ指定で午後（→午前ホーム・火曜だけ午後組のゲスト）。記録あり（FW）＝午後のFW班[4,5]へ付く
D.p.push({id:10,name:'F10',position:'PR',wg:{f5:[],far:false,pref:'am',upd:__U,ov:{mon:'',tue:'pm',thu:''},ovUpd:__U}});
D.tlog=D.tlog.concat([tl('l10',10,105,155,195)]); // 配列を差し替える（tlogAllはD.tlogの参照でキャッシュ＝本番のonSnapshotと同じ）
function mkPoolState(){
  return {mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
    shifts:[{key:'am',label:'午前',groups:[[1,2],[6]],pool:[10],guests:[]},{key:'pm',label:'午後',groups:[[4,5],[7,9]],pool:[],guests:[]}]};
}
function g10(sh){return (sh.guests||[]).filter(function(x){return x.pid===10;});}
window._tgDay='mon';window._tgState=mkPoolState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
ok('前提: 未配置の10にはゲスト行が無い',g10(am).length===0&&g10(pm).length===0);
tgPoolTap(0,0);tgMoveTo(0,0);
ok('tgMoveTo: 未配置10を午前A班へ（同じ組）→配置・ピン',ids(am.groups)==='1,2,10 | 6'&&am.pool.length===0&&st.pinned.join()==='10'&&st.sel===null);
ok('…午後組に火曜のゲスト行 {pid:10,day:tue,gi:0(FW班)} が付く・午前組には付かない',g10(pm).length===1&&g10(pm)[0].day==='tue'&&g10(pm)[0].gi===0&&g10(am).length===0);
ok('…同じ組内なので振分理由は「手動」にしない',st._reason[10]!=='手動');
window._tgDay='tue';V.tgroup();h=main();
ok('…火曜表示: 午後A班に10のゲストチップ（火のみ）・午前A班では薄く「火曜は → 午後 A班」',has(sect(pmSect(h),'A班</span>','B班</span>'),'F10')&&has(sect(pmSect(h),'A班</span>','B班</span>'),'>火のみ</span>')&&has(tagOf(amSect(h),'tgChipTap(0,0,2)'),'opacity:.55')&&has(amSect(h),'火曜は → 午後 A班'));
window._tgDay='mon';
window._tgState=mkPoolState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,1,0);tgPoolTap(0,0); // 班の6を選択中に未配置10をタップ＝入替
ok('tgPoolTap入替: 10が午前B班・6が未配置（10ピン）',ids(am.groups)==='1,2 | 10'&&am.pool.join()==='6'&&st.pinned.join()==='10');
ok('…午後組に10の火曜ゲスト行が1件付く',g10(pm).length===1&&g10(pm)[0].day==='tue'&&g10(am).length===0);
window._tgState=mkPoolState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
tgPoolTap(0,0);tgChipTap(0,1,0); // 未配置10を選択中に班の6をタップ＝入替
ok('tgChipTap入替: 10が午前B班・6が未配置（10ピン）',ids(am.groups)==='1,2 | 10'&&am.pool.join()==='6'&&st.pinned.join()==='10');
ok('…午後組に10の火曜ゲスト行が1件付く',g10(pm).length===1&&g10(pm)[0].day==='tue'&&g10(am).length===0);
tgChipTap(0,1,0);tgMoveTo(0,0);
ok('班の選手どうしの同じ組内移動ではゲストは重複しない（1件のまま）',ids(am.groups)==='1,2,10 | '&&g10(pm).length===1);

// ============ L. 操作バーの組ラベルはescape ============
print('--- 操作バー: sh.label をescape ---');
window._tgDay='mon';
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
  shifts:[{key:'am',label:'<b>x</b>',groups:[[1,2]],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[4,5]],pool:[],guests:[]}]};
tgChipTap(0,0,0);h=main();
var bar=tgActionBarHtml(window._tgState);
ok('操作バーの場所表示は「&lt;b&gt;x&lt;/b&gt;組・A班」（生タグが出ない）',has(bar,'&lt;b&gt;x&lt;/b&gt;組・A班')&&!has(bar,'<b>x</b>'));
ok('画面全体にも生の<b>x</b>が出ない',has(h,'&lt;b&gt;')&&!has(h,'<b>x</b>'));
tgClearSel();

// ============ M. 未配置へ出した選手のゲスト行を消す（tgDropGuests）・生成/読み込みで整理（tgPruneGuests） ============
print('--- 未配置へ戻す（tgToPool）: その選手のゲスト行を全組から消す ---');
function J(x){return JSON.stringify(x);}
function gOf(s0,pid){var n=0;s0.shifts.forEach(function(sh){(sh.guests||[]).forEach(function(x){if(x&&idEq(x.pid,pid))n++;});});return n;}
// AM=[1,2,3]|[6]・未配置[10]／PM=[4,5]|[7,9]。ゲスト行: AM {4,月,A班}／PM {3,木,A班}・{1,火,A班}
function mkGuestState(){
  return {mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
    shifts:[{key:'am',label:'午前',groups:[[1,2,3],[6]],pool:[10],guests:[{pid:4,day:'mon',gi:0}]},
            {key:'pm',label:'午後',groups:[[4,5],[7,9]],pool:[],guests:[{pid:3,day:'thu',gi:0},{pid:1,day:'tue',gi:0}]}]};
}
D.tgroup=[];window._tgDay='thu';window._tgState=mkGuestState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
V.tgroup();
ok('前提: 木曜は午後A班に3のゲストチップ（tgGuestTap(1,0)）',has(sect(pmSect(main()),'A班</span>','B班</span>'),'F3')&&has(pmSect(main()),'onclick="tgGuestTap(1,0)"'));
tgChipTap(0,0,2);tgToPool();
ok('3を未配置へ→午前の未配置[10,3]・選択解除',ids(am.groups)==='1,2 | 6'&&am.pool.join()==='10,3'&&st.sel===null);
ok('…3のゲスト行は全組から消える・他の人の行(4の月/1の火)はそのまま',gOf(st,3)===0&&J(am.guests)===J([{pid:4,day:'mon',gi:0}])&&J(pm.guests)===J([{pid:1,day:'tue',gi:0}]));
h=main();
ok('…木曜表示: 午後組に3が出ない・ゲスト未配置の表示も無い・3は午前の未配置カード（tgPoolTap(0,1)）',!has(pmSect(h),'F3')&&!has(pmSect(h),'tgGuestTap(')&&!has(h,'曜のゲスト未配置（')&&!has(amSect(h),'ゲスト未配置')&&!has(pmSect(h),'ゲスト未配置')&&has(amSect(h),'onclick="tgPoolTap(0,1)"'));
window._tgState=mkGuestState();st=window._tgState;st.shifts[0].guests.push({pid:1,day:'mon',gi:1}); // 異常データ: 1のホーム組(午前)を指す行も持っている
tgChipTap(0,0,0);tgToPool();
ok('ホーム組を指す異常な行も含め、1の行は両方の組から消える（3・4の行は残る）',gOf(st,1)===0&&gOf(st,3)===1&&gOf(st,4)===1&&st.shifts[0].pool.join()==='10,1');

print('--- 未配置⇔班の選手の入替: 未配置に出た人の行を消し、入った人は申告/指定どおり付ける ---');
window._tgState=mkGuestState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
tgPoolTap(0,0);tgChipTap(0,0,2); // 未配置10を選択中に班の3をタップ
ok('tgChipTap入替: 10が午前A班・3が未配置（10ピン）',ids(am.groups)==='1,2,10 | 6'&&am.pool.join()==='3'&&st.pinned.join()==='10');
ok('…未配置に出た3のゲスト行(木)は消える',gOf(st,3)===0);
ok('…入った10は申告/指定どおり午後組に火曜の行（FW班=A班）が1件・午前組には無し',J(pm.guests.filter(function(x){return x.pid===10;}))===J([{pid:10,day:'tue',gi:0}])&&am.guests.every(function(x){return x.pid!==10;}));
ok('…関係ない1(火)・4(月)の行はそのまま（午後組=[1火, 10火]）',J(am.guests)===J([{pid:4,day:'mon',gi:0}])&&J(pm.guests)===J([{pid:1,day:'tue',gi:0},{pid:10,day:'tue',gi:0}]));
window._tgState=mkGuestState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];
tgChipTap(0,0,0);tgPoolTap(0,0); // 班の1を選択中に未配置10をタップ
ok('tgPoolTap入替: 10が午前A班の先頭・1が未配置（10ピン）',ids(am.groups)==='10,2,3 | 6'&&am.pool.join()==='1'&&st.pinned.join()==='10');
ok('…未配置に出た1のゲスト行(火)は消える・入った10に午後組の火曜の行・3(木)/4(月)の行はそのまま',gOf(st,1)===0&&J(pm.guests)===J([{pid:3,day:'thu',gi:0},{pid:10,day:'tue',gi:0}])&&J(am.guests)===J([{pid:4,day:'mon',gi:0}]));
window._tgState=mkGuestState();st=window._tgState;am=st.shifts[0];pm=st.shifts[1];pm.pool=[8];
tgChipTap(0,0,2);tgPoolTap(1,0); // 午前A班の3を選択中に午後の未配置8をタップ（組をまたぐ入替）
ok('組をまたぐ入替: 8が午前A班・3が午後の未配置（8ピン・8の理由=手動）',ids(am.groups)==='1,2,8 | 6'&&pm.pool.join()==='3'&&st.pinned.join()==='8'&&st._reason[8]==='手動');
ok('…3の行は消える・8は3日とも午前なので行なし・1/4の行はそのまま',gOf(st,3)===0&&gOf(st,8)===0&&gOf(st,1)===1&&gOf(st,4)===1);

print('--- 自動で組む: 未配置になった人（記録なし）のゲスト行は残さない ---');
D.p.push({id:11,name:'F11',position:'LO',wg:AM2PM1}); // 記録なし＝未配置。月火は5限(午前ホーム)＋木だけ午後の指定
var W11=tgWeightsMap([11]),as11=tgAutoAssignShifts([11],W11,tgMedians([11],W11),{});
ok('前提: 11は午前ホーム・木曜は午後組のゲスト候補（整理しなければ行が付く）',as11.am.join()==='11'&&J(as11.guests)===J([{pid:11,home:'am',days:['thu']}]));
st=fresh();am=st.shifts[0];pm=st.shifts[1];
ok('11は午前の未配置',am.pool.indexOf(11)>=0);
ok('…11のゲスト行はどの組にも無い',gOf(st,11)===0);
ok('…未配置にいる人は誰もゲスト行を持たない',st.shifts.every(function(sh){return sh.pool.every(function(pid){return gOf(st,pid)===0;});}));
ok('…班にいる人のゲスト行は残る（3=木・10=火が午後組）',pm.guests.some(function(x){return x.pid===3&&x.day==='thu'&&x.gi!=null;})&&pm.guests.some(function(x){return x.pid===10&&x.day==='tue'&&x.gi!=null;}));
ok('…残った行は全員どこかの班にいて、行の組はホーム組ではない',st.shifts.every(function(sh,si){return sh.guests.every(function(x){return st.shifts.some(function(s2,s2i){return s2i!==si&&s2.groups.some(function(g){return g.indexOf(x.pid)>=0;});});});}));
window._tgDay='thu';V.tgroup();h=main();
ok('…木曜表示: 11は午後組に出ない・ゲスト未配置の表示も無い',!has(pmSect(h),'F11')&&!has(h,'曜のゲスト未配置（')&&!has(pmSect(h),'ゲスト未配置'));
tgPoolTap(0,am.pool.indexOf(11));tgMoveTo(0,0);
ok('…11を班へ入れる→木曜の行が付く（記録なし＝行き先は班未定 gi:null）',am.groups.some(function(g){return g.indexOf(11)>=0;})&&J(pm.guests.filter(function(x){return x.pid===11;}))===J([{pid:11,day:'thu',gi:null}]));
h=main();
ok('…木曜表示: 「木曜のゲスト未配置（1名）」に11',has(h,'木曜のゲスト未配置（1名）')&&has(sect(h,'木曜のゲスト未配置（1名）'),'F11'));
D.p.pop();

print('--- 読み込み（tgStateFromRecord / tgInit）: 班にいない人の行・ホーム組を指す行を落とす ---');
var recP={id:4000,ts:4000,date:daysAgo(1),by:'staff',mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],
  shifts:[{key:'am',label:'午前',groups:[[1,2],[6]],guests:[{pid:4,day:'mon',gi:0},{pid:1,day:'tue',gi:1},{pid:3,day:'thu',gi:null}]},
          {key:'pm',label:'午後',groups:[[4,5],[7,9]],guests:[{pid:1,day:'thu',gi:0},{pid:3,day:'tue',gi:1},{pid:2,day:'mon',gi:null},{pid:4,day:'tue',gi:0},{pid:999,day:'mon',gi:0}]}]};
var recJ=J(recP);
st=tgStateFromRecord(recP);
ok('午前組: 4(月・A班)だけ残る（1=ホーム組を指す行・3=班にいない人の行は落ちる）',J(st.shifts[0].guests)===J([{pid:4,day:'mon',gi:0}]));
ok('午後組: 1(木・A班)・2(月・未定)だけ残る（3=班にいない・4=ホーム組・999=名簿外は落ちる）',J(st.shifts[1].guests)===J([{pid:1,day:'thu',gi:0},{pid:2,day:'mon',gi:null}]));
ok('保存レコード(D.tgroupの中身)は書き換えない',J(recP)===recJ);
window._tgState=undefined;D.tgroup=[recP];tgInit(true);st=window._tgState;
ok('tgInit(true)経由でも同じ行が残る',J(st.shifts[0].guests)===J([{pid:4,day:'mon',gi:0}])&&J(st.shifts[1].guests)===J([{pid:1,day:'thu',gi:0},{pid:2,day:'mon',gi:null}])&&J(recP)===recJ);
ok('…3は申告どおり午前の未配置へ補われ、ゲスト行は持たない',st.shifts[0].pool.indexOf(3)>=0&&gOf(st,3)===0);
D.tgroup=[];window._tgDay='tue';V.tgroup();h=main();
ok('…火曜表示: 3は午後組に出ない（ゲストチップ無し）・組ヘッダは午後だけ「ゲスト未配置1件（月1）」',!has(pmSect(h),'F3')&&!has(pmSect(h),'tgGuestTap(')&&has(pmSect(h),'ゲスト未配置1件（月1）')&&!has(amSect(h),'ゲスト未配置'));

// ============ N. 空の班を指すゲストは班未定扱い ============
print('--- 空の班を指すゲスト: その曜日のゲスト未配置に出る・空の班カードに出ない・組ヘッダに数える ---');
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
  shifts:[{key:'am',label:'午前',groups:[[1,2,3],[4,5]],pool:[],guests:[]},{key:'pm',label:'午後',groups:[[6],[7]],pool:[],guests:[{pid:1,day:'tue',gi:1}]}]};
st=window._tgState;pm=st.shifts[1];window._tgDay='tue';V.tgroup();
function pmB(html){return sect(pmSect(html),'B班</span>','tgAddGroup(1)');}
ok('前提: 火曜は午後B班に1のゲストチップ・ゲスト未配置の表示なし',has(pmB(main()),'onclick="tgGuestTap(1,0)"')&&!has(main(),'曜のゲスト未配置（')&&!has(pmSect(main()),'ゲスト未配置'));
tgChipTap(1,1,0);tgMoveTo(1,0); // 午後B班の7をA班へ→B班が空
h=main();
ok('7をA班へ→午後B班は空・ゲストのgiは1のまま（データは書き換えない）',ids(pm.groups)==='6,7 | '&&pm.guests[0].gi===1);
ok('…「火曜のゲスト未配置（1名）」に1（tgGuestTap(1,0)）',has(h,'火曜のゲスト未配置（1名）')&&has(sect(h,'火曜のゲスト未配置（1名）'),'onclick="tgGuestTap(1,0)"'));
ok('…空の午後B班カードは「空の班」でチップ無し（0名）',has(pmB(h),'空の班')&&!has(pmB(h),'tgGuestTap(')&&!has(pmB(h),'F1')&&has(pmB(h),'>0名</span>'));
ok('…ゲストチップは画面に1つだけ（未配置カード）',count(h,'tgGuestTap(1,0)')===1);
ok('…組ヘッダ「ゲスト未配置1件（火1）」（午後だけ）',has(pmSect(h),'ゲスト未配置1件（火1）')&&!has(amSect(h),'ゲスト未配置'));
ok('…午前A班で1は薄く「火曜は → 午後 未配置」',has(tagOf(amSect(h),'tgChipTap(0,0,0)'),'opacity:.55')&&has(amSect(h),'火曜は → 午後 未配置'));
window._tgDay='mon';V.tgroup();h=main();
ok('…月曜表示: ゲスト未配置カードは出ない・組ヘッダは「ゲスト未配置1件（火1）」のまま',!has(h,'曜のゲスト未配置（')&&has(pmSect(h),'ゲスト未配置1件（火1）'));
window._tgDay='tue';
tgChipTap(1,0,1);tgMoveTo(1,1); // 7をB班へ戻す→行き先が復活
h=main();
ok('B班に人が戻る→1のゲストチップは午後B班に戻り、ゲスト未配置の表示は消える',ids(pm.groups)==='6 | 7'&&has(pmB(h),'onclick="tgGuestTap(1,0)"')&&!has(h,'曜のゲスト未配置（')&&!has(pmSect(h),'ゲスト未配置'));
tgChipTap(1,1,0);tgMoveTo(1,0); // もう一度B班を空に
tgGuestTap(1,0);h=main();
ok('空の班を指すゲストを選択→「ここへ」はA班だけ（空のB班には出ない）',st.sel&&st.sel.k==='g'&&has(h,'tgMoveTo(1,0)')&&!has(h,'tgMoveTo(1,1)'));
tgMoveTo(1,0);h=main();
ok('…A班へ配置→gi=0・ゲスト未配置の表示が消え、午後A班にゲストチップ',pm.guests[0].gi===0&&st.sel===null&&!has(h,'曜のゲスト未配置（')&&!has(pmSect(h),'ゲスト未配置')&&has(sect(pmSect(h),'A班</span>','B班</span>'),'onclick="tgGuestTap(1,0)"'));
window._tgDay='mon';

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_ui tests failed');}
print('\nALL TGROUP-UI TESTS PASSED');
