// P6: 敵対的レビューで確定した修正の回帰テスト（timeOptions 5分グリッド / recorderName 記録者解決）
// 実行: jsc dev/prelude.js /tmp/trainer.js dev/test_p6.js
// 核心:
//  ・timeOptions … 枠は5分単位で分割生成される。旧10分グリッドだと枠編集で08:05等が選択できず00:00に落ちて時刻が破損した（レビュー#1 high）。
//    → 5分グリッド化＋グリッド外の既存値は<option selected>としてprependして保持する。
//  ・recorderName … authorId(trainerId)→trainersから現在名を解決／無ければ author 文字列へフォールバック（D8）。
//    idEqでゆるく照合し、authorIdはauthorより優先する。改名が新規レコードに反映される土台。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function cnt(s,sub){return s.split(sub).length-1;}

// ---------- timeOptions ----------
ok('timeOptions is function', typeof timeOptions==='function');
var to05=timeOptions('08:05');
ok('timeOptions emits 5-min grid (has 08:05 option)', to05.indexOf('>08:05<')>=0);
ok('timeOptions emits 5-min grid (has 08:55 option)', to05.indexOf('>08:55<')>=0);
ok('timeOptions on-grid selects the value', to05.indexOf('<option selected>08:05</option>')>=0);
ok('timeOptions exactly one selected for on-grid', cnt(to05,'<option selected>')===1);
ok('timeOptions does NOT default-select 00:00', to05.indexOf('<option selected>00:00')<0);
// 旧10分グリッドでは 08:05 が options に無く selectが00:00へ落ちる不具合だった → 今は選択できる
var to15=timeOptions('08:15');
ok('timeOptions selects 08:15 (was off old 10-min grid too? no—但し5分刻みでOK)', to15.indexOf('<option selected>08:15</option>')>=0);
// グリッド外の既存値（過去データ等）はprependして選択状態で保持
var toOff=timeOptions('08:03');
ok('timeOptions off-grid value is preserved as selected', toOff.indexOf('<option selected>08:03</option>')>=0);
ok('timeOptions off-grid value is prepended (before 00:00)', toOff.indexOf('08:03')<toOff.indexOf('00:00'));
ok('timeOptions off-grid keeps exactly one selected', cnt(toOff,'<option selected>')===1);
// 引数なし/空 → どの<option>もselectされない
var toNone=timeOptions('');
ok('timeOptions empty arg selects nothing', cnt(toNone,'selected')===0);

// ---------- recorderName ----------
ok('recorderName is function', typeof recorderName==='function');
D.trainers=[{id:5,name:'佐藤'},{id:7,name:'田中'}];
ok('recorderName resolves authorId→current name', recorderName({authorId:5})==='佐藤');
ok('recorderName authorId is idEq-loose (string)', recorderName({authorId:'5'})==='佐藤');
ok('recorderName authorId takes precedence over author snapshot', recorderName({authorId:7,author:'旧名'})==='田中');
ok('recorderName falls back to author when no authorId', recorderName({author:'山田'})==='山田');
ok('recorderName unknown authorId falls back to author', recorderName({authorId:99,author:'山田'})==='山田');
ok('recorderName unknown authorId & no author → empty', recorderName({authorId:99})==='');
ok('recorderName null/undefined-safe', recorderName(null)==='' && recorderName(undefined)==='');
ok('recorderName empty object → empty', recorderName({})==='');
// 改名反映: trainers側の名前を差し替えると解決結果も変わる（新規レコードは authorId 参照なので改名が反映される）
D.trainers=[{id:5,name:'佐藤（改）'}];
ok('recorderName reflects a rename via authorId', recorderName({authorId:5,author:'佐藤'})==='佐藤（改）');

if(__fail>0){print('\nP6 TESTS: '+__fail+' FAILED');throw new Error('p6 test failed');}
print('\nALL P6 TESTS PASSED');
