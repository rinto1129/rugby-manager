// Phase 3: 自主トレ記録（kind='self'）のテスト
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_self_training.js
// 仕様（プランPhase 3節・レビューHigh-2/Low-7反映）:
//  - 自主ウエイト: _curTLog直作成（kind:'self'/menuId:null）→種目追加UI→既存finishTrainingで保存・e1rm追記
//  - フィットネス: fitness:{ftype,minutes,km,rpe,note} + 必ずresults:[]+totalVolume:0（不変条件）
//  - High-2: 自主下書きはidEqに乗らない→専用復元（draft.kind==='self'&&draft.date===today）+チーム/自主の相互上書き警告
//  - todayTodoHtml: kind!=='self'（自主トレでチームtodoが消えない）
//  - 履歴: 自主バッジ+fitnessはftype+時間表示・ボリュームグラフは!l.fitness
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}

var __els={};
function el(id){return document.getElementById(id);}
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
if(typeof window.scrollTo!=='function')window.scrollTo=function(){};

// 起動時のld()→go('home')チェーンをここで流しきる（後のdrain()で画面が上書きされるのを防ぐ）
drain();

// confirmを捕捉可能に（preludeは常にtrue）
var __confirms=[],__confirmRet=true;
confirm=function(m){__confirms.push(String(m));return __confirmRet;};

var TODAY=todayStr();
var YESTERDAY=(function(){var d=new Date();d.setDate(d.getDate()-1);return toDateStr(d);})();
myPid=1;
D.p=[{id:1,name:'テスト選手',position:'PR',year:2,height:'180',weight:'100'}];
D.std=[];D.offday=[];D.ann=[];D.md=[];D.matchsel=[];D.phskip=[];D.i=[];D.wc=[];D.tape=[];D.a=[];D.e1rm=[];D.rplan=[];D.r=[];D.ph=[];D.bc=[];D.f=[];D.tlog=[];D.chart=[];D.pp=[];D.texlist=['スクワット'];
D.tmenu=[{id:102,name:'チームメニュー',scope:'all',exercises:[{name:'スクワット',estBase:'squat',sets:3,reps:5,rir:2}]}];
D.cal=[{id:1,date:TODAY,type:'weight'}];
_tlogArchLoaded=true; // アーカイブ取得はスキップ（Phase 0で検証済み）
__store['tlog']=JSON.stringify([]);
__store['e1rm']=JSON.stringify([]);
__store['texlist']=JSON.stringify(['スクワット']);
__store['pp']=JSON.stringify([]);

print('--- showSelfTrainingMenu: 3択 ---');
showSelfTrainingMenu();
var h=__els['main'].innerHTML;
ok('自主ウエイトの選択肢',has(h,'自主トレ（ウエイト）')&&has(h,'startSelfWeight()'));
ok('フィットネスの選択肢',has(h,'フィットネス')&&has(h,'showSelfFitnessForm()'));
ok('チームメニューへの誘導文言',has(h,'配布されたメニュー'));

print('--- T.training: 自主トレ導線 ---');
T.training();
ok('「自主トレを記録」ボタン',has(__els['main'].innerHTML,'showSelfTrainingMenu()'));

print('--- 自主ウエイト: 開始と種目追加 ---');
localStorage.removeItem('rm_tdraft_1');localStorage.removeItem('rm_tdraft_1_t');
startSelfWeight();drain();
ok('下書きなし→即開始: kind=self',_curTLog&&_curTLog.kind==='self');
ok('menuId=null',_curTLog.menuId===null);
ok('results空で開始',_curTLog.results.length===0);
var hx=__els['main'].innerHTML;
ok('実施画面タイトル=自主トレ（ウエイト）',has(hx,'自主トレ（ウエイト）'));
ok('種目追加UI表示',has(hx,'tr-add-ex')&&has(hx,'addTrainingEx()'));
ok('texlistがdatalist候補に出る',has(hx,'スクワット'));

