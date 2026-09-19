import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  UploadCloud, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Loader2, 
  FileText,
  Eye,
  Code
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToMarkdownToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const PdfToMarkdownTool: React.FC<PdfToMarkdownToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'raw' | 'preview'>('split');

  useEffect(() => {
    if (preloadedFile) {
      handleFileSelected(preloadedFile);
    }
  }, [preloadedFile]);

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setMarkdownContent('');
    sfx.playClick();
  };

  const processPdfToMarkdown = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let fullMd = `# ${file.name.replace(/\.pdf$/i, '')}\n\n`;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) continue;

        if (numPages > 1) {
          fullMd += `\n---\n\n<!-- Page ${pageNum} -->\n\n`;
        }

        // Group by line
        const lineMap = new Map<number, { text: string; fontSize: number; x: number }[]>();
        for (const item of items) {
          if (!item.str || item.str.trim() === '') continue;
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1]));

          let matchedY = Array.from(lineMap.keys()).find((k) => Math.abs(k - y) <= 4);
          if (matchedY === undefined) {
            matchedY = y;
            lineMap.set(matchedY, []);
          }
          lineMap.get(matchedY)!.push({ text: item.str, fontSize, x });
        }

        const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

        for (const y of sortedY) {
          const lineItems = lineMap.get(y)!;
          lineItems.sort((a, b) => a.x - b.x);

          const lineText = lineItems.map((it) => it.text).join(' ').trim();
          const maxFontSize = Math.max(...lineItems.map((it) => it.fontSize));

          if (lineText.length === 0) continue;

          // Markdown formatting heuristics
          if (maxFontSize >= 22) {
            fullMd += `\n# ${lineText}\n\n`;
          } else if (maxFontSize >= 16) {
            fullMd += `\n## ${lineText}\n\n`;
          } else if (maxFontSize >= 13 && lineText.length < 60) {
            fullMd += `\n### ${lineText}\n\n`;
          } else if (/^(\*|-|•)\s+/.test(lineText)) {
            fullMd += `- ${lineText.replace(/^(\*|-|•)\s+/, '')}\n`;
          } else if (/^\d+\.\s+/.test(lineText)) {
            fullMd += `${lineText}\n`;
          } else {
            fullMd += `${lineText}\n\n`;
          }
        }
      }

      setMarkdownContent(fullMd.trim());
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Markdown conversion error:', err);
      alert('Failed to extract markdown from PDF.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    sfx.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdownContent || !file) return;
    sfx.playClick();
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '.md');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-3xl bg-amber-950/10 cursor-pointer transition-all hover:bg-amber-950/20 group">
          <FileCode2 className="w-14 h-14 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Markdown (.md) Extraction</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Converts vector typography into clean GitHub-Flavored Markdown with headings, bullet lists, and dividers.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-fira text-xs font-semibold border border-amber-500/40">
            Select PDF File
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFile(null);
                  setMarkdownContent('');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
              >
                Change File
              </button>

              {!markdownContent ? (
                <button
                  onClick={processPdfToMarkdown}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Markdown
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-fira cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-fira text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Markdown Editor / Preview Workspace */}
          {markdownContent && (
            <div className="rounded-2xl border border-white/10 bg-black/50 overflow-hidden">
              <div className="px-4 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs font-fira">
                <span className="text-slate-400 font-bold">Extracted Markdown Output</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2 py-1 rounded ${viewMode === 'raw' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'}`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-2 py-1 rounded ${viewMode === 'split' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'}`}
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2 py-1 rounded ${viewMode === 'preview' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'}`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              <div className={`p-4 max-h-[460px] overflow-y-auto ${viewMode === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
                {(viewMode === 'raw' || viewMode === 'split') && (
                  <textarea
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    rows={16}
                    className="w-full bg-black/40 rounded-xl border border-white/10 p-3 text-xs font-fira text-slate-200 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                  />
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-3 font-sans leading-relaxed">
                    {markdownContent.split('\n\n').map((block, idx) => {
                      if (block.startsWith('# ')) {
                        return <h1 key={idx} className="text-lg font-bold text-white border-b border-white/10 pb-1">{block.replace('# ', '')}</h1>;
                      } else if (block.startsWith('## ')) {
                        return <h2 key={idx} className="text-base font-bold text-amber-300 pt-2">{block.replace('## ', '')}</h2>;
                      } else if (block.startsWith('### ')) {
                        return <h3 key={idx} className="text-sm font-semibold text-slate-200">{block.replace('### ', '')}</h3>;
                      } else if (block.startsWith('- ')) {
                        return (
                          <ul key={idx} className="list-disc pl-4 space-y-1">
                            {block.split('\n').map((li, lIdx) => (
                              <li key={lIdx}>{li.replace(/^- /, '')}</li>
                            ))}
                          </ul>
                        );
                      } else if (block === '---') {
                        return <hr key={idx} className="border-white/10 my-3" />;
                      } else {
                        return <p key={idx}>{block}</p>;
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
