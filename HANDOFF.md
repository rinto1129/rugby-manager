# 引き継ぎ書 (HANDOFF)

> このファイルは「会話をクリアしても作業を引き継ぐ」ための申し送り。
> SessionStartフックで新セッション開始時に自動で読み込まれる。
> **作業の区切りごとにClaudeが更新する。** 古い情報は上書きしてよい（旧版はgit履歴に全て残っている）。

---

## 最終更新
- 日時: 2026-09-14
- 更新者: Claude
- **測定会の特設ページ（ローカル・未コミット・2026-09-14）**: ユーザーのグリル16問→プラン `dev/audit/PLAN_msess_page.md`（3視点の敵対レビュー→反証で修正済み）→フェーズ1〜5を実装。項目制の測定会（`msess.items`）・選手×測定会で ph 1件（項目ごとの測定日/入力者/免除/提出）・staff 特設ページ `V.mp`（表＋列モード・セル即保存・免除・提出）・既存会の「特設ページ化」（統合の事前表示→2段階実行→Undo・冪等）・player の会の画面（差分送信）＋ホーム進行中カード＋今日やること・要対応キュー・書き込みゲート。本番の「第2回MAX測定」は統合すると 90件→59名（値違い2名・期間外4名・紐なし1件）＝push後にユーザーが画面から実行。**次＝全体レビュー→実機確認→commit/push**。 **→ 同日深夜に4視点の最終レビュー（confirmed 36件）を反映済み**（`phInMSess` は項目制で msessId 一致だけ／再統合で at・ex・submitted を維持／Undo は統合後の入力を残す／選手側は updateFn 内で提出済み再判定／分秒セルはフォーカスがペアの外へ出た時に保存／未提出はダッシュ情報層／複数の会は項目で振り分け 等。詳細=PLAN「実装状況」）。残り＝ユーザー確認→commit/push→本番で特設ページ化。
- **ウエイトグループ分け 改訂2（push済み `49aa52f`・2026-09-14）**: push済みv2を見たユーザーの要望で、選手の入力を元の「5限がある曜日・遠方・希望」に戻し、**スタッフだけが設定する「曜日の指定」**（申告一覧の編集＝自動/午前/午後）を追加。班の表示を**曜日タブ**（staff編集中・保存済みカード・player全班一覧）にし、「基本午前・火曜だけ午後」の選手は火曜タブの午後の班に「火のみ」で出る。ホーム組は曜日ごと（指定＞5限＞希望）に数えた多い方。レビュー（5視点＋反証→2回目＋反証→最終差分＋反証）で見つかったID衝突（代理編集の5限チェックと指定のhidden input）・代理保存の競合巻き戻し・曜日をまたぐゲスト操作・未配置の人のゲスト行残り・空の班を指すゲスト・保存完了で別の画面を閉じる等を修正済み。run_tests.py=tgroup系全PASS（失敗2件は夜間だけ落ちる既存の試合日テスト）・sync緑（identical 170）・residue 0。**次＝ユーザーの実機確認（Cmd+Shift+R・古いページのまま保存すると曜日の指定が消えるので強制リロードを周知）**。未対応の別件: 夜間だけ落ちる試合日テスト2本（test_matchday_dash_staff / test_matchday_todo）。詳細は `dev/audit/PLAN_tgroup_v2.md`「改訂2」。**旧形式64名への「アンケート更新」声かけは不要になった**（旧形式が正式形）。
- **ウエイトグループ分け v2 をフェーズ1〜6まで実装・push済み `fc09600`**。`run_tests.py`=96 run/0 fail・`sync_check.py`緑（identical168）・`--residue`0。本番データ（読み取りのみ）の試算で決定#4の「直近15日」は非怪我70名中39名が記録なしになると判明し、**ユーザー決定で「直近60日＋アーカイブ読込」「一部の種目だけ記録がある選手もある種目で比べて自動に含める」に改訂**（プラン#4に追記済み）。**次にやること＝選手へ「ウエイト時間帯アンケートの更新」を促す**（旧形式64名・未回答10名）。詳細は下のアクティブプラン節。
- **試合日チェック全面再設計はP1（P1a/P1b/P1c）まで完了・push済み**（`d30f040`→`df2f025`→`64d9599`）。P2以降（回復追跡/GPS紐づけ/出場記録/coach反映）は**ウエイトグループ分けv2の後に再開**（下記アクティブプラン節参照）。
- **ウエイト時間帯アンケートの対象曜日を月水金→月火木に変更・push済み `e2b00ee`**（player/staffの`WG_DAYS`＋文言＋テスト2本）。※v2で曜日別3択に作り替え済み（push済み・上記）。
- 単発対応: ダウンブロンコ記録一覧PDF（入力順44名＋未入力30名・本番Firestore REST読み取りのみ・reportlab CIDフォント・成果物はscratchpadのみ＝リポジトリ外）。
- 以下は2026-09-08時点の記録: **試合日チェック全面再設計に着手・P1a push済み `d30f040`**。9問ヒアリング（グリル形式）→4サイト横断調査ワークフロー（19エージェント・確定バグ9件）→設計ワークフロー（5フェーズ並列設計＋敵対レビュー5本）→プラン自体の3視点レビュー（見落とし/エラー/使いやすさ・mustFix10・shouldFix19・改善10採用）を経てプラン確定・ユーザー承認済み。プラン本文は `dev/audit/PLAN_matchday_redesign.md`（正典・詳細設計/レビューも同ディレクトリに永続化済み）。
  - **設計の要点**: 試合の正典を`cal`の`type:'match'`イベントに一本化（対戦相手/KO/会場/試合種別/メンバー表`squad`を追加フィールド）。旧`matchsel`（チーム全体1本のグローバル配列・試合ごとの区別不可）は完全撤去。共通ヘルパー`mdBelongsTo`等でmd↔試合の所属判定・重複判定・怪我/HIA判定を1箇所に統一。試合日チェックはコンディションと尺度統一（RPE×出場分・睡眠h・疲労/筋肉痛1-5）し、選手の必須項目を最小化。段階=P1a(試合基盤)→P1b(選手フォームv2)→P1c(スタッフレポート/代理入力/HIA承認)→P2(回復追跡)→P3(GPS/スタッツ紐づけ)→P4(出場記録)→P5(coach/trainer反映+CSV)。
  - **P1a完了内容**（4サイト・**push済み**）: 共通ヘルパー群20関数超をplayer/staff/coach（trainerはA群のみ）にidentical登録・`sync_check.py`に二重定義検出ゲートを追加。staffに`goSquadEditor`系（背番号提案・重複拒否・未設定/範囲外は1回警告で続行可・前回コピー・保存Undo）を新設し旧`goSelectMatchMembers`/`matchsel`関連を完全撤去。cal試合イベントにopp/ko/venue/comp編集フォーム＋日付/種別変更ガード（メンバー表/記録がある試合は変更・削除を拒否）。V.matchview/ダッシュボードを`pendingMatchChecks`ベースの試合ごとブロックに再構成（旧「昨日限定」二重実装と死コード`matchNotDone`を削除）。player側はP1b本実装までの暫定パッチ（`showMatchForm(dateArg)`で対象日付を明示）。matchselをSK/Dから4サイト全て削除。
  - 新規テスト4本（`test_matchday_helpers.js`＝player/staff/coach3サイト共通契約・`test_matchday_squad_staff.js`・`test_matchday_cal_staff.js`・`test_matchday_dash_staff.js`）＋既存フィクスチャ2本更新。**`run_tests.py`=84 run/0 fail（69本）**・`sync_check.py`（identical154+variant15）緑・`--residue`0。**本番Firestoreの実データ（実選手74名・8月の過去5試合分）で読み取り専用ブラウザ確認済み**（メンバー表エディタ・試合日レポートとも正常表示、古い試合日記録の「カレンダー未登録」疑似行も正しく拾えることを確認）。
  - ~~**次にやること**: P1bとP1cを同時実装~~ → **P1b/P1c完了・push済み**（2026-09-09。P1b `df2f025`＝選手フォームv2・催促・CRUD・冪等再送・テスト3本／P1c `64d9599`＝試合日レポート`goMatchReport`・代理入力`goAddMatchDay`・ダッシュボードmatchPanel最終形・HIA最上位ソート＋承認/却下svSafeUpdate化＋Undo・`hiaChartApply`・trainer要ケア一覧`matchCareList`・`svSafeSeq`をstaffへ移植（player/staff/trainer identical）・テスト4本。**run_tests.py=90 run/0 fail**・sync_check緑・residue0）。P1bで簡略化した3点（pending未送信値のフォーム復元／HIAと既存紐づけ怪我が両方脳震盪typeの統合／`T.match`の対象試合window=直近3試合固定）はP2以降で拾う。
