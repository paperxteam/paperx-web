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
    return viewBox, inner.strip()

parsed = {}
for k, v in raw_svgs.items():
    vb, inner = clean_inner(v)
    parsed[k] = {'viewBox': vb, 'inner': inner}

# Now for each icon, let's apply targeted micro-animations inside the SVG elements
# 1. merge_pdf: top-left card, bottom-right card, arrows
inner_merge = parsed['merge_pdf']['inner']
# Top-left path: d="M5.488.363...
# Bottom-right path: d="M44.563 49.69...
inner_merge = inner_merge.replace('d="M5.488.363', 'className="ilove-anim-merge-tl" d="M5.488.363')
inner_merge = inner_merge.replace('d="M44.563 49.69', 'className="ilove-anim-merge-br" d="M44.563 49.69')
inner_merge = inner_merge.replace('<path fill="#FFF"', '<path className="ilove-anim-merge-arrows" fill="#FFF"')
parsed['merge_pdf']['inner'] = inner_merge

# 2. split_pdf: top-left card, bottom-right card, arrows
inner_split = parsed['split_pdf']['inner']
inner_split = inner_split.replace('d="M5.488.363', 'className="ilove-anim-split-tl" d="M5.488.363')
inner_split = inner_split.replace('d="M44.563 49.69', 'className="ilove-anim-split-br" d="M44.563 49.69')
inner_split = inner_split.replace('<path fill="#FFF"', '<path className="ilove-anim-split-arrows" fill="#FFF"')
parsed['split_pdf']['inner'] = inner_split

# 3. compress_pdf: blocks and inward arrows
inner_compress = parsed['compress_pdf']['inner']
inner_compress = inner_compress.replace('<path fill="#8FBC5D"', '<path className="ilove-anim-compress-blocks" fill="#8FBC5D"')
inner_compress = inner_compress.replace('<path fill="#FFF"', '<path className="ilove-anim-compress-arrows" fill="#FFF"')
parsed['compress_pdf']['inner'] = inner_compress

# 4. rotate_pdf: circular arrow
inner_rotate = parsed['rotate_pdf']['inner']
inner_rotate = inner_rotate.replace('<g fill-rule="nonzero">', '<g className="ilove-anim-spin" fillRule="nonzero">')
inner_rotate = inner_rotate.replace('<g fillRule="nonzero">', '<g className="ilove-anim-spin" fillRule="nonzero">')
parsed['rotate_pdf']['inner'] = inner_rotate

# 5. edit_pdf: pencil
inner_edit = parsed['edit_pdf']['inner']
# find pencil group
inner_edit = re.sub(r'(<g>\s*<path fill="#fff" d="M84\.272 58\.77)', r'<g className="ilove-anim-pencil">\n\1', inner_edit)
parsed['edit_pdf']['inner'] = inner_edit

# 6. sign_pdf: signature pen
inner_sign = parsed['sign_pdf']['inner']
inner_sign = re.sub(r'(<g>\s*<path fill="#AB6993" d="M68\.88 47\.86)', r'<g className="ilove-anim-pen-sign">\n\1', inner_sign)
parsed['sign_pdf']['inner'] = inner_sign

# 7. unlock_pdf: padlock shackle
inner_unlock = parsed['unlock_pdf']['inner']
inner_unlock = inner_unlock.replace('<path fill="#fff" fillRule="nonzero"', '<path className="ilove-anim-shackle" fill="#fff" fillRule="nonzero"')
parsed['unlock_pdf']['inner'] = inner_unlock

# 8. protect_pdf: shield
inner_protect = parsed['protect_pdf']['inner']
inner_protect = inner_protect.replace('<g fill="#fff">', '<g className="ilove-anim-shield" fill="#fff">')
parsed['protect_pdf']['inner'] = inner_protect

# 9. watermark: stamp
inner_watermark = parsed['watermark']['inner']
# second path is the watermark stamp
inner_watermark = re.sub(r'(<path fill="#fff"[^>]*d="M32\.313 14\.859)', r'<path className="ilove-anim-stamp" fill="#fff" d="M32.313 14.859', inner_watermark)
parsed['watermark']['inner'] = inner_watermark

# 10. repair_pdf: wrench
inner_repair = parsed['repair_pdf']['inner']
inner_repair = re.sub(r'(<path fill="#fff" d="M12\.527 28\.82)', r'<path className="ilove-anim-wrench" fill="#fff" d="M12.527 28.82', inner_repair)
parsed['repair_pdf']['inner'] = inner_repair

