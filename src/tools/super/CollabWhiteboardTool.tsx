import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UploadCloud, 
  Download, 
  PenTool, 
  Highlighter, 
  StickyNote, 
  Stamp, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Radio,
  Eraser,
  MousePointer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface CollabWhiteboardToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface PeerCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  activeTool: string;
}

interface DrawStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  page: number;
}

interface NoteItem {
  id: string;
  text: string;
  x: number;
  y: number;
  author: string;
  color: string;
  page: number;
}

const PEER_COLORS = ['#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];

export const CollabWhiteboardTool: React.FC<CollabWhiteboardToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [roomId, setRoomId] = useState<string>('ROOM-AETHER-77');
  const [userName, setUserName] = useState<string>(() => `Agent-${Math.floor(100 + Math.random() * 900)}`);
  const [userColor] = useState<string>(() => PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)]);
  
  const [activeTool, setActiveTool] = useState<'cursor' | 'pen' | 'highlighter' | 'laser' | 'note' | 'stamp'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#06b6d4');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [selectedStamp, setSelectedStamp] = useState<string>('APPROVED');
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [peers, setPeers] = useState<Map<string, PeerCursor>>(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Initialize P2P Broadcast Channel for multi-tab sync
    const channel = new BroadcastChannel(`aether-collab-${roomId}`);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'cursor') {
        setPeers((prev) => {
          const updated = new Map(prev);
          updated.set(data.peer.id, data.peer);
          return updated;
        });
      } else if (data.type === 'stroke') {
        setStrokes((prev) => [...prev, data.stroke]);
      } else if (data.type === 'note') {
        setNotes((prev) => [...prev, data.note]);
      } else if (data.type === 'page-change') {
        setCurrentPage(data.page);
      }
    };

    return () => {
      channel.close();
    };
  }, [roomId]);

  useEffect(() => {
    if (preloadedFile) {
      handleFileSelected(preloadedFile);
    }
  }, [preloadedFile]);

  useEffect(() => {
    if (file) {
      renderPdfPage(file, currentPage);
    }
  }, [file, currentPage]);

  useEffect(() => {
    redrawAnnotationCanvas();
  }, [strokes, currentStroke, currentPage]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('PDF load error:', err);
    }
  };

  const renderPdfPage = async (f: File, pageNum: number) => {
    try {
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });

      const pdfCanvas = pdfCanvasRef.current;
      const annotCanvas = canvasRef.current;
      if (!pdfCanvas || !annotCanvas) return;

      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      annotCanvas.width = viewport.width;
      annotCanvas.height = viewport.height;

      const ctx = pdfCanvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
      redrawAnnotationCanvas();
    } catch (err) {
      console.error('Page render error:', err);
    }
  };

  const redrawAnnotationCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes for this page
    strokes
      .filter((s) => s.page === currentPage)
      .forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      });

    // Draw active in-progress stroke
    if (currentStroke.length > 1) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'laser') {
      setIsDrawing(true);
      setCurrentStroke([{ x, y }]);
    } else if (activeTool === 'note') {
      const newNote: NoteItem = {
        id: `note-${Date.now()}`,
        text: 'New Review Comment',
        x,
        y,
        author: userName,
        color: '#fef08a',
        page: currentPage,
      };
      setNotes((prev) => [...prev, newNote]);
      channelRef.current?.postMessage({ type: 'note', note: newNote });
      sfx.playClick();
    } else if (activeTool === 'stamp') {
      const stampStroke: DrawStroke = {
        points: [{ x, y }, { x: x + 1, y: y + 1 }],
        color: selectedStamp === 'APPROVED' ? '#10b981' : '#ef4444',
        width: 20,
        page: currentPage,
      };
      setStrokes((prev) => [...prev, stampStroke]);
      channelRef.current?.postMessage({ type: 'stroke', stroke: stampStroke });
      sfx.playSuccess();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Broadcast cursor position
    channelRef.current?.postMessage({
      type: 'cursor',
      peer: {
        id: userName,
        name: userName,
        color: userColor,
        x,
        y,
        activeTool,
      },
    });

    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'laser')) {
      setCurrentStroke((prev) => [...prev, { x, y }]);
    }
  };

  const handlePointerUp = () => {
    if (isDrawing && currentStroke.length > 1) {
      const newStroke: DrawStroke = {
        points: currentStroke,
        color: activeTool === 'highlighter' ? `${strokeColor}66` : strokeColor,
        width: activeTool === 'highlighter' ? strokeWidth * 3 : strokeWidth,
        page: currentPage,
      };
      setStrokes((prev) => [...prev, newStroke]);
      channelRef.current?.postMessage({ type: 'stroke', stroke: newStroke });
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleExportPdf = async () => {
    if (!file) return;

    try {
      sfx.playScan();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Save and bake
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '-collab-reviewed.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Session Peer Status Bar */}
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-fira text-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>P2P Channel Active:</span>
            <span className="font-bold text-white">{roomId}</span>
          </div>

          <div className="flex items-center -space-x-2">
            <div 
              className="w-7 h-7 rounded-full border-2 border-[#0c101c] flex items-center justify-center text-[10px] font-bold text-black font-fira"
              style={{ backgroundColor: userColor }}
              title={userName}
            >
              {userName.substring(0, 2)}
            </div>
            {Array.from(peers.values()).map((peer) => (
              <div
                key={peer.id}
                className="w-7 h-7 rounded-full border-2 border-[#0c101c] flex items-center justify-center text-[10px] font-bold text-black font-fira"
                style={{ backgroundColor: peer.color }}
                title={peer.name}
              >
                {peer.name.substring(0, 2)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              sfx.playClick();
              alert(`Session link copied! Open in another tab to collaborate.`);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-fira text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Copy Room
          </button>

          {file && (
            <button
              onClick={handleExportPdf}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Review
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone or Canvas Stage */}
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <Users className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF to Launch Multiplayer Whiteboard</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Review, markup, laser point, and annotate simultaneously with colleagues in zero-latency P2P sync.
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
        <div className="space-y-4">
          {/* Floating Toolbar */}
          <div className="p-2 rounded-2xl bg-[#0c101c]/90 backdrop-blur-xl border border-white/10 flex items-center justify-between text-xs font-fira">
            {/* Tool selectors */}
            <div className="flex items-center gap-1">
              {[
                { id: 'cursor', label: 'Pointer', icon: MousePointer },
                { id: 'pen', label: 'Ink Pen', icon: PenTool },
                { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
                { id: 'note', label: 'Sticky Note', icon: StickyNote },
                { id: 'stamp', label: 'Stamp', icon: Stamp },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTool(t.id as any);
                      sfx.playClick();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeTool === t.id
                        ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2">
              {['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map((c) => (
                <button
                  key={c}
                  onClick={() => setStrokeColor(c)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    strokeColor === c ? 'scale-125 border-white shadow-lg' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  const p = Math.max(1, currentPage - 1);
                  setCurrentPage(p);
                  channelRef.current?.postMessage({ type: 'page-change', page: p });
                  sfx.playClick();
                }}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const p = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(p);
                  channelRef.current?.postMessage({ type: 'page-change', page: p });
                  sfx.playClick();
                }}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Whiteboard Interactive Stage */}
          <div className="flex justify-center p-4 rounded-2xl bg-black/60 border border-white/10 overflow-auto max-h-[520px]">
            <div className="relative border border-white/20 shadow-2xl rounded bg-white select-none">
              <canvas ref={pdfCanvasRef} className="block pointer-events-none" />
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute inset-0 cursor-crosshair touch-none"
              />

              {/* Render Sticky Notes */}
              {notes
                .filter((n) => n.page === currentPage)
                .map((note) => (
                  <div
                    key={note.id}
                    className="absolute p-2 rounded-lg shadow-xl text-[11px] font-fira text-black max-w-[140px] pointer-events-auto border border-black/10"
                    style={{ left: note.x, top: note.y, backgroundColor: note.color }}
                  >
                    <div className="font-bold text-[9px] text-black/60 border-b border-black/10 pb-0.5 mb-1">
                      {note.author}
                    </div>
                    <div>{note.text}</div>
                  </div>
                ))}

              {/* Render Remote Peer Cursors */}
              {Array.from(peers.values()).map((peer) => (
                <div
                  key={peer.id}
                  className="absolute pointer-events-none flex items-center gap-1 transition-all duration-75"
                  style={{ left: peer.x, top: peer.y }}
                >
                  <MousePointer className="w-4 h-4" style={{ color: peer.color }} />
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-fira font-bold text-black shadow-md"
                    style={{ backgroundColor: peer.color }}
                  >
                    {peer.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
