import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  RotateCw, 
  FileText, 
  HelpCircle 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface Flashcard {
  id: string;
  front: string;
  back: string;
  isFlipped: boolean;
}

export const QuizFlashcardGeneratorTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ 
  preloadedFile, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadAndGenerateCards(preloadedFile);
    }
  }, [preloadedFile]);

  const loadAndGenerateCards = async (f: File) => {
    try {
      setFile(f);
      setIsGenerating(true);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let extracted = '';
      for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        extracted += ' ' + textContent.items.map((it: any) => it.str).join(' ');
      }

      const sentences = extracted.split(/[.!?]+/).filter((s) => s.trim().length > 30);
      const generatedCards: Flashcard[] = sentences.slice(0, 6).map((s, idx) => ({
        id: `card-${idx}`,
        front: `Concept Question #${idx + 1}: What does the text state regarding "${s.trim().slice(0, 40)}..."?`,
        back: `Key Principle: ${s.trim()}`,
        isFlipped: false,
      }));

      setCards(generatedCards);
      setActiveCardIdx(0);
      sfx.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error(err);
      alert('Could not parse text for study flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const flipCard = (idx: number) => {
    sfx.playClick();
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, isFlipped: !c.isFlipped } : c))
    );
  };

  const currentCard = cards[activeCardIdx];

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a Textbook, Article, or Manual</h4>
            <p className="text-xs text-slate-400 mt-1">Generates interactive study flashcards and conceptual review cards.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select Study PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadAndGenerateCards(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira">
            <span className="text-white font-bold">{file.name}</span>
            <span className="text-purple-400">Card {activeCardIdx + 1} of {cards.length}</span>
          </div>

          {/* Interactive Flip Card 3D Stage */}
          {currentCard && (
            <div
              onClick={() => flipCard(activeCardIdx)}
              className="relative h-56 rounded-3xl bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/30 p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl hover:border-purple-500/50 transition-all group select-none"
            >
              <div className="text-[10px] font-fira font-bold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> {currentCard.isFlipped ? 'ANSWER (BACK)' : 'QUESTION (FRONT)'}
              </div>

              <p className="text-sm font-fira text-white leading-relaxed max-w-md">
                {currentCard.isFlipped ? currentCard.back : currentCard.front}
              </p>

              <span className="text-[10px] font-fira text-slate-500 mt-4 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Click card to flip
              </span>
            </div>
          )}

          {/* Card Carousel Navigation */}
          <div className="flex justify-center gap-2 pt-2">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  sfx.playHover();
                  setActiveCardIdx(i);
                }}
                className={`w-8 h-8 rounded-xl text-xs font-fira font-bold transition-all ${
                  activeCardIdx === i
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Natural concept extraction • On-device study deck</span>
        </div>

        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
          Close Flashcards
        </button>
      </div>
    </div>
  );
};