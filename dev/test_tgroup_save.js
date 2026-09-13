// ウエイトグループ分けv2 フェーズ5: 保存履歴・保存の取り消し・お知らせ・履歴の読み込み（staff）
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_tgroup_save.js
// 仕様（dev/audit/PLAN_tgroup_v2.md #13/#14）:
//  - tgroupは直近5件の履歴（末尾=最新＝選手に公開）。保存直後のトーストで取り消し（今回の記録とお知らせを削除）
//  - 「お知らせも投稿する」既定ON→annへチーム宛て（targetPid:null）。OFFなら投稿しない（再描画してもOFFを保持）
//  - 保存失敗はalert＋ボタン復帰（編成は画面に残る）。updateFnが再実行されても同じ記録は1件
//  - 保存履歴: 新しい順・公開中は最新だけ・「読み込む」「引き継いで組み直す」（人数/FW/BK/除外/ピンを引き継ぐ）・Undo
//  - 保存済み編成の読み込み時、編成に居ない対象選手は申告どおりの組の未配置へ（画面から消えない）
//  - 保存済み編成カード（tgSavedCardHtml）は曜日タブ（月/火/木・tgSetDay）でその曜日の班構成を表示（2026-09-13改訂）:
//    その曜日のゲストは行き先の班に「火のみ」印で出て、ホーム班では薄く「→ 午後 B班」。他の曜日には出ない。分割なし(single)は曜日タブ無し
//  - 申告 p.wg は新モデル {f5:[5限の曜日],far,pref,upd, ov:{mon,tue,thu:'am'|'pm'|''},ovUpd}（wgNorm で読む）
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
// 申告フィクスチャ（新モデル）: AM3=3日とも5限あり→午前ホーム(5限)／PM3=スタッフ指定が3日とも午後→午後ホーム(指定)／
// F3=月火は5限(午前ホーム)＋木だけスタッフ指定で午後→木曜だけ午後組のゲスト
var __U=new Date(Date.now()-3*86400000).toISOString();
var AM3={f5:['mon','tue','thu'],far:false,pref:null,upd:__U};
var PM3={f5:[],far:false,pref:null,upd:__U,ov:{mon:'pm',tue:'pm',thu:'pm'},ovUpd:__U};
var AM2PM1={f5:['mon','tue'],far:false,pref:null,upd:__U,ov:{mon:'',tue:'',thu:'pm'},ovUpd:__U};
D.p=[
  {id:1,name:'F1',position:'PR',wg:AM3},{id:2,name:'F2',position:'HO',wg:AM3},{id:3,name:'F3',position:'LO',wg:AM2PM1},
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
var gPM=(tg[0].shifts[1]||{}).guests||[];
ok('保存レコードのゲスト形は従来のまま（F3=木だけ午後 → 午後組 guests:[{pid:3,day:"thu",gi}]）',tg[0].shifts[0].guests.length===0&&gPM.length===1&&gPM[0].pid===3&&gPM[0].day==='thu'&&typeof gPM[0].gi==='number'&&gPM[0].gi<tg[0].shifts[1].groups.length);
ok('F3のホームは午前組（5限）・午後組の班には居ない',tg[0].shifts[0].groups.some(function(g){return g.indexOf(3)>=0;})&&!tg[0].shifts[1].groups.some(function(g){return g.indexOf(3)>=0;}));
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

// ============ J. 保存済みカードの曜日表示（曜日タブ・火のみ・→ 午後 B班） ============
print('--- 保存済みカード: 曜日タブとその曜日の班構成 ---');
var GCARD='<div style="border:1px solid var(--border-tertiary);border-radius:10px;padding:7px 10px;min-width:118px">'; // 班カードの先頭（AM A,AM B,PM A,PM B の順）
function gcards(html){return String(html).split(GCARD).slice(1);}
function pressed(html,day){return has(html,'aria-pressed="true" onclick="tgSetDay(\''+day+'\')"');}
// 最新レコード: 午前[F1,F2,F3][B6,B8]・午後[F4,F5][B7,B9]・F3は火曜だけ午後B班のゲスト
var recG={id:3000,ts:3000,date:daysAgo(1),by:'staff',mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],
  shifts:[{key:'am',label:'午前',groups:[[1,2,3],[6,8]],guests:[]},{key:'pm',label:'午後',groups:[[4,5],[7,9]],guests:[{pid:3,day:'tue',gi:1}]}]};
