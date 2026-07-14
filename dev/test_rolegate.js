// P4: リハビリ役割分担フレーム（roleGate / ROLE_ACL / roleTag）の単体テスト
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_rolegate.js
// 核心=roleGate(action)が MY_ROLE × ROLE_MODE × アクション担当ロール(ROLE_ACL) の全組合せで正しく許可/不可を返すこと。
//   ・確定操作(resolve/delete/approve等)=両モードでスタッフ専任（trainerは常に不可＝依頼へ）
//   ・日次記録(rlog/eval等)=softは両者可・strictでトレーナー専任（staffはstrictで不可）
//   ・段階変更(stage=both)=常に両者可 / 未知アクション=defaultでboth扱い
// roleTagは 🔵トレーナー / 🟤スタッフ の役割バッジHTMLを返す。
// ※staff.jsを土台に読み込むが、MY_ROLE/ROLE_MODEはグローバルなのでテスト内で書き換えて両ロール両モードを検証する。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}

// 事前条件: 枠組みが存在すること
ok('roleGate is function', typeof roleGate==='function');
ok('roleTag is function', typeof roleTag==='function');
ok('ROLE_ACL is object', typeof ROLE_ACL==='object' && ROLE_ACL!==null);
ok('MY_ROLE=staff (this file)', MY_ROLE==='staff');
ok('ROLE_MODE=soft (default ship value)', ROLE_MODE==='soft');

// ROLE_ACL の割り当てが設計どおり
ok('ACL rlog=trainer', ROLE_ACL.rlog==='trainer');
ok('ACL stage=both', ROLE_ACL.stage==='both');
ok('ACL diagnosis=trainer', ROLE_ACL.diagnosis==='trainer');
ok('ACL eval=trainer', ROLE_ACL.eval==='trainer');
ok('ACL nextmenu=trainer', ROLE_ACL.nextmenu==='trainer');
ok('ACL resolve=staff', ROLE_ACL.resolve==='staff');
ok('ACL unresolve=staff', ROLE_ACL.unresolve==='staff');
ok('ACL delete=staff', ROLE_ACL['delete']==='staff');
ok('ACL approveRtp=staff', ROLE_ACL.approveRtp==='staff');
ok('ACL approveRtest=staff', ROLE_ACL.approveRtest==='staff');

// --- roleGate 全網羅マトリクス ---
// 期待表: [action, staff+soft, staff+strict, trainer+soft, trainer+strict]
var MATRIX=[
  ['rlog',      true,  false, true,  true ],
  ['stage',     true,  true,  true,  true ],
  ['diagnosis', true,  false, true,  true ],
  ['eval',      true,  false, true,  true ],
  ['nextmenu',  true,  false, true,  true ],
  ['resolve',   true,  true,  false, false],
  ['unresolve', true,  true,  false, false],
  ['delete',    true,  true,  false, false],
  ['approveRtp',true,  true,  false, false],
  ['approveRtest',true,true,  false, false],
  ['__unknown__',true, true,  true,  true ]  // 未登録アクションはboth扱い
];
function gate(role,mode,action){MY_ROLE=role;ROLE_MODE=mode;return roleGate(action);}
MATRIX.forEach(function(row){
  var a=row[0];
  ok('gate staff/soft '+a+'='+row[1],   gate('staff','soft',a)===row[1]);
  ok('gate staff/strict '+a+'='+row[2], gate('staff','strict',a)===row[2]);
  ok('gate trainer/soft '+a+'='+row[3], gate('trainer','soft',a)===row[3]);
  ok('gate trainer/strict '+a+'='+row[4],gate('trainer','strict',a)===row[4]);
});

// 確定操作は「トレーナーは何をしても不可」を明示確認（依頼導線の根拠）
['resolve','unresolve','delete','approveRtp','approveRtest'].forEach(function(a){
  ok('trainer soft blocked '+a,  gate('trainer','soft',a)===false);
  ok('trainer strict blocked '+a,gate('trainer','strict',a)===false);
});

