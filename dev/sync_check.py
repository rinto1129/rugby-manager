# 4ファイル同期照合ツール（読み取り専用）
# 「共通関数・定数・CSSブロックは各HTMLにコピーされている」構成の揃え忘れを機械検出する。
#
# 使い方:
#   python3 dev/sync_check.py            # 台帳(dev/sync_manifest.json)と現状を照合。不一致で終了コード1
#   python3 dev/sync_check.py --update   # 現状のmd5/カウントを台帳に書き戻す（意図的な変更を確定する時のみ）
#   python3 dev/sync_check.py --residue  # 生hex/rgba残渣レポート（P3以降は許可リスト外=違反）
#
# 台帳(sync_manifest.json)の構造:
#   identical: 全対象ファイルで正規化後ソースが完全一致すべき関数/定数。 {name: {files:[...], kind}}
#   variant:   ファイルごとに内容が違ってよいが、無断で変わったら検出したいブロック。 {name: {files:{site:md5}, kind}}
#   chart_counts: 各ファイルの `new Chart(` 出現数の基線（Chart.js閉じ括弧事故の検出補助）
# kind: 'function'(function NAME(...){...})、'var'(var NAME=...;)、'cssblock'(/* NAME */ 〜 /* /NAME */)
#
# 正規化: 行末空白を除去し、//のみのコメント行を除去（実装一致・コメント差のみを許容）。
# ⚠️ jscと違いpythonは日本語パスOK。ROOT基準の相対パスで動く。
import re, os, sys, json, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'dev', 'sync_manifest.json')
RESIDUE_ALLOW = os.path.join(ROOT, 'dev', 'audit', 'residue_allow.json')
SITES = {'player': 'player/index.html', 'staff': 'staff/index.html',
         'trainer': 'trainer/index.html', 'coach': 'coach/index.html',
         'landing': 'index.html'}

def read(site):
    return open(os.path.join(ROOT, SITES[site]), encoding='utf-8').read()

def _skip_regex(src, i, n):
    """iが正規表現リテラルの先頭'/'。終端'/'の次の位置を返す（[...]内の/は終端でない）。"""
    i += 1
    incls = False
    while i < n:
        c = src[i]
        if c == '\\': i += 2; continue
        if incls:
            if c == ']': incls = False
        elif c == '[':
            incls = True
        elif c == '/':
            return i + 1
        elif c == '\n':
            return i  # 行を跨ぐ正規表現は無い前提（誤検知の安全弁）
        i += 1
    return i

def _is_regex_start(src, i):
    """位置iの'/'が正規表現リテラルの開始か（直前の非空白文字で判定する標準ヒューリスティック）"""
    j = i - 1
    while j >= 0 and src[j] in ' \t': j -= 1
    if j < 0: return True
    return src[j] in '(,=:[!&|?{};\n+*%~^<>'

def match_braces(src, start):
    """start='{'の位置から対応する'}'の次の位置を返す。文字列/コメント/正規表現リテラルの中の括弧は数えない。"""
    i, depth, n = start, 0, len(src)
    while i < n:
        c = src[i]
        if c in ('"', "'", '`'):
            q = c; i += 1
            while i < n and src[i] != q:
                if src[i] == '\\': i += 1
                i += 1
        elif c == '/' and i + 1 < n and src[i+1] == '/':
            while i < n and src[i] != '\n': i += 1
        elif c == '/' and i + 1 < n and src[i+1] == '*':
            i = src.find('*/', i + 2)
            if i < 0: return -1
            i += 1
        elif c == '/' and _is_regex_start(src, i):
            i = _skip_regex(src, i, n) - 1
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return i + 1
        i += 1
    return -1

