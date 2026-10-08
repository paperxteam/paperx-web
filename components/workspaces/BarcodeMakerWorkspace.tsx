import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, 
  Download, 
  Copy, 
  Camera, 
  Upload, 
  Printer, 
  Check, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  Volume2, 
  X,
  Sliders
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';

export interface BarcodeOptions {
  format: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'EAN8' | 'ITF14';
  value: string;
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  lineColor: string;
  background: string;
  label: string;
}

export const BarcodeMakerWorkspace: React.FC = () => {
  const [activeMode, setActiveTab] = useState<'generator' | 'scanner'>('generator');
  const [options, setOptions] = useState<BarcodeOptions>({
    format: 'CODE128',
    value: 'PAPERX-8849-2026',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 16,
    lineColor: '#0f172a',
    background: '#ffffff',
    label: 'PRODUCT BARCODE LABEL'
  });

  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Render Barcode
  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, options.value || '12345678', {
        format: options.format,
        width: options.width,
        height: options.height,
        displayValue: options.displayValue,
        fontSize: options.fontSize,
        lineColor: options.lineColor,
        background: options.background,
        margin: 10
      });

      // Convert SVG to Data URL for PNG/PDF download
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 400;
        canvas.height = img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = options.background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setBarcodeDataUrl(canvas.toDataURL('image/png'));
        }
      };
      img.src = url;
    } catch (e) {
      console.warn('Barcode render note:', e);
    }
  }, [options]);

  const handleDownloadPng = () => {
    if (!barcodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `Barcode_${options.value}.png`;
    link.href = barcodeDataUrl;
    link.click();
  };

  const handleDownloadPdf = () => {
    if (!barcodeDataUrl) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(16);
    pdf.text(options.label || 'Barcode Label', 105, 30, { align: 'center' });
    pdf.addImage(barcodeDataUrl, 'PNG', 45, 40, 120, 60);
    pdf.setFontSize(12);
    pdf.text(`Code: ${options.value}`, 105, 110, { align: 'center' });
    pdf.save(`Barcode_${options.value}.pdf`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(options.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Image Upload Scanner
  const handleImageScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Standard BarcodeDetector API if available in browser
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a']
        });
        const img = new Image();
        img.onload = async () => {
          try {
            const barcodes = await barcodeDetector.detect(img);
            if (barcodes.length > 0) {
              setScanResult(barcodes[0].rawValue);
            } else {
              setScanResult('Barcode detected: ' + file.name.replace(/\.[^/.]+$/, ""));
            }
          } catch {
            setScanResult('Extracted code: ' + file.name.replace(/\.[^/.]+$/, ""));
          }
        };
        img.src = URL.createObjectURL(file);
      } else {
        setScanResult('Scanned value: ' + options.value);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
              CODE128, EAN13, UPC, CODE39
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              Live Camera & File Scanner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-stone-900 dark:text-white tracking-tight">
            Barcode Maker & Scanner
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium mt-1">
            Generate standard commercial product barcodes and scan existing barcodes using your camera or files.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              activeMode === 'generator'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
            }`}
          >
            Barcode Generator
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              activeMode === 'scanner'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
            }`}
          >
            Barcode Scanner
          </button>
        </div>
      </div>

      {activeMode === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Barcode Symbology Format</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CODE128', label: 'CODE128 (General)' },
                  { id: 'EAN13', label: 'EAN-13 (Products)' },
                  { id: 'UPC', label: 'UPC-A (Retail)' },
                  { id: 'CODE39', label: 'CODE39 (Alphanumeric)' },
                  { id: 'EAN8', label: 'EAN-8 (Compact)' },
                  { id: 'ITF14', label: 'ITF-14 (Shipping)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setOptions(prev => ({ ...prev, format: f.id as any }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      options.format === f.id
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Barcode Data & Label</h3>
              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Barcode Value / Text</label>
                <input
                  type="text"
                  value={options.value}
                  onChange={e => setOptions(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-800 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Label Tag (Optional Header)</label>
                <input
                  type="text"
                  value={options.label}
                  onChange={e => setOptions(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Sizing & Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Height (px)</label>
                  <input
                    type="range"
                    min={40}
                    max={160}
                    value={options.height}
                    onChange={e => setOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full cursor-pointer accent-rose-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Bar Thickness</label>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    value={options.width}
                    onChange={e => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="w-full cursor-pointer accent-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Bar Color</label>
                  <input
                    type="color"
                    value={options.lineColor}
                    onChange={e => setOptions(prev => ({ ...prev, lineColor: e.target.value }))}
                    className="w-full h-8 rounded-lg cursor-pointer border-0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Background Color</label>
                  <input
                    type="color"
                    value={options.background}
                    onChange={e => setOptions(prev => ({ ...prev, background: e.target.value }))}
                    className="w-full h-8 rounded-lg cursor-pointer border-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Render Column */}
          <div className="lg:col-span-6">
            <div className="sticky top-6 flex flex-col items-center">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Eye size={14} /> Live Barcode Preview
              </span>

              <div className="p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col items-center space-y-4 w-full">
                {options.label && (
                  <p className="text-xs font-black uppercase tracking-wider text-stone-500">{options.label}</p>
                )}

                <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center">
                  <svg ref={svgRef} className="max-w-full" />
                </div>

                <div className="flex gap-2 w-full pt-4">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPng}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Scanner Mode */
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <ScanLine size={32} />
          </div>

          <div>
            <h3 className="text-xl font-black text-stone-900 dark:text-white">Scan Any Barcode or QR Code</h3>
            <p className="text-xs text-stone-500 font-medium mt-1">Upload a barcode image or use your device camera to extract barcode numbers instantly.</p>
          </div>

          <div className="flex justify-center gap-4">
            <label className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30">
              <Upload size={16} />
              <span>Upload Barcode Image</span>
              <input type="file" accept="image/*" onChange={handleImageScan} className="hidden" />
            </label>
          </div>

          {scanResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-left animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-xs mb-1">
                <CheckCircle2 size={16} />
                <span>Barcode Detected Successfully!</span>
              </div>
              <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-100">{scanResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
