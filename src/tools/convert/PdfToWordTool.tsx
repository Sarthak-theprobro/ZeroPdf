import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  FileDown
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToWordToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface ExtractedParagraph {
  text: string;
  isHeading: boolean;
  fontSize: number;
  pageNumber: number;
}

export const PdfToWordTool: React.FC<PdfToWordToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedParagraph[]>([]);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [options, setOptions] = useState({
    detectHeadings: true,
    preserveLineBreaks: true,
    includePageBreaks: true,
  });

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
    setExtractedData([]);
    setConvertedBlob(null);
    sfx.playClick();
  };

  const processPdfToWord = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusMessage('Parsing PDF vector text streams...');
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const paragraphs: ExtractedParagraph[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setStatusMessage(`Extracting typographic structure: Page ${pageNum} of ${numPages}...`);
        setProgress(Math.round(10 + (pageNum / numPages) * 50));

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) continue;

        const lineMap = new Map<number, { text: string; fontSize: number; x: number }[]>();
        
        for (const item of items) {
          if (!item.str || item.str.trim() === '') continue;
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1]));

          let matchedY = Array.from(lineMap.keys()).find(k => Math.abs(k - y) <= 4);
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
          
          const lineText = lineItems.map(it => it.text).join(' ').trim();
          const maxFontSize = Math.max(...lineItems.map(it => it.fontSize));

          if (lineText.length > 0) {
            paragraphs.push({
              text: lineText,
              isHeading: options.detectHeadings && maxFontSize >= 15,
              fontSize: maxFontSize,
              pageNumber: pageNum,
            });
          }
        }
      }

      setExtractedData(paragraphs);
      setStatusMessage('Compiling OpenXML (.docx) structure and packaging ZIP container...');
      setProgress(80);

      const docxBlob = await generateDocxZip(paragraphs, options);
      setConvertedBlob(docxBlob);
      setProgress(100);
      setStatusMessage('Conversion Complete!');
      sfx.playSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('PDF to Word failed:', err);
      alert('Failed to convert PDF to Word. The document may be scanned or image-based.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const generateDocxZip = async (
    paras: ExtractedParagraph[],
    opts: { detectHeadings: boolean; preserveLineBreaks: boolean; includePageBreaks: boolean }
  ): Promise<Blob> => {
    const zip = new JSZip();

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
    );

    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    zip.file(
      'word/_rels/document.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    );

    zip.file(
      'word/styles.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="36"/>
      <w:color w:val="2E74B5"/>
    </w:rPr>
  </w:style>
</w:styles>`
    );

    let bodyContent = '';
    let lastPage = 1;

    paras.forEach((p) => {
      if (opts.includePageBreaks && p.pageNumber > lastPage) {
        bodyContent += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
        lastPage = p.pageNumber;
      }

      const safeText = p.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      if (p.isHeading) {
        bodyContent += `
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:spacing w:before="240" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr><w:b/></w:rPr>
            <w:t xml:space="preserve">${safeText}</w:t>
          </w:r>
        </w:p>`;
      } else {
        bodyContent += `
        <w:p>
          <w:pPr>
            <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:t xml:space="preserve">${safeText}</w:t>
          </w:r>
        </w:p>`;
      }
    });

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    zip.file('word/document.xml', documentXml);

    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '.docx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <UploadCloud className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Word (.docx) Extraction</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira">
            Extracts full document text, heading hierarchies, line layouts, and compiles real OpenXML .docx
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-fira text-xs font-semibold border border-cyan-500/40">
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 md:col-span-1">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-white truncate">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 md:col-span-2 flex flex-wrap items-center gap-4 text-xs font-fira">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.detectHeadings}
                  onChange={(e) => setOptions({ ...options, detectHeadings: e.target.checked })}
                  className="rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-400"
                />
                Auto-Detect Headings
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.includePageBreaks}
                  onChange={(e) => setOptions({ ...options, includePageBreaks: e.target.checked })}
                  className="rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-400"
                />
                Preserve Page Breaks
              </label>
            </div>
          </div>

          {isProcessing && (
            <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-fira">
                <span className="text-cyan-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  {statusMessage}
                </span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!convertedBlob ? (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setFile(null);
                  sfx.playClick();
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-fira text-xs transition-colors cursor-pointer"
              >
                Change File
              </button>
              <button
                onClick={processPdfToWord}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Convert to Word (.docx)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-orbitron">
                      DOCX Ready for Microsoft Word & LibreOffice
                    </h4>
                    <p className="text-xs text-slate-400 font-fira">
                      Extracted {extractedData.length} formatted paragraphs across pages
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download .docx
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 max-h-56 overflow-y-auto space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-fira sticky top-0 bg-[#080A10]/90 py-1">
                  Extracted Document Preview
                </h5>
                {extractedData.slice(0, 15).map((p, idx) => (
                  <div 
                    key={idx} 
                    className={`text-xs font-fira p-1.5 rounded ${
                      p.isHeading 
                        ? 'text-cyan-300 font-bold bg-cyan-500/10 border-l-2 border-cyan-400 pl-2' 
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 mr-2">[P{p.pageNumber}]</span>
                    {p.text}
                  </div>
                ))}
                {extractedData.length > 15 && (
                  <p className="text-[11px] text-slate-500 italic text-center pt-2">
                    ...and {extractedData.length - 15} more paragraphs compiled into .docx
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setConvertedBlob(null);
                    setExtractedData([]);
                    sfx.playClick();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-fira text-xs"
                >
                  Reconfigure
                </button>
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Save Word Document (.docx)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
