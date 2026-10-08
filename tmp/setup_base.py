#!/usr/bin/env python3
import json
import re

# Load existing official iLovePDF SVGs from /tmp/all_ilovepdf_svgs.json
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

parsed_official = {}
for k, v in official_svgs.items():
    vb, inner = clean_inner(v)
    parsed_official[k] = {'viewBox': vb, 'inner': inner}

# Map of all 64 tools to their SVG definition (viewBox, inner JSX)
icons = {}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Base iLovePDF Official Tools with targeted internal animations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. merge-pdf
m_in = parsed_official['merge_pdf']['inner']
m_in = m_in.replace('d="M5.488.363', 'className="ilove-anim-merge-tl" d="M5.488.363')
m_in = m_in.replace('d="M44.563 49.69', 'className="ilove-anim-merge-br" d="M44.563 49.69')
m_in = m_in.replace('<path fill="#FFF"', '<path className="ilove-anim-merge-arrows" fill="#FFF"')
icons['merge-pdf'] = {'viewBox': parsed_official['merge_pdf']['viewBox'], 'inner': m_in}

# 2. split-pdf
sp_in = parsed_official['split_pdf']['inner']
sp_in = sp_in.replace('d="M5.488.363', 'className="ilove-anim-split-tl" d="M5.488.363')
sp_in = sp_in.replace('d="M44.563 49.69', 'className="ilove-anim-split-br" d="M44.563 49.69')
sp_in = sp_in.replace('<path fill="#FFF"', '<path className="ilove-anim-split-arrows" fill="#FFF"')
icons['split-pdf'] = {'viewBox': parsed_official['split_pdf']['viewBox'], 'inner': sp_in}

# 3. compress-pdf
cp_in = parsed_official['compress_pdf']['inner']
cp_in = cp_in.replace('<path fill="#8FBC5D"', '<path className="ilove-anim-compress-blocks" fill="#8FBC5D"')
cp_in = cp_in.replace('<path fill="#FFF"', '<path className="ilove-anim-compress-arrows" fill="#FFF"')
icons['compress-pdf'] = {'viewBox': parsed_official['compress_pdf']['viewBox'], 'inner': cp_in}

# 4. repair-pdf
rp_in = parsed_official['repair_pdf']['inner']
rp_in = re.sub(r'(<path fill="#fff" d="M12\.527 28\.82)', r'<path className="ilove-anim-wrench" fill="#fff" d="M12.527 28.82', rp_in)
icons['repair-pdf'] = {'viewBox': parsed_official['repair_pdf']['viewBox'], 'inner': rp_in}

# 5. ocr-pdf
ocr_in = parsed_official['ocr_pdf']['inner']
ocr_in = re.sub(r'(<path fill="#8FBC5D" fillRule="evenodd" d="M12\.5 37\.5v-12)', r'<path className="ilove-anim-laser" fill="#8FBC5D" fillRule="evenodd" d="M12.5 37.5v-12', ocr_in)
icons['ocr-pdf'] = {'viewBox': parsed_official['ocr_pdf']['viewBox'], 'inner': ocr_in}

# 6. scan-pdf
scan_in = f'<g className="ilove-anim-scanner-beam">\n{parsed_official["scan_to_pdf"]["inner"]}\n</g>'
icons['scan-pdf'] = {'viewBox': parsed_official['scan_to_pdf']['viewBox'], 'inner': scan_in}

# 7. organize-pdf
org_in = f'<g className="ilove-anim-card-shuffle">\n{parsed_official["organize_pdf"]["inner"]}\n</g>'
icons['organize-pdf'] = {'viewBox': parsed_official['organize_pdf']['viewBox'], 'inner': org_in}

# 8. rotate-pdf
rot_in = parsed_official['rotate_pdf']['inner']
rot_in = rot_in.replace('<g fillRule="nonzero">', '<g className="ilove-anim-spin" fillRule="nonzero">')
icons['rotate-pdf'] = {'viewBox': parsed_official['rotate_pdf']['viewBox'], 'inner': rot_in}

# 9. crop-pdf
crop_in = f'<g className="ilove-anim-crop">\n{parsed_official["crop_pdf"]["inner"]}\n</g>'
icons['crop-pdf'] = {'viewBox': parsed_official['crop_pdf']['viewBox'], 'inner': crop_in}

# 10. add-page-numbers
pn_in = f'<g className="ilove-anim-number-pulse">\n{parsed_official["page_numbers"]["inner"]}\n</g>'
icons['add-page-numbers'] = {'viewBox': parsed_official['page_numbers']['viewBox'], 'inner': pn_in}

# 11. watermark-pdf
wm_in = parsed_official['watermark']['inner']
wm_in = re.sub(r'(<path fill="#fff"[^>]*d="M32\.313 14\.859)', r'<path className="ilove-anim-stamp" fill="#fff" d="M32.313 14.859', wm_in)
icons['watermark-pdf'] = {'viewBox': parsed_official['watermark']['viewBox'], 'inner': wm_in}

# 12. edit-pdf
ed_in = parsed_official['edit_pdf']['inner']
ed_in = re.sub(r'(<g>\s*<path fill="#fff" d="M84\.272 58\.77)', r'<g className="ilove-anim-pencil">\n\1', ed_in)
icons['edit-pdf'] = {'viewBox': parsed_official['edit_pdf']['viewBox'], 'inner': ed_in}

