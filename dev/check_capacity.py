# Firestore容量チェック（読み取り専用・書き込みは一切しない）
# 使い方: python3 dev/check_capacity.py
# 全appdataドキュメントのサイズを一覧し、1MiB上限に対する警告を出す。
# 背景: 2026-07にtlogが1MiB上限に迫った（Phase 0で15日カットオフ+選手別半期アーカイブで解決）。
#       同じ構造リスク（1ドキュメントに全レコード同居）は他キーにもあるため、定期的にこれで棚卸しする。
# 監視ポイント:
#   - tlog: 定常400-550KB想定。700KB超えたらPhase 3の自主トレ増か旧クライアント肥大保存を疑う
#            （安全弁: 読み出し側は非エンジン全箇所tlogAll()化済みのため、TLOG_KEEP_DAYSを8日まで
#              下げられる=エンジンブロックの7日窓が下限。player/staff両方を同時に変えること）
#   - p: 514KB(写真base64)。選手増や写真差し替えで漸増。800KB超えたら写真の再圧縮(サイズ/品質)か別doc分離
#   - f: コンディション。全員が毎日提出すると約245KB/月=約4ヶ月で上限。150KB超えたらtlogと同じ
#        アーカイブ方式（日数カットオフ+選手別半期doc）を移植する
#   - tdraft: 選手ごと1件で有界(74人でも~180KB)。異常に大きい場合は下書き肥大を疑う
import json,urllib.request,sys

KEY='AIzaSyBNBxVywJmZVb7wmWlZkppB0ESf02IPTls'
BASE='https://firestore.googleapis.com/v1/projects/fukuokauniv-rug/databases/(default)/documents/appdata'
LIMIT=1048576
WARN={'tlog':700_000,'p':800_000,'f':150_000,'tdraft':250_000}
DEFAULT_WARN=500_000

docs=[];tok=None
while True:
    url=BASE+'?key='+KEY+'&pageSize=300'+(('&pageToken='+tok) if tok else '')
    r=json.load(urllib.request.urlopen(url))
    docs+=r.get('documents',[])
    tok=r.get('nextPageToken')
    if not tok:break

rows=[];alerts=[]
for d in docs:
    name=d['name'].split('/')[-1]
    data=(d.get('fields',{}).get('data',{}) or {}).get('stringValue','')
    sz=len(data.encode('utf-8'))
    n='-'
    try:
        p=json.loads(data)
        if isinstance(p,list):n=len(p)
    except Exception:pass
    rows.append((sz,name,n))
    th=WARN.get(name,DEFAULT_WARN if not name.startswith('tla_') else 800_000)
    if sz>=th:alerts.append('%s: %s B (警告閾値 %s B / 上限 %s B)'%(name,f'{sz:,}',f'{th:,}',f'{LIMIT:,}'))

rows.sort(reverse=True)
print('%-26s %12s %6s %7s'%('doc','bytes','recs','%上限'))
for sz,name,n in rows:
    print('%-26s %12s %6s %6.1f%%'%(name,f'{sz:,}',n,100*sz/LIMIT))
print('\ndocs:',len(rows),' 合計: %s B'%f'{sum(r[0] for r in rows):,}')
if alerts:
    print('\n⚠ 警告:');[print(' ',a) for a in alerts]
    sys.exit(1)
print('\nOK: 全ドキュメントが警告閾値未満')