- **ダウンブロンコ計測を追加・push済み**（`07d411d`→`d1f4d55`→`c74328b`）。フィジカル測定(ph)に`downbronco`（秒・小さいほど良い）を新設し、staff/playerの単体・一括・編集フォーム／一覧・選手詳細・CSV・PBアラート・クラブレコード／ランキング（速い順・前回比の極性）までbronco同型で対応。player/staff/coach共通の`getBest`/`getLatest`をタイム系種目対応に拡張。**保留**: ポジション別ゴールド基準バッジ（基準タイム未確定）／coachの分析サイト化（ブロンコ×ダウンブロンコの差分表示・ユーザー要望あり・次にやること候補）。
  - 併せて見つけた既存バグ2件を修正: ①staffの一括入力(`doBulkPhys`)がDOMに存在しないチンニング/クリーン欄を直接読んでいて実機で一括保存が必ずクラッシュ ②`d.getDate()-d.getDay()+1`が日曜だけ「来週の月曜」を返し、日曜だけ週次怪我チェックToDo・今週の予定・テーピング枠表示がずれる（`weekMonday`/`weekSunday`共通関数に一本化・player/staff5箇所＋テスト2本の同型誤りも修正）。日曜(2026-09-06)の実機で両修正を確認。
  - テスト65本・78実行（新規`dev/test_downbronco.js`）・`sync_check.py` identical125（+weekMonday/weekSunday）・residue 0。
