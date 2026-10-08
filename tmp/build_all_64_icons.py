#!/usr/bin/env python3
import json
import re

# Load base SVGs from /tmp/all_ilovepdf_svgs.json
with open('/tmp/all_ilovepdf_svgs.json') as f:
    official_svgs = json.load(f)

def clean_inner(svg_str):
    m = re.search(r'<svg([^>]*)>(.*?)</svg>', svg_str, re.DOTALL)
    if not m:
        return '0 0 50 50', svg_str
    attrs, inner = m.groups()
    vb = re.search(r'viewBox=\"([^\"]+)\"', attrs)
    viewBox = vb.group(1) if vb else '0 0 50 50'
    
    # JSX conversions
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
    inner = inner.replace('stop-color="', 'stopColor="')
    inner = inner.replace('stop-opacity="', 'stopOpacity="')
    return viewBox, inner.strip()

parsed = {}
for k, v in official_svgs.items():
    vb, inner = clean_inner(v)
    parsed[k] = {'viewBox': vb, 'inner': inner}

def add_convert_anim(key):
    c = parsed[key]['inner']
    c = re.sub(r'(<path fill="#[A-Fa-f0-9]+" d="M(14\.477|43\.94)[^>]*>)', r'<g className="ilove-anim-convert-arrow">\1</g>', c)
    return c

# Map of 64 toolIds to {viewBox, inner}
T = {}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BASE OFFICIAL ICONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. merge-pdf
m_in = parsed['merge_pdf']['inner']
m_in = m_in.replace('d="M5.488.363', 'className="ilove-anim-merge-tl" d="M5.488.363')
m_in = m_in.replace('d="M44.563 49.69', 'className="ilove-anim-merge-br" d="M44.563 49.69')
m_in = m_in.replace('<path fill="#FFF"', '<path className="ilove-anim-merge-arrows" fill="#FFF"')
T['merge-pdf'] = {'vb': parsed['merge_pdf']['viewBox'], 'svg': m_in}

# 2. split-pdf
sp_in = parsed['split_pdf']['inner']
sp_in = sp_in.replace('d="M5.488.363', 'className="ilove-anim-split-tl" d="M5.488.363')
sp_in = sp_in.replace('d="M44.563 49.69', 'className="ilove-anim-split-br" d="M44.563 49.69')
sp_in = sp_in.replace('<path fill="#FFF"', '<path className="ilove-anim-split-arrows" fill="#FFF"')
T['split-pdf'] = {'vb': parsed['split_pdf']['viewBox'], 'svg': sp_in}

# 3. compress-pdf
cp_in = parsed['compress_pdf']['inner']
cp_in = cp_in.replace('<path fill="#8FBC5D"', '<path className="ilove-anim-compress-blocks" fill="#8FBC5D"')
cp_in = cp_in.replace('<path fill="#FFF"', '<path className="ilove-anim-compress-arrows" fill="#FFF"')
T['compress-pdf'] = {'vb': parsed['compress_pdf']['viewBox'], 'svg': cp_in}

# 4. repair-pdf
rp_in = parsed['repair_pdf']['inner']
rp_in = re.sub(r'(<path fill="#fff" d="M12\.527 28\.82)', r'<path className="ilove-anim-wrench" fill="#fff" d="M12.527 28.82', rp_in)
T['repair-pdf'] = {'vb': parsed['repair_pdf']['viewBox'], 'svg': rp_in}

# 5. ocr-pdf
ocr_in = parsed['ocr_pdf']['inner']
ocr_in = re.sub(r'(<path fill="#8FBC5D" fillRule="evenodd" d="M12\.5 37\.5v-12)', r'<path className="ilove-anim-laser" fill="#8FBC5D" fillRule="evenodd" d="M12.5 37.5v-12', ocr_in)
T['ocr-pdf'] = {'vb': parsed['ocr_pdf']['viewBox'], 'svg': ocr_in}

# 6. scan-pdf
scan_in = f'<g className="ilove-anim-scanner-beam">\n{parsed["scan_to_pdf"]["inner"]}\n</g>'
T['scan-pdf'] = {'vb': parsed['scan_to_pdf']['viewBox'], 'svg': scan_in}

# 7. organize-pdf
org_in = f'<g className="ilove-anim-card-shuffle">\n{parsed["organize_pdf"]["inner"]}\n</g>'
T['organize-pdf'] = {'vb': parsed['organize_pdf']['viewBox'], 'svg': org_in}

# 8. rotate-pdf
rot_in = parsed['rotate_pdf']['inner']
rot_in = rot_in.replace('<g fillRule="nonzero">', '<g className="ilove-anim-spin" fillRule="nonzero">')
T['rotate-pdf'] = {'vb': parsed['rotate_pdf']['viewBox'], 'svg': rot_in}

# 9. crop-pdf
crop_in = f'<g className="ilove-anim-crop">\n{parsed["crop_pdf"]["inner"]}\n</g>'
T['crop-pdf'] = {'vb': parsed['crop_pdf']['viewBox'], 'svg': crop_in}

# 10. add-page-numbers
pn_in = f'<g className="ilove-anim-number-pulse">\n{parsed["page_numbers"]["inner"]}\n</g>'
T['add-page-numbers'] = {'vb': parsed['page_numbers']['viewBox'], 'svg': pn_in}

# 11. watermark-pdf
wm_in = parsed['watermark']['inner']
wm_in = re.sub(r'(<path fill="#fff"[^>]*d="M32\.313 14\.859)', r'<path className="ilove-anim-stamp" fill="#fff" d="M32.313 14.859', wm_in)
T['watermark-pdf'] = {'vb': parsed['watermark']['viewBox'], 'svg': wm_in}

# 12. edit-pdf
ed_in = parsed['edit_pdf']['inner']
ed_in = re.sub(r'(<g>\s*<path fill="#fff" d="M84\.272 58\.77)', r'<g className="ilove-anim-pencil">\n\1', ed_in)
T['edit-pdf'] = {'vb': parsed['edit_pdf']['viewBox'], 'svg': ed_in}

# 13. pdf-forms
pf_in = f'<g className="ilove-anim-form-check">\n{parsed["pdf_forms"]["inner"]}\n</g>'
T['pdf-forms'] = {'vb': parsed['pdf_forms']['viewBox'], 'svg': pf_in}

# 14. unlock-pdf
un_in = parsed['unlock_pdf']['inner'].replace('<path fill="#fff" fillRule="nonzero"', '<path className="ilove-anim-shackle" fill="#fff" fillRule="nonzero"')
T['unlock-pdf'] = {'vb': parsed['unlock_pdf']['viewBox'], 'svg': un_in}

# 15. protect-pdf
pr_in = parsed['protect_pdf']['inner'].replace('<g fill="#fff">', '<g className="ilove-anim-shield" fill="#fff">')
T['protect-pdf'] = {'vb': parsed['protect_pdf']['viewBox'], 'svg': pr_in}

# 16. sign-pdf
sn_in = parsed['sign_pdf']['inner']
sn_in = re.sub(r'(<g>\s*<path fill="#AB6993" d="M68\.88 47\.86)', r'<g className="ilove-anim-pen-sign">\n\1', sn_in)
T['sign-pdf'] = {'vb': parsed['sign_pdf']['viewBox'], 'svg': sn_in}

# 17. redact-pdf
red_in = parsed['redact_pdf']['inner']
red_in = re.sub(r'(<path fill="#4A7AAB" fillRule="evenodd" d="M21\.284 18\.875)', r'<g className="ilove-anim-redact">\n\1', red_in) + '\n</g>'
T['redact-pdf'] = {'vb': parsed['redact_pdf']['viewBox'], 'svg': red_in}

# 18. compare-pdf
cmp_in = parsed['compare_pdf']['inner']
cmp_in = re.sub(r'(d="M24 0h2v50h-2z")', r'className="ilove-anim-compare-scan" \1', cmp_in)
T['compare-pdf'] = {'vb': parsed['compare_pdf']['viewBox'], 'svg': cmp_in}

