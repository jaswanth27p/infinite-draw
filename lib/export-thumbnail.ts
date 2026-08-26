import { exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export async function exportCurrentThumbnail(
  api: ExcalidrawImperativeAPI,
  resolvedTheme: string | undefined,
): Promise<Blob> {
  const elements = api.getSceneElements();
  const appState = api.getAppState();
  return exportToBlob({
    elements,
    appState: {
      ...appState,
      theme: resolvedTheme === "dark" ? "dark" : "light",
      exportBackground: true,
    },
    files: null,
  });
}
