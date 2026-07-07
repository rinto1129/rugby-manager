// ステップ6: staff基準設定UI（V.standards/doSaveStd/doResetStd）の模擬実行テスト
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eqn(name,got,want){var o=(typeof want==='number'&&typeof got==='number')?Math.abs(got-want)<0.0051:(got===want);if(!o){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
function setVal(id,v){document.getElementById(id).value=String(v);}
// mkEl()はinnerHTML文字列を子要素としてパースしない（本物のDOMと違いgetElementByIdと連動しない）ため、
// 実ブラウザの「innerHTML代入→即座に子inputのvalue属性が読める」挙動をここで模擬する。
function syncValsFromRender(html){
  var re=/id="([^"]+)"\s+value="([^"]*)"/g,m;
  while((m=re.exec(html))){var id=m[1];if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}__els[id].value=m[2];}
}
function renderStd(){V.standards();var h=document.getElementById('main-ct').innerHTML;syncValsFromRender(h);return h;}

D.p=[];D.ph=[];D.bc=[];D.f=[];D.std=[];D.i=[];D.r=[];D.tlog=[];
var __confirms=[];var __confirmAnswer=true;
confirm=function(m){__confirms.push(String(m));return __confirmAnswer;};

print('--- V.standards 描画（デフォルト） ---');
var h1=renderStd();
ok('未保存バッジ',has(h1,'未保存（コード内の初期値で動作中）'));
ok('ポジション表にPR',has(h1,'>PR<'));
ok('ポジション表にNo.8',has(h1,'>No.8<'));
ok('ランク5枠',has(h1,'std-rank-4'));
ok('allo入力',has(h1,'std-allo-bp'));
ok('rx入力（SQ弱点の3行目）',has(h1,'std-rx-sq-2-name'));
ok('リセットボタンなし（未保存時）',!has(h1,'初期値に戻す'));
// PR SQ倍率のプリフィル
eqn('PR SQ倍率プリフィル',String(document.getElementById('std-pos-0-sq').value),'1.55');

print('--- doSaveStd 正常系（PRのSQ倍率を1.8へ変更して保存） ---');
// 全入力値はレジストリに残っているので、変更したい所だけ上書き
setVal('std-pos-0-sq','1.8');
__store['std']=JSON.stringify([]);
__alerts.length=0;
// FUKUDAI RED: 保存成功はブロッキングalertからトーストへ移行したため、toastを捕捉して検証する
var __toasts=[];toast=function(m){__toasts.push(String(m));};
doSaveStd(mkEl());
drain();
var savedArr=JSON.parse(__store['std']||'[]');
eqn('単一要素配列で保存',savedArr.length,1);
var cfg1=savedArr[0]||{};
eqn('PR sq=1.8',cfg1.pos.PR.sq,1.8);
eqn('HO sqはデフォルト1.6',cfg1.pos.HO.sq,1.6);
eqn('ranksは5件',cfg1.ranks.length,5);
eqn('gold pct=1',cfg1.ranks[2].pct,1);
ok('ranksのcolor温存',cfg1.ranks[4].color==='#C084FC');
eqn('allo bp=0.45',cfg1.allo.bp,0.45);
eqn('rx sqは3件',cfg1.rx.sq.length,3);
ok('確認ダイアログを経由',__confirms.some(function(c){return c.indexOf('基準値を保存')>=0;}));
ok('保存完了トースト',__toasts.some(function(t){return t.indexOf('保存しました')>=0;}));
ok('D.stdに反映',D.std.length===1&&D.std[0].pos.PR.sq===1.8);

print('--- 保存後、選手側と同じgetStdCfgが新値を返す ---');
eqn('getStdCfg PR sq',getStdCfg().pos.PR.sq,1.8);
eqn('getStdCfg 未変更フィールドはマージ',getStdCfg().pos.PR.bp,1.25);

print('--- 再描画でカスタムバッジ＋リセットボタン ---');
var h2=renderStd();
ok('カスタム設定バッジ',has(h2,'カスタム設定を使用中'));
ok('リセットボタンあり',has(h2,'初期値に戻す'));
eqn('新値がプリフィル',String(document.getElementById('std-pos-0-sq').value),'1.8');

print('--- バリデーション: 範囲外・昇順違反は保存されない ---');
setVal('std-pos-0-sq','9');           // 範囲外
setVal('std-rank-0','1.5');           // ブロンズ>シルバー=昇順違反
__alerts.length=0;__confirms.length=0;
var before=__store['std'];
doSaveStd(mkEl());
drain();
ok('エラーalert',__alerts.some(function(a){return a.indexOf('入力値を確認')>=0;}));
ok('SQ倍率の範囲を指摘',__alerts.some(function(a){return a.indexOf('PR SQ倍率')>=0;}));
ok('confirmまで行かない',__confirms.length===0);
ok('ストア不変',__store['std']===before);
setVal('std-pos-0-sq','1.8');setVal('std-rank-0','0.7'); // 戻す

print('--- 昇順違反のみ（単独で検知） ---');
setVal('std-rank-3','0.9'); // プラチナ0.9 < ゴールド1.0
__alerts.length=0;
doSaveStd(mkEl());
drain();
ok('昇順違反を指摘',__alerts.some(function(a){return a.indexOf('昇順')>=0;}));
setVal('std-rank-3','1.1');

print('--- rx空行はスキップ ---');
setVal('std-rx-dl-2-name','');
__alerts.length=0;__confirms.length=0;
doSaveStd(mkEl());
drain();
var cfg2=JSON.parse(__store['std'])[0];
eqn('DLのrxは2件に減る',cfg2.rx.dl.length,2);

print('--- doResetStd ---');
__confirms.length=0;__alerts.length=0;
doResetStd(mkEl());
drain();
eqn('空配列に戻る',JSON.parse(__store['std']).length,0);
ok('getStdCfgがデフォルトへ復帰',getStdCfg().pos.PR.sq===1.55);

print('--- キャンセル時は何もしない ---');
__confirmAnswer=false;
__store['std']=JSON.stringify([{pos:{}}]);
doResetStd(mkEl());
drain();
eqn('キャンセルでストア不変',JSON.parse(__store['std']).length,1);
__confirmAnswer=true;

print(__fail===0?'ALL STD-STAFF TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('std-staff tests failed');
