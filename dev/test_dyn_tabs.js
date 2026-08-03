// P8a: player動的タブ — navSlots/hasActiveInjury/renderNav/noticeTabRestored ＋ injury/conditionのトップレベル描画
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_dyn_tabs.js
// 核心: (1)未resolved怪我がある時だけ3枠目がトレーニング→リハビリに切替
//       (2)renderNavはcurTabにac付与・未ログインはac無し・mypageバッジ要素を常に再生成
//       (3)復帰（リハビリ→トレーニング）で一度きりトースト、初回・再表示では出ない
//       (4)T.injuryは治療中=タブヘッダー(戻る無し)/回復後=マイページ配下(戻る有り)
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
// 要素キャッシュ（innerHTMLを跨いで検証するため同一要素を返す）
var _els={};
var _origGet=document.getElementById;
document.getElementById=function(id){if(!_els[id])_els[id]=_origGet(id);return _els[id];};

myPid=1;
setKey('p',[{id:1,name:'テスト選手',position:'CTB',year:1}]);
setKey('i',[]);setKey('r',[]);setKey('wc',[]);setKey('rlog',[]);setKey('f',[]);setKey('ann',[]);setKey('chart',[]);setKey('rplan',[]);setKey('rtpl',[]);setKey('injcomm',[]);

print('--- 1) navSlots: 怪我なし→3枠目=トレーニング ---');
var s=navSlots();
ok('5枠', s.length===5);
ok('slot1=home', s[0].tab==='home');
ok('slot2=condition(体調)', s[1].tab==='condition'&&s[1].label==='体調');
ok('slot3=training', s[2].tab==='training');
ok('slot4=mydata', s[3].tab==='mydata');
ok('slot5=mypage', s[4].tab==='mypage');

print('--- 2) navSlots: 未resolved怪我→3枠目=injury(リハビリ) ---');
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:todayStr()}]);
s=navSlots();
ok('slot3=injury', s[2].tab==='injury');
ok('ラベル=リハビリ', s[2].label==='リハビリ');

print('--- 3) resolved/他人の怪我では切り替わらない・idEq判定 ---');
setKey('i',[{id:10,pid:1,resolved:true},{id:11,pid:2,resolved:false}]);
ok('resolved+他人→training', navSlots()[2].tab==='training');
setKey('i',[{id:12,pid:'1',resolved:false}]);
ok('文字列pidでもidEqで切替', navSlots()[2].tab==='injury');
var pidSv=myPid;myPid=null;
ok('未ログインはhasActiveInjury=false', hasActiveInjury()===false);
myPid=pidSv;

print('--- 4) renderNav: acクラス・バッジ・未ログイン ---');
setKey('i',[]);
curTab='home';
renderNav();
var bar=_els['nav-bar'];
ok('nav-btn生成', bar.innerHTML.indexOf('nav-btn')>=0);
ok('acは1つだけ(home)', bar.innerHTML.split('nav-btn ac').length===2);
ok('mypageバッジ要素を再生成', bar.innerHTML.indexOf('nav-badge-mypage')>=0);
curTab='condition';renderNav();
ok('conditionがac', bar.innerHTML.indexOf('nav-btn ac" onclick="go(\'condition\')')>=0);
setKey('i',[{id:10,pid:1,resolved:false}]);
curTab='injury';renderNav();
ok('injuryタブがacで描画', bar.innerHTML.indexOf('nav-btn ac" onclick="go(\'injury\')')>=0);
ok('リハビリラベル', bar.innerHTML.indexOf('リハビリ')>=0);
myPid=null;renderNav();
ok('未ログインはac無し', bar.innerHTML.indexOf('nav-btn ac')<0);
myPid=1;

