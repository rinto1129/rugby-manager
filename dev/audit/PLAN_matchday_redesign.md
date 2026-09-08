# 試合日チェック 全面再設計プラン（試合＝カレンダーイベント正典・尺度統一・3本柱）

## Context

9/5(土)に試合があり、ユーザー（凛人＝スタッフ）はその「試合日チェック」を運用しつつ、機能自体を完璧に仕上げたい。
グリル形式のヒアリング（9問）→ 調査ワークフロー（19エージェント：全量マップ→バグ26候補→反証で9件確定→3視点38提案）→ 設計ワークフロー（5フェーズ並列設計→敵対レビュー5本）→ **プラン自体の3視点レビュー（見落とし/エラー/使いやすさ・45件超→mustFix 10・shouldFix 19・改善10採用）** を経て確定した。

**現状の構造的欠陥（コードで確認済み）**
- 試合を識別する単位が「日付文字列」しかない。出場選手リスト（`matchsel`）は試合ごとでなくチーム全体1本で、次の試合の選出を保存した瞬間に前の試合の母数が壊れる（`goSelectMatchMembers` の evid 引数は死変数。staff:8908）。
- 選手フォームの日付既定が「今日」＝翌日に入れると試合日とズレ、催促が永遠に消えない（player:4321-4323）。催促は「ちょうど昨日」限定で翌々日には消える（player:1690-1695 / staff:2109-2118 の二重実装）。
- 疲労1〜6・就寝/起床時刻という独自尺度で、毎日のコンディション（RPE1〜10・睡眠h・筋肉痛1〜5）と噛み合わない。試合当日のsRPEが取れず、週間負荷上「試合日＝負荷ゼロ」。
- 必須チェック無し（未入力が 0/6 で保存）、同一日重複ガード無し、保存失敗→再送で怪我(i)/リハ(r)が二重生成、md削除で i/r が孤児化、confirm()＋Undo無しのハード削除（雛形v2違反）。
- staff に代理新規入力が無い（P6積み残し）。試合レポートは提出者しか出ず未提出者が分からない。ダッシュボード 1815-1819 は描画されない死コード。
- coach は md/matchsel/cal を購読しながら参照ゼロ。trainer は md を購読すらせず、試合受傷は承認まで不可視。coach の approved!==false 除外が2箇所だけで却下済み怪我がKPIに残る。

**ユーザー決定（9問・固定・再質問しない）**
| # | 決定 |
|---|---|
| D1 | 目的は「怪我/攣り/疲労の早期把握」「出場記録の台帳」「試合負荷×コンディションの長期分析」の3本柱を同等に |
| D2 | 試合の単位＝**カレンダーの試合イベント（cal type:'match'）を正典**。対戦相手・メンバー表などは追加フィールドで持つ。旧 `matchsel` は読み書きしない |
| D3 | **スタッフがメンバー表（スタート/リザーブ＋背番号）を登録、選手が出場時間を自己申告**（スタッフ訂正可） |
| D4 | 選手は**試合当日の夜まで**に入力（催促は当日〜最大3日）。翌日以降の回復は毎日のコンディションで追う（MD+nタグ） |
| D5 | **試合日チェックに一本化し、尺度をコンディションと揃える**（RPE×出場分＝試合負荷／睡眠h／疲労・筋肉痛1〜5）。試合日は f を書かず「追加読み」で集計に合流 |
| D6 | 追加項目＝**脳震盪スクリーニング／攣りの詳細（いつ・どこ）／パフォーマンス自己評価1〜5**（水分・補食は不採用） |
| D7 | メンバー表の粒度＝**スタート/リザーブ＋背番号（1-15/16-23、POS_NUMで初期提案）** |
| D8 | 見せる先＝**trainer 要ケア一覧／coach 試合レポート（チーム集計）／coach 個人レポートに試合履歴** |
| D9 | 9/5分は**第1段階を仕上げてから遡って入力**。以降 P2回復追跡 → P3 GPS/ms紐づけ → P4 選手シーズン出場記録 → P5 coach/trainer反映＋CSV刷新 |

**Claude推奨で確定した細部**（承認時に却下可）: 睡眠は時刻でなく時間(h)／攣り部位5択／脳震盪疑い（衝撃あり＋症状1つ以上）は type:'脳震盪'・hia:true の怪我(i)自動起票＋staff新着カード【HIA】最上位・承認時に chart.isConcussion=true（scene 等は書かない）／催促は試合当日から入力されるまで最大3日／同一試合の二重登録はサーバー最新で再判定し編集へ誘導／削除はmdのみ＋Undo（怪我は残る旨をトースト）／後から痛みが出た場合は通常の怪我報告から「試合で受傷」を選んで md.injId でリンク、**逆に先に怪我報告済みなら試合日チェック側でその怪我に紐づける（二重起票しない）**／代理入力で怪我ありは staff起票扱い approved:true・proxy:true／メンバー外の選手も任意提出可（role:'none'・催促対象外）／旧データは表示互換のみ（移行なし・旧mdの編集は旧フォームのまま）／背番号は md に保存せず常にメンバー表から派生／`matchsel` は SK/D からも外して購読停止（doc は残置）／CAPS バッジの配点は 0pt／試合日に f を書かない副作用の補正（連続記録・提出率・督促）は P1 に含める／**選手フォームの必須は「出場区分・出場分・RPE（出場>0）・試合後疲労・筋肉痛・パフォーマンス（出場>0）」、睡眠h・試合前疲労・朝食は任意**（代理入力の必須は出場区分・出場分・RPE のみ＝スタッフに主観値を捏造させない）／試合イベントに **comp（公式戦/練習試合）** を任意で持つ（長期分析で分離）。

**安全上の前倒し（提案）**: trainer の「試合後の要ケア一覧（HIA最上段）」は D9 では P5 だが、脳震盪の見落とし防止のため P1c の末尾に前倒しする。不要なら P1c-14 を外す（その場合 P5-6 で実装）。

**参照資料**（実装時に必読。行番号は HEAD `c74328b` 基準。実装で行がずれるので関数名で再検索する）
- 現状マップ: `~/.claude/projects/-Users-nakayamarinnin-Documents------------rugby-manager/0ff9eb51-4ba7-453d-a2c9-214f23a399c0/tool-results/bmk11lk3l.txt` ／ 確定バグ9件＋提案: 同 `bltfhtlvy.txt`
- フェーズ別詳細設計＋レビュー: `/private/tmp/claude-501/-Users-nakayamarinnin-Documents------------rugby-manager/0ff9eb51-4ba7-453d-a2c9-214f23a399c0/scratchpad/design_{P1a,P1b,P1c,P2,P3P4P5}.md`, `critiques_partial.md`, `critiques_p1ab.md`, `plan_review_synth.md`（プラン自体の3視点レビュー統合）。元データは同セッション `tasks/{w3pqi3tkk,whzpjii80,w36h0050k,wu4g0a0gp}.output`。**P1a 着手時に `dev/audit/design_matchday_*.md` / `review_matchday_*.md` へコピーして永続化**（scratchpad はセッション限り）。設計ファイルと本プランが食い違う場合は**本プランが正**。

---

## データモデル（追加フィールドのみ・移行なし）

