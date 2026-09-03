import type { BinaryFiles } from "@excalidraw/excalidraw/types";

export interface HostedFile {
  id: string;
  mimeType: string;
  dataURL: string;
  created: number;
}

export type HostedFilesMap = Record<string, HostedFile>;

/**
 * Diffs Excalidraw's live `files` map (always local `data:` URIs for the
 * lifetime of the session — Excalidraw never learns an image was
 * uploaded) against the already-hosted map from the last successful save,
 * uploading only entries that aren't hosted yet. An id present in
 * `hostedFiles` is reused as-is (no re-upload, no re-derivation of its
 * fields) — this is what makes re-saving an already-uploaded image free
 * (no network call) on every subsequent autosave tick.
 */
export async function persistCanvasFiles(
  rawFiles: BinaryFiles,
  hostedFiles: HostedFilesMap,
  uploadOne: (id: string, blob: Blob, mimeType: string) => Promise<string>,
): Promise<HostedFilesMap> {
  const result: HostedFilesMap = {};
  for (const id of Object.keys(rawFiles)) {
    const existing = hostedFiles[id];
    if (existing) {
      result[id] = existing;
      continue;
    }
    const raw = rawFiles[id];
    const blob = await dataURLToBlob(raw.dataURL);
    const publicUrl = await uploadOne(id, blob, raw.mimeType);
    result[id] = { id, mimeType: raw.mimeType, dataURL: publicUrl, created: raw.created };
  }
  return result;
}

async function dataURLToBlob(dataURL: string): Promise<Blob> {
  // fetch() supports data: URIs directly in every browser this app
  // targets — no manual base64/atob decoding needed.
  const res = await fetch(dataURL);
  return res.blob();
}
