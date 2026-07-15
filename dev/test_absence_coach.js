// P7b: coach 追加読み（aAbsenceEvents の全欠席抽出＋二重計上回避 / isInjuryAbsent 判定）テスト
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_absence_coach.js
// 核心=(1)a(申告)から「全欠席」だけを疑似tlog欠席として追加読み。遅刻/早退/部分参加は除外。スタッフ記録(自由記述)や欠席は採用
//       (2)同(pid,date)にtlog欠席がある場合は二重計上せず除外（seenで畳む）。a内の同(pid,date)重複も1件
//       (3)isInjuryAbsentは tlogの'痛み・怪我'完全一致のみ。a由来(_fromA)は自由記述の誤検出を避けるため怪我判定しない
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
var TD=todayStr();

print('--- 1) isInjuryAbsent ---');
ok('tlog 痛み・怪我 → 怪我欠席', isInjuryAbsent({absentReason:'痛み・怪我'})===true);
ok('tlog 体調不良 → 非怪我', isInjuryAbsent({absentReason:'体調不良'})===false);
ok('tlog 時間がない → 非怪我', isInjuryAbsent({absentReason:'時間がない'})===false);
ok('a由来(_fromA)は怪我判定しない（自由記述誤検出回避）', isInjuryAbsent({absentReason:'欠席：右膝の怪我',_fromA:true})===false);
ok('a由来 付き添い等の誤検出も防ぐ', isInjuryAbsent({absentReason:'欠席：怪我人の付き添い',_fromA:true})===false);
ok('理由なし → false（例外なし）', isInjuryAbsent({})===false);

print('--- 2) aAbsenceEvents: 全欠席抽出・種別除外・二重計上回避 ---');
_tlogArch=[];_tlaCache=null;
D.tlog=[{id:1,pid:3,absent:true,absentReason:'体調不良',date:TD}]; // pid3にtlog欠席
D.a=[{id:9,date:TD,label:'',absentees:[
  {pid:2,reason:'欠席：発熱',source:'player'},        // 全欠席(選手申告) → 含む
  {pid:5,reason:'発熱',source:undefined},             // スタッフ記録(自由記述・種別接頭なし) → 含む
  {pid:6,reason:'遅刻：授業',source:'player'},         // 遅刻 → 除外
  {pid:7,reason:'早退：バイト',source:'player'},       // 早退 → 除外
  {pid:8,reason:'部分参加：リハビリ',source:'player'},  // 部分参加 → 除外
  {pid:3,reason:'欠席：私用',source:'player'},         // pid3はtlog欠席あり → 二重計上回避で除外
  {pid:4,reason:'欠席：私用',source:'player'},{pid:4,reason:'重複',source:'staff'} // a内同(pid4,date)重複 → 1件
]}];
var ev=aAbsenceEvents(null);
var pids=ev.map(function(e){return e.pid;}).sort(function(a,b){return a-b;});
ok('全欠席(選手申告 pid2)は含む', pids.indexOf(2)>=0);
ok('スタッフ記録(自由記述 pid5)は含む', pids.indexOf(5)>=0);
ok('遅刻(pid6)は除外', pids.indexOf(6)<0);
ok('早退(pid7)は除外', pids.indexOf(7)<0);
ok('部分参加(pid8)は除外', pids.indexOf(8)<0);
ok('tlog欠席と同(pid3,date)は二重計上しない', pids.indexOf(3)<0);
ok('a内の同(pid4,date)重複は1件のみ', ev.filter(function(e){return e.pid===4;}).length===1);
ok('返却は疑似tlog形(absent:true,_fromA)', ev.length>0&&ev.every(function(e){return e.absent===true&&e._fromA===true;}));

print('--- 3) aAbsenceEvents: fromDate フィルタ ---');
_tlaCache=null;
D.tlog=[];
D.a=[{id:8,date:'2000-01-01',label:'',absentees:[{pid:5,reason:'欠席：昔',source:'player'}]}];
ok('fromDate以前は除外', aAbsenceEvents(TD).length===0);
ok('fromDate=null なら全期間', aAbsenceEvents(null).length===1);

if(__fail)print('\n'+__fail+' FAIL');else print('\nALL ABSENCE-COACH TESTS PASSED');