D.tgroup=[old[0],recG];window._tgSavedOpen=undefined;
window._tgDay='tue';
var cT=tgSavedCardHtml(),kT=gcards(cT);
ok('曜日タブ（月/火/木→tgSetDay）がカード内・火が選択中',has(cT,'表示する曜日')&&has(cT,"tgSetDay('mon')")&&has(cT,"tgSetDay('thu')")&&pressed(cT,'tue')&&!pressed(cT,'mon')&&!pressed(cT,'thu'));
ok('組の見出しに曜日（午前組 火曜／午後組 火曜）',has(cT,'午前組 <span')&&cT.split('火曜</span>').length-1===2);
ok('班カードは4枚（AM A/B・PM A/B）',kT.length===4&&has(kT[0],'A班')&&has(kT[1],'B班')&&has(kT[2],'A班')&&has(kT[3],'B班'));
ok('火: 午後B班にF3が「火のみ」印で出る（3名）',has(kT[3],'F3')&&has(kT[3],'火のみ')&&has(kT[3],'>3名<')&&has(kT[3],'B7')&&has(kT[3],'B9'));
ok('火: ホームの午前A班ではF3は薄く「→ 午後 B班」（人数は2名）',has(kT[0],'F3')&&has(kT[0],'→ 午後 B班')&&has(kT[0],'opacity:.55')&&has(kT[0],'>2名<'));
ok('火: 他の班に印は出ない',!has(kT[1],'火のみ')&&!has(kT[2],'火のみ')&&!has(kT[2],'F3')&&!has(kT[1],'→ ')&&!has(kT[3],'→ '));
ok('「火のみ」「→ 午後」はカード全体で1回ずつ',cT.split('火のみ').length-1===1&&cT.split('→ 午後').length-1===1);
window._tgDay='mon';
var cM=tgSavedCardHtml(),kM=gcards(cM);
ok('月: 印は出ない（火のみ／→ 午後 なし）・月が選択中',!has(cM,'火のみ')&&!has(cM,'→ 午後')&&!has(cM,'opacity:.55')&&pressed(cM,'mon')&&!pressed(cM,'tue'));
ok('月: F3は午前A班に通常表示（3名）・午後B班は2名でF3なし',has(kM[0],'F3')&&has(kM[0],'>3名<')&&!has(kM[3],'F3')&&has(kM[3],'>2名<'));
ok('月: 見出しは月曜',cM.split('月曜</span>').length-1===2&&!has(cM,'火曜</span>'));
window._tgDay='thu';
var cH=tgSavedCardHtml();
ok('木: 火曜ゲストは出ない・木が選択中',!has(cH,'火のみ')&&!has(cH,'→ 午後')&&pressed(cH,'thu'));
// ゲスト未配置（gi:null）はその曜日だけ「ゲスト未配置」に出て、ホーム班では「→ 午後 未配置」
recG.shifts[1].guests=[{pid:3,day:'tue',gi:null}];
window._tgDay='tue';
var cU=tgSavedCardHtml(),kU=gcards(cU);
ok('火: ゲスト未配置は「火曜のゲスト未配置: F3」・ホーム班では「→ 午後 未配置」',has(cU,'火曜のゲスト未配置: F3')&&has(kU[0],'→ 午後 未配置')&&!has(cU,'火のみ'));
window._tgDay='mon';
ok('月: ゲスト未配置の表示なし',!has(tgSavedCardHtml(),'ゲスト未配置'));
recG.shifts[1].guests=[{pid:3,day:'tue',gi:1}];
// 分割なし(single)のレコード: 曜日タブ無し・班はそのまま
var recS={id:3001,ts:3001,date:daysAgo(1),by:'staff',mode:'single',size:3,splitUnit:true,excluded:[],pinned:[],
  shifts:[{key:'all',label:'',groups:[[1,2,3],[4,5]],guests:[]}]};