### cal 試合イベント（type:'match'）に追加（全て任意＝既存イベントは無いまま動く）
```
{ id, date, type:'match', title, detail,            // 既存
  opp:'福岡工業大学', ko:'14:00', venue:'',          // 表示は matchEvLabel(ev)= opp?'vs '+opp : title||'試合'
  comp:'official'|'practice'|'',                     // 公式戦/練習試合（任意・取込では付けない）
  squad:[{pid, num}], squadAt:ISO }                  // num 1-15=start / 16+=reserve（num昇順で保存）
```
### md v2（試合日チェック・player/staff が書く）
```
{ id, pid, date（=ev.date 固定）, evId（数値正規化）, inputAt, v:2,
  role:'start'|'reserve'|'none',                     // 背番号 num は保存しない（mdNum(m) で squad から派生）
  minutes(0-120), rpe(1-10・minutes>0 で必須),        // minutes=0 なら rpe/perf は省略
  sleepH(0-24・任意), breakfast・breakfastDetail（任意）,
  preFatigue（任意）, postFatigue（必須）, soreness（必須）, sorenessParts[], perf(1-5・minutes>0 で必須),
  injured, injId, injSide/injPart/injType/injHistory/injHow/injPainAt/injPainNow/injContinued/canPractice（既存名）, injLate,
  cramp, crampWhen('前半'|'後半'|'試合後'), crampParts[], crampFreq,
  hiaImpact, hiaSymptoms[], hiaInjId,
  note, proxy, recordedBy, editedAt, editedBy }
```
任意項目は未入力なら**フィールドを書かない**（null 扱い。mdAsCond の sleep は sleepH>0 のみ、mdTriage の睡眠<6h は sleepH!=null のときのみ）。試合負荷は保存せず `mdLoad(m)`（rpe と minutes が両方あるとき rpe×minutes、それ以外 **null**。合計側は `||0`）。**v2 判定は `mdIsV2(m)= m.v===2` の1本のみ**。旧md（role日本語文字列／fatiguePre・Post 1-6／sleepTime・wakeTime／evId無し）は `mdRoleLabel/mdFatigueStr/mdSleepStr/mdBelongsTo(date一致)` で互換表示し、**編集は旧フォームのまま**。
### i（怪我）に追加: `mdId`, `matchEvId`（数値正規化）, `painLevel`, `hia:true`（type==='脳震盪' のときのみ）, `hiaSymptoms[]`, `proxy`（代理入力時）
### gs/ms 索引に追加（P3）: `evId`（試合種別で試合を選んだときのみ・練習には付けない・**ms に kind は足さない**＝test_mstat:113 維持）
### ann に追加（P2）: `kind:'md-remind', refEvId, refDate, createdBy`
### 定数（identical・`var NAME=...;` 1行）
`MD_CRAMP_WHEN=['前半','後半','試合後']` / `MD_CRAMP_PARTS=['ふくらはぎ','ハムストリングス','大腿四頭筋','足裏','その他']` / `MD_HIA_SYMPTOMS=['頭痛','めまい','吐き気','もやもや','記憶が飛んだ','その他']` / `MD_MIN_QUICK=[0,10,20,30,40,60,80]` / `RATE5_LABELS` に `fat:['元気','やや疲れ','ふつう','疲れ気味','ヘトヘト']`, `perf:['不調','いまいち','ふつう','良い','最高']`（疲労=STRESS_EMO、perf=MOOD_EMO、筋肉痛=SORE_EMO 流用）/ `MD_RECOV_TH={sore:3,sleep:6,rpe:8,hiLoad:560}`（P2）/ `MD_CAPS_MILESTONES=[1,5,10,20,30,50]`（P4）/ staff専用 `SQUAD_RES_NUM={HO:[16],PR:[17,18],LO:[19],FL:[20],'No.8':[20],SH:[21],SO:[22],CTB:[22,23],WTB:[23],FB:[23]}`。役割ラベル表は定数にせず `mdRoleLabel` 内にインライン。

## 共通ヘルパー（正典名・契約。設計ファイル/レビューの別名は全てこれに読み替える）
共通契約: 全て ES5 の top-level function・idEq 比較・`(D.md||[])` ガード・null 安全・行末コメント禁止・**同名の二重定義禁止**。**svSafeUpdate の updateFn は Firestore 競合で複数回実行される（prelude モックは再試行しない）＝純粋関数にする: フラグ/配列は updateFn 先頭で初期化、newId は updateFn 外で予約、DOM 値は updateFn 外で読んだ変数を使う（手本: doRejectInjury staff:8602-8616）**。