# 19. summarize-pdf
ai_in = parsed['ai_summarizer']['inner']
ai_in = re.sub(r'(<circle[^>]*>)', r'<g className="ilove-anim-star-pulse">\1</g>', ai_in)
T['summarize-pdf'] = {'vb': parsed['ai_summarizer']['viewBox'], 'svg': ai_in}

# 20. translate-pdf
tr_in = parsed['translate_pdf']['inner']
tr_in = re.sub(r'(<path fill="url\(#[^\"]+\)" d="M22 17[^>]*>)', r'<g className="ilove-anim-translate-arrow">\1</g>', tr_in)
T['translate-pdf'] = {'vb': parsed['translate_pdf']['viewBox'], 'svg': tr_in}

# 21. pdf-to-markdown
pm_in = f'<g className="ilove-anim-markdown-glow">\n{parsed["pdf_to_markdown"]["inner"]}\n</g>'
T['pdf-to-markdown'] = {'vb': parsed['pdf_to_markdown']['viewBox'], 'svg': pm_in}

# 22. Official Converter Tools:
T['jpg-to-pdf'] = {'vb': parsed['jpg_to_pdf']['viewBox'], 'svg': add_convert_anim('jpg_to_pdf')}
T['pdf-to-jpg'] = {'vb': parsed['pdf_to_jpg']['viewBox'], 'svg': add_convert_anim('pdf_to_jpg')}
T['word-to-pdf'] = {'vb': parsed['word_to_pdf']['viewBox'], 'svg': add_convert_anim('word_to_pdf')}
T['pdf-to-word'] = {'vb': parsed['pdf_to_word']['viewBox'], 'svg': add_convert_anim('pdf_to_word')}
T['powerpoint-to-pdf'] = {'vb': parsed['powerpoint_to_pdf']['viewBox'], 'svg': add_convert_anim('powerpoint_to_pdf')}
T['pdf-to-powerpoint'] = {'vb': parsed['pdf_to_powerpoint']['viewBox'], 'svg': add_convert_anim('pdf_to_powerpoint')}
T['excel-to-pdf'] = {'vb': parsed['excel_to_pdf']['viewBox'], 'svg': add_convert_anim('excel_to_pdf')}
T['pdf-to-excel'] = {'vb': parsed['pdf_to_excel']['viewBox'], 'svg': add_convert_anim('pdf_to_excel')}
T['html-to-pdf'] = {'vb': parsed['html_to_pdf']['viewBox'], 'svg': parsed['html_to_pdf']['inner']}
T['pdf-to-pdfa'] = {'vb': parsed['pdf_to_pdfa']['viewBox'], 'svg': parsed['pdf_to_pdfa']['inner']}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# UNIQUE CRAFTED VECTORS FOR ALL REMAINING 33 TOOLS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 23. merge-docx (Word Blue cards with 'W' merging inward)
T['merge-docx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fill="#295795" fillRule="evenodd">
  <path className="ilove-anim-merge-tl" d="M5.5.36h21.75c1.78 0 2.43.18 3.08.53a3.66 3.66 0 0 1 1.51 1.51c.35.65.53 1.3.53 3.08v21.75c0 1.78-.18 2.43-.53 3.08a3.66 3.66 0 0 1-1.51 1.51c-.65.35-1.3.54-3.08.54H5.5c-1.78 0-2.43-.19-3.08-.54A3.66 3.66 0 0 1 .9 30.31c-.35-.65-.53-1.3-.53-3.08V5.48c0-1.78.18-2.43.53-3.08A3.7 3.7 0 0 1 2.42.89C3.07.54 3.72.36 5.5.36z" />
  <path className="ilove-anim-merge-br" d="M44.56 49.69H22.82c-1.78 0-2.43-.18-3.08-.53a3.6 3.6 0 0 1-1.51-1.51c-.35-.65-.54-1.3-.54-3.08V22.82c0-1.78.19-2.43.54-3.08a3.6 3.6 0 0 1 1.51-1.51c.65-.35 1.3-.54 3.08-.54h21.74c1.79 0 2.43.19 3.08.54.65.34 1.17.87 1.51 1.51.35.65.54 1.3.54 3.08v21.75c0 1.78-.19 2.43-.54 3.08a3.6 3.6 0 0 1-1.51 1.51c-.65.35-1.3.53-3.08.53z" />
</g>
<g className="ilove-anim-merge-arrows" fill="#FFF">
  <path d="M11 7h2.2l1.3 7 1.2-7h2l1.2 7 1.3-7h2.2l-2.2 11h-2.1l-1.4-7.2L15.3 18H13.2L11 7z" />
  <path d="M30 29h2.2l1.3 7 1.2-7h2l1.2 7 1.3-7h2.2l-2.2 11h-2.1l-1.4-7.2L34.3 40H32.2L30 29z" />
  <circle cx="21" cy="29" r="1.5" />
  <circle cx="25" cy="25" r="1.5" />
  <circle cx="29" cy="21" r="1.5" />
</g>
'''
}

# 24. merge-xlsx (Excel Green spreadsheet cards with table rows merging inward)
T['merge-xlsx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fill="#2E7237" fillRule="evenodd">
  <path className="ilove-anim-merge-tl" d="M5.5.36h21.75c1.78 0 2.43.18 3.08.53a3.66 3.66 0 0 1 1.51 1.51c.35.65.53 1.3.53 3.08v21.75c0 1.78-.18 2.43-.53 3.08a3.66 3.66 0 0 1-1.51 1.51c-.65.35-1.3.54-3.08.54H5.5c-1.78 0-2.43-.19-3.08-.54A3.66 3.66 0 0 1 .9 30.31c-.35-.65-.53-1.3-.53-3.08V5.48c0-1.78.18-2.43.53-3.08A3.7 3.7 0 0 1 2.42.89C3.07.54 3.72.36 5.5.36z" />
  <path className="ilove-anim-merge-br" d="M44.56 49.69H22.82c-1.78 0-2.43-.18-3.08-.53a3.6 3.6 0 0 1-1.51-1.51c-.35-.65-.54-1.3-.54-3.08V22.82c0-1.78.19-2.43.54-3.08a3.6 3.6 0 0 1 1.51-1.51c.65-.35 1.3-.54 3.08-.54h21.74c1.79 0 2.43.19 3.08.54.65.34 1.17.87 1.51 1.51.35.65.54 1.3.54 3.08v21.75c0 1.78-.19 2.43-.54 3.08a3.6 3.6 0 0 1-1.51 1.51c-.65.35-1.3.53-3.08.53z" />
</g>
<g className="ilove-anim-merge-arrows" fill="#FFF">
  <path d="M10 7h12v12H10z m2 2v3h8v-3z m0 5v3h3v-3z m5 0v3h3v-3z" />
  <path d="M28 29h12v12H28z m2 2v3h8v-3z m0 5v3h3v-3z m5 0v3h3v-3z" />
  <path d="M19 19 l4 4 m0-4 l-4 4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
</g>
'''
}

