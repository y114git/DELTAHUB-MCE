import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh_cn', name: '简体中文' },
  { code: 'zh_tw', name: '繁體中文' },
  { code: 'es', name: 'Español' }
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="language-selector">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

