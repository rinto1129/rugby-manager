# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい。

---

## 最終更新
- 日時: 2026-07-07（**🆕🆕🆕🆕🆕Phase 2完了（コミット`2c81e9c`+`362c70d`+`d765f48`・未push）。次はPhase 3（自主トレ記録）から着手する。pushは引き続き「一番最後にまとめて」（撤回されるまで有効）。**）
- 更新者: Claude

## 🔴 次セッションが最初にやること（ユーザー指示・最優先）

- **⚠️pushのタイミング変更（2026-07-07・ユーザー指示）**: 「pushは一番最後で！」＝これまでの「1機能ずつ→確認→commit→pushはユーザー確認後」から、**push確認のステップを都度挟まず、Phase 2以降もコミットのみ積み上げて進めてよい**。次にユーザーから明示のpush指示（Phase群が一段落した時など）が出るまでpushしない。この方針が変わったら本行を更新すること。
- **✅Phase 2完了（2026-07-07・コミット`2c81e9c`/`362c70d`/`d765f48`・未push）**: push/pull自動切替+スロット化+導線。3コミット構成:
  - **2-A（`2c81e9c`）**: player `ppAutoFlip(log)`新設（ppCardHtml直後）。ガード=欠席/kind='self'/過去日付/個別scope/pp未初期化/**cal本日weightなし（High-3①）**。当日重複抑止は`last.date===today && last.by==='auto'`のみ（**High-3②**=手動flip/ppStart当日でも完了で確定は走る）。`todayType=mn.ptype||last.type`の逆を`{id,type,date,by:'auto'}`でpush・100件cap。finishTrainingの**成功CBとtlog成功+e1rm失敗経路の両方**から呼ぶ（**Medium-1**）。失敗時はonError空関数でalert抑止。ppCardHtml=byLabel'auto'→「自動確定」+metaTxt「前回: PUSH 7/4(金)（自動確定）」/1件のみ時「開始: …」（**player/staffバイト一致維持=2706B**）。trainerはbyLabel 1行のみ。dev/test_pp_auto.js（27アサート・finishTraining統合2経路含む）
  - **2-B（`362c70d`）**: staff renderTMenuFormにメニュータイプセレクト（通常/PUSH/PULLスロット）。saveTMenuを新規もsvSafeUpdateに統一し「同ptypeの他メニューからptype/ptypeTs除去」を同一トランザクションで実行（アクティブ各1件の不変条件）。ptype+個別scopeはalert拒否。**getSlotMenu(pt)**=異常時複数はptypeTs最新→id大タイブレーク（**Medium-4**・読み取り側統一）。V.trainingをスロットカード2枚+通常メニュー一覧に再構成（異常時に負けたスロットメニューは通常一覧に可視=編集・削除可能）。goAddTMenuSlot新設・詳細にスロットバッジ。dev/test_tmenu_slot.js（32アサート）
  - **2-C（`d765f48`）**: player getSlotMenu複製+T.training最上部「今日のプログラム」カード（cal本日weight∧ppNext()≠null→スロットメニュー+「開始する」→startTraining・本日実施済バッジ）。T.home=「TODAY: PUSH DAY」ヒーローとppカードをタップでgo('training')直行（ベルバッジはevent.stopPropagationでマイページ維持・pp空時は空ラップdivを出さない）。dev/test_today_prog.js（18アサート）
  - **検証**: jsc構文OK・括弧HEAD比均衡（player/staff/trainer）・既存全テスト+新3テスト=18本ALL PASS・エンジンブロックHEAD一致（player/staff。coach無変更）・previewブラウザ実機確認（staffスロットUI/編集フォームptypeセレクト/dashの「前回: PUSH 7/4(土)（自動確定）」表示・playerの今日のプログラムカード→開始する→出欠確認画面・ホームのヒーロー/ppカードクリック→training遷移。コンソールエラーはFirestore遮断由来のみ）
  - **運用メモ（ユーザーへ伝えるべきこと）**: 既存の「6月push」等のメニューは、スタッフが編集画面でメニュータイプをPUSH/PULLスロットに設定するだけで移行完了（移行スクリプト不要）。自動確定はカレンダーに本日type=weightの予定がある日のみ動く（カレンダー登録が前提）
- **次: Phase 3着手（自主トレ記録・完全統合）**（プランのPhase 3節参照: `/Users/nakayamarinnin/.claude/plans/sequential-doodling-feather.md`。tlogに`kind:'self'`拡張・fitnessは`results:[]`+`totalVolume:0`不変条件・**High-2（自主トレ下書きの専用復元+チーム下書き上書き警告）**・Low-6/Low-7対処を含む＝プラン本文に反映済み。**Phase 0完了済みなのでPhase 3の保留は解除済み**）
  - メモ: jsc実行パスは`/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`（PATHにnode/jscなし）。テスト実行: `jsc dev/prelude.js <抽出JS> dev/test_xxx.js`
  - previewサーバーは旧セッションのpreviewroot（`.claude/launch.json`参照）が稼働中でも使える＝編集後に`cp`同期すればよい（今回もそれで検証）
  - 既存テスト回帰の実行対象は現在**18本**（player9: engine/dash/cond/ranking/mystatus/train_weak/tlog_arch/pp_auto/today_prog・staff6: dash_staff/staff_pdetail_std/std_staff/tlog_arch_staff/trainbug/tmenu_slot・coach3: trainbug/coach_report_std/tlog_arch_coach）
- **✅Phase 1完了（2026-07-07・コミット`801b4d4`・未push）**: 種目推移セレクタの`<option>`にvalue属性を追加（staff/index.html:3902 renderTrainTab＋coach/index.html:1220 buildTrendCoach）。estBase無し種目の「種目名 (手入力)」テキストがvalueになり選択が巻き戻るバグを根治。dev/test_trainbug.js新設（1ファイルでstaff/coach自動判別・value属性/巻き戻らない/e1rm→topフォールバック/全null系列例外なし・各12アサートPASS）。検証: jsc構文OK・括弧HEAD比均衡(+1/+1=追加escapeHtml呼び出し分)・既存13テスト回帰PASS・エンジンmd5 3ファイル一致(`07efed94…`)・previewブラウザ両サイトでchange操作→選択維持を実機確認（コンソールエラーはFirestore遮断由来のみ）。

- **🚀Phase 0（tlog容量対策）実装完了・✅push済み・GitHub Pages反映確認済み（2026-07-07・このセッション）。残りの手順**:
  1. ✅push完了（`ff58aea` 0-Aスリム化 / `f657b13` player 0-B / `9f8f072` staff 0-B / `b9741ce` coach 0-B / `963c2ea` HANDOFF）。Pagesに新コードが載ったことをcurlで確認済み（player/staff/coachともarchiveTlog/loadTlogArch検出）
  2. ✅**本番アーカイブ初回実行を確認済み（2026-07-07 19:37 JST・ユーザーのリロードで自動実行）**: メインdoc 711,577B/308件→**402,991B/317件（43%減）**。6/21の4件が`tla_1781905323051_2026h1`へ移送・スリム化済み。id全件照合で消失ゼロ・残留ゼロ・メインdoc残存317件も全件in-placeスリム化済み（肥大フィールド残りゼロ）。以降は日々自動移送＝手動操作不要。（旧記載:: ユーザー（or選手）が新コードでstaff/playerを開くとarchiveTlogが自動実行される（staff=ロード1.5秒後・player=5〜15秒後）。実行後、Firestore読み取り専用RESTで `appdata/tlog` が約400KB以下に縮み `tla_<pid>_2026h1` 等が生成されたことを確認する。**注意: このセッションで本番への直接REST移送スクリプト実行は権限クラシファイアに止められた（承認範囲=push+クライアント側自動移送のため妥当）。読み取り専用curlも直後は巻き添えでブロックされたが、本来読み取りは過去セッションで実績あり**。移送前スナップショットのバックアップ: scratchpad の `tlog_backup_before_migration.json`（711KB/308件・セッション消滅で消えるため恒久保存は不要=移送はデータを消さず移すだけ）　）
  3. ✅Phase 1（option valueバグ）完了（上の✅Phase 1節参照・コミット`801b4d4`）
  - **実装内容（プランのPhase 0節が正・実測に基づきHANDOFF原案から設計変更あり）**:
    - 実測: tlog=711,577B/308件・ピーク112KB/日・週4-5回。積極スリム化でも45.5%減が上限→1ヶ月分≈1.16MB>1MiBで**月次アーカイブでは不足**→**15日カットオフ（coach 13日窓+2日マージン）+選手別×半期doc `tla_<pid>_<year>h<1|2>`**に設計変更
    - 0-A: `slimTlogRec`（prevEx/note/videoUrl/estWeight/oneRM/targetSets削除+null/false/空省略・冪等・将来フィールドパススルー）をfinishTraining保存直前に適用。_curTLog/下書きは温存
    - 0-B: `archiveTlog`（player+staff・svSafeUpdate2段トランザクション・id重複排除で冪等・**メインdoc残存レコードもin-placeスリム化**=旧クライアント保存分も吸収）／読み出しは`tlogAll()`（D.tlog+_tlogArchのidマージ・メイン優先・参照キャッシュ）。player=自分の半期docのみログイン時preload（選手切替リセット・全9消費箇所が自分のみと検証済み）、staff/coach=全選手分をboot時preload（完了時に入力中ガード付き再描画）。coachはarchiver/slim非搭載（閲覧専用維持・テストで未定義をアサート）
    - **エンジンブロック対応**: getWeakWeeklyVolume(player:1733・weeks=5=35日)は呼び出し側でD.tlogを同期swap（try/finally復元）。エンジン内のD.tlog直読み（player:543/staff:719/coach:490）は7日窓のため非接触・md5 3ファイル一致維持（`07efed94…`）
    - 検証: dev/test_tlog_arch.js(63)+test_tlog_arch_staff.js(10)+test_tlog_arch_coach.js(8)全PASS・既存10テスト回帰PASS・括弧バランスHEAD比ゼロ（正規表現リテラル行除外で計測）・実機ブラウザ（メモリ注入）でstaff実施状況/player履歴/mystatusエンジンswap/coach全面renderにアーカイブ分が表示されることを確認。**previewブラウザはFirestore遮断環境**（オフライン時はloadTlogArchが空フォールバック=設計どおり劣化動作も確認済み）
    - 残課題メモ: 選手端末のtlog購読egress（メインdoc約400KBに減るが根本対策は別途）／p(514KB写真)圧縮は将来課題（プラン末尾に記録）

- **🆕🆕🆕 選手/スタッフサイト大規模機能追加 — grilling(質問攻め)で要件確定・実装プラン承認済み・**Phase 0のみ完了、Phase 1以降は未着手**。プランファイル: `/Users/nakayamarinnin/.claude/plans/sequential-doodling-feather.md`（次セッションで必読。**レビュー所見High/Medium/Low全件+Phase 0節を反映済み＝プラン本文が正**）。**
  - **経緯**: ユーザーが実機運用フィードバックから選手/スタッフサイトの改善要望を多数提示→grillingスキルで質問攻め（AskUserQuestion多数往復）により全要件を確定。Explore 3体並列調査＋Plan agent 1体で設計→ユーザーがAM/PM組分けの追加要件（後述）を出し計画を更新→**plan modeでユーザー承認済み**→**サブエージェント2体（設計レビュー=Plan agent／データ安全敵対的レビュー=general-purpose）で実装前レビュー実施済み（2026-07-07）**。このセッションでは調査・質問・計画・レビューのみ行い、**player/staff/coach/trainerのコードは一切変更していない**。

  - **🔍プランレビュー結果（2体のサブエージェントが実コード照合済み・所見はまだプランファイルに未反映）**:
    - **総評**: プラン本体は高品質。行番号・関数名の主張約30箇所すべて実コード一致。tlog後方互換戦略（`results:[]`+`totalVolume:0`不変条件・kind未定義=team・idEqのnull挙動）は全消費箇所（player12/staff8/coach15箇所）を照合して**無修正で安全と確認済み**。ppAutoFlipの同時書き込み競合もsvSafeUpdate=`db.runTransaction`（player:831-841）で安全と検証済み。エンジンブロック3ファイルmd5一致（`d5833f63…`）・ppCardHtml 2ファイル完全一致（2,634B）・dev/テスト10本実在＋HEAD健全（ALL PASS）を実測確認。
    - **🚨Critical（プラン外・時間切迫・最優先で対処）**: `appdata/tlog`が実測**706,425B/306件**（本番Firestore読み取り専用で実測、6/21〜7/7）。7月は約**65KB/日**で増加中＝**約5日で1MiB上限到達→全選手のトレーニング保存（finishTraining・欠席記録とも）が恒久的に失敗し始める**。肥大主因は保存レコードに毎回複製されるprevEx（それだけで111,829B）/note/videoUrl/estWeight/oneRM（player:3529-3532、finishTraining:3948が全フィールド温存）。**提案=「Phase 0: tlog容量対策」をPhase 1より前に新設**: ①保存レコードのスリム化（prevEx等の再計算可能フィールドを落とす、新規保存分で約40%減）②`tlog_2026-06`等の別docへ月次アーカイブ移送（読み側はオンデマンド結合・tdraft方式の前例あり）③完了までPhase 3（自主トレ=レコード増）を保留。副次効果としてegress問題（tlog書き込み毎に全端末へ706KB再送・現状で月5〜6GB/Spark上限10GiB）も同時解決。**ユーザーはまだ採否を判断していない→次セッション冒頭で必ず確認**。
    - **High-1（Phase 1に追加）**: staff:3775と同一のoption value欠落バグが**coach/index.html:1175にも存在**（`setTrExC`の`.trim()`では「 (手入力)」接尾辞が消えず巻き戻る。実効定義はcoach:1871-1872側の重複定義=既存の別問題にも注意）。Phase 1の修正対象にcoach:1175を追加すること。player:4079の履歴セレクタは接尾辞を付けないため安全（検証済み）。
    - **High-2（Phase 3の仕様修正）**: 自主トレ（menuId:null）の下書きが**復元不能**。`idEq(a,b)`は`a==null||b==null`で必ずfalse（player:920）のため、既存復元フロー`beginTrainingExec`の`idEq(draft.menuId,menuId)`ゲート（player:3455-3473）に絶対に乗らない=入力途中データ喪失。さらに下書きスロットは選手ごと1個（player:3400）なのでチーム下書きと自主トレが相互上書き・消去。→自主ウエイト開始時にidEqを使わない専用下書きチェック（`draft.kind==='self'&&draft.date===today`）＋チーム下書き存在時の警告を追加し、test_self_training.jsに復元/上書き警告の2ケース追加。
    - **High-3（Phase 2のガード修正）**: ppAutoFlipのガードに2つの穴。①「calに本日type='weight'があるか」を見ていない→オフ日に1人が団体メニューを消化しただけでチーム共有PUSH/PULLが反転。→`(D.cal||[]).some(本日weight)`ガード追加。②`last.date===today`ガードは「当日確定済み」と「スタッフが朝に手動修正」（staff ppFlip:4141/ppStart:4157はdate=todayStr()）を区別できず、手動修正日の夕方は自動確定が抑止され翌日ずれる。→当日スキップを`last.date===today && last.by==='auto'`に絞る（か「手動優先=手動修正日は自動確定なし」を仕様として明記）。test_pp_auto.jsに「手動flip当日+完了」「ppStart当日+完了」「非weight日の完了」の3ケース追加。
    - **Medium-1（Phase 2）**: ppAutoFlip呼び出しは「成功CB内」だけでは不足。finishTrainingには**tlog成功+e1rm失敗でも記録成立とする経路**（player:3995-4008のonError内`done.indexOf('tlog')>=0`分岐）がある→onAllDoneとその分岐の**両方**で呼ぶと明記（漏らすと自己ベスト更新日だけflipされない発見困難バグ）。
    - **Medium-2（Phase 7）**: 3人組の端数規則「n%3==2→4人組2つ」はn≥8前提で、午前/午後分割+怪我人除外後に現実に起きるn=2/n=5が未定義→規則を明記しテストにn=1,2,4,5を追加。
    - **Medium-3（Phase 6）**: 現行T.rankingは**7種目（chinning・clean含む）**＋FW/BK・ポジション・学年フィルタ＋測定会セレクタ＋アロメトリック補正モード（player:2750-2765）を持つが、プランのRANK_EVENTS列挙はsquat/bench/deadlift/big3/broncoのみ→chinning/cleanを明記し、フィルタ群・alloモードの保持/廃止を確定要件として書く（暗黙に落とすリスク）。
    - **Medium-4（Phase 2）**: tmenuの同ptypeスロットが異常時に2件になった場合の読み取り側タイブレーク（最新1件採用等）が未定義→決めておく。
    - **Low（各Phaseに反映）**: ①Phase 7のgroupScore前提ヘルパー=e1rm最新値取得はplayer:3288にのみ存在→**getLatestE1RMのstaff移植を作業項目に明記** ②V.tgroup/V.gpsは**サイドバー項目+nav()タイトル辞書登録**が必要（S4で辞書漏れ=生キー表示バグの実績） ③Phase 4体組成リスト削除時、**1232の`pickup`変数は1242のtodo（体組成測定対象）が使う**→1636-1637の描画だけ消し変数定義は残す ④Phase 5考察「出席率<70%」はcoach欠席率と同じ分母問題→`kind!=='self'`フィルタを仕様に明記+分母定義（カレンダーweight日数か）を確定 ⑤エンジンブロック「8210B」は文字数としては正確だがUTF-8では9,152B→**バイト数でなく3ファイルmd5相互一致で検証**と読み替え ⑥coach件数KPI（trained14:1381・doneCount:1584-1590）に自主トレが混入し意味が変わる→包含を仕様と明記するかkindフィルタ2箇所追加（insTraining:871欠席率分母の修正自体は正しいと検証済み） ⑦player履歴でfitnessレコードが「メニュー/0kg」表示（player:4104）→「自主」バッジに加えftype表示を検討 ⑧Phase 8のfitness tmenuは**旧タブのplayer**でgetMyMenus(3285)をすり抜け0種目メニューとして開始可能（クラッシュ無し）→リリース時に選手へ再読み込み周知 ⑨p(514KB)も写真base64が主因で将来の圧縮候補。
    - **検証済み・安全と確認された事項（再調査不要）**: kind:'self'/fitness/menuId:nullに対する新旧コードの例外・NaN無し（全消費箇所ガード確認済み）／trainerはtlog/tmenu非購読=無変更で正しい（trainer:139-144）／getTop3はT.homeローカル・使用1箇所=削除安全／getTodayPickupは3箇所使用=関数保持が正／p.height・p.wgはstaff doSavePlayer(3964)がフィールド単位代入のため構造的に共存（height同士のみ後勝ち=プラン注記どおり許容）／texlistマージはstaff:4573と同型で安全／読み取り5万/日・書き込み2万/日は現規模で問題なし／gr_のオンデマンドget+キャッシュ設計は安全／Phase順序の依存関係・新キー設計・マイデータのチャート冪等性対策（md_接頭辞+dC先行+固定高）は妥当。
  - **確定した実装順序（Phase 1〜9、1機能ずつ→構文チェック→模擬実行→commit。pushのタイミングは冒頭の「⚠️pushのタイミング変更」参照＝現在は最後にまとめて）**:
    1. **バグ修正**: staff/index.html:3775の`<option>`にvalue属性が無く「(手入力)」付きテキストがvalueになってしまい、種目推定グラフの種目選択が選択直後に元へ巻き戻る（原因特定済み）。
    2. **push/pull自動切替＋メニューのスロット化**: チームウエイトのtlog保存（当日最初の1件）で既存`pp`機構を自動確定（`ppAutoFlip`新設）＋スタッフがワンタップ修正できる導線は維持。tmenuに`ptype:'push'|'pull'|'fitness'`を追加し「6月push」的な手動命名運用をPUSH/PULL固定スロット（各1つ・中身だけ差し替え）に統一。選手側は今日のタイプのプログラムが自動表示され1タップで開始、ホームの「TODAY: PUSH DAY」ヒーロー/ppカードもタップでトレーニング画面へ直行するようにする（現状はタップしても何も起きない＝ユーザー不満点）。
    3. **自主トレ記録**: チームウエイト以外に「自主トレ・ウエイト（自由種目構成）」「自主トレ・フィットネス（種類/時間/距離任意/RPE/メモ）」を選手が記録可能に。tlogに`kind:'self'`を追加し推定1RM・ボリューム・スタッフ/コーチの種目推移グラフに**完全統合**（「自主」バッジで区別）。fitnessレコードは`results:[]`+`totalVolume:0`を必ず持たせ既存集計コードを無傷にする設計。
    4. **チームウエイト中の種目追加**（できない/早く終わった時に自由種目を追加・texlistオートコンプリート）＋**ホーム情報量削減**（今週スケジュール圧縮・体組成チーム全員リスト撤去・ランキングTOP3をホームから撤去・お知らせ折りたたみ）＋**選手が身長のみ自己編集**可能に。
    5. **マイデータタブ新設（ユーザーが一番やってほしいと明言した最重要機能）**: ボトムナビ4つ目に新設。期間セレクタ＋自動考察（coachの`insPlayer`5ルールを選手向けに移植＋自主トレ/体組成ルール追加）＋コンディション/体組成(FFMI)/トレーニング/フィジカルの推移グラフ＋GPS枠（Phase 9まで自動非表示）＋怪我履歴。coachの`renderPlayerReport`/`insPlayer`(coach:1018-1067,1728)を参考に選手向けへ翻訳する設計。
    6. **ランキング専用ページ**: 既存`T.ranking`(player:2746)の集計ロジックは保持し表彰台演出込みで全面リビルド（GPS/スタッツ指標を後から追加できるレジストリ構造）。
    7. **グループ分け（スタッフ）— 2段階**: ①シーズン中は**午前組/午後組**の自動振り分け（優先順位: 月水金いずれかに5限あり→午前固定 ＞ 本人希望 ＞ 遠方→午後 ＞ 残りは人数バランス。オフシーズンは分割なしトグル）②各組内でBIG3総合強度（直近推定1RM優先→実測ph）による3人組固定（端数は4人組に吸収）・push/pull共通・怪我人デフォルト除外・手動入替可。**5限有無（月/水/金別）・遠方・時間帯希望は選手がマイページで自己申告（`p.wg`新設）＋スタッフも代理編集可**。新キー`tgroup`（午前/午後シフト×グループ配列、常に1レコード全置換）。
    8. **Fitプログラム提示（スタッフ）**: `ptype:'fitness'`のtmenuを構造化ライトで作成→選手が「これをやる」で自主トレ記録にプレフィル→実施記録が残りスタッフが実施者を確認できる。オフシーズンのフィットネス提示に対応。
    9. **GPS/試合スタッツExcel取込**: SheetJS(CDN)で列マッピング画面を作り「この試合で一番走った」等をランキング/マイデータに統合。**ユーザーの実Excelファイル到着待ち＝現時点では着手不可**（到着次第このPhaseだけ繰り上げてよい）。
  - **横断で絶対に守る制約（プランに詳細あり）**: 新キーは短いキーのまま／保存はsvSafe・svSafeUpdateのみ／**基準エンジンブロック（player/staff/coach 3ファイルbyte一致）は非接触**／**ppCardHtmlのplayer/staffバイト一致を維持**（変更は2ファイル同時+diff確認）／id・クラス名リネーム禁止／playerは現在FUKUDAI REDライトテーマ（下記FUKUDAI RED節は完了済みだが配色・スプライト・`ic()`等の資産はそのまま使う）。
  - **次にやること**: ✅Phase 0採否確認（全部実施で承認済み）→✅レビュー所見のプラン反映済み→✅Phase 0実装済み（上の🚀節）→**残: push確認→本番アーカイブ確認→Phase 1（staff:3775 + coach:1175）**。着手前に必ず`/Users/nakayamarinnin/.claude/plans/sequential-doodling-feather.md`を全文読むこと（レビュー所見は反映済み＝プラン本文が正。上の🔍節は反映元の記録として残置）。
  - 下記「✅✅ 全面デザインリニューアル『FUKUDAI RED』」以降は**完了済みの過去プロジェクトの記録**（参考情報として残置）。

- **✅✅ 全面デザインリニューアル「FUKUDAI RED」は全フェーズ完了・push済み。リニューアル作業としては完結。** 以降は実利用フィードバックでの細かい改善フェーズ。新規作業は通常どおり「1機能ずつ→構文チェック→動作確認→commit→（pushはユーザー確認後）」で進める。
  - **L1（ランディング＝`index.html`）完了内容**: §4どおり全面リビルド。maroonフルブリードヒーロー（ノイズ`::before`+ghost「15」+**離散ピッチライン**=ハーフウェイ実線50%/22m実線22%・78%/10m破線37%・63%を幅2px no-repeatタイルで実装）→波カット（data URI・clip-path不使用）→白ゲートカード4枚（kicker組織語彙 PLAYERS/PERFORMANCE STAFF/MEDICAL/COACHES）。**JSゼロ（script 0個）**・CSSのみstagger（`.gate{opacity:0;animation}`は`@media (prefers-reduced-motion:no-preference)`内に排他スコープ＝reduce時はベースopacity:1で4枚可視）。**meta viewportから`maximum-scale=1.0, user-scalable=no`除去済み**（WCAG 1.4.4）。スプライトはL1で使う6種のみ内蔵（i-ball/i-run/i-clipboard/i-bandage/i-chart-line/i-chevron-r）。
  - **L1で敵対的レビュー(4レンズ)→CONFIRMED 3件を全修正済み**: ①フッター文字`--text-tertiary`(3.92:1)→`--text-secondary`(#6E5A5C・5.85:1)でWCAG AA通過 ②pitch-linesが`background-size:100%`で全幅ピケットフェンス化+`::after`死にコード→固定幅2px no-repeatタイルで離散線に再実装 ③ヒーロー→ウェーブ接合の暗い帯→ラジアルグラデ終点を`var(--maroon-d) 72%`に前倒しして下端全体をmaroon-dに解決。REFUTED 2件（.sub rose-l=5.79:1でAA通過/ghost-num text-stroke=対象ブラウザ描画OK）は修正不要。
  - **最終チェック（計画書「最終チェック」節）ALL PASS**: 全devテスト10/10 PASS（player6=engine/dash/cond/ranking/mystatus/train_weak・staff3=dash_staff/staff_pdetail_std/std_staff・coach1=coach_report_std）/ 基準エンジン3ファイルbyte一致（同一MD5 `d5833f63…`・181行）/ trainer・coach git無変更（`git status`はindex.htmlのみ）/ §2最終スキャン9ファイル（player・staff・index＋dev5テスト＋staff_pdetail）で絵文字残数0（5範囲=1F000-1FAFF/2600-27BF/2B00-2BFF/FE0F・200D/2300-23FF）。
  - **⚠️絶対ルール（不変・今後も）**: 基準設定の「保存」ボタンは絶対に自分から押さない（本番Firestore std書き込み）・pushはユーザー確認後・id/クラス名リネーム禁止・基準エンジンブロック編集禁止・データは短いキー・保存はsvSafe/svSafeUpdate。計画書: `/Users/nakayamarinnin/.claude/plans/1-encapsulated-wand.md`。
  - **進捗**: P0〜P9✅ → S1✅ → S2✅ → S3✅ → S4✅ → S5✅ → S6✅ → **L1✅（完了）**。**全フェーズ完了。**
  - **コミット**: `d23ab85`+`94d6abe`+`f476141`+`71eed1d`+`e7c7a83`+`7af72d8`（player）+`8dde60b`（S1）+`b0e40ca`（S2）+`7319ca5`（S3）+`132bca7`（S4）+`c70e51c`（S5）+`282b43e`（S6コード）+`7d5e39d`（S6 HANDOFF）+`282b43e`後の各HANDOFF更新+**L1コミット（本セッション）**。**全て未push（pushはユーザー確認後）**。trainer/coachは無変更（毎回git statusで確認済み）。全10 devテストPASS状態。
  - **S6で実装済み（重複実装しないこと）**: staff/index.html の残画面群を絵文字ゼロ化。**§2最終スキャン残数0（5範囲・コメント込み・185→0）**。①怪我管理(一覧🚨→i-warn/🎬→i-play・リハ進捗行 stage-dot✓→i-check/▶◀→i-chevron/🎯→i-target/📊→i-chart・ケガ分析ヘッダ🔬i-chart-line/🩹i-bandage/📅i-calendar/⚡i-bolt/💡i-info・既往歴📜→i-clipboard/⚠️同部位i-warn)②マイカルテ(タブ7=概要i-clipboard/経過i-clock/受傷診断i-bandage/評価i-chart/SOAPi-edit/復帰i-flag/コメントi-note・タイムラインmetric😣i-pain-3/📐i-ruler/💪i-dumbbell・復帰🎉desc除去・診断/評価フォーム見出し全ic化・追跡指標🎯i-target/🧠脳震盪i-warn・回復ゲージ🔥i-fire/患健比✓i-check・RTP🏉→**i-run**(i-ball=試合予約と分離)/選択✓i-check・復帰判定✅i-check-c・復帰目標🎯i-flag・コメント💬i-note/📤除去)③選手詳細(ヘッダ⚠️PIN i-warn/本日コンディション✓i-check/🔒PINリセットi-lock/📥提出状況i-clipboard/🕐i-clock/📈種目推移i-chart-line/⚠実効強度i-warn・**動的DOM📸→i-camera(innerHTML化)**・欠席cb-box✕→i-check(innerHTML化))④テープ(**placeholder🔍除去**/⚠️注意点i-warn/日別詳細📋i-clipboard/📅i-calendar/👤i-user/⏱i-clock/📝i-edit/動画▶i-play)⑤トレーニング(🏋️i-dumbbell/💡i-info/実施状況🏥i-bandage/⚠️i-warn)⑥測定会(📐i-ruler/📅カレンダー連動i-calendar/自動作成alert)⑦復帰テスト(✅i-check-c/🏁i-flag/🎉i-check-c/患部フィット✓✗→i-check/i-x)⑧リハビリプラン(ログ✓i-check/📅i-calendar/stage-dot✓)⑨トレーナー管理(👨‍⚕️i-user/🔒i-lock/⚠️i-warn)⑩インポート(⚠️i-warn/✓i-check・**doCalImport成功alert=S5持ち越し②**)⑪**試合日メンバー選択cb-box ✓→i-check統一=S5持ち越し①**(innerHTML化)⑫基準設定(💾除去=btn.textContent保存/復元を壊さぬため)。**横断**: 成功系alert(削除/保存/作成/登録/承認等34件超)を全toast化(navigate→toast順・成功alert残0)・失敗/バリデーションalertはブロッキング維持/**RTP_LEVELS色をplayer L316同値の濃色へ差し替え=S5持ち越し③**(rest#B91C1C・rehab#C2410C・partial#A16207・full_nc#1D4ED8・limited#6D52D6・full#046C48。kキー保存値・構造不変。trainer/coachと意図的乖離=リスク#14・コメント明示)/textContent切替トグルinnerHTML化(toggleResolvedInj/Rehab ▶▼→i-chevron-r/d・toggleTrSess ▸▾→i-chevron-r/d・toggleAbs/toggleMatchSel/matchSelAll ✕✓→i-check)/幾何記号(←→▶◀→i-chevron・diffArrow↑↓→→i-up/i-down/i-trend-flat・card行›→i-chevron-r・ヘルプ文引用▶も整合)/コメント内⚠️★掃討。**保持が正**: 文中の→(バケットB)・例文○○◯◯・select option内▲▼(SVG不可・L2746)・スパークライン↗↘→(trainer共有・不変)。**PP初期設定**: ppCardHtmlがplayerとバイト一致を確認(S3で整合済み)。テスト更新: test_staff_pdetail_std L19(🎯→i-target)・test_std_staff(保存完了をtoast捕捉に変更)。
  - **S6検証済み**: jsc構文OK・staff全3テストPASS・括弧HEAD比不均衡ゼロ(`(`/`)`共に+82=ic()均衡括弧)・基準エンジンstaff/player/coachバイト一致(8210B)・trainer/coach無変更・**実機ブラウザで12画面+選手詳細+怪我カルテ全タブ→描画DOM絵文字ゼロ+アイコンSVG描画+JSエラー0**(Firestoreオフライン警告はネットワーク起因で無関係。基準設定は入力欄114個正常描画=属性順維持。RTP色濃色化でレベルドット全可読も目視)。**S6完了時に5次元敵対的レビュー(8エージェント)実施→CONFIRMED 1件(low・ヘルプ文L1704の▶変換漏れ)を修正済み・再検証OK**。
  - **S6の申し送り（任意の後続候補）**: 計画S6の「測定会=チームシート様式」は、未入力/測定なし/入力済みが既にアバター付きの綺麗な人リストのため大掛かりな再デザインは見送り（要件が曖昧・現状機能十分）。ユーザー希望あれば別途着手。sparklineSVG(青グラデ#3B82F6/#A78BFA)とスパークライン推移キャプション↗↘→はtrainerとバイト一致共有のため**S6でも意図的に不変**（変えるならtrainer側と同時＝リスキン範囲外・ユーザー判断）。
  - **S5で実装済み（重複実装しないこと）**: ①`V.rank`表彰台をplayer P5様式に刷新（1位=全幅リーダーカード`.rk-lead`＝ghost番号「1」+goldリング+`.rk-lead-ava.has-photo::after`写真乗算オーバーレイ＋CHAMPIONキッカー、2/3位=silver/bronze上ボーダーカード+ghost番号、4位以降=`rowHtml`バー付き行。旧standColors/avaColors/avaBorder淡色は完全削除）②前回比チップ`diffStrOf`/`latestDiffOf`新規実装（直近2回の測定差・SIMPLE_F種目のみ・ブロンコは短縮=改善で極性反転・i-up/i-down）③`.rk-bar`をmaroonグラデ+`transform-origin:left`、`.rv-armed.in .rk-bar`に`barfill` scaleXアニメ、`.rk-lead-ava`乗算CSS追加④`V.players`のPIN未設定警告→ic('i-warn')⑤`V.export`7タイル+全JSONバックアップをic()化⑥`V.help`見出し8+箇条書き3をic()化⑦`ROLE_EN`/`roleBadgeHtml`をplayer P8からバイト移植（darkenForLight直後・スタート→STARTING XV/リザーブ→FINISHER/マップ外=日本語のみ）、role表示2箇所(goMatchDateDetail/matchday詳細)をバッジ化⑧matchview日付カード`›`→i-chevron-r、goMatchDateDetailヘッダ🏟️→i-ball⑨`V.calendar`フィクスチャーリスト様式（FIXTURESキッカー+日付ブロック大italic+曜日+縦罫+MATCHフラッグ(skew・maroon-vivid)+試合はmaroon左3pxストライプ・非試合は種別bdバッジ`color-mix(in srgb,COLOR 14%,transparent)`薄背景）、月ナビ◀▶→i-chevron-l/r、測定会バッジ📐除去、weight色`#F97316`→`var(--pull)`×2⑩ドリルダウン goImportCal📋→i-clipboard・calDayClick📅→i-calendar。
  - **S5検証済み**: jsc構文OK・staff3テストPASS・括弧HEAD比不均衡ゼロ・エンジン3ファイル一致・trainer/coach無変更・ブラウザで6画面+3ドリルダウン絵文字ゼロ+CHAMPIONカード/フィクスチャーリスト/FINISHERバッジ/CSV出力SVGアイコンを目視・JSエラー0。**⚠️S5コミット直後に3視点adversarialレビュー(task wz7silv20)をバックグラウンド起動済み→次セッションで結果確認、実害ありの指摘があれば修正。**
  - **S4で実装済み（重複実装しないこと）**: ①`_chAnim(vkey,stagger)`ヘルパー新設（reveal util直後。reduce=false返し=グローバルdefaults上書き対策内蔵/V画面=初回700ms easeOutQuart・再訪問&onSnapshot再描画=duration:0（`_chartVisited`+setTimeout(0)で同一描画パス内の複数チャートは同判定）/vkey無し=毎回400ms/stagger=棒のdelay:dataIndex*40）②12本全てに`animation:_chAnim(...)`配線（injstats4本='injstats'・ftg='fatigue'・phys='physical'・bc='bodycomp'・evpain/evrom/pp/pftg/tr1rm=引数なし400ms）③色刷新: barColors=maroon先導10色濃色/ispart棒#8d0000/ismech#6D52D6/painColors・romColors濃色化/renderPhysChartのmkSet4本（SQ#1D4ED8/BP#046C48/DL#B45309/BIG3#6D52D6+同系グラデ）+tooltip=rgba(42,10,12,0.96)+ticks#6E5A5C+grid rgba(60,10,12,0.08)（=player tvol/tex同値）/ftg・pftg=RPE#c1121f・睡眠#1D4ED8・sRPE#6D52D6/pp=SQ/BP/DL標準色/bc=体重#1D4ED8・体脂肪#c1121f・筋量#046C48/tr1rm=vol・topW#8d0000・e1rm#046C48（薄点#8FC3AF）・参照線#8A7578④nav()タイトル辞書に`injstats:'ケガ分析'`追加（トップバーが生キー"injstats"表示だった既存バグ修正）。**canvas min-heightは不要と判断**（.chart-wrap既存height:230px固定+各inline heightでシフトなし）。
  - **S4検証済み**: 括弧バランス=HEAD比で新規不均衡ゼロ（既存±はJS正規表現リテラルの誤検出と確認済み）・jsc構文OK・staff3テストPASS・エンジン3ファイルdiff一致・**ブラウザで12本全カンバス描画確認**（bc・tr1rm等データ条件付きはメモリ注入or該当データ持ち選手で確認・リロード破棄済み）・JSコンソールエラー0（Firestoreオフライン警告はネットワーク起因で無関係）・`_chartVisited`再訪問動作確認。
  - **S4の申し送り**: `sparklineSVG`のSVGグラデ（#3B82F6/#A78BFA）は**trainerとバイト一致の共有関数（Phase2の19関数）のため意図的に不変**。変えるならtrainer側と同時＝リスキン範囲外なので**S6でユーザーに確認**。青グラデカード（タイムライン装飾・linear-gradient(135deg,#3B82F6,#2563EB)）はS6タイムライン刷新で処理。V.injstatsの画面ヘッダ絵文字（🔬🩹📅等）はS6掃討で処理（チャート本体はS4完了）。
  - **S3で実装済み（重複実装しないこと）**: ①アラート3層化（緊急=赤帯/注意=`#warn-clp`折りたたみ`grid-template-rows:0fr→1fr` 220ms+シェブロンrotate・開閉状態は`window._dashWarnOpen`で再描画をまたいで維持・`dashWarnToggle()`/情報=プレーン。6グループヘッダ全てic()カテゴリアイコン+bd件数バッジ化）②stat-tile 4枚`.num`化+count-up（`data-cu`=生数値・登録選手/コンディション正常/提出率のみ。**怪我タイルは禁止どおり非適用**）③提出率タイルにSVGリングゲージ1枚（`data-ring`・dashoffsetインライン最終値+`.ring-go`でdraw 0.9s）④count-up/リングutil=`_cuRun`/`_ringRun`（`_armReveal`内で発火=クラスA・**小数は桁数保持・最終フレームは生値**）⑤ppCardHtml=player P3版をバイト一致移植（PULL=--pull/flag様式/ic()）⑥CLUB RECORDSボード（ink面グラデ+gold罫線+kicker--gold・集計ロジック不変・BIG3値にdata-cu）⑦お知らせ=notice-item掲示板様式（マスキングテープCSS複製）+i-megaphone+**投稿テンプレの📅除去（L5886付近）**⑧dash全域絵文字ゼロ+提出バーの青系HEXグラデ撤去⑨**既存バグ2件修正**: todayS巻き上げで疲労度アラートが常に空（宣言を関数先頭へ）/onSnapshotの起動直後fromCacheキャッシュ通知でDが巻き戻る（player/staff両方に`doc.metadata.fromCache`ガード）⑩初回ロードを`nav('dash')`経由に（クラスA演出+学年更新ボタンが初回から揃う）。
  - **S3検証済み**: jsc構文OK・**staff3テスト+player6テスト全PASS**（`dev/test_dash_staff.js`新設30アサート=count-up/リング/3層/折りたたみ状態維持/CLUB RECORDS/ノーティス/pp/絵文字ゼロ/巻き上げ回帰）・エンジン3ファイルdiff一致・ブラウザ目視（本番データ+メモリ注入で緊急帯/折りたたみ開閉/ノーティス確認・count-up 8/8発火・リロード後コンソールエラー0）。レビュー指摘の_cuRun小数バグ（132.5→133固定化）は修正済み。
  - **S2で実装済み（重複実装しないこと）**: ①サイドバーink面化（`.sb`グラデ=var(--navy-2)→var(--navy)・旧#11203A/青系rgba全廃・文字pale/rose-l系）②ロックアップ（sb-hd=goldのi-ball+Overpass italic 900「RUGBY MANAGER」+gold「FUKUOKA UNIV. RFC」）③アクティブjerseyストライプ（`.ni.ac::before`=left:-3px/6px幅=maroon-vivid 4px+gold-hot 2px・`sbstripe` scaleY 0→1 .15s・**アニメはreduced-motionガード内**・`.ni`にposition:relative追加・ac文字=pale・acアイコン=gold-hot・inset影は赤系rgba(193,18,31,.14)）④navアイコン20個をスプライト`<use>`化（dash=i-home/players=i-users/calendar=i-calendar/injury=i-bandage/rehab=i-run/training=i-dumbbell/injstats=i-chart-line/rtest=i-flag/tape=i-tape/fatigue=i-moon/absence=i-x-c/physical=i-chart/msess=i-ruler/bodycomp=i-scale/**matchview=i-ball（試合記号）**/rank=i-trophy/trainer=i-user/standards=i-target/**export=i-download**/help=i-book）⑤`.app{height:100vh;height:100dvh}`⑥pushViewの「← 戻る」→`ic('i-back',14)`化（1箇所で全44画面波及）⑦トップバー絵文字2件（📋一括インポート→i-clipboard/📅学年更新→i-calendar）⑧ローディング画面=playerと同一ブランド（maroon-d面+`.ld-ball`揺れ1.4s+`#loading-screen.done{opacity:0}`+退場=pointerEvents:none→transitionend後display:none+600ms保険）・エラー画面=i-warn gold+pale再試行ボタン。
  - **S2検証済み**: jsc構文OK・staffテスト2本+test_dash PASS・エンジン3ファイルdiff一致・ブラウザ目視（デスクトップ/740px iconのみ/ローディング/エラー画面/i-backドリルダウン/コンソールエラー0）・**3視点並列レビュー+敵対的裏取り実施→指摘1件（CSV出力の▼がi-down=前回比記号と二義）を修正済み=`i-download`スプライト新設（player/staff両方に同時追加・**現在72種・id完全一致Python確認済み**）**。
  - **S1で実装済み（重複実装しないこと）**: staff/index.htmlに①トークンv3差し替え（:root全面。--navy系はmaroon暗色にエイリアス済み=既存サイドバーCSSが自動で暗マルーン化・--navy-hover:#4a1113・--shadow-lg維持・--font-num追加・radius 12/16）②フォントlink（Zen Kaku+Overpass、playerと同一URL）③スプライト71種を`<body>`直後に複製（**player/staffでid完全一致をPythonで確認済み**）④基礎ユーティリティCSS（.num/.kicker/.ghost-num+--light/.ic/.flag/.flag-jp/:focus-visible/#toast-wrap=**右上**・上からスライド/.rv-armed reveal）⑤JSヘルパー: `ic()`（function宣言）・`darkenForLight()`・`toast()`（右上・i-check-c）・reveal util一式（`_armReveal`=**viewStack.length>0で除外**（playerのsubView相当）・curPage単位visited・先頭8要素・offsetParentスキップ・IO+1.5s保険・フォームtabブラックリストは無し=staffのフォームは全てpushView経由）・MutationObserverは`#main-ct`直下childList⑥`nav()`に`_navAnim=true`配線⑦Chartライトdefaultsをmaroon系に（#6E5A5C/rgba(60,10,12,.08)+reduce時animation=false）⑧`ld()`で`_lastRaw`プライミング+`startListeners()`のonSnapshotに生JSON比較スキップ⑨`renderStdSummaryHTML`のランク色に`darkenForLight()`先行適用（白地パステル不可視対策）。
  - **S1検証済み**: extract+jsc構文OK・test_std_staff/test_staff_pdetail_std両PASS・基準エンジン3ファイルdiff一致・ブラウザで読込確認（74名・ic/toast/darkenForLight/スプライト存在・dash描画）。サイドバーの見た目はS2で刷新・目視済み。
  - **監査grepの残作業リスト（S2で再実行済み・サイドバー行は消滅確認）**: 主な内訳: player-hero/タイムライン=S6・rk-bar=S5・タイムラインG辞書/青グラデカード=S6・ch-phセット=S4・表彰台色/barColors/painColors/romColors=S4・SVGグラデ=S4か掃討・SOAPタグ色=S6・RTPLEVELS色=**JSデータ色として保持検討**（timeline/badge両用）・カレンダー#F97316=S5。正当な残置: `.ghost-num`白stroke（maroon面用）。※このリストはgrep再実行（計画書P1節の2パターン）で再現可能。
  - **⚠️staffの絵文字掃討はS3〜S6の各画面ステップ+S6最終スキャンで実施**（S1では未着手。staff全体で✓56件+絵文字多数が残存中）。`test_staff_pdetail_std.js`L19の🎯アサートは**staff側の🎯をS6で置換するときに同時更新**。
  - **P8で実装済み**: `rtpPitchHtml(stage)`（RTP7本ピッチ図・`.rtp-anim`=表示のたび1回方式※showSubは_navAnimを立てず.rv-armedが発火しないため・マーカーslide/ドットstaggerポップ/currentリング2回）・showMyChartに「ROAD TO RETURN」カード・`ROLE_EN`/`roleBadgeHtml`（スタート=STARTING XV/リザーブ=FINISHER/出場なし=日本語のみ）・PB系alert→pbFlash+toast（doBronco/doPhys）・mypage/カルテ/各フォーム絵文字ic()化。
  - **P9で実装済み**: 成功系alert→トースト全件（`go('x');toast('…')`順・✓記号除去）・失敗系alertはプレーンテキスト維持・怪我報告トーン改訂（「痛み・違和感を伝える」+リード文+「この後の流れ」カード+ボタン/ヘルプ文言同期）・T.tape試合前枠にMATCH DAYフラッグ+maroonストライプ・T.help/T.injury/T.physical系の絵文字全ic()化・`#best-banner`div削除・`glowCol()`削除・ch-phチャートライト色（SQ#1D4ED8/BP#046C48/DL#B45309・tooltip ink・ticks#6E5A5C）・**最終スキャン残数0**（player本体+dev5テスト。※`test_staff_pdetail_std.js`L19の🎯はstaff側が旧実装のためS6で更新＝計画通り残置）・**暗色HEX監査2パターン=白面差し替え完了**（残2件は正当: L110 ghost-num白stroke=maroon面用（白面は`--light`バリアント）・L66 nav-dot #F87171=ink面ナビ上）・ブラウザ総点検済みコンソールエラー0。
  - **P7で実装済み（重複実装しないこと）**: stickyタイマーバー`#rest-timer-bar.rt-bar`（top:var(--hdr-h)/z-index:5・conic-gradientリング`#rest-timer-ring`・`#rest-timer-label`のTIME OFF/ON語彙・残30秒赤・残5秒`.rt-pulse`・終了=vibrate既存パターン+`_rtBeep()`（開始タップ時生成AudioContext）+バー`.rt-flash`3回・ids rest-timer-disp/btn維持・`updateRestTimerBtn`はinnerHTML+ic()化・再描画時も無条件で表示復元）・44px縦のみ（trStepBlock±40x44/入力min-width:34px/numStepHTML縦padding10/cond-toggle・rate5にmin-height:44px）・FOCUSバッジ（maroon-vividフラッグ+maroonストライプ。amber完全撤去）・`pbFlash(msg)`ヘルパー（fixed z-index:11・gold PB!フラッグ・自動退場。P8のPB系alert置換で使う）・FULL TIMEスタットシート（heroゴースト+MATCH STATS罫線テーブル+▲▼→i-up/down+e1rm更新時pbFlash発火）・MD-1テーパーヒント（明日D.cal試合）・前回超え演出（`window._trBeatDone/_trBeatTimer`・300msデバウンス・`.vol-beat`）・トレChart3本を`charts.ph/tvol/tex`登録+ライト色（maroon/緑・tooltip ink・ticks #6E5A5C）・refreshTrainingLiveの緑/赤地をvar(--green-bg)/var(--red-bg)化。test_train_weakにP7アサート14件追加済み・全PASS・実機確認済み（sticky座標・タイマー完走・beat演出・FULL TIME・PB!目視）。
  - **P6で実装済み（重複実装しないこと）**: `MOOD_EMO/STRESS_EMO/SORE_EMO`のic()化（STRESS=i-face逆順・SORE=i-pain・サイズ22明示）・`RATE5_LABELS`定数・`rate5HTML`のラベル併記+チェックマーク+aria-pressed（**ラベル併記時は下段lo/hiキャプションを省略**＝文言矛盾防止）・`setRate5`のmaroon選択色（inset影で2px級・レイアウトシフト回避）・`togglePartChip`のmaroon塗り+aria-pressed・`.part-chip`CSS（pale地）・rate5HTML6呼び出しに`RATE5_LABELS`配線済み・sRPE→「セッションロード(AU)」+注記「RPE×分」（updSrpe/updESrpe/過去記録行「◯ AU」/mypage最新コンディションの4箇所とも統一済み）・T.conditionヘッダーi-back/i-check-c化・ch-cf線色ライト濃色化（#c1121f/#1D4ED8/#046C48/#6D52D6）・test_cond.jsに極性6+updSrpe4+AU3アサート追加（全PASS・L26属性順アサート不変）。実機ブラウザ目視済み（選択状態・逆順極性・AU表記・チャート4色・修正フォームプリセットまで確認、コンソールエラー0）。※showEditConditionタイトルの絵文字「😴」はP9掃討スコープで残置。
  - **実装で確立した学び（計画書に無い追加知見・S/Lフェーズでも適用）**:
    - **ghost-num上書き事故**: `.hero>*{position:relative;z-index:1}`型の後勝ちルールが`.ghost-num{position:absolute}`を同スペシフィシティで上書きし、ghostが通常フローに落ちて親のoverflow:hiddenでコンテンツ全体を押し出す（実機で発生・修正済み）。**ghostを置く親の`>*`ルールは必ず`>:not(.ghost-num)`にする**（hero/myphys-card/rail-cardは対応済み。staffで新設するカードも同様に）。
    - モーションutil実装済み（player）: `_armReveal`（MutationObserver・#main直下childList・素マーカー`.rv`のみarm・先頭8要素・offsetParentスキップ・IO+1.5s保険・`_RV_FORM_TABS={condition,physical,match}`ブラックリスト・訪問済みタブSet）。onSnapshotは`_lastRaw`生JSON比較でスキップ、`ld()`でプライミング済み。**S1でstaffへ複製時はsubView→`viewStack.length>0`に読み替え**。
    - `toast(msg)`実装済み（#toast-wrap動的生成・nav上+safe-area）。成功系alert置換はこれを使う（P8/P9/S3/S6）。
    - 実装済みヘルパー（全てエンジンブロック外）: `ic(n,s,c)`（function宣言）・`darkenForLight(c)`・`liftDiffChip(pid,phField)`・`BIG3_CLUBS=[400,450,500]`・`POS_NUM`・`RATE5_LABELS`。スプライトは`<body>`直後67種（player/staffでid完全一致複製が鉄則）。
    - `glowCol()`はmaroon固定影に変更済みで**現在呼び出し箇所ゼロのはず**→P9掃討で関数ごと削除候補（grep確認してから）。
    - 本番`D.p`に「テスト選手」（CTB/1年・PIN 1129・削除可）が存在し、previewブラウザのlocalStorageで自動ログイン確認が出る。実機確認はこれ or メモリ注入（下記既存メモ参照）で。
    - 今セッションのpreviewroot: `/private/tmp/claude-501/-Users-nakayamarinnin-Documents-rugby-manager/b09861ed-75e3-4384-bd14-162b8de963b7/scratchpad/previewroot/`（**次セッションではセッションIDが変わるので`.claude/launch.json`の書き換え+再作成が必要**。旧セッションのpreviewサーバーが残っていたらpreview_stop→preview_start。手順は下方の「開発環境メモ」参照。編集のたびに`cp`同期を忘れない）。
    - スプライトは現在**72種**（S2でi-download追加）。player/staffでid完全一致複製が鉄則（Pythonで`symbol id`リスト比較）。i-down=前回比▼記号として予約済みなので、ダウンロード用途にはi-downloadを使う。
  - **残フェーズの要点（詳細は計画書）**: P7トレーニング系（44px縦のみ・stickyタイマー`--hdr-h`・PB!フラッシュ・FULL TIME・Chart個別色L1670/3587/3599・test_train_weak L36/46-50）→P8サブ画面A（RTP7本ピッチ図・STARTING XV/FINISHER・PB系alert統一）→P9掃討（成功系alert22件→トースト・#best-banner削除・最終スキャン§2定義で残数0）→S1〜S6 staff→L1ランディング。
  - **⚠️実装時の絶対ルール（不変）**: 基準エンジンブロック編集禁止（新ヘルパーは必ずブロック外）・id/クラス名リネーム禁止（`loading-screen`含む）・staff基準設定の保存ボタンは押さない・pushはユーザー確認後・1ステップ=1検証（jsc+devテスト）・データは短いキー・保存はsvSafe/svSafeUpdate。
  - **テスト更新状況**: test_dash✅（P3でi-target/i-warn化+トレ項目アサート5件追加済み）・test_mystatus✅（L59/64/71更新済み）・test_ranking✅（L33-34セマンティック化済み）・test_cond✅（P6で極性・AUアサート追加済み）・test_train_weak=P7で・test_staff_pdetail_std=S6で・test_coach_report_std=**触らない**。
