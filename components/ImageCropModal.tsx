import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, RotateCw, Crop as CropIcon, Check, RefreshCw, Undo2, Sparkles, AlertTriangle } from 'lucide-react';

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  originalFile?: File;
  isAlreadyCropped?: boolean;
  initialCrop?: CropBox;
  currentRotation: number;
  onSaveCrop: (
    croppedFile: File, 
    newRotation: number, 
    cropBox?: CropBox,
    isOriginalRestored?: boolean
  ) => void;
  onRevertToOriginal?: () => void;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  originalFile,
  isAlreadyCropped = false,
  initialCrop,
  currentRotation,
  onSaveCrop,
  onRevertToOriginal
}) => {
  // Use original master file as the pristine editing source
  const sourceFile = originalFile || imageFile;

  const [rotation, setRotation] = useState<number>(currentRotation || 0);
  const [aspectRatio, setAspectRatio] = useState<string>(initialCrop ? 'free' : (isAlreadyCropped ? 'free' : 'free'));
  const [zoom, setZoom] = useState<number>(1);
  const [crop, setCrop] = useState<CropBox>(() => {
    if (initialCrop) return initialCrop;
    return { x: 10, y: 10, width: 80, height: 80 };
  });

  const [imageSrc, setImageSrc] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dragging & Resizing tracking refs
  const dragModeRef = useRef<DragMode>(null);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const startCropRef = useRef<CropBox>({ x: 10, y: 10, width: 80, height: 80 });

  useEffect(() => {
    if (sourceFile) {
      const url = URL.createObjectURL(sourceFile);
      setImageSrc(url);
      setRotation(currentRotation || 0);
      if (initialCrop) {
        setCrop(initialCrop);
      } else {
        setCrop({ x: 10, y: 10, width: 80, height: 80 });
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [sourceFile, currentRotation, initialCrop]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 2500);
  };

  if (!isOpen || !sourceFile) return null;

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => {
      const change = direction === 'right' ? 90 : -90;
      let next = (prev + change) % 360;
      if (next < 0) next += 360;
      return next;
    });
  };

  // Revert Crop to 100% full original dimensions
  const handleRevertOriginal = () => {
    setRotation(0);
    setZoom(1);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setAspectRatio('original');
    showNotice('Crop box expanded to 100% full original photo');
  };

  // Direct 1-click restore to original master file - trigger confirmation dialog
  const handleDirectRevertOriginal = () => {
    setShowRestoreConfirm(true);
  };

  // Confirmed execution of restore original photo
  const handleExecuteRestoreOriginal = () => {
    setShowRestoreConfirm(false);
    showNotice('Restored original pristine photo');
    if (onRevertToOriginal) {
      onRevertToOriginal();
      onClose();
    } else {
      onSaveCrop(sourceFile, 0, undefined, true);
      onClose();
    }
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
    setAspectRatio('free');
  };

  // Drag & Resize Handlers (Mouse & Touch)
  const startDrag = (e: React.MouseEvent | React.TouchEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragModeRef.current = mode;
    dragStartPosRef.current = { clientX, clientY };
    startCropRef.current = { ...crop };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!dragModeRef.current || !containerRef.current) return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaXPercent = ((clientX - dragStartPosRef.current.clientX) / rect.width) * 100;
    const deltaYPercent = ((clientY - dragStartPosRef.current.clientY) / rect.height) * 100;

    const base = startCropRef.current;
    const mode = dragModeRef.current;

    if (mode === 'move') {
      const newX = Math.max(0, Math.min(100 - base.width, base.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - base.height, base.y + deltaYPercent));
      setCrop({
        ...base,
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10
      });
    } else if (mode === 'nw') {
      const newX = Math.max(0, Math.min(base.x + base.width - 10, base.x + deltaXPercent));
      const newY = Math.max(0, Math.min(base.y + base.height - 10, base.y + deltaYPercent));
      const newW = base.width - (newX - base.x);
      const newH = base.height - (newY - base.y);
      setCrop({
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10
      });
    } else if (mode === 'ne') {
      const newY = Math.max(0, Math.min(base.y + base.height - 10, base.y + deltaYPercent));
      const newW = Math.max(10, Math.min(100 - base.x, base.width + deltaXPercent));
      const newH = base.height - (newY - base.y);
      setCrop({
        x: base.x,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10
      });
    } else if (mode === 'sw') {
      const newX = Math.max(0, Math.min(base.x + base.width - 10, base.x + deltaXPercent));
      const newW = base.width - (newX - base.x);
      const newH = Math.max(10, Math.min(100 - base.y, base.height + deltaYPercent));
      setCrop({
        x: Math.round(newX * 10) / 10,
        y: base.y,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10
      });
    } else if (mode === 'se') {
      const newW = Math.max(10, Math.min(100 - base.x, base.width + deltaXPercent));
      const newH = Math.max(10, Math.min(100 - base.y, base.height + deltaYPercent));
      setCrop({
        x: base.x,
        y: base.y,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10
      });
    }
  };

  const handlePointerUp = () => {
    dragModeRef.current = null;
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUp);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
  };

  const applyCropAndSave = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      // Check if full original photo is requested (>=96% crop coverage)
      const isFullPhoto = 
        crop.x <= 2 && 
        crop.y <= 2 && 
        crop.width >= 96 && 
        crop.height >= 96;

      if (isFullPhoto) {
        // Pristine zero-loss restoration of original file
        onSaveCrop(sourceFile, rotation, undefined, true);
        onClose();
        return;
      }

      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      const rad = (rotation * Math.PI) / 180;
      const isRotated90 = rotation === 90 || rotation === 270;
      
      const origWidth = img.naturalWidth || 1200;
      const origHeight = img.naturalHeight || 800;

      // Render rotated source image to intermediate canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = isRotated90 ? origHeight : origWidth;
      tempCanvas.height = isRotated90 ? origWidth : origHeight;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) throw new Error('Temp canvas failed');

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate(rad);
      tempCtx.drawImage(img, -origWidth / 2, -origHeight / 2);

      // Slice out cropped box percentage from high-res buffer
      const cropPixelX = Math.round((crop.x / 100) * tempCanvas.width);
      const cropPixelY = Math.round((crop.y / 100) * tempCanvas.height);
      const cropPixelW = Math.round((crop.width / 100) * tempCanvas.width);
      const cropPixelH = Math.round((crop.height / 100) * tempCanvas.height);

      canvas.width = Math.max(10, cropPixelW);
      canvas.height = Math.max(10, cropPixelH);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        tempCanvas,
        cropPixelX,
        cropPixelY,
        cropPixelW,
        cropPixelH,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const mimeType = sourceFile.type && sourceFile.type.startsWith('image/') 
        ? sourceFile.type 
        : 'image/jpeg';

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], sourceFile.name, {
            type: mimeType,
            lastModified: Date.now()
          });
          onSaveCrop(croppedFile, 0, crop, false);
          onClose();
        } else {
          showNotice('Error saving cropped image');
          setIsProcessing(false);
        }
      }, mimeType, 0.95);
    } catch (err) {
      console.error('Crop processing failed:', err);
      setIsProcessing(false);
      showNotice('Crop processing failed');
    }
  };

  const isCurrentCropFullOriginal = 
    crop.x <= 2 && 
    crop.y <= 2 && 
    crop.width >= 96 && 
    crop.height >= 96;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <CropIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 dark:text-white text-sm truncate">Crop & Adjust Image</h3>
                {isAlreadyCropped && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Cropped
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 truncate">{sourceFile.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-xl cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-3 sm:px-4 py-2 bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-stone-500 text-[11px]">Aspect Ratio:</span>
            {['free', 'original', '1:1', '4:3', '16:9', '3:4'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => {
                  setAspectRatio(ratio);
                  if (ratio === 'original') handleRevertOriginal();
                  if (ratio === '1:1') setCrop({ x: 15, y: 15, width: 70, height: 70 });
                  if (ratio === '4:3') setCrop({ x: 10, y: 20, width: 80, height: 60 });
                  if (ratio === '16:9') setCrop({ x: 5, y: 25, width: 90, height: 50 });
                  if (ratio === '3:4') setCrop({ x: 20, y: 10, width: 60, height: 80 });
                  if (ratio === 'free') setCrop({ x: 10, y: 10, width: 80, height: 80 });
                }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                  aspectRatio === ratio
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                }`}
              >
                {ratio === 'original' ? 'ORIGINAL (100%)' : ratio.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Revert Original Size Button */}
            <button
              onClick={handleRevertOriginal}
              className={`px-2.5 py-1.5 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer text-[11px] ${
                isCurrentCropFullOriginal 
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
              title="Expand Crop to Full 100% Original Photo"
            >
              <RotateCcw size={13} />
              <span>Revert Original Size</span>
            </button>

            {/* Direct Revert Photo Button if previously cropped */}
            {isAlreadyCropped && (
              <button
                onClick={handleDirectRevertOriginal}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer text-[11px] shadow-xs active:scale-95"
                title="Immediately restore pristine original uncropped photo"
              >
                <Undo2 size={13} />
                <span>Restore Original Photo</span>
              </button>
            )}

            <button
              onClick={() => handleRotate('left')}
              className="p-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
              title="Rotate Left 90°"
            >
              <RotateCcw size={13} />
              <span>-90°</span>
            </button>
            <button
              onClick={() => handleRotate('right')}
              className="p-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
              title="Rotate Right 90°"
            >
              <RotateCw size={13} />
              <span>+90°</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-600 dark:text-stone-400 rounded-lg cursor-pointer"
              title="Reset Adjustments"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Notice feedback banner */}
        {actionNotice && (
          <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/20 px-4 py-1.5 text-center text-xs font-bold animate-in fade-in duration-150">
            {actionNotice}
          </div>
        )}

        {/* Editor Area with Tight Image Frame */}
        <div className="p-4 sm:p-6 flex-1 bg-stone-950 flex items-center justify-center overflow-hidden relative min-h-[300px] select-none">
          <div 
            ref={containerRef}
            className="relative inline-block max-w-full max-h-[460px] shadow-2xl"
          >
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="To Crop"
                className="max-h-[430px] max-w-full object-contain block transition-transform duration-150 select-none pointer-events-none"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`
                }}
                draggable={false}
              />
            )}

            {/* Dark Dimmer Backdrop Outside Crop Area */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Top Dim */}
              <div 
                className="absolute bg-black/55 backdrop-blur-[0.5px]" 
                style={{ top: 0, left: 0, right: 0, height: `${crop.y}%` }} 
              />
              {/* Bottom Dim */}
              <div 
                className="absolute bg-black/55 backdrop-blur-[0.5px]" 
                style={{ top: `${crop.y + crop.height}%`, left: 0, right: 0, bottom: 0 }} 
              />
              {/* Left Dim */}
              <div 
                className="absolute bg-black/55 backdrop-blur-[0.5px]" 
                style={{ top: `${crop.y}%`, left: 0, width: `${crop.x}%`, height: `${crop.height}%` }} 
              />
              {/* Right Dim */}
              <div 
                className="absolute bg-black/55 backdrop-blur-[0.5px]" 
                style={{ top: `${crop.y}%`, left: `${crop.x + crop.width}%`, right: 0, height: `${crop.height}%` }} 
              />
            </div>

            {/* Interactive Bounding Box Crop Overlay */}
            <div
              onMouseDown={(e) => startDrag(e, 'move')}
              onTouchStart={(e) => startDrag(e, 'move')}
              className="absolute border-2 border-amber-400 bg-amber-500/10 shadow-2xl cursor-move flex items-center justify-center touch-none group"
              style={{
                top: `${crop.y}%`,
                left: `${crop.x}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`
              }}
            >
              {/* Grid Guideline lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-amber-400/20">
                <div className="border-r border-b border-amber-400/25" />
                <div className="border-r border-b border-amber-400/25" />
                <div className="border-b border-amber-400/25" />
                <div className="border-r border-b border-amber-400/25" />
                <div className="border-r border-b border-amber-400/25" />
                <div className="border-b border-amber-400/25" />
                <div className="border-r border-amber-400/25" />
                <div className="border-r border-amber-400/25" />
                <div />
              </div>

              {/* Crop Label */}
              <div className="absolute top-1 left-1 bg-amber-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs pointer-events-none whitespace-nowrap">
                Crop Area ({Math.round(crop.width)}% × {Math.round(crop.height)}%)
              </div>

              {/* 4 Interactive Drag/Resize Corner Handles */}
              <div 
                onMouseDown={(e) => startDrag(e, 'nw')}
                onTouchStart={(e) => startDrag(e, 'nw')}
                className="w-5 h-5 bg-amber-400 border-2 border-black absolute -top-2.5 -left-2.5 rounded-full cursor-nwse-resize shadow-md touch-none hover:scale-125 transition-transform" 
                title="Drag to resize top-left"
              />
              <div 
                onMouseDown={(e) => startDrag(e, 'ne')}
                onTouchStart={(e) => startDrag(e, 'ne')}
                className="w-5 h-5 bg-amber-400 border-2 border-black absolute -top-2.5 -right-2.5 rounded-full cursor-nesw-resize shadow-md touch-none hover:scale-125 transition-transform" 
                title="Drag to resize top-right"
              />
              <div 
                onMouseDown={(e) => startDrag(e, 'sw')}
                onTouchStart={(e) => startDrag(e, 'sw')}
                className="w-5 h-5 bg-amber-400 border-2 border-black absolute -bottom-2.5 -left-2.5 rounded-full cursor-nesw-resize shadow-md touch-none hover:scale-125 transition-transform" 
                title="Drag to resize bottom-left"
              />
              <div 
                onMouseDown={(e) => startDrag(e, 'se')}
                onTouchStart={(e) => startDrag(e, 'se')}
                className="w-5 h-5 bg-amber-400 border-2 border-black absolute -bottom-2.5 -right-2.5 rounded-full cursor-nwse-resize shadow-md touch-none hover:scale-125 transition-transform" 
                title="Drag to resize bottom-right"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>
              {isCurrentCropFullOriginal 
                ? 'Full 100% original photo selected' 
                : 'Drag box or corners to crop • Non-destructive'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={applyCropAndSave}
              disabled={isProcessing}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Check size={14} strokeWidth={3} />
              <span>
                {isProcessing 
                  ? 'Saving...' 
                  : isCurrentCropFullOriginal 
                    ? 'Save Full Original' 
                    : 'Apply & Save Page'}
              </span>
            </button>
          </div>
        </div>

        {/* Restore Original Photo Confirmation Modal */}
        {showRestoreConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div 
              className="bg-white dark:bg-[#161b22] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={24} strokeWidth={2.2} />
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="font-heading font-black text-stone-900 dark:text-white text-base tracking-tight">
                  Restore Original Photo?
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  You have custom crop boundaries and adjustments saved on this photo. Restoring will discard your current crop framing and return to the pristine original photo.
                </p>
              </div>

              {/* Photo Card Preview */}
              <div className="bg-stone-50 dark:bg-stone-800/70 rounded-2xl p-3 flex items-center gap-3 border border-stone-200/80 dark:border-stone-700/80">
                {imageSrc && (
                  <img 
                    src={imageSrc} 
                    alt="Original Master" 
                    className="w-14 h-14 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0 bg-stone-900" 
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{sourceFile.name}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                    {(sourceFile.size / 1024).toFixed(0)} KB • Pristine Original
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    <Check size={11} strokeWidth={2.5} /> Master copy protected
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestoreConfirm(false)}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Keep My Edits
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestoreOriginal}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Undo2 size={13} strokeWidth={2.5} />
                  <span>Yes, Restore Photo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
