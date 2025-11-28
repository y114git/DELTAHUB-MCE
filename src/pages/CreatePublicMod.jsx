import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModEditor from '../components/ModEditor/ModEditor';

export default function CreatePublicMod() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="container">
      <ModEditor
        isCreating={true}
        isPublic={true}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}

