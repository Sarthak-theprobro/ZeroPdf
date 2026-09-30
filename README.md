# ⚡ ZeroPDF — Sovereign Air-Gapped PDF Mega-Workstation

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20App-zeropdf--rho.vercel.app-00dfa2?style=for-the-badge&logo=vercel&logoColor=black)](https://zeropdf-rho.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![0 Bytes Uploaded](https://img.shields.io/badge/Cloud%20Uploads-0%20Bytes-emerald.svg?style=for-the-badge&logo=shield&logoColor=white)](#-air-gapped-security-architecture)

**73+ Sovereign PDF & Document Tools running 100% locally in your browser with multi-threaded WebAssembly.**  
*Zero cloud surveillance. Zero server costs. Zero file size limits.*

[🌐 **Launch Live App**](https://zeropdf-rho.vercel.app) • [📖 **Explore 73+ Tools**](#-complete-73-tool-arsenal) • [🛡️ **Security Architecture**](#-air-gapped-security-architecture) • [🚀 **Quickstart**](#-quickstart--local-development)

</div>

---

## 🌟 Why ZeroPDF?

Most commercial PDF utilities (e.g., ILovePDF, Smallpdf, Adobe Web) upload your confidential contracts, financial statements, tax records, and medical files to third-party cloud servers for processing.

**ZeroPDF eliminates cloud processing entirely.** Every single binary manipulation, compression, conversion, optical character recognition (OCR), and AI synthesis runs **100% locally inside your browser's private Web Worker memory**. 

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                │
│                                                                         │
│   [File Intake] ──► [In-RAM Buffer] ──► [WebAssembly / Web Workers]     │
│                             │                          │                │
│                             ▼                          ▼                │
│                     [Memory Shredder]        [Instant Vector Download]  │
│                                                                         │
│   ❌ NO SERVER UPLOADS   ❌ NO DATABASE LOGGING   ❌ NO COOKIE TRACKING │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Complete 73+ Tool Arsenal

### 1. 📑 Core Essentials & Page Imposition (16 Tools)
* **Merge PDF** — Combine unlimited documents with re-ordering & rotation.
* **Split PDF** — Split by custom page ranges, file size, text delimiters, or in half.
* **Alternate Mix** — Interleave scanned odd & even pages seamlessly.
* **Rotate & Crop** — Precision multi-angle rotation and visual bounding box clipping.
* **N-Up Multi-Page Imposition** — 2-up, 4-up, 9-up imposition layouts on single sheets.
* **Booklet Maker** — Imposition ordering for center-stapled print booklets.
* **Posterize Large PDF** — Tile large multi-meter designs across standard A4/A3 pages.
* **Color Inversion / Dark Mode** — Invert PDF colors for ink savings and low-light reading.
* **Add Page Numbers, Header/Footer, & Watermarks** — Vector typography stamping.

### 2. 🛡️ Military-Grade Security & Privacy (12 Tools)
* **AES-256 Encrypt & Decrypt** — Cryptographic password protection and permissions locking.
* **Auto-Redact PII** — Regex-powered redaction for SSNs, credit cards, emails, and phone numbers.
* **Digital Signature & Seal** — Draw, type, or stamp vector digital signatures with audit trails.
* **Flatten Annotations** — Bake form fields and vector annotations into immutable base layers.
* **Metadata Sanitizer** — Strip author names, GPS coordinates, editing software, and timestamps.
* **PDF Repair & Rebuild** — Reconstruct corrupt cross-reference tables (XREF) and damaged streams.

### 3. 🔄 Universal Document Conversion Engine (21 Tools)
* **Word to PDF (.docx / .doc)** — Unpacks Word XML structures, table grids, and typography to vector PDFs.
* **Excel to PDF (.xlsx / .xls / .csv)** — Multi-sheet ledger rendering with custom landscape layouts.
* **PowerPoint to PDF (.pptx)** — Slide-by-slide vector and visual layout compiler.
* **Images to PDF & PDF to Images** — High-DPI JPEG/PNG/WebP raster compilation.
* **Markdown, HTML & JSON to PDF** — Code-highlighted and styled report publishing.
* **Audio TTS to PDF & PDF to Audio** — Text-to-speech voice narration and transcript compilation.
* **E-Book to PDF (.epub)** — Chapter pagination and reflowable text layout compiler.

### 4. 🤖 AI Intelligence Studio (8 Tools)
* **Chat with PDF** — In-RAM vector similarity querying and conversational document intelligence.
* **AI Executive Summarizer** — Multi-page TL;DR synthesis with key takeaways extraction.
* **Client-Side OCR (Searchable PDF)** — Tesseract-powered optical character recognition directly in browser.
* **Resume ATS Reviewer** — Score resumes against job descriptions with keyword gap analysis.
* **Contract Risk Analyzer** — Automated clause detection, indemnity flags, and liability warnings.
* **Quiz & Flashcard Generator** — Turn study documents into interactive knowledge checkpoints.
* **Document Comparison Matrix** — Visual diff and text additions/deletions visualizer.

### 5. 💼 Commerce, Invoicing & Billing (4 Tools)
* **GST Invoice Generator** — Professional B2B/B2C invoices with auto-tax calculation (CGST/SGST/IGST).
* **POS Thermal Billing** — 58mm / 80mm instant thermal receipt generator for retail terminals.
* **E-Way Bill Companion** — Compliant transportation documentation formatter.
* **GST Filing Reconciliation** — Aggregate and prep tax reports from ledger spreadsheets.

### 6. 🚀 Cyber Super-Modules (4 Tools)
* **3D Flipbook Presenter** — Interactive Three.js / Canvas 3D tactile page-turn reader.
* **Node Workflow Builder** — Visual node-graph automation for multi-step PDF batch pipelines.
* **P2P Encrypted File Share** — Direct WebRTC peer-to-peer document transfer without intermediaries.
* **Collaborative Whiteboard** — Real-time markup canvas over PDF viewports.

---

## 🔬 Tech Stack & Architecture

| Layer | Technologies Used |
|---|---|
| **Core Framework** | React 19, TypeScript 5, Vite 6 |
| **Styling & Design** | Tailwind CSS 4, Lucide Icons, Canvas Confetti |
| **PDF Processing Engine** | `pdf-lib`, `pdfjs-dist`, WebAssembly, Dedicated Web Workers |
| **Document Parsers** | `JSZip` (XML extraction), `docx-preview`, `xlsx` (SheetJS), `tesseract.js` (OCR) |
| **Client Audio & FX** | Synthesized Web Audio API Spatial Sound FX |
| **Deployment** | Vercel (Edge CDN, 100% Static Assets, $0.00 Server Hosting) |

---

## 🛡️ Air-Gapped Security Architecture

```
                                      ╔════════════════════════════════════╗
                                      ║       ZERO-SERVER GUARANTEE        ║
                                      ╚════════════════════════════════════╝
                                                         │
               ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
               ▼                                                                                   ▼
    ┌──────────────────────┐                                                            ┌──────────────────────┐
    │  CLIENT-SIDE WASM    │                                                            │   RAM SHREDDING      │
    ├──────────────────────┤                                                            ├──────────────────────┤
    │ All binary algorithms│                                                            │ Memory buffers are   │
    │ execute inside the   │                                                            │ overwritten and      │
    │ user's browser V8.   │                                                            │ purged upon closing. │
    └──────────────────────┘                                                            └──────────────────────┘
```

1. **Zero Data Egress:** Open DevTools Network tab — when processing files, **0 outbound POST/PUT requests** are made.
2. **True Air-Gap Capability:** After the web app is loaded, you can **turn off your Wi-Fi/Internet** and every tool continues working flawlessly.
3. **No Database Dependencies:** Zero user document storage. No risk of database breaches or server-side data harvesting.

---

## 🚀 Quickstart / Local Development

Follow these steps to run ZeroPDF on your local machine:

```bash
# 1. Clone the repository
git clone https://github.com/Sarthak-theprobro/ZeroPdf.git

# 2. Navigate to project root
cd ZeroPdf

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev

# 5. Build for production
npm run build
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/Sarthak-theprobro/ZeroPdf/issues).

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">

Crafted with ❤️ for total digital privacy and sovereignty.

</div>