# 25. merge-pptx (PowerPoint Orange slide cards merging inward)
T['merge-pptx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fill="#D04526" fillRule="evenodd">
  <path className="ilove-anim-merge-tl" d="M5.5.36h21.75c1.78 0 2.43.18 3.08.53a3.66 3.66 0 0 1 1.51 1.51c.35.65.53 1.3.53 3.08v21.75c0 1.78-.18 2.43-.53 3.08a3.66 3.66 0 0 1-1.51 1.51c-.65.35-1.3.54-3.08.54H5.5c-1.78 0-2.43-.19-3.08-.54A3.66 3.66 0 0 1 .9 30.31c-.35-.65-.53-1.3-.53-3.08V5.48c0-1.78.18-2.43.53-3.08A3.7 3.7 0 0 1 2.42.89C3.07.54 3.72.36 5.5.36z" />
  <path className="ilove-anim-merge-br" d="M44.56 49.69H22.82c-1.78 0-2.43-.18-3.08-.53a3.6 3.6 0 0 1-1.51-1.51c-.35-.65-.54-1.3-.54-3.08V22.82c0-1.78.19-2.43.54-3.08a3.6 3.6 0 0 1 1.51-1.51c.65-.35 1.3-.54 3.08-.54h21.74c1.79 0 2.43.19 3.08.54.65.34 1.17.87 1.51 1.51.35.65.54 1.3.54 3.08v21.75c0 1.78-.19 2.43-.54 3.08a3.6 3.6 0 0 1-1.51 1.51c-.65.35-1.3.53-3.08.53z" />
</g>
<g className="ilove-anim-merge-arrows" fill="#FFF">
  <path d="M11 7h5c3.5 0 5 1.8 5 4.5s-1.5 4.5-5 4.5h-2v3h-3V7z m3 2.5v4h2c1.8 0 2.5-.8 2.5-2s-.7-2-2.5-2h-2z" />
  <path d="M30 29h5c3.5 0 5 1.8 5 4.5s-1.5 4.5-5 4.5h-2v3h-3v-12z m3 2.5v4h2c1.8 0 2.5-.8 2.5-2s-.7-2-2.5-2h-2z" />
  <circle cx="25" cy="25" r="2" />
</g>
'''
}

# 26. merge-images (Two polaroids with mountain and sun converging)
T['merge-images'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fillRule="evenodd">
  <g className="ilove-anim-merge-tl">
    <rect x="2" y="2" width="28" height="26" rx="4" fill="#F59E0B" />
    <circle cx="9" cy="8" r="2" fill="#FFF" />
    <path d="M5 22l6-8 5 6 4-4 7 8H5z" fill="#FFF" />
  </g>
  <g className="ilove-anim-merge-br">
    <rect x="20" y="22" width="28" height="26" rx="4" fill="#E11D48" />
    <circle cx="27" cy="28" r="2" fill="#FFF" />
    <path d="M23 42l6-8 5 6 4-4 7 8H23z" fill="#FFF" />
  </g>
  <g className="ilove-anim-merge-arrows" fill="#FFF">
    <circle cx="21" cy="29" r="1.5" />
    <circle cx="25" cy="25" r="1.8" />
    <circle cx="29" cy="21" r="1.5" />
  </g>
</g>
'''
}

# 27. split-docx (Blue Word doc with vertical scissor/cut splitting into two files)
T['split-docx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fill="#295795" fillRule="evenodd">
  <path className="ilove-anim-split-tl" d="M5.5.36h21.75c1.78 0 2.43.18 3.08.53a3.66 3.66 0 0 1 1.51 1.51c.35.65.53 1.3.53 3.08v21.75c0 1.78-.18 2.43-.53 3.08a3.66 3.66 0 0 1-1.51 1.51c-.65.35-1.3.54-3.08.54H5.5c-1.78 0-2.43-.19-3.08-.54A3.66 3.66 0 0 1 .9 30.31c-.35-.65-.53-1.3-.53-3.08V5.48c0-1.78.18-2.43.53-3.08A3.7 3.7 0 0 1 2.42.89C3.07.54 3.72.36 5.5.36z" />
  <path className="ilove-anim-split-br" d="M44.56 49.69H22.82c-1.78 0-2.43-.18-3.08-.53a3.6 3.6 0 0 1-1.51-1.51c-.35-.65-.54-1.3-.54-3.08V22.82c0-1.78.19-2.43.54-3.08a3.6 3.6 0 0 1 1.51-1.51c.65-.35 1.3-.54 3.08-.54h21.74c1.79 0 2.43.19 3.08.54.65.34 1.17.87 1.51 1.51.35.65.54 1.3.54 3.08v21.75c0 1.78-.19 2.43-.54 3.08a3.6 3.6 0 0 1-1.51 1.51c-.65.35-1.3.53-3.08.53z" />
</g>
<g className="ilove-anim-split-arrows" fill="#FFF">
  <path d="M7 14l5-5v3h5v4h-5v3z" />
  <path d="M43 36l-5 5v-3h-5v-4h5v-3z" />
  <circle cx="21" cy="21" r="1.5" />
  <circle cx="25" cy="25" r="1.5" />
  <circle cx="29" cy="29" r="1.5" />
</g>
'''
}

# 28. split-xlsx (Green spreadsheet separating into distinct worksheets)
T['split-xlsx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fill="#2E7237" fillRule="evenodd">
  <path className="ilove-anim-split-tl" d="M5.5.36h21.75c1.78 0 2.43.18 3.08.53a3.66 3.66 0 0 1 1.51 1.51c.35.65.53 1.3.53 3.08v21.75c0 1.78-.18 2.43-.53 3.08a3.66 3.66 0 0 1-1.51 1.51c-.65.35-1.3.54-3.08.54H5.5c-1.78 0-2.43-.19-3.08-.54A3.66 3.66 0 0 1 .9 30.31c-.35-.65-.53-1.3-.53-3.08V5.48c0-1.78.18-2.43.53-3.08A3.7 3.7 0 0 1 2.42.89C3.07.54 3.72.36 5.5.36z" />
  <path className="ilove-anim-split-br" d="M44.56 49.69H22.82c-1.78 0-2.43-.18-3.08-.53a3.6 3.6 0 0 1-1.51-1.51c-.35-.65-.54-1.3-.54-3.08V22.82c0-1.78.19-2.43.54-3.08a3.6 3.6 0 0 1 1.51-1.51c.65-.35 1.3-.54 3.08-.54h21.74c1.79 0 2.43.19 3.08.54.65.34 1.17.87 1.51 1.51.35.65.54 1.3.54 3.08v21.75c0 1.78-.19 2.43-.54 3.08a3.6 3.6 0 0 1-1.51 1.51c-.65.35-1.3.53-3.08.53z" />
</g>
<g className="ilove-anim-split-arrows" fill="#FFF">
  <path d="M10 10h10v2h-10z m0 4h10v2h-10z m0 4h6v2h-6z" />
  <path d="M30 30h10v2h-10z m0 4h10v2h-10z m4 4h6v2h-6z" />
  <path d="M8 20l-4-4 4-4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  <path d="M42 30l4 4-4 4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
</g>
'''
}

# 29. split-pptx (Orange presentation slide deck fanning outward)
T['split-pptx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<g fill="#D04526" fillRule="evenodd">
  <path className="ilove-anim-split-tl" d="M5.5.36h21.75c1.78 0 2.43.18 3.08.53a3.66 3.66 0 0 1 1.51 1.51c.35.65.53 1.3.53 3.08v21.75c0 1.78-.18 2.43-.53 3.08a3.66 3.66 0 0 1-1.51 1.51c-.65.35-1.3.54-3.08.54H5.5c-1.78 0-2.43-.19-3.08-.54A3.66 3.66 0 0 1 .9 30.31c-.35-.65-.53-1.3-.53-3.08V5.48c0-1.78.18-2.43.53-3.08A3.7 3.7 0 0 1 2.42.89C3.07.54 3.72.36 5.5.36z" />
  <path className="ilove-anim-split-br" d="M44.56 49.69H22.82c-1.78 0-2.43-.18-3.08-.53a3.6 3.6 0 0 1-1.51-1.51c-.35-.65-.54-1.3-.54-3.08V22.82c0-1.78.19-2.43.54-3.08a3.6 3.6 0 0 1 1.51-1.51c.65-.35 1.3-.54 3.08-.54h21.74c1.79 0 2.43.19 3.08.54.65.34 1.17.87 1.51 1.51.35.65.54 1.3.54 3.08v21.75c0 1.78-.19 2.43-.54 3.08a3.6 3.6 0 0 1-1.51 1.51c-.65.35-1.3.53-3.08.53z" />
</g>
<g className="ilove-anim-split-arrows" fill="#FFF">
  <rect x="8" y="8" width="12" height="9" rx="1.5" />
  <rect x="30" y="32" width="12" height="9" rx="1.5" />
  <circle cx="21" cy="29" r="1.5" />
  <circle cx="25" cy="25" r="1.5" />
  <circle cx="29" cy="21" r="1.5" />
</g>
'''
}

# 30. extract-pages (Sheet lifting up out of stack with up-arrow)
T['extract-pages'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#EE6C4D" />
<g className="ilove-anim-eject-page">
  <path d="M15 16h20v22H15z" rx="3" fill="#FFF" />
  <path d="M19 22h12M19 27h8" stroke="#EE6C4D" strokeWidth="2" strokeLinecap="round" />
  <path d="M25 8l-5 6h3.5v6h3v-6H30z" fill="#FFF" />
</g>
<path d="M11 36h28v4H11z" fill="#FFC9BA" rx="2" />
<path d="M13 41h24v3H13z" fill="#E05333" rx="1.5" />
'''
}

