# 測定会の特設ページ プラン（項目を選ぶ測定会・複数日の分割入力・選手ごとの提出）

確定日: 2026-09-14（グリル形式16問・全てユーザー決定済み・**再ヒアリング不要**）。状態: **フェーズ1〜5 実装済み（2026-09-14・未コミット）→ 全体レビュー・実機確認・push待ち**（末尾「実装状況」参照）。

## 背景（コードと本番データで確認済みの事実）
- 測定会 `msess` は {id,name,startDate,endDate,mtype:'phys'|'bronco',note,createdAt,closed,closedAt,autoCreated,fromCalType} だけで**測る項目のリストを持たない**（staff dash 2568-2571 に `m.date`/`m.items` を参照する不発の死コードが1箇所）。
- 参加判定 `msessStatus`（player/staff identical）は「その会に属する ph が1件でもあれば done」（ブロンコ回は bronco!=null）。項目単位の進捗・提出は表現できない。
- `ph` は「選手×日付で1件（squat/bench/deadlift/chinning/clean/bronco/downbronco の固定列）」。player `doPhys` は同日重複を修正画面へ誘導する（ブロンコ単独だけ例外）。別の日に入れると別レコードになる。
- 集計側は二層: `getBest/getLatest/computeAllBadges/ランキング/クラブレコード` は**種目単位**で複数レコードに耐える。`big3(r)`（staff V.rank の big3・CSV）・`physAlertsData`・coach `physDeltas/insPlayer`・`goMSessDetail` の入力済み表（pid ごと最新1件）は**1レコード=1回の測定**を前提にしている。
- 本番（2026-09-14 読み取り）: 進行中「2026年第2回MAX測定」(9/7〜9/13, phys, 未締切) は 89件/58名、**29名が複数日に分けて入力**、**89件すべて選手の自己入力**（id の桁数で判別）。項目の内訳: チンニング53・DL41・BP40・SQ32・ダウンブロンコ25・ブロンコ2・クリーン2。過去2会はブロンコ会（締切済）。phskip 16件（id 有り1・msessId 有り16・理由15）。
- 特設ページに転用できる既製部品: 試合日チェック `showMatchForm`（イベント単位の特設フォーム）、`tdraft`（下書きの二層保存・今回は不要=値は即時反映）、フィットネスプログラムの項目ビルダー `_fitItems`（項目を選んで1レコードに持つ）、`guardSubmit/releaseSubmit/toast/svSafeUpdate`。
- 機械ゲート: 生hex/rgba 禁止（`sync_check.py --residue`）、confirm()/prompt() 禁止、identical 関数は sync_manifest 登録＋`sync_check.py` 緑、テストは jsc（`dev/run_tests.py`）。プレビューは本番 Firestore 直結＝保存系は押さない。

## 決定（16問）
| # | 質問 | 決定 |
|---|---|---|
| 1 | 入力する人 | **選手もスタッフも**（特設ページの項目セットが両方に出る。誰が入れたかは項目ごとに記録） |
| 2 | ページの単位 | **1回の測定会＝1ページ**（複数日・複数回の入力を束ねる。バッジ/皆勤賞の粒度は変えない） |
| 3 | 項目の範囲 | **既存7項目から選ぶ**（SQ/BP/DL/チンニング/クリーン/ブロンコ/ダウンブロンコ） |
| 4 | 提出 | **全項目が埋まったら提出ボタンが押せる**（明示） |
| 5 | 提出の単位 | **選手ごと** |
| 6 | 提出前の値 | **入力した瞬間から今までどおり反映**（ランク・ランキング・グラフ・バッジ。下書きは作らない） |
| 7 | 保存の形 | **選手×測定会で ph 1件＋項目ごとの測定日** |
| 8 | 項目の免除 | **項目ごとに免除できる（理由付き）**。免除は埋まった扱い＝提出できる。皆勤賞で欠席にならない |
| 9 | 測定会中の選手の自己入力 | **できる**（今の運用どおり。提出はスタッフが押す） |
| 10 | 測り直し | **後から入れた値で上書き**（値と日付が置き換わる） |
| 11 | 過去の測定会 | **今回の「第2回MAX測定」だけ特設ページ化**（項目を後付けし、既存89件を選手ごとに1件へ統合）。他の過去会は今の判定のまま |
| 12 | 既存のスタッフ入力 | **測定会中の入力は特設ページに一本化**（一括入力・測定会詳細の入力ボタンは特設ページへ誘導。単発の「記録追加」「記録の編集」は残す） |
| 13 | スタッフのページの形 | **選手×項目の表＋項目ごとの縦入力**（セルで即保存。項目見出しタップで全員分を縦に連続入力） |
| 14 | 提出後の修正 | **スタッフだけが直せる**（選手は見るだけ。提出の取り消しも可） |
| 15 | 選手のホーム | **進行中カード（項目ごとの済/残・入力ボタン）＋今日やること**。提出されたら「確定」表示 |
| 16 | 未提出の把握 | **特設ページ（項目別進捗・未提出一覧）＋ダッシュボードの要対応キュー** |