D.tgroup=[recG,recS];window._tgDay='tue';
var cS=tgSavedCardHtml(),kS=gcards(cS);
ok('分割なし: 曜日タブ無し・「分割なし」表示・班2枚に全員',!has(cS,'tgSetDay')&&!has(cS,'表示する曜日')&&has(cS,'分割なし')&&kS.length===2&&has(kS[0],'F3')&&has(kS[0],'>3名<')&&has(kS[1],'F5')&&!has(cS,'火のみ')&&!has(cS,'曜</span>'));
ok('分割なし: 履歴は2件（新しい順で single が公開中）',has(cS,'履歴2件')&&cS.split('>公開中<').length-1===1&&has(cS,"tgLoadRecord('3001',false)")&&has(cS,"tgLoadRecord('3000',true)"));
// 名簿に居ないpid（退部者など）は行を出さず落ちない
D.tgroup=[{id:3002,ts:3002,date:daysAgo(1),by:'staff',mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],
  shifts:[{key:'am',label:'午前',groups:[[1,999]],guests:[]},{key:'pm',label:'午後',groups:[[4]],guests:[{pid:998,day:'tue',gi:0},{pid:999,day:'tue',gi:null}]}]}];
var cX=tgSavedCardHtml();
ok('名簿に居ないpidは表示せず落ちない（F1/F4は出る）',has(cX,'F1')&&has(cX,'F4')&&!has(cX,'999')&&!has(cX,'998'));

// ============ K. 表示する曜日の状態（tgDay/tgSetDay） ============
print('--- 表示する曜日: 既定は今日から・tgSetDayで再描画 ---');
window._tgDay=undefined;
ok('未設定なら今日からの既定（tgDefaultDay）',tgDay()===tgDefaultDay()&&tgIsDay(tgDay()));
window._tgDay='xyz';
ok('不正な値は既定に戻す',tgDay()===tgDefaultDay());
D.tgroup=[recG];window._tgState=undefined;curPage='tgroup';viewStack=[];__els['main-ct'].innerHTML='';
tgSetDay('thu');
ok('tgSetDay: 記憶して再描画（木が選択中・保存済みカードも木）',window._tgDay==='thu'&&pressed(main(),'thu')&&!pressed(main(),'tue'));
tgSetDay('tue');
ok('tgSetDay: 火に切替→保存済みカードに「火のみ」が出る',window._tgDay==='tue'&&pressed(main(),'tue')&&has(main(),'火のみ')&&has(main(),'→ 午後 B班'));
tgSetDay('xyz');
ok('tgSetDay: 不正な曜日は無視',window._tgDay==='tue');
// 編集中の結果（tgInitで最新レコードを読み込んだ状態）も同じ曜日タブ・同じ印
ok('編集中の結果も火曜表示: ゲストチップ「火のみ」（tgGuestTap）と薄い「火曜は → 午後 B班」',has(main(),'tgGuestTap(1,0)')&&has(main(),'火曜は → 午後 B班'));
window._tgDay=undefined;

// ============ L. 保存: ゲスト行の整理（tgPruneGuests）・空の班を指すゲスト=gi:null・トーストの件数 ============
print('--- 保存: 班にいない人の行を落とす・空の班を指すゲストはgi:null・「ゲスト未配置N件」 ---');
function J(x){return JSON.stringify(x);}
curPage='tgroup';viewStack=[];window._tgAnnOff=true;window._tgDay='tue';window._tgSavedOpen=undefined;
// 午前=[1,2,3]|[6]・未配置[8]／午後=[4,5]|[7]|[9]
// ゲスト行: 午前 {4,月,未定}=有効・{8,火,A班}=未配置の人・{1,木,A班}=ホーム組を指す
//          午後 {3,木,未定}=有効・{8,月,未定}=未配置の人・{1,火,C班}=有効・{2,火,B班}=有効（このあとB班を空にする）
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
  shifts:[{key:'am',label:'午前',groups:[[1,2,3],[6]],pool:[8],guests:[{pid:4,day:'mon',gi:null},{pid:8,day:'tue',gi:0},{pid:1,day:'thu',gi:0}]},
          {key:'pm',label:'午後',groups:[[4,5],[7],[9]],pool:[],guests:[{pid:3,day:'thu',gi:null},{pid:8,day:'mon',gi:null},{pid:1,day:'tue',gi:2},{pid:2,day:'tue',gi:1}]}]};
