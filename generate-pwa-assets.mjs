import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Base App Icon SVG (Sleek dark badge with glowing 'X' & document layer)
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="224" fill="#030712"/>
  <rect x="32" y="32" width="960" height="960" rx="192" stroke="url(#borderGlow)" stroke-width="8" stroke-opacity="0.5"/>
  
  <!-- Subtle inner gradient background -->
  <circle cx="512" cy="512" r="400" fill="url(#coreGlow)" opacity="0.15"/>

  <!-- Document Sheet Layer -->
  <g filter="url(#dropShadow)">
    <path d="M300 240C300 206.863 326.863 180 360 180H560L724 344V784C724 817.137 697.137 844 664 844H360C326.863 844 300 817.137 300 784V240Z" fill="#111827" stroke="#374151" stroke-width="12"/>
    <path d="M560 180V324C560 335.046 568.954 344 580 344H724" fill="#1F2937" stroke="#374151" stroke-width="12"/>
  </g>

  <!-- Glowing X / Brand Mark -->
  <g>
    <path d="M400 420L624 644" stroke="url(#xGrad1)" stroke-width="64" stroke-linecap="round"/>
    <path d="M624 420L400 644" stroke="url(#xGrad2)" stroke-width="64" stroke-linecap="round"/>
  </g>

  <!-- Accent Dot -->
  <circle cx="512" cy="740" r="16" fill="#38BDF8"/>

  <defs>
    <linearGradient id="borderGlow" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="0.5" stop-color="#818CF8"/>
      <stop offset="1" stop-color="#C084FC"/>
    </linearGradient>
    <radialGradient id="coreGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 512) scale(400)">
      <stop stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#030712" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="xGrad1" x1="400" y1="420" x2="624" y2="644" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="xGrad2" x1="624" y1="420" x2="400" y2="644" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F472B6"/>
      <stop offset="1" stop-color="#38BDF8"/>
    </linearGradient>
    <filter id="dropShadow" x="260" y="160" width="504" height="744" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
</svg>
`;

// Maskable Icon (Full-bleed square safe zone for Android adaptive icons)
const maskableIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#030712"/>
  <circle cx="512" cy="512" r="460" fill="url(#maskGlow)" opacity="0.2"/>

  <!-- Centered Scaled Doc & X -->
  <g transform="translate(102, 102) scale(0.8)">
    <g filter="url(#dropShadow)">
      <path d="M300 240C300 206.863 326.863 180 360 180H560L724 344V784C724 817.137 697.137 844 664 844H360C326.863 844 300 817.137 300 784V240Z" fill="#111827" stroke="#374151" stroke-width="14"/>
      <path d="M560 180V324C560 335.046 568.954 344 580 344H724" fill="#1F2937" stroke="#374151" stroke-width="14"/>
    </g>
    <g>
      <path d="M400 420L624 644" stroke="url(#xGrad1)" stroke-width="68" stroke-linecap="round"/>
      <path d="M624 420L400 644" stroke="url(#xGrad2)" stroke-width="68" stroke-linecap="round"/>
    </g>
  </g>

  <defs>
    <radialGradient id="maskGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 512) scale(460)">
      <stop stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#030712" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="xGrad1" x1="400" y1="420" x2="624" y2="644" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="xGrad2" x1="624" y1="420" x2="400" y2="644" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F472B6"/>
      <stop offset="1" stop-color="#38BDF8"/>
    </linearGradient>
    <filter id="dropShadow" x="260" y="160" width="504" height="744" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
</svg>
`;