- **✅ v2プラン「全面見直し＋デザイン再構築」が全フェーズ(P0〜P9c)完了・push済み `8dae0f6`**。各フェーズの詳細な実装ログ・設計判断・敵対的レビュー結果はgit履歴（各コミットメッセージ）を参照。要点のみ:
  - **横断基盤**: `chartUpdate`(P1・カルテの操作単位更新)／CRUD雛形v2(`guardSubmit`+Undoトースト・confirm/prompt全廃)／`roleGate`・`ROLE_MODE`(P4・リハビリ役割分担="soft"=日次記録は両者可・確定操作はstaff専任)／承認ルール(P7c・trainer/staff起票=即approved、player/match起票=要承認)／リハビリ1画面化(P7d)／選手側動的タブ(P8・怪我中は3タブ目がリハビリに切替)／生hex/rgba一掃(P9a・`sync_check.py --residue`でゲート化・残渣0維持)／`pitchProgressHtml`等ラグビーモチーフ統一(P9b)
  - **却下した設計（今後も再提案しない）**: ダークテーマ全面化(P3・ユーザーが実機で「みにくい」と却下→ライト維持。メモリ`feedback_prefers_light_theme`)／二次記録を正典ストアへ書く設計＝cond-bc materialize・休む→a書き込み(P7a/P7b・体組成/欠席が汚染されるため不採用。二次記録は「追加読み」で解く。メモリ`project_secondary_record_pollution`)
  - **検証基盤**: `dev/run_tests.py`(65本・78実行)／`dev/sync_check.py`(identical125+variant15+chart_counts+`--residue`)／`dev/hex_ledger.py`
  - 各フェーズの成果物一覧は下記「✅完了プラン」節のフェーズ表を参照

## 🔴 アクティブプラン: 測定会の特設ページ（フェーズ1〜5実装・未コミット）
- プラン本文（正典）: `dev/audit/PLAN_msess_page.md`（16決定＋レビュー反映＋実装状況）。メモリ `project_msess_page`。
- 実装: フェーズ1 共通基盤（`PH_ITEMS`〜`phSessSubmit`・`msessStatus`拡張）／2 staff 測定会の項目設定＋特設ページ化（`msessConsolidatePlan/Apply`・`goMSessConvert/doMSessConvert`・再試行・Undo）／3 staff `V.mp`＋導線一本化＋書き込みゲート／4 player `showPhysSessForm/doPhysSess`・`mySessCardHtml`・`mySessTodo`・`physEntry`・一覧のゲート／5 `reqQueue().msessPend`＋ダッシュボード・V.rank の BIG3 を種目ベスト合計に統一・dash「本日の測定会」死コード修正。
- テスト: `test_msess_items.js`（3サイト）・`test_msess_convert.js`・`test_msess_page.js`・`test_msess_player.js`。既存の msess/badges テストは無改修で緑。
- 最終レビュー（4視点・confirmed 36件）反映済み。残り: ユーザー確認→commit/push→ユーザーが本番で「第2回MAX測定」を特設ページ化（事前表示で 90件→59名を確認・先に全データバックアップ）。

## 🟠 完了プラン: ウエイトグループ分け v2（フェーズ1〜6実装・push済み `fc09600`・改訂2 `49aa52f`）

