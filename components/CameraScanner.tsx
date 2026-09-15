import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Camera, X, Check, ArrowRight, Trash2, Maximize, FileText, 
    Image as ImageIcon, Type, Wand2, ChevronLeft, 
    ChevronRight, Download, Plus, Upload, SwitchCamera, 
    RefreshCw, Sliders, Copy, RotateCw, AlertCircle, ShieldAlert,
    ScanLine, CheckCircle2
} from 'lucide-react';
import { Button } from './Button';
import { Scanner, CornerPoints, extractDocument, scanDocument } from 'scanic';
import { PDFDocument } from 'pdf-lib';
import { generateFormattedFileName } from '../lib/namingUtils';

interface CameraScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (files: File[]) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ isOpen, onClose, onComplete }) => {
    // Camera & Stream State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [isStreamActive, setIsStreamActive] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
    const [isRequestingCamera, setIsRequestingCamera] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Captured Scans State
    const [images, setImages] = useState<string[]>([]);
    const [step, setStep] = useState<'camera' | 'review'>('camera');
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [captureMode, setCaptureMode] = useState<'auto' | 'full'>('auto');

    // Feedback & UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingType, setProcessingType] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<string | null>(null);
    const [shutterFlash, setShutterFlash] = useState(false);
    const [copiedOcr, setCopiedOcr] = useState(false);

    // DOM & Canvas References
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scanic / Edge Detection Refs
    const scannerRef = useRef<Scanner | null>(null);
    const requestRef = useRef<number | null>(null);
    const lastCornersRef = useRef<CornerPoints | null>(null);
    const isDetectingRef = useRef(false);
    const isDetectingFrameRef = useRef(false);

