const SAVE_VERSION = 1;
const DEFAULT_KEY = 'kpah.game-save.v1';

export function createLocalSave(key = DEFAULT_KEY, storageProvider = () => window.localStorage) {
  function readStorage() {
    try { return storageProvider(); } catch { return null; }
  }
  function load() {
    const storage = readStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SAVE_VERSION || !parsed.state || typeof parsed.state !== 'object') return null;
      return parsed.state;
    } catch { return null; }
  }
  function save(state) {
    const storage = readStorage();
    if (!storage || !state || typeof state !== 'object') return false;
    try {
      storage.setItem(key, JSON.stringify({version:SAVE_VERSION,savedAt:new Date().toISOString(),state}));
      return true;
    } catch { return false; }
  }
  function clear() {
    const storage = readStorage();
    if (!storage) return false;
    try { storage.removeItem(key); return true; } catch { return false; }
  }
  return {load,save,clear};
}
