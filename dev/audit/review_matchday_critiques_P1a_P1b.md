
=== CRITIQUE P1a: needs-fixes ===
- [high] 着手順序の矛盾: 手順17（manifest緑化）を13-16（他サイト同期）より前に置いており、sync_check が必ず赤になる
  detail: 見積の順序『1-2→17→18→3-5→…→13-16→17再実行』だが、dev/sync_check.py の check() は identical の files に列挙した各サイトから extract_block し、1つでも None なら 'MISSING' として fails に積む（sync_check.py:141-148）。手順17で files:['player','staff','trainer','coach'] を登録した時点で player/trainer/coach 側に関数が無いため exit 1。さらに手順18のヘルパーテストは player/staff/coach の3サイトで走る設計なので、13/16 が済んでいないと player/coach 実行が ReferenceError で落ちる。『1機能→緑→次』の運用（CLAUDE.md）と衝突する。
  fix: 順序を『1-2（staff基盤）→13・15・16（player/trainer/coachへ同一ブロックをコピー）→17（manifest登録・緑確認）→18（3サイトヘルパーテスト）→3-12（staff UI）→19→20→run_tests/sync_check 再実行』に改める。手順13/15/16の説明にも『手順2のブロックを正規化後バイト一致でコピー＝手順17の前提』と明記する。
  ref: dev/sync_check.py:141-148 / P1a 見積・手順17
- [high] P1a 単独出荷の穴: 催促窓を3日に広げたのに player の入力導線は旧 showMatchForm()（日付既定=今日）のまま＝9/5 遡り入力で確定バグ#1（誤日付→todo が消えない）が再発する
  detail: 手順14は todo の onclick を go('match') に据え置き、T.match(player:2753) のボタンも showMatchForm() 引数無し。showMatchForm(player:4321-4323) は md-date を todayStr() 固定、doMatch(4348) はその値をそのまま保存する。P1a 完了後に『9/5 のメンバー表を登録→選手に入力させる』運用が明記されているが、選手が日付を直さず送信すると md.date=9/7 になり、pendingMatchChecks は mdOf の date フォールバック（旧md は evId 無し）で 9/5 に一致せず todo が残り続ける。旧実装（昨日限定）より窓が3日に伸びた分だけ再現機会も増える。
  fix: P1a に最小パッチを含める: showMatchForm(dateArg) で `value=dateArg||td`、手順14の onclick を "showMatchForm('"+x.date+"')"、T.match 2753 のボタンは直近試合（matchEvents().filter(date<=today) 末尾）の date を渡す。フォーム上部に『対象試合日: fmt(date)』を表示。P1b が evId 版に置換するまでの暫定でよい（P1b 手順4/11 が同箇所を全面改修するので二重作業は最小）。
  ref: player/index.html:4321-4323, 2753, 1699 / 確定バグ#1
- [medium] 共通ヘルパー契約が後続フェーズの要求と食い違い、フェーズごとに別名ヘルパーが増殖する（identical 台帳の分裂リスク）
  detail: P1b は matchEventById(id)・squadNum(ev,pid)・matchEventByDate(date,pid)（同日A/B戦で pid 所属を優先）・mdHiaLive(m) を、P1c は mdIsHiaSuspect(m)/mdsOfEvent(ev) を、P3/P5 は mdHia(m)/mdRoleCode(m) を『P1a に無ければ自前定義』としている。P1a グループA/B にはいずれも無く、goSquadEditor は D.cal.find を、P2 mdAsCond は matchEvents().find を各自インラインで書いている。HIA 判定だけで mdHiaLive/mdIsHiaSuspect/mdHia の3名が並立する設計になっている。
  fix: P1a グループAに matchEventById(id)（(D.cal||[]) から type:'match' かつ idEq）、squadNum(ev,pid)（無ければ null）を追加し、matchEventByDate(date,pid) を pid 省略可の2引数版（pid 指定時は squadRole!=null のイベントを優先、無ければ先頭）で定義する。グループBに mdHia(m)=m.hiaInjId!=null||(!!m.hiaImpact&&(m.hiaSymptoms||[]).length>0) を1本だけ置き、P1b/P1c/P5 の別名は『これを使う』と明記。手順6の D.cal.find も matchEventById に置換。
  ref: P1a 手順2 グループA/B / P1b Step3 / P1c dataModel / P5 dataModel 4,6
- [medium] mdLoad の旧md戻り値（0）が P1c/P4 の想定（null）と矛盾し、平均負荷・トリアージが旧データで歪む
  detail: P1a: mdLoad(m)=(+m.rpe||0)*(+m.minutes||0) ＝旧md は 0。P1c は『mdLoad(m)→rpe*minutes|null（旧mdは null）』を前提に負荷列 '-' 表示と『mdLoad 非null を降順ソートし上位25%』を計算、P4 matchStatsFor は『avgLoad は null 除外』。P1a 仕様のままだと旧md 混在時に avgLoad が 0 側へ引きずられ、P1c の閾値計算にも 0 が混ざる。P2 condLoad は `base+(r._md?mdLoad(r._md):0)` なので null でも加算は壊れない（number+null=number）。
  fix: mdLoad(m) を『m.rpe==null||m.minutes==null なら null、それ以外 (+rpe)*(+minutes)』に変更し、matchLoadByDate は `(mdLoad(m)||0)` で合計、表示側は `mdLoad(m)!=null?…+' AU':'-'`。テスト18の期待『旧 0』を『旧 null』に改める。
  ref: P1a グループB mdLoad/matchLoadByDate / P1c dataModel mdTriage / P5 dataModel 7
