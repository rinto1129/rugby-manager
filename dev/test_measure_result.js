// P8c: NO SIDE測定結果シート — doPhys成功→showMeasureResult（前回比/PB/ランク変動/CLUB到達/復帰目標）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_measure_result.js
// 核心: (1)保存前ベスト/ランクを捕捉し保存後の値と比較（+diff/PBチップ/ランク→矢印）
//       (2)ブロンコ単独=タイムヒーロー・秒差は負が緑（速い=良）・復帰目標クリア表示
//       (3)BIG3 CLUBは「新規到達」の時だけカード（既到達の再表示はしない）
//       (4)showTrainingResultはresultHero/resultStatRowへのリファクタ後も同じ骨格で出る
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
var _els={};
var _origGet=document.getElementById;
document.getElementById=function(id){if(!_els[id])_els[id]=_origGet(id);return _els[id];};
function setInput(id,v){document.getElementById(id).value=(v==null?'':String(v));}
function btn(){return{dataset:{},style:{},innerHTML:'',textContent:''};}
function main(){return _els['main'].innerHTML;}

myPid=1;
setKey('p',[{id:1,name:'テスト選手',position:'PR',year:2,height:'180'}]);
['i','r','f','ann','cal','tmenu','tlog','wc','md','matchsel','offday','pp','a','ph','bc','msess','phskip','chart','std','e1rm'].forEach(function(k){setKey(k,[]);});
// 体重情報（ランク判定に必須）: bcの実測100kg
setKey('bc',[{id:'b1',pid:1,date:todayStr(),weight:100,inputAt:'T'}]);
var _pbFlashes=[];pbFlash=function(m){_pbFlashes.push(m);};
drain(); // アプリ起動時のld()→go('home')初期化チェーンを先に消化（テスト1の描画を上書きさせない）

print('--- 1) ウエイト測定 → NO SIDEシート・前回比・PB ---');
setKey('ph',[{id:900,pid:1,date:'2026-07-01',squat:140,bench:100,deadlift:170,inputAt:'T'}]);
setInput('pf-date',todayStr());setInput('pf-sq','150');setInput('pf-bp','95');setInput('pf-dl','');setInput('pf-cn','');setInput('pf-cl','');setInput('pf-br-m','');setInput('pf-br-s','');
doPhys(btn(),'');drain();
var h1=main();
ok('NO SIDEヒーロー',has(h1,'NO SIDE'));
ok('MEASURE STATS',has(h1,'MEASURE STATS'));
ok('SQ +10kg（緑）',has(h1,'+10kg'));
ok('SQにPBチップ',/スクワット[\s\S]{0,600}?>PB</.test(h1));
ok('BP -5kg（赤・PB無し）',has(h1,'-5kg')&&!/ベンチプレス[\s\S]{0,600}?>PB</.test(h1));
ok('未入力種目(DL)は行に出ない',!has(h1,'デッドリフト'));
ok('phに2件目が保存されている',JSON.parse(__store['ph']).length===2);

print('--- 2) ランク変動（保存前後でランク名が変わったら矢印表示） ---');
// 100kg PR: SQゴールド基準=体重×倍率。140→150で変動があれば「→」、無ければランク単独表示
ok('RANKカード表示',has(h1,'ランク変動'));
ok('SQランク行あり',/SQ ランク/.test(h1));

print('--- 3) ブロンコ単独 → タイムヒーロー・復帰目標クリア ---');
setKey('ph',[{id:901,pid:1,date:'2026-07-01',bronco:310,inputAt:'T'}]);
setKey('i',[{id:10,pid:1,resolved:false,part:'膝',type:'捻挫',date:'2026-07-01',broncoTarget:305}]);
setInput('pf-date',todayStr());setInput('pf-sq','');setInput('pf-bp','');setInput('pf-dl','');setInput('pf-cn','');setInput('pf-cl','');
setInput('pf-br-m','5');setInput('pf-br-s','0'); // 300秒（前回310秒→-10秒・目標305クリア）
doPhys(btn(),'bronco');drain();
var h3=main();
ok('ブロンコタイムヒーロー',has(h3,'5分00秒'));
ok('-10秒（緑）',has(h3,'-10秒'));
ok('ブロンコPBチップ',/ブロンコ<\/span>[\s\S]{0,600}?>PB</.test(h3));
ok('復帰目標クリア表示',has(h3,'復帰目標タイム')&&has(h3,'クリア'));
setKey('i',[]);

print('--- 4) BIG3 CLUB 新規到達のみカード ---');
setKey('ph',[{id:902,pid:1,date:'2026-07-01',squat:140,bench:100,deadlift:150,inputAt:'T'}]); // 合計390 <400
setInput('pf-date',todayStr());setInput('pf-sq','');setInput('pf-bp','');setInput('pf-dl','165');setInput('pf-br-m','');setInput('pf-br-s','');
doPhys(btn(),'');drain(); // DL 150→165で合計405→400 CLUB新規到達
var h4=main();
ok('400 CLUB到達カード',has(h4,'400 CLUB 到達'));
// 既到達での再測定では出ない
setInput('pf-date','2026-07-20');setInput('pf-dl','166');
doPhys(btn(),'');drain();
ok('既到達の再表示はしない',!has(main(),'CLUB 到達'));

print('--- 5) showTrainingResult 共通骨格（FULL TIME維持） ---');
showTrainingResult({totalVolume:1234,results:[
  {exName:'スクワット',volume:800,lastVolume:700},
  {exName:'ベンチ',skipped:true,skipReason:'痛み・怪我'}
]},[],['ベンチ'],null);
var h5=main();
ok('FULL TIMEヒーロー',has(h5,'FULL TIME')&&has(h5,'1,234'));
ok('前回比+100kg行',has(h5,'+'===''?'':'100kg')); // 800-700=100
ok('スキップ行はバッジ',has(h5,'痛み・怪我'));

print(__fail===0?'ALL MEASURE-RESULT TESTS PASSED':(__fail+' TESTS FAILED'));
