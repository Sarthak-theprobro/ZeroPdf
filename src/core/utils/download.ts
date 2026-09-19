/**
 * Safe Browser File Download & Binary ArrayBuffer Utilities
 * Operates 100% client-side with zero server roundtrips
 */

export const fileToUint8Array = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const filesToUint8Arrays = async (files: File[]): Promise<Uint8Array[]> => {
  return Promise.all(files.map((file) => fileToUint8Array(file)));
};

export const downloadUint8Array = (
  data: Uint8Array,
  filename: string,
  mimeType: string = 'application/pdf'
): void => {
  const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Free up allocated memory in browser blob registry
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};