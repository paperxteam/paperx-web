import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { DocumentService } from '../services/documentService';
import { Mic, Square, Download, FileText, Loader2, Play } from 'lucide-react';

interface VoiceWorkspaceProps {
    onComplete?: (blob: Blob, filename: string) => void;
}

export const VoiceWorkspace: React.FC<VoiceWorkspaceProps> = ({ onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Simulate visualization
  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const draw = () => {
      time += 0.1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;

      for (let i = 0; i < canvas.width; i++) {
        const y = canvas.height / 2 + Math.sin(i * 0.05 + time) * 20 * Math.sin(time * 0.5);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationRef.current);
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Allow a small delay for the last bit of transcription to finish
      setTimeout(async () => {
        setIsProcessing(false);
        if (transcript.trim()) {
           await handleProcessPDF(transcript);
        }
      }, 1000);
    } else {
      // Start recording
      setTranscript('');
      setGeneratedBlob(null);
      setIsRecording(true);
      try {
          recognitionRef.current?.start();
      } catch (e) {
          console.error("Failed to start recognition", e);
          setIsRecording(false);
      }
    }
  };

  const handleProcessPDF = async (text: string) => {
      setIsProcessing(true);
      try {
          const { blob, filename } = await DocumentService.textToPDF(text);
          setGeneratedBlob(blob);
          setGeneratedFilename(filename);
          if (onComplete) onComplete(blob, filename);
      } catch (e) {
          console.error("PDF generation failed", e);
      } finally {
          setIsProcessing(false);
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
     }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center animate-fade-in-up">
      {/* Recorder Visualizer */}
      <div className={`w-full h-64 bg-gray-50 rounded-3xl border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden mb-8 transition-all duration-500 ${isRecording ? 'shadow-inner bg-gray-100' : ''}`}>
         {isRecording ? (
             <>
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Recording 00:0{Math.floor(Math.random() * 9)}
                </div>
                <canvas ref={canvasRef} width={600} height={200} className="w-full h-full opacity-60" />
             </>
         ) : (
             <div className="text-center text-gray-400">
                <Mic size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold tracking-tight">Click microphone to start dictation</p>
             </div>
         )}
         
         <div className="absolute bottom-6">
            <button 
                onClick={handleToggleRecording}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-black text-white'}`}
            >
                {isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
            </button>
         </div>
      </div>

      {/* Transcript Area */}
      {(transcript || isProcessing) && (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <span className="text-sm font-bold text-gray-600 tracking-tight">Transcription Result</span>
            </div>
            <div className="p-8 min-h-[200px] text-lg leading-relaxed text-gray-800 font-medium">
                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 min-h-[150px]">
                        {/* Audio Wave Simulation */}
                        <div className="flex items-end gap-1 h-8">
                            <div className="w-1 bg-black animate-[pulse_1s_ease-in-out_infinite]" style={{ height: '40%' }}></div>
                            <div className="w-1 bg-black animate-[pulse_1.1s_ease-in-out_infinite]" style={{ height: '70%' }}></div>
                            <div className="w-1 bg-black animate-[pulse_1.2s_ease-in-out_infinite]" style={{ height: '100%' }}></div>
                            <div className="w-1 bg-black animate-[pulse_0.9s_ease-in-out_infinite]" style={{ height: '60%' }}></div>
                            <div className="w-1 bg-black animate-[pulse_1.3s_ease-in-out_infinite]" style={{ height: '80%' }}></div>
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest animate-pulse">Transcribing Audio...</span>
                    </div>
                ) : (
                    <div className="animate-fade-in-up">
                        {transcript}
                    </div>
                )}
            </div>
            {!isProcessing && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                     <Button onClick={handleDownload} className="font-bold shadow-lg">
                        <Download size={16} className="mr-2" />
                        Export to PDF
                     </Button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};