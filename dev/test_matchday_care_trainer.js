// 試合後の要ケア一覧（matchCareList/matchCareCardHtml・trainer・P1c-14前倒し）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/trainer.js dev/test_matchday_care_trainer.js
// 核心: mdsOfEvent(ev)をそのまま使う（自前フィルタ禁止）ので、cal(D.cal)に存在しないevId(孤児)を持つv2 mdでも
//       日付一致で疑似イベントに拾われ提出数・要ケアに含まれる。HIAが最上段。approved===falseの怪我は除外。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function has(s,t){return String(s).indexOf(t)>=0;}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function setKey(k,arr){D[k]=arr;}

function baseline(){
  ['i','r','tape','tapeslot','trainers','rtpl','rplan','rlog','rtest_tpl','rtest','msess','injcomm','chart',
   'taperec','cal','pp','md','tmenu','tlog','texlist','e1rm'].forEach(function(k){setKey(k,[]);});
  setKey('p',[
    {id:1,name:'選手1',position:'PR',year:2},
    {id:2,name:'選手2',position:'HO',year:2},
    {id:3,name:'選手3',position:'SO',year:3}
  ]);
}

print('--- matchCareList: mdsOfEvent(ev)をそのまま使うため、calに存在しない孤児evIdのv2 mdも日付一致で拾われる（要ケア無しの場合） ---');
baseline();
setKey('cal',[]); // evId=555のイベントはcalに存在しない(孤児)
setKey('md',[{id:1,pid:1,date:daysAgo(1),evId:555,v:2,role:'start',minutes:80,rpe:6,inputAt:'2020-01-01T00:00:00Z'}]);
var pseudoEv=resolveMatchEvent(daysAgo(1));
ok('日付のみで疑似イベントが解決できる',!!pseudoEv);
var items0=matchCareList(pseudoEv);
ok('要ケアなし(通常提出のみ)なら空配列',items0.length===0);

print('--- matchCareList: 同じ孤児evIdでもHIA疑いがあれば提出数・要ケア一覧に含まれる（mdsOfEventの所属判定を自前フィルタで迂回していない証跡） ---');
baseline();
setKey('cal',[]); // evId=556のイベントはやはりcalに存在しない(孤児)。P1a-2で配置済みのcal(D.cal)購読を必須にしないための検証
setKey('md',[{id:2,pid:1,date:daysAgo(1),evId:556,v:2,role:'start',minutes:80,rpe:6,hiaImpact:true,hiaSymptoms:['頭痛','めまい'],inputAt:'2020-01-01T00:00:00Z'}]);
var pseudoEv2=resolveMatchEvent(daysAgo(1));
ok('孤児evIdでも同日付なら同一の疑似イベントに解決される',!!pseudoEv2&&pseudoEv2.id==null);
var itemsOrphanHia=matchCareList(pseudoEv2);
ok('孤児evIdのHIA提出が要ケア一覧に含まれる(提出数に計上される)',itemsOrphanHia.length===1&&itemsOrphanHia[0].m.id===2);
ok('孤児evIdのHIAもrank0(最上段)として扱われる',itemsOrphanHia[0].hia===true&&itemsOrphanHia[0].rank===0);
var htmlOrphan=matchCareCardHtml(pseudoEv2);
ok('matchCareCardHtmlにも孤児evIdの選手が表示される',has(htmlOrphan,'選手1')&&has(htmlOrphan,'HIA'));

print('--- matchCareList: HIA/怪我/攣り/高疲労・高筋肉痛を検出しHIAが最上段 ---');
baseline();
setKey('cal',[{id:1,date:daysAgo(1),type:'match',opp:'A大',squad:[
  {pid:1,num:1},{pid:2,num:2},{pid:3,num:9}
]}]);
setKey('md',[
  {id:10,pid:1,date:daysAgo(1),evId:1,v:2,role:'start',minutes:80,rpe:6,cramp:true,inputAt:'2020-01-01T00:00:00Z'},
  {id:11,pid:2,date:daysAgo(1),evId:1,v:2,role:'start',minutes:80,rpe:6,hiaImpact:true,hiaSymptoms:['頭痛'],inputAt:'2020-01-01T00:00:00Z'},
  {id:12,pid:3,date:daysAgo(1),evId:1,v:2,role:'reserve',minutes:20,rpe:5,soreness:5,inputAt:'2020-01-01T00:00:00Z'}
]);
var ev1=matchEventById(1);
var items=matchCareList(ev1);
ok('3件とも要ケアに含まれる(攣り/HIA/高筋肉痛)',items.length===3);
ok('HIA(pid2)が先頭(rank0)',items[0].m.pid===2&&items[0].hia===true);

print('--- matchCareList: 怪我報告はapproved!==falseのみ対象(却下済みは除外) ---');
baseline();
setKey('cal',[{id:2,date:daysAgo(0),type:'match',opp:'B大',squad:[{pid:1,num:1}]}]);
setKey('md',[{id:20,pid:1,date:daysAgo(0),evId:2,v:2,role:'start',minutes:80,rpe:5,injId:900,inputAt:'2020-01-01T00:00:00Z'}]);
setKey('i',[{id:900,pid:1,side:'右',part:'膝',type:'捻挫',date:daysAgo(0),resolved:false,approved:false}]); // 却下済み
var ev2=matchEventById(2);
var items2=matchCareList(ev2);
ok('却下済み怪我は要ケアに出ない(他条件も無いので空)',items2.length===0);

print('--- matchCareCardHtml: 選手名・タグ・カルテ/承認待ちバッジが出る ---');
baseline();
setKey('cal',[{id:3,date:daysAgo(0),type:'match',opp:'C大',squad:[{pid:1,num:1},{pid:2,num:2}]}]);
setKey('i',[{id:910,pid:1,side:'右',part:'膝',type:'捻挫',date:daysAgo(0),resolved:false,approved:null,painLevel:5}]);
setKey('md',[
  {id:30,pid:1,date:daysAgo(0),evId:3,v:2,role:'start',minutes:80,rpe:5,injId:910,inputAt:'2020-01-01T00:00:00Z'},
  {id:31,pid:2,date:daysAgo(0),evId:3,v:2,role:'start',minutes:80,rpe:5,hiaImpact:true,hiaSymptoms:['めまい'],inputAt:'2020-01-01T00:00:00Z'}
]);
var ev3=matchEventById(3);
var html=matchCareCardHtml(ev3);
ok('カードのタイトルに試合後の要ケアが出る',has(html,'試合後の要ケア'));
ok('選手1の名前が出る',has(html,'選手1'));
ok('選手2の名前が出る',has(html,'選手2'));
ok('HIAバッジが出る',has(html,'HIA'));
ok('承認待ちバッジが出る(怪我はapproved:null)',has(html,'承認待ち'));
ok('openChart呼び出しは承認待ち中は出ない(承認済みのみカードリンク)',!has(html,'openChart(910)'));

print('--- matchCareCardHtml: 要ケアが無ければ空文字を返す(パネル自体を出さない) ---');
baseline();
setKey('cal',[{id:4,date:daysAgo(0),type:'match',opp:'D大',squad:[{pid:1,num:1}]}]);
setKey('md',[{id:40,pid:1,date:daysAgo(0),evId:4,v:2,role:'start',minutes:80,rpe:5,postFatigue:2,soreness:1,inputAt:'2020-01-01T00:00:00Z'}]);
var ev4=matchEventById(4);
ok('空文字が返る',matchCareCardHtml(ev4)==='');

print(__fail===0?'ALL MATCHDAY-CARE-TRAINER TESTS PASSED':'FAILED: '+__fail+' checks');