## データモデル
- 項目カタログ `PH_ITEMS`（player/staff/coach identical）: `[{k:'squat',label:'スクワット',short:'SQ',unit:'kg'},{k:'bench',…},{k:'deadlift',…},{k:'chinning',label:'チンニング',short:'CN',unit:'kg'},{k:'clean',label:'クリーン',short:'CL',unit:'kg'},{k:'bronco',label:'ブロンコ',short:'BR',unit:'time'},{k:'downbronco',label:'ダウンブロンコ',short:'DB',unit:'time'}]`。極性は既存どおり（time=小さいほど良い）。
- `msess.items`: 上のキーの配列（順序=表示順）。**items が非空配列の測定会＝「項目制」**（特設ページ・項目判定）。無い会は従来どおり。`mtype` は残す（バッジの伸び率MVPチェーン・getCurrentMSess の種別指定に使用。作成時は items から自動既定: bronco/downbronco だけなら 'bronco'、他は 'phys'）。
- `ph`（項目制の会の記録）: 選手×測定会で1件。`{id,pid,date:最初に入力した日,squat…downbronco,msessId, at:{squat:'YYYY-MM-DD',…}=項目ごとの測定日, by:{squat:'player'|'staff',…}, ex:{bench:'理由'}=免除（免除中は値 null）, submitted:true, submittedAt:ISO, inputAt:最終書込ISO, editedAt}`。既存の消費側は固定列だけ読むので無改修で動く。`at/by/ex/submitted` は項目制の会だけが持つ。
- 書き込みは1つの純粋関数に集約（player/staff identical）: `phSessApply(latest,{pid,sessId,newId,now,set:{squat:150},date:'YYYY-MM-DD',by:'player',ex:{bench:'理由'|null}})` → latest 配列内の (pid,msessId) 1件を更新（無ければ newId で新規）。値は「入力があった項目だけ」置き換え、他は触らない。`submitted` は `phSessSubmit(latest,{pid,sessId,on,now})`。newId/now/DOM値は updateFn の外で確定（再実行可）。
- 進捗（読み・identical）: `phSessRecs(sess,pid)`（その会に属する＝`phInMSess` の記録全件）／`phSessRec(sess,pid)`（1件。複数あれば inputAt 最新＝**未統合**として画面に赤バナー・セル入力と提出は無効化）／`phSessProgress(sess,pid)` → `{items:[{k,val,at,ex,by,done}],doneN,total,complete,submitted,unmerged}`（done = 値あり or 免除）。
- `msessStatus(s)` の拡張（identical・後方互換）: **done/skip/missed の3分割は項目制でも定義を変えない**（done=その会に属する記録がある選手。項目制は「値または免除が1つ以上ある記録」。皆勤賞・V.msess/goMSessDetail の件数・督促は従来のまま）。項目制の会だけ `submittedPids`（提出済み）と `inProgressPids`（done かつ未提出）を**追加**で返す。未提出の把握（決定#16）はこの2つだけを使う。`computeAllBadges` は無改修（会×pid で種目 max/min 集約済み・皆勤賞は done/skip のまま）。
- 「項目制の会が開いている」の定義は1本: `msessOpenItems()`＝`getCurrentMSess` と同じ判定（未締切＋開始日〜終了日+14日の猶予）で items 非空の会（複数なら期間内優先→開始日降順）。全ての振り分け・ガードがこれを使う。
- **項目制の会の ph を書く経路は `phSessApply/phSessSubmit` だけ**（ゲート一覧）: player `doPhys`（開いている項目制の会があれば `showPhysSessForm` へ）／player `showPhysForm('bronco')` の入口も同じ／player フィジカル一覧の「修正」「削除」は項目制の記録には出さない（未提出=「測定会ページで直す」リンク・提出済み=「確定」表示）、`showEditPhysRec`/`delPhysRec` は先頭で項目制の記録を弾く／staff `doAddPhys`・`doBulkPhys`・`doAddPhysForSess` は対象の会が項目制なら `phSessApply` で既存記録に追記（2件目を作らない）／staff `goEditPhys` の「紐づける測定会」から項目制の会を除外し、項目制の記録は特設ページで直す／`doDelPhys` は項目制の記録を削除不可（免除で代替）。
- 上書き（決定#10）の安全弁: 既に値がある項目を別の値で置き換えた時はトースト「SQ 150 → 140 に置き換えました（元に戻す）」で直前の値・測定日・入力者を復元できる。
- 締切 `closed` は従来どおり（スタッフ手動）。項目制でも「全員提出で自動締切」はしない（皆勤賞・バッジ確定の意味を変えない）。
- 記録の日付: 集計は `r.date`（最初の入力日。**会の期間内にクランプ**＝期間前の日付だと PB 判定の過去プール `r.date<startDate` に自分が入って PB が出なくなる）。グラフと「前回測定日」は `phDateOf(r,k)=(r.at&&r.at[k])||r.date`（identical）に寄せる（フェーズ5）。
- sync_manifest の登録単位: 読み系 `PH_ITEMS`(var)・`msessItems`・`phDateOf`・`phSessRecs/phSessRec/phSessProgress` は player/staff/coach、書き系 `phSessApply/phSessSubmit`・`msessOpenItems`・`msessStatus` は player/staff（coach に保存層は無い）。