- [medium] mdOf の紐づけ規則が ev.id==null（P1c の疑似イベント・削除済みイベント）で v2 md を取りこぼす
  detail: P1a: `m.evId!=null ? idEq(m.evId,ev.id) : m.date===ev.date`。P1c resolveMatchEvent は cal に無い日付に {id:null,date} の疑似イベントを作り、mdsOfEvent は `(ev.id!=null&&m.evId!=null)?idEq:date一致` と定義している。P1a 規則だと idEq(x,null) は false（staff:1621）なので、delCalEvent(staff:8771-8775) でイベントを消した後の v2 md（evId 残存）は P1c の疑似イベント経由でも mdOf に一致せず、提出者が消えたように見える。
  fix: mdOf/pendingMatchChecks 内の一致判定を P1c と同じ `(ev.id!=null&&m.evId!=null)?idEq(m.evId,ev.id):m.date===ev.date` に統一し、ヘルパー仕様に『ev.id が null の疑似イベントは date 一致で救済』と明記。あわせて delCalEvent に『squadOf(ev).length または当該 evId の md がある場合は削除を拒否し alert（C5/S2 の Undo 化までの暫定）』を1行足す。
  ref: P1a グループB mdOf / staff/index.html:1621, 8771-8775 / P1c ローカルヘルパー mdsOfEvent
- [medium] saveSquad/goSquadEditor が D.p に居ない pid を含む squad で TypeError になる
  detail: goSquadEditor は squadOf(ev) の全要素を _squadTemp に載せるが行描画は D.p ベースなので、削除済み選手の pid は画面に出ないまま _squadTemp に残る。saveSquad は `D.p.find(idEq(x.id,k)).id` と『未設定/範囲外の選手名を列挙（p.name）』で undefined を参照し例外→guardSubmit 前で落ちるため保存不能になる。手順10のカスケードは同フェーズだが、途中失敗（Promise 連鎖の cal 段が落ちる）や他端末の旧 cal 反映で発生しうる。
  fix: goSquadEditor で `_squadTemp` に載せる前に `D.p.some(idEq(x.id,s.pid))` で絞る（無い pid は捨てて toast『登録済みメンバー n名は選手一覧に存在しないため除外』）。saveSquad の entries 生成も `var p=D.p.find(...);if(!p)return null;` で null を filter する。squadSummary/検証の名前列挙も同様に p 無しをスキップ。
  ref: P1a 手順6 goSquadEditor/saveSquad / staff/index.html:5052-5067
- [medium] V.matchview を cal 試合 ∪ md 日付にすると、過去の全試合イベントが『提出0名・メンバー表未登録』行として並び一覧が氾濫する
  detail: matchEvents() は D.cal の type:'match' を全期間返す。TimeTree 取込（staff:8879-8903）で6月以降の試合が既に多数登録されている想定なので、md も squad も無い過去行が『提出: 0名 ・メンバー表未登録』で降順に積まれ、本来見たい提出済み試合が埋もれる。dev/test_matchday_dash_staff の期待（提出0/N 行が出る）自体は squad 登録済み試合を想定している。
  fix: cal 由来のみ（md 無し）の行は『date>=today-30日 または squadOf(ev).length>0 または date>todayS(NEXT)』に限定し、それ以外は末尾の折りたたみ『それ以前の未提出試合 n件』に畳む。matchEvents() 自体は全件返却のまま（他フェーズが依存）。
  ref: P1a 手順8 / staff/index.html:2396-2414, 8879-8903
- [low] showEditCalEvent の KO 候補プリフィルは『保存を押すだけで detail 由来の値が ko に確定』＝意図しない二次記録の書き込みになりうる
  detail: 手順5は detail の /(\d{1,2}):(\d{2})/ を cef-ko の value に入れる。タイトルだけ直したいスタッフが保存すると、doEditCalEvent の updateFn が calMatchFieldsRead() で ko を書く。detail に '7:30 集合 14:00 KO' のように複数時刻があれば最初の 7:30 が KO として保存される。RegExp.$1 依存も脆い。
  fix: value ではなく placeholder に『候補: 14:00』を出すか、『候補 14:00 を使う』ボタン（onclick で value 代入）にして、明示操作なしに ko を書かない。正規表現は match 結果配列を使い『KO』『ko』『キックオフ』の直前/直後にある時刻を優先する。
  ref: P1a 手順5 / staff/index.html:8698-8702, 8705-8723