// 種目追加: 空名はalert
__alerts.length=0;
el('tr-add-ex').value='';
addTrainingEx();
ok('空の種目名→alert・追加されない',__alerts.length===1&&_curTLog.results.length===0);
// EST_BASESラベル一致→estBase自動判定
el('tr-add-ex').value='ベンチプレス';
addTrainingEx();
ok('種目追加: 1件',_curTLog.results.length===1);
var r0=_curTLog.results[0];
ok('estBase自動判定(ラベル一致)=bench',r0.estBase==='bench');
ok('addedByPlayer=true',r0.addedByPlayer===true);
ok('デフォルト3セット',r0.sets.length===3);
ok('下書き保存された',localStorage.getItem('rm_tdraft_1')!=null);
// 重複追加はalert
__alerts.length=0;
el('tr-add-ex').value='ベンチプレス';
addTrainingEx();
ok('同名種目→alert・追加されない',__alerts.length===1&&_curTLog.results.length===1);
// 過去ログからのestBase判定+前回実績プリフィル
D.tlog=[{id:'old1',pid:1,menuId:102,date:YESTERDAY,ts:'2026-07-06T10:00:00.000Z',kind:'self',
  results:[{exName:'ヒップスラスト',estBase:'squat',sets:[{weight:60,reps:10,rir:2}],skipped:false}],totalVolume:600}];
el('tr-add-ex').value='ヒップスラスト';
addTrainingEx();
var r1=_curTLog.results[1];
ok('estBase自動判定(過去ログ)=squat',r1&&r1.estBase==='squat');
ok('前回実績プリフィル(weight=60)',r1&&r1.sets[0].weight===60);
ok('prevEx引き継ぎ',r1&&r1.prevEx&&r1.prevEx.date===YESTERDAY);
D.tlog=[];

print('--- finishTraining: 自主ウエイト保存（kind/menuId=null/e1rm追記/texlistマージ/pp非flip） ---');
// 空の自主トレは保存させない
var bk=_curTLog.results;_curTLog.results=[];
__alerts.length=0;
finishTraining(mkEl());drain();
ok('種目0件→alertで保存拒否',__alerts.length===1&&JSON.parse(__store['tlog']).length===0);
_curTLog.results=bk;
// ベンチにセット入力して保存
_curTLog.results=[_curTLog.results[0]]; // ベンチのみ
_curTLog.results[0].sets=[{weight:100,reps:5,rir:2}];
__alerts.length=0;
__store['pp']=JSON.stringify([{id:1,type:'push',date:'2026-07-04',by:'staff'}]);
D.pp=[{id:1,type:'push',date:'2026-07-04',by:'staff'}];
finishTraining(mkEl());drain();
var saved=JSON.parse(__store['tlog']);
ok('tlog保存: 1件',saved.length===1);
ok("保存レコード: kind='self'",saved[0].kind==='self');
ok('保存レコード: menuId=null',saved[0].menuId===null);
ok('保存レコード: totalVolume=500',saved[0].totalVolume===500);
ok('保存レコード: addedByPlayerがslim後も残る',saved[0].results[0].addedByPlayer===true);
ok('slim: prevEx等の肥大フィールドは落ちる',!('prevEx'in saved[0].results[0])&&!('oneRM'in saved[0].results[0]));
var e1s=JSON.parse(__store['e1rm']);
ok('e1rm自動追記(estBase=bench)',e1s.length===1&&e1s[0].values&&!!e1s[0].values.bench);
var txl=JSON.parse(__store['texlist']);
ok('texlistへ追加種目名マージ',txl.indexOf('ベンチプレス')>=0);
ok('texlist: 既存名は重複しない',txl.filter(function(n){return n==='スクワット';}).length===1);
ok("自主トレではppAutoFlipしない(kind='self'ガード)",JSON.parse(__store['pp']).length===1);
ok('保存フローでalertなし',__alerts.length===0);
ok('下書きクリア済み',localStorage.getItem('rm_tdraft_1')==null);
D.tlog=saved;

print('--- High-2: 自主下書きの専用復元 ---');
var selfDraft={id:'SD1',pid:1,menuId:null,kind:'self',date:TODAY,ts:'2026-07-07T09:00:00.000Z',
  results:[{exName:'ベンチプレス',estBase:'bench',sets:[{weight:80,reps:8,rir:''}],skipped:false,addedByPlayer:true}],totalVolume:0};
