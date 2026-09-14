// 測定会の特設ページ フェーズ1: 共通ヘルパー（PH_ITEMS/msessItems/phDateOf/phSessRecs/phSessProgress/msessOpenItems/phSessApply/phSessSubmit）と
// msessStatus の項目制拡張（done/skip/missed・皆勤賞・一覧の件数は従来どおり＋submittedPids/inProgressPids）。
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_msess_items.js
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_msess_items.js
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_msess_items.js
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}
function J(x){return JSON.stringify(x);}
function daysAgo(n){return toDateStr(new Date(Date.now()-n*86400000));}
function sameSet(name,got,want){var g=got.slice().sort().join(','),w=want.slice().sort().join(',');if(g!==w){__fail++;print('  NG '+name+': got=['+g+'] want=['+w+']');}else print('  ok '+name+' = ['+g+']');}
var SITE=(typeof V==='object'&&V&&typeof V.msess==='function')?'staff':(typeof T==='object'&&T&&T.mypage)?'player':'coach';
var WRITE=typeof phSessApply==='function';
print('site='+SITE+' write-helpers='+WRITE);

print('--- PH_ITEMS / phItem / msessItems / phHasVal / phDateOf（3サイト共通）---');
ok('PH_ITEMS は7項目・順序 SQ BP DL CN CL BR DB',PH_ITEMS.length===7&&PH_ITEMS.map(function(x){return x.k;}).join(',')==='squat,bench,deadlift,chinning,clean,bronco,downbronco');
ok('unit: kg 5つ・time 2つ',PH_ITEMS.filter(function(x){return x.unit==='kg';}).length===5&&PH_ITEMS.filter(function(x){return x.unit==='time';}).length===2);
ok('phItem: 既知/未知',phItem('bronco').short==='BR'&&phItem('xx')===null&&phItem(null)===null);
ok('msessItems: 非配列/undefined → []',J(msessItems({}))==='[]'&&J(msessItems(null))==='[]'&&J(msessItems({items:'squat'}))==='[]');
ok('msessItems: カタログ外・重複を捨て順序を保つ',J(msessItems({items:['bench','xx','squat','bench','bronco']}))==='["bench","squat","bronco"]');
ok('phHasVal: >0 だけ真（0/null/undefined/負は偽）',phHasVal({squat:150},'squat')&&!phHasVal({squat:0},'squat')&&!phHasVal({squat:null},'squat')&&!phHasVal({},'squat')&&!phHasVal(null,'squat')&&!phHasVal({bronco:-1},'bronco'));
ok('phDateOf: at 優先→date→null',phDateOf({date:'2026-09-07',at:{squat:'2026-09-10'}},'squat')==='2026-09-10'&&phDateOf({date:'2026-09-07',at:{squat:'2026-09-10'}},'bench')==='2026-09-07'&&phDateOf({},'squat')===null&&phDateOf(null,'squat')===null);

