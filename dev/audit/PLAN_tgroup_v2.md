# ウエイトグループ分け v2 プラン（重量近接＋FW/BK＋曜日別シフト＋手動編集）

確定日: 2026-09-13（グリル形式16問・全てユーザー決定済み・**再ヒアリング不要**）。状態: **フェーズ1〜6実装済み（2026-09-13・未コミット）→実機確認・push待ち**（末尾「実装状況」参照）。

## 背景（コードと本番データで確認済みの事実）
- 現行実装: staff `// ===== Phase 7: グループ分け` ブロック（`getLatestE1RM`/`groupScore`/`chunkGroups`/`tgAutoAssignShifts`/`tgMakeGroups`/`tgInit`/`tgGenerate`/`tgChipTap`/`tgAddUnscored`/`tgSave`/`tgWgBadges`/`tgReasonBadge`/`tgSavedCardHtml`/`V.tgroup`/`goEditWg`/`doSaveWg`、定数`WG_DAYS`）。player側は `myGroupInfo`/`myGroupCardHtml`/`showAllGroups`/`saveMyWg`/`showProfileSettings`（`WG_DAYS`定義あり）。テストは `dev/test_tgroup.js`(staff)・`dev/test_tgroup_player.js`(player)。
- 現行アルゴリズム: 申告`p.wg={f5:[曜日],far,pref,upd}`で午前/午後へ振分（5限あり→午前固定＞希望＞遠方→午後＞人数バランス）→シフト内を`groupScore`＝BIG3合計（種目ごと最新e1rm→無ければph最良。**1種目でも欠測ならnull=対象外**）降順で3人ずつ切る（端数4人）。手動は2タップ入替のみ。保存は`tgroup`を常に1件全置換。
- **本番`tgroup`docは未作成（一度も保存されていない）＝データ構造は自由に変えてよい**。
- データ問題: e1rmは73名中72名が1種目（ベンチ）のみ。原因＝メニュー`tmenu.exercises[].estBase`が「ベンチプレス(スピード)」にしか設定されておらず、「スクワット(スピード)」「デットリフト(スピード)」はnull → 推定重量表示も推定1RM自動記録も起きない。現行`groupScore`は**73名中31名が対象外**。
- tlog（本体docは`TLOG_KEEP_DAYS=15`日分・古い分は`tla_<pid>_<half>`へ移送）に1セット重量あり。直近3週で35名分。主要種目名: ベンチプレス(スピード)/スクワット(スピード)/デットリフト(スピード)/プッシュプレス/チンニング(スピード)。set形＝`results[].sets[]={weight,reps,rir}`、`results[].exName`、`results[].skipped`。
- FW/BK定義は staff の`computeAllBadges`内ローカル配列（`FW=['PR','HO','LO','FL','No.8']`,`BK=['SH','SO','CTB','WTB','FB']`）＝グローバル化が必要。在籍74名（FW36/BK38）。
- `tgResetState`が`confirm()`使用（雛形v2違反・要修正）。ドラッグ&ドロップ実装はリポジトリに無い（タップ方式で統一）。