## 画面
### スタッフ `V.mp`（特設ページ・URL状態 `window._mpSessId`）
- ヘッダ: 会名・期間・締切状態、項目別の進捗（SQ 40/58 …）、提出済/進行中/未着手/免除のみ の人数、「未提出の一覧」折りたたみ、検索（名前/ポジション）。
- 表: 縦=選手（怪我中は薄く・除外はしない）、横=items。セル=数値入力（time は 分:秒 の2欄）。**onchange で即保存**（`svSafeUpdate('ph',phSessApply)`・失敗は alert＋値を残す）。保存済みセルは項目の測定日（月/日）と入力者（選手/スタッフ）を小さく表示。セル右上の「…」で免除（理由の候補: 怪我／欠席／その他＋自由記入・prompt 不使用）と免除解除。
- 行末: 「提出」ボタン（complete のときだけ有効表示。`phSessSubmit` の updateFn 内でサーバー最新から complete を再判定し、不足があればトーストで項目名を返す）／提出済みは「提出済 ✓ 取消」。提出後も値は直せる（スタッフ）。
- 項目見出しタップ→**列モード**: その項目だけを全員分縦に並べ、Enter/次へで下の選手へフォーカス移動。未入力を上に。
- 再描画の作法: 画面状態（会id・列モード・検索語・並び）は `window._mp` に持ち、`V.mp` は描画前後で `#main-ct` の scrollTop を保存/復元する。セルの保存完了（✓・測定日）はそのセルだけ DOM を書き換え、全体再描画に頼らない。onSnapshot 再描画は既存ガード（入力中は再描画しない）のまま＝他端末の入力は次の再描画で反映。
- 未統合バナー: 同じ選手にその会の記録が2件以上ある（旧フォーム経由など）時は上部に「未統合 N名/M件・統合する」を出し、統合するまでセル入力と提出を無効化。
- 導線: `V.msess` のカード（項目制）に「特設ページを開く」、`goMSessDetail` の「記録入力」ボタンは特設ページへ、`acts.physical` の「一括入力」は項目制の会が開いていれば特設ページを案内。
### 測定会の作成・編集（staff）
- `goAddMSess`（新規作成）に項目のチェック（既定=直近の項目制の会の items、無ければ SQ/BP/DL）。mtype は items から自動既定（変更可）。**編集フォームで items を付け外しできるのは、その会に属する記録がまだ無い会だけ**（記録がある会は下の「特設ページ化」経由のみ＝items と統合は不可分。既存の非項目制の会を名前や日付だけ直しても項目制にならない）。
- 既存会の「特設ページ化」（`msessConvertToItems(sessId)`）: 項目を選ぶ（既定=その会の記録に1件でも値がある項目）→ **統合の事前表示**（N件→M名、各選手の項目別の採用値と日付、複数レコードの選手数、同じ項目で値が食い違う選手と採用/不採用の値、期間外の日付の記録）→ 実行は2段階: ①`svSafeUpdate('ph')` で会に属する記録（`phInMSess`＝msessId 無しの期間内も含める）を pid ごとに1件へ（項目ごとに (date,inputAt) が最新の値を採用・`at` にその日付・`by` は id 桁数で推定・`date` は最小を期間内にクランプ・`inputAt` は最大・msessId を明示・newId は pid ごとに外で予約・冪等＝既に1件で `at` 付きの選手は触らない）→ ②`svSafeUpdate('msess')` で items を設定。②が失敗したら「統合済み・項目未設定」表示と再試行ボタン（①は冪等なので再実行しても安全）。トースト「元に戻す」は ②→① の順に戻す（items を外し、統合前の記録を復元。復元は統合時に控えた記録で、統合後に別端末が書いた同会の記録があれば残す）。実行前に `exportAllJSON` を促す。**提出は付けない**（決定#4/#9: スタッフが確認して押す。done/皆勤賞は3分割のままなので影響なし）。
### 選手
- ホーム: 項目制の進行中の会（`msessOpenItems`）があれば**進行中カード**（会名・項目ごとに ✓/—/免除・「入力する」）。提出済みなら「確定 ✓（スタッフ確認済み）」。「今日やること」の「測定会: 残り SQ・BP」は**今日が会の期間内（開始日〜終了日）の日だけ**出す（猶予期間は進行中カードの注意表示のみ＝居座り行で「全部完了」演出が壊れるのを防ぐ）。complete または提出で done。従来の未入力アラートは非項目制の会だけに残す。
- `showPhysSessForm(sessId)`: その会の items だけを表示。入力済みの項目は値・測定日・入力者を読み取り表示にし、タップで編集欄に切り替える。保存は**変更した項目だけ**を `phSessApply(by:'player')` に送る（差分送信＝スタッフが直前に直した他の項目や測定日を巻き戻さない）。上書きは確認なし（トーストで元に戻せる）→ NO SIDE 結果シート（今回入れた項目）。提出済みの会は読み取り専用。免除は表示のみ。
- T.physical の「記録を入力する」は、項目制の会が開いていれば `showPhysSessForm`、無ければ従来の `showPhysForm`。
### ダッシュボード（staff）
- `reqQueue` に `msessPend:[{sess,pids}]`（項目制・未締切・猶予内の会の未提出者。urgentCount には入れない）。要対応パネルに「測定会『名』未提出N名 → 特設ページ」。dash 2568 の死コードは期間照合＋items 表示に直す。

