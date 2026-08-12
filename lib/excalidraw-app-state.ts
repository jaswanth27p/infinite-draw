/**
 * Excalidraw's `appState` (as passed to `onChange` / held on `initialData`)
 * mixes two kinds of data:
 *
 *  - "what the scene looks like" — viewport pan/zoom, background color,
 *    grid settings, last-used tool defaults, etc. This is legitimately
 *    worth persisting (Excalidraw's own persistence examples keep it too).
 *  - purely interaction-transient / runtime-only state — in-progress
 *    pointer gestures, open popovers, and (critically) a few fields that
 *    are non-JSON-safe collection types at runtime (`Map`/`Set`) or live
 *    browser handles.
 *
 * `@excalidraw/excalidraw` does not export a subpath for its own
 * `clearAppStateForDatabase`/`clearAppStateForLocalStorage` helpers at
 * runtime for consumers of the published npm package (its package.json
 * `exports` map only exposes `.d.ts` types for `/*` subpaths, not JS —
 * confirmed by the absence of `dist/dev/appState.js` in the installed
 * package). So this list is hand-rolled, but modeled on Excalidraw's own
 * `APP_STATE_STORAGE_CONF` categorization (see
 * `@excalidraw/excalidraw/dist/dev/chunk-4FTI6OG3.js`) of which fields it
 * considers safe to persist across a reload.
 */
const TRANSIENT_APP_STATE_KEYS = [
  // Non-JSON-safe runtime collection / handle types. `collaborators` is
  // the confirmed crash cause: it's a `Map` at runtime, `JSON.stringify`
  // turns it into `{}`, and Excalidraw's `InteractiveCanvas` calls
  // `.forEach` on it expecting a real `Map` -> throws on the next mount.
  "collaborators",
  // Same class of bug as `collaborators` (a `Set` at runtime) — stripped
  // defensively even though no live crash was reproduced for this one.
  "followedBy",
  // A live `FileSystemFileHandle` browser object; meaningless across
  // sessions/reloads and not meaningfully serializable.
  "fileHandle",

  // In-progress pointer/interaction state, valid only for the lifetime of
  // the gesture that produced it.
  "newElement",
  "selectionElement",
  "editingTextElement",
  "editingLinearElement",
  "editingFrame",
  "resizingElement",
  "multiElement",
  "startBoundElement",
  "suggestedBindings",
  "selectedElementsAreBeingDragged",

  // Transient UI chrome: open popovers/menus/dialogs/toasts that have no
  // meaning on a fresh mount.
  "contextMenu",
  "openPopup",
  "openDialog",
  "pasteDialog",
  "toast",
  "errorMessage",
  "showHyperlinkPopup",

  // Loading/gesture flags, valid only mid-interaction.
  "isLoading",
  "isResizing",
  "isRotating",
  "isCropping",
  "croppingElementId",
  "pendingImageElementId",

  // Snap/search/highlight/hover scratch state, recomputed as needed.
  "snapLines",
  "originSnapOffset",
  "searchMatches",
  "frameToHighlight",
  "elementsToHighlight",
  "activeEmbeddable",
  "currentHoveredFontFamily",
  "hoveredElementIds",
  "userToFollow",

  // DOM-derived layout, recomputed by Excalidraw on mount. Excalidraw's
  // own `RestoredAppState` type omits these too.
  "height",
  "width",
  "offsetLeft",
  "offsetTop",
] as const;

const TRANSIENT_APP_STATE_KEY_SET: ReadonlySet<string> = new Set(TRANSIENT_APP_STATE_KEYS);

/**
 * Strip interaction-transient / non-JSON-safe fields from a live
 * Excalidraw `appState` before persisting it. Deliberately does NOT strip
 * anything that determines what's visually drawn (viewport pan/zoom,
 * background color, grid, last-used tool defaults, etc.) — those are kept.
 */
export function sanitizeAppStateForSave(
  appState: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(appState)) {
    if (TRANSIENT_APP_STATE_KEY_SET.has(key)) continue;
    sanitized[key] = appState[key];
  }
  return sanitized;
}

/**
 * Reconstruct the runtime-only collection fields Excalidraw expects on
 * `appState` when building `initialData` for a fresh `<Excalidraw>` mount.
 * `collaborators` and `followedBy` are `Map`/`Set` at runtime; persisted
 * data (via `sanitizeAppStateForSave` above, or pre-fix rows already in
 * the database that still have `collaborators: {}`) never has real
 * instances of either, so these are always rebuilt fresh rather than
 * passed through — matching Excalidraw's own `getDefaultAppState()`,
 * which likewise starts both as empty.
 *
 * This is the defensive half of the fix: it must hold even if
 * `sanitizeAppStateForSave` has a gap, or for rows written before this
 * fix existed.
 */
export function reviveAppStateForLoad(
  appState: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  return {
    ...appState,
    collaborators: new Map(),
    followedBy: new Set(),
  };
}
