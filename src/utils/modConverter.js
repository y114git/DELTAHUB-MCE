export function convertDeltamodToDELTAHUB(deltamodInfo, moddingXml, files) {
  const meta = deltamodInfo.metadata || {};
  const packageID = meta.packageID || '';
  
  let modKey = 'local_';
  if (packageID && packageID !== 'und.und.und') {
    modKey = packageID.replace(/\./g, '_');
  } else {
    modKey = `local_${meta.name || 'unnamed'}_${Date.now().toString(36)}`;
  }
  
  const createdDate = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const author = Array.isArray(meta.author) ? meta.author.join(', ') : (meta.author || 'Unknown');
  
  const config = {
    is_local_mod: true,
    key: modKey,
    created_date: createdDate,
    is_available_on_server: false,
    name: meta.name || 'Local Mod',
    version: meta.version || '1.0.0',
    author: author,
    tagline: meta.description || 'No description',
    external_url: meta.url || '',
    game_version: deltamodInfo.deltaruneTargetVersion || 'Not specified',
    game: meta.demoMod ? 'deltarunedemo' : 'deltarune',
    files: generateFilesStructure(moddingXml, files),
    tags: meta.tags || []
  };
  
  return config;
}

function generateFilesStructure(moddingXml, files) {
  const filesData = {};
  
  if (!moddingXml) {
    return filesData;
  }
  
  const patches = moddingXml.tag === 'patch' ? [moddingXml] : moddingXml.findall('patch');
  
  for (const patch of patches) {
    const chapter = patch.get('chapter');
    if (!chapter) continue;
    
    let chapterKey = chapter;
    if (chapter === '0' || chapter === 'menu') {
      chapterKey = '0';
    } else if (chapter === 'demo') {
      chapterKey = 'demo';
    }
    
    if (!filesData[chapterKey]) {
      filesData[chapterKey] = {
        data_file_url: '',
        data_file_version: '1.0.0',
        extra_files: []
      };
    }
    
    const source = patch.get('source');
    const target = patch.get('target');
    
    if (source && files[source]) {
      if (target && (target === 'data.win' || target === 'game.ios')) {
        filesData[chapterKey].data_file_url = source;
      } else {
        filesData[chapterKey].extra_files.push({
          key: source,
          url: source,
          version: '1.0.0'
        });
      }
    }
  }
  
  return filesData;
}

