import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hashSecretKey } from '../utils/crypto';
import { getModData, getPendingModData } from '../utils/api';
import ModEditor from '../components/ModEditor/ModEditor';

export default function EditPublicMod() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [secretKey, setSecretKey] = useState('');
  const [modData, setModData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoad = async () => {
    if (!secretKey.trim()) {
      setError(t('dialogs.enter_secret_key_mod'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hashedKey = await hashSecretKey(secretKey);
      let data = null;

      try {
        data = await getModData(hashedKey);
      } catch {
        try {
          data = await getPendingModData(hashedKey);
        } catch {
          throw new Error(t('errors.secret_key_invalid'));
        }
      }

      setModData(data);
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
          isPublic={true}
          modData={modData}
          secretKey={secretKey}
          onCancel={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="frame">
        <h2>{t('dialogs.enter_secret_key_mod')}</h2>
        <div className="form-group">
          <input
            type="text"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="RUNE-XXXXXXXXXXXXXX"
            onKeyPress={(e) => e.key === 'Enter' && handleLoad()}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button onClick={handleLoad} disabled={loading}>
            {loading ? t('status.loading') : t('ui.select')}
          </button>
          <button onClick={() => navigate('/')}>{t('ui.cancel_button')}</button>
        </div>
      </div>
    </div>
  );
}