def extract_block(src, name, kind):
    if kind == 'cssblock':
        a = src.find('/* %s */' % name)
        b = src.find('/* /%s */' % name)
        if a < 0 or b < 0 or b <= a: return None
        return src[a:b + len('/* /%s */' % name)]
    if kind == 'function':
        m = re.search(r'(?m)^\s*function %s\s*\(' % re.escape(name), src)
        if not m: return None
        brace = src.find('{', m.end() - 1)
        end = match_braces(src, brace)
        return src[m.start():end] if end > 0 else None
    if kind == 'var':
        m = re.search(r'(?m)^\s*var %s\s*=' % re.escape(name), src)
        if not m: return None
        # = の後の最初の { or [ から対応閉じまで＋直後の ; まで
        m2 = re.search(r'[\{\[]', src[m.end():])
        if not m2: return None
        openpos = m.end() + m2.start()
        opench = src[openpos]
        if opench == '[':
            # [ ] を数える簡易版（文字列スキップは match_braces と同じ扱いにするため置換で代用）
            i, depth, n = openpos, 0, len(src)
            while i < n:
                c = src[i]
                if c in ('"', "'", '`'):
                    q = c; i += 1
                    while i < n and src[i] != q:
                        if src[i] == '\\': i += 1
                        i += 1
                elif c == '[': depth += 1
                elif c == ']':
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
                i += 1
            else:
                return None
        else:
            end = match_braces(src, openpos)
            if end < 0: return None
        semi = src.find(';', end)
        return src[m.start():semi + 1 if semi > 0 else end]
    return None

def normalize(code):
    lines = []
    for l in code.split('\n'):
        s = l.rstrip()
        if not s: continue
        if s.strip().startswith('//'): continue
        lines.append(s)
    return '\n'.join(lines)

def md5(s):
    return hashlib.md5(s.encode('utf-8')).hexdigest()[:12]

def chart_count(src):
    return len(re.findall(r'new Chart\s*\(', src))

def check(update=False):
    man = json.load(open(MANIFEST, encoding='utf-8'))
    srcs = {s: read(s) for s in SITES}
    fails = []
    # identical
    for name, spec in man.get('identical', {}).items():
        vals = {}
        for site in spec['files']:
            blk = extract_block(srcs[site], name, spec.get('kind', 'function'))
            vals[site] = md5(normalize(blk)) if blk is not None else 'MISSING'
        uniq = set(vals.values())
        if 'MISSING' in uniq or len(uniq) > 1:
            fails.append('identical %-24s %s' % (name, ' '.join('%s=%s' % kv for kv in vals.items())))
        else:
            print('ok identical %-24s %s (%s)' % (name, list(uniq)[0], ','.join(spec['files'])))
    # variant
    for name, spec in man.get('variant', {}).items():
        for site, want in spec['files'].items():
            blk = extract_block(srcs[site], name, spec.get('kind', 'cssblock'))
            got = md5(blk) if blk is not None else 'MISSING'
            if update:
                spec['files'][site] = got
                print('updated variant %s[%s]=%s' % (name, site, got))
            elif got != want:
                fails.append('variant %-20s %s: got=%s want=%s' % (name, site, got, want))
            else:
                print('ok variant   %-24s %s=%s' % (name, site, got))
    # chart counts
    cc = man.get('chart_counts', {})
    for site in SITES:
        got = chart_count(srcs[site])
        want = cc.get(site)
        if update:
            cc[site] = got
        elif want is not None and got != want:
            fails.append('chart_count %s: got=%d want=%d（Chart.js括弧事故 or 意図的追加。意図的なら--update）' % (site, got, want))
        else:
            print('ok charts    %-24s %s=%d' % ('new Chart(', site, got))
    man['chart_counts'] = cc
    if update:
        json.dump(man, open(MANIFEST, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('manifest updated: %s' % MANIFEST)
        return 0
    if fails:
        print('--- FAIL ---')
        for f in fails: print('NG ' + f)
        return 1
    print('--- ALL SYNC OK ---')
    return 0

HEX_RE = re.compile(r'#[0-9a-fA-F]{3,8}\b')
RGBA_RE = re.compile(r'rgba?\([^)]*\)')

def residue():
    allow = set()
    if os.path.exists(RESIDUE_ALLOW):
        allow = set(json.load(open(RESIDUE_ALLOW, encoding='utf-8')).get('allow', []))
    total = 0
    for site in SITES:
        src = read(site)
        hexes = [h for h in HEX_RE.findall(src) if h.lower() not in allow]
        rgbas = [r for r in RGBA_RE.findall(src) if r.replace(' ', '').lower() not in allow]
        print('%-8s hex=%d rgba=%d' % (site, len(hexes), len(rgbas)))
        from collections import Counter
        for v, c in Counter(h.lower() for h in hexes).most_common(8):
            print('   %s x%d' % (v, c))
        total += len(hexes) + len(rgbas)
    print('--- residue total=%d %s' % (total, '(許可リスト未整備=基線報告モード)' if not allow else ''))
    return 0

if __name__ == '__main__':
    if '--residue' in sys.argv:
        sys.exit(residue())
    sys.exit(check(update='--update' in sys.argv))
