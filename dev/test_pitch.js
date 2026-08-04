// P9b: pitchProgressHtml汎用化の回帰テスト（後方互換ロック・total可変・小数idx・クランプ・NaN・生hex混入なし）
// 実行: jsc dev/prelude.js /tmp/player.js dev/test_pitch.js
// 実行: jsc dev/prelude.js /tmp/staff.js dev/test_pitch.js
// 実行: jsc dev/prelude.js /tmp/coach.js dev/test_pitch.js
var _fails=0,_runs=0;
function ok(name,cond){_runs++;if(!cond){_fails++;print('　NG '+name);}else{print('ok '+name);}}
function has(s,sub){return s.indexOf(sub)>=0;}
function count(s,sub){var c=0,i=0;while((i=s.indexOf(sub,i))>=0){c++;i+=sub.length;}return c;}

// ---- 1) 後方互換ロック: total=7 の pos 列が旧ハードコード配列と一致 ----
var LEGACY_POS=[3,18.7,34.3,50,65.7,81.3,97];
var out3=pitchProgressHtml(3,7,['G','22','10','HW','10','22','G'],{});
LEGACY_POS.forEach(function(x){ok('pos '+x+'%',has(out3,'left:'+x+'%'));});
ok('18.666系の未丸め出力なし',!has(out3,'18.66')&&!has(out3,'34.33')&&!has(out3,'50.0%'));

// ---- 2) ドット・現在強調・ライン装飾 ----
ok('rtp-dot 7個',count(out3,'class="rtp-dot')===7);
ok('rtp-dot-cur 1個(整数idx)',count(out3,'rtp-dot-cur')===1);
ok('done色トークン',has(out3,'var(--pitch-done)'));
ok('cur色トークン',has(out3,'var(--pitch-cur)'));
ok('ゴール線strong',has(out3,'var(--pitch-line-strong)'));
ok('中央線mid(i=3)',has(out3,'var(--pitch-line-mid)'));
ok('ラベルG表示',has(out3,'>G</div>'));
ok('rtp-anim付与(still無指定)',has(out3,'class="rtp-anim"'));
ok('data-pitch属性',has(out3,'data-pitch="1"'));

// ---- 3) クランプ・NaN（旧 Math.max(0,Math.min(6,stage||0)) 互換） ----
var outNeg=pitchProgressHtml(-1,7,null,{ball:'<b>B</b>'});
ok('idx=-1→線0(3%)にボール',has(outNeg,'left:3%;top:29px'));
var outBig=pitchProgressHtml(99,7,null,{ball:'<b>B</b>'});
ok('idx=99→線6(97%)にボール',has(outBig,'left:97%;top:29px'));
var outNull=pitchProgressHtml(null,7,null,{ball:'<b>B</b>'});
ok('idx=null→0扱い',has(outNull,'left:3%;top:29px'));
var outNaN=pitchProgressHtml(0/0,7,null,{ball:'<b>B</b>'});
ok('idx=NaN→0扱い・NaN非混入',has(outNaN,'left:3%;top:29px')&&!has(outNaN,'NaN'));

// ---- 4) 小数idx: ボール線形補間・cur強調なし ----
var outFrac=pitchProgressHtml(4.5,7,null,{ball:'<b>B</b>'});
ok('idx=4.5→ボール73.5%',has(outFrac,'left:73.5%'));
ok('idx=4.5→cur強調なし',!has(outFrac,'rtp-dot-cur'));
ok('idx=4.5→done5個(線0-4通過=ボール手前の全ライン)',count(outFrac,'var(--pitch-done)')===5);

// ---- 5) total可変: 5本 / 6本(偶数=中央mid線なし) ----
var out5=pitchProgressHtml(0,5,null,{});
[3,26.5,50,73.5,97].forEach(function(x){ok('total5 pos '+x,has(out5,'left:'+x+'%'));});
ok('total5 ドット5個',count(out5,'class="rtp-dot')===5);
var out6=pitchProgressHtml(0,6,null,{});
ok('total6(偶数)は中央mid線なし',!has(out6,'var(--pitch-line-mid)'));

// ---- 6) opts: still/dots/inner/caption/h ----
var outStill=pitchProgressHtml(2,7,null,{still:true});
ok('still:trueでrtp-anim無し',!has(outStill,'rtp-anim'));
var outNoDots=pitchProgressHtml(2,7,null,{dots:false,inner:'<i id="X"></i>'});
ok('dots:falseでドット0',count(outNoDots,'class="rtp-dot')===0);
ok('innerがピッチ内末尾に入る',has(outNoDots,'<i id="X"></i></div>'));
var outCap=pitchProgressHtml(2,7,null,{caption:['L','M','R']});
ok('caption 3スパン',has(outCap,'<span>L</span>')&&has(outCap,'<span>M</span>')&&has(outCap,'>R</span>'));
ok('caption右は強調色',has(outCap,'var(--pitch-accent)'));
var outH=pitchProgressHtml(2,7,null,{h:56,ball:'<b>B</b>'});
ok('h=56でボールtop=18px',has(outH,'top:18px'));

// ---- 7) 生hex/生rgbaの混入なし（residueゲート整合） ----
var all=[out3,outFrac,out5,outCap].join('');
ok('生hexなし',!/#[0-9a-fA-F]{3,8}\b/.test(all));
ok('生rgbaなし',!/rgba?\(\s*[\d.]/.test(all));

// ---- 8) playerのみ: ラッパ互換・rankPitchIdx ----
if(typeof rtpPitchHtml==='function'){
  var w=rtpPitchHtml(3);
  ok('ラッパ: ピッチ+ボール+キャプション',has(w,'i-ball')&&has(w,'トライ = 完全復帰')&&has(w,'left:50%;top:29px'));
  ok('ラッパ: 旧クランプ互換(null→0)',has(rtpPitchHtml(null),'left:3%;top:29px'));
  ok('ラッパ: 旧クランプ互換(99→97%)',has(rtpPitchHtml(99),'left:97%;top:29px'));
}
if(typeof rankPitchIdx==='function'){
  var ranks=[{k:'bronze',pct:0.70},{k:'silver',pct:0.85},{k:'gold',pct:1.00},{k:'platinum',pct:1.10},{k:'diamond',pct:1.20}];
  ok('rankPitchIdx: ランク外ratio=0.35→線0-1中間',Math.abs(rankPitchIdx({rank:null,ratio:0.35},ranks)-0.5)<0.01);
  ok('rankPitchIdx: ブロンズ中間(0.775)→1.5',Math.abs(rankPitchIdx({rank:{k:'bronze'},ratio:0.775},ranks)-1.5)<0.01);
  ok('rankPitchIdx: ダイヤ→最終線5',rankPitchIdx({rank:{k:'diamond'},ratio:1.5},ranks)===5);
  ok('rankPitchIdx: ゴールドぴったり→3',Math.abs(rankPitchIdx({rank:{k:'gold'},ratio:1.00},ranks)-3)<0.01);
  ok('rankPitchLabels: ST+頭文字',rankPitchLabels(ranks).join(',')==='ST,B,S,G,P,D');
}

print(_fails===0?('ALL PASS ('+_runs+' assertions)'):('FAILED: '+_fails+'/'+_runs));
