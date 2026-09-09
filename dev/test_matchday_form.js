// 試合日チェックv2フォーム（P1b・showMatchForm/doMatch）の模擬実行テスト
// 核心: 必須集合（出場区分・出場分>0時のRPE/パフォーマンス・試合後疲労・筋肉痛）を1回のalertで列挙・
//       保存形（v:2/evId数値化/任意未入力はフィールド無し）・怪我(i)/リハビリ(r)/HIA(i/r)生成・
//       既存怪我への紐づけでiが増えずmd.injId=既存id・i.mdId=md.id・dup時のi/r転記とpending破棄・
//       同日Aが提出した後にBが提出できる（mdDupInはpid単位）・minutes=0でrpeを省略
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_matchday_form.js
var __fail=0;
function ok(n,c){if(!c){__fail++;print('  NG '+n);}else print('  ok '+n);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function drain(){if(typeof drainMicrotasks==='function')drainMicrotasks();}
function setKey(k,arr){D[k]=arr;__store[k]=JSON.stringify(arr);}
function storeKey(k){return JSON.parse(__store[k]||'[]');}

var __els={};
document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};

function btn(){var b=mkEl();b.dataset={};return b;}

function reset(){
  __els={};__alerts.length=0;
  _mdPending=null;
  setKey('p',[{id:1,name:'選手1',position:'PR',year:2},{id:2,name:'選手2',position:'HO',year:2}]);
  setKey('cal',[{id:500,date:daysAgo(0),type:'match',opp:'相手大学',squad:[{pid:1,num:1},{pid:2,num:2}]}]);
  setKey('md',[]);setKey('i',[]);setKey('r',[]);
  myPid=1;
}

// フォームDOM値の一括セット（未入力にしたい項目はundefinedのまま渡す＝呼ばない）
function fillBase(v){
  document.getElementById('md-role').value=v.role!=null?v.role:'start';
  if(v.min!=null)document.getElementById('md-min').value=v.min;
  if(v.rpe!=null)document.getElementById('md-rpe').value=v.rpe;
  if(v.fpost!=null)document.getElementById('md-fpost').value=v.fpost;
  if(v.sore!=null)document.getElementById('md-sore').value=v.sore;
  if(v.perf!=null)document.getElementById('md-perf').value=v.perf;
  document.getElementById('md-inj').value=v.injured?'はい':'いいえ';
  document.getElementById('md-cramp').value=v.cramp?'はい':'いいえ';
  document.getElementById('md-hia').value=v.hia?'はい':'いいえ';
}

print('--- doMatch: 必須未入力は1回のalertに列挙されて保存されない（出場分が空欄=0扱いなのでRPE/パフォーマンスは必須にならない） ---');
reset();
fillBase({role:'start'}); // min/rpe/fpost/sore/perf すべて空
var b1=btn();
doMatch('500',b1);drain();
ok('保存されない',D.md.length===0);
ok('alertは1回のみ',__alerts.length===1);
ok('未入力項目が列挙される(出場分)',has(__alerts[0],'出場分'));
ok('未入力項目が列挙される(試合後疲労度)',has(__alerts[0],'試合後疲労度'));
ok('未入力項目が列挙される(筋肉痛)',has(__alerts[0],'筋肉痛'));

print('--- doMatch: 出場分>0を入れるとRPE・パフォーマンスも必須になる ---');
reset();
fillBase({role:'start',min:70}); // rpe/fpost/sore/perf 空
var b1b=btn();
doMatch('500',b1b);drain();
ok('保存されない',D.md.length===0);
ok('未入力項目が列挙される(RPE)',has(__alerts[__alerts.length-1],'RPE'));
ok('未入力項目が列挙される(パフォーマンス)',has(__alerts[__alerts.length-1],'パフォーマンス自己評価'));

