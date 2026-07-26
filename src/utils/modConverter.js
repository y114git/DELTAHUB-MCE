import { normalizeModConfigData, buildModConfigData } from '../data/modConfig';
import { getGameDefinition, mapConfigFileKeyToTabFilesKey, getArchiveFolderName } from '../data/gameDefinitions';
import { parse as parseToml } from 'smol-toml';

// Game mapping from G3M's Deltamod importer.
const DELTAMOD_GAME_MAP = {
  "toby.deltarune": "deltarune",
  "toby.deltarune.demo": "deltarunedemo", 
  "toby.deltarune.demolts": "deltarunedemo",
  "toby.undertale": "undertale",
  "fans.utyellow": "undertaleyellow",
  "other.pizzatower": "pizzatower",
  "other.frickbears3": "frickbears3",
};

function readAttribute(element, attribute) {
  if (!element) return '';
  if (typeof element.getAttribute === 'function') {
    return element.getAttribute(attribute) || '';
  }
  return '';
}

function findPatchNodes(xmlDocument) {
  if (!xmlDocument) return [];
  const root = xmlDocument.documentElement || xmlDocument;
  if (!root) return [];
  if (root.tagName && root.tagName.toLowerCase() === 'patch') return [root];
  return Array.from(root.getElementsByTagName?.('patch') || []);
}

function mapDeltamodGame(gameId) {
  if (!gameId || typeof gameId !== 'string') return null;
  return DELTAMOD_GAME_MAP[gameId.trim().toLowerCase()];
}

function resolveTargetGame(meta) {
  const mappedGame = mapDeltamodGame(meta.game);
  if (mappedGame) return mappedGame;
  if (meta.demoMod) return 'deltarunedemo';
  return 'deltarune';
}

function resolveGameVersion(game, deltamodInfo) {
  if (game !== 'deltarune') return '';
  return deltamodInfo.deltaruneTargetVersion || '';
}