localStorage.setItem('rm_tdraft_1',JSON.stringify(selfDraft));
localStorage.setItem('rm_tdraft_1_t','2026-07-07T09:00:00.000Z');
_curTLog=null;
startSelfWeight();drain();
var hr=__els['main'].innerHTML;
ok('自主下書きあり→復元プロンプト表示',has(hr,'入力途中のデータがあります')&&has(hr,'resumeSelfDraft()'));
ok('復元プロンプトに自主トレ表記',has(hr,'自主トレ（ウエイト）'));
resumeSelfDraft();
ok('復元: _curTLogが下書きになる',_curTLog&&_curTLog.id==='SD1'&&_curTLog.kind==='self');
ok('復元: 入力途中のセットが残る',_curTLog.results[0].sets[0].weight===80);

print('--- High-2: チーム下書き→自主開始の上書き警告 ---');
var teamDraft={id:'TD1',pid:1,menuId:102,date:TODAY,ts:'2026-07-07T09:30:00.000Z',
  results:[{exName:'スクワット',estBase:'squat',sets:[{weight:120,reps:5,rir:''}],skipped:false}],totalVolume:0};
localStorage.setItem('rm_tdraft_1',JSON.stringify(teamDraft));
_curTLog=null;
__confirms.length=0;__confirmRet=false; // キャンセル
startSelfWeight();drain();
ok('チーム下書きあり→confirm警告が出る',__confirms.length===1&&has(__confirms[0],'チームメニュー'));
ok('キャンセル→下書き温存',JSON.parse(localStorage.getItem('rm_tdraft_1')).id==='TD1');
ok('キャンセル→開始しない',_curTLog===null);
__confirms.length=0;__confirmRet=true; // OK
startSelfWeight();drain();
ok('OK→自主トレ開始(kind=self)',__confirms.length===1&&_curTLog&&_curTLog.kind==='self'&&_curTLog.id!=='TD1');
ok('OK→チーム下書きは消える',localStorage.getItem('rm_tdraft_1')==null);

print('--- High-2: 自主下書き→チーム開始の上書き警告（逆方向） ---');
localStorage.setItem('rm_tdraft_1',JSON.stringify(selfDraft));
_curTLog=null;
__confirms.length=0;__confirmRet=false;
beginTrainingExec(102);drain();
ok('自主下書きあり→confirm警告が出る',__confirms.length===1&&has(__confirms[0],'自主トレ'));
ok('キャンセル→自主下書き温存',JSON.parse(localStorage.getItem('rm_tdraft_1')).id==='SD1');
ok('キャンセル→開始しない',_curTLog===null);
__confirms.length=0;__confirmRet=true;
beginTrainingExec(102);drain();
ok('OK→チームメニュー開始',__confirms.length===1&&_curTLog&&idEq(_curTLog.menuId,102));
ok("OK→チーム開始のレコードにkindなし(=team扱い)",_curTLog.kind===undefined);
localStorage.removeItem('rm_tdraft_1');

print('--- 過去日付の自主下書きは復元対象外（新規開始） ---');
var oldDraft=JSON.parse(JSON.stringify(selfDraft));oldDraft.date=YESTERDAY;
localStorage.setItem('rm_tdraft_1',JSON.stringify(oldDraft));
__confirms.length=0;
startSelfWeight();drain();
ok('昨日の下書き→警告なしで新規開始',__confirms.length===0&&_curTLog&&_curTLog.kind==='self'&&_curTLog.id!=='SD1');
localStorage.removeItem('rm_tdraft_1');

