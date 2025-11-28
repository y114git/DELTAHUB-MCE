import JSZip from 'jszip';

export async function importZip(file) {
  const zip = new JSZip();
  const zipData = await zip.loadAsync(file);
  
  let modConfig = null;
  let isDeltamod = false;
  
  for (const [path, entry] of Object.entries(zipData.files)) {
    if (entry.dir) continue;
    
    if (path === 'mod_config.json' || path.endsWith('/mod_config.json')) {
      const content = await entry.async('string');
      modConfig = JSON.parse(content);
    } else if (path === 'deltamodInfo.json' || path === '_deltamodInfo.json' || path === 'meta.json' || 
               path.endsWith('/deltamodInfo.json') || path.endsWith('/_deltamodInfo.json') || path.endsWith('/meta.json')) {
      isDeltamod = true;
    }
  }
  
  return {
    zip: zipData,
    modConfig,
    isDeltamod,
    files: zipData.files
  };
}

export async function exportZip(modData, files) {
  const zip = new JSZip();
  
  zip.file('mod_config.json', JSON.stringify(modData, null, 2));
  
  for (const [path, fileData] of Object.entries(files)) {
    if (fileData instanceof File) {
      zip.file(path, fileData);
    } else if (fileData instanceof ArrayBuffer || fileData instanceof Uint8Array) {
      zip.file(path, fileData);
    } else if (typeof fileData === 'string') {
      zip.file(path, fileData);
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

export function downloadZip(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'mod.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