## ユーザー決定（16項目）
| # | 項目 | 決定 |
|---|---|---|
| 1 | 目的 | バー/ラック共有時のプレート付け替え削減＝**1セット重量が近い人で組む**（BIG3合計は主指標から外す） |
| 2 | グループ数 | **全曜日共通の1セット**（PUSH日/PULL日で分けない） |
| 3 | 見る種目 | **ベンチ・スクワット・デッド**（種目名にベンチ/スクワット/デッドを含む or `estBase`付き。プッシュプレス/チンニングは使わない） |
| 4 | 値 | ~~直近15日（D.tlog本体）~~ → **直近60日（D.tlog本体＋アーカイブtla_を読む）の、その種目を含む最新セッションの最高セット重量**。記録無しは自動計算に混ぜず**プール→スタッフが手動配置**。**2026-09-13実装中に改訂（ユーザー決定）**: 本番で試算すると15日窓は9/4以降の記録空白により非怪我70名中39名が記録なし（数日でほぼ全員手動）→60日窓で3種目42名/一部16名/なし12名。**一部の種目だけ記録がある選手は、ある種目だけで比較して自動に含める**（プールは記録ゼロの人だけ）。選手画面の班メンバー重量表示は直近15日（選手端末のD.tlog）で算出 |
| 5 | プールのヒント | プール内チップに推定1RM由来の推定重量をグレー表示＋「推定」バッジ（自動には使わない） |
| 6 | FW/BK | **完全分離を既定**（FW班/BK班）。画面に「FW/BKを分ける」スイッチ、OFFで混合可 |
| 7 | 班サイズ | 画面で選択（2〜4人・既定3）。ラック上限は無し |
| 8 | シフト振分 | 現行ロジック維持（5限→午前＞希望＞遠方→午後＞バランス）。※#15で「曜日別」へ拡張 |
| 9 | 自動アルゴリズム | **強い順にシード→残りから「3種目それぞれの差の最大値」が最小の人を班サイズ分だけ取る**。班カードに「班内の最大差: BP/SQ/DL」表示 |
| 10 | 手動操作 | ①タップ移動（選手→行き先の班/プール/別シフト。人数増減OK）②2タップ入替③班の追加/空班削除④**ピン留め**（自動再計算で動かない。プールから手動配置した人は自動ピン）。「必ず同じ/別の班」制約は見送り |
| 11 | estBase自動補完 | 種目名に「ベンチ」「スクワット」「デッド」を含めば`estBase`を補う共通関数（除外語: フロント/スプリット/ブルガリアン/ゴブレット/ルーマニアン/片脚 等）。効果＝選手画面の推定重量・推定1RM自動記録が3種目揃う |
| 12 | 選手側表示 | MY GROUPカード・全班一覧に班メンバーのBP/SQ/DL 1セット重量を表示 |
| 13 | 履歴 | 直近5件保存＋保存トースト「元に戻す」＋「前回の編成を読み込む」（班とピンを引き継いで再計算）。選手には最新1件のみ |
| 14 | お知らせ | 保存時「お知らせも投稿する」チェック（既定ON）→`ann`へ「ウエイトグループが更新されました」 |
| 15 | 曜日別の事情 | 申告を**曜日ごと（月/火/木）に 午前のみ／午後のみ／どちらでも**の3択へ。3日同じ→固定、違う→多い方を**ホーム組**（同数なら希望＞遠方＞バランス）、違う曜日は**ゲスト**としてもう一方の組の「3種目が最も近い班（FW/BK一致）」へ自動配置・タップで変更可。選手側「月・火: 午前 A班 ／ 木: 午後 C班（ゲスト）」 |
| 16 | 入力と移行 | 選手の自己申告（プロフィール設定を3択×3曜日に作り替え）＋スタッフ代理編集（`goEditWg`）。旧`f5`は自動変換（5限の曜日→午前のみ、他→どちらでも、遠方/希望は維持、水金は破棄）し「旧形式・要更新」バッジ、再保存で消える |
| 17 | ついで修正 | `tgResetState`の`confirm()`→Undoトースト方式 |

## データモデル案（実装時の叩き台。追加フィールドのみ・移行処理は書かない）
- `p.wg` v2: `{days:{mon:'am'|'pm'|'',tue:...,thu:...}, far, pref, upd, v:2}`。旧形式（`f5`あり・`v`無し）は読み側で`wgNorm(wg)`により変換（`f5`にある曜日→'am'、無い曜日→''）。判定は`wg.v===2`。
- `tgroup`（1doc・配列・**先頭=最新**または末尾=最新は現行`recs[recs.length-1]`踏襲＝末尾最新。最大5件保持）: `{id,ts,date,by,mode:'ampm'|'single',size:3,splitUnit:true,excluded:[pid],pinned:[pid],shifts:[{key,label,groups:[[pid,...]],guests:[{pid,day,gi}]}]}`。`guests`＝ゲスト（その曜日だけこのシフトのgi班に入る）。
- 1セット重量は保存しない（二次記録禁止）。表示のたび`tgLiftWeights(pid)`＝`{bench,squat,deadlift}`をD.tlogから算出（player/staff identical・`liftKeyOf(exName,estBase)`で種目→基準種目を解決）。

## 共通ヘルパー（新設・sync_manifest登録）
- `liftKeyOf(exName,estBase)`→'bench'|'squat'|'deadlift'|null（#11の名前推定。player/staff identical。player側のメニュー実行で`ex.estBase||liftKeyOf(ex.name,null)`を使う）
- `posUnit(pos)`→'FW'|'BK'|null（player/staff/coach identical）
- `wgNorm(wg)`→v2形（旧形式変換・player/staff identical）／`wgDayShift(wg,day)`
- `tgLiftWeights(pid,logs)`→`{bench,squat,deadlift}`（直近セッション最高セット。player/staff identical）
- `tgEstWeights(pid)`（staff・推定1RM→今のメニューreps/RIRで`estimateWeight`。プールのヒント表示のみ）
- `tgGroupSpread(g)`→`{bench,squat,deadlift}`の班内最大差（staff）

