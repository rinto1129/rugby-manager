// P7d レビュー修正（coach・閲覧専用）: 「最新評価」は臨床評価だけを根拠にし、メモのみ評価でも行が消えない
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_p7d_coach.js
// 核心: (1)bySelf(選手の自己申告)は復帰判断の根拠から除外 (2)同日2件はinputAtで決着
//       (3)痛み/ROM/MMTが全て空でもnoteを出す（''を返すと呼び出し側で「最新評価」行ごと消える）
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}

print('--- 1) evalSummary: メモのみの評価でも空文字にならない ---');
var s1=evalSummary({date:'2026-08-03',pain:{},rom:{},mmt:{},note:'夜間の張り残存'});
ok('noteが出る', /夜間の張り残存/.test(s1));
ok('空文字ではない', s1!=='');

print('--- 2) evalSummary: 痛み等があればそちらを優先（noteは出さない） ---');
var s2=evalSummary({date:'2026-08-03',pain:{motion:6},rom:{},mmt:{},note:'メモ'});
ok('痛み6/10を表示', /痛み6\/10/.test(s2));
ok('noteは出さない', !/メモ/.test(s2));

print('--- 3) evalSummary: 完全に空なら空文字（従来どおり） ---');
ok('空文字', evalSummary({date:'2026-08-03',pain:{},rom:{},mmt:{}})==='');
ok('null安全', evalSummary(null)==='');

print('--- 4) evalSummary: noteは必ずエスケープ（自由記述の注入防止） ---');
var s4=evalSummary({pain:{},rom:{},mmt:{},note:'<img src=x onerror=alert(1)>'});
ok('生タグを出さない', s4.indexOf('<img')<0);
ok('エスケープ済み', /&lt;img/.test(s4));

print('--- 5) injEvidence: 選手の自己申告(bySelf)は最新評価の根拠にしない ---');
var ch5={evals:[
  {id:'clin',date:'2026-08-01',inputAt:'2026-08-01T02:00:00Z',pain:{motion:2}},
  {id:'self',date:'2026-08-03',inputAt:'2026-08-03T02:00:00Z',bySelf:true,pain:{motion:9}}
],returnCriteria:{},medical:{},injDetail:{},soaps:[]};
var e5=injEvidence(ch5);
ok('採用されたのは臨床評価レコード', e5.ev && e5.ev.id==='clin');
ok('要約は痛み2/10', /痛み2\/10/.test(evalSummary(e5.ev)));
ok('自己申告(痛み9)は採用されない', !/痛み9\/10/.test(evalSummary(e5.ev)));

print('--- 6) injEvidence: 同日2件は inputAt が新しい方を最新にする ---');
var ch6={evals:[
  {id:'am',date:'2026-08-03',inputAt:'2026-08-03T01:00:00Z',pain:{motion:8}},
  {id:'pm',date:'2026-08-03',inputAt:'2026-08-03T09:00:00Z',pain:{motion:1}}
],returnCriteria:{},medical:{},injDetail:{},soaps:[]};
var e6=injEvidence(ch6);
ok('午後の評価が最新', e6.ev && e6.ev.id==='pm');
ok('要約は痛み1/10', /痛み1\/10/.test(evalSummary(e6.ev)));

print('--- 7) injEvidence: 自己申告しか無ければ最新評価は空（臨床評価が未実施＝正しい） ---');
var ch7={evals:[{id:'self',date:'2026-08-03',bySelf:true,pain:{motion:5}}],returnCriteria:{},medical:{},injDetail:{},soaps:[]};
ok('最新評価レコードはnull', injEvidence(ch7).ev===null);
ok('要約も空（＝呼び出し側で行が出ない）', evalSummary(injEvidence(ch7).ev)==='');

print(__fail===0?'ALL P7D-COACH TESTS PASSED':(__fail+' TESTS FAILED'));
