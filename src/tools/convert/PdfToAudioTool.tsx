import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Play, 
  Pause, 
  Square, 
  FileText, 
  Headphones 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToAudioToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const PdfToAudioTool: React.FC<PdfToAudioToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageText, setPageText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1.0); // 0.8 to 1.5
  const [pitch, setPitch] = useState<number>(1.0);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadAndExtract(preloadedFile);
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [preloadedFile]);

  const loadAndExtract = async (f: File) => {
    try {
      setFile(f);
      setIsExtracting(true);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let extracted = '';
      for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const str = textContent.items.map((it: any) => it.str).join(' ');
        extracted += ` ${str}`;
      }

      setPageText(extracted.replace(/\s+/g, ' ').trim());
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Audio text extraction error:', err);
      alert('Could not extract text for speech synthesis.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePlayPause = () => {
    if (!pageText) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(pageText.slice(0, 3000));
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
      setIsPlaying(true);
      sfx.playSuccess();
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    sfx.playClick();
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
            <Volume2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Text-to-Speech Audio</h4>
            <p className="text-xs text-slate-400 mt-1">Converts document text into natural-sounding speech directly in-browser.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadAndExtract(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {pageText.split(' ').length} Words Extracted
                </p>
              </div>
            </div>

            <span className="text-[10px] font-fira px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" /> Neural Speech Ready
            </span>
          </div>

          {/* Audio Controls Console */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 text-center">
            
            {/* Play/Pause/Stop Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePlayPause}
                disabled={!pageText || isExtracting}
                className="p-4 rounded-full bg-purple-500 hover:bg-purple-400 text-white shadow-xl shadow-purple-500/30 transition-all cursor-pointer disabled:opacity-40"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white translate-x-0.5" />}
              </button>
              <button
                onClick={handleStop}
                disabled={!isPlaying}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer disabled:opacity-30"
              >
                <Square className="w-4 h-4 fill-slate-300" />
              </button>
            </div>

            {/* Sliders: Rate & Pitch */}
            <div className="grid grid-cols-2 gap-4 pt-2 max-w-sm mx-auto text-xs font-fira text-slate-400">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Speed</span>
                  <span className="text-white">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Pitch</span>
                  <span className="text-white">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Web Speech API • Real-time on-device synthesis</span>
        </div>

        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
          Close Player
        </button>
      </div>
    </div>
  );
};