async function build() {
  const iconBuffer = Buffer.from(iconSvg);
  const maskableBuffer = Buffer.from(maskableIconSvg);

  const iconSizes = [48, 72, 96, 128, 144, 192, 256, 384, 512];
  
  for (const size of iconSizes) {
    await sharp(iconBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}.png`));
  }

  // Generate standard 192, 512 directly into public/icons and public/
  await sharp(iconBuffer).resize(192, 192).png().toFile(path.resolve('public/icon-192.png'));
  await sharp(iconBuffer).resize(512, 512).png().toFile(path.resolve('public/icon-512.png'));
  await sharp(iconBuffer).resize(180, 180).png().toFile(path.resolve('public/apple-touch-icon.png'));
  await sharp(iconBuffer).resize(32, 32).png().toFile(path.resolve('public/favicon.png'));

  // Maskable icons
  await sharp(maskableBuffer).resize(192, 192).png().toFile(path.join(outDir, 'maskable-icon-192x192.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(outDir, 'maskable-icon-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.resolve('public/maskable-icon.png'));

  // Shortcut Icons (Scan, PDF, Documents)
  const scanSvg = `
  <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="48" fill="#0F172A"/>
    <path d="M48 64V48H64M144 64V48H128M48 128V144H64M144 128V144H128" stroke="#38BDF8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="64" y="64" width="64" height="64" rx="8" stroke="#F472B6" stroke-width="10"/>
  </svg>
  `;
  await sharp(Buffer.from(scanSvg)).resize(192, 192).png().toFile(path.join(outDir, 'shortcut-scan.png'));

  const pdfSvg = `
  <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="48" fill="#0F172A"/>
    <path d="M60 40H110L140 70V152H60V40Z" fill="#1E293B" stroke="#EF4444" stroke-width="10" stroke-linejoin="round"/>
    <text x="70" y="116" font-family="sans-serif" font-weight="900" font-size="28" fill="#EF4444">PDF</text>
  </svg>
  `;
  await sharp(Buffer.from(pdfSvg)).resize(192, 192).png().toFile(path.join(outDir, 'shortcut-pdf.png'));

  const docsSvg = `
  <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="48" fill="#0F172A"/>
    <path d="M48 60C48 53.3726 53.3726 48 60 48H88L104 64H132C138.627 64 144 69.3726 144 76V132C144 138.627 138.627 144 132 144H60C53.3726 144 48 138.627 48 132V60Z" fill="#1E293B" stroke="#10B981" stroke-width="10"/>
  </svg>
  `;
  await sharp(Buffer.from(docsSvg)).resize(192, 192).png().toFile(path.join(outDir, 'shortcut-docs.png'));

  // 2. High Resolution Screenshots for PWABuilder (Wide and Narrow)
  const wideScreenshotSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#090D16"/>
    <!-- App UI Mock -->
    <!-- Sidebar -->
    <rect x="0" y="0" width="260" height="720" fill="#0F172A"/>
    <rect x="24" y="32" width="140" height="28" rx="8" fill="#38BDF8"/>
    <rect x="24" y="96" width="212" height="40" rx="12" fill="#1E293B"/>
    <rect x="24" y="148" width="212" height="40" rx="12" fill="#1E293B" opacity="0.6"/>
    <rect x="24" y="200" width="212" height="40" rx="12" fill="#1E293B" opacity="0.6"/>
    <rect x="24" y="252" width="212" height="40" rx="12" fill="#1E293B" opacity="0.6"/>
    
    <!-- Topbar -->
    <rect x="260" y="0" width="1020" height="64" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
    <rect x="292" y="16" width="340" height="32" rx="16" fill="#1E293B"/>
    <rect x="1160" y="14" width="88" height="36" rx="18" fill="#38BDF8"/>

    <!-- Hero Cards Grid -->
    <text x="292" y="120" font-family="sans-serif" font-weight="800" font-size="28" fill="#F8FAFC">Paper X Document Studio</text>
    <text x="292" y="148" font-family="sans-serif" font-weight="400" font-size="16" fill="#94A3B8">Next-generation document conversion, neural OCR and AI tools</text>

    <!-- 3 Tool Bento Cards -->
    <rect x="292" y="180" width="290" height="220" rx="20" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <circle cx="340" cy="230" r="24" fill="#EF4444" opacity="0.2"/>
    <text x="325" y="238" font-family="sans-serif" font-weight="700" font-size="16" fill="#EF4444">PDF</text>
    <text x="320" y="290" font-family="sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">PDF Merge and Split</text>
    <text x="320" y="320" font-family="sans-serif" font-weight="400" font-size="14" fill="#94A3B8">Combine and organize pages instantly</text>

    <rect x="612" y="180" width="290" height="220" rx="20" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <circle cx="660" cy="230" r="24" fill="#38BDF8" opacity="0.2"/>
    <text x="640" y="238" font-family="sans-serif" font-weight="700" font-size="16" fill="#38BDF8">SCAN</text>
    <text x="640" y="290" font-family="sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">HD Camera Scanner</text>
    <text x="640" y="320" font-family="sans-serif" font-weight="400" font-size="14" fill="#94A3B8">Perspective crop with neural filters</text>

    <rect x="932" y="180" width="290" height="220" rx="20" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <circle cx="980" cy="230" r="24" fill="#10B981" opacity="0.2"/>
    <text x="965" y="238" font-family="sans-serif" font-weight="700" font-size="16" fill="#10B981">OCR</text>
    <text x="960" y="290" font-family="sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">Optical OCR AI</text>
    <text x="960" y="320" font-family="sans-serif" font-weight="400" font-size="14" fill="#94A3B8">Extract text with precision</text>

    <!-- Bottom Action Row -->
    <rect x="292" y="430" width="930" height="230" rx="20" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <text x="320" y="475" font-family="sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">Quick File Processing Hub</text>
    <rect x="320" y="500" width="874" height="130" rx="16" fill="#0B1120" stroke="#334155" stroke-dasharray="8 8" stroke-width="2"/>
    <text x="660" y="570" font-family="sans-serif" font-weight="600" font-size="16" fill="#64748B" text-anchor="middle">Drag and drop PDFs, images, or documents here to process</text>
  </svg>
  `;
  await sharp(Buffer.from(wideScreenshotSvg)).resize(1280, 720).png().toFile(path.resolve('public/screenshot-wide-1.png'));
  await sharp(Buffer.from(wideScreenshotSvg)).resize(1280, 720).png().toFile(path.resolve('public/screenshot-wide-2.png'));

  const narrowScreenshotSvg = `
  <svg width="750" height="1334" viewBox="0 0 750 1334" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="750" height="1334" fill="#090D16"/>
    
    <!-- Mobile Status Bar -->
    <text x="60" y="50" font-family="sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">9:41</text>
    <circle cx="680" cy="45" r="8" fill="#10B981"/>

    <!-- App Header -->
    <rect x="40" y="80" width="160" height="36" rx="10" fill="#38BDF8"/>
    <circle cx="670" cy="98" r="22" fill="#1E293B"/>

    <!-- Search Box -->
    <rect x="40" y="140" width="670" height="60" rx="20" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <text x="80" y="177" font-family="sans-serif" font-weight="500" font-size="20" fill="#64748B">Search 30+ document tools...</text>

    <!-- Quick Scan Floating Action Banner -->
    <rect x="40" y="230" width="670" height="160" rx="28" fill="url(#mobileBannerGrad)"/>
    <text x="80" y="295" font-family="sans-serif" font-weight="800" font-size="30" fill="#FFFFFF">Camera Scanner HD</text>
    <text x="80" y="340" font-family="sans-serif" font-weight="500" font-size="18" fill="#E0F2FE">Auto-edge detection and instant PDF export</text>

    <!-- Grid of Mobile Tools -->
    <text x="40" y="440" font-family="sans-serif" font-weight="700" font-size="24" fill="#F8FAFC">Popular Tools</text>

    <rect x="40" y="470" width="315" height="180" rx="24" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <text x="70" y="540" font-family="sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">Merge PDF</text>
    <text x="70" y="580" font-family="sans-serif" font-weight="400" font-size="16" fill="#94A3B8">Combine multiple files</text>

    <rect x="395" y="470" width="315" height="180" rx="24" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <text x="425" y="540" font-family="sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">Compress PDF</text>
    <text x="425" y="580" font-family="sans-serif" font-weight="400" font-size="16" fill="#94A3B8">Reduce size up to 90%</text>

    <rect x="40" y="680" width="315" height="180" rx="24" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <text x="70" y="750" font-family="sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">Convert to Word</text>
    <text x="70" y="790" font-family="sans-serif" font-weight="400" font-size="16" fill="#94A3B8">Editable DOCX</text>

    <rect x="395" y="680" width="315" height="180" rx="24" fill="#131D31" stroke="#1E293B" stroke-width="2"/>
    <text x="425" y="750" font-family="sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">E-Sign &amp; Stamp</text>
    <text x="425" y="790" font-family="sans-serif" font-weight="400" font-size="16" fill="#94A3B8">Sign securely on phone</text>

    <!-- Recent Files List -->
    <text x="40" y="910" font-family="sans-serif" font-weight="700" font-size="24" fill="#F8FAFC">Recent Documents</text>
    <rect x="40" y="940" width="670" height="90" rx="20" fill="#131D31"/>
    <text x="80" y="995" font-family="sans-serif" font-weight="600" font-size="20" fill="#FFFFFF">Invoice_2026_Q1.pdf</text>
    
    <rect x="40" y="1050" width="670" height="90" rx="20" fill="#131D31"/>
    <text x="80" y="1105" font-family="sans-serif" font-weight="600" font-size="20" fill="#FFFFFF">Signed_Contract.pdf</text>

    <!-- Bottom Nav Bar -->
    <rect x="0" y="1220" width="750" height="114" fill="#0B1120" stroke="#1E293B" stroke-width="1"/>
    <circle cx="375" cy="1260" r="32" fill="#38BDF8"/>
    <path d="M375 1248V1272M363 1260H387" stroke="#000000" stroke-width="5" stroke-linecap="round"/>

    <defs>
      <linearGradient id="mobileBannerGrad" x1="40" y1="230" x2="710" y2="390" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0284C7"/>
        <stop offset="1" stop-color="#4F46E5"/>
      </linearGradient>
    </defs>
  </svg>
  `;
  await sharp(Buffer.from(narrowScreenshotSvg)).resize(750, 1334).png().toFile(path.resolve('public/screenshot-mobile-1.png'));
  await sharp(Buffer.from(narrowScreenshotSvg)).resize(750, 1334).png().toFile(path.resolve('public/screenshot-mobile-2.png'));

  console.log("All PWA assets generated successfully!");
}

build().catch(console.error);
