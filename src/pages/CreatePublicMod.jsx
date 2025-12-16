import { useNavigate } from 'react-router-dom';
import ModEditor from '../components/ModEditor/ModEditor';

export default function CreatePublicMod() {
  const navigate = useNavigate();

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