# 31. remove-pages (Page sliding down with pulsing red minus badge)
T['remove-pages'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#EE6C4D" />
<g className="ilove-anim-trash-page">
  <rect x="12" y="10" width="26" height="32" rx="4" fill="#FFF" />
  <path d="M17 18h16M17 23h12M17 28h16" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
</g>
<g className="ilove-anim-badge-pulse">
  <circle cx="36" cy="14" r="8" fill="#DC2626" stroke="#FFF" strokeWidth="2" />
  <path d="M32 14h8" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
</g>
'''
}

# 32. replace-pages (Two pages swapping with rotating circular arrows)
T['replace-pages'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#EE6C4D" />
<rect x="8" y="12" width="18" height="24" rx="3" fill="#FFF" opacity="0.85" />
<rect x="24" y="14" width="18" height="24" rx="3" fill="#FFF" />
<path d="M28 20h10M28 25h7" stroke="#EE6C4D" strokeWidth="1.8" strokeLinecap="round" />
<g className="ilove-anim-spin">
  <circle cx="22" cy="24" r="7" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="9 4" />
  <polygon points="27,20 30,24 24,24" fill="#2563EB" />
</g>
'''
}

# 33. insert-pages (Green plus page descending between two sheets)
T['insert-pages'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#EE6C4D" />
<rect x="6" y="16" width="16" height="24" rx="3" fill="#FFC9BA" />
<rect x="28" y="16" width="16" height="24" rx="3" fill="#FFC9BA" />
<g className="ilove-anim-insert-down">
  <rect x="16" y="8" width="18" height="26" rx="3" fill="#FFF" stroke="#16A34A" strokeWidth="1.5" />
  <circle cx="25" cy="21" r="5" fill="#16A34A" />
  <path d="M25 18v6M22 21h6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
</g>
'''
}

# 34. duplicate-pages (Twin clone page sliding out with 2x badge)
T['duplicate-pages'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#EE6C4D" />
<g className="ilove-anim-clone-slide">
  <rect x="18" y="8" width="22" height="30" rx="3" fill="#FFF" opacity="0.9" />
  <path d="M22 15h12M22 20h8" stroke="#EE6C4D" strokeWidth="1.8" strokeLinecap="round" />
</g>
<rect x="10" y="14" width="22" height="30" rx="3" fill="#FFF" />
<path d="M14 21h12M14 26h8" stroke="#EE6C4D" strokeWidth="1.8" strokeLinecap="round" />
<g className="ilove-anim-badge-pulse">
  <rect x="26" y="32" width="16" height="10" rx="5" fill="#0284C7" />
  <text x="34" y="40" fill="#FFF" fontSize="8" fontWeight="bold" textAnchor="middle">2×</text>
</g>
'''
}

# 35. nup-pdf (4 miniature page quadrants arranged on a single sheet)
T['nup-pdf'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#EE6C4D" />
<rect x="8" y="6" width="34" height="38" rx="4" fill="#FFF" />
<g className="ilove-anim-number-pulse">
  <rect x="12" y="10" width="11" height="13" rx="2" fill="#FEE2E2" stroke="#EE6C4D" strokeWidth="1" />
  <text x="17.5" y="19" fill="#EE6C4D" fontSize="7" fontWeight="bold" textAnchor="middle">1</text>
  
  <rect x="27" y="10" width="11" height="13" rx="2" fill="#FEE2E2" stroke="#EE6C4D" strokeWidth="1" />
  <text x="32.5" y="19" fill="#EE6C4D" fontSize="7" fontWeight="bold" textAnchor="middle">2</text>
  
  <rect x="12" y="27" width="11" height="13" rx="2" fill="#FEE2E2" stroke="#EE6C4D" strokeWidth="1" />
  <text x="17.5" y="36" fill="#EE6C4D" fontSize="7" fontWeight="bold" textAnchor="middle">3</text>
  
  <rect x="27" y="27" width="11" height="13" rx="2" fill="#FEE2E2" stroke="#EE6C4D" strokeWidth="1" />
  <text x="32.5" y="36" fill="#EE6C4D" fontSize="7" fontWeight="bold" textAnchor="middle">4</text>
</g>
'''
}

# 36. compress-image (Photo card with 4-corner calipers squeezing inward)
T['compress-image'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#F59E0B" />
<rect x="10" y="10" width="30" height="30" rx="4" fill="#FFF" />
<circle cx="18" cy="18" r="3" fill="#F59E0B" />
<path d="M14 34l8-9 6 6 5-5 5 8H14z" fill="#F59E0B" />
<g className="ilove-anim-compress-arrows">
  <path d="M7 7l6 6M7 13v-6h6" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M43 7l-6 6M43 13v-6h-6" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M7 43l6-6M7 37v6h6" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M43 43l-6-6M43 37v6h-6" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
</g>
'''
}

# 37. image-to-text (Split photo & text with scanning beam)
T['image-to-text'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#8FBC5D" />
<g fill="#FFF">
  <path d="M9 12h14v26H9z" rx="3" />
  <circle cx="15" cy="18" r="2.5" fill="#8FBC5D" />
  <path d="M11 32l4-5 3 3 2-2 3 4H11z" fill="#8FBC5D" />
</g>
<g fill="#FFF">
  <path d="M27 12h14v26H27z" rx="3" />
  <path d="M30 18h8M30 22h8M30 26h8M30 30h5" stroke="#8FBC5D" strokeWidth="1.8" strokeLinecap="round" />
</g>
<g className="ilove-anim-compare-scan">
  <path d="M25 8v34" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
  <circle cx="25" cy="25" r="3" fill="#FFF" />
</g>
'''
}

# 38. flatten-pdf (3 stacked layer sheets pressing down flat)
T['flatten-pdf'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#8FBC5D" />
<g className="ilove-anim-flatten-layers">
  <rect x="12" y="10" width="26" height="8" rx="2" fill="#FFF" opacity="0.6" />
  <rect x="12" y="18" width="26" height="8" rx="2" fill="#FFF" opacity="0.8" />
  <rect x="12" y="26" width="26" height="12" rx="3" fill="#FFF" />
  <path d="M16 32h14M16 35h8" stroke="#8FBC5D" strokeWidth="1.5" strokeLinecap="round" />
</g>
<g className="ilove-anim-compress-arrows">
  <path d="M25 4v6M22 7l3 3 3-3" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
</g>
'''
}