print('--- doMatch: role=noneならminutes/rpe/perfは不要（試合後疲労・筋肉痛のみ必須） ---');
reset();
fillBase({role:'none',fpost:3,sore:1});
var b2=btn();
doMatch('500',b2);drain();
ok('保存される',D.md.length===1);
ok('minutesは0',D.md[0].minutes===0);
ok('rpeは書かれない',D.md[0].rpe===undefined);
ok('perfは書かれない',D.md[0].perf===undefined);
ok('v:2で保存',D.md[0].v===2);
ok('evIdは数値化される',D.md[0].evId===500);

print('--- doMatch: 通常保存（minutes>0はrpe/perf必須・保存形の確認） ---');
reset();
fillBase({role:'start',min:70,rpe:7,fpost:4,sore:2,perf:4});
var b3=btn();
doMatch('500',b3);drain();
ok('1件保存',D.md.length===1);
var m3=D.md[0];
ok('pid/date/evId',m3.pid===1&&m3.date===daysAgo(0)&&m3.evId===500);
ok('role/minutes/rpe',m3.role==='start'&&m3.minutes===70&&m3.rpe===7);
ok('postFatigue/soreness/perf',m3.postFatigue===4&&m3.soreness===2&&m3.perf===4);
ok('任意未入力(sleepH)はフィールド無し',m3.sleepH===undefined);
ok('任意未入力(note)はフィールド無し',m3.note===undefined);
ok('inputAtが記録される',typeof m3.inputAt==='string'&&m3.inputAt.length>0);
ok('ボタンが解放される(busy解除)',b3.dataset.busy!=='1');
ok('mdPendingはクリアされる',_mdPending===null);

print('--- doMatch: 怪我ありで新規i/rが生成され、md.injIdとi.mdIdが相互参照される ---');
reset();
fillBase({role:'start',min:60,rpe:6,fpost:3,sore:2,perf:3,injured:true});
document.getElementById('md-side').value='右';
document.getElementById('md-part').value='膝';
document.getElementById('md-type').value='捻挫';
document.getElementById('md-hist').value='初めて';
document.getElementById('md-how').value='タックルで';
document.getElementById('md-painat').value=6;
document.getElementById('md-painnow').value=4;
document.getElementById('md-cont').value='はい（続行した）';
document.getElementById('md-canprac').value='参加できる';
var b4=btn();
doMatch('500',b4);drain();
ok('mdが1件・iが1件・rが1件',D.md.length===1&&D.i.length===1&&D.r.length===1);
var m4=D.md[0],i4=D.i[0];
ok('md.injuredとinjId',m4.injured===true&&m4.injId===i4.id);
ok('i.mdIdがmdを指す',i4.mdId===m4.id);
ok('i.matchEvIdが数値',i4.matchEvId===500);
ok('i.sourceはmatch・approvedはnull',i4.source==='match'&&i4.approved===null);
ok('rはinjIdを指す',D.r[0].injId===i4.id);

print('--- doMatch: 既存の未解決怪我を「紐づける」チェック→新しいiを積まずmd.injId=既存id ---');
reset();
setKey('i',[{id:900,pid:1,side:'左',part:'肩',type:'打撲',date:daysAgo(0),resolved:false,approved:null,source:'player'}]);
fillBase({role:'start',min:50,rpe:5,fpost:3,sore:2,perf:3,injured:true});
document.getElementById('md-side').value='左';
document.getElementById('md-part').value='肩';
document.getElementById('md-type').value='打撲';
document.getElementById('md-hist').value='2回目';
document.getElementById('md-how').value='ラックで';
document.getElementById('md-painat').value=5;
document.getElementById('md-painnow').value=3;
document.getElementById('md-cont').value='はい（続行した）';
document.getElementById('md-canprac').value='参加できる';
document.getElementById('md-inj-link').checked=true;
document.getElementById('md-inj-link').dataset={injId:'900'};
var b5=btn();
doMatch('500',b5);drain();
ok('iは増えない(1件のまま)',D.i.length===1);
ok('md.injIdは既存id',D.md[0].injId==='900'||D.md[0].injId===900);
var i900after=D.i.find(function(x){return String(x.id)==='900';});
ok('既存iにmdId/matchEvIdが追記される',String(i900after.mdId)===String(D.md[0].id)&&i900after.matchEvId===500);

