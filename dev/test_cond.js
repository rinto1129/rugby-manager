// ステップ5: コンディション拡張（mood/stress/soreness/sorenessParts/weight）の模擬実行テスト
// 注意: 保存系はPromiseベースなので、各保存後に drainMicrotasks()（jscシェル組込）で完了させてから検証する。
// 注意: モックDOMはinnerHTML再描画で入力が消えないため、フォーム再表示のテストでは明示的に値をリセットする。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function eqn(name,got,want){var o=(typeof want==='number'&&typeof got==='number')?Math.abs(got-want)<0.051:(got===want);if(!o){__fail++;print('  NG '+name+': got='+JSON.stringify(got)+' want='+JSON.stringify(want));}else print('  ok '+name+' = '+JSON.stringify(got));}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
function setVal(id,v){document.getElementById(id).value=String(v);}
function resetCondForm(){['cf-rpe','cf-date','cf-sleep','cf-dur','cf-note','cf-weight','cf-mood','cf-stress','cf-sore','cf-parts'].forEach(function(id){setVal(id,'');});}

D.p=[{id:1,name:'テスト選手',position:'PR',year:2,height:'180',weight:'100'}];
D.ph=[];D.bc=[];D.f=[];D.std=[];D.offday=[];D.ann=[];D.cal=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.pp=[];D.a=[];D.e1rm=[];D.tlog=[];D.rplan=[];D.r=[];
myPid=1;

print('--- フォーム描画 ---');
T.condition();
var f1=document.getElementById('main').innerHTML;
ok('体重欄あり',has(f1,'cf-weight'));
ok('気分レートあり',has(f1,'cf-mood'));
ok('ストレスレートあり',has(f1,'cf-stress'));
ok('筋肉痛レートあり',has(f1,'cf-sore'));
ok('部位チップは初期非表示',has(f1,'id="cf-parts-wrap" style="display:none"'));
ok('部位チップにPARTS(膝)',has(f1,'>膝<'));

print('--- setRate5 の選択/解除 ---');
setRate5('cf-mood',4);
eqn('選択で値4',String(document.getElementById('cf-mood').value),'4');
setRate5('cf-mood',4);
eqn('同値再タップで解除',document.getElementById('cf-mood').value,'');
setRate5('cf-mood',3);
eqn('再選択で3',String(document.getElementById('cf-mood').value),'3');
setRate5('cf-mood',3); // 後続テストのため解除

print('--- 筋肉痛→部位チップ連動 ---');
setRate5('cf-sore',1);
eqn('1では部位非表示のまま',document.getElementById('cf-parts-wrap').style.display,'none');
setRate5('cf-sore',1);// 解除
setRate5('cf-sore',3);
eqn('3で部位表示',document.getElementById('cf-parts-wrap').style.display,'');
togglePartChip('cf-parts',PARTS.indexOf('膝'));
togglePartChip('cf-parts',PARTS.indexOf('腰'));
eqn('部位2つ選択',document.getElementById('cf-parts').value,'膝,腰');
togglePartChip('cf-parts',PARTS.indexOf('膝'));
eqn('再タップで解除',document.getElementById('cf-parts').value,'腰');
setRate5('cf-sore',3); // 解除
eqn('筋肉痛解除で部位もクリア',document.getElementById('cf-parts').value,'');
eqn('部位ラップ非表示に戻る',document.getElementById('cf-parts-wrap').style.display,'none');

print('--- doCondition 保存（拡張項目つき） ---');
resetCondForm();
setVal('cf-rpe',6);setVal('cf-date','2026-07-06');setVal('cf-sleep',7.5);setVal('cf-dur',90);setVal('cf-note','テスト');
setVal('cf-weight','92.55');
setRate5('cf-mood',5);setRate5('cf-stress',2);setRate5('cf-sore',3);
togglePartChip('cf-parts',PARTS.indexOf('大腿'));
__store['f']=JSON.stringify([]);
doCondition(mkEl());
drain();
var saved=JSON.parse(__store['f']||'[]');
eqn('1件保存',saved.length,1);
var r=saved[0]||{};
eqn('rpe',r.rpe,6);
eqn('weightは0.1丸め',r.weight,92.6);
eqn('mood',r.mood,5);
eqn('stress',r.stress,2);
eqn('soreness',r.soreness,3);
ok('sorenessParts=[大腿]',JSON.stringify(r.sorenessParts)===JSON.stringify(['大腿']));

