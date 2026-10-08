import json
import re

with open('/tmp/all_ilovepdf_svgs.json') as f:
    raw_svgs = json.load(f)

def clean_inner(svg_str):
    m = re.search(r'<svg([^>]*)>(.*?)</svg>', svg_str, re.DOTALL)
    if not m:
        return '0 0 50 50', svg_str
    attrs, inner = m.groups()
    vb = re.search(r'viewBox=\"([^\"]+)\"', attrs)
    viewBox = vb.group(1) if vb else '0 0 50 50'
    
    # JSX attribute conversions
    inner = inner.replace('fill-rule="', 'fillRule="')
    inner = inner.replace('clip-rule="', 'clipRule="')
    inner = inner.replace('stroke-width="', 'strokeWidth="')
    inner = inner.replace('stroke-linecap="', 'strokeLinecap="')
    inner = inner.replace('stroke-linejoin="', 'strokeLinejoin="')
    inner = inner.replace('fill-opacity="', 'fillOpacity="')
    inner = inner.replace('stroke-dasharray="', 'strokeDasharray="')
    inner = inner.replace('stroke-dashoffset="', 'strokeDashoffset="')
    inner = inner.replace('class="', 'className="')
    inner = inner.replace('xlink:href="', 'href="')
    # clean self-closing tags if needed, standard JSX handles <path ... />
    return viewBox, inner.strip()

parsed = {}
for k, v in raw_svgs.items():
    vb, inner = clean_inner(v)
    parsed[k] = {'viewBox': vb, 'inner': inner}

print(f"Parsed {len(parsed)} SVGs")