- [low] ヘルパー仕様の null 安全・未宣言変数・表示モードの曖昧さ（実装者が迷う箇所）
  detail: (1) squadOf(ev)/squadRole(ev,pid) は ev が null のとき `ev.squad` で例外（P1b は `Array.isArray(ev&&ev.squad)` と書いており P1a 仕様と不一致・P1b 手順11は squadRole(evToday,…) を evToday null 可の文脈で呼ぶ）。(2) 手順8の『date>todayS』は V.matchview に todayS が未宣言（V.dash の 1778 とは別スコープ）。(3) 手順3『display は block』と calTypeChanged の 'grid' が混在＝block で書くと .grid.g2 の2列が崩れる。(4) 手順17『空行差は正規化で吸収されない』は誤り（normalize は空行も //行も除去 sync_check.py:113-118）。(5) pendingMatchChecks の daysAgo 算出式（'T00:00:00' + Math.round）が未記載。
  fix: 仕様文に『squadOf は (ev&&Array.isArray(ev.squad))?…:[]、squadRole は squadOf 経由で ev null 安全』『matchview 冒頭で var todayS=todayStr()』『#cef-match は display:grid/none』『daysAgo=Math.round((new Date(todayS+'T00:00:00')-new Date(ev.date+'T00:00:00'))/86400000)』を明記し、(4)の記述を削除。
  ref: P1a 手順2,3,8,17 / dev/sync_check.py:113-118 / P1b Step3
- [low] 手順9のダッシュボードブロックは P1c 手順11 が再度全面置換する（P1c は HEAD 基準で設計）＝配置と構造を P1c に寄せておくと二重作業が減る
  detail: P1c は『1984-1999 submissionPanel の直後に matchPanel を文字列生成し 2101 で連結、2109-2119 の旧ブロック削除』を前提にしている。P1a 手順9は $m().innerHTML+= 方式で末尾追記するため、P1c で位置ごと書き直しになる。
  fix: P1a でも matchPanel 変数として submissionPanel 直後に生成し 2101 の連結列に差し込む（内容は P1a 仕様のまま）。P1c は同変数の中身だけ差し替える形にする。
  ref: P1a 手順9 / staff/index.html:1984-1999, 2101, 2109-2119 / P1c 手順11
- [low] matchLoadByDate に消費者が無い（P2 は mdLoad(r._md) 単体、P4/P5 も未使用）＝3ファイル identical 登録の維持コストだけ増える
  detail: P1a は『f への追加読みはこれを呼ぶ＝P2/P4』と書くが、P2 condLoad/mdAsCond は同日 md を1件に絞って mdLoad を直接呼ぶ設計で、matchLoadByDate は登場しない。
  fix: P2 で採用しないなら P1a から外す（必要になった時点で追加）。残すなら P2 condLoad を `matchLoadByDate(r.pid,r.date)` に置換して同日2試合加算を1箇所に集約する、のどちらかに決める。
  ref: P1a グループB matchLoadByDate / P2 dataModel condLoad・condWithMd
- [low] 手順4の『タイトル自動補完は取込の重複判定と整合』は成立しない（取込タイトルは生文字列）
  detail: doCalImport の重複判定は date+title.trim() 一致（staff:8890）で、取込タイトルは 'vs文理(AB)' のような生文字列。自動補完 'vs '+opp と一致する保証は無い。実害は二重登録の可能性だけで、設計判断（title 正典）自体は問題ない。
  fix: リスク欄の根拠を『整合させる』から『取込後の重複は手動確認』に改める。任意で doCalImport の dup 判定に `e.type==='match'&&e.opp&&('vs '+e.opp).replace(/\s/g,'')===r.title.replace(/\s/g,'')` を加える。
  ref: P1a 手順4 / staff/index.html:8890
MISSED:
  * staff/index.html:2076 — ダッシュボード『今日の予定』が `e.time||'終日'` を読むが、cal に time を書く経路は存在しない（取込は detail に入れる）。P1a で ko を正典化するなら `e.ko||e.time||'終日'` に置換し、試合行に matchEvLabel(e)/venue を併記する
  * staff/index.html:8786 — postAnnounceFromCalendar の週間予定テキストが title+detail のみ。試合は `(e.ko?' '+e.ko+' KO':'')+(e.venue?' @'+e.venue:'')` を足さないと、新フォームで KO/会場を ko/venue に入れた試合の告知から時刻が消える
  * player/index.html:4321-4323 / 2753 — showMatchForm(dateArg) の日付プリフィルと T.match ボタンの日付渡し（P1a 単独出荷期間の確定バグ#1 対策。finding 参照）
  * staff/index.html:8771-8775 delCalEvent — squad 登録済み・md 参照ありの試合イベント削除を拒否/警告する1行（squad と evId の孤児化防止。Undo 化は C5/S2 でよい）
  * CLAUDE.md:63 — データキー一覧に `matchsel 試合メンバー選考` が残る。『staffのSK定義=正典』と書かれているため、SK から外すなら同行を『matchsel（旧・残置・読み書きしない）』に更新し HANDOFF.md のフェーズ表にも P1a を追記する
  * dev/sync_manifest.json — POS_NUM の files 拡張と新規13エントリの登録は手順13/15/16 完了後に行う（順序の finding 参照）。テスト18の『実行:』3行ヘッダは run_tests.py の targets_of が先頭15行から /tmp/(site).js を拾う仕様（run_tests.py:57-64）なので必須
  * staff/index.html:5052-5067 doDelPlayer — cal.squad からの除去（手順10）は設計済みだが、同カスケードは 'a' と同様 `latest||[]` ガードが要る点と、rejected（Promise reject）時に popView/toast が走らない既存挙動を踏襲する旨を明記

