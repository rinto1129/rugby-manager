// P4: 「依頼」機構（reqStaffAction 投稿 ＋ スタッフ側チップ検出述語）の模擬実行テスト
// 実行: jsc dev/prelude.js /tmp/trainer.js dev/test_req.js
// 核心=trainerのreqStaffActionがREQ_META.prefix付きの正しいinjcommレコードを投稿すること、
//   および「injuryごとに最新injcommがトレーナー発の依頼センチネル＝スタッフ未対応」判定が
//   トレーナー依頼で立ち・スタッフ返信で消える（read状態を持たずlast-comment-winsで動く）こと。
var __fail=0;
function ok(name,cond){if(!cond){__fail++;print('  NG '+name);}else print('  ok '+name);}

// --- 依頼投稿（reqStaffAction） ---
myTrainer={id:'t1',name:'田中トレーナー'};
D.injcomm=[];
var captured=null;
svSafeUpdate=function(k,fn,done,err){var latest=(k==='injcomm'?D.injcomm:(D[k]||[]));fn(latest);captured={k:k,latest:latest};if(done)done();};

ok('reqStaffAction is function', typeof reqStaffAction==='function');
reqStaffAction(101,'resolve',null);   // btnEl=nullでguardSubmitをスキップ
ok('posted to injcomm key', captured&&captured.k==='injcomm');
var c=D.injcomm[D.injcomm.length-1];
ok('comm exists', !!c);
ok('comm.injId=101', c&&c.injId===101);
ok('comm.role=trainer', c&&c.role==='trainer');
ok('comm.authorId=t1', c&&c.authorId==='t1');
ok('comm.authorName=田中トレーナー', c&&c.authorName==='田中トレーナー');
ok('comm.text starts with REQ_META.prefix', c&&c.text.indexOf(REQ_META.prefix)===0);
ok('comm.text has resolve label', c&&c.text.indexOf('「回復済み」への変更')>=0);
ok('comm.text has trainer name', c&&c.text.indexOf('田中トレーナー')>=0);
ok('comm has createdAt ISO', c&&/^\d{4}-\d\d-\d\dT/.test(c.createdAt));
ok('comm id has ic_ prefix', c&&/^ic_/.test(c.id));

// unresolve依頼はラベルが変わる
reqStaffAction(101,'unresolve',null);
var c2=D.injcomm[D.injcomm.length-1];
ok('unresolve label differs', c2&&c2.text.indexOf('「治療中に戻す」')>=0);

// 未ログインでは投稿しない
myTrainer=null; captured=null; var before=D.injcomm.length;
reqStaffAction(101,'resolve',null);
ok('no post when not logged in', D.injcomm.length===before && captured===null);
myTrainer={id:'t1',name:'田中トレーナー'};

// --- スタッフ側チップ検出述語（last-comment-wins ＋ 状態ベースの対応済み判定） ---
// staff/index.html の rehabReqs スキャンと同一ロジック（injResolved=当該injuryのresolved状態）
function isPendingReq(injId,injResolved){
  var f=(D.injcomm||[]).filter(function(x){return idEq(x.injId,injId);}).sort(function(a,b){return (a.createdAt||'').localeCompare(b.createdAt||'');});
  var last=f[f.length-1];
  if(!(last&&last.role==='trainer'&&last.text&&last.text.indexOf(REQ_META.prefix)===0))return false;
  var pend=true;
  if(last.text.indexOf(REQ_META.label.resolve)>=0&&injResolved)pend=false;
  if(last.text.indexOf(REQ_META.label.unresolve)>=0&&!injResolved)pend=false;
  return pend;
}
// injury 200 に「回復依頼」を立てる（inj未resolved）
D.injcomm=[];
D.injcomm.push({id:'ic_a',injId:200,role:'trainer',authorName:'田中',text:REQ_META.prefix+REQ_META.label.resolve+'をお願いします。（田中）',createdAt:'2026-07-14T01:00:00.000Z'});
ok('pending after trainer resolve-request (unresolved)', isPendingReq(200,false)===true);
ok('other injury not pending', isPendingReq(999,false)===false);
// staffが実際に回復操作を実行（コメント無し・inj.resolved=trueへ）→ チップは自動で消える
ok('resolve-request cleared once injury resolved (no reply)', isPendingReq(200,true)===false);
// staffがコメントで返信 → チップは消える（last-comment-wins）
D.injcomm.push({id:'ic_b',injId:200,role:'staff',authorName:'スタッフ',text:'確認しました。',createdAt:'2026-07-14T02:00:00.000Z'});
ok('pending cleared after staff reply', isPendingReq(200,false)===false);
// 「治療中に戻す」依頼：injがresolvedの間だけpending
D.injcomm=[{id:'ic_u',injId:202,role:'trainer',authorName:'田中',text:REQ_META.prefix+REQ_META.label.unresolve+'をお願いします。（田中）',createdAt:'2026-07-14T04:00:00.000Z'}];
ok('unresolve-request pending while resolved', isPendingReq(202,true)===true);
ok('unresolve-request cleared once back to treatment', isPendingReq(202,false)===false);
// 通常のトレーナーコメント（依頼センチネルなし）はチップにならない
D.injcomm=[{id:'ic_c',injId:201,role:'trainer',authorName:'田中',text:'今日は順調でした',createdAt:'2026-07-14T03:00:00.000Z'}];
ok('plain trainer comment is not a request', isPendingReq(201,false)===false);

if(__fail>0){print('\nREQ TESTS: '+__fail+' FAILED');throw new Error('req test failed');}
print('\nALL REQ TESTS PASSED');
