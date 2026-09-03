import { exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export async function exportCurrentThumbnails(
  api: ExcalidrawImperativeAPI,
): Promise<{ light: Blob; dark: Blob }> {
  const elements = api.getSceneElements();
  const appState = api.getAppState();
  const files = api.getFiles();
  const base = { elements, files, appState: { ...appState, exportBackground: true }, maxWidthOrHeight: 512 };
  const [light, dark] = await Promise.all([
    exportToBlob({ ...base, appState: { ...base.appState, theme: "light", exportWithDarkMode: false } }),
    exportToBlob({ ...base, appState: { ...base.appState, theme: "dark", exportWithDarkMode: true } }),
  ]);
  return { light, dark };
}