=== CRITIQUE P1b: needs-fixes ===
- [high] staff 側 mdRoleLabel が未コピーの MD_ROLE_LABEL を参照し ReferenceError（Step3×Step16×sync 節の自己矛盾）
  detail: Step3 の mdRoleLabel 契約は `MD_ROLE_LABEL[m.role]||m.role||''` で、Step3 はこれを staff/index.html:414 直後にも identical コピーする。一方 sync 節は MD_ROLE_LABEL を kind:'var'・files:['player'] で登録し「P1c で staff に拡張」と明記＝P1b 時点の staff に MD_ROLE_LABEL は存在しない。Step16 は staff/index.html:5466（goMatchDateDetail の roleBadgeHtml(m.role)）と 8565（goMatchDetail）を roleBadgeHtml(mdRoleLabel(m)) に置換するため、試合日レポートを開いた瞬間に全行で ReferenceError となり画面が壊れる（旧 md も含む）。sync_check は関数本体の md5 一致しか見ないので機械ゲートでは検出されない。P1a の mdRoleLabel 案（マップを関数内にインライン）とも本体が食い違う。
  fix: mdRoleLabel は定数に依存させず関数内にマップをインラインする（P1a 案と同一本体にする）。MD_ROLE_LABEL は showMatchForm の select 生成専用（player ローカル）に留めるか、P1b 時点で identical files:['player','staff'] として staff にもコピーする。どちらにしても「identical 関数が参照する識別子は全コピー先に存在する」を Step3 の完了条件に追加し、staff 単体で `python3 dev/extract.py staff/index.html /tmp/staff.js && jsc` 後に goMatchDateDetail を模擬呼び出しするテスト（test_matchday_crud の staff 版）を1本足す。
  ref: player/index.html:3970 / staff/index.html:414, 5466, 8565
- [high] P1a/P1b/P1c/P2/P3 で共通ヘルパーの本体契約が食い違う（identical はバイト一致必須）＋二重定義を sync_check が検出できない
  detail: 同名ヘルパーの仕様が各フェーズ設計で異なる: matchEvents（P1a: date→String(id) 昇順 / P1b: date のみ）、matchEventByDate（P1a: (date) 同日先頭 / P1b: (date,pid) squad 優先）、mdOf（P1a: inputAt 降順の先頭 / P1b: find 先頭）、mdSleepStr 旧形式（P1a: 'HH:MM → HH:MM（7.5h）' / P1b: 'sleepTime → wakeTime'）、mdFatigueStr の v2 判定（P1a: v===2||preFatigue!=null / P1b: v!==2 で旧）、mdLoad の旧 md（P1a/P1b: 0 / P1c・P3: null。P1c の mdTriage「mdLoad 非null」と P3 matchStatsFor の avgLoad「null 除外」は 0 が混ざると平均が崩れる）、mdInjuryLive（P1a: injId/hiaInjId 両方 → P1c の「怪我 n=mdInjuryLive」「HIA n=mdIsHiaSuspect」で HIA のみの md が怪我にも二重計上 / P1b: injId のみ＋mdHiaLive 別建て。旧データ照合も P1a は m.injured 必須、P1b は未規定）。先に着地した方の本体が正典になり後発の設計文は無効化されるが、どちらが正典かが書かれていない。さらに dev/sync_check.py の extract_block は `^\s*function NAME\s*\(` の最初の一致しか取らないため、P1b が player 3970/staff 414 に置いた後で P1a が player 579/staff 778
  fix: P1b 着手前に『共通ヘルパー正典表』を1つ確定し、4フェーズの設計文をそれに揃える。推奨: matchEventByDate(date,pid) で pid 省略可（P2/P1c/P3 の単引数呼び出しと互換）／mdOf は inputAt 降順の先頭（重複時に最新を採る）／mdLoad は rpe==null||minutes==null なら null を返し、合計側で `||0`（P1c/P3 の null 前提に合わせる）／mdInjuryLive は injId（＋後述の i.mdId 逆引き）のみ、HIA は mdHiaLive で分離／mdSleepStr 旧形式は時間換算付き（P1a 案）／mdFatigueStr の v2 判定は `m.v===2||m.preFatigue!=null||m.postFatigue!=null`。加えて Step3 の完了条件に `grep -c '^\s*function matchEvents' player/index.html staff/index.html` が各 1 であることを追加し、dev/sync_check.py に「identical 名の function 宣言が同一ファイルに2つ以上あれば NG」を足す提案を P1a/P1b 共通の dev 手順に入れる（本レビュー範囲では手順追加のみ・sync_c
  ref: player/index.html:3970 vs P1a の 579 / staff/index.html:414 vs P1a の 778 / dev/sync_check.py extract_block
