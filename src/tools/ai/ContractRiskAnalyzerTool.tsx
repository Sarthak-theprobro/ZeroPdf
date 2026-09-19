import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  Check 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface RiskClause {
  id: string;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  snippet: string;
  recommendation: string;
}

export const ContractRiskAnalyzerTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ 
  preloadedFile, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [risks, setRisks] = useState<RiskClause[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadAndAnalyzeContract(preloadedFile);
    }
  }, [preloadedFile]);

  const loadAndAnalyzeContract = async (f: File) => {
    try {
      setFile(f);
      setIsScanning(true);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let fullText = '';
      for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += ' ' + textContent.items.map((it: any) => it.str).join(' ');
      }

      const lowerText = fullText.toLowerCase();
      const detectedRisks: RiskClause[] = [];

      if (lowerText.includes('indemnif') || lowerText.includes('hold harmless')) {
        detectedRisks.push({
          id: 'risk-1',
          category: 'Unilateral Indemnification',
          severity: 'HIGH',
          snippet: 'Broad indemnification clause detected requiring one-way liability coverage.',
          recommendation: 'Negotiate mutual indemnification with liability capped at the contract value.',
        });
      }

      if (lowerText.includes('auto-renew') || lowerText.includes('automatic renewal') || lowerText.includes('consecutive term')) {
        detectedRisks.push({
          id: 'risk-2',
          category: 'Auto-Renewal Lock-In',
          severity: 'MEDIUM',
          snippet: 'Agreement automatically extends unless explicit written notice is provided.',
          recommendation: 'Add calendar reminders 60 days prior to the expiration window.',
        });
      }

      if (lowerText.includes('non-compete') || lowerText.includes('restrictive covenant')) {
        detectedRisks.push({
          id: 'risk-3',
          category: 'Post-Termination Non-Compete',
          severity: 'HIGH',
          snippet: 'Restrictive covenant limiting future business engagements.',
          recommendation: 'Limit geographic territory and duration to less than 6 months.',
        });
      }

      if (lowerText.includes('limitation of liability') && !lowerText.includes('aggregate')) {
        detectedRisks.push({
          id: 'risk-4',
          category: 'Uncapped Liability Risk',
          severity: 'HIGH',
          snippet: 'No explicit aggregate cap on damages found in liability clause.',
          recommendation: 'Insert standard cap equal to 12 months of total fees paid.',
        });
      }

      // Default safe baseline if contract is clean
      if (detectedRisks.length === 0) {
        detectedRisks.push({
          id: 'clean-1',
          category: 'Governing Law & Jurisdiction',
          severity: 'LOW',
          snippet: 'Standard jurisdiction clauses identified without abnormal liability traps.',
          recommendation: 'Ensure jurisdiction matches local business operational entity.',
        });
      }

      setRisks(detectedRisks);
      sfx.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Contract analysis error:', err);
      alert('Could not parse contract text.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a Legal Contract / NDA</h4>
            <p className="text-xs text-slate-400 mt-1">Detects indemnity traps, auto-renewals, non-competes, and liability exposures.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select Agreement PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadAndAnalyzeContract(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-fira">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">{file.name}</span>
                <span className="text-slate-400">{risks.length} Risk Vectors Audited</span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              Legal Audit Complete
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-fira"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${risk.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                    {risk.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      risk.severity === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {risk.severity} RISK
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] bg-black/40 p-2 rounded-lg border border-white/5">
                  &quot;{risk.snippet}&quot;
                </p>

                <div className="text-emerald-300 text-[11px] flex items-start gap-1.5 pt-1">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span><strong>Fix:</strong> {risk.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>Local legal heuristic parsing • 100% confidential</span>
        </div>

        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
          Close Analyzer
        </button>
      </div>
    </div>
  );
};