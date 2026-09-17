export type NamingPattern = 'simple' | 'original' | 'date' | 'paperx' | 'paperx_date' | 'original_processed' | 'timestamp' | 'date_time';

export interface FormatFileNameOptions {
  baseName?: string;
  toolName?: string;
  pattern?: NamingPattern | string;
  existingCount?: number;
  extension?: string;
}

/**
 * Clean, simple, bug-free file naming utility.
 */
export function generateFormattedFileName(options?: FormatFileNameOptions): string {
  const {
    baseName = 'Document',
    toolName = 'Scan',
    pattern: inputPattern,
    existingCount = 1,
    extension: customExt
  } = options || {};

  const activePattern: string =
    inputPattern ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('pref_namingPattern') : null) ||
    'simple';

  // Clean rawBase and extract extension cleanly without duplication
  let rawBase = typeof baseName === 'string' ? baseName : (baseName ? String(baseName) : 'Document');
  let ext = typeof customExt === 'string' ? customExt : '.pdf';

  if (rawBase && typeof rawBase.includes === 'function' && rawBase.includes('.')) {
    const lastDot = typeof rawBase.lastIndexOf === 'function' ? rawBase.lastIndexOf('.') : -1;
    if (lastDot !== -1) {
      if (!customExt) {
        ext = rawBase.substring(lastDot);
      }
      rawBase = rawBase.substring(0, lastDot);
    }
  }

  // Ensure extension starts with a single dot
  if (ext && !ext.startsWith('.')) {
    ext = '.' + ext;
  }

  // Clean rawBase characters
  const cleanBase = rawBase.replace(/[\/\?%*:|"<>]/g, ' ').replace(/\s+/g, ' ').trim() || 'Document';

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateShort = `${day}-${month}-${year}`;

  const countSuffix = existingCount > 1 ? `_${existingCount}` : '';

  switch (activePattern) {
    case 'simple':
    default:
      // e.g., "Scan 1.pdf"
      return `${toolName || 'Scan'} ${existingCount}${ext}`;

    case 'original':
      // e.g., "Invoice.pdf" or "Invoice_2.pdf"
      return `${cleanBase}${countSuffix}${ext}`;

    case 'date':
      // e.g., "Scan_08-09-2026.pdf"
      return `Scan_${dateShort}${countSuffix}${ext}`;

    case 'paperx':
    case 'paperx_date':
      // e.g., "PaperX_Scan_1.pdf"
      return `PaperX_${toolName || 'Scan'}_${existingCount}${ext}`;

    case 'timestamp':
      return `${toolName || 'Scan'}_${Date.now()}${ext}`;

    case 'date_time':
      return `Scan_${year}${month}${day}_${dateShort}${ext}`;
  }
}

export function getSampleFormattedFileName(pattern: NamingPattern | string): string {
  return generateFormattedFileName({
    baseName: 'Invoice.pdf',
    toolName: 'Scan',
    pattern,
    existingCount: 1,
    extension: '.pdf'
  });
}