// --- roleTag 役割バッジ ---
var tTr=roleTag('trainer'), tSt=roleTag('staff'), tPl=roleTag('player');
ok('roleTag trainer has 🔵', tTr.indexOf('🔵')>=0);
ok('roleTag trainer uses --blue', tTr.indexOf('var(--blue)')>=0);
ok('roleTag trainer is .bd pill', tTr.indexOf('class="bd"')>=0);
ok('roleTag staff has 🟤', tSt.indexOf('🟤')>=0);
ok('roleTag staff uses --maroon', tSt.indexOf('var(--maroon)')>=0);
ok('roleTag player mentions 選手', tPl.indexOf('選手')>=0);
ok('roleTag unknown => empty', roleTag('nope')==='' && roleTag()==='');
// 色トークンは必ずvar()（背景色）。白文字 color:#fff のみリテラル許容。
ok('roleTag backgrounds are var() tokens',
   /background:var\(--/.test(tTr) && /background:var\(--/.test(tSt) && /background:var\(--/.test(tPl));

// --- stampWho: 保存時の役割/名前/時刻スタンプ ---
ok('stampWho is function', typeof stampWho==='function');
MY_ROLE='staff';
var r1=stampWho({id:1});
ok('stampWho savedRole=staff', r1.savedRole==='staff');
ok('stampWho savedBy=スタッフ', r1.savedBy==='スタッフ');
ok('stampWho savedAt is ISO', /^\d{4}-\d\d-\d\dT/.test(r1.savedAt));
ok('stampWho returns rec', r1.id===1);
MY_ROLE='trainer';   // trainerロールとして押した場合（このファイルにmyTrainerは無い→フォールバック名）
var r2=stampWho({id:2});
ok('stampWho trainer savedRole=trainer', r2.savedRole==='trainer');
ok('stampWho trainer savedBy set', typeof r2.savedBy==='string' && r2.savedBy.length>0);
ok('stampWho(null) safe', stampWho(null)===null);
MY_ROLE='staff';

// --- whoTag: 最終編集者表示（重複名デデュープ含む） ---
function cnt(s,sub){return s.split(sub).length-1;}
var wTr=whoTag('trainer','田中','2026-07-14T01:30:00.000Z');
ok('whoTag trainer has 🔵', wTr.indexOf('🔵')>=0);
ok('whoTag trainer shows name 田中', wTr.indexOf('田中')>=0);
ok('whoTag trainer has separator ・', wTr.indexOf(' ・ ')>=0);
var wStDup=whoTag('staff','スタッフ',null);   // 名前=ロール名 → 重複させない
ok('whoTag staff dedups redundant name (スタッフ once)', cnt(wStDup,'スタッフ')===1);
var wStNamed=whoTag('staff','山田',null);      // 具体名は表示
ok('whoTag staff keeps specific name 山田', wStNamed.indexOf('山田')>=0);
ok('whoTag empty when nothing', whoTag(null,null,null)==='' && whoTag('', '', '')==='');
ok('whoTag name-only (no role)', whoTag(null,'山田',null).indexOf('山田')>=0 && whoTag(null,'山田',null).indexOf('🔵')<0);

// --- roleGuard: softは素通り / strictで日次記録を実効ゲート（alertはpreludeでno-op） ---
ok('roleGuard is function', typeof roleGuard==='function');
MY_ROLE='staff';ROLE_MODE='soft';
['rlog','eval','diagnosis','nextmenu'].forEach(function(a){
  ok('roleGuard soft staff passes '+a, roleGuard(a)===true);   // 出荷=soft: 完全素通り
});
ROLE_MODE='strict';
['rlog','eval','diagnosis','nextmenu'].forEach(function(a){
  ok('roleGuard strict staff blocks '+a, roleGuard(a)===false); // strict: staffの日次記録は不可
});
MY_ROLE='trainer';
['rlog','eval','diagnosis','nextmenu'].forEach(function(a){
  ok('roleGuard strict trainer passes '+a, roleGuard(a)===true); // strict: trainerは日次記録OK
});
// 段階変更はboth＝どのモード/ロールでも素通り
MY_ROLE='staff';ROLE_MODE='strict';
ok('roleGuard stage always passes (both)', roleGuard('stage')===true);

// 後片付け: 出荷値へ戻す
MY_ROLE='staff';ROLE_MODE='soft';

if(__fail>0){print('\nROLEGATE TESTS: '+__fail+' FAILED');throw new Error('rolegate test failed');}
print('\nALL ROLEGATE TESTS PASSED');