# 39. csv-to-pdf (Teal CSV table converting to red PDF card)
T['csv-to-pdf'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M17.68 34.34h9.55c2.48 0 3.38-.26 4.28-.74a5.04 5.04 0 0 0 2.1-2.1c.48-.9.74-1.8.74-4.28v-9.55H44.82c1.8 0 2.45.19 3.11.54s1.18.87 1.53 1.53.54 1.31.54 3.11V44.82c0 1.8-.19 2.45-.54 3.11a3.7 3.7 0 0 1-1.53 1.53c-.66.35-1.31.54-3.11.54H22.86c-1.8 0-2.45-.19-3.11-.54s-1.18-.87-1.53-1.53-.54-1.31-.54-3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#FFF" d="M43.94 37.14c0-.48-.4-.86-.88-.86s-.88.38-.88.86v3.84l-5.15-5.05a.89.89 0 0 0-1.25 0 .85.85 0 0 0-.26.61.86.86 0 0 0 .26.61l5.14 5.05H37.01c-.49 0-.88.39-.88.87s.4.87.88.87h6.05a.9.9 0 0 0 .34-.07.87.87 0 0 0 .48-.47.8.8 0 0 0 .06-.33l.004-5.93z" />
</g>
<rect x="2" y="2" width="28" height="28" rx="4" fill="#0D9488" />
<g fill="#FFF">
  <text x="7" y="16" fontSize="7" fontWeight="bold" fontFamily="monospace">CSV</text>
  <circle cx="8" cy="22" r="1.2" />
  <circle cx="14" cy="22" r="1.2" />
  <circle cx="20" cy="22" r="1.2" />
</g>
'''
}

# 40. csv-to-xlsx (Teal CSV converting to rich Green Excel)
T['csv-to-xlsx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#2E7237" fillRule="evenodd" d="M17.68 34.34h9.55c2.48 0 3.38-.26 4.28-.74a5.04 5.04 0 0 0 2.1-2.1c.48-.9.74-1.8.74-4.28v-9.55H44.82c1.8 0 2.45.19 3.11.54s1.18.87 1.53 1.53.54 1.31.54 3.11V44.82c0 1.8-.19 2.45-.54 3.11a3.7 3.7 0 0 1-1.53 1.53c-.66.35-1.31.54-3.11.54H22.86c-1.8 0-2.45-.19-3.11-.54s-1.18-.87-1.53-1.53-.54-1.31-.54-3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#FFF" d="M43.94 37.14c0-.48-.4-.86-.88-.86s-.88.38-.88.86v3.84l-5.15-5.05a.89.89 0 0 0-1.25 0 .85.85 0 0 0-.26.61.86.86 0 0 0 .26.61l5.14 5.05H37.01c-.49 0-.88.39-.88.87s.4.87.88.87h6.05a.9.9 0 0 0 .34-.07.87.87 0 0 0 .48-.47.8.8 0 0 0 .06-.33l.004-5.93z" />
</g>
<rect x="2" y="2" width="28" height="28" rx="4" fill="#0D9488" />
<g fill="#FFF">
  <text x="7" y="16" fontSize="7" fontWeight="bold" fontFamily="monospace">CSV</text>
  <path d="M6 21h18M6 25h18M12 18v9M18 18v9" stroke="#FFF" strokeWidth="1" />
</g>
'''
}

# 41. txt-to-docx (Plain grey memo upgrading to blue Word document)
T['txt-to-docx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#295795" fillRule="evenodd" d="M17.68 34.34h9.55c2.48 0 3.38-.26 4.28-.74a5.04 5.04 0 0 0 2.1-2.1c.48-.9.74-1.8.74-4.28v-9.55H44.82c1.8 0 2.45.19 3.11.54s1.18.87 1.53 1.53.54 1.31.54 3.11V44.82c0 1.8-.19 2.45-.54 3.11a3.7 3.7 0 0 1-1.53 1.53c-.66.35-1.31.54-3.11.54H22.86c-1.8 0-2.45-.19-3.11-.54s-1.18-.87-1.53-1.53-.54-1.31-.54-3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#FFF" d="M43.94 37.14c0-.48-.4-.86-.88-.86s-.88.38-.88.86v3.84l-5.15-5.05a.89.89 0 0 0-1.25 0 .85.85 0 0 0-.26.61.86.86 0 0 0 .26.61l5.14 5.05H37.01c-.49 0-.88.39-.88.87s.4.87.88.87h6.05a.9.9 0 0 0 .34-.07.87.87 0 0 0 .48-.47.8.8 0 0 0 .06-.33l.004-5.93z" />
</g>
<rect x="2" y="2" width="28" height="28" rx="4" fill="#64748B" />
<g fill="#FFF">
  <text x="6" y="14" fontSize="7" fontWeight="bold" fontFamily="monospace">TXT</text>
  <path d="M6 19h18M6 23h14" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
</g>
'''
}

# 42. markdown-to-docx (Purple Markdown converting to blue Word document)
T['markdown-to-docx'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#295795" fillRule="evenodd" d="M17.68 34.34h9.55c2.48 0 3.38-.26 4.28-.74a5.04 5.04 0 0 0 2.1-2.1c.48-.9.74-1.8.74-4.28v-9.55H44.82c1.8 0 2.45.19 3.11.54s1.18.87 1.53 1.53.54 1.31.54 3.11V44.82c0 1.8-.19 2.45-.54 3.11a3.7 3.7 0 0 1-1.53 1.53c-.66.35-1.31.54-3.11.54H22.86c-1.8 0-2.45-.19-3.11-.54s-1.18-.87-1.53-1.53-.54-1.31-.54-3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#FFF" d="M43.94 37.14c0-.48-.4-.86-.88-.86s-.88.38-.88.86v3.84l-5.15-5.05a.89.89 0 0 0-1.25 0 .85.85 0 0 0-.26.61.86.86 0 0 0 .26.61l5.14 5.05H37.01c-.49 0-.88.39-.88.87s.4.87.88.87h6.05a.9.9 0 0 0 .34-.07.87.87 0 0 0 .48-.47.8.8 0 0 0 .06-.33l.004-5.93z" />
</g>
<rect x="2" y="2" width="28" height="28" rx="4" fill="#7253E2" />
<g fill="#FFF">
  <text x="6" y="15" fontSize="7" fontWeight="bold">MD</text>
  <path d="M18 10v10M15 17l3 3 3-3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
</g>
'''
}

# 43. docx-to-txt (Blue Word converting to clean slate text notepad)
T['docx-to-txt'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#64748B" fillRule="evenodd" d="M32.32 15.66h-9.55c-2.48 0-3.38.25-4.28.74a5.06 5.06 0 0 0-2.1 2.1c-.48.9-.74 1.8-.74 4.28v9.55H5.18c-1.8 0-2.45-.19-3.11-.54A3.7 3.7 0 0 1 .54 30.26C.19 29.6 0 28.95 0 27.15V5.18c0-1.8.19-2.45.54-3.11A3.7 3.7 0 0 1 2.07.54C2.73.19 3.38 0 5.18 0h21.97c1.8 0 2.45.19 3.11.54a3.7 3.7 0 0 1 1.53 1.53c.35.66.54 1.31.54 3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#295795" d="M14.48 7.52a.88.88 0 0 0-.88-.87c-.49 0-.89.39-.89.87v3.84L7.57 6.32a.89.89 0 0 0-1.25 0c-.17.16-.26.38-.26.61s.1.45.26.61l5.14 5.05H7.55c-.49 0-.89.39-.89.87s.4.86.89.86h6.05a.9.9 0 0 0 .34-.06.86.86 0 0 0 .48-.47.74.74 0 0 0 .06-.33l.004-5.94z" />
</g>
<rect x="22" y="17" width="26" height="28" rx="4" fill="#295795" />
<g fill="#FFF">
  <path d="M28 25h14M28 29h14M28 33h9" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" />
</g>
'''
}

# 44. docx-to-html (Blue Word converting to amber Web page < / >)
T['docx-to-html'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#D97706" fillRule="evenodd" d="M32.32 15.66h-9.55c-2.48 0-3.38.25-4.28.74a5.06 5.06 0 0 0-2.1 2.1c-.48.9-.74 1.8-.74 4.28v9.55H5.18c-1.8 0-2.45-.19-3.11-.54A3.7 3.7 0 0 1 .54 30.26C.19 29.6 0 28.95 0 27.15V5.18c0-1.8.19-2.45.54-3.11A3.7 3.7 0 0 1 2.07.54C2.73.19 3.38 0 5.18 0h21.97c1.8 0 2.45.19 3.11.54a3.7 3.7 0 0 1 1.53 1.53c.35.66.54 1.31.54 3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#295795" d="M14.48 7.52a.88.88 0 0 0-.88-.87c-.49 0-.89.39-.89.87v3.84L7.57 6.32a.89.89 0 0 0-1.25 0c-.17.16-.26.38-.26.61s.1.45.26.61l5.14 5.05H7.55c-.49 0-.89.39-.89.87s.4.86.89.86h6.05a.9.9 0 0 0 .34-.06.86.86 0 0 0 .48-.47.74.74 0 0 0 .06-.33l.004-5.94z" />
</g>
<rect x="22" y="17" width="26" height="28" rx="4" fill="#D97706" />
<g fill="#FFF">
  <text x="27" y="32" fontSize="7" fontWeight="bold">&lt;/&gt;</text>
  <circle cx="28" cy="22" r="1.2" />
  <circle cx="32" cy="22" r="1.2" />
  <circle cx="36" cy="22" r="1.2" />
</g>
'''
}