print('--- doCondition 未入力の拡張項目はフィールド自体なし ---');
__store['f']=JSON.stringify([]);
D.f=[];
T.condition();
resetCondForm();
setVal('cf-rpe',5);setVal('cf-date','2026-07-05');setVal('cf-sleep',7);setVal('cf-dur',60);
doCondition(mkEl());
drain();
var saved2=JSON.parse(__store['f']||'[]');
eqn('1件保存(未拡張)',saved2.length,1);
var r2=saved2[0]||{};
ok('weightなし',!('weight' in r2));
ok('moodなし',!('mood' in r2));
ok('sorenessPartsなし',!('sorenessParts' in r2));

print('--- 体重バリデーション ---');
D.f=[];
T.condition();
resetCondForm();
setVal('cf-rpe',5);setVal('cf-date','2026-07-04');setVal('cf-weight','20');
__alerts.length=0;__store['f']=JSON.stringify([]);
doCondition(mkEl());
drain();
ok('30kg未満は拒否',__alerts.some(function(a){return a.indexOf('体重の値を確認')>=0;}));
eqn('保存されない',JSON.parse(__store['f']||'[]').length,0);

print('--- 修正フォーム＋doEditCondition ---');
D.f=[{id:'f1',pid:1,date:'2026-07-06',rpe:6,sleep:7,duration:90,note:'',weight:92.6,mood:5,stress:2,soreness:3,sorenessParts:['大腿'],inputAt:'2026-07-06T08:00:00'}];
__store['f']=JSON.stringify(D.f);
['ef-rpe','ef-sleep','ef-dur','ef-note','ef-weight','ef-mood','ef-stress','ef-sore','ef-parts'].forEach(function(id){setVal(id,'');});
showEditCondition('f1');
var tq=__timeouts.slice();__timeouts.length=0;tq.forEach(function(fn){fn();}); // プリセットのsetTimeoutを実行
eqn('mood初期値',String(document.getElementById('ef-mood').value),'5');
eqn('sore初期値',String(document.getElementById('ef-sore').value),'3');
eqn('部位初期値',document.getElementById('ef-parts').value,'大腿');
eqn('部位ラップ表示',document.getElementById('ef-parts-wrap').style.display,'');
// 編集: moodを解除・体重変更・筋肉痛解除→部位も消える
setRate5('ef-mood',5); // 解除
setVal('ef-weight','93.0');
setRate5('ef-sore',3); // 解除（部位も自動クリア）
setVal('ef-rpe',7);
doEditCondition('f1',mkEl());
drain();
var ed=JSON.parse(__store['f'])[0];
eqn('rpe更新',ed.rpe,7);
eqn('weight更新',ed.weight,93);
ok('mood削除',!('mood' in ed));
ok('soreness削除',!('soreness' in ed));
ok('sorenessParts削除',!('sorenessParts' in ed));
eqn('stressは維持',ed.stress,2);

print('--- mypage最新コンディションに拡張項目 ---');
D.f=[{id:'f2',pid:1,date:'2026-07-06',rpe:5,sleep:8,duration:60,weight:92.6,mood:4,stress:2,soreness:3,sorenessParts:['膝','腰'],inputAt:'2026-07-06T08:00:00'}];
T.mypage();
var mp=document.getElementById('main').innerHTML;
ok('体重表示',has(mp,'>92.6<'));
ok('気分表示',has(mp,'気分'));
ok('筋肉痛部位表示',has(mp,'筋肉痛の部位: 膝・腰'));

print(__fail===0?'ALL COND TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('cond tests failed');
