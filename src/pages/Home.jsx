import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import iconIco from '../assets/icon.ico';
import './Home.css';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState(null);

  const handleActionSelect = (action) => {
    setSelectedAction(action);
  };

  const handleTypeSelect = (type) => {
    if (selectedAction === 'create') {
      navigate(`/create/${type}`);
    } else if (selectedAction === 'edit') {
      navigate(`/edit/${type}`);
    }
  };

  const resetSelection = () => {
    setSelectedAction(null);
  };

  return (
    <div className="home container">
      <div className="home-header">
        <img src={iconIco} alt="DELTAHUB" className="home-icon" />
        <h1>DELTAHUB Mod Creator/Editor</h1>
      </div>
      
      {!selectedAction ? (
        <div className="home-actions">
          <button 
            className="action-button primary"
            onClick={() => handleActionSelect('create')}
          >
            {t('ui.create_mod')}
          </button>
          <button 
            className="action-button primary"
            onClick={() => handleActionSelect('edit')}
          >
            {t('ui.edit_mod')}
          </button>
        </div>
      ) : (
        <div className="home-actions">
          <div className="type-selection">
            <h2>
              {selectedAction === 'create' 
                ? t('ui.select_mod_type') 
                : t('ui.select_mod_type_edit')}
            </h2>
            <div className="type-buttons">
              <button 
                className="action-button"
                onClick={() => handleTypeSelect('public')}
              >
                {t('buttons.mod_type_public')}
              </button>
              <button 
                className="action-button"
                onClick={() => handleTypeSelect('local')}
              >
                {t('buttons.mod_type_local')}
              </button>
            </div>
            <button 
              className="action-button back"
              onClick={resetSelection}
            >
              ← {t('ui.back')}
            </button>
          </div>
        </div>
      )}

      <div className="home-footer">
        <a 
          href="https://github.com/y114git/DELTAHUB/wiki/Modder's-Guide" 
          target="_blank" 
          rel="noopener noreferrer"
          className="guide-link"
        >
          {t('ui.view_guide')}
        </a>
        <a 
          href="https://gamebanana.com/tools/20615" 
          target="_blank" 
          rel="noopener noreferrer"
          className="guide-link"
        >
          {t('ui.download_deltahub')}
        </a>
      </div>
    </div>
  );
}

