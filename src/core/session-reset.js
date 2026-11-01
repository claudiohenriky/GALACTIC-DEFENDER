const LEGACY_PREFIX = 'gd-';

/**
 * Removes data written by pre-1.0 builds. The 1.0.0 release keeps all game
 * state in memory for the current page session and never writes new saves.
 * Unrelated storage keys owned by other applications on the same origin
 * are left untouched.
 */
export function clearLegacyGameStorage() {
  for (const storage of [globalThis.localStorage, globalThis.sessionStorage]) {
    if (!storage) continue;
    try {
      const legacyKeys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (typeof key === 'string' && key.startsWith(LEGACY_PREFIX)) legacyKeys.push(key);
      }
      for (const key of legacyKeys) storage.removeItem(key);
    } catch {
      // Storage may be blocked by privacy settings; the game remains session-only.
    }
  }
}
