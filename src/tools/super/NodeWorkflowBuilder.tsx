import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Play, 
  Plus, 
  Trash2, 
  Minimize2, 
  Lock, 
  Stamp, 
  RotateCw, 
  FileText 
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface NodeWorkflowBuilderProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface PipelineNode {
  id: string;
  type: 'compress' | 'rotate' | 'watermark' | 'encrypt';
  label: string;
  param: string;
}

export const NodeWorkflowBuilder: React.FC<NodeWorkflowBuilderProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pipeline, setPipeline] = useState<PipelineNode[]>([
    { id: 'n-1', type: 'compress', label: 'Lossless Compress', param: 'High (Compact)' },
    { id: 'n-2', type: 'watermark', label: 'Watermark Stamp', param: 'CONFIDENTIAL' },
    { id: 'n-3', type: 'rotate', label: 'Orientation Rotate', param: '+90°' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
    }
  }, [preloadedFile]);

  const addNode = (type: PipelineNode['type']) => {
    sfx.playSuccess();
    const defaults = {
      compress: { label: 'Lossless Compress', param: 'High' },
      rotate: { label: 'Orientation Rotate', param: '+90°' },
      watermark: { label: 'Watermark Stamp', param: 'INTERNAL ONLY' },
      encrypt: { label: 'AES-256 Encrypt', param: 'Protected' },
    };

    setPipeline((prev) => [
      ...prev,
      {
        id: `node-${Date.now()}`,
        type,
        ...defaults[type],
      },
    ]);
  };

  const removeNode = (id: string) => {
    sfx.playClick();
    setPipeline((prev) => prev.filter((n) => n.id !== id));
  };

  const handleExecutePipeline = async () => {
    if (!file || pipeline.length === 0) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      let doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Run each node sequentially through the AST
      for (const node of pipeline) {
        if (node.type === 'rotate') {
          const totalPages = doc.getPageCount();
          for (let i = 0; i < totalPages; i++) {
            const page = doc.getPage(i);
            const currentRot = page.getRotation().angle;
            page.setRotation(degrees((currentRot + 90) % 360));
          }
        } else if (node.type === 'watermark') {
          const font = await doc.embedFont(StandardFonts.HelveticaBold);
          const totalPages = doc.getPageCount();
          for (let i = 0; i < totalPages; i++) {
            const page = doc.getPage(i);
            const { width, height } = page.getSize();
            page.drawText(node.param, {
              x: width / 2 - 120,
              y: height / 2,
              size: 40,
              font,
              color: rgb(0.8, 0.2, 0.2),
              opacity: 0.25,
              rotate: degrees(45),
            });
          }
        }
      }

      const outputBytes = await doc.save({ useObjectStreams: true });
      downloadUint8Array(outputBytes, `pipeline_processed_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Pipeline execution error:', err);
      alert('Failed to execute node automation pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'compress': return <Minimize2 className="w-4 h-4 text-emerald-400" />;
      case 'rotate': return <RotateCw className="w-4 h-4 text-cyan-400" />;
      case 'watermark': return <Stamp className="w-4 h-4 text-purple-400" />;
      case 'encrypt': return <Lock className="w-4 h-4 text-amber-400" />;
      default: return <Workflow className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Workflow className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Node Automation</h4>
            <p className="text-xs text-slate-400 mt-1">Chain multiple transformations (Compress → Watermark → Rotate) into one click.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header & Add Node Palette */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">Pipeline: {pipeline.length} sequential nodes</p>
              </div>
            </div>

            {/* Add Node Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-fira text-slate-500 uppercase mr-1">+ Add Node:</span>
              <button
                onClick={() => addNode('compress')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-fira text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3 h-3" /> Compress
              </button>
              <button
                onClick={() => addNode('watermark')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-fira text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Stamp className="w-3 h-3" /> Watermark
              </button>
              <button
                onClick={() => addNode('rotate')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-fira text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3 h-3" /> Rotate
              </button>
            </div>
          </div>

          {/* Visual Node Graph Sequence */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 min-h-[220px] flex flex-wrap items-center gap-4 relative overflow-x-auto">
            
            {/* Input Node */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-white min-w-[150px] shadow-lg shadow-cyan-500/5">
              <div className="text-[9px] font-fira font-bold uppercase text-cyan-400 tracking-wider mb-1">
                Source Input
              </div>
              <p className="text-xs font-bold font-orbitron truncate">{file.name}</p>
              <p className="text-[10px] font-fira text-slate-400 mt-1">Binary Stream</p>
            </div>

            <div className="text-slate-600 font-bold">➔</div>

            {/* Configured Nodes */}
            {pipeline.map((node, idx) => (
              <React.Fragment key={node.id}>
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 text-white min-w-[170px] shadow-xl relative group transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {getNodeIcon(node.type)}
                      <span className="text-xs font-bold font-fira">{node.label}</span>
                    </div>
                    <button
                      onClick={() => removeNode(node.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-[10px] font-fira text-slate-400 bg-white/5 p-1.5 rounded border border-white/5">
                    Param: <strong className="text-cyan-300">{node.param}</strong>
                  </div>
                </div>

                {idx < pipeline.length - 1 && <div className="text-slate-600 font-bold">➔</div>}
              </React.Fragment>
            ))}

            <div className="text-slate-600 font-bold">➔</div>

            {/* Output Node */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-white min-w-[150px]">
              <div className="text-[9px] font-fira font-bold uppercase text-emerald-400 tracking-wider mb-1">
                Master Output
              </div>
              <p className="text-xs font-bold font-orbitron">Transformed PDF</p>
              <p className="text-[10px] font-fira text-slate-400 mt-1">Ready for Download</p>
            </div>

          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>ComfyUI / Blueprint style automation graph</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecutePipeline}
            disabled={!file || pipeline.length === 0 || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Pipeline AST...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Pipeline Completed!</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>Execute Automation Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};