- **プラン本文（正典）**: `dev/audit/PLAN_tgroup_v2.md`（16決定＋2026-09-13の改訂＝#4を「60日窓＋アーカイブ・一部種目でも自動」に。末尾に実装状況）。
- **実装内容**:
  - フェーズ1 共通基盤（player/staff identical・`posUnit`はcoachも）: `liftKeyOf`（estBase明示＞種目名推定。「デット」表記ゆれ吸収・フロント/ブルガリアン/ルーマニア/ダンベル/インクライン/マシン等の変種はnull・本番texlist全77種目で検証）／`wgNorm`・`wgDayShift`／`tgLiftWeights`＋`TG_LIFT_DAYS=60`。**#11配線**: 選手のメニュー実行`startTrainingFresh`・種目追加`addTrainingEx`・推定1RM記録`bestE1rmPerBase`（player/staff identical＝rebuildも）がestBase未設定でも種目名から補完→スクワット/デッドの推定重量・推定1RM自動記録が揃う。staffメニュー編集に推定元ヒント、メニュー詳細に「〜から推定（自動）」。coach insPhysicalのFW/BK平均をposUnit経由に。
  - フェーズ2 申告v2: 選手プロフィール設定・staff代理編集を曜日別3択（午前のみ/午後のみ/どちらでも・未回答は未選択＝保存時に全曜日の選択必須）。旧形式(f5)は読み側`wgNorm`で変換し「旧形式・要更新」表示（本番64名が旧形式）。申告一覧は未回答→旧形式→v2の順。
  - フェーズ3 自動アルゴリズム（staff）: `tgAutoAssignShifts`（ピン＞3日同じ=固定＞多い方=申告＞同数は希望＞遠方＞同ユニットの少ない組）＋ゲスト曜日／`tgBuildBucket`（FW/BK分離・強い順にシード→加えた後の班内最大差が最小の人・端数1人は合流。分割/1人のままの方が10kg以上差が縮む時だけそちら）／`tgPlaceGuests`（逆の組の同ユニットで差が最小の班）／`tgEstWeights`（推定重量＝未配置のヒントと記録ゼロのピン選手の参照だけ）。`tgGenerate`はアーカイブ未読込なら読込後に実行。本番試算: 班内最大差 中央値20kg/90%点40kg。「比べられる種目数を優先」案は試算で悪化（25/50kg）し不採用。
  - フェーズ4 手動編集UI（staff）: タップ選択→「ここへ」で移動（午前⇔午後も可＝ゲスト付け直し）・選手同士/未配置⇔班の入替・ピン留め（未配置から入れた人は自動ピン）・未配置へ戻す・ゲスト移動/未配置化・班の追加/空班削除・人数(2〜4)/FW/BK分離の変更で組み直し（Undo）・班内最大差の色表示・未配置に「推定重量が近い班」提案（自動では入れない）・`tgResetState`のconfirm撤去→Undo。
  - フェーズ5 保存: `tgroup`は直近5件の履歴（末尾=最新＝選手に公開）・保存トーストで取り消し（記録とお知らせを削除）・「お知らせも投稿する」既定ON（ann・チーム宛て）・保存履歴カード（読み込む／引き継いで組み直す）・読み込み時に編成に居ない対象選手は申告どおりの未配置へ。
  - フェーズ6 選手側: `myGroupInfo`にguests/schedule。MY GROUPカードと全班一覧に曜日別の行き先（例「月・火: 午前 A班 ／ 木: 午後 C班（ゲスト）」）と班メンバーのBP/SQ/DL（選手端末のD.tlog＝直近15日分）。
- **テスト**: 新規`test_tgroup_helpers.js`（player/staff/coach）・`test_tgroup_algo.js`・`test_tgroup_ui.js`・`test_tgroup_save.js`、既存`test_tgroup.js`/`test_tgroup_player.js`を全面更新。`sync_check.py`の`var`種別がスカラー値（`var X=60;`）で後続コードまで読んで誤判定する不具合も修正。
- **残り（プランのフェーズ7）**: `fc09600`でpush済み。選手へ「ウエイト時間帯アンケートの更新」を促す（旧形式64名・未回答10名）のみ残り。※試合日チェック再設計P2以降はこの後に再開。
- **実装上の注意（今後も適用）**: 1セット重量は保存しない（表示のたび算出）／`p.wg`の移行処理は書かない（読み側wgNorm）／班分けは全選手のアーカイブを読む（起動時`kickTlogArch`のキャッシュを使う）／プレビューは本番Firestore直結なので「この編成を保存」「時間帯を保存」は押さない。

## 🟠 一時停止中プラン: 試合日チェック全面再設計（P1a/P1b/P1c完了・push済み。P2以降はウエイトグループ分けv2の後に再開）

