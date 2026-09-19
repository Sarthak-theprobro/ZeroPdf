import * as Comlink from 'comlink';
import { PDFWorkerType } from './pdf.worker';

class WorkerBridge {
  private workerInstance: Comlink.Remote<PDFWorkerType> | null = null;

  public getWorker(): Comlink.Remote<PDFWorkerType> {
    if (!this.workerInstance && typeof window !== 'undefined') {
      // Native Vite ES-Module Worker instantiation
      const rawWorker = new Worker(new URL('./pdf.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.workerInstance = Comlink.wrap<PDFWorkerType>(rawWorker);
    }

    if (!this.workerInstance) {
      throw new Error('Web Worker could not be initialized in this environment');
    }

    return this.workerInstance;
  }
}

export const workerBridge = new WorkerBridge();