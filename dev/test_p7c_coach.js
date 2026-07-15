// P7c: coach根拠 抽出(injEvidence)＋評価要約(evalSummary) テスト
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_p7c_coach.js
// 核心=(1)injEvidence: カルテchから 診断名(medical.diagnosis)/機転(injDetail.mechanism)/復帰基準達成数/最新eval・soap(日付降順)/画像有無 を抽出（閲覧専用・書き込みなし）
//       (2)画像有無=imgTypesが1つ以上 or imgFindings文字列あり（ch.imagesは死placeholderのため使わない）
//       (3)evalSummary: 痛みは最大値・ROM/MMTは先頭キーの短い要約
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}

print('--- 1) injEvidence: 抽出 ---');
var ch={
  medical:{diagnosis:'前十字靭帯損傷', imgTypes:['MRI','エコー'], imgFindings:''},
  injDetail:{mechanism:'非コンタクト（ステップ/方向転換）'},
  returnCriteria:{'痛みなし(安静時)':true,'医師の許可':true,'筋力が健側の90%以上':false},
  evals:[{date:'2026-07-01',pain:{rest:0,motion:2}},{date:'2026-07-10',pain:{rest:1,motion:3},rom:{'膝屈曲':120},mmt:{'大腿四頭筋':4}}],
  soaps:[{date:'2026-07-05',a:'腫脹軽減',p:'ROM訓練継続'},{date:'2026-07-12',a:'荷重時痛消失',p:'ジョグ開始'}]
};
var e=injEvidence(ch);
ok('診断名', e.diagnosis==='前十字靭帯損傷');
ok('機転', e.mechanism==='非コンタクト（ステップ/方向転換）');
ok('復帰基準 達成数=2', e.critDone===2);
ok('復帰基準 総数=12', e.critTotal===RETURN_CRITERIA.length&&e.critTotal===12);
ok('最新eval=7/10（日付降順で先頭）', e.ev&&e.ev.date==='2026-07-10');
ok('最新soap=7/12（日付降順で先頭）', e.soap&&e.soap.date==='2026-07-12');
ok('画像あり(imgTypes)', e.hasImg===true);
ok('imgTypes保持', e.imgTypes.length===2);

print('--- 2) 画像有無の判定 ---');
ok('imgTypes空でもimgFindingsあればhasImg', injEvidence({medical:{imgFindings:'骨挫傷疑い'}}).hasImg===true);
ok('画像情報なしはhasImg=false', injEvidence({medical:{}}).hasImg===false);
ok('ch=nullでも落ちない', injEvidence(null).critTotal===12&&injEvidence(null).hasImg===false&&injEvidence(null).ev===null);
ok('returnCriteria無しでもdone=0', injEvidence({}).critDone===0);

print('--- 3) evalSummary ---');
ok('痛みは最大値', evalSummary({pain:{rest:1,motion:3,night:0,press:2}}).indexOf('痛み3/10')>=0);
ok('ROM先頭キー', evalSummary({rom:{'膝屈曲':120}}).indexOf('ROM 膝屈曲 120')>=0);
ok('MMT先頭キー', evalSummary({mmt:{'大腿四頭筋':4}}).indexOf('MMT 大腿四頭筋 4')>=0);
ok('痛み0のみなら痛み非表示', evalSummary({pain:{rest:0,motion:0}})==='');
ok('null評価は空文字', evalSummary(null)==='');
ok('複数指標を / で連結', evalSummary({pain:{motion:2},rom:{'膝屈曲':110}}).indexOf('痛み2/10 / ROM')>=0);

print('--- 4) evalSummary XSS: 自由記述の値もエスケープ（レビュー確定所見の修正） ---');
ok('ROM値の<img注入をエスケープ', evalSummary({rom:{'膝屈曲':'120<img src=x onerror=alert(1)>'}}).indexOf('<img')<0);
ok('MMT値の<b>をエスケープ', evalSummary({mmt:{'四頭筋':'4<b>'}}).indexOf('<b>')<0);
ok('ROM正常値(数値)は表示維持', evalSummary({rom:{'膝屈曲':120}}).indexOf('120')>=0);

print('--- 5) hasImg: imgFindings配列の防御（空配列で誤検出しない） ---');
ok('imgFindings空配列はhasImg false', injEvidence({medical:{imgFindings:[]}}).hasImg===false);
ok('imgFindings非空配列はhasImg true', injEvidence({medical:{imgFindings:['MRI所見あり']}}).hasImg===true);
ok('imgFindings文字列はhasImg true', injEvidence({medical:{imgFindings:'骨挫傷疑い'}}).hasImg===true);

if(__fail)print('\n'+__fail+' FAIL');else print('\nALL P7C-COACH TESTS PASSED');
