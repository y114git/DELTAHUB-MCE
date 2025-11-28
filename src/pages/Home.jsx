import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Home.css';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="home container">
      <h1>DELTAHUB Mod Creator/Editor</h1>
      <div className="home-actions">
        <div className="action-group">
          <h2>{t('ui.create_mod')}</h2>
          <button onClick={() => navigate('/create/public')}>
            {t('buttons.public')}
          </button>
          <button onClick={() => navigate('/create/local')}>
            {t('buttons.local')}
          </button>
        </div>
        <div className="action-group">
          <h2>{t('ui.edit_mod')}</h2>
          <button onClick={() => navigate('/edit/public')}>
            {t('buttons.public')}
          </button>
          <button onClick={() => navigate('/edit/local')}>
            {t('buttons.local')}
          </button>
        </div>
      </div>
    </div>
  );
}

