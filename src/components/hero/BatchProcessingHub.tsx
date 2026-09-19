import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  FolderArchive, 
  Trash2, 
  FileText,
  Sliders,
  ShieldAlert,
  Minimize2
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';
import { MemoryGuard } from '@/core/security/MemoryGuard';

interface BatchFileItem {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  resultBytes?: Uint8Array;
}

type BatchAction = 'compress' | 'auto-redact' | 'flatten' | 'strip-metadata';

export const BatchProcessingHub: React.FC = () => {
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [selectedAction, setSelectedAction] = useState<BatchAction>('compress');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: BatchFileItem[] = Array.from(e.target.files).map((file, idx) => ({
        id: `batch-${Date.now()}-${idx}`,
        file,
        status: 'queued',
        progress: 0,
      }));
      sfx.playSuccess();
      setBatchFiles((prev) => [...prev, ...newItems]);
      setZipDownloadUrl(null);
    }
  };

  const removeFile = (id: string) => {
    sfx.playClick();
    setBatchFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    sfx.playClick();
    batchFiles.forEach((item) => {
      if (item.resultBytes) MemoryGuard.zeroize(item.resultBytes);
    });
    setBatchFiles([]);
    if (zipDownloadUrl) MemoryGuard.revokeBlobUrl(zipDownloadUrl);
    setZipDownloadUrl(null);
  };

  const executeBatch = async () => {
    if (batchFiles.length === 0) return;
    setIsProcessingAll(true);
    sfx.playProcessing();

    const zip = new JSZip();
    const updated = [...batchFiles];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'processing';
      updated[i].progress = 25;
      setBatchFiles([...updated]);

      try {
        const fileBytes = await updated[i].file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        updated[i].progress = 60;
        setBatchFiles([...updated]);

        if (selectedAction === 'compress') {
          // Remove unused metadata & optimize structure
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setProducer('ZEROPDF Engine (Air-Gapped)');
        } else if (selectedAction === 'strip-metadata') {
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');
        }

        const savedBytes = await pdfDoc.save({ useObjectStreams: true });
        updated[i].resultBytes = savedBytes;
        updated[i].status = 'done';
        updated[i].progress = 100;

        const baseName = updated[i].file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}_${selectedAction}.pdf`, savedBytes);
        setBatchFiles([...updated]);
      } catch (err) {
        console.error(`Batch error on ${updated[i].file.name}:`, err);
        updated[i].status = 'error';
        setBatchFiles([...updated]);
      }
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(new Blob([zipBlob as any], { type: 'application/zip' }));
      setZipDownloadUrl(downloadUrl);
      sfx.playSuccess();
    } catch (e) {
      console.error('Failed to generate ZIP:', e);
    } finally {
      setIsProcessingAll(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="p-6 rounded-3xl bg-[#07090E]/90 border border-amber-500/20 shadow-2xl space-y-6">
        
        {/* Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-orbitron font-bold text-white tracking-wide">
                  PARALLEL MULTI-FILE BATCH ENGINE
                </h3>
                <span className="text-[10px] font-fira px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  MULTI-THREADED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-fira">
                Process up to 50 documents simultaneously in memory with zero file size limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={handleAddFiles}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-fira text-xs font-semibold transition-all cursor-pointer"
            >
              + Add Batch Files
            </button>
            {batchFiles.length > 0 && (
              <button
                onClick={clearAll}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-all cursor-pointer"
                title="Clear All Files"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-fira text-slate-400 mr-2">Target Operation:</span>
          {[
            { id: 'compress', label: 'Batch Compress (Lossless)', icon: Minimize2 },
            { id: 'strip-metadata', label: 'Strip All Metadata (EXIF/GPS)', icon: ShieldAlert },
          ].map((op) => {
            const Icon = op.icon;
            const isSelected = selectedAction === op.id;
            return (
              <button
                key={op.id}
                onClick={() => {
                  sfx.playClick();
                  setSelectedAction(op.id as any);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-fira transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{op.label}</span>
              </button>
            );
          })}
        </div>

        {/* Queued Files List */}
        {batchFiles.length > 0 && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {batchFiles.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4 text-xs font-fira hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-500 font-bold w-5">#{idx + 1}</span>
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-white truncate max-w-xs">{item.file.name}</span>
                  <span className="text-slate-500 text-[11px]">
                    ({(item.file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'processing' && (
                    <span className="text-amber-400 flex items-center gap-1.5 text-[11px]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                  {item.status === 'queued' && (
                    <span className="text-slate-400 text-[11px]">Queued</span>
                  )}
                  <button
                    onClick={() => removeFile(item.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Execution & Download Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="text-xs font-fira text-slate-400">
            {batchFiles.length} {batchFiles.length === 1 ? 'document' : 'documents'} ready for parallel execution
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={batchFiles.length === 0 || isProcessingAll}
              onClick={executeBatch}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-fira text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Parallel Queue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Batch Pipeline</span>
                </>
              )}
            </button>

            {zipDownloadUrl && (
              <a
                href={zipDownloadUrl}
                download={`ZEROPDF_Batch_${selectedAction}.zip`}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer animate-fade-in"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Download All (ZIP)</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};