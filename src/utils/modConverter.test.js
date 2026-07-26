import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';

import { convertDeltamodArchive } from './modConverter';

function entry(name, content) {
  return {
    name,
    dir: false,
    async(type) {
      if (type === 'string') return Promise.resolve(content);
      return Promise.resolve(new Blob([content]));
    }
  };
}

describe('Deltamod conversion', () => {
  it('converts TOML metadata and current patch types', async () => {
    globalThis.DOMParser = DOMParser;
    const entries = {
      'meta.toml': entry('meta.toml', `
deltaruneTargetVersion = "1.05"
[metadata]
name = "Test Mod"
version = "2.0.0"
description = "Test"
author = ["One", "Two"]
game = "toby.deltarune"
packageID = "test.mod.author"
`),
      'modding.xml': entry('modding.xml', `
<patches>
  <patch type="xdelta" patch="./patch.csx" to="./chapter5_windows/data.win" />
  <patch type="copy" patch="./readme.txt" to="./chapter5_windows/lang/readme.txt" />
  <patch type="g3mpatch" patch="./chapter4.g3mpatch" to="./chapter4_windows/data.win" />
</patches>
`),
      'patch.csx': entry('patch.csx', 'script'),
      'readme.txt': entry('readme.txt', 'text'),
      'chapter4.g3mpatch': entry('chapter4.g3mpatch', 'patch')
    };

    const result = await convertDeltamodArchive(entries);

    expect(result.config.metadata).toMatchObject({
      id: 'test_mod_author',
      name: 'Test Mod',
      author: 'One, Two',
      game: 'deltarune',
      game_version: '1.05'
    });
    expect(result.config.files.deltarune_5).toEqual({
      data_file_path: 'patch.csx',
      extra_files: ['lang/readme.txt']
    });
    expect(result.config.files.deltarune_4.data_file_path).toBe('chapter4.g3mpatch');
    expect(result.assets.tabs['5'].dataFile).toMatchObject({
      storedPath: 'patch.csx',
      archiveFolder: 'chapter_5'
    });
  });
});
