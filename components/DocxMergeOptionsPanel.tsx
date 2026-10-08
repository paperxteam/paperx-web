import React from 'react';
import { 
  FileText, 
  Settings2, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  BookOpen, 
  Layers, 
  FileCheck, 
  Hash, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { DocxMergeOptions, FileData } from '../types';

interface DocxMergeOptionsPanelProps {
  options: DocxMergeOptions;
  onOptionsChange: (newOptions: DocxMergeOptions) => void;
  files: FileData[];
  onReorderFiles?: (fromIndex: number, toIndex: number) => void;
  onRemoveFile?: (id: string) => void;
}

export const DocxMergeOptionsPanel: React.FC<DocxMergeOptionsPanelProps> = ({
  options,
  onOptionsChange,
  files,
  onReorderFiles,
  onRemoveFile
}) => {
  const updateOption = <K extends keyof DocxMergeOptions>(key: K, value: DocxMergeOptions[K]) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  const activeFiles = files.filter(f => f.status !== 'cancelled');

  const handleMoveUp = (index: number) => {
    if (index > 0 && onReorderFiles) {
      onReorderFiles(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < activeFiles.length - 1 && onReorderFiles) {
      onReorderFiles(index, index + 1);
    }
  };

  return (
    <div className="bg-stone-50/90 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
            <Settings2 size={20} />
          </div>
          <div>
            <h3 className="font-heading font-black text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
              DOCX Merge Options
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Word OpenXML
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Customize how documents are joined, formatted, and numbered.
            </p>
          </div>
        </div>

        {/* Output Format Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xs self-start sm:self-center">
          <button
            type="button"
            onClick={() => updateOption('outputFormat', 'docx')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              (options.outputFormat || 'docx') === 'docx'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <FileText size={14} />
            Output .DOCX
          </button>
          <button
            type="button"
            onClick={() => updateOption('outputFormat', 'pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              options.outputFormat === 'pdf'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <FileCheck size={14} />
            Output .PDF
          </button>
        </div>
      </div>

      {/* Grid of Toggle Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5">
        {/* Option 1: Page Break Between Documents */}
        <label className="flex items-start gap-3 p-3.5 bg-white dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 rounded-2xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors">
          <input
            type="checkbox"
            checked={options.pageBreakBetween !== false}
            onChange={(e) => updateOption('pageBreakBetween', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-stone-800 border-stone-300 dark:border-stone-700 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
              <Layers size={15} className="text-blue-500" />
              Page Break Between Documents
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Start each merged Word document on a fresh new page.
            </p>
          </div>
        </label>

        {/* Option 2: Add Document Titles as Headings */}
        <label className="flex items-start gap-3 p-3.5 bg-white dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 rounded-2xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors">
          <input
            type="checkbox"
            checked={!!options.addSectionTitles}
            onChange={(e) => updateOption('addSectionTitles', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-stone-800 border-stone-300 dark:border-stone-700 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
              <FileText size={15} className="text-indigo-500" />
              Add File Names as Section Headings
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Inserts a styled Heading 1 with the document name at the start of each section.
            </p>
          </div>
        </label>

        {/* Option 3: Continuous Page Numbers */}
        <label className="flex items-start gap-3 p-3.5 bg-white dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 rounded-2xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors">
          <input
            type="checkbox"
            checked={options.continuousPageNumbers !== false}
            onChange={(e) => updateOption('continuousPageNumbers', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-stone-800 border-stone-300 dark:border-stone-700 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
              <Hash size={15} className="text-emerald-500" />
              Continuous Footer Page Numbering
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Enforce continuous &quot;Page X of Y&quot; page numbers in the footer across all files.
            </p>
          </div>
        </label>

        {/* Option 4: Table of Contents */}
        <label className="flex items-start gap-3 p-3.5 bg-white dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 rounded-2xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors">
          <input
            type="checkbox"
            checked={!!options.generateToc}
            onChange={(e) => updateOption('generateToc', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-stone-800 border-stone-300 dark:border-stone-700 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
              <BookOpen size={15} className="text-amber-500" />
              Generate Table of Contents
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Inserts an automated overview page at the beginning of the merged document.
            </p>
          </div>
        </label>
      </div>

      {/* Reordering List (if multiple files are selected) */}
      {activeFiles.length > 1 && onReorderFiles && (
        <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-blue-500" />
              Merge Sequence ({activeFiles.length} Documents)
            </span>
            <span className="text-[11px] text-stone-400">
              Use arrows to adjust the joining order
            </span>
          </div>

          <div className="space-y-2">
            {activeFiles.map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-white dark:bg-stone-950 rounded-2xl border border-stone-200/70 dark:border-stone-800/80 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-black text-stone-600 dark:text-stone-300 shrink-0">
                    {idx + 1}
                  </span>
                  <FileText size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {file.file.name}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {(file.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === activeFiles.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  {onRemoveFile && (
                    <button
                      type="button"
                      onClick={() => onRemoveFile(file.id)}
                      className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 transition"
                      title="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
