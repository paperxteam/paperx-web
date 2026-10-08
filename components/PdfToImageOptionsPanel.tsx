import React from 'react';
import { ImageIcon, Layers, Sliders } from 'lucide-react';

export interface PdfToImageOptions {
  imageFormat: 'jpg' | 'png';
  pageMode: 'all' | 'range';
  pageRange: string;
  resolution: 'standard' | 'high' | 'ultra';
}

interface PdfToImageOptionsPanelProps {
  options: PdfToImageOptions;
  onOptionsChange: (opts: PdfToImageOptions) => void;
  toolId?: string;
}

export const PdfToImageOptionsPanel: React.FC<PdfToImageOptionsPanelProps> = ({
  options,
  onOptionsChange,
  toolId
}) => {
  return (
    <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-5 space-y-4 mb-6">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">PDF to Image Conversion Options</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
        {/* Output Format */}
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Image Format</label>
          <select
            value={options.imageFormat}
            onChange={(e) => onOptionsChange({ ...options, imageFormat: e.target.value as any })}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-gray-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="jpg">JPG (Smaller file size)</option>
            <option value="png">PNG (Lossless / Transparent)</option>
          </select>
        </div>

        {/* Resolution / DPI */}
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Quality & Resolution</label>
          <select
            value={options.resolution}
            onChange={(e) => onOptionsChange({ ...options, resolution: e.target.value as any })}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-gray-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="standard">Standard (150 DPI)</option>
            <option value="high">High Definition (300 DPI)</option>
            <option value="ultra">Ultra Sharp (450 DPI)</option>
          </select>
        </div>

        {/* Pages to Export */}
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Pages to Render</label>
          <select
            value={options.pageMode}
            onChange={(e) => onOptionsChange({ ...options, pageMode: e.target.value as any })}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-gray-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Pages</option>
            <option value="range">Select Custom Page Range</option>
          </select>
        </div>
      </div>

      {/* Range Input */}
      {options.pageMode === 'range' && (
        <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
          <label className="block text-gray-700 dark:text-gray-300 mb-1 text-xs font-bold">
            Page Range (e.g. <span className="font-mono text-indigo-600">1, 3-5, 8</span>)
          </label>
          <input
            type="text"
            placeholder="1, 3-5, 8"
            value={options.pageRange}
            onChange={(e) => onOptionsChange({ ...options, pageRange: e.target.value })}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      )}
    </div>
  );
};
