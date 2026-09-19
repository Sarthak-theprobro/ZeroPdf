import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Download, 
  Sparkles, 
  Volume2, 
  FileText, 
  CheckCircle2, 
  Radio 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

export const AudioToPdfTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(
    'Meeting commenced at 09:30 AM. Reviewed architecture milestones for client-side zero-knowledge PDF Mega-Workstation. All 60+ tool modules verified for local in-browser compilation with zero cloud telemetry.'
  );
  const [meetingTitle, setMeetingTitle] = useState<string>('Executive Board Minutes');
  const [speaker, setSpeaker] = useState<string>('Chief Architect');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    // Check Web Speech API Support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript((prev) => `${prev} ${current}`);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognitionInstance(recognition);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionInstance) {
      alert('Speech Recognition is supported in Chrome, Edge, and Safari.');
      return;
    }

    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
      sfx.playClick();
    } else {
      recognitionInstance.start();
      setIsRecording(true);
      sfx.playSuccess();
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsProcessing(true);
      sfx.playScan();

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      const margin = 45;
      let currentY = height - margin;

      // Header Banner
      page.drawRectangle({
        x: margin,
        y: currentY - 30,
        width: width - (margin * 2),
        height: 30,
        color: rgb(0.1, 0.15, 0.3),
      });

      page.drawText(meetingTitle.toUpperCase(), {
        x: margin + 12,
        y: currentY - 20,
        size: 12,
        font: fontBold,
        color: rgb(1.0, 1.0, 1.0),
      });
      currentY -= 50;

      // Metadata details
      page.drawText(`Speaker / Lead: ${speaker}`, {
        x: margin,
        y: currentY,
        size: 9,
        font: fontBold,
        color: rgb(0.3, 0.4, 0.6),
      });
      page.drawText(`Recorded Date: ${new Date().toLocaleString()}`, {
        x: width - margin - 200,
        y: currentY,
        size: 9,
        font,
        color: rgb(0.3, 0.4, 0.6),
      });
      currentY -= 25;

      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: width - margin, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 20;

      // Transcript Text
      const words = transcript.split(' ');
      let line = '';
      const maxLineWidth = width - (margin * 2);

      for (const word of words) {
        const testLine = line + word + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        if (testWidth > maxLineWidth) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          line = word + ' ';
          currentY -= 16;
        } else {
          line = testLine;
        }
      }
      if (line) {
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: 10,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meetingTitle.toLowerCase().replace(/\s+/g, '-')}-transcript.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Audio to PDF error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          placeholder="Meeting / Transcript Title"
          className="rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-purple-400 focus:outline-none"
        />
        <input
          type="text"
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
          placeholder="Speaker / Moderator Name"
          className="rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-purple-400 focus:outline-none"
        />
      </div>

      {/* Voice Recording Control Bar */}
      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-2xl font-bold flex items-center gap-2 text-xs font-fira cursor-pointer transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-purple-500 text-black hover:bg-purple-400'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop Voice Recording' : 'Start Live Dictation'}
          </button>
          <span className="text-xs text-purple-300 font-fira">
            {isRecording ? 'Listening in real-time via Web Speech API...' : 'Ready to dictate or type minutes'}
          </span>
        </div>
      </div>

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={10}
        className="w-full rounded-2xl bg-black/60 border border-white/10 p-3.5 text-xs font-fira text-slate-200 focus:border-purple-400 focus:outline-none resize-none leading-relaxed"
        placeholder="Audio speech transcript will appear here..."
      />

      <div className="flex justify-end pt-2">
        <button
          onClick={handleExportPdf}
          disabled={!transcript.trim() || isProcessing}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Compile Transcript PDF
        </button>
      </div>
    </div>
  );
};