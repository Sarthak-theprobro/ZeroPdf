import React, { useState, useEffect } from 'react';
import { 
  Images, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Layers,
  Maximize2
} from 'lucide-react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface ImagesToPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const ImagesToPdfTool: React.FC<ImagesToPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'fit' | 'a4-portrait' | 'a4-landscape' | 'letter'>('fit');
  const [margin, setMargin] = useState<number>(0); // 0, 20, 40
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile && preloadedFile.type.startsWith('image/')) {
      addImageFiles([preloadedFile]);
    }
  }, [preloadedFile]);

  const addImageFiles = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    sfx.playSuccess();
    setImages((prev) => [...prev, ...newItems]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImageFiles(Array.from(e.target.files));
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    sfx.playHover();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const removeImage = (index: number) => {
    sfx.playClick();
    setImages((prev) => {
      const item = prev[index];
      URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Convert any image format to standardized PNG ArrayBuffer using Canvas
  const fileToPngBytes = async (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'));
            return;
          }
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        }, 'image/png');
      };
      img.onerror = (err) => reject(err);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleExecuteConversion = async () => {
    if (images.length === 0) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();

      for (const item of images) {
        const imageBytes = await fileToPngBytes(item.file);
        const embeddedImage = await doc.embedPng(imageBytes);
        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === 'a4-portrait') {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];
        } else if (pageSize === 'a4-landscape') {
          pageWidth = PageSizes.A4[1];
          pageHeight = PageSizes.A4[0];
        } else if (pageSize === 'letter') {
          pageWidth = PageSizes.Letter[0];
          pageHeight = PageSizes.Letter[1];
        }

        const page = doc.addPage([pageWidth, pageHeight]);

        // Calculate aspect ratio scaling within margins
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;

        const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        const drawWidth = imgWidth * scale;
        const drawHeight = imgHeight * scale;

        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `converted_images_${Date.now()}.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Image to PDF error:', err);
      alert('Failed to convert images to PDF. Please verify the image formats.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Upload Zone */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div>
          <h4 className="font-semibold text-sm text-white">Batch Images to PDF</h4>
          <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP, GIF, SVG, and HEIC photos.</p>
        </div>
        <label className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          <span>Add More Images</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* Page Configuration Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="space-y-1.5">
          <label className="text-xs font-fira text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" /> Page Dimension
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'fit', label: 'Fit to Image' },
              { id: 'a4-portrait', label: 'A4 Portrait' },
              { id: 'a4-landscape', label: 'A4 Landscape' },
              { id: 'letter', label: 'US Letter' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  sfx.playHover();
                  setPageSize(p.id as any);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                  pageSize === p.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-fira text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Page Margins
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0, label: 'No Margin' },
              { val: 20, label: 'Small Margin' },
              { val: 40, label: 'Wide Margin' },
            ].map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => {
                  sfx.playHover();
                  setMargin(m.val);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                  margin === m.val
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reorderable Image Gallery Grid */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {images.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-fira text-xs border border-dashed border-white/10 rounded-2xl">
            No images loaded yet. Click &quot;Add More Images&quot; above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((item, idx) => (
              <div
                key={item.id}
                className="relative p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-purple-500/40 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-1.5 text-[10px] font-fira">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                    #{idx + 1}
                  </span>
                  <span className="text-slate-400 truncate max-w-[90px]">{item.file.name}</span>
                </div>

                <div className="w-full h-28 rounded-lg overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center">
                  <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-contain" />
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5 text-slate-400">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveImage(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-white/10 hover:text-white disabled:opacity-20"
                      title="Move Left"
                    >
                      <ArrowUp className="w-3 h-3 rotate-[-90deg]" />
                    </button>
                    <button
                      onClick={() => moveImage(idx, 'down')}
                      disabled={idx === images.length - 1}
                      className="p-1 rounded hover:bg-white/10 hover:text-white disabled:opacity-20"
                      title="Move Right"
                    >
                      <ArrowDown className="w-3 h-3 rotate-[-90deg]" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeImage(idx)}
                    className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{images.length} images queued for PDF conversion</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteConversion}
            disabled={images.length === 0 || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling PDF...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>PDF Created & Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Convert & Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};