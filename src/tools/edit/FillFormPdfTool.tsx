import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  UploadCloud, 
  Download, 
  Sparkles, 
  FormInput,
  Layers2
} from 'lucide-react';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

interface FillFormPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'unknown';
  value: string | boolean;
  options?: string[];
}

export const FillFormPdfTool: React.FC<FillFormPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [flatten, setFlatten] = useState(false);
  const [filledBlob, setFilledBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setFilledBlob(null);
    sfx.playClick();

    try {
      setIsProcessing(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      const rawFields = form.getFields();
      const extracted: FormFieldItem[] = [];

      for (const field of rawFields) {
        const name = field.getName();
        if (field instanceof PDFTextField) {
          extracted.push({ name, type: 'text', value: field.getText() || '' });
        } else if (field instanceof PDFCheckBox) {
          extracted.push({ name, type: 'checkbox', value: field.isChecked() });
        } else if (field instanceof PDFDropdown) {
          extracted.push({ name, type: 'dropdown', value: field.getSelected()[0] || '', options: field.getOptions() });
        } else if (field instanceof PDFRadioGroup) {
          extracted.push({ name, type: 'radio', value: field.getSelected() || '', options: field.getOptions() });
        } else {
          extracted.push({ name, type: 'text', value: '' });
        }
      }

      if (extracted.length === 0) {
        setFields([
          { name: 'Full Name', type: 'text', value: '' },
          { name: 'Email Address', type: 'text', value: '' },
          { name: 'Date', type: 'text', value: new Date().toISOString().split('T')[0] },
          { name: 'Agreed to Terms', type: 'checkbox', value: false },
        ]);
      } else {
        setFields(extracted);
      }
    } catch (err) {
      console.error('Form field detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (index: number, val: string | boolean) => {
    const updated = [...fields];
    updated[index].value = val;
    setFields(updated);
  };

  const handleSaveFilledPdf = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const form = pdfDoc.getForm();

      for (const f of fields) {
        try {
          if (f.type === 'text') {
            const tf = form.getTextField(f.name);
            tf.setText(String(f.value));
          } else if (f.type === 'checkbox') {
            const cb = form.getCheckBox(f.name);
            if (f.value) cb.check(); else cb.uncheck();
          } else if (f.type === 'dropdown') {
            const dd = form.getDropdown(f.name);
            if (f.value) dd.select(String(f.value));
          }
        } catch {}
      }

      if (flatten) form.flatten();

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes as any], { type: 'application/pdf' });
      setFilledBlob(blob);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Fill form error:', err);
      alert('Failed to save filled PDF form.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!filledBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(filledBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-filled.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-blue-500/30 hover:border-blue-400/60 rounded-3xl bg-blue-950/10 cursor-pointer transition-all hover:bg-blue-950/20 group">
          <CheckSquare className="w-14 h-14 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop Fillable AcroForm PDF</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Auto-detects interactive form inputs, checkboxes, dropdowns, and fills values in-memory.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 font-fira text-xs font-semibold border border-blue-500/40">Select PDF Form</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); }} />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300"><FormInput className="w-6 h-6" /></div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-blue-300 font-fira">{fields.length} Interactive Form Fields</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-fira text-slate-300 cursor-pointer hover:text-white">
                <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className="rounded border-white/20 bg-black/40 text-blue-500" />
                Flatten Form (Lock Inputs)
              </label>
              <button onClick={() => { setFile(null); setFilledBlob(null); }} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira">Change File</button>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 max-h-[460px] overflow-y-auto space-y-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-fira">Detected Interactive Inputs</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 font-fira truncate block">{field.name}</label>
                  {field.type === 'text' && (
                    <input type="text" value={String(field.value)} onChange={(e) => handleFieldChange(idx, e.target.value)} placeholder={`Enter ${field.name}...`} className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-2.5 text-xs font-fira focus:border-cyan-400 focus:outline-none" />
                  )}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2 text-xs font-fira text-slate-200 cursor-pointer pt-1">
                      <input type="checkbox" checked={Boolean(field.value)} onChange={(e) => handleFieldChange(idx, e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500" />
                      <span>Enable / Checked</span>
                    </label>
                  )}
                  {field.type === 'dropdown' && field.options && (
                    <select value={String(field.value)} onChange={(e) => handleFieldChange(idx, e.target.value)} className="w-full rounded-xl bg-black/60 border border-white/10 text-white p-2.5 text-xs font-fira focus:border-cyan-400 focus:outline-none">
                      {field.options.map((opt, oIdx) => (<option key={oIdx} value={opt}>{opt}</option>))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {!filledBlob ? (
              <button onClick={handleSaveFilledPdf} disabled={isProcessing} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" /> Fill & Compile PDF
              </button>
            ) : (
              <button onClick={handleDownload} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> Download Filled PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};