print('--- フィットネス記録 ---');
showSelfFitnessForm();
var hf=__els['main'].innerHTML;
ok('フォーム: 種類/時間/距離/RPE/メモ',has(hf,'sf-type')&&has(hf,'sf-min')&&has(hf,'sf-km')&&has(hf,'sf-rpe')&&has(hf,'sf-note'));
// バリデーション
__alerts.length=0;
el('sf-type').value='';el('sf-min').value='30';
saveSelfFitness(mkEl());drain();
ok('種類なし→alert',__alerts.length===1);
__alerts.length=0;
el('sf-type').value='ランニング';el('sf-min').value='';
saveSelfFitness(mkEl());drain();
ok('時間なし→alert',__alerts.length===1);
// 正常保存
__alerts.length=0;
__store['tlog']=JSON.stringify(D.tlog);
el('sf-type').value='ランニング';el('sf-min').value='30';el('sf-km').value='5.2';el('sf-rpe').value='7';el('sf-note').value='朝ラン';
saveSelfFitness(mkEl());drain();
var saved2=JSON.parse(__store['tlog']);
var fit=saved2[saved2.length-1];
ok('fitness保存: kind=self/menuId=null',fit.kind==='self'&&fit.menuId===null);
ok('fitness内容: ftype/minutes/km/rpe/note',fit.fitness&&fit.fitness.ftype==='ランニング'&&fit.fitness.minutes===30&&fit.fitness.km===5.2&&fit.fitness.rpe===7&&fit.fitness.note==='朝ラン');
ok('不変条件: results:[]',Array.isArray(fit.results)&&fit.results.length===0);
ok('不変条件: totalVolume:0',fit.totalVolume===0);
ok('完了画面表示',has(__els['main'].innerHTML,'記録完了'));
ok('保存フローでalertなし',__alerts.length===0);
D.tlog=saved2;
// 任意項目の省略（km/rpe/note無し→キー自体を持たない）
el('sf-type').value='バイク';el('sf-min').value='20';el('sf-km').value='';el('sf-rpe').value='';el('sf-note').value='';
saveSelfFitness(mkEl());drain();
var saved3=JSON.parse(__store['tlog']);
var fit2=saved3[saved3.length-1];
ok('任意項目省略: km/rpe/noteキーなし',fit2.fitness&&!('km'in fit2.fitness)&&!('rpe'in fit2.fitness)&&!('note'in fit2.fitness));
D.tlog=saved3;

print('--- todayTodoHtml: 自主トレでチームtodoが消えない ---');
// この時点でD.tlogには本日の自主ウエイト+フィットネスのみ（チーム記録なし）
// 未完了の行だけonclickが残る仕様 → go('training')の有無でdone状態を判定できる
var todo=todayTodoHtml();
ok('自主トレのみ→ウエイト項目は未完了(onclick残存)',has(todo,'ウエイトトレーニング')&&has(todo,"go('training')"));
// 実アプリ同様に配列ごと差し替える（tlogAll()は参照比較キャッシュのためin-place pushは反映されない）
D.tlog=D.tlog.concat([{id:'team1',pid:1,menuId:102,date:TODAY,ts:new Date().toISOString(),results:[],totalVolume:0}]);
var todo2=todayTodoHtml();
ok('チーム記録が入ればdone(onclick消滅)',has(todo2,'ウエイトトレーニング')&&!has(todo2,"go('training')"));

print('--- 履歴: 自主バッジ+fitness表示（Low-7）+グラフのfitness除外 ---');
var __chartLogs=null;
var __origDraw=drawTrainingCharts;
drawTrainingCharts=function(logs){__chartLogs=logs;};
showTrainingHistory();
// showTrainingHistory内のsetTimeoutを実行
__timeouts[__timeouts.length-1]();
drawTrainingCharts=__origDraw;
var hh=__els['main'].innerHTML;
ok('自主バッジ表示',has(hh,'>自主<'));
ok('fitness: ftype+時間表示',has(hh,'ランニング')&&has(hh,'30分'));
ok('fitness: 距離/RPEも表示',has(hh,'5.2km')&&has(hh,'RPE7'));
ok('自主ウエイトの名称表示',has(hh,'自主トレ（ウエイト）'));
ok('fitnessが0kg表示にならない',!has(hh,'ランニング</div><div style="font-size:11px;color:var(--text-secondary)">'+fmt(TODAY)+'</div></div><div style="font-weight:700;color:var(--blue)">0kg'));
ok('グラフ入力からfitness除外',__chartLogs&&__chartLogs.every(function(l){return !l.fitness;}));
ok('グラフ入力に自主ウエイトは含む',__chartLogs&&__chartLogs.some(function(l){return l.kind==='self'&&!l.fitness;}));

print('--- 既存表示の無傷確認（fitness/selfレコード混在で例外なし） ---');
var okAll=true;
try{
  T.training();
  T.home();
  startTrainingFresh(102); // prevEx検索がself/fitness混在ログを走査
  getCompareVolume(1,'スクワット',TODAY,'prev');
  getConsecutiveSkips(1);
}catch(e){okAll=false;print('  exception: '+e);}
ok('主要フロー完走（例外なし）',okAll);

if(__fail===0)print('ALL SELF-TRAINING TESTS PASSED');else print(__fail+' TESTS FAILED');