- [high] mdOf が evId 一致のみで判定するため、試合イベントを削除→再登録すると同一選手×同一日の md が重複生成される
  detail: Step3 の mdOf は `m.evId!=null ? idEq(m.evId,ev.id) : m.date===ev.date`。staff の delCalEvent（staff/index.html:8771・confirm 残置）で試合イベントを消して同日に作り直すと id（Date.now）が変わり、既存 v2 md の evId は孤児化。pendingMatchChecks は「!mdOf(pid,newEv)」で再び未入力と判定→ホーム todo と T.match『未入力』が復活→showMatchForm(newEv) の dup ガード（mdOf）も新 ev では空振り→doMatch(c) の最終防衛も同じ mdOf なので素通り→同日 2 件目の md が作成される（D5『1回で提出』違反、staff の提出数・怪我数が二重計上、P2 の condWithMd は同日 md の先頭のみ採用で負荷が片方消える）。P1a の未解決欄に『削除で evId が孤児化』と書かれているが、P1b 側は evId 一致を絶対視しており救済が無い。
  fix: mdOf を『m.evId があり、かつその evId が現存イベントに解決できる場合のみ evId 比較。解決できない（削除済み）場合は date 一致にフォールバック』に変更する（例: `var evOk=m.evId!=null&&matchEventById(m.evId); return evOk?idEq(m.evId,ev.id):m.date===ev.date`）。matchEventById を P1a の正典表にも載せる（P1c の resolveMatchEvent／P3 の `matchEvents().find(idEq)` インライン3種を1本化）。test_matchday_helpers に『evId が存在しないイベントを指す md は date 一致で同定される』ケースを追加。
  ref: player/index.html:3970（mdOf 契約）/ staff/index.html:8771 delCalEvent
- [medium] md.num は選手が編集できない cal.squad の写し＝二次記録を正典 md に書いている（D2/D3 と矛盾）
  detail: Step4 は `#num` を読み取り専用 `<span class="num">#num</span>` で表示し、Step6 は `num:squadNum(ev,myPid)` を md に保存する。背番号は D3 で『スタッフがメンバー表で割当』＝cal.squad が正典。スタッフが後から背番号を訂正しても md.num は古いまま残り、P3/P4 は `m.num||squadNum` で表示するため画面ごとに番号が食い違う。role は選手が変更可能（自己申告）なので保存して良いが、num は『選手の申告』ではなく squad からの派生値であり、規約『二次記録を正典ストアへ書かない（統合は追加読みで解く）』に反する。P1c の代理入力（#smd-num 編集可）とも扱いが割れている。
  fix: P1b では md.num を保存せず、表示は常に `squadNum(matchEventById(m.evId)||matchEventByDate(m.date,m.pid),m.pid)` で派生させる（ヘルパー mdNum(m) を identical に追加）。どうしても保存するなら『選手が num を上書き可能』にして申告値化し、P1c の代理入力と同じ意味に揃える。dataModel の md v2 から num を外すか『選手上書き時のみ』と明記。
  ref: player/index.html:4321（Step4 #num 表示）/ 4349（Step6 rec.num）
- [medium] D5『試合日は f を書かない』の副作用（ストリーク断裂・staff 督促/提出率の誤判定）が P1b 出荷時点で発生し、補正は P2 まで来ない
  detail: P1b は試合日の todo を『試合日チェック』に置換して f 入力を促さなくなるが、読み側の補正は全て P2 に置かれている: player condStreak（player/index.html:2032-2040）は D.f のみを数えるため試合翌日に 🔥 連続日数が必ず 0 に落ちる（試合に出るほど損をする逆インセンティブ）。staff reqQueue.late（staff/index.html:1676-1681）と V.dash lateSubmitters（1841-1847）は hasY/hasT を D.f だけで判定するので MD+1 の朝に squad 全員が『2日未提出』で督促対象になり、condRate/condSubCnt（1824-1829）は試合当日の提出率が 0% と出る。red フラグ（1672/1780）も試合日の睡眠不足を拾えない。9/5 分を遡って入力する運用初日からこの誤表示が出る。
  fix: P2 Step3（condStreak に `(D.md||[]).forEach(... days[r.date]=1)` 1 行）と P2 の hasCondOn(pid,dateS)（f または md）を P1b に前倒しし、staff 1676-1677/1841-1842/1825 の判定を hasCondOn に差し替える（identical 登録・test_staff_ia_p8d 39-44 と test_dash_staff 42/48 は D.md=[] なので不変）。前倒ししない判断なら、P1b の未解決欄に『P1b 単独出荷で起きる既知の誤表示』として明記し、P1b と P2 Step3/13 を同一リリースにする。
  ref: player/index.html:2032-2040 / staff/index.html:1676-1681, 1824-1829, 1841-1847