- **✅✅✅✅ player大幅リニューアル＝9ステップ全完了・commit&push完了（2026-07-06、コミット`aa36550`）。** player/staff/coach/index.htmlとも実装・jscモック検証（esprimaで構文再確認）・実機ブラウザ確認・多角レビューまで完了。`dev/`配下のjscモック検証スクリプト一式もテスト資産としてリポジトリに追加。`.claude/launch.json`と`.DS_Store`は`.gitignore`へ追加して追跡対象外に。**このタスクは完全に完了。**
  - **今回やったこと（ステップ⑧の残り＋⑨）**:
    1. `dev/test_coach_report_std.js`新設。`renderStdBadgesCoach`（BIG3ランクバッジ・体重帯）と`renderPlayerReport`のコンディション拡張（mood/stress/soreness平均）をjscモックで検証＝**27アサート全パス**。
    2. その過程で発見した小さな不整合を修正: `renderStdBadgesCoach`はポジション未登録時に**何も出さず消える**実装だったが、同じ関数内の他の欠損ケース（身長未登録・1RM未測定）やstaffの同機能（`renderStdSummaryHTML`）は「ポジション未登録のため基準未表示」という案内カードを出す仕様。coachだけ無言で消えるのは一貫性を欠くため、staffと同じフォールバック文言を出すよう2行修正（coach/index.html:1701-1704）。
    3. coach/index.htmlを実機ブラウザで確認（本番Firestoreデータ）。瀧田雅公選手（BP140kg）で「ダイヤ」ランク＋推奨体重帯88.4〜105.4kg・帯内✓を表示、コンソールエラーなし。**本番にはmood/stress/sorenessの記録がまだ無い**（新設フィールドのため）ので、コンディション拡張カードの見た目はメモリ上に一時テストレコードを注入して確認（Firestore書き込みなし、リロードで破棄）→正しく5項目（平均睡眠/疲労度/気分/ストレス/筋肉痛）が並んで表示されることを確認。ポジション未登録選手のフォールバック文言も実機で確認。
    4. ステップ⑦（トレ実施画面の弱点強調）を実機でも確認。本番に用意済みの「テスト選手」（CTB、PIN 1129、削除可）でログインし、メモリ上のみで体重・BP不足の1RMデータを一時投入→`renderTrainingExec`で該当種目（ベンチプレス本体＋処方箋のダンベルプレス）にamber枠＋グロー＋🎯弱点バッジが付き、無関係種目（スクワット）には付かないことを確認。Firestore書き込みなし。
    5. ステップ⑨（最終チェック）: player/staff/coach/trainer4ファイルとも構文チェックOK（`new Function()`パース）。dev/配下の全jscモック（test_engine/test_dash/test_mystatus/test_ranking/test_cond/test_train_weak/test_std_staff/test_staff_pdetail_std/test_coach_report_std）を再実行し**全PASS**。基準エンジンブロック（`STD_LIFTS`〜`getWeakWeeklyVolume`、181行）のplayer/staff/coach間バイト一致を再確認（diff差分ゼロ）。
    6. **多角レビュー**（code-reviewスキル、8エージェント並列＝正しさ3観点＋再利用/簡潔化/効率/深さ/CLAUDE.md準拠）を実施。正しさ系3観点とCLAUDE.md準拠は**問題ゼロ**。cleanup系（再利用・簡潔化・効率・深さ）で計14件の改善余地が見つかったが、大半は「3ファイルへの手動コピーが前提の既存アーキテクチャ」（CLAUDE.mdが明示的に許容している設計）の範囲内、または74名規模では体感できない軽微な計算重複で、今回のスコープでは修正見送り（詳細は下の「多角レビュー結果」参照）。**実際に修正したのは2件**（下記）。
    7. **修正① 試合日チェック未入力の視認性低下（player/index.html）**: リニューアル前は「昨日の試合日チェックが未入力」が専用の赤い`alert-card alert-down`バナーとして目立っていたが、`todayTodoHtml()`への統合でコンディション入力等と同じ見た目のチェックリスト項目に埋もれてしまっていた（多角レビューで発見）。試合後のコンディション確認は怪我予防上重要な項目のため、該当項目にだけ`urgent:true`フラグを追加し、赤背景＋太字赤文字＋⚠️アイコンで視覚的に強調するよう修正（player/index.html:941,952-965）。`dev/test_dash.js`にurgent表示のアサート3件を追加、実機ブラウザでも赤背景の強調表示を確認。
    8. **修正② ALLO_FIELDの重複マッピング（player/index.html）**: ランキング画面の補正スコア切替が`var ALLO_FIELD={squat:'sq',bench:'bp',deadlift:'dl'}`を独自にハードコードしており、同じ内容がすでに`STD_LIFTS`（`{k:'sq',ph:'squat',...}`）にある状態だった。`STD_LIFTS`から導出する1行に変更（player/index.html:2347）。将来STD_LIFTSにリフトが追加/変更された時に追随し忘れるリスクを解消。`dev/test_ranking.js`で回帰なしを確認、実機ブラウザでも補正スコア切替が正常動作することを確認。
  - **多角レビュー結果（今回は見送った12件、将来着手する場合の参考）**:
    - **効率**: `getAlloTeamRank`がフルロスター再計算をmystatus画面でリフトごとに3回実行／ランキング画面の補正スコア切替のたびに`getCurrentWeightInfo`を選手分だけ再計算／`getWeakLift`が呼び出し側で既に計算済みの`getLiftRankInfo`結果を内部で再計算／coach`getStdCfg()`が1回のレポート描画で複数回呼ばれ10ポジション分のマージを繰り返す。**74名規模では体感できない**ため見送り。ロスターが大きく増えたら`getAlloTeamRank`のメモ化を検討。
    - **簡潔化/再利用**: `todayTodoHtml()`が`home()`で既に計算済みの値の一部を再計算／`isWeakEx`(トレ実施画面)と`getWeakWeeklyVolume`の3択判定式が同じロジックの重複／`myPhysCardHtml`と`mystatus`で体重帯ステータスの3分岐チップが重複／`doCondition`と`doEditCondition`で体重バリデーションが重複／`partChipsHTML`(コンディション用)がテーピング枠の`toggleTapePart`と概念的に似た「トグルチップ」を別実装／coach`renderStdBadgesCoach`がミニ統計カードの見た目を`miniStat()`ヘルパーを使わず手書き。**いずれも3〜10行程度の局所的な重複で、無理に共通化すると却って追いにくくなる規模**（CLAUDE.mdの「3行の重複は許容、早すぎる抽象化を避ける」方針にも合致）。将来同じ場所を触る時に気づいたら直す程度でよい。
    - **深さ（アーキテクチャ）**: `getStdCfg()`のマージが`pos`はフィールド単位で安全にマージするが、`ranks`/`allo`/`rx`は丸ごと上書きのため、将来staffが一度でも`std`を保存した後にコード側の`STD_DEFAULT.allo`等へ新フィールドを足すと、保存済み設定を持つチームだけ新フィールドが反映されない非対称な挙動になりうる。**現状`D.std`は空（本番でまだ保存されていない）なので実害なし**。staffが一度保存した後に`allo`/`rx`の项目追加をする予定があれば、その時に`pos`と同様のフィールド単位マージへ拡張するとよい。
  - **⚠️重要: staff設定画面(`V.standards`)の「保存」ボタンは絶対に自分から押さない。** 保存すると本番Firestoreの`std`キーに即書き込まれ、全サイトに反映される（ローカルでコードをpushしていなくても、Firebase自体は本番と直結しているため）。ユーザーがポジション別倍率テーブルをレビューする前に書き込むのは不可逆な実データ変更にあたる。動作確認は「見た目のレンダリング確認」までに留め、実際の保存操作はユーザー確認後にする。**今回のセッションでも保存ボタンは一度も押していない。**
  - **次にやること**: なし。実機フィードバック待ち。
  - **開発環境メモ（重要・毎回確認）**: このMacのsandboxはリポジトリ直下（`/Users/nakayamarinnin/Documents/rugby-manager`）を直接pythonサーバーのdirectoryに指定しても**404になり配信できない**（`curl`で直接検証済み。プロセス自体は正常起動するがファイルが見えない＝既知の制約）。**動くのはセッション固有のscratchpad配下**（例: `/private/tmp/claude-501/.../<セッションID>/scratchpad/previewroot/`）に対象HTMLを`cp`でコピーしてから配信する方式のみ。`.claude/launch.json`の`directory=`は**セッションごとに書き換えが必要**（前回セッションのIDのままだと存在しないパスになり404になる）。手順: ①`.claude/launch.json`のdirectoryを現在のscratchpadパスの`previewroot/`に書き換え②`mkdir -p previewroot/{player,staff,coach,trainer}`③該当ファイルを`cp`④`preview_start`→`preview_eval`で`window.location.href='http://127.0.0.1:8932/xxx/index.html'`。ファイルを編集するたびに③のコピーをやり直すこと（自動同期されない）。
  - **本番Firestoreにテストデータを注入する時の安全な手法（今回確立）**: 実機ブラウザのconsole/`preview_eval`から直接`D.p`や`D.ph`/`D.f`にレコードを`push`・書き換えして`render()`系関数を呼ぶのは、**ブラウザのメモリ上のJS変数を書き換えるだけでFirestoreへは一切書き込まれない**（Firestoreへの書込は`svSafe`/`svSafeUpdate`/`runTransaction`等を明示的に呼んだ時だけ発生する）。確認が終わったら`window.location.reload()`で破棄すれば実データへの影響ゼロ。本番データにまだ存在しない新フィールドの見た目を確認したい時（今回のmood/stress/soreness等）に有効。