print('--- 5) noticeTabRestored: 復帰で一度きり通知 ---');
localStorage._d={};
var _toasts=[];var _toastSv=toast;toast=function(m){_toasts.push(m);};
setKey('i',[{id:10,pid:1,resolved:false}]);
var tB=__timeouts.length;
noticeTabRestored();
for(var ti=tB;ti<__timeouts.length;ti++)__timeouts[ti]();
ok('初回(怪我中)は通知なし', _toasts.length===0);
setKey('i',[]);
tB=__timeouts.length;
noticeTabRestored();
for(ti=tB;ti<__timeouts.length;ti++)__timeouts[ti]();
ok('復帰時に一度だけ通知', _toasts.length===1&&/トレーニング/.test(_toasts[0]));
tB=__timeouts.length;
noticeTabRestored();
for(ti=tB;ti<__timeouts.length;ti++)__timeouts[ti]();
ok('二度目は出ない', _toasts.length===1);
// 未ログインは状態を書き換えない（偽の回復通知の種を作らない）
localStorage._d={};myPid=null;
noticeTabRestored();
ok('未ログインはlocalStorage未書込', Object.keys(localStorage._d).length===0);
myPid=1;
// P8レビュー②: キーは選手IDスコープ＝他選手の状態を引き継がない
localStorage._d={};
setKey('i',[{id:10,pid:1,resolved:false}]);
noticeTabRestored(); // 選手1が怪我中='1'を保存
ok('キーは選手スコープ(rm_rehabtab_1)', localStorage.getItem('rm_rehabtab_1')==='1');
myPid=2;setKey('i',[]);
_toasts=[];
tB=__timeouts.length;
noticeTabRestored(); // 選手2は初見(prev=null)→トーストなし
for(ti=tB;ti<__timeouts.length;ti++)__timeouts[ti]();
ok('別選手には他人の状態を引き継がない(偽回復なし)', _toasts.length===0);
myPid=1;toast=_toastSv;

print('--- 6) T.injury: 治療中=タブヘッダー/回復後=戻るボタン ---');
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:todayStr(),source:'player',approved:true}]);
setKey('r',[{id:20,injId:10,stage:2}]);
subView=null;curTab='injury';
T.injury();
var main=_els['main'];
ok('タブヘッダー(ROAD TO RETURN)', main.innerHTML.indexOf('ROAD TO RETURN')>=0);
ok('戻るボタン無し', main.innerHTML.indexOf('← マイページ')<0);
ok('RTPピッチ描画', main.innerHTML.indexOf('rtp-anim')>=0);
ok('今日のリハビリを記録', main.innerHTML.indexOf('今日のリハビリを記録')>=0);
ok('カルテ導線', main.innerHTML.indexOf('カルテ・痛み推移')>=0);
setKey('i',[{id:10,pid:1,resolved:true,part:'膝',type:'捻挫',date:todayStr()}]);
T.injury();
ok('回復後は戻るボタン有り', main.innerHTML.indexOf('← マイページ')>=0);
ok('回復後はタブヘッダー無し', main.innerHTML.indexOf('ROAD TO RETURN')<0);

print('--- 7) T.condition: タブ描画・当日サマリ ---');
setKey('f',[{id:5,pid:1,date:todayStr(),rpe:6,sleep:7,duration:60,inputAt:'2026-08-03T08:00:00',note:''}]);
subView=null;curTab='condition';
T.condition();
ok('タブヘッダーCONDITION', main.innerHTML.indexOf('CONDITION')>=0);
ok('当日サマリ(本日入力済み)', main.innerHTML.indexOf('本日入力済み')>=0);
ok('サマリに修正導線', main.innerHTML.indexOf('showEditCondition')>=0);
ok('タブなので戻るボタン無し', main.innerHTML.indexOf('btn-back')<0);
setKey('f',[]);
T.condition();
ok('未入力日はサマリ無し', main.innerHTML.indexOf('本日入力済み')<0);

print(__fail===0?'ALL DYN-TABS TESTS PASSED':(__fail+' TESTS FAILED'));