- [medium] Step8 doEditMatch の role 扱いが曖昧で、旧 md（日本語 role・v 無し）を編集すると role が破壊される／ハイブリッド状態が生まれる
  detail: Step8 は select#emd-role（value=start/reserve/none・onchange あり）を描画しつつ、保存側は『m.role/num(維持)』と書かれており、role を更新するのか維持するのかが読めない。旧 md の role は 'スタート'/'リザーブ'/'出場なし（ベンチ）'等の日本語文字列で、start/reserve/none の option に一致しないため `select.value=m.role` は実ブラウザで value='' になり、role を保存する実装だと '' または先頭 option が書き込まれ旧データが壊れる。さらに『v!==2 は rate5・sleep が空なら未変更』としつつ minutes/rpe/perf の扱いは未規定で、旧 md に minutes/rpe を足すと v 無し＋rpe ありのハイブリッドが生まれ、P1b の mdLoad（v===2 判定）は 0、P1a の mdLoad は rpe×分、P1c の mdIsV2 は true と三者が食い違う。既存 doEditMatch（4424）は `select.value||m.role` で守っているが v2 化で消える。
  fix: (1) v!==2 のレコードでは現在の role 文字列を `<option value="<旧文字列>" selected>` として select に追加し、保存は『初期値と異なるときだけ role を書く』にする（維持/更新の二択を明文化）。(2) 旧 md の編集ポリシーを『旧フィールドのみ編集可（v2 項目は非表示）』か『全 v2 必須を満たしたら v:2 に昇格して旧フィールドを削除』のどちらかに決め、ハイブリッドを作らない。前者なら showEditMatch は v!==2 で現行 4391-4416 のフォームをそのまま出す分岐にする方が安全（P1c の staff 側『旧 md は旧フォーム維持』と同じ方針）。test_matchday_crud(5) に『旧 md 編集後も role 文字列と v 無しが不変』を明示。
  ref: player/index.html:4391-4438
- [medium] Step16 の staff showEditMatchStaff は alert-info を出すだけで、旧フォームの保存経路が v2 レコードを上書き破壊する
  detail: Step16 は『v2 レコードなら先頭に alert-info を出し旧フィールド編集を抑止』とあるが、抑止の実体が無い。現行フォーム（staff/index.html:5482-5490）は emds-role（日本語 option）・emds-fpre/fpost・emds-stime/wtime を描画し、doEditMatchStaff（5509-5516）は無条件に `m.role=select.value||m.role`（'スタート' が書かれる）、`m.fatiguePre=parseInt(...)||0`、`m.sleepTime=''` を v2 レコードに書き込む。結果 v2 md に fatiguePre:0/fatiguePost:0/sleepTime:''/role:'スタート' が混入し、mdRoleLabel は日本語のまま返すので表示上は気づきにくいが、P3 の mdRoleCode/CAPS や P2 の集計で role コードが壊れる。
  fix: Step16 で showEditMatchStaff の先頭に `if(m.v===2){pushView('試合日記録を修正','<alert-info>新形式の記録の修正は代理入力画面（P1c）から</alert-info><button onclick="popView()">戻る</button>');return;}` を置き保存ボタン自体を出さない。doEditMatchStaff にも `if(latest[idx].v===2){blocked=true;return latest;}` の二重ガードを入れ、blocked 時は releaseSubmit＋alert。P1c Step9 でこのガードを v2 フォームに置換する。
  ref: staff/index.html:5478-5520
- [medium] HIA 判定関数が3フェーズで別名・別意味（mdHiaLive / mdIsHiaSuspect / mdHia）＝サイト間で HIA 人数が一致しない
  detail: P1b: mdHiaLive(m)＝hiaInjId に対応する生きた i（approved!==false）／P1c: mdIsHiaSuspect(m)＝hiaImpact&&hiaSymptoms.length>0（i の状態を見ない）／P3: mdHia(m)＝hiaInjId!=null||(hiaImpact&&symptoms)。スタッフが HIA 怪我を却下（approved:false）すると、player の T.match/showMatchDetail は『取消・却下済み』、staff の V.matchview/goMatchReport は『HIA 1』、coach の matchReportData も hiaN=1 のまま、trainer の要ケアも HIA 行を出す＝却下したのに監督・トレーナーには HIA 疑いが残り続ける。逆に『衝撃あり・症状なし』（i 無し）は P1b では何も表示されず、P3 の mdHia も false、P1c も false で整合するが、それが意図かも書かれていない。
  fix: P1b（先行フェーズ）で identical に2本を確定: mdHia(m)＝申告上の疑い（hiaImpact&&(hiaSymptoms||[]).length>0 || hiaInjId!=null）、mdHiaLive(m)＝有効な HIA 怪我レコード（hiaInjId→D.i idEq&&approved!==false、無ければ i.mdId 逆引きで hia:true のもの）。P1c/P3/P5 の集計・タグは『疑い件数＝mdHia、要対応＝mdHiaLive』のどちらを使うか各箇所で明記し、mdIsHiaSuspect/mdHia の独自定義を廃止する。
  ref: player/index.html:3970（Step3 mdHiaLive）/ P1c mdIsHiaSuspect / P3 mdHia
