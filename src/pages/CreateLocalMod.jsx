import { useNavigate } from 'react-router-dom';
import ModEditor from '../components/ModEditor/ModEditor';

export default function CreateLocalMod() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <ModEditor
        isCreating={true}
        isPublic={false}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}

