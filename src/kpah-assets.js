const ASSET_ROOT = '/assets/kpah-original/';
let manifestRequest;
let assetVersion = '';

export async function loadAssetManifest() {
  if (!manifestRequest) {
    manifestRequest = fetch(ASSET_ROOT + 'archive-manifest.json', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(manifest => {
        if (!manifest || (!Array.isArray(manifest.decodedPackedEntries)
          && !Array.isArray(manifest.characterParts))) {
          throw new Error('Manifest không có danh mục tài nguyên KPAH hợp lệ.');
        }
        assetVersion = typeof manifest.assetVersion === 'string' &&
          /^[a-f0-9]{16}$/i.test(manifest.assetVersion) ? manifest.assetVersion : '';
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
  const url = ASSET_ROOT + segments.map(encodeURIComponent).join('/');
  return assetVersion ? url + '?v=' + encodeURIComponent(assetVersion) : url;
}

export function decodedPngEntries(manifest) {
  return (manifest?.decodedPackedEntries || []).filter(item =>
    item && typeof item.output === 'string' && assetUrl(item.output) &&
    /\.png$/i.test(item.path || '')
  );
}


/** Original player-part atlases extracted from c/{head,body,leg} in KPAH_278.jar. */
export function characterPartEntries(manifest) {
  return (manifest?.characterParts || []).filter(item =>
    item && ['head', 'body', 'leg', 'hat', 'coat'].includes(item.partType) &&
    typeof item.partId === 'string' && typeof item.image === 'string' &&
    assetUrl(item.image)
  );
}
