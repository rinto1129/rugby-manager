// 試合基盤ヘルパー（P1a・identical: matchEvents/matchEventById/matchEventByDate/squadOf/squadRole/matchEvTitle/
//   mdBelongsTo/mdOf/mdsOfEvent/mdsOfEventUniq/mdDupIn/mdLoad/mdSleepStr/mdFatigueStr/mdInjuryLive/mdHiaLive/mdHia/
//   hasCondOn/pendingMatchChecks/matchChecksMissing）の契約を3サイト共通で固定する。
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_helpers.js
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_matchday_helpers.js
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_matchday_helpers.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function setKey(k,arr){D[k]=arr;}

// ===== fixture 初期化 =====
setKey('p',[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'HO',year:3},{id:3,name:'選手3',position:'SO',year:1}]);
setKey('cal',[]);setKey('md',[]);setKey('i',[]);setKey('f',[]);

print('--- matchEvents: date昇順・同日はid昇順 ---');
setKey('cal',[
  {id:300,date:daysAgo(1),type:'match',title:'C'},
  {id:100,date:daysAgo(5),type:'match',title:'A'},
  {id:200,date:daysAgo(5),type:'match',title:'B'},
  {id:999,date:daysAgo(2),type:'practice',title:'練習'}
]);
var evs=matchEvents();
ok('practiceは含まれない',evs.length===3);
ok('date昇順1件目=5日前',evs[0].date===daysAgo(5));
ok('同日はid文字列昇順(100が先)',evs[0].id===100&&evs[1].id===200);
ok('3件目=1日前',evs[2].date===daysAgo(1));

print('--- matchEventById: 存在確認＋D.cal差し替え後の失効(メモ化) ---');
ok('id一致で取得',matchEventById(100)&&matchEventById(100).title==='A');
ok('存在しないidはnull',matchEventById(999999)===null);
ok('id nullはnull',matchEventById(null)===null);
var oldCalRef=D.cal;
setKey('cal',[{id:100,date:daysAgo(5),type:'match',title:'A2'}]);
ok('D.cal差し替え後、旧イベント(id200)は引けない',matchEventById(200)===null);
ok('D.cal差し替え後、新データを正しく反映',matchEventById(100).title==='A2');

print('--- squadOf/squadRole: null安全・境界値 ---');
ok('ev nullでsquadOfは空配列',squadOf(null).length===0);
ok('squad未定義でも空配列',squadOf({id:1}).length===0);
var evSquad={id:400,date:daysAgo(3),type:'match',squad:[{pid:1,num:1},{pid:2,num:15},{pid:3,num:16}]};
ok('num1→start',squadRole(evSquad,1)==='start');
ok('num15→start(境界)',squadRole(evSquad,2)==='start');
ok('num16→reserve(境界)',squadRole(evSquad,3)==='reserve');
ok('未所属→null',squadRole(evSquad,999)===null);
var evBad={id:401,date:daysAgo(3),type:'match',squad:[{pid:9,num:'x'}]};
ok('数値以外の番号→reserve扱い',squadRole(evBad,9)==='reserve');

print('--- matchEventByDate: pid優先(同日複数戦でsquad所属を優先) ---');
setKey('cal',[
  {id:501,date:daysAgo(2),type:'match',title:'A戦',squad:[{pid:1,num:1}]},
  {id:502,date:daysAgo(2),type:'match',title:'B戦',squad:[{pid:2,num:1}]}
]);
ok('pid未指定は先頭(id昇順の最初)',matchEventByDate(daysAgo(2)).id===501);
ok('pid=1所属のA戦が優先',matchEventByDate(daysAgo(2),1).id===501);
ok('pid=2所属のB戦が優先',matchEventByDate(daysAgo(2),2).id===502);
ok('存在しない日付はnull',matchEventByDate('1999-01-01')===null);

print('--- matchEvTitle: escape済みHTML+KO ---');
var evXss={id:600,date:daysAgo(1),type:'match',opp:'<b>相手</b>',ko:'14:00'};
ok('opp内の<b>がescapeされる',has(matchEvTitle(evXss),'&lt;b&gt;')&&!has(matchEvTitle(evXss),'<b>'));
ok('KOが付く',has(matchEvTitle(evXss),'14:00 KO'));
var evNoOpp={id:601,date:daysAgo(1),type:'match',title:'練習試合'};
ok('opp無しはtitleにフォールバック',matchEvTitle(evNoOpp)==='練習試合');