D.tgroup=[];__store['tgroup']=JSON.stringify([]);
tgChipTap(1,1,0);tgMoveTo(1,0); // 午後B班の7をA班へ→B班が空（2の火曜の行き先が空の班）
ok('前提: 午後=[4,5,7]|[]|[9]・2の行はgi:1のまま',ids(window._tgState.shifts[1].groups)==='4,5,7 |  | 9'&&window._tgState.shifts[1].guests[3].gi===1);
__toasts.length=0;
tgSave();drain();
var recL=JSON.parse(__store['tgroup']).slice(-1)[0];
ok('保存: 空の班を詰める（午後=[4,5,7]|[9]）',ids(recL.shifts[0].groups)==='1,2,3 | 6'&&ids(recL.shifts[1].groups)==='4,5,7 | 9');
ok('保存: 午前組の行は4(月・未定)だけ（未配置の8・ホーム組を指す1は落ちる）',J(recL.shifts[0].guests)===J([{pid:4,day:'mon',gi:null}]));
ok('保存: 午後組は3(木・未定)・1(火・C班→詰めてgi:1)・2(火・空の班→gi:null)。未配置の8は落ちる',J(recL.shifts[1].guests)===J([{pid:3,day:'thu',gi:null},{pid:1,day:'tue',gi:1},{pid:2,day:'tue',gi:null}]));
var inGroups=function(rec,pid){return rec.shifts.some(function(sh){return sh.groups.some(function(g){return g.some(function(x){return idEq(x,pid);});});});};
ok('保存レコードのゲスト行は全員どこかの班にいる選手・行の組はホーム組ではない',recL.shifts.every(function(sh,si){return sh.guests.every(function(x){return inGroups(recL,x.pid)&&!sh.groups.some(function(g){return g.indexOf(x.pid)>=0;});});}));
var ugRec=recL.shifts.reduce(function(a,sh){return a+sh.guests.filter(function(x){return x.gi==null&&inGroups(recL,x.pid);}).length;},0);
var ugDays=WG_DAYS.reduce(function(a,d){return a+tgDayShifts(recL.shifts,d.k).reduce(function(b,s){return b+s.unplaced.length;},0);},0);
var tL2=__toasts.filter(function(t){return has(t.m,'グループを保存しました');})[0];
ok('トースト「ゲスト未配置3件」＝保存レコードの班にいる選手のgi:null行数(3)＝曜日ごとの班未定(tgDayShifts unplaced)の合計(3)',ugRec===3&&ugDays===3&&!!tL2&&has(tL2.m,'ゲスト未配置3件は選手に「班未定」と表示されます'));

print('--- 保存: 班未定が未配置の人の行だけ→件数0で文言なし ---');
window._tgState={mode:'ampm',size:3,splitUnit:true,excluded:[],pinned:[],generated:true,_reason:{},sel:null,
  shifts:[{key:'am',label:'午前',groups:[[1,2,3],[6]],pool:[8],guests:[]},
          {key:'pm',label:'午後',groups:[[4,5],[7,9]],pool:[],guests:[{pid:8,day:'mon',gi:null},{pid:3,day:'thu',gi:0}]}]};
__toasts.length=0;
tgSave();drain();
var rec0=JSON.parse(__store['tgroup']).slice(-1)[0];
ok('保存: 未配置8の行は落ち、3(木・A班)だけ',J(rec0.shifts[1].guests)===J([{pid:3,day:'thu',gi:0}])&&rec0.shifts[0].guests.length===0);
ok('トーストに「ゲスト未配置」「班未定」の文言なし',__toasts.length===1&&has(__toasts[0].m,'グループを保存しました')&&!has(__toasts[0].m,'ゲスト未配置')&&!has(__toasts[0].m,'班未定'));
window._tgDay=undefined;window._tgAnnOff=undefined;

if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('tgroup_save tests failed');}
print('\nALL TGROUP-SAVE TESTS PASSED');