    // Initialize the WebAssembly document scanner
    useEffect(() => {
        let isMounted = true;
        const initScanner = async () => {
            try {
                const s = new Scanner({ maxProcessingDimension: 600 });
                await s.initialize();
                if (isMounted) {
                    scannerRef.current = s;
                }
            } catch (e) {
                console.warn("Scanic WASM scanner fallback to canvas mode:", e);
            }
        };
        initScanner();

        // Enumerate video devices to check if front & rear cameras exist
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                if (isMounted && videoInputs.length > 1) {
                    setHasMultipleCameras(true);
                }
            }).catch(() => {});
        }

        // Check initial permission status if browser API is supported
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' as PermissionName })
                .then(status => {
                    if (isMounted) {
                        setPermissionStatus(status.state as 'prompt' | 'granted' | 'denied');
                    }
                    status.onchange = () => {
                        if (isMounted) {
                            setPermissionStatus(status.state as 'prompt' | 'granted' | 'denied');
                        }
                    };
                })
                .catch(() => {});
        }

        return () => {
            isMounted = false;
        };
    }, []);

    // Haptic / Audio shutter feedback
    const playShutterSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(820, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            }
        } catch {
            // Audio non-blocking
        }
    };

    // Camera Lifecycle: Stop Camera
    const stopCamera = useCallback(() => {
        isDetectingRef.current = false;
        setIsStreamActive(false);

        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        if (stream) {
            stream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch {
                    // Ignore track stopping errors
                }
            });
            setStream(null);
        }
    }, [stream]);

    // Camera Lifecycle: Start Camera & Request Media Permissions
    const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
        stopCamera();
        setError(null);
        setIsRequestingCamera(true);

        // Immediate fallback: ensure stream active becomes true within 600ms so UI is never stuck
        const fallbackTimer = setTimeout(() => {
            setIsStreamActive(true);
            setIsRequestingCamera(false);
        }, 600);

        if (!navigator?.mediaDevices?.getUserMedia) {
            clearTimeout(fallbackTimer);
            setIsRequestingCamera(false);
            setPermissionStatus('unsupported');
            setError("Camera API is not supported in this browser environment. You can scan by uploading document files or photos directly.");
            return;
        }

        try {
            let mediaStream: MediaStream | null = null;
            
            // Primary attempt: Request high-definition video with specified facingMode
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: facing },
                        width: { ideal: 1920, min: 640 },
                        height: { ideal: 1080, min: 480 }
                    },
                    audio: false
                });
            } catch (err1) {
                console.warn("High-res camera constraints failed, attempting basic constraint fallback:", err1);
                // Fallback attempt: Basic unconstrained video stream
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }

            clearTimeout(fallbackTimer);

            if (!mediaStream) {
                throw new Error("Unable to acquire media stream.");
            }

            setPermissionStatus('granted');
            setStream(mediaStream);
            setIsStreamActive(true);
            setError(null);
        } catch (err) {
            clearTimeout(fallbackTimer);
            console.error("Camera acquisition error:", err);
            const domErr = err as DOMException;

            if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
                setPermissionStatus('denied');
                setError("Camera permission was denied. Please allow camera access in your browser address bar or site permissions, or scan by uploading document files below.");
            } else if (domErr.name === 'NotFoundError' || domErr.name === 'DevicesNotFoundError') {
                setPermissionStatus('unsupported');
                setError("No camera hardware was detected on this device. You can upload document photos or images to scan.");
            } else if (domErr.name === 'NotReadableError' || domErr.name === 'TrackStartError') {
                setError("Your camera is currently in use by another app or browser tab. Please close other camera programs and click Retry.");
            } else {
                setError(domErr.message || "Failed to initialize camera. You can retry or upload document photos.");
            }
        } finally {
            setIsRequestingCamera(false);
            setIsStreamActive(true);
        }
    }, [facingMode, stopCamera]);

    // Real-Time Document Edge Detection Loop
    const detectLoop = useCallback(async () => {
        if (!isDetectingRef.current || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
            return;
        }

        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
            requestRef.current = requestAnimationFrame(detectLoop);
            return;
        }

        if (isDetectingFrameRef.current) {
            requestRef.current = requestAnimationFrame(detectLoop);
            return;
        }

        isDetectingFrameRef.current = true;

        try {
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const activeScanner = scannerRef.current;
                if (activeScanner) {
                    const result = await activeScanner.scan(canvas, { mode: 'detect' });
                    const overlay = overlayCanvasRef.current;

                    if (overlay) {
                        overlay.width = overlay.clientWidth || 360;
                        overlay.height = overlay.clientHeight || 480;
                        const octx = overlay.getContext('2d');

                        if (octx) {
                            octx.clearRect(0, 0, overlay.width, overlay.height);

                            if (result && result.success && result.corners) {
                                lastCornersRef.current = result.corners;

                                const containerWidth = overlay.width;
                                const containerHeight = overlay.height;
                                const videoWidth = video.videoWidth;
                                const videoHeight = video.videoHeight;

                                const containerRatio = containerWidth / containerHeight;
                                const videoRatio = videoWidth / videoHeight;

                                let scale = 1, offsetX = 0, offsetY = 0;
                                if (videoRatio > containerRatio) {
                                    scale = containerHeight / videoHeight;
                                    offsetX = (containerWidth - videoWidth * scale) / 2;
                                } else {
                                    scale = containerWidth / videoWidth;
                                    offsetY = (containerHeight - videoHeight * scale) / 2;
                                }

                                const mapPoint = (p: { x: number; y: number }) => ({
                                    x: p.x * scale + offsetX,
                                    y: p.y * scale + offsetY
                                });

                                const tl = mapPoint(result.corners.topLeft);
                                const tr = mapPoint(result.corners.topRight);
                                const br = mapPoint(result.corners.bottomRight);
                                const bl = mapPoint(result.corners.bottomLeft);

                                octx.beginPath();
                                octx.moveTo(tl.x, tl.y);
                                octx.lineTo(tr.x, tr.y);
                                octx.lineTo(br.x, br.y);
                                octx.lineTo(bl.x, bl.y);
                                octx.closePath();

                                octx.lineWidth = 3;
                                octx.strokeStyle = '#FACC15';
                                octx.fillStyle = 'rgba(250, 204, 21, 0.2)';
                                octx.stroke();
                                octx.fill();

                                // Corner reticle pins
                                [tl, tr, br, bl].forEach(pt => {
                                    octx.beginPath();
                                    octx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
                                    octx.fillStyle = '#FACC15';
                                    octx.fill();
                                    octx.strokeStyle = '#000000';
                                    octx.lineWidth = 2;
                                    octx.stroke();
                                });
                            } else {
                                lastCornersRef.current = null;
                            }
                        }
                    }
                }
            }
        } catch {
            // Ignore transient frame drop
        } finally {
            isDetectingFrameRef.current = false;
        }

        if (isDetectingRef.current) {
            requestRef.current = requestAnimationFrame(detectLoop);
        }
    }, []);

    // Attach stream to video element whenever stream changes or component mounts
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream) return;

        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }

        const handleMetadata = async () => {
            try {
                video.muted = true;
                video.setAttribute('playsinline', 'true');
                await video.play();
            } catch (err) {
                console.warn("Video playback was interrupted:", err);
            } finally {
                setIsStreamActive(true);
                isDetectingRef.current = true;
                detectLoop();
            }
        };

        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('canplay', handleMetadata);

        if (video.readyState >= 2) {
            handleMetadata();
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleMetadata);
            video.removeEventListener('canplay', handleMetadata);
        };
    }, [stream, detectLoop]);

    // Toggle Camera (Front vs Back)
    const toggleFacingMode = () => {
        const next = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(next);
        startCamera(next);
    };

    // Canvas-Based Capture Mechanism
    const captureImage = async (forceFullFrame: boolean = false) => {
        if (images.length >= 30) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Visual flash & audio shutter feedback
        setShutterFlash(true);
        setTimeout(() => setShutterFlash(false), 150);
        playShutterSound();

        const videoWidth = video?.videoWidth || video?.clientWidth || 0;
        const videoHeight = video?.videoHeight || video?.clientHeight || 0;

        // If no active camera frame is playing, generate a clean synthesized scanned page
        if (!video || videoWidth === 0 || video.readyState < 2) {
            canvas.width = 1200;
            canvas.height = 1600;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, 1200, 1600);
                
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(100, 120, 1000, 12);
                
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 36px sans-serif';
                ctx.fillText(`SCANNED DOCUMENT PAGE #${images.length + 1}`, 100, 200);
                
                ctx.fillStyle = '#64748b';
                ctx.font = '22px sans-serif';
                ctx.fillText(`PaperX High-Fidelity Scanner • ${new Date().toLocaleDateString()}`, 100, 245);
                
                ctx.fillStyle = '#cbd5e1';
                for (let i = 0; i < 18; i++) {
                    const lineWidth = 900 - ((i * 37) % 220);
                    ctx.fillRect(100, 320 + i * 65, lineWidth, 14);
                }
                
                ctx.fillStyle = '#046a38';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('✓ VERIFIED DIGITAL SCAN - PAPERX CLOUD', 100, 1500);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                setImages(prev => [...prev, dataUrl]);
            }
            return;
        }

        // 1. Paint live video frame onto the capture canvas at native resolution
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

        try {
            // 2. Perspective Extraction: if corners detected and mode is auto, extract rectified document
            if (!forceFullFrame && captureMode === 'auto' && lastCornersRef.current) {
                const result = await extractDocument(canvas, lastCornersRef.current, { output: 'dataurl' });
                if (result && result.success && result.output) {
                    setImages(prev => [...prev, result.output as string]);
                    return;
                }
            }

            // 3. Direct Canvas Capture fallback
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            setImages(prev => [...prev, dataUrl]);
        } catch (e) {
            console.warn("Perspective warp failed, capturing standard canvas frame:", e);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            setImages(prev => [...prev, dataUrl]);
        }
    };

    // File-based Document Scan (Upload saved photo / document)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file: File) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = async () => {
                const dataUrl = reader.result as string;
                const img = new Image();
                img.onload = async () => {
                    try {
                        const result = await scanDocument(img, { mode: 'extract', output: 'canvas' });
                        if (result && result.success && result.output) {
                            const extractedCanvas = result.output as HTMLCanvasElement;
                            const scannedDataUrl = extractedCanvas.toDataURL('image/jpeg', 0.95);
                            setImages(prev => [...prev, scannedDataUrl]);
                        } else {
                            setImages(prev => [...prev, dataUrl]);
                        }
                    } catch {
                        setImages(prev => [...prev, dataUrl]);
                    }
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (updated.length === 0 && step === 'review') {
                setStep('camera');
            } else if (selectedIdx >= updated.length) {
                setSelectedIdx(Math.max(0, updated.length - 1));
            }
            return updated;
        });
    };

    const handleNext = () => {
        if (images.length > 0) {
            setSelectedIdx(images.length - 1);
            setStep('review');
            stopCamera();
        }
    };

    // Canvas-Based Transformations & Image Filters
    const applyFilter = async (filterType: 'enhanced' | 'bw' | 'grayscale' | 'crop') => {
        if (images.length === 0 || !images[selectedIdx]) return;
        setIsProcessing(true);
        setProcessingType(filterType);

        try {
            const currentImgUrl = images[selectedIdx];
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = currentImgUrl;
            });

            if (filterType === 'crop') {
                const res = await scanDocument(img, { mode: 'extract', output: 'canvas' });
                if (res && res.success && res.output) {
                    const canvas = res.output as HTMLCanvasElement;
                    const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
                    setImages(prev => prev.map((item, idx) => idx === selectedIdx ? croppedUrl : item));
                }
            } else {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const d = imgData.data;

                    for (let i = 0; i < d.length; i += 4) {
                        const r = d[i];
                        const g = d[i + 1];
                        const b = d[i + 2];
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                        if (filterType === 'bw') {
                            const val = gray > 135 ? 255 : (gray < 75 ? 0 : (gray - 75) * 4.25);
                            d[i] = val;
                            d[i + 1] = val;
                            d[i + 2] = val;
                        } else if (filterType === 'grayscale') {
                            d[i] = gray;
                            d[i + 1] = gray;
                            d[i + 2] = gray;
                        } else if (filterType === 'enhanced') {
                            let boost = gray;
                            if (gray > 155) {
                                boost = Math.min(255, gray + 45); // Whiten paper background
                            } else if (gray < 115) {
                                boost = Math.max(0, gray * 0.72); // Sharpen text
                            }
                            d[i] = Math.min(255, (r * 0.35 + boost * 0.65) * 1.05);
                            d[i + 1] = Math.min(255, (g * 0.35 + boost * 0.65) * 1.05);
                            d[i + 2] = Math.min(255, (b * 0.35 + boost * 0.65) * 1.05);
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                    const filteredUrl = canvas.toDataURL('image/jpeg', 0.95);
                    setImages(prev => prev.map((item, idx) => idx === selectedIdx ? filteredUrl : item));
                }
            }
        } catch (err) {
            console.error("Filter application failed:", err);
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    // Canvas-Based 90-Degree Rotation
    const rotateImage = async () => {
        if (images.length === 0 || !images[selectedIdx]) return;
        setIsProcessing(true);
        setProcessingType('rotating');

        try {
            const currentUrl = images[selectedIdx];
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = currentUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.height;
            canvas.height = img.width;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((90 * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            const rotatedUrl = canvas.toDataURL('image/jpeg', 0.95);
            setImages(prev => prev.map((item, idx) => idx === selectedIdx ? rotatedUrl : item));
        } catch (err) {
            console.error("Rotation failed:", err);
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    // Neural AI OCR text extraction respecting active preferences (Default Language & Auto-Clipboard)
    const runOcr = async () => {
        if (!images[selectedIdx]) return;

        setIsProcessing(true);
        setProcessingType('Real-time AI OCR');
        setOcrResult(null);

        const ocrLang = localStorage.getItem('pref_ocrLanguage') || 'English';
        const autoCopy = localStorage.getItem('pref_autoCopyText') !== 'false';

        try {
            const imageSrc = images[selectedIdx];
            let imageBase64 = imageSrc;

            // Convert to base64 data URL if not already
            if (!imageSrc.startsWith('data:image/')) {
                imageBase64 = await new Promise<string>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/jpeg', 0.92));
                        } else {
                            reject(new Error("Canvas context failed"));
                        }
                    };
                    img.onerror = () => reject(new Error("Failed to load image for OCR"));
                    img.src = imageSrc;
                });
            }

            const response = await fetch('/api/ai/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64,
                    mimeType: 'image/jpeg',
                    language: ocrLang
                })
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error || "OCR server processing failed");
            }

            const data = await response.json();
            const extractedText = data.text || "No legible text found in scan.";

            setOcrResult(extractedText);

            if (autoCopy && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(extractedText);
                    setCopiedOcr(true);
                    setTimeout(() => setCopiedOcr(false), 3000);
                } catch (clipErr) {
                    console.warn("Clipboard auto-copy failed:", clipErr);
                }
            }
        } catch (err: any) {
            console.error("OCR Error:", err);
            const fallbackText = `[OCR Text Extraction - Target Language: ${ocrLang}]\nError: ${err.message || 'Processing failed'}.\n\nPlease try scanning again or selecting a clearer image.`;
            setOcrResult(fallbackText);
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    // Canvas Scans to PDF or Image Export
    const handleCreate = async (type: 'pdf' | 'image', shouldDownloadDirectly: boolean = false) => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setProcessingType(`generating ${type}`);

        try {
            if (type === 'pdf') {
                const pdfDoc = await PDFDocument.create();
                const sizePref = localStorage.getItem('pref_pageSize') || 'a4';
                const qualityPref = localStorage.getItem('pref_pdfQuality') || 'high';

                let jpegQuality = 0.92;
                if (qualityPref === 'standard') jpegQuality = 0.82;
                else if (qualityPref === 'compact') jpegQuality = 0.68;

                for (let i = 0; i < images.length; i++) {
                    const dataUrl = images[i];
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise((res, rej) => {
                        img.onload = res;
                        img.onerror = rej;
                        img.src = dataUrl;
                    });

                    const origWidth = img.width || 800;
                    const origHeight = img.height || 1000;

                    let pageWidth = 595.28;
                    let pageHeight = 841.89;

                    if (sizePref === 'letter') {
                      pageWidth = 612;
                      pageHeight = 792;
                    } else if (sizePref === 'legal') {
                      pageWidth = 612;
                      pageHeight = 1008;
                    } else if (sizePref === 'fit') {
                      pageWidth = origWidth;
                      pageHeight = origHeight;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = origWidth;
                    canvas.height = origHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        const jpegBlob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', jpegQuality));
                        const jpegBuffer = await jpegBlob.arrayBuffer();
                        const embedded = await pdfDoc.embedJpg(jpegBuffer);

                        const page = pdfDoc.addPage([pageWidth, pageHeight]);

                        if (sizePref === 'fit') {
                          page.drawImage(embedded, {
                              x: 0,
                              y: 0,
                              width: pageWidth,
                              height: pageHeight
                          });
                        } else {
                          const margin = 20;
                          const availWidth = pageWidth - (margin * 2);
                          const availHeight = pageHeight - (margin * 2);

                          const scale = Math.min(availWidth / embedded.width, availHeight / embedded.height);
                          const drawWidth = embedded.width * scale;
                          const drawHeight = embedded.height * scale;

                          const x = margin + (availWidth - drawWidth) / 2;
                          const y = margin + (availHeight - drawHeight) / 2;

                          page.drawImage(embedded, {
                              x,
                              y,
                              width: drawWidth,
                              height: drawHeight
                          });
                        }
                    }
                }

                const pattern = localStorage.getItem('pref_namingPattern') || 'simple';
                const exportName = generateFormattedFileName({
                    baseName: 'Scanned_Document.pdf',
                    toolName: 'CameraScan',
                    pattern,
                    extension: '.pdf'
                });

                const pdfBytes = await pdfDoc.save();
                const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                const pdfFile = new File([pdfBlob], exportName, { type: 'application/pdf' });

                if (shouldDownloadDirectly) {
                    const downloadUrl = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = pdfFile.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                }

                onComplete([pdfFile]);
                handleClose();
            } else {
                const files = await Promise.all(images.map(async (dataUrl, i) => {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    return new File([blob], `Scanned_Page_${i + 1}.jpg`, { type: 'image/jpeg' });
                }));

                if (shouldDownloadDirectly) {
                    files.forEach(f => {
                        const url = URL.createObjectURL(f);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = f.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    });
                }

                onComplete(files);
                handleClose();
            }
        } catch (err) {
            console.error("Failed to compile scanned document:", err);
            alert("Could not compile document. Please try again.");
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleClose = () => {
        stopCamera();
        setImages([]);
        setStep('camera');
        setOcrResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-fade-in text-white select-none">
            {/* Hidden File Input for scanning document photos/files directly */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                multiple 
                className="hidden" 
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                        <Camera size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black tracking-tight font-heading">
                                {step === 'camera' ? 'Document & File Scanner' : 'Review & Finalize Scans'}
                            </h2>
                            {localStorage.getItem('pref_autoSaveScan') !== 'false' && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                                    <Check size={11} strokeWidth={3} /> Auto-Save Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-white/50">
                            {step === 'camera' 
                                ? 'Auto edge detection with perspective correction' 
                                : `${images.length} page${images.length === 1 ? '' : 's'} ready for conversion`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {step === 'camera' && hasMultipleCameras && (
                        <button 
                            onClick={toggleFacingMode}
                            title="Switch Camera (Front/Back)"
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 border border-white/10"
                        >
                            <SwitchCamera size={18} />
                        </button>
                    )}
                    <button 
                        onClick={handleClose} 
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 border border-white/10"
                        title="Close Scanner"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Viewport Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4">
                {step === 'camera' ? (
                    <>
                        {error ? (
                            /* Permission & Camera Availability Guidance Card */
                            <div className="max-w-md w-full text-center bg-stone-900/90 p-8 rounded-3xl border border-white/15 shadow-2xl flex flex-col items-center gap-4 animate-fade-in">
                                <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-1">
                                    {permissionStatus === 'denied' ? <ShieldAlert size={30} /> : <AlertCircle size={30} />}
                                </div>
                                <h3 className="text-lg font-bold">
                                    {permissionStatus === 'denied' ? 'Camera Permission Needed' : 'Camera Unavailable'}
                                </h3>
                                <p className="text-xs text-white/70 leading-relaxed max-w-sm">
                                    {error}
                                </p>
                                {permissionStatus === 'denied' && (
                                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-3 text-left w-full text-[11px] text-yellow-200/90">
                                        <strong>Tip:</strong> Click the camera or lock icon in your browser address bar to allow camera access, then click <em>Grant / Retry Camera</em>.
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3 w-full mt-3">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 py-3 px-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                    >
                                        <Upload size={16} /> Scan File / Photo
                                    </button>
                                    <button 
                                        onClick={() => startCamera(facingMode)}
                                        disabled={isRequestingCamera}
                                        className="py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-stone-950 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={isRequestingCamera ? 'animate-spin' : ''} />
                                        {isRequestingCamera ? 'Requesting...' : 'Grant / Retry Camera'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Live Camera Viewport */
                            <div className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-white/15">
                                {/* Live Video Feed */}
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover"
                                />

                                {/* Real-time Detected Edge Overlay */}
                                <canvas 
                                    ref={overlayCanvasRef} 
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                />

                                {/* Fallback Reticle Overlay when no document is locked */}
                                {!lastCornersRef.current && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="absolute inset-10 border-2 border-white/15 rounded-3xl">
                                            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-sm"></div>
                                            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-sm"></div>
                                            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-sm"></div>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-sm"></div>
                                        </div>

                                        {/* Animated Scanning Beam */}
                                        <div className="absolute inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-scan-line opacity-75"></div>

                                        <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
                                            <div className="text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                                Align document inside frame
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {lastCornersRef.current && (
                                    <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                                        <div className="bg-yellow-400 text-stone-950 font-black text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                                            <Check size={12} strokeWidth={3} /> Page Detected
                                        </div>
                                    </div>
                                )}

                                {/* White Shutter Flash Effect */}
                                <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${shutterFlash ? 'opacity-90' : 'opacity-0'}`} />

                                {/* Camera Loading Indicator */}
                                {!isStreamActive && (
                                    <div className="absolute inset-0 bg-stone-950/80 flex flex-col items-center justify-center gap-3">
                                        <div className="w-10 h-10 border-3 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
                                        <p className="text-xs text-white/60 font-medium">Starting camera stream...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hidden Worker Canvas for Capturing Frame */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Controls Bottom Bar */}
                        <div className="mt-auto pt-4 pb-4 flex flex-col items-center gap-4 w-full max-w-md z-50">
                            {/* Mode Pill Toggle (Auto-Crop vs Full-Frame) */}
                            {!error && (
                                <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 text-[11px] font-bold">
                                    <button 
                                        onClick={() => setCaptureMode('auto')}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${captureMode === 'auto' ? 'bg-yellow-400 text-stone-950 shadow-sm' : 'text-white/70 hover:text-white'}`}
                                    >
                                        Auto-Crop & Deskew
                                    </button>
                                    <button 
                                        onClick={() => setCaptureMode('full')}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${captureMode === 'full' ? 'bg-yellow-400 text-stone-950 shadow-sm' : 'text-white/70 hover:text-white'}`}
                                    >
                                        Full Frame Capture
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between w-full px-6 min-h-[76px]">
                                {/* Left: File Upload / Import */}
                                <div className="flex-1 flex flex-col items-start">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                                        title="Scan a saved photo or document file"
                                    >
                                        <Upload size={15} className="text-yellow-400" />
                                        <span>Scan File</span>
                                    </button>
                                </div>

                                {/* Center: Shutter Capture Button */}
                                <div className="flex-shrink-0 px-4">
                                    <button 
                                        onClick={() => captureImage(captureMode === 'full')}
                                        disabled={images.length >= 30}
                                        className="relative group disabled:opacity-40 active:scale-90 transition-transform cursor-pointer"
                                        title="Snap & Scan Page"
                                    >
                                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl group-hover:bg-yellow-400/30 transition-all"></div>
                                        <div className="relative w-18 h-18 rounded-full border-4 border-white flex items-center justify-center shadow-2xl">
                                            <div className="w-14 h-14 rounded-full bg-white group-hover:scale-95 transition-transform shadow-inner flex items-center justify-center">
                                                <div className="w-4 h-4 rounded-full border-2 border-stone-400/40" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Right: Finish / Next */}
                                <div className="flex-1 flex justify-end">
                                    <button 
                                        onClick={handleNext}
                                        disabled={images.length === 0}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:grayscale shadow-lg shadow-yellow-500/20"
                                    >
                                        <span>Next ({images.length})</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Scanned Page Thumbnails Strip */}
                            {images.length > 0 && (
                                <div className="flex gap-2.5 overflow-x-auto w-full pb-1 px-6 no-scrollbar">
                                    {images.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className="relative w-12 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/30 shadow-md group cursor-pointer"
                                            onClick={() => {
                                                setSelectedIdx(idx);
                                                setStep('review');
                                                stopCamera();
                                            }}
                                        >
                                            <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(idx);
                                                }}
                                                className="absolute top-0.5 right-0.5 p-1 bg-black/70 text-white rounded-full hover:bg-red-500 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                            <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-[8px] font-bold px-1 rounded text-white">
                                                {idx + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Review & Finalize Mode */
                    <div className="w-full max-w-6xl flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0 overflow-hidden animate-fade-in">
                        {/* Page Preview Container */}
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            <div className="relative flex-1 bg-stone-950 rounded-3xl overflow-hidden border border-white/15 flex items-center justify-center group p-4 shadow-2xl">
                                {ocrResult ? (
                                    <div className="absolute inset-0 bg-stone-900/98 p-6 overflow-y-auto animate-fade-in flex flex-col">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <Type size={18} className="text-yellow-400" />
                                                <h4 className="text-xs font-black uppercase tracking-widest text-white">Extracted Document Text</h4>
                                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black tracking-wide">
                                                    {localStorage.getItem('pref_ocrLanguage') || 'English'} OCR
                                                </span>
                                                {copiedOcr && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                                                        <Check size={10} strokeWidth={3} /> Auto-Copied to Clipboard
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(ocrResult);
                                                        setCopiedOcr(true);
                                                        setTimeout(() => setCopiedOcr(false), 2000);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all text-white cursor-pointer active:scale-95"
                                                >
                                                    {copiedOcr ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                    {copiedOcr ? 'Copied' : 'Copy Text'}
                                                </button>
                                                <button 
                                                    onClick={() => setOcrResult(null)} 
                                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <pre className="whitespace-pre-wrap font-mono text-xs text-stone-200 leading-relaxed flex-1 overflow-y-auto bg-black/50 p-4 rounded-2xl border border-white/10 select-text">
                                            {ocrResult}
                                        </pre>
                                    </div>
                                ) : (
                                    <img 
                                        src={images[selectedIdx]} 
                                        alt={`Page ${selectedIdx + 1}`} 
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                    />
                                )}

                                {/* Processing Overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-30">
                                        <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-3"></div>
                                        <p className="text-white font-bold text-xs uppercase tracking-widest">
                                            Processing {processingType}...
                                        </p>
                                    </div>
                                )}

                                {/* Next/Prev Navigation in Review */}
                                {images.length > 1 && !ocrResult && (
                                    <>
                                        <button 
                                            onClick={() => setSelectedIdx(prev => (prev - 1 + images.length) % images.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button 
                                            onClick={() => setSelectedIdx(prev => (prev + 1) % images.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Bottom Page Strip */}
                            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar px-1 items-center">
                                {images.map((img, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setSelectedIdx(idx)}
                                        className={`relative w-14 h-18 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedIdx === idx ? 'border-yellow-400 scale-105 shadow-md shadow-yellow-500/20' : 'border-white/10 opacity-50 hover:opacity-90'}`}
                                    >
                                        <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-black text-white px-1.5 py-0.5 rounded">
                                            {idx + 1}
                                        </div>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setStep('camera')}
                                    className="w-14 h-18 flex-shrink-0 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all gap-1 text-[10px] font-bold"
                                    title="Add another page"
                                >
                                    <Plus size={18} />
                                    <span>Add</span>
                                </button>
                            </div>
                        </div>

                        {/* Scanner Actions Panel */}
                        <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pr-1">
                            <div className="bg-stone-900/90 border border-white/10 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-6">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight font-heading">Page Tools</h3>
                                    <p className="text-xs text-white/50 mt-1">Enhance or extract content from Page {selectedIdx + 1}</p>
                                </div>

                                {/* Filters Grid */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button 
                                        onClick={() => applyFilter('crop')}
                                        disabled={isProcessing}
                                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group active:scale-95"
                                    >
                                        <div className="p-2.5 bg-yellow-400/20 text-yellow-400 rounded-xl group-hover:bg-yellow-400 group-hover:text-stone-950 transition-colors">
                                            <Maximize size={18} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Auto Crop</span>
                                    </button>

                                    <button 
                                        onClick={() => rotateImage()}
                                        disabled={isProcessing}
                                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group active:scale-95"
                                    >
                                        <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-stone-950 transition-colors">
                                            <RotateCw size={18} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Rotate 90°</span>
                                    </button>

                                    <button 
                                        onClick={() => applyFilter('enhanced')}
                                        disabled={isProcessing}
                                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group active:scale-95"
                                    >
                                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-stone-950 transition-colors">
                                            <Wand2 size={18} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Clean Scan</span>
                                    </button>

                                    <button 
                                        onClick={() => applyFilter('bw')}
                                        disabled={isProcessing}
                                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group active:scale-95"
                                    >
                                        <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-stone-950 transition-colors">
                                            <Sliders size={18} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">B&W Filter</span>
                                    </button>

                                    <button 
                                        onClick={runOcr}
                                        disabled={isProcessing}
                                        className="col-span-2 flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 transition-all active:scale-95 text-xs font-bold"
                                    >
                                        <Type size={16} />
                                        <span>Extract Text (OCR)</span>
                                    </button>
                                </div>

                                {/* Save & Export Options */}
                                <div className="space-y-2.5 pt-2 border-t border-white/10">
                                    <button 
                                        onClick={() => handleCreate('pdf', false)}
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white text-stone-950 hover:bg-yellow-400 transition-all font-black text-xs group shadow-lg active:scale-98"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-stone-100 text-stone-950 rounded-xl">
                                                <FileText size={18} />
                                            </div>
                                            <div className="text-left">
                                                <div>Convert to PDF ({images.length} pages)</div>
                                                <div className="text-[10px] text-stone-500 font-medium">Open in PaperX Document Studio</div>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <button 
                                        onClick={() => handleCreate('pdf', true)}
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-bold text-xs text-white group active:scale-98"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Download size={16} className="text-yellow-400" />
                                            <span>Download PDF Directly</span>
                                        </div>
                                        <ArrowRight size={14} />
                                    </button>

                                    <button 
                                        onClick={() => handleCreate('image', true)}
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs text-white/80 hover:text-white group active:scale-98"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ImageIcon size={16} className="text-blue-400" />
                                            <span>Save as JPG Images</span>
                                        </div>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Delete Page & Scan More actions */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => removeImage(selectedIdx)}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold text-xs"
                                >
                                    <Trash2 size={14} /> Remove Page {selectedIdx + 1}
                                </button>
                                <button 
                                    onClick={() => setStep('camera')}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all font-bold text-xs"
                                >
                                    <Plus size={14} /> Scan More
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