- **経緯**: 2026-09-06に「昨日試合があったので試合日チェックを完璧に仕上げたい」と着手。グリル形式ヒアリング（9問・D1〜D9で決定）→調査ワークフロー（19エージェント・4サイト全量マップ＋確定バグ9件＋改善提案38件）→設計ワークフロー（5フェーズ並列詳細設計＋敵対レビュー5本）→プラン自体の3視点レビュー（見落とし/エラー/使いやすさ・計45件超をmustFix10・shouldFix19・改善提案10採用に統合）を経て2026-09-08にプラン確定・ユーザー承認済み。**プラン本文（正典）は `dev/audit/PLAN_matchday_redesign.md`**。詳細設計5本・敵対レビュー・プランレビューの統合結果も同ディレクトリに永続化済み（`design_matchday_*.md`／`review_matchday_*.md`）。
- **ユーザー決定（D1〜D9・再ヒアリング不要）**: D1 目的=怪我/攣り/疲労の早期把握・出場記録台帳・試合負荷×コンディション長期分析の3本柱を同等に／D2 試合の正典=`cal`の`type:'match'`イベント（対戦相手・メンバー表等は追加フィールド。旧`matchsel`は読み書きしない）／D3 スタッフがメンバー表（スタート/リザーブ+背番号）登録・選手が出場時間を自己申告／D4 選手は試合当日の夜まで入力（催促は当日〜3日）・翌日以降の回復は毎日のコンディションで追う（MD+nタグ）／D5 試合日チェックに一本化しコンディションと尺度統一（RPE×出場分・睡眠h・疲労/筋肉痛1-5）・試合日はf(コンディション)を書かず追加読みで集計に合流／D6 追加項目=脳震盪スクリーニング・攣りの詳細・パフォーマンス自己評価／D7 メンバー表=スタート/リザーブ+背番号（POS_NUMで初期提案）／D8 trainer要ケア一覧・coach試合レポート+個人履歴／D9 P1完成後に9/5分を遡り入力→P2回復追跡→P3 GPS/ms紐づけ→P4選手シーズン出場記録→P5 coach/trainer反映+CSV刷新。
- **フェーズ進捗**:

| # | 内容 | 状態 |
|---|---|---|
| P1a | 試合イベント拡張(opp/ko/venue/comp/squad)＋共通ヘルパー基盤(20関数超・identical)＋メンバー表エディタ(goSquadEditor)＋matchsel完全撤去 | ✅ push済み `d30f040`（run_tests.py 84run/0fail・sync_check緑・residue0） |
| P1b | 選手: 新試合日チェックフォームv2＋催促(pendingMatchChecks)＋CRUD＋冪等再送 | ✅ push済み `df2f025` |
| P1c | スタッフ: 試合レポート再構成＋代理入力＋ダッシュボード最終形＋HIA承認(chart.isConcussion連携)＋trainer要ケア一覧(前倒し) | ✅ push済み `64d9599`（run_tests.py 90run/0fail） |
| P2 | 回復追跡（MD+nタグ・f×md追加読み）＋催促（お知らせ一括・LINEコピー） | 未着手 |
| P3 | GPS・試合スタッツの試合紐づけ（evId） | 未着手 |
| P4 | 選手のシーズン出場記録（マイ試合履歴・CAPSバッジ） | 未着手 |
| P5 | coach試合レポート・trainer要ケア一覧・CSV刷新 | 未着手 |

- **P1aで確立した設計上の制約（P1b以降も踏襲）**: md↔試合の所属判定は`mdBelongsTo(m,ev)`1関数に一本化（evId解決可＋ev.id非null時のみevId比較、それ以外はdate一致＋同日複数はsquad所属優先）。怪我判定`mdInjuryLive`とHIA判定`mdHia`/`mdHiaLive`は二重計上しないよう分離（却下後は消える）。v2判定は`m.v===2`のみ・`mdLoad`は旧mdでnull許容。背番号(`num`)はmdに保存せず`mdNum(m)`でメンバー表から派生（二次記録禁止規約）。`svSafeUpdate`のupdateFnは複数回実行されうる前提で純粋関数として書く。新規テストは`drainMicrotasks()`（jscネイティブ組込・`drain()`ヘルパー経由で呼ぶ）を非同期呼び出し直後に必ず挟む。
- **関連する未着手の細部（旧記載・本プランP1cで解消予定）**: ~~週次怪我チェック・試合日記録の「新規」代理入力~~ → P1cの`goAddMatchDay`で解消。

## 🟡 一時停止中の別プラン: 怪我×リハ連携の高度化（設計ヒアリング完了・実装プラン未作成・試合日チェック再設計の完了待ち）