- **✅ 選手写真を公式サイト(https://fukudai-rugby.jp/member/)から取得しFirestoreへ反映完了（2026-07-06・このセッション、コード変更なし）。** このタスクは完全に完了。
  - 公式サイトの選手一覧(氏名・写真URL)とFirestore `appdata/p` の74件(実在73名+テスト選手1件)を氏名で突合→**73件全て完全一致**(表記ゆれなし、テスト選手のみ対象外)。
  - 各写真をcurlで取得→`sips -Z 100 -s format jpeg -s formatOptions 70`で100x100 JPEG品質70%に変換(既存の手動アップロード機能と同一仕様)→base64データURI化→`photo`フィールドへ格納。
  - 書き込みはFirestore REST API(`firestore.googleapis.com/v1/...`、公開apiKeyのみで認証不要、ルール`if true`のため)を直書き込み前に最新ドキュメントを再取得(`svSafeUpdate`と同じ「直前に最新取得→マージ→保存」の安全パターン)。`photo`以外のフィールドは一切変更していない。
  - 結果: 73名に`photo`設定・テスト選手のみ空のまま。ドキュメント全体サイズ約518KB(Firestore1ドキュメント上限1MB以内)。player/index.htmlをブラウザプレビューで実機データに対して表示確認済み(ホーム画面・ランキングTOP3の両方でアバター写真表示を確認)。
  - スタッフ・コーチ(7名)の写真は今回対象外(ユーザーが選手のみを希望)。追加希望があれば同じ手順(scratchpad配下にroster.json的なURL一覧を作り、curl+sips+Firestore REST PATCH)を使えばよい。
  - Node.js/npmは引き続き本機に未インストール。`python3`+`curl`+macOS標準`sips`で完結できた。
- **🚧🚧 player大幅リニューアル進行中（2026-07-06・このセッションで続行、ユーザー指示「一旦ストップ」で中断中）。承認済みプラン: `/Users/nakayamarinnin/.claude/plans/elegant-conjuring-codd.md`（★必読。グリリング17問で確定した全設計判断＋倍率/FFMI叩き台テーブル入り）。9ステップ中①〜⑤完了・⑥作業途中・⑦⑧⑨未着手。player/staff/index.htmlとも未commit・未push。**
  - **何を作るか（要旨）**: トップ=自分専用ダッシュボード化。BIG3基準=10ポジ別倍率×体重で5段階ランク（ブロンズ〜ダイヤ、標準×0.70/0.85/1.00/1.10/1.20）＋アロメトリック補正スコア（1RM÷体重^b、b: SQ0.33/BP0.45/DL0.33暫定）。体重基準=FFMI方式の推奨帯＋3状態判定（帯内/未満/超過）。弱点種目判定→処方箋（推奨種目+推奨重量）→実施記録で強調→週次ボリューム追跡。コンディション拡張（mood/stress/soreness/sorenessParts/毎日weight）。設定はFirestore新キー`'std'`（**単一要素配列`[cfg]`**で保存=既存の配列前提インフラ無改造）にスタッフ編集UI、コード内`STD_DEFAULT`がフォールバック。3サイト（player/staff/coach）に反映。
  - **✅ステップ①完了=基準エンジン（player/index.html）**: `SK`に`std:'rm_standards'`・`D`に`std:[]`追加。`getPlayer1RM`直後に追加: `STD_LIFTS`/`STD_DEFAULT`（10ポジ×sq/bp/dl倍率+ffmiLo/Hi+bfLo/Hi、ranks5段階、allo b値、rx処方箋）/`getStdCfg()`（保存値をフィールド単位でデフォルトへマージ）/`getCurrentWeightInfo(pid)`（直近30日実測平均→最新実測→p.weight、採用ソース文字列付き）/`getLiftRankInfo(pid,'sq'|'bp'|'dl')`（ランク・次ランクまであと◯kg）/`getAlloScore`/`getWeightBandInfo`（FFMI帯→体重帯・in/under/over）/`getCurrentFFMIInfo`（bc.fat由来、無ければnull→測定CTA用）/`getWeakLift`（測定2種目以上でratio最小）/`getAlloTeamRank`（補正スコアのチーム内順位）/`getWeakWeeklyVolume`（弱点種目系の週次ボリューム、月曜始まり直近N週）。jscハーネス`dev/test_engine.js`36アサート全パス。
  - **✅ステップ②完了=T.home→自分専用ダッシュボード刷新（player/index.html）**: ログイン時のホームを「あいさつ+今日やること+マイフィジカルカード」の個人ダッシュボードに刷新（未ログイン時は従来のチーム画面のまま）。`todayTodoHtml()`（旧mypageの「今日やること」ブロックをそのまま関数化してhomeへ移設、mypage側からは撤去=重複排除）、`myPhysCardHtml()`（3種目ランクバッジ＋弱点🎯マーカー＋体重帯ステータス、ネオングロー背景`.myphys-card`、タップで`go('mystatus')`）、`glowCol()`（ランク色→半透明グローに変換）。ログイン系2箇所（`doLogin`/`confirmAutoLogin`）の着地を`mypage`から`home`へ変更。jscハーネス`dev/test_dash.js`新設・全パス。
  - **✅ステップ③完了=T.mystatus詳細画面新設（player/index.html）**: マイフィジカルカードの遷移先。3種目ごとにランク進捗バー（`rankProgressBarHtml`、ランク閾値ノッチ付き）・次ランクまでの必要kg・達成率・体重比・アロメトリック補正スコア＋チーム順位。弱点種目には処方箋カード（`'std'.rx`の推奨種目×`estimateWeight`で目安重量算出）＋週次ボリュームの棒グラフ（`getWeakWeeklyVolume`、直近5週）。体重帯は視覚的な帯バー（推奨帯をハイライト＋現在体重ピン）＋FFMI（体脂肪率の実測があれば表示、無ければ測定CTA）。ポジション未登録／体重データなし／DL等未測定の各欠損状態もフォールバックUIで対応。jscハーネス`dev/test_mystatus.js`新設・全パス。
  - **✅ステップ④完了=T.rankingにアロメトリック補正スコア順追加（player/index.html）**: BIG3種目（SQ/BP/DL）選択時のみ「実測1RM／✨補正スコア」の並び順トグルを表示（チンニング・クリーン・BIG3合計・ブロンコでは非表示）。補正スコアモードは体重データのある選手のみを対象に`1RM÷体重^b`で再ソートし、表彰台・リストの補足情報も実測1RMに差し替え。jscハーネス`dev/test_ranking.js`新設・全パス（体格差で実測と補正の順位が入れ替わるケースも確認済み）。
  - **✅ステップ⑤完了=コンディション入力拡張（player/index.html）**: `f`レコードに`mood`/`stress`/`soreness`/`sorenessParts`/`weight`を追加（全て任意・前方互換、未入力ならフィールド自体を保存しない）。入力・修正フォーム双方に絵文字1〜5段階ボタン（`rate5HTML`/`setRate5`＝同値再タップで解除）と、筋肉痛2以上でだけ現れる部位複数選択チップ（`partChipsHTML`/`togglePartChip`/`bindSorePartsToggle`、PARTS流用）。体重は30〜250kgの範囲チェックあり。過去の記録一覧・最新コンディションカード（mypage）・グラフ（気分/体重を追加系列として）にも反映。jscハーネス`dev/test_cond.js`新設・全パス。
  - **✅ステップ⑥完了=staff設定UI（staff/index.html）**: `SK`/`D`に`std`追加、`svSafeUpdate`に4引数目`onError`を追加（trainer方式を移植、既存2引数呼び出しは後方互換）。player/index.htmlの基準エンジンブロック（STD_LIFTS〜getWeakWeeklyVolumeまで）を**バイト一致でstaffへコピー済み**。サイドバーに「基準設定」追加、`nav()`のタイトル辞書に登録。`V.standards`（ポジション別テーブル・ランク閾値・アロメトリック指数・処方箋の編集UI）と`doSaveStd`（バリデーション→confirm→`svSafeUpdate('std',...,return [cfg])`）・`doResetStd`を実装。
    - **テストハーネスの制約を解消**（前回セッションで発見した「入力欄のvalue=プリフィルをテストが読めない」問題）: 原因は`dev/prelude.js`の`mkEl()`が`innerHTML`文字列を子要素としてパースしないこと（実装のバグではなくモックの制約と確定）。`dev/test_std_staff.js`側に`syncValsFromRender(html)`（`id="..."\s+value="..."`の正規表現で描画後HTMLから値を抽出し、モックのgetElementByIdレジストリに反映＝実ブラウザのinnerHTML代入と同じ挙動を模擬）と`renderStd()`（`V.standards()`実行→即syncを1関数化）を追加し、`V.standards`本体は一切変更せずに解決。`dev/test_std_staff.js`**33アサート全パス**（プリフィル・保存・バリデーション・リセット・確認ダイアログ経由・全部）。
    - **実機ブラウザ確認済み**: 本番Firestoreデータに対して「基準設定」画面を表示し、10ポジション×SQ/BP/DL倍率・FFMI/脂肪率帯・ランク閾値・アロメトリック指数・処方箋（弱点種目→推奨補助種目3種×セット/回数/RIR）が正しくプリフィルされることを目視確認。コンソールエラーなし。**「保存」ボタンは実行していない**（本番`std`キーへの書き込みはユーザー未レビューのため意図的に避けた。次回もここは自分から押さないこと）。
  - **✅ステップ⑦完了=トレ実施画面で弱点種目を強調（player/index.html）**: `renderTrainingExec(mn)`冒頭で`getWeakLift(myPid)`から弱点リフト（sq/bp/dl）を判定し、`isWeakEx(r)`（`getWeakWeeklyVolume`と同じ判定式=`r.estBase===weakLift.ph || r.exName===weakLift.label || 処方箋(rx)の種目名に一致`）でその日のメニュー中の各種目が対象かを判定。対象種目のカードにamberの左ボーダー＋グロー（`border-left:3px solid var(--amber);box-shadow:0 0 14px rgba(251,191,36,.16)`）と、種目名の横に`🎯 弱点`バッジ（mystatus画面と同じ`bd bd-a`スタイルで統一）を追加。`dev/test_train_weak.js`新設・**10アサート全パス**（本体種目・処方箋種目の両方にバッジが付く／無関係種目やスキップ済み種目には付かない／スキップ時のopacity等の既存挙動は不変）。**実機ブラウザ確認も完了**（後述、テスト選手アカウントで確認）。
  - **✅ステップ⑧完了=staff選手詳細＋coach個人レポートにランクバッジ・体重帯・コンディション新項目を表示**:
    - **staff（実装・検証・実機確認まで完了）**: `goPlayerDetail`のdt0（基本情報タブ）「サマリー」ボックス直後に`renderStdSummaryHTML(pid)`を新設・呼び出し。BIG3の3種目それぞれのランク（ブロンズ〜ダイヤ・色付き）＋弱点種目には🎯マーカー、推奨体重帯（帯内✓/帯まで+◯kg/帯上限+◯kg超過のbdバッジ）を表示。ポジション未登録・体重データなし・身長未登録・1RM未測定の各欠損はフォールバック文言で対応。`dev/test_staff_pdetail_std.js`新設・**11アサート全パス**。**実機ブラウザで本番データに対して確認済み**（横山衛=体重身長データなし→「(体重なし)」「身長未登録のため推奨体重帯は非表示」のフォールバック表示を確認、瀧田雅公=BP140kg→「ダイヤ」ランク＋推奨体重帯88.4〜105.4kg・現在93kg・帯内✓を確認。コンソールエラーなし）。
    - **coach（実装・検証・実機確認まで完了）**: player/staffと同じ基準エンジンブロック（STD_LIFTS〜getWeakWeeklyVolume）を**バイト一致でcoach/index.htmlへ新規コピー**（3ファイルとも`p===co===s`をPythonで確認済み）。`D`/`SK`に`std`追加（`_allKeys=Object.keys(SK)`駆動の`loadData`が自動的に'std'キーも購読するため配線変更は不要）。`renderStdBadgesCoach(pid)`を新設（staffの`renderStdSummaryHTML`と同じ内容をcoachの配色・カード規約に合わせて再実装。多角レビューで見つかった「ポジション未登録時に無言で消える」不整合をstaffと揃うよう修正済み）し、`renderPlayerReport`のフィジカルカード直後に`h+=rv(renderStdBadgesCoach(pid),2)`で追加。コンディションカードも`mood`/`stress`/`soreness`の平均値（データがある期間のみ）を追加表示するよう拡張（grid g2→g4、既存の平均睡眠/平均疲労度は不変）。`dev/test_coach_report_std.js`新設・**27アサート全パス**。**実機ブラウザで本番データに対して確認済み**（瀧田雅公選手のダイヤランク・帯内✓を確認、コンディション拡張はメモリ上の一時テストレコードで見た目確認＝本番にまだ当該フィールドの記録が無いため）。
  - **✅ステップ⑨完了=最終チェック一式**: player/staff/coach/trainer4ファイルとも構文チェックOK。dev/配下の全jscモック（test_engine/test_dash/test_mystatus/test_ranking/test_cond/test_train_weak/test_std_staff/test_staff_pdetail_std/test_coach_report_std）を再実行し全PASS。基準エンジンブロック（`STD_LIFTS`〜`getWeakWeeklyVolume`）のplayer/staff/coach間バイト一致を再確認。**多角レビュー（8エージェント並列）実施**——正しさ3観点＋CLAUDE.md準拠は問題ゼロ、cleanup系で14件の改善余地を検出し2件を実際に修正（試合日チェック未入力のurgent強調復元／`ALLO_FIELD`の`STD_LIFTS`由来への簡潔化）、残り12件は現規模では実害が小さく見送り＝詳細は上の「🔴次セッションが最初にやること」節を参照。**9ステップ全完了**。デザインはネオン/グロー＋リッチグラデ（既存の`.myphys-card`等のトーンを踏襲）。pushはユーザー確認後に一括で行う。
  - **開発環境メモ（重要・毎回確認）**: 上の「次セッションが最初にやること」節に集約済み（sandbox制約でリポジトリ直下配信は404、scratchpad配下`previewroot/`へのcpコピー方式のみ動作）。
- **✅✅✅✅✅✅ coach「3体レビュー未適用分」の高優先度5件（C1〜C4+U3）実装・push・実機確認すべて完了（2026-07-06・このセッション、コミット`29d7f07`）。** ユーザーが「coach未適用レビューをお願い」と依頼→未適用リストを提示→「高優先度を順番に全部」で着手を承認。plan `4-player-staff-trainer-coach-1-ux-merry-harbor.md`末尾のC1-C4/U3を実装。ユーザーが実機で確認し「問題なかった」と報告。**このタスクは完全に完了。**
  - **C1** ポジション別の頭数×稼働マトリクス（概況タブ）: `positionMatrix()`新設、`injuryStatusMaps()`は`availability()`と共通化。PR/HOはフル稼働3名未満で赤警告(`POS_CRIT_MIN`)。
  - **C2** RTPレベルを「出場可/練習のみ/不可/判断待ち」バケットへ翻訳し概況最上部（稼働率リング）に反映。`rtpBuckets()`新設（旧`availability()`は置き換えて削除＝重複防止）。rtpLevel未設定を「判断待ち」として明確に分離（実データで8名該当と判明＝旧実装では「離脱中」に紛れて見えなかった）。
  - **C3** 滞留レコード検出（`insInjury()`に追加）: 120日超+復帰予定未設定→棚卸し推奨の考察カード。平均離脱期間の算出に`iqrFilter()`(Tukey 1.5×IQR法)を適用し外れ値を除外。
  - **C4** 低入力率への適応（`insCondition()`）: ①連続高RPE判定を「3日連続」→「直近5回の入力中3回以上」に緩和（疎な入力でも検知可能に）②チーム平均睡眠にn数を併記、n<5は「参考値」表記＋lv:infoに格下げ③入力率指標を「当日のみ」→「直近7日カバレッジ」＋最終入力日表示に変更（オオカミ少年化防止）。
  - **U3** オフライン/取得エラー帯: `loadData()`のonSnapshotエラー時に`_errKeys`へ記録→`renderSyncStatus()`が赤帯をtopbar内に表示（正常復帰で自動的に消える）。「更新hh:mm」もtopbarに常時表示。帯の高さ変動に合わせてtabs-barのsticky top位置を実測して追従。
  - **検証方法**: 全項目をJavaScriptCore(`jsc`)でのモック実行（Node.jsが本機にインストールされていないため、`/System/Library/Frameworks/JavaScriptCore.framework/.../jsc`を構文チェック・模擬実行の代替として使用＝今後もnodeが無い場合はこの方法を使うこと）＋実機ブラウザ（本番Firestoreデータ、静的サーバー経由）の両方で確認。コンソールエラーなし。
  - **残作業**: C5〜C8(中/低)・U9(低)・D1残り/D5/D9/D10(デザイン統一系)は未着手。次回ユーザーに続行するか確認すること。
  - **launch.jsonを修正**: 元の`cd && python3 -m http.server`はこのMac環境でgetcwd()がPermissionErrorになり起動不可だった（サンドボックスでプロセスのcwdが取得不能な既知の制約）。`python3 -I -c`で`SimpleHTTPRequestHandler(directory=...)`を直接使う形に変更し解決（`-I`isolated modeが必須＝これが無いとimport時にも同じgetcwdエラーが出る）。次回以降のpreview起動はこの設定のまま使える。
- **ユーザー方針（継続）**: 「実装は全部済ませてから、pushは最後に一気に行う」。ただし単発の小機能はユーザー指示があればその場でpush・実機確認までしてよい。
- **（解決済み）player/index.htmlの`std`キー追加は「player大幅リニューアル」セッションの基準エンジンの一部と判明**: 2026-07-06に別セッションが「孤立した追加」として警戒していたが、上記🚧のとおり本体機能（STD_DEFAULT＋計算関数群）まで実装・検証済みの正当な作業。push対象から除外した判断は当時として正しく、引き続きリニューアル完了時に一括push。
- **✅✅✅✅✅ trainer側「怪我の基本情報編集」解禁＝実装・push・実機確認すべて完了（2026-07-05実装→2026-07-06実機確認、コミット`c6a8cb0`）。** ユーザーが実機で一連の流れ（編集フォーム保存→タイムライン記録→スタッフ通知→変更なし時は保存されない→回復済み/削除は引き続きスタッフ権限）を確認し「問題なかったよ」と報告。**このタスクは完全に完了。**
- **✅✅✅✅ 実機ブラウザ確認＝全項目「問題なし」（2026-07-05・このセッション）。** player/staff/trainer/coach 4サイトの直近の一連の変更（player/staffサイト監査対応、trainerガイド付き評価フロー①〜⑨全体、coach全面リニューアル、怪我×リハビリ連携Phase2不足ゲージ、TimeTree連携フェーズ1pp）を実機でユーザーが確認し、**全て期待通り動作・問題ゼロ**との報告を受けた。これですべてpush済み＋実機確認済み。
- **🔵 次の作業候補（2026-07-06時点）**: ①coachの3体レビュー残り（C5-C8/U9/D1残り・D5・D9・D10。詳細はplanファイル`4-player-staff-trainer-coach-1-ux-merry-harbor.md`末尾）②player監査の残り（1-6/1-9のデッドコード削除、3系＝alert()のトースト化等デザイン全般）。次セッション開始時にユーザーへどちらから着手するか確認すること。
- **（旧・実装ログ）✅ trainer側「怪我の基本情報編集」解禁の実装詳細（2026-07-05・このセッション、trainer単独）**: 発端・ユーザー意向（対象範囲＝基本情報全体、条件＝①スタッフ通知＋②変更履歴記録）は既に確定済みだった設計メモ通り。
  - **実装内容**: スタブだった`goEditInjury(iid)`（[trainer/index.html:427](trainer/index.html:427)付近）を実装に差し替え、`chart-body`に`renderInjuryEditForm(iid)`を描画（呼び出し元2箇所＝概要タブ・復帰タブとも無変更で動作、キャンセル/保存後は`chartTab(curChartTab)`で戻る）。フィールド定義はstaffの`goEditInjury`/`doEditInjury`と同一構成の共有配列`INJ_EDIT_FIELDS`（+`injEditFieldFmt`/`injEditNormVal`）として新設し、差分検出・通知文・タイムライン表示で使い回す。保存は新設`doEditInjuryTrainer(iid,btn)`＝guardSubmit→変更前後を`INJ_EDIT_FIELDS`で比較→変更が1件もなければ「変更点がありませんでした」でリターン（保存しない）→ありなら`inj`へ反映＋`inj.editLog[]`に`{date,by,byId,changes}`を追記→`svRec('i',inj,onDone,onError)`で保存。
  - **①スタッフ通知**: 保存成功時に`escalateChgChk`と同型の`injcomm`投稿（`role:'trainer'`、テキストは変更項目を「field：from→to」で列挙）。ベストエフォート実行＝失敗しても`console.error`のみでメインの保存成功フローは止めない（怪我情報の保存自体は既に成功しているため）。
  - **②変更履歴の記録**: `renderChartTimeline`の`IC`/`C`/`G`辞書に`edit`種別（鉛筆アイコン・スレートグレー）を追加し、`typeOrder`に`edit:1.5`（hospitalとstageの間）を追加。新規ブロックで`inj.editLog[]`から「基本情報編集（実施者名）」イベントを生成しタイムラインに合流（field/from/toはここで初めてescapeHtml、editLog自体は生値を保持＝T1-2と同じ「escapeは描画時1回だけ」の原則を踏襲）。
  - **svRecの拡張**: `svRec(k,rec,onDone,onError)`に第4引数`onError`を追加しsvSafeUpdateへ委譲（既存呼び出し2箇所は2引数のままなので後方互換）。これで保存失敗時にreleaseSubmit＋温存alertが出せるようになった（既存の`svRec`呼び出し元＝`unresolveInj`/`changeStage`系は無改造）。
  - **検証済み**: esprimaで全文構文チェックOK。esprima ASTでtrainer/index.html全体から対象17関数+6定数の正確な範囲を切り出し（自作の中括弧カウント式抽出は文字列中のエスケープでずれるバグがあり、219万字規模のファイルでは信頼できないと判明→ASTベースに切替。二重定義が無いことも同時に確認できた＝並行編集による関数重複事故がないことの裏取り済み）。js2py上にFirestore(runTransaction)・DOM・guardSubmit等をモックした模擬実行で**43アサート全パス**——フォームの選択済み値/その他欄の表示切替/エスケープ、変更なし時は保存せずchartTabに戻る、変更ありは正しいフィールドが反映されeditLog1件・changes件数一致・スタッフ通知テキストに変更内容と実施者名を含む、二重送信ブロック、保存失敗時はボタン復帰+温存alert+ストア未変更、未ログイン拒否、タイムラインに編集イベントが日付順・エスケープ済みで反映、を確認。**実機ブラウザ確認済み（2026-07-06・ユーザー確認「問題なかったよ」）**。
  - **今回のスコープ外（意図的）**: 「回復済みにする」「削除」は引き続きスタッフ権限スタブのまま（T1-3の安全ゲート、ユーザー確認済みで対象外）。staff側の`goEditInjury`/`doEditInjury`は無変更（staffは元々編集可能なので対応不要）。
- **🎉🎉 trainer「ガイド付き評価フロー」9ステップ＝①〜⑨全完走（planファイル`4-player-staff-trainer-coach-1-ux-merry-harbor.md`末尾「実装順序（3体統合・確定案）」参照）。全て実装完了・検証済み・push済み・実機確認済み（2026-07-05に実機確認、上部参照）。以下は各ステップの実装ログ（時系列）。⑨後半のsupervised二層化だけ「凛人がORTHO_SOLO_OKにテスト名を追記して単独可を仕分ける」臨床TODOが残るが、既定＝全テスト監督下で安全に動作する（詳細は⑨のログ参照）。**
- **✅✅ 怪我×リハビリ連携 Phase2「不足ゲージ」完了・検証済み・push済み・実機確認済み（2026-07-05に実機確認、上部参照）。** プラン`/Users/nakayamarinnin/.claude/plans/wise-drifting-moonbeam.md`通りに実装。staff＋trainer両方のカルテ「📊評価」タブ冒頭に、`chart.metrics`(Phase1)の達成率%・「あと◯◯」を**Chart.js不使用の純SVGネオンリング**で可視化（読み取り＋描画のみ・書込ゼロ）。
  - **移植（staffへverbatim・バイト一致）**: `metricEvalRef`/`readEvalMetric`/`latestEvalForMetric`/`symPct`/`metricSeries`/`sparklineSVG`をtrainerから移植（staffの`toggleConcussion`直後に「追跡指標ヘルパー」ブロックとして追加）。
  - **新設（両ファイルにバイト一致で追加）12関数**: `fmtNum`(小数1桁末尾0除去)/`daysBetween`/`latestHealthyForMetric`(健側最新)/`oldestPatientForMetric`(受傷前=最古患側)/`normalForMetric`(EVAL_MASTER.rom引き)/`resolveMetricBase`(基準解決:🎯手動目標→baseMode→フォールバック健側→正常値→受傷前→null)/`gaugeCalc`(達成率+あと◯◯・direction補正・分母0/非有限/null全ガード)/`gaugeColor`(≧90緑/60-89青/<60アンバー)/`gaugeSVG`(円形ネオンリング・弧0-100クランプ・%は実数・drop-shadowグロー・色はCSS変数で両テーマ自動適応)/`renderMMTDots`(MMT段階ドット・最新mmt eval・健側マーカー)/`deficitGaugeCard`(1指標カード)/`renderDeficitGauges`(セクション本体)。**19関数すべてstaff/trainerでバイト一致をdiff確認済み**。
  - **配線**: staff`renderChartEval`(冒頭`renderChartMetrics`の直前に`h+=renderDeficitGauges(iid)`)／trainer`renderChartEval`(脳震盪/禁忌バナー直後・新規評価ボタンの前)。`renderDeficitGauges`は`ch.isConcussion`と`metrics`空で`''`返し。
  - **設計判断**: プランは「グラデ(accent→purple)」を指定していたが、gradientの`stop-color`にCSS変数を使うとブラウザ差でライト/ダーク非適応の恐れ→**リングは実績のある`stroke=var(--色)`単色＋drop-shadowグロー**にし、達成率の色分け(緑/青/アンバー)を優先（既存スパークラインの終点ドット`fill=var()`と同じ実績パターン）。数値差ROM/周径は向き不定なのでスパークラインは`m.direction`基準で色付け（up/down）。
  - **既知の限界（プラン記載どおり温存）**: circ指標(evalKey無し)はstaffフル評価の`ev.circ[名前]`ではなく`fit['m_'+id]`(trainerクイック評価経由)を読む＝Phase1からの既存挙動。e1rm/BIG3自動取込・mmtTargets/romLimit UIはPhase3。
  - **検証済み**: JXA構文チェック両ファイルOK。共有19関数バイト一致確認。JXAモック(`scratchpad/gauge_test.js`)**47アサート全パス**——gaugeCalc全ガード(up/down/分母0/cur0/base0/null/over100 reached)・resolveMetricBase全分岐(target優先/手動baseValue/健側/正常値EVAL_MASTER引き/受傷前oldest/モード失敗→フォールバック/全滅null)・direction=downで反転しない・symPct/normalForMetric/daysBetween/fmtNum・gaugeSVG(75%/null表示—)/gaugeColor帯・renderDeficitGauges(脳震盪''・metrics空''・フル生成でSVG/%/あと/出所ラベル/LSI/期限/MMT・XSS`<script>`無害化・未測定カード・基準未設定カード・oldget到達時「初回値に到達・手動目標推奨」)。実出力HTMLも目視で整形式・値整合を確認。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview不可＝既知の環境制約、方針どおり最後にまとめる）。
  - **ステップ①「実バグバンチ」完了・未push・未実機確認（2026-07-05）：**
  - **T1-1** imgFindings.join crash（staff/trainer同時）: `ch.medical.imgFindings`はtextarea由来の文字列なのに`.join('・')`していた→`Array.isArray`分岐に修正（旧配列データ互換込み）。staff:1784/trainer:1280付近。
  - **T1-2** タイムラインdesc+title二重エスケージ（staff/trainer同時）: 組み立て時に既にescapeHtml済みのdesc/titleを描画時に再度escapeHtmlしタグが文字化けしていた→描画時のescapeHtmlを除去。staff:1868-1869/trainer:1364-1365。組み立て側が全項目escapeHtml済みであることをコード確認済み（SOAP著者名・note・rtpObj等）。
  - **T1-3** trainer「回復済みにする」の`popView()`未定義クラッシュ: AT役指摘の通り、popViewを実装する（＝見習いがワンタップで怪我を回復確定できる危険機能を完成させる）のではなく、`resolveInj`自体を`goEditInjury`/`deleteInjury`と同じstaff権限スタブ（alert）に変更。呼び出し側の`;popView()`も除去。trainer:417,1428。
  - **T1-12** trainer「痛み:undefined/10」表示: `lastLog.pain`（rlogにtop-levelでは存在しない）を参照していた→`lastLog.preCheck&&lastLog.preCheck.pain!=null`に修正。trainer:1079（リハビリ一覧カード）。
  - **T4-5** trainer復帰テストのデッドエンド: テンプレ未設定時に警告のみで戻るボタンが無かった→`goRehabPlayer(injId)`への戻るボタンを追加。trainer:2214付近。
  - **T4-6** trainer段階タイムラインの視認性: ラベル8px→10px、「本日のメニュー未設定」（ホーム画面, 唯一のTo-Do手がかり）を`--text-tertiary`11px→`--amber`太字12pxに変更。trainer:1969-1970,931。
  - **rlogの日付欠損ソートガード**（staff/trainer）: `b.date.localeCompare(a.date)`はdate欠損レコードでTypeError→`(b.date||"").localeCompare(a.date||"")`に統一。正規表現で「rlogをl.injIdでfilterした直後のsort」だけに絞って一括置換（trainer4箇所・staff5箇所、他コレクションのソートは対象外＝スコープ外の変更をしていない）。
  - **検証済み**: JXA構文チェック両ファイルOK。JXAモック12項目全パス（imgFindings文字列/配列両対応・二重エスケージ解消かつタグ意図通り描画・resolveInjスタブがD.iを変更しない・pain undefined解消かつpain=0も表示される・rlogソートがdate欠損でも例外なし）。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview_start不可、既知の環境制約。ローカルサーバー`python3 -m http.server`で次回確認可）。
  - **ステップ②「安全土台の移植」完了・未push・未実機確認（2026-07-05・このセッション）**（trainer単独）:
    - `isFilled`/`guardSubmit`/`releaseSubmit`/`svSafeSeq`をplayerからそのまま移植（trainer:635-680付近）。`svSafeUpdate`に後方互換の第4引数`onError`を追加（player方式と同一、既存3引数呼び出しは挙動不変）。
    - **trDoAddInjury**（怪我+リハビリ登録）: `svSafe`ネスト→`svSafeSeq([i,r])`＋guardSubmit＋失敗時releaseSubmit。ボタンは`trDoAddInjury(this)`。
    - **doSaveRehabLogTrainer**（リハビリ実施記録）: guardSubmit追加。`svSafe`は失敗時にボタン固着するため`svSafeSeq([{k:'rlog',rec:...}])`に変更。ボタン2箇所とも`,this`追加。
    - **doSaveRTest**（復帰テスト結果）: 同様にguardSubmit＋`svSafe`→`svSafeSeq`。
    - **saveTapeRec**（テーピング記録）: guardSubmit＋`svSafeUpdate`の第4引数onErrorで失敗時releaseSubmit。
    - **doTapeSetup**（テーピング枠一括作成）: guardSubmit＋同上。合わせて成功時/キャンセル時の`T.tape()`直呼び2箇所を`go('tape')`に統一（T1-13と共通の理由）。
    - **T1-13**: `showTapeSetupForm`の先頭に`window._subViewActive=true`を追加（サブ画面11関数中これだけ保護漏れだった）。
    - **T1-14**: `SK`定義から`tmenu`/`tlog`/`texlist`/`e1rm`を除外（trainer内で一切読まれないことをgrep確認済み。`ld()`/`startListeners()`は`Object.keys(SK)`駆動なので両方から自動的に購読除外される）。
    - **検証済み**: JXA構文チェックOK。JXAモック18項目全パス（guardSubmit二重ブロック・releaseSubmit復帰・svSafeSeq成功時の順次コミット・svSafeSeq途中失敗時に後続が保存されずonErrorに正しい失敗アイテムが渡る・svSafeUpdateのonErrorでボタンが復帰する・連打で2回目のsvSafeSeqが起動しない、を確認）。**モック実行はJXA(osascript -l JavaScript)の非同期Promise未flush問題を回避するため、実際のFirestore Promiseの代わりに同期thenableで検証**（ロジックは実コードと同一、Promiseの非同期性のみ差し替え）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **ステップ③「即効UX」完了・未push・未実機確認（2026-07-05・このセッション）**（trainer単独）:
    - **T3-1**: `.ipt`のfont-size 13px→16px（iOS強制ズーム対策、trainer:35）。カルテ評価フォームのROM入力(`type="text"`、trainer:1626)に`inputmode="decimal"`を追加。
    - **T3-2**: `.btn-back`のCSS定義を新設（trainer:35付近。従来は未定義でホーム画面の「← ホーム」ボタンが完全に無装飾のプレーンテキストだった。カルテ評価/SOAPの`btn btn-back`は元々`.btn`にフォールバックし正常だったので実害なし・変更不要と確認）。
    - **T4-1**: trainerにログイン永続化を追加（player方式を移植）。`login(tid)`成功時に`localStorage.setItem('rm_my_trainer_id',tid)`、`logout()`で削除。新設`showAutoLoginConfirmT`/`confirmAutoLoginT`/`rejectAutoLoginT`で「あなたは○○さんですか？」の確認画面を経由し、**PINの再入力なしに**ログインできる（player同様、確認タップは必須＝他人の端末で誤って入力される事故を防止）。初期化フロー末尾の`ld().then(...)`で`showLogin()`直呼びだった箇所を、保存済みtrainer_idがあれば`showAutoLoginConfirmT`へ分岐するよう変更。
    - **検証済み**: JXA構文チェックOK。JXAモック17項目全パス（正しいPINでのログイン成功時にlocalStorage保存・誤PINでは保存も遷移もしない・logoutで削除・自動ログイン確認画面は対象トレーナー名を表示するだけでまだログインしない・確認タップでPIN無しログイン成功・「違うトレーナー」で保存クリア＋通常一覧に戻る・保存済みidが不明/削除済みトレーナーでもクラッシュせず通常一覧にフォールバック、を確認）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **ステップ④「安全ゲート」完了・未push・未実機確認（2026-07-05・このセッション）**（trainer単独）:
    - **脳震盪バナー**: `renderChartOverview`（概要タブ、開いて即目に入る場所）と`renderChartEval`（評価タブ）の両方に、`ch.isConcussion`時は「🧠脳震盪として登録されています。数値評価・整形外科的テストの対象外です。GRTP(症状ベース・24時間ルール)で管理してください」の警告バナーを追加（staffの追跡指標タブと同文言）。
    - **評価フォーム差し替え**: `showEvalForm`で`ch.isConcussion`時に整形外科的テスト欄(`em.ortho`。脳震盪SCAT評価/平衡感覚テスト等が「陰性/陽性/疑陽性」の二値プルダウンとして並んでいた)を丸ごと非表示に。頭部は元々ROM/MMT/周径が空配列なのでこれで数値評価系は全滅、残る痛み(pain)・特記症状(special＝頭痛/めまい/吐き気/光過敏/音過敏/集中困難)・所見メモだけで記録する形になる（新データ構造は追加していない。`saveEval`は`.ev-ortho`要素が無ければ空`{}`のまま保存されるだけで安全）。
    - **禁忌情報の表示**: `INJ_TEMPLATES[ch.injType].contra`（ACLのグラフト保護期禁忌等）を概要タブ・評価タブに表示（脳震盪バナーと排他、非脳震盪かつinjType設定済みの時のみ）。`ch.romLimit`は**staff側にも設定UIが一切無く**(Phase3未着手のデータモデルのみ)常に無効値のまま＝今表示しても常に「制限なし」にしかならないため対象外（Phase3でstaffに設定UIができた時に合わせて対応）。
    - **resolveInj**: T1-3で既にstaff権限スタブ化済み（AT役推奨の2案のうち「スタブ化」を採用済み・再対応不要）。
    - **setRtpLevel**: 変更前に`confirm('練習参加レベルを「X」に変更しますか？選手・スタッフ全員に共有されます')`を追加。確定時に`ch.rtpLevelDate`(今日の日付)・`ch.rtpLevelBy`(myTrainer.name)を記録（従来は誰がいつ変えたか一切残らなかった＝T5-2）。
    - **changeStage**: 変更前に進む/戻るで文言を変えたconfirmを追加。確定時に`rh.stageDates[]`(既存)に加え`rh.stageBy[]`（新設、段階indexごとに実施者名を記録）を追加。
    - **staffの同名関数は変更していない**: staffには個人トレーナーIDに相当する識別子（`myTrainer`相当）が存在せず「実施者記録」を意味あるものにできないため、この安全ゲートはtrainer固有の課題として扱った（見習いトレーナーの単独判断への説明責任がT5-1/T5-2の本題）。
    - **検証済み**: JXA構文チェックOK。JXAモック22項目全パス（setRtpLevel/changeStageのキャンセル時は保存されない・確定時に文言とrtpLevelDate/rtpLevelBy/stageDates/stageByが正しく記録される・changeStageの範囲外deltaはconfirmすら出ない・脳震盪時はcontraバナーでなく脳震盪バナーが優先される・非脳震盪時はcontraバナーのみ・injType未設定/未知のinjTypeでもクラッシュせずバナー無し・脳震盪時はortho欄が完全に消える・非脳震盪の膝等は従来通りortho欄が出る）。**残る既知の限界（バグではなく仕様上の前提）**: `isConcussion`フラグ自体はstaffが追跡指標タブでチェックを入れて初めて立つため、フラグを立て忘れた頭部外傷は今まで通りSCATが通常テストとして表示される—根本解消にはT2-1のガイド付きウィザード側で「部位=頭部」なら初期段階で脳震盪確認を挟む設計が必要（今回はplan通りT5対応のみ、ウィザード本体はステップ⑤以降）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **✅ T1-15（preCheckのエスケープ漏れ）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ステップ⑤の前提バグ。`rom-joint`（placeholder「関節名」）・`str-name`（placeholder「測定部位・種目」）・カスタム種目`crit-name`は全てトレーナーの**自由入力**なのでHTMLを含みうるのに、renderRehab/記録履歴の描画で`escapeHtml`が不統一だった（`s.name`だけ2103で既にエスケープ済み、`r.joint`/`e.name`は素通し）。同一関数・同一XSS/表示崩れバグ種別なので「1つ直したら揃える」で6箇所まとめて修正: `r.joint`×3（2102前回評価/2156フォームROMラベル前回値/2210記録履歴）・`e.name`×2（2113前回記録の実施内容/2215記録履歴の未実施側。実施済み側は元々エスケープ済み）・`s.name`×1（2161フォーム筋力ラベル前回値。2103は既済み）。`angle`/`value`は`collectPreCheck`が`parseFloat`+`isNaN`ガードで常に数値なので対象外。検証済み: JXA構文OK＋モックで`<img onerror>`/`膝<b>屈曲`/`ベンチ"プレス<script>`が全て`&lt;`等に無害化され日本語・数値は保持されることを確認。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **✅ ステップ⑤-a「今日の変化チェック（安全ゲート）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ユーザーが「安全ゲートから着手（推奨）」を選択。ステップ⑤の最初の一手として、AT役が最重要とした安全機能（T5-4レッドフラグへの反応ゼロの解決）を先行実装。
    - **配置**: `goRehabPlayer`内、段階タイムラインの直後・前回記録の直前（リハビリ画面を開いて最初に目に入る位置）。3問「前回より痛みが増えた／夜間痛がある／腫れ・熱感が増えた」を はい/いいえ トグルで回答。
    - **中断ゲート**: 全3問回答後にのみ判定を出す（回答途中は「残り◯問」表示で早まった判定を出さない）。全ていいえ→緑「特記事項なし・続けてOK」。1つでもはい→赤「今日は中断してください」＋該当フラグ列挙＋`escalateChgChk`で**ワンタップでスタッフに連絡**（injcomm接続。定型文「⚠️【要確認・実施前チェック】〜。本日のリハビリを中断し、スタッフの指示を仰ぎます。（トレーナー名）」を投稿→スタッフ画面の3者間コメントに即共有）。連絡後は「📨連絡しました・指示があるまで中断」表示に差し替え、画面内のinjcommリストも即更新。
    - **新規関数3つ**（`collectPreCheck`直後）: `setChgChk(key,val,injId)`（回答保存＋はい=赤/いいえ=緑のボタン装飾＋結果エリア再描画）／`renderChgChkGate(injId)`（判定HTML生成・純粋）／`escalateChgChk(injId,btn)`（guardSubmit二重送信ガード＋injcomm投稿＋失敗時releaseSubmit＆温存alert＋未ログイン/空フラグ拒否）。状態は`window._chgChk={pain,night,swell}`（`goRehabPlayer`のセクション描画直前で毎回リセット＝怪我/セッションごとに初期化）。
    - **今回のスコープ外（意図的）**: 記録フォーム本体の保存経路への機械的ブロックは未実装（見習いが誤って進めないよう視覚的に強く誘導する設計に留める）。変化チェック結果のchart.evalsへの保存も未実装（この増分は「気づき→エスカレーション」のMVP。injcommに永続記録は残る）。保存経路統合は後続のクイック評価本体（痛み＋★指標）で対応予定。
    - **検証済み**: JXA構文OK＋モック（`/tmp/chgchk_all.js`、セッション終了で消える一時ファイル）で確認——全null→残り3問／2答→残り1問／回答途中は判定を出さない／全No→緑・escalateボタン無し／1つでもYes→赤＋該当フラグのみ列挙（無関係フラグは出ない）＋escalateボタン／setChgChkがボタン装飾（はい=赤枠/いいえ=緑枠・切替で相互リセット）／escalate正常投稿でinjcomm1件・role=trainer・injId一致・両フラグと著者名入り・成功後resultが連絡済み表示／二重送信ブロック／空フラグ拒否／通信失敗でボタン復帰＋未投稿＋alert／未ログイン拒否。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
  - **✅ ステップ⑤-b「痛み＋★重要指標（クイック評価）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: `chart.metrics`（Phase1でstaffが設定した追跡指標）連動のクイック評価UIを`goRehabPlayer`に新設。
    - **配置/分岐**: `goRehabPlayer`の評価入力ブロックを、`getChart(injId).isConcussion`が**falseならクイック評価カード**（`renderQuickEvalCard`）、**trueなら従来の自由入力式「実施前チェック」**（脳震盪は数値評価対象外なので所見メモ主体・後方互換で温存）に分岐。trainer:2155-2190。
    - **クイック評価カード**: ①評価日 ②痛みレベル（運動時0〜10スライダー・前回値を初期表示だが**動かさない限り保存しない**＝前回値複製事故T4-3の防止／前回比の差分色）③各`chart.metrics`について患側入力＋（`m.lsi`なら）健側入力。前回値はplaceholder＋ラベルにゴースト表示（入力値には入れない）。差分色は`metric.direction`基準（up=増で改善/down=減で改善）。lsi指標は**左右比%を即時表示**（`symPct`＝direction考慮の対称性%・0除算/NaN/Infガード・≧90%緑✓）④メモ。指標未設定の怪我は「スタッフが🎯追跡指標を設定すると並びます」の案内。
    - **保存**: `saveQuickEval`＝guardSubmit＋`_chartIdx`で**操作単位でchart.evalsに新規evalを追記**（他端末のeval/metricsを巻き戻さない）。値のマッピングは`metricEvalRef`：rom(evalKey)→`rec.rom/romH[evalKey]`（文字列）、circ(evalKey)→`rec.circ/circH[evalKey]`（数値）、fitness/strength/evalKey無し→`rec.fit/fitH['m_'+id]`（数値）。痛みは`rec.pain.motion`（既存の痛み推移グラフ・概要「最新痛み」がそのまま読む）。eval id形式は既存`saveEval`と同一（`Date.now()+'_'+rand`）＋`source:'quick'`。空`{}`は書かない（chart肥大抑制）。痛みも指標も未入力ならalertで拒否。
    - **UX**: 保存後は緑の完了サマリー（「痛み○/10 ・ 指標○○ (+差分色)」＋「N項目が前回より改善🎉」）を`qe-result`に表示、ボタン復帰。**同日下書き**をlocalStorage(`rm_qe_<injId>`)に自動保存（入力のたび）・再描画/再訪で復元（別日の放置下書きは無視）・保存成功で削除。
    - **読み手**: 前回値は`latestEvalForMetric`（date→inputAtの2段ソートで最新の患側値を持つevalを探索）／`latestPainVal`（motion優先→全PAIN_TYPESのmax）でchart.evalsから解決。旧rlog.preCheckの「前回の記録」表示は非脳震盪では`preCheck`がnullになるだけで無害（履歴カードは従来通り旧データを表示）。
    - **検証済み**: JXA構文チェックOK＋モック**76アサート全パス**（`scratchpad/qe_mock.js`=42件＝ref/symPct全分岐・latestEvalForMetric/latestPainValのソート・saveQuickEndToEndでrom/circ/fit/健側/痛みmoved有無/未入力alert/strength→fit/連打busyブロック、`scratchpad/qe_render.js`=34件＝renderの各要素/no-metrics案内/ゴースト/lsiチップ/下書き復元（同日のみ）/XSS無害化/qeUpdateMetric・qeUpdatePainのライブ差分色・左右比・movedフラグ）。**実機ブラウザ確認は未実施**（環境制約は上と同じ）。
    - **今回のスコープ外（意図的）**: リハビリ実施記録（種目・rlog保存）は従来通り別ボタンで独立（評価=chart.evals正本／実施=rlogの分離を維持）。ミニスパークライン（プランのネオン見せ場）は未実装。staff側の同UI（フル評価フォームは既存のまま／クイック評価はtrainer固有）は変更なし。To-Doホーム（ステップ⑦）・フルウィザード（⑧）は未着手。
  - **✅ ステップ⑥-a「ミニスパークライン（ネオン見せ場）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ⑤-bのクイック評価カードに、各★指標と痛みの**推移スパークライン**を追加（planの「ネオン演出の見せ場」＝Chart.js不使用の純SVG。`}}}});`括弧地雷を回避）。
    - **新規ヘルパー4関数**（`symPct`直後・trainer:2466付近）: `metricSeries(evals,m)`＝指定metricの患側値を昇順（date→inputAt）で並べた`[{date,v}]`（値なし/空文字eval除外）／`painSeries(evals)`＝痛みを昇順で（motion優先→無ければ全PAIN_TYPESのmax、空pain除外）／`sparklineSVG(pts,direction,idsfx)`＝純SVG生成（**2点未満は''**＝推移不能、**min==maxは中央水平線**、グラデ青→紫＋glow下地polyline＋エリアfill＋終点ドット、`vector-effect="non-scaling-stroke"`で幅一定、`idsfx`は`[^a-zA-Z0-9_]`除去でサニタイズ＝gradient id衝突防止）／`sparkCaption(pts,direction)`＝「N回 ↗/↘/→」（**矢印は数値の増減＝スパークラインの見た目と一致**、色は`direction`基準で良し悪し＝改善緑/悪化赤/横ばい灰）。終点ドット色も同じ良し悪し基準。
    - **配線**: `renderQuickEvalCard`で、痛みブロック直後に痛みスパークライン（direction='down'）／各指標カードの差分行直後に患側値スパークライン（`m.direction`基準、idsfx=`'m'+index`で card内一意）。いずれも**過去evalが2回以上ある時のみ**表示（それ未満は''で何も出ない＝初回はゴースト前回値表示のみ）。ライブ入力(`qeUpdateMetric/qeUpdatePain`)や下書き復元には非干渉（履歴の静的表示のみ、保存経路も不変）。
    - **設計判断（修正1件）**: 初版は矢印を「改善方向」(improved→↗)で出していたが、スパークライン本体は**生の数値**を描くため痛み52→50で「線は下がるのに矢印↗」と視覚が矛盾。**矢印=数値の増減（線と一致）・色=良し悪し**に統一（`sparkCaption`の`arrow=last>first?'↗':'↘'`）。
    - **検証済み**: JXA構文チェックOK＋モック**31アサート全パス**（`scratchpad/spark_mock.js`=20件＝metricSeries昇順/同日2件保持/空欠損除外・circ/fit格納先追跡・painSeries motion優先/max/除外・sparklineSVG空1点で''/2点でsvg/direction別終点色（up改善緑・down改善緑・悪化赤）/横ばい青/idsfxサニタイズ/NaN除外/多点、sparkCaption 空1点''/矢印数値方向＋色良し悪しの全組合せ、`scratchpad/qe_render_spark.js`=11件＝renderQuickEvalCard実行でsvg4本（痛み+指標3）・caption4本・↗↘両方・LSI健側欄・保存ボタン配線）＋生成SVGマークアップを目視確認（整形式・値90→95→100→105が右肩上がり・終点緑）。**実機ブラウザ確認は未実施**（sandbox getcwd制約でpreview不可＝既知の環境制約、方針通り最後にまとめる）。
    - **今回のスコープ外**: ⑥のもう半分「preCheck一本化の仕上げ」（履歴カードの読み手をevalsへ移行）は未着手＝旧rlog.preCheck表示は非脳震盪で無害に温存のまま。次はこれ、または⑦To-Doホーム。
  - **✅ ステップ⑥-b「preCheck一本化の仕上げ（履歴カードの読み手をevalsへ）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: `goRehabPlayer`内の2箇所（①「📋前回の記録」カードの「評価」欄／②「記録履歴」の各ログカードの評価行）を、**非脳震盪の怪我では`lastLog.preCheck`ではなく同日の`chart.evals`（クイック評価で保存されたデータ）を参照するよう変更**。⑤-bでクイック評価に切り替えて以降、非脳震盪の新規rlogは`preCheck`が常にnull（`collectPreCheck`は`window._preCheckOpen`必須＝脳震盪画面のトグルでしか立たない）になり、この2箇所の「評価」表示が黙って空になっていた回帰を解消。脳震盪の怪我は従来通り`preCheck`のみを参照（分岐変更なし・後方互換）。
    - **配線**: `var _qch=getChart(injId)`を関数冒頭（`rh`取得直後）に移動して両カードから参照可能に（従来はクイック評価入力ブロックの直前でのみ宣言）。新設ヘルパー4つ（`metricEvalRef`の直後）：`sameDayEval(evals,date)`（同日eval群からinputAt降順で最新1件、無ければnull）／`evalPainVal(ev)`（pain.motion）／`evalMetricVals(ch,ev)`（`ch.metrics`のうちevに値がある指標だけ{name,unit,val}で返す）。
    - **「📋前回の記録」カード**: `_qch.isConcussion`なら旧preCheck表示（無変更）、そうでなければ`sameDayEval(_qch.evals,lastLog.date)`で同日クイック評価を探し、あれば「評価（クイック評価）」ボックス（痛み+各指標+メモ）を表示。同日評価が無ければ何も出さない（従来のif(lastLog.preCheck)と同じ「無ければ非表示」の挙動を維持）。
    - **「記録履歴」カード**: 同様に脳震盪はpreCheck、非脳震盪は`sameDayEval`でそのログの日付と同じ日のクイック評価を探して「痛み:X/10 指標名:値単位」の1行を表示（見つからなければ何も出さない＝rlog自体は従来通り表示される）。
    - **今回のスコープ外（意図的）**: rlogとchart.evalsの紐付けは「同じ日付」でのマッチのみ（1日に複数回リハビリを実施し複数回評価した場合、記録履歴カード側は最新の1件のみ表示）。異なる日にクイック評価だけ単独で記録された場合（rlogを保存していない日）はこの2箇所には出ない（クイック評価カード自体のスパークライン/前回値表示で確認可能なため許容）。
    - **検証済み**: JXA構文チェックOK（全文new Function()パース）。ヘルパー4関数を抽出したモック(`scratchpad/eval_mock_test.js`、セッション終了で消える一時ファイル)で**12アサート全パス**——同日に複数評価があれば最新(inputAt)を採用／該当日なしはnull／前回の記録・記録履歴カードとも評価なし日はブロックを出さない／記録履歴カードの行組み立てが期待通り（"痛み:2/10 膝伸展:120° 外果周径:32.5cm"）／脳震盪チャートはevalsが存在してもpreCheck経路のみを通りevals経路には行かない（分岐の排他性）／指標名・単位のHTMLエスケープ。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
  - **✅ ステップ⑦「To-Doドリブンホーム（バッジ1個ルール）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: プラン確定版の項目8「To-Doバッジは1カード1個（最優先のみ）」を実装。ホームの「🩹担当リハビリ選手」カードの下段（従来は`tomorrowCats`チップ or「本日のメニュー未設定」テキストのみ）を、優先度付きバッジ1個に統一。
    - **新規ヘルパー2つ**（`tapeSlotBooked`直後・trainer:942付近）: `trTodoBadge(inj)`＝優先順位🔴(脳震盪/レッドフラグ未対応/評価空きすぎ14日+)→🟡(評価期限7日+)→🔵(本日メニュー未設定)→🟣(復帰テスト目前=stage フルコンタクトかつrtest未実施)→🟢(今日は記録済み)で最初に該当した1件のみ`{rank,cls,emoji,label,action}`を返す（該当なしはnull）。`action`は`'chart'|'menu'|'rtest'|'rehab'`のタグのみ保持（関数参照を直接持たせない設計、onclick文字列に安全に埋め込める）。`trBadgeGo(action,injId)`＝タグから実画面へ遷移するディスパッチャ（chart→`openChart`／menu→`goSetNextMenuT`／rtest→`goRTestRecord`／既定→`goRehabPlayer`）。
    - **レッドフラグ判定**: ステップ⑤-aで実装済みの`escalateChgChk`投稿（injcommに`role:'trainer'`＋text先頭`'⚠️【要確認・実施前チェック】'`で保存）を利用。**そのinjIdの最新injcommが上記の形のトレーナー発メッセージのままなら「未対応」と判定**（スタッフ/選手からの返信が1件でも後に付けば自動的に解除される。永続の解決済みフラグを新設していない＝既存データ構造のみで成立）。
    - **評価空き日数**: `getChart(inj.id).evals`の最新`date`（無ければ受傷日`inj.date`）から`todayStr()`までの日数。14日以上=🔴「評価が◯日空いています」、7〜13日=🟡「評価期限：前回から◯日」。
    - **復帰テスト目前**: `D.r`の`stage===STG.length-2`（＝フルコンタクト、次が完全復帰）かつ`D.rtest`に該当injIdの記録が1件も無い場合のみ🟣（既存の「🏁復帰テスト状況」セクションは`rtest`が1件でもあれば表示される別枠なので、バッジ側は「まだテストを始めていない」段階だけを補完し重複しない）。
    - **並び替え**: 担当リハビリ選手一覧を`badge.rank`昇順（同rankは受傷日降順）でソートしてから描画＝プラン「レッドフラグ最優先」を一覧の並び自体でも実現（従来はDフィルタ順のまま無秩序だった）。
    - **タップ導線**: カード全体は従来通り`goRehabPlayer`（onclick）。バッジ自体は`event.stopPropagation()`＋`trBadgeGo(action,injId)`で**該当アクション画面に直行**（🧠→カルテ概要／📋→次回メニュー設定フォーム／🏁→復帰テスト記録画面／それ以外→リハビリ画面、はカード全体と同じ遷移だが明示的に同じ関数を通す）。
    - **バッジ無し時のフォールバック**: メニュー設定済み・復帰テスト該当なし・本日未記録の「平常運転」ケースは従来通り`tomorrowCats`チップ表示に戻す（情報損失なし）。
    - **検証済み**: JXA構文チェックOK（全文new Function()パース）。`trTodoBadge`/`trBadgeGo`を抽出したモック(`scratchpad/mock_todo_badge.js`、セッション終了で消える一時ファイル)で**15アサート全パス**——脳震盪最優先／レッドフラグ未対応の検知＋スタッフ返信後の解除／評価空き14日以上で赤・7〜13日で黄（日数計算含む）／メニュー未設定で青／フルコンタクト+rtest未実施で紫／rtest実施済みなら紫を出さず今日記録済みなら緑／全部該当なしはnull／ディスパッチャが4種のアクションタグを正しい関数に振り分け／rank昇順ソート。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
    - **今回のスコープ外（意図的）**: リハビリ管理タブ（一覧・検索付き、trainer:1155付近）の同種カードには今回バッジを適用していない（ホームのTo-Doドリブン化がプランの主眼のため。適用するなら`trTodoBadge`はそのまま再利用可能）。
  - **✅ T1-8（実施記録の種目名をDOMのstyle属性で拾っている）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ステップ⑧「フル評価セクション型ウィザード」着手前の前提修正（プラン記載通り）。`doSaveRehabLogTrainer`(trainer:2972)が`exDiv.querySelector('span[style*="font-size:13px"]')`/`span[style*="border-radius:99px"]'`で種目名・カテゴリをDOMから拾っており、**見た目のフォントサイズを1つ変えるだけで種目名が静かに空文字保存になる**危険な状態だった。修正: 種目行`#rl-ex-{ei}`の外側divに`data-name`/`data-cat`属性（escapeHtml済み値）を追加し、保存関数側は`exDiv.dataset.name`/`exDiv.dataset.cat`を読むだけに変更（querySelectorを完全廃止）。**検証済み**: JXA構文チェックOK。ロジックのみのモック(`scratchpad/mock_t18.js`)4アサート全パス（正常系の名前/カテゴリ取得・要素なしでもクラッシュせず空文字・escapeHtml書込→dataset読取のラウンドトリップで特殊文字が壊れないこと）。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
    - **副次発見（今回はスコープ外・spawn_taskで別途フラグ済み）**: staff/index.html(4462-4469)の同名機能（研修記録保存）にも全く同じパターンの脆弱なquerySelector-by-styleがある。trainer専用のT1-8としてplanに載っていたため今回はtrainerのみ修正。別タスクとして切り出し済み（task_1557b0c2）。
  - **✅ ステップ⑧-a「フル評価セクション型ウィザード（骨組み）」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: カルテ「📊評価」タブの「＋新しい評価を記録する」で開くフル評価フォーム（`showEvalForm`）を、平坦な1画面フォームから**セクション型ウィザード**に全面書き換え。見習いが「何から・どの順で入力するか」で迷わないための誘導UI。
    - **順序変更（プラン項目4）**: 旧`痛み→ROM→MMT→周径→テスト→症状→所見`を、臨床の侵襲が少ない順`①痛み→②周径(腫脹)→③ROM→④筋力→⑤テスト→⑥症状→⑦所見`に。周径をROM前に出したのは「その日どこまで押してよいか」の判断材料になるため。**部位に応じて動的生成**（該当項目がある部位だけ並ぶ＝膝は7セクション、頭部/脳震盪は痛み/症状/所見の3セクションのみ・テスト非表示）。
    - **UI**: `chart-body`上部に**sticky進捗チップ**（番号+ラベルの横スクロール行。`top`はアプリ`.header`高さを実測して設定、z-index50で既存ヘッダー[z100]の直下に固定）＋**アコーディオン式セクション**（アクティブ1つだけ展開、他は折り畳み。ヘッダー/チップどちらのタップでも`evGoSec(i)`で移動）。各非最終セクションに「次へ▶」ボタン＝自動スクロール。保存ボタンは常時最下部に到達可能。
    - **状態不滅の肝**: `evGoSec(n,noScroll)`は**再描画せず`display`トグルのみ**＝折り畳み中のセクションも入力DOMが生きたまま（`saveEval`の`querySelectorAll('.ev-*')`はdisplay:none要素も拾えるので全項目保存される）。チップは`i<n`=done(✓緑)/`i===n`=active(青)/`i>n`=future(muted)で進捗表示。初期化は`setTimeout(30ms)`で`evGoSec(0,true)`＝ジャンプ抑止。新規追加関数は`evGoSec`のみ（`showEvalForm`直後、trainer:1812）。
    - **guardSubmit移植（プラン項目10の前提）**: `saveEval`に第3引数`btn`を追加、`svSafeUpdate`直前に`guardSubmit`、失敗時は第4引数`onError`で`releaseSubmit`＋温存alert。保存ボタンは`saveEval(iid,evalId,this)`で`this`を渡す（**guardSubmitはbtn無しだとfalseを返し保存中断するので、呼び出し側は必ずthisを渡すこと**）。連打複製（新規evalは毎回別idでpushされ複製される）を解消。
    - **⑤-bクイック評価との棲み分け**: クイック評価（`renderQuickEvalCard`、goRehabPlayer内）=日次の痛み+★指標。フル評価（`showEvalForm`、カルテ評価タブ）=週1の全項目再評価。両者は別物・別画面のまま（今回はフル評価のみ改修、クイック評価は無変更）。
    - **今回のスコープ外（意図的・⑧-b以降）**: 各項目の**前回値ゴースト表示＋direction基準の差分色**（フル評価のem.rom[].k/em.mmt/em.circキーはクイック評価の★metric.idとは別体系なので専用の前回値解決ヘルパーが要る）／ミニスパークライン／完了サマリー演出は未実装。整形テストの**二層化(supervised)タグ＋「未実施」明示選択肢**とSOAP自動下書きは**ステップ⑨**（テスト欄には「自信がなければ空欄=未実施のまま/迷ったらスタッフへ」の注意文だけ先行追加済み）。
    - **検証済み**: JavaScriptCoreパースOK（script全文`new Function`）。括弧バランスはHEADと完全同一（既知の正規表現リテラル誤検知＝私の変更由来でないことを確認）。抽出モック(`scratchpad/harness.js`、セッション終了で消える一時ファイル)で**40アサート全パス**——膝ACLで7セクション正順生成/脳震盪頭部は3セクション&テスト非表示&脳震盪バナー/編集モードで痛み・ROM・メモ全プリフィル&保存ボタンが`saveEval(3,'e1',this)`/禁忌バナー表示/`evGoSec`が表示を1セクションに絞る&done/active/futureチップ&chev▾▸&scrollTo有無(noScroll)&範囲外クランプ/`saveEval`のguardSubmitが連打・btn無しをブロック&onErrorでbtn復帰+温存alert&onDoneでchartTab('eval')。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview不可＝既知の環境制約、方針通り最後にまとめる）。
  - **✅ ステップ⑧-b「フル評価の前回値ゴースト＋差分色＋スパークライン＋完了サマリー」完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ⑧-aで骨組み化した`showEvalForm`の各数値セクション（痛み/周径/ROM/筋力）に、⑤-b譲りの前回値ゴースト・ライブ差分・ミニスパークラインを展開。
    - **direction（良し悪し）の扱いが肝**: EVAL_MASTERのrom/mmt/circには`direction`が無く、しかも`膝伸展 normal:0`・`腰前屈 normal:指床間(cm)`・周径（腫脹↔筋萎縮）など**向きが部位で反転しうる**。この体系で良し悪しを断定するのは臨床的に危険（⑤-bクイック評価が良し悪し色を出せるのはstaffが指標ごとに`direction`を明示設定しているから）。→**痛み(一律down=少ないほど良い)・筋力MMT(一律up=強いほど良い・順序型)だけ緑赤で改善/悪化を色分け**し、**ROM・周径は良し悪しを断定せず数値差＋矢印のみニュートラル（灰色）**表示にした。
    - **共有ヘルパー拡張**（後方互換）: `sparklineSVG`/`sparkCaption`に`direction==='none'`分岐を追加＝終点ドット・キャプション色を常にニュートラル（青/灰）に。⑤-bは'up'/'down'しか渡さないので挙動不変。
    - **新規ヘルパー5つ**（`evGoSec`直後・saveEvalの直前）: `evPrevVal(evals,kind,key,excludeId)`＝編集中evalを除いた直近の生値{v,date}（date→inputAt降順探索、空文字スキップ）／`evSeriesFull(evals,kind,key)`＝昇順の数値時系列（mmtは`MMT_ORDER` index、他parseFloat、非数値除外）＝スパークライン用／`evLiveDiff(el)`＝入力のたびdata-*（prev/dir/unit/ord/diff）から前回比を表示（`data-dir='none'`は灰色数値のみ・`data-ord='1'`はMMT段数差）／`evImprovementSummary(evals,entered,excludeId)`＝**痛み・筋力だけ**を対象に改善数集計（ROM/周径は向き不定なので数えない）／`showEvalSavedBanner(html)`＝評価タブ先頭に緑バナーを差し込み4.5秒でフェードアウト。
    - **フォーム改修**: `showEvalForm`の4セクション（PAIN_TYPES/em.circ/em.rom/em.mmt）を、各フィールドにラベル内ゴースト（前回値）＋input（data-prev/dir/unit/diff＋oninput/onchange=evLiveDiff）＋差分span（`evd-<kind>-<i>`）＋過去2回以上あればスパークライン、を並べる形に。既存の保存経路（`.ev-pain`等のclass/data-k）は不変＝`saveEval`は無改造で全項目拾える。
    - **完了サマリー**: `saveEval`でguardSubmit前に`evImprovementSummary`を計算（保存前の直近evalと今回入力を比較、編集時は自身除外）→onDoneで`chartTab('eval')`後に`showEvalSavedBanner('✅ 評価を保存しました'＋改善あれば「痛み・筋力で N項目が前回より改善🎉」)`。
    - **検証済み**: JavaScriptCoreパースOK（script全文`new Function`）。抽出モック2本全パス——`scratchpad/test_8b_full.js`=**35アサート**（evPrevVal最新/編集除外/空文字スキップ/欠損null・evSeriesFull昇順/mmt index/非数値除外・evImprovementSummaryが痛みdown/筋力upのみ集計しROM/circは数えない＋編集除外＋前回なしtotal0・sparklineSVG/sparkCaptionのnone=ニュートラル色/up増=緑/down減=緑/2点未満空・evLiveDiffの痛み改善緑/悪化赤/ROMニュートラル無判定/MMT段数差改善/前回なし空/±0）、`scratchpad/test_render_8b_full.js`=**18アサート**（膝ACLで`showEvalForm`が例外なく完走・前回ゴースト4種・差分span id 4種・スパークライン4本以上・oninput/onchange配線・禁忌バナー・保存ボタン`saveEval(1,null,this)`・data-dir none/down/ord=1）。**実機ブラウザ確認は未実施**（このMacのsandbox制約でpreview不可＝既知の環境制約、方針通り最後にまとめる）。
    - **今回のスコープ外（意図的）**: 健側入力欄（`.ev-romH`等）はフル評価フォームにはまだ無い（⑤-bクイック評価側のLSI用。フル評価での健側UIは未実装のまま＝saveEvalは空収集で無害）。整形テスト欄の差分表示は非対象（二値判定＝⑨のsupervised二層化で扱う）。
  - **✅ ステップ⑨（前半＝非臨床の安全部分）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ⑨の2要素のうち「saveSOAP操作単位化」と「SOAP自動下書き（O欄限定）」を実装。臨床コンテンツ判断が要る「テストガイド二層化(supervisedタグ)」は**凛人と要相談のため未着手**（下記）。
    - **saveSOAP/delSOAP 操作単位化＋guardSubmit**: 従来は`saveChart(ch)`＝chart全体をserver-latestに上書き（同一injId内ロストアップデートの火種＝staff監査S1-3/Phase0で潰した系統の最後の残り）。`saveEval`/`delEval`と同型に書き換え——`svSafeUpdate`＋`_chartIdx`で**server-latestの対象injIdの`soaps`だけ**を触る（他端末のeval/metrics追加を巻き戻さない）。`saveSOAP`にguardSubmit（連打複製防止）＋失敗時onErrorでreleaseSubmit＆温存alertを追加、ボタンは`saveSOAP(iid,soapId,this)`。編集時は`Object.assign(rec,data)`でid保持のまま更新（複製しない）。
    - **SOAP自動下書き（O欄限定）**: 新規SOAP時のみ、`buildSOAPObjectiveDraft(iid)`が**直近evalのpain/rom/mmt/circを整形した文字列**（例「【2026-06-20の評価より】運動時痛4/10、屈曲115°、伸展 MMT4-、膝蓋骨上5cm 39cm。」）を生成→O欄の下に「📥 直近の評価から下書きを挿入」ボタン＋プレビュー表示。`insertSOAPDraft(iid)`は空なら差し込み・既記入なら末尾追記（トレーナーが自由に編集＝あくまで下書き。**測定済み数値の整形のみで臨床判断は一切加えない**＝plan「SOAP自動下書きはO欄限定」に忠実、A/P欄には触れない）。直近evalが無ければボタンごと非表示。
    - **検証済み**: JavaScriptCoreパースOK。抽出モック(`scratchpad/test_soap_full.js`)で**23アサート全パス**——buildSOAPObjectiveDraftが最新eval(e2)採用/pain(motion/press)/rom/mmt/circの整形/末尾「。」/eval無しで''・insertSOAPDraftの空差し込み＆既存追記・saveSOAP新規が既存soapを残して追記かつ**evals不干渉**（操作単位）＆tab遷移・**サーバー側で並行追加されたevalがsaveSOAPで消えない**・編集はid保持で複製しない・guardSubmit連打ブロック・delSOAPが対象だけ削除しevals/他soap温存。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
  - **✅ ステップ⑨（後半＝supervised二層化・安全側の既定で構造実装）完了・検証済み・未push（2026-07-05・このセッション、trainer単独）**: ユーザーが「安全側の既定で先に構造だけ実装」を選択（＝どのテストが単独可かの臨床仕分けは凛人が後から）。
    - **新規定数＋ヘルパー**（EVAL_MASTER直後・trainer:417付近）: `var ORTHO_SOLO_OK={}`（空＝**全整形外科的テストが「監督下推奨」の初期状態**）＋`orthoIsSupervised(name){return !ORTHO_SOLO_OK[name];}`。凛人が「見習い単独で確定判定してよい」と決めたテスト名を`ORTHO_SOLO_OK`に`'Neerテスト':true`の形で追記すると、**そのテストだけ🔒バッジが外れる**。テスト名はEVAL_MASTERの各部位`ortho[]`文字列と完全一致必須（コメントに明記）。臨床コンテンツなので中身は空のまま＝勝手に確定していない。
    - **UI**（`showEvalForm`のテストセクション）: 各orthoテストのラベル横に`orthoIsSupervised`がtrueなら`🔒 監督下`のアンバーバッジ。セクション冒頭の注意書きを「🔒監督下のテストは有資格スタッフ立ち会いのもと実施・判定／自信がなければ『未実施』のままでOK／迷ったらスタッフへ」に更新。select先頭の空選択肢を`-`→**`未実施`**に明示リネーム（plan「『未実施』明示選択肢」に対応。value=""は不変＝`saveEval`の`if(e.value!=='')`で従来通り保存されない＝データ挙動は完全不変）。
    - **検証済み**: JavaScriptCoreパースOK。抽出レンダーmock(`scratchpad/test_ortho_full.js`)で**5アサート全パス**——既定で膝の2テスト両方に🔒バッジ／空選択肢が「未実施」表記／`ORTHO_SOLO_OK={'Lachmanテスト':true}`にすると🔒バッジが1個に減りLachmanから外れMcMurrayには残る（バッジ数は`🔒 監督下</span>`で数え、注意書き見出しの同文言と区別）。**実機ブラウザ確認は未実施**（環境制約は他ステップと同じ）。
    - **凛人へのTODO（臨床仕分け・コード変更は不要、定数追記だけ）**: `trainer/index.html`の`ORTHO_SOLO_OK`に、見習いが単独で確定判定してよいテストを追記していく（既定は全て監督下＝安全側）。EVAL_MASTERのortho一覧が対象。**staff側の評価フォームには未反映**（trainer固有UXとして実装。必要ならstaffにも同定数・同バッジを横展開可能だが、staffは有資格者が使う想定なので優先度低）。
  - **🎉 trainer「ガイド付き評価フロー」9ステップ＝全完走（①〜⑨すべて実装完了・検証済み・未push）。** ユーザー要望「見習いが評価で何を・どの順で入力するか分からない状態のサポート」に対する一連の実装が完了。残りは実機ブラウザ確認とpush（方針通り最後にまとめる）。
  - **次の候補（こちらの判断で選んでよい）**: player 3系デザイン（alert()トースト化等）／coachレビュー未適用分（C1〜C8・U3/U9・D1〜D10）／4サイト共通デッドコード削除（1-6/1-9）／怪我×リハビリ連携Phase2（不足ゲージ）。または実機確認＋push（ユーザー判断）。
- **player監査の「実行可能な項目」は事実上完了**: 1-2/2-1・1-5・2-2・1-8・2-6・2-8・2-9・2-11が完了済み（すべて未push・未実機確認、詳細は下の個別ログ）。残る1-7（ヘルパー複製の乖離）は具体的な修正アクションのない設計上の注意点なので単独タスクとしては見送り。1-6/1-9（デッドコード削除）は4サイト監査完了後にまとめる方針、3系（デザイン全般）は別途着手判断が必要。
- **次の選択肢（優先度つき、こちらの判断で選んでよい）**:
  1. staff/trainer側の同種監査項目の実装（staff監査・trainer監査は完了済みだが実装は未着手。特にtrainer「ガイド付き評価フロー」は前々からユーザー期待度が高い保留タスク＝優先候補）。
  2. 4サイト共通のデッドコード削除（1-6/1-9）をここでまとめて着手。
  3. player 3系（デザイン全般、alert()のトースト化等）。
  4. coach全面リニューアル分（未push・詳細下記）をこのタイミングで一緒にpush対象へ含めるかの整理（pushは最後なので判断だけ先にしておくと良い）。
  5. 保留中の別プロジェクト（怪我×リハビリ連携Phase2＝不足ゲージ、TimeTree連携フェーズ1）も選択肢に入る。
- **2-11（オフライン時は「読み込みエラー」で全滅）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 対応方針（監査時点で確定済みの方針通り）: 保存は全て`db.runTransaction`経由でオフラインでは実行できないため、書込はオンライン必須のまま維持。**enablePersistenceは「閲覧の生存性」目的に限定**して導入。
  - 修正: ファイル末尾の`ld().then(...)`（初期化処理）の直前に`db.enablePersistence().catch(function(e){console.log(...)})`を追加。マルチタブ('failed-precondition')や非対応ブラウザ('unimplemented')では静かに無効のまま通常動作を続ける（エラーを握りつぶして処理続行、他の初期化を止めない）。
  - 副次対応: 「失敗時の入力温存メッセージを全フォームに展開する」の残タスクを洗い出した結果、主要な入力フォーム(condition/phys/bronco/bodycomp/match/weekcheck/rehab/absence/tape/injury/編集系)は既にPhase1〜1-4で対応済みと確認。唯一未対応だった`doPhysSkipWithReason`（測定なし申告）だけが素の`svSafe`(guardSubmit無し・失敗時の温存メッセージ無し)のままだったため、他フォームと同じ`guardSubmit`+`svSafeSeq`+失敗時`releaseSubmit`＆温存メッセージのパターンに合わせて修正。ボタンのonclickも`doPhysSkipWithReason(this)`に変更。
  - 検証済み: JXA構文チェックOK。`doPhysSkipWithReason`をモック実行(`/private/tmp/.../scratchpad/run_mock_2_11.js`、セッション終了で消える一時ファイル)で6項目全パス——通常申告で保存・連打は2回目がブロックされる・保存失敗でボタン復帰＆温存メッセージ・同日申告済みなら二重保存しない。`enablePersistence`自体はFirestore標準API呼び出し1行（実ブラウザでのみ効果を体感できる領域）のため、配置がld()より前であることの確認とJXA構文チェックで担保。
- **2-9（ラベルの不統一）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - フィジカル測定系の表記ゆれ3箇所を「フィジカル測定」に統一: mypageカード(1035行、旧「記録入力」)／遷移先タイトル(1172行、旧「フィジカル記録」)／説明文中の案内(1117行、旧「フィジカル記録」から入力）。homeの文言(866行、元々「フィジカル測定」)に合わせた形。コメント(1555行)も表記統一。**フォーム自体の見出し「📝 記録入力」(1324行)は一覧画面と実入力フォームを画面上で区別する意図があるため意図的に変更していない**（一覧タイトルと入力フォーム見出しが同じ文字列だと二重表示で紛らわしくなるため）。
  - ヘッダーの「選手切替」ボタン(93行)を「ログアウト」に変更。押下時の確認文言は元々「ログアウトしますか？\n次回ログインにはPINが必要です」で、`logout()`の実処理も`myPid`クリア＋PIN再入力必須という**完全なログアウト**だったため、ボタンラベルを実態に合わせた（「切替」という軽い言葉で押すと、実際には再ログインが必要になり驚く、という迷いを解消）。
  - 検証済み: JXA構文チェックOK。純粋な文言差し替えのみ(ロジック変更なし)のため、grepで対象文字列が全て置き換わったこと・意図的に残した1324行以外に旧表記が残っていないことを確認。
- **2-8（未読通知に気づく導線がmypage内バッジのみ）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 原因: 未読お知らせ・怪我承認通知の🔔バッジ(889行)はmypageを開かないと見えず、home/トレーニング等にいる限り気づけなかった。
  - 修正: 下部ナビ「マイページ」のアイコンに赤い小さいドット(`.nav-dot`、CSS新設)を追加。`updateNavBadge()`を新設し、mypageの🔔バッジと**全く同じ集計式**(`D.ann`の自分宛未読＋`D.i`の`notifyPlayer`true件数)で有無だけを判定して表示/非表示を切り替える。呼び出しタイミングは2箇所: ①`go(tab)`の最後（どのタブへ移動しても最新化）②`startListeners`のonSnapshotで`ann`/`i`キーが変化した時（**タブ移動しなくても他人の操作でリアルタイムに気づける**のが今回の主眼。入力中フォームの保護対象外＝ドットの更新は入力内容に一切触れないため無条件で実行）。
  - 検証済み: JXA構文チェックOK。実ファイルから`updateNavBadge`/`idEq`を抽出したモック(`/private/tmp/.../scratchpad/run_mock_2_8.js`、セッション終了で消える一時ファイル)で8項目全パス——未読お知らせ/怪我承認通知それぞれの表示/非表示切替・既読済みは非表示・他人宛は無視・myPid未設定(ログイン前)は常に非表示・dot要素が無いページでも例外にならない、を確認。**視覚的な見た目（ドットの位置・サイズ）は実機ブラウザでの確認が必要**（このMacのsandbox制約でpreview_start・ローカルサーバー経由のブラウザ自動確認は不可、既知の環境制約）。
- **2-6（同日重複レコード防止）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 原因: `doCondition`/`doPhys`は同日の既存レコードをチェックせず送信するとそのまま新規保存していた（「✅本日入力済み」表示はあるが送信は素通り）。
  - 修正: 両関数の冒頭（バリデーション直後・guardSubmitより前）に同日重複チェックを追加。`D.f`/`D.ph`から`idEq(r.pid,myPid)&&r.date===dateV`で既存レコードを検索し、あれば`confirm()`で「修正画面を開きますか？」と確認→OKなら`showEditCondition`/`showEditPhysRec`に誘導して新規保存はしない、キャンセルなら何もしない（guardSubmitを通していないのでボタンは何も変化せず、そのまま再入力・再送信も可能）。
  - 副次発見・同時修正: `showEditCondition(fid)`/`showEditPhysRec(phid)`の検索が`r.id===fid`という厳密比較のみだった。しかしmypage(1015行)の「修正」ボタンはonclick文字列に`\''+id+'\'`と埋め込まれるため実際には**文字列型のidが渡る**のに対し、レコードのidは`newId()`由来の数値型＝**型不一致で一致せず、修正ボタンが常に無反応（無言で何も起きない）という既存バグ**だった。`delCondition`等の削除系は元々`String(r.id)===String(fid)`のフォールバックがあり無事だったが、修正系だけ漏れていた。これでは今回追加した「確認→修正画面へ」の誘導自体も機能しないため、`delCondition`と同じ`||String(r.id)===String(fid)`フォールバックを両関数に追加して合わせて解消。
  - 検証済み: JXA構文チェックOK。実ファイルから対象関数(`doCondition`/`doPhys`/`isFilled`/`guardSubmit`/`releaseSubmit`/`idEq`/`newId`/`fmt`/`todayStr`/`getCurrentMSess`/`broncoFromInputs`/`getBest`)をPythonでbrace抽出しJXA上でモック実行(`/private/tmp/.../scratchpad/run_mock_2_6.js`、セッション終了で消える一時ファイル)、14項目全パス——同日記録なしは通常通り新規保存／同日記録あり+OKは修正誘導かつ新規保存されない／同日記録あり+キャンセルは何もしない／他選手の同日記録とは混同しない、をcondition・phys両方で確認。加えてshowEditCondition/showEditPhysRecの型不一致修正も、文字列id・数値idどちらで呼んでも一致することを別途確認。
- **1-8（onSnapshot/ldのparsed検証が緩い）も完了・検証済み（player/staff/trainer 3ファイル同時、2026-07-05・このセッション）**:
  - 原因: `ld()`と`startListeners()`のFirestore読み取りで、選手データ(`p`キー)以外は`Array.isArray`チェックなしに`D[k]=parsed`していた（player:410/509、staff:520/618）。何らかの理由でdocの中身が壊れて配列以外（オブジェクト・文字列・null等）になった場合、そのまま`D[k]`に代入され、以降その画面の`.filter`/`.map`で例外が起き画面全体が死ぬリスクがあった。trainerは一見`Array.isArray`チェック済みに見えたが(582行等)、else分岐`else if(!Array.isArray(parsed))D[k]=parsed;`が**非配列の時だけ代入する**という逆向きのロジックで、実質同じ穴が開いていた。
  - 修正: player/staffの2ファイル4箇所は`else if(k!=='p'&&Array.isArray(parsed))D[k]=parsed;`に変更（非p系キーも配列の時だけ代入。空配列は従来通り代入=許容、非配列は代入しない=拒否、という既存の意図は保ったまま型チェックだけ追加）。trainerの2箇所は不要な逆向きelse分岐を削除するだけで対応（`if(Array.isArray(parsed)&&parsed.length>0)D[k]=parsed;`のみ残す。coach側は元々このパターン=`if(Array.isArray(p))D[k]=p;`で健全だったので手を入れていない）。
  - 検証済み: JXA構文チェック3ファイルともOK。ロジック抜き出しモック(`/private/tmp/.../scratchpad/mock_1_8.js`、セッション終了で消える一時ファイル)で「正常配列は読み込む」「空配列は既存仕様通り(player/staff方式は代入=許容、trainer方式は代入しない=既存仕様)」「壊れたデータ(オブジェクト/文字列/null)はどの方式でも一切Dを上書きしない」を確認。
- **2-2（ログイン後の着地点統一）も完了・検証済み（player/index.html、2026-07-05・このセッション）**: `confirmAutoLogin`（自動ログイン確認、[player/index.html:559](player/index.html:559)）の着地を`go('home')`→`go('mypage')`に変更し、PINログイン`doLogin`（元々mypage着地）と統一。「今日やること」チェックリストがmypageにあるため、毎朝の起動→ホーム→タブ移動→入力という遠回りを1タップ減らせる。呼び出し元は1箇所のみ（自動ログイン確認画面の「✅ はい、私です」ボタン）で他に依存箇所なし。モックで`confirmAutoLogin`後に`curTab==='mypage'`になることを確認済み。
- **1-2/2-1の実装内容（player/index.html、2026-07-05・このセッション）**:
  - 原因: `T.condition()`/`T.physical()`/`T.injury()`/`T.match()`/`T.tape()`/`showFullRanking()`がmypage/homeのカードから`go()`を経由せず直接呼ばれており、`curTab`が更新されない＋`subView`もtrueにならない。この状態で誰かが何か保存する度（27コレクション監視の`startListeners`）、フォーカスが外れた瞬間に`T[curTab]()`（古いタブ）が再実行され画面が強制的に巻き戻っていた。加えて`T.condition()`自身とテーピング予約フォーム`showTapeBookForm()`は「一覧画面」ではなく実入力フォームなのに`subView`保護が無かった（他の入力フォームは`showSub()`経由で保護済み）。
  - 修正: ①mypage/homeの直接呼び出し8箇所を全部`go('condition')`等に変更（`go()`は無改造で汎用対応）。②`showFullRanking()`を`T.ranking`として登録し直し、呼び出し元を`go('ranking')`に変更＋「← ホーム」の戻るボタンを新設（監査2-3も同時解消）。③`T.condition`の先頭に`subView=true`を追加（戻る/保存成功は元々`go('mypage')`済みなので副作用なし）。④`showTapeBookForm`の先頭にも`subView=true`を追加、これに伴い`doTapeBook`/`cancelTapeRsv`内の直接`T.tape()`呼び出し（成功・満枠時双方）を`go('tape')`に変更（**これをしないと`subView`がtrueのまま固着し、以後テーピング一覧が二度とリアルタイム更新されなくなる回帰があった＝実装中に自分で気づいて対処**）。⑤ユーザー承認のうえ、トレーニング実施画面`renderTrainingExec`にも`subView=true`を追加（下書きクッションはあるが、休憩タイマー等が再描画で毎回リセットされる体験上の問題を今回まとめて解消。退出経路はボトムナビの`go()`3つのみで全て`subView`を無条件リセットするため詰みなし）。
  - ハマった点: Edit時に`h+='...'`という単一引用符文字列の中へ`onclick="go('ranking')"`のように**内側の単一引用符をエスケープし忘れ**、文字列が途中終端される構文エラーを作った（JXA `new Function()`で`SyntaxError: Unexpected identifier 'ranking'`として検出）。修正時は必ず`onclick="go(\'tab\')"`の形式で統一すること。既存コードの`showSub`等も同じ規則。
  - 検証済み: JXA構文チェックOK。JXA上でHTML/DOM/firebaseをモックし本物の`player/index.html`を`eval`して実関数を呼ぶ模擬実行スクリプト（`/private/tmp/.../scratchpad/mock_nav.js`、セッション終了で消える一時ファイル）で22項目全パス——`go(condition)`でcurTab同期＋`T.condition`がsubView=trueにする／`go(mypage)`で解除／一覧画面5つ(physical/injury/match/tape/ranking)はcurTabだけ同期しsubViewはfalsyのまま(＝ライブ更新は維持)／rankingに戻るボタンあり／`showTapeBookForm`→`go('tape')`でsubViewが正しく解除／`startTrainingFresh`→`renderTrainingExec`が完走しsubView=true、`go('home')`で強制離脱してもsubViewが必ず解除される／実際の`startListeners`再描画ガード式をそのまま再現し「condition入力中はブロックされる」「injury一覧はライブ更新される」を直接確認。
  - **実機ブラウザ確認は保留中**（ユーザー指示で「一旦クリア」扱い）。ローカルサーバーは`python3 -m http.server 8933 --bind 127.0.0.1`で起動していた（セッション終了で死ぬので次回は再起動）→ `http://127.0.0.1:8933/player/index.html`。確認観点は次回いずれかのタイミングで: ①コンディション入力中に他画面から戻ってこないか②ホームのランキング「全体を見る」→戻るボタンでホームに戻れるか③mypageの各カードタップで正しい画面に飛ぶか④テーピング予約フォームが正常に予約できるか⑤トレーニング実施中に休憩タイマー等が意図せずリセットされないか。
- **1-5（id=Date.now()衝突リスク）も完了・検証済み（player/index.html、2026-07-05・このセッション）**:
  - 原因: 全保存関数が`id:Date.now()`でid採番しており、複数選手が同一ミリ秒に保存すると同一idになる。削除は`latest.filter(r=>r.id!==id)`方式のため、衝突すると**他人の記録も巻き込んで消える**。`doMatch`の`Date.now()+100/+101`、`doInjuryReport`の`injId+1`は「同一呼び出し内の兄弟レコード2つが同じidになる」ことだけを避けるその場しのぎで、**別々の選手同士の衝突には無力**だった。
  - 修正: 共通ヘルパー`function newId(){return Date.now()*1000+Math.floor(Math.random()*1000);}`を新設（[player/index.html:526](player/index.html:526)、`idEq`のすぐ下）。**数値のまま返す**のがポイントで、onclick埋め込み（`'+r.id+'`等の裸の数値埋め込み）や`===`比較を含む既存コードを一切変更せずに使える。`id:Date.now()`だった14箇所全部と、`+100`/`+101`/`+1`のその場しのぎ2箇所を`newId()`に置換。`chart.evals`用の`id:Date.now()+'_'+Math.floor(Math.random()*1000)`（645行・2014行、文字列id）は既存の別方式でPhase0/1で対応済みのため対象外・変更なし。
  - 既知の残課題（次回staff/trainer監査で拾うとよい）: `i`/`r`/`rlog`はstaff/trainerも書き込む共有コレクションだが、今回はplayer側の採番のみ修正。staff/trainer側が素の`Date.now()`のままなら、そちら発のレコードとの衝突リスクは残る（低頻度・低優先度と判断しスコープ外にした）。
  - 検証済み: JXA構文チェックOK。専用モック（`/private/tmp/.../scratchpad/mock_id.js`、runTransaction対応の擬似Firestoreストア込み・セッション終了で消える一時ファイル）で14項目全パス——`newId()`は数値を返しMAX_SAFE_INTEGER以内／連続2回呼び出し（doMatch的な兄弟レコード生成を模した現実的なケース）500試行で衝突0／`doCondition`・`doInjuryReport`（injury+rehabの2レコード同時生成）・`doBronco`を実行し正しくid付きレコードが生成されることを確認／`delPhysRec`が新id方式のレコードを正しく1件だけ削除できることを確認（既存の削除ロジックは無改造で動作）。
  - 補足: 20000回連続呼び出しでの衝突ゼロは最初アサートしたが失敗した（JS的に同一ミリ秒に大量呼び出しが集中し1000通りの乱数枠内で衝突する、いわゆる誕生日問題）。これは実際の本番利用パターン（同一ミリ秒に2人が保存する程度）とは乖離した過剰な負荷テストだったため、アサートを「現実的な2回連続呼び出し」に修正した。衝突確率をゼロにする改修ではなく1/1000に下げる改修である点は要注意（injcommの既存方式と同じ考え方）。
- **まだ未着手（player監査プラン残り）**: 1-6・1-9（デッドコード削除、4サイト監査完了後にまとめる方針）／1-7（ヘルパー複製の乖離、具体アクションなしの注意点）／3系（デザイン全般、alert()多用のトースト化等）。**2系(UX・導線)は全項目完了**（2-1〜2-12まで、詳細は上）。
- **⚠️ 作業ツリーは全部未コミット（2026-07-05時点）。pushはまだしていない（ユーザー指示で最後にまとめる）。**
  - 変更済み: `player/index.html`（CSS層5件＋1-1＋1-4＋1-3の一部＋1-2/2-1＋1-5＋1-8＋2-6＋2-8＋2-9＋2-11）／`staff/index.html`（1-3＋1-8＋T1-1/T1-2＋rlogソートガード）／`trainer/index.html`（1-3＋1-8＋ガイド付き評価フロー ステップ①〜⑦＋ガイド付き評価フロー①〜⑨全完走＝実バグバンチ/安全土台移植/即効UX/安全ゲート/クイック評価/ミニスパークライン/preCheck一本化仕上げ/To-Doホーム/T1-8data属性化/フル評価ウィザード骨組み＋前回値ゴースト・差分色・スパークライン・完了サマリー/SOAP操作単位化＋O欄自動下書き/整形テストsupervised二層化、T1-15エスケープ含む）／`coach/index.html`（前セッションの全面リニューアル、別件・詳細は下）／`HANDOFF.md`。
  - 未追跡（コミット不要）: `.claude/launch.json`（ローカルプレビュー用・セッションごとにパス書き換えが要るので使い捨て）／`.DS_Store`／`dev/`（jsc模擬実行テストハーネス一式。`prelude.js`+`extract.py`+`test_*.js`。コミットするか要相談だが、テスト資産として残す価値はある）。
  - **全部構文チェック済み・mock実行で検証済み。実機ブラウザでの動作確認はまだ（ユーザー指示で保留中）。** ※上記は2026-07-05時点の記述。2026-07-06の「player大幅リニューアル」（player/staff/coach/index.html）の進捗詳細は本ファイル冒頭の🔴節を参照。
- **既に完了・検証済み（すべて未push）**:
  1. **CSS層5件**（player/index.html）: `.alert-warn`/`.alert-up`定義追加（2-4）／`.card-click`定義追加（2-5、hover+active）／`.ipt`のfont-size 14px→16px（2-12、iOS強制ズーム対策）／表彰台アバターの未定義関数`showOtherPlayer`呼び出しとcursor:pointerを削除（2-10）。
  2. **1-1**（player/index.html）: `T.home`で`yesterdayS2`を定義前に使っていた巻き上げバグを修正（宣言を先頭へ移動）。mypage側の`selectedYesterday`（matchselを`{date,pids}`として誤読）を、実データ形状（pid配列、staff監査で確定済み）に合わせて`(D.matchsel||[]).indexOf(myPid)>=0`に修正。モックで両アラートがtrueになることを確認。
  3. **1-4**（player/index.html）: guardSubmit未適用だった6関数（`doMatch`/`doWeekCheck`/`doRehab`/`doPlayerAbsence`/`doTapeBook`/`savePainSelf`）にguardSubmit＋releaseSubmit（失敗時）を追加。`doMatch`は`svSafe`のi→r→md並行保存を`svSafeSeq`（items配列、怪我時は['i','r','md']順）に統合。`doRehab`/`doWeekCheck`も`svSafe`→`svSafeSeq`に変更（svSafeは失敗時ボタン固着するため）。モックで「連打しても2回目はブロックされる」「怪我ありなしでitems順が正しい」を確認済み。
  4. **1-3**（player/staff/trainer 3ファイル同時）: テーピング予約の空き判定が複数枠予約の**先頭枠(`slotId`)しか見ていない**バグ（2枠目以降が「空き」に誤表示→二重予約可能）を、3ファイル共通ヘルパー`tapeSlotBooked(rsvs,slotId)`（`slotIds`配列全体を見る、旧データは`slotId`にフォールバック）を新設して修正。**player**: `updateTapeSlots`の空き判定＋`doTapeBook`のトランザクション内に**サーバー最新値での枠残数再検証**を追加（クライアント側スナップショットのレース対策）。**staff**: `V.tape`の枠バッジ表示2箇所（S1-12相当）。**trainer**: ホーム今日の予約表示・週間一覧2箇所（+`myRsvs`フィルタもslotIds対応化）。モックで「旧ロジックはslot2の占有を見逃す→新ロジックは検知」「レース再検証で埋まった枠はslotFull判定」を確認済み。
  5. **1-2/2-1**（ナビ経路一本化。詳細は上）。
  6. **1-5**（id衝突リスク。詳細は上）。
- **ローカルプレビュー**: `python3 -m http.server 8933 --bind 127.0.0.1 &`（要Bash権限、cwdはリポジトリ直下）→ `http://127.0.0.1:8933/player/index.html`。**preview_start（Claude Previewツール）はこのMacのsandboxでgetcwd失敗するため使えない**（既知の環境制約、今回も再確認済み。毎回Bash+dangerouslyDisableSandboxで代替）。
- **coach全面リニューアル（前セッション分）は依然未push・ユーザー判断待ち**: 「coachは今の状態でpushする？ それともC1/C2等のレビュー指摘を入れてからpushする？」という質問はまだ回答をもらっていない（今回のセッションではplayer監査の実装に話が流れたため）。次にこの質問をぶり返す必要はない——**ユーザーは「player実装を先に進めて、pushは最後にまとめる」という方針を選んだ**ので、coachの変更もそのタイミングでまとめてpushするかどうかを含めて後で確認すること。詳細は次項に温存。
- **🆕 coach全面リニューアル＋3体レビュー＋ドリルダウン＝完成・検証済み・未push（2026-07-04）。**
  - 作業ツリー状態: 変更=coach/index.html（866→約1500行）とHANDOFF.md。未追跡=.claude/launch.json（ローカルプレビュー用・コミット不要）と.DS_Store。**pushするのは coach/index.html＋HANDOFF.md のみ。**
  - ドリルダウン（ユーザー要望「未測定12名が誰か見たい」）: 考察カードtaップ→該当選手リスト展開→選手tapで個人レポート。開閉状態はinsKey（タイトルの数値除去ハッシュ）＋_insOpen辞書で再描画後も維持。
  - レビュー指摘の即日適用分（約15件）: onSnapshot再描画の嵐修正（変化なし通知スキップ＋300msデバウンス＋noAnim＋スクロール維持）／history API（個人レポート=pushState、iPhoneエッジスワイプで戻れる）／タップターゲット44px／RTP_DARKダーク配色変換（共通定数RTP_LEVELSは不変）／--txt-3コントラストAA化／hover:hover分離＋:active／タブ右端フェード＋activeタブscrollIntoView＋レポート中はタブハイライト解除／2回目以降タブはアニメ省略（_seenTabs）／countUp・リング・バーのnoAnim/reduced-motion即時確定／safe-area対応。
  - 検証済み: JXA構文全ブロックOK／モック46チェックPASS（ドリルダウン開閉・open維持含む）／本番実データREST読取で全6タブ＋全74選手レポートPASS。
  - 3体レビュー全文＋未適用リスト（C1〜C8/U3・U9/D1・D5・D9・D10）= planファイル末尾「coachサイト 3体レビュー」節。**特にC3は実データ裏付きの実害**（受傷299日・309日の消し忘れ怪我が稼働率を歪めている）。C4も実害（コンディション入力は直近6/23で止まっており、毎日入力前提の考察ルールがオオカミ少年化する）。
  - ローカルプレビュー方法: `python3 -m http.server 8931 --bind 0.0.0.0 &` → http://127.0.0.1:8931/coach/index.html （Cmd+Shift+R）。サーバはセッション終了で死ぬので次回は再起動。Chrome拡張のnavigateはlocalhost/LAN IP不可、preview_startはsandboxでgetcwd失敗（このMacの既知制約）。
- サブエージェント運用メモ: シニアコーチ役は1回目セッション上限で死亡→**軽量プロンプト（ツール呼び出し5回制限＋読む範囲を指示）で再実行し成功**。複数体走らせる日はこの手法。
- **✅ coachサイト全面リニューアル完了（2026-07-04・未push）**。ユーザー指示「見た目ガラッと変えてモダンに（スクロールアニメーション）＋各データからレポート・考察的な表示」を受けて866行→1403行に書き換え。
  - 新規: ⓪概況タブ（稼働率SVGドーナツ＋KPIカウントアップ＋チーム考察ダイジェスト）／全タブに「考察」セクション（ルールベースの考察エンジン: 復帰予定超過・同部位再発・平均離脱期間・部位別傾向90日・BIG3向上/低下・測定90日鮮度・週間ボリューム±25%・痛みスキップ偏り・睡眠トレンド・3日連続RPE8+・入力率）／個人レポートに個人考察（チーム内順位・再発リスク・疲労・ボリューム急増）／コンディション14日トレンドチャート／BIG3表彰台／スクロールリビール（IntersectionObserver、prefers-reduced-motion対応）。
  - 流用（実績コードそのまま）: データ層（短いキー・onSnapshot）／共通定数・ヘルパー／トレーニング分析ブロック（exMetrics〜drawTrChartC、staffと定義一致）。書き込み処理ゼロは維持。
  - 検証済み: JXA構文チェック全7ブロックOK（{}カウント1ズレは旧ファイルにもある escapeHtml の /'/g 誤検知）／モックデータ模擬実行40チェックPASS／全キー空データPASS／**本番実データREST読取→全6タブ＋全74選手の個人レポート描画PASS（チャート119個生成）**。
  - 旧コードの潜在バグ2件はリニューアルで消滅: avHがAVC未定義参照（デッドコード）／select 12pxのiOSズーム（16pxに）。imgFindings/タイムライン系はcoachは元々描画していないので対象外。
  - 検証環境メモ: このMacはnodeなし→構文チェックはJXA(osascript -l JavaScript, new Function)。Chrome拡張はlocalhost/LAN IPともnavigate不可・preview_startはsandboxでgetcwd失敗→実機確認はユーザーのブラウザで（ローカル: `python3 -m http.server 8931` → http://127.0.0.1:8931/coach/index.html を開いて渡した）。
- coach監査（旧計画）はこのリニューアルで実質代替。残す価値のある旧指摘はonSnapshot全キー購読（coachは閲覧専用なので許容）のみ。
- trainer実装（監査完了済み・3体レビュー反映済み）: 実装順序はplanファイル末尾「実装順序（3体統合・確定案）」の9ステップ（①実バグバンチ→②guardSubmit移植→③16px化+ログイン永続化→④安全ゲート→⑤クイック評価2分→⑥差分表示→⑦To-Doホーム→⑧フルウィザード→⑨テスト二層化+SOAP下書き）。**前セッション末にユーザーへこの順を提示済みだが、明示的なGOはまだ**（コーチサイトの質問で中断）。
- **ユーザーの要望（原文趣旨）**: トレーナーサイトは専門学生（見習い）が使う。評価で「何を入力したらいいのか、何からやったらいいのか、順序もわからない」状態だったので、それをサポートするモダンな仕様にしてほしい。
- 実装の作法: 1ステップずつ→構文チェック（JXA）→模擬実行→ユーザー確認→push。staff/trainer同時修正が必要な項目（T1-1/T1-2）は両ファイル揃えてコミット。
- ユーザーがまだ実装項目を選んでいない場合は、planのtrainer節を要約提示して選んでもらう。
- trainer実装の後（または並行の合間）: coach監査（閲覧専用なので軽め）→4サイト横断の統合優先度リスト。

## いま何をしているか（現在地）
- **🆕🆕🆕 4サイト監査 — player・staff・trainer完了（3サイトとも3体レビュー反映済み）、残りはcoachのみ。コードは一切変更していない（読み取り専用）。**
  - **trainerサイト監査＝完了・3体レビュー反映済み（2026-07-04）。planファイル末尾に「trainerサイト監査レポート」（T1〜T5＋再設計確定版＋実装順序9ステップ）。**
    - **本番実測（REST・読み取りのみ）: rlog=10件 / rtest=1件 / taperec=0件 / tape予約=0件、なのにtrainers=17名登録** ＝「人はいるのに記録が発生していない」。ユーザーの実体験（見習いが評価で固まる）と整合。chartは31件28.5KBで1MB余裕。
    - **実バグ確定4件（未修正）**: ①T1-1 経過タブが`imgFindings.join`でクラッシュ（**staff:1784/trainer:1277両方**。画像所見の詳細を書いた怪我で発火）②T1-2 タイムラインdesc+titleの二重エスケープでHTMLタグが文字で見える（両方）③T1-3 trainer:1425 `popView()`未定義で「回復済みにする」が凍結 — **修正はpopView置換ではなくボタンのstaff権限化**（AT役: バグが偶然安全弁になっている。置換すると見習いのワンタップ回復確定が完成してしまう）④T1-12 リハビリ一覧に「痛み:undefined/10」常時表示（rlogにtop-level painは無い。preCheck.painを読むべき）。
    - **AT役の最重要指摘（T5）**: 権限が臨床的に逆転（誤字修正不可なのにresolveInj/setRtpLevel/changeStageは見習いがノーガードで実行可・実施者記録ゼロ）／脳震盪がtrainer側ノーガード（isConcussionのUI参照ゼロ、SCATを陰性/陽性プルダウンで答えさせる）／レッドフラグ入力しても何も起きない／INJ_TEMPLATES.contra・romLimitが現場に一度も表示されない。**→「安全ゲート（ステップ④）をウィザードより先に」が3体一致の条件**。
    - **再設計の骨子（確定版）**: 純ウィザードでなく「1画面セクション型＋ステッパー」／入口2モード（**クイック評価2分**=痛み+★指標が既定、フル評価は週1提示）／**ステップ0「今日の変化チェック」3問＋中断ゲート**新設／順序=痛み→周径→ROM→筋力→テスト→所見／前回値はplaceholderゴースト・差分色は必ずmetric.direction基準／整形テストは`supervised`二層化タグとセットでのみ／SOAP自動下書きはO欄限定。詳細はplan必読。
    - エンジニア役の追加発見: T1-13 showTapeSetupFormだけ_subViewActive漏れ／**T1-14 trainerが未使用のtlog(500KB)等4キーを購読＝選手のセット保存ごとに全trainer端末が再DL＋画面リセット**／T1-15 preCheckエスケープ漏れ／T4-3 preCheckは「閉じると入力が捨てられる」「スライダー未操作で前回値が今日の値として複製」の静かな事故2件。
  - **staffサイト監査＝完了・3サブエージェントレビューも完了・planに反映済み（2026-07-04）。** レビュー体制はplayerの2体（エンジニア＋デザイナー）から**3体（＋トップアスレティックトレーナー役）に拡張**（ユーザー希望）。
    - 事実誤認2件を訂正（S2-4の関数特定ミス、S2-3の「最終実施日が出ない」の言い過ぎ）。
    - 優先度変更: S1-8(中→高、復帰確定フロー分散)・S2-2(高→**最高**、記録コスト)・S2-7(中→**高**、AT視点で過小評価と判定)・S2-9(低→高、iOSズーム)・S3-1保存系(中→高、トースト化)・S2-4(中→低)・S2-6(中→低)。
    - 新規セクション追加: **S4（モバイルUXの抜け漏れ、デザイナー由来、M1〜M6）**＝ナビがアイコンのみ18項目で実質崩壊/タップターゲットHIG未達/タブ誤タップで入力全消し等。**S5（臨床機能面の抜け漏れ、ATレビュー由来、S5-1〜S5-7）**＝**S5-1健側入力UIが存在せずPhase1のLSI指標に値を入れられない（Phase2着手前に必須で直すべき）**、S5-2脳振盪管理が実質放置（GRTPの24時間ルール等）。
    - 3者共通結論:「このシステムの現在最大のリスクは機能不足でなく記録が発生していないこと」。S2-2の解消を最優先にしてから画面統合・Phase2に進む方針で一致。
    - 詳細・着手順序案（全11ステップ）はplanファイル末尾「次のステップ」節に反映済み。
  - **staff監査の最重要発見（未修正）**:
    1. **実測: `tlog`が既に1MB制限の50.9%（533KB）** — Firestore REST APIで全28doc実測。数ヶ月〜1年でトレーニング記録の保存が全滅する時限爆弾。`tdraft`も99KB。
    2. **実測: `matchsel`の本番データはpid配列** — playerのmypage(886行)の`{date,pids}`想定読みが完全に間違いと確定。player 1-1の修正方針はこれで確定。
    3. `V.dash`(704行)で`todayS`を定義(723行)より前に使用 → **ダッシュボードの疲労度アラートが一度も出ない**（playerのyesterdayS2と同型の実バグ）。
    4. **リハビリ遅延アラートが孤立** — 段階目標日(stageTargetDates)を設定するUIがデッドコード(`rehabHTML`＋衛星8関数、呼び出し元ゼロ)の中にしかなく、新規怪我では二度と発火しない。旧式ログ`r.logs`のデータも現UIのどこにも表示されない。
    5. **staffにはguardSubmit（二重送信ガード）が0件**（playerは9箇所導入済み）。doAddInjuryは連打で怪我＋リハビリがペアで複製。
    6. SOAP/復帰基準/RTPレベルは依然`saveChart`（カルテ丸ごと置換）で、trainerとの同時編集で巻き戻る（Phase0で直したのは評価・指標のみ）。`svRec('r')`も同様のレコード単位置換。
    7. deleteInjury（怪我単体削除）が`chart`と`rtest`を消し残す（doDelPlayerは消しており不整合）。
    8. UX: 本番実データで「受傷88日のACLで評価0件・SOAP0件・復帰予定未設定」＝記録コストが高く運用に乗っていない。実施者プリフィル・種目一括チェック・前回コピーがクイックウィン。リハビリ業務が4画面に分散し、段階変更が2画面で挙動不一致（advRehabStageは最終段階で自動resolve、カルテのchangeStageはしない）。
  - staffの素の`sv('chart')`は掃討済みだった（残る素のsvは初回種まき専用の1件のみ・ガード付き）。CSS未定義もstaffは`bd-n`のみで健全。
  - ユーザー依頼: 「player/staff/trainer/coach の弱点洗い出しをしたい。①UX/導線の弱点・惜しい所 ②壊れやすい/危ういデータ事故リスク構造 ③デザイン/UIで古い所、を優先度(高/中/低)つきでリスト化。一気にやらずplayerサイトから」。
  - **playerサイト監査＝完了**。手法: `player/index.html`全3179行を精読＋grepで裏取り（未定義CSSクラス4件・デッドコード5関数・素の`sv()`呼び出し0件を確認）＋本番サイトをブラウザで閲覧（テスト選手でログイン→home/mypage/トレーニング/ランキング画面）。**書込操作は一切していない。**
  - **成果物＝ `/Users/nakayamarinnin/.claude/plans/4-player-staff-trainer-coach-1-ux-merry-harbor.md`（次セッションで必読）**。ユーザー承認済み（plan modeで提示→approve）。中身は「1.壊れやすい構造」「2.UX/導線」「3.デザイン」の3カテゴリ×優先度(高/中/低)、計27項目。
  - **見つけた最重要バグ3件（未修正・次回対応候補）**:
    1. `T.home`(801〜812行) で `yesterdayS2` を**定義より前に使用**（var巻き上げでundefined）→「試合日チェック未入力」アラートが**一度も出ない**。さらに `D.matchsel` の扱いが home(pid配列想定)とmypage({date,pids}想定)で**食い違っている**。修正時は`D.matchsel`の実データ形状をFirestoreで先に確認すること。
    2. onSnapshotのリスナー(`startListeners`497〜515行)は「curTabの画面」だけ再描画保護するが、`T.condition()`等はcurTab更新なしで直接呼ばれる画面があり、**入力中に他人の保存でマイページへ強制送還され入力が消える**（コンディション入力など毎日使う画面が対象）。
    3. テーピング予約 `updateTapeSlots`/`doTapeBook`(3104/3131行) の空き枠判定が**複数枠予約の先頭枠しか見ておらず**、二重予約が起こり得る。
  - **次の一手＝trainerサイトの同様監査**（trainerはリハビリ記録の主要な書き手なので、svRec('r')/saveChart箇所とrlog運用を重点確認）→coach（閲覧専用なので軽め）→最後に4サイト横断の優先度統合リスト（tlog 1MB対策とmatchsel修正が最上位候補）。
  - まだ**修正フェーズには入っていない**。ユーザーが監査結果からどれを直すか選んでから、通常の「1機能ずつ→構文チェック→模擬実行→実機確認」フローに入る。

- **（保留・進行中）新プロジェクト「怪我管理 × リハビリ連携の強化」＝実装中。下の「怪我×リハビリ連携」節に全体設計。** grilling→2サブエージェントレビュー→自己レビュー→ユーザー承認済み。
  - **✅ Phase 0（データ基盤）完了・push済み(`93c5d9c`)＝実機スモーク検証OK。次はPhase 1。** staff/trainer両方に実装：
    - P0-a `getChart`補完（metrics/mmtTargets/injType/isConcussion/medClearance/romLimit/rtpLevel の既定値）→metrics未定義の既存カルテで白画面にならない。
    - P0-b 操作単位保存：`_chartIdx`＋`saveChartMetrics`新設。`saveEval`/`delEval`を**server-latestのevalsだけ触る方式に書き換え**（旧`saveChart(ch)`全置換のロストアップデートを解消）。saveChart本体にも注意コメント追加。
    - P0-c `saveEval`拡張：健側枠(`romH/mmtH/circH/fitH`)・フィットネス独自指標(`fit`)・臨床項目(`effusion/painLoad/readiness`)を収集（中身がある時だけ書く＝空{}で肥大させない）。UIは後フェーズ、現状は空収集で無害。
    - 定数追加：`MMT_ORDER`/`METRIC_CAT_MAP`/`INJ_TEMPLATES`/`STG_CAT_BY_SYS`（staff/trainer一致。INJ_TEMPLATES/STG_CAT_BY_SYSは**最小雛形＝臨床コンテンツで凛人と精緻化が必要**）。
    - **検証済み**：両ファイル構文OK(node無し環境なのでJavaScriptCore/osascriptの`new Function`パースで代替)＋模擬実行21件パス（getChart補完・他端末evalとmetricsを巻き戻さない・編集/削除/新injId作成）。staff==trainerのPhase0関数&定数はバイト一致をdiff確認。
    - **おまけ修正**：trainerがChart.js未読込だった既存バグを発見し同commitで修正（評価タブのグラフ`drawEvalCharts`が`Chart is not defined`で落ちていた）。staffと同じCDN行を追加。
    - **⚠️実機スモークの教訓**：ローカルサーバ(127.0.0.1:8765)で確認するつもりが本番(rinto1129.github.io)を開いていて「修正が反映されない」と混乱した。Consoleのfaviconリクエスト元URLでどちらを見ているか判別できる。**必ずアドレスバーが127.0.0.1:8765か確認**。
  - **✅ Phase 1（追跡指標セクション＋種別テンプレ確定）完了・push済み(`9ce97a3`)＝実機スモークOK。次はPhase 2。**
    - **凛人監修で臨床コンテンツ確定**（仮雛形を差し替え。staff/trainer一致）：
      - ACL＝膝伸展(制限)`kext`down/膝屈曲`kflex`up/シングルホップ(fitness,LSI)。禁忌=グラフト保護期(〜12週)のOKC終末伸展。
      - ハム肉離れ＝SLR`slr`up/膝屈曲筋力(strength,LSI)/30mスプリント(fitness,秒,down)。
      - 足関節捻挫＝膝-壁距離`wbl`(cm)up/外果周径(circ,down)/片脚バランス(fitness,LSI)。
      - 肩前方脱臼＝外旋`sER`/外転`sabd`/外旋内旋筋力(strength,LSI)。禁忌=外転+外旋(apprehension)。
      - 脳震盪＝指標なし・`isConcussion:true`でGRTP別扱い。
      - `STG_CAT_BY_SYS`＝下肢/上肢/体幹**共通**(IIFEで単一定義共有)。①ウォーキング=ケア/ROM/患部外/トレ/アジリティ、②ランニング=+フィットネス、③スプリント以降=ケア/トレ/アジリティ/フィットネス(患部外・ROMは外す)。
      - `EVAL_MASTER`新規追加：大腿`slr`(SLR/正常85°)・足首`wbl`(膝-壁距離/cm/正常10cm)。※10cmは目安で仮置き（凛人未確定の唯一の値。違えば直す）。
    - **staff評価タブに「🎯追跡指標」UI新設**（trainerはPhase1では触らない＝定数のみ同期）：種別選択→`applyInjTemplate`で一括生成、`metricRow`で名前/種類/単位/向き/基準モード(受傷前/健側/正常値/手動)/手動基準値/患健LSI/目標/期限を編集、`addCustomMetric`/`delMetric`/`saveMetricsFromUI`/`toggleConcussion`。保存は全て操作単位`saveChartMetrics`(meta経由でinjType/isConcussionも)。
    - **検証済み**：JavaScriptCoreパースOK＋模擬実行6ケース(ACL生成/目標期限保存/evals未破壊/脳震盪トグルでmetrics保持/削除/手動追加/足関節wbl・外果周径down)。
    - **次＝Phase 2**（不足ゲージ, staff・カルテ内）。**Chart.js不使用のCSS/SVGネオン系ゲージ**（`}}}});`括弧地雷回避）。各metric：最新eval(date→inputAt 2段ソート)vs基準(受傷前→健側→正常値の解決＋手動目標優先)→達成率%・「あと◯◯」。direction:downで反転しない・基準の出所ラベル・LSI(患/健)表示・MMTは`MMT_ORDER`indexドット。**0除算/NaN/Infinityガード必須**(健側base=null等)。medClearance/romLimitのchart-level UIはPhase3(安全ゲート)で実装予定＝保存経路(saveChartMetricsのmeta)は用意済み。
  - **完成プランの場所**: `/Users/nakayamarinnin/.claude/plans/rom-rom-tender-sundae.md`（v2。**着手前に必読**。ここに全フェーズ・確定判断・臨床セーフティ・データ基盤修正・検証手順が入っている）。
  - **やりたいこと（ユーザーの言葉）**: 怪我管理で入れた情報からリハビリを組む。「ROMが足りない→ROM改善やろう」「あと◯度足りない」「今週までにここまで到達」を出す。ROM以外に筋力・フィットネス(時間/回数)も。エクササイズ前後の伸び(pre/post)。過去リハビリ記録から「最近走れてない→走ろう」。**全部コメントで代替できるが"専用機能"が欲しい**、が出発点。
  - **⚠️ レビューで判明した急所（プランに反映済み）**: (1)既存`saveChart`([staff:1604](staff/index.html:1604)`latest[i]=ch`全置換)は**同一injId内ロストアップデート**＝staff指標設定中にtrainerが足したevalが消える→**操作単位の保存に直す(P0)**。(2)`getChart`がmetrics未補完→既存怪我で画面が白くなる→**空配列補完(P0)**。(3)`evals`に**健側枠が無い**→並行キー`romH`等を新設して3層基準(受傷前→健側→正常値＋手動目標)を成立。(4)**臨床安全弁が必須**＝提案の安全ゲート(夜間痛/腫脹/医師ROM制限中は提案抑制)・脳震盪を数値メトリックから分離(GRTP別扱い)・医師clearanceハードゲート・怪我種別テンプレ。(5)**postはevalsに積まない**(一時的ROM増加で推移を汚す)・正本はpre。(6)ゲージは**Chart.js不使用CSS/SVG**(`}}}});`括弧地雷回避)・MMTは`MMT_ORDER`のindex比較。(7)e1rm/ph(BIG3)は**患健LSI不可**＝受傷前比(全身回復)に使う／患健LSIは単脚/ホップ等side付き種目だけ。
  - **進め方**: Phase 0(基盤修正・最高回帰リスク=saveEvalを触る→単独デプロイ&スモークで隔離)→1(指標定義+種別テンプレ生成)→2(不足ゲージ)→3(提案+安全ゲート)→4(trainer pre/post)→5(やれてない検出)→6(player/coach薄く)。各末で構文チェック+模擬実行。
  - **怪我種別テンプレ(INJ_TEMPLATES)の中身は臨床コンテンツ＝勝手に確定せず凛人と詰める**。
- **（保留中の別タスク）TimeTree連携フェーズ1「チーム共通プッシュ/プル表示」**は未着手のまま（下の「TimeTree連携」節）。フェーズ2=予定一括インポートは完成・push済み。リハビリ連携を優先するため後回し。
- **実機スモーク用ローカルサーバ**（必要時）: `python3 -m http.server 8765 --bind 127.0.0.1`（リポジトリ直下で・Bash権限必要）→ Chromeで `http://127.0.0.1:8765/<site>/index.html`。本番Firebaseに繋がり実データで確認できる。
- **（完了）新機能「トレーニング内容の把握」＝staff(`085ea04`)・coach(`4fca6d5`)両方push済み＝完成。** 以下はその実装メモ（履歴）。
- **staff実装内容（push済み `085ea04`）**: `goPlayerDetail` に6つ目のタブ「トレーニング」dt5を新設。
  - 段階1: `goPlayerDetail(pid,openTab)` 2引数化＋冒頭で `_dtPid/_trEx/_trMetric` リセット。`dtTab(5)`→`renderTrainTab()` 描画フック（display:none回避）。`renderTrainingStatus` 行クリック4箇所を `goPlayerDetail(pid,5)` に。
  - 段階2: セッション履歴の折りたたみ展開（`toggleTrSess`/`trSessDetail`）。全セット`重量×回数(RIR)`＋目標差色付け（未達=赤/RIR余裕=黄）＋スキップ理由（痛み怪我=赤）＋当日コンディション。
  - 段階3: 種目セレクタ＋推移グラフ（canvas `ch-tr1rm`/charts key `tr1rm`）。`getCompareVolume`を`_curTLog`非依存に引数化移植→`getCompareEx`。同日集約（トップ=最大/推定1RM=最大/ボリューム=合算）`getExSeries`/`exMetrics`。
  - 段階4: 指標トグル3種（トップセット重量[既定]/推定1RM/ボリューム、estBase無し種目は推定1RM無効）。推定1RMはtlog再計算（候補=RIR記録あり&reps≤6&w>0&rp>0の最大e1RM、候補無し日は点なし）。信頼度マーカー（≤3rep濃radius5/4〜6淡radius4、pointRadius配列）。ph実測1RM水平線（borderDash・軸maxに含める）。実効強度%（トップ÷getBest×100、0除算ガード、100%超=ph更新推奨、測定日併記）。一行サマリー＋前回比/7日比（実日付併記、判断軸=トップ重量＞推定1RM＞＞ボリューム）。
  - staff追加関数（`renderTrainTab`周辺, staff:2652以降）: `renderTrainTab`/`toggleTrSess`/`trSessDetail`/`setTrEx`/`setTrMetric`/`exMetrics`/`getExSeries`/`getCompareEx`/`getExEstBase`/`getBestPh`/`diffArrow`/`trCmpLine`/`drawTrChart`。
- **coach実装内容（未push・検証済み）**: タブ無し縦スクロール構成に合わせて書き直し移植。
  - 既存トレ節（旧coach:580-588「🏋️トレーニング（直近）」）を `buildTrendCoach(pid)`＋`buildHistCoach(pid)` の2カードに差し替え。
  - 入口 `openPlayer(pid)`(coach:346) で `window._trEx=null;window._trMetric='top'` リセット（renderPlayerReportは再描画先でもあるのでここでリセット）。セレクタ/トグル変更は `setTrExC`/`setTrMetricC` が `renderPlayerReport(_detailPid)` 全再構築＋スクロール位置復元。グラフは `renderPlayerReport` 末尾に追加した `setTimeout(...,60)` で `drawTrChartC` 描画（常時表示＝display:none問題なし）。
  - coach配色（青ライン`#4D9FFF`/ph破線`#5E708A`/軸`#93A4BC`/凡例usePointStyle）。当日コンディションは`rpeColor`がcoachに無いため色なしtxt表示。
  - coach追加関数（`backFromReport`直前, coach:640付近）: `exMetrics`/`getExSeries`/`getCompareEx`/`getExEstBase`/`getBestPh`/`diffArrow`/`trCmpLine`/`toggleTrSess`/`setTrExC`/`setTrMetricC`/`buildTrendCoach`/`buildHistCoach`/`trSessDetailC`/`drawTrChartC`。名前衝突なしを確認済み。
- **検証手法**: 当環境にnodeが無いため JXA(`osascript -l JavaScript`)で構文チェック＋実関数をPythonでbrace抽出→Chart/document/Dをモックしてエンドツーエンド実行。staff・coach両方で3指標・estBase無し種目・同日集約・e1RM候補フィルタ・信頼度radii・ph水平線・実効強度・前回比/7日比 すべて期待通り。
- リポジトリ: 最新コミット `085ea04`(staffトレーニングタブ), 2026-06-27。`main`はorigin同期済み。**作業ツリーに coach/index.html（未コミット・本機能の移植）＋このHANDOFF更新＋未追跡`.DS_Store`**。
- （前フェーズ）**一連の信頼性改善＋UIバグ修正は一区切り済み**。
- **直近: 「明日のリハビリ予定が永遠に残る」バグを修正（`78ebfbd`）**。`rplan.tomorrowCats`に対象日が無く、設定すると怪我が回復済になるまで毎日「明日の予定」に出続けていた（リハビリ記録とは別データなので記録削除でも消えない）。staff `saveNextMenu`/trainer `saveNextMenuT` に対象日`tomorrowDate`(設定日の翌日)を付与し、staffダッシュボードのパネルを「本日分/明日分」に振り分け＋対象日を過ぎた分・日付の無い旧データは非表示に。旧データは無害に非表示、再設定で正常化。
- 完了サマリ（すべてpush＋実機確認済み）:
  - **player の主要入力4画面に共通の安全土台を適用**（トレーニング実施 / コンディション / 怪我報告 / フィジカル・体組成）。`guardSubmit`(二重送信ガード)＋`svSafeSeq`/`svSafeUpdate(onError)`(失敗時ボタン復帰＆内容温存)＋`isFilled`(0を弾かない必須チェック)。
  - **0誤検知バグの掃討**: 全サイト調査の結果、数値必須入力を0で誤検知する保存は staff `doAddFatigue` の RPE 1箇所のみ→修正（`commit e54949e`）。trainer/coachは該当なし。
  - **デッドコード削除**: player `doBIG3` / staff `svAll`（全キーblind上書きの火種）（`commit 2f6fd48`）。
  - 過去フェーズ: 素の`sv()`掃討（saveChart, `dd4d415`）／トレーニング入力ツール刷新（`4517acf`/`74c44d0`）。
  - 検証手法: 当環境にnodeが無いため `osascript -l JavaScript`（JXA）で実コード抽出→モック模擬実行＋テスト選手で実機スモーク。
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用) を本番に1名追加済み（削除可）。

---

## 🆕🆕 怪我管理 × リハビリ連携の強化（全体設計）— 計画完了・実装着手直前

> **完成プラン本体＝`/Users/nakayamarinnin/.claude/plans/rom-rom-tender-sundae.md`（着手前に必読）。** 以下は要約。grilling＋2サブエージェントレビュー＋自己レビュー（コード裏取り）で確定。

### 確定した設計判断（grilling 10問の答え）
1. ROM/筋力の**正本は`chart.evals`**（injIdごと）に一本化。`EVAL_MASTER`の正常値(`normal`)を使う。
2. **不足判定3層**：受傷前ベースライン→健側(LSI)→`EVAL_MASTER`正常値、の上に**凛人の手動目標(期限つき)**を任意でかぶせ優先。基準の"出所"をゲージに明示。
3. **数値メトリック共通型**でROM(°)・周径(cm)・数値筋力(kg)・フィットネス(秒/回)を一本化＋`direction`(up/down)。**MMTは順序型で別レーン**(`MMT_ORDER`のindex比較、文字列比較不可)。
4. **提案は(A)基盤(不足→RCATSカテゴリ)＋(B)任意(指標↔種目紐付けで種目名まで)**。自動ルールエンジンは作らない。**提案に安全ゲート必須**。
5. **定量筋力**：e1rm/ph(BIG3)＝受傷前比(全身回復)／患健LSI(≧90%)は単脚・ホップ等side付き種目だけ(BIG3で患健比は無意味)。
6. **「やれてない」検出は怪我種別テンプレ前提**：系統別(下肢/上肢/脳震盪)でSTG各段階の「やるべきカテゴリ集合」を定義→直近7日`rlog`差分→「最近◯◯**直近未実施(要確認)**」。断定しない。
7. **pre/postはセッション単位**。**正本はpreのみ**(条件統一=測定日)。**postは`postCheck`止まりで推移グラフ非混入**(一時的ROM増加でトレンドを汚す)。「今日の伸び」はpre/postCheckの2値から。
8. 設定は凛人(staff)。**新Firestoreキーを足さず`chart`内に同居**。
9. **v1スコープ=staff＋trainer作り込み、player/coachは進捗ゲージを薄く差すだけ**(計算ロジックを持たせない)。

### 🛑 臨床セーフティ（トレーナー役レビューで必須判定・フル装備で採用）
- **提案の安全ゲート**：夜間痛/安静時痛・**腫脹/熱感**・**医師指示のROM制限期間内**のいずれかで積極提案を抑制し「炎症/疼痛管理優先」に切替。文言は「処方」でなく「**候補(要臨床判断)**」。
- **脳震盪を本機能から分離**：`chart.isConcussion`で数値メトリック/ゲージ/提案の対象外。GRTP(症状ベース・24時間・症状再燃で後退)別扱い。7段階に乗せない。
- **医師clearanceハードゲート**(数値が全部緑でも医師許可無しは復帰不可)。
- **怪我種別テンプレ(`INJ_TEMPLATES`)**で指標2-3個＋段階カテゴリ＋禁忌期間を一括生成(入力負荷激減＋臨床妥当性担保)。**中身は臨床コンテンツ＝勝手に確定せず凛人と詰める**。
- 段階後退フロー維持(`prevStage`)。LSI前提崩れ(両側損傷/利き脚差)の注意ラベル。健側は測定日(週1-2)のみ測り「健側測定:◯日前」を表示。

### ⚙️ データ基盤の修正（エンジニア役レビューでP0＝Phase1着手前に潰す。実コードで裏取り済み）
`chart`(injIdごと)に追記：`metrics[]`(追跡指標定義＋目標＋direction)/`mmtTargets[]`/`injType`/`isConcussion`/`medClearance`/`romLimit`。実測値は`evals`。
- **健側枠**：患側は既存`ev.rom/mmt/circ`、健側は並行キー`ev.romH/mmtH/circH/fitH`(既存`drawEvalCharts`は`e.rom`しか読まない＝後方互換)。フィットネスは`ev.fit/fitH={指標id:値}`。臨床項目`ev.effusion/painLoad/readiness`(提案ゲートの入力源)。
- **P0-a**：`getChart`に`metrics`/`mmtTargets`/`rtpLevel`等の補完([staff:1584](staff/index.html:1584)で未補完を確認)。**Phase0最初の1手**。
- **P0-b**：保存を**操作単位化**([staff:1604](staff/index.html:1604)`latest[i]=ch`が火種を確認)。素朴なid和集合マージは削除を壊すので不可。`saveChartMetrics`＝`latest[i].metrics=`のみ、eval追加/編集/削除＝`latest[i].evals`を直接操作。**回帰リスク高い`saveEval`/`delEval`＋metricsだけP0、低頻度の他saveChart呼び出しはP1**。
- **P0-c**：`saveEval`にfit/健側/effusion/painLoad/readinessの収集を追加([staff:2045](staff/index.html:2045)が現状pain/rom/mmt/circ/ortho/special/noteのみ)。
- 定数追加：`MMT_ORDER`/`METRIC_CAT_MAP`/`INJ_TEMPLATES`/`STG_CAT_BY_SYS`(4ファイルコピー運用)。最新eval解決はdate→inputAtの2段ソート。

### 実装順序（各末で構文チェック＋模擬実行→確認→次へ）
- **Phase 0**：基盤修正(P0-a/b/c＋定数)。**最高回帰リスク=saveEval経路を触る→既存の評価入力/編集/削除/グラフ/SOAP/rlogが無傷を実機スモークで確認し単独デプロイ**してからPhase1へ。
- Phase 1：追跡指標セクション＋種別テンプレ生成(staff)。
- Phase 2：不足ゲージ(CSS/SVG・3層解決・LSI・MMT段階ドット・0除算ガード)。
- Phase 3：提案＋安全ゲート＋医師clearance＋脳震盪除外。
- Phase 4：trainer実施画面pre/post(対象2-3個・前回値プリフィル・post任意・既存preCheck接続を後方互換で)。
- Phase 5：やれてない検出(系統別STG×直近rlog差分)。
- Phase 6：player/coach薄く(描画関数のみ)。

### レビュー結論
- 現場トレーナー役：骨格OK。**安全弁(腫脹/痛み/治癒段階/医師許可/怪我種別＝特に脳震盪分離)が抜けていた→全部反映済み**。
- シニアエンジニア役：**条件付き承認**。P0(saveChartマージ/getChart補完/健側枠/preCheck接続)を着手前に潰すのが条件→プランに反映済み。
- 自己レビュー(コード裏取り)：saveChart全置換・getChart未補完・saveEval項目を実コードで確認。追加修正＝e1rm患健比の誤り訂正・素朴マージは削除を壊す指摘・健側は測定日のみ運用・テンプレは凛人と詰める。

---

## 🆕 TimeTree連携プロジェクト（全体設計）— フェーズ1は実装プラン確定・着手待ち

> 「部の予定はTimeTreeに入っている。二重入力せずサイトに反映したい」が出発点。grillingで方向確定。

### 確定した前提（調査結果）
- **TimeTreeから自動でデータを出す手段は実質無い**: 開発者API終了(2023/12/22)・更新される購読iCal URL無し・アプリの外部カレンダー連携はGoogle"取り込み表示"向きで書き出しは不安定/Web版は不可・出回ってる自動同期はDOMスクレイパー(壊れやすい)。
- なので**案A=スクショ起点の貼り付けインポート**を採用（ユーザー合意）。スクショ→LLM(私 or スマホのClaude/ChatGPT)で予定テキスト化→サイトに貼って取り込み。**インフラ追加ゼロ・静的構成のまま・壊れる要素なし**。案B(Googleカレンダーを主管理にして自動)はワークフロー変更が要るので保留。
- **サイトには既に自前カレンダー`cal`がある**（種別: match/practice/off/phys_measure/bronco_measure/other＋今回`weight`追加）。手入力が大変で実質使われていなかった→インポートで起こす。**試合後チェック催促・測定日催促はplayerに実装済み**で、`cal`に試合(match)が入れば自動稼働。

### フェーズ構成
- **フェーズ2（連携の本体）= 予定一括インポート → ✅完成・push済み**。毎月: スクショ→私に渡す→出た予定テキストをstaffの「📋一括インポート」に貼る、で運用。
- **フェーズ1（次にやる）= チーム共通プッシュ/プル表示 →🆕 実装プラン確定・ユーザー承認済み（2026-07-05）。プランファイル: `/Users/nakayamarinnin/.claude/plans/sleepy-spinning-stardust.md`。未着手（コード変更ゼロ）。**
  - 確定仕様: **厳密に交互・チーム全員共通(グローバル1列)**。「ウエイト①②」はグループ/時間帯分け＝同内容・1日=1進行（ユーザー確認済み）。
  - データモデル: 新短キー`pp`＝**履歴配列**（`{id,type:'push'|'pull',date,by:'staff'|'trainer'}`）、最新レコードのtype=次の種別。反転=逆typeを追記／戻す=最新をpop／初期設定=1件目作成。player/staff/trainerに「次のウエイト: 🟦PUSH」バッジ表示。進行はstaff/trainerの1タップ反転（confirm無し）＋「1つ戻す」。**coachには追加しない**。
  - cal連動は**表示のみ**に確定（ユーザー選択）: 直近のweightイベント日をバッジに併記、今日がweight日なら「今日は◯◯の日」と強調。自動反転はしない。
  - 実装時の要注意点（プランに詳細）: trainerのSKに`cal`が無いので追加が必要／trainerのld・onSnapshotが空配列更新を受け取らないガードがあり「戻す」で空配列に戻すケースに`k==='pp'`特例が要る。
- 後フェーズ候補: 画像直アップ全自動(案B/AIキー+サーバーレス必要なので保留)、trainer/coachへのカレンダー表示追加。

---

## 🆕 （完了）新機能：トレーニング内容の把握（staff/coach）— ✅両方push済み

> grilling＋サブエージェント2巡レビューで確定。**この通りに作れば事故らない。** 進め方は「staff先行で5-6段に刻む → 各段で構文チェック＋JXAモック模擬実行 → テスト選手で実機スモーク → push前にユーザー確認 → 最後にcoachへ書き直し移植」。

### 目的
- **主**: 漸進性過負荷の管理（種目ごとに前回/先週から伸びているかを時系列で）。**入口**: 1セッションの中身レビュー（何を何kg×何回×RIRいくつでやったか）。
- 現状 staff/coach は「総ボリューム何kg」しか見えず、中身が一切見えない。そこを埋める。**閲覧のみ・保存処理なし**。

### 重要な前提（実コードの事実 — ここを外すと破綻）
- **player に既に同等の簡易版がある**: `showTrainingHistory`(player:2864)＝種目セレクタ＋ボリューム推移＋20件履歴。新機能はこれの**リッチ版を staff/coach に作る**イメージ。
- **集計の正準ロジックは player にある**: `getCompareVolume`(player:2510)＝前回比/先週比の定義（先週比は「対象日の6日前以前の直近セッション」）。**これを移植して3ファイルで定義一致させる**（CLAUDE.md「1つ直したら揃える」）。
  - ⚠️ ただし `getCompareVolume` は `_curTLog`（入力中の下書きグローバル, 2511-2512）に依存している。staff/coach に `_curTLog` は無い。**ロジックは同一に保ったまま、対象tlogの ts/id/beforeDate を引数で受け取る純関数に書き換えて移植する**（丸コピーは `_curTLog is not defined` で落ちる）。
- **`getE1RMTrend`(player:2927)はコピー禁止**。`D.e1rm`レコード依存で、これは「自己ベスト更新時だけ記録」＝単調増加で後退が見えない。**新機能の推定1RMは tlog から毎回再計算する**（後述）。
- `estimateOneRM`/`RPECHART`/`EST_BASES`/`getBest`/`getPlayer1RM` は**3ファイルにコピー済み**＝移植不要（staff:196-244, coach:158-244）。
- **annotationプラグインは3ファイルとも未ロード**（Chart.js 4.4.1 umdのみ）。水平線は annotation ではなく**通常dataset**で描く。
- player `drawTrainingCharts`(2911)は `dC` 無しで `new Chart` する**悪い手本**。staff/coach は必ず `charts`登録＋`dC()`先行。

### 置き場所
- **staff**: `goPlayerDetail`(2580) に6つ目のタブ「トレーニング」を新設。`goPlayerDetail(pid, openTab)` の2引数化（openTab未指定→基本情報=0にフォールバック。既存の全呼び出しは1引数なので安全）。実施状況一覧(`renderTrainingStatus`:3231)の行クリックはこのトレーニングタブを開いて飛ぶ。
- **coach**: タブ機構が無い（`renderPlayerReport` は1枚の縦スクロール）。**既存トレーニングセクション(coach:580-588)を、グラフ＋折りたたみ履歴に差し替え/拡張（書き直し）**。`$M()`/`ava`/`setTimeout(...,60)`/ダーク配色(ハードコード `#9FB0C8`等)に合わせる。`goPlayerDetail` はcoachに持ち込まない。

### タブ構成（上下2セクション）
**上＝種目推移（漸進性過負荷）**
- 種目セレクタ: その選手が実施した全 `exName` を `trim()` 正規化して集約。初期表示はBIG3(estBaseあり)、無ければ実施最多種目。状態は `window._trEx`/`window._trMetric`。**`goPlayerDetail` 冒頭で必ずリセット**（前選手の種目が残ると空グラフ）。セレクタは `selected` 復元。
- 指標トグル**3種**: 【**トップセット重量(初期表示)** / 推定1RM / ボリューム】。estBase無し種目はトップセット重量＋ボリュームのみ（推定1RM不可）。
- グラフ: カテゴリ軸＋日付ラベル（既存パターン、`date.slice(5)`）。**同日集約**＝トップセット重量:最大／推定1RM:最大／ボリューム:合算。canvas id=`ch-tr1rm`／charts key=`tr1rm`（既存と非衝突）。**指標/種目トグルは毎回 `dC('tr1rm')`→`new Chart` で作り直す**（`.data.datasets` 部分updateは禁止＝累積バグ源）。Y軸は指標で自動レンジ（kg系とボリュームを混ぜない）。
- **推定1RM**: tlog から再計算。候補セット=「`rir!=null` かつ `reps<=6` かつ `weight>0 && reps>0`」の中の**最大e1RM**（`estimateOneRM`）。**候補が無い日は点を打たない**（`spanGaps:true` で線をつなぐ or 点のみ。全null時は「記録なし」フォールバック）。理由: `estimateOneRM` は rir=null を RIR0(限界)扱いし過大評価する／高レップは推定が不安定。reps≤6に確定（≤8に緩めない）。
- **e1RM信頼度マーカー**: 採用セットのレップ数で区別（`reps<=3`=濃/通常、`4..6`=淡）。`pointRadius`/`pointBackgroundColor` を**配列**で渡す（Chart.js 4.x可）。
- **実測1RM(ph)水平線重畳**: 重量/推定1RM指標の時のみ、その種目の実測1RM(`getBest(pid,estBase)`)を**全ラベル同値の通常dataset**（`pointRadius:0`,`borderDash:[6,4]`）で重ねる。**その時は軸maxにph値を含める**（見切れ防止）。
- **実効強度%**: `トップセット重量 ÷ getBest(pid,estBase) × 100`。**`getBest` の null/0 ガード必須（0除算回避）**。phの**測定日を併記**。**100%超は異常値**＝グレー＋「ph更新推奨」表示（古いph由来の嘘を防ぐ）。ph無しは非表示。
- **種目別一行サマリー**: 「種目名: トップセット±Xkg / 推定1RM±Xkg / ボリューム傾向」。
- **前回比/7日比**: 前回比＝同一種目の直近過去セッション比。7日比＝6日前以前の直近（`getCompareVolume`のweekロジック）。**比較対象の実日付を併記**「7日比 +5kg(6/19比)」。
- **判断軸の優先順位を明示**: トップセット重量差 ＞ 推定1RM差 ＞＞ ボリューム傾向。**ボリューム傾向は矢印(↑↓→)のみ・数値を強調しない＋「※ウォームアップ込み参考値」明示**（アップ増減でボリュームが±数百kg動き偽トレンドになるため。トップセット重量はアップの影響ゼロ＝一次情報）。

**下＝セッション履歴（入口B）**
- 折りたたみ式。各行: 日付・メニュー名・種目数・総ボリューム・怪我バッジ。欠席ログは「欠席」表示（既存踏襲）。直近20件＋「もっと見る」。
- 展開で: 種目ごとに全セット `重量×回数 (RIR)`＋目標差（目標回数未達=赤／設定RIRより余裕=黄。`finishTraining`のアラート計算を踏襲）＋スキップ種目はグレー＋理由（「痛み・怪我」は赤強調）＋当日コンディション(RPE/睡眠 from `D.f`)を小さく添える。
- ボリューム表示に「※ウォームアップ込み」注釈。

### 共通の防御・作法（エンジニアレビュー反映）
- pid比較は `idEq` 統一（`===` 混在を避ける）。
- 集計から **skippedセット・absentセッションを除外**。`menuId` null（削除済みメニュー）は `mn?...:'メニュー'` でガード（coach:584手本）。
- 空配列／null値（weight・reps が 0 になり得る）／0除算／単一データ点（点表示で見せる）／`exName` の `trim()` 正規化、をすべてガード。
- staff: **dt5(トレーニングタブ)は pushView の fn 一括描画に入れない**。`dtTab(5)` が呼ばれた瞬間に `dC('tr1rm')`→描画する（display:none中の0高さ描画を回避）。`openTab`指定時は pushView の fn(setTimeout後) 内で `dtTab(openTab)` を呼ぶ。dt5を離れて戻った時も `dC`先行で毎回描画。
- coach: 常時表示の縦積み（display:none問題なし）。`renderPlayerReport` 末尾の `setTimeout(...,60)` に新チャート描画を追加。セレクタ変更は `renderPlayerReport(pid)` 全再構築 or `dC('tr1rm')`+該当canvasのみ、どちらも可。

### スコープ（初版に入れる／後フェーズ）
- **初版に入れる**: 上記すべて（3指標トグル・tlog再計算e1RM・信頼度マーカー・ph水平線・実効強度%・一行サマリー・前回比/7日比＋実日付・折りたたみ履歴・ウォームアップ注釈）。
- **後フェーズ（確定）**: working set volume集計（トップ重量90%以上のセットのみ）、本格ACWR/週ボリューム急増フラグ、停滞/後退の自動判定、種目名エイリアス統合、コンディション相関、種目別ボリュームの週次集計。

### レビュー結論
- プロトレーナー役: **最終Go**（漸進性過負荷の管理に必要な最小を満たし、数値が読み手を誤誘導する経路は塞がれた／科学的な嘘なし）。
- シニアエンジニア役: **着手OK**（🔴×3・🟠×2 すべてコードと整合する形で反映済み。残るは`getCompareVolume`移植時の`_curTLog`引数化という実装手順の留意のみ）。

---

## 完了タスクの記録（このフェーズの足跡）
- ~~素の `sv()` 掃討~~ → **完了（dd4d415）**。task_c3a91936 のチップは解消済み。
- ~~実機スモーク（フェーズ1）~~ → **完了（2026-06-26）**。テスト選手でA〜E全項目パス（プリセット入力・0kg/0回保存・連打ガード・通信断時の温存＆ボタン復帰・端末跨ぎ下書き復元）。
- ~~他入力画面の刷新~~ → **完了**。同じ安全土台で コンディション入力 → 怪我報告 → フィジカル/体組成 を順次適用（下記✅群）。共通ヘルパー(`isFilled`/`svSafeSeq`/`guardSubmit`)はplayerに整備済み。staff/trainer/coachへのフルセット横展開はユーザー判断で**保留**。
   - ✅ **コンディション入力（player）完了・push済み（commit b9fb119, 2026-06-26）**: `doCondition`(新規)・`doEditCondition`(修正)に guardSubmit＋失敗時ボタン復帰＆内容温存＋`isFilled`範囲(1〜10)チェックを適用。`svSafeUpdate`に後方互換のオプション第4引数`onError`を追加（既存3引数呼び出しは挙動不変）。`delCondition`は既に安全。モック新規16/16・修正12/12パス。
   - ✅ **怪我報告（player）完了・push済み（commit f3c3569, 2026-06-26）**: `doInjuryReport`(player:2124)の `if(!pain)` を `isFilled+範囲(1〜10)`チェックへ（0/空の誤検知を解消）。guardSubmit/releaseSubmitで二重送信ガード、`svSafe`ネスト→`svSafeSeq([i,r])`で失敗捕捉＆ボタン復帰＆内容温存。ボタンは`doInjuryReport(this)`。JXAモック6ケース全パス（空/0/11弾く・1/5成功でi→r保存・失敗でボタン復帰＆温存）。**実機スモーク未実施**。
   - ✅ **フィジカル/体組成入力（player）完了・push済み（commit ec3c2f5, 2026-06-26）**: 新規保存`doPhys`/`doBronco`/`doBCInput`を`svSafe`→`svSafeSeq`＋guardSubmit＋失敗onError(ボタン復帰＆温存)へ。編集`doEditPhysRec`/`doEditBC`の`svSafeUpdate`にguardSubmit＋onError追加（doEditPhysRecの記録不在分岐もボタン復帰）。`doBCInput`の`if(!w)`→`isFilled(w)&&w>0`。全ボタンに`this`付与。JXAモック14/14パス。**実機スモーク未実施**。
     - 補足: `doBIG3`(player:1346, svSafe残存)はonclickの無い**デッドコード**。今回未着手＝掃除候補。
   - ✅ **4サイト横展開＝0誤検知バグのみ修正で完了・push済み（commit e54949e, 2026-06-26）**。**ユーザー判断でフルセット横展開（guardSubmit/svSafeSeq/onError）は保留**、0誤検知バグのみピンポイント修正する方針に決定。
     - 調査結論: 数値必須入力を0で誤検知する保存バリデーションは **staff `doAddFatigue`(2533) の RPE 1箇所のみ**。`if(!rpe)`→`if(Number.isNaN(rpe)||rpe<1||rpe>10)`（staffにisFilled無いためNumber.isNaNでインライン）。JXAモック6/6パス。**実機スモーク未実施**。
     - trainer/coachには該当0誤検知なし。coachは保存処理ゼロ＝閲覧専用で対象外。staffの他`if(!x)`はpid/date/name等の文字列・ID系で誤検知ではない。
     - 保留メモ: staff(保存74箇所)/trainer(15箇所)に共通安全土台(guardSubmit等)を入れる横展開は未着手。必要になれば再開（trainer→staffの順、機能グループ単位推奨）。
   - ✅ **デッドコード削除・push済み（commit 2f6fd48, 2026-06-26）**: player `doBIG3`（onclick参照ゼロ）／staff `svAll`（全キーblind上書きの事故の火種・呼び出し元ゼロ）を削除。両ファイル構文OK。staff:2665のコメントにsvAll廃止理由が残る（履歴として温存）。

## ⚠️ 重大バグを発見・修正（2026-06-25）— 選手名簿の全消し事故
- 症状: REST APIでテスト選手を追加(74名)→約2分後に72名へ巻き戻り（既存「確認用」も巻き添え）。
- 原因: `staff/index.html` 起動処理。Firestoreの`p`取得が失敗/空/キャッシュミスだと `D.p` がINIT(72)のままになり、`if(D.p===INIT)sv('p')` が名簿をINIT(72)で**丸ごと上書き**していた。`sv()`は素の全上書きなので、読み込み失敗した端末がこれを実行すると本番名簿が消える。
- 修正(commit 3c3bc82): 取得成功フラグ `pDocPresent` を追加し、`if(D.p===INIT&&pDocPresent===false)sv('p')` に変更。**docが本当に不在の初回だけ種まき。読み込み失敗(null)や既存(true)では絶対に書かない。** JXAで4/4検証。
- 同種の危険が残存（別タスク化済み task_c3a91936）: `staff:1594` と `trainer:398` の saveChart に `injId` 無し時フォールバックの素の `sv('chart')`。svSafeUpdateへ要置換。
- 教訓: 素の `sv(k)` はどこにあっても全消しの火種。CLAUDE.md「保存は必ずsvSafe/svSafeUpdate」を全ファイルで徹底すべき（残りの素sv呼び出しを掃討する価値あり）。
- 復旧: テスト選手は修正push後に再追加し73名で安定確認済み。本番72名は無傷だった（消えたのはテスト用2件のみ）。

## ⚠️ 上書き事故の二次被害＝PIN消失と部分復旧（2026-06-25）
- PINは選手レコード内 `p.pin` に保存（player/index.html `doSetupPIN` が `latest[idx].pin` を svSafeUpdate）。INIT72名にはpin無し→**全上書きで全員PINが消えた**。
- バックアップ機構は手動JSONダウンロードのみ（`staff` の「CSV出力」画面下部 `exportAllJSON`）。**自動サーバーバックアップ無し／無料プランに版履歴無し**＝自動復元不可。
- 私が事故前(07:47)に取得していたスナップショット `/tmp/p_doc.json` から、当時PIN設定済みだった実在3名を復元: 前原 泰生(4649)/片島 大悟(1149)/森 泰造(0810)。確認用(1129)はテスト選手で消滅済み。
- 復元は「現在データをGET→該当3名にpin付与（既にpin有りなら尊重して上書きしない）→PATCH」の安全マージで実施。橋本 拓也(0425、事故後に本人が新規設定)は保持。現在PIN保持4名で安定。
- **未復旧の可能性**: 07:47〜22:30の間に他選手がPIN設定していた分はスナップショットに無く復元不可。ユーザーに手動バックアップ有無を確認中→ユーザーが今バックアップ取得予定。
- 再発防止: ユーザーへ「定期的に手動JSONバックアップ」を推奨済み。

## 実装済み（フェーズ1・player/index.html）
- **ステップ1 共通安全土台**（svSafeUpdate直後 446付近）: `isFilled()`(0を弾かない) / `svSafeSeq()`(複数レコード順次安全保存・部分成功通知) / `guardSubmit()`/`releaseSubmit()`(二重送信ガード)。純関数で後で他3サイトへ横展開可。
- **ステップ3 finishTraining堅牢化**: `_curTLog`非破壊（クリーンコピー保存）／片側だけ入力セットは確認ダイアログ・全空は無言除外／実質空は確認／`guardSubmit`＋`svSafeSeq(tlog→e1rm)`／tlog成功時のみ`clearTDraft`／失敗時は`_curTLog`・下書き温存＋ボタン復帰＋平易なalert。0kg/0回も有効値として保存可に。記録ボタンは`finishTraining(this)`。
- **ステップ2 下書き二層化**: localStorage即時＋Firestore`tdraft`間引き同期(3sデバウンス＋visibilitychangeでflush)。`tdraft`は選手ごと1件・`{pid,draft,updatedAt}`配列。**リスナーは張らない**（入力中の他端末上書き防止）。同期失敗は静かに無視（localStorageが信頼層）。`beginTrainingExec`はローカル優先→無ければクラウドfallbackで端末跨ぎ復元（📡別端末から引き継ぎ表示）。`clearTDraft`はローカル＋クラウド両方から自分を削除（他選手温存）。

## 計画フェーズ1の確定方針（grillingで決定）
1. 既存ファイルを段階的に作り替え（データ層=短いキー/svSafe/Firestoreスキーマは維持）。最優先は信頼性。
2. 先に共通の安全土台を整備: `isFilled()`(0を弾かない必須チェック) / `svSafeSeq()`(複数レコード順次安全保存) / `guardSubmit()`(二重送信ガード)。
3. 最初の対象画面 = トレーニング実施記録。
4. 未入力セットは保存前に確認ダイアログ（黙って捨てない）。
5. 下書きは localStorage＋Firestore(`tdraft`)併用（書込は間引き）。
6. UIは全種目1画面スクロール維持＋入力部品(±ステッパー/前回値ワンタップ)とデザイン刷新。
7. 検証 = 模擬実行＋テスト用選手1名で実機スモーク（本番データに触れない）。

## アスリートレビューの結論（条件付きGo）— 実装前に計画へ反映を検討
- 🔴 **計画の事実誤り**: 「`numStep`/`numStepHTML`(1217)を重量ステッパーに再利用」は不正確。
  `numStep`は`parseInt`＋整数`±dir`で **2.5kg刻み・小数に非対応**。step対応の改修が必須。
- 🔴 **オフライン耐性が最優先（計画に未定義）**: ジムWi-Fi弱前提なのに`svSafe`の圏外挙動が未定義。
  「保存中…」で固まり未保存→離脱が最悪。タイムアウト＋失敗時ローカル確定＋復帰時自動同期＋「未同期N件」可視化を
  ステップ1に格上げすべき。
- 🟠 確認ダイアログは「片方だけ入力」限定に（全空は黙って除外＋結果に注記）。初期セット行を減らし空セット自体を作らない。
- 🟠 重量は±ステッパーをやめ「前回値／+2.5／+5」ワンタッププリセット（`prevEx` 2304活用）。回数・RIRのみステッパー。タップ領域44px+。
- 🟠 下書きに `updatedAt` を持たせる: 同日同メニュー2回(実コード2203の日付+menuId判定)/古い下書き/複数端末 での誤復元・無言上書きを防ぐ。
- 🟠 ウォームアップセットの扱い未定義（推定1RM/ボリュームが汚れる）。
- 🟠 リマインド/通知ゼロ＝そもそも開かない問題。LINE運用等で別途明記。
- ◎ 良い点: 信頼性＞見た目の明言／データ層不触／破壊的変換をやめてクリーンコピー保存(2545地雷を撃ち抜く)／段階反映。

## 現状調査で判明した実コードの不具合源（player/index.html）→ **全て対応済み**
- かつての不具合源（`finishTraining`連打でtlog重複／片側入力セットの無言破棄＋`_curTLog`破壊／下書きlocalStorageのみ＋`tdraft`未使用／`if(!rpe)`/`if(!pain)`/`if(!w)`の0誤検知）は、上記✅群（フェーズ1＋安全土台適用＋0誤検知掃討）で**すべて修正済み**。
- 残す教訓: 数値必須入力は `if(!x)` ではなく `isFilled`（player）/ `Number.isNaN`＋範囲チェック（staff）で判定する。リスナーは入力中フォーム/サブビュー保護(447-464)を壊さないこと。

## 直近で完了したこと（新しい順）
- `78ebfbd` 「明日のリハビリ予定が永遠に残る」バグ修正（staff/trainer、tomorrowDateで日付振り分け）。
- `2f6fd48` デッドコード削除（player `doBIG3` / staff `svAll`）。
- `e54949e` staff `doAddFatigue` の RPE 0誤検知バグ修正。
- `ec3c2f5` フィジカル/体組成入力（player）に安全土台適用。
- `f3c3569` 怪我報告（player）に安全土台適用（pain0誤検知修正含む）。
- `b9fb119` コンディション入力（player）に安全土台適用。
- `dd4d415` 素の `sv()` 掃討（saveChart）＋PreCompactフック追加。
- `4517acf`/`74c44d0` フェーズ1（トレーニング入力ツール刷新）。

## リポジトリの状態
- ブランチ: main（origin/main と同期済み）。
- 作業ツリー: クリーン（未追跡の `.DS_Store` のみ。無視してよい）。
- 直近push: `93c5d9c`(怪我×リハビリ Phase0 データ基盤) → `9ce97a3`(同 Phase1 追跡指標セクション＋種別テンプレ確定)。

## 次の一手
- **🔴🆕最優先＝選手/スタッフサイト大規模機能追加のPhase 1から着手**（詳細は最上部「次セッションが最初にやること」節）。プラン＝`/Users/nakayamarinnin/.claude/plans/sequential-doodling-feather.md`。**ユーザー承認済み・実装未着手**。Phase1(staffバグ修正)→Phase2(push/pull自動化+スロット化)→…の順で1機能ずつ進める。
- （優先度が下がった＝上記の後回し）TimeTree連携フェーズ1「チーム共通プッシュ/プル表示」の実装（仕様は下の「TimeTree連携」節）。プラン＝`/Users/nakayamarinnin/.claude/plans/sleepy-spinning-stardust.md`。**ユーザー承認済みだが着手時期未定**。なお新プランのPhase2でも`pp`機構の自動化を扱うため、着手時は両プランの重複（`pp`キーの取り扱い）を突き合わせること。
- **✅完了済み（実機確認未実施）＝trainerサイト「ガイド付き評価フロー」9ステップ**（プラン＝`4-player-staff-trainer-coach-1-ux-merry-harbor.md`末尾）。実装・検証済み・push済み。凛人がORTHO_SOLO_OKにテスト名を追記して単独可を仕分ける臨床TODOのみ残（詳細は上のログ参照）。
- **✅完了済み（実機確認未実施）＝怪我管理×リハビリ連携 Phase 2（不足ゲージ）**（プラン＝`/Users/nakayamarinnin/.claude/plans/wise-drifting-moonbeam.md`）。staff/trainer両方のカルテ評価タブに実装・検証済み・push済み（コミット9c5d4fa）。
- 一括インポートの運用: 毎月スクショを私に渡す→出た予定テキストをstaff「📋一括インポート」に貼る。形式は `日付 | 種別 | タイトル | 時間`。
- その他（任意・保留中の候補）:
  - TimeTree連携の発展: 画像直アップ全自動(案B・AIキー+無料サーバーレス必要)、trainer/coachにカレンダー表示追加。フェーズ1完了後に検討。
  - player 3系デザイン（alert()のトースト化等）／coachレビュー未適用分／4サイト共通デッドコード削除。
  - （任意・保留中）フルセット横展開 — player で固めた `guardSubmit`/`svSafeSeq`/`svSafeUpdate(onError)` を staff/trainer に反映。trainer(15箇所)→staff(74箇所)の順。**ユーザー判断で現在は保留**。
  - 定期的な手動JSONバックアップの継続（staff「CSV出力」画面下部 `exportAllJSON`。PIN消失事故の再発防止）。
  - staffダッシュの疲労度アラート不発バグ（`var todayS`の巻き上げでlf.date比較が常にfalse）。別タスクチップ化済み（task_15a0aecc）。
- 着手時の作法: 1機能ずつ → 構文チェック → モック模擬実行 → 実装は溜めてpush/実機確認は最後にまとめて（ユーザー方針）。
- 残課題メモ（明日のリハビリ予定バグ `78ebfbd` 関連、任意）:
  - **選手ごとの表示**（staff:1036 の「次回:」/ trainer:845「本日のメニュー」等）は今も `tomorrowCats` を日付フィルタ無しで表示する。単一選手の文脈なので実害は小さく今回はスコープ外。気になれば対象日表示や期限切れ非表示を検討。
  - 旧 `rplan`（`tomorrowDate` 無し）はDBに残るが**非表示なだけで無害**。実際に予定を出したい選手は「次回メニュー」を再設定すれば翌日分として正しく出る。

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → 構文チェック → 動作確認 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
