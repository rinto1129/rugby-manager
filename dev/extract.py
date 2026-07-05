import re,sys
path=sys.argv[1]; out=sys.argv[2]
c=open(path,encoding='utf-8').read()
s=re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>',c,re.DOTALL)
open(out,'w',encoding='utf-8').write('\n;\n'.join(s))
print('extracted %d block(s), %d chars'%(len(s),sum(len(x) for x in s)))