- [medium] 冪等再送（_mdPending）はリロードで消えて i/r が孤児化し、重複ガードはローカル D.md 依存で代理入力との競合を防げない
  detail: Step6 の _mdPending はメモリ変数のみ。i→r 成功後に md が失敗し、選手が『電波の良い場所で』ページを再読み込みして再送すると _mdPending は消え newId が再採番される→既送の i/r（approved:null・mdId は存在しない md を指す）が孤児として staff 新着怪我と player 怪我タブに残る（既存バグ#7 の再発経路）。また (c) の最終防衛は `mdOf(myPid,ev)`＝ローカル D.md で判定し、md 本体は svSafeSeq の append（updateFn 内再判定不可）なので、P1c の代理入力や別端末の自己送信と同時刻に走ると同 pid×evId の md が2件になる（P1c 未解決欄でも言及）。
  fix: (1) _mdPending を sessionStorage（rm_todo_sig と同じ手法・player/index.html:1720）に sig 付きで永続化し、showMatchForm(ev) 描画時に同 sig の pending があれば『未送信分があります。再送しますか』の alert-info＋再送ボタンを出す。(2) md の保存だけは svSafeSeq の push ではなく svSafeUpdate('md', latest=>{if(latest.some(同 pid&&(evId 一致 or date 一致)))dup=true; else latest.push(rec); return latest;}) にしてサーバー最新で重複を再判定し、dup なら toast＋showEditMatch へ誘導（規約の svSafeUpdate 内再判定パターン）。i/r は従来どおり svSafeSeq、md は最後に svSafeUpdate の2段構成にし、_mdPending.savedIds の扱いは i/r のみに限定。
  ref: player/index.html:4345-4366（Step6）
- [medium] Step9 後日申告リンクの細部: hia フラグの誤付与・evId の型不一致・md 転記失敗時の生死判定漏れ
  detail: (1) `if(_irOpts.hia){injRec.hia=true;}` は opts.hia のとき無条件に hia:true を付けるが、選手がプリセットの #ir-type='脳震盪' を別種類に変えても hia:true のまま保存され、P1c の approveInjury→hiaChartApply で isConcussion=true の安全ゲートが誤発動する。(2) onclick 文字列 `showInjuryReport({mdId:'id',evId:'evId',date:'date'})` から来る evId は文字列、doMatch の matchEvId は数値（cal.id は Date.now）＝同一フィールドに型が混在（比較は idEq で救えるが staff 6317 の gs 正規化と同様に揃えるべき）。(3) i/r 成功後の md 転記（injured:true,injId）が失敗すると『alert せずコンソールのみ』だが、mdInjuryLive(m) は injId 前提で、旧データ照合が『m.injured の旧データ』に限定される P1a 版だと injured:false の v2 md からはこの i を辿れず、T.match/showMatchDetail に怪我ありが出ない。i 側には mdId があるのに逆引きしていない。
  fix: (1) hia は `type==='脳震盪'` または症状チップ選択時のみ true（フォームに HIA 症状チップを載せるならそれで判定）。(2) `_irOpts.evId` を `isNaN(+v)?v:+v` で正規化して保存。(3) mdInjuryLive に `D.i.find(x=>idEq(x.mdId,m.id)&&x.approved!==false)` の逆引きを追加し（doMatch・後日申告・P1c 代理入力の全経路が i.mdId を書く）、date×source フォールバックは evId/injId/mdId が全て無い旧データ専用にする。
  ref: player/index.html:4494-4525（Step9）/ 3970（mdInjuryLive）
- [low] 実装者が迷う未定義・不一致（関数名・要素 id・範囲・命名）
  detail: Step8 が呼ぶ updEMdLoad と emd-role の onchange 関数、Step5 mdHiaToggle の『clearChips 相当』、Step4/5 の #md-perf-wrap（rate5HTML は wrapper を作らない）、Step14 の map 内 `ev`（解決式未記載）、Step6 の hiaCreated が本文に定義されていない。sleepH 範囲が P1b 0〜24 / P1c 0〜14、perf が P1b 必須 / P1c 任意、チップ部品名が P1b chipsHTML/toggleChip / P1c listChipsHTML/toggleListChip、RATE5_LABELS キーが P1b fat / P1c fatigue とフェーズ間で不一致。設計文の擬似コードがアロー関数だが本体は ES5 function 統一。sync 節の『svSafeSeq は identical 維持（player 1015/trainer 850）』は誤り＝現行 manifest に svSafeSeq は未登録（P1c が新規登録する前提）。
  fix: Step2 に clearChips(id) を追加、Step5 に updEMdLoad/emdRoleChange を追加、Step4 に `<div class="fl" id="md-perf-wrap">` を明記、Step14 に `var ev=matchEventById(m.evId)||matchEventByDate(m.date,myPid)` を明記。数値範囲・必須/任意・部品名・ラベルキーは P1b の値を正典として P1c 設計文を更新（P1c 側は『実名に合わせる』と宣言済み）。コードは function 式で書く旨を注記し、sync 節の svSafeSeq 記述を『未登録（P1c で登録）』に訂正。
  ref: player/index.html:4320-4438（Step4-8）
- [low] 同日2試合（A/B戦）で両方の squad に入っている選手は2試合目が催促されない
  detail: Step11 は evToday=matchEventByDate(todayS,myPid) で1件だけ todo を出し、pendingMatchChecks の結果を `filter(p=>p.daysAgo>0)` で当日分を落とすため、当日に2イベントとも squad 入りしている選手は片方しか promptされない。翌日以降は daysAgo>0 で両方出るので取りこぼしは当日のみ。
  fix: 当日分も pendingMatchChecks の結果をそのまま回し（evId で key 化しているので重複しない）、『コンディション入力』の置換判定だけ inSquadToday||mdToday で行う。test_matchday_todo に『同日2試合 squad 両方』ケースを追加。
  ref: player/index.html:1690-1699（Step11）