## 実装フェーズ（1機能ずつ→jsc構文チェック→run_tests.py→次へ。push前にユーザー確認）
1. **共通基盤**（sync_manifest 登録は関数ごとの files で）: `PH_ITEMS`・`msessItems`・`phDateOf`・`phSessRecs/phSessRec/phSessProgress`（player/staff/coach）、`msessOpenItems`・`phSessApply/phSessSubmit`・`msessStatus` 拡張（player/staff。非項目制は完全に従来どおり＝既存テスト無改修で緑）。テスト新規 `test_msess_items.js`（3サイト）: 項目制の会で **提出0名でも done/skip/missed・皆勤賞・V.msess の件数が従来と同じ**、submitted/inProgress、phSessApply の純粋性・冪等・差分適用・上書き、日付クランプ。
2. **staff: 測定会の項目設定＋特設ページ化**: 作成の項目チェック（編集は記録の無い会だけ）、`msessConvertToItems`（事前表示・2段階実行・再試行・Undo・冪等・フォールバック記録の取り込み）。本番データ相当のフィクスチャ（90件/59名/29名複数・同項目の値違い2名・期間外日付3件・msessId無し1件）で統合結果をテスト。dash 死コード修正。
3. **staff: 特設ページ V.mp**: 表・即保存（セル局所更新・scrollTop 保持）・免除・提出/取消（updateFn 内で再判定）・列モード・進捗・未提出一覧・未統合バナー・導線一本化と書き込みゲート（doAddPhys/doBulkPhys/doAddPhysForSess/goEditPhys/doDelPhys）。テスト `test_msess_page.js`。
4. **player: セッション入力**: 進行中カード・今日やること（期間内のみ）・`showPhysSessForm`（差分送信）・提出後の読み取り専用・フィジカル一覧の修正/削除ゲート・`doPhys`/ブロンコ入口の振り分け。テスト `test_msess_player.js`。
5. **仕上げ**: reqQueue/要対応パネル、グラフの `phDateOf`、staff V.rank の big3 を種目別 max に統一（player と同じ）、CLAUDE.md/HANDOFF/sync 台帳、`--residue`。
6. **実機確認→commit/push**（ユーザー確認）。push 後にユーザーが「第2回MAX測定」を特設ページ化（統合は本番でユーザーが実行。事前表示で件数を確認）。

