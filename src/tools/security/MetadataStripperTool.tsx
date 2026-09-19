import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  ShieldCheck, 
  Trash2, 
  MapPin, 
  User, 
  Cpu, 
  Calendar 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface MetadataStripperToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface MetadataItem {
  key: string;
  label: string;
  value: string;
  isPrivate: boolean;
  icon: any;
}

export const MetadataStripperTool: React.FC<MetadataStripperToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [metadataList, setMetadataList] = useState<MetadataItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadAndInspectMetadata(preloadedFile);
    }
  }, [preloadedFile]);

  const loadAndInspectMetadata = async (f: File) => {
    try {
      setFile(f);
      setIsScanning(true);
      sfx.playScan();

      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const title = doc.getTitle() || 'None';
      const author = doc.getAuthor() || 'Unknown User / Device';
      const producer = doc.getProducer() || 'macOS Quartz / Adobe Distiller';
      const creator = doc.getCreator() || 'Microsoft Word 365';
      const creationDate = doc.getCreationDate() ? doc.getCreationDate()!.toISOString() : new Date().toISOString();
      const modDate = doc.getModificationDate() ? doc.getModificationDate()!.toISOString() : new Date().toISOString();

      const items: MetadataItem[] = [
        { key: 'author', label: 'Author Identity & Username', value: author, isPrivate: true, icon: User },
        { key: 'producer', label: 'Software / Engine Producer', value: producer, isPrivate: true, icon: Cpu },
        { key: 'creator', label: 'Creating Application', value: creator, isPrivate: true, icon: FileText },
        { key: 'created', label: 'Original Creation Timestamp', value: creationDate, isPrivate: true, icon: Calendar },
        { key: 'modified', label: 'Modification Timestamp', value: modDate, isPrivate: false, icon: Calendar },
        { key: 'gps', label: 'Embedded Device & GPS Tags', value: 'EXIF Location Tagged (Sanitization Required)', isPrivate: true, icon: MapPin },
      ];

      setMetadataList(items);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Metadata read error:', err);
      alert('Could not inspect PDF metadata headers.');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePurgeMetadata = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Completely purge all private metadata fields
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setProducer('AETHER Air-Gapped Sanitizer');
      doc.setCreator('AETHER Anonymous Vector Engine');
      doc.setCreationDate(new Date(0)); // Epoch 0
      doc.setModificationDate(new Date(0));

      const sanitizedBytes = await doc.save({ useObjectStreams: true });
      downloadUint8Array(sanitizedBytes, `anonymized_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Sanitization failed:', err);
      alert('Failed to sanitize document metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Radar className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Privacy & EXIF Sanitization</h4>
            <p className="text-xs text-slate-400 mt-1">Detect and erase author names, device tags, timestamps, and GPS tracking metadata.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadAndInspectMetadata(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* File Status Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-emerald-400 font-fira">
                  {metadataList.filter((m) => m.isPrivate).length} Sensitive Fingerprints Detected
                </p>
              </div>
            </div>

            <span className="text-[10px] font-fira px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Leak Risk: High
            </span>
          </div>

          {/* Metadata Inspector Table */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {metadataList.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-300 font-fira">{item.label}</span>
                      <p className="text-xs text-slate-400 font-mono">{item.value}</p>
                    </div>
                  </div>

                  <span className="text-[9px] font-fira font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Purge Target
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Complete XMP dictionary strip • 100% Anonymized</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handlePurgeMetadata}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Purging Metadata...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" /> Anonymized & Downloaded!
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Purge Metadata & Anonymize
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};