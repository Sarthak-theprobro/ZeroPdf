import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/common/NotificationToast';
import { AuthProvider } from '@/core/auth/AuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { PricingModal } from '@/components/pricing/PricingModal';
import { PaymentCheckoutModal } from '@/components/pricing/PaymentCheckoutModal';
import { Navbar } from '@/components/hud/Navbar';
import { TelemetryBar } from '@/components/hud/TelemetryBar';
import { ToolGrid } from '@/components/hud/ToolGrid';
import { UniversalDropzone } from '@/components/hero/UniversalDropzone';
import { AirGapShield } from '@/components/hero/AirGapShield';
import { BatchProcessingHub } from '@/components/hero/BatchProcessingHub';
import { PhysicsBackground } from '@/components/hero/PhysicsBackground';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { ToolsDirectoryDrawer } from '@/components/hud/ToolsDirectoryDrawer';

// ─────────────────────────────────────────────────────────────
// 1. ESSENTIALS & IMPOSITION (13 TOOLS)
// ─────────────────────────────────────────────────────────────
import { MergePdfTool } from '@/tools/essentials/MergePdfTool';
import { SplitPdfTool } from '@/tools/essentials/SplitPdfTool';
import { SplitByTextTool } from '@/tools/essentials/SplitByTextTool';
import { SplitBySizeTool } from '@/tools/essentials/SplitBySizeTool';
import { SplitInHalfTool } from '@/tools/essentials/SplitInHalfTool';
import { SplitByBookmarksTool } from '@/tools/essentials/SplitByBookmarksTool';
import { AlternateMixPdfTool } from '@/tools/essentials/AlternateMixPdfTool';
import { CompressPdfTool } from '@/tools/essentials/CompressPdfTool';
import { RotatePdfTool } from '@/tools/essentials/RotatePdfTool';
import { OrganizePagesTool } from '@/tools/essentials/OrganizePagesTool';
import { NUpPdfTool } from '@/tools/essentials/NUpPdfTool';
import { CropPdfTool } from '@/tools/essentials/CropPdfTool';
import { FlipPdfTool } from '@/tools/essentials/FlipPdfTool';

// ─────────────────────────────────────────────────────────────
// 2. VECTOR STUDIO & VISUAL EDITOR (14 TOOLS)
// ─────────────────────────────────────────────────────────────
import { WatermarkPdfTool } from '@/tools/edit/WatermarkPdfTool';
import { SignPdfTool } from '@/tools/edit/SignPdfTool';
import { RedactPdfTool } from '@/tools/edit/RedactPdfTool';
import { EditPdfTextTool } from '@/tools/edit/EditPdfTextTool';
import { PageNumberTool } from '@/tools/edit/PageNumberTool';
import { InvertPdfColorsTool } from '@/tools/edit/InvertPdfColorsTool';
import { FlattenPdfTool } from '@/tools/edit/FlattenPdfTool';
import { VectorAnnotateTool } from '@/tools/ai/VectorAnnotateTool';
import { HandwritingSimulatorTool } from '@/tools/edit/HandwritingSimulatorTool';
import { HeadersFootersTool } from '@/tools/edit/HeadersFootersTool';
import { WhiteoutPdfTool } from '@/tools/edit/WhiteoutPdfTool';
import { BatesNumberingTool } from '@/tools/edit/BatesNumberingTool';
import { FillFormPdfTool } from '@/tools/edit/FillFormPdfTool';
import { CreateFormFieldsTool } from '@/tools/edit/CreateFormFieldsTool';

// ─────────────────────────────────────────────────────────────
// 3. SECURITY, CRYPTOGRAPHY & FORENSICS (9 TOOLS)
// ─────────────────────────────────────────────────────────────
import { EncryptPdfTool } from '@/tools/security/EncryptPdfTool';
import { UnlockPdfTool } from '@/tools/security/UnlockPdfTool';
import { RepairPdfTool } from '@/tools/security/RepairPdfTool';
import { AutoRedactPiiTool } from '@/tools/security/AutoRedactPiiTool';
import { MetadataStripperTool } from '@/tools/security/MetadataStripperTool';
import { FingerprintPdfTool } from '@/tools/security/FingerprintPdfTool';
import { PdfSanitizerTool } from '@/tools/security/PdfSanitizerTool';
import { ForensicHexInspectorTool } from '@/tools/security/ForensicHexInspectorTool';
import { PdfAConverterTool } from '@/tools/security/PdfAConverterTool';