- **経緯**: 2026-08-05〜09にグリル（質問攻め）ヒアリングを実施し、下記28決定で設計をほぼ確定。最終確認の直前でユーザーが「先にやりたいことがある」と一時停止を指示（2026-08-09）。**再開時は再ヒアリング不要**。この決定リストを前提にPlanモードで実装プラン（フェーズ分割・データモデル・プリセット叩き台）を作るところから。
- **調査済み**: 4サイトのリハ関連コードを2つのWorkflow（計9エージェント）で全マップ。**全文は `dev/audit/research_rehab_v3_map.jsonl`（4サイト機能マップ）と `dev/audit/research_rehab_v3_details.jsonl`（細部検証）に保存済み**。実装前に必読。
- **調査の重要発見**（設計の前提）: STG(r.stage)/RTP(chart.rtpLevel)/resolved(i)の3軸が完全非連動・進段UIが3箇所重複実装で自動resolveの有無が経路依存・STG_CAT_BY_SYS(凛人監修済)が未配線・RETURN_CRITERIAは選手非表示の死にフィールド・medClearance/romLimitは「配管だけで蛇口なし」（入力UIも読み手もゼロ）・isConcussion/injTypeはstaffしか書けない（trainerの安全ゲートが起動しない）・変化チェック🚦は永続化されない・fitPassedはbroncoTarget未設定で恒久false（上肢/脳震盪が詰む）・player/match起票の承認はrレコードを作らない（段階管理対象外の怪我が発生）。
- **設計決定（28項目・全てユーザー選択済み）**:
  - **コア（基準システム）**: ①共通STG7段階を維持し、怪我種別単位の内蔵プリセット基準を追加（編集可・INJ_TEMPLATES拡張・適用時に怪我ごとコピー）②基準型は混合5種＝数値(臨床評価から自動判定)/チェック/時間(受傷後N日等)/復帰テスト連動/医師許可連動 ③ソフトゲート（未達でも進行可・警告＋定型理由選択＋任意メモを記録）④脳震盪のみハード寄り（24h時間型＝ハード・症状ありで強警告＋後退導線・コンタクト以降はmedClearance必須＝ハード）⑤鮮度窓＝根拠評価が7日(テンプレで可変)超なら「達成(要再評価)」に降格し全クリア通知を発火させない ⑥後退時＝数値は自動再判定/チェック・医師許可は保持(個別解除可)/時間型は進段日から再カウント ⑦全基準クリア→trainer To-Doバッジ「進段検討」ランク＋staff要対応チップの両方 ⑧進段時は選手が次に開いたとき1回だけ解禁演出（ピッチ図ライン越え・localStorage方式＝回復トーストと同様）
  - **連携・統合**: ⑨STG×RTP整合対応表→進段時に推奨RTPを1タップ提案＋範囲外の組合せに矛盾バッジ（2軸は維持。リハ内容と練習参加は別物）⑩resolvedは従来通り完全復帰時・復帰後要注意は別の軽いフラグ ⑪解禁は段階単位（段階ごと「できること」リスト）＋STG_CAT_BY_SYS配線＋rtpl段階フィルタ実効化＋段階連動でrplan下書き自動生成（rplanは1日分構造のまま・trainer側がtomorrowDateを照合しないバグも同時修正）⑫怪我中選手のトレーニング画面に禁忌(contra)・段階ベースの警告表示（tlog/tmenuのデータは別のまま）⑬受傷前値＝基準テンプレ適用時にph(フィジカル測定)から受傷日以前の直近値を基準レコードへ焼き付けコピー（trainerのph購読は増やさない）⑭変化チェック3問(痛み増/夜間痛/腫れ増)の結果をrlogに毎回保存（脳震盪preCheckの全怪我版）＋悪化検知→基準再判定＋後退提案（自動後退はしない）⑮medClearanceを正典化（受傷・診断タブに入力UI新設＝許可有無/日付/医師/許可範囲）＋RETURN_CRITERIAの「医師の許可」は自動連動 ⑯RETURN_CRITERIA12項目→怪我種別ごとに再編成して最終段階の基準へ吸収・既存chart.returnCriteriaのチェックは項目名一致で継承 ⑰怪我登録フォーム(staff/trainer両方)に種別選択を追加→injType/isConcussion/基準セット/追跡指標/禁忌が一括適用（現在の「カルテ評価タブでテンプレ生成」から移す）⑱休養日判定＝cal type='off'（チーム）＋メニューカテゴリ「オフ」（個人）で未実施検出から除外
  - **選手体験**: ⑲リハビリタブに「次の目標」カード新設（次段階の基準一覧＋達成チェック＋「あとSLR5°」残り表示）⑳基準ごとに臨床表記と選手向け文言の2つをプリセットに持つ（trainer/staffには臨床表記・playerには選手向け文言）㉑自動判定に使うのは臨床評価のみ（bySelf自己申告痛みは参考表示止まり）㉒選手のメニューチェックオフ記録とトレーナーのセッション記録は別rlogとして並存（byで区別・実施率は合算）
  - **適用・移行・スコープ**: ㉓player/match起票の承認時にrを自動生成（穴塞ぎ）㉔既存進行中の怪我はカルテを開いたとき手動適用提案バナー（自動適用しない・現在段階以前の基準は「適用時点で通過済み」扱い）㉕基準に直結するA群は同時修正＝進段3箇所(changeStage/advStage/advRehabStage)の1本化・ブロンコ免除手段(フィットテスト不要な怪我)・RTPレベル履歴化 ㉖B群の純掃除（削除カスケード孤児/confirm残存/rlog3世代表示/却下resolved流用/wc未連携）は同プラン終盤フェーズに分離 ㉗試合メンバー選考は今回触らない（別プラン）㉘プリセットの中身（各怪我の基準値・STG×RTP対応表・種別ラインナップ拡充）は実装時に凛人監修で確定（叩き台はClaudeがスポーツ医学標準に沿って作成）