# 45. txt-to-pdf (Slate notepad converting to red PDF card)
T['txt-to-pdf'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M17.68 34.34h9.55c2.48 0 3.38-.26 4.28-.74a5.04 5.04 0 0 0 2.1-2.1c.48-.9.74-1.8.74-4.28v-9.55H44.82c1.8 0 2.45.19 3.11.54s1.18.87 1.53 1.53.54 1.31.54 3.11V44.82c0 1.8-.19 2.45-.54 3.11a3.7 3.7 0 0 1-1.53 1.53c-.66.35-1.31.54-3.11.54H22.86c-1.8 0-2.45-.19-3.11-.54s-1.18-.87-1.53-1.53-.54-1.31-.54-3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#FFF" d="M43.94 37.14c0-.48-.4-.86-.88-.86s-.88.38-.88.86v3.84l-5.15-5.05a.89.89 0 0 0-1.25 0 .85.85 0 0 0-.26.61.86.86 0 0 0 .26.61l5.14 5.05H37.01c-.49 0-.88.39-.88.87s.4.87.88.87h6.05a.9.9 0 0 0 .34-.07.87.87 0 0 0 .48-.47.8.8 0 0 0 .06-.33l.004-5.93z" />
</g>
<rect x="2" y="2" width="28" height="28" rx="4" fill="#64748B" />
<g fill="#FFF">
  <path d="M6 8h16M6 13h16M6 18h12M6 23h8" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" />
</g>
'''
}

# 46. markdown-to-pdf (Violet Markdown converting to red PDF card)
T['markdown-to-pdf'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M17.68 34.34h9.55c2.48 0 3.38-.26 4.28-.74a5.04 5.04 0 0 0 2.1-2.1c.48-.9.74-1.8.74-4.28v-9.55H44.82c1.8 0 2.45.19 3.11.54s1.18.87 1.53 1.53.54 1.31.54 3.11V44.82c0 1.8-.19 2.45-.54 3.11a3.7 3.7 0 0 1-1.53 1.53c-.66.35-1.31.54-3.11.54H22.86c-1.8 0-2.45-.19-3.11-.54s-1.18-.87-1.53-1.53-.54-1.31-.54-3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#FFF" d="M43.94 37.14c0-.48-.4-.86-.88-.86s-.88.38-.88.86v3.84l-5.15-5.05a.89.89 0 0 0-1.25 0 .85.85 0 0 0-.26.61.86.86 0 0 0 .26.61l5.14 5.05H37.01c-.49 0-.88.39-.88.87s.4.87.88.87h6.05a.9.9 0 0 0 .34-.07.87.87 0 0 0 .48-.47.8.8 0 0 0 .06-.33l.004-5.93z" />
</g>
<rect x="2" y="2" width="28" height="28" rx="4" fill="#7253E2" />
<g fill="#FFF">
  <text x="6" y="14" fontSize="6.5" fontWeight="bold"># MD</text>
  <path d="M6 19h16M6 23h12" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
</g>
'''
}

# 47. pdf-to-txt (Red PDF converting to slate text notepad)
T['pdf-to-txt'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M32.32 15.66h-9.55c-2.48 0-3.38.25-4.28.74a5.06 5.06 0 0 0-2.1 2.1c-.48.9-.74 1.8-.74 4.28v9.55H5.18c-1.8 0-2.45-.19-3.11-.54A3.7 3.7 0 0 1 .54 30.26C.19 29.6 0 28.95 0 27.15V5.18c0-1.8.19-2.45.54-3.11A3.7 3.7 0 0 1 2.07.54C2.73.19 3.38 0 5.18 0h21.97c1.8 0 2.45.19 3.11.54a3.7 3.7 0 0 1 1.53 1.53c.35.66.54 1.31.54 3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#EE6C4D" d="M14.48 7.52a.88.88 0 0 0-.88-.87c-.49 0-.89.39-.89.87v3.84L7.57 6.32a.89.89 0 0 0-1.25 0c-.17.16-.26.38-.26.61s.1.45.26.61l5.14 5.05H7.55c-.49 0-.89.39-.89.87s.4.86.89.86h6.05a.9.9 0 0 0 .34-.06.86.86 0 0 0 .48-.47.74.74 0 0 0 .06-.33l.004-5.94z" />
</g>
<rect x="22" y="17" width="26" height="28" rx="4" fill="#64748B" />
<g fill="#FFF">
  <path d="M26 23h18M26 27h18M26 31h14M26 35h8" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" />
</g>
'''
}

# 48. pdf-to-png (Red PDF converting to PNG transparent checkerboard with sparkles)
T['pdf-to-png'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M32.32 15.66h-9.55c-2.48 0-3.38.25-4.28.74a5.06 5.06 0 0 0-2.1 2.1c-.48.9-.74 1.8-.74 4.28v9.55H5.18c-1.8 0-2.45-.19-3.11-.54A3.7 3.7 0 0 1 .54 30.26C.19 29.6 0 28.95 0 27.15V5.18c0-1.8.19-2.45.54-3.11A3.7 3.7 0 0 1 2.07.54C2.73.19 3.38 0 5.18 0h21.97c1.8 0 2.45.19 3.11.54a3.7 3.7 0 0 1 1.53 1.53c.35.66.54 1.31.54 3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#9333EA" d="M14.48 7.52a.88.88 0 0 0-.88-.87c-.49 0-.89.39-.89.87v3.84L7.57 6.32a.89.89 0 0 0-1.25 0c-.17.16-.26.38-.26.61s.1.45.26.61l5.14 5.05H7.55c-.49 0-.89.39-.89.87s.4.86.89.86h6.05a.9.9 0 0 0 .34-.06.86.86 0 0 0 .48-.47.74.74 0 0 0 .06-.33l.004-5.94z" />
</g>
<rect x="22" y="17" width="26" height="28" rx="4" fill="#9333EA" />
<g fill="#FFF">
  <rect x="26" y="22" width="4" height="4" opacity="0.6" />
  <rect x="34" y="22" width="4" height="4" opacity="0.6" />
  <rect x="30" y="26" width="4" height="4" opacity="0.6" />
  <rect x="38" y="26" width="4" height="4" opacity="0.6" />
  <rect x="26" y="30" width="4" height="4" opacity="0.6" />
  <rect x="34" y="30" width="4" height="4" opacity="0.6" />
</g>
<g className="ilove-anim-star-pulse">
  <path d="M38 22l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#FFF" />
</g>
'''
}

