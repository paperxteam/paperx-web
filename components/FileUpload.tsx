import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertCircle, Loader2, AlertTriangle, ArrowUp, Ban } from 'lucide-react';
import { FileData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTranslation } from '../translations';
import { CloudStorageModal, GoogleDriveAnimatedIcon, DropboxAnimatedIcon, CloudProvider } from './CloudStorageModal';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  files: FileData[];
  onRemoveFile: (id: string) => void;
  onCancelFile?: (id: string) => void;
  onCancelBatch?: () => void;
  maxFiles?: number;
  toolId?: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFilesSelected, 
    files, 
    onRemoveFile, 
    onCancelFile,
    onCancelBatch,
    maxFiles = 10,
    toolId
}) => {
  const { t } = useAppTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [cloudModalProvider, setCloudModalProvider] = useState<CloudProvider>('google-drive');
  const dragCounter = useRef(0);

  const openCloudImport = (provider: CloudProvider) => {
    setCloudModalProvider(provider);
    setIsCloudModalOpen(true);
  };

  const validateAndSelectFiles = useCallback((fileList: File[]) => {
    setError(null);
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 100MB size limit.`);
        return; 
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length) {
      validateAndSelectFiles(Array.from(e.dataTransfer.files));
    }
  }, [validateAndSelectFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      validateAndSelectFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  }, [validateAndSelectFiles]);

  // Batch Status Calculations
  const isBatchProcessing = files.some(f => f.status === 'processing');
  const isBatchUploading = files.some(f => f.status === 'uploading');
  const hasErrors = files.some(f => f.status === 'error');
  
  // Batch is finished if nothing is processing/uploading and we have files that are either ready or error or cancelled
  const isBatchFinished = files.length > 0 && !isBatchProcessing && !isBatchUploading && files.every(f => f.status === 'ready' || f.status === 'error' || f.status === 'cancelled');
  
  // Calculate progress (excluding cancelled files)
  const activeFiles = files.filter(f => f.status !== 'cancelled');
  const totalProgress = activeFiles.length > 0 ? activeFiles.reduce((acc, curr) => {
    let p = curr.progress;
    if (curr.status === 'error' || (curr.status === 'ready' && !isBatchUploading)) p = 100;
    return acc + p;
  }, 0) / activeFiles.length : 0;

  // Determine progress bar color based on result
  let progressBarColor = 'bg-black';
  if (isBatchFinished) {
      progressBarColor = hasErrors ? 'bg-amber-500' : 'bg-green-500';
  } else if (isBatchUploading) {
      progressBarColor = 'bg-blue-600';
  }

  const getAcceptString = () => {
      switch (toolId) {
          case 'image-to-pdf': 
          case 'jpg-to-pdf':
          case 'compress-image':
          case 'image-to-text':
              return 'image/jpeg,image/png,image/webp';
          case 'word-to-pdf': 
          case 'merge-docx':
          case 'split-docx':
          case 'docx-to-txt':
          case 'docx-to-html':
              return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          case 'excel-to-pdf': 
          case 'merge-xlsx':
          case 'split-xlsx':
              return '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
          case 'powerpoint-to-pdf':
          case 'merge-pptx':
          case 'split-pptx':
              return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
          case 'csv-to-pdf':
          case 'csv-to-xlsx':
              return '.csv,text/csv';
          case 'txt-to-pdf':
          case 'txt-to-docx':
              return '.txt,text/plain';
          case 'markdown-to-pdf':
          case 'markdown-to-docx':
              return '.md,.markdown,text/markdown,text/plain';
          case 'html-to-pdf':
          case 'html-to-docx':
              return '.html,.htm,text/html';
          case 'pdf-to-word':
          case 'pdf-to-excel':
          case 'pdf-to-powerpoint':
          case 'pdf-to-txt':
          case 'pdf-to-markdown':
          case 'pdf-to-html':
          case 'pdf-to-pdfa':
          case 'pdf-to-csv':
          case 'pdf-to-jpg':
          case 'pdf-to-png':
          case 'merge-pdf':
          case 'split-pdf':
          case 'compress-pdf':
          case 'repair-pdf':
          case 'ocr-pdf':
          case 'protect-pdf':
          case 'unlock-pdf':
          case 'sign-pdf':
          case 'edit-pdf':
          case 'rotate-pdf':
          case 'rotate-pages':
          case 'crop-pdf':
          case 'add-page-numbers':
          case 'watermark-pdf':
          case 'add-header-footer':
          case 'pdf-forms':
          case 'pdf-find-replace':
          case 'flatten-pdf':
          case 'nup-pdf':
          case 'redact-pdf':
          case 'compare-pdf':
          case 'extract-pages':
          case 'remove-pages':
          case 'replace-pages':
          case 'insert-pages':
          case 'duplicate-pages':
          case 'organize-pdf':
              return 'application/pdf';
          case 'add-image-to-pdf':
              return 'application/pdf,image/jpeg,image/png,image/webp';
          case 'scan-pdf':
              return 'image/jpeg,image/png,application/pdf';
          default:
              return 'application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.html,image/jpeg,image/png,image/webp';
      }
  };

  const getAcceptText = () => {
      switch (toolId) {
          case 'image-to-pdf':
          case 'jpg-to-pdf':
          case 'compress-image':
          case 'image-to-text':
              return 'Support for JPG, PNG, WEBP. Max size 100MB.';
          case 'word-to-pdf':
          case 'merge-docx':
          case 'split-docx':
          case 'docx-to-txt':
          case 'docx-to-html':
              return 'Support for DOC, DOCX. Max size 100MB.';
          case 'excel-to-pdf':
          case 'merge-xlsx':
          case 'split-xlsx':
              return 'Support for XLS, XLSX, CSV. Max size 100MB.';
          case 'powerpoint-to-pdf':
          case 'merge-pptx':
          case 'split-pptx':
              return 'Support for PPT, PPTX. Max size 100MB.';
          case 'csv-to-pdf':
          case 'csv-to-xlsx':
              return 'Support for CSV files. Max size 100MB.';
          case 'txt-to-pdf':
          case 'txt-to-docx':
              return 'Support for TXT plain text. Max size 100MB.';
          case 'markdown-to-pdf':
          case 'markdown-to-docx':
              return 'Support for Markdown (.md) documents. Max size 100MB.';
          case 'html-to-pdf':
          case 'html-to-docx':
              return 'Support for HTML web pages. Max size 100MB.';
          case 'add-image-to-pdf':
              return 'Select your PDF document and image files. Max size 100MB.';
          default:
              return 'Support for PDF, Word, Excel, PowerPoint, CSV, Text, HTML, and Images. Max size 100MB.';
      }
  };

  return (
    <div 
      className="w-full max-w-3xl mx-auto relative min-h-[16rem]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay - Only show if we have files (list view), otherwise the empty state handles the visual */}
      <AnimatePresence>
        {isDragging && files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-white/90 border-2 border-black border-dashed rounded-[2.5rem] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="p-6 bg-black rounded-3xl mb-4 shadow-2xl">
               <UploadCloud size={48} className="text-white animate-bounce" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{t('dropFiles', 'Drop files here')}</h3>
            <p className="text-gray-500 mt-2 font-medium text-lg">{t('addWorkspace', 'Add to your workspace instantly')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-sm text-red-600 font-medium shadow-sm"
          >
            <AlertCircle size={18} className="animate-pulse" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-800 transition-colors group">
              <X size={16} className="group-hover:rotate-90 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {files.length === 0 ? (
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative group h-72 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all duration-500 ease-out cursor-pointer
          ${isDragging 
              ? 'border-black bg-gray-50 shadow-2xl ring-8 ring-gray-100/50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
          }`}
        >
          <input 
            type="file" 
            multiple 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileInput}
            accept={getAcceptString()}
          />
          <div className={`p-6 bg-white rounded-3xl shadow-sm mb-6 transition-all duration-500 ${isDragging ? 'scale-110 rotate-3 shadow-xl' : 'group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-lg'}`}>
            <UploadCloud size={40} className={`text-gray-900 ${isDragging ? 'animate-bounce' : 'group-hover:text-black transition-transform'}`} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            {isDragging ? t('dropToUpload', 'Drop files to upload') : <span>{t('dropOrBrowse', 'Drop files here or')} <span className="underline decoration-2 underline-offset-4 decoration-black/20 hover:decoration-black transition-all">{t('browse', 'browse')}</span></span>}
          </h3>
          <p className="text-base text-gray-500 max-w-xs mx-auto font-medium">
            {getAcceptText()}
          </p>

          {/* Cloud Provider Select Options */}
          <div 
            className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-center gap-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-semibold text-gray-400">or import from</span>
            <div className="flex items-center gap-1.5 bg-gray-50/90 p-1 rounded-2xl border border-gray-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => openCloudImport('google-drive')}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                title="Import from Google Drive"
              >
                <GoogleDriveAnimatedIcon className="w-4 h-4" />
                <span>Drive</span>
              </button>
              <button
                type="button"
                onClick={() => openCloudImport('dropbox')}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                title="Import from Dropbox"
              >
                <DropboxAnimatedIcon className="w-4 h-4" />
                <span>Dropbox</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Consolidated Batch Status Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 rounded-[2rem] p-6 border border-white/60 shadow-sm"
          >
             <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                <h3 className="text-lg font-bold flex items-center gap-2 tracking-tight">
                   {isBatchProcessing ? (
                     <>
                        <Loader2 className="animate-spin text-black" size={20} />
                        Processing Batch...
                     </>
                   ) : isBatchUploading ? (
                     <>
                        <ArrowUp className="animate-bounce text-blue-600" size={20} />
                        Uploading Files...
                     </>
                   ) : isBatchFinished ? (
                      hasErrors ? (
                        <>
                           <AlertTriangle className="text-amber-500 animate-pulse" size={20} />
                           Completed with Errors
                        </>
                      ) : (
                        <>
                           <CheckCircle2 className="text-green-500 animate-scale-in" size={20} />
                           Batch Ready
                        </>
                      )
                   ) : (
                     `Selected Files (${files.length})`
                   )}
                </h3>
                
                <div className="flex items-center gap-2">
                   {(isBatchProcessing || isBatchUploading) && onCancelBatch && (
                      <button 
                         onClick={onCancelBatch}
                         className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                         Cancel All
                      </button>
                   )}

                   {files.length < maxFiles && !isBatchProcessing && !isBatchUploading && (
                      <div className="flex items-center gap-1.5">
                        <label className="group text-sm font-bold text-gray-600 hover:text-black cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <input type="file" multiple className="hidden" onChange={handleFileInput} accept={getAcceptString()} />
                          <span className="group-hover:rotate-90 transition-transform inline-block">+</span> Add more
                        </label>
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => openCloudImport('google-drive')}
                            className="p-1 hover:bg-gray-100 rounded text-gray-700 transition-colors cursor-pointer"
                            title="Add from Google Drive"
                          >
                            <GoogleDriveAnimatedIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openCloudImport('dropbox')}
                            className="p-1 hover:bg-gray-100 rounded text-gray-700 transition-colors cursor-pointer"
                            title="Add from Dropbox"
                          >
                            <DropboxAnimatedIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                   )}
                </div>
             </div>

             {/* Total Progress Bar */}
             {(isBatchProcessing || isBatchFinished || isBatchUploading) && (
                <div className="space-y-2">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-300 ease-out ${progressBarColor}`}
                            style={{ width: `${totalProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-right text-gray-500 font-mono font-bold">
                        {Math.round(totalProgress)}%
                    </p>
                </div>
             )}
          </motion.div>
          
          {/* File List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <motion.div 
                    key={file.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className={`group relative bg-white/60  border rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-xl hover:border-white/80 transition-all ${file.status === 'cancelled' ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-white/60'}`}
                >
                  <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-all duration-300">
                    <FileIcon size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-sm font-bold truncate pr-4 tracking-tight ${file.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{file.name}</p>
                    
                    {/* Action Buttons */}
                    {(file.status === 'uploading' || file.status === 'processing') ? (
                       onCancelFile && (
                        <button 
                            onClick={() => onCancelFile(file.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 group/cancel"
                            title="Cancel operation"
                        >
                            <X size={16} className="group-hover/cancel:rotate-90 transition-transform" />
                        </button>
                       )
                    ) : (
                      <button 
                        onClick={() => onRemoveFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 group/delete"
                        title="Remove file"
                      >
                        <X size={16} className="group-hover/delete:rotate-90 transition-transform" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Uploading State */}
                    {file.status === 'uploading' && (
                       <div className="flex-1 flex flex-col gap-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-150 ease-out"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-blue-500 font-bold">Uploading...</span>
                       </div>
                    )}

                    {/* Processing State */}
                    {file.status === 'processing' && (
                       <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-black rounded-full transition-all duration-300 ease-out"
                           style={{ width: `${file.progress}%` }}
                         />
                       </div>
                    )}
                    
                    {file.status === 'ready' && file.progress === 100 && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                        <CheckCircle2 size={12} className="animate-scale-in" />
                        Done
                      </span>
                    )}

                    {file.status === 'ready' && file.progress === 0 && (
                      <span className="text-xs text-gray-400 font-medium">Ready</span>
                    )}
                    
                    {file.status === 'error' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                        <AlertCircle size={12} />
                        Error
                      </span>
                    )}

                    {file.status === 'cancelled' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <Ban size={12} />
                        Cancelled
                      </span>
                    )}

                    <span className="text-xs text-gray-400 tabular-nums ml-auto whitespace-nowrap font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Real Cloud Storage Modal */}
      {isCloudModalOpen && (
        <CloudStorageModal
          isOpen={isCloudModalOpen}
          onClose={() => setIsCloudModalOpen(false)}
          initialProvider={cloudModalProvider}
          fileType={toolId?.includes('image') || toolId?.includes('jpg') ? 'image' : toolId?.includes('word') || toolId?.includes('docx') ? 'word' : 'all'}
          onFilesImported={(importedFiles) => {
            validateAndSelectFiles(importedFiles);
            setIsCloudModalOpen(false);
          }}
        />
      )}
    </div>
  );
};