- **未確認の前提**（再開時に一言確認すればOK・ユーザーは異論を示していない）: 進段権限はstaff/trainer両方可のまま／coachは個人レポート根拠ブロックに「次段階まであとn項目」を足す薄い反映のみ／基準テンプレ編集は両ロール可／複数怪我の選手は怪我ごとにカード表示。
- **旧プランPhase3-6の概要**（参考。上記28決定に実質吸収済み）: 種目提案＋安全ゲート＋医師clearance連携＋脳震盪対応／trainer pre/post記録／未実施検出／player・coach薄反映。
- **新設計で前提にすべきv2の基盤**: `chartUpdate`・リハビリ1画面化(P7d)・`roleGate`/`ROLE_MODE`(P4)・承認ルール(P7c)・CRUD雛形v2(Undoトースト)・`pitchProgressHtml`(P9b)。
- **関連する未着手の細部**（P6積み残し・B群と合わせて拾える）: staffのテーピング代理変更／週次怪我チェック・試合日記録の「新規」代理入力／trainer側の復帰テスト結果編集・削除／復帰テスト結果の編集フォーム／リハビリ実施記録の種目単位編集／脳震盪チェックの編集（詳細は下記フェーズ表P6の行を参照）

## ✅ 完了プラン: 全面見直し＋デザイン再構築 v2（ハイブリッド順序）

- **プラン本文**: `/Users/nakayamarinnin/.claude/plans/zesty-fluttering-kitten.md`（コピー: `dev/audit/PLAN_zesty-fluttering-kitten.md`）
- **ユーザー4決定**（2026-07-13）: ①ハイブリッド順序（tlog編集即納→デザイン基盤前倒し）②リハビリ=緩やか分担（確定操作のみstaff限定）③選手ナビ=動的タブ切替（怪我中は3タブ目がリハビリに）④新機能4セット全採用（PWA/Undo+週間振り返り/staff業務3点/coach強化+検索）

### フェーズ進捗（全完了）

| # | 内容 | 状態 |
|---|---|---|
| P0 | 基線記録＋検証基盤新設＋文書訂正 | ✅ push済み `2b008a4`（基線47実行全PASS） |
| P1 | 整合性バグ修正＋chartUpdate安全化（+ppCardHtml trainer同期） | ✅ push済み `65886da` |
| P2a | player: tlog編集/削除＋rebuildE1rmFrom（リプレイ方式）＋CRUD雛形v2（Undoトースト） | ✅ push済み |
| P2b | staff: tlog代理編集（tla_も可）＋共有関数移植（identical登録） | ✅ push済み `099337f` |
| P3 | ~~デザイン基盤前倒し（ダーク化）~~ | 🚫 **不採用・撤回**（ユーザーがダーク却下→ライト維持。実装は完了したがpushせず全revert） |
| P4 | リハビリ役割分担フレーム（緩やか分担・roleGate・trainer確定ボタン撤去） | ✅ push済み `2d82102` |
| P5 | player CRUD残り（怪我/rlog/痛み/wc/md/bc/tape/欠席/PIN） | ✅ push済み `585b926` |
| P6 | staff/trainer CRUD残り＋prompt()7箇所（staff6+trainer1）撲滅 | ✅ push済み `1b25310`。残: tape代理変更/wc・trainer rtest編集削除/rtest結果編集/rlog種目編集/preCheck編集（**md新規代理入力はP1c-7/8で実装済み(goAddMatchDay/doAddMatchDay)に消し込み・他は未着手のまま**） |
| P7a | 体重dedup＋sRPE実測化（durMin/effDur/sLoad） | ✅ push済み `6aa9713` |
| P7b | 欠席統一（今日は休む↔欠席a・coach追加読み） | ✅ push済み `ee08429` |
| P7c | 復帰フロー＋coach根拠＋承認ルール明文化＋トレーナー新規登録チップ | ✅ push済み `bf58d90` |
| P7d | 1フォーム化（受傷=軽量版・リハ1画面・選手側1シート・saveQuickEval廃止・pp編集staff集約・ブロンコ統合） | ✅ push済み `d1f8eaf` |
| P8 | IA再編＋新機能（player動的タブ/ホーム7ブロック/NO SIDE測定シート/staff6グループ+キュー+マトリクス/coach週報+検索） | ✅ push済み `2ae7860` |
| P9a | 生hex/rgba残渣一掃 | ✅ push済み `a7ef001` |
| P9b | モチーフ・アニメ仕上げ（pitchProgressHtml汎用化+RTPフィールドマップ+trainer移植） | ✅ push済み `c4de533` |
| P9c | 総回帰（P0基線比較・sync全量照合＝identical123/variant15・確定ドリフト7群修正・全サイト目視巡回・文書最終更新） | ✅ push済み `8dae0f6` |

### P0で新設した検証基盤（今後の開発でも使う）