# 49. pdf-to-html (Red PDF converting to Amber HTML browser window)
T['pdf-to-html'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M32.32 15.66h-9.55c-2.48 0-3.38.25-4.28.74a5.06 5.06 0 0 0-2.1 2.1c-.48.9-.74 1.8-.74 4.28v9.55H5.18c-1.8 0-2.45-.19-3.11-.54A3.7 3.7 0 0 1 .54 30.26C.19 29.6 0 28.95 0 27.15V5.18c0-1.8.19-2.45.54-3.11A3.7 3.7 0 0 1 2.07.54C2.73.19 3.38 0 5.18 0h21.97c1.8 0 2.45.19 3.11.54a3.7 3.7 0 0 1 1.53 1.53c.35.66.54 1.31.54 3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#D97706" d="M14.48 7.52a.88.88 0 0 0-.88-.87c-.49 0-.89.39-.89.87v3.84L7.57 6.32a.89.89 0 0 0-1.25 0c-.17.16-.26.38-.26.61s.1.45.26.61l5.14 5.05H7.55c-.49 0-.89.39-.89.87s.4.86.89.86h6.05a.9.9 0 0 0 .34-.06.86.86 0 0 0 .48-.47.74.74 0 0 0 .06-.33l.004-5.94z" />
</g>
<rect x="22" y="17" width="26" height="28" rx="4" fill="#D97706" />
<g fill="#FFF">
  <text x="27" y="33" fontSize="8" fontWeight="bold">&lt;/&gt;</text>
  <circle cx="28" cy="22" r="1.2" />
  <circle cx="32" cy="22" r="1.2" />
  <circle cx="36" cy="22" r="1.2" />
</g>
'''
}

# 50. pdf-to-csv (Red PDF converting to Teal CSV data columns)
T['pdf-to-csv'] = {
    'vb': '0 0 50 50',
    'svg': '''
<path fill="#EE6C4D" fillRule="evenodd" d="M32.32 15.66h-9.55c-2.48 0-3.38.25-4.28.74a5.06 5.06 0 0 0-2.1 2.1c-.48.9-.74 1.8-.74 4.28v9.55H5.18c-1.8 0-2.45-.19-3.11-.54A3.7 3.7 0 0 1 .54 30.26C.19 29.6 0 28.95 0 27.15V5.18c0-1.8.19-2.45.54-3.11A3.7 3.7 0 0 1 2.07.54C2.73.19 3.38 0 5.18 0h21.97c1.8 0 2.45.19 3.11.54a3.7 3.7 0 0 1 1.53 1.53c.35.66.54 1.31.54 3.11zm0 0" />
<g className="ilove-anim-convert-arrow">
  <path fill="#0D9488" d="M14.48 7.52a.88.88 0 0 0-.88-.87c-.49 0-.89.39-.89.87v3.84L7.57 6.32a.89.89 0 0 0-1.25 0c-.17.16-.26.38-.26.61s.1.45.26.61l5.14 5.05H7.55c-.49 0-.89.39-.89.87s.4.86.89.86h6.05a.9.9 0 0 0 .34-.06.86.86 0 0 0 .48-.47.74.74 0 0 0 .06-.33l.004-5.94z" />
</g>
<rect x="22" y="17" width="26" height="28" rx="4" fill="#0D9488" />
<g fill="#FFF">
  <text x="27" y="27" fontSize="7" fontWeight="bold">CSV</text>
  <path d="M26 31h18M32 28v10M38 28v10" stroke="#FFF" strokeWidth="1" />
</g>
'''
}

# 51. rotate-pages (Two pages rotating in alternate rhythm with spin arrows)
T['rotate-pages'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#AB6993" />
<g className="ilove-anim-rotate-alt-left">
  <rect x="8" y="14" width="15" height="22" rx="3" fill="#FFF" />
  <path d="M11 20h9M11 24h6" stroke="#AB6993" strokeWidth="1.5" strokeLinecap="round" />
</g>
<g className="ilove-anim-rotate-alt-right">
  <rect x="27" y="14" width="15" height="22" rx="3" fill="#FFF" />
  <path d="M30 20h9M30 24h6" stroke="#AB6993" strokeWidth="1.5" strokeLinecap="round" />
</g>
<path d="M12 9c3-3 8-3 11 0l-2 2h5V6l-1.5 1.5" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
<path d="M38 41c-3 3-8 3-11 0l2-2h-5v5l1.5-1.5" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
'''
}

# 52. add-header-footer (Document with glowing top header and bottom footer strips)
T['add-header-footer'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#AB6993" />
<rect x="10" y="8" width="30" height="34" rx="4" fill="#FFF" />
<path d="M14 20h22M14 25h22M14 30h16" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
<g className="ilove-anim-header-footer">
  <rect x="13" y="11" width="24" height="6" rx="2" fill="#0D9488" />
  <rect x="13" y="33" width="24" height="6" rx="2" fill="#0D9488" />
  <circle cx="25" cy="14" r="1.5" fill="#FFF" />
  <circle cx="25" cy="36" r="1.5" fill="#FFF" />
</g>
'''
}

# 53. pdf-qa (Purple AI with chat question bubble ? and expanding audio soundwaves)
T['pdf-qa'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#7253E2" />
<rect x="9" y="12" width="22" height="28" rx="3" fill="#FFF" opacity="0.9" />
<path d="M13 18h14M13 23h14M13 28h8" stroke="#7253E2" strokeWidth="1.8" strokeLinecap="round" />
<g className="ilove-anim-badge-pulse">
  <path d="M22 18c0-5 4-9 9-9s9 4 9 9c0 3-1.5 5.5-4 7l2 5-5-2c-1 .6-2 1-3.5 1-5 0-9-4-9-9z" fill="#FFF" />
  <text x="31" y="22" fill="#7253E2" fontSize="12" fontWeight="bold" textAnchor="middle">?</text>
</g>
'''
}