// ─────────────────────────────────────────────────────────────
// 4 & 5. UNIVERSAL CONVERTERS (21 TOOLS)
// ─────────────────────────────────────────────────────────────
import { ImagesToPdfTool } from '@/tools/convert/ImagesToPdfTool';
import { PdfToImagesTool } from '@/tools/convert/PdfToImagesTool';
import { MarkdownToPdfTool } from '@/tools/convert/MarkdownToPdfTool';
import { HtmlToPdfTool } from '@/tools/convert/HtmlToPdfTool';
import { WordToPdfTool } from '@/tools/convert/WordToPdfTool';
import { PdfToWordTool } from '@/tools/convert/PdfToWordTool';
import { ExcelToPdfTool } from '@/tools/convert/ExcelToPdfTool';
import { PdfToExcelTool } from '@/tools/convert/PdfToExcelTool';
import { CsvToPdfTool } from '@/tools/convert/CsvToPdfTool';
import { PdfToAudioTool } from '@/tools/convert/PdfToAudioTool';
import { PdfToMarkdownTool } from '@/tools/convert/PdfToMarkdownTool';
import { PdfToHtmlTool } from '@/tools/convert/PdfToHtmlTool';
import { PdfToZipTool } from '@/tools/convert/PdfToZipTool';
import { CreatePdfStudioTool } from '@/tools/convert/CreatePdfStudioTool';
import { JsonToPdfTool } from '@/tools/convert/JsonToPdfTool';
import { AudioToPdfTool } from '@/tools/convert/AudioToPdfTool';
import { PdfToSvgTool } from '@/tools/convert/PdfToSvgTool';
import { PptxToPdfTool } from '@/tools/convert/PptxToPdfTool';
import { PdfToPptxTool } from '@/tools/convert/PdfToPptxTool';
import { EbookToPdfTool } from '@/tools/convert/EbookToPdfTool';
import { PdfToEpubTool } from '@/tools/convert/PdfToEpubTool';

// ─────────────────────────────────────────────────────────────
// 6. AI INTELLIGENCE STUDIO (8 TOOLS)
// ─────────────────────────────────────────────────────────────
import { ChatWithPdfTool } from '@/tools/ai/ChatWithPdfTool';
import { SummarizePdfTool } from '@/tools/ai/SummarizePdfTool';
import { OcrPdfTool } from '@/tools/ai/OcrPdfTool';
import { ResumeAtsReviewerTool } from '@/tools/ai/ResumeAtsReviewerTool';
import { ContractRiskAnalyzerTool } from '@/tools/ai/ContractRiskAnalyzerTool';
import { QuizFlashcardGeneratorTool } from '@/tools/ai/QuizFlashcardGeneratorTool';
import { ComparePdfsTool } from '@/tools/ai/ComparePdfsTool';
import { TranslatePdfTool } from '@/tools/ai/TranslatePdfTool';

// ─────────────────────────────────────────────────────────────
// 7. CYBER SUPER-MODULES (4 TOOLS)
// ─────────────────────────────────────────────────────────────
import { FlipbookPresenter3D } from '@/tools/super/FlipbookPresenter3D';
import { NodeWorkflowBuilder } from '@/tools/super/NodeWorkflowBuilder';
import { P2pFileShareTool } from '@/tools/super/P2pFileShareTool';
import { CollabWhiteboardTool } from '@/tools/super/CollabWhiteboardTool';

// ─────────────────────────────────────────────────────────────
// 8. COMMERCE & INVOICING (4 TOOLS)
// ─────────────────────────────────────────────────────────────
import { GstInvoiceGeneratorTool } from '@/tools/business/GstInvoiceGeneratorTool';
import { PosThermalBillingTool } from '@/tools/business/PosThermalBillingTool';
import { EwayBillGeneratorTool } from '@/tools/business/EwayBillGeneratorTool';
import { GstFilingPrepTool } from '@/tools/business/GstFilingPrepTool';

import { ToolDefinition } from '@/core/types/tool';
import { sfx } from '@/core/audio/sfx';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { IconRenderer } from '@/components/common/IconRenderer';