| ツール | 用途 |
|---|---|
| `dev/run_tests.py` | 全65テスト・78実行を一括（対象サイト自動判別。新テストは先頭に`// 実行: jsc ... /tmp/<site>.js`必須）。基線: `dev/audit/baseline_tests.json` |
| `dev/sync_check.py` | 4ファイル同期照合（`dev/sync_manifest.json`=台帳。identical125/variant15/chart_counts）。共通関数を触ったら毎回実行。`--update`=variantの意図的変更の確定、`--residue`=生hex/rgba残渣ゲート（違反>0でexit 1・残渣0維持） |
| `dev/hex_ledger.py` | 生hex/rgba/グラデ台帳の再生成 → `dev/audit/hex_ledger.json`（P9aで残渣一掃済み。許可リスト=dev/audit/residue_allow.json 67値） |

### 検証テンプレ（今後のフェーズでも踏襲）
1. `python3 dev/run_tests.py`（全回帰・新規失敗ゼロ）＋新規テスト追加
2. `python3 dev/sync_check.py`（同期・new Chart数）
3. ブラウザは**読み取り専用巡回のみ**（プレビューは本番Firestore直結！保存ボタンを押さない）
4. push前に `git diff --stat` で対象外変更ゼロ確認→**ユーザー確認→push**→Cmd+Shift+R確認依頼

### v2プランで確立した実装上の制約（今後も適用）
- 保存は svSafe/svSafeUpdate/svSafeSeq のみ。**staff:1235付近の初回シード `sv('p')` は不可侵**（素のsv呼出はリポジトリ全体でこの1箇所のみ）
- スキーマは**追加フィールドのみ**（editedAt/source/durMin/deleted等）。既存データの移行処理はしない
- 単一HTMLファイル構成維持。共通関数・トークンは各ファイルへコピー＋sync_check.pyで照合
- 新規マークアップは**生hex禁止・var()のみ**
- 削除は論理削除優先＋Undoトースト。confirm()は新規コードで使わない（雛形v2）
- tlog編集はレコードの所在（D.tlog or tla_）を特定してからそのdocだけ触る

## 保留中の別プラン
- ~~TimeTree連携フェーズ1(pp)~~ → **実装済み・完了扱い**（ppCardHtml/ppFlip/ppUndo=staff:4431/trainer:923、ppAutoFlipもfinishTraining 4837に導入済み）

## 過去の重大事故と教訓（要点のみ・詳細はgit履歴の旧HANDOFF）
- **名簿全消し事故(2026-06-25)**: 読み込み失敗時に `sv('p')` がINIT72名で全上書き→修正済み(`3c3bc82`, pDocPresentガード)。素のsv(k)は全消しの火種。**定期的な手動JSONバックアップ**（staff「CSV出力」のexportAllJSON）をユーザーに推奨継続
- **プレビュー=本番Firestore**: ブラウザ検証で保存系を絶対に呼ばない（メモリ`project_preview_is_production_firestore`）
- **並行セッションの同時編集**でtrainerに関数重複・ppCardHtml取り残しが発生した前歴→着手前に`git log`確認＋sync_check.pyを習慣化
- 数値必須入力は `if(!x)` 禁止（0誤検知）→ isFilled / Number.isNaN＋範囲チェック
- guardSubmit(二重送信ガード)はplayerに導入済み。新規フォームには必ず適用（雛形v2に含む）

## リポジトリの状態
- ブランチ: main。origin/main=`5b4d426`（HANDOFF更新・2026-09-13。前段`e2b00ee`＝ウエイト曜日変更、`64d9599`/`df2f025`＝試合日チェック再設計P1c/P1b、`d30f040`＝P1a、`8dae0f6`＝v2プラン全フェーズ完了）。**ウエイトグループ分けv2はローカル実装済み・未コミット**（上記アクティブプラン参照）。試合日チェック再設計はP1完了・P2以降一時停止
- テスト用選手「テスト選手」(CTB/1年, note=動作確認用)が本番に1名存在（削除可）
- ⚠️ 検証はjsc模擬実行で完結（本番Firestore直結のためブラウザで代理編集/削除の保存ボタンは押さない）。最終目視はユーザーのCmd+Shift+R確認に委ねる
- **現在`run_tests.py`=96 run/0 fail（全緑・test_tgroup_*計6本／test_matchday_*計11本含む）**。`sync_check.py`緑（identical168）・`--residue`0。worktree(`claude/keen-kowalevski-01e4c2`)はP9cで整理済み（`git worktree remove`+`branch -D`済み）

## 運用ルール（このプロジェクト固有）
- データは「短いキー」で読む。保存は `svSafe` / `svSafeUpdate` を使う。
- 1機能ずつ → jsc構文チェック → 模擬実行 → 次へ。まとめて変更しない。
- git push の前は必ずユーザーに確認。それ以外の局所的・可逆な作業は確認不要で進める。
- 詳細は `CLAUDE.md` を参照（最重要ガイド）。
