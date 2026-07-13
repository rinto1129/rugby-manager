# 生hex/rgba/グラデ/Chart色の台帳ジェネレータ（読み取り専用）
# 使い方: python3 dev/hex_ledger.py   → dev/audit/hex_ledger.json を再生成
#
# P3(ダーク化)の変換対象を機械的に洗い出し、5分類のたたき台を自動付与する:
#   brand    : マルーン/ゴールドのブランド定数 → 原則残置（ただし前景текст用途は--accent-text等へ）
#   status   : 状態色の直書き → var()化
#   surface  : ライト用サーフェス/ボーダー → ダーク値へ
#   chartjs  : Chart.js設定内のJS文字列色 → CHTオブジェクト参照へ
#   rgba     : rgba()直書き → トークン化 or ダーク値（第5分類）
#   unknown  : 人間判断（P3の各サイト作業時に確定）
# 自動分類は暫定。P3作業時に本JSONのcategoryを手で確定し、residue_allow.jsonの根拠にする。
import re, os, json, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = {'player': 'player/index.html', 'staff': 'staff/index.html',
         'trainer': 'trainer/index.html', 'coach': 'coach/index.html',
         'landing': 'index.html'}

BRAND = {'#8d0000', '#c1121f', '#4f0004', '#c9a227', '#f2c43d', '#d9a82e', '#2a0810', '#7a1233'}
STATUS_HINT = {'#b91c1c', '#c2410c', '#a16207', '#1d4ed8', '#6d52d6', '#046c48',
               '#dc2b2b', '#f97316', '#fbbf24', '#3b82f6', '#8b5cf6', '#0e9f6e',
               '#34d399', '#f87171', '#a78bfa', '#e0f2fe', '#d1fae5', '#0891b2', '#059669'}
CHART_CTX = re.compile(r'backgroundColor|borderColor|pointBackground|Chart\.defaults|new Chart', re.I)
HEX_RE = re.compile(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b')
RGBA_RE = re.compile(r'rgba?\([^)]*\)')
GRAD_RE = re.compile(r'(?:linear|radial)-gradient\([^;"\']*\)')

def classify(val, line):
    v = val.lower()
    if v in BRAND: return 'brand'
    if CHART_CTX.search(line): return 'chartjs'
    if v in STATUS_HINT: return 'status'
    if v in ('#fff', '#ffffff', '#fffdf6', '#f7f4f3', '#faf7f6', '#f5f0ef'): return 'surface'
    return 'unknown'

def main():
    ledger = {}
    for site, path in SITES.items():
        src = open(os.path.join(ROOT, path), encoding='utf-8').read()
        lines = src.split('\n')
        hexes = collections.defaultdict(lambda: {'count': 0, 'lines': [], 'category': ''})
        rgbas = collections.defaultdict(lambda: {'count': 0, 'lines': []})
        grads = []
        for ln, line in enumerate(lines, 1):
            for h in HEX_RE.findall(line):
                e = hexes[h.lower()]
                e['count'] += 1
                if len(e['lines']) < 5: e['lines'].append(ln)
                cat = classify(h, line)
                if not e['category'] or e['category'] == 'unknown': e['category'] = cat
            for r in RGBA_RE.findall(line):
                key = r.replace(' ', '').lower()
                e = rgbas[key]
                e['count'] += 1
                if len(e['lines']) < 5: e['lines'].append(ln)
            for g in GRAD_RE.findall(line):
                if len(grads) < 200: grads.append({'line': ln, 'def': g[:160]})
        ledger[site] = {
            'hex_unique': len(hexes), 'hex_total': sum(e['count'] for e in hexes.values()),
            'rgba_unique': len(rgbas), 'rgba_total': sum(e['count'] for e in rgbas.values()),
            'gradients': len(grads),
            'hex': dict(sorted(hexes.items(), key=lambda kv: -kv[1]['count'])),
            'rgba': dict(sorted(rgbas.items(), key=lambda kv: -kv[1]['count'])),
            'gradient_defs': grads,
        }
        print('%-8s hex: %d種/%d箇所  rgba: %d種/%d箇所  grad: %d' % (
            site, ledger[site]['hex_unique'], ledger[site]['hex_total'],
            ledger[site]['rgba_unique'], ledger[site]['rgba_total'], len(grads)))
    out = os.path.join(ROOT, 'dev', 'audit', 'hex_ledger.json')
    json.dump(ledger, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('saved: ' + out)

if __name__ == '__main__':
    main()
