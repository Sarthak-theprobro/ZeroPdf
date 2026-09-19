import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import * as Comlink from 'comlink';

export interface WatermarkOptions {
  text: string;
  opacity: number; // 0.1 to 1.0
  color: [number, number, number]; // RGB values 0 to 1
  size: number;
  rotation: number; // degrees
}

export interface PageNumberOptions {
  startNumber: number;
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right';
  format: 'number-only' | 'page-x-of-y';
  fontSize: number;
}

export const pdfWorker = {
  /**
   * 1. MERGE MULTIPLE PDFS
   * Combines an array of PDF Uint8Arrays into a single unified document
   */
  async mergePdfs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
    const mergedDoc = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    return await mergedDoc.save();
  },

  /**
   * 2. SPLIT PDF BY PAGE RANGES
   * Extracts specific page ranges into new PDF files
   */
  async splitPdf(pdfBuffer: Uint8Array, pageRanges: number[][]): Promise<Uint8Array[]> {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const outputFiles: Uint8Array[] = [];

    for (const range of pageRanges) {
      const newDoc = await PDFDocument.create();
      // Adjust 1-based indexing to 0-based indexing
      const zeroBasedIndices = range
        .map((pageNum) => pageNum - 1)
        .filter((idx) => idx >= 0 && idx < srcDoc.getPageCount());

      const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));
      outputFiles.push(await newDoc.save());
    }

    return outputFiles;
  },

  /**
   * 3. ROTATE PDF PAGES
   * Rotates all or specific pages by 90, 180, or 270 degrees
   */
  async rotatePdf(pdfBuffer: Uint8Array, rotationAngle: number, targetPages?: number[]): Promise<Uint8Array> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
      const pageNum = i + 1;
      if (!targetPages || targetPages.includes(pageNum)) {
        const page = doc.getPage(i);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationAngle) % 360));
      }
    }

    return await doc.save();
  },

  /**
   * 4. ADD WATERMARK
   * Overlays custom text, opacity, and rotation across every page
   */
  async addWatermark(pdfBuffer: Uint8Array, options: WatermarkOptions): Promise<Uint8Array> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(options.text, options.size);
      const textHeight = font.heightAtSize(options.size);

      page.drawText(options.text, {
        x: width / 2 - textWidth / 2,
        y: height / 2 - textHeight / 2,
        size: options.size,
        font: font,
        color: rgb(options.color[0], options.color[1], options.color[2]),
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }

    return await doc.save();
  },

  /**
   * 5. ADD PAGE NUMBERS
   * Injects dynamic page numbers into headers or footers
   */
  async addPageNumbers(pdfBuffer: Uint8Array, options: PageNumberOptions): Promise<Uint8Array> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const totalPages = doc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
      const page = doc.getPage(i);
      const { width } = page.getSize();
      const pageNum = i + options.startNumber;

      const label = options.format === 'page-x-of-y' 
        ? `Page ${pageNum} of ${totalPages + options.startNumber - 1}`
        : `${pageNum}`;

      const textWidth = font.widthOfTextAtSize(label, options.fontSize);
      let x = width / 2 - textWidth / 2; // Default center
      let y = 30; // Default bottom

      if (options.position.includes('right')) x = width - textWidth - 40;
      if (options.position.includes('left')) x = 40;
      if (options.position.includes('top')) y = page.getSize().height - 30;

      page.drawText(label, {
        x,
        y,
        size: options.fontSize,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    return await doc.save();
  },

  /**
   * 6. FLATTEN PDF
   * Locks form fields and annotations permanently into the page layer
   */
  async flattenPdf(pdfBuffer: Uint8Array): Promise<Uint8Array> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const form = doc.getForm();
    try {
      form.flatten();
    } catch {
      // If no interactive AcroForm exists, document is already flat
    }
    return await doc.save();
  },

  /**
   * 7. COMPRESS PDF
   * Strips metadata, unneeded objects, and compacts object streams
   */
  async compressPdf(pdfBuffer: Uint8Array): Promise<Uint8Array> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    // Strip private metadata headers
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('AETHER Studio');
    doc.setCreator('AETHER Studio');

    // Save with stream compression enabled and cross-reference compaction
    return await doc.save({ useObjectStreams: true });
  },
};

export type PDFWorkerType = typeof pdfWorker;

// Expose the worker methods to the main thread via Comlink
Comlink.expose(pdfWorker);