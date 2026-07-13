# 一括テストランナー（読み取り専用・本番Firestoreには一切接続しない）
# 使い方:
#   python3 dev/run_tests.py                 # 全テスト実行・結果表示
#   python3 dev/run_tests.py --json out.json # 結果をJSONにも保存（基線記録用）
#   python3 dev/run_tests.py test_cond       # 名前部分一致で絞り込み
#
# 仕組み:
#   1. player/staff/trainer/coach の <script> を抽出（dev/extract.py と同じ正規表現）
#   2. 各 dev/test_*.js の先頭コメント「実行: jsc ... /tmp/(player|staff|coach|trainer).js」から対象サイトを判別
#      （複数行あれば複数サイトで実行。見つからない場合は中身の V./T. 使用から推定し、それも無理なら unknown で失敗扱い）
#   3. JSC prelude.js <site.js> <test.js> を実行
#      成功 = 終了コード0 かつ 出力に 'ALL PASS' か 'PASSED' があり、'NG ' と 'SyntaxError' が無い
# jsc の実パスは PATH に無い（メモリ reference-test-harness-jsc 参照）
import re, sys, json, subprocess, tempfile, os, glob, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
SITES = ['player', 'staff', 'trainer', 'coach']

# ⚠️ jscは非ASCIIパスの引数を開けない（プロジェクトパスに日本語を含むため）。
#    → 実行はcwd=ROOTで相対パス指定、抽出JSはASCIIの一時ディレクトリに置く。
# 旧テストは「実行: jsc ...」ヘッダーが無い自由記述のため、対象サイトを明示テーブルで持つ。
# 新規テストは必ず先頭15行に『// 実行: jsc dev/prelude.js /tmp/<site>.js dev/test_xxx.js』を書くこと。
LEGACY_TARGETS = {
    'test_badge_ui_player.js': ['player'],
    'test_badge_ui_staff.js': ['staff'],
    'test_badges.js': ['player', 'staff'],
    'test_bronco_coach.js': ['coach'],
    'test_bronco_std.js': ['player', 'staff', 'coach'],
    'test_coach_report_std.js': ['coach'],
    'test_engine.js': ['player'],
    'test_latest_rank.js': ['player', 'staff', 'coach'],
    'test_msess_edit.js': ['player', 'staff'],
    'test_staff_pdetail_std.js': ['staff'],
    'test_train_weak.js': ['player'],
    'test_bronco_board_staff.js': ['staff'],
    'test_cond.js': ['player'],
    'test_dash.js': ['player'],
    'test_dash_staff.js': ['staff'],
    'test_gps_rank.js': ['player'],
    'test_msess_alert.js': ['player'],
    'test_msess_close.js': ['staff'],
    'test_mystatus.js': ['player'],
    'test_ranking.js': ['player'],
    'test_std_staff.js': ['staff'],
}

def extract(site, outdir):
    path = os.path.join(ROOT, site, 'index.html')
    c = open(path, encoding='utf-8').read()
    s = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', c, re.DOTALL)
    out = os.path.join(outdir, site + '.js')
    open(out, 'w', encoding='utf-8').write('\n;\n'.join(s))
    return out

def targets_of(test_path):
    name = os.path.basename(test_path)
    if name in LEGACY_TARGETS:
        return LEGACY_TARGETS[name]
    src = open(test_path, encoding='utf-8').read()
    head = '\n'.join(src.split('\n')[:15])
    ts = re.findall(r'/tmp/(player|staff|coach|trainer)\.js', head)
    if ts:
        return list(dict.fromkeys(ts))
    return []

def run_one(sitejs, test_rel):
    # cwd=ROOT・dev/配下は相対パスで渡す（jscの非ASCIIパス問題の回避）
    r = subprocess.run([JSC, 'dev/prelude.js', sitejs, test_rel],
                       cwd=ROOT, capture_output=True, text=True, timeout=120)
    out = r.stdout + r.stderr
    ok = (r.returncode == 0 and ('ALL PASS' in out or 'PASSED' in out)
          and '　NG' not in out and '  NG ' not in out and 'SyntaxError' not in out)
    tail = [l for l in out.strip().split('\n') if l.strip()][-1] if out.strip() else ''
    return ok, tail, out

def main():
    args = [a for a in sys.argv[1:]]
    json_out = None
    if '--json' in args:
        i = args.index('--json'); json_out = args[i+1]; del args[i:i+2]
    filt = args[0] if args else ''
    tests = sorted(glob.glob(os.path.join(ROOT, 'dev', 'test_*.js')))
    if filt: tests = [t for t in tests if filt in os.path.basename(t)]
    tmpdir = tempfile.mkdtemp(prefix='rmtests_')
    sitejs = {s: extract(s, tmpdir) for s in SITES}
    results, nfail = [], 0
    for t in tests:
        name = os.path.basename(t)
        tgts = targets_of(t)
        if not tgts:
            results.append({'test': name, 'target': 'unknown', 'pass': False, 'tail': 'target not detected'})
            nfail += 1
            print('FAIL %-32s [unknown] 対象サイト判別不能' % name)
            continue
        for s in tgts:
            try:
                ok, tail, _ = run_one(sitejs[s], os.path.join('dev', name))
            except Exception as e:
                ok, tail = False, 'runner error: %s' % e
            results.append({'test': name, 'target': s, 'pass': ok, 'tail': tail})
            if not ok: nfail += 1
            print('%s %-32s [%s] %s' % ('PASS' if ok else 'FAIL', name, s, tail[:90]))
    print('---')
    print('%d run, %d fail' % (len(results), nfail))
    if json_out:
        payload = {'date': datetime.datetime.now().isoformat(timespec='seconds'),
                   'results': results, 'run': len(results), 'fail': nfail}
        open(json_out, 'w', encoding='utf-8').write(json.dumps(payload, ensure_ascii=False, indent=1))
        print('saved: ' + json_out)
    sys.exit(1 if nfail else 0)

if __name__ == '__main__':
    main()
