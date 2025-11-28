import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { validateImageURL } from '../../utils/validation';
import './IconPreview.css';

export default function IconPreview({ url, file, isPublic, onError }) {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setImageSrc(null);
    setLoading(false);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
      };
      reader.onerror = () => {
        setError(t('errors.not_an_image'));
        if (onError) onError();
      };
      reader.readAsDataURL(file);
    } else if (url && url.trim()) {
      setLoading(true);
      validateImageURL(url).then((result) => {
        setLoading(false);
        if (result.valid) {
          setImageSrc(url);
        } else {
          if (result.error) {
          if (result.errorParams) {
            setError(t(result.error, result.errorParams));
          } else {
            setError(t(result.error));
          }
        } else {
          setError(t('errors.icon_invalid'));
        }
          if (onError) onError();
        }
      }).catch(() => {
        setLoading(false);
        setError(t('errors.url_error'));
        if (onError) onError();
      });
    }
  }, [url, file, t, onError]);

  return (
    <div className="icon-preview">
      {loading && <div className="icon-preview-loading">{t('status.loading')}</div>}
      {error && <div className="icon-preview-error">{error}</div>}
      {!loading && !error && !imageSrc && (
        <div className="icon-preview-placeholder">{t('ui.icon_preview')}</div>
      )}
      {imageSrc && !error && (
        <img src={imageSrc} alt="Icon preview" className="icon-preview-image" />
      )}
    </div>
  );
}

