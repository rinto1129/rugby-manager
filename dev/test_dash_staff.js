// FUKUDAI RED S3: staffダッシュボード（V.dash）の模擬実行テスト
// 対象: stat-tile count-up（正の指標のみ）/提出率リングゲージ/アラート3層化+折りたたみ/
//       クラブレコード・ボード/掲示板ノーティス/ppCardHtml（player同一マークアップ）/絵文字ゼロ/
//       todayS巻き上げバグ修正（疲労度アラートが常に空になる既存バグ）の回帰
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(h,sub){return String(h).indexOf(sub)>=0;}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
function renderDash(){__els['main-ct']=mkEl();__els['main-ct'].id='main-ct';V.dash();return __els['main-ct'].innerHTML;}

// ===== テストデータ =====
var td=todayStr();
function dOff(n){var d=new Date();d.setDate(d.getDate()-n);return toDateStr(d);}
// 来週月曜（V.dashと同じ計算）
var _t=new Date();var _dow=_t.getDay();var _d2m=_dow===0?1:8-_dow;var _nm=new Date(_t);_nm.setDate(_t.getDate()+_d2m);var nextMonS=toDateStr(_nm);

D.p=[{id:1,name:'選手A',position:'PR',year:2},{id:2,name:'選手B',position:'HO',year:3}];
D.f=[{id:1,pid:1,date:td,rpe:9,sleep:7,duration:60}]; // 提出率50%・RPE9=疲労度アラート対象
D.a=[
  {id:1,date:dOff(1),absentees:[{pid:2,reason:''}]},
  {id:2,date:dOff(2),absentees:[{pid:2,reason:''}]},
  {id:3,date:dOff(3),absentees:[{pid:2,reason:''}]}
]; // 選手Bが3回連続欠席=注意層
D.i=[
  {id:11,pid:1,part:'膝',type:'捻挫',side:'右',date:td,source:'player',resolved:false}, // 未承認=緊急層
  {id:12,pid:2,part:'肩',type:'脱臼',side:'',date:'2026-01-01',resolved:false,approved:true,returnDate:nextMonS} // 来週復帰=情報層
];
D.ph=[{id:21,pid:1,date:'2026-06-01',squat:180,bronco:290}];
D.pp=[{id:31,type:'pull',date:'2026-07-01',by:'staff'}];
D.ann=[{id:41,date:'2026-07-01',text:'テスト告知',readBy:[]}];
D.r=[];D.md=[];D.matchsel=[];D.msess=[];D.bc=[];D.cal=[];D.tapeslot=[];D.tape=[];D.rplan=[];D.offday=[];D.std=[];D.tlog=[];
window._dashWarnOpen=undefined;

print('--- V.dash 描画（S3リスキン） ---');
var h=renderDash();
ok('描画が完走して内容がある',h.length>2000);

print('--- stat-tile: count-up（正の指標のみ） ---');
ok('登録選手にdata-cu',has(h,'data-cu="2"'));
ok('提出率50にdata-cu',has(h,'data-cu="50"'));
ok('怪我・リハビリ中タイルにはdata-cuが無い（負の指標は禁止）',has(h,'<div class="stat-v num" style="color:var(--red)">2</div>'));
ok('stat-vは.num（italicタイポ）',has(h,'class="stat-v num"'));

print('--- 提出率リングゲージ（1枚のみ） ---');
ok('リングSVGあり',has(h,'data-ring="1"'));
ok('dashoffsetが50%相当62.83',has(h,'stroke-dashoffset="62.83"'));
ok('50%はamber色',has(h,'stroke="var(--amber)"'));
ok('リングは1個だけ',h.split('data-ring').length===2);

print('--- アラート3層化 ---');
ok('緊急層: 新着怪我ヘッダ+アイコン',has(h,'新着怪我')&&has(h,'#i-bandage'));
ok('緊急層: 件数バッジ',has(h,'<span class="bd bd-r">1</span>'));
ok('注意層: 折りたたみ構造',has(h,'id="warn-clp"'));
ok('注意層: 初期状態は閉じている',has(h,'<div class="clp" id="warn-clp">'));
ok('注意層: 件数バッジ+シェブロン',has(h,'注意 — 経過観察')&&has(h,'clp-chev'));
ok('連続欠席行: 怪我持ち(選手B=肩脱臼)にi-bandageマーク',has(h,'選手B <svg class="ic" width="12"'));
ok('情報層: 来週復帰予定+フラッグアイコン',has(h,'来週復帰予定')&&has(h,'#i-flag'));

print('--- 折りたたみトグル（クラスB・状態維持） ---');
dashWarnToggle();
ok('トグルでopen状態true',window._dashWarnOpen===true);
var h2=renderDash();
ok('再描画でもopenが維持される',has(h2,'<div class="clp open" id="warn-clp">'));
dashWarnToggle();
ok('再トグルでfalse',window._dashWarnOpen!==true);

print('--- クラブレコード・ボード ---');
ok('CLUB RECORDSキッカー',has(h,'CLUB RECORDS'));
ok('SQ記録180にdata-cu+unit',has(h,'data-cu="180"')&&has(h,'<span class="unit">kg</span>'));
ok('記録保持者名',has(h,'選手A'));
ok('ブロンコは時刻表記（count-up対象外）',has(h,'4分50秒'));

print('--- 掲示板ノーティス ---');
ok('notice-item様式',has(h,'class="notice-item"'));
ok('告知テキスト',has(h,'テスト告知'));

print('--- ppCardHtml（player同一マークアップ） ---');
ok('PULL=--pull（--redではない）',has(h,'var(--pull)'));
ok('i-pullアイコン',has(h,'#i-pull'));
ok('skewフラッグ様式',has(h,'class="flag"'));

print('--- 疲労度アラート（todayS巻き上げバグ修正の回帰） ---');
ok('RPE9の選手Aが疲労度アラートに出る',has(h,'選手A: RPE 9/10'));

print('--- 提出状況 ---');
ok('未提出1名',has(h,'コンディション未提出 (1名)'));
ok('未提出チップに選手B',has(h,'chip-late'));

print('--- 絵文字ゼロ（コード起源） ---');
ok('astral絵文字なし',!/[\uD800-\uDBFF]/.test(h));
ok('BMP記号絵文字なし(2600-27BF/2B00-2BFF/2300-23FF/FE0F)',!/[☀-➿⬀-⯿⌀-⏿️]/.test(h));

if(__fail){print('FAILED: '+__fail);quit(1);}else print('ALL DASH-STAFF TESTS PASSED');