## 実装フェーズ（1機能ずつ→jsc構文チェック→run_tests.py→次へ。push前にユーザー確認）
1. **基盤**: `liftKeyOf`/`posUnit`/`wgNorm`/`tgLiftWeights`を player/staff（posUnitはcoachも）へidentical追加＋sync_manifest登録＋`test_tgroup_helpers.js`。playerのメニュー実行（`estBase`参照箇所 5746付近・2510付近）と推定1RM記録に`liftKeyOf`フォールバックを配線（#11）。
2. **申告v2**: player `showProfileSettings`/`saveMyWg`を曜日3択に、staff `goEditWg`/`doSaveWg`/`tgWgBadges`を同形に。旧形式バッジ。既存テスト`test_tgroup*.js`のwg部分を更新。
3. **自動アルゴリズム**: `tgAutoAssignShifts`をwgNorm対応（ホーム組＋ゲスト曜日算出）、`tgMakeGroups`を#9（シード＋最大差最小）＋FW/BK分離＋班サイズ可変に置換、ゲスト自動配置（最近傍班）。`_tgState`に`size/splitUnit/pinned/guests`。
4. **手動編集UI**: タップ移動/入替/班追加・空班削除/ピン/ゲスト移動。チップにBP/SQ/DL・FW/BK色・推定バッジ・ピン。班カードに最大差。`tgResetState`のconfirm撤去。
5. **保存/履歴/お知らせ**: `tgSave`（履歴5件・Undoトースト・annチェック）・「前回の編成を読み込む」。
6. **選手側**: `myGroupInfo`をゲスト対応（曜日ラベル）、`myGroupCardHtml`/`showAllGroups`に3種目重量。
7. **テスト**: `test_tgroup.js`/`test_tgroup_player.js`全面更新＋新規（アルゴリズムの決定性・FW/BK分離・ピン不動・ゲスト最近傍・旧wg変換・履歴5件上限）。`sync_check.py`/`--residue`緑。HANDOFF更新。

## 実装状況（2026-09-13）
- フェーズ1〜6 実装済み（ローカル・未コミット）。`run_tests.py`=96 run/0 fail・`sync_check.py`緑（identical168）・`--residue`0。
- **改訂（ユーザー決定）**: #4の期間=直近60日＋アーカイブ読込（`TG_LIFT_DAYS=60`）。一部種目だけ記録がある選手は、ある種目だけで比べて自動に含める（プールは記録ゼロのみ）。選手画面の班メンバー重量は選手端末のD.tlog（直近15日）で算出。
- データモデル（実装）: `tgroup`=直近5件（末尾=最新）`{id(newId),ts,date,by,mode,size,splitUnit,excluded,pinned,shifts:[{key,label,groups:[[pid]],guests:[{pid,day,gi}]}]}`（未配置poolは保存しない＝読み込み時に`tgFillPools`で補う）。`p.wg` v2=`{v:2,days:{mon,tue,thu},far,pref,upd}`。
- アルゴリズムの細部（プランに無かった部分の決め）: 強さ=記録のある種目の「重量÷チーム中央値」の平均／候補の比較キー=[加えた後の班内最大差, −比べた種目数, 差の合計, 強さの近さ, id]／端数1人=最も近い班へ合流。ただし「直前の班と半分ずつ2班（計4人以上）」または「1人のまま」の方が変わる班の最大差が`TG_SPLIT_GAIN`=10kg以上小さいならそちら／自動振分バランスは同ユニットの人数が少ない組へ／ピン選手は前回の組を維持し、前回の班の核として埋める（記録ゼロのピン選手は推定重量で相手を選ぶ）／ゲストは曜日ごとに配置し、同点は人数の少ない班。
- 検証で不採用にした案: 「比べられる種目数を優先する」候補キー（本番試算で班内最大差 中央値20→25kg・90%点40→50kgに悪化）。
- テスト: `test_tgroup_helpers.js`（player/staff/coach）・`test_tgroup_algo.js`・`test_tgroup_ui.js`・`test_tgroup_save.js`・`test_tgroup.js`・`test_tgroup_player.js`。
- 残り（フェーズ7）: 実機確認→commit/push→選手へアンケート更新の声かけ（旧形式64名・未回答10名）。