# 11. scan_to_pdf & ocr_pdf: scanner beam
inner_scan = parsed['scan_to_pdf']['inner']
inner_scan = f'<g className="ilove-anim-scanner-beam">\n{inner_scan}\n</g>'
parsed['scan_to_pdf']['inner'] = inner_scan

inner_ocr = parsed['ocr_pdf']['inner']
# animate the scan laser and OCR text
inner_ocr = re.sub(r'(<path fill="#8FBC5D" fillRule="evenodd" d="M12\.5 37\.5v-12)', r'<path className="ilove-anim-laser" fill="#8FBC5D" fillRule="evenodd" d="M12.5 37.5v-12', inner_ocr)
parsed['ocr_pdf']['inner'] = inner_ocr

# 12. compare_pdf: scan divider
inner_compare = parsed['compare_pdf']['inner']
inner_compare = re.sub(r'(<path fill="#2E7237" d="M24 0h2v50h-2z"|d="M24 0h2v50h-2z")', r'className="ilove-anim-compare-scan" \1', inner_compare)
parsed['compare_pdf']['inner'] = inner_compare

# 13. redact_pdf: redaction bar
inner_redact = parsed['redact_pdf']['inner']
inner_redact = re.sub(r'(<path fill="#4A7AAB" fillRule="evenodd" d="M21\.284 18\.875)', r'<g className="ilove-anim-redact">\n\1', inner_redact)
inner_redact = inner_redact + '\n</g>'
parsed['redact_pdf']['inner'] = inner_redact

# 14. crop_pdf: brackets
inner_crop = parsed['crop_pdf']['inner']
inner_crop = f'<g className="ilove-anim-crop">\n{inner_crop}\n</g>'
parsed['crop_pdf']['inner'] = inner_crop

# 15. ai_summarizer: star sparkles
inner_ai = parsed['ai_summarizer']['inner']
inner_ai = re.sub(r'(<circle[^>]*>)', r'<g className="ilove-anim-star-pulse">\1</g>', inner_ai)
parsed['ai_summarizer']['inner'] = inner_ai

# 16. translate_pdf: arrow
inner_trans = parsed['translate_pdf']['inner']
inner_trans = re.sub(r'(<path fill="url\(#[^\"]+\)" d="M22 17[^>]*>)', r'<g className="ilove-anim-translate-arrow">\1</g>', inner_trans)
parsed['translate_pdf']['inner'] = inner_trans

# 17. pdf_to_markdown: code
inner_md = parsed['pdf_to_markdown']['inner']
inner_md = f'<g className="ilove-anim-markdown-glow">\n{inner_md}\n</g>'
parsed['pdf_to_markdown']['inner'] = inner_md

# 18. Converter icons: word_to_pdf, pdf_to_word, etc.
for conv_key in ['word_to_pdf', 'pdf_to_word', 'powerpoint_to_pdf', 'pdf_to_powerpoint', 'excel_to_pdf', 'pdf_to_excel', 'jpg_to_pdf', 'pdf_to_jpg', 'html_to_pdf', 'pdf_to_pdfa']:
    c_inner = parsed[conv_key]['inner']
    # Arrow path in 50x50 converter icons: <path fill="#..." d="M14.477 7.52... or M43.94 37.137...
    c_inner = re.sub(r'(<path fill="#[A-Fa-f0-9]+" d="M(14\.477|43\.94)[^>]*>)', r'<g className="ilove-anim-convert-arrow">\1</g>', c_inner)
    parsed[conv_key]['inner'] = c_inner

# 19. organize_pdf
inner_org = parsed['organize_pdf']['inner']
inner_org = f'<g className="ilove-anim-card-shuffle">\n{inner_org}\n</g>'
parsed['organize_pdf']['inner'] = inner_org

# 20. page_numbers
inner_pn = parsed['page_numbers']['inner']
inner_pn = f'<g className="ilove-anim-number-pulse">\n{inner_pn}\n</g>'
parsed['page_numbers']['inner'] = inner_pn

# 21. pdf_forms
inner_pf = parsed['pdf_forms']['inner']
inner_pf = f'<g className="ilove-anim-form-check">\n{inner_pf}\n</g>'
parsed['pdf_forms']['inner'] = inner_pf

print("All animations injected into SVGs!")

with open('/tmp/processed_svgs.json', 'w') as f:
    json.dump(parsed, f, indent=2)
