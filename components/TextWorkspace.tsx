import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { summarizeText, rewriteText, translateText } from '../services/automatedService';
import { DocumentService } from '../services/documentService';
import { Download, Copy, Sparkles, Languages, ArrowRight, Wand2, Users, FileCode } from 'lucide-react';

import { Socket } from 'socket.io-client';

interface TextWorkspaceProps {
  toolId: string;
  socket?: Socket | null;
  docId?: string;
  onComplete?: (blob: Blob, filename: string) => void;
}

export const TextWorkspace: React.FC<TextWorkspaceProps> = ({ toolId, socket, docId, onComplete }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeUsers, setActiveUsers] = useState<{ id: string }[]>([]);

  useEffect(() => {
    if (!socket || !docId) return;
    socket.emit('join-document', docId);
    socket.on('load-document', (data) => {
      setText(data);
    });
    socket.on('document-updated', (data) => {
      setText(data);
    });
    socket.on('users-in-room', (users) => {
      setActiveUsers(users);
    });
    socket.on('user-joined', (user) => {
      setActiveUsers((prev) => [...prev, user]);
    });
    socket.on('user-left', (user) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));
    });
    return () => {
      socket.off('load-document');
      socket.off('document-updated');
      socket.off('users-in-room');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, docId]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    socket?.emit('update-document', { docId, data: newText });
  };

  const getActionLabel = () => {
    if (isProcessing) return processingStatus || 'Processing...';
    switch (toolId) {
      case 'summarize-pdf': return 'Summarize Document';
      case 'translate-pdf': return 'Translate Document';
      case 'pdf-to-markdown': return 'Convert to Markdown';
      default: return 'Process Document';
    }
  };

  const getIcon = () => {
     switch (toolId) {
        case 'summarize-pdf': return Sparkles;
        case 'translate-pdf': return Languages;
        case 'pdf-to-markdown': return FileCode;
        default: return ArrowRight;
     }
  };

  const Icon = getIcon();

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setResult(null);
    setGeneratedBlob(null);

    try {
      if (toolId === 'summarize-pdf') {
        setProcessingStatus('AI Analyzing text...');
        const res = await summarizeText(text);
        setResult(res);
        const { blob, filename } = await DocumentService.textToPDF(res || text, () => {});
        setGeneratedBlob(blob);
        setGeneratedFilename(filename);
        if (onComplete) onComplete(blob, filename);
      } else if (toolId === 'translate-pdf') {
        setProcessingStatus('Translating document...');
        const res = await translateText(text, 'Spanish');
        setResult(res);
        const { blob, filename } = await DocumentService.textToPDF(res || text, () => {});
        setGeneratedBlob(blob);
        setGeneratedFilename(filename);
        if (onComplete) onComplete(blob, filename);
      } else if (toolId === 'pdf-to-markdown') {
        setProcessingStatus('Formatting markdown...');
        const mdBlob = new Blob([text], { type: 'text/markdown' });
        const mdName = `Document_${Date.now()}.md`;
        setGeneratedBlob(mdBlob);
        setGeneratedFilename(mdName);
        setResult(text);
        if (onComplete) onComplete(mdBlob, mdName);
      }
    } catch (e) {
      setResult("An error occurred processing your request. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDownload = () => {
    if (generatedBlob && generatedFilename) {
        const url = URL.createObjectURL(generatedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedFilename;
        a.click();
        URL.revokeObjectURL(url);
        return;
    }

    const contentToDownload = result && toolId !== 'create-pdf' && toolId !== 'text-to-pdf' ? result : text;
    const blob = new Blob([contentToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaperX_Document_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-fade-in-up">
      {/* Input Section */}
      <div className="flex flex-col min-h-[400px] lg:h-[500px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-black/5 transition-all">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Input</span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={12} />
                    <span>{activeUsers.length} active</span>
                </div>
            </div>
            <div className="flex gap-1 group">
                <div className="w-3 h-3 rounded-full bg-red-400/20 group-hover:bg-red-400/60 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/20 group-hover:bg-yellow-400/60 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/20 group-hover:bg-green-400/60 transition-colors"></div>
            </div>
        </div>
        <textarea
          className="flex-1 w-full p-4 md:p-6 resize-none focus:outline-none text-gray-800 leading-relaxed font-medium text-base md:text-lg"
          placeholder={toolId === 'create-pdf' || toolId === 'text-to-pdf' ? "Start typing your document here..." : "Paste the text you want to process..."}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
        />
        <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
          <Button 
            onClick={handleProcess} 
            isLoading={isProcessing}
            disabled={!text.trim()}
            className="group w-full sm:w-auto font-bold tracking-tight shadow-xl"
          >
            <Icon size={16} className={`mr-2 ${isProcessing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform duration-300'}`} />
            {getActionLabel()}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      {(result || isProcessing || toolId === 'create-pdf' || toolId === 'text-to-pdf') && (
        <div className={`flex flex-col min-h-[400px] lg:h-[500px] bg-white/80  rounded-3xl border border-white/20 shadow-2xl shadow-black/5 overflow-hidden ${!result && !isProcessing && toolId !== 'create-pdf' && toolId !== 'text-to-pdf' ? 'opacity-50 grayscale' : ''}`}>
           <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex items-center justify-between text-white">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    {toolId === 'create-pdf' || toolId === 'text-to-pdf' ? 'Preview' : 'Output'}
                </span>
                {result && !isProcessing && (
                    <button onClick={() => navigator.clipboard.writeText(result)} className="text-gray-400 hover:text-white transition-colors group">
                        <Copy size={14} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>
            
            <div className="flex-1 p-6 md:p-8 bg-white/50 overflow-y-auto relative">
                {isProcessing ? (
                    /* Premium Loading Animation */
                    <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-gray-200/50 rounded w-3/4 animate-[shimmer_2s_infinite]"></div>
                        <div className="h-4 bg-gray-200/50 rounded w-full animate-[shimmer_2s_infinite_0.2s]"></div>
                        <div className="h-4 bg-gray-200/50 rounded w-5/6 animate-[shimmer_2s_infinite_0.4s]"></div>
                        <div className="h-4 bg-gray-200/50 rounded w-4/5 animate-[shimmer_2s_infinite_0.6s]"></div>
                        <div className="mt-8 h-4 bg-gray-200/50 rounded w-full animate-[shimmer_2s_infinite]"></div>
                        <div className="h-4 bg-gray-200/50 rounded w-2/3 animate-[shimmer_2s_infinite_0.2s]"></div>
                    </div>
                ) : (toolId === 'create-pdf' || toolId === 'text-to-pdf') && !result ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-20 border-2 border-dashed border-gray-300 rounded-lg mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Document Preview</p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none">
                         {toolId === 'create-pdf' || toolId === 'text-to-pdf' ? (
                             <div className="bg-white shadow-xl p-8 min-h-[300px] text-gray-800 text-sm leading-relaxed whitespace-pre-line animate-fade-in-up font-medium rounded-xl border border-gray-100">
                                 {text}
                             </div>
                         ) : (
                             <p className="text-gray-900 leading-relaxed whitespace-pre-line text-base md:text-lg font-medium animate-fade-in-up">
                                 {result}
                             </p>
                         )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white/50 border-t border-white/20 ">
                {result && !isProcessing ? (
                     <Button variant="secondary" onClick={handleDownload} className="group w-full font-black rounded-2xl shadow-lg border-none bg-black text-white hover:bg-gray-900">
                        <Download size={16} className="mr-2 group-hover:animate-bounce" />
                        Download PDF
                    </Button>
                ) : (
                     <Button variant="secondary" disabled className="w-full opacity-50 cursor-not-allowed font-black rounded-2xl">
                        <Download size={16} className="mr-2" />
                        Download PDF
                    </Button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};