# 13. pdf-forms
pf_in = f'<g className="ilove-anim-form-check">\n{parsed_official["pdf_forms"]["inner"]}\n</g>'
icons['pdf-forms'] = {'viewBox': parsed_official['pdf_forms']['viewBox'], 'inner': pf_in}

# 14. unlock-pdf
un_in = parsed_official['unlock_pdf']['inner'].replace('<path fill="#fff" fillRule="nonzero"', '<path className="ilove-anim-shackle" fill="#fff" fillRule="nonzero"')
icons['unlock-pdf'] = {'viewBox': parsed_official['unlock_pdf']['viewBox'], 'inner': un_in}

# 15. protect-pdf
pr_in = parsed_official['protect_pdf']['inner'].replace('<g fill="#fff">', '<g className="ilove-anim-shield" fill="#fff">')
icons['protect-pdf'] = {'viewBox': parsed_official['protect_pdf']['viewBox'], 'inner': pr_in}

# 16. sign-pdf
sn_in = parsed_official['sign_pdf']['inner']
sn_in = re.sub(r'(<g>\s*<path fill="#AB6993" d="M68\.88 47\.86)', r'<g className="ilove-anim-pen-sign">\n\1', sn_in)
icons['sign-pdf'] = {'viewBox': parsed_official['sign_pdf']['viewBox'], 'inner': sn_in}

# 17. redact-pdf
red_in = parsed_official['redact_pdf']['inner']
red_in = re.sub(r'(<path fill="#4A7AAB" fillRule="evenodd" d="M21\.284 18\.875)', r'<g className="ilove-anim-redact">\n\1', red_in) + '\n</g>'
icons['redact-pdf'] = {'viewBox': parsed_official['redact_pdf']['viewBox'], 'inner': red_in}

# 18. compare-pdf
cmp_in = parsed_official['compare_pdf']['inner']
cmp_in = re.sub(r'(d="M24 0h2v50h-2z")', r'className="ilove-anim-compare-scan" \1', cmp_in)
icons['compare-pdf'] = {'viewBox': parsed_official['compare_pdf']['viewBox'], 'inner': cmp_in}

# 19. summarize-pdf
ai_in = parsed_official['ai_summarizer']['inner']
ai_in = re.sub(r'(<circle[^>]*>)', r'<g className="ilove-anim-star-pulse">\1</g>', ai_in)
icons['summarize-pdf'] = {'viewBox': parsed_official['ai_summarizer']['viewBox'], 'inner': ai_in}

# 20. translate-pdf
tr_in = parsed_official['translate_pdf']['inner']
tr_in = re.sub(r'(<path fill="url\(#[^\"]+\)" d="M22 17[^>]*>)', r'<g className="ilove-anim-translate-arrow">\1</g>', tr_in)
icons['translate-pdf'] = {'viewBox': parsed_official['translate_pdf']['viewBox'], 'inner': tr_in}

# 21. pdf-to-markdown
pm_in = f'<g className="ilove-anim-markdown-glow">\n{parsed_official["pdf_to_markdown"]["inner"]}\n</g>'
icons['pdf-to-markdown'] = {'viewBox': parsed_official['pdf_to_markdown']['viewBox'], 'inner': pm_in}

# 22. Official Converter Tools:
def add_convert_anim(key):
    c = parsed_official[key]['inner']
    c = re.sub(r'(<path fill="#[A-Fa-f0-9]+" d="M(14\.477|43\.94)[^>]*>)', r'<g className="ilove-anim-convert-arrow">\1</g>', c)
    return c

icons['jpg-to-pdf'] = {'viewBox': parsed_official['jpg_to_pdf']['viewBox'], 'inner': add_convert_anim('jpg_to_pdf')}
icons['pdf-to-jpg'] = {'viewBox': parsed_official['pdf_to_jpg']['viewBox'], 'inner': add_convert_anim('pdf_to_jpg')}
icons['word-to-pdf'] = {'viewBox': parsed_official['word_to_pdf']['viewBox'], 'inner': add_convert_anim('word_to_pdf')}
icons['pdf-to-word'] = {'viewBox': parsed_official['pdf_to_word']['viewBox'], 'inner': add_convert_anim('pdf_to_word')}
icons['powerpoint-to-pdf'] = {'viewBox': parsed_official['powerpoint_to_pdf']['viewBox'], 'inner': add_convert_anim('powerpoint_to_pdf')}
icons['pdf-to-powerpoint'] = {'viewBox': parsed_official['pdf_to_powerpoint']['viewBox'], 'inner': add_convert_anim('pdf_to_powerpoint')}
icons['excel-to-pdf'] = {'viewBox': parsed_official['excel_to_pdf']['viewBox'], 'inner': add_convert_anim('excel_to_pdf')}
icons['pdf-to-excel'] = {'viewBox': parsed_official['pdf_to_excel']['viewBox'], 'inner': add_convert_anim('pdf_to_excel')}
icons['html-to-pdf'] = {'viewBox': parsed_official['html_to_pdf']['viewBox'], 'inner': parsed_official['html_to_pdf']['inner']}
icons['pdf-to-pdfa'] = {'viewBox': parsed_official['pdf_to_pdfa']['viewBox'], 'inner': parsed_official['pdf_to_pdfa']['inner']}

print(f"Base official icons prepared: {len(icons)}")

print("Ready for custom unique icons generation...")