## 守ること
- 値は即時反映（決定#6）なので下書きストアは作らない。ただし **未提出の途中値は正典 ph に入る**＝既存の「1件=1回」前提の集計（staff V.rank big3・CSV・physAlertsData・coach deltas）は、項目制では1件に統合されるので正しくなる（フェーズ5で V.rank big3 を種目別に統一）。
- 非項目制の測定会・過去データの挙動は一切変えない（`items` の有無で分岐）。**done/skip/missed・皆勤賞・バッジの定義は項目制でも変えない**（提出は submittedPids 専用）。
- 項目制の会の ph を書けるのは `phSessApply/phSessSubmit`（と特設ページ化の統合）だけ。上の「ゲート一覧」の経路は全て振り替えるか弾く。「開いている」の判定は `msessOpenItems` の1本。
- 新規 UI は toast＋Undo（confirm/prompt 不使用）、var(--token) のみ、ic() アイコン、player はライト。

## 実装状況（2026-09-14）
- フェーズ1〜5 実装済み（ローカル・未コミット）。`run_tests.py` 全緑・`sync_check.py` 緑（identical 182）・`--residue` 0。
- 実装で決めた細部: 項目制の記録の date は「最初の入力日を会の期間内にクランプ」・`at[k]` に項目ごとの日付。グラフの x 軸は従来どおり記録の date（項目ごとの日付軸は Chart.js のラベル共有のため見送り＝`phDateOf` は表示用）。未統合（同じ選手に2件以上）はその選手の行だけセル入力と提出を無効化し、上部バナーから統合へ。V.mp の保存後はセルの補足と進捗ヘッダを局所更新し、全体再描画は入力中でなければ行う（scrollTop 保持）。単発「記録追加」「一括入力」は項目制の会が開いている間は `phSessApply(any:true)` で会の記録に追記（会の項目外の値も保存・進捗には数えない）。
- 本番データの試算（読み取りのみ）: 「第2回MAX測定」90件→59名・複数日29名・同項目の値違い2名（チンニング。後の日付の値を採用）・期間外の日付4名（期間内にそろえる）・紐づけ無し1件（取り込む）・再実行で不変。
- フェーズ6 全体レビュー（4視点＝データ層/スタッフUI/選手/退行ゲート・並列エージェント・confirmed 36件・全件コードで裏取り）→反映済み（2026-09-14 深夜）。主な修正: ①`phInMSess` は項目制の会では msessId 一致だけ（期間内の素の記録＝単発ブロンコ等を引き込んで未統合にしない）＋素の記録に項目制の会の msessId を付けない（player `doPhys`／staff `doAddPhys`/`doBulkPhys` の従来経路）②再統合で `at`（項目ごとの測定日）/`ex`/`submitted` を引き継ぐ・項目ごとの日付で採用・既に項目制の会は項目/種別を変えない ③Undo は統合後に入力があった選手を戻さない（統合記録の inputAt で判定）・種別も戻す ④選手の保存/元に戻すは updateFn 内で提出済み/未統合を再判定 ⑤分/秒セルは片方の確定で保存せずフォーカスがペアの外へ出た時に1回（部分保存→再描画で打ちかけの秒が消える問題）⑥`mpSave` 完了時の再描画は特設ページ表示中だけ・フォーカス復元・行だけ局所更新・保存失敗は再試行トースト ⑦免除理由の下書きは state ⑧未提出はダッシュの情報層（緊急枠に入れない）⑨複数の項目制の会が同時に開く場合は測る項目で振り分け（`msessOpenItemsAll/msessOpenFor`・ホームは会ごとにカード）⑩空の記録を作らない・値を消して未完了なら提出を外す・at/by 配列ガード・editedAt を付けない ⑪種別と項目の整合（ブロンコ会に time 項目必須等・`msTypeSync`）・締切済みの会に特設ページ化を出さない・0 入力は削除・測定日は日をまたいだら今日。テストは4本に追記（`run_tests.py` 102 run・msess 系全緑。赤2件は変更前からある深夜の時刻依存フレーク）。
- 残り: 実機確認→commit/push（ユーザー確認）→ユーザーが本番で特設ページ化を実行。

