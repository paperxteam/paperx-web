import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Download, 
  Copy, 
  Upload, 
  Sparkles, 
  Palette, 
  Check, 
  Link, 
  FileText, 
  Wifi, 
  Mail, 
  Phone, 
  User, 
  CreditCard, 
  ImageIcon,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export interface QrOptions {
  type: 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'vcard' | 'upi';
  content: string;
  
  // Custom Content Fields for Wi-Fi / vCard / UPI
  wifiSsid?: string;
  wifiPassword?: string;
  wifiEncryption?: 'WPA' | 'WEP' | 'nopass';
  
  emailAddress?: string;
  emailSubject?: string;
  emailBody?: string;
  
  phoneNum?: string;
  
  vName?: string;
  vOrg?: string;
  vPhone?: string;
  vEmail?: string;
  vWebsite?: string;
  
  upiVpa?: string;
  upiName?: string;
  upiAmount?: string;
  
  // Design & Colors
  fgColor: string;
  bgColor: string;
  useGradient: boolean;
  gradientColor2: string;
  
  // Logo & Frame Overlay
  logoUrl: string;
  logoSize: number; // 0.15 to 0.3
  frameLabel: string;
  frameColor: string;
  
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

const PRESET_LOGOS = [
  { name: 'PaperX', url: '/PaperXtransparent_cropped.png' },
  { name: 'Google Drive', url: '/Google_Drive_icon_(2026).svg.webp' },
  { name: 'OneDrive', url: '/Microsoft_OneDrive_Icon_(2025_-_present).svg.webp' },
  { name: 'Dropbox', url: '/dropbox-glyph-blue.png' }
];

export const QrCodeGeneratorWorkspace: React.FC = () => {
  const [options, setOptions] = useState<QrOptions>({
    type: 'url',
    content: 'https://paperx.io',
    
    wifiSsid: 'MyHomeWiFi',
    wifiPassword: 'Password123',
    wifiEncryption: 'WPA',
    
    emailAddress: 'contact@paperx.io',
    emailSubject: 'Inquiry',
    emailBody: 'Hello PaperX team,',
    
    phoneNum: '+1 (555) 019-2831',
    
    vName: 'Alex Sterling',
    vOrg: 'PaperX Inc.',
    vPhone: '+1 (555) 019-2831',
    vEmail: 'alex@paperx.io',
    vWebsite: 'https://paperx.io',
    
    upiVpa: 'paperx@upi',
    upiName: 'PaperX Services',
    upiAmount: '100',
    
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    useGradient: false,
    gradientColor2: '#4f46e5',
    
    logoUrl: '',
    logoSize: 0.22,
    frameLabel: 'SCAN ME',
    frameColor: '#0f172a',
    
    errorCorrectionLevel: 'H'
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute final payload string depending on selected content type
  const getPayloadString = (): string => {
    switch (options.type) {
      case 'url':
      case 'text':
        return options.content || 'https://paperx.io';
      case 'wifi':
        return `WIFI:S:${options.wifiSsid || ''};T:${options.wifiEncryption || 'WPA'};P:${options.wifiPassword || ''};;`;
      case 'email':
        return `mailto:${options.emailAddress || ''}?subject=${encodeURIComponent(options.emailSubject || '')}&body=${encodeURIComponent(options.emailBody || '')}`;
      case 'phone':
        return `tel:${options.phoneNum || ''}`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${options.vName || ''}\nORG:${options.vOrg || ''}\nTEL:${options.vPhone || ''}\nEMAIL:${options.vEmail || ''}\nURL:${options.vWebsite || ''}\nEND:VCARD`;
      case 'upi':
        return `upi://pay?pa=${options.upiVpa || ''}&pn=${encodeURIComponent(options.upiName || '')}&am=${options.upiAmount || ''}&cu=INR`;
      default:
        return options.content || 'https://paperx.io';
    }
  };

  // Generate QR Canvas with Logo Overlay
  useEffect(() => {
    const generateQr = async () => {
      const payload = getPayloadString();
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        await QRCode.toCanvas(canvas, payload, {
          width: 400,
          margin: 2,
          color: {
            dark: options.fgColor,
            light: options.bgColor
          },
          errorCorrectionLevel: options.logoUrl ? 'H' : options.errorCorrectionLevel
        });

        // Overlay Logo if selected
        if (options.logoUrl) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvasWidth = canvas.width;
              const logoSize = canvasWidth * options.logoSize;
              const x = (canvasWidth - logoSize) / 2;
              const y = (canvasWidth - logoSize) / 2;

              // Background badge behind logo
              ctx.fillStyle = options.bgColor;
              ctx.beginPath();
              ctx.arc(canvasWidth / 2, canvasWidth / 2, (logoSize / 2) + 6, 0, Math.PI * 2);
              ctx.fill();

              ctx.drawImage(img, x, y, logoSize, logoSize);
              setQrDataUrl(canvas.toDataURL('image/png'));
            };
            img.src = options.logoUrl;
            return;
          }
        }

        setQrDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('QR Generation error:', err);
      }
    };

    generateQr();
  }, [options]);

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `PaperX_QR_${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleDownloadPdf = () => {
    if (!qrDataUrl) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(18);
    pdf.text('Scan QR Code', 105, 40, { align: 'center' });
    pdf.addImage(qrDataUrl, 'PNG', 55, 60, 100, 100);
    if (options.frameLabel) {
      pdf.setFontSize(14);
      pdf.text(options.frameLabel, 105, 175, { align: 'center' });
    }
    pdf.save(`PaperX_QR_${Date.now()}.pdf`);
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setOptions(prev => ({ ...prev, logoUrl: evt.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />

      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
              Vector & High-Res PNG
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              Custom Logo & Colors
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-stone-900 dark:text-white tracking-tight">
            QR Code Generator & Customizer
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium mt-1">
            Generate 100% scannable QR codes for websites, text, Wi-Fi, contacts, UPI, and images with embedded logos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyImage}
            className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDownloadPng}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Download size={16} />
            <span>Download HD PNG</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* Content Type Selector */}
          <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">1. Select QR Data Type</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'url', label: 'URL / Link', icon: Link },
                { id: 'text', label: 'Plain Text', icon: FileText },
                { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
                { id: 'vcard', label: 'vCard Contact', icon: User },
                { id: 'email', label: 'Email Address', icon: Mail },
                { id: 'phone', label: 'Phone Call', icon: Phone },
                { id: 'upi', label: 'UPI / Payment', icon: CreditCard }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setOptions(prev => ({ ...prev, type: t.id as any }))}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      options.type === t.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] text-center leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Form Input according to selected type */}
          <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">2. Enter QR Information</h3>
            
            {options.type === 'url' && (
              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Target Website URL</label>
                <input
                  type="url"
                  value={options.content}
                  onChange={e => setOptions(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100"
                />
              </div>
            )}

            {options.type === 'text' && (
              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Text Message / Notes</label>
                <textarea
                  value={options.content}
                  onChange={e => setOptions(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  placeholder="Enter text to encode..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100 resize-none"
                />
              </div>
            )}

            {options.type === 'wifi' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={options.wifiSsid}
                  onChange={e => setOptions(prev => ({ ...prev, wifiSsid: e.target.value }))}
                  placeholder="Wi-Fi Network SSID"
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  value={options.wifiPassword}
                  onChange={e => setOptions(prev => ({ ...prev, wifiPassword: e.target.value }))}
                  placeholder="Wi-Fi Password"
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
              </div>
            )}

            {options.type === 'upi' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={options.upiVpa}
                  onChange={e => setOptions(prev => ({ ...prev, upiVpa: e.target.value }))}
                  placeholder="UPI ID / VPA (e.g. merchant@upi)"
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={options.upiName}
                    onChange={e => setOptions(prev => ({ ...prev, upiName: e.target.value }))}
                    placeholder="Payee Name"
                    className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="number"
                    value={options.upiAmount}
                    onChange={e => setOptions(prev => ({ ...prev, upiAmount: e.target.value }))}
                    placeholder="Amount (INR)"
                    className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {options.type === 'vcard' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={options.vName}
                  onChange={e => setOptions(prev => ({ ...prev, vName: e.target.value }))}
                  placeholder="Full Name"
                  className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  value={options.vOrg}
                  onChange={e => setOptions(prev => ({ ...prev, vOrg: e.target.value }))}
                  placeholder="Organization"
                  className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  value={options.vPhone}
                  onChange={e => setOptions(prev => ({ ...prev, vPhone: e.target.value }))}
                  placeholder="Phone Number"
                  className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  value={options.vEmail}
                  onChange={e => setOptions(prev => ({ ...prev, vEmail: e.target.value }))}
                  placeholder="Email"
                  className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
                />
              </div>
            )}
          </div>

          {/* Logo & Colors Customization */}
          <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">3. Logo & Colors Customization</h3>
            
            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Foreground Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.fgColor}
                    onChange={e => setOptions(prev => ({ ...prev, fgColor: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={options.fgColor}
                    onChange={e => setOptions(prev => ({ ...prev, fgColor: e.target.value }))}
                    className="flex-1 px-2.5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.bgColor}
                    onChange={e => setOptions(prev => ({ ...prev, bgColor: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={options.bgColor}
                    onChange={e => setOptions(prev => ({ ...prev, bgColor: e.target.value }))}
                    className="flex-1 px-2.5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Logo Overlay */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-500">Center Logo Overlay</label>
                {options.logoUrl && (
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, logoUrl: '' }))}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <label className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 cursor-pointer">
                  <Upload size={14} className="text-indigo-600" />
                  <span>Upload Logo Image</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div className="flex gap-2">
                {PRESET_LOGOS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setOptions(prev => ({ ...prev, logoUrl: p.url }))}
                    className="p-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 rounded-lg hover:border-indigo-500 text-[10px] font-bold flex items-center gap-1"
                  >
                    <img src={p.url} alt={p.name} className="w-4 h-4 object-contain" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Label */}
            <div>
              <label className="text-[11px] font-bold text-stone-500 block mb-1">Banner Label Text</label>
              <input
                type="text"
                value={options.frameLabel}
                onChange={e => setOptions(prev => ({ ...prev, frameLabel: e.target.value }))}
                placeholder="SCAN ME"
                className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Code Preview */}
        <div className="lg:col-span-6">
          <div className="sticky top-6 flex flex-col items-center">
            <span className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Eye size={14} /> Live HD QR Render
            </span>

            <div className="p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col items-center justify-center space-y-4">
              {/* Frame Card */}
              <div
                style={{ backgroundColor: options.bgColor }}
                className="p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 flex flex-col items-center transition-all"
              >
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 object-contain rounded-lg" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-stone-300">
                    <QrCode size={64} />
                  </div>
                )}

                {options.frameLabel && (
                  <div
                    style={{ backgroundColor: options.fgColor, color: options.bgColor }}
                    className="mt-4 px-6 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-md"
                  >
                    {options.frameLabel}
                  </div>
                )}
              </div>

              <p className="text-[11px] font-bold text-stone-400 text-center max-w-xs break-all">
                Payload: {getPayloadString()}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
