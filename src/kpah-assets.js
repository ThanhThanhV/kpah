const ASSET_ROOT = '/assets/kpah-original/';
let manifestRequest;

export async function loadAssetManifest() {
  if (!manifestRequest) {
    manifestRequest = fetch(ASSET_ROOT + 'archive-manifest.json', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(manifest => {
        if (!manifest || !Array.isArray(manifest.decodedPackedEntries)) {
          throw new Error('Manifest không đúng định dạng hoặc thiếu decodedPackedEntries.');
        }
        return manifest;
      })
      .catch(error => {
        manifestRequest = null;
        throw error;
      });
  }
  return manifestRequest;
}

export function assetUrl(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes('\0')) return null;
  const segments = path.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return null;
  return ASSET_ROOT + segments.map(encodeURIComponent).join('/');
}

export function decodedPngEntries(manifest) {
  return (manifest?.decodedPackedEntries || []).filter(item =>
    item && typeof item.output === 'string' && assetUrl(item.output) &&
    /\.png$/i.test(item.path || '')
  );
}