# 54. add-image-to-pdf (Document with image picture frame floating down and snapping)
T['add-image-to-pdf'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#AB6993" />
<rect x="8" y="8" width="34" height="34" rx="4" fill="#FFF" />
<path d="M12 14h26M12 18h18" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
<g className="ilove-anim-insert-down">
  <rect x="14" y="21" width="22" height="17" rx="3" fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
  <circle cx="19" cy="26" r="2" fill="#FFF" />
  <path d="M16 36l4-5 3 3 3-4 6 6H16z" fill="#FFF" />
</g>
'''
}

# 55. pdf-find-replace (Document with magnifying glass and replace arrow A -> B)
T['pdf-find-replace'] = {
    'vb': '0 0 50 50',
    'svg': '''
<rect width="50" height="50" rx="12" fill="#AB6993" />
<rect x="8" y="8" width="34" height="34" rx="4" fill="#FFF" />
<path d="M13 15h24M13 20h24M13 25h16M13 30h20M13 35h12" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
<g className="ilove-anim-magnify">
  <circle cx="27" cy="23" r="8" fill="#FFF" stroke="#2563EB" strokeWidth="2.5" />
  <path d="M33 29l6 6" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
  <path d="M24 23l2-3 2 3h-1v3h-2v-3z" fill="#16A34A" />
</g>
'''
}

print(f"Total tools configured: {len(T)}")

# Verify all 64 tools from constants are in T:
with open('constants.tsx') as f:
    const_text = f.read()
import re
expected_ids = re.findall(r'id:\s*[\'\"]([^\'\"]+)[\'\"]\s*,\s*\n\s*name:', const_text)
# exclude user id
expected_ids = [t for t in expected_ids if not t.startswith('u_')]
print(f"Expected tool count from constants.tsx: {len(expected_ids)}")

missing = [t for t in expected_ids if t not in T]
print(f"Missing from T: {missing}")

# Now generate AnimatedToolIcon.tsx
code = '''import React from 'react';
import { LucideIcon, FileText } from 'lucide-react';

interface AnimatedToolIconProps {
  toolId: string;
  size?: number;
  className?: string;
  fallbackIcon?: LucideIcon;
  animate?: boolean;
}

export const AnimatedToolIcon: React.FC<AnimatedToolIconProps> = ({
  toolId,
  size = 40,
  className = '',
  fallbackIcon: FallbackIcon = FileText,
}) => {
  const s = size;

  return (
    <div className={`relative inline-flex items-center justify-center select-none overflow-visible group ${className}`}>
      <style>{`
  /* ━━━━━━━━━ High-Performance GPU Internal Micro-Animations ━━━━━━━━━ */
  @keyframes ilove-merge-tl {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, 3px); }
  }
  .ilove-anim-merge-tl {
    transform-box: fill-box;
    animation: ilove-merge-tl 2s infinite ease-in-out;
  }

  @keyframes ilove-merge-br {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-3px, -3px); }
  }
  .ilove-anim-merge-br {
    transform-box: fill-box;
    animation: ilove-merge-br 2s infinite ease-in-out;
  }

  @keyframes ilove-merge-arrows {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.9); opacity: 0.85; }
  }
  .ilove-anim-merge-arrows {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-merge-arrows 2s infinite ease-in-out;
  }

  @keyframes ilove-split-tl {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-3.5px, -3.5px); }
  }
  .ilove-anim-split-tl {
    transform-box: fill-box;
    animation: ilove-split-tl 2s infinite ease-in-out;
  }

  @keyframes ilove-split-br {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3.5px, 3.5px); }
  }
  .ilove-anim-split-br {
    transform-box: fill-box;
    animation: ilove-split-br 2s infinite ease-in-out;
  }

  @keyframes ilove-split-arrows {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.85; }
  }
  .ilove-anim-split-arrows {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-split-arrows 2s infinite ease-in-out;
  }

  @keyframes ilove-compress-blocks {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.92); }
  }
  .ilove-anim-compress-blocks {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-compress-blocks 2s infinite ease-in-out;
  }

  @keyframes ilove-compress-arrows {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.85); }
  }
  .ilove-anim-compress-arrows {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-compress-arrows 2s infinite ease-in-out;
  }

  @keyframes ilove-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .ilove-anim-spin {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-spin 4s infinite linear;
  }

  @keyframes ilove-pencil {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(3px, -2px) rotate(6deg); }
    50% { transform: translate(-2px, 2px) rotate(-6deg); }
    75% { transform: translate(2px, 1px) rotate(4deg); }
  }
  .ilove-anim-pencil {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: ilove-pencil 2s infinite ease-in-out;
  }

  @keyframes ilove-pen-sign {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(3px, -3px) rotate(8deg); }
    66% { transform: translate(-2px, 2px) rotate(-6deg); }
  }
  .ilove-anim-pen-sign {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: ilove-pen-sign 2.4s infinite ease-in-out;
  }

  @keyframes ilove-shackle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3.5px); }
  }
  .ilove-anim-shackle {
    transform-box: fill-box;
    transform-origin: bottom right;
    animation: ilove-shackle 2s infinite ease-in-out;
  }

  @keyframes ilove-shield {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .ilove-anim-shield {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-shield 2.2s infinite ease-in-out;
  }

  @keyframes ilove-stamp {
    0%, 100% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-2.5px) scale(1.05); }
    60% { transform: translateY(2px) scale(0.95); }
  }
  .ilove-anim-stamp {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-stamp 2s infinite ease-in-out;
  }

  @keyframes ilove-wrench {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(24deg); }
  }
  .ilove-anim-wrench {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-wrench 2s infinite ease-in-out;
  }

  @keyframes ilove-scanner-beam {
    0%, 100% { transform: translateY(0); opacity: 0.9; }
    50% { transform: translateY(3px); opacity: 1; }
  }
  .ilove-anim-scanner-beam {
    transform-box: fill-box;
    animation: ilove-scanner-beam 2s infinite ease-in-out;
  }

  @keyframes ilove-laser {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
  }
  .ilove-anim-laser {
    transform-box: fill-box;
    animation: ilove-laser 2s infinite ease-in-out;
  }

  @keyframes ilove-compare-scan {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(4px); }
  }
  .ilove-anim-compare-scan {
    transform-box: fill-box;
    animation: ilove-compare-scan 2s infinite ease-in-out;
  }

  @keyframes ilove-redact {
    0%, 100% { transform: scaleX(0.9); }
    50% { transform: scaleX(1.1); }
  }
  .ilove-anim-redact {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-redact 2s infinite ease-in-out;
  }

  @keyframes ilove-crop {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.93); }
  }
  .ilove-anim-crop {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-crop 2s infinite ease-in-out;
  }

  @keyframes ilove-star-pulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.25) rotate(15deg); }
  }
  .ilove-anim-star-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-star-pulse 2s infinite ease-in-out;
  }

  @keyframes ilove-translate-arrow {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(2.5px); }
  }
  .ilove-anim-translate-arrow {
    transform-box: fill-box;
    animation: ilove-translate-arrow 1.8s infinite ease-in-out;
  }

  @keyframes ilove-convert-arrow {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(2px, 2px); }
  }
  .ilove-anim-convert-arrow {
    transform-box: fill-box;
    animation: ilove-convert-arrow 1.8s infinite ease-in-out;
  }

  @keyframes ilove-card-shuffle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2.5px); }
  }
  .ilove-anim-card-shuffle {
    transform-box: fill-box;
    animation: ilove-card-shuffle 2s infinite ease-in-out;
  }

  @keyframes ilove-number-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .ilove-anim-number-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-number-pulse 2s infinite ease-in-out;
  }

  @keyframes ilove-form-check {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  .ilove-anim-form-check {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-form-check 2s infinite ease-in-out;
  }

  @keyframes ilove-markdown-glow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .ilove-anim-markdown-glow {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-markdown-glow 2s infinite ease-in-out;
  }

  @keyframes ilove-eject-page {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  .ilove-anim-eject-page {
    transform-box: fill-box;
    animation: ilove-eject-page 1.8s infinite ease-in-out;
  }

  @keyframes ilove-trash-page {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(2.5px); opacity: 0.85; }
  }
  .ilove-anim-trash-page {
    transform-box: fill-box;
    animation: ilove-trash-page 2s infinite ease-in-out;
  }

  @keyframes ilove-badge-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  .ilove-anim-badge-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-badge-pulse 1.8s infinite ease-in-out;
  }

  @keyframes ilove-insert-down {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3.5px); }
  }
  .ilove-anim-insert-down {
    transform-box: fill-box;
    animation: ilove-insert-down 2s infinite ease-in-out;
  }

  @keyframes ilove-clone-slide {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, -2px); }
  }
  .ilove-anim-clone-slide {
    transform-box: fill-box;
    animation: ilove-clone-slide 2s infinite ease-in-out;
  }

  @keyframes ilove-flatten-layers {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.75); }
  }
  .ilove-anim-flatten-layers {
    transform-box: fill-box;
    transform-origin: bottom;
    animation: ilove-flatten-layers 2s infinite ease-in-out;
  }

  @keyframes ilove-rotate-alt-left {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-15deg); }
  }
  .ilove-anim-rotate-alt-left {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-rotate-alt-left 2.5s infinite ease-in-out;
  }

  @keyframes ilove-rotate-alt-right {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(15deg); }
  }
  .ilove-anim-rotate-alt-right {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-rotate-alt-right 2.5s infinite ease-in-out;
  }

  @keyframes ilove-header-footer {
    0%, 100% { transform: scaleX(1); opacity: 1; }
    50% { transform: scaleX(1.06); opacity: 0.85; }
  }
  .ilove-anim-header-footer {
    transform-box: fill-box;
    transform-origin: center;
    animation: ilove-header-footer 2s infinite ease-in-out;
  }

  @keyframes ilove-magnify {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, 2px); }
  }
  .ilove-anim-magnify {
    transform-box: fill-box;
    animation: ilove-magnify 2s infinite ease-in-out;
  }
`}</style>
      {(() => {
        switch (toolId) {
'''

# Add all 64 cases
for tid in expected_ids:
    item = T[tid]
    vb = item['vb']
    svg = item['svg'].strip()
    code += f'''          case '{tid}':
            return (
              <svg width={{s}} height={{s}} viewBox="{vb}">
                {svg}
              </svg>
            );

'''

# Add default case with clean dynamic branded fallback
code += '''          default:
            return (
              <div 
                style={{ width: s, height: s }} 
                className="rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-white flex items-center justify-center shadow-sm"
              >
                <FallbackIcon size={s * 0.52} className="stroke-[1.8]" />
              </div>
            );
        }
      })()}
    </div>
  );
};
'''

with open('components/AnimatedToolIcon.tsx', 'w') as f:
    f.write(code)

print("Successfully written components/AnimatedToolIcon.tsx with all 64 unique tool animations!")
