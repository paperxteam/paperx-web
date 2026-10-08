import React, { useState, useRef } from 'react';
import { 
  Stamp, 
  Download, 
  Printer, 
  Sparkles, 
  Palette, 
  Check, 
  Upload, 
  X, 
  Eye, 
  RefreshCw,
  Award,
  Shield,
  Star,
  FileSignature,
  Sliders,
  Type
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface CertificateData {
  title: string;
  subtitle: string;
  recipientName: string;
  awardReason: string;
  issuerName: string;
  issuerTitle: string;
  issueDate: string;
  certificateId: string;
  
  // Custom Logos & Signatures
  organizationLogo: string;
  signatureImage: string;
  sealStyle: 'gold-star' | 'shield-crest' | 'ribbon-badge' | 'verified-stamp' | 'none';
  
  // Styling
  templateId: string;
  primaryColor: string;
  borderStyle: 'ornate' | 'double' | 'geometric' | 'minimal' | 'modern';
  fontStyle: 'serif' | 'sans' | 'script';
  backgroundStyle: 'white' | 'parchment' | 'dark' | 'marble';
}

const COLOR_PALETTES = [
  { id: 'gold', name: 'Imperial Gold', hex: '#d97706', bg: 'bg-amber-600' },
  { id: 'navy', name: 'Royal Navy', hex: '#1e3a8a', bg: 'bg-blue-900' },
  { id: 'emerald', name: 'Emerald Honor', hex: '#047857', bg: 'bg-emerald-700' },
  { id: 'crimson', name: 'Crimson Ruby', hex: '#be123c', bg: 'bg-rose-700' },
  { id: 'purple', name: 'Deep Amethyst', hex: '#6b21a8', bg: 'bg-purple-800' },
  { id: 'slate', name: 'Modern Slate', hex: '#334155', bg: 'bg-slate-700' },
  { id: 'black', name: 'Onyx Prestige', hex: '#0f172a', bg: 'bg-slate-900' }
];

const CERTIFICATE_CATEGORIES = [
  'All',
  'Academic',
  'Course Completion',
  'Professional',
  'Workshop & Training',
  'Appreciation',
  'Employee Honor',
  'Sports & Fitness',
  'Creative & Arts',
  'Modern Tech'
];

// Generate 100 template preset variations dynamically
const ALL_100_TEMPLATES = Array.from({ length: 100 }, (_, i) => {
  const cat = CERTIFICATE_CATEGORIES[(i % (CERTIFICATE_CATEGORIES.length - 1)) + 1];
  const color = COLOR_PALETTES[i % COLOR_PALETTES.length];
  const borders: Array<'ornate' | 'double' | 'geometric' | 'minimal' | 'modern'> = ['ornate', 'double', 'geometric', 'minimal', 'modern'];
  const border = borders[i % borders.length];
  return {
    id: `cert-tpl-${i + 1}`,
    name: `${cat} Award Preset #${i + 1}`,
    category: cat,
    colorHex: color.hex,
    borderStyle: border,
    desc: `Professional ${cat.toLowerCase()} certificate with ${color.name} accents and ${border} frame.`
  };
});

const DEFAULT_CERTIFICATE: CertificateData = {
  title: 'CERTIFICATE OF EXCELLENCE',
  subtitle: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
  recipientName: 'Alexander V. Mercer',
  awardReason: 'For outstanding performance, dedication, and successful completion of the Advanced Full-Stack Software Engineering & System Architecture Program.',
  issuerName: 'Dr. Sarah Jenkins',
  issuerTitle: 'Chief Academic Officer, PaperX Academy',
  issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  certificateId: 'PX-CERT-2026-8849',
  
  organizationLogo: '',
  signatureImage: '',
  sealStyle: 'gold-star',
  
  templateId: 'cert-tpl-1',
  primaryColor: '#d97706',
  borderStyle: 'ornate',
  fontStyle: 'serif',
  backgroundStyle: 'parchment'
};

export const CertificateMakerWorkspace: React.FC = () => {
  const [data, setData] = useState<CertificateData>(DEFAULT_CERTIFICATE);
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setData(prev => ({ ...prev, organizationLogo: evt.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setData(prev => ({ ...prev, signatureImage: evt.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.recipientName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error('Certificate Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTemplates = selectedCategory === 'All' 
    ? ALL_100_TEMPLATES 
    : ALL_100_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
              100+ Certificate Designs
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
              Landscape A4 PDF
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-stone-900 dark:text-white tracking-tight">
            Certificate Maker & Customizer
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium mt-1">
            Design, customize, and issue high-resolution certificates, diplomas, and awards.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles size={16} className="text-amber-500" />
            <span>Pick Preset ({ALL_100_TEMPLATES.length})</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            <span>Download Certificate PDF</span>
          </button>
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-stone-200/80 dark:border-stone-800">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              1. Details & Text
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                activeTab === 'design'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              2. Frame & Badges
            </button>
          </div>

          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Certificate Wording</h3>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Header Title</label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Sub-heading</label>
                  <input
                    type="text"
                    value={data.subtitle}
                    onChange={e => setData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={data.recipientName}
                    onChange={e => setData(prev => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full px-3 py-2 bg-amber-50/50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 rounded-xl text-sm font-black text-amber-900 dark:text-amber-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Award Citation / Description</label>
                  <textarea
                    value={data.awardReason}
                    onChange={e => setData(prev => ({ ...prev, awardReason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-100 resize-none"
                  />
                </div>
              </div>

              {/* Issuer & Date */}
              <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Issuer & Verification</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Signatory Name</label>
                    <input
                      type="text"
                      value={data.issuerName}
                      onChange={e => setData(prev => ({ ...prev, issuerName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Signatory Title</label>
                    <input
                      type="text"
                      value={data.issuerTitle}
                      onChange={e => setData(prev => ({ ...prev, issuerTitle: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Issue Date</label>
                    <input
                      type="text"
                      value={data.issueDate}
                      onChange={e => setData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Certificate Serial ID</label>
                    <input
                      type="text"
                      value={data.certificateId}
                      onChange={e => setData(prev => ({ ...prev, certificateId: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2 cursor-pointer hover:bg-stone-100">
                    <Upload size={14} className="text-amber-500" />
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>

                  <label className="p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2 cursor-pointer hover:bg-stone-100">
                    <FileSignature size={14} className="text-indigo-500" />
                    <span>Upload Signature</span>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4">
              {/* Color Theme */}
              <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Accent Color</h3>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PALETTES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setData(prev => ({ ...prev, primaryColor: p.hex }))}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        data.primaryColor === p.hex
                          ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                          : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${p.bg}`} />
                      <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 truncate w-full text-center">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seal Badge Style */}
              <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Official Seal / Emblem</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gold-star', label: 'Gold Star Crest', icon: Star },
                    { id: 'shield-crest', label: 'Shield Emblem', icon: Shield },
                    { id: 'ribbon-badge', label: 'Ribbon Badge', icon: Award },
                    { id: 'verified-stamp', label: 'Verified Stamp', icon: Stamp },
                    { id: 'none', label: 'No Seal', icon: X }
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setData(prev => ({ ...prev, sealStyle: s.id as any }))}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                          data.sealStyle === s.id
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                            : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[10px] text-center leading-tight">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frame Border Style */}
              <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Border Frame Style</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ornate', label: 'Ornate Filigree' },
                    { id: 'double', label: 'Classic Double Line' },
                    { id: 'geometric', label: 'Geometric Pattern' },
                    { id: 'minimal', label: 'Minimal Clean' },
                    { id: 'modern', label: 'Modern Accent Bar' }
                  ].map(b => (
                    <button
                      key={b.id}
                      onClick={() => setData(prev => ({ ...prev, borderStyle: b.id as any }))}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        data.borderStyle === b.id
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Landscape Certificate Render Frame */}
        <div className="lg:col-span-7">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye size={14} /> Live HD Certificate Render
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                Landscape A4 Frame
              </span>
            </div>

            <div className="overflow-x-auto p-3 bg-stone-800 dark:bg-stone-950 rounded-3xl border border-stone-700 dark:border-stone-800 shadow-2xl">
              <div
                ref={previewRef}
                style={{
                  fontFamily: data.fontStyle === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'
                }}
                className="w-[780px] h-[520px] bg-[#fffdfa] text-stone-900 p-8 shadow-2xl rounded-sm mx-auto flex flex-col justify-between select-none relative overflow-hidden"
              >
                {/* Border Frames */}
                {data.borderStyle === 'ornate' && (
                  <div style={{ borderColor: data.primaryColor }} className="absolute inset-4 border-[6px] border-double rounded-xs pointer-events-none p-2">
                    <div style={{ borderColor: `${data.primaryColor}80` }} className="w-full h-full border border-dashed" />
                  </div>
                )}
                {data.borderStyle === 'double' && (
                  <div style={{ borderColor: data.primaryColor }} className="absolute inset-5 border-4 rounded-xs pointer-events-none p-1.5">
                    <div style={{ borderColor: data.primaryColor }} className="w-full h-full border" />
                  </div>
                )}
                {data.borderStyle === 'geometric' && (
                  <div style={{ borderColor: data.primaryColor }} className="absolute inset-4 border-[8px] rounded-xs pointer-events-none" />
                )}

                {/* Certificate Main Content */}
                <div className="relative z-10 flex flex-col items-center text-center h-full justify-between py-4 px-6">
                  
                  {/* Top Logo / Crest */}
                  <div>
                    {data.organizationLogo ? (
                      <img src={data.organizationLogo} alt="Logo" className="h-10 object-contain mx-auto mb-2" />
                    ) : (
                      <div style={{ color: data.primaryColor }} className="flex justify-center mb-1">
                        <Award size={36} />
                      </div>
                    )}
                    <h1
                      style={{ color: data.primaryColor }}
                      className="text-2xl font-black tracking-widest uppercase"
                    >
                      {data.title}
                    </h1>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-stone-400 mt-1">
                      {data.subtitle}
                    </p>
                  </div>

                  {/* Recipient Name */}
                  <div className="my-2">
                    <h2 className="text-3xl font-black text-stone-900 tracking-tight border-b-2 border-amber-300/80 px-8 pb-1 inline-block">
                      {data.recipientName}
                    </h2>
                    <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed mt-3 font-medium">
                      {data.awardReason}
                    </p>
                  </div>

                  {/* Bottom Signatures & Seal */}
                  <div className="w-full grid grid-cols-3 items-end pt-4 border-t border-stone-200">
                    {/* Left: Date */}
                    <div className="text-left">
                      <p className="text-xs font-bold text-stone-800">{data.issueDate}</p>
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Date Granted</p>
                    </div>

                    {/* Center: Seal Badge */}
                    <div className="flex justify-center">
                      {data.sealStyle === 'gold-star' && (
                        <div style={{ backgroundColor: data.primaryColor }} className="w-14 h-14 rounded-full text-white flex flex-col items-center justify-center shadow-lg border-2 border-white">
                          <Star size={20} fill="#ffffff" />
                          <span className="text-[8px] font-black tracking-tighter">OFFICIAL</span>
                        </div>
                      )}
                      {data.sealStyle === 'shield-crest' && (
                        <div style={{ backgroundColor: data.primaryColor }} className="w-14 h-14 rounded-full text-white flex flex-col items-center justify-center shadow-lg border-2 border-white">
                          <Shield size={20} />
                          <span className="text-[8px] font-black tracking-tighter">VERIFIED</span>
                        </div>
                      )}
                      {data.sealStyle === 'ribbon-badge' && (
                        <div style={{ backgroundColor: data.primaryColor }} className="w-14 h-14 rounded-full text-white flex flex-col items-center justify-center shadow-lg border-2 border-white">
                          <Award size={20} />
                          <span className="text-[8px] font-black tracking-tighter">AWARD</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Signature */}
                    <div className="text-right">
                      {data.signatureImage ? (
                        <img src={data.signatureImage} alt="Signature" className="h-10 object-contain ml-auto mb-1" />
                      ) : (
                        <p className="font-serif italic text-base text-stone-800 mb-1">{data.issuerName}</p>
                      )}
                      <p className="text-xs font-bold text-stone-800 border-t border-stone-300 pt-1">{data.issuerName}</p>
                      <p className="text-[10px] text-stone-500 font-medium">{data.issuerTitle}</p>
                    </div>
                  </div>

                  <p className="text-[9px] font-mono text-stone-400 tracking-widest mt-1">
                    VERIFICATION ID: {data.certificateId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 100 Preset Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white">Choose from 100+ Certificate Styles</h3>
                <p className="text-xs text-stone-500 font-medium">Select a categorized design preset to apply instantly.</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-white rounded-full bg-stone-100 dark:bg-stone-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex gap-2 overflow-x-auto no-scrollbar">
              {CERTIFICATE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      templateId: tpl.id,
                      primaryColor: tpl.colorHex,
                      borderStyle: tpl.borderStyle
                    }));
                    setShowTemplateModal(false);
                  }}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:border-amber-500 transition cursor-pointer flex flex-col justify-between hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                        {tpl.category}
                      </span>
                      <div style={{ backgroundColor: tpl.colorHex }} className="w-4 h-4 rounded-full shadow-xs" />
                    </div>
                    <h4 className="text-sm font-black text-stone-800 dark:text-stone-100 mb-1">{tpl.name}</h4>
                    <p className="text-[11px] text-stone-500 leading-tight">{tpl.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800 flex justify-end">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      Apply Design <Check size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
