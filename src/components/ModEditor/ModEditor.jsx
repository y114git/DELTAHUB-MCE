import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSecretKey, hashSecretKey } from '../../utils/crypto';
import { submitNewMod, submitModChange } from '../../utils/api';
import { exportZip, downloadZip } from '../../utils/zipHandler';
import { validateModName, validateModAuthor, validateVersion, validateExternalURL, validateDescriptionURL, validateIconURL } from '../../utils/validation';
import FileManager from '../FileManager/FileManager';
import IconPreview from '../IconPreview/IconPreview';
import ScreenshotManager from '../ScreenshotManager/ScreenshotManager';
import './ModEditor.css';

export default function ModEditor({ isCreating, isPublic, modData: initialModData, secretKey: initialSecretKey, onCancel }) {
  const { t } = useTranslation();
  
  const [modData, setModData] = useState(initialModData || {
    name: '',
    author: '',
    tagline: '',
    external_url: '',
    icon_url: '',
    description_url: '',
    version: '1.0.0',
    game_version: '1.04',
    modgame: 'deltarune',
    tags: [],
    files: {},
    screenshots_url: []
  });
  
  const [iconFile, setIconFile] = useState(null);
  const [gameVersions, setGameVersions] = useState(['1.04']);
  const [secretKey, setSecretKey] = useState(initialSecretKey || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPublic) {
      import('../../utils/api').then(({ getGlobalSettings }) => {
        getGlobalSettings()
          .then(data => {
            if (data.supported_game_versions) {
              setGameVersions(data.supported_game_versions.sort().reverse());
            }
          })
          .catch(() => {});
      });
    }
  }, [isPublic]);

  const updateField = (field, value) => {
    setModData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleTag = (tag) => {
    setModData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    const nameValidation = validateModName(modData.name);
    if (!nameValidation.valid) newErrors.name = t(nameValidation.error);
    
    const authorValidation = validateModAuthor(modData.author, isPublic);
    if (!authorValidation.valid) newErrors.author = t(authorValidation.error);
    
    const versionValidation = validateVersion(modData.version);
    if (!versionValidation.valid) newErrors.version = t(versionValidation.error);
    
    if (modData.external_url) {
      const urlValidation = validateExternalURL(modData.external_url);
      if (!urlValidation.valid) newErrors.external_url = t(urlValidation.error);
    }
    
    if (isPublic && modData.description_url) {
      const descValidation = validateDescriptionURL(modData.description_url);
      if (!descValidation.valid) newErrors.description_url = t(descValidation.error);
    }
    
    if (modData.icon_url) {
      const iconValidation = validateIconURL(modData.icon_url);
      if (!iconValidation.valid) newErrors.icon_url = t(iconValidation.error);
    }
    
    const hasFiles = Object.keys(modData.files || {}).length > 0;
    if (!hasFiles) {
      newErrors.files = t('dialogs.mod_must_have_files');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    
    try {
      if (isPublic) {
        let hashedKey = '';
        if (isCreating) {
          const newSecretKey = generateSecretKey();
          setSecretKey(newSecretKey);
          hashedKey = await hashSecretKey(newSecretKey);
          await submitNewMod(modData, hashedKey);
          alert(t('dialogs.mod_submitted') + '\n' + t('ui.secret_key_important') + '\n' + newSecretKey);
        } else {
          hashedKey = await hashSecretKey(secretKey);
          await submitModChange(modData, hashedKey);
          alert(t('dialogs.request_sent_title'));
        }
      } else {
        const files = {};
        if (iconFile) {
          files['icon.png'] = iconFile;
        }
        
        const zipBlob = await exportZip(modData, files);
        downloadZip(zipBlob, `${modData.name || 'mod'}.zip`);
        alert(t('dialogs.local_mod_created_message', { mod_name: modData.name }));
      }
      
      if (onCancel) onCancel();
    } catch (error) {
      alert(t('errors.error') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mod-editor">
      <h1>{isCreating ? t('ui.create_mod') : t('ui.edit_mod')}</h1>
      
      <div className="frame">
        <div className="form-group">
          <label>{t('ui.mod_type_label')}</label>
          <select
            value={modData.modgame}
            onChange={(e) => updateField('modgame', e.target.value)}
          >
            <option value="deltarune">{t('ui.deltarune')}</option>
            <option value="deltarunedemo">{t('ui.deltarunedemo')}</option>
            <option value="undertale">{t('ui.undertale')}</option>
            <option value="undertaleyellow">{t('ui.undertaleyellow')}</option>
          </select>
        </div>

        <div className="form-group">
          <label>{t('ui.mod_name_label')}</label>
          <input
            type="text"
            value={modData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('ui.enter_mod_name')}
          />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label>{isPublic ? t('ui.mod_author') : t('ui.mod_author_optional')}</label>
          <input
            type="text"
            value={modData.author}
            onChange={(e) => updateField('author', e.target.value)}
            placeholder={isPublic ? t('ui.enter_author_name') : t('ui.enter_author_name_optional')}
            readOnly={!isCreating && isPublic}
          />
          {errors.author && <div className="error">{errors.author}</div>}
        </div>

        <div className="form-group">
          <label>{t('ui.short_description')}</label>
          <input
            type="text"
            value={modData.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder={t('ui.short_description_placeholder')}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label>{t('ui.external_url_optional')}</label>
          <input
            type="url"
            value={modData.external_url}
            onChange={(e) => updateField('external_url', e.target.value)}
            placeholder="https://example.com"
          />
          {errors.external_url && <div className="error">{errors.external_url}</div>}
        </div>

        <div className="form-group">
          <label>{isPublic ? t('files.icon_direct_link') : t('files.icon_label')}</label>
          <div className="form-row">
            {isPublic ? (
              <input
                type="url"
                value={modData.icon_url}
                onChange={(e) => updateField('icon_url', e.target.value)}
                placeholder={t('ui.leave_empty_for_default_icon')}
              />
            ) : (
              <>
                <input
                  type="text"
                  value={iconFile?.name || ''}
                  readOnly
                  placeholder={t('ui.select_icon_file')}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIconFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="icon-file-input"
                />
                <button onClick={() => document.getElementById('icon-file-input').click()}>
                  {t('ui.browse_button')}
                </button>
              </>
            )}
            <IconPreview
              url={modData.icon_url}
              file={iconFile}
              isPublic={isPublic}
            />
          </div>
          {errors.icon_url && <div className="error">{errors.icon_url}</div>}
        </div>

        <div className="form-group">
          <label>{t('ui.mod_tags_label')}</label>
          <div className="checkbox-group">
            {['textedit', 'customization', 'gameplay', 'other'].map(tag => (
              <div key={tag} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={modData.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                <label>{t(`tags.${tag}_text`)}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t('ui.overall_mod_version')}</label>
          <input
            type="text"
            value={modData.version}
            onChange={(e) => updateField('version', e.target.value)}
            placeholder="1.0.0"
          />
          {errors.version && <div className="error">{errors.version}</div>}
        </div>

        {isPublic && (
          <div className="form-group">
            <label>{t('ui.full_description_link')}</label>
            <input
              type="url"
              value={modData.description_url}
              onChange={(e) => updateField('description_url', e.target.value)}
              placeholder="https://example.com/description.md"
            />
            {errors.description_url && <div className="error">{errors.description_url}</div>}
          </div>
        )}

        <div className="form-group">
          <label>{t('ui.game_version_label')}</label>
          {isPublic ? (
            <select
              value={modData.game_version}
              onChange={(e) => updateField('game_version', e.target.value)}
            >
              {gameVersions.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={modData.game_version}
              onChange={(e) => updateField('game_version', e.target.value)}
              placeholder="1.04"
            />
          )}
        </div>

        {isPublic && (
          <div className="form-group">
            <ScreenshotManager
              screenshots={modData.screenshots_url || []}
              onChange={(screenshots) => updateField('screenshots_url', screenshots)}
            />
          </div>
        )}

        <div className="form-group">
          <FileManager
            modgame={modData.modgame}
            files={modData.files}
            isPublic={isPublic}
            onChange={(files) => updateField('files', files)}
          />
          {errors.files && <div className="error">{errors.files}</div>}
        </div>
      </div>

      <div className="actions">
        <button onClick={handleSave} disabled={saving}>
          {saving ? t('status.loading') : (isCreating ? t('ui.finish_creation') : t('ui.save_changes'))}
        </button>
        <button onClick={onCancel} disabled={saving}>
          {t('ui.cancel_button')}
        </button>
      </div>
    </div>
  );
}

