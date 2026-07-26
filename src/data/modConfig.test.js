import { describe, expect, it } from 'vitest';

import { getGameTabs } from './gameDefinitions';
import {
  DATA_FILE_EXTENSIONS,
  normalizeInfoFiles,
  normalizeModConfigData,
  sanitizeTags
} from './modConfig';
import { migrateModConfigLegacyFields } from '../utils/migrationService';

describe('G3M 3.3 format compatibility', () => {
  it('supports Chapter 5 and CSX data patches', () => {
    expect(getGameTabs('deltarune').at(-1)?.filesKey).toBe('5');
    expect(DATA_FILE_EXTENSIONS).toContain('.csx');
  });

  it('uses the canonical CYOP/AFOM tag', () => {
    expect(sanitizeTags(['cyop/afom', 'OTHER'])).toEqual(['CYOP/AFOM', 'other']);
  });

  it('preserves all INFO file actions', () => {
    expect(normalizeInfoFiles({
      'README.md': 'show',
      'hidden.txt': 'hide',
      'obsolete.txt': 'remove'
    })).toEqual({
      'README.md': 'show',
      'hidden.txt': 'hide',
      'obsolete.txt': 'remove'
    });
  });

  it('migrates legacy nested metadata without deleting homepage', () => {
    const config = {
      metadata: {
        homepage: 'https://example.com',
        icon_url: 'icon.png'
      },
      files: {
        5: { data_file_url: 'chapter5.xdelta' }
      }
    };

    expect(migrateModConfigLegacyFields(config)).toBe(true);
    expect(config.metadata.homepage).toBe('https://example.com');
    expect(config.metadata.icon).toBe('icon.png');
    expect(config.files.deltarune_5.data_file_path).toBe('chapter5.xdelta');
  });

  it('applies current metadata limits', () => {
    const config = normalizeModConfigData({
      author: 'a'.repeat(60),
      game_version: 'v'.repeat(30)
    });

    expect(config.author).toHaveLength(50);
    expect(config.game_version).toHaveLength(20);
  });
});