function AppContent() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const [preloadedFile, setPreloadedFile] = useState<File | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sfx.playClick();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunchToolWithFile = (tool: ToolDefinition, file: File) => {
    setPreloadedFile(file);
    setActiveTool(tool);
  };

  const handleSelectTool = (tool: ToolDefinition) => {
    setPreloadedFile(null);
    setActiveTool(tool);
  };

  const handleCloseModal = () => {
    setActiveTool(null);
    setPreloadedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col aurora-bg text-slate-100 relative selection:bg-cyan-500 selection:text-black">
      
      {/* 1. Real-Time Interactive Particle Physics Gravity Background */}
      <PhysicsBackground />

      {/* 2. Top Studio Navbar */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenToolsDrawer={() => setIsToolsDrawerOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      {/* 3. Slide-in Tools Directory Mega-Drawer */}
      <ToolsDirectoryDrawer
        isOpen={isToolsDrawerOpen}
        onClose={() => setIsToolsDrawerOpen(false)}
        onSelectTool={handleSelectTool}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      <main className="flex-1 pb-16 relative z-10 space-y-10">
        {/* 3. Universal Dropzone Hero */}
        <UniversalDropzone onLaunchToolWithFile={handleLaunchToolWithFile} />

        {/* 4. Real-time Air-Gap Security Shield & Competitor Battle Matrix */}
        <AirGapShield />

        {/* 5. Parallel Multi-File Batch Automation Engine */}
        <BatchProcessingHub />

        {/* 6. Categorized Tools Grid (All 8 Hubs) */}
        <ToolGrid 
          onSelectTool={handleSelectTool} 
          activeCategory={activeCategory} 
          onSelectCategory={(cat) => setActiveCategory(cat)} 
        />
      </main>

      {/* Interactive Tool Modal */}
      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0c101c] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-cyan-300">
                  <IconRenderer name={activeTool.iconName} className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white font-orbitron">{activeTool.title}</h2>
                    {activeTool.badge && (
                      <span className="text-[10px] font-fira font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                        {activeTool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-fira">{activeTool.description}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  sfx.playClick();
                  handleCloseModal();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Stage Body with Dedicated Routing */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              <ErrorBoundary fallbackTitle={`Error executing ${activeTool.title}`} onReset={() => setPreloadedFile(null)}>
                {/* 1. Essentials & Imposition */}
                {activeTool.id === 'merge-pdf' ? (
                  <MergePdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
                ) : activeTool.id === 'alternate-mix-pdf' ? (
                  <AlternateMixPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'split-pdf' ? (
                <SplitPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'split-by-text' ? (
                <SplitByTextTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'split-by-size' ? (
                <SplitBySizeTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'split-in-half' ? (
                <SplitInHalfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'split-by-bookmarks' ? (
                <SplitByBookmarksTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'compress-pdf' ? (
                <CompressPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'rotate-pdf' ? (
                <RotatePdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'organize-pages' ? (
                <OrganizePagesTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'n-up-pdf' ? (
                <NUpPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'crop-resize-pdf' ? (
                <CropPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'flip-pdf' ? (
                <FlipPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />

              /* 2. Vector Studio & Visual Editor */
              ) : activeTool.id === 'add-watermark' ? (
                <WatermarkPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'sign-pdf' ? (
                <SignPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'redact-pdf' ? (
                <RedactPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'edit-pdf-text' ? (
                <EditPdfTextTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'vector-annotate' ? (
                <VectorAnnotateTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'add-page-numbers' ? (
                <PageNumberTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'invert-pdf-colors' ? (
                <InvertPdfColorsTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'flatten-pdf' ? (
                <FlattenPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'handwriting-simulator' ? (
                <HandwritingSimulatorTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'headers-footers' ? (
                <HeadersFootersTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'whiteout-pdf' ? (
                <WhiteoutPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'bates-numbering' ? (
                <BatesNumberingTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'fill-pdf-form' ? (
                <FillFormPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'create-form-fields' ? (
                <CreateFormFieldsTool preloadedFile={preloadedFile} onClose={handleCloseModal} />

              /* 3. Security, Cryptography & Forensics */
              ) : activeTool.id === 'encrypt-pdf' ? (
                <EncryptPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'unlock-pdf' ? (
                <UnlockPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'repair-pdf' ? (
                <RepairPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'auto-redact-pii' ? (
                <AutoRedactPiiTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'privacy-scanner' ? (
                <MetadataStripperTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'fingerprint-pdf' ? (
                <FingerprintPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-sanitizer' ? (
                <PdfSanitizerTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'forensic-inspector' ? (
                <ForensicHexInspectorTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-a-converter' ? (
                <PdfAConverterTool preloadedFile={preloadedFile} onClose={handleCloseModal} />

              /* 4 & 5. Universal Converters */
              ) : activeTool.id === 'images-to-pdf' ? (
                <ImagesToPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-jpg' ? (
                <PdfToImagesTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'markdown-to-pdf' ? (
                <MarkdownToPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'html-to-pdf' ? (
                <HtmlToPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'word-to-pdf' ? (
                <WordToPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-word' ? (
                <PdfToWordTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'excel-to-pdf' ? (
                <ExcelToPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-excel' ? (
                <PdfToExcelTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'csv-to-pdf' ? (
                <CsvToPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-audio' ? (
                <PdfToAudioTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-markdown' ? (
                <PdfToMarkdownTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-html' ? (
                <PdfToHtmlTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-zip' ? (
                <PdfToZipTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'create-pdf' ? (
                <CreatePdfStudioTool onClose={handleCloseModal} />
              ) : activeTool.id === 'json-to-pdf' ? (
                <JsonToPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'audio-to-pdf' ? (
                <AudioToPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-svg' ? (
                <PdfToSvgTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pptx-to-pdf' ? (
                <PptxToPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-pptx' ? (
                <PdfToPptxTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'ebook-to-pdf' ? (
                <EbookToPdfTool onClose={handleCloseModal} />
              ) : activeTool.id === 'pdf-to-epub' ? (
                <PdfToEpubTool preloadedFile={preloadedFile} onClose={handleCloseModal} />

              /* 6. AI Intelligence Studio */
              ) : activeTool.id === 'chat-with-pdf' ? (
                <ChatWithPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'summarize-pdf' ? (
                <SummarizePdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'ocr-searchable-pdf' ? (
                <OcrPdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'resume-ats-reviewer' ? (
                <ResumeAtsReviewerTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'contract-risk-analyzer' ? (
                <ContractRiskAnalyzerTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'quiz-flashcard-generator' ? (
                <QuizFlashcardGeneratorTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'compare-pdfs' ? (
                <ComparePdfsTool onClose={handleCloseModal} />
              ) : activeTool.id === 'translate-pdf' ? (
                <TranslatePdfTool preloadedFile={preloadedFile} onClose={handleCloseModal} />

              /* 7. Cyber Super-Modules */
              ) : activeTool.id === '3d-flipbook-presenter' ? (
                <FlipbookPresenter3D preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'node-workflow-builder' ? (
                <NodeWorkflowBuilder preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'p2p-file-share' ? (
                <P2pFileShareTool preloadedFile={preloadedFile} onClose={handleCloseModal} />
              ) : activeTool.id === 'collab-whiteboard' ? (
                <CollabWhiteboardTool preloadedFile={preloadedFile} onClose={handleCloseModal} />

              /* 8. Commerce & Invoicing */
              ) : activeTool.id === 'gst-invoice-generator' ? (
                <GstInvoiceGeneratorTool onClose={handleCloseModal} />
              ) : activeTool.id === 'pos-thermal-billing' ? (
                <PosThermalBillingTool onClose={handleCloseModal} />
              ) : activeTool.id === 'eway-bill-generator' ? (
                <EwayBillGeneratorTool onClose={handleCloseModal} />
              ) : activeTool.id === 'gst-filing-prep' ? (
                <GstFilingPrepTool onClose={handleCloseModal} />
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
                  {preloadedFile ? (
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 max-w-md w-full text-left">
                      <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">{preloadedFile.name}</h4>
                        <p className="text-xs text-emerald-400 flex items-center gap-1 font-fira">
                          <CheckCircle2 className="w-3.5 h-3.5" /> File Loaded In-Memory
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/20 flex items-center justify-center text-cyan-400">
                      <IconRenderer name={activeTool.iconName} className="w-10 h-10" />
                    </div>
                  )}

                  <div className="space-y-2 max-w-md">
                    <h3 className="text-lg font-semibold text-white font-orbitron">
                      {preloadedFile ? `Ready to process ${activeTool.title}` : `Drop files to execute ${activeTool.title}`}
                    </h3>
                    <p className="text-xs text-slate-400 font-fira leading-relaxed">
                      All binary processing runs 100% locally via multi-threaded Web Workers. No file is ever uploaded to any external server.
                    </p>
                  </div>
                </div>
              )}
              </ErrorBoundary>
            </div>

          </div>
        </div>
      )}

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTool={handleSelectTool}
      />

      {/* Modals: Auth, Profile, Pricing & Payment */}
      <AuthModal />
      <ProfileModal />
      <PricingModal />
      <PaymentCheckoutModal />

      {/* Engine Status Bar */}
      <TelemetryBar />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Recovery">
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}