import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Award, 
  AlertTriangle, 
  TrendingUp 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface ResumeAtsReviewerToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const ResumeAtsReviewerTool: React.FC<ResumeAtsReviewerToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<{ found: string[]; missing: string[] }>({ found: [], missing: [] });
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadAndReviewResume(preloadedFile);
    }
  }, [preloadedFile]);

  const loadAndReviewResume = async (f: File) => {
    try {
      setFile(f);
      setIsScanning(true);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let rawText = '';
      for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        rawText += ' ' + textContent.items.map((it: any) => it.str).join(' ');
      }

      const lowerText = rawText.toLowerCase();

      // Core industry power keywords
      const targetKeywords = [
        'react', 'typescript', 'architecture', 'scalability', 'performance',
        'api', 'docker', 'ci/cd', 'leadership', 'optimization', 'cloud', 'python'
      ];

      const foundKw = targetKeywords.filter((kw) => lowerText.includes(kw));
      const missingKw = targetKeywords.filter((kw) => !lowerText.includes(kw));

      // Calculate ATS Score out of 100
      let computedScore = 60 + Math.round((foundKw.length / targetKeywords.length) * 35);
      if (totalPages > 2) computedScore -= 10; // Penalize overly long resumes
      if (!lowerText.includes('experience') || !lowerText.includes('education')) computedScore -= 15;

      computedScore = Math.max(30, Math.min(98, computedScore));

      const recs: string[] = [];
      if (totalPages > 2) recs.push('Condense resume to 1-2 pages for standard ATS parsing compliance.');
      if (missingKw.length > 0) recs.push(`Incorporate key industry skills: ${missingKw.slice(0, 3).join(', ')}.`);
      recs.push('Ensure metrics and quantifiable achievements are highlighted with percentage increases or revenue impact.');

      setScore(computedScore);
      setKeywords({ found: foundKw, missing: missingKw });
      setRecommendations(recs);

      sfx.playSuccess();
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('ATS scan error:', err);
      alert('Could not parse resume text.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a Resume / CV for ATS Scoring</h4>
            <p className="text-xs text-slate-400 mt-1">Evaluates keyword density, formatting compliance, and parsing readability.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select Resume File</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadAndReviewResume(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Score Banner */}
          {score !== null && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-fira font-bold uppercase text-emerald-400 tracking-wider block">
                  ATS Readability Index
                </span>
                <h3 className="text-3xl font-black font-orbitron text-white mt-1">
                  {score}<span className="text-lg text-slate-400">/100</span>
                </h3>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300">
                <Award className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Keywords Found & Missing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-fira">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-emerald-400 font-bold block">✓ Detected ATS Keywords ({keywords.found.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {keywords.found.map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {k}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-amber-400 font-bold block">⚠ Missing High-Impact Keywords ({keywords.missing.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {keywords.missing.map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-fira">
            <span className="text-cyan-400 font-bold block">Optimization Recommendations:</span>
            <ul className="space-y-1 text-slate-300">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Local ATS parser • Zero data storage</span>
        </div>

        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
          Close Reviewer
        </button>
      </div>
    </div>
  );
};