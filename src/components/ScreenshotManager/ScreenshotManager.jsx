import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { validateImageURL } from '../../utils/validation';
import './ScreenshotManager.css';

export default function ScreenshotManager({ screenshots, onChange }) {
  const { t } = useTranslation();
  const [urls, setUrls] = useState(screenshots || []);
  const [errors, setErrors] = useState({});

  const updateUrl = async (index, url) => {
    const newUrls = [...urls];
    newUrls[index] = url;
    setUrls(newUrls);
    onChange(newUrls.filter(u => u && u.trim()));

    if (url && url.trim()) {
      const result = await validateImageURL(url);
      if (!result.valid) {
        setErrors(prev => ({ ...prev, [index]: result.error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const addScreenshot = () => {
    if (urls.length < 10) {
      setUrls([...urls, '']);
    }
  };

  const removeScreenshot = (index) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    onChange(newUrls.filter(u => u && u.trim()));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  return (
    <div className="screenshot-manager">
      <h3>{t('ui.screenshots_title')}</h3>
      {urls.map((url, index) => (
        <div key={index} className="screenshot-item">
          <input
            type="url"
            value={url}
            onChange={(e) => updateUrl(index, e.target.value)}
            placeholder={t('ui.screenshot_url_placeholder')}
          />
          {errors[index] && <div className="error">{t(errors[index])}</div>}
          {url && !errors[index] && (
            <img src={url} alt={`Screenshot ${index + 1}`} className="screenshot-preview" />
          )}
          <button onClick={() => removeScreenshot(index)}>{t('buttons.delete')}</button>
        </div>
      ))}
      {urls.length < 10 && (
        <button onClick={addScreenshot}>{t('ui.manage_screenshots')}</button>
      )}
    </div>
  );
}

