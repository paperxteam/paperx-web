import React, { useState, useRef, useCallback } from 'react';
import { 
  FileImage, Download, Upload, Plus, Trash2, RotateCw, RotateCcw,
  Layout, Sliders, CheckCircle2, Image as ImageIcon, Loader2,
  Check, ArrowUp, ArrowDown, Copy, Crop as CropIcon, RefreshCw,
  Layers, Maximize2, Palette, ShieldCheck, FileCheck, Eye, X, ExternalLink,
  ChevronDown, AlertTriangle, Undo2
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { Button } from '../Button';
import { 
  CloudStorageModal, 
  CloudProvider, 
  GoogleDriveAnimatedIcon, 
  DropboxAnimatedIcon 
} from '../CloudStorageModal';
import { ImageCropModal } from '../ImageCropModal';

interface JpgToPdfWorkspaceProps {
  onComplete: (blob: Blob, filename: string) => void;
  isProcessing?: boolean;
}

interface UploadedImage {
  id: string;
  file: File;
  originalFile: File;
  originalPreviewUrl: string;
  previewUrl: string;
  rotation: number;
  isCropped?: boolean;
  cropBox?: { x: number; y: number; width: number; height: number };
  naturalWidth?: number;
  naturalHeight?: number;
}

export type PageSizePreset = 'fit' | 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'custom';
export type OrientationOption = 'auto' | 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'medium' | 'large' | 'custom';
export type FittingOption = 'fit' | 'fill' | 'stretch' | 'original' | 'center';
export type BgColorOption = 'white' | 'black' | 'yellow' | 'cream' | 'blue' | 'custom';
export type ImageQualityOption = 'standard' | 'high' | 'maximum';
export type CompressionOption = 'none' | 'balanced' | 'maximum';

// Universal robust image-to-canvas decoder
const imageToCanvas = (
  file: File, 
  rotation: number = 0, 
  bgColor: string = '#ffffff'
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const rad = (rotation * Math.PI) / 180;
      const isRotated90or270 = rotation === 90 || rotation === 270;
      
      canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context initialization failed'));
        return;
      }

      // Pre-fill chosen background color to prevent transparent PNG/WEBP black box artifacts in JPEG
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image file "${file.name}"`));
    };
    img.src = url;
  });
};

export const JpgToPdfWorkspace: React.FC<JpgToPdfWorkspaceProps> = ({ onComplete, isProcessing = false }) => {
  // Image Queue State
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [docTitle, setDocTitle] = useState<string>('Images_Compiled.pdf');

  // Page Setup State
  const [pageSize, setPageSize] = useState<PageSizePreset>('fit');
  const [customWidth, setCustomWidth] = useState<number>(595);
  const [customHeight, setCustomHeight] = useState<number>(842);
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  
  // Margin State
  const [marginOption, setMarginOption] = useState<MarginOption>('none');
  const [customMargin, setCustomMargin] = useState<number>(10);

  // Fitting & Appearance State
  const [fittingOption, setFittingOption] = useState<FittingOption>('fit');
  const [bgColorOption, setBgColorOption] = useState<BgColorOption>('white');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');

  // Quality & Optimization State
  const [imageQuality, setImageQuality] = useState<ImageQualityOption>('high');
  const [pdfCompression, setPdfCompression] = useState<CompressionOption>('balanced');

  // UI & Conversion State
  const [converting, setConverting] = useState<boolean>(false);
  const [convertStatus, setConvertStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  // Modals & Cloud Link State
  const [activeCloudProvider, setActiveCloudProvider] = useState<CloudProvider | null>(null);
  const [cloudUrlInput, setCloudUrlInput] = useState<string>('');
  const [importingCloudLink, setImportingCloudLink] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [cloudModalProvider, setCloudModalProvider] = useState<CloudProvider>('google-drive');
  const [croppingImage, setCroppingImage] = useState<UploadedImage | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIdRef = useRef<string | null>(null);

  // Direct Cloud Image Chooser: Opens Interactive Cloud Storage File Picker Modal
  const openCloudStorage = (provider: CloudProvider) => {
    setCloudModalProvider(provider);
    setIsCloudModalOpen(true);
    setErrorMessage('');
  };

  // Import Cloud File via URL Link
  const handleImportCloudLink = async () => {
    if (!cloudUrlInput.trim()) return;

    setImportingCloudLink(true);
    setErrorMessage('');

    let targetUrl = cloudUrlInput.trim();

    // Transform Google Drive links
    const driveMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || targetUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      targetUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }

    // Transform Dropbox links
    if (targetUrl.includes('dropbox.com')) {
      targetUrl = targetUrl.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
      if (!targetUrl.includes('raw=1')) {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'raw=1';
      }
    }

    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      
      if (!blob.type.startsWith('image/')) {
        throw new Error('Link did not return a valid image file. Make sure the file link is set to "Anyone with link can view".');
      }

      const ext = blob.type.split('/')[1] || 'jpg';
      const file = new File([blob], `Cloud_Import_${Date.now()}.${ext}`, { type: blob.type });

      addFilesToQueue([file]);
      setCloudUrlInput('');
      setImportingCloudLink(false);
    } catch (err: any) {
      // Fallback via Image element loading
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1200;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `Cloud_Import_${Date.now()}.jpg`, { type: 'image/jpeg' });
            addFilesToQueue([file]);
            setCloudUrlInput('');
          } else {
            setErrorMessage('Unable to process image from link.');
          }
          setImportingCloudLink(false);
        }, 'image/jpeg', 0.95);
      };
      img.onerror = () => {
        setErrorMessage('Could not fetch image from link. Please ensure link permissions allow public view or select the downloaded file directly.');
        setImportingCloudLink(false);
      };
      img.src = targetUrl;
    }
  };

  // Read Clipboard Link
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCloudUrlInput(text);
        }
      }
    } catch (_) {}
  };

  // Add Files with Format Validation & Error Handling
  const addFilesToQueue = (files: File[]) => {
    const validImageRegex = /\.(jpg|jpeg|png|webp|avif|heic|heif|gif|svg|bmp)$/i;
    const newImgs: UploadedImage[] = [];
    let failedCount = 0;

    for (const file of files) {
      const isValidMime = file.type.startsWith('image/') || validImageRegex.test(file.name);
      
      if (!isValidMime) {
        failedCount++;
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        setErrorMessage(`Upload Failed: File "${file.name}" exceeds 100MB size limit. Download unavailable.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const newImgId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      newImgs.push({
        id: newImgId,
        file,
        originalFile: file,
        originalPreviewUrl: previewUrl,
        previewUrl,
        rotation: 0,
        isCropped: false
      });

      // Probe natural image dimensions for instant WYSIWYG accuracy
      const probeImg = new Image();
      probeImg.onload = () => {
        setImages(prev => prev.map(item => item.id === newImgId ? {
          ...item,
          naturalWidth: probeImg.naturalWidth,
          naturalHeight: probeImg.naturalHeight
        } : item));
      };
      probeImg.src = previewUrl;
    }

    if (failedCount > 0) {
      setErrorMessage(`Upload Failed: ${failedCount} file(s) had an invalid format. Please select valid images (JPG, PNG, WEBP, AVIF, HEIC, GIF, SVG). Download unavailable for invalid files.`);
    } else if (newImgs.length > 0) {
      setErrorMessage('');
    }

    if (newImgs.length > 0) {
      setImages(prev => [...prev, ...newImgs]);
    }
  };

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    addFilesToQueue(Array.from(e.target.files));
    if (e.target) e.target.value = '';
  };

  const handleCloudFilesImported = (importedFiles: File[]) => {
    addFilesToQueue(importedFiles);
  };

  // Item Transformations
  const handleRotate = (id: string, direction: 'right' | 'left' = 'right') => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      const delta = direction === 'right' ? 90 : -90;
      let nextRot = (img.rotation + delta) % 360;
      if (nextRot < 0) nextRot += 360;
      return { ...img, rotation: nextRot };
    }));
  };

  const handleDelete = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleDuplicate = (imgItem: UploadedImage) => {
    const dup: UploadedImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      file: imgItem.file,
      originalFile: imgItem.originalFile || imgItem.file,
      originalPreviewUrl: imgItem.originalPreviewUrl || imgItem.previewUrl,
      previewUrl: imgItem.previewUrl,
      rotation: imgItem.rotation,
      isCropped: imgItem.isCropped,
      cropBox: imgItem.cropBox
    };
    const index = images.findIndex(i => i.id === imgItem.id);
    setImages(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, dup);
      return next;
    });
  };

  const handleReplaceClick = (id: string) => {
    replaceTargetIdRef.current = id;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = replaceTargetIdRef.current;
    if (!file || !targetId) return;

    const url = URL.createObjectURL(file);
    setImages(prev => prev.map(img => {
      if (img.id !== targetId) return img;
      return {
        ...img,
        file,
        originalFile: file,
        originalPreviewUrl: url,
        previewUrl: url,
        rotation: 0,
        isCropped: false,
        cropBox: undefined
      };
    }));

    if (e.target) e.target.value = '';
    replaceTargetIdRef.current = null;
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Bulk Actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const [photoToRestore, setPhotoToRestore] = useState<UploadedImage | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);

  const removeSelected = () => {
    setImages(prev => prev.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]);
  };

  const clearAll = () => {
    setImages([]);
    setSelectedIds([]);
    setShowClearAllConfirm(false);
  };

  // Crop Saver & Reverter
  const handleSaveCrop = (
    croppedFile: File, 
    newRotation: number, 
    cropBox?: { x: number; y: number; width: number; height: number },
    isOriginalRestored?: boolean
  ) => {
    if (!croppingImage) return;
    const targetId = croppingImage.id;
    setImages(prev => prev.map(img => {
      if (img.id !== targetId) return img;
      if (isOriginalRestored) {
        const orig = img.originalFile || img.file;
        const freshUrl = URL.createObjectURL(orig);
        return {
          ...img,
          file: orig,
          originalFile: orig,
          previewUrl: freshUrl,
          originalPreviewUrl: freshUrl,
          rotation: newRotation,
          isCropped: false,
          cropBox: undefined
        };
      }
      const freshCroppedUrl = URL.createObjectURL(croppedFile);
      return {
        ...img,
        file: croppedFile,
        previewUrl: freshCroppedUrl,
        rotation: newRotation,
        isCropped: true,
        cropBox
      };
    }));
    setCroppingImage(null);
  };

  const handleRevertToOriginal = (id: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      const orig = img.originalFile || img.file;
      // Revoke temporary preview URL if different from original
      if (img.previewUrl && img.previewUrl !== img.originalPreviewUrl) {
        try { URL.revokeObjectURL(img.previewUrl); } catch (_) {}
      }
      const freshUrl = URL.createObjectURL(orig);
      return {
        ...img,
        file: orig,
        originalFile: orig,
        previewUrl: freshUrl,
        originalPreviewUrl: freshUrl,
        rotation: 0,
        isCropped: false,
        cropBox: undefined
      };
    }));
    setCroppingImage(null);
  };

  // Calculate Page Dimensions (in points: 1 point = 1/72 inch)
  const getPageDimensions = (imgW: number, imgH: number): { width: number; height: number } => {
    let w = 595.28;
    let h = 841.89;

    switch (pageSize) {
      case 'A4': 
        w = 595.28; h = 841.89; // 210 x 297 mm
        break;
      case 'A3': 
        w = 841.89; h = 1190.55; // 297 x 420 mm
        break;
      case 'A5': 
        w = 419.53; h = 595.28; // 148 x 210 mm
        break;
      case 'Letter': 
        w = 612.0; h = 792.0; // 8.5 x 11 in
        break;
      case 'Legal': 
        w = 612.0; h = 1008.0; // 8.5 x 14 in
        break;
      case 'custom': 
        w = Math.max(50, customWidth); 
        h = Math.max(50, customHeight); 
        break;
      case 'fit':
      default: {
        // Fits page bounds to exact image aspect ratio / dimensions
        let baseW = imgW || 595.28;
        let baseH = imgH || 841.89;
        const maxBound = 841.89;
        const scale = Math.min(1, maxBound / Math.max(baseW, baseH));
        w = Math.max(50, Math.round(baseW * scale));
        h = Math.max(50, Math.round(baseH * scale));
        break;
      }
    }

    if (orientation === 'landscape') {
      return { width: Math.max(w, h), height: Math.min(w, h) };
    } else if (orientation === 'portrait') {
      return { width: Math.min(w, h), height: Math.max(w, h) };
    } else {
      // Auto (Match Image Orientation)
      if (imgW > imgH) {
        return { width: Math.max(w, h), height: Math.min(w, h) };
      } else {
        return { width: Math.min(w, h), height: Math.max(w, h) };
      }
    }
  };

  // Margin Value in Points (1 mm = ~2.835 points)
  const getMarginPoints = (): number => {
    switch (marginOption) {
      case 'none': return 0;
      case 'small': return 14.17; // 5 mm
      case 'medium': return 28.35; // 10 mm
      case 'large': return 56.70; // 20 mm
      case 'custom': return Math.max(0, customMargin);
    }
  };

  // Real Color Hex Resolver
  const getSheetBgColor = (): string => {
    if (bgColorOption === 'black') return '#000000';
    if (bgColorOption === 'yellow') return '#ffff00';
    if (bgColorOption === 'cream') return '#fef9c3';
    if (bgColorOption === 'blue') return '#e0f2fe';
    if (bgColorOption === 'custom') {
      const clean = (customBgColor || '').trim();
      return clean.startsWith('#') ? clean : `#${clean}`;
    }
    return '#ffffff';
  };

  // Color RGB Parser for pdf-lib (Proper NaN check so 0-value channels like Yellow #FFFF00 are not overridden)
  const getPdfColor = () => {
    const hexColor = getSheetBgColor();
    let clean = (hexColor || '').replace(/^#/, '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length >= 6) {
      const rInt = parseInt(clean.substring(0, 2), 16);
      const gInt = parseInt(clean.substring(2, 4), 16);
      const bInt = parseInt(clean.substring(4, 6), 16);
      const r = Number.isNaN(rInt) ? 1 : Math.max(0, Math.min(1, rInt / 255));
      const g = Number.isNaN(gInt) ? 1 : Math.max(0, Math.min(1, gInt / 255));
      const b = Number.isNaN(bInt) ? 1 : Math.max(0, Math.min(1, bInt / 255));
      return rgb(r, g, b);
    }
    return rgb(1, 1, 1); // white
  };

  // Convert PDF Function
  const handleConvert = async () => {
    if (images.length === 0) {
      setErrorMessage('Please add at least one image to convert.');
      return;
    }

    setConverting(true);
    setErrorMessage('');
    setConvertStatus('Initializing PDF compilation...');

    try {
      const pdfDoc = await PDFDocument.create();
      const margin = getMarginPoints();
      const pdfBg = getPdfColor();
      const sheetBg = getSheetBgColor();

      for (let i = 0; i < images.length; i++) {
        const imgItem = images[i];
        setConvertStatus(`Processing page ${i + 1} of ${images.length}...`);

        const canvas = await imageToCanvas(imgItem.file, imgItem.rotation, sheetBg);
        const imgW = canvas.width;
        const imgH = canvas.height;

        // Image Quality compression logic
        let mimeType = 'image/jpeg';
        let quality = 0.92;
        let maxRes = 3000;

        if (imageQuality === 'standard') {
          mimeType = 'image/jpeg';
          quality = 0.75;
          maxRes = 1800;
        } else if (imageQuality === 'high') {
          mimeType = 'image/jpeg';
          quality = 0.92;
          maxRes = 3200;
        } else if (imageQuality === 'maximum') {
          mimeType = 'image/png';
          quality = 1.0;
          maxRes = 6000;
        }

        // Resample canvas if exceeding maxRes to optimize file size
        let workingCanvas = canvas;
        if ((imgW > maxRes || imgH > maxRes) && imageQuality !== 'maximum') {
          const downScale = Math.min(maxRes / imgW, maxRes / imgH);
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.round(imgW * downScale);
          scaledCanvas.height = Math.round(imgH * downScale);
          const sCtx = scaledCanvas.getContext('2d');
          if (sCtx) {
            sCtx.fillStyle = sheetBg;
            sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            workingCanvas = scaledCanvas;
          }
        }

        // Determine authentic PDF page dimensions
        const pageDim = getPageDimensions(imgW, imgH);
        let finalPageW = pageDim.width;
        let finalPageH = pageDim.height;
        if (pageSize === 'fit' && margin > 0) {
          finalPageW += margin * 2;
          finalPageH += margin * 2;
        }

        // Add page to PDF document
        const page = pdfDoc.addPage([finalPageW, finalPageH]);

        // Draw background fill across the entire physical page
        page.drawRectangle({
          x: 0,
          y: 0,
          width: finalPageW,
          height: finalPageH,
          color: pdfBg
        });

        // Compute printable safe area inside margins
        const availW = Math.max(10, finalPageW - margin * 2);
        const availH = Math.max(10, finalPageH - margin * 2);

        let drawW = availW;
        let drawH = availH;
        let drawX = margin;
        let drawY = margin;

        if (fittingOption === 'fill') {
          // Fill (Cover): Crop image symmetrically to match target printable aspect ratio with zero white space
          const targetRatio = availW / availH;
          const currentRatio = workingCanvas.width / workingCanvas.height;
          let cropX = 0;
          let cropY = 0;
          let cropW = workingCanvas.width;
          let cropH = workingCanvas.height;

          if (currentRatio > targetRatio) {
            // Image is wider than printable area: crop horizontal edges symmetrically
            cropW = Math.round(workingCanvas.height * targetRatio);
            cropX = Math.round((workingCanvas.width - cropW) / 2);
          } else if (currentRatio < targetRatio) {
            // Image is taller than printable area: crop vertical edges symmetrically
            cropH = Math.round(workingCanvas.width / targetRatio);
            cropY = Math.round((workingCanvas.height - cropH) / 2);
          }

          const fillCanvas = document.createElement('canvas');
          fillCanvas.width = Math.max(1, cropW);
          fillCanvas.height = Math.max(1, cropH);
          const fCtx = fillCanvas.getContext('2d');
          if (fCtx) {
            fCtx.fillStyle = sheetBg;
            fCtx.fillRect(0, 0, fillCanvas.width, fillCanvas.height);
            fCtx.imageSmoothingEnabled = true;
            fCtx.imageSmoothingQuality = 'high';
            fCtx.drawImage(workingCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            workingCanvas = fillCanvas;
          }
          drawW = availW;
          drawH = availH;
          drawX = margin;
          drawY = margin;
        } else if (fittingOption === 'stretch') {
          // Stretch to fill: fits 100% of printable area width and height
          drawW = availW;
          drawH = availH;
          drawX = margin;
          drawY = margin;
        } else if (fittingOption === 'original') {
          // Original: 1:1 true scale (72 DPI = 1 pt/pixel)
          let targetW = imgW * 0.75;
          let targetH = imgH * 0.75;
          if (targetW > availW || targetH > availH) {
            const scale = Math.min(availW / targetW, availH / targetH);
            targetW *= scale;
            targetH *= scale;
          }
          drawW = targetW;
          drawH = targetH;
          drawX = margin + (availW - drawW) / 2;
          drawY = margin + (availH - drawH) / 2;
        } else if (fittingOption === 'center') {
          // Center: Centered with comfortable 85% safe boundary
          const maxW = availW * 0.85;
          const maxH = availH * 0.85;
          const scale = Math.min(maxW / imgW, maxH / imgH, 1);
          drawW = imgW * scale;
          drawH = imgH * scale;
          drawX = margin + (availW - drawW) / 2;
          drawY = margin + (availH - drawH) / 2;
        } else {
          // Fit: Letterboxed within printable area preserving 100% of original proportions
          const scale = Math.min(availW / imgW, availH / imgH);
          drawW = imgW * scale;
          drawH = imgH * scale;
          drawX = margin + (availW - drawW) / 2;
          drawY = margin + (availH - drawH) / 2;
        }

        const dataUrl = workingCanvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(',')[1];
        const binStr = atob(base64Data);
        const bytes = new Uint8Array(binStr.length);
        for (let j = 0; j < binStr.length; j++) {
          bytes[j] = binStr.charCodeAt(j);
        }

        const pdfImage = mimeType === 'image/png' 
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);

        page.drawImage(pdfImage, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH
        });
      }

      setConvertStatus('Finalizing ISO PDF document...');
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanFilename = docTitle.toLowerCase().endsWith('.pdf') ? docTitle : `${docTitle}.pdf`;

      // Hand off to onComplete for single standard download & toast
      onComplete(pdfBlob, cleanFilename);
      setConverting(false);
      setConvertStatus('');
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setErrorMessage(`Conversion failed: ${err?.message || 'Unknown error'}`);
      setConverting(false);
    }
  };

  const totalBytes = images.reduce((acc, img) => acc + img.file.size, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hidden File Input Refs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesAdded}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFile}
        accept="image/*"
        className="hidden"
      />

      {/* Active Cloud Link Importer Drawer */}
      {activeCloudProvider && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200 dark:border-blue-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              {activeCloudProvider === 'google-drive' && <GoogleDriveAnimatedIcon className="w-6 h-6" />}
              {activeCloudProvider === 'dropbox' && <DropboxAnimatedIcon className="w-6 h-6" />}
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                  Paste {activeCloudProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'} Shared Image Link
                </h4>
                <p className="text-[11px] text-stone-500">
                  Copy link from {activeCloudProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'} app and paste it here to import directly
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveCloudProvider(null)}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="url"
                value={cloudUrlInput}
                onChange={(e) => setCloudUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImportCloudLink()}
                placeholder={`Paste copied ${activeCloudProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'} file link...`}
                className="w-full pl-3 pr-24 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-stone-900 dark:text-stone-100 shadow-xs"
              />
              <button
                onClick={handlePasteClipboard}
                className="absolute right-2 top-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                title="Paste from clipboard"
              >
                Paste Link
              </button>
            </div>

            <button
              onClick={handleImportCloudLink}
              disabled={importingCloudLink || !cloudUrlInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {importingCloudLink ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Import Image</span>
                </>
              )}
            </button>

            <button
              onClick={() => openCloudStorage(activeCloudProvider)}
              className="px-3.5 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs cursor-pointer shrink-0 flex items-center gap-1"
              title="Open app again to copy link"
            >
              <ExternalLink size={13} />
              <span>Open App</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      {images.length === 0 ? (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center gap-5 transition-all text-center shadow-sm ${
            isDragActive 
              ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 scale-[1.01]' 
              : 'border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-900'
          }`}
        >
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-transform"
          >
            <ImageIcon size={32} />
          </div>
          <div>
            <h4 className="font-bold text-base text-stone-900 dark:text-white">Click or Drag & Drop Images Here</h4>
            <p className="text-xs text-stone-500 mt-1">Supports JPG, JPEG, PNG, WEBP, AVIF, HEIC, GIF, and SVG (up to 100MB per file)</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-opacity active:scale-95"
          >
            Select Local Files
          </button>

          {errorMessage && (
            <div className="text-red-600 dark:text-red-400 font-semibold text-xs pt-1 max-w-md">
              {errorMessage}
            </div>
          )}

          {/* Cloud Storage Options Banner */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 w-full max-w-md space-y-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">OR Import From Cloud Storage</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openCloudStorage('google-drive')}
                className="p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer group"
              >
                <GoogleDriveAnimatedIcon className="w-6 h-6" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Google Drive</span>
              </button>

              <button
                onClick={() => openCloudStorage('dropbox')}
                className="p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer group"
              >
                <DropboxAnimatedIcon className="w-6 h-6" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Dropbox</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner Control Panel */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileImage size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="font-bold text-stone-900 dark:text-white text-sm sm:text-base bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 focus:border-amber-500 focus:outline-none w-full max-w-sm truncate"
                    placeholder="Images_Compiled.pdf"
                  />
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">
                    {images.length} {images.length === 1 ? 'image' : 'images'} selected • {totalMb} MB total
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Cloud Storage Quick Action Bar */}
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl">
                  <button
                    onClick={() => openCloudStorage('google-drive')}
                    className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                    title="Import from Google Drive"
                  >
                    <GoogleDriveAnimatedIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Drive</span>
                  </button>

                  <button
                    onClick={() => openCloudStorage('dropbox')}
                    className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                    title="Import from Dropbox"
                  >
                    <DropboxAnimatedIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Dropbox</span>
                  </button>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={converting || images.length === 0}
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {converting ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-amber-500" />
                      <span>{convertStatus || 'Converting...'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Convert to PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Options Toolbar Grid */}
            <div className="pt-3.5 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Layout size={13} className="text-amber-500 shrink-0" />
                  <span>Page Size</span>
                </label>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="fit">Fit to Image Size</option>
                    <option value="A4">A4 (210×297mm)</option>
                    <option value="A3">A3 Large (297×420mm)</option>
                    <option value="A5">A5 Compact (148×210mm)</option>
                    <option value="Letter">US Letter (8.5×11")</option>
                    <option value="Legal">US Legal (8.5×14")</option>
                    <option value="custom">Custom Dimensions...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <RotateCw size={13} className="text-amber-500 shrink-0" />
                  <span>Orientation</span>
                </label>
                <div className="relative">
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="auto">Auto (Match Image)</option>
                    <option value="portrait">Portrait (Vertical)</option>
                    <option value="landscape">Landscape (Horizontal)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Maximize2 size={13} className="text-amber-500 shrink-0" />
                  <span>Margin</span>
                </label>
                <div className="relative">
                  <select
                    value={marginOption}
                    onChange={(e) => setMarginOption(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="none">No Margin (Full Bleed)</option>
                    <option value="small">Small (5mm / 14pt)</option>
                    <option value="medium">Medium (10mm / 28pt)</option>
                    <option value="large">Large (20mm / 56pt)</option>
                    <option value="custom">Custom Margin...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Image Fitting */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <CropIcon size={13} className="text-amber-500 shrink-0" />
                  <span>Image Fit</span>
                </label>
                <div className="relative">
                  <select
                    value={fittingOption}
                    onChange={(e) => setFittingOption(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="fit">Fit to Page (No Crop)</option>
                    <option value="fill">Fill Page (Cover)</option>
                    <option value="stretch">Stretch to Page (Full)</option>
                    <option value="original">Original Size (1:1 DPI)</option>
                    <option value="center">Center on Page</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Palette size={13} className="text-amber-500 shrink-0" />
                  <span>Background</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={bgColorOption}
                      onChange={(e) => setBgColorOption(e.target.value as any)}
                      className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                    >
                      <option value="white">White</option>
                      <option value="yellow">Yellow (#FFFF00)</option>
                      <option value="cream">Warm Cream</option>
                      <option value="blue">Soft Blue</option>
                      <option value="black">Black</option>
                      <option value="custom">Custom Color...</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                  {bgColorOption === 'custom' && (
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 dark:border-stone-700 p-0.5 shrink-0 shadow-xs"
                      title="Pick custom background color"
                    />
                  )}
                </div>
              </div>

              {/* Image Quality */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Sliders size={13} className="text-amber-500 shrink-0" />
                  <span>Quality</span>
                </label>
                <div className="relative">
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="high">High (92% JPEG)</option>
                    <option value="maximum">Maximum (100% PNG)</option>
                    <option value="standard">Standard (75% JPEG)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Custom Parameter Controls (When Custom Selected) */}
            {(pageSize === 'custom' || marginOption === 'custom' || bgColorOption === 'custom') && (
              <div className="pt-2 mt-2 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center gap-4 flex-wrap text-xs bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl">
                {pageSize === 'custom' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Custom Dimensions (pt):</span>
                    <label className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                      <span className="font-bold">W:</span>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(50, Number(e.target.value)))}
                        className="w-20 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-stone-400">({Math.round(customWidth * 0.3528)} mm)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                      <span className="font-bold">H:</span>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(50, Number(e.target.value)))}
                        className="w-20 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-stone-400">({Math.round(customHeight * 0.3528)} mm)</span>
                    </label>
                  </div>
                )}
                {marginOption === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Custom Margin:</span>
                    <input
                      type="number"
                      value={customMargin}
                      onChange={(e) => setCustomMargin(Math.max(0, Number(e.target.value)))}
                      className="w-18 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-stone-500 font-medium">pt ({Math.round(customMargin * 0.3528)} mm)</span>
                  </div>
                )}
                {bgColorOption === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Background Hex:</span>
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      placeholder="#ffffff"
                      className="w-24 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            )}



            {errorMessage && (
              <div className="text-red-600 dark:text-red-400 font-semibold text-xs pt-1">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="space-y-4">
          {/* Action Bar for Queue */}
          <div className="flex items-center justify-between px-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {images.length} {images.length === 1 ? 'Page' : 'Pages'} in PDF sequence
              </span>
              {selectedIds.length > 0 && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  ({selectedIds.length} selected)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={removeSelected}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Remove Selected</span>
                </button>
              )}
              <button
                onClick={() => images.length > 0 ? setShowClearAllConfirm(true) : clearAll()}
                className="px-3 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Remove All
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add More Images</span>
              </button>
            </div>
          </div>

          {/* WYSIWYG Real-Time Page Sheets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {images.map((img, idx) => {
              const isSelected = selectedIds.includes(img.id);
              const sizeKb = (img.file.size / 1024).toFixed(0);

              // Measure effective dimensions considering rotation
              const isRot90 = img.rotation === 90 || img.rotation === 270;
              const effW = isRot90 ? (img.naturalHeight || 300) : (img.naturalWidth || 400);
              const effH = isRot90 ? (img.naturalWidth || 400) : (img.naturalHeight || 300);

              // 1. Calculate authentic physical PDF page dimensions from getPageDimensions
              const basePageDim = getPageDimensions(effW, effH);
              const marginPt = getMarginPoints();
              const finalPageW = (pageSize === 'fit' && marginOption !== 'none')
                ? basePageDim.width + marginPt * 2
                : basePageDim.width;
              const finalPageH = (pageSize === 'fit' && marginOption !== 'none')
                ? basePageDim.height + marginPt * 2
                : basePageDim.height;

              const sheetRatio = finalPageW / finalPageH;
              const isLand = finalPageW > finalPageH;

              // 2. Exact Margin Padding in percentages of width and height
              const marginPercentX = (marginPt / finalPageW) * 100;
              const marginPercentY = (marginPt / finalPageH) * 100;

              // 3. Human readable badge labels
              let pageNameShort = 'A4 (210×297mm)';
              if (pageSize === 'A3') pageNameShort = 'A3 (297×420mm)';
              else if (pageSize === 'A5') pageNameShort = 'A5 (148×210mm)';
              else if (pageSize === 'Letter') pageNameShort = 'US Letter (8.5×11")';
              else if (pageSize === 'Legal') pageNameShort = 'US Legal (8.5×14")';
              else if (pageSize === 'custom') pageNameShort = `Custom (${Math.round(customWidth * 0.3528)}×${Math.round(customHeight * 0.3528)}mm)`;
              else if (pageSize === 'fit') pageNameShort = `Fit to Image (${effW}×${effH}px)`;

              let marginLabel = 'No Margin';
              if (marginOption === 'small') marginLabel = '5mm Margin';
              else if (marginOption === 'medium') marginLabel = '10mm Margin';
              else if (marginOption === 'large') marginLabel = '20mm Margin';
              else if (marginOption === 'custom') marginLabel = `${(customMargin * 0.3528).toFixed(0)}mm Margin`;

              let fitLabel = 'Fit (No Crop)';
              if (fittingOption === 'fill') fitLabel = 'Fill (Cover)';
              else if (fittingOption === 'stretch') fitLabel = 'Stretch (Full)';
              else if (fittingOption === 'original') fitLabel = '1:1 Original';
              else if (fittingOption === 'center') fitLabel = 'Centered';

              // 4. Real Paper Background Color
              const paperBgColor = getSheetBgColor();

              // 5. Object fit class
              let objectFitClass = 'object-contain';
              if (fittingOption === 'fill') {
                objectFitClass = 'object-cover';
              } else if (fittingOption === 'stretch') {
                objectFitClass = 'object-fill';
              }

              // 6. Container sizing for original / center
              let containerStyle: React.CSSProperties = { width: '100%', height: '100%' };
              if (fittingOption === 'center') {
                containerStyle = { width: '85%', height: '85%' };
              } else if (fittingOption === 'original') {
                const availW = Math.max(10, finalPageW - marginPt * 2);
                const availH = Math.max(10, finalPageH - marginPt * 2);
                const scale = Math.min(1, availW / (effW * 0.75), availH / (effH * 0.75));
                const pctW = Math.min(100, Math.round(((effW * 0.75 * scale) / availW) * 100));
                const pctH = Math.min(100, Math.round(((effH * 0.75 * scale) / availH) * 100));
                containerStyle = { width: `${pctW}%`, height: `${pctH}%` };
              }

              return (
                <div 
                  key={img.id} 
                  className={`bg-white dark:bg-stone-900 rounded-3xl border p-3.5 relative group shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {/* Select Checkbox */}
                  <div 
                    onClick={() => toggleSelect(img.id)}
                    className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>

                  {/* WYSIWYG Page Sheet Workspace Canvas */}
                  <div className="relative w-full flex items-center justify-center p-3.5 bg-stone-100/90 dark:bg-stone-950/80 rounded-2xl min-h-[360px] overflow-hidden border border-stone-200/60 dark:border-stone-800/60">
                    {/* The Authentic Physical PDF Page Sheet */}
                    <div 
                      className="relative shadow-2xl rounded-sm overflow-hidden transition-all duration-300 border border-stone-300/80 dark:border-stone-700/80 flex items-center justify-center"
                      style={{
                        width: isLand ? '280px' : `${Math.min(260, Math.max(140, Math.round(310 * sheetRatio)))}px`,
                        height: isLand ? `${Math.min(230, Math.max(140, Math.round(280 / sheetRatio)))}px` : '310px',
                        maxWidth: '100%',
                        aspectRatio: `${sheetRatio}`,
                        backgroundColor: paperBgColor
                      }}
                    >
                      {/* Printable Safe Area with Margin Boundaries */}
                      <div 
                        className={`absolute flex items-center justify-center overflow-hidden transition-all duration-200 ${
                          marginOption !== 'none' ? 'border border-dashed border-amber-500/50 dark:border-amber-400/50' : ''
                        }`}
                        style={{
                          left: `${marginPercentX}%`,
                          right: `${marginPercentX}%`,
                          top: `${marginPercentY}%`,
                          bottom: `${marginPercentY}%`
                        }}
                      >
                        {img.previewUrl && (
                          <div 
                            className="relative w-full h-full flex items-center justify-center transition-all duration-300 overflow-hidden"
                            style={containerStyle}
                          >
                            <img
                              src={img.previewUrl}
                              alt={img.file.name}
                              onLoad={(e) => {
                                const target = e.currentTarget;
                                if (target.naturalWidth && target.naturalHeight) {
                                  if (img.naturalWidth !== target.naturalWidth || img.naturalHeight !== target.naturalHeight) {
                                    setImages(prev => prev.map(item => item.id === img.id ? {
                                      ...item,
                                      naturalWidth: target.naturalWidth,
                                      naturalHeight: target.naturalHeight
                                    } : item));
                                  }
                                }
                              }}
                              className={`transition-all duration-300 select-none ${objectFitClass}`}
                              style={{ 
                                width: isRot90 ? `${(effH / effW) * 100}%` : '100%',
                                height: isRot90 ? `${(effW / effH) * 100}%` : '100%',
                                transform: img.rotation ? `rotate(${img.rotation}deg)` : undefined,
                                transformOrigin: 'center center'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Informative Page Badges */}
                      <div className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10 flex items-center gap-1">
                        <span>Page {idx + 1}</span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10 uppercase tracking-wider">
                        <span>{isLand ? 'Landscape' : 'Portrait'}</span>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10">
                        {pageNameShort}
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10">
                        {marginLabel} • {fitLabel}
                      </div>
                    </div>
                  </div>

                  {/* Control Bar Footer */}
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="truncate" title={img.file.name}>{img.file.name}</span>
                        {img.isCropped && (
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Cropped
                          </span>
                        )}
                      </div>
                      <span className="text-stone-400 shrink-0 ml-1.5">{sizeKb} KB</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button 
                          onClick={() => handleRotate(img.id, 'left')} 
                          className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                          title="Rotate Left -90°"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button 
                          onClick={() => handleRotate(img.id, 'right')} 
                          className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                          title="Rotate Right +90°"
                        >
                          <RotateCw size={14} />
                        </button>
                        <button 
                          onClick={() => setCroppingImage(img)} 
                          className={`p-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                            img.isCropped 
                              ? 'bg-amber-500 text-white shadow-xs' 
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}
                          title="Crop & Adjust Image"
                        >
                          <CropIcon size={14} />
                        </button>
                        {img.isCropped && (
                          <button 
                            onClick={() => setPhotoToRestore(img)} 
                            className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]" 
                            title="Revert Crop to Original Photo"
                          >
                            <RotateCcw size={13} />
                            <span className="text-[10px]">Revert</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDuplicate(img)} 
                          className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                          title="Duplicate Page"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => handleReplaceClick(img.id)} 
                          className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                          title="Replace Image File"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button 
                            onClick={() => handleMove(idx, 'up')} 
                            className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                            title="Move Earlier in PDF"
                          >
                            <ArrowUp size={14} />
                          </button>
                        )}
                        {idx < images.length - 1 && (
                          <button 
                            onClick={() => handleMove(idx, 'down')} 
                            className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                            title="Move Later in PDF"
                          >
                            <ArrowDown size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(img.id)} 
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer" 
                          title="Delete Page"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Cloud Storage File Picker Modal */}
      {isCloudModalOpen && (
        <CloudStorageModal
          isOpen={isCloudModalOpen}
          onClose={() => setIsCloudModalOpen(false)}
          initialProvider={cloudModalProvider}
          fileType="image"
          onFilesImported={(importedFiles) => {
            addFilesToQueue(importedFiles);
            setIsCloudModalOpen(false);
          }}
        />
      )}

      {/* Image Crop Modal */}
      {croppingImage && (
        <ImageCropModal
          isOpen={!!croppingImage}
          onClose={() => setCroppingImage(null)}
          imageFile={croppingImage.file}
          originalFile={croppingImage.originalFile || croppingImage.file}
          isAlreadyCropped={!!croppingImage.isCropped}
          initialCrop={croppingImage.cropBox}
          currentRotation={croppingImage.rotation}
          onSaveCrop={handleSaveCrop}
          onRevertToOriginal={() => handleRevertToOriginal(croppingImage.id)}
        />
      )}

      {/* Restore Photo Confirmation Modal */}
      {photoToRestore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
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
                Are you sure you want to revert this photo? All saved crop boundaries, rotations, and custom aspect ratios will be removed, restoring the original untouched image.
              </p>
            </div>

            {/* Photo preview card */}
            <div className="bg-stone-50 dark:bg-stone-800/70 rounded-2xl p-3 flex items-center gap-3 border border-stone-200/80 dark:border-stone-700/80">
              <img 
                src={photoToRestore.originalPreviewUrl || photoToRestore.previewUrl} 
                alt="Original" 
                className="w-14 h-14 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0 bg-stone-900" 
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{photoToRestore.file.name}</p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                  {(photoToRestore.file.size / 1024).toFixed(0)} KB • Original untouched photo
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  <Check size={11} strokeWidth={2.5} /> Pristine memory preserved
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToRestore(null)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Keep Current Edits
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRevertToOriginal(photoToRestore.id);
                  setPhotoToRestore(null);
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Undo2 size={13} strokeWidth={2.5} />
                <span>Yes, Restore Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={24} strokeWidth={2.2} />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-heading font-black text-stone-900 dark:text-white text-base tracking-tight">
                Remove All Photos?
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Are you sure you want to remove all {images.length} photos and memories currently loaded in this sequence?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Keep Photos
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} strokeWidth={2.5} />
                <span>Yes, Remove All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
