/**
 * functions/_lib/storage-mode-pair.ts
 * -----------------------------------------------------------------------
 * The only two (storageLocation, driveScope) pairs functions/api/wizard/
 * set-storage-mode.ts will write.
 *
 * Factored out of that route into its own module (no other imports, no
 * D1/Request dependency) for two reasons: it is directly unit-testable
 * without a route-level harness this repo does not yet have (every other
 * wizard route is still "STATUS: MOCKUP. Never executed" per its own
 * header), and it is the single place coherence between the two columns
 * is enforced — 0003's migration header is explicit that SQLite cannot
 * enforce that relationship itself, so this function is load-bearing.
 *
 * WHAT THIS IS GUARDING: a bug here writes an incoherent pair straight
 * into kit_installs, which storage-mode.js (the client) is built to
 * treat as "screen 2 is unfinished" — so a coherence bug on the write
 * side would silently strand a real agent on a "go back and choose
 * again" screen for a choice he already made.
 */

export interface CoherentPair {
  storageLocation: 'drive' | 'local';
  driveScope: 'full' | null;
}

export function coherentPair(storageLocation: unknown, driveScope: unknown): CoherentPair | null {
  if (storageLocation === 'drive' && driveScope === 'full') {
    return { storageLocation: 'drive', driveScope: 'full' };
  }
  if (storageLocation === 'local' && (driveScope === undefined || driveScope === null)) {
    return { storageLocation: 'local', driveScope: null };
  }
  return null;
}
