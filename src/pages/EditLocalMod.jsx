import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { importZip } from '../utils/zipHandler';
import { convertDeltamodToDELTAHUB } from '../utils/modConverter';
import ModEditor from '../components/ModEditor/ModEditor';
import JSZip from 'jszip';

export default function EditLocalMod() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [modData, setModData] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setIconFile(null);

    try {
      const result = await importZip(file);
      
      let extractedIconFile = null;
      const iconEntry = result.files['icon.png'] || result.files['icon/icon.png'] || 
                        Object.values(result.files).find(f => f.name === 'icon.png' || f.name.endsWith('/icon.png'));
      if (iconEntry && !iconEntry.dir) {
        const iconBlob = await iconEntry.async('blob');
        extractedIconFile = new File([iconBlob], 'icon.png', { type: 'image/png' });
        setIconFile(extractedIconFile);
      }
      
      if (result.isDeltamod) {
        let deltamodInfoText = '';
        for (const path of ['deltamodInfo.json', '_deltamodInfo.json', 'meta.json']) {
          const entry = result.files[path] || Object.values(result.files).find(f => f.name === path);
          if (entry && !entry.dir) {
            deltamodInfoText = await entry.async('string');
            break;
          }
        }
        const deltamodInfo = JSON.parse(deltamodInfoText || '{}');
        
        let moddingXmlText = '';
        const xmlEntry = result.files['modding.xml'] || Object.values(result.files).find(f => f.name === 'modding.xml');
        if (xmlEntry && !xmlEntry.dir) {
          moddingXmlText = await xmlEntry.async('string');
        }
        
        const parser = new DOMParser();
        const moddingXml = parser.parseFromString(moddingXmlText, 'text/xml');
        
        const files = {};
        for (const [path, entry] of Object.entries(result.files)) {
          if (!entry.dir) {
            files[path] = await entry.async('blob');
          }
        }
        
        const converted = convertDeltamodToDELTAHUB(deltamodInfo, moddingXml, files);
        setModData(converted);
      } else if (result.modConfig) {
        setModData(result.modConfig);
      } else {
        throw new Error(t('errors.invalid_mod_format'));
      }
    } catch (err) {
      setError(err.message || t('errors.error'));
    } finally {
      setLoading(false);
    }
  };

  if (modData) {
    return (
      <div className="container">
        <ModEditor
          isCreating={false}
          isPublic={false}
          modData={modData}
          initialIconFile={iconFile}
          onCancel={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="frame">
        <h2>{t('ui.import_mod')}</h2>
        <div className="form-group">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            disabled={loading}
          />
        </div>
        {error && <div className="error">{error}</div>}
        {loading && <div>{t('status.loading')}</div>}
        <div className="actions">
          <button onClick={() => navigate('/')}>{t('ui.cancel_button')}</button>
        </div>
      </div>
    </div>
  );
}