if(WRITE){
  var S0=daysAgo(7),S1=daysAgo(1);
  D.p=[{id:1,name:'p1',position:'PR'},{id:2,name:'p2',position:'HO'},{id:3,name:'p3',position:'LO'},{id:4,name:'p4',position:'SH'}];
  D.std=[];D.f=[];D.bc=[];
  var SI={id:'mi',name:'MAX測定',startDate:S0,endDate:S1,mtype:'phys',items:['squat','bench','bronco']};
  var SL={id:'ml',name:'旧MAX',startDate:S0,endDate:S1,mtype:'phys'};
  D.msess=[SI,SL];
  var NOW=new Date().toISOString();
  D.ph=[
    {id:101,pid:1,date:S0,msessId:'mi',squat:150,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,at:{squat:S0},by:{squat:'player'},inputAt:'2026-01-01T00:00:00Z'},
    {id:102,pid:2,date:S0,msessId:'mi',squat:null,bench:100,deadlift:null,chinning:null,clean:null,bronco:300,downbronco:null,at:{bench:S0,bronco:S1},by:{bench:'staff',bronco:'staff'},ex:{squat:'膝'},submitted:true,submittedAt:NOW,inputAt:'2026-01-02T00:00:00Z'},
    {id:103,pid:3,date:S1,msessId:'mi',squat:null,bench:null,deadlift:180,chinning:null,clean:null,bronco:0,downbronco:null,inputAt:'2026-01-03T00:00:00Z'}, // 会の項目に値なし（DLは項目外・bronco 0）＝未入力
    {id:104,pid:4,date:S0,msessId:'mi',squat:120,bench:null,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-01-04T00:00:00Z'},
    {id:105,pid:4,date:S1,msessId:'mi',squat:null,bench:90,deadlift:null,chinning:null,clean:null,bronco:null,downbronco:null,inputAt:'2026-01-05T00:00:00Z'} // 同じ選手に2件＝未統合
  ];
  D.phskip=[{id:9,pid:3,date:S0,msessId:'mi',reason:'欠席',by:'staff'}];

  print('--- phSessRecs / phSessRec（inputAt 降順・会の帰属は phInMSess）---');
  ok('p4 は2件・inputAt 最新が先頭',phSessRecs(SI,4).length===2&&phSessRecs(SI,4)[0].id===105&&phSessRec(SI,4).id===105);
  ok('p1 は1件・居ない選手は null',phSessRecs(SI,1).length===1&&phSessRec(SI,99)===null);
  ok('msessId 無し・期間内の記録は従来の会には入る（フォールバック）が項目制の会には入らない',(function(){D.ph.push({id:106,pid:1,date:S1,msessId:null,squat:155,inputAt:'2026-01-06T00:00:00Z'});var n=phSessRecs(SI,1).length,m=phSessRecs(SL,1).length;D.ph.pop();return n===1&&m===1;})());

  print('--- phSessProgress ---');
  var pg1=phSessProgress(SI,1);
  ok('p1: SQ done(150,日付=at)・BP/BR 未・doneN=1/3・complete=false・未提出・統合済み',pg1.items.length===3&&pg1.items[0].k==='squat'&&pg1.items[0].done&&pg1.items[0].val===150&&pg1.items[0].at===S0&&pg1.items[0].by==='player'&&!pg1.items[1].done&&!pg1.items[2].done&&pg1.doneN===1&&pg1.total===3&&pg1.complete===false&&pg1.submitted===false&&pg1.unmerged===false&&pg1.rec.id===101);
  var pg2=phSessProgress(SI,2);
  ok('p2: SQ 免除(膝)・BP/BR 値あり → complete・submitted',pg2.items[0].done&&pg2.items[0].ex==='膝'&&pg2.items[0].val===null&&pg2.items[1].val===100&&pg2.items[2].val===300&&pg2.items[2].at===S1&&pg2.complete&&pg2.submitted);
  var pg3=phSessProgress(SI,3);
  ok('p3: 項目外の DL と bronco 0 は数えない → doneN=0',pg3.doneN===0&&!pg3.complete&&pg3.items[2].val===null);
  var pg4=phSessProgress(SI,4);
  ok('p4: 未統合(unmerged)・最新1件(BP)だけを見る',pg4.unmerged===true&&pg4.rec.id===105&&pg4.items[1].done&&!pg4.items[0].done);
  ok('非項目制の会: items 空・complete=false',phSessProgress(SL,1).total===0&&phSessProgress(SL,1).complete===false);

  print('--- msessStatus: 項目制でも done/skip/missed は従来どおり＋submitted/inProgress ---');
  var st=msessStatus(SI);
  sameSet('done = 項目に値か免除がある選手 {1,2,4}',st.donePids,[1,2,4]);
  sameSet('skip = phskip {3}',st.skippedPids,[3]);
  sameSet('missed = 残り {}',st.missedPids,[]);
  ok('3分割の合計 = 全選手',st.donePids.length+st.skippedPids.length+st.missedPids.length===D.p.length);
  sameSet('submittedPids {2}',st.submittedPids,[2]);
  sameSet('inProgressPids {1,4}',st.inProgressPids,[1,4]);
  ok('items が返る',J(st.items)==='["squat","bench","bronco"]');
  var stL=msessStatus(SL);
  ok('非項目制の会: submittedPids/inProgressPids/items を返さない（従来の形）',!('submittedPids' in stL)&&!('inProgressPids' in stL)&&!('items' in stL));
  ok('非項目制: done は記録があれば済み（会の項目という概念が無い＝DL だけの記録でも done）',(function(){var keep=D.ph;D.ph=keep.map(function(r){var c=JSON.parse(J(r));c.msessId='ml';return c;});var d=msessStatus(SL).donePids.slice().sort().join(',');D.ph=keep;return d==='1,2,3,4';})());
  // 項目制の会で提出0名でも done は変わらない（皆勤賞が消えない根拠）
  D.ph.forEach(function(r){delete r.submitted;});
  var st0=msessStatus(SI);
  sameSet('提出0名でも done {1,2,4} のまま',st0.donePids,[1,2,4]);
  ok('提出0名: submittedPids=[]・inProgress=done',st0.submittedPids.length===0&&J(st0.inProgressPids.slice().sort())===J([1,2,4]));
  D.ph[1].submitted=true;
  // ブロンコ会（非項目制）は従来どおり bronco!=null が条件
  var SB={id:'mb',name:'ブロンコ',startDate:S0,endDate:S1,mtype:'bronco'};
  D.msess.push(SB);
  D.ph.push({id:107,pid:1,date:S0,msessId:'mb',squat:200,bronco:null,inputAt:'2026-01-07T00:00:00Z'},{id:108,pid:2,date:S0,msessId:'mb',bronco:290,inputAt:'2026-01-08T00:00:00Z'});
  sameSet('ブロンコ会（非項目制）: bronco 有りだけ done {2}',msessStatus(SB).donePids,[2]);
  D.ph.splice(-2,2);D.msess.pop();

  print('--- 皆勤賞（computeAllBadges）: 項目制の会が確定しても提出0名で消えない ---');
  D.ph.forEach(function(r){delete r.submitted;});
  D.msess=[{id:'mi',name:'MAX測定',startDate:daysAgo(40),endDate:daysAgo(30),mtype:'phys',items:['squat','bench','bronco'],closed:true,closedAt:daysAgo(29)}];
  D.ph.forEach(function(r){if(r.msessId==='mi'){r.date=daysAgo(35);if(r.at)Object.keys(r.at).forEach(function(k){r.at[k]=daysAgo(35);});}});
  D.phskip[0].date=daysAgo(35);
  var ab=computeAllBadges();
  var hasAll=function(pid){return (ab.byPid[String(pid)]||[]).some(function(b){return b.type==='allYear';});};
  ok('確定した項目制の会: done(1,2,4)+skip(3) 全員に皆勤賞（提出は関係ない）',hasAll(1)&&hasAll(2)&&hasAll(3)&&hasAll(4)&&ab.sessions.length===1);
  D.p.push({id:5,name:'p5',position:'FB'});
  ok('無断未入力(p5)だけ皆勤賞なし',!hasAll(5)===true&&(function(){var ab2=computeAllBadges();return !(ab2.byPid['5']||[]).some(function(b){return b.type==='allYear';});})());
  D.p.pop();
  D.msess=[SI,SL];D.ph.forEach(function(r){if(r.msessId==='mi'){r.date=(r.id===103||r.id===105)?S1:S0;if(r.at)Object.keys(r.at).forEach(function(k){r.at[k]=(k==='bronco')?S1:S0;});}});D.phskip[0].date=S0;D.ph[1].submitted=true;

  print('--- msessOpenItems ---');
  D.msess=[SL,SI];
  ok('項目制の会だけ返す（非項目制 SL は対象外）',msessOpenItems()&&msessOpenItems().id==='mi');
  ok('締切済みは対象外',(function(){SI.closed=true;var r=msessOpenItems();delete SI.closed;return r===null;})());
  ok('終了+14日以内は開いている・15日前終了は閉じる',(function(){var a={id:'g1',name:'g',startDate:daysAgo(20),endDate:daysAgo(14),items:['squat']},b={id:'g2',name:'g',startDate:daysAgo(30),endDate:daysAgo(15),items:['squat']};D.msess=[b];var r1=msessOpenItems();D.msess=[a];var r2=msessOpenItems();D.msess=[SL,SI];return r1===null&&r2&&r2.id==='g1';})());
  ok('未来の会は対象外',(function(){D.msess=[{id:'f',name:'f',startDate:daysAgo(-3),endDate:daysAgo(-5),items:['squat']}];var r=msessOpenItems();D.msess=[SL,SI];return r===null;})());
  ok('期間内の会を猶予中の会より優先・同順は開始日が新しい方',(function(){var g={id:'g',name:'g',startDate:daysAgo(20),endDate:daysAgo(10),items:['squat']},n={id:'n',name:'n',startDate:daysAgo(2),endDate:daysAgo(-2),items:['bench']},n2={id:'n2',name:'n2',startDate:daysAgo(3),endDate:daysAgo(-1),items:['bench']};D.msess=[g,n2,n];var r=msessOpenItems();D.msess=[SL,SI];return r.id==='n';})());

  print('--- phSessApply（純粋・冪等・差分適用）---');
  function fresh(){return JSON.parse(J(D.ph));}
  var latest=fresh();
  var o1={pid:1,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{bench:100}};
  phSessApply(latest,o1);
  var r1=latest.find(function(r){return r.id===101;});
  ok('既存記録に BP を追記（SQ はそのまま）・at/by 更新・inputAt=now・editedAt は付けない・新規は作らない',r1.bench===100&&r1.squat===150&&r1.at.bench===S1&&r1.by.bench==='staff'&&r1.at.squat===S0&&r1.by.squat==='player'&&r1.inputAt===o1.now&&!('editedAt' in r1)&&latest.length===D.ph.length);
  var latest2=fresh();phSessApply(latest2,o1);
  ok('同じ latest に同じ o を適用すると同じ結果（再実行可）',J(latest2)===J(latest));
  phSessApply(latest,o1);
  ok('2回適用しても同じ（冪等）',J(latest)===J(latest2));
  var latest3=fresh();phSessApply(latest3,{pid:1,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'player',set:{squat:140,deadlift:200,foo:1}});
  var r3=latest3.find(function(r){return r.id===101;});
  ok('上書き: SQ 150→140・at/by を今回の値に。項目外(deadlift/foo)は無視',r3.squat===140&&r3.at.squat===S1&&r3.by.squat==='player'&&r3.deadlift===null&&!('foo' in r3));
  var latest4=fresh();phSessApply(latest4,{pid:1,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{squat:null}});
  var r4=latest4.find(function(r){return r.id===101;});
  ok('値の削除(null): squat=null・at/by から消える',r4.squat===null&&!('squat' in r4.at)&&!('squat' in r4.by));
  var latest5=fresh();phSessApply(latest5,{pid:1,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{squat:0,bench:'abc',bronco:'300'}});
  var r5=latest5.find(function(r){return r.id===101;});
  ok('0/非数は削除・文字列の数値は数値に',r5.squat===null&&r5.bench===null&&r5.bronco===300&&r5.by.bronco==='staff');
  var latest6=fresh();phSessApply(latest6,{pid:1,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',ex:{squat:'膝痛'}});
  var r6=latest6.find(function(r){return r.id===101;});
  ok('免除: ex.squat=理由・値は null・at/by から消える',r6.ex.squat==='膝痛'&&r6.squat===null&&!('squat' in r6.at));
  phSessApply(latest6,{pid:1,sess:SI,newId:999,now:'2026-09-14T10:01:00.000Z',date:S1,by:'staff',set:{squat:130}});
  ok('免除中の項目に値を入れると免除が外れる（ex キー自体が消える）',r6.squat===130&&!('ex' in r6));
  var latest7=fresh();phSessApply(latest7,{pid:2,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',ex:{squat:null}});
  var r7=latest7.find(function(r){return r.id===102;});
  ok('免除の解除(null): ex から消える・項目が欠けたので提出も外れる',!('ex' in r7)&&!r7.submitted&&!('submittedAt' in r7)&&!('submittedBy' in r7));
  var latest7b=fresh();phSessApply(latest7b,{pid:2,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{bench:110}});
  ok('値の置き換えなら提出は残る',latest7b.find(function(r){return r.id===102;}).submitted===true);
  var latest7c=fresh();phSessApply(latest7c,{pid:2,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{bench:null}});
  ok('提出済みの値を消すと提出が外れる',(function(){var r=latest7c.find(function(x){return x.id===102;});return r.bench===null&&!r.submitted;})());
  var latest8=fresh();phSessApply(latest8,{pid:9,sess:SI,newId:777,now:'2026-09-14T10:00:00.000Z',date:S1,by:'player',set:{squat:100}});
  var r8=latest8.find(function(r){return r.id===777;});
  ok('記録が無い選手は newId で新規（固定列7つ・msessId・at/by・date=入力日）',!!r8&&r8.pid===9&&r8.msessId==='mi'&&r8.squat===100&&r8.bench===null&&'downbronco' in r8&&r8.at.squat===S1&&r8.by.squat==='player'&&r8.date===S1&&latest8.length===D.ph.length+1);
  var latest9=fresh();phSessApply(latest9,{pid:9,sess:SI,newId:778,now:'2026-09-14T10:00:00.000Z',date:daysAgo(30),by:'player',set:{squat:100}});
  var r9=latest9.find(function(r){return r.id===778;});
  ok('新規の date は会の期間内にクランプ（期間前→開始日）・at はそのまま',r9.date===S0&&r9.at.squat===daysAgo(30));
  var latest10=fresh();phSessApply(latest10,{pid:9,sess:SI,newId:779,now:'2026-09-14T10:00:00.000Z',date:daysAgo(0),by:'player',set:{squat:100}});
  ok('期間後→終了日',latest10.find(function(r){return r.id===779;}).date===S1);
  var latest11=fresh();phSessApply(latest11,{pid:4,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{bronco:280}});
  ok('複数記録の選手は inputAt 最新(105)に書く（104 は不変）',latest11.find(function(r){return r.id===105;}).bronco===280&&J(latest11.find(function(r){return r.id===104;}))===J(D.ph[3]));
  var latest12=fresh();phSessApply(latest12,{pid:1,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{bench:100}});
  ok('他の選手の記録は不変',J(latest12.filter(function(r){return r.pid!==1;}))===J(D.ph.filter(function(r){return r.pid!==1;})));
  ok('項目制の会は msessId 無しの期間内記録を取り込まない（その記録は不変・新規で作る）',(function(){var l=fresh();l.push({id:200,pid:7,date:S1,msessId:null,squat:100,inputAt:'2026-01-09T00:00:00Z'});phSessApply(l,{pid:7,sess:SI,newId:999,now:'2026-09-14T10:00:00.000Z',date:S1,by:'staff',set:{bench:80}});var r=l.find(function(x){return x.id===200;}),n=l.find(function(x){return x.id===999;});return r.msessId===null&&!('bench' in r)&&n.msessId==='mi'&&n.bench===80&&l.length===D.ph.length+2;})());

  print('--- phSessSubmit ---');
  var l1=fresh();var s1=phSessSubmit(l1,{pid:1,sess:SI,on:true,now:'2026-09-14T11:00:00.000Z',by:'staff'});
  ok('不足があれば提出しない → missing=[bench,bronco]',s1.ok===false&&J(s1.missing)==='["bench","bronco"]'&&!l1.find(function(r){return r.id===101;}).submitted);
  phSessApply(l1,{pid:1,sess:SI,newId:999,now:'2026-09-14T11:00:00.000Z',date:S1,by:'staff',set:{bench:100},ex:{bronco:'欠席'}});
  var s2=phSessSubmit(l1,{pid:1,sess:SI,on:true,now:'2026-09-14T11:01:00.000Z',by:'staff'});
  var rr=l1.find(function(r){return r.id===101;});
  ok('値2＋免除1で提出 → submitted/submittedAt/submittedBy',s2.ok&&rr.submitted===true&&rr.submittedAt==='2026-09-14T11:01:00.000Z'&&rr.submittedBy==='staff');
  var s3=phSessSubmit(l1,{pid:1,sess:SI,on:false,now:'2026-09-14T11:02:00.000Z'});
  ok('取消 → 3キーが消える',s3.ok&&!('submitted' in rr)&&!('submittedAt' in rr)&&!('submittedBy' in rr));
  ok('記録が無い選手 → ok=false・missing=全項目',(function(){var s=phSessSubmit(fresh(),{pid:9,sess:SI,on:true,now:'x'});return s.ok===false&&s.missing.length===3;})());
  ok('提出後の phSessApply で submitted は残る',(function(){var l=fresh();phSessApply(l,{pid:2,sess:SI,newId:999,now:'x',date:S1,by:'staff',set:{bench:105}});return l.find(function(r){return r.id===102;}).submitted===true;})());
  if(SITE==='staff'){
    print('--- V.msess の件数は項目制でも done/skip/missed のまま ---');
    var __els={};document.getElementById=function(id){if(!__els[id]){__els[id]=mkEl();__els[id].id=id;}return __els[id];};
    D.msess=[SI];
    V.msess();
    var h=__els['main-ct'].innerHTML;
    ok('一覧: 入力済 3名 / 測定なし 1名 / 未入力 0名（提出とは無関係）',h.indexOf('入力済')>=0&&/入力済[^0-9]*3/.test(h.replace(/<[^>]+>/g,''))&&/測定なし[^0-9]*1/.test(h.replace(/<[^>]+>/g,''))&&/未入力[^0-9]*0/.test(h.replace(/<[^>]+>/g,'')));
    D.msess=[SI,SL];
  }
}else{
  print('（coach: 読み系のみ・書き系は定義されない）');
  ok('coach に phSessApply/msessOpenItems は無い',typeof phSessApply==='undefined'&&typeof msessOpenItems==='undefined');
}

if(WRITE){
  print('--- レビュー修正: msessOpenItemsAll/msessOpenFor・phSessComplete・空の記録を作らない・at/by 配列ガード ---');
  (function(){
    var keep=D.msess;
    var A={id:'a',name:'a',startDate:daysAgo(3),endDate:daysAgo(-2),items:['squat','bench']},B={id:'b',name:'b',startDate:daysAgo(1),endDate:daysAgo(-1),items:['bronco']};
    D.msess=[SL,A,B];
    ok('msessOpenItemsAll: 項目制の開いている会を全部（期間内→開始日が新しい順）',msessOpenItemsAll().map(function(s){return s.id;}).join(',')==='b,a'&&msessOpenItems().id==='b');
    ok('msessOpenFor: 測る項目に合う会へ・無ければ null・未指定は先頭',msessOpenFor(['bronco']).id==='b'&&msessOpenFor(['squat','deadlift']).id==='a'&&msessOpenFor(['deadlift'])===null&&msessOpenFor(null).id==='b'&&msessOpenFor([]).id==='b');
    D.msess=[SL];ok('項目制の会が無ければ [] / null',msessOpenItemsAll().length===0&&msessOpenFor(['squat'])===null);
    D.msess=keep;
  })();
  ok('phSessComplete: 全項目に値か免除',phSessComplete({squat:1,bench:2,bronco:3},['squat','bench','bronco'])&&phSessComplete({squat:1,ex:{bench:'x'},bronco:3},['squat','bench','bronco'])&&!phSessComplete({squat:1,bronco:3},['squat','bench','bronco'])&&!phSessComplete(null,['squat'])&&!phSessComplete({squat:1},[]));
  ok('記録の無い選手に書くものが無ければ空の記録を作らない（0 / 免除解除 / 項目外）',(function(){var l=fresh();phSessApply(l,{pid:9,sess:SI,newId:1,now:NOW,date:S1,by:'staff',set:{squat:0}});phSessApply(l,{pid:9,sess:SI,newId:2,now:NOW,date:S1,by:'staff',ex:{squat:null}});phSessApply(l,{pid:9,sess:SI,newId:3,now:NOW,date:S1,by:'staff',set:{deadlift:100}});return l.length===D.ph.length;})());
  ok('免除だけでも記録は作る',(function(){var l=fresh();phSessApply(l,{pid:9,sess:SI,newId:4,now:NOW,date:S1,by:'staff',ex:{squat:'怪我'}});var r=l.find(function(x){return x.id===4;});return !!r&&r.ex.squat==='怪我'&&l.length===D.ph.length+1;})());
  ok('at/by が配列なら作り直す（JSON で消えない）',(function(){var l=fresh();var r=l.find(function(x){return x.id===105;});r.at=[];r.by=[];phSessApply(l,{pid:4,sess:SI,newId:1,now:NOW,date:S1,by:'staff',set:{bronco:280}});var t=JSON.parse(J(l.find(function(x){return x.id===105;})));return !Array.isArray(t.at)&&t.at.bronco===S1&&t.by.bronco==='staff';})());
}
if(__fail){print('\nFAILED: '+__fail+' test(s)');throw new Error('msess_items tests failed');}
print('ALL MSESS-ITEMS TESTS PASSED ('+SITE+')');