- [low] 試合当日の周辺表示・文言・CSV の取りこぼし（P1b 単独出荷時の見え方）
  detail: T.mypage のコンディションカード（player/index.html:2472）は D.f 基準なので試合日に md を出しても赤字『未入力』が残り、ホーム todo（done）と矛盾する。help 2516『TR時間：練習や試合の時間（分）』は D5 と矛盾。staff exportCSV('matchday')（staff/index.html:5376）は v2 行で試合前疲労/睡眠が 'undefined' になり role が 'start' 生値で出る（P1c Step13 まで放置）。staff goMatchDetail 8560 の `x.id===mid` は Step16 で触るのに idEq 化が書かれていない。
  fix: Step13 と同じ場所で mypage の cond カードも『試合日は試合日チェック済み』表示に分岐（evToday&&mdToday なら緑）。help 2516 を『TR時間：練習の時間（分）。試合の日は試合日チェックで入力』に。Step16 に exportCSV の最小ガード `(m.v===2?m.preFatigue:m.fatiguePre)` 等と 8560 の idEq 化を含める（P1c で全面刷新）。
  ref: player/index.html:2472, 2516 / staff/index.html:5376, 8560
- [low] テスト設計の実装上の落とし穴（_dom スタブと runTransaction 差し替え）
  detail: test_bc_dup 方式の `document.getElementById=function(id){return _dom[id]||{value:'',style:{},textContent:''};}` は showSub が使う $m()（'main'）にも素のオブジェクトを返すため、`$m().innerHTML=...` の結果を検証できない（(1)(7) の HTML 検証が空振りする）。冪等再送テストの『db.runTransaction を 'r' で1回だけ reject』は、player の `var db=firebase.firestore()` がロード時に束縛済みなので `db.runTransaction` を直接差し替える必要がある（firebase.firestore を差し替えても効かない）。また showSub は subView=true にするので、テストで T.match を再描画する前に subView=null に戻す必要がある。
  fix: テスト冒頭で `_dom['main']=mkEl()` 相当（innerHTML を保持するオブジェクト）を用意し、`_dom[id]||mkEl()` にフォールバックさせる（test_home_p8b の _els 方式と併用）。再送テストは `var _orig=db.runTransaction; db.runTransaction=function(fn){...'r' の時だけ Promise.reject...}` で差し替え、完了後に復元。各ケースの前に `subView=null;curTab='match';` を明示。
  ref: dev/test_bc_dup.js:12-13 / player/index.html:2073 showSub
MISSED:
  * player/index.html:2032-2040 condStreak — D.f のみ集計。D5 で試合日に f を書かなくなるため P1b 出荷直後から試合翌日に🔥ストリークが 0 に落ちる（P2 Step3 の 1 行を P1b に前倒し）
  * staff/index.html:1676-1681 reqQueue.late／1841-1847 lateSubmitters／1824-1829 condSubmittedToday・condRate／1672・1780 red フラグ — 全て D.f 基準。MD+1 朝に squad 全員が督促対象、試合当日の提出率 0%（P2 の hasCondOn を前倒し）
  * player/index.html:2472-2473 T.mypage コンディションカード — 試合日に md 提出済みでも『未入力』赤字のまま（Step13 と同じ場所で分岐追加）
  * player/index.html:2516 help『TR時間：練習や試合の時間（分）』— D5 と矛盾する文言（Step15 と同時に修正）
  * staff/index.html:5376 exportCSV('matchday') — v2 行で fatiguePre/sleepTime が 'undefined'、role が 'start' 生値。P1b 単独出荷時の最小ガードが Step16 に無い
  * staff/index.html:8560 goMatchDetail の `x.id===mid`／`x.id===m.pid` — Step16 で同関数を触るのに idEq 化が記載されていない（P1c Step5 まで放置）
  * staff/index.html:8771 delCalEvent — 試合イベント削除→再登録で md.evId が孤児化し mdOf が空振り→重複 md 生成（mdOf に date フォールバックが必要。高リスク項目として本文に記載）
  * dev/sync_check.py extract_block — identical 関数の『同一ファイル内二重定義』を検出しない。P1a（player 579/staff 778）と P1b（player 3970/staff 414）で同名ヘルパーを別位置に置くと後勝ちで契約ズレが機械ゲートをすり抜ける（grep ゲートを Step3 の完了条件に追加）
  * player/index.html:1964-1967 hasActiveInjury／1981 renderNav／1997-2007 rm_rehabtab_ — HIA 自動起票（approved:null）の直後に3枠目が『リハビリ』へ切り替わるが、選手向けの説明（『HIA疑いとして報告したためリハビリタブが出ています』等）が無い。Step6 の toast 文言に1行足すか showMatchDetail の HIA ブロックで案内する
  * dev/test_dash.js:77 `D.matchsel=[1]`／dev/test_home_p8b.js:32 `setKey('matchsel',[1])` — P1a Step20 と P1b テスト節が同じ行を別々に改修する設計になっており、着地順によっては二重編集の衝突が起きる（どちらのフェーズが担当するか一本化）