print('--- doMatch: HIA（衝撃あり＋症状1つ以上）でtype=脳震盪のi/rが自動起票される ---');
reset();
fillBase({role:'reserve',min:20,rpe:5,fpost:3,sore:1,perf:3,hia:true});
document.getElementById('md-hiasym').value='0'; // MD_HIA_SYMPTOMS[0]='頭痛'（chipVals経由で読む想定だがtoggleChip未経由のため直接valueで代用）
_chipDefs['md-hiasym']={labels:MD_HIA_SYMPTOMS,multi:true};
var b6=btn();
doMatch('500',b6);drain();
ok('mdにhiaInjIdが付く',D.md[0].hiaInjId!=null);
var hiaInj=D.i.find(function(x){return idEq(x.id,D.md[0].hiaInjId);});
ok('HIAの怪我が type=脳震盪・hia:true で起票される',!!hiaInj&&hiaInj.type==='脳震盪'&&hiaInj.hia===true);
ok('HIAのrehabも生成される',D.r.some(function(x){return idEq(x.injId,hiaInj.id);}));

print('--- doMatch: 同日にAが提出した後、Bも独立して提出できる（mdDupInはpid単位） ---');
reset();
fillBase({role:'start',min:80,rpe:8,fpost:4,sore:3,perf:3});
myPid=1;
doMatch('500',btn());drain();
ok('Aが保存できる',D.md.some(function(m){return idEq(m.pid,1);}));
myPid=2;
fillBase({role:'start',min:80,rpe:8,fpost:4,sore:3,perf:3});
doMatch('500',btn());drain();
ok('Bも独立して保存できる',D.md.some(function(m){return idEq(m.pid,2);}));
ok('合計2件',D.md.length===2);

print('--- doMatch: ローカルには無いがサーバー最新には既に自分のmdがある(競合=dup)場合、怪我報告はdup側へinjId転記されボタン解放・pendingはnullになる ---');
reset();
myPid=1;
// D.md（ローカルキャッシュ）は空のままローカルdup検出を素通りさせ、__store（サーバー最新）にだけ他端末が保存した自分のmdを仕込む＝競合を模擬
D.md=[];
var existingMd={id:777,pid:1,date:daysAgo(0),evId:500,inputAt:new Date().toISOString(),v:2,role:'start',minutes:80,rpe:7,postFatigue:3,soreness:2};
__store['md']=JSON.stringify([existingMd]);
fillBase({role:'start',min:60,rpe:6,fpost:3,sore:2,perf:3,injured:true});
document.getElementById('md-side').value='右';
document.getElementById('md-part').value='足首';
document.getElementById('md-type').value='捻挫';
document.getElementById('md-hist').value='初めて';
document.getElementById('md-how').value='ステップで';
document.getElementById('md-painat').value=5;
document.getElementById('md-painnow').value=3;
document.getElementById('md-cont').value='はい（続行した）';
document.getElementById('md-canprac').value='参加できる';
var b7=btn();
doMatch('500',b7);drain();
ok('mdは増えない(サーバー側の1件のまま)',D.md.length===1);
ok('怪我i/rは生成される',D.i.length===1&&D.r.length===1);
var dupAfter=D.md[0];
ok('dup側のmd.injIdに転記される',dupAfter.injId===D.i[0].id);
ok('injuredがtrueになる',dupAfter.injured===true);
ok('injLateフラグが立つ',dupAfter.injLate===true);
ok('ボタンが解放される',b7.dataset.busy!=='1');
ok('pendingはクリアされる',_mdPending===null);

print(__fail===0?'ALL MATCHDAY-FORM TESTS PASSED':'FAILED: '+__fail+' test(s)');
if(__fail>0)throw new Error('matchday form tests failed');