print('--- mdBelongsTo: evId一致／孤児evIdのdate救済／疑似イベント／同日2試合 ---');
setKey('cal',[
  {id:701,date:daysAgo(4),type:'match',title:'A戦',squad:[{pid:1,num:1}]},
  {id:702,date:daysAgo(4),type:'match',title:'B戦',squad:[{pid:2,num:1}]}
]);
var evA=matchEventById(701),evB=matchEventById(702);
var mdWithEvId={id:1001,pid:1,date:daysAgo(4),evId:701};
ok('evId一致でA戦に所属',mdBelongsTo(mdWithEvId,evA));
ok('evId不一致でB戦には非所属(date一致でも)',!mdBelongsTo(mdWithEvId,evB));
var mdOrphan={id:1002,pid:1,date:daysAgo(4),evId:99999};
ok('孤児evId(存在しないid)はdate救済でA戦(squad所属)に一致',mdBelongsTo(mdOrphan,evA));
ok('孤児evIdはB戦には一致しない(squad所属優先でA戦が選ばれるため)',!mdBelongsTo(mdOrphan,evB));
var pseudoEv={id:null,date:daysAgo(4)};
ok('疑似イベント(id:null)はdate一致のみで所属',mdBelongsTo(mdOrphan,pseudoEv));
var mdLegacyNoEvId={id:1003,pid:2,date:daysAgo(4)};
ok('evId無しの旧mdは同日2試合でsquad所属(B戦)にのみ属する',mdBelongsTo(mdLegacyNoEvId,evB));
ok('evId無しの旧mdはsquad非所属のA戦には属さない',!mdBelongsTo(mdLegacyNoEvId,evA));
var mdLegacyNoSquad={id:1004,pid:3,date:daysAgo(4)};
ok('evId無し・どちらのsquadにも居ない選手は先頭イベント(A戦)にのみ属する',mdBelongsTo(mdLegacyNoSquad,evA));
ok('先頭以外(B戦)には属さない',!mdBelongsTo(mdLegacyNoSquad,evB));

print('--- mdOf/mdsOfEvent/mdsOfEventUniq: 集計は必ずヘルパー経由 ---');
setKey('md',[mdWithEvId,mdOrphan,mdLegacyNoEvId]);
ok('mdOf(pid1,A戦)はinputAt最新(mdOrphanの方が後で無ければmdWithEvId)',mdOf(1,evA)!=null);
ok('mdOf(pid2,B戦)はmdLegacyNoEvId',mdOf(2,evB)&&mdOf(2,evB).id===1003);
ok('mdOf(pid2,A戦)はnull(B戦所属のため)',mdOf(2,evA)===null);
ok('mdsOfEvent(A戦)はpid1の2件(evId一致+孤児救済)',mdsOfEvent(evA).length===2);
ok('mdsOfEventUniq(A戦)はpidごとに1件',mdsOfEventUniq(evA).length===1);

print('--- mdDupIn: 同日A提出後にBを提出できる(date一致だけでは弾かない) ---');
var latestAfterA=[{id:2001,pid:5,date:daysAgo(4),evId:701}];
ok('A戦に提出済みのpid5はA戦でdup検出',mdDupIn(latestAfterA,5,evA));
ok('A戦に提出済みのpid5はB戦ではdupにならない(同日でも別試合)',mdDupIn(latestAfterA,5,evB)===null);

print('--- mdLoad: 旧mdはnull・v2は数値 ---');
ok('rpe/minutes両方揃うと数値',mdLoad({rpe:8,minutes:70})===560);
ok('rpe無しはnull(旧md)',mdLoad({minutes:70})===null);
ok('minutes無しはnull',mdLoad({rpe:8})===null);
ok('mdLoad(null)はnull',mdLoad(null)===null);

print('--- mdSleepStr: 旧時刻換算・v2 sleepH ---');
ok('sleepH指定はxh表示',mdSleepStr({sleepH:7.5})==='7.5h');
ok('旧sleepTime/wakeTimeは時間換算して表示',has(mdSleepStr({sleepTime:'23:00',wakeTime:'06:30'}),'7.5h'));
ok('どちらも無ければハイフン',mdSleepStr({})==='-');

print('--- mdFatigueStr: 値<1は未入力・分母はv2/旧で切替 ---');
ok('v2は分母5',has(mdFatigueStr({v:2,preFatigue:3,postFatigue:4}),'前3/5')&&has(mdFatigueStr({v:2,preFatigue:3,postFatigue:4}),'後4/5'));
ok('旧は分母6',has(mdFatigueStr({fatiguePre:3,fatiguePost:5}),'前3/6')&&has(mdFatigueStr({fatiguePre:3,fatiguePost:5}),'後5/6'));
ok('0は未入力扱い',has(mdFatigueStr({v:2,preFatigue:0,postFatigue:4}),'前未入力'));