| グループ | 関数（引数→戻り） | 配置 |
|---|---|---|
| A 試合/メンバー表（P1a） | `matchEvents()` cal type:'match' を date昇順（同日は String(id)）/ `matchEventById(id)`（**D.cal の参照同一性でメモ化**・id null→null）/ `matchEventByDate(date,pid?)` 同日複数は squadRole(ev,pid)!=null を優先・無ければ先頭 / `squadOf(ev)`→`(ev&&Array.isArray(ev.squad))?…:[]` / `squadNum(ev,pid)`→num or null / `squadRole(ev,pid)`→'start'(1-15)/'reserve'(16+/NaN)/null / `matchEvLabel(ev)` 生文字列 / `matchEvTitle(ev)` **escape済みHTML**＋ko / `matchEventKey(ev)`→String(id) or date / `resolveMatchEvent(key,dateHint)` id一致→date→疑似{id:null,date} | player/staff/trainer/coach |
| B md 読み（P1a） | **`mdBelongsTo(m,ev)`**＝所属述語の唯一の定義: idEq(m.evId,ev.id) なら true → evId が現存イベントに解決でき ev.id 非 null なら false → それ以外は m.date===ev.date かつ（ev.id==null または ev が matchEventByDate(m.date,m.pid) と idEq）＝同日複数は squad 所属優先・無ければ先頭にのみ属する / `mdOf(pid,ev)`（mdBelongsTo・複数なら inputAt 最新）/ `mdsOfEvent(ev)` 全件 / **`mdsOfEventUniq(ev)`** pid ごと inputAt 最新1件（集計用）/ **`mdDupIn(latest,pid,ev)`** latest 配列に mdBelongsTo な同 pid の md があれば返す（updateFn 内の重複再判定用）/ `mdIsV2(m)` / `mdRoleCode(m)` / `mdRoleLabel(m)`（マップ内蔵）/ `mdNum(m)`＝squadNum(matchEventById(m.evId)||matchEventByDate(m.date,m.pid),m.pid) / `mdLoad(m)`→数値 or null / `mdSleepStr(m)` / `mdFatigueStr(m)`（値<1は「未入力」）/ **`mdInjuryLive(m)`**→(a) m.injId!=null → idEq 一致の i、(b) 無ければ idEq(x.mdId,m.id)&&!injIsHia(x) の i、(c) !mdIsV2(m)&&m.injured のときのみ pid×date×source:'match'（旧データ専用）。いずれも approved!==false / **`mdHiaLive(m)`**→hiaInjId 一致 → 無ければ idEq(x.mdId,m.id)&&injIsHia(x)。approved!==false（脳震盪 type の怪我報告は injId===hiaInjId で両方 true が仕様）/ **`mdHia(m)`**＝hiaInjId!=null なら mdHiaLive(m)、無ければ hiaImpact&&symptoms≥1（却下後は消える）/ `injIsHia(inj)` / `hasCondOn(pid,dateS)`＝f または md がある / `pendingMatchChecks(pid,todayS,N=3)`→[{ev,date,daysAgo}]（mdOf 経由・daysAgo=Math.round((new Date(todayS+'T00:00:00')-new Date(ev.date+'T00:00:00'))/86400000）/ `matchChecksMissing(ev)`→未提出選手[]（D.p 在籍のみ・mdOf 経由） | player/staff/coach（trainer は P1c-14 で md 購読と同時に必要分） |
| B' 集計 | `mdTriage(m,mds)`→{rank,tags}（閾値は mdIsV2 の md だけで計算）（P1c・staff）/ `mdIsCap(m)` / `matchStatsFor(mds)`（P4・player/staff/coach。trainer には置かない） | |
| C 追加読み（P2） | `mdAsCond(m)`→f形の仮想レコード（mdIsV2 のみ・rpe null 可）or null / `condWithMd(pid,fromS,toS)` / `countCondOn(dateS)` / `matchDayOffset(dateS,N)`→{ev,n} / `matchDayTag(dateS)` / `recoveryFlags(r)` / `recoveryOf(pid,ev,N)`（ev null → null・days[].eval=soreness 回答有無・評価済み0日なら recovered null）/ `recoveryLabel(rc)`→wait/none/**na（筋肉痛未回答）**/ok/ng / `condLoad(r)`（player/staff）/ `agoStr(n)` を staff にも identical で追加 | player/staff/coach |
| D GPS結合（P3） | `sessForEvent(list,ev,needMatchKind)` / `sessRowOf(rows,pid)` / `mdMinutesShown(m,gpsRow)`→{v,src}（m null 許容） | player/staff |
| フォーム部品（P1b→P1c） | `chipsHTML(id,opts)` / `toggleChip(id,i)` / `chipVals(id)` / `setChips(id,vals)` / `clearChips(id)`（partChipsHTML 2807 と同型・既存は無改修）/ `svSafeSeq` を staff へ移植 | player/staff(/trainer) |

**集計は必ずヘルパー経由**: 試合に属する md の集合は `mdsOfEvent`（行表示）/`mdsOfEventUniq`（件数）、提出判定は `mdOf`、重複判定は `mdDupIn`、怪我 n は `mdInjuryLive`、HIA n は `mdHia`。coach `matchReportData`・trainer `matchCareList`・CSV も同じ（設計ファイルの自前 evId/date フィルタは無効）。

読み替え表: `mdIsHiaSuspect`→`mdHia`、`listChipsHTML/toggleListChip`→`chipsHTML/toggleChip`、`goSelectMatchMembers`→`goSquadEditor`、`matchEventTitle`→`matchEvTitle`、`RATE5_LABELS.fatigue`→`.fat`、`showMatchForm(dateArg)`→`showMatchForm(evId,from?)`、`mdMissingFor`→`matchChecksMissing`、`matchLoadByDate`→廃止（P2 は `mdLoad(r._md)||0`）。

**用語表**（画面文字列を統一・「出場選手設定/出場選手/メンバー選定」は全廃）: 選手入力＝「試合日チェック」（T.match 見出し・フォーム・詳細「試合日チェック 9/5 vs ○○」）／スタッフ集計＝「試合日レポート」（ナビ・goMatchReport タイトル）／1件詳細・修正・代理入力＝「試合日チェック（選手名・日付）」／「メンバー表」／coach・trainer の HIA 表記＝「脳震盪疑い（HIA）」。

---

## フェーズ構成と実装ステップ

進め方は CLAUDE.md 通り「1機能 → `dev/extract.py` + jsc 構文チェック → `dev/run_tests.py` 模擬実行 → 次へ」。各フェーズ末に `sync_check.py`（＋`--residue`）緑・HANDOFF.md 更新・ユーザー確認後 push。**P1a は単独出荷可。P1b と P1c は同時出荷**。

### P1a スタッフ: 試合イベント拡張＋メンバー表＋共通ヘルパー基盤（1〜1.5セッション）
実装順は **基盤→他サイト同期→台帳→ヘルパーテスト→UI**（台帳登録前に4サイトへコピーしないと sync_check が MISSING で赤）。
1. [staff] `POS_NUM` を staff:572 `var POS` 直後にコピー（identical files に staff 追加）＋ `SQUAD_RES_NUM`。
2. [staff→player→coach→trainer] グループA＋B（上表の P1a 分。`mdBelongsTo/mdDupIn/mdsOfEventUniq/hasCondOn` 含む）を staff:777 `sLoad` 直後に1ブロックで定義 → player:578 直後、coach:314 `escapeHtml` 直後に正規化後バイト一致でコピー。trainer は A群のみ（906 `idEq` 直後）。
3. [dev] sync_manifest 登録（POS_NUM 4ファイル・A群 4・B群 3）→ `sync_check.py` 緑。**`dev/sync_check.py` に「identical 名の同一ファイル内二重定義（function は `^\s*function NAME\s*\(`、var は `^\s*var NAME\s*=` の出現≥2）を NG」とする検査を追加**。
4. [dev] `test_matchday_helpers.js`（player/staff/coach 3サイト・先頭に実行行3本）: matchEvents 順序・matchEventById の D.cal 差し替え後の失効・matchEventByDate の pid 優先・squadOf の ev null・squadRole 境界・**mdBelongsTo（evId 一致／孤児 evId の date 救済／疑似イベント／同日2試合で旧 md は squad 所属優先→先頭のみ）**・mdDupIn（同日 A 提出後に B は dup にならない）・mdsOfEventUniq・mdLoad 旧 null・mdSleepStr 旧時刻換算・mdFatigueStr 未入力・**mdInjuryLive/mdHiaLive の4ケース（HIA のみ起票した v2 md → mdInjuryLive null・mdHia true／脳震盪 type の怪我報告 → 両方 true・同一 id／v2 md(injured:false) は同日 source:match の i に date フォールバックしない／旧 md(injured:true) は date×source で拾う・却下は除外）**・hasCondOn・pendingMatchChecks の窓/squad 無し除外/メンバー外除外・matchEvTitle の escape。
5. [staff] `calEventFormHTML`(8668): type==='match' 時のみ `#cef-match`（display:grid/none）に `#cef-opp/#cef-ko/#cef-venue/#cef-comp`（公式戦/練習試合/未設定）（`calTypeChanged`/`calMatchFieldsRead` 新設）。
6. [staff] `doAddCalEvent`(8681)/`doAddCalEventForDate`(8763): opp/ko/venue/comp を保存、title 空なら `'vs '+opp` 自動補完（TimeTree 取込との重複は手動確認）。
7. [staff] `showEditCalEvent`(8692)/`doEditCalEvent`(8705): 試合フィールド読み書き。detail 内の時刻は **value に入れず「候補 14:00 を使う」ボタン**。squad は in-place 保全、「メンバー表 n名登録済み」＋`goSquadEditor` ボタン。**updateFn 内で squadOf(latest[idx]).length>0 または D.md に mdBelongsTo な md があるとき、type!=='match' への変更または date 変更は blocked（updateFn 先頭で初期化）→ releaseSubmit＋alert「メンバー表/試合日チェックが登録済みの試合は日付・種別を変更できません」**（opp/ko/venue/comp/title/detail は自由）。DOM 読みは updateFn 外の変数で。
8. [staff] `goSelectMatchMembers〜saveMatchSel`(8905-8945) を **`goSquadEditor(evId)`** 系に全置換: `_squadTemp{pid:num}`（D.p に居ない pid は除外して toast）・`squadProposeNum`（POS_NUM→SQUAD_RES_NUM→16..23→1..23）・`squadToggle/squadSetNum/squadAutoNum/squadClearAll/squadFilter/squadSummary`（重複番号 bd-r・未設定 bd-a）・**「前回のメンバー表をコピー」（直近の squad あり試合から・不在 pid 除外）・「選出のみ表示」トグル＋num 昇順のチームシート要約**・`saveSquad(evId,btn)`（検証は**重複番号のみ拒否**、未設定は1回の警告で続行可（reserve 扱い）・24〜30 は警告のみ→guardSubmit→`svSafeUpdate('cal')` で idEq upsert・matchsel には書かない・**保存 toast に「元に戻す」（保存前 squad/squadAt を退避して復元）**）。
9. [staff] カレンダー導線 2554-2556 / 8659-8661 のボタンを「メンバー表 n」(`goSquadEditor`) に置換＋opp/ko/venue/comp 行（escapeHtml）。ダッシュボード「今日の予定」2073-2077 の時刻を `e.ko||e.time||'終日'` に、**match 行に「メンバー表」ボタン**、`postAnnounceFromCalendar` 8786 の試合行に KO/会場を併記。
10. [staff] `V.matchview`(2396) 行ソースを「cal 試合 ∪ md 日付」に（冒頭 `var todayS=todayStr()`・提出 n/N は squad∩mdsOfEventUniq＋「+n」（メンバー外）・matchEvTitle・comp が practice なら bd「練習試合」・未来は NEXT・メンバー表ボタン）。**cal 由来のみ（md 無し）の過去行は「30日以内 or squad あり」に限定し、それ以前は末尾の折りたたみ**。※P1c-3 で最終形に置換。
11. [staff] ダッシュボード: 1815-1819 死コード削除、2109-2119 を削除し **`matchPanel` 変数を submissionPanel(1984) 直後に生成して 2101 の連結列に差し込む**（pendingMatchChecks ベース・試合ごと・残り n名（提出 d/N）・経過日バッジ）。P1c-11 は中身だけ差し替える。
12. [staff] `doDelPlayer`(5045) カスケードに `cal.squad` からの除去（`latest||[]` ガード）。`delCalEvent`(8771): squad 登録済み or mdBelongsTo な md がある試合は alert で拒否。
13. [staff] `doCalImport`(8892): match 行の time を `ko` に格納（comp は付けない）。
14. [staff] help 2366 を実導線に修正（ボタン名「メンバー表」＋対戦相手/KO/会場の行）。SK(567)/D(1199) から `matchsel` 削除（`grep -n matchsel staff/index.html` 0 が完了条件）。
15. [player] SK(408)/D(952) から `matchsel` 削除。`todayTodoHtml` 1690-1699 を `pendingMatchChecks` ループに置換。**単独出荷期間の確定バグ#1 対策として暫定パッチ**: `showMatchForm(dateArg)` で日付欄の value を dateArg 優先にし、todo の onclick と T.match(2753) のボタンから対象日付（直近試合）を渡し、フォーム上部に「対象試合日」を表示（P1b-4 で evId 版に置換）。
16. [coach] SK/D(216-217) から `matchsel` 削除。
17. [dev] テスト: `test_matchday_squad_staff.js`（24名でも保存できる・前回コピー・重複拒否・保存 Undo）・`test_matchday_cal_staff.js`（squad あり試合の date 変更が拒否され cal 不変・comp 保存）・`test_matchday_dash_staff.js`（**P1c で書き換える前提・維持する期待＝matchNotDone 不在/5日前非表示/D.cal=[] 非表示**）。既存 `test_dash.js:76-77＋86`・`test_home_p8b.js:31-32` のフィクスチャを `D.matchsel=[1]` → `cal[].squad=[{pid:1,num:1}]` に（**担当は P1a のみ**）。
18. [docs] CLAUDE.md: データキー一覧の `matchsel` を「旧・残置・読み書きしない・exportAllJSON 対象外」に、cal 追加フィールドを追記、保存層の節に updateFn 純粋関数規約を追記。HANDOFF.md フェーズ表に P1a。

### P1b 選手: 新試合日チェックフォーム v2＋催促＋CRUD（2〜3セッション）
1. [player] 定数追加（`RATE5_LABELS.fat/perf`、`MD_CRAMP_WHEN/MD_CRAMP_PARTS/MD_HIA_SYMPTOMS/MD_MIN_QUICK`）2773 付近。
2. [player] 汎用チップ部品 `chipsHTML/toggleChip/chipVals/setChips/clearChips` を 2825 付近。
3. [player] **`var _mdPending=null` をメモリ正とし sessionStorage（key 'rm_md_pending'）はミラー**（保存時 try{setItem}、showMatchForm 描画時と doMatch 冒頭で `_mdPending||try{JSON.parse(getItem)}` で復元）。`dev/prelude.js` に localStorage と同型の sessionStorage モックを追加。`updMdLoad/mdRoleChange/mdHiaToggle/updEMdLoad/emdRoleChange` を定義。
4. [player] **`showMatchForm(evId,from)`**(4321) 全面改修: ev 解決（evId→`matchEventByDate(today,myPid)`→pending最新→null なら案内）、`mdOf` 重複なら「入力済み→修正画面」、同 sig の pending があれば「未送信分があります→再送」バナー、ヘッダに試合カード（date/opp/ko/venue）、日付 input 無し、**当日かつ now<ko なら alert-info「試合後に入力してください（送信は可能）」**。**必須ブロックを上・任意を下、送信ボタンは position:sticky;bottom**。①出場 `#md-role`(squadRole 初期値・背番号は表示のみ)＋**出場分クイックチップ `chipsHTML('md-minq',MD_MIN_QUICK)`**＋`#md-min`(start既定80/reserve空/none 0固定)＋`#md-rpe`＋負荷プレビュー ②`rate5HTML('md-fpost')`・`rate5HTML('md-sore')`+partChips・`<div class="fl" id="md-perf-wrap">rate5HTML('md-perf')</div>` ③怪我（既存 4330-4339 の id 維持）＋**既に報告済みの怪我（同選手・未解決・approved!==false・source player/match・mdId 無し・|date−ev.date|≤1日）があれば alert-info「既に報告済みの怪我があります: 右膝 捻挫（9/5）」＋チェック「この試合の怪我として紐づける（新しく登録しない）」既定ON** ④攣り: `#md-crampwhen`＋`chipsHTML('md-crampparts')`＋既存頻度 ⑤頭部 `#md-hia`→`chipsHTML('md-hiasym')`＋alert-down「送信するとスタッフ・トレーナーに『HIA疑い』として届き、確認までリハビリタブが出ます。症状が無いと確認されればすぐ元に戻ります（申告して損はありません）」 ⑥任意: 睡眠h・`rate5HTML('md-fpre')`・朝食（既存 id）・`#md-note`。`showSub(h,'match','試合日チェックに戻る')`。
5. [player] **`doMatch(evId,btn)`**(4345): 必須チェック（**未入力項目を1回の alert に列挙し先頭要素へ scrollIntoView**）→ ローカル `mdOf` 事前チェック → guardSubmit → id 予約（pending の ids 再利用）→ rec 組立（v:2/evId 数値正規化/date=ev.date/任意未入力はフィールドを書かない）→ 怪我: 既存 i に紐づける場合は i/r を push せず rec.injured=true・rec.injId=既存 id・canPractice/injPart/injSide/injType/injPainNow を i から転記、新規なら i（source:'match',approved:null,mdId,matchEvId,painLevel）＋r／HIA（衝撃＋症状≥1）なら type:'脳震盪'/part:'頭部'/hia:true の i＋r（怪我報告が脳震盪なら二重起票せず hia:true）→ **i/r は `svSafeSeq`、md 本体は最後に `svSafeUpdate('md')`：updateFn 先頭で dup=false、`mdDupIn(latest,myPid,ev)` が dup を返したら push せず、dup に injId/hiaInjId が無く今回の ids が savedIds にあれば injured:true・injId・inj*・injLate:true／hiaInjId・editedAt を dup に転記**（既に injId があれば何もしない）→ 成功後、既存 i 紐づけ時は `svSafeUpdate('i')` で該当 i に mdId/matchEvId を追記（source/approved は触らない）。dup/onError どちらも releaseSubmit、dup 時は pending 破棄（sessionStorage も removeItem）＋toast「既に提出があったため怪我報告をその記録に追記しました」→showEditMatch(dup.id)。成功で pending 破棄→**from==='home' なら go('home')、それ以外 go('match')**（P4 で FULL TIME 画面に差し替え）＋toast（injured/HIA どちらでも「リハビリタブが表示されます」を添える）。
6. [player] `showMatchDetail`(4368): idEq 化・v2/旧互換表示（背番号は mdNum）・怪我/HIA の承認状態チップ（mdInjuryLive/mdHia）・自由文 escapeHtml・修正/削除ボタン・backTab 'match'・タイトル「試合日チェック 9/5 vs ○○」。
7. [player] `showEditMatch/doEditMatch`(4391-4438): **v!==2 は現行の旧フォーム分岐をそのまま維持**（role は `select.value||m.role` 保護）。v2 は新フォーム（日付不可・minutes/rpe/sleepH/rate5/perf/note・攣りトグル常時描画・injured false→true は「この試合で痛めた箇所を追加で報告する」→ `showInjuryReport({mdId,evId,date,hia?})`）。
8. [player] `showInjuryReport(opts)/doInjuryReport`(4494-4525): `_irOpts` で source:'match'・mdId・matchEvId（数値正規化）・note タグ「【試合で受傷(日付)・後日申告】」、**hia:true は type==='脳震盪' のときのみ**、完了後 `svSafeUpdate('md')` で injured:true/injId/injLate 転記。
9. [player] `delMatchDay`(3141): confirm 撤去→即削除＋`toast('削除しました（怪我報告は残ります）','元に戻す',復元)`。復元 updateFn は `notFound=false;dup=false` から始め、同 id 存在または `mdDupIn` があれば push しない（toast「別の記録が既に登録されています」）。
10. [player] `todayTodoHtml`(1690-1699): 当日は `evToday=matchEventByDate(todayS,myPid)`・`mdToday=mdOf(myPid,evToday)`、`inSquadToday||mdToday` なら {done:!!mdToday,label:'今日の試合日チェック'+(now<ko?'（試合後に入力）':''),urgent:!mdToday} を push（cond todo と置換）。`pendingMatchChecks` は daysAgo>0 の未提出分（同日2試合も試合ごとに）を urgent で push、onclick=`showMatchForm(evId,'home')`。
11. [player] T.home ヒーロー MATCH DAY(2116-2118) タップで `showMatchForm`。T.mypage 試合カード(2483)に「未入力 n件/入力済み」（当日 KO 前は「今夜入力」で赤字にしない）、**コンディションカード(2373,2472-2473)の todayDone を `hasCondOn`**（試合日に md 済みなら「試合日チェック入力済み→詳細」）。**`condStreak`(2034) に md 日を加算**。
12. [player] `T.match`(2750) 見出し「試合日チェック」: 上部 HIA 注意バナー→「対象の試合」＝**直近3試合のうち squadRole!=null または md ありの試合 ∪ squadRole!=null かつ !mdOf の過去試合（30日以内）を未入力行を先頭に表示、該当なしなら最新1試合を「メンバー外（出場した場合は任意で入力）」で1行**→過去記録一覧（v2/旧互換、showMatchDetail は文字列 id）。**この構成は P4 でも維持**。
13. [player] help: 2525-2528 を新項目で更新、2516「TR時間」を「練習の時間。試合の日は試合日チェックで入力」、2514「RPE」に「試合の日は試合日チェックで入力」、試合ブロックに「試合翌日のコンディションには試合の RPE を入れない（回復チェックとして睡眠・筋肉痛を）」。
14. [staff] P1c と同時出荷なので不要。単独出荷せざるを得ない場合のみ最小パッチ（5466-5467/8563-8570 をヘルパー経由・8560 idEq・v2 レコードの showEditMatchStaff は保存ボタンを出さずブロック・doEditMatchStaff に v2 ガード・CSV の undefined ガード）。
15. [dev] テスト: `test_matchday_form.js`（必須集合と1回 alert・保存形・任意未入力はフィールド無し・i/r/HIA 生成・**既存 i 紐づけで i が増えず md.injId=既存 id・i.mdId=md.id**・**dup 時に i を積んだケースで dup md.injId===i.id・ボタン解放・pending null**・同日 A 提出後に B を提出できる・冪等再送は `db.runTransaction` を直接差し替え・prelude の sessionStorage モック前提・minutes=0 で rpe 省略）、`test_matchday_todo.js`（同日2試合・当日 done 行・condStreak・mypage 分岐）、`test_matchday_crud.js`（旧 md 編集後も role 文字列と v 無しが不変・4試合前でも squad 所属・未入力なら対象に出る）。テストは `_dom['main']` を innerHTML 保持オブジェクトにし、各ケース前に `subView=null;curTab='match'`。sync_manifest: chips 群・`MD_*`・`RATE5_LABELS` は player 専用のまま（P1c で staff 追加）。

### P1c スタッフ: 試合レポート再構成＋代理入力＋ダッシュボード＋HIA承認（2セッション）
1. [staff] 共通土台の移植（identical・**player からバイト一致コピー**）: `svSafeSeq`（player:1015 を 1262 直後へ）、`MOOD_EMO/STRESS_EMO/SORE_EMO/RATE5_LABELS/MD_*` と `rate5HTML/setRate5/_rate5OnChange/partChipsHTML/togglePartChip/clearPartChips/bindSorePartsToggle/chipsHTML/toggleChip/chipVals/setChips/clearChips` を numStepHTML(1623) 直後（ic 定義より後）へ。
2. [staff] `mdTriage(m,mds)`（rank0 HIA(mdHia)→1 怪我+来週不可→2 怪我→3 攣り→4 高負荷(rpe≥8 or mdIsV2 の負荷上位25%・提出8名以上時)→5 睡眠<6h(sleepH!=null)→6 perf≤2）、**`hiaChartApply(injId,onDone,onError)`**＝`svSafeUpdate('chart', latest→_chartIdx で該当を取り isConcussion=true・injType='脳震盪' のみ, onDone, onError)`（chartUpdate は onError を持たないので使わない・injDetail/scene は触らない・入口で `roleGate('diagnosis')`）。**P2 予定の `mdRemindText/copyText/copyMdRemind` を前倒しで staff ローカルに置く**（LINE 用テキスト）。
3. [staff] `V.matchview`(2396) 最終形（ナビ名「試合日レポート」）: UPCOMING（`goSquadEditor`）／REPORTS（提出 n/N（squad∩mdsOfEventUniq）＋「+n」・HIA n(mdHia)・怪我 n(mdInjuryLive)・攣り n・未提出 n、提出0でも表示、P1a-10 の30日/折りたたみ規則は維持、**実イベントのいずれにも mdBelongsTo しない md の日付**だけ疑似イベント「（カレンダー未登録）」）。カードクリック→`goMatchReport(matchEventKey(ev))`。
4. [staff] **`goMatchReport(evKey,replace)`** 新設（`goMatchDateDetail(date)` は薄い委譲エイリアス）: **順序＝メトリクス4枚（HIA/怪我タイルは要対応節へ scrollIntoView）→ 要対応（mdTriage rank≤6・canPractice==='参加できない' は bd-r「来週不可」常設）→ 提出状況（全員提出なら1行に畳む・未提出時のみ `pitchProgressHtml`（idx は Math.min）＋chip-late（squad の num 昇順）→`goAddMatchDay`＋**「LINE用テキストをコピー」**、メンバー表未登録なら `goSquadEditor` 導線）→「+ 代理入力（メンバー外も可）」→ その他の提出 → 「メンバー外の提出 n名」節（goSquadEditor 導線）**。行: role（`squadRole!==mdRoleCode` なら bd-a「メンバー表: スタート」）/mdNum/分/RPE/負荷(mdLoad!=null のみ)/睡眠/タグ/canPractice/inputAt/代理/修正済・修正・削除。**同 pid の複数 md は inputAt 最新を代表にし bd-a「重複 n件」＋古い方の削除ボタン、旧 md は bd-n「旧形式」**。ルートを `#mr-root`。非同期ロード口 `mrLoadSess(ev)`（P3 で実装）。
5. [staff] `goMatchDetail`(8559) タイトル「試合日チェック（選手名・日付）」: idEq・v2 項目・HIA ボックス・怪我承認状態バッジ＋`goInjuryDetail` リンク・提出メタ・escapeHtml・修正/削除ボタン。試合解決は `resolveMatchEvent(m.evId,m.date)`。
6. [staff] `selectPSearch`(1657) に `_pSearchOnSelect` フック1行。
7. [staff] **`goAddMatchDay(evKey,pid)`** 代理新規入力（goAddFatigue 4467 雛形・`smd-` 接頭 id・player v2 と同項目・出場分クイックチップ・背番号欄なし・ヘッダに「残り n名」・`smdSyncSquad` で role/min 自動提案（冒頭で `#smd-dup` を空にし disabled 解除してから重複判定）・既存 i があれば紐づけチェック（P1b-4 と同型））。
8. [staff] **`doAddMatchDay(evKey,btn)`**: 必須は出場区分/出場分/RPE(minutes>0) のみ（他は空なら書かない）→guardSubmit→`_smdPending`（メモリ正・sessionStorage ミラー・sig=`String(pid)+'|'+matchEventKey(ev)`）→ i/r は `svSafeSeq`・**md は `svSafeUpdate('md')` で `mdDupIn` 再判定（dup 時の i/r 転記・releaseSubmit・pending 破棄は P1b-5 と同じ）**（proxy:true,recordedBy／怪我 i{source:'match',approved:true,approvedAt/By/Role,proxy,mdId}＋r／HIA i/r）→ 成功時は**先に popView→goMatchReport→toast、その後 `hiaChartApply` を非同期で走らせ失敗時のみ alert**。**成功 toast に「次の未提出者へ」（matchChecksMissing を再計算して残りがあれば goAddMatchDay(evKey,next.id)）、フォーム下部に「保存して次へ」ボタン**。
9. [staff] `showEditMatchStaff/doEditMatchStaff(mid,evKey,opts)`(5478-5520): `mdIsV2` 分岐（v2 は minutes/rpe/sleepH/rate5/perf/攣り/note・evId 変更可→**成功時は変更後の evKey のレポートへ**、怪我/HIA は怪我管理へ誘導＋「怪我報告の受傷日は怪我管理で修正してください」＝i.date/matchEvId は追従しない）、旧md は既存フォーム＋`#emds-date` 追加（role は `select.value||m.role` 保護）。DOM 読みは updateFn 外へ。共通で editedAt/editedBy。**`opts.back:'page'` なら popView のみ**。
10. [staff] `delMatchDayStaff(mid,evKey,opts)`(5155): confirm 撤去→即削除＋Undo（型は doRejectInjury/undoRejectInjury 8602-8635）。復元 updateFn は同 id・`mdDupIn` で二重復元しない。復元後は `#mr-root` があれば `goMatchReport(evKey,true)`、`!viewStack.length&&V[curPage]` なら `V[curPage]()`、pushed view 中は toast のみ。
11. [staff] ダッシュボード: `matchPanel` の中身を最終形（**冒頭に「次の試合」行＝7日以内の次戦・MD-n・メンバー表 n名 ✓ / bd-a「メンバー表未登録」（当日は bd-r）＋「メンバー表を開く」**、続いて MATCH CHECK-IN kicker・`pitchProgressHtml({still:true})`・未入力 chip-late→`goAddMatchDay`・HIA/怪我件数・「レポートを開く」・LINE コピー。**当日で now<KO+2h（ko 無しは 18:00）は「試合後に集計（KO 14:00）」の1行のみ**）に差し替え。**`reqQueue`(1676-1681)・`lateSubmitters`(1841-1847)・提出率(1824-1829)の提出判定を `hasCondOn` に**。onSnapshot 1583 の `updateQueueBadge` 発火条件に 'md' を追加。
12. [staff] 新着怪我カード 1807/1911: `injIsHia` を最上位ソート（`reqQueue` 1663 も同じ比較関数）＋【HIA】bd-r＋hiaSymptoms 併記。**`approveInjury(iid,btnEl)`(8581) を svRec→`svSafeUpdate('i')` 化**（onclick に this・冒頭 guardSubmit（btnEl null 許容で test_p7c 維持）・updateFn 内で approved===false なら blocked・notFound/blocked/onError で releaseSubmit・成功 toast に「元に戻す」＝approved=null と approvedAt/By/Role/notifyPlayer を delete、HIA なら chart.isConcussion=false）、HIA なら onDone で V.dash→toast→`hiaChartApply`。`rejectInjury` は injIsHia のとき理由プリセットチップ「症状なしを確認・問題なし」「医療機関で異常なし」。V.injury injCard(2193)・goInjuryDetail(2898) ヒーロー・承認待ちバナー(2197) に HIA/代理入力/「試合日チェックを開く」(goMatchDetail(inj.mdId))。**goInjuryDetail で `injIsHia(inj)&&inj.approved===true&&!(getChart(inj.id)||{}).isConcussion` なら bd-r「脳震盪フラグ未設定」＋「カルテに反映」ボタン（hiaChartApply）**。
13. [staff] help 2366 に試合日レポート/代理入力/HIA の3行を追記。`exportCSV('matchday')`(5376) の値を mdRoleLabel/mdFatigueStr/mdSleepStr/mdInjuryLive 経由に（列構成は P5）。`goPlayerDetail` 4641 の md 行を inputAt 降順＋`goMatchDetail` リンク＋代理表示。
14. [trainer・前倒し推奨] SK(214)/D(216) に md 追加、B群必要分（mdBelongsTo/mdOf/mdsOfEvent/mdsOfEventUniq/mdIsV2/mdRoleLabel/mdNum/mdInjuryLive/mdHiaLive/mdHia/injIsHia。A群は P1a-2 で配置済み＝**再定義しない**）をコピー、`.bd-n` CSS 追加、`matchCareList(ev)`（**mdsOfEvent(ev) を使う・自前フィルタ禁止**）/`matchCareCardHtml()` 新設（HIA(mdHia)最上段→怪我報告→攣り→筋肉痛≥4/疲労≥5・行＝名前｜(side+part+type) 痛み n/10｜来週: canPractice（「参加できない」は bd-r）｜攣り: crampWhen・crampParts・行タップで injHow/injContinued/hiaSymptoms を読み取り専用展開・approved===null は「承認待ち」・approved===false は除外・approved===true のみ「カルテ」リンク・1465/1467/1626 のリハ対象フィルタは不変）を T.home 1441 の前に。
15. [dev] sync_manifest（svSafeSeq 3ファイル・部品/定数 files に staff・**P1c-14 でコピーした B群関数のみ files に trainer を追加（hasCondOn/pendingMatchChecks/matchChecksMissing は [player,staff,coach] のまま）**・mdTriage は staff 専用）＋テスト: `test_matchday_report_staff.js`（matchEvTitle escape・疑似行・孤児 evId・重複バッジ・要対応が最上段）・`test_matchday_proxy_staff.js`（冪等再送・mdDupIn・dup 転記・既存 i 紐づけ・HIA→chart isConcussion・別選手切替で dup 解除・evId 変更後の遷移先・「次の未提出者へ」・`__els` で mr-root 未生成/viewStack の Undo 分岐）・`test_matchday_dash_staff.js` を P1a 版から書き換え（次の試合行・KO 前ミュート）・`test_matchday_care_trainer.js`（evId が cal に無い v2 md が提出数に含まれる）。既存 `test_p7c.js:73-82`・`test_staff_ia_p8d.js:39-44`・`test_dash_staff.js`・P1a の `test_matchday_squad_staff.js`/`test_matchday_cal_staff.js` が緑を確認。CLAUDE.md:74 を「svSafeSeq（player/staff/trainer identical）」に更新。HANDOFF の P6 積み残し「md 新規代理入力」を消し込む。

### → 9/5 分の遡り運用（P1 完了・push・Cmd+Shift+R 後）
1. staff: カレンダーで 9/5 の試合イベントを修正（opp/ko/venue/comp）→「メンバー表」で背番号割当（前回コピー可）→ 保存。
2. 選手: 出荷日によっては催促窓（3日）に入りホーム todo が出る。出なくてもマイページ→試合日チェック→「対象の試合」の未入力行「入力する」から入力。staff はレポートの「LINE用テキストをコピー」で周知。必ず集める項目＝出場区分・出場分・RPE・怪我・攣り・HIA。
3. staff: 試合日レポート→9/5→未提出チップから代理入力（「保存して次へ」で連続入力）。怪我報告は新着怪我カード（【HIA】最上位）で承認/却下。
4. P1 出荷前に旧フォームで入った記録・重複・誤日付は、レポート行の bd-n「旧形式」/bd-a「重複 n件」から確認→削除（Undo 付き・怪我は残る）→代理入力で v2 に置き換える。
5. 以降の試合は「試合前にメンバー表登録」だけで催促〜レポートが自動で回る。

### P2 回復追跡＋試合負荷の追加読み＋催促（3〜4セッション）
1. [player/staff/coach] `MD_RECOV_TH` を PARTS 定数群の直後に。staff に `agoStr(n)` を player/coach と同一本文で追加（identical 3ファイル）。
2. [player/staff/coach] C群ヘルパーを sLoad 直後（coach は 851 直後）に同一本文でコピー。`mdAsCond` は `mdIsV2` で判定し rpe は null 可、`recoveryOf` は ev null で null・**筋肉痛未回答日は eval:false・評価済み0日なら recovered null→recoveryLabel 'na'「筋肉痛未回答」**、負荷は `mdLoad(r._md)||0`。**正典 f/md には一切書かない**（仮想行 id は 'md:'+id・`r._fromMd` で showEditMatch/delMatchDay に振る）。
3. [player] `todayTodoHtml` の cond push（P1b-10 の else 分岐内）を MD+n は「コンディション入力（試合後n日目の回復チェック）」／`T.condition`(2577-2617): lf=`condWithMd`、MD+n カード（**MD+1〜+3 は筋肉痛 rate5 を必須にし部位チップを初期展開**・「試合翌日のコンディションには試合の RPE を入れない」）、試合当日カード（入力済み→詳細／未→`showMatchForm(evT.id)`）、**doCondition で試合日かつ squad 所属かつ mdOf ありなら alert-info「この日は試合日チェック済みです。試合以外のセッションのみ記録してください」（ブロックしない）**、本日カード・一覧・チャートに MATCH flag・◆・`condLoad`、7日負荷タイル／`getTodayCondition`(5395): 前日ルール(5418-5422)を `_fromMd` なら「昨日は試合」に分岐・MD+2 高負荷・当日筋肉痛≥4／`renderTrainingExec`(5062) MD+1/MD+2 ヒント／`getMyInsights`(6606-6612) 試合後回復ルールは**試合から 1〜7 日のみ（'none' は ≤3 日）・na 分岐**／`T.mydata` md-cond-chart(6670,6952-6953) 合流＋◆／`showMatchDetail` に RECOVERY セクション（na 表示）／mypage お知らせ(2404) kind:'md-remind' は refEvId→matchEventById→date で ev を解決し `showMatchForm(ev.id)`／却下通知 2439-2446 で injIsHia&&source==='match' なら「頭部の症状は『問題なし』と確認されました」。
4. [staff] `getLatestCond(pid)`（窓 30 日・agoStr）新設／red フラグ(1672,1780) を `getLatestCond` に（試合 RPE はレッドフラグにしない・睡眠は >0 ガード）／ダッシュボード「試合後リカバリー対象」カード（HIA は mdHia→怪我→来週不可→疲労高/攣り→出場≥60分→回復未了/na、warnCount 加算）／`V.fatigue`(2264-2267,4319) 合流（仮想行の修正/削除は `opts.back:'page'`）／`goPlayerDetail`(4585-4653) 合流（4639 の最近の入力記録は `_fromMd` を除外）／`exportCSV('fatigue')`(5374 末尾に種別列)／`goMatchReport` に回復パネル（MD+1〜+3 平均・まだ戻っていない選手・未回答・未入力）／催促: `mdRemindBtnsHtml/sendMdReminders(+undo)`（母数は `matchChecksMissing(ev)`・**newId は updateFn 外で予約・updateFn 先頭で added=[];skipped=0**・1トランザクションで ann に N件・重複はスキップ・Undo）をダッシュボード matchPanel とレポートに配置／ダッシュボードお知らせ一覧 2150 は `kind:'md-remind'` を除外し試合ごと1行「催促 9/5 vs A大: n名（既読 m）・取り消す」に集約。
5. [coach] `condDaily`(823) 合流＋match フラグ／**`charts.cond`(2097-2098) の ◆ マーカーはここで実装**（pointRadius/pointStyle 配列・キャプション・new Chart 数不変）／`condAlerts`(1803) 「試合後回復未了」／`insCondition`(1118,1127,1157,1167) 合流＋試合 RPE を連続高RPE から除外＋「試合後の回復」ルール（MD+1〜+3 限定・na 分岐）／KPI・平均睡眠・週報提出数(1759,2066,1664,1621-1622) に `countCondOn/condWithMd`／個人レポート(2221,2231)・insPlayer(1231) 合流＋「試合負荷(7日)」。
6. [dev] sync_manifest（C群 3ファイル・condLoad 2ファイル・agoStr 3ファイル）＋ `test_matchday_recovery.js`（player・v2 で rpe 無しでも仮想行あり・8日前の試合で考察が出ない・soreness 無し→na・MD+n 筋肉痛必須）・`test_matchday_recovery_staff.js`（copyText は prelude の `document.execCommand`/`textarea.select` モック依存＝P5-8 で prelude に追加する分を先に入れる）・`test_matchday_recovery_coach.js`。既存 `test_p7a.js`・`test_dash_staff.js` 不変を確認。

### P3 GPS・試合スタッツとの紐づけ（0.5〜1セッション）
1. [staff] `_gpsWiz.meta.evId` 追加（6241）・`gpsReadMeta`（select 非表示時は **必ず '' にクリア**）・`gpsPickEv(v)`（date/label 補完・先に gpsReadMeta）・`gpsDoSave` meta の evId は **試合種別のときのみ**。
2. [staff] STEP1 メタ入力(6463-6470): 試合種別時に cal 試合 select `#gps-ev`（（手入力）option 付き）・選択時は日付 readonly・`gps-kind` の onchange で再描画・STEP3 確認に試合行。
3. [staff] `gpsToStep2`(6295) 必須チェック／`gpsCommit`(6120)・`mstatCommit`(6205) の索引 entry に evId（非空時のみ・数値化・**ms に kind は足さない**）。
4. [staff] 取込履歴/詳細(6529-6536,6356,6383) に試合名併記＋「未紐づけ」バッジ。
5. [player/staff] D群 `sessForEvent/sessRowOf/mdMinutesShown(m||{})`（player 3405 直前／staff 6136 直前）＋staff 専用 `mdSessLoad(gsL,msL,cb)`。
6. [staff] `mrLoadSess(ev)` に GPS/スタッツ結合を実装（pushView の fn と replace 経路の両方から呼ばれる）: 要素 id は `'mdd-g-'+matchEventKey(ev)+'-'+pid`・出場分バックフィル表示「GPS」バッジ・「GPS出場なのに未提出」赤強調・**「GPS出場だがメンバー表外 n名」も bd-a で表示（goSquadEditor 導線）**・`#mdd-gsum`／`goMatchDetail` に GPS・スタッツボックス（自己申告と GPS の差≥15分は bd-a）／取込 STEP3 完了に「試合日レポートを見る」(`goMatchReport(matchEventKey(ev))`)。
7. [dev] `test_matchday_p3_staff.js`（練習 kind で保存すると evId が付かない・Undo 再描画後も GPS が埋まる）。`test_gps.js`・`test_mstat.js:113` 不変。

### P4 選手のシーズン出場記録（1セッション）
1. [player/staff/coach] `mdIsCap(m)`（start、または reserve で minutes null/>0）・`matchStatsFor(mds)`、[player/staff] `MD_CAPS_MILESTONES` を配置（**trainer には置かない**・既存 A/B 群は再定義しない）。
2. [player/staff] `computeAllBadges`(1279 付近・identical 同時変更) に CAPS マイルストーン（type:'club', cat:'caps', label '初出場'/'n CAPS', **pts:0**, キー `String(m.evId!=null?m.evId:m.date)` で dedupe）。
3. [player] `T.match` を「マイ試合履歴」に: **P1b の HIA バナー→対象の試合セクションは上部に維持**→サマリー（`<div class="card" style="position:relative;overflow:hidden">`＋`.ghost-num.ghost-num--light`・出場/スタート/合計分/平均RPE/平均perf）→直近10試合の RPE/perf HTML バー（Chart.js 不使用）→履歴カード（opp/mdNum/分(GPS バックフィル)/RPE/負荷/perf/GPS chip/怪我・HIA・攣り）。`_mtInvoke` 非同期ガード（renderRank 3641 と同型）・今季=暦年チップ。
4. [player] `showMatchDetail` に対戦相手・背番号・GPS/スタッツボックス（showSub 後に gpsLoadMany/msLoadMany・null ガード）。
5. [player] **`showMatchResult(rec,ev)`** FULL TIME 画面（showSelfFitnessResult 6479 と同型・冒頭で `me=D.p.find(idEq(myPid))`・ghost-num・STARTING XV/FINISHER・MATCH REPORT 表・HIA 注意文言をここに一本化・CAPS 節目の flag は hero の外の kicker 行・`pbFlash` はラベル引数を任意で受ける拡張か toast のみ・**「完了」は go('home')**）。`doMatch` 成功時に呼ぶ。mypage カードに「n CAPS」。
6. [dev] `test_matchday_p4_player.js`（CAPS pts が club 点でない・同日重複が1キャップ・対象試合セクションと showMatchForm 導線が残る）・`test_badges.js` 再実行。

### P5 coach/trainer 反映＋CSV 刷新（2〜3セッション）
1. [coach] approved!==false 統一 7箇所（765/778/905/1753/1821/2114/2173）＝確定バグ#10。
2. [coach] coach 専用 `matchReportData(ev)`（**mds=mdsOfEvent(ev)・件数は mdsOfEventUniq・提出判定は mdOf・怪我 n=mdInjuryLive・HIA n=mdHia**）/`insMatch()/lastMatchEvent/nextMatchEvent/chipHtml(t)` を condDaily 直後に（**chip() は存在しないので chipHtml を定義。mdIsCap/matchStatsFor は P4-1 で配置済み＝追加しない（`grep -cE '^\s*function mdIsCap\(' coach/index.html` が1）。coach の `<symbol>` は i-ball のみ＝staff 由来の ic('i-warn') 等を持ち込まない**）。
3. [coach] `insHome`(1188) に `tag(insMatch(),'試合')`／`renderHomeView`(1739) heroBlock 直下に前戦/次戦カード（提出 n/N・怪我/HIA・攣り・平均RPE／次戦は squad×injuryStatusMaps で出場可/制限/不可）。
4. [coach] TABS(2266) に `{k:'match',label:'試合'}`＋`render()` 分岐＋`renderMatchView()`（試合セレクタ（comp が practice なら「練習試合」）・KPI4・SQUAD 背番号順・LOAD 分布 HTML バー・RECOVERY 日別（na 表示）・insightSec）。Chart.js 追加なし。
5. [coach] `charts.cond` は **P2 実装済みの前提で tooltip title「（試合日）」と pointHoverRadius のみ追加**／`renderPlayerReport`(2233) に試合履歴カード（matchStatsFor・直近6試合）＋`injEvidence`(646) に scene＋「試合で受傷」チップ（1874/2181）。
6. [trainer] P1c-14 未実施ならここで実施（実施済みなら流用し重複定義しない）。＋`T.tape/T.home`(1599-1609,1447-1449) に tapeslot.type 'match' の「試合前」flag・左ボーダー／`showTapeSetupForm`(4029) に「次の試合→試合前枠にする」（onclick は `tsUseMatch(\''+nx.date+'\')` 単引用符・JSON.stringify 不可）／`renderChartDiagnosis`(2042-2043・staff 3145-3146 も) scene 既定＝**`ev.comp==='practice'?'練習試合':'公式戦'`**（ev は matchEventById(inj.matchEvId)||matchEventByDate(inj.date)・source==='match' かつ未設定時の表示既定のみ・保存は従来通り）。
7. [staff] **`buildCSV(type,evId)→{fname,csv}` 純関数を新設し `exportCSV` は Blob/ダウンロードのみに**。`csvCell(v)` 共通化＋matchday を試合単位・列拡張（**試合種別・提出遅延日数（inputAt−date）列を含む**）＋未提出者行（m null 三項分岐・GPS 実測は「ソース GPS」）＋`exportMatchdayCSV(evId)`（GPS はキャッシュ経由）＋`pName` を idEq 化。`goMatchReport` に「この試合をCSV」。
8. [dev] `dev/prelude.js` に `Blob`・`URL.createObjectURL`・`document.execCommand`・mkEl の `select()` モックを追加（P2-6 のテストもこれに依存）。sync_manifest 拡張・`test_matchday_p5_coach.js`（cal あり squad ありで renderHomeView が例外を出さない・evId が cal に無い v2 md が提出数に含まれる）・`test_matchday_p5_trainer.js`（tsUseMatch の HTML が `tsUseMatch('20` を含む）・`test_matchday_csv_staff.js`（buildCSV の戻りを検証）。`test_p8e_coach.js` にタブ数固定アサートがあれば更新。
9. [docs] CLAUDE.md のデータキー一覧（md v2・gs/ms evId・ann kind）と共通ヘルパー節、HANDOFF.md を更新。

---

## 確定バグ9件の解消位置
| バグ | 解消 |
|---|---|
| #1 日付既定 todayStr（高） | P1a-15（暫定日付渡し）→P1b-4/5（evId から date 固定）＋P1c-9（旧md の日付訂正欄） |
| #2 matchsel 全体1本・evid 死変数（高） | P1a-8/14/15/16（cal.squad 化・matchsel 購読停止） |
| #3 催促が昨日限定・二重実装（中） | P1a-2/11/15（pendingMatchChecks identical）＋P1b-10 |
| #4 必須チェック無し 0/6（中） | P1b-5/7・P1c-8/9（isFilled＋範囲）、表示は mdFatigueStr「未入力」 |
| #5 同日重複ガード無し（中） | P1b-4/5・P1c-7/8（`mdDupIn` でサーバー最新を再判定・confirm 不使用）＋P1c-4 の重複バッジで旧重複を掃除 |
| #6 再送で i/r 二重生成（中） | P1b-3/5（メモリ正＋sessionStorage ミラーの pending）・P1c-8 |
| #7 md↔i 相互参照なし・孤児化（中） | P1b-5/8（mdId/injId 相互＋逆引き・dup 時転記・既存 i 紐づけ）・`mdInjuryLive/mdHia` 派生値に集計統一 |
| #8 injured/cramp 後から変更不可（中） | P1b-7/8（攣りトグル常時・後日申告リンク）・P1c-9 |
| #9 confirm＋Undo 無し削除（中） | P1b-9・P1c-10 |
| #10 coach approved 不統一（中） | P5-1 |
| 低: 死コード/カスケード/help/idEq/escapeHtml/CSV/tapeslot type/canPractice 非表示 | P1a-11,12,14 / P1b-6 / P1c-4,5,13 / P5-6,7 |

## レビューで確定した設計判断（設計ファイルより本節が優先）
- **所属述語は `mdBelongsTo(m,ev)` 1本**（mdOf/mdsOfEvent/mdDupIn/pendingMatchChecks/matchChecksMissing/coach/trainer/CSV が共有）。同日2試合は squad 所属優先・無ければ先頭にのみ属する。evId が現存イベントに解決できない孤児 md・疑似イベントは date で救済。`delCalEvent`/`doEditCalEvent` は squad/md がある試合の削除・日付/種別変更を拒否。
- **HIA 判定は `mdHia(m)` 1本**、怪我判定は `mdInjuryLive(m)`（mdId 逆引きは `!injIsHia` で HIA 起票を除外＝二重計上しない）。却下・削除後は全サイトの集計から消える。「衝撃あり・症状なし」は表示のみ。
- **v2 判定は `mdIsV2(m)= m.v===2` 1本**。**mdLoad は null 許容**。mdAsCond は rpe が無くても v2 なら仮想行を返す。
- **md.num は保存しない**（`mdNum(m)` で派生）。role は選手申告なので保存する。
- **重複ガードの最終防衛はサーバー最新**: md 本体だけ `svSafeUpdate('md')` で `mdDupIn` を再判定（date 一致だけでは弾かない）。dup なら push せず、先に保存した i/r を dup 側へ転記して孤児化させない。i/r は svSafeSeq。pending はメモリ正・sessionStorage ミラー。
- **updateFn は純粋関数**（再試行安全）。
- **hiaChartApply は svSafeUpdate('chart') 直書き＋onError**。書くのは isConcussion/injType のみ。画面遷移→toast→chart の順。承認後の未設定は goInjuryDetail の「カルテに反映」で再適用可。
- **旧md の編集は旧フォーム**。**必須集合は上記 Claude 推奨細部のとおり**（試合後疲労・筋肉痛は必須、睡眠h・試合前疲労・朝食は任意。代理入力は出場区分・出場分・RPE のみ必須）。
- **D5 の副作用補正は P1 に含める**: `hasCondOn` を player condStreak/mypage カード（P1b-11）と staff 督促・提出率（P1c-11）で使う。試合 RPE はレッドフラグに載せない。
- **試合当日 KO 前の催促は表示上ミュート**（pendingMatchChecks は変えない・送信は可能）。
- **怪我報告→試合日チェックの順でも二重起票しない**（既存 i への紐づけチェック）。i の受傷日は md 側から変えない（怪我管理で修正）。
- **`getMyInsights` の試合後ルールは試合から 1〜7 日のみ**。**charts.cond の ◆ は P2 で実装、P5 は tooltip/hover のみ**。trainer/coach へのヘルパー配置は P1a の位置を正とし再配置しない。
- **CAPS 定義**: start、または reserve で minutes が null か >0。配点 0。今季＝暦年。
- **閾値**（mdTriage の rpe≥8/睡眠<6h/perf≤2、MD_RECOV_TH の sore≥3/sleep<6/rpe≥8/hiLoad≥560AU）は Claude 既定。凛人監修で数値のみ調整。
- **既存 confirm 残置**（doDelPlayer/resolveInj/msDelConfirm/delWeekCheck/delCondition/delBC）は本プラン対象外。
- **ms 索引に kind は足さない**。**new Chart は増やさない**。**生 hex 禁止**。**onclick への文字列埋め込みは単引用符**。**`me` は player でグローバルでない**。**player `.card` に position:relative は無い**。**coach に chip() は無く symbol は i-ball のみ**。**識別子の型は cal.id（Date.now 数値）に揃え `isNaN(+v)?v:+v` で正規化**。**staff に agoStr は無い（P2 で追加）**。
- 見送り: condWithMd の pid|date 索引化は P2 実装後に実データで描画時間を計測してから判断（matchEventById のメモ化は先に入れる）。

## 検証
1. 各ステップ後: `python3 dev/extract.py <site>/index.html /tmp/<site>.js && /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc dev/prelude.js /tmp/<site>.js`（cwd=リポジトリルート・SyntaxError 無し）→ 該当テスト `python3 dev/run_tests.py test_matchday`。
2. 各フェーズ末: `python3 dev/run_tests.py`（全量 0 fail・既存テストの期待値は弱めない）→ `python3 dev/sync_check.py`（二重定義検査込み）→ `python3 dev/sync_check.py --residue`（違反 0）→ `grep -cE '^\s*function matchEvents\(' player/index.html staff/index.html trainer/index.html coach/index.html` が各1 → `git diff --stat` で対象外変更ゼロ。
3. ブラウザ（`.claude/launch.json` のプレビュー・**本番 Firestore 直結なので読み取り専用巡回のみ・保存ボタンは押さない**）: staff カレンダー→9/5 の「メンバー表」画面表示、V.matchview の提出 n/N、coach/trainer のカード描画・生 hex 無し・ダーク/ライトの崩れ無し。**player は選手未選択（myPid 無し）のままホームまで。mypage（描画時に ann.readBy を既読化 2402-2413）とトレーニングタブ（tdraft 同期 4875-4885）は開かない。showMatchForm のヘッダ表示は jsc テスト（`_dom['main']` 方式）で代替**。P2 の md-remind 送信後は実選手で mypage を開かない。
4. 実機確認はユーザーの Cmd+Shift+R に委ねる。push はフェーズ単位でユーザー確認後（P1a → P1b+P1c → P2 → P3 → P4 → P5）。各 push 後に HANDOFF.md を更新。
