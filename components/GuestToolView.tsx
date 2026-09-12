import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Download, 
  CheckCircle2, 
  ScanLine, 
  FileText, 
  Combine, 
  Archive, 
  Scissors, 
  Layers, 
  Type, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Tool, FileData } from '../types';
import { TOOLS } from '../constants';
import { Button } from './Button';
import { FileUpload } from './FileUpload';
import { TextWorkspace } from './TextWorkspace';
import { VoiceWorkspace } from './VoiceWorkspace';
import { Socket } from 'socket.io-client';

interface GuestToolViewProps {
  tool: Tool;
  activeToolId: string;
  files: FileData[];
  rawFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onCancelFile: (id: string) => void;
  onCancelBatch: () => void;
  onGenericFileProcess: () => Promise<void>;
  onProcessedFile: (blob: Blob, rawFilename: string) => Promise<void>;
  isProcessing: boolean;
  processingStatus: string;
  processingProgress: number;
  socket: Socket | null;
  guestTrialsUsed: number;
  onNavigate: (path: string) => void;
  onOpenScanner?: () => void;
  appSettings?: any;
}

export const GuestToolView: React.FC<GuestToolViewProps> = ({
  tool,
  activeToolId,
  files,
  rawFiles,
  onFilesSelected,
  onRemoveFile,
  onCancelFile,
  onCancelBatch,
  onGenericFileProcess,
  onProcessedFile,
  isProcessing,
  processingStatus,
  processingProgress,
  socket,
  guestTrialsUsed,
  onNavigate,
  onOpenScanner,
  appSettings
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  // Popular alternative tools to link to
  const popularTools = TOOLS.filter(t => t.id !== tool.id && (t.isPopular || ['merge-pdf', 'compress-pdf', 'pdf-to-text', 'text-to-pdf', 'word-to-pdf', 'image-to-pdf'].includes(t.id))).slice(0, 6);

  const ToolIcon = tool.icon || FileText;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-stone-300 selection:text-stone-900">
      {/* Top Announcement Banner if active */}
      {appSettings?.bannerActive && appSettings?.bannerText && (
        <div className="bg-gradient-to-r from-[#FF671F] via-amber-500 to-[#046A38] text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center z-50 shadow-md">
          {appSettings.bannerText}
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Back Button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('/')} 
              className="flex items-center gap-2 group cursor-pointer"
              title="Return to PaperX Home"
            >
              <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                𝕻
              </div>
              <span className="font-heading font-black text-lg tracking-tight text-gray-900 dark:text-white hidden sm:inline">
                PaperX
              </span>
            </button>

            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">/</span>

            {/* Current Tool Badge */}
            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800/80 px-3 py-1.5 rounded-full">
              <ToolIcon size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px] sm:max-w-none">
                {tool.name}
              </span>
            </div>
          </div>

          {/* Right Actions: Guest Trials & Login / Signup */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Free Trial Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <Sparkles size={13} className="animate-pulse" />
              <span>Free to Use</span>
            </div>

            {/* Direct Tool Switcher Button */}
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              All Tools
            </button>

            <button 
              onClick={() => onNavigate('/login')}
              className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white px-3 py-1.5 transition hidden sm:inline-block"
            >
              Log In
            </button>

            <Button 
              variant="premium" 
              size="sm" 
              onClick={() => onNavigate('/signup')}
              className="text-xs sm:text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Dropdown for All Tools */}
        <AnimatePresence>
          {showToolsMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-xl overflow-hidden"
            >
              <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-500">Popular Document Tools</h3>
                  <button 
                    onClick={() => setShowToolsMenu(false)}
                    className="text-xs font-bold text-stone-400 hover:text-black dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {TOOLS.filter(t => t.isPopular || ['text-to-pdf', 'pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf', 'word-to-pdf', 'image-to-pdf'].includes(t.id)).slice(0, 12).map((t) => {
                    const TIcon = t.icon || FileText;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setShowToolsMenu(false);
                          onNavigate(`/${t.id}`);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                          t.id === tool.id 
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                            : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200/70 dark:border-stone-700/60 hover:border-black dark:hover:border-white text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <TIcon size={16} className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{t.name}</p>
                          <p className="text-[10px] opacity-70 truncate">{t.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Tool Workspace Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* Tool Header Presentation */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
            <ToolIcon size={36} className="sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight text-gray-900 dark:text-white mb-3">
            {tool.name}
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed font-normal">
            {tool.description} No installation, watermark, or credit card required.
          </p>

          {/* Quick Value Pillars */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-5 text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" /> Free & Instant
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-indigo-500" /> 100% Private Processing
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={16} className="text-amber-500" /> No Registration Needed
            </span>
          </div>
        </div>

        {/* The Live Interactive Tool Interface */}
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xl overflow-hidden p-6 sm:p-8 md:p-10 mb-12">
          {activeToolId === 'voice-to-pdf' ? (
            <VoiceWorkspace onComplete={onProcessedFile} />
          ) : activeToolId === 'create-pdf' || activeToolId === 'text-to-pdf' || activeToolId === 'summarize-pdf' || activeToolId === 'rewrite-pdf' || activeToolId === 'translate-pdf' ? (
            <TextWorkspace toolId={activeToolId} socket={socket} docId="guest-doc" onComplete={onProcessedFile} />
          ) : (
            <div className="space-y-6">
              {(activeToolId === 'camera-scanner' || activeToolId === 'batch-scanner' || activeToolId === 'scan-pdf' || activeToolId === 'auto-edge-detect') && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                      <ScanLine size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Camera Scanner & Edge Detection</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Scan physical paper directly with your webcam or phone camera.</p>
                    </div>
                  </div>
                  {onOpenScanner && (
                    <Button 
                      onClick={onOpenScanner}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-4 py-2 rounded-xl shrink-0"
                    >
                      <ScanLine size={15} className="mr-1.5" /> Launch Camera
                    </Button>
                  )}
                </div>
              )}

              <FileUpload 
                files={files}
                onFilesSelected={onFilesSelected}
                onRemoveFile={onRemoveFile}
                onCancelFile={onCancelFile}
                onCancelBatch={onCancelBatch}
                toolId={activeToolId}
              />

              {files.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">
                    Ready to convert {files.filter(f => f.status !== 'cancelled').length} file(s)
                  </p>
                  <Button 
                    size="md" 
                    onClick={onGenericFileProcess}
                    isLoading={isProcessing}
                    disabled={files.some(f => f.status === 'uploading' || f.status === 'cancelled')}
                    className="w-full sm:w-auto shadow-xl shadow-black/10 font-bold"
                  >
                    {isProcessing ? processingStatus : `Convert Now`} <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How to use Step-by-Step Guidance */}
        <section className="mb-14">
          <h2 className="text-center text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-8">
            How to use {tool.name} in 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/60 dark:bg-gray-900/60 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl p-6 relative">
              <span className="text-3xl font-black text-stone-200 dark:text-stone-800 block mb-3">01</span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1.5">Select your file</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Upload your document from your computer, phone, or drag and drop it into the converter box above.
              </p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/60 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl p-6 relative">
              <span className="text-3xl font-black text-stone-200 dark:text-stone-800 block mb-3">02</span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1.5">Instant processing</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                PaperX automatically reads and converts your document formatting with zero loss of visual quality.
              </p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/60 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl p-6 relative">
              <span className="text-3xl font-black text-stone-200 dark:text-stone-800 block mb-3">03</span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1.5">Download & Save</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Save the converted file directly to your device. Create a free account anytime to store your history.
              </p>
            </div>
          </div>
        </section>

        {/* Other Popular Tools Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">You Might Also Need</h3>
            <button 
              onClick={() => onNavigate('/')}
              className="text-xs font-bold text-stone-500 hover:text-black dark:hover:text-white flex items-center gap-1"
            >
              See All Tools <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {popularTools.map((popTool) => {
              const PopIcon = popTool.icon || FileText;
              return (
                <button
                  key={popTool.id}
                  onClick={() => onNavigate(`/${popTool.id}`)}
                  className="p-4 bg-white dark:bg-gray-900 border border-stone-200/70 dark:border-stone-800 rounded-2xl hover:border-black dark:hover:border-white transition-all text-left group shadow-sm hover:shadow-md cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <PopIcon size={18} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mb-0.5">
                    {popTool.name}
                  </h4>
                  <p className="text-[10px] text-stone-500 truncate">
                    {popTool.category}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 px-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PaperX Document Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6 font-semibold">
            <button onClick={() => onNavigate('/')} className="hover:text-black dark:hover:text-white">Home</button>
            <button onClick={() => onNavigate('/signup')} className="hover:text-black dark:hover:text-white">Free Sign Up</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-black dark:hover:text-white">Log In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