print('--- mdInjuryLive/mdHiaLive/mdHia: HIAと怪我の二重計上を防ぐ ---');
setKey('i',[]);
// ケース1: HIAのみ起票したv2 md → mdInjuryLive null・mdHia true
var hiaInj={id:9001,pid:1,mdId:5001,hia:true,type:'脳震盪',source:'match',approved:null};
var mdHiaOnly={id:5001,pid:1,date:daysAgo(1),v:2,injured:false,hiaImpact:true,hiaSymptoms:['頭痛'],hiaInjId:9001};
setKey('i',[hiaInj]);
ok('HIAのみ起票: mdInjuryLiveはnull(HIA除外)',mdInjuryLive(mdHiaOnly)===null);
ok('HIAのみ起票: mdHiaLiveはhiaInjを返す',mdHiaLive(mdHiaOnly)&&mdHiaLive(mdHiaOnly).id===9001);
ok('HIAのみ起票: mdHiaはtrue',mdHia(mdHiaOnly)===true);
// ケース2: 脳震盪typeの怪我報告(injId===hiaInjIdの同一id) → 両方true
var concussionInj={id:9002,pid:1,mdId:5002,hia:true,type:'脳震盪',source:'match',approved:null};
setKey('i',[concussionInj]);
var mdConcussion={id:5002,pid:1,date:daysAgo(1),v:2,injured:true,injId:9002,hiaInjId:9002,hiaImpact:true,hiaSymptoms:['頭痛']};
ok('脳震盪報告: mdInjuryLiveがinjIdで取得できる(同一id)',mdInjuryLive(mdConcussion)&&mdInjuryLive(mdConcussion).id===9002);
ok('脳震盪報告: mdHiaLiveも同一idで取得',mdHiaLive(mdConcussion)&&mdHiaLive(mdConcussion).id===9002);
ok('脳震盪報告: mdHiaもtrue',mdHia(mdConcussion)===true);
// ケース3: v2 md(injured:false)は同日source:matchのiにdateフォールバックしない
var otherInj={id:9003,pid:1,date:daysAgo(1),source:'match',approved:null,type:'捻挫'};
setKey('i',[otherInj]);
var mdV2NotInjured={id:5003,pid:1,date:daysAgo(1),v:2,injured:false};
ok('v2 md(injured:false)は同日source:matchのiを拾わない',mdInjuryLive(mdV2NotInjured)===null);
// ケース4: 旧md(injured:true)はdate×sourceで拾う
var mdLegacyInjured={id:5004,pid:1,date:daysAgo(1),injured:true};
ok('旧md(injured:true)はpid×date×source:matchのiを拾う',mdInjuryLive(mdLegacyInjured)&&mdInjuryLive(mdLegacyInjured).id===9003);
// 却下は除外
var rejectedInj={id:9004,pid:1,mdId:5005,hia:true,type:'脳震盪',source:'match',approved:false};
setKey('i',[rejectedInj]);
var mdRejectedHia={id:5005,pid:1,date:daysAgo(1),v:2,hiaImpact:true,hiaSymptoms:['頭痛'],hiaInjId:9004};
ok('却下済み(approved:false)のHIAはmdHiaLiveから除外',mdHiaLive(mdRejectedHia)===null);
ok('却下済みのHIAはmdHiaもfalse(hiaInjId指定時は生死のみ見る)',mdHia(mdRejectedHia)===false);

print('--- hasCondOn: fまたはmdがある日 ---');
setKey('f',[{id:1,pid:1,date:daysAgo(2),rpe:5}]);
setKey('md',[{id:2,pid:2,date:daysAgo(2)}]);
ok('fがある日はtrue',hasCondOn(1,daysAgo(2)));
ok('mdのみでもtrue',hasCondOn(2,daysAgo(2)));
ok('どちらも無ければfalse',hasCondOn(3,daysAgo(2))===false);

print('--- pendingMatchChecks: 窓・squad無し除外・メンバー外除外 ---');
setKey('cal',[
  {id:800,date:daysAgo(1),type:'match',squad:[{pid:1,num:1}]},
  {id:801,date:daysAgo(2),type:'match',squad:[{pid:1,num:1}]},
  {id:802,date:daysAgo(4),type:'match',squad:[{pid:1,num:1}]},
  {id:803,date:daysAgo(2),type:'match',squad:[]}
]);
setKey('md',[]);
var pend=pendingMatchChecks(1,todayStr(),3);
ok('窓内(3日)の2試合が対象',pend.length===2);
ok('4日前(窓外)は含まれない',!pend.some(function(x){return x.ev.id===802;}));
ok('squad未登録の試合は対象外',!pend.some(function(x){return x.ev.id===803;}));
ok('daysAgoが正しい',pend[0].daysAgo===2&&pend[1].daysAgo===1);
setKey('md',[{id:9,pid:1,date:daysAgo(1),evId:800}]);
var pend2=pendingMatchChecks(1,todayStr(),3);
ok('提出済みの試合は消える',!pend2.some(function(x){return x.ev.id===800;}));
ok('メンバー外(squad非所属)の選手は対象外',pendingMatchChecks(999,todayStr(),3).length===0);

print('--- matchChecksMissing: D.p在籍のみ・mdOf経由 ---');
setKey('p',[{id:1,name:'選手1'},{id:2,name:'選手2'}]);
setKey('cal',[{id:900,date:daysAgo(1),type:'match',squad:[{pid:1,num:1},{pid:2,num:2},{pid:999,num:3}]}]);
setKey('md',[{id:10,pid:1,date:daysAgo(1),evId:900}]);
var ev900=matchEventById(900);
var missing=matchChecksMissing(ev900);
ok('未提出のpid2のみ返る',missing.length===1&&missing[0].id===2);
ok('D.pに存在しないpid999は含まれない(在籍者のみ)',!missing.some(function(p){return p.id===999;}));

print(__fail===0?'ALL MATCHDAY-HELPERS TESTS PASSED':'FAILED: '+__fail+' checks');
