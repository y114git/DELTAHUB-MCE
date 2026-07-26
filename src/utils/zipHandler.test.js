import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { exportModArchive, importZipArchive } from './zipHandler';

describe('G3M archive round trip', () => {
  it('preserves Chapter 5 patches and removed INFO files', async () => {
    const source = new JSZip();
    source.file('mod_config.json', JSON.stringify({
      config_version: '1.0.0',
      metadata: {
        id: 'test_mod',
        name: 'Test Mod',
        version: '1.0.0',
        author: 'Tester',
        game: 'deltarune'
      },
      files: {
        deltarune_5: { data_file_path: 'patch.csx' }
      },
      info_files: {
        'old-readme.txt': 'remove'
      }
    }));
    source.file('chapter_5/patch.csx', 'script');
    const bytes = await source.generateAsync({ type: 'uint8array' });

    const imported = await importZipArchive(bytes);
    expect(imported.assets.tabs['5'].dataFile.storedPath).toBe('patch.csx');
    expect(imported.assets.infoFiles[0]).toMatchObject({
      storedPath: 'old-readme.txt',
      state: 'remove',
      file: null
    });

    imported.assets.tabs['5'].dataFile.file = new TextEncoder().encode('script');
    const exportedBlob = await exportModArchive(imported);
    const exported = await JSZip.loadAsync(await exportedBlob.arrayBuffer());
    const config = JSON.parse(await exported.file('mod_config.json').async('string'));

    expect(config.files.deltarune_5.data_file_path).toBe('patch.csx');
    expect(config.info_files['old-readme.txt']).toBe('remove');
    expect(exported.file('chapter_5/patch.csx')).not.toBeNull();
  });
});