async function readDeltamodInfo(infoEntry) {
  const text = await infoEntry.async('string');
  try {
    return /\.toml$/i.test(infoEntry.name) ? parseToml(text) : JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse ${infoEntry.name.split('/').pop()}: ${error.message}`);
  }
}

function normalizeContentKey(chapterKey, targetGame) {
  if (targetGame !== 'deltarune') {
    return getGameDefinition(targetGame).tabs[0].id;
  }
  if (chapterKey === 'demo') {
    return 'deltarune_0';
  }
  if (/^\d+$/.test(chapterKey)) {
    return `deltarune_${chapterKey}`;
  }
  return chapterKey;
}

function parsePatchTarget(toPath, targetGame) {
  const normalized = String(toPath || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (!normalized) return { chapterKey: null, relativePath: '', filename: '' };

  if (normalized.toLowerCase().includes('demo')) {
    return { chapterKey: 'demo', relativePath: '', filename: normalized.split('/').pop() || '' };
  }
  
  if (normalized.toLowerCase().includes('pizzatower')) {
    return { chapterKey: 'pizzatower', relativePath: '', filename: normalized.split('/').pop() || '' };
  }
  
  if (normalized.toLowerCase().includes('undertale')) {
    return { chapterKey: 'undertale', relativePath: '', filename: normalized.split('/').pop() || '' };
  }

  const chapterMatch = normalized.match(/chapter[_-]?(\d+)/i);
  const chapterKey = chapterMatch ? chapterMatch[1] : '0';
  const stripped = normalized.replace(/chapter[_-]?\d+[\\/_]?windows?[/\\]?/i, '');
  const slashIndex = stripped.lastIndexOf('/');

  if (slashIndex === -1) {
    return { chapterKey, relativePath: '', filename: stripped };
  }

  return {
    chapterKey,
    relativePath: stripped.slice(0, slashIndex + 1),
    filename: stripped.slice(slashIndex + 1)
  };
}

function buildStoredPath(relativePath, filename) {
  return relativePath ? `${relativePath}${filename}` : filename;
}

function generateModId(metadata, gamebananaMetadata = {}) {
  if (gamebananaMetadata.mod_id) {
    return `gb_${gamebananaMetadata.mod_id}`;
  }
  
  const packageId = metadata.packageID || '';
  if (packageId && packageId !== 'und.und.und') {
    return packageId.replace(/\./g, '_');
  }
  
  const name = metadata.name || 'unnamed';
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `local_${name.toLowerCase().replace(/\s+/g, '_')}_${randomSuffix}`;
}

export async function convertDeltamodArchive(zipEntries, gamebananaMetadata = {}) {
  const infoEntry = Object.values(zipEntries).find((entry) => 
    !entry.dir && /(^|\/)(deltamodInfo\.json|_deltamodInfo\.json|meta\.(json|toml))$/i.test(entry.name)
  );
  const xmlEntry = Object.values(zipEntries).find((entry) => 
    !entry.dir && /(^|\/)modding\.xml$/i.test(entry.name)
  );

  if (!infoEntry || !xmlEntry) {
    throw new Error('Invalid Deltamod archive: metadata or modding.xml is missing');
  }

  const deltamodInfo = await readDeltamodInfo(infoEntry);
  const metadata = deltamodInfo.metadata || {};

  const xmlText = await xmlEntry.async('string');
  const parser = new DOMParser();
  let xml;

  try {
    xml = parser.parseFromString(xmlText, 'application/xml');
    if (xml.querySelector?.('parsererror')) {
      // Try wrapping in a patches root like G3M does.
      xml = parser.parseFromString(
        `<?xml version="1.0" encoding="UTF-8"?><patches>${xmlText}</patches>`, 
        'application/xml'
      );
    }
  } catch (error) {
    throw new Error(`Failed to parse modding.xml: ${error.message}`);
  }

  const targetGame = resolveTargetGame(metadata);
  const gameVersion = resolveGameVersion(targetGame, deltamodInfo);
  const modId = generateModId(metadata, gamebananaMetadata);
  
  const files = {};
  const assets = { tabs: {}, icon: null, infoFiles: [] };

  // Process patches using G3M-compatible content keys.
  for (const patchNode of findPatchNodes(xml)) {
    const patchTarget = readAttribute(patchNode, 'to');
    const patchSource = readAttribute(patchNode, 'patch');
    const patchType = readAttribute(patchNode, 'type').trim().toLowerCase();

    if (!patchTarget || !patchSource || !patchType) {
      console.warn('Skipping patch with missing fields', { patchTarget, patchSource, patchType });
      continue;
    }

    const { chapterKey, relativePath, filename } = parsePatchTarget(patchTarget, targetGame);
    if (!chapterKey) {
      console.warn('Could not determine chapter for path:', patchTarget);
      continue;
    }

    const contentKey = normalizeContentKey(chapterKey, targetGame);
    const tabFilesKey = mapConfigFileKeyToTabFilesKey(contentKey, targetGame);

    if (!files[contentKey]) files[contentKey] = {};
    if (!assets.tabs[tabFilesKey]) assets.tabs[tabFilesKey] = { dataFile: null, extraFiles: [] };

    // Find the patch file in zip
    const sourcePath = patchSource.replace(/^\.\/+/, '');
    const sourceEntry = zipEntries[sourcePath] || 
      Object.values(zipEntries).find((entry) => !entry.dir && entry.name.endsWith(sourcePath));

    if (!sourceEntry) {
      console.warn('Patch file not found:', sourcePath);
      continue;
    }

    const blob = await sourceEntry.async('blob');
    const cleanFilename = sourcePath.split('/').pop() || filename || 'asset.bin';
    const file = new File([blob], cleanFilename, { type: blob.type || 'application/octet-stream' });

    if (patchType === 'xdelta' || patchType === 'g3mpatch') {
      const storedPath = cleanFilename;
      files[contentKey].data_file_path = storedPath;
      assets.tabs[tabFilesKey].dataFile = {
        id: crypto.randomUUID?.() || `asset_${Math.random().toString(36).slice(2, 10)}`,
        kind: 'file',
        storedPath,
        label: storedPath,
        file,
        archiveFolder: getArchiveFolderName(tabFilesKey, targetGame)
      };
    } else if (patchType === 'override' || patchType === 'copy') {
      const storedPath = buildStoredPath(relativePath, filename);
      if (!files[contentKey].extra_files) files[contentKey].extra_files = [];
      files[contentKey].extra_files.push(storedPath);

      assets.tabs[tabFilesKey].extraFiles.push({
        id: crypto.randomUUID?.() || `asset_${Math.random().toString(36).slice(2, 10)}`,
        kind: 'file',
        storedPath,
        label: storedPath,
        file,
        archiveFolder: getArchiveFolderName(tabFilesKey, targetGame)
      });
    } else {
      console.warn('Unknown patch type:', patchType);
    }
  }

  // Process icon.
  const iconEntry = Object.values(zipEntries).find((entry) => 
    !entry.dir && /(^|\/)(_?icon\.png)$/i.test(entry.name)
  );
  
  if (iconEntry) {
    const blob = await iconEntry.async('blob');
    const iconFilename = iconEntry.name.split('/').pop();
    assets.icon = {
      id: crypto.randomUUID?.() || `asset_${Math.random().toString(36).slice(2, 10)}`,
      kind: 'file',
      storedPath: iconFilename,
      label: iconFilename,
      file: new File([blob], iconFilename, { type: blob.type || 'image/png' })
    };
  }

  // Build config using G3M's mod_config.json structure.
  const config = normalizeModConfigData({
    id: modId,
    version: metadata.version || '1.0.0',
    name: metadata.name || 'Imported Deltamod',
    description: metadata.description || 'No description provided',
    author: Array.isArray(metadata.author) ? metadata.author.join(', ') : (metadata.author || 'Unknown'),
    homepage: gamebananaMetadata.homepage || gamebananaMetadata.profile_url || metadata.url || '',
    icon: assets.icon ? assets.icon.storedPath : '',
    game: targetGame,
    game_version: gameVersion,
    tags: metadata.tags || ['other'],
    files
  });

  // Apply GameBanana metadata if available.
  if (gamebananaMetadata) {
    if (gamebananaMetadata.icon && !config.icon) {
      config.icon = gamebananaMetadata.icon;
    }
    
    if (gamebananaMetadata.tags) {
      const existingTags = Array.isArray(config.tags) ? config.tags : [];
      const gbTags = Array.isArray(gamebananaMetadata.tags) ? gamebananaMetadata.tags : [];
      for (const tag of gbTags) {
        if (tag && !existingTags.includes(tag)) {
          existingTags.push(tag);
        }
      }
      config.tags = existingTags;
    }
  }

  return {
    format: 'deltamod',
    config: buildModConfigData(config),
    assets